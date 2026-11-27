// Carrito de la tienda (nov 2026, decisión del dueño): se juntan productos de pago único de estudio y crecimiento personal
// (simuladores, test vocacional, ¿Qué proyecto social hago?, Ruta de Impacto, evaluación de liderazgo) en una sola compra,
// y el descuento sale solo: 2 productos → 15 %, 3 o más → 25 %. Reemplaza a los paquetes de simuladores en el catálogo
// (sus ligas siguen funcionando).
// Fase 3 — Mensualidad: las apps de negocio (Agenda, Vuelve, Brillo, Mostrador) también entran al carrito, en su propia sección.
// Si las apps que juntas son exactamente las de un paquete y el paquete sale más barato, se contrata el paquete (una sola
// suscripción, la misma que vende la página de cada app); si no, cada una se contrata por separado. Si te falta una app
// para armar un paquete que te conviene, el carrito te la sugiere. Las mensualidades se cobran aparte de lo de pago único
// (Stripe: suscripción con tarjeta; lo único admite OXXO) y no llevan el 15 %/25 %.
//   · enCarrito(p): qué productos entran. Uno por producto: dos planes del mismo simulador cuentan como uno (se reemplaza).
//   · descuentoCarrito(prods): el descuento automático, con la forma de resolverDescuento (gana el mayor contra un código).
//   · GET /api/carrito?s=slug,slug → los productos, el subtotal, el descuento y sugerencias para completar.
//   · /tienda/carrito/ → la página (los productos viven en localStorage del navegador: vorka_carrito).
//   · carrito-global.js: en todas las páginas de la tienda, el ícono con el número en el menú y el botón «Agregar al carrito».
import { json, all } from './util.js';
import { pagina } from './paginas.js';
import { listarProductos, productoPorSlug, VENDIBLE } from './modelo.js';
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

// ---------- Mensualidad (fase 3) ----------
// Apps que entran al carrito → sus condiciones (Mostrador usa las de Vuelve, igual que su página)
export const APPS_MENSUAL = { agenda: { nombre: 'Agenda', legal: '/legal/agenda/' }, vuelve: { nombre: 'Vuelve', legal: '/legal/vuelve/' },
  brillo: { nombre: 'Brillo', legal: '/legal/brillo/' }, mostrador: { nombre: 'Mostrador', legal: '/legal/vuelve/' } };
// Plan mensual de una sola app (no paquetes, complementos, instalaciones ni planes de creadores)
export function enMensual(p) {
  if (!p || p.creador_id) return false;
  const c = p.contenido || {};
  return c.suscripcion?.intervalo === 'month' && !c.complemento && !c.instalacion_de && !c.acceso?.apps && !!APPS_MENSUAL[c.acceso?.app];
}
// Atributo para el formulario de compra de una app: sus planes mensuales que entran al carrito (los anuales y paquetes no)
export const attrPlanesCarrito = prods => { const m = {}; for (const p of prods) if (enMensual(p)) m[p.slug] = p.contenido.acceso.app;
  return Object.keys(m).length ? ` data-carrito-planes='${JSON.stringify(m)}'` : ''; };
// El plan más barato de cada app, para sugerirla cuando completa un paquete
const BASE_MENSUAL = { agenda: 'agenda-mensual', vuelve: 'vuelve-mensual', brillo: 'brillo-basico-mensual', mostrador: 'mostrador-mensual' };
const mismas = (a, b) => a.length === b.length && a.every(x => b.includes(x));
// Paquetes mensuales a la venta (están ocultos del catálogo, por eso no salen de listarProductos)
async function paquetesMensuales(env) {
  const rs = await all(env, `SELECT p.slug, p.nombre, p.precio_centavos, p.descripcion_corta, p.contenido FROM products p WHERE ${VENDIBLE} AND p.creador_id IS NULL`);
  return rs.map(r => { let c; try { c = JSON.parse(r.contenido || '{}'); } catch { c = {}; } return { ...r, c }; })
    .filter(r => r.c.suscripcion?.intervalo === 'month' && !r.c.complemento && Array.isArray(r.c.acceso?.apps) && !r.c.acceso?.pagina
      && r.c.acceso.apps.every(a => APPS_MENSUAL[a]))
    .map(r => ({ slug: r.slug, nombre: String(r.nombre).replace(/ · (paquete|plan) mensual$/, ''), precio: r.precio_centavos, texto: r.descripcion_corta || '', apps: r.c.acceso.apps }));
}
const itemMensual = p => ({ slug: p.slug, app: p.contenido.acceso.app, nombre: String(p.nombre).replace(/ mensual$/, '').replace(/ · plan$/, ''), precio: p.precio_centavos, imagen: p.imagen || null, ruta: p.contenido.acceso.ruta || `/tienda/${p.slug}/` });

// items (ya uno por app) → cómo se contrata: { plan } (un paquete o la única app), { separadas } y las sugerencias
export async function resolverMensual(env, items) {
  if (!items.length) return null;
  const apps = items.map(x => x.app), suma = items.reduce((t, x) => t + x.precio, 0);
  const paquetes = await paquetesMensuales(env);
  const paq = paquetes.filter(k => mismas(k.apps, apps) && k.precio < suma).sort((a, b) => a.precio - b.precio)[0];
  const plan = paq ? { slug: paq.slug, nombre: paq.nombre, texto: paq.texto, precio: paq.precio, separado: suma, ahorro: suma - paq.precio, paquete: true }
    : items.length === 1 ? { slug: items[0].slug, nombre: items[0].nombre, precio: items[0].precio, separado: suma, ahorro: 0, paquete: false } : null;
  // Sugerencias: paquetes que contienen todo lo del carrito y salen más baratos que contratar cada app suelta
  const sugerencias = [];
  for (const k of paquetes) {
    if (paq || !apps.every(a => k.apps.includes(a)) || mismas(k.apps, apps)) continue;
    const faltan = [];
    for (const a of k.apps.filter(a => !apps.includes(a))) { const p = await productoPorSlug(env, BASE_MENSUAL[a]); if (p && enMensual(p)) faltan.push(itemMensual(p)); }
    if (faltan.length !== k.apps.length - apps.length) continue;
    const separado = suma + faltan.reduce((t, x) => t + x.precio, 0);
    if (k.precio < separado) sugerencias.push({ paquete: k.nombre, precio: k.precio, separado, faltan });
  }
  sugerencias.sort((a, b) => (b.separado - b.precio) - (a.separado - a.precio));
  const legales = [...new Map(apps.map(a => [APPS_MENSUAL[a].legal, { url: APPS_MENSUAL[a].legal, nombre: a === 'mostrador' ? 'Vuelve' : APPS_MENSUAL[a].nombre }])).values()];
  return { items, total: suma, plan, separadas: !plan, sugerencias: sugerencias.slice(0, 2), legales };
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
  const items = [], fuera = [], apps = new Set(), mensuales = [];
  for (const s of slugs) {
    const p = await productoPorSlug(env, s);
    if (enMensual(p)) { const m = itemMensual(p), i = mensuales.findIndex(x => x.app === m.app); if (i > -1) mensuales.splice(i, 1); mensuales.push(m); continue; }
    if (!enCarrito(p)) { fuera.push(s); continue; }
    const a = grupoCarrito(p);
    if (apps.has(a)) { const i = items.findIndex(x => x.app === a); items.splice(i, 1); }   // el último plan elegido manda
    apps.add(a); items.push(item(p));
  }
  const subtotal = items.reduce((t, x) => t + x.precio, 0), pct = pctCarrito(items.length);
  const descuento = Math.round(subtotal * pct / 100);
  return json({ items, fuera, subtotal, pct, descuento, total: subtotal - descuento, siguiente: items.length >= 3 ? null : { faltan: items.length >= 2 ? 1 : 2 - items.length, pct: items.length >= 2 ? CARRITO.tres : CARRITO.dos },
    sugerencias: items.length || !mensuales.length ? await sugerencias(env, apps) : [], mensual: await resolverMensual(env, mensuales) },
    200, { 'cache-control': 'no-store' });
}

// ---------- página /tienda/carrito/ ----------
// Dos secciones: «Pago único» (con el 15 %/25 %) y «Mensualidad» (apps de negocio). Un solo formulario con los datos y un
// botón por cobro: «Pagar» lo único y «Contratar» la mensualidad (o una por app cuando no arman paquete). Al pagar, en
// /tienda/gracias se quita del carrito solo lo que se pagó (sessionStorage vorka_carrito_pago = los slugs).
const SCRIPT_PAGINA = `(function(){
var K='vorka_carrito',raiz=document.getElementById('car'),f=document.getElementById('car-form'),err=document.getElementById('car-error');
function lee(){try{var v=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function guarda(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}document.dispatchEvent(new Event('vorka:carrito'));}
function pesos(c){var d=c%100?2:0;return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d})+' MXN';}
function e(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function $(i){return document.getElementById(i);}
function fila(x,extra){return '<li class="car-it"><a class="car-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'<span>'+e(x.nombre.charAt(0))+'</span>')+'</a><div class="car-tx"><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+pesos(x.precio)+(extra||'')+'</span></div><button type="button" class="car-quita" data-s="'+e(x.slug)+'" aria-label="Quitar '+e(x.nombre)+'">Quitar</button></li>';}
var datos=null;
function pinta(){var v=lee();if(!v.length){raiz.className='car vacio';f.hidden=true;$('car-lista').innerHTML='';$('car-res').innerHTML='';$('car-mes-lista').innerHTML='';$('car-mes-res').innerHTML='';sug([]);return;}
 fetch('/api/carrito?s='+encodeURIComponent(v.map(function(x){return x.s;}).join(','))).then(function(r){return r.json();}).then(function(d){datos=d;
  if(d.fuera&&d.fuera.length){guarda(v.filter(function(x){return d.fuera.indexOf(x.s)<0;}));}
  var m=d.mensual,hay=d.items.length||(m&&m.items.length);
  raiz.className='car'+(hay?'':' vacio');f.hidden=!hay;
  // pago único
  $('car-unico').hidden=!d.items.length;$('car-lista').innerHTML=d.items.map(function(x){return fila(x);}).join('');
  var res='';if(d.items.length){res='<div class="car-fila"><span>Subtotal</span><span class="num">'+pesos(d.subtotal)+'</span></div>';
   if(d.pct)res+='<div class="car-fila car-ahorro"><span>'+d.items.length+' productos · '+d.pct+' % menos</span><span class="num">−'+pesos(d.descuento)+'</span></div>';
   res+='<div class="car-fila car-total"><span>Total</span><b class="num">'+pesos(d.total)+'</b></div>';
   if(d.siguiente)res+='<p class="car-empuje">'+(d.siguiente.faltan===1?'Agrega 1 producto más':'Agrega '+d.siguiente.faltan+' productos')+' y te descontamos <b>'+d.siguiente.pct+' %</b> de todo.</p>';
   else res+='<p class="car-empuje ok">Tienes el mayor descuento: 25 % en todo.</p>';}
  $('car-res').innerHTML=res;
  // mensualidad
  $('car-mes').hidden=!(m&&m.items.length);var mr='';
  if(m&&m.items.length){$('car-mes-lista').innerHTML=m.items.map(function(x){return fila(x,' al mes');}).join('');
   if(m.plan&&m.plan.paquete)mr='<div class="car-fila car-total"><span>'+e(m.plan.nombre)+'</span><b class="num">'+pesos(m.plan.precio)+'</b></div><p class="car-empuje ok">Juntas te salen en precio de paquete: ahorras <b>'+pesos(m.plan.ahorro)+' cada mes</b> (por separado serían '+pesos(m.plan.separado)+').</p>';
   else if(m.plan)mr='<div class="car-fila car-total"><span>Al mes</span><b class="num">'+pesos(m.plan.precio)+'</b></div>';
   else mr='<p class="car-empuje">Estas apps no forman un paquete: cada una se contrata con su propio cobro mensual.</p>';
   (m.sugerencias||[]).forEach(function(s){mr+='<div class="car-paq"><p>Agrega <b>'+s.faltan.map(function(x){return e(x.nombre);}).join(' y ')+'</b> y llévate <b>'+e(s.paquete)+'</b> en '+pesos(s.precio)+' al mes (por separado serían '+pesos(s.separado)+').</p><button type="button" class="btn blanco chico" data-agrega-m=\\''+e(JSON.stringify(s.faltan.map(function(x){return {s:x.slug,a:x.app};})))+'\\'>Agregar</button></div>';});
   mr+='<p class="car-nota">Se renueva sola cada mes y la cancelas cuando quieras. Se paga con tarjeta, aparte de lo de pago único. Sucursales o profesionales de más los sumas después desde la app.</p>';}
  else $('car-mes-lista').innerHTML='';
  $('car-mes-res').innerHTML=mr;
  // botones de pago y condiciones
  var bs='';if(d.items.length)bs+='<button class="btn acento" type="submit" data-pago="unico">Pagar '+pesos(d.total)+' '+FL+'</button>';
  if(m&&m.plan)bs+='<button class="btn '+(d.items.length?'blanco':'acento')+'" type="submit" data-pago="'+e(m.plan.slug)+'" data-apps="'+e(m.items.map(function(x){return x.slug;}).join(','))+'">Contratar '+pesos(m.plan.precio)+' al mes '+FL+'</button>';
  else if(m)m.items.forEach(function(x){bs+='<button class="btn blanco" type="submit" data-pago="'+e(x.slug)+'" data-apps="'+e(x.slug)+'">Contratar '+e(x.nombre)+' · '+pesos(x.precio)+' al mes</button>';});
  $('car-btns').innerHTML=bs;$('car-cod').hidden=!d.items.length;
  $('car-leg').innerHTML=m&&m.items.length?', las condiciones de '+m.legales.map(function(l){return '<a href="'+e(l.url)+'" target="_blank">'+e(l.nombre)+'</a>';}).join(' y ')+' (incluida la renovación automática)':'';
  $('car-pie').textContent=d.items.length&&m&&m.items.length?'Pago protegido con Stripe. Lo de pago único: tarjeta u OXXO. La mensualidad: tarjeta.':m&&m.items.length?'Pago protegido con Stripe · tarjeta de crédito o débito.':'Pago protegido con Stripe · tarjeta u OXXO. ¿Es para regalar? Compra cada producto desde su página con «Para regalar».';
  sug(d.sugerencias||[]);
 }).catch(function(){err.textContent='No pudimos cargar tu carrito. Recarga la página.';err.hidden=false;});}
var FL='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function sug(l){var s=$('car-sug');s.hidden=!l.length;$('car-sug-l').innerHTML=l.map(function(x){return '<li><a class="car-sg-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'')+'</a><div><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+pesos(x.precio)+'</span></div><button type="button" class="btn blanco chico" data-agrega="'+e(x.slug)+'" data-app="'+e(x.app)+'">Agregar</button></li>';}).join('');}
function suma(n){var v=lee();n.forEach(function(x){v=v.filter(function(y){return y.a!==x.a;});v.push(x);});guarda(v);pinta();}
document.addEventListener('click',function(ev){var q=ev.target.closest('.car-quita');if(q){guarda(lee().filter(function(x){return x.s!==q.dataset.s;}));pinta();return;}
 var a=ev.target.closest('[data-agrega]');if(a){suma([{s:a.dataset.agrega,a:a.dataset.app}]);return;}
 var b=ev.target.closest('[data-agrega-m]');if(b){try{suma(JSON.parse(b.getAttribute('data-agrega-m')).map(function(x){x.m=1;return x;}));}catch(e){}}});
f.addEventListener('submit',function(ev){ev.preventDefault();err.hidden=true;if(!datos)return;
 var b=ev.submitter&&ev.submitter.dataset.pago?ev.submitter:f.querySelector('[data-pago]');if(!b)return;
 if(!f.nombre.value||f.nombre.value.trim().length<2){f.nombre.focus();err.textContent='Escribe tu nombre.';err.hidden=false;return;}
 if(!f.email.checkValidity()||!f.email.value){f.email.focus();err.textContent='Escribe un correo válido.';err.hidden=false;return;}
 if(!f.terminos.checked){err.textContent='Debes aceptar los términos y el aviso de privacidad.';err.hidden=false;return;}
 var unico=b.dataset.pago==='unico',fd=new FormData(f),txt=b.innerHTML;b.disabled=true;b.textContent='Abriendo el pago…';
 var cuerpo=unico?{carrito:true,items:datos.items.map(function(x){return {slug:x.slug,cantidad:1};}),codigo:fd.get('codigo')||''}:{slug:b.dataset.pago};
 cuerpo.nombre=fd.get('nombre');cuerpo.email=fd.get('email');cuerpo.terminos=true;
 var pagados=unico?datos.items.map(function(x){return x.slug;}):b.dataset.apps.split(',');
 fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(cuerpo)})
 .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});}).then(function(x){if(x.ok&&x.j.url){try{sessionStorage.setItem('vorka_carrito_pago',JSON.stringify(pagados));}catch(e){}location.href=x.j.url;return;}
  err.textContent=(x.j&&x.j.error)||'No pudimos abrir el pago. Intenta de nuevo.';err.hidden=false;b.disabled=false;b.innerHTML=txt;}).catch(function(){err.textContent='No pudimos abrir el pago. Revisa tu conexión.';err.hidden=false;b.disabled=false;b.innerHTML=txt;});});
pinta();})();`;

const CSS_PAGINA = `<style>
.car-sec{padding:clamp(18px,4vw,48px) 0 clamp(48px,6vw,80px)}
.car-cols{display:grid;gap:22px;margin-top:22px}@media(min-width:900px){.car-cols{grid-template-columns:1.25fr 1fr;align-items:start}}
.car-izq{display:grid;gap:22px;align-content:start}
.car-caja{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px;box-shadow:var(--sombra)}
.car-h{font-size:17px;letter-spacing:-.01em;margin:0 0 14px}.car-h small{font-weight:500;color:var(--fg-2);font-size:14px}
.car-lista{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.car-it{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center}
.car-img{display:block;width:64px;height:48px;border-radius:10px;overflow:hidden;background:var(--bg-2,var(--line))}
.car-img img{width:100%;height:100%;object-fit:cover}.car-img span{display:grid;place-items:center;height:100%;font-weight:800}
.car-tx{min-width:0;display:grid}.car-tx a{color:inherit;text-decoration:none}.car-tx b{font-size:15.5px;line-height:1.3}.car-tx span{font-size:14px;color:var(--fg-2)}
.car-quita{font:inherit;font-size:13.5px;color:var(--fg-2);background:none;border:0;padding:8px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
#car-res:not(:empty),#car-mes-res:not(:empty){margin-top:14px;border-top:1px solid var(--line);padding-top:6px}
.car-fila{display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:15.5px}.car-fila small{font-size:14px;font-weight:600}
.car-ahorro{color:var(--ok,#1F7A4A);font-weight:650}.car-total{font-size:17px}.car-total b{font-size:21px;white-space:nowrap}
.car-empuje{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--bg-2,rgba(0,0,0,.04));font-size:14.5px}.car-empuje.ok{color:var(--ok,#1F7A4A)}
.car-paq{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-top:10px;padding:12px;border-radius:12px;border:1.5px dashed var(--line-2,var(--line));font-size:14.5px}.car-paq p{margin:0}
.car-nota{margin:12px 0 0;font-size:13.5px;color:var(--fg-2);line-height:1.5}
.car-vacio{display:none;text-align:center;padding:22px 8px}.car.vacio .car-vacio{display:block}.car.vacio .car-cols{display:none}
.car-sug{margin-top:34px}.car-sug ul{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.car-sug li{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px}
.car-sg-img{display:block;width:56px;height:42px;border-radius:8px;overflow:hidden;background:var(--line)}.car-sg-img img{width:100%;height:100%;object-fit:cover}
.car-sug li div{min-width:0;display:grid}.car-sug li a{color:inherit;text-decoration:none}.car-sug li b{font-size:14.5px;line-height:1.3}.car-sug li span{font-size:13.5px;color:var(--fg-2)}
#car-form{background:none;border:0;padding:0;box-shadow:none;margin:0!important}
#car-btns{display:grid;gap:10px;margin-top:6px}#car-btns .btn{width:100%;justify-content:center}
</style>`;

export async function paginaCarrito(env) {
  return pagina({
    titulo: 'Tu carrito · Tienda Vorka México', ruta: '/tienda/carrito/', noindex: true,
    descripcion: 'Junta tus simuladores y tests en una sola compra (15 % menos al llevar 2 y 25 % al llevar 3 o más) y las apps de tu negocio con precio de paquete.',
    head: CSS_PAGINA,
    script: SCRIPT_PAGINA,
    cuerpo: `<section class="car-sec"><div class="marco">
  <h1 class="t-h1">Tu carrito</h1>
  <p class="t-lead" style="margin-top:10px">Al llevar 2 productos de pago único te descontamos <b>15 %</b>, y al llevar 3 o más, <b>25 %</b>. Si juntas apps para tu negocio que forman paquete, pagas el precio del paquete. Todo se aplica solo.</p>
  <div class="car vacio" id="car">
    <div class="car-vacio car-caja"><p style="margin:0 0 14px">Tu carrito está vacío.</p><a class="btn acento" href="/tienda/#productos">Ver el catálogo ${FLECHA}</a></div>
    <div class="car-cols">
      <div class="car-izq">
        <div class="car-caja" id="car-unico" hidden><h2 class="car-h">Pago único</h2><ul class="car-lista" id="car-lista"></ul><div id="car-res"></div></div>
        <div class="car-caja" id="car-mes" hidden><h2 class="car-h">Mensualidad <small>· apps para tu negocio</small></h2><ul class="car-lista" id="car-mes-lista"></ul><div id="car-mes-res"></div></div>
      </div>
      <div class="car-caja">
        <form class="t-form" id="car-form" novalidate hidden>
          <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
          <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega el acceso a todo lo que compres. Si ya probaste una app, usa el mismo correo.</small></div>
          <div class="t-campo" id="car-cod"><label for="codigo">Código de descuento <small>(opcional)</small></label><input id="codigo" name="codigo" type="text" maxlength="40" autocapitalize="characters"><small class="t-ayuda">Si tu código da más que el descuento del carrito, se aplica el mayor. No se suman.</small></div>
          <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a><span id="car-leg"></span> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
          <p class="t-error" id="car-error" role="alert" hidden></p>
          <div id="car-btns"></div>
          <p class="t-pago" id="car-pie" style="margin-top:10px;font-size:13.5px;color:var(--fg-2)"></p>
        </form>
      </div>
    </div>
  </div>
  <section class="car-sug" id="car-sug" hidden><h2 class="h2">Completa tu preparación</h2><ul id="car-sug-l"></ul></section>
</div></section>`,
  });
}
