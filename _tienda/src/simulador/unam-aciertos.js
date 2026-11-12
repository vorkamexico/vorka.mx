// Aciertos para entrar a la UNAM por carrera y plantel (nov 2026), con la lista oficial de la DGAE (datos/unam-minimos.js).
//   /simulador-unam/aciertos/            → todas las carreras: calculadora (tus aciertos contra cada programa) y tabla por área
//   /simulador-unam/aciertos/<carrera>/  → una carrera: sus planteles y modalidades, calculadora y carreras de su área
// Search Console (nov 2026): el simulador UNAM casi no tenía impresiones; al PAA lo movieron sus páginas por universidad.
// Se publica página propia solo para carreras con algún programa de 60 aciertos o más (las que más se buscan); las demás
// están en la tabla general. El número es el MÍNIMO 2021–2026 (el menor con el que alguien entró en esos años), no un mínimo
// para 2027: siempre se dice así.
import { esc, pagina } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { SITIO } from '../seo.js';
import { CSS } from './paa-universidades.js';
import { MINIMOS_UNAM, FUENTE_MINIMOS } from './datos/unam-minimos.js';
import { compraSimulador, CSS_COMPRA } from './compra-arriba.js';

const RUTA = '/simulador-unam';
export const RUTA_ACIERTOS = `${RUTA}/aciertos/`;
export const AREAS = {
  1: 'Ciencias Físico-Matemáticas y de las Ingenierías',
  2: 'Ciencias Biológicas, Químicas y de la Salud',
  3: 'Ciencias Sociales',
  4: 'Humanidades y de las Artes',
};
export const MINIMO_PAGINA = 60;

export const slugCarrera = c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// { slug: { carrera, area, programas: [{ plantel, modalidad, minimo }] } }, programas de mayor a menor mínimo
export const CARRERAS = (() => {
  const c = {};
  for (const [area, carrera, plantel, modalidad, minimo] of MINIMOS_UNAM) {
    const s = slugCarrera(carrera);
    (c[s] ||= { carrera, area, programas: [] }).programas.push({ plantel, modalidad, minimo });
  }
  for (const x of Object.values(c)) { x.programas.sort((a, b) => b.minimo - a.minimo); x.max = x.programas[0].minimo; x.min = x.programas.at(-1).minimo; }
  return c;
})();
export const conPagina = () => Object.entries(CARRERAS).filter(([, c]) => c.max >= MINIMO_PAGINA).map(([s]) => s);

const fuente = () => `<p class="pu-fuente">Fuente: <a href="${esc(FUENTE_MINIMOS.url)}" rel="noopener">${esc(FUENTE_MINIMOS.nombre)}</a>, consultada el ${esc(FUENTE_MINIMOS.consultada)}. El número es el menor con el que alguien entró a ese programa, plantel y modalidad en algún concurso de 2021 a 2026. La UNAM no fija un mínimo: el corte cambia cada año con el cupo y la demanda.</p>`;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

function ld(faq, migas) {
  return `<script type="application/ld+json">${JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: migas.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${SITIO}${u}` })) },
  ]).replace(/</g, '\\u003c')}</script>`;
}

const filaPrograma = (p, carrera = null) => `<tr data-min="${p.minimo}">${carrera ? `<th scope="row">${carrera}</th>` : ''}<td data-c="Plantel o sede">${esc(p.plantel)}</td><td data-c="Modalidad">${esc(p.modalidad)}</td><td data-c="Mínimo 2021–2026" class="ua-num">${p.minimo}</td><td data-c="Con tus aciertos" class="ua-tu" aria-live="polite"></td></tr>`;

const calculadora = (texto) => `<form class="ua-calc" novalidate onsubmit="return false">
  <label for="ua-tus"><b>¿Cuántos aciertos sacas hoy?</b><span>${texto}</span></label>
  <input id="ua-tus" type="number" inputmode="numeric" min="0" max="120" placeholder="Ej. 84">
  <p class="ua-resumen" id="ua-resumen" aria-live="polite"></p>
</form>`;

const ctas = `<div class="pu-botones"><a class="btn acento" href="${RUTA}/?plan=paquete#comprar">Comprar el simulador UNAM ${FLECHA}</a><a class="btn blanco" href="${RUTA}/diagnostico/">Diagnóstico gratis</a></div>`;
const compra = (env, para) => compraSimulador(env, { app: 'simulador-unam', nombre: 'Simulador UNAM', para, puntos: ['Examen de tu área con las 120 preguntas y el tiempo real', 'Tutor con pistas cuando fallas', 'Tus aciertos estimados para compararlos con esta tabla'] });

const FAQ_GENERAL = [
  { p: '¿Cuántos aciertos necesito para entrar a la UNAM?', r: 'No hay un número fijo: depende de la carrera, el plantel, la modalidad y el año. Como referencia, la DGAE publicó para cada programa el menor número de aciertos con el que alguien entró entre 2021 y 2026; van de 40 a 111.' },
  { p: '¿Qué significa el mínimo 2021–2026?', r: 'Es el menor número de aciertos que permitió el ingreso a ese programa, plantel y modalidad en alguno de los concursos de 2021 a 2026. La UNAM lo publicó para convocar al examen de control de 2026. No garantiza tu lugar en 2027.' },
  { p: '¿Si no me alcanza para mi carrera, me dan otra?', r: 'No. Según el instructivo 2026 de la DGAE, solo concursas por la carrera, plantel y modalidad que registraste; si tus aciertos no alcanzan, no te asignan a otra.' },
  { p: '¿Cuántas preguntas tiene el examen de la UNAM?', r: 'En el concurso de licenciatura 2026, 120 preguntas en un máximo de tres horas efectivas, según el instructivo de la DGAE.' },
];

const SCRIPT = `(function(){
  var i=document.getElementById('ua-tus'), r=document.getElementById('ua-resumen'); if(!i) return;
  var filas=[].slice.call(document.querySelectorAll('tr[data-min]'));
  function pinta(){
    var v=String(i.value||'').trim(), n=Number(v), ok=v!==''&&n>=0&&n<=120&&Math.floor(n)===n, cuantos=0;
    filas.forEach(function(f){ var m=+f.getAttribute('data-min'), c=f.querySelector('.ua-tu'); f.classList.remove('ua-si','ua-no');
      if(!ok){ c.textContent=''; return; } if(n>=m){ c.textContent='Llegas'; f.classList.add('ua-si'); cuantos++; } else { c.textContent='Te faltan '+(m-n); f.classList.add('ua-no'); } });
    r.textContent=!v?'':!ok?'Escribe un número de 0 a 120.':cuantos?('Con '+n+' aciertos llegas al mínimo 2021–2026 de '+cuantos+' de '+filas.length+(filas.length===1?' programa':' programas')+' de esta lista. No es garantía: el corte cambia cada año.'):('Con '+n+' aciertos todavía no llegas al mínimo 2021–2026 de ninguno de esta lista.');
  }
  i.addEventListener('input',pinta);
  var b=document.getElementById('ua-buscar'); if(b){ b.addEventListener('input',function(){ var q=b.value.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();
    filas.forEach(function(f){ f.hidden=q&&f.textContent.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().indexOf(q)<0; }); }); }
})();`;

const CSS_UA = `<style>
.ua-calc{display:grid;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px;box-shadow:var(--sombra);margin-top:22px;max-width:620px}
.ua-calc label b{display:block;font-size:17.5px}.ua-calc label span{color:var(--fg-2);font-size:14.5px}
.ua-calc input,.ua-buscar{font:inherit;font-size:18px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--fg);width:100%;max-width:240px}
.ua-buscar{max-width:420px;font-size:16px;margin-top:18px}
.ua-resumen{margin:0;font-size:15px;color:var(--fg-2)}.ua-resumen:empty{display:none}
.ua-t{width:100%;border-collapse:collapse;margin-top:18px;font-size:15px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.ua-t th,.ua-t td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
.ua-t thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.ua-t th[scope=row]{font-weight:650}.ua-t th[scope=row] a{color:inherit}
.ua-num{font-weight:800;font-size:17px}.ua-tu{font-weight:650;white-space:nowrap}
.ua-si .ua-tu{color:var(--ok,#1F7A4A)}.ua-no .ua-tu{color:var(--fg-2)}
.ua-area{margin-top:34px}.ua-area:first-of-type{margin-top:8px}
.ua-otras{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;padding:0;list-style:none}
.ua-otras a{display:inline-block;padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:14.5px;color:inherit;text-decoration:none}
@media(max-width:640px){.ua-t thead{display:none}.ua-t tr{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--line);padding:6px 0}.ua-t th,.ua-t td{border:0;padding:6px 14px}.ua-t th[scope=row]{grid-column:1/-1}.ua-t td::before{content:attr(data-c);display:block;font-size:12px;font-weight:600;color:var(--fg-2)}}
</style>`;

// /simulador-unam/aciertos/<carrera>/
export async function paginaCarreraUnam(env, slug) {
  const c = CARRERAS[slug];
  if (!c || c.max < MINIMO_PAGINA) return null;
  const { tarjeta, barra } = await compra(env, `Área ${c.area}`);
  const ruta = `${RUTA_ACIERTOS}${slug}/`, n = c.programas.length;
  const rango = c.max === c.min ? `${c.max}` : `de ${c.min} a ${c.max}`;
  const faq = [
    { p: `¿Cuántos aciertos piden para ${c.carrera} en la UNAM?`, r: `No hay un número fijo. Como referencia, el menor número de aciertos con el que alguien entró entre 2021 y 2026 fue ${c.programas.map(p => `${p.minimo} en ${p.plantel} (${p.modalidad.toLowerCase()})`).join(', ')}, según la DGAE.` },
    { p: `¿De qué área es ${c.carrera}?`, r: `Del Área ${c.area}, ${AREAS[c.area]}. Tu examen es el de esa área.` },
    FAQ_GENERAL[2],
  ];
  const otras = Object.entries(CARRERAS).filter(([s, x]) => s !== slug && x.area === c.area && x.max >= MINIMO_PAGINA).sort((a, b) => b[1].max - a[1].max);
  return pagina({
    titulo: `Aciertos para ${c.carrera} en la UNAM: mínimo por plantel 2021–2026 | Vorka México`, ruta,
    descripcion: `${c.carrera} en la UNAM: ${n === 1 ? 'su mínimo' : `los mínimos de sus ${n} programas`} 2021–2026 (${rango} aciertos) según la DGAE. Calcula si te alcanza y practica con el simulador del Área ${c.area}.`,
    imagen: `${SITIO}/assets/tienda/v3/simulador-unam-og.jpg`,
    head: ld(faq, [['Simulador UNAM', `${RUTA}/`], ['Aciertos por carrera', RUTA_ACIERTOS], [c.carrera, ruta]]) + CSS + CSS_UA + CSS_COMPRA,
    script: SCRIPT,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador UNAM</a> / <a href="${RUTA_ACIERTOS}">Aciertos por carrera</a> / ${esc(c.carrera)}</nav>
  <h1 class="t-h1">¿Cuántos aciertos piden para ${esc(c.carrera)} en la UNAM?</h1>
  <p class="t-lead">${esc(c.carrera)} se imparte en ${plural(n, 'programa', 'programas')} (plantel y modalidad). El menor número de aciertos con el que alguien entró entre 2021 y 2026 va ${c.max === c.min ? `en ${c.max}` : `de ${c.min} a ${c.max}`}. Es del Área ${c.area}, ${esc(AREAS[c.area])}.</p>
  ${calculadora('Escribe tus aciertos de un simulacro o del diagnóstico y ve, plantel por plantel, si llegas al mínimo 2021–2026.')}
  ${tarjeta}
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Mínimo 2021–2026 por plantel</h2>
  <table class="ua-t"><thead><tr><th scope="col">Plantel o sede</th><th scope="col">Modalidad</th><th scope="col">Mínimo 2021–2026</th><th scope="col">Con tus aciertos</th></tr></thead>
  <tbody>${c.programas.map(p => filaPrograma(p)).join('')}</tbody></table>
  ${fuente()}
</div></section>

<section class="t-sec"><div class="marco">
  <h2 class="h2">Qué hacer con este número</h2>
  <div class="pu-grid">
    <div class="pu-card"><h3>Ponte una meta con margen</h3><p>El mínimo fue el último que entró en el año más fácil de esos seis, no el que entró tranquilo. Apunta varios aciertos arriba.</p></div>
    <div class="pu-card"><h3>Elige plantel con estrategia</h3><p>Solo concursas por la carrera, plantel y modalidad que registras. Si no te alcanza, no te asignan a otra. ${n > 1 ? 'Compara los planteles de arriba.' : ''}</p></div>
    <div class="pu-card"><h3>Ojo con 2026</h3><p>El examen de 2026 fue en línea y la UNAM detectó puntajes inflados; por eso aplicó un examen de control. Usa varios años de referencia, no solo el último.</p></div>
  </div>
  ${ctas}
</div></section>

${otras.length ? `<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Otras carreras del Área ${c.area}</h2>
  <ul class="ua-otras">${otras.map(([s, x]) => `<li><a href="${RUTA_ACIERTOS}${s}/">${esc(x.carrera)} · ${x.max}</a></li>`).join('')}</ul>
  <p class="pu-nota"><a href="${RUTA_ACIERTOS}">Ver las 118 carreras y sus 220 programas</a>.</p>
</div></section>` : ''}

<section class="t-sec"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">${esc(c.carrera)} en la UNAM</h2></div>
  <div class="t-faq" style="margin-top:22px">${faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  <p class="t-nota" style="margin-top:22px">Página informativa de Vorka México con datos públicos de la DGAE. No estamos afiliados a la UNAM. Confirma siempre la convocatoria vigente.</p>
</div></section>${barra}`,
  });
}

// /simulador-unam/aciertos/
export async function paginaAciertosUnam(env) {
  const { tarjeta, barra } = await compra(env, 'las 4 áreas');
  const total = MINIMOS_UNAM.length, carreras = Object.keys(CARRERAS).length;
  const porArea = a => Object.entries(CARRERAS).filter(([, c]) => c.area === a).sort((x, y) => x[1].carrera.localeCompare(y[1].carrera, 'es'));
  return pagina({
    titulo: 'Aciertos para entrar a la UNAM por carrera y plantel (2021–2026) | Vorka México', ruta: RUTA_ACIERTOS,
    descripcion: `Los ${total} programas de licenciatura de la UNAM con su mínimo de aciertos 2021–2026 según la DGAE. Escribe tus aciertos y ve a qué carreras y planteles llegas.`,
    imagen: `${SITIO}/assets/tienda/v3/simulador-unam-og.jpg`,
    head: ld(FAQ_GENERAL, [['Simulador UNAM', `${RUTA}/`], ['Aciertos por carrera', RUTA_ACIERTOS]]) + CSS + CSS_UA + CSS_COMPRA,
    script: SCRIPT,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador UNAM</a> / Aciertos por carrera</nav>
  <h1 class="t-h1">Aciertos para entrar a la UNAM por carrera y plantel</h1>
  <p class="t-lead">Los ${total} programas de licenciatura (${carreras} carreras en sus planteles y modalidades) con el menor número de aciertos con el que alguien entró entre 2021 y 2026, según la DGAE. Escribe tus aciertos y la tabla te dice a cuáles llegas.</p>
  ${calculadora('De un simulacro o del diagnóstico gratis. El examen tiene 120 preguntas.')}
  ${tarjeta}
  ${fuente()}
</div></section>

<section class="t-sec suave"><div class="marco">
  <h2 class="h2">Las ${carreras} carreras, por área</h2>
  <input class="ua-buscar" id="ua-buscar" type="search" placeholder="Busca tu carrera o plantel" aria-label="Buscar carrera o plantel">
  ${[1, 2, 3, 4].map(a => `<div class="ua-area"><h3 class="h3">Área ${a} · ${esc(AREAS[a])}</h3>
  <table class="ua-t"><thead><tr><th scope="col">Carrera</th><th scope="col">Plantel o sede</th><th scope="col">Modalidad</th><th scope="col">Mínimo 2021–2026</th><th scope="col">Con tus aciertos</th></tr></thead>
  <tbody>${porArea(a).flatMap(([s, c]) => c.programas.map(p => filaPrograma(p, c.max >= MINIMO_PAGINA ? `<a href="${RUTA_ACIERTOS}${s}/">${esc(c.carrera)}</a>` : esc(c.carrera)))).join('')}</tbody></table></div>`).join('')}
</div></section>

<section class="t-sec"><div class="marco">
  <h2 class="h2">¿Todavía no sabes cuántos aciertos sacarías?</h2>
  <p class="lead">Haz el diagnóstico gratis: preguntas tipo examen UNAM con tutor y tu número estimado de aciertos.</p>
  ${ctas}
  <div style="margin-top:34px"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">Aciertos y admisión a la UNAM</h2></div>
  <div class="t-faq" style="margin-top:22px">${FAQ_GENERAL.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  <p class="pu-nota">Más a fondo: <a href="/learn/unam/cuantos-aciertos-para-entrar-a-la-unam/">cómo se asignan los lugares y qué pasó en 2026</a>.</p>
  <p class="t-nota" style="margin-top:14px">Página informativa de Vorka México con datos públicos de la DGAE. No estamos afiliados a la UNAM.</p>
</div></section>${barra}`,
  });
}
