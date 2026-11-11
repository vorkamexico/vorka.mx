// Revisa un banco de reactivos del simulador (UNAM, ECOEMS o PAA) antes de sumarlo.
// Uso: node _tienda/scripts/validar-banco.mjs [--opciones 3] <archivo.js> [<archivo.js> …]
// --opciones: cuántas opciones lleva cada reactivo de opción única (4 por omisión; el EXANI-I de la prepa UG usa 3).
// Tipos de respuesta semiconstruida (EXCOBA): 'multiple' (opciones 4–6 + correctas, 2 o más índices), 'numerica'
// (respuestas: número o, con expresion: true, expresión algebraica; tolerancia opcional) y 'clasificar' (categorias 2–4 +
// elementos 3–6 con { texto, categoria }). Se califican con la misma lógica del cliente (simulador/logica.js).
// Cada archivo exporta TEMAS_* (objeto), REACTIVOS_* (arreglo) y, si tiene lecturas, TEXTOS_* (objeto).
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../simulador/logica.js', import.meta.url), 'utf8'), ctx);
const L = ctx.SIM_LOGICA;
let errores = 0, total = 0;
const mal = (f, id, m) => { errores++; console.log(`✗ ${path.basename(f)} ${id}: ${m}`); };
const ids = new Map();
const args = process.argv.slice(2);
const io = args.indexOf('--opciones');
const N = io >= 0 ? Number(args.splice(io, 2)[1]) : 4;
const LETRAS = 'ABCDEF'.slice(0, N);
const porTipo = {};
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
    const tipo = r.tipo || 'unica';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    const distintas = l => new Set(l.map(o => String(o).trim().toLowerCase())).size === l.length;
    if (r.tipo === 'abierta') { if (!Array.isArray(r.respuestas) || !r.respuestas.length) mal(f, id, 'abierta sin respuestas'); }
    else if (r.tipo === 'numerica') {
      if (!Array.isArray(r.respuestas) || !r.respuestas.length) mal(f, id, 'numerica sin respuestas');
      else for (const a of r.respuestas) {
        if (r.expresion ? !L.expresion(a) : isNaN(L.numero(a))) mal(f, id, `respuesta que no se puede leer: ${a}`);
        else if (L.calificar(r, a) !== 1 || L.calificar(r, r.respuestas[0]) !== 1) mal(f, id, `respuestas no equivalentes: ${a}`);
      }
      if (r.tolerancia != null && !(r.tolerancia >= 0)) mal(f, id, 'tolerancia inválida');
      if (r.opciones || r.correcta != null) mal(f, id, 'numerica no lleva opciones ni correcta');
    } else if (r.tipo === 'multiple') {
      if (!Array.isArray(r.opciones) || r.opciones.length < 4 || r.opciones.length > 6) mal(f, id, 'multiple debe tener 4 a 6 opciones');
      else {
        if (!distintas(r.opciones)) mal(f, id, 'opciones repetidas');
        const c = r.correctas;
        if (!Array.isArray(c) || c.length < 2 || c.length >= r.opciones.length || new Set(c).size !== c.length || c.some(x => !Number.isInteger(x) || x < 0 || x >= r.opciones.length))
          mal(f, id, 'correctas debe ser una lista de 2 o más índices distintos (menos que las opciones)');
        else if (!new RegExp(`\\b(${c.length}|${['', '', 'dos', 'tres', 'cuatro', 'cinco'][c.length]})\\b`, 'i').test(r.enunciado)) mal(f, id, `el enunciado debe decir cuántas elegir (${c.length})`);
      }
      if (r.correcta != null) mal(f, id, 'multiple usa correctas, no correcta');
    } else if (r.tipo === 'clasificar') {
      const cs = r.categorias, es = r.elementos;
      if (!Array.isArray(cs) || cs.length < 2 || cs.length > 4 || !distintas(cs)) mal(f, id, 'clasificar: 2 a 4 categorías distintas');
      if (!Array.isArray(es) || es.length < 3 || es.length > 6) mal(f, id, 'clasificar: 3 a 6 elementos');
      else {
        if (!distintas(es.map(e => e.texto || ''))) mal(f, id, 'clasificar: elementos repetidos o sin texto');
        if (es.some(e => !Number.isInteger(e.categoria) || e.categoria < 0 || e.categoria >= (cs || []).length)) mal(f, id, 'clasificar: categoria fuera de rango');
        else if (new Set(es.map(e => e.categoria)).size < 2) mal(f, id, 'clasificar: usa al menos dos categorías');
      }
    } else if (r.tipo) mal(f, id, `tipo desconocido: ${r.tipo}`);
    else {
      if (!Array.isArray(r.opciones) || r.opciones.length !== N) mal(f, id, `debe tener ${N} opciones`);
      else {
        if (new Set(r.opciones.map(o => String(o).trim().toLowerCase())).size !== N) mal(f, id, 'opciones repetidas');
        if (!Number.isInteger(r.correcta) || r.correcta < 0 || r.correcta > N - 1) mal(f, id, `correcta debe ser 0–${N - 1}`);
      }
    }
    // El cliente baraja las opciones: las pistas y pasos no pueden nombrar letras sueltas ("la opción B")
    const txt = [r.pista, ...(r.pasos || []), r.regla].join(' ');
    if (/\b(opci[oó]n|inciso|respuesta)\s+[A-F]\b/.test(txt)) mal(f, id, `nombra una letra de opción; usa {A}…{${LETRAS.at(-1)}}`);
    porDif[r.dificultad] = (porDif[r.dificultad] || 0) + 1; porTema[r.tema] = (porTema[r.tema] || 0) + 1;
  }
  console.log(`· ${path.basename(f)}: ${reactivos.length} reactivos · dificultad 1/2/3: ${porDif[1]}/${porDif[2]}/${porDif[3]} · temas: ${Object.entries(porTema).map(([t, n]) => `${t} ${n}`).join(', ')}`);
  if (Object.keys(porTipo).length > 1 || !porTipo.unica) console.log(`  tipos: ${Object.entries(porTipo).map(([t, n]) => `${t} ${n}`).join(', ')}`);
  for (const k in porTipo) delete porTipo[k];
}
console.log(errores ? `\n✗ ${errores} problemas en ${total} reactivos` : `\n✓ ${total} reactivos sin problemas`);
process.exit(errores ? 1 : 0);
