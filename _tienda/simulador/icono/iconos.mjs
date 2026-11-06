// Íconos de la app de los simuladores (pantalla de inicio del celular): un librito abierto con separador y destello, un
// color por simulador. No usa el logo de Vorka (la marca va dentro de la app: «Powered by vorka.mx»).
// Uso: node _tienda/simulador/icono/iconos.mjs   → escribe los PNG en assets/tienda/simulador-app/ (los sirve Cloudflare Pages)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'assets', 'tienda', 'simulador-app');
export { COLORES_APP as COLORES } from '../../src/simulador/instalable.js';
import { COLORES_APP as COLORES } from '../../src/simulador/instalable.js';

// escala: tamaño del libro (1 = normal; menor en la versión "maskable", que Android recorta en círculo)
export function svgIcono(id, { redondo = true, escala = 1 } = {}) {
  const [a, b] = COLORES[id];
  const s = escala, t = 256 * (1 - s);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  <linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>
  <radialGradient id="luz" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="hoja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1ECF4"/></linearGradient>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter>
</defs>
<rect width="512" height="512" rx="${redondo ? 112 : 0}" fill="url(#f)"/>
<rect width="512" height="512" rx="${redondo ? 112 : 0}" fill="url(#luz)"/>
<g transform="translate(${t} ${t + 14 * s}) scale(${s})">
  <g filter="url(#sombra)">
    <!-- tapa -->
    <path d="M86 168 C 150 150, 214 156, 256 182 C 298 156, 362 150, 426 168 L 426 388 C 362 372, 298 376, 256 400 C 214 376, 150 372, 86 388 Z" fill="${a}" opacity=".55"/>
    <!-- hojas -->
    <path d="M100 150 C 160 132, 218 140, 252 170 L 252 380 C 218 354, 160 350, 100 366 Z" fill="url(#hoja)"/>
    <path d="M412 150 C 352 132, 294 140, 260 170 L 260 380 C 294 354, 352 350, 412 366 Z" fill="url(#hoja)"/>
  </g>
  <!-- lomo -->
  <path d="M252 170 C 254 176, 258 176, 260 170 L 260 380 C 258 386, 254 386, 252 380 Z" fill="#D9CFE0"/>
  <!-- renglones -->
  <g stroke="${a}" stroke-width="9" stroke-linecap="round" opacity=".22" fill="none">
    <path d="M132 196 C 170 186, 204 190, 226 204"/><path d="M132 232 C 170 222, 204 226, 226 240"/><path d="M132 268 C 170 258, 204 262, 226 276"/><path d="M132 304 C 162 296, 188 298, 206 308"/>
    <path d="M286 204 C 308 190, 342 186, 380 196"/><path d="M286 240 C 308 226, 342 222, 380 232"/><path d="M306 308 C 324 298, 350 296, 380 304"/>
  </g>
  <!-- palomita en la página derecha -->
  <path d="M300 272 l 18 18 l 34 -38" stroke="${b}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- separador -->
  <path d="M340 140 L 340 222 L 356 206 L 372 222 L 372 138 C 360 136, 350 137, 340 140 Z" fill="#FFC23D"/>
  <!-- destello -->
  <path d="M150 70 C 154 98, 160 104, 188 108 C 160 112, 154 118, 150 146 C 146 118, 140 112, 112 108 C 140 104, 146 98, 150 70 Z" fill="#FFE59A"/>
  <circle cx="206" cy="80" r="8" fill="#FFE59A" opacity=".85"/>
</g>
</svg>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Playwright viene instalado globalmente (no es dependencia de la tienda)
  const { chromium } = createRequire(import.meta.url)('playwright');
  mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const id of Object.keys(COLORES)) {
    const variantes = [
      ['icono', { redondo: true }, [512, 192]],
      ['maskable', { redondo: false, escala: .78 }, [512, 192]],
      ['apple', { redondo: false, escala: .92 }, [180]],
    ];
    for (const [nombre, op, tamanos] of variantes) {
      const svg = svgIcono(id, op);
      if (nombre === 'icono') writeFileSync(join(SALIDA, `${id}.svg`), svg);
      for (const t of tamanos) {
        await p.setViewportSize({ width: t, height: t });
        await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${t}" height="${t}"`)}</body></html>`);
        await p.screenshot({ path: join(SALIDA, `${id}-${nombre}-${t}.png`), omitBackground: true, clip: { x: 0, y: 0, width: t, height: t } });
      }
    }
  }
  await b.close();
  console.log('· íconos en', SALIDA);
}
