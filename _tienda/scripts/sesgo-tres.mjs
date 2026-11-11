// Sesgo de longitud en bancos de 3 opciones (EXANI-II, prepa UG): que la correcta no se delate por ser la más larga.
// Meta: correcta = la más larga en ≤ 50 % del archivo (al azar sería 33 %) y claramente más larga (> 1.3 × la mayor de
// las otras) en ≤ 8 %. Uso: node _tienda/scripts/sesgo-tres.mjs [--lista] <archivo.js> [<archivo.js> …]
// --lista: imprime los ids que hay que revisar (la correcta es la más larga por más de 10 %).
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const args = process.argv.slice(2);
const lista = args.includes('--lista');
let mal = 0;
for (const f of args.filter(a => a !== '--lista')) {
  const m = await import(pathToFileURL(path.resolve(f)).href);
  const rs = Object.entries(m).filter(([k]) => k.startsWith('REACTIVOS')).flatMap(([, v]) => v).filter(r => Array.isArray(r.opciones));
  let larga = 0, clara = 0; const revisar = [];
  for (const r of rs) {
    const L = r.opciones.map(o => String(o).length), c = L[r.correcta], otros = Math.max(...L.filter((_, i) => i !== r.correcta));
    if (c >= Math.max(...L)) larga++;
    if (c > 1.3 * otros) clara++;
    if (c > 1.1 * otros) revisar.push(r.id);
  }
  const pl = Math.round(100 * larga / rs.length), pc = Math.round(100 * clara / rs.length);
  const ok = pl <= 50 && pc <= 8;
  if (!ok) mal++;
  console.log(`${ok ? '✓' : '✗'} ${path.basename(f)}: ${rs.length} reactivos · correcta = la más larga ${pl} % · claramente más larga ${pc} %`);
  if (lista && revisar.length) console.log(`  revisar (${revisar.length}): ${revisar.join(', ')}`);
}
process.exit(mal ? 1 : 0);
