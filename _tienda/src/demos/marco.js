// Demos en vivo de cada producto: una sección «Pruébalo aquí» en la página del producto (un celular con la demo adentro) y
// una página propia, /tienda/demo/<clave>/, para abrirla en pantalla completa o mandarla por WhatsApp (los vendedores la
// comparten; si la liga trae ?ref=CÓDIGO, el botón final lo conserva). Todo es de ejemplo: nada se guarda ni se envía.
//
// Cada demo es un módulo en src/demos/<clave>.js que exporta por defecto:
//   { titulo, texto, prueba: ['qué puedes probar', …], cta, css, html, js }   ó   { titulo, texto, prueba, url } (demo externa)
// css/html/js se pintan dentro de <div id="dm">; el js corre al final de la página (sin módulos, sin red).
import { esc, seguridad, nonce } from '../paginas.js';
import { MARCAS, colorDe } from '../marca-producto.js';

const SITIO = 'https://vorka.mx';
export const ligaDemo = (k, ref) => `${SITIO}/tienda/demo/${k}/${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
const nombreDe = k => MARCAS[k]?.[1] || k;
const rutaProducto = { 'simulador-paa': '/simulador-paa/', 'simulador-unam': '/simulador-unam/', 'simulador-ecoems': '/simulador-ecoems/', 'simulador-prepa-ug': '/simulador-prepa-ug/' };
export const paginaDe = k => rutaProducto[k] || `/tienda/${k}/`;
const WA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>';

// Sección para la página del producto
export function seccionDemo(k, demo, { id = 'demo' } = {}) {
  if (!demo) return '';
  const src = demo.url || `/tienda/demo/${k}/?dentro=1`, liga = ligaDemo(k);
  const msj = `Prueba ${nombreDe(k)} aquí mismo, sin registrarte: ${liga}`;
  return `<section class="pm-sec pm-demo" id="${id}" style="--pm:${colorDe(k)}"><div class="marco pm-demo-g">
  <div class="pm-demo-txt"><p class="pm-et">Pruébalo aquí</p><h2 class="pm-h2">${esc(demo.titulo)}</h2><p class="pm-grande">${esc(demo.texto)}</p>
    ${demo.prueba?.length ? `<ul class="pm-demo-lista">${demo.prueba.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="pm-demo-acc"><a class="pm-btn" href="${esc(demo.url || `/tienda/demo/${k}/`)}" target="_blank" rel="noopener">Abrir en pantalla completa</a>
      <a class="pm-btn sec" href="https://wa.me/?text=${encodeURIComponent(msj)}" target="_blank" rel="noopener">${WA} Mandar por WhatsApp</a>
      <button class="pm-btn sec" type="button" data-copiar="${esc(demo.url ? SITIO + demo.url.replace(SITIO, '') : liga)}">Copiar liga</button></div>
    <p class="pm-demo-nota">Es una demostración con datos de ejemplo: toca todo lo que quieras, nada se guarda ni se le manda a nadie.</p>
  </div>
  <div class="pm-tel"><iframe src="${esc(src)}" title="Demostración de ${esc(nombreDe(k))}" loading="lazy"></iframe></div>
</div></section>`;
}

// Página propia de la demo (pantalla completa o dentro del celular de la sección)
export function paginaDemo(k, demo, url) {
  const n = nonce(), dentro = url.searchParams.get('dentro') === '1', ref = url.searchParams.get('ref') || '';
  const color = colorDe(k), nombre = nombreDe(k), destino = paginaDe(k) + (/^[A-Za-z0-9_-]{2,40}$/.test(ref) ? `?ref=${encodeURIComponent(ref)}` : '');
  const titulo = `Demo de ${nombre}: pruébalo gratis, sin registrarte | Vorka México`;
  const html = `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(demo.texto)}">
<link rel="canonical" href="${SITIO}/tienda/demo/${k}/">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website"><meta property="og:site_name" content="Vorka México"><meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(`Prueba ${nombre} aquí mismo`)}"><meta property="og:description" content="${esc(demo.texto)}">
<meta property="og:url" content="${SITIO}/tienda/demo/${k}/"><meta property="og:image" content="${SITIO}/assets/tienda/v3/${k}-og.jpg"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font:16px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#141114;background:#F4F3F5;--pm:${color};--pm-s:color-mix(in srgb,${color} 11%,#fff);-webkit-font-smoothing:antialiased}
button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer}
.dm-cinta{position:relative;z-index:50;display:flex;align-items:center;gap:10px;justify-content:space-between;padding:9px 14px;background:#141114;color:#fff;font-size:13px;font-weight:600}
.dm-cinta a{color:#fff;opacity:.85;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
.dm-cinta span{display:flex;align-items:center;gap:7px}.dm-cinta span::before{content:"";width:8px;height:8px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 3px rgba(61,220,132,.25)}
#dm{max-width:480px;margin:0 auto;min-height:calc(100vh - 140px);background:#fff}
@media(min-width:520px){#dm{margin:24px auto;border-radius:28px;box-shadow:0 30px 70px -40px rgba(20,17,20,.4);overflow:hidden;min-height:0}}
.dm-fin{max-width:480px;margin:0 auto;padding:18px 16px 28px;text-align:center}
.dm-fin p{margin:0 0 10px;font-size:14px;color:#5d5860}
.dm-fin a{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 26px;border-radius:999px;background:var(--pm);color:#fff;font-weight:700;text-decoration:none}
.dm-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,30px);opacity:0;max-width:min(420px,calc(100% - 28px));background:#141114;color:#fff;padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.4;transition:.25s;z-index:60;pointer-events:none}
.dm-toast.si{opacity:1;transform:translate(-50%,0)}
${dentro ? '.dm-cinta{position:static;justify-content:center}.dm-cinta a{display:none}#dm{min-height:0}' : ''}
${demo.css || ''}
</style>
</head>
<body>
<div class="dm-cinta"><span>Demostración · nada se guarda</span><a href="${esc(destino)}">Ver ${esc(nombre)}</a></div>
<div id="dm">${demo.html || ''}</div>
<div class="dm-fin"><p>¿Te sirve? Así de fácil es tenerlo para ti.</p><a href="${esc(destino)}" target="_top">${esc(demo.cta || `Quiero ${nombre}`)}</a></div>
<div class="dm-toast" role="status" aria-live="polite"></div>
<script nonce="${n}">(()=>{const T=document.querySelector('.dm-toast');let t;window.avisoDemo=m=>{T.textContent=m;T.classList.add('si');clearTimeout(t);t=setTimeout(()=>T.classList.remove('si'),2600)};})();
${demo.js || ''}</script>
</body>
</html>`;
  const h = seguridad(n);
  h['content-security-policy'] = h['content-security-policy'].replace("frame-ancestors 'none'", "frame-ancestors 'self'");
  h['x-frame-options'] = 'SAMEORIGIN';
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', ...h } });
}
