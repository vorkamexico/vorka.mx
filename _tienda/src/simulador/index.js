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
// Intentos: la compra del simulador trae contenido.acceso.intentos = 2 y cada "Simulacro adicional" ($50) trae 1.
// Se suman por correo del comprador y solo los gasta el simulacro completo (secciones y práctica son libres).
import { one, all, run, json, fail, enc, hex, iguales } from '../util.js';
import { hashToken } from '../entrega.js';
import { pagina, aviso, esc, nonce, seguridad } from '../paginas.js';
import { productoPorSlug } from '../modelo.js';
import { formCompra, SCRIPT_COMPRA, precio, refDeVisita } from '../tienda.js';
import { FLECHA, CHECK, LOGO, VERSION } from '../marco.generado.js';
import { SECCIONES, TEMAS, TEXTOS, REACTIVOS } from './banco.js';
import { armarCompleto } from './armar.js';
import { APP_JS, APP_CSS } from './cliente.generado.js';

export const APP = 'simulador-paa';
const RUTA = '/simulador-paa';
const COOKIE = 'vk_paa';
export const VIGENCIA_DIAS = 365;
const MAX_RESULTADO = 60_000;   // bytes de JSON por resultado
const MAX_HISTORIAL = 60;       // resultados que se guardan por compra
export const SLUG_INTENTO = 'simulador-paa-intento';
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
    WHERE o.email = ? AND o.estado = 'paid' ORDER BY o.paid_at DESC`, String(email).toLowerCase());
  return filas.map(f => ({ ...f, acceso: accesoDeItem(f.contenido) })).filter(f => f.acceso);
}
const esBase = c => c.acceso.tipo !== 'intento';

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

// Intentos de simulacro completo: comprados (base × 2 + adicionales) menos los ya abiertos
export async function cuentaIntentos(env, email) {
  const compras = await comprasDe(env, email);
  const incluidos = compras.reduce((s, c) => s + (Number(c.acceso.intentos) || (esBase(c) ? 2 : 1)) * (c.cantidad || 1), 0);
  // Un simulacro abandonado también cuenta: si no, bastaría con abandonar para cambiar de preguntas gratis
  const usados = (await one(env, 'SELECT COUNT(*) n FROM simulador_intentos WHERE email = ? AND app = ?', email, APP)).n;
  const abierto = await one(env, "SELECT id, items FROM simulador_intentos WHERE email = ? AND app = ? AND estado = 'abierto' ORDER BY id DESC LIMIT 1", email, APP);
  return { incluidos, usados, disponibles: Math.max(0, incluidos - usados), abierto: abierto ? { id: abierto.id, items: JSON.parse(abierto.items) } : null };
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
      return json({ secciones: SECCIONES, temas: TEMAS, textos: TEXTOS, reactivos: REACTIVOS }, 200, { 'cache-control': 'private, max-age=300' });
    if (p === '/api/simulador-paa/yo' && M === 'GET') return yo(env, a);
    if (p === '/api/simulador-paa/resultados' && M === 'POST') return guardarResultado(req, env, a);
    if (p === '/api/simulador-paa/iniciar' && M === 'POST') return iniciar(env, a);
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
  const filas = await all(env, 'SELECT id, modo, resultado, created_at FROM simulador_resultados WHERE order_id = ? AND app = ? ORDER BY created_at DESC LIMIT ?', a.orden.id, APP, MAX_HISTORIAL);
  const historial = filas.map(f => { try { return { id: f.id, modo: f.modo, fecha: f.created_at, ...JSON.parse(f.resultado) }; } catch { return null; } }).filter(Boolean);
  const intentos = await cuentaIntentos(env, a.orden.email);
  const extra = await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', SLUG_INTENTO);
  return json({ nombre: a.orden.nombre, email: a.orden.email, vence: new Date(a.vence).toISOString(), historial,
    intentos, intentoExtra: extra ? { slug: SLUG_INTENTO, precio_centavos: extra.precio_centavos } : null });
}

// Abre un simulacro completo: retoma el abierto o gasta un intento y arma los reactivos en el servidor
async function iniciar(env, a) {
  const email = a.orden.email;
  const c = await cuentaIntentos(env, email);
  if (c.abierto) return json({ id: c.abierto.id, items: c.abierto.items, retomado: true, intentos: c });
  if (c.disponibles <= 0) return json({ error: 'Ya usaste tus simulacros completos. Compra uno adicional para seguir.', sinIntentos: true, intentos: c }, 402);
  const items = armarCompleto();
  const r = await run(env, 'INSERT INTO simulador_intentos (email, app, items) VALUES (?,?,?)', email, APP, JSON.stringify(items));
  const id = r.meta.last_row_id ?? (await one(env, 'SELECT id FROM simulador_intentos WHERE email = ? ORDER BY id DESC LIMIT 1', email)).id;
  return json({ id, items, retomado: false, intentos: await cuentaIntentos(env, email) });
}

async function abandonar(req, env, a) {
  const b = await req.json().catch(() => ({}));
  await run(env, "UPDATE simulador_intentos SET estado = 'abandonado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto'", new Date().toISOString(), Number(b.id) || 0, a.orden.email);
  return json({ ok: true, intentos: await cuentaIntentos(env, a.orden.email) });
}

async function guardarResultado(req, env, a) {
  const texto = await req.text();
  if (texto.length > MAX_RESULTADO) return fail('Resultado demasiado grande.', 413);
  let r; try { r = JSON.parse(texto); } catch { return fail('Resultado inválido.'); }
  if (!r || typeof r !== 'object' || !['completo', 'seccion', 'practica'].includes(r.modo)) return fail('Resultado inválido.');
  // El simulacro completo solo se guarda si corresponde a un intento abierto de este comprador (y lo cierra)
  if (r.modo === 'completo') {
    const cerrado = await run(env, "UPDATE simulador_intentos SET estado = 'terminado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto'",
      new Date().toISOString(), Number(r.intento) || 0, a.orden.email);
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
const DESCRIPCION = 'Simulador PAA en línea con preguntas tipo examen de Lectura, Redacción, Matemáticas e Inglés, cronómetro real, tutor con pistas, explicación paso a paso y puntaje estimado.';
// Datos de la guía oficial de estudio de la PAA (College Board)
const FAQ_PAA = [
  { p: '¿Qué es la PAA?', r: 'La Prueba de Aptitud Académica (PAA) del College Board es un examen de admisión que usan universidades de México, Puerto Rico y América Latina. Evalúa razonamiento verbal y matemático, y aprovechamiento en español, matemáticas e inglés.' },
  { p: '¿Qué secciones tiene la PAA?', r: 'Cuatro: Lectura, Redacción, Matemáticas e Inglés. Según la guía oficial, Lectura, Redacción y Matemáticas duran 2 horas y 20 minutos, e Inglés 40 minutos. Las preguntas son de opción múltiple con cuatro opciones, y algunas de Matemáticas piden escribir la respuesta.' },
  { p: '¿Cómo se califica la PAA?', r: 'Cada sección se califica en una escala de 200 a 800 puntos y no se resta por respuesta incorrecta, así que conviene contestar todo. Nuestro simulador estima tu puntaje en esa misma escala para que veas qué tan cerca estás de tu meta.' },
  { p: '¿El simulador es el examen oficial?', r: 'No. Es un simulador de práctica de Vorka México con reactivos originales que siguen la estructura y el tipo de preguntas de la PAA. No está afiliado al College Board y el puntaje es una estimación para orientar tu estudio.' },
  { p: '¿Cuántos simulacros incluye?', r: 'Tu compra incluye 2 simulacros completos de 46 reactivos con cronómetro. Cada simulacro adicional cuesta $50 y lo compras desde el mismo simulador. La práctica por sección y por temas débiles no tiene límite.' },
  { p: '¿Funciona en celular?', r: 'Sí. Funciona en el navegador de tu celular, tablet o computadora, sin instalar nada. Tu historial se guarda en tu cuenta.' },
];

async function paginaVenta(env, req, url) {
  const prod = await productoPorSlug(env, APP);
  const { code, cookie } = await refDeVisita(env, req, url);
  const total = SECCIONES.reduce((s, x) => s + x.reactivos, 0), min = SECCIONES.reduce((s, x) => s + x.minutos, 0);
  const ej = REACTIVOS.find(r => r.id === 'R-cnx-2');
  const precioTxt = prod ? precio(prod) : null;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Simulador PAA en línea', description: DESCRIPCION, image: [`${SITIO}/tienda/img/portadas/simulador-paa.png`, OG],
      brand: { '@type': 'Brand', name: 'Vorka México' }, category: 'Preparación para exámenes de admisión', sku: 'prod_simulador_paa',
      ...(prod ? { offers: { '@type': 'Offer', url: `${SITIO}${RUTA}/`, price: (prod.precio_centavos / 100).toFixed(2), priceCurrency: prod.moneda, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Vorka México' } } } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_PAA.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tienda', item: `${SITIO}/tienda/` },
      { '@type': 'ListItem', position: 2, name: 'Simulador PAA', item: `${SITIO}${RUTA}/` }] },
  ];
  const secciones = SECCIONES.map(s => `<tr><th scope="row">${esc(s.nombre)}</th><td class="num">${s.reactivos}</td><td class="num">${s.minutos} min</td><td>${esc(s.descripcion)}</td></tr>`).join('');
  const opciones = ej.opciones.map((o, i) => `<li><span>${'ABCD'[i]}</span>${esc(o)}</li>`).join('');
  return pagina({
    titulo: 'Simulador PAA 2026 en línea: examen de práctica | Vorka México', ruta: `${RUTA}/`, descripcion: DESCRIPCION, imagen: OG,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: prod ? SCRIPT_COMPRA : '',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
.sv-hero{padding:clamp(110px,13vw,160px) 0 clamp(40px,5vw,64px)}
.sv-hero .t-lead{margin-top:18px;max-width:600px}
.sv-hero-g{display:grid;gap:32px 56px;align-items:start}
@media(min-width:980px){.sv-hero-g{grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr)}}
.sv-portada{margin-top:28px;border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra-2);aspect-ratio:4/3;background:var(--noche)}
.sv-portada img{width:100%;height:100%;object-fit:cover;display:block}
.sv-sellos{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:20px;font-size:14.5px;color:var(--fg-2)}
.sv-sellos li{display:flex;align-items:center;gap:6px}.sv-sellos svg{width:16px;height:16px;color:var(--verde)}
.sv-compra{position:sticky;top:96px}
.sv-pronto{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px;box-shadow:var(--sombra)}
.sv-pronto p{color:var(--fg-2);margin:8px 0 18px}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;margin-top:28px}
.sv-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;box-shadow:var(--sombra)}
.sv-card h3{font-size:18px;letter-spacing:-.02em;margin-bottom:8px}.sv-card p{color:var(--fg-2);font-size:15.5px}
.sv-tabla{width:100%;border-collapse:collapse;margin-top:24px;font-size:15px}
.sv-tabla th,.sv-tabla td{text-align:left;padding:14px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.sv-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}
.sv-tabla td:last-child{color:var(--fg-2)}
@media(max-width:640px){.sv-tabla td:last-child,.sv-tabla thead th:last-child{display:none}}
.sv-ej{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(20px,3vw,32px);margin-top:24px;box-shadow:var(--sombra)}
.sv-ej h3{font-size:19px;letter-spacing:-.02em;line-height:1.4}
.sv-ej ol{display:flex;flex-direction:column;gap:8px;margin:16px 0}
.sv-ej li{display:flex;gap:10px;align-items:center;padding:11px 14px;border:1px solid var(--line);border-radius:14px}
.sv-ej li span{width:26px;height:26px;border-radius:8px;background:var(--bg-2);display:grid;place-items:center;font-size:13px;font-weight:750;flex:none}
.sv-ej details{margin-top:10px;border-radius:16px;padding:14px 16px}
.sv-ej details summary{cursor:pointer;font-weight:650}
.sv-ej .pista{background:#fbf6ea;border:1px solid #eedfb8}.sv-ej .sol{background:var(--verde-suave);border:1px solid #c6e5d2}
.sv-ej details p,.sv-ej details ol{margin-top:8px;font-size:15px}
.sv-ej details ol{list-style:decimal;padding-left:20px;display:block}.sv-ej details ol li{display:list-item;border:0;padding:3px 0}
.sv-ya{margin-top:40px;padding:22px;border-radius:var(--r);border:1px dashed var(--line-2);display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}
.sv-ya p{color:var(--fg-2);font-size:15.5px;max-width:520px}
</style>`,
    cuerpo: `
<section class="sv-hero"><div class="marco sv-hero-g">
  <div>
    <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / Preparación para exámenes</nav>
    <span class="etiqueta" style="margin-top:14px">Prueba de Aptitud Académica · College Board</span>
    <h1 class="t-h1" style="margin-top:14px">Simulador PAA en línea: practica como si fuera el día del examen</h1>
    <p class="t-lead">Preguntas tipo PAA de Lectura, Redacción, Matemáticas e Inglés con el mismo ritmo de tiempo que el examen real. Si fallas, un tutor te da una pista para intentarlo otra vez; al final, un reporte te dice exactamente qué reforzar.</p>
    <ul class="sv-sellos"><li>${CHECK}${total} reactivos por simulacro</li><li>${CHECK}${min} minutos con cronómetro</li><li>${CHECK}Puntaje estimado 200–800</li><li>${CHECK}En celular o computadora</li></ul>
    <div class="sv-portada"><img src="/tienda/img/portadas/simulador-paa.png" alt="Simulador PAA de Vorka México: pregunta de Redacción con pista del tutor y medidor de preparación" width="1600" height="1200" fetchpriority="high"></div>
  </div>
  <aside class="sv-compra" id="comprar" aria-label="Comprar el simulador">
    ${prod ? formCompra(prod, { error: url.searchParams.get('error') || '', ref: code || '' }) : `<div class="sv-pronto"><b class="h3">Muy pronto en la tienda</b><p>Estamos por abrir las ventas del Simulador PAA.</p><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>`}
  </aside>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Qué incluye</span><h2 class="h2">Más que un examen de práctica</h2></div>
  <div class="sv-grid">
    <div class="sv-card"><h3>2 simulacros completos</h3><p>Las cuatro secciones con cronómetro, como en la PAA. ¿Quieres más? Cada simulacro adicional cuesta $50.</p></div>
    <div class="sv-card"><h3>Tutor de dos intentos</h3><p>Primer error: una pista de método, sin darte la respuesta. Segundo intento: la solución paso a paso y la regla detrás.</p></div>
    <div class="sv-card"><h3>Medidor de preparación</h3><p>Puntaje estimado por sección en escala 200–800, distancia a tu meta y nivel de confianza basado en tus datos.</p></div>
    <div class="sv-card"><h3>Práctica ilimitada</h3><p>Repite cada sección por separado y practica tus temas débiles todas las veces que quieras.</p></div>
  </div>
</div></section>

<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Estructura</span><h2 class="h2">Las 4 secciones del simulador</h2>
  <p class="t-lead" style="margin-top:14px">Versión compacta de la PAA: menos preguntas, pero con el mismo tiempo por pregunta que el examen real para que practiques con la misma exigencia.</p>
  <table class="sv-tabla"><thead><tr><th scope="col">Sección</th><th scope="col">Reactivos</th><th scope="col">Tiempo</th><th scope="col">Qué evalúa</th></tr></thead><tbody>${secciones}</tbody></table>
</div></section>

<section class="t-sec suave"><div class="marco t-estrecho">
  <span class="etiqueta">Pruébalo gratis</span><h2 class="h2">Un reactivo de ejemplo</h2>
  <div class="sv-ej">
    <h3>${esc(ej.enunciado)}</h3>
    <ol>${opciones}</ol>
    <details class="pista"><summary>Fallé: ver la pista del tutor</summary><p>${esc(ej.pista)}</p></details>
    <details class="sol"><summary>Ver la solución paso a paso</summary><p><b>Respuesta: ${'ABCD'[ej.correcta]}) ${esc(ej.opciones[ej.correcta])}</b></p><ol>${ej.pasos.map(x => `<li>${esc(x.replace(/\{([A-D])\}/g, '$1'))}</li>`).join('')}</ol><p><b>La regla:</b> ${esc(ej.regla)}</p></details>
  </div>
</div></section>

<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Preguntas frecuentes</span><h2 class="h2 t-h2-sec">Sobre la PAA y el simulador</h2>
  <div class="t-faq">${FAQ_PAA.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
  ${prod ? `<div class="botones t-faq-cta"><a class="btn tinta" href="#comprar">Comprar por ${precioTxt} ${FLECHA}</a></div>` : ''}
  <div class="sv-ya"><p><b>¿Ya lo compraste?</b> Entra con el botón de tu correo de compra. Si cambiaste de dispositivo o no encuentras el correo, te mandamos un enlace nuevo.</p><a class="btn blanco chico" href="/descargas/reenviar">Recibir mi enlace ${FLECHA}</a></div>
  <p class="t-nota" style="margin-top:24px">Simulador de práctica de Vorka México con reactivos originales. No está afiliado al College Board; PAA es una prueba del College Board. El puntaje es una estimación para orientar tu estudio.</p>
</div></section>
${prod ? `<div class="t-barra" id="barra-compra"><div><b class="num">${precioTxt}</b><small>Acceso inmediato</small></div><a class="btn tinta chico" href="#comprar">Comprar</a></div>` : ''}`,
  });
}
