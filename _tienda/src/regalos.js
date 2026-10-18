// Regalos: comprar un producto de acceso (Simulador PAA) para otra persona.
//
// Compra con regalo = 1 → al pagarse, quien compra recibe UNA LIGA POR UNIDAD (/tienda/regalo/<token>).
// Cada liga se puede usar una sola vez: quien la abre escribe su nombre y correo, se crea una orden de $0
// a su nombre (proveedor 'regalo', regalo_de = compra original), recibe su propio acceso por correo
// y la liga deja de funcionar. Así no se puede compartir: la cuenta queda ligada al correo de quien la canjeó.
//
// /tienda/regalo/<token>      → página para abrir el regalo
// /api/regalo/canjear         → POST { token, nombre, email, terminos }
import { z } from 'zod';
import { one, all, run, json, fail, aleatorio, ahoraISO, sha256, correoOculto } from './util.js';
import { hashToken, mandarEnlace } from './entrega.js';
import { marco, boton, enviar, esc, P, SOPORTE } from './correo.js';
import { pagina, aviso } from './paginas.js';
import { dentroDelLimite } from './modelo.js';
import { cookieAcceso, ordenConAcceso } from './simulador/index.js';
import { FLECHA, LOGO } from './marco.generado.js';

const FORMATO = /^[a-f0-9]{64}$/;
const SIN_REFERER = { 'referrer-policy': 'no-referrer' };
const hashRegalo = (env, token) => hashToken(env, `regalo|${token}`);
const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || '';

// Unidades regalables de una compra (productos con contenido.regalable)
async function unidades(env, orderId) {
  const items = await all(env, 'SELECT i.product_id, i.nombre, i.cantidad, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', orderId);
  return items.filter(i => { try { return JSON.parse(i.contenido || '{}').regalable; } catch { return false; } });
}

/**
 * Crea ligas nuevas para las unidades que aún no se canjean y se las manda a quien compró.
 * Si ya había ligas pendientes (reenvío), se revocan DESPUÉS de mandar el correo con las nuevas,
 * para que nunca circulen dos ligas válidas para el mismo regalo.
 */
export async function mandarRegalos(env, orden) {
  const items = await unidades(env, orden.id);
  const canjeadas = (await one(env, "SELECT COUNT(*) n FROM regalos WHERE order_id = ? AND estado = 'canjeado'", orden.id)).n;
  const anteriores = await all(env, "SELECT id FROM regalos WHERE order_id = ? AND estado = 'pendiente'", orden.id);
  const ligas = [];
  let porSaltar = canjeadas;
  for (const it of items) for (let k = 0; k < (it.cantidad || 1); k++) {
    if (porSaltar > 0) { porSaltar--; continue; }
    const token = aleatorio(32);
    await run(env, 'INSERT INTO regalos (order_id, product_id, token_hash) VALUES (?,?,?)', orden.id, it.product_id, await hashRegalo(env, token));
    ligas.push({ token, producto: it.nombre, url: `${env.SITE_URL}/tienda/regalo/${token}` });
  }
  if (!ligas.length) return; // todo canjeado: no hay nada que reenviar
  const nuevos = ligas.length;
  try {
    await enviar(env, { para: orden.email, ...correoRegalos(env, orden, ligas, canjeadas), idempotencia: `regalo-${(await sha256(ligas[0].token)).slice(0, 32)}` });
  } catch (e) {
    await run(env, `DELETE FROM regalos WHERE id IN (SELECT id FROM regalos WHERE order_id = ? AND estado = 'pendiente' ORDER BY id DESC LIMIT ?)`, orden.id, nuevos);
    console.error('regalos: correo falló', orden.id, correoOculto(orden.email), e.message);
    throw e;
  }
  if (anteriores.length) await run(env, `UPDATE regalos SET estado = 'revocado' WHERE id IN (${anteriores.map(() => '?').join(',')})`, ...anteriores.map(a => a.id));
}

export function correoRegalos(env, orden, ligas, canjeadas = 0) {
  const nombre = primerNombre(orden.nombre);
  const varias = ligas.length > 1;
  const producto = ligas[0].producto;
  const asunto = varias ? `Tus ${ligas.length} regalos: ${producto}` : `Tu regalo está listo: ${producto}`;
  const whats = url => `https://wa.me/?text=${encodeURIComponent(`Te regalé el ${producto} de Vorka México 🎁 Ábrelo aquí (solo funciona una vez): ${url}`)}`;
  const bloques = ligas.map((l, i) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #e7e5e7;border-radius:16px"><tr><td style="padding:16px 18px">
  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#6b2a85">${varias ? `Regalo ${i + 1} de ${ligas.length}` : 'Tu liga de regalo'}</p>
  <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#6d696e;word-break:break-all"><a href="${esc(l.url)}" style="color:#141114">${esc(l.url)}</a></p>
  <a href="${esc(whats(l.url))}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#141114;color:#fff;font-size:14px;font-weight:650;text-decoration:none">Enviar por WhatsApp</a>
</td></tr></table>`).join('');
  const html = marco(asunto, `
<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">¡Gracias por regalar el <b>${esc(producto)}</b>! ${varias ? `Aquí están tus ${ligas.length} ligas de regalo: manda <b>una liga a cada persona</b>.` : 'Aquí está tu liga de regalo: mándasela a quien se la quieras regalar.'}</p>
${bloques}
<p style="${P}"><b>Importante:</b> cada liga funciona <b>una sola vez</b>. Quien la abra escribe su nombre y su correo, y el acceso queda a su nombre durante un año. Después, la liga deja de funcionar, así que nadie más puede usarla.</p>
${canjeadas ? `<p style="${P}">${canjeadas === 1 ? 'Una liga ya se canjeó' : `${canjeadas} ligas ya se canjearon`} y sigue${canjeadas === 1 ? '' : 'n'} funcionando para quien la${canjeadas === 1 ? '' : 's'} abrió. Las ligas de este correo reemplazan a las anteriores que no se habían usado.</p>` : ''}
<p style="${P}">¿Perdiste este correo? Pide uno nuevo en <a href="${env.SITE_URL}/descargas/reenviar" style="color:#6b2a85;text-decoration:underline">vorka.mx/descargas/reenviar</a> con el correo de tu compra. ¿Dudas? Escríbenos a <a href="mailto:${SOPORTE.correo}" style="color:#6b2a85;text-decoration:underline">${SOPORTE.correo}</a>.</p>
<p style="${P};color:#8b8790;font-size:13px">Orden ${esc(orden.id)}</p>`);
  const texto = `Hola, ${nombre}:

¡Gracias por regalar el ${producto}! ${varias ? `Manda una liga a cada persona:` : 'Esta es tu liga de regalo:'}

${ligas.map((l, i) => `${varias ? `Regalo ${i + 1}: ` : ''}${l.url}`).join('\n')}

Cada liga funciona una sola vez: quien la abra escribe su nombre y su correo, y el acceso queda a su nombre durante un año.

¿Perdiste este correo? Pide uno nuevo en ${env.SITE_URL}/descargas/reenviar

Orden ${orden.id}
Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// Un reembolso de la compra de regalo apaga las ligas que no se habían usado
export async function revocarRegalos(env, orderId) {
  await run(env, "UPDATE regalos SET estado = 'revocado' WHERE order_id = ? AND estado = 'pendiente'", orderId);
}

async function leerRegalo(env, token) {
  if (!FORMATO.test(token || '')) return null;
  return one(env, `SELECT r.*, o.nombre de_nombre, o.proveedor, o.regalo_para, o.regalo_mensaje, o.estado orden_estado, p.nombre producto, p.contenido, p.descripcion_corta
    FROM regalos r JOIN orders o ON o.id = r.order_id JOIN products p ON p.id = r.product_id WHERE r.token_hash = ?`, await hashRegalo(env, token));
}

// Qué es el producto, en una frase, y lo que incluye (para la tarjeta del regalo)
function describir(r, acceso) {
  let c = {}; try { c = JSON.parse(r.contenido || '{}'); } catch { }
  if (acceso.app === 'simulador' || /simulador/i.test(r.producto)) return { texto: 'simulacros con cronómetro, un tutor que te guía cuando fallas y un reporte de qué reforzar.', chips: ['2 simulacros completos', 'Práctica ilimitada', 'Acceso por un año'] };
  if (acceso.app === 'brindi') return { texto: 'una invitación digital con confirmaciones de asistencia y acceso con QR para tu evento.', chips: [acceso.detalle || 'Un evento', 'Se comparte por WhatsApp', 'Confirmaciones y QR'].filter(Boolean) };
  return { texto: r.descripcion_corta || '', chips: acceso.app ? [] : ['Descarga inmediata', 'Queda a tu nombre'] };
}
// Para qué es el enlace que le llega por correo
const entrada = r => { try { const a = JSON.parse(r.contenido || '{}').acceso || {}; return a.app === 'brindi' ? 'crear tu invitación' : a.app ? 'entrar' : 'descargar tus archivos'; } catch { return 'entrar'; } };

// Desde el panel se puede regalar cualquier producto, salvo los complementos que solo suman a otra compra (simulacros adicionales)
export const regalableCortesia = p => { try { return JSON.parse(p.contenido || '{}').acceso?.tipo !== 'intento'; } catch { return true; } };

// Quitar una cortesía enviada directo: la persona pierde el acceso (sus enlaces de descarga dejan de funcionar
// y, en Brindi, el plan se retira en la siguiente sincronización, igual que con un reembolso)
export async function quitarCortesia(env, orderId) {
  const r = await run(env, "UPDATE orders SET estado = 'refunded', updated_at = ? WHERE id = ? AND proveedor = 'cortesia' AND regalo = 0 AND estado = 'paid'", ahoraISO(), String(orderId));
  if (!r.meta.changes) throw new Error('Ese regalo ya no estaba activo.');
  await run(env, 'UPDATE download_tokens SET revocado = 1 WHERE order_id = ?', String(orderId));
  return { ok: true, revocadas: 1 };
}

// ---------- página para abrir el regalo ----------
export async function paginaRegalo(env, token) {
  const r = await leerRegalo(env, token);
  const error = (titulo, texto, extra = '') => pagina({ titulo: `${titulo} · Vorka México`, ruta: '/tienda/regalo/', noindex: true, status: 410, headers: SIN_REFERER,
    cuerpo: aviso({ clase: 'alerta', titulo, texto, extra }) });
  if (!r) return error('Esta liga no es válida', 'Revisa que hayas abierto la liga completa. Si te la mandaron por WhatsApp, pide que te la reenvíen.');
  if (r.estado === 'canjeado') return error('Este regalo ya se abrió', 'Cada liga de regalo funciona una sola vez y esta ya se usó. Si fuiste tú, entra con el correo que recibiste o pide un enlace nuevo.',
    `<div class="botones t-centro"><a class="btn tinta" href="/descargas/reenviar">Recibir mi enlace ${FLECHA}</a><a class="btn blanco" href="/tienda/">Ver la tienda</a></div>`);
  if (r.estado === 'revocado' || r.orden_estado !== 'paid') return error('Este regalo ya no está activo', 'Esta liga fue reemplazada o cancelada. Pide a quien te la regaló que te comparta la liga nueva.');
  const acceso = (() => { try { return JSON.parse(r.contenido || '{}').acceso || {}; } catch { return {}; } })();
  const de = r.proveedor === 'cortesia' ? 'Vorka México' : primerNombre(r.de_nombre);
  const para = primerNombre(r.regalo_para);
  const { texto: queEs, chips } = describir(r, acceso);
  return pagina({
    titulo: `Tienes un regalo: ${r.producto} · Vorka México`, ruta: '/tienda/regalo/', noindex: true, headers: SIN_REFERER,
    head: `<style>
.rg{padding:clamp(110px,13vw,150px) 0 80px}
.rg-g{display:grid;gap:28px;align-items:start;max-width:980px;margin:0 auto}
@media(min-width:900px){.rg-g{grid-template-columns:1fr 1fr}}
.rg-tarjeta{position:relative;overflow:hidden;border-radius:28px;background:var(--noche);color:var(--claro);padding:34px 30px 30px;box-shadow:var(--sombra-2);min-height:360px;display:flex;flex-direction:column}
.rg-tarjeta .rg-v{position:absolute;right:-60px;bottom:-80px;width:340px;color:#fff;opacity:.06}
.rg-tarjeta .rg-v svg{width:100%;height:auto}
.rg-moño{font-size:44px;line-height:1}
.rg-tarjeta h1{font-size:clamp(30px,4vw,40px);font-weight:750;letter-spacing:-.04em;line-height:1.05;margin:18px 0 10px;color:#fff}
.rg-tarjeta h1 span{color:var(--oro-claro)}
.rg-tarjeta p{color:var(--claro-2);font-size:16px}
.rg-msj{margin-top:18px;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:16px;line-height:1.55;color:var(--claro);white-space:pre-line}
.rg-msj small{display:block;margin-top:8px;color:var(--claro-3);font-size:13px}
.rg-inc{margin-top:auto;padding-top:22px;display:flex;flex-wrap:wrap;gap:8px}
.rg-inc span{font-size:13px;font-weight:650;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.rg-form{background:var(--card);border:1px solid var(--line);border-radius:28px;padding:28px;box-shadow:var(--sombra)}
.rg-form h2{font-size:22px;letter-spacing:-.03em;margin-bottom:6px}
.rg-form > p{color:var(--fg-2);font-size:15px;margin-bottom:18px}
.rg-aviso{display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding:12px 14px;border-radius:14px;background:var(--bg-2);font-size:13.5px;color:var(--fg-2)}
.rg-aviso b{color:var(--fg)}
</style>`,
    script: `(function(){
  var f=document.getElementById('form-regalo'); if(!f) return;
  var err=document.getElementById('error-regalo'), btn=document.getElementById('btn-regalo'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={token:f.token.value,nombre:f.nombre.value.trim(),email:f.email.value.trim(),terminos:f.terminos.checked};
    if(d.nombre.length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido: ahí te llega tu acceso.'); }
    if(!d.terminos) return mostrar('Acepta los términos y el aviso de privacidad para abrir tu regalo.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo tu regalo…';
    fetch('/api/regalo/canjear',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d),credentials:'same-origin'})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url){ location.href=x.j.url; } else if(x.ok){ f.innerHTML='<h2>¡Listo! Tu regalo ya es tuyo</h2><p>'+(x.j.mensaje||'Te enviamos tu acceso por correo.')+'</p>'; } else mostrar(x.j.error||'No pudimos abrir tu regalo. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`,
    cuerpo: `
<section class="rg"><div class="marco"><div class="rg-g">
  <div class="rg-tarjeta">
    <span class="rg-v" aria-hidden="true">${LOGO}</span>
    <span class="rg-moño" aria-hidden="true">🎁</span>
    <h1>${para ? `${esc(para)}, tienes` : 'Tienes'} un regalo${de ? ` de <span>${esc(de)}</span>` : ''}</h1>
    <p>Te regalaron <b style="color:#fff">${esc(r.producto)}</b> de Vorka México${queEs ? `: ${esc(queEs)}` : '.'}</p>
    ${r.regalo_mensaje ? `<div class="rg-msj">${esc(r.regalo_mensaje)}${de ? `<small>— ${esc(de)}</small>` : ''}</div>` : ''}
    ${chips.length ? `<div class="rg-inc">${chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
  </div>
  <form class="rg-form t-form" id="form-regalo" method="post" action="/api/regalo/canjear" novalidate>
    <h2>Abre tu regalo</h2>
    <p>Escribe tus datos: el acceso queda a tu nombre y te mandamos el enlace para entrar desde cualquier dispositivo.</p>
    <input type="hidden" name="token" value="${esc(token)}">
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"${para ? ` value="${esc(r.regalo_para)}"` : ''}></div>
    <div class="t-campo"><label for="email">Tu correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega tu acceso. Úsalo también para entrar después.</small></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="error-regalo" role="alert" hidden></p>
    <button class="btn tinta" type="submit" id="btn-regalo">Abrir mi regalo ${FLECHA}</button>
    <div class="rg-aviso"><span aria-hidden="true">🔒</span><span><b>Esta liga funciona una sola vez.</b> Al abrirla, el regalo queda ligado a tu correo y nadie más puede usarla.</span></div>
  </form>
</div></div></section>`,
  });
}

// ---------- canje ----------
const EsquemaCanje = z.object({
  token: z.string().regex(FORMATO, 'Liga no válida.'),
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  terminos: z.preprocess(v => v === true || v === 'on' || v === 'true', z.literal(true, { error: 'Acepta los términos y el aviso de privacidad.' })),
});

export async function canjearRegalo(req, env) {
  const tipo = req.headers.get('content-type') || '';
  const datos = tipo.includes('application/json') ? await req.json().catch(() => ({})) : Object.fromEntries(await req.formData());
  const v = EsquemaCanje.safeParse(datos);
  if (!v.success) return fail(v.error.issues[0].message);
  const d = v.data;
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `regalo:ip:${await sha256(ip)}`, 10, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);

  const r = await leerRegalo(env, d.token);
  if (!r) return fail('Esta liga no es válida.', 404);
  if (r.orden_estado !== 'paid') return fail('Este regalo ya no está activo.', 410);

  // Canje atómico: si dos personas abren la liga a la vez, solo una gana
  const ahora = ahoraISO();
  const t = await run(env, "UPDATE regalos SET estado = 'canjeado', canjeado_email = ?, canjeado_at = ? WHERE id = ? AND estado = 'pendiente'", d.email, ahora, r.id);
  if (!t.meta.changes) return fail(r.estado === 'canjeado' ? 'Este regalo ya se abrió: cada liga funciona una sola vez.' : 'Este regalo ya no está activo.', 410);

  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, estado, proveedor, regalo_de, paid_at) VALUES (?,?,?,0,'MXN','paid','regalo',?,?)`)
      .bind(id, d.email, d.nombre, r.order_id, ahora),
    env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad) VALUES (?,?,?,0,1)').bind(id, r.product_id, r.producto),
    env.DB.prepare('UPDATE regalos SET canje_order_id = ? WHERE id = ?').bind(id, r.id),
  ]);
  // Correo con su propio acceso (si falla, igual entra ahora y puede pedirlo en /descargas/reenviar)
  try {
    await mandarEnlace(env, id);
    await run(env, 'UPDATE orders SET correo_enviado_at = ? WHERE id = ?', ahoraISO(), id);
  } catch (e) { console.error('regalo: correo de acceso falló', id, e.message); }

  // Simulador: entra en este momento con su cookie. Lo demás (descargas, Brindi) llega por correo.
  const acceso = await ordenConAcceso(env, id);
  if (!acceso) return json({ ok: true, mensaje: `Te enviamos a <b>${esc(correoOculto(d.email))}</b> el enlace para ${esc(entrada(r))}. Revisa también tu carpeta de spam.` });
  const destino = (() => { try { return JSON.parse(r.contenido || '{}').acceso?.ruta || '/'; } catch { return '/'; } })();
  return json({ ok: true, url: destino }, 200, { 'set-cookie': await cookieAcceso(env, id, acceso.vence) });
}

// ---------- cortesías: accesos gratis que regala Vorka México desde el panel ----------
// Se crea una "compra" de $0 (proveedor 'cortesia', regalo = 1) a nombre de Vorka México con N ligas de un solo uso.
// Las ligas se devuelven al panel para copiarlas o mandarlas por WhatsApp; nadie recibe correo hasta que alguien canjea.
const EsquemaCortesia = z.object({
  product_id: z.string().max(80),
  cantidad: z.coerce.number().int().min(1, 'Elige cuántos accesos.').max(100, 'Máximo 100 por tanda.'),
  para: z.string().trim().max(80).optional().or(z.literal('')),
  mensaje: z.string().trim().max(280, 'El mensaje puede tener hasta 280 caracteres.').optional().or(z.literal('')),
  nota: z.string().trim().max(200).optional().or(z.literal('')),   // interna: para qué o para quién fue la tanda
  modo: z.enum(['ligas', 'correo']).optional(),                   // ligas de un solo uso (por defecto) o directo al correo de la persona
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)).optional().or(z.literal('')),
  nombre: z.string().trim().max(120).optional().or(z.literal('')),
});

export async function crearCortesias(env, datos) {
  const v = EsquemaCortesia.safeParse(datos);
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  const p = await one(env, 'SELECT id, nombre, contenido FROM products WHERE id = ?', d.product_id);
  if (!p) throw new Error('Ese producto no existe.');
  if (!regalableCortesia(p)) throw new Error('Este producto no se puede regalar: es un complemento de otra compra.');
  const id = crypto.randomUUID(), ahora = ahoraISO();
  if (d.modo === 'correo') {
    if (!d.email) throw new Error('Escribe el correo de quien recibe el regalo.');
    if (!d.nombre || d.nombre.length < 2) throw new Error('Escribe el nombre de quien recibe el regalo.');
    // Una "compra" de $0 a nombre de la persona: recibe su acceso o sus descargas igual que si hubiera pagado
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, estado, proveedor, regalo, regalo_para, regalo_mensaje, paid_at, metodo_pago)
        VALUES (?, ?, ?, 0, 'MXN', 'paid', 'cortesia', 0, ?, ?, ?, ?)`)
        .bind(id, d.email, d.nombre, d.nombre, d.mensaje || null, ahora, d.nota ? `cortesía: ${d.nota}` : 'cortesía'),
      env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad) VALUES (?,?,?,0,?)').bind(id, p.id, p.nombre, d.cantidad),
    ]);
    let enviado = true;
    try { await mandarEnlace(env, id); await run(env, 'UPDATE orders SET correo_enviado_at = ? WHERE id = ?', ahoraISO(), id); }
    catch (e) { enviado = false; console.error('cortesía: correo falló', id, e.message); }
    return { id, producto: p.nombre, directo: true, email: d.email, enviado };
  }
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, estado, proveedor, regalo, regalo_para, regalo_mensaje, paid_at, correo_enviado_at, metodo_pago)
      VALUES (?, ?, 'Vorka México', 0, 'MXN', 'paid', 'cortesia', 1, ?, ?, ?, ?, ?)`)
      .bind(id, SOPORTE.correo, d.para || null, d.mensaje || null, ahora, ahora, d.nota ? `cortesía: ${d.nota}` : 'cortesía'),
    env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad) VALUES (?,?,?,0,?)').bind(id, p.id, p.nombre, d.cantidad),
  ]);
  const ligas = [];
  for (let k = 0; k < d.cantidad; k++) {
    const token = aleatorio(32);
    await run(env, 'INSERT INTO regalos (order_id, product_id, token_hash) VALUES (?,?,?)', id, p.id, await hashRegalo(env, token));
    ligas.push(`${env.SITE_URL}/tienda/regalo/${token}`);
  }
  return { id, producto: p.nombre, ligas };
}

// Tandas de cortesías con su avance (las ligas en claro solo se ven al crearlas)
export async function cortesias(env) {
  const filas = await all(env, `SELECT o.id, o.created_at, o.regalo_para para, o.metodo_pago nota, i.nombre producto, i.cantidad,
      (SELECT COUNT(*) FROM regalos r WHERE r.order_id = o.id AND r.estado = 'canjeado') canjeadas,
      (SELECT COUNT(*) FROM regalos r WHERE r.order_id = o.id AND r.estado = 'pendiente') pendientes,
      (SELECT GROUP_CONCAT(r.canjeado_email, ', ') FROM regalos r WHERE r.order_id = o.id AND r.estado = 'canjeado') quienes
    , o.regalo, o.email, o.estado, o.correo_enviado_at
    FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.proveedor = 'cortesia' ORDER BY o.created_at DESC LIMIT 100`);
  // directo = enviada al correo de la persona (sin ligas); activa = no se le ha quitado
  return filas.map(f => ({ ...f, nota: String(f.nota || '').replace(/^cortesía:?\s*/, ''), directo: !f.regalo, activa: f.estado === 'paid', email: f.regalo ? null : f.email }));
}

// Apaga las ligas que aún no se usan de una tanda (las ya canjeadas siguen funcionando)
export async function revocarCortesias(env, orderId) {
  const o = await one(env, "SELECT id, regalo FROM orders WHERE id = ? AND proveedor = 'cortesia'", String(orderId));
  if (!o) throw new Error('Esa tanda no existe.');
  if (!o.regalo) return quitarCortesia(env, o.id);
  const r = await run(env, "UPDATE regalos SET estado = 'revocado' WHERE order_id = ? AND estado = 'pendiente'", o.id);
  return { ok: true, revocadas: r.meta.changes };
}

// ---------- control de ligas desde el panel (regalos comprados y cortesías) ----------
// Apagar una liga: deja de funcionar si nadie la ha usado. Quien ya canjeó conserva su acceso.
export async function apagarLiga(env, id) {
  const r = await run(env, "UPDATE regalos SET estado = 'revocado' WHERE id = ? AND estado = 'pendiente'", Number(id));
  if (!r.meta.changes) throw new Error('Esa liga ya se usó o ya estaba apagada.');
  return { ok: true };
}
// Volver a prender una liga apagada (solo si nunca se canjeó)
export async function prenderLiga(env, id) {
  const r = await run(env, "UPDATE regalos SET estado = 'pendiente' WHERE id = ? AND estado = 'revocado' AND canje_order_id IS NULL", Number(id));
  if (!r.meta.changes) throw new Error('Esa liga no se puede volver a prender.');
  return { ok: true };
}
// Ligas de una tanda o compra de regalo (sin el token: solo se ve al crearlas)
export async function ligasDe(env, orderId) {
  return all(env, 'SELECT id, estado, canjeado_email, canjeado_at, created_at FROM regalos WHERE order_id = ? ORDER BY id', String(orderId));
}
// Borrar una tanda de cortesías: solo si nadie la ha usado (si alguien canjeó, su acceso depende de ella)
export async function borrarCortesia(env, orderId) {
  const o = await one(env, "SELECT id, regalo FROM orders WHERE id = ? AND proveedor = 'cortesia'", String(orderId));
  if (!o) throw new Error('Esa tanda no existe.');
  if (!o.regalo) throw new Error('Este regalo ya se entregó a su correo. Si quieres, quítale el acceso.');
  const usadas = (await one(env, "SELECT COUNT(*) n FROM regalos WHERE order_id = ? AND estado = 'canjeado'", o.id)).n;
  if (usadas) throw new Error(`No se puede borrar: ${usadas === 1 ? 'una liga ya se usó' : `${usadas} ligas ya se usaron`}. Apaga las que faltan.`);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM regalos WHERE order_id = ?').bind(o.id),
    env.DB.prepare('DELETE FROM order_items WHERE order_id = ?').bind(o.id),
    env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(o.id),
  ]);
  return { ok: true };
}
