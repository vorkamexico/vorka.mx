// Prueba gratis de los simuladores (nov 2026: reemplaza al diagnóstico gratis y al mini simulacro de 5): 3 reactivos REALES
// del banco de cada examen, sin registro, con el mismo flujo que la app (simulador/app.js): cronómetro al ritmo del examen
// que solo corre en el primer intento, tutor de dos intentos (pista de método → solución paso a paso y la regla) y, al final,
// cómo le fue, qué reforzar y la compra. Sin puntaje estimado: con 3 reactivos no se promete ninguno.
// Va dentro de la página de venta (venta.js › #probar) y en /tienda/demo/<simulador>/ para mandarla por WhatsApp.
//
// Los reactivos se toman del banco por id (si alguno cambia de id, falla al cargar y lo dicen las pruebas). Elegidos
// cortos, sin lectura, figura ni tabla, para que quepan en el celular. Las opciones van en el orden del banco, así que
// {A}…{D} de pistas y pasos se cambian por su letra tal cual.
import { MARCAS } from '../marca-producto.js';
import { SECCIONES as SECCIONES_PAA, TEMAS as TEMAS_PAA, REACTIVOS as REACTIVOS_PAA } from '../simulador/banco.js';
import * as U_MAT from '../simulador/unam/matematicas.js';
import * as U_FIS from '../simulador/unam/fisica.js';
import * as U_ESP from '../simulador/unam/espanol.js';
import * as U_HU from '../simulador/unam/historia_universal.js';
import * as U_BIO from '../simulador/unam/biologia.js';
import * as E_HV from '../simulador/ecoems/habilidad_verbal.js';
import * as E_HM from '../simulador/ecoems/habilidad_matematica.js';
import * as E_MAT from '../simulador/ecoems/matematicas.js';
import * as E_BIO from '../simulador/ecoems/biologia.js';
import * as E_QUI from '../simulador/ecoems/quimica.js';
import * as G_RED from '../simulador/prepa-ug/redaccion_indirecta.js';
import * as G_MAT from '../simulador/prepa-ug/pensamiento_matematico.js';
import * as G_USO from '../simulador/prepa-ug/pensamiento_matematico_usos.js';
import * as G_CIE from '../simulador/prepa-ug/pensamiento_cientifico.js';
import * as G_ING from '../simulador/prepa-ug/ingles.js';
import * as X_MAT from '../simulador/exani-ii/pensamiento_matematico.js';
import * as X_RED from '../simulador/exani-ii/redaccion_indirecta.js';
import * as X_BIO from '../simulador/exani-ii/biologia.js';
import * as C_PM from '../simulador/excoba/pri_matematicas.js';
import * as C_SE from '../simulador/excoba/sec_espanol.js';
import * as C_SN from '../simulador/excoba/sec_ciencias_naturales.js';
import * as U_QUI from '../simulador/unam/quimica.js';

// Junta los REACTIVOS_* y TEMAS_* de varios módulos del banco
const juntar = mods => ({
  R: mods.flatMap(m => Object.entries(m).filter(([k]) => k.startsWith('REACTIVOS')).flatMap(([, v]) => v)),
  T: Object.assign({}, ...mods.flatMap(m => Object.entries(m).filter(([k]) => k.startsWith('TEMAS')).map(([, v]) => v))),
});

// ids → lo que necesita el cliente. seg(seccion): segundos por reactivo en esa sección del examen real (de la configuración
// de cada simulador). nombres: nombre de cada sección.
function tomar({ R, T }, ids, nombres, seg) {
  return ids.map(id => {
    const r = R.find(x => x.id === id);
    if (!r || !Array.isArray(r.opciones) || r.texto || r.figura || r.tabla) throw new Error(`Demo del simulador: falta el reactivo ${id}`);
    const tema = T[r.tema];
    if (!tema) throw new Error(`Demo del simulador: falta el tema ${r.tema}`);
    const letras = t => String(t).replace(/\{([A-D])\}/g, '$1');
    return { s: nombres[r.seccion] || r.seccion, t: tema.nombre, c: tema.consejo || '', e: r.enunciado, o: r.opciones, k: r.correcta,
      p: letras(r.pista), pa: r.pasos.map(letras), rg: letras(r.regla), seg: Math.round(seg(r.seccion)) };
  });
}

// ---------- el motor compartido (un solo css/html/js, parametrizado por examen) ----------
const CSS = `
.sd{padding:18px 16px 22px}
.sd-et{margin:0;font-size:14px;font-weight:650;color:var(--pm)}
.sd h2{margin:8px 0 6px;font-size:24px;line-height:1.2;letter-spacing:-.02em}
.sd-lead{margin:0;color:#5d5860;font-size:15.5px}
.sd-datos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0;padding:0;list-style:none}
.sd-datos li{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:14px;background:#F4F3F5}
.sd-datos b{font-size:22px;font-weight:750;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.sd-datos span{font-size:12.5px;color:#5d5860;line-height:1.3}
.sd-reglas{margin:0 0 18px;padding:14px 16px;border-radius:16px;border:1px solid #E7E5E9;font-size:14.5px;color:#5d5860}
.sd-reglas ol{margin:6px 0 0;padding-left:20px;display:grid;gap:6px}.sd-reglas b{color:#141114}
.sd-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:999px;background:#141114;color:#fff;font-weight:700;font-size:16px;text-decoration:none}
.sd-btn.pm{background:var(--pm)}
.sd-btn:disabled{opacity:.35;cursor:not-allowed}
.sd-btn.sd-sec{background:#fff;color:#141114;border:1.5px solid #E2E0E4;margin-top:10px}
.sd-prog{height:4px;border-radius:4px;background:#ECEAEE;overflow:hidden;margin-bottom:12px}
.sd-prog i{display:block;height:100%;background:var(--pm);border-radius:4px;transition:width .4s}
.sd-cab{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;font-size:13.5px;color:#5d5860;margin-bottom:14px}
.sd-cab b{color:#141114}
.sd-tema{font-size:12px;font-weight:650;color:var(--pm);background:var(--pm-s);padding:3px 10px;border-radius:999px}
.sd-reloj{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:#141114;color:#fff;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.sd-reloj svg{width:15px;height:15px}.sd-reloj small{font-size:11.5px;font-weight:600;opacity:.75}
.sd-reloj.pausa{background:#ECEAEE;color:#5d5860}.sd-reloj.poco:not(.pausa){background:#B3261E}
.sd-enun{margin:0 0 16px;font-size:19px;font-weight:650;line-height:1.38;letter-spacing:-.015em}
.sd-ops{display:grid;gap:9px}
.sd-op{display:flex;align-items:flex-start;gap:12px;width:100%;min-height:52px;text-align:left;padding:12px 14px;border-radius:16px;border:1.5px solid #E2E0E4;background:#fff;font-size:16px;line-height:1.4}
.sd-op .l{width:28px;height:28px;border-radius:9px;background:#F2F1F3;display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.sd-op .x{flex:1;padding-top:2px}
.sd-op.sel{border-color:#141114;box-shadow:0 0 0 3px rgba(20,17,20,.06)}.sd-op.sel .l{background:#141114;color:#fff}
.sd-op:disabled{cursor:default}
.sd-op.tachada{opacity:.55;border-style:dashed}.sd-op.tachada .x{text-decoration:line-through}
.sd-op.ok{border-color:#1E7A46;background:#EAF6EF;opacity:1}.sd-op.ok .l{background:#1E7A46;color:#fff}
.sd-op.mal{border-color:#E9B4B0;background:#FDF1F0}
.sd-acc{margin-top:16px}
.sd-tutor{display:flex;gap:12px;margin-top:16px;padding:15px;border-radius:18px;border:1px solid #E7E5E9;font-size:15px;line-height:1.5}
.sd-tutor .i{width:34px;height:34px;border-radius:11px;background:#fff;display:grid;place-items:center;flex:none}.sd-tutor .i svg{width:19px;height:19px}
.sd-tutor>div:last-child{min-width:0;flex:1}
.sd-tutor b.t{display:block;font-size:16px;margin-bottom:4px}
.sd-tutor p{margin:0}.sd-tutor small{display:block;margin-top:8px;font-size:13px;color:#5d5860}
.sd-tutor.pista{background:#FBF6EA;border-color:#EEDFB8}.sd-tutor.pista .i{color:#8a6a2c}
.sd-tutor.bien{background:#EAF6EF;border-color:#C6E5D2}.sd-tutor.bien .i{color:#1E7A46}
.sd-tutor.sol{background:var(--pm-s);border-color:color-mix(in srgb,var(--pm) 25%,#fff)}.sd-tutor.sol .i{color:var(--pm)}
.sd-tutor ol{margin:8px 0;padding-left:20px;display:grid;gap:4px}
.sd-tutor details{margin-top:8px}.sd-tutor summary{cursor:pointer;font-weight:650;font-size:14.5px;padding:6px 0}
.sd-regla{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.75);border-left:3px solid var(--pm)}
.sd-regla span{display:block;font-size:11.5px;font-weight:750;text-transform:uppercase;letter-spacing:.06em;color:var(--pm);margin-bottom:2px}
.sd-res{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:8px}
.sd-res li{display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center;padding:11px 12px;border-radius:14px;background:#F6F5F7;font-size:14.5px}
.sd-res li b{display:block;font-size:14.5px}.sd-res li small{color:#5d5860;font-size:12.5px}
.sd-res .m{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:800;color:#fff}
.sd-res .m.si{background:#1E7A46}.sd-res .m.dos{background:#C8A45C}.sd-res .m.no{background:#B3261E}
.sd-res time{font-size:13px;color:#5d5860;font-variant-numeric:tabular-nums}
.sd-h3{margin:20px 0 10px;font-size:17px;letter-spacing:-.01em}
.sd-ref{display:grid;gap:8px;margin:0 0 16px}
.sd-ref div{padding:12px 14px;border-radius:14px;border:1px solid #E7E5E9;font-size:14.5px;color:#5d5860;line-height:1.45}.sd-ref b{display:block;color:#141114;font-size:15px;margin-bottom:2px}
.sd-nota{margin:0 0 14px;font-size:13.5px;color:#5d5860}
`;

const HTML = `<section class="sd" id="sd" aria-live="polite"></section>`;

const JS = `
(()=>{
const D=window.SD,app=document.getElementById('sd'),L='ABCD';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rico=s=>esc(s).replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>').replace(/\\n/g,'<br>');
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)};
const ICO={reloj:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 foco:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
 libro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>'};
const N=D.r.length,TOTAL=D.r.reduce((a,r)=>a+r.seg,0);
let i=0,st=[],reloj=null,sel=null;
const top=()=>{try{app.scrollIntoView({block:'start'})}catch(e){}scrollTo(0,0)};
function intro(){
  detener();i=0;st=D.r.map(()=>({fase:'r1',s1:null,s2:null,t:0}));
  app.innerHTML='<p class="sd-et">Prueba gratis · '+esc(D.examen)+'</p><h2>3 preguntas reales del simulador</h2>'+
   '<p class="sd-lead">'+esc(D.secciones)+'. El reloj corre al ritmo del examen y solo en tu primer intento. Si fallas, el tutor te da una pista y otra oportunidad.</p>'+
   '<button class="sd-btn pm" type="button" id="sd-ir">Empezar la prueba</button>';
  document.getElementById('sd-ir').onclick=()=>{pregunta();top()};
}
function relojHTML(pausa){const r=D.r[i],resta=r.seg-st[i].t;return '<span class="sd-reloj'+(resta<=15?' poco':'')+(pausa?' pausa':'')+'" role="timer" aria-label="Tiempo restante '+mmss(resta)+(pausa?', en pausa':'')+'">'+ICO.reloj+'<span>'+mmss(resta)+'</span>'+(pausa?'<small>pausa</small>':'')+'</span>'}
function pintarReloj(p){const e=document.getElementById('sd-reloj');if(e)e.innerHTML=relojHTML(p)}
function correr(){detener();let antes=Date.now();reloj=setInterval(()=>{const a=Date.now();st[i].t+=(a-antes)/1000;antes=a;
  if(st[i].t>=D.r[i].seg){st[i].t=D.r[i].seg;st[i].fase='fin';st[i].sinTiempo=true;detener();pregunta();return}pintarReloj(false)},250)}
function detener(){if(reloj){clearInterval(reloj);reloj=null}}
function pregunta(){
  const r=D.r[i],s=st[i];sel=null;
  const ops=r.o.map((o,k)=>{let c='',dis=s.fase==='fin';
    if(s.s1===k&&k!==r.k){c=' tachada';dis=true}
    if(s.fase==='fin'){if(k===r.k)c=' ok';else if(s.s2===k)c=' mal'}
    return '<button type="button" class="sd-op'+c+'" role="radio" aria-checked="false" data-o="'+k+'"'+(dis?' disabled':'')+'><span class="l">'+L[k]+'</span><span class="x">'+rico(o)+'</span></button>'}).join('');
  app.innerHTML='<div class="sd-prog" role="progressbar" aria-label="Reactivo '+(i+1)+' de '+N+'" aria-valuemin="0" aria-valuemax="'+N+'" aria-valuenow="'+(i+1)+'"><i style="width:'+Math.round(100*i/N)+'%"></i></div>'+
   '<div class="sd-cab"><span>'+esc(r.s)+' · <b>'+(i+1)+'</b> de '+N+'</span><span id="sd-reloj"></span></div>'+
   '<span class="sd-tema">'+esc(r.t)+'</span><h3 class="sd-enun" style="margin-top:12px">'+rico(r.e)+'</h3>'+
   '<div class="sd-ops" role="radiogroup" aria-label="Opciones">'+ops+'</div><div id="sd-tutor">'+tutor()+'</div>'+
   (s.fase==='fin'?'':'<div class="sd-acc"><button class="sd-btn" type="button" id="sd-conf" disabled>'+(s.fase==='r2'?'Confirmar segundo intento':'Confirmar respuesta')+'</button></div>');
  pintarReloj(s.fase!=='r1');
  if(s.fase==='r1')correr();else detener();
}
function tutor(){
  const r=D.r[i],s=st[i];
  if(s.fase==='r1')return '';
  if(s.fase==='r2')return '<div class="sd-tutor pista" role="status"><div class="i">'+ICO.foco+'</div><div><b class="t">Todavía no. Pista del tutor</b><p>'+rico(r.p)+'</p><small>Tienes un intento más. El reloj está en pausa.</small></div></div>';
  const ok=s.s1===r.k||s.s2===r.k,t=s.s1===r.k?'¡Correcto a la primera!':s.s2===r.k?'Bien, lo lograste en el segundo intento':s.sinTiempo?'Se acabó el tiempo en este reactivo':'Esta era la respuesta correcta';
  return '<div class="sd-tutor '+(ok?'bien':'sol')+'" role="status"><div class="i">'+(ok?ICO.ok:ICO.libro)+'</div><div><b class="t">'+t+'</b><p>Respuesta: <b>'+L[r.k]+') '+rico(r.o[r.k])+'</b></p>'+
   '<details'+(s.s1===r.k?'':' open')+'><summary>Solución paso a paso</summary><ol>'+r.pa.map(x=>'<li>'+rico(x)+'</li>').join('')+'</ol><div class="sd-regla"><span>La regla</span>'+rico(r.rg)+'</div></details></div></div>'+
   '<div class="sd-acc"><button class="sd-btn" type="button" id="sd-sig">'+(i<N-1?'Siguiente':'Ver mi mini reporte')+'</button></div>';
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.o!==undefined){sel=+b.dataset.o;app.querySelectorAll('.sd-op').forEach(x=>{x.classList.toggle('sel',x===b);x.setAttribute('aria-checked',x===b)});const c=document.getElementById('sd-conf');if(c)c.disabled=false}
  else if(b.id==='sd-conf'&&sel!==null){const r=D.r[i],s=st[i];
    if(s.fase==='r1'){s.s1=sel;s.fase=sel===r.k?'fin':'r2';detener()}else if(s.fase==='r2'){s.s2=sel;s.fase='fin'}
    pregunta();const t=document.getElementById('sd-tutor');if(t&&t.firstChild)t.scrollIntoView({behavior:'smooth',block:'nearest'})}
  else if(b.id==='sd-sig'){i++;if(i<N){pregunta();top()}else{reporte();top()}}
  else if(b.id==='sd-otra'){intro();top()}
});
function reporte(){
  detener();
  const a1=st.filter((s,k)=>s.s1===D.r[k].k).length,a2=st.filter((s,k)=>s.s1!==D.r[k].k&&s.s2===D.r[k].k).length;
  const fallas=[];D.r.forEach((r,k)=>{if(st[k].s1!==r.k&&!fallas.some(f=>f.t===r.t))fallas.push(r)});
  app.innerHTML='<p class="sd-et">Así te fue</p><h2>'+(a1===N?'Las '+N+' a la primera':a1+' de '+N+' a la primera'+(a2?', '+a2+' con la pista':''))+'</h2>'+
   '<ul class="sd-res">'+D.r.map((r,k)=>{const s=st[k],c=s.s1===r.k?'si':s.s2===r.k?'dos':'no';return '<li><span class="m '+c+'" aria-label="'+(c==='si'?'A la primera':c==='dos'?'En el segundo intento':'Fallada')+'">'+(c==='si'?'✓':c==='dos'?'2':'✕')+'</span><span><b>'+esc(r.s)+'</b><small>'+esc(r.t)+'</small></span><time>'+mmss(s.t)+'</time></li>'}).join('')+'</ul>'+
   (fallas.length?'<h3 class="sd-h3">Qué reforzar</h3><div class="sd-ref">'+fallas.map(r=>'<div><b>'+esc(r.t)+'</b>'+esc(r.c)+'</div>').join('')+'</div>':'')+
   '<p class="sd-nota">'+esc(D.mas)+'</p>'+
   '<a class="sd-btn pm" href="'+D.ruta+'?plan=paquete#comprar" target="_top">Quiero el simulador completo</a><button class="sd-btn sd-sec" type="button" id="sd-otra">Volver a empezar</button>';
}
intro();
})();`;

// data: { examen, secciones (texto), r: [reactivos], ruta, mas (qué trae el simulador completo) }
function demo({ examen, nombre, titulo, texto, data }) {
  return {
    titulo, texto,
    prueba: ['El cronómetro al ritmo del examen real, que se pausa mientras lees la pista', 'Si fallas, el tutor te da una pista y otro intento; luego, la solución paso a paso', 'Al final, cómo te fue y qué tema reforzar'],
    cta: `Quiero el ${nombre}`,
    css: CSS, html: HTML,
    js: `window.SD=${JSON.stringify({ examen, ...data }).replace(/</g, '\\u003c')};${JS}`,
  };
}
// Lo que trae el simulador completo; el tamaño del banco sale de la marca de cada uno (los mismos datos que su portada)
const mas = k => { const b = (MARCAS[k]?.[3]?.[0] || '').replace(/\*\*/g, ''); return `En el simulador tienes ${b ? `${b} con` : ''} este mismo tutor, exámenes como el real, el medidor de preparación y tu reporte por tema.`.replace('tienes  este', 'tienes este'); };

// PAA: el ritmo de cada sección es el de su simulacro (banco.js › SECCIONES: minutos ÷ reactivos)
const NOM_PAA = Object.fromEntries(SECCIONES_PAA.map(s => [s.id, s.nombre]));
const SEG_PAA = Object.fromEntries(SECCIONES_PAA.map(s => [s.id, s.minutos * 60 / s.reactivos]));
const paa = demo({ examen: 'PAA', nombre: 'Simulador PAA',
  titulo: 'Contesta 3 preguntas tipo PAA con cronómetro y tutor.',
  texto: 'Preguntas reales del banco del simulador: Lectura, Matemáticas e Inglés. Si fallas, el tutor te da una pista; al final ves qué reforzar.',
  data: { secciones: 'Lectura, Matemáticas e Inglés', ruta: '/simulador-paa/', mas: mas('simulador-paa'),
    r: tomar({ R: REACTIVOS_PAA, T: TEMAS_PAA }, ['L4-voc-7', 'M2-ari-3', 'E2-str-5'], NOM_PAA, s => SEG_PAA[s]) } });

// UNAM: 1.5 min por reactivo (unam.js › MIN_POR_REACTIVO: 120 reactivos en 3 horas)
const unam = demo({ examen: 'UNAM', nombre: 'Simulador UNAM',
  titulo: 'Contesta 3 preguntas del examen UNAM con cronómetro.',
  texto: 'Preguntas reales del banco del simulador, al ritmo del examen: 1.5 minutos por reactivo. Si fallas, el tutor te da una pista.',
  data: { secciones: 'Matemáticas, Física y Español', ruta: '/simulador-unam/', mas: mas('simulador-unam'),
    r: tomar(juntar([U_MAT, U_FIS, U_ESP]), ['U-mat-3', 'U-fis-1', 'U-esp-42'],
      { matematicas: 'Matemáticas', fisica: 'Física', espanol: 'Español' }, () => 90) } });

// ECOEMS: minutos ÷ reactivos de cada materia en el examen (ecoems.js › MATERIA: 22 min para 16 en las habilidades, 17 para 12)
const SEG_ECOEMS = { habilidad_verbal: 22 * 60 / 16, habilidad_matematica: 22 * 60 / 16, biologia: 17 * 60 / 12 };
const ecoems = demo({ examen: 'ECOEMS', nombre: 'Simulador ECOEMS',
  titulo: 'Contesta 3 preguntas tipo ECOEMS con cronómetro.',
  texto: 'Preguntas reales del banco del simulador: habilidad verbal, habilidad matemática y Biología. Si fallas, el tutor te da una pista.',
  data: { secciones: 'Habilidad verbal, habilidad matemática y Biología', ruta: '/simulador-ecoems/', mas: mas('simulador-ecoems'),
    r: tomar(juntar([E_HV, E_HM, E_BIO]), ['E-hv-23', 'E-hm-7', 'E-bio-7'],
      { habilidad_verbal: 'Habilidad verbal', habilidad_matematica: 'Habilidad matemática', biologia: 'Biología' }, s => SEG_ECOEMS[s]) } });

// Prepa UG (EXANI-I, 3 opciones): minutos ÷ reactivos de cada área (prepa-ug.js › AREA)
const SEG_UG = { redaccion_indirecta: 51 * 60 / 30, pensamiento_matematico: 67 * 60 / 40, pensamiento_cientifico: 51 * 60 / 30 };
const prepaUg = demo({ examen: 'prepa UG (EXANI-I)', nombre: 'Simulador prepa UG',
  titulo: 'Contesta 3 preguntas tipo EXANI-I con cronómetro.',
  texto: 'Preguntas reales del banco del simulador para la prepa de la UG: Redacción indirecta, Pensamiento matemático y Pensamiento científico.',
  data: { secciones: 'Redacción indirecta, Pensamiento matemático y Pensamiento científico', ruta: '/simulador-prepa-ug/', mas: mas('simulador-prepa-ug'),
    r: tomar(juntar([G_RED, G_MAT, G_USO, G_CIE]), ['UG-red-47', 'UG-mat-38', 'UG-cie-14'],
      { redaccion_indirecta: 'Redacción indirecta', pensamiento_matematico: 'Pensamiento matemático', pensamiento_cientifico: 'Pensamiento científico' }, s => SEG_UG[s]) } });

// EXANI-II: 168 reactivos en 4.5 h (exani-ii.js › MIN_POR_REACTIVO), parejo en todas las secciones
const exani = demo({ examen: 'EXANI-II', nombre: 'Simulador EXANI-II',
  titulo: 'Contesta 3 preguntas tipo EXANI-II con cronómetro.',
  texto: 'Preguntas reales del banco del simulador: Redacción indirecta, Pensamiento matemático y un módulo de Biología. Si fallas, el tutor te da una pista.',
  data: { secciones: 'Redacción indirecta, Pensamiento matemático y Biología', ruta: '/simulador-exani-ii/', mas: mas('simulador-exani-ii'),
    r: tomar(juntar([X_RED, X_MAT, X_BIO]), ['EX2-red-26', 'EX2-mat-5', 'EX2-bio-3'],
      { redaccion_indirecta: 'Redacción indirecta', pensamiento_matematico: 'Pensamiento matemático', biologia: 'Biología' }, () => 270 * 60 / 168) } });

// EXCOBA: «en promedio, tienes un minuto para contestar cada pregunta» (excoba.js › MIN_POR_REACTIVO)
const excoba = demo({ examen: 'EXCOBA', nombre: 'Simulador EXCOBA',
  titulo: 'Contesta 3 preguntas tipo EXCOBA con cronómetro.',
  texto: 'Preguntas reales del banco del simulador: Matemáticas de primaria, Español y Ciencias naturales de secundaria. Si fallas, el tutor te da una pista.',
  data: { secciones: 'Matemáticas de primaria, Español y Ciencias naturales de secundaria', ruta: '/simulador-excoba/', mas: mas('simulador-excoba'),
    r: tomar(juntar([C_PM, C_SE, C_SN]), ['EXC-pm-4', 'EXC-se-15', 'EXC-sn-3'],
      { pri_matematicas: 'Matemáticas (primaria)', sec_espanol: 'Español (secundaria)', sec_ciencias_naturales: 'Ciencias naturales (secundaria)' }, () => 60) } });

// IPN: 140 reactivos en 3 horas (ipn.js); su banco usa los reactivos de la UNAM en las materias del IPN
const ipn = demo({ examen: 'IPN', nombre: 'Simulador IPN',
  titulo: 'Contesta 3 preguntas tipo IPN con cronómetro.',
  texto: 'Preguntas reales del banco del simulador: Matemáticas, Física y Química, al ritmo del examen. Si fallas, el tutor te da una pista.',
  data: { secciones: 'Matemáticas, Física y Química', ruta: '/simulador-ipn/', mas: mas('simulador-ipn'),
    r: tomar(juntar([U_MAT, U_FIS, U_QUI]), ['U-mat-3', 'U-fis-1', 'U-qui-4'],
      { matematicas: 'Matemáticas', fisica: 'Física', quimica: 'Química' }, () => 180 * 60 / 140) } });

export default { paa, unam, ecoems, 'prepa-ug': prepaUg, 'exani-ii': exani, excoba, ipn };
