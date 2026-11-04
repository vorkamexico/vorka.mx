// Código público de Puntos Vorka (embajadores de venta, desde Vorka OS por RPC): cambiar el código que se comparte
// y ver «Mis ventas». affiliates.code nunca cambia; el nuevo es un alias (affiliate_alias) y los anteriores siguen sirviendo.
import { one, all } from './util.js';
import { mesMx } from './puntos-reglas.js';

export const DIAS_CAMBIO = 30;
// SQL: el code real de lo escrito (alias o code). ?1 = el código en mayúsculas
export const SQL_CODIGO_REAL = 'COALESCE((SELECT code FROM affiliate_alias WHERE alias = ?1), ?1)';
const RESERVADOS = ['VORKA', 'ADMIN', 'SOPORTE', 'TIENDA', 'GRATIS', 'OFICIAL', 'PRUEBA', 'STRIPE', 'OXXO', 'SPEI'];
// Groserías y palabras que no deben ir en un código que se comparte con clientes (se busca dentro del código)
const PROHIBIDAS = ['PUTA', 'PUTO', 'PENDEJ', 'VERGA', 'CHINGA', 'CULO', 'MAMADA', 'PINCHE', 'CABRON', 'MIERDA', 'JOTO', 'MARICON', 'PITO', 'NALGA', 'COGER', 'PORNO', 'SEXO', 'NAZI', 'HITLER', 'ZORRA', 'PERRA', 'PANOCH', 'CULER', 'FUCK', 'SHIT'];

export function problemaCodigo(c) {
  if (!/^[A-Z0-9]{4,12}$/.test(c)) return 'Usa de 4 a 12 letras o números, sin espacios ni acentos.';
  if (!/[A-Z]/.test(c)) return 'Ponle al menos una letra.';
  if (RESERVADOS.some(r => c.startsWith(r))) return 'Ese código está reservado. Elige otro.';
  if (PROHIBIDAS.some(p => c.includes(p))) return 'Elige un código que puedas compartir con cualquier cliente.';
  return null;
}

const cuentaDe = (env, email) => one(env, "SELECT code, publico, publico_cambiado_at FROM affiliates WHERE email = ? AND tipo = 'puntos'", email);
export const publicoDe = a => a ? (a.publico || a.code) : null;

// { ok, code (el público), antes } o lanza Error con el mensaje para la persona
export async function cambiarCodigo(env, email, nuevo, ahora = new Date()) {
  const e = String(email || '').trim().toLowerCase();
  const c = String(nuevo || '').trim().toUpperCase();
  const a = await cuentaDe(env, e);
  if (!a) throw new Error('Esa cuenta de puntos no existe.');
  const p = problemaCodigo(c);
  if (p) throw new Error(p);
  const antes = publicoDe(a);
  if (c === antes) return { ok: true, code: antes, antes, sin_cambio: true };
  if (a.publico_cambiado_at) {
    const prox = new Date(Date.parse(a.publico_cambiado_at) + DIAS_CAMBIO * 864e5);
    if (prox > ahora) throw new Error(`Puedes cambiar tu código una vez cada ${DIAS_CAMBIO} días. El próximo cambio: ${prox.toISOString().slice(0, 10)}.`);
  }
  // Volver a uno suyo (su code original o un alias anterior) siempre se puede; uno de otra persona o de descuento, no
  const suyo = c === a.code || !!(await one(env, 'SELECT 1 FROM affiliate_alias WHERE alias = ? AND code = ?', c, a.code));
  if (!suyo) {
    const ocupado = await one(env, `SELECT 1 FROM affiliates WHERE code = ?1 OR publico = ?1 UNION ALL SELECT 1 FROM affiliate_alias WHERE alias = ?1
      UNION ALL SELECT 1 FROM codigos_descuento WHERE codigo = ?1 LIMIT 1`, c);
    if (ocupado) throw new Error('Ese código ya lo tiene alguien más. Prueba con otro.');
  }
  const at = ahora.toISOString();
  await env.DB.batch([
    ...(c !== a.code ? [env.DB.prepare('INSERT OR IGNORE INTO affiliate_alias (alias, code) VALUES (?, ?)').bind(c, a.code)] : []),
    // el anterior ya era su code o un alias suyo: sus ligas y QR viejos siguen funcionando
    env.DB.prepare('UPDATE affiliates SET publico = ?, publico_cambiado_at = ? WHERE code = ?').bind(c === a.code ? null : c, at, a.code),
  ]);
  return { ok: true, code: c, antes };
}

// Mis ventas: las compras que le dieron puntos (sin datos de quien compró), las más recientes primero
export async function ventasVendedor(env, email, limite = 50) {
  const e = String(email || '').trim().toLowerCase();
  const filas = await all(env, `SELECT m.order_id, m.puntos, m.created_at, o.monto_centavos,
      (SELECT GROUP_CONCAT(p.nombre, ' · ') FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = m.order_id) productos,
      EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido') revertida
    FROM puntos_movimientos m JOIN orders o ON o.id = m.order_id
    WHERE m.email = ? AND m.tipo = 'ganado' ORDER BY m.id DESC LIMIT ?`, e, Math.min(Math.max(Number(limite) || 50, 1), 200));
  const vigentes = filas.filter(f => !f.revertida);
  return {
    ventas: filas.map(f => ({ fecha: f.created_at, productos: f.productos || 'Compra en vorka.mx', monto_centavos: f.monto_centavos, puntos: f.puntos, revertida: !!f.revertida })),
    total: { ventas: vigentes.length, monto_centavos: vigentes.reduce((s, f) => s + (f.monto_centavos || 0), 0), puntos: vigentes.reduce((s, f) => s + (f.puntos || 0), 0) },
  };
}

// Ventas con código del equipo (Vorka OS): avisos al momento (despues_de: el último id que ya vio) y tablero del mes (desde: fecha).
// Solo de los correos que manda OS (sus personas activas) y sin datos de quien compró. Sin despues_de ni desde devuelve solo
// el último id (para empezar a avisar desde ahí, sin repasar ventas viejas).
export async function ventasEquipo(env, { emails = [], despues_de = null, desde = null, limite = 200 } = {}) {
  const lista = [...new Set((emails || []).map(e => String(e || '').trim().toLowerCase()).filter(e => e.includes('@')))].slice(0, 300);
  const ultimo = (await one(env, "SELECT COALESCE(MAX(id), 0) id FROM puntos_movimientos WHERE tipo = 'ganado'")).id;
  if (!lista.length || (despues_de == null && !desde)) return { ultimo, ventas: [] };
  const filas = await all(env, `SELECT m.id, m.email, m.order_id, m.puntos, m.created_at, o.monto_centavos,
      (SELECT GROUP_CONCAT(p.nombre, ' · ') FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = m.order_id) productos,
      EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido') revertida
    FROM puntos_movimientos m JOIN orders o ON o.id = m.order_id
    WHERE m.tipo = 'ganado' AND m.email IN (${lista.map(() => '?').join(',')}) AND ${despues_de != null ? 'm.id > ?' : 'm.created_at >= ?'}
    ORDER BY m.id LIMIT ?`, ...lista, despues_de != null ? Number(despues_de) || 0 : String(desde), Math.min(Math.max(Number(limite) || 200, 1), 1000));
  return { ultimo, ventas: filas.map(f => ({ id: f.id, email: f.email, venta: f.order_id, puntos: f.puntos, monto_centavos: f.monto_centavos, productos: f.productos || 'Compra en vorka.mx', fecha: f.created_at, revertida: !!f.revertida })) };
}

// ---------- Ventas por vendedor (Vorka OS › «Ventas del equipo») ----------
// Todas las ventas con código (movimientos 'ganado': compras y renovaciones que le dieron puntos a alguien) en un periodo,
// cada una con quién vendió (correo, nombre de su cuenta de Puntos si tiene uno de verdad, código público), fecha, productos,
// monto cobrado, puntos, si se reembolsó y si pagó red de Embajadores; más un resumen por vendedor calculado sobre TODO el
// periodo (aunque la lista se recorte). Nunca datos de quien compró: no se lee orders.email ni orders.nombre.
// f = { desde, hasta } (ISO; el mes en hora del centro de México lo calcula quien llama) o { mes: 'AAAA-MM' }; sin fechas = todo.
const SEP = '\u001e';   // separador de productos (los nombres llevan « · »)
const MAX_VENTAS = 5000;
const isoOk = s => typeof s === 'string' && s.length <= 40 && !Number.isNaN(Date.parse(s));
// Nombre de la cuenta de Puntos solo si es un nombre: la tienda llena affiliates.nombre con el inicio del correo cuando no hay
// nombre («wendydelgado150409»), y eso no se muestra como nombre de nadie.
export function nombreDeCuenta(email, ...nombres) {
  const local = String(email || '').split('@')[0].trim().toLowerCase();
  for (const n of nombres) {
    const t = String(n || '').trim();
    if (t && !t.includes('@') && t.toLowerCase() !== local) return t.slice(0, 80);
  }
  return null;
}

export async function ventasPorVendedor(env, f = {}) {
  let desde = isoOk(f.desde) ? new Date(f.desde).toISOString() : null, hasta = isoOk(f.hasta) ? new Date(f.hasta).toISOString() : null;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(f.mes || '')) { const m = mesMx(f.mes); desde = m.desde; hasta = m.hasta; }
  const limite = Math.min(Math.max(Number(f.limite) || 2000, 1), MAX_VENTAS);
  const rango = `${desde ? ' AND m.created_at >= ?' : ''}${hasta ? ' AND m.created_at < ?' : ''}`, pr = [desde, hasta].filter(Boolean);
  const REV = "(m.order_id IS NOT NULL AND EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND r.tipo = 'revertido'))";
  const filas = await all(env, `SELECT m.id, m.email, m.order_id, m.puntos, m.created_at, m.nota, m.excluida, m.suscripcion_id,
      COALESCE(o.monto_centavos, m.base_centavos, 0) monto,
      (SELECT GROUP_CONCAT(COALESCE(p.nombre, i.nombre), '${SEP}') FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = m.order_id) productos,
      ${REV} reembolsada,
      (SELECT COALESCE(SUM(x.puntos), 0) FROM puntos_movimientos x WHERE x.tipo = 'red' AND x.puntos > 0 AND x.venta = COALESCE(m.order_id, m.clave)) red_puntos
    FROM puntos_movimientos m LEFT JOIN orders o ON o.id = m.order_id
    WHERE m.tipo = 'ganado'${rango} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`, ...pr, limite + 1);
  const truncado = filas.length > limite;
  if (truncado) filas.pop();
  // Resumen por vendedor sobre todo el periodo (sin el límite de la lista)
  const grupos = await all(env, `WITH v AS (SELECT m.email, m.puntos, m.created_at, COALESCE(o.monto_centavos, m.base_centavos, 0) monto, ${REV} rev,
      (SELECT COALESCE(SUM(x.puntos), 0) FROM puntos_movimientos x WHERE x.tipo = 'red' AND x.puntos > 0 AND x.venta = COALESCE(m.order_id, m.clave)) red
      FROM puntos_movimientos m LEFT JOIN orders o ON o.id = m.order_id WHERE m.tipo = 'ganado'${rango})
    SELECT email, SUM(1 - rev) ventas, SUM(rev) reembolsadas, SUM(CASE WHEN rev = 0 THEN monto ELSE 0 END) monto,
      SUM(CASE WHEN rev = 0 THEN puntos ELSE 0 END) puntos, SUM(CASE WHEN rev = 0 THEN red ELSE 0 END) red, MAX(created_at) ultima
    FROM v GROUP BY email`, ...pr);
  // Las cuentas de quienes vendieron (de a 90 correos: D1 acepta hasta 100 parámetros)
  const emails = [...new Set(grupos.map(g => g.email))], cuentas = new Map();
  for (let i = 0; i < emails.length; i += 90) {
    const l = emails.slice(i, i + 90);
    for (const c of await all(env, `SELECT x.email, c.nombre cn, c.patrocinador, c.equipo,
        (SELECT a.nombre FROM affiliates a WHERE a.email = x.email AND a.tipo = 'puntos') an,
        (SELECT COALESCE(a.publico, a.code) FROM affiliates a WHERE a.email = x.email AND a.tipo = 'puntos') code,
        (SELECT COUNT(*) FROM puntos_cuentas h WHERE h.patrocinador = x.email) directos
      FROM (${l.map(() => 'SELECT ? email').join(' UNION ALL ')}) x LEFT JOIN puntos_cuentas c ON c.email = x.email`, ...l)) cuentas.set(c.email, c);
  }
  const vendedor = e => { const c = cuentas.get(e) || {}; return { nombre: nombreDeCuenta(e, c.cn, c.an), code: c.code || null }; };
  const n = x => Number(x) || 0;
  const vendedores = grupos.map(g => {
    const c = cuentas.get(g.email) || {};
    return { email: g.email, ...vendedor(g.email), ventas: n(g.ventas), reembolsadas: n(g.reembolsadas), monto_centavos: n(g.monto), puntos: n(g.puntos),
      red_puntos: n(g.red), ultima: g.ultima, equipo_vorka: c.equipo === 1, patrocinado: !!c.patrocinador, equipo_directo: n(c.directos), en_red: !!c.patrocinador || n(c.directos) > 0 };
  }).sort((a, b) => b.ventas - a.ventas || b.monto_centavos - a.monto_centavos || String(a.email).localeCompare(b.email));
  const ventas = filas.map(x => ({
    id: x.id, email: x.email, ...vendedor(x.email), fecha: x.created_at,
    productos: x.productos ? String(x.productos).split(SEP).filter(Boolean) : [x.nota ? String(x.nota) : 'Compra en vorka.mx'],
    renovacion: !x.order_id, monto_centavos: n(x.monto), puntos: n(x.puntos), reembolsada: !!x.reembolsada,
    red_puntos: n(x.red_puntos), por_red: n(x.red_puntos) > 0, excluida_red: x.excluida === 1,
  }));
  const vig = vendedores.reduce((t, v) => ({ ventas: t.ventas + v.ventas, reembolsadas: t.reembolsadas + v.reembolsadas, monto_centavos: t.monto_centavos + v.monto_centavos, puntos: t.puntos + v.puntos, red_puntos: t.red_puntos + v.red_puntos }),
    { ventas: 0, reembolsadas: 0, monto_centavos: 0, puntos: 0, red_puntos: 0 });
  return { desde, hasta, truncado, resumen: { ...vig, vendedores: vendedores.filter(v => v.ventas > 0).length }, vendedores, ventas };
}
