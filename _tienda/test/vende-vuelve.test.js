// Paquete Vende + Vuelve en la tienda: productos de la migración, ficha /tienda/vende/ con el paquete, checkout,
// una suscripción que abre Vende y Vuelve con el mismo correo, correo de entrega con los dos botones y redirecciones.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin, rutaCitas } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { olvidarTemporada } from '../src/temporadas.js';

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
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1', headers = {} } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: 'ana@consultorio.mx', terminos: true, slug: 'agenda-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

// Renglones de una suscripción "real" de Stripe (API nueva: periodo en cada item; productos expandidos con su metadata)
const renglon = (id, product_id, unit_amount, quantity = 1, interval = 'month') =>
  ({ id, quantity, current_period_end: 1893456000, price: { unit_amount, recurring: { interval }, product: { metadata: { product_id } } } });
const sub = (o = {}) => ({
  id: 'sub_ag', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'agenda', email: 'ana@consultorio.mx', product_id: 'prod_agenda_mensual' },
  items: { data: [renglon('si_plan', 'prod_agenda_mensual', 9900), renglon('si_prof', 'prod_agenda_profesional_mensual', 9900, 2)] }, ...o,
});
const subPaquete = (o = {}) => ({
  id: 'sub_paq', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'agenda-vuelve', email: 'ana@consultorio.mx', product_id: 'prod_agenda_vuelve_mensual' },
  items: { data: [renglon('si_paq', 'prod_agenda_vuelve_mensual', 44900), renglon('si_prof', 'prod_agenda_profesional_mensual', 9900, 1), renglon('si_suc', 'prod_vuelve_sucursal_mensual', 24900, 1)] }, ...o,
});

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  llamadas = []; correos = []; stripe = { orden: null, sub: null, total: 0 };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body) });
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/checkout/sessions')) { const id = `cs_${llamada('/checkout/sessions').length}`; return ok({ id, url: `https://checkout.stripe.com/c/pay/${id}` }); }
    if (url.includes('/checkout/sessions/')) return ok({ id: 'cs_1', mode: 'subscription', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden,
      amount_total: stripe.total, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: stripe.sub.id });
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    if (url.endsWith('/products')) return ok({ id: 'prod_stripe_x' });
    if (url.includes('/subscription_items')) return ok({ id: 'si_nuevo' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const subVV = (o = {}) => ({
  id: 'sub_vv', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'vende-vuelve', email: 'ana@consultorio.mx', product_id: 'prod_vende_vuelve_mensual' },
  items: { data: [renglon('si_vv', 'prod_vende_vuelve_mensual', 44900)] }, ...o,
});
async function pagar(slug) {
  const r = await comprar({ slug });
  expect(r.status).toBe(200);
  const { order } = await r.json();
  stripe.orden = order; stripe.sub = subVV(); stripe.total = fila(`SELECT monto_centavos FROM orders WHERE id = '${order}'`).monto_centavos;
  expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
  return order;
}

describe('Paquete Vende + Vuelve', () => {
  it('la migración deja los dos planes a la venta, ocultos del catálogo, con su app de paquete', () => {
    const ps = d1().raw.prepare("SELECT slug, precio_centavos, activo, contenido FROM products WHERE slug LIKE 'vende-vuelve-%' ORDER BY orden").all();
    expect(ps.map(p => [p.slug, p.precio_centavos, p.activo])).toEqual([['vende-vuelve-mensual', 44900, 1], ['vende-vuelve-anual', 449000, 1]]);
    for (const p of ps) expect(JSON.parse(p.contenido)).toMatchObject({ oculto: true, acceso: { app: 'vende-vuelve', apps: ['vende', 'vuelve'] } });
  });
  it('la ficha de Vende muestra el paquete y lo deja elegir en el formulario', async () => {
    const h = await (await pedir('/tienda/vende/?plan=vende-vuelve-mensual')).text();
    expect(h).toContain('Vende + Vuelve'); expect(h).toContain('data-plan="vende-vuelve-mensual"');
    expect(h).toMatch(/value="vende-vuelve-mensual" checked/); expect(h).toContain('value="vende-vuelve-anual"');
    expect(h).toContain('/legal/vuelve/');
  });
  it('la página de cada plan lleva a la ficha', async () => {
    expect((await pedir('/tienda/vende-vuelve-anual/')).headers.get('location')).toBe('/tienda/vende/?plan=vende-vuelve-anual#comprar');
  });
  it('al pagar: una suscripción abre Vende y Vuelve, con un botón para cada una', async () => {
    await pagar('vende-vuelve-mensual');
    expect(fila('SELECT app FROM suscripciones')).toEqual({ app: 'vende-vuelve' });
    const A = new Admin({}, env);
    for (const app of ['vende', 'vuelve']) expect(await A.suscripcionApp('ana@consultorio.mx', app)).toMatchObject({ vigente: true, paquete: 'vende-vuelve' });
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toBeNull();
    const t = correos[0].texto;
    expect(t).toMatch(/https:\/\/vende\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    expect(t).toMatch(/Entrar a Vuelve:\nhttps:\/\/os\.vorka\.mx\/vuelve\/entrar\/[a-f0-9]{64}/);
    expect(t).toContain('abre Vende Pro y Vuelve');
  });
  it('con el paquete ya no se puede comprar Vende ni Vuelve sueltos con el mismo correo', async () => {
    await pagar('vende-vuelve-mensual');
    for (const slug of ['vende-mensual', 'vuelve-mensual']) expect((await comprar({ slug })).status).toBe(409);
  });
});
