// Toolkit Vorka (migración 0063, src/toolkit.js y src/toolkit-paginas.js): suscripción con saldo mensual en un libro de
// movimientos. Abonos por factura (sin duplicar), compras con saldo que se entregan igual que una compra, saldo insuficiente,
// compras simultáneas, meses de apps como cortesía, códigos de regalo (sacar, canjear sin cuenta, un solo uso, devolver al
// saldo), el saldo nunca vence (tras cancelar sigue usable y no hay abonos nuevos), reembolsos, sin puntos dobles y
// productos de creadores fuera.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { crearSesion, codigoDe } from '../src/puntos.js';
import { crearCortesias } from '../src/regalos.js';
import { suscripcionApp, cortesiaApp } from '../src/suscripciones.js';
import { TEXTO_FUNDADOR } from '../src/pagos/stripe.js';
import {
  FUNDADOR, EXCLUIDO_CREADOR, estadoToolkit, saldoToolkit, abonoToolkit, pagarConSaldo, pagarMesesApp, sacarCodigos, canjearCodigo,
  devolverCodigo, codigosDe, reembolsoToolkit, cotizar,
} from '../src/toolkit.js';

const SECRETO = 'whsec_prueba';
const YO = 'ana@correo.mx';
const DIA = 864e5;
let env, llamadas, stripe, correos;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto, extra = {}) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, ...extra } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
let galleta = '';
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1', cookie = galleta } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
  body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const entrar = async (email = YO) => { galleta = (await crearSesion(env, email)).split(';')[0]; };
const fila = (sql, ...a) => env.DB.raw.prepare(sql).get(...a);
const filas = (sql, ...a) => env.DB.raw.prepare(sql).all(...a);
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const cerca = (iso, ms) => expect(Math.abs(Date.parse(iso) - ms)).toBeLessThan(3 * DIA);

// Suscripción y factura "reales" de Stripe para el Toolkit
const subStripe = (o = {}) => ({
  id: 'sub_tk', status: 'active', customer: 'cus_1', cancel_at_period_end: false, created: 1,
  metadata: { order_id: stripe.orden || 'ord_x', app: 'toolkit', email: YO, product_id: o.product_id || 'prod_toolkit_mensual' },
  items: { data: [{ id: 'si_1', quantity: 1, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    price: { unit_amount: 59900, recurring: { interval: 'month' }, product: { metadata: { product_id: o.product_id || 'prod_toolkit_mensual' } } } }] }, ...o,
});
const factura = (id, o = {}) => ({ id, status: 'paid', total: 59900, amount_paid: 59900, billing_reason: o.billing_reason || 'subscription_cycle',
  parent: { subscription_details: { subscription: 'sub_tk' } }, payments: { data: [{ status: 'paid', payment: { payment_intent: o.pi || `pi_${id}` } }] },
  lines: { data: [{ period: { end: Math.floor(Date.now() / 1000) + 30 * 86400 } }] }, status_transitions: { paid_at: Math.floor(Date.now() / 1000) }, ...o });
async function pagarFactura(id, o = {}) {
  stripe.sub = subStripe(o.sub || {});
  stripe.factura = factura(id, o);
  expect((await evento('invoice.paid', id)).status).toBe(200);
}
// Saldo directo (sin pasar por Stripe) para las pruebas que no son de abonos
const abonar = (centavos, email = YO, clave = `factura:in_${Math.random().toString(36).slice(2)}`) =>
  env.DB.raw.prepare("INSERT INTO toolkit_movimientos (email, tipo, centavos, clave, plan, periodo_fin) VALUES (?, 'abono', ?, ?, 'toolkit', ?)").run(email, centavos, clave, new Date(Date.now() + 30 * DIA).toISOString());
const suscribir = (estado = 'active', email = YO, o = {}) => env.DB.raw.prepare(`INSERT OR REPLACE INTO suscripciones (id, email, app, product_id, customer_id, estado, intervalo, periodo_fin, cancelar_al_final, monto_centavos)
  VALUES (?, ?, 'toolkit', ?, 'cus_1', ?, 'month', ?, ?, 59900)`).run(o.id || 'sub_tk', email, o.product_id || 'prod_toolkit_mensual', estado, o.periodo_fin || new Date(Date.now() + 20 * DIA).toISOString(), o.cancelar ? 1 : 0);

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  llamadas = []; correos = []; stripe = { orden: null, sub: null, factura: null, pi: null }; galleta = '';
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body) });
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/checkout/sessions')) return ok({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
    if (url.includes('/checkout/sessions/')) {
      const o = fila('SELECT monto_centavos FROM orders WHERE id = ?', stripe.orden);
      return ok({ id: 'cs_1', mode: 'subscription', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden, amount_total: o?.monto_centavos, currency: 'mxn',
        status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_tk' });
    }
    if (url.includes('/coupons/') && (init.method || 'GET') === 'GET') return new Response('{"error":{"message":"no"}}', { status: 404 });
    if (url.endsWith('/coupons')) return ok({ id: 'vorka_ref5' });
    if (url.endsWith('/products')) return ok({ id: 'prod_stripe_' + new URLSearchParams(init.body).get('metadata[product_id]') });
    if (url.endsWith('/prices')) return ok({ id: 'price_' + new URLSearchParams(init.body).get('metadata[product_id]') + '_' + new URLSearchParams(init.body).get('unit_amount') });
    if (url.endsWith('/invoices/create_preview')) return stripe.preview instanceof Error ? new Response('{"error":{"message":"caído"}}', { status: 500 }) : ok(stripe.preview);
    if (url.includes('/subscriptions/') && init.method === 'POST') { const r = stripe.actualizar(new URLSearchParams(init.body)); return r.http ? new Response(JSON.stringify(r.body), { status: r.http }) : ok(r); }
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (/\/invoices\/[^/]+\/void$/.test(url)) return ok({ status: 'void' });
    if (url.includes('/invoices/')) return ok(stripe.factura);
    if (url.includes('/payment_intents/')) return ok(stripe.pi);
    if (url.endsWith('/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('el texto del precio fundador', () => {
  it('es el mismo en la ficha, el checkout de Stripe y el correo', () => {
    expect(TEXTO_FUNDADOR).toBe(FUNDADOR);
    expect(FUNDADOR).toBe('Precio fundador garantizado por tus primeros 3 meses. Desde el 4.º mes el precio o el bono pueden cambiar; te avisamos por correo con 30 días de anticipación y puedes cancelar cuando quieras.');
  });
});

describe('suscribirse al Toolkit (checkout de Stripe)', () => {
  it('modo suscripción con precio en línea, aviso fundador junto al botón y sin códigos de promoción de Stripe', async () => {
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: YO, terminos: true, slug: 'toolkit-mensual' } });
    expect(r.status).toBe(200);
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('59900');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('subscription_data[metadata][app]')).toBe('toolkit');
    expect(p.get('custom_text[submit][message]')).toBe(FUNDADOR);
    expect(p.has('allow_promotion_codes')).toBe(false);
  });

  it('los códigos de descuento no aplican (se avisa) y Pro cobra $1,199', async () => {
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: YO, terminos: true, slug: 'toolkit-pro-mensual', codigo: 'FUNDADOR30' } });
    const j = await r.json();
    expect(j.aviso).toMatch(/no aplican en el Toolkit/);
    expect(fila('SELECT monto_centavos, descuento_centavos FROM orders')).toEqual({ monto_centavos: 119900, descuento_centavos: 0 });
    expect(llamada('/checkout/sessions')[0].params.has('discounts[0][coupon]')).toBe(false);
  });

  it('no se compra dos veces con el mismo correo', async () => {
    suscribir();
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: YO, terminos: true, slug: 'toolkit-pro-mensual' } });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/Ya tienes un Toolkit activo/);
  });

  it('la bienvenida dice cuánto recibe, que el saldo nunca vence y el precio fundador; su botón abre Mi Toolkit', async () => {
    const { order } = await (await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: YO, terminos: true, slug: 'toolkit-mensual' } })).json();
    stripe.orden = order; stripe.sub = subStripe();
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(correos).toHaveLength(1);
    const c = correos[0];
    expect(c.asunto).toBe('Tu Toolkit ya está activo');
    expect(c.texto).toContain('$800 MXN de saldo');
    expect(c.texto).toContain('nunca vence');
    expect(c.texto).toContain(FUNDADOR);
    const liga = c.texto.match(/https:\/\/vorka\.mx(\/tienda\/toolkit\/entrar\/[a-f0-9]{64})/)[1];
    const r = await pedir(liga, { cookie: '' });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/tienda/mi-toolkit/');
    galleta = r.headers.get('set-cookie').split(';')[0];
    expect(await (await pedir('/tienda/mi-toolkit/')).text()).toContain('Tu saldo del Toolkit');
  });
});

describe('abonos por factura pagada', () => {
  it('cada factura abona el bono de su plan una sola vez, aunque el webhook se repita', async () => {
    await pagarFactura('in_1', { billing_reason: 'subscription_create' });
    await pagarFactura('in_1', { billing_reason: 'subscription_create' });
    await pagarFactura('in_1', { billing_reason: 'subscription_create' });
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(filas("SELECT tipo, centavos, factura_id, pago_id FROM toolkit_movimientos")).toEqual([{ tipo: 'abono', centavos: 80000, factura_id: 'in_1', pago_id: 'pi_in_1' }]);
  });

  it('se acumula mes con mes sin tope; Pro abona $1,800', async () => {
    for (const id of ['in_1', 'in_2', 'in_3']) await pagarFactura(id);
    expect(await saldoToolkit(env, YO)).toBe(240000);
    // Se pasa a Pro: cancela su Toolkit y abre una suscripción nueva (el portal no cambia de plan)
    env.DB.raw.exec("UPDATE suscripciones SET estado = 'canceled' WHERE id = 'sub_tk'");
    await pagarFactura('in_4', { sub: { id: 'sub_pro', product_id: 'prod_toolkit_pro_mensual' }, total: 119900, amount_paid: 119900 });
    expect(await saldoToolkit(env, YO)).toBe(420000);
    const e = await estadoToolkit(env, YO);
    expect(e).toMatchObject({ activo: true, usable: true, plan: { nombre: 'Toolkit Pro', bono_centavos: 180000 } });
    expect(e.proximo_abono.centavos).toBe(180000);
  });

  it('una factura de $0 (cupón del 100 %) no regala saldo', async () => {
    await pagarFactura('in_cero', { total: 0, amount_paid: 0 });
    expect(await saldoToolkit(env, YO)).toBe(0);
  });

  it('las facturas de otras apps no tocan el saldo', async () => {
    expect(await abonoToolkit(env, factura('in_v'), subStripe(), { app: 'vuelve', email: YO, product_id: 'prod_vuelve_mensual' })).toBeNull();
    expect(await saldoToolkit(env, YO)).toBe(0);
  });
});

describe('comprar con saldo', () => {
  it('crea la orden pagada y la entrega igual que una compra normal (mismo correo y enlace de descarga)', async () => {
    abonar(80000); suscribir(); await entrar();
    const r = await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'de-idea-a-proyecto', nombre: 'Ana Ruiz' } });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j).toMatchObject({ ok: true, entregado: true, saldo_centavos: 80000 - 27900 });
    expect(j.url).toBe(`/tienda/gracias?order=${j.order_id}`);
    expect(fila('SELECT email, nombre, estado, proveedor, monto_centavos, saldo_centavos, ref_code FROM orders WHERE id = ?', j.order_id))
      .toEqual({ email: YO, nombre: 'Ana Ruiz', estado: 'paid', proveedor: 'saldo', monto_centavos: 0, saldo_centavos: 27900, ref_code: null });
    expect(fila('SELECT COUNT(*) n FROM download_tokens WHERE order_id = ?', j.order_id).n).toBe(1);
    expect(correos).toHaveLength(1);
    expect(correos[0].asunto).toMatch(/^Tu descarga: /);
    expect(correos[0].texto).toMatch(/Lo pagaste con tu saldo del Toolkit/);
    expect(correos[0].texto).toMatch(/https:\/\/vorka\.mx\/descargas\/[a-f0-9]{64}/);
    expect(fila("SELECT tipo, centavos, order_id FROM toolkit_movimientos WHERE tipo = 'compra'")).toEqual({ tipo: 'compra', centavos: -27900, order_id: j.order_id });
    // No cuenta como venta en el panel (el ingreso fue la factura del Toolkit)
    expect((await new Admin({}, env).resumen({})).ventas).toBe(0);
  });

  it('un producto de acceso (simulador) llega con su botón de entrar', async () => {
    abonar(80000); await entrar();
    const j = await (await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'simulador-paa-practica' } })).json();
    expect(j.ok).toBe(true);
    expect(correos[0].texto).toMatch(/simulador-paa\/entrar\/[a-f0-9]{64}/);
  });

  it('saldo insuficiente: no cobra nada y dice cuánto falta', async () => {
    abonar(10000); await entrar();
    const r = await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'de-idea-a-proyecto' } });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/Te faltan \$179 MXN de saldo/);
    expect(fila('SELECT COUNT(*) n FROM orders').n).toBe(0);
    expect(await saldoToolkit(env, YO)).toBe(10000);
    const q = await cotizar(env, YO, 'de-idea-a-proyecto');
    expect(q).toMatchObject({ ok: true, alcanza: false, falta: 17900, total: 27900 });
  });

  it('dos compras simultáneas no dejan el saldo negativo: solo una pasa', async () => {
    abonar(30000);
    const rs = await Promise.all([pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' }), pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' })]);
    expect(rs.filter(r => r.ok)).toHaveLength(1);
    expect(rs.filter(r => r.error)).toHaveLength(1);
    expect(await saldoToolkit(env, YO)).toBe(2100);
    expect(fila("SELECT COUNT(*) n FROM orders WHERE proveedor = 'saldo'").n).toBe(1);
    expect(fila("SELECT COUNT(*) n FROM toolkit_movimientos WHERE tipo = 'compra'").n).toBe(1);
  });

  it('sin sesión o sin Toolkit no se puede; el Toolkit no se paga con saldo', async () => {
    expect((await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'de-idea-a-proyecto' } })).status).toBe(401);
    await entrar('otra@correo.mx');
    expect((await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'de-idea-a-proyecto' } })).status).toBe(403);
    abonar(200000);
    expect((await pagarConSaldo(env, { email: YO, slug: 'toolkit-mensual' })).error).toMatch(/no se puede pagar con saldo/);
    expect((await sacarCodigos(env, { email: YO, slug: 'toolkit-pro-mensual', cantidad: 1 })).error).toMatch(/No se pueden sacar códigos del Toolkit/);
  });

  it('el saldo de la cuenta se ve en la página del producto (la API que usa el botón)', async () => {
    abonar(80000); await entrar();
    expect(await (await pedir('/api/toolkit/saldo')).json()).toMatchObject({ cuenta: true, toolkit: true, usable: true, saldo_centavos: 80000 });
    expect(await (await pedir('/api/toolkit/saldo', { cookie: '' })).json()).toEqual({ cuenta: false });
    const html = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(html).toContain('/api/toolkit/saldo');
  });
});

describe('meses de apps con saldo (como cortesía)', () => {
  it('Clara: 2 meses → la app lo ve como cortesía con su fecha', async () => {
    abonar(80000);
    const r = await pagarMesesApp(env, { email: YO, nombre: 'Ana', app: 'clara', meses: 2 });
    expect(r.ok).toBe(true);
    expect(await saldoToolkit(env, YO)).toBe(80000 - 2 * 4900);
    const s = await new Admin({}, env).suscripcionApp(YO, 'clara');
    expect(s).toMatchObject({ vigente: true, cortesia: true, estado: 'active', monto_centavos: 0, order_id: r.order_id });
    cerca(s.periodo_fin, Date.now() + 61 * DIA);
    expect((await cortesiaApp(env, YO, 'clara')).periodo_fin).toBe(s.periodo_fin);
    expect(correos[0].texto).toMatch(/Lo pagaste con tu saldo del Toolkit: tu acceso está activo hasta el/);
    expect(correos[0].texto).toMatch(/clara\.vorka\.mx\/entrar\/[a-f0-9]{64}/);
  });

  it('si ya tiene cortesía, el mes se suma después de su fin', async () => {
    abonar(80000);
    await crearCortesias(env, { product_id: 'prod_cuentas_mensual', modo: 'correo', cantidad: 1, nombre: 'Ana', email: YO });
    const antes = (await suscripcionApp(env, YO, 'cuentas')).periodo_fin;
    const r = await pagarMesesApp(env, { email: YO, app: 'cuentas', meses: 1 });
    expect(r.desde).toBe(antes);
    const s = await suscripcionApp(env, YO, 'cuentas');
    expect(s.cortesia).toBe(true);
    cerca(s.periodo_fin, Date.parse(antes) + 30.5 * DIA);
  });

  it('si ya canceló la renovación con tarjeta, el mes con saldo empieza cuando termina lo pagado', async () => {
    abonar(80000);
    env.DB.raw.prepare(`INSERT INTO suscripciones (id, email, app, product_id, customer_id, estado, intervalo, periodo_fin, cancelar_al_final, monto_centavos) VALUES ('sub_v', ?, 'vende', 'prod_vende_mensual', 'cus_1', 'active', 'month', '2030-01-01T00:00:00.000Z', 1, 9900)`).run(YO);
    const r = await pagarMesesApp(env, { email: YO, app: 'vende', meses: 1 });
    expect(r.ok).toBe(true);
    expect(r.desde).toBe('2030-01-01T00:00:00.000Z');
    expect(r.aviso).toMatch(/termina el 31 de diciembre de 2029: el mes pagado con saldo empieza ese día/);
    expect((await cortesiaApp(env, YO, 'vende')).periodo_fin).toBe('2030-02-01T00:00:00.000Z');
  });

  it('el botón de la ficha de una app paga 1 mes; sin saldo suficiente, nada', async () => {
    abonar(5000); await entrar();
    const q = await (await pedir('/api/toolkit/cotizar', { metodo: 'POST', body: { slug: 'agenda-mensual' } })).json();
    expect(q).toMatchObject({ ok: true, tipo: 'app', app: 'agenda', total: 9900, alcanza: false, falta: 4900 });
    expect((await pagarMesesApp(env, { email: YO, app: 'agenda', meses: 1 })).status).toBe(409);
    expect((await pagarMesesApp(env, { email: YO, app: 'agenda-vuelve', meses: 1 })).status).toBe(400);
  });
});

describe('códigos de regalo', () => {
  it('se sacan con el precio de lista, se canjean sin cuenta (pide correo) y funcionan una sola vez', async () => {
    abonar(80000); await entrar();
    const r = await (await pedir('/api/toolkit/codigos', { metodo: 'POST', body: { slug: 'simulador-paa-practica', cantidad: 3 } })).json();
    expect(r.codigos).toHaveLength(3);
    r.codigos.forEach(c => expect(c).toMatch(/^TK-[A-Z0-9]{4}-[A-Z0-9]{4}$/));
    expect(await saldoToolkit(env, YO)).toBe(80000 - 3 * 19900);
    expect(fila("SELECT centavos, cantidad FROM toolkit_movimientos WHERE tipo = 'codigos'")).toEqual({ centavos: -59700, cantidad: 3 });
    // La página del código la abre cualquiera
    const pag = await (await pedir(`/tienda/canjear/${r.codigos[0]}`, { cookie: '' })).text();
    expect(pag).toContain('Simulador PAA');
    // Canje sin cuenta, con su correo
    const c = await pedir('/api/toolkit/canjear', { metodo: 'POST', cookie: '', body: { codigo: r.codigos[0].toLowerCase(), nombre: 'Luis', email: 'Luis@Correo.mx', terminos: true } });
    expect(c.status).toBe(200);
    expect((await c.json()).mensaje).toMatch(/Te mandamos a l•••@correo\.mx tu acceso/);
    const o = fila("SELECT * FROM orders WHERE email = 'luis@correo.mx'");
    expect(o).toMatchObject({ estado: 'paid', proveedor: 'saldo', monto_centavos: 0, toolkit_codigo: r.codigos[0], ref_code: null });
    expect(correos.at(-1).para).toBe('luis@correo.mx');
    expect(correos.at(-1).texto).toMatch(/¡Te regalaron/);
    // Un solo uso
    const otra = await pedir('/api/toolkit/canjear', { metodo: 'POST', cookie: '', body: { codigo: r.codigos[0], nombre: 'Pepe', email: 'pepe@correo.mx', terminos: true } });
    expect(otra.status).toBe(410);
    expect((await codigosDe(env, YO)).find(x => x.codigo === r.codigos[0]).estado).toBe('usado');
    // Mi Toolkit los muestra con copiar, WhatsApp y devolver
    const mi = await (await pedir('/tienda/mi-toolkit/?v=codigos')).text();
    expect(mi).toContain(r.codigos[1]);
    expect(mi).toContain('wa.me/?text=');
    expect(mi).toContain('no vence');
  });

  it('dos canjes simultáneos del mismo código: solo uno gana', async () => {
    abonar(80000);
    const { codigos: [k] } = await sacarCodigos(env, { email: YO, slug: 'de-idea-a-proyecto', cantidad: 1 });
    const rs = await Promise.all(['a@x.mx', 'b@x.mx'].map(email => canjearCodigo(env, { codigo: k, nombre: 'X', email })));
    expect(rs.filter(r => r.ok)).toHaveLength(1);
    expect(fila("SELECT COUNT(*) n FROM orders WHERE toolkit_codigo = ?", k).n).toBe(1);
  });

  it('un código de una app da 1 mes de cortesía a quien lo canjea', async () => {
    abonar(80000);
    const { codigos: [k] } = await sacarCodigos(env, { email: YO, slug: 'cuentas-anual', cantidad: 1 });   // el anual se regala como 1 mes del mensual
    expect(fila('SELECT producto, precio_centavos, product_id FROM toolkit_codigos')).toEqual({ producto: '1 mes de Cuentas', precio_centavos: 9900, product_id: 'prod_cuentas_mensual' });
    const r = await canjearCodigo(env, { codigo: k, nombre: 'Leo', email: 'leo@x.mx' });
    expect(r).toMatchObject({ ok: true, app: 'cuentas' });
    const s = await suscripcionApp(env, 'leo@x.mx', 'cuentas');
    expect(s).toMatchObject({ vigente: true, cortesia: true });
    cerca(s.periodo_fin, Date.now() + 30.5 * DIA);
  });

  it('no vencen y, si nadie lo usó, se devuelven a mi saldo (una sola vez; ya no se pueden canjear)', async () => {
    abonar(80000); await entrar();
    const { codigos: [a, b] } = await sacarCodigos(env, { email: YO, slug: 'simulador-paa-practica', cantidad: 2 });
    expect(fila('SELECT * FROM toolkit_codigos WHERE codigo = ?', a)).not.toHaveProperty('vence_at');
    const r = await (await pedir('/api/toolkit/devolver', { metodo: 'POST', body: { codigo: a } })).json();
    expect(r).toMatchObject({ ok: true, centavos: 19900, saldo_centavos: 80000 - 19900 });
    expect(fila("SELECT tipo, centavos FROM toolkit_movimientos WHERE tipo = 'devolucion'")).toEqual({ tipo: 'devolucion', centavos: 19900 });
    expect((await devolverCodigo(env, { email: YO, codigo: a })).status).toBe(409);
    expect((await canjearCodigo(env, { codigo: a, nombre: 'X', email: 'x@x.mx' })).status).toBe(410);
    // Uno usado no se devuelve, y solo su dueño puede devolverlo
    await canjearCodigo(env, { codigo: b, nombre: 'X', email: 'x@x.mx' });
    expect((await devolverCodigo(env, { email: YO, codigo: b })).error).toMatch(/ya se usó/);
    expect((await devolverCodigo(env, { email: 'otro@x.mx', codigo: b })).status).toBe(404);
    expect(await saldoToolkit(env, YO)).toBe(80000 - 19900);
  });

  it('un código TK escrito en el formulario de compra manda a canjearlo (no se cobra)', async () => {
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Luis', email: 'l@x.mx', terminos: true, slug: 'de-idea-a-proyecto', codigo: 'TK-ABCD-EFGH' } });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/tienda\/canjear\/TK-ABCD-EFGH/);
    expect(llamada('/checkout/sessions')).toHaveLength(0);
  });

  it('no se sacan códigos de simulacros adicionales ni más de 20 por tanda', async () => {
    abonar(300000);
    expect((await sacarCodigos(env, { email: YO, slug: 'simulador-paa-intento', cantidad: 1 })).error).toMatch(/solo le sirven a quien ya tiene el simulador/);
    expect((await sacarCodigos(env, { email: YO, slug: 'de-idea-a-proyecto', cantidad: 21 })).status).toBe(400);
  });
});

describe('el saldo nunca vence', () => {
  it('tras cancelar, el saldo sigue usable y ya no hay abonos nuevos', async () => {
    await pagarFactura('in_1');
    await pagarFactura('in_2');
    // Canceló: Stripe la da por terminada hace mucho (más de un año)
    stripe.sub = subStripe({ status: 'canceled', ended_at: Math.floor((Date.now() - 400 * DIA) / 1000) });
    expect((await evento('customer.subscription.deleted', 'sub_tk')).status).toBe(200);
    env.DB.raw.prepare("UPDATE toolkit_movimientos SET created_at = ?, periodo_fin = ?").run(new Date(Date.now() - 430 * DIA).toISOString(), new Date(Date.now() - 400 * DIA).toISOString());
    const e = await estadoToolkit(env, YO);
    expect(e).toMatchObject({ activo: false, usable: true, saldo_centavos: 160000, proximo_abono: null });
    expect(e).not.toHaveProperty('vence_at');
    // Lo sigue usando: comprar, pagar meses y sacar códigos
    expect((await pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' })).ok).toBe(true);
    expect((await pagarMesesApp(env, { email: YO, app: 'clara', meses: 1 })).ok).toBe(true);
    expect((await sacarCodigos(env, { email: YO, slug: 'simulador-paa-practica', cantidad: 1 })).ok).toBe(true);
    expect(await saldoToolkit(env, YO)).toBe(160000 - 27900 - 4900 - 19900);
    // Ningún movimiento resta saldo por tiempo
    expect(filas('SELECT DISTINCT tipo FROM toolkit_movimientos ORDER BY tipo').map(x => x.tipo)).toEqual(['abono', 'app', 'codigos', 'compra']);
    // Mi Toolkit lo dice claro
    await entrar();
    const html = await (await pedir('/tienda/mi-toolkit/')).text();
    expect(html).toContain('ya no recibes abonos, pero tu saldo sigue disponible');
    expect(html).toContain('Nunca vence');
  });

  it('si vuelve a suscribirse, los abonos nuevos se suman a lo que ya tenía', async () => {
    abonar(50000, YO, 'factura:in_viejo');
    suscribir('canceled', YO, { periodo_fin: new Date(Date.now() - 300 * DIA).toISOString() });
    await pagarFactura('in_nuevo');
    expect(await saldoToolkit(env, YO)).toBe(130000);
  });
});

describe('reembolsos de un pago del Toolkit', () => {
  const reembolsar = (pi, monto, reembolsado) => { stripe.pi = { id: pi, metadata: {}, latest_charge: { id: 'ch_1', refunded: reembolsado >= monto, amount: monto, amount_refunded: reembolsado } }; return evento('charge.refunded', 'ch_1', { payment_intent: pi }); };

  it('reembolso total: resta lo que abonó ese pago, una sola vez', async () => {
    await pagarFactura('in_1'); await pagarFactura('in_2');
    expect((await reembolsar('pi_in_2', 59900, 59900)).status).toBe(200);
    await reembolsar('pi_in_2', 59900, 59900);
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(fila("SELECT centavos, factura_id FROM toolkit_movimientos WHERE tipo = 'reembolso'")).toEqual({ centavos: -80000, factura_id: 'in_2' });
  });

  it('si el saldo ya se usó, queda en 0 (nunca negativo) y la diferencia va a revisión manual', async () => {
    await pagarFactura('in_1');
    await pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' });
    await reembolsar('pi_in_1', 59900, 59900);
    expect(await saldoToolkit(env, YO)).toBe(0);
    expect(fila('SELECT email, factura_id, faltante_centavos FROM toolkit_revisar')).toEqual({ email: YO, factura_id: 'in_1', faltante_centavos: 27900 });
    const res = await new Admin({}, env).resumenToolkit();
    expect(res.revisar).toHaveLength(1);
    // El reintento del webhook no duplica nada
    await reembolsar('pi_in_1', 59900, 59900);
    expect(fila('SELECT COUNT(*) n FROM toolkit_revisar').n).toBe(1);
    expect(fila("SELECT COUNT(*) n FROM toolkit_movimientos WHERE tipo = 'reembolso'").n).toBe(1);
  });

  it('reembolso parcial: resta la parte proporcional, y el resto si después se reembolsa todo', async () => {
    await pagarFactura('in_1');
    await reembolsoToolkit(env, 'pi_in_1', { monto: 59900, reembolsado: 29950 });
    expect(await saldoToolkit(env, YO)).toBe(40000);
    await reembolsoToolkit(env, 'pi_in_1', { monto: 59900, reembolsado: 59900 });
    expect(await saldoToolkit(env, YO)).toBe(0);
  });

  it('un reembolso de otro pago no toca el saldo', async () => {
    await pagarFactura('in_1');
    expect(await reembolsoToolkit(env, 'pi_otro')).toBeNull();
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });
});

describe('puntos Vorka: sin puntos dobles', () => {
  it('el pago del Toolkit da puntos a quien recomendó; lo que se compra o canjea con saldo no', async () => {
    const code = await codigoDe(env, 'emb@correo.mx', 'Emb');
    env.DB.raw.prepare('INSERT OR IGNORE INTO puntos_cuentas (email) VALUES (?)').run('emb@correo.mx');
    const { order } = await (await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana Ruiz', email: YO, terminos: true, slug: 'toolkit-mensual', ref: code } })).json();
    stripe.orden = order; stripe.sub = subStripe();
    await evento('checkout.session.completed', 'cs_1');
    const ganados = () => fila("SELECT COUNT(*) n, COALESCE(SUM(puntos), 0) p FROM puntos_movimientos WHERE email = 'emb@correo.mx' AND tipo = 'ganado'");
    expect(ganados().n).toBe(1);
    expect(ganados().p).toBeGreaterThan(0);
    await pagarFactura('in_1', { billing_reason: 'subscription_create' });
    const antes = ganados();
    // Compra, mes de app y código canjeado con saldo: cero puntos nuevos para nadie
    expect((await pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' })).ok).toBe(true);
    await pagarMesesApp(env, { email: YO, app: 'clara', meses: 1 });
    const { codigos: [k] } = await sacarCodigos(env, { email: YO, slug: 'simulador-paa-practica', cantidad: 1 });
    await canjearCodigo(env, { codigo: k, nombre: 'Luis', email: 'luis@x.mx' });
    expect(ganados()).toEqual(antes);
    expect(fila("SELECT COUNT(*) n FROM orders WHERE proveedor = 'saldo' AND (ref_code IS NOT NULL OR monto_centavos > 0)").n).toBe(0);
  });
});

describe('productos de creadores fuera del saldo', () => {
  it('no se pagan ni se sacan códigos, con un texto claro', async () => {
    env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado, stripe_listo) VALUES ('cre_a', 'Ale', 'ale@mail.com', 'aprobado', 1);
      INSERT INTO products (id, slug, nombre, precio_centavos, activo, creador_id, contenido) VALUES ('prod_cre', 'guia-de-ale', 'Guía de Ale', 15000, 1, 'cre_a', '{}');`);
    abonar(80000); await entrar();
    const q = await (await pedir('/api/toolkit/cotizar', { metodo: 'POST', body: { slug: 'guia-de-ale' } })).json();
    expect(q).toMatchObject({ ok: false, excluido: 'creador', error: EXCLUIDO_CREADOR });
    expect((await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'guia-de-ale' } })).status).toBe(400);
    expect((await sacarCodigos(env, { email: YO, slug: 'guia-de-ale', cantidad: 1 })).error).toBe(EXCLUIDO_CREADOR);
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });
});

describe('páginas y panel', () => {
  it('ficha /tienda/toolkit/: 4 líneas, precio fundador, tabla con precios reales de la tienda y los dos planes', async () => {
    const html = await (await pedir('/tienda/toolkit/', { cookie: '' })).text();
    expect(html).toContain('Pagas $599 al mes');
    expect(html).toContain('Recibes $800 de saldo cada mes');
    expect(html).toContain('Tu saldo nunca vence');
    expect(html).toContain('Precio fundador garantizado por tus primeros 3 meses.</b>');
    expect(html).toMatch(/Simulador PAA · práctica ilimitada<\/td><td class="n">\$199<\/td><td class="n">4<\/td><td class="n">9<\/td>/);
    expect(html).toContain('value="toolkit-pro-mensual"');
    expect(html).not.toContain('noindex');
  });

  it('mientras está inactivo la ficha no vende y no se indexa', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug LIKE 'toolkit-%'");
    const html = await (await pedir('/tienda/toolkit/', { cookie: '' })).text();
    expect(html).toContain('Muy pronto');
    expect(html).toContain('noindex');
    expect(html).not.toContain('id="form-toolkit"');
  });

  it('el catálogo y la API pública muestran una sola tarjeta (el plan mensual) y las fichas viejas redirigen', async () => {
    const api = await (await pedir('/api/tienda/productos', { cookie: '' })).json();
    expect(api.filter(p => p.slug.startsWith('toolkit')).map(p => p.slug)).toEqual(['toolkit-mensual']);
    expect(api[0]).toEqual(expect.objectContaining({ id: expect.any(String), slug: expect.any(String), precio_centavos: expect.any(Number) }));
    const r = await pedir('/tienda/toolkit-pro-mensual/', { cookie: '' });
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('/tienda/toolkit/?plan=toolkit-pro-mensual#comprar');
  });

  it('Mi Toolkit sin sesión pide entrar; con sesión sin Toolkit lo explica', async () => {
    expect(await (await pedir('/tienda/mi-toolkit/', { cookie: '' })).text()).toContain('/tienda/cuenta/?volver=/tienda/mi-toolkit/');
    await entrar('nadie@x.mx');
    expect(await (await pedir('/tienda/mi-toolkit/')).text()).toContain('Todavía no tienes Toolkit');
  });

  it('Admin.resumenToolkit: activos por plan, pasivo, usado del mes y consumo antes vs. ahora', async () => {
    // Antes de suscribirse: 3 meses con $300 de compras pagadas en total → $100 al mes
    env.DB.raw.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, estado, proveedor, paid_at) VALUES ('o_antes', ?, 'Ana', 30000, 'paid', 'stripe', ?)`).run(YO, new Date(Date.now() - 20 * DIA).toISOString());
    suscribir('active');
    abonar(80000);
    await pagarConSaldo(env, { email: YO, nombre: 'Ana', slug: 'de-idea-a-proyecto' });
    const r = await new Admin({}, env).resumenToolkit();
    expect(r.planes.find(p => p.product_id === 'prod_toolkit_mensual')).toMatchObject({ activos: 1, bono_centavos: 80000 });
    expect(r).toMatchObject({ activos: 1, pasivo_centavos: 80000 - 27900, abonado_mes_centavos: 80000, usado_mes_centavos: 27900 });
    const c = r.clientes[0];
    expect(c).toMatchObject({ email: YO, antes_mensual_centavos: 10000, ahora_mensual_centavos: 27900, razon: 2.79, cumple: true });
    expect(r.indicador).toMatchObject({ clientes_con_historial: 1, cumplen: 1, razon: 2.79 });
    const cli = await new Admin({}, env).toolkitCliente(YO);
    expect(cli.saldo_centavos).toBe(52100);
    expect(cli.movimientos).toHaveLength(2);
  });
});

// ---------- pago doble de apps (renovación automática con tarjeta) ----------
const RENUEVA = /^Ya pagas Vende Pro con tarjeta y se renueva sola\. Para usar tu saldo, primero cancela la renovación \(sigues teniendo la app hasta el 31 de diciembre de 2029\); los meses con saldo empezarán ese día\.$/;
const conApp = (app = 'vende', o = {}) => env.DB.raw.prepare(`INSERT OR REPLACE INTO suscripciones (id, email, app, product_id, customer_id, estado, intervalo, periodo_fin, cancelar_al_final, monto_centavos)
  VALUES (?, ?, ?, ?, 'cus_v', ?, 'month', ?, ?, 9900)`).run(o.id || `sub_${app}`, o.email || YO, app, o.product_id || `prod_${app}_mensual`, o.estado || 'active', o.periodo_fin || '2030-01-01T00:00:00.000Z', o.cancelar ? 1 : 0);
const antesDelBatch = fn => { const orig = env.DB.batch.bind(env.DB); env.DB.batch = async st => { fn(); env.DB.batch = orig; return orig(st); }; };

describe('pago doble: una app que ya se paga con tarjeta y se renueva sola', () => {
  it('no se pagan meses con saldo (servidor), con el mensaje claro y sin tocar el saldo', async () => {
    abonar(80000); conApp('vende');
    const r = await pagarMesesApp(env, { email: YO, app: 'vende', meses: 2 });
    expect(r.status).toBe(409);
    expect(r.error).toMatch(RENUEVA);
    expect(r.renueva).toMatchObject({ app: 'vende', periodo_fin: '2030-01-01T00:00:00.000Z' });
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(fila("SELECT COUNT(*) n FROM orders WHERE proveedor = 'saldo'").n).toBe(0);
    // Tampoco por la API de Mi Toolkit ni por el botón de la ficha de la app (pagar 1 mes)
    await entrar();
    const api = await pedir('/api/toolkit/app', { metodo: 'POST', body: { app: 'vende', meses: 1 } });
    expect(api.status).toBe(409);
    expect((await api.json()).error).toMatch(RENUEVA);
    expect((await pedir('/api/toolkit/pagar', { metodo: 'POST', body: { slug: 'vende-mensual' } })).status).toBe(409);
    expect(await (await pedir('/api/toolkit/cotizar', { metodo: 'POST', body: { slug: 'vende-mensual' } })).json())
      .toMatchObject({ ok: false, app: 'vende', renueva: { app: 'vende' }, error: expect.stringMatching(RENUEVA) });
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });

  it('past_due también cuenta como vigente; con la renovación ya cancelada sí se puede', async () => {
    abonar(80000); conApp('vende', { estado: 'past_due' });
    expect((await pagarMesesApp(env, { email: YO, app: 'vende', meses: 1 })).status).toBe(409);
    conApp('vende', { cancelar: true });
    expect(await pagarMesesApp(env, { email: YO, app: 'vende', meses: 1 })).toMatchObject({ ok: true, desde: '2030-01-01T00:00:00.000Z' });
  });

  it('un paquete que incluye la app (Agenda + Vuelve) también la bloquea', async () => {
    abonar(80000); conApp('agenda-vuelve', { product_id: 'prod_agenda_vuelve_mensual' });
    const r = await pagarMesesApp(env, { email: YO, app: 'agenda', meses: 1 });
    expect(r.status).toBe(409);
    expect(r.error).toMatch(/^Ya pagas Agenda con tarjeta y se renueva sola/);
    expect((await pagarMesesApp(env, { email: YO, app: 'clara', meses: 1 })).ok).toBe(true);   // otra app, sin problema
  });

  it('atómico: si la renovación aparece justo antes del cargo, el batch no cobra nada', async () => {
    abonar(80000);
    antesDelBatch(() => conApp('vende'));
    const r = await pagarMesesApp(env, { email: YO, app: 'vende', meses: 1 });
    expect(r.status).toBe(409);
    expect(r.error).toMatch(RENUEVA);
    expect(fila("SELECT COUNT(*) n FROM toolkit_movimientos WHERE tipo = 'app'").n).toBe(0);
    expect(fila('SELECT COUNT(*) n FROM orders').n).toBe(0);
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });

  it('un código de regalo de esa app para uno mismo: mismo bloqueo y el código queda sin usar', async () => {
    abonar(80000);
    const { codigos: [k] } = await sacarCodigos(env, { email: YO, slug: 'vende-mensual', cantidad: 1 });
    conApp('vende');
    const r = await pedir('/api/toolkit/canjear', { metodo: 'POST', cookie: '', body: { codigo: k, nombre: 'Ana', email: YO, terminos: true } });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(RENUEVA);
    expect((await codigosDe(env, YO))[0].estado).toBe('disponible');
    expect(fila('SELECT COUNT(*) n FROM orders').n).toBe(0);
    // Otra persona sí lo puede canjear
    expect((await canjearCodigo(env, { codigo: k, nombre: 'Leo', email: 'leo@x.mx' })).ok).toBe(true);
  });

  it('canje atómico: si la renovación aparece en el último momento, el código no se gasta', async () => {
    abonar(80000);
    const { codigos: [k] } = await sacarCodigos(env, { email: YO, slug: 'vende-mensual', cantidad: 1 });
    antesDelBatch(() => conApp('vende'));
    const r = await canjearCodigo(env, { codigo: k, nombre: 'Ana', email: YO });
    expect(r.status).toBe(409);
    expect(r.error).toMatch(RENUEVA);
    expect((await codigosDe(env, YO))[0].estado).toBe('disponible');
  });

  it('Mi Toolkit › apps muestra el mensaje con el botón al portal de esa app (y no el de pagar)', async () => {
    abonar(80000); conApp('vende'); await entrar();
    const html = await (await pedir('/tienda/mi-toolkit/?v=apps')).text();
    expect(html).toContain('Ya pagas Vende Pro con tarjeta y se renueva sola. Para usar tu saldo, primero cancela la renovación (sigues teniendo la app hasta el 31 de diciembre de 2029); los meses con saldo empezarán ese día.');
    expect(html).toContain('data-portal-app="vende"');
    expect(html).not.toContain('data-app="vende" data-precio');
    expect(html).toContain('data-app="clara" data-precio');
    const p = await pedir('/api/toolkit/portal', { metodo: 'POST', body: { app: 'vende', volver: '/tienda/vende/' } });
    expect(await p.json()).toEqual({ url: 'https://billing.stripe.com/p/session/x' });
    const params = llamada('/billing_portal/sessions')[0].params;
    expect(params.get('customer')).toBe('cus_v');
    expect(params.get('return_url')).toBe('https://vorka.mx/tienda/vende/');
    expect((await pedir('/api/toolkit/portal', { metodo: 'POST', body: { app: 'toolkit-x' } })).status).toBe(400);
  });

  it('la ficha de la app lleva el botón para cancelar la renovación cuando el saldo no se puede usar', async () => {
    abonar(80000); conApp('vende'); await entrar();
    const html = await (await pedir('/tienda/vende/')).text();
    expect(html).toContain('Cancelar la renovación con tarjeta');
    expect(html).toContain('q.renueva');
  });
});

// ---------- pasarse de Toolkit a Toolkit Pro ----------
const AHORA = () => Math.floor(Date.now() / 1000);
const lineaProrrateo = amount => ({ amount, parent: { subscription_item_details: { proration: true } } });
const itemTk = (pro = false) => ({ id: 'si_1', quantity: 1, current_period_start: AHORA() - 15 * 86400, current_period_end: AHORA() + 15 * 86400,
  price: { unit_amount: pro ? 119900 : 59900, recurring: { interval: 'month' }, product: { metadata: { product_id: pro ? 'prod_toolkit_pro_mensual' : 'prod_toolkit_mensual' } } } });
// Suscripción del Toolkit a la mitad de su mes (15 días usados de 30)
const subMitad = (o = {}) => subStripe({ start_date: AHORA() - 75 * 86400, items: { data: [itemTk()] }, ...o });
const subPro = (o = {}) => subStripe({ product_id: 'prod_toolkit_pro_mensual', items: { data: [itemTk(true)] }, ...o });
const facturaCambio = (id = 'in_up', o = {}) => factura(id, { billing_reason: 'subscription_update', total: 30000, amount_paid: 30000, ...o });
const postsSub = () => llamada('/subscriptions/sub_tk').filter(l => l.init.method === 'POST');

async function conToolkit() {
  await pagarFactura('in_1', { billing_reason: 'subscription_create' });   // $800 de saldo y la suscripción guardada
  stripe.sub = subMitad();
  stripe.preview = { total: 30000, lines: { data: [lineaProrrateo(-29950), lineaProrrateo(59950)] } };
  stripe.actualizar = () => subPro({ latest_invoice: facturaCambio() });
  await entrar();
}

describe('Toolkit → Toolkit Pro', () => {
  it('rentabilidad con los precios y bonos de la base (no fijos): $1.34 y $1.50; $600 más → $1,000 más', async () => {
    await conToolkit();
    const html = await (await pedir('/tienda/mi-toolkit/')).text();
    expect(html).toContain('Pásate a Toolkit Pro');
    expect(html).toMatch(/<b>\$1\.34<\/b><span>de saldo por cada \$1<\/span><em>Pagas \$599 y recibes \$800<\/em>/);
    expect(html).toMatch(/<b>\$1\.50<\/b><span>de saldo por cada \$1<\/span><em>Pagas \$1,199 y recibes \$1,800<\/em>/);
    expect(html).toContain('Por <b>$600 más al mes</b> recibes <b>$1,000 más de saldo</b>.');
    expect(html).toContain('Con Pro recibes $1,000 más de saldo al mes');
    expect(html).toContain('Para bajar de plan escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.');
    // Sin uso suficiente no se inventa el «te sobrarían»
    expect(html).not.toContain('Con lo que llevas usando al mes');
    // Si cambian en la base, cambia la tarjeta (también en la pestaña de códigos y en el aviso de «no alcanza»)
    env.DB.raw.exec(`UPDATE products SET precio_centavos = 99900, contenido = json_set(contenido, '$.toolkit.bono_centavos', 170000) WHERE id = 'prod_toolkit_pro_mensual'`);
    const otro = await (await pedir('/tienda/mi-toolkit/?v=codigos')).text();
    expect(otro).toContain('id="mt-pro"');
    expect(otro).toContain('Por <b>$400 más al mes</b> recibes <b>$900 más de saldo</b>.');
    expect(otro).toMatch(/<b>\$1\.70<\/b>/);   // 1,700 / 999
    expect(otro).toContain('data-pro="¿Te quedas corto seguido? Con Toolkit Pro recibes $900 más de saldo al mes."');
  });

  it('después de sacar códigos también aparece la tarjeta', async () => {
    await conToolkit();
    const html = await (await pedir('/tienda/mi-toolkit/?v=codigos&listo=2')).text();
    expect(html).toContain('¡Listo! Sacaste 2 códigos');
    expect(html).toContain('Pásate a Toolkit Pro');
  });

  it('con datos reales de uso dice cuánto le sobraría con Pro', async () => {
    await conToolkit();
    env.DB.raw.prepare("UPDATE toolkit_movimientos SET created_at = ? WHERE tipo = 'abono'").run(new Date(Date.now() - 10 * DIA).toISOString());
    abonar(100000);
    for (const slug of ['de-idea-a-proyecto', 'de-idea-a-proyecto']) expect((await pagarConSaldo(env, { email: YO, nombre: 'Ana', slug })).ok).toBe(true);
    await sacarCodigos(env, { email: YO, slug: 'simulador-paa-practica', cantidad: 1 });
    // 27,900 × 2 + 19,900 = 75,700 en menos de un mes → $757 al mes; con Pro le sobrarían $1,043
    const html = await (await pedir('/tienda/mi-toolkit/')).text();
    expect(html).toContain('Con lo que llevas usando al mes ($757), con Pro te sobrarían $1,043.');
  });

  it('confirmación con la vista previa de Stripe: cuánto se cobra hoy, cuánto saldo y desde cuándo', async () => {
    await conToolkit();
    const r = await pedir('/api/toolkit/pro/vista', { metodo: 'POST' });
    expect(r.status).toBe(200);
    const v = await r.json();
    expect(v).toMatchObject({ ok: true, cobro_centavos: 30000, saldo_centavos: 50000, aproximado: false, precio_pro_centavos: 119900, bono_pro_centavos: 180000 });
    expect(v.texto).toMatch(/^Hoy te cobramos \$300 \(la diferencia por los días que quedan\) y te sumamos \$500 de saldo\. Desde el \d{1,2} de [a-z]+ de \d{4} pagas \$1,199 y recibes \$1,800 cada mes\.$/);
    expect(v.fundador).toMatch(/^Tu precio fundador sigue contando desde tu primera suscripción/);
    const p = llamada('/invoices/create_preview')[0].params;
    expect(p.get('subscription')).toBe('sub_tk');
    expect(p.get('subscription_details[items][0][id]')).toBe('si_1');
    expect(p.get('subscription_details[items][0][price]')).toBe('price_prod_toolkit_pro_mensual_119900');
    expect(p.get('subscription_details[proration_behavior]')).toBe('always_invoice');
    // El precio de Pro se crea una vez en Stripe (Product con su product_id) y se reutiliza
    expect(llamada('/products')[0].params.get('metadata[product_id]')).toBe('prod_toolkit_pro_mensual');
    await pedir('/api/toolkit/pro/vista', { metodo: 'POST' });
    expect(llamada('/prices')).toHaveLength(1);
    // La vista previa no cobra ni abona nada
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(postsSub()).toHaveLength(0);
  });

  it('si la vista previa de Stripe falla, calcula igual que Stripe (por segundos) y lo dice como aproximado', async () => {
    await conToolkit();
    stripe.preview = new Error('caído');
    const v = await (await pedir('/api/toolkit/pro/vista', { metodo: 'POST' })).json();
    expect(v.aproximado).toBe(true);
    expect(Math.abs(v.cobro_centavos - 30000)).toBeLessThanOrEqual(2);   // mitad del mes: (119,900 − 59,900) / 2
    expect(Math.abs(v.saldo_centavos - 50000)).toBeLessThanOrEqual(4);
  });

  it('cambio exitoso: cobra la diferencia ya, abona el saldo prorrateado una vez y el siguiente ciclo abona $1,800', async () => {
    await conToolkit();
    const v = await (await pedir('/api/toolkit/pro/vista', { metodo: 'POST' })).json();
    const r = await pedir('/api/toolkit/pro', { metodo: 'POST', body: { proration_date: v.proration_date } });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, cobro_centavos: 30000, abonado_centavos: 50000, saldo_centavos: 130000 });
    // Stripe: la misma suscripción, precio de Pro, factura inmediata, sin aplicar si el cobro falla, misma fecha de prorrateo
    const [post] = postsSub();
    expect(post.params.get('items[0][id]')).toBe('si_1');
    expect(post.params.get('items[0][price]')).toBe('price_prod_toolkit_pro_mensual_119900');
    expect(post.params.get('proration_behavior')).toBe('always_invoice');
    expect(post.params.get('payment_behavior')).toBe('pending_if_incomplete');
    expect(post.params.get('proration_date')).toBe(String(v.proration_date));
    expect(post.params.get('metadata[product_id]')).toBe('prod_toolkit_pro_mensual');
    expect(post.init.headers['idempotency-key']).toMatch(/^toolkit-pro-/);
    expect(filas('SELECT tipo, centavos, clave, plan FROM toolkit_movimientos ORDER BY id')).toEqual([
      { tipo: 'abono', centavos: 80000, clave: 'factura:in_1', plan: 'toolkit' },
      { tipo: 'abono', centavos: 50000, clave: 'factura:in_up', plan: 'toolkit-pro' },
    ]);
    expect(fila('SELECT estado, factura_id, cobro_centavos, saldo_centavos FROM toolkit_cambios')).toEqual({ estado: 'pagado', factura_id: 'in_up', cobro_centavos: 30000, saldo_centavos: 50000 });
    expect(await estadoToolkit(env, YO)).toMatchObject({ plan: { nombre: 'Toolkit Pro', bono_centavos: 180000 }, proximo_abono: { centavos: 180000 } });
    // El webhook de la factura de prorrateo (y sus reintentos) NO abona el bono completo ni duplica
    for (let i = 0; i < 3; i++) await pagarFactura('in_up', { billing_reason: 'subscription_update', total: 30000, amount_paid: 30000, sub: { product_id: 'prod_toolkit_pro_mensual' } });
    expect(await saldoToolkit(env, YO)).toBe(130000);
    // Siguiente mes: $1,199 → $1,800
    await pagarFactura('in_2', { total: 119900, amount_paid: 119900, sub: { product_id: 'prod_toolkit_pro_mensual' } });
    expect(await saldoToolkit(env, YO)).toBe(310000);
    // Mi Toolkit confirma el cambio y ya no ofrece Pro
    const html = await (await pedir('/tienda/mi-toolkit/?pro=listo')).text();
    expect(html).toContain('¡Listo! Ya tienes Toolkit Pro. Te cobramos $300 y te sumamos $500 de saldo.');
    expect(html).not.toContain('Pásate a Toolkit Pro');
    expect((await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} })).status).toBe(409);
  });

  it('webhook y respuesta en cualquier orden: el saldo prorrateado se abona una sola vez', async () => {
    await conToolkit();
    // El webhook llega mientras la petición del cambio sigue abierta (cambio aún 'pendiente', sin factura ligada)
    const { abonoCambio } = await import('../src/toolkit.js');
    env.DB.raw.prepare("INSERT INTO toolkit_cambios (id, email, suscripcion_id, de_product_id, a_product_id, proration_date) VALUES ('c1', ?, 'sub_tk', 'prod_toolkit_mensual', 'prod_toolkit_pro_mensual', 1)").run(YO);
    const fs = fila("SELECT * FROM suscripciones WHERE id = 'sub_tk'");
    expect(await abonoToolkit(env, facturaCambio(), { id: 'sub_tk' }, fs)).toMatchObject({ centavos: 50000 });   // primero el webhook
    expect(await abonoCambio(env, facturaCambio(), fila("SELECT * FROM toolkit_cambios WHERE id = 'c1'"))).toBeNull();   // luego la respuesta
    expect(await abonoToolkit(env, facturaCambio(), { id: 'sub_tk' }, fs)).toBeNull();   // reintento del webhook
    expect(fila("SELECT COUNT(*) n, SUM(centavos) c FROM toolkit_movimientos WHERE factura_id = 'in_up'")).toEqual({ n: 1, c: 50000 });
    expect(fila("SELECT estado, factura_id FROM toolkit_cambios WHERE id = 'c1'")).toEqual({ estado: 'pagado', factura_id: 'in_up' });
  });

  it('una factura de cambio de plan sin un cambio registrado no abona nada (nunca el bono completo)', async () => {
    await conToolkit();
    await pagarFactura('in_raro', { billing_reason: 'subscription_update', total: 60000, amount_paid: 60000, sub: { product_id: 'prod_toolkit_pro_mensual' } });
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });

  it('cobro rechazado: no cambia el plan, anula la factura, no abona nada y lo dice amable', async () => {
    await conToolkit();
    stripe.actualizar = () => subMitad({ pending_update: { expires_at: AHORA() + 3600, subscription_items: [{ id: 'si_1', price: 'price_x' }] },
      latest_invoice: facturaCambio('in_falla', { status: 'open', amount_paid: 0, payments: { data: [] } }) });
    const r = await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} });
    expect(r.status).toBe(402);
    expect((await r.json()).error).toBe('No pudimos cobrar la diferencia a tu tarjeta, así que no cambiamos tu plan y no te cobramos nada. Revisa tu tarjeta en «Administrar mi suscripción» e intenta de nuevo.');
    expect(llamada('/invoices/in_falla/void')).toHaveLength(1);
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(fila('SELECT estado, factura_id FROM toolkit_cambios')).toEqual({ estado: 'fallido', factura_id: 'in_falla' });
    expect(fila("SELECT product_id FROM suscripciones WHERE id = 'sub_tk'").product_id).toBe('prod_toolkit_mensual');
    // Puede volver a intentarlo (el fallido no bloquea) y si Stripe responde 402: tampoco se abona
    stripe.actualizar = () => ({ http: 402, body: { error: { message: 'Your card was declined.', code: 'card_declined' } } });
    const r2 = await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} });
    expect(r2.status).toBe(402);
    expect(await saldoToolkit(env, YO)).toBe(80000);
    expect(fila("SELECT COUNT(*) n FROM toolkit_cambios WHERE estado = 'fallido'").n).toBe(2);
  });

  it('dos clics al mismo tiempo: solo uno llega a Stripe', async () => {
    await conToolkit();
    env.DB.raw.prepare("INSERT INTO toolkit_cambios (id, email, suscripcion_id, de_product_id, a_product_id, proration_date) VALUES ('c1', ?, 'sub_tk', 'prod_toolkit_mensual', 'prod_toolkit_pro_mensual', 1)").run(YO);
    const r = await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/Ya estamos procesando tu cambio/);
    expect(postsSub()).toHaveLength(0);
  });

  it('quien no tiene Toolkit (o no tiene sesión) no puede llamar al cambio; quien ya es Pro no ve la tarjeta', async () => {
    expect((await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} })).status).toBe(401);
    await entrar('nadie@x.mx');
    expect((await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} })).status).toBe(403);
    expect((await pedir('/api/toolkit/pro/vista', { metodo: 'POST' })).status).toBe(403);
    expect(llamadas.filter(l => l.url.includes('/subscriptions/'))).toHaveLength(0);
    // Ya es Pro
    await pagarFactura('in_p', { total: 119900, amount_paid: 119900, sub: { product_id: 'prod_toolkit_pro_mensual' } });
    await entrar();
    const html = await (await pedir('/tienda/mi-toolkit/')).text();
    expect(html).toContain('Toolkit Pro · activo');
    expect(html).not.toContain('Pásate a Toolkit Pro');
    expect(await (await pedir('/tienda/mi-toolkit/?v=codigos')).text()).not.toContain('id="mt-pro"');
    const r = await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('Ya tienes Toolkit Pro.');
  });

  it('con la cancelación programada o un pago pendiente no se ofrece ni se permite', async () => {
    await conToolkit();
    env.DB.raw.exec("UPDATE suscripciones SET cancelar_al_final = 1 WHERE id = 'sub_tk'");
    expect(await (await pedir('/tienda/mi-toolkit/')).text()).not.toContain('Pásate a Toolkit Pro');
    expect((await (await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} })).json()).error).toMatch(/programado para cancelarse/);
    env.DB.raw.exec("UPDATE suscripciones SET cancelar_al_final = 0, estado = 'past_due' WHERE id = 'sub_tk'");
    expect((await (await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} })).json()).error).toMatch(/Actualiza tu tarjeta/);
    expect(postsSub()).toHaveLength(0);
  });

  it('un reembolso de la factura de prorrateo resta solo lo que esa factura abonó', async () => {
    await conToolkit();
    await pedir('/api/toolkit/pro', { metodo: 'POST', body: {} });
    expect(await saldoToolkit(env, YO)).toBe(130000);
    await reembolsoToolkit(env, 'pi_in_up', { monto: 30000, reembolsado: 30000 });
    expect(await saldoToolkit(env, YO)).toBe(80000);
  });
});
