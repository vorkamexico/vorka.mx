// Fichas de venta: todo Product de los datos estructurados lleva image (Search Console lo marca como error crítico de
// «Fichas de comerciante» y la ficha no sale en los resultados enriquecidos). Recorre las páginas de venta propias.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';

let env;
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; });
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), env);

const productos = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
  .flatMap(m => [JSON.parse(m[1])].flat()).filter(x => x['@type'] === 'Product');

const RUTAS = ['/tienda/evaluacion-liderazgo/', '/test-vocacional/', '/test-vocacional/escuelas/', '/que-proyecto-social/',
  '/tienda/cuentas/', '/tienda/vende/', '/tienda/vuelve/', '/tienda/agenda/', '/tienda/cupo/', '/tienda/clara/'];

describe('datos estructurados de producto', () => {
  for (const ruta of RUTAS)
    it(`${ruta}: cada Product lleva image con URL absoluta`, async () => {
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const ps = productos(await r.text());
      expect(ps.length, ruta).toBeGreaterThan(0);
      for (const p of ps) {
        expect(Array.isArray(p.image) && p.image.length > 0, `${ruta} sin image`).toBe(true);
        for (const i of p.image) expect(i).toMatch(/^https:\/\//);
      }
    });
});
