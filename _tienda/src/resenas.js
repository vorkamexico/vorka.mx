// Reseñas de compradores verificados (migración 0057).
//
// 1. Pedirlas (cron de cada hora, src/index.js): a quien pagó una orden le llega UN correo, una sola vez por orden, con una
//    liga única por producto (/tienda/resena/<token>). Cuándo:
//      · descargables (guías, plantillas…): 7 días después del pago, ya con tiempo de abrirlos;
//      · productos de acceso y suscripciones (simuladores, Ruta de Impacto, Evaluación de liderazgo, Brindi, Cupo, Agenda,
//        Vuelve, Vende, Cuentas): 14 días después del pago. Su uso vive en apps distintas (varias en Vorka OS), así que no
//        hay una señal común de «ya lo usó»; dos semanas alcanzan para haber hecho simulacros, publicado la invitación o
//        recibido citas. Una orden con los dos tipos espera los 14 días.
//    Ventana: se pide entre ese día y 14 días después (si el cron o el correo fallan, se reintenta; nunca a órdenes viejas,
//    tampoco al publicar esto). No se pide: si la orden ya no está pagada (reembolso, contracargo), si fue para regalar, si
//    no se cobró nada (cortesías, canjes), si es un complemento (simulacro adicional, sucursal…), si esa persona ya tiene una
//    reseña de ese producto, si se dio de baja de estos correos o si ya le pedimos otra en los últimos 7 días.
// 2. Escribirla: /tienda/resena/<token> (noindex): estrellas 1–5, texto opcional y nombre público. Se puede editar
//    mientras no esté aprobada u oculta.
// 3. Moderarla: Vorka OS › Tienda › Reseñas (Admin.resenas / Admin.decidirResena): aprobar u ocultar.
// 4. Publicarla: solo las aprobadas de órdenes que siguen pagadas salen en la página del producto (resenasDe,
//    seccionResenas) y en su JSON-LD (ldResenas: aggregateRating y review). Sin aprobadas, no sale nada.
// 5. ARCO (aviso de privacidad): borrarResenasCorreo deja sin datos las reseñas de un correo (las quita de la página).
import { one, all, run, ahoraISO, aleatorio, sha256, correoOculto, iguales } from './util.js';
import { marco, boton, enviar, esc, P, SOPORTE } from './correo.js';
import { pagina, aviso } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { dentroDelLimite } from './modelo.js';
import { SITIO } from './seo.js';

export const DIAS_DESCARGA = 7;
export const DIAS_ACCESO = 14;
export const VENTANA_DIAS = 14;          // días para mandar el correo a partir de que toca (reintentos)
export const ENTRE_CORREOS_DIAS = 7;     // a un mismo correo, como mucho un pedido de reseña por semana
export const POR_CORRIDA = 40;           // órdenes por corrida del cron
export const MAX_TEXTO = 1000, MAX_NOMBRE = 60, MIN_NOMBRE = 2;
export const ULTIMAS = 6;                // reseñas que se muestran en la página
const DIA = 864e5;
const TOKEN = /^[a-f0-9]{64}$/;

// ---------------------------------------------------------------------------------------------------------------------
// Pedirlas (cron)
// ---------------------------------------------------------------------------------------------------------------------

const contenidoDe = r => { try { return JSON.parse(r.contenido || '{}'); } catch { return {}; } };
const diasDe = c => c.acceso ? DIAS_ACCESO : DIAS_DESCARGA;

// Página pública donde se ve el producto (y sus reseñas): la de su app o la ficha /tienda/<slug>/
export const rutaProducto = p => contenidoDe(p).acceso?.ruta || `/tienda/${p.slug}/`;
// Complementos que se compran desde la app o junto con el plan (simulacro adicional, sucursal, profesional, invitados, álbum…):
// no se pide reseña de ellos, sino del producto principal
const COMPLEMENTOS = new Set(['intento', 'sucursal', 'profesional', 'invitados', 'album', 'musica', 'extension', 'mejora', 'plantilla_premium']);
const seCalifica = c => !COMPLEMENTOS.has(c.acceso?.tipo);

export function correoPedido(orden, items, { baja }) {
  const nombre = String(orden.nombre || '').trim().split(/\s+/)[0] || '';
  const uno = items.length === 1;
  const asunto = uno ? `¿Qué te pareció ${items[0].nombre}?` : '¿Qué te parecieron tus productos de Vorka México?';
  const html = marco(asunto, `
<p style="${P}">Hola${nombre ? `, ${esc(nombre)}` : ''}:</p>
<p style="${P}">Gracias otra vez por tu compra. Ya pasaron unos días y nos encantaría saber cómo te fue${uno ? ` con <b>${esc(items[0].nombre)}</b>` : ''}. Tu opinión nos ayuda a mejorar y le sirve mucho a quien está por decidir.</p>
<p style="${P}">Toma un minuto: eliges de 1 a 5 estrellas y, si quieres, escribes unas líneas.</p>
${items.map(i => `${uno ? '' : `<p style="${P};margin-bottom:6px;font-weight:650;text-align:center">${esc(i.nombre)}</p>`}${boton(i.url, uno ? 'Dejar mi reseña' : 'Calificarlo')}`).join('')}
<p style="${P}">Tu reseña se publica en la página del producto con el nombre que tú elijas (por ejemplo, «Mariana, Celaya»), después de que la revisemos. Tu correo nunca se publica.</p>
<p style="${P}">Y si algo no salió como esperabas, responde este correo o escríbenos por <a href="${SOPORTE.whatsapp}" style="color:#6b2a85;text-decoration:underline">WhatsApp</a>: lo resolvemos contigo.</p>
<p style="${P}">Con cariño,<br>el equipo de Vorka México</p>
<p style="${P};color:#8b8790;font-size:13px;text-align:center">Te escribimos solo esta vez por esta compra. Si no quieres que te pidamos reseñas, <a href="${esc(baja)}" style="color:#8b8790;text-decoration:underline">avísanos aquí</a>.</p>`, { etiqueta: 'Tu opinión' });
  const texto = `Hola${nombre ? `, ${nombre}` : ''}:

Gracias otra vez por tu compra. Ya pasaron unos días y nos encantaría saber cómo te fue${uno ? ` con ${items[0].nombre}` : ''}. Tu opinión nos ayuda a mejorar y le sirve mucho a quien está por decidir.

Toma un minuto: eliges de 1 a 5 estrellas y, si quieres, escribes unas líneas.

${items.map(i => `${uno ? 'Dejar mi reseña' : i.nombre}: ${i.url}`).join('\n')}

Tu reseña se publica en la página del producto con el nombre que tú elijas (por ejemplo, «Mariana, Celaya»), después de que la revisemos. Tu correo nunca se publica.

Y si algo no salió como esperabas, responde este correo o escríbenos por WhatsApp: ${SOPORTE.whatsapp}

Con cariño,
el equipo de Vorka México

Te escribimos solo esta vez por esta compra. Si no quieres que te pidamos reseñas: ${baja}`;
  return { asunto, html, texto };
}

/**
 * Cron: manda los correos que tocan. Devuelve { revisadas, enviadas, fallidas }.
 * Cada orden se «aparta» insertando sus renglones (UNIQUE order_id + product_id): si dos corridas se cruzan, solo una
 * inserta y manda. Si el correo falla, se borran esos renglones y se reintenta en la siguiente corrida (dentro de la ventana).
 */
export async function pedirResenas(env, ahora = new Date()) {
  const t = ahora.getTime();
  const masViejo = new Date(t - (DIAS_ACCESO + VENTANA_DIAS) * DIA).toISOString();
  const masNuevo = new Date(t - DIAS_DESCARGA * DIA).toISOString();
  const ordenes = await all(env, `SELECT o.id, o.email, o.nombre, o.paid_at FROM orders o
    WHERE o.estado = 'paid' AND o.regalo = 0 AND o.monto_centavos > 0 AND o.paid_at BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM resenas r WHERE r.order_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM resenas_bajas b WHERE b.email = o.email)
    ORDER BY o.paid_at LIMIT ?`, masViejo, masNuevo, POR_CORRIDA);
  const out = { revisadas: ordenes.length, enviadas: 0, fallidas: 0 };
  for (const o of ordenes) {
    try { if (await pedirOrden(env, o, t)) out.enviadas++; }
    catch (e) { out.fallidas++; console.error('resenas: pedir', o.id, correoOculto(o.email), e?.message); }
  }
  return out;
}

async function pedirOrden(env, o, t) {
  const items = await all(env, `SELECT DISTINCT i.product_id, p.nombre, p.slug, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id
    WHERE i.order_id = ? ORDER BY i.id`, o.id);
  if (!items.length) return false;
  // Toca cuando ya pasaron los días del producto que más tarda; fuera de la ventana ya no se pide
  const toca = Date.parse(o.paid_at) + Math.max(...items.map(i => diasDe(contenidoDe(i)))) * DIA;
  if (t < toca || t > toca + VENTANA_DIAS * DIA) return false;
  // Un pedido por semana a la misma persona (si compró varias veces seguidas)
  if (await one(env, 'SELECT 1 FROM resenas WHERE email = ? AND pedida_at >= ? LIMIT 1', o.email, new Date(t - ENTRE_CORREOS_DIAS * DIA).toISOString())) return false;
  const ya = new Set((await all(env, 'SELECT product_id FROM resenas WHERE email = ?', o.email)).map(r => r.product_id));
  const pedir = items.filter(i => seCalifica(contenidoDe(i)) && !ya.has(i.product_id));
  if (!pedir.length) return false;
  const marca = new Date(t).toISOString();
  const conToken = await Promise.all(pedir.map(async i => { const token = aleatorio(32); return { ...i, token, hash: await sha256(token) }; }));
  // UNIQUE (order_id, product_id): si otra corrida ya apartó esta orden, aquí no entra nada y no se manda otro correo
  const r = await env.DB.batch(conToken.map(i => env.DB.prepare('INSERT OR IGNORE INTO resenas (token_hash, order_id, product_id, email, pedida_at) VALUES (?, ?, ?, ?, ?)')
    .bind(i.hash, o.id, i.product_id, o.email, marca)));
  const nuevos = conToken.filter((_, k) => r[k].meta.changes);
  if (!nuevos.length) return false;
  const base = env.SITE_URL || SITIO;
  const correo = correoPedido(o, nuevos.map(i => ({ nombre: i.nombre, url: `${base}/tienda/resena/${i.token}` })), { baja: `${base}/tienda/resena/${nuevos[0].token}/baja` });
  try {
    await enviar(env, { para: o.email, ...correo, idempotencia: `resena-${o.id}` });
  } catch (e) {
    await run(env, "DELETE FROM resenas WHERE order_id = ? AND estado = 'sin_escribir' AND pedida_at = ?", o.id, marca);
    throw e;
  }
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------
// Página para escribirla: /tienda/resena/<token>
// ---------------------------------------------------------------------------------------------------------------------

async function porToken(env, token) {
  if (!TOKEN.test(String(token || ''))) return null;
  const hash = await sha256(token);
  const r = await one(env, `SELECT r.*, p.nombre producto, p.slug, p.contenido, p.imagen, o.nombre orden_nombre, o.estado orden_estado
    FROM resenas r JOIN products p ON p.id = r.product_id JOIN orders o ON o.id = r.order_id WHERE r.token_hash = ?`, hash);
  // Solo compradores verificados: la orden tiene que seguir pagada (un reembolso apaga la liga)
  return r && iguales(r.token_hash, hash) && r.orden_estado === 'paid' && r.estado !== 'borrada' ? r : null;
}

const editable = r => r.estado === 'sin_escribir' || r.estado === 'pendiente';
const noValida = () => pagina({ titulo: 'Liga no válida · Vorka México', ruta: '/tienda/', noindex: true, status: 404,
  cuerpo: aviso({ clase: 'alerta', titulo: 'Esta liga no es válida', texto: 'Puede que esté incompleta o que la compra ya no esté activa. Si quieres dejarnos tu opinión, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.',
    extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ir a la tienda ${FLECHA}</a></div>` }) });

const ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z"/></svg>';
const PALABRAS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

function formulario(r, token, { valores = {}, error = '' } = {}) {
  const v = { estrellas: r.estrellas, texto: r.texto || '', nombre: r.nombre_publico || '', ...valores };
  const sugerido = String(r.orden_nombre || '').trim().split(/\s+/)[0] || '';
  const err = k => error && error.campo === k;
  return `<section class="t-sec"><div class="marco t-estrecho">
  <div class="rs-caja">
    <p class="rs-et">Tu opinión</p>
    <h1 class="t-h1 rs-h1">¿Qué te pareció ${esc(r.producto)}?</h1>
    <p class="t-lead">${r.estado === 'pendiente' ? 'Ya recibimos tu reseña y la estamos revisando. Puedes cambiarla mientras tanto.' : 'Toma un minuto. Tu reseña le ayuda a quien está por decidir y a nosotros a mejorar.'}</p>
    <form class="rs-form" method="post" action="/tienda/resena/${token}" novalidate>
      ${error ? `<p class="t-error" role="alert" id="rs-error">${esc(error.texto)}</p>` : ''}
      <fieldset class="rs-estrellas"${err('estrellas') ? ' aria-invalid="true" aria-describedby="rs-error"' : ''}>
        <legend>¿Cuántas estrellas le das? <span class="rs-req">(obligatorio)</span></legend>
        <div class="rs-est-fila">${[1, 2, 3, 4, 5].map(n => `<input type="radio" id="est-${n}" name="estrellas" value="${n}"${Number(v.estrellas) === n ? ' checked' : ''} required><label for="est-${n}" title="${PALABRAS[n]}">${ESTRELLA}<span class="sr">${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${PALABRAS[n]}</span></label>`).join('')}</div>
        <p class="rs-palabra" aria-hidden="true">${v.estrellas ? PALABRAS[Number(v.estrellas)] || '' : 'Elige de 1 a 5'}</p>
      </fieldset>
      <div class="t-campo"><label for="rs-texto">Cuéntanos más <small>(opcional)</small></label>
        <textarea id="rs-texto" name="texto" rows="5" maxlength="${MAX_TEXTO}" aria-describedby="rs-texto-ayuda"${err('texto') ? ' aria-invalid="true"' : ''} placeholder="¿Qué te sirvió? ¿Qué mejorarías?">${esc(v.texto)}</textarea>
        <small class="t-ayuda" id="rs-texto-ayuda">Hasta ${MAX_TEXTO} caracteres. No incluyas teléfonos, correos ni datos de otras personas.</small></div>
      <div class="t-campo"><label for="rs-nombre">¿Con qué nombre quieres aparecer?</label>
        <input id="rs-nombre" name="nombre" type="text" required minlength="${MIN_NOMBRE}" maxlength="${MAX_NOMBRE}" autocomplete="nickname" value="${esc(v.nombre)}" placeholder="${esc(sugerido ? `${sugerido}, Celaya` : 'Mariana, Celaya')}" aria-describedby="rs-nombre-ayuda"${err('nombre') ? ' aria-invalid="true"' : ''}>
        <small class="t-ayuda" id="rs-nombre-ayuda">Por ejemplo, tu nombre y tu ciudad: «Mariana, Celaya». Tu correo nunca se publica.</small></div>
      <p class="rs-legal">Al enviarla aceptas que tu reseña y el nombre que escribiste se publiquen en la página del producto en vorka.mx, después de que la revisemos. Puedes pedir que la borremos cuando quieras escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Más en el <a href="/privacidad/#resenas" target="_blank">aviso de privacidad</a>.</p>
      <button class="btn acento" type="submit">${r.estado === 'pendiente' ? 'Guardar cambios' : 'Enviar mi reseña'} ${FLECHA}</button>
    </form>
  </div>
</div></section>`;
}

const SCRIPT_ESTRELLAS = `(function(){ var f=document.querySelector('.rs-estrellas'); if(!f) return; var p=f.querySelector('.rs-palabra'), w=${JSON.stringify(PALABRAS)};
  f.addEventListener('change',function(e){ if(e.target.name==='estrellas'&&p) p.textContent=w[+e.target.value]||''; }); })();`;

const paginaResena = (r, cuerpo, status = 200) => pagina({ titulo: `Tu reseña de ${r.producto} · Vorka México`, ruta: '/tienda/', noindex: true, status, cuerpo, script: SCRIPT_ESTRELLAS,
  headers: { 'referrer-policy': 'no-referrer' } });

function gracias(r, { recien = false } = {}) {
  const ruta = rutaProducto(r);
  const titulo = r.estado === 'aprobada' ? '¡Gracias! Tu reseña ya está publicada' : r.estado === 'oculta' ? 'Gracias por tu reseña' : recien ? '¡Gracias por tu reseña!' : 'Ya recibimos tu reseña';
  const texto = r.estado === 'aprobada' ? 'Ya se ve en la página del producto. Si quieres cambiarla o que la borremos, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.'
    : r.estado === 'oculta' ? 'La leímos con atención. Si quieres cambiarla o que la borremos, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.'
    : 'La revisamos y, en cuanto la aprobemos, se publica en la página del producto. Mientras tanto puedes cambiarla con esta misma liga.';
  return aviso({ icono: CHECK, clase: 'exito', titulo, texto,
    extra: `<div class="botones t-centro">${editable(r) ? `<a class="btn blanco" href="/tienda/resena/${esc(r._token)}?editar=1">Cambiar mi reseña</a>` : ''}<a class="btn tinta" href="${esc(ruta)}">Ver el producto ${FLECHA}</a></div>` });
}

// GET /tienda/resena/<token>
export async function paginaResenaGet(env, token, url) {
  const r = await porToken(env, token);
  if (!r) return noValida();
  r._token = token;
  if (!editable(r) || (r.estado === 'pendiente' && !url.searchParams.has('editar'))) return paginaResena(r, gracias(r, { recien: url.searchParams.has('gracias') }));
  return paginaResena(r, formulario(r, token));
}

// Texto limpio: sin caracteres de control (deja saltos de línea), sin espacios de sobra y sin más de una línea en blanco
const limpiar = (s, max) => String(s ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(/(?!\n)[\p{Cc}‪-‮⁦-⁩]/gu, '').replace(/ +/g, ' ')
  .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max + 1);

export function validarResena(d) {
  const estrellas = Number(d.estrellas);
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return { error: { campo: 'estrellas', texto: 'Elige de 1 a 5 estrellas.' } };
  const texto = limpiar(d.texto, MAX_TEXTO);
  if (texto.length > MAX_TEXTO) return { error: { campo: 'texto', texto: `Tu reseña puede tener hasta ${MAX_TEXTO} caracteres.` } };
  const nombre = limpiar(d.nombre, MAX_NOMBRE).replace(/\n/g, ' ');
  if (nombre.length < MIN_NOMBRE) return { error: { campo: 'nombre', texto: 'Escribe con qué nombre quieres aparecer.' } };
  if (nombre.length > MAX_NOMBRE) return { error: { campo: 'nombre', texto: `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.` } };
  if (/@|https?:|www\./i.test(nombre)) return { error: { campo: 'nombre', texto: 'Escribe solo un nombre (sin correos ni ligas).' } };
  return { estrellas, texto: texto || null, nombre };
}

// POST /tienda/resena/<token> (formulario normal: funciona sin JavaScript)
export async function paginaResenaPost(request, env, token) {
  const r = await porToken(env, token);
  if (!r) return noValida();
  r._token = token;
  if (!(await dentroDelLimite(env, `resena:${r.token_hash.slice(0, 24)}`, 20, 3600)))
    return paginaResena(r, aviso({ clase: 'alerta', titulo: 'Demasiados intentos', texto: 'Espera un rato y vuelve a intentarlo.' }), 429);
  if (!editable(r)) return paginaResena(r, gracias(r));
  let datos = {};
  try { datos = Object.fromEntries(await request.formData()); } catch { /* cuerpo vacío o roto: lo atrapa la validación */ }
  const v = validarResena(datos);
  if (v.error) return paginaResena(r, formulario(r, token, { valores: { estrellas: datos.estrellas, texto: String(datos.texto || '').slice(0, MAX_TEXTO), nombre: String(datos.nombre || '').slice(0, MAX_NOMBRE) }, error: v.error }), 422);
  const ahora = ahoraISO();
  const u = await run(env, `UPDATE resenas SET estrellas = ?, texto = ?, nombre_publico = ?, estado = 'pendiente', escrita_at = COALESCE(escrita_at, ?), actualizada_at = ?
    WHERE id = ? AND estado IN ('sin_escribir', 'pendiente')`, v.estrellas, v.texto, v.nombre, ahora, ahora, r.id);
  if (!u.meta.changes) return paginaResena({ ...r, estado: (await one(env, 'SELECT estado FROM resenas WHERE id = ?', r.id))?.estado || r.estado }, gracias(r));
  return new Response(null, { status: 303, headers: { location: `/tienda/resena/${token}?gracias=1`, 'cache-control': 'no-store' } });
}

// /tienda/resena/<token>/baja: GET pide confirmar (los revisores de correo abren ligas solos), POST da de baja
export async function bajaResenas(request, env, token) {
  const r = await porToken(env, token);
  if (!r) return noValida();
  r._token = token;
  if (request.method === 'POST') {
    await run(env, 'INSERT OR IGNORE INTO resenas_bajas (email) VALUES (?)', r.email);
    return paginaResena(r, aviso({ icono: CHECK, clase: 'exito', titulo: 'Listo, ya no te pediremos reseñas', texto: 'No te volveremos a escribir para pedirte tu opinión. Tus compras y sus correos de entrega siguen igual.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ir a la tienda ${FLECHA}</a></div>` }));
  }
  return paginaResena(r, aviso({ titulo: '¿Dejamos de pedirte reseñas?', texto: 'Si confirmas, no te volveremos a escribir para pedirte tu opinión sobre tus compras.',
    extra: `<form method="post" action="/tienda/resena/${token}/baja" class="botones t-centro"><button class="btn tinta" type="submit">Sí, ya no me pidan reseñas</button>${editable(r) ? `<a class="btn blanco" href="/tienda/resena/${token}">Mejor dejo mi reseña</a>` : ''}</form>` }));
}

// ---------------------------------------------------------------------------------------------------------------------
// Publicarlas: página del producto y JSON-LD
// ---------------------------------------------------------------------------------------------------------------------

const PUBLICADA = "r.estado = 'aprobada' AND o.estado = 'paid'";

/**
 * Reseñas aprobadas que se ven en una página: las de todos los productos cuya página es `ruta` (p. ej. los planes de
 * /simulador-paa/ o de /tienda/agenda/). null si no hay ninguna.
 */
export async function resenasDe(env, ruta, { ultimas = ULTIMAS } = {}) {
  const de = `${PUBLICADA} AND r.product_id IN (SELECT p.id FROM products p WHERE COALESCE(json_extract(p.contenido, '$.acceso.ruta'), '/tienda/' || p.slug || '/') = ?)`;
  try {
    const res = await one(env, `SELECT COUNT(*) total, AVG(r.estrellas) promedio FROM resenas r JOIN orders o ON o.id = r.order_id WHERE ${de}`, ruta);
    if (!res?.total) return null;
    const filas = await all(env, `SELECT r.nombre_publico nombre, r.estrellas, r.texto, r.escrita_at fecha FROM resenas r JOIN orders o ON o.id = r.order_id
      WHERE ${de} ORDER BY r.escrita_at DESC, r.id DESC LIMIT ?`, ruta, ultimas);
    return { total: res.total, promedio: Math.round(res.promedio * 10) / 10, ultimas: filas };
  } catch (e) { console.error('resenas', ruta, e?.message); return null; }   // sin reseñas antes que sin página
}

const dia = iso => String(iso || '').slice(0, 10);
const FECHA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
const fechaLarga = iso => { const t = Date.parse(iso); return Number.isFinite(t) ? FECHA.format(t) : ''; };
const decimal = n => n.toFixed(1).replace(/\.0$/, '');

/** Campos para el Product del JSON-LD: aggregateRating y review (solo con reseñas aprobadas; si no hay, nada). */
export function ldResenas(rs) {
  if (!rs?.total) return {};
  return {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: rs.promedio, reviewCount: rs.total, bestRating: 5, worstRating: 1 },
    review: rs.ultimas.slice(0, 5).map(x => ({ '@type': 'Review', author: { '@type': 'Person', name: x.nombre }, datePublished: dia(x.fecha),
      reviewRating: { '@type': 'Rating', ratingValue: x.estrellas, bestRating: 5, worstRating: 1 }, ...(x.texto ? { reviewBody: x.texto } : {}) })),
  };
}

const estrellasHtml = (n, clase = '') => `<span class="rs-ver ${clase}" role="img" aria-label="${decimal(n)} de 5 estrellas">${[1, 2, 3, 4, 5].map(i =>
  `<i class="${n >= i - .25 ? 'llena' : n >= i - .75 ? 'media' : ''}">${ESTRELLA}</i>`).join('')}</span>`;

/** Sección «Lo que dicen quienes lo compraron» para la página del producto. Sin reseñas aprobadas, nada. */
export function seccionResenas(rs, { titulo = 'Lo que dicen quienes lo compraron' } = {}) {
  if (!rs?.total) return '';
  return `<section class="t-sec rs-sec" id="resenas" aria-labelledby="rs-titulo"><div class="marco">
  <div class="rs-cab">
    <div><span class="etiqueta">Reseñas de compradores</span><h2 class="h2" id="rs-titulo">${esc(titulo)}</h2></div>
    <div class="rs-resumen"><b class="num">${decimal(rs.promedio)}</b>${estrellasHtml(rs.promedio, 'grande')}<small>${rs.total === 1 ? '1 reseña' : `${rs.total} reseñas`} de compras verificadas</small></div>
  </div>
  <ul class="rs-lista">${rs.ultimas.map(x => `<li class="rs-item">
    ${estrellasHtml(x.estrellas)}
    ${x.texto ? `<p class="rs-texto">${esc(x.texto).replace(/\n/g, '<br>')}</p>` : ''}
    <p class="rs-quien"><b>${esc(x.nombre)}</b><span>Compra verificada · <time datetime="${esc(dia(x.fecha))}">${esc(fechaLarga(x.fecha))}</time></span></p>
  </li>`).join('')}</ul>
</div></section>`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Moderación (Vorka OS › Tienda › Reseñas)
// ---------------------------------------------------------------------------------------------------------------------

const ESTADOS_PANEL = ['pendiente', 'aprobada', 'oculta'];

export async function resenasPanel(env, { estado = 'pendiente', pagina = 0 } = {}) {
  const e = ESTADOS_PANEL.includes(estado) ? estado : 'pendiente';
  const pag = Math.max(0, Math.min(500, parseInt(pagina, 10) || 0));
  const conteo = Object.fromEntries(ESTADOS_PANEL.map(k => [k, 0]));
  for (const f of await all(env, `SELECT estado, COUNT(*) n FROM resenas WHERE estado IN ('pendiente', 'aprobada', 'oculta') GROUP BY estado`)) conteo[f.estado] = f.n;
  const filas = await all(env, `SELECT r.id, r.order_id, r.product_id, r.email, r.estrellas, r.texto, r.nombre_publico, r.estado, r.escrita_at, r.actualizada_at,
      r.decidida_at, r.decidida_por, p.nombre producto, p.slug, p.contenido, o.estado orden_estado
    FROM resenas r JOIN products p ON p.id = r.product_id JOIN orders o ON o.id = r.order_id
    WHERE r.estado = ? ORDER BY ${e === 'pendiente' ? 'r.escrita_at ASC' : 'COALESCE(r.decidida_at, r.escrita_at) DESC'}, r.id LIMIT 50 OFFSET ?`, e, pag * 50);
  return {
    estado: e, pagina: pag, conteo,
    resenas: filas.map(({ contenido, email, slug, ...r }) => ({ ...r, email: correoOculto(email), url: SITIO + rutaProducto({ contenido, slug }),
      // Si la orden se reembolsó, aunque esté aprobada no se publica
      publicable: r.orden_estado === 'paid' })),
  };
}

export async function decidirResena(env, id, { estado, por } = {}) {
  if (!['aprobada', 'oculta'].includes(estado)) throw new Error('Elige aprobar u ocultar.');
  const quien = String(por || '').trim().slice(0, 254);
  if (!quien) throw new Error('Falta quién del equipo decide.');
  const r = await run(env, `UPDATE resenas SET estado = ?, decidida_at = ?, decidida_por = ? WHERE id = ? AND estado IN ('pendiente', 'aprobada', 'oculta')`,
    estado, ahoraISO(), quien, Number(id));
  if (!r.meta.changes) throw new Error('Esa reseña no existe o todavía no la escriben.');
  return { ok: true, id: Number(id), estado };
}

export async function resenasPorAprobar(env) {
  return (await one(env, "SELECT COUNT(*) n FROM resenas WHERE estado = 'pendiente'"))?.n || 0;
}

// ---------------------------------------------------------------------------------------------------------------------
// ARCO: las reseñas de un correo (las usa la búsqueda y el borrado por correo de cupones-regalo.js)
// ---------------------------------------------------------------------------------------------------------------------

export async function buscarResenasCorreo(env, email) {
  return all(env, `SELECT r.id, r.estado, r.escrita_at, p.nombre producto FROM resenas r JOIN products p ON p.id = r.product_id
    WHERE r.email = ? AND r.estado != 'borrada' ORDER BY r.id`, String(email || '').trim().toLowerCase());
}

// Deja sin datos las reseñas de un correo: estrellas, texto, nombre público y correo. Sale de la página al momento. Se queda
// el renglón (orden y producto, sin nada que identifique) para no volver a pedir la reseña de esa orden, y quién y cuándo.
// La baja de estos correos (resenas_bajas), si la pidió, se conserva para no volver a escribirle.
export async function borrarResenasCorreo(env, email, por) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return 0;
  const r = await run(env, `UPDATE resenas SET estrellas = NULL, texto = NULL, nombre_publico = NULL, email = '', estado = 'borrada',
      token_hash = 'borrada:' || id, borrada_at = ?, borrada_por = ? WHERE email = ? AND estado != 'borrada'`, ahoraISO(), String(por).slice(0, 254), e);
  return r.meta.changes;
}
