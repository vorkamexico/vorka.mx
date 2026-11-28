// Carrito de la tienda (nov 2026, decisión del dueño): TODO lo de Vorka se puede juntar en el carrito y los descuentos salen solos.
//   · Pago único (simuladores, tests, liderazgo, Ruta, Brindi, Cupo…): una sola compra; 2 productos → 15 %, 3 o más → 25 %.
//     Uno por producto: dos planes del mismo producto cuentan como uno (el último manda).
//   · Suscripciones (Agenda, Vuelve, Brillo, Mostrador, Vende, Clara, Cuentas, Portales, Academias, página web, Negocio
//     Completo, app a la medida; mensual o anual): cada una es su propio cobro en Stripe. Si las apps mensuales que juntas son
//     justo las de un paquete más barato (Agenda + Vuelve, Mostrador + Vuelve, Brillo + Vuelve + Agenda, página + Agenda +
//     Vuelve = Negocio Completo), se contrata el paquete. Si te falta una app para un paquete que conviene, se sugiere.
//     Un plan que cubre una app ya en el carrito la reemplaza (Agenda + Vuelve reemplaza a Agenda sola).
//   · Lo de pago único y cada suscripción se pagan por separado (botón por cobro); al volver de pagar, /tienda/gracias quita
//     solo lo pagado y, si queda algo, invita a seguir (carrito-global.js).
//   · GET /api/carrito?s=slug,slug → lo de pago único con su descuento, las suscripciones con sus cobros, y sugerencias.
//   · /tienda/carrito/ → la página (los productos viven en localStorage del navegador: vorka_carrito).
import { json, all, one } from './util.js';
import { pagina } from './paginas.js';
import { listarProductos, productoPorSlug, VENDIBLE } from './modelo.js';
import { FLECHA } from './marco.generado.js';

export const CARRITO = { codigo: 'CARRITO', dos: 15, tres: 25, max: 12 };
// Las sugerencias de «Completa tu preparación» salen de aquí
const CATEGORIAS = ['Exámenes', 'Educación', 'Proyectos sociales'];
// Brindi: lo que se le agrega a una invitación que ya existe no va al carrito (se compra desde la invitación)
const ACCESORIOS_BRINDI = ['mejora', 'extension', 'musica', 'album', 'plantilla_premium', 'invitados', 'servicio'];
// Planes ocultos del catálogo que sí se eligen en su página (Brindi Íntimo, Esencial, Premium; Cupo por aforo)
const OCULTOS_OK = ['brindi', 'cupo'];

// ¿Entra como pago único?
export function enCarrito(p) {
  if (!p || p.creador_id) return false;
  const c = p.contenido || {}, t = c.acceso?.tipo, app = c.acceso?.app;
  if (c.suscripcion || c.complemento || c.instalacion_de || c.regalo_de) return false;
  if (['intento', 'examen', 'grupo'].includes(t)) return false;            // adicionales de simulador y licencias para escuelas
  if (app === 'brindi' && ACCESORIOS_BRINDI.includes(t)) return false;
  if (/^simuladores-/.test(p.slug) || /-grupo-\d+$/.test(p.slug)) return false;   // paquetes viejos de simuladores
  return !c.oculto || OCULTOS_OK.includes(app);
}
// Un lugar por producto: los planes de un simulador comparten app
export const grupoCarrito = p => p.contenido?.acceso?.app || p.slug;
export const pctCarrito = n => (n >= 3 ? CARRITO.tres : n >= 2 ? CARRITO.dos : 0);
export function descuentoCarrito(prods) {
  const n = new Set(prods.map(grupoCarrito)).size, pct = pctCarrito(n);
  return pct ? { tipo: 'carrito', codigo: CARRITO.codigo, pct, meses: null, app: null, texto: `Por llevar ${n} productos: ${pct} % menos` } : null;
}

// ---------- Suscripciones ----------
export function enSuscripcion(p) {
  if (!p || p.creador_id) return false;
  const c = p.contenido || {};
  return !!c.suscripcion && !c.complemento && !c.instalacion_de && !!c.acceso?.app;
}
// Las apps que abre un plan (Negocio Completo también trae la página web)
const cubre = c => [...(c.acceso.apps || [c.acceso.app]), ...(c.acceso.pagina ? ['pagina-web'] : [])];
// Condiciones de cada app (las que su página pide aceptar)
const LEGAL = { agenda: ['Agenda', '/legal/agenda/'], vuelve: ['Vuelve', '/legal/vuelve/'], mostrador: ['Vuelve', '/legal/vuelve/'], academias: ['Vuelve', '/legal/vuelve/'],
  brillo: ['Brillo', '/legal/brillo/'], vende: ['Vende', '/legal/vende/'], clara: ['Clara', '/legal/clara/'], cuentas: ['Cuentas', '/legal/cuentas/'],
  'pagina-web': ['tu página web (plan de 12 meses)', '/servicios/pagina-web/#t-cond'], brindi: ['Brindi', '/legal/brindi/'], cupo: ['Cupo', '/legal/cupo/'] };
// Apps que combinan bien (aunque no haya paquete): [app, por qué en una línea]
const COMBINA = {
  agenda: [['vuelve', 'Quien ya reservó contigo regresa más seguido si junta sellos en su celular.']],
  vuelve: [['agenda', 'Tus clientes reservan solos a cualquier hora y les llega recordatorio: menos faltas.']],
  brillo: [['vuelve', 'Tus clientas juntan sellos en su celular y vuelven más seguido; tú les mandas promociones sin imprimir nada.'], ['agenda', 'Tus clientas reservan solas a cualquier hora y les llega recordatorio: menos huecos en tu día.']],
  mostrador: [['vuelve', 'Cada compra suma sellos o puntos y tus clientes regresan por su premio.']],
  academias: [['agenda', 'Los papás agendan la clase muestra solos y les llega recordatorio; tú solo confirmas.']],
  'pagina-web': [['agenda', 'Desde tu página reservan su cita sin escribirte.'], ['vuelve', 'Quien te encuentra en Google regresa si junta sellos.']],
};
// El plan mensual más barato de cada app, para sugerirla cuando completa un paquete
const BASE_MENSUAL = { agenda: 'agenda-mensual', vuelve: 'vuelve-mensual', brillo: 'brillo-basico-mensual', mostrador: 'mostrador-mensual', 'pagina-web': 'pagina-web-mensual' };
// Atributo para el formulario de compra de un producto: {slug: grupo} de sus opciones que entran al carrito
export const attrPlanesCarrito = prods => { const m = {}, n = {};
  for (const p of prods) if (p && (enSuscripcion(p) || enCarrito(p))) { m[p.slug] = grupoCarrito(p); n[p.slug] = enSuscripcion(p) ? nombreSus(p) : nombreCorto(p); }
  const a = o => JSON.stringify(o).replace(/'/g, '&#39;').replace(/</g, '\\u003c');
  return Object.keys(m).length ? ` data-carrito-planes='${a(m)}' data-carrito-nombres='${a(n)}'` : ''; };

const mismas = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const nombreSus = p => String(p.nombre).replace(/ · (plan|paquete) (mensual|anual)$/, '').replace(/ (mensual|anual)$/, '').replace(/ · plan$/, '');
async function itemSus(env, p) {
  const s = p.contenido.suscripcion, anual = s.intervalo === 'year';
  const inst = s.instalacion_obligatoria && s.instalacion ? await one(env, 'SELECT precio_centavos FROM products WHERE id = ? AND activo = 1', s.instalacion) : null;
  return { slug: p.slug, app: p.contenido.acceso.app, cubre: cubre(p.contenido), nombre: nombreSus(p), precio: p.precio_centavos, anual, cada: anual ? 'al año' : 'al mes',
    instalacion: inst?.precio_centavos || 0, imagen: p.imagen || null, ruta: p.contenido.acceso.ruta || `/tienda/${p.slug}/` };
}
// Paquetes mensuales a la venta (ocultos del catálogo, por eso no salen de listarProductos)
async function paquetesMensuales(env) {
  const rs = await all(env, `SELECT p.slug, p.nombre, p.precio_centavos, p.contenido FROM products p WHERE ${VENDIBLE} AND p.creador_id IS NULL`);
  return rs.map(r => { let c; try { c = JSON.parse(r.contenido || '{}'); } catch { c = {}; } return { ...r, c }; })
    .filter(r => r.c.suscripcion?.intervalo === 'month' && !r.c.complemento && (Array.isArray(r.c.acceso?.apps) || r.c.acceso?.pagina))
    .map(r => ({ slug: r.slug, nombre: nombreSus(r), precio: r.precio_centavos, cubre: cubre(r.c) }));
}

// items (sin apps repetidas) → los cobros: un paquete si conviene, si no uno por suscripción; y la sugerencia de paquete
export async function resolverSuscripciones(env, items) {
  if (!items.length) return null;
  const sueltas = items.every(x => !x.anual && x.cubre.length === 1);
  const apps = items.flatMap(x => x.cubre), suma = items.reduce((t, x) => t + x.precio, 0);
  const paquetes = sueltas ? await paquetesMensuales(env) : [];
  const paq = items.length > 1 && paquetes.filter(k => mismas(k.cubre, apps) && k.precio < suma).sort((a, b) => a.precio - b.precio)[0];
  const cobros = paq ? [{ slug: paq.slug, nombre: paq.nombre, precio: paq.precio, cada: 'al mes', instalacion: 0, paga: items.map(x => x.slug), ahorro: suma - paq.precio, separado: suma }]
    : items.map(x => ({ slug: x.slug, nombre: x.nombre, precio: x.precio, cada: x.cada, instalacion: x.instalacion, paga: [x.slug], ahorro: 0 }));
  if (paq) { const p = await productoPorSlug(env, paq.slug); const i = p && await itemSus(env, p); if (i?.instalacion) cobros[0].instalacion = i.instalacion; }
  let sugerencia = null;
  if (sueltas && !paq) for (const k of paquetes) {
    if (!apps.every(a => k.cubre.includes(a)) || mismas(k.cubre, apps)) continue;
    const faltan = [];
    for (const a of k.cubre.filter(a => !apps.includes(a))) { const p = BASE_MENSUAL[a] && await productoPorSlug(env, BASE_MENSUAL[a]); if (p && enSuscripcion(p)) faltan.push(await itemSus(env, p)); }
    if (faltan.length !== k.cubre.length - apps.length) continue;
    const separado = suma + faltan.reduce((t, x) => t + x.precio, 0), ahorro = separado - k.precio;
    if (ahorro > 0 && (!sugerencia || ahorro > sugerencia.ahorro)) sugerencia = { paquete: k.nombre, precio: k.precio, ahorro, faltan: faltan.map(x => ({ s: x.slug, a: x.app, nombre: x.nombre })) };
  }
  // «Combina bien»: apps que suelen ir juntas aunque no haya paquete (Brillo + Vuelve), con el porqué en una línea
  const combina = [];
  if (!sugerencia) for (const a of [...new Set(apps.flatMap(x => COMBINA[x] || []))]) {
    const [app, porque] = a; if (apps.includes(app) || combina.length >= 2 || combina.some(c => c.a === app)) continue;
    const p = BASE_MENSUAL[app] && await productoPorSlug(env, BASE_MENSUAL[app]);
    if (p && enSuscripcion(p)) { const i = await itemSus(env, p); combina.push({ s: i.slug, a: i.app, nombre: i.nombre, precio: i.precio, cada: i.cada, porque, imagen: i.imagen }); }
  }
  return { items, cobros, sugerencia, combina };
}

// Paquetes que salen más baratos que cada app por separado, para mostrarlos en «Para tu negocio» (un toque los agrega)
export async function combosNegocio(env) {
  const out = [];
  for (const k of await paquetesMensuales(env)) {
    const ps = await Promise.all(k.cubre.map(a => BASE_MENSUAL[a] ? productoPorSlug(env, BASE_MENSUAL[a]) : null));
    if (ps.some(p => !p || !enSuscripcion(p))) continue;
    const separado = ps.reduce((t, p) => t + p.precio_centavos, 0);
    if (k.precio < separado) out.push({ nombre: k.nombre, precio: k.precio, separado, ahorro: separado - k.precio, items: ps.map(p => ({ s: p.slug, a: p.contenido.acceso.app, m: 1 })) });
  }
  return out.sort((a, b) => a.precio - b.precio);
}

export const nombreCorto = p => corto(p);
const corto = p => String(p.nombre).replace(/ · Completo \(práctica \+ examen\)$/, ' · Completo').replace(/ · Reporte completo$/, '');
const item = p => ({ slug: p.slug, app: grupoCarrito(p), nombre: corto(p), precio: p.precio_centavos, imagen: p.imagen || null, ruta: p.contenido?.acceso?.ruta || `/tienda/${p.slug}/` });

// Sugerencias: un producto por app (de los simuladores, su plan Completo), los que no están ya en el carrito
async function sugerencias(env, apps) {
  const ps = (await listarProductos(env)).filter(p => enCarrito(p) && CATEGORIAS.includes(p.categoria));
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
  const items = [], fuera = [], quitados = [], apps = new Set(), subs = [];
  for (const s of slugs) {
    const p = await productoPorSlug(env, s);
    if (enSuscripcion(p)) {
      // un plan que abre una app que ya estaba la reemplaza (el último que eligió manda)
      const x = await itemSus(env, p);
      for (let i = subs.length - 1; i >= 0; i--) if (subs[i].cubre.some(a => x.cubre.includes(a))) quitados.push(subs.splice(i, 1)[0].slug);
      subs.push(x); continue;
    }
    if (!enCarrito(p)) { fuera.push(s); continue; }
    const a = grupoCarrito(p);
    if (apps.has(a)) { const i = items.findIndex(x => x.app === a); quitados.push(items.splice(i, 1)[0].slug); }
    apps.add(a); items.push(item(p));
  }
  const subtotal = items.reduce((t, x) => t + x.precio, 0), pct = pctCarrito(items.length);
  const descuento = Math.round(subtotal * pct / 100);
  const susc = await resolverSuscripciones(env, subs);
  const legales = [...new Map([...items.map(x => x.app), ...subs.flatMap(x => x.cubre)].filter(a => LEGAL[a]).map(a => [LEGAL[a][1], { nombre: LEGAL[a][0], url: LEGAL[a][1] }])).values()];
  return json({ items, fuera, quitados, subtotal, pct, descuento, total: subtotal - descuento,
    siguiente: !items.length || items.length >= 3 ? null : { faltan: items.length >= 2 ? 1 : 2 - items.length, pct: items.length >= 2 ? CARRITO.tres : CARRITO.dos },
    sugerencias: items.length ? await sugerencias(env, apps) : [], suscripciones: susc, legales },
    200, { 'cache-control': 'no-store' });
}

// ---------- página /tienda/carrito/ ----------
// Lo de pago único y las suscripciones en cajas separadas; un solo formulario con los datos y un botón por cobro. Al pagar,
// /tienda/gracias quita del carrito solo lo pagado (sessionStorage vorka_carrito_pago = los slugs) y ofrece seguir.
const SCRIPT_PAGINA = `(function(){
var K='vorka_carrito',D='vorka_carrito_datos',raiz=document.getElementById('car'),f=document.getElementById('car-form'),err=document.getElementById('car-error');
function lee(){try{var v=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function guarda(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}document.dispatchEvent(new Event('vorka:carrito'));}
function pesos(c){var d=c%100?2:0;return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});}
function e(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(i){return document.getElementById(i);}
var FL='<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function fila(x,precio,nota){return '<li class="car-it"><a class="car-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'<span>'+e(x.nombre.charAt(0))+'</span>')+'</a><div class="car-tx"><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+precio+'</span>'+(nota?'<small>'+nota+'</small>':'')+'</div><button type="button" class="car-quita" data-s="'+e(x.slug)+'" aria-label="Quitar '+e(x.nombre)+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></li>';}
try{var dd=JSON.parse(localStorage.getItem(D)||'null');if(dd){f.nombre.value=dd.n||'';f.email.value=dd.e||'';}}catch(x){}
var datos=null;
function pinta(){var v=lee();if(!v.length){raiz.className='car vacio';f.hidden=true;sug([]);return;}
 fetch('/api/carrito?s='+encodeURIComponent(v.map(function(x){return x.s;}).join(','))).then(function(r){return r.json();}).then(function(d){datos=d;
  var fuera=(d.fuera||[]).concat(d.quitados||[]);if(fuera.length)guarda(v.filter(function(x){return fuera.indexOf(x.s)<0;}));
  var S=d.suscripciones,hay=d.items.length||S;raiz.className='car'+(hay?'':' vacio');f.hidden=!hay;
  $('car-unico').hidden=!d.items.length;$('car-lista').innerHTML=d.items.map(function(x){return fila(x,pesos(x.precio));}).join('');
  var r='';if(d.items.length){if(d.pct)r+='<div class="car-fila"><span>Subtotal</span><span class="num">'+pesos(d.subtotal)+'</span></div><div class="car-fila car-ok"><span>'+d.pct+' % menos por llevar '+d.items.length+'</span><span class="num">−'+pesos(d.descuento)+'</span></div>';
   r+='<div class="car-fila car-total"><span>Total</span><b class="num">'+pesos(d.total)+' <small>MXN</small></b></div>';
   if(d.siguiente)r+='<p class="car-tip">Suma '+(d.siguiente.faltan===1?'1 producto más':d.siguiente.faltan+' productos')+' y te descontamos '+d.siguiente.pct+' %.</p>';}
  $('car-res').innerHTML=r;
  $('car-sus').hidden=!S;var m='';
  if(S){$('car-sus-lista').innerHTML=S.items.map(function(x){return fila(x,pesos(x.precio)+' '+x.cada,x.instalacion?'+ '+pesos(x.instalacion)+' una sola vez':'');}).join('');
   var p=S.cobros.length===1&&S.cobros[0].ahorro?S.cobros[0]:null;
   if(p)m+='<p class="car-paq car-verde"><b>Juntas como '+e(p.nombre)+':</b> '+pesos(p.precio)+' al mes. Ahorras '+pesos(p.ahorro)+' cada mes.</p>';
   if(S.sugerencia){var g=S.sugerencia;m+='<div class="car-paq"><p>Suma <b>'+g.faltan.map(function(x){return e(x.nombre);}).join(' y ')+'</b> y llévate '+e(g.paquete)+' por '+pesos(g.precio)+' al mes: '+pesos(g.ahorro)+' menos que por separado.</p><button type="button" class="btn blanco chico" data-agrega-m="'+e(JSON.stringify(g.faltan.map(function(x){return {s:x.s,a:x.a,m:1};})))+'">Sumar</button></div>';}
   m+='<p class="car-tip">Se renueva sola y la cancelas cuando quieras.</p>';}
  $('car-sus-res').innerHTML=m;
  // un botón por cobro
  var bs=[];if(d.items.length)bs.push({k:'unico',t:'Pagar '+pesos(d.total)});
  if(S)S.cobros.forEach(function(c){bs.push({k:c.slug,paga:c.paga.join(','),t:'Contratar '+(S.cobros.length>1||d.items.length?e(c.nombre)+' · ':'')+pesos(c.precio)+' '+c.cada});});
  $('car-btns').innerHTML=bs.map(function(b,i){return '<button class="btn '+(i?'blanco':'acento')+'" type="submit" data-pago="'+e(b.k)+'"'+(b.paga?' data-paga="'+e(b.paga)+'"':'')+'>'+b.t+(i?'':' '+FL)+'</button>';}).join('');
  $('car-varios').hidden=bs.length<2;$('car-cod').hidden=!d.items.length;
  $('car-leg').innerHTML=(d.legales||[]).length?', las condiciones de '+d.legales.map(function(l){return '<a href="'+e(l.url)+'" target="_blank">'+e(l.nombre)+'</a>';}).join(', ')+(S?' (con renovación automática)':''):'';
  $('car-pie').textContent=d.items.length&&S?'Pago protegido con Stripe. Pago único con tarjeta u OXXO; suscripciones con tarjeta.':S?'Pago protegido con Stripe · tarjeta de crédito o débito.':'Pago protegido con Stripe · tarjeta u OXXO.';
  sug(d.sugerencias||[]);
 }).catch(function(){err.textContent='No pudimos cargar tu carrito. Recarga la página.';err.hidden=false;});}
function sug(l){var s=$('car-sug');s.hidden=!l.length;$('car-sug-l').innerHTML=l.slice(0,4).map(function(x){return '<li><a class="car-sg-img" href="'+e(x.ruta)+'">'+(x.imagen?'<img src="'+e(x.imagen)+'" alt="" loading="lazy">':'')+'</a><div><a href="'+e(x.ruta)+'"><b>'+e(x.nombre)+'</b></a><span class="num">'+pesos(x.precio)+'</span></div><button type="button" class="btn blanco chico" data-agrega="'+e(x.slug)+'" data-app="'+e(x.app)+'">Agregar</button></li>';}).join('');}
function suma(n){var v=lee();n.forEach(function(x){v=v.filter(function(y){return y.a!==x.a;});v.push(x);});guarda(v);pinta();}
document.addEventListener('click',function(ev){var q=ev.target.closest('.car-quita');if(q){guarda(lee().filter(function(x){return x.s!==q.dataset.s;}));pinta();return;}
 var a=ev.target.closest('[data-agrega]');if(a){suma([{s:a.dataset.agrega,a:a.dataset.app}]);return;}
 var b=ev.target.closest('[data-agrega-m]');if(b){try{suma(JSON.parse(b.getAttribute('data-agrega-m')));}catch(x){}}});
f.addEventListener('submit',function(ev){ev.preventDefault();err.hidden=true;if(!datos)return;
 var b=ev.submitter&&ev.submitter.dataset.pago?ev.submitter:f.querySelector('[data-pago]');if(!b)return;
 function mal(m,c){err.textContent=m;err.hidden=false;if(c)c.focus();}
 if(!f.nombre.value||f.nombre.value.trim().length<2)return mal('Escribe tu nombre.',f.nombre);
 if(!f.email.checkValidity()||!f.email.value)return mal('Escribe un correo válido.',f.email);
 if(!f.terminos.checked)return mal('Acepta los términos para seguir.');
 try{localStorage.setItem(D,JSON.stringify({n:f.nombre.value.trim(),e:f.email.value.trim()}));}catch(x){}
 var unico=b.dataset.pago==='unico',txt=b.innerHTML;b.disabled=true;b.textContent='Abriendo el pago…';
 var c=unico?{carrito:true,items:datos.items.map(function(x){return {slug:x.slug,cantidad:1};}),codigo:f.codigo.value||''}:{slug:b.dataset.pago};
 c.nombre=f.nombre.value.trim();c.email=f.email.value.trim();c.terminos=true;
 var pagados=unico?datos.items.map(function(x){return x.slug;}):b.dataset.paga.split(',');
 fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)})
 .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});}).then(function(x){if(x.ok&&x.j.url){try{sessionStorage.setItem('vorka_carrito_pago',JSON.stringify(pagados));}catch(y){}location.href=x.j.url;return;}
  mal((x.j&&x.j.error)||'No pudimos abrir el pago. Intenta de nuevo.');b.disabled=false;b.innerHTML=txt;}).catch(function(){mal('No pudimos abrir el pago. Revisa tu conexión.');b.disabled=false;b.innerHTML=txt;});});
pinta();})();`;

const CSS_PAGINA = `<style>
.car-sec{padding:clamp(18px,4vw,48px) 0 clamp(48px,6vw,80px)}
.car-cols{display:grid;gap:18px;margin-top:22px}@media(min-width:900px){.car-cols{grid-template-columns:1.3fr 1fr;align-items:start;gap:24px}}
.car-izq{display:grid;gap:18px;align-content:start}
.car-caja{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px}
.car-h{font-size:16px;letter-spacing:-.01em;margin:0 0 14px;font-weight:750}
.car-lista{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.car-it{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center}
.car-img{display:block;width:60px;height:45px;border-radius:10px;overflow:hidden;background:var(--bg-2,var(--line))}
.car-img img{width:100%;height:100%;object-fit:cover}.car-img span{display:grid;place-items:center;height:100%;font-weight:800}
.car-tx{min-width:0;display:grid;gap:1px}.car-tx a{color:inherit;text-decoration:none}.car-tx b{font-size:15.5px;line-height:1.3}.car-tx span{font-size:14.5px;color:var(--fg-2)}.car-tx small{font-size:13px;color:var(--fg-2)}
.car-quita{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:var(--fg-2);background:none;border:0;cursor:pointer}.car-quita:hover{background:var(--bg-2,rgba(0,0,0,.05));color:var(--fg)}
#car-res:not(:empty),#car-sus-res:not(:empty){margin-top:14px;border-top:1px solid var(--line);padding-top:6px}
.car-fila{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:15px}
.car-ok{color:var(--ok,#1F7A4A);font-weight:650}.car-total{font-size:16px;padding-top:8px}.car-total b{font-size:22px;letter-spacing:-.01em}.car-total small{font-size:13px;font-weight:600;color:var(--fg-2)}
.car-tip{margin:8px 0 0;font-size:14px;color:var(--fg-2)}
.car-paq{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:10px 0 0;padding:12px 14px;border-radius:14px;background:var(--bg-2,rgba(0,0,0,.04));font-size:14.5px;line-height:1.45}.car-paq p{margin:0}
.car-paq.car-verde{display:block;background:color-mix(in srgb,var(--ok,#1F7A4A) 10%,transparent);color:var(--fg)}
.car-vacio{display:none;text-align:center;padding:28px 8px}.car.vacio .car-vacio{display:block}.car.vacio .car-cols{display:none}
.car-sug{margin-top:34px}.car-sug ul{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.car-sug li{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px}
.car-sg-img{display:block;width:56px;height:42px;border-radius:8px;overflow:hidden;background:var(--line)}.car-sg-img img{width:100%;height:100%;object-fit:cover}
.car-sug li div{min-width:0;display:grid}.car-sug li a{color:inherit;text-decoration:none}.car-sug li b{font-size:14.5px;line-height:1.3}.car-sug li span{font-size:13.5px;color:var(--fg-2)}
#car-form{background:none;border:0;padding:0;box-shadow:none;margin:0!important}
#car-btns{display:grid;gap:10px;margin-top:4px}#car-btns .btn{width:100%;justify-content:center}
.car-varios{margin:10px 0 0;font-size:13.5px;color:var(--fg-2);text-align:center}
</style>`;

export async function paginaCarrito(env) {
  return pagina({
    titulo: 'Tu carrito · Tienda Vorka México', ruta: '/tienda/carrito/', noindex: true,
    descripcion: 'Junta lo que quieras de la tienda Vorka: los descuentos se aplican solos.',
    head: CSS_PAGINA,
    script: SCRIPT_PAGINA,
    cuerpo: `<section class="car-sec"><div class="marco">
  <h1 class="t-h1">Tu carrito</h1>
  <p class="t-lead" style="margin-top:8px">Los descuentos se aplican solos: 15 % al llevar 2 productos, 25 % al llevar 3 o más, y precio de paquete si juntas apps.</p>
  <div class="car vacio" id="car">
    <div class="car-vacio car-caja"><p style="margin:0 0 14px">Tu carrito está vacío.</p><a class="btn acento" href="/tienda/#productos">Ver la tienda ${FLECHA}</a></div>
    <div class="car-cols">
      <div class="car-izq">
        <div class="car-caja" id="car-unico" hidden><h2 class="car-h">Pago único</h2><ul class="car-lista" id="car-lista"></ul><div id="car-res"></div></div>
        <div class="car-caja" id="car-sus" hidden><h2 class="car-h">Suscripciones</h2><ul class="car-lista" id="car-sus-lista"></ul><div id="car-sus-res"></div></div>
      </div>
      <div class="car-caja">
        <form class="t-form" id="car-form" novalidate hidden>
          <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
          <div class="t-campo"><label for="email">Correo</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda">Aquí te llega todo. Si ya probaste una app, usa ese correo.</small></div>
          <div class="t-campo" id="car-cod"><label for="codigo">Código de descuento <small>(opcional)</small></label><input id="codigo" name="codigo" type="text" maxlength="40" autocapitalize="characters"></div>
          <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a><span id="car-leg"></span> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
          <p class="t-error" id="car-error" role="alert" hidden></p>
          <div id="car-btns"></div>
          <p class="car-varios" id="car-varios" hidden>Cada botón es un pago aparte. Al terminar uno, regresas aquí para el siguiente.</p>
          <p class="t-pago" id="car-pie" style="margin-top:10px;font-size:13px;color:var(--fg-2);text-align:center"></p>
        </form>
      </div>
    </div>
  </div>
  <section class="car-sug" id="car-sug" hidden><h2 class="h2">También te puede servir</h2><ul id="car-sug-l"></ul></section>
</div></section>`,
  });
}
