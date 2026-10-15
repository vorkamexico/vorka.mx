// Tienda Vorka México · punto de entrada del Worker
// Rutas (se irán llenando por bloques): /tienda*, /api/*, /descargas*
import { json, fail } from './util.js';
import { listarProductos } from './modelo.js';
import { checkout } from './checkout.js';
import { webhook } from './webhook.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/tienda/salud') return json({ ok: true });
      if (url.pathname === '/api/tienda/productos' && request.method === 'GET')
        return json((await listarProductos(env)).map(({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria }) =>
          ({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria })));
      if (url.pathname === '/api/checkout' && request.method === 'POST') return await checkout(request, env);
      const wh = url.pathname.match(/^\/api\/webhooks\/([a-z]+)$/);
      if (wh && request.method === 'POST') return await webhook(request, env, wh[1]);
      return fail('No encontrado', 404);
    } catch (err) {
      console.error('tienda', url.pathname, err?.message);
      return fail('Error interno', 500);
    }
  },
};
