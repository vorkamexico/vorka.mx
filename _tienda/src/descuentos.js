// Descuentos para quien compra (migración 0045):
// - Códigos de descuento de la tabla codigos_descuento (p. ej. FUNDADOR30: 30 % los primeros 3 meses en planes mensuales,
//   los primeros 10 negocios de cada app).
// - 5 % por recomendación: cuando la compra trae el código de una persona de referidos (Puntos Vorka o afiliado), escrito
//   en el formulario o por la liga (?ref= / cookie vorka_ref). Quien recomendó sigue ganando sus puntos sobre lo cobrado.
// El mismo campo «código» acepta los dos. No se acumulan: se aplica el mayor. Los puntos de quien compra sí se suman al 5 %
// en pagos únicos (las suscripciones no aceptan puntos). Siempre queda el cobro mínimo de la pasarela (crearOrden).
import { one } from './util.js';

export const PCT_REFERIDO = 5;
export const REFERIDO = 'REFERIDO';   // descuento_codigo de la orden cuando el descuento fue el 5 % por recomendación
export const NOMBRE_APP = { vuelve: 'Vuelve', agenda: 'Agenda', 'agenda-vuelve': 'Agenda + Vuelve', vende: 'Vende Pro', cuentas: 'Cuentas' };
const SIN_APP = 'tienda';             // tope por app en una compra que no es suscripción
// App en la que cuenta el lugar de un código con tope por app (max_por_app). Decisión del dueño: el paquete Agenda + Vuelve
// cuenta dentro de los lugares de Agenda (no tiene los suyos y no gasta uno de Vuelve).
const CUPO_DE = { 'agenda-vuelve': 'agenda' };
export const appDelCupo = app => (app ? CUPO_DE[app] || app : SIN_APP);

export const normalizar = c => String(c ?? '').trim().toUpperCase();
export const pareceCodigo = c => /^[A-Z0-9_-]{1,40}$/.test(normalizar(c));

// AAAA-MM-DD = día completo en hora del centro de México (06:00 UTC); un ISO completo se usa tal cual
const inicio = f => (f.length === 10 ? `${f}T06:00:00.000Z` : f);
const fin = f => { if (f.length !== 10) return f; const t = new Date(`${f}T06:00:00.000Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString(); };

// Texto que ve quien compra, p. ej. «FUNDADOR30: 30 % los primeros 3 meses»
export function textoCodigo(c, sus) {
  const cuando = sus ? (c.meses ? (c.meses === 1 ? ' en tu primer mes' : ` los primeros ${c.meses} meses`) : ' en tu primer pago') : ' de descuento';
  return `${c.codigo}: ${c.pct} %${cuando}`;
}
export const textoReferido = sus => `${PCT_REFERIDO} % ${sus ? 'en cada pago ' : 'de descuento '}por recomendación`;

/**
 * Revisa un código de la tabla para esta compra. sus: { intervalo, app } del plan, o null si no es suscripción.
 * null si el código no está en la tabla (puede ser de una persona de referidos). Si está: { valido, mensaje } o el descuento.
 */
export async function evaluarCodigo(env, codigo, { sus = null, ahora = new Date().toISOString() } = {}) {
  const c = normalizar(codigo);
  if (!pareceCodigo(c)) return null;
  const f = await one(env, 'SELECT * FROM codigos_descuento WHERE codigo = ?', c);
  if (!f) return null;
  const no = mensaje => ({ codigo: c, valido: false, mensaje });
  if (!f.activo || (f.hasta && ahora >= fin(f.hasta)) || (f.max_usos != null && f.usos >= f.max_usos))
    return no(`El código ${c} ya no está vigente.`);
  if (f.desde && ahora < inicio(f.desde)) return no(`El código ${c} todavía no está vigente.`);
  if (f.solo_mensual && sus?.intervalo !== 'month')
    return no(`${c} solo aplica en planes mensuales (Vuelve, Agenda, Agenda + Vuelve, Vende Pro y Cuentas)${sus ? ', no en el anual' : ''}.`);
  const app = appDelCupo(sus?.app);
  if (f.max_por_app != null) {
    const u = await one(env, 'SELECT usos FROM codigos_descuento_usos WHERE codigo = ? AND app = ?', c, app);
    if ((u?.usos || 0) >= f.max_por_app)
      return no(`Los ${f.max_por_app} lugares ${f.nombre ? `de ${f.nombre} ` : `con ${c} `}de ${NOMBRE_APP[app] || 'esta compra'} ya se ocuparon.`);
  }
  const d = { codigo: c, valido: true, tipo: 'codigo', pct: f.pct, meses: f.meses ?? null, app: f.max_por_app != null || sus ? app : null };
  return { ...d, texto: textoCodigo(d, sus) };
}

// La persona de referidos de un código (activo), o null
export const afiliado = (env, code) =>
  pareceCodigo(code) ? one(env, 'SELECT code, email, comision_pct FROM affiliates WHERE code = ? AND activo = 1', normalizar(code)) : null;

/**
 * Decide el descuento de una compra.
 * escrito: lo que se escribió en el campo «código» · liga: el código de ?ref= o de la cookie · email: de quien compra (o null en la vista previa)
 * Devuelve { ref, descuento, avisos }:
 *   ref: el código de quien recomendó (cuenta para sus puntos aunque gane otro descuento)
 *   descuento: { tipo: 'codigo' | 'referido', codigo, pct, meses, app, texto } o null
 *   avisos: por qué un código escrito no se aplicó (la compra sigue sin ese descuento)
 */
export async function resolverDescuento(env, { escrito, liga, email = null, sus = null, ahora } = {}) {
  const avisos = [];
  let codigo = null, ref = null;
  if (escrito && pareceCodigo(escrito)) {
    const ev = await evaluarCodigo(env, escrito, { sus, ahora });
    if (ev?.valido) codigo = ev;
    else if (ev) avisos.push(ev.mensaje);
    else ref = await afiliado(env, escrito);
  }
  if (!ref && liga) ref = await afiliado(env, liga);
  // Comprarse a sí mismo con su propio código no da el 5 % (tampoco da puntos)
  const propio = ref && email && ref.email && String(ref.email).trim().toLowerCase() === String(email).trim().toLowerCase();
  const porRef = ref && !propio ? { tipo: 'referido', codigo: REFERIDO, pct: PCT_REFERIDO, meses: null, app: null, texto: textoReferido(sus) } : null;
  // No se acumulan: el mayor
  const descuento = [codigo, porRef].filter(Boolean).sort((a, b) => b.pct - a.pct)[0] || null;
  return { ref: ref?.code || null, descuento, avisos };
}

// Duración del cupón de Stripe en suscripciones
export const duracionDe = d => (d.tipo === 'referido' ? 'forever' : d.meses ? 'repeating' : 'once');
