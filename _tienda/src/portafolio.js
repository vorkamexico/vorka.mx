// Portafolio: cada línea de producto con lo que sirve para decidir si se escala, se valida o se congela.
// Solo por RPC desde Vorka OS (Tienda › Portafolio, rol Ejecutivo). Vorka OS suma el uso de sus apps y el trabajo en código.
// Ventas sin regalos, cortesías ni pruebas internas: correos @vorka.mx, con "prueba", o los que Vorka OS mande en `internos`.
import { all } from './util.js';

// Línea → productos (por id). El orden es el de la pantalla; lo que no entre en ninguna cae en "otros".
export const LINEAS = [
  { clave: 'sim_paa', nombre: 'Simulador PAA', re: /^prod_(paa_|simulador_paa)/, app: 'simulador-paa' },
  { clave: 'sim_unam', nombre: 'Simulador UNAM', re: /^prod_unam_/, app: 'simulador-unam' },
  { clave: 'sim_ecoems', nombre: 'Simulador ECOEMS', re: /^prod_ecoems_/, app: 'simulador-ecoems' },
  { clave: 'sim_prepa_ug', nombre: 'Simulador prepa UG', re: /^prod_prepa_ug_/, app: 'simulador-prepa-ug' },
  { clave: 'vende', nombre: 'Vende', re: /^prod_vende_/ },
  { clave: 'vuelve', nombre: 'Vuelve', re: /^prod_vuelve_/ },
  { clave: 'agenda', nombre: 'Agenda', re: /^prod_agenda_/ },
  { clave: 'cuentas', nombre: 'Cuentas', re: /^prod_cuentas_/ },
  { clave: 'cupo', nombre: 'Cupo', re: /^prod_cupo_/ },
  { clave: 'brindi', nombre: 'Brindi', re: /^prod_brindi_/ },
  { clave: 'ruta', nombre: 'Ruta de Impacto', re: /^prod_ruta_de_impacto/ },
  { clave: 'liderazgo', nombre: 'Evaluación de liderazgo', re: /^prod_evaluacion_liderazgo/ },
  { clave: 'test_vocacional', nombre: 'Test vocacional', re: /^prod_test_vocacional/, test: 'vocacional' },
  { clave: 'proyecto_social', nombre: '¿Qué proyecto social hago?', re: /^prod_proyecto_social/, test: 'proyecto' },
  { clave: 'otros', nombre: 'Kits y otros', re: /./ },
];
export const lineaDe = id => LINEAS.find(l => l.re.test(String(id || ''))).clave;

export const esInterno = (email, internos = []) => {
  const e = String(email || '').trim().toLowerCase();
  return !e || e.endsWith('@vorka.mx') || e.includes('prueba') || internos.includes(e);
};

const DIA = 864e5;

export async function portafolio(env, { internos = [], dias = 30 } = {}) {
  internos = (Array.isArray(internos) ? internos : []).map(x => String(x || '').trim().toLowerCase()).filter(Boolean).slice(0, 200);
  dias = Math.min(365, Math.max(7, Number(dias) || 30));
  const ahora = Date.now(), desde = new Date(ahora - dias * DIA).toISOString(), previo = new Date(ahora - 2 * dias * DIA).toISOString();
  const [productos, ordenes, eventos, resultados, tests] = await Promise.all([
    all(env, "SELECT id, nombre, activo, json_extract(contenido, '$.oculto') oculto FROM products"),
    // Una fila por producto de cada orden; la tienda es chica, se agrupa aquí para poder quitar los correos internos
    all(env, `SELECT o.id, o.email, o.nombre, o.estado, o.monto_centavos, o.created_at, o.paid_at, o.recordatorio_at, o.proveedor,
        i.product_id, i.nombre producto, i.precio_centavos * i.cantidad monto_item
      FROM orders o JOIN order_items i ON i.order_id = o.id
      WHERE o.estado IN ('paid', 'failed', 'pending') AND o.proveedor NOT IN ('regalo', 'cortesia') AND (o.estado <> 'paid' OR o.monto_centavos > 0)
      ORDER BY o.created_at`),
    all(env, `SELECT product_id id, SUM(tipo = 'view_product') vistas, SUM(tipo = 'begin_checkout') checkouts
      FROM events WHERE created_at >= ? AND product_id IS NOT NULL GROUP BY product_id`, desde),
    all(env, 'SELECT app, COUNT(*) n FROM simulador_resultados WHERE created_at >= ? GROUP BY app', desde),
    all(env, 'SELECT producto, COUNT(*) n FROM tests_resultados WHERE created_at >= ? GROUP BY producto', desde).catch(() => []),
  ]);

  const L = Object.fromEntries(LINEAS.map(l => [l.clave, {
    clave: l.clave, nombre: l.nombre, productos_activos: 0, productos: [],
    ventas: 0, monto_centavos: 0, ventas_previo: 0, monto_previo_centavos: 0, ventas_total: 0, monto_total_centavos: 0, ultima_venta: null,
    vistas: 0, checkouts: 0, uso: null, interesados: [],
  }]));
  for (const p of productos) {
    const l = L[lineaDe(p.id)];
    l.productos.push(p.id);
    if (p.activo) l.productos_activos++;
  }
  for (const e of eventos) { const l = L[lineaDe(e.id)]; l.vistas += e.vistas || 0; l.checkouts += e.checkouts || 0; }

  // Ventas: una orden cuenta una vez por línea (aunque lleve dos productos de la misma)
  const vistas = new Set(), compro = {};
  for (const o of ordenes) {
    if (o.estado !== 'paid' || esInterno(o.email, internos)) continue;
    const clave = lineaDe(o.product_id), l = L[clave], k = `${clave}|${o.id}`, correo = o.email.toLowerCase();
    (compro[clave] ||= {})[correo] = o.paid_at > (compro[clave][correo] || '') ? o.paid_at : compro[clave][correo];
    l.monto_total_centavos += o.monto_item;
    if (o.paid_at >= desde) l.monto_centavos += o.monto_item;
    else if (o.paid_at >= previo) l.monto_previo_centavos += o.monto_item;
    if (vistas.has(k)) continue;
    vistas.add(k);
    l.ventas_total++;
    if (o.paid_at >= desde) l.ventas++;
    else if (o.paid_at >= previo) l.ventas_previo++;
    if (!l.ultima_venta || o.paid_at > l.ultima_venta) l.ultima_venta = o.paid_at;
  }

  // Interesados: intentaron pagar en el periodo y no han comprado nada de esa línea después (uno por correo y línea)
  const yaListado = new Set();
  for (const o of [...ordenes].reverse()) {
    if (o.estado === 'paid' || o.created_at < desde || esInterno(o.email, internos)) continue;
    const clave = lineaDe(o.product_id), correo = o.email.toLowerCase(), k = `${clave}|${correo}`;
    if (yaListado.has(k) || (compro[clave]?.[correo] || '') >= o.created_at) continue;
    yaListado.add(k);
    L[clave].interesados.push({ orden: o.id, nombre: o.nombre, email: o.email, producto: o.producto, monto_centavos: o.monto_centavos,
      estado: o.estado, fecha: o.created_at, recordatorio_at: o.recordatorio_at });
  }

  // Uso que vive en la tienda: resultados de simuladores y tests en el periodo
  for (const l of LINEAS) {
    if (l.app) L[l.clave].uso = { etiqueta: 'resultados de simulador', valor: resultados.filter(r => r.app === l.app || r.app.startsWith(`${l.app}-`)).reduce((s, r) => s + r.n, 0) };
    if (l.test) L[l.clave].uso = { etiqueta: 'tests contestados', valor: tests.find(t => t.producto === l.test)?.n || 0 };
  }

  const lineas = LINEAS.map(l => L[l.clave]).filter(l => l.productos.length);
  for (const l of lineas) delete l.productos;
  return { generado: new Date(ahora).toISOString(), dias, desde, lineas };
}
