// Revisa un banco de reactivos del simulador (UNAM, ECOEMS o PAA) antes de sumarlo.
// Uso: node _tienda/scripts/validar-banco.mjs [--opciones 3] <archivo.js> [<archivo.js> …]
// --opciones: cuántas opciones lleva cada reactivo (4 por omisión; el EXANI-I de la prepa UG usa 3).
// Cada archivo exporta TEMAS_* (objeto), REACTIVOS_* (arreglo) y, si tiene lecturas, TEXTOS_* (objeto).
import { pathToFileURL } from 'node:url';
import path from 'node:path';
let errores = 0, total = 0;
const mal = (f, id, m) => { errores++; console.log(`✗ ${path.basename(f)} ${id}: ${m}`); };
const ids = new Map();
const args = process.argv.slice(2);
const io = args.indexOf('--opciones');
const N = io >= 0 ? Number(args.splice(io, 2)[1]) : 4;
const LETRAS = 'ABCD'.slice(0, N);
for (const f of args) {
  const mod = await import(pathToFileURL(path.resolve(f)).href);
  const temas = Object.assign({}, ...Object.entries(mod).filter(([k]) => k.startsWith('TEMAS')).map(([, v]) => v));
  const textos = Object.assign({}, ...Object.entries(mod).filter(([k]) => k.startsWith('TEXTOS')).map(([, v]) => v));
  const reactivos = Object.entries(mod).filter(([k]) => k.startsWith('REACTIVOS')).flatMap(([, v]) => v);
  if (!reactivos.length) mal(f, '-', 'no exporta REACTIVOS_*');
  for (const [k, t] of Object.entries(temas)) if (!t.seccion || !t.nombre || !t.consejo) mal(f, k, 'tema sin seccion, nombre o consejo');
  for (const [k, t] of Object.entries(textos)) if (!t.seccion || !t.titulo || !Array.isArray(t.parrafos) || !t.parrafos.length) mal(f, k, 'texto sin seccion, titulo o parrafos');
  const porDif = { 1: 0, 2: 0, 3: 0 }, porTema = {};
  for (const r of reactivos) {
    total++;
    const id = r.id || '(sin id)';
    if (ids.has(id)) mal(f, id, `id repetido (también en ${ids.get(id)})`); else ids.set(id, path.basename(f));
    for (const c of ['seccion', 'tema', 'enunciado', 'pista', 'regla']) if (!r[c] || typeof r[c] !== 'string') mal(f, id, `falta ${c}`);
    if (!Array.isArray(r.pasos) || !r.pasos.length) mal(f, id, 'falta pasos');
    if (![1, 2, 3].includes(r.dificultad)) mal(f, id, 'dificultad debe ser 1, 2 o 3');
    if (r.tema && !temas[r.tema]) mal(f, id, `tema "${r.tema}" no está en TEMAS`);
    if (r.texto && !textos[r.texto]) mal(f, id, `texto "${r.texto}" no está en TEXTOS`);
    if (r.tipo === 'abierta') { if (!Array.isArray(r.respuestas) || !r.respuestas.length) mal(f, id, 'abierta sin respuestas'); }
    else {
      if (!Array.isArray(r.opciones) || r.opciones.length !== N) mal(f, id, `debe tener ${N} opciones`);
      else {
        if (new Set(r.opciones.map(o => String(o).trim().toLowerCase())).size !== N) mal(f, id, 'opciones repetidas');
        if (!Number.isInteger(r.correcta) || r.correcta < 0 || r.correcta > N - 1) mal(f, id, `correcta debe ser 0–${N - 1}`);
      }
    }
    // El cliente baraja las opciones: las pistas y pasos no pueden nombrar letras sueltas ("la opción B")
    const txt = [r.pista, ...(r.pasos || []), r.regla].join(' ');
    if (/\b(opci[oó]n|inciso|respuesta)\s+[A-D]\b/.test(txt)) mal(f, id, `nombra una letra de opción; usa {A}…{${LETRAS.at(-1)}}`);
    porDif[r.dificultad] = (porDif[r.dificultad] || 0) + 1; porTema[r.tema] = (porTema[r.tema] || 0) + 1;
  }
  console.log(`· ${path.basename(f)}: ${reactivos.length} reactivos · dificultad 1/2/3: ${porDif[1]}/${porDif[2]}/${porDif[3]} · temas: ${Object.entries(porTema).map(([t, n]) => `${t} ${n}`).join(', ')}`);
}
console.log(errores ? `\n✗ ${errores} problemas en ${total} reactivos` : `\n✓ ${total} reactivos sin problemas`);
process.exit(errores ? 1 : 0);
