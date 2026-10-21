// Socios Vorka: programa de socios comerciales SOLO POR INVITACIÓN (los da de alta el equipo en Vorka OS).
//
// - Atribución: la liga vorka.mx/tienda/?socio=CODIGO (o ?codigo=) deja la cookie vorka_socio 30 días; el código escrito
//   en el checkout gana sobre la cookie. Un código que no existe o está suspendido se ignora, y comprarse a uno mismo no cuenta.
// - Descuento opcional para quien compra (por socio, 0% por defecto). No aplica a suscripciones.
// - Comisión escalonada por mes calendario (hora del centro de México): por defecto 15% en las ventas 1 a 10 del socio
//   y 25% de la 11 en adelante. El nivel se fija al momento de cada venta y se guarda junto con la base y el %.
//   BASE: lo efectivamente cobrado de productos de Vorka México (orders.monto_centavos: neto de descuentos de puntos y de
//   socio, IVA incluido, antes de la comisión de Stripe). Productos de creadores del marketplace no dan comisión.
// - Suscripciones (Vuelve): la compra es la factura 1; las renovaciones (invoice.paid) dan comisión hasta la factura N
//   (12 por defecto). Las renovaciones no suben de nivel: usan el % del nivel que el socio lleva en ese mes.
// - Ciclo: pendiente (al pagarse) → disponible (tras la retención, 7 días) → pagada (cuando el equipo marca el SPEI).
//   Reembolso o contracargo antes de pagarla: se cancela. Después: ajuste negativo que se descuenta del siguiente pago.
// - Pagos: cada lunes un lote junta lo disponible de cada socio en un pago "por_pagar"; el socio puede pedir su pago
//   en cualquier momento. Nada mueve dinero solo: el equipo transfiere por SPEI y lo marca como pagado en Vorka OS.
// Impuestos: aquí no se retiene ISR/IVA ni se emite CFDI. Ver README-TIENDA.md (revisar con el contador antes del primer pago).
import { z } from 'zod';
import { one, all, run, ahoraISO } from './util.js';
import { enviar, marco, boton, P, esc, SOPORTE } from './correo.js';
import { diaMx, inicioDiaMx } from './puntos-reglas.js';

export const COOKIE_SOCIO = 'vorka_socio';
const COOKIE_DIAS = 30;
export const NIVELES_BASE = [{ desde: 1, pct: 15 }, { desde: 11, pct: 25 }];
export const AJUSTES_BASE = { niveles: NIVELES_BASE, retencion_dias: 7, facturas_suscripcion: 12, correo_avisos: SOPORTE.correo };
// 3 a 30 caracteres: letras, números y guiones (no al inicio ni al final). Se guarda en mayúsculas.
export const CODIGO = /^[A-Z0-9][A-Z0-9-]{1,28}[A-Z0-9]$/;
export const normalizarCodigo = c => String(c || '').trim().toUpperCase();
export const mesMx = iso => diaMx(iso).slice(0, 7);
const masDias = (iso, dias) => new Date(new Date(iso).getTime() + dias * 864e5).toISOString();
const json_ = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };

// CLABE interbancaria: 18 dígitos; el último es el verificador (pesos 3, 7, 1 sobre los primeros 17, módulo 10)
export function clabeValida(clabe) {
  const c = String(clabe || '').replace(/\s+/g, '');
  if (!/^\d{18}$/.test(c)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(c[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(c[17]);
}
const ocultarClabe = c => c ? `•••• ${String(c).slice(-4)}` : '';

// ---------- ajustes generales ----------
export async function ajustes(env) {
  const a = { ...AJUSTES_BASE };
  for (const f of await all(env, 'SELECT clave, valor FROM socios_ajustes')) if (f.clave in a) a[f.clave] = json_(f.valor, a[f.clave]);
  return a;
}
const Niveles = z.array(z.object({ desde: z.coerce.number().int().min(1).max(1000), pct: z.coerce.number().min(0).max(60) })).min(1, 'Pon al menos un nivel.').max(6)
  .refine(n => n[0].desde === 1, 'El primer nivel empieza en la venta 1.')
  .refine(n => n.every((x, i) => !i || x.desde > n[i - 1].desde), 'Cada nivel empieza en una venta mayor que el anterior.');
export const nivelesDe = (propios, aj) => (Array.isArray(propios) ? propios : json_(propios, null)) || aj.niveles;
// % que corresponde a la venta número n del mes (n = 0: aún sin ventas → primer nivel)
export function pctPara(niveles, n) {
  let pct = niveles[0].pct;
  for (const x of niveles) if (n >= x.desde) pct = x.pct;
  return pct;
}

// ---------- quién se lleva una compra ----------
export async function socioActivo(env, x) {
  if (x == null || x === '') return null;
  if (typeof x === 'number') return one(env, "SELECT * FROM socios WHERE id = ? AND estado = 'activo'", x);
  const code = normalizarCodigo(x);
  return CODIGO.test(code) ? one(env, "SELECT * FROM socios WHERE code = ? AND estado = 'activo'", code) : null;
}

// El código escrito en el checkout gana; si no, el de la liga (cookie). Comprarse a uno mismo no cuenta.
export async function socioParaCompra(env, { codigo, cookie, email }) {
  for (const c of [codigo, cookie]) {
    const s = await socioActivo(env, c);
    if (s && s.email.toLowerCase() !== String(email || '').trim().toLowerCase()) return s;
  }
  return null;
}

// ?socio=CODIGO o ?codigo=CODIGO en cualquier página → cookie de 30 días (solo si el código existe y está activo)
export async function cookieDeVisita(env, url) {
  const c = url.searchParams.get('socio') || url.searchParams.get('codigo');
  if (!c || c.length > 40) return null;
  const s = await socioActivo(env, c);
  return s ? `${COOKIE_SOCIO}=${encodeURIComponent(s.code)}; Max-Age=${COOKIE_DIAS * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax` : null;
}

// ---------- comisiones ----------
// Inserta la comisión de una venta de forma atómica: el número de venta del mes (y con él el %) se calcula dentro del
// mismo INSERT, así dos pagos que llegan juntos no pueden quedar con el mismo número. Idempotente por `clave`.
async function insertarVenta(env, v) {
  const casos = [...v.niveles].sort((a, b) => b.desde - a.desde);
  const caso = `CASE ${casos.map(() => 'WHEN x.n >= ? THEN ?').join(' ')} ELSE ? END`;
  const pc = [...casos.flatMap(c => [c.desde, c.pct]), casos.at(-1).pct];
  return run(env, `WITH x AS (SELECT (SELECT COUNT(*) FROM socios_comisiones WHERE socio_id = ? AND mes = ? AND cuenta_nivel = 1 AND tipo = 'venta' AND estado != 'cancelada') + ? AS n)
    INSERT OR IGNORE INTO socios_comisiones (socio_id, order_id, clave, tipo, factura_id, suscripcion_id, numero_factura, concepto, base_centavos, pct, monto_centavos, venta_n, cuenta_nivel, mes, estado, disponible_en)
    SELECT ?, ?, ?, 'venta', ?, ?, ?, ?, ?, ${caso}, CAST(ROUND(? * (${caso}) / 100.0) AS INTEGER), x.n, ?, ?, 'pendiente', ? FROM x`,
    v.socio_id, v.mes, v.cuenta, v.socio_id, v.order_id, v.clave, v.factura_id ?? null, v.suscripcion_id ?? null, v.numero_factura ?? null,
    String(v.concepto || '').slice(0, 200), v.base, ...pc, v.base, ...pc, v.cuenta, v.mes, v.disponible_en);
}

// Al pagarse una orden con socio (webhook; idempotente)
export async function comisionAlPagar(env, orderId) {
  const o = await one(env, "SELECT o.id, o.socio_id, o.monto_centavos, o.paid_at, s.niveles FROM orders o JOIN socios s ON s.id = o.socio_id WHERE o.id = ? AND o.estado = 'paid'", orderId);
  if (!o || !(o.monto_centavos > 0)) return null;
  const items = await all(env, 'SELECT nombre, precio_centavos, cantidad, creador_id FROM order_items WHERE order_id = ? ORDER BY id', o.id);
  const total = items.reduce((s, i) => s + i.precio_centavos * i.cantidad, 0);
  const propios = items.filter(i => !i.creador_id);
  const propia = propios.reduce((s, i) => s + i.precio_centavos * i.cantidad, 0);
  if (!propia) return null;   // solo productos de creadores: no hay comisión de socio
  const base = propia === total ? o.monto_centavos : Math.round(o.monto_centavos * propia / total);
  const aj = await ajustes(env), pagada = o.paid_at || ahoraISO();
  return insertarVenta(env, {
    socio_id: o.socio_id, order_id: o.id, clave: `orden:${o.id}`, base, cuenta: 1,
    concepto: propios.map(i => i.nombre + (i.cantidad > 1 ? ` × ${i.cantidad}` : '')).join(' + '),
    mes: mesMx(pagada), disponible_en: masDias(pagada, aj.retencion_dias), niveles: nivelesDe(o.niveles, aj),
  });
}

// Renovación pagada de una suscripción (invoice.paid). f = factura de Stripe consultada en la API; sub = su suscripción.
export async function comisionFactura(env, f, sub) {
  if (!f || f.status !== 'paid' || !(f.amount_paid > 0)) return null;
  if (f.billing_reason === 'subscription_create') return null;   // la factura 1 es la compra: ya tiene su comisión por la orden
  const orderId = sub?.metadata?.order_id;
  if (!orderId) return null;
  const o = await one(env, 'SELECT o.id, o.socio_id, s.niveles, (SELECT nombre FROM order_items WHERE order_id = o.id ORDER BY id LIMIT 1) producto FROM orders o JOIN socios s ON s.id = o.socio_id WHERE o.id = ?', orderId);
  if (!o) return null;
  const aj = await ajustes(env);
  const previas = (await one(env, "SELECT COUNT(*) n FROM socios_comisiones WHERE suscripcion_id = ? AND tipo = 'venta' AND clave != ?", sub.id, `factura:${f.id}`)).n;
  const numero = 2 + previas;
  if (numero > aj.facturas_suscripcion) return null;
  const pagada = f.status_transitions?.paid_at ? new Date(f.status_transitions.paid_at * 1000).toISOString() : ahoraISO();
  return insertarVenta(env, {
    socio_id: o.socio_id, order_id: o.id, clave: `factura:${f.id}`, factura_id: f.id, suscripcion_id: sub.id, numero_factura: numero,
    base: f.amount_paid, cuenta: 0, concepto: `${o.producto || 'Suscripción'} · pago ${numero} de ${aj.facturas_suscripcion}`,
    mes: mesMx(pagada), disponible_en: masDias(pagada, aj.retencion_dias), niveles: nivelesDe(o.niveles, aj),
  });
}

// Reembolso o contracargo de la orden: antes del pago al socio se cancela; si ya se le pagó, ajuste negativo
export async function comisionAlReembolsar(env, orderId) {
  for (const c of await all(env, 'SELECT id FROM socios_comisiones WHERE clave = ?', `orden:${orderId}`)) await anular(env, c.id, 'Reembolso');
}

// Anular una comisión de venta (reembolso, o a mano desde el panel, p. ej. una renovación reembolsada en Stripe)
async function anular(env, id, motivo) {
  const c = await one(env, "SELECT c.*, p.estado pago_estado FROM socios_comisiones c LEFT JOIN socios_pagos p ON p.id = c.pago_id WHERE c.id = ? AND c.tipo = 'venta'", id);
  if (!c || c.estado === 'cancelada') return false;
  if (c.estado !== 'pagada' && c.pago_estado !== 'pagado') {
    await run(env, "UPDATE socios_comisiones SET estado = 'cancelada', pago_id = NULL WHERE id = ? AND estado IN ('pendiente', 'disponible')", c.id);
    if (c.pago_id) await recalcularPago(env, c.pago_id);
  } else {
    const ahora = ahoraISO();
    await run(env, `INSERT OR IGNORE INTO socios_comisiones (socio_id, order_id, clave, tipo, concepto, base_centavos, pct, monto_centavos, cuenta_nivel, mes, estado, disponible_en, ajuste_de)
      VALUES (?, ?, ?, 'ajuste', ?, ?, ?, ?, 0, ?, 'disponible', ?, ?)`,
      c.socio_id, c.order_id, `ajuste:${c.id}`, `${motivo} · ${c.concepto || ''}`.slice(0, 200), -c.base_centavos, c.pct, -c.monto_centavos, mesMx(ahora), ahora, c.id);
  }
  return true;
}
export async function anularComision(env, id) {
  if (!(await anular(env, Number(id), 'Anulada'))) throw new Error('Esa comisión no existe o ya estaba cancelada.');
  return { ok: true };
}

// ---------- pagos ----------
// Cada hora: lo que ya pasó la retención (y sigue pagado) queda disponible para cobrar
export async function liberarComisiones(env, ahora = new Date()) {
  const r = await run(env, `UPDATE socios_comisiones SET estado = 'disponible' WHERE estado = 'pendiente' AND disponible_en <= ?
    AND (factura_id IS NOT NULL OR order_id IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.id = socios_comisiones.order_id AND o.estado = 'paid'))`, new Date(ahora).toISOString());
  return r.meta.changes;
}

async function recalcularPago(env, pagoId) {
  await run(env, "UPDATE socios_pagos SET monto_centavos = (SELECT COALESCE(SUM(monto_centavos), 0) FROM socios_comisiones WHERE pago_id = ?) WHERE id = ? AND estado = 'por_pagar'", pagoId, pagoId);
  const p = await one(env, "SELECT monto_centavos FROM socios_pagos WHERE id = ? AND estado = 'por_pagar'", pagoId);
  if (p && p.monto_centavos <= 0) await cancelarPago(env, pagoId, 'Quedó en $0 por reembolsos.');
}

// Un pago por_pagar con todo lo disponible del socio que aún no está en otro pago. Ajustes negativos incluidos;
// si el total no es positivo, se queda para el siguiente. null si no hay nada que pagar (o ya existe el lote de esa semana).
export async function crearPago(env, socioId, { origen, semana = null }) {
  const s = await one(env, "SELECT COALESCE(SUM(monto_centavos), 0) total, MAX(id) hasta FROM socios_comisiones WHERE socio_id = ? AND estado = 'disponible' AND pago_id IS NULL", socioId);
  if (!(s.total > 0)) return null;
  const p = await one(env, 'INSERT OR IGNORE INTO socios_pagos (socio_id, monto_centavos, origen, semana) VALUES (?, ?, ?, ?) RETURNING id', socioId, s.total, origen, semana);
  if (!p) return null;
  await run(env, "UPDATE socios_comisiones SET pago_id = ? WHERE socio_id = ? AND estado = 'disponible' AND pago_id IS NULL AND id <= ?", p.id, socioId, s.hasta);
  await recalcularPago(env, p.id);
  return one(env, "SELECT * FROM socios_pagos WHERE id = ? AND estado = 'por_pagar'", p.id);
}

// Lunes (hora del centro de México): un pago por socio activo con saldo. Idempotente por (socio, semana).
export const esLunesMx = (ahora = new Date()) => new Date(new Date(ahora).getTime() - 6 * 3600e3).getUTCDay() === 1;
export async function loteSemanal(env, ahora = new Date(), { forzar = false } = {}) {
  await liberarComisiones(env, ahora);
  if (!forzar && !esLunesMx(ahora)) return { pagos: 0 };
  const semana = diaMx(ahora);
  const socios = await all(env, `SELECT DISTINCT c.socio_id FROM socios_comisiones c JOIN socios s ON s.id = c.socio_id
    WHERE c.estado = 'disponible' AND c.pago_id IS NULL AND s.estado = 'activo'`);
  let pagos = 0;
  for (const x of socios) if (await crearPago(env, x.socio_id, { origen: 'semanal', semana })) pagos++;
  return { pagos, semana };
}

export async function cancelarPago(env, id, nota = null) {
  const [r] = await env.DB.batch([
    env.DB.prepare("UPDATE socios_pagos SET estado = 'cancelado', nota = COALESCE(?, nota) WHERE id = ? AND estado = 'por_pagar'").bind(nota, Number(id)),
    env.DB.prepare("UPDATE socios_comisiones SET pago_id = NULL WHERE pago_id = ? AND estado = 'disponible' AND EXISTS (SELECT 1 FROM socios_pagos WHERE id = ? AND estado = 'cancelado')").bind(Number(id), Number(id)),
  ]);
  if (!r.meta.changes) throw new Error('Ese pago ya no estaba por pagar.');
  return { ok: true };
}

// "Lo necesito ya" desde el portal: pago por_pagar inmediato con todo lo disponible + aviso al equipo
export async function pedirPagoInmediato(env, socioId) {
  const s = await one(env, 'SELECT * FROM socios WHERE id = ?', socioId);
  if (!s || s.estado !== 'activo') throw new Error('Tu cuenta de socio está pausada. Escríbenos a hola@vorka.mx.');
  await liberarComisiones(env);
  const ya = await one(env, "SELECT * FROM socios_pagos WHERE socio_id = ? AND estado = 'por_pagar' AND origen = 'inmediato'", socioId);
  const p = await crearPago(env, socioId, { origen: 'inmediato' });
  if (!p) {
    if (ya) throw new Error('Ya pediste tu pago y lo estamos procesando. Te avisamos por correo cuando lo transfiramos.');
    throw new Error('Aún no tienes saldo disponible para cobrar. Cada comisión se libera unos días después de la venta.');
  }
  try {
    const aj = await ajustes(env);
    await enviar(env, { para: aj.correo_avisos, asunto: `Pago inmediato pedido: ${s.nombre} · ${pesosMx(p.monto_centavos)}`,
      html: marco('Un socio pidió su pago', `<p style="${P}"><b>${esc(s.nombre)}</b> (${esc(s.code)}) pidió su pago ahora por <b>${pesosMx(p.monto_centavos)}</b>.</p>
<p style="${P}">CLABE ${esc(ocultarClabe(s.clabe))} · ${esc(s.banco || '')}. Transfiere por SPEI y márcalo como pagado (con la clave de rastreo) en Vorka OS › Tienda › Socios.</p>${boton('https://os.vorka.mx/#/tienda/socios', 'Abrir pagos a socios')}`, { etiqueta: 'Socios' }),
      texto: `${s.nombre} (${s.code}) pidió su pago ahora por ${pesosMx(p.monto_centavos)}. Transfiere por SPEI y márcalo como pagado en Vorka OS › Tienda › Socios.`,
      idempotencia: `socio-pago-${p.id}` });
  } catch (e) { console.error('socios: aviso de pago inmediato falló', p.id, e?.message); }
  return p;
}
const pesosMx = c => '$' + (Number(c || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- resumen (portal del socio y panel) ----------
// Lo que ve el socio: producto, fecha, monto y comisión. Nunca datos de quien compró.
export async function resumenSocio(env, socioId, ahora = new Date()) {
  const s = await one(env, 'SELECT * FROM socios WHERE id = ?', socioId);
  if (!s) return null;
  const aj = await ajustes(env), niveles = nivelesDe(s.niveles, aj), mes = mesMx(ahora);
  const ventas = (await one(env, "SELECT COUNT(*) n FROM socios_comisiones WHERE socio_id = ? AND mes = ? AND cuenta_nivel = 1 AND tipo = 'venta' AND estado != 'cancelada'", s.id, mes)).n;
  // Siguiente nivel por encima del que toca a la próxima venta (con 0 ventas, la próxima es la 1)
  const siguiente = niveles.find(x => x.desde > ventas + 1) || null;
  const suma = async w => (await one(env, `SELECT COALESCE(SUM(monto_centavos), 0) n FROM socios_comisiones WHERE socio_id = ? AND ${w}`, s.id)).n;
  const totales = {
    pendiente: await suma("estado = 'pendiente'"),
    disponible: await suma("estado = 'disponible' AND pago_id IS NULL"),
    en_camino: await suma("estado = 'disponible' AND pago_id IS NOT NULL"),
    pagada: await suma("estado = 'pagada'"),
  };
  const comisiones = await all(env, `SELECT c.id, c.tipo, c.concepto, c.base_centavos, c.pct, c.monto_centavos, c.venta_n, c.mes, c.estado, c.disponible_en, c.created_at, c.pago_id, c.numero_factura
    FROM socios_comisiones c WHERE c.socio_id = ? ORDER BY c.id DESC LIMIT 100`, s.id);
  const pagos = await all(env, 'SELECT id, monto_centavos, estado, origen, semana, clave_rastreo, pagado_el, created_at FROM socios_pagos WHERE socio_id = ? ORDER BY id DESC LIMIT 50', s.id);
  return { socio: s, mes, ventas_mes: ventas, pct_actual: pctPara(niveles, Math.max(1, ventas)), pct_siguiente: siguiente?.pct ?? null,
    desde_siguiente: siguiente?.desde ?? null, faltan: siguiente ? siguiente.desde - ventas : 0, niveles, retencion_dias: aj.retencion_dias, totales, comisiones, pagos };
}

// ---------- panel (RPC desde Vorka OS) ----------
const EsquemaSocio = z.object({
  id: z.coerce.number().int().positive().optional().or(z.literal('')).or(z.null()),
  code: z.string().transform(normalizarCodigo).pipe(z.string().regex(CODIGO, 'El código lleva de 3 a 30 letras, números o guiones (sin espacios ni acentos), p. ej. ANA-CELAYA.')),
  nombre: z.string().trim().min(2, 'Escribe el nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  telefono: z.string().trim().regex(/^\+?[\d\s()-]{10,20}$/, 'Escribe un teléfono de 10 dígitos (con lada).'),
  clabe: z.string().transform(c => String(c || '').replace(/\s+/g, '')).refine(clabeValida, 'La CLABE no es válida: son 18 dígitos y el último es el verificador. Revísala con el socio.'),
  banco: z.string().trim().min(2, 'Escribe el banco.').max(60),
  rfc: z.string().trim().toUpperCase().regex(/^([A-ZÑ&]{3,4}\d{6}[A-Z\d]{3})?$/, 'El RFC no tiene el formato correcto (12 o 13 caracteres).').optional().or(z.null()),
  notas: z.string().trim().max(1000, 'Las notas pueden tener hasta 1,000 caracteres.').optional().or(z.null()),
  descuento_pct: z.coerce.number().min(0, 'El descuento va de 0 a 50%.').max(50, 'El descuento va de 0 a 50%.').default(0),
  niveles: Niveles.optional().or(z.null()),
  estado: z.enum(['activo', 'suspendido']).default('activo'),
  invitar: z.boolean().optional(),
});

export async function listaSocios(env, ahora = new Date()) {
  const mes = mesMx(ahora), aj = await ajustes(env);
  const filas = await all(env, `SELECT s.*,
      (SELECT COUNT(*) FROM socios_comisiones c WHERE c.socio_id = s.id AND c.mes = ? AND c.cuenta_nivel = 1 AND c.tipo = 'venta' AND c.estado != 'cancelada') ventas_mes,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM socios_comisiones c WHERE c.socio_id = s.id AND c.estado = 'pendiente') pendiente,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM socios_comisiones c WHERE c.socio_id = s.id AND c.estado = 'disponible') disponible,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM socios_comisiones c WHERE c.socio_id = s.id AND c.estado = 'pagada') pagada
    FROM socios s ORDER BY CASE s.estado WHEN 'activo' THEN 0 ELSE 1 END, s.nombre`, mes);
  return filas.map(s => ({ ...s, clabe: ocultarClabe(s.clabe), niveles: json_(s.niveles, null), pct_actual: pctPara(nivelesDe(s.niveles, aj), Math.max(1, s.ventas_mes)) }));
}

export async function detalleSocio(env, id) {
  const r = await resumenSocio(env, Number(id));
  if (!r) return null;
  // El panel sí ve a qué orden corresponde cada comisión (el portal del socio no)
  const ordenes = await all(env, 'SELECT id, order_id FROM socios_comisiones WHERE socio_id = ? ORDER BY id DESC LIMIT 100', r.socio.id);
  const porId = new Map(ordenes.map(o => [o.id, o.order_id]));
  return { ...r, socio: { ...r.socio, niveles: json_(r.socio.niveles, null) }, comisiones: r.comisiones.map(c => ({ ...c, order_id: porId.get(c.id) || null })) };
}

export async function guardarSocio(env, datos) {
  const v = EsquemaSocio.safeParse(datos || {});
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data, id = d.id ? Number(d.id) : null;
  if (await one(env, 'SELECT 1 FROM socios WHERE code = ? AND id != ?', d.code, id || 0)) throw new Error(`El código ${d.code} ya es de otro socio. Elige otro.`);
  const campos = [d.code, d.nombre, d.email, d.telefono, d.clabe, d.banco, d.rfc || null, d.notas || null, d.descuento_pct, d.niveles ? JSON.stringify(d.niveles) : null, d.estado];
  let socioId = id;
  if (id) {
    const r = await run(env, 'UPDATE socios SET code = ?, nombre = ?, email = ?, telefono = ?, clabe = ?, banco = ?, rfc = ?, notas = ?, descuento_pct = ?, niveles = ?, estado = ?, updated_at = ? WHERE id = ?', ...campos, ahoraISO(), id);
    if (!r.meta.changes) throw new Error('Ese socio no existe.');
  } else {
    socioId = (await one(env, 'INSERT INTO socios (code, nombre, email, telefono, clabe, banco, rfc, notas, descuento_pct, niveles, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING id', ...campos)).id;
  }
  if (d.invitar) await invitarSocio(env, socioId);
  return detalleSocio(env, socioId);
}

export async function estadoSocio(env, id, estado) {
  if (!['activo', 'suspendido'].includes(estado)) throw new Error('Estado no válido.');
  const r = await run(env, 'UPDATE socios SET estado = ?, updated_at = ? WHERE id = ?', estado, ahoraISO(), Number(id));
  if (!r.meta.changes) throw new Error('Ese socio no existe.');
  // Suspendido: deja de atribuir ventas y de entrar al lote semanal; sus sesiones del portal se cierran
  if (estado === 'suspendido') await run(env, "DELETE FROM socios_accesos WHERE socio_id = ?", Number(id));
  return { ok: true };
}

// Correo de bienvenida: su código, su liga y cómo entrar al portal (con su correo, sin contraseña)
export async function invitarSocio(env, id) {
  const s = await one(env, 'SELECT * FROM socios WHERE id = ?', Number(id));
  if (!s) throw new Error('Ese socio no existe.');
  if (s.estado !== 'activo') throw new Error('Reactiva al socio antes de mandarle su acceso.');
  const aj = await ajustes(env), niveles = nivelesDe(s.niveles, aj);
  const liga = `${env.SITE_URL}/tienda/?socio=${encodeURIComponent(s.code)}`, portal = `${env.SITE_URL}/tienda/socios/`;
  const escalas = niveles.map((x, i) => `${x.pct}% ${niveles[i + 1] ? `de la venta ${x.desde} a la ${niveles[i + 1].desde - 1}` : `desde la venta ${x.desde}`}`).join(' y ');
  const nombre = s.nombre.split(' ')[0];
  await enviar(env, { para: s.email, asunto: 'Bienvenida a Socios Vorka', idempotencia: `socio-bienvenida-${s.id}-${Math.floor(Date.now() / 3600e3)}`,
    html: marco('Ya eres socio de Vorka México', `<p style="${P}">Hola, ${esc(nombre)}:</p>
<p style="${P}">Te damos la bienvenida a <b>Socios Vorka</b>. Tu código es <b>${esc(s.code)}</b> y tu liga para compartir es:</p>
<p style="${P};word-break:break-all"><a href="${esc(liga)}" style="color:#6b2a85">${esc(liga)}</a></p>
<p style="${P}">Por cada venta con tu código ganas ${esc(escalas)} en el mes${s.descuento_pct ? `, y quien compra con tu código recibe ${s.descuento_pct}% de descuento` : ''}. Las comisiones se liberan ${aj.retencion_dias} días después de cada venta y te pagamos por SPEI cada lunes (o cuando lo pidas desde tu portal).</p>
${boton(portal, 'Entrar a mi portal de socio')}
<p style="${P}">Para entrar solo escribe este correo y te mandamos un enlace (sin contraseña). Consulta las <a href="${env.SITE_URL}/legal/socios/" style="color:#6b2a85">condiciones del programa</a>. ¿Dudas? <a href="mailto:${SOPORTE.correo}" style="color:#6b2a85">${SOPORTE.correo}</a>.</p>`, { etiqueta: 'Socios' }),
    texto: `Hola, ${nombre}:\n\nYa eres socio de Vorka México. Tu código: ${s.code}\nTu liga: ${liga}\n\nGanas ${escalas} por venta en el mes. Entra a tu portal con este correo: ${portal}\n\nCondiciones: ${env.SITE_URL}/legal/socios/` });
  return { ok: true };
}

export async function ajustesSocios(env) { return ajustes(env); }
const EsquemaAjustes = z.object({
  niveles: Niveles,
  retencion_dias: z.coerce.number().int().min(0, 'La retención va de 0 a 60 días.').max(60, 'La retención va de 0 a 60 días.'),
  facturas_suscripcion: z.coerce.number().int().min(1, 'Pon de 1 a 36 pagos.').max(36, 'Pon de 1 a 36 pagos.'),
  correo_avisos: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido para los avisos.')),
});
export async function guardarAjustesSocios(env, datos) {
  const v = EsquemaAjustes.safeParse(datos || {});
  if (!v.success) throw new Error(v.error.issues[0].message);
  await env.DB.batch(Object.entries(v.data).map(([k, val]) =>
    env.DB.prepare('INSERT INTO socios_ajustes (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor').bind(k, JSON.stringify(val))));
  return ajustes(env);
}

// Cola de pagos: primero los por pagar (los "lo necesito ya" arriba), luego el historial
export async function pagosSocios(env) {
  return all(env, `SELECT p.*, s.nombre, s.code, s.email, s.clabe, s.banco, s.rfc,
      (SELECT COUNT(*) FROM socios_comisiones c WHERE c.pago_id = p.id) comisiones
    FROM socios_pagos p JOIN socios s ON s.id = p.socio_id
    ORDER BY CASE p.estado WHEN 'por_pagar' THEN 0 ELSE 1 END, CASE p.origen WHEN 'inmediato' THEN 0 ELSE 1 END, p.id DESC LIMIT 200`);
}

const EsquemaPagado = z.object({
  clave_rastreo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,30}$/, 'Escribe la clave de rastreo del SPEI (6 a 30 letras y números).'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del SPEI.'),
  nota: z.string().trim().max(280).optional().or(z.literal('')),
});
export async function marcarPagoSocio(env, id, datos) {
  const v = EsquemaPagado.safeParse(datos || {});
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  if (d.fecha > diaMx()) throw new Error('La fecha del SPEI no puede ser futura.');
  const [r] = await env.DB.batch([
    env.DB.prepare("UPDATE socios_pagos SET estado = 'pagado', clave_rastreo = ?, pagado_el = ?, nota = COALESCE(NULLIF(?, ''), nota), pagado_at = ? WHERE id = ? AND estado = 'por_pagar'").bind(d.clave_rastreo, d.fecha, d.nota || '', ahoraISO(), Number(id)),
    env.DB.prepare("UPDATE socios_comisiones SET estado = 'pagada' WHERE pago_id = ? AND estado = 'disponible' AND EXISTS (SELECT 1 FROM socios_pagos WHERE id = ? AND estado = 'pagado')").bind(Number(id), Number(id)),
  ]);
  if (!r.meta.changes) throw new Error('Ese pago ya no estaba por pagar.');
  const p = await one(env, 'SELECT p.*, s.nombre, s.email, s.clabe FROM socios_pagos p JOIN socios s ON s.id = p.socio_id WHERE p.id = ?', Number(id));
  try {
    await enviar(env, { para: p.email, asunto: `Te pagamos ${pesosMx(p.monto_centavos)} · Socios Vorka`, idempotencia: `socio-pagado-${p.id}`,
      html: marco('Tu pago va en camino', `<p style="${P}">Hola, ${esc(p.nombre.split(' ')[0])}:</p><p style="${P}">Te transferimos <b>${pesosMx(p.monto_centavos)}</b> por SPEI a tu CLABE ${esc(ocultarClabe(p.clabe))} el ${esc(d.fecha)}. Clave de rastreo: <b>${esc(d.clave_rastreo)}</b> (con ella lo ubicas en banxico.org.mx/cep).</p>${boton(`${env.SITE_URL}/tienda/socios/`, 'Ver mis comisiones')}`, { etiqueta: 'Socios' }),
      texto: `Te transferimos ${pesosMx(p.monto_centavos)} por SPEI el ${d.fecha}. Clave de rastreo: ${d.clave_rastreo}.` });
  } catch (e) { console.error('socios: aviso de pago falló', p.id, e?.message); }
  return { ok: true };
}

// CSV de comisiones (para el contador y para conciliar pagos), por fecha de la comisión en hora del centro de México
const celda = x => { const s = String(x ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export async function exportarSociosCSV(env, { desde, hasta } = {}) {
  const F = /^\d{4}-\d{2}-\d{2}$/;
  if (!F.test(desde || '') || !F.test(hasta || '') || desde > hasta) throw new Error('Elige las fechas.');
  const fin = new Date(new Date(inicioDiaMx(hasta)).getTime() + 864e5).toISOString();
  const filas = await all(env, `SELECT c.*, s.nombre, s.code, s.rfc, p.estado pago_estado, p.clave_rastreo, p.pagado_el
    FROM socios_comisiones c JOIN socios s ON s.id = c.socio_id LEFT JOIN socios_pagos p ON p.id = c.pago_id
    WHERE c.created_at >= ? AND c.created_at < ? ORDER BY c.created_at`, inicioDiaMx(desde), fin);
  const enc = ['fecha', 'socio', 'codigo', 'rfc', 'orden', 'tipo', 'concepto', 'base', 'porcentaje', 'comision', 'estado', 'pago', 'estado_pago', 'clave_rastreo', 'pagado_el'];
  const lineas = filas.map(c => [diaMx(c.created_at), c.nombre, c.code, c.rfc || '', c.order_id || '', c.tipo, c.concepto, (c.base_centavos / 100).toFixed(2), c.pct,
    (c.monto_centavos / 100).toFixed(2), c.estado, c.pago_id || '', c.pago_estado || '', c.clave_rastreo || '', c.pagado_el || ''].map(celda).join(','));
  return '﻿' + [enc.join(','), ...lineas].join('\r\n') + '\r\n';
}

// Resumen para la portada del panel
export async function resumenSocios(env) {
  const r = await one(env, `SELECT (SELECT COUNT(*) FROM socios WHERE estado = 'activo') activos,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM socios_pagos WHERE estado = 'por_pagar') por_pagar,
      (SELECT COUNT(*) FROM socios_pagos WHERE estado = 'por_pagar' AND origen = 'inmediato') inmediatos`);
  return r;
}
