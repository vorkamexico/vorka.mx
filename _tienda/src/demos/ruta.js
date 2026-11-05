// Demo de Ruta de Impacto: el inicio de la Lección 1 del Nivel 1 («El problema»), como en la app (ruta.vorka.mx):
// eliges el tema de tu proyecto, lees la explicación con el ejemplo de tu tema y contestas dos ejercicios con el tutor
// (primer error → pista; segundo → «Así se resuelve» con los pasos, la respuesta y la regla). Al final, la pantalla de
// avance de la lección. Sin cuenta, sin servidor y sin guardar nada.
//
// El contenido es el REAL del curso, copiado tal cual de Vorka OS (src/ruta/contenido/temas.js y nivel-1.js › n1-l1,
// pasos n1-l1-p01 a p03; también en ruta-junto). Si cambia allá, se copia de nuevo aquí. La revisión es la del motor de
// la app (public/ruta/motor.js): opción = el índice correcto; clasificar = cada frase en su caja.
const CURSO = {
  nivel: { titulo: 'El problema', meta: 'Distinguir el problema de sus síntomas y probarlo con datos', insignia: 'Detective de problemas' },
  leccion: { titulo: 'Problema, síntoma o solución disfrazada', minutos: 4, xp: 10, total: 9 },
  siguiente: 'El árbol de problemas', nLecciones: 5,
  temas: [
    { id: "educacion", nombre: "Educación", emoji: "📚" },
    { id: "ambiente", nombre: "Medio ambiente", emoji: "🌱" },
    { id: "salud", nombre: "Salud y bienestar", emoji: "🩺" },
    { id: "inclusion", nombre: "Inclusión y discapacidad", emoji: "♿" },
    { id: "genero", nombre: "Igualdad de género", emoji: "⚖️" },
    { id: "animales", nombre: "Animales", emoji: "🐾" },
    { id: "cultura", nombre: "Cultura y deporte", emoji: "🎭" },
    { id: "comunidad", nombre: "Comunidad y espacios públicos", emoji: "🏘️" },
  ],
  pasos: [
    {
      "id": "n1-l1-p01",
      "tipo": "explica",
      "titulo": "Antes de resolver, entiende",
      "texto": "Muchos proyectos fallan por lo mismo: empiezan con una idea que le gustó a alguien, no con un problema que alguien entendió.\n\nEn este nivel vas a separar tres cosas:\n- **Problema:** algo que le pasa a un grupo de personas (o de animales, o a un lugar) y que se puede comprobar.\n- **Síntoma:** lo que se ve por fuera. Es una pista, no el fondo.\n- **Solución disfrazada:** una idea escrita como si fuera el problema: «falta un taller», «no hay app», «necesitan un comedor».\n\nLos casos de este curso son ficticios.",
      "ejemplo": {
        "educacion": "Solución disfrazada: «Faltan asesorías de matemáticas». Problema: «Muchos alumnos de primero de la secundaria de la colonia reprueban matemáticas».",
        "ambiente": "Solución disfrazada: «Faltan botes de basura». Problema: «La basura tapa el canal de la colonia y la calle más baja se inunda cuando llueve».",
        "salud": "Solución disfrazada: «No hay pláticas sobre diabetes». Problema: «Varios adultos mayores de la comunidad dejan su tratamiento de diabetes».",
        "inclusion": "Solución disfrazada: «Faltan rampas». Problema: «Las personas en silla de ruedas del pueblo casi no pueden salir solas de su casa».",
        "genero": "Solución disfrazada: «Falta vigilancia». Problema: «Las alumnas de la prepa viven acoso en el camino de regreso a casa».",
        "animales": "Solución disfrazada: «Falta un albergue». Problema: «Hay muchos perros sin hogar alrededor del mercado de la colonia».",
        "cultura": "Solución disfrazada: «No hay escuela de música». Problema: «La banda de viento del pueblo casi no tiene músicos jóvenes».",
        "comunidad": "Solución disfrazada: «Falta un comité vecinal». Problema: «Casi nadie usa el parque de la colonia»."
      }
    },
    {
      "id": "n1-l1-p02",
      "tipo": "opcion",
      "enunciado": {
        "educacion": "Una brigada escribe su problema así: «Falta un programa de asesorías de matemáticas en la secundaria». ¿Qué es en realidad esta frase?",
        "ambiente": "Una brigada escribe su problema así: «Faltan contenedores de reciclaje en la colonia». ¿Qué es en realidad esta frase?",
        "salud": "Una brigada escribe su problema así: «No hay pláticas sobre diabetes en el centro comunitario». ¿Qué es en realidad esta frase?",
        "inclusion": "Una brigada escribe su problema así: «Faltan rampas en las banquetas del centro del pueblo». ¿Qué es en realidad esta frase?",
        "genero": "Una brigada escribe su problema así: «Falta un botón de pánico en la ruta a la prepa». ¿Qué es en realidad esta frase?",
        "animales": "Una brigada escribe su problema así: «Faltan campañas de esterilización en la colonia». ¿Qué es en realidad esta frase?",
        "cultura": "Una brigada escribe su problema así: «No hay talleres de música tradicional para jóvenes en el pueblo». ¿Qué es en realidad esta frase?",
        "comunidad": "Una brigada escribe su problema así: «Falta una cuadrilla que limpie el parque de la colonia». ¿Qué es en realidad esta frase?"
      },
      "opciones": [
        "Un problema bien escrito",
        "Un síntoma del problema",
        "Una solución disfrazada",
        "Una causa comprobada"
      ],
      "correcta": 2,
      "pista": "Fíjate si la frase cuenta lo que le pasa a alguien o lo que alguien propone poner.",
      "pasos": [
        "La frase empieza con «falta» o «no hay» y termina nombrando algo que se podría construir u organizar.",
        "Eso ya es una respuesta: da por hecho que la solución es justo esa cosa.",
        "Un problema dice qué le pasa a quién, dónde y cuánto. Esta frase no dice nada de eso."
      ],
      "regla": "Si tu problema se arregla con solo poner la cosa que mencionas, es una solución disfrazada."
    },
    {
      "id": "n1-l1-p03",
      "tipo": "clasificar",
      "enunciado": "Clasifica cada frase: ¿describe un problema o es una solución disfrazada?",
      "cajas": [
        "Problema",
        "Solución disfrazada"
      ],
      "elementos": [
        [
          "Falta una biblioteca en la comunidad",
          1
        ],
        [
          "12 de 30 niñas y niños de 3.º de la primaria no logran leer un párrafo corto sin trabarse",
          0
        ],
        [
          "Se necesita una app para reportar baches",
          1
        ],
        [
          "Las familias de 4 calles de la colonia esperan la pipa de agua hasta 5 días",
          0
        ],
        [
          "No hay talleres de oficios para jóvenes",
          1
        ],
        [
          "Desde mayo, perros sueltos han mordido a 3 niños de camino a la escuela",
          0
        ]
      ],
      "pista": "Pregúntate en cada frase: ¿dice qué le pasa a alguien o qué cosa hay que poner?",
      "pasos": [
        "Las frases con «falta», «no hay» o «se necesita» nombran algo que alguien quiere poner: son soluciones disfrazadas.",
        "Las otras dicen a quién le pasa algo, qué le pasa y traen una cifra: son problemas que se pueden comprobar."
      ],
      "regla": "Problema = lo que le pasa a alguien. Solución disfrazada = lo que tú quieres poner."
    }
  ],
};

const CSS = `
.ru{--a2:color-mix(in srgb,var(--pm) 10%,#fff);--ok:#2b6a4e;--ok-s:#e9f2ec;--er:#9e4129;--er-s:#f8ece6;--oro:#c8a45c;--oro-s:#f7efdc;--l2:#d6d3d6;--t2:#5f5b60;
  display:flex;flex-direction:column;min-height:620px;background:#fbfaf8;color:#141114;font-family:"Inter Tight",Inter,system-ui,sans-serif}
.ru-top{display:flex;align-items:center;gap:12px;padding:14px 16px 6px}
.ru-av{flex:1;height:14px;border-radius:7px;background:#eceae6;overflow:hidden}.ru-av i{display:block;height:100%;background:var(--pm);border-radius:7px;transition:width .32s cubic-bezier(.2,.8,.2,1)}
.ru-niv{font-size:12.5px;font-weight:700;color:var(--t2);white-space:nowrap}
.ru-c{flex:1;padding:12px 18px 18px}
.ru-c h2{margin:6px 0 12px;font-size:22px;line-height:1.25;letter-spacing:-.015em}
.ru-c p,.ru-c li{font-size:16px;line-height:1.5}.ru-c ul{padding-left:20px;margin:8px 0}.ru-c p{margin:0 0 10px}
.ru-tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--pm)}
.ru-ej{border-left:4px solid var(--oro);background:var(--oro-s);padding:12px 14px;border-radius:0 10px 10px 0;margin-top:12px;font-size:15.5px;line-height:1.5}
.ru-temas{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ru-tema{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:74px;padding:12px;border-radius:16px;border:2px solid var(--l2);border-bottom-width:4px;background:#fff;text-align:left;font-weight:650;font-size:14.5px;line-height:1.25}
.ru-tema span{font-size:22px}
.ru-tema[aria-pressed=true]{border-color:var(--pm);background:var(--a2);color:var(--pm)}
.ru-ops{display:grid;gap:10px}
.ru-op{display:flex;align-items:center;gap:12px;width:100%;text-align:left;min-height:58px;padding:12px 16px;border-radius:18px;border:2px solid var(--l2);border-bottom-width:4px;background:#fff;font-weight:550;font-size:16px;line-height:1.35}
.ru-op .k{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;border:1.5px solid currentColor;font-size:13px;font-weight:700;flex:none;opacity:.7}
.ru-op[aria-checked=true]{border-color:var(--pm);background:var(--a2);color:var(--pm)}
.ru-op:disabled{cursor:default}.ru-op.bien{border-color:var(--ok);background:var(--ok-s);color:var(--ok)}.ru-op.mal{border-color:var(--er);background:var(--er-s);color:var(--er)}
.ru-clas{display:grid;gap:10px}
.ru-el{background:#fff;border:1.5px solid var(--l2);border-radius:14px;padding:12px 14px;display:grid;gap:8px}
.ru-el b{font-weight:600;font-size:15px;line-height:1.4}
.ru-cajas{display:flex;gap:8px}
.ru-chip{flex:1;min-height:44px;padding:8px 10px;border-radius:999px;border:1.5px solid var(--l2);background:#fff;font-weight:600;font-size:14px}
.ru-chip[aria-pressed=true]{border-color:var(--pm);background:var(--a2);color:var(--pm)}
.ru-chip:disabled{cursor:default}
.ru-pie{position:sticky;bottom:0;padding:14px 16px;border-top:1px solid #e7e5e7;background:#fbfaf8}
.ru-btn{width:100%;min-height:54px;border:0;border-radius:14px;font-weight:750;font-size:17px;color:#fff;background:#141114;box-shadow:0 4px 0 #3a2d4a}
.ru-btn:active{transform:translateY(3px);box-shadow:none}
.ru-btn:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
.ru-btn.ok{background:var(--ok);box-shadow:0 4px 0 #1c4834}.ru-btn.er{background:var(--er);box-shadow:0 4px 0 #6b2c1c}.ru-btn.pm{background:var(--pm);box-shadow:0 4px 0 color-mix(in srgb,var(--pm) 65%,#000)}
.ru-pie.bien{background:var(--ok-s);color:var(--ok);border-top:0}.ru-pie.mal{background:var(--er-s);color:var(--er);border-top:0}
.ru-tutor{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px}
.ru-tutor svg{width:16px;height:16px}
.ru-pie h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:20px}.ru-pie h3 svg{width:24px;height:24px}
.ru-det{color:#141114;font-size:15px;line-height:1.5;margin-bottom:12px}.ru-det ol{margin:6px 0;padding-left:22px}.ru-det p{margin:6px 0 0}.ru-det .regla{font-weight:650}
.ru-fin{text-align:center;padding-top:26px}
.ru-fin .medalla{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--oro-s);color:#8a5800;border:3px solid var(--oro)}
.ru-fin .medalla svg{width:42px;height:42px}
.ru-fin h2{font-size:28px;margin-bottom:6px}
.ru-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
.ru-stat{border-radius:14px;border:2px solid var(--l2);padding:10px;display:grid;gap:2px}.ru-stat.oro{border-color:var(--oro)}.ru-stat.mo{border-color:var(--pm)}
.ru-stat b{font-size:24px;font-variant-numeric:tabular-nums}.ru-stat span{font-size:12px;color:var(--t2);font-weight:650;text-transform:uppercase;letter-spacing:.04em}
.ru-sig{text-align:left;padding:14px;border-radius:16px;background:#fff;border:1.5px solid var(--l2);font-size:15px;color:var(--t2);margin-bottom:10px}
.ru-sig b{display:block;color:#141114;font-size:16px;margin-bottom:2px}
`;

const JS = `
(()=>{
const C=window.RU,app=document.getElementById('ru'),L='ABCDEFGH';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=t=>String(t??'').split(/\\n{2,}/).map(b=>{const l=b.split('\\n'),f=x=>esc(x).replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>');
  if(l.every(x=>/^\\s*[-•]\\s+/.test(x)))return '<ul>'+l.map(x=>'<li>'+f(x.replace(/^\\s*[-•]\\s+/,''))+'</li>').join('')+'</ul>';return '<p>'+l.map(f).join('<br>')+'</p>'}).join('');
const ico=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const I={check:ico('<path d="M5 12.5l4.2 4.2L19 7"/>'),alerta:ico('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>'),brujula:ico('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),medalla:ico('<circle cx="12" cy="15" r="5"/><path d="M8.5 3.5L12 10l3.5-6.5"/>')};
const FRASES=['¡Exacto!','Así se hace','¡Bien!'];
const porTema=(x,t)=>x&&typeof x==='object'&&!Array.isArray(x)?(x[t]||x[Object.keys(x)[0]]):x;
let tema=null,paso=0,intentos=0,leer=null,res=[],t0=0;
const PRE=C.pasos.filter(p=>p.tipo!=='explica').length;
function marco(pct,cuerpo,pie){app.innerHTML='<div class="ru-top"><div class="ru-av" role="progressbar" aria-label="Avance de la lección" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div><span class="ru-niv">Nivel 1 · '+esc(C.nivel.titulo)+'</span></div><main class="ru-c">'+cuerpo+'</main><footer class="ru-pie" id="ru-pie">'+pie+'</footer>'}
const top=()=>{try{app.scrollIntoView({block:'start'})}catch(e){}scrollTo(0,0)};
function inicio(){
  tema=null;paso=0;res=[];
  marco(0,'<span class="ru-tag">Antes de empezar</span><h2>¿De qué es tu proyecto?</h2><p style="color:var(--t2)">Los ejercicios te hablan de tu tema.</p><div class="ru-temas">'+
    C.temas.map(t=>'<button type="button" class="ru-tema" aria-pressed="false" data-t="'+t.id+'"><span aria-hidden="true">'+t.emoji+'</span>'+esc(t.nombre)+'</button>').join('')+'</div>',
    '<button class="ru-btn" type="button" id="ru-ir" disabled>Empezar la lección</button>');
}
function pintar(){
  if(paso>=C.pasos.length)return fin();
  const p=C.pasos[paso],pct=Math.round(100*paso/C.leccion.total);intentos=0;leer=null;
  if(p.tipo==='explica'){marco(pct,'<span class="ru-tag">Lección 1 · '+esc(C.leccion.titulo)+'</span><h2>'+esc(p.titulo)+'</h2>'+md(p.texto)+(p.ejemplo?'<div class="ru-ej"><b>Ejemplo:</b> '+esc(porTema(p.ejemplo,tema))+'</div>':''),'<button class="ru-btn" type="button" id="ru-seg">Continuar</button>');return}
  marco(pct,'<h2>'+esc(porTema(p.enunciado,tema))+'</h2><div id="ru-ej"></div>','<button class="ru-btn" type="button" id="ru-rev" disabled>Revisar</button>');
  ejercicio(p);
}
function ejercicio(p){
  const el=document.getElementById('ru-ej'),rev=()=>{const b=document.getElementById('ru-rev');if(b)b.disabled=leer()===null};
  if(p.tipo==='opcion'){let sel=null;
    el.innerHTML='<div class="ru-ops" role="radiogroup" aria-label="Opciones">'+p.opciones.map((o,i)=>'<button type="button" class="ru-op" role="radio" aria-checked="false" data-i="'+i+'"><span class="k">'+L[i]+'</span><span>'+esc(o)+'</span></button>').join('')+'</div>';
    el.querySelectorAll('.ru-op').forEach(b=>b.onclick=()=>{sel=+b.dataset.i;el.querySelectorAll('.ru-op').forEach(x=>x.setAttribute('aria-checked',x===b));rev()});
    leer=()=>sel;
    ejercicio.marcar=(ok,mostrar)=>el.querySelectorAll('.ru-op').forEach(b=>{b.disabled=true;const i=+b.dataset.i;if(i===sel)b.classList.add(ok?'bien':'mal');if(mostrar&&i===p.correcta)b.classList.add('bien')});
    ejercicio.ok=()=>sel===p.correcta;
  }else if(p.tipo==='clasificar'){const e={};
    el.innerHTML='<div class="ru-clas">'+p.elementos.map(([x],i)=>'<div class="ru-el"><b>'+esc(x)+'</b><div class="ru-cajas" role="radiogroup" aria-label="'+esc(x)+'">'+p.cajas.map((c,k)=>'<button type="button" class="ru-chip" role="radio" aria-checked="false" aria-pressed="false" data-e="'+i+'" data-k="'+k+'">'+esc(c)+'</button>').join('')+'</div></div>').join('')+'</div>';
    el.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const i=+b.dataset.e;e[i]=+b.dataset.k;el.querySelectorAll('[data-e="'+i+'"]').forEach(x=>{x.setAttribute('aria-pressed',x===b);x.setAttribute('aria-checked',x===b)});rev()});
    leer=()=>Object.keys(e).length===p.elementos.length?e:null;
    ejercicio.marcar=()=>el.querySelectorAll('button').forEach(b=>b.disabled=true);
    ejercicio.ok=()=>p.elementos.every(([,c],i)=>e[i]===c);
  }
}
const respuesta=p=>p.tipo==='opcion'?p.opciones[p.correcta]:p.elementos.map(([x,c])=>x+': '+p.cajas[c]).join(' · ');
function retro(bien,titulo,det,boton,tutor){const f=document.getElementById('ru-pie');f.className='ru-pie '+(bien?'bien':'mal');
  f.innerHTML='<div role="status" aria-live="assertive">'+(tutor?'<div class="ru-tutor">'+I.brujula+'Tu tutor</div>':'')+'<h3>'+(bien?I.check:I.alerta)+esc(titulo)+'</h3>'+(det?'<div class="ru-det">'+det+'</div>':'')+'</div>'+boton}
function revisar(){
  const p=C.pasos[paso];intentos++;const ok=ejercicio.ok();ejercicio.marcar(ok,ok||intentos>=2);
  if(ok){res.push(intentos);retro(true,intentos===1?FRASES[paso%FRASES.length]:'Ahora sí','','<button class="ru-btn ok" type="button" id="ru-seg">Continuar</button>');return}
  if(intentos===1){retro(false,'Casi. Inténtalo otra vez','<b>Pista:</b> '+esc(p.pista),'<button class="ru-btn er" type="button" id="ru-otra">Entendido</button>',true);return}
  res.push(3);
  retro(false,'Así se resuelve','<ol>'+p.pasos.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p><b>Respuesta:</b> '+esc(respuesta(p))+'</p><p class="regla">Regla: '+esc(p.regla)+'</p>','<button class="ru-btn er" type="button" id="ru-seg">Entendido</button>',true);
}
function fin(){
  const prec=Math.round(100*res.filter(x=>x===1).length/Math.max(1,res.length)),seg=Math.round((Date.now()-t0)/1000);
  marco(Math.round(100*paso/C.leccion.total),'<div class="ru-fin"><div class="medalla">'+I.medalla+'</div><h2>¡Vas muy bien!</h2><p style="color:var(--t2)">Hiciste los primeros '+paso+' de '+C.leccion.total+' pasos de la lección «'+esc(C.leccion.titulo)+'».</p>'+
   '<div class="ru-stats"><div class="ru-stat mo"><span>Precisión</span><b>'+prec+'%</b></div><div class="ru-stat oro"><span>Tiempo</span><b>'+Math.floor(seg/60)+':'+('0'+seg%60).slice(-2)+'</b></div></div>'+
   '<div class="ru-sig"><b>En la app sigue…</b>'+(C.leccion.total-paso)+' pasos más de esta lección (el último, escribir el problema de tu proyecto) y luego «'+esc(C.siguiente)+'». Con las '+C.nLecciones+' lecciones del Nivel 1 y su examen ganas la insignia «'+esc(C.nivel.insignia)+'».</div></div>',
   '<button class="ru-btn" type="button" id="ru-rep">Repetir con otro tema</button>');
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.t){tema=b.dataset.t;app.querySelectorAll('.ru-tema').forEach(x=>x.setAttribute('aria-pressed',x===b));document.getElementById('ru-ir').disabled=false}
  else if(b.id==='ru-ir'){t0=Date.now();paso=0;pintar();top()}
  else if(b.id==='ru-seg'){paso++;pintar();top()}
  else if(b.id==='ru-rev')revisar();
  else if(b.id==='ru-otra'){const p=C.pasos[paso];document.getElementById('ru-pie').className='ru-pie';document.getElementById('ru-pie').innerHTML='<button class="ru-btn" type="button" id="ru-rev" disabled>Revisar</button>';ejercicio(p)}
  else if(b.id==='ru-rep'){inicio();top()}
});
inicio();
})();`;

export default {
  titulo: 'Haz el inicio de la primera lección, con tu tutor.',
  texto: 'Elige el tema de tu proyecto y haz los primeros ejercicios reales del Nivel 1: si te equivocas, el tutor te da una pista; si vuelves a fallar, te explica paso a paso.',
  prueba: ['Elegir el tema de tu proyecto: los ejercicios te hablan de él', 'Equivocarte a propósito para ver la pista y luego «Así se resuelve»', 'Clasificar frases: ¿problema o solución disfrazada?'],
  cta: 'Quiero Ruta de Impacto',
  css: CSS,
  html: '<section class="ru" id="ru" aria-live="polite"></section>',
  js: `window.RU=${JSON.stringify(CURSO).replace(/</g, '\\u003c')};${JS}`,
};
