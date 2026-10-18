// Arma un simulacro completo en el servidor (así el intento queda registrado con sus reactivos y se puede
// retomar en otro dispositivo). Prioriza lo que el estudiante NO ha visto en simulacros anteriores:
// primero lecturas nuevas y reactivos nuevos de cada tema; solo si se acaban, repite.
import { SECCIONES, SECCIONES_EXAMEN, TEXTOS, REACTIVOS } from './banco.js';

const barajar = (a, azar) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Reparte n reactivos entre los temas por turnos (para que ninguno se quede fuera) y los ordena de fácil a difícil.
// Dentro de cada tema van primero los no vistos.
function porTema(lista, n, azar, vistos) {
  const grupos = {};
  for (const r of barajar(lista, azar)) (grupos[r.tema] ||= []).push(r);
  for (const t in grupos) grupos[t].sort((a, b) => vistos.has(a.id) - vistos.has(b.id));
  // Los temas con más reactivos nuevos van primero en cada vuelta
  const nuevos = t => grupos[t].filter(r => !vistos.has(r.id)).length;
  const temas = barajar(Object.keys(grupos), azar).sort((a, b) => nuevos(b) - nuevos(a));
  const out = [];
  while (out.length < n && temas.some(t => grupos[t].length))
    for (const t of temas) if (out.length < n && grupos[t].length) out.push(grupos[t].shift());
  return out.sort((a, b) => a.dificultad - b.dificultad);
}
const delTexto = id => REACTIVOS.filter(r => r.texto === id);
// Lectura menos vista primero (empate: al azar)
function elegirTexto(sid, tipo, azar, vistos) {
  const ids = barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && (!tipo || TEXTOS[k].tipo === tipo)), azar);
  const vistosDe = k => delTexto(k).filter(r => vistos.has(r.id)).length;
  return ids.sort((a, b) => vistosDe(a) - vistosDe(b))[0];
}

export function armarSeccion(sid, azar = Math.random, vistos = new Set()) {
  const s = SECCIONES.find(x => x.id === sid);
  const sueltos = REACTIVOS.filter(r => r.seccion === sid && !r.texto);
  let items;
  if (sid === 'lectura') items = [...delTexto(elegirTexto(sid, 'literario', azar, vistos)), ...delTexto(elegirTexto(sid, 'no_literario', azar, vistos))];
  else if (sid === 'ingles') { const lect = delTexto(elegirTexto(sid, null, azar, vistos)); items = [...porTema(sueltos, s.reactivos - lect.length, azar, vistos), ...lect]; }
  else items = porTema(sueltos, s.reactivos, azar, vistos);
  return items.map(r => r.id);
}

export const armarCompleto = (azar = Math.random, vistos = new Set()) => SECCIONES.map(s => armarSeccion(s.id, azar, vistos));

// ---------- Examen PAA completo (estructura real: 175 reactivos) ----------
// Lectura: lecturas completas (alternando literaria y no literaria, las menos vistas primero) hasta llegar a n;
// si sobran preguntas de la última lectura se recortan, y si faltan se completa con reactivos sueltos.
// Inglés: unas 2 de cada 5 preguntas salen de lecturas; el resto, sueltos repartidos por tema.
function lecturasHasta(sid, n, azar, vistos, tipos = ['literario', 'no_literario']) {
  const vistosDe = k => delTexto(k).filter(r => vistos.has(r.id)).length;
  const porTipo = tipos.map(t => barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && (!t || TEXTOS[k].tipo === t)), azar).sort((a, b) => vistosDe(a) - vistosDe(b)));
  const out = [];
  for (let i = 0; out.length < n && porTipo.some(l => l.length); i++) {
    const l = porTipo[i % porTipo.length]; if (!l.length) continue;
    out.push(...delTexto(l.shift()).slice(0, n - out.length));
  }
  return out;
}
export function armarSeccionExamen(sid, azar = Math.random, vistos = new Set()) {
  const n = SECCIONES_EXAMEN.find(x => x.id === sid).reactivos;
  const sueltos = REACTIVOS.filter(r => r.seccion === sid && !r.texto);
  let items;
  if (sid === 'lectura') { const lect = lecturasHasta(sid, n, azar, vistos); items = [...lect, ...porTema(sueltos, n - lect.length, azar, vistos)]; }
  else if (sid === 'ingles') { const lect = lecturasHasta(sid, Math.round(n * 0.4), azar, vistos, [null]); items = [...porTema(sueltos, n - lect.length, azar, vistos), ...lect]; }
  else items = porTema(sueltos, n, azar, vistos);
  return items.map(r => r.id);
}
export const armarExamen = (azar = Math.random, vistos = new Set()) => SECCIONES_EXAMEN.map(s => armarSeccionExamen(s.id, azar, vistos));
