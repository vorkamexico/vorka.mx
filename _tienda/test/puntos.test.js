import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, puntosAlReembolsar, saldoDe, descuentoMaximo } from '../src/puntos.js';

let env, llamadas;
const SITIO = 'https://vorka.mx';
function stripeFalso() {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, params: new URLSearchParams(init?.body) });
    if (url.endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    if (url.endsWith('/coupons')) return new Response(JSON.stringify({ id: 'cupon_1' }));
    return new Response(JSON.stringify({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/x' }));
  }));
}
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);

// Crea la cuenta de puntos y devuelve la cookie de sesión
async function entrar(email, nombre = 'Ana') {
  const rr = await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre, terminos: true } }); const r = await rr.json();
  expect(r.enlace).toMatch(/^\/tienda\/puntos\/acceso\/[a-f0-9]{64}$/);
  const a = await pedir(r.enlace);
  expect(a.status).toBe(303);
  return a.headers.get('set-cookie').split(';')[0];
}
async function compraPagada(email, ref) {
  const o = await crearOrden(env, { items: [{ slug: 'cupo-pro-100' }], email, nombre: 'Comprador', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  return o;
}

beforeEach(() => { env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; stripeFalso(); });
afterEach(() => vi.unstubAllGlobals());

describe('Programa de puntos', () => {
  it('crear cuenta da una liga propia; cada compra con ella suma 10 puntos (no las propias) y un reembolso los revierte', async () => {
    const cookie = await entrar('ana@mail.com');
    const cuenta = await (await pedir('/tienda/cuenta/', { cookie })).text();
    const code = cuenta.match(/\?ref=([A-Z0-9]+)/)[1];
    expect(cuenta).toContain('Tienes <span class="metal">0 puntos</span>');
    expect(env.DB.raw.prepare("SELECT tipo FROM affiliates WHERE code = ?").get(code).tipo).toBe('puntos');

    await compraPagada('beto@mail.com', code);
    const o2 = await compraPagada('caro@mail.com', code);
    await compraPagada('ana@mail.com', code);            // comprarse a sí misma no cuenta
    await puntosAlPagar(env, o2.id);                      // reintento del webhook: no duplica
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(20);

    await aplicarPago(env, o2.id, { resultado: 'reembolsado' });
    await puntosAlReembolsar(env, o2.id);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(10);
    const s = await (await pedir('/api/puntos/saldo', { cookie })).json();
    expect(s).toMatchObject({ cuenta: true, email: 'ana@mail.com', disponibles: 10 });
    expect((await pedir('/tienda/cuenta/', { cookie })).status).toBe(200);
    expect((await pedir('/tienda/cuenta/')).status).toBe(303);   // sin sesión, a la página del programa
  });

  it('los puntos se canjean al pagar: cupón de Stripe por el descuento, orden por el neto y se descuentan al confirmarse', async () => {
    const cookie = await entrar('ana@mail.com');
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('ana@mail.com', 'ajuste', 500, 'prueba')");
    // $149: el descuento deja el cobro mínimo de $10
    const r = await pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(200);
    const o = env.DB.raw.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').get();
    expect(o).toMatchObject({ descuento_centavos: 13900, monto_centavos: 1000, puntos_email: 'ana@mail.com' });
    const cupon = llamadas.find(l => l.url.endsWith('/coupons'));
    expect(cupon.params.get('amount_off')).toBe('13900');
    expect(llamadas.find(l => l.url.endsWith('/checkout/sessions')).params.get('discounts[0][coupon]')).toBe('cupon_1');
    // Mientras se paga, los puntos quedan apartados (no se pueden usar dos veces)
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(361);
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 1000, moneda: 'MXN' });
    await puntosAlPagar(env, o.id);
    expect(await saldoDe(env, 'ana@mail.com')).toMatchObject({ total: 361, disponibles: 361 });
  });

  it('no deja usar puntos sin sesión ni con otro correo', async () => {
    let r = await pedir('/api/checkout', { method: 'POST', body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(401);
    const cookie = await entrar('ana@mail.com');
    r = await pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'otra@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(400);
    expect(descuentoMaximo(5, 900)).toBe(0);            // menos de $10: no hay descuento
    expect(descuentoMaximo(5, 14900)).toBe(500);
  });

  it('la página del programa, la tienda y los formularios de compra lo anuncian; los afiliados de dinero no se mezclan', async () => {
    expect(await (await pedir('/tienda/puntos/')).text()).toContain('Recomienda y gana');
    const tienda = await (await pedir('/tienda/')).text();
    expect(tienda).toContain('/tienda/puntos/');
    expect(await (await pedir('/tienda/cupo/')).text()).toContain("fetch('/api/puntos/saldo'");
    await entrar('ana@mail.com');
    env.DB.raw.exec("INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('PROFE', 'Profe', 15)");
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env);
    expect((await A.afiliados()).map(a => a.code)).toEqual(['PROFE']);
    expect((await A.resumenPuntos()).cuentas).toBe(1);
  });
});
