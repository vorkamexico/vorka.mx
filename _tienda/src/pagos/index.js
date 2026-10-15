// Interfaz PaymentProvider. Cada pasarela implementa:
//
//   nombre: 'stripe' | 'mercadopago'
//   crearCobro(env, orden, { exito, cancelar }) → { sessionId, url }
//       Crea la sesión de pago hospedada por la pasarela. `orden` ya trae monto e items leídos de D1.
//   leerWebhook(request, env) → { id, tipo, payload } | null
//       Verifica la firma y devuelve el evento; null si la firma no es válida (→ 401).
//   interpretar(evento, env) → { orderId, resultado, monto_centavos, moneda, provider_payment_id, metodo_pago } | null
//       Traduce el evento a un resultado normalizado (ver estados.js), consultando la API de la pasarela
//       cuando haga falta: nunca se confía en el cuerpo del webhook. null si el evento no nos importa.
//
// Agregar Mercado Pago = escribir pagos/mercadopago.js con esta misma forma y registrarlo aquí.
import stripe from './stripe.js';

const PROVEEDORES = { stripe };

export const PROVEEDOR_DEFAULT = 'stripe';

export function proveedor(nombre = PROVEEDOR_DEFAULT) {
  const p = PROVEEDORES[nombre];
  if (!p) throw new Error(`Proveedor de pago desconocido: ${nombre}`);
  return p;
}
