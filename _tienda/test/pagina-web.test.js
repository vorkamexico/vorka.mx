// Tu página web en la tienda: /tienda/pagina-web/, suscripción mensual de $349 con Stripe Billing, correo y página de gracias
// que llevan a WhatsApp (no hay app que abrir; el dominio se paga aparte por transferencia) y Puntos para quien recomienda.
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
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@correo.mx', terminos: true, slug: 'pagina-web-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

const sub = (o = {}) => ({
  id: 'sub_c1', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'pagina-web', email: 'laura@correo.mx', product_id: 'prod_pagina_web_mensual' },
  items: { data: [{ id: 'si_plan', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 34900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_pagina_web_mensual' } } } }] }, ...o,
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
      amount_total: 34900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_c1' });
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/invoices/')) return ok(stripe.factura);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    if (url.endsWith('/products')) return ok({ id: 'prod_stripe_suc' });
    if (url.includes('/subscription_items')) return ok({ id: 'si_nuevo' });
    if (url.includes('/balance_transactions')) return ok({ id: 'cbtxn_1' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());



describe('Tu página web', () => {
  it('la página de compra muestra el precio, el plan de 12 meses y el dominio aparte; está en el catálogo', async () => {
    const r = await pedir('/tienda/pagina-web/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('$349');
    expect(h).toContain('plan de 12 meses');
    expect(h).toMatch(/dominio se paga aparte/);
    expect((await pedir('/tienda/pagina-web')).status).toBe(301);
    expect(await (await pedir('/tienda/')).text()).toContain('/tienda/pagina-web/');
  });
  it('abre Stripe en modo suscripción mensual de $349 con la app en la metadata', async () => {
    const r = await comprar();
    expect(r.status, await r.clone().text()).toBe(200);
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect([...p.entries()].some(([k, v]) => /recurring\]\[interval\]$/.test(k) && v === 'month')).toBe(true);
    expect([...p.entries()].some(([k, v]) => /unit_amount\]$/.test(k) && v === '34900')).toBe(true);
    expect([...p.entries()].some(([k, v]) => /metadata\]\[app\]$|^subscription_data\[metadata\]\[app\]$/.test(k) && v === 'pagina-web')).toBe(true);
  });
  it('al pagar: correo con WhatsApp para empezar y pagar el dominio, y la página de gracias igual', async () => {
    const { order } = await (await comprar()).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(correos).toHaveLength(1);
    expect(correos[0].asunto).toMatch(/Tu página web/);
    expect(correos[0].html).toContain('wa.me/528117804869');
    expect(correos[0].texto).toMatch(/dominio/);
    const g = await (await pedir(`/tienda/gracias/?order=${order}`)).text();
    expect(g).toContain('Empecemos tu página');
    expect(g).toContain('wa.me/528117804869');
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('laura@correo.mx', 'pagina-web')).toMatchObject({ estado: 'active', vigente: true, intervalo: 'month' });
  });
});
