// Revisa el banco del Simulador PAA: formato, ids únicos, temas válidos, opciones, lecturas y figuras seguras.
// Uso: node scripts/validar-banco.mjs [archivo-extra.js]   (sin archivo revisa el banco completo)
import { SECCIONES, TEMAS, TEXTOS, REACTIVOS } from '../src/simulador/banco.js';

const errores = [], avisos = [];
const ids = new Set();
const archivo = process.argv[2];
let lista = REACTIVOS, textos = TEXTOS;
if (archivo) {
  const m = await import(new URL('../' + archivo, import.meta.url));
  lista = Object.entries(m).filter(([k, v]) => k.startsWith('REACTIVOS') && Array.isArray(v)).flatMap(([, v]) => v);
  textos = { ...TEXTOS, ...Object.assign({}, ...Object.entries(m).filter(([k]) => k.startsWith('TEXTOS')).map(([, v]) => v)) };
  // los ids del archivo no deben chocar con los del banco ya armado (si el archivo aún no está sumado)
  const enBanco = new Set(REACTIVOS.map(r => r.id));
  for (const r of lista) if (enBanco.has(r.id) && !REACTIVOS.includes(r)) errores.push(`${r.id}: ese id ya existe en el banco`);
}
const secs = new Set(SECCIONES.map(s => s.id));
const vacio = v => typeof v !== 'string' || v.trim().length < 8;
function revisarSVG(id, svg) {
  if (typeof svg !== 'string' || !svg.trim().startsWith('<svg')) return errores.push(`${id}: figura debe ser un <svg> en texto`);
  if (/<script|on\w+=|href=|xlink:|<image|<foreignObject|url\(/i.test(svg)) errores.push(`${id}: la figura trae algo no permitido (script, eventos, enlaces o imágenes externas)`);
  if (!/viewBox="[\d.\s-]+"/.test(svg)) errores.push(`${id}: la figura necesita viewBox`);
  if (!/role="img"/.test(svg) || !/aria-label="[^"]{8,}"/.test(svg)) errores.push(`${id}: la figura necesita role="img" y aria-label descriptivo`);
  const abre = (svg.match(/<(?!\/)(?![^>]*\/>)[a-zA-Z]+/g) || []).length, cierra = (svg.match(/<\//g) || []).length;
  if (abre !== cierra) errores.push(`${id}: etiquetas del SVG sin cerrar (${abre} abren, ${cierra} cierran)`);
  if (svg.length > 6000) avisos.push(`${id}: figura grande (${svg.length} caracteres)`);
}
for (const r of lista) {
  const id = r.id || '(sin id)';
  if (!r.id || ids.has(r.id)) errores.push(`${id}: id vacío o repetido`); ids.add(r.id);
  if (!secs.has(r.seccion)) errores.push(`${id}: sección inválida "${r.seccion}"`);
  if (!TEMAS[r.tema] || TEMAS[r.tema].seccion !== r.seccion) errores.push(`${id}: tema "${r.tema}" no existe en ${r.seccion}`);
  if (![1, 2, 3].includes(r.dificultad)) errores.push(`${id}: dificultad debe ser 1, 2 o 3`);
  if (vacio(r.enunciado)) errores.push(`${id}: falta enunciado`);
  if (r.texto && (!textos[r.texto] || textos[r.texto].seccion !== r.seccion)) errores.push(`${id}: la lectura "${r.texto}" no existe en ${r.seccion}`);
  if (r.tipo === 'abierta') {
    if (r.seccion !== 'matematicas') errores.push(`${id}: solo Matemáticas tiene respuesta abierta`);
    if (!Array.isArray(r.respuestas) || !r.respuestas.length || r.respuestas.some(x => typeof x !== 'string' || !x.trim())) errores.push(`${id}: abierta sin respuestas válidas`);
  } else {
    if (!Array.isArray(r.opciones) || r.opciones.length !== 4) errores.push(`${id}: debe tener 4 opciones`);
    else {
      if (new Set(r.opciones.map(o => String(o).trim().toLowerCase())).size !== 4) errores.push(`${id}: opciones repetidas`);
      if (r.opciones.some(o => typeof o !== 'string' || !o.trim())) errores.push(`${id}: opción vacía`);
    }
    if (!Number.isInteger(r.correcta) || r.correcta < 0 || r.correcta > 3) errores.push(`${id}: "correcta" debe ser 0–3`);
  }
  if (vacio(r.pista)) errores.push(`${id}: falta pista`);
  if (!Array.isArray(r.pasos) || r.pasos.length < 2) errores.push(`${id}: faltan pasos (mínimo 2)`);
  if (vacio(r.regla)) errores.push(`${id}: falta regla`);
  const pistaTxt = [r.pista, ...(r.pasos || [])].join(' ');
  if (/\b(opci[oó]n|inciso|respuesta)\s+[ABCD]\b|\([ABCD]\)/.test(pistaTxt)) errores.push(`${id}: pista o pasos nombran una letra (el cliente baraja las opciones; usa {A}…{D})`);
  if (r.tipo !== 'abierta' && r.opciones && r.pista && r.opciones[r.correcta] && r.pista.includes(r.opciones[r.correcta]) && r.opciones[r.correcta].length > 3) avisos.push(`${id}: la pista contiene el texto de la respuesta correcta`);
  if (r.tabla && (!Array.isArray(r.tabla) || r.tabla.length < 2 || r.tabla.some(f => !Array.isArray(f) || f.length !== r.tabla[0].length))) errores.push(`${id}: tabla mal formada`);
  if (r.figura) revisarSVG(id, r.figura);
}
// Lecturas: cada una con párrafos y con reactivos
for (const [k, t] of Object.entries(textos)) {
  if (!Array.isArray(t.parrafos) || !t.parrafos.length) errores.push(`lectura ${k}: sin párrafos`);
  const n = lista.filter(r => r.texto === k).length;
  if (archivo ? (n === 0 && !TEXTOS[k]) : n === 0) errores.push(`lectura ${k}: no tiene reactivos`);
}
// Distribución de respuestas correctas (que no caigan siempre en la misma posición)
const pos = [0, 0, 0, 0]; lista.filter(r => r.tipo !== 'abierta').forEach(r => pos[r.correcta]++);
const conteo = {}; lista.forEach(r => { conteo[r.seccion] = (conteo[r.seccion] || 0) + 1; });
console.log(`${lista.length} reactivos`, conteo, '· posición de la correcta (A-D en el archivo):', pos.join(' / '), '· con figura:', lista.filter(r => r.figura).length);
if (avisos.length) console.log('Avisos:\n - ' + avisos.join('\n - '));
if (errores.length) { console.log(`✗ ${errores.length} errores:\n - ` + errores.join('\n - ')); process.exit(1); }
console.log('✓ Banco válido');
