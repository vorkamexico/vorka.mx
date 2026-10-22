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
import { procesarTransferencias, refrescarCreador, repartosPendientes } from './marketplace.js';
import { rutasCreadores } from './creadores.js';
import { all } from './util.js';
import { recordarOrden, retomarPago } from './recordatorio.js';
import { rutasSimulador } from './simulador/index.js';
import { paginaBrindi, validarAcceso, comprasApp, resumenApp, productosApp } from './brindi.js';
import { paginaCupo } from './cupo.js';
import { paginaVuelve } from './vuelve.js';
import { cargarTemporada } from './temporadas.js';
import { suscripcionApp, portalApp, resumenSuscripciones } from './suscripciones.js';
import { rutasPuntos } from './puntos.js';
import { rutasSocios } from './socios-portal.js';
import * as socios from './socios.js';
import { paginaRegalo, canjearRegalo, cortesias, crearCortesias, revocarCortesias, apagarLiga, prenderLiga, ligasDe, borrarCortesia, revocarRegalos } from './regalos.js';

// Panel de la tienda en Vorka OS (service binding RPC). No tiene ruta pública: solo Workers con el binding pueden llamarlo.
export class Admin extends WorkerEntrypoint {
  resumen(f) { return admin.resumen(this.env, f); }
  ordenes(f) { return admin.ordenes(this.env, f); }
  orden(id) { return admin.orden(this.env, id); }
  reenviar(id) { return admin.reenviar(this.env, id); }
  revocar(id) { return admin.revocar(this.env, id); }
  recordar(id) { return recordarOrden(this.env, id); }
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
  resumenPuntos() { return admin.resumenPuntos(this.env); }
  // Tema de temporada de la tienda (automático, apagado o uno fijo)
  temporada() { return admin.temporada(this.env); }
  guardarTemporada(d) { return admin.guardarTemporada(this.env, d); }
  // Puntos Vorka: sugerencias de productos (aceptar con el producto → puntos dobles para quien la sugirió) y promociones 2×
  sugerenciasPuntos() { return admin.sugerenciasPuntos(this.env); }
  decidirSugerencia(id, d) { return admin.decidirSugerencia(this.env, id, d); }
  promosPuntos() { return admin.promosPuntos(this.env); }
  guardarPromo(d) { return admin.guardarPromo(this.env, d); }
  borrarPromo(id) { return admin.borrarPromo(this.env, id); }
  // Marketplace de creadores
  pendientesMarketplace() { return admin.pendientesMarketplace(this.env); }
  creadores() { return admin.creadores(this.env); }
  decidirCreador(id, d) { return admin.decidirCreador(this.env, id, d); }
  comisionCreador(id, pct) { return admin.comisionCreador(this.env, id, pct); }
  revisarStripeCreador(id) { return admin.revisarStripeCreador(this.env, id); }
  revision() { return admin.revision(this.env); }
  decidirProducto(id, d) { return admin.decidirProducto(this.env, id, d); }
  transferencias(f) { return admin.transferencias(this.env, f); }
  archivoRevision(id, key) { return admin.archivoRevision(this.env, id, key); }
  // Cortesías: accesos gratis con ligas de un solo uso (Simulador PAA y demás productos regalables)
  cortesias() { return cortesias(this.env); }
  crearCortesias(d) { return crearCortesias(this.env, d); }
  revocarCortesias(id) { return revocarCortesias(this.env, id); }
  borrarCortesia(id) { return borrarCortesia(this.env, id); }
  // Ligas de regalo (compras para regalar y cortesías): ver, apagar y volver a prender una por una
  ligas(orderId) { return ligasDe(this.env, orderId); }
  apagarLiga(id) { return apagarLiga(this.env, id); }
  prenderLiga(id) { return prenderLiga(this.env, id); }
  async apagarLigasOrden(orderId) { await revocarRegalos(this.env, String(orderId)); return { ok: true }; }
  // Órdenes sin pagar: archivarlas (dejan de verse; si se pagan después, vuelven solas)
  archivarOrden(id) { return admin.archivarOrden(this.env, id); }
  archivarSinPagar(f) { return admin.archivarSinPagar(this.env, f); }
  // Apps de Diversificación en Vorka OS (Brindi): entrada con el correo de compra, créditos, ventas y productos
  validarAcceso(token, app) { return validarAcceso(this.env, token, app); }
  comprasApp(email, app) { return comprasApp(this.env, email, app); }
  resumenApp(app, f) { return resumenApp(this.env, app, f); }
  productosApp(app) { return productosApp(this.env, app); }
  // Apps por suscripción (Vuelve): estado de la suscripción de un correo, portal de Stripe y resumen para Diversificación
  suscripcionApp(email, app) { return suscripcionApp(this.env, email, app); }
  portalApp(email, app, volver) { return portalApp(this.env, email, app, volver); }
  resumenSuscripciones(app) { return resumenSuscripciones(this.env, app); }
  // Socios Vorka (solo por invitación): alta y edición, niveles, cola de pagos por SPEI (manual) y CSV
  resumenSocios() { return socios.resumenSocios(this.env); }
  socios() { return socios.listaSocios(this.env); }
  socio(id) { return socios.detalleSocio(this.env, id); }
  guardarSocio(d) { return socios.guardarSocio(this.env, d); }
  estadoSocio(id, estado) { return socios.estadoSocio(this.env, id, estado); }
  invitarSocio(id) { return socios.invitarSocio(this.env, id); }
  ajustesSocios() { return socios.ajustesSocios(this.env); }
  guardarAjustesSocios(d) { return socios.guardarAjustesSocios(this.env, d); }
  pagosSocios() { return socios.pagosSocios(this.env); }
  marcarPagoSocio(id, d) { return socios.marcarPagoSocio(this.env, id, d); }
  cancelarPagoSocio(id, nota) { return socios.cancelarPago(this.env, id, String(nota || '').slice(0, 280) || 'Cancelado desde el panel.'); }
  loteSociosAhora() { return socios.loteSemanal(this.env, new Date(), { forzar: true }); }
  exportarSociosCSV(f) { return socios.exportarSociosCSV(this.env, f); }
  anularComisionSocio(id) { return socios.anularComision(this.env, id); }
}

// Ligas cortas de las apps de eventos: vorka.mx/cupo/<liga> y vorka.mx/brindi/<liga>[/<invitado>] llevan al evento en os.vorka.mx
const APPS = 'https://os.vorka.mx';
export function ligaCorta(url) {
  const p = url.pathname;
  if (!/^\/(cupo|brindi|vuelve)(\/|$)/.test(p)) return null;
  // Vuelve: vorka.mx/vuelve/<negocio> es la liga del cartel con QR → registro de clientes en os.vorka.mx/v/<negocio>;
  // vorka.mx/vuelve/negocios es el directorio de negocios Vuelve (os.vorka.mx/negocios)
  if (/^\/vuelve\/negocios\/?$/i.test(p)) return new Response(null, { status: 302, headers: { location: `${APPS}/negocios${url.search}`, 'cache-control': 'no-store' } });
  if (p.startsWith('/vuelve')) {
    const v = p.match(/^\/vuelve\/([a-z0-9-]{3,60})\/?$/i);
    return new Response(null, { status: v ? 302 : 301, headers: { location: v ? `${APPS}/v/${v[1].toLowerCase()}${url.search}` : `/tienda/vuelve/${url.search}`, 'cache-control': 'no-store' } });
  }
  const ir = (destino, codigo = 302) => new Response(null, { status: codigo, headers: { location: destino, 'cache-control': 'no-store' } });
  if (p === '/cupo' || p === '/cupo/') return ir(`${APPS}/cupo/${url.search}`, 301);
  if (p === '/brindi' || p === '/brindi/') return ir(`/tienda/brindi/${url.search}`, 301);
  let m = p.match(/^\/cupo\/([a-z0-9-]{3,60})\/?$/i);
  if (m) return ir(`${APPS}/e/${m[1].toLowerCase()}${url.search}`);
  m = p.match(/^\/brindi\/([a-z0-9-]{3,60})(?:\/([a-z0-9]{6,40}))?\/?$/i);
  if (m) return ir(`${APPS}/i/${m[1].toLowerCase()}${m[2] ? `/${m[2]}` : ''}${url.search}`);
  return ir(p.startsWith('/cupo') ? `${APPS}/cupo/` : '/tienda/brindi/');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'GET' && !url.pathname.startsWith('/api/')) await cargarTemporada(env);   // el tema de temporada (en memoria un minuto)
    const res = await atender(request, env, ctx, url);
    // Liga de un socio (?socio=CODIGO o ?codigo=CODIGO): deja la cookie de atribución (30 días) en la página que se abra
    if (request.method === 'GET' && !url.pathname.startsWith('/api/') && (url.searchParams.has('socio') || url.searchParams.has('codigo'))) {
      const c = await socios.cookieDeVisita(env, url).catch(e => { console.error('socio visita', e?.message); return null; });
      if (c) { const r = new Response(res.body, res); r.headers.append('set-cookie', c); return r; }
    }
    return res;
  },

  // Cada hora: transferencias a creadores que ya pasaron su plazo, y estado de cuentas de Stripe en revisión.
  // Socios: libera comisiones que pasaron la retención y, los lunes (hora del centro de México), arma el lote de pagos.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try { console.log('socios', JSON.stringify(await socios.loteSemanal(env))); }
      catch (e) { console.error('cron socios', e?.message); }
      try {
        if (!env.STRIPE_SECRET_KEY) return;
        const pendientes = await all(env, "SELECT id, stripe_account_id FROM creadores WHERE estado = 'aprobado' AND stripe_account_id IS NOT NULL AND stripe_listo = 0 LIMIT 25");
        for (const c of pendientes) await refrescarCreador(env, c).catch(e => console.error('creador', c.id, e.message));
        const programadas = await repartosPendientes(env);
        console.log('transferencias', JSON.stringify({ programadas, ...(await procesarTransferencias(env)) }));
      } catch (e) { console.error('cron', e?.message); }
    })());
  },
};

async function atender(request, env, ctx, url) {
  try {
    if (url.pathname === '/api/tienda/salud') return json({ ok: true });
    const corta = ligaCorta(url);
    if (corta) return corta;
    if (/^\/(tienda\/socios|api\/socios)(\/|$)/.test(url.pathname)) { const r = await rutasSocios(request, env, url); if (r) return r; }
    if (/^\/(tienda\/(puntos|cuenta)|api\/puntos)(\/|$)/.test(url.pathname)) { const r = await rutasPuntos(request, env, url); if (r) return r; }
    const sim = await rutasSimulador(request, env, url);
    if (sim) return sim;
    const cr = await rutasCreadores(request, env, ctx, url);
    if (cr) return cr;
    if (url.pathname === '/api/tienda/productos' && request.method === 'GET')
      return json((await listarProductos(env)).map(({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria }) =>
        ({ id, slug, nombre, descripcion_corta, precio_centavos, moneda, imagen, categoria })));
    if (url.pathname === '/api/checkout' && request.method === 'POST') return await checkout(request, env);
    const ord = url.pathname.match(/^\/api\/ordenes\/([0-9a-f-]{36})$/);
    if (ord && request.method === 'GET') return await apiOrden(env, ord[1]);
    if (url.pathname === '/tienda/gracias' || url.pathname === '/tienda/gracias/') return await paginaGracias(env, url);
    const reg = url.pathname.match(/^\/tienda\/regalo\/([^/]{1,100})\/?$/);
    if (reg && (request.method === 'GET' || request.method === 'HEAD')) return await paginaRegalo(env, reg[1]);
    if (url.pathname === '/api/regalo/canjear' && request.method === 'POST') return await canjearRegalo(request, env);
    const ret = url.pathname.match(/^\/tienda\/retomar\/([0-9a-f-]{36})\/?$/);
    if (ret && request.method === 'GET') return await retomarPago(env, ret[1], url);
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
      if (url.pathname === '/tienda/cupo' || url.pathname === '/tienda/cupo/') return url.pathname.endsWith('/') ? await paginaCupo(env, request, url) : Response.redirect(`${url.origin}/tienda/cupo/${url.search}`, 301);
      if (url.pathname === '/tienda/vuelve' || url.pathname === '/tienda/vuelve/') return url.pathname.endsWith('/') ? await paginaVuelve(env, request, url) : Response.redirect(`${url.origin}/tienda/vuelve/${url.search}`, 301);
      if (url.pathname === '/tienda/brindi' || url.pathname === '/tienda/brindi/') return url.pathname.endsWith('/') ? await paginaBrindi(env, request, url) : Response.redirect(`${url.origin}/tienda/brindi/${url.search}`, 301);
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
}
