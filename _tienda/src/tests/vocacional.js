// Test vocacional Vorka · reglas de calificación (funciones puras: mismas respuestas → mismo resultado, siempre).
//
// Puntaje por tipo (0 a 100) = 65 % intereses + 25 % habilidades percibidas + 10 % preferencias (dónde te imaginas
// trabajando y qué pesa más para ti). Tu código son tus 3 tipos más altos (empates: orden R-I-A-S-E-C).
// Afinidad con cada carrera = (3 × tu puntaje en la 1.ª letra de su código + 2 × la 2.ª + 1 × la 3.ª) / 6, con un ajuste
// por matemáticas (si prefieres evitarlas, las carreras con muchas matemáticas bajan; si te gustan, suben un poco).
import { TIPOS, ORDEN_TIPOS, INTERESES, HABILIDADES, PREFERENCIAS, CARRERAS, OPC_INTERES, OPC_HABILIDAD } from './vocacional-datos.js';

export const N_INTERESES = INTERESES.length, N_HABILIDADES = HABILIDADES.length;
const VAL_INT = new Set(OPC_INTERES.map(([v]) => v)), VAL_HAB = new Set(OPC_HABILIDAD.map(([v]) => v));

/**
 * Lee y valida las respuestas de un formulario (objeto plano: i0..i29, h0..h11 y las preferencias).
 * Devuelve { ok: true, r } con r = { i: [..], h: [..], mate, lugar, motivo, duracion, nivel, examen } o { ok: false, faltan: [nombres] }.
 */
export function leerRespuestas(datos) {
  const faltan = [], r = { i: [], h: [] };
  for (let k = 0; k < N_INTERESES; k++) { const v = Number(datos[`i${k}`]); if (datos[`i${k}`] === undefined || datos[`i${k}`] === '' || !VAL_INT.has(v)) faltan.push(`i${k}`); r.i.push(v); }
  for (let k = 0; k < N_HABILIDADES; k++) { const v = Number(datos[`h${k}`]); if (datos[`h${k}`] === undefined || datos[`h${k}`] === '' || !VAL_HAB.has(v)) faltan.push(`h${k}`); r.h.push(v); }
  for (const [k, def] of Object.entries(PREFERENCIAS)) {
    const v = String(datos[k] ?? '');
    if (!def.o.some(([x]) => x === v)) faltan.push(k);
    r[k] = v;
  }
  return faltan.length ? { ok: false, faltan } : { ok: true, r };
}

// Puntajes 0-100 por tipo
export function puntajes(r) {
  const out = {};
  for (const t of ORDEN_TIPOS) {
    const ints = INTERESES.map(([x], k) => (x === t ? r.i[k] : null)).filter(v => v != null);
    const habs = HABILIDADES.map(([x], k) => (x === t ? r.h[k] : null)).filter(v => v != null);
    const interes = ints.reduce((s, v) => s + v, 0) / (ints.length * 2) * 100;
    const habilidad = (habs.reduce((s, v) => s + v, 0) - habs.length) / (habs.length * 3) * 100;
    const pref = ((r.lugar === t ? 100 : 0) + (r.motivo === t ? 100 : 0)) / 2;
    out[t] = Math.round(0.65 * interes + 0.25 * habilidad + 0.10 * pref);
  }
  return out;
}

export const ordenTipos = p => [...ORDEN_TIPOS].sort((a, b) => p[b] - p[a] || ORDEN_TIPOS.indexOf(a) - ORDEN_TIPOS.indexOf(b));

const AJUSTE_MATE = { evitar: { alta: -15, media: -4, baja: 0 }, aguanto: { alta: -5, media: 0, baja: 0 }, gustan: { alta: 5, media: 2, baja: 0 } };
export function afinidad(c, p, mate) {
  const base = (3 * p[c.c[0]] + 2 * p[c.c[1]] + 1 * p[c.c[2]]) / 6;
  return Math.max(0, Math.min(100, Math.round(base + (AJUSTE_MATE[mate]?.[c.m] || 0))));
}
export const carrerasOrdenadas = (p, mate) => CARRERAS.map(c => ({ ...c, af: afinidad(c, p, mate) }))
  .sort((a, b) => b.af - a.af || a.n.localeCompare(b.n, 'es'));

// Simulador y guías de Vorka Learn según dónde presentará (examen) y en qué va (nivel). Rutas existentes de la tienda.
export const SIMULADORES = {
  unam: { slug: 'simulador-unam-practica', nombre: 'Simulador UNAM', ruta: '/simulador-unam/', guia: ['/learn/unam/examen-unam-por-area/', 'Qué viene en el examen UNAM según tu área'] },
  paa: { slug: 'simulador-paa-practica', nombre: 'Simulador PAA', ruta: '/simulador-paa/', guia: ['/learn/paa/que-es-la-paa/', 'Qué es la PAA y qué viene'] },
  ecoems: { slug: 'simulador-ecoems-practica', nombre: 'Simulador ECOEMS', ruta: '/simulador-ecoems/', guia: ['/learn/ecoems/como-elegir-tus-opciones-ecoems/', 'Cómo elegir tus opciones de prepa (ECOEMS)'] },
  'prepa-ug': { slug: 'simulador-prepa-ug-practica', nombre: 'Simulador prepa UG', ruta: '/simulador-prepa-ug/', guia: ['/learn/prepa-ug/examen-admision-prepa-ug/', 'Examen de admisión a la prepa UG'] },
};

/**
 * Qué examen le toca y qué se le recomienda. area: el área UNAM más frecuente entre sus 5 primeras carreras con área.
 * Devuelve { sim: clave de SIMULADORES o null, area, titulo, texto }.
 */
export function examenDe(r, carreras) {
  const conArea = carreras.slice(0, 8).filter(c => c.a);
  const cuenta = {}; for (const c of conArea.slice(0, 5)) cuenta[c.a] = (cuenta[c.a] || 0) + 1;
  const area = Number(Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || a - b)[0]) || null;
  if (r.nivel === 'secundaria') {
    if (r.examen === 'unam' || r.examen === 'ipn') return { sim: 'ecoems', area, titulo: 'Tu examen ahora: ECOEMS (prepa UNAM e IPN)', texto: 'Para entrar a una prepa de la UNAM o del IPN en la zona metropolitana del Valle de México se presenta el examen del proceso «Mi derecho, mi lugar» (ECOEMS). Elige tus opciones pensando también en las carreras de este reporte.' };
    if (r.examen === 'ug') return { sim: 'prepa-ug', area, titulo: 'Tu examen ahora: prepa de la Universidad de Guanajuato', texto: 'Para el bachillerato de la UG se presenta el examen de admisión que indica su convocatoria. Prepararlo desde hoy te da ventaja.' };
    return { sim: null, area, titulo: 'Tu siguiente paso: elegir bien tu prepa', texto: 'Revisa la convocatoria de las prepas que te interesan y qué examen piden. Una prepa con un área o bachillerato técnico afín a tus intereses te ayuda a probar antes de elegir carrera.' };
  }
  if (r.examen === 'unam') return { sim: 'unam', area, titulo: area ? `Tu examen: UNAM, ${AREA_CORTA[area]}` : 'Tu examen: UNAM', texto: 'El examen de licenciatura de la UNAM cambia según el área de la carrera que eliges. Practica con las preguntas del área de tu primera opción.' };
  if (r.examen === 'privada' || r.examen === 'otra') return { sim: 'paa', area, titulo: 'Tu examen: muy probablemente la PAA', texto: 'Muchas universidades privadas (y algunas públicas) piden la Prueba de Aptitud Académica (PAA) del College Board. Confirma en la convocatoria de cada universidad qué examen pide.' };
  if (r.examen === 'ipn') return { sim: null, area, titulo: 'Tu examen: IPN', texto: 'El IPN publica su propio proceso de admisión y agrupa su oferta en tres ramas. Revisa en su convocatoria si tus carreras se imparten ahí y en qué escuela. Por ahora no tenemos simulador del examen del IPN.' };
  return { sim: null, area, titulo: 'Tu examen: Universidad de Guanajuato', texto: 'La UG publica su propio proceso de admisión en su convocatoria. Revisa qué examen pide para tu carrera y sus fechas.' };
}
const AREA_CORTA = { 1: 'Área 1 (Físico-Matemáticas e Ingenierías)', 2: 'Área 2 (Biológicas, Químicas y de la Salud)', 3: 'Área 3 (Ciencias Sociales)', 4: 'Área 4 (Humanidades y Artes)' };

// Todo el resultado de unas respuestas ya validadas
export function calcular(r) {
  const p = puntajes(r);
  const tipos = ordenTipos(p);
  const carreras = carrerasOrdenadas(p, r.mate);
  return { p, tipos, codigo: tipos.slice(0, 3).join(''), carreras, examen: examenDe(r, carreras) };
}

// Lo que se guarda para agregados (panel de grupo, métricas): sin datos personales
export const resumenDe = res => ({ codigo: res.codigo, p: res.p, top: res.carreras.slice(0, 5).map(c => c.n), area: res.examen.area, sim: res.examen.sim });

export { TIPOS, ORDEN_TIPOS };
