// Vorka Learn · el catálogo: qué secciones hay y qué artículos tiene cada una, leído de los archivos de datos
// (src/simulador/guias.js para los exámenes, src/learn-finanzas.js para Finanzas personales). Aquí no se copia ni se
// mueve ningún dato; el menú, la portada, los índices, la búsqueda, el RSS, el sitemap y las imágenes OG leen de aquí.
//
// ── CÓMO AGREGAR UNA SECCIÓN NUEVA (p. ej. «Negocio pequeño», clave «negocio») ──────────────────────────────────────
//  1. Datos: un archivo src/learn-<clave>.js como src/learn-negocio.js o src/learn-camino.js: la sección { clave, nombre,
//     corto, indice: { titulo, descripcion, h1, lead } }, sus artículos [{ slug, llamado, titulo, descripcion, h1, lead,
//     secciones: [{ h2, html }], faq, fuentes, relacionadas }], sus llamados finales (llamadoFinal) y
//     T = crearTema({...}) de src/learn/tema.js, que da rutas, texto para la búsqueda y la página de cada artículo con la
//     plantilla común (dibujo, minutos, índice, fuentes, un solo llamado final, compartir, «Sigue leyendo»). Usa las
//     piezas p, ul, ol, tabla, nota, caja, a, ext de src/learn/piezas.js. (Finanzas es anterior y lo hace a mano.)
//  2. Catálogo: agrégala a TEMAS() abajo con temaDe(). Con eso aparece sola en el menú, la portada, su índice
//     /learn/<clave>/ (paginaIndiceSeccion), la búsqueda, el RSS y la lista de imágenes OG.
//  3. Rutas y sitemap: agrega su T a TEMAS_T en src/simulador/guias.js (rutasLearn y urlsGuias lo leen de ahí).
//  4. Aspecto: en src/learn/secciones.js › SECCIONES, su color (a, b, t, to, s, so), grupo 'tema' y un motivo; si quieres
//     un dibujo propio, agrégalo a MOTIVOS en src/learn/arte.js y su ícono en ICONO_SECCION de src/learn/encabezado.js.
//  5. Imágenes OG: node herramientas/learn-og/generar.mjs --faltantes   (la prueba falla si falta alguna).
//  6. Pruebas: npx vitest run (test/learn-v2.test.js recorre todas las secciones del catálogo).
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Nota: guias.js → learn.js → encabezado.js → este archivo → guias.js es un ciclo de módulos a propósito; funciona
// porque aquí nada lee los datos al cargar el módulo, solo dentro de funciones (al atender una visita).
import { GUIAS, SIMS, guiasDe, rutaGuia, rutaIndice, textoDeGuia, tituloIndice, ACTUALIZADO } from '../simulador/guias.js';
import { FINANZAS, ARTICULOS_FINANZAS, RUTA_FINANZAS, rutaArticuloFinanzas, tituloIndiceFinanzas, textoDeArticulo, AVISO_FINANZAS } from '../learn-finanzas.js';
import { NEGOCIO, TEMA_NEGOCIO, ARTICULOS_NEGOCIO, AVISO_NEGOCIO } from '../learn-negocio.js';
import { CAMINO, TEMA_CAMINO, ARTICULOS_CAMINO } from '../learn-camino.js';
import { aspecto } from './secciones.js';
import { minutosDeTexto } from './piezas.js';

export { GUIAS, SIMS, rutaGuia, rutaIndice, textoDeGuia, ACTUALIZADO };

// Secciones que no son exámenes (no tienen simulador). Para agregar una, ver arriba. Las que usan src/learn/tema.js
// (crearTema) se registran con temaDe(); su objeto T trae ruta, rutaDe, textoDe y tituloIndice.
const temaDe = (s, T, articulos, aviso) => ({ clave: s.clave, nombre: s.nombre, corto: s.corto, ruta: T.ruta, indice: s.indice, titulo: T.tituloIndice(),
  articulos, rutaDe: T.rutaDe, textoDe: T.textoDe, aviso });
const TEMAS = () => [
  temaDe(CAMINO, TEMA_CAMINO, ARTICULOS_CAMINO, 'Guías informativas: confirma requisitos, montos y fechas en la convocatoria vigente. No estamos afiliados a la Coordinación Nacional de Becas, a la SEP, a las universidades que mencionamos ni al IMCO.'),
  { clave: FINANZAS.clave, nombre: FINANZAS.nombre, corto: FINANZAS.corto, ruta: RUTA_FINANZAS, indice: FINANZAS.indice, titulo: tituloIndiceFinanzas(),
    articulos: ARTICULOS_FINANZAS, rutaDe: rutaArticuloFinanzas, textoDe: textoDeArticulo,
    aviso: `${AVISO_FINANZAS} No estamos afiliados a CONDUSEF, al Banco de México ni a ninguna institución financiera, y no recomendamos bancos, tarjetas ni productos de terceros.` },
  temaDe(NEGOCIO, TEMA_NEGOCIO, ARTICULOS_NEGOCIO, `${AVISO_NEGOCIO} No estamos afiliados al INEGI, a PROFECO ni al SAT.`),
];

// Las secciones con al menos un artículo, exámenes primero:
// { clave, nombre, corto, grupo ('examen' | 'tema'), ruta, indice, titulo, articulos, rutaDe, textoDe, aviso, sim?, n }
let CACHE = null;
export const secciones = () => CACHE ??= [
  ...Object.keys(SIMS).filter(sim => guiasDe(sim).length).map(sim => { const s = SIMS[sim];
    return { sim, clave: s.clave, nombre: s.examen, corto: s.examen, grupo: 'examen', ruta: rutaIndice(sim), indice: s.indice, titulo: tituloIndice(sim),
      articulos: guiasDe(sim), rutaDe: rutaGuia, textoDe: textoDeGuia, aviso: s.aviso, simulador: { href: `/${sim}/`, titulo: s.titulo } }; }),
  ...TEMAS().map(t => ({ grupo: aspecto(t.clave).grupo === 'examen' ? 'tema' : aspecto(t.clave).grupo, ...t })),
].filter(s => s.articulos.length).map(s => ({ ...s, n: s.articulos.length }));
export const seccionDe = clave => secciones().find(s => s.clave === clave) || null;

// Todos los artículos de todas las secciones: { x, s (su sección), ruta, clave, slug }
export const articulos = () => secciones().flatMap(s => s.articulos.map(x => ({ x, s, ruta: s.rutaDe(x), clave: s.clave, slug: x.slug })));
export const articuloEn = ruta => articulos().find(a => a.ruta === ruta) || null;
export const claveDe = x => SIMS[x.sim]?.clave || articulos().find(a => a.x === x)?.clave || '';
export const textoDe = a => a.s.textoDe(a.x);

// Minutos de lectura (200 palabras por minuto, como lee alguien que estudia, no que hojea)
export const minutosDe = a => minutosDeTexto(`${a.x.h1} ${textoDe(a)} ${(a.x.faq || []).map(f => f.p).join(' ')}`);

// Imagen para compartir (1200×630, PNG) de cada artículo, de cada sección y de la portada. Las genera
// herramientas/learn-og/generar.mjs en assets/learn/og/ (la sirve el sitio estático de vorka.mx, no el Worker).
export const OG_DIR = '/assets/learn/og';
export const ogArticulo = a => `${OG_DIR}/${a.clave}-${a.slug}.png`;
export const ogSeccion = clave => `${OG_DIR}/${clave}.png`;
export const OG_LEARN = `${OG_DIR}/learn.png`;
