// Stripe Checkout (página de pago hospedada por Stripe). Sin SDK: la API REST con fetch basta en Workers.
// Métodos dinámicos (Dashboard): tarjeta, OXXO y SPEI (customer_balance → mx_bank_transfer, requiere Customer).

import { enc, hex, iguales } from '../util.js';

const API = 'https://api.stripe.com/v1';
export const STRIPE_VERSION = '2026-09-30.endive';
const TOLERANCIA_S = 300; // firmas con más de 5 min se rechazan (evita repetir un webhook viejo)

// { a: { b: [1, 2] } } → a[b][0]=1&a[b][1]=2  (formato que espera Stripe)
export function formulario(obj, prefijo = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const clave = prefijo ? `${prefijo}[${k}]` : k;
    if (typeof v === 'object') formulario(v, clave, out);
    else out.append(clave, String(v));
  }
  return out;
}

export async function llamar(env, metodo, ruta, datos, { idempotencia } = {}) {
  // Versión fijada: un cambio de versión en la cuenta no puede romper el cobro. Crear el webhook con esta misma versión.
  const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'stripe-version': STRIPE_VERSION };
  if (datos) headers['content-type'] = 'application/x-www-form-urlencoded';
  if (idempotencia) headers['idempotency-key'] = idempotencia;
  const r = await fetch(API + ruta, { method: metodo, headers, body: datos ? formulario(datos) : undefined });
  const body = await r.json();
  if (!r.ok) {
    const e = new Error(`Stripe ${r.status}: ${body?.error?.message || 'error'}`);
    e.status = r.status;
    throw e;
  }
  return body;
}

// Etiqueta para comparar este flujo en el Dashboard (API 2026-03-25.dahlia o posterior)
export const INTEGRACION = 'vorka-tienda-checkout-qmzvhrtk';

// Cliente de Stripe reutilizado por correo (SPEI lo exige; también deja el historial de compras junto)
export async function clienteStripe(env, orden) {
  const ya = await env.DB.prepare('SELECT customer_id FROM stripe_clientes WHERE email = ?').bind(orden.email).first();
  if (ya) return ya.customer_id;
  const c = await llamar(env, 'POST', '/customers', { email: orden.email, name: orden.nombre, preferred_locales: ['es-419'], metadata: { fuente: 'vorka-tienda' } },
    { idempotencia: `cliente-${orden.email}` });
  await env.DB.prepare('INSERT OR IGNORE INTO stripe_clientes (email, customer_id) VALUES (?, ?)').bind(orden.email, c.id).run();
  return c.id;
}

// Métodos de pago dinámicos: cuáles aparecen (tarjeta, OXXO, SPEI…) se decide en Dashboard → Settings → Payment methods.
// Nunca se manda payment_method_types (en 2026-09-30.endive ya no existe para Checkout).
export function sesionCheckout(env, orden, { exito, cancelar }, customer) {
  return {
    mode: 'payment',
    locale: 'es-419',
    client_reference_id: orden.id,
    customer,
    integration_identifier: INTEGRACION,
    payment_method_options: {
      oxxo: { expires_after_days: 3 },
      customer_balance: { funding_type: 'bank_transfer', bank_transfer: { type: 'mx_bank_transfer' } },
    },
    line_items: orden.items.map(i => ({
      quantity: i.cantidad,
      price_data: { currency: orden.moneda.toLowerCase(), unit_amount: i.precio_centavos, product_data: { name: i.nombre, metadata: { product_id: i.product_id } } },
    })),
    metadata: { order_id: orden.id },
    // También en el PaymentIntent: los reembolsos y contracargos llegan con él, no con la sesión
    payment_intent_data: { metadata: { order_id: orden.id } },
    success_url: exito,
    cancel_url: cancelar,
  };
}

// Stripe-Signature: "t=1700000000,v1=abc…,v1=def…". Firma = HMAC-SHA256(secreto, `${t}.${cuerpo}`)
export async function firmaValida(cuerpo, cabecera, secreto, ahora = Date.now()) {
  if (!cabecera || !secreto) return false;
  const partes = cabecera.split(',').map(p => p.split('='));
  const t = Number(partes.find(([k]) => k === 't')?.[1]);
  const firmas = partes.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !firmas.length || Math.abs(ahora / 1000 - t) > TOLERANCIA_S) return false;
  const llave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const esperada = hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)));
  return firmas.some(f => iguales(f, esperada));
}

const EVENTOS_SESION = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'];
export const EVENTOS = [...EVENTOS_SESION, 'charge.refunded', 'charge.dispute.created'];

// Estado del PaymentIntent → resultado normalizado
function resultadoDeIntent(pi) {
  if (!pi) return null;
  if (pi.status === 'succeeded') return 'aprobado';
  if (['processing', 'requires_action', 'requires_confirmation'].includes(pi.status)) return 'pendiente'; // OXXO/SPEI esperando pago
  return 'rechazado'; // requires_payment_method (vencido/rechazado) o canceled
}

export default {
  nombre: 'stripe',

  async crearCobro(env, orden, urls) {
    // Idempotency-Key = id de la orden: un reintento de red no crea dos sesiones
    const customer = await clienteStripe(env, orden);
    const s = await llamar(env, 'POST', '/checkout/sessions', sesionCheckout(env, orden, urls, customer), { idempotencia: `checkout-${orden.id}` });
    return { sessionId: s.id, url: s.url };
  },

  async leerWebhook(request, env) {
    const cuerpo = await request.text();
    if (!(await firmaValida(cuerpo, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET))) return null;
    const ev = JSON.parse(cuerpo);
    // pago: id del PaymentIntent del objeto (para reembolsos); se vuelve a consultar en la API antes de usarlo
    return { id: ev.id, tipo: ev.type, objeto: ev.data?.object?.id, pago: ev.data?.object?.payment_intent || null, payload: cuerpo };
  },

  // Nunca se usa el contenido del webhook: solo su tipo y el id del objeto, y se consulta a Stripe.
  async interpretar(evento, env) {
    if (EVENTOS_SESION.includes(evento.tipo)) {
      const s = await llamar(env, 'GET', `/checkout/sessions/${encodeURIComponent(evento.objeto)}?expand[]=payment_intent.payment_method&expand[]=payment_intent.latest_charge.balance_transaction`);
      const orderId = s.metadata?.order_id || s.client_reference_id;
      if (!orderId) return null;
      const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null;
      let resultado;
      if (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') resultado = 'aprobado';
      else if (s.status === 'expired') resultado = 'rechazado';
      else resultado = resultadoDeIntent(pi) || 'pendiente';
      return {
        orderId, resultado,
        monto_centavos: s.amount_total, moneda: s.currency,
        provider_payment_id: pi?.id || null,
        metodo_pago: pi?.payment_method?.type || null,
        // Para el reparto a creadores: el cargo (source_transaction) y la comisión real que cobró Stripe
        provider_charge_id: typeof pi?.latest_charge === 'object' ? pi.latest_charge?.id : pi?.latest_charge || null,
        stripe_fee_centavos: pi?.latest_charge?.balance_transaction?.fee ?? null,
      };
    }
    if (evento.tipo === 'charge.refunded') {
      // Se consulta el PaymentIntent (no la API de Charges) y su último cargo
      if (!evento.pago) return null;
      const pi = await llamar(env, 'GET', `/payment_intents/${encodeURIComponent(evento.pago)}?expand[]=latest_charge`);
      const orderId = pi.metadata?.order_id;
      // Reembolso parcial: no se revoca el acceso (se decide a mano en el panel)
      if (!orderId || !pi.latest_charge?.refunded) return null;
      return { orderId, resultado: 'reembolsado', provider_payment_id: pi.id };
    }
    if (evento.tipo === 'charge.dispute.created') {
      const d = await llamar(env, 'GET', `/disputes/${encodeURIComponent(evento.objeto)}?expand[]=payment_intent`);
      const orderId = d.payment_intent?.metadata?.order_id;
      if (!orderId) return null;
      return { orderId, resultado: 'reembolsado', provider_payment_id: d.payment_intent.id };
    }
    return null;
  },
};
