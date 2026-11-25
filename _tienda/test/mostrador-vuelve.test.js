// Mostrador + Vuelve en la tienda: productos de la migración, página /tienda/mostrador/, checkout, una suscripción que
// Vuelve ve como suya con su paquete (para abrir Mi mostrador), correo de entrega, sitemap y redirecciones.

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

const subMO = (o = {}) => ({
  id: 'sub_vm', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'mostrador-vuelve', email: 'ana@consultorio.mx', product_id: 'prod_mostrador_vuelve_mensual' },
  items: { data: [renglon('si_vm', 'prod_mostrador_vuelve_mensual', 79900)] }, ...o,
});
async function pagar(slug) {
  const r = await comprar({ slug });
  expect(r.status).toBe(200);
  const { order } = await r.json();
  stripe.orden = order; stripe.sub = subMO(); stripe.total = fila(`SELECT monto_centavos FROM orders WHERE id = '${order}'`).monto_centavos;
  expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
  return order;
}

describe('Mostrador + Vuelve', () => {
  it('la migración deja los dos planes a la venta, ocultos del catálogo, con su app de paquete', async () => {
    const solo = d1().raw.prepare("SELECT slug, precio_centavos, activo, contenido FROM products WHERE slug IN ('mostrador-mensual', 'mostrador-anual') ORDER BY orden").all();
    expect(solo.map(p => [p.slug, p.precio_centavos, p.activo])).toEqual([['mostrador-mensual', 49900, 1], ['mostrador-anual', 499000, 1]]);
    for (const p of solo) expect(JSON.parse(p.contenido)).toMatchObject({ acceso: { app: 'mostrador' } });
    // en el catálogo: el mensual de Mostrador (0098), con su portada; el anual y los paquetes, solo en su ficha
    expect(JSON.parse(solo[0].contenido).oculto).toBeUndefined(); expect(JSON.parse(solo[1].contenido).oculto).toBe(true);
    const cat = await (await pedir('/tienda/')).text();
    expect(cat).toContain('Mostrador · Ventas, inventario y corte'); expect(cat).toContain('mostrador-portada.webp'); expect(cat).toContain('Academias · Alumnos, asistencia y pagos');
    const ps = d1().raw.prepare("SELECT slug, precio_centavos, activo, contenido FROM products WHERE slug LIKE 'mostrador-vuelve-%' ORDER BY orden").all();
    expect(ps.map(p => [p.slug, p.precio_centavos, p.activo])).toEqual([['mostrador-vuelve-mensual', 79900, 1], ['mostrador-vuelve-anual', 799000, 1]]);
    for (const p of ps) expect(JSON.parse(p.contenido)).toMatchObject({ acceso: { app: 'mostrador-vuelve', apps: ['mostrador', 'vuelve'] } });
  });
  it('la página muestra los planes, el formulario y la prueba gratis; sin productos invita a probar', async () => {
    let h = await (await pedir('/tienda/mostrador/?plan=mostrador-vuelve-anual')).text();
    expect(h).toContain('id="form-mo"'); expect(h).toMatch(/value="mostrador-vuelve-anual" checked/); expect(h).toContain('$799'); expect(h).toContain('$499'); expect(h).toContain('value="mostrador-mensual"'); expect(h).toContain('Solo Mostrador'); expect(h).toContain('os.vorka.mx/vuelve/');
    expect(h).not.toMatch(/tel:|Llamar/); expect(h).toContain('Papelerías'); expect(h).toContain('Ferreterías'); expect(h).toContain('href="/tienda/vende/"');
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug LIKE 'mostrador-%'");
    h = await (await pedir('/tienda/mostrador/')).text();
    expect(h).not.toContain('id="form-mo"'); expect(h).toContain('Muy pronto');
  });
  it('rutas: sin diagonal, página de cada plan y sitemap', async () => {
    expect((await pedir('/tienda/mostrador')).headers.get('location')).toBe('https://vorka.mx/tienda/mostrador/');
    expect((await pedir('/tienda/mostrador-vuelve-mensual/')).headers.get('location')).toBe('/tienda/mostrador/?plan=mostrador-vuelve-mensual#comprar');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('/tienda/mostrador/');
  });
  it('Solo Mostrador: Vorka OS lo ve como app «mostrador», no le abre Vuelve, y no se compra encima del paquete', async () => {
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('s9', 'mo@tienda.mx', 'mostrador', 'prod_mostrador_mensual', 'active')");
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('mo@tienda.mx', 'mostrador')).toMatchObject({ vigente: true });
    expect(await A.suscripcionApp('mo@tienda.mx', 'vuelve')).toBeNull();
    expect((await pedir('/tienda/mostrador-anual/')).headers.get('location')).toBe('/tienda/mostrador/?plan=mostrador-anual#comprar');
  });
  it('al pagar: Vuelve lo ve como suscripción con el paquete y el correo lleva a Mi mostrador', async () => {
    await pagar('mostrador-vuelve-mensual');
    const A = new Admin({}, env);
    expect(await A.suscripcionApp('ana@consultorio.mx', 'vuelve')).toMatchObject({ vigente: true, paquete: 'mostrador-vuelve' });
    expect(correos[0].texto).toMatch(/https:\/\/os\.vorka\.mx\/vuelve\/entrar\/[a-f0-9]{64}/);
    expect(correos[0].texto).toContain('Mi mostrador');
    expect((await comprar({ slug: 'vuelve-mensual' })).status).toBe(409);
  });
});
