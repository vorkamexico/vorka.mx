// Stripe Connect para el marketplace de creadores.
// Cuentas de creador con Accounts v2: panel Express, comisiones y saldos negativos a cargo de Vorka,
// configuración de receptor (solo reciben transferencias). Ver _tienda/PLAN-MARKETPLACE.md
import { llamar, STRIPE_VERSION } from './stripe.js';

const API_V2 = 'https://api.stripe.com/v2';

// Accounts v2: cuerpo JSON (no form-encoded)
export async function llamarV2(env, metodo, ruta, cuerpo, { idempotencia } = {}) {
  const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'stripe-version': STRIPE_VERSION };
  if (cuerpo) headers['content-type'] = 'application/json';
  if (idempotencia) headers['idempotency-key'] = idempotencia;
  const r = await fetch(API_V2 + ruta, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const body = await r.json();
  if (!r.ok) {
    const e = new Error(`Stripe ${r.status}: ${body?.error?.message || 'error'}`);
    e.status = r.status;
    throw e;
  }
  return body;
}

export function cuentaCreadorBody(creador) {
  return {
    contact_email: creador.email,
    display_name: creador.nombre,
    dashboard: 'express',
    identity: { country: 'mx' },
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
    defaults: {
      currency: 'mxn',
      locales: ['es-419'],
      responsibilities: { fees_collector: 'application', losses_collector: 'application' },
    },
    metadata: { creador_id: creador.id, fuente: 'vorka-tienda' },
    include: ['configuration.recipient', 'requirements'],
  };
}

export const crearCuenta = (env, creador) =>
  llamarV2(env, 'POST', '/core/accounts', cuentaCreadorBody(creador), { idempotencia: `cuenta-${creador.id}` });

// Lista para recibir dinero: transferencias y depósitos activos
export function cuentaLista(cuenta) {
  const sb = cuenta?.configuration?.recipient?.capabilities?.stripe_balance || {};
  return sb.stripe_transfers?.status === 'active' && sb.payouts?.status === 'active';
}

export const leerCuenta = (env, id) =>
  llamarV2(env, 'GET', `/core/accounts/${encodeURIComponent(id)}?include=configuration.recipient&include=requirements`);

// Sesión para los componentes incrustados (registro, avisos, datos y depósitos)
export async function sesionComponentes(env, cuentaId) {
  const s = await llamar(env, 'POST', '/account_sessions', {
    account: cuentaId,
    components: {
      account_onboarding: { enabled: true, features: { external_account_collection: true } },
      notification_banner: { enabled: true, features: { external_account_collection: true } },
      account_management: { enabled: true, features: { external_account_collection: true } },
      payouts: { enabled: true },
    },
  });
  return s.client_secret;
}

// Enlace de un solo uso a su panel Express de Stripe
export async function enlacePanel(env, cuentaId) {
  const l = await llamar(env, 'POST', `/accounts/${encodeURIComponent(cuentaId)}/login_links`, {});
  return l.url;
}

// Comisión real de Stripe de un cargo (null si aún no se liquida: con tarjeta llega segundos después del pago)
export async function comisionDeCargo(env, cargoId) {
  const c = await llamar(env, 'GET', `/charges/${encodeURIComponent(cargoId)}?expand[]=balance_transaction`);
  return c?.balance_transaction?.fee ?? null;
}

// Cargo y comisión real de un PaymentIntent (el cobro de una factura de suscripción). Sin la API de Charges.
export async function comisionDePago(env, pagoId) {
  const pi = await llamar(env, 'GET', `/payment_intents/${encodeURIComponent(pagoId)}?expand[]=latest_charge.balance_transaction`);
  const cargo = pi?.latest_charge;
  return { pago_id: pi?.id || pagoId, cargo_id: typeof cargo === 'object' ? cargo?.id || null : cargo || null, fee: typeof cargo === 'object' ? cargo?.balance_transaction?.fee ?? null : null };
}

// El cobro de una factura pagada: { pago_id, cargo_id, fee }. Desde la API 2025-03-31 el pago vive en invoice.payments
// (InvoicePayment → payment.payment_intent; la factura se pide con expand[]=payments); antes, en invoice.payment_intent.
// fee null = Stripe aún no liquida el cargo (el cron lo completa: marketplace.js › facturasPorCalcular).
export async function cobroDeFactura(env, factura) {
  const pagos = factura?.payments?.data || [];
  const pg = pagos.find(p => p.status === 'paid') || pagos[0];
  let pi = pg?.payment?.payment_intent || factura?.payment_intent || null;
  if (typeof pi === 'object') pi = pi?.id || null;
  if (!pi) return { pago_id: null, cargo_id: null, fee: null };
  return comisionDePago(env, pi);
}

export const transferir = (env, t, cuentaId, cargoId) =>
  llamar(env, 'POST', '/transfers', {
    amount: t.monto_centavos, currency: String(t.moneda || 'MXN').toLowerCase(), destination: cuentaId,
    // Ligada al cargo: los fondos salen cuando ese pago ya está disponible (OXXO/SPEI incluidos)
    source_transaction: cargoId || undefined,
    // Suscripción de creador: el grupo es la factura (cada renovación es su propio cobro)
    transfer_group: t.factura_id || t.order_id,
    description: t.factura_id ? `Suscripción en vorka.mx/tienda · factura ${t.factura_id}` : `Venta en vorka.mx/tienda · orden ${t.order_id}`,
    metadata: { order_id: t.order_id || undefined, creador_id: t.creador_id, transferencia_id: t.id, factura_id: t.factura_id || undefined, suscripcion_id: t.suscripcion_id || undefined },
  }, { idempotencia: `transferencia-${t.id}` });

export const revertir = (env, transferId, orderId) =>
  llamar(env, 'POST', `/transfers/${encodeURIComponent(transferId)}/reversals`, { metadata: { order_id: orderId, motivo: 'reembolso o disputa' } },
    { idempotencia: `reversion-${transferId}` });
