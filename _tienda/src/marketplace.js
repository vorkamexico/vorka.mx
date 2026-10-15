// Reparto a creadores: se programa al pagarse la orden y se envía pasado el plazo de reembolso.
//   creador recibe = venta − (venta × % de Vorka) − parte proporcional de la comisión real de Stripe
import { all, one, run, ahoraISO, correoOculto } from './util.js';
import { transferir, revertir, leerCuenta, cuentaLista } from './pagos/connect.js';
import { ventaNueva } from './correos-creadores.js';

export const DIAS_PARA_TRANSFERIR = 7; // cubre los 5 días hábiles de la política de reembolsos
const MAX_INTENTOS = 6;

export const nuevoId = p => `${p}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

/**
 * Calcula el reparto de una orden por creador. Puro (sin D1) para poder probarlo.
 * items: [{ creador_id, comision_pct, precio_centavos, cantidad }] · total: monto de la orden · fee: comisión real de Stripe
 */
export function calcularReparto(items, total, fee) {
  const porCreador = new Map();
  for (const it of items) {
    if (!it.creador_id) continue;
    const venta = it.precio_centavos * (it.cantidad || 1);
    const x = porCreador.get(it.creador_id) || { creador_id: it.creador_id, venta_centavos: 0, comision_vorka_centavos: 0 };
    x.venta_centavos += venta;
    x.comision_vorka_centavos += Math.round(venta * (Number(it.comision_pct) || 0) / 100);
    porCreador.set(it.creador_id, x);
  }
  return [...porCreador.values()].map(x => {
    const stripe = total > 0 ? Math.round(fee * x.venta_centavos / total) : 0;
    return { ...x, comision_stripe_centavos: stripe, monto_centavos: Math.max(0, x.venta_centavos - x.comision_vorka_centavos - stripe) };
  });
}

// Idempotente: si llega el mismo pago dos veces, no se duplica (UNIQUE order_id + creador_id)
export async function programarTransferencias(env, orderId, { fee, ahora = Date.now() }) {
  const orden = await one(env, 'SELECT * FROM orders WHERE id = ?', orderId);
  if (!orden || orden.estado !== 'paid' || fee == null) return 0;
  const items = await all(env, 'SELECT nombre, creador_id, comision_pct, precio_centavos, cantidad FROM order_items WHERE order_id = ?', orderId);
  const reparto = calcularReparto(items, orden.monto_centavos, fee);
  const disponible = new Date(ahora + DIAS_PARA_TRANSFERIR * 864e5).toISOString();
  let n = 0;
  for (const r of reparto) {
    const x = await run(env, `INSERT OR IGNORE INTO transferencias (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, moneda, disponible_en)
      VALUES (?,?,?,?,?,?,?,?,?)`, nuevoId('trf'), orderId, r.creador_id, r.venta_centavos, r.comision_vorka_centavos, r.comision_stripe_centavos, r.monto_centavos, orden.moneda, disponible);
    n += x.meta.changes;
    // Aviso al creador solo la primera vez (si el correo falla, la venta no se ve afectada)
    if (x.meta.changes) {
      const c = await one(env, 'SELECT * FROM creadores WHERE id = ?', r.creador_id);
      const productos = items.filter(i => i.creador_id === r.creador_id).map(i => i.nombre).join(' + ');
      if (c) await ventaNueva(env, c, r, productos).catch(e => console.error('aviso venta', r.creador_id, e.message));
    }
  }
  return n;
}

// Reembolso o contracargo: lo programado se cancela; lo ya enviado se revierte desde la cuenta del creador
export async function anularTransferencias(env, orderId) {
  await run(env, "UPDATE transferencias SET estado = 'cancelada' WHERE order_id = ? AND estado IN ('programada','error')", orderId);
  const enviadas = await all(env, "SELECT * FROM transferencias WHERE order_id = ? AND estado = 'enviada'", orderId);
  for (const t of enviadas) {
    await revertir(env, t.stripe_transfer_id, orderId);
    await run(env, "UPDATE transferencias SET estado = 'revertida' WHERE id = ?", t.id);
  }
  return enviadas.length;
}

// Revisa con Stripe si la cuenta del creador ya puede recibir dinero y lo guarda
export async function refrescarCreador(env, creador) {
  if (!creador.stripe_account_id) return false;
  const listo = cuentaLista(await leerCuenta(env, creador.stripe_account_id));
  await run(env, 'UPDATE creadores SET stripe_listo = ?, stripe_revisado_at = ? WHERE id = ?', listo ? 1 : 0, ahoraISO(), creador.id);
  return listo;
}

/**
 * Cron: envía las transferencias que ya pasaron su plazo. Si la cuenta del creador aún no está lista,
 * se queda programada y se reintenta en la siguiente vuelta. Devuelve un resumen.
 */
export async function procesarTransferencias(env, ahora = new Date().toISOString()) {
  const pendientes = await all(env, `SELECT t.*, c.stripe_account_id, c.stripe_listo, c.estado creador_estado, c.email, o.provider_charge_id, o.estado orden_estado
    FROM transferencias t JOIN creadores c ON c.id = t.creador_id JOIN orders o ON o.id = t.order_id
    WHERE t.estado = 'programada' AND t.disponible_en <= ? ORDER BY t.disponible_en LIMIT 50`, ahora);
  const r = { enviadas: 0, esperando: 0, errores: 0 };
  for (const t of pendientes) {
    if (t.orden_estado !== 'paid') { await run(env, "UPDATE transferencias SET estado = 'cancelada' WHERE id = ?", t.id); continue; }
    if (t.monto_centavos <= 0) { await run(env, "UPDATE transferencias SET estado = 'enviada', enviada_at = ? WHERE id = ?", ahoraISO(), t.id); continue; }
    try {
      const listo = t.stripe_listo || await refrescarCreador(env, { id: t.creador_id, stripe_account_id: t.stripe_account_id });
      if (!listo || !t.stripe_account_id || t.creador_estado === 'suspendido') { r.esperando++; continue; }
      const tr = await transferir(env, t, t.stripe_account_id, t.provider_charge_id);
      await run(env, "UPDATE transferencias SET estado = 'enviada', stripe_transfer_id = ?, enviada_at = ?, error = NULL WHERE id = ?", tr.id, ahoraISO(), t.id);
      r.enviadas++;
    } catch (e) {
      const intentos = t.intentos + 1;
      await run(env, 'UPDATE transferencias SET intentos = ?, error = ?, estado = ? WHERE id = ?',
        intentos, String(e.message).slice(0, 300), intentos >= MAX_INTENTOS ? 'error' : 'programada', t.id);
      console.error('transferencia', t.id, correoOculto(t.email), e.message);
      r.errores++;
    }
  }
  return r;
}
