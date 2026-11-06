// El dinero real de la tienda para el panel de Vorka OS (solo por RPC, sin ruta pública):
// · netoDelMes: lo cobrado (bruto) y lo que de verdad le queda a Vorka después de lo que sale en dinero.
// · ultimasPagadas: las compras por la fecha en que llegó el dinero (OXXO y SPEI se pagan después de crear la orden).
// · dineroStripe: lo que Stripe ya depositó al banco y lo que aún tiene (disponible y por liberar), ya sin su comisión.
// · completarComisionesStripe: guarda la comisión real de Stripe en las órdenes que aún no la tienen (cron de cada hora).
import { all, one, run } from './util.js';
import { llamar } from './pagos/stripe.js';
import { comisionDeCargo, comisionDePago } from './pagos/connect.js';

const PAGADA = "o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia')";
// Movimientos de Puntos que dan (o quitan, si son negativos) puntos por ventas: los del vendedor, los de su red,
// el bono de arranque y los bonos. Los canjes, ajustes y transferencias no son "generados".
const GENERADOS = "('ganado', 'revertido', 'red', 'arranque', 'bono')";

/**
 * Bruto y neto de las compras pagadas entre desde y hasta (ISO UTC, por fecha de pago). mes = AAAA-MM para las
 * transferencias de Puntos (se guardan por día, sin hora). Todo en centavos.
 *
 * neto = bruto − comisión de Stripe − comisión de afiliados (en dinero) − parte de creadores − Puntos transferidos.
 * Los Puntos usados como descuento NO se restan: el cliente ya pagó menos (el bruto ya viene sin ese descuento).
 * Los Puntos generados en el mes tampoco: son un compromiso que se cobra después, como descuento en otra compra
 * (baja ese bruto) o como transferencia (se resta el mes en que se paga).
 */
export async function netoDelMes(env, { desde, hasta, mes }) {
  const sig = (() => { const [a, m] = mes.split('-').map(Number), d = new Date(Date.UTC(a, m, 1)); return d.toISOString().slice(0, 7); })();
  const [base, afi, cre, est, ret, gen] = await Promise.all([
    one(env, `SELECT COUNT(*) n, COALESCE(SUM(o.monto_centavos), 0) bruto, COALESCE(SUM(o.stripe_fee_centavos), 0) fee,
        COALESCE(SUM(o.monto_centavos > 0 AND o.stripe_fee_centavos IS NULL), 0) sin_fee, COALESCE(SUM(o.puntos_usados), 0) puntos_usados
      FROM orders o WHERE ${PAGADA} AND o.paid_at >= ? AND o.paid_at < ?`, desde, hasta),
    one(env, `SELECT COALESCE(SUM(ROUND(o.monto_centavos * COALESCE(o.comision_pct, a.comision_pct) / 100.0)), 0) c, COUNT(*) n
      FROM orders o JOIN affiliates a ON a.code = o.ref_code AND a.tipo = 'dinero' WHERE ${PAGADA} AND o.paid_at >= ? AND o.paid_at < ?`, desde, hasta),
    // Creadores: lo que se les transfiere (ya trae descontada su parte de la comisión de Stripe)
    one(env, `SELECT COALESCE(SUM(t.monto_centavos), 0) c, COUNT(*) n FROM transferencias t JOIN orders o ON o.id = t.order_id
      WHERE ${PAGADA} AND o.paid_at >= ? AND o.paid_at < ? AND t.estado NOT IN ('cancelada', 'revertida')`, desde, hasta),
    // …y lo de creadores que aún no se programa (falta la comisión de Stripe): se estima con su % sin restar Stripe
    one(env, `SELECT COALESCE(SUM(ROUND(i.precio_centavos * i.cantidad * (100 - COALESCE(i.comision_pct, 0)) / 100.0)), 0) c
      FROM order_items i JOIN orders o ON o.id = i.order_id WHERE ${PAGADA} AND o.paid_at >= ? AND o.paid_at < ? AND i.creador_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.order_id = o.id)`, desde, hasta),
    one(env, `SELECT COUNT(*) n, COALESCE(SUM(puntos), 0) puntos FROM puntos_retiros WHERE estado = 'pagado' AND pagado_el >= ? AND pagado_el < ?`, `${mes}-01`, `${sig}-01`),
    one(env, `SELECT COALESCE(SUM(puntos), 0) puntos FROM puntos_movimientos WHERE tipo IN ${GENERADOS} AND created_at >= ? AND created_at < ?`, desde, hasta),
  ]);
  const creadores = cre.c + est.c, puntosPagados = ret.puntos * 100;
  return {
    bruto_centavos: base.bruto, compras: base.n,
    stripe_centavos: base.fee, stripe_sin_calcular: base.sin_fee,
    afiliados_centavos: afi.c, afiliados_ventas: afi.n,
    creadores_centavos: creadores, creadores_estimado_centavos: est.c,
    puntos_transferidos_centavos: puntosPagados, puntos_transferencias: ret.n,
    neto_centavos: base.bruto - base.fee - afi.c - creadores - puntosPagados,
    // Solo informativos (no se restan): 1 punto = $1
    puntos_descuento_centavos: base.puntos_usados * 100,
    puntos_generados_centavos: gen.puntos * 100,
  };
}

// Las últimas compras pagadas, por la fecha en que llegó el dinero, con su método y la comisión de Stripe
export async function ultimasPagadas(env, { n = 8 } = {}) {
  const lim = Math.max(1, Math.min(50, Number(n) || 8));
  return all(env, `SELECT o.id, o.nombre, o.email, o.monto_centavos, o.moneda, o.metodo_pago, o.created_at, o.paid_at, o.stripe_fee_centavos, o.ref_code,
      o.puntos_usados, (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = o.id) productos,
      -- Suscripción (mensual o anual): en Stripe no trae método en la orden, el panel la marca aparte
      EXISTS (SELECT 1 FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = o.id
        AND (i.intervalo IS NOT NULL OR json_extract(p.contenido, '$.suscripcion.intervalo') IS NOT NULL)) suscripcion
    FROM orders o WHERE ${PAGADA} AND o.paid_at IS NOT NULL ORDER BY o.paid_at DESC LIMIT ?`, lim);
}

// Lo que Stripe tiene y lo que ya depositó. Es el saldo de TODA la cuenta de Stripe de Vorka (tienda y las demás apps
// que cobran con ella), no solo de la tienda. Los saldos de Stripe ya vienen sin su comisión.
export async function dineroStripe(env, { ahora = Date.now() } = {}) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const [bal, pagos] = await Promise.all([llamar(env, 'GET', '/balance'), llamar(env, 'GET', '/payouts?limit=30')]);
  const mxn = xs => (xs || []).filter(x => x.currency === 'mxn').reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const mesMx = s => new Date(s * 1000 - 6 * 3600e3).toISOString().slice(0, 7), esteMes = new Date(ahora - 6 * 3600e3).toISOString().slice(0, 7);
  const lista = (pagos?.data || []).filter(p => p.currency === 'mxn');
  const camino = lista.filter(p => p.status === 'pending' || p.status === 'in_transit');
  const pagadosMes = lista.filter(p => p.status === 'paid' && mesMx(p.arrival_date) === esteMes);
  return {
    prueba: bal?.livemode === false,
    disponible_centavos: mxn(bal?.available),        // ya liberado: sale en el próximo depósito
    por_liberar_centavos: mxn(bal?.pending),         // cobrado pero Stripe aún no lo libera (tarjeta unos días; OXXO al confirmarse)
    en_camino_centavos: camino.reduce((s, p) => s + p.amount, 0),
    depositado_mes_centavos: pagadosMes.reduce((s, p) => s + p.amount, 0), depositos_mes: pagadosMes.length,
    depositos: lista.slice(0, 6).map(p => ({ id: p.id, monto_centavos: p.amount, llega: new Date(p.arrival_date * 1000).toISOString(), estado: p.status })),
  };
}

// Órdenes pagadas por Stripe sin comisión guardada (las de antes de este cambio, o si el cargo aún no se liquidaba):
// se la pregunta a Stripe, pocas por corrida. Idempotente.
export async function completarComisionesStripe(env, { max = 25 } = {}) {
  if (!env.STRIPE_SECRET_KEY) return { revisadas: 0, guardadas: 0 };
  const xs = await all(env, `SELECT id, provider_charge_id, provider_payment_id FROM orders
    WHERE estado IN ('paid', 'refunded') AND proveedor = 'stripe' AND monto_centavos > 0 AND stripe_fee_centavos IS NULL
      AND (provider_charge_id IS NOT NULL OR provider_payment_id LIKE 'pi\\_%' ESCAPE '\\') ORDER BY paid_at DESC LIMIT ?`, max);
  let guardadas = 0;
  for (const o of xs) {
    try {
      const fee = o.provider_charge_id ? await comisionDeCargo(env, o.provider_charge_id) : (await comisionDePago(env, o.provider_payment_id)).fee;
      if (fee == null) continue;
      await run(env, 'UPDATE orders SET stripe_fee_centavos = ? WHERE id = ? AND stripe_fee_centavos IS NULL', fee, o.id);
      guardadas++;
    } catch (e) { console.error('comision stripe', o.id, e?.message); }
  }
  return { revisadas: xs.length, guardadas };
}
