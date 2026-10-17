// Simulador PAA (vorka.mx/simulador-paa): app de práctica que se desbloquea con una compra pagada en la tienda.
//
// /simulador-paa/                 → la app si hay acceso; si no, página de venta con el botón a la tienda
// /simulador-paa/entrar/<token>   → valida el token del correo de compra y deja la cookie de acceso
// /simulador-paa/app.js|app.css   → cliente (público: no trae respuestas)
// /api/simulador-paa/banco        → reactivos con respuestas y explicaciones (solo con acceso)
// /api/simulador-paa/yo           → nombre, correo e historial de resultados
// /api/simulador-paa/resultados   → POST guarda un resultado
// /api/simulador-paa/salir        → POST borra la cookie
//
// Acceso: cookie HttpOnly firmada con HMAC (DOWNLOAD_TOKEN_SECRET). En cada petición se revisa en D1 que la orden
// siga pagada (un reembolso corta el acceso) y que esté dentro de su año de vigencia.
import { one, all, run, json, fail, enc, hex, iguales } from '../util.js';
import { hashToken } from '../entrega.js';
import { pagina, aviso, esc, nonce, seguridad } from '../paginas.js';
import { productoPorSlug } from '../modelo.js';
import { FLECHA, CHECK, LOGO, VERSION } from '../marco.generado.js';
import { SECCIONES, TEMAS, TEXTOS, REACTIVOS } from './banco.js';
import { APP_JS, APP_CSS } from './cliente.generado.js';

export const APP = 'simulador-paa';
const RUTA = '/simulador-paa';
const COOKIE = 'vk_paa';
export const VIGENCIA_DIAS = 365;
const MAX_RESULTADO = 60_000;   // bytes de JSON por resultado
const MAX_HISTORIAL = 60;       // resultados que se guardan por compra
const OS = 'https://os.vorka.mx'; // boletín de la Revista Sparks
const SIN_REFERER = { 'referrer-policy': 'no-referrer' };

const versionDe = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
const V_JS = versionDe(APP_JS), V_CSS = versionDe(APP_CSS);

// ---------- firma de la cookie ----------
async function firma(env, texto) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const llave = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`simulador|${texto}`)));
}

export async function cookieAcceso(env, orderId, venceMs) {
  const exp = Math.floor(venceMs / 1000);
  const valor = `${orderId}.${exp}.${await firma(env, `${orderId}.${exp}`)}`;
  const maxAge = Math.max(0, exp - Math.floor(Date.now() / 1000));
  return `${COOKIE}=${valor}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}
const cookieBorrar = () => `${COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;

function leerCookie(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

// Orden pagada que incluye un producto con acceso a esta app. Devuelve { orden, vence } o null.
export async function ordenConAcceso(env, orderId, ahora = Date.now()) {
  const orden = await one(env, "SELECT * FROM orders WHERE id = ? AND estado = 'paid'", orderId);
  if (!orden) return null;
  const items = await all(env, 'SELECT p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', orderId);
  const tiene = items.some(i => { try { return JSON.parse(i.contenido || '{}').acceso?.app === APP; } catch { return false; } });
  if (!tiene) return null;
  const vence = new Date(orden.paid_at || orden.created_at).getTime() + VIGENCIA_DIAS * 864e5;
  if (vence < ahora) return null;
  return { orden, vence };
}

export async function accesoDe(env, req, ahora = Date.now()) {
  const c = leerCookie(req);
  const m = c && c.match(/^([0-9a-f-]{36})\.(\d{9,11})\.([0-9a-f]{64})$/);
  if (!m) return null;
  const [, orderId, exp, sig] = m;
  if (Number(exp) * 1000 < ahora) return null;
  if (!iguales(sig, await firma(env, `${orderId}.${exp}`))) return null;
  return ordenConAcceso(env, orderId, ahora);
}

// ---------- rutas ----------
export async function rutasSimulador(req, env, url) {
  const p = url.pathname;
  if (!p.startsWith(RUTA) && !p.startsWith('/api/simulador-paa')) return null;
  const M = req.method;

  if (p === `${RUTA}/app.js`) return estatico(APP_JS, 'text/javascript; charset=utf-8');
  if (p === `${RUTA}/app.css`) return estatico(APP_CSS, 'text/css; charset=utf-8');

  const ent = p.match(/^\/simulador-paa\/entrar\/([^/]{1,100})\/?$/);
  if (ent && (M === 'GET' || M === 'HEAD')) return entrar(env, ent[1]);

  if ((p === RUTA || p === `${RUTA}/`) && (M === 'GET' || M === 'HEAD')) {
    if (p === RUTA) return Response.redirect(`${url.origin}${RUTA}/`, 301);
    const a = await accesoDe(env, req);
    return a ? appShell(a) : paginaVenta(env);
  }

  if (p.startsWith('/api/simulador-paa/')) {
    if (p === '/api/simulador-paa/salir' && M === 'POST')
      return json({ ok: true }, 200, { 'set-cookie': cookieBorrar() });
    const a = await accesoDe(env, req);
    if (!a) return fail('Tu acceso no está activo. Entra con el enlace de tu correo de compra.', 401);
    if (p === '/api/simulador-paa/banco' && M === 'GET')
      return json({ secciones: SECCIONES, temas: TEMAS, textos: TEXTOS, reactivos: REACTIVOS }, 200, { 'cache-control': 'private, max-age=300' });
    if (p === '/api/simulador-paa/yo' && M === 'GET') return yo(env, a);
    if (p === '/api/simulador-paa/resultados' && M === 'POST') return guardarResultado(req, env, a);
    return fail('No encontrado', 404);
  }
  return null;
}

const estatico = (cuerpo, tipo) => new Response(cuerpo, {
  headers: { 'content-type': tipo, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
});

async function entrar(env, token) {
  if (!/^[a-f0-9]{64}$/.test(token)) return errorAcceso('invalido');
  const t = await one(env, 'SELECT * FROM download_tokens WHERE token_hash = ?', await hashToken(env, token));
  if (!t || t.revocado) return errorAcceso('invalido');
  // El token de descarga dura 7 días, pero el acceso al simulador dura un año desde la compra:
  // un token vencido sigue demostrando la compra (la vigencia la decide la orden).
  const a = await ordenConAcceso(env, t.order_id);
  if (!a) {
    const pagada = await one(env, "SELECT paid_at FROM orders WHERE id = ? AND estado = 'paid'", t.order_id);
    return errorAcceso(pagada ? 'vencido' : 'revocado');
  }
  return new Response(null, { status: 303, headers: { location: `${RUTA}/`, 'set-cookie': await cookieAcceso(env, a.orden.id, a.vence), 'cache-control': 'no-store', ...SIN_REFERER } });
}

function errorAcceso(motivo) {
  const t = {
    invalido: ['Enlace no válido', 'Revisa que hayas abierto el enlace completo de tu correo de compra. Si sigue sin funcionar, pide uno nuevo con el correo con el que compraste.'],
    vencido: ['Tu acceso terminó', `El acceso al simulador dura ${VIGENCIA_DIAS} días desde la compra. Puedes volver a comprarlo en la tienda.`],
    revocado: ['Este acceso ya no está activo', 'Si crees que es un error, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y lo revisamos.'],
  }[motivo];
  const extra = motivo === 'invalido'
    ? `<div class="botones t-centro"><a class="btn tinta" href="/descargas/reenviar">Pedir un enlace nuevo ${FLECHA}</a></div>`
    : motivo === 'vencido' ? `<div class="botones t-centro"><a class="btn tinta" href="/tienda/simulador-paa">Ir a la tienda ${FLECHA}</a></div>` : '';
  return pagina({ titulo: `${t[0]} · Simulador PAA`, ruta: `${RUTA}/`, noindex: true, status: motivo === 'invalido' ? 404 : 410, headers: SIN_REFERER,
    cuerpo: aviso({ clase: 'alerta', titulo: t[0], texto: t[1], extra }) });
}

async function yo(env, a) {
  const filas = await all(env, 'SELECT id, modo, resultado, created_at FROM simulador_resultados WHERE order_id = ? AND app = ? ORDER BY created_at DESC LIMIT ?', a.orden.id, APP, MAX_HISTORIAL);
  const historial = filas.map(f => { try { return { id: f.id, modo: f.modo, fecha: f.created_at, ...JSON.parse(f.resultado) }; } catch { return null; } }).filter(Boolean);
  return json({ nombre: a.orden.nombre, email: a.orden.email, vence: new Date(a.vence).toISOString(), historial });
}

async function guardarResultado(req, env, a) {
  const texto = await req.text();
  if (texto.length > MAX_RESULTADO) return fail('Resultado demasiado grande.', 413);
  let r; try { r = JSON.parse(texto); } catch { return fail('Resultado inválido.'); }
  if (!r || typeof r !== 'object' || !['completo', 'seccion', 'practica'].includes(r.modo)) return fail('Resultado inválido.');
  // Solo se guardan los campos que el dashboard usa
  const limpio = {
    modo: r.modo,
    secciones: Array.isArray(r.secciones) ? r.secciones.slice(0, 4).map(s => ({
      id: String(s.id || '').slice(0, 20), puntaje: num(s.puntaje, 200, 800), aciertos: num(s.aciertos, 0, 100),
      segundo: num(s.segundo, 0, 100), total: num(s.total, 0, 100), tiempo: num(s.tiempo, 0, 36000), limite: num(s.limite, 0, 36000), sinResponder: num(s.sinResponder, 0, 100),
    })) : [],
    temas: r.temas && typeof r.temas === 'object' ? Object.fromEntries(Object.entries(r.temas).filter(([k]) => TEMAS[k]).map(([k, v]) => [k, { ok: num(v?.ok, 0, 100), total: num(v?.total, 0, 100) }])) : {},
    fallados: Array.isArray(r.fallados) ? r.fallados.filter(id => typeof id === 'string' && id.length < 40).slice(0, 100) : [],
    global: r.global == null ? null : num(r.global, 200, 800),
    meta: num(r.meta, 200, 800),
    confianza: num(r.confianza, 0, 100),
  };
  await run(env, 'INSERT INTO simulador_resultados (order_id, app, modo, resultado) VALUES (?,?,?,?)', a.orden.id, APP, limpio.modo, JSON.stringify(limpio));
  // Conserva solo los más recientes
  await run(env, `DELETE FROM simulador_resultados WHERE order_id = ? AND app = ? AND id NOT IN
    (SELECT id FROM simulador_resultados WHERE order_id = ? AND app = ? ORDER BY created_at DESC, id DESC LIMIT ?)`, a.orden.id, APP, a.orden.id, APP, MAX_HISTORIAL);
  return json({ ok: true });
}
const num = (v, min, max) => { const n = Math.round(Number(v) || 0); return Math.min(max, Math.max(min, n)); };

// ---------- páginas ----------
function appShell(a) {
  const n = nonce();
  const cab = seguridad(n);
  // El botón del boletín de la Revista Sparks se suscribe directo en os.vorka.mx (CORS para vorka.mx)
  cab['content-security-policy'] = cab['content-security-policy'].replace("connect-src 'self'", `connect-src 'self' ${OS}`);
  const html = `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Simulador PAA · Vorka México</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#FBFAF8">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/vorka.css?v=${VERSION}">
<link rel="stylesheet" href="${RUTA}/app.css?v=${V_CSS}">
</head>
<body class="sim">
<a class="saltar" href="#app">Saltar al contenido</a>
<header class="sim-barra">
  <a class="sim-marca" href="${RUTA}/" aria-label="Simulador PAA, inicio">${LOGO}<span>Simulador <b>PAA</b></span></a>
  <div class="sim-barra-der" id="barra-der"></div>
</header>
<main id="app" class="sim-main" tabindex="-1" aria-live="polite">
  <div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Preparando tu simulador…</div>
</main>
<script nonce="${n}">window.SIM = ${JSON.stringify({ nombre: a.orden.nombre.split(' ')[0], os: OS, logo: LOGO, check: CHECK, flecha: FLECHA }).replace(/</g, '\\u003c')};</script>
<script src="${RUTA}/app.js?v=${V_JS}" defer></script>
</body>
</html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...cab } });
}

async function paginaVenta(env) {
  const prod = await productoPorSlug(env, APP);
  const precio = prod ? `$${(prod.precio_centavos / 100).toLocaleString('es-MX')} MXN` : null;
  const secciones = SECCIONES.map(s => `<li class="sv-sec"><b>${esc(s.nombre)}</b><span>${s.reactivos} reactivos · ${s.minutos} min</span><small>${esc(s.descripcion)}</small></li>`).join('');
  const cta = prod
    ? `<a class="btn tinta" href="/tienda/${APP}">Comprar acceso · ${precio} ${FLECHA}</a>`
    : `<span class="btn blanco" aria-disabled="true">Muy pronto en la tienda</span>`;
  const total = SECCIONES.reduce((s, x) => s + x.reactivos, 0), min = SECCIONES.reduce((s, x) => s + x.minutos, 0);
  return pagina({
    titulo: 'Simulador PAA · Vorka México', ruta: `${RUTA}/`,
    descripcion: 'Simulacros tipo PAA (Lectura, Redacción, Matemáticas e Inglés) con tutor de dos intentos, explicación paso a paso y medidor de preparación.',
    head: `<style>
.sv-hero{padding:clamp(120px,14vw,170px) 0 clamp(48px,6vw,80px)}
.sv-hero .t-lead{margin-top:18px;max-width:620px}
.sv-hero .botones{margin-top:28px}
.sv-mini{margin-top:14px;font-size:14px;color:var(--fg-2)}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:28px}
.sv-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;box-shadow:var(--sombra)}
.sv-card h3{font-size:18px;letter-spacing:-.02em;margin-bottom:8px}
.sv-card p{color:var(--fg-2);font-size:15.5px}
.sv-secs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:22px}
.sv-sec{display:flex;flex-direction:column;gap:4px;background:var(--bg-2);border-radius:18px;padding:18px}
.sv-sec span{font-size:13.5px;font-weight:650;color:var(--morado)}
.sv-sec small{font-size:14px;color:var(--fg-2);line-height:1.45}
.sv-ya{margin-top:40px;padding:22px;border-radius:var(--r);border:1px dashed var(--line-2);display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}
.sv-ya p{color:var(--fg-2);font-size:15.5px;max-width:520px}
</style>`,
    cuerpo: `
<section class="sv-hero"><div class="marco t-estrecho">
  <span class="etiqueta">Prueba de Aptitud Académica</span>
  <h1 class="t-h1">Practica la PAA como si fuera el día del examen</h1>
  <p class="t-lead">Simulacros cortos con la misma exigencia de tiempo que la prueba real. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice exactamente qué reforzar.</p>
  <div class="botones">${cta}</div>
  <p class="sv-mini">${total} reactivos · ${min} minutos · Lectura, Redacción, Matemáticas e Inglés</p>
  <div class="sv-grid">
    <div class="sv-card"><h3>Tutor de dos intentos</h3><p>Primer error: una pista de método, sin darte la respuesta. Segundo intento: la solución paso a paso y la regla detrás.</p></div>
    <div class="sv-card"><h3>Medidor de preparación</h3><p>Puntaje estimado por sección en escala 200–800, distancia a tu meta y nivel de confianza basado en tus datos.</p></div>
    <div class="sv-card"><h3>Refuerzo dirigido</h3><p>Ves qué temas te restan más puntos y practicas solo esos. Tu historial se guarda para medir tu avance.</p></div>
  </div>
  <h2 class="h3" style="margin-top:56px">Qué incluye cada simulacro</h2>
  <ul class="sv-secs">${secciones}</ul>
  <div class="sv-ya"><p><b>¿Ya lo compraste?</b> Entra con el botón de tu correo de compra. Si cambiaste de dispositivo o no encuentras el correo, te mandamos un enlace nuevo.</p><a class="btn blanco chico" href="/descargas/reenviar">Recibir mi enlace ${FLECHA}</a></div>
  <p class="t-nota" style="margin-top:24px">Simulador de práctica de Vorka México con reactivos originales. No está afiliado al College Board; el puntaje es una estimación para orientar tu estudio.</p>
</div></section>`,
  });
}
