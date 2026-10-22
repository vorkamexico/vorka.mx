// Suscripciones (Stripe Billing) para apps que se cobran cada mes o cada año, como Vuelve.
// - El checkout de siempre (/api/checkout) detecta los productos con contenido.suscripcion y abre Stripe en modo suscripción.
// - La primera compra queda como orden normal (paid → correo con el botón para entrar a la app).
// - Las renovaciones, fallas de pago y cancelaciones llegan por webhook y solo actualizan la tabla suscripciones.
// - RPC para Vorka OS: suscripcionApp (¿está al corriente este correo?), portalApp (liga al portal de Stripe para
//   cambiar tarjeta o cancelar) y resumenSuscripciones (MRR y estados para Diversificación).
import { one, all, run, ahoraISO } from './util.js';
import { llamar } from './pagos/stripe.js';

// Estados de Stripe que dan acceso. past_due: Stripe sigue reintentando el cobro (días de gracia)
export const VIGENTES = ['active', 'trialing', 'past_due'];

export const suscripcionDe = p => p?.contenido?.suscripcion || null;

// Renglones de la compra: el plan (1) + sucursales adicionales del mismo intervalo
export async function itemsSuscripcion(env, plan, sucursales = 0) {
  const s = suscripcionDe(plan);
  const items = [{ slug: plan.slug, cantidad: 1 }];
  if (sucursales > 0) {
    const extra = s.extra && await one(env, 'SELECT slug FROM products WHERE id = ?', s.extra);
    if (!extra) throw new Error('sucursal');
    items.push({ slug: extra.slug, cantidad: sucursales });
  }
  return items;
}

// ¿La orden es de suscripción? Devuelve { intervalo, app } leyendo los productos de la base (nunca del navegador)
export async function suscripcionDeOrden(env, orden) {
  for (const it of orden.items || []) {
    const r = await one(env, 'SELECT contenido FROM products WHERE id = ?', it.product_id);
    let c; try { c = JSON.parse(r?.contenido || '{}'); } catch { c = {}; }
    if (c.suscripcion && !c.complemento) return { intervalo: c.suscripcion.intervalo === 'year' ? 'year' : 'month', app: c.acceso?.app || null, product_id: it.product_id };
  }
  return null;
}

export const vigente = (env, email, app) =>
  one(env, `SELECT * FROM suscripciones WHERE email = ? AND app = ? AND estado IN (${VIGENTES.map(() => '?').join(',')}) ORDER BY periodo_fin DESC LIMIT 1`,
    String(email || '').trim().toLowerCase(), app, ...VIGENTES);

// ---------- webhook ----------
const segISO = s => (s ? new Date(s * 1000).toISOString() : null);

// Suscripción de Stripe (con items.data.price.product expandido) → renglón de la tabla
export async function guardarSuscripcion(env, sub) {
  const items = sub.items?.data || [];
  const meta = sub.metadata || {};
  const idDe = it => (typeof it.price?.product === 'object' ? it.price.product.metadata?.product_id : null);
  let plan = meta.product_id || null, sucursales = 0, monto = 0;
  for (const it of items) {
    const pid = idDe(it);
    monto += (it.price?.unit_amount || 0) * (it.quantity || 1);
    if (!pid) continue;
    const r = await one(env, 'SELECT contenido FROM products WHERE id = ?', pid);
    let c; try { c = JSON.parse(r?.contenido || '{}'); } catch { c = {}; }
    if (c.complemento) sucursales += it.quantity || 1;
    else if (!plan) plan = pid;
  }
  const orden = meta.order_id ? await one(env, 'SELECT email FROM orders WHERE id = ?', meta.order_id) : null;
  const email = String(meta.email || orden?.email || '').trim().toLowerCase();
  const app = meta.app || null;
  if (!email || !app || !plan) { console.error('suscripción sin datos', sub.id); return null; }
  // Desde la API 2025-03-31 el periodo vive en cada item; antes, en la suscripción
  const fin = items[0]?.current_period_end ?? sub.current_period_end;
  const fila = {
    id: sub.id, email, app, product_id: plan, order_id: meta.order_id || null,
    customer_id: typeof sub.customer === 'object' ? sub.customer?.id : sub.customer || null,
    estado: sub.status, intervalo: items[0]?.price?.recurring?.interval === 'year' ? 'year' : 'month',
    periodo_fin: segISO(fin), cancelar_al_final: sub.cancel_at_period_end || sub.cancel_at ? 1 : 0, sucursales, monto_centavos: monto,
  };
  await run(env, `INSERT INTO suscripciones (id, email, app, product_id, order_id, customer_id, estado, intervalo, periodo_fin, cancelar_al_final, sucursales, monto_centavos)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT (id) DO UPDATE SET estado = excluded.estado, intervalo = excluded.intervalo, periodo_fin = excluded.periodo_fin,
      cancelar_al_final = excluded.cancelar_al_final, sucursales = excluded.sucursales, monto_centavos = excluded.monto_centavos,
      customer_id = COALESCE(excluded.customer_id, suscripciones.customer_id), order_id = COALESCE(suscripciones.order_id, excluded.order_id),
      updated_at = ?`,
    fila.id, fila.email, fila.app, fila.product_id, fila.order_id, fila.customer_id, fila.estado, fila.intervalo, fila.periodo_fin, fila.cancelar_al_final, fila.sucursales, fila.monto_centavos, ahoraISO());
  return fila;
}

// ---------- RPC para Vorka OS ----------
export async function suscripcionApp(env, email, app) {
  const s = await vigente(env, email, app)
    || await one(env, 'SELECT * FROM suscripciones WHERE email = ? AND app = ? ORDER BY updated_at DESC LIMIT 1', String(email || '').trim().toLowerCase(), app);
  if (!s) return null;
  return { id: s.id, estado: s.estado, vigente: VIGENTES.includes(s.estado), intervalo: s.intervalo, periodo_fin: s.periodo_fin,
    cancelar_al_final: !!s.cancelar_al_final, sucursales: s.sucursales, monto_centavos: s.monto_centavos };
}

// Lugares adicionales (sucursales o negocios extra de la misma cuenta) de la suscripción vigente: cambia en Stripe la
// cantidad del renglón del complemento (lo agrega si no existe, lo quita con 0). Stripe prorratea: la diferencia sale en
// la siguiente factura. Devuelve la suscripción ya actualizada (la misma forma que suscripcionApp).
export const MAX_LUGARES = 50;
export async function lugaresApp(env, email, app, extras) {
  extras = Math.trunc(Number(extras));
  if (!Number.isFinite(extras) || extras < 0 || extras > MAX_LUGARES) throw new Error(`Elige de 0 a ${MAX_LUGARES} lugares adicionales.`);
  const s = await vigente(env, email, app);
  if (!s) throw new Error('No hay una suscripción vigente con este correo.');
  const plan = await one(env, 'SELECT contenido FROM products WHERE id = ?', s.product_id);
  let c; try { c = JSON.parse(plan?.contenido || '{}'); } catch { c = {}; }
  const extra = c.suscripcion?.extra && await one(env, 'SELECT id, nombre, precio_centavos FROM products WHERE id = ?', c.suscripcion.extra);
  if (!extra) throw new Error('Este plan no admite lugares adicionales.');
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
  const s = await one(env, 'SELECT customer_id FROM suscripciones WHERE email = ? AND app = ? AND customer_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1', email, app)
    || await one(env, 'SELECT customer_id FROM stripe_clientes WHERE email = ?', email);
  if (!s?.customer_id) return null;
  const p = await llamar(env, 'POST', '/billing_portal/sessions', { customer: s.customer_id, return_url: volver, locale: 'es-419' });
  return { url: p.url };
}

// Para Diversificación: cuántas suscripciones hay en cada estado y el ingreso mensual recurrente (los planes anuales cuentan /12)
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
  return { estados, vigentes: filas.filter(f => VIGENTES.includes(f.estado)).length, mrr_centavos: mrr, por_cancelar: porCancelar };
}
