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
import { paginaCatalogo, paginaProducto, sitemapTienda, refDeVisita } from './tienda.js';
import * as admin from './admin.js';
import { ESTILOS } from './paginas.js';
import { procesarTransferencias, refrescarCreador, repartosPendientes } from './marketplace.js';
import { rutasCreadores } from './creadores.js';
import { all } from './util.js';
import { recordarOrden, retomarPago } from './recordatorio.js';
import { rutasSimulador } from './simulador/index.js';
import { paginaBrindi, validarAcceso, comprasApp, resumenApp, productosApp, VARIANTES } from './brindi.js';
import { paginaCupo } from './cupo.js';
import { paginaVuelve } from './vuelve.js';
import { paginaCuentas } from './cuentas.js';
import { cargarTemporada } from './temporadas.js';
import { suscripcionApp, portalApp, resumenSuscripciones, lugaresApp, creditoApp } from './suscripciones.js';
import { rutasPuntos, codigoDe, saldoDe, nivelActual } from './puntos.js';
import * as retiros from './puntos-retiros.js';
import { paginaRegalo, canjearRegalo, cortesias, crearCortesias, revocarCortesias, apagarLiga, prenderLiga, ligasDe, borrarCortesia, revocarRegalos } from './regalos.js';

// Panel de la tienda en Vorka OS (service binding RPC). No tiene ruta pública: solo Workers con el binding pueden llamarlo.
export class Admin extends WorkerEntrypoint {
  resumen(f) { return admin.resumen(this.env, f); }
  tablero(f) { return admin.tablero(this.env, f); }
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
  // Liga de Puntos Vorka del anfitrión de una invitación (se crea la primera vez): si un invitado contrata desde el pie, gana puntos
  async codigoPuntos(email, nombre) {
    const e = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
    const code = await codigoDe(this.env, e, nombre ? String(nombre).slice(0, 80) : null);
    await this.env.DB.prepare('INSERT OR IGNORE INTO puntos_cuentas (email) VALUES (?)').bind(e).run();
    return code;
  }
  // Resumen de Puntos para el portal de organizadores de Brindi: liga, saldo y nivel (crea la cuenta la primera vez)
  async puntosApp(email, nombre) {
    const code = await this.codigoPuntos(email, nombre);
    if (!code) return null;
    const e = String(email).trim().toLowerCase();
    const [s, n] = await Promise.all([saldoDe(this.env, e), nivelActual(this.env, e)]);
    return { code, liga: `${this.env.SITE_URL || 'https://vorka.mx'}/tienda/brindi/?ref=${code}`, disponibles: s.disponibles, ventas: n.ventas, pct: n.pct,
      nivel: n.nivel.actual.nombre, siguiente: n.nivel.siguiente ? { nombre: n.nivel.siguiente.nombre, pct: n.nivel.siguiente.pct, faltan: n.nivel.faltan } : null };
  }
  // Apps por suscripción (Vuelve): estado de la suscripción de un correo, portal de Stripe y resumen para Diversificación
  suscripcionApp(email, app) { return suscripcionApp(this.env, email, app); }
  portalApp(email, app, volver) { return portalApp(this.env, email, app, volver); }
  // Cuentas: mes gratis por invitar → saldo a favor en el siguiente cobro
  creditoApp(email, app, centavos, motivo) { return creditoApp(this.env, email, app, centavos, motivo); }
  lugaresApp(email, app, extras) { return lugaresApp(this.env, email, app, extras); }
  resumenSuscripciones(app) { return resumenSuscripciones(this.env, app); }
  // Puntos Vorka (Socios Vorka quedó integrado aquí): cuentas, nivel y %, transferencia a cuenta (privada) y CSV
  cuentasPuntos(f) { return retiros.cuentasPuntos(this.env, f); }
  cuentaPuntos(email) { return retiros.cuentaPuntos(this.env, email); }
  habilitarRetiro(email, d) { return retiros.habilitarRetiro(this.env, email, d); }
  retirosPuntos() { return retiros.retirosPuntos(this.env); }
  resumenRetiros() { return retiros.resumenRetiros(this.env); }
  marcarRetiro(id, d) { return retiros.marcarRetiro(this.env, id, d); }
  cancelarRetiro(id, nota) { return retiros.cancelarRetiro(this.env, id, String(nota || '').slice(0, 280) || 'Cancelada desde el panel.'); }
  exportarRetirosCSV(f) { return retiros.exportarRetirosCSV(this.env, f); }
}

// Vuelve: las páginas de los clientes de cada negocio se ven bajo vorka.mx/vuelve, no en os.vorka.mx. La tienda las trae de
// Vorka OS por el enlace directo (service binding OS) y OS arma sus ligas con esta forma (le avisa x-vuelve-base):
//   /vuelve/<negocio> → /v/<negocio> (registro: la liga del cartel con QR) · /vuelve/c/… → /c/… (la tarjeta, su Wallet y avisos)
//   /vuelve/api/… → /api/vuelve/publico/… · /vuelve/negocios → /negocios · logos, fotos, catálogo y tema: la misma ruta
const RECURSOS_VUELVE = /^\/vuelve\/(logo|foto|catalogo|tira)\/[a-z0-9./-]+$|^\/vuelve\/(tema\.js|icono\.png|pase\/vorka\.png)$/;
export function rutaVuelve(p) {
  let m;
  if (/^\/vuelve\/negocios\/?$/i.test(p)) return '/negocios';
  if ((m = p.match(/^\/vuelve\/c\/([a-z0-9./-]+)$/))) return `/c/${m[1]}`;
  if ((m = p.match(/^\/vuelve\/api\/([a-z0-9/-]+)$/))) return `/api/vuelve/publico/${m[1]}`;
  if (RECURSOS_VUELVE.test(p)) return p;
  if ((m = p.match(/^\/vuelve\/([a-z0-9-]{3,60})\/?$/i))) return `/v/${m[1].toLowerCase()}`;
  return null;
}
// Sin cookies de vorka.mx: solo lo que la página necesita (y la IP, para los límites de registro)
const PASAN = ['content-type', 'user-agent', 'accept', 'accept-language', 'cf-connecting-ip', 'if-none-match'];
export async function vuelvePublico(request, env, url) {
  const destino = rutaVuelve(url.pathname);
  if (!destino) return new Response(null, { status: 301, headers: { location: `/tienda/vuelve/${url.search}`, 'cache-control': 'no-store' } });
  const h = new Headers({ 'x-vuelve-base': '1' });
  for (const k of PASAN) { const v = request.headers.get(k); if (v) h.set(k, v); }
  const conCuerpo = !['GET', 'HEAD'].includes(request.method);
  const pedido = new Request(`${APPS}${destino}${url.search}`, { method: request.method, headers: h, body: conCuerpo ? await request.arrayBuffer() : undefined, redirect: 'manual' });
  try {
    const r = await (env.OS ? env.OS.fetch(pedido) : fetch(pedido));
    return new Response(r.body, r);
  } catch (e) {
    console.error('vuelve publico', e?.message);
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vuelve</title><p style="font:17px system-ui;padding:40px;text-align:center">No pudimos abrir esta página. Intenta de nuevo en un momento.</p>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30' } });
  }
}

// Ligas cortas de las apps de eventos: vorka.mx/cupo/<liga> y vorka.mx/brindi/<liga>[/<invitado>] llevan al evento en os.vorka.mx
const APPS = 'https://os.vorka.mx';
export function ligaCorta(url) {
  const p = url.pathname;
  if (!/^\/(cupo|brindi)(\/|$)/.test(p)) return null;
  // Vuelve no redirige: sus páginas de clientes se sirven aquí mismo (ver vuelvePublico)
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
    // Ligas anteriores de Socios Vorka (?socio=CODIGO o ?codigo=CODIGO): ahora son ligas de Puntos Vorka. Dejan la cookie
    // de atribución (30 días) si el código es de una cuenta activa, igual que ?ref=
    if (request.method === 'GET' && !url.pathname.startsWith('/api/') && !url.searchParams.has('ref') && (url.searchParams.has('socio') || url.searchParams.has('codigo'))) {
      const u = new URL(url); u.searchParams.set('ref', url.searchParams.get('socio') || url.searchParams.get('codigo'));
      const { cookie } = await refDeVisita(env, request, u).catch(e => { console.error('liga anterior', e?.message); return {}; });
      if (cookie) { const r = new Response(res.body, res); r.headers.append('set-cookie', cookie); return r; }
    }
    return res;
  },

  // Cada hora: transferencias a creadores que ya pasaron su plazo, y estado de cuentas de Stripe en revisión.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
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
    if (/^\/vuelve(\/|$)/.test(url.pathname)) return await vuelvePublico(request, env, url);
    const corta = ligaCorta(url);
    if (corta) return corta;
    // El portal de Socios Vorka ya no existe: todo vive en Puntos Vorka
    if (/^\/tienda\/socios(\/|$)/.test(url.pathname)) return new Response(null, { status: 301, headers: { location: '/tienda/puntos/' } });
    if (url.pathname === '/api/socios/codigo') return fail('Usa /api/puntos/liga', 410);
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
      if (request.method === 'GET') return paginaReenviar(url);
    }
    const desc = url.pathname.match(/^\/descargas\/([^/]{1,100})\/?(?:(\d{1,3})\/?)?$/);
    if (desc && desc[1] !== 'reenviar' && ['GET', 'HEAD'].includes(request.method))
      return await (desc[2] === undefined ? paginaDescargas(env, desc[1]) : bajarArchivo(env, desc[1], desc[2], request.method));
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/tienda' || url.pathname === '/tienda/') return await paginaCatalogo(env, request, url);
      if (url.pathname === '/tienda/sitemap.xml') return await sitemapTienda(env);
      if (url.pathname === '/tienda/cupo' || url.pathname === '/tienda/cupo/') return url.pathname.endsWith('/') ? await paginaCupo(env, request, url) : Response.redirect(`${url.origin}/tienda/cupo/${url.search}`, 301);
      if (url.pathname === '/tienda/cuentas' || url.pathname === '/tienda/cuentas/') return url.pathname.endsWith('/') ? await paginaCuentas(env, request, url) : Response.redirect(`${url.origin}/tienda/cuentas/${url.search}`, 301);
      if (url.pathname === '/tienda/vuelve' || url.pathname === '/tienda/vuelve/') return url.pathname.endsWith('/') ? await paginaVuelve(env, request, url) : Response.redirect(`${url.origin}/tienda/vuelve/${url.search}`, 301);
      if (url.pathname === '/tienda/brindi' || url.pathname === '/tienda/brindi/') return url.pathname.endsWith('/') ? await paginaBrindi(env, request, url) : Response.redirect(`${url.origin}/tienda/brindi/${url.search}`, 301);
      const brv = url.pathname.match(/^\/tienda\/brindi\/([a-z-]{3,20})(\/?)$/);
      if (brv && Object.hasOwn(VARIANTES, brv[1]) && brv[1]) return brv[2] ? await paginaBrindi(env, request, url, brv[1]) : Response.redirect(`${url.origin}/tienda/brindi/${brv[1]}/${url.search}`, 301);
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
