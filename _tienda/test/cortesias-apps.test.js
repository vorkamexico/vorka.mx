// Cortesías de apps por suscripción (Clara, Cuentas, Vende, Vuelve, Agenda y el paquete Agenda + Vuelve): regalar desde
// Vorka OS (Tienda › Regalar) un plan de suscripción debe dar Pro en la app sin crear nada en Stripe. Las apps preguntan con
// suscripcionApp; portalApp, cancelarApp y lugaresApp responden sin romperse; el MRR no las cuenta como ingreso.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { Admin } from '../src/index.js';
import { crearCortesias, revocarCortesias, canjearRegalo } from '../src/regalos.js';
import { finCortesia, suscripcionApp, portalApp, cancelarApp, lugaresApp, resumenSuscripciones, vigente } from '../src/suscripciones.js';

let env, correos, llamadas;
const DIA = 864e5;
const regalar = (product_id, extra = {}) => crearCortesias(env, { product_id, modo: 'correo', cantidad: 1, nombre: 'Oleynick', email: 'ole@correo.mx', ...extra });
const fechar = (id, iso) => env.DB.raw.prepare('UPDATE orders SET paid_at = ? WHERE id = ?').run(iso, id);
const cerca = (iso, ms) => expect(Math.abs(Date.parse(iso) - ms)).toBeLessThan(3 * DIA);
const sub = (o = {}) => env.DB.raw.prepare(`INSERT INTO suscripciones (id, email, app, product_id, customer_id, estado, intervalo, periodo_fin, monto_centavos)
  VALUES (?,?,?,?,?,?,?,?,?)`).run(o.id || 'sub_1', o.email || 'ole@correo.mx', o.app || 'cuentas', o.product_id || 'prod_cuentas_mensual', o.customer_id ?? 'cus_1',
  o.estado || 'active', o.intervalo || 'month', o.periodo_fin || '2030-01-01T00:00:00.000Z', o.monto ?? 9900);

beforeEach(() => {
  correos = []; llamadas = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), STRIPE_SECRET_KEY: 'sk_test_x',
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => { llamadas.push(url); return new Response(JSON.stringify({ url: 'https://billing.stripe.com/p/x' })); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('finCortesia', () => {
  it('suma meses o años de calendario y ajusta el día al final del mes', () => {
    expect(finCortesia('2026-11-01T20:08:46.000Z', 'year')).toBe('2027-11-01T20:08:46.000Z');
    expect(finCortesia('2026-11-01T20:08:46.000Z', 'month')).toBe('2026-12-01T20:08:46.000Z');
    expect(finCortesia('2026-01-31T10:00:00.000Z', 'month')).toBe('2026-02-28T10:00:00.000Z');
    expect(finCortesia('2026-01-15T10:00:00.000Z', 'month', 3)).toBe('2026-04-15T10:00:00.000Z');
  });
});

describe('suscripcionApp con una cortesía', () => {
  it('anual (Cuentas): vigente por un año, sin cobro y marcada como cortesía', async () => {
    const r = await regalar('prod_cuentas_anual');
    const s = await new Admin({}, env).suscripcionApp('Ole@Correo.mx', 'cuentas');
    expect(s).toMatchObject({ estado: 'active', vigente: true, intervalo: 'year', cortesia: true, cancelar_al_final: true, monto_centavos: 0, sucursales: 0, profesionales: 0, paquete: null, order_id: r.id });
    cerca(s.periodo_fin, Date.now() + 365 * DIA);
    // Nada en Stripe
    expect(llamadas).toHaveLength(0);
    expect(await vigente(env, 'ole@correo.mx', 'cuentas')).toBeNull();
  });

  it('mensual (Clara): vigente por un mes; no abre otras apps', async () => {
    await regalar('prod_clara_mensual');
    const s = await suscripcionApp(env, 'ole@correo.mx', 'clara');
    expect(s).toMatchObject({ estado: 'active', vigente: true, intervalo: 'month', cortesia: true });
    cerca(s.periodo_fin, Date.now() + 30.5 * DIA);
    expect(await suscripcionApp(env, 'ole@correo.mx', 'cuentas')).toBeNull();
    expect(await suscripcionApp(env, 'otra@correo.mx', 'clara')).toBeNull();
  });

  it('la cantidad son periodos: 3 × mensual = 3 meses', async () => {
    await regalar('prod_vende_mensual', { cantidad: 3 });
    cerca((await suscripcionApp(env, 'ole@correo.mx', 'vende')).periodo_fin, Date.now() + 91 * DIA);
  });

  it('vencida: ya no es vigente (estado canceled)', async () => {
    const r = await regalar('prod_clara_mensual');
    fechar(r.id, new Date(Date.now() - 40 * DIA).toISOString());
    expect(await suscripcionApp(env, 'ole@correo.mx', 'clara')).toMatchObject({ estado: 'canceled', vigente: false, cortesia: true });
  });

  it('quitada desde el panel: el acceso termina en ese momento', async () => {
    const r = await regalar('prod_cuentas_anual');
    expect((await suscripcionApp(env, 'ole@correo.mx', 'cuentas')).vigente).toBe(true);
    await revocarCortesias(env, r.id);
    // Regresa como cortesía vencida (no null): la app que guardó cortesia_hasta la corta en ese momento
    const s = await suscripcionApp(env, 'ole@correo.mx', 'cuentas');
    expect(s).toMatchObject({ cortesia: true, vigente: false, estado: 'canceled' });
    expect(Date.parse(s.periodo_fin)).toBeLessThanOrEqual(Date.now());
  });

  it('una suscripción vigente de Stripe siempre gana', async () => {
    await regalar('prod_cuentas_anual');
    sub({ periodo_fin: '2026-12-15T00:00:00.000Z' });
    expect(await suscripcionApp(env, 'ole@correo.mx', 'cuentas')).toMatchObject({ id: 'sub_1', estado: 'active', vigente: true, monto_centavos: 9900 });
    expect((await suscripcionApp(env, 'ole@correo.mx', 'cuentas')).cortesia).toBeUndefined();
  });

  it('una suscripción de Stripe cancelada no tapa una cortesía vigente', async () => {
    sub({ estado: 'canceled' });
    await regalar('prod_cuentas_mensual');
    expect(await suscripcionApp(env, 'ole@correo.mx', 'cuentas')).toMatchObject({ vigente: true, cortesia: true });
  });

  it('el paquete Agenda + Vuelve cubre las dos apps', async () => {
    await regalar('prod_agenda_vuelve_anual');
    for (const app of ['agenda', 'vuelve']) expect(await suscripcionApp(env, 'ole@correo.mx', app)).toMatchObject({ vigente: true, cortesia: true, paquete: 'agenda-vuelve', intervalo: 'year' });
  });

  it('también cuenta el canje de una liga de cortesía', async () => {
    const r = await crearCortesias(env, { product_id: 'prod_clara_anual', cantidad: 1 });
    const token = r.ligas[0].split('/').pop();
    const res = await canjearRegalo(new Request('https://vorka.mx/api/regalo/canjear', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, nombre: 'Ana', email: 'ana@correo.mx', terminos: true }) }), env);
    expect(res.status).toBe(200);
    expect(await suscripcionApp(env, 'ana@correo.mx', 'clara')).toMatchObject({ vigente: true, cortesia: true, intervalo: 'year' });
  });

  it('el correo de la cortesía dice hasta cuándo y que no se cobra', async () => {
    await regalar('prod_cuentas_anual');
    expect(correos).toHaveLength(1);
    expect(correos[0].texto).toMatch(/cortesía de Vorka México: tu acceso está activo hasta el/);
    expect(correos[0].texto).not.toMatch(/se renueva sol|puedes cancelar/);
  });

  it('no se regalan complementos sueltos (sucursales, profesionales, sillas)', async () => {
    await expect(regalar('prod_vuelve_sucursal_mensual')).rejects.toThrow(/complemento/);
    await expect(regalar('prod_vende_silla_mensual')).rejects.toThrow(/complemento/);
  });
});

describe('portal, cancelar y complementos con una cortesía', () => {
  const VOLVER = 'https://clara.vorka.mx/ajustes';

  it('portalApp: mensaje claro, sin portal de Stripe', async () => {
    await regalar('prod_clara_anual');
    const p = await portalApp(env, 'ole@correo.mx', 'clara', VOLVER);
    expect(p).toMatchObject({ url: null, cortesia: true });
    expect(p.mensaje).toMatch(/^Tu acceso es una cortesía de Vorka hasta el .+; no hay nada que cancelar/);
    expect(llamadas).toHaveLength(0);
  });

  it('portalApp con Stripe vigente sigue abriendo el portal', async () => {
    await regalar('prod_cuentas_anual');
    sub();
    expect(await portalApp(env, 'ole@correo.mx', 'cuentas', 'https://cuentas.vorka.mx/ajustes')).toEqual({ url: 'https://billing.stripe.com/p/x' });
  });

  it('cancelarApp: no hay nada que cancelar, responde ok (para que borrar la cuenta no se trabe)', async () => {
    await regalar('prod_clara_mensual');
    const r = await cancelarApp(env, 'ole@correo.mx', 'clara');
    expect(r).toMatchObject({ ok: true, cortesia: true });
    expect(r.hasta).toBeTruthy();
    expect(llamadas).toHaveLength(0);
    expect(await cancelarApp(env, 'nadie@correo.mx', 'clara')).toEqual({ ok: false, motivo: 'sin_suscripcion' });
  });

  it('lugaresApp: 0 no cambia nada; agregar pide contratar la suscripción', async () => {
    await regalar('prod_vuelve_mensual');
    expect(await lugaresApp(env, 'ole@correo.mx', 'vuelve', 0)).toMatchObject({ cortesia: true, vigente: true });
    await expect(lugaresApp(env, 'ole@correo.mx', 'vuelve', 2)).rejects.toThrow(/cortesía de Vorka.*lugares adicionales.*suscripción/);
    expect(llamadas).toHaveLength(0);
  });
});

describe('resumenSuscripciones', () => {
  it('las cortesías no cuentan en el MRR ni como vigentes: van aparte', async () => {
    sub({ id: 'sub_a', email: 'paga@correo.mx', monto: 9900 });
    await regalar('prod_cuentas_anual');
    await regalar('prod_cuentas_mensual', { email: 'paga@correo.mx' }); // ya paga: no se cuenta como cortesía
    const r = await resumenSuscripciones(env, 'cuentas');
    expect(r).toMatchObject({ vigentes: 1, mrr_centavos: 9900, cortesias: 1, estados: { active: 1 } });
  });
});

describe('Vende: cortesía con vendedoras incluidas (sillas)', () => {
  it('guarda las sillas como renglón del complemento del plan y cortesiaApp las devuelve', async () => {
    const r = await regalar('prod_vende_mensual', { cantidad: 2, sillas: 5 });
    expect(r).toMatchObject({ directo: true, sillas: 5 });
    const items = env.DB.raw.prepare('SELECT product_id, cantidad, precio_centavos FROM order_items WHERE order_id = ? ORDER BY id').all(r.id);
    expect(items).toEqual([{ product_id: 'prod_vende_mensual', cantidad: 2, precio_centavos: 0 }, { product_id: 'prod_vende_silla_mensual', cantidad: 5, precio_centavos: 0 }]);
    const s = await suscripcionApp(env, 'ole@correo.mx', 'vende');
    expect(s).toMatchObject({ cortesia: true, vigente: true, sillas: 5, sucursales: 0 });
    // La duración la da el plan (2 meses), no las sillas
    cerca(s.periodo_fin, Date.now() + 61 * DIA);
    // El correo lo dice; el panel muestra una sola fila con sus sillas
    expect(correos.at(-1).texto).toMatch(/Incluye 5 vendedoras en tu red/);
    const lista = await new Admin({}, env).cortesias();
    expect(lista.filter(t => t.id === r.id)).toHaveLength(1);
    expect(lista.find(t => t.id === r.id)).toMatchObject({ sillas: 5, cantidad: 2, directo: true });
    // Nada en Stripe y no es venta
    expect(llamadas).toHaveLength(0);
    expect(await resumenSuscripciones(env, 'vende')).toMatchObject({ mrr_centavos: 0, cortesias: 1 });
  });

  it('el plan anual usa la silla anual; sin sillas no hay renglón extra', async () => {
    const r = await regalar('prod_vende_anual', { sillas: 1 });
    expect(env.DB.raw.prepare("SELECT product_id FROM order_items WHERE order_id = ? AND product_id <> 'prod_vende_anual'").all(r.id)).toEqual([{ product_id: 'prod_vende_silla_anual' }]);
    const r2 = await regalar('prod_vende_mensual', { email: 'otra@correo.mx', sillas: 0 });
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM order_items WHERE order_id = ?').get(r2.id).n).toBe(1);
    expect((await suscripcionApp(env, 'otra@correo.mx', 'vende')).sillas).toBe(0);
  });

  it('solo con un plan de Vende, directo a un correo y de 0 a 50', async () => {
    await expect(regalar('prod_vuelve_mensual', { sillas: 2 })).rejects.toThrow(/solo van con un plan de Vende/);
    await expect(crearCortesias(env, { product_id: 'prod_vende_mensual', cantidad: 1, sillas: 2 })).rejects.toThrow(/directo a un correo/);
    await expect(regalar('prod_vende_mensual', { sillas: 51 })).rejects.toThrow(/0 a 50/);
    await expect(regalar('prod_vende_mensual', { sillas: -1 })).rejects.toThrow(/0 a 50/);
  });

  it('lugaresApp: dentro de las sillas de la cortesía no cambia nada; más allá pide contratar Vende Pro', async () => {
    await regalar('prod_vende_mensual', { sillas: 3 });
    expect(await lugaresApp(env, 'ole@correo.mx', 'vende', 0)).toMatchObject({ cortesia: true, sillas: 3 });
    expect(await lugaresApp(env, 'ole@correo.mx', 'vende', 3)).toMatchObject({ cortesia: true, sillas: 3 });
    await expect(lugaresApp(env, 'ole@correo.mx', 'vende', 4)).rejects.toThrow('Tu cortesía incluye 3 vendedoras; para sumar más, contrata Vende Pro.');
    expect(llamadas).toHaveLength(0);
  });

  it('quitada: las sillas terminan con la cortesía (vencida, la app las apaga)', async () => {
    const r = await regalar('prod_vende_mensual', { sillas: 4 });
    await revocarCortesias(env, r.id);
    const s = await suscripcionApp(env, 'ole@correo.mx', 'vende');
    expect(s).toMatchObject({ cortesia: true, vigente: false });
    expect(Date.parse(s.periodo_fin)).toBeLessThanOrEqual(Date.now());
  });
});

describe('creditoApp con solo una cortesía: +1 mes de cortesía', () => {
  const credito = (clave = 'vuelve-recomendacion-7', email = 'ole@correo.mx') =>
    new Admin({}, env).creditoApp(email, 'vuelve', 39900, 'Mes gratis: Café Luna se suscribió a Vuelve por tu recomendación', clave);

  it('suma 1 mes desde el fin de la cortesía actual, sin Stripe y sin contar como venta', async () => {
    await regalar('prod_vuelve_mensual');
    const antes = await suscripcionApp(env, 'ole@correo.mx', 'vuelve');
    const r = await credito();
    expect(r).toMatchObject({ ok: true, cortesia: true });
    expect(r.hasta).toBe(finCortesia(antes.periodo_fin, 'month', 1));
    const s = await suscripcionApp(env, 'ole@correo.mx', 'vuelve');
    expect(s).toMatchObject({ cortesia: true, vigente: true, periodo_fin: r.hasta, order_id: r.order_id });
    const o = env.DB.raw.prepare('SELECT * FROM orders WHERE id = ?').get(r.order_id);
    expect(o).toMatchObject({ proveedor: 'cortesia', regalo: 0, monto_centavos: 0, estado: 'paid', paid_at: antes.periodo_fin });
    expect(o.metodo_pago).toMatch(/^cortesía: Mes por recomendación/);
    expect(llamadas).toHaveLength(0);
    expect(await resumenSuscripciones(env, 'vuelve')).toMatchObject({ mrr_centavos: 0, vigentes: 0, cortesias: 1 });
    // Ventas del panel: ni este mes ni el del mes extra la cuentan
    const { resumen } = await import('../src/admin.js');
    for (const mes of [new Date().toISOString().slice(0, 7), r.hasta.slice(0, 7), antes.periodo_fin.slice(0, 7)])
      expect(await resumen(env, { mes })).toMatchObject({ ventas: 0, monto_centavos: 0 });
  });

  it('una cortesía anual también suma 1 mes (no un año)', async () => {
    await regalar('prod_vuelve_anual');
    const antes = await suscripcionApp(env, 'ole@correo.mx', 'vuelve');
    const r = await credito();
    expect(r.hasta).toBe(finCortesia(antes.periodo_fin, 'month', 1));
    expect((await suscripcionApp(env, 'ole@correo.mx', 'vuelve')).periodo_fin).toBe(r.hasta);
  });

  it('el mismo premio nunca dos veces; otro premio suma otro mes', async () => {
    await regalar('prod_vuelve_mensual');
    const a = await credito();
    const b = await credito();
    expect(b).toMatchObject({ ok: true, cortesia: true, ya: true, hasta: a.hasta, order_id: a.order_id });
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM orders WHERE proveedor = 'cortesia'").get().n).toBe(2);
    const c = await credito('vuelve-recomendacion-8');
    expect(c.hasta).toBe(finCortesia(a.hasta, 'month', 1));
    expect((await suscripcionApp(env, 'ole@correo.mx', 'vuelve')).periodo_fin).toBe(c.hasta);
  });

  it('Vende: el mes extra conserva las vendedoras incluidas', async () => {
    await regalar('prod_vende_mensual', { sillas: 2 });
    const r = await new Admin({}, env).creditoApp('ole@correo.mx', 'vende', 9900, 'Mes por invitar', 'vende-x');
    expect(r.ok).toBe(true);
    expect(await suscripcionApp(env, 'ole@correo.mx', 'vende')).toMatchObject({ periodo_fin: r.hasta, sillas: 2 });
  });

  it('sin cortesía ni suscripción: sin_suscripcion; con cortesía vencida tampoco suma', async () => {
    expect(await credito()).toEqual({ ok: false, motivo: 'sin_suscripcion' });
    const r = await regalar('prod_vuelve_mensual');
    fechar(r.id, new Date(Date.now() - 40 * DIA).toISOString());
    expect(await credito()).toEqual({ ok: false, motivo: 'sin_suscripcion' });
  });

  it('con Stripe vigente sigue siendo saldo a favor (con llave de idempotencia)', async () => {
    await regalar('prod_vuelve_mensual');
    sub({ app: 'vuelve', product_id: 'prod_vuelve_mensual' });
    const heads = [];
    fetch.mockImplementation(async (url, init = {}) => { llamadas.push(url); heads.push(init.headers); return new Response('{}'); });
    expect(await credito()).toEqual({ ok: true });
    expect(llamadas[0]).toMatch(/\/customers\/cus_1\/balance_transactions$/);
    expect(heads[0]['idempotency-key']).toBe('credito-vuelve-vuelve-recomendacion-7');
  });
});
