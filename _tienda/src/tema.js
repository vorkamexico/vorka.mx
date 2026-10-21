// Apariencia (automático · claro · oscuro) para todas las páginas que arma el Worker de la tienda y Puntos Vorka.
// - La preferencia vive en localStorage ('vorka-tema': auto | claro | oscuro; sin valor = auto).
// - TEMA_HEAD corre en <head> antes de pintar: pone <html data-tema="claro|oscuro"> (sin destello) y, en automático,
//   sigue al sistema cuando cambia. Los colores viven en tokens CSS (tienda.css y Puntos Vorka), no en cada pantalla.
// - Cualquier botón con data-tema-op="auto|claro|oscuro" cambia la apariencia (delegación: sirve aunque aparezca después).
// - Además: imágenes que no cargan muestran un fondo limpio en vez del ícono roto, y si el navegador regresa a una
//   página guardada con un botón de pago "abriendo…", se recarga para que el botón vuelva a servir.
export const CLAVE_TEMA = 'vorka-tema';

export const TEMA_HEAD = `(function(){var d=document.documentElement,k='${CLAVE_TEMA}',m=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
function pref(){try{var v=localStorage.getItem(k);return v==='claro'||v==='oscuro'?v:'auto';}catch(e){return 'auto';}}
function aplica(){var p=pref(),t=p==='auto'?(m&&m.matches?'oscuro':'claro'):p;d.setAttribute('data-tema',t);d.setAttribute('data-tema-pref',p);
 var c=document.querySelector('meta[name=theme-color]');if(c)c.setAttribute('content',t==='oscuro'?(c.getAttribute('data-oscuro')||'#141216'):(c.getAttribute('data-claro')||'#FBFAF8'));
 var b=document.querySelectorAll('[data-tema-op]');for(var i=0;i<b.length;i++)b[i].setAttribute('aria-checked',b[i].getAttribute('data-tema-op')===p?'true':'false');}
aplica();if(m){var f=function(){if(pref()==='auto')aplica();};m.addEventListener?m.addEventListener('change',f):m.addListener&&m.addListener(f);}
window.vorkaTema={pref:pref,poner:function(v){try{v==='auto'?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){}d.classList.add('tema-cambio');aplica();setTimeout(function(){d.classList.remove('tema-cambio');},280);}};
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-tema-op]');if(b){e.preventDefault();window.vorkaTema.poner(b.getAttribute('data-tema-op'));}});
document.addEventListener('DOMContentLoaded',aplica);
document.addEventListener('error',function(e){var i=e.target;if(i&&i.tagName==='IMG'&&!i.dataset.fallo){i.dataset.fallo='1';i.parentNode&&i.parentNode.classList&&i.parentNode.classList.add('img-fallo');}},true);
window.addEventListener('pageshow',function(e){if(e.persisted&&document.querySelector('form button[type=submit][disabled]'))location.reload();});
})();`;

const ICONO = {
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/></svg>',
  claro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
  oscuro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
};
export const OPCIONES_TEMA = [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']];

// Selector de 3 opciones (radiogroup). clase: para ajustar su aspecto en cada lugar (pie de la tienda, ajustes de Puntos).
export const selectorTema = ({ clase = '', etiqueta = 'Apariencia' } = {}) =>
  `<div class="tema-sel ${clase}" role="radiogroup" aria-label="${etiqueta}">${OPCIONES_TEMA.map(([v, t]) =>
    `<button type="button" role="radio" aria-checked="${v === 'auto'}" data-tema-op="${v}">${ICONO[v]}<span>${t}</span></button>`).join('')}</div>`;
