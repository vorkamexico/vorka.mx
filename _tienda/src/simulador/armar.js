// Arma un simulacro completo en el servidor (así el intento queda registrado con sus reactivos y se puede
// retomar en otro dispositivo). Prioriza lo que el estudiante NO ha visto en simulacros anteriores:
// primero lecturas nuevas y reactivos nuevos de cada tema; solo si se acaban, repite.
import { SECCIONES, SECCIONES_EXAMEN, TEXTOS, REACTIVOS } from './banco.js';
import { SECCIONES_CALENTAMIENTO } from './niveles.js';

const barajar = (a, azar) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Niveles: Calentamiento (dificultad 1–2), Medio (2–3) y Oficial (todas, cargado a lo difícil como la PAA real).
// Si un nivel se queda sin reactivos de su dificultad, se completa con los demás (nunca se queda corto).
const NIVEL = {
  calentamiento: r => r.dificultad <= 2,
  medio: r => r.dificultad >= 2,
  oficial: () => true,
};
// Antes de repetir un reactivo ya visto, se prefiere uno nuevo aunque sea de otra dificultad.
const filtrar = (lista, n, nivel, vistos = new Set()) => {
  if (!nivel) return lista;
  const si = lista.filter(NIVEL[nivel]);
  if (si.filter(r => !vistos.has(r.id)).length >= n) return si;
  const nuevosOtros = lista.filter(r => !NIVEL[nivel](r) && !vistos.has(r.id));
  return [...si, ...nuevosOtros, ...lista.filter(r => !NIVEL[nivel](r) && vistos.has(r.id))];
};
// Promedio de dificultad de una lectura (para elegir lecturas del nivel)
const dificultadTexto = k => { const rs = REACTIVOS.filter(r => r.texto === k); return rs.reduce((s, r) => s + r.dificultad, 0) / (rs.length || 1); };
const textoDelNivel = (k, nivel) => !nivel || nivel === 'oficial' ? true : nivel === 'calentamiento' ? dificultadTexto(k) <= 2 : dificultadTexto(k) >= 2;

// Cuota de dificultad media en Medio y Oficial: sin ella, al preferir los difíciles, Matemáticas y Redacción salían
// 100 % de dificultad 3. Con 1 de cada 4 (Medio) y 1 de cada 5 (Oficial) de dificultad 2, siguen cargados a lo difícil.
const CUOTA_MEDIA = { medio: 0.25, oficial: 0.2 };

// Reparte n reactivos entre los temas por turnos (para que ninguno se quede fuera) y los ordena de fácil a difícil.
// Dentro de cada tema van primero los no vistos; en Medio y Oficial, entre los no vistos, primero los difíciles
// (salvo la cuota de dificultad media, que se toma de reactivos no vistos).
function porTema(lista, n, azar, vistos, nivel = null, sinCuota = false) {
  lista = filtrar(lista, n, nivel, vistos);
  const dificiles = nivel === 'oficial' || nivel === 'medio';
  if (dificiles && !sinCuota) {
    const medios = porTema(lista.filter(r => r.dificultad === 2 && !vistos.has(r.id)), Math.floor(n * CUOTA_MEDIA[nivel]), azar, vistos);
    const resto = porTema(lista.filter(r => !medios.includes(r)), n - medios.length, azar, vistos, nivel, true);
    return [...medios, ...resto].sort((a, b) => a.dificultad - b.dificultad);
  }
  const out = [];
  // Primero se reparten los no vistos; solo si no alcanzan, se repiten vistos
  for (const parte of [lista.filter(r => !vistos.has(r.id)), lista.filter(r => vistos.has(r.id))]) {
    const grupos = {};
    for (const r of barajar(parte, azar)) (grupos[r.tema] ||= []).push(r);
    if (dificiles) for (const t in grupos) grupos[t].sort((a, b) => b.dificultad - a.dificultad);
    // Los temas con más reactivos van primero en cada vuelta
    const temas = barajar(Object.keys(grupos), azar).sort((a, b) => grupos[b].length - grupos[a].length);
    while (out.length < n && temas.some(t => grupos[t].length))
      for (const t of temas) if (out.length < n && grupos[t].length) out.push(grupos[t].shift());
  }
  return out.sort((a, b) => a.dificultad - b.dificultad);
}
const delTexto = id => REACTIVOS.filter(r => r.texto === id);
// Lectura menos vista primero (empate: al azar)
function elegirTexto(sid, tipo, azar, vistos, nivel = null) {
  const todos = barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && (!tipo || TEXTOS[k].tipo === tipo)), azar);
  const delNivel = todos.filter(k => textoDelNivel(k, nivel));
  const ids = delNivel.length ? delNivel : todos;
  const vistosDe = k => delTexto(k).filter(r => vistos.has(r.id)).length;
  return ids.sort((a, b) => vistosDe(a) - vistosDe(b))[0];
}

// Simulacro de un nivel (Medio: 46 reactivos; Calentamiento: 24). En Lectura, una o dos lecturas según lo que toque.
export function armarSeccion(sid, azar = Math.random, vistos = new Set(), nivel = null, secciones = SECCIONES) {
  const s = secciones.find(x => x.id === sid);
  const sueltos = REACTIVOS.filter(r => r.seccion === sid && !r.texto);
  let items;
  if (sid === 'lectura') {
    const dos = [...delTexto(elegirTexto(sid, 'literario', azar, vistos, nivel)), ...delTexto(elegirTexto(sid, 'no_literario', azar, vistos, nivel))];
    items = dos.length <= s.reactivos ? dos : delTexto(elegirTexto(sid, azar() < .5 ? 'literario' : 'no_literario', azar, vistos, nivel)).slice(0, s.reactivos);
    const falta = () => s.reactivos - items.length;
    // Relleno: vocabulario suelto nuevo; si no alcanza, preguntas de otra lectura que no ha visto
    if (falta() > 0) items = [...items, ...porTema(sueltos.filter(r => !vistos.has(r.id)), falta(), azar, vistos, nivel)];
    if (falta() > 0) {
      const usados = new Set(items.map(r => r.texto));
      const otra = barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && !usados.has(k) && textoDelNivel(k, nivel)), azar)
        .find(k => delTexto(k).every(r => !vistos.has(r.id)));
      if (otra) items = [...items, ...delTexto(otra).slice(0, falta())];
    }
    if (falta() > 0) items = [...items, ...porTema(sueltos.filter(r => !items.includes(r)), falta(), azar, vistos, nivel)];
  } else if (sid === 'ingles') {
    const lect = delTexto(elegirTexto(sid, null, azar, vistos, nivel)).slice(0, Math.ceil(s.reactivos / 2));
    items = [...porTema(sueltos, s.reactivos - lect.length, azar, vistos, nivel), ...lect];
  } else items = porTema(sueltos, s.reactivos, azar, vistos, nivel);
  return items.map(r => r.id);
}

export const armarCompleto = (azar = Math.random, vistos = new Set()) => SECCIONES.map(s => armarSeccion(s.id, azar, vistos, 'medio'));
export const armarCalentamiento = (azar = Math.random, vistos = new Set()) => SECCIONES_CALENTAMIENTO.map(s => armarSeccion(s.id, azar, vistos, 'calentamiento', SECCIONES_CALENTAMIENTO));

// ---------- Examen PAA completo (estructura real: 175 reactivos) ----------
// Lectura: lecturas completas (alternando literaria y no literaria, las menos vistas primero) hasta llegar a n;
// si sobran preguntas de la última lectura se recortan, y si faltan se completa con reactivos sueltos.
// Inglés: unas 2 de cada 5 preguntas salen de lecturas; el resto, sueltos repartidos por tema.
function lecturasHasta(sid, n, azar, vistos, tipos = ['literario', 'no_literario']) {
  const vistosDe = k => delTexto(k).filter(r => vistos.has(r.id)).length;
  // Primero las no vistas; entre ellas, las más difíciles (el Oficial se parece a la PAA real)
  const porTipo = tipos.map(t => barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === sid && (!t || TEXTOS[k].tipo === t)), azar).sort((a, b) => (vistosDe(a) - vistosDe(b)) || (dificultadTexto(b) - dificultadTexto(a))));
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
  if (sid === 'lectura') { const lect = lecturasHasta(sid, n, azar, vistos); items = [...lect, ...porTema(sueltos, n - lect.length, azar, vistos, 'oficial')]; }
  else if (sid === 'ingles') { const lect = lecturasHasta(sid, Math.round(n * 0.4), azar, vistos, [null]); items = [...porTema(sueltos, n - lect.length, azar, vistos, 'oficial'), ...lect]; }
  else items = porTema(sueltos, n, azar, vistos, 'oficial');
  return items.map(r => r.id);
}
export const armarExamen = (azar = Math.random, vistos = new Set()) => SECCIONES_EXAMEN.map(s => armarSeccionExamen(s.id, azar, vistos));
