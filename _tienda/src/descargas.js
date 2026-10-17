// /descargas/<token>            → lista de archivos de la compra
// /descargas/<token>/<n>        → descarga el archivo n desde R2 (Content-Disposition: attachment)
// El bucket es privado: los archivos solo salen por aquí, nunca con URL pública de R2.
import { one, all, run, fail } from './util.js';
import { hashToken, MAX_DESCARGAS, personalizeFile } from './entrega.js';
import { pagina, aviso, esc } from './paginas.js';
import { FLECHA, DOC } from './marco.generado.js';

const FORMATO = /^[a-f0-9]{64}$/;
// El token va en la URL: que no se filtre por Referer a otros sitios
const SIN_REFERER = { 'referrer-policy': 'no-referrer' };

/**
 * Valida el token. Devuelve { ok, motivo, token, orden, archivos }.
 * motivo: 'invalido' | 'revocado' | 'vencido'. archivos: [{ n, key, nombre, usadas, restantes }]
 */
export async function validarToken(env, token, ahora = Date.now()) {
  if (!FORMATO.test(token || '')) return { ok: false, motivo: 'invalido' };
  const t = await one(env, 'SELECT * FROM download_tokens WHERE token_hash = ?', await hashToken(env, token));
  if (!t) return { ok: false, motivo: 'invalido' };
  const orden = await one(env, 'SELECT * FROM orders WHERE id = ?', t.order_id);
  if (t.revocado || !orden || orden.estado !== 'paid') return { ok: false, motivo: 'revocado' };
  if (new Date(t.expires_at).getTime() < ahora) return { ok: false, motivo: 'vencido', orden };
  const items = await all(env, 'SELECT i.nombre producto, p.r2_keys, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ? ORDER BY i.id', orden.id);
  // Productos de acceso (contenido.acceso): en lugar de archivos, un botón que abre la app con este mismo token
  const accesos = items.map(i => { try { return { producto: i.producto, ...JSON.parse(i.contenido || '{}').acceso }; } catch { return null; } }).filter(a => a?.app);
  const usadas = JSON.parse(t.descargas || '{}');
  const archivos = items.flatMap(i => JSON.parse(i.r2_keys || '[]').map(a => ({ ...a, producto: i.producto })))
    .map((a, n) => ({ n, key: a.key, nombre: a.nombre, producto: a.producto, usadas: usadas[a.key] || 0, restantes: Math.max(0, MAX_DESCARGAS - (usadas[a.key] || 0)) }));
  return { ok: true, token: t, orden, archivos, accesos };
}

const ICONO_RELOJ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const ICONO_CANDADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const reenviar = `<div class="botones t-centro"><a class="btn tinta" href="/descargas/reenviar">Pedir un enlace nuevo ${FLECHA}</a></div>`;

function paginaError(motivo) {
  const textos = {
    vencido: ['Tu enlace venció', `Los enlaces de descarga duran 7 días. Pide uno nuevo con el correo de tu compra y te lo mandamos al momento.`, ICONO_RELOJ],
    agotado: ['Llegaste al límite de descargas', `Cada archivo se puede descargar hasta ${MAX_DESCARGAS} veces por enlace. Pide un enlace nuevo con el correo de tu compra.`, ICONO_RELOJ],
    revocado: ['Este enlace ya no está activo', 'Si crees que es un error, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y lo revisamos.', ICONO_CANDADO],
    invalido: ['Enlace no válido', 'Revisa que hayas copiado el enlace completo del correo. Si sigue sin funcionar, pide uno nuevo.', ICONO_CANDADO],
  };
  const [titulo, texto, icono] = textos[motivo] || textos.invalido;
  return pagina({
    titulo: `${titulo} · Vorka México`, ruta: '/descargas/', noindex: true, status: motivo === 'invalido' ? 404 : 410, headers: SIN_REFERER,
    cuerpo: aviso({ icono, clase: 'alerta', titulo, texto, extra: motivo === 'revocado' ? '' : reenviar }),
  });
}

export async function paginaDescargas(env, token) {
  const v = await validarToken(env, token);
  if (!v.ok) return paginaError(v.motivo);
  const vence = new Date(v.token.expires_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long' });
  const filas = v.archivos.map(a => `
    <li class="t-archivo${a.restantes ? '' : ' agotado'}">
      <span class="t-archivo-i" aria-hidden="true">${DOC}</span>
      <span class="t-archivo-t"><b>${esc(a.nombre)}</b><small>${a.restantes ? `Te quedan ${a.restantes} de ${MAX_DESCARGAS} descargas` : 'Sin descargas disponibles'}</small></span>
      ${a.restantes
        ? `<a class="btn tinta chico" href="/descargas/${token}/${a.n}" download aria-label="Descargar ${esc(a.nombre)}">Descargar</a>`
        : '<span class="btn blanco chico" aria-disabled="true">Agotado</span>'}
    </li>`).join('') + v.accesos.map(a => `
    <li class="t-archivo">
      <span class="t-archivo-i" aria-hidden="true">${FLECHA}</span>
      <span class="t-archivo-t"><b>${esc(a.producto)}</b><small>Acceso en línea durante un año desde tu compra</small></span>
      <a class="btn tinta chico" href="/${esc(a.app)}/entrar/${token}">${esc(a.boton || 'Entrar')}</a>
    </li>`).join('');
  return pagina({
    titulo: 'Tus descargas · Vorka México', ruta: '/descargas/', noindex: true, headers: SIN_REFERER,
    cuerpo: `
<section class="t-sec"><div class="marco t-estrecho">
  <span class="etiqueta">Compra confirmada</span>
  <h1 class="t-h1">${v.archivos.length ? 'Tus archivos' : 'Tu acceso'}, ${esc(v.orden.nombre.split(' ')[0])}</h1>
  <p class="t-lead">${v.archivos.length ? `Descárgalos y guárdalos en tu computadora o en tu nube. Este enlace funciona hasta el ${vence}.` : 'Entra desde aquí en cada dispositivo que quieras usar.'}</p>
  <ul class="t-archivos">${filas}</ul>
  <p class="t-nota">¿Algún archivo llegó dañado o no abre? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y te lo reponemos.</p>
</div></section>`,
  });
}

// Nombre seguro para Content-Disposition (ASCII + versión UTF-8)
const disposicion = nombre => {
  const ascii = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\- ]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
};

export async function bajarArchivo(env, token, n, metodo = 'GET') {
  const v = await validarToken(env, token);
  if (!v.ok) return paginaError(v.motivo);
  const a = v.archivos[Number(n)];
  if (!a) return paginaError('invalido');

  const obj = await env.PRODUCTOS.head(a.key);
  if (!obj) {
    console.error('descargas: falta en R2', a.key);
    return fail('El archivo no está disponible por ahora. Escríbenos a hola@vorka.mx.', 503);
  }
  if (metodo === 'HEAD') return new Response(null, { headers: { 'content-length': String(obj.size) } });

  // Suma la descarga solo si no pasó del límite (atómico: dos clics a la vez no rebasan el máximo)
  const ruta = `$."${a.key}"`;
  const r = await run(env,
    `UPDATE download_tokens SET descargas = json_set(descargas, ?, COALESCE(json_extract(descargas, ?), 0) + 1)
     WHERE id = ? AND revocado = 0 AND COALESCE(json_extract(descargas, ?), 0) < ?`,
    ruta, ruta, v.token.id, ruta, MAX_DESCARGAS);
  if (!r.meta.changes) return paginaError('agotado');

  const archivo = await personalizeFile(v.orden, { key: a.key, nombre: a.key.split('/').pop(), objeto: await env.PRODUCTOS.get(a.key) });
  return new Response(archivo.objeto.body, {
    headers: {
      'content-type': archivo.objeto.httpMetadata?.contentType || 'application/octet-stream',
      'content-length': String(archivo.objeto.size),
      'content-disposition': disposicion(archivo.nombre),
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      ...SIN_REFERER,
    },
  });
}
