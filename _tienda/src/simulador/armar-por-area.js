// Arma simulacros de exámenes por materias (UNAM, ECOEMS): cada sección es una materia con su número de reactivos.
// Igual que armar.js: prioriza lo que el estudiante no ha visto y, en Español/Literatura, mete lecturas completas
// (sin pasarse del número de reactivos de la materia) y completa con reactivos sueltos.
import { porTema, barajar } from './armar.js';

// banco: { REACTIVOS, TEXTOS } · specs: [{ id: materia, reactivos: n, lecturas?: fracción en lecturas (0.4 por omisión) }] · nivel: 'calentamiento' | 'medio' | 'oficial'
export function armarPorMaterias(banco, specs, azar = Math.random, vistos = new Set(), nivel = 'medio') {
  const { REACTIVOS, TEXTOS = {} } = banco;
  const delTexto = k => REACTIVOS.filter(r => r.texto === k);
  return specs.map(({ id, reactivos: n, lecturas = 0.4 }) => {
    const sueltos = REACTIVOS.filter(r => r.seccion === id && !r.texto);
    const textos = barajar(Object.keys(TEXTOS).filter(k => TEXTOS[k].seccion === id), azar)
      .sort((a, b) => delTexto(a).filter(r => vistos.has(r.id)).length - delTexto(b).filter(r => vistos.has(r.id)).length);
    // Hasta ~40 % de la materia (o la fracción `lecturas`) en lecturas completas (solo si la lectura cabe entera)
    const lect = [];
    for (const k of textos) { const rs = delTexto(k); if (lect.length + rs.length <= Math.round(n * lecturas)) lect.push(...rs); }
    const resto = porTema(sueltos, n - lect.length, azar, vistos, nivel);
    // Si no alcanzan los sueltos, completa con preguntas de otras lecturas
    const falta = n - lect.length - resto.length;
    const extra = falta > 0 ? textos.flatMap(delTexto).filter(r => !lect.includes(r)).slice(0, falta) : [];
    return [...resto, ...lect, ...extra].map(r => r.id);
  });
}
