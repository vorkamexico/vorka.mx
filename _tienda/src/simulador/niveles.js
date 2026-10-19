// Niveles del Simulador PAA: Calentamiento (para entrar en ritmo), Medio (simulacro corto) y Oficial (examen completo).
// Los reactivos llevan dificultad 1–3; armar.js elige por nivel: Calentamiento 1–2, Medio 2–3, Oficial todas cargado a lo difícil.
export const SECCIONES_CALENTAMIENTO = [
  { id: 'lectura', reactivos: 6, minutos: 8 },
  { id: 'redaccion', reactivos: 6, minutos: 6 },
  { id: 'matematicas', reactivos: 6, minutos: 9 },
  { id: 'ingles', reactivos: 6, minutos: 6 },
];
// Intentos incluidos con la compra del simulador (los Medios y Oficiales extra se compran aparte)
export const INCLUIDOS = { calentamiento: 2, corto: 2, examen: 1 };
