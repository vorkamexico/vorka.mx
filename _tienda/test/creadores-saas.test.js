// SaaS de creadores por suscripción (migración 0060): piso de 20 % en cada cobro, transferencia por factura (idempotente),
// reembolsos y disputas, API con llave por creador, avisos firmados, checkout en modo suscripción, revisión y tienda.
// Stripe está simulado (fetch falso): nunca se toca un objeto real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { repartoFactura, comisionSuscripcion, programarFactura, procesarTransferencias, facturasPorCalcular, PISO_SUSCRIPCION, DIAS_SUSCRIPCION } from '../src/marketplace.js';
import { crearLlave, secretoFirma, firmaValida, firmar, encolarAviso, entregarAviso, procesarAvisos, urlAvisoValida, enlacePortal, ESPERAS_MIN } from '../src/creadores-saas.js';
import { crearEnlace } from '../src/creadores-acceso.js';
import { listarProductos } from '../src/modelo.js';
import * as admin from '../src/admin.js';

const SECRETO = 'whsec_prueba';
const SITIO = 'https://vorka.mx';
const APP_URL = 'https://miapp.com/webhooks/vorka';
let env, llamadas, correos, stripe, ctx, respuestaApp;

const saas = (app, precios = { month: 19900, year: 199000 }) => JSON.stringify({ tipo: 'saas',
  acceso: { app: `cre-${app}`, tipo: 'saas', url: 'https://miapp.com/entrar', soporte: 'soporte@miapp.com', creador: 'Ana Dev', boton: 'Entrar a Mi App' },
  suscripcion: { intervalo: precios.month ? 'month' : 'year', precios } });

beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, MARKETPLACE: '1', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    STRIPE_PUBLISHABLE_KEY: 'pk_test_x', CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  // Creadora A con 10 % (acuerdo de descargables) y creador B con 20 %; los dos con Stripe listo
  env.DB.raw.exec(`
    INSERT INTO creadores (id, nombre, email, estado, comision_pct, stripe_account_id, stripe_listo, webhook_url) VALUES
      ('cre_a', 'Ana Dev', 'ana@dev.mx', 'aprobado', 10, 'acct_a', 1, '${APP_URL}'),
      ('cre_b', 'Beto Soft', 'beto@soft.mx', 'aprobado', 20, 'acct_b', 1, NULL);
    INSERT INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, r2_keys, creador_id, revision, contenido) VALUES
      ('prod_app_a', 'mi-app', 'Mi App', 'Agenda para estudios de tatuaje.', 19900, 1, 'Negocios', '[]', 'cre_a', 'aprobado', '${saas('prod_app_a')}'),
      ('prod_app_b', 'app-beto', 'App de Beto', 'Inventarios.', 29900, 1, 'Negocios', '[]', 'cre_b', 'aprobado', '${saas('prod_app_b', { month: 29900 })}');`);
  ctx = { pendientes: [], waitUntil(p) { this.pendientes.push(p); } };
  llamadas = []; correos = []; respuestaApp = 200;
  stripe = { orden: null, sub: null, facturas: {}, refunded: {}, fee: 1179, transfer: 0 };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body instanceof URLSearchParams ? init.body : '') });
    const ok = b => new Response(JSON.stringify(b));
    if (url === APP_URL) return new Response('ok', { status: respuestaApp });
    if (url.endsWith('/v1/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/v1/checkout/sessions')) return ok({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
    if (url.includes('/v1/checkout/sessions/')) return ok({ id: 'cs_1', mode: 'subscription', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden,
      amount_total: 19900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_c1' });
    if (url.includes('/v1/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/v1/invoices/')) return ok(stripe.facturas[url.split('/v1/invoices/')[1].split('?')[0]]);
    if (url.includes('/v1/payment_intents/')) {
      const id = url.split('/v1/payment_intents/')[1].split('?')[0];
      return ok({ id, metadata: {}, latest_charge: { id: `ch_${id.slice(3)}`, refunded: stripe.refunded[id] ?? false, balance_transaction: stripe.fee == null ? null : { fee: stripe.fee } } });
    }
    if (url.includes('/v1/charges/')) return ok({ id: 'ch_x', balance_transaction: { fee: 1179 } });
    if (url.includes('/v1/disputes/')) return ok({ id: 'dp_1', payment_intent: { id: 'pi_in_1', metadata: {} } });
    if (url.endsWith('/reversals')) return ok({ id: 'trr_1' });
    if (url.endsWith('/v1/transfers')) return ok({ id: `tr_${++stripe.transfer}` });
    if (url.endsWith('/v1/billing_portal/sessions')) return ok({ url: 'https://billing.stripe.com/p/session/x' });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const pedir = (ruta, { metodo = 'GET', body, form, headers = {}, ip = '1.1.1.1' } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method: metodo, redirect: 'manual', headers: { 'cf-connecting-ip': ip, origin: SITIO, ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
  body: body ? JSON.stringify(body) : form ? new URLSearchParams(form) : undefined }), env, ctx);
async function evento(tipo, objeto, extra = {}) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, ...extra } } });
  const t = Math.floor(Date.now() / 1000);
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
  return worker.fetch(new Request(`${SITIO}/api/webhooks/stripe`, { method: 'POST', headers: { 'stripe-signature': firma }, body: cuerpo }), env);
}
const filas = (sql, ...a) => env.DB.raw.prepare(sql).all(...a);
const fila = (sql, ...a) => env.DB.raw.prepare(sql).get(...a);
const transf = () => filas('SELECT * FROM transferencias ORDER BY created_at');
const llamada = ruta => llamadas.filter(l => l.url.startsWith(`https://api.stripe.com/v1${ruta}`));
const sub = (o = {}) => ({ id: 'sub_c1', status: 'active', customer: 'cus_1', cancel_at_period_end: false,
  metadata: { order_id: stripe.orden, app: 'cre-prod_app_a', email: 'cliente@mail.com', product_id: 'prod_app_a' },
  items: { data: [{ id: 'si_1', quantity: 1, current_period_end: 1893456000, price: { unit_amount: 19900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_app_a' } } } }] }, ...o });
const factura = (id, o = {}) => ({ id, status: 'paid', subtotal: 19900, amount_paid: 19900, amount_due: 19900, currency: 'mxn', billing_reason: 'subscription_cycle',
  parent: { subscription_details: { subscription: 'sub_c1' } }, status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
  payments: { data: [{ status: 'paid', payment: { type: 'payment_intent', payment_intent: `pi_${id}` } }] }, ...o });

// Compra completa: checkout (mensual) → pago de la sesión → factura 1 pagada
async function suscribir({ intervalo = 'month' } = {}) {
  const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Clienta Uno', email: 'cliente@mail.com', terminos: true, slug: 'mi-app', intervalo } });
  expect(r.status).toBe(200);
  stripe.orden = (await r.json()).order;
  stripe.sub = sub();
  stripe.facturas.in_1 = factura('in_1', { billing_reason: 'subscription_create' });
  expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
  expect((await evento('invoice.paid', 'in_1')).status).toBe(200);
  return stripe.orden;
}

describe('piso de 20 % para Vorka en suscripciones', () => {
  it('comisión efectiva = max(20, % del creador)', () => {
    expect(PISO_SUSCRIPCION).toBe(20);
    expect(comisionSuscripcion(10)).toBe(20);
    expect(comisionSuscripcion(0)).toBe(20);
    expect(comisionSuscripcion(35)).toBe(35);
    expect(comisionSuscripcion(undefined)).toBe(20);
    expect(comisionSuscripcion('abc')).toBe(20);
  });

  it('$199 al mes con creadora al 10 %: Vorka $39.80, Stripe real $11.79, creadora $147.41', () => {
    expect(repartoFactura(19900, 10, 1179)).toEqual({ comision_pct: 20, venta_centavos: 19900, comision_vorka_centavos: 3980, comision_stripe_centavos: 1179, monto_centavos: 14741 });
  });

  it('redondea a favor del piso: nunca un centavo por debajo de 20 %', () => {
    for (const venta of [1, 3, 19901, 33333, 2000, 99999]) {
      const r = repartoFactura(venta, 10, 0);
      expect(r.comision_vorka_centavos * 100).toBeGreaterThanOrEqual(venta * 20);
    }
  });

  it('la base de datos rechaza una transferencia de factura con menos de 20 % (aunque la escriba otra herramienta)', () => {
    const ins = (pct, vorka) => env.DB.raw.prepare(`INSERT INTO transferencias (id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, disponible_en, factura_id, comision_pct)
      VALUES (?, 'cre_a', 19900, ?, 0, 0, '2030-01-01', ?, ?)`).run(`trf_${pct}_${vorka}`, vorka, `in_${pct}_${vorka}`, pct);
    expect(() => ins(10, 1990)).toThrow(/CHECK/);
    expect(() => ins(20, 1990)).toThrow(/CHECK/);     // dice 20 % pero cobra 10 %
    expect(() => ins(20, 3980)).not.toThrow();
    // Los pagos únicos (sin factura) siguen con el % acordado
    env.DB.raw.exec("INSERT INTO orders (id, email, nombre, monto_centavos, estado) VALUES ('o1', 'a@b.mx', 'A', 20000, 'paid')");
    expect(() => env.DB.raw.prepare(`INSERT INTO transferencias (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, disponible_en)
      VALUES ('trf_u', 'o1', 'cre_a', 20000, 2000, 0, 18000, '2030-01-01')`).run()).not.toThrow();
  });

  it('en Vorka OS se puede bajar el % del creador, pero la respuesta avisa que en suscripciones manda el 20 %', async () => {
    const r = await admin.comisionCreador(env, 'cre_b', 5);
    expect(r).toMatchObject({ ok: true, comision_suscripcion_pct: 20 });
    expect(r.nota_piso).toMatch(/20 % mínimo/);
  });
});

describe('checkout en modo suscripción de un producto de creador', () => {
  it('mensual por defecto: Stripe en modo suscripción, sin códigos de promoción, con el creador en la metadata', async () => {
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Clienta', email: 'cliente@mail.com', terminos: true, slug: 'mi-app' } });
    expect(r.status).toBe(200);
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('19900');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('subscription_data[metadata][app]')).toBe('cre-prod_app_a');
    expect(p.get('subscription_data[metadata][creador_id]')).toBe('cre_a');
    expect(p.has('allow_promotion_codes')).toBe(false);
    expect(fila('SELECT intervalo, precio_centavos, creador_id, comision_pct FROM order_items')).toEqual({ intervalo: 'month', precio_centavos: 19900, creador_id: 'cre_a', comision_pct: 10 });
  });

  it('anual: el precio anual sale de la base, nunca del navegador', async () => {
    await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Clienta', email: 'cliente@mail.com', terminos: true, slug: 'mi-app', intervalo: 'year', precio: 1 } });
    const p = llamada('/checkout/sessions')[0].params;
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('199000');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('year');
    expect(fila('SELECT monto_centavos FROM orders').monto_centavos).toBe(199000);
  });

  it('un intervalo sin precio, un regalo, puntos o una suscripción ya activa no pasan', async () => {
    const b = { nombre: 'Clienta', email: 'cliente@mail.com', terminos: true };
    expect((await pedir('/api/checkout', { metodo: 'POST', body: { ...b, slug: 'app-beto', intervalo: 'year' } })).status).toBe(400);
    expect((await pedir('/api/checkout', { metodo: 'POST', body: { ...b, slug: 'mi-app', regalo: true } })).status).toBe(400);
    env.DB.raw.exec("INSERT INTO suscripciones (id, email, app, product_id, estado, creador_id) VALUES ('sub_ya', 'cliente@mail.com', 'cre-prod_app_a', 'prod_app_a', 'active', 'cre_a')");
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { ...b, slug: 'mi-app' } });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/tienda\/suscripcion/);
  });
});

describe('revisión: sin aprobar o sin pagos configurados no se vende', () => {
  const comprar = () => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Clienta', email: 'x@mail.com', terminos: true, slug: 'mi-app' } });
  it('producto en revisión, creador sin Stripe listo o suspendido → no está en la tienda ni se puede pagar', async () => {
    for (const sql of ["UPDATE products SET revision = 'en_revision', activo = 0 WHERE id = 'prod_app_a'",
      "UPDATE creadores SET stripe_listo = 0 WHERE id = 'cre_a'", "UPDATE creadores SET estado = 'suspendido' WHERE id = 'cre_a'"]) {
      env.DB.raw.exec(`UPDATE products SET revision = 'aprobado', activo = 1 WHERE id = 'prod_app_a'; UPDATE creadores SET stripe_listo = 1, estado = 'aprobado' WHERE id = 'cre_a'; ${sql}`);
      expect((await listarProductos(env)).map(p => p.slug)).not.toContain('mi-app');
      expect((await comprar()).status).toBe(404);
      expect((await pedir('/tienda/mi-app/')).status).toBe(404);
    }
    expect(llamada('/checkout/sessions')).toHaveLength(0);
  });

  it('Vorka OS solo aprueba un SaaS con URL de su app, correo de soporte y precio (sin pedir archivos)', async () => {
    env.DB.raw.exec(`UPDATE products SET revision = 'en_revision', activo = 0, contenido = json_set(contenido, '$.acceso.url', NULL) WHERE id = 'prod_app_a'`);
    await expect(admin.decidirProducto(env, 'prod_app_a', { aprobar: true })).rejects.toThrow(/URL de su app/);
    env.DB.raw.exec(`UPDATE products SET contenido = json_set(contenido, '$.acceso.url', 'https://miapp.com/entrar') WHERE id = 'prod_app_a'`);
    expect(await admin.decidirProducto(env, 'prod_app_a', { aprobar: true })).toMatchObject({ ok: true, publicado: true });
    expect(fila("SELECT revision, activo FROM products WHERE id = 'prod_app_a'")).toEqual({ revision: 'aprobado', activo: 1 });
  });
});

describe('dinero de cada factura (primer cobro y renovaciones)', () => {
  it('primer cobro: orden pagada, correo con la app del creador y transferencia por la factura con 20 % aunque el creador tenga 10 %', async () => {
    const orden = await suscribir();
    expect(fila('SELECT estado FROM orders').estado).toBe('paid');
    expect(fila('SELECT creador_id, app, estado FROM suscripciones')).toEqual({ creador_id: 'cre_a', app: 'cre-prod_app_a', estado: 'active' });
    const compra = correos.find(c => c.para === 'cliente@mail.com');
    expect(compra.texto).toContain('https://miapp.com/entrar');
    expect(compra.texto).toMatch(/Soporte de la app: lo da Ana Dev en soporte@miapp\.com/);
    expect(compra.texto).toContain('/tienda/suscripcion');
    const [t] = transf();
    expect(t).toMatchObject({ order_id: orden, factura_id: 'in_1', suscripcion_id: 'sub_c1', pago_id: 'pi_in_1', cargo_id: 'ch_in_1', estado: 'programada',
      comision_pct: 20, venta_centavos: 19900, comision_vorka_centavos: 3980, comision_stripe_centavos: 1179, monto_centavos: 14741 });
    expect(Math.round((Date.parse(t.disponible_en) - Date.now()) / 864e5)).toBe(DIAS_SUSCRIPCION.month);
    // El creador se entera de su venta (correo) y su app recibe el aviso de alta
    expect(correos.some(c => c.para === 'ana@dev.mx' && /Vendiste/.test(c.asunto))).toBe(true);
    expect(fila('SELECT tipo, estado FROM creador_avisos')).toEqual({ tipo: 'suscripcion.alta', estado: 'enviado' });
  });

  it('cada renovación paga al creador con 20 % y una sola vez aunque Stripe repita el aviso', async () => {
    await suscribir();
    stripe.facturas.in_2 = factura('in_2');
    for (let i = 0; i < 3; i++) expect((await evento('invoice.paid', 'in_2')).status).toBe(200);
    const r = transf();
    expect(r.map(t => t.factura_id)).toEqual(['in_1', 'in_2']);
    expect(r[1]).toMatchObject({ comision_pct: 20, comision_vorka_centavos: 3980, monto_centavos: 14741, order_id: stripe.orden });
    // Y el aviso de renovación sale una vez
    expect(filas("SELECT * FROM creador_avisos WHERE tipo = 'suscripcion.renovada'")).toHaveLength(1);
  });

  it('si después le suben el % al creador, la renovación usa el mayor', async () => {
    await suscribir();
    env.DB.raw.exec("UPDATE creadores SET comision_pct = 30 WHERE id = 'cre_a'");
    stripe.facturas.in_3 = factura('in_3');
    await evento('invoice.paid', 'in_3');
    expect(transf().find(t => t.factura_id === 'in_3')).toMatchObject({ comision_pct: 30, comision_vorka_centavos: 5970 });
  });

  it('el saldo a favor que dio Vorka (customer balance) lo absorbe Vorka: la venta del creador es el subtotal', async () => {
    await suscribir();
    stripe.facturas.in_4 = factura('in_4', { amount_paid: 9900 });
    await evento('invoice.paid', 'in_4');
    expect(transf().find(t => t.factura_id === 'in_4')).toMatchObject({ venta_centavos: 19900, comision_vorka_centavos: 3980 });
  });

  it('las renovaciones de un SaaS de creador no dan puntos', async () => {
    await suscribir();
    stripe.facturas.in_2 = factura('in_2');
    await evento('invoice.paid', 'in_2');
    expect(fila('SELECT COUNT(*) n FROM puntos_movimientos').n).toBe(0);
  });

  it('si Stripe aún no calcula su comisión, queda por calcular y el cron la completa', async () => {
    stripe.fee = null;
    await suscribir();
    expect(transf()[0]).toMatchObject({ estado: 'por_calcular', comision_vorka_centavos: 3980, comision_stripe_centavos: 0 });
    expect((await procesarTransferencias(env, new Date(Date.now() + 30 * 864e5).toISOString())).enviadas).toBe(0);
    expect(await facturasPorCalcular(env)).toBe(1);
    expect(transf()[0]).toMatchObject({ estado: 'programada', comision_stripe_centavos: 1179, monto_centavos: 14741, comision_pct: 20 });
  });

  it('se transfiere pasado el plazo, ligada al cargo de esa factura', async () => {
    await suscribir();
    expect((await procesarTransferencias(env)).enviadas).toBe(0);
    expect((await procesarTransferencias(env, new Date(Date.now() + 8 * 864e5).toISOString())).enviadas).toBe(1);
    const p = Object.fromEntries(llamada('/transfers')[0].params);
    expect(p).toMatchObject({ amount: '14741', currency: 'mxn', destination: 'acct_a', source_transaction: 'ch_in_1', transfer_group: 'in_1', 'metadata[factura_id]': 'in_1' });
    expect(transf()[0].estado).toBe('enviada');
  });

  it('plan anual: se transfiere 11 días después (cubre los 10 días para pedir reembolso)', async () => {
    const sus = { id: 'sub_y', creador_id: 'cre_a', intervalo: 'year', order_id: null };
    const t = await programarFactura(env, { factura: factura('in_y', { subtotal: 199000, amount_paid: 199000 }), sus, cobro: { pago_id: 'pi_y', cargo_id: 'ch_y', fee: 7000 } });
    expect(Math.round((Date.parse(t.disponible_en) - Date.now()) / 864e5)).toBe(11);
    expect(t).toMatchObject({ comision_vorka_centavos: 39800, monto_centavos: 199000 - 39800 - 7000 });
  });
});

describe('reembolsos y disputas de un cobro', () => {
  it('reembolso completo antes de transferir → se cancela', async () => {
    await suscribir();
    stripe.refunded.pi_in_1 = true;
    expect((await evento('charge.refunded', 'ch_in_1', { payment_intent: 'pi_in_1' })).status).toBe(200);
    expect(transf()[0].estado).toBe('cancelada');
    expect((await procesarTransferencias(env, new Date(Date.now() + 8 * 864e5).toISOString())).enviadas).toBe(0);
  });

  it('reembolso completo después de transferir → se revierte en Stripe', async () => {
    await suscribir();
    await procesarTransferencias(env, new Date(Date.now() + 8 * 864e5).toISOString());
    stripe.refunded.pi_in_1 = true;
    await evento('charge.refunded', 'ch_in_1', { payment_intent: 'pi_in_1' });
    expect(transf()[0].estado).toBe('revertida');
    expect(llamadas.filter(l => l.url.endsWith('/v1/transfers/tr_1/reversals'))).toHaveLength(1);
  });

  it('reembolso parcial → no se paga completo: queda para decidir a mano', async () => {
    await suscribir();
    stripe.refunded.pi_in_1 = false;
    await evento('charge.refunded', 'ch_in_1', { payment_intent: 'pi_in_1' });
    expect(transf()[0]).toMatchObject({ estado: 'error', error: expect.stringMatching(/parcial/) });
  });

  it('disputa → se revierte lo transferido; solo esa factura', async () => {
    await suscribir();
    stripe.facturas.in_2 = factura('in_2');
    await evento('invoice.paid', 'in_2');
    await procesarTransferencias(env, new Date(Date.now() + 8 * 864e5).toISOString());
    await evento('charge.dispute.created', 'dp_1');
    expect(transf().map(t => [t.factura_id, t.estado])).toEqual([['in_1', 'revertida'], ['in_2', 'enviada']]);
  });
});

describe('API para la app del creador', () => {
  const api = (ruta, llave, op = {}) => pedir(ruta, { ...op, headers: { ...(llave ? { authorization: `Bearer ${llave}` } : {}), origin: '' } });

  it('la llave se guarda solo como hash, se muestra una vez y rotarla apaga la anterior', async () => {
    const vieja = await crearLlave(env, 'cre_a');
    expect(vieja).toMatch(/^vk_[a-f0-9]{40}$/);
    const c = fila("SELECT api_llave_hash, api_llave_pista FROM creadores WHERE id = 'cre_a'");
    expect(c.api_llave_hash).not.toContain(vieja.slice(3));
    expect(c.api_llave_pista).toBe(vieja.slice(-4));
    expect((await api('/api/creadores/v1/yo', vieja)).status).toBe(200);
    const nueva = await crearLlave(env, 'cre_a');
    expect((await api('/api/creadores/v1/yo', vieja)).status).toBe(401);
    expect(await (await api('/api/creadores/v1/yo', nueva)).json()).toMatchObject({ creador: { id: 'cre_a' }, productos: [{ slug: 'mi-app' }] });
  });

  it('sin llave o con una inventada → 401', async () => {
    expect((await api('/api/creadores/v1/suscripciones?correo=a@b.mx')).status).toBe(401);
    expect((await api('/api/creadores/v1/suscripciones?correo=a@b.mx', `vk_${'0'.repeat(40)}`)).status).toBe(401);
  });

  it('responde { activa, estado, plan, periodo_fin } por correo y por id', async () => {
    await suscribir();
    const llave = await crearLlave(env, 'cre_a');
    const r = await (await api('/api/creadores/v1/suscripciones?correo=Cliente@Mail.com', llave)).json();
    expect(r).toMatchObject({ id: 'sub_c1', activa: true, estado: 'active', plan: 'month', periodo_fin: '2030-01-01T00:00:00.000Z', cancelar_al_final: false, producto: { slug: 'mi-app' } });
    expect(await (await api('/api/creadores/v1/suscripciones/sub_c1', llave)).json()).toMatchObject({ activa: true, correo: 'cliente@mail.com' });
    expect(await (await api('/api/creadores/v1/suscripciones?correo=nadie@mail.com', llave)).json()).toMatchObject({ activa: false, estado: null });
    expect((await api('/api/creadores/v1/suscripciones', llave)).status).toBe(400);
  });

  it('el creador B no ve a los suscriptores del creador A (ni por correo, ni por id, ni por producto, ni su portal)', async () => {
    await suscribir();
    const b = await crearLlave(env, 'cre_b');
    expect(await (await api('/api/creadores/v1/suscripciones?correo=cliente@mail.com', b)).json()).toMatchObject({ activa: false, estado: null });
    expect((await api('/api/creadores/v1/suscripciones/sub_c1', b)).status).toBe(404);
    expect((await api('/api/creadores/v1/suscripciones?correo=cliente@mail.com&producto=mi-app', b)).status).toBe(404);
    expect((await api('/api/creadores/v1/portal', b, { metodo: 'POST', body: { correo: 'cliente@mail.com' } })).status).toBe(404);
  });

  it('portal de clientes: liga de Stripe y regreso solo a la app de ese producto', async () => {
    await suscribir();
    const llave = await crearLlave(env, 'cre_a');
    expect((await api('/api/creadores/v1/portal', llave, { metodo: 'POST', body: { correo: 'cliente@mail.com', volver: 'https://otro.com/x' } })).status).toBe(400);
    const r = await api('/api/creadores/v1/portal', llave, { metodo: 'POST', body: { correo: 'cliente@mail.com', volver: 'https://miapp.com/cuenta' } });
    expect(await r.json()).toEqual({ url: 'https://billing.stripe.com/p/session/x' });
    expect(Object.fromEntries(llamada('/billing_portal/sessions')[0].params)).toMatchObject({ customer: 'cus_1', return_url: 'https://miapp.com/cuenta' });
  });

  it('límite por creador: 429 al pasar 120 por minuto', async () => {
    const llave = await crearLlave(env, 'cre_a');
    const ventana = Math.floor(Date.now() / 1000 / 60) * 60;
    env.DB.raw.prepare('INSERT INTO rate_limits (clave, ventana, conteo) VALUES (?, ?, 120)').run('api-cre:cre_a', ventana);
    expect((await api('/api/creadores/v1/yo', llave)).status).toBe(429);
  });
});

describe('avisos firmados a la app del creador', () => {
  const ultimoEnvio = () => llamadas.filter(l => l.url === APP_URL).at(-1);

  it('la firma verifica con el secreto del creador y no con otro, ni con el cuerpo cambiado, ni vieja', async () => {
    await suscribir();
    const envio = ultimoEnvio();
    const cab = envio.init.headers['vorka-firma'];
    const secreto = await secretoFirma(env, fila("SELECT * FROM creadores WHERE id = 'cre_a'"));
    expect(secreto).toMatch(/^whsec_[a-f0-9]{48}$/);
    expect(await firmaValida(secreto, envio.init.body, cab)).toBe(true);
    expect(await firmaValida(secreto, envio.init.body.replace('cliente@mail.com', 'otra@mail.com'), cab)).toBe(false);
    expect(await firmaValida(await secretoFirma(env, { id: 'cre_b' }), envio.init.body, cab)).toBe(false);
    expect(await firmaValida(secreto, envio.init.body, await firmar(secreto, envio.init.body, Math.floor(Date.now() / 1000) - 3600))).toBe(false);
    const cuerpo = JSON.parse(envio.init.body);
    expect(cuerpo).toMatchObject({ tipo: 'suscripcion.alta', datos: { suscripcion: { correo: 'cliente@mail.com', activa: true }, factura: { id: 'in_1' } } });
    expect(envio.init.headers['vorka-aviso-id']).toBe(cuerpo.id);
    // Rotar el secreto (subir la versión) invalida firmas viejas
    expect(await firmaValida(await secretoFirma(env, { id: 'cre_a', webhook_version: 2 }), envio.init.body, cab)).toBe(false);
  });

  it('pago fallido y cancelación también avisan, una vez cada uno', async () => {
    await suscribir();
    stripe.facturas.in_f = factura('in_f', { status: 'open', amount_paid: 0, attempt_count: 1 });
    stripe.sub = sub({ status: 'past_due' });
    await evento('invoice.payment_failed', 'in_f');
    await evento('invoice.payment_failed', 'in_f');
    stripe.sub = sub({ status: 'canceled', ended_at: Math.floor(Date.now() / 1000) });
    await evento('customer.subscription.deleted', 'sub_c1');
    await evento('customer.subscription.deleted', 'sub_c1');
    expect(filas('SELECT tipo FROM creador_avisos ORDER BY created_at').map(a => a.tipo)).toEqual(['suscripcion.alta', 'suscripcion.pago_fallido', 'suscripcion.cancelada']);
    expect(fila('SELECT cancelada_at FROM suscripciones').cancelada_at).toBeTruthy();
    expect(transf()).toHaveLength(1);   // la factura fallida no programa nada
  });

  it('si la app no responde 2xx, el cron reintenta con espera creciente y al final queda fallido', async () => {
    respuestaApp = 500;
    await suscribir();
    let a = fila('SELECT * FROM creador_avisos');
    expect(a).toMatchObject({ estado: 'pendiente', intentos: 1, ultimo_status: 500 });
    expect(Date.parse(a.proximo_at) - Date.now()).toBeGreaterThan((ESPERAS_MIN[0] - 1) * 60e3);
    respuestaApp = 200;
    expect(await procesarAvisos(env, Date.now() + 10 * 60e3)).toEqual({ enviados: 1, fallidos: 0 });
    expect(fila('SELECT estado, intentos FROM creador_avisos')).toEqual({ estado: 'enviado', intentos: 2 });

    respuestaApp = 503;
    const c = fila("SELECT * FROM creadores WHERE id = 'cre_a'");
    const x = await encolarAviso(env, c, 'suscripcion.renovada', 'manual:1', {});
    let t = Date.now();
    for (let i = 0; i <= ESPERAS_MIN.length; i++) { await entregarAviso(env, { ...fila('SELECT * FROM creador_avisos WHERE id = ?', x.id) }, c, t); t += 2 * 864e5; }
    expect(fila('SELECT estado FROM creador_avisos WHERE id = ?', x.id).estado).toBe('fallido');
  });

  it('URL de avisos: solo https con dominio, fuera de vorka.mx', () => {
    expect(urlAvisoValida('https://miapp.com/hook')).toBe('https://miapp.com/hook');
    for (const u of ['http://miapp.com/hook', 'https://127.0.0.1/x', 'https://localhost/x', 'https://vorka.mx/api/x', 'https://os.vorka.mx/x', 'https://user:pw@miapp.com/x', 'nada'])
      expect(urlAvisoValida(u)).toBeNull();
  });
});

describe('portal del creador y su editor', () => {
  async function sesion(id = 'cre_a') {
    const r = await pedir(new URL(await crearEnlace(env, id)).pathname);
    return r.headers.get('set-cookie').split(';')[0];
  }

  it('crea un SaaS: precio mensual y anual (mínimo $20), URL de su app y soporte; el servidor arma la suscripción', async () => {
    const cookie = await sesion('cre_b');
    const base = { tipo: 'saas', nombre: 'Facturas Fáciles', descripcion_corta: 'Facturación para fondas.', contenido: { incluye: [], pasos: [], para_quien: [], faq: [] } };
    const mal = await pedir('/api/creadores/productos', { metodo: 'POST', headers: { cookie }, body: { ...base, saas: { precio_mensual: 10, app_url: 'https://facturas.mx', soporte: 'hola@facturas.mx' } } });
    expect((await mal.json()).error).toMatch(/mínimo es \$20/);
    const sinPrecio = await pedir('/api/creadores/productos', { metodo: 'POST', headers: { cookie }, body: { ...base, saas: { app_url: 'https://facturas.mx', soporte: 'hola@facturas.mx' } } });
    expect((await sinPrecio.json()).error).toMatch(/mensual, el anual o los dos/);
    const r = await pedir('/api/creadores/productos', { metodo: 'POST', headers: { cookie }, body: { ...base, saas: { precio_mensual: '149', precio_anual: '1490', app_url: 'https://facturas.mx/entrar', soporte: 'hola@facturas.mx' } } });
    const p = await r.json();
    expect(r.status).toBe(200);
    const g = fila('SELECT * FROM products WHERE id = ?', p.id);
    expect(g).toMatchObject({ creador_id: 'cre_b', revision: 'borrador', activo: 0, precio_centavos: 14900 });
    expect(JSON.parse(g.contenido)).toMatchObject({ tipo: 'saas', acceso: { app: `cre-${p.id}`, tipo: 'saas', url: 'https://facturas.mx/entrar', soporte: 'hola@facturas.mx', creador: 'Beto Soft' },
      suscripcion: { intervalo: 'month', precios: { month: 14900, year: 149000 } } });
    // A revisión sin pedir archivos
    expect((await pedir(`/api/creadores/productos/${p.id}/revision`, { metodo: 'POST', headers: { cookie } })).status).toBe(200);
    expect(fila('SELECT revision FROM products WHERE id = ?', p.id).revision).toBe('en_revision');
  });

  it('el panel muestra suscriptores, MRR (bruto / Vorka / tuyo), próximos depósitos, cobros por factura e integración', async () => {
    await suscribir();
    const html = await (await pedir('/creadores/panel', { headers: { cookie: await sesion('cre_a') } })).text();
    expect(html).toContain('Suscriptores activos');
    expect(html).toMatch(/\$199 MXN<\/b><span>Ingreso mensual/);
    expect(html).toMatch(/\$39\.8 MXN<\/b><span>Vorka \(20 %\)/);
    expect(html).toMatch(/\$159\.2 MXN<\/b><span>Tu parte al mes/);
    expect(html).toContain('Próximos depósitos');
    expect(html).toContain('in_1');
    expect(html).toContain('Integración con tu app');
  });

  it('integración desde el portal: crear llave, guardar URL (validada) y enviar prueba', async () => {
    const cookie = await sesion('cre_b');
    const { llave } = await (await pedir('/api/creadores/integracion/llave', { metodo: 'POST', headers: { cookie } })).json();
    expect(llave).toMatch(/^vk_/);
    expect((await pedir('/api/creadores/integracion/aviso', { metodo: 'PUT', headers: { cookie }, body: { url: 'http://inseguro.com' } })).status).toBe(400);
    expect(await (await pedir('/api/creadores/integracion/aviso', { metodo: 'PUT', headers: { cookie }, body: { url: APP_URL } })).json()).toEqual({ url: APP_URL });
    const prueba = await (await pedir('/api/creadores/integracion/prueba', { metodo: 'POST', headers: { cookie } })).json();
    expect(prueba).toMatchObject({ ok: true, status: 200 });
    const envio = llamadas.filter(l => l.url === APP_URL).at(-1);
    const { secreto } = await (await pedir('/api/creadores/integracion/secreto', { metodo: 'POST', headers: { cookie } })).json();
    expect(await firmaValida(secreto, envio.init.body, envio.init.headers['vorka-firma'])).toBe(true);
    expect(JSON.parse(envio.init.body).tipo).toBe('prueba');
  });

  it('la documentación es pública y trae los ejemplos de curl y JS', async () => {
    const html = await (await pedir('/creadores/docs')).text();
    expect(html).toContain('Authorization: Bearer $VORKA_API_KEY');
    expect(html).toContain('createHmac');
    expect(html).toContain('crypto.subtle.verify');
    expect(html).toContain('suscripcion.pago_fallido');
  });
});

describe('página de la tienda', () => {
  it('"por <creador>", precio /mes, quién da soporte y oferta con precio por periodo en el JSON-LD', async () => {
    const r = await pedir('/tienda/mi-app/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('por Ana Dev');
    expect(html).toContain('/mes');
    expect(html).toContain('soporte@miapp.com');
    expect(html).toContain('id="form-saas"');
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].replace(/\\u003c/g, '<'));
    const prod = ld.find(x => x['@type'] === 'Product');
    expect(prod.brand.name).toBe('Ana Dev');
    expect(prod.offers).toHaveLength(2);
    expect(prod.offers[0]).toMatchObject({ price: '199.00', priceCurrency: 'MXN', seller: { name: 'Vorka México' },
      priceSpecification: { '@type': 'UnitPriceSpecification', price: '199.00', referenceQuantity: { value: 1, unitCode: 'MON' } } });
    expect(prod.offers[1].priceSpecification.referenceQuantity.unitCode).toBe('ANN');
  });

  it('en el catálogo sale con su creador y el precio al mes', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html).toContain('Por Ana Dev.');
    expect(html).toContain('$199 MXN al mes');
  });
});

describe('el comprador administra su suscripción en la tienda', () => {
  it('pide un enlace a su correo y el enlace abre el portal de Stripe; un enlace alterado no sirve', async () => {
    await suscribir();
    correos = [];
    await pedir('/tienda/suscripcion', { metodo: 'POST', form: { email: 'cliente@mail.com' } });
    await Promise.all(ctx.pendientes);
    const enlace = correos[0].texto.match(/https:\/\/vorka\.mx\/tienda\/suscripcion\/\S+/)[0];
    const r = await pedir(new URL(enlace).pathname);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('https://billing.stripe.com/p/session/x');
    const alterado = (await enlacePortal(env, 'cliente@mail.com')).replace(/.$/, c => (c === 'a' ? 'b' : 'a'));
    expect((await pedir(new URL(alterado).pathname)).status).toBe(410);
    // Un correo sin suscripción no recibe nada (y la respuesta es la misma)
    correos = [];
    await pedir('/tienda/suscripcion', { metodo: 'POST', form: { email: 'nadie@mail.com' } });
    await Promise.all(ctx.pendientes);
    expect(correos).toHaveLength(0);
  });
});
