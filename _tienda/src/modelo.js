// Acceso a datos de la tienda (D1). Los precios SIEMPRE salen de aquí, nunca del navegador.
import { all, one, run, ahoraISO } from './util.js';
import { transicion } from './estados.js';
import { SQL_APARTADOS, SQL_MOVIMIENTOS, descuentoMaximo, COBRO_MINIMO } from './puntos.js';
import { REFERIDO, centavosDescuento } from './descuentos.js';

const producto = r => r && { ...r, activo: !!r.activo, r2_keys: JSON.parse(r.r2_keys || '[]'), contenido: JSON.parse(r.contenido || '{}') };

// Se vende si está activo y aprobado, y —si es de un creador— el creador está aprobado y su cuenta de Stripe lista para recibir
export const VENDIBLE = `p.activo = 1 AND p.revision = 'aprobado'
  AND (p.creador_id IS NULL OR EXISTS (SELECT 1 FROM creadores c WHERE c.id = p.creador_id AND c.estado = 'aprobado' AND c.stripe_listo = 1))`;

// Catálogo público: los productos con contenido.oculto (p. ej. simulacros adicionales) se venden, pero no se listan
export const listarProductos = async env =>
  (await all(env, `SELECT p.*, c.nombre creador_nombre FROM products p LEFT JOIN creadores c ON c.id = p.creador_id WHERE ${VENDIBLE} ORDER BY p.orden, p.nombre`)).map(producto)
    .filter(p => !p.contenido.oculto);

export const productoPorSlug = async (env, slug, { inactivos = false } = {}) =>
  producto(await one(env, `SELECT p.*, c.nombre creador_nombre, c.comision_pct creador_comision_pct FROM products p LEFT JOIN creadores c ON c.id = p.creador_id
    WHERE p.slug = ?${inactivos ? '' : ` AND ${VENDIBLE}`}`, slug));

// Enlace viejo de un producto al que le cambiaron el slug
export async function productoPorSlugAnterior(env, slug, op) {
  const r = await one(env, 'SELECT p.slug FROM slugs_anteriores s JOIN products p ON p.id = s.product_id WHERE s.slug = ?', slug);
  return r ? productoPorSlug(env, r.slug, op) : null;
}

// El código solo cuenta si existe y está activo
export async function afiliadoActivo(env, code) {
  if (!code) return null;
  return one(env, 'SELECT code, comision_pct FROM affiliates WHERE code = ? AND activo = 1', String(code).trim().toUpperCase());
}

/**
 * Crea la orden en estado pending con sus renglones.
 * items: [{ slug, cantidad? }] — el precio se toma de la base de datos.
 * ref: código de quien recomendó (liga de Puntos Vorka); da puntos a esa cuenta al pagarse, no descuento.
 * puntos: { email, disponibles } — el descuento con puntos se calcula aquí.
 * descuento: { codigo, pct, meses, app, duracion } de resolverDescuento (descuentos.js) — código de descuento o 5 % por
 *   recomendación. Se calcula sobre los productos de Vorka (no los de creadores), antes de los puntos. duracion: solo en
 *   suscripciones (cupón de Stripe por %); en pagos únicos va junto con los puntos en un cupón por monto.
 * Lanza Error('producto') si algún slug no existe o está inactivo, y Error('puntos') si al apartar los puntos ya no alcanzan.
 */
export async function crearOrden(env, { items, email, nombre, ref, proveedor = 'stripe', regalo = null, puntos = null, descuento = null }) {
  const lineas = [];
  for (const it of items) {
    const p = (await productoPorSlug(env, it.slug)) || (await productoPorSlugAnterior(env, it.slug));
    if (!p) throw new Error('producto');
    lineas.push({ p, cantidad: it.cantidad || 1 });
  }
  const monedas = new Set(lineas.map(l => l.p.moneda));
  if (monedas.size !== 1) throw new Error('moneda');
  const afiliado = await afiliadoActivo(env, ref);
  email = email.trim().toLowerCase();
  const subtotal = lineas.reduce((s, l) => s + l.p.precio_centavos * l.cantidad, 0);
  // Código de descuento o 5 % por recomendación: % de lo de Vorka (los productos de creadores no llevan descuento),
  // dejando siempre el cobro mínimo de la pasarela
  const propio = lineas.filter(l => !l.p.creador_id).reduce((s, l) => s + l.p.precio_centavos * l.cantidad, 0);
  const descCodigo = centavosDescuento(propio, subtotal, descuento?.pct || 0, COBRO_MINIMO);
  const conCodigo = descCodigo > 0 ? descuento : null;
  // Descuento con puntos (sobre lo que queda); siempre queda el cobro mínimo. Puntos enteros (1 punto = $1): nunca se regalan centavos
  const descPuntos = puntos ? Math.floor(descuentoMaximo(puntos.disponibles, subtotal - descCodigo) / 100) * 100 : 0;
  const puntosUsados = descPuntos / 100;
  const orden = {
    id: crypto.randomUUID(),
    email,
    nombre: nombre.trim(),
    subtotal_centavos: subtotal,
    descuento_centavos: descCodigo + descPuntos,
    descuento_codigo: conCodigo?.codigo || null,
    descuento_pct: conCodigo?.pct ?? null,
    descuento_duracion: conCodigo?.duracion || null,
    descuento_meses: conCodigo?.meses ?? null,
    descuento_codigo_centavos: descCodigo,
    descuento_app: conCodigo && conCodigo.codigo !== REFERIDO ? conCodigo.app || null : null,
    puntos_usados: puntosUsados,
    puntos_email: puntosUsados > 0 ? puntos.email : null,
    moneda: [...monedas][0],
    estado: 'pending',
    proveedor,
    ref_code: afiliado?.code || null,
    comision_pct: afiliado?.comision_pct ?? null,
  };
  orden.monto_centavos = orden.subtotal_centavos - orden.descuento_centavos;   // lo que se cobra (neto de descuentos)
  // Apartado atómico de puntos: la orden solo se inserta si, en ese mismo instante, movimientos − apartados alcanzan.
  // Dos compras simultáneas con el mismo saldo no pueden apartar los mismos puntos (la segunda no se inserta).
  const [ins] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, proveedor, ref_code, comision_pct, regalo, regalo_para, regalo_mensaje, descuento_centavos, puntos_email, puntos_usados,
        descuento_codigo, descuento_pct, descuento_duracion, descuento_meses, descuento_codigo_centavos, descuento_app)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE ? = 0 OR ((${SQL_MOVIMIENTOS}) - (${SQL_APARTADOS})) >= ?`)
      .bind(orden.id, orden.email, orden.nombre, orden.monto_centavos, orden.moneda, orden.proveedor, orden.ref_code, orden.comision_pct,
        regalo ? 1 : 0, regalo?.para || null, regalo?.mensaje || null, orden.descuento_centavos, orden.puntos_email, orden.puntos_usados,
        orden.descuento_codigo, orden.descuento_pct, orden.descuento_duracion, orden.descuento_meses, orden.descuento_codigo_centavos, orden.descuento_app,
        puntosUsados, orden.puntos_email, orden.puntos_email, puntosUsados),
    // Si es de un creador, se copia a quién le toca y su % de ese momento
    ...lineas.map(l => env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad, creador_id, comision_pct) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)')
      .bind(orden.id, l.p.id, l.p.nombre, l.p.precio_centavos, l.cantidad, l.p.creador_id || null, l.p.creador_id ? l.p.creador_comision_pct : null, orden.id)),
  ]);
  if (!ins.meta.changes) throw new Error('puntos');
  return { ...orden, items: lineas.map(l => ({ product_id: l.p.id, slug: l.p.slug, nombre: l.p.nombre, precio_centavos: l.p.precio_centavos, cantidad: l.cantidad, imagen: l.p.imagen })) };
}

export const ordenPorId = (env, id) => one(env, 'SELECT * FROM orders WHERE id = ?', id);
export const itemsDeOrden = (env, id) =>
  all(env, 'SELECT i.*, p.slug, p.r2_keys FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', id);

export const guardarSesion = (env, id, sessionId) =>
  run(env, 'UPDATE orders SET provider_session_id = ?, updated_at = ? WHERE id = ?', sessionId, ahoraISO(), id);

/**
 * Aplica el resultado normalizado de un pago a la orden.
 * Idempotente y a prueba de carreras: el UPDATE solo pasa si el estado sigue siendo el que leímos,
 * así que si dos webhooks llegan juntos, solo uno obtiene la acción 'entregar'.
 * pago: { resultado, monto_centavos, moneda, provider_payment_id, metodo_pago }
 * Devuelve { orden, accion, cambia, motivo? }.
 */
export async function aplicarPago(env, orderId, pago) {
  const orden = await ordenPorId(env, orderId);
  if (!orden) return { orden: null, accion: null, cambia: false, motivo: 'orden_no_existe' };

  // Un "aprobado" que no cuadra en monto o moneda no se entrega: queda para revisión manual.
  // Suscripción con cupón por % (FUNDADOR30, 5 % por recomendación): Stripe redondea el descuento por renglón, así que se
  // aceptan unos centavos de diferencia y la orden se queda con lo que de verdad se cobró (el CSV y los puntos cuadran).
  const tolerancia = orden.descuento_duracion && orden.descuento_codigo_centavos > 0 ? TOLERANCIA_PCT : 0;
  const dif = pago.resultado === 'aprobado' ? orden.monto_centavos - pago.monto_centavos : 0;
  if (pago.resultado === 'aprobado' && (!Number.isInteger(pago.monto_centavos) || Math.abs(dif) > tolerancia || String(pago.moneda).toUpperCase() !== orden.moneda))
    return { orden, accion: null, cambia: false, motivo: 'monto_no_coincide' };

  const t = transicion(orden.estado, pago.resultado);
  if (!t.cambia) {
    // OXXO o SPEI: el checkout se completó pero el pago llega después. Se guarda el método para que la página de
    // gracias muestre "Tu pedido está apartado" con sus instrucciones (y no "Confirmando tu pago" para siempre).
    if (orden.estado === 'pending' && pago.resultado === 'pendiente' && pago.metodo_pago && !orden.metodo_pago)
      await run(env, "UPDATE orders SET metodo_pago = ?, provider_payment_id = COALESCE(?, provider_payment_id), updated_at = ? WHERE id = ? AND estado = 'pending'",
        pago.metodo_pago, pago.provider_payment_id ?? null, ahoraISO(), orderId);
    return { orden, accion: null, cambia: false };
  }

  const ahora = ahoraISO();
  const r = await run(env,
    `UPDATE orders SET estado = ?, provider_payment_id = COALESCE(?, provider_payment_id), metodo_pago = COALESCE(?, metodo_pago),
       provider_charge_id = COALESCE(?, provider_charge_id),
       monto_centavos = monto_centavos - ?, descuento_centavos = descuento_centavos + ?, descuento_codigo_centavos = descuento_codigo_centavos + ?,
       paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END, updated_at = ?
     WHERE id = ? AND estado = ?`,
    t.estado, pago.provider_payment_id ?? null, pago.metodo_pago ?? null, pago.provider_charge_id ?? null, dif, dif, dif, t.estado, ahora, ahora, orderId, orden.estado);
  if (!r.meta.changes) return { orden, accion: null, cambia: false, motivo: 'carrera' };
  if (dif) Object.assign(orden, { monto_centavos: orden.monto_centavos - dif, descuento_centavos: orden.descuento_centavos + dif, descuento_codigo_centavos: orden.descuento_codigo_centavos + dif });
  // Código de descuento: el uso cuenta al pagarse (no al abrir el pago), una sola vez por orden (solo pasa en la transición
  // a paid, que gana un solo webhook). No se libera con un reembolso o una cancelación.
  if (t.estado === 'paid' && orden.descuento_codigo && orden.descuento_codigo !== REFERIDO) await contarUso(env, orden.descuento_codigo, orden.descuento_app);

  if (t.accion === 'revocar') {
    await run(env, 'UPDATE download_tokens SET revocado = 1 WHERE order_id = ?', orderId);
    await run(env, "UPDATE regalos SET estado = 'revocado' WHERE order_id = ? AND estado = 'pendiente'", orderId);
  }
  return { orden: { ...orden, estado: t.estado }, accion: t.accion, cambia: true };
}

// Centavos de diferencia que se aceptan entre la orden y Stripe en suscripciones con cupón por %
export const TOLERANCIA_PCT = 5;

async function contarUso(env, codigo, app) {
  await env.DB.batch([
    env.DB.prepare('UPDATE codigos_descuento SET usos = usos + 1 WHERE codigo = ?').bind(codigo),
    ...(app ? [env.DB.prepare(`INSERT INTO codigos_descuento_usos (codigo, app, usos) SELECT ?, ?, 1 WHERE EXISTS (SELECT 1 FROM codigos_descuento WHERE codigo = ?)
      ON CONFLICT (codigo, app) DO UPDATE SET usos = usos + 1`).bind(codigo, app, codigo)] : []),
  ]);
}

// Webhooks: registra el evento crudo. Devuelve false si ya se había procesado (reintento del proveedor).
export async function registrarEvento(env, proveedor, eventoId, tipo, payload) {
  await run(env, 'INSERT OR IGNORE INTO webhook_events (proveedor, evento_id, tipo, payload) VALUES (?,?,?,?)', proveedor, eventoId, tipo, payload);
  const ev = await one(env, 'SELECT procesado FROM webhook_events WHERE proveedor = ? AND evento_id = ?', proveedor, eventoId);
  return !ev.procesado;
}
export const marcarEvento = (env, proveedor, eventoId, error = null) =>
  run(env, 'UPDATE webhook_events SET procesado = ?, error = ? WHERE proveedor = ? AND evento_id = ?', error ? 0 : 1, error, proveedor, eventoId);

export const registrarAnalitica = (env, tipo, { product_id = null, order_id = null, ref_code = null } = {}) =>
  run(env, 'INSERT INTO events (tipo, product_id, order_id, ref_code) VALUES (?,?,?,?)', tipo, product_id, order_id, ref_code);

// Ventana fija. Devuelve true si la petición entra en el límite.
export async function dentroDelLimite(env, clave, max, segundos) {
  const ventana = Math.floor(Date.now() / 1000 / segundos) * segundos;
  const r = await one(env,
    `INSERT INTO rate_limits (clave, ventana, conteo) VALUES (?,?,1)
     ON CONFLICT (clave, ventana) DO UPDATE SET conteo = conteo + 1 RETURNING conteo`, clave, ventana);
  return r.conteo <= max;
}
