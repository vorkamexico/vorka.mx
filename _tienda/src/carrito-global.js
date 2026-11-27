// Carrito en todas las páginas de la tienda (lo agrega pagina()):
//   · el ícono con el número en el menú;
//   · «Agregar al carrito» junto al botón de compra de cada formulario con data-carrito="<grupo>" (un producto) o
//     data-carrito-planes='{"slug":"grupo"}' (el plan que esté elegido; sin campo slug y con una sola opción, esa);
//   · los botones data-carrito-slug del catálogo;
//   · el carrito lateral (panel a la derecha, como en Apple): se abre al agregar y al tocar el ícono; quitar, sumar y «Ir a pagar»;
//   · al volver de pagar (/tienda/gracias) quita del carrito solo lo pagado y, si queda algo, invita a seguir.
// Sin imports (paginas.js lo usa y carrito.js usa paginas.js). Reglas y descuentos: carrito.js.
export const CSS_CARRITO = `<style>
.t-nav-carrito{position:relative;flex:none}@media(max-width:430px){.nav.t-navs .t-nav-carrito~.t-entrar span{display:none}.nav.t-navs .t-nav-carrito~.t-pastilla.t-entrar{padding:0 11px}}.t-nav-carrito .t-cnt{position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--acento,#C8A24A);color:#111;font-size:11px;font-weight:800;line-height:18px;text-align:center}
.t-nav-carrito.brinca{animation:t-brinca .45s ease}@keyframes t-brinca{30%{transform:scale(1.18)}60%{transform:scale(.94)}}
.t-agregar{width:100%;justify-content:center;margin-top:10px}
.t-cp-fondo{position:fixed;inset:0;z-index:120;background:rgba(10,10,12,.38);opacity:0;pointer-events:none;transition:opacity .3s;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.t-cp{position:fixed;top:0;right:0;bottom:0;z-index:121;width:min(420px,100vw);display:flex;flex-direction:column;background:var(--bg,#fff);color:var(--fg,#111);box-shadow:-24px 0 60px -20px rgba(0,0,0,.35);transform:translateX(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s .38s}
.t-cp-abierto .t-cp-fondo{opacity:1;pointer-events:auto}.t-cp-abierto .t-cp{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.8,.2,1)}
.t-cp-cab{display:flex;align-items:center;justify-content:space-between;padding:calc(16px + env(safe-area-inset-top)) 18px 12px 22px}
.t-cp-cab h2{margin:0;font-size:22px;letter-spacing:-.02em}
.t-cp-x{width:40px;height:40px;border-radius:50%;border:0;background:var(--bg-2,rgba(0,0,0,.05));color:inherit;display:grid;place-items:center;cursor:pointer}
.t-cp-ok{margin:0 22px 8px;padding:10px 14px;border-radius:14px;background:color-mix(in srgb,var(--ok,#1F7A4A) 11%,transparent);color:var(--ok,#1F7A4A);font-weight:650;font-size:14.5px;display:flex;gap:8px;align-items:center}
.t-cp-cuerpo{flex:1;overflow:auto;padding:4px 22px 18px;overscroll-behavior:contain}
.t-cp-sec{margin-top:16px}.t-cp-sec h3{margin:0 0 10px;font-size:14px;color:var(--fg-2,#666);font-weight:650}
.t-cp-l{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.t-cp-it{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center}
.t-cp-img{width:64px;height:48px;border-radius:10px;overflow:hidden;background:var(--bg-2,#f2f2f2);display:block}.t-cp-img img{width:100%;height:100%;object-fit:cover}
.t-cp-tx{min-width:0;display:grid;gap:2px}.t-cp-tx b{font-size:15px;line-height:1.3}.t-cp-tx span{font-size:14px;color:var(--fg-2,#666)}.t-cp-tx small{font-size:12.5px;color:var(--fg-2,#666)}
.t-cp-quita{width:34px;height:34px;border-radius:50%;border:0;background:none;color:var(--fg-2,#666);cursor:pointer;display:grid;place-items:center}.t-cp-quita:hover{background:var(--bg-2,rgba(0,0,0,.05));color:var(--fg)}
.t-cp-fila{display:flex;justify-content:space-between;gap:10px;font-size:14.5px;padding:3px 0}.t-cp-fila.t-cp-verde{color:var(--ok,#1F7A4A);font-weight:650}
.t-cp-res{margin-top:12px;padding-top:10px;border-top:1px solid var(--line,rgba(0,0,0,.08))}
.t-cp-tip{margin:8px 0 0;font-size:13.5px;color:var(--fg-2,#666)}
.t-cp-paq{margin-top:10px;padding:12px 14px;border-radius:14px;background:var(--bg-2,rgba(0,0,0,.04));font-size:14px;line-height:1.45;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.t-cp-paq p{margin:0}
.t-cp-paq button{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;background:var(--fg,#111);color:var(--bg,#fff);cursor:pointer}
.t-cp-pie{padding:14px 22px calc(16px + env(safe-area-inset-bottom));border-top:1px solid var(--line,rgba(0,0,0,.08));display:grid;gap:10px;background:var(--bg,#fff)}
.t-cp-tot{display:flex;justify-content:space-between;align-items:baseline;font-size:15px}.t-cp-tot b{font-size:22px;letter-spacing:-.02em}
.t-cp-pie a,.t-cp-pie button{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:999px;font:inherit;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer}
.t-cp-pagar{background:var(--fg,#111);color:var(--bg,#fff)}.t-cp-sigue{background:none;border:1.5px solid var(--line,rgba(0,0,0,.12));color:var(--fg,#111)}
.t-cp-vacio{text-align:center;padding:40px 10px;color:var(--fg-2,#666)}
html.t-cp-bloq{overflow:hidden}
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
// Panel del carrito a la derecha (como en Apple): se abre al agregar y al tocar el ícono; ahí se quita, se suma y se va a pagar
var cp=null,ultimo='';
function pz(c){var d=c%100?2:0;return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});}
function ex(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var X='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function panel(){if(cp)return cp;cp=document.createElement('div');cp.className='t-cp-raiz';
 cp.innerHTML='<div class="t-cp-fondo" data-cp-cierra></div><aside class="t-cp" role="dialog" aria-modal="true" aria-labelledby="t-cp-t"><div class="t-cp-cab"><h2 id="t-cp-t">Tu carrito</h2><button type="button" class="t-cp-x" data-cp-cierra aria-label="Cerrar">'+X+'</button></div><div id="t-cp-ok"></div><div class="t-cp-cuerpo" id="t-cp-c"></div><div class="t-cp-pie" id="t-cp-p"></div></aside>';
 document.body.appendChild(cp);
 cp.addEventListener('click',function(e){if(e.target.closest('[data-cp-cierra]')){cierra();return;}
  var q=e.target.closest('[data-cp-quita]');if(q){guarda(lee().filter(function(x){return x.s!==q.getAttribute('data-cp-quita');}));ultimo='';carga();return;}
  var m=e.target.closest('[data-cp-suma]');if(m){try{var v=lee();JSON.parse(m.getAttribute('data-cp-suma')).forEach(function(x){v=v.filter(function(y){return y.a!==x.a;});v.push(x);});guarda(v);}catch(x){}ultimo='';carga();}});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.documentElement.classList.contains('t-cp-abierto'))cierra();});
 return cp;}
function abre(){panel();document.documentElement.classList.add('t-cp-bloq');requestAnimationFrame(function(){document.documentElement.classList.add('t-cp-abierto');});setTimeout(function(){var x=cp.querySelector('.t-cp-x');if(x)x.focus();},50);carga();}
function cierra(){document.documentElement.classList.remove('t-cp-abierto');setTimeout(function(){document.documentElement.classList.remove('t-cp-bloq');},300);}
function fila(x,precio,nota){return '<li class="t-cp-it"><a class="t-cp-img" href="'+ex(x.ruta)+'">'+(x.imagen?'<img src="'+ex(x.imagen)+'" alt="" loading="lazy">':'')+'</a><div class="t-cp-tx"><b>'+ex(x.nombre)+'</b><span>'+precio+'</span>'+(nota?'<small>'+nota+'</small>':'')+'</div><button type="button" class="t-cp-quita" data-cp-quita="'+ex(x.slug)+'" aria-label="Quitar '+ex(x.nombre)+'">'+X+'</button></li>';}
function carga(){var c=document.getElementById('t-cp-c'),p=document.getElementById('t-cp-p'),ok=document.getElementById('t-cp-ok'),v=lee();
 ok.innerHTML=ultimo?'<p class="t-cp-ok"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'+ex(ultimo)+' está en tu carrito</p>':'';
 if(!v.length){c.innerHTML='<p class="t-cp-vacio">Tu carrito está vacío.</p>';p.innerHTML='<a class="t-cp-pagar" href="/tienda/#productos">Ver la tienda</a>';return;}
 fetch('/api/carrito?s='+encodeURIComponent(v.map(function(x){return x.s;}).join(','))).then(function(r){return r.json();}).then(function(d){
  var fuera=(d.fuera||[]).concat(d.quitados||[]);if(fuera.length)guarda(lee().filter(function(x){return fuera.indexOf(x.s)<0;}));
  var S=d.suscripciones,h='';
  if(d.items.length){h+='<div class="t-cp-sec">'+(S?'<h3>Pago único</h3>':'')+'<ul class="t-cp-l">'+d.items.map(function(x){return fila(x,pz(x.precio));}).join('')+'</ul>';
   if(d.pct)h+='<div class="t-cp-res"><div class="t-cp-fila t-cp-verde"><span>'+d.pct+' % menos por llevar '+d.items.length+'</span><span>−'+pz(d.descuento)+'</span></div></div>';
   if(d.siguiente)h+='<p class="t-cp-tip">Suma '+(d.siguiente.faltan===1?'1 producto más':d.siguiente.faltan+' productos')+' y te descontamos '+d.siguiente.pct+' %.</p>';h+='</div>';}
  if(S){h+='<div class="t-cp-sec"><h3>Suscripciones</h3><ul class="t-cp-l">'+S.items.map(function(x){return fila(x,pz(x.precio)+' '+x.cada,x.instalacion?'+ '+pz(x.instalacion)+' una sola vez':'');}).join('')+'</ul>';
   var k=S.cobros.length===1&&S.cobros[0].ahorro?S.cobros[0]:null;
   if(k)h+='<div class="t-cp-res"><div class="t-cp-fila t-cp-verde"><span>Juntas como '+ex(k.nombre)+'</span><span>'+pz(k.precio)+' al mes</span></div><p class="t-cp-tip">Ahorras '+pz(k.ahorro)+' cada mes.</p></div>';
   if(S.sugerencia){var g=S.sugerencia;h+='<div class="t-cp-paq"><p>Suma <b>'+g.faltan.map(function(x){return ex(x.nombre);}).join(' y ')+'</b>: '+ex(g.paquete)+' por '+pz(g.precio)+' al mes, '+pz(g.ahorro)+' menos.</p><button type="button" data-cp-suma="'+ex(JSON.stringify(g.faltan.map(function(x){return {s:x.s,a:x.a,m:1};})))+'">Sumar</button></div>';}
   h+='</div>';}
  c.innerHTML=h;
  var hoy=d.total+(S?S.cobros.reduce(function(t,x){return t+x.precio+(x.instalacion||0);},0):0);
  p.innerHTML='<div class="t-cp-tot"><span>'+(S?'Pagas hoy':'Total')+'</span><b>'+pz(hoy)+' <small style="font-size:13px;font-weight:600">MXN</small></b></div><a class="t-cp-pagar" href="/tienda/carrito/">Ir a pagar</a><button type="button" class="t-cp-sigue" data-cp-cierra>Seguir comprando</button>';
 }).catch(function(){c.innerHTML='<p class="t-cp-vacio">No pudimos cargar tu carrito. Intenta de nuevo.</p>';});}
// el ícono del menú abre el panel (en la página del carrito no hace falta)
document.addEventListener('click',function(e){var a=e.target.closest('.t-nav-carrito');if(!a||location.pathname.indexOf('/tienda/carrito')===0)return;e.preventDefault();ultimo='';abre();});
function agrega(s,a,m,nombre){var v=lee().filter(function(x){return x.a!==a&&x.s!==s;});v.push(m?{s:s,a:a,m:1}:{s:s,a:a});guarda(v);var c=pinta();if(c){c.classList.remove('brinca');void c.offsetWidth;c.classList.add('brinca');}ultimo=nombre||'Listo: tu producto';abre();}
document.querySelectorAll('form[data-carrito],form[data-carrito-planes]').forEach(function(f){var b=document.createElement('button');b.type='button';b.className='btn blanco t-agregar';b.textContent='Agregar al carrito';
 var pl=null;try{pl=JSON.parse(f.getAttribute('data-carrito-planes')||'null');}catch(e){}
 function slug(){var s=new FormData(f).get('slug');if(!s&&pl){var k=Object.keys(pl);if(k.length===1)s=k[0];}return s;}
 var c=f.querySelector('[type=submit]');if(c&&c.parentNode)c.parentNode.insertBefore(b,c.nextSibling);else f.appendChild(b);
 function ve(){var r=f.querySelector('[name=para_quien]:checked');b.hidden=!!(r&&r.value==='regalo')||!!(pl&&!pl[slug()]);}f.addEventListener('change',ve);f.addEventListener('input',ve);ve();
 b.addEventListener('click',function(){var s=slug();if(!s)return;var ns={};try{ns=JSON.parse(f.getAttribute('data-carrito-nombres')||'{}');}catch(e){}var nom=ns[s]||f.getAttribute('data-carrito-nombre')||'';
  agrega(s,pl?pl[s]:f.getAttribute('data-carrito'),f.getAttribute('data-carrito-tipo')==='sus'||/-(mensual|anual)$/.test(s),nom.slice(0,60));b.textContent='Agregado ✓';setTimeout(function(){b.textContent='Agregar al carrito';},2000);});});
document.addEventListener('click',function(e){var b=e.target.closest('[data-carrito-slug]');if(!b)return;e.preventDefault();agrega(b.getAttribute('data-carrito-slug'),b.getAttribute('data-carrito-app'),false,b.getAttribute('data-carrito-nombre')||'');});
})();`;
