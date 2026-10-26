// Agenda en la tienda: ficha /tienda/agenda/, checkout de cada plan (por profesional y el paquete con Vuelve), webhooks
// que activan, cambian y cancelan, RPC para Vorka OS (también el paquete visto desde Vuelve), correo de entrega, catálogo,
// sitemap y el proxy de vorka.mx/citas/… a Vorka OS.
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

describe('ficha /tienda/agenda/', () => {
  it('hero, para quién, qué incluye, comparación, paquete, precios, compra y preguntas', async () => {
    const r = await pedir('/tienda/agenda/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('Tus clientes <em>agendan solos.</em>');
    for (const g of ['Consultorios médicos', 'Psicología', 'Nutrición', 'Dentistas', 'Fisioterapia', 'Barberías', 'Estéticas', 'Asesorías']) expect(h).toContain(g);
    expect(h).toContain('$99 MXN'); expect(h).toContain('$990 MXN'); expect(h).toContain('$449 MXN'); expect(h).toContain('$4,490 MXN');
    expect(h).toContain('por profesional');
    // comparación con los datos verificados del plan, y ningún otro competidor
    expect(h).toContain('≈ $184–221 MXN'); expect(h).toContain('$299 (1 profesional)'); expect(h).toContain('desde $100 por 50 mensajes'); expect(h).toContain('<th scope="row">Booksy</th><td>$499</td>');
    expect(h).not.toMatch(/Doctoralia|Fresha|Reservo/);
    // el sello automático del paquete ya funciona: se explica sin "muy pronto"
    expect(h).toContain('la visita se suma sola en la tarjeta de Vuelve'); expect(h).not.toContain('Muy pronto'); expect(h).not.toContain('todavía no está disponible');
    expect(h).toContain('Por separado: $498 MXN al mes');
    expect(h).toContain('id="form-agenda"'); expect(h).toContain('name="profesionales"'); expect(h).toContain('id="campo-sucursales"');
    expect(h).toContain('href="/legal/agenda/"'); expect(h).toContain('href="/legal/agenda/privacidad/"');
    expect(h).toContain('https://agenda.vorka.mx/#/nuevo');
    expect(h).toContain('Hasta 3 profesionales para probar');
    // sin promesas de lo que aún no hace
    expect(h).toContain('todavía no manda mensajes de WhatsApp automáticos');
  });
  it('SEO: título, descripción, canónico, OG propia y JSON-LD de Product con AggregateOffer y FAQPage', async () => {
    const h = await (await pedir('/tienda/agenda/')).text();
    expect(h).toContain('<title>Agenda: citas en línea para consultorios y negocios | Prueba 7 días gratis</title>');
    expect(h).toMatch(/<meta name="description" content="Tu página de citas en línea[^"]+\$99 al mes por profesional/);
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/tienda/agenda/">');
    expect(h).toContain('<meta property="og:image" content="https://vorka.mx/assets/tienda/agenda-og.png">');
    const ld = JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const prod = ld.find(x => x['@type'] === 'Product');
    expect(prod.offers).toMatchObject({ '@type': 'AggregateOffer', priceCurrency: 'MXN', lowPrice: '99.00', highPrice: '4490.00', offerCount: 4 });
    expect(prod.offers.offers.map(o => o.price)).toEqual(['99.00', '990.00', '449.00', '4490.00']);
    const faq = ld.find(x => x['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBeGreaterThan(8);
    expect(JSON.stringify(faq)).not.toContain('<a ');
  });
  it('llena el correo y los profesionales que manda la app, y no refleja código', async () => {
    const h = await (await pedir('/tienda/agenda/?plan=agenda-anual&email=ana%40consultorio.mx&profesionales=3')).text();
    expect(h).toContain('value="ana@consultorio.mx"');
    expect(h).toMatch(/id="profesionales" name="profesionales"[^>]+value="3"/);
    expect(h).toContain('<option value="agenda-anual" selected>');
    const x = await (await pedir('/tienda/agenda/?email=%22%3E%3Cscript%3Ex@y.mx&profesionales=999')).text();
    expect(x).not.toContain('<script>x'); expect(x).toMatch(/name="profesionales"[^>]+value="50"/);
  });
  it('sin productos activos invita a la prueba gratis, sin formulario ni ofertas', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug LIKE 'agenda-%'");
    const h = await (await pedir('/tienda/agenda/')).text();
    expect(h).not.toContain('id="form-agenda"'); expect(h).toContain('empieza tu prueba gratis'); expect(h).not.toContain('AggregateOffer');
  });
  it('las migraciones dejan los 6 productos inactivos, con su acceso y sus complementos', async () => {
    const db = d1();
    const ps = db.raw.prepare("SELECT slug, precio_centavos, activo, contenido FROM products WHERE slug LIKE 'agenda-%' ORDER BY orden").all();
    expect(ps.map(p => [p.slug, p.precio_centavos, p.activo])).toEqual([['agenda-mensual', 9900, 0], ['agenda-anual', 99000, 0], ['agenda-profesional-mensual', 9900, 0],
      ['agenda-profesional-anual', 99000, 0], ['agenda-vuelve-mensual', 44900, 0], ['agenda-vuelve-anual', 449000, 0]]);
    const c = Object.fromEntries(ps.map(p => [p.slug, JSON.parse(p.contenido)]));
    expect(c['agenda-mensual'].acceso).toMatchObject({ app: 'agenda', url: 'https://agenda.vorka.mx/entrar/', ruta: '/tienda/agenda/' });
    expect(c['agenda-anual'].suscripcion).toEqual({ intervalo: 'year', extras: { profesional: 'prod_agenda_profesional_anual' } });
    expect(c['agenda-vuelve-mensual'].acceso).toMatchObject({ app: 'agenda-vuelve', apps: ['agenda', 'vuelve'] });
    expect(c['agenda-vuelve-anual'].suscripcion.extras).toEqual({ profesional: 'prod_agenda_profesional_anual', sucursal: 'prod_vuelve_sucursal_anual' });
    expect(c['agenda-profesional-mensual']).toMatchObject({ oculto: true, complemento: true, acceso: { tipo: 'profesional' } });
  });
  it('catálogo, sitemap y página de cada plan', async () => {
    // sin tema de temporada, la pastilla de lo nuevo de la portada de la tienda es Agenda
    env.DB.raw.exec("INSERT INTO ajustes (clave, valor) VALUES ('temporada', 'apagado') ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor"); olvidarTemporada();
    const cat = await (await pedir('/tienda/')).text();
    olvidarTemporada();
    expect(cat).toContain('Agenda · Citas en línea'); expect(cat).toContain('$99 MXN al mes'); expect(cat).toContain('href="/tienda/agenda/"');
    expect(cat).toContain('Agenda: citas en línea para tu negocio');
    const sm = await (await pedir('/tienda/sitemap.xml')).text();
    expect(sm.match(/\/tienda\/agenda\//g)).toHaveLength(1);
    expect((await pedir('/tienda/agenda-vuelve-anual/')).headers.get('location')).toBe('/tienda/agenda/?plan=agenda-vuelve-anual#comprar');
    expect((await pedir('/tienda/agenda-mensual/')).headers.get('location')).toBe('/tienda/agenda/?plan=agenda-mensual#comprar');
    expect((await pedir('/tienda/agenda')).headers.get('location')).toBe('https://vorka.mx/tienda/agenda/');
  });
});

describe('checkout de Agenda (suscripción por profesional)', () => {
  it('mensual: el plan + los profesionales de más, en modo suscripción y con la app en la metadata', async () => {
    const r = await comprar({ profesionales: 3 });
    expect(r.status).toBe(200);
    const { order } = await r.json();
    expect(fila('SELECT monto_centavos FROM orders').monto_centavos).toBe(9900 * 3);
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('9900');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[1][price_data][product_data][metadata][product_id]')).toBe('prod_agenda_profesional_mensual');
    expect(p.get('line_items[1][quantity]')).toBe('2');
    expect(p.get('subscription_data[metadata][app]')).toBe('agenda');
    expect(p.get('subscription_data[metadata][order_id]')).toBe(order);
  });
  it('un solo profesional no agrega renglón; el anual usa precios anuales', async () => {
    await comprar();
    expect(llamada('/checkout/sessions')[0].params.has('line_items[1][quantity]')).toBe(false);
    await comprar({ slug: 'agenda-anual', profesionales: 2, email: 'otra@consultorio.mx' });
    const p = llamada('/checkout/sessions')[1].params;
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('99000');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
    expect(p.get('line_items[1][price_data][unit_amount]')).toBe('99000');
    expect(p.get('line_items[1][quantity]')).toBe('1');
    expect(p.has('allow_promotion_codes')).toBe(false);
  });
  it('paquete mensual y anual: plan, profesionales y sucursales de Vuelve, con la app del paquete', async () => {
    let r = await comprar({ slug: 'agenda-vuelve-mensual', profesionales: 2, sucursales: 1 });
    expect(r.status).toBe(200);
    let p = llamada('/checkout/sessions')[0].params;
    expect([p.get('line_items[0][price_data][unit_amount]'), p.get('line_items[1][price_data][unit_amount]'), p.get('line_items[2][price_data][unit_amount]')]).toEqual(['44900', '9900', '24900']);
    expect(p.get('line_items[2][price_data][product_data][metadata][product_id]')).toBe('prod_vuelve_sucursal_mensual');
    expect(p.get('subscription_data[metadata][app]')).toBe('agenda-vuelve');
    r = await comprar({ slug: 'agenda-vuelve-anual', email: 'b@consultorio.mx' });
    p = llamada('/checkout/sessions')[1].params;
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('449000');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
  });
  it('no se compran complementos sueltos, ni sucursales sin el paquete, ni se regala', async () => {
    expect((await comprar({ slug: 'agenda-profesional-mensual' })).status).toBe(400);
    const s = await comprar({ sucursales: 2 });
    expect(s.status).toBe(400); expect((await s.json()).error).toMatch(/no lleva sucursales/);
    expect((await comprar({ regalo: true })).status).toBe(400);
    expect((await comprar({ profesionales: 0 })).status).toBe(400);
    expect((await comprar({ profesionales: 51 })).status).toBe(400);
  });
  it('no se paga dos veces: Agenda sobre el paquete, el paquete sobre Vuelve', async () => {
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('s1', 'ana@consultorio.mx', 'agenda-vuelve', 'prod_agenda_vuelve_mensual', 'active')");
    let r = await comprar();
    expect(r.status).toBe(409); expect((await r.json()).error).toMatch(/ya pagas el paquete Agenda \+ Vuelve/);
    r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana', email: 'ana@consultorio.mx', terminos: true, slug: 'vuelve-mensual' } });
    expect(r.status).toBe(409);
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('s2', 'cafe@x.mx', 'vuelve', 'prod_vuelve_mensual', 'active')");
    r = await comprar({ slug: 'agenda-vuelve-mensual', email: 'cafe@x.mx' });
    expect(r.status).toBe(409); expect((await r.json()).error).toMatch(/ya pagas Vuelve/);
    // con Vuelve sí puede sumar Agenda sola
    expect((await comprar({ email: 'cafe@x.mx' })).status).toBe(200);
  });
});

describe('webhooks y RPC para Vorka OS', () => {
  async function pagar(extra, s) {
    const { order } = await (await comprar(extra)).json();
    stripe.orden = order; stripe.sub = s(); stripe.total = fila(`SELECT monto_centavos FROM orders WHERE id = '${order}'`).monto_centavos;
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    return order;
  }
  it('al pagar: orden pagada, suscripción con sus profesionales y correo a agenda.vorka.mx/entrar/', async () => {
    const order = await pagar({ profesionales: 3 }, sub);
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(fila('SELECT * FROM suscripciones')).toMatchObject({ id: 'sub_ag', app: 'agenda', order_id: order, estado: 'active', profesionales: 2, sucursales: 0, monto_centavos: 9900 * 3 });
    expect(correos).toHaveLength(1);
    expect(correos[0].texto).toMatch(/https:\/\/agenda\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    expect(correos[0].texto).toMatch(/Agenda › Cuenta/);
    expect(correos[0].texto).not.toMatch(/\/descargas\/[a-f0-9]{64}/);
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toMatchObject({ estado: 'active', vigente: true, profesionales: 2, paquete: null, intervalo: 'month' });
    // el token del correo abre Agenda (validarAcceso de Vorka OS), no Vuelve
    const token = correos[0].texto.match(/entrar\/([a-f0-9]{64})/)[1];
    expect(await A.validarAcceso(token, 'agenda')).toMatchObject({ email: 'ana@consultorio.mx' });
    expect(await A.validarAcceso(token, 'vuelve')).toBeNull();
  });
  it('cambia de profesionales, falla un cobro y cancela: Vorka OS lo ve al instante', async () => {
    await pagar({ profesionales: 3 }, sub);
    const A = new Admin({}, env);
    stripe.sub = sub({ items: { data: [sub().items.data[0], renglon('si_prof', 'prod_agenda_profesional_mensual', 9900, 4)] } });
    await evento('customer.subscription.updated', 'sub_ag');
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toMatchObject({ profesionales: 4, monto_centavos: 9900 * 5 });
    stripe.sub = sub({ status: 'past_due' });
    await evento('customer.subscription.updated', 'sub_ag');
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toMatchObject({ estado: 'past_due', vigente: true });
    stripe.sub = sub({ cancel_at_period_end: true });
    await evento('customer.subscription.updated', 'sub_ag');
    expect((await A.suscripcionApp('ana@consultorio.mx', 'agenda')).cancelar_al_final).toBe(true);
    stripe.sub = sub({ status: 'canceled' });
    await evento('customer.subscription.deleted', 'sub_ag');
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toMatchObject({ estado: 'canceled', vigente: false });
    expect(await A.suscripcionApp('ana@consultorio.mx', 'vuelve')).toBeNull();
    expect((await comprar()).status).toBe(200);   // ya cancelada, puede volver
  });
  it('profesionales desde la app: cambia la cantidad en Stripe con prorrateo, la agrega o la quita', async () => {
    await pagar({ profesionales: 3 }, sub);
    const A = new Admin({}, env);
    await A.lugaresApp('ana@consultorio.mx', 'agenda', 4, 'profesional');
    const c = llamada('/subscription_items/si_prof').at(-1);
    expect(c.params.get('quantity')).toBe('4'); expect(c.params.get('proration_behavior')).toBe('create_prorations');
    await A.lugaresApp('ana@consultorio.mx', 'agenda', 0, 'profesional');
    expect(llamada('/subscription_items/si_prof').at(-1).init.method).toBe('DELETE');
    stripe.sub = sub({ items: { data: [sub().items.data[0]] } });
    llamadas = []; await A.lugaresApp('ana@consultorio.mx', 'agenda', 1, 'profesional');
    expect(Object.fromEntries(llamada('/subscription_items')[0].params)).toMatchObject({ subscription: 'sub_ag', quantity: '1', 'price_data[unit_amount]': '9900', 'price_data[recurring][interval]': 'month' });
    await expect(A.lugaresApp('ana@consultorio.mx', 'agenda', 1, 'sucursal')).rejects.toThrow(/no admite lugares adicionales/);
    await expect(A.lugaresApp('ana@consultorio.mx', 'agenda', 51, 'profesional')).rejects.toThrow(/de 0 a 50 profesionales/);
    // portal de Stripe para administrar su suscripción
    expect(await A.portalApp('ana@consultorio.mx', 'agenda', 'https://agenda.vorka.mx/#/cuenta')).toEqual({ url: 'https://billing.stripe.com/p/session/x' });
  });
  it('paquete: la misma suscripción activa Agenda y Vuelve para el mismo correo, con dos botones en el correo', async () => {
    await pagar({ slug: 'agenda-vuelve-mensual', profesionales: 2, sucursales: 1 }, subPaquete);
    expect(fila('SELECT app, profesionales, sucursales FROM suscripciones')).toEqual({ app: 'agenda-vuelve', profesionales: 1, sucursales: 1 });
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('ana@consultorio.mx', 'agenda')).toMatchObject({ vigente: true, profesionales: 1, paquete: 'agenda-vuelve' });
    expect(await A.suscripcionApp('ana@consultorio.mx', 'vuelve')).toMatchObject({ vigente: true, sucursales: 1, paquete: 'agenda-vuelve' });
    const t = correos[0].texto;
    expect(t).toMatch(/Entrar a Agenda:\nhttps:\/\/agenda\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
    expect(t).toMatch(/Entrar a Vuelve:\nhttps:\/\/os\.vorka\.mx\/vuelve\/entrar\/[a-f0-9]{64}/);
    expect(correos[0].html).toContain('Entrar a Vuelve');
    const token = t.match(/agenda\.vorka\.mx\/entrar\/([a-f0-9]{64})/)[1];
    expect(await A.validarAcceso(token, 'agenda')).not.toBeNull();
    expect(await A.validarAcceso(token, 'vuelve')).not.toBeNull();
    // cada app cambia su propio complemento
    await A.lugaresApp('ana@consultorio.mx', 'vuelve', 3);
    expect(llamada('/subscription_items/si_suc').at(-1).params.get('quantity')).toBe('3');
    await A.lugaresApp('ana@consultorio.mx', 'agenda', 2, 'profesional');
    expect(llamada('/subscription_items/si_prof').at(-1).params.get('quantity')).toBe('2');
    // el portal también abre desde Vuelve
    expect(await A.portalApp('ana@consultorio.mx', 'vuelve', 'https://os.vorka.mx/vuelve/#/cuenta')).toEqual({ url: 'https://billing.stripe.com/p/session/x' });
    // al cancelar, las dos apps lo ven
    stripe.sub = subPaquete({ status: 'canceled' });
    await evento('customer.subscription.deleted', 'sub_paq');
    expect((await A.suscripcionApp('ana@consultorio.mx', 'vuelve')).vigente).toBe(false);
    expect((await A.suscripcionApp('ana@consultorio.mx', 'agenda')).vigente).toBe(false);
  });
  it('MRR del paquete y de Agenda por separado', async () => {
    env.DB.raw.exec(`INSERT INTO suscripciones (id, email, app, product_id, estado, intervalo, monto_centavos) VALUES
      ('s1', 'a@x.mx', 'agenda', 'prod_agenda_mensual', 'active', 'month', 19800), ('s2', 'b@x.mx', 'agenda-vuelve', 'prod_agenda_vuelve_anual', 'active', 'year', 449000)`);
    const A = new Admin({}, env);
    expect(await A.resumenSuscripciones('agenda')).toMatchObject({ vigentes: 1, mrr_centavos: 19800 });
    expect(await A.resumenSuscripciones('agenda-vuelve')).toMatchObject({ vigentes: 1, mrr_centavos: Math.round(449000 / 12) });
  });
});

describe('vorka.mx/citas/… (proxy a Vorka OS)', () => {
  // Vorka OS de mentiras (el enlace directo OS): guarda lo que le pidieron
  const conOS = () => {
    const pedidos = [];
    env.OS = { async fetch(req) {
      pedidos.push({ url: req.url, metodo: req.method, h: Object.fromEntries(req.headers), cuerpo: req.method === 'POST' ? await req.text() : null });
      const u = new URL(req.url);
      if (u.pathname === '/con/liga-vieja') return new Response(null, { status: 301, headers: { location: '/citas/dra-lopez' } });
      return new Response('<p>pagina de os</p>', { status: 200, headers: { 'content-type': 'text/html', 'content-security-policy': "default-src 'none'" } });
    } };
    return pedidos;
  };
  it('la página de reservas, la cita, su calendario, la API pública y el logo salen de OS con x-citas-base', async () => {
    const p = conOS();
    const r = await pedir('/citas/Dra-Lopez?utm_source=ig', { ip: '9.9.9.9', headers: { cookie: 'vorka_sesion=secreta' } });
    expect(r.status).toBe(200); expect(await r.text()).toContain('pagina de os');
    expect(r.headers.get('content-security-policy')).toBe("default-src 'none'");
    expect(p[0].url).toBe('https://os.vorka.mx/con/dra-lopez?utm_source=ig');
    expect(p[0].h['x-citas-base']).toBe('1'); expect(p[0].h['cf-connecting-ip']).toBe('9.9.9.9'); expect(p[0].h.cookie).toBeUndefined();
    const tok = 'abcdefghjk23456789mn';
    await pedir(`/citas/cita/${tok}`); await pedir(`/citas/cita/${tok}/calendario.ics`); await pedir('/citas/logo/12?v=a.png');
    await pedir('/citas/api/horarios?n=dra-lopez&s=3&f=2026-11-02');
    await pedir('/citas/api/reservar', { metodo: 'POST', body: { n: 'dra-lopez', nombre: 'Ana' } });
    await pedir(`/citas/api/cita/${tok}/cancelar`, { metodo: 'POST', body: {} });
    expect(p.slice(1).map(x => new URL(x.url).pathname + new URL(x.url).search)).toEqual([`/cita/${tok}`, `/cita/${tok}/calendario.ics`, '/citas/logo/12?v=a.png',
      '/api/citas/publico/horarios?n=dra-lopez&s=3&f=2026-11-02', '/api/citas/publico/reservar', `/api/citas/publico/cita/${tok}/cancelar`]);
    expect(p[5]).toMatchObject({ metodo: 'POST', cuerpo: JSON.stringify({ n: 'dra-lopez', nombre: 'Ana' }) });
    expect(p[5].h['content-type']).toBe('application/json');
    expect(p.every(x => x.h['x-citas-base'] === '1')).toBe(true);
  });
  it('las ligas viejas redirigen como dice OS; lo que no es de los clientes no se le pide a OS', async () => {
    const p = conOS();
    const r = await pedir('/citas/liga-vieja');
    expect(r.status).toBe(301); expect(r.headers.get('location')).toBe('/citas/dra-lopez');
    p.length = 0;
    expect((await pedir('/citas/')).headers.get('location')).toBe('https://agenda.vorka.mx/');
    expect((await pedir('/citas')).status).toBe(301);
    expect((await pedir(`/citas/entrar/${'a'.repeat(64)}`)).headers.get('location')).toBe(`https://agenda.vorka.mx/entrar/${'a'.repeat(64)}`);
    expect((await pedir('/citas/privacidad-clientes')).headers.get('location')).toBe('https://agenda.vorka.mx/citas/privacidad-clientes');
    expect((await pedir('/citas/a/b/c')).headers.get('location')).toBe('https://agenda.vorka.mx/');
    expect((await pedir('/citas/logo/x.png')).status).toBe(302);
    expect(p).toHaveLength(0);
  });
  it('vorka.mx/agenda/ («Agenda tu diagnóstico») no pasa por el proxy de Agenda', async () => {
    const p = conOS();
    expect(rutaCitas('/agenda/')).toBeNull();
    expect((await pedir('/agenda/')).status).toBe(404);   // en producción esa ruta ni siquiera llega a este Worker
    expect((await pedir('/citasx')).status).toBe(404);
    expect(p).toHaveLength(0);
  });
  it('si Vorka OS no responde, la página lo dice en lugar de romperse', async () => {
    env.OS = { fetch: async () => { throw new Error('caído'); } };
    const r = await pedir('/citas/dra-lopez');
    expect(r.status).toBe(503); expect(await r.text()).toContain('<title>Agenda</title>');
  });
});
