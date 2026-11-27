// Carrito en todas las páginas de la tienda (lo agrega pagina()): el ícono con el número en el menú, el botón «Agregar al
// carrito» junto a «Comprar» en cada formulario con data-carrito="<app>" y los botones data-carrito-slug del catálogo.
// Sin imports (paginas.js lo usa y carrito.js usa paginas.js). Reglas y descuento: carrito.js.
export const CSS_CARRITO = `<style>
.t-nav-carrito{position:relative;flex:none}@media(max-width:430px){.nav.t-navs .t-nav-carrito~.t-entrar span{display:none}.nav.t-navs .t-nav-carrito~.t-pastilla.t-entrar{padding:0 11px}}.t-nav-carrito .t-cnt{position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--acento,#C8A24A);color:#111;font-size:11px;font-weight:800;line-height:18px;text-align:center}
.t-agregar{width:100%;justify-content:center;margin-top:10px}
.t-car-aviso{position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px 12px 18px;border-radius:16px;background:var(--fg,#111);color:var(--bg,#fff);box-shadow:var(--sombra-2);font-size:14.5px;transition:opacity .25s,transform .25s}
.t-car-aviso[hidden]{display:flex;opacity:0;transform:translateY(12px);pointer-events:none}.t-car-aviso a{color:inherit;font-weight:700;white-space:nowrap}
@media(min-width:760px){.t-car-aviso{left:auto;right:24px;width:380px;bottom:24px}}
</style>`;

export const SCRIPT_CARRITO = `(function(){
var K='vorka_carrito';
function lee(){try{var v=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function guarda(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}pinta();}
if(/^\\/tienda\\/gracias/.test(location.pathname)){try{if(sessionStorage.getItem('vorka_carrito_pago')){localStorage.removeItem(K);sessionStorage.removeItem('vorka_carrito_pago');}}catch(e){}}
var ico='<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6.2M10 20.5h.01M17 20.5h.01"/></svg>';
function pinta(){var n=lee().length,nav=document.querySelector('.t-navs .nav-in');if(!nav)return;var a=nav.querySelector('.t-nav-carrito');
 if(!n&&!/^\\/tienda\\/carrito/.test(location.pathname)){if(a)a.remove();return;}
 if(!a){a=document.createElement('a');a.className='t-nav-ico t-nav-carrito';a.href='/tienda/carrito/';a.title='Carrito';var m=nav.querySelector('.t-pastilla')||nav.querySelector('.menu-btn');nav.insertBefore(a,m||null);}
 a.setAttribute('aria-label','Carrito: '+n+(n===1?' producto':' productos'));a.innerHTML=ico+(n?'<span class="t-cnt">'+n+'</span>':'');}
document.addEventListener('vorka:carrito',pinta);addEventListener('storage',function(e){if(e.key===K)pinta();});pinta();
var av=null,t=null;function aviso(n){if(!av){av=document.createElement('div');av.className='t-car-aviso';av.setAttribute('role','status');document.body.appendChild(av);}
 var txt=n>=3?'Llevas '+n+': 25 % menos en todo.':n===2?'Llevas 2: 15 % menos en todo.':'Agregado. Lleva 2 y te descontamos 15 %.';
 av.innerHTML='<span>'+txt+'</span><a href="/tienda/carrito/">Ver carrito →</a>';av.hidden=false;clearTimeout(t);t=setTimeout(function(){av.hidden=true;},6000);}
function agrega(s,a){var v=lee().filter(function(x){return x.a!==a&&x.s!==s;});v.push({s:s,a:a});guarda(v);aviso(v.length);}
document.querySelectorAll('form[data-carrito]').forEach(function(f){var b=document.createElement('button');b.type='button';b.className='btn blanco t-agregar';b.textContent='Agregar al carrito';
 var c=f.querySelector('[type=submit]');if(c&&c.parentNode)c.parentNode.insertBefore(b,c.nextSibling);else f.appendChild(b);
 function ve(){var r=f.querySelector('[name=para_quien]:checked');b.hidden=!!(r&&r.value==='regalo');}f.addEventListener('change',ve);ve();
 b.addEventListener('click',function(){var s=new FormData(f).get('slug');if(s){agrega(s,f.getAttribute('data-carrito'));b.textContent='Agregado ✓';setTimeout(function(){b.textContent='Agregar al carrito';},2000);}});});
document.addEventListener('click',function(e){var b=e.target.closest('[data-carrito-slug]');if(!b)return;e.preventDefault();agrega(b.getAttribute('data-carrito-slug'),b.getAttribute('data-carrito-app'));});
})();`;
