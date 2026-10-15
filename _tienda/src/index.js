// Tienda Vorka México · punto de entrada del Worker
// Rutas (se irán llenando por bloques): /tienda*, /api/*, /descargas*
import { WorkerEntrypoint } from 'cloudflare:workers';
import { json, fail } from './util.js';
import { listarProductos } from './modelo.js';
import { checkout } from './checkout.js';
import { webhook } from './webhook.js';
import { paginaDescargas, bajarArchivo } from './descargas.js';
import { paginaGracias, apiOrden } from './gracias.js';
import { paginaReenviar, postReenviar } from './reenviar.js';
import { paginaCatalogo, paginaProducto, sitemapTienda } from './tienda.js';
import * as admin from './admin.js';
import { ESTILOS } from './paginas.js';

// Panel de la tienda en Vorka OS (service binding RPC). No tiene ruta pública: solo Workers con el binding pueden llamarlo.
export class Admin extends WorkerEntrypoint {
  resumen(f) { return admin.resumen(this.env, f); }
  ordenes(f) { return admin.ordenes(this.env, f); }
  orden(id) { return admin.orden(this.env, id); }
  reenviar(id) { return admin.reenviar(this.env, id); }
  revocar(id) { return admin.revocar(this.env, id); }
  exportarCSV(f) { return admin.exportarCSV(this.env, f); }
  productos() { return admin.productos(this.env); }
  async producto(id) {
    const p = await admin.productoPorId(this.env, id);
    if (p) p.contenido.faq = (p.contenido.faq || []).map(f => ({ p: f.p, r: admin.faqComoTexto(f.r) }));
    return p;
  }
  guardarProducto(d) { return admin.guardarProducto(this.env, d); }
  borrarProducto(id) { return admin.borrarProducto(this.env, id); }
  subirArchivo(id, a) { return admin.subirArchivo(this.env, id, a); }
  quitarArchivo(id, key) { return admin.quitarArchivo(this.env, id, key); }
  subirPortada(id, a) { return admin.subirPortada(this.env, id, a); }
  quitarPortada(id) { return admin.quitarPortada(this.env, id); }
  afiliados() { return admin.afiliados(this.env); }
  guardarAfiliado(d) { return admin.guardarAfiliado(this.env, d); }
  reporteAfiliados(f) { return admin.reporteAfiliados(this.env, f); }
}

export default {
  async fetch(request, env, ctx) {
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
      if (url.pathname === '/descargas/reenviar' || url.pathname === '/descargas/reenviar/') {
        if (request.method === 'POST') return await postReenviar(request, env, ctx);
        if (request.method === 'GET') return paginaReenviar();
      }
      const desc = url.pathname.match(/^\/descargas\/([^/]{1,100})\/?(?:(\d{1,3})\/?)?$/);
      if (desc && desc[1] !== 'reenviar' && ['GET', 'HEAD'].includes(request.method))
        return await (desc[2] === undefined ? paginaDescargas(env, desc[1]) : bajarArchivo(env, desc[1], desc[2], request.method));
      if (request.method === 'GET' || request.method === 'HEAD') {
        if (url.pathname === '/tienda' || url.pathname === '/tienda/') return await paginaCatalogo(env, request, url);
        if (url.pathname === '/tienda/sitemap.xml') return await sitemapTienda(env);
        if (url.pathname === '/tienda/estilos.css') return new Response(ESTILOS, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
        // Portadas (públicas). Solo el prefijo portadas/: los archivos de venta nunca salen por aquí.
        const img = url.pathname.match(/^\/tienda\/img\/(portadas\/[a-z0-9-]+\.(?:jpg|png|webp))$/);
        if (img) {
          const o = await env.PRODUCTOS.get(img[1]);
          if (!o) return fail('No encontrado', 404);
          return new Response(o.body, { headers: { 'content-type': o.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
        }
        const prod = url.pathname.match(/^\/tienda\/([a-z0-9-]{1,80})\/?$/);
        if (prod) return await paginaProducto(env, request, url, prod[1]);
      }
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
