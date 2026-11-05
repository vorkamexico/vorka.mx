// Demos de los tests de la tienda (ver marco.js):
// · Test vocacional: 5 preguntas reales del test (la parte «Lo que te gusta», con sus mismas opciones) y luego el perfil
//   gratis tal como se ve, pero de EJEMPLO y marcado así: lo calcula el motor real (tests/vocacional.js › calcular) con
//   las respuestas completas de una persona ficticia. Con 5 de 48 preguntas no se puede dar un perfil de verdad.
// · ¿Qué proyecto social hago?: 5 de sus 10 preguntas reales (causas, fortalezas, tamaño, presupuesto y tiempo) y tus
//   3 ideas gratis calculadas con la regla real (la de proyecto.js › afinidad, copiada en AFINIDAD_JS; una prueba revisa que den lo mismo) y la biblioteca real.
//   Sin giro, aliados ni municipio: el cuestionario completo afina con eso. Nada se guarda ni se manda.
import { TIPOS, INTERESES, OPC_INTERES, HABILIDADES, AREAS_UNAM } from '../tests/vocacional-datos.js';
import { calcular } from '../tests/vocacional.js';
import { PREGUNTAS, PROYECTOS, TAMANOS } from '../tests/proyecto-datos.js';

// La regla de proyecto.js › afinidad, para el navegador (test/demos-educacion.test.js la compara con la original)
export const AFINIDAD_JS = `function afinidad(pr,r){
  const inter=(a,b)=>a.filter(x=>b.includes(x)).length;
  let s=3*inter(pr.causas,r.causas)+3*inter(pr.exp,r.expertise)+inter(pr.col,r.colaborar||[]);
  s+=pr.giros.length?(pr.giros.includes(r.giro)?2:0):1;
  s-=3*Math.max(0,pr.pres-Number(r.presupuesto))+3*Math.max(0,pr.tiempo-Number(r.tiempo));
  if(TAMANOS.indexOf(pr.tam)>TAMANOS.indexOf(r.tamano))s-=6;
  return s;
}`;
const json = x => JSON.stringify(x).replace(/</g, '\\u003c');
const N_VOC = 48;   // INTERESES + HABILIDADES + PREFERENCIAS del test (lo dice su página)

// Estilos compartidos (prefijo dt-)
const CSS = `
.dt{padding:18px 16px 22px}
.dt-et{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--pm)}
.dt h2{margin:8px 0 6px;font-size:24px;line-height:1.2;letter-spacing:-.02em}
.dt-lead{margin:0 0 16px;color:#5d5860;font-size:15.5px}
.dt-prog{display:flex;align-items:center;gap:10px;font-size:13px;color:#5d5860;margin-bottom:14px}
.dt-prog span{flex:1;height:6px;border-radius:6px;background:#ECEAEE;overflow:hidden}.dt-prog i{display:block;height:100%;background:var(--pm);border-radius:6px;transition:width .3s}
.dt-q{margin:0 0 12px;font-size:20px;font-weight:700;line-height:1.3;letter-spacing:-.015em}
.dt-ayuda{margin:0 0 16px;font-size:14px;color:#5d5860}
.dt-ops{display:grid;gap:9px}
.dt-op{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;text-align:left;padding:12px 14px;border-radius:16px;border:1.5px solid #E2E0E4;background:#fff;font-size:16px;font-weight:550;line-height:1.35}
.dt-op[aria-pressed=true]{border-color:var(--pm);background:var(--pm-s);color:var(--pm)}
.dt-op .c{width:20px;height:20px;border-radius:6px;border:1.5px solid #CFCBD2;flex:none;display:grid;place-items:center;font-size:13px;font-weight:800;color:#fff}
.dt-op[aria-pressed=true] .c{background:var(--pm);border-color:var(--pm)}
.dt-chips{display:flex;flex-wrap:wrap;gap:8px}
.dt-chip{min-height:44px;padding:8px 14px;border-radius:999px;border:1.5px solid #E2E0E4;background:#fff;font-size:14.5px;font-weight:600}
.dt-chip[aria-pressed=true]{border-color:var(--pm);background:var(--pm-s);color:var(--pm)}
.dt-chip:disabled{opacity:.4;cursor:not-allowed}
.dt-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;border:0;border-radius:999px;background:#141114;color:#fff;font-weight:700;font-size:16px;margin-top:16px;text-decoration:none}
.dt-btn.pm{background:var(--pm)}.dt-btn:disabled{opacity:.35;cursor:not-allowed}
.dt-btn.sec{background:#fff;color:#141114;border:1.5px solid #E2E0E4;margin-top:10px}
.dt-atras{border:0;background:none;color:#5d5860;font-size:14px;font-weight:600;min-height:44px;padding:0 4px;margin-top:6px}
.dt-ej{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:#FBF6EA;border:1px solid #EEDFB8;color:#5c4a1f;font-size:13.5px;line-height:1.45;margin:0 0 16px}
.dt-ej b{color:#3d3112}
.dt-tipos{display:grid;gap:8px;margin:0 0 18px}
.dt-tipo{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center;padding:12px 14px;border-radius:16px;border:1.5px solid color-mix(in srgb,var(--c) 35%,#fff);background:color-mix(in srgb,var(--c) 7%,#fff)}
.dt-tipo .pt{grid-row:span 2;width:46px;height:46px;border-radius:14px;background:var(--c);color:#fff;display:grid;place-items:center;font-weight:800;font-size:17px;font-variant-numeric:tabular-nums}
.dt-tipo b{font-size:16px}.dt-tipo small{color:#5d5860;font-size:13px}
.dt-tipo p{grid-column:1/-1;margin:6px 0 0;font-size:14px;color:#3f3b42}
.dt-h3{margin:18px 0 10px;font-size:17px;letter-spacing:-.01em}
.dt-car{padding:14px;border-radius:16px;border:1px solid #E7E5E9;font-size:14.5px;color:#3f3b42}
.dt-car-h{display:flex;align-items:center;gap:10px;margin-bottom:6px}.dt-car-h b{font-size:17px;color:#141114}
.dt-af{padding:3px 9px;border-radius:999px;background:var(--pm);color:#fff;font-weight:750;font-size:13px;font-variant-numeric:tabular-nums}
.dt-car p{margin:6px 0 0}
.dt-cand{margin:14px 0 0;padding:14px;border-radius:16px;background:#F6F5F7;font-size:14px;color:#5d5860}
.dt-cand b{color:#141114}.dt-cand ul{margin:8px 0 0;padding-left:18px;display:grid;gap:4px}
.dt-ideas{list-style:none;margin:0;padding:0;display:grid;gap:10px;counter-reset:i}
.dt-ideas li{counter-increment:i;position:relative;padding:14px 14px 14px 52px;border-radius:16px;border:1.5px solid #E7E5E9;background:#fff}
.dt-ideas li::before{content:counter(i);position:absolute;left:14px;top:14px;width:28px;height:28px;border-radius:9px;background:var(--pm);color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px}
.dt-ideas b{display:block;font-size:16px;line-height:1.3}.dt-ideas p{margin:4px 0 0;font-size:14px;color:#5d5860;line-height:1.45}
.dt-nota{margin:12px 0 0;font-size:13px;color:#6b666e}
`;

const JS_COMUN = `
const $=s=>document.querySelector(s),app=$('#dt');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const top=()=>{try{app.scrollIntoView({block:'start'})}catch(e){}scrollTo(0,0)};
const prog=(i,n,extra)=>'<div class="dt-prog"><b>'+(i+1)+' de '+n+'</b><span aria-hidden="true"><i style="width:'+Math.round(100*(i+1)/n)+'%"></i></span>'+(extra||'')+'</div>';
`;

// ---------- Test vocacional ----------
// 5 de las 30 preguntas de intereses (una de cada tipo, menos Convencional), con sus opciones reales
const PREG_VOC = [0, 7, 2, 3, 4].map(k => INTERESES[k][1]);
// Perfil de EJEMPLO: respuestas completas de una persona ficticia, calificadas con el motor real
const EJ_I = { R: 0, I: 2, A: 1, S: 2, E: 1, C: 0 }, EJ_H = { R: 1, I: 4, A: 2, S: 3, E: 2, C: 3 };
const EJ = calcular({ i: INTERESES.map(([t]) => EJ_I[t]), h: HABILIDADES.map(([t]) => EJ_H[t]), mate: 'gustan', lugar: 'I', motivo: 'S', duracion: 'lic', nivel: 'prepa', examen: 'unam' });
const c1 = EJ.carreras[0];
const DATOS_VOC = {
  preguntas: PREG_VOC, opciones: OPC_INTERES.map(([, t]) => t), total: N_VOC,
  ej: { codigo: EJ.codigo, tipos: EJ.tipos.slice(0, 3).map(t => ({ n: TIPOS[t].nombre, c: TIPOS[t].corto, f: TIPOS[t].frase, color: TIPOS[t].color, p: EJ.p[t] })),
    carrera: { n: c1.n, af: c1.af, e: c1.e, t: c1.t, area: c1.a ? AREAS_UNAM[c1.a] : '' } },
};
const vocacional = {
  titulo: 'Contesta como en el test y mira cómo se ve tu perfil.',
  texto: '5 preguntas reales del test vocacional y, al final, un perfil de ejemplo: así te sale gratis el tuyo con las 48 preguntas.',
  prueba: ['Las preguntas de «Lo que te gusta», con sus mismas opciones', 'Un perfil de ejemplo: código de 3 letras, tipos con puntaje y carrera más afín', 'Lo que trae el reporte completo, para que sepas qué desbloqueas'],
  cta: 'Hacer el test completo gratis',
  css: CSS,
  html: '<section class="dt" id="dt" aria-live="polite"></section>',
  js: `(()=>{const D=${json(DATOS_VOC)};${JS_COMUN}
let i=0,resp=[],espera=0;
function pregunta(){
  app.innerHTML=prog(i,D.preguntas.length,'<small>el test completo: '+D.total+'</small>')+'<p class="dt-ayuda">¿Qué tanto te gustaría hacer esto? No pienses si sabes hacerlo: solo si te gustaría.</p><h2 class="dt-q">'+esc(D.preguntas[i])+'</h2>'+
   '<div class="dt-ops" role="group" aria-label="Tu respuesta" style="margin-top:14px">'+D.opciones.map((o,k)=>'<button type="button" class="dt-op" aria-pressed="'+(resp[i]===k)+'" data-k="'+k+'"><span class="c">'+(resp[i]===k?'✓':'')+'</span>'+esc(o)+'</button>').join('')+'</div>'+
   (i?'<button type="button" class="dt-atras" id="dt-atras">← Anterior</button>':'');
}
function perfil(){
  const E=D.ej;
  app.innerHTML='<span class="dt-et">Tu perfil gratis</span><h2>Así se ve tu resultado</h2>'+
   '<p class="dt-ej" role="note"><span aria-hidden="true">★</span><span><b>Es un perfil de ejemplo</b>, de una persona ficticia que contestó las '+D.total+' preguntas. El tuyo sale gratis al terminar el test completo.</span></p>'+
   '<p class="dt-lead" style="margin:0 0 10px">Código <b style="font-size:20px;letter-spacing:.04em;color:#141114">'+esc(E.codigo)+'</b>: los 3 intereses que más pesan.</p>'+
   '<div class="dt-tipos">'+E.tipos.map(t=>'<div class="dt-tipo" style="--c:'+t.color+'"><span class="pt">'+t.p+'</span><b>'+esc(t.n)+'</b><small>'+esc(t.c)+'</small><p>'+esc(t.f)+'</p></div>').join('')+'</div>'+
   '<h3 class="dt-h3">Su carrera más afín</h3><div class="dt-car"><div class="dt-car-h"><span class="dt-af">'+E.carrera.af+'%</span><b>'+esc(E.carrera.n)+'</b></div>'+
   '<p><b>Qué se estudia:</b> '+esc(E.carrera.e)+'</p><p><b>En qué se trabaja:</b> '+esc(E.carrera.t)+'</p>'+(E.carrera.area?'<p><b>Examen:</b> '+esc(E.carrera.area)+' en la UNAM.</p>':'')+'</div>'+
   '<div class="dt-cand"><b>🔒 En el reporte completo</b><ul><li>19 carreras afines más, con qué se estudia y en qué se trabaja</li><li>El examen que te toca, con el simulador y las guías para practicarlo</li><li>Un plan de 30 días para decidir</li></ul></div>'+
   '<p class="dt-nota">Es orientativo: no es una prueba psicométrica ni un diagnóstico.</p>'+
   '<button type="button" class="dt-btn sec" id="dt-otra">Volver a empezar</button>';
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.k!==undefined){if(espera)return;espera=1;resp[i]=+b.dataset.k;pregunta();setTimeout(()=>{espera=0;i++;if(i<D.preguntas.length)pregunta();else perfil();top()},260)}
  else if(b.id==='dt-atras'){i--;pregunta()}
  else if(b.id==='dt-otra'){i=0;resp=[];pregunta();top()}
});
pregunta();
})();`,
};

// ---------- ¿Qué proyecto social hago? ----------
const PREG_PS = ['causas', 'expertise', 'tamano', 'presupuesto', 'tiempo'].map(k => ({ k, p: PREGUNTAS[k].p, max: PREGUNTAS[k].max || 1, o: PREGUNTAS[k].unica || PREGUNTAS[k].multi }));
const BIBLIOTECA = PROYECTOS.map(({ n, l, causas, exp, giros, pres, tiempo, tam, col }) => ({ n, l, causas, exp, giros, pres, tiempo, tam, col }));
const proyecto = {
  titulo: 'Contesta 5 preguntas y ve tus 3 ideas de proyecto social.',
  texto: 'Elige tus causas, en qué son buenos, su tamaño, su presupuesto y su tiempo: las ideas salen de la biblioteca real de proyectos, con la misma regla del cuestionario.',
  prueba: ['Elegir hasta 3 causas y hasta 3 fortalezas', 'Ver cómo cambian las ideas si mueves el presupuesto o el tiempo', 'Tus 3 ideas gratis y lo que trae el reporte completo'],
  cta: 'Hacer el cuestionario completo gratis',
  css: CSS,
  html: '<section class="dt" id="dt" aria-live="polite"></section>',
  js: `(()=>{const D=${json({ preguntas: PREG_PS, biblioteca: BIBLIOTECA })};const TAMANOS=${json(TAMANOS)};
${AFINIDAD_JS}
${JS_COMUN}
let i=0,espera=0;const r={causas:[],expertise:[],colaborar:[],giro:'',tamano:'',presupuesto:'',tiempo:''};
const val=q=>q.max>1?r[q.k]:r[q.k]===''?[]:[r[q.k]];
function pregunta(){
  const q=D.preguntas[i],v=val(q),multi=q.max>1;
  app.innerHTML=prog(i,D.preguntas.length,'<small>de 10 en el completo</small>')+'<h2 class="dt-q">'+esc(q.p)+'</h2>'+(multi?'':'<p class="dt-ayuda">Elige una.</p>')+
   (multi?'<div class="dt-chips" role="group" aria-label="'+esc(q.p)+'">'+q.o.map(([id,t])=>'<button type="button" class="dt-chip" aria-pressed="'+v.includes(id)+'" data-v="'+id+'"'+(!v.includes(id)&&v.length>=q.max?' disabled':'')+'>'+esc(t)+'</button>').join('')+'</div>'
    :'<div class="dt-ops" role="group" aria-label="'+esc(q.p)+'">'+q.o.map(([id,t])=>'<button type="button" class="dt-op" aria-pressed="'+v.includes(id)+'" data-v="'+id+'"><span class="c">'+(v.includes(id)?'✓':'')+'</span>'+esc(t)+'</button>').join('')+'</div>')+
   (multi?'<button type="button" class="dt-btn" id="dt-sig"'+(v.length?'':' disabled')+'>Siguiente</button>':'')+
   (i?'<button type="button" class="dt-atras" id="dt-atras">← Anterior</button>':'');
}
function ideas(){
  const orden=D.biblioteca.map((pr,k)=>({pr,k,s:afinidad(pr,r)})).sort((a,b)=>b.s-a.s||a.k-b.k);
  const pos=orden.filter(x=>x.s>0).length,rep=Math.max(5,Math.min(8,pos)),mas=orden.slice(3,rep);
  app.innerHTML='<span class="dt-et">Tus ideas gratis</span><h2>Tus 3 proyectos más afines</h2>'+
   '<p class="dt-lead">Con tus 5 respuestas y la biblioteca de proyectos de Vorka. El cuestionario completo afina con tu giro, tus aliados y tu municipio.</p>'+
   '<ol class="dt-ideas">'+orden.slice(0,3).map(x=>'<li><b>'+esc(x.pr.n)+'</b><p>'+esc(x.pr.l)+'</p></li>').join('')+'</ol>'+
   '<div class="dt-cand"><b>🔒 En el reporte completo: '+rep+' proyectos a detalle</b><ul><li>Objetivo, primeros pasos, recursos, indicadores, ODS y riesgos de cada uno</li>'+mas.map(x=>'<li>'+esc(x.pr.n)+'</li>').join('')+'</ul></div>'+
   '<p class="dt-nota">Es una guía para empezar: no sustituye un diagnóstico de la comunidad.</p>'+
   '<button type="button" class="dt-btn sec" id="dt-cambiar">Cambiar presupuesto o tiempo</button><button type="button" class="dt-btn sec" id="dt-otra">Volver a empezar</button>';
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const q=D.preguntas[i];
  if(b.dataset.v!==undefined){
    if(q.max>1){const l=r[q.k],x=b.dataset.v,j=l.indexOf(x);if(j>=0)l.splice(j,1);else if(l.length<q.max)l.push(x);pregunta()}
    else{if(espera)return;espera=1;r[q.k]=b.dataset.v;pregunta();setTimeout(()=>{espera=0;i++;if(i<D.preguntas.length)pregunta();else ideas();top()},260)}}
  else if(b.id==='dt-sig'){i++;pregunta();top()}
  else if(b.id==='dt-atras'){i--;pregunta()}
  else if(b.id==='dt-cambiar'){i=3;pregunta();top()}
  else if(b.id==='dt-otra'){i=0;r.causas=[];r.expertise=[];r.tamano=r.presupuesto=r.tiempo='';pregunta();top()}
});
pregunta();
})();`,
};

export default { vocacional, proyecto };
