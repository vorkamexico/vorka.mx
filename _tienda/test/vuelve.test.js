// Vuelve en la tienda: checkout en modo suscripción, webhooks de renovación/falla/cancelación, RPC para Vorka OS,
// ficha /tienda/vuelve/ y la liga corta vorka.mx/vuelve/<negocio>.
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
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@cafe.mx', terminos: true, slug: 'vuelve-mensual', ...extra } });
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const fila = sql => env.DB.raw.prepare(sql).get();

// Suscripción "real" en Stripe (API nueva: periodo en cada item; productos expandidos con su metadata)
const sub = (o = {}) => ({
  id: 'sub_1', status: 'active', customer: 'cus_1', cancel_at_period_end: false, metadata: { order_id: stripe.orden, app: 'vuelve', email: 'laura@cafe.mx', product_id: 'prod_vuelve_mensual' },
  items: { data: [
    { id: 'si_plan', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 39900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_vuelve_mensual' } } } },
    { id: 'si_suc', quantity: 2, current_period_end: 1893456000, price: { unit_amount: 24900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_vuelve_sucursal_mensual' } } } },
  ] }, ...o,
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
      amount_total: 39900 + 2 * 24900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_1' });
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/invoices/')) return ok(stripe.factura);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    if (url.endsWith('/products')) return ok({ id: 'prod_stripe_suc' });
    if (url.includes('/subscription_items')) return ok({ id: 'si_nuevo' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('checkout de Vuelve (suscripción)', () => {
  it('abre Stripe en modo suscripción con el plan y las sucursales adicionales, sin OXXO', async () => {
    const r = await comprar({ sucursales: 2 });
    expect(r.status).toBe(200);
    const { order } = await r.json();
    const o = fila('SELECT * FROM orders');
    expect(o).toMatchObject({ id: order, estado: 'pending', monto_centavos: 39900 + 2 * 24900 });
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('39900');
    expect(p.get('line_items[1][quantity]')).toBe('2');
    expect(p.get('line_items[1][price_data][unit_amount]')).toBe('24900');
    expect(p.get('subscription_data[metadata][app]')).toBe('vuelve');
    expect(p.get('subscription_data[metadata][order_id]')).toBe(order);
    expect(p.get('subscription_data[metadata][email]')).toBe('laura@cafe.mx');
    expect([...p.keys()].some(k => k.startsWith('payment_method_options') || k.startsWith('payment_intent_data'))).toBe(false);
    expect(p.get('allow_promotion_codes')).toBe('true');
  });

  it('el plan anual usa precios anuales y su sucursal anual', async () => {
    await comprar({ slug: 'vuelve-anual', sucursales: 1 });
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
    expect(p.get('line_items[1][price_data][unit_amount]')).toBe('249000');
    expect(p.has('allow_promotion_codes')).toBe(false);
  });

  it('no se regala, no se paga con puntos, no se compra la sucursal sola y no se duplica', async () => {
    expect((await comprar({ regalo: true })).status).toBe(400);
    expect((await comprar({ usar_puntos: true })).status).toBe(400);
    expect((await comprar({ slug: 'vuelve-sucursal-mensual' })).status).toBe(400); // la sucursal no se vende sin plan
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado) VALUES ('sub_x', 'laura@cafe.mx', 'vuelve', 'prod_vuelve_mensual', 'active')");
    const r = await comprar();
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/Ya tienes una suscripción/);
  });
});

describe('webhooks de suscripción', () => {
  async function pagar() {
    const { order } = await (await comprar({ sucursales: 2 })).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    return order;
  }

  it('la primera compra queda pagada, manda el acceso y guarda la suscripción', async () => {
    const order = await pagar();
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(fila('SELECT * FROM suscripciones')).toMatchObject({ id: 'sub_1', email: 'laura@cafe.mx', app: 'vuelve', product_id: 'prod_vuelve_mensual', order_id: order,
      estado: 'active', intervalo: 'month', sucursales: 2, monto_centavos: 39900 + 2 * 24900, periodo_fin: '2030-01-01T00:00:00.000Z' });
    expect(correos).toHaveLength(1);
    expect(correos[0].texto).toMatch(/https:\/\/os\.vorka\.mx\/vuelve\/entrar\/[a-f0-9]{64}/);
    expect(correos[0].texto).toMatch(/se renueva sola/);
  });

  it('renovación, falla de pago y cancelación actualizan el estado (consultando a Stripe)', async () => {
    await pagar();
    const A = new Admin({}, env);
    stripe.factura = { id: 'in_1', parent: { subscription_details: { subscription: 'sub_1' } } };
    stripe.sub = sub({ status: 'past_due' });
    await evento('invoice.payment_failed', 'in_1');
    expect(await A.suscripcionApp('laura@cafe.mx', 'vuelve')).toMatchObject({ estado: 'past_due', vigente: true });
    stripe.sub = sub({ status: 'active', items: { data: [{ ...sub().items.data[0], current_period_end: 1896134400 }] } });
    await evento('invoice.paid', 'in_1');
    expect(await A.suscripcionApp('laura@cafe.mx', 'vuelve')).toMatchObject({ estado: 'active', sucursales: 0, periodo_fin: '2030-02-01T00:00:00.000Z' });
    stripe.sub = sub({ status: 'active', cancel_at_period_end: true });
    await evento('customer.subscription.updated', 'sub_1');
    expect((await A.suscripcionApp('laura@cafe.mx', 'vuelve')).cancelar_al_final).toBe(true);
    stripe.sub = sub({ status: 'canceled' });
    await evento('customer.subscription.deleted', 'sub_1');
    expect(await A.suscripcionApp('laura@cafe.mx', 'vuelve')).toMatchObject({ estado: 'canceled', vigente: false });
    expect(await A.suscripcionApp('otra@cafe.mx', 'vuelve')).toBeNull();
    // Ya cancelada, puede volver a suscribirse
    expect((await comprar()).status).toBe(200);
  });

  it('resumen para Diversificación: MRR (anual / 12) y estados', async () => {
    env.DB.raw.exec(`INSERT INTO suscripciones (id, email, app, product_id, estado, intervalo, monto_centavos, cancelar_al_final) VALUES
      ('s1', 'a@x.mx', 'vuelve', 'prod_vuelve_mensual', 'active', 'month', 39900, 0), ('s2', 'b@x.mx', 'vuelve', 'prod_vuelve_anual', 'active', 'year', 399000, 1),
      ('s3', 'c@x.mx', 'vuelve', 'prod_vuelve_mensual', 'canceled', 'month', 39900, 0)`);
    const r = await new Admin({}, env).resumenSuscripciones('vuelve');
    expect(r).toMatchObject({ vigentes: 2, mrr_centavos: 39900 + 33250, por_cancelar: 1, estados: { active: 2, canceled: 1 } });
  });

  it('portal de Stripe: solo con liga de regreso de vorka.mx y para quien tiene cliente', async () => {
    await pagar();
    const A = new Admin({}, env);
    expect(await A.portalApp('laura@cafe.mx', 'vuelve', 'https://os.vorka.mx/vuelve/#/cuenta')).toEqual({ url: 'https://billing.stripe.com/p/session/x' });
    expect(llamada('/billing_portal/sessions')[0].params.get('customer')).toBe('cus_1');
    await expect(A.portalApp('laura@cafe.mx', 'vuelve', 'https://malo.com/')).rejects.toThrow();
    expect(await A.portalApp('nadie@x.mx', 'vuelve', 'https://os.vorka.mx/vuelve/')).toBeNull();
  });
});

describe('páginas y ligas', () => {
  it('/tienda/vuelve/ muestra planes, precios y el formulario', async () => {
    const r = await pedir('/tienda/vuelve/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('Que tus clientes');
    expect(h).toContain('$399 MXN');
    expect(h).toContain('$3,990 MXN');
    expect(h).toContain('id="form-vuelve"');
    expect(h).toContain('/legal/vuelve/');
  });
  it('llena el correo que manda la app y no refleja correos con código', async () => {
    expect(await (await pedir('/tienda/vuelve/?email=laura%40cafe.mx')).text()).toContain('value="laura@cafe.mx"');
    const h = await (await pedir('/tienda/vuelve/?email=%22%3E%3Cscript%3Ex@y.mx')).text();
    expect(h).not.toContain('<script>x');
    expect(h).toContain('value=""');
  });
  it('sin productos activos invita a la prueba gratis y no muestra el formulario', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug LIKE 'vuelve-%'");
    const h = await (await pedir('/tienda/vuelve/')).text();
    expect(h).not.toContain('id="form-vuelve"');
    expect(h).toContain('empieza tu prueba gratis');
  });
  it('la página de cada plan redirige a la ficha con el plan elegido', async () => {
    const r = await pedir('/tienda/vuelve-anual/');
    expect(r.headers.get('location')).toBe('/tienda/vuelve/?plan=vuelve-anual#comprar');
    const m = await pedir('/tienda/vuelve-mensual/');
    expect(m.headers.get('location')).toBe('/tienda/vuelve/?plan=vuelve-mensual#comprar');
  });
  // Vorka OS de mentiras (el enlace directo OS): responde según la ruta y guarda lo que le pidieron
  const conOS = (resp = {}) => {
    const pedidos = [];
    env.OS = { async fetch(req) {
      const u = new URL(req.url); pedidos.push({ url: req.url, metodo: req.method, h: Object.fromEntries(req.headers), cuerpo: req.method === 'POST' ? await req.text() : null });
      const r = resp[u.pathname]; return r ? new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } }) : new Response('<p>pagina de os</p>', { status: 200, headers: { 'content-type': 'text/html', 'content-security-policy': "default-src 'none'" } });
    } };
    return pedidos;
  };
  it('vorka.mx/vuelve/… muestra las páginas de los clientes sin mandarlos a os.vorka.mx', async () => {
    const p = conOS();
    let r = await worker.fetch(new Request('https://vorka.mx/vuelve/cafe-la-paloma-x7k2?ref=ab', { headers: { 'cf-connecting-ip': '9.9.9.9', cookie: 'vorka_sesion=secreta' }, redirect: 'manual' }), env);
    expect(r.status).toBe(200); expect(r.headers.get('location')).toBeNull();
    expect(await r.text()).toContain('pagina de os');
    expect(r.headers.get('content-security-policy')).toBe("default-src 'none'");
    expect(p[0].url).toBe('https://os.vorka.mx/v/cafe-la-paloma-x7k2?ref=ab');
    expect(p[0].h['x-vuelve-base']).toBe('1'); expect(p[0].h['cf-connecting-ip']).toBe('9.9.9.9'); expect(p[0].h.cookie).toBeUndefined();
    await pedir('/vuelve/negocios'); await pedir('/vuelve/c/abcdefghij0123456789/pase.pkpass'); await pedir('/vuelve/logo/3/web/121212.png?v=a'); await pedir('/vuelve/tema.js?v=1'); await pedir('/vuelve/producto/7.jpg?v=a');
    await pedir('/vuelve/api/registro', { metodo: 'POST', body: { slug: 'cafe', nombre: 'Ana' } });
    expect(p.slice(1).map(x => new URL(x.url).pathname)).toEqual(['/negocios', '/c/abcdefghij0123456789/pase.pkpass', '/vuelve/logo/3/web/121212.png', '/vuelve/tema.js', '/vuelve/producto/7.jpg', '/api/vuelve/publico/registro']);
    expect(p.at(-1)).toMatchObject({ metodo: 'POST', cuerpo: JSON.stringify({ slug: 'cafe', nombre: 'Ana' }) });
    expect(p.at(-1).h['content-type']).toBe('application/json');
    // lo que no es de los clientes no se le pide a OS
    expect((await pedir('/vuelve/')).headers.get('location')).toBe('/tienda/vuelve/');
    expect((await pedir('/vuelve/api/../../admin')).status).not.toBe(200);
    expect(p.length).toBe(7);
  });
  it('si Vorka OS no responde, la página lo dice en lugar de romperse', async () => {
    env.OS = { fetch: async () => { throw new Error('caído'); } };
    const r = await pedir('/vuelve/cafe-la-paloma-x7k2');
    expect(r.status).toBe(503); expect(await r.text()).toContain('Intenta de nuevo');
  });
  it('la ficha: ejemplos honestos, comprobante de pago, ejemplo en vivo, calculadora y "te lo dejamos listo"', async () => {
    conOS({ '/api/vuelve/publico/directorio': { total: 2, visible: false } });
    const h = await (await pedir('/tienda/vuelve/')).text();
    expect(h).not.toContain('tarjetas reales'); expect(h).toContain('Estos son ejemplos');
    expect(h).not.toMatch(/factura de tu suscripci/); expect(h).toContain('comprobante de pago');
    expect(h).not.toContain('href="/vuelve/negocios"');   // con menos de 5 negocios el directorio no se presume
    expect(h).toContain('href="https://vorka.mx/vuelve/demo"'); expect(h).toContain('aria-label="Código QR de la tarjeta de ejemplo"');
    expect(h).toContain('id="vu-calc"'); expect(h).toContain('data-precio="399"');
    expect(h).toContain('Te lo dejamos listo'); expect(h).toContain('https://wa.me/528117804869?text=');
    expect(h).toContain('Pruébalo 7 días gratis');
    conOS({ '/api/vuelve/publico/directorio': { total: 6, visible: true } });
    expect(await (await pedir('/tienda/vuelve/')).text()).toContain('href="/vuelve/negocios"');
  });
  it('recomendado por otro negocio: lo dice, la prueba es de 30 días y la liga a la app lleva quién lo recomendó', async () => {
    const p = conOS({ '/api/vuelve/publico/directorio': { total: 0, visible: false }, '/api/vuelve/publico/recomienda/cafe-la-paloma': { nombre: 'Café <La> Paloma', dias: 30 } });
    const r = await pedir('/tienda/vuelve/?invita=cafe-la-paloma&o=tarjeta');
    const h = await r.text();
    expect(h).toContain('Te recomendó <b>Café &lt;La&gt; Paloma</b>'); expect(h).toContain('Pruébalo 30 días gratis');
    expect(h).toContain('https://os.vorka.mx/vuelve/?invita=cafe-la-paloma&amp;o=tarjeta#/nuevo');
    expect(r.headers.get('set-cookie')).toContain('vu_fuente=cafe-la-paloma%7Ctarjeta');
    expect(p.some(x => x.url.endsWith('/recomienda/cafe-la-paloma'))).toBe(true);
    // regresa días después sin la liga: la cookie lo recuerda
    const h2 = await (await worker.fetch(new Request('https://vorka.mx/tienda/vuelve/', { headers: { cookie: 'vu_fuente=cafe-la-paloma%7Ctarjeta' } }), env)).text();
    expect(h2).toContain('?invita=cafe-la-paloma&amp;o=tarjeta#/nuevo');
    // un negocio que no existe no da 30 días ni se presume
    const h3 = await (await pedir('/tienda/vuelve/?invita=no-existe')).text();
    expect(h3).not.toContain('class="vu-reco"'); expect(h3).toContain('Pruébalo 7 días gratis'); expect(h3).not.toContain('invita=no-existe');
  });
  it('de dónde llega: utm_source o el sitio de donde viene', async () => {
    conOS();
    const r = await worker.fetch(new Request('https://vorka.mx/tienda/vuelve/', { headers: { referer: 'https://l.instagram.com/?u=x' } }), env);
    expect(r.headers.get('set-cookie')).toContain('vu_fuente=%7Cinstagram');
    expect(await r.text()).toContain('?o=instagram#/nuevo');
    expect((await (await pedir('/tienda/vuelve/?utm_source=Folleto_Celaya')).text())).toContain('?o=folleto_celaya#/nuevo');
  });

  it('lugares adicionales (sucursales o negocios): cambia la cantidad en Stripe, lo agrega si no existe y lo quita con 0', async () => {
    const { order } = await (await comprar({ sucursales: 2 })).json();
    stripe.orden = order; stripe.sub = sub();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    const A = new Admin({}, env);
    await A.lugaresApp('laura@cafe.mx', 'vuelve', 3);
    let c = llamadas.at(-2);
    expect(c.url).toBe('https://api.stripe.com/v1/subscription_items/si_suc');
    expect(c.params.get('quantity')).toBe('3');
    expect(c.params.get('proration_behavior')).toBe('create_prorations');
    // sin cambio, no le habla a Stripe para cambiar nada
    llamadas = []; await A.lugaresApp('laura@cafe.mx', 'vuelve', 2);
    expect(llamada('/subscription_items')).toHaveLength(0);
    // con 0 se quita el renglón
    await A.lugaresApp('laura@cafe.mx', 'vuelve', 0);
    expect(llamada('/subscription_items/si_suc')[0].init.method).toBe('DELETE');
    // si la suscripción no lo tiene, se agrega con el producto de Stripe del complemento (creado una sola vez)
    stripe.sub = sub({ items: { data: [sub().items.data[0]] } });
    llamadas = []; await A.lugaresApp('laura@cafe.mx', 'vuelve', 1); await A.lugaresApp('laura@cafe.mx', 'vuelve', 2);
    expect(llamada('/products')).toHaveLength(1);
    const nuevo = llamada('/subscription_items').filter(l => l.url.endsWith('/subscription_items'))[0].params;
    expect(Object.fromEntries(nuevo)).toMatchObject({ subscription: 'sub_1', quantity: '1', 'price_data[product]': 'prod_stripe_suc', 'price_data[unit_amount]': '24900', 'price_data[recurring][interval]': 'month', 'price_data[currency]': 'mxn' });
    await expect(A.lugaresApp('laura@cafe.mx', 'vuelve', 99)).rejects.toThrow(/de 0 a 50/);
    await expect(A.lugaresApp('nadie@x.mx', 'vuelve', 1)).rejects.toThrow(/No hay una suscripción vigente/);
  });
});
