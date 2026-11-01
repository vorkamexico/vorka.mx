// Recordatorio de compra sin terminar: correos amables y honestos, hasta 3 por orden. Salen solos (cron de cada hora,
// recordatoriosAutomaticos) y también se pueden mandar a mano desde Vorka OS (Tienda › Órdenes › Enviar recordatorio). Incluye una liga para retomar el pago
// (/tienda/retomar/<orden>?e=…&s=…) que abre un pago nuevo con los mismos productos, nombre y correo.
// La liga va firmada con DOWNLOAD_TOKEN_SECRET y dura 14 días.
import { one, all, run, ahoraISO, enc, hex, iguales, correoOculto, pesos } from './util.js';
import { marco, boton, lista, enviar, esc, P, SOPORTE } from './correo.js';
import { crearOrden, guardarSesion, registrarAnalitica, aplicarPago } from './modelo.js';
import { proveedor } from './pagos/index.js';
import { suscripcionDeOrden } from './suscripciones.js';
import { centavosDescuento } from './descuentos.js';
import { COBRO_MINIMO } from './puntos-reglas.js';
import { pagina, aviso } from './paginas.js';
import { FLECHA } from './marco.generado.js';

export const VIGENCIA_RETOMAR_DIAS = 14;
const ESPERA_MIN_MS = 60 * 60e3;   // no se recuerda una orden de hace menos de 1 hora (puede estar pagando)
export const MAX_SEGUIMIENTOS = 3;           // correos de seguimiento por orden
const ENTRE_SEGUIMIENTOS_MS = 48 * 36e5;    // al menos 48 h entre uno y otro (por orden y por correo)

// Automáticos (decisión del dueño, 2026-11-01): el 1.º a la hora, el 2.º 48 h después del 1.º y el 3.º 3 días después del 2.º
// con 10 % de descuento (solo en pagos únicos: las suscripciones no aceptan este cupón y su 3.º va sin descuento).
// Solo órdenes desde AUTO_DESDE (las de antes se siguen recordando a mano) y solo la más reciente de cada correo.
export const AUTO = { primero: 60 * 60e3, segundo: 48 * 36e5, tercero: 72 * 36e5, pct: 10, codigo: 'RECORDATORIO', lote: 25 };
export const AUTO_DESDE = '2026-11-01T00:00:00.000Z';

async function firma(env, id, e, pct = 0) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const k = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(`retomar:${id}:${e}${pct ? `:d${pct}` : ''}`))).slice(0, 32);
}
// pct: descuento que lleva la liga (va dentro de la firma: no se puede cambiar a mano)
export async function ligaRetomar(env, id, ahora = Date.now(), pct = 0) {
  const e = Math.floor(ahora / 1000) + VIGENCIA_RETOMAR_DIAS * 86400;
  return `${env.SITE_URL}/tienda/retomar/${id}?e=${e}${pct ? `&d=${pct}` : ''}&s=${await firma(env, id, e, pct)}`;
}

// desc: { pct, antes, ahora } (centavos) cuando el correo lleva descuento
export function correoRecordatorio(env, orden, items, url, vez = 1, desc = null) {
  const nombre = orden.nombre.split(' ')[0];
  const uno = items.length === 1;
  const asunto = desc ? `Te guardamos un ${desc.pct} % de descuento para terminar tu compra` : vez > 1 ? (uno ? `¿Te ayudamos a terminar tu compra de ${items[0].nombre}?` : '¿Te ayudamos a terminar tu compra en Vorka México?')
    : uno ? `Tu compra de ${items[0].nombre} quedó pendiente` : 'Tu compra en Vorka México quedó pendiente';
  const oxxo = orden.metodo_pago === 'oxxo';
  const html = marco(asunto, `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">Vimos que empezaste una compra en la tienda de Vorka México y el pago no se completó. A veces pasa: se cierra la ventana, la tarjeta pide una verificación o la ficha de OXXO se vence.</p>
${lista(items.map(i => esc(i.nombre)))}
${desc ? `<p style="${P}">Para que no se te pase, te dejamos un <b>${desc.pct} % de descuento</b>: tu compra queda en <b>${esc(pesos(desc.ahora))}</b> en lugar de ${esc(pesos(desc.antes))}. Se aplica solo con este botón; puedes pagar con tarjeta, OXXO o SPEI:</p>
${boton(url, `Terminar mi compra con ${desc.pct} %`)}` : `<p style="${P}">Si todavía te interesa, puedes terminarla aquí. Te abre un pago nuevo con tus mismos datos, por ${esc(pesos(orden.monto_centavos))}, con tarjeta, OXXO o SPEI:</p>
${boton(url, 'Terminar mi compra')}`}
${oxxo ? `<p style="${P}">Si ya pagaste en OXXO, ignora este correo: en cuanto se refleje tu pago te llegan tus archivos.</p>` : ''}
<p style="${P}">Si tienes alguna duda sobre el producto o el pago, responde este correo o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>. Con gusto te ayudamos.</p>
<p style="${P}">Y si ya no te interesa, no tienes que hacer nada.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)} · la liga funciona ${VIGENCIA_RETOMAR_DIAS} días</p>`);
  const texto = `Hola, ${nombre}:

Vimos que empezaste una compra en la tienda de Vorka México y el pago no se completó. A veces pasa: se cierra la ventana, la tarjeta pide una verificación o la ficha de OXXO se vence.

${items.map(i => `- ${i.nombre}`).join('\n')}

${desc ? `Para que no se te pase, te dejamos un ${desc.pct} % de descuento: tu compra queda en ${pesos(desc.ahora)} en lugar de ${pesos(desc.antes)}. Se aplica solo con esta liga (tarjeta, OXXO o SPEI):` : `Si todavía te interesa, puedes terminarla aquí (pago nuevo con tus mismos datos, por ${pesos(orden.monto_centavos)}, con tarjeta, OXXO o SPEI):`}
${url}
${oxxo ? '\nSi ya pagaste en OXXO, ignora este correo: en cuanto se refleje tu pago te llegan tus archivos.\n' : ''}
Si tienes alguna duda, responde este correo o escríbenos por WhatsApp: ${SOPORTE.whatsapp}

Y si ya no te interesa, no tienes que hacer nada.

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// ¿Se le puede mandar recordatorio? Devuelve el motivo si no.
export async function motivoNoRecordar(env, o, ahora = Date.now()) {
  if (!o) return 'Esa orden no existe.';
  if (!['pending', 'failed'].includes(o.estado)) return 'Solo se recuerdan órdenes que no se pagaron.';
  const enviados = Number(o.seguimientos) || (o.recordatorio_at ? 1 : 0);
  if (enviados >= MAX_SEGUIMIENTOS) return `A esta orden ya se le mandaron los ${MAX_SEGUIMIENTOS} correos de seguimiento.`;
  if (ahora - Date.parse(o.created_at) < ESPERA_MIN_MS) return 'Es muy reciente: espera al menos una hora, puede estar pagando.';
  if (o.recordatorio_at && ahora - Date.parse(o.recordatorio_at) < ENTRE_SEGUIMIENTOS_MS) return 'Ya se le mandó un correo hace menos de 48 horas: dale tiempo de verlo.';
  // Si después compró lo mismo con ese correo, no se le molesta
  const yaCompro = await one(env, `SELECT 1 FROM orders o2 JOIN order_items i2 ON i2.order_id = o2.id
    WHERE o2.email = ? AND o2.estado = 'paid' AND o2.created_at >= ? AND i2.product_id IN (SELECT product_id FROM order_items WHERE order_id = ?) LIMIT 1`, o.email, o.created_at, o.id);
  if (yaCompro) return 'Esta persona ya lo compró en otra orden.';
  const otro = await one(env, 'SELECT id FROM orders WHERE email = ? AND recordatorio_at >= ? AND id != ?', o.email, new Date(ahora - ENTRE_SEGUIMIENTOS_MS).toISOString(), o.id);
  if (otro) return 'A este correo ya le mandamos un seguimiento por otra orden en las últimas 48 horas.';
  return null;
}

// pct: descuento del correo (solo el 3.º automático); si la orden es de suscripción se manda sin descuento
export async function recordarOrden(env, id, ahora = Date.now(), { pct = 0 } = {}) {
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', String(id));
  const motivo = await motivoNoRecordar(env, o, ahora);
  if (motivo) throw new Error(motivo);
  const items = await all(env, 'SELECT product_id, nombre, precio_centavos, cantidad, creador_id FROM order_items WHERE order_id = ?', o.id);
  let desc = null;
  if (pct && !(await suscripcionDeOrden(env, { items }))) {
    // Lo mismo que cobrará el pago nuevo (crearOrden con el descuento): sobre lo de Vorka, a precio de hoy no cambia el correo
    const subtotal = items.reduce((s, i) => s + i.precio_centavos * (i.cantidad || 1), 0), base = items.filter(i => !i.creador_id).reduce((s, i) => s + i.precio_centavos * (i.cantidad || 1), 0);
    const menos = centavosDescuento(base, subtotal, pct, COBRO_MINIMO);
    if (menos > 0) desc = { pct, antes: subtotal, ahora: subtotal - menos };
  }
  const vez = (Number(o.seguimientos) || (o.recordatorio_at ? 1 : 0)) + 1;
  // Se marca primero (sin carrera: solo si nadie mandó otro mientras tanto) y si el correo falla se regresa como estaba
  const marca = new Date(ahora).toISOString();
  const r = await run(env, "UPDATE orders SET recordatorio_at = ?, seguimientos = ?, updated_at = ? WHERE id = ? AND estado IN ('pending','failed') AND recordatorio_at IS ?",
    marca, vez, ahoraISO(), o.id, o.recordatorio_at ?? null);
  if (!r.meta.changes) throw new Error('Alguien acaba de mandarle un correo a esta orden.');
  try {
    const c = correoRecordatorio(env, o, items, await ligaRetomar(env, o.id, ahora, desc ? desc.pct : 0), vez, desc);
    await enviar(env, { para: o.email, ...c, idempotencia: `recordatorio-${o.id}-${vez}` });
  } catch (e) {
    await run(env, 'UPDATE orders SET recordatorio_at = ?, seguimientos = ? WHERE id = ? AND recordatorio_at = ?', o.recordatorio_at ?? null, vez - 1, o.id, marca);
    console.error('recordatorio', o.id, correoOculto(o.email), e.message);
    throw new Error('No se pudo mandar el correo. Intenta de nuevo en un momento.');
  }
  return { ok: true, recordatorio_at: marca, seguimientos: vez, descuento: desc?.pct || 0 };
}

// Cron de cada hora: manda el recordatorio que le toque a cada compra sin terminar (ver AUTO). No toca pagos en OXXO o SPEI
// que siguen esperando (pending con método) ni compras del equipo (correos de afiliados); solo la orden más reciente de cada correo.
export async function recordatoriosAutomaticos(env, ahora = Date.now(), { desde = AUTO_DESDE } = {}) {
  const l = await all(env, `SELECT o.id, o.created_at, o.recordatorio_at, COALESCE(o.seguimientos, 0) n FROM orders o
    WHERE o.estado IN ('pending', 'failed') AND o.created_at >= ? AND o.created_at <= ? AND COALESCE(o.seguimientos, 0) < ?
      AND (o.estado = 'failed' OR o.metodo_pago IS NULL)
      AND NOT EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = o.email AND o2.created_at > o.created_at)
      AND lower(o.email) NOT IN (SELECT lower(email) FROM affiliates WHERE email IS NOT NULL)
    ORDER BY o.created_at LIMIT ?`, desde, new Date(ahora - AUTO.primero).toISOString(), MAX_SEGUIMIENTOS, AUTO.lote);
  const r = { revisadas: l.length, enviados: 0, con_descuento: 0, omitidas: 0 };
  for (const o of l) {
    const vez = o.n + 1;
    const desde = vez === 1 ? Date.parse(o.created_at) + AUTO.primero : Date.parse(o.recordatorio_at || o.created_at) + (vez === 2 ? AUTO.segundo : AUTO.tercero);
    if (ahora < desde) continue;
    try {
      const x = await recordarOrden(env, o.id, ahora, { pct: vez === 3 ? AUTO.pct : 0 });
      r.enviados++; if (x.descuento) r.con_descuento++;
    } catch { r.omitidas++; }   // motivoNoRecordar (ya compró, otro correo reciente…) o falla del correo: se reintenta en la próxima corrida
  }
  return r;
}

// GET /tienda/retomar/<orden>?e&s → pago nuevo con los mismos productos (los que sigan a la venta)
export async function retomarPago(env, id, url) {
  const e = Number(url.searchParams.get('e')), s = String(url.searchParams.get('s') || ''), pct = Number(url.searchParams.get('d')) || 0;
  const vencida = (titulo, texto) => pagina({ titulo: `${titulo} · Vorka México`, ruta: '/tienda/', noindex: true, status: 410,
    cuerpo: aviso({ clase: 'alerta', titulo, texto, extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ir a la tienda ${FLECHA}</a></div>` }) });
  if (!e || e < Date.now() / 1000 || (pct && pct !== AUTO.pct) || !iguales(s, await firma(env, id, e, pct))) return vencida('Esta liga ya venció', 'Puedes hacer tu compra desde la tienda o escribirnos a hola@vorka.mx y te ayudamos.');
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', id);
  if (!o) return vencida('No encontramos esa compra', 'Puedes hacerla de nuevo desde la tienda.');
  if (o.estado === 'paid') return Response.redirect(`${env.SITE_URL}/tienda/gracias?order=${o.id}`, 303);
  // Si ya hay una compra pagada más reciente con estos productos, no se cobra dos veces
  const pagada = await one(env, `SELECT o2.id FROM orders o2 JOIN order_items i2 ON i2.order_id = o2.id WHERE o2.email = ? AND o2.estado = 'paid' AND o2.created_at >= ?
    AND i2.product_id IN (SELECT product_id FROM order_items WHERE order_id = ?) LIMIT 1`, o.email, o.created_at, o.id);
  if (pagada) return Response.redirect(`${env.SITE_URL}/tienda/gracias?order=${pagada.id}`, 303);
  const items = await all(env, 'SELECT i.cantidad, i.intervalo, p.slug FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', o.id);
  let nueva;
  // El descuento del 3.er recordatorio: como un código (el mayor gana; en suscripciones no aplica)
  const sus = pct ? await suscripcionDeOrden(env, { items: await all(env, 'SELECT product_id FROM order_items WHERE order_id = ?', o.id) }) : null;
  const descuento = pct && !sus ? { codigo: AUTO.codigo, pct } : null;
  try { nueva = await crearOrden(env, { items: items.map(i => ({ slug: i.slug, cantidad: i.cantidad, ...(i.intervalo ? { intervalo: i.intervalo } : {}) })), email: o.email, nombre: o.nombre, ref: o.ref_code, descuento }); }
  catch { return vencida('Este producto ya no está disponible', 'Puede que ya no esté a la venta. Escríbenos a hola@vorka.mx y te ayudamos.'); }
  const gracias = new URL('/tienda/gracias', env.SITE_URL); gracias.searchParams.set('order', nueva.id);
  const cancelar = new URL(gracias); cancelar.searchParams.set('cancelado', '1');
  try {
    const cobro = await proveedor(nueva.proveedor).crearCobro(env, nueva, { exito: gracias.toString(), cancelar: cancelar.toString() });
    await guardarSesion(env, nueva.id, cobro.sessionId);
    for (const it of nueva.items) await registrarAnalitica(env, 'begin_checkout', { product_id: it.product_id, order_id: nueva.id, ref_code: nueva.ref_code });
    return Response.redirect(cobro.url, 303);
  } catch (err) {
    console.error('retomar: pasarela', nueva.id, err.message);
    await aplicarPago(env, nueva.id, { resultado: 'rechazado' });
    return vencida('No pudimos abrir el pago', 'Intenta de nuevo en un momento o escríbenos a hola@vorka.mx.');
  }
}
