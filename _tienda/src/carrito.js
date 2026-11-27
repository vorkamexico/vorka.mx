// Carrito de la tienda (nov 2026, decisión del dueño): se juntan productos de pago único de estudio y crecimiento personal
// (simuladores, test vocacional, ¿Qué proyecto social hago?, Ruta de Impacto, evaluación de liderazgo) en una sola compra,
// y el descuento sale solo: 2 productos → 15 %, 3 o más → 25 %. Reemplaza a los paquetes de simuladores en el catálogo
// (sus ligas siguen funcionando). Las suscripciones (Vuelve, Agenda…) NO entran todavía: se cobran por separado (fase 3).
//   · enCarrito(p): qué productos entran. Uno por producto: dos planes del mismo simulador cuentan como uno (se reemplaza).
//   · descuentoCarrito(prods): el descuento automático, con la forma de resolverDescuento (gana el mayor contra un código).
//   · GET /api/carrito?s=slug,slug → los productos, el subtotal, el descuento y sugerencias para completar.
//   · /tienda/carrito/ → la página (los productos viven en localStorage del navegador: vorka_carrito).
//   · carrito-global.js: en todas las páginas de la tienda, el ícono con el número en el menú y el botón «Agregar al carrito».
import { json } from './util.js';
import { pagina } from './paginas.js';
import { listarProductos, productoPorSlug } from './modelo.js';
import { FLECHA } from './marco.generado.js';

export const CARRITO = { codigo: 'CARRITO', dos: 15, tres: 25, max: 8 };
const CATEGORIAS = ['Exámenes', 'Educación', 'Proyectos sociales'];

export function enCarrito(p) {
  if (!p || p.creador_id) return false;
  const c = p.contenido || {};
  if (c.suscripcion || c.complemento || c.oculto || c.instalacion_de) return false;
  if (['intento', 'examen'].includes(c.acceso?.tipo)) return false;      // simulacros adicionales: solo quien ya tiene el simulador
  if (/^simuladores-/.test(p.slug) || /-grupo-\d+$/.test(p.slug)) return false;   // paquetes viejos y licencias para grupo
  return CATEGORIAS.includes(p.categoria);
}
// Un lugar por producto: los planes de un simulador comparten app
export const grupoCarrito = p => p.contenido?.acceso?.app || p.slug;
export const pctCarrito = n => (n >= 3 ? CARRITO.tres : n >= 2 ? CARRITO.dos : 0);
export function descuentoCarrito(prods) {
  const n = new Set(prods.map(grupoCarrito)).size, pct = pctCarrito(n);
  return pct ? { tipo: 'carrito', codigo: CARRITO.codigo, pct, meses: null, app: null, texto: `Por llevar ${n} productos: ${pct} % menos` } : null;
}

const corto = p => String(p.nombre).replace(/ · Completo \(práctica \+ examen\)$/, ' · Completo').replace(/ · Reporte completo$/, '');
const item = p => ({ slug: p.slug, app: grupoCarrito(p), nombre: corto(p), precio: p.precio_centavos, imagen: p.imagen || null, ruta: p.contenido?.acceso?.ruta || `/tienda/${p.slug}/` });

// Sugerencias: un producto por app (de los simuladores, su plan Completo), los que no están ya en el carrito
async function sugerencias(env, apps) {
  const ps = (await listarProductos(env)).filter(enCarrito);
  const porApp = new Map();
  for (const p of ps) {
    const a = grupoCarrito(p);
    if (apps.has(a)) continue;
    const ya = porApp.get(a);
    if (!ya || /-paquete$/.test(p.slug)) porApp.set(a, p);
  }
  return [...porApp.values()].slice(0, 6).map(item);
}

export async function apiCarrito(env, url) {
  const slugs = String(url.searchParams.get('s') || '').split(',').map(s => s.trim().toLowerCase()).filter(s => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, CARRITO.max);
  const items = [], fuera = [], apps = new Set();
  for (const s of slugs) {
    const p = await productoPorSlug(env, s);
    if (!enCarrito(p)) { fuera.push(s); continue; }
    const a = grupoCarrito(p);
    if (apps.has(a)) { const i = items.findIndex(x => x.app === a); items.splice(i, 1); }   // el último plan elegido manda
    apps.add(a); items.push(item(p));
  }
  const subtotal = items.reduce((t, x) => t + x.precio, 0), pct = pctCarrito(items.length);
  const descuento = Math.round(subtotal * pct / 100);
  return json({ items, fuera, subtotal, pct, descuento, total: subtotal - descuento, siguiente: items.length >= 3 ? null : { faltan: items.length >= 2 ? 1 : 2 - items.length, pct: items.length >= 2 ? CARRITO.tres : CARRITO.dos }, sugerencias: await sugerencias(env, apps) },
    200, { 'cache-control': 'no-store' });
}

// ---------- página /tienda/carrito/ ----------
const SCRIPT_PAGINA = `(function(){
var K='vorka_carrito',raiz=document.getElementById('car'),f=document.getElementById('car-form'),err=document.getElementById('car-error');
function lee(){try{var v=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function guarda(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}document.dispatchEvent(new Event('vorka:carrito'));}
function pesos(c){var d=c%100?2:0;return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d})+' MXN';}
function e(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var datos=null;
function pinta(){var v=lee();if(!v.length){raiz.className='car vacio';f.hidden=true;document.getElementById('car-lista').innerHTML='';document.getElementById('car-res').innerHTML='';sug([]);return;}
 fetch('/api/carrito?s='+encodeURIComponent(v.map(function(x){return x.s;}).join(','))).then(function(r){return r.json();}).then(function(d){datos=d;
  if(d.fuera&&d.fuera.length){guarda(v.filter(function(x){return d.fuera.indexOf(x.s)<0;}));}
  raiz.className='car'+(d.items.length?'':' vacio');f.hidden=!d.items.length;
  document.getElementById('car-lista').innerHTML=d.items.map(function(x){return '<li class="car-it"><a class="car-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'<span>'+e(x.nombre.charAt(0))+'</span>')+'</a><div class="car-tx"><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+pesos(x.precio)+'</span></div><button type="button" class="car-quita" data-s="'+e(x.slug)+'" aria-label="Quitar '+e(x.nombre)+'">Quitar</button></li>';}).join('');
  var res='<div class="car-fila"><span>Subtotal</span><span class="num">'+pesos(d.subtotal)+'</span></div>';
  if(d.pct)res+='<div class="car-fila car-ahorro"><span>'+d.items.length+' productos · '+d.pct+' % menos</span><span class="num">−'+pesos(d.descuento)+'</span></div>';
  res+='<div class="car-fila car-total"><span>Total</span><b class="num">'+pesos(d.total)+'</b></div>';
  if(d.siguiente)res+='<p class="car-empuje">'+(d.siguiente.faltan===1?'Agrega 1 producto más':'Agrega '+d.siguiente.faltan+' productos')+' y te descontamos <b>'+d.siguiente.pct+' %</b> de todo.</p>';
  else res+='<p class="car-empuje ok">Tienes el mayor descuento: 25 % en todo.</p>';
  document.getElementById('car-res').innerHTML=res;sug(d.sugerencias||[]);
 }).catch(function(){err.textContent='No pudimos cargar tu carrito. Recarga la página.';err.hidden=false;});}
function sug(l){var s=document.getElementById('car-sug');s.hidden=!l.length;document.getElementById('car-sug-l').innerHTML=l.map(function(x){return '<li><a class="car-sg-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'')+'</a><div><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+pesos(x.precio)+'</span></div><button type="button" class="btn blanco chico" data-agrega="'+e(x.slug)+'" data-app="'+e(x.app)+'">Agregar</button></li>';}).join('');}
document.addEventListener('click',function(ev){var q=ev.target.closest('.car-quita');if(q){guarda(lee().filter(function(x){return x.s!==q.dataset.s;}));pinta();return;}
 var a=ev.target.closest('[data-agrega]');if(a){var v=lee().filter(function(x){return x.a!==a.dataset.app;});v.push({s:a.dataset.agrega,a:a.dataset.app});guarda(v);pinta();}});
f.addEventListener('submit',function(ev){ev.preventDefault();err.hidden=true;if(!datos||!datos.items.length)return;var b=document.getElementById('car-btn');b.disabled=true;
 var fd=new FormData(f);fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({carrito:true,items:datos.items.map(function(x){return {slug:x.slug,cantidad:1};}),nombre:fd.get('nombre'),email:fd.get('email'),codigo:fd.get('codigo')||'',terminos:!!fd.get('terminos')})})
 .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});}).then(function(x){if(x.ok&&x.j.url){try{sessionStorage.setItem('vorka_carrito_pago','1');}catch(e){}location.href=x.j.url;return;}
  err.textContent=(x.j&&x.j.error)||'No pudimos abrir el pago. Intenta de nuevo.';err.hidden=false;b.disabled=false;}).catch(function(){err.textContent='No pudimos abrir el pago. Revisa tu conexión.';err.hidden=false;b.disabled=false;});});
pinta();})();`;

const CSS_PAGINA = `<style>
.car-sec{padding:clamp(18px,4vw,48px) 0 clamp(48px,6vw,80px)}
.car-cols{display:grid;gap:22px;margin-top:22px}@media(min-width:900px){.car-cols{grid-template-columns:1.25fr 1fr;align-items:start}}
.car-caja{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px;box-shadow:var(--sombra)}
.car-lista{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.car-it{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center}
.car-img{display:block;width:64px;height:48px;border-radius:10px;overflow:hidden;background:var(--bg-2,var(--line))}
.car-img img{width:100%;height:100%;object-fit:cover}.car-img span{display:grid;place-items:center;height:100%;font-weight:800}
.car-tx{min-width:0;display:grid}.car-tx a{color:inherit;text-decoration:none}.car-tx b{font-size:15.5px;line-height:1.3}.car-tx span{font-size:14px;color:var(--fg-2)}
.car-quita{font:inherit;font-size:13.5px;color:var(--fg-2);background:none;border:0;padding:8px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.car-fila{display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:15.5px}
.car-ahorro{color:var(--ok,#1F7A4A);font-weight:650}.car-total{border-top:1px solid var(--line);margin-top:4px;padding-top:12px;font-size:18px}.car-total b{font-size:22px}
.car-empuje{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--bg-2,rgba(0,0,0,.04));font-size:14.5px}.car-empuje.ok{color:var(--ok,#1F7A4A)}
.car-vacio{display:none;text-align:center;padding:22px 8px}.car.vacio .car-vacio{display:block}.car.vacio .car-cols{display:none}
.car-sug{margin-top:34px}.car-sug ul{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.car-sug li{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px}
.car-sg-img{display:block;width:56px;height:42px;border-radius:8px;overflow:hidden;background:var(--line)}.car-sg-img img{width:100%;height:100%;object-fit:cover}
.car-sug li div{min-width:0;display:grid}.car-sug li a{color:inherit;text-decoration:none}.car-sug li b{font-size:14.5px;line-height:1.3}.car-sug li span{font-size:13.5px;color:var(--fg-2)}
#car-form{background:none;border:0;padding:0;box-shadow:none;margin-top:18px!important}#car-form .btn[type=submit]{width:100%;justify-content:center;margin-top:6px}
</style>`;

export async function paginaCarrito(env) {
  return pagina({
    titulo: 'Tu carrito · Tienda Vorka México', ruta: '/tienda/carrito/', noindex: true,
    descripcion: 'Junta tus simuladores y tests en una sola compra: 15 % menos al llevar 2 y 25 % al llevar 3 o más.',
    head: CSS_PAGINA,
    script: SCRIPT_PAGINA,
    cuerpo: `<section class="car-sec"><div class="marco">
  <h1 class="t-h1">Tu carrito</h1>
  <p class="t-lead" style="margin-top:10px">Junta tus simuladores y tests en una sola compra. Al llevar 2 te descontamos <b>15 %</b> de todo, y al llevar 3 o más, <b>25 %</b>. Se aplica solo.</p>
  <div class="car vacio" id="car">
    <div class="car-vacio car-caja"><p style="margin:0 0 14px">Tu carrito está vacío.</p><a class="btn acento" href="/tienda/#productos">Ver el catálogo ${FLECHA}</a></div>
    <div class="car-cols">
      <div class="car-caja"><ul class="car-lista" id="car-lista"></ul></div>
      <div class="car-caja">
        <div id="car-res"></div>
        <form class="t-form" id="car-form" novalidate hidden style="margin-top:16px">
          <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
          <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega el acceso a todo lo que compres.</small></div>
          <div class="t-campo"><label for="codigo">Código de descuento <small>(opcional)</small></label><input id="codigo" name="codigo" type="text" maxlength="40" autocapitalize="characters"><small class="t-ayuda">Si tu código da más que el descuento del carrito, se aplica el mayor. No se suman.</small></div>
          <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
          <p class="t-error" id="car-error" role="alert" hidden></p>
          <button class="btn acento" type="submit" id="car-btn">Pagar ${FLECHA}</button>
          <p class="t-pago" style="margin-top:10px;font-size:13.5px;color:var(--fg-2)">Pago protegido con Stripe · tarjeta u OXXO. ¿Es para regalar? Compra cada producto desde su página con «Para regalar».</p>
        </form>
      </div>
    </div>
  </div>
  <section class="car-sug" id="car-sug" hidden><h2 class="h2">Completa tu preparación</h2><ul id="car-sug-l"></ul></section>
</div></section>`,
  });
}

