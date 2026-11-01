import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { ligaRetomar, recordatoriosAutomaticos } from '../src/recordatorio.js';

let env, A, correos, sesiones;
const HORA = 3600e3;
function red() {
  correos = []; sesiones = 0;
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    if (String(url).includes('api.resend.com')) { correos.push(JSON.parse(init.body)); return new Response('{"id":"em"}'); }
    if (String(url).endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    return new Response(JSON.stringify({ id: `cs_test_${++sesiones}`, url: 'https://checkout.stripe.com/c/pay/nuevo' }));
  }));
}
// Orden pendiente "creada hace" n horas
async function pendiente(email = 'ana@mail.com', horas = 3, metodo) {
  const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email, nombre: 'Ana López' });
  env.DB.raw.prepare('UPDATE orders SET created_at = ?, metodo_pago = ? WHERE id = ?').run(new Date(Date.now() - horas * HORA).toISOString(), metodo ?? null, o.id);
  return o;
}
const get = (ruta, headers = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers }), env);

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), RESEND_API_KEY: 're_x', STRIPE_SECRET_KEY: 'sk_test_x', PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec('UPDATE products SET activo = 1;');
  A = new Admin({}, env);
  red();
});
afterEach(() => vi.unstubAllGlobals());

describe('recordatorio de compra sin terminar', () => {
  it('manda un solo correo amable con liga para retomar y lo registra', async () => {
    const o = await pendiente('ana@mail.com', 3, 'oxxo');
    const det = await A.orden(o.id);
    expect(det.recordatorio).toEqual({ enviado: null, enviados: 0, maximo: 3, motivo: null });
    const r = await A.recordar(o.id);
    expect(r.ok).toBe(true);
    expect(correos).toHaveLength(1);
    expect(correos[0].to).toEqual(['ana@mail.com']);
    expect(correos[0].subject).toMatch(/quedó pendiente/);
    expect(correos[0].text).toMatch(/https:\/\/vorka\.mx\/tienda\/retomar\/[0-9a-f-]{36}\?e=\d+&s=[0-9a-f]{32}/);
    expect(correos[0].text).not.toMatch(/único recordatorio/);
    expect(correos[0].text).toMatch(/ya pagaste en OXXO/);
    expect((await A.orden(o.id)).recordatorio.enviado).toBe(r.recordatorio_at);
    await expect(A.recordar(o.id)).rejects.toThrow(/menos de 48 horas/);
    expect(correos).toHaveLength(1);
    expect((await A.ordenes({ estado: 'pending' })).ordenes[0].recordatorio_at).toBe(r.recordatorio_at);
  });

  it('no se manda a órdenes pagadas, muy recientes o de quien ya lo compró', async () => {
    const reciente = await pendiente('b@mail.com', 0.2);
    await expect(A.recordar(reciente.id)).rejects.toThrow(/muy reciente/);
    const vieja = await pendiente('c@mail.com', 5);
    const pagada = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'c@mail.com', nombre: 'C' });
    await aplicarPago(env, pagada.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN', metodo_pago: 'card', provider_payment_id: 'pi_1' });
    await expect(A.recordar(vieja.id)).rejects.toThrow(/ya lo compró/);
    await expect(A.recordar(pagada.id)).rejects.toThrow(/no se pagaron/);
    expect((await A.orden(pagada.id)).recordatorio).toBeNull();
    expect(correos).toHaveLength(0);
  });

  it('no repite seguimiento al mismo correo antes de 48 horas', async () => {
    const a = await pendiente('d@mail.com', 30), b = await pendiente('d@mail.com', 4);
    await A.recordar(a.id);
    await expect(A.recordar(b.id)).rejects.toThrow(/48 horas/);
  });

  it('permite hasta 3 correos de seguimiento por orden, con 48 horas entre uno y otro', async () => {
    const o = await pendiente('f@mail.com', 24 * 10);
    const r1 = await A.recordar(o.id);
    expect(r1.seguimientos).toBe(1);
    // simula que pasaron 3 días desde el último
    const atras = iso => new Date(Date.parse(iso) - 3 * 864e5).toISOString();
    await env.DB.prepare('UPDATE orders SET recordatorio_at = ? WHERE id = ?').bind(atras(r1.recordatorio_at), o.id).run();
    const r2 = await A.recordar(o.id);
    expect(r2.seguimientos).toBe(2);
    expect(correos[1].subject).toMatch(/Te ayudamos a terminar/);
    await env.DB.prepare('UPDATE orders SET recordatorio_at = ? WHERE id = ?').bind(atras(r2.recordatorio_at), o.id).run();
    await A.recordar(o.id);
    await env.DB.prepare("UPDATE orders SET recordatorio_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").bind(o.id).run();
    await expect(A.recordar(o.id)).rejects.toThrow(/los 3 correos/);
    expect(correos).toHaveLength(3);
  });

  it('archivar ("borrar") una orden sin pagar la oculta, y si después se paga vuelve a aparecer', async () => {
    const o = await pendiente('g@mail.com', 5);
    await A.archivarOrden(o.id);
    expect((await A.ordenes({ q: 'g@mail.com' })).ordenes).toHaveLength(0);
    expect((await A.ordenes({ q: 'g@mail.com', archivadas: '1' })).ordenes).toHaveLength(1);
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN', metodo_pago: 'oxxo', provider_payment_id: 'pi_tarde' });
    expect((await A.ordenes({ q: 'g@mail.com' })).ordenes[0].estado).toBe('paid');
    await expect(A.archivarOrden(o.id)).rejects.toThrow(/no se pagaron/);
  });

  it('si el correo falla, no queda marcado como enviado', async () => {
    const o = await pendiente('e@mail.com');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    await expect(A.recordar(o.id)).rejects.toThrow(/No se pudo mandar/);
    expect((await A.orden(o.id)).recordatorio.enviado).toBeNull();
  });

  it('la liga abre un pago nuevo con los mismos datos; vencida o alterada no', async () => {
    const o = await pendiente('f@mail.com');
    const liga = new URL(await ligaRetomar(env, o.id));
    const r = await get(liga.pathname + liga.search);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/nuevo');
    const nuevas = env.DB.raw.prepare("SELECT email, nombre, monto_centavos FROM orders WHERE id != ? AND email = 'f@mail.com'").all(o.id);
    expect(nuevas).toEqual([{ email: 'f@mail.com', nombre: 'Ana López', monto_centavos: 27900 }]);
    expect((await get(liga.pathname + liga.search.replace(/s=(\w)/, (_, c) => `s=${c === '0' ? '1' : '0'}`))).status).toBe(410);
    const vieja = new URL(await ligaRetomar(env, o.id, Date.now() - 15 * 864e5));
    expect((await get(vieja.pathname + vieja.search)).status).toBe(410);
  });

  it('si ya pagó, la liga lo manda a su página de gracias en lugar de cobrar otra vez', async () => {
    const o = await pendiente('g@mail.com');
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN', metodo_pago: 'card', provider_payment_id: 'pi_2' });
    const liga = new URL(await ligaRetomar(env, o.id));
    const r = await get(liga.pathname + liga.search);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe(`https://vorka.mx/tienda/gracias?order=${o.id}`);
    expect(sesiones).toBe(0);
  });
});

describe('enlace (slug) editable', () => {
  const id = () => env.DB.raw.prepare("SELECT id FROM products WHERE slug = 'de-idea-a-proyecto'").get().id;
  const base = async () => { const p = await A.producto(id()); return { id: p.id, nombre: p.nombre, precio: p.precio_centavos / 100, activo: p.activo, slug: p.slug }; };

  it('cambia el enlace y el anterior redirige con 301 (conservando ?ref)', async () => {
    const p = await A.guardarProducto({ ...(await base()), slug: 'kit-idea-proyecto' });
    expect(p.slug).toBe('kit-idea-proyecto');
    const r = await get('/tienda/de-idea-a-proyecto/?ref=ANA');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('/tienda/kit-idea-proyecto/?ref=ANA');
    expect((await get('/tienda/kit-idea-proyecto/')).status).toBe(200);
  });

  it('una compra con el enlace viejo sigue funcionando', async () => {
    await A.guardarProducto({ ...(await base()), slug: 'kit-nuevo' });
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'h@mail.com', nombre: 'H' });
    expect(o.items[0].slug).toBe('kit-nuevo');
  });

  it('valida formato, reservados y que sea único', async () => {
    const b = await base();
    await expect(A.guardarProducto({ ...b, slug: 'Kit Ñandú' })).rejects.toThrow(/minúsculas/);
    await expect(A.guardarProducto({ ...b, slug: 'gracias' })).rejects.toThrow(/reservado/);
    const otro = await A.guardarProducto({ nombre: 'Otro kit', precio: 10 });
    await expect(A.guardarProducto({ ...b, slug: otro.slug })).rejects.toThrow(/Ya hay otro producto/);
    // El enlace viejo de un producto no se le puede dar a otro (seguiría redirigiendo)
    await A.guardarProducto({ ...b, slug: 'kit-renombrado' });
    await expect(A.guardarProducto({ id: otro.id, nombre: 'Otro kit', precio: 10, slug: 'de-idea-a-proyecto' })).rejects.toThrow(/fue el enlace de otro/);
  });

  it('se puede regresar al enlace original y deja de redirigir a sí mismo', async () => {
    const b = await base();
    await A.guardarProducto({ ...b, slug: 'temporal' });
    await A.guardarProducto({ ...b, slug: 'de-idea-a-proyecto' });
    expect((await get('/tienda/de-idea-a-proyecto/')).status).toBe(200);
    expect((await get('/tienda/temporal/')).status).toBe(301);
    expect(env.DB.raw.prepare('SELECT slug FROM slugs_anteriores').all()).toEqual([{ slug: 'temporal' }]);
  });
});

describe('recordatorios automáticos (1 h, 48 h y 10 % a los 3 días)', () => {
  const DESDE = '2000-01-01T00:00:00.000Z';
  const corre = (t) => recordatoriosAutomaticos(env, t, { desde: DESDE });
  it('manda el 1.º a la hora, el 2.º a las 48 h y el 3.º con 10 % tres días después', async () => {
    const o = await pendiente('luz@mail.com', 0.5);
    const t0 = Date.now();
    expect((await corre(t0)).enviados).toBe(0);                       // aún no pasa la hora
    expect((await corre(t0 + 1 * HORA)).enviados).toBe(1);           // 1.º
    expect(correos).toHaveLength(1);
    expect((await corre(t0 + 30 * HORA)).enviados).toBe(0);           // aún no pasan 48 h
    expect((await corre(t0 + 50 * HORA)).enviados).toBe(1);           // 2.º
    expect((await corre(t0 + 100 * HORA)).enviados).toBe(0);          // aún no pasan 3 días del 2.º
    const r3 = await corre(t0 + 125 * HORA);                           // 3.º con descuento
    expect(r3).toMatchObject({ enviados: 1, con_descuento: 1 });
    expect(correos).toHaveLength(3);
    expect(correos[2].subject).toMatch(/10 %/);
    expect(correos[2].text).toMatch(/\/tienda\/retomar\/.+&d=10&s=/);
    expect((await corre(t0 + 400 * HORA)).enviados).toBe(0);          // nunca más de 3
    // La liga del 3.º abre el pago con el 10 % aplicado; cambiar el % a mano la invalida
    const liga = correos[2].text.match(/https:\/\/vorka\.mx(\/tienda\/retomar\/\S+)/)[1];
    expect((await get(liga.replace('d=10', 'd=50'))).status).toBe(410);
    const res = await get(liga);
    expect(res.status).toBe(303);
    const nueva = env.DB.raw.prepare("SELECT * FROM orders WHERE email = 'luz@mail.com' AND id != ? ORDER BY created_at DESC").get(o.id);
    expect(nueva.descuento_codigo).toBe('RECORDATORIO');
    expect(nueva.descuento_pct).toBe(10);
    const sub = env.DB.raw.prepare('SELECT SUM(precio_centavos * cantidad) s FROM order_items WHERE order_id = ?').get(nueva.id).s;
    expect(nueva.monto_centavos).toBe(sub - Math.round(sub * 0.1));
  });
  it('no molesta: OXXO esperando, compras del equipo, órdenes viejas y solo la más reciente de cada correo', async () => {
    await pendiente('oxxo@mail.com', 3, 'oxxo');                      // pending con método: está por pagar en OXXO
    env.DB.raw.prepare("INSERT INTO affiliates (code, nombre, email, comision_pct, activo) VALUES ('EQUIPO1', 'Equipo', 'equipo@vorka.mx', 0, 1)").run();
    await pendiente('equipo@vorka.mx', 3);
    await pendiente('dos@mail.com', 5);
    await pendiente('dos@mail.com', 3);                               // la más reciente de ese correo
    const r = await corre(Date.now());
    expect(r.enviados).toBe(1);
    expect(correos.map(c => c.to).flat()).toEqual(['dos@mail.com']);
    await pendiente('vieja@mail.com', 3);
    expect((await recordatoriosAutomaticos(env, Date.now(), { desde: new Date().toISOString() })).revisadas).toBe(0);
  });
});
