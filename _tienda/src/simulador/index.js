// Simulador PAA (vorka.mx/simulador-paa): app de práctica que se desbloquea con una compra pagada en la tienda.
//
// /simulador-paa/                 → la app si hay acceso; si no, página de venta con el botón a la tienda
// /simulador-paa/entrar/<token>   → valida el token del correo de compra y deja la cookie de acceso
// /simulador-paa/app.js|app.css   → cliente (público: no trae respuestas)
// /api/simulador-paa/banco        → reactivos con respuestas y explicaciones (solo con acceso)
// /api/simulador-paa/yo           → nombre, correo e historial de resultados
// /api/simulador-paa/resultados   → POST guarda un resultado
// /api/simulador-paa/iniciar      → POST abre un simulacro completo (gasta 1 intento; si hay uno abierto, lo retoma)
// /api/simulador-paa/abandonar    → POST cierra el simulacro abierto (el intento ya se gastó)
// /api/simulador-paa/salir        → POST borra la cookie
//
// Acceso: cookie HttpOnly firmada con HMAC (DOWNLOAD_TOKEN_SECRET). En cada petición se revisa en D1 que la orden
// siga pagada (un reembolso corta el acceso) y que esté dentro de su año de vigencia.
//
// Planes (migración 0029): "Práctica ilimitada" ($199: Calentamientos, Medios y práctica sin límite), "Simulador completo"
// ($249: 2 exámenes Oficiales) y el "Paquete completo" ($379: los dos). La compra del simulador de antes (simulador-paa)
// conserva lo que traía: 2 Calentamientos, 2 Medios y 1 Oficial. "Simulacro adicional" ($50) suma 1 corto y "Examen PAA
// completo adicional" ($100) suma 1 examen. Todo se suma por correo del comprador; secciones y práctica por tema son libres.
import { one, all, run, json, fail, enc, hex, iguales } from '../util.js';
import { hashToken } from '../entrega.js';
import { pagina, aviso, esc, nonce, seguridad } from '../paginas.js';
import { productoPorSlug } from '../modelo.js';
import { formCompra, SCRIPT_COMPRA, precio, refDeVisita } from '../tienda.js';
import { FLECHA, CHECK, LOGO, VERSION } from '../marco.generado.js';
import { SECCIONES, SECCIONES_EXAMEN, TEMAS, TEXTOS, REACTIVOS } from './banco.js';
import { armarCompleto, armarExamen, armarCalentamiento } from './armar.js';
import { SECCIONES_CALENTAMIENTO, INCLUIDOS } from './niveles.js';
import { APP_JS, APP_CSS } from './cliente.generado.js';

export const APP = 'simulador-paa';
const RUTA = '/simulador-paa';
const COOKIE = 'vk_paa';
export const VIGENCIA_DIAS = 365;
const MAX_RESULTADO = 60_000;   // bytes de JSON por resultado
const MAX_HISTORIAL = 60;       // resultados que se guardan por compra
export const SLUG_INTENTO = 'simulador-paa-intento';
export const SLUG_EXAMEN = 'simulador-paa-examen';   // examen PAA completo adicional ($100)
// Planes (oct 2026), para que se complementen: Práctica ilimitada (Calentamientos, Medios y práctica por sección y por tema sin
// límite), Simulador completo (2 exámenes oficiales como la PAA real, con reporte) y el paquete con los dos. La compra de siempre
// (producto sin acceso.tipo, ya no está a la venta) conserva lo que traía: 2 Calentamientos, 2 Medios, 1 Oficial y práctica libre.
export const PLANES = { practica: 'simulador-paa-practica', completo: 'simulador-paa-completo', paquete: 'simulador-paa-paquete' };
const ILIMITADO = 9999;
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

const accesoDeItem = c => { try { const a = JSON.parse(c || '{}').acceso; return a?.app === APP ? a : null; } catch { return null; } };

// Compras pagadas de este correo con productos de la app: [{ orden_id, paid_at, cantidad, acceso }]
async function comprasDe(env, email) {
  const filas = await all(env, `SELECT o.id orden_id, o.paid_at, o.created_at, i.cantidad, p.contenido FROM orders o
    JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
    WHERE o.email = ? AND o.estado = 'paid' AND o.regalo = 0
      AND (o.regalo_de IS NULL OR EXISTS (SELECT 1 FROM orders g WHERE g.id = o.regalo_de AND g.estado = 'paid'))
    ORDER BY o.paid_at DESC`, String(email).toLowerCase());
  return filas.map(f => ({ ...f, acceso: accesoDeItem(f.contenido) })).filter(f => f.acceso);
}
// Compra base = el simulador; 'intento' suma simulacros cortos y 'examen' suma exámenes completos
const esBase = c => c.acceso.tipo !== 'intento' && c.acceso.tipo !== 'examen';

// La cookie puede ser de la compra del simulador o de un simulacro adicional: el acceso siempre lo da
// la compra base más reciente del mismo correo (pagada y dentro de su año). Devuelve { orden (base), vence } o null.
export async function ordenConAcceso(env, orderId, ahora = Date.now()) {
  const orden = await one(env, "SELECT * FROM orders WHERE id = ? AND estado = 'paid'", orderId);
  if (!orden) return null;
  const base = (await comprasDe(env, orden.email)).find(esBase);
  if (!base) return null;
  const vence = new Date(base.paid_at || base.created_at).getTime() + VIGENCIA_DIAS * 864e5;
  if (vence < ahora) return null;
  const ordenBase = base.orden_id === orden.id ? orden : await one(env, 'SELECT * FROM orders WHERE id = ?', base.orden_id);
  return { orden: ordenBase, vence };
}

// Intentos por tipo: 'corto' (simulacro de 46 reactivos) o 'examen' (examen PAA completo, estructura real).
// Base: 2 cortos + 1 examen (también para quien compró antes de que existiera el examen). Adicionales: lo que diga el producto.
// Un intento abandonado también cuenta: si no, bastaría con abandonar para cambiar de preguntas gratis.
const cuantos = (c, tipo) => {
  const a = c.acceso;
  if (a.ilimitado && (tipo === 'calentamiento' || tipo === 'corto')) return ILIMITADO;
  if (tipo === 'calentamiento') return a.calentamientos != null ? Number(a.calentamientos) || 0 : esBase(c) ? INCLUIDOS.calentamiento : 0;
  if (tipo === 'examen') return a.examenes != null ? Number(a.examenes) || 0 : esBase(c) ? 1 : a.tipo === 'examen' ? 1 : 0;
  return a.intentos != null ? Number(a.intentos) || 0 : esBase(c) ? 2 : a.tipo === 'intento' ? 1 : 0;
};
export async function cuentaIntentos(env, email, tipo = 'corto') {
  const compras = await comprasDe(env, email);
  const incluidos = compras.reduce((s, c) => s + cuantos(c, tipo) * (c.cantidad || 1), 0);
  const usados = (await one(env, 'SELECT COUNT(*) n FROM simulador_intentos WHERE email = ? AND app = ? AND tipo = ?', email, APP, tipo)).n;
  const abierto = await one(env, "SELECT id, items FROM simulador_intentos WHERE email = ? AND app = ? AND tipo = ? AND estado = 'abierto' ORDER BY id DESC LIMIT 1", email, APP, tipo);
  const ilimitado = incluidos >= ILIMITADO;
  return { incluidos: ilimitado ? null : incluidos, usados, disponibles: ilimitado ? ILIMITADO : Math.max(0, incluidos - usados), ilimitado, abierto: abierto ? { id: abierto.id, items: JSON.parse(abierto.items) } : null };
}

// Reactivos que ya salieron en sus simulacros completos (para no repetirlos en el siguiente)
export async function vistosDe(env, email) {
  const filas = await all(env, 'SELECT items FROM simulador_intentos WHERE email = ? AND app = ?', email, APP);
  return new Set(filas.flatMap(f => { try { return JSON.parse(f.items).flat(); } catch { return []; } }));
}

// Solo puede comprar simulacros adicionales quien ya tiene el simulador (lo revisa /api/checkout)
export async function puedeComprarIntento(env, email) {
  return (await comprasDe(env, email)).some(esBase);
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
    return a ? appShell(a) : paginaVenta(env, req, url);
  }

  if (p.startsWith('/api/simulador-paa/')) {
    if (p === '/api/simulador-paa/salir' && M === 'POST')
      return json({ ok: true }, 200, { 'set-cookie': cookieBorrar() });
    const a = await accesoDe(env, req);
    if (!a) return fail('Tu acceso no está activo. Entra con el enlace de tu correo de compra.', 401);
    if (p === '/api/simulador-paa/banco' && M === 'GET')
      return json({ secciones: SECCIONES, examen: SECCIONES_EXAMEN, calentamiento: SECCIONES_CALENTAMIENTO, temas: TEMAS, textos: TEXTOS, reactivos: REACTIVOS }, 200, { 'cache-control': 'private, max-age=300' });
    if (p === '/api/simulador-paa/yo' && M === 'GET') return yo(env, a);
    if (p === '/api/simulador-paa/resultados' && M === 'POST') return guardarResultado(req, env, a);
    if (p === '/api/simulador-paa/iniciar' && M === 'POST') { const t = (await req.json().catch(() => ({}))).tipo; return iniciar(env, a, ['examen', 'calentamiento'].includes(t) ? t : 'corto'); }
    if (p === '/api/simulador-paa/abandonar' && M === 'POST') return abandonar(req, env, a);
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
  const filas = await all(env, `SELECT id, modo, resultado, created_at FROM simulador_resultados
    WHERE order_id IN (SELECT id FROM orders WHERE email = ?) AND app = ? ORDER BY created_at DESC LIMIT ?`, a.orden.email, APP, MAX_HISTORIAL);
  const historial = filas.map(f => { try { return { id: f.id, modo: f.modo, fecha: f.created_at, ...JSON.parse(f.resultado) }; } catch { return null; } }).filter(Boolean);
  const intentos = await cuentaIntentos(env, a.orden.email), examenes = await cuentaIntentos(env, a.orden.email, 'examen'), calentamientos = await cuentaIntentos(env, a.orden.email, 'calentamiento');
  const extra = await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', SLUG_INTENTO);
  const extraEx = await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', SLUG_EXAMEN);
  return json({ nombre: a.orden.nombre, email: a.orden.email, vence: new Date(a.vence).toISOString(), historial,
    ...(await planDe(env, a.orden.email)),
    intentos, examenes, calentamientos, vistos: [...await vistosDe(env, a.orden.email)],
    intentoExtra: extra ? { slug: SLUG_INTENTO, precio_centavos: extra.precio_centavos } : null,
    examenExtra: extraEx ? { slug: SLUG_EXAMEN, precio_centavos: extraEx.precio_centavos } : null });
}

// Qué tiene esta persona (practica: sin límite · completo: exámenes oficiales · legado: la compra de antes) y los planes a la
// venta (para invitarla a llevarse el que le falta)
export async function planDe(env, email) {
  const compras = await comprasDe(env, email);
  const plan = { practica: compras.some(c => c.acceso.ilimitado), completo: compras.some(c => c.acceso.tipo === 'completo' || c.acceso.tipo === 'paquete'), legado: compras.some(c => esBase(c) && !c.acceso.tipo) };
  const ofertas = {};
  for (const [k, slug] of Object.entries(PLANES)) { const p = await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', slug); if (p) ofertas[k] = { slug, precio_centavos: p.precio_centavos }; }
  return { plan, ofertas };
}

// Abre un simulacro corto o un examen completo: retoma el abierto o gasta un intento y arma los reactivos en el servidor
async function iniciar(env, a, tipo = 'corto') {
  const email = a.orden.email;
  const c = await cuentaIntentos(env, email, tipo);
  if (c.abierto) return json({ id: c.abierto.id, items: c.abierto.items, retomado: true, tipo, intentos: c });
  if (c.disponibles <= 0) return json({ error: !c.usados && !c.incluidos ? (tipo === 'examen' ? 'El examen oficial viene en el Simulador completo.' : 'Los simulacros de práctica vienen en la Práctica ilimitada.') : tipo === 'examen' ? 'Ya usaste tus exámenes oficiales. Compra uno adicional para seguir.' : tipo === 'calentamiento' ? 'Ya usaste tus calentamientos. Sigue con el nivel Medio.' : 'Ya usaste tus simulacros de nivel Medio. Compra uno adicional para seguir.', sinIntentos: true, tipo, intentos: c }, 402);
  const vistos = await vistosDe(env, email);
  const items = tipo === 'examen' ? armarExamen(Math.random, vistos) : tipo === 'calentamiento' ? armarCalentamiento(Math.random, vistos) : armarCompleto(Math.random, vistos);
  const r = await run(env, 'INSERT INTO simulador_intentos (email, app, items, tipo) VALUES (?,?,?,?)', email, APP, JSON.stringify(items), tipo);
  const id = r.meta.last_row_id ?? (await one(env, 'SELECT id FROM simulador_intentos WHERE email = ? ORDER BY id DESC LIMIT 1', email)).id;
  return json({ id, items, retomado: false, tipo, intentos: await cuentaIntentos(env, email, tipo) });
}

async function abandonar(req, env, a) {
  const b = await req.json().catch(() => ({}));
  await run(env, "UPDATE simulador_intentos SET estado = 'abandonado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto'", new Date().toISOString(), Number(b.id) || 0, a.orden.email);
  return json({ ok: true, intentos: await cuentaIntentos(env, a.orden.email), examenes: await cuentaIntentos(env, a.orden.email, 'examen'), calentamientos: await cuentaIntentos(env, a.orden.email, 'calentamiento') });
}

async function guardarResultado(req, env, a) {
  const texto = await req.text();
  if (texto.length > MAX_RESULTADO) return fail('Resultado demasiado grande.', 413);
  let r; try { r = JSON.parse(texto); } catch { return fail('Resultado inválido.'); }
  if (!r || typeof r !== 'object' || !['calentamiento', 'completo', 'examen', 'seccion', 'practica'].includes(r.modo)) return fail('Resultado inválido.');
  // El simulacro completo solo se guarda si corresponde a un intento abierto de este comprador (y lo cierra)
  if (['calentamiento', 'completo', 'examen'].includes(r.modo)) {
    const cerrado = await run(env, "UPDATE simulador_intentos SET estado = 'terminado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto' AND tipo = ?",
      new Date().toISOString(), Number(r.intento) || 0, a.orden.email, r.modo === 'examen' ? 'examen' : r.modo === 'calentamiento' ? 'calentamiento' : 'corto');
    if (!cerrado.meta.changes) return fail('Este simulacro ya no está abierto.', 409);
  }
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

// ---------- página pública (la que encuentra Google) ----------
const SITIO = 'https://vorka.mx';
const OG = `${SITIO}/tienda/img/portadas/simulador-paa-og.png`;
const EXAMEN_REACTIVOS = SECCIONES_EXAMEN.reduce((t, x) => t + x.reactivos, 0), EXAMEN_HORAS = SECCIONES_EXAMEN.reduce((t, x) => t + x.minutos, 0) / 60;
const CORTO_REACTIVOS = SECCIONES.reduce((t, x) => t + x.reactivos, 0);
const CAL_REACTIVOS = SECCIONES_CALENTAMIENTO.reduce((t, x) => t + x.reactivos, 0);
const DESCRIPCION = 'Simulador PAA en línea con preguntas tipo examen de Lectura, Redacción, Matemáticas e Inglés, cronómetro real, tutor con pistas, explicación paso a paso y puntaje estimado.';
// Datos de la guía oficial de estudio de la PAA (College Board)
const FAQ_PAA = [
  { p: '¿Qué es la PAA?', r: 'La Prueba de Aptitud Académica (PAA) del College Board es un examen de admisión que usan universidades de México, Puerto Rico y América Latina. Evalúa razonamiento verbal y matemático, y aprovechamiento en español, matemáticas e inglés.' },
  { p: '¿Qué secciones tiene la PAA?', r: 'Cuatro: Lectura, Redacción, Matemáticas e Inglés. Según la guía oficial, Lectura, Redacción y Matemáticas duran 2 horas y 20 minutos, e Inglés 40 minutos. Las preguntas son de opción múltiple con cuatro opciones, y algunas de Matemáticas piden escribir la respuesta.' },
  { p: '¿Cómo se califica la PAA?', r: 'Cada sección se califica en una escala de 200 a 800 puntos y no se resta por respuesta incorrecta, así que conviene contestar todo. Nuestro simulador estima tu puntaje en esa misma escala para que veas qué tan cerca estás de tu meta.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA. No está afiliado al College Board y el puntaje es una estimación para orientar tu estudio.' },
  { p: '¿Hay reembolso?', r: 'Solo si aún no lo usas: puedes pedirlo dentro de los 5 días hábiles siguientes a tu compra escribiendo a hola@vorka.mx. Una vez que empiezas un simulacro, un examen o una práctica ya no hay reembolso, aunque no lo termines (igual que un archivo ya descargado). Si algo falla y no te deja usarlo, lo resolvemos o te devolvemos tu dinero. Detalles en la política de reembolsos.' },
  { p: '¿Qué plan me conviene?', r: `Son dos que se complementan. La Práctica ilimitada es para entrenar todos los días: Calentamientos (${CAL_REACTIVOS} reactivos) y simulacros de nivel Medio (${CORTO_REACTIVOS} reactivos, con tutor) sin límite, más práctica por sección y por tema. El Simulador completo es para medirte como el día del examen: 2 exámenes oficiales con la misma cantidad de preguntas, el mismo tiempo y la dificultad de la PAA real (${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, sin pistas). Lo ideal es practicar hasta que el simulador te diga que ya estás listo y cerrar con el examen completo: por eso el paquete trae los dos y te ahorra dinero.` },
  { p: '¿Se repiten las preguntas?', r: `El banco tiene ${REACTIVOS.length} reactivos originales y cada simulacro o examen prioriza los que todavía no has visto, así que tus primeros intentos traen preguntas prácticamente distintas. Las gráficas y figuras de Matemáticas son originales de Vorka México.` },
  { p: '¿Lo puedo regalar?', r: 'Sí. Al comprar elige Para regalar y cuántos: te llega una liga por cada regalo para que la compartas. Cada liga funciona una sola vez y el acceso queda a nombre de quien la abre, así que no se puede compartir.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, sin instalar nada. Tu historial se guarda en tu cuenta.' },
];

// Los planes de la página de venta, con lo que trae cada uno
const PLANES_VENTA = [
  { k: 'practica', nombre: 'Práctica ilimitada', para: 'Para entrenar todos los días', trae: () => ['Calentamientos y simulacros Medios sin límite', 'Práctica por sección y por tema', 'Tutor con pistas y explicación paso a paso', 'Puntaje estimado y qué reforzar'] },
  { k: 'completo', nombre: 'Simulador completo', para: 'Para medirte como el día del examen', trae: () => [`2 exámenes oficiales: ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas`, 'Mismos tiempos y dificultad que la PAA', 'Sin pistas: la revisión va al final', 'Reporte de preparación por sección'] },
  { k: 'paquete', nombre: 'Paquete completo', para: 'Practica sin límite y cierra con el examen', trae: () => ['Todo lo de la Práctica ilimitada', `Los 2 exámenes oficiales de ${EXAMEN_HORAS} horas`, 'Un año de acceso a todo'] },
];
async function paginaVenta(env, req, url) {
  // Planes a la venta; si todavía no están (antes de la migración 0029), la compra de siempre
  const planes = (await Promise.all(PLANES_VENTA.map(async x => ({ ...x, prod: await productoPorSlug(env, PLANES[x.k]) })))).filter(x => x.prod);
  const elegido = planes.find(x => x.k === url.searchParams.get('plan')) || planes.find(x => x.k === 'paquete') || planes[0];
  const prod = elegido?.prod || await productoPorSlug(env, APP);
  const ahorro = planes.length === 3 ? planes[0].prod.precio_centavos + planes[1].prod.precio_centavos - planes[2].prod.precio_centavos : 0;
  const selector = planes.length ? `<div class="sv-planes" role="radiogroup" aria-label="Elige tu plan">${planes.map(x => `<a class="sv-plan${x === elegido ? ' sel' : ''}${x.k === 'paquete' ? ' rec' : ''}" role="radio" aria-checked="${x === elegido}" href="?plan=${x.k}#comprar">
      ${x.k === 'paquete' && ahorro > 0 ? `<span class="sv-ahorro">Ahorra ${precio({ precio_centavos: ahorro })}</span>` : ''}<span class="sv-plan-c"><b>${x.nombre}</b><em class="num">${precio(x.prod)}</em></span><small>${x.para}</small>
      <ul>${x.trae().map(t => `<li>${CHECK}<span>${esc(t)}</span></li>`).join('')}</ul></a>`).join('')}</div>` : '';
  const { code, cookie } = await refDeVisita(env, req, url);
  const total = SECCIONES.reduce((s, x) => s + x.reactivos, 0), min = SECCIONES.reduce((s, x) => s + x.minutos, 0);
  const banco = REACTIVOS.length, lecturas = Object.keys(TEXTOS).length, temas = Object.keys(TEMAS).length;
  const ej = REACTIVOS.find(r => r.id === 'R-cnx-2');
  const precioTxt = prod ? precio(prod) : null;
  const IMG = `${SITIO}/tienda/img/portadas`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Simulador PAA en línea', description: DESCRIPCION, image: [`${IMG}/simulador-paa-v2.png`, OG, `${IMG}/simulador-paa-reporte.png`],
      brand: { '@type': 'Brand', name: 'Vorka México' }, category: 'Preparación para exámenes de admisión', sku: 'prod_simulador_paa',
      ...(planes.length ? { offers: { '@type': 'AggregateOffer', url: `${SITIO}${RUTA}/`, lowPrice: (Math.min(...planes.map(x => x.prod.precio_centavos)) / 100).toFixed(2), highPrice: (Math.max(...planes.map(x => x.prod.precio_centavos)) / 100).toFixed(2), offerCount: planes.length, priceCurrency: 'MXN', availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Vorka México' } } }
        : prod ? { offers: { '@type': 'Offer', url: `${SITIO}${RUTA}/`, price: (prod.precio_centavos / 100).toFixed(2), priceCurrency: prod.moneda, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Vorka México' } } } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_PAA.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tienda', item: `${SITIO}/tienda/` },
      { '@type': 'ListItem', position: 2, name: 'Simulador PAA', item: `${SITIO}${RUTA}/` }] },
  ];
  const secciones = SECCIONES.map(s => { const x = SECCIONES_EXAMEN.find(e => e.id === s.id); return `<tr><th scope="row"><span class="sv-dot s-${s.color}"></span>${esc(s.nombre)}</th><td class="num">${x.reactivos} · ${x.minutos} min</td><td class="num">${s.reactivos} · ${s.minutos} min</td><td>${esc(s.descripcion)}</td></tr>`; }).join('')
    + `<tr><th scope="row">Total</th><td class="num"><b>${EXAMEN_REACTIVOS} · ${EXAMEN_HORAS} h</b></td><td class="num">${total} · ${min} min</td><td></td></tr>`;
  const sinLetras = t => esc(String(t).replace(/\{([A-D])\}/g, '$1'));
  const ejemplo = { correcta: ej.correcta, pista: ej.pista, pasos: ej.pasos.map(x => x.replace(/\{([A-D])\}/g, '$1')), regla: ej.regla };
  const comparar = [
    ['Cronómetro con el ritmo real de la PAA', true, false],
    ['Pista de método cuando fallas (sin darte la respuesta)', true, false],
    ['Explicación paso a paso y la regla detrás', true, 'A veces'],
    ['Puntaje estimado por sección (200–800)', true, false],
    ['Plan de qué reforzar según tus errores', true, false],
    ['Preguntas nuevas en cada simulacro', true, false],
  ].map(([t, a, b]) => `<tr><th scope="row">${esc(t)}</th><td>${a === true ? `<span class="sv-si">${CHECK}<span class="sr">Sí</span></span>` : esc(a)}</td><td>${b === true ? `<span class="sv-si">${CHECK}</span>` : b ? esc(b) : '<span class="sv-no" aria-label="No">—</span>'}</td></tr>`).join('');
  const SCRIPT_EJEMPLO = `(function(){
  var box=document.getElementById('sv-ej'); if(!box) return;
  var D=${JSON.stringify(ejemplo).replace(/</g, '\\u003c')}, intentos=0, fin=false;
  var tutor=document.getElementById('sv-tutor');
  function li(t){var e=document.createElement('li');e.textContent=t;return e;}
  box.querySelectorAll('[data-o]').forEach(function(b){ b.addEventListener('click',function(){
    if(fin||b.disabled) return; var o=+b.dataset.o; intentos++;
    if(o===D.correcta||intentos>=2){ fin=true;
      box.querySelectorAll('[data-o]').forEach(function(x){ x.disabled=true; if(+x.dataset.o===D.correcta) x.classList.add('sv-ok'); });
      if(o!==D.correcta) b.classList.add('sv-mal');
      tutor.className='sv-tutor '+(o===D.correcta?'bien':'sol'); tutor.innerHTML='';
      var h=document.createElement('b'); h.textContent=o===D.correcta?(intentos===1?'¡Correcto a la primera!':'¡Bien! Lo lograste en el segundo intento'):'Esta era la respuesta correcta'; tutor.appendChild(h);
      var ol=document.createElement('ol'); D.pasos.forEach(function(p){ol.appendChild(li(p));}); tutor.appendChild(ol);
      var r=document.createElement('p'); r.innerHTML='<b>La regla:</b> '; r.appendChild(document.createTextNode(D.regla)); tutor.appendChild(r);
      var c=document.createElement('p'); c.className='sv-ej-cta'; c.innerHTML='Así funciona en cada uno de los ${banco} reactivos. <a href="#comprar">Quiero el simulador →</a>'; tutor.appendChild(c);
    } else { b.disabled=true; b.classList.add('sv-x');
      tutor.className='sv-tutor pista'; tutor.innerHTML='<b>Todavía no. Pista del tutor</b>'; var p=document.createElement('p'); p.textContent=D.pista; tutor.appendChild(p);
      var s=document.createElement('small'); s.textContent='Tienes un intento más.'; tutor.appendChild(s); }
    tutor.hidden=false;
  }); });
})();`;
  return pagina({
    titulo: 'Simulador PAA 2026 en línea: examen de práctica | Vorka México', ruta: `${RUTA}/`, descripcion: DESCRIPCION, imagen: OG,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: (prod ? SCRIPT_COMPRA : '') + SCRIPT_EJEMPLO,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<link rel="preload" as="image" href="/tienda/img/portadas/simulador-paa-v2.png">
<style>
.sv-hero{padding:clamp(108px,12vw,150px) 0 clamp(40px,5vw,64px)}
.sv-hero-g{display:grid;gap:32px 56px;align-items:start}
@media(min-width:980px){.sv-hero-g{grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr)}}
.sv-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.sv-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:var(--morado-suave);color:var(--morado)}
.sv-chip.oro{background:#fbf3e2;color:#8a6a2c}
.sv-hero h1{margin-top:16px}
.sv-hero .t-lead{margin-top:16px;max-width:600px}
.sv-sellos{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;font-size:14.5px;color:var(--fg-2)}
.sv-sellos li{display:flex;align-items:center;gap:6px}.sv-sellos svg{width:16px;height:16px;color:var(--verde)}
.sv-portada{margin-top:26px;border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra-2);aspect-ratio:4/3;background:var(--noche)}
.sv-portada img{width:100%;height:100%;object-fit:cover;display:block}
.sv-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.sv-compra{position:sticky;top:96px}
.sv-planes{display:grid;gap:10px;margin-bottom:14px}
.sv-plan{position:relative;display:block;padding:16px 18px;border-radius:18px;background:var(--card);border:1.5px solid var(--line);color:inherit;text-decoration:none;transition:border-color var(--t-rapido),box-shadow var(--t-rapido)}
.sv-plan:hover{border-color:var(--line-2)}.sv-plan.sel{border-color:var(--fg);box-shadow:var(--sombra-2)}
.sv-plan.sel::before{content:"";position:absolute;top:18px;right:18px;width:18px;height:18px;border-radius:50%;background:var(--fg);box-shadow:inset 0 0 0 4px var(--card)}
.sv-plan-c{display:flex;align-items:baseline;gap:10px;padding-right:28px}.sv-plan-c b{font-size:17px;letter-spacing:-.015em}.sv-plan-c em{font-style:normal;font-weight:750;margin-left:auto}
.sv-plan small{display:block;color:var(--fg-2);font-size:13.5px;margin-top:2px}
.sv-plan ul{display:none;margin:10px 0 0;gap:6px}.sv-plan.sel ul{display:grid}
.sv-plan li{display:flex;gap:8px;align-items:flex-start;font-size:14px;color:var(--fg-2)}.sv-plan li svg{width:16px;height:16px;flex:none;margin-top:2px;color:var(--verde)}
.sv-ahorro{position:absolute;top:-10px;left:16px;padding:3px 10px;border-radius:999px;background:var(--acento);color:var(--sobre-acento);font-size:12px;font-weight:800}
.sv-plan.rec{border-color:color-mix(in srgb,var(--acento) 60%,var(--line))}.sv-plan.rec.sel{border-color:var(--fg)}
.sv-tag{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:var(--morado-suave);color:var(--morado);font-size:11.5px;font-weight:700;vertical-align:2px}.sv-tag.oro{background:color-mix(in srgb,var(--acento) 18%,transparent);color:color-mix(in srgb,var(--acento) 55%,var(--fg))}
.sv-pronto{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px;box-shadow:var(--sombra)}
.sv-pronto p{color:var(--fg-2);margin:8px 0 18px}
.sv-cifras{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--linea-o);border-radius:var(--r);overflow:hidden}
@media(min-width:760px){.sv-cifras{grid-template-columns:repeat(4,1fr)}}
.sv-cifras div{background:var(--noche-2);padding:26px 22px}
.sv-cifras b{display:block;font-size:clamp(36px,4.4vw,52px);font-weight:750;letter-spacing:-.04em;line-height:1;background:var(--metal-osc);-webkit-background-clip:text;background-clip:text;color:transparent}
.sv-cifras span{display:block;margin-top:8px;font-size:14.5px;color:var(--claro-2)}
.sv-pasos{display:grid;gap:18px;margin-top:28px}
@media(min-width:900px){.sv-pasos{grid-template-columns:repeat(3,1fr)}}
.sv-paso{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra);display:flex;flex-direction:column}
.sv-paso figure{aspect-ratio:16/10;background:var(--bg-2);overflow:hidden}
.sv-paso img{width:100%;height:100%;object-fit:cover;display:block}
.sv-paso div{padding:20px 22px 24px}
.sv-paso small{font-size:13px;font-weight:700;color:var(--morado)}
.sv-paso h3{font-size:19px;letter-spacing:-.02em;margin:6px 0 6px}
.sv-paso p{color:var(--fg-2);font-size:15px}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;margin-top:28px}
.sv-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;box-shadow:var(--sombra)}
.sv-card h3{font-size:18px;letter-spacing:-.02em;margin-bottom:8px}.sv-card p{color:var(--fg-2);font-size:15.5px}
.sv-tabla{width:100%;border-collapse:collapse;margin-top:24px;font-size:15px}
.sv-tabla th,.sv-tabla td{text-align:left;padding:14px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.sv-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.sv-tabla td:last-child{color:var(--fg-2)}
.sv-dot{display:inline-block;width:7px;height:16px;border-radius:2px;transform:skewX(var(--skew));margin-right:10px;vertical-align:-2px}
.s-morado{background:var(--morado)}.s-oro{background:var(--oro)}.s-verde{background:var(--verde)}.s-tinta{background:var(--fg)}
@media(max-width:640px){.sv-tabla.sec td:last-child,.sv-tabla.sec thead th:last-child{display:none}}
.sv-comp th{font-weight:600}.sv-comp td{text-align:center;width:120px}.sv-comp thead th:not(:first-child){text-align:center}
.sv-comp thead th:nth-child(2){color:var(--morado)}
.sv-si svg{width:20px;height:20px;color:var(--verde);display:inline-block}
.sv-no{color:var(--fg-3);font-weight:700}
.sv-ej{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(20px,3vw,32px);margin-top:24px;box-shadow:var(--sombra)}
.sv-ej .sv-tema{display:inline-block;font-size:12.5px;font-weight:650;color:var(--morado);background:var(--morado-suave);padding:3px 10px;border-radius:999px}
.sv-ej h3{font-size:19px;letter-spacing:-.02em;line-height:1.4;margin-top:12px}
.sv-ops{display:flex;flex-direction:column;gap:9px;margin:16px 0 0}
.sv-ops button{display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:13px 15px;border:1.5px solid var(--line);border-radius:15px;background:var(--card);font:inherit;font-size:16px;cursor:pointer;transition:border-color .15s,background .15s}
.sv-ops button:hover:not(:disabled){border-color:var(--fg)}
.sv-ops button span{width:28px;height:28px;border-radius:9px;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.sv-ops button.sv-x{opacity:.5;border-style:dashed;text-decoration:line-through}
.sv-ops button.sv-ok{border-color:var(--verde);background:var(--verde-suave);opacity:1}.sv-ops button.sv-ok span{background:var(--verde);color:#fff}
.sv-ops button.sv-mal{border-color:#e9b4b0;background:#fdf1f0}
.sv-ops button:disabled{cursor:default}
.sv-tutor{margin-top:16px;padding:16px 18px;border-radius:16px;border:1px solid var(--line);font-size:15.5px;line-height:1.55}
.sv-tutor > b{display:block;margin-bottom:4px}.sv-tutor p b{display:inline}
.sv-tutor.pista{background:#fbf6ea;border-color:#eedfb8}.sv-tutor.bien{background:var(--verde-suave);border-color:#c6e5d2}.sv-tutor.sol{background:var(--morado-suave);border-color:#e3d4ea}
.sv-tutor ol{list-style:decimal;padding-left:20px;margin:8px 0;display:flex;flex-direction:column;gap:4px}
.sv-tutor small{display:block;margin-top:6px;color:var(--fg-2);font-size:13px}
.sv-ej-cta{margin-top:10px;font-weight:650}.sv-ej-cta a{color:var(--morado)}
.sv-regalo{display:grid;gap:28px 56px;align-items:center}
@media(min-width:900px){.sv-regalo{grid-template-columns:1fr 1fr}}
.sv-regalo img{width:100%;height:auto;border-radius:var(--r);display:block}
.sv-regalo ul{display:flex;flex-direction:column;gap:10px;margin:20px 0 26px}
.sv-regalo li{display:flex;gap:10px;align-items:flex-start;color:var(--fg-2);font-size:16px}
.sv-regalo li svg{width:18px;height:18px;color:var(--verde);flex:none;margin-top:3px}
.sv-final{text-align:center}
.sv-final .h2{max-width:760px;margin:0 auto}
.sv-final p{margin:16px auto 28px;max-width:560px}
.sv-final .botones{justify-content:center}
.sv-dos{display:grid;gap:28px 64px;align-items:start}
@media(min-width:960px){.sv-dos{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}.sv-pegado{position:sticky;top:110px}}
.sv-dos .sv-ej{margin-top:0}
.sv-mini-l{display:flex;flex-direction:column;gap:10px;margin-top:22px}
.sv-mini-l li{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--fg-2)}.sv-mini-l li b{color:var(--fg)}
.sv-mini-l svg{width:18px;height:18px;color:var(--verde);flex:none;margin-top:3px}
.sv-dos .t-faq{margin-top:0}
.sv-disc{padding:28px 0 56px}
.sv-ya{margin-top:28px;padding:22px;border-radius:var(--r);border:1px dashed var(--line-2);display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}
.sv-ya p{color:var(--fg-2);font-size:15.5px;max-width:520px}
</style>`,
    cuerpo: `
<section class="sv-hero"><div class="marco sv-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Preparación para exámenes</nav>
    <div class="sv-chips"><span class="sv-chip">Nuevo · ${banco} reactivos originales</span><span class="sv-chip oro"><span aria-hidden="true">🎁</span> También para regalar</span></div>
    <h1 class="t-h1">Simulador PAA en línea: practica como si fuera el día del examen</h1>
    <p class="t-lead">Preguntas tipo PAA de Lectura, Redacción, Matemáticas e Inglés con el mismo ritmo de tiempo que el examen real. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice exactamente qué reforzar.</p>
    <ul class="sv-sellos"><li>${CHECK}Práctica ilimitada con tutor</li><li>${CHECK}Examen completo como el real: ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas</li><li>${CHECK}Puntaje estimado 200–800</li><li>${CHECK}En celular o computadora</li></ul>
    <div class="sv-portada"><img src="/tienda/img/portadas/simulador-paa-v2.png" alt="Simulador PAA de Vorka México: pregunta de Redacción con pista del tutor y medidor de preparación" width="1600" height="1200" fetchpriority="high"></div>
    <div class="sv-links"><a class="btn blanco chico" href="#probar">Probar un reactivo gratis ${FLECHA}</a>${prod ? `<a class="btn blanco chico" href="?regalo=1#comprar">🎁 Regalarlo</a>` : ''}</div>
  </div>
  <aside class="sv-compra" id="comprar" aria-label="Comprar el simulador">
    ${selector}${prod ? formCompra(prod, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1' }) : `<div class="sv-pronto"><b class="h3">Muy pronto en la tienda</b><p>Estamos por abrir las ventas del Simulador PAA.</p><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>`}
  </aside>
</div></section>

<section class="t-sec oscura"><div class="marco">
  <div class="cab"><span class="etiqueta">Un banco que no se acaba en el primer intento</span><h2 class="h2">Cada intento es <span class="metal">diferente</span></h2>
  <p class="lead">Cada simulacro y cada examen prioriza preguntas que todavía no has visto, así que al repetir no te aprendes las respuestas: practicas de verdad.</p></div>
  <div class="sv-cifras"><div><b class="num">${banco}</b><span>reactivos originales</span></div><div><b class="num">${lecturas}</b><span>lecturas en español e inglés</span></div><div><b class="num">${temas}</b><span>temas medidos en tu reporte</span></div><div><b class="num">${EXAMEN_REACTIVOS}</b><span>reactivos en el examen completo</span></div></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Cómo funciona</span><h2 class="h2">Practica, aprende de cada error y mide tu avance</h2></div>
  <div class="sv-pasos">
    <article class="sv-paso"><figure><img src="/tienda/img/portadas/simulador-paa-v2.png" alt="" loading="lazy" width="1600" height="1200"></figure><div><small>01 · Con cronómetro</small><h3>Contesta como en la PAA</h3><p>Las cuatro secciones con el mismo tiempo por pregunta que el examen real. El reloj se pausa mientras lees las explicaciones.</p></div></article>
    <article class="sv-paso"><figure><img src="/tienda/img/portadas/simulador-paa-og.png" alt="" loading="lazy" width="1200" height="630"></figure><div><small>02 · Tutor de dos intentos</small><h3>Si fallas, no te da la respuesta</h3><p>Te da una pista de método para que lo intentes otra vez. En el segundo intento ves la solución paso a paso y la regla detrás.</p></div></article>
    <article class="sv-paso"><figure><img src="/tienda/img/portadas/simulador-paa-reporte.png" alt="Reporte del simulador con medidor de preparación, puntaje por sección y aciertos por tema" loading="lazy" width="1600" height="900"></figure><div><small>03 · Reporte</small><h3>Sabes exactamente qué reforzar</h3><p>Puntaje estimado por sección, distancia a tu meta, tus fortalezas y los temas que más puntos te restan, con práctica dirigida.</p></div></article>
  </div>
</div></section>

<section class="t-sec suave" id="probar"><div class="marco sv-dos">
  <div class="sv-dos-t">
    <span class="etiqueta">Pruébalo gratis</span><h2 class="h2" style="margin-top:14px">Contesta un reactivo con el tutor</h2>
    <p class="t-lead" style="margin-top:14px">Elige una opción. Si fallas, verás cómo el tutor te guía sin darte la respuesta, igual que en cada uno de los ${banco} reactivos del simulador.</p>
    <ul class="sv-mini-l"><li>${CHECK}<span><b>1.er error:</b> una pista de método.</span></li><li>${CHECK}<span><b>2.º intento:</b> la solución paso a paso.</span></li><li>${CHECK}<span><b>Siempre:</b> la regla teórica detrás.</span></li></ul>
  </div>
  <div class="sv-ej" id="sv-ej">
    <span class="sv-tema">Redacción · Conectores</span>
    <h3>${esc(ej.enunciado)}</h3>
    <div class="sv-ops">${ej.opciones.map((o, i) => `<button type="button" data-o="${i}"><span>${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>
    <div class="sv-tutor" id="sv-tutor" role="status" aria-live="polite" hidden></div>
    <noscript><p class="t-nota" style="margin-top:14px">Respuesta: ${'ABCD'[ej.correcta]}) ${esc(ej.opciones[ej.correcta])}. ${sinLetras(ej.regla)}</p></noscript>
  </div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Qué incluye</span><h2 class="h2">Más que un examen de práctica</h2></div>
  <div class="sv-grid">
    <div class="sv-card"><h3>Calentamientos <small class="sv-tag">Práctica ilimitada</small></h3><p>${CAL_REACTIVOS} reactivos de dificultad básica e intermedia con tutor, para entrar en ritmo sin frustrarte. Todos los que quieras.</p></div>
    <div class="sv-card"><h3>Simulacros Medios <small class="sv-tag">Práctica ilimitada</small></h3><p>Las cuatro secciones en ${CORTO_REACTIVOS} reactivos, la mayoría de dificultad alta, con cronómetro y tutor. Sin límite: cada uno trae preguntas que no has visto.</p></div>
    <div class="sv-card"><h3>Examen Oficial <small class="sv-tag oro">Simulador completo</small></h3><p>2 exámenes de ${EXAMEN_REACTIVOS} reactivos en ${EXAMEN_HORAS} horas, sin pistas: la misma cantidad de preguntas, el tiempo y la dificultad de la PAA real. ¿Otro? Cuesta $100.</p></div>
    <div class="sv-card"><h3>Por sección y por tema <small class="sv-tag">Práctica ilimitada</small></h3><p>Repite cada sección por separado y practica tus temas débiles todas las veces que quieras.</p></div>
    <div class="sv-card"><h3>Medidor de preparación</h3><p>Una conclusión clara y basada en tus datos: qué tan listo estás y a cuántos puntos de tu meta.</p></div>
    <div class="sv-card"><h3>Historial en tu cuenta</h3><p>Tu avance se guarda: compara tus simulacros y entra desde cualquier dispositivo durante un año.</p></div>
  </div>
  <table class="sv-tabla sv-comp" style="margin-top:40px"><thead><tr><th scope="col">Lo que necesitas para prepararte</th><th scope="col">Simulador Vorka</th><th scope="col">Guía en PDF</th></tr></thead><tbody>${comparar}</tbody></table>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab par"><div><span class="etiqueta">Estructura</span><h2 class="h2" style="margin-top:14px">Las 4 secciones, en dos formatos</h2></div>
  <p class="lead">El <b>examen completo</b> tiene la cantidad de preguntas y el tiempo del examen real. El <b>simulacro corto</b> es una versión compacta con el mismo tiempo por pregunta, para practicar en menos de una hora.</p></div>
  <table class="sv-tabla sec"><thead><tr><th scope="col">Sección</th><th scope="col">Examen completo</th><th scope="col">Simulacro corto</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${secciones}</tbody></table>
</div></section>

${prod ? `<section class="t-sec"><div class="marco sv-regalo">
  <img src="/tienda/img/portadas/simulador-paa-regalo.png" alt="Tarjeta de regalo del Simulador PAA con mensaje personalizado" loading="lazy" width="1200" height="900">
  <div>
    <span class="etiqueta">Para regalar</span><h2 class="h2" style="margin-top:14px">Regálalo a quien va a presentar</h2>
    <ul>
      <li>${CHECK}<span>Elige <b>Para regalar</b> y cuántos: te llega una liga por cada persona, con tu mensaje.</span></li>
      <li>${CHECK}<span>Cada liga funciona <b>una sola vez</b>: al abrirla, el acceso queda a nombre de quien la recibe y nadie más puede usarla.</span></li>
      <li>${CHECK}<span>Ideal para hijos, sobrinos, amigos o todo un grupo de estudiantes.</span></li>
    </ul>
    <a class="btn tinta" href="?regalo=1#comprar">Regalar el simulador ${FLECHA}</a>
  </div>
</div></section>` : ''}

<section class="t-sec suave"><div class="marco sv-dos">
  <div class="sv-dos-t sv-pegado">
    <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">Sobre la PAA y el simulador</h2>
    <div class="sv-ya"><p><b>¿Ya lo compraste o te lo regalaron?</b> Entra con el botón de tu correo. Si cambiaste de dispositivo o no encuentras el correo, te mandamos un enlace nuevo.</p><a class="btn blanco chico" href="/descargas/reenviar">Recibir mi enlace ${FLECHA}</a></div>
  </div>
  <div class="t-faq">${FAQ_PAA.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

${prod ? `<section class="t-sec oscura sv-final"><div class="marco">
  <span class="etiqueta">Tu próximo paso</span>
  <h2 class="h2" style="margin-top:14px">Llega al examen sabiendo <span class="metal">qué esperar</span></h2>
  <p class="lead">Haz un simulacro corto hoy para ver en menos de una hora qué temas te faltan, y cuando estés listo, el examen completo para medirte con el tiempo real.</p>
  <div class="botones"><a class="btn plata" href="#comprar">Comprar por ${precioTxt} ${FLECHA}</a><a class="btn vidrio" href="?regalo=1#comprar">🎁 Regalarlo</a></div>
</div></section>` : ''}
<section class="sv-disc"><div class="marco"><p class="t-nota">Simulador de práctica de Vorka México con reactivos originales. No está afiliado al College Board; PAA es una prueba del College Board. El puntaje es una estimación para orientar tu estudio.</p></div></section>
${prod ? `<div class="t-barra" id="barra-compra"><div><b class="num">${precioTxt}</b><small>Acceso inmediato</small></div><a class="btn tinta chico" href="#comprar">Comprar</a></div>` : ''}`,
  });
}
