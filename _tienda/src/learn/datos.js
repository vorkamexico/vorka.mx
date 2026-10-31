// Vorka Learn · lo que las piezas nuevas (encabezado, búsqueda, acerca, RSS, imágenes) leen de los datos de las guías.
// Los datos siguen en src/simulador/guias.js (GUIAS, SIMS); aquí solo se leen, nunca se copian ni se mueven, así una
// sección nueva (p. ej. Finanzas personales) aparece sola en el menú, la búsqueda, el RSS y el sitemap.
// Nota: guias.js → learn.js → encabezado.js → este archivo → guias.js es un ciclo de módulos a propósito; funciona porque
// aquí nada usa los datos al cargar el módulo, solo dentro de funciones (al atender una visita).
import { GUIAS, SIMS, guiasDe, rutaGuia, rutaIndice, textoDeGuia, ACTUALIZADO } from '../simulador/guias.js';
import { aspecto } from './secciones.js';

export { GUIAS, SIMS, rutaGuia, rutaIndice, textoDeGuia, ACTUALIZADO };

// Las secciones con al menos una guía, en el orden de SIMS: { sim, clave, nombre, corto, grupo, ruta, n }
export const secciones = () => Object.keys(SIMS).filter(s => guiasDe(s).length).map(sim => {
  const s = SIMS[sim], x = aspecto(s.clave);
  return { sim, clave: s.clave, nombre: s.seccion || s.examen || s.nombre, corto: x.corto !== 'Learn' ? x.corto : (s.examen || s.nombre), grupo: s.grupo || x.grupo, ruta: rutaIndice(sim), n: guiasDe(sim).length };
});
export const claveDe = x => SIMS[x.sim]?.clave || '';
export const seccionDe = clave => secciones().find(s => s.clave === clave) || null;

// Minutos de lectura (200 palabras por minuto, como lee alguien que estudia, no que hojea)
export const palabras = t => (String(t).match(/[\p{L}\p{N}]+/gu) || []).length;
export const minutosDe = x => Math.max(1, Math.round(palabras(`${x.h1} ${textoDeGuia(x)} ${(x.faq || []).map(f => f.p).join(' ')}`) / 200));

// Imagen para compartir (1200×630, PNG) de cada guía, de cada sección y de la portada. Las genera
// herramientas/learn-og/generar.mjs en assets/learn/og/ (la sirve el sitio estático de vorka.mx, no el Worker).
export const OG_DIR = '/assets/learn/og';
export const ogGuia = x => `${OG_DIR}/${claveDe(x)}-${x.slug}.png`;
export const ogSeccion = clave => `${OG_DIR}/${clave}.png`;
export const OG_LEARN = `${OG_DIR}/learn.png`;
