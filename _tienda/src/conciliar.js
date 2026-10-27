// Conciliación de pagos (cada hora, en el cron): pregunta a Stripe por las órdenes que siguen "pending" y aplica lo que
// diga, igual que el webhook. Red de seguridad para OXXO y SPEI, que se pagan horas o días después del checkout: si el
// aviso de Stripe no llega (o el endpoint no está suscrito a checkout.session.async_payment_succeeded), la orden se
// corrige sola y el correo de acceso sale en menos de una hora.
import { all } from './util.js';
import { proveedor } from './pagos/index.js';
import { procesarPago } from './webhook.js';

const DIAS = 5;       // OXXO vence a los 3 días; el checkout se puede completar hasta 24 h después de abrirlo
const POR_CORRIDA = 40;

export async function conciliarPendientes(env, ahora = Date.now()) {
  if (!env.STRIPE_SECRET_KEY) return { revisadas: 0 };
  const stripe = proveedor('stripe');
  const ordenes = await all(env, `SELECT id, provider_session_id FROM orders WHERE estado = 'pending' AND proveedor = 'stripe'
      AND provider_session_id IS NOT NULL AND created_at >= ? ORDER BY created_at DESC LIMIT ?`,
    new Date(ahora - DIAS * 864e5).toISOString(), POR_CORRIDA);
  const cuenta = { revisadas: ordenes.length, pagadas: 0, fallidas: 0, errores: 0 };
  for (const o of ordenes) {
    try {
      const pago = await stripe.interpretar({ tipo: 'checkout.session.completed', objeto: o.provider_session_id }, env);
      if (!pago || pago.orderId !== o.id) continue;
      const r = await procesarPago(env, pago);
      if (r?.cambia && r.orden?.estado === 'paid') cuenta.pagadas++;
      if (r?.cambia && r.orden?.estado === 'failed') cuenta.fallidas++;
    } catch (e) { cuenta.errores++; console.error('conciliar', o.id, e?.message); }
  }
  return cuenta;
}
