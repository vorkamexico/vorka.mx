// Correos del marketplace de creadores (misma plantilla que los de la tienda)
import { marco, boton, enviar, esc, P, SOPORTE } from './correo.js';
import { pesos } from './util.js';

const mandar = (env, para, asunto, cuerpoHtml, texto, idempotencia) =>
  enviar(env, { para, asunto, html: marco(asunto, cuerpoHtml), texto: `${texto}\n\nVorka México · Guanajuato, México`, idempotencia });
const nombre1 = n => String(n || '').split(' ')[0];

export function solicitudRecibida(env, c) {
  return mandar(env, c.email, 'Recibimos tu solicitud para vender en Vorka México', `
<p style="${P}">Hola, ${esc(nombre1(c.nombre))}:</p>
<p style="${P}">Gracias por querer vender tus productos en la tienda de Vorka México. Revisamos cada solicitud a mano y te respondemos por este medio en unos días.</p>
<p style="${P}">Si quieres agregar algo, responde a este correo.</p>`,
  `Hola, ${nombre1(c.nombre)}:\n\nGracias por querer vender tus productos en la tienda de Vorka México. Revisamos cada solicitud a mano y te respondemos por este medio en unos días.`);
}

export function avisoNuevaSolicitud(env, c) {
  return mandar(env, SOPORTE.correo, `Nueva solicitud de creador: ${c.nombre}`, `
<p style="${P}"><b>${esc(c.nombre)}</b> (${esc(c.email)}) quiere vender en la tienda.</p>
<p style="${P}">${esc(c.que_vende).replace(/\n/g, '<br>')}</p>
<p style="${P}">Revísala en Vorka OS → Tienda → Creadores.</p>`,
  `${c.nombre} (${c.email}) quiere vender en la tienda.\n\n${c.que_vende}\n\nRevísala en Vorka OS → Tienda → Creadores.`);
}

export function enlaceAcceso(env, c, url, { bienvenida = false } = {}) {
  const asunto = bienvenida ? '¡Bienvenido a la tienda de Vorka México!' : 'Tu enlace para entrar al portal de creadores';
  return mandar(env, c.email, asunto, `
<p style="${P}">Hola, ${esc(nombre1(c.nombre))}:</p>
${bienvenida ? `<p style="${P}">Aprobamos tu solicitud. Ya puedes configurar cómo recibes tus pagos y subir tus productos.</p>` : `<p style="${P}">Usa este botón para entrar a tu portal de creador.</p>`}
${boton(url, 'Entrar a mi portal')}
<p style="${P};color:#8b8790;font-size:13px">El enlace funciona una sola vez durante 30 minutos. Si vence, pide otro en vorka.mx/creadores/entrar.</p>`,
  `Hola, ${nombre1(c.nombre)}:\n\n${bienvenida ? 'Aprobamos tu solicitud. Ya puedes configurar cómo recibes tus pagos y subir tus productos.' : 'Entra a tu portal de creador con este enlace:'}\n${url}\n\nEl enlace funciona una sola vez durante 30 minutos.`,
  `acceso-${url.slice(-24)}`);
}

export function solicitudRechazada(env, c) {
  return mandar(env, c.email, 'Sobre tu solicitud para vender en Vorka México', `
<p style="${P}">Hola, ${esc(nombre1(c.nombre))}:</p>
<p style="${P}">Gracias por tu interés. Por ahora no podemos sumar tu propuesta a la tienda.</p>
${c.nota ? `<p style="${P}">${esc(c.nota)}</p>` : ''}
<p style="${P}">Puedes volver a escribirnos más adelante.</p>`,
  `Hola, ${nombre1(c.nombre)}:\n\nGracias por tu interés. Por ahora no podemos sumar tu propuesta a la tienda.\n${c.nota || ''}`);
}

export function productoRevisado(env, c, p, aprobado) {
  const asunto = aprobado ? `Tu producto ya está a la venta: ${p.nombre}` : `Tu producto necesita cambios: ${p.nombre}`;
  const url = `${env.SITE_URL}/creadores/productos/${p.id}`;
  return mandar(env, c.email, asunto, `
<p style="${P}">Hola, ${esc(nombre1(c.nombre))}:</p>
<p style="${P}">${aprobado ? `<b>${esc(p.nombre)}</b> ya está publicado en la tienda.` : `Revisamos <b>${esc(p.nombre)}</b> y necesita algunos cambios antes de publicarse.`}</p>
${p.nota_revision ? `<p style="${P}">${esc(p.nota_revision)}</p>` : ''}
${boton(aprobado ? `${env.SITE_URL}/tienda/${p.slug}/` : url, aprobado ? 'Ver en la tienda' : 'Editar mi producto')}`,
  `Hola, ${nombre1(c.nombre)}:\n\n${aprobado ? `${p.nombre} ya está publicado en la tienda.` : `${p.nombre} necesita cambios antes de publicarse.`}\n${p.nota_revision || ''}\n${aprobado ? `${env.SITE_URL}/tienda/${p.slug}/` : url}`);
}

export function ventaNueva(env, c, t, productos) {
  return mandar(env, c.email, `¡Vendiste ${productos}!`, `
<p style="${P}">Hola, ${esc(nombre1(c.nombre))}:</p>
<p style="${P}">Alguien compró <b>${esc(productos)}</b> en la tienda de Vorka México.</p>
<p style="${P}">Recibirás <b>${pesos(t.monto_centavos)}</b> (venta ${pesos(t.venta_centavos)} − comisión de Vorka ${pesos(t.comision_vorka_centavos)} − comisión de Stripe ${pesos(t.comision_stripe_centavos)}). Se transfiere a tu cuenta en 7 días, cuando termina el plazo de reembolso.</p>
${boton(`${env.SITE_URL}/creadores/panel`, 'Ver mis ventas')}`,
  `Hola, ${nombre1(c.nombre)}:\n\nAlguien compró ${productos}. Recibirás ${pesos(t.monto_centavos)} en 7 días.\n${env.SITE_URL}/creadores/panel`);
}
