// Píxel de Meta + API de conversiones (CAPI).
//
// Se enciende con estos valores en Cloudflare (sin el ID no se carga nada; sin el token el servidor no llama a Meta):
//   · META_PIXEL_ID   (var pública): el ID del conjunto de datos/píxel del Administrador de eventos.
//   · META_CAPI_TOKEN (secreto): el token de acceso de la API de conversiones de ese píxel.
//   · META_TEST_CODE  (var opcional): código de "Probar eventos"; mientras exista, Meta muestra los eventos como prueba.
//
// Navegador (assets/v3/vorka.js): pide /api/meta/config, carga el píxel y cada evento lo manda dos veces con el mismo
// event_id: por el píxel y por /api/meta/evento (aquí → CAPI). Meta los junta en uno (deduplicación).
// Compras: SOLO las manda el servidor, cuando el webhook confirma el pago (compraMeta). La página de gracias manda la misma
// compra por el píxel con el mismo event_id (compra_<orden>) para que también se deduplique.
import { json, one, run, sha256 } from './util.js';
import { dentroDelLimite } from './modelo.js';

const VERSION_API = 'v24.0';
// Eventos que el navegador puede pedir. Purchase NO: una compra solo la confirma el webhook.
export const EVENTOS_NAVEGADOR = new Set(['PageView', 'ViewContent', 'Contact', 'Lead', 'InitiateCheckout', 'CompleteRegistration']);
const LIMITE_EVENTOS = 120, VENTANA_EVENTOS = 600;   // por IP: de sobra para una persona navegando

// Píxel del navegador: basta el ID. API de conversiones (servidor): necesita además el token, que Meta solo da a píxeles
// de un portafolio comercial. Sin token, el píxel mide igual desde el navegador y el servidor no llama a Meta.
export const pixelActivo = env => !!env.META_PIXEL_ID;
export const metaActivo = env => !!(env.META_PIXEL_ID && env.META_CAPI_TOKEN);

const cookieDe = (req, nombre) => {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

// _fbc: la cookie de Meta, o si aún no existe, la armamos con ?fbclid= de la página (formato fb.1.<ms>.<fbclid>)
export function fbcDe(req, urlPagina) {
  const c = cookieDe(req, '_fbc');
  if (c) return c.slice(0, 500);
  try {
    const id = new URL(urlPagina).searchParams.get('fbclid');
    return id ? `fb.1.${Date.now()}.${id.slice(0, 400)}` : null;
  } catch { return null; }
}

// Lo que necesita Meta para reconocer al navegador, leído de la petición
export const navegadorDe = (req, urlPagina) => ({
  fbp: (cookieDe(req, '_fbp') || '').slice(0, 200) || null,
  fbc: fbcDe(req, urlPagina),
  ip: req.headers.get('cf-connecting-ip') || null,
  ua: (req.headers.get('user-agent') || '').slice(0, 400) || null,
});

const limpio = s => String(s || '').trim().toLowerCase();
/**
 * user_data de CAPI. Correo y nombre van con SHA-256 (Meta lo exige); IP, navegador y cookies van tal cual.
 * Solo se incluye lo que existe.
 */
export async function datosUsuario({ email, nombre, ip, ua, fbp, fbc } = {}) {
  const u = { country: [await sha256('mx')] };
  if (email) u.em = [await sha256(limpio(email))];
  const partes = limpio(nombre).normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
  if (partes[0]) u.fn = [await sha256(partes[0])];
  if (partes.length > 1) u.ln = [await sha256(partes[partes.length - 1])];
  if (ip) u.client_ip_address = ip;
  if (ua) u.client_user_agent = ua;
  if (fbp) u.fbp = fbp;
  if (fbc) u.fbc = fbc;
  return u;
}

/** Manda eventos a la API de conversiones. Nunca lanza: devuelve { ok, status?, error? } (un fallo de Meta no rompe nada). */
export async function enviarEventos(env, data) {
  if (!metaActivo(env) || !data.length) return { ok: false, error: 'apagado' };
  const cuerpo = { data, ...(env.META_TEST_CODE ? { test_event_code: env.META_TEST_CODE } : {}) };
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSION_API}/${encodeURIComponent(env.META_PIXEL_ID)}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) { const t = await r.text().catch(() => ''); console.error('meta: CAPI', r.status, t.slice(0, 300)); return { ok: false, status: r.status }; }
    return { ok: true };
  } catch (e) { console.error('meta: CAPI', e?.message); return { ok: false, error: e?.message }; }
}

// custom_data permitido desde el navegador (lo demás se ignora)
function datosDesdeNavegador(d = {}) {
  const out = {};
  const valor = Number(d.value);
  if (Number.isFinite(valor) && valor >= 0 && valor < 1e6) { out.value = Math.round(valor * 100) / 100; out.currency = 'MXN'; }
  if (Array.isArray(d.content_ids)) out.content_ids = d.content_ids.slice(0, 20).map(x => String(x).slice(0, 80));
  for (const k of ['content_name', 'content_category', 'content_type'])
    if (typeof d[k] === 'string' && d[k]) out[k] = d[k].slice(0, 150);
  return out;
}

const ID_EVENTO = /^[A-Za-z0-9_.:-]{6,100}$/;

// GET /api/meta/config → { pixel } para vorka.js (null = apagado: no se carga el píxel)
export const configMeta = env => json({ pixel: pixelActivo(env) ? String(env.META_PIXEL_ID) : null }, 200, { 'cache-control': 'public, max-age=300' });

// POST /api/meta/evento { evento, id, url, datos } (sendBeacon desde vorka.js) → 204. Reenvía a CAPI con la IP y cookies.
export async function eventoNavegador(req, env, ctx) {
  if (!metaActivo(env)) return new Response(null, { status: 204 });
  let b;
  try { b = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  if (!b || !EVENTOS_NAVEGADOR.has(b.evento) || !ID_EVENTO.test(String(b.id || ''))) return new Response(null, { status: 400 });
  let pagina;
  try { pagina = new URL(String(b.url || '')); } catch { return new Response(null, { status: 400 }); }
  if (!/(^|\.)vorka\.mx$/.test(pagina.hostname)) return new Response(null, { status: 400 });
  const nav = navegadorDe(req, pagina.href);
  if (nav.ip && !(await dentroDelLimite(env, `meta:${await sha256(nav.ip)}`, LIMITE_EVENTOS, VENTANA_EVENTOS))) return new Response(null, { status: 429 });
  const evento = {
    event_name: b.evento, event_time: Math.floor(Date.now() / 1000), event_id: String(b.id), action_source: 'website',
    event_source_url: pagina.href.slice(0, 1000), user_data: await datosUsuario(nav), custom_data: datosDesdeNavegador(b.datos),
  };
  const envio = enviarEventos(env, [evento]);
  if (ctx?.waitUntil) ctx.waitUntil(envio); else await envio;
  return new Response(null, { status: 204 });
}

/** Guarda en la orden con qué navegador se compró (para atribuir la compra aunque se pague días después). */
export async function guardarNavegador(env, orderId, req, urlPagina) {
  if (!metaActivo(env)) return;
  const n = navegadorDe(req, urlPagina);
  await run(env, 'UPDATE orders SET meta_fbp = ?, meta_fbc = ?, meta_ip = ?, meta_ua = ? WHERE id = ?', n.fbp, n.fbc, n.ip, n.ua, orderId);
}

/** InitiateCheckout del servidor al abrir el pago (event_id checkout_<orden>). */
export async function inicioPagoMeta(env, orden, req, urlPagina) {
  if (!metaActivo(env)) return;
  const nav = navegadorDe(req, urlPagina);
  return enviarEventos(env, [{
    event_name: 'InitiateCheckout', event_time: Math.floor(Date.now() / 1000), event_id: `checkout_${orden.id}`, action_source: 'website',
    event_source_url: urlPagina, user_data: await datosUsuario({ ...nav, email: orden.email, nombre: orden.nombre }),
    custom_data: { value: orden.monto_centavos / 100, currency: orden.moneda || 'MXN', content_ids: (orden.items || []).map(i => i.product_id), content_type: 'product', num_items: (orden.items || []).reduce((n, i) => n + (i.cantidad || 1), 0) },
  }]);
}

// Órdenes que cuentan como venta para Meta: pagadas, con dinero de por medio (no regalos ni cortesías de $0)
const ES_VENTA = o => o && o.estado === 'paid' && o.monto_centavos > 0 && !['regalo', 'cortesia'].includes(o.proveedor);

/**
 * Purchase por CAPI cuando la orden se paga (webhook o conciliación). Idempotente con meta_compra_at: si Meta falla,
 * queda sin marcar y el siguiente reintento del webhook o la conciliación lo vuelve a intentar.
 */
export async function compraMeta(env, orderId) {
  if (!metaActivo(env)) return { ok: false, error: 'apagado' };
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', orderId);
  if (!ES_VENTA(o) || o.meta_compra_at) return { ok: false, error: 'no_aplica' };
  const pagado = Date.parse(o.paid_at || '') || Date.now();
  // Meta solo acepta eventos de los últimos 7 días; las compras viejas (de antes de encender el píxel) no se mandan
  if (Date.now() - pagado > 6.5 * 864e5) return { ok: false, error: 'vieja' };
  const items = (await env.DB.prepare('SELECT product_id, nombre, precio_centavos, cantidad FROM order_items WHERE order_id = ?').bind(orderId).all()).results;
  const r = await enviarEventos(env, [{
    event_name: 'Purchase',
    event_time: Math.floor(Math.min(pagado, Date.now()) / 1000),   // la hora real del pago (un OXXO llega días después)
    event_id: `compra_${o.id}`, action_source: 'website', event_source_url: `${env.SITE_URL || 'https://vorka.mx'}/tienda/gracias`,
    user_data: await datosUsuario({ email: o.email, nombre: o.nombre, ip: o.meta_ip, ua: o.meta_ua, fbp: o.meta_fbp, fbc: o.meta_fbc }),
    custom_data: {
      value: o.monto_centavos / 100, currency: o.moneda || 'MXN', order_id: o.id, content_type: 'product',
      content_ids: items.map(i => i.product_id), num_items: items.reduce((n, i) => n + (i.cantidad || 1), 0),
      contents: items.map(i => ({ id: i.product_id, quantity: i.cantidad || 1, item_price: i.precio_centavos / 100 })),
    },
  }]);
  if (r.ok) await run(env, 'UPDATE orders SET meta_compra_at = ? WHERE id = ? AND meta_compra_at IS NULL', new Date().toISOString(), o.id);
  return r;
}

/**
 * Para las páginas de la tienda: un evento del píxel que vorka.js manda (con su gemelo por CAPI) en cuanto carga.
 * Va dentro del <script> con nonce de la página. JSON escapado para que no pueda cerrar la etiqueta.
 */
export function eventoPagina(evento, datos = {}, id = null) {
  const args = JSON.stringify([evento, datos, id]).replace(/</g, '\\u003c');
  return `;(window.vorkaMeta=window.vorkaMeta||[]).push(${args});`;
}
