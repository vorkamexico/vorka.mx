// Barra de compra fija de la tienda (nov 2026, «como en la tienda de Apple»): la misma en TODOS los productos, en celular y
// en compu. pagina() agrega este CSS y este script solo cuando la página trae una barra (class="t-barra").
//   · Se esconde mientras se ve el inicio (para no repetir el botón grande) y mientras el formulario o los planes a los que
//     lleva están en medio de la pantalla. El resto del tiempo se queda quieta abajo.
//   · data-ocultar="selector" en la barra dice qué la esconde; si no, se usa el destino de su botón (#comprar, #planes…) y,
//     si ahí hay un <form>, solo el formulario.
//   · El scroll se escucha en el documento con captura: en compu quien se desplaza es el <body>, no la ventana.
// Uso en una página: barraCompra({ titulo, detalle, href, boton }) o el HTML de siempre: <div class="t-barra">…</div>
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const barraCompra = ({ titulo = '', detalle = '', href = '#comprar', boton = 'Comprar', ocultar = '', clase = 'acento' }) =>
  `<div class="t-barra vk-barra"${ocultar ? ` data-ocultar="${esc(ocultar)}"` : ''}><div><b>${esc(titulo)}</b>${detalle ? `<small>${esc(detalle)}</small>` : ''}</div><a class="btn ${clase} chico" href="${esc(href)}">${esc(boton)}</a></div>`;

export const CSS_BARRA = `<style>
.t-barra{display:flex;align-items:center;justify-content:space-between;gap:12px;position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:80;padding:10px 10px 10px 18px;border-radius:999px;background:var(--vidrio);border:1px solid var(--line);box-shadow:var(--sombra-2);-webkit-backdrop-filter:saturate(180%) blur(16px);backdrop-filter:saturate(180%) blur(16px);transition:transform .3s var(--ease),opacity .3s}
.t-barra.oculta{transform:translateY(140%);opacity:0;pointer-events:none}
.t-barra>div{min-width:0}.t-barra b,.t-barra small{display:block}.t-barra small{font-size:12.5px;color:var(--fg-2)}.t-barra .btn{flex:none}
@media(min-width:760px){.t-barra{left:50%;right:auto;width:min(620px,calc(100% - 32px));transform:translateX(-50%)}.t-barra.oculta{transform:translate(-50%,140%)}}
</style>`;

export const SCRIPT_BARRA = `(function(){
var bs=[].slice.call(document.querySelectorAll('.t-barra'));if(!bs.length)return;
var hero=document.querySelector('.pm-hero,.t-hero')||document.querySelector('main section,section');
function objetivo(b){var s=b.getAttribute('data-ocultar');if(s)return document.querySelector(s);
  var a=b.querySelector('a[href^="#"]'),t=a&&a.getAttribute('href').length>1?document.querySelector(a.getAttribute('href')):null;
  return t?(t.tagName==='FORM'?t:(t.querySelector('form')||t)):null;}
var ts=bs.map(objetivo);bs.forEach(function(b){b.classList.add('oculta');});
var pend=false;function p(){pend=false;var vh=innerHeight,arriba=hero&&hero.getBoundingClientRect().bottom>vh*.3;
  bs.forEach(function(b,i){var t=ts[i],r=t&&t.getBoundingClientRect(),enMedio=r&&r.height&&r.top<vh*.75&&r.bottom>vh*.25;b.classList.toggle('oculta',!!(arriba||enMedio));});}
document.addEventListener('scroll',function(){if(!pend){pend=true;requestAnimationFrame(p);}},{passive:true,capture:true});
addEventListener('resize',p);p();})();`;
