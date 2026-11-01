// Reparto a creadores: se programa al pagarse la orden y se envía pasado el plazo de reembolso.
//   creador recibe = venta − (venta × % de Vorka) − parte proporcional de la comisión real de Stripe
// Suscripciones de creadores (SaaS / apps, migración 0060): una transferencia por CADA factura pagada (primer cobro y
// renovaciones), con el % de Vorka nunca menor a PISO_SUSCRIPCION (ver repartoFactura y programarFactura).
import { all, one, run, ahoraISO, correoOculto } from './util.js';
import { transferir, revertir, leerCuenta, cuentaLista, comisionDeCargo, comisionDePago } from './pagos/connect.js';
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

// Idempotente: si llega el mismo pago dos veces, no se duplica (índice único order_id + creador_id en pagos únicos)
export async function programarTransferencias(env, orderId, { fee, ahora = Date.now() }) {
  const orden = await one(env, 'SELECT * FROM orders WHERE id = ?', orderId);
  if (!orden || orden.estado !== 'paid' || fee == null) return 0;
  // Los productos de creadores por suscripción no se reparten por orden sino por factura (programarFactura)
  const items = (await all(env, `SELECT i.nombre, i.creador_id, i.comision_pct, i.precio_centavos, i.cantidad, p.contenido FROM order_items i
    LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?`, orderId)).filter(i => !esSuscripcion(i.contenido));
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

/**
 * Cron: ventas pagadas con productos de creadores que aún no tienen reparto porque Stripe no había
 * calculado su comisión cuando llegó el webhook. Se consulta el cargo y se programa (plazo desde el pago).
 */
export async function repartosPendientes(env) {
  const ordenes = await all(env, `SELECT o.id, o.provider_charge_id, o.paid_at FROM orders o
    WHERE o.estado = 'paid' AND o.provider_charge_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.creador_id IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.order_id = o.id)
    ORDER BY o.paid_at LIMIT 25`);
  let n = 0;
  for (const o of ordenes) {
    try {
      const fee = await comisionDeCargo(env, o.provider_charge_id);
      if (fee != null) n += await programarTransferencias(env, o.id, { fee, ahora: Date.parse(o.paid_at) || Date.now() });
    } catch (e) { console.error('reparto pendiente', o.id, e.message); }
  }
  return n;
}

// Reembolso o contracargo: lo programado se cancela; lo ya enviado se revierte desde la cuenta del creador
// (solo las de pagos únicos: las de suscripciones se anulan por el cobro de su factura, con anularPorPago)
export async function anularTransferencias(env, orderId) {
  await run(env, "UPDATE transferencias SET estado = 'cancelada' WHERE order_id = ? AND factura_id IS NULL AND estado IN ('programada','error')", orderId);
  const enviadas = await all(env, "SELECT * FROM transferencias WHERE order_id = ? AND factura_id IS NULL AND estado = 'enviada'", orderId);
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
    FROM transferencias t JOIN creadores c ON c.id = t.creador_id LEFT JOIN orders o ON o.id = t.order_id
    WHERE t.estado = 'programada' AND t.disponible_en <= ? ORDER BY t.disponible_en LIMIT 50`, ahora);
  const r = { enviadas: 0, esperando: 0, errores: 0 };
  for (const t of pendientes) {
    // Pago único: si la orden ya no está pagada no se transfiere. Factura de suscripción: su reembolso o disputa ya la anuló.
    if (!t.factura_id && t.orden_estado !== 'paid') { await run(env, "UPDATE transferencias SET estado = 'cancelada' WHERE id = ?", t.id); continue; }
    if (t.monto_centavos <= 0) { await run(env, "UPDATE transferencias SET estado = 'enviada', enviada_at = ? WHERE id = ?", ahoraISO(), t.id); continue; }
    try {
      const listo = t.stripe_listo || await refrescarCreador(env, { id: t.creador_id, stripe_account_id: t.stripe_account_id });
      if (!listo || !t.stripe_account_id || t.creador_estado === 'suspendido') { r.esperando++; continue; }
      const tr = await transferir(env, t, t.stripe_account_id, t.factura_id ? t.cargo_id : t.provider_charge_id);
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

// ---------- suscripciones de creadores (SaaS / apps) ----------

// Vorka se queda SIEMPRE con al menos este % de cada cobro de una suscripción de creador (primer pago y cada renovación).
// Aunque en Vorka OS se le ponga a un creador un % menor (vale para sus descargables), en suscripciones manda el piso.
// La base de datos lo respalda: transferencias tiene un CHECK que rechaza una factura con menos (migración 0060).
export const PISO_SUSCRIPCION = 20;
export const comisionSuscripcion = pct => { const n = Number(pct); return Math.max(PISO_SUSCRIPCION, Number.isFinite(n) ? n : 0); };
// Días entre el cobro y la transferencia: 7 en mensuales (como los descargables) y 11 en anuales, que cubren los 10 días
// naturales para pedir el reembolso del primer cobro de un plan anual
export const DIAS_SUSCRIPCION = { month: DIAS_PARA_TRANSFERIR, year: 11 };

const esSuscripcion = contenido => { try { return !!JSON.parse(contenido || '{}').suscripcion; } catch { return false; } };

/**
 * Reparto de UNA factura de suscripción. Puro (sin D1) para poder probarlo.
 *   venta: lo cobrado por el plan en ese periodo · pct: comision_pct del creador · fee: comisión real de Stripe (null = aún no se sabe)
 * La comisión de Vorka se redondea hacia arriba: nunca queda ni un centavo por debajo del piso.
 */
export function repartoFactura(venta, pct, fee) {
  const comision_pct = comisionSuscripcion(pct);
  const vorka = Math.ceil(venta * comision_pct / 100);
  const stripe = fee == null ? 0 : Math.max(0, Math.round(fee));
  return { comision_pct, venta_centavos: venta, comision_vorka_centavos: vorka, comision_stripe_centavos: stripe, monto_centavos: Math.max(0, venta - vorka - stripe) };
}

/**
 * Factura pagada (invoice.paid) de una suscripción de creador → una transferencia programada. Idempotente por factura
 * (índice único factura_id + creador_id): Stripe repite webhooks y el mismo cobro nunca se paga dos veces.
 * sus: renglón de suscripciones (guardarSuscripcion) · cobro: { pago_id, cargo_id, fee } (connect.js › cobroDeFactura)
 * La venta es el subtotal de la factura (el precio del plan en ese periodo): si Stripe aplicó saldo a favor que dio Vorka
 * (p. ej. el mes gratis de Cuentas, que vive en el mismo cliente de Stripe), lo absorbe Vorka y no el creador.
 * Devuelve el renglón insertado, o null si ya existía (o no aplica).
 */
export async function programarFactura(env, { factura, sus, cobro = {}, ahora = Date.now() }) {
  if (!factura?.id || factura.status !== 'paid' || !sus?.creador_id) return null;
  const venta = Number.isInteger(factura.subtotal) ? factura.subtotal : factura.amount_paid;
  if (!(venta > 0)) return null;
  const c = await one(env, 'SELECT id, comision_pct FROM creadores WHERE id = ?', sus.creador_id);
  if (!c) return null;
  const r = repartoFactura(venta, c.comision_pct, cobro.fee);
  const pagada = factura.status_transitions?.paid_at ? factura.status_transitions.paid_at * 1000 : ahora;
  const disponible = new Date(pagada + (DIAS_SUSCRIPCION[sus.intervalo] || DIAS_PARA_TRANSFERIR) * 864e5).toISOString();
  const orden = sus.order_id ? await one(env, 'SELECT id FROM orders WHERE id = ?', sus.order_id) : null;
  const fila = { id: nuevoId('trf'), order_id: orden?.id || null, creador_id: c.id, ...r, moneda: String(factura.currency || 'mxn').toUpperCase(),
    estado: cobro.fee == null ? 'por_calcular' : 'programada', disponible_en: disponible,
    suscripcion_id: sus.id, factura_id: factura.id, pago_id: cobro.pago_id || null, cargo_id: cobro.cargo_id || null };
  const x = await run(env, `INSERT OR IGNORE INTO transferencias (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos,
      moneda, estado, disponible_en, suscripcion_id, factura_id, pago_id, cargo_id, comision_pct) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    fila.id, fila.order_id, fila.creador_id, fila.venta_centavos, fila.comision_vorka_centavos, fila.comision_stripe_centavos, fila.monto_centavos,
    fila.moneda, fila.estado, fila.disponible_en, fila.suscripcion_id, fila.factura_id, fila.pago_id, fila.cargo_id, fila.comision_pct);
  return x.meta.changes ? fila : null;
}

// Cron: facturas pagadas cuya comisión de Stripe no se conocía al llegar el webhook. Se consulta y pasan a programadas.
export async function facturasPorCalcular(env) {
  const filas = await all(env, "SELECT * FROM transferencias WHERE estado = 'por_calcular' ORDER BY created_at LIMIT 25");
  let n = 0;
  for (const t of filas) {
    try {
      const fee = t.cargo_id ? await comisionDeCargo(env, t.cargo_id) : t.pago_id ? (await comisionDePago(env, t.pago_id)).fee : null;
      if (fee == null) continue;
      const r = repartoFactura(t.venta_centavos, t.comision_pct, fee);
      n += (await run(env, "UPDATE transferencias SET comision_vorka_centavos = ?, comision_stripe_centavos = ?, monto_centavos = ?, comision_pct = ?, estado = 'programada' WHERE id = ? AND estado = 'por_calcular'",
        r.comision_vorka_centavos, r.comision_stripe_centavos, r.monto_centavos, r.comision_pct, t.id)).meta.changes;
    } catch (e) { console.error('factura por calcular', t.id, e.message); }
  }
  return n;
}

/**
 * Reembolso o disputa del cobro de una factura de suscripción (pagoId = PaymentIntent de la factura):
 *   · completo o disputa: lo que no ha salido se cancela; lo ya transferido se revierte desde la cuenta del creador
 *     (misma política que los descargables: si el creador ya no tiene saldo, se descuenta de sus siguientes ventas).
 *   · parcial: no se calcula solo (igual que en los pagos únicos, se decide a mano): lo que no ha salido queda en 'error'
 *     con la nota, para que no se pague completo; lo ya enviado se marca para revisar.
 * Devuelve cuántas transferencias se revirtieron en Stripe.
 */
export async function anularPorPago(env, pagoId, { parcial = false } = {}) {
  if (!pagoId) return 0;
  if (parcial) {
    await run(env, "UPDATE transferencias SET estado = 'error', error = ? WHERE pago_id = ? AND estado IN ('por_calcular','programada')", 'Reembolso parcial del cobro: decide a mano cuánto transferir.', pagoId);
    await run(env, "UPDATE transferencias SET error = ? WHERE pago_id = ? AND estado = 'enviada'", 'Reembolso parcial después de transferir: revisar si se revierte una parte.', pagoId);
    return 0;
  }
  await run(env, "UPDATE transferencias SET estado = 'cancelada' WHERE pago_id = ? AND estado IN ('por_calcular','programada','error')", pagoId);
  const enviadas = await all(env, "SELECT * FROM transferencias WHERE pago_id = ? AND estado = 'enviada'", pagoId);
  for (const t of enviadas) {
    await revertir(env, t.stripe_transfer_id, t.factura_id || t.order_id);
    await run(env, "UPDATE transferencias SET estado = 'revertida' WHERE id = ?", t.id);
  }
  return enviadas.length;
}
