// Vorka Learn · tu avance: guías terminadas, racha de días, nivel, puntos y logros. Todo vive en el navegador de quien lee
// (localStorage «vk-learn»): sin cuenta, sin servidor y sin datos personales. Sin JavaScript, o con el almacenamiento
// bloqueado, las páginas se ven completas y los recuadros de avance muestran su texto de bienvenida.
//
// Cómo se gana: una guía cuenta como terminada al llegar al 85 % del artículo (10 puntos). La racha son los días seguidos
// en que terminaste al menos una guía. Cada logro suma 25 puntos. Los niveles dependen de las guías terminadas.
// Las piezas de HTML llevan data-av…; el script las llena en cualquier página de Learn:
//   data-av="nivel|racha|leidas|puntos|falta|siguiente"  texto · data-av-barra  barra al siguiente nivel (--p)
//   data-av-sec="/learn/paa/" data-total="9"  avance de una sección · data-logro="primera"  insignia (clase lr-ok)
//   data-av-sigue  bloque «Sigue donde te quedaste» (se muestra solo si ya leíste algo) · a.gu-card  palomita si ya la leíste
import { esc } from '../paginas.js';

export const NIVELES = [[0, 'Curioso'], [3, 'Aprendiz'], [8, 'Constante'], [15, 'Experto'], [30, 'Maestro']];
const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const ICONOS_AV = {
  fuego: I('<path d="M12 21c-3.9 0-7-2.7-7-6.6 0-3.1 2-5.3 3.6-7 .4 1.9 1.5 3.2 2.6 3.6C11 7.4 12.6 4.6 15 3c-.3 2.8.9 4.6 2.2 6.2 1.1 1.3 1.8 2.9 1.8 5.2 0 3.9-3.1 6.6-7 6.6z"/>'),
  libro: I('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"/>'),
  estrella: I('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  brujula: I('<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  medalla: I('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3.5h4l2 4 2-4h4L15.5 10"/>'),
  meta: I('<path d="M5 21V4M5 4h11l-2 3.5 2 3.5H5"/>'),
  palomita: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  candado: I('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
};
// [clave, nombre, cómo se gana, ícono]
export const LOGROS = [
  ['primera', 'Primera guía', 'Termina tu primera guía.', 'libro'],
  ['racha3', 'Tres días seguidos', 'Lee algo tres días seguidos.', 'fuego'],
  ['explora', 'Explorador', 'Termina guías de tres secciones.', 'brujula'],
  ['diez', 'Diez guías', 'Termina diez guías.', 'estrella'],
  ['seccion', 'Sección completa', 'Termina todas las guías de una sección.', 'meta'],
  ['racha7', 'Una semana', 'Lee algo siete días seguidos.', 'medalla'],
];

// Tarjeta «Tu avance» (portada e índices). compacta: solo nivel, racha y guías.
export const panelAvance = ({ compacta = false } = {}) => `<div class="lr-av${compacta ? ' lr-av-c' : ''}" data-av-panel>
  <div class="lr-av-cab"><span class="lr-av-ico">${ICONOS_AV.estrella}</span><span><small>Tu nivel</small><b data-av="nivel">Curioso</b></span><span class="lr-av-pts"><b data-av="puntos">0</b> puntos</span></div>
  <div class="lr-av-barra" data-av-barra style="--p:0"><i></i></div>
  <p class="lr-av-falta" data-av="falta">Termina 3 guías para subir a Aprendiz.</p>
  <div class="lr-av-datos"><span>${ICONOS_AV.fuego}<span><b data-av="racha">0 días</b>de racha</span></span><span>${ICONOS_AV.libro}<span><b data-av="leidas">0 guías</b>terminadas</span></span></div>
</div>`;

// Avance de una sección (índice de la sección y mosaico de la portada)
export const avanceSeccion = (ruta, total) => `<span class="lr-av-sec" data-av-sec="${esc(ruta)}" data-total="${total}"><span class="lr-av-sec-b"><i></i></span><span class="lr-av-sec-t">${total} ${total === 1 ? 'guía' : 'guías'}</span></span>`;

// Insignias (portada)
export const insignias = () => `<ul class="lr-logros">${LOGROS.map(([k, n, d, i]) => `<li class="lr-logro" data-logro="${k}"><span class="lr-logro-ico">${ICONOS_AV[i]}<i>${ICONOS_AV.candado}</i></span><span><b>${n}</b><small>${d}</small></span></li>`).join('')}</ul>`;

// El script (va con el nonce de la CSP). totales: { '/learn/paa/': 9, … } para «Sección completa» y el avance por sección.
export const scriptAvance = totales => `(function(){var K='vk-learn',d=document,N=${JSON.stringify(NIVELES)},T=${JSON.stringify(totales)};
function leer(){try{var x=JSON.parse(localStorage.getItem(K)||'{}');return{l:x.l||{},d:x.d||[]};}catch(e){return{l:{},d:[]};}}
function guardar(s){try{localStorage.setItem(K,JSON.stringify(s));return true;}catch(e){return false;}}
function hoy(o){var f=new Date(Date.now()-(o||0)*864e5);return f.getFullYear()+'-'+('0'+(f.getMonth()+1)).slice(-2)+'-'+('0'+f.getDate()).slice(-2);}
function secDe(r){var m=/^\\/learn\\/[^\\/]+\\//.exec(r);return m?m[0]:'';}
function calc(s){var rs=Object.keys(s.l),n=rs.length,dias={},r=0,i;s.d.forEach(function(x){dias[x]=1;});
i=dias[hoy()]?0:1;while(dias[hoy(i)]){r++;i++;}
var por={};rs.forEach(function(x){var k=secDe(x);if(k)por[k]=(por[k]||0)+1;});
var max=0,dmax=0;Object.keys(dias).sort().forEach(function(x,j,a){var p=j&&(new Date(x)-new Date(a[j-1]))<=864e5*1.5;dmax=p?dmax+1:1;if(dmax>max)max=dmax;});
var completa=Object.keys(por).some(function(k){return T[k]&&por[k]>=T[k];});
var ok={primera:n>=1,racha3:max>=3,explora:Object.keys(por).length>=3,diez:n>=10,seccion:completa,racha7:max>=7};
var nl=0;N.forEach(function(v,j){if(n>=v[0])nl=j;});var sig=N[nl+1];
var logros=Object.keys(ok).filter(function(k){return ok[k];}).length;
return{n:n,racha:r,por:por,ok:ok,nivel:N[nl][1],sig:sig,base:N[nl][0],puntos:n*10+logros*25};}
function pl(n,a,b){return n+' '+(n===1?a:b);}
function pintar(){var s=leer(),c=calc(s);
function t(k,v){[].forEach.call(d.querySelectorAll('[data-av="'+k+'"]'),function(e){e.textContent=v;});}
t('nivel',c.nivel);t('puntos',c.puntos);t('racha',pl(c.racha,'día','días'));t('leidas',pl(c.n,'guía','guías'));
t('falta',c.sig?(c.n?'Te faltan '+pl(c.sig[0]-c.n,'guía','guías')+' para subir a '+c.sig[1]+'.':'Termina '+pl(c.sig[0],'guía','guías')+' para subir a '+c.sig[1]+'.'):'Llegaste al nivel más alto. Sigue con tu racha.');
var p=c.sig?Math.round((c.n-c.base)/(c.sig[0]-c.base)*100):100;
[].forEach.call(d.querySelectorAll('[data-av-barra]'),function(e){e.style.setProperty('--p',p);});
[].forEach.call(d.querySelectorAll('[data-av-sec]'),function(e){var k=e.getAttribute('data-av-sec'),tt=+e.getAttribute('data-total')||1,v=Math.min(c.por[k]||0,tt);
if(v){e.classList.add('lr-con');e.style.setProperty('--p',Math.round(v/tt*100));var x=e.querySelector('.lr-av-sec-t');if(x)x.textContent=v+' de '+tt+' leídas';}});
[].forEach.call(d.querySelectorAll('a.gu-card'),function(a){if(s.l[a.getAttribute('href')]){a.classList.add('lr-leida');if(!a.querySelector('.lr-palomita'))a.insertAdjacentHTML('beforeend','<span class="lr-palomita" title="Ya la leíste">${ICONOS_AV.palomita.replace(/"/g, '\\"')}<span class="vh">Ya la leíste</span></span>');}});
[].forEach.call(d.querySelectorAll('[data-logro]'),function(e){if(c.ok[e.getAttribute('data-logro')])e.classList.add('lr-ok');});
var sg=d.querySelector('[data-av-sigue]');if(sg&&c.n){var ult=Object.keys(s.l).sort(function(a,b){return s.l[b]-s.l[a];})[0],k=secDe(ult),
pend=[].filter.call(d.querySelectorAll('[data-explora] a.gu-card'),function(a){var h=a.getAttribute('href');return !s.l[h]&&secDe(h)===k;})[0]||[].filter.call(d.querySelectorAll('[data-explora] a.gu-card'),function(a){return !s.l[a.getAttribute('href')];})[0];
var dst=sg.querySelector('[data-av-sigue-tarjeta]');if(pend&&dst){dst.innerHTML='';var cl=pend.cloneNode(true);cl.hidden=false;dst.appendChild(cl);sg.hidden=false;}}
d.documentElement.classList.toggle('lr-con-avance',c.n>0);return c;}
function aviso(txt,sub){var e=d.createElement('div');e.className='lr-toast';e.setAttribute('role','status');e.innerHTML='<span class="lr-toast-ico">${ICONOS_AV.estrella.replace(/"/g, '\\"')}</span><span><b></b><small></small></span>';
e.querySelector('b').textContent=txt;e.querySelector('small').textContent=sub;d.body.appendChild(e);setTimeout(function(){e.classList.add('lr-toast-si');},30);
setTimeout(function(){e.classList.remove('lr-toast-si');setTimeout(function(){e.remove();},400);},5200);}
var antes=pintar(),art=d.querySelector('.lr-art'),ruta=location.pathname,hecho=false;
if(art&&d.querySelector('.lr-progreso')){var q=false;function ver(){q=false;if(hecho)return;var r=art.getBoundingClientRect();if(r.bottom-innerHeight<r.height*.15){hecho=true;var s=leer();if(s.l[ruta])return;
s.l[ruta]=Date.now();if(s.d.indexOf(hoy())<0)s.d.push(hoy());s.d=s.d.slice(-60);if(!guardar(s))return;var c=pintar(),nuevo=Object.keys(c.ok).filter(function(k){return c.ok[k]&&!antes.ok[k];}).length;
aviso('Guía terminada · +10 puntos',c.nivel!==antes.nivel?'Subiste a '+c.nivel+'.':nuevo?'Ganaste un logro nuevo.':c.racha>1?'Llevas '+pl(c.racha,'día','días')+' seguidos.':'Tu racha empieza hoy.');}}
addEventListener('scroll',function(){if(!q){q=true;setTimeout(ver,150);}},{passive:true});}
var ex=d.querySelector('[data-explora]');if(ex){var bs=[].slice.call(ex.querySelectorAll('[data-filtro]')),cs=[].slice.call(ex.querySelectorAll('a.gu-card')),mas=ex.querySelector('[data-mas]'),f='',lim=9;
function aplicar(){var v=0;cs.forEach(function(a){var si=!f||secDe(a.getAttribute('href'))===f;if(si)v++;a.hidden=!si||v>lim;});if(mas)mas.hidden=v<=lim;
bs.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-filtro')===f?'true':'false');});}
bs.forEach(function(b){b.addEventListener('click',function(){f=b.getAttribute('data-filtro');lim=9;aplicar();});});
if(mas)mas.addEventListener('click',function(){lim+=12;aplicar();});aplicar();}
})();`;

export const CSS_AVANCE = `
/* ---------- tu avance (gamificación, src/learn/avance.js) ---------- */
.lr-av{position:relative;display:grid;gap:12px;padding:18px;border-radius:22px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sombra-2);text-align:left}
.lr-av-cab{display:flex;align-items:center;gap:12px}
.lr-av-ico{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#6B2A85,#C8A45C);color:#fff}.lr-av-ico svg{width:22px;height:22px}
.lr-av-cab > span > small{display:block;font-size:12.5px;color:var(--fg-2);font-weight:550}.lr-av-cab > span > b{display:block;font-size:18px;letter-spacing:-.02em;line-height:1.2}
.lr-av-pts{margin-left:auto;display:inline-flex;align-items:baseline;gap:4px;font-size:13px;color:var(--fg-2);white-space:nowrap}.lr-av-pts b{color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums}
.lr-av-barra{height:8px;border-radius:99px;background:var(--bg-2);overflow:hidden}
.lr-av-barra i{display:block;height:100%;width:calc(var(--p) * 1%);min-width:8px;border-radius:inherit;background:linear-gradient(90deg,#6B2A85,#C8A45C);transition:width .8s var(--ease)}
.lr-av-falta{margin:0;font-size:13.5px;line-height:1.45;color:var(--fg-2)}
.lr-av-datos{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lr-av-datos > span{display:flex;align-items:center;gap:9px;padding:10px;border-radius:14px;background:var(--bg-2);font-size:12.5px;color:var(--fg-2);line-height:1.25}
.lr-av-datos b{display:block;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums}
.lr-av-datos svg{flex:none;width:20px;height:20px;color:#C8742C}.lr-av-datos > span + span svg{color:var(--morado)}
.lr-av-c{box-shadow:none;background:var(--card)}
.lr-av-sec{display:grid;gap:6px;margin-top:auto;padding-top:12px;font-size:12.5px;color:var(--fg-2);font-weight:600}
.lr-av-sec-b{height:5px;border-radius:99px;background:var(--bg-2);overflow:hidden}
.lr-av-sec-b i{display:block;height:100%;width:calc(var(--p,0) * 1%);border-radius:inherit;background:linear-gradient(90deg,var(--sec-a),var(--sec-b))}
.lr-av-sec:not(.lr-con) .lr-av-sec-b{display:none}.lr-av-sec.lr-con .lr-av-sec-t{color:var(--sec-t)}
.gu-card{position:relative}
.lr-palomita{position:absolute;top:10px;left:10px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#1F7A4A;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.lr-palomita svg{width:17px;height:17px}
.lr-logros{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:12px}
.lr-logro{display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.lr-logro b{display:block;font-size:15.5px;letter-spacing:-.01em}.lr-logro small{display:block;font-size:13px;line-height:1.4;color:var(--fg-2)}
.lr-logro-ico{position:relative;flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:var(--bg-2);color:var(--fg-3)}
.lr-logro-ico > svg{width:22px;height:22px}
.lr-logro-ico i{position:absolute;right:-3px;bottom:-3px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--card);border:1px solid var(--line);color:var(--fg-3)}.lr-logro-ico i svg{width:11px;height:11px}
.lr-logro.lr-ok{border-color:rgba(200,164,92,.55)}
.lr-logro.lr-ok .lr-logro-ico{background:linear-gradient(135deg,#8a6a2c,#C8A45C);color:#fff}.lr-logro.lr-ok .lr-logro-ico i{display:none}
.lr-toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));z-index:130;display:flex;align-items:center;gap:12px;width:max-content;max-width:calc(100vw - 32px);padding:12px 18px 12px 12px;border-radius:18px;background:var(--noche);color:#F4F2F5;box-shadow:var(--sombra-2);transform:translate(-50%,24px);opacity:0;transition:opacity .35s,transform .45s var(--ease)}
.lr-toast-si{opacity:1;transform:translate(-50%,0)}
.lr-toast-ico{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#8a6a2c,#C8A45C);color:#fff}.lr-toast-ico svg{width:20px;height:20px}
.lr-toast b{display:block;font-size:15px}.lr-toast small{display:block;font-size:13px;color:rgba(244,242,245,.72)}
@media (prefers-reduced-motion: reduce){.lr-toast,.lr-av-barra i{transition:none}}
`;
