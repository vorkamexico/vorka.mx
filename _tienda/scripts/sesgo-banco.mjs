// Revisa que la respuesta correcta no se delate por su largo. Al azar, la correcta sería la más larga 1 de cada 4 veces.
// Tope por sección: la correcta es la opción más larga en ≤ 35 % de los reactivos (≤ 43 % con 3 opciones, donde al azar
// sería 1 de cada 3) y claramente la más larga en ≤ 15 %. Uso: node scripts/sesgo-banco.mjs [archivo-extra.js]
import { REACTIVOS } from '../src/simulador/banco.js';
const archivo = process.argv[2];
let lista = REACTIVOS;
if (archivo) {
  const m = await import(new URL('../' + archivo, import.meta.url));
  lista = Object.entries(m).filter(([k, v]) => k.startsWith('REACTIVOS') && Array.isArray(v)).flatMap(([, v]) => v);
}
const TOPE4 = 0.35, TOPE3 = 0.43, TOPE_CLARO = 0.15, largo = o => String(o).replace(/\s+/g, ' ').trim().length;
let falla = false;
const porSeccion = {};
for (const r of lista) {
  if (!Array.isArray(r.opciones) || r.opciones.length < 3) continue;
  const L = r.opciones.map(largo), c = L[r.correcta];
  const s = (porSeccion[r.seccion] ||= { n: 0, max: 0, larga: 0, corta: 0, ids: [], tope: r.opciones.length === 3 ? TOPE3 : TOPE4 });
  s.n++;
  const otrasL = L.filter((_, i) => i !== r.correcta);
  if (c > Math.max(...otrasL)) { s.max++; s.ids.push(r.id); }
  // Solo cuenta si la correcta es claramente la más larga/corta (gana por más de 15 % al segundo lugar)
  const otras = L.filter((_, i) => i !== r.correcta);
  if (c > Math.max(...otras) * 1.15 && c - Math.max(...otras) >= 4) s.larga++;
  if (c < Math.min(...otras) * 0.85 && Math.min(...otras) - c >= 4) s.corta++;
}
for (const [sec, s] of Object.entries(porSeccion)) {
  const pm = s.max / s.n, pl = s.larga / s.n, pc = s.corta / s.n;
  const ok = pm <= s.tope && pl <= TOPE_CLARO && pc <= TOPE_CLARO;
  if (!ok) falla = true;
  console.log(`${ok ? '✓' : '✗'} ${sec}: ${s.n} reactivos · correcta = la más larga ${(pm * 100).toFixed(0)} % · claramente más larga ${(pl * 100).toFixed(0)} % · más corta ${(pc * 100).toFixed(0)} %`);
  if (!ok && process.argv.includes('--ids')) console.log('   ', s.ids.join(' '));
}
process.exit(falla ? 1 : 0);
