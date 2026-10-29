// Cupones de regalo (migración 0055): los crea el equipo en Vorka OS › Tienda › Regalar › Cupón de descuento, por la clase
// Admin (service binding TIENDA). Cómo se aplican al pagar: src/descuentos.js (evaluarRegalo, centavosDe) y src/pagos/stripe.js.
//
// - Transferibles: el cupón NO va ligado a un correo. Quien tenga el código lo usa en el campo «código» de cualquier compra.
// - Código REGALO-XXXX-XXXX: 8 caracteres al azar de un alfabeto sin ambiguos (sin 0/O, 1/I/L), 31^8 ≈ 8.5 × 10^11
//   combinaciones; único en cupones_regalo y frente a codigos_descuento. Adivinar uno además choca con el límite por IP de
//   /api/puntos/liga (30 / 10 min).
// - «Para quién» y la nota son referencia interna: nunca se mandan.
// - Envío por correo opcional («Enviar por correo» / «Reenviar»): el correo solo es la forma de entregarlo; el cupón sigue
//   siendo transferible. Se guarda solo el último envío (nombre, correo, cuándo y resultado) para verlo en la lista.
import { z } from 'zod';
import { all, one, run, ahoraISO, correoOculto } from './util.js';
import { dentroDelLimite } from './modelo.js';
import { PREFIJO_REGALO, fin, fechaLarga, pesosTexto, nombreLinea, evaluarCodigo } from './descuentos.js';
import { LINEAS, lineaDe } from './lineas.js';
import { marco, boton, enviar, esc, P, SOPORTE } from './correo.js';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // 31 caracteres, sin 0/O ni 1/I/L
const SITIO = 'https://vorka.mx';
export const MAX_CUPONES = 50;          // por tanda
export const MAX_ENVIOS_HORA = 200;     // correos de cupones por hora (toda la tienda): freno si algo se repite sin querer
const DIAS_DEFECTO = 90;

// 8 caracteres al azar sin sesgo (se descartan los bytes que no caben parejo en 31)
export function codigoAzar() {
  let s = '';
  while (s.length < 8) for (const b of crypto.getRandomValues(new Uint8Array(16))) if (b < 248 && s.length < 8) s += ALFABETO[b % 31];
  return `${PREFIJO_REGALO}-${s.slice(0, 4)}-${s.slice(4)}`;
}
export const FORMATO_CODIGO = new RegExp(`^${PREFIJO_REGALO}-[${ALFABETO}]{4}-[${ALFABETO}]{4}$`);

const hoyMx = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
const masDias = (dia, n) => { const t = new Date(`${dia}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const CORREO = z.string().trim().toLowerCase().pipe(z.email('Revisa el correo.').max(254));
const NOMBRE = z.string().trim().min(1, 'Falta el nombre.').max(80, 'El nombre es muy largo.');

/**
 * «Nombre, correo» por renglón (o «correo» solo) → [{ nombre, email }]. Lanza un error que dice qué renglón está mal.
 * Acepta también una lista ya separada [{ nombre, email }].
 */
export function leerDestinatarios(entrada) {
  const filas = Array.isArray(entrada) ? entrada.map(x => `${x?.nombre ?? ''}, ${x?.email ?? ''}`) : String(entrada || '').split(/\r?\n/);
  const out = [], vistos = new Set();
  filas.map(l => l.trim()).filter(Boolean).forEach((l, i) => {
    const m = l.match(/^(.*?)[,;\t]\s*([^,;\t\s]+@[^,;\t\s]+)\s*$/) || l.match(/^()([^,;\t\s]+@[^,;\t\s]+)$/);
    const e = m && CORREO.safeParse(m[2]);
    if (!e?.success) throw new Error(`Renglón ${i + 1}: escribe «Nombre, correo» (${l.slice(0, 60)}).`);
    const nombre = (m[1] || '').replace(/^["']|["']$/g, '').trim().slice(0, 80) || e.data.split('@')[0];
    if (vistos.has(e.data)) throw new Error(`Renglón ${i + 1}: ${e.data} está repetido.`);
    vistos.add(e.data);
    out.push({ nombre, email: e.data });
  });
  if (out.length > MAX_CUPONES) throw new Error(`Hasta ${MAX_CUPONES} personas por tanda.`);
  return out;
}

const ESQUEMA = z.object({
  tipo: z.enum(['pct', 'monto'], { error: 'Elige porcentaje o monto fijo.' }),
  pct: z.coerce.number().min(5, 'El porcentaje va de 5 a 100.').max(100, 'El porcentaje va de 5 a 100.').optional(),
  monto_pesos: z.coerce.number().int('El monto va en pesos enteros.').min(10, 'El monto mínimo es de $10.').max(50000, 'El monto máximo es de $50,000.').optional(),
  alcance: z.enum(['tienda', 'linea', 'producto'], { error: 'Elige dónde aplica.' }),
  linea: z.string().trim().optional().or(z.literal('')),
  product_id: z.string().trim().max(80).optional().or(z.literal('')),
  max_usos: z.coerce.number().int().min(1, 'Al menos 1 uso.').max(1000, 'Hasta 1,000 usos por cupón.').default(1),
  cantidad: z.coerce.number().int().min(1, 'Al menos 1 cupón.').max(MAX_CUPONES, `Hasta ${MAX_CUPONES} cupones por tanda.`).default(1),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha de vigencia.').optional().or(z.literal('')),
  para: z.string().trim().max(80).optional().or(z.literal('')),
  nota: z.string().trim().max(200).optional().or(z.literal('')),
  creado_por: z.string().trim().max(254).optional().or(z.literal('')),
  destinatarios: z.union([z.string().max(20000), z.array(z.object({ nombre: z.string().optional(), email: z.string() })).max(MAX_CUPONES)]).optional(),
});

// Productos de Vorka a los que se puede dar un cupón (sin creadores, sin complementos ni simulacros adicionales)
async function productosCupon(env) {
  const filas = await all(env, 'SELECT id, slug, nombre, precio_centavos, categoria, activo, contenido, creador_id FROM products WHERE creador_id IS NULL ORDER BY orden, nombre');
  return filas.map(p => ({ ...p, contenido: (() => { try { return JSON.parse(p.contenido || '{}'); } catch { return {}; } })() }))
    .filter(p => !p.contenido.complemento && !['intento', 'examen'].includes(p.contenido.acceso?.tipo))
    .map(p => ({ id: p.id, slug: p.slug, nombre: p.nombre, precio_centavos: p.precio_centavos, activo: !!p.activo, linea: lineaDe(p), suscripcion: !!p.contenido.suscripcion,
      url: `${SITIO}${p.contenido.acceso?.ruta || `/tienda/${p.slug}/`}` }));
}

// La liga directa: la ficha del producto si es de un producto; si no, la tienda (con su línea)
export function ligaCupon(c, productos = []) {
  const p = c.alcance === 'producto' && productos.find(x => x.id === c.product_id);
  const u = new URL(p?.url || `${SITIO}/tienda/`);
  u.searchParams.set('cupon', c.codigo);
  if (c.alcance === 'linea') u.hash = c.linea;
  return u.toString();
}
export const textoValor = c => c.tipo === 'pct' ? `${c.pct} % de descuento` : `${pesosTexto(c.monto_centavos)} de descuento`;
export const textoAlcance = (c, productos = []) => c.alcance === 'producto' ? (productos.find(x => x.id === c.product_id)?.nombre || 'un producto')
  : c.alcance === 'linea' ? `los productos de ${nombreLinea(c.linea)}` : 'toda la tienda de Vorka México';

function estadoDe(c, ahora = ahoraISO()) {
  if (c.revocado_at) return 'revocado';
  if (c.usos >= c.max_usos) return 'usado';
  if (ahora >= fin(c.hasta)) return 'vencido';
  return 'vigente';
}

function vista(c, productos, ordenes = []) {
  const usadas = ordenes.filter(o => o.descuento_codigo === c.codigo);
  return {
    codigo: c.codigo, lote: c.lote, tipo: c.tipo, pct: c.pct, monto_centavos: c.monto_centavos, alcance: c.alcance, linea: c.linea,
    linea_nombre: c.linea ? nombreLinea(c.linea) : null, product_id: c.product_id, producto: c.alcance === 'producto' ? textoAlcance(c, productos) : null,
    valor: textoValor(c), aplica_en: textoAlcance(c, productos),
    max_usos: c.max_usos, usos: c.usos, restantes: Math.max(0, c.max_usos - c.usos), hasta: c.hasta, para: c.para, nota: c.nota,
    creado: c.creado, creado_por: c.creado_por, revocado_at: c.revocado_at, estado: estadoDe(c), url: ligaCupon(c, productos),
    envio: c.envio_at ? { nombre: c.envio_nombre, email: c.envio_email, at: c.envio_at, estado: c.envio_estado, error: c.envio_error, envios: c.envios } : null,
    descuento_dado_centavos: usadas.filter(o => o.estado === 'paid').reduce((s, o) => s + (o.descuento_codigo_centavos || 0), 0),
    ordenes: usadas.map(o => ({ id: o.id, paid_at: o.paid_at, estado: o.estado, monto_centavos: o.monto_centavos, descuento_centavos: o.descuento_codigo_centavos })),
  };
}

// Lista para la pantalla Regalar: cupones (los 500 más recientes) con usos, estado, descuento dado y órdenes; y las opciones del formulario
export async function cuponesRegalo(env) {
  const [filas, productos, ordenes] = await Promise.all([
    all(env, 'SELECT * FROM cupones_regalo ORDER BY creado DESC, codigo LIMIT 500'),
    productosCupon(env),
    all(env, `SELECT id, descuento_codigo, paid_at, estado, monto_centavos, descuento_codigo_centavos FROM orders
      WHERE descuento_codigo LIKE '${PREFIJO_REGALO}-%' AND estado IN ('paid', 'refunded') ORDER BY paid_at DESC`),
  ]);
  return { cupones: filas.map(c => vista(c, productos, ordenes)), lineas: LINEAS, productos, dias_defecto: DIAS_DEFECTO, max_cupones: MAX_CUPONES };
}

/**
 * Crea una tanda de cupones con los mismos datos. Con destinatarios («Nombre, correo» por renglón) se crea un cupón por
 * persona y a cada una le llega el suyo por correo. Devuelve { lote, cupones, enviados, fallidos }.
 */
export async function crearCuponesRegalo(env, datos) {
  const v = ESQUEMA.safeParse(datos || {});
  if (!v.success) throw new Error(v.error.issues[0].message);
  const d = v.data;
  if (d.tipo === 'pct' && d.pct == null) throw new Error('Escribe el porcentaje (5 a 100).');
  if (d.tipo === 'monto' && d.monto_pesos == null) throw new Error('Escribe el monto en pesos.');
  const productos = await productosCupon(env);
  if (d.alcance === 'linea' && !LINEAS.some(l => l.id === d.linea)) throw new Error('Elige la línea.');
  if (d.alcance === 'producto' && !productos.some(p => p.id === d.product_id)) throw new Error('Elige un producto de Vorka México.');
  const hoy = hoyMx(), hasta = d.hasta || masDias(hoy, DIAS_DEFECTO);
  if (hasta < hoy) throw new Error('La vigencia no puede terminar antes de hoy.');
  if (hasta > masDias(hoy, 3 * 366)) throw new Error('La vigencia puede ser de hasta 3 años.');
  const personas = d.destinatarios ? leerDestinatarios(d.destinatarios) : [];
  const cantidad = personas.length || d.cantidad;
  const lote = crypto.randomUUID();
  const creados = [];
  for (let i = 0; i < cantidad; i++) {
    let codigo = null;
    for (let intento = 0; intento < 8 && !codigo; intento++) {
      const c = codigoAzar();
      const r = await run(env, `INSERT OR IGNORE INTO cupones_regalo (codigo, lote, tipo, pct, monto_centavos, alcance, linea, product_id, max_usos, hasta, para, nota, creado_por)
        SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM codigos_descuento WHERE codigo = ?)`,
        c, lote, d.tipo, d.tipo === 'pct' ? d.pct : null, d.tipo === 'monto' ? d.monto_pesos * 100 : null, d.alcance,
        d.alcance === 'linea' ? d.linea : null, d.alcance === 'producto' ? d.product_id : null, d.max_usos, hasta,
        d.para || null, d.nota || null, d.creado_por || null, c);
      if (r.meta.changes) codigo = c;
    }
    if (!codigo) throw new Error('No se pudo crear un código único. Intenta de nuevo.');
    creados.push(codigo);
  }
  let enviados = 0;
  const fallidos = [];
  for (let i = 0; i < personas.length; i++) {
    const r = await enviarCuponRegalo(env, creados[i], personas[i]);
    if (r.ok) enviados++; else fallidos.push({ codigo: creados[i], email: personas[i].email, error: r.error });
  }
  const filas = await all(env, `SELECT * FROM cupones_regalo WHERE lote = ? ORDER BY rowid`, lote);
  return { lote, cupones: filas.map(c => vista(c, productos)), enviados, fallidos };
}

// Revocar un cupón (codigo) o los que sigan vigentes de una tanda (lote). Las compras ya pagadas no cambian.
export async function revocarCuponesRegalo(env, { codigo, lote, por = null } = {}) {
  const ahora = ahoraISO();
  if (codigo) {
    const r = await run(env, 'UPDATE cupones_regalo SET revocado_at = ?, revocado_por = ? WHERE codigo = ? AND revocado_at IS NULL', ahora, por, String(codigo).toUpperCase());
    if (!r.meta.changes) throw new Error('Ese cupón no existe o ya estaba revocado.');
    return { revocados: 1 };
  }
  if (lote) {
    const r = await run(env, 'UPDATE cupones_regalo SET revocado_at = ?, revocado_por = ? WHERE lote = ? AND revocado_at IS NULL AND usos < max_usos', ahora, por, String(lote));
    return { revocados: r.meta.changes };
  }
  throw new Error('Falta el cupón.');
}

/**
 * Manda (o vuelve a mandar) un cupón por correo. Sin { nombre, email } usa los del último envío («Reenviar»).
 * Devuelve { ok, error? } y guarda el resultado en el cupón. Solo cupones vigentes. No lo liga a esa persona.
 */
export async function enviarCuponRegalo(env, codigo, persona = null) {
  const c = await one(env, 'SELECT * FROM cupones_regalo WHERE codigo = ?', String(codigo || '').toUpperCase());
  if (!c) throw new Error('Ese cupón no existe.');
  const estado = estadoDe(c);
  if (estado !== 'vigente') throw new Error(`No se puede mandar: el cupón está ${estado}.`);
  const p = persona?.email ? persona : c.envio_email ? { nombre: c.envio_nombre, email: c.envio_email } : null;
  if (!p) throw new Error('Escribe el nombre y el correo de quien lo recibe.');
  const e = CORREO.safeParse(p.email);
  if (!e.success) throw new Error('Revisa el correo.');
  const n = NOMBRE.safeParse(p.nombre || e.data.split('@')[0]);
  if (!n.success) throw new Error(n.error.issues[0].message);
  if (!(await dentroDelLimite(env, 'cupones-regalo:envios', MAX_ENVIOS_HORA, 3600))) throw new Error('Se mandaron muchos cupones en la última hora. Intenta más tarde.');
  const productos = await productosCupon(env);
  const correo = correoCupon(c, productos, n.data);
  let ok = true, error = null;
  try { await enviar(env, { para: e.data, ...correo, idempotencia: `cupon-regalo-${c.codigo}-${c.envios + 1}` }); }
  catch (x) { ok = false; error = String(x?.message || 'No salió el correo.').slice(0, 200); console.error('cupones regalo: correo falló', c.codigo, correoOculto(e.data), error); }
  await run(env, 'UPDATE cupones_regalo SET envio_nombre = ?, envio_email = ?, envio_at = ?, envio_estado = ?, envio_error = ?, envios = envios + 1 WHERE codigo = ?',
    n.data, e.data, ahoraISO(), ok ? 'enviado' : 'fallo', error, c.codigo);
  return ok ? { ok: true, codigo: c.codigo, email: e.data } : { ok: false, codigo: c.codigo, email: e.data, error: 'El correo no salió. Intenta reenviarlo en unos minutos.' };
}

// El correo «Te regalamos un cupón»: código grande, qué descuento da, dónde aplica, vigencia, botón y que es transferible
export function correoCupon(c, productos, nombre) {
  const primer = String(nombre || '').trim().split(/\s+/)[0] || '';
  const liga = ligaCupon(c, productos), valor = textoValor(c), aplica = textoAlcance(c, productos), vence = fechaLarga(c.hasta);
  // ¿Puede caer en una suscripción? (entonces solo el primer pago)
  const conSus = c.alcance === 'tienda' || (c.alcance === 'linea' && productos.some(p => p.linea === c.linea && p.suscripcion))
    || (c.alcance === 'producto' && productos.some(p => p.id === c.product_id && p.suscripcion));
  const subs = conSus ? ' En planes con cobro mensual o anual, se aplica en el primer pago.' : '';
  const usos = c.max_usos > 1 ? `Se puede usar en ${c.max_usos} compras.` : 'Se usa en una compra.';
  const asunto = primer ? `${primer}, te regalamos un cupón de Vorka México` : 'Te regalamos un cupón de Vorka México';
  const html = marco('Te regalamos un cupón', `
<p style="${P}">Hola${primer ? `, ${esc(primer)}` : ''}:</p>
<p style="${P}">Te regalamos un cupón de descuento para la tienda de Vorka México. Es nuestra forma de darte las gracias y de invitarte a algo que te sirva.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;border:1.5px dashed #C8A45C;border-radius:18px;background:#FBF8F1"><tr><td align="center" style="padding:22px 16px;text-align:center">
  <div style="font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#8a6a2c">Tu código</div>
  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:28px;line-height:1.3;font-weight:800;letter-spacing:2px;color:#141114;margin:8px 0 6px">${esc(c.codigo)}</div>
  <div style="font-size:17px;font-weight:700;color:#6B2A85">${esc(valor)}</div>
</td></tr></table>
<p style="${P}"><b>Aplica en:</b> ${esc(aplica)}.${c.alcance !== 'producto' ? ' Solo productos de Vorka México.' : ''}${subs}<br><b>Vigencia:</b> hasta el ${esc(vence)}. ${esc(usos)}</p>
${boton(liga, 'Usar mi cupón')}
<p style="${P}"><b>Es transferible:</b> si no lo vas a usar, regálaselo a alguien más. Quien tenga el código lo puede usar.</p>
<p style="${P};font-size:13.5px;color:#6D696E">El cupón no se acumula con otros códigos (se aplica el mayor) y no se cambia por dinero.${c.tipo === 'monto' ? ' Si tu compra cuesta menos que el cupón, lo que sobra no queda como saldo.' : ''} Siempre se cobran al menos $10 MXN por compra. <a href="${SITIO}/legal/terminos/#descuentos" style="color:#6b2a85;text-decoration:underline">Condiciones</a>. ¿Dudas? Escríbenos a <a href="mailto:${SOPORTE.correo}" style="color:#6b2a85;text-decoration:underline">${SOPORTE.correo}</a>.</p>`, { etiqueta: 'Un regalo para ti' });
  const texto = `Hola${primer ? `, ${primer}` : ''}:

Te regalamos un cupón de descuento para la tienda de Vorka México.

Tu código: ${c.codigo}
${valor}
Aplica en: ${aplica}.${subs}
Vigencia: hasta el ${vence}. ${usos}

Usar mi cupón: ${liga}

Es transferible: si no lo vas a usar, regálaselo a alguien más.

No se acumula con otros códigos y no se cambia por dinero.${c.tipo === 'monto' ? ' Si tu compra cuesta menos que el cupón, lo que sobra no queda como saldo.' : ''} Siempre se cobran al menos $10 MXN por compra.
Condiciones: ${SITIO}/legal/terminos/#descuentos

Vorka México · Guanajuato, México`;
  return { asunto, html, texto };
}

// Aviso de la portada de la tienda al llegar con ?cupon=: qué da, dónde aplica y hasta cuándo (o por qué ya no sirve).
// null si no parece un código. No dice nada de quién lo creó ni para quién era.
export async function avisoCupon(env, codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,40}$/.test(c)) return null;
  const ev = await evaluarCodigo(env, c);
  if (!ev) return { valido: false, codigo: c, texto: `No encontramos el código ${c}. Revisa que esté bien escrito.` };
  if (!ev.valido) return { valido: false, codigo: c, texto: ev.mensaje };
  if (!ev.regalo) return { valido: true, codigo: c, texto: `Tu código ${c} se aplica al comprar, si tu compra cumple sus condiciones.` };
  const f = await one(env, 'SELECT * FROM cupones_regalo WHERE codigo = ?', c);
  const productos = await productosCupon(env);
  return { valido: true, codigo: c, regalo: true, linea: f.linea, url: ligaCupon(f, productos),
    texto: `${textoValor(f)} en ${textoAlcance(f, productos)}, hasta el ${fechaLarga(f.hasta)}. Elige lo que quieras: el cupón ya va en tu compra.` };
}
