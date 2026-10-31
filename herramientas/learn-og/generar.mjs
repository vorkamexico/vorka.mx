// Vorka Learn · genera las imágenes para compartir (og:image, 1200×630 PNG) de la portada, de cada sección y de cada guía.
// El diseño vive en _tienda/src/learn/og.js (HTML + SVG con el color y el dibujo de la sección); aquí solo se toma la foto
// con Playwright y se guarda en assets/learn/og/ (la sirve el sitio estático de vorka.mx). WhatsApp y Facebook no aceptan
// SVG en og:image; por eso PNG.
//
// Uso (desde la raíz del repo, después de agregar o cambiar una guía):
//   node herramientas/learn-og/generar.mjs            → todas
//   node herramientas/learn-og/generar.mjs --faltantes → solo las que no existen
// Opcional: ImageMagick (convert) para dejarlas en ~60 KB.
// Playwright: usa el que encuentre (npm i -D playwright, o global); PLAYWRIGHT=/ruta/a/playwright/index.mjs para otro.
// La prueba «cada guía tiene su imagen OG» (_tienda/test/learn-v2.test.js) falla si falta alguna.
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { listaOg } = await import(join(RAIZ, '_tienda/src/learn/og.js'));

async function cargarPlaywright() {
  for (const m of [process.env.PLAYWRIGHT, 'playwright', '/opt/node-tools/node_modules/playwright/index.mjs'].filter(Boolean)) {
    try { return await import(m); } catch { /* siguiente */ }
  }
  throw new Error('No encontré Playwright. Instálalo (npm i -D playwright && npx playwright install chromium) o usa PLAYWRIGHT=/ruta/index.mjs');
}

const soloFaltantes = process.argv.includes('--faltantes');
const lista = listaOg().filter(o => !soloFaltantes || !existsSync(join(RAIZ, o.archivo)));
if (!lista.length) { console.log('Todas las imágenes ya existen.'); process.exit(0); }

const { chromium } = await cargarPlaywright();
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const o of lista) {
  await pag.setContent(o.html, { waitUntil: 'load' });
  await pag.evaluate(() => document.fonts.ready);
  const destino = join(RAIZ, o.archivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, await pag.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  // Con ImageMagick, a 128 colores: ~60 KB en vez de ~400 KB y se ve igual (dibujos planos y degradados suaves)
  try { execFileSync('convert', [destino, '+dither', '-colors', '128', `PNG8:${destino}`], { stdio: 'ignore' }); } catch { /* sin ImageMagick: PNG completo */ }
  console.log(`${o.archivo}  ${Math.round(statSync(destino).size / 1024)} KB`);
}
await nav.close();
console.log(`Listo: ${lista.length} imágenes en assets/learn/og/`);
