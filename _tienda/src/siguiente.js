// «Lo que sigue» después de pagar (página de gracias y correo de acceso): hasta dos sugerencias según lo que compró y,
// a estudiantes, un cupón de regalo para su segundo producto de Educación (simuladores, tests, Ruta de Impacto).
// - El cupón es un REGALO-XXXX-XXXX de cupones_regalo: lote fijo «siguiente-<orden>» (nunca dos por orden), un uso,
//   PCT_SIGUIENTE % solo en la línea Educación (alcance 'linea'), DIAS_SIGUIENTE días. No se acumula con otros descuentos:
//   en la compra gana el mayor (descuentos.js). Se ve en Tienda › Regalar como cualquier cupón.
// - Solo compras pagadas con dinero (no regalos, cortesías ni simulacros adicionales).
// Decisión 2026-11-24 (Brandon, «haz todo»): 20 % como el de las reseñas; cambiarlo aquí si se decide otro.
import { one, all, run, pesos } from './util.js';
import { codigoAzar } from './cupones-regalo.js';

export const PCT_SIGUIENTE = 20, DIAS_SIGUIENTE = 30, LINEA_SIGUIENTE = 'examenes';
const DIA = 864e5;

const MENTORIA = {
  titulo: 'Una asesoría con Brandon',
  texto: 'Revisa con él tu plan: qué carrera, qué universidad y cómo llegar al examen. Es en línea y tú eliges el horario.',
  href: 'https://os.vorka.mx/agendar/oleynickhdz?s=express&o=tienda-gracias', boton: 'Ver horarios',
};
const OTRO_EXAMEN = {
  titulo: '¿Vas a presentar en otra universidad?',
  texto: 'Revisa qué examen pide cada una (EXANI-II, EXCOBA, PAA, UNAM o IPN) y practica también ese.',
  href: '/simulador-exani-ii/universidades/', boton: 'Ver qué examen te toca', conCupon: true,
};
const prod = slug => ({ slug });
const LICENCIATURA = [OTRO_EXAMEN, MENTORIA];
// Por app del producto comprado (contenido.acceso.app)
export const REGLAS = {
  'simulador-paa': LICENCIATURA, 'simulador-unam': LICENCIATURA, 'simulador-ipn': LICENCIATURA,
  'simulador-exani-ii': LICENCIATURA, 'simulador-excoba': LICENCIATURA,
  'simulador-ecoems': [MENTORIA], 'simulador-prepa-ug': [MENTORIA],
  simuladores: [MENTORIA],
  'test-vocacional': [prod('evaluacion-liderazgo'), MENTORIA],
  liderazgo: [MENTORIA, prod('test-vocacional')],
  'que-proyecto-social': [prod('ruta-de-impacto')],
  ruta: [prod('que-proyecto-social')],
};
const contenido = c => { try { return typeof c === 'string' ? JSON.parse(c || '{}') : c || {}; } catch { return {}; } };
// El acceso «principal» de la orden: el primer renglón con regla (los simulacros adicionales y los grupos no cuentan)
export function appPrincipal(items) {
  for (const it of items) {
    const a = contenido(it.contenido).acceso;
    if (a && REGLAS[a.app] && !['intento', 'examen', 'grupo'].includes(a.tipo)) return a.app;
  }
  return null;
}
const esVenta = o => o && o.estado === 'paid' && !o.regalo && o.monto_centavos > 0 && !['regalo', 'cortesia'].includes(o.proveedor);

/** Sugerencias para una orden: [{ titulo, texto, href, boton, precio? }] (máx. 2; los productos inactivos se saltan). */
export async function sugerenciasDe(env, items, cupon = null) {
  const app = appPrincipal(items);
  if (!app) return [];
  const comprados = new Set(items.map(i => i.slug).filter(Boolean));
  const slugs = REGLAS[app].filter(r => r.slug && !comprados.has(r.slug)).map(r => r.slug);
  const ps = slugs.length ? await all(env, `SELECT slug, nombre, precio_centavos, contenido FROM products WHERE activo = 1 AND slug IN (${slugs.map(() => '?').join(',')})`, ...slugs) : [];
  const conCupon = (href, si) => (si && cupon ? `${href}${href.includes('?') ? '&' : '?'}cupon=${cupon.codigo}` : href);
  return REGLAS[app].map(r => {
    if (!r.slug) return { ...r, href: conCupon(r.href, r.conCupon) };
    const p = ps.find(x => x.slug === r.slug);
    if (!p) return null;
    const c = contenido(p.contenido);
    return { titulo: p.nombre, texto: c.descripcion_corta || c.acceso?.detalle || '', href: conCupon(c.acceso?.ruta || `/tienda/${p.slug}/`, true), boton: 'Conocer', precio: p.precio_centavos };
  }).filter(Boolean).slice(0, 2);
}

/** Cupón de la orden (lo crea una sola vez). null si la orden no lo lleva. */
export async function cuponSiguiente(env, orden, items, ahora = Date.now()) {
  if (!esVenta(orden) || !appPrincipal(items)) return null;
  const lote = `siguiente-${orden.id}`;
  const ya = await one(env, 'SELECT codigo, hasta FROM cupones_regalo WHERE lote = ?', lote);
  if (ya) return ya;
  const hasta = new Date(ahora - 6 * 3600e3 + DIAS_SIGUIENTE * DIA).toISOString().slice(0, 10);
  for (let k = 0; k < 8; k++) {
    const c = codigoAzar();
    const x = await run(env, `INSERT OR IGNORE INTO cupones_regalo (codigo, lote, tipo, pct, alcance, linea, max_usos, hasta, nota, creado_por)
      SELECT ?, ?, 'pct', ?, 'linea', ?, 1, ?, ?, 'siguiente' WHERE NOT EXISTS (SELECT 1 FROM codigos_descuento WHERE codigo = ?) AND NOT EXISTS (SELECT 1 FROM cupones_regalo WHERE lote = ?)`,
      c, lote, PCT_SIGUIENTE, LINEA_SIGUIENTE, hasta, 'Segundo producto de Educación (después de pagar)', c, lote);
    if (x.meta.changes) return { codigo: c, hasta };
    const otro = await one(env, 'SELECT codigo, hasta FROM cupones_regalo WHERE lote = ?', lote);
    if (otro) return otro;
  }
  return null;
}

/** Todo junto para la página de gracias y el correo. Nunca rompe la entrega: si algo falla, no sugiere nada. */
export async function siguienteDe(env, orden, items) {
  try {
    if (!esVenta(orden)) return null;
    const cupon = await cuponSiguiente(env, orden, items);
    const sugerencias = await sugerenciasDe(env, items, cupon);
    return sugerencias.length || cupon ? { cupon, sugerencias } : null;
  } catch (e) { console.error('siguiente:', orden?.id, e.message); return null; }
}

const fecha = iso => iso.split('-').reverse().join('/');
const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Bloque HTML de la página de gracias */
export function bloqueGracias(s) {
  if (!s) return '';
  const cupon = s.cupon ? `<p class="t-sig-cupon">Tu siguiente producto de Educación con <b>${PCT_SIGUIENTE}&nbsp;% menos</b>: usa el código <code>${escH(s.cupon.codigo)}</code> (un uso, hasta el ${escH(fecha(s.cupon.hasta))}).</p>` : '';
  const tarjetas = s.sugerencias.map(x => `<a class="t-sig-c" href="${escH(x.href)}"${/^https:/.test(x.href) ? ' target="_blank" rel="noopener"' : ''}><b>${escH(x.titulo)}</b>${x.texto ? `<span>${escH(x.texto)}</span>` : ''}<em>${x.precio ? `${escH(pesos(x.precio))} · ` : ''}${escH(x.boton)} →</em></a>`).join('');
  return `<div class="t-sig"><h2>Lo que sigue</h2>${cupon}${tarjetas ? `<div class="t-sig-l">${tarjetas}</div>` : ''}</div>`;
}
export const CSS_GRACIAS = '.t-sig{margin:26px auto 0;max-width:34em;border-top:1px solid var(--line);padding-top:18px;display:grid;gap:12px;text-align:left}.t-sig h2{font-size:19px;margin:0;text-align:center}.t-sig-cupon{margin:0;color:var(--fg-2)}.t-sig-cupon code{font-weight:800;letter-spacing:.06em;border:1.5px dashed currentColor;border-radius:8px;padding:2px 6px;white-space:nowrap}.t-sig-l{display:grid;gap:10px}.t-sig-c{display:grid;gap:4px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;color:inherit;text-decoration:none}.t-sig-c:hover{border-color:currentColor}.t-sig-c span{color:var(--fg-2);font-size:15px}.t-sig-c em{font-style:normal;font-weight:700;font-size:15px}';

/** Párrafos para el correo de acceso: { html, texto } (vacíos si no hay nada) */
export function bloqueCorreo(s, base, { P, boton }) {
  if (!s) return { html: '', texto: '' };
  const abs = h => (/^https?:/.test(h) ? h : `${base}${h}`);
  const cupon = s.cupon ? `<p style="${P}">Para lo que sigue: <b>${PCT_SIGUIENTE}&nbsp;% de descuento</b> en tu siguiente producto de Educación con el código <b>${escH(s.cupon.codigo)}</b> (un uso, hasta el ${escH(fecha(s.cupon.hasta))}).</p>` : '';
  const sug = s.sugerencias.map(x => `<p style="${P}"><b>${escH(x.titulo)}</b>${x.precio ? ` · ${escH(pesos(x.precio))}` : ''}<br>${escH(x.texto)}</p>${boton(abs(x.href), x.boton)}`).join('');
  const texto = [s.cupon ? `Para lo que sigue: ${PCT_SIGUIENTE} % de descuento en tu siguiente producto de Educación con el código ${s.cupon.codigo} (un uso, hasta el ${fecha(s.cupon.hasta)}).` : '',
    ...s.sugerencias.map(x => `${x.titulo}${x.precio ? ` · ${pesos(x.precio)}` : ''}\n${x.texto}\n${abs(x.href)}`)].filter(Boolean).join('\n\n');
  return { html: cupon + sug, texto };
}
