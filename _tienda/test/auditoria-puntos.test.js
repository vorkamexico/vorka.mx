// Auditoría de Puntos Vorka (octubre 2026): cada prueba falla con el código anterior y pasa con el arreglo.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, saldoDe } from '../src/puntos.js';

let env, llamadas, cuponFalla;
const SITIO = 'https://vorka.mx';
function stripeFalso() {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, params: new URLSearchParams(init?.body) });
    if (url.endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    if (url.endsWith('/coupons')) return cuponFalla
      ? new Response(JSON.stringify({ error: { message: 'The provided key does not have the required permissions' } }), { status: cuponFalla })
      : new Response(JSON.stringify({ id: 'cupon_1' }));
    return new Response(JSON.stringify({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/x' }));
  }));
}
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
async function entrar(email) {
  const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre: 'Ana', terminos: true } })).json();
  return (await pedir(r.enlace)).headers.get('set-cookie').split(';')[0];
}
const darPuntos = (email, n) => env.DB.raw.exec(`INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('${email}', 'ajuste', ${n}, 'prueba')`);
const comprarConPuntos = cookie => pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true, usar_puntos: true } });
const ordenes = () => env.DB.raw.prepare('SELECT * FROM orders ORDER BY created_at').all();

beforeEach(() => { cuponFalla = 0; env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; stripeFalso(); });
afterEach(() => vi.unstubAllGlobals());

describe('puntos · auditoría', () => {
  it('6. los puntos de una ficha OXXO siguen apartados mientras la orden esté pendiente (más de 24 h)', async () => {
    const cookie = await entrar('ana@mail.com');
    darPuntos('ana@mail.com', 200);
    expect((await comprarConPuntos(cookie)).status).toBe(200);   // $149: aparta 139 puntos
    const [o] = ordenes();
    // Pasan 2 días: la ficha OXXO (3 días) sigue viva y los puntos no se pueden volver a usar
    env.DB.raw.prepare('UPDATE orders SET created_at = ? WHERE id = ?').run(new Date(Date.now() - 48 * 3600e3).toISOString(), o.id);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(61);
    // Si la ficha vence (failed), se liberan
    await aplicarPago(env, o.id, { resultado: 'rechazado' });
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(200);
  });

  it('6b. al confirmarse el pago se revisa el saldo: si ya no alcanza, el canje queda y la orden se marca para revisar (sin esconder el negativo)', async () => {
    const cookie = await entrar('ana@mail.com');
    darPuntos('ana@mail.com', 200);
    await comprarConPuntos(cookie);
    const [o] = ordenes();
    darPuntos('ana@mail.com', -150);   // mientras tanto se revirtieron puntos (p. ej. una venta con su liga se reembolsó)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 1000, moneda: 'MXN' });
    await puntosAlPagar(env, o.id);
    expect(error.mock.calls.some(c => String(c[0]).includes('ALERTA puntos'))).toBe(true);
    error.mockRestore();
    expect(env.DB.raw.prepare("SELECT puntos FROM puntos_movimientos WHERE order_id = ? AND tipo = 'canje'").get(o.id).puntos).toBe(-139);
    expect(env.DB.raw.prepare('SELECT revisar FROM orders WHERE id = ?').get(o.id).revisar).toMatch(/se canjearon 139 y había 50/);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(-89);
  });

  it('7. dos compras al mismo tiempo no pueden apartar los mismos puntos', async () => {
    const cookie = await entrar('ana@mail.com');
    darPuntos('ana@mail.com', 200);
    // Las dos compras leen el saldo (200) antes de que cualquiera cree su orden: el peor caso de la carrera
    const prepare = env.DB.prepare;
    let lecturas = 0, soltar;
    const barrera = new Promise(r => { soltar = r; });
    env.DB.prepare = sql => {
      const st = prepare(sql);
      if (/FROM puntos_movimientos WHERE email/.test(sql) && /^\s*SELECT/.test(sql)) {
        const first = st.first.bind(st);
        st.first = async () => { const v = await first(); if (++lecturas === 2) soltar(); await barrera; return v; };
      }
      return st;
    };
    const [a, b] = await Promise.all([comprarConPuntos(cookie), comprarConPuntos(cookie)]);
    env.DB.prepare = prepare;
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const conPuntos = ordenes().filter(o => o.puntos_usados > 0);
    expect(conPuntos).toHaveLength(1);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(61);
  });

  it('8. si Stripe no deja crear el cupón, el mensaje ofrece pagar sin puntos, avisa con una alerta y suelta los puntos', async () => {
    const cookie = await entrar('ana@mail.com');
    darPuntos('ana@mail.com', 200);
    cuponFalla = 403;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await comprarConPuntos(cookie);
    expect(r.status).toBe(503);
    const j = await r.json();
    expect(j.sin_puntos).toBe(true);
    expect(j.error).toMatch(/pagar sin puntos/);
    expect(error.mock.calls.some(c => String(c[0]).includes('ALERTA') && c.join(' ').includes('Coupons'))).toBe(true);
    error.mockRestore();
    expect(ordenes()[0].estado).toBe('failed');
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(200);
    // Sin puntos, la compra sigue
    cuponFalla = 0;
    const sin = await pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true } });
    expect(sin.status).toBe(200);
  });
});
