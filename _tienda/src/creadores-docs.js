// vorka.mx/creadores/docs · cómo conecta un creador su SaaS / app con la tienda: API de suscripciones, avisos firmados,
// portal de clientes y el dinero de cada cobro. Pública (la lee quien programa la app), con ejemplos para copiar y pegar.
import { pagina, esc } from './paginas.js';
import { API_POR_MINUTO, TIPOS_AVISO, TOLERANCIA_FIRMA_S } from './creadores-saas.js';
import { PISO_SUSCRIPCION, DIAS_SUSCRIPCION } from './marketplace.js';

const codigo = (t, lenguaje = '') => `<pre class="d-code"${lenguaje ? ` data-l="${lenguaje}"` : ''}><code>${esc(t.trim())}</code></pre>`;

const CURL_CORREO = `
curl -s "https://vorka.mx/api/creadores/v1/suscripciones?correo=ana@ejemplo.com" \\
  -H "Authorization: Bearer $VORKA_API_KEY"`;
const RESPUESTA = `
{
  "id": "sub_1QX…",
  "correo": "ana@ejemplo.com",
  "activa": true,
  "estado": "active",
  "plan": "month",
  "periodo_fin": "2026-12-01T18:04:11.000Z",
  "cancelar_al_final": false,
  "monto_centavos": 19900,
  "moneda": "MXN",
  "producto": { "id": "prod_mi_app_3f2a1c", "slug": "mi-app", "nombre": "Mi App" }
}`;
const SIN = `{ "activa": false, "estado": null, "plan": null, "periodo_fin": null, "correo": "ana@ejemplo.com" }`;
const JS_API = `
// Node 18+, Deno, Bun o Cloudflare Workers (fetch nativo). La llave vive en tu servidor, nunca en el navegador.
export async function tieneAcceso(correo) {
  const r = await fetch('https://vorka.mx/api/creadores/v1/suscripciones?correo=' + encodeURIComponent(correo), {
    headers: { authorization: 'Bearer ' + process.env.VORKA_API_KEY },
  });
  if (!r.ok) throw new Error('Vorka respondió ' + r.status);
  const s = await r.json();
  return s.activa; // true en active, trialing y past_due (Stripe sigue reintentando el cobro)
}`;
const CURL_PORTAL = `
curl -s -X POST "https://vorka.mx/api/creadores/v1/portal" \\
  -H "Authorization: Bearer $VORKA_API_KEY" -H "content-type: application/json" \\
  -d '{"correo":"ana@ejemplo.com","volver":"https://miapp.com/cuenta"}'
# → { "url": "https://billing.stripe.com/p/session/…" }  (redirige a tu cliente ahí)`;
const AVISO = `
POST https://miapp.com/webhooks/vorka
content-type: application/json
vorka-evento: suscripcion.renovada
vorka-aviso-id: avi_9c1e…
vorka-firma: t=1764612000,v1=5f2c…

{
  "id": "avi_9c1e…",
  "tipo": "suscripcion.renovada",
  "creado": "2026-12-01T18:04:15.000Z",
  "datos": {
    "suscripcion": { "id": "sub_1QX…", "correo": "ana@ejemplo.com", "activa": true, "estado": "active", "plan": "month",
                     "periodo_fin": "2027-01-01T18:04:11.000Z", "cancelar_al_final": false, "monto_centavos": 19900, "moneda": "MXN",
                     "producto": { "id": "prod_mi_app_3f2a1c", "slug": "mi-app", "nombre": "Mi App" } },
    "factura": { "id": "in_1QY…", "monto_centavos": 19900, "moneda": "MXN" }
  }
}`;
const NODE_FIRMA = `
// Node 18+ (Express con express.raw para tener el cuerpo EXACTO, sin volver a serializarlo)
import crypto from 'node:crypto';
import express from 'express';

const SECRETO = process.env.VORKA_WEBHOOK_SECRET; // whsec_… (portal › Integración › Ver secreto de firma)

export function firmaValida(cuerpo, cabecera, tolerancia = ${TOLERANCIA_FIRMA_S}) {
  const partes = Object.fromEntries(String(cabecera || '').split(',').map(p => p.split('=')));
  const t = Number(partes.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > tolerancia) return false;          // evita repetir avisos viejos
  const esperada = crypto.createHmac('sha256', SECRETO).update(t + '.' + cuerpo).digest('hex');
  const v1 = Buffer.from(partes.v1 || '', 'utf8'), e = Buffer.from(esperada, 'utf8');
  return v1.length === e.length && crypto.timingSafeEqual(v1, e);
}

const app = express();
app.post('/webhooks/vorka', express.raw({ type: 'application/json' }), (req, res) => {
  const cuerpo = req.body.toString('utf8');
  if (!firmaValida(cuerpo, req.get('vorka-firma'))) return res.status(401).end();
  const aviso = JSON.parse(cuerpo);
  // Idempotencia: puede llegar más de una vez. Guarda aviso.id y no lo proceses dos veces.
  const s = aviso.datos.suscripcion;
  // aviso.tipo: suscripcion.alta | suscripcion.renovada | suscripcion.pago_fallido | suscripcion.cancelada | prueba
  // … activa o desactiva el acceso de s.correo según s.activa
  res.status(200).end();
});`;
const WORKER_FIRMA = `
// Cloudflare Workers / Deno / navegador moderno (Web Crypto)
async function firmaValida(cuerpo, cabecera, secreto) {
  const p = Object.fromEntries(String(cabecera || '').split(',').map(x => x.split('=')));
  if (!p.t || Math.abs(Date.now() / 1000 - Number(p.t)) > ${TOLERANCIA_FIRMA_S}) return false;
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const firma = Uint8Array.from((p.v1 || '').match(/../g) || [], h => parseInt(h, 16));
  return crypto.subtle.verify('HMAC', llave, firma, new TextEncoder().encode(p.t + '.' + cuerpo));
}

export default {
  async fetch(req, env) {
    const cuerpo = await req.text();
    if (!(await firmaValida(cuerpo, req.headers.get('vorka-firma'), env.VORKA_WEBHOOK_SECRET))) return new Response('firma', { status: 401 });
    const aviso = JSON.parse(cuerpo);
    // … guarda aviso.id para no procesarlo dos veces y actualiza el acceso de aviso.datos.suscripcion.correo
    return new Response('ok');
  },
};`;
const CURL_FIRMA = `
# Probar tu verificación desde la terminal: firma un cuerpo con tu secreto y mándalo a tu propio endpoint
CUERPO='{"id":"avi_prueba","tipo":"prueba","creado":"2026-11-01T00:00:00.000Z","datos":{}}'
T=$(date +%s)
V1=$(printf '%s' "$T.$CUERPO" | openssl dgst -sha256 -hmac "$VORKA_WEBHOOK_SECRET" | sed 's/^.* //')
curl -s -X POST https://miapp.com/webhooks/vorka -H "content-type: application/json" \\
  -H "vorka-firma: t=$T,v1=$V1" -d "$CUERPO"`;

const CSS = `<style>
.d-doc{display:grid;gap:8px}.d-doc h2{margin-top:34px}.d-doc h3{margin:22px 0 6px;font-size:18px}
.d-code{background:#141114;color:#F4F2F5;border-radius:14px;padding:14px 16px;overflow-x:auto;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;margin:6px 0 14px;max-width:100%}
.d-code code{white-space:pre}
.d-doc code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
.d-doc p code,.d-doc li code,.d-doc td code{background:var(--bg-2,#f4f2ef);border-radius:6px;padding:1px 5px;overflow-wrap:anywhere}
.d-tabla{width:100%;border-collapse:collapse;font-size:15px}.d-tabla th,.d-tabla td{border-bottom:1px solid var(--line);padding:8px 6px;text-align:left;vertical-align:top}
.d-scroll{overflow-x:auto}
.d-indice{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0;padding:0;list-style:none}.d-indice a{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:14px}
.d-dinero{border:1px solid var(--line);border-radius:16px;padding:14px 16px}
</style>`;

export function paginaDocs() {
  const dias = `${DIAS_SUSCRIPCION.month} días en planes mensuales y ${DIAS_SUSCRIPCION.year} en anuales`;
  return pagina({ titulo: 'Conecta tu app · API para creadores · Vorka México', ruta: '/creadores/docs', head: CSS,
    descripcion: 'Cómo vender tu SaaS por suscripción en la tienda de Vorka México: API para saber si un correo está al corriente, avisos firmados y portal de clientes.',
    cuerpo: `
<section class="t-sec"><div class="marco t-estrecho d-doc">
  <a class="t-volver" href="/creadores/panel">← Mi portal</a>
  <span class="etiqueta">Creadores · SaaS por suscripción</span>
  <h1 class="t-h1">Conecta tu app con la tienda</h1>
  <p class="t-lead">Vorka cobra la suscripción de tu app (mensual o anual), la renueva sola y te transfiere tu parte de cada cobro. Tu app solo necesita saber si el correo de quien entra está al corriente.</p>
  <ul class="d-indice"><li><a href="#flujo">Cómo funciona</a></li><li><a href="#llave">Llave</a></li><li><a href="#api">API</a></li><li><a href="#avisos">Avisos</a></li><li><a href="#firma">Verificar la firma</a></li><li><a href="#portal">Portal de clientes</a></li><li><a href="#dinero">Dinero</a></li></ul>

  <h2 class="t-h2" id="flujo">Cómo funciona</h2>
  <ol class="t-lista-n">
    <li>Creas tu producto en el portal como <b>Suscripción (SaaS / app)</b>: precio al mes y/o al año, la URL donde se entra a tu app y tu correo de soporte. Lo revisamos y se publica cuando tus pagos de Stripe están listos.</li>
    <li>Quien compra paga en la tienda. Le llega un correo con el botón a tu app y la indicación de entrar <b>con el mismo correo</b>.</li>
    <li>Cuando entra, tu servidor pregunta a la API si ese correo tiene la suscripción activa. Además te avisamos por webhook de cada alta, renovación, pago fallido y cancelación.</li>
  </ol>

  <h2 class="t-h2" id="llave">Tu llave de API</h2>
  <p>En tu portal, <a href="/creadores/panel#integracion">Integración con tu app › Crear llave</a>. Empieza con <code>vk_</code> y solo se muestra una vez: guárdala como secreto en tu servidor (nunca en el navegador ni en una app móvil). Si se filtra, <b>Rotar llave</b> la reemplaza al momento. Cada llave solo ve las suscripciones de <b>tus</b> productos.</p>
  <p>Se manda en cada solicitud: <code>Authorization: Bearer vk_…</code>. Límite: ${API_POR_MINUTO} solicitudes por minuto (respuesta <code>429</code> si lo pasas). Para probarla: <code>GET /api/creadores/v1/yo</code>.</p>

  <h2 class="t-h2" id="api">API</h2>
  <h3>¿Este correo tiene la suscripción activa?</h3>
  <p><code>GET https://vorka.mx/api/creadores/v1/suscripciones?correo=…</code> · opcional <code>&amp;producto=&lt;slug o id&gt;</code> si vendes más de una app.</p>
  ${codigo(CURL_CORREO, 'bash')}
  ${codigo(RESPUESTA, 'json')}
  <p>Si ese correo no tiene ninguna suscripción a tus productos, responde <code>200</code> con:</p>
  ${codigo(SIN, 'json')}
  <div class="d-scroll"><table class="d-tabla"><thead><tr><th>Campo</th><th>Qué es</th></tr></thead><tbody>
    <tr><td><code>activa</code></td><td><b>Lo único que necesitas para dar acceso.</b> <code>true</code> si el estado es <code>active</code>, <code>trialing</code> o <code>past_due</code> (Stripe sigue reintentando el cobro unos días).</td></tr>
    <tr><td><code>estado</code></td><td>El de Stripe: <code>active</code>, <code>past_due</code>, <code>canceled</code>, <code>unpaid</code>, <code>incomplete</code>…</td></tr>
    <tr><td><code>plan</code></td><td><code>month</code> o <code>year</code>.</td></tr>
    <tr><td><code>periodo_fin</code></td><td>Hasta cuándo está pagado (ISO 8601, UTC).</td></tr>
    <tr><td><code>cancelar_al_final</code></td><td><code>true</code> si ya canceló: sigue activa hasta <code>periodo_fin</code> y no se renueva.</td></tr>
  </tbody></table></div>
  <h3>Por id de suscripción</h3>
  <p><code>GET https://vorka.mx/api/creadores/v1/suscripciones/sub_…</code> · la misma respuesta; <code>404</code> si no es de tus productos.</p>
  <h3>En JavaScript</h3>
  ${codigo(JS_API, 'js')}
  <p>Errores: <code>400</code> correo inválido · <code>401</code> llave inválida · <code>404</code> no es tuyo · <code>429</code> límite. Te recomendamos guardar la respuesta unos minutos en tu app en vez de preguntar en cada clic.</p>

  <h2 class="t-h2" id="avisos">Avisos (webhooks)</h2>
  <p>Guarda en tu portal la URL https de tu app. Te mandamos un <code>POST</code> con JSON en cada evento:</p>
  <div class="d-scroll"><table class="d-tabla"><thead><tr><th>Tipo</th><th>Cuándo</th></tr></thead><tbody>
    <tr><td><code>${TIPOS_AVISO[0]}</code></td><td>Se pagó el primer cobro: da acceso.</td></tr>
    <tr><td><code>${TIPOS_AVISO[1]}</code></td><td>Se pagó una renovación: el acceso sigue hasta el nuevo <code>periodo_fin</code>.</td></tr>
    <tr><td><code>${TIPOS_AVISO[2]}</code></td><td>Falló un cobro. Stripe reintenta unos días (<code>activa</code> sigue en <code>true</code> mientras tanto); avisa a tu cliente si quieres.</td></tr>
    <tr><td><code>${TIPOS_AVISO[3]}</code></td><td>La suscripción terminó (canceló y acabó su periodo, o no se pudo cobrar): quita el acceso.</td></tr>
    <tr><td><code>prueba</code></td><td>El botón <b>Enviar prueba</b> de tu portal, con datos de ejemplo.</td></tr>
  </tbody></table></div>
  ${codigo(AVISO, 'http')}
  <p>Responde con cualquier <code>2xx</code> en menos de 8 segundos. Si no, reintentamos con espera creciente durante unos dos días; después el aviso queda como fallido en tu portal (y la API siempre tiene el estado al día). Un mismo aviso puede llegar más de una vez: usa <code>id</code> para no procesarlo dos veces.</p>

  <h2 class="t-h2" id="firma">Verificar la firma</h2>
  <p>Cada aviso trae <code>Vorka-Firma: t=&lt;segundos unix&gt;,v1=&lt;hex&gt;</code>, donde <code>v1 = HMAC-SHA256(secreto, t + "." + cuerpo)</code> sobre el cuerpo <b>exacto</b> que recibiste. Rechaza firmas de más de ${TOLERANCIA_FIRMA_S / 60} minutos. El secreto (<code>whsec_…</code>) está en tu portal, en <b>Ver secreto de firma</b>.</p>
  <h3>Node.js (Express)</h3>
  ${codigo(NODE_FIRMA, 'js')}
  <h3>Cloudflare Workers / Deno (Web Crypto)</h3>
  ${codigo(WORKER_FIRMA, 'js')}
  <h3>Probar con curl</h3>
  ${codigo(CURL_FIRMA, 'bash')}

  <h2 class="t-h2" id="portal">Portal de clientes (tarjeta, recibos, cancelar)</h2>
  <p>El cobro lo hace Vorka con Stripe. Para que tu cliente cambie su tarjeta, vea sus recibos o cancele, pon un botón en tu app que pida una liga al portal de Stripe (dura unos minutos; pídela al momento del clic). <code>volver</code> debe ser una URL https del mismo dominio que la URL de tu app.</p>
  ${codigo(CURL_PORTAL, 'bash')}
  <p>Tu cliente también puede hacerlo sin tu app en <a href="/tienda/suscripcion">vorka.mx/tienda/suscripcion</a> con el correo de su compra.</p>

  <h2 class="t-h2" id="dinero">El dinero de cada cobro</h2>
  <div class="d-dinero">
    <p>En <b>cada</b> cobro (el primero y cada renovación) recibes: <b>cobro − comisión de Vorka − comisión de Stripe de ese cobro</b>. En suscripciones la comisión de Vorka es de <b>${PISO_SUSCRIPCION} % como mínimo</b>.</p>
    <p>Ejemplo con un plan de $199 al mes pagado con tarjeta nacional, suponiendo una comisión de Stripe de $11.79 en ese cobro (3.6 % + $3 + IVA; la real depende de la tarjeta, ver <a href="https://stripe.com/mx/pricing" target="_blank" rel="noopener">stripe.com/mx/pricing</a>): Vorka $39.80 · Stripe $11.79 · <b>tú $147.41</b>. En tu portal ves el desglose real de cada cobro.</p>
    <p>Se transfiere a tu cuenta de Stripe ${dias} después de cada cobro (cubre el plazo de reembolso). Si un cobro se reembolsa completo o el cliente lo desconoce con su banco, esa transferencia se cancela o se revierte.</p>
  </div>
  <p class="t-nota">Las reglas completas están en los <a href="/legal/creadores/#suscripciones">términos para creadores</a>. ¿Dudas técnicas? <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>
</div></section>` });
}
