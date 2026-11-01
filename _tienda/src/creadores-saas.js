// Creadores que venden su propio SaaS / app por suscripción en vorka.mx/tienda (migración 0060).
//
// Cómo fluye el dinero (mismo patrón que los descargables: cargo de Vorka + transferencia al creador):
//   1. El comprador paga en Stripe Checkout en modo suscripción (Vorka es quien cobra y aparece en su estado de cuenta).
//   2. Cada factura pagada (invoice.paid: la primera y cada renovación) programa una transferencia (marketplace.js ›
//      programarFactura): venta − max(20 %, % del creador) − comisión real de Stripe de ese cobro. Una sola por factura.
//   3. El cron de cada hora la envía pasado el plazo (7 días en mensuales, 11 en anuales), ligada al cargo de esa factura.
//   4. Reembolso completo o disputa de ese cobro → se cancela o se revierte (marketplace.js › anularPorPago).
//
// Lo que ve y usa el creador para su app:
//   · API con llave (Authorization: Bearer vk_…, solo su hash en D1, se rota en el portal):
//       GET  /api/creadores/v1/suscripciones?correo=…[&producto=slug|id]   → { activa, estado, plan, periodo_fin, … }
//       GET  /api/creadores/v1/suscripciones/<sub_…>
//       POST /api/creadores/v1/portal { correo, volver }                    → { url } del portal de Stripe (tarjeta, cancelar)
//       GET  /api/creadores/v1/yo                                           → para probar la llave
//     Solo ve las suscripciones de SUS productos. Límite: 120 por minuto por creador.
//   · Avisos firmados a su URL (alta, renovada, pago_fallido, cancelada), con reintentos en el cron y botón de prueba.
//     Firma: cabecera Vorka-Firma "t=<unix>,v1=<hex>", v1 = HMAC-SHA256(secreto, `${t}.${cuerpo}`) (como la de Stripe).
//   · Documentación con ejemplos: /creadores/docs.
// Y el comprador administra su cobro (tarjeta, facturas, cancelar) en vorka.mx/tienda/suscripcion (enlace a su correo →
// portal de clientes de Stripe), además del botón que el creador puede poner en su app con /v1/portal.
import { json, fail, all, one, run, sha256, aleatorio, enc, hex, iguales, ahoraISO, correoOculto } from './util.js';
import { dentroDelLimite } from './modelo.js';
import { llamar } from './pagos/stripe.js';
import { cobroDeFactura } from './pagos/connect.js';
import { VIGENTES } from './suscripciones.js';
import { programarFactura, comisionSuscripcion, nuevoId } from './marketplace.js';
import { ventaNueva } from './correos-creadores.js';
import { marco, boton, enviar, esc, P, SOPORTE } from './correo.js';
import { pagina, aviso } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';

export const TIPOS_AVISO = ['suscripcion.alta', 'suscripcion.renovada', 'suscripcion.pago_fallido', 'suscripcion.cancelada'];
export const API_POR_MINUTO = 120;
export const TOLERANCIA_FIRMA_S = 300;
// Reintentos de un aviso: espera (minutos) después de cada intento fallido. El cron corre cada hora: en la práctica, a la
// hora siguiente que toque. Después del último, queda 'fallido' (se ve en el portal del creador).
export const ESPERAS_MIN = [5, 30, 60, 180, 360, 720, 1440];
const TIEMPO_ENVIO_MS = 8000;

// App de un SaaS de creador en la tabla suscripciones (contenido.acceso.app): única por producto
export const appDeProducto = id => `cre-${id}`;
export const esSaas = p => p?.contenido?.tipo === 'saas' && !!p?.contenido?.suscripcion;

// ---------------------------------------------------------------------------------------------------------------------
// Llave de API
// ---------------------------------------------------------------------------------------------------------------------

// Llave nueva (reemplaza la anterior, que deja de funcionar al momento). Se muestra UNA vez; en D1 queda solo su SHA-256.
export async function crearLlave(env, creadorId) {
  const llave = `vk_${aleatorio(20)}`;
  await run(env, 'UPDATE creadores SET api_llave_hash = ?, api_llave_pista = ?, api_llave_creada_at = ?, api_usada_at = NULL WHERE id = ?',
    await sha256(llave), llave.slice(-4), ahoraISO(), creadorId);
  return llave;
}
export const borrarLlave = (env, creadorId) => run(env, 'UPDATE creadores SET api_llave_hash = NULL, api_llave_pista = NULL, api_llave_creada_at = NULL WHERE id = ?', creadorId);

async function creadorDeLlave(env, req) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer\s+(vk_[a-f0-9]{40})$/);
  if (!m) return null;
  return one(env, "SELECT * FROM creadores WHERE api_llave_hash = ? AND estado IN ('aprobado','suspendido')", await sha256(m[1]));
}

// ---------------------------------------------------------------------------------------------------------------------
// Respuesta de la API (la misma forma va en los avisos)
// ---------------------------------------------------------------------------------------------------------------------
export function datosSuscripcion(s, prod) {
  return {
    id: s.id, correo: s.email, activa: VIGENTES.includes(s.estado), estado: s.estado, plan: s.intervalo === 'year' ? 'year' : 'month',
    periodo_fin: s.periodo_fin, cancelar_al_final: !!s.cancelar_al_final, monto_centavos: s.monto_centavos, moneda: 'MXN',
    producto: prod ? { id: prod.id, slug: prod.slug, nombre: prod.nombre } : { id: s.product_id },
  };
}
const SIN_SUSCRIPCION = correo => ({ activa: false, estado: null, plan: null, periodo_fin: null, correo });

const correoValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

// GET /api/creadores/v1/… · servidor a servidor (sin cookies). Solo lo del creador dueño de la llave.
export async function apiV1(req, env, url) {
  const p = url.pathname.replace(/\/$/, '');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  // Antes de autenticar: tope por IP (frena a quien prueba llaves al azar)
  if (!(await dentroDelLimite(env, `api-cre:ip:${await sha256(ip)}`, 300, 60))) return fail('Demasiadas solicitudes. Espera un minuto.', 429);
  const c = await creadorDeLlave(env, req);
  if (!c) return fail('Llave de API inválida. Usa Authorization: Bearer vk_…', 401);
  if (!(await dentroDelLimite(env, `api-cre:${c.id}`, API_POR_MINUTO, 60))) return fail(`Límite de ${API_POR_MINUTO} solicitudes por minuto.`, 429);
  run(env, 'UPDATE creadores SET api_usada_at = ? WHERE id = ?', ahoraISO(), c.id).catch(() => {});
  const productos = await all(env, 'SELECT id, slug, nombre, contenido FROM products WHERE creador_id = ?', c.id);
  const prodDe = id => productos.find(x => x.id === id);
  const M = req.method;
  let m;
  if (p === '/api/creadores/v1/yo' && M === 'GET')
    return json({ creador: { id: c.id, nombre: c.nombre, estado: c.estado }, productos: productos.filter(x => esSaas({ contenido: JSON.parse(x.contenido || '{}') })).map(x => ({ id: x.id, slug: x.slug, nombre: x.nombre })) });
  if (p === '/api/creadores/v1/suscripciones' && M === 'GET') {
    const correo = String(url.searchParams.get('correo') || '').trim().toLowerCase();
    if (!correoValido(correo)) return fail('Falta ?correo= o no es válido.', 400);
    const filtro = url.searchParams.get('producto');
    const prod = filtro ? productos.find(x => x.id === filtro || x.slug === filtro) : null;
    if (filtro && !prod) return fail('Ese producto no es tuyo.', 404);
    const extra = prod ? ' AND product_id = ?' : '', args = prod ? [prod.id] : [];
    // La vigente (la que termina más tarde); si no hay, la última
    const s = await one(env, `SELECT * FROM suscripciones WHERE creador_id = ? AND email = ?${extra} AND estado IN (${VIGENTES.map(() => '?').join(',')}) ORDER BY periodo_fin DESC LIMIT 1`, c.id, correo, ...args, ...VIGENTES)
      || await one(env, `SELECT * FROM suscripciones WHERE creador_id = ? AND email = ?${extra} ORDER BY updated_at DESC LIMIT 1`, c.id, correo, ...args);
    return json(s ? datosSuscripcion(s, prodDe(s.product_id)) : SIN_SUSCRIPCION(correo));
  }
  if ((m = p.match(/^\/api\/creadores\/v1\/suscripciones\/(sub_[A-Za-z0-9]{1,80})$/)) && M === 'GET') {
    const s = await one(env, 'SELECT * FROM suscripciones WHERE id = ? AND creador_id = ?', m[1], c.id);
    return s ? json(datosSuscripcion(s, prodDe(s.product_id))) : fail('No encontrada.', 404);
  }
  if (p === '/api/creadores/v1/portal' && M === 'POST') {
    const d = await req.json().catch(() => ({}));
    const correo = String(d.correo || '').trim().toLowerCase();
    if (!correoValido(correo)) return fail('Falta correo.', 400);
    const s = await one(env, 'SELECT * FROM suscripciones WHERE creador_id = ? AND email = ? AND customer_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1', c.id, correo);
    if (!s) return fail('Ese correo no tiene suscripción a tus productos.', 404);
    // Regreso: solo a la app de ese producto (mismo origen que su URL); si no se manda, a la tienda
    const prod = prodDe(s.product_id);
    let origenApp = null; try { origenApp = new URL(JSON.parse(prod?.contenido || '{}').acceso?.url).origin; } catch { /* sin URL */ }
    let volver = `${env.SITE_URL}/tienda/`;
    if (d.volver) {
      let u = null; try { u = new URL(String(d.volver)); } catch { /* inválida */ }
      if (!u || u.protocol !== 'https:' || u.origin !== origenApp) return fail('volver debe ser una URL https de tu app.', 400);
      volver = u.toString();
    }
    const ps = await llamar(env, 'POST', '/billing_portal/sessions', { customer: s.customer_id, return_url: volver, locale: 'es-419' });
    return json({ url: ps.url });
  }
  return fail('No encontrado.', 404);
}

// ---------------------------------------------------------------------------------------------------------------------
// Avisos (webhooks) de Vorka a la app del creador
// ---------------------------------------------------------------------------------------------------------------------

// Secreto de firma: no se guarda; se deriva de DOWNLOAD_TOKEN_SECRET + creador + versión (rotar = subir webhook_version)
export async function secretoFirma(env, c) {
  if (!env.DOWNLOAD_TOKEN_SECRET) throw new Error('Falta DOWNLOAD_TOKEN_SECRET');
  const llave = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `whsec_${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`aviso:${c.id}:${c.webhook_version || 1}`))).slice(0, 48)}`;
}
export async function firmar(secreto, cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
// Lo mismo que tiene que hacer la app del creador (está en /creadores/docs). Se usa en las pruebas.
export async function firmaValida(secreto, cuerpo, cabecera, ahora = Date.now()) {
  const partes = String(cabecera || '').split(',').map(x => x.split('='));
  const t = Number(partes.find(([k]) => k === 't')?.[1]);
  const v1 = partes.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !v1.length || Math.abs(ahora / 1000 - t) > TOLERANCIA_FIRMA_S) return false;
  const esperada = (await firmar(secreto, cuerpo, t)).split('v1=')[1];
  return v1.some(f => iguales(f, esperada));
}

// URL a la que se mandan los avisos: https, con dominio (no IP, no localhost) y fuera de vorka.mx
export function urlAvisoValida(u) {
  let x; try { x = new URL(String(u || '').trim()); } catch { return null; }
  if (x.protocol !== 'https:' || x.username || x.password || String(u).length > 500) return null;
  const h = x.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || /^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.') || h === 'vorka.mx' || h.endsWith('.vorka.mx')) return null;
  return x.toString();
}

// Encola un aviso (una sola vez por clave) para el creador si tiene URL. Devuelve el aviso o null.
export async function encolarAviso(env, c, tipo, clave, datos, ahora = Date.now()) {
  if (!c?.webhook_url) return null;
  const id = nuevoId('avi');
  const cuerpo = JSON.stringify({ id, tipo, creado: new Date(ahora).toISOString(), datos });
  const r = await run(env, 'INSERT OR IGNORE INTO creador_avisos (id, creador_id, clave, tipo, cuerpo, proximo_at) VALUES (?,?,?,?,?,?)',
    id, c.id, clave, tipo, cuerpo, new Date(ahora).toISOString());
  return r.meta.changes ? { id, creador_id: c.id, tipo, cuerpo, intentos: 0 } : null;
}

// Un intento de entrega. 2xx = enviado; si no, se reprograma con espera creciente o queda 'fallido'.
export async function entregarAviso(env, a, c, ahora = Date.now()) {
  c = c || await one(env, 'SELECT * FROM creadores WHERE id = ?', a.creador_id);
  const url = urlAvisoValida(c?.webhook_url);
  let status = null, error = null;
  if (!url) error = 'Sin URL de avisos válida';
  else {
    try {
      const r = await fetch(url, { method: 'POST', body: a.cuerpo, redirect: 'manual', signal: AbortSignal.timeout(TIEMPO_ENVIO_MS),
        headers: { 'content-type': 'application/json', 'user-agent': 'Vorka-Avisos/1 (+https://vorka.mx/creadores/docs)',
          'vorka-firma': await firmar(await secretoFirma(env, c), a.cuerpo, Math.floor(ahora / 1000)), 'vorka-aviso-id': a.id, 'vorka-evento': a.tipo } });
      status = r.status;
      if (r.status < 200 || r.status >= 300) error = `Respondió ${r.status}`;
    } catch (e) { error = String(e?.message || e).slice(0, 200); }
  }
  const intentos = (a.intentos || 0) + 1;
  if (!error) {
    await run(env, "UPDATE creador_avisos SET estado = 'enviado', intentos = ?, ultimo_status = ?, ultimo_error = NULL, enviado_at = ? WHERE id = ?", intentos, status, new Date(ahora).toISOString(), a.id);
    return { ok: true, status };
  }
  const espera = ESPERAS_MIN[intentos - 1];
  await run(env, 'UPDATE creador_avisos SET estado = ?, intentos = ?, ultimo_status = ?, ultimo_error = ?, proximo_at = ? WHERE id = ?',
    espera == null ? 'fallido' : 'pendiente', intentos, status, error, new Date(ahora + (espera || 0) * 60e3).toISOString(), a.id);
  return { ok: false, status, error };
}

// Cron: reintentos de los avisos que tocan
export async function procesarAvisos(env, ahora = Date.now()) {
  const pendientes = await all(env, "SELECT * FROM creador_avisos WHERE estado = 'pendiente' AND proximo_at <= ? ORDER BY proximo_at LIMIT 50", new Date(ahora).toISOString());
  const r = { enviados: 0, fallidos: 0 };
  for (const a of pendientes) (await entregarAviso(env, a, null, ahora)).ok ? r.enviados++ : r.fallidos++;
  return r;
}

// Botón "Enviar prueba" del portal: un aviso 'prueba' con datos de ejemplo, entregado al momento
export async function enviarPrueba(env, c) {
  if (!urlAvisoValida(c.webhook_url)) return { ok: false, error: 'Primero guarda una URL https de tu app.' };
  const a = await encolarAviso(env, c, 'prueba', `prueba:${nuevoId('p')}`, { suscripcion: { id: 'sub_prueba', correo: 'comprador@ejemplo.com', activa: true, estado: 'active', plan: 'month',
    periodo_fin: new Date(Date.now() + 30 * 864e5).toISOString(), cancelar_al_final: false, monto_centavos: 19900, moneda: 'MXN', producto: { id: 'prod_prueba', slug: 'prueba', nombre: 'Producto de prueba' } } });
  return entregarAviso(env, a, c);
}

// ---------------------------------------------------------------------------------------------------------------------
// Webhook de Stripe → reparto y avisos (lo llama webhook.js con el renglón ya guardado de la suscripción)
// ---------------------------------------------------------------------------------------------------------------------
export async function eventoSuscripcionCreador(env, { evento, sub, fila, factura }) {
  const c = await one(env, 'SELECT * FROM creadores WHERE id = ?', fila.creador_id);
  if (!c) return;
  const prod = await one(env, 'SELECT id, slug, nombre FROM products WHERE id = ?', fila.product_id);
  const datos = extra => ({ suscripcion: datosSuscripcion(fila, prod), ...extra });
  const avisos = [];
  if (evento.tipo === 'invoice.paid' && factura) {
    const cobro = await cobroDeFactura(env, factura);
    const t = await programarFactura(env, { factura, sus: fila, cobro });
    const alta = factura.billing_reason === 'subscription_create';
    const tipo = alta ? 'suscripcion.alta' : 'suscripcion.renovada';
    avisos.push(await encolarAviso(env, c, tipo, `${tipo}:${factura.id}`, datos({ factura: { id: factura.id, monto_centavos: factura.amount_paid, moneda: String(factura.currency || 'mxn').toUpperCase() } })));
    // Correo al creador solo en altas (las renovaciones las ve en su portal y en sus avisos)
    if (t && alta) await ventaNueva(env, c, t, `${prod?.nombre || 'tu app'} (suscripción)`).catch(e => console.error('aviso venta saas', c.id, e.message));
  }
  if (evento.tipo === 'invoice.payment_failed' && factura)
    avisos.push(await encolarAviso(env, c, 'suscripcion.pago_fallido', `suscripcion.pago_fallido:${factura.id}:${factura.attempt_count || 1}`,
      datos({ factura: { id: factura.id, monto_centavos: factura.amount_due, intento: factura.attempt_count || 1, proximo_intento: factura.next_payment_attempt ? new Date(factura.next_payment_attempt * 1000).toISOString() : null } })));
  if (evento.tipo === 'customer.subscription.deleted' || fila.estado === 'canceled')
    avisos.push(await encolarAviso(env, c, 'suscripcion.cancelada', `suscripcion.cancelada:${fila.id}`, datos()));
  // Primer intento al momento (si falla, el cron reintenta); nunca tumba el webhook de Stripe
  for (const a of avisos.filter(Boolean)) await entregarAviso(env, a, c).catch(e => console.error('aviso creador', a.id, e.message));
}

// ---------------------------------------------------------------------------------------------------------------------
// Portal del creador: números de sus suscripciones
// ---------------------------------------------------------------------------------------------------------------------
export async function resumenSaas(env, c, ahora = Date.now()) {
  const subs = await all(env, 'SELECT s.*, p.nombre producto FROM suscripciones s LEFT JOIN products p ON p.id = s.product_id WHERE s.creador_id = ?', c.id);
  const pct = comisionSuscripcion(c.comision_pct);
  const vigentes = subs.filter(s => VIGENTES.includes(s.estado));
  const bruto = vigentes.reduce((t, s) => t + (s.intervalo === 'year' ? Math.round(s.monto_centavos / 12) : s.monto_centavos), 0);
  const vorka = Math.ceil(bruto * pct / 100);
  const hace30 = new Date(ahora - 30 * 864e5).toISOString();
  // Por día en hora del centro de México (la misma fecha que ve en la tabla)
  const diaMx = iso => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const porDia = new Map();
  for (const t of await all(env, "SELECT disponible_en, monto_centavos, estado FROM transferencias WHERE creador_id = ? AND estado IN ('programada','por_calcular') ORDER BY disponible_en LIMIT 200", c.id)) {
    const d = diaMx(t.disponible_en), x = porDia.get(d) || { dia: d, monto: 0, n: 0, estimado: 0 };
    x.monto += t.monto_centavos; x.n++; if (t.estado === 'por_calcular') x.estimado = 1;
    porDia.set(d, x);
  }
  const proximos = [...porDia.values()].slice(0, 8);
  const facturas = await all(env, `SELECT t.*, p.nombre producto, s.email FROM transferencias t LEFT JOIN suscripciones s ON s.id = t.suscripcion_id LEFT JOIN products p ON p.id = s.product_id
    WHERE t.creador_id = ? AND t.factura_id IS NOT NULL ORDER BY t.created_at DESC LIMIT 100`, c.id);
  const avisos = await all(env, 'SELECT id, tipo, estado, intentos, ultimo_status, ultimo_error, created_at, enviado_at FROM creador_avisos WHERE creador_id = ? ORDER BY created_at DESC LIMIT 10', c.id);
  return {
    pct, suscriptores: vigentes.length, por_cancelar: vigentes.filter(s => s.cancelar_al_final).length,
    cancelaciones_30: subs.filter(s => s.estado === 'canceled' && s.cancelada_at && s.cancelada_at >= hace30).length,
    mrr: { bruto, vorka, tuyo: bruto - vorka }, proximos, facturas, avisos, total: subs.length,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// vorka.mx/tienda/suscripcion · el comprador administra su cobro (tarjeta, facturas, cancelar) sin cuenta ni contraseña:
// escribe su correo y le llega un enlace (30 min) que abre el portal de clientes de Stripe.
// ---------------------------------------------------------------------------------------------------------------------
const PORTAL_MIN = 30;
const b64 = s => btoa(String.fromCharCode(...enc.encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0)));
async function firmaPortal(env, correo, exp) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(env.DOWNLOAD_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`portal:${correo}:${exp}`))).slice(0, 40);
}
export async function enlacePortal(env, correo, ahora = Date.now()) {
  const exp = Math.floor(ahora / 1000) + PORTAL_MIN * 60;
  return `${env.SITE_URL}/tienda/suscripcion/${b64(correo)}.${exp}.${await firmaPortal(env, correo, exp)}`;
}
export async function correoDeEnlace(env, token, ahora = Date.now()) {
  const m = String(token || '').match(/^([A-Za-z0-9_-]{4,400})\.(\d{10})\.([a-f0-9]{40})$/);
  if (!m || Number(m[2]) < ahora / 1000) return null;
  let correo; try { correo = deB64(m[1]); } catch { return null; }
  return iguales(m[3], await firmaPortal(env, correo, m[2])) ? correo : null;
}

const paginaPortal = (msg = '', error = '') => pagina({ titulo: 'Administra tu suscripción · Vorka México', ruta: '/tienda/suscripcion', noindex: true,
  cuerpo: msg ? aviso({ icono: CHECK, clase: 'exito', titulo: 'Revisa tu correo', texto: msg }) : `
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Suscripciones</span>
  <h1 class="t-h1">Administra tu suscripción</h1>
  <p class="t-lead">Cambia tu tarjeta, descarga tus recibos o cancela una suscripción que compraste en la tienda de Vorka México. Escribe el correo de tu compra y te mandamos un enlace.</p>
  <form class="t-form" method="post" action="/tienda/suscripcion" novalidate>
    <div class="t-campo"><label for="email">Correo de tu compra</label><input id="email" name="email" type="email" required autocomplete="email"></div>
    ${error ? `<p class="t-error" role="alert">${esc(error)}</p>` : ''}
    <button class="btn tinta" type="submit">Enviarme el enlace ${FLECHA}</button>
  </form>
  <p class="t-nota">¿Dudas con la app? Escríbele a quien la creó (su correo viene en tu correo de compra). ¿Dudas con el cobro? <a href="mailto:${SOPORTE.correo}">${SOPORTE.correo}</a>.</p>
</div></section>` });

export async function rutasPortalComprador(req, env, ctx, url) {
  const p = url.pathname.replace(/\/$/, '');
  if (p === '/tienda/suscripcion' && req.method === 'GET') return paginaPortal();
  if (p === '/tienda/suscripcion' && req.method === 'POST') {
    const f = Object.fromEntries(await req.formData().catch(() => new FormData()));
    const correo = String(f.email || '').trim().toLowerCase();
    if (!correoValido(correo)) return paginaPortal('', 'Escribe un correo válido.');
    const ip = req.headers.get('cf-connecting-ip') || 'local';
    const ok = await dentroDelLimite(env, `portal:ip:${await sha256(ip)}`, 10, 3600) && await dentroDelLimite(env, `portal:email:${await sha256(correo)}`, 3, 3600);
    if (ok) {
      const trabajo = (async () => {
        const hay = await one(env, 'SELECT 1 FROM suscripciones WHERE email = ? AND customer_id IS NOT NULL LIMIT 1', correo);
        if (!hay) return;
        const enlace = await enlacePortal(env, correo);
        await enviar(env, { para: correo, asunto: 'Administra tu suscripción', idempotencia: `portal-${enlace.slice(-24)}`,
          html: marco('Administra tu suscripción', `<p style="${P}">Hola:</p><p style="${P}">Con este botón cambias tu tarjeta, ves tus recibos o cancelas tus suscripciones de la tienda de Vorka México.</p>${boton(enlace, 'Administrar mi suscripción')}<p style="${P};color:#8b8790;font-size:13px">El enlace funciona ${PORTAL_MIN} minutos. Si no lo pediste, ignora este correo.</p>`),
          texto: `Hola:\n\nCon este enlace cambias tu tarjeta, ves tus recibos o cancelas tus suscripciones de la tienda de Vorka México:\n${enlace}\n\nFunciona ${PORTAL_MIN} minutos. Si no lo pediste, ignora este correo.\n\nVorka México · Guanajuato, México` });
      })().catch(e => console.error('portal comprador', correoOculto(correo), e.message));
      ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
    }
    return paginaPortal('Si ese correo tiene una suscripción en la tienda, en un momento te llega el enlace. Revisa también spam o promociones.');
  }
  const m = p.match(/^\/tienda\/suscripcion\/([A-Za-z0-9_.-]{20,500})$/);
  if (m && req.method === 'GET') {
    const correo = await correoDeEnlace(env, m[1]);
    const s = correo && (await one(env, 'SELECT customer_id FROM suscripciones WHERE email = ? AND customer_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1', correo)
      || await one(env, 'SELECT customer_id FROM stripe_clientes WHERE email = ?', correo));
    if (!s?.customer_id) return pagina({ titulo: 'Enlace vencido · Vorka México', ruta: '/tienda/suscripcion', noindex: true, status: 410,
      cuerpo: aviso({ clase: 'alerta', titulo: 'Este enlace ya no funciona', texto: `Los enlaces duran ${PORTAL_MIN} minutos.`, extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/suscripcion">Pedir otro enlace ${FLECHA}</a></div>` }) });
    const ps = await llamar(env, 'POST', '/billing_portal/sessions', { customer: s.customer_id, return_url: `${env.SITE_URL}/tienda/`, locale: 'es-419' });
    return new Response(null, { status: 303, headers: { location: ps.url, 'cache-control': 'no-store' } });
  }
  return null;
}
