// Stripe Checkout (página de pago hospedada por Stripe). Sin SDK: la API REST con fetch basta en Workers.
// Métodos: tarjeta (con meses sin intereses si la cuenta los tiene), OXXO y SPEI (customer_balance → mx_bank_transfer).

const API = 'https://api.stripe.com/v1';

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
  // Sin stripe-version: usa la versión fijada en la cuenta (Dashboard → Developers). Fijarla aquí al pasar a producción.
  const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
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

// Configurable desde wrangler.jsonc (vars.STRIPE_METODOS) para no tocar código si un método no está activo en la cuenta
export const metodos = env => String(env.STRIPE_METODOS || 'card,oxxo,customer_balance').split(',').map(s => s.trim()).filter(Boolean);

export function sesionCheckout(env, orden, { exito, cancelar }) {
  const tipos = metodos(env);
  const opciones = {};
  if (tipos.includes('oxxo')) opciones.oxxo = { expires_after_days: 3 };
  if (tipos.includes('customer_balance'))
    opciones.customer_balance = { funding_type: 'bank_transfer', bank_transfer: { type: 'mx_bank_transfer' } };
  return {
    mode: 'payment',
    locale: 'es-419',
    client_reference_id: orden.id,
    customer_email: orden.email,
    // SPEI necesita un Customer de Stripe para asignar la CLABE de referencia
    customer_creation: tipos.includes('customer_balance') ? 'always' : undefined,
    payment_method_types: tipos,
    payment_method_options: opciones,
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

export default {
  nombre: 'stripe',

  async crearCobro(env, orden, urls) {
    // Idempotency-Key = id de la orden: un reintento de red no crea dos sesiones
    const s = await llamar(env, 'POST', '/checkout/sessions', sesionCheckout(env, orden, urls), { idempotencia: `checkout-${orden.id}` });
    return { sessionId: s.id, url: s.url };
  },

  // leerWebhook e interpretar llegan en el bloque de webhook
};
