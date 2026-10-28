// Correos de la tienda por Resend, con la misma plantilla visual que los de Vorka OS
// (encabezado y pie noche centrados, etiqueta en píldora dorada, texto justificado, botones centrados).
import { correoOculto } from './util.js';

// Mismo diseño que los correos de Vorka OS (vorka-os/src/correo-diseno.js, v4 como las secciones oscuras de vorka.mx).
const FUENTE = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";
const C = { tinta: '#141114', texto: '#2a262b', gris: '#6D696E', gris2: '#A8A4A9', linea: '#E7E5E7', suave: '#F4F2EF', morado: '#6B2A85', oro: '#C8A45C' };
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SOPORTE = { correo: 'hola@vorka.mx', whatsapp: 'https://wa.me/528117804869' };

export const P = `margin:0 0 18px;font-size:16px;line-height:1.65;color:${C.texto};text-align:justify;text-justify:inter-word`;
export const boton = (url, label) => `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:8px auto 28px"><tr><td style="border-radius:999px;background:${C.tinta}"><a href="${esc(url)}" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:650;color:#ffffff;text-decoration:none;border-radius:999px;font-family:${FUENTE}">${esc(label)}&nbsp;&nbsp;&rarr;</a></td></tr></table>`;
export const lista = items => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${C.suave};border-radius:16px"><tr><td style="padding:14px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(t => `<tr><td style="width:20px;vertical-align:top;padding:10px 0 0"><div style="width:7px;height:7px;border-radius:7px;background:${C.oro}"></div></td><td style="padding:4px 0;font-size:15.5px;line-height:1.55;font-weight:600;color:${C.tinta}">${t}</td></tr>`).join('')}</table></td></tr></table>`;

export function marco(titulo, cuerpoHtml, { etiqueta = 'Tienda' } = {}) {
  return marcoCorreo({ titulo, etiqueta, cuerpo: `<div style="font-size:16px;line-height:1.65;color:${C.texto}">${cuerpoHtml}</div>` });
}
const OS = 'https://os.vorka.mx', SITIO = 'https://vorka.mx';
// Copia de marcoCorreo de Vorka OS (vorka-os/src/correo-diseno.js): si cambia allá, se copia aquí
function marcoCorreo({ titulo = '', etiqueta = 'Vorka México', previa = '', cuerpo = '', pie = '' }) {
  const NOCHE = '#0F0D10', CLARO = '#F4F2F5';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(titulo || 'Vorka México')}</title>
<style>@media (max-width:620px){.vk-pad{padding:30px 22px 10px!important}.vk-cab{padding:24px 22px 30px!important}.vk-h1{font-size:27px!important}.vk-fuera{padding:14px 8px!important}.vk-pie{padding:24px 22px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.suave};-webkit-text-size-adjust:100%">
${previa ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(previa).slice(0, 160)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.suave}" style="background:${C.suave}"><tr><td align="center" class="vk-fuera" style="padding:30px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FUENTE}">
<tr><td style="border-radius:26px;overflow:hidden;background:#ffffff;box-shadow:0 18px 50px -24px rgba(15,13,16,.35)">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td class="vk-cab" bgcolor="${NOCHE}" align="center" style="background:${NOCHE};background-image:radial-gradient(90% 120% at 50% 0%,#2c2036 0%,${NOCHE} 62%);padding:34px 30px 38px;border-radius:26px 26px 0 0;text-align:center">
    <a href="${SITIO}" style="text-decoration:none"><table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td style="vertical-align:middle;padding-right:9px"><img src="${OS}/logo-correo-blanco.png" width="24" height="24" alt="" style="display:block;border:0"></td>
      <td style="vertical-align:middle;font-size:16px;font-weight:700;letter-spacing:-.3px;color:${CLARO}">Vorka <span style="color:rgba(244,242,245,.5);font-weight:600">México</span></td>
    </tr></table></a>
    ${etiqueta && etiqueta !== 'Vorka México' ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:24px auto 0"><tr><td style="border:1px solid rgba(200,164,92,.45);border-radius:999px;padding:6px 14px;font-size:10.5px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:${C.oro}">${esc(etiqueta)}</td></tr></table>` : ''}
    ${titulo ? `<div class="vk-h1" style="font-size:32px;line-height:1.12;font-weight:800;letter-spacing:-1px;color:${CLARO};margin:${etiqueta && etiqueta !== 'Vorka México' ? '16px' : '26px'} auto 0;max-width:470px">${esc(titulo)}</div>
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:20px auto 0"><tr><td style="width:44px;height:3px;line-height:3px;font-size:0;border-radius:3px;background:${C.oro};background-image:linear-gradient(100deg,#6f5420 0%,#a8853f 35%,#e2c27c 62%,#8a6a2c 100%)">&nbsp;</td></tr></table>` : ''}
  </td></tr>
  <tr><td class="vk-pad" style="padding:36px 38px 12px">
    ${cuerpo}
  </td></tr>
  <tr><td class="vk-pie" bgcolor="${NOCHE}" align="center" style="background:${NOCHE};padding:34px 30px 30px;border-radius:0 0 26px 26px;text-align:center">
    <a href="${SITIO}" style="text-decoration:none"><img src="${OS}/logo-correo-blanco.png" width="26" height="26" alt="Vorka México" style="display:inline-block;border:0"></a>
    <div style="font-size:15px;line-height:1.45;font-weight:600;letter-spacing:-.1px;color:rgba(244,242,245,.82);margin:12px 0 0">Definimos el juego con quienes lo juegan.</div>
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto 20px"><tr><td style="width:44px;height:2px;line-height:2px;font-size:0;border-radius:2px;background:${C.oro};background-image:linear-gradient(100deg,#6f5420 0%,#a8853f 35%,#e2c27c 62%,#8a6a2c 100%)">&nbsp;</td></tr></table>
    <a href="${SITIO}" style="display:inline-block;font-size:19px;font-weight:800;letter-spacing:-.3px;color:${C.oro};text-decoration:none">vorka.mx</a>
    <div style="font-size:13px;line-height:2;margin:14px 0 0">
      <a href="${SITIO}/sparks/" style="color:rgba(244,242,245,.62);text-decoration:none">Revista Sparks</a><span style="color:rgba(244,242,245,.25)">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${SITIO}/tienda/" style="color:rgba(244,242,245,.62);text-decoration:none">Tienda</a><span style="color:rgba(244,242,245,.25)">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="https://www.instagram.com/vorka.mx/" style="color:rgba(244,242,245,.62);text-decoration:none">Instagram</a><span style="color:rgba(244,242,245,.25)">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="https://www.linkedin.com/company/vorkamx/" style="color:rgba(244,242,245,.62);text-decoration:none">LinkedIn</a>
    </div>
  </td></tr>
  </table>
</td></tr>
<tr><td align="center" style="padding:20px 16px 6px;font-size:12px;line-height:1.8;color:${C.gris2};text-align:center">
  Vorka México · Guanajuato, México<br>
  ${pie ? `${pie}<br>` : ''}<a href="${SITIO}/privacidad/" style="color:${C.gris2};text-decoration:underline">Aviso de privacidad</a> &nbsp;·&nbsp; <a href="mailto:hola@vorka.mx" style="color:${C.gris2};text-decoration:underline">hola@vorka.mx</a>
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
