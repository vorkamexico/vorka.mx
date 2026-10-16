// Portal de creadores · vorka.mx/creadores
//   /creadores                  solicitud para vender (pública)
//   /creadores/entrar           pedir enlace de acceso por correo
//   /creadores/acceso/<token>   canjear enlace → sesión
//   /creadores/panel            pagos (Stripe incrustado), productos y ventas
//   /creadores/productos/<id>   editor de producto (o "nuevo")
//   /api/creadores/*            acciones del portal (sesión + mismo origen)
import { z } from 'zod';
import { json, fail, all, one, run, sha256, pesos, ahoraISO } from './util.js';
import { dentroDelLimite } from './modelo.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { crearEnlace, canjearEnlace, creadorActual, cerrarSesion, mismoOrigen } from './creadores-acceso.js';
import { crearCuenta, sesionComponentes, enlacePanel } from './pagos/connect.js';
import { refrescarCreador, nuevoId, DIAS_PARA_TRANSFERIR } from './marketplace.js';
import { solicitudRecibida, avisoNuevaSolicitud, enlaceAcceso } from './correos-creadores.js';
import * as admin from './admin.js';
import { CONNECT_JS } from './vendor/connectjs.generado.js';

const base = { noindex: true };
const RESPUESTA_ENTRAR = 'Si ese correo es de un creador aprobado, en un momento te llega un enlace para entrar. Revisa también spam o promociones.';
const ESTADO_PROD = { borrador: ['Borrador', ''], en_revision: ['En revisión', 'espera'], aprobado: ['Publicado', 'c-ok'], rechazado: ['Necesita cambios', 'alerta'] };
// Aprobado pero sin pagos configurados: todavía no sale en la tienda
const estadoProd = (p, listo) => p.revision === 'aprobado' && !listo ? ['Aprobado · falta configurar tus pagos', 'espera'] : ESTADO_PROD[p.revision] || [p.revision, ''];
const ESTADO_TRF = { programada: 'Programada', enviada: 'Pagada', cancelada: 'Cancelada (reembolso)', revertida: 'Revertida (reembolso o aclaración)', error: 'En revisión' };
const fechaMx = iso => iso ? new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric' }) : '';

// ---------- solicitud ----------
const EsquemaSolicitud = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  ciudad: z.string().trim().max(80).optional().or(z.literal('')),
  que_vende: z.string().trim().min(20, 'Cuéntanos en al menos dos líneas qué quieres vender.').max(2000),
  enlaces: z.string().trim().max(600).optional().or(z.literal('')),
  terminos: z.preprocess(v => v === 'on' || v === true, z.literal(true, { error: 'Debes aceptar los términos para creadores y el aviso de privacidad.' })),
  sitio: z.string().max(0).optional(),
});

function paginaSolicitud({ error = '', datos = {} } = {}) {
  const v = k => esc(datos[k] || '');
  return pagina({ ...base, noindex: false, titulo: 'Vende tus productos en Vorka México', ruta: '/creadores',
    descripcion: 'Vende tus guías, plantillas y herramientas digitales en la tienda de Vorka México. Nosotros cobramos, entregamos y te pagamos en automático.',
    cuerpo: `
<section class="t-sec t-cab"><div class="marco">
  <span class="etiqueta">Creadores</span>
  <h1 class="h1 t-titulo">Vende tus productos digitales <span class="metal">con Vorka México.</span></h1>
  <p class="lead">Guías, plantillas, cuadernos de trabajo, calculadoras. Tú creas; nosotros cobramos, entregamos y atendemos a tus compradores.</p>
</div></section>
<section class="t-sec t-sin-arriba"><div class="marco t-hero-g">
  <div>
    <ul class="t-lista">
      <li>${CHECK}<span><b>Te quedas con el 80 %</b> de cada venta, menos la comisión de la pasarela de pago.</span></li>
      <li>${CHECK}<span><b>Pagos automáticos</b> a tu cuenta bancaria ${DIAS_PARA_TRANSFERIR} días después de cada venta.</span></li>
      <li>${CHECK}<span><b>Tarjeta, OXXO y SPEI</b> para tus compradores, con entrega inmediata por correo.</span></li>
      <li>${CHECK}<span><b>Revisamos cada producto</b> para cuidar la calidad de la tienda.</span></li>
    </ul>
    <p class="t-nota">¿Ya eres creador? <a href="/creadores/entrar">Entra a tu portal</a>.</p>
  </div>
  <form class="t-form" method="post" action="/creadores/solicitud" novalidate>
    <div class="t-campo"><label for="nombre">Nombre o nombre de tu marca</label><input id="nombre" name="nombre" type="text" required maxlength="120" value="${v('nombre')}"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required maxlength="254" value="${v('email')}"></div>
    <div class="t-campo"><label for="telefono">WhatsApp (opcional)</label><input id="telefono" name="telefono" type="text" maxlength="30" value="${v('telefono')}"></div>
    <div class="t-campo"><label for="ciudad">Ciudad</label><input id="ciudad" name="ciudad" type="text" maxlength="80" value="${v('ciudad')}"></div>
    <div class="t-campo"><label for="que_vende">¿Qué quieres vender?</label><textarea id="que_vende" name="que_vende" rows="4" maxlength="2000" required>${v('que_vende')}</textarea></div>
    <div class="t-campo"><label for="enlaces">Enlaces a tu trabajo (opcional)</label><input id="enlaces" name="enlaces" type="text" maxlength="600" placeholder="Instagram, sitio web, portafolio…" value="${v('enlaces')}"></div>
    <div class="t-trampa" aria-hidden="true"><label for="sitio">No llenar</label><input id="sitio" name="sitio" tabindex="-1" autocomplete="off"></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" required><span>Acepto los <a href="/legal/creadores/" target="_blank">términos para creadores</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    ${error ? `<p class="t-error" role="alert">${esc(error)}</p>` : ''}
    <button class="btn tinta" type="submit">Enviar solicitud ${FLECHA}</button>
  </form>
</div></section>` });
}

async function postSolicitud(req, env, ctx) {
  const datos = Object.fromEntries(await req.formData().catch(() => new FormData()));
  const v = EsquemaSolicitud.safeParse(datos);
  if (!v.success) {
    if (datos.sitio) return gracias();
    return paginaSolicitud({ error: v.error.issues[0].message, datos });
  }
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `solicitud:ip:${await sha256(ip)}`, 5, 3600))) return paginaSolicitud({ error: 'Demasiados intentos. Intenta más tarde.', datos });
  const d = v.data;
  const ya = await one(env, 'SELECT id, estado FROM creadores WHERE email = ?', d.email);
  if (!ya) {
    const c = { id: nuevoId('cre'), ...d, telefono: d.telefono || null, ciudad: d.ciudad || null, enlaces: d.enlaces || '' };
    await run(env, 'INSERT INTO creadores (id, nombre, email, telefono, ciudad, que_vende, enlaces, acepto_terminos_at) VALUES (?,?,?,?,?,?,?,?)',
      c.id, c.nombre, c.email, c.telefono, c.ciudad, c.que_vende, c.enlaces, ahoraISO());
    const trabajo = Promise.all([solicitudRecibida(env, c), avisoNuevaSolicitud(env, c)]).catch(e => console.error('solicitud correo', e.message));
    ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
  }
  return gracias();
}
const gracias = () => pagina({ ...base, titulo: 'Solicitud recibida · Vorka México', ruta: '/creadores',
  cuerpo: aviso({ icono: CHECK, clase: 'exito', titulo: '¡Gracias! Recibimos tu solicitud', texto: 'La revisamos a mano y te respondemos por correo en unos días.' }) });

// ---------- entrar ----------
const paginaEntrar = (msg = '') => pagina({ ...base, titulo: 'Entrar · Creadores Vorka México', ruta: '/creadores/entrar',
  cuerpo: msg ? aviso({ icono: CHECK, clase: 'exito', titulo: 'Revisa tu correo', texto: msg }) : `
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Portal de creadores</span>
  <h1 class="t-h1">Entra a tu portal</h1>
  <p class="t-lead">Escribe tu correo y te mandamos un enlace para entrar, sin contraseña.</p>
  <form class="t-form" method="post" action="/creadores/entrar" novalidate>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required autocomplete="email"></div>
    <button class="btn tinta" type="submit">Enviarme el enlace ${FLECHA}</button>
  </form>
  <p class="t-nota">¿Todavía no vendes con nosotros? <a href="/creadores">Envía tu solicitud</a>.</p>
</div></section>` });

async function postEntrar(req, env, ctx) {
  const f = Object.fromEntries(await req.formData().catch(() => new FormData()));
  const email = String(f.email || '').trim().toLowerCase();
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const ok = await dentroDelLimite(env, `entrar:ip:${await sha256(ip)}`, 10, 3600) && await dentroDelLimite(env, `entrar:email:${await sha256(email)}`, 4, 3600);
  if (ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const trabajo = (async () => {
      const c = await one(env, "SELECT * FROM creadores WHERE email = ? AND estado IN ('aprobado','suspendido')", email);
      if (c) await enlaceAcceso(env, c, await crearEnlace(env, c.id));
    })().catch(e => console.error('entrar', e.message));
    ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
  }
  return paginaEntrar(RESPUESTA_ENTRAR);
}

// ---------- panel ----------
async function paginaPanel(env, c) {
  const productos = await all(env, `SELECT p.id, p.slug, p.nombre, p.precio_centavos, p.revision, p.nota_revision, p.activo,
      (SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE i.product_id = p.id AND o.estado = 'paid') vendidos
    FROM products p WHERE p.creador_id = ? ORDER BY p.updated_at DESC`, c.id);
  const trf = await all(env, `SELECT t.*, (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = t.order_id AND i.creador_id = t.creador_id) productos
    FROM transferencias t WHERE t.creador_id = ? ORDER BY t.created_at DESC LIMIT 100`, c.id);
  const tot = trf.reduce((s, t) => {
    if (t.estado === 'enviada') s.pagado += t.monto_centavos;
    if (t.estado === 'programada') s.porPagar += t.monto_centavos;
    if (['enviada', 'programada'].includes(t.estado)) s.ventas += t.venta_centavos;
    return s;
  }, { pagado: 0, porPagar: 0, ventas: 0 });
  const listo = !!c.stripe_listo;
  const suspendido = c.estado === 'suspendido';
  return pagina({ ...base, stripe: true, titulo: 'Mi portal · Creadores Vorka México', ruta: '/creadores/panel',
    cuerpo: `
<section class="t-sec"><div class="marco">
  <div class="c-cab"><div><span class="etiqueta">Portal de creadores</span><h1 class="t-h1">Hola, ${esc(c.nombre.split(' ')[0])}</h1></div>
    <form method="post" action="/creadores/salir"><button class="btn blanco chico" type="submit">Salir</button></form></div>
  ${suspendido ? `<p class="t-error" role="alert">Tu cuenta está pausada${c.nota ? `: ${esc(c.nota)}` : ''}. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>` : ''}
  <div id="stripe-aviso"></div>

  <div class="c-tarjetas">
    <div class="c-dato"><b class="num">${pesos(tot.ventas)}</b><span>Ventas</span></div>
    <div class="c-dato"><b class="num">${pesos(tot.porPagar)}</b><span>Por recibir</span></div>
    <div class="c-dato"><b class="num">${pesos(tot.pagado)}</b><span>Ya recibido</span></div>
    <div class="c-dato"><b class="num">${c.comision_pct} %</b><span>Comisión de Vorka</span></div>
  </div>

  <h2 class="t-h2 c-sec">Cómo recibes tus pagos</h2>
  ${listo ? `<div class="c-caja c-ok"><p><b>Tu cuenta está lista para recibir pagos.</b> Las ventas se depositan ${DIAS_PARA_TRANSFERIR} días después, cuando termina el plazo de reembolso.</p>
      <div class="botones"><button class="btn blanco chico" type="button" id="btn-depositos">Ver mis depósitos ${FLECHA}</button><button class="btn blanco chico" type="button" id="btn-datos">Actualizar mis datos</button></div></div>
      <div id="stripe-gestion" hidden></div>`
    : `<div class="c-caja"><p><b>Configura cómo recibes tus pagos.</b> Stripe (nuestro procesador de pagos) te pedirá tus datos, una identificación y tu cuenta bancaria. Tus productos se publican cuando esto esté listo.</p>
      <div id="stripe-registro" class="c-stripe"><button class="btn tinta" type="button" id="btn-registro">Configurar mis pagos ${FLECHA}</button></div></div>`}

  <div class="c-sec c-sec-fila"><h2 class="t-h2">Mis productos</h2>${suspendido ? '' : `<a class="btn tinta chico" href="/creadores/productos/nuevo">Nuevo producto</a>`}</div>
  ${productos.length ? `<ul class="c-lista">${productos.map(p => { const [t, cl] = estadoProd(p, listo); return `
    <li><a href="/creadores/productos/${esc(p.id)}"><span><b>${esc(p.nombre)}</b><small>${pesos(p.precio_centavos)} · ${p.vendidos} ${p.vendidos === 1 ? 'vendido' : 'vendidos'}${p.revision === 'rechazado' && p.nota_revision ? ` · ${esc(p.nota_revision)}` : ''}</small></span><span class="c-pill ${cl}">${t}</span></a></li>`; }).join('')}</ul>`
    : `<p class="t-nota">Aún no tienes productos. Crea el primero: le pones nombre, precio, subes tus archivos y lo envías a revisión.</p>`}

  <h2 class="t-h2 c-sec">Mis ventas</h2>
  ${trf.length ? `<div class="c-tabla"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Venta</th><th>Vorka</th><th>Stripe</th><th>Recibes</th><th>Estado</th></tr></thead><tbody>
    ${trf.map(t => `<tr><td>${fechaMx(t.created_at)}</td><td>${esc(t.productos || '')}</td><td class="num">${pesos(t.venta_centavos)}</td><td class="num">−${pesos(t.comision_vorka_centavos)}</td><td class="num">−${pesos(t.comision_stripe_centavos)}</td><td class="num"><b>${pesos(t.monto_centavos)}</b></td>
      <td>${ESTADO_TRF[t.estado] || t.estado}${t.estado === 'programada' ? `<small>${fechaMx(t.disponible_en)}</small>` : ''}</td></tr>`).join('')}
  </tbody></table></div>` : '<p class="t-nota">Cuando vendas, aquí verás cada venta y cuándo se deposita.</p>'}
  <p class="t-nota">¿Dudas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. <a href="/legal/creadores/">Términos para creadores</a>.</p>
</div></section>`,
    modulo: `
import { loadConnectAndInitialize } from '/creadores/connect.mjs';
let instancia;
const iniciar = () => instancia ||= loadConnectAndInitialize({
  publishableKey: ${JSON.stringify(env.STRIPE_PUBLISHABLE_KEY || '')},
  locale: 'es-419',
  fetchClientSecret: async () => { const r = await fetch('/api/creadores/stripe/sesion', { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d.error); return d.client_secret; },
  appearance: { variables: { colorPrimary: '#6B2A85', fontFamily: 'Inter, -apple-system, sans-serif', borderRadius: '12px' } },
});
const montar = (id, nombre, alSalir) => { const el = document.getElementById(id); if (!el) return; el.hidden = false; el.innerHTML = ''; const c = iniciar().create(nombre); if (alSalir) c.setOnExit(alSalir); el.appendChild(c); };
${listo ? `montar('stripe-aviso', 'notification-banner');` : ''}
document.getElementById('btn-registro')?.addEventListener('click', () => montar('stripe-registro', 'account-onboarding', () => location.reload()));
document.getElementById('btn-datos')?.addEventListener('click', () => montar('stripe-gestion', 'account-management'));
document.getElementById('btn-depositos')?.addEventListener('click', async e => {
  e.target.disabled = true; const r = await fetch('/api/creadores/stripe/panel', { method: 'POST' }); const d = await r.json();
  if (d.url) location.href = d.url; else { alert(d.error || 'No se pudo abrir'); e.target.disabled = false; }
});`,
  });
}

// ---------- editor de producto ----------
const LISTAS = {
  incluye: ['Qué incluye', 'Cada archivo o parte del producto', [['titulo', 'Qué es'], ['texto', 'Detalle (opcional)']]],
  pasos: ['Pasos', 'El camino que sigue quien compra (opcional)', [['titulo', 'Paso'], ['texto', 'En qué consiste (opcional)', true]]],
  para_quien: ['Para quién es', 'Frases que empiezan con “Te sirve si…”', [['', 'Frase']]],
  faq: ['Preguntas frecuentes', 'Las de pago, entrega y reembolsos ya salen solas', [['p', 'Pregunta'], ['r', 'Respuesta', true]]],
};
function paginaEditor(env, c, p) {
  const nuevo = !p;
  p = p || { nombre: '', precio_centavos: 0, descripcion_corta: '', categoria: '', r2_keys: [], contenido: {}, revision: 'borrador' };
  const co = p.contenido || {};
  const [et, ecl] = nuevo ? ['', ''] : estadoProd(p, !!c.stripe_listo);
  const item = (tipo, x) => `<div class="c-item" data-item>${LISTAS[tipo][2].map(([k, l, largo]) => {
    const val = k ? (x?.[k] || '') : (typeof x === 'string' ? x : '');
    return `<div class="t-campo"><label>${l}</label>${largo ? `<textarea data-k="${k}" rows="2">${esc(val)}</textarea>` : `<input data-k="${k}" value="${esc(val)}" maxlength="400">`}</div>`;
  }).join('')}<button type="button" class="link c-quitar" data-quitar>Quitar</button></div>`;
  const lista = tipo => `<fieldset class="c-fs"><legend>${LISTAS[tipo][0]} <small>${LISTAS[tipo][1]}</small></legend>
    <div data-lista="${tipo}">${(co[tipo] || []).map(x => item(tipo, x)).join('')}</div>
    <button type="button" class="btn blanco chico" data-agregar="${tipo}">Agregar</button><template id="tpl-${tipo}">${item(tipo, null)}</template></fieldset>`;
  return pagina({ ...base, titulo: `${nuevo ? 'Nuevo producto' : esc(p.nombre)} · Creadores Vorka México`, ruta: '/creadores/productos',
    cuerpo: `
<section class="t-sec"><div class="marco t-estrecho">
  <a class="t-volver" href="/creadores/panel">← Mi portal</a>
  <h1 class="t-h1">${nuevo ? 'Nuevo producto' : esc(p.nombre)}</h1>
  ${nuevo ? '' : `<p class="t-nota"><span class="c-pill ${ecl}">${et}</span>${p.revision === 'rechazado' && p.nota_revision ? ` ${esc(p.nota_revision)}` : ''}${p.revision === 'aprobado' && c.stripe_listo ? ` · <a href="/tienda/${esc(p.slug)}/" target="_blank">Ver en la tienda</a>. Si guardas cambios, vuelve a revisión antes de publicarse de nuevo.` : ''}</p>`}
  <form class="t-form" id="editor" novalidate data-id="${esc(p.id || '')}">
    <div class="t-campo"><label for="nombre">Nombre del producto</label><input id="nombre" name="nombre" required maxlength="160" value="${esc(p.nombre)}"></div>
    <div class="t-campo"><label for="precio">Precio (MXN)</label><input id="precio" name="precio" type="number" min="20" step="1" required value="${p.precio_centavos ? p.precio_centavos / 100 : ''}"><small class="t-ayuda">Mínimo $20. Recibes el precio − ${c.comision_pct} % − comisión de Stripe.</small></div>
    <div class="t-campo"><label for="descripcion_corta">Descripción corta</label><textarea id="descripcion_corta" name="descripcion_corta" rows="2" maxlength="300">${esc(p.descripcion_corta)}</textarea></div>
    <div class="t-campo"><label for="categoria">Categoría (opcional)</label><input id="categoria" name="categoria" maxlength="40" value="${esc(p.categoria || '')}" placeholder="Guías, Plantillas, Kits…"></div>
    <div class="t-campo"><label for="titular">Titular de la página</label><input id="titular" name="titular" maxlength="400" value="${esc(co.titular || '')}"></div>
    <div class="t-campo"><label for="subtitulo">Subtítulo</label><textarea id="subtitulo" name="subtitulo" rows="2" maxlength="600">${esc(co.subtitulo || '')}</textarea></div>
    ${lista('incluye')}${lista('pasos')}${lista('para_quien')}${lista('faq')}
    ${nuevo ? '<p class="t-nota">Guarda el producto para poder subir sus archivos y su portada.</p>' : `
    <fieldset class="c-fs"><legend>Archivos que recibe quien compra <small>Hasta 100 MB cada uno</small></legend>
      <ul class="c-lista">${p.r2_keys.map(a => `<li><span><b>${esc(a.nombre)}</b><small>${esc(a.key.split('/').pop())}</small></span><button type="button" class="link c-quitar" data-quitar-archivo="${esc(a.key)}">Quitar</button></li>`).join('')}</ul>
      <label class="btn blanco chico">Subir archivos<input type="file" id="archivos" multiple hidden></label>
      <p class="t-ayuda" id="progreso" hidden></p></fieldset>
    <fieldset class="c-fs"><legend>Portada <small>Horizontal, JPG/PNG/WebP, menos de 8 MB (opcional)</small></legend>
      ${p.imagen ? `<img src="${esc(p.imagen)}" alt="" class="c-portada">` : ''}
      <label class="btn blanco chico">${p.imagen ? 'Cambiar portada' : 'Subir portada'}<input type="file" id="portada" accept="image/jpeg,image/png,image/webp" hidden></label></fieldset>`}
    <p class="t-error" id="error" role="alert" hidden></p>
    <div class="botones"><button class="btn blanco" type="submit" data-accion="guardar">Guardar borrador</button>${nuevo ? '' : '<button class="btn tinta" type="submit" data-accion="revision">Enviar a revisión</button>'}</div>
  </form>
</div></section>`,
    script: SCRIPT_EDITOR });
}

const SCRIPT_EDITOR = `(function(){
  var f=document.getElementById('editor'), id=f.dataset.id, err=document.getElementById('error');
  function mal(m){ err.textContent=m; err.hidden=false; }
  f.addEventListener('click',function(e){
    var ag=e.target.closest('[data-agregar]'); if(ag){ var t=document.getElementById('tpl-'+ag.dataset.agregar); f.querySelector('[data-lista="'+ag.dataset.agregar+'"]').appendChild(t.content.cloneNode(true)); return; }
    var q=e.target.closest('[data-quitar]'); if(q){ q.closest('[data-item]').remove(); return; }
    var qa=e.target.closest('[data-quitar-archivo]'); if(qa){ if(!confirm('¿Quitar este archivo?'))return; api('DELETE','/api/creadores/productos/'+id+'/archivos',{key:qa.dataset.quitarArchivo}).then(function(){location.reload();}).catch(function(x){mal(x.message);}); }
  });
  function lista(tipo){ return Array.prototype.map.call(f.querySelectorAll('[data-lista="'+tipo+'"] [data-item]'),function(it){ var o={}; it.querySelectorAll('[data-k]').forEach(function(x){o[x.dataset.k]=x.value.trim();}); return tipo==='para_quien'?o['']:o; }).filter(function(x){ return typeof x==='string'?x:Object.values(x)[0]; }); }
  function api(m,u,b){ return fetch(u,{method:m,headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(function(r){return r.json().then(function(j){ if(!r.ok) throw new Error(j.error||'No se pudo guardar'); return j; });}); }
  f.addEventListener('submit',function(e){
    e.preventDefault(); err.hidden=true;
    var accion=(e.submitter&&e.submitter.dataset.accion)||'guardar';
    var d={ nombre:f.nombre.value.trim(), precio:f.precio.value, descripcion_corta:f.descripcion_corta.value.trim(), categoria:f.categoria.value.trim(),
      contenido:{ titular:f.titular.value.trim(), subtitulo:f.subtitulo.value.trim(), incluye:lista('incluye'), pasos:lista('pasos'), para_quien:lista('para_quien'), faq:lista('faq') } };
    api(id?'PUT':'POST', '/api/creadores/productos'+(id?'/'+id:''), d)
      .then(function(p){ return accion==='revision' ? api('POST','/api/creadores/productos/'+p.id+'/revision') : p; })
      .then(function(p){ location.href='/creadores/productos/'+p.id; }).catch(function(x){ mal(x.message); });
  });
  function subir(u,file,cb){ var x=new XMLHttpRequest(); x.open('PUT',u); x.setRequestHeader('content-type',file.type||'application/octet-stream'); x.setRequestHeader('x-nombre',encodeURIComponent(file.name));
    var pr=document.getElementById('progreso'); x.upload.onprogress=function(e){ if(e.lengthComputable&&pr){ pr.hidden=false; pr.textContent='Subiendo '+file.name+' · '+Math.round(e.loaded/e.total*100)+' %'; } };
    x.onload=function(){ var j={}; try{j=JSON.parse(x.responseText);}catch(_){} x.status<300?cb():mal(j.error||'No se pudo subir'); }; x.onerror=function(){mal('Se cortó la conexión');}; x.send(file); }
  var fa=document.getElementById('archivos'); if(fa) fa.onchange=function(){ var fs=Array.prototype.slice.call(fa.files), i=0; (function sig(){ if(i>=fs.length) return location.reload(); subir('/api/creadores/productos/'+id+'/archivos',fs[i++],sig); })(); };
  var fp=document.getElementById('portada'); if(fp) fp.onchange=function(){ if(fp.files[0]) subir('/api/creadores/productos/'+id+'/portada',fp.files[0],function(){location.reload();}); };
})();`;

// ---------- API ----------
async function productoPropio(env, c, id) {
  const p = await admin.productoPorId(env, id);
  return p && p.creador_id === c.id ? p : null;
}

async function api(req, env, c, p, M) {
  if (c.estado !== 'aprobado') return fail('Tu cuenta está pausada.', 403);
  let m;
  if (p === '/api/creadores/stripe/sesion' && M === 'POST') {
    if (!c.stripe_account_id) {
      const cuenta = await crearCuenta(env, c);
      await run(env, 'UPDATE creadores SET stripe_account_id = ? WHERE id = ? AND stripe_account_id IS NULL', cuenta.id, c.id);
      c.stripe_account_id = (await one(env, 'SELECT stripe_account_id FROM creadores WHERE id = ?', c.id)).stripe_account_id;
    }
    return json({ client_secret: await sesionComponentes(env, c.stripe_account_id) });
  }
  if (p === '/api/creadores/stripe/panel' && M === 'POST') {
    if (!c.stripe_account_id) return fail('Primero configura tus pagos.');
    return json({ url: await enlacePanel(env, c.stripe_account_id) });
  }
  if (p === '/api/creadores/productos' && M === 'POST') return guardar(env, c, null, await req.json().catch(() => ({})));
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})$/)) && M === 'PUT') {
    const prod = await productoPropio(env, c, m[1]);
    return prod ? guardar(env, c, prod, await req.json().catch(() => ({}))) : fail('No encontrado.', 404);
  }
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})\/revision$/)) && M === 'POST') {
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return fail('No encontrado.', 404);
    if (!prod.r2_keys.length) return fail('Sube al menos un archivo antes de enviarlo a revisión.');
    await run(env, "UPDATE products SET revision = 'en_revision', nota_revision = NULL, updated_at = ? WHERE id = ?", ahoraISO(), prod.id);
    return json({ ...prod, revision: 'en_revision' });
  }
  if ((m = p.match(/^\/api\/creadores\/productos\/([\w-]{1,80})\/(archivos|portada)$/))) {
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return fail('No encontrado.', 404);
    if (M === 'PUT') {
      if (!req.headers.get('x-nombre')) return fail('Solicitud inválida.', 400);
      const a = { nombre: decodeURIComponent(req.headers.get('x-nombre')), tipo: req.headers.get('content-type') || 'application/octet-stream', cuerpo: req.body, tamano: Number(req.headers.get('content-length') || 0) };
      const r = m[2] === 'archivos' ? await admin.subirArchivo(env, prod.id, a) : await admin.subirPortada(env, prod.id, a);
      await aBorrador(env, prod);
      return json(r);
    }
    if (M === 'DELETE' && m[2] === 'archivos') {
      const { key } = await req.json().catch(() => ({}));
      await aBorrador(env, prod); // primero sale de la venta: un producto publicado sin archivos no se permite
      return json(await admin.quitarArchivo(env, prod.id, String(key || '')));
    }
  }
  return fail('No encontrado.', 404);
}

// Cualquier cambio regresa el producto a borrador (y lo quita de la venta hasta que se apruebe otra vez)
const aBorrador = (env, prod) => run(env, "UPDATE products SET revision = 'borrador', activo = 0, updated_at = ? WHERE id = ?", ahoraISO(), prod.id);

async function guardar(env, c, prod, d) {
  if (Number(d.precio) < 20) return fail('El precio mínimo es $20 MXN.');
  try {
    const p = await admin.guardarProducto(env, { ...d, id: prod?.id, activo: false, orden: prod?.orden ?? 50, archivos: undefined });
    await run(env, "UPDATE products SET creador_id = ?, revision = 'borrador', activo = 0 WHERE id = ?", c.id, p.id);
    return json({ ...p, creador_id: c.id, revision: 'borrador' });
  } catch (e) { return fail(e.message); }
}

// ---------- router ----------
export async function rutasCreadores(req, env, ctx, url) {
  const p = url.pathname.replace(/\/$/, '') || '/';
  const M = req.method;
  if (!p.startsWith('/creadores') && !p.startsWith('/api/creadores')) return null;
  if (env.MARKETPLACE !== '1') return null; // apagado hasta abrir el marketplace
  if (p === '/creadores/connect.mjs') return new Response(CONNECT_JS, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
  if (p === '/creadores' && M === 'GET') return paginaSolicitud();
  if (p === '/creadores/solicitud' && M === 'POST') return postSolicitud(req, env, ctx);
  if (p === '/creadores/entrar') return M === 'POST' ? postEntrar(req, env, ctx) : paginaEntrar();
  let m;
  if ((m = p.match(/^\/creadores\/acceso\/([a-f0-9]{64})$/)) && M === 'GET') {
    const cookie = await canjearEnlace(env, m[1]);
    if (!cookie) return pagina({ ...base, titulo: 'Enlace vencido · Vorka México', ruta: '/creadores', status: 410,
      cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya no funciona', texto: 'Los enlaces duran 30 minutos y sirven una sola vez.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/creadores/entrar">Pedir otro enlace ${FLECHA}</a></div>` }) });
    return new Response(null, { status: 303, headers: { location: '/creadores/panel', 'set-cookie': cookie } });
  }
  if (p === '/creadores/salir' && M === 'POST') return new Response(null, { status: 303, headers: { location: '/creadores/entrar', 'set-cookie': await cerrarSesion(req, env) } });

  const c = await creadorActual(req, env);
  if (!c) return p.startsWith('/api/') ? fail('Inicia sesión.', 401) : new Response(null, { status: 303, headers: { location: '/creadores/entrar' } });
  if (p.startsWith('/api/')) {
    if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
    try { return await api(req, env, c, p, M); }
    catch (e) { console.error('creadores api', p, e.message); return fail('Algo falló. Intenta de nuevo.', 500); }
  }
  if (p === '/creadores/panel' && M === 'GET') {
    if (c.stripe_account_id && !c.stripe_listo) c.stripe_listo = await refrescarCreador(env, c).catch(() => false);
    return paginaPanel(env, c);
  }
  if ((m = p.match(/^\/creadores\/productos\/([\w-]{1,80})$/)) && M === 'GET') {
    if (m[1] === 'nuevo') return c.estado === 'aprobado' ? paginaEditor(env, c, null) : Response.redirect(new URL('/creadores/panel', env.SITE_URL), 303);
    const prod = await productoPropio(env, c, m[1]);
    if (!prod) return new Response(null, { status: 303, headers: { location: '/creadores/panel' } });
    prod.contenido.faq = (prod.contenido.faq || []).map(f => ({ p: f.p, r: admin.faqComoTexto(f.r) }));
    return paginaEditor(env, c, prod);
  }
  return null;
}
