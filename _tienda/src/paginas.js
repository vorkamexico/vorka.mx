// Marco HTML de las páginas de la tienda: mismo menú, pie y CSS (v3) que el resto de vorka.mx.
// El menú y el pie vienen de _sitio/partes.py vía marco.generado.js (python3 _tienda/marco.py).
import { PIE, VERSION, CSS_TIENDA, LOGO, FLECHA } from './marco.generado.js';
import { esc } from './correo.js';
import { TEMA_HEAD } from './tema.js';
import { temporadaActual, estiloTemporada } from './temporadas.js';

// Versión del CSS de la tienda según su contenido (cambia sola cuando se edita)
export const ESTILOS = CSS_TIENDA;
const VERSION_CSS = [...CSS_TIENDA].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

export { esc };
export const nonce = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));

// CSP estricta solo en las rutas de la tienda (el resto del sitio no pasa por el Worker).
// form-action incluye Stripe porque /api/checkout redirige al pago con un 303.
// stripe: páginas del portal de creadores con los componentes incrustados de Stripe Connect
export function seguridad(n, { stripe = false, frames = [] } = {}) {
  const st = stripe ? ' https://connect-js.stripe.com https://js.stripe.com' : '';
  return {
    'content-security-policy': [
      "default-src 'self'",
      `script-src 'self' 'nonce-${n}' https://static.cloudflareinsights.com${st}`,
      ...(stripe ? ['frame-src https://connect-js.stripe.com https://js.stripe.com'] : frames.length ? [`frame-src ${frames.join(' ')}`] : []),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      `connect-src 'self' https://cloudflareinsights.com${stripe ? ' https://api.stripe.com https://*.stripe.com' : ''}`,
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY',
    // La verificación de identidad de Stripe puede pedir la cámara dentro de su iframe
    'permissions-policy': stripe ? 'camera=(self "https://connect-js.stripe.com" "https://js.stripe.com"), microphone=(), geolocation=()' : 'camera=(), microphone=(), geolocation=()',
    ...(stripe ? { 'cross-origin-opener-policy': 'unsafe-none' } : {}),
  };
}

/**
 * pagina({ titulo, descripcion, ruta, cuerpo, head?, script?, noindex?, status?, headers? }) → Response
 * `script` va inline con nonce; `head` acepta JSON-LD u otras etiquetas.
 */
// Casilla "Usar mis puntos" en cualquier formulario de compra de la tienda (si hay sesión con saldo)
const SCRIPT_PUNTOS = `(function(){
  var f=document.getElementById('form-compra')||document.getElementById('form-brindi')||document.getElementById('form-cupo'); if(!f||!window.fetch) return;
  fetch('/api/puntos/saldo',{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){
    if(!d.cuenta||!(d.disponibles>0)) return;
    var l=document.createElement('label'); l.className='t-casilla t-puntos';
    l.innerHTML='<input type="checkbox" name="usar_puntos" value="on" checked><span>Usar mis <b>'+d.disponibles+' puntos</b> (hasta $'+d.disponibles+' de descuento). Compra con <b></b>.</span>';
    l.querySelectorAll('b')[1].textContent=d.email;
    var t=f.querySelector('input[name=terminos]'); (t?t.closest('label'):f.lastChild).before(l);
    if(f.email&&!f.email.value) f.email.value=d.email;
  }).catch(function(){});
})();`;

// "¿Tienes un código?" en cualquier formulario de compra: el mismo campo acepta un código de descuento (FUNDADOR30) o el
// de quien te recomendó (5 % de descuento). Si llegaste con la liga de alguien ya sale aplicado. Antes de pagar dice qué
// descuento se aplica y por qué, sin datos de quien recomendó. Se revisa al escribirlo y al cambiar de plan
// (/api/puntos/liga, con límite por IP); el servidor lo vuelve a revisar al pagar.
const SCRIPT_SOCIO = `(function(){
  var f=document.getElementById('form-compra')||document.getElementById('form-brindi')||document.getElementById('form-cupo')||document.getElementById('form-vuelve')||document.getElementById('form-agenda')||document.getElementById('form-vende')||document.getElementById('form-cuentas'); if(!f||!window.fetch) return;
  var w=document.createElement('div'); w.className='t-campo t-socio';
  w.innerHTML='<button type="button" class="t-socio-abrir" aria-expanded="false">¿Tienes un código de descuento o de quien te recomendó?</button><div class="t-socio-c" hidden><label for="codigo">Código de descuento o de quien te recomendó <small>(opcional)</small></label><input id="codigo" name="codigo" type="text" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ej. FUNDADOR30"><p class="t-desc" id="codigo-msj" role="status" aria-live="polite"></p></div>';
  var t=f.querySelector('input[name=terminos]'); (t?t.closest('label'):f.lastChild).before(w);
  var b=w.querySelector('button'), c=w.querySelector('.t-socio-c'), i=w.querySelector('input'), m=w.querySelector('#codigo-msj'), tm;
  function abrir(){ c.hidden=false; b.hidden=true; b.setAttribute('aria-expanded','true'); }
  function plan(){ var s=f.querySelector('[name=slug]:checked')||f.querySelector('[name=slug]'); return s?s.value:''; }
  function pinta(d,vacio){
    m.textContent=''; m.className='t-desc'; if(vacio&&!d.texto) return;
    if(d.aviso){ m.classList.add('t-desc-aviso'); m.appendChild(document.createTextNode(d.aviso+' ')); }
    else if(!vacio&&!d.valido){ m.classList.add('t-desc-aviso'); m.appendChild(document.createTextNode('Ese código no existe o ya no está activo. ')); }
    if(d.texto){ var x=document.createElement('b'); x.textContent='Descuento aplicado: '+d.texto+' ✓'; m.appendChild(x); m.classList.add('t-desc-ok'); }
    else if(!vacio) m.appendChild(document.createTextNode('Puedes comprar sin descuento.'));
  }
  function revisa(){ var v=i.value.trim(); fetch('/api/puntos/liga?'+(v?'c='+encodeURIComponent(v)+'&':'')+'slug='+encodeURIComponent(plan()),{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){ if('valido' in d) pinta(d,!v); }).catch(function(){}); }
  b.addEventListener('click',function(){ abrir(); i.focus(); });
  i.addEventListener('input',function(){ clearTimeout(tm); tm=setTimeout(revisa,450); });
  f.addEventListener('change',function(e){ if(e.target&&e.target.name==='slug') revisa(); });
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(){ setTimeout(revisa,50); }); });
  fetch('/api/puntos/liga?slug='+encodeURIComponent(plan()),{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){ if(d.valido){ abrir(); i.value=d.codigo; pinta(d); } }).catch(function(){});
})();`;

// Íconos de trazo de la tienda (heredan el color del texto)
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONOS = {
  buscar: ico('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'), cuenta: ico('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/>'),
  rayo: ico('<path d="M13.5 2.8L5.2 13.4h6.1l-1 7.8 8.4-10.7h-6.2z"/>'), tarjeta: ico('<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.6"/><path d="M2.8 9.8h18.4M6.5 15h3.5"/>'),
  chat: ico('<path d="M20.5 11.6a8.1 8.1 0 0 1-11.8 7.2L3.5 20.5l1.7-4.9A8.1 8.1 0 1 1 20.5 11.6z"/><path d="M8.6 11.7h.01M12.4 11.7h.01M16.2 11.7h.01"/>'),
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>',
};
export const WHATSAPP = 'https://wa.me/528117804869';

// Menú propio de la tienda (mismas piezas que el del sitio, así vorka.js le da el menú del celular y la sombra al bajar):
// Inicio · Catálogo · Puntos · Contacto; a la derecha la lupa (lleva al buscador del catálogo), tu cuenta de
// puntos y la pastilla destacada "Gana puntos". oscuro: sobre la foto de la portada.
const MENU_TIENDA = [['inicio', 'Inicio', '/tienda/'], ['catalogo', 'Catálogo', '/tienda/#productos'], ['puntos', 'Puntos', '/tienda/puntos/'], ['contacto', 'Contacto', '/tienda/#ayuda']];
// entrar: { url, app } en las páginas de un producto con cuenta (Vuelve, Brindi, Cupo, Cuentas, Simulador): la pastilla de la
// derecha pasa a ser "Entrar" y lleva directo a iniciar sesión en esa app (o a su panel si ya tiene sesión). Se ve también en celular.
export const navTiendaSup = (actual = '', { oscuro = false, entrar = null } = {}) => `<header class="nav t-navs${oscuro ? ' oscuro' : ''}">
  <div class="nav-in">
    <a class="marca" href="/tienda/" aria-label="Tienda Vorka México, inicio">${LOGO}Vorka <span>Tienda</span></a>
    <nav class="nav-links" aria-label="Tienda">${MENU_TIENDA.map(([k, t, u]) => `<a href="${u}"${k === actual ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <a class="t-nav-ico" href="/tienda/#buscar" aria-label="Buscar en la tienda" title="Buscar">${ICONOS.buscar}</a>
    ${entrar ? '' : `<a class="t-nav-ico t-nav-cuenta" href="/tienda/puntos/" aria-label="Mi cuenta de puntos" title="Mi cuenta">${ICONOS.cuenta}</a>`}
    ${entrar ? `<a class="btn acento t-pastilla t-entrar" href="${esc(entrar.url)}" aria-label="Entrar a ${esc(entrar.app)}">${ICONOS.cuenta}<span>Entrar</span></a>` : '<a class="btn acento t-pastilla" href="/tienda/puntos/">Gana puntos</a>'}
    <button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil"><i></i></button>
  </div>
</header>
<div class="menu-movil" id="menu-movil">${entrar ? `<a class="btn acento" href="${esc(entrar.url)}">Entrar a ${esc(entrar.app)} ${FLECHA}</a>` : ''}${MENU_TIENDA.map(([, t, u]) => `<a href="${u}">${t}</a>`).join('')}<a href="/">Vorka México</a><a class="btn acento" href="/tienda/puntos/">Gana puntos ${FLECHA}</a></div>
`;

// La pastilla "Entrar" se queda visible en celular (la de "Gana puntos" se esconde en pantallas chicas)
const ENTRAR_CSS = '<style>.nav.t-navs .t-entrar{gap:7px}.nav.t-navs .t-entrar svg{width:18px;height:18px}@media (max-width:430px){.nav.t-navs .t-pastilla.t-entrar{display:inline-flex;min-height:40px;padding:0 14px}}.t-ya{margin:14px 0 0;font-size:15px;opacity:.85}.t-ya a{color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px}</style>';
export function pagina({ titulo, navActual = '', descripcion = '', ruta, cuerpo, head = '', script = '', modulo = '', noindex = false, status = 200, headers = {}, imagen, stripe = false, frames = [], whatsapp = false, navOscuro = false, entrar = null, whatsappTexto = '' }) {
  const n = nonce(), temporada = temporadaActual();
  const og = imagen || 'https://vorka.mx/img/ciudades/cdmx-reforma-1600.webp';
  const html = `<!doctype html>
<html lang="es-MX" data-app="tienda"${temporada ? ` data-temporada="${temporada.id}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script nonce="${n}">${TEMA_HEAD}</script>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="https://vorka.mx${esc(ruta)}">`}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBFAF8" data-claro="#FBFAF8" data-oscuro="#141216">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vorka México">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="https://vorka.mx${esc(ruta)}">
<meta property="og:image" content="${esc(og)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/vorka-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/vorka.css?v=${VERSION}">
<link rel="stylesheet" href="/tienda/estilos.css?v=${VERSION_CSS}">
${estiloTemporada(temporada)}${entrar ? ENTRAR_CSS : ''}${head}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
${navTiendaSup(navActual, { oscuro: navOscuro, entrar })}<main id="contenido" class="t-main">
${cuerpo}
</main>
${whatsapp ? `<a class="t-wa" href="${WHATSAPP}?text=${encodeURIComponent('Hola, tengo una duda sobre la tienda de Vorka')}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${ICONOS.whatsapp}<span>¿Dudas?</span></a>` : ''}
${pieCon(whatsappTexto).replace(/<script /g, `<script nonce="${n}" `)}${script ? `<script nonce="${n}">${script}</script>` : ''}${/id="form-(compra|brindi|cupo)"/.test(cuerpo) ? `<script nonce="${n}">${SCRIPT_PUNTOS}</script>` : ''}${/id="form-(compra|brindi|cupo|vuelve|agenda|vende|cuentas)"/.test(cuerpo) ? `<script nonce="${n}">${SCRIPT_SOCIO}</script>` : ''}${modulo ? `<script type="module" nonce="${n}">${modulo}</script>` : ''}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n, { stripe, frames }), ...headers },
  });
}

// El WhatsApp del pie lleva el mensaje de la página (en Brindi: dudas sobre la invitación, no el de la consultoría)
const pieCon = texto => texto ? PIE.replace(/https:\/\/wa\.me\/(\d+)\?text=[^"]*/, (_, num) => `https://wa.me/${num}?text=${encodeURIComponent(texto)}`) : PIE;

// Tarjeta centrada para estados (gracias, descargas, errores)
export const aviso = ({ icono = '', clase = '', titulo, texto = '', extra = '' }) => `
<section class="t-sec"><div class="marco t-estrecho">
  <div class="t-aviso ${clase}">
    ${icono ? `<div class="t-icono" aria-hidden="true">${icono}</div>` : ''}
    <h1 class="t-h1">${titulo}</h1>
    ${texto ? `<p class="t-lead">${texto}</p>` : ''}
    ${extra}
  </div>
</div></section>`;
