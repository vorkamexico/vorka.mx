// Motor de los simuladores de examen de la tienda (PAA, UNAM, ECOEMS…). Cada simulador es una configuración
// (paa.js, unam.js, …) y aquí vive lo que comparten: acceso con cookie firmada, intentos, resultados y la app.
//
// /<app>/                 → la app si hay acceso; si no, página de venta con el botón a la tienda
// /<app>/entrar/<token>   → valida el token del correo de compra y deja la cookie de acceso
// /<app>/app.js|app.css   → cliente (público: no trae respuestas)
// /api/<app>/banco        → reactivos con respuestas y explicaciones (solo con acceso) y la configuración del examen
// /api/<app>/yo           → nombre, correo e historial de resultados
// /api/<app>/resultados   → POST guarda un resultado
// /api/<app>/iniciar      → POST abre un simulacro (gasta 1 intento; si hay uno abierto, lo retoma). { tipo, area? }
// /api/<app>/abandonar    → POST cierra el simulacro abierto (el intento ya se gastó)
// /api/<app>/salir        → POST borra la cookie
//
// Acceso: cookie HttpOnly firmada con HMAC (DOWNLOAD_TOKEN_SECRET). En cada petición se revisa en D1 que la orden
// siga pagada (un reembolso corta el acceso) y que esté dentro de su año de vigencia. Todo se suma por correo del comprador.
//
// Planes por simulador: "Práctica ilimitada" (Calentamientos, Medios y práctica sin límite), "Simulador completo"
// (exámenes completos) y el "Paquete" (los dos). Adicionales: "intento" suma 1 Medio y "examen" suma 1 examen oficial.
import { one, all, run, json, fail, enc, hex, iguales } from '../util.js';
import { hashToken } from '../entrega.js';
import { pagina, aviso, nonce, seguridad } from '../paginas.js';
import { FLECHA, CHECK, LOGO, VERSION } from '../marco.generado.js';
import { APP_JS, APP_CSS } from './cliente.generado.js';

export const VIGENCIA_DIAS = 365;
const MAX_RESULTADO = 60_000;   // bytes de JSON por resultado
const MAX_HISTORIAL = 60;       // resultados que se guardan por compra
const ILIMITADO = 9999;
const OS = 'https://os.vorka.mx'; // boletín de la Revista Sparks
const SIN_REFERER = { 'referrer-policy': 'no-referrer' };
const versionDe = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
const V_JS = versionDe(APP_JS), V_CSS = versionDe(APP_CSS);
const num = (v, min, max) => { const n = Math.round(Number(v) || 0); return Math.min(max, Math.max(min, n)); };
const estatico = (cuerpo, tipo) => new Response(cuerpo, {
  headers: { 'content-type': tipo, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
});

// c: { app, ruta, cookie, firma, nombre, titulo, planes, slugIntento, slugExamen, incluidos, escala, banco, armar, cliente, venta }
//   escala: { tipo: 'paa' } (cada sección de 200 a 800) o { tipo: 'aciertos', total } (aciertos sobre el total del examen)
//   banco: { SECCIONES, SECCIONES_CALENTAMIENTO, SECCIONES_EXAMEN?, TEMAS, TEXTOS, REACTIVOS, AREAS? }
//   armar: { corto, examen, calentamiento } (azar, vistos, area) → [[ids por sección]]; minutos?(tipo, seccion, n) para los que
//          derivan sus secciones de los reactivos (UNAM: el examen depende del área)
export function crearSimulador(c) {
  const { app: APP, ruta: RUTA, cookie: COOKIE, banco: BANCO } = c;
  const API = `/api/${APP}`;
  const REACTIVO = Object.fromEntries(BANCO.REACTIVOS.map(r => [r.id, r]));
  const AREAS = BANCO.AREAS || null;
  const areaValida = a => (AREAS ? (AREAS.some(x => x.id === a) ? a : AREAS[0].id) : null);
  const escalaPAA = c.escala.tipo === 'paa';

  // ---------- firma de la cookie ----------
  async function firma(env, texto) {
    if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
    const llave = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${c.firma}|${texto}`)));
  }
  async function cookieAcceso(env, orderId, venceMs) {
    const exp = Math.floor(venceMs / 1000);
    const valor = `${orderId}.${exp}.${await firma(env, `${orderId}.${exp}`)}`;
    const maxAge = Math.max(0, exp - Math.floor(Date.now() / 1000));
    return `${COOKIE}=${valor}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
  }
  const cookieBorrar = () => `${COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;
  const leerCookie = req => { const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`)); return m ? m[1] : null; };

  const accesoDeItem = x => { try { const a = JSON.parse(x || '{}').acceso; return a?.app === APP ? a : null; } catch { return null; } };
  // Compras pagadas de este correo con productos de este simulador: [{ orden_id, paid_at, cantidad, acceso }]
  async function comprasDe(env, email) {
    const filas = await all(env, `SELECT o.id orden_id, o.paid_at, o.created_at, i.cantidad, p.contenido FROM orders o
      JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
      WHERE o.email = ? AND o.estado = 'paid' AND o.regalo = 0
        AND (o.regalo_de IS NULL OR EXISTS (SELECT 1 FROM orders g WHERE g.id = o.regalo_de AND g.estado = 'paid'))
      ORDER BY o.paid_at DESC`, String(email).toLowerCase());
    return filas.map(f => ({ ...f, acceso: accesoDeItem(f.contenido) })).filter(f => f.acceso);
  }
  // Compra base = el simulador; 'intento' suma simulacros Medios y 'examen' suma exámenes completos
  const esBase = x => x.acceso.tipo !== 'intento' && x.acceso.tipo !== 'examen';

  // La cookie puede ser de la compra del simulador o de un adicional: el acceso siempre lo da la compra base más reciente
  // del mismo correo (pagada y dentro de su año). Devuelve { orden (base), vence } o null.
  async function ordenConAcceso(env, orderId, ahora = Date.now()) {
    const orden = await one(env, "SELECT * FROM orders WHERE id = ? AND estado = 'paid'", orderId);
    if (!orden) return null;
    const base = (await comprasDe(env, orden.email)).find(esBase);
    if (!base) return null;
    const vence = new Date(base.paid_at || base.created_at).getTime() + VIGENCIA_DIAS * 864e5;
    if (vence < ahora) return null;
    const ordenBase = base.orden_id === orden.id ? orden : await one(env, 'SELECT * FROM orders WHERE id = ?', base.orden_id);
    return { orden: ordenBase, vence };
  }

  // Intentos por tipo: 'calentamiento', 'corto' (Medio) o 'examen' (Oficial). Un intento abandonado también cuenta:
  // si no, bastaría con abandonar para cambiar de preguntas gratis.
  const cuantos = (x, tipo) => {
    const a = x.acceso;
    if (a.ilimitado && (tipo === 'calentamiento' || tipo === 'corto')) return ILIMITADO;
    if (tipo === 'calentamiento') return a.calentamientos != null ? Number(a.calentamientos) || 0 : esBase(x) ? c.incluidos.calentamiento : 0;
    if (tipo === 'examen') return a.examenes != null ? Number(a.examenes) || 0 : esBase(x) ? c.incluidos.examen : a.tipo === 'examen' ? 1 : 0;
    return a.intentos != null ? Number(a.intentos) || 0 : esBase(x) ? c.incluidos.corto : a.tipo === 'intento' ? 1 : 0;
  };
  async function cuentaIntentos(env, email, tipo = 'corto') {
    const compras = await comprasDe(env, email);
    const incluidos = compras.reduce((s, x) => s + cuantos(x, tipo) * (x.cantidad || 1), 0);
    const usados = (await one(env, 'SELECT COUNT(*) n FROM simulador_intentos WHERE email = ? AND app = ? AND tipo = ?', email, APP, tipo)).n;
    const abierto = await one(env, "SELECT id, items FROM simulador_intentos WHERE email = ? AND app = ? AND tipo = ? AND estado = 'abierto' ORDER BY id DESC LIMIT 1", email, APP, tipo);
    const ilimitado = incluidos >= ILIMITADO;
    return { incluidos: ilimitado ? null : incluidos, usados, disponibles: ilimitado ? ILIMITADO : Math.max(0, incluidos - usados), ilimitado,
      abierto: abierto ? { id: abierto.id, items: JSON.parse(abierto.items), secciones: seccionesDe(JSON.parse(abierto.items), tipo) } : null };
  }
  // Secciones de un intento (UNAM: dependen del área, así que se derivan de los reactivos que salieron). null = las fijas del banco
  function seccionesDe(items, tipo) {
    if (!c.armar.minutos) return null;
    return items.map(l => { const sid = REACTIVO[l[0]]?.seccion; return { id: sid, reactivos: l.length, minutos: c.armar.minutos(tipo, sid, l.length) }; });
  }

  // Reactivos que ya salieron en sus simulacros (para no repetirlos en el siguiente)
  async function vistosDe(env, email) {
    const filas = await all(env, 'SELECT items FROM simulador_intentos WHERE email = ? AND app = ?', email, APP);
    return new Set(filas.flatMap(f => { try { return JSON.parse(f.items).flat(); } catch { return []; } }));
  }
  // Solo puede comprar simulacros adicionales quien ya tiene el simulador (lo revisa /api/checkout)
  async function puedeComprarIntento(env, email) { return (await comprasDe(env, email)).some(esBase); }

  async function accesoDe(env, req, ahora = Date.now()) {
    const k = leerCookie(req);
    const m = k && k.match(/^([0-9a-f-]{36})\.(\d{9,11})\.([0-9a-f]{64})$/);
    if (!m) return null;
    const [, orderId, exp, sig] = m;
    if (Number(exp) * 1000 < ahora) return null;
    if (!iguales(sig, await firma(env, `${orderId}.${exp}`))) return null;
    return ordenConAcceso(env, orderId, ahora);
  }

  // ---------- rutas ----------
  async function rutas(req, env, url) {
    const p = url.pathname;
    if (!p.startsWith(RUTA) && !p.startsWith(API)) return null;
    if (p.startsWith(RUTA) && p.length > RUTA.length && p[RUTA.length] !== '/') return null;   // /simulador-paa-x no es este simulador
    const M = req.method;
    if (p === `${RUTA}/app.js`) return estatico(APP_JS, 'text/javascript; charset=utf-8');
    if (p === `${RUTA}/app.css`) return estatico(APP_CSS, 'text/css; charset=utf-8');
    const ent = p.match(new RegExp(`^${RUTA}/entrar/([^/]{1,100})/?$`));
    if (ent && (M === 'GET' || M === 'HEAD')) return entrar(env, ent[1]);
    if ((p === RUTA || p === `${RUTA}/`) && (M === 'GET' || M === 'HEAD')) {
      if (p === RUTA) return Response.redirect(`${url.origin}${RUTA}/`, 301);
      const a = await accesoDe(env, req);
      return a ? appShell(a) : c.venta(env, req, url);
    }
    if (p.startsWith(`${API}/`)) {
      if (p === `${API}/salir` && M === 'POST') return json({ ok: true }, 200, { 'set-cookie': cookieBorrar() });
      const a = await accesoDe(env, req);
      if (!a) return fail('Tu acceso no está activo. Entra con el enlace de tu correo de compra.', 401);
      if (p === `${API}/banco` && M === 'GET')
        return json({ config: c.cliente, secciones: BANCO.SECCIONES, examen: BANCO.SECCIONES_EXAMEN || null, calentamiento: BANCO.SECCIONES_CALENTAMIENTO, areas: AREAS,
          temas: BANCO.TEMAS, textos: BANCO.TEXTOS, reactivos: BANCO.REACTIVOS }, 200, { 'cache-control': 'private, max-age=300' });
      if (p === `${API}/yo` && M === 'GET') return yo(env, a);
      if (p === `${API}/resultados` && M === 'POST') return guardarResultado(req, env, a);
      if (p === `${API}/iniciar` && M === 'POST') {
        const b = await req.json().catch(() => ({}));
        return iniciar(env, a, ['examen', 'calentamiento'].includes(b.tipo) ? b.tipo : 'corto', areaValida(b.area));
      }
      if (p === `${API}/abandonar` && M === 'POST') return abandonar(req, env, a);
      return fail('No encontrado', 404);
    }
    return null;
  }

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
      : motivo === 'vencido' ? `<div class="botones t-centro"><a class="btn tinta" href="${RUTA}/">Ir a la tienda ${FLECHA}</a></div>` : '';
    return pagina({ titulo: `${t[0]} · ${c.titulo}`, ruta: `${RUTA}/`, noindex: true, status: motivo === 'invalido' ? 404 : 410, headers: SIN_REFERER,
      cuerpo: aviso({ clase: 'alerta', titulo: t[0], texto: t[1], extra }) });
  }

  async function yo(env, a) {
    const filas = await all(env, `SELECT id, modo, resultado, created_at FROM simulador_resultados
      WHERE order_id IN (SELECT id FROM orders WHERE email = ?) AND app = ? ORDER BY created_at DESC LIMIT ?`, a.orden.email, APP, MAX_HISTORIAL);
    const historial = filas.map(f => { try { return { id: f.id, modo: f.modo, fecha: f.created_at, ...JSON.parse(f.resultado) }; } catch { return null; } }).filter(Boolean);
    const intentos = await cuentaIntentos(env, a.orden.email), examenes = await cuentaIntentos(env, a.orden.email, 'examen'), calentamientos = await cuentaIntentos(env, a.orden.email, 'calentamiento');
    const extra = c.slugIntento && await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', c.slugIntento);
    const extraEx = c.slugExamen && await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', c.slugExamen);
    return json({ nombre: a.orden.nombre, email: a.orden.email, vence: new Date(a.vence).toISOString(), historial,
      ...(await planDe(env, a.orden.email)),
      intentos, examenes, calentamientos, vistos: [...await vistosDe(env, a.orden.email)],
      intentoExtra: extra ? { slug: c.slugIntento, precio_centavos: extra.precio_centavos } : null,
      examenExtra: extraEx ? { slug: c.slugExamen, precio_centavos: extraEx.precio_centavos } : null });
  }

  // Qué tiene esta persona (practica: sin límite · completo: exámenes completos · legado: la compra de antes) y los planes a la
  // venta (para invitarla a llevarse el que le falta)
  async function planDe(env, email) {
    const compras = await comprasDe(env, email);
    const plan = { practica: compras.some(x => x.acceso.ilimitado), completo: compras.some(x => x.acceso.tipo === 'completo' || x.acceso.tipo === 'paquete'), legado: compras.some(x => esBase(x) && !x.acceso.tipo) };
    const ofertas = {};
    for (const [k, slug] of Object.entries(c.planes)) { const p = await one(env, 'SELECT precio_centavos FROM products WHERE slug = ? AND activo = 1', slug); if (p) ofertas[k] = { slug, precio_centavos: p.precio_centavos }; }
    return { plan, ofertas };
  }

  // Abre un simulacro: retoma el abierto o gasta un intento y arma los reactivos en el servidor
  async function iniciar(env, a, tipo = 'corto', area = null) {
    const email = a.orden.email;
    const k = await cuentaIntentos(env, email, tipo);
    if (k.abierto) return json({ id: k.abierto.id, items: k.abierto.items, secciones: k.abierto.secciones, retomado: true, tipo, intentos: k });
    if (k.disponibles <= 0) return json({ error: !k.usados && !k.incluidos ? (tipo === 'examen' ? 'El examen completo viene en el Simulador completo.' : 'Los simulacros de práctica vienen en la Práctica ilimitada.') : tipo === 'examen' ? 'Ya usaste tus exámenes completos. Compra uno adicional para seguir.' : tipo === 'calentamiento' ? 'Ya usaste tus calentamientos. Sigue con el nivel Medio.' : 'Ya usaste tus simulacros de nivel Medio. Compra uno adicional para seguir.', sinIntentos: true, tipo, intentos: k }, 402);
    const vistos = await vistosDe(env, email);
    const items = c.armar[tipo === 'corto' ? 'corto' : tipo](Math.random, vistos, area);
    const r = await run(env, 'INSERT INTO simulador_intentos (email, app, items, tipo) VALUES (?,?,?,?)', email, APP, JSON.stringify(items), tipo);
    const id = r.meta.last_row_id ?? (await one(env, 'SELECT id FROM simulador_intentos WHERE email = ? ORDER BY id DESC LIMIT 1', email)).id;
    return json({ id, items, secciones: seccionesDe(items, tipo), retomado: false, tipo, intentos: await cuentaIntentos(env, email, tipo) });
  }

  async function abandonar(req, env, a) {
    const b = await req.json().catch(() => ({}));
    await run(env, "UPDATE simulador_intentos SET estado = 'abandonado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto'", new Date().toISOString(), Number(b.id) || 0, a.orden.email);
    return json({ ok: true, intentos: await cuentaIntentos(env, a.orden.email), examenes: await cuentaIntentos(env, a.orden.email, 'examen'), calentamientos: await cuentaIntentos(env, a.orden.email, 'calentamiento') });
  }

  // Rangos de los puntajes según la escala del examen
  const R_PUNTAJE = escalaPAA ? [200, 800] : [0, 100];
  const R_GLOBAL = escalaPAA ? [200, 800] : [0, c.escala.total];
  async function guardarResultado(req, env, a) {
    const texto = await req.text();
    if (texto.length > MAX_RESULTADO) return fail('Resultado demasiado grande.', 413);
    let r; try { r = JSON.parse(texto); } catch { return fail('Resultado inválido.'); }
    if (!r || typeof r !== 'object' || !['calentamiento', 'completo', 'examen', 'seccion', 'practica'].includes(r.modo)) return fail('Resultado inválido.');
    // El simulacro solo se guarda si corresponde a un intento abierto de este comprador (y lo cierra)
    if (['calentamiento', 'completo', 'examen'].includes(r.modo)) {
      const cerrado = await run(env, "UPDATE simulador_intentos SET estado = 'terminado', terminado_at = ? WHERE id = ? AND email = ? AND estado = 'abierto' AND tipo = ?",
        new Date().toISOString(), Number(r.intento) || 0, a.orden.email, r.modo === 'examen' ? 'examen' : r.modo === 'calentamiento' ? 'calentamiento' : 'corto');
      if (!cerrado.meta.changes) return fail('Este simulacro ya no está abierto.', 409);
    }
    // Solo se guardan los campos que el dashboard usa
    const limpio = {
      modo: r.modo,
      ...(AREAS && r.area ? { area: areaValida(r.area) } : {}),
      secciones: Array.isArray(r.secciones) ? r.secciones.slice(0, 12).map(s => ({
        id: String(s.id || '').slice(0, 24), puntaje: num(s.puntaje, ...R_PUNTAJE), aciertos: num(s.aciertos, 0, 200),
        segundo: num(s.segundo, 0, 200), total: num(s.total, 0, 200), tiempo: num(s.tiempo, 0, 36000), limite: num(s.limite, 0, 36000), sinResponder: num(s.sinResponder, 0, 200),
      })) : [],
      temas: r.temas && typeof r.temas === 'object' ? Object.fromEntries(Object.entries(r.temas).filter(([k]) => BANCO.TEMAS[k]).map(([k, v]) => [k, { ok: num(v?.ok, 0, 200), total: num(v?.total, 0, 200) }])) : {},
      fallados: Array.isArray(r.fallados) ? r.fallados.filter(id => typeof id === 'string' && id.length < 40).slice(0, 150) : [],
      global: r.global == null ? null : num(r.global, ...R_GLOBAL),
      meta: num(r.meta, ...R_GLOBAL),
      confianza: num(r.confianza, 0, 100),
    };
    await run(env, 'INSERT INTO simulador_resultados (order_id, app, modo, resultado) VALUES (?,?,?,?)', a.orden.id, APP, limpio.modo, JSON.stringify(limpio));
    // Conserva solo los más recientes
    await run(env, `DELETE FROM simulador_resultados WHERE order_id = ? AND app = ? AND id NOT IN
      (SELECT id FROM simulador_resultados WHERE order_id = ? AND app = ? ORDER BY created_at DESC, id DESC LIMIT ?)`, a.orden.id, APP, a.orden.id, APP, MAX_HISTORIAL);
    return json({ ok: true });
  }

  // ---------- la app (con acceso) ----------
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
<title>${c.titulo} · Vorka México</title>
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
  <a class="sim-marca" href="${RUTA}/" aria-label="${c.titulo}, inicio">${LOGO}<span>Simulador <b>${c.nombre}</b></span></a>
  <div class="sim-barra-der" id="barra-der"></div>
</header>
<main id="app" class="sim-main" tabindex="-1" aria-live="polite">
  <div class="sim-cargando"><span class="sim-giro" aria-hidden="true"></span>Preparando tu simulador…</div>
</main>
<script nonce="${n}">window.SIM = ${JSON.stringify({ nombre: a.orden.nombre.split(' ')[0], app: APP, ruta: RUTA, os: OS, logo: LOGO, check: CHECK, flecha: FLECHA }).replace(/</g, '\\u003c')};</script>
<script src="${RUTA}/app.js?v=${V_JS}" defer></script>
</body>
</html>`;
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...cab } });
  }

  return { APP, RUTA, COOKIE, nombre: c.nombre, titulo: c.titulo, planes: c.planes, slugIntento: c.slugIntento, slugExamen: c.slugExamen,
    rutas, accesoDe, cookieAcceso, ordenConAcceso, cuentaIntentos, vistosDe, puedeComprarIntento, planDe };
}
