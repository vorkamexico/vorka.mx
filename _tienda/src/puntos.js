// Programa de puntos Vorka · vorka.mx/tienda/puntos/
//   /tienda/puntos/                 qué es y cómo funciona + crear cuenta / entrar (pública)
//   /tienda/puntos/acceso/<token>   canjear el enlace del correo → sesión
//   /tienda/cuenta/                 tu cuenta: liga para compartir, saldo y movimientos
//   /api/puntos/entrar · /api/puntos/salir · /api/puntos/saldo
// Reglas: por cada compra pagada que entra con tu liga ganas 10 puntos (no cuenta comprarte a ti mismo).
// 1 punto = $1 MXN, se canjean en cualquier producto de la tienda; siempre se cobra al menos $10 (mínimo de la pasarela).
// Si una compra se reembolsa, sus puntos se revierten (y los que se usaron en ella, regresan).
// Las comisiones en DINERO (affiliates.tipo = 'dinero') son solo por invitación: las da de alta el equipo.
import { one, all, run, json, fail, aleatorio, sha256, pesos } from './util.js';
import { hashToken } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { enviar, marco, boton, P } from './correo.js';
import { dentroDelLimite } from './modelo.js';

export const PUNTOS_POR_COMPRA = 10;
export const COBRO_MINIMO = 1000;         // centavos: Stripe no cobra menos de $10 MXN
const COOKIE = 'vorka_cuenta';
const ENLACE_MIN = 30, SESION_DIAS = 60;
const RESERVA_HORAS = 24;                 // puntos apartados por una compra que aún no se paga (OXXO, carrito abandonado)
const emailValido = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');
const leerCookie = req => (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === COOKIE)?.[1];
const mismoOrigen = (req, env) => { const o = req.headers.get('origin'); return !o || o === new URL(env.SITE_URL).origin; };

// ---------- cuenta ----------
export async function cuentaActual(req, env) {
  const t = leerCookie(req);
  if (!/^[a-f0-9]{64}$/.test(t || '')) return null;
  const s = await one(env, "SELECT email FROM puntos_accesos WHERE token_hash = ? AND tipo = 'sesion' AND expira_at > ?", await hashToken(env, t), new Date().toISOString());
  return s ? { email: s.email } : null;
}

// Código de recomendación de la cuenta (se crea la primera vez): letras del correo + 4 al azar, en mayúsculas
export async function codigoDe(env, email, nombre = null) {
  const ya = await one(env, "SELECT code FROM affiliates WHERE email = ? AND tipo = 'puntos'", email);
  if (ya) return ya.code;
  const base = (nombre || email.split('@')[0]).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'VORKA';
  for (let i = 0; i < 5; i++) {
    const code = `${base}${aleatorio(2).toUpperCase()}`;
    const r = await run(env, "INSERT OR IGNORE INTO affiliates (code, nombre, email, comision_pct, activo, tipo) VALUES (?, ?, ?, 0, 1, 'puntos')", code, nombre || email.split('@')[0], email);
    if (r.meta.changes) return code;
  }
  throw new Error('codigo');
}

// Saldo disponible = movimientos − puntos apartados en compras pendientes (para no usarlos dos veces)
export async function saldoDe(env, email) {
  const m = await one(env, 'SELECT COALESCE(SUM(puntos), 0) n FROM puntos_movimientos WHERE email = ?', email);
  const desde = new Date(Date.now() - RESERVA_HORAS * 3600e3).toISOString();
  const r = await one(env, "SELECT COALESCE(SUM(descuento_centavos), 0) c FROM orders WHERE puntos_email = ? AND estado = 'pending' AND created_at >= ?", email, desde);
  return { total: m.n, apartados: Math.round(r.c / 100), disponibles: Math.max(0, m.n - Math.round(r.c / 100)) };
}

// Cuánto descuento (en centavos) se puede aplicar a una compra de `total` centavos
export const descuentoMaximo = (saldo, total) => Math.max(0, Math.min(saldo * 100, total - COBRO_MINIMO));

// ---------- al pagarse o reembolsarse una orden (webhook; idempotente por el índice único) ----------
export async function puntosAlPagar(env, orderId) {
  const o = await one(env, "SELECT o.*, a.email ref_email, a.tipo ref_tipo FROM orders o LEFT JOIN affiliates a ON a.code = o.ref_code WHERE o.id = ?", orderId);
  if (!o || o.estado !== 'paid') return;
  if (o.descuento_centavos > 0 && o.puntos_email)
    await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota) VALUES (?, 'canje', ?, ?, 'Usados en tu compra')", o.puntos_email, -Math.round(o.descuento_centavos / 100), o.id);
  // Gana quien compartió la liga, si es una cuenta de puntos y no se compró a sí mismo
  if (o.ref_tipo === 'puntos' && o.ref_email && o.ref_email !== o.email && o.monto_centavos > 0)
    await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota) VALUES (?, 'ganado', ?, ?, 'Compra con tu liga')", o.ref_email, PUNTOS_POR_COMPRA, o.id);
}
export async function puntosAlReembolsar(env, orderId) {
  const ms = await all(env, "SELECT * FROM puntos_movimientos WHERE order_id = ? AND tipo IN ('ganado', 'canje')", orderId);
  for (const m of ms)
    await run(env, 'INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota) VALUES (?, ?, ?, ?, ?)',
      m.email, m.tipo === 'ganado' ? 'revertido' : 'devuelto', -m.puntos, orderId, m.tipo === 'ganado' ? 'La compra con tu liga se reembolsó' : 'Te regresamos los puntos de una compra reembolsada');
}

// ---------- rutas ----------
export async function rutasPuntos(req, env, url) {
  const p = url.pathname, M = req.method;
  if ((p === '/tienda/puntos' || p === '/tienda/puntos/') && M === 'GET') return paginaPrograma(env, req, url);
  if ((p === '/tienda/cuenta' || p === '/tienda/cuenta/') && M === 'GET') return paginaCuenta(env, req);
  let m;
  if ((m = p.match(/^\/tienda\/puntos\/acceso\/([a-f0-9]{64})\/?$/)) && M === 'GET') return canjear(env, m[1]);
  if (p === '/api/puntos/entrar' && M === 'POST') return pedirEnlace(req, env);
  if (p === '/api/puntos/salir' && M === 'POST') {
    const t = leerCookie(req);
    if (/^[a-f0-9]{64}$/.test(t || '')) await run(env, 'DELETE FROM puntos_accesos WHERE token_hash = ?', await hashToken(env, t));
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
  }
  if (p === '/api/puntos/saldo' && M === 'GET') {
    const c = await cuentaActual(req, env);
    if (!c) return json({ cuenta: false }, 200, { 'cache-control': 'no-store' });
    return json({ cuenta: true, email: c.email, ...(await saldoDe(env, c.email)) }, 200, { 'cache-control': 'no-store' });
  }
  return null;
}

async function pedirEnlace(req, env) {
  if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!emailValido(email)) return fail('Escribe un correo válido.');
  if (b.terminos !== true) return fail('Acepta las condiciones del programa de puntos.');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `puntos:ip:${await sha256(ip)}`, 10, 600)) || !(await dentroDelLimite(env, `puntos:email:${await sha256(email)}`, 4, 600)))
    return fail('Pediste muchos enlaces seguidos. Espera unos minutos y revisa tu correo (también spam).', 429);
  const nombre = String(b.nombre || '').trim().slice(0, 80) || null;
  await codigoDe(env, email, nombre);
  const t = aleatorio(32);
  await run(env, "INSERT INTO puntos_accesos (token_hash, email, tipo, expira_at) VALUES (?, ?, 'enlace', ?)", await hashToken(env, t), email, new Date(Date.now() + ENLACE_MIN * 60e3).toISOString());
  const enlace = `${env.SITE_URL}/tienda/puntos/acceso/${t}`;
  await enviar(env, { para: email, asunto: 'Entra a tu cuenta de puntos Vorka', idempotencia: `puntos-${t.slice(0, 24)}`,
    html: marco('Tu cuenta de puntos', `<p style="${P}">Toca el botón para entrar. Ahí encuentras tu liga para compartir y tus puntos. El enlace funciona una vez durante ${ENLACE_MIN} minutos.</p>${boton(enlace, 'Entrar a mi cuenta')}<p style="${P}">Si no lo pediste, ignora este correo.</p>`, { etiqueta: 'Puntos' }),
    texto: `Entra a tu cuenta de puntos Vorka (funciona una vez, ${ENLACE_MIN} minutos):\n${enlace}\n\nSi no lo pediste, ignora este correo.` });
  // Sin correo configurado (pruebas locales) se devuelve el enlace para poder entrar
  return json({ ok: true, ...(!env.RESEND_API_KEY && !env.CORREO ? { enlace: enlace.replace(env.SITE_URL, '') } : {}) });
}

async function canjear(env, token) {
  const h = await hashToken(env, token), ahora = new Date().toISOString();
  const r = await run(env, "UPDATE puntos_accesos SET usado_at = ? WHERE token_hash = ? AND tipo = 'enlace' AND usado_at IS NULL AND expira_at > ?", ahora, h, ahora);
  if (!r.meta.changes) return pagina({ titulo: 'Enlace vencido · Puntos Vorka', ruta: '/tienda/puntos/', noindex: true, status: 410,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya se usó o venció', texto: 'Pide uno nuevo con tu correo.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/puntos/#entrar">Pedir otro enlace ${FLECHA}</a></div>` }) });
  const { email } = await one(env, 'SELECT email FROM puntos_accesos WHERE token_hash = ?', h);
  const s = aleatorio(32);
  await run(env, "INSERT INTO puntos_accesos (token_hash, email, tipo, expira_at) VALUES (?, ?, 'sesion', ?)", await hashToken(env, s), email, new Date(Date.now() + SESION_DIAS * 864e5).toISOString());
  return new Response(null, { status: 303, headers: { location: '/tienda/cuenta/', 'set-cookie': `${COOKIE}=${s}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESION_DIAS * 86400}`, 'referrer-policy': 'no-referrer' } });
}

// Qué conviene compartir (cada liga lleva tu código)
const COMPARTIBLES = [
  ['Simulador PAA', '/simulador-paa/', 'Para quien presenta su examen de admisión.'],
  ['Brindi · Invitaciones digitales', '/tienda/brindi/', 'Para bodas, XV años, bautizos y cumpleaños.'],
  ['Cupo · Eventos con registro', '/tienda/cupo/', 'Para fiestas, antros, talleres y eventos de negocio.'],
  ['Toda la tienda', '/tienda/', 'Guías, kits y todo lo de Vorka México.'],
];
const REGLAS = [
  `Por cada compra que alguien haga con tu liga ganas <b>${PUNTOS_POR_COMPRA} puntos</b>. No importa el producto.`,
  '<b>1 punto = $1 MXN</b> de descuento en cualquier producto de la tienda Vorka.',
  'Los usas al pagar, con el mismo correo de tu cuenta. Siempre se cobra al menos $10 (lo mínimo que acepta la pasarela).',
  'No cuentan las compras que te hagas a ti mismo. Si una compra se reembolsa, sus puntos se descuentan.',
];

async function paginaPrograma(env, req, url) {
  const c = await cuentaActual(req, env);
  return pagina({
    titulo: 'Puntos Vorka: comparte y gana descuentos en la tienda', ruta: '/tienda/puntos/',
    descripcion: `Crea tu cuenta, comparte tu liga y gana ${PUNTOS_POR_COMPRA} puntos por cada compra. 1 punto = $1 MXN en cualquier producto de la tienda Vorka.`,
    script: SCRIPT_ENTRAR,
    cuerpo: `
<section class="t-sec t-cab"><div class="marco t-estrecho">
  <a class="t-volver" href="/tienda/">← Tienda</a>
  <span class="etiqueta">Puntos Vorka</span>
  <h1 class="h1 t-titulo">Recomienda y gana <span class="metal">descuentos.</span></h1>
  <p class="lead">Comparte tu liga del Simulador PAA, Brindi, Cupo o cualquier producto. Por cada compra que entre con ella ganas ${PUNTOS_POR_COMPRA} puntos, y cada punto vale $1 en la tienda.</p>
  <ul class="t-lista">${REGLAS.map(r => `<li>${CHECK}<span>${r}</span></li>`).join('')}</ul>
</div></section>
<section class="t-sec suave" id="entrar"><div class="marco t-estrecho">
  ${c ? `<p class="lead">Ya entraste como <b>${esc(c.email)}</b>.</p><div class="botones"><a class="btn tinta" href="/tienda/cuenta/">Ver mi liga y mis puntos ${FLECHA}</a></div>`
    : `<span class="etiqueta">Crea tu cuenta o entra</span><h2 class="h2 t-h2-sec">Te mandamos un enlace a tu correo</h2>
  <form class="t-form" id="form-puntos" novalidate>
    <div class="t-campo"><label for="pn">Tu nombre</label><input id="pn" name="nombre" type="text" autocomplete="name" maxlength="80"></div>
    <div class="t-campo"><label for="pe">Correo electrónico</label><input id="pe" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="254"><small class="t-ayuda">Usa el mismo correo con el que compras: ahí se juntan tus puntos.</small></div>
    <label class="t-casilla"><input type="checkbox" name="terminos" required><span>Acepto las <a href="/legal/terminos/#puntos" target="_blank">condiciones del programa de puntos</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
    <p class="t-error" id="pe-err" role="alert" hidden></p>
    <button class="btn tinta" type="submit">Mandarme el enlace ${FLECHA}</button>
    <p class="t-nota" id="pe-ok" hidden></p>
  </form>`}
  <p class="t-nota" style="margin-top:22px">¿Eres creador de contenido, escuela o institución? También tenemos comisiones en dinero, solo por invitación: escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>
</div></section>`,
  });
}

async function paginaCuenta(env, req) {
  const c = await cuentaActual(req, env);
  if (!c) return new Response(null, { status: 303, headers: { location: '/tienda/puntos/#entrar' } });
  const code = await codigoDe(env, c.email);
  const s = await saldoDe(env, c.email);
  const movs = await all(env, 'SELECT tipo, puntos, nota, created_at FROM puntos_movimientos WHERE email = ? ORDER BY id DESC LIMIT 50', c.email);
  const ventas = await one(env, "SELECT COUNT(*) n FROM puntos_movimientos WHERE email = ? AND tipo = 'ganado'", c.email);
  const liga = r => `${env.SITE_URL}${r}?ref=${code}`;
  const fecha = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric' });
  const TIPO = { ganado: 'Ganaste', revertido: 'Se revirtió', canje: 'Usaste', devuelto: 'Te regresamos', ajuste: 'Ajuste' };
  return pagina({
    titulo: 'Mi cuenta de puntos · Vorka México', ruta: '/tienda/cuenta/', noindex: true,
    head: `<style>${CSS}</style>`, script: SCRIPT_CUENTA,
    cuerpo: `
<section class="t-sec t-cab"><div class="marco t-estrecho">
  <a class="t-volver" href="/tienda/">← Tienda</a>
  <span class="etiqueta">Mi cuenta · ${esc(c.email)}</span>
  <h1 class="h1 t-titulo">Tienes <span class="metal">${s.disponibles} ${s.disponibles === 1 ? 'punto' : 'puntos'}</span></h1>
  <p class="lead">Equivalen a ${pesos(s.disponibles * 100)} de descuento en cualquier producto de la tienda. ${s.apartados ? `(${s.apartados} apartados en una compra por pagar.) ` : ''}Llevas ${ventas.n} ${ventas.n === 1 ? 'compra' : 'compras'} con tu liga.</p>
  <div class="botones"><a class="btn tinta" href="/tienda/">Usar mis puntos en la tienda ${FLECHA}</a></div>
</div></section>
<section class="t-sec suave"><div class="marco t-estrecho">
  <span class="etiqueta">Tu liga para compartir</span><h2 class="h2 t-h2-sec">Por cada compra con tu liga, ${PUNTOS_POR_COMPRA} puntos</h2>
  <p class="t-nota">Tu código es <b>${esc(code)}</b>. Funciona en cualquier página de la tienda; la persona tiene 30 días para comprar.</p>
  <div class="pt-ligas">${COMPARTIBLES.map(([t, r, d]) => `<div class="pt-liga"><div><b>${esc(t)}</b><small>${esc(d)}</small><code>${esc(liga(r).replace(/^https:\/\//, ''))}</code></div>
    <div class="pt-acc"><button class="btn blanco chico" type="button" data-copiar="${esc(liga(r))}">Copiar</button><button class="btn tinta chico" type="button" data-compartir="${esc(`${t}: ${liga(r)}`)}">Compartir</button></div></div>`).join('')}</div>
  <ul class="t-lista" style="margin-top:18px">${REGLAS.map(r => `<li>${CHECK}<span>${r}</span></li>`).join('')}</ul>
</div></section>
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Movimientos</span>
  ${movs.length ? `<div class="pt-movs">${movs.map(m => `<div class="pt-mov"><span><b>${TIPO[m.tipo] || m.tipo}</b><small>${esc(m.nota || '')} · ${fecha(m.created_at)}</small></span><b class="num ${m.puntos >= 0 ? 'mas' : 'menos'}">${m.puntos >= 0 ? '+' : ''}${m.puntos}</b></div>`).join('')}</div>`
    : '<p class="t-nota">Todavía no tienes movimientos. Comparte tu liga y aquí verás cada compra.</p>'}
  <p class="t-nota" style="margin-top:22px"><button class="t-enlace" type="button" id="pt-salir">Cerrar sesión</button> · <a href="/legal/terminos/#puntos">Condiciones del programa</a></p>
</div></section>`,
  });
}

const SCRIPT_ENTRAR = `(function(){
  var f=document.getElementById('form-puntos'); if(!f) return;
  var err=document.getElementById('pe-err'), ok=document.getElementById('pe-ok'), b=f.querySelector('button');
  f.addEventListener('submit',function(e){ e.preventDefault(); err.hidden=true;
    if(!f.email.checkValidity()||!f.email.value){ err.textContent='Escribe un correo válido.'; err.hidden=false; return; }
    if(!f.terminos.checked){ err.textContent='Acepta las condiciones del programa.'; err.hidden=false; return; }
    b.disabled=true;
    fetch('/api/puntos/entrar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value.trim(),nombre:f.nombre.value,terminos:true})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ b.disabled=false; if(x.ok&&x.j.enlace){ location.href=x.j.enlace; return; } if(x.ok){ ok.textContent='Listo: revisa tu correo y toca “Entrar a mi cuenta”. Si no llega, busca en spam.'; ok.hidden=false; f.querySelectorAll('input,button').forEach(function(i){i.disabled=true;}); } else { err.textContent=x.j.error||'No se pudo. Intenta de nuevo.'; err.hidden=false; } })
      .catch(function(){ b.disabled=false; err.textContent='Sin conexión.'; err.hidden=false; });
  });
})();`;

const SCRIPT_CUENTA = `(function(){
  document.querySelectorAll('[data-copiar]').forEach(function(b){ b.onclick=function(){ navigator.clipboard&&navigator.clipboard.writeText(b.dataset.copiar).then(function(){ b.textContent='Copiada'; setTimeout(function(){ b.textContent='Copiar'; },1600); }); }; });
  document.querySelectorAll('[data-compartir]').forEach(function(b){ b.onclick=function(){ var t=b.dataset.compartir; if(navigator.share) navigator.share({text:t}).catch(function(){}); else if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ b.textContent='Copiado'; }); }; });
  var s=document.getElementById('pt-salir'); if(s) s.onclick=function(){ fetch('/api/puntos/salir',{method:'POST'}).then(function(){ location.href='/tienda/puntos/'; }); };
})();`;

const CSS = `
.pt-ligas{display:grid;gap:10px}
.pt-liga{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;background:#fff;border:1px solid var(--line,#e7e2da);border-radius:16px;padding:14px 16px}
.pt-liga>div:first-child{min-width:0;flex:1 1 240px}.pt-liga small{display:block;color:var(--fg-2,#5c5a57);font-size:14px}.pt-liga code{display:block;font-size:13px;margin-top:6px;word-break:break-all;color:var(--fg-2,#5c5a57)}
.pt-acc{display:flex;gap:8px}
.pt-movs{display:grid;gap:0;border-top:1px solid var(--line,#e7e2da)}
.pt-mov{display:flex;justify-content:space-between;gap:12px;padding:12px 2px;border-bottom:1px solid var(--line,#e7e2da)}.pt-mov small{display:block;color:var(--fg-2,#5c5a57);font-size:13.5px}
.pt-mov .mas{color:#1f7a4d}.pt-mov .menos{color:#a23b2a}
.t-enlace{background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}`;
