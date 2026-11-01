// Suscripciones (Stripe Billing) para apps que se cobran cada mes o cada año, como Vuelve y Agenda.
// - El checkout de siempre (/api/checkout) detecta los productos con contenido.suscripcion y abre Stripe en modo suscripción.
// - La primera compra queda como orden normal (paid → correo con el botón para entrar a la app).
// - Las renovaciones, fallas de pago y cancelaciones llegan por webhook y solo actualizan la tabla suscripciones.
// - RPC para Vorka OS: suscripcionApp (¿está al corriente este correo?), portalApp (liga al portal de Stripe para
//   cambiar tarjeta o cancelar), lugaresApp (cuántos complementos: sucursales o profesionales) y resumenSuscripciones
//   (MRR y estados para Diversificación).
// - Paquetes: una sola suscripción que abre varias apps con el mismo correo (Agenda + Vuelve). Se guarda con su propia app
//   ('agenda-vuelve') y cuenta como suscripción de cada una (ver PAQUETES y appsQueCubren).
// - Cortesías: un acceso regalado desde Vorka OS (Tienda › Regalar) a un plan de suscripción es una orden de $0 (proveedor
//   'cortesia', regalo = 0, o el canje de una liga de cortesía) y NO crea nada en Stripe. suscripcionApp la toma en cuenta
//   cuando no hay suscripción vigente en Stripe (ver cortesiaApp): dura cantidad × el intervalo del plan desde que se dio.
import { one, all, run, ahoraISO } from './util.js';
import { llamar } from './pagos/stripe.js';

// Estados de Stripe que dan acceso. past_due: Stripe sigue reintentando el cobro (días de gracia)
export const VIGENTES = ['active', 'trialing', 'past_due'];

export const suscripcionDe = p => p?.contenido?.suscripcion || null;

// Paquetes: la app con la que se guarda la suscripción → las apps que abre. Así Vuelve y Agenda ven como suya la
// suscripción del paquete (y no se puede comprar una app suelta encima de un paquete con el mismo correo).
export const PAQUETES = { 'agenda-vuelve': ['agenda', 'vuelve'] };
export const appsQueCubren = app => [app, ...Object.keys(PAQUETES).filter(k => k !== app && PAQUETES[k].includes(app))];
const enApps = app => { const a = appsQueCubren(app); return { sql: `app IN (${a.map(() => '?').join(',')})`, a }; };

// Complementos del plan por tipo: { profesional: <id>, sucursal: <id> }. Vuelve los guarda como "extra" (= sucursal).
export const extrasDe = s => s?.extras || (s?.extra ? { sucursal: s.extra } : {});

// Renglones de la compra: el plan (1) + sus complementos del mismo intervalo (sucursales de Vuelve, profesionales de Agenda)
export async function itemsSuscripcion(env, plan, cantidades = {}) {
  const extras = extrasDe(suscripcionDe(plan));
  const items = [{ slug: plan.slug, cantidad: 1 }];
  for (const [tipo, n] of Object.entries(cantidades)) {
    if (!(n > 0)) continue;
    const extra = extras[tipo] && await one(env, 'SELECT slug FROM products WHERE id = ?', extras[tipo]);
    if (!extra) throw new Error(tipo);
    items.push({ slug: extra.slug, cantidad: n });
  }
  return items;
}

// ¿La orden es de suscripción? Devuelve { intervalo, app, product_id, creador_id } leyendo los productos de la base (nunca
// del navegador). Producto de creador con precio mensual y anual: el intervalo es el que se eligió (order_items.intervalo).
export async function suscripcionDeOrden(env, orden) {
  for (const it of orden.items || []) {
    const r = await one(env, 'SELECT contenido, creador_id FROM products WHERE id = ?', it.product_id);
    let c; try { c = JSON.parse(r?.contenido || '{}'); } catch { c = {}; }
    if (c.suscripcion && !c.complemento) {
      const intervalo = r?.creador_id && ['month', 'year'].includes(it.intervalo) ? it.intervalo : c.suscripcion.intervalo === 'year' ? 'year' : 'month';
      return { intervalo, app: c.acceso?.app || null, product_id: it.product_id, creador_id: r?.creador_id || null };
    }
  }
  return null;
}

// La suscripción vigente EN STRIPE de un correo para una app: la suya o la de un paquete que la incluye. No cuenta cortesías a
// propósito: quien usa esto necesita una suscripción real (no comprar dos veces, cambiar complementos, dar crédito, cancelar).
export function vigente(env, email, app) {
  const x = enApps(app);
  return one(env, `SELECT * FROM suscripciones WHERE email = ? AND ${x.sql} AND estado IN (${VIGENTES.map(() => '?').join(',')}) ORDER BY periodo_fin DESC LIMIT 1`,
    String(email || '').trim().toLowerCase(), ...x.a, ...VIGENTES);
}

// ---------- cortesías de apps por suscripción ----------
// Fin del acceso: n periodos (meses o años) desde que se dio. Si el día no existe en el mes final (31 → febrero), el último del mes.
export function finCortesia(desde, intervalo, n = 1) {
  const d = new Date(desde), dia = d.getUTCDate(), meses = (intervalo === 'year' ? 12 : 1) * Math.max(1, Math.trunc(Number(n) || 1));
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  d.setUTCDate(Math.min(dia, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d.toISOString();
}
const fechaMx = iso => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric' });

// Órdenes de cortesía pagadas (no quitadas) de planes de suscripción de esas apps; sin correo, las de todos (para el resumen).
// Cuentan las enviadas directo a un correo y los canjes de ligas de cortesía (las suscripciones no se pueden comprar para regalar,
// así que un canje de un plan de suscripción siempre viene de una cortesía; igual se revisa).
async function filasCortesia(env, apps, email = null) {
  const filas = await all(env, `SELECT o.id, o.email, COALESCE(o.paid_at, o.created_at) desde, i.cantidad, i.intervalo, p.contenido
    FROM orders o JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
    WHERE o.estado = 'paid' AND o.regalo = 0 AND o.monto_centavos = 0${email ? ' AND lower(o.email) = ?' : ''}
      AND (o.proveedor = 'cortesia' OR (o.proveedor = 'regalo' AND EXISTS (SELECT 1 FROM orders c WHERE c.id = o.regalo_de AND c.proveedor = 'cortesia')))
      AND json_extract(p.contenido, '$.acceso.app') IN (${apps.map(() => '?').join(',')})
      AND json_extract(p.contenido, '$.suscripcion') IS NOT NULL AND COALESCE(json_extract(p.contenido, '$.complemento'), 0) = 0`,
    ...(email ? [email] : []), ...apps);
  const ahora = Date.now();
  return filas.map(f => {
    let c; try { c = JSON.parse(f.contenido || '{}'); } catch { c = {}; }
    const intervalo = ['month', 'year'].includes(f.intervalo) ? f.intervalo : c.suscripcion?.intervalo === 'year' ? 'year' : 'month';
    const periodo_fin = finCortesia(f.desde, intervalo, f.cantidad);
    return { order_id: f.id, email: String(f.email || '').toLowerCase(), app: c.acceso?.app, intervalo, periodo_fin, vigente: Date.parse(periodo_fin) > ahora };
  });
}

// La cortesía de un correo para una app (o un paquete que la incluye), con la misma forma que suscripcionApp: la vigente que
// dura más o, si ya no hay vigente, la última que venció (estado 'canceled'). null si nunca tuvo. No se renueva ni se cobra:
// cancelar_al_final siempre es true y no tiene complementos.
export async function cortesiaApp(env, email, app) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !app) return null;
  const l = (await filasCortesia(env, appsQueCubren(app), email)).sort((a, b) => (b.vigente - a.vigente) || b.periodo_fin.localeCompare(a.periodo_fin));
  const c = l[0];
  if (!c) return null;
  return { id: `cortesia_${c.order_id}`, estado: c.vigente ? 'active' : 'canceled', vigente: c.vigente, intervalo: c.intervalo, periodo_fin: c.periodo_fin,
    cancelar_al_final: true, sucursales: 0, profesionales: 0, monto_centavos: 0, paquete: c.app !== app ? c.app : null, cortesia: true, order_id: c.order_id };
}

// ---------- webhook ----------
const segISO = s => (s ? new Date(s * 1000).toISOString() : null);

// Suscripción de Stripe (con items.data.price.product expandido) → renglón de la tabla
export async function guardarSuscripcion(env, sub) {
  const items = sub.items?.data || [];
  const meta = sub.metadata || {};
  const idDe = it => (typeof it.price?.product === 'object' ? it.price.product.metadata?.product_id : null);
  let plan = meta.product_id || null, sucursales = 0, profesionales = 0, monto = 0;
  for (const it of items) {
    const pid = idDe(it);
    monto += (it.price?.unit_amount || 0) * (it.quantity || 1);
    if (!pid) continue;
    const r = await one(env, 'SELECT contenido FROM products WHERE id = ?', pid);
    let c; try { c = JSON.parse(r?.contenido || '{}'); } catch { c = {}; }
    // Complementos: los profesionales de Agenda y las sucursales de Vuelve se cuentan por separado
    if (c.complemento && c.acceso?.tipo === 'profesional') profesionales += it.quantity || 1;
    else if (c.complemento) sucursales += it.quantity || 1;
    else if (!plan) plan = pid;
  }
  const orden = meta.order_id ? await one(env, 'SELECT email FROM orders WHERE id = ?', meta.order_id) : null;
  const email = String(meta.email || orden?.email || '').trim().toLowerCase();
  const app = meta.app || null;
  if (!email || !app || !plan) { console.error('suscripción sin datos', sub.id); return null; }
  // Desde la API 2025-03-31 el periodo vive en cada item; antes, en la suscripción
  const fin = items[0]?.current_period_end ?? sub.current_period_end;
  // De qué creador es (si es un SaaS de creador): siempre de la base, nunca de la metadata
  const creador = await one(env, 'SELECT creador_id FROM products WHERE id = ?', plan);
  const fila = {
    id: sub.id, email, app, product_id: plan, order_id: meta.order_id || null,
    customer_id: typeof sub.customer === 'object' ? sub.customer?.id : sub.customer || null,
    estado: sub.status, intervalo: items[0]?.price?.recurring?.interval === 'year' ? 'year' : 'month',
    periodo_fin: segISO(fin), cancelar_al_final: sub.cancel_at_period_end || sub.cancel_at ? 1 : 0, sucursales, profesionales, monto_centavos: monto,
    creador_id: creador?.creador_id || null,
    cancelada_at: sub.status === 'canceled' ? segISO(sub.ended_at || sub.canceled_at) || ahoraISO() : null,
  };
  await run(env, `INSERT INTO suscripciones (id, email, app, product_id, order_id, customer_id, estado, intervalo, periodo_fin, cancelar_al_final, sucursales, profesionales, monto_centavos, creador_id, cancelada_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT (id) DO UPDATE SET estado = excluded.estado, intervalo = excluded.intervalo, periodo_fin = excluded.periodo_fin,
      cancelar_al_final = excluded.cancelar_al_final, sucursales = excluded.sucursales, profesionales = excluded.profesionales, monto_centavos = excluded.monto_centavos,
      customer_id = COALESCE(excluded.customer_id, suscripciones.customer_id), order_id = COALESCE(suscripciones.order_id, excluded.order_id),
      creador_id = COALESCE(suscripciones.creador_id, excluded.creador_id),
      cancelada_at = CASE WHEN excluded.estado = 'canceled' THEN COALESCE(suscripciones.cancelada_at, excluded.cancelada_at) ELSE NULL END,
      updated_at = ?`,
    fila.id, fila.email, fila.app, fila.product_id, fila.order_id, fila.customer_id, fila.estado, fila.intervalo, fila.periodo_fin, fila.cancelar_al_final, fila.sucursales, fila.profesionales, fila.monto_centavos,
    fila.creador_id, fila.cancelada_at, ahoraISO());
  return fila;
}

// ---------- RPC para Vorka OS ----------
// La suscripción de un correo para una app (la vigente o, si no hay, la última). paquete: la app del paquete si viene de uno
// (p. ej. 'agenda-vuelve'). sucursales: las de Vuelve adicionales; profesionales: los de Agenda adicionales (sin el incluido).
// Orden: la suscripción vigente de Stripe (siempre gana) → una cortesía vigente → la última suscripción de Stripe → la última
// cortesía ya vencida. Una cortesía viene con cortesia: true, monto 0 y cancelar_al_final: true (ver cortesiaApp).
export async function suscripcionApp(env, email, app) {
  const x = enApps(app);
  const v = await vigente(env, email, app);
  if (v) return formaSuscripcion(v, app);
  const c = await cortesiaApp(env, email, app);
  if (c?.vigente) return c;
  const s = await one(env, `SELECT * FROM suscripciones WHERE email = ? AND ${x.sql} ORDER BY updated_at DESC LIMIT 1`, String(email || '').trim().toLowerCase(), ...x.a);
  return s ? formaSuscripcion(s, app) : c;
}
function formaSuscripcion(s, app) {
  return { id: s.id, estado: s.estado, vigente: VIGENTES.includes(s.estado), intervalo: s.intervalo, periodo_fin: s.periodo_fin,
    cancelar_al_final: !!s.cancelar_al_final, sucursales: s.sucursales, profesionales: s.profesionales || 0, monto_centavos: s.monto_centavos,
    paquete: s.app !== app ? s.app : null };
}

// Complementos de la suscripción vigente: lugares adicionales de Vuelve (sucursales o negocios extra de la misma cuenta,
// tipo 'sucursal') o profesionales adicionales de Agenda (tipo 'profesional'). Cambia en Stripe la cantidad del renglón del
// complemento (lo agrega si no existe, lo quita con 0). Stripe prorratea: la diferencia sale en la siguiente factura.
// En un paquete (Agenda + Vuelve) cada app cambia solo su propio complemento. Devuelve la suscripción ya actualizada
// (la misma forma que suscripcionApp).
export const MAX_LUGARES = 50;
const QUE = { sucursal: 'lugares adicionales', profesional: 'profesionales adicionales' };
export async function lugaresApp(env, email, app, extras, tipo = 'sucursal') {
  if (!QUE[tipo]) throw new Error('Complemento inválido.');
  extras = Math.trunc(Number(extras));
  if (!Number.isFinite(extras) || extras < 0 || extras > MAX_LUGARES) throw new Error(`Elige de 0 a ${MAX_LUGARES} ${QUE[tipo]}.`);
  const s = await vigente(env, email, app);
  if (!s) {
    // Cortesía: no hay nada que cambiar en Stripe. Quitar complementos (0) no cambia nada; agregarlos requiere suscribirse.
    const c = await cortesiaApp(env, email, app);
    if (c?.vigente && extras === 0) return c;
    if (c?.vigente) throw new Error(`Tu acceso es una cortesía de Vorka y no incluye ${QUE[tipo]}. Para agregarlos, contrata la suscripción.`);
    throw new Error('No hay una suscripción vigente con este correo.');
  }
  const plan = await one(env, 'SELECT contenido FROM products WHERE id = ?', s.product_id);
  let c; try { c = JSON.parse(plan?.contenido || '{}'); } catch { c = {}; }
  const id = extrasDe(c.suscripcion)[tipo];
  const extra = id && await one(env, 'SELECT id, nombre, precio_centavos FROM products WHERE id = ?', id);
  if (!extra) throw new Error(`Este plan no admite ${QUE[tipo]}.`);
  const sub = await llamar(env, 'GET', `/subscriptions/${encodeURIComponent(s.id)}?expand[]=items.data.price.product`);
  const renglon = (sub.items?.data || []).find(it => typeof it.price?.product === 'object' && it.price.product.metadata?.product_id === extra.id);
  const prorrateo = { proration_behavior: 'create_prorations' };
  if (renglon && extras === 0) await llamar(env, 'DELETE', `/subscription_items/${encodeURIComponent(renglon.id)}?proration_behavior=create_prorations`);
  else if (renglon) { if ((renglon.quantity || 0) !== extras) await llamar(env, 'POST', `/subscription_items/${encodeURIComponent(renglon.id)}`, { quantity: extras, ...prorrateo }); }
  else if (extras > 0) await llamar(env, 'POST', '/subscription_items', { subscription: s.id, quantity: extras, ...prorrateo,
    price_data: { currency: 'mxn', unit_amount: extra.precio_centavos, recurring: { interval: s.intervalo === 'year' ? 'year' : 'month' }, product: await productoStripe(env, extra) } });
  await guardarSuscripcion(env, await llamar(env, 'GET', `/subscriptions/${encodeURIComponent(s.id)}?expand[]=items.data.price.product`));
  return suscripcionApp(env, email, app);
}
// El producto de Stripe de un complemento (para agregarlo a una suscripción hace falta uno guardado): se crea una vez
async function productoStripe(env, p) {
  const clave = `stripe_producto:${p.id}`, ya = await one(env, 'SELECT valor FROM ajustes WHERE clave = ?', clave);
  if (ya?.valor) return ya.valor;
  const r = await llamar(env, 'POST', '/products', { name: p.nombre, metadata: { product_id: p.id } }, { idempotencia: clave });
  await run(env, 'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor', clave, r.id);
  return r.id;
}

// Liga de un solo uso al portal de clientes de Stripe (cambiar tarjeta, ver facturas, cancelar). Requiere configurarlo en el Dashboard.
export async function portalApp(env, email, app, volver) {
  if (!/^https:\/\/([a-z0-9-]+\.)*vorka\.mx\//.test(String(volver || '')) && !/^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(String(volver || ''))) throw new Error('Liga de regreso inválida');
  email = String(email || '').trim().toLowerCase();
  // Solo con cortesía (sin suscripción vigente en Stripe): no hay tarjeta ni cobro que administrar
  if (!(await vigente(env, email, app))) {
    const c = await cortesiaApp(env, email, app);
    if (c?.vigente) return { url: null, cortesia: true, hasta: c.periodo_fin,
      mensaje: `Tu acceso es una cortesía de Vorka hasta el ${fechaMx(c.periodo_fin)}; no hay nada que cancelar y no se te cobrará.` };
  }
  const x = enApps(app);
  const s = await one(env, `SELECT customer_id FROM suscripciones WHERE email = ? AND ${x.sql} AND customer_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1`, email, ...x.a)
    || await one(env, 'SELECT customer_id FROM stripe_clientes WHERE email = ?', email);
  if (!s?.customer_id) return null;
  const p = await llamar(env, 'POST', '/billing_portal/sessions', { customer: s.customer_id, return_url: volver, locale: 'es-419' });
  return { url: p.url };
}

// La app borró la cuenta de esa persona (por ejemplo, Clara › Borrar mi cuenta): ya no se le vuelve a cobrar.
// Se cancela al final del periodo que ya pagó (no hay cobro nuevo ni reembolso automático; los reembolsos siguen su política).
// Solo la suscripción propia de la app: un paquete que abre otras apps no se toca (motivo 'paquete').
export async function cancelarApp(env, email, app) {
  email = String(email || '').trim().toLowerCase();
  const s = await vigente(env, email, app);
  if (!s) {
    // Cortesía: no se cobra ni se renueva, así que no hay nada que cancelar (el acceso termina solo en su fecha)
    const c = await cortesiaApp(env, email, app);
    return c?.vigente ? { ok: true, cortesia: true, hasta: c.periodo_fin } : { ok: false, motivo: 'sin_suscripcion' };
  }
  if (s.app !== app) return { ok: false, motivo: 'paquete' };
  if (!s.cancelar_al_final) await llamar(env, 'POST', `/subscriptions/${s.id}`, { cancel_at_period_end: 'true' }, { idempotencia: `cancelar-${s.id}` });
  await run(env, 'UPDATE suscripciones SET cancelar_al_final = 1 WHERE id = ?', s.id);
  return { ok: true, hasta: s.periodo_fin };
}

// Para Diversificación: cuántas suscripciones hay en cada estado y el ingreso mensual recurrente (los planes anuales cuentan /12).
// Las cortesías no son ingreso: van aparte (cortesias = correos con una cortesía vigente de esta app y sin suscripción en Stripe).
export async function resumenSuscripciones(env, app) {
  const filas = await all(env, 'SELECT estado, intervalo, monto_centavos, cancelar_al_final, created_at FROM suscripciones WHERE app = ?', app);
  const estados = {};
  let mrr = 0, porCancelar = 0;
  for (const f of filas) {
    estados[f.estado] = (estados[f.estado] || 0) + 1;
    if (VIGENTES.includes(f.estado)) {
      mrr += f.intervalo === 'year' ? Math.round(f.monto_centavos / 12) : f.monto_centavos;
      if (f.cancelar_al_final) porCancelar++;
    }
  }
  const pagan = new Set((await all(env, `SELECT DISTINCT email FROM suscripciones WHERE app = ? AND estado IN (${VIGENTES.map(() => '?').join(',')})`, app, ...VIGENTES)).map(f => f.email));
  const cortesias = new Set((await filasCortesia(env, [app])).filter(c => c.vigente && !pagan.has(c.email)).map(c => c.email)).size;
  return { estados, vigentes: filas.filter(f => VIGENTES.includes(f.estado)).length, mrr_centavos: mrr, por_cancelar: porCancelar, cortesias };
}

// Saldo a favor en la siguiente factura (p. ej. el mes gratis por invitar en Cuentas). Stripe lo descuenta del próximo cobro.
export async function creditoApp(env, email, app, centavos, motivo) {
  email = String(email || '').trim().toLowerCase();
  const monto = Math.floor(Number(centavos));
  if (!(monto > 0 && monto <= 100000)) throw new Error('Monto inválido');
  const s = await vigente(env, email, app);
  if (!s?.customer_id) return { ok: false, motivo: 'sin_suscripcion' };
  await llamar(env, 'POST', `/customers/${s.customer_id}/balance_transactions`, { amount: -monto, currency: 'mxn', description: String(motivo || 'Crédito').slice(0, 300) });
  return { ok: true };
}
