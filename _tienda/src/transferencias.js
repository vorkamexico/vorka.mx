// Suscripciones por transferencia (sin Stripe): para gente cercana que paga mes a mes por transferencia o para clientes de
// Vorka que la llevan incluida en sus servicios. Viven en la tabla suscripciones con id 'tra_…' y metodo 'transferencia',
// así que todas las apps (Vuelve, Agenda, Cuentas, Vende, Clara, Portales) las ven igual que una de Stripe con suscripcionApp.
// Nunca se mandan a Stripe (ver los guardas en suscripciones.js). Las maneja Vorka OS › Tienda › Suscripciones:
//   crear (con el correo), prender/apagar, registrar un pago (extiende un periodo), editar. Con cobro, Vorka OS crea su cliente en
//   Cobranza: ahí salen los recordatorios y, al marcar pagado, llama a pagoSuscripcion.
// Estados: 'active' (al corriente) → al vencer sin pago 'past_due' (sigue el servicio gracia_dias) → 'unpaid' (pausada: la app
// deja de dar acceso). Apagada a mano: 'canceled'. Sin cobro no vence (periodo_fin lejano).
import { one, all, run, ahoraISO } from './util.js';
import { finCortesia, VIGENTES, cortesiasVigentes } from './suscripciones.js';

export const SIN_VENCER = '2099-12-31T23:59:59.000Z';
const APPS_FUERA = ['toolkit'];   // el Toolkit cambia de plan con Stripe (ver toolkit.js): no se da por transferencia
const correoOk = e => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
const nuevoId = () => `tra_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
const leer = t => { try { return JSON.parse(t || '{}'); } catch { return {}; } };

// Los planes que se pueden dar por transferencia: de suscripción, de Vorka (no de creadores) y que no son complementos
export async function planesSuscripcion(env) {
  const l = await all(env, `SELECT id, nombre, precio_centavos, activo, contenido FROM products
    WHERE json_extract(contenido, '$.suscripcion') IS NOT NULL AND COALESCE(json_extract(contenido, '$.complemento'), 0) = 0 AND creador_id IS NULL ORDER BY orden, nombre`);
  return l.map(p => { const c = leer(p.contenido); return { id: p.id, nombre: p.nombre, precio_centavos: p.precio_centavos, activo: !!p.activo, app: c.acceso?.app || null, intervalo: c.suscripcion?.intervalo === 'year' ? 'year' : 'month', url: c.acceso?.url || null }; })
    .filter(p => p.app && !APPS_FUERA.includes(p.app));
}

// Todas las suscripciones para el panel: Stripe, transferencia y cortesías vigentes (estas solo para verlas). Lo más útil
// primero: las que piden atención (vencidas, por vencer) y luego por app.
export async function panelSuscripciones(env) {
  const filas = await all(env, `SELECT s.*, p.nombre producto FROM suscripciones s LEFT JOIN products p ON p.id = s.product_id
    WHERE s.creador_id IS NULL ORDER BY s.updated_at DESC LIMIT 2000`);
  const ahora = Date.now(), dia = 864e5;
  const l = filas.map(s => {
    const transferencia = s.metodo === 'transferencia', vence = Date.parse(s.periodo_fin || '') || null;
    const dias = vence ? Math.ceil((vence - ahora) / dia) : null;
    return { id: s.id, email: s.email, nombre: s.nombre || null, app: s.app, producto: s.producto || s.product_id, product_id: s.product_id, metodo: transferencia ? 'transferencia' : 'stripe',
      estado: s.estado, vigente: VIGENTES.includes(s.estado), cobrar: transferencia ? !!s.cobrar : true, intervalo: s.intervalo, monto_centavos: s.monto_centavos,
      periodo_fin: s.periodo_fin === SIN_VENCER ? null : s.periodo_fin, dias: s.periodo_fin === SIN_VENCER ? null : dias, cancelar_al_final: !!s.cancelar_al_final,
      sucursales: s.sucursales || 0, gracia_dias: s.gracia_dias ?? 10, ultimo_pago: s.ultimo_pago || null, nota: s.nota || null, creado: s.created_at };
  });
  const cortesias = (await cortesiasVigentes(env)).map(c => ({ id: `cortesia_${c.order_id}`, email: c.email, nombre: c.nombre || null, app: c.app, producto: c.producto, metodo: 'cortesia',
    estado: 'active', vigente: true, cobrar: false, intervalo: c.intervalo, monto_centavos: 0, periodo_fin: c.periodo_fin, dias: Math.ceil((Date.parse(c.periodo_fin) - ahora) / dia) }));
  // resumen: ingreso mensual por método (anuales /12) y lo que pide atención
  const vig = l.filter(s => s.vigente), mensual = s => s.intervalo === 'year' ? Math.round(s.monto_centavos / 12) : s.monto_centavos;
  const resumen = {
    activas: vig.length + cortesias.length,
    mrr_stripe: vig.filter(s => s.metodo === 'stripe').reduce((a, s) => a + mensual(s), 0),
    mrr_transferencia: vig.filter(s => s.metodo === 'transferencia' && s.cobrar).reduce((a, s) => a + mensual(s), 0),
    por_cobrar: l.filter(s => s.metodo === 'transferencia' && s.cobrar && ['active', 'past_due'].includes(s.estado) && s.dias !== null && s.dias <= 7).length,
    vencidas: l.filter(s => s.metodo === 'transferencia' && ['past_due', 'unpaid'].includes(s.estado)).length,
    sin_cobro: vig.filter(s => s.metodo === 'transferencia' && !s.cobrar).length + cortesias.length,
  };
  return { resumen, suscripciones: [...l, ...cortesias], planes: await planesSuscripcion(env) };
}

// Alta. d: { email, nombre, product_id, monto_centavos (por periodo; si no, el precio del plan), cobrar, inicio (fecha del primer
// periodo; si no, hoy), pagado (true: ya pagó el primer periodo), sucursales, nota, gracia_dias }. Una sola vigente por correo y app.
export async function crearTransferencia(env, d = {}) {
  const email = String(d.email || '').trim().toLowerCase();
  if (!correoOk(email)) throw new Error('Escribe un correo válido: con ese correo entra a la app.');
  const plan = (await planesSuscripcion(env)).find(p => p.id === d.product_id);
  if (!plan) throw new Error('Elige un plan de suscripción.');
  const ya = await one(env, `SELECT id, metodo FROM suscripciones WHERE email = ? AND app = ? AND estado IN (${VIGENTES.map(() => '?').join(',')}) LIMIT 1`, email, plan.app, ...VIGENTES);
  if (ya) throw new Error(ya.metodo === 'transferencia' ? 'Ese correo ya tiene esta suscripción por transferencia: préndela o edítala.' : 'Ese correo ya paga esta app con tarjeta (Stripe). Cancélala ahí antes de pasarla a transferencia.');
  const cobrar = d.cobrar !== false && d.cobrar !== 0;
  const monto = cobrar ? Math.max(0, Math.round(Number(d.monto_centavos ?? plan.precio_centavos)) || 0) : 0;
  const inicio = Date.parse(d.inicio || '') ? new Date(d.inicio).toISOString() : ahoraISO();
  // pagado: el primer periodo ya está cubierto (vence en un periodo); si no, vence en la fecha de inicio (le toca pagar ya)
  const fin = !cobrar ? SIN_VENCER : d.pagado === false ? inicio : finCortesia(inicio, plan.intervalo, 1);
  const id = nuevoId(), ahora = ahoraISO();
  await run(env, `INSERT INTO suscripciones (id, email, app, product_id, estado, intervalo, periodo_fin, cancelar_al_final, sucursales, profesionales, monto_centavos,
      metodo, cobrar, nombre, nota, gracia_dias, ultimo_pago, created_at, updated_at)
    VALUES (?,?,?,?, 'active', ?, ?, 0, ?, 0, ?, 'transferencia', ?, ?, ?, ?, ?, ?, ?)`,
    id, email, plan.app, plan.id, plan.intervalo, fin, Math.max(0, Math.min(50, Math.trunc(Number(d.sucursales) || 0))), monto, cobrar ? 1 : 0,
    String(d.nombre || '').trim().slice(0, 120) || null, String(d.nota || '').trim().slice(0, 500) || null, Math.max(0, Math.min(60, Math.trunc(Number(d.gracia_dias ?? 10)))),
    cobrar && d.pagado !== false ? inicio : null, ahora, ahora);
  return fila(env, id);
}

const fila = async (env, id) => {
  const s = await one(env, "SELECT s.*, p.nombre producto FROM suscripciones s LEFT JOIN products p ON p.id = s.product_id WHERE s.id = ? AND s.metodo = 'transferencia'", id);
  if (!s) return null;
  return { ...s, cobrar: !!s.cobrar, vigente: VIGENTES.includes(s.estado), periodo_fin: s.periodo_fin === SIN_VENCER ? null : s.periodo_fin };
};
async function propia(env, id) {
  const s = await one(env, "SELECT * FROM suscripciones WHERE id = ? AND metodo = 'transferencia'", String(id || ''));
  if (!s) throw new Error('No encontramos esa suscripción por transferencia.');
  return s;
}

// El interruptor. prendida: true → vuelve a dar acceso ('active'; si ya venció y se cobra, queda 'past_due' con su gracia);
// false → la apaga ('canceled': la app deja de dar acceso en su siguiente revisión, en menos de un minuto)
export async function prenderTransferencia(env, id, prendida) {
  const s = await propia(env, id), ahora = ahoraISO();
  if (prendida) {
    const vencida = s.cobrar && Date.parse(s.periodo_fin) < Date.now();
    await run(env, 'UPDATE suscripciones SET estado = ?, cancelar_al_final = 0, cancelada_at = NULL, updated_at = ? WHERE id = ?', vencida ? 'past_due' : 'active', ahora, s.id);
  } else await run(env, "UPDATE suscripciones SET estado = 'canceled', cancelada_at = ?, updated_at = ? WHERE id = ?", ahora, ahora, s.id);
  return fila(env, s.id);
}

// Pago registrado (desde Cobranza o el panel): extiende un periodo (o n) desde donde terminaba, para que la fecha de pago no se
// corra; si estaba muy atrasada (más de un periodo), desde hoy. Si estaba pausada por falta de pago, la vuelve a prender.
// Una apagada a mano se queda apagada (el pago no la prende sola). clave: evita registrar el mismo pago dos veces.
export async function pagoTransferencia(env, id, { fecha = null, periodos = 1, clave = null } = {}) {
  const s = await propia(env, id);
  if (!s.cobrar) return fila(env, s.id);
  if (clave) {
    const k = `pago_transferencia:${s.id}:${String(clave).slice(0, 80)}`;
    const ya = await one(env, 'SELECT valor FROM ajustes WHERE clave = ?', k);
    if (ya) return fila(env, s.id);
    await run(env, 'INSERT OR IGNORE INTO ajustes (clave, valor) VALUES (?, ?)', k, ahoraISO());
  }
  const n = Math.max(1, Math.min(24, Math.trunc(Number(periodos) || 1)));
  const fin = Date.parse(s.periodo_fin) || Date.now(), atrasada = fin < Date.now() - (s.intervalo === 'year' ? 365 : 31) * 864e5;
  const nuevo = finCortesia(new Date(atrasada ? Date.now() : fin).toISOString(), s.intervalo, n);
  const estado = s.estado === 'canceled' ? 'canceled' : 'active';
  const pagado = Date.parse(fecha || '') ? new Date(fecha).toISOString() : ahoraISO();
  await run(env, 'UPDATE suscripciones SET periodo_fin = ?, estado = ?, ultimo_pago = ?, updated_at = ? WHERE id = ?', nuevo, estado, pagado, ahoraISO(), s.id);
  return fila(env, s.id);
}

// Editar: nombre, nota, monto, cobrar (pasar a sin cobro o al revés), fecha de vencimiento, sucursales y días de gracia
export async function editarTransferencia(env, id, d = {}) {
  const s = await propia(env, id);
  const cobrar = d.cobrar === undefined ? !!s.cobrar : !!d.cobrar;
  let fin = s.periodo_fin;
  if (!cobrar) fin = SIN_VENCER;
  else if (Date.parse(d.periodo_fin || '')) fin = new Date(d.periodo_fin).toISOString();
  else if (fin === SIN_VENCER) fin = finCortesia(ahoraISO(), s.intervalo, 1);   // pasa de sin cobro a con cobro: el primer cobro en un periodo
  await run(env, `UPDATE suscripciones SET nombre = ?, nota = ?, monto_centavos = ?, cobrar = ?, periodo_fin = ?, sucursales = ?, gracia_dias = ?, updated_at = ? WHERE id = ?`,
    d.nombre !== undefined ? String(d.nombre || '').trim().slice(0, 120) || null : s.nombre, d.nota !== undefined ? String(d.nota || '').trim().slice(0, 500) || null : s.nota,
    cobrar ? Math.max(0, Math.round(Number(d.monto_centavos ?? s.monto_centavos)) || 0) : 0, cobrar ? 1 : 0, fin,
    d.sucursales !== undefined ? Math.max(0, Math.min(50, Math.trunc(Number(d.sucursales) || 0))) : s.sucursales,
    d.gracia_dias !== undefined ? Math.max(0, Math.min(60, Math.trunc(Number(d.gracia_dias) || 0))) : s.gracia_dias, ahoraISO(), s.id);
  // si cambió la fecha o dejó de cobrarse, su estado se recalcula ya
  await revisarTransferencias(env, s.id);
  return fila(env, s.id);
}

// Cada hora (cron de la tienda): las que vencieron sin pago pasan a 'past_due' (siguen con servicio gracia_dias) y luego a
// 'unpaid' (pausadas). Las que se pagaron (periodo_fin en el futuro) regresan a 'active'. Las apagadas a mano no se tocan.
export async function revisarTransferencias(env, id = null) {
  const l = await all(env, `SELECT id, estado, periodo_fin, gracia_dias, cobrar, cancelar_al_final FROM suscripciones WHERE metodo = 'transferencia' AND estado != 'canceled'${id ? ' AND id = ?' : ''}`, ...(id ? [id] : []));
  const ahora = Date.now(), cambios = [];
  for (const s of l) {
    const fin = Date.parse(s.periodo_fin) || 0;
    // cancelada desde la app (cancelarApp): se apaga sola al terminar lo pagado
    const debe = s.cancelar_al_final && fin <= ahora ? 'canceled' : !s.cobrar || fin > ahora ? 'active' : fin + (s.gracia_dias ?? 10) * 864e5 > ahora ? 'past_due' : 'unpaid';
    if (debe !== s.estado) { await run(env, `UPDATE suscripciones SET estado = ?${debe === 'canceled' ? ', cancelada_at = ?' : ''}, updated_at = ? WHERE id = ?`, debe, ...(debe === 'canceled' ? [ahoraISO()] : []), ahoraISO(), s.id); cambios.push({ id: s.id, estado: debe }); }
  }
  return cambios;
}
