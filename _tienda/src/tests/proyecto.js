// «¿Qué proyecto social hago?» · reglas (funciones puras: mismas respuestas → mismas ideas, en el mismo orden).
//
// Afinidad de cada proyecto de la biblioteca:
//   +3 por cada causa que elegiste y el proyecto atiende · +3 por cada fortaleza tuya que el proyecto usa
//   +2 si el proyecto le va a tu giro (o le sirve a cualquier giro: +1) · +1 por cada aliado que elegiste y el proyecto suma
//   −3 por cada nivel de presupuesto o de tiempo que te falte · −6 si pide un equipo más grande que el tuyo
//   −4 si el proyecto es para otro tipo de quien contesta (p. ej. «compras locales» solo le va a un negocio)
// Empates: el orden de la biblioteca. Reporte: de 5 a 8 (las que tengan afinidad positiva), elegidas con `elegir` para
// mezclar áreas (educación, salud mental, ambiente, cultura…): los primeros lugares son de áreas distintas y ninguna
// área repite más de 2 veces. Gratis: las 3 primeras del reporte. Cada proyecto trae su versión corta de 2 a 4 semanas.
import { PREGUNTAS, PROYECTOS, TAMANOS, ESTADOS, ODS, AREAS } from './proyecto-datos.js';

const valores = k => (PREGUNTAS[k].unica || PREGUNTAS[k].multi).map(([v]) => v);

/** Lee el formulario. Devuelve { ok: true, r } o { ok: false, faltan }. Las de varias opciones llegan como lista o texto separado por comas. */
export function leerRespuestas(datos) {
  const faltan = [], r = {};
  for (const [k, def] of Object.entries(PREGUNTAS)) {
    if (def.unica) {
      const v = String(datos[k] ?? '');
      if (!valores(k).includes(v)) faltan.push(k);
      r[k] = v;
    } else {
      const crudo = Array.isArray(datos[k]) ? datos[k] : String(datos[k] ?? '').split(',');
      const v = [...new Set(crudo.map(x => String(x).trim()).filter(x => valores(k).includes(x)))].slice(0, def.max);
      if (!v.length && k !== 'colaborar') faltan.push(k);
      r[k] = v;
    }
  }
  const estado = String(datos.estado ?? '');
  if (!ESTADOS.includes(estado)) faltan.push('estado');
  r.estado = estado;
  r.municipio = String(datos.municipio ?? '').replace(/[<>]/g, '').trim().slice(0, 80);
  return faltan.length ? { ok: false, faltan } : { ok: true, r };
}

export function afinidad(pr, r) {
  const inter = (a, b) => a.filter(x => b.includes(x)).length;
  let s = 3 * inter(pr.causas, r.causas) + 3 * inter(pr.exp, r.expertise) + inter(pr.col, r.colaborar || []);
  s += pr.giros.length ? (pr.giros.includes(r.giro) ? 2 : 0) : 1;
  s -= 3 * Math.max(0, pr.pres - Number(r.presupuesto)) + 3 * Math.max(0, pr.tiempo - Number(r.tiempo));
  if (TAMANOS.indexOf(pr.tam) > TAMANOS.indexOf(r.tamano)) s -= 6;
  if ((pr.para || []).length && r.tipo && !pr.para.includes(r.tipo)) s -= 4;
  return s;
}

/** De la lista ordenada por afinidad ({ pr, s }), toma n: primero hasta n − 1 de áreas distintas con afinidad positiva y
 *  luego el resto por afinidad, sin pasar de 2 por área (si no alcanza, se relaja). Devuelve en ese orden. */
export function elegir(orden, n) {
  const sel = [], cuenta = {};
  const pasar = (max, soloPos, tope) => { for (const x of orden) { if (sel.length >= tope) return; const a = x.pr.area;
    if (sel.includes(x) || (cuenta[a] || 0) >= max || (soloPos && x.s <= 0)) continue; sel.push(x); cuenta[a] = (cuenta[a] || 0) + 1; } };
  pasar(1, true, Math.max(3, n - 1)); pasar(2, true, n); pasar(1, false, n); pasar(2, false, n); pasar(99, false, n);
  return sel;
}

export const lugarDe = r => (r.municipio ? `${r.municipio}, ${r.estado}` : r.estado ? `tu municipio en ${r.estado}` : 'tu municipio');

export function calcular(r) {
  const orden = PROYECTOS.map((pr, i) => ({ pr, i, s: afinidad(pr, r) })).sort((a, b) => b.s - a.s || a.i - b.i);
  const lugar = lugarDe(r);
  const poner = t => t.replaceAll('{lugar}', lugar);
  const idea = ({ pr, s }) => ({ ...pr, s, obj: poner(pr.obj), pasos: pr.pasos.map(poner), areaN: AREAS[pr.area] || '' });
  const positivas = orden.filter(x => x.s > 0).length;
  const reporte = elegir(orden, Math.max(5, Math.min(8, positivas))).map(idea);
  return { ideas: orden.map(idea), gratis: reporte.slice(0, 3), reporte, lugar, sumar: r.etapa === 'sumar' };
}

export const resumenDe = res => ({ top: res.reporte.slice(0, 3).map(x => x.id), ods: [...new Set(res.reporte.flatMap(x => x.ods))].sort((a, b) => a - b) });
export { PREGUNTAS, ESTADOS, ODS, AREAS };
