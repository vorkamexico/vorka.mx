// Tests de la tienda: Test vocacional Vorka (/test-vocacional/) y ¿Qué proyecto social hago? (/que-proyecto-social/).
// Costo marginal cero: resultados por reglas con contenido propio, sin IA ni servicios de pago por uso.
//
//   GET  /<base>/                      el test gratis (indexable) · POST: guarda respuestas → /resultado/<id>
//   GET  /<base>/resultado/<id>        «¡Tu perfil está listo!» (pide correo, se puede saltar) → perfil gratis + reporte con candado + compra
//   POST /<base>/resultado/<id>/correo guarda nombre y correo y manda el resultado · /borrar borra las respuestas · GET /baja: sin recordatorio
//   GET  /test-vocacional/pagar/<id>   liga «que lo pague mi mamá o mi papá»
//   GET  /<base>/entrar/<token>        botón del correo de entrega (download_tokens) → /reporte/<token> (o /panel/<token> en licencias)
//   GET  /<base>/reporte/<token>       el reporte de pago (no vence); si la compra aún no tiene respuestas, el test ahí mismo
//   GET  /<base>/ver/<orden>           desde la página de gracias, en el navegador donde se contestó (cookie) → el reporte
//   GET  /test-vocacional/panel/<token> panel del orientador · /grupo/<codigo> liga para que el grupo se una
//   GET  /test-vocacional/escuelas/     página para escuelas (indexable) · /escuelas/volante/ volante carta imprimible (noindex)
//   POST /api/tests/evento             embudo: inicio y mitad (sin datos personales)
import { z } from 'zod';
import { one, all, run, json, fail, ahoraISO, correoOculto } from '../util.js';
import { pagina, aviso } from '../paginas.js';
import { productoPorSlug, dentroDelLimite } from '../modelo.js';
import { refDeVisita } from '../tienda.js';
import { crearToken, mandarEnlace, reenviarEnlace } from '../entrega.js';
import { FLECHA } from '../marco.generado.js';
import * as V from './vocacional.js';
import * as PS from './proyecto.js';
import * as PV from './paginas-vocacional.js';
import * as PP from './paginas-proyecto.js';
import * as PE from './paginas-escuelas.js';
import { PRODUCTOS_TEST, ID, TOKEN, SIN_REFERER, guardarResultado, leerResultado, resultadoDeOrden, contestado, ligarResultado, contar, metricas, abrirToken,
  codigoCompartir, leerFormulario, ipHash, cookieDe, cookieResultado, crearCupon, cuponVigente, EVENTOS_CLIENTE } from './comun.js';
import { mandarResultado, mandarRecordatorios } from './correos.js';

export { metricas as metricasTests, mandarRecordatorios };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GRUPOS = ['test-vocacional-grupo-10', 'test-vocacional-grupo-30', 'test-vocacional-grupo-100'];
const MULTI = ['expertise', 'causas', 'colaborar'];
const ir = (destino, status = 303, headers = {}) => new Response(null, { status, headers: { location: destino, 'cache-control': 'no-store', ...headers } });

// Cada producto: cómo se califica y cómo se pinta
const MOTOR = {
  vocacional: { leer: V.leerRespuestas, calcular: V.calcular, resumen: V.resumenDe, multi: [] },
  proyecto: { leer: PS.leerRespuestas, calcular: PS.calcular, resumen: PS.resumenDe, multi: MULTI },
};

function error(def, titulo, texto, status = 404) {
  return pagina({ titulo: `${titulo} · Vorka México`, ruta: def.ruta, noindex: true, status, headers: SIN_REFERER,
    cuerpo: aviso({ clase: 'alerta', titulo, texto, extra: `<div class="botones t-centro"><a class="btn tinta" href="${def.ruta}">Ir al test ${FLECHA}</a><a class="btn blanco" href="/descargas/reenviar">Pedir mi liga de nuevo</a></div>` }) });
}
const ERRORES = { invalido: ['Liga no válida', 'Revisa que hayas abierto la liga completa del correo. Si sigue sin funcionar, pide una nueva con el correo de tu compra.', 404],
  revocado: ['Esta liga ya no está activa', 'La compra se canceló o se reembolsó. Si crees que es un error, escríbenos a hola@vorka.mx.', 410] };
const errorToken = (def, motivo) => { const [t, x, s] = ERRORES[motivo] || ERRORES.invalido; return error(def, t, x, s); };

async function datosLanding(env, def) {
  const p = await productoPorSlug(env, def.slug);
  const grupos = def.clave === 'vocacional' ? (await Promise.all(GRUPOS.map(s => productoPorSlug(env, s)))).filter(Boolean) : [];
  return { p, grupos };
}
async function landing(env, req, url, def, extra = {}) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const d = await datosLanding(env, def);
  const aviso = url.searchParams.get('borrado') === '1' ? 'Listo: borramos tus respuestas.' : '';
  const op = { ...d, code, cookie, aviso, ...extra };
  return def.clave === 'vocacional' ? PV.landingVocacional(env, req, url, op) : PP.landingProyecto(env, req, url, op);
}

// Simuladores a la venta para armar el paquete del test vocacional con el examen que le toca
async function paquetesVocacional(env, p, f) {
  if (!p || f.producto !== 'vocacional') return [];
  const sim = V.calcular(f.respuestas).examen.sim;
  const prod = sim ? await productoPorSlug(env, V.SIMULADORES[sim].slug) : null;
  return prod ? PV.paquetesDe(p, [{ sim, prod }]) : [];
}
const conOrden = async (env, f) => f && ({ ...f, order_estado: f.order_id ? (await one(env, 'SELECT estado FROM orders WHERE id = ?', f.order_id))?.estado || null : null });

async function guardarTest(req, env, def) {
  const datos = await leerFormulario(req, MOTOR[def.clave].multi);
  const url = new URL(req.url);
  if (!(await dentroDelLimite(env, `test:${def.clave}:${await ipHash(req)}`, 30, 600))) return landing(env, req, url, def, { error: 'Demasiados intentos. Espera unos minutos.', datos, status: 429 });
  const v = MOTOR[def.clave].leer(datos);
  if (!v.ok) return landing(env, req, url, def, { error: v.faltan.length === 1 ? 'Te falta 1 pregunta.' : `Te faltan ${v.faltan.length} preguntas.`, datos, status: 400 });
  const res = MOTOR[def.clave].calcular(v.r);
  const id = await guardarResultado(env, { producto: def.clave, respuestas: v.r, resumen: MOTOR[def.clave].resumen(res) });
  await contar(env, def.clave, 'termino');
  const p = await productoPorSlug(env, def.slug);
  if (p) await crearCupon(env, def, p.id, id);
  return ir(`${def.ruta}resultado/${id}`, 303, { 'set-cookie': cookieResultado(def, id) });
}

async function verResultado(req, env, url, def, id) {
  const f = await conOrden(env, await leerResultado(env, id, def.clave));
  if (!f) return error(def, 'No encontramos este resultado', 'Puede que se haya borrado. Vuelve a contestar el test: tarda unos minutos.');
  if (!contestado(f)) return ir(def.ruta, 302);
  if (!f.email && url.searchParams.get('saltar') !== '1' && f.order_estado !== 'paid')
    return PV.puertaCorreo({ f, def, ...(def.clave === 'proyecto' ? { titulo: '¡Tus ideas están listas!', texto: 'Escribe tu nombre y tu correo para guardar tus ideas y mandártelas.' } : {}) });
  if (f.order_estado !== 'paid' && !f.candado_at && (await run(env, 'UPDATE tests_resultados SET candado_at = ? WHERE id = ? AND candado_at IS NULL', ahoraISO(), f.id)).meta.changes) await contar(env, def.clave, 'candado');
  const p = await productoPorSlug(env, def.slug);
  const op = { f, p, cupon: await cuponVigente(env, f), codigoRef: await codigoCompartir(env, f.email), enviado: url.searchParams.get('enviado') === '1', error: url.searchParams.get('error') || '' };
  return def.clave === 'vocacional' ? PV.resultadoVocacional({ ...op, paquetes: await paquetesVocacional(env, p, f) }) : PP.resultadoProyecto(op);
}

const EsquemaCorreo = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido.').max(254)),
  consentimiento: z.literal('on', { error: 'Acepta el aviso de privacidad para guardar tu resultado.' }),
  novedades: z.string().optional(),
});
async function guardarCorreo(req, env, def, id) {
  const f = await leerResultado(env, id, def.clave);
  if (!f) return error(def, 'No encontramos este resultado', 'Puede que se haya borrado.');
  const v = EsquemaCorreo.safeParse(await leerFormulario(req));
  if (!v.success) return PV.puertaCorreo({ f, def, error: v.error.issues[0].message });
  if (!(await dentroDelLimite(env, `test-correo:${await ipHash(req)}`, 10, 600))) return PV.puertaCorreo({ f, def, error: 'Demasiados intentos. Espera unos minutos.' });
  const novedades = v.data.novedades === 'on' ? 1 : 0;
  await run(env, 'UPDATE tests_resultados SET email = ?, nombre = ?, consentimiento = 1, novedades = ?, baja = 0, updated_at = ? WHERE id = ?', v.data.email, v.data.nombre, novedades, ahoraISO(), id);
  if (!f.email) await contar(env, def.clave, 'correo');
  let enviado = 1;
  try { await mandarResultado(env, { ...f, email: v.data.email, nombre: v.data.nombre, novedades }); }
  catch (e) { enviado = 0; console.error('tests: correo del resultado', correoOculto(v.data.email), e.message); }
  return ir(`${def.ruta}resultado/${id}${enviado ? '?enviado=1' : ''}`);
}

async function abrirReporte(req, env, url, def, token, metodo) {
  const a = await abrirToken(env, token, def.app);
  if (a.error) return errorToken(def, a.error);
  if (a.contenido.acceso?.tipo === 'grupo') return ir(`${def.ruta}panel/${token}`, 302, SIN_REFERER);
  let f = await resultadoDeOrden(env, a.orden.id, def.clave);
  if (metodo === 'POST') {
    const datos = await leerFormulario(req, MOTOR[def.clave].multi);
    const v = MOTOR[def.clave].leer(datos);
    if (!v.ok) return formEnReporte(def, token, { datos, error: v.faltan.length === 1 ? 'Te falta 1 pregunta.' : `Te faltan ${v.faltan.length} preguntas.` });
    const resumen = MOTOR[def.clave].resumen(MOTOR[def.clave].calcular(v.r));
    if (f) await run(env, 'UPDATE tests_resultados SET respuestas = ?, resumen = ?, updated_at = ? WHERE id = ?', JSON.stringify(v.r), JSON.stringify(resumen), ahoraISO(), f.id);
    else await guardarResultado(env, { producto: def.clave, respuestas: v.r, resumen, order_id: a.orden.id, email: a.orden.email, nombre: a.orden.nombre, consentimiento: 1 });
    await contar(env, def.clave, 'termino');
    return ir(`${def.ruta}reporte/${token}`, 303, SIN_REFERER);
  }
  if (!contestado(f)) return formEnReporte(def, token);
  if (def.clave === 'vocacional') {
    const sims = {};
    for (const [k, s] of Object.entries(V.SIMULADORES)) { const p = await productoPorSlug(env, s.slug); if (p) sims[k] = p; }
    const p = await productoPorSlug(env, def.slug);
    return PV.reporteVocacional({ f, orden: a.orden, token, sims, codigoRef: await codigoCompartir(env, a.orden.email), regalable: !!p?.contenido?.regalable });
  }
  return PP.reporteProyecto({ f, orden: a.orden, rutaActiva: !!(await productoPorSlug(env, 'ruta-de-impacto')) });
}
function formEnReporte(def, token, { datos = {}, error = '' } = {}) {
  const form = def.clave === 'vocacional' ? PV.formTest({ accion: `${def.ruta}reporte/${token}`, datos, error, boton: 'Ver mi reporte completo' })
    : PP.formProyecto({ accion: `${def.ruta}reporte/${token}`, datos, error, boton: 'Ver mi reporte completo' });
  return pagina({ titulo: `Contesta para ver tu reporte · ${def.nombre}`, ruta: `${def.ruta}reporte/`, noindex: true, headers: SIN_REFERER, status: error ? 400 : 200, navActual: 'catalogo',
    head: `<style>${CSS()}</style>`, script: PSCRIPT(def),
    cuerpo: `<div class="tv"><section class="tv-hero"><div class="marco"><span class="tv-et">Tu reporte completo ya está pagado</span>
  <h1 class="tv-h1">Contesta y <em>ve tu reporte</em></h1><p class="tv-lead">${def.clave === 'vocacional' ? 'Tarda de 8 a 10 minutos. Contesta con lo primero que pienses.' : 'Tarda unos 5 minutos.'}</p></div></section>
  <section class="tv-sec" style="padding-top:0"><div class="marco">${form}</div></section></div>` });
}
import { CSS_TESTS } from './estilos.js';
import { SCRIPT_TEST, SCRIPT_TOPE } from './comun.js';
const CSS = () => CSS_TESTS;
const PSCRIPT = def => SCRIPT_TEST(def.clave) + (def.clave === 'proyecto' ? SCRIPT_TOPE : '');

// ---------- licencias para grupo ----------
export async function grupoDeOrden(env, orden, item, contenido) {
  let g = await one(env, 'SELECT * FROM tests_grupos WHERE order_id = ?', orden.id);
  if (!g) {
    const cupo = (Number(contenido.licencias) || 1) * (item.cantidad || 1);
    await run(env, 'INSERT OR IGNORE INTO tests_grupos (order_id, codigo, producto, cupo, nombre) VALUES (?,?,?,?,?)', orden.id, crypto.randomUUID().replace(/-/g, '').slice(0, 24), 'vocacional', cupo, orden.nombre);
    g = await one(env, 'SELECT * FROM tests_grupos WHERE order_id = ?', orden.id);
  }
  return g;
}
const usadosDe = async (env, orderId) => (await one(env, 'SELECT COUNT(*) n FROM orders WHERE regalo_de = ?', orderId)).n;

async function panel(env, def, token) {
  const a = await abrirToken(env, token, def.app);
  if (a.error) return errorToken(def, a.error);
  if (a.contenido.acceso?.tipo !== 'grupo') return ir(`${def.ruta}reporte/${token}`, 302, SIN_REFERER);
  const grupo = await grupoDeOrden(env, a.orden, a.item, a.contenido);
  const filas = (await all(env, `SELECT o.nombre onombre, r.nombre, r.respuestas, r.resumen, r.comparte_grupo FROM orders o LEFT JOIN tests_resultados r ON r.order_id = o.id AND r.producto = 'vocacional'
    WHERE o.regalo_de = ? AND o.estado = 'paid' ORDER BY o.created_at`, a.orden.id)).map(x => ({ nombre: x.nombre || x.onombre, contestado: !!x.respuestas && x.respuestas !== '{}', comparte: !!x.comparte_grupo, resumen: JSON.parse(x.resumen || '{}') }));
  return PV.panelGrupo({ orden: a.orden, grupo, usados: await usadosDe(env, a.orden.id), filas, liga: `${env.SITE_URL}${def.ruta}grupo/${grupo.codigo}` });
}

const EsquemaUnirse = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido: ahí te llega tu reporte.').max(254)),
  terminos: z.literal('on', { error: 'Acepta los términos y el aviso de privacidad.' }),
  comparte: z.string().optional(),
});
async function unirse(req, env, def, codigo) {
  if (!/^[a-f0-9]{24}$/.test(codigo)) return error(def, 'Liga no válida', 'Pide a tu orientador que te comparta la liga completa.');
  const g = await one(env, "SELECT g.*, o.nombre de_nombre FROM tests_grupos g JOIN orders o ON o.id = g.order_id WHERE g.codigo = ? AND o.estado = 'paid'", codigo);
  if (!g) return error(def, 'Esta liga ya no está activa', 'Pide a tu orientador que te comparta la liga vigente.', 410);
  const usados = await usadosDe(env, g.order_id);
  const de = String(g.de_nombre || '').split(' ')[0];
  if (req.method !== 'POST') return PV.paginaUnirse({ grupo: g, usados, de });
  const v = EsquemaUnirse.safeParse(await leerFormulario(req));
  if (!v.success) return PV.paginaUnirse({ grupo: g, usados, de, error: v.error.issues[0].message });
  if (!(await dentroDelLimite(env, `test-grupo:${await ipHash(req)}`, 15, 600))) return PV.paginaUnirse({ grupo: g, usados, de, error: 'Demasiados intentos. Espera unos minutos.' });
  const d = v.data;
  const ya = await one(env, 'SELECT id FROM orders WHERE regalo_de = ? AND lower(email) = ?', g.order_id, d.email);
  if (ya) {
    await reenviarEnlace(env, ya.id, { publico: true }).catch(e => console.error('tests: reenviar grupo', e.message));
    return PV.paginaUnirse({ grupo: g, usados, de, ok: `Ya te habías unido con ese correo: te mandamos de nuevo la liga de tu reporte a ${correoOculto(d.email)}.` });
  }
  const prod = await one(env, "SELECT id, nombre FROM products WHERE slug = 'test-vocacional'");
  const id = crypto.randomUUID(), ahora = ahoraISO();
  // Atómico: solo entra si quedan lugares y la licencia sigue pagada (dos alumnos a la vez no pasan del cupo)
  const [o] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, moneda, estado, proveedor, regalo_de, paid_at)
      SELECT ?, ?, ?, 0, 'MXN', 'paid', 'regalo', ?, ? WHERE (SELECT COUNT(*) FROM orders WHERE regalo_de = ?) < ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND estado = 'paid')`)
      .bind(id, d.email, d.nombre, g.order_id, ahora, g.order_id, g.cupo, g.order_id),
    env.DB.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad) SELECT ?, ?, ?, 0, 1 WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)').bind(id, prod.id, prod.nombre, id),
  ]);
  if (!o.meta.changes) return PV.paginaUnirse({ grupo: g, usados: g.cupo, de });
  await guardarResultado(env, { producto: 'vocacional', respuestas: {}, resumen: {}, order_id: id, grupo_order_id: g.order_id, comparte_grupo: d.comparte === 'on', email: d.email, nombre: d.nombre, consentimiento: 1 });
  const { token } = await crearToken(env, id);
  try { await mandarEnlace(env, id); await run(env, 'UPDATE orders SET correo_enviado_at = ? WHERE id = ?', ahoraISO(), id); }
  catch (e) { console.error('tests: correo de grupo', id, e.message); }
  return ir(`${def.ruta}reporte/${token}`, 303, SIN_REFERER);
}

// ---------- desde la página de gracias: entra directo al reporte en el navegador donde se contestó ----------
async function ver(req, env, def, orderId) {
  const id = cookieDe(req, def.cookie);
  const f = UUID.test(orderId) && ID.test(id || '') ? await leerResultado(env, id, def.clave) : null;
  const o = f && f.order_id === orderId ? await one(env, "SELECT id FROM orders WHERE id = ? AND estado = 'paid'", orderId) : null;
  if (!o) return error(def, 'Abre tu reporte desde tu correo', 'Por seguridad, aquí solo entra el navegador donde contestaste el test. Usa el botón «Ver mi reporte» del correo que te mandamos.', 403);
  if (!(await dentroDelLimite(env, `test-ver:${orderId}`, 20, 3600))) return error(def, 'Demasiados intentos', 'Usa el botón «Ver mi reporte» de tu correo.', 429);
  const { token } = await crearToken(env, orderId);
  return ir(`${def.ruta}reporte/${token}`, 302, SIN_REFERER);
}

// ---------- checkout: liga la compra a las respuestas y el paquete con el simulador ----------
export async function alCrearOrden(env, { resultado, orden, slug, regalo }) {
  const def = Object.values(PRODUCTOS_TEST).find(x => x.slug === slug);
  if (!def || !resultado || regalo) return;
  if (await ligarResultado(env, resultado, orden.id, def.clave)) await contar(env, def.clave, 'checkout');
}
export const DESCUENTO_PAQUETE = PV.DESCUENTO_PAQUETE;
// Paquete test vocacional + simulador (plan de práctica). null si no aplica; Error('paquete') si no es válido.
export async function paqueteCheckout(env, slug, paquete) {
  if (!paquete) return null;
  const sim = Object.values(V.SIMULADORES).find(s => s.slug === paquete);
  if (slug !== 'test-vocacional' || !sim || !(await productoPorSlug(env, slug)) || !(await productoPorSlug(env, sim.slug))) throw new Error('paquete');
  return { items: [{ slug, cantidad: 1 }, { slug: sim.slug, cantidad: 1 }],
    descuento: { tipo: 'codigo', codigo: 'PAQUETE-TEST', pct: null, monto: DESCUENTO_PAQUETE, meses: null, app: null, texto: `Paquete test vocacional + ${sim.nombre}: $${DESCUENTO_PAQUETE / 100} MXN de descuento` } };
}

// ---------- datos personales (aviso de privacidad) ----------
// ARCO desde el panel: borra las respuestas de un correo (las que dejó o las ligadas a sus compras). Las órdenes se quedan (plazos fiscales).
export async function borrarDatosTests(env, email) {
  const e = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Correo no válido.');
  const r = await run(env, 'DELETE FROM tests_resultados WHERE lower(email) = ? OR order_id IN (SELECT id FROM orders WHERE lower(email) = ?)', e, e);
  return { ok: true, borrados: r.meta.changes };
}
// Limpieza diaria: sin compra, 12 meses; ligadas a una compra o licencia, 24 meses después de la última actualización
export async function limpiarTests(env, ahora = new Date()) {
  const t = ahora.getTime();
  const a = await run(env, 'DELETE FROM tests_resultados WHERE order_id IS NULL AND grupo_order_id IS NULL AND created_at < ?', new Date(t - 365 * 864e5).toISOString());
  const b = await run(env, 'DELETE FROM tests_resultados WHERE (order_id IS NOT NULL OR grupo_order_id IS NOT NULL) AND updated_at < ?', new Date(t - 730 * 864e5).toISOString());
  return { sin_compra: a.meta.changes, con_compra: b.meta.changes };
}

// ---------- rutas ----------
const BASES = { 'test-vocacional': PRODUCTOS_TEST.vocacional, 'que-proyecto-social': PRODUCTOS_TEST.proyecto };
export async function rutasTests(request, env, url) {
  const p = url.pathname, m = request.method;
  if (p === '/api/tests/evento' && m === 'POST') {
    const d = await request.json().catch(() => ({}));
    if (!PRODUCTOS_TEST[d.p] || !EVENTOS_CLIENTE.includes(d.e)) return fail('Evento no válido');
    if (!(await dentroDelLimite(env, `test-evento:${await ipHash(request)}`, 40, 600))) return fail('Demasiados', 429);
    await contar(env, d.p, d.e);
    return json({ ok: true });
  }
  // La ficha en /tienda/<slug>/ es la página del test
  let x = p.match(/^\/tienda\/(test-vocacional|que-proyecto-social)\/?$/);
  if (x && ['GET', 'HEAD'].includes(m)) return ir(`/${x[1]}/${url.search}`, 301);
  x = p.match(/^\/(test-vocacional|que-proyecto-social)(\/.*)?$/);
  if (!x) return null;
  const def = BASES[x[1]], resto = x[2] || '';
  const lee = ['GET', 'HEAD'].includes(m);
  if (resto === '' && lee) return ir(`${def.ruta}${url.search}`, 301);
  if (resto === '/') return m === 'POST' ? guardarTest(request, env, def) : lee ? landing(env, request, url, def) : fail('Método no permitido', 405);
  let r;
  if (def.clave === 'vocacional' && /^\/escuelas(\/volante)?\/?$/.test(resto)) {
    if (!lee) return fail('Método no permitido', 405);
    if (!resto.endsWith('/')) return ir(`${def.ruta}${resto.slice(1)}/${url.search}`, 301);
    const { p, grupos } = await datosLanding(env, def);
    return resto.startsWith('/escuelas/volante') ? PE.volanteEscuelas({ p, grupos }) : PE.paginaEscuelas({ p, grupos });
  }
  if ((r = resto.match(/^\/resultado\/([a-f0-9]{32})\/?$/)) && lee) return verResultado(request, env, url, def, r[1]);
  if ((r = resto.match(/^\/resultado\/([a-f0-9]{32})\/correo\/?$/)) && m === 'POST') return guardarCorreo(request, env, def, r[1]);
  if ((r = resto.match(/^\/resultado\/([a-f0-9]{32})\/borrar\/?$/)) && m === 'POST') {
    const b = await run(env, 'DELETE FROM tests_resultados WHERE id = ? AND producto = ?', r[1], def.clave);
    // Bitácora sin datos (Vorka OS › Tienda › Tests): cuántas personas borraron sus respuestas
    if (b.meta.changes) await run(env, "INSERT INTO tests_bitacora (accion, por, producto, n) VALUES ('borrado_persona', 'persona', ?, 1)", def.clave).catch(e => console.error('tests: bitácora', e?.message));
    return ir(`${def.ruta}?borrado=1`, 303, { 'set-cookie': `${def.cookie}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax` });
  }
  if ((r = resto.match(/^\/resultado\/([a-f0-9]{32})\/baja\/?$/)) && lee) {
    await run(env, 'UPDATE tests_resultados SET baja = 1, novedades = 0, updated_at = ? WHERE id = ?', ahoraISO(), r[1]);
    return pagina({ titulo: 'Listo · Vorka México', ruta: def.ruta, noindex: true, headers: SIN_REFERER, cuerpo: aviso({ titulo: 'Listo, no te escribiremos más', texto: 'Ya no recibirás correos sobre este resultado. Tu resultado sigue guardado y lo puedes borrar cuando quieras.' }) });
  }
  if ((r = resto.match(/^\/pagar\/([a-f0-9]{32})\/?$/)) && lee && def.clave === 'vocacional') {
    const f = await conOrden(env, await leerResultado(env, r[1], def.clave));
    if (!contestado(f)) return error(def, 'No encontramos este resultado', 'Pide que te manden la liga completa o que vuelvan a contestar el test.');
    if (f.order_estado === 'paid') return pagina({ titulo: 'Ya está pagado · Vorka México', ruta: def.ruta, noindex: true, headers: SIN_REFERER, cuerpo: aviso({ titulo: 'Este reporte ya está pagado', texto: 'La liga del reporte llegó al correo con el que se pagó.' }) });
    const p = await productoPorSlug(env, def.slug);
    return PV.pagarVocacional({ f, p, paquetes: await paquetesVocacional(env, p, f), cupon: await cuponVigente(env, f), error: url.searchParams.get('error') || '' });
  }
  if ((r = resto.match(/^\/entrar\/([^/]{1,100})\/?$/)) && lee) {
    const a = await abrirToken(env, r[1], def.app);
    if (a.error) return errorToken(def, a.error);
    return ir(`${def.ruta}${a.contenido.acceso?.tipo === 'grupo' ? 'panel' : 'reporte'}/${r[1]}`, 302, SIN_REFERER);
  }
  if ((r = resto.match(/^\/reporte\/([^/]{1,100})\/?$/)) && (lee || m === 'POST')) return abrirReporte(request, env, url, def, r[1], m);
  if ((r = resto.match(/^\/panel\/([^/]{1,100})\/?$/)) && lee && def.clave === 'vocacional') return panel(env, def, r[1]);
  if ((r = resto.match(/^\/grupo\/([^/]{1,40})\/?$/)) && (lee || m === 'POST') && def.clave === 'vocacional') return unirse(request, env, def, r[1]);
  if ((r = resto.match(/^\/ver\/([^/]{1,40})\/?$/)) && lee) return ver(request, env, def, r[1]);
  return error(def, 'Página no encontrada', 'Revisa la dirección o vuelve al inicio del test.');
}
export { TOKEN };
