// Administración de la tienda. Estas funciones solo se llaman por RPC desde Vorka OS
// (service binding a la clase Admin de index.js): no tienen ruta pública.
// Vorka OS se encarga de que solo el rol Ejecutivo llegue aquí.
import { z } from 'zod';
import { all, one, run, ahoraISO } from './util.js';
import { reenviarEnlace } from './entrega.js';
import { crearEnlace } from './creadores-acceso.js';
import { enlaceAcceso, solicitudRechazada, productoRevisado } from './correos-creadores.js';
import { refrescarCreador } from './marketplace.js';
import { motivoNoRecordar } from './recordatorio.js';

const TZ = 'America/Mexico_City';
const fechaMx = iso => iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 16) : '';
// Rango de días en hora de CDMX → ISO UTC (CDMX es UTC−6 todo el año)
const inicioDia = d => `${d}T06:00:00.000Z`;
const finDia = d => { const t = new Date(`${d}T06:00:00.000Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString(); };
const FECHA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MES = z.string().regex(/^\d{4}-\d{2}$/);

export const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');

const producto = r => r && { ...r, activo: !!r.activo, r2_keys: JSON.parse(r.r2_keys || '[]'), contenido: JSON.parse(r.contenido || '{}') };

// ---------- resumen ----------
export async function resumen(env, { mes } = {}) {
  mes = MES.safeParse(mes).success ? mes : new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 7);
  const desde = inicioDia(`${mes}-01`);
  const [a, m] = mes.split('-').map(Number);
  const hasta = inicioDia(`${m === 12 ? a + 1 : a}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`);
  const ventas = await one(env, "SELECT COUNT(*) n, COALESCE(SUM(monto_centavos), 0) monto FROM orders WHERE estado = 'paid' AND paid_at >= ? AND paid_at < ?", desde, hasta);
  const pendientes = await one(env, "SELECT COUNT(*) n FROM orders WHERE estado = 'pending' AND metodo_pago IN ('oxxo', 'customer_balance')");
  const embudo = await all(env, `SELECT p.id, p.nombre,
      (SELECT COUNT(*) FROM events e WHERE e.product_id = p.id AND e.tipo = 'view_product' AND e.created_at >= ? AND e.created_at < ?) vistas,
      (SELECT COUNT(*) FROM events e WHERE e.product_id = p.id AND e.tipo = 'begin_checkout' AND e.created_at >= ? AND e.created_at < ?) checkouts,
      (SELECT COUNT(*) FROM events e WHERE e.product_id = p.id AND e.tipo = 'purchase' AND e.created_at >= ? AND e.created_at < ?) compras
    FROM products p ORDER BY p.orden, p.nombre`, desde, hasta, desde, hasta, desde, hasta);
  return { mes, ventas: ventas.n, monto_centavos: ventas.monto, pendientes_efectivo: pendientes.n, embudo };
}

// ---------- órdenes ----------
const FiltrosOrdenes = z.object({
  estado: z.enum(['pending', 'paid', 'failed', 'refunded']).optional().catch(undefined),
  desde: FECHA.optional().catch(undefined),
  hasta: FECHA.optional().catch(undefined),
  producto: z.string().max(80).optional().catch(undefined),
  afiliado: z.string().max(40).optional().catch(undefined),
  q: z.string().trim().max(120).optional().catch(undefined),
  pagina: z.coerce.number().int().min(0).max(1000).default(0).catch(0),
});
const POR_PAGINA = 50;

export async function ordenes(env, filtros = {}) {
  const f = FiltrosOrdenes.parse(filtros);
  const w = [], p = [];
  if (f.estado) { w.push('o.estado = ?'); p.push(f.estado); }
  if (f.desde) { w.push('o.created_at >= ?'); p.push(inicioDia(f.desde)); }
  if (f.hasta) { w.push('o.created_at < ?'); p.push(finDia(f.hasta)); }
  if (f.producto) { w.push('EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.product_id = ?)'); p.push(f.producto); }
  if (f.afiliado) { w.push('o.ref_code = ?'); p.push(f.afiliado.toUpperCase()); }
  if (f.q) { w.push('(o.email LIKE ? OR o.nombre LIKE ? OR o.id LIKE ?)'); p.push(`%${f.q}%`, `%${f.q}%`, `${f.q}%`); }
  const donde = w.length ? `WHERE ${w.join(' AND ')}` : '';
  const total = await one(env, `SELECT COUNT(*) n FROM orders o ${donde}`, ...p);
  const lista = await all(env, `SELECT o.id, o.email, o.nombre, o.monto_centavos, o.moneda, o.estado, o.metodo_pago, o.ref_code, o.created_at, o.paid_at, o.correo_enviado_at, o.recordatorio_at,
      (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = o.id) productos
    FROM orders o ${donde} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, ...p, POR_PAGINA, f.pagina * POR_PAGINA);
  return { total: total.n, pagina: f.pagina, por_pagina: POR_PAGINA, ordenes: lista };
}

export async function orden(env, id) {
  const o = await one(env, 'SELECT * FROM orders WHERE id = ?', String(id));
  if (!o) return null;
  const items = await all(env, 'SELECT i.*, p.slug FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', o.id);
  const tokens = (await all(env, 'SELECT id, expires_at, descargas, revocado, created_at FROM download_tokens WHERE order_id = ? ORDER BY id DESC', o.id))
    .map(t => ({ ...t, revocado: !!t.revocado, vencido: t.expires_at < ahoraISO(), descargas: Object.values(JSON.parse(t.descargas || '{}')).reduce((s, n) => s + n, 0) }));
  const trf = await all(env, 'SELECT t.*, c.nombre creador_nombre FROM transferencias t JOIN creadores c ON c.id = t.creador_id WHERE t.order_id = ?', o.id);
  // Recordatorio de pago: se puede mandar una sola vez (si no, por qué no)
  const recordatorio = ['pending', 'failed'].includes(o.estado) ? { enviado: o.recordatorio_at, motivo: await motivoNoRecordar(env, o) } : null;
  return { ...o, items, tokens, transferencias: trf, recordatorio };
}

export async function reenviar(env, id) {
  const ok = await reenviarEnlace(env, String(id));
  if (!ok) throw new Error('Solo se puede reenviar a órdenes pagadas.');
  return { ok: true };
}

export async function revocar(env, id) {
  const r = await run(env, 'UPDATE download_tokens SET revocado = 1 WHERE order_id = ? AND revocado = 0', String(id));
  return { revocados: r.meta.changes };
}

// CSV para la factura global del contador: compras pagadas (y reembolsadas, marcadas) en el rango
const celda = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export async function exportarCSV(env, { desde, hasta }) {
  if (!FECHA.safeParse(desde).success || !FECHA.safeParse(hasta).success) throw new Error('Elige las fechas.');
  const filas = await all(env, `SELECT o.*, (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = o.id) productos
    FROM orders o WHERE o.estado IN ('paid', 'refunded') AND o.paid_at >= ? AND o.paid_at < ? ORDER BY o.paid_at`, inicioDia(desde), finDia(hasta));
  const enc = ['fecha', 'orden', 'nombre', 'correo', 'producto', 'monto', 'moneda', 'metodo_pago', 'id_pago_stripe', 'estado'];
  const lineas = filas.map(o => [fechaMx(o.paid_at), o.id, o.nombre, o.email, o.productos, (o.monto_centavos / 100).toFixed(2), o.moneda,
    { card: 'tarjeta', oxxo: 'oxxo', customer_balance: 'spei' }[o.metodo_pago] || o.metodo_pago || '', o.provider_payment_id || '', o.estado === 'paid' ? 'pagada' : 'reembolsada'].map(celda).join(','));
  // BOM para que Excel abra bien los acentos
  return '﻿' + [enc.join(','), ...lineas].join('\r\n') + '\r\n';
}

// ---------- productos ----------
export async function productos(env) {
  return (await all(env, `SELECT p.*, c.nombre creador_nombre,
      (SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE i.product_id = p.id AND o.estado = 'paid') vendidos
    FROM products p LEFT JOIN creadores c ON c.id = p.creador_id ORDER BY p.creador_id IS NOT NULL, p.orden, p.nombre`)).map(producto);
}
export const productoPorId = async (env, id) => producto(await one(env, 'SELECT * FROM products WHERE id = ?', String(id)));

const linea = z.string().trim().max(400);
const EsquemaProducto = z.object({
  id: z.string().max(80).optional(),
  nombre: z.string().trim().min(3, 'Escribe el nombre del producto.').max(160),
  slug: z.string().trim().max(60).optional(),
  descripcion_corta: z.string().trim().max(300).default(''),
  precio: z.coerce.number({ error: 'Escribe el precio.' }).min(0).max(1000000),
  activo: z.boolean().default(false),
  categoria: z.string().trim().max(40).optional().nullable(),
  orden: z.coerce.number().int().min(0).max(9999).default(0),
  archivos: z.array(z.object({ key: z.string().max(300), nombre: z.string().trim().min(1).max(120) })).max(30).optional(),
  contenido: z.object({
    titular: linea.optional(), subtitulo: z.string().trim().max(600).optional(), portada: z.string().trim().max(60).optional(),
    incluye: z.array(z.object({ titulo: linea, texto: linea.optional() })).max(20).default([]),
    pasos: z.array(z.object({ titulo: linea, texto: z.string().trim().max(800).optional() })).max(20).default([]),
    para_quien: z.array(linea).max(20).default([]),
    faq: z.array(z.object({ p: linea, r: z.string().trim().max(1500) })).max(30).default([]),
  }).optional(), // si no viene, se conserva el contenido que ya tenía
});

// Texto de FAQ propio del producto: viene del panel como texto plano → se escapa y los saltos de línea se vuelven <br>
const htmlSeguro = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/\n/g, '<br>');

// Slugs que no pueden usarse porque son rutas de la tienda
const RESERVADOS = new Set(['gracias', 'retomar', 'img', 'estilos-css', 'sitemap-xml', 'creadores', 'descargas', 'api', 'legal', 'carrito', 'checkout', 'buscar']);
export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Slug escrito a mano en el editor: formato válido, no reservado y que nadie más lo use (ni como enlace anterior de otro producto)
export async function validarSlug(env, slug, id) {
  if (!SLUG_VALIDO.test(slug) || slug.length < 3 || slug.length > 60) throw new Error('El enlace solo puede llevar minúsculas, números y guiones (de 3 a 60), sin acentos ni espacios.');
  if (RESERVADOS.has(slug)) throw new Error(`"${slug}" está reservado por la tienda. Elige otro enlace.`);
  if (await one(env, 'SELECT 1 FROM products WHERE slug = ? AND id != ?', slug, id || '')) throw new Error(`Ya hay otro producto con el enlace "${slug}".`);
  if (await one(env, 'SELECT 1 FROM slugs_anteriores WHERE slug = ? AND product_id != ?', slug, id || '')) throw new Error(`"${slug}" fue el enlace de otro producto y sigue redirigiendo ahí. Elige otro.`);
  return slug;
}

async function slugLibre(env, base, id) {
  base = slugify(base) || 'producto';
  for (let k = 1; k < 50; k++) {
    const s = k === 1 ? base : `${base}-${k}`;
    if (!(await one(env, 'SELECT 1 FROM products WHERE slug = ? AND id != ?', s, id || ''))) return s;
  }
  return `${base}-${Date.now() % 100000}`;
}

export async function guardarProducto(env, datos) {
  const v = EsquemaProducto.safeParse(datos);
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  const actual = d.id ? await productoPorId(env, d.id) : null;
  if (d.id && !actual) throw new Error('Ese producto ya no existe.');

  // Archivos: solo se pueden renombrar o reordenar los que ya se subieron
  let archivos = actual?.r2_keys || [];
  if (d.archivos) {
    const existentes = new Set(archivos.map(a => a.key));
    if (d.archivos.some(a => !existentes.has(a.key))) throw new Error('Hay un archivo que ya no existe. Recarga la página.');
    archivos = d.archivos;
  }
  if (d.activo && !archivos.length) throw new Error('Sube al menos un archivo antes de poner el producto a la venta.');
  // No se activa un producto cuyos archivos no están realmente en R2 (el comprador recibiría un enlace roto)
  if (d.activo) for (const a of archivos)
    if (!(await env.PRODUCTOS.head(a.key))) throw new Error(`Falta subir "${a.nombre}". Quítalo de la lista o súbelo de nuevo.`);

  const contenido = d.contenido
    ? { ...d.contenido, faq: d.contenido.faq.map(f => ({ p: f.p, r: htmlSeguro(f.r) })) }
    : actual?.contenido || {};
  // Si escribieron un enlace nuevo a mano se valida y no se cambia en silencio; si no, se arma solo del nombre
  const pedido = d.slug ? d.slug.toLowerCase() : null;
  const slug = pedido && pedido !== actual?.slug ? await validarSlug(env, pedido, d.id) : await slugLibre(env, actual?.slug || d.slug || d.nombre, d.id);
  // El enlace anterior se guarda para redirigir (301) a quien lo tenga guardado o compartido
  if (actual && slug !== actual.slug) await env.DB.batch([
    env.DB.prepare('INSERT INTO slugs_anteriores (slug, product_id) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET product_id = excluded.product_id').bind(actual.slug, actual.id),
    env.DB.prepare('DELETE FROM slugs_anteriores WHERE slug = ? AND product_id = ?').bind(slug, actual.id),
  ]);
  const precio_centavos = Math.round(d.precio * 100);
  if (actual) {
    await run(env, `UPDATE products SET nombre = ?, slug = ?, descripcion_corta = ?, precio_centavos = ?, activo = ?, categoria = ?, orden = ?,
        r2_keys = ?, contenido = ?, updated_at = ? WHERE id = ?`,
      d.nombre, slug, d.descripcion_corta, precio_centavos, d.activo ? 1 : 0, d.categoria || null, d.orden, JSON.stringify(archivos), JSON.stringify(contenido), ahoraISO(), d.id);
    return productoPorId(env, d.id);
  }
  const id = `prod_${slug.replace(/-/g, '_')}_${crypto.randomUUID().slice(0, 6)}`;
  await run(env, `INSERT INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    id, slug, d.nombre, d.descripcion_corta, precio_centavos, d.activo ? 1 : 0, d.categoria || null, d.orden, JSON.stringify(archivos), JSON.stringify(contenido));
  return productoPorId(env, id);
}

// Para el editor: el FAQ guardado tiene <br>; se devuelve como texto plano
export const faqComoTexto = r => String(r || '').replace(/<br>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export async function borrarProducto(env, id) {
  const ventas = await one(env, 'SELECT COUNT(*) n FROM order_items WHERE product_id = ?', String(id));
  if (ventas.n) throw new Error('Este producto ya tiene órdenes: desactívalo en lugar de borrarlo.');
  await run(env, 'DELETE FROM products WHERE id = ?', String(id));
  return { ok: true };
}

const nombreSeguro = n => String(n || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_').replace(/^_+/, '').slice(0, 120) || 'archivo';
export const MAX_ARCHIVO = 100 * 1048576;

// R2 necesita saber el tamaño de un stream de antemano
const conTamano = (cuerpo, tamano) =>
  cuerpo instanceof ReadableStream && typeof FixedLengthStream !== 'undefined' ? cuerpo.pipeThrough(new FixedLengthStream(tamano)) : cuerpo;

// Sube un archivo descargable del producto al bucket privado y lo agrega a su lista
export async function subirArchivo(env, id, { nombre, tipo, cuerpo, tamano, etiqueta }) {
  const p = await productoPorId(env, id);
  if (!p) throw new Error('Ese producto ya no existe.');
  if (!(tamano > 0)) throw new Error('El archivo está vacío.');
  if (tamano > MAX_ARCHIVO) throw new Error('El archivo pesa más de 100 MB.');
  const archivo = nombreSeguro(nombre);
  let key = `${p.slug}/${archivo}`;
  if (p.r2_keys.some(a => a.key === key)) key = `${p.slug}/${Date.now().toString(36)}-${archivo}`;
  await env.PRODUCTOS.put(key, conTamano(cuerpo, tamano), { httpMetadata: { contentType: tipo || 'application/octet-stream' } });
  const lista = [...p.r2_keys, { key, nombre: (etiqueta || nombre || archivo).replace(/\.[a-z0-9]{2,5}$/i, '').slice(0, 120) }];
  await run(env, 'UPDATE products SET r2_keys = ?, updated_at = ? WHERE id = ?', JSON.stringify(lista), ahoraISO(), p.id);
  return productoPorId(env, p.id);
}

// Quita el archivo de la lista. El objeto se queda en R2 (no rompe nada; se puede volver a subir).
export async function quitarArchivo(env, id, key) {
  const p = await productoPorId(env, id);
  if (!p) throw new Error('Ese producto ya no existe.');
  const lista = p.r2_keys.filter(a => a.key !== key);
  if (p.activo && !lista.length) throw new Error('Un producto a la venta necesita al menos un archivo. Desactívalo primero.');
  await run(env, 'UPDATE products SET r2_keys = ?, updated_at = ? WHERE id = ?', JSON.stringify(lista), ahoraISO(), p.id);
  return productoPorId(env, p.id);
}

// Portada pública: vive en el mismo bucket bajo portadas/ y se sirve por /tienda/img/<key>
const TIPOS_IMAGEN = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export async function subirPortada(env, id, { tipo, cuerpo, tamano }) {
  const p = await productoPorId(env, id);
  if (!p) throw new Error('Ese producto ya no existe.');
  const ext = TIPOS_IMAGEN[tipo];
  if (!ext) throw new Error('La portada debe ser JPG, PNG o WebP.');
  if (!(tamano > 0) || tamano > 8 * 1048576) throw new Error('La portada debe pesar menos de 8 MB.');
  const key = `portadas/${p.slug}-${Date.now().toString(36)}.${ext}`;
  await env.PRODUCTOS.put(key, conTamano(cuerpo, tamano), { httpMetadata: { contentType: tipo, cacheControl: 'public, max-age=31536000, immutable' } });
  await run(env, 'UPDATE products SET imagen = ?, updated_at = ? WHERE id = ?', `/tienda/img/${key}`, ahoraISO(), p.id);
  return productoPorId(env, p.id);
}
export async function quitarPortada(env, id) {
  await run(env, 'UPDATE products SET imagen = NULL, updated_at = ? WHERE id = ?', ahoraISO(), String(id));
  return productoPorId(env, id);
}

// ---------- afiliados ----------
export async function afiliados(env) {
  return (await all(env, `SELECT a.*,
      (SELECT COUNT(*) FROM orders o WHERE o.ref_code = a.code AND o.estado = 'paid') ventas,
      (SELECT COALESCE(SUM(o.monto_centavos), 0) FROM orders o WHERE o.ref_code = a.code AND o.estado = 'paid') monto_centavos
    FROM affiliates a ORDER BY a.activo DESC, a.nombre`)).map(a => ({ ...a, activo: !!a.activo }));
}

const EsquemaAfiliado = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,40}$/, 'El código lleva solo letras, números, guion o guion bajo (2 a 40).'),
  nombre: z.string().trim().min(2, 'Escribe el nombre.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Correo no válido.')).optional().or(z.literal('')),
  comision_pct: z.coerce.number().min(0).max(100),
  activo: z.boolean().default(true),
  nuevo: z.boolean().default(false),
});

export async function guardarAfiliado(env, datos) {
  const v = EsquemaAfiliado.safeParse(datos);
  if (!v.success) throw new Error(v.error.issues[0].message);
  const a = v.data;
  const existe = await one(env, 'SELECT 1 FROM affiliates WHERE code = ?', a.code);
  if (a.nuevo && existe) throw new Error('Ese código ya existe. Elige otro.');
  if (existe) await run(env, 'UPDATE affiliates SET nombre = ?, email = ?, comision_pct = ?, activo = ? WHERE code = ?', a.nombre, a.email || null, a.comision_pct, a.activo ? 1 : 0, a.code);
  else await run(env, 'INSERT INTO affiliates (code, nombre, email, comision_pct, activo) VALUES (?,?,?,?,?)', a.code, a.nombre, a.email || null, a.comision_pct, a.activo ? 1 : 0);
  return { ok: true, code: a.code };
}

// Reporte por afiliado y mes: ventas pagadas, monto y comisión (con el % que tenía al momento de cada venta)
export async function reporteAfiliados(env, { mes }) {
  if (!MES.safeParse(mes).success) throw new Error('Elige el mes.');
  const [a, m] = mes.split('-').map(Number);
  const desde = inicioDia(`${mes}-01`), hasta = inicioDia(`${m === 12 ? a + 1 : a}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`);
  const filas = await all(env, `SELECT a.code, a.nombre, a.email, COUNT(o.id) ventas, COALESCE(SUM(o.monto_centavos), 0) monto_centavos,
      COALESCE(SUM(ROUND(o.monto_centavos * COALESCE(o.comision_pct, a.comision_pct) / 100.0)), 0) comision_centavos
    FROM affiliates a LEFT JOIN orders o ON o.ref_code = a.code AND o.estado = 'paid' AND o.paid_at >= ? AND o.paid_at < ?
    GROUP BY a.code ORDER BY comision_centavos DESC, a.nombre`, desde, hasta);
  const total = filas.reduce((s, f) => ({ ventas: s.ventas + f.ventas, monto_centavos: s.monto_centavos + f.monto_centavos, comision_centavos: s.comision_centavos + f.comision_centavos }), { ventas: 0, monto_centavos: 0, comision_centavos: 0 });
  return { mes, afiliados: filas, total };
}

// ---------- marketplace: creadores, revisión de productos y transferencias ----------

export async function pendientesMarketplace(env) {
  const r = await one(env, `SELECT (SELECT COUNT(*) FROM creadores WHERE estado = 'solicitud') solicitudes,
      (SELECT COUNT(*) FROM products WHERE revision = 'en_revision') revision,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM transferencias WHERE estado = 'programada') por_transferir,
      (SELECT COUNT(*) FROM transferencias WHERE estado = 'error') con_error`);
  return r;
}

export async function creadores(env) {
  return (await all(env, `SELECT c.*,
      (SELECT COUNT(*) FROM products p WHERE p.creador_id = c.id) productos,
      (SELECT COUNT(*) FROM products p WHERE p.creador_id = c.id AND p.activo = 1 AND p.revision = 'aprobado') publicados,
      (SELECT COALESCE(SUM(venta_centavos), 0) FROM transferencias t WHERE t.creador_id = c.id AND t.estado IN ('programada','enviada')) ventas_centavos,
      (SELECT COALESCE(SUM(comision_vorka_centavos), 0) FROM transferencias t WHERE t.creador_id = c.id AND t.estado IN ('programada','enviada')) comision_centavos,
      (SELECT COALESCE(SUM(monto_centavos), 0) FROM transferencias t WHERE t.creador_id = c.id AND t.estado = 'programada') por_transferir_centavos
    FROM creadores c ORDER BY CASE c.estado WHEN 'solicitud' THEN 0 WHEN 'aprobado' THEN 1 WHEN 'suspendido' THEN 2 ELSE 3 END, c.created_at DESC`))
    .map(c => ({ ...c, stripe_listo: !!c.stripe_listo }));
}

const DecisionCreador = z.object({
  accion: z.enum(['aprobar', 'rechazar', 'suspender', 'reactivar']),
  nota: z.string().trim().max(500).optional(),
  comision_pct: z.coerce.number().min(0).max(100).optional(),
});

export async function decidirCreador(env, id, datos) {
  const v = DecisionCreador.safeParse(datos);
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  const c = await one(env, 'SELECT * FROM creadores WHERE id = ?', String(id));
  if (!c) throw new Error('Ese creador ya no existe.');
  const estado = { aprobar: 'aprobado', rechazar: 'rechazado', suspender: 'suspendido', reactivar: 'aprobado' }[d.accion];
  await run(env, `UPDATE creadores SET estado = ?, nota = ?, comision_pct = COALESCE(?, comision_pct),
      aprobado_at = CASE WHEN ? = 'aprobar' THEN ? ELSE aprobado_at END WHERE id = ?`,
    estado, d.nota || null, d.comision_pct ?? null, d.accion, ahoraISO(), c.id);
  const actual = { ...c, estado, nota: d.nota || null };
  if (d.accion === 'aprobar') await enlaceAcceso(env, actual, await crearEnlace(env, c.id), { bienvenida: true });
  if (d.accion === 'rechazar') await solicitudRechazada(env, actual);
  return { ok: true, estado };
}

export async function comisionCreador(env, id, pct) {
  const n = Number(pct);
  if (!(n >= 0 && n <= 100)) throw new Error('La comisión va de 0 a 100 %.');
  await run(env, 'UPDATE creadores SET comision_pct = ? WHERE id = ?', n, String(id));
  return { ok: true };
}

export async function revisarStripeCreador(env, id) {
  const c = await one(env, 'SELECT id, stripe_account_id FROM creadores WHERE id = ?', String(id));
  if (!c?.stripe_account_id) return { listo: false, sin_cuenta: true };
  return { listo: await refrescarCreador(env, c) };
}

export async function revision(env) {
  return (await all(env, `SELECT p.*, c.nombre creador_nombre, c.email creador_email, c.stripe_listo creador_stripe_listo
    FROM products p JOIN creadores c ON c.id = p.creador_id WHERE p.revision = 'en_revision' ORDER BY p.updated_at`)).map(producto);
}

export async function decidirProducto(env, id, { aprobar, nota } = {}) {
  const p = await productoPorId(env, id);
  if (!p?.creador_id) throw new Error('Ese producto no es de un creador.');
  const c = await one(env, 'SELECT * FROM creadores WHERE id = ?', p.creador_id);
  if (aprobar) {
    if (!p.r2_keys.length) throw new Error('El producto no tiene archivos.');
    for (const a of p.r2_keys) if (!(await env.PRODUCTOS.head(a.key))) throw new Error(`Falta el archivo "${a.nombre}".`);
    await run(env, "UPDATE products SET revision = 'aprobado', activo = 1, nota_revision = ?, updated_at = ? WHERE id = ?", nota || null, ahoraISO(), p.id);
  } else {
    if (!String(nota || '').trim()) throw new Error('Escribe qué tiene que cambiar el creador.');
    await run(env, "UPDATE products SET revision = 'rechazado', activo = 0, nota_revision = ?, updated_at = ? WHERE id = ?", String(nota).trim().slice(0, 600), ahoraISO(), p.id);
  }
  await productoRevisado(env, c, { ...p, nota_revision: nota || null }, !!aprobar).catch(e => console.error('aviso revisión', p.id, e.message));
  return { ok: true, publicado: !!aprobar && !!c.stripe_listo, creador_stripe_listo: !!c.stripe_listo };
}

export async function transferencias(env, { estado } = {}) {
  const w = estado ? 'WHERE t.estado = ?' : '';
  return all(env, `SELECT t.*, c.nombre creador_nombre,
      (SELECT GROUP_CONCAT(i.nombre, ' + ') FROM order_items i WHERE i.order_id = t.order_id AND i.creador_id = t.creador_id) productos
    FROM transferencias t JOIN creadores c ON c.id = t.creador_id ${w} ORDER BY t.created_at DESC LIMIT 200`, ...(estado ? [estado] : []));
}

// Para revisar un producto: el archivo tal cual lo subió el creador (solo por RPC desde Vorka OS)
export async function archivoRevision(env, id, key) {
  const p = await productoPorId(env, id);
  if (!p || !p.r2_keys.some(a => a.key === key)) throw new Error('Ese archivo no es de este producto.');
  const o = await env.PRODUCTOS.get(key);
  if (!o) throw new Error('El archivo no está.');
  return { cuerpo: o.body, tipo: o.httpMetadata?.contentType || 'application/octet-stream', nombre: key.split('/').pop() };
}
