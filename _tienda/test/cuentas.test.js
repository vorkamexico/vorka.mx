// Cuentas en la tienda: ficha /tienda/cuentas/, checkout mensual en modo suscripción, correo de acceso a cuentas.vorka.mx
// y RPC que usa la app (validarAcceso, suscripcionApp, portalApp).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';

const SECRETO = 'whsec_prueba';
let env, llamadas, stripe, correos;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto) {
  // Cuerpo "mentiroso" a propósito: el webhook debe consultar a Stripe, no creerle al cuerpo
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, status: 'active', payment_status: 'paid' } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1' } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@correo.mx', terminos: true, slug: 'cuentas-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

const sub = (o = {}) => ({
  id: 'sub_c1', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'cuentas', email: 'laura@correo.mx', product_id: 'prod_cuentas_mensual' },
  items: { data: [{ id: 'si_plan', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 9900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_cuentas_mensual' } } } }] }, ...o,
});

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  llamadas = []; correos = []; stripe = { orden: null, sub: null, factura: null };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body) });
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/checkout/sessions')) { const id = `cs_${llamada('/checkout/sessions').length}`; return ok({ id, url: `https://checkout.stripe.com/c/pay/${id}` }); }
    if (url.includes('/checkout/sessions/')) return ok({ id: 'cs_1', mode: 'subscription', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden,
      amount_total: 9900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_c1' });
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/invoices/')) return ok(stripe.factura);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    if (url.endsWith('/products')) return ok({ id: 'prod_stripe_suc' });
    if (url.includes('/subscription_items')) return ok({ id: 'si_nuevo' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());


describe('ficha de Cuentas', () => {
  it('muestra el precio mensual, la prueba sin tarjeta y los avisos legales', async () => {
    const r = await pedir('/tienda/cuentas/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('$99 MXN');
    expect(h).toContain('https://cuentas.vorka.mx/entrar');
    expect(h).toContain('/legal/cuentas/privacidad/');
    expect(h).toMatch(/no es un banco/i);
    expect(h).toContain('name="slug" value="cuentas-mensual"');
  });
  it('sin la diagonal final redirige y aparece en el catálogo', async () => {
    expect((await pedir('/tienda/cuentas')).status).toBe(301);
    const h = await (await pedir('/tienda/')).text();
    expect(h).toContain('/tienda/cuentas/');
  });
  it('trae el correo de la app para ligar la suscripción a la cuenta', async () => {
    const h = await (await pedir('/tienda/cuentas/?email=laura%40correo.mx')).text();
    expect(h).toContain('value="laura@correo.mx"');
    expect(await (await pedir('/tienda/cuentas/?email=%3Cscript%3E')).text()).not.toContain('<script>@');
  });
});

describe('checkout de Cuentas (suscripción mensual)', () => {
  it('abre Stripe en modo suscripción mensual de $99 con la app en la metadata', async () => {
    const r = await comprar();
    expect(r.status).toBe(200);
    const { order } = await r.json();
    expect(fila('SELECT monto_centavos FROM orders').monto_centavos).toBe(9900);
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('9900');
    expect(p.has('line_items[1][quantity]')).toBe(false);
    expect(p.get('subscription_data[metadata][app]')).toBe('cuentas');
    expect(p.get('subscription_data[metadata][order_id]')).toBe(order);
  });
  it('no se regala y no se duplica con el mismo correo', async () => {
    expect((await comprar({ regalo: true })).status).toBe(400);
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('sub_x', 'laura@correo.mx', 'cuentas', 'prod_cuentas_mensual', 'active')");
    expect((await comprar()).status).toBe(409);
  });
});

describe('después de pagar', () => {
  async function pagar() {
    const { order } = await (await comprar()).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    return order;
  }
  it('manda el botón para entrar a Cuentas y el enlace sirve para entrar (validarAcceso)', async () => {
    await pagar();
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(correos).toHaveLength(1);
    const m = correos[0].texto.match(/https:\/\/cuentas\.vorka\.mx\/entrar\/([a-f0-9]{64})/);
    expect(m).toBeTruthy();
    expect(correos[0].texto).toMatch(/Cuentas › Ajustes/);
    const A = new Admin({}, env);
    expect(await A.validarAcceso(m[1], 'cuentas')).toMatchObject({ email: 'laura@correo.mx' });
    expect(await A.validarAcceso(m[1], 'vuelve')).toBeNull();
  });
  it('la app ve la suscripción vigente y puede abrir el portal de Stripe', async () => {
    await pagar();
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('laura@correo.mx', 'cuentas')).toMatchObject({ estado: 'active', vigente: true, intervalo: 'month', monto_centavos: 9900 });
    expect(await A.suscripcionApp('laura@correo.mx', 'vuelve')).toBeNull();
    expect(await A.portalApp('laura@correo.mx', 'cuentas', 'https://cuentas.vorka.mx/ajustes')).toMatchObject({ url: expect.stringContaining('billing.stripe.com') });
    stripe.sub = sub({ status: 'canceled' });
    await evento('customer.subscription.deleted', 'sub_c1');
    expect(await A.suscripcionApp('laura@correo.mx', 'cuentas')).toMatchObject({ estado: 'canceled', vigente: false });
  });
});
