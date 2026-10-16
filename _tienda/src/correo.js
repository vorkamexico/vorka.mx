// Correos de la tienda por Resend, con la misma plantilla visual que los de Vorka OS
// (encabezado negro con la V, línea dorada, texto justificado, pie centrado).
import { correoOculto } from './util.js';

// Mismo diseño que los correos de Vorka OS (vorka-os/src/correo-diseno.js, estilo v3 de vorka.mx):
// fondo claro, tarjeta blanca con línea dorada, título grande, botón en píldora negra y pie con la firma.
const FUENTE = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";
const C = { tinta: '#141114', texto: '#2a262b', gris: '#6D696E', gris2: '#A8A4A9', linea: '#E7E5E7', suave: '#F4F2EF', morado: '#6B2A85', oro: '#C8A45C' };
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SOPORTE = { correo: 'hola@vorka.mx', whatsapp: 'https://wa.me/528117804869' };

export const P = `margin:0 0 18px;font-size:16px;line-height:1.65;color:${C.texto}`;
export const boton = (url, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 26px"><tr><td style="border-radius:999px;background:${C.tinta}"><a href="${esc(url)}" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:650;color:#ffffff;text-decoration:none;border-radius:999px;font-family:${FUENTE}">${esc(label)}&nbsp;&nbsp;&rarr;</a></td></tr></table>`;
export const lista = items => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${C.suave};border-radius:16px"><tr><td style="padding:14px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(t => `<tr><td style="width:20px;vertical-align:top;padding:10px 0 0"><div style="width:7px;height:7px;border-radius:7px;background:${C.oro}"></div></td><td style="padding:4px 0;font-size:15.5px;line-height:1.55;font-weight:600;color:${C.tinta}">${t}</td></tr>`).join('')}</table></td></tr></table>`;

export function marco(titulo, cuerpoHtml, { etiqueta = 'Tienda Vorka México' } = {}) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(titulo)}</title>
<style>@media (max-width:620px){.vk-pad{padding:30px 22px 8px!important}.vk-h1{font-size:25px!important}.vk-fuera{padding:22px 8px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.suave};-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.suave}"><tr><td align="center" class="vk-fuera" style="padding:34px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FUENTE}">
<tr><td style="padding:0 6px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
  <td style="vertical-align:middle;width:36px"><a href="https://vorka.mx/tienda" style="text-decoration:none"><img src="https://os.vorka.mx/logo-correo.png" width="26" height="26" alt="Vorka México" style="display:block;border:0"></a></td>
  <td style="vertical-align:middle;font-size:16px;font-weight:700;letter-spacing:-.3px;color:${C.tinta}">Vorka <span style="color:${C.gris2};font-weight:600">México</span></td>
</tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.linea};border-radius:24px;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.oro};background-image:linear-gradient(100deg,#6f5420 0%,#a8853f 35%,#c8a45c 62%,#8a6a2c 100%);border-radius:24px 24px 0 0">&nbsp;</td></tr>
  <tr><td class="vk-pad" style="padding:38px 40px 10px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr><td style="width:4px;height:14px;background:${C.morado};border-radius:1px"></td><td style="padding-left:9px;font-size:13px;font-weight:650;color:${C.gris}">${esc(etiqueta)}</td></tr></table>
    <div class="vk-h1" style="font-size:28px;line-height:1.14;font-weight:750;letter-spacing:-.7px;color:${C.tinta};margin:0 0 24px">${esc(titulo)}</div>
    <div style="font-size:16px;line-height:1.65;color:${C.texto}">${cuerpoHtml}</div>
  </td></tr></table>
</td></tr>
<tr><td align="center" style="padding:26px 16px 6px;font-size:12.5px;line-height:1.8;color:${C.gris2};text-align:center">
  <b style="color:${C.gris};font-weight:650">Vorka México</b> · Guanajuato, México<br>
  <a href="https://vorka.mx/tienda" style="color:${C.gris2};text-decoration:underline">Tienda</a> &nbsp;·&nbsp; <a href="https://vorka.mx/privacidad/" style="color:${C.gris2};text-decoration:underline">Aviso de privacidad</a> &nbsp;·&nbsp; <a href="mailto:${SOPORTE.correo}" style="color:${C.gris2};text-decoration:underline">${SOPORTE.correo}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/**
 * Envía el correo. Orden: llave propia de Resend (RESEND_API_KEY) → Vorka OS por service binding (CORREO),
 * que usa la llave de Resend que ya tiene → "modo prueba" (se registra y se da por enviado).
 * Lanza error si el envío falla, para que el webhook responda 500 y la pasarela reintente.
 */
const REMITENTE = 'Vorka México <tienda@vorka.mx>';
export async function enviar(env, { para, asunto, html, texto, idempotencia }) {
  if (!env.RESEND_API_KEY && env.CORREO)
    return env.CORREO.enviar({ para, asunto, html, texto, de: REMITENTE, responder_a: SOPORTE.correo, idempotencia });
  if (!env.RESEND_API_KEY) {
    console.log('correo (modo prueba)', correoOculto(para), asunto);
    return { prueba: true };
  }
  const headers = { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' };
  if (idempotencia) headers['idempotency-key'] = idempotencia;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers,
    body: JSON.stringify({ from: REMITENTE, to: [para], reply_to: SOPORTE.correo, subject: asunto, html, text: texto }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
