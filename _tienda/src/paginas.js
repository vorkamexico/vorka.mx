// Marco HTML de las páginas de la tienda: mismo menú, pie y CSS (v3) que el resto de vorka.mx.
// El menú y el pie vienen de _sitio/partes.py vía marco.generado.js (python3 _tienda/marco.py).
import { NAV, PIE, VERSION, CSS_TIENDA } from './marco.generado.js';
import { esc } from './correo.js';
import { TEMA_HEAD, selectorTema } from './tema.js';

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

// "¿Tienes un código de socio?" en cualquier formulario de compra: si llegaste con la liga de un socio ya sale aplicado.
// Se valida al escribirlo (/api/socios/codigo, con límite por IP); el servidor lo vuelve a revisar al pagar.
const SCRIPT_SOCIO = `(function(){
  var f=document.getElementById('form-compra')||document.getElementById('form-brindi')||document.getElementById('form-cupo')||document.getElementById('form-vuelve'); if(!f||!window.fetch) return;
  var w=document.createElement('div'); w.className='t-campo t-socio';
  w.innerHTML='<button type="button" class="t-socio-abrir" aria-expanded="false">¿Tienes un código de socio?</button><div class="t-socio-c" hidden><label for="codigo">Código de socio <small>(opcional)</small></label><input id="codigo" name="codigo" type="text" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ej. ANA-CELAYA"><small class="t-ayuda" id="codigo-msj" role="status"></small></div>';
  var t=f.querySelector('input[name=terminos]'); (t?t.closest('label'):f.lastChild).before(w);
  var b=w.querySelector('button'), c=w.querySelector('.t-socio-c'), i=w.querySelector('input'), m=w.querySelector('#codigo-msj'), tm;
  function abrir(){ c.hidden=false; b.hidden=true; b.setAttribute('aria-expanded','true'); }
  function pinta(d,vacio){ m.textContent=vacio?'':d.valido?('Código de '+d.nombre+(d.descuento_pct?' · '+d.descuento_pct+'% de descuento al pagar':'')+' ✓'):'Ese código no existe o ya no está activo; puedes comprar sin él.'; }
  function revisa(){ var v=i.value.trim(); if(!v){ pinta({},true); return; } fetch('/api/socios/codigo?c='+encodeURIComponent(v),{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){ if('valido' in d) pinta(d); }).catch(function(){}); }
  b.addEventListener('click',function(){ abrir(); i.focus(); });
  i.addEventListener('input',function(){ clearTimeout(tm); tm=setTimeout(revisa,450); });
  fetch('/api/socios/codigo',{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){ if(d.valido){ abrir(); i.value=d.codigo; pinta(d); } }).catch(function(){});
})();`;

export function pagina({ titulo, descripcion = '', ruta, cuerpo, head = '', script = '', modulo = '', noindex = false, status = 200, headers = {}, imagen, stripe = false, frames = [] }) {
  const n = nonce();
  const og = imagen || 'https://vorka.mx/img/ciudades/cdmx-reforma-1600.webp';
  const html = `<!doctype html>
<html lang="es-MX" data-app="tienda">
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
${head}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
${NAV.replace('<script ', `<script nonce="${n}" `)}<main id="contenido" class="t-main">
${cuerpo}
</main>
${PIE.replace('<div class="pie-base">', `<div class="t-tema-pie"><span>Apariencia</span>${selectorTema({ clase: 'pie' })}</div><div class="pie-base">`).replace(/<script /g, `<script nonce="${n}" `)}${script ? `<script nonce="${n}">${script}</script>` : ''}${/id="form-(compra|brindi|cupo)"/.test(cuerpo) ? `<script nonce="${n}">${SCRIPT_PUNTOS}</script>` : ''}${/id="form-(compra|brindi|cupo|vuelve)"/.test(cuerpo) ? `<script nonce="${n}">${SCRIPT_SOCIO}</script>` : ''}${modulo ? `<script type="module" nonce="${n}">${modulo}</script>` : ''}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n, { stripe, frames }), ...headers },
  });
}

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
