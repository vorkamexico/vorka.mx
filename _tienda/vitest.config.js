import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Igual que Wrangler: los .css se importan como texto
const cssComoTexto = { name: 'css-texto', enforce: 'pre', async load(id) { if (id.endsWith('.css')) { const fs = await import('node:fs'); return `export default ${JSON.stringify(fs.readFileSync(id, 'utf8'))};`; } } };

export default defineConfig({
  plugins: [cssComoTexto],
  resolve: { alias: { 'cloudflare:workers': fileURLToPath(new URL('./test/stubs/cloudflare-workers.js', import.meta.url)) } },
});
