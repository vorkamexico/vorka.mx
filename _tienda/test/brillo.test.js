// Brillo en la tienda: ficha /tienda/brillo/, checkout de cada plan (con sucursales y el paquete con Vuelve y Agenda),
// webhooks del paquete, RPC para Vorka OS, correo de entrega, catálogo y redirecciones.

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

const subBrillo = (o = {}) => ({
  id: 'sub_bl', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'brillo', email: 'ana@consultorio.mx', product_id: 'prod_brillo_profesional_mensual' },
  items: { data: [renglon('si_plan', 'prod_brillo_profesional_mensual', 64900), renglon('si_suc', 'prod_brillo_sucursal_mensual', 39900, 2)] }, ...o,
});
const subPaqBrillo = (o = {}) => ({
  id: 'sub_bp', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'brillo-paquete', email: 'ana@consultorio.mx', product_id: 'prod_brillo_paquete_mensual' },
  items: { data: [renglon('si_paq', 'prod_brillo_paquete_mensual', 89900)] }, ...o,
});
const comprarBrillo = (extra = {}) => comprar({ slug: 'brillo-profesional-mensual', ...extra });

describe('ficha de Brillo', () => {
  it('hero, qué incluye, comparación, paquete, precios, compra y preguntas', async () => {
    const r = await pedir('/tienda/brillo/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('Tu salón en orden, <em>aunque no estés.</em>');
    for (const t of ['$349 MXN', '$3,490 MXN', '$649 MXN', '$6,490 MXN', '$899 MXN', '$399 MXN al mes']) expect(h).toContain(t);
    expect(h).toContain('<th scope="row">Booksy</th><td>$499</td>');
    expect(h).toContain('Por separado: $1,147 MXN al mes'); expect(h).toContain('$248 menos que por separado');   // Profesional $649 + Vuelve $399 + Agenda $99
    expect(h).toContain('id="form-brillo"'); expect(h).toContain('name="sucursales"');
    expect(h).toContain('href="/legal/brillo/"'); expect(h).toContain('href="/legal/brillo/privacidad/"');
    expect(h).toContain('https://brillo.vorka.mx/#/nuevo');
    expect(h).toContain('<option value="brillo-profesional-mensual" selected>');
  });
  it('SEO: título, canónico, OG propia y JSON-LD con las 6 ofertas y FAQPage', async () => {
    const h = await (await pedir('/tienda/brillo/')).text();
    expect(h).toContain('<title>Brillo: control diario para estéticas y salones | Prueba 7 días gratis</title>');
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/tienda/brillo/">');
    expect(h).toContain('<meta property="og:image" content="https://vorka.mx/assets/tienda/v3/brillo-og.jpg">');
    const ld = JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const prod = ld.find(x => x['@type'] === 'Product');
    expect(prod.offers).toMatchObject({ '@type': 'AggregateOffer', priceCurrency: 'MXN', lowPrice: '349.00', highPrice: '8990.00', offerCount: 6 });
    expect(JSON.stringify(ld.find(x => x['@type'] === 'FAQPage'))).not.toContain('<a ');
  });
  it('llena correo, plan y sucursales que manda la app, y no refleja código', async () => {
    const h = await (await pedir('/tienda/brillo/?plan=brillo-basico-anual&email=ana%40consultorio.mx&sucursales=2')).text();
    expect(h).toContain('value="ana@consultorio.mx"'); expect(h).toContain('<option value="brillo-basico-anual" selected>');
    expect(h).toMatch(/name="sucursales"[^>]+value="2"/);
    const x = await (await pedir('/tienda/brillo/?email=%22%3E%3Cscript%3Ex@y.mx&sucursales=999')).text();
    expect(x).not.toContain('<script>x'); expect(x).toMatch(/name="sucursales"[^>]+value="20"/);
  });
  it('sin productos activos invita a la prueba gratis, sin formulario ni ofertas', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug LIKE 'brillo-%'");
    const h = await (await pedir('/tienda/brillo/')).text();
    expect(h).not.toContain('id="form-brillo"'); expect(h).not.toContain('AggregateOffer'); expect(h).toContain('Pruébalo 7 días gratis');
  });
  it('la migración deja los 8 productos a la venta, solo el Básico mensual en el catálogo', async () => {
    const ps = d1().raw.prepare("SELECT slug, precio_centavos, activo, contenido FROM products WHERE slug LIKE 'brillo-%' ORDER BY orden").all();
    expect(ps.map(p => [p.slug, p.precio_centavos, p.activo])).toEqual([['brillo-basico-mensual', 34900, 1], ['brillo-basico-anual', 349000, 1], ['brillo-profesional-mensual', 64900, 1],
      ['brillo-profesional-anual', 649000, 1], ['brillo-sucursal-mensual', 39900, 1], ['brillo-sucursal-anual', 399000, 1], ['brillo-paquete-mensual', 89900, 1], ['brillo-paquete-anual', 899000, 1]]);
    const c = Object.fromEntries(ps.map(p => [p.slug, JSON.parse(p.contenido)]));
    expect(c['brillo-basico-mensual'].oculto).toBeUndefined();
    expect(ps.filter(p => p.slug !== 'brillo-basico-mensual').every(p => JSON.parse(p.contenido).oculto)).toBe(true);
    expect(c['brillo-profesional-anual'].suscripcion).toEqual({ intervalo: 'year', extras: { sucursal: 'prod_brillo_sucursal_anual' } });
    expect(c['brillo-paquete-mensual'].acceso).toMatchObject({ app: 'brillo-paquete', apps: ['brillo', 'vuelve', 'agenda'], plan: 'profesional' });
  });
  it('catálogo y página de cada plan llevan a la ficha', async () => {
    const cat = await (await pedir('/tienda/')).text();
    expect(cat).toContain('Brillo · Control para estéticas y salones'); expect(cat).toContain('href="/tienda/brillo/"');
    expect((await pedir('/tienda/brillo-paquete-anual/')).headers.get('location')).toBe('/tienda/brillo/?plan=brillo-paquete-anual#comprar');
    expect((await pedir('/tienda/brillo-basico-mensual/')).headers.get('location')).toBe('/tienda/brillo/?plan=brillo-basico-mensual#comprar');
    expect((await pedir('/tienda/brillo')).headers.get('location')).toBe('https://vorka.mx/tienda/brillo/');
  });
});

describe('checkout de Brillo', () => {
  it('Profesional con 2 sucursales adicionales; el anual usa precios anuales', async () => {
    expect((await comprarBrillo({ sucursales: 2 })).status).toBe(200);
    let p = llamada('/checkout/sessions')[0].params;
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('64900');
    expect(p.get('line_items[1][price_data][product_data][metadata][product_id]')).toBe('prod_brillo_sucursal_mensual');
    expect(p.get('line_items[1][quantity]')).toBe('2');
    expect(p.get('subscription_data[metadata][app]')).toBe('brillo');
    await comprarBrillo({ slug: 'brillo-basico-anual', sucursales: 1, email: 'b@salon.mx' });
    p = llamada('/checkout/sessions')[1].params;
    expect([p.get('line_items[0][price_data][unit_amount]'), p.get('line_items[1][price_data][unit_amount]')]).toEqual(['349000', '399000']);
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
  });
  it('el paquete no lleva sucursales y no se paga dos veces', async () => {
    const s = await comprarBrillo({ slug: 'brillo-paquete-mensual', sucursales: 1 });
    expect(s.status).toBe(400); expect((await s.json()).error).toMatch(/no lleva sucursales adicionales/);
    expect((await comprarBrillo({ slug: 'brillo-sucursal-mensual' })).status).toBe(400);
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('s1', 'ana@consultorio.mx', 'brillo-paquete', 'prod_brillo_paquete_mensual', 'active')");
    let r = await comprarBrillo();
    expect(r.status).toBe(409); expect((await r.json()).error).toMatch(/ya pagas el paquete Brillo \+ Vuelve \+ Agenda/);
    r = await comprar({ slug: 'vuelve-mensual' });
    expect(r.status).toBe(409);
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('s2', 'cafe@x.mx', 'agenda', 'prod_agenda_mensual', 'active')");
    r = await comprarBrillo({ slug: 'brillo-paquete-mensual', email: 'cafe@x.mx' });
    expect(r.status).toBe(409); expect((await r.json()).error).toMatch(/ya pagas Agenda/);
    expect((await comprarBrillo({ email: 'cafe@x.mx' })).status).toBe(200);   // con Agenda sí puede sumar Brillo
  });
});

describe('Brillo: webhooks y RPC para Vorka OS', () => {
  async function pagar(extra, s) {
    const { order } = await (await comprarBrillo(extra)).json();
    stripe.orden = order; stripe.sub = s(); stripe.total = fila(`SELECT monto_centavos FROM orders WHERE id = '${order}'`).monto_centavos;
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    return order;
  }
  it('al pagar: suscripción con sus sucursales y correo a brillo.vorka.mx/entrar/', async () => {
    await pagar({ sucursales: 2 }, subBrillo);
    expect(fila('SELECT app, sucursales FROM suscripciones')).toEqual({ app: 'brillo', sucursales: 2 });
    expect(correos[0].texto).toMatch(/https:\/\/brillo\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    expect(correos[0].texto).toMatch(/Brillo › Cuenta/);
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('ana@consultorio.mx', 'brillo')).toMatchObject({ vigente: true, sucursales: 2, paquete: null, product_id: 'prod_brillo_profesional_mensual' });
    const token = correos[0].texto.match(/entrar\/([a-f0-9]{64})/)[1];
    expect(await A.validarAcceso(token, 'brillo')).toMatchObject({ email: 'ana@consultorio.mx' });
    expect(await A.validarAcceso(token, 'vuelve')).toBeNull();
    await A.lugaresApp('ana@consultorio.mx', 'brillo', 3);
    expect(llamada('/subscription_items/si_suc').at(-1).params.get('quantity')).toBe('3');
  });
  it('paquete: una suscripción abre Brillo, Vuelve y Agenda, con un botón para cada una', async () => {
    await pagar({ slug: 'brillo-paquete-mensual' }, subPaqBrillo);
    const A = new Admin({}, env);
    for (const app of ['brillo', 'vuelve', 'agenda']) expect(await A.suscripcionApp('ana@consultorio.mx', app)).toMatchObject({ vigente: true, paquete: 'brillo-paquete' });
    const t = correos[0].texto;
    expect(t).toMatch(/https:\/\/brillo\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    expect(t).toMatch(/Entrar a Vuelve:\nhttps:\/\/os\.vorka\.mx\/vuelve\/entrar\/[a-f0-9]{64}/);
    expect(t).toMatch(/Entrar a Agenda:\nhttps:\/\/agenda\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    const token = t.match(/brillo\.vorka\.mx\/entrar\/([a-f0-9]{64})/)[1];
    for (const app of ['brillo', 'vuelve', 'agenda']) expect(await A.validarAcceso(token, app)).not.toBeNull();
    stripe.sub = subPaqBrillo({ status: 'canceled' });
    await evento('customer.subscription.deleted', 'sub_bp');
    expect((await A.suscripcionApp('ana@consultorio.mx', 'agenda')).vigente).toBe(false);
  });
});
