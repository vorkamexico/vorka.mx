// Vorka Learn · portada (/learn/), índice de cada sección (/learn/<sección>/) y guías de exámenes (/learn/<examen>/<guía>/).
// Todo sale del catálogo (learn/datos.js): una sección nueva aparece sola en la portada y tiene su índice con
// paginaIndiceSeccion(clave). Los artículos usan la plantilla común paginaArticulo (learn/articulo.js).
// Los textos viven en los archivos de datos (src/simulador/guias.js, src/learn-finanzas.js); aquí solo cómo se ven.
import { esc } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { paginaLearn } from '../learn.js';
import { espacioAnuncio } from '../anuncios.js';
import { UNIVERSIDADES } from '../simulador/paa-universidades.js';
import { SIMS, guia, rutaGuia, rutaIndice, tituloGuia, ACTUALIZADO, ACTUALIZADO_TXT, LEARN_PORTADA } from '../simulador/guias.js';
import { SITIO, RUTA_LEARN, RUTA_BUSCAR, RUTA_ACERCA, ld, ORG, LEARN, SITIO_LEARN, migas, migasLd } from './piezas.js';
import { arte, arteHero } from './arte.js';
import { secciones, seccionDe, articulos, articuloEn, ogSeccion, OG_LEARN } from './datos.js';
import { iconoDe } from './encabezado.js';
import { ICONOS_LR } from './lectura.js';
import { paginaArticulo } from './articulo.js';
import { tarjetaArticulo, tarjeta } from './tarjetas.js';

export { SITIO, ld, ORG, LEARN, SITIO_LEARN, migas, migasLd };
export { etiqueta, tarjeta, tarjetaArticulo } from './tarjetas.js';

// ---------- guía de un examen ----------
// El único llamado al producto: al final del artículo (el simulador de ese examen)
const llamadoSim = (sim, s) => `<aside class="lr-final" aria-label="Practica con el simulador"><p><b class="lr-final-t">¿Quieres practicar?</b>Haz un examen de práctica en el ${esc(s.titulo)}: reactivos originales y un reporte de qué reforzar.</p>
  <a class="btn tinta" href="/${sim}/">Ir al ${esc(s.titulo)} ${FLECHA}</a></aside>`;

export function paginaGuia(sim, slug, anuncios = null) {
  const x = guia(sim, slug), s = SIMS[sim];
  if (!x || !s) return null;
  const ruta = rutaGuia(x);
  // Sigue leyendo: solo guías de Learn (las que la guía pide y, si faltan, las demás del mismo examen)
  const mismas = articulos().filter(a => a.clave === s.clave).map(a => a.ruta);
  const rel = [...new Set([...(x.relacionadas || []), ...mismas])].filter(r => r !== ruta && articuloEn(r)).slice(0, 3)
    .map(r => { const y = articuloEn(r).x; return { href: r, h1: y.h1, descripcion: y.descripcion }; });
  return paginaArticulo(x, {
    ruta, titulo: tituloGuia(x), lugares: [['Vorka Learn', RUTA_LEARN], [s.examen, rutaIndice(sim)], [x.h1, ruta]],
    kicker: `Guía · ${s.examen}`, imagen: s.og, actual: s.clave, anuncios, actualizado: ACTUALIZADO, actualizadoTxt: ACTUALIZADO_TXT,
    notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; los requisitos y las fechas cambian cada año, así que confírmalos siempre en la convocatoria vigente.</p>`,
    llamado: llamadoSim(sim, s), compartirTexto: 'Compártela con quien también va a presentar el examen.',
    rel, relTitulo: 'Guías relacionadas',
    notaPie: `Vorka Learn es la sección de guías de Vorka México. Esta guía es informativa; el ${esc(s.titulo)} es un simulador de práctica con reactivos originales y los puntajes y aciertos que da son estimaciones para orientar el estudio. ${esc(s.aviso)}`,
  });
}

// ---------- índice de una sección (cualquiera: examen o tema) ----------
export function paginaIndiceSeccion(clave, anuncios = null) {
  const s = seccionDe(clave);
  if (!s) return null;
  const lista = articulos().filter(a => a.clave === clave), lugares = [['Vorka Learn', RUTA_LEARN], [s.nombre, s.ruta]];
  const datos = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: s.indice.h1, description: s.indice.descripcion, inLanguage: 'es-MX', url: `${SITIO}${s.ruta}`, publisher: ORG, isPartOf: SITIO_LEARN,
      mainEntity: { '@type': 'ItemList', itemListElement: lista.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${a.ruta}`, name: a.x.h1 })) } },
    migasLd(lugares),
  ];
  const otros = secciones().filter(o => o.clave !== clave);
  return paginaLearn({ titulo: s.titulo, ruta: s.ruta, descripcion: s.indice.descripcion, imagen: `${SITIO}${ogSeccion(clave)}`, imagenAlt: s.indice.h1, actual: clave, anuncios,
    head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col lr-ancha">
  ${migas(lugares)}
  <section class="lr-banner">
    <div><span class="lr-kicker">${iconoDe(clave)}Vorka Learn · ${esc(s.corto)}</span>
    <h1 class="lr-h1">${esc(s.indice.h1)}</h1>
    <p class="lr-lead">${esc(s.indice.lead)}</p></div>
    <div class="lr-banner-arte">${arte(clave, { semilla: 'indice', id: 'b' }).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</div>
  </section>
  <div class="gu-grid">${lista.map(tarjetaArticulo).join('')}</div>
  ${clave === 'paa' ? `<section class="lr-grupo"><h2 class="lr-h2">La PAA en cada universidad</h2><p class="lr-grupo-lead">Cómo usa la PAA cada universidad, con la fuente oficial de cada una.</p>
  <div class="gu-grid">${Object.entries(UNIVERSIDADES).map(([u, d]) => tarjeta(`/simulador-paa/${u}/`, `PAA ${d.nombre}`, d.completo, 'paa', { semilla: u })).join('')}</div></section>` : ''}
  ${espacioAnuncio(anuncios, 'indice')}
  ${otros.length ? `<section class="lr-grupo"><h2 class="lr-h2">Otras secciones de Vorka Learn</h2>
  <div class="gu-grid">${otros.map(o => tarjeta(o.ruta, o.indice.h1, o.indice.descripcion, o.clave, { etq: o.nombre })).join('')}</div></section>` : ''}
  <p class="lr-nota">Guías informativas de Vorka Learn, la sección de guías de Vorka México, con las fuentes oficiales al final de cada una.${s.simulador ? ` Para practicar, el <a href="${s.simulador.href}">${esc(s.simulador.titulo)}</a> es un simulador de práctica con reactivos originales.` : ''} ${esc(s.aviso || '')}</p>
</div></div>`,
  });
}
export const paginaIndiceExamen = (sim, anuncios = null) => SIMS[sim] ? paginaIndiceSeccion(SIMS[sim].clave, anuncios) : null;

// ---------- portada ----------
const CONFIANZA = () => [
  [ICONOS_LR.fuentes, 'Con fuentes oficiales', 'Cada dato sale de la institución que lo publica, y lo citamos al final de cada guía.'],
  [ICONOS_LR.fecha, `Revisado en ${ACTUALIZADO_TXT}`, 'Las reglas y las convocatorias cambian; anotamos cuándo revisamos cada guía.'],
  [ICONOS_LR.persona, 'Gratis y sin registro', 'Lees todo sin cuenta. Si quieres practicar un examen, los simuladores están aparte.'],
];
export function paginaLearnPortada(anuncios = null) {
  const lista = secciones(), p0 = LEARN_PORTADA, todos = articulos();
  const datos = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: p0.h1, description: p0.descripcion, inLanguage: 'es-MX', url: `${SITIO}${RUTA_LEARN}`, publisher: ORG,
    isPartOf: SITIO_LEARN, about: LEARN, mainEntity: { '@type': 'ItemList', itemListElement: todos.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${a.ruta}`, name: a.x.h1 })) } }];
  const h1 = esc(p0.h1).replace(/^(.*?\bpara\s)(.+)$/, '$1<span>$2</span>');
  const sims = lista.filter(s => s.simulador);
  return paginaLearn({ titulo: p0.titulo, ruta: RUTA_LEARN, descripcion: p0.descripcion, imagen: `${SITIO}${OG_LEARN}`, imagenAlt: p0.h1, anuncios, head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col lr-ancha">
  <section class="lr-portada">
    <div>
      <span class="lr-kicker">${iconoDe('learn')}Vorka Learn</span>
      <h1 class="lr-h1">${h1}</h1>
      <p class="lr-lead">${esc(p0.lead)}</p>
      <form class="lr-buscador" action="${RUTA_BUSCAR}" method="get" role="search"><label class="vh" for="lr-q">Buscar en Vorka Learn</label><input id="lr-q" name="q" type="search" placeholder="Busca una guía o un tema" enterkeyhint="search" maxlength="80" autocomplete="off"><button type="submit" aria-label="Buscar">${ICONOS_LR.lupa}</button></form>
      <nav class="lr-chips" aria-label="Secciones">${lista.map(s => `<a class="lr-chip lr-s-${s.clave}" href="${s.ruta}">${iconoDe(s.clave)}${esc(s.nombre)}</a>`).join('')}</nav>
    </div>
    <div class="lr-portada-arte">${arteHero(lista.map(s => s.clave))}</div>
  </section>
  <div class="lr-confianza">${CONFIANZA().map(([i, t, d]) => `<div>${i}<span><b>${t}</b>${d}</span></div>`).join('')}</div>
  ${lista.map((s, i) => `<section class="lr-grupo lr-s-${s.clave}" aria-labelledby="g-${s.clave}">
    <div class="lr-grupo-cab"><span class="lr-m-ico">${iconoDe(s.clave)}</span><h2 class="lr-h2" id="g-${s.clave}">${esc(s.nombre)}</h2><a class="lr-todas" href="${s.ruta}">Todas las guías de ${esc(s.corto)} ${FLECHA}</a></div>
    <p class="lr-grupo-lead">${esc(s.indice.lead)}</p>
    <div class="gu-grid">${todos.filter(a => a.clave === s.clave).map(tarjetaArticulo).join('')}</div>
  </section>${i === 0 ? espacioAnuncio(anuncios, 'indice') : ''}`).join('\n')}
  ${sims.length ? `<section class="lr-practica-sec" id="practica" aria-labelledby="practica-t"><p class="lr-sobre lr-oro">Practica</p><h2 class="lr-h2" id="practica-t">Ponte a prueba antes del examen</h2>
    <p>Cuando ya leíste la guía, lo que más ayuda es practicar con el formato del examen. Estos son los simuladores de práctica de Vorka México, con reactivos originales.</p>
    <div class="lr-sims">${sims.map(s => `<a class="lr-sim lr-s-${s.clave}" href="${s.simulador.href}"><span class="lr-m-ico">${iconoDe(s.clave)}</span><span>${esc(s.simulador.titulo)}<small>Examen de práctica y reporte</small></span><span class="lr-m-fl" aria-hidden="true">›</span></a>`).join('')}<a class="lr-sim" href="/test-vocacional/"><span>Test vocacional Vorka<small>Gratis: tus 3 tipos de interés y tu carrera más afín</small></span><span class="lr-m-fl" aria-hidden="true">›</span></a></div></section>` : ''}
  <p class="lr-nota">Vorka Learn es la sección de guías de Vorka México. Las guías son informativas y no estamos afiliados a las instituciones que aplican estos exámenes ni a ninguna institución financiera; confirma siempre fechas y requisitos en la convocatoria vigente. Las guías de finanzas y de negocio son información general con fines educativos; no son asesoría financiera, legal ni fiscal personalizada. <a href="${RUTA_ACERCA}">Cómo hacemos Vorka Learn</a>.</p>
</div></div>`,
  });
}
