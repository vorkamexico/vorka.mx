// Vorka Learn (vorka.mx/learn/…): la rama editorial de Vorka México. Guías gratis con fuentes oficiales: exámenes de
// admisión (src/simulador/guias.js) y finanzas personales (src/learn-finanzas.js). Para agregar una sección nueva
// (p. ej. «Negocio pequeño»), los pasos están al inicio de src/learn/datos.js.
// Plantilla propia, separada de la tienda: el encabezado es la misma píldora de la tienda (logo V + «Vorka Learn», lupa,
// botón «Practica» y menú; src/learn/encabezado.js), sin carrito, sin precios, sin cuenta de puntos ni scripts de compra.
// Comparte con el sitio la tipografía, los tokens claro/oscuro (vorka.css + /tienda/estilos.css, que el navegador ya tiene
// en caché) y el pie. Cada sección tiene su color y su dibujo (src/learn/secciones.js y arte.js).
// Las piezas nuevas viven en src/learn/: estilos, encabezado, lectura (progreso, «subir», índice), páginas (portada,
// índice, guía) y extra (búsqueda, acerca, RSS, dibujos). Los datos de las guías siguen en src/simulador/guias.js.
// Anuncios: solo aquí y apagados por defecto (src/anuncios.js). Con ADSENSE_CLIENT, la CSP de estas páginas se abre a Google.
import { PIE, VERSION } from './marco.generado.js';
import { esc, nonce, seguridad, ESTILOS } from './paginas.js';
import { TEMA_HEAD } from './tema.js';
import { scriptAnuncios } from './anuncios.js';
// Piezas compartidas por las secciones (van primero: los archivos de datos las usan al cargar)
export { SITIO, RUTA_LEARN, p, ul, ol, tabla, nota, caja, a, ext, ld, ORG, LEARN, SITIO_LEARN, textoPlano, tarjeta, migas, migasLd, conMarca } from './learn/piezas.js';
import { cssLearn } from './learn/estilos.js';
import { encabezadoLearn } from './learn/encabezado.js';
import { BARRA, SUBIR, SCRIPT_LEARN } from './learn/lectura.js';
// La plantilla de artículo de todas las secciones
export { paginaArticulo, compartir } from './learn/articulo.js';

const VERSION_CSS = [...ESTILOS].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
let CSS = null;   // se arma una vez por Worker (tokens de cada sección + estilos)
const absoluta = u => /^https?:\/\//.test(u) ? u : `https://vorka.mx${u}`;

/**
 * paginaLearn({ titulo, descripcion, ruta, cuerpo, head?, imagen?, imagenAlt?, ogTipo?, actual?, seccion?, anuncios?,
 *               lectura?, noindex?, status? }) → Response
 * actual: la sección (clave: paa, unam…) o la página (buscar, acerca) que se marca en el menú; da también el color.
 * lectura: true en las guías (barra de progreso). noindex: páginas que no van a Google (búsqueda).
 * anuncios: la configuración de configAnuncios(env) o null. Con ella se agrega el script de AdSense y se abre la CSP.
 */
export function paginaLearn({ titulo, descripcion, ruta, cuerpo, head = '', imagen, imagenAlt = '', ogTipo = 'website', actual = '', seccion = actual, anuncios = null, lectura = false, noindex = false, status = 200 }) {
  const n = nonce();
  CSS ??= cssLearn();
  const og = absoluta(imagen || '/assets/learn/og/learn.png');
  const html = `<!doctype html>
<html lang="es-MX" data-app="learn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script nonce="${n}">${TEMA_HEAD}</script>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="https://vorka.mx${esc(ruta)}">`}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBFAF8" data-claro="#FBFAF8" data-oscuro="#141216">
<meta property="og:type" content="${ogTipo}">
<meta property="og:site_name" content="Vorka Learn · Vorka México">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="https://vorka.mx${esc(ruta)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imagenAlt || titulo)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="Vorka Learn" href="/learn/feed.xml">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/vorka-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/vorka.css?v=${VERSION}">
<link rel="stylesheet" href="/tienda/estilos.css?v=${VERSION_CSS}">
${CSS}${head}</head>
<body class="lr-s-${esc(seccion || 'learn')}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
${lectura ? BARRA : ''}${encabezadoLearn(actual)}
<main id="contenido" class="lr-main">
${cuerpo}
</main>
${SUBIR}
${PIE.replace(/<script /g, `<script nonce="${n}" `)}<script nonce="${n}">${SCRIPT_LEARN}</script>${scriptAnuncios(anuncios, n, cuerpo)}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...seguridad(n, { anuncios: !!anuncios }) },
  });
}
