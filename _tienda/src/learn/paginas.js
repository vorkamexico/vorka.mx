// Vorka Learn · las páginas de contenido: portada (/learn/), índice de cada sección (/learn/<sección>/) y guía
// (/learn/<sección>/<guía>/). Los datos (textos, fuentes, FAQ) viven en src/simulador/guias.js; aquí solo cómo se ven.
// Reglas que se mantienen: un solo llamado al producto (al final del artículo), JSON-LD, migas, compartir por WhatsApp y
// Facebook, «Sigue leyendo», espacios de anuncio solo si están encendidos (apagados no dejan hueco).
import { esc } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { paginaLearn } from '../learn.js';
import { espacioAnuncio } from '../anuncios.js';
import { UNIVERSIDADES } from '../simulador/paa-universidades.js';
import { GUIAS, SIMS, guiasDe, guia, rutaGuia, rutaIndice, RUTA_LEARN, tituloGuia, tituloIndice, ACTUALIZADO, ACTUALIZADO_TXT, LEARN_PORTADA } from '../simulador/guias.js';
import { arte, arteHero } from './arte.js';
import { secciones, claveDe, minutosDe, ogGuia, ogSeccion, OG_LEARN } from './datos.js';
import { iconoDe, RUTA_BUSCAR, RUTA_ACERCA } from './encabezado.js';
import { metaGuia, indiceGuia, ICONOS_LR } from './lectura.js';

export const SITIO = 'https://vorka.mx';
export const V_ARTE = '1';   // súbelo si cambian los dibujos (las miniaturas se guardan una semana en caché)
export const ld = x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`;
export const ORG = { '@type': 'Organization', name: 'Vorka México', url: `${SITIO}/`, logo: { '@type': 'ImageObject', url: `${SITIO}/vorka-logo.png` } };
// La marca editorial: Vorka Learn, parte de Vorka México
export const LEARN = { '@type': 'Organization', name: 'Vorka Learn', url: `${SITIO}/learn/`, parentOrganization: ORG };
export const SITIO_LEARN = { '@type': 'WebSite', name: 'Vorka Learn', url: `${SITIO}/learn/`, publisher: ORG,
  potentialAction: { '@type': 'SearchAction', target: `${SITIO}${RUTA_BUSCAR}?q={q}`, 'query-input': 'required name=q' } };
const porRuta = ruta => GUIAS.find(x => rutaGuia(x) === ruta);
export const migas = l => `<nav class="lr-migas" aria-label="Migas de pan"><ol>${l.map(([t, href], i) => `<li>${i < l.length - 1 ? `<a href="${href}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`}</li>`).join('')}</ol></nav>`;
export const migasLd = l => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: l.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITIO}${href}` })) });
const nombreSec = s => s.examen || s.seccion || s.nombre;

// ---------- tarjetas ----------
export const rutaArte = (clave, slug = '') => `/learn/arte/${clave}${slug ? `/${slug}` : ''}.svg?v=${V_ARTE}`;
export const etiqueta = (clave, texto) => `<span class="lr-etq">${iconoDe(clave)}${esc(texto)}</span>`;
// Tarjeta de una guía: miniatura (SVG con caché, carga diferida, con medidas para no mover la página), etiqueta de color,
// título, descripción y minutos de lectura
export const tarjetaGuia = x => { const k = claveDe(x), s = SIMS[x.sim];
  return `<a class="gu-card lr-s-${k}" href="${rutaGuia(x)}"><span class="gu-card-img"><img src="${rutaArte(k, x.slug)}" width="480" height="270" alt="" loading="lazy" decoding="async"></span><span class="gu-card-c">${etiqueta(k, nombreSec(s))}<h3>${esc(x.h1)}</h3><p>${esc(x.descripcion)}</p><span class="gu-card-min">${minutosDe(x)} min de lectura</span></span></a>`; };
// Tarjeta de una página que no es guía (otra sección, la PAA en cada universidad)
export const tarjeta = (href, t, d, clave, { semilla = '', etq = '' } = {}) => `<a class="gu-card lr-s-${clave}" href="${href}"><span class="gu-card-img"><img src="${rutaArte(clave, semilla)}" width="480" height="270" alt="" loading="lazy" decoding="async"></span><span class="gu-card-c">${etq ? etiqueta(clave, etq) : ''}<h3>${esc(t)}</h3><p>${esc(d)}</p></span></a>`;

// ---------- piezas del artículo ----------
// El único llamado al producto: al final del artículo
const llamadoFinal = (sim, s) => `<aside class="lr-final" aria-label="Practica con el simulador"><p><b class="lr-final-t">¿Quieres practicar?</b>Haz un examen de práctica en el ${esc(s.titulo)}: reactivos originales y un reporte de qué reforzar.</p>
  <a class="btn tinta" href="/${sim}/">Ir al ${esc(s.titulo)} ${FLECHA}</a></aside>`;

// «¿Le sirve a alguien más?»: ligas para compartir (sin JS). Llevan utm para medir cuántas visitas llegan recomendadas;
// Google usa el canonical, así que no duplica la página.
function compartir(x, ruta) {
  const url = c => `${SITIO}${ruta}?utm_source=${c}&utm_medium=compartir&utm_campaign=learn`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${x.h1}: ${url('whatsapp')}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url('facebook'))}`;
  return `<div class="gu-compartir"><p><b>¿Le sirve a alguien más?</b> Compártela con quien también va a presentar el examen.</p>
    <div class="gu-comp-bot"><a class="gu-wa" href="${esc(wa)}" target="_blank" rel="noopener">${ICONOS_LR.whatsapp}Compartir por WhatsApp</a><a class="gu-fb" href="${esc(fb)}" target="_blank" rel="noopener">${ICONOS_LR.facebook}Compartir en Facebook</a></div></div>`;
}

// ---------- guía ----------
export function paginaGuia(sim, slug, anuncios = null) {
  const x = guia(sim, slug), s = SIMS[sim];
  if (!x || !s) return null;
  const k = s.clave, ruta = rutaGuia(x), ids = x.secciones.map((_, i) => `s${i + 1}`), og = `${SITIO}${ogGuia(x)}`;
  const lugares = [['Vorka Learn', RUTA_LEARN], [nombreSec(s), rutaIndice(sim)], [x.h1, ruta]];
  const datos = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: x.h1, description: x.descripcion, inLanguage: 'es-MX', image: [og],
      datePublished: x.publicado || ACTUALIZADO, dateModified: x.actualizado || ACTUALIZADO, author: LEARN, publisher: ORG, isPartOf: SITIO_LEARN,
      timeRequired: `PT${minutosDe(x)}M`, articleSection: nombreSec(s),
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITIO}${ruta}` }, citation: x.fuentes.map(f => f.url) },
    migasLd(lugares),
    ...(x.faq?.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: x.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) }] : []),
  ];
  // Anuncios (solo si están encendidos): tras la primera sección, a mitad del artículo y antes del llamado final
  const n = x.secciones.length, mitad = Math.floor(n / 2);
  const espacioTras = i => (i === 0 ? espacioAnuncio(anuncios, 'intro') : '') + (i === mitad && i > 0 && i < n - 1 ? espacioAnuncio(anuncios, 'mitad') : '');
  // Sigue leyendo: solo guías de Learn (las que la guía pide y, si faltan, las demás de la misma sección)
  const rel = [...new Set([...(x.relacionadas || []), ...guiasDe(sim).map(rutaGuia)])].filter(r => r !== ruta && porRuta(r)).slice(0, 3);
  const toc = [...x.secciones.map((y, i) => [ids[i], esc(y.h2)]), ...(x.faq?.length ? [['preguntas', 'Preguntas frecuentes']] : []), ['fuentes', 'Fuentes']];
  const conSim = /^simulador-/.test(sim);
  return paginaLearn({ titulo: tituloGuia(x), ruta, descripcion: x.descripcion, imagen: og, imagenAlt: x.h1, ogTipo: 'article', actual: k, anuncios, lectura: true,
    head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col">
  ${migas(lugares)}
  <div class="lr-guia-cab">
  <span class="lr-kicker">${iconoDe(k)}Guía · ${esc(nombreSec(s))}</span>
  <h1 class="lr-h1">${esc(x.h1)}</h1>
  <p class="lr-lead">${esc(x.lead)}</p>
  ${metaGuia({ fecha: x.actualizado || ACTUALIZADO, fechaTxt: ACTUALIZADO_TXT, minutos: minutosDe(x) })}
  <div class="lr-portadilla">${arte(k, { semilla: x.slug, id: 'p' })}</div>
  </div>
  ${indiceGuia(toc)}
  <article class="lr-art">
    ${x.secciones.map((y, i) => `<h2 id="${ids[i]}">${esc(y.h2)}</h2>\n${y.html}${espacioTras(i)}`).join('\n')}
    ${x.faq?.length ? `<h2 id="preguntas">Preguntas frecuentes</h2><div class="t-faq">${x.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>` : ''}
    <h2 id="fuentes">Fuentes</h2>
    <ol class="gu-fuentes">${x.fuentes.map(f => `<li><a href="${esc(f.url)}" rel="noopener">${esc(f.nombre)}</a></li>`).join('')}</ol>
    <p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; los requisitos y las fechas cambian cada año, así que confírmalos siempre en la convocatoria vigente. ¿Viste un error? <a href="${RUTA_ACERCA}#errores">Avísanos</a>.</p>
    ${espacioAnuncio(anuncios, 'final')}
    ${conSim ? llamadoFinal(sim, s) : (s.llamado || '')}
    ${compartir(x, ruta)}
  </article>
  ${rel.length ? `<section class="lr-sigue" aria-labelledby="sigue"><p class="lr-sobre lr-sigue-t">Sigue leyendo</p><h2 class="lr-h2" id="sigue">Guías relacionadas</h2>
  <div class="gu-grid">${rel.map(r => tarjetaGuia(porRuta(r))).join('')}</div></section>` : ''}
  <p class="lr-nota">Vorka Learn es la sección de guías de Vorka México. Esta guía es informativa${conSim ? `; el ${esc(s.titulo)} es un simulador de práctica con reactivos originales y los puntajes y aciertos que da son estimaciones para orientar el estudio` : ''}. ${esc(s.aviso || '')}</p>
</div></div>`,
  });
}

// ---------- índice de una sección ----------
export function paginaIndiceExamen(sim, anuncios = null) {
  const s = SIMS[sim], lista = guiasDe(sim);
  if (!s || !lista.length) return null;
  const k = s.clave, ruta = rutaIndice(sim), lugares = [['Vorka Learn', RUTA_LEARN], [nombreSec(s), ruta]];
  const datos = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: s.indice.h1, description: s.indice.descripcion, inLanguage: 'es-MX', url: `${SITIO}${ruta}`, publisher: ORG, isPartOf: SITIO_LEARN,
      mainEntity: { '@type': 'ItemList', itemListElement: lista.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${rutaGuia(x)}`, name: x.h1 })) } },
    migasLd(lugares),
  ];
  const otros = secciones().filter(o => o.sim !== sim), conSim = /^simulador-/.test(sim);
  return paginaLearn({ titulo: tituloIndice(sim), ruta, descripcion: s.indice.descripcion, imagen: `${SITIO}${ogSeccion(k)}`, imagenAlt: s.indice.h1, actual: k, anuncios,
    head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col lr-ancha">
  ${migas(lugares)}
  <section class="lr-banner">
    <div><span class="lr-kicker">${iconoDe(k)}Vorka Learn · ${esc(nombreSec(s))}</span>
    <h1 class="lr-h1">${esc(s.indice.h1)}</h1>
    <p class="lr-lead">${esc(s.indice.lead)}</p></div>
    <div class="lr-banner-arte">${arte(k, { semilla: 'indice', id: 'b' })}</div>
  </section>
  <div class="gu-grid">${lista.map(tarjetaGuia).join('')}</div>
  ${sim === 'simulador-paa' ? `<section class="lr-grupo"><h2 class="lr-h2">La PAA en cada universidad</h2><p class="lr-grupo-lead">Cómo usa la PAA cada universidad, con la fuente oficial de cada una.</p>
  <div class="gu-grid">${Object.entries(UNIVERSIDADES).map(([u, d]) => tarjeta(`/simulador-paa/${u}/`, `PAA ${d.nombre}`, d.completo, 'paa', { semilla: u })).join('')}</div></section>` : ''}
  ${espacioAnuncio(anuncios, 'indice')}
  ${otros.length ? `<section class="lr-grupo"><h2 class="lr-h2">Guías de otras secciones</h2>
  <div class="gu-grid">${otros.map(o => tarjeta(o.ruta, SIMS[o.sim].indice.h1, SIMS[o.sim].indice.descripcion, o.clave, { etq: o.nombre })).join('')}</div></section>` : ''}
  <p class="lr-nota">Guías informativas de Vorka Learn, la sección de guías de Vorka México, con las fuentes oficiales al final de cada una.${conSim ? ` Para practicar, el <a href="/${sim}/">${esc(s.titulo)}</a> es un simulador de práctica con reactivos originales.` : ''} ${esc(s.aviso || '')}</p>
</div></div>`,
  });
}

// ---------- portada ----------
const CONFIANZA = () => [
  [ICONOS_LR.fuentes, 'Con fuentes oficiales', 'Cada dato sale de la convocatoria o de la institución, y lo citamos al final de cada guía.'],
  [ICONOS_LR.fecha, `Revisado en ${ACTUALIZADO_TXT}`, 'Las convocatorias cambian cada año; anotamos cuándo revisamos cada guía.'],
  [ICONOS_LR.persona, 'Gratis y sin registro', 'Lees todo sin cuenta. Si quieres practicar, los simuladores están aparte.'],
];
export function paginaLearnPortada(anuncios = null) {
  const lista = secciones(), p0 = LEARN_PORTADA;
  const datos = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: p0.h1, description: p0.descripcion, inLanguage: 'es-MX', url: `${SITIO}${RUTA_LEARN}`, publisher: ORG,
    isPartOf: SITIO_LEARN, about: LEARN, mainEntity: { '@type': 'ItemList', itemListElement: GUIAS.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${rutaGuia(x)}`, name: x.h1 })) } }];
  const h1 = esc(p0.h1).replace(/^(.*?\bpara\s)(.+)$/, '$1<span>$2</span>');
  const sims = lista.filter(s => /^simulador-/.test(s.sim));
  return paginaLearn({ titulo: p0.titulo, ruta: RUTA_LEARN, descripcion: p0.descripcion, imagen: `${SITIO}${OG_LEARN}`, imagenAlt: p0.h1, anuncios, head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col lr-ancha">
  <section class="lr-portada">
    <div>
      <span class="lr-kicker">${iconoDe('learn')}Vorka Learn</span>
      <h1 class="lr-h1">${h1}</h1>
      <p class="lr-lead">${esc(p0.lead)}</p>
      <form class="lr-buscador" action="${RUTA_BUSCAR}" method="get" role="search"><label class="vh" for="lr-q">Buscar en Vorka Learn</label><input id="lr-q" name="q" type="search" placeholder="¿Qué quieres saber? Ej.: puntaje PAA" enterkeyhint="search" maxlength="80" autocomplete="off"><button type="submit" aria-label="Buscar">${ICONOS_LR.lupa}</button></form>
      <nav class="lr-chips" aria-label="Secciones">${lista.map(s => `<a class="lr-chip lr-s-${s.clave}" href="${s.ruta}">${iconoDe(s.clave)}${esc(s.nombre)}</a>`).join('')}</nav>
    </div>
    <div class="lr-portada-arte">${arteHero(lista.map(s => s.clave))}</div>
  </section>
  <div class="lr-confianza">${CONFIANZA().map(([i, t, d]) => `<div>${i}<span><b>${t}</b>${d}</span></div>`).join('')}</div>
  ${lista.map((s, i) => `<section class="lr-grupo lr-s-${s.clave}" aria-labelledby="g-${s.clave}">
    <div class="lr-grupo-cab"><span class="lr-m-ico">${iconoDe(s.clave)}</span><h2 class="lr-h2" id="g-${s.clave}">${esc(s.nombre)}</h2><a class="lr-todas" href="${s.ruta}">Todas las guías de ${esc(s.nombre)} ${FLECHA}</a></div>
    <p class="lr-grupo-lead">${esc(SIMS[s.sim].indice.lead)}</p>
    <div class="gu-grid">${guiasDe(s.sim).map(tarjetaGuia).join('')}</div>
  </section>${i === 0 ? espacioAnuncio(anuncios, 'indice') : ''}`).join('\n')}
  ${sims.length ? `<section class="lr-practica-sec" id="practica" aria-labelledby="practica-t"><p class="lr-sobre" style="color:#E6CF96">Practica</p><h2 class="lr-h2" id="practica-t">Ponte a prueba antes del examen</h2>
    <p>Cuando ya leíste la guía, lo que más ayuda es practicar con el formato del examen. Estos son los simuladores de práctica de Vorka México, con reactivos originales.</p>
    <div class="lr-sims">${sims.map(s => `<a class="lr-sim lr-s-${s.clave}" href="/${s.sim}/"><span class="lr-m-ico">${iconoDe(s.clave)}</span><span>${esc(SIMS[s.sim].titulo)}<small>Examen de práctica y reporte</small></span><span class="lr-m-fl" aria-hidden="true">›</span></a>`).join('')}</div></section>` : ''}
  <p class="lr-nota">Vorka Learn es la sección de guías de Vorka México. Las guías son informativas y no estamos afiliados a las instituciones que aplican estos exámenes; confirma siempre fechas y requisitos en la convocatoria vigente. <a href="${RUTA_ACERCA}">Cómo hacemos Vorka Learn</a>.</p>
</div></div>`,
  });
}
