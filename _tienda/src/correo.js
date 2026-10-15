// Correos de la tienda por Resend, con la misma plantilla visual que los de Vorka OS
// (encabezado negro con la V, línea dorada, texto justificado, pie centrado).
import { correoOculto } from './util.js';

const FUENTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SOPORTE = { correo: 'hola@vorka.mx', whatsapp: 'https://wa.me/528117804869' };

export const P = 'margin:0 0 16px;text-align:justify;text-justify:inter-word';
export const boton = (url, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:12px;background:#141114"><a href="${esc(url)}" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;font-family:${FUENTE}">${esc(label)} &rarr;</a></td></tr></table>`;
export const lista = items => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${items.map(t => `<tr><td style="width:18px;vertical-align:top;color:#c8a45c;font-weight:700;padding:3px 0">&#9632;</td><td style="padding:3px 0;font-size:15px;line-height:1.55;color:#1b181b">${t}</td></tr>`).join('')}</table>`;

export function marco(titulo, cuerpoHtml) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f3f2f0;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2f0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;font-family:${FUENTE}">
<tr><td style="background:#0f0d10;padding:26px 36px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle"><img src="https://os.vorka.mx/logo-correo-blanco.png" width="30" height="30" alt="Vorka México" style="display:block;border:0"></td>
    <td style="vertical-align:middle;padding-left:12px;font-size:13px;font-weight:700;letter-spacing:4px;color:#ffffff;font-family:${FUENTE}">VORKA <span style="color:#c8a45c;font-weight:600;letter-spacing:3px">MÉXICO</span></td>
  </tr></table>
</td></tr>
<tr><td style="height:3px;line-height:3px;font-size:0;background:#c8a45c">&nbsp;</td></tr>
<tr><td style="padding:36px 36px 12px;font-size:15.5px;line-height:1.7;color:#1b181b">${cuerpoHtml}</td></tr>
<tr><td style="padding:0 36px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-top:1px solid #ecebea;padding-top:20px;font-size:12.5px;line-height:1.75;color:#8b8790;text-align:center">
  <b style="color:#5f5a62;font-weight:650">Vorka México</b> · Guanajuato, México<br>
  <a href="https://vorka.mx/tienda" style="color:#8b8790;text-decoration:underline">Tienda</a> &nbsp;·&nbsp; <a href="https://vorka.mx/privacidad/" style="color:#8b8790;text-decoration:underline">Aviso de privacidad</a> &nbsp;·&nbsp; <a href="mailto:${SOPORTE.correo}" style="color:#8b8790;text-decoration:underline">${SOPORTE.correo}</a>
</td></tr></table></td></tr>
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
