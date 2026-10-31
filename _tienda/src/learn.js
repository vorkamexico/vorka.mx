// Vorka Learn (vorka.mx/learn/…): la rama editorial de Vorka México. Guías gratis para preparar exámenes de admisión.
// Plantilla propia, separada de la tienda: encabezado «Vorka Learn» con los exámenes, sin carrito, sin precios, sin cuenta
// de puntos ni scripts de compra. Comparte con el sitio la tipografía, los colores (vorka.css + los tokens claro/oscuro de
// /tienda/estilos.css, que el navegador ya tiene en caché) y el pie.
// Anuncios: solo aquí y apagados por defecto (src/anuncios.js). Con ADSENSE_CLIENT, la CSP de estas páginas se abre a Google.
import { PIE, VERSION, LOGO } from './marco.generado.js';
import { esc, nonce, seguridad, ESTILOS } from './paginas.js';
import { TEMA_HEAD } from './tema.js';
import { scriptAnuncios } from './anuncios.js';

const VERSION_CSS = [...ESTILOS].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
export const EXAMENES = [['paa', 'PAA'], ['unam', 'UNAM'], ['ecoems', 'ECOEMS'], ['prepa-ug', 'Prepa UG']];

// Wordmark: la V de Vorka (la misma del sitio) + «Vorka Learn» en texto
export const cabeceraLearn = (actual = '') => `<header class="lr-cab">
  <div class="marco lr-cab-in">
    <a class="lr-marca" href="/learn/" aria-label="Vorka Learn, inicio">${LOGO}<span>Vorka</span> <b>Learn</b></a>
    <nav class="lr-nav" aria-label="Exámenes">${EXAMENES.map(([k, t]) => `<a href="/learn/${k}/"${k === actual ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  </div>
</header>`;

const CSS = `<style>
:root[data-app="learn"]{--lr-col:720px}
.lr-cab{border-bottom:1px solid var(--line);background:var(--bg)}
.lr-cab-in{display:flex;align-items:center;justify-content:space-between;gap:12px 28px;flex-wrap:wrap;min-height:68px;padding-top:10px;padding-bottom:10px}
.lr-marca{display:inline-flex;align-items:center;gap:8px;font-size:19px;font-weight:750;letter-spacing:-.02em;color:var(--fg);text-decoration:none}
.lr-marca svg{width:22px;height:22px}.lr-marca b{font-weight:750;color:var(--morado)}
.lr-nav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin:0 -6px}.lr-nav::-webkit-scrollbar{display:none}
.lr-nav a{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border-radius:999px;font-size:15px;font-weight:600;color:var(--fg-2);text-decoration:none;white-space:nowrap}
.lr-nav a:hover{color:var(--fg);background:var(--bg-2)}.lr-nav a[aria-current="page"]{color:var(--fg);background:var(--bg-2)}
@media(max-width:560px){.lr-cab-in{flex-direction:column;align-items:flex-start;gap:6px}.lr-nav{width:calc(100% + 12px)}}
.lr-main{padding-bottom:clamp(40px,7vw,96px)}
.lr-col{max-width:var(--lr-col);margin:0 auto}.lr-col.lr-ancha{max-width:980px}
.lr-primero{margin-top:32px}.lr-kicker.lr-arriba{margin-top:clamp(28px,5vw,56px)}
.lr-migas{font-size:14px;color:var(--fg-2);margin:clamp(24px,4vw,48px) 0 0}.lr-migas ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:4px}
.lr-migas li:not(:last-child)::after{content:"›";margin-left:6px;color:var(--fg-3)}.lr-migas a{color:inherit;text-decoration:none}.lr-migas a:hover{color:var(--fg);text-decoration:underline}
.lr-kicker{display:inline-block;margin-top:22px;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--morado)}
.lr-h1{font-size:clamp(32px,5vw,50px);line-height:1.08;letter-spacing:-.035em;font-weight:780;margin:10px 0 0;text-wrap:balance}
.lr-lead{font-size:clamp(18px,2.2vw,21px);line-height:1.55;color:var(--fg-2);margin:18px 0 0;text-wrap:pretty}
.lr-meta{margin:20px 0 0;padding-bottom:22px;border-bottom:1px solid var(--line);font-size:14px;color:var(--fg-2)}
.lr-toc{margin:26px 0 0;border:1px solid var(--line);border-radius:16px;padding:4px 18px}
.lr-toc summary{cursor:pointer;min-height:48px;display:flex;align-items:center;font-weight:650;font-size:15px}
.lr-toc ol{margin:0 0 14px;padding-left:20px;display:grid;gap:6px;font-size:15px}.lr-toc a{color:var(--fg-2)}.lr-toc a:hover{color:var(--fg)}
.lr-art{font-size:18px;line-height:1.7;margin-top:8px}
.lr-art h2{font-size:clamp(24px,3vw,30px);letter-spacing:-.025em;line-height:1.2;margin:48px 0 14px;scroll-margin-top:24px}
.lr-art p{margin:0 0 16px}.lr-art a{color:var(--morado);text-decoration:underline;text-underline-offset:3px}
.lr-art .btn{color:var(--sobre-tinta,#fff);text-decoration:none}
.gu-lista{list-style:disc;padding-left:22px;margin:0 0 16px;display:grid;gap:8px}
.gu-pasos{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:14px;counter-reset:p}
.gu-pasos li{display:grid;grid-template-columns:34px 1fr;gap:2px 12px}
.gu-pasos li::before{counter-increment:p;content:counter(p);grid-row:span 2;width:28px;height:28px;margin-top:2px;border-radius:50%;border:1.5px solid var(--morado);color:var(--morado);display:grid;place-items:center;font-weight:750;font-size:14px}
.gu-pasos b{font-size:17.5px}.gu-pasos span{color:var(--fg-2);font-size:16.5px;line-height:1.6}
.gu-tabla-w{overflow-x:auto;margin:8px 0 16px}
.gu-tabla{width:100%;border-collapse:collapse;font-size:15.5px;line-height:1.5}
.gu-tabla th,.gu-tabla td{text-align:left;padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top}
.gu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5px solid var(--fg)}.gu-tabla tbody th{font-weight:650}
@media(max-width:640px){.gu-tabla{font-size:14.5px}}
.lr-art .gu-nota,.gu-nota{font-size:14.5px;color:var(--fg-2)}
.gu-caja{margin:8px 0 18px;padding:4px 0 4px 20px;border-left:3px solid var(--morado)}
.gu-caja > b{display:block;margin-bottom:6px}.gu-caja p:last-child,.gu-caja ul:last-child{margin-bottom:0}
.gu-ej{margin:10px 0 20px;padding:18px 20px;border-radius:16px;border:1.5px dashed var(--line-2)}
.gu-ej-t{display:inline-block;font-size:12.5px;font-weight:700;color:var(--morado)}
.lr-art .gu-ej-p{margin:10px 0;font-weight:600}
.gu-ej-o{list-style:none;padding:0;margin:0 0 10px;display:grid;gap:6px}.gu-ej-o li{display:flex;gap:10px;align-items:center;font-size:16.5px}
.gu-ej-o span{width:26px;height:26px;border-radius:8px;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.gu-ej summary{cursor:pointer;font-weight:650;color:var(--morado)}.lr-art .gu-ej details p{margin:8px 0 0}
.lr-art .t-faq{margin-top:6px}.lr-art .t-faq div{font-size:16.5px}
.lr-toc ol,.gu-fuentes{list-style:decimal}.gu-lista li,.lr-art ol.gu-fuentes li{display:list-item}
.gu-fuentes{padding-left:22px;display:grid;gap:6px;font-size:15.5px;line-height:1.55}.gu-fuentes a{word-break:break-word}
.lr-final{margin:44px 0 0;padding:28px 0;border-top:1.5px solid var(--fg);border-bottom:1px solid var(--line)}
.lr-art .lr-final p{margin:0 0 16px;font-size:17px;color:var(--fg-2)}.lr-final .lr-final-t{display:block;font-size:22px;font-weight:750;letter-spacing:-.02em;color:var(--fg);margin-bottom:6px}
.gu-compartir{margin:28px 0 8px;display:grid;gap:12px}.lr-art .gu-compartir p{margin:0;font-size:16px}
.gu-comp-bot{display:flex;flex-wrap:wrap;gap:10px}.lr-art .gu-comp-bot a{display:inline-flex;align-items:center;min-height:44px;padding:10px 16px;border-radius:999px;font-weight:700;text-decoration:none;font-size:15px}
.lr-art .gu-wa{background:#0b7a3b;color:#fff}.lr-art .gu-fb{background:#1b4fb3;color:#fff}
.lr-sigue{margin-top:clamp(48px,7vw,80px);padding-top:clamp(32px,5vw,56px);border-top:1px solid var(--line)}
.lr-sigue-t{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-2);margin:0}
.lr-h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.03em;line-height:1.15;margin:10px 0 0}
.gu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:0 32px;margin-top:18px}
.gu-card{display:block;padding:20px 0;border-top:1px solid var(--line);color:inherit;text-decoration:none}
.gu-card h3{font-size:19px;letter-spacing:-.02em;line-height:1.3;margin:0 0 6px}.gu-card:hover h3{color:var(--morado);text-decoration:underline;text-underline-offset:3px}
.gu-card p{color:var(--fg-2);font-size:15.5px;line-height:1.55;margin:0}
.gu-card em{display:none}
.lr-grupo{margin-top:clamp(40px,6vw,64px)}.lr-grupo-cab{display:flex;justify-content:space-between;align-items:baseline;gap:8px 20px;flex-wrap:wrap}
.lr-grupo-cab a{font-weight:650;font-size:15px;color:var(--morado)}
.lr-grupo p.lr-grupo-lead{color:var(--fg-2);margin:8px 0 0;font-size:16.5px;max-width:720px}
.lr-nota{margin-top:40px;font-size:14px;color:var(--fg-2);line-height:1.6}
.lr-anuncio{margin:36px 0;min-height:290px;display:grid;align-content:start;gap:6px;contain:layout}
.lr-anuncio-t{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-3)}
.lr-ins{display:block;min-height:250px;width:100%}
</style>`;

/**
 * paginaLearn({ titulo, descripcion, ruta, cuerpo, head?, imagen?, ogTipo?, actual?, anuncios? }) → Response
 * anuncios: la configuración de configAnuncios(env) o null. Con ella se agrega el script de AdSense y se abre la CSP.
 */
export function paginaLearn({ titulo, descripcion, ruta, cuerpo, head = '', imagen, ogTipo = 'website', actual = '', anuncios = null, status = 200 }) {
  const n = nonce();
  const og = imagen || 'https://vorka.mx/img/ciudades/cdmx-reforma-1600.webp';
  const html = `<!doctype html>
<html lang="es-MX" data-app="learn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script nonce="${n}">${TEMA_HEAD}</script>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="https://vorka.mx${esc(ruta)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBFAF8" data-claro="#FBFAF8" data-oscuro="#141216">
<meta property="og:type" content="${ogTipo}">
<meta property="og:site_name" content="Vorka Learn · Vorka México">
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
${CSS}${head}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
${cabeceraLearn(actual)}
<main id="contenido" class="lr-main">
${cuerpo}
</main>
${PIE.replace(/<script /g, `<script nonce="${n}" `)}${scriptAnuncios(anuncios, n, cuerpo)}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n, { anuncios: !!anuncios }) },
  });
}
