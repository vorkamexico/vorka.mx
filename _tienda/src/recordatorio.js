// Recordatorio de compra sin terminar: un solo correo por orden, amable y honesto, que se manda a mano
// desde Vorka OS (Tienda › Órdenes › Enviar recordatorio). Incluye una liga para retomar el pago
// (/tienda/retomar/<orden>?e=…&s=…) que abre un pago nuevo con los mismos productos, nombre y correo.
// La liga va firmada con DOWNLOAD_TOKEN_SECRET y dura 14 días.
import { one, all, run, ahoraISO, enc, hex, iguales, correoOculto, pesos } from './util.js';
import { marco, boton, lista, enviar, esc, P, SOPORTE } from './correo.js';
import { crearOrden, guardarSesion, registrarAnalitica, aplicarPago } from './modelo.js';
import { proveedor } from './pagos/index.js';
import { pagina, aviso } from './paginas.js';
import { FLECHA } from './marco.generado.js';

export const VIGENCIA_RETOMAR_DIAS = 14;
const ESPERA_MIN_MS = 60 * 60e3;   // no se recuerda una orden de hace menos de 1 hora (puede estar pagando)

async function firma(env, id, e) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const k = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(`retomar:${id}:${e}`))).slice(0, 32);
}
export async function ligaRetomar(env, id, ahora = Date.now()) {
  const e = Math.floor(ahora / 1000) + VIGENCIA_RETOMAR_DIAS * 86400;
  return `${env.SITE_URL}/tienda/retomar/${id}?e=${e}&s=${await firma(env, id, e)}`;
}

export function correoRecordatorio(env, orden, items, url) {
  const nombre = orden.nombre.split(' ')[0];
  const uno = items.length === 1;
  const asunto = uno ? `Tu compra de ${items[0].nombre} quedó pendiente` : 'Tu compra en Vorka México quedó pendiente';
  const oxxo = orden.metodo_pago === 'oxxo';
  const html = marco(asunto, `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">Vimos que empezaste una compra en la tienda de Vorka México y el pago no se completó. A veces pasa: se cierra la ventana, la tarjeta pide una verificación o la ficha de OXXO se vence.</p>
${lista(items.map(i => esc(i.nombre)))}
<p style="${P}">Si todavía te interesa, puedes terminarla aquí. Te abre un pago nuevo con tus mismos datos, por ${esc(pesos(orden.monto_centavos))}, con tarjeta, OXXO o SPEI:</p>
${boton(url, 'Terminar mi compra')}
${oxxo ? `<p style="${P}">Si ya pagaste en OXXO, ignora este correo: en cuanto se refleje tu pago te llegan tus archivos.</p>` : ''}
<p style="${P}">Si tienes alguna duda sobre el producto o el pago, responde este correo o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>. Con gusto te ayudamos.</p>
<p style="${P}">Y si ya no te interesa, no tienes que hacer nada: es el único recordatorio que te mandaremos.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)} · la liga funciona ${VIGENCIA_RETOMAR_DIAS} días</p>`);
  const texto = `Hola, ${nombre}:

Vimos que empezaste una compra en la tienda de Vorka México y el pago no se completó. A veces pasa: se cierra la ventana, la tarjeta pide una verificación o la ficha de OXXO se vence.

${items.map(i => `- ${i.nombre}`).join('\n')}

Si todavía te interesa, puedes terminarla aquí (pago nuevo con tus mismos datos, por ${pesos(orden.monto_centavos)}, con tarjeta, OXXO o SPEI):
${url}
${oxxo ? '\nSi ya pagaste en OXXO, ignora este correo: en cuanto se refleje tu pago te llegan tus archivos.\n' : ''}
Si tienes alguna duda, responde este correo o escríbenos por WhatsApp: ${SOPORTE.whatsapp}

Y si ya no te interesa, no tienes que hacer nada: es el único recordatorio que te mandaremos.

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// ¿Se le puede mandar recordatorio? Devuelve el motivo si no.
export async function motivoNoRecordar(env, o, ahora = Date.now()) {
  if (!o) return 'Esa orden no existe.';
  if (!['pending', 'failed'].includes(o.estado)) return 'Solo se recuerdan órdenes que no se pagaron.';
  if (o.recordatorio_at) return 'A esta orden ya se le mandó su recordatorio.';
  if (ahora - Date.parse(o.created_at) < ESPERA_MIN_MS) return 'Es muy reciente: espera al menos una hora, puede estar pagando.';
  // Si después compró lo mismo con ese correo, no se le molesta
  const yaCompro = await one(env, `SELECT 1 FROM orders o2 JOIN order_items i2 ON i2.order_id = o2.id
    WHERE o2.email = ? AND o2.estado = 'paid' AND o2.created_at >= ? AND i2.product_id IN (SELECT product_id FROM order_items WHERE order_id = ?) LIMIT 1`, o.email, o.created_at, o.id);
  if (yaCompro) return 'Esta persona ya lo compró en otra orden.';
  const otro = await one(env, 'SELECT id FROM orders WHERE email = ? AND recordatorio_at >= ? AND id != ?', o.email, new Date(ahora - 7 * 864e5).toISOString(), o.id);
  if (otro) return 'A este correo ya le mandamos un recordatorio esta semana.';
  return null;
}

export async function recordarOrden(env, id, ahora = Date.now()) {
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', String(id));
  const motivo = await motivoNoRecordar(env, o, ahora);
  if (motivo) throw new Error(motivo);
  const items = await all(env, 'SELECT product_id, nombre FROM order_items WHERE order_id = ?', o.id);
  // Se marca primero (sin carrera: solo si sigue sin recordatorio) y si el correo falla se desmarca
  const marca = new Date(ahora).toISOString();
  const r = await run(env, "UPDATE orders SET recordatorio_at = ?, updated_at = ? WHERE id = ? AND recordatorio_at IS NULL AND estado IN ('pending','failed')", marca, ahoraISO(), o.id);
  if (!r.meta.changes) throw new Error('A esta orden ya se le mandó su recordatorio.');
  try {
    const c = correoRecordatorio(env, o, items, await ligaRetomar(env, o.id, ahora));
    await enviar(env, { para: o.email, ...c, idempotencia: `recordatorio-${o.id}` });
  } catch (e) {
    await run(env, 'UPDATE orders SET recordatorio_at = NULL WHERE id = ? AND recordatorio_at = ?', o.id, marca);
    console.error('recordatorio', o.id, correoOculto(o.email), e.message);
    throw new Error('No se pudo mandar el correo. Intenta de nuevo en un momento.');
  }
  return { ok: true, recordatorio_at: marca };
}

// GET /tienda/retomar/<orden>?e&s → pago nuevo con los mismos productos (los que sigan a la venta)
export async function retomarPago(env, id, url) {
  const e = Number(url.searchParams.get('e')), s = String(url.searchParams.get('s') || '');
  const vencida = (titulo, texto) => pagina({ titulo: `${titulo} · Vorka México`, ruta: '/tienda/', noindex: true, status: 410,
    cuerpo: aviso({ clase: 'alerta', titulo, texto, extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ir a la tienda ${FLECHA}</a></div>` }) });
  if (!e || e < Date.now() / 1000 || !iguales(s, await firma(env, id, e))) return vencida('Esta liga ya venció', 'Puedes hacer tu compra desde la tienda o escribirnos a hola@vorka.mx y te ayudamos.');
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', id);
  if (!o) return vencida('No encontramos esa compra', 'Puedes hacerla de nuevo desde la tienda.');
  if (o.estado === 'paid') return Response.redirect(`${env.SITE_URL}/tienda/gracias?order=${o.id}`, 303);
  // Si ya hay una compra pagada más reciente con estos productos, no se cobra dos veces
  const pagada = await one(env, `SELECT o2.id FROM orders o2 JOIN order_items i2 ON i2.order_id = o2.id WHERE o2.email = ? AND o2.estado = 'paid' AND o2.created_at >= ?
    AND i2.product_id IN (SELECT product_id FROM order_items WHERE order_id = ?) LIMIT 1`, o.email, o.created_at, o.id);
  if (pagada) return Response.redirect(`${env.SITE_URL}/tienda/gracias?order=${pagada.id}`, 303);
  const items = await all(env, 'SELECT i.cantidad, p.slug FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', o.id);
  let nueva;
  try { nueva = await crearOrden(env, { items: items.map(i => ({ slug: i.slug, cantidad: i.cantidad })), email: o.email, nombre: o.nombre, ref: o.ref_code }); }
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
