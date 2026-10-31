// Tests (vocacional y proyecto social) · piezas comunes: guardar y leer respuestas, ligarlas a una compra, abrir el
// reporte con la liga del correo, métricas del embudo y el formulario de compra en 1 paso.
import { one, all, run, aleatorio, ahoraISO, sha256, pesos } from '../util.js';
import { esc } from '../paginas.js';
import { validarToken } from '../descargas.js';
import { precio, CANDADO_PAGO } from '../tienda.js';
import { FLECHA } from '../marco.generado.js';

export const PRODUCTOS_TEST = {
  vocacional: { clave: 'vocacional', app: 'test-vocacional', slug: 'test-vocacional', ruta: '/test-vocacional/', nombre: 'Test vocacional Vorka', cookie: 'vorka_tv' },
  proyecto: { clave: 'proyecto', app: 'que-proyecto-social', slug: 'que-proyecto-social', ruta: '/que-proyecto-social/', nombre: '¿Qué proyecto social hago?', cookie: 'vorka_ps' },
};
export const APPS_TEST = Object.values(PRODUCTOS_TEST).map(x => x.app);
export const productoDeApp = app => Object.values(PRODUCTOS_TEST).find(x => x.app === app) || null;
export const ID = /^[a-f0-9]{32}$/;
export const TOKEN = /^[a-f0-9]{64}$/;
export const SIN_REFERER = { 'referrer-policy': 'no-referrer' };
export const COOKIE_DIAS = 30;

// ---------- respuestas ----------
export async function guardarResultado(env, { producto, respuestas, resumen, order_id = null, grupo_order_id = null, comparte_grupo = 0, email = null, nombre = null, consentimiento = 0 }) {
  const id = aleatorio(16);
  await run(env, `INSERT INTO tests_resultados (id, producto, respuestas, resumen, order_id, grupo_order_id, comparte_grupo, email, nombre, consentimiento) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    id, producto, JSON.stringify(respuestas || {}), JSON.stringify(resumen || {}), order_id, grupo_order_id, comparte_grupo ? 1 : 0, email, nombre, consentimiento ? 1 : 0);
  return id;
}
const parse = (t, d = {}) => { try { return JSON.parse(t || ''); } catch { return d; } };
export async function leerResultado(env, id, producto) {
  if (!ID.test(id || '')) return null;
  const f = await one(env, 'SELECT * FROM tests_resultados WHERE id = ? AND producto = ?', id, producto);
  return f && { ...f, respuestas: parse(f.respuestas), resumen: parse(f.resumen) };
}
export async function resultadoDeOrden(env, orderId, producto) {
  const f = await one(env, 'SELECT * FROM tests_resultados WHERE order_id = ? AND producto = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1', orderId, producto);
  return f && { ...f, respuestas: parse(f.respuestas), resumen: parse(f.resumen) };
}
export const contestado = f => !!f && Object.keys(f.respuestas || {}).length > 0;

// Al abrir el pago desde el resultado: la compra queda ligada a esas respuestas (si no estaban ya en otra compra pagada)
export async function ligarResultado(env, id, orderId, producto) {
  if (!ID.test(id || '')) return false;
  const r = await run(env, `UPDATE tests_resultados SET order_id = ?, updated_at = ? WHERE id = ? AND producto = ?
    AND (order_id IS NULL OR order_id NOT IN (SELECT id FROM orders WHERE estado = 'paid'))`, orderId, ahoraISO(), id, producto);
  return r.meta.changes > 0;
}

// ---------- descuento real por terminar: cupón de 1 uso, solo para el reporte, que vence en 24 h ----------
// Vive en cupones_regalo (el sistema de cupones de la tienda): el checkout lo valida, lo rechaza al vencer y cuenta su uso.
// Lote «auto-<app>» para distinguirlos en el panel de cupones. El código va en la página del resultado y en el correo.
export const CUPON_HORAS = 24;
export const CUPON_MONTO = { vocacional: 2000, proyecto: 4000 };   // $20 y $40 MXN
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const trozo = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => ALFABETO[b % ALFABETO.length]).join('');
export async function crearCupon(env, def, productId, resultadoId, ahora = Date.now()) {
  if (!productId) return null;
  const hasta = new Date(ahora + CUPON_HORAS * 3600e3).toISOString();
  for (let k = 0; k < 3; k++) {
    const codigo = `REGALO-${trozo(4)}-${trozo(4)}`;
    try {
      await run(env, `INSERT INTO cupones_regalo (codigo, lote, tipo, monto_centavos, alcance, product_id, max_usos, hasta, nota, creado_por) VALUES (?,?,'monto',?,'producto',?,1,?,?,'automatico')`,
        codigo, `auto-${def.app}`, CUPON_MONTO[def.clave], productId, hasta, `Descuento por terminar el test (${def.nombre}), 24 h`);
      await run(env, 'UPDATE tests_resultados SET cupon = ?, cupon_hasta = ?, updated_at = ? WHERE id = ?', codigo, hasta, ahoraISO(), resultadoId);
      return { codigo, hasta, monto: CUPON_MONTO[def.clave] };
    } catch (e) { if (!/UNIQUE|constraint/i.test(e.message)) { console.error('tests: cupón', e.message); return null; } }
  }
  return null;
}
// Vigente: no ha vencido, no se ha usado ni revocado
export async function cuponVigente(env, f, ahora = new Date().toISOString()) {
  if (!f?.cupon || !f.cupon_hasta || f.cupon_hasta <= ahora) return null;
  const c = await one(env, 'SELECT usos, max_usos, revocado_at, monto_centavos, hasta FROM cupones_regalo WHERE codigo = ?', f.cupon);
  if (!c || c.revocado_at || c.usos >= c.max_usos || c.hasta <= ahora) return null;
  return { codigo: f.cupon, hasta: c.hasta, monto: c.monto_centavos };
}
export const horaVence = iso => `${new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} (hora del centro de México)`;

// ---------- métricas del embudo (sin datos personales) ----------
const hoy = () => new Date().toISOString().slice(0, 10);
export const EVENTOS_CLIENTE = ['inicio', 'mitad'];
export async function contar(env, producto, evento) {
  try {
    await run(env, `INSERT INTO tests_metricas (dia, producto, evento, n) VALUES (?,?,?,1) ON CONFLICT (dia, producto, evento) DO UPDATE SET n = n + 1`, hoy(), producto, evento);
  } catch (e) { console.error('tests: métrica', evento, e?.message); }
}
export async function metricas(env, { dias = 30 } = {}) {
  const desde = new Date(Date.now() - Math.max(1, Math.min(366, Number(dias) || 30)) * 864e5).toISOString();
  const filas = await all(env, 'SELECT producto, evento, SUM(n) n FROM tests_metricas WHERE dia >= ? GROUP BY producto, evento', desde.slice(0, 10));
  const out = {};
  for (const p of Object.keys(PRODUCTOS_TEST)) out[p] = { inicio: 0, mitad: 0, termino: 0, correo: 0, candado: 0, checkout: 0, recordatorio: 0, compras: 0, compras_cupon: 0, recuperadas: 0, ingresos_centavos: 0 };
  for (const f of filas) if (out[f.producto]) out[f.producto][f.evento] = f.n;
  for (const [k, def] of Object.entries(PRODUCTOS_TEST)) {
    const c = await one(env, `SELECT COUNT(*) n, COALESCE(SUM(o.monto_centavos), 0) m FROM orders o
      WHERE o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia') AND o.paid_at >= ?
        AND EXISTS (SELECT 1 FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = o.id AND json_extract(p.contenido, '$.acceso.app') = ?)`, desde, def.app);
    out[k].compras = c?.n || 0; out[k].ingresos_centavos = c?.m || 0;
    // Con el cupón de 24 h, y recuperadas: pagadas después del correo «tu resultado te espera»
    const t = await one(env, `SELECT SUM(CASE WHEN o.descuento_codigo = r.cupon THEN 1 ELSE 0 END) cupon,
        SUM(CASE WHEN r.recordatorio_at IS NOT NULL AND o.paid_at > r.recordatorio_at THEN 1 ELSE 0 END) rec
      FROM tests_resultados r JOIN orders o ON o.id = r.order_id WHERE r.producto = ? AND o.estado = 'paid' AND o.paid_at >= ?`, k, desde);
    out[k].compras_cupon = t?.cupon || 0; out[k].recuperadas = t?.rec || 0;
    out[k].conversion_pct = out[k].termino ? Math.round(out[k].compras / out[k].termino * 1000) / 10 : 0;
  }
  return { desde, productos: out };
}

// ---------- la liga del correo ----------
/**
 * Abre la liga de una compra (download_tokens, la misma del correo de entrega). El reporte NO vence: se acepta un token
 * con más de 7 días (la vigencia es para descargas de archivos), pero no uno revocado ni de una compra reembolsada.
 * Devuelve { orden, item, contenido } del renglón de esa app, o { error: 'invalido' | 'revocado' }.
 */
export async function abrirToken(env, token, app) {
  if (!TOKEN.test(token || '')) return { error: 'invalido' };
  const v = await validarToken(env, token);
  if (!v.ok && v.motivo !== 'vencido') return { error: v.motivo };
  const items = await all(env, 'SELECT i.product_id, i.nombre, i.cantidad, p.slug, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ? ORDER BY i.id', v.orden.id);
  const item = items.find(i => parse(i.contenido).acceso?.app === app);
  if (!item) return { error: 'invalido' };
  return { orden: v.orden, item, contenido: parse(item.contenido) };
}

// ---------- Puntos Vorka: la liga para compartir (solo si esa persona ya tiene cuenta de puntos) ----------
export async function codigoCompartir(env, email) {
  if (!email) return null;
  const a = await one(env, "SELECT code, publico FROM affiliates WHERE lower(email) = ? AND tipo = 'puntos' AND activo = 1", String(email).trim().toLowerCase()).catch(() => null);
  return a ? (a.publico || a.code) : null;
}
export const whatsapp = texto => `https://wa.me/?text=${encodeURIComponent(texto)}`;

// ---------- leer formularios ----------
export async function leerFormulario(req, multi = []) {
  const tipo = req.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return req.json().catch(() => ({}));
  const f = await req.formData().catch(() => null);
  if (!f) return {};
  const d = {};
  for (const k of new Set(f.keys())) d[k] = multi.includes(k) ? f.getAll(k).map(String) : String(f.get(k));
  return d;
}
export async function ipHash(req) { return sha256(req.headers.get('cf-connecting-ip') || 'local'); }
export const cookieDe = (req, nombre) => (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === nombre)?.[1] || null;
export const cookieResultado = (def, id) => `${def.cookie}=${id}; Max-Age=${COOKIE_DIAS * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax`;

// ---------- compra en 1 paso desde el resultado ----------
// Un solo formulario: (opción de paquete) + nombre + correo (ya lleno si lo dio) + términos. JSON a /api/checkout con el
// id del resultado para ligar la compra a esas respuestas. id="form-compra": la tienda le agrega solo el campo «código»
// (descuentos, cupones y referidos) y la casilla de Puntos Vorka. Sin JavaScript funciona como POST normal.
export function formCompraTest(p, { resultado = '', nombre = '', email = '', paquetes = [], error = '', boton = 'Desbloquear mi reporte', cupon = null, ayudaEmail = 'Aquí te llega la liga de tu reporte (no vence).' } = {}) {
  const conCupon = cupon ? Math.max(1000, p.precio_centavos - cupon.monto) : null;
  const precioSolo = cupon ? `<s>${precio(p)}</s> ${pesos(conCupon)}` : precio(p);
  return `<form class="tv-compra" id="form-compra" method="post" action="/api/checkout" novalidate data-unidad="${p.precio_centavos}"${cupon ? ` data-cupon="${esc(cupon.codigo)}"` : ''}>
  <input type="hidden" name="slug" value="${esc(p.slug)}">${resultado ? `<input type="hidden" name="resultado" value="${esc(resultado)}">` : ''}${cupon ? `<input type="hidden" name="codigo" value="${esc(cupon.codigo)}">` : ''}
  ${cupon ? `<p class="tv-ok" style="margin:0">Tu descuento por terminar el test: <b>${pesos(cupon.monto)} menos</b> con el cupón <b>${esc(cupon.codigo)}</b> (ya aplicado). Vence el ${esc(horaVence(cupon.hasta))}.</p>` : ''}
  ${paquetes.length ? `<fieldset style="border:0;padding:0;margin:0;display:grid;gap:8px"><legend class="vh">Elige tu opción</legend>
    <label class="tv-opcion"><input type="radio" name="paquete" value="" checked data-total="${conCupon ?? p.precio_centavos}"><span><b>Solo el reporte completo · ${precioSolo}</b><small>Pago único. Tu reporte no vence.</small></span></label>
    ${paquetes.map(x => `<label class="tv-opcion"><input type="radio" name="paquete" value="${esc(x.slug)}" data-total="${x.total}"><span><b>Reporte + ${esc(x.nombre)} · ${esc(x.totalTexto)}</b> <span class="tv-ahorro">Ahorras ${esc(x.ahorroTexto)}</span><small>${esc(x.detalle)} <s>${esc(x.antesTexto)}</s></small></span></label>`).join('')}
  </fieldset>${cupon ? '<p class="tv-nota" style="margin:0">Los descuentos no se acumulan: en el paquete se aplica el mayor.</p>' : ''}` : `<div class="tv-precio"><b class="num" id="precio-total">${precioSolo}</b><span>Pago único · tu reporte no vence</span></div>`}
  <div class="tv-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120" value="${esc(nombre)}"></div>
  <div class="tv-campo"><label for="email">Tu correo</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(email)}"><small class="tv-nota">${esc(ayudaEmail)}</small></div>
  <label class="tv-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a> y el <a href="/privacidad/#tests" target="_blank">aviso de privacidad</a>.</span></label>
  <p class="tv-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
  <button class="btn acento" type="submit" id="btn-compra">${esc(boton)} ${FLECHA}</button>
  <p class="tv-nota" style="display:flex;gap:8px;align-items:center;margin:0"><span style="width:18px;height:18px;display:inline-flex">${CANDADO_PAGO}</span><span>Pago protegido con Stripe · tarjeta, OXXO o SPEI</span></p>
</form>`;
}
export const SCRIPT_COMPRA_TEST = `(function(){
  var f=document.getElementById('form-compra'); if(!f||!window.fetch) return;
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={}; new FormData(f).forEach(function(v,k){ d[k]=v; }); d.terminos=!!f.terminos.checked; if(!d.paquete) delete d.paquete; if(!d.codigo&&f.dataset.cupon) d.codigo=f.dataset.cupon;
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos) return mostrar('Acepta los términos y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d),credentials:'same-origin'})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;

// Progreso, ánimo a la mitad, avance guardado en este navegador (14 días, para no perder respuestas si se cierra) y
// avisos de inicio y mitad (una vez) para medir el embudo. Sin JavaScript el formulario funciona igual.
export const SCRIPT_TEST = producto => `(function(){
  var f=document.getElementById('form-test'); if(!f) return;
  var qs=[].slice.call(f.querySelectorAll('.tv-q[data-req]')), barra=document.getElementById('tv-barra'), num=document.getElementById('tv-cuenta'), animo=document.getElementById('tv-animo'), K='vorka_test_${producto}', vistos={};
  function hecha(q){ var s=q.querySelector('select'); return !!q.querySelector('input:checked')||!!(s&&s.value); }
  function aviso(e){ if(vistos[e]) return; vistos[e]=1; try{ fetch('/api/tests/evento',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p:'${producto}',e:e}),keepalive:true}); }catch(x){} }
  function guarda(){ try{ var d={}; new FormData(f).forEach(function(v,k){ (d[k]=d[k]||[]).push(v); }); localStorage.setItem(K,JSON.stringify({t:Date.now(),d:d})); }catch(x){} }
  function pinta(){ var n=qs.filter(hecha).length; if(barra) barra.style.width=(n/qs.length*100)+'%'; if(num) num.textContent=n+' de '+qs.length;
    if(n>=Math.ceil(qs.length/2)&&n<qs.length){ if(animo) animo.hidden=false; aviso('mitad'); } else if(animo) animo.hidden=true; }
  try{ var g=JSON.parse(localStorage.getItem(K)||'null'); if(g&&g.d&&Date.now()-g.t<14*864e5&&!f.querySelector('.tv-q input:checked')){
    Object.keys(g.d).forEach(function(k){ g.d[k].forEach(function(v){ [].forEach.call(f.querySelectorAll('[name="'+k+'"]'),function(i){ if(i.type==='radio'||i.type==='checkbox'){ if(i.value===v) i.checked=true; } else if(i.type!=='hidden'&&i.type!=='submit') i.value=v; }); }); });
    var rc=document.getElementById('tv-recuperado'); if(rc&&f.querySelector('.tv-q input:checked')) rc.hidden=false; } }catch(x){}
  f.addEventListener('change',function(e){
    var q=e.target.closest('.tv-q'); if(q) q.classList.remove('falta'); pinta(); guarda(); aviso('inicio');
    if(e.target.type==='radio'&&q&&q.dataset.req){ var i=qs.indexOf(q), sig=qs.slice(i+1).filter(function(x){return !hecha(x);})[0]; if(sig&&window.matchMedia&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(function(){ sig.scrollIntoView({behavior:'smooth',block:'center'}); },160); }
  });
  f.addEventListener('submit',function(e){
    var falta=qs.filter(function(q){ return !hecha(q); });
    qs.forEach(function(q){ q.classList.toggle('falta',falta.indexOf(q)>-1); });
    if(falta.length){ e.preventDefault(); var m=document.getElementById('tv-falta'); if(m){ m.hidden=false; m.textContent=falta.length===1?'Te falta 1 pregunta (está marcada en rojo).':'Te faltan '+falta.length+' preguntas (están marcadas en rojo).'; } falta[0].scrollIntoView({behavior:'smooth',block:'center'}); var r=falta[0].querySelector('input,select'); if(r) r.focus({preventScroll:true}); return; }
    try{ localStorage.removeItem(K); }catch(x){}
  });
  pinta();
})();`;
export const SCRIPT_IMPRIMIR = `(function(){ var b=document.getElementById('tv-imprimir'); if(b) b.addEventListener('click',function(){ window.print(); }); })();`;
// Las de varias opciones con tope (hasta 3): al llegar al tope, se desactivan las demás
export const SCRIPT_TOPE = `(function(){ [].forEach.call(document.querySelectorAll('[data-max]'),function(g){ var max=+g.dataset.max;
  function pinta(){ var c=g.querySelectorAll('input:checked').length; [].forEach.call(g.querySelectorAll('input'),function(i){ i.disabled=!i.checked&&c>=max; }); }
  g.addEventListener('change',pinta); pinta(); }); })();`;

export const ICONO_CANDADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
export const fechaCorta = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric' });
