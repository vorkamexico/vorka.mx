// Demo de la Evaluación de liderazgo: 5 de sus 80 preguntas reales, todas de la dimensión Iniciativa, en sus tres tipos
// (cómo te ves, qué harías en una situación y lo que has hecho), como en la app (liderazgo.vorka.mx). Al final, el reporte
// de EJEMPLO que ya muestra la página (mismos valores que liderazgo.js › EJEMPLO: no es de nadie) con la lectura de cada
// dimensión y una de las acciones a 30 días. Con 5 respuestas no se califica nada: así se dice en pantalla.
//
// Preguntas, escala, opciones y la acción: copiadas tal cual de Vorka OS (src/liderazgo/banco.js: ítems 5, 7, 50, 63 y
// 64, ESCALA y RECOMENDACIONES.iniciativa). Si cambian allá, se copian de nuevo aquí.
const ESCALA = ['Casi nunca', 'Pocas veces', 'A veces', 'Seguido', 'Casi siempre'];
const PREGUNTAS = [
  { n: 5, tipo: 'p', texto: 'Empiezo cosas sin que nadie me lo pida (un proyecto, un club, una mejora).' },
  { n: 7, tipo: 'p', texto: 'Si una idea me entusiasma, la dejo en pausa hasta que alguien más se sume.' },
  { n: 50, tipo: 'c', texto: 'En tu escuela se tira mucha comida de la cafetería. ¿Qué haces primero?', opciones: ['Publico en redes para crear conciencia.', 'Durante una semana observo cuánto se tira y por qué, y luego llevo una propuesta a la dirección.', 'Organizo con amigos una colecta para un albergue.', 'Le comento a un maestro para que la escuela haga algo.'] },
  { n: 63, tipo: 'e', texto: '¿Has empezado un proyecto, club, emprendimiento o iniciativa propia?', opciones: ['No', 'Está en idea o planeación', 'Sí, se hizo al menos una vez', 'Sí, y sigue activo o se hizo varias veces'] },
  { n: 64, tipo: 'e', texto: 'En el último año, ¿a cuántas convocatorias, concursos o programas te postulaste por tu cuenta?', opciones: ['Ninguna', '1', '2 o 3', '4 o más'] },
];
// Ejemplo ilustrativo de la página (liderazgo.js › EJEMPLO): [dimensión, nota, lo que cree, lo que ha hecho, lectura]
const EJEMPLO = [['Servicio', 7.4, 8.1, 7.2, 'Alineada'], ['Iniciativa', 5.2, 8.4, 3.3, 'Por demostrar'], ['Medición de impacto', 4.1, 6.9, 2.5, 'Por demostrar'], ['Resiliencia', 7.0, 5.6, 8.3, 'Subestimada']];
const ACCION = { nombre: 'Iniciativa', accion: 'Elige un problema que veas cada semana y lleva una propuesta de una página a quien pueda decidir.', evidencia: 'La propuesta y la respuesta.' };

const CSS = `
.lz{--mo:var(--pm);--oro:#C8A45C;--vd:#2B8553;padding:18px 16px 22px;background:#FBFAF8;min-height:560px}
.lz-et{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mo)}
.lz h2{margin:8px 0 8px;font-size:23px;line-height:1.22;letter-spacing:-.02em}
.lz-lead{margin:0 0 14px;color:#6D696E;font-size:15px;line-height:1.5}
.lz-prog{margin-bottom:12px}.lz-prog-t{display:flex;justify-content:space-between;font-size:12.5px;color:#6D696E;font-weight:600;margin-bottom:6px}
.lz-barra{height:6px;border-radius:6px;background:#ECEAE6;overflow:hidden}.lz-barra i{display:block;height:100%;background:var(--mo);transition:width .3s}
.lz-preg{background:#fff;border:1px solid #E7E5E7;border-radius:20px;padding:18px}
.lz-preg-n{font-size:12px;color:#8a858d;font-weight:600;margin-bottom:4px}
.lz-preg-t{font-weight:650;font-size:17px;line-height:1.4;margin-bottom:14px}
.lz-preg-t small{display:block;font-weight:600;color:var(--mo);font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.lz-escala{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.lz-escala button{min-height:56px;border:1px solid #D9D6D9;background:#fff;border-radius:12px;font-size:12px;line-height:1.2;padding:6px 2px;font-weight:550}
.lz-ops{display:grid;gap:8px}
.lz-ops button{min-height:50px;text-align:left;border:1px solid #D9D6D9;background:#fff;border-radius:14px;padding:11px 14px;font-size:15px;line-height:1.35}
.lz-escala button[aria-pressed=true],.lz-ops button[aria-pressed=true]{background:var(--mo);color:#fff;border-color:var(--mo)}
.lz-aviso{margin:0 0 14px;padding:12px 14px;border-radius:14px;background:#F4F2EF;font-size:13.5px;line-height:1.45;color:#3f3b42}
.lz-atras{border:0;background:none;color:#6D696E;font-size:14px;font-weight:600;min-height:44px;padding:0 4px;margin-top:8px}
.lz-ej{display:flex;gap:8px;padding:12px 14px;border-radius:14px;background:#FBF6EA;border:1px solid #EEDFB8;color:#5c4a1f;font-size:13.5px;line-height:1.45;margin:0 0 14px}
.lz-ley{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#6D696E;margin:0 0 10px}.lz-ley span{display:inline-flex;align-items:center;gap:6px}
.lz-ley i{width:11px;height:11px;border-radius:50%;display:inline-block}
.lz i.per{background:var(--mo)}.lz i.evi{background:var(--oro)}
.lz-dims{display:grid;gap:10px}
.lz-dim{background:#fff;border:1px solid #E7E5E7;border-radius:16px;padding:12px 14px}
.lz-dim-h{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;font-weight:650}.lz-dim-h b{font-size:18px;font-variant-numeric:tabular-nums}.lz-dim-h small{font-size:12px;color:#8a858d;font-weight:500}
.lz-pista{position:relative;height:10px;border-radius:99px;background:#ECEAE6;margin:10px 0 8px}
.lz-pista .r{position:absolute;inset:0 auto 0 0;border-radius:99px;background:#141114;opacity:.14}
.lz-pista .m{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.lz-pie{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12.5px;color:#6D696E}
.lz-pill{display:inline-block;font-size:12px;font-weight:650;padding:3px 10px;border-radius:99px;background:#F4F2EF;color:#6D696E}
.lz-pill.pd{background:color-mix(in srgb,var(--mo) 12%,#fff);color:var(--mo)}.lz-pill.sub{background:#E7F4EC;color:#1f6b42}
.lz-h3{margin:18px 0 8px;font-size:17px}
.lz-reco{background:#fff;border:1px solid #E7E5E7;border-radius:16px;padding:14px;font-size:15px;line-height:1.45}
.lz-reco small{display:block;margin-top:6px;color:#6D696E;font-size:13px}
.lz-nota{margin:12px 0 0;font-size:12.5px;color:#6D696E;line-height:1.45}
.lz-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;border:0;border-radius:999px;background:var(--mo);color:#fff;font-weight:700;font-size:16px;margin-top:16px}
.lz-btn.sec{background:#fff;color:#141114;border:1.5px solid #E2E0E4;margin-top:10px}
`;

const JS = `
(()=>{
const D=window.LZ,app=document.getElementById('lz');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const top=()=>{try{app.scrollIntoView({block:'start'})}catch(e){}scrollTo(0,0)};
let i=-1,r={},espera=0;
const PARTE={p:'Paso 2 de 3 · Cómo actúas',c:'Paso 2 de 3 · Cómo actúas',e:'Paso 3 de 3 · Lo que has hecho'};
function intro(){i=-1;r={};
  app.innerHTML='<span class="lz-et">Evaluación de liderazgo</span><h2>¿Dónde estás hoy como líder?</h2><p class="lz-lead">Prueba 5 de las 80 preguntas, las de <b>Iniciativa</b>: cómo te ves, qué harías en una situación real y lo que has hecho.</p>'+
   '<div class="lz-aviso"><b>Contesta por lo que haces de verdad, no por lo que te gustaría hacer.</b> No hay respuestas buenas ni malas: tu resultado compara lo que crees de ti con lo que has hecho.</div>'+
   '<button class="lz-btn" type="button" id="lz-ir">Empezar</button>';
}
function pregunta(){
  const q=D.preguntas[i],v=r[q.n];
  const cuerpo=q.tipo==='p'?'<div class="lz-escala" role="group" aria-label="'+esc(q.texto)+'">'+D.escala.map((t,k)=>'<button type="button" data-v="'+(k+1)+'" aria-pressed="'+(v===k+1)+'">'+esc(t)+'</button>').join('')+'</div>'
   :'<div class="lz-ops" role="group" aria-label="'+esc(q.texto)+'">'+q.opciones.map((t,k)=>'<button type="button" data-v="'+k+'" aria-pressed="'+(v===k)+'">'+esc(t)+'</button>').join('')+'</div>';
  app.innerHTML='<div class="lz-prog"><div class="lz-prog-t"><span>'+PARTE[q.tipo]+'</span><span>'+(i+1)+' de 5 · son 80</span></div><div class="lz-barra"><i style="width:'+Math.round(100*(i+1)/5)+'%"></i></div></div>'+
   (q.tipo==='e'&&D.preguntas[i-1].tipo!=='e'?'<h2>Lo que has hecho</h2><div class="lz-aviso">Piensa en los últimos 2 años. Contesta solo lo que podrías mostrar o contar con detalle.</div>':'')+
   '<div class="lz-preg"><div class="lz-preg-n">Pregunta '+q.n+' de 80</div><div class="lz-preg-t">'+(q.tipo==='c'?'<small>¿Qué harías?</small>':'')+esc(q.texto)+'</div>'+cuerpo+'</div>'+
   (i?'<button type="button" class="lz-atras" id="lz-atras">← Anterior</button>':'');
}
function reporte(){
  app.innerHTML='<span class="lz-et">Tu resultado</span><h2>Así se ve tu reporte</h2>'+
   '<p class="lz-ej" role="note"><span aria-hidden="true">★</span><span><b>Ejemplo ilustrativo</b>, no es de nadie. Con 5 respuestas no se califica: tu resultado real sale de las 80 y trae tus 12 dimensiones.</span></p>'+
   '<p class="lz-lead" style="margin-bottom:8px">Cada barra es la nota (0 a 10) y dos marcas: lo que <b>crees</b> de ti y lo que <b>has hecho</b>. Cuando están lejos, ahí está tu trabajo.</p>'+
   '<div class="lz-ley"><span><i class="per"></i>Lo que crees de ti</span><span><i class="evi"></i>Lo que has hecho</span></div>'+
   '<div class="lz-dims">'+D.ejemplo.map(([n,nota,per,evi,l])=>'<div class="lz-dim"><div class="lz-dim-h"><span>'+esc(n)+'</span><b>'+nota.toFixed(1)+'<small> / 10</small></b></div><div class="lz-pista" role="img" aria-label="'+esc(n)+': nota '+nota+', lo que crees '+per+', lo que has hecho '+evi+'"><i class="r" style="width:'+nota*10+'%"></i><i class="m per" style="left:'+per*10+'%"></i><i class="m evi" style="left:'+evi*10+'%"></i></div><div class="lz-pie"><span class="lz-pill '+(l==='Por demostrar'?'pd':l==='Subestimada'?'sub':'')+'">'+esc(l)+'</span><span>Crees '+per+' · Has hecho '+evi+'</span></div></div>').join('')+'</div>'+
   '<h3 class="lz-h3">Una de tus 3 acciones para 30 días</h3><div class="lz-reco"><b>'+esc(D.accion.nombre)+'.</b> '+esc(D.accion.accion)+'<small>Lo que te queda como evidencia: '+esc(D.accion.evidencia)+'</small></div>'+
   '<p class="lz-nota">No es una prueba psicométrica ni una probabilidad de entrar a una beca o programa: es una foto de dónde estás hoy.</p>'+
   '<button class="lz-btn sec" type="button" id="lz-otra">Volver a empezar</button>';
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='lz-ir'){i=0;pregunta();top()}
  else if(b.id==='lz-atras'){i--;pregunta()}
  else if(b.id==='lz-otra'){intro();top()}
  else if(b.dataset.v!==undefined){if(espera)return;espera=1;r[D.preguntas[i].n]=+b.dataset.v;pregunta();setTimeout(()=>{espera=0;i++;if(i<D.preguntas.length)pregunta();else reporte();top()},260)}
});
intro();
})();`;

export default {
  titulo: 'Contesta 5 preguntas reales y mira cómo se lee tu reporte.',
  texto: 'Las de Iniciativa, en sus tres tipos: cómo te ves, qué harías en una situación real y lo que has hecho. Al final, un reporte de ejemplo con lo que crees contra lo que has hecho.',
  prueba: ['La escala de «Cómo actúas», de «Casi nunca» a «Casi siempre»', 'Una situación real: ¿qué harías primero?', 'Las preguntas de hechos y un reporte de ejemplo con «Por demostrar» y «Subestimada»'],
  cta: 'Quiero mi evaluación',
  css: CSS,
  html: '<section class="lz" id="lz" aria-live="polite"></section>',
  js: `window.LZ=${JSON.stringify({ escala: ESCALA, preguntas: PREGUNTAS, ejemplo: EJEMPLO, accion: ACCION }).replace(/</g, '\\u003c')};${JS}`,
};
