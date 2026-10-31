// Vorka Learn · lo común de una sección de «tema» (no examen): rutas, título con la marca, texto para la búsqueda y la
// página de cada artículo con la plantilla común (paginaArticulo). La usan src/learn-negocio.js y src/learn-camino.js;
// Finanzas personales (src/learn-finanzas.js) es anterior y lo hace a mano con el mismo resultado.
//   const T = crearTema({ seccion: { clave, nombre, corto, indice }, articulos, llamados, actualizado, actualizadoTxt,
//                         notaFuentes, notaPie, compartirTexto, relTitulo, imagen? })
//   T.ruta · T.rutaDe(x) · T.articulo(slug) · T.titulo(x) · T.tituloIndice() · T.urls() · T.textoDe(x) · T.llamadoDe(x)
//   T.pagina(slug, anuncios) → Response | null
// Cada artículo: { slug, llamado (clave de llamados), titulo, descripcion, h1, lead, secciones: [{ h2, html }], faq,
// fuentes: [{ nombre, url }], relacionadas: [slug…] }.
import { esc } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { RUTA_LEARN, conMarca, textoPlano } from './piezas.js';
import { paginaArticulo } from './articulo.js';

// El llamado final (uno por artículo): <aside class="lr-final">. Son declaraciones de función (no const) a propósito: los
// archivos de datos las llaman al cargar y pueden cargarse dentro del ciclo de módulos de Learn (ver learn/datos.js).
export function llamadoFinal(etiqueta, t, d, href, boton) {
  return `<aside class="lr-final" aria-label="${esc(etiqueta)}"><p><b class="lr-final-t">${t}</b>${d}</p>
  <a class="btn tinta" href="${href}">${boton} ${FLECHA}</a></aside>`;
}

export function crearTema(o) {
  const { seccion, articulos, llamados } = o;
  const ruta = `${RUTA_LEARN}${seccion.clave}/`;
  const rutaDe = x => `${ruta}${x.slug}/`;
  const articulo = slug => articulos.find(x => x.slug === slug) || null;
  const titulo = x => conMarca(x.titulo);
  const textoDe = x => [x.lead, ...x.secciones.map(y => textoPlano(y.html)), ...(x.faq || []).map(f => f.r)].join(' ');
  const llamadoDe = x => llamados[x.llamado];
  function pagina(slug, anuncios = null) {
    const x = articulo(slug);
    if (!x) return null;
    const r = rutaDe(x);
    // Sigue leyendo: las que pide el artículo y, si faltan, las demás de la sección
    const rel = [...new Set([...(x.relacionadas || []), ...articulos.map(y => y.slug)])].filter(s => s !== x.slug).map(articulo).filter(Boolean).slice(0, 3)
      .map(y => ({ href: rutaDe(y), h1: y.h1, descripcion: y.descripcion }));
    return paginaArticulo(x, {
      ruta: r, titulo: titulo(x), lugares: [['Vorka Learn', RUTA_LEARN], [seccion.nombre, ruta], [x.h1, r]],
      kicker: `Guía · ${seccion.nombre}`, imagen: o.imagen, actual: seccion.clave, anuncios, actualizado: o.actualizado, actualizadoTxt: o.actualizadoTxt,
      notaFuentes: o.notaFuentes, llamado: llamadoDe(x), compartirTexto: o.compartirTexto, rel, relTitulo: o.relTitulo, notaPie: o.notaPie,
    });
  }
  return { ruta, rutaDe, articulo, titulo, tituloIndice: () => conMarca(seccion.indice.titulo), urls: () => [ruta, ...articulos.map(rutaDe)], textoDe, llamadoDe, pagina };
}
