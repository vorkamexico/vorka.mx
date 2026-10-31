// Vorka Learn · tarjetas: miniatura con el dibujo de la sección (SVG con caché, carga diferida y medidas fijas para que
// la página no brinque), etiqueta de color, título, descripción y minutos de lectura.
import { esc } from '../paginas.js';
import { iconoDe } from './encabezado.js';
import { minutosDe } from './datos.js';

export const V_ARTE = '1';   // súbelo si cambian los dibujos (las miniaturas se guardan una semana en caché)
export const rutaArte = (clave, semilla = '') => `/learn/arte/${clave}${semilla ? `/${semilla}` : ''}.svg?v=${V_ARTE}`;
export const etiqueta = (clave, texto) => `<span class="lr-etq">${iconoDe(clave)}${esc(texto)}</span>`;
const img = (clave, semilla) => `<span class="gu-card-img"><img src="${rutaArte(clave, semilla)}" width="480" height="270" alt="" loading="lazy" decoding="async"></span>`;

// a: un artículo del catálogo (learn/datos.js › articulos())
export const tarjetaArticulo = a => `<a class="gu-card lr-s-${a.clave}" href="${a.ruta}">${img(a.clave, a.slug)}<span class="gu-card-c">${etiqueta(a.clave, a.s.corto || a.s.nombre)}<h3>${esc(a.x.h1)}</h3><p>${esc(a.x.descripcion)}</p><span class="gu-card-min">${minutosDe(a)} min de lectura</span></span></a>`;
// Una página que no es artículo (otra sección, la PAA en cada universidad)
export const tarjeta = (href, t, d, clave, { semilla = '', etq = '' } = {}) => `<a class="gu-card lr-s-${clave}" href="${href}">${img(clave, semilla)}<span class="gu-card-c">${etq ? etiqueta(clave, etq) : ''}<h3>${esc(t)}</h3><p>${esc(d)}</p></span></a>`;
