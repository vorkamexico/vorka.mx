// Calculadora de puntaje PAA (vorka.mx/simulador-paa/calculadora/), nov 2026.
// Search Console: la página de la UdeG salía en «calculadora paa» y «calculadora de puntaje paa» sin clics, porque no tenía
// calculadora. Aquí solo hay cuentas que las fuentes oficiales permiten hacer (las mismas de paa-universidades.js):
//   1. Total de la PAA = Lectura y Redacción + Matemáticas (cada parte de 200 a 800; total de 400 a 1,600), comparado con
//      los mínimos de la UDEM (numeral 5.3.6), la Beca Descubre STEM del ITESO y las becas de BECAS_PAA.
//   2. UdeG: promedio de bachillerato (0 a 100) + resultado de la PAA en escala de 0 a 100 = puntaje de admisión (hasta 200).
//      La UdeG no publica cómo pasa la PAA de 200–800 a 0–100: no lo inventamos; se escribe el número de su dictamen.
// Todo se calcula en el navegador; no se guarda nada.
import { esc, pagina } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { SITIO } from '../seo.js';
import { UNIVERSIDADES, BECAS_PAA, CSS } from './paa-universidades.js';

const RUTA = '/simulador-paa';
export const RUTA_CALCULADORA = `${RUTA}/calculadora/`;

// Metas con las que se compara el total (de las fuentes ya citadas en las páginas por universidad)
export const METAS_TOTAL = [
  { id: 'udem', texto: 'Mínimo de la UDEM', total: 1200, partes: 550, promedio: 80, pagina: `${RUTA}/udem/`, nota: 'y 550 en cada parte (Enfermería: 1,100 y 500)' },
  { id: 'iteso', texto: 'Beca Descubre STEM del ITESO', total: 1251, mostrar: 'más de 1,250', pagina: `${RUTA}/iteso/` },
  ...BECAS_PAA.map(b => ({ id: b.id, texto: `${b.nombre} · ${b.donde}`, total: b.paa, mostrar: b.paaTexto || null, promedio: b.promedio, pagina: b.pagina })),
];

const FAQ = [
  { p: '¿Cómo se calcula el puntaje total de la PAA?', r: 'Se suman tus dos partes: Lectura y Redacción (de 200 a 800) y Matemáticas (de 200 a 800). El total va de 400 a 1,600. Así lo leen, por ejemplo, la UDEM y el ITESO. Inglés se califica aparte.' },
  { p: '¿Cuánto pide la UDEM en la PAA?', r: 'Según su lineamiento de admisión (numeral 5.3.6): 1,200 en total, 550 en razonamiento verbal, 550 en razonamiento matemático y promedio de 80. En Enfermería: 1,100, 500, 500 y 70.' },
  { p: '¿Cómo se calcula el puntaje de admisión de la UdeG?', r: 'Tu promedio de bachillerato (de 0 a 100) y tu resultado de la PAA (de 0 a 100) pesan 50 % cada uno; la suma de los dos, hasta 200, es la puntuación con la que se decide tu admisión. El mínimo cambia por carrera, centro y ciclo.' },
  { p: '¿Puedo pasar mi puntaje de 200 a 800 a la escala de la UdeG?', r: 'No con exactitud: la UdeG no publica esa conversión. Usa el resultado en escala de 0 a 100 que aparece en tu dictamen, o el de un ciclo anterior como referencia.' },
  { p: '¿Cuánto sacaría hoy en la PAA?', r: 'Si todavía no la presentas, haz el diagnóstico gratis del Simulador PAA: 12 preguntas con tutor y te da un puntaje estimado por sección. Es una estimación para orientar tu estudio, no un resultado oficial.' },
];

const mil = n => n.toLocaleString('es-MX');

export function paginaCalculadoraPaa() {
  const udem = UNIVERSIDADES.udem.fuentes[0], udeg = UNIVERSIDADES.udeg.fuentes[0];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Simulador PAA', item: `${SITIO}${RUTA}/` },
      { '@type': 'ListItem', position: 2, name: 'Calculadora de puntaje PAA', item: `${SITIO}${RUTA_CALCULADORA}` }] },
  ];
  const datos = { metas: METAS_TOTAL.map(m => ({ texto: m.texto, total: m.total, mostrar: m.mostrar || mil(m.total), partes: m.partes || 0, promedio: m.promedio || 0, nota: m.nota || '', pagina: m.pagina })) };
  return pagina({
    titulo: 'Calculadora de puntaje PAA: total, UDEM, UdeG y becas | Vorka México', ruta: RUTA_CALCULADORA,
    descripcion: 'Calcula tu puntaje total de la PAA (de 400 a 1,600) y compáralo con lo que piden la UDEM, el ITESO y las becas. Para la UdeG, suma tu promedio y tu PAA.',
    imagen: `${SITIO}/assets/tienda/v3/simulador-paa-og.jpg`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}${CSS_CALC}`,
    script: `window.PAA_CALC=${JSON.stringify(datos).replace(/</g, '\\u003c')};${SCRIPT}`,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador PAA</a> / Calculadora de puntaje</nav>
  <h1 class="t-h1">Calculadora de puntaje PAA</h1>
  <p class="t-lead">Escribe tus resultados y ve tu puntaje total, cuánto te falta para la UDEM, el ITESO o una beca, y tu puntaje de admisión en la UdeG. Todo se calcula en tu celular: no guardamos nada.</p>
</div></section>

<section class="t-sec suave"><div class="marco pc-g">
  <form class="pu-card pc-caja" id="pc-total" novalidate onsubmit="return false">
    <h2 class="h3">Tu puntaje total</h2>
    <p class="pc-ayuda">Lectura y Redacción + Matemáticas. Cada parte va de 200 a 800.</p>
    <div class="pc-fila">
      <div class="t-campo"><label for="pc-verbal">Lectura y Redacción</label><input id="pc-verbal" type="number" inputmode="numeric" min="200" max="800" step="1" placeholder="Ej. 610"></div>
      <div class="t-campo"><label for="pc-mate">Matemáticas</label><input id="pc-mate" type="number" inputmode="numeric" min="200" max="800" step="1" placeholder="Ej. 580"></div>
    </div>
    <div class="t-campo"><label for="pc-prom">Tu promedio de bachillerato <small>(opcional, de 0 a 100)</small></label><input id="pc-prom" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="Ej. 87"></div>
    <div class="pc-res" id="pc-total-res" aria-live="polite"><p class="pc-vacio">Escribe tus dos partes para ver tu total.</p></div>
  </form>

  <form class="pu-card pc-caja" id="pc-udeg" novalidate onsubmit="return false">
    <h2 class="h3">Tu puntaje de admisión en la UdeG</h2>
    <p class="pc-ayuda">Promedio (de 0 a 100) + PAA en escala de 0 a 100. La suma, hasta 200, decide tu admisión.</p>
    <div class="pc-fila">
      <div class="t-campo"><label for="pc-u-prom">Promedio de bachillerato</label><input id="pc-u-prom" type="number" inputmode="decimal" min="0" max="100" step="0.01" placeholder="Ej. 88.5"></div>
      <div class="t-campo"><label for="pc-u-paa">PAA (de 0 a 100) <small>(opcional)</small></label><input id="pc-u-paa" type="number" inputmode="decimal" min="0" max="100" step="0.01" placeholder="Ej. 72.3"></div>
    </div>
    <div class="t-campo"><label for="pc-u-meta">Puntaje mínimo de tu carrera en un ciclo anterior <small>(opcional, hasta 200)</small></label><input id="pc-u-meta" type="number" inputmode="decimal" min="0" max="200" step="0.01" placeholder="Ej. 165"></div>
    <div class="pc-res" id="pc-udeg-res" aria-live="polite"><p class="pc-vacio">Escribe tu promedio para empezar.</p></div>
    <p class="pc-ayuda">La UdeG no publica cómo pasa tu PAA de la escala de 200 a 800 a la de 0 a 100, así que aquí no la convertimos: usa el número de tu dictamen. <a href="${RUTA}/udeg/">Cómo se calcula en la UdeG</a>.</p>
  </form>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="pc-diag">
    <div><h2 class="h3">¿Todavía no presentas la PAA?</h2><p>Haz el diagnóstico gratis: 12 preguntas con tutor y te da un puntaje estimado por sección. Con ese número ya puedes usar esta calculadora.</p></div>
    <div class="pu-botones" style="margin-top:0"><a class="btn tinta" href="${RUTA}/diagnostico/">Hacer el diagnóstico gratis ${FLECHA}</a><a class="btn blanco" href="${RUTA}/">Ver el simulador</a></div>
  </div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">Sobre el puntaje de la PAA</h2></div>
  <div class="t-faq" style="margin-top:22px">${FAQ.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  <p class="pu-nota" style="margin-top:22px">Fuentes: <a href="${esc(udem.url)}" rel="noopener">${esc(udem.nombre)}</a>; <a href="${esc(udeg.url)}" rel="noopener">${esc(udeg.nombre)}</a>; las becas, en sus guías de <a href="/oleynickhdz/becas/">vorka.mx/oleynickhdz</a>. Los requisitos cambian: confírmalos con cada universidad. Más por universidad: ${Object.entries(UNIVERSIDADES).map(([k, u]) => `<a href="${RUTA}/${k}/">PAA ${esc(u.nombre)}</a>`).join(', ')}.</p>
  <p class="t-nota" style="margin-top:14px">Página informativa de Vorka México. No estamos afiliados al College Board ni a las universidades mencionadas; PAA es una prueba del College Board.</p>
</div></section>`,
  });
}

const CSS_CALC = `<style>
.pc-g{display:grid;gap:18px;grid-template-columns:1fr}
@media (min-width:900px){.pc-g{grid-template-columns:1fr 1fr;align-items:start}}
.pc-caja h2{margin-bottom:4px}.pu-card .pc-ayuda{color:var(--fg-2);font-size:14.5px;margin:0 0 14px}
.pc-fila{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end}
.pc-caja .t-campo input{width:100%}
.pc-res{margin-top:6px;border-top:1px solid var(--line);padding-top:14px}
.pu-card .pc-vacio{color:var(--fg-2);font-size:14.5px;margin:0}
.pu-card .pc-num{font-size:34px;color:var(--fg);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:0}
.pu-card .pc-num small{font-size:15px;font-weight:600;color:var(--fg-2);letter-spacing:0;margin-left:6px}
.pc-lista{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:8px}
.pc-lista li{display:flex;justify-content:space-between;gap:12px;font-size:14.5px;padding:10px 12px;border-radius:12px;background:var(--bg)}
.pc-lista li b{white-space:nowrap}.pc-lista .si b{color:var(--ok,#1F7A4A)}
.pc-lista a{color:inherit}
.pu-card .pc-error{color:var(--er,#B3261E);font-size:14.5px;margin:0}
.pc-diag{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px}
.pc-diag p{color:var(--fg-2);margin:6px 0 0;max-width:560px}
</style>`;

// Cuentas en el navegador (sin dependencias). Los textos de resultado salen de aquí.
const SCRIPT = `(function(){
  var D=window.PAA_CALC; if(!D) return;
  var $=function(id){return document.getElementById(id);};
  var mil=function(n){return Math.round(n).toLocaleString('es-MX');};
  var dos=function(n){return (Math.round(n*100)/100).toLocaleString('es-MX',{maximumFractionDigits:2});};
  var num=function(el){var v=String(el.value||'').replace(',','.').trim(); return v===''?null:Number(v);};
  var li=function(si,txt,der,url){var l=document.createElement('li'); if(si) l.className='si'; var s=document.createElement('span'); if(url){var a=document.createElement('a'); a.href=url; a.textContent=txt; s.appendChild(a);} else s.textContent=txt; var b=document.createElement('b'); b.textContent=der; l.appendChild(s); l.appendChild(b); return l;};
  function total(){
    var v=num($('pc-verbal')), m=num($('pc-mate')), p=num($('pc-prom')), r=$('pc-total-res'); r.textContent='';
    if(v===null||m===null){ var e=document.createElement('p'); e.className='pc-vacio'; e.textContent='Escribe tus dos partes para ver tu total.'; r.appendChild(e); return; }
    if(!(v>=200&&v<=800&&m>=200&&m<=800)){ var x=document.createElement('p'); x.className='pc-error'; x.textContent='Cada parte va de 200 a 800.'; r.appendChild(x); return; }
    var t=v+m, h=document.createElement('p'); h.className='pc-num'; h.textContent=mil(t); var sm=document.createElement('small'); sm.textContent='de 1,600'; h.appendChild(sm); r.appendChild(h);
    var ul=document.createElement('ul'); ul.className='pc-lista';
    D.metas.forEach(function(g){
      var falta=Math.max(0,g.total-t), partes=g.partes&&(v<g.partes||m<g.partes), prom=g.promedio&&p!==null&&p<g.promedio;
      var der=falta?'Te faltan '+mil(falta):partes?'Te falta una parte':prom?'Te falta promedio':'Llegas';
      ul.appendChild(li(!falta&&!partes&&!prom, g.texto+': '+g.mostrar+(g.partes?' y '+g.partes+' por parte':'')+(g.promedio?' · promedio '+g.promedio:''), der, g.pagina));
    });
    r.appendChild(ul);
    var n=document.createElement('p'); n.className='pc-ayuda'; n.style.marginTop='12px'; n.textContent='El Tec de Monterrey no publica un mínimo: un comité revisa todo tu expediente. Las becas piden ese puntaje para postularte, no lo dan por llegar a él.'; r.appendChild(n);
  }
  function udeg(){
    var p=num($('pc-u-prom')), a=num($('pc-u-paa')), g=num($('pc-u-meta')), r=$('pc-udeg-res'); r.textContent='';
    var err=function(t){var x=document.createElement('p'); x.className='pc-error'; x.textContent=t; r.appendChild(x);};
    if(p===null){ var e=document.createElement('p'); e.className='pc-vacio'; e.textContent='Escribe tu promedio para empezar.'; r.appendChild(e); return; }
    if(!(p>=0&&p<=100)) return err('El promedio va de 0 a 100.');
    if(a!==null&&!(a>=0&&a<=100)) return err('La PAA en esta escala va de 0 a 100.');
    if(g!==null&&!(g>=0&&g<=200)) return err('El puntaje de admisión va de 0 a 200.');
    var ul=document.createElement('ul'); ul.className='pc-lista';
    if(a!==null){
      var t=p+a, h=document.createElement('p'); h.className='pc-num'; h.textContent=dos(t); var sm=document.createElement('small'); sm.textContent='de 200'; h.appendChild(sm); r.appendChild(h);
      if(g!==null) ul.appendChild(li(t>=g,'Contra el mínimo de '+dos(g), t>=g?'Llegas':'Te faltan '+dos(g-t)));
    }
    if(g!==null){
      var nec=g-p;
      ul.appendChild(li(nec<=0,'PAA que necesitas (de 0 a 100) con tu promedio', nec<=0?'Ya llegas con tu promedio':nec>100?'No alcanza con tu promedio':dos(nec)));
    }
    if(a===null&&g===null){ var c=document.createElement('p'); c.className='pc-vacio'; c.textContent='Tu promedio ya te da '+dos(p)+' de 200. Escribe tu PAA o el mínimo de tu carrera para seguir.'; r.appendChild(c); }
    if(ul.childNodes.length) r.appendChild(ul);
  }
  ['pc-verbal','pc-mate','pc-prom'].forEach(function(id){ $(id).addEventListener('input',total); });
  ['pc-u-prom','pc-u-paa','pc-u-meta'].forEach(function(id){ $(id).addEventListener('input',udeg); });
})();`;
