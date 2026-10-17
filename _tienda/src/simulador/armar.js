// Arma un simulacro completo en el servidor (así el intento queda registrado con sus reactivos y se puede
// retomar en otro dispositivo). Misma lógica que el cliente usa para las secciones sueltas.
import { SECCIONES, TEXTOS, REACTIVOS } from './banco.js';

const barajar = (a, azar) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Reparte n reactivos entre los temas por turnos (para que ninguno se quede fuera) y los ordena de fácil a difícil
function porTema(lista, n, azar) {
  const grupos = {};
  for (const r of barajar(lista, azar)) (grupos[r.tema] ||= []).push(r);
  const temas = barajar(Object.keys(grupos), azar), out = [];
  while (out.length < n && temas.some(t => grupos[t].length))
    for (const t of temas) if (out.length < n && grupos[t].length) out.push(grupos[t].shift());
  return out.sort((a, b) => a.dificultad - b.dificultad);
}
const delTexto = id => REACTIVOS.filter(r => r.texto === id);
const textosDe = (sid, tipo) => Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && (!tipo || TEXTOS[k].tipo === tipo));

export function armarSeccion(sid, azar = Math.random) {
  const s = SECCIONES.find(x => x.id === sid);
  const sueltos = REACTIVOS.filter(r => r.seccion === sid && !r.texto);
  let items;
  if (sid === 'lectura') items = [...delTexto(barajar(textosDe(sid, 'literario'), azar)[0]), ...delTexto(barajar(textosDe(sid, 'no_literario'), azar)[0])];
  else if (sid === 'ingles') { const lect = delTexto(barajar(textosDe(sid), azar)[0]); items = [...porTema(sueltos, s.reactivos - lect.length, azar), ...lect]; }
  else items = porTema(sueltos, s.reactivos, azar);
  return items.map(r => r.id);
}

export const armarCompleto = (azar = Math.random) => SECCIONES.map(s => armarSeccion(s.id, azar));
