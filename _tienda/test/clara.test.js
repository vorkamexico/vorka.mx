// Clara en la tienda: ficha /tienda/clara/, checkout de Clara Pro en modo suscripción (mensual y anual), correo de acceso a
// clara.vorka.mx y RPC que usa la app (validarAcceso, suscripcionApp). Los productos entran inactivos: aquí se activan.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { lineaDe } from '../src/portafolio.js';
import { enc, hex } from '../src/util.js';

const SECRETO = 'whsec_prueba';
let env, llamadas, stripe, correos;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, status: 'active', payment_status: 'paid' } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1' } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Sofía Ruiz', email: 'sofia@correo.mx', terminos: true, slug: 'clara-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

const sub = (o = {}) => ({
  id: 'sub_c1', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'clara', email: 'sofia@correo.mx', product_id: 'prod_clara_mensual' },
  items: { data: [{ id: 'si_plan', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 4900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_clara_mensual' } } } }] }, ...o,
});

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  llamadas = []; correos = []; stripe = { orden: null, sub: null, factura: null };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body) });
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/checkout/sessions')) { const id = `cs_${llamada('/checkout/sessions').length}`; return ok({ id, url: `https://checkout.stripe.com/c/pay/${id}` }); }
    if (url.includes('/checkout/sessions/')) return ok({ id: 'cs_1', mode: 'subscription', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden,
      amount_total: 4900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_c1' });
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/invoices/')) return ok(stripe.factura);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Clara entra inactiva', () => {
  it('los productos existen inactivos, el anual oculto, y la ficha invita a empezar gratis sin formulario de compra', async () => {
    expect(fila("SELECT activo, precio_centavos FROM products WHERE id = 'prod_clara_mensual'")).toMatchObject({ activo: 0, precio_centavos: 4900 });
    expect(fila("SELECT activo, precio_centavos, json_extract(contenido, '$.oculto') oculto FROM products WHERE id = 'prod_clara_anual'")).toMatchObject({ activo: 0, precio_centavos: 49000, oculto: 1 });
    const r = await pedir('/tienda/clara/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('https://clara.vorka.mx/entrar');
    expect(h).not.toContain('id="form-clara"');
    expect((await comprar()).status).not.toBe(200);
  });
});

describe('ficha de Clara (activa)', () => {
  beforeEach(() => env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_clara_%'"));
  it('muestra los dos planes, la nota de pagar por alguien más y los avisos legales', async () => {
    const h = await (await pedir('/tienda/clara/')).text();
    expect(h).toContain('$49 MXN');
    expect(h).toContain('$490 MXN');
    expect(h).toContain('value="clara-mensual" checked');
    expect(h).toContain('value="clara-anual"');
    expect(h).toContain('id="form-clara"');
    expect(h).toContain('Si pagas por alguien más (por ejemplo, tu hijo), usa en la compra el mismo correo con el que esa persona entra a Clara.');
    expect(h).toContain('/legal/clara/privacidad/');
    expect(h).toContain('/learn/finanzas/como-funciona-una-tarjeta-de-credito/');
    expect(h).toMatch(/no es asesoría financiera/i);
    expect(await (await pedir('/tienda/clara/?plan=clara-anual')).text()).toContain('value="clara-anual" checked');
  });
  it('sin la diagonal final redirige y aparece en el catálogo', async () => {
    expect((await pedir('/tienda/clara')).status).toBe(301);
    expect(await (await pedir('/tienda/')).text()).toContain('/tienda/clara/');
  });
  it('checkout mensual y anual en modo suscripción con la app en la metadata', async () => {
    expect((await comprar()).status).toBe(200);
    let p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('4900');
    expect(p.get('subscription_data[metadata][app]')).toBe('clara');
    expect((await comprar({ slug: 'clara-anual', email: 'otra@correo.mx' })).status).toBe(200);
    p = llamada('/checkout/sessions')[1].params;
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('49000');
  });
  it('al pagar manda el botón para entrar a Clara y la app ve la suscripción', async () => {
    const { order } = await (await comprar()).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    const m = correos[0].texto.match(/https:\/\/clara\.vorka\.mx\/entrar\/([a-f0-9]{64})/);
    expect(m).toBeTruthy();
    expect(correos[0].texto).toMatch(/Clara › Ajustes/);
    const A = new Admin({}, env);
    expect(await A.validarAcceso(m[1], 'clara')).toMatchObject({ email: 'sofia@correo.mx' });
    expect(await A.suscripcionApp('sofia@correo.mx', 'clara')).toMatchObject({ vigente: true, intervalo: 'month', monto_centavos: 4900 });
  });
  it('al borrar la cuenta en Clara, la app cancela Pro: sin más cobros, al final del periodo pagado', async () => {
    const { order } = await (await comprar()).json();
    stripe.orden = order; stripe.sub = sub();
    await evento('checkout.session.completed', 'cs_1');
    const A = new Admin({}, env);
    expect(await A.cancelarApp('Sofia@Correo.mx', 'clara')).toMatchObject({ ok: true });
    const c = llamada('/subscriptions/sub_c1').filter(l => l.init.method === 'POST');
    expect(c).toHaveLength(1);
    expect(c[0].params.get('cancel_at_period_end')).toBe('true');
    expect(fila("SELECT cancelar_al_final FROM suscripciones WHERE id = 'sub_c1'").cancelar_al_final).toBe(1);
    expect(await A.cancelarApp('sofia@correo.mx', 'clara')).toMatchObject({ ok: true });
    expect(llamada('/subscriptions/sub_c1').filter(l => l.init.method === 'POST')).toHaveLength(1);
    expect(await A.cancelarApp('nadie@correo.mx', 'clara')).toEqual({ ok: false, motivo: 'sin_suscripcion' });
  });
  it('en el portafolio cuenta como línea propia', () => {
    expect(lineaDe('prod_clara_mensual')).toBe('clara');
    expect(lineaDe('prod_clara_anual')).toBe('clara');
  });
});
