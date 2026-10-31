// Vorka Learn · la plantilla de un artículo, para todas las secciones (exámenes, finanzas y las que vengan):
// migas, etiqueta de color, H1, entrada, autor + fecha + minutos de lectura, dibujo de la sección, índice «En esta guía»
// (con flecha y número de apartados), secciones, preguntas frecuentes, fuentes, UN solo llamado final, compartir y
// «Sigue leyendo» con miniaturas. Espacios de anuncio solo si están encendidos (apagados no dejan hueco).
// La imagen para compartir sale de la ruta (assets/learn/og/<sección>-<artículo>.png); ver herramientas/learn-og/.
import { esc } from '../paginas.js';
import { espacioAnuncio } from '../anuncios.js';
import { paginaLearn } from '../learn.js';
import { SITIO, RUTA_ACERCA, ld, ORG, LEARN, SITIO_LEARN, migas, migasLd, textoPlano, minutosDeTexto } from './piezas.js';
import { arte } from './arte.js';
import { iconoDe } from './encabezado.js';
import { metaGuia, indiceGuia, ICONOS_LR } from './lectura.js';
import { articuloEn, ogArticulo } from './datos.js';
import { tarjetaArticulo } from './tarjetas.js';

// «¿Le sirve a alguien más?»: ligas para compartir (sin JS). Llevan utm para medir cuántas visitas llegan recomendadas;
// Google usa el canonical, así que no duplica la página.
export function compartir(h1, ruta, texto) {
  const url = c => `${SITIO}${ruta}?utm_source=${c}&utm_medium=compartir&utm_campaign=learn`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${h1}: ${url('whatsapp')}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url('facebook'))}`;
  return `<div class="gu-compartir"><p><b>¿Le sirve a alguien más?</b> ${texto}</p>
    <div class="gu-comp-bot"><a class="gu-wa" href="${esc(wa)}" target="_blank" rel="noopener">${ICONOS_LR.whatsapp}Compartir por WhatsApp</a><a class="gu-fb" href="${esc(fb)}" target="_blank" rel="noopener">${ICONOS_LR.facebook}Compartir en Facebook</a></div></div>`;
}

/**
 * Artículo de Learn.
 *  x: { slug, h1, lead, descripcion, secciones: [{ h2, html }], faq?: [{ p, r }], fuentes: [{ nombre, url }], publicado?, actualizado? }
 *  o: { ruta, titulo, lugares, kicker, imagen?, actual (clave de la sección), anuncios, actualizado, actualizadoTxt,
 *       notaFuentes (html), llamado (html del <aside class="lr-final">), compartirTexto, rel: [{ href, h1, descripcion }],
 *       relTitulo, notaPie (html) }
 */
export function paginaArticulo(x, o) {
  const { ruta, lugares, anuncios = null } = o, clave = o.actual, ids = x.secciones.map((_, i) => `s${i + 1}`);
  const yo = articuloEn(ruta);
  const og = yo ? `${SITIO}${ogArticulo(yo)}` : o.imagen;
  const minutos = minutosDeTexto(`${x.h1} ${x.lead} ${x.secciones.map(y => textoPlano(y.html)).join(' ')} ${(x.faq || []).map(f => `${f.p} ${f.r}`).join(' ')}`);
  const datos = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: x.h1, description: x.descripcion, inLanguage: 'es-MX', image: [og],
      datePublished: x.publicado || o.actualizado, dateModified: x.actualizado || o.actualizado, author: LEARN, publisher: ORG, isPartOf: SITIO_LEARN,
      timeRequired: `PT${minutos}M`, ...(yo ? { articleSection: yo.s.nombre } : {}),
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITIO}${ruta}` }, citation: x.fuentes.map(f => f.url) },
    migasLd(lugares),
    ...(x.faq?.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: x.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) }] : []),
  ];
  // Anuncios (solo si están encendidos): tras la primera sección, a mitad del artículo y antes del llamado final
  const n = x.secciones.length, mitad = Math.floor(n / 2);
  const espacioTras = i => (i === 0 ? espacioAnuncio(anuncios, 'intro') : '') + (i === mitad && i > 0 && i < n - 1 ? espacioAnuncio(anuncios, 'mitad') : '');
  const rel = o.rel || [];
  const toc = [...x.secciones.map((y, i) => [ids[i], esc(y.h2)]), ...(x.faq?.length ? [['preguntas', 'Preguntas frecuentes']] : []), ['fuentes', 'Fuentes']];
  return paginaLearn({ titulo: o.titulo, ruta, descripcion: x.descripcion, imagen: og, imagenAlt: x.h1, ogTipo: 'article', actual: clave, anuncios, lectura: true,
    head: ld(datos),
    cuerpo: `<div class="marco"><div class="lr-col">
  ${migas(lugares)}
  <div class="lr-guia-cab">
  <span class="lr-kicker">${iconoDe(clave)}${esc(o.kicker)}</span>
  <h1 class="lr-h1">${esc(x.h1)}</h1>
  <p class="lr-lead">${esc(x.lead)}</p>
  ${metaGuia({ fecha: x.actualizado || o.actualizado, fechaTxt: o.actualizadoTxt, minutos })}
  <div class="lr-portadilla">${arte(clave, { semilla: x.slug || ruta, id: 'p' }).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</div>
  </div>
  ${indiceGuia(toc)}
  <article class="lr-art">
    ${x.secciones.map((y, i) => `<h2 id="${ids[i]}">${esc(y.h2)}</h2>\n${y.html}${espacioTras(i)}`).join('\n')}
    ${x.faq?.length ? `<h2 id="preguntas">Preguntas frecuentes</h2><div class="t-faq">${x.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>` : ''}
    <h2 id="fuentes">Fuentes</h2>
    <ol class="gu-fuentes">${x.fuentes.map(f => `<li><a href="${esc(f.url)}" rel="noopener">${esc(f.nombre)}</a></li>`).join('')}</ol>
    ${o.notaFuentes}
    <p class="gu-nota">¿Viste un dato equivocado o desactualizado? <a href="${RUTA_ACERCA}#errores">Avísanos</a>.</p>
    ${espacioAnuncio(anuncios, 'final')}
    ${o.llamado}
    ${compartir(x.h1, ruta, o.compartirTexto)}
  </article>
  ${rel.length ? `<section class="lr-sigue" aria-labelledby="sigue"><p class="lr-sobre lr-sigue-t">Sigue leyendo</p><h2 class="lr-h2" id="sigue">${esc(o.relTitulo)}</h2>
  <div class="gu-grid">${rel.map(y => { const a = articuloEn(y.href); return a ? tarjetaArticulo(a) : `<a class="gu-card" href="${y.href}"><span class="gu-card-c"><h3>${esc(y.h1)}</h3><p>${esc(y.descripcion)}</p></span></a>`; }).join('')}</div></section>` : ''}
  <p class="lr-nota">${o.notaPie}</p>
</div></div>`,
  });
}
