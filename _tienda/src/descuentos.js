// Descuentos para quien compra (migración 0045):
// - Códigos de descuento de la tabla codigos_descuento (p. ej. FUNDADOR30: 30 % los primeros 3 meses en planes mensuales,
//   los primeros 10 negocios de cada app).
// - 5 % por recomendación: cuando la compra trae el código de una persona de referidos (Puntos Vorka o afiliado), escrito
//   en el formulario o por la liga (?ref= / cookie vorka_ref). Quien recomendó sigue ganando sus puntos sobre lo cobrado.
// - Cupones de regalo (migración 0055, tabla cupones_regalo): los crea el equipo en Vorka OS › Tienda › Regalar. Son
//   transferibles (no van ligados a un correo): % o monto fijo, para toda la tienda, una línea o un producto, con usos y
//   vigencia. En suscripciones solo el primer cobro. Lo que sobra de un monto fijo se pierde (no queda saldo).
// El mismo campo «código» acepta todo. No se acumulan: se aplica el mayor (en pesos, sobre esta compra). Los puntos de quien
// compra sí se suman en pagos únicos (las suscripciones no aceptan puntos). Siempre queda el cobro mínimo de la pasarela.
import { SQL_CODIGO_REAL } from './codigo-publico.js';
import { one } from './util.js';
import { COBRO_MINIMO } from './puntos-reglas.js';
import { lineaDe, LINEAS } from './lineas.js';

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
// Cupones de regalo: REGALO-XXXX-XXXX (ver cupones-regalo.js)
export const PREFIJO_REGALO = 'REGALO';
export const esCuponRegalo = c => normalizar(c).startsWith(`${PREFIJO_REGALO}-`);
// Mientras una compra con un cupón de regalo espera su pago, el cupón queda apartado para otros correos este tiempo
// (así un cupón de 1 uso no se puede abrir en 5 pagos a la vez). Stripe vence la sesión de pago a las 24 h.
export const APARTADO_REGALO_H = 24;

// AAAA-MM-DD = día completo en hora del centro de México (06:00 UTC); un ISO completo se usa tal cual
const inicio = f => (f.length === 10 ? `${f}T06:00:00.000Z` : f);
export const fin = f => { if (f.length !== 10) return f; const t = new Date(`${f}T06:00:00.000Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString(); };

// Texto que ve quien compra, p. ej. «FUNDADOR30: 30 % los primeros 3 meses»
export function textoCodigo(c, sus) {
  const cuando = sus ? (c.meses ? (c.meses === 1 ? ' en tu primer mes' : ` los primeros ${c.meses} meses`) : ' en tu primer pago') : ' de descuento';
  return `${c.codigo}: ${c.pct} %${cuando}`;
}
export const textoReferido = sus => `${PCT_REFERIDO} % ${sus ? 'en tu primer pago ' : 'de descuento '}por recomendación`;
export const pesosTexto = c => `$${(c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })} MXN`;
// «REGALO-7K2Q-XM4P: 20 % de descuento (cupón de regalo)» · en suscripciones «… en tu primer pago …»
export function textoRegalo(d, sus) {
  return `${d.codigo}: ${d.monto ? pesosTexto(d.monto) : `${d.pct} %`} ${sus ? 'en tu primer pago' : 'de descuento'} (cupón de regalo)`;
}
export const fechaLarga = dia => new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
export const nombreLinea = id => LINEAS.find(l => l.id === id)?.linea || id;

// Renglón de una compra para revisar el alcance y calcular el descuento (crearOrden, el checkout y la vista previa)
export const lineaCompra = (p, cantidad = 1) => ({ id: p.id, slug: p.slug, nombre: p.nombre, precio_centavos: p.precio_centavos, cantidad,
  creador_id: p.creador_id || null, linea: lineaDe(p), complemento: !!p.contenido?.complemento });
const suma = ls => ls.reduce((s, l) => s + l.precio_centavos * (l.cantidad || 1), 0);
// ¿Un cupón de regalo aplica a este renglón? Nunca a productos de creadores.
export const enAlcance = (c, l) => !l.creador_id && (c.alcance === 'tienda' || (c.alcance === 'linea' && l.linea === c.linea) || (c.alcance === 'producto' && l.id === c.product_id));
/**
 * Base del descuento (centavos): lo de Vorka al que aplica. Códigos y 5 %: todo lo de Vorka. Cupón de regalo: solo lo de su
 * alcance; en una suscripción, si el plan entra en el alcance, el primer cobro completo (plan y sus complementos), que es lo
 * que Stripe descuenta con el cupón.
 */
export function baseDescuento(d, lineas, sus = null) {
  const propias = lineas.filter(l => !l.creador_id);
  if (!d?.regalo || d.alcance === 'tienda') return suma(propias);
  if (sus) { const plan = lineas.find(l => !l.complemento) || lineas[0]; return plan && enAlcance(d, plan) ? suma(propias) : 0; }
  return suma(propias.filter(l => enAlcance(d, l)));
}
// Centavos de descuento de un código, del 5 % o de un cupón de regalo en esta compra (sin contar puntos). LA cuenta del servidor.
export function centavosDe(d, lineas, sus = null, minimo = COBRO_MINIMO) {
  if (!d) return 0;
  const subtotal = suma(lineas), base = baseDescuento(d, lineas, sus);
  return d.monto ? centavosMonto(base, subtotal, d.monto, minimo) : centavosDescuento(base, subtotal, d.pct || 0, minimo);
}

/**
 * Revisa un código de la tabla para esta compra. sus: { intervalo, app } del plan, o null si no es suscripción.
 * null si el código no está en la tabla (puede ser de una persona de referidos). Si está: { valido, mensaje } o el descuento.
 */
export async function evaluarCodigo(env, codigo, { sus = null, ahora = new Date().toISOString(), lineas = null, email = null } = {}) {
  const c = normalizar(codigo);
  if (!pareceCodigo(c)) return null;
  const f = await one(env, 'SELECT * FROM codigos_descuento WHERE codigo = ?', c);
  if (!f) return evaluarRegalo(env, c, { sus, ahora, lineas, email });
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

/**
 * Cupón de regalo (cupones_regalo). null si no existe. lineas: los renglones de la compra (lineaCompra) para revisar el
 * alcance; sin ellos no se revisa. email: de quien compra (en el checkout), para no dejar que otros correos abran pagos con
 * un cupón cuyos usos ya están apartados por compras que esperan su pago.
 */
export async function evaluarRegalo(env, c, { sus = null, ahora = new Date().toISOString(), lineas = null, email = null } = {}) {
  const f = await one(env, 'SELECT r.*, p.nombre producto_nombre, p.slug producto_slug FROM cupones_regalo r LEFT JOIN products p ON p.id = r.product_id WHERE r.codigo = ?', c);
  if (!f) return null;
  const no = mensaje => ({ codigo: c, valido: false, regalo: true, mensaje });
  if (f.revocado_at) return no(`El cupón ${c} ya no está vigente.`);
  if (ahora >= fin(f.hasta)) return no(`El cupón ${c} venció el ${fechaLarga(f.hasta)}.`);
  if (f.usos >= f.max_usos) return no(f.max_usos === 1 ? `El cupón ${c} ya se usó.` : `El cupón ${c} ya se usó las ${f.max_usos} veces que permitía.`);
  if (email) {
    const desde = new Date(Date.parse(ahora) - APARTADO_REGALO_H * 3600e3).toISOString();
    const p = await one(env, `SELECT COUNT(*) n FROM orders WHERE descuento_codigo = ? AND estado = 'pending' AND created_at >= ? AND lower(email) <> ?`, c, desde, String(email).trim().toLowerCase());
    if (f.usos + (p?.n || 0) >= f.max_usos)
      return no(`El cupón ${c} está en otra compra que espera su pago. Si esa compra no se completa, vuelve a estar disponible en unas horas.`);
  }
  const d = { codigo: c, valido: true, tipo: 'codigo', regalo: true, pct: f.tipo === 'pct' ? f.pct : null, monto: f.tipo === 'monto' ? f.monto_centavos : null,
    meses: null, app: null, alcance: f.alcance, linea: f.linea, product_id: f.product_id, producto_slug: f.producto_slug || null };
  if (lineas && !baseDescuento(d, lineas, sus)) {
    if (lineas.length && lineas.every(l => l.creador_id)) return no(`El cupón ${c} solo aplica en productos de Vorka México, no en los de creadores.`);
    if (f.alcance === 'producto') return no(`El cupón ${c} es solo para ${f.producto_nombre || 'otro producto'}.`);
    if (f.alcance === 'linea') return no(`El cupón ${c} es solo para productos de ${nombreLinea(f.linea)}.`);
    return no(`El cupón ${c} solo aplica en productos de Vorka México.`);
  }
  return { ...d, texto: textoRegalo(d, sus) };
}

// La persona de referidos de un código (activo), o null
export const afiliado = (env, code) =>
  pareceCodigo(code) ? one(env, `SELECT code, email, comision_pct FROM affiliates WHERE code = ${SQL_CODIGO_REAL} AND activo = 1`, normalizar(code)) : null;

/**
 * Decide el descuento de una compra.
 * escrito: lo que se escribió en el campo «código» · liga: el código de ?ref= o de la cookie · email: de quien compra (o null en la vista previa)
 * Devuelve { ref, descuento, avisos }:
 *   ref: el código de quien recomendó (cuenta para sus puntos aunque gane otro descuento)
 *   descuento: { tipo: 'codigo' | 'referido', codigo, pct, meses, app, texto } o null
 *   avisos: por qué un código escrito no se aplicó (la compra sigue sin ese descuento)
 */
export async function resolverDescuento(env, { escrito, liga, email = null, sus = null, ahora, lineas = null } = {}) {
  const avisos = [];
  let codigo = null, ref = null;
  if (escrito && pareceCodigo(escrito)) {
    const ev = await evaluarCodigo(env, escrito, { sus, ahora, lineas, email });
    if (ev?.valido) codigo = ev;
    else if (ev) avisos.push(ev.mensaje);
    else ref = await afiliado(env, escrito);
  }
  if (!ref && liga) ref = await afiliado(env, liga);
  // Comprarse a sí mismo con su propio código no da el 5 % (tampoco da puntos)
  const propio = ref && email && ref.email && String(ref.email).trim().toLowerCase() === String(email).trim().toLowerCase();
  const porRef = ref && !propio ? { tipo: 'referido', codigo: REFERIDO, pct: PCT_REFERIDO, meses: null, app: null, texto: textoReferido(sus) } : null;
  // No se acumulan: el mayor. Con los renglones de la compra se compara en pesos (un cupón por monto o con alcance no se
  // puede comparar por %); sin ellos, por %. En empate gana el código escrito.
  const valor = d => lineas ? centavosDe(d, lineas, sus) : d.monto ? Infinity : d.pct;
  const descuento = [codigo, porRef].filter(Boolean).sort((a, b) => valor(b) - valor(a))[0] || null;
  if (codigo && descuento !== codigo)
    avisos.push(`${codigo.regalo ? 'El cupón' : 'El código'} ${codigo.codigo} no se acumula con el ${PCT_REFERIDO} % por recomendación: se aplica el que te da más descuento en esta compra.`);
  return { ref: ref?.code || null, descuento, avisos };
}

// Duración del cupón de Stripe en suscripciones
// Decisión del dueño: el 5 % por recomendación aplica solo al primer pago ('once'), también en suscripciones
export const duracionDe = d => (d.tipo !== 'referido' && d.meses ? 'repeating' : 'once');

// Centavos de descuento de un código o del 5 %: el % de lo de Vorka (base), redondeado al centavo, dejando siempre el cobro
// mínimo de la pasarela. Es LA cuenta: la usan crearOrden y, copiada tal cual (toString), la página de compra para el
// «Pagas hoy». Con precios en pesos enteros, 30 % y 5 % dan centavos exactos, igual que Stripe; si algún precio llevara
// centavos, Stripe puede redondear distinto por 1 centavo y aplicarPago lo acepta (TOLERANCIA_PCT) en suscripciones.
export function centavosDescuento(base, subtotal, pct, minimo) {
  return pct > 0 ? Math.max(0, Math.min(Math.round(base * pct / 100), subtotal - minimo)) : 0;
}
// Cupón de regalo por monto fijo: el monto, sin pasar de lo que cuesta lo que entra en su alcance (base) y dejando el cobro
// mínimo. Lo que sobra se pierde (no queda saldo). También se copia tal cual a la página de compra.
export function centavosMonto(base, subtotal, monto, minimo) {
  return monto > 0 ? Math.max(0, Math.min(monto, base, subtotal - minimo)) : 0;
}

// Ayudante de la página de compra (va antes del script de cada página): window.VD guarda el descuento vigente que dice
// /api/puntos/liga y cada página lo usa al pintar su total; al cambiar avisa con el evento 'vorka:descuento'.
//   VD.hoy(t, b) → lo que se paga hoy (b: la parte de t a la que aplica el descuento; por omisión, todo t)
//   VD.en(slug) → ¿el descuento aplica a ese producto? (cupones de regalo de una línea o un producto)
//   VD.frase(t, cada) → { hoy, luego } para «Pagas hoy … y luego …»
//   d = { pct | monto (cupón de regalo por monto, centavos), duracion: 'once' | 'repeating' | 'forever' | null (pago único),
//         meses, etiqueta: «5 % por recomendación», slugs: productos a los que aplica (null = todos) }
// Con un cupón por monto que no se usa completo, escribe en #codigo-sobra cuánto se pierde (no queda saldo), antes de pagar.
export const CLIENTE_DESCUENTO = `(function(){ if(window.VD) return;
  var MIN=${COBRO_MINIMO}, desc=${centavosDescuento.toString()}, mon=${centavosMonto.toString()};
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2})+' MXN'; }
  function sobra(d,x,t){ var el=document.getElementById&&document.getElementById('codigo-sobra'); if(!el) return; var s=d&&d.monto?d.monto-x:0;
    el.hidden=!(s>0); el.textContent=s>0?'Tu cupón es de '+pesos(d.monto)+': en esta compra se descuentan '+pesos(x)+(x>=t-MIN?' (siempre se cobran al menos '+pesos(MIN)+')':'')+'. Lo que sobra ('+pesos(s)+') se pierde: no queda como saldo.':''; }
  var VD=window.VD={d:null,pesos:pesos,
    en:function(s){ var d=VD.d; return !d||!d.slugs||d.slugs.indexOf(s)>-1; },
    hoy:function(t,b){ var d=VD.d; if(b==null) b=t; var x=!d?0:d.monto>0?mon(b,t,d.monto,MIN):d.pct>0?desc(b,t,d.pct,MIN):0; sobra(d,x,t); return t-x; },
    frase:function(t,cada){ var d=VD.d, h=VD.hoy(t);
      if(h===t) return {hoy:pesos(t),luego:'y luego '+pesos(t)+' '+cada};
      if(d.duracion==='forever') return {hoy:pesos(h),luego:'y luego '+pesos(h)+' '+cada};
      if(d.duracion==='repeating'&&d.meses>1) return {hoy:pesos(h),luego:'y luego '+pesos(h)+' '+cada+' hasta cumplir '+d.meses+' meses; después, '+pesos(t)+' '+cada};
      return {hoy:pesos(h),luego:(d.etiqueta?'('+d.etiqueta+') ':'')+'y luego '+pesos(t)+' '+cada}; },
    fijar:function(d){ VD.d=d&&(d.pct>0||d.monto>0)?d:null; if(!VD.d) sobra(null,0,0); document.dispatchEvent(new Event('vorka:descuento')); }};
})();`;
