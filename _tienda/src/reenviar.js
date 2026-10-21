// /descargas/reenviar · pide un enlace nuevo con el correo de la compra.
// Siempre la misma respuesta (exista o no la compra) para no revelar quién ha comprado.
// El envío corre en segundo plano (waitUntil) para que el tiempo de respuesta tampoco lo delate.
import { z } from 'zod';
import { all, sha256, correoOculto } from './util.js';
import { dentroDelLimite } from './modelo.js';
import { reenviarEnlace } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, CHECK } from './marco.generado.js';

// trim antes de validar: los teclados de celular suelen agregar un espacio al final
const Esquema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email().max(254)), sitio: z.string().max(0).optional() }); // sitio = trampa para bots
const VENTANA = 3600;
const MAX_IP = 10;     // por hora
const MAX_EMAIL = 3;   // por hora
const MAX_ORDENES = 5; // reenvía las 5 compras pagadas más recientes

const formulario = ({ error = '', email = '' } = {}) => `
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Descargas</span>
  <h1 class="t-h1">Recupera tus archivos</h1>
  <p class="t-lead">Escribe el correo con el que compraste y te mandamos un enlace nuevo, válido por 7 días.</p>
  <form class="t-form" method="post" action="/descargas/reenviar" novalidate>
    <div class="t-campo">
      <label for="email">Correo electrónico</label>
      <input id="email" name="email" type="email" autocomplete="email" inputmode="email" required value="${esc(email)}"${error ? ' aria-invalid="true" aria-describedby="email-error"' : ''}>
      ${error ? `<p class="t-error" id="email-error" role="alert">${esc(error)}</p>` : ''}
    </div>
    <div class="t-trampa" aria-hidden="true"><label for="sitio">No llenar</label><input id="sitio" name="sitio" tabindex="-1" autocomplete="off"></div>
    <button class="btn tinta" type="submit">Enviarme el enlace ${FLECHA}</button>
  </form>
  <p class="t-nota">¿Ya no tienes acceso a ese correo? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tu nombre y la fecha de compra.</p>
</div></section>`;

const base = { titulo: 'Recupera tus archivos · Vorka México', descripcion: 'Pide un enlace nuevo para descargar tus compras de la tienda de Vorka México.', ruta: '/descargas/reenviar', noindex: true };

export const paginaReenviar = () => pagina({ ...base, cuerpo: formulario() });

export const RESPUESTA = 'Si ese correo tiene compras con nosotros, en unos minutos te llegará un enlace nuevo. Revisa también spam o promociones.';

export async function postReenviar(req, env, ctx) {
  const datos = Object.fromEntries(await req.formData().catch(() => new FormData()));
  const v = Esquema.safeParse(datos);
  if (!v.success) {
    if (datos.sitio) return listo(); // bot: misma respuesta, nada más
    return pagina({ ...base, status: 400, cuerpo: formulario({ error: 'Escribe un correo válido.', email: datos.email || '' }) });
  }
  const email = v.data.email.trim().toLowerCase();

  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (!(await dentroDelLimite(env, `reenviar:ip:${await sha256(ip)}`, MAX_IP, VENTANA)))
    return pagina({ ...base, status: 429, cuerpo: aviso({ clase: 'alerta', titulo: 'Demasiados intentos', texto: 'Espera un rato y vuelve a intentarlo. Si necesitas ayuda, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.' }) });

  // Por correo: al pasarse del límite la respuesta es la misma, solo que no se envía nada
  if (await dentroDelLimite(env, `reenviar:email:${await sha256(email)}`, MAX_EMAIL, VENTANA)) {
    const trabajo = (async () => {
      const ordenes = await all(env, "SELECT id FROM orders WHERE email = ? AND estado = 'paid' ORDER BY paid_at DESC LIMIT ?", email, MAX_ORDENES);
      for (const o of ordenes) {
        try { await reenviarEnlace(env, o.id, { publico: true }); }
        catch (e) { console.error('reenviar', o.id, correoOculto(email), e.message); }
      }
    })();
    ctx?.waitUntil ? ctx.waitUntil(trabajo) : await trabajo;
  }
  return listo();
}

const listo = () => pagina({ ...base, cuerpo: aviso({ icono: CHECK, clase: 'exito', titulo: 'Revisa tu correo', texto: RESPUESTA,
  extra: `<div class="botones t-centro"><a class="btn blanco" href="/tienda/">Volver a la tienda</a></div>` }) });
