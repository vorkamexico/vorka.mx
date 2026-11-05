// Tests · lo que ve el equipo en Vorka OS › Tienda › Tests (por la clase Admin, service binding; no hay ruta pública):
//   panelTests({ rango })               embudo por producto (hoy, 7 o 30 días) + ventas e ingresos de reportes, paquetes y licencias
//   gruposTests()                       licencias para grupo: quién compró (correo oculto), paquete, lugares usados, liga del grupo
//   ligaPanelTests({ order_id, por })   liga nueva del panel del orientador (queda en la bitácora con quién la sacó)
//   reenviarPanelTests({ order_id, por }) reenvía el correo del panel a quien compró la licencia
//   buscarDatosTestsCorreo(email)       ARCO: qué respuestas guardan ese correo (sin mostrar las respuestas)
//   borrarDatosTestsCorreo({ email, por }) ARCO: las borra (la misma función de siempre) y deja la bitácora
// La bitácora (tests_bitacora, migración 0059) nunca guarda el dato borrado ni el correo de quien contestó.
import { z } from 'zod';
import { one, all, run, correoOculto } from '../util.js';
import { crearToken, reenviarEnlace } from '../entrega.js';
import { PRODUCTOS_TEST } from './comun.js';
import { borrarDatosTests, grupoDeOrden } from './index.js';

const RANGOS = { hoy: 1, '7d': 7, '30d': 30 };
const MX = 6 * 3600e3;   // centro de México: UTC−6 todo el año (sin horario de verano desde 2022)
export const diaMx = (t = Date.now()) => new Date(t - MX).toISOString().slice(0, 10);
const POR = z.string().trim().min(3).max(254);
const CORREO = z.string().trim().toLowerCase().pipe(z.email().max(254));
const parse = t => { try { return JSON.parse(t || '{}'); } catch { return {}; } };
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;

// Pasos del embudo y contra cuál se mide cada %. «Vio el candado» se mide contra «terminó» (se puede ver sin dejar correo);
// con cupón y recuperadas son una parte de las compras.
const PASOS = [
  ['inicio', 'Iniciaron', null], ['mitad', 'Llegaron a la mitad', 'inicio'], ['termino', 'Terminaron', 'mitad'],
  ['correo', 'Dejaron su correo', 'termino'], ['candado', 'Vieron el candado', 'termino'], ['checkout', 'Abrieron el pago', 'candado'],
  ['compras', 'Compraron el reporte', 'candado'], ['compras_cupon', 'Con el cupón de 24 h', 'compras'], ['recuperadas', 'Recuperadas por el correo', 'compras'],
];

function rangoDe(r, ahora = Date.now()) {
  const clave = RANGOS[r] ? r : '7d';
  const hasta = diaMx(ahora);
  const desde = diaMx(ahora - (RANGOS[clave] - 1) * 864e5);
  return { rango: clave, desde, hasta, desde_iso: new Date(Date.parse(`${desde}T00:00:00Z`) + MX).toISOString() };
}

// Órdenes pagadas del rango con algún producto del test, clasificadas: licencia (acceso.tipo 'grupo'), paquete (el reporte
// con otro producto en la misma orden: el simulador del examen) o reporte. Sin canjes de regalo ni cortesías ($0).
async function ventasDe(env, def, desdeIso) {
  const filas = await all(env, `SELECT o.id, o.monto_centavos, o.regalo, i.product_id, i.cantidad, p.contenido FROM orders o
      JOIN order_items i ON i.order_id = o.id LEFT JOIN products p ON p.id = i.product_id
    WHERE o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia') AND o.paid_at >= ?
      AND EXISTS (SELECT 1 FROM order_items i2 JOIN products p2 ON p2.id = i2.product_id WHERE i2.order_id = o.id AND json_extract(p2.contenido, '$.acceso.app') = ?)`, desdeIso, def.app);
  const ordenes = new Map();
  for (const f of filas) {
    const o = ordenes.get(f.id) || { monto: f.monto_centavos, regalo: !!f.regalo, items: [] };
    o.items.push({ cantidad: f.cantidad || 1, c: parse(f.contenido) });
    ordenes.set(f.id, o);
  }
  const v = { reportes: { n: 0, centavos: 0 }, paquetes: { n: 0, centavos: 0 }, licencias: { n: 0, centavos: 0, lugares: 0 }, regalos: 0 };
  for (const o of ordenes.values()) {
    const grupo = o.items.filter(i => i.c.acceso?.app === def.app && i.c.acceso?.tipo === 'grupo');
    const k = grupo.length ? 'licencias' : o.items.length > 1 ? 'paquetes' : 'reportes';
    v[k].n++; v[k].centavos += o.monto || 0;
    if (grupo.length) v.licencias.lugares += grupo.reduce((s, i) => s + (Number(i.c.licencias) || 1) * i.cantidad, 0);
    if (o.regalo) v.regalos++;
  }
  v.total = { n: ordenes.size, centavos: v.reportes.centavos + v.paquetes.centavos + v.licencias.centavos };
  return v;
}

export async function panelTests(env, { rango } = {}, ahora = Date.now()) {
  const R = rangoDe(rango, ahora);
  const conteos = await all(env, 'SELECT producto, evento, SUM(n) n FROM tests_metricas WHERE dia >= ? AND dia <= ? GROUP BY producto, evento', R.desde, R.hasta);
  const productos = {};
  for (const [k, def] of Object.entries(PRODUCTOS_TEST)) {
    const c = { inicio: 0, mitad: 0, termino: 0, correo: 0, candado: 0, checkout: 0, recordatorio: 0 };
    for (const f of conteos) if (f.producto === k && f.evento in c) c[f.evento] = f.n;
    const ventas = await ventasDe(env, def, R.desde_iso);
    // Con el cupón de 24 h, y recuperadas: pagadas después del correo «tu resultado te espera» (como metricasTests)
    const t = await one(env, `SELECT SUM(CASE WHEN o.descuento_codigo = r.cupon THEN 1 ELSE 0 END) cupon,
        SUM(CASE WHEN r.recordatorio_at IS NOT NULL AND o.paid_at > r.recordatorio_at THEN 1 ELSE 0 END) rec
      FROM tests_resultados r JOIN orders o ON o.id = r.order_id WHERE r.producto = ? AND o.estado = 'paid' AND o.proveedor NOT IN ('regalo', 'cortesia') AND o.paid_at >= ?`, k, R.desde_iso);
    const n = { ...c, compras: ventas.reportes.n + ventas.paquetes.n, compras_cupon: t?.cupon || 0, recuperadas: t?.rec || 0 };
    productos[k] = {
      nombre: def.nombre, ruta: def.ruta, recordatorios: c.recordatorio,
      embudo: PASOS.map(([clave, texto, base]) => ({ clave, texto, n: n[clave], base, pct: base ? pct(n[clave], n[base]) : null })),
      conversion_pct: pct(n.compras, n.termino),   // de cada 100 que terminan, compran
      ventas,
    };
  }
  const b = await all(env, "SELECT accion, COUNT(*) veces, SUM(n) n FROM tests_bitacora WHERE at >= ? AND accion IN ('borrado_persona', 'arco') GROUP BY accion", R.desde_iso);
  // persona: respuestas que cada quien borró desde su resultado · arco: solicitudes atendidas desde el panel (y cuántas respuestas)
  const borrados = { persona: 0, arco: 0, arco_respuestas: 0 };
  for (const f of b) if (f.accion === 'arco') { borrados.arco = f.veces; borrados.arco_respuestas = f.n || 0; } else borrados.persona = f.n || 0;
  return { ...R, productos, borrados };
}

// Licencias para grupo: una fila por compra pagada (o reembolsada) de un paquete de licencias. El correo va oculto.
// El grupo (codigo) se crea la primera vez que se abre el panel: si aún no existe, liga_grupo es null.
export async function gruposTests(env, { limite = 100 } = {}) {
  const filas = await all(env, `SELECT o.id, o.nombre, o.email, o.estado, o.paid_at, o.correo_enviado_at, i.nombre producto, i.cantidad, p.contenido,
      g.codigo, g.cupo, g.created_at grupo_at, (SELECT COUNT(*) FROM orders x WHERE x.regalo_de = o.id) usados,
      (SELECT COUNT(*) FROM tests_resultados r WHERE r.grupo_order_id = o.id AND r.respuestas <> '{}') contestaron,
      (SELECT COUNT(*) FROM tests_resultados r WHERE r.grupo_order_id = o.id AND r.respuestas <> '{}' AND r.comparte_grupo = 1) comparten
    FROM orders o JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id LEFT JOIN tests_grupos g ON g.order_id = o.id
    WHERE o.estado IN ('paid', 'refunded') AND json_extract(p.contenido, '$.acceso.tipo') = 'grupo'
    ORDER BY o.paid_at DESC LIMIT ?`, Math.max(1, Math.min(500, Number(limite) || 100)));
  const base = env.SITE_URL || 'https://vorka.mx';
  const grupos = filas.map(f => {
    const c = parse(f.contenido), def = Object.values(PRODUCTOS_TEST).find(d => d.app === c.acceso?.app) || PRODUCTOS_TEST.vocacional;
    return { order_id: f.id, nombre: f.nombre, email: correoOculto(f.email), estado: f.estado, paid_at: f.paid_at, producto: f.producto,
      total: f.cupo || (Number(c.licencias) || 1) * (f.cantidad || 1), usados: f.usados, contestaron: f.contestaron, comparten: f.comparten,
      liga_grupo: f.codigo ? `${base}${def.ruta}grupo/${f.codigo}` : null, panel_abierto: !!f.codigo, correo_enviado_at: f.correo_enviado_at };
  });
  return { grupos, lugares: grupos.filter(g => g.estado === 'paid').reduce((s, g) => s + g.total, 0), usados: grupos.filter(g => g.estado === 'paid').reduce((s, g) => s + g.usados, 0) };
}

async function licencia(env, orderId) {
  const id = String(orderId || '');
  const f = await one(env, `SELECT o.*, i.cantidad, i.product_id, p.contenido FROM orders o JOIN order_items i ON i.order_id = o.id JOIN products p ON p.id = i.product_id
    WHERE o.id = ? AND json_extract(p.contenido, '$.acceso.tipo') = 'grupo'`, id);
  if (!f) throw new Error('Esa licencia para grupo no existe.');
  if (f.estado !== 'paid') throw new Error('La licencia no está pagada (se reembolsó o no se pagó).');
  return f;
}
const quien = por => { const q = POR.safeParse(por); if (!q.success) throw new Error('Falta quién del equipo lo hace.'); return q.data; };
const anotar = (env, accion, por, { producto = null, order_id = null, n = 0 } = {}) =>
  run(env, 'INSERT INTO tests_bitacora (accion, por, producto, order_id, n) VALUES (?, ?, ?, ?, ?)', accion, por, producto, order_id, n);

// Liga nueva del panel del orientador (las anteriores siguen sirviendo). Se crea el grupo si aún no existía.
export async function ligaPanelTests(env, { order_id, por } = {}) {
  const q = quien(por);
  const f = await licencia(env, order_id);
  const c = parse(f.contenido), def = Object.values(PRODUCTOS_TEST).find(d => d.app === c.acceso?.app) || PRODUCTOS_TEST.vocacional;
  const g = await grupoDeOrden(env, f, { cantidad: f.cantidad }, c);
  const { token } = await crearToken(env, f.id);
  await anotar(env, 'liga_panel', q, { producto: def.clave, order_id: f.id });
  const base = env.SITE_URL || 'https://vorka.mx';
  return { ok: true, liga_panel: `${base}${def.ruta}panel/${token}`, liga_grupo: `${base}${def.ruta}grupo/${g.codigo}` };
}

// Reenvía el correo del panel (el de entrega de la compra, con su botón «Abrir mi panel de grupo») a quien compró
export async function reenviarPanelTests(env, { order_id, por } = {}) {
  const q = quien(por);
  const f = await licencia(env, order_id);
  if (!(await reenviarEnlace(env, f.id))) throw new Error('No se pudo reenviar: la licencia no está pagada.');
  await anotar(env, 'reenvio_panel', q, { producto: 'vocacional', order_id: f.id });
  return { ok: true, email: correoOculto(f.email) };
}

// ARCO: lo que guarda un correo (las respuestas que dejó y las ligadas a sus compras). No devuelve las respuestas.
const DEL_CORREO = 'lower(r.email) = ?1 OR r.order_id IN (SELECT id FROM orders WHERE lower(email) = ?1)';
export async function buscarDatosTestsCorreo(env, email) {
  const e = CORREO.safeParse(email);
  if (!e.success) throw new Error('Revisa el correo.');
  const filas = await all(env, `SELECT r.producto, r.created_at, r.order_id IS NOT NULL AND r.order_id IN (SELECT id FROM orders WHERE estado = 'paid') pagado,
      r.grupo_order_id IS NOT NULL grupo, r.novedades, r.respuestas <> '{}' contestado
    FROM tests_resultados r WHERE ${DEL_CORREO} ORDER BY r.created_at DESC LIMIT 200`, e.data);
  return { email: e.data, resultados: filas.map(f => ({ producto: f.producto, nombre: PRODUCTOS_TEST[f.producto]?.nombre || f.producto, created_at: f.created_at,
    pagado: !!f.pagado, grupo: !!f.grupo, novedades: !!f.novedades, contestado: !!f.contestado })) };
}
export async function borrarDatosTestsCorreo(env, { email, por } = {}) {
  const q = quien(por);
  const b = await buscarDatosTestsCorreo(env, email);
  if (!b.resultados.length) return { ok: true, borrados: 0 };
  const prods = [...new Set(b.resultados.map(r => r.producto))];
  const r = await borrarDatosTests(env, b.email);
  await anotar(env, 'arco', q, { producto: prods.length === 1 ? prods[0] : null, n: r.borrados });
  return { ok: true, borrados: r.borrados };
}

// Bitácora reciente para el panel: qué pasó y quién (los borrados que hizo cada persona salen como «La persona»)
export async function bitacoraTests(env, { limite = 30 } = {}) {
  return all(env, 'SELECT at, accion, por, producto, n FROM tests_bitacora ORDER BY id DESC LIMIT ?', Math.max(1, Math.min(200, Number(limite) || 30)));
}
