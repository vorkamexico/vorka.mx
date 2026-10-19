// POST /api/webhooks/<proveedor> · confirma pagos y dispara la entrega.
// 401 si la firma no es válida (no se guarda ni cambia nada) · 200 si se procesó o no nos importa ·
// 500 si algo falló: el evento queda con su error y la pasarela reintenta.
import { json, fail } from './util.js';
import { proveedor } from './pagos/index.js';
import { aplicarPago, registrarEvento, marcarEvento, registrarAnalitica, itemsDeOrden } from './modelo.js';
import { entregar } from './entrega.js';
import { programarTransferencias, anularTransferencias } from './marketplace.js';
import { puntosAlPagar, puntosAlReembolsar } from './puntos.js';

export async function webhook(req, env, nombre) {
  let pasarela;
  try { pasarela = proveedor(nombre); } catch { return fail('No encontrado', 404); }

  const evento = await pasarela.leerWebhook(req, env);
  if (!evento) return fail('Firma inválida', 401);

  if (!(await registrarEvento(env, pasarela.nombre, evento.id, evento.tipo, evento.payload)))
    return json({ ok: true, repetido: true });

  try {
    const pago = await pasarela.interpretar(evento, env);
    if (pago) {
      const r = await aplicarPago(env, pago.orderId, pago);
      if (r.motivo === 'monto_no_coincide') console.error('webhook: monto no coincide', pago.orderId, pago.monto_centavos, pago.moneda);
      if (r.accion === 'entregar')
        for (const it of await itemsDeOrden(env, pago.orderId))
          await registrarAnalitica(env, 'purchase', { product_id: it.product_id, order_id: pago.orderId, ref_code: r.orden.ref_code });
      // También en reintentos: si el correo falló la vez pasada, la orden ya está paid pero sin correo
      if (r.orden?.estado === 'paid') await entregar(env, pago.orderId);
      // Reparto a creadores (si hay productos de creadores). Idempotente.
      if (r.orden?.estado === 'paid' && pago.stripe_fee_centavos != null) await programarTransferencias(env, pago.orderId, { fee: pago.stripe_fee_centavos });
      if (r.accion === 'revocar') await anularTransferencias(env, pago.orderId);
      // Puntos Vorka: suma al que compartió la liga y descuenta los usados; en reembolso, se revierten. Idempotente.
      if (r.orden?.estado === 'paid') await puntosAlPagar(env, pago.orderId);
      if (r.accion === 'revocar') await puntosAlReembolsar(env, pago.orderId);
    }
    await marcarEvento(env, pasarela.nombre, evento.id);
    return json({ ok: true });
  } catch (e) {
    console.error('webhook', pasarela.nombre, evento.id, evento.tipo, e.message);
    await marcarEvento(env, pasarela.nombre, evento.id, String(e.message).slice(0, 500));
    return fail('Error al procesar', 500);
  }
}
