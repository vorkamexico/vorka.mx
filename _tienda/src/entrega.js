// Entrega: token de descarga + correo. Se llama desde el webhook (y luego desde "reenviar" y el panel).
import { one, all, run, aleatorio, hex, enc, ahoraISO, correoOculto } from './util.js';
import { marco, boton, lista, enviar, esc, P, SOPORTE } from './correo.js';
import { mandarRegalos } from './regalos.js';

export const VIGENCIA_DIAS = 7;
export const MAX_DESCARGAS = 10; // por archivo
const RESERVA_MS = 2 * 60e3;

// El token en claro (32 bytes aleatorios) solo viaja en el correo; en D1 queda su HMAC-SHA256 con DOWNLOAD_TOKEN_SECRET
export async function hashToken(env, token) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const llave = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, enc.encode(token)));
}

export async function crearToken(env, orderId, ahora = Date.now()) {
  const token = aleatorio(32);
  const hash = await hashToken(env, token);
  const expires_at = new Date(ahora + VIGENCIA_DIAS * 864e5).toISOString();
  await run(env, 'INSERT INTO download_tokens (order_id, token_hash, expires_at) VALUES (?,?,?)', orderId, hash, expires_at);
  return { token, hash, expires_at };
}

// Productos de acceso (contenido.acceso, p. ej. Simulador PAA): abren una app en lugar de entregar archivos
const accesoDe = i => { try { return JSON.parse(i.contenido || '{}').acceso || null; } catch { return null; } };

export function correoEntrega(env, orden, items, token) {
  const accesos = items.map(accesoDe);
  // Compra de un solo producto de acceso: el botón entra directo a la app; con archivos, a la página de descargas
  if (items.length && accesos.every(Boolean)) return correoAcceso(env, orden, items, token, accesos[0]);
  const url = `${env.SITE_URL}/descargas/${token}`;
  const nombre = orden.nombre.split(' ')[0];
  const productos = items.map(i => i.nombre);
  const regalo = !!orden.regalo_de || orden.proveedor === 'cortesia';
  const asunto = regalo ? `Te regalaron: ${items[0].nombre}` : items.length === 1 ? `Tu descarga: ${items[0].nombre}` : 'Tus descargas de Vorka México';
  const linea1 = regalo ? `¡Te ${orden.proveedor === 'cortesia' ? 'regalamos' : 'regalaron'} ${items.length === 1 ? 'este material' : 'estos materiales'} de Vorka México! Tus archivos ya están listos y quedan a tu nombre.` : '¡Gracias por tu compra! Tu pago quedó confirmado y tus archivos ya están listos.';
  const html = marco(asunto, `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">${esc(linea1)}</p>${orden.regalo_mensaje && regalo ? `\n<p style="${P};padding:12px 16px;border-left:3px solid #6b2a85;background:#f7f4f8">${esc(orden.regalo_mensaje)}</p>` : ''}
${lista(productos.map(esc))}
${boton(url, 'Descargar mis archivos')}
<p style="${P}">El enlace funciona durante ${VIGENCIA_DIAS} días y puedes descargar cada archivo hasta ${MAX_DESCARGAS} veces. Te recomendamos guardarlos en tu computadora o en tu nube en cuanto los descargues.</p>
<p style="${P}">Si el enlace vence, pide uno nuevo en <a href="${env.SITE_URL}/descargas/reenviar" style="color:#6b2a85;text-decoration:underline">vorka.mx/descargas/reenviar</a> con este mismo correo.</p>
<p style="${P}">¿Algún problema con tus archivos? Escríbenos a <a href="mailto:${SOPORTE.correo}" style="color:#6b2a85;text-decoration:underline">${SOPORTE.correo}</a> o por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a> y lo resolvemos.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)}</p>`);
  const texto = `Hola, ${nombre}:

${linea1}${orden.regalo_mensaje && regalo ? `\n\n${orden.regalo_mensaje}` : ''}

${productos.map(p => `- ${p}`).join('\n')}

Descarga tus archivos aquí:
${url}

El enlace funciona durante ${VIGENCIA_DIAS} días y puedes descargar cada archivo hasta ${MAX_DESCARGAS} veces.
Si el enlace vence, pide uno nuevo en ${env.SITE_URL}/descargas/reenviar con este mismo correo.

¿Algún problema? Escríbenos a ${SOPORTE.correo} o por WhatsApp: ${SOPORTE.whatsapp}

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// Enlace de entrada de una app: en vorka.mx/<app>/entrar/ o, si la app vive en otro dominio (Brindi en os.vorka.mx), en acceso.url
export const urlEntrar = (env, acceso, token) => acceso.url && /^https:\/\/[a-z0-9.-]+\.vorka\.mx\//.test(acceso.url) ? `${acceso.url}${token}` : `${env.SITE_URL}/${acceso.app}/entrar/${token}`;

function correoAcceso(env, orden, items, token, acceso) {
  const url = items.length === 1 ? urlEntrar(env, acceso, token) : `${env.SITE_URL}/descargas/${token}`;
  const boton_ = acceso.boton || 'Entrar';
  const nombre = orden.nombre.split(' ')[0];
  const intento = acceso.tipo === 'intento', regalo = !!orden.regalo_de || orden.proveedor === 'cortesia';
  const asunto = intento ? 'Tus simulacros adicionales ya están listos' : regalo ? `Tu regalo está activo: ${items[0].nombre}` : `Tu acceso: ${items[0].nombre}`;
  const linea1 = intento ? '¡Gracias por tu compra! Tus simulacros completos adicionales ya están disponibles en tu cuenta.'
    : regalo ? `¡Te ${orden.proveedor === 'cortesia' ? 'regalamos' : 'regalaron'} ${items[0].nombre}! Tu acceso ya está activo y queda a tu nombre.` : '¡Gracias por tu compra! Tu pago quedó confirmado y tu acceso ya está activo.';
  const linea2 = intento ? 'Entra al simulador con el mismo correo y los verás en el contador de simulacros completos.'
    : acceso.app === 'cupo' ? 'Con este botón entras a Cupo. Tus eventos Pro quedan guardados en tu cuenta y se aplican al publicar cada evento. Para volver a entrar después, usa este mismo correo en os.vorka.mx/cupo.'
    : acceso.app === 'brindi' ? 'Con este botón entras a Brindi para crear tu invitación. Tu compra queda guardada en tu cuenta; para volver a entrar después, usa este mismo correo en os.vorka.mx/brindi.'
    : 'Tu acceso dura un año a partir de hoy. Usa este botón en cada celular o computadora donde quieras practicar; tu historial se guarda en tu cuenta.';
  const html = marco(asunto, `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">${linea1}</p>
${lista(items.map(i => esc(i.nombre) + (i.cantidad > 1 ? ` × ${i.cantidad}` : '')))}
${boton(url, boton_)}
<p style="${P}">${linea2}</p>
<p style="${P}">Si el botón deja de funcionar o cambias de dispositivo, pide un enlace nuevo en <a href="${env.SITE_URL}/descargas/reenviar" style="color:#6b2a85;text-decoration:underline">vorka.mx/descargas/reenviar</a> con este mismo correo.</p>
<p style="${P}">¿Algún problema? Escríbenos a <a href="mailto:${SOPORTE.correo}" style="color:#6b2a85;text-decoration:underline">${SOPORTE.correo}</a> o por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a> y lo resolvemos.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)}</p>`);
  const texto = `Hola, ${nombre}:

${linea1}

${items.map(i => `- ${i.nombre}${i.cantidad > 1 ? ` × ${i.cantidad}` : ''}`).join('\n')}

${boton_}:
${url}

${linea2}
Si deja de funcionar, pide uno nuevo en ${env.SITE_URL}/descargas/reenviar con este mismo correo.

¿Algún problema? Escríbenos a ${SOPORTE.correo} o por WhatsApp: ${SOPORTE.whatsapp}

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// Token nuevo + correo. Si el correo falla, el token se borra (no quedan enlaces que nadie recibió).
export async function mandarEnlace(env, orderId, ahora = Date.now()) {
  const orden = await one(env, 'SELECT * FROM orders WHERE id = ?', orderId);
  // Compra para regalar: quien paga recibe las ligas de un solo uso, no el acceso
  // Cortesías del panel con ligas: sus ligas solo se ven al crearlas; reenviar las apagaría aunque ya se hayan compartido.
  // Las cortesías enviadas directo a un correo (regalo = 0) se entregan como cualquier compra.
  if (orden.proveedor === 'cortesia' && orden.regalo) return;
  if (orden.regalo) return mandarRegalos(env, orden);
  const items = await all(env, 'SELECT i.product_id, i.nombre, i.cantidad, p.contenido FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', orderId);
  const { token, hash } = await crearToken(env, orderId, ahora);
  try {
    await enviar(env, { para: orden.email, ...correoEntrega(env, orden, items, token), idempotencia: `entrega-${hash.slice(0, 32)}` });
  } catch (e) {
    await run(env, 'DELETE FROM download_tokens WHERE token_hash = ?', hash);
    console.error('entrega: correo falló', orderId, correoOculto(orden.email), e.message);
    throw e;
  }
}

/**
 * Reenvío (formulario /descargas/reenviar y botón del panel): token nuevo y correo otra vez.
 * Solo para órdenes pagadas; los tokens anteriores siguen hasta que venzan.
 */
export async function reenviarEnlace(env, orderId) {
  const o = await one(env, "SELECT id FROM orders WHERE id = ? AND estado = 'paid'", orderId);
  if (!o) return false;
  await mandarEnlace(env, orderId);
  await run(env, 'UPDATE orders SET correo_enviado_at = COALESCE(correo_enviado_at, ?), updated_at = ? WHERE id = ?', ahoraISO(), ahoraISO(), orderId);
  return true;
}

/**
 * Manda el correo de entrega de una orden pagada, una sola vez aunque lleguen varios webhooks a la vez.
 * Reserva el envío con un UPDATE condicional; si el correo falla, borra el token y libera la reserva
 * (el webhook responde 500 y la pasarela reintenta). Devuelve true si este llamado envió el correo.
 */
export async function entregar(env, orderId) {
  const ahora = Date.now();
  const r = await run(env,
    `UPDATE orders SET correo_intento_at = ? WHERE id = ? AND estado = 'paid' AND correo_enviado_at IS NULL
       AND (correo_intento_at IS NULL OR correo_intento_at < ?)`,
    new Date(ahora).toISOString(), orderId, new Date(ahora - RESERVA_MS).toISOString());
  if (!r.meta.changes) return false;

  try {
    await mandarEnlace(env, orderId, ahora);
  } catch (e) {
    await run(env, 'UPDATE orders SET correo_intento_at = NULL WHERE id = ?', orderId);
    throw e;
  }
  await run(env, 'UPDATE orders SET correo_enviado_at = ?, updated_at = ? WHERE id = ?', ahoraISO(), ahoraISO(), orderId);
  return true;
}

// Personalización por comprador (marca de agua con su correo, etc.). Fuera de alcance por ahora:
// devuelve el archivo tal cual. Punto de extensión para /descargas.
export async function personalizeFile(orden, archivo) {
  return archivo;
}
