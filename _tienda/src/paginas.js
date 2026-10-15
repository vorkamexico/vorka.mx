// Marco HTML de las páginas de la tienda: mismo menú, pie y CSS (v3) que el resto de vorka.mx.
// El menú y el pie vienen de _sitio/partes.py vía marco.generado.js (python3 _tienda/marco.py).
import { NAV, PIE, VERSION, CSS_TIENDA } from './marco.generado.js';
import { esc } from './correo.js';

// Versión del CSS de la tienda según su contenido (cambia sola cuando se edita)
export const ESTILOS = CSS_TIENDA;
const VERSION_CSS = [...CSS_TIENDA].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

export { esc };
export const nonce = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));

// CSP estricta solo en las rutas de la tienda (el resto del sitio no pasa por el Worker).
// form-action incluye Stripe porque /api/checkout redirige al pago con un 303.
export function seguridad(n) {
  return {
    'content-security-policy': [
      "default-src 'self'",
      `script-src 'self' 'nonce-${n}' https://static.cloudflareinsights.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://cloudflareinsights.com",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * pagina({ titulo, descripcion, ruta, cuerpo, head?, script?, noindex?, status?, headers? }) → Response
 * `script` va inline con nonce; `head` acepta JSON-LD u otras etiquetas.
 */
export function pagina({ titulo, descripcion = '', ruta, cuerpo, head = '', script = '', noindex = false, status = 200, headers = {}, imagen }) {
  const n = nonce();
  const og = imagen || 'https://vorka.mx/img/ciudades/cdmx-reforma-1600.webp';
  const html = `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="https://vorka.mx${esc(ruta)}">`}
<meta name="theme-color" content="#FBFAF8">
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
${PIE.replace(/<script /g, `<script nonce="${n}" `)}${script ? `<script nonce="${n}">${script}</script>` : ''}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n), ...headers },
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
