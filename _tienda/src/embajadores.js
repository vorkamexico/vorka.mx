// Embajadores Vorka · red de vendedores dentro de Puntos Vorka (migración 0066). Páginas en embajadores-app.js.
//
// Principio (decisión del dueño, 2026-11-02): se gana por ventas reales a clientes, nunca por invitar. Participar es gratis y
// no hay que comprar nada. Reglas en puntos-reglas.js (PCT_RED, PCT_TOPE_VENTA, BONO_ARRANQUE, DIAS_ARRANQUE, rangos).
//
//   Patrocinador   La cuenta que se crea desde una liga de invitación (/tienda/puntos/unete/<código>) queda con patrocinador =
//                  quien invitó (puntos_cuentas.patrocinador). Es fijo: quien ya tiene cuenta no cambia al abrir otra liga y
//                  solo un admin lo cambia (cambiarPatrocinador, con bitácora). Sin ciclos.
//   Red            Sobre cada venta que le da puntos a un vendedor (mismo momento y misma base: lo cobrado de productos de
//                  Vorka, después de descuentos, con IVA): 5 % a su patrocinador (nivel 1) y 2 % al de su patrocinador (nivel
//                  2). Sin ×1.5. Tope por venta: % del vendedor + red + 5 % de descuento al cliente (si aplicó) ≤ 50 %; se
//                  recorta primero el nivel 2. Renovaciones: las que le dan puntos al vendedor, hasta la factura 12.
//                  No cuentan: compras dentro de la propia red (quien compra es el vendedor, su patrocinador o el de su
//                  patrocinador, por correo: la venta queda excluida = 1), lo pagado con saldo del Toolkit (orden de $0 sin
//                  liga) y productos de creadores (fuera de la base). Reembolso total o parcial → se revierte (proporcional).
//   Bono           +50 al vendedor nuevo (que entró con una liga de invitación) si su primera venta válida es dentro de 30
//                  días desde su registro. Una vez; se revierte si esa venta se reembolsa. No da red.
//   Rangos         Del mes (centro de México): Líder = 3 personas de su equipo directo con ≥ 1 venta válida en el mes (el
//                  líder no necesita vender); Élite = Líder con 2 Líderes en su equipo directo. Reconocimiento, sin dinero.
// Idempotente: todo va con clave única ('red:<venta>:<nivel>', 'red-rev:…', 'arranque:<correo>', 'arranque-rev:<correo>').
// Nunca se guardan ni se muestran datos de quien compró: las notas solo llevan el nombre público del vendedor.
import { one, all, run } from './util.js';
import { afiliado, REFERIDO, PCT_REFERIDO } from './descuentos.js';
import { avisar } from './puntos-push.js';
import { PCT_RED, PCT_TOPE_VENTA, BONO_ARRANQUE, DIAS_ARRANQUE, LIDER_ACTIVOS, ELITE_LIDERES, RANGOS, rangoDe, DIAS_SIN_VENDER,
  MIN_CUENTAS_GANANCIAS, FACTURAS_SUSCRIPCION, pctRed, puntosDe, mesMx, semestreMx, nombrePublico, nivelDe } from './puntos-reglas.js';

const norm = e => String(e || '').trim().toLowerCase();
const emailValido = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e || '');
const DIA = 864e5;
// Nombre de una cuenta (el de la app o, si no tiene, el de su liga)
const NOMBRE = a => `COALESCE(${a}.nombre, (SELECT nombre FROM affiliates WHERE email = ${a}.email AND tipo = 'puntos'))`;

// Venta válida de un vendedor (para rangos y la lista del equipo): 'ganado' de una orden, no excluida y no reembolsada
const VALIDA = `m.tipo = 'ganado' AND m.order_id IS NOT NULL AND m.excluida = 0
  AND NOT EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido')`;
const SQL_VENTAS_MES = `SELECT COUNT(*) FROM puntos_movimientos m WHERE m.email = {E} AND ${VALIDA} AND m.created_at >= ? AND m.created_at < ?`;

// ---------- patrocinador ----------
export const patrocinadorDe = async (env, email) => (await one(env, 'SELECT patrocinador FROM puntos_cuentas WHERE email = ?', norm(email)))?.patrocinador || null;
// [nivel 1, nivel 2] de un vendedor (correos o null)
export async function lineaArriba(env, email) {
  const n1 = await patrocinadorDe(env, email);
  const n2 = n1 ? await patrocinadorDe(env, n1) : null;
  return [n1, n2 && n2 !== email ? n2 : null];
}
// ¿Poner a `nuevo` como patrocinador de `email` haría un ciclo? (él mismo, o alguien que está debajo de `email`)
export async function haceCiclo(env, email, nuevo) {
  if (!nuevo) return false;
  if (norm(nuevo) === norm(email)) return true;
  return !!(await one(env, `WITH RECURSIVE arriba(e, d) AS (SELECT ?1, 0 UNION SELECT c.patrocinador, arriba.d + 1 FROM puntos_cuentas c
      JOIN arriba ON c.email = arriba.e WHERE c.patrocinador IS NOT NULL AND arriba.d < 1000)
    SELECT 1 FROM arriba WHERE e = ?2 LIMIT 1`, norm(nuevo), norm(email)));
}
const nombreDe = async (env, email) => (await one(env, `SELECT COALESCE(c.nombre, (SELECT nombre FROM affiliates WHERE email = ?1 AND tipo = 'puntos')) nombre
  FROM (SELECT ?1 email) x LEFT JOIN puntos_cuentas c ON c.email = x.email`, norm(email)))?.nombre || null;

// Quién invita con un código (de puntos, activo): { email, code, nombre (público) } o null
export async function invitadorDe(env, codigo) {
  const a = await afiliado(env, codigo);
  if (!a?.email) return null;
  const t = await one(env, "SELECT tipo, publico FROM affiliates WHERE code = ?", a.code);
  if (t?.tipo !== 'puntos') return null;
  return { email: a.email, code: t.publico || a.code, nombre: nombrePublico(await nombreDe(env, a.email)) };
}

// Al crear una cuenta NUEVA desde una liga de invitación. Nunca cambia un patrocinador que ya existe.
export async function fijarPatrocinadorAlta(env, email, codigo) {
  const e = norm(email);
  const inv = codigo ? await invitadorDe(env, codigo) : null;
  if (!inv || await haceCiclo(env, e, inv.email)) return null;
  const r = await run(env, 'UPDATE puntos_cuentas SET patrocinador = ?, patrocinado_at = ? WHERE email = ? AND patrocinador IS NULL', inv.email, new Date().toISOString(), e);
  if (!r.meta.changes) return null;
  await run(env, "INSERT INTO puntos_patrocinio_bitacora (email, antes, despues, motivo, por) VALUES (?, NULL, ?, 'Alta con liga de invitación', 'invitacion')", e, inv.email);
  return inv.email;
}

// Admin (Vorka OS): cambiar el patrocinador de una cuenta (nuevo = null lo quita), con motivo y bitácora
export async function cambiarPatrocinador(env, email, nuevo, motivo, por = null) {
  const e = norm(email), n = nuevo == null || nuevo === '' ? null : norm(nuevo), m = String(motivo || '').trim().slice(0, 280);
  if (!emailValido(e)) return { ok: false, error: 'Correo inválido.' };
  if (m.length < 5) return { ok: false, error: 'Escribe el motivo del cambio.' };
  const c = await one(env, 'SELECT email, patrocinador FROM puntos_cuentas WHERE email = ?', e);
  if (!c) return { ok: false, error: 'Esa cuenta no existe.' };
  if (n) {
    if (!(await one(env, 'SELECT 1 FROM puntos_cuentas WHERE email = ?', n))) return { ok: false, error: 'La cuenta del nuevo patrocinador no existe.' };
    if (await haceCiclo(env, e, n)) return { ok: false, error: n === e ? 'Una cuenta no puede patrocinarse a sí misma.' : 'Ese cambio haría un ciclo: el nuevo patrocinador está en el equipo de esta cuenta.' };
  }
  if ((c.patrocinador || null) === n) return { ok: true, sin_cambio: true, antes: c.patrocinador, despues: n };
  await env.DB.batch([
    env.DB.prepare('UPDATE puntos_cuentas SET patrocinador = ?, patrocinado_at = ? WHERE email = ?').bind(n, n ? new Date().toISOString() : null, e),
    env.DB.prepare('INSERT INTO puntos_patrocinio_bitacora (email, antes, despues, motivo, por) VALUES (?, ?, ?, ?, ?)').bind(e, c.patrocinador, n, m, por ? norm(por).slice(0, 120) : null),
  ]);
  return { ok: true, antes: c.patrocinador, despues: n };
}

// ---------- al ganar una venta ----------
// o: la orden (con email y puntos_email de quien compró, descuento_codigo) · g: el movimiento 'ganado' del vendedor
export async function alGanarVenta(env, o, g) {
  const vendedor = g.email;
  const [n1, n2] = await lineaArriba(env, vendedor);
  // Compra dentro de la propia red: no cuenta para la red, los rangos ni el bono (el vendedor conserva sus puntos)
  const compradores = new Set([norm(o.email), norm(o.puntos_email)].filter(Boolean));
  const interna = [vendedor, n1, n2].some(x => x && compradores.has(x));
  if (interna) { await run(env, "UPDATE puntos_movimientos SET excluida = 1 WHERE id = ? AND excluida = 0", g.id); return { interna: true }; }
  const desc = o.descuento_codigo === REFERIDO ? PCT_REFERIDO : 0;
  await repartirRed(env, { vendedor, n1, n2, venta: o.id, base: g.base_centavos, pctVendedor: g.pct, pctDescuento: desc, producto: o.producto });
  await bonoArranque(env, vendedor, g);
  // Rangos: la venta puede subir a su patrocinador a Líder y, con eso, al de arriba a Élite
  const mes = mesMx(g.created_at).id;
  for (const x of [n1, n2]) if (x) await actualizarRango(env, x, mes);
  return { interna: false };
}

// Renovación de una suscripción que le dio puntos al vendedor (hasta la factura FACTURAS_SUSCRIPCION). Sin bono ni rangos.
export async function alGanarRenovacion(env, { vendedor, comprador, clave, numero, base, pct }) {
  if (numero > FACTURAS_SUSCRIPCION) return null;
  const [n1, n2] = await lineaArriba(env, vendedor);
  if ([vendedor, n1, n2].some(x => x && x === norm(comprador))) return null;
  return repartirRed(env, { vendedor, n1, n2, venta: clave, base, pctVendedor: pct, pctDescuento: 0, renovacion: true });
}

async function repartirRed(env, { vendedor, n1, n2, venta, base, pctVendedor, pctDescuento, renovacion = false }) {
  if (!base || base <= 0) return [];
  const pcts = pctRed(pctVendedor, pctDescuento), quien = nombrePublico(await nombreDe(env, vendedor)), hechos = [];
  for (const [i, email] of [n1, n2].entries()) {
    const nivel = i + 1, pct = pcts[i], puntos = puntosDe(base, pct);
    if (!email || puntos <= 0) continue;
    const r = await run(env, `INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, nota, base_centavos, pct, semestre, clave, nivel_red, vendedor, venta)
      VALUES (?, 'red', ?, ?, ?, ?, ?, ?, ?, ?, ?)`, email, puntos, `Venta de tu equipo · ${quien} (nivel ${nivel})${renovacion ? ' · renovación' : ''}`.slice(0, 160),
      base, pct, semestreMx().id, `red:${venta}:${nivel}`, nivel, vendedor, venta);
    if (r.meta.changes) {
      hechos.push({ email, nivel, puntos });
      await avisar(env, email, { clave: `red:${venta}:${nivel}`, tipo: 'red', titulo: `Tu equipo vendió: +${puntos} puntos`,
        cuerpo: `${quien} (nivel ${nivel}) hizo una venta${renovacion ? ' (renovación)' : ''}. Ganas ${pct} % en puntos.`, url: '/tienda/cuenta/#ganancias' });
    }
  }
  return hechos;
}

async function bonoArranque(env, vendedor, g) {
  if (await one(env, "SELECT 1 FROM puntos_movimientos WHERE clave = ?", `arranque:${vendedor}`)) return null;
  // Solo cuentas que entraron con una liga de invitación (Embajadores es por invitación; la página pública de Puntos no lo anuncia)
  const c = await one(env, 'SELECT created_at, patrocinador FROM puntos_cuentas WHERE email = ?', vendedor);
  if (!c?.patrocinador || Date.parse(g.created_at) - Date.parse(c.created_at) > DIAS_ARRANQUE * DIA) return null;
  // Su primera venta válida: ninguna otra antes de esta
  const previa = await one(env, `SELECT 1 FROM puntos_movimientos m WHERE m.email = ? AND m.id < ? AND ${VALIDA} LIMIT 1`, vendedor, g.id);
  if (previa) return null;
  const r = await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, nota, clave, venta) VALUES (?, 'arranque', ?, ?, ?, ?)",
    vendedor, BONO_ARRANQUE, `Bono de arranque: tu primera venta en tus primeros ${DIAS_ARRANQUE} días`, `arranque:${vendedor}`, g.order_id);
  if (r.meta.changes) await avisar(env, vendedor, { clave: `arranque:${vendedor}`, tipo: 'arranque', titulo: `¡Bono de arranque! +${BONO_ARRANQUE} puntos`,
    cuerpo: `Hiciste tu primera venta en tus primeros ${DIAS_ARRANQUE} días.`, url: '/tienda/cuenta/#ganancias' });
  return r;
}

// ---------- reembolsos ----------
// Total (orden reembolsada o contracargo): se revierte lo que quede de la red y el bono de arranque de esa venta
export async function redAlReembolsar(env, orderId) {
  for (const m of await all(env, "SELECT * FROM puntos_movimientos WHERE venta = ? AND tipo = 'red' AND puntos > 0", orderId)) {
    const ya = await revertidoDe(env, m);
    if (m.puntos - ya > 0) await insertarReversa(env, m, m.puntos - ya, `red-rev:${orderId}:${m.nivel_red}:total`, 'La venta de tu equipo se reembolsó');
  }
  const b = await one(env, "SELECT * FROM puntos_movimientos WHERE venta = ? AND tipo = 'arranque' AND puntos > 0", orderId);
  if (b) await run(env, "INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, nota, clave, venta) VALUES (?, 'arranque', ?, 'Se reembolsó la venta del bono de arranque', ?, ?)",
    b.email, -b.puntos, `arranque-rev:${b.email}`, orderId);
  // Los rangos se calculan con las ventas vigentes: un reembolso puede bajar el del mes (el aviso de subida no se repite)
}

// Parcial (charge.refunded sin reembolso completo): se revierte la parte proporcional de la red; el acceso y los puntos del
// vendedor siguen como siempre (se deciden a mano en el panel). rev = { pago_id, parcial, monto, reembolsado } de Stripe.
export async function redAlReembolsoParcial(env, rev) {
  if (!rev?.parcial || !(rev.monto > 0) || !(rev.reembolsado > 0)) return 0;
  const o = await one(env, 'SELECT id FROM orders WHERE provider_payment_id = ?', rev.pago_id);
  if (!o) return 0;
  const frac = Math.min(1, rev.reembolsado / rev.monto);
  let n = 0;
  for (const m of await all(env, "SELECT * FROM puntos_movimientos WHERE venta = ? AND tipo = 'red' AND puntos > 0", o.id)) {
    const meta = Math.round(m.puntos * frac), ya = await revertidoDe(env, m);
    if (meta - ya > 0) { await insertarReversa(env, m, meta - ya, `red-rev:${o.id}:${m.nivel_red}:${rev.reembolsado}`, 'Reembolso parcial de una venta de tu equipo'); n++; }
  }
  return n;
}
const revertidoDe = async (env, m) => -(await one(env, "SELECT COALESCE(SUM(puntos), 0) s FROM puntos_movimientos WHERE tipo = 'red' AND puntos < 0 AND venta = ? AND email = ? AND nivel_red = ?", m.venta, m.email, m.nivel_red)).s;
const insertarReversa = (env, m, puntos, clave, nota) => run(env, `INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, nota, base_centavos, pct, semestre, clave, nivel_red, vendedor, venta)
  VALUES (?, 'red', ?, ?, ?, ?, ?, ?, ?, ?, ?)`, m.email, -puntos, nota, m.base_centavos, m.pct, m.semestre, clave, m.nivel_red, m.vendedor, m.venta);

// ---------- rangos ----------
const ventasMesSql = (col) => SQL_VENTAS_MES.replace('{E}', col);
// Rango de una cuenta en un mes: { id, nombre, activos, lideres }
export async function rangoMes(env, email, mes = mesMx().id) {
  const { desde, hasta } = mesMx(mes);
  const directos = await all(env, `SELECT c.email, (${ventasMesSql('c.email')}) ventas,
      (SELECT COUNT(*) FROM puntos_cuentas h WHERE h.patrocinador = c.email AND (${ventasMesSql('h.email')}) > 0) activos
    FROM puntos_cuentas c WHERE c.patrocinador = ?`, desde, hasta, desde, hasta, norm(email));
  const activos = directos.filter(d => d.ventas > 0).length, lideres = directos.filter(d => d.activos >= LIDER_ACTIVOS).length;
  const id = activos >= LIDER_ACTIVOS ? (lideres >= ELITE_LIDERES ? 'elite' : 'lider') : 'vendedor';
  return { ...rangoDe(id), activos, lideres, directos: directos.length };
}
const ORDEN_RANGO = Object.fromEntries(RANGOS.map((r, i) => [r.id, i]));
// Guarda el rango más alto del mes y avisa (push y en la app) una sola vez al subir
export async function actualizarRango(env, email, mes = mesMx().id) {
  const r = await rangoMes(env, email, mes);
  const antes = (await one(env, 'SELECT rango FROM puntos_rangos WHERE email = ? AND mes = ?', email, mes))?.rango || 'vendedor';
  if (ORDEN_RANGO[r.id] <= ORDEN_RANGO[antes]) return r;
  await run(env, `INSERT INTO puntos_rangos (email, mes, rango, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (email, mes) DO UPDATE SET rango = excluded.rango, updated_at = excluded.updated_at`, email, mes, r.id, new Date().toISOString());
  await avisar(env, email, { clave: `rango:${mes}:${r.id}`, tipo: 'rango', titulo: `¡Subiste a ${r.nombre}!`,
    cuerpo: r.id === 'elite' ? `${r.lideres} personas de tu equipo directo ya son Líderes este mes.` : `${r.activos} personas de tu equipo directo vendieron este mes.`, url: '/tienda/cuenta/#equipo' });
  return r;
}
// Lo que le falta para el siguiente rango (texto corto)
export function faltaPara(r) {
  if (r.id === 'vendedor') { const f = LIDER_ACTIVOS - r.activos; return `Te ${f === 1 ? 'falta 1 persona' : `faltan ${f} personas`} de tu equipo directo con al menos 1 venta este mes para ser Líder.`; }
  if (r.id === 'lider') { const f = ELITE_LIDERES - r.lideres; return `Te ${f === 1 ? 'falta 1 Líder' : `faltan ${f} Líderes`} en tu equipo directo para ser Líder Élite.`; }
  return 'Llegaste al rango más alto este mes.';
}

// ---------- ganancias ----------
// Neto (con reversiones) por tipo en un periodo: propias (ganado + revertido), arranque, red nivel 1 y 2
const SQL_GANANCIAS = `SELECT COALESCE(SUM(CASE WHEN tipo IN ('ganado', 'revertido') THEN puntos END), 0) propias,
  COALESCE(SUM(CASE WHEN tipo = 'arranque' THEN puntos END), 0) arranque,
  COALESCE(SUM(CASE WHEN tipo = 'red' AND nivel_red = 1 THEN puntos END), 0) red1,
  COALESCE(SUM(CASE WHEN tipo = 'red' AND nivel_red = 2 THEN puntos END), 0) red2
  FROM puntos_movimientos WHERE email = ? AND created_at >= ? AND created_at < ?`;
export async function gananciasDe(env, email, fecha = new Date()) {
  const mes = mesMx(fecha), sem = semestreMx(fecha);
  const g = async (d, h) => { const x = await one(env, SQL_GANANCIAS, norm(email), d, h); return { ...x, mis_ventas: x.propias + x.arranque, mi_equipo: x.red1 + x.red2, total: x.propias + x.arranque + x.red1 + x.red2 }; };
  return { mes: { id: mes.id, ...(await g(mes.desde, mes.hasta)) }, semestre: { id: sem.id, ...(await g(sem.desde, sem.hasta)) } };
}

// ---------- datos para la app (sin datos de clientes; de las personas del equipo solo nombre y su actividad) ----------
export async function datosEmbajador(env, email, { code, fecha = new Date() } = {}) {
  const e = norm(email), mes = mesMx(fecha), sem = semestreMx(fecha);
  const rango = await rangoMes(env, e, mes.id);
  const directos = await all(env, `SELECT c.email, ${NOMBRE('c')} nombre, c.created_at,
      (${ventasMesSql('c.email')}) ventas_mes,
      (SELECT COUNT(*) FROM puntos_movimientos m WHERE m.email = c.email AND ${VALIDA} AND m.created_at >= ? AND m.created_at < ?) ventas_semestre,
      (SELECT MAX(m.created_at) FROM puntos_movimientos m WHERE m.email = c.email AND ${VALIDA}) ultima,
      (SELECT p.whatsapp FROM affiliates a JOIN equipo_perfiles p ON p.code = a.code WHERE a.email = c.email AND a.tipo = 'puntos') whatsapp
    FROM puntos_cuentas c WHERE c.patrocinador = ? ORDER BY ventas_mes DESC, c.created_at`, mes.desde, mes.hasta, sem.desde, sem.hasta, e);
  const ahora = new Date(fecha).getTime();
  const equipo = [];
  const nivel2 = [];
  for (const d of directos) {
    const desde = d.ultima || d.created_at, dias = Math.floor((ahora - Date.parse(desde)) / DIA);
    const sub = await all(env, `SELECT ${NOMBRE('c')} nombre, (${ventasMesSql('c.email')}) ventas_mes FROM puntos_cuentas c WHERE c.patrocinador = ? ORDER BY c.created_at`, mes.desde, mes.hasta, d.email);
    const rd = await rangoMes(env, d.email, mes.id);
    equipo.push({ nombre: d.nombre || 'Sin nombre', nivel: nivelDe(d.ventas_semestre).actual.nombre, rango: rd.nombre, rango_id: rd.id, ventas_mes: d.ventas_mes,
      dias_sin_vender: dias >= DIAS_SIN_VENDER ? dias : null, nunca: !d.ultima, whatsapp: d.whatsapp || null, equipo: sub.length });
    if (sub.length) nivel2.push({ de: nombrePublico(d.nombre), personas: sub.length, activos: sub.filter(s => s.ventas_mes > 0).length,
      ventas_mes: sub.reduce((t, s) => t + s.ventas_mes, 0), nombres: sub.map(s => nombrePublico(s.nombre)) });
  }
  const patro = await patrocinadorDe(env, e);
  return {
    rango, falta: faltaPara(rango), mes: mes.id,
    patrocinador: patro ? nombrePublico(await nombreDe(env, patro)) : null,
    equipo, nivel2, ganancias: await gananciasDe(env, e, fecha),
    invita: code ? { code, liga: `${env.SITE_URL || 'https://vorka.mx'}/tienda/puntos/unete/${encodeURIComponent(code)}` } : null,
    lideres: await lideresDelMes(env, mes.id, e),
  };
}

// Líderes del mes (solo quienes activaron aparecer en el Top, como el Top del mes): nombre público, rango y activos
export async function lideresDelMes(env, mes = mesMx().id, yo = null, { todos = false, limite = 10 } = {}) {
  const { desde, hasta } = mesMx(mes);
  const filas = await all(env, `SELECT p.email, ${NOMBRE('p')} nombre, p.ranking, COUNT(*) activos FROM puntos_cuentas c JOIN puntos_cuentas p ON p.email = c.patrocinador
    WHERE (${ventasMesSql('c.email')}) > 0 GROUP BY p.email HAVING COUNT(*) >= ?`, desde, hasta, LIDER_ACTIVOS);
  const out = [];
  for (const f of filas) {
    if (!todos && !f.ranking) continue;
    const r = await rangoMes(env, f.email, mes);
    out.push({ email: f.email, nombre: nombrePublico(f.nombre), rango: r.nombre, rango_id: r.id, activos: r.activos, lideres: r.lideres, yo: f.email === yo });
  }
  out.sort((a, b) => ORDEN_RANGO[b.rango_id] - ORDEN_RANGO[a.rango_id] || b.activos - a.activos);
  return out.slice(0, limite).map((x, i) => ({ ...x, lugar: i + 1, ...(todos ? {} : { email: undefined }) }));
}

// ---------- Ganancias reales (página del programa): solo con datos reales y con al menos MIN_CUENTAS_GANANCIAS cuentas ----------
// Puntos netos por cuenta y mes (ventas propias + red + bono) de las cuentas con ganancias en los últimos 6 meses completos
export async function gananciasReales(env, fecha = new Date()) {
  const hasta = mesMx(fecha).desde;
  const d = new Date(hasta); d.setUTCMonth(d.getUTCMonth() - 6);
  const filas = await all(env, `SELECT email, SUBSTR(DATETIME(created_at, '-6 hours'), 1, 7) mes, SUM(puntos) puntos FROM puntos_movimientos
    WHERE tipo IN ('ganado', 'revertido', 'red', 'arranque') AND created_at >= ? AND created_at < ? GROUP BY email, mes HAVING SUM(puntos) > 0`, d.toISOString(), hasta);
  const cuentas = new Set(filas.map(f => f.email)).size;
  if (cuentas < MIN_CUENTAS_GANANCIAS) return { visible: false, cuentas, minimo: MIN_CUENTAS_GANANCIAS };
  const v = filas.map(f => f.puntos).sort((a, b) => a - b), mitad = Math.floor(v.length / 2);
  const mediana = v.length % 2 ? v[mitad] : Math.round((v[mitad - 1] + v[mitad]) / 2);
  return { visible: true, cuentas, meses: 6, promedio: Math.round(v.reduce((t, x) => t + x, 0) / v.length), mediana };
}

// ---------- RPC para Vorka OS ----------
export async function resumenEmbajadores(env, { mes } = {}) {
  const m = mesMx(mes && /^\d{4}-\d{2}$/.test(mes) ? mes : new Date());
  const n = async (sql, ...a) => (await one(env, sql, ...a))?.n ?? 0;
  const P = [m.desde, m.hasta];
  const registrados = await n('SELECT COUNT(*) n FROM puntos_cuentas');
  const activos = await n(`SELECT COUNT(DISTINCT m.email) n FROM puntos_movimientos m WHERE ${VALIDA} AND m.created_at >= ? AND m.created_at < ?`, ...P);
  const nuevos = await n('SELECT COUNT(*) n FROM puntos_cuentas WHERE created_at >= ? AND created_at < ?', ...P);
  const nuevos_invitados = await n('SELECT COUNT(*) n FROM puntos_cuentas WHERE created_at >= ? AND created_at < ? AND patrocinador IS NOT NULL', ...P);
  const con_patrocinador = await n('SELECT COUNT(*) n FROM puntos_cuentas WHERE patrocinador IS NOT NULL');
  // Rangos: solo quien tiene equipo puede ser Líder
  const lideres = await lideresDelMes(env, m.id, null, { todos: true, limite: 100000 });
  const por_rango = { lider: lideres.filter(x => x.rango_id === 'lider').length, elite: lideres.filter(x => x.rango_id === 'elite').length };
  por_rango.vendedor = registrados - por_rango.lider - por_rango.elite;
  const ventas = await one(env, `SELECT COUNT(*) n, COALESCE(SUM(m.base_centavos), 0) cobrado FROM puntos_movimientos m WHERE ${VALIDA} AND m.created_at >= ? AND m.created_at < ?`, ...P);
  const excluidas = await n("SELECT COUNT(*) n FROM puntos_movimientos WHERE tipo = 'ganado' AND excluida = 1 AND created_at >= ? AND created_at < ?", ...P);
  const p = await one(env, `SELECT COALESCE(SUM(CASE WHEN tipo IN ('ganado', 'revertido') THEN puntos END), 0) propias,
      COALESCE(SUM(CASE WHEN tipo = 'red' AND nivel_red = 1 THEN puntos END), 0) red1, COALESCE(SUM(CASE WHEN tipo = 'red' AND nivel_red = 2 THEN puntos END), 0) red2,
      COALESCE(SUM(CASE WHEN tipo = 'arranque' THEN puntos END), 0) arranque FROM puntos_movimientos WHERE created_at >= ? AND created_at < ?`, ...P);
  const total = p.propias + p.red1 + p.red2 + p.arranque;
  const pct_propias = total > 0 ? Math.round(p.propias / total * 1000) / 10 : null;
  const top_vendedores = (await all(env, `SELECT m.email, COALESCE(c.nombre, m.email) nombre, COUNT(*) ventas, SUM(m.puntos) puntos, SUM(m.base_centavos) cobrado
    FROM puntos_movimientos m LEFT JOIN puntos_cuentas c ON c.email = m.email WHERE ${VALIDA} AND m.created_at >= ? AND m.created_at < ?
    GROUP BY m.email ORDER BY ventas DESC, puntos DESC LIMIT 10`, ...P));
  const top_lideres = [];
  for (const l of lideres.slice(0, 10)) {
    const red = await one(env, "SELECT COALESCE(SUM(puntos), 0) n FROM puntos_movimientos WHERE email = ? AND tipo = 'red' AND created_at >= ? AND created_at < ?", l.email, ...P);
    top_lideres.push({ email: l.email, nombre: await nombreDe(env, l.email), rango: l.rango, activos: l.activos, lideres: l.lideres, puntos_red: red.n });
  }
  return {
    mes: m.id, embajadores: { registrados, activos, nuevos, nuevos_invitados, con_patrocinador }, por_rango,
    ventas: { validas: ventas.n, cobrado_centavos: ventas.cobrado, excluidas_red: excluidas },
    puntos: { propias: p.propias, red_nivel1: p.red1, red_nivel2: p.red2, arranque: p.arranque, total },
    pct_propias, meta_pct_propias: 80, cumple_meta: pct_propias == null ? null : pct_propias >= 80,
    top_vendedores, top_lideres, reglas: { pct_red: PCT_RED, tope_venta: PCT_TOPE_VENTA, bono_arranque: BONO_ARRANQUE, dias_arranque: DIAS_ARRANQUE, lider_activos: LIDER_ACTIVOS, elite_lideres: ELITE_LIDERES },
  };
}

export async function embajador(env, email, { mes } = {}) {
  const e = norm(email), m = mesMx(mes && /^\d{4}-\d{2}$/.test(mes) ? mes : new Date());
  const c = await one(env, 'SELECT email, nombre, created_at, equipo, patrocinador, patrocinado_at FROM puntos_cuentas WHERE email = ?', e);
  if (!c) return null;
  const [n1, n2] = await lineaArriba(env, e);
  const directos = await all(env, `SELECT c.email, ${NOMBRE('c')} nombre, c.created_at, (${ventasMesSql('c.email')}) ventas_mes,
      (SELECT COUNT(*) FROM puntos_cuentas h WHERE h.patrocinador = c.email) equipo
    FROM puntos_cuentas c WHERE c.patrocinador = ? ORDER BY c.created_at`, m.desde, m.hasta, e);
  const nivel2 = await one(env, 'SELECT COUNT(*) n FROM puntos_cuentas h JOIN puntos_cuentas c ON c.email = h.patrocinador WHERE c.patrocinador = ?', e);
  const rango = await rangoMes(env, e, m.id);
  return {
    email: c.email, nombre: c.nombre, registro: c.created_at, equipo_vorka: c.equipo === 1,
    patrocinador: n1 ? { email: n1, nombre: await nombreDe(env, n1), desde: c.patrocinado_at } : null,
    patrocinador_nivel2: n2 ? { email: n2, nombre: await nombreDe(env, n2) } : null,
    rango: { id: rango.id, nombre: rango.nombre, activos: rango.activos, lideres: rango.lideres },
    equipo_directo: directos.map(d => ({ email: d.email, nombre: d.nombre, registro: d.created_at, ventas_mes: d.ventas_mes, activo: d.ventas_mes > 0, equipo: d.equipo })),
    conteos: { directos: directos.length, nivel2: nivel2.n, activos_mes: directos.filter(d => d.ventas_mes > 0).length },
    ganancias: await gananciasDe(env, e, m.desde),
    bitacora: await all(env, 'SELECT antes, despues, motivo, por, created_at FROM puntos_patrocinio_bitacora WHERE email = ? ORDER BY id DESC LIMIT 50', e),
  };
}
