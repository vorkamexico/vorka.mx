// Vorka Learn · piezas de contenido y de SEO que comparten todas las secciones (exámenes, finanzas y las que vengan).
// Este archivo NO importa datos de las guías: las secciones (src/simulador/guias.js, src/learn-finanzas.js…) usan estas
// piezas al cargar sus arreglos de datos, así que tiene que estar listo antes que ellas (ver el ciclo en learn/datos.js).
import { esc } from '../paginas.js';

export const SITIO = 'https://vorka.mx';
export const RUTA_LEARN = '/learn/';
export const RUTA_BUSCAR = '/learn/buscar/';
export const RUTA_ACERCA = '/learn/acerca/';
export const RUTA_FEED = '/learn/feed.xml';

// Contenido: párrafo, lista, pasos numerados, tabla, nota, caja de dato/consejo y ligas
export const p = t => `<p>${t}</p>`;
export const ul = l => `<ul class="gu-lista">${l.map(x => `<li>${x}</li>`).join('')}</ul>`;
export const ol = l => `<ol class="gu-pasos">${l.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>`;
export const tabla = (cab, filas, nota = '') => `<div class="gu-tabla-w"><table class="gu-tabla"><thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.map(([a, ...r]) => `<tr><th scope="row">${a}</th>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${nota ? `<p class="gu-nota">${nota}</p>` : ''}`;
export const nota = t => `<p class="gu-nota">${t}</p>`;
export const caja = (t, d) => `<div class="gu-caja"><b>${t}</b>${d}</div>`;
export const a = (href, t) => `<a href="${href}">${t}</a>`;
export const ext = (href, t) => `<a href="${href}" rel="noopener">${t}</a>`;
export const textoPlano = h => h.replace(/<[^>]+>/g, '');

// SEO: JSON-LD, organización, migas y títulos con la marca
export const ld = x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`;
export const ORG = { '@type': 'Organization', name: 'Vorka México', url: `${SITIO}/`, logo: { '@type': 'ImageObject', url: `${SITIO}/vorka-logo.png` } };
// La marca editorial: Vorka Learn, parte de Vorka México
export const LEARN = { '@type': 'Organization', name: 'Vorka Learn', url: `${SITIO}/learn/`, parentOrganization: ORG };
export const SITIO_LEARN = { '@type': 'WebSite', name: 'Vorka Learn', url: `${SITIO}/learn/`, publisher: ORG,
  potentialAction: { '@type': 'SearchAction', target: `${SITIO}${RUTA_BUSCAR}?q={q}`, 'query-input': 'required name=q' } };
export const migas = l => `<nav class="lr-migas" aria-label="Migas de pan"><ol>${l.map(([t, href], i) => `<li>${i < l.length - 1 ? `<a href="${href}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`}</li>`).join('')}</ol></nav>`;
export const migasLd = l => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: l.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITIO}${href}` })) });
// Título con la marca Learn (sin la marca si no cabe en 60 caracteres)
const SUFIJO = ' | Vorka Learn';
export const conMarca = t => (t + SUFIJO).length <= 60 ? t + SUFIJO : t;
// Minutos de lectura (200 palabras por minuto)
export const palabras = t => (String(t).match(/[\p{L}\p{N}]+/gu) || []).length;
export const minutosDeTexto = t => Math.max(1, Math.round(palabras(t) / 200));
// Tarjeta simple (sin dibujo), para quien no tenga sección: la de Learn lleva miniatura (learn/paginas.js › tarjeta)
export const tarjeta = (href, t, d) => `<a class="gu-card" href="${href}"><span class="gu-card-c"><h3>${esc(t)}</h3><p>${esc(d)}</p></span></a>`;
