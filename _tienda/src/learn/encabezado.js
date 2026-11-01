// Vorka Learn · encabezado y menú. Misma pieza que la tienda (píldora .nav.t-navs de vorka.css/tienda.css, que vorka.js
// ya sabe abrir y cerrar: aria-expanded, Esc, bloqueo del scroll), con lo útil para quien estudia:
//   logo V + «Vorka Learn» · secciones (en computadora) · lupa → /learn/buscar/ · botón «Practica» · menú
// «Practica» es el botón destacado: quien lee una guía de examen casi siempre quiere ponerse a prueba. En una guía o
// índice de un examen lleva directo a su simulador; en el resto de Learn, a la sección «Practica» de la portada (los
// cuatro simuladores). No es un llamado de venta dentro del artículo: el artículo sigue con un solo llamado, al final.
// El menú (celular y computadora): buscador, secciones con su color, Practica, Acerca de Vorka Learn, apariencia
// (claro/oscuro) y, discretos, la Tienda Vorka y Vorka México.
import { LOGO, FLECHA } from '../marco.generado.js';
import { esc, ICONOS } from '../paginas.js';
import { selectorTema } from '../tema.js';
import { aspecto } from './secciones.js';
import { secciones } from './datos.js';

import { RUTA_BUSCAR, RUTA_ACERCA } from './piezas.js';
export { RUTA_BUSCAR, RUTA_ACERCA };
export const RUTA_PRACTICA = '/learn/#practica';

// Íconos de línea (24×24) por dibujo de sección, para el menú y las etiquetas
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
export const ICONO_SECCION = {
  hoja: I('<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="9.5" cy="9" r="1.4"/><circle cx="14.5" cy="9" r="1.4" fill="currentColor"/><circle cx="9.5" cy="14" r="1.4" fill="currentColor"/><circle cx="14.5" cy="14" r="1.4"/>'),
  libros: I('<path d="M12 4 2.5 8.5 12 13l9.5-4.5z"/><path d="M6.5 10.5v4.2c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.2M20 9v6"/>'),
  mapa: I('<path d="M12 21s6-5.3 6-10.5a6 6 0 1 0-12 0C6 15.7 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>'),
  cuaderno: I('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="m8.5 9 1.5 1.5L13 7.5M8.5 15h7"/>'),
  monedas: I('<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7M4 11v4c0 1.4 2.2 2.5 5 2.5 1 0 2-.1 2.8-.4"/><path d="m14 18 3-3 2 2 3-4"/>'),
  tienda: I('<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5.5 12v8h13v-8M10 20v-4.5h4V20"/>'),
  senal: I('<path d="M12 21V3"/><path d="M12 5h6.5l2 2.25-2 2.25H12M12 12H5.5l-2 2.25 2 2.25H12"/>'),
  celular: I('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><rect x="9" y="6.5" width="2.5" height="2.5" rx=".6"/><rect x="12.5" y="6.5" width="2.5" height="2.5" rx=".6"/><rect x="9" y="10.5" width="2.5" height="2.5" rx=".6"/>'),
  libro: I('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"/>'),
};
export const iconoDe = clave => ICONO_SECCION[aspecto(clave).motivo] || ICONO_SECCION.libro;
const ICONO_PRACTICA = I('<path d="M9 11.5 11.5 14 16 9"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/>');

// A dónde lleva «Practica» desde una sección: al simulador de ese examen (si la sección tiene simulador) o a la portada
export const practicaDe = (actual = '') => {
  const s = secciones().find(x => x.clave === actual);
  return s?.simulador ? { href: s.simulador.href, etiqueta: `Practica con el simulador de ${s.corto}` } : { href: RUTA_PRACTICA, etiqueta: 'Practica con un simulador de examen' };
};

const enlaceSeccion = (s, actual) => `<li><a class="lr-m-sec lr-s-${s.clave}" href="${s.ruta}"${s.clave === actual ? ' aria-current="page"' : ''}><span class="lr-m-ico">${iconoDe(s.clave)}</span><span class="lr-m-txt"><b>${esc(s.nombre)}</b><small>${s.n} ${s.n === 1 ? 'guía' : 'guías'}</small></span><span class="lr-m-fl" aria-hidden="true">›</span></a></li>`;

export function encabezadoLearn(actual = '') {
  const l = secciones(), examenes = l.filter(s => s.grupo === 'examen'), temas = l.filter(s => s.grupo !== 'examen');
  const pr = practicaDe(actual);
  return `<header class="nav t-navs lr-navs">
  <div class="nav-in">
    <a class="marca" href="/learn/" aria-label="Vorka Learn, inicio">${LOGO}Vorka <b>Learn</b></a>
    <nav class="nav-links" aria-label="Secciones de Vorka Learn">${l.map(s => `<a href="${s.ruta}"${s.clave === actual ? ' aria-current="page"' : ''}>${esc(s.corto)}</a>`).join('')}</nav>
    <a class="t-nav-ico lr-lupa" href="${RUTA_BUSCAR}"${actual === 'buscar' ? ' aria-current="page"' : ''} aria-label="Buscar en Vorka Learn" title="Buscar">${ICONOS.buscar}</a>
    <a class="btn acento t-pastilla lr-practica" href="${pr.href}" aria-label="${esc(pr.etiqueta)}">${ICONO_PRACTICA}<span>Practica</span></a>
    <button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil"><i></i></button>
  </div>
</header>
<div class="menu-movil lr-menu" id="menu-movil" role="dialog" aria-modal="true" aria-label="Menú de Vorka Learn" tabindex="-1">
  <form class="lr-m-buscar" action="${RUTA_BUSCAR}" method="get" role="search"><label class="vh" for="lr-m-q">Buscar en Vorka Learn</label><input id="lr-m-q" name="q" type="search" placeholder="Busca una guía o un tema" enterkeyhint="search" maxlength="80" autocomplete="off"><button type="submit" aria-label="Buscar">${ICONOS.buscar}</button></form>
  ${examenes.length ? `<p class="lr-m-t">Exámenes de admisión</p><ul class="lr-m-secs">${examenes.map(s => enlaceSeccion(s, actual)).join('')}</ul>` : ''}
  ${temas.length ? `<p class="lr-m-t">Temas</p><ul class="lr-m-secs">${temas.map(s => enlaceSeccion(s, actual)).join('')}</ul>` : ''}
  <a class="btn acento lr-m-practica" href="${pr.href}">${esc(pr.etiqueta)} ${FLECHA}</a>
  <ul class="lr-m-mas">
    <li><a href="/learn/">Todas las guías</a></li>
    <li><a href="${RUTA_ACERCA}"${actual === 'acerca' ? ' aria-current="page"' : ''}>Acerca de Vorka Learn</a></li>
    <li class="lr-m-discreto"><a href="/tienda/">Tienda Vorka</a><a href="/">Vorka México</a></li>
  </ul>
  <div class="lr-m-tema"><span>Apariencia</span>${selectorTema({ clase: 'lr-tema' })}</div>
</div>`;
}
