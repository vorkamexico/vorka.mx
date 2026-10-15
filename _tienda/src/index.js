// Tienda Vorka México · punto de entrada del Worker
// Rutas (se irán llenando por bloques): /tienda*, /api/*, /descargas*
import { json, fail } from './util.js';
import { listarProductos } from './modelo.js';
import { checkout } from './checkout.js';
import { webhook } from './webhook.js';
import { paginaDescargas, bajarArchivo } from './descargas.js';
import { paginaGracias, apiOrden } from './gracias.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/tienda/salud') return json({ ok: true });
      if (url.pathname === '/api/tienda/productos' && request.method === 'GET')
        return json((await listarProductos(env)).map(({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria }) =>
          ({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria })));
      if (url.pathname === '/api/checkout' && request.method === 'POST') return await checkout(request, env);
      const ord = url.pathname.match(/^\/api\/ordenes\/([0-9a-f-]{36})$/);
      if (ord && request.method === 'GET') return await apiOrden(env, ord[1]);
      if (url.pathname === '/tienda/gracias' || url.pathname === '/tienda/gracias/') return await paginaGracias(env, url);
      const desc = url.pathname.match(/^\/descargas\/([^/]{1,100})\/?(?:(\d{1,3})\/?)?$/);
      if (desc && desc[1] !== 'reenviar' && ['GET', 'HEAD'].includes(request.method))
        return await (desc[2] === undefined ? paginaDescargas(env, desc[1]) : bajarArchivo(env, desc[1], desc[2], request.method));
      const wh = url.pathname.match(/^\/api\/webhooks\/([a-z]+)$/);
      if (wh && request.method === 'POST') return await webhook(request, env, wh[1]);
      // Solo en desarrollo (.dev.vars): CSS, imágenes y demás páginas del sitio salen del servidor estático local
      if (env.ESTATICO_DEV) return fetch(env.ESTATICO_DEV + url.pathname + url.search);
      return fail('No encontrado', 404);
    } catch (err) {
      console.error('tienda', url.pathname, err?.message);
      return fail('Error interno', 500);
    }
  },
};
