// Programa de puntos Vorka · vorka.mx/tienda/puntos/ y la mini app vorka.mx/tienda/cuenta/
//   /tienda/puntos/                 qué es y cómo funciona + crear cuenta / entrar (pública)
//   /tienda/puntos/acceso/<token>   canjear el enlace del correo → sesión
//   /tienda/cuenta/                 la app "Puntos Vorka" (instalable): Inicio · Compartir · Metas · Actividad.
//                                   Sin sesión muestra la entrada con correo + código de 6 dígitos (sirve dentro de la app
//                                   instalada, que en iPhone no comparte cookies con Safari).
//   /tienda/cuenta/sw.js · manifest.webmanifest · iconos/<n>.png
//   /api/puntos/entrar · codigo · salir · saldo · estado · meta · ajustes · sugerir · leidas · push/{clave,suscribir,quitar}
// Reglas: por cada compra pagada que entra con tu liga ganas 10 puntos (no cuenta comprarte a ti mismo); 20 (puntos dobles)
// si la compra incluye un producto con promoción vigente o un producto que tú sugeriste y el equipo aceptó.
// 1 punto = $1 MXN, se canjean en cualquier producto de la tienda; siempre se cobra al menos $10 (mínimo de la pasarela).
// Si una compra se reembolsa, sus puntos se revierten exactamente (y los que se usaron en ella, regresan).
// Las comisiones en DINERO (affiliates.tipo = 'dinero') son solo por invitación: las da de alta el equipo.
import { one, all, run, json, fail, aleatorio, sha256, iguales } from './util.js';
import { hashToken } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA } from './marco.generado.js';
import { enviar, marco, boton, P } from './correo.js';
import { dentroDelLimite, VENDIBLE } from './modelo.js';
import { avisar, rutasPush } from './puntos-push.js';
import { PUNTOS_POR_COMPRA, MULTIPLICADOR_DOBLE, COBRO_MINIMO, NIVELES, nivelDe, objetivoMeta, ventasPara, LOGROS, diaMx, inicioDiaMx, sumarDias, nombrePublico } from './puntos-reglas.js';
import { paginaApp, paginaEntrarApp, paginaPrograma, SW, manifiesto, icono } from './puntos-app.js';

export { PUNTOS_POR_COMPRA, COBRO_MINIMO };
const COOKIE = 'vorka_cuenta';
const ENLACE_MIN = 30, CODIGO_MIN = 15, CODIGO_INTENTOS = 5, SESION_DIAS = 60;
const RESERVA_HORAS = 24;                 // puntos apartados por una compra que aún no se paga (OXXO, carrito abandonado)
const emailValido = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');
const leerCookie = req => (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === COOKIE)?.[1];
const mismoOrigen = (req, env) => { const o = req.headers.get('origin'); return !o || o === new URL(env.SITE_URL).origin; };
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|headless/i;
const NO_CACHE = { 'cache-control': 'no-store' };

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

// Compras con tu liga que siguen vigentes (las reembolsadas no cuentan): definen tu nivel y tus logros
const VIGENTE = "m.tipo = 'ganado' AND NOT EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido')";
export const ventasDe = async (env, email) => (await one(env, `SELECT COUNT(*) n FROM puntos_movimientos m WHERE m.email = ? AND ${VIGENTE}`, email)).n;

// ---------- puntos dobles ----------
// Multiplicador de una orden para quien compartió la liga: se revisa cada producto de la orden y se toma el mayor
// (2 si ese producto tiene promoción vigente el día del pago, o si lo sugirió quien compartió y el equipo lo aceptó
// antes del pago). Los dobles no se acumulan entre sí: el máximo es 2× por orden.
export async function multiplicadorDe(env, orden, refEmail) {
  const items = await all(env, 'SELECT i.product_id, i.nombre FROM order_items i WHERE i.order_id = ? ORDER BY i.id', orden.id);
  const pagada = orden.paid_at || new Date().toISOString(), dia = diaMx(pagada);
  let mejor = { mult: 1, motivo: null, product_id: items[0]?.product_id || null, producto: items[0]?.nombre || null };
  for (const it of items) {
    const sug = await one(env, "SELECT id FROM puntos_sugerencias WHERE email = ? AND estado = 'aceptada' AND product_id = ? AND decidida_at <= ? LIMIT 1", refEmail, it.product_id, pagada);
    const promo = sug ? null : await one(env, 'SELECT id FROM puntos_promos WHERE product_id = ? AND inicia <= ? AND termina >= ? LIMIT 1', it.product_id, dia, dia);
    if ((sug || promo) && mejor.mult < MULTIPLICADOR_DOBLE)
      mejor = { mult: MULTIPLICADOR_DOBLE, motivo: sug ? 'sugerencia' : 'promo', product_id: it.product_id, producto: it.nombre };
  }
  return mejor;
}

// ---------- al pagarse o reembolsarse una orden (webhook; idempotente por el índice único (order_id, tipo)) ----------
export async function puntosAlPagar(env, orderId) {
  const o = await one(env, "SELECT o.*, a.email ref_email, a.tipo ref_tipo FROM orders o LEFT JOIN affiliates a ON a.code = o.ref_code WHERE o.id = ?", orderId);
  if (!o || o.estado !== 'paid') return;
  if (o.descuento_centavos > 0 && o.puntos_email)
    await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota) VALUES (?, 'canje', ?, ?, 'Usados en tu compra')", o.puntos_email, -Math.round(o.descuento_centavos / 100), o.id);
  // Gana quien compartió la liga, si es una cuenta de puntos y no se compró a sí mismo
  if (!(o.ref_tipo === 'puntos' && o.ref_email && o.ref_email !== o.email && o.monto_centavos > 0)) return;
  const m = await multiplicadorDe(env, o, o.ref_email);
  const puntos = PUNTOS_POR_COMPRA * m.mult;
  const nota = m.mult > 1 ? `Puntos dobles${m.motivo === 'sugerencia' ? ' por tu sugerencia' : ''} · ${m.producto}` : `Compra con tu liga${m.producto ? ` · ${m.producto}` : ''}`;
  const r = await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo) VALUES (?, 'ganado', ?, ?, ?, ?, ?, ?)",
    o.ref_email, puntos, o.id, nota.slice(0, 160), m.product_id, m.mult, m.motivo);
  if (r.meta.changes) await despuesDeGanar(env, o.ref_email, { puntos, ...m, orderId: o.id });
}

export async function puntosAlReembolsar(env, orderId) {
  // Se revierte exactamente lo que se dio (con o sin puntos dobles) y se regresa exactamente lo que se usó
  const ms = await all(env, "SELECT * FROM puntos_movimientos WHERE order_id = ? AND tipo IN ('ganado', 'canje')", orderId);
  for (const m of ms)
    await run(env, 'INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota, product_id, multiplicador) VALUES (?, ?, ?, ?, ?, ?, ?)',
      m.email, m.tipo === 'ganado' ? 'revertido' : 'devuelto', -m.puntos, orderId, m.tipo === 'ganado' ? 'La compra con tu liga se reembolsó' : 'Te regresamos los puntos de una compra reembolsada', m.product_id, m.multiplicador);
}

// Avisos al ganar: puntos (app + push + correo corto), subir de nivel y meta alcanzada (app + push). Nunca lanza.
async function despuesDeGanar(env, email, { puntos, mult, motivo, producto, orderId }) {
  try {
    const s = await saldoDe(env, email);
    await avisar(env, email, {
      clave: `ganado:${orderId}`, tipo: 'ganado',
      titulo: mult > 1 ? `¡Puntos dobles! +${puntos} puntos` : `¡Ganaste ${puntos} puntos!`,
      cuerpo: `Alguien compró${producto ? ` ${producto}` : ''} con tu liga${motivo === 'sugerencia' ? ' (el producto que sugeriste)' : ''}. Ya tienes ${s.disponibles} puntos ($${s.disponibles} MXN en la tienda).`,
      url: '/tienda/cuenta/#actividad',
    }, { correo: { asunto: `Ganaste ${puntos} puntos Vorka` } });
    const ventas = await ventasDe(env, email);
    const n = nivelDe(ventas);
    if (n.indice > 0 && n.actual.min === ventas)
      await avisar(env, email, { clave: `nivel:${n.actual.id}`, tipo: 'nivel', titulo: `Subiste a nivel ${n.actual.nombre}`, cuerpo: `Llevas ${ventas} compras con tu liga. ${n.siguiente ? `Te faltan ${n.siguiente.min - ventas} para ${n.siguiente.nombre}.` : 'Llegaste a lo más alto.'}`, url: '/tienda/cuenta/#metas' });
    await revisarMeta(env, email, s);
  } catch (e) { console.error('puntos avisos', e?.message); }
}

async function revisarMeta(env, email, saldo) {
  const c = await one(env, 'SELECT c.meta_product_id, c.meta_desde, p.nombre, p.precio_centavos FROM puntos_cuentas c JOIN products p ON p.id = c.meta_product_id WHERE c.email = ?', email);
  if (!c) return;
  const s = saldo || await saldoDe(env, email);
  if (s.disponibles >= objetivoMeta(c.precio_centavos))
    await avisar(env, email, { clave: `meta:${c.meta_product_id}:${c.meta_desde}`, tipo: 'meta', titulo: '¡Meta cumplida!', cuerpo: `Ya juntaste los puntos para ${c.nombre}: lo pagas con solo $10.`, url: '/tienda/cuenta/' });
}

// ---------- visitas a la liga (una por persona, código y día; sin guardar IPs) ----------
export async function contarVisita(env, req, code) {
  try {
    if (BOT.test(req.headers.get('user-agent') || '')) return;
    const ip = req.headers.get('cf-connecting-ip');
    if (!ip) return;
    const dia = diaMx();
    const visitante = env.DOWNLOAD_TOKEN_SECRET ? (await hashToken(env, `visita:${dia}:${ip}`)).slice(0, 32) : (await sha256(`visita:${dia}:${ip}`)).slice(0, 32);
    // Abrir tu propia liga no cuenta
    const yo = await cuentaActual(req, env);
    await run(env, `INSERT OR IGNORE INTO puntos_visitas (code, dia, visitante) SELECT ?, ?, ? WHERE EXISTS
      (SELECT 1 FROM affiliates WHERE code = ? AND tipo = 'puntos' AND activo = 1 AND email IS NOT ?)`, code, dia, visitante, code, yo?.email ?? null);
  } catch (e) { console.error('visita', e?.message); }
}

// ---------- entrar: enlace + código de 6 dígitos en el mismo correo ----------
const codigo6 = () => { const b = new Uint32Array(1); do crypto.getRandomValues(b); while (b[0] >= 4294000000); return String(b[0] % 1e6).padStart(6, '0'); };
const hashCodigo = (env, email, c) => hashToken(env, `codigo:${email}:${c}`);

async function crearSesion(env, email) {
  const s = aleatorio(32);
  await run(env, "INSERT INTO puntos_accesos (token_hash, email, tipo, expira_at) VALUES (?, ?, 'sesion', ?)", await hashToken(env, s), email, new Date(Date.now() + SESION_DIAS * 864e5).toISOString());
  return `${COOKIE}=${s}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESION_DIAS * 86400}`;
}

async function pedirEnlace(req, env) {
  if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!emailValido(email)) return fail('Escribe un correo válido.');
  if (b.terminos !== true) return fail('Acepta las condiciones del programa de puntos.');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `puntos:ip:${await sha256(ip)}`, 10, 600)) || !(await dentroDelLimite(env, `puntos:email:${await sha256(email)}`, 4, 600)))
    return fail('Pediste muchos correos seguidos. Espera unos minutos y revisa tu bandeja (también spam).', 429);
  const nombre = String(b.nombre || '').trim().slice(0, 80) || null;
  await codigoDe(env, email, nombre);
  await run(env, 'INSERT INTO puntos_cuentas (email, nombre) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET nombre = COALESCE(puntos_cuentas.nombre, excluded.nombre)', email, nombre);
  const t = aleatorio(32), c = codigo6(), ahora = new Date().toISOString();
  await run(env, "INSERT INTO puntos_accesos (token_hash, email, tipo, expira_at) VALUES (?, ?, 'enlace', ?)", await hashToken(env, t), email, new Date(Date.now() + ENLACE_MIN * 60e3).toISOString());
  // Solo vale el código más reciente
  await run(env, 'UPDATE puntos_codigos SET usado_at = ? WHERE email = ? AND usado_at IS NULL', ahora, email);
  await run(env, 'INSERT INTO puntos_codigos (email, codigo_hash, expira_at) VALUES (?, ?, ?)', email, await hashCodigo(env, email, c), new Date(Date.now() + CODIGO_MIN * 60e3).toISOString());
  const enlace = `${env.SITE_URL}/tienda/puntos/acceso/${t}`;
  const caja = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;width:100%"><tr><td align="center" style="background:#F4F2EF;border-radius:16px;padding:18px 12px">
    <div style="font-size:13px;color:#6D696E;font-weight:600;margin-bottom:6px">¿Estás en la app Puntos Vorka? Escribe este código</div>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#141114;font-family:'SF Mono',Menlo,Consolas,monospace">${c}</div>
    <div style="font-size:12.5px;color:#A8A4A9;margin-top:6px">Vence en ${CODIGO_MIN} minutos · un solo uso</div></td></tr></table>`;
  await enviar(env, { para: email, asunto: `${c} es tu código de Puntos Vorka`, idempotencia: `puntos-${t.slice(0, 24)}`,
    html: marco('Entra a Puntos Vorka', `<p style="${P}">Toca el botón para entrar desde este dispositivo. Ahí encuentras tu liga para compartir, tus metas y tus puntos. El enlace funciona una vez durante ${ENLACE_MIN} minutos.</p>${boton(enlace, 'Entrar a mi cuenta')}${caja}<p style="${P}">Si no lo pediste, ignora este correo.</p>`, { etiqueta: 'Puntos' }),
    texto: `Tu código de Puntos Vorka: ${c} (vence en ${CODIGO_MIN} minutos).\n\nO entra con este enlace (funciona una vez, ${ENLACE_MIN} minutos):\n${enlace}\n\nSi no lo pediste, ignora este correo.` });
  // Sin correo configurado (pruebas locales) se devuelven el enlace y el código para poder entrar
  return json({ ok: true, reenviar_en: 60, ...(!env.RESEND_API_KEY && !env.CORREO ? { enlace: enlace.replace(env.SITE_URL, ''), codigo: c } : {}) });
}

async function entrarConCodigo(req, env) {
  if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase(), c = String(b.codigo || '').replace(/\D/g, '');
  if (!emailValido(email)) return fail('Escribe el correo con el que pediste el código.');
  if (c.length !== 6) return fail('El código tiene 6 dígitos.');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `puntos:codigo-ip:${await sha256(ip)}`, 30, 900)) || !(await dentroDelLimite(env, `puntos:codigo:${await sha256(email)}`, 12, 900)))
    return fail('Demasiados intentos. Espera unos minutos y pide un código nuevo.', 429);
  const ahora = new Date().toISOString();
  const fila = await one(env, 'SELECT * FROM puntos_codigos WHERE email = ? AND usado_at IS NULL AND expira_at > ? ORDER BY id DESC LIMIT 1', email, ahora);
  if (!fila) return fail('Ese código ya venció o ya se usó. Pide uno nuevo.', 400);
  if (fila.intentos >= CODIGO_INTENTOS) return fail('Demasiados intentos con este código. Pide uno nuevo.', 429);
  if (!iguales(fila.codigo_hash, await hashCodigo(env, email, c))) {
    await run(env, 'UPDATE puntos_codigos SET intentos = intentos + 1 WHERE id = ?', fila.id);
    const quedan = CODIGO_INTENTOS - fila.intentos - 1;
    return fail(quedan > 0 ? `Código incorrecto. Te ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`}.` : 'Código incorrecto. Pide uno nuevo.', 400);
  }
  const r = await run(env, 'UPDATE puntos_codigos SET usado_at = ? WHERE id = ? AND usado_at IS NULL', ahora, fila.id);
  if (!r.meta.changes) return fail('Ese código ya se usó. Pide uno nuevo.', 400);
  return json({ ok: true }, 200, { 'set-cookie': await crearSesion(env, email) });
}

async function canjear(env, token) {
  const h = await hashToken(env, token), ahora = new Date().toISOString();
  const r = await run(env, "UPDATE puntos_accesos SET usado_at = ? WHERE token_hash = ? AND tipo = 'enlace' AND usado_at IS NULL AND expira_at > ?", ahora, h, ahora);
  if (!r.meta.changes) return pagina({ titulo: 'Enlace vencido · Puntos Vorka', ruta: '/tienda/puntos/', noindex: true, status: 410,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya se usó o venció', texto: 'Pide uno nuevo con tu correo. Si estás en la app, usa el código de 6 dígitos que llega en el mismo correo.', extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/cuenta/">Pedir otro correo ${FLECHA}</a></div>` }) });
  const { email } = await one(env, 'SELECT email FROM puntos_accesos WHERE token_hash = ?', h);
  return new Response(null, { status: 303, headers: { location: '/tienda/cuenta/', 'set-cookie': await crearSesion(env, email), 'referrer-policy': 'no-referrer' } });
}

// ---------- datos de la app ----------
// Lo que se comparte: una tarjeta por página de destino (los planes de Brindi y de Cupo se venden en una sola página)
function destinoDe(p) {
  const app = p.contenido?.acceso?.app;
  if (app === 'brindi') return { ruta: '/tienda/brindi/', titulo: 'Brindi · Invitaciones digitales', tipo: 'brindi', texto: 'Invitaciones digitales con confirmaciones y QR para bodas, XV años y toda celebración.' };
  if (app === 'cupo') return { ruta: '/tienda/cupo/', titulo: 'Cupo · Eventos con registro', tipo: 'cupo', texto: 'Registro, cover y check-in con QR para eventos. Gratis hasta 30 personas.' };
  if (app === 'simulador-paa') return { ruta: '/simulador-paa/', titulo: p.nombre, tipo: 'simulador', texto: p.descripcion_corta };
  return { ruta: p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`, titulo: p.nombre, tipo: 'producto', texto: p.descripcion_corta };
}
// Las tarjetas salen de los productos visibles en el catálogo (se respeta contenido.oculto); los planes ocultos que se
// venden en esa misma página (Cupo Pro 100, planes de Brindi…) se suman a la tarjeta para mostrar sus puntos dobles.
export function compartibles(productos) {
  const m = new Map();
  for (const p of productos.filter(p => !p.contenido?.oculto)) {
    const d = destinoDe(p);
    if (!m.has(d.ruta)) m.set(d.ruta, { ...d, ids: [], imagen: p.imagen || (d.tipo === 'brindi' ? '/assets/tienda/brindi.webp' : d.tipo === 'cupo' ? '/assets/tienda/cupo.webp' : null) });
  }
  for (const p of productos) m.get(destinoDe(p).ruta)?.ids.push(p.id);
  return [...m.values()];
}

// Todo lo que se puede comprar hoy (incluye los planes ocultos del catálogo que se venden en su propia página)
async function vendibles(env) {
  return (await all(env, `SELECT p.id, p.slug, p.nombre, p.descripcion_corta, p.precio_centavos, p.imagen, p.contenido FROM products p WHERE ${VENDIBLE} ORDER BY p.orden, p.nombre`))
    .map(p => ({ ...p, contenido: JSON.parse(p.contenido || '{}') }));
}
// Productos que se pueden elegir como meta: los visibles y los planes de las apps (no complementos ni simulacros sueltos)
const sirveDeMeta = p => p.precio_centavos > COBRO_MINIMO && (!p.contenido?.oculto || ['plan', 'pro', 'paquete'].includes(p.contenido?.acceso?.tipo));
const productosMeta = async env => (await vendibles(env)).filter(sirveDeMeta).sort((a, b) => a.precio_centavos - b.precio_centavos);

// Productos con puntos dobles hoy para esta cuenta: promociones vigentes (todos) y sus sugerencias aceptadas
async function doblesDe(env, email) {
  const dia = diaMx(), out = {};
  for (const x of await all(env, 'SELECT product_id, termina FROM puntos_promos WHERE inicia <= ? AND termina >= ?', dia, dia)) out[x.product_id] = { motivo: 'promo', termina: x.termina };
  for (const x of await all(env, "SELECT product_id FROM puntos_sugerencias WHERE email = ? AND estado = 'aceptada' AND product_id IS NOT NULL", email)) out[x.product_id] = { motivo: 'sugerencia' };
  return out;
}

export async function topDelMes(env) {
  const mes = diaMx().slice(0, 7), desde = inicioDiaMx(`${mes}-01`);
  const filas = await all(env, `SELECT c.email, c.nombre, COUNT(m.id) ventas, MIN(m.created_at) primero FROM puntos_cuentas c
    JOIN puntos_movimientos m ON m.email = c.email AND ${VIGENTE} AND m.created_at >= ?
    WHERE c.ranking = 1 GROUP BY c.email ORDER BY ventas DESC, primero LIMIT 10`, desde);
  return filas.map((f, i) => ({ lugar: i + 1, email: f.email, nombre: nombrePublico(f.nombre), ventas: f.ventas }));
}

export async function datosApp(env, email) {
  const code = await codigoDe(env, email);
  await run(env, 'INSERT OR IGNORE INTO puntos_cuentas (email) VALUES (?)', email);
  const cuenta = await one(env, 'SELECT * FROM puntos_cuentas WHERE email = ?', email);
  const af = await one(env, "SELECT nombre FROM affiliates WHERE code = ?", code);
  const saldo = await saldoDe(env, email);
  const ventas = await ventasDe(env, email);
  const hoy = diaMx(), hace7 = sumarDias(hoy, -6), desde7 = inicioDiaMx(hace7);
  const n = (sql, ...a) => one(env, sql, ...a).then(x => x?.n ?? 0);
  const semana = {
    visitas: await n('SELECT COUNT(*) n FROM puntos_visitas WHERE code = ? AND dia >= ?', code, hace7),
    compras: await n(`SELECT COUNT(*) n FROM puntos_movimientos m WHERE m.email = ? AND ${VIGENTE} AND m.created_at >= ?`, email, desde7),
    puntos: await n("SELECT COALESCE(SUM(puntos), 0) n FROM puntos_movimientos WHERE email = ? AND tipo IN ('ganado', 'revertido') AND created_at >= ?", email, desde7),
  };
  const todos = await vendibles(env);
  const productos = todos.filter(sirveDeMeta).sort((a, b) => a.precio_centavos - b.precio_centavos);
  const meta = productos.find(p => p.id === cuenta.meta_product_id) || null;
  const movimientos = await all(env, 'SELECT tipo, puntos, nota, multiplicador, created_at FROM puntos_movimientos WHERE email = ? ORDER BY id DESC LIMIT 60', email);
  const notificaciones = await all(env, 'SELECT id, tipo, titulo, cuerpo, url, leida_at, created_at FROM puntos_notificaciones WHERE email = ? ORDER BY id DESC LIMIT 20', email);
  const sugerencias = await all(env, 'SELECT s.id, s.idea, s.estado, s.nota, s.created_at, p.nombre producto FROM puntos_sugerencias s LEFT JOIN products p ON p.id = s.product_id WHERE s.email = ? ORDER BY s.id DESC LIMIT 20', email);
  const push = await n('SELECT COUNT(*) n FROM puntos_push WHERE email = ?', email);
  // Logros
  const distintos = await n(`SELECT COUNT(DISTINCT i.product_id) n FROM puntos_movimientos m JOIN order_items i ON i.order_id = m.order_id WHERE m.email = ? AND ${VIGENTE}`, email);
  const hay = (sql, ...a) => one(env, sql, ...a).then(x => !!x);
  const logrado = {
    primera: ventas >= 1, cinco: ventas >= 5, diez: ventas >= 10, veinticinco: ventas >= 25, cincuenta: ventas >= 50, variedad: distintos >= 3,
    sugeriste: sugerencias.length > 0,
    doble: await hay("SELECT 1 FROM puntos_movimientos WHERE email = ? AND tipo = 'ganado' AND multiplicador > 1 LIMIT 1", email),
    canje: await hay("SELECT 1 FROM puntos_movimientos WHERE email = ? AND tipo = 'canje' LIMIT 1", email),
    idea: sugerencias.some(s => s.estado === 'aceptada'),
    meta: await hay("SELECT 1 FROM puntos_notificaciones WHERE email = ? AND tipo = 'meta' LIMIT 1", email),
    avisos: push > 0,
  };
  const top = await topDelMes(env);
  return {
    email, code, nombre: cuenta.nombre || af?.nombre || email.split('@')[0], nombre_ranking: cuenta.nombre || '', ranking: !!cuenta.ranking,
    saldo, ventas, nivel: nivelDe(ventas), semana, productos, compartir: compartibles(todos), dobles: await doblesDe(env, email),
    meta: meta && { id: meta.id, nombre: meta.nombre, precio_centavos: meta.precio_centavos, objetivo: objetivoMeta(meta.precio_centavos) },
    movimientos, notificaciones, no_leidas: notificaciones.filter(x => !x.leida_at).length, sugerencias, push,
    logros: LOGROS.map(l => ({ ...l, ok: !!logrado[l.id] })),
    top: top.map(t => ({ ...t, yo: t.email === email, email: undefined })),
  };
}

// ---------- acciones de la app ----------
async function accion(req, env, url, email) {
  const p = url.pathname;
  const b = await req.json().catch(() => ({}));
  if (p === '/api/puntos/meta') {
    const id = b.product_id == null || b.product_id === '' ? null : String(b.product_id);
    if (id && !(await productosMeta(env)).some(x => x.id === id)) return fail('Ese producto no está disponible.');
    await run(env, 'INSERT INTO puntos_cuentas (email, meta_product_id, meta_desde) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET meta_product_id = excluded.meta_product_id, meta_desde = excluded.meta_desde', email, id, id ? new Date().toISOString() : null);
    if (id) await revisarMeta(env, email);
    return json({ ok: true });
  }
  if (p === '/api/puntos/ajustes') {
    const nombre = b.nombre === undefined ? undefined : String(b.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const actual = await one(env, 'SELECT nombre, ranking FROM puntos_cuentas WHERE email = ?', email);
    const ranking = b.ranking === undefined ? !!actual?.ranking : b.ranking === true;
    const nom = nombre === undefined ? actual?.nombre : nombre;
    if (ranking && !nom) return fail('Escribe tu nombre para aparecer en el Top del mes.');
    await run(env, 'INSERT INTO puntos_cuentas (email, nombre, ranking) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre, ranking = excluded.ranking', email, nom || null, ranking ? 1 : 0);
    return json({ ok: true, ranking, nombre_publico: nombrePublico(nom) });
  }
  if (p === '/api/puntos/sugerir') {
    const idea = String(b.idea || '').trim().slice(0, 200), para = String(b.para_quien || '').trim().slice(0, 160), porque = String(b.por_que || '').trim().slice(0, 600);
    if (idea.length < 3) return fail('Cuéntanos qué producto te gustaría ver en la tienda.');
    if (!(await dentroDelLimite(env, `puntos:sugerir:${await sha256(email)}`, 5, 86400))) return fail('Ya enviaste varias ideas hoy. Mañana puedes mandar más.', 429);
    await run(env, 'INSERT INTO puntos_sugerencias (email, idea, para_quien, por_que) VALUES (?, ?, ?, ?)', email, idea, para || null, porque || null);
    return json({ ok: true });
  }
  if (p === '/api/puntos/leidas') {
    await run(env, 'UPDATE puntos_notificaciones SET leida_at = ? WHERE email = ? AND leida_at IS NULL', new Date().toISOString(), email);
    return json({ ok: true });
  }
  if (p.startsWith('/api/puntos/push/')) {
    try { const r = await rutasPush(req, env, url, email, b); return r ? json(r) : null; }
    catch (e) { return fail(e.message, e.status || 400); }
  }
  return null;
}

// ---------- rutas ----------
export async function rutasPuntos(req, env, url) {
  const p = url.pathname.replace(/\/+$/, '') || '/', M = req.method;
  if (p === '/tienda/puntos' && M === 'GET') return paginaPrograma(env, { cuenta: await cuentaActual(req, env) });
  if (p === '/tienda/cuenta' && M === 'GET') {
    const c = await cuentaActual(req, env);
    return c ? paginaApp(env, await datosApp(env, c.email)) : paginaEntrarApp(env);
  }
  if (p === '/tienda/cuenta/sw.js' && M === 'GET')
    return new Response(SW, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache', 'service-worker-allowed': '/tienda/cuenta/' } });
  if (p === '/tienda/cuenta/manifest.webmanifest' && M === 'GET')
    return new Response(JSON.stringify(manifiesto()), { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  let m;
  if ((m = p.match(/^\/tienda\/cuenta\/iconos\/(192|512|180|maskable)\.png$/)) && M === 'GET') {
    const png = icono(m[1]);
    return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800' } });
  }
  if ((m = p.match(/^\/tienda\/puntos\/acceso\/([a-f0-9]{64})$/)) && M === 'GET') return canjear(env, m[1]);
  if (p === '/api/puntos/entrar' && M === 'POST') return pedirEnlace(req, env);
  if (p === '/api/puntos/codigo' && M === 'POST') return entrarConCodigo(req, env);
  if (p === '/api/puntos/salir' && M === 'POST') {
    const t = leerCookie(req);
    if (/^[a-f0-9]{64}$/.test(t || '')) await run(env, 'DELETE FROM puntos_accesos WHERE token_hash = ?', await hashToken(env, t));
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
  }
  if (p === '/api/puntos/saldo' && M === 'GET') {
    const c = await cuentaActual(req, env);
    if (!c) return json({ cuenta: false }, 200, NO_CACHE);
    return json({ cuenta: true, email: c.email, ...(await saldoDe(env, c.email)) }, 200, NO_CACHE);
  }
  if (p === '/api/puntos/estado' && M === 'GET') {
    const c = await cuentaActual(req, env);
    if (!c) return json({ cuenta: false }, 200, NO_CACHE);
    const nl = await one(env, 'SELECT COUNT(*) n FROM puntos_notificaciones WHERE email = ? AND leida_at IS NULL', c.email);
    return json({ cuenta: true, ...(await saldoDe(env, c.email)), no_leidas: nl.n }, 200, NO_CACHE);
  }
  if (p === '/api/puntos/push/clave' && M === 'GET') {
    const c = await cuentaActual(req, env);
    if (!c) return fail('Entra a tu cuenta.', 401);
    return json(await rutasPush(req, env, url, c.email, {}));
  }
  if (p.startsWith('/api/puntos/') && M === 'POST') {
    if (!mismoOrigen(req, env)) return fail('Solicitud inválida.', 403);
    const c = await cuentaActual(req, env);
    if (!c) return fail('Tu sesión terminó. Vuelve a entrar.', 401);
    return accion(req, env, url, c.email);
  }
  return null;
}

export { NIVELES };
