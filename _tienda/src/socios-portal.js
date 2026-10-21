// Portal de Socios Vorka · vorka.mx/tienda/socios/
//   /tienda/socios/                 sin sesión: entrar con tu correo (enlace mágico, sin contraseña) · con sesión: tu panel
//   /tienda/socios/acceso/<token>   canjear el enlace del correo (30 min, un uso) → sesión de 30 días
//   /tienda/socios/qr.svg           QR de tu liga para imprimir (con sesión)
//   /api/socios/entrar · salir · pago (lo necesito ya)
//   /api/socios/codigo?c=CODIGO     ¿existe este código? (formulario de compra; con límite por IP para que no se puedan adivinar)
// El código del socio NO da acceso al portal: solo el enlace que llega a su correo. El socio solo ve sus propios datos y,
// de cada venta, producto, fecha, monto y comisión; nunca quién compró.
import { one, run, json, fail, aleatorio, sha256 } from './util.js';
import { hashToken } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { enviar, marco, boton, P } from './correo.js';
import { dentroDelLimite } from './modelo.js';
import { FLECHA, LOGO } from './marco.generado.js';
import { qrSvg } from './puntos-app.js';
import { resumenSocio, pedirPagoInmediato, socioActivo, COOKIE_SOCIO } from './socios.js';

const COOKIE = 'vorka_socio_sesion';
const ENLACE_MIN = 30, SESION_DIAS = 30;
const NO_CACHE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
const hash = (env, t) => hashToken(env, `socio|${t}`);
const leer = (req, nombre) => (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === nombre)?.[1];
const mismoOrigen = (req, env) => { const o = req.headers.get('origin'); return !o || o === new URL(env.SITE_URL).origin; };
const ip = req => req.headers.get('cf-connecting-ip') || 'local';
const pesos = c => '$' + (Number(c || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = iso => iso ? new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short' }) : '';

export async function socioSesion(req, env) {
  const t = leer(req, COOKIE);
  if (!/^[a-f0-9]{64}$/.test(t || '')) return null;
  const a = await one(env, "SELECT socio_id FROM socios_accesos WHERE token_hash = ? AND tipo = 'sesion' AND expira_at > ?", await hash(env, t), new Date().toISOString());
  return a ? one(env, 'SELECT * FROM socios WHERE id = ?', a.socio_id) : null;
}

export async function rutasSocios(req, env, url) {
  const p = url.pathname, M = req.method;
  if (p === '/tienda/socios') return Response.redirect(`${url.origin}/tienda/socios/`, 301);
  if (p === '/tienda/socios/' && (M === 'GET' || M === 'HEAD')) {
    const s = await socioSesion(req, env);
    return s ? paginaPanel(env, s) : paginaEntrar();
  }
  const acc = p.match(/^\/tienda\/socios\/acceso\/([a-f0-9]{64})\/?$/);
  if (acc && M === 'GET') return canjearEnlace(env, acc[1]);
  if (p === '/tienda/socios/qr.svg' && M === 'GET') {
    const s = await socioSesion(req, env);
    if (!s) return fail('Entra a tu portal de socio.', 401);
    return new Response(qrSvg(ligaDe(env, s)), { headers: { 'content-type': 'image/svg+xml', 'content-disposition': `attachment; filename="qr-${s.code}.svg"`, ...NO_CACHE } });
  }
  if (p === '/api/socios/entrar' && M === 'POST') return pedirEnlace(req, env);
  if (p === '/api/socios/salir' && M === 'POST') {
    const t = leer(req, COOKIE);
    if (/^[a-f0-9]{64}$/.test(t || '')) await run(env, 'DELETE FROM socios_accesos WHERE token_hash = ?', await hash(env, t));
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
  }
  if (p === '/api/socios/pago' && M === 'POST') {
    if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
    const s = await socioSesion(req, env);
    if (!s) return fail('Tu sesión terminó. Vuelve a entrar con tu correo.', 401);
    if (!(await dentroDelLimite(env, `socios:pago:${s.id}`, 3, 86400))) return fail('Ya pediste tu pago varias veces hoy. Te escribimos en cuanto lo transfiramos.', 429);
    try {
      const pago = await pedirPagoInmediato(env, s.id);
      return json({ ok: true, monto_centavos: pago.monto_centavos });
    } catch (e) { return fail(e.message, 409); }
  }
  if (p === '/api/socios/codigo' && M === 'GET') return buscarCodigo(req, env, url);
  return null;
}

// ---------- ¿existe este código? ----------
// Sin ?c= responde con el socio de la liga (cookie), para mostrarlo ya aplicado en el formulario de compra.
// Solo dice el primer nombre y el descuento: nada del socio que sirva para entrar a su portal.
async function buscarCodigo(req, env, url) {
  if (!(await dentroDelLimite(env, `socios:codigo:${await sha256(ip(req))}`, 30, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const c = url.searchParams.get('c') ?? (leer(req, COOKIE_SOCIO) ? decodeURIComponent(leer(req, COOKIE_SOCIO)) : '');
  const s = c ? await socioActivo(env, String(c).slice(0, 40)) : null;
  if (!s) return json({ valido: false }, 200, NO_CACHE);
  return json({ valido: true, codigo: s.code, nombre: s.nombre.trim().split(/\s+/)[0], descuento_pct: s.descuento_pct, de_liga: !url.searchParams.has('c') }, 200, NO_CACHE);
}

// ---------- entrar: enlace mágico por correo ----------
async function pedirEnlace(req, env) {
  if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return fail('Escribe un correo válido.');
  if (!(await dentroDelLimite(env, `socios:entrar:ip:${await sha256(ip(req))}`, 10, 600)) || !(await dentroDelLimite(env, `socios:entrar:email:${await sha256(email)}`, 4, 600)))
    return fail('Pediste muchos correos seguidos. Espera unos minutos y revisa tu bandeja (también spam).', 429);
  // Misma respuesta exista o no el socio: el portal no revela quién es socio
  const s = await one(env, "SELECT * FROM socios WHERE email = ? AND estado = 'activo' ORDER BY id DESC LIMIT 1", email);
  let extra = {};
  if (s) {
    const t = aleatorio(32);
    await run(env, "INSERT INTO socios_accesos (token_hash, socio_id, tipo, expira_at) VALUES (?, ?, 'enlace', ?)", await hash(env, t), s.id, new Date(Date.now() + ENLACE_MIN * 60e3).toISOString());
    const enlace = `${env.SITE_URL}/tienda/socios/acceso/${t}`;
    await enviar(env, { para: email, asunto: 'Entra a tu portal de Socios Vorka', idempotencia: `socio-entrar-${t.slice(0, 24)}`,
      html: marco('Entra a tu portal de socio', `<p style="${P}">Toca el botón para entrar desde este dispositivo. Ahí ves tu código, tus ventas del mes, tus comisiones y tus pagos. El enlace funciona una vez durante ${ENLACE_MIN} minutos.</p>${boton(enlace, 'Entrar a mi portal')}<p style="${P}">Si no lo pediste, ignora este correo: nadie entra sin este enlace.</p>`, { etiqueta: 'Socios' }),
      texto: `Entra a tu portal de Socios Vorka (funciona una vez, ${ENLACE_MIN} minutos):\n${enlace}\n\nSi no lo pediste, ignora este correo.` });
    // Sin correo configurado (pruebas locales) se devuelve el enlace para poder entrar
    if (!env.RESEND_API_KEY && !env.CORREO) extra = { enlace: enlace.replace(env.SITE_URL, '') };
  }
  return json({ ok: true, ...extra });
}

async function canjearEnlace(env, t) {
  const h = await hash(env, t), ahora = new Date().toISOString();
  const r = await one(env, "UPDATE socios_accesos SET usado_at = ? WHERE token_hash = ? AND tipo = 'enlace' AND usado_at IS NULL AND expira_at > ? RETURNING socio_id", ahora, h, ahora);
  const s = r && await one(env, "SELECT id FROM socios WHERE id = ? AND estado = 'activo'", r.socio_id);
  if (!s) return pagina({ titulo: 'Enlace vencido · Socios Vorka', ruta: '/tienda/socios/', noindex: true, status: 410, headers: NO_CACHE,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya se usó o venció', texto: 'Pide uno nuevo con tu correo: llega en un minuto.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/socios/">Pedir otro enlace ${FLECHA}</a></div>` }) });
  const sesion = aleatorio(32);
  await run(env, "INSERT INTO socios_accesos (token_hash, socio_id, tipo, expira_at) VALUES (?, ?, 'sesion', ?)", await hash(env, sesion), s.id, new Date(Date.now() + SESION_DIAS * 864e5).toISOString());
  return new Response(null, { status: 303, headers: { location: '/tienda/socios/', 'set-cookie': `${COOKIE}=${sesion}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESION_DIAS * 86400}`, ...NO_CACHE } });
}

// ---------- páginas ----------
const ligaDe = (env, s) => `${env.SITE_URL}/tienda/?socio=${encodeURIComponent(s.code)}`;

const CSS = `<style>
.so{padding:clamp(100px,12vw,140px) 0 70px}
.so .marco{max-width:760px}
.so-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
.so-h h1{font-size:clamp(28px,5vw,38px);letter-spacing:-.04em;line-height:1.05;margin:0}
.so-h small{display:block;color:var(--fg-2);font-size:14px;margin-top:4px}
.so-salir{background:none;border:0;color:var(--fg-2);font:inherit;font-size:14px;text-decoration:underline;cursor:pointer;padding:8px 0}
.so-tarjeta{position:relative;overflow:hidden;border-radius:26px;background:var(--noche);color:var(--claro);padding:24px 22px 22px;box-shadow:var(--sombra-2)}
.so-tarjeta .so-v{position:absolute;right:-50px;bottom:-70px;width:260px;opacity:.06;color:#fff}.so-tarjeta .so-v svg{width:100%;height:auto}
.so-tarjeta small{color:var(--claro-3);font-size:13px;font-weight:600;letter-spacing:.02em;text-transform:uppercase}
.so-codigo{display:block;font-size:clamp(30px,8vw,44px);font-weight:800;letter-spacing:-.02em;color:#fff;margin:4px 0 10px;word-break:break-all}
.so-liga{display:block;font-size:14px;color:var(--claro-2);word-break:break-all;margin-bottom:16px}
.so-acc{display:flex;flex-wrap:wrap;gap:8px;position:relative}
.so-acc .btn{flex:1 1 140px;justify-content:center}
.so-qr{display:none;margin-top:16px;background:#fff;border-radius:18px;padding:14px;text-align:center}
.so-qr.ver{display:block}.so-qr svg{width:min(240px,100%);height:auto}
.so-qr a{display:inline-block;margin-top:8px;color:#141114;font-size:14px;font-weight:650}
.so-g{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));margin:16px 0}
.so-k{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px}
.so-k > b{display:block;font-size:24px;letter-spacing:-.03em}.so-k span{font-size:13.5px;color:var(--fg-2)}
.so-k.fuerte{grid-column:1/-1;display:grid;gap:10px}
.so-k.fuerte > b{font-size:34px}
.so-barra{height:10px;border-radius:99px;background:var(--bg-2);overflow:hidden}.so-barra i{display:block;height:100%;background:linear-gradient(90deg,#6f5420,#c8a45c);border-radius:99px}
.so-sec{margin:28px 0 10px;font-size:20px;letter-spacing:-.03em}
.so-lista{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.so-lista li{display:grid;grid-template-columns:minmax(0,1fr) max-content;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px}
.so-lista li div{min-width:0}.so-lista li b{display:block;font-size:15px;overflow-wrap:anywhere}.so-lista li span{font-size:13px;color:var(--fg-2)}
.so-lista li em{font-style:normal;display:grid;justify-items:end;gap:4px;white-space:nowrap}.so-lista li em b{font-size:16px}
.so-pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:99px;background:var(--bg-2);color:var(--fg-2)}
.so-pill.so-ok{background:#e6f4ea;color:#1d6b3a}.so-pill.so-va{background:#fff4dc;color:#7a5600}.so-pill.so-no{background:#fbe9e9;color:#9b2c2c}
.so-vacio{color:var(--fg-2);font-size:14.5px;background:var(--bg-2);border-radius:16px;padding:14px}
.so-nota{color:var(--fg-2);font-size:13.5px;margin-top:18px}
.so-msj{margin-top:8px;font-size:14px}
.so-entrar{max-width:520px;margin:0 auto}
</style>`;

function paginaEntrar() {
  return pagina({ titulo: 'Portal de socios · Vorka México', ruta: '/tienda/socios/', noindex: true, headers: NO_CACHE, head: CSS,
    script: `(function(){
  var f=document.getElementById('so-form'), m=document.getElementById('so-msj'), b=f.querySelector('button'), t=b.innerHTML;
  f.addEventListener('submit',function(e){ e.preventDefault(); if(!f.email.checkValidity()||!f.email.value.trim()){ m.textContent='Escribe un correo válido.'; m.hidden=false; return; }
    b.disabled=true; b.textContent='Enviando…';
    fetch('/api/socios/entrar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value.trim()}),credentials:'same-origin'})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ b.disabled=false; b.innerHTML=t; if(x.ok&&x.j.enlace){ location.href=x.j.enlace; return; } m.textContent=x.ok?'Si ese correo es de un socio, te llegó un enlace para entrar. Revisa también spam o promociones.':(x.j.error||'No pudimos enviarlo. Intenta de nuevo.'); m.hidden=false; })
      .catch(function(){ b.disabled=false; b.innerHTML=t; m.textContent='Sin conexión. Intenta de nuevo.'; m.hidden=false; });
  });
})();`,
    cuerpo: `<section class="so"><div class="marco"><div class="so-entrar">
  <span class="etiqueta">Socios Vorka</span>
  <h1 class="t-h1">Tu portal de socio</h1>
  <p class="t-lead">Escribe el correo con el que te registramos y te mandamos un enlace para entrar. Sin contraseñas.</p>
  <form class="t-form" id="so-form" novalidate>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"></div>
    <button class="btn tinta" type="submit">Mandarme el enlace ${FLECHA}</button>
    <p class="so-msj t-nota" id="so-msj" role="status" hidden></p>
  </form>
  <p class="so-nota">Socios Vorka es solo por invitación. ¿Te interesa? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. <a href="/legal/socios/">Condiciones del programa</a>.</p>
</div></div></section>` });
}

const ESTADOS = { pendiente: ['En retención', 'va'], disponible: ['Disponible', 'ok'], pagada: ['Pagada', 'ok'], cancelada: ['Cancelada', 'no'] };
const ESTADOS_PAGO = { por_pagar: ['En proceso', 'va'], pagado: ['Pagado', 'ok'], cancelado: ['Cancelado', 'no'] };
const pill = ([t, c]) => `<span class="so-pill so-${c}">${t}</span>`;

async function paginaPanel(env, s) {
  const r = await resumenSocio(env, s.id);
  const liga = ligaDe(env, s), activo = s.estado === 'activo';
  const primer = esc(s.nombre.trim().split(/\s+/)[0]);
  const meta = r.pct_siguiente != null ? Math.min(100, Math.round(r.ventas_mes / (r.ventas_mes + r.faltan) * 100)) : 100;
  const comisiones = r.comisiones.map(c => {
    const [t, k] = c.estado === 'disponible' && c.pago_id ? ['En camino', 'va'] : ESTADOS[c.estado] || [c.estado, ''];
    const detalle = c.tipo === 'ajuste' ? 'Ajuste por reembolso' : `${fecha(c.created_at)} · venta ${pesos(c.base_centavos)} · ${c.pct}%${c.estado === 'pendiente' ? ` · se libera el ${fecha(c.disponible_en)}` : ''}`;
    return `<li><div><b>${esc(c.concepto || 'Venta')}</b><span>${detalle}</span></div><em><b>${pesos(c.monto_centavos)}</b>${pill([t, k])}</em></li>`;
  }).join('');
  const pagos = r.pagos.map(p => `<li><div><b>${pesos(p.monto_centavos)}</b><span>${p.origen === 'inmediato' ? 'Lo pediste' : 'Pago semanal'} · ${fecha(p.created_at)}${p.pagado_el ? ` · SPEI ${esc(p.pagado_el)}` : ''}${p.clave_rastreo ? ` · rastreo ${esc(p.clave_rastreo)}` : ''}</span></div><em>${pill(ESTADOS_PAGO[p.estado] || [p.estado, ''])}</em></li>`).join('');
  return pagina({ titulo: 'Mi portal de socio · Vorka México', ruta: '/tienda/socios/', noindex: true, headers: NO_CACHE, head: CSS,
    script: `(function(){
  var liga=${JSON.stringify(liga).replace(/</g, '\\u003c')};
  function aviso(el,m){ el.textContent=m; el.hidden=false; }
  var c=document.getElementById('so-copiar'); if(c) c.addEventListener('click',function(){ (navigator.clipboard?navigator.clipboard.writeText(liga):Promise.reject()).then(function(){ c.textContent='¡Copiada!'; setTimeout(function(){ c.textContent='Copiar liga'; },1800); }).catch(function(){ prompt('Copia tu liga:',liga); }); });
  var sh=document.getElementById('so-compartir'); if(sh) sh.addEventListener('click',function(){ var t='Compra en la tienda de Vorka México con mi código ${esc(s.code)}: '+liga; if(navigator.share) navigator.share({title:'Vorka México',text:t,url:liga}).catch(function(){}); else location.href='https://wa.me/?text='+encodeURIComponent(t); });
  var q=document.getElementById('so-ver-qr'); if(q) q.addEventListener('click',function(){ document.getElementById('so-qr').classList.toggle('ver'); });
  var pg=document.getElementById('so-pagar'), pm=document.getElementById('so-pagar-msj');
  if(pg) pg.addEventListener('click',function(){ if(!confirm('¿Pedir tu pago ahora? Te transferimos por SPEI todo tu saldo disponible.')) return; pg.disabled=true; pg.textContent='Enviando…';
    fetch('/api/socios/pago',{method:'POST',credentials:'same-origin'}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok){ aviso(pm,'Listo: pediste '+('$'+(x.j.monto_centavos/100).toLocaleString('es-MX',{minimumFractionDigits:2}))+'. Te avisamos por correo cuando lo transfiramos.'); pg.textContent='Pago pedido'; } else { aviso(pm,x.j.error||'No pudimos pedirlo. Intenta de nuevo.'); pg.disabled=false; pg.textContent='Pedir mi pago ahora'; } })
      .catch(function(){ aviso(pm,'Sin conexión. Intenta de nuevo.'); pg.disabled=false; pg.textContent='Pedir mi pago ahora'; }); });
  document.getElementById('so-salir').addEventListener('click',function(){ fetch('/api/socios/salir',{method:'POST',credentials:'same-origin'}).then(function(){ location.href='/tienda/socios/'; }); });
})();`,
    cuerpo: `<section class="so"><div class="marco">
  <div class="so-h"><div><h1>Hola, ${primer}</h1><small>Socio Vorka${activo ? '' : ' · <b>cuenta pausada</b>'}</small></div><button class="so-salir" type="button" id="so-salir">Salir</button></div>
  ${activo ? `<div class="so-tarjeta">
    <span class="so-v" aria-hidden="true">${LOGO}</span>
    <small>Tu código</small>
    <b class="so-codigo">${esc(s.code)}</b>
    <span class="so-liga">${esc(liga.replace(/^https?:\/\//, ''))}</span>
    <div class="so-acc"><button class="btn blanco chico" type="button" id="so-copiar">Copiar liga</button><button class="btn blanco chico" type="button" id="so-compartir">Compartir</button><button class="btn blanco chico" type="button" id="so-ver-qr">Ver QR</button></div>
    <div class="so-qr" id="so-qr">${qrSvg(liga)}<br><a href="/tienda/socios/qr.svg" download>Descargar QR</a></div>
  </div>
  <p class="so-nota">Quien entra con tu liga queda ligado a ti 30 días. También pueden escribir tu código al pagar${s.descuento_pct ? ` y reciben <b>${s.descuento_pct}% de descuento</b>` : ''}.</p>`
    : `<p class="so-vacio">Tu cuenta de socio está pausada: tu código no suma ventas nuevas por ahora. Tus comisiones y pagos siguen aquí. ¿Dudas? <a href="mailto:hola@vorka.mx">hola@vorka.mx</a></p>`}

  <h2 class="so-sec">Este mes</h2>
  <div class="so-g">
    <div class="so-k"><b>${r.ventas_mes}</b><span>${r.ventas_mes === 1 ? 'venta' : 'ventas'} con tu código</span></div>
    <div class="so-k"><b>${r.pct_actual}%</b><span>tu comisión ahora</span></div>
    <div class="so-k fuerte"><span>${r.pct_siguiente != null ? `Desde tu venta ${r.desde_siguiente} del mes ganas <b>${r.pct_siguiente}%</b>: te ${r.faltan === 1 ? 'falta 1 venta' : `faltan ${r.faltan} ventas`} para llegar.` : `Estás en el nivel más alto: <b>${r.pct_actual}%</b> en cada venta del mes.`} El conteo vuelve a empezar cada mes.</span><div class="so-barra" aria-hidden="true"><i style="width:${meta}%"></i></div></div>
  </div>

  <h2 class="so-sec">Tu dinero</h2>
  <div class="so-g">
    <div class="so-k fuerte"><span>Disponible para cobrar</span><b>${pesos(r.totales.disponible)}</b>
      ${activo ? `<button class="btn tinta" type="button" id="so-pagar"${r.totales.disponible > 0 ? '' : ' disabled'}>Pedir mi pago ahora</button><p class="so-msj" id="so-pagar-msj" role="status" hidden></p>` : ''}
      <span>Si no lo pides, te pagamos todo lo disponible cada lunes por SPEI${s.clabe ? ` a tu CLABE terminación ${esc(String(s.clabe).slice(-4))}` : ''}.</span></div>
    <div class="so-k"><b>${pesos(r.totales.pendiente)}</b><span>En retención (${r.retencion_dias} días)</span></div>
    <div class="so-k"><b>${pesos(r.totales.en_camino)}</b><span>En camino</span></div>
    <div class="so-k"><b>${pesos(r.totales.pagada)}</b><span>Pagado en total</span></div>
  </div>

  <h2 class="so-sec">Tus comisiones</h2>
  ${comisiones ? `<ul class="so-lista">${comisiones}</ul>` : '<p class="so-vacio">Aún no hay ventas con tu código. Comparte tu liga: cada compra aparece aquí.</p>'}

  <h2 class="so-sec">Tus pagos</h2>
  ${pagos ? `<ul class="so-lista">${pagos}</ul>` : '<p class="so-vacio">Todavía no hay pagos.</p>'}

  <p class="so-nota">Por privacidad no mostramos quién compró. Si una compra se reembolsa antes de pagarte, su comisión se cancela; si ya te la pagamos, se descuenta del siguiente pago. <a href="/legal/socios/">Condiciones del programa</a> · <a href="mailto:hola@vorka.mx">hola@vorka.mx</a></p>
</div></section>` });
}
