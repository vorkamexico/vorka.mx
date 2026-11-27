// Recordatorio de ficha OXXO sin pagar (nov 2026): quien eligió OXXO sale de Stripe con una referencia y muchas veces no
// vuelve. Un solo correo, ~20 h después de abrir el pago y antes de que venza (3 días), con el botón a SU ficha (la de Stripe,
// no un pago nuevo: así nadie paga dos veces). Solo de 9:00 a 20:59 del centro de México.
// Usa recordatorio_at/seguimientos de la orden: si la ficha vence sin pagarse, la orden pasa a «failed» y el recordatorio de
// compra sin terminar (recordatorio.js) sigue con su 2.º y 3.º correo, con liga para pagar de nuevo.
import { all, run, ahoraISO, correoOculto, pesos } from './util.js';
import { marco, boton, lista, enviar, esc, P, SOPORTE } from './correo.js';
import { llamar } from './pagos/stripe.js';

export const OXXO = { espera: 20 * 36e5, hasta: 72 * 36e5, lote: 20, horario: [9, 20] };

const horaMexico = ms => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hourCycle: 'h23' }).format(new Date(ms)));
const diaMexico = seg => new Date(seg * 1000).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
const fechaMexico = seg => new Date(seg * 1000).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

export function correoFichaOxxo(orden, items, ficha) {
  const nombre = String(orden.nombre || '').split(' ')[0] || 'hola';
  const vence = ficha.expires_after ? fechaMexico(ficha.expires_after) : null;
  const asunto = ficha.expires_after ? `Tu ficha de OXXO vence el ${diaMexico(ficha.expires_after)}` : 'Tu ficha de OXXO sigue esperando tu pago';
  const monto = pesos(orden.monto_centavos);
  const html = marco('Tu ficha de OXXO sigue esperando', `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">Apartaste tu compra para pagarla en OXXO y todavía no vemos el pago.</p>
${lista(items.map(i => esc(i.nombre)))}
<p style="${P}">Paga <b>${esc(monto)}</b> en cualquier OXXO con tu referencia${ficha.number ? ` <b>${esc(ficha.number)}</b>` : ''}${vence ? ` antes del <b>${esc(vence)}</b>` : ''}. Aquí está tu ficha:</p>
${boton(ficha.hosted_voucher_url, 'Ver mi ficha de OXXO')}
<p style="${P}">Si ya pagaste, ignora este correo: OXXO confirma el pago hasta 1 día hábil después y en cuanto se refleje te llega tu acceso.</p>
<p style="${P}">¿Dudas? Responde este correo o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)}</p>`);
  const texto = `Hola, ${nombre}:

Apartaste tu compra para pagarla en OXXO y todavía no vemos el pago.

${items.map(i => `- ${i.nombre}`).join('\n')}

Paga ${monto} en cualquier OXXO con tu referencia${ficha.number ? ` ${ficha.number}` : ''}${vence ? ` antes del ${vence}` : ''}. Tu ficha:
${ficha.hosted_voucher_url}

Si ya pagaste, ignora este correo: OXXO confirma el pago hasta 1 día hábil después y en cuanto se refleje te llega tu acceso.

¿Dudas? Responde este correo o escríbenos por WhatsApp: ${SOPORTE.whatsapp}

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// Cron de cada hora
export async function recordatoriosOxxo(env, ahora = Date.now()) {
  const r = { revisadas: 0, enviados: 0, omitidas: 0 };
  if (!env.STRIPE_SECRET_KEY) return r;
  const h = horaMexico(ahora);
  if (h < OXXO.horario[0] || h > OXXO.horario[1]) return r;
  const l = await all(env, `SELECT o.* FROM orders o WHERE o.estado = 'pending' AND o.metodo_pago = 'oxxo' AND o.provider_payment_id IS NOT NULL
      AND COALESCE(o.seguimientos, 0) = 0 AND o.recordatorio_at IS NULL AND o.created_at <= ? AND o.created_at >= ?
      AND NOT EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = o.email AND o2.estado = 'paid' AND o2.created_at > o.created_at)
    ORDER BY o.created_at LIMIT ?`, new Date(ahora - OXXO.espera).toISOString(), new Date(ahora - OXXO.hasta).toISOString(), OXXO.lote);
  r.revisadas = l.length;
  for (const o of l) {
    try {
      const pi = await llamar(env, 'GET', `/payment_intents/${encodeURIComponent(o.provider_payment_id)}`);
      const ficha = pi?.next_action?.oxxo_display_details;
      if (pi?.status !== 'requires_action' || !ficha?.hosted_voucher_url || (ficha.expires_after && ficha.expires_after * 1000 <= ahora)) { r.omitidas++; continue; }
      const marca = new Date(ahora).toISOString();
      const u = await run(env, "UPDATE orders SET recordatorio_at = ?, seguimientos = 1, updated_at = ? WHERE id = ? AND estado = 'pending' AND recordatorio_at IS NULL", marca, ahoraISO(), o.id);
      if (!u.meta.changes) { r.omitidas++; continue; }
      const items = await all(env, 'SELECT nombre FROM order_items WHERE order_id = ?', o.id);
      try {
        await enviar(env, { para: o.email, ...correoFichaOxxo(o, items, ficha), idempotencia: `oxxo-ficha-${o.id}` });
        r.enviados++;
      } catch (e) {
        await run(env, 'UPDATE orders SET recordatorio_at = NULL, seguimientos = 0 WHERE id = ? AND recordatorio_at = ?', o.id, marca);
        throw e;
      }
    } catch (e) { r.omitidas++; console.error('oxxo: recordatorio', o.id, correoOculto(o.email), e?.message); }
  }
  return r;
}
