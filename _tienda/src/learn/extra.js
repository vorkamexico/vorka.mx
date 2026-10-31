// Vorka Learn · páginas de apoyo: búsqueda (/learn/buscar/?q=), «Acerca de Vorka Learn» (/learn/acerca/), RSS
// (/learn/feed.xml) y los dibujos de las miniaturas (/learn/arte/<sección>[/<guía>].svg).
// La búsqueda se arma en el Worker filtrando las guías en memoria (son pocas): sin índice aparte ni servidor de búsqueda.
// Sus resultados no se indexan (noindex, también en la cabecera X-Robots-Tag).
import { esc } from '../paginas.js';
import { paginaLearn } from '../learn.js';
import { ACTUALIZADO, ACTUALIZADO_TXT } from '../simulador/guias.js';
import { respuestaArte } from './arte.js';
import { secciones, articulos, textoDe, OG_LEARN } from './datos.js';
import { iconoDe } from './encabezado.js';
import { ICONOS_LR } from './lectura.js';
import { SITIO, RUTA_BUSCAR, RUTA_ACERCA, RUTA_FEED, ld, ORG, LEARN, SITIO_LEARN, migas, migasLd } from './piezas.js';
import { etiqueta } from './tarjetas.js';

export { RUTA_FEED };
export const CORREO = 'vorkamexico@gmail.com';   // el mismo del pie de todo el sitio

// ---------- búsqueda ----------
const VACIAS = new Set('a al como con cual cuales de del el en es esta este la las lo los me mi para por que se si sin su sus te tu un una uno y o'.split(' '));
export const normal = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const terminos = q => [...new Set(normal(q).split(/[^a-z0-9ñ]+/).filter(t => t.length > 1 && !VACIAS.has(t)))].slice(0, 8);

// Artículos (de todas las secciones) que coinciden con la búsqueda, de la más a la menos relevante: todas las palabras deben aparecer (en el título,
// la descripción, la sección o el texto); pesa más el título. Si ninguna guía tiene todas, se muestran las que tengan alguna.
export function buscarGuias(q) {
  const t = terminos(q);
  if (!t.length) return [];
  const filas = articulos().map(a => {
    const x = a.x, campos = { titulo: normal(`${x.h1} ${x.titulo}`), desc: normal(`${x.descripcion} ${x.busqueda || ''}`), sec: normal(`${a.s.nombre} ${a.s.corto} ${a.clave}`), cuerpo: normal(textoDe(a)) };
    let puntos = 0, todas = true, alguna = false;
    for (const w of t) {
      const p = (campos.titulo.includes(w) ? 6 : 0) + (campos.desc.includes(w) ? 3 : 0) + (campos.sec.includes(w) ? 4 : 0) + Math.min(4, campos.cuerpo.split(w).length - 1);
      if (p) alguna = true; else todas = false;
      puntos += p;
    }
    return { a, puntos, todas, alguna };
  });
  const completas = filas.filter(f => f.todas);
  return (completas.length ? completas : filas.filter(f => f.alguna)).sort((f, g) => g.puntos - f.puntos).map(f => f.a);
}

// Fragmento del texto alrededor de la primera palabra encontrada, con las palabras marcadas (todo escapado)
export function fragmento(a, q, largo = 170) {
  const t = terminos(q), texto = textoDe(a).replace(/\s+/g, ' '), n = normal(texto);
  const i = Math.min(...t.map(w => n.indexOf(w)).filter(i => i >= 0), Infinity);
  const ini = i === Infinity ? 0 : Math.max(0, i - 60), corte = texto.slice(ini, ini + largo);
  const base = (ini > 0 ? '…' : '') + corte + (ini + largo < texto.length ? '…' : '');
  return marcar(base, t);
}
const marcar = (texto, t) => {
  if (!t.length) return esc(texto);
  const n = normal(texto), marcas = [];
  for (const w of t) { let i = n.indexOf(w); while (i >= 0) { marcas.push([i, i + w.length]); i = n.indexOf(w, i + w.length); } }
  marcas.sort((a, b) => a[0] - b[0]);
  let out = '', p = 0;
  for (const [a, b] of marcas) { if (a < p) continue; out += esc(texto.slice(p, a)) + `<mark>${esc(texto.slice(a, b))}</mark>`; p = b; }
  return out + esc(texto.slice(p));
};

const SUGERENCIAS = ['puntaje PAA', 'aciertos UNAM', 'becas', 'elegir carrera', 'tarjeta de crédito', 'salir de deudas', 'clientes', 'citas'];
export function paginaBuscar(url) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80), res = q ? buscarGuias(q) : [];
  const lista = res.map(a => `<li><a class="lr-s-${a.clave}" href="${a.ruta}">${etiqueta(a.clave, a.s.corto)}<h2>${esc(a.x.h1)}</h2><p>${fragmento(a, q)}</p></a></li>`).join('');
  const sug = `<div class="lr-chips">${SUGERENCIAS.map(t => `<a class="lr-chip" href="${RUTA_BUSCAR}?q=${encodeURIComponent(t)}">${ICONOS_LR.lupa}${esc(t)}</a>`).join('')}</div>`;
  const cuerpo = `<div class="marco"><div class="lr-col">
  ${migas([['Vorka Learn', '/learn/'], ['Buscar', RUTA_BUSCAR]])}
  <span class="lr-kicker">${ICONOS_LR.lupa}Buscar en Vorka Learn</span>
  <h1 class="lr-h1">${q ? `Resultados para «${esc(q)}»` : '¿Qué quieres saber?'}</h1>
  <form class="lr-buscador lr-buscar-f" action="${RUTA_BUSCAR}" method="get" role="search"><label class="vh" for="lr-q">Buscar en Vorka Learn</label><input id="lr-q" name="q" type="search" value="${esc(q)}" placeholder="Ej.: cuántos aciertos para la UNAM" enterkeyhint="search" maxlength="80" autocomplete="off"${q ? '' : ' autofocus'}><button type="submit" aria-label="Buscar">${ICONOS_LR.lupa}</button></form>
  ${q ? (res.length ? `<p class="lr-lead" role="status">${res.length === 1 ? 'Encontramos 1 guía.' : `Encontramos ${res.length} guías.`}</p><ul class="lr-res">${lista}</ul>`
    : `<div class="lr-vacio" role="status"><p><b>No encontramos guías con «${esc(q)}».</b> Prueba con otras palabras o entra a una sección:</p></div>${sug}`)
    : `<p class="lr-lead">Busca en todas las guías: exámenes, puntajes, fechas, cómo estudiar, becas, carreras, tarjetas, préstamos, deudas y tu negocio.</p>${sug}`}
  <section class="lr-grupo"><h2 class="lr-h2">Secciones</h2><div class="lr-chips">${secciones().map(s => `<a class="lr-chip lr-s-${s.clave}" href="${s.ruta}">${iconoDe(s.clave)}${esc(s.nombre)}</a>`).join('')}</div></section>
</div></div>`;
  const r = paginaLearn({ titulo: q ? `Buscar «${q.slice(0, 30)}» | Vorka Learn` : 'Buscar en Vorka Learn', ruta: RUTA_BUSCAR, descripcion: 'Busca en las guías de Vorka Learn: exámenes de admisión, becas y carreras, finanzas personales y negocio pequeño.', actual: 'buscar', noindex: true, cuerpo });
  r.headers.set('x-robots-tag', 'noindex, follow');
  return r;
}

// ---------- acerca ----------
export const ACERCA = {
  titulo: 'Acerca de Vorka Learn: quién la hace y cómo verificamos',
  descripcion: 'Qué es Vorka Learn, quién la hace (Vorka México), cómo verificamos cada dato con fuentes oficiales y cómo reportar un error en una guía.',
  h1: 'Acerca de Vorka Learn',
};
export function paginaAcerca() {
  const n = articulos().length, secs = secciones();
  const puntos = [
    ['learn', 'Qué es', `Vorka Learn es la sección de guías gratuitas de Vorka México. Hoy tiene ${n} guías en ${secs.length} secciones (${secs.map(s => esc(s.nombre)).join(', ')}): qué viene en cada examen, cómo se califica y cómo estudiar; becas, cómo elegir carrera y qué hacer si no te quedaste; cómo manejar tarjetas, préstamos entre conocidos, tandas y deudas, y cómo cuidar a los clientes y las cuentas de un negocio pequeño. Se leen completas sin cuenta y sin pagar.`],
    ['paa', 'Quién la hace', `La hace el equipo de Vorka México, una empresa mexicana con presencia en Monterrey, CDMX, Guadalajara, Querétaro y Celaya. Vorka México también hace los simuladores de práctica y las apps (como Vuelve, Agenda, Vende, Cupo o Cuentas) que mencionamos al final de algunas guías; por eso cada guía tiene un solo llamado, al final, separado del contenido, y describe la app con lo que hace hoy.`],
    ['unam', 'Cómo verificamos los datos', `Cada dato concreto (número de preguntas, escalas, fechas, requisitos, costos, reglas) sale de una fuente oficial: la convocatoria, el instructivo o la página de la institución que aplica el examen; en becas, la Coordinación Nacional de Becas; en finanzas, Banxico, CONDUSEF y las leyes publicadas en diputados.gob.mx o el DOF; en negocio, el INEGI, PROFECO y las leyes que aplican. La citamos con enlace al final de cada guía, junto con la fecha en que la revisamos (la revisión actual es de ${ACTUALIZADO_TXT}). Lo que es consejo nuestro lo decimos como consejo, y los ejemplos de preguntas son propios y están marcados.`],
    ['ecoems', 'Sin afiliación', 'No estamos afiliados al College Board, a la UNAM, al IPN, a la SEP, al ECOEMS, a «Mi derecho, mi lugar», a la Universidad de Guanajuato ni a CENEVAL, ni a CONDUSEF, al Banco de México o a ninguna institución financiera, ni a la Coordinación Nacional de Becas, al IMCO, al INEGI, a PROFECO o al SAT. Sus nombres aparecen solo para explicar sus exámenes y sus reglas. Nuestros simuladores son de práctica, con reactivos originales, y sus puntajes son estimaciones.'],
    ['finanzas', 'Dinero: información, no asesoría', 'Las guías de finanzas personales son información general con fines educativos; no son asesoría financiera personalizada. No recomendamos bancos, tarjetas ni productos de terceros, y los números de los ejemplos son inventados y están marcados como tales.'],
    ['negocio', 'Negocio: consejos y la ley, no asesoría', 'Las guías de negocio pequeño separan lo que dice la ley o el INEGI (con su fuente) de lo que es consejo nuestro. Son información general: no son asesoría legal, fiscal ni contable, y los números de los ejemplos son inventados y están marcados.'],
    ['prepa-ug', 'Cuando algo cambia', 'Las convocatorias cambian cada año. Cuando una institución publica una nueva, revisamos las guías afectadas y cambiamos la fecha de actualización. Aun así, confirma siempre fechas y requisitos en la convocatoria vigente antes de hacer un trámite.'],
  ];
  const cuerpo = `<div class="marco"><div class="lr-col">
  ${migas([['Vorka Learn', '/learn/'], ['Acerca', RUTA_ACERCA]])}
  <span class="lr-kicker">${iconoDe('learn')}Vorka Learn</span>
  <h1 class="lr-h1">${ACERCA.h1}</h1>
  <p class="lr-lead">Guías claras y con fuentes para decisiones importantes: el examen que define tu escuela y el dinero de tu casa. Así las hacemos y así puedes ayudarnos a que sigan bien.</p>
  <div class="lr-puntos">${puntos.map(([k, t, d]) => `<section class="lr-punto lr-s-${k}"><span class="lr-m-ico">${iconoDe(k)}</span><h2>${t}</h2><p>${d}</p></section>`).join('')}
  <section class="lr-punto lr-s-learn" id="errores"><span class="lr-m-ico">${ICONOS_LR.correo}</span><h2>Cómo reportar un error</h2><p>Si ves un dato equivocado o desactualizado, escríbenos a <a href="mailto:${CORREO}?subject=${encodeURIComponent('Error en Vorka Learn')}">${CORREO}</a> con la liga de la guía y, si puedes, la fuente que lo corrige. Revisamos cada reporte contra la fuente y, si hay un error, corregimos la guía y su fecha de actualización.</p></section></div>
  <p class="lr-nota">Vorka Learn es parte de <a href="/">Vorka México</a>. Actualizado: ${ACTUALIZADO_TXT}.</p>
</div></div>`;
  const datos = [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: ACERCA.h1, description: ACERCA.descripcion, inLanguage: 'es-MX', url: `${SITIO}${RUTA_ACERCA}`, about: LEARN, publisher: ORG, isPartOf: SITIO_LEARN, dateModified: ACTUALIZADO },
    migasLd([['Vorka Learn', '/learn/'], ['Acerca', RUTA_ACERCA]])];
  return paginaLearn({ titulo: ACERCA.titulo, ruta: RUTA_ACERCA, descripcion: ACERCA.descripcion, imagen: `${SITIO}${OG_LEARN}`, imagenAlt: ACERCA.h1, actual: 'acerca', head: ld(datos), cuerpo });
}

// ---------- RSS ----------
const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fechaRss = f => new Date(`${f}T12:00:00-06:00`).toUTCString();
export function feedLearn() {
  const items = articulos().map(({ x, s, ruta }) => { const url = `${SITIO}${ruta}`;
    return `  <item>
    <title>${xml(x.h1)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${xml(x.descripcion)}</description>
    <category>${xml(s.nombre)}</category>
    <pubDate>${fechaRss(x.publicado || ACTUALIZADO)}</pubDate>
  </item>`; });
  const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Vorka Learn</title>
  <link>${SITIO}/learn/</link>
  <atom:link href="${SITIO}${RUTA_FEED}" rel="self" type="application/rss+xml"/>
  <description>Guías de Vorka México con fuentes oficiales: exámenes de admisión, becas y carreras, finanzas personales y negocio pequeño.</description>
  <language>es-MX</language>
  <lastBuildDate>${fechaRss(ACTUALIZADO)}</lastBuildDate>
  <image><url>${SITIO}/vorka-logo.png</url><title>Vorka Learn</title><link>${SITIO}/learn/</link></image>
${items.join('\n')}
</channel>
</rss>
`;
  return new Response(cuerpo, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// ---------- rutas ----------
export function rutasLearnExtra(req, env, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const p = url.pathname;
  if (p === RUTA_FEED) return feedLearn();
  if (p === RUTA_BUSCAR) return paginaBuscar(url);
  if (p === RUTA_ACERCA) return paginaAcerca();
  if (p === '/learn/buscar' || p === '/learn/acerca') return new Response(null, { status: 301, headers: { location: `${url.origin}${p}/${url.search}` } });
  const a = p.match(/^\/learn\/arte\/([a-z0-9-]{2,30})(?:\/([a-z0-9-]{2,80}))?\.svg$/);
  if (a) {
    const valida = a[1] === 'learn' || secciones().some(s => s.clave === a[1]);
    if (!valida) return null;
    return respuestaArte(a[1], a[2] || '');
  }
  return null;
}
