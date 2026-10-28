// Código público de Puntos Vorka (embajadores de venta, desde Vorka OS por RPC): cambiar el código que se comparte
// y ver «Mis ventas». affiliates.code nunca cambia; el nuevo es un alias (affiliate_alias) y los anteriores siguen sirviendo.
import { one, all } from './util.js';

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
