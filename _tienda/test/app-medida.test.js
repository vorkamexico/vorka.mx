// App a la medida en la tienda: /tienda/app-a-la-medida/, $1,500 el mes de preparación ($999 del primer mes + $501 de pago único)
// y luego $999 al mes con Stripe Billing, plan de 12 meses; correo y página de gracias que llevan a WhatsApp (migración 0099).
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
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@correo.mx', terminos: true, slug: 'app-medida-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

const sub = (o = {}) => ({
  id: 'sub_c1', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'app-medida', email: 'laura@correo.mx', product_id: 'prod_app_medida_mensual' },
  items: { data: [{ id: 'si_plan', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 99900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_app_medida_mensual' } } } }] }, ...o,
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
      amount_total: 150000, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_c1' });
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



describe('App a la medida', () => {
  it('la página muestra $1,500 hoy, $999 al mes, el plan de 12 meses y la autorización de marca; está en el catálogo y el sitemap', async () => {
    const r = await pedir('/tienda/app-a-la-medida/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('$1,500');
    expect(h).toContain('$999');
    expect(h).toContain('plan de 12 meses');
    expect(h).toContain('App Store');
    expect(h).toContain('Google Play');
    expect(h).toMatch(/autorizo a Vorka a publicar la app con mi marca/);
    expect(h).not.toMatch(/tel:|Llamar/);
    expect((await pedir('/tienda/app-a-la-medida')).status).toBe(301);
    expect(await (await pedir('/tienda/')).text()).toContain('/tienda/app-a-la-medida/');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('/tienda/app-a-la-medida/');
  });
  it('abre Stripe en suscripción: $999 al mes + $501 de pago único (sin recurring) = $1,500 el primer cobro', async () => {
    for (const extra of [{}, { instalacion: false }]) {
      const r = await comprar({ email: `x${Math.random()}@correo.mx`, ...extra });
      expect(r.status, await r.clone().text()).toBe(200);
      const p = llamada('/checkout/sessions').at(-1).params;
      expect(p.get('mode')).toBe('subscription');
      expect(p.get('line_items[0][price_data][unit_amount]')).toBe('99900');
      expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
      expect(p.get('line_items[1][price_data][unit_amount]')).toBe('50100');
      expect(p.get('line_items[1][price_data][recurring][interval]')).toBeNull();
      expect(p.get('subscription_data[metadata][app]')).toBe('app-medida');
    }
    expect(fila('SELECT monto_centavos FROM orders LIMIT 1').monto_centavos).toBe(150000);
    expect((await comprar({ slug: 'app-medida-preparacion' })).status).toBe(400);
  });
  it('al pagar: correo y página de gracias con WhatsApp para empezar, y la suscripción queda vigente', async () => {
    const { order } = await (await comprar()).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(correos).toHaveLength(1);
    expect(correos[0].asunto).toMatch(/Tu app/);
    expect(correos[0].html).toContain('wa.me/528117804869');
    expect(correos[0].texto).toMatch(/mes de preparación/);
    const g = await (await pedir(`/tienda/gracias/?order=${order}`)).text();
    expect(g).toContain('Empecemos tu app');
    expect(g).toContain('wa.me/528117804869');
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('laura@correo.mx', 'app-medida')).toMatchObject({ estado: 'active', vigente: true, intervalo: 'month' });
  });
});
