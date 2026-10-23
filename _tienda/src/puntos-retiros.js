// Puntos Vorka · transferencia a cuenta (privada). Solo para cuentas que el equipo habilita en Vorka OS
// (puntos_cuentas.puede_retirar); ningún texto público lo menciona. La persona pide transferir sus puntos (1 punto = $1)
// a su CLABE; el equipo hace el SPEI a mano y lo marca como pagado con la clave de rastreo. Sin Stripe Connect.
//   Mínimo 500 puntos. Los puntos de cada venta se pueden transferir 7 días después (por reembolsos y contracargos).
//   Pedir: movimiento 'retiro' negativo + renglón por_pagar (atómico: no se puede pedir más de lo transferible).
//   Cancelar: el renglón pasa a cancelado y un 'ajuste' regresa los puntos. Pagado: se le avisa por correo.
// Impuestos: aquí no se retiene ISR ni se emite CFDI (revisar con el contador antes del primer pago).
import { z } from 'zod';
import { one, all, run, ahoraISO, clabeValida } from './util.js';
import { enviar, marco, boton, P, esc, SOPORTE } from './correo.js';
import { SQL_MOVIMIENTOS, SQL_APARTADOS, nivelActual } from './puntos.js';
import { MINIMO_RETIRO, RETENCION_DIAS, diaMx, inicioDiaMx } from './puntos-reglas.js';

const ocultarClabe = c => c ? `•••• ${String(c).slice(-4)}` : '';
const pesos = n => '$' + Number(n || 0).toLocaleString('es-MX');
// Puntos 'ganado' de los últimos días de retención que no se han revertido (aún no se pueden transferir)
const SQL_RETENIDOS = `SELECT COALESCE(SUM(m.puntos), 0) FROM puntos_movimientos m WHERE m.email = ? AND m.tipo = 'ganado' AND m.created_at > ?
  AND NOT EXISTS (SELECT 1 FROM puntos_movimientos r WHERE r.order_id = m.order_id AND m.order_id IS NOT NULL AND r.tipo = 'revertido')`;
const limiteRetencion = (ahora = new Date()) => new Date(new Date(ahora).getTime() - RETENCION_DIAS * 864e5).toISOString();

export async function puedeRetirar(env, email) {
  return !!(await one(env, 'SELECT 1 FROM puntos_cuentas WHERE email = ? AND puede_retirar = 1', email));
}

// Lo que se puede transferir hoy: saldo disponible − puntos aún en retención (nunca negativo)
export async function transferibleDe(env, email, ahora = new Date()) {
  const r = await one(env, `SELECT (${SQL_MOVIMIENTOS}) total, (${SQL_APARTADOS}) apartados, (${SQL_RETENIDOS}) retenidos`, email, email, email, limiteRetencion(ahora));
  const disponibles = r.total - r.apartados;
  return { disponibles, retenidos: r.retenidos, transferibles: Math.max(0, Math.min(disponibles, disponibles - r.retenidos)) };
}

// Datos de la sección "Transferir a mi cuenta" de la app (null si la cuenta no está habilitada)
export async function datosRetiro(env, email) {
  const c = await one(env, 'SELECT puede_retirar, clabe, titular, banco FROM puntos_cuentas WHERE email = ?', email);
  if (!c?.puede_retirar) return null;
  const t = await transferibleDe(env, email);
  const retiros = await all(env, 'SELECT id, puntos, estado, clave_rastreo, pagado_el, created_at FROM puntos_retiros WHERE email = ? ORDER BY id DESC LIMIT 10', email);
  return { ...t, minimo: MINIMO_RETIRO, retencion_dias: RETENCION_DIAS, clabe: c.clabe || '', titular: c.titular || '', banco: c.banco || '', retiros };
}

const EsquemaPedir = z.object({
  puntos: z.coerce.number().int('Escribe puntos enteros.').min(MINIMO_RETIRO, `El mínimo para transferir es ${MINIMO_RETIRO} puntos.`).max(1000000),
  clabe: z.string().transform(c => String(c || '').replace(/\s+/g, '')).refine(clabeValida, 'La CLABE no es válida: son 18 dígitos. Revísala en tu banca.'),
  titular: z.string().trim().min(3, 'Escribe el nombre del titular de la cuenta.').max(120),
  banco: z.string().trim().max(60).optional().or(z.literal('')),
});

// POST /api/puntos/retiro (con sesión). Atómico: el renglón solo se crea si en ese instante alcanza lo transferible.
export async function pedirRetiro(env, email, datos, ahora = new Date()) {
  if (!(await puedeRetirar(env, email))) return { error: 'No encontrado.', status: 404 };
  const v = EsquemaPedir.safeParse(datos || {});
  if (!v.success) return { error: v.error.issues[0].message };
  const d = v.data;
  if (await one(env, "SELECT 1 FROM puntos_retiros WHERE email = ? AND estado = 'por_pagar'", email))
    return { error: 'Ya tienes una transferencia en proceso. Te avisamos por correo cuando la hagamos.' };
  const t = await transferibleDe(env, email, ahora);
  if (d.puntos > t.transferibles)
    return { error: t.retenidos > 0 && d.puntos <= t.disponibles
      ? `Hoy puedes transferir hasta ${t.transferibles} puntos: los de las ventas de los últimos ${RETENCION_DIAS} días se liberan después.`
      : `Hoy puedes transferir hasta ${t.transferibles} puntos.` };
  const [ins] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO puntos_retiros (email, puntos, clabe, titular, banco)
      SELECT ?, ?, ?, ?, ? WHERE ((${SQL_MOVIMIENTOS}) - (${SQL_APARTADOS}) - (${SQL_RETENIDOS})) >= ?
        AND NOT EXISTS (SELECT 1 FROM puntos_retiros WHERE email = ? AND estado = 'por_pagar')`)
      .bind(email, d.puntos, d.clabe, d.titular, d.banco || null, email, email, email, limiteRetencion(ahora), d.puntos, email),
    env.DB.prepare(`INSERT INTO puntos_movimientos (email, tipo, puntos, nota, clave)
      SELECT ?, 'retiro', -puntos, 'Transferencia a tu cuenta', 'retiro:' || id FROM puntos_retiros r WHERE r.email = ? AND r.estado = 'por_pagar'
        AND NOT EXISTS (SELECT 1 FROM puntos_movimientos m WHERE m.clave = 'retiro:' || r.id)`)
      .bind(email, email),
    env.DB.prepare('INSERT INTO puntos_cuentas (email, clabe, titular, banco) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET clabe = excluded.clabe, titular = excluded.titular, banco = excluded.banco')
      .bind(email, d.clabe, d.titular, d.banco || null),
  ]);
  if (!ins.meta.changes) return { error: 'Tu saldo cambió mientras lo pedías. Revisa cuánto puedes transferir e intenta de nuevo.' };
  const r = await one(env, "SELECT * FROM puntos_retiros WHERE email = ? AND estado = 'por_pagar' ORDER BY id DESC LIMIT 1", email);
  try {
    await enviar(env, { para: SOPORTE.correo, asunto: `Transferencia de puntos pedida: ${email} · ${pesos(r.puntos)}`, idempotencia: `puntos-retiro-${r.id}`,
      html: marco('Pidieron una transferencia de puntos', `<p style="${P}"><b>${esc(email)}</b> pidió transferir <b>${r.puntos} puntos (${pesos(r.puntos)})</b>.</p>
<p style="${P}">Titular: ${esc(r.titular)} · CLABE ${esc(ocultarClabe(r.clabe))}${r.banco ? ` · ${esc(r.banco)}` : ''}. Haz el SPEI y márcalo como pagado (con la clave de rastreo) en Vorka OS › Tienda › Puntos Vorka.</p>${boton('https://os.vorka.mx/#/tienda/puntos', 'Abrir Puntos Vorka')}`),
      texto: `${email} pidió transferir ${r.puntos} puntos (${pesos(r.puntos)}). Haz el SPEI y márcalo como pagado en Vorka OS › Tienda › Puntos Vorka.` });
  } catch (e) { console.error('puntos: aviso de retiro falló', r.id, e?.message); }
  return { ok: true, retiro: { id: r.id, puntos: r.puntos, estado: r.estado } };
}

// ---------- panel (RPC desde Vorka OS) ----------
export async function cuentasPuntos(env, { q = '' } = {}) {
  const filtro = String(q || '').trim().toLowerCase().slice(0, 80);
  const filas = await all(env, `SELECT a.email, a.code, a.nombre nombre_liga, c.nombre, COALESCE(c.puede_retirar, 0) puede_retirar, c.created_at,
      (SELECT COALESCE(SUM(puntos), 0) FROM puntos_movimientos m WHERE m.email = a.email) saldo,
      (SELECT COALESCE(SUM(puntos), 0) FROM puntos_movimientos m WHERE m.email = a.email AND m.tipo IN ('ganado', 'revertido')) ganados,
      (SELECT COUNT(*) FROM puntos_retiros r WHERE r.email = a.email AND r.estado = 'por_pagar') por_pagar
    FROM affiliates a LEFT JOIN puntos_cuentas c ON c.email = a.email
    WHERE a.tipo = 'puntos' AND (? = '' OR lower(a.email) LIKE ? OR lower(a.code) LIKE ? OR lower(COALESCE(c.nombre, a.nombre)) LIKE ?)
    ORDER BY ganados DESC, a.email LIMIT 300`, filtro, `%${filtro}%`, `%${filtro}%`, `%${filtro}%`);
  const out = [];
  for (const f of filas) { const n = await nivelActual(env, f.email); out.push({ ...f, nombre: f.nombre || f.nombre_liga, puede_retirar: !!f.puede_retirar, ventas_semestre: n.ventas, nivel: n.nivel.actual.nombre, pct: n.pct }); }
  return out;
}

export async function cuentaPuntos(env, email) {
  email = String(email || '').trim().toLowerCase();
  const a = await one(env, "SELECT a.email, a.code, a.nombre, c.nombre nombre_cuenta, COALESCE(c.puede_retirar, 0) puede_retirar, c.clabe, c.titular, c.banco, c.notas FROM affiliates a LEFT JOIN puntos_cuentas c ON c.email = a.email WHERE a.email = ? AND a.tipo = 'puntos'", email);
  if (!a) return null;
  const n = await nivelActual(env, email), t = await transferibleDe(env, email);
  const movimientos = await all(env, 'SELECT id, tipo, puntos, order_id, nota, base_centavos, pct, semestre, created_at FROM puntos_movimientos WHERE email = ? ORDER BY id DESC LIMIT 100', email);
  const retiros = await all(env, 'SELECT * FROM puntos_retiros WHERE email = ? ORDER BY id DESC LIMIT 50', email);
  return { cuenta: { ...a, nombre: a.nombre_cuenta || a.nombre, puede_retirar: !!a.puede_retirar }, nivel: { ventas: n.ventas, nombre: n.nivel.actual.nombre, pct: n.pct, semestre: n.semestre.id,
    siguiente: n.nivel.siguiente && { nombre: n.nivel.siguiente.nombre, pct: n.nivel.siguiente.pct, faltan: n.nivel.faltan } }, saldo: t, movimientos, retiros };
}

export async function habilitarRetiro(env, email, { puede_retirar, notas } = {}) {
  email = String(email || '').trim().toLowerCase();
  if (!(await one(env, "SELECT 1 FROM affiliates WHERE email = ? AND tipo = 'puntos'", email))) throw new Error('Esa cuenta de puntos no existe.');
  await run(env, `INSERT INTO puntos_cuentas (email, puede_retirar, notas) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET puede_retirar = excluded.puede_retirar, notas = COALESCE(excluded.notas, puntos_cuentas.notas)`,
    email, puede_retirar ? 1 : 0, notas === undefined ? null : (String(notas || '').trim().slice(0, 1000) || null));
  return cuentaPuntos(env, email);
}

// Cola de transferencias: primero las por pagar, luego el historial
export function retirosPuntos(env) {
  return all(env, `SELECT r.*, COALESCE(c.nombre, a.nombre) nombre, a.code FROM puntos_retiros r
    LEFT JOIN puntos_cuentas c ON c.email = r.email LEFT JOIN affiliates a ON a.email = r.email AND a.tipo = 'puntos'
    ORDER BY CASE r.estado WHEN 'por_pagar' THEN 0 ELSE 1 END, r.id DESC LIMIT 200`);
}

export async function resumenRetiros(env) {
  return one(env, `SELECT (SELECT COUNT(*) FROM puntos_retiros WHERE estado = 'por_pagar') pendientes,
      (SELECT COALESCE(SUM(puntos), 0) FROM puntos_retiros WHERE estado = 'por_pagar') por_pagar,
      (SELECT COUNT(*) FROM puntos_cuentas WHERE puede_retirar = 1) habilitadas`);
}

const EsquemaPagado = z.object({
  clave_rastreo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,30}$/, 'Escribe la clave de rastreo del SPEI (6 a 30 letras y números).'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del SPEI.'),
  nota: z.string().trim().max(280).optional().or(z.literal('')),
});
export async function marcarRetiro(env, id, datos) {
  const v = EsquemaPagado.safeParse(datos || {});
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  if (d.fecha > diaMx()) throw new Error('La fecha del SPEI no puede ser futura.');
  const r = await run(env, "UPDATE puntos_retiros SET estado = 'pagado', clave_rastreo = ?, pagado_el = ?, nota = COALESCE(NULLIF(?, ''), nota), decidido_at = ? WHERE id = ? AND estado = 'por_pagar'",
    d.clave_rastreo, d.fecha, d.nota || '', ahoraISO(), Number(id));
  if (!r.meta.changes) throw new Error('Esa transferencia ya no estaba por pagar.');
  const x = await one(env, 'SELECT * FROM puntos_retiros WHERE id = ?', Number(id));
  try {
    await enviar(env, { para: x.email, asunto: `Te transferimos ${pesos(x.puntos)} · Puntos Vorka`, idempotencia: `puntos-retiro-pagado-${x.id}`,
      html: marco('Tu transferencia va en camino', `<p style="${P}">Hola:</p><p style="${P}">Te transferimos <b>${pesos(x.puntos)}</b> por SPEI a tu CLABE ${esc(ocultarClabe(x.clabe))} el ${esc(d.fecha)}.</p>
<p style="${P}">Clave de rastreo: <b>${esc(d.clave_rastreo)}</b>. Puedes revisarla en el portal CEP de Banxico.</p>`),
      texto: `Te transferimos ${pesos(x.puntos)} por SPEI el ${d.fecha}. Clave de rastreo: ${d.clave_rastreo}.` });
  } catch (e) { console.error('puntos: aviso de transferencia falló', x.id, e?.message); }
  return { ok: true };
}

export async function cancelarRetiro(env, id, nota = null) {
  const x = await one(env, "SELECT * FROM puntos_retiros WHERE id = ? AND estado = 'por_pagar'", Number(id));
  if (!x) throw new Error('Esa transferencia ya no estaba por pagar.');
  const [r] = await env.DB.batch([
    env.DB.prepare("UPDATE puntos_retiros SET estado = 'cancelado', nota = COALESCE(?, nota), decidido_at = ? WHERE id = ? AND estado = 'por_pagar'").bind(nota, ahoraISO(), x.id),
    env.DB.prepare(`INSERT OR IGNORE INTO puntos_movimientos (email, tipo, puntos, nota, clave)
      SELECT ?, 'ajuste', ?, 'Te regresamos los puntos de una transferencia cancelada', ? WHERE EXISTS (SELECT 1 FROM puntos_retiros WHERE id = ? AND estado = 'cancelado')`)
      .bind(x.email, x.puntos, `retiro-cancelado:${x.id}`, x.id),
  ]);
  if (!r.meta.changes) throw new Error('Esa transferencia ya no estaba por pagar.');
  return { ok: true };
}

// CSV de transferencias (para el contador y para conciliar), por fecha de solicitud en hora del centro de México
const celda = x => { const s = String(x ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export async function exportarRetirosCSV(env, { desde, hasta } = {}) {
  const F = /^\d{4}-\d{2}-\d{2}$/;
  if (!F.test(desde || '') || !F.test(hasta || '') || desde > hasta) throw new Error('Elige las fechas.');
  const fin = new Date(new Date(inicioDiaMx(hasta)).getTime() + 864e5).toISOString();
  const filas = await all(env, 'SELECT * FROM puntos_retiros WHERE created_at >= ? AND created_at < ? ORDER BY created_at', inicioDiaMx(desde), fin);
  const enc = ['fecha', 'correo', 'titular', 'clabe', 'banco', 'puntos', 'monto_mxn', 'estado', 'clave_rastreo', 'pagado_el', 'nota'];
  const lineas = filas.map(r => [diaMx(r.created_at), r.email, r.titular, r.clabe, r.banco || '', r.puntos, r.puntos.toFixed(2), r.estado, r.clave_rastreo || '', r.pagado_el || '', r.nota || ''].map(celda).join(','));
  return '﻿' + [enc.join(','), ...lineas].join('\r\n') + '\r\n';
}
