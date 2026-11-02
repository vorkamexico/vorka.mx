// Toolkit Vorka · recarga mensual de saldo (migración 0063). Páginas en toolkit-paginas.js.
//
// Planes (suscripción mensual en Stripe, precios en línea como las demás apps): Toolkit $599 → $800 de saldo cada mes;
// Toolkit Pro $1,199 → $1,800. El bono de cada plan vive en products.contenido.toolkit.bono_centavos.
//
// Libro de saldo (toolkit_movimientos): movimientos inmutables en centavos, saldo = SUM(centavos) por correo.
//   abono       cada factura pagada de la suscripción (invoice.paid), una sola vez por factura (clave 'factura:<in_…>')
//   compra      un producto para sí pagado con saldo (orden 'saldo' de $0 que se entrega como cualquier compra)
//   app         meses de Clara, Cuentas, Vende, Agenda o Vuelve: una orden 'saldo' que las apps ven como cortesía
//   codigos     una tanda de códigos de regalo de un solo uso (100 % de UN producto; en apps, 1 mes)
//   devolucion  un código de regalo sin usar que su dueño regresa a su saldo (+ el precio que pagó por él)
//   reembolso   reembolso o contracargo del pago de una factura: se resta lo que ese pago abonó (nunca queda negativo)
// Los cargos van en un batch (D1 = una transacción): el INSERT del cargo solo pasa si el saldo alcanza EN ESE MOMENTO, y la
// orden, sus renglones o los códigos solo se insertan si existe el cargo (misma clave). Dos compras simultáneas no pueden
// gastar el mismo saldo: la segunda no inserta nada.
//
// Reglas del dueño (decisión final, 2026-11-02): el saldo se cobra a precio de lista y se acumula sin tope. El saldo NUNCA
// vence: si cancela o deja de pagar lo conserva para siempre y lo sigue usando; solo deja de recibir abonos. Los códigos
// sacados con saldo tampoco vencen (son saldo ya pagado); mientras nadie los use, su dueño los puede devolver a su saldo.
// Fuera del saldo: productos de creadores independientes, el propio Toolkit y pagos mixtos (saldo + tarjeta).
// Lo que se paga o se canjea con saldo NO da Puntos Vorka (las órdenes 'saldo' son de $0 y no llevan ref_code); los pagos de
// la suscripción sí, con las reglas de siempre (puntos.js › puntosAlPagar y puntosFactura).
import { one, all, run, ahoraISO, pesos, correoOculto } from './util.js';
import { VENDIBLE, productoPorSlug, registrarAnalitica } from './modelo.js';
import { vigente, cortesiaApp, finCortesia, VIGENTES, portalApp } from './suscripciones.js';
import { entregar } from './entrega.js';
import { puedeComprarIntento, simuladorDe } from './simulador/index.js';
import { NOMBRE_APP } from './descuentos.js';
// (sin correos propios: los de entrega son los de siempre, ver entrega.js › correoToolkit)

export const APP = 'toolkit';
export const MAX_CODIGOS = 20;
export const MAX_MESES = 12;
// Apps de suscripción cuyos meses se pagan con saldo (como cortesía, con su precio mensual de lista)
export const APPS_SALDO = ['clara', 'cuentas', 'vende', 'agenda', 'vuelve'];
export const NOMBRE_APP_SALDO = { clara: 'Clara Pro', cuentas: 'Cuentas', vende: 'Vende Pro', agenda: 'Agenda', vuelve: 'Vuelve' };
export const FUNDADOR = 'Precio fundador garantizado por tus primeros 3 meses. Desde el 4.º mes el precio o el bono pueden cambiar; te avisamos por correo con 30 días de anticipación y puedes cancelar cuando quieras.';
export const EXCLUIDO_CREADOR = 'Este producto es de un creador independiente: por ahora no se puede pagar con el saldo del Toolkit. Puedes pagarlo con tarjeta, OXXO o SPEI.';
const DIA = 864e5;
const norm = e => String(e || '').trim().toLowerCase();
const jsonDe = t => { try { return JSON.parse(t || '{}'); } catch { return {}; } };
export const fechaMx = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric' });
export const esToolkit = p => p?.contenido?.acceso?.app === APP;

const SQL_SALDO = 'SELECT COALESCE(SUM(centavos), 0) FROM toolkit_movimientos WHERE email = ?';
export const saldoToolkit = async (env, email) => (await one(env, `SELECT (${SQL_SALDO}) s`, norm(email))).s;

/**
 * Estado del Toolkit de un correo:
 * { tiene, activo, usable, saldo_centavos, plan: { slug, nombre, bono_centavos, precio_centavos }, suscripcion, proximo_abono }
 * activo: suscripción vigente en Stripe (active, trialing o past_due): sigue recibiendo abonos. usable: hay saldo (el saldo
 * nunca vence, aunque la suscripción ya esté cancelada).
 */
export async function estadoToolkit(env, email) {
  email = norm(email);
  const sub = await vigente(env, email, APP);
  const ultima = sub || await one(env, "SELECT * FROM suscripciones WHERE email = ? AND app = 'toolkit' ORDER BY updated_at DESC LIMIT 1", email);
  const ab = await one(env, 'SELECT COUNT(*) n FROM toolkit_movimientos WHERE email = ?', email);
  const saldo = await saldoToolkit(env, email);
  const prod = ultima?.product_id ? await one(env, 'SELECT slug, nombre, precio_centavos, contenido FROM products WHERE id = ?', ultima.product_id) : null;
  const tk = jsonDe(prod?.contenido).toolkit || null;
  const plan = prod ? { slug: prod.slug, nombre: tk?.plan === 'toolkit-pro' ? 'Toolkit Pro' : 'Toolkit', bono_centavos: tk?.bono_centavos || 0, precio_centavos: prod.precio_centavos } : null;
  return {
    email, tiene: !!(ultima || ab?.n), activo: !!sub, usable: saldo > 0, saldo_centavos: saldo, plan,
    suscripcion: ultima ? { estado: ultima.estado, periodo_fin: ultima.periodo_fin, cancelar_al_final: !!ultima.cancelar_al_final } : null,
    proximo_abono: sub && !sub.cancelar_al_final && plan ? { fecha: sub.periodo_fin, centavos: plan.bono_centavos } : null,
  };
}

// ---------- abonos (webhook invoice.paid) ----------
// El PaymentIntent que pagó la factura (API 2025-03-31+: factura.payments; antes, factura.payment_intent)
export function pagoDeFactura(f) {
  const pagos = f?.payments?.data || [];
  const pg = pagos.find(p => p.status === 'paid') || pagos[0];
  let pi = pg?.payment?.payment_intent || f?.payment_intent || null;
  if (typeof pi === 'object') pi = pi?.id || null;
  return pi || null;
}
const periodoDeFactura = f => { const fin = Math.max(0, ...(f?.lines?.data || []).map(l => Number(l.period?.end) || 0)); return fin ? new Date(fin * 1000).toISOString() : null; };

/**
 * Factura pagada de una suscripción del Toolkit → abono del bono de su plan. Una sola vez por factura (reintentos del
 * webhook incluidos). f = factura de Stripe; sub = suscripción; fila = el renglón que guardó guardarSuscripcion.
 * No abona facturas de $0 (un cupón del 100 % no puede regalar saldo).
 */
export async function abonoToolkit(env, f, sub, fila) {
  if (!f || !fila || fila.app !== APP) return null;
  if (f.status !== 'paid' || !(Number(f.total) > 0)) return null;
  const prod = await one(env, 'SELECT nombre, contenido FROM products WHERE id = ?', fila.product_id);
  const tk = jsonDe(prod?.contenido).toolkit;
  if (!tk?.bono_centavos) { console.error('ALERTA toolkit: el plan no tiene bono', fila.product_id, f.id); return null; }
  const email = norm(fila.email);
  const nombre = tk.plan === 'toolkit-pro' ? 'Toolkit Pro' : 'Toolkit';
  const r = await run(env, `INSERT OR IGNORE INTO toolkit_movimientos (email, tipo, centavos, clave, plan, factura_id, pago_id, suscripcion_id, periodo_fin, product_id, nota)
    VALUES (?, 'abono', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  email, tk.bono_centavos, `factura:${f.id}`, tk.plan || null, f.id, pagoDeFactura(f), sub?.id || fila.id || null, periodoDeFactura(f) || fila.periodo_fin || null, fila.product_id,
  `Abono de tu ${nombre} · pagaste ${pesos(f.amount_paid ?? f.total)}`);
  return r.meta.changes ? { email, centavos: tk.bono_centavos, factura: f.id } : null;
}

/**
 * Reembolso (total o parcial) o contracargo del cobro de una factura del Toolkit: se resta del saldo lo que ese pago abonó
 * (proporcional si el reembolso es parcial). El saldo nunca queda negativo: lo que no alcance queda en toolkit_revisar para
 * revisión manual. Idempotente por factura y monto. pagoId = PaymentIntent; monto / reembolsado = del cargo (centavos).
 */
export async function reembolsoToolkit(env, pagoId, { monto = null, reembolsado = null } = {}) {
  if (!pagoId) return null;
  const a = await one(env, "SELECT * FROM toolkit_movimientos WHERE pago_id = ? AND tipo = 'abono' ORDER BY id LIMIT 1", pagoId);
  if (!a) return null;
  const objetivo = monto > 0 && reembolsado != null ? Math.min(a.centavos, Math.round(a.centavos * Math.min(reembolsado, monto) / monto)) : a.centavos;
  const hecho = (await one(env, "SELECT COALESCE(SUM(-centavos), 0) n FROM toolkit_movimientos WHERE tipo = 'reembolso' AND factura_id = ?", a.factura_id)).n
    + (await one(env, 'SELECT COALESCE(SUM(faltante_centavos), 0) n FROM toolkit_revisar WHERE factura_id = ?', a.factura_id)).n;
  const falta = objetivo - hecho;
  if (falta <= 0) return { ya: true, aplicado: 0, faltante: 0 };
  const clave = `reembolso:${a.factura_id}:${objetivo}`;
  const r = await run(env, `INSERT OR IGNORE INTO toolkit_movimientos (email, tipo, centavos, clave, factura_id, pago_id, suscripcion_id, nota)
    SELECT ?, 'reembolso', -MIN(?, MAX(0, (${SQL_SALDO}))), ?, ?, ?, ?, ?`,
  a.email, falta, a.email, clave, a.factura_id, pagoId, a.suscripcion_id, objetivo < a.centavos ? 'Reembolso parcial de un pago de tu Toolkit' : 'Reembolso de un pago de tu Toolkit');
  if (!r.meta.changes) return { ya: true, aplicado: 0, faltante: 0 };
  const aplicado = -(await one(env, 'SELECT centavos FROM toolkit_movimientos WHERE clave = ?', clave)).centavos;
  const faltante = falta - aplicado;
  if (faltante > 0) {
    await run(env, 'INSERT OR IGNORE INTO toolkit_revisar (email, factura_id, clave, faltante_centavos, nota) VALUES (?, ?, ?, ?, ?)', a.email, a.factura_id, clave, faltante,
      `Se reembolsó un pago que abonó ${pesos(a.centavos)}; solo había ${pesos(aplicado)} de saldo para restar. Faltan ${pesos(faltante)} (ya se habían usado).`);
    console.error('ALERTA toolkit: reembolso mayor que el saldo', correoOculto(a.email), a.factura_id, faltante);
  }
  return { aplicado, faltante };
}

// ---------- qué se puede pagar con saldo ----------
// El plan mensual a la venta de una app (su precio de lista es el de cada mes pagado con saldo)
export async function planMensualApp(env, app) {
  const r = await one(env, `SELECT p.* FROM products p WHERE ${VENDIBLE} AND p.creador_id IS NULL AND json_extract(p.contenido, '$.acceso.app') = ?
      AND json_extract(p.contenido, '$.suscripcion.intervalo') = 'month' AND COALESCE(json_extract(p.contenido, '$.complemento'), 0) = 0
    ORDER BY (p.slug = ?) DESC, p.orden LIMIT 1`, app, `${app}-mensual`);
  return r && { ...r, contenido: jsonDe(r.contenido) };
}

/**
 * ¿Cómo se paga este producto con saldo? para: 'compra' (para sí) o 'codigos' (códigos de regalo).
 * → { tipo: 'producto', p, precio, nombre } · { tipo: 'app', app, plan, precio, nombre } · { error }
 */
export async function destinoSaldo(env, p, { email = null, para = 'compra' } = {}) {
  if (!p) return { error: 'Este producto no está disponible.' };
  const c = p.contenido || {};
  if (c.acceso?.app === APP) return { error: para === 'codigos' ? 'No se pueden sacar códigos del Toolkit.' : 'El Toolkit no se puede pagar con saldo.' };
  if (p.creador_id) return { error: EXCLUIDO_CREADOR, excluido: 'creador' };
  if (c.complemento) return { error: 'Este complemento se agrega desde su app: con saldo se paga el plan.' };
  if (c.suscripcion) {
    const app = c.acceso?.app;
    if (app === 'agenda-vuelve') return { error: 'El paquete Agenda + Vuelve no se paga con saldo: paga un mes de Agenda y otro de Vuelve.' };
    if (!APPS_SALDO.includes(app)) return { error: 'Este plan no se puede pagar con saldo.' };
    const plan = await planMensualApp(env, app);
    if (!plan) return { error: `Por ahora ${NOMBRE_APP_SALDO[app]} no se puede pagar con saldo.` };
    return { tipo: 'app', app, plan, precio: plan.precio_centavos, nombre: `1 mes de ${NOMBRE_APP_SALDO[app]}` };
  }
  if (['intento', 'examen'].includes(c.acceso?.tipo)) {
    if (para === 'codigos') return { error: 'Los simulacros y exámenes adicionales solo le sirven a quien ya tiene el simulador: no se pueden sacar como código de regalo.' };
    if (!(await puedeComprarIntento(env, email, c.acceso.app))) return { error: `Para comprar simulacros adicionales primero necesitas el ${simuladorDe(c.acceso.app)?.titulo || 'simulador'} con el correo de tu cuenta.` };
  }
  if (!(p.precio_centavos > 0)) return { error: 'Este producto no se paga con saldo.' };
  return { tipo: 'producto', p, precio: p.precio_centavos, nombre: p.nombre };
}

// ---------- cargos ----------
const stmtCargo = (env, { email, tipo, centavos, clave, order_id = null, product_id = null, cantidad = null, nota }) =>
  env.DB.prepare(`INSERT INTO toolkit_movimientos (email, tipo, centavos, clave, order_id, product_id, cantidad, nota)
    SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (${SQL_SALDO}) >= ?`).bind(email, tipo, -centavos, clave, order_id, product_id, cantidad, String(nota || '').slice(0, 160), email, centavos);

// Orden de $0 pagada con saldo (proveedor 'saldo') + su renglón, condicionadas a `cond` (SQL que debe ser verdadero)
function stmtsOrden(env, { id, email, nombre, p, cantidad = 1, intervalo = null, paid_at, saldo_centavos = 0, codigo = null }, cond, condBinds) {
  const ahora = ahoraISO();
  return [
    env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, estado, proveedor, provider_session_id, metodo_pago, regalo, paid_at, saldo_centavos, toolkit_codigo, created_at, updated_at)
      SELECT ?, ?, ?, 0, ?, 'paid', 'saldo', ?, 'saldo', 0, ?, ?, ?, ?, ? WHERE ${cond}`)
      .bind(id, email, nombre, p.moneda || 'MXN', `saldo:${id}`, paid_at, saldo_centavos, codigo, ahora, ahora, ...condBinds),
    env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad, intervalo) SELECT ?, ?, ?, 0, ?, ? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)')
      .bind(id, p.id, p.nombre, cantidad, intervalo, id),
  ];
}

// Después de crear la orden: analítica y la entrega de siempre (mismos correos y accesos). Si el correo falla, la orden ya
// está pagada: queda marcada para revisar en el panel y se puede reenviar desde Vorka OS o /descargas/reenviar.
async function despuesDeOrden(env, id, product_id) {
  await registrarAnalitica(env, 'purchase', { product_id, order_id: id }).catch(() => {});
  try { await entregar(env, id); return true; }
  catch (e) {
    console.error('toolkit: entrega falló', id, e.message);
    await run(env, 'UPDATE orders SET revisar = ? WHERE id = ?', `Pagada con saldo del Toolkit, pero la entrega falló: ${String(e.message).slice(0, 160)}. Usa Reenviar.`, id);
    return false;
  }
}

const faltaTexto = (saldo, total) => `Te faltan ${pesos(total - saldo)} de saldo: tienes ${pesos(saldo)} y esto cuesta ${pesos(total)}. Por ahora no se puede combinar saldo con tarjeta.`;

// Cuándo empieza un mes de app pagado con saldo: hoy, o al terminar la cortesía o la suscripción vigente (lo que sea después)
export async function inicioMesesApp(env, email, app) {
  const s = await vigente(env, email, app), c = await cortesiaApp(env, email, app);
  const desde = [ahoraISO(), s?.periodo_fin, c?.vigente ? c.periodo_fin : null].filter(Boolean).sort().at(-1);
  return { desde, stripe: s ? { periodo_fin: s.periodo_fin, renueva: !s.cancelar_al_final, paquete: s.app !== app ? s.app : null } : null, cortesia_hasta: c?.vigente ? c.periodo_fin : null };
}
const avisoRenueva = (app, ini) => ini.stripe?.renueva
  ? `Tu suscripción de ${NOMBRE_APP_SALDO[app]} se renueva sola el ${fechaMx(ini.stripe.periodo_fin)}: el mes pagado con saldo empieza cuando termine. Para no pagar doble, cancela la renovación desde la app (Cuenta o Ajustes).`
  : null;

/**
 * Cotización (sin cobrar): ¿alcanza el saldo para este producto? Lo usa el botón «Pagar con mi saldo» de cada página.
 */
export async function cotizar(env, email, slug) {
  const est = await estadoToolkit(env, email);
  const p = slug ? await productoPorSlug(env, slug) : null;
  const d = await destinoSaldo(env, p, { email });
  if (d.error) return { ok: false, error: d.error, excluido: d.excluido || null, saldo_centavos: est.saldo_centavos, usable: est.usable };
  const r = { ok: true, tipo: d.tipo, nombre: d.nombre, total: d.precio, saldo_centavos: est.saldo_centavos, usable: est.usable, alcanza: est.usable && est.saldo_centavos >= d.precio,
    falta: Math.max(0, d.precio - est.saldo_centavos), email: est.email };
  if (d.tipo === 'app') { const ini = await inicioMesesApp(env, est.email, d.app); r.app = d.app; r.desde = ini.desde; r.aviso = avisoRenueva(d.app, ini); }
  return r;
}

/** Compra para sí con saldo (producto de la tienda o 1 mes de una app). → { ok, order_id, url, saldo_centavos } o { error, status } */
export async function pagarConSaldo(env, { email, nombre, slug }) {
  email = norm(email);
  const est = await estadoToolkit(env, email);
  if (!est.usable) return { error: est.tiene ? 'No tienes saldo disponible en tu Toolkit.' : 'Para pagar con saldo necesitas un Toolkit Vorka.', status: 403 };
  const p = await productoPorSlug(env, String(slug || ''));
  const d = await destinoSaldo(env, p, { email });
  if (d.error) return { error: d.error, status: 400 };
  if (d.tipo === 'app') return pagarMesesApp(env, { email, nombre, app: d.app, meses: 1 });
  if (est.saldo_centavos < d.precio) return { error: faltaTexto(est.saldo_centavos, d.precio), status: 409 };
  const id = crypto.randomUUID(), clave = `orden:${id}`;
  const [r] = await env.DB.batch([
    stmtCargo(env, { email, tipo: 'compra', centavos: d.precio, clave, order_id: id, product_id: p.id, cantidad: 1, nota: p.nombre }),
    ...stmtsOrden(env, { id, email, nombre: nombre || email, p, paid_at: ahoraISO(), saldo_centavos: d.precio }, 'EXISTS (SELECT 1 FROM toolkit_movimientos WHERE clave = ?)', [clave]),
  ]);
  if (!r.meta.changes) return { error: `Tu saldo cambió mientras pagabas (¿otra compra abierta?). ${faltaTexto(await saldoToolkit(env, email), d.precio)}`, status: 409 };
  const entregado = await despuesDeOrden(env, id, p.id);
  return { ok: true, order_id: id, entregado, url: `/tienda/gracias?order=${id}`, saldo_centavos: await saldoToolkit(env, email) };
}

/** Meses de una app pagados con saldo → orden 'saldo' que las apps ven como cortesía (cortesiaApp / suscripcionApp). */
export async function pagarMesesApp(env, { email, nombre, app, meses = 1 }) {
  email = norm(email);
  meses = Math.trunc(Number(meses));
  if (!APPS_SALDO.includes(app)) return { error: 'Elige una app.', status: 400 };
  if (!(meses >= 1 && meses <= MAX_MESES)) return { error: `Elige de 1 a ${MAX_MESES} meses.`, status: 400 };
  const est = await estadoToolkit(env, email);
  if (!est.usable) return { error: est.tiene ? 'No tienes saldo disponible en tu Toolkit.' : 'Para pagar con saldo necesitas un Toolkit Vorka.', status: 403 };
  const plan = await planMensualApp(env, app);
  if (!plan) return { error: `Por ahora ${NOMBRE_APP_SALDO[app]} no se puede pagar con saldo.`, status: 400 };
  const total = plan.precio_centavos * meses;
  if (est.saldo_centavos < total) return { error: faltaTexto(est.saldo_centavos, total), status: 409 };
  const ini = await inicioMesesApp(env, email, app);
  const id = crypto.randomUUID(), clave = `orden:${id}`;
  const [r] = await env.DB.batch([
    stmtCargo(env, { email, tipo: 'app', centavos: total, clave, order_id: id, product_id: plan.id, cantidad: meses, nota: `${meses === 1 ? '1 mes' : `${meses} meses`} de ${NOMBRE_APP_SALDO[app]}` }),
    ...stmtsOrden(env, { id, email, nombre: nombre || email, p: plan, cantidad: meses, intervalo: 'month', paid_at: ini.desde, saldo_centavos: total }, 'EXISTS (SELECT 1 FROM toolkit_movimientos WHERE clave = ?)', [clave]),
  ]);
  if (!r.meta.changes) return { error: `Tu saldo cambió mientras pagabas. ${faltaTexto(await saldoToolkit(env, email), total)}`, status: 409 };
  const entregado = await despuesDeOrden(env, id, plan.id);
  const hasta = finCortesia(ini.desde, 'month', meses);
  return { ok: true, order_id: id, entregado, app, desde: ini.desde, hasta, aviso: avisoRenueva(app, ini), url: `/tienda/mi-toolkit/?v=apps&listo=${encodeURIComponent(app)}`, saldo_centavos: await saldoToolkit(env, email) };
}

// ---------- códigos de regalo ----------
// TK-XXXX-XXXX, sin 0/O/1/I/L (31 símbolos, 31^8 combinaciones)
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PATRON_CODIGO = /^TK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const esCodigoToolkit = c => PATRON_CODIGO.test(String(c || '').trim().toUpperCase());
function nuevoCodigo() {
  const b = crypto.getRandomValues(new Uint8Array(16)), s = [];
  for (const x of b) { if (x < 248) s.push(ALFABETO[x % 31]); if (s.length === 8) break; }
  while (s.length < 8) s.push(ALFABETO[crypto.getRandomValues(new Uint8Array(1))[0] % 31]);
  return `TK-${s.slice(0, 4).join('')}-${s.slice(4).join('')}`;
}

/** Saca `cantidad` códigos de un solo uso del 100 % para UN producto, descontando su precio de lista del saldo. */
export async function sacarCodigos(env, { email, slug, cantidad }) {
  email = norm(email);
  cantidad = Math.trunc(Number(cantidad));
  if (!(cantidad >= 1 && cantidad <= MAX_CODIGOS)) return { error: `Elige de 1 a ${MAX_CODIGOS} códigos por tanda.`, status: 400 };
  const est = await estadoToolkit(env, email);
  if (!est.usable) return { error: est.tiene ? 'No tienes saldo disponible en tu Toolkit.' : 'Para sacar códigos necesitas un Toolkit Vorka.', status: 403 };
  const p = await productoPorSlug(env, String(slug || ''));
  const d = await destinoSaldo(env, p, { email, para: 'codigos' });
  if (d.error) return { error: d.error, status: 400 };
  const prod = d.tipo === 'app' ? d.plan : p, total = d.precio * cantidad;
  if (est.saldo_centavos < total) return { error: faltaTexto(est.saldo_centavos, total), status: 409 };
  for (let intento = 0; intento < 3; intento++) {
    const clave = `codigos:${crypto.randomUUID()}`, codigos = [...new Set(Array.from({ length: cantidad }, nuevoCodigo))];
    if (codigos.length !== cantidad) continue;
    try {
      const [r] = await env.DB.batch([
        stmtCargo(env, { email, tipo: 'codigos', centavos: total, clave, product_id: prod.id, cantidad, nota: `${cantidad === 1 ? '1 código' : `${cantidad} códigos`} de regalo · ${d.nombre}` }),
        ...codigos.map(c => env.DB.prepare(`INSERT INTO toolkit_codigos (codigo, email, movimiento, product_id, producto, precio_centavos)
          SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM toolkit_movimientos WHERE clave = ?)`).bind(c, email, clave, prod.id, d.nombre, d.precio, clave)),
      ]);
      if (!r.meta.changes) return { error: `Tu saldo cambió mientras pagabas. ${faltaTexto(await saldoToolkit(env, email), total)}`, status: 409 };
      return { ok: true, codigos, producto: d.nombre, total, saldo_centavos: await saldoToolkit(env, email) };
    } catch (e) {
      if (!/UNIQUE|constraint/i.test(e.message)) throw e;   // un código repetido (rarísimo): otra tanda nueva, todo o nada
    }
  }
  throw new Error('No se pudieron generar los códigos. Intenta de nuevo.');
}

const estadoCodigo = c => c.usado_at ? 'usado' : c.devuelto_at ? 'devuelto' : 'disponible';
export async function codigosDe(env, email, { limite = 200 } = {}) {
  return (await all(env, 'SELECT codigo, producto, precio_centavos, usado_at, devuelto_at, created_at FROM toolkit_codigos WHERE email = ? ORDER BY created_at DESC, codigo LIMIT ?', norm(email), limite))
    .map(c => ({ ...c, estado: estadoCodigo(c) }));
}

/**
 * «Devolver a mi saldo» un código que nadie ha usado: se anula (ya no se puede canjear) y se abona el precio de lista que se
 * pagó por él. Atómico contra un canje simultáneo: los dos UPDATE piden usado_at y devuelto_at vacíos y solo uno gana; el
 * abono solo se inserta si el código quedó devuelto en este mismo batch (y su clave es única por código).
 */
export async function devolverCodigo(env, { email, codigo }) {
  email = norm(email);
  const c = String(codigo || '').trim().toUpperCase();
  if (!PATRON_CODIGO.test(c)) return { error: 'Ese código no existe.', status: 404 };
  const f = await one(env, 'SELECT * FROM toolkit_codigos WHERE codigo = ? AND email = ?', c, email);
  if (!f) return { error: 'Ese código no es de tu Toolkit.', status: 404 };
  if (f.usado_at) return { error: 'Este código ya se usó: no se puede devolver.', status: 409 };
  if (f.devuelto_at) return { error: 'Este código ya se devolvió a tu saldo.', status: 409 };
  const ahora = ahoraISO();
  const [u] = await env.DB.batch([
    env.DB.prepare('UPDATE toolkit_codigos SET devuelto_at = ? WHERE codigo = ? AND email = ? AND usado_at IS NULL AND devuelto_at IS NULL').bind(ahora, c, email),
    env.DB.prepare(`INSERT OR IGNORE INTO toolkit_movimientos (email, tipo, centavos, clave, product_id, cantidad, nota)
      SELECT ?, 'devolucion', ?, ?, ?, 1, ? WHERE EXISTS (SELECT 1 FROM toolkit_codigos WHERE codigo = ? AND devuelto_at = ? AND usado_at IS NULL)`)
      .bind(email, f.precio_centavos, `devolucion:${c}`, f.product_id, `Devolviste el código ${c} · ${f.producto}`.slice(0, 160), c, ahora),
  ]);
  if (!u.meta.changes) return { error: 'Este código ya se usó o ya se devolvió.', status: 409 };
  return { ok: true, codigo: c, centavos: f.precio_centavos, saldo_centavos: await saldoToolkit(env, email) };
}

// Lo que ve quien abre la liga de un código (sin datos de quien lo sacó)
export async function leerCodigo(env, codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!PATRON_CODIGO.test(c)) return null;
  const f = await one(env, `SELECT k.codigo, k.producto, k.usado_at, k.devuelto_at, k.product_id, p.descripcion_corta, p.imagen, p.contenido, p.slug,
      (SELECT 1 FROM products v WHERE v.id = k.product_id AND ${VENDIBLE.replace(/\bp\./g, 'v.')}) vendible FROM toolkit_codigos k JOIN products p ON p.id = k.product_id WHERE k.codigo = ?`, c);
  return f && { ...f, estado: estadoCodigo(f), vendible: !!f.vendible, contenido: jsonDe(f.contenido) };
}

/** Canje de un código (cualquier persona, con o sin cuenta): orden de $0 a su nombre y la entrega de siempre. */
export async function canjearCodigo(env, { codigo, nombre, email }) {
  email = norm(email);
  const f = await leerCodigo(env, codigo);
  if (!f) return { error: 'Ese código no existe. Revisa que lo hayas escrito completo (TK-XXXX-XXXX).', status: 404 };
  if (f.estado === 'usado') return { error: 'Este código ya se usó: cada código funciona una sola vez.', status: 410 };
  if (f.estado === 'devuelto') return { error: 'Este código ya no es válido: quien lo sacó lo canceló. Pídele uno nuevo.', status: 410 };
  if (!f.vendible) return { error: 'Este producto ya no está a la venta. Escríbenos a hola@vorka.mx con tu código y lo resolvemos.', status: 410 };
  const p = await one(env, 'SELECT * FROM products WHERE id = ?', f.product_id);
  const c = f.contenido, app = c.acceso?.app;
  const esApp = !!c.suscripcion && APPS_SALDO.includes(app);
  const ahora = ahoraISO(), id = crypto.randomUUID();
  const ini = esApp ? await inicioMesesApp(env, email, app) : null;
  const [u, o] = await env.DB.batch([
    env.DB.prepare('UPDATE toolkit_codigos SET usado_at = ?, usado_email = ?, order_id = ? WHERE codigo = ? AND usado_at IS NULL AND devuelto_at IS NULL').bind(ahora, email, id, f.codigo),
    ...stmtsOrden(env, { id, email, nombre, p, cantidad: 1, intervalo: esApp ? 'month' : null, paid_at: ini?.desde || ahora, codigo: f.codigo },
      'EXISTS (SELECT 1 FROM toolkit_codigos WHERE codigo = ? AND order_id = ?)', [f.codigo, id]),
  ]);
  if (!u.meta.changes || !o.meta.changes) return { error: 'Este código ya se usó: cada código funciona una sola vez.', status: 410 };
  const entregado = await despuesDeOrden(env, id, p.id);
  return { ok: true, order_id: id, entregado, producto: f.producto, app: esApp ? app : null, hasta: esApp ? finCortesia(ini.desde, 'month', 1) : null, aviso: esApp ? avisoRenueva(app, ini) : null };
}

// ---------- historial y portal ----------
export const movimientosDe = (env, email, limite = 60) =>
  all(env, 'SELECT tipo, centavos, nota, created_at FROM toolkit_movimientos WHERE email = ? ORDER BY id DESC LIMIT ?', norm(email), limite);
export const portalToolkit = (env, email) => portalApp(env, norm(email), APP, `${env.SITE_URL || 'https://vorka.mx'}/tienda/mi-toolkit/`);

// ---------- Vorka OS › Tienda (RPC Admin.resumenToolkit) ----------
// Suscriptores activos por plan, saldo pendiente (pasivo; el saldo nunca vence, solo baja al usarse; los códigos devueltos
// restan de lo usado), lo abonado y lo usado en el mes (hora del centro de México), y por
// cliente cuánto gastaba al mes antes de suscribirse (órdenes pagadas de los 3 meses previos, promedio) contra cuánto
// consume ahora a precio de lista (cargos de saldo por mes). Indicador clave: consumir ≥ 50 % más que antes (×1.5).
const TZ_OFF = 6 * 3600e3;   // CDMX es UTC−6 todo el año
const inicioMes = mes => `${mes}-01T06:00:00.000Z`;
const mesSig = mes => { const [a, m] = mes.split('-').map(Number); return new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 7); };
export const META_CONSUMO = 1.5;
export async function resumenToolkit(env, { mes } = {}) {
  const hoyMes = new Date(Date.now() - TZ_OFF).toISOString().slice(0, 7);
  mes = /^\d{4}-\d{2}$/.test(String(mes || '')) && mes <= hoyMes ? mes : hoyMes;
  const desde = inicioMes(mes), hasta = inicioMes(mesSig(mes));
  const planes = await all(env, `SELECT p.id, p.nombre, p.precio_centavos, json_extract(p.contenido, '$.toolkit.bono_centavos') bono,
      (SELECT COUNT(DISTINCT s.email) FROM suscripciones s WHERE s.app = 'toolkit' AND s.product_id = p.id AND s.estado IN (${VIGENTES.map(() => '?').join(',')})) activos,
      (SELECT COUNT(DISTINCT s.email) FROM suscripciones s WHERE s.app = 'toolkit' AND s.product_id = p.id AND s.estado IN (${VIGENTES.map(() => '?').join(',')}) AND s.cancelar_al_final = 1) por_cancelar
    FROM products p WHERE json_extract(p.contenido, '$.acceso.app') = 'toolkit' ORDER BY p.precio_centavos`, ...VIGENTES, ...VIGENTES);
  const sum = (sql, ...a) => one(env, sql, ...a).then(x => x?.n || 0);
  const pasivo = await sum('SELECT COALESCE(SUM(centavos), 0) n FROM toolkit_movimientos');
  const abonado = await sum("SELECT COALESCE(SUM(centavos), 0) n FROM toolkit_movimientos WHERE tipo = 'abono' AND created_at >= ? AND created_at < ?", desde, hasta);
  const usado = await sum("SELECT COALESCE(SUM(-centavos), 0) n FROM toolkit_movimientos WHERE tipo IN ('compra', 'app', 'codigos', 'devolucion') AND created_at >= ? AND created_at < ?", desde, hasta);
  const porTipo = await all(env, "SELECT tipo, COUNT(*) n, COALESCE(SUM(-centavos), 0) centavos FROM toolkit_movimientos WHERE tipo IN ('compra', 'app', 'codigos', 'devolucion') AND created_at >= ? AND created_at < ? GROUP BY tipo", desde, hasta);

  // Clientes: todo correo que ya recibió un abono
  const filas = await all(env, `SELECT m.email, MIN(m.created_at) desde, COALESCE(SUM(m.centavos), 0) saldo,
      (SELECT COALESCE(SUM(-x.centavos), 0) FROM toolkit_movimientos x WHERE x.email = m.email AND x.tipo IN ('compra', 'app', 'codigos', 'devolucion')) consumo,
      (SELECT COALESCE(SUM(x.centavos), 0) FROM toolkit_movimientos x WHERE x.email = m.email AND x.tipo = 'abono') abonos
    FROM toolkit_movimientos m WHERE EXISTS (SELECT 1 FROM toolkit_movimientos a WHERE a.email = m.email AND a.tipo = 'abono') GROUP BY m.email`);
  const ahora = Date.now();
  const clientes = [];
  for (const f of filas) {
    const ini = Date.parse(f.desde), antesDesde = new Date(ini - 90 * DIA).toISOString();
    // Antes: lo que pagó en la tienda los 3 meses previos (órdenes pagadas con dinero, sin regalos, cortesías, saldo ni el propio Toolkit)
    const antes = await sum(`SELECT COALESCE(SUM(o.monto_centavos), 0) n FROM orders o WHERE lower(o.email) = ? AND o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia', 'saldo')
        AND o.paid_at >= ? AND o.paid_at < ? AND NOT EXISTS (SELECT 1 FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = o.id AND json_extract(p.contenido, '$.acceso.app') = 'toolkit')`,
    f.email, antesDesde, f.desde);
    const meses = Math.max(1, (ahora - ini) / (30.44 * DIA));
    const antesMes = Math.round(antes / 3), ahoraMes = Math.round(f.consumo / meses);
    const s = await one(env, "SELECT s.estado, s.cancelar_al_final, p.nombre FROM suscripciones s LEFT JOIN products p ON p.id = s.product_id WHERE s.email = ? AND s.app = 'toolkit' ORDER BY s.updated_at DESC LIMIT 1", f.email);
    clientes.push({ email: f.email, plan: s?.nombre || null, estado: s?.estado || null, por_cancelar: !!s?.cancelar_al_final, desde: f.desde, meses: Math.round(meses * 10) / 10,
      saldo_centavos: f.saldo, abonado_centavos: f.abonos, consumo_total_centavos: f.consumo,
      antes_mensual_centavos: antesMes, ahora_mensual_centavos: ahoraMes,
      razon: antesMes > 0 ? Math.round(ahoraMes / antesMes * 100) / 100 : null,
      cumple: antesMes > 0 ? ahoraMes >= antesMes * META_CONSUMO : null });
  }
  clientes.sort((a, b) => b.ahora_mensual_centavos - a.ahora_mensual_centavos);
  const conAntes = clientes.filter(c => c.antes_mensual_centavos > 0);
  const tA = conAntes.reduce((s, c) => s + c.antes_mensual_centavos, 0), tH = conAntes.reduce((s, c) => s + c.ahora_mensual_centavos, 0);
  return {
    mes, meta: META_CONSUMO,
    planes: planes.map(p => ({ product_id: p.id, nombre: p.nombre, precio_centavos: p.precio_centavos, bono_centavos: p.bono, activos: p.activos, por_cancelar: p.por_cancelar })),
    activos: planes.reduce((s, p) => s + p.activos, 0),
    pasivo_centavos: pasivo, abonado_mes_centavos: abonado, usado_mes_centavos: usado,
    usado_por_tipo: Object.fromEntries(porTipo.map(t => [t.tipo, { n: t.n, centavos: t.centavos }])),
    indicador: { clientes_con_historial: conAntes.length, clientes_nuevos: clientes.length - conAntes.length,
      antes_mensual_centavos: tA, ahora_mensual_centavos: tH, razon: tA > 0 ? Math.round(tH / tA * 100) / 100 : null,
      cumplen: conAntes.filter(c => c.cumple).length },
    clientes,
    revisar: await all(env, 'SELECT id, email, factura_id, faltante_centavos, nota, created_at FROM toolkit_revisar WHERE resuelto_at IS NULL ORDER BY id DESC LIMIT 50'),
  };
}
