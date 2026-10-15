// Copia Connect.js (npm @stripe/connect-js, MIT) a un módulo que el Worker sirve en /creadores/connect.mjs
// Uso: node scripts/vendor-connect.mjs   (correr al actualizar @stripe/connect-js)
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../node_modules/@stripe/connect-js/dist/connect.esm.js', import.meta.url), 'utf8');
const ver = JSON.parse(readFileSync(new URL('../node_modules/@stripe/connect-js/package.json', import.meta.url), 'utf8')).version;
writeFileSync(new URL('../src/vendor/connectjs.generado.js', import.meta.url),
  `// GENERADO por scripts/vendor-connect.mjs desde @stripe/connect-js ${ver} (MIT): no editar a mano\nexport const CONNECT_JS_VERSION = ${JSON.stringify(ver)};\nexport const CONNECT_JS = ${JSON.stringify(src)};\n`);
console.log('· src/vendor/connectjs.generado.js', ver);
