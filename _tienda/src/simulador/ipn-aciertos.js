// Aciertos y lugares del IPN por carrera (nov 2026), con el anexo oficial de oferta (datos/ipn-lugares.js).
//   /simulador-ipn/aciertos/            → cómo asigna lugares el IPN y la tabla de lugares de las 107 opciones, por área
//   /simulador-ipn/aciertos/<carrera>/  → solo las carreras más buscadas (CARRERAS_IPN): escuelas, lugares y qué hacer
// Search Console (nov 2026): el IPN tenía 6 impresiones; Google autocompleta «aciertos ipn 2026» y «cuántos aciertos pide
// el ipn para medicina / odontología / ingeniería civil / sistemas». Regla: el IPN NO publica aciertos mínimos y las tablas
// que circulan no citan al IPN, así que aquí nunca va un número de aciertos «para entrar»: van los lugares oficiales.
import { esc, pagina } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { SITIO } from '../seo.js';
import { CSS } from './paa-universidades.js';
import { CSS_UA } from './unam-aciertos.js';
import { LUGARES_IPN, FUENTE_LUGARES } from './datos/ipn-lugares.js';
import { compraSimulador, CSS_COMPRA } from './compra-arriba.js';

const RUTA = '/simulador-ipn';
export const RUTA_ACIERTOS_IPN = `${RUTA}/aciertos/`;
export const AREAS_IPN = {
  icfm: 'Ingeniería y Ciencias Físico Matemáticas',
  cmb: 'Ciencias Médico Biológicas',
  csa: 'Ciencias Sociales y Administrativas',
};

// Carreras con página propia: las que Google autocompleta con «cuántos aciertos pide el IPN para…»
export const CARRERAS_IPN = {
  medicina: { nombre: 'Medicina', busca: /^Médico Cirujano/, area: 'cmb',
    intro: 'En el IPN, Medicina se estudia como Médico Cirujano y Partero o como Médico Cirujano y Homeópata, en tres escuelas de la Ciudad de México.' },
  odontologia: { nombre: 'Odontología', busca: /Odontología/, area: 'cmb',
    intro: 'En el IPN, Odontología se estudia en los dos Centros Interdisciplinarios de Ciencias de la Salud (CICS): Milpa Alta y Santo Tomás.' },
  'ingenieria-civil': { nombre: 'Ingeniería Civil', busca: /^Ingeniería Civil$/, area: 'icfm',
    intro: 'En el IPN, Ingeniería Civil se estudia en la ESIA Zacatenco, en la Ciudad de México, y en la UPII Palenque, en Chiapas.' },
  'sistemas-computacionales': { nombre: 'Ingeniería en Sistemas Computacionales', corto: 'Sistemas Computacionales', busca: /Sistemas Computacionales/, area: 'icfm',
    intro: 'En el IPN, Ingeniería en Sistemas Computacionales se estudia en la Escuela Superior de Cómputo (ESCOM) y en varias unidades fuera de la Ciudad de México.' },
};

const programas = re => LUGARES_IPN.filter(r => re.test(r[2])).map(([area, unidad, programa, ago, feb, entidad]) => ({ area, unidad, programa, ago, feb, entidad }));
const num = n => n.toLocaleString('es-MX');
const fuente = () => `<p class="pu-fuente">Fuente: <a href="${esc(FUENTE_LUGARES.url)}" rel="noopener">${esc(FUENTE_LUGARES.nombre)}</a> y la <a href="${esc(FUENTE_LUGARES.convocatoria)}" rel="noopener">convocatoria de nivel superior</a>, consultadas el ${esc(FUENTE_LUGARES.consultada)}. Las columnas son las del IPN: ingreso en agosto (27/1) y en febrero (27/2). Un 0 quiere decir que ese periodo no abre lugares.</p>`;

function ld(faq, migas) {
  return `<script type="application/ld+json">${JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: migas.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${SITIO}${u}` })) },
  ]).replace(/</g, '\\u003c')}</script>`;
}

const compra = (env, para) => compraSimulador(env, { app: 'simulador-ipn', nombre: 'Simulador IPN', para, puntos: ['Examen de tu área con 140 preguntas en 3 horas, como el real', 'Tutor con pistas cuando fallas', 'Tus aciertos estimados sobre 140 para ponerte una meta'] });
const ctas = `<div class="pu-botones"><a class="btn acento" href="${RUTA}/?plan=paquete#comprar">Comprar el simulador IPN ${FLECHA}</a><a class="btn blanco" href="${RUTA}/#probar">Prueba 3 preguntas</a></div>`;

const FAQ_GENERAL = [
  { p: '¿Cuántos aciertos pide el IPN para entrar?', r: 'El IPN no fija un número. Según su convocatoria, el sistema ordena a los aspirantes por su número total de aciertos, del más alto al más bajo, y asigna lugar mientras quede cupo en la carrera que elegiste. El corte sale cada vez de la demanda y de los lugares, así que cambia por carrera y por periodo.' },
  { p: '¿Las tablas de aciertos mínimos del IPN que circulan son oficiales?', r: 'No. El IPN publica los lugares de cada carrera y los resultados por folio, pero no una tabla de aciertos mínimos. Si ves una, revisa si cita un documento del IPN.' },
  { p: '¿Cuántas preguntas tiene el examen del IPN?', r: 'Según la convocatoria, 140 preguntas en un máximo de tres horas efectivas. Las preguntas dependen del área de la carrera que eliges: Ingeniería y Ciencias Físico Matemáticas, Ciencias Médico Biológicas o Ciencias Sociales y Administrativas.' },
  { p: '¿Piden promedio mínimo de bachillerato?', r: 'No. La convocatoria dice que no se solicita un promedio mínimo del bachillerato: solo haberlo concluido.' },
];

const SCRIPT = `(function(){var b=document.getElementById('ip-buscar');if(!b)return;var n=function(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();};
var filas=[].slice.call(document.querySelectorAll('tr[data-q]'));b.addEventListener('input',function(){var q=n(b.value.trim());filas.forEach(function(f){f.hidden=q&&n(f.getAttribute('data-q')).indexOf(q)<0;});});})();`;

const fila = (p, conCarrera) => `<tr data-q="${esc(`${p.programa} ${p.unidad} ${p.entidad}`)}">${conCarrera ? `<th scope="row">${conCarrera}</th>` : ''}<td data-c="Escuela o unidad">${esc(p.unidad)}</td><td data-c="Sede">${esc(p.entidad)}</td><td data-c="Agosto" class="ua-num">${num(p.ago)}</td><td data-c="Febrero" class="ua-num">${num(p.feb)}</td></tr>`;
const cabeza = conCarrera => `<thead><tr>${conCarrera ? '<th scope="col">Carrera</th>' : ''}<th scope="col">Escuela o unidad</th><th scope="col">Sede</th><th scope="col">Lugares agosto</th><th scope="col">Lugares febrero</th></tr></thead>`;
const enlaceCarrera = programa => Object.entries(CARRERAS_IPN).find(([, c]) => c.busca.test(programa))?.[0];

// /simulador-ipn/aciertos/<carrera>/
export async function paginaCarreraIpn(env, slug) {
  const c = CARRERAS_IPN[slug];
  if (!c) return null;
  const ps = programas(c.busca);
  const { tarjeta, barra } = await compra(env, `Área ${AREAS_IPN[c.area]}`);
  const ruta = `${RUTA_ACIERTOS_IPN}${slug}/`, corto = c.corto || c.nombre;
  const ago = ps.reduce((t, p) => t + p.ago, 0), feb = ps.reduce((t, p) => t + p.feb, 0);
  const varias = new Set(ps.map(p => p.programa)).size > 1;   // Medicina: Partero y Homeópata
  const faq = [
    { p: `¿Cuántos aciertos pide el IPN para ${c.nombre}?`, r: `El IPN no publica un número de aciertos para ${c.nombre}. Asigna los lugares por número total de aciertos, de mayor a menor, hasta que se acaban. Para el ciclo 2026-2027 publicó ${num(ago)} lugares de ingreso en agosto y ${num(feb)} en febrero, sumando todas sus escuelas.` },
    { p: `¿De qué área es ${c.nombre} en el IPN?`, r: `Del área de ${AREAS_IPN[c.area]}. Tu examen trae las preguntas de esa área.` },
    FAQ_GENERAL[1],
    FAQ_GENERAL[2],
  ];
  const otras = Object.entries(CARRERAS_IPN).filter(([s]) => s !== slug);
  return pagina({
    titulo: `¿Cuántos aciertos pide el IPN para ${corto}? Lugares por escuela | Vorka México`, ruta,
    descripcion: `${c.nombre} en el IPN: no hay mínimo oficial de aciertos. Las escuelas, los lugares de agosto y febrero que publica el IPN y cómo se asigna. Practica con el simulador del área.`,
    imagen: `${SITIO}/assets/tienda/v3/simulador-ipn-og.jpg`,
    head: ld(faq, [['Simulador IPN', `${RUTA}/`], ['Aciertos y lugares', RUTA_ACIERTOS_IPN], [c.nombre, ruta]]) + CSS + CSS_UA + CSS_COMPRA,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador IPN</a> / <a href="${RUTA_ACIERTOS_IPN}">Aciertos y lugares</a> / ${esc(c.nombre)}</nav>
  <h1 class="t-h1">¿Cuántos aciertos pide el IPN para ${esc(corto)}?</h1>
  <p class="t-lead">${esc(c.intro)} El IPN no publica un mínimo de aciertos: entra quien tiene más aciertos hasta que se acaban los lugares. Lo que sí publica es cuántos lugares abre cada escuela.</p>
  ${tarjeta}
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Lugares de ${esc(c.nombre)} por escuela</h2>
  <table class="ua-t">${cabeza(varias)}<tbody>${ps.map(p => fila(p, varias ? esc(p.programa) : '')).join('')}</tbody></table>
  <p class="pu-nota">En total: <b>${num(ago)}</b> lugares para ingresar en agosto y <b>${num(feb)}</b> en febrero. Área: ${esc(AREAS_IPN[c.area])}.</p>
  ${fuente()}
</div></section>

<section class="t-sec"><div class="marco">
  <h2 class="h2">Qué hacer si no hay un número oficial</h2>
  <div class="pu-grid">
    <div class="pu-card"><h3>Mídete con el examen completo</h3><p>Haz un examen de 140 preguntas en 3 horas de tu área y anota tus aciertos. Repite cada dos o tres semanas para ver si subes.</p></div>
    <div class="pu-card"><h3>Ponte una meta alta</h3><p>Como entra quien tiene más aciertos, no hay un número que te asegure el lugar. Apunta lo más alto que puedas y sube primero las materias que más pesan en tu área.</p></div>
    <div class="pu-card"><h3>Revisa los lugares de tu escuela</h3><p>Algunas escuelas abren muchos lugares y otras pocos, y hay periodos con 0. Elige con la tabla de arriba a la vista.</p></div>
  </div>
  ${ctas}
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Otras carreras del IPN</h2>
  <ul class="ua-otras">${otras.map(([s, x]) => `<li><a href="${RUTA_ACIERTOS_IPN}${s}/">${esc(x.corto || x.nombre)}</a></li>`).join('')}</ul>
  <p class="pu-nota"><a href="${RUTA_ACIERTOS_IPN}">Ver los lugares de las ${LUGARES_IPN.length} opciones del IPN</a>.</p>
</div></section>

<section class="t-sec"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">${esc(c.nombre)} en el IPN</h2></div>
  <div class="t-faq" style="margin-top:22px">${faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  <p class="t-nota" style="margin-top:22px">Página informativa de Vorka México con datos públicos del IPN. No estamos afiliados al Instituto Politécnico Nacional. Confirma siempre la convocatoria vigente en ipn.mx.</p>
</div></section>${barra}`,
  });
}

// /simulador-ipn/aciertos/
export async function paginaAciertosIpn(env) {
  const { tarjeta, barra } = await compra(env, 'las 3 áreas');
  const porArea = a => LUGARES_IPN.filter(r => r[0] === a).map(([area, unidad, programa, ago, feb, entidad]) => ({ area, unidad, programa, ago, feb, entidad }))
    .sort((x, y) => x.programa.localeCompare(y.programa, 'es') || x.unidad.localeCompare(y.unidad, 'es'));
  const carrera = p => { const s = enlaceCarrera(p.programa); return s ? `<a href="${RUTA_ACIERTOS_IPN}${s}/">${esc(p.programa)}</a>` : esc(p.programa); };
  return pagina({
    titulo: '¿Cuántos aciertos pide el IPN? Lugares por carrera 2026-2027 | Vorka México', ruta: RUTA_ACIERTOS_IPN,
    descripcion: `El IPN no tiene un mínimo de aciertos: asigna por aciertos hasta llenar los lugares. Aquí están los lugares oficiales de sus ${LUGARES_IPN.length} opciones de nivel superior, por área y escuela.`,
    imagen: `${SITIO}/assets/tienda/v3/simulador-ipn-og.jpg`,
    head: ld(FAQ_GENERAL, [['Simulador IPN', `${RUTA}/`], ['Aciertos y lugares', RUTA_ACIERTOS_IPN]]) + CSS + CSS_UA + CSS_COMPRA,
    script: SCRIPT,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador IPN</a> / Aciertos y lugares</nav>
  <h1 class="t-h1">¿Cuántos aciertos pide el IPN para entrar?</h1>
  <p class="t-lead">El IPN no publica un mínimo de aciertos. Según su convocatoria, ordena a los aspirantes por su número total de aciertos y asigna lugar, del más alto al más bajo, hasta agotar los lugares de cada carrera. Por eso abajo van los lugares que publica el IPN para cada carrera y escuela.</p>
  ${tarjeta}
  <ul class="ua-otras" aria-label="Carreras más buscadas">${Object.entries(CARRERAS_IPN).map(([s, x]) => `<li><a href="${RUTA_ACIERTOS_IPN}${s}/">${esc(x.corto || x.nombre)}</a></li>`).join('')}</ul>
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Cómo se asigna tu lugar</h2>
  <div class="pu-grid">
    <div class="pu-card"><h3>Un examen por área</h3><p>140 preguntas en un máximo de tres horas, con las preguntas del área de la carrera que eliges.</p></div>
    <div class="pu-card"><h3>Ganan los aciertos</h3><p>El sistema ordena a todos por aciertos y asigna mientras quede lugar en tu opción. Cada lugar asignado se resta del cupo.</p></div>
    <div class="pu-card"><h3>Sin promedio mínimo</h3><p>No piden promedio del bachillerato, solo haberlo terminado. Todo depende del examen.</p></div>
  </div>
  ${fuente()}
</div></section>

<section class="t-sec"><div class="marco">
  <h2 class="h2">Lugares por carrera y escuela</h2>
  <input class="ua-buscar" id="ip-buscar" type="search" placeholder="Busca tu carrera, escuela o estado" aria-label="Buscar carrera, escuela o estado">
  ${Object.entries(AREAS_IPN).map(([a, nombre]) => `<div class="ua-area"><h3 class="h3">${esc(nombre)}</h3>
  <table class="ua-t">${cabeza(true)}<tbody>${porArea(a).map(p => fila(p, carrera(p))).join('')}</tbody></table></div>`).join('')}
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">¿Cuántos aciertos sacarías hoy?</h2>
  <p class="lead">En el simulador haces exámenes completos de tu área, con tutor cuando fallas, y ves tus aciertos estimados sobre 140.</p>
  ${ctas}
  <div style="margin-top:34px"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">Aciertos y admisión al IPN</h2></div>
  <div class="t-faq" style="margin-top:22px">${FAQ_GENERAL.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  <p class="t-nota" style="margin-top:14px">Página informativa de Vorka México con datos públicos del IPN. No estamos afiliados al Instituto Politécnico Nacional. ¿Vas al bachillerato del IPN? Ese examen es el del <a href="/simulador-ecoems/">ECOEMS</a>.</p>
</div></section>${barra}`,
  });
}
