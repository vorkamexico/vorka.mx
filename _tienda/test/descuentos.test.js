// Códigos de descuento (FUNDADOR30) y 5 % por recomendación (migración 0045, src/descuentos.js):
// checkout, cupones de Stripe, vista previa del campo «código», usos al pagar, tope por app y puntos de quien recomendó.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, codigoDe } from '../src/puntos.js';
import { resolverDescuento, evaluarCodigo, duracionDe, centavosDescuento, CLIENTE_DESCUENTO } from '../src/descuentos.js';
import { COBRO_MINIMO } from '../src/puntos-reglas.js';
import vm from 'node:vm';

const SITIO = 'https://vorka.mx';
let env, llamadas, cupones, cuponFalla, ip;

function stripeFalso() {
  llamadas = []; cupones = new Map(); cuponFalla = 0;
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const params = new URLSearchParams(init.body);
    llamadas.push({ url, init, params });
    const ok = b => new Response(JSON.stringify(b));
    const ruta = url.replace('https://api.stripe.com/v1', '');
    if (ruta === '/customers') return ok({ id: 'cus_1' });
    if (ruta.startsWith('/coupons')) {
      if (cuponFalla) return new Response(JSON.stringify({ error: { message: 'The provided key does not have the required permissions' } }), { status: cuponFalla });
      if (init.method === 'GET') {
        const c = cupones.get(decodeURIComponent(ruta.slice('/coupons/'.length)));
        return c ? ok(c) : new Response(JSON.stringify({ error: { code: 'resource_missing', message: 'No such coupon' } }), { status: 404 });
      }
      const id = params.get('id') || `cupon_${cupones.size + 1}`;
      if (cupones.has(id)) return new Response(JSON.stringify({ error: { code: 'resource_already_exists', message: 'Coupon already exists.' } }), { status: 400 });
      const c = { id, valid: true, percent_off: params.get('percent_off') ? Number(params.get('percent_off')) : null, amount_off: params.get('amount_off') ? Number(params.get('amount_off')) : null,
        duration: params.get('duration'), duration_in_months: params.get('duration_in_months') ? Number(params.get('duration_in_months')) : null, name: params.get('name') };
      cupones.set(id, c);
      return ok(c);
    }
    if (ruta === '/checkout/sessions') return ok({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/cs_x' });
    return new Response('{}', { status: 404 });
  }));
}
const llamada = ruta => llamadas.filter(l => l.url === `https://api.stripe.com/v1${ruta}`);
const sesion = () => llamada('/checkout/sessions').at(-1).params;
const posts = () => llamadas.filter(l => l.url.startsWith('https://api.stripe.com/v1/coupons') && l.init.method === 'POST');

const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': `10.0.0.${++ip}`, ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined }), env);
let n = 0;
const comprar = (extra = {}, op = {}) => pedir('/api/checkout', { method: 'POST', op, ...op,
  body: { nombre: 'Laura Pérez', email: `cliente${++n}@cafe.mx`, terminos: true, slug: 'vuelve-mensual', ...extra } });
const ultima = () => env.DB.raw.prepare('SELECT * FROM orders ORDER BY rowid DESC LIMIT 1').get();
const precio = slug => env.DB.raw.prepare('SELECT precio_centavos FROM products WHERE slug = ?').get(slug).precio_centavos;
const codigo = () => env.DB.raw.prepare("SELECT * FROM codigos_descuento WHERE codigo = 'FUNDADOR30'").get();
const usosApp = app => env.DB.raw.prepare("SELECT usos FROM codigos_descuento_usos WHERE codigo = 'FUNDADOR30' AND app = ?").get(app)?.usos || 0;
const pagar = (o, monto = o.monto_centavos) => aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: monto, moneda: 'MXN', provider_payment_id: `pi_${o.id}` });

beforeEach(() => {
  ip = 0;
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, email, comision_pct, tipo) VALUES ('ANA', 'Ana López', 'ana@vorka.mx', 0, 'puntos');");
  stripeFalso();
});
afterEach(() => vi.unstubAllGlobals());

describe('migración 0045', () => {
  it('siembra FUNDADOR30: 30 %, 3 meses, solo mensual, activo, sin fecha fin y 10 lugares por app', () => {
    expect(codigo()).toMatchObject({ codigo: 'FUNDADOR30', pct: 30, meses: 3, solo_mensual: 1, activo: 1, hasta: null, max_usos: null, max_por_app: 10, usos: 0 });
  });
});

describe('FUNDADOR30', () => {
  it('en un mensual: cupón de Stripe por 30 % repetido 3 meses, en discounts y sin allow_promotion_codes', async () => {
    const r = await comprar({ codigo: 'fundador30' });
    expect(r.status).toBe(200);
    expect((await r.json()).descuento).toBe('FUNDADOR30: 30 % los primeros 3 meses');
    const p = sesion();
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('discounts[0][coupon]')).toBe('vorka_FUNDADOR30');
    expect(p.has('allow_promotion_codes')).toBe(false);
    const [c] = posts();
    expect(c.params.get('id')).toBe('vorka_FUNDADOR30');
    expect(c.params.get('percent_off')).toBe('30');
    expect(c.params.get('duration')).toBe('repeating');
    expect(c.params.get('duration_in_months')).toBe('3');
    expect(ultima()).toMatchObject({ descuento_codigo: 'FUNDADOR30', descuento_pct: 30, descuento_duracion: 'repeating', descuento_meses: 3, descuento_app: 'vuelve',
      descuento_codigo_centavos: Math.round(precio('vuelve-mensual') * 0.3), monto_centavos: precio('vuelve-mensual') - Math.round(precio('vuelve-mensual') * 0.3) });
    // La segunda compra reutiliza el cupón (no crea otro)
    await comprar({ codigo: 'FUNDADOR30' });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_FUNDADOR30');
    expect(posts()).toHaveLength(1);
    // Al abrir el pago no cuenta como uso
    expect(codigo().usos).toBe(0);
  });

  it('en Agenda, Agenda + Vuelve, Vende Pro y Cuentas mensuales también aplica', async () => {
    for (const [slug, app] of [['agenda-mensual', 'agenda'], ['agenda-vuelve-mensual', 'agenda'], ['vende-mensual', 'vende'], ['cuentas-mensual', 'cuentas']]) {
      expect((await comprar({ slug, codigo: 'FUNDADOR30' })).status).toBe(200);
      expect(ultima()).toMatchObject({ descuento_codigo: 'FUNDADOR30', descuento_app: app });
      expect(sesion().get('discounts[0][coupon]')).toBe('vorka_FUNDADOR30');
    }
  });

  it('en un anual o un pago único no aplica: mensaje claro y la compra sigue sin descuento', async () => {
    const r = await comprar({ slug: 'vuelve-anual', codigo: 'FUNDADOR30' });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.aviso).toBe('FUNDADOR30 solo aplica en planes mensuales (Vuelve, Agenda, Agenda + Vuelve, Vende Pro y Cuentas), no en el anual.');
    expect(j.descuento).toBeNull();
    expect(sesion().has('discounts[0][coupon]')).toBe(false);
    expect(ultima()).toMatchObject({ monto_centavos: precio('vuelve-anual'), descuento_centavos: 0, descuento_codigo: null });

    const u = await (await comprar({ slug: 'de-idea-a-proyecto', codigo: 'FUNDADOR30' })).json();
    expect(u.aviso).toBe('FUNDADOR30 solo aplica en planes mensuales (Vuelve, Agenda, Agenda + Vuelve, Vende Pro y Cuentas).');
    expect(ultima()).toMatchObject({ monto_centavos: precio('de-idea-a-proyecto'), descuento_centavos: 0 });
    expect(posts()).toHaveLength(0);
  });

  it('inactivo, vencido, todavía no vigente o con el tope total: no aplica', async () => {
    const prueba = async (sql, aviso) => {
      env.DB.raw.exec("UPDATE codigos_descuento SET activo = 1, desde = NULL, hasta = NULL, max_usos = NULL, usos = 0 WHERE codigo = 'FUNDADOR30'; " + sql);
      const j = await (await comprar({ codigo: 'FUNDADOR30' })).json();
      expect(j.aviso).toBe(aviso);
      expect(ultima()).toMatchObject({ monto_centavos: precio('vuelve-mensual'), descuento_codigo: null });
    };
    await prueba("UPDATE codigos_descuento SET activo = 0", 'El código FUNDADOR30 ya no está vigente.');
    await prueba("UPDATE codigos_descuento SET hasta = '2020-01-31'", 'El código FUNDADOR30 ya no está vigente.');
    await prueba("UPDATE codigos_descuento SET desde = '2999-01-01'", 'El código FUNDADOR30 todavía no está vigente.');
    await prueba("UPDATE codigos_descuento SET max_usos = 3, usos = 3", 'El código FUNDADOR30 ya no está vigente.');
    // hasta = AAAA-MM-DD cuenta el día completo en hora del centro de México
    env.DB.raw.exec("UPDATE codigos_descuento SET activo = 1, desde = NULL, max_usos = NULL, hasta = '2026-10-27'");
    const sus = { intervalo: 'month', app: 'vuelve' };
    expect((await evaluarCodigo(env, 'FUNDADOR30', { sus, ahora: '2026-10-28T05:59:00.000Z' })).valido).toBe(true);
    expect((await evaluarCodigo(env, 'FUNDADOR30', { sus, ahora: '2026-10-28T06:00:00.000Z' })).valido).toBe(false);
  });

  it('usos sube al pagarse la orden (una sola vez), no al abrir el pago, y cuenta por app', async () => {
    await comprar({ codigo: 'FUNDADOR30' });
    const o = ultima();
    expect(codigo().usos).toBe(0);
    await pagar(o);
    expect(codigo().usos).toBe(1);
    expect(usosApp('vuelve')).toBe(1);
    await pagar(o);   // webhook repetido
    expect(codigo().usos).toBe(1);
    // Un reembolso no libera el lugar
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    expect(codigo().usos).toBe(1);
    expect(usosApp('vuelve')).toBe(1);
  });

  it('tope por app: 10 en Vuelve; el 11.º recibe un mensaje claro y sigue sin descuento (o con el 5 % si trae referido)', async () => {
    const sus = { intervalo: 'month', app: 'vuelve' };
    for (let i = 0; i < 10; i++) {
      const { descuento } = await resolverDescuento(env, { escrito: 'FUNDADOR30', email: `n${i}@cafe.mx`, sus });
      const o = await crearOrden(env, { items: [{ slug: 'vuelve-mensual' }], email: `n${i}@cafe.mx`, nombre: 'Negocio', descuento: { ...descuento, duracion: duracionDe(descuento) } });
      await pagar(o);
    }
    expect(usosApp('vuelve')).toBe(10);
    expect(codigo().usos).toBe(10);
    const j = await (await comprar({ codigo: 'FUNDADOR30' })).json();
    expect(j.aviso).toBe('Los 10 lugares de fundador de Vuelve ya se ocuparon.');
    expect(ultima()).toMatchObject({ descuento_codigo: null, monto_centavos: precio('vuelve-mensual') });
    // Con la liga de quien lo recomendó: 5 %
    const k = await (await comprar({ codigo: 'FUNDADOR30' }, { cookie: 'vorka_ref=ANA' })).json();
    expect(k.aviso).toBe('Los 10 lugares de fundador de Vuelve ya se ocuparon.');
    expect(k.descuento).toBe('5 % en tu primer pago por recomendación');
    expect(ultima()).toMatchObject({ descuento_codigo: 'REFERIDO', ref_code: 'ANA' });
    // Las demás apps tienen sus propios 10 lugares
    for (const slug of ['agenda-mensual', 'agenda-vuelve-mensual', 'vende-mensual', 'cuentas-mensual']) {
      await comprar({ slug, codigo: 'FUNDADOR30' });
      expect(ultima().descuento_codigo).toBe('FUNDADOR30');
    }
    // La vista previa del formulario tampoco lo ofrece
    const v = await (await pedir('/api/puntos/liga?c=FUNDADOR30&slug=vuelve-mensual')).json();
    expect(v).toMatchObject({ valido: false, aviso: 'Los 10 lugares de fundador de Vuelve ya se ocuparon.', texto: null });
  });
});

describe('FUNDADOR30 en Agenda y el paquete Agenda + Vuelve', () => {
  it('el paquete cuenta dentro de los 10 lugares de Agenda: tras 10 pagos entre los dos, ninguno lo acepta, pero Vuelve sí', async () => {
    for (let i = 0; i < 10; i++) {
      const [slug, app] = i % 2 ? ['agenda-vuelve-mensual', 'agenda-vuelve'] : ['agenda-mensual', 'agenda'];
      const { descuento } = await resolverDescuento(env, { escrito: 'FUNDADOR30', email: `a${i}@cafe.mx`, sus: { intervalo: 'month', app } });
      expect(descuento).toMatchObject({ codigo: 'FUNDADOR30', app: 'agenda' });
      const o = await crearOrden(env, { items: [{ slug }], email: `a${i}@cafe.mx`, nombre: 'Negocio', descuento: { ...descuento, duracion: duracionDe(descuento) } });
      expect(o.descuento_app).toBe('agenda');
      await pagar(o);
    }
    expect(usosApp('agenda')).toBe(10);
    expect(usosApp('agenda-vuelve')).toBe(0);
    expect(usosApp('vuelve')).toBe(0);
    for (const slug of ['agenda-mensual', 'agenda-vuelve-mensual']) {
      const j = await (await comprar({ slug, codigo: 'FUNDADOR30' })).json();
      expect(j.aviso).toBe('Los 10 lugares de fundador de Agenda ya se ocuparon.');
      expect(ultima()).toMatchObject({ descuento_codigo: null, monto_centavos: precio(slug) });
    }
    await comprar({ slug: 'vuelve-mensual', codigo: 'FUNDADOR30' });
    expect(ultima()).toMatchObject({ descuento_codigo: 'FUNDADOR30', descuento_app: 'vuelve' });
  });
});

describe('5 % por recomendación', () => {
  it('por código escrito en un pago único: un solo cupón por monto y quien recomendó queda en la orden', async () => {
    const r = await comprar({ slug: 'de-idea-a-proyecto', codigo: 'ana' });
    expect((await r.json()).descuento).toBe('5 % de descuento por recomendación');
    const p = precio('de-idea-a-proyecto'), desc = Math.round(p * 0.05);
    expect(ultima()).toMatchObject({ ref_code: 'ANA', descuento_codigo: 'REFERIDO', descuento_pct: 5, descuento_duracion: null, descuento_centavos: desc, descuento_codigo_centavos: desc, monto_centavos: p - desc });
    const [c] = posts();
    expect(c.params.get('amount_off')).toBe(String(desc));
    expect(c.params.get('duration')).toBe('once');
    expect(c.params.get('max_redemptions')).toBe('1');
    expect(c.params.get('name')).toBe('Recomendación 5 %');
    expect(sesion().get('discounts[0][coupon]')).toBe(c.params.get('id') || 'cupon_1');
  });

  it('por la liga (?ref= en el formulario o la cookie vorka_ref) también', async () => {
    await comprar({ slug: 'de-idea-a-proyecto', ref: 'ANA' });
    expect(ultima()).toMatchObject({ ref_code: 'ANA', descuento_codigo: 'REFERIDO', descuento_codigo_centavos: Math.round(precio('de-idea-a-proyecto') * 0.05) });
    await comprar({ slug: 'de-idea-a-proyecto' }, { cookie: 'otra=1; vorka_ref=ANA' });
    expect(ultima()).toMatchObject({ ref_code: 'ANA', descuento_codigo: 'REFERIDO' });
  });

  it('en una suscripción: cupón vorka_ref5 por 5 % solo en el primer pago, reutilizado', async () => {
    await comprar({}, { cookie: 'vorka_ref=ANA' });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_ref5');
    expect(sesion().has('allow_promotion_codes')).toBe(false);
    const [c] = posts();
    expect(c.params.get('percent_off')).toBe('5');
    expect(c.params.get('duration')).toBe('once');
    expect(c.params.has('duration_in_months')).toBe(false);
    expect(ultima()).toMatchObject({ descuento_codigo: 'REFERIDO', descuento_duracion: 'once', descuento_meses: null });
    await comprar({ codigo: 'ANA', slug: 'vuelve-anual' });   // en el anual también: 5 % del primer año
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_ref5');
    expect(posts()).toHaveLength(1);
  });

  it('comprarse con su propio código no da el 5 % (ni puntos)', async () => {
    await pedir('/api/checkout', { method: 'POST', body: { nombre: 'Ana López', email: 'ana@vorka.mx', terminos: true, slug: 'de-idea-a-proyecto', codigo: 'ANA' } });
    expect(ultima()).toMatchObject({ descuento_centavos: 0, descuento_codigo: null });
  });

  it('5 % más puntos en un pago único: un solo cupón por el total y siempre queda el cobro mínimo', async () => {
    const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email: 'beto@mail.com', nombre: 'Beto', terminos: true } })).json();
    const cookie = (await pedir(r.enlace)).headers.get('set-cookie').split(';')[0];
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('beto@mail.com', 'bono', 50, 'prueba')");
    const res = await pedir('/api/checkout', { method: 'POST', cookie: `${cookie}; vorka_ref=ANA`,
      body: { nombre: 'Beto Ruiz', email: 'beto@mail.com', terminos: true, slug: 'de-idea-a-proyecto', usar_puntos: true } });
    expect(res.status).toBe(200);
    const p = precio('de-idea-a-proyecto'), cinco = Math.round(p * 0.05);
    expect(ultima()).toMatchObject({ ref_code: 'ANA', descuento_codigo: 'REFERIDO', puntos_usados: 50, descuento_codigo_centavos: cinco, descuento_centavos: cinco + 5000, monto_centavos: p - cinco - 5000 });
    const cs = posts();
    expect(cs).toHaveLength(1);
    expect(cs[0].params.get('amount_off')).toBe(String(cinco + 5000));
    expect(cs[0].params.get('name')).toBe('Recomendación 5 % + Puntos Vorka');

    // Con muchos puntos: el 5 % primero y los puntos hasta dejar el cobro mínimo de $10
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('beto@mail.com', 'bono', 100000, 'prueba')");
    await pedir('/api/checkout', { method: 'POST', cookie: `${cookie}; vorka_ref=ANA`,
      body: { nombre: 'Beto Ruiz', email: 'beto@mail.com', terminos: true, slug: 'de-idea-a-proyecto', usar_puntos: true } });
    const o = ultima();
    expect(o.descuento_codigo_centavos).toBe(cinco);
    expect(o.monto_centavos).toBeGreaterThanOrEqual(1000);
    expect(o.monto_centavos).toBeLessThan(1100);
    expect(o.descuento_centavos).toBe(p - o.monto_centavos);
  });

  it('no se acumula con FUNDADOR30: gana el 30 % y quien recomendó sigue contando para sus puntos', async () => {
    const r = await (await comprar({ codigo: 'FUNDADOR30' }, { cookie: 'vorka_ref=ANA' })).json();
    expect(r.descuento).toBe('FUNDADOR30: 30 % los primeros 3 meses');
    expect(ultima()).toMatchObject({ descuento_codigo: 'FUNDADOR30', descuento_pct: 30, ref_code: 'ANA' });
    expect(sesion().getAll('discounts[0][coupon]')).toEqual(['vorka_FUNDADOR30']);
    expect(sesion().has('discounts[1][coupon]')).toBe(false);
    // Vista previa: dice que no se acumulan
    const v = await (await pedir('/api/puntos/liga?c=FUNDADOR30&slug=vuelve-mensual', { cookie: 'vorka_ref=ANA' })).json();
    expect(v).toMatchObject({ valido: true, tipo: 'codigo', texto: 'FUNDADOR30: 30 % los primeros 3 meses (no se acumula con el 5 % por recomendación)' });
  });

  it('la comisión (puntos) de quien recomendó se calcula sobre lo efectivamente cobrado', async () => {
    const code = await codigoDe(env, 'rosa@mail.com', 'Rosa');
    // Pago único con 5 %
    await comprar({ slug: 'de-idea-a-proyecto', codigo: code });
    const o = ultima();
    await pagar(o);
    await puntosAlPagar(env, o.id);
    const g = env.DB.raw.prepare("SELECT * FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'").get(o.id);
    expect(g.base_centavos).toBe(o.monto_centavos);
    expect(g.base_centavos).toBe(precio('de-idea-a-proyecto') - Math.round(precio('de-idea-a-proyecto') * 0.05));
    expect(g.puntos).toBe(Math.round(o.monto_centavos / 100 * g.pct / 100));
    // Suscripción con FUNDADOR30 y la liga: los puntos van sobre el 70 % cobrado
    await comprar({ codigo: 'FUNDADOR30' }, { cookie: `vorka_ref=${code}` });
    const s = ultima();
    await pagar(s);
    await puntosAlPagar(env, s.id);
    expect(env.DB.raw.prepare("SELECT base_centavos FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'").get(s.id).base_centavos)
      .toBe(precio('vuelve-mensual') - Math.round(precio('vuelve-mensual') * 0.3));
  });
});

describe('Stripe y montos', () => {
  it('suscripción con cupón por %: acepta unos centavos de redondeo de Stripe y la orden queda con lo cobrado', async () => {
    await comprar({ codigo: 'FUNDADOR30', sucursales: 1 });
    const o = ultima();
    const r = await pagar(o, o.monto_centavos + 1);
    expect(r.cambia).toBe(true);
    const x = ultima();
    expect(x).toMatchObject({ estado: 'paid', monto_centavos: o.monto_centavos + 1, descuento_centavos: o.descuento_centavos - 1, descuento_codigo_centavos: o.descuento_codigo_centavos - 1 });
    // Más que eso no cuadra: queda para revisión
    await comprar({ codigo: 'FUNDADOR30' });
    const y = ultima();
    expect((await pagar(y, y.monto_centavos + 100)).motivo).toBe('monto_no_coincide');
    // En pagos únicos el cupón es por monto exacto: sin tolerancia
    await comprar({ slug: 'de-idea-a-proyecto', codigo: 'ANA' });
    const z = ultima();
    expect((await pagar(z, z.monto_centavos + 1)).motivo).toBe('monto_no_coincide');
  });

  it('el CSV del contador y el reporte de ventas cuadran con lo cobrado neto', async () => {
    await comprar({ codigo: 'FUNDADOR30', sucursales: 1 });
    const s = ultima();
    await pagar(s, s.monto_centavos - 1);   // Stripe redondeó un centavo
    await comprar({ slug: 'de-idea-a-proyecto', codigo: 'ANA' });
    const u = ultima();
    await pagar(u);
    const hoy = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
    const A = new Admin({}, env);
    const filas = (await A.exportarCSV({ desde: hoy, hasta: hoy })).replace('\uFEFF', '').trim().split('\r\n').slice(1);
    const montos = Object.fromEntries(filas.map(f => [f.split(',')[1], f.split(',')[5]]));
    expect(montos[s.id]).toBe(((s.monto_centavos - 1) / 100).toFixed(2));
    expect(montos[u.id]).toBe((u.monto_centavos / 100).toFixed(2));
    const total = env.DB.raw.prepare("SELECT SUM(monto_centavos) t, SUM(descuento_centavos) d FROM orders WHERE estado = 'paid'").get();
    expect(total.t).toBe(s.monto_centavos - 1 + u.monto_centavos);
    expect(total.t + total.d).toBe(precio('vuelve-mensual') + precio('vuelve-sucursal-mensual') + precio('de-idea-a-proyecto'));
  });

  it('si el cupón fijo existe en Stripe con otros datos, usa uno con el % y los meses en el id', async () => {
    cupones.set('vorka_FUNDADOR30', { id: 'vorka_FUNDADOR30', valid: true, percent_off: 20, duration: 'repeating', duration_in_months: 3 });
    await comprar({ codigo: 'FUNDADOR30' });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_FUNDADOR30_30p_repeating3');
  });

  it('sin permiso de Coupons en la llave: mensaje claro, la orden no queda colgada', async () => {
    cuponFalla = 403;
    const r = await comprar({ codigo: 'FUNDADOR30' });
    expect(r.status).toBe(503);
    expect((await r.json()).error).toContain('No pudimos aplicar el descuento');
    expect(ultima().estado).toBe('failed');
    expect(llamada('/checkout/sessions')).toHaveLength(0);
  });
});

describe('vista previa del campo «código» (/api/puntos/liga)', () => {
  it('dice qué descuento se aplica y por qué, según el plan elegido', async () => {
    const v = async q => (await pedir(`/api/puntos/liga?${q}`)).json();
    expect(await v('c=fundador30&slug=vuelve-mensual')).toMatchObject({ valido: true, codigo: 'FUNDADOR30', tipo: 'codigo', texto: 'FUNDADOR30: 30 % los primeros 3 meses', aviso: null });
    expect(await v('c=FUNDADOR30&slug=vuelve-anual')).toMatchObject({ valido: false, texto: null, aviso: expect.stringContaining('solo aplica en planes mensuales') });
    expect(await v('c=FUNDADOR30&slug=de-idea-a-proyecto')).toMatchObject({ valido: false, aviso: expect.stringContaining('solo aplica en planes mensuales') });
    expect(await v('c=ana&slug=de-idea-a-proyecto')).toMatchObject({ valido: true, codigo: 'ANA', tipo: 'referido', texto: '5 % de descuento por recomendación' });
    expect(await v('c=ANA&slug=vuelve-mensual')).toMatchObject({ texto: '5 % en tu primer pago por recomendación' });
    expect(await v('c=NOEXISTE')).toEqual({ valido: false });
    // Nunca dice quién recomendó
    expect(JSON.stringify(await v('c=ANA'))).not.toMatch(/Ana|vorka\.mx/);
    // Anual con la liga: FUNDADOR30 no aplica, pero sí el 5 %
    const x = await (await pedir('/api/puntos/liga?c=FUNDADOR30&slug=vuelve-anual', { cookie: 'vorka_ref=ANA' })).json();
    expect(x).toMatchObject({ valido: false, texto: '5 % en tu primer pago por recomendación', aviso: expect.stringContaining('solo aplica en planes mensuales') });
  });
});

// El «Pagas hoy … y luego …» de la página: el ayudante del navegador (window.VD) con el descuento que da /api/puntos/liga
function navegador() {
  const ctx = { window: {}, document: { dispatchEvent() {} }, Event: class {} };
  vm.runInNewContext(CLIENTE_DESCUENTO, ctx);
  return ctx.window.VD;
}
const liga = async q => (await pedir(`/api/puntos/liga?${q}`)).json();

describe('total con descuento en la página de compra', () => {
  it('FUNDADOR30 en Vuelve: «Pagas hoy $279.30 y luego $279.30 al mes hasta cumplir 3 meses; después, $399 al mes»', async () => {
    const VD = navegador();
    const r = await liga('c=FUNDADOR30&slug=vuelve-mensual');
    expect(r.descuento).toEqual({ pct: 30, duracion: 'repeating', meses: 3, etiqueta: 'FUNDADOR30: 30 %' });
    VD.fijar(r.descuento);
    expect(VD.frase(39900, 'al mes')).toEqual({ hoy: '$279.30 MXN', luego: 'y luego $279.30 MXN al mes hasta cumplir 3 meses; después, $399 MXN al mes' });
    // Sin descuento, como antes
    VD.fijar(null);
    expect(VD.frase(39900, 'al mes')).toEqual({ hoy: '$399 MXN', luego: 'y luego $399 MXN al mes' });
  });

  it('5 % de referido en una suscripción: «Pagas hoy $X (5 % por recomendación) y luego $399 al mes»', async () => {
    const VD = navegador();
    const r = await (await pedir('/api/puntos/liga?slug=vuelve-mensual', { cookie: 'vorka_ref=ANA' })).json();
    expect(r.descuento).toEqual({ pct: 5, duracion: 'once', meses: null, etiqueta: '5 % por recomendación' });
    VD.fijar(r.descuento);
    expect(VD.frase(39900, 'al mes')).toEqual({ hoy: '$379.05 MXN', luego: '(5 % por recomendación) y luego $399 MXN al mes' });
    const a = precio('vuelve-anual'), h = a - Math.round(a * 0.05);
    expect(VD.frase(a, 'al año')).toEqual({ hoy: VD.pesos(h), luego: `(5 % por recomendación) y luego ${VD.pesos(a)} al año` });
  });

  it('si vorka_ref5 ya existe en Stripe para siempre (forever), usa uno con la duración en el id', async () => {
    cupones.set('vorka_ref5', { id: 'vorka_ref5', valid: true, percent_off: 5, duration: 'forever' });
    await comprar({}, { cookie: 'vorka_ref=ANA' });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_ref5_5p_once');
    expect(cupones.get('vorka_ref5_5p_once')).toMatchObject({ percent_off: 5, duration: 'once' });
  });

  it('pago único: el total ya con el 5 %', async () => {
    const VD = navegador();
    const r = await liga('c=ANA&slug=de-idea-a-proyecto');
    expect(r.descuento).toEqual({ pct: 5, duracion: null, meses: null, etiqueta: '5 % por recomendación' });
    VD.fijar(r.descuento);
    expect(VD.pesos(VD.hoy(27900))).toBe('$265.05 MXN');
  });

  it('la página calcula exactamente lo que cobra el servidor (mismo cálculo, mismo redondeo)', async () => {
    const VD = navegador();
    const casos = [
      [{ codigo: 'FUNDADOR30', slug: 'vuelve-mensual', sucursales: 3 }, 'vuelve-mensual', p => p('vuelve-mensual') + 3 * p('vuelve-sucursal-mensual')],
      [{ codigo: 'FUNDADOR30', slug: 'agenda-mensual', profesionales: 4 }, 'agenda-mensual', p => p('agenda-mensual') + 3 * p('agenda-profesional-mensual')],
      [{ codigo: 'ANA', slug: 'vuelve-anual', sucursales: 2 }, 'vuelve-anual', p => p('vuelve-anual') + 2 * p('vuelve-sucursal-anual')],
      [{ codigo: 'ANA', slug: 'de-idea-a-proyecto' }, 'de-idea-a-proyecto', p => p('de-idea-a-proyecto')],
    ];
    for (const [compra, slug, subtotal] of casos) {
      const { descuento } = await liga(`c=${compra.codigo}&slug=${slug}`);
      VD.fijar(descuento);
      await comprar(compra);
      expect(ultima().monto_centavos).toBe(VD.hoy(subtotal(precio)));
    }
    // Y la cuenta es la misma para cualquier monto (incluidos los que llevan medio centavo)
    for (let t = COBRO_MINIMO; t < 600000; t += 997)
      for (const pct of [5, 30, 12.5]) {
        VD.fijar({ pct, duracion: 'once', meses: null });
        expect(VD.hoy(t)).toBe(t - centavosDescuento(t, t, pct, COBRO_MINIMO));
      }
  });

  it('las páginas de compra cargan el ayudante antes de su propio script y repintan al cambiar el descuento', async () => {
    for (const ruta of ['/tienda/vuelve/', '/tienda/agenda/', '/tienda/vende/', '/tienda/cuentas/', '/tienda/de-idea-a-proyecto', '/tienda/brindi/']) {
      const h = await (await pedir(ruta)).text();
      const ayudante = h.indexOf('if(window.VD) return;');
      expect(ayudante, ruta).toBeGreaterThan(-1);
      expect(h.indexOf("addEventListener('vorka:descuento'"), ruta).toBeGreaterThan(ayudante);
      expect(h.indexOf('VD.fijar(d&&d.descuento||null)'), ruta).toBeGreaterThan(ayudante);
    }
  });
});

describe('códigos de regalo personales (Vorka OS)', () => {
  it('crea un código único de un solo uso con su vencimiento y se puede usar una vez', async () => {
    const admin = await import('../src/admin.js');
    const { evaluarCodigo } = await import('../src/descuentos.js');
    const { d1 } = await import('./d1.js');
    const env = { DB: d1() };
    const a = await admin.crearCodigoRegalo(env, { prefijo: 'SPARKS', nombre: 'Daniela Ortega', correo: 'd@mail.com', pct: 20, dias: 60 });
    const b = await admin.crearCodigoRegalo(env, { prefijo: 'SPARKS', nombre: 'Daniela Ortega', correo: 'd@mail.com', pct: 20, dias: 60 });
    expect(a.codigo).toMatch(/^SPARKS-DANIE-[A-Z2-9]{4}$/);
    expect(a.codigo).not.toBe(b.codigo);
    const fila = env.DB.raw.prepare('SELECT * FROM codigos_descuento WHERE codigo = ?').get(a.codigo);
    expect(fila).toMatchObject({ pct: 20, meses: 1, max_usos: 1, usos: 0 });
    expect((await evaluarCodigo(env, a.codigo.toLowerCase()))?.pct).toBe(20);
    env.DB.raw.exec(`UPDATE codigos_descuento SET usos = 1 WHERE codigo = '${a.codigo}'`);
    expect((await evaluarCodigo(env, a.codigo)).valido).toBe(false);
    await expect(admin.crearCodigoRegalo(env, { prefijo: 'sparks', nombre: 'x', pct: 20, dias: 60 })).rejects.toThrow();
  });
});
