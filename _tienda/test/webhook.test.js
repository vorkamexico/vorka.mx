import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden } from '../src/modelo.js';
import { firmaValida } from '../src/pagos/stripe.js';
import { enc, hex } from '../src/util.js';

const SECRETO = 'whsec_prueba';
let env, orden, stripe, correos, resendFalla;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000), secreto = SECRETO) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}

async function evento(tipo, objeto, { id = `evt_${Math.random().toString(36).slice(2)}`, firma, cuerpoFalso } = {}) {
  // El cuerpo trae datos "mentirosos" a propósito: el webhook debe ignorarlos y consultar a Stripe
  const cuerpo = JSON.stringify({ id, type: tipo, data: { object: { id: objeto, payment_status: 'paid', amount_total: 1, ...cuerpoFalso } } });
  const r = await worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': firma ?? await firmar(cuerpo) }, body: cuerpo,
  }), env);
  return { r, id };
}

// Estado "real" en Stripe que el webhook consultará
const sesion = (o = {}) => ({ id: 'cs_1', metadata: { order_id: orden.id }, client_reference_id: orden.id, amount_total: 27900, currency: 'mxn',
  status: 'complete', payment_status: 'paid', payment_intent: { id: 'pi_1', status: 'succeeded', payment_method: { type: 'card' } }, ...o });

beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, RESEND_API_KEY: 're_x', DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64) };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  orden = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'ana@mail.com', nombre: 'Ana López' });
  stripe = { sesion: sesion(), pi: null, disputa: null };
  correos = []; resendFalla = false;
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    const ok = b => new Response(JSON.stringify(b), { status: 200 });
    if (url.startsWith('https://api.resend.com')) {
      if (resendFalla) return new Response('caído', { status: 503 });
      correos.push(JSON.parse(init.body)); return ok({ id: 'em_1' });
    }
    if (url.includes('/checkout/sessions/')) return ok(stripe.sesion);
    if (url.includes('/charges/')) throw new Error('No se usa la API de Charges');
    if (url.includes('/payment_intents/')) return ok(stripe.pi);
    if (url.includes('/disputes/')) return ok(stripe.disputa);
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const estado = () => env.DB.raw.prepare('SELECT * FROM orders WHERE id = ?').get(orden.id);
const tokens = () => env.DB.raw.prepare('SELECT * FROM download_tokens').all();

describe('webhook de Stripe', () => {
  it('tarjeta aprobada → paid, un token y un correo con el enlace', async () => {
    const { r } = await evento('checkout.session.completed', 'cs_1');
    expect(r.status).toBe(200);
    expect(estado()).toMatchObject({ estado: 'paid', provider_payment_id: 'pi_1', metodo_pago: 'card' });
    expect(estado().correo_enviado_at).toBeTruthy();
    expect(tokens()).toHaveLength(1);
    expect(correos).toHaveLength(1);
    expect(correos[0]).toMatchObject({ to: ['ana@mail.com'], from: 'Vorka México <tienda@vorka.mx>' });
    expect(correos[0].text).toMatch(/https:\/\/vorka\.mx\/descargas\/[a-f0-9]{64}/);
    expect(correos[0].html).toContain('Descargar mis archivos');
    // El token en claro no está en la base; solo su hash
    const enCorreo = correos[0].text.match(/descargas\/([a-f0-9]{64})/)[1];
    expect(tokens()[0].token_hash).not.toBe(enCorreo);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM events WHERE tipo = 'purchase'").get().n).toBe(1);
  });

  it('el mismo webhook 3 veces → un correo y un token', async () => {
    const { id } = await evento('checkout.session.completed', 'cs_1');
    const r2 = await evento('checkout.session.completed', 'cs_1', { id });
    const r3 = await evento('checkout.session.completed', 'cs_1', { id });
    expect([r2.r.status, r3.r.status]).toEqual([200, 200]);
    expect(correos).toHaveLength(1);
    expect(tokens()).toHaveLength(1);
  });

  it('eventos distintos del mismo pago, en paralelo → un correo y un token', async () => {
    await Promise.all([
      evento('checkout.session.completed', 'cs_1'),
      evento('checkout.session.async_payment_succeeded', 'cs_1'),
      evento('checkout.session.completed', 'cs_1'),
    ]);
    expect(correos).toHaveLength(1);
    expect(tokens()).toHaveLength(1);
  });

  it('firma inválida → 401 y nada cambia', async () => {
    const { r } = await evento('checkout.session.completed', 'cs_1', { firma: 't=1,v1=deadbeef' });
    expect(r.status).toBe(401);
    expect(estado().estado).toBe('pending');
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM webhook_events').get().n).toBe(0);
    expect(correos).toHaveLength(0);
  });

  it('firma con otro secreto o vieja → 401', async () => {
    expect((await evento('checkout.session.completed', 'cs_1', { firma: await firmar('{}', undefined, 'whsec_otro') })).r.status).toBe(401);
    const cuerpo = '{"id":"evt_v","type":"x","data":{"object":{"id":"cs_1"}}}';
    expect(await firmaValida(cuerpo, await firmar(cuerpo, Math.floor(Date.now() / 1000) - 600), SECRETO)).toBe(false);
  });

  it('no confía en el cuerpo: si Stripe dice que no está pagado, no entrega', async () => {
    stripe.sesion = sesion({ payment_status: 'unpaid', payment_intent: { id: 'pi_1', status: 'requires_action', payment_method: { type: 'oxxo' } } });
    await evento('checkout.session.completed', 'cs_1', { cuerpoFalso: { payment_status: 'paid' } });
    expect(estado().estado).toBe('pending');
    expect(correos).toHaveLength(0);
  });

  it('OXXO pendiente → sigue pending; al pagarse llega el correo', async () => {
    stripe.sesion = sesion({ payment_status: 'unpaid', payment_intent: { id: 'pi_1', status: 'requires_action', payment_method: { type: 'oxxo' } } });
    await evento('checkout.session.completed', 'cs_1');
    expect(estado()).toMatchObject({ estado: 'pending', metodo_pago: null });
    stripe.sesion = sesion({ payment_intent: { id: 'pi_1', status: 'succeeded', payment_method: { type: 'oxxo' } } });
    await evento('checkout.session.async_payment_succeeded', 'cs_1');
    expect(estado()).toMatchObject({ estado: 'paid', metodo_pago: 'oxxo' });
    expect(correos).toHaveLength(1);
  });

  it('OXXO vencido → failed', async () => {
    stripe.sesion = sesion({ payment_status: 'unpaid', payment_intent: { id: 'pi_1', status: 'requires_payment_method', payment_method: { type: 'oxxo' } } });
    await evento('checkout.session.async_payment_failed', 'cs_1');
    expect(estado().estado).toBe('failed');
  });

  it('sesión expirada sin pagar → failed', async () => {
    stripe.sesion = sesion({ status: 'expired', payment_status: 'unpaid', payment_intent: null });
    await evento('checkout.session.expired', 'cs_1');
    expect(estado().estado).toBe('failed');
  });

  it('monto distinto → no se entrega', async () => {
    stripe.sesion = sesion({ amount_total: 100 });
    await evento('checkout.session.completed', 'cs_1');
    expect(estado().estado).toBe('pending');
    expect(correos).toHaveLength(0);
  });

  it('reembolso total → refunded y tokens revocados', async () => {
    await evento('checkout.session.completed', 'cs_1');
    stripe.pi = { id: 'pi_1', metadata: { order_id: orden.id }, latest_charge: { id: 'ch_1', refunded: true } };
    await evento('charge.refunded', 'ch_1', { cuerpoFalso: { payment_intent: 'pi_1' } });
    expect(estado().estado).toBe('refunded');
    expect(tokens().every(t => t.revocado === 1)).toBe(true);
  });

  it('reembolso parcial → no cambia nada', async () => {
    await evento('checkout.session.completed', 'cs_1');
    stripe.pi = { id: 'pi_1', metadata: { order_id: orden.id }, latest_charge: { id: 'ch_1', refunded: false } };
    await evento('charge.refunded', 'ch_1', { cuerpoFalso: { payment_intent: 'pi_1' } });
    expect(estado().estado).toBe('paid');
  });

  it('contracargo → refunded y tokens revocados', async () => {
    await evento('checkout.session.completed', 'cs_1');
    stripe.disputa = { id: 'dp_1', payment_intent: { id: 'pi_1', metadata: { order_id: orden.id } } };
    await evento('charge.dispute.created', 'dp_1');
    expect(estado().estado).toBe('refunded');
    expect(tokens()[0].revocado).toBe(1);
  });

  it('si el correo falla: 500, sin token huérfano; el reintento de Stripe entrega', async () => {
    resendFalla = true;
    const { r, id } = await evento('checkout.session.completed', 'cs_1');
    expect(r.status).toBe(500);
    expect(estado()).toMatchObject({ estado: 'paid', correo_enviado_at: null });
    expect(tokens()).toHaveLength(0);
    expect(env.DB.raw.prepare('SELECT error FROM webhook_events').get().error).toMatch(/Resend 503/);
    resendFalla = false;
    expect((await evento('checkout.session.completed', 'cs_1', { id })).r.status).toBe(200);
    expect(correos).toHaveLength(1);
    expect(tokens()).toHaveLength(1);
  });

  it('eventos que no nos importan → 200 sin cambios', async () => {
    const { r } = await evento('customer.created', 'cus_1');
    expect(r.status).toBe(200);
    expect(estado().estado).toBe('pending');
  });

  it('proveedor desconocido → 404', async () => {
    const r = await worker.fetch(new Request('https://vorka.mx/api/webhooks/paypal', { method: 'POST', body: '{}' }), env);
    expect(r.status).toBe(404);
  });
});
