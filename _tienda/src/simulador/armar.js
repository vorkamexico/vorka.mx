// Arma un simulacro completo en el servidor (así el intento queda registrado con sus reactivos y se puede
// retomar en otro dispositivo). Prioriza lo que el estudiante NO ha visto en simulacros anteriores:
// primero lecturas nuevas y reactivos nuevos de cada tema; solo si se acaban, repite.
import { SECCIONES, TEXTOS, REACTIVOS } from './banco.js';

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
