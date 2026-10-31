// «¿Qué proyecto social hago?» · reglas (funciones puras: mismas respuestas → mismas ideas, en el mismo orden).
//
// Afinidad de cada proyecto de la biblioteca:
//   +3 por cada causa que elegiste y el proyecto atiende · +3 por cada fortaleza tuya que el proyecto usa
//   +2 si el proyecto le va a tu giro (o le sirve a cualquier giro: +1) · +1 por cada aliado que elegiste y el proyecto suma
//   −3 por cada nivel de presupuesto o de tiempo que te falte · −6 si pide un equipo más grande que el tuyo
// Empates: el orden de la biblioteca. Gratis: las 3 primeras. Reporte: de 5 a 8 (las que tengan afinidad positiva).
import { PREGUNTAS, PROYECTOS, TAMANOS, ESTADOS, ODS } from './proyecto-datos.js';

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
  return s;
}

export const lugarDe = r => (r.municipio ? `${r.municipio}, ${r.estado}` : r.estado ? `tu municipio en ${r.estado}` : 'tu municipio');

export function calcular(r) {
  const orden = PROYECTOS.map((pr, i) => ({ pr, i, s: afinidad(pr, r) })).sort((a, b) => b.s - a.s || a.i - b.i);
  const lugar = lugarDe(r);
  const poner = t => t.replaceAll('{lugar}', lugar);
  const ideas = orden.map(({ pr, s }) => ({ ...pr, s, obj: poner(pr.obj), pasos: pr.pasos.map(poner) }));
  const positivas = ideas.filter(x => x.s > 0).length;
  return { ideas, gratis: ideas.slice(0, 3), reporte: ideas.slice(0, Math.max(5, Math.min(8, positivas))), lugar };
}

export const resumenDe = res => ({ top: res.reporte.slice(0, 3).map(x => x.id), ods: [...new Set(res.reporte.flatMap(x => x.ods))].sort((a, b) => a - b) });
export { PREGUNTAS, ESTADOS, ODS };
