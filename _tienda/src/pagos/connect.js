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

export const transferir = (env, t, cuentaId, cargoId) =>
  llamar(env, 'POST', '/transfers', {
    amount: t.monto_centavos, currency: String(t.moneda || 'MXN').toLowerCase(), destination: cuentaId,
    // Ligada al cargo: los fondos salen cuando ese pago ya está disponible (OXXO/SPEI incluidos)
    source_transaction: cargoId || undefined,
    transfer_group: t.order_id,
    description: `Venta en vorka.mx/tienda · orden ${t.order_id}`,
    metadata: { order_id: t.order_id, creador_id: t.creador_id, transferencia_id: t.id },
  }, { idempotencia: `transferencia-${t.id}` });

export const revertir = (env, transferId, orderId) =>
  llamar(env, 'POST', `/transfers/${encodeURIComponent(transferId)}/reversals`, { metadata: { order_id: orderId, motivo: 'reembolso o disputa' } },
    { idempotencia: `reversion-${transferId}` });
