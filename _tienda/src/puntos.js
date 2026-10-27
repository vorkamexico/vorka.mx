// Programa de puntos Vorka · vorka.mx/tienda/puntos/ y la mini app vorka.mx/tienda/cuenta/
//   /tienda/puntos/                 qué es y cómo funciona + crear cuenta / entrar (pública)
//   /tienda/puntos/acceso/<token>   canjear el enlace del correo → sesión
//   /tienda/cuenta/                 la app "Puntos Vorka" (instalable): Inicio · Compartir · Metas · Actividad.
//                                   Sin sesión muestra la entrada con correo + código de 6 dígitos (sirve dentro de la app
//                                   instalada, que en iPhone no comparte cookies con Safari).
//   /tienda/cuenta/sw.js · manifest.webmanifest · iconos/<n>.png
//   /api/puntos/entrar · codigo · salir · saldo · estado · meta · ajustes · sugerir · leidas · push/{clave,suscribir,quitar}
//   /api/puntos/retiro              transferencia a cuenta (solo cuentas habilitadas por el equipo)
// Reglas (Socios Vorka quedó integrado aquí): por cada compra pagada que entra con tu liga ganas un % de lo cobrado de
// productos de Vorka en puntos, según tu nivel del semestre (10% a 30%, ver puntos-reglas.js). +10 puntos porcentuales
// (tope 40%) si la compra incluye un producto con promoción vigente o un producto que tú sugeriste y el equipo aceptó.
// Comprarte a ti mismo no cuenta. Las renovaciones de suscripciones dan puntos hasta la factura 12 (no suben de nivel).
// 1 punto = $1 MXN, se canjean en cualquier producto de la tienda; siempre se cobra al menos $10 (mínimo de la pasarela).
// Si una compra se reembolsa, sus puntos se revierten exactamente (y los que se usaron en ella, regresan).
// Transferencia a cuenta: solo si el equipo la habilitó para esa persona (puntos_cuentas.puede_retirar); SPEI manual,
// mínimo 500 puntos, y los puntos de cada venta se pueden transferir 7 días después. No se anuncia en textos públicos.
import { one, all, run, json, fail, aleatorio, sha256, iguales, clabeValida } from './util.js';
import { hashToken } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA } from './marco.generado.js';
import { enviar, marco, boton, P } from './correo.js';
import { dentroDelLimite, VENDIBLE, productoPorSlug } from './modelo.js';
import { resolverDescuento, normalizar, duracionDe, PCT_REFERIDO } from './descuentos.js';
import { suscripcionDe } from './suscripciones.js';
import { avisar, rutasPush } from './puntos-push.js';
import { COBRO_MINIMO, NIVELES, PCT_EXTRA, PCT_TOPE, FACTOR_EQUIPO, FACTURAS_SUSCRIPCION, MINIMO_RETIRO, RETENCION_DIAS, nivelDe, pctPara, semestreMx, objetivoMeta, LOGROS, diaMx, inicioDiaMx, sumarDias, nombrePublico } from './puntos-reglas.js';
import { paginaApp, paginaEntrarApp, paginaPrograma, SW, manifiesto, icono } from './puntos-app.js';
import { pedirRetiro, datosRetiro } from './puntos-retiros.js';

export { COBRO_MINIMO };
const COOKIE = 'vorka_cuenta';
const ENLACE_MIN = 30, CODIGO_MIN = 15, CODIGO_INTENTOS = 5, SESION_DIAS = 60;
// Cómo funciona, en el correo de bienvenida (los % salen de puntos-reglas.js y descuentos.js)
const BIENVENIDA = [
  `<b>Así funciona:</b> comparte tu liga o tu código. Por cada compra pagada que entre con ellos ganas del ${NIVELES[0].pct} % al ${NIVELES.at(-1).pct} % de lo cobrado en puntos, según tu nivel del semestre. Cada punto vale $1 MXN en productos de Vorka México.`,
  `<b>Quien compra también gana:</b> por ser parte del ecosistema Vorka, tiene ${PCT_REFERIDO} % de descuento en su primer pago con tu liga o tu código (no aplica en productos de creadores; si usa otro código de descuento, se aplica el mayor y, si llegó con tu liga, tú sigues ganando tus puntos).`,
];
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

// Puntos apartados: los de órdenes pendientes (OXXO dura 3 días; sin límite de tiempo, se liberan cuando la orden
// vence o se rechaza) y los de órdenes ya pagadas cuyo canje aún no se registra (entre el pago y puntosAlPagar).
// Lo usa también el INSERT condicional de crearOrden para apartar puntos de forma atómica.
export const SQL_APARTADOS = `SELECT COALESCE(SUM(o.puntos_usados), 0) FROM orders o WHERE o.puntos_email = ? AND o.puntos_usados > 0
  AND (o.estado = 'pending' OR (o.estado = 'paid' AND NOT EXISTS (SELECT 1 FROM puntos_movimientos m WHERE m.order_id = o.id AND m.tipo = 'canje')))`;
export const SQL_MOVIMIENTOS = 'SELECT COALESCE(SUM(puntos), 0) FROM puntos_movimientos WHERE email = ?';

// Saldo disponible = movimientos − apartados. Puede ser negativo (no se esconde): una orden con saldo insuficiente al pagar
// queda marcada para revisar en el panel.
export async function saldoDe(env, email) {
  const r = await one(env, `SELECT (${SQL_MOVIMIENTOS}) total, (${SQL_APARTADOS}) apartados`, email, email);
  return { total: r.total, apartados: r.apartados, disponibles: r.total - r.apartados };
}

// Cuánto descuento (en centavos) se puede aplicar a una compra de `total` centavos
export const descuentoMaximo = (saldo, total) => Math.max(0, Math.min(saldo * 100, total - COBRO_MINIMO));

// Compras con tu liga que siguen vigentes (las reembolsadas no cuentan): definen tu nivel y tus logros
const VIGENTE = "m.tipo = 'ganado' AND NOT EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido')";
export const ventasDe = async (env, email) => (await one(env, `SELECT COUNT(*) n FROM puntos_movimientos m WHERE m.email = ? AND ${VIGENTE}`, email)).n;
// Ventas vigentes del semestre (definen el nivel y el %). Las renovaciones no cuentan (no tienen order_id).
export const ventasSemestre = async (env, email, fecha = new Date()) => {
  const sem = semestreMx(fecha);
  return (await one(env, `SELECT COUNT(*) n FROM puntos_movimientos m WHERE m.email = ? AND ${VIGENTE} AND m.order_id IS NOT NULL AND m.created_at >= ? AND m.created_at < ?`, email, sem.desde, sem.hasta)).n;
};
// Nivel y % de hoy (lo que ganaría la siguiente venta sin puntos extra)
// pct: el del nivel (lo que gana cualquier persona) · equipo: si la cuenta es del equipo de Vorka · pct_efectivo: con el ×1.5 del equipo y el tope
export async function nivelActual(env, email, fecha = new Date()) {
  const ventas = await ventasSemestre(env, email, fecha), sem = semestreMx(fecha);
  const equipo = await esEquipo(env, email);
  return { ventas, semestre: sem, nivel: nivelDe(ventas), pct: pctPara(ventas), equipo, pct_efectivo: pctPara(ventas, false, equipo) };
}
export const esEquipo = async (env, email) => !!(await one(env, 'SELECT 1 FROM puntos_cuentas WHERE email = ? AND equipo = 1', email));

// Equipo de Vorka México: Vorka OS manda los correos de sus personas activas. Marca exactamente esas cuentas (las que ya
// existen; quien aún no tiene cuenta queda marcado en la siguiente llamada) y desmarca a quien ya no está (bajas).
// No toca los puntos ya ganados: el factor solo cuenta para las ventas que se paguen después.
export async function marcarEquipo(env, emails) {
  if (!Array.isArray(emails)) throw new Error('emails');
  const lista = [...new Set(emails.map(e => String(e || '').trim().toLowerCase()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))].slice(0, 2000);
  const j = JSON.stringify(lista);
  const r = await run(env, `UPDATE puntos_cuentas SET equipo = CASE WHEN email IN (SELECT value FROM json_each(?)) THEN 1 ELSE 0 END
    WHERE equipo != CASE WHEN email IN (SELECT value FROM json_each(?)) THEN 1 ELSE 0 END`, j, j);
  const marcados = (await all(env, 'SELECT email FROM puntos_cuentas WHERE equipo = 1 ORDER BY email')).map(x => x.email);
  return { cambios: r.meta.changes, marcados };
}

// ---------- puntos extra (antes "puntos dobles") ----------
// Multiplicador de una orden para quien compartió la liga: se revisa cada producto de la orden y se toma el mayor
// (2 = con puntos extra si ese producto tiene promoción vigente el día del pago, o si lo sugirió quien compartió y el equipo
// lo aceptó antes del pago). Los extra no se acumulan entre sí: una vez por orden (+10 puntos porcentuales, tope 40%).
export async function multiplicadorDe(env, orden, refEmail) {
  const items = await all(env, 'SELECT i.product_id, i.nombre FROM order_items i WHERE i.order_id = ? ORDER BY i.id', orden.id);
  const pagada = orden.paid_at || new Date().toISOString(), dia = diaMx(pagada);
  let mejor = { mult: 1, motivo: null, product_id: items[0]?.product_id || null, producto: items[0]?.nombre || null };
  for (const it of items) {
    const sug = await one(env, "SELECT id FROM puntos_sugerencias WHERE email = ? AND estado = 'aceptada' AND product_id = ? AND decidida_at <= ? LIMIT 1", refEmail, it.product_id, pagada);
    const promo = sug ? null : await one(env, 'SELECT id FROM puntos_promos WHERE product_id = ? AND inicia <= ? AND termina >= ? LIMIT 1', it.product_id, dia, dia);
    if ((sug || promo) && mejor.mult < 2)
      mejor = { mult: 2, motivo: sug ? 'sugerencia' : 'promo', product_id: it.product_id, producto: it.nombre };
  }
  return mejor;
}

// ---------- al pagarse o reembolsarse una orden (webhook; idempotente por el índice único (order_id, tipo)) ----------
export async function puntosAlPagar(env, orderId) {
  const o = await one(env, "SELECT o.*, a.email ref_email, a.tipo ref_tipo FROM orders o LEFT JOIN affiliates a ON a.code = o.ref_code WHERE o.id = ?", orderId);
  if (!o || o.estado !== 'paid') return;
  if (o.puntos_usados > 0 && o.puntos_email && !(await one(env, "SELECT 1 FROM puntos_movimientos WHERE order_id = ? AND tipo = 'canje'", o.id))) {
    // Antes de descontar se revisa que el saldo alcance (sin contar esta misma orden). Si no alcanza (p. ej. se revirtieron
    // puntos de una venta reembolsada mientras esta orden esperaba su pago), el canje se registra igual —el descuento ya
    // se cobró así— y la orden queda marcada para revisar: el saldo negativo se ve, no se esconde.
    const habia = (await saldoDe(env, o.puntos_email)).disponibles + o.puntos_usados;
    const r = await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota) VALUES (?, 'canje', ?, ?, 'Usados en tu compra')", o.puntos_email, -o.puntos_usados, o.id);
    if (r.meta.changes && habia < o.puntos_usados) {
      await run(env, 'UPDATE orders SET revisar = ? WHERE id = ?', `Puntos insuficientes al pagar: se canjearon ${o.puntos_usados} y había ${habia} disponibles.`, o.id);
      console.error('ALERTA puntos: saldo insuficiente al confirmar el pago', o.id, o.puntos_usados, habia);
    }
  }
  // Gana quien compartió la liga, si es una cuenta de puntos y no se compró a sí mismo
  if (!(o.ref_tipo === 'puntos' && o.ref_email && o.ref_email !== o.email && o.monto_centavos > 0)) return;
  const base = await baseDeOrden(env, o);
  if (!base) return;   // solo productos de creadores: no dan puntos
  const m = await multiplicadorDe(env, o, o.ref_email);
  const pagada = o.paid_at || new Date().toISOString();
  const nota = m.mult > 1 ? `Puntos extra${m.motivo === 'sugerencia' ? ' por tu sugerencia' : ''} · ${m.producto}` : `Compra con tu liga${m.producto ? ` · ${m.producto}` : ''}`;
  const r = await insertarGanado(env, { email: o.ref_email, order_id: o.id, base, extra: m.mult > 1, pagada, cuenta: true,
    nota, product_id: m.product_id, multiplicador: m.mult, motivo: m.motivo });
  if (r.meta.changes) {
    const g = await one(env, "SELECT puntos, pct FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'", o.id);
    await despuesDeGanar(env, o.ref_email, { puntos: g.puntos, pct: g.pct, mult: m.mult, motivo: m.motivo, producto: m.producto, orderId: o.id });
  }
}

// Base de una orden: lo efectivamente cobrado de productos de Vorka (neto de descuentos, IVA incluido, antes de la
// comisión de Stripe). Si la orden mezcla productos de creadores, se prorratea. Los de creadores no dan puntos.
export async function baseDeOrden(env, o) {
  const items = await all(env, 'SELECT precio_centavos, cantidad, creador_id FROM order_items WHERE order_id = ?', o.id);
  const total = items.reduce((t, i) => t + i.precio_centavos * i.cantidad, 0);
  const propia = items.filter(i => !i.creador_id).reduce((t, i) => t + i.precio_centavos * i.cantidad, 0);
  if (!propia || !total) return 0;
  return propia === total ? o.monto_centavos : Math.round(o.monto_centavos * propia / total);
}

// Inserta un 'ganado' de forma atómica: el número de ventas vigentes del semestre (y con él el %) se cuenta dentro del
// mismo INSERT, así dos pagos que llegan juntos no pueden quedar con el mismo nivel. Idempotente por (order_id, tipo)
// o por `clave` (renovaciones). cuenta: false = renovación (usa el % del nivel, pero no sube de nivel).
async function insertarGanado(env, v) {
  const sem = semestreMx(v.pagada);
  const niveles = [...NIVELES].sort((a, b) => b.min - a.min);
  const caso = `(CASE ${niveles.map(() => 'WHEN x.n >= ? THEN ?').join(' ')} ELSE ? END)`;
  const pc = [...niveles.flatMap(n => [n.min, n.pct]), NIVELES[0].pct];
  // Equipo de Vorka (puntos_cuentas.equipo): el % (nivel + extra) se multiplica por FACTOR_EQUIPO, con el mismo tope (pctEfectivo)
  const pct = `MIN(?, ROUND((${caso} + ?) * x.f * 10) / 10.0)`, pp = [PCT_TOPE, ...pc, v.extra ? PCT_EXTRA : 0];
  return run(env, `WITH x AS (SELECT COUNT(*) n, COALESCE((SELECT CASE WHEN c.equipo = 1 THEN ? ELSE 1 END FROM puntos_cuentas c WHERE c.email = ?), 1) f
      FROM puntos_movimientos m WHERE m.email = ? AND ${VIGENTE} AND m.order_id IS NOT NULL AND m.created_at >= ? AND m.created_at < ?)
    INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota, product_id, multiplicador, motivo, base_centavos, pct, semestre, clave, suscripcion_id, factor)
    SELECT ?, 'ganado', CAST(ROUND(? * ${pct} / 100.0) AS INTEGER), ?, ?, ?, ?, ?, ?, ${pct}, ?, ?, ?, x.f FROM x`,
    FACTOR_EQUIPO, v.email, v.email, sem.desde, sem.hasta,
    v.email, v.base / 100, ...pp, v.order_id ?? null, String(v.nota || '').slice(0, 160), v.product_id ?? null, v.multiplicador ?? 1, v.motivo ?? null,
    v.base, ...pp, sem.id, v.clave ?? null, v.suscripcion_id ?? null);
}

// Renovación pagada de una suscripción (invoice.paid) que entró con una liga: puntos hasta la factura 12, con el % del
// nivel que la persona lleva en ese semestre (las renovaciones no suben de nivel). f = factura de Stripe; sub = suscripción.
export async function puntosFactura(env, f, sub) {
  if (!f || f.status !== 'paid' || !(f.amount_paid > 0)) return null;
  if (f.billing_reason === 'subscription_create') return null;   // la factura 1 es la compra: ya dio puntos con la orden
  const orderId = sub?.metadata?.order_id;
  if (!orderId) return null;
  const o = await one(env, "SELECT o.id, o.email, a.email ref_email, a.tipo ref_tipo, (SELECT nombre FROM order_items WHERE order_id = o.id ORDER BY id LIMIT 1) producto FROM orders o JOIN affiliates a ON a.code = o.ref_code WHERE o.id = ?", orderId);
  if (!o || o.ref_tipo !== 'puntos' || !o.ref_email || o.ref_email === o.email) return null;
  const previas = (await one(env, "SELECT COUNT(*) n FROM puntos_movimientos WHERE suscripcion_id = ? AND tipo = 'ganado' AND clave != ?", sub.id, `factura:${f.id}`)).n;
  const numero = 2 + previas;
  if (numero > FACTURAS_SUSCRIPCION) return null;
  const pagada = f.status_transitions?.paid_at ? new Date(f.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString();
  const r = await insertarGanado(env, { email: o.ref_email, clave: `factura:${f.id}`, suscripcion_id: sub.id, base: f.amount_paid, extra: false, pagada,
    nota: `${o.producto || 'Suscripción'} · pago ${numero} de ${FACTURAS_SUSCRIPCION}` });
  if (r.meta.changes) {
    const g = await one(env, 'SELECT puntos, pct FROM puntos_movimientos WHERE clave = ?', `factura:${f.id}`);
    await despuesDeGanar(env, o.ref_email, { puntos: g.puntos, pct: g.pct, mult: 1, producto: o.producto, orderId: `factura:${f.id}`, renovacion: true });
  }
  return r;
}

export async function puntosAlReembolsar(env, orderId) {
  // Se revierte exactamente lo que se dio (con o sin puntos dobles) y se regresa exactamente lo que se usó
  const ms = await all(env, "SELECT * FROM puntos_movimientos WHERE order_id = ? AND tipo IN ('ganado', 'canje')", orderId);
  for (const m of ms)
    await run(env, 'INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, order_id, nota, product_id, multiplicador) VALUES (?, ?, ?, ?, ?, ?, ?)',
      m.email, m.tipo === 'ganado' ? 'revertido' : 'devuelto', -m.puntos, orderId, m.tipo === 'ganado' ? 'La compra con tu liga se reembolsó' : 'Te regresamos los puntos de una compra reembolsada', m.product_id, m.multiplicador);
}

// Avisos al ganar: puntos (app + push + correo corto), subir de nivel y meta alcanzada (app + push). Nunca lanza.
async function despuesDeGanar(env, email, { puntos, pct, mult, motivo, producto, orderId, renovacion = false }) {
  try {
    const s = await saldoDe(env, email);
    await avisar(env, email, {
      clave: `ganado:${orderId}`, tipo: 'ganado',
      titulo: mult > 1 ? `¡Puntos extra! +${puntos} puntos` : `¡Ganaste ${puntos} puntos!`,
      cuerpo: `${renovacion ? 'Se renovó una suscripción que entró con tu liga' : `Alguien compró${producto ? ` ${producto}` : ''} con tu liga`}${motivo === 'sugerencia' ? ' (el producto que sugeriste)' : ''}: ${pct}% en puntos. Ya tienes ${s.disponibles} puntos ($${s.disponibles} MXN en la tienda).`,
      url: '/tienda/cuenta/#actividad',
    }, { correo: { asunto: `Ganaste ${puntos} puntos Vorka`, extra: `<p style="${P}">Sigue compartiendo tu liga: por ser parte del ecosistema Vorka, quien compra con ella tiene ${PCT_REFERIDO} % de descuento en su primer pago, y tú ganas tus puntos.</p>` } });
    if (renovacion) return revisarMeta(env, email, s);
    const ventas = await ventasSemestre(env, email);
    const n = nivelDe(ventas);
    if (n.indice > 0 && n.actual.min === ventas)
      await avisar(env, email, { clave: `nivel:${semestreMx().id}:${n.actual.id}`, tipo: 'nivel', titulo: `Subiste a nivel ${n.actual.nombre}: ${n.actual.pct}%`, cuerpo: `Llevas ${ventas} compras con tu liga este semestre. Desde ahora ganas ${n.actual.pct}% de cada compra. ${n.siguiente ? `Te faltan ${n.siguiente.min - ventas} para ${n.siguiente.nombre} (${n.siguiente.pct}%).` : 'Llegaste a lo más alto.'}`, url: '/tienda/cuenta/#metas' });
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

// ---------- contraseña ----------
// Correo → la app sabe si ya hay cuenta. Nueva: nombre + contraseña. Con contraseña: entrar. Sin contraseña (cuentas de antes)
// u olvido: un código al correo para crearla. Ninguna cuenta existente se puede tomar sin ese código.
const ITER = 100000;
async function pbkdf2(clave, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITER }, k, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const claveInvalida = c => typeof c !== 'string' || c.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : c.length > 200 ? 'La contraseña es demasiado larga.' : null;
// ¿Ya hay cuenta con ese correo? (también si ya tenía liga de puntos aunque nunca haya entrado a la app)
async function cuentaDe(env, email) {
  const c = await one(env, 'SELECT email, nombre, clave_hash, clave_salt FROM puntos_cuentas WHERE email = ?', email);
  if (c) return c;
  const a = await one(env, "SELECT email FROM affiliates WHERE email = ? AND tipo = 'puntos'", email);
  return a ? { email, clave_hash: null } : null;
}
async function leerCuerpo(req, env) {
  if (!mismoOrigen(req, env)) return null;
  const b = await req.json().catch(() => ({}));
  return { ...b, email: String(b.email || '').trim().toLowerCase() };
}
const limiteIp = async (req, env, k, n, s) => dentroDelLimite(env, `puntos:${k}:${await sha256(req.headers.get('cf-connecting-ip') || 'local')}`, n, s);

async function existeCuenta(req, env) {
  const b = await leerCuerpo(req, env); if (!b) return fail('Solicitud inválida.', 403);
  if (!emailValido(b.email)) return fail('Escribe un correo válido.');
  if (!(await limiteIp(req, env, 'existe', 40, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const c = await cuentaDe(env, b.email);
  return json({ existe: !!c, con_clave: !!c?.clave_hash, nombre: c?.nombre ? String(c.nombre).split(' ')[0] : null }, 200, NO_CACHE);
}

async function registrar(req, env) {
  const b = await leerCuerpo(req, env); if (!b) return fail('Solicitud inválida.', 403);
  if (!emailValido(b.email)) return fail('Escribe un correo válido.');
  const nombre = String(b.nombre || '').trim().slice(0, 80);
  if (nombre.length < 2) return fail('Escribe tu nombre.');
  const mal = claveInvalida(b.clave); if (mal) return fail(mal);
  if (b.terminos !== true) return fail('Acepta las condiciones del programa de puntos.');
  if (!(await limiteIp(req, env, 'registro', 10, 3600))) return fail('Demasiados intentos. Espera un rato e intenta de nuevo.', 429);
  const ya = await cuentaDe(env, b.email);
  if (ya) return json({ error: ya.clave_hash ? 'Ese correo ya tiene cuenta. Entra con tu contraseña.' : 'Ese correo ya tiene cuenta. Te mandamos un código para crear tu contraseña.', existe: true, con_clave: !!ya.clave_hash }, 409);
  const salt = aleatorio(16), hash = await pbkdf2(b.clave, salt);
  await codigoDe(env, b.email, nombre);
  const r = await run(env, 'INSERT OR IGNORE INTO puntos_cuentas (email, nombre, clave_hash, clave_salt) VALUES (?, ?, ?, ?)', b.email, nombre, hash, salt);
  if (!r.meta.changes) return json({ error: 'Ese correo ya tiene cuenta. Entra con tu contraseña.', existe: true, con_clave: true }, 409);
  // Bienvenida (si no fue esa persona, lo sabrá)
  await enviar(env, { para: b.email, asunto: 'Tu cuenta de Puntos Vorka está lista', idempotencia: `puntos-bienvenida-${await sha256(b.email)}`,
    html: marco('¡Bienvenida a Puntos Vorka!', `<p style="${P}">Hola, ${esc(nombre.split(' ')[0])}: tu cuenta ya está lista. Entra con tu correo y la contraseña que creaste para compartir tu liga y ganar puntos.</p>${BIENVENIDA.map(x => `<p style="${P}">${x}</p>`).join('')}${boton(`${env.SITE_URL}/tienda/cuenta/`, 'Abrir mi app')}<p style="${P}">¿No creaste esta cuenta? Escríbenos a hola@vorka.mx.</p>`, { etiqueta: 'Puntos' }),
    texto: `Tu cuenta de Puntos Vorka está lista. Entra en ${env.SITE_URL}/tienda/cuenta/ con tu correo y tu contraseña.\n\n${BIENVENIDA.map(x => x.replace(/<[^>]+>/g, '')).join('\n\n')}\n\n¿No creaste esta cuenta? Escríbenos a hola@vorka.mx.` }).catch(e => console.error('puntos bienvenida', e));
  return json({ ok: true }, 200, { 'set-cookie': await crearSesion(env, b.email) });
}

async function entrarConClave(req, env) {
  const b = await leerCuerpo(req, env); if (!b) return fail('Solicitud inválida.', 403);
  if (!emailValido(b.email)) return fail('Escribe un correo válido.');
  if (!(await limiteIp(req, env, 'login-ip', 30, 900)) || !(await dentroDelLimite(env, `puntos:login:${await sha256(b.email)}`, 10, 900)))
    return fail('Demasiados intentos. Espera unos minutos o crea una contraseña nueva con “¿Olvidaste tu contraseña?”.', 429);
  const c = await cuentaDe(env, b.email);
  if (!c) return json({ error: 'No hay cuenta con ese correo. Crea una nueva.', existe: false }, 404);
  if (!c.clave_hash) return json({ error: 'Tu cuenta todavía no tiene contraseña. Te mandamos un código para crearla.', existe: true, con_clave: false }, 409);
  if (!iguales(c.clave_hash, await pbkdf2(String(b.clave || ''), c.clave_salt))) return fail('Contraseña incorrecta. Revísala o usa “¿Olvidaste tu contraseña?”.', 401);
  return json({ ok: true }, 200, { 'set-cookie': await crearSesion(env, b.email) });
}

// Código al correo para crear o cambiar la contraseña (cuentas de antes u olvido)
async function codigoClave(req, env) {
  const b = await leerCuerpo(req, env); if (!b) return fail('Solicitud inválida.', 403);
  if (!emailValido(b.email)) return fail('Escribe un correo válido.');
  if (!(await limiteIp(req, env, 'clave-ip', 10, 600)) || !(await dentroDelLimite(env, `puntos:clave:${await sha256(b.email)}`, 4, 600)))
    return fail('Pediste muchos códigos seguidos. Espera unos minutos y revisa tu bandeja (también spam).', 429);
  const c = await cuentaDe(env, b.email);
  // No decimos si el correo existe o no más de lo que ya dice la pantalla: sin cuenta no se manda nada
  if (!c) return json({ error: 'No hay cuenta con ese correo. Crea una nueva.', existe: false }, 404);
  const cod = codigo6(), ahora = new Date().toISOString();
  await run(env, 'UPDATE puntos_codigos SET usado_at = ? WHERE email = ? AND usado_at IS NULL', ahora, b.email);
  await run(env, 'INSERT INTO puntos_codigos (email, codigo_hash, expira_at) VALUES (?, ?, ?)', b.email, await hashCodigo(env, b.email, cod), new Date(Date.now() + CODIGO_MIN * 60e3).toISOString());
  await enviar(env, { para: b.email, asunto: `${cod} es tu código para crear tu contraseña de Puntos Vorka`, idempotencia: `puntos-clave-${aleatorio(8)}`,
    html: marco('Crea tu contraseña', `<p style="${P}">Escribe este código en la app para crear tu contraseña de Puntos Vorka:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;width:100%"><tr><td align="center" style="background:#F4F2EF;border-radius:16px;padding:18px 12px"><div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#141114;font-family:'SF Mono',Menlo,Consolas,monospace">${cod}</div><div style="font-size:12.5px;color:#A8A4A9;margin-top:6px">Vence en ${CODIGO_MIN} minutos · un solo uso</div></td></tr></table><p style="${P}">Si no lo pediste, ignora este correo: tu cuenta sigue igual.</p>`, { etiqueta: 'Puntos' }),
    texto: `Tu código para crear tu contraseña de Puntos Vorka: ${cod} (vence en ${CODIGO_MIN} minutos).\n\nSi no lo pediste, ignora este correo.` });
  return json({ ok: true, reenviar_en: 60, ...(!env.RESEND_API_KEY && !env.CORREO ? { codigo: cod } : {}) });
}

async function nuevaClave(req, env) {
  const b = await leerCuerpo(req, env); if (!b) return fail('Solicitud inválida.', 403);
  if (!emailValido(b.email)) return fail('Escribe un correo válido.');
  const cod = String(b.codigo || '').replace(/\D/g, '');
  if (cod.length !== 6) return fail('El código tiene 6 dígitos.');
  const mal = claveInvalida(b.clave); if (mal) return fail(mal);
  if (!(await limiteIp(req, env, 'codigo-ip', 30, 900)) || !(await dentroDelLimite(env, `puntos:codigo:${await sha256(b.email)}`, 12, 900)))
    return fail('Demasiados intentos. Espera unos minutos y pide un código nuevo.', 429);
  const ahora = new Date().toISOString();
  const fila = await one(env, 'SELECT * FROM puntos_codigos WHERE email = ? AND usado_at IS NULL AND expira_at > ? ORDER BY id DESC LIMIT 1', b.email, ahora);
  if (!fila) return fail('Ese código ya venció o ya se usó. Pide uno nuevo.');
  if (fila.intentos >= CODIGO_INTENTOS) return fail('Demasiados intentos con este código. Pide uno nuevo.', 429);
  if (!iguales(fila.codigo_hash, await hashCodigo(env, b.email, cod))) {
    await run(env, 'UPDATE puntos_codigos SET intentos = intentos + 1 WHERE id = ?', fila.id);
    return fail('Código incorrecto. Revisa el último correo que te llegó.');
  }
  if (!(await run(env, 'UPDATE puntos_codigos SET usado_at = ? WHERE id = ? AND usado_at IS NULL', ahora, fila.id)).meta.changes) return fail('Ese código ya se usó. Pide uno nuevo.');
  const salt = aleatorio(16), hash = await pbkdf2(b.clave, salt), nombre = String(b.nombre || '').trim().slice(0, 80) || null;
  await codigoDe(env, b.email, nombre);
  await run(env, `INSERT INTO puntos_cuentas (email, nombre, clave_hash, clave_salt) VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET clave_hash = excluded.clave_hash, clave_salt = excluded.clave_salt, nombre = COALESCE(puntos_cuentas.nombre, excluded.nombre)`, b.email, nombre, hash, salt);
  // Al cambiar la contraseña se cierran las demás sesiones
  await run(env, "DELETE FROM puntos_accesos WHERE email = ? AND tipo = 'sesion'", b.email);
  return json({ ok: true }, 200, { 'set-cookie': await crearSesion(env, b.email) });
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
  if (app === 'simulador-paa' || app === 'simulador-unam' || app === 'simulador-ecoems') return { ruta: `/${app}/`, titulo: p.nombre, tipo: 'simulador', texto: p.descripcion_corta };
  return { ruta: p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`, titulo: p.nombre, tipo: 'producto', texto: p.descripcion_corta };
}
// Las tarjetas salen de los productos visibles en el catálogo (se respeta contenido.oculto); los planes ocultos que se
// venden en esa misma página (Cupo Pro 100, planes de Brindi…) se suman a la tarjeta para mostrar sus puntos dobles.
export function compartibles(productos) {
  const m = new Map();
  for (const p of productos.filter(p => !p.contenido?.oculto)) {
    const d = destinoDe(p);
    // creador: los productos de creadores no llevan el 5 % de descuento por recomendación (los mensajes no lo ofrecen)
    if (!m.has(d.ruta)) m.set(d.ruta, { ...d, creador: !!p.creador_id, ids: [], imagen: p.imagen || (d.tipo === 'brindi' ? '/assets/tienda/v3/brindi-portada.webp' : d.tipo === 'cupo' ? '/assets/tienda/v3/cupo-portada.webp' : null) });
  }
  for (const p of productos) m.get(destinoDe(p).ruta)?.ids.push(p.id);
  return [...m.values()];
}

// Todo lo que se puede comprar hoy (incluye los planes ocultos del catálogo que se venden en su propia página)
async function vendibles(env) {
  return (await all(env, `SELECT p.id, p.slug, p.nombre, p.descripcion_corta, p.precio_centavos, p.imagen, p.contenido, p.creador_id FROM products p WHERE ${VENDIBLE} ORDER BY p.orden, p.nombre`))
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
  const ventas = await ventasDe(env, email);   // de por vida (logros)
  const ahora = await nivelActual(env, email);  // del semestre (nivel y %)
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
    saldo, ventas, ventas_semestre: ahora.ventas, nivel: ahora.nivel, pct: ahora.pct, semestre: ahora.semestre, semana, productos, compartir: compartibles(todos), dobles: await doblesDe(env, email),
    meta: meta && { id: meta.id, nombre: meta.nombre, precio_centavos: meta.precio_centavos, objetivo: objetivoMeta(meta.precio_centavos) },
    movimientos, notificaciones, no_leidas: notificaciones.filter(x => !x.leida_at).length, sugerencias, push,
    logros: LOGROS.map(l => ({ ...l, ok: !!logrado[l.id] })),
    retiro: await datosRetiro(env, email),
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
  // Transferencia a cuenta: solo cuentas habilitadas por el equipo (las demás reciben 404, como si no existiera)
  if (p === '/api/puntos/retiro') {
    if (!(await dentroDelLimite(env, `puntos:retiro:${await sha256(email)}`, 10, 3600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
    const r = await pedirRetiro(env, email, b);
    return r.error ? fail(r.error, r.status || 400) : json(r);
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
  if (p === '/api/puntos/existe' && M === 'POST') return existeCuenta(req, env);
  if (p === '/api/puntos/registro' && M === 'POST') return registrar(req, env);
  if (p === '/api/puntos/login' && M === 'POST') return entrarConClave(req, env);
  if (p === '/api/puntos/clave/codigo' && M === 'POST') return codigoClave(req, env);
  if (p === '/api/puntos/clave/nueva' && M === 'POST') return nuevaClave(req, env);
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
  // ¿Qué hace este código en esta compra? (formulario de compra; con límite por IP para que no se puedan adivinar)
  // ?c= lo escrito (código de descuento o de quien recomendó) · ?slug= el producto o plan elegido (para saber si aplica).
  // Sin ?c= responde con el de la liga (cookie vorka_ref), para mostrarlo ya aplicado. Nunca dice quién recomendó.
  // { valido, codigo, tipo: 'codigo' | 'referido', texto: el descuento que se aplica y por qué, aviso: por qué no aplica }
  if (p === '/api/puntos/liga' && M === 'GET') {
    const ipq = req.headers.get('cf-connecting-ip') || 'local';
    if (!(await dentroDelLimite(env, `puntos:liga:${await sha256(ipq)}`, 30, 600))) return fail('Demasiados intentos. Espera unos minutos.', 429);
    const deCookie = (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === 'vorka_ref')?.[1] || '';
    const liga = decodeURIComponent(deCookie);
    const escrito = url.searchParams.has('c') ? normalizar(url.searchParams.get('c')).slice(0, 40) : null;
    const slug = String(url.searchParams.get('slug') || '').trim().toLowerCase();
    const prod = /^[a-z0-9-]{1,80}$/.test(slug) ? await productoPorSlug(env, slug) : null;
    const s = suscripcionDe(prod);
    const sus = s && !prod.contenido.complemento ? { intervalo: s.intervalo === 'year' ? 'year' : 'month', app: prod.contenido.acceso?.app || null } : null;
    const r = await resolverDescuento(env, { escrito: escrito ?? liga, liga: escrito ? liga : null, sus });
    // Los productos de creadores no llevan descuento (crearOrden lo calcula solo sobre lo de Vorka)
    if (prod?.creador_id) r.descuento = null;
    const codigo = escrito ?? normalizar(liga);
    // ¿Lo escrito sirvió? Es un código de descuento que aplica, o es de una persona de referidos
    const esDesc = r.descuento?.tipo === 'codigo' && r.descuento.codigo === codigo;
    const esRef = !!r.ref && r.ref === codigo;
    const valido = esDesc || esRef;
    // descuento: lo que la página usa para su «Pagas hoy» (con el mismo cálculo que el servidor, centavosDescuento)
    const calc = r.descuento ? { pct: r.descuento.pct, duracion: sus ? duracionDe(r.descuento) : null, meses: r.descuento.meses ?? null,
      etiqueta: r.descuento.tipo === 'referido' ? `${r.descuento.pct} % por recomendación` : `${r.descuento.codigo}: ${r.descuento.pct} %` } : null;
    if (!valido && !r.avisos.length) return json({ valido: false, ...(r.descuento ? { texto: r.descuento.texto, descuento: calc } : {}) }, 200, NO_CACHE);
    // Gana un código de descuento sobre el 5 %: se dice que no se acumulan
    const nota = esDesc && r.ref ? ' (no se acumula con el 5 % por recomendación)' : '';
    return json({ valido, codigo, tipo: esDesc ? 'codigo' : esRef ? 'referido' : null, texto: r.descuento ? r.descuento.texto + nota : null,
      aviso: r.avisos[0] || null, de_liga: !escrito, descuento: calc }, 200, NO_CACHE);
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
