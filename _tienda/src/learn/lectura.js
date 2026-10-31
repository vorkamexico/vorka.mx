// Vorka Learn · la experiencia de lectura: piezas del artículo (autor, minutos, índice con flecha) y un script chico
// (va con el nonce de la CSP) para la barra de progreso, el botón «subir» y el foco del menú. Sin JavaScript todo se lee
// igual: el índice es un <details>, el menú lo abre vorka.js y «subir» solo no aparece.
import { LOGO } from '../marco.generado.js';

const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const ICONOS_LR = {
  reloj: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  fecha: I('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  fuentes: I('<path d="M9 12.5 11 14.5 15.5 10"/><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/>'),
  indice: I('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1" fill="currentColor"/>'),
  abajo: I('<path d="m6 9 6 6 6-6"/>'),
  arriba: I('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  flecha: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  correo: I('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
  persona: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>'),
  sin: I('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
  lupa: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.5 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm5.5 13.3c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2.1 1.3 2.4 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.1 1.3z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M14 8.5V6.8c0-.8.5-1 1-1h2.3V2.2L14.2 2C10.9 2 10 4.2 10 6.3v2.2H7.5v3.7H10V22h4v-9.8h3l.4-3.7z"/></svg>',
};

// «Por Vorka Learn · Actualizado: octubre de 2026 · 6 min de lectura»
export const metaGuia = ({ fecha, fechaTxt, minutos }) => `<p class="lr-meta"><span class="lr-autor"><i>${LOGO}</i>Por Vorka Learn</span><span class="lr-dato">${ICONOS_LR.fecha}<span>Actualizado: <time datetime="${fecha}">${fechaTxt}</time></span></span><span class="lr-dato">${ICONOS_LR.reloj}${minutos} min de lectura</span><span class="lr-dato">${ICONOS_LR.fuentes}Con fuentes oficiales al final</span></p>`;

// Índice «En esta guía»: se ve como lo que es (ícono, número de apartados y flecha que gira al abrir)
export const indiceGuia = items => `<details class="lr-toc"><summary><span class="lr-toc-ico">${ICONOS_LR.indice}</span><span>En esta guía <span class="lr-toc-n">· ${items.length} apartados</span></span><span class="lr-toc-fl">${ICONOS_LR.abajo}</span></summary><ol>${items.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></details>`;

// Barra de progreso (solo en guías) y botón «subir» (todas las páginas largas)
export const BARRA = '<div class="lr-progreso" aria-hidden="true"><i></i></div>';
export const SUBIR = `<a class="lr-subir" href="#contenido" aria-label="Subir al inicio">${ICONOS_LR.arriba}</a>`;

// El script de Learn: progreso de lectura, «subir», foco del menú (al abrir va al menú, Tab no se sale, al cerrar
// regresa al botón) y clic fuera del panel en computadora. vorka.js ya abre/cierra el menú y maneja Esc y aria-expanded.
export const SCRIPT_LEARN = `(function(){var d=document,h=d.documentElement,b=d.querySelector('.lr-progreso i'),a=d.querySelector('.lr-art'),q=false;
function f(){q=false;var y=window.scrollY||0;h.classList.toggle('lr-bajo',y>900);if(b&&a){var r=a.getBoundingClientRect(),t=r.top+y-120,l=Math.max(1,a.offsetHeight-innerHeight*.6);b.style.transform='scaleX('+Math.min(1,Math.max(0,(y-t)/l)).toFixed(3)+')';}}
addEventListener('scroll',function(){if(!q){q=true;requestAnimationFrame(f);}},{passive:true});addEventListener('resize',f);f();
var m=d.getElementById('menu-movil'),k=d.querySelector('.menu-btn');if(!m||!k)return;
function abierto(){return d.body.classList.contains('menu-abierto');}
function sinc(){var o=abierto();k.setAttribute('aria-label',o?'Cerrar menú':'Abrir menú');if(o){m.focus({preventScroll:true});}else if(m.contains(d.activeElement)||d.activeElement===d.body){k.focus({preventScroll:true});}}
k.addEventListener('click',function(){setTimeout(sinc,0);});
d.addEventListener('keydown',function(e){if(!abierto())return;if(e.key==='Escape'){setTimeout(sinc,0);return;}
if(e.key==='Tab'){var l=[k].concat([].slice.call(m.querySelectorAll('a[href],button,input'))),i=l.indexOf(d.activeElement);if(e.shiftKey&&(i<=0)){e.preventDefault();l[l.length-1].focus();}else if(!e.shiftKey&&(i===l.length-1||i<0)){e.preventDefault();l[i<0?1:0].focus();}}});
d.addEventListener('click',function(e){if(abierto()&&!m.contains(e.target)&&!k.contains(e.target)){k.click();}});
})();`;
