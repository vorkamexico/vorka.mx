// Carrito en todas las páginas de la tienda (lo agrega pagina()):
//   · el ícono con el número en el menú;
//   · «Agregar al carrito» junto al botón de compra de cada formulario con data-carrito="<grupo>" (un producto) o
//     data-carrito-planes='{"slug":"grupo"}' (el plan que esté elegido; sin campo slug y con una sola opción, esa);
//   · los botones data-carrito-slug del catálogo;
//   · el aviso al agregar (tarjeta con palomita, el descuento que ya llevas y «Ver carrito»);
//   · al volver de pagar (/tienda/gracias) quita del carrito solo lo pagado y, si queda algo, invita a seguir.
// Sin imports (paginas.js lo usa y carrito.js usa paginas.js). Reglas y descuentos: carrito.js.
export const CSS_CARRITO = `<style>
.t-nav-carrito{position:relative;flex:none}@media(max-width:430px){.nav.t-navs .t-nav-carrito~.t-entrar span{display:none}.nav.t-navs .t-nav-carrito~.t-pastilla.t-entrar{padding:0 11px}}.t-nav-carrito .t-cnt{position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--acento,#C8A24A);color:#111;font-size:11px;font-weight:800;line-height:18px;text-align:center}
.t-nav-carrito.brinca{animation:t-brinca .45s ease}@keyframes t-brinca{30%{transform:scale(1.18)}60%{transform:scale(.94)}}
.t-agregar{width:100%;justify-content:center;margin-top:10px}
.t-car-aviso{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:95;display:grid;grid-template-columns:40px 1fr;gap:4px 12px;align-items:center;padding:14px 14px 14px 16px;border-radius:20px;background:var(--card,#fff);color:var(--fg,#111);border:1px solid var(--line,rgba(0,0,0,.08));box-shadow:0 18px 48px -12px rgba(0,0,0,.28);transition:opacity .25s,transform .3s cubic-bezier(.2,.8,.2,1)}
.t-car-aviso[hidden]{display:grid;opacity:0;transform:translateY(16px);pointer-events:none}
.t-car-ok{grid-row:span 2;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--ok,#1F7A4A) 14%,transparent);color:var(--ok,#1F7A4A)}
.t-car-aviso b{font-size:15.5px;letter-spacing:-.01em}.t-car-aviso span{font-size:14px;color:var(--fg-2,#555);line-height:1.35}
.t-car-acc{grid-column:1/-1;display:flex;gap:8px;margin-top:10px}
.t-car-acc a,.t-car-acc button{flex:1;display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-radius:999px;font:inherit;font-weight:700;font-size:14.5px;text-decoration:none;cursor:pointer}
.t-car-acc a{background:var(--fg,#111);color:var(--bg,#fff)}.t-car-acc button{background:none;border:1.5px solid var(--line,rgba(0,0,0,.12));color:var(--fg,#111)}
@media(min-width:760px){.t-car-aviso{left:auto;right:24px;width:370px;bottom:24px}}
.t-car-sigue{margin:0 0 22px;padding:16px 18px;border-radius:18px;background:var(--card,#fff);border:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.t-car-sigue p{margin:0;font-size:15px}.t-car-sigue a{white-space:nowrap}
</style>`;

export const SCRIPT_CARRITO = `(function(){
var K='vorka_carrito';
function lee(){try{var v=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function guarda(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}pinta();}
// Al volver de pagar se quita solo lo pagado (si cancelaron en Stripe, se queda todo); si queda algo, se invita a seguir
if(/^\\/tienda\\/gracias/.test(location.pathname)&&!/[?&]cancelado=/.test(location.search)){try{var pg=sessionStorage.getItem('vorka_carrito_pago');if(pg){var ps=null;try{ps=JSON.parse(pg);}catch(e){}
 if(Array.isArray(ps))localStorage.setItem(K,JSON.stringify(lee().filter(function(x){return ps.indexOf(x.s)<0;})));else localStorage.removeItem(K);sessionStorage.removeItem('vorka_carrito_pago');
 var n=lee().length,m=document.querySelector('main .marco')||document.querySelector('main');if(n&&m){var s=document.createElement('div');s.className='t-car-sigue';s.innerHTML='<p><b>Te '+(n===1?'falta 1 producto':'faltan '+n+' productos')+'</b> por pagar en tu carrito.</p><a class="btn acento chico" href="/tienda/carrito/">Seguir</a>';m.insertBefore(s,m.firstChild);}}}catch(e){}}
var ico='<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6.2M10 20.5h.01M17 20.5h.01"/></svg>';
function pinta(){var n=lee().length,nav=document.querySelector('.t-navs .nav-in');if(!nav)return null;var a=nav.querySelector('.t-nav-carrito');
 if(!n&&!/^\\/tienda\\/carrito/.test(location.pathname)){if(a)a.remove();return null;}
 if(!a){a=document.createElement('a');a.className='t-nav-ico t-nav-carrito';a.href='/tienda/carrito/';a.title='Carrito';var m=nav.querySelector('.t-pastilla')||nav.querySelector('.menu-btn');nav.insertBefore(a,m||null);}
 a.setAttribute('aria-label','Carrito: '+n+(n===1?' producto':' productos'));a.innerHTML=ico+(n?'<span class="t-cnt">'+n+'</span>':'');return a;}
document.addEventListener('vorka:carrito',pinta);addEventListener('storage',function(e){if(e.key===K)pinta();});pinta();
var av=null,t=null;
function aviso(nombre,v,m){if(!av){av=document.createElement('div');av.className='t-car-aviso';av.setAttribute('role','status');document.body.appendChild(av);
  av.addEventListener('click',function(e){if(e.target.closest('[data-cierra]'))av.hidden=true;});}
 var n=v.filter(function(x){return !x.m;}).length,sub;
 if(m)sub='Si juntas apps que forman paquete, pagas el precio del paquete.';
 else sub=n>=3?'Llevas '+n+': ya tienes 25 % menos.':n===2?'Llevas 2: ya tienes 15 % menos. Con 1 más, 25 %.':'Suma otro y te descontamos 15 %.';
 av.innerHTML='<span class="t-car-ok"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><b>'+(nombre?nombre.replace(/[<>&]/g,'')+' está en tu carrito':'Agregado a tu carrito')+'</b><span>'+sub+'</span><div class="t-car-acc"><button type="button" data-cierra>Seguir viendo</button><a href="/tienda/carrito/">Ver carrito</a></div>';
 av.hidden=false;clearTimeout(t);t=setTimeout(function(){av.hidden=true;},7000);}
function agrega(s,a,m,nombre){var v=lee().filter(function(x){return x.a!==a&&x.s!==s;});v.push(m?{s:s,a:a,m:1}:{s:s,a:a});guarda(v);var c=pinta();if(c){c.classList.remove('brinca');void c.offsetWidth;c.classList.add('brinca');}aviso(nombre,v,m);}
document.querySelectorAll('form[data-carrito],form[data-carrito-planes]').forEach(function(f){var b=document.createElement('button');b.type='button';b.className='btn blanco t-agregar';b.textContent='Agregar al carrito';
 var pl=null;try{pl=JSON.parse(f.getAttribute('data-carrito-planes')||'null');}catch(e){}
 function slug(){var s=new FormData(f).get('slug');if(!s&&pl){var k=Object.keys(pl);if(k.length===1)s=k[0];}return s;}
 var c=f.querySelector('[type=submit]');if(c&&c.parentNode)c.parentNode.insertBefore(b,c.nextSibling);else f.appendChild(b);
 function ve(){var r=f.querySelector('[name=para_quien]:checked');b.hidden=!!(r&&r.value==='regalo')||!!(pl&&!pl[slug()]);}f.addEventListener('change',ve);f.addEventListener('input',ve);ve();
 b.addEventListener('click',function(){var s=slug();if(!s)return;var ns={};try{ns=JSON.parse(f.getAttribute('data-carrito-nombres')||'{}');}catch(e){}var nom=ns[s]||f.getAttribute('data-carrito-nombre')||'';
  agrega(s,pl?pl[s]:f.getAttribute('data-carrito'),f.getAttribute('data-carrito-tipo')==='sus'||/-(mensual|anual)$/.test(s),nom.slice(0,60));b.textContent='Agregado ✓';setTimeout(function(){b.textContent='Agregar al carrito';},2000);});});
document.addEventListener('click',function(e){var b=e.target.closest('[data-carrito-slug]');if(!b)return;e.preventDefault();agrega(b.getAttribute('data-carrito-slug'),b.getAttribute('data-carrito-app'),false,b.getAttribute('data-carrito-nombre')||'');});
})();`;
