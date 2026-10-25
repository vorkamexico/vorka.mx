import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { UNIVERSIDADES } from '../src/simulador/paa-universidades.js';

let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), env);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

describe('páginas de la PAA por universidad', () => {
  it('cada una responde con su canonical, su fuente oficial, liga al simulador y aviso de no afiliación', async () => {
    for (const [k, u] of Object.entries(UNIVERSIDADES)) {
      const r = await pedir(`/simulador-paa/${k}/`);
      expect(r.status).toBe(200);
      const html = await r.text();
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx/simulador-paa/${k}/">`);
      expect(html).toContain(`<title>${u.titulo.replace(/&/g, '&amp;')}</title>`);
      for (const f of u.fuentes) expect(html).toContain(f.url.replace(/&/g, '&amp;'));
      expect(html).toContain('href="/simulador-paa/"');
      expect(html).toContain('No estamos afiliados');
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).not.toContain('noindex');
    }
  });

  it('no son plantillas casi iguales: títulos, descripciones y reglas distintas', () => {
    const us = Object.values(UNIVERSIDADES);
    for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(us.map(u => u[k])).size).toBe(us.length);
    const reglas = us.map(u => new Set(u.reglas.map(r => r[1])));
    for (let i = 0; i < reglas.length; i++) for (let j = i + 1; j < reglas.length; j++) expect([...reglas[i]].filter(x => reglas[j].has(x))).toEqual([]);
  });

  it('sin barra final redirige, y una universidad que no existe no se inventa', async () => {
    expect((await pedir('/simulador-paa/udem')).status).toBe(301);
    expect((await pedir('/simulador-paa/buap/')).status).not.toBe(200);
  });

  it('entran al sitemap de la tienda y la página del simulador las liga', async () => {
    const mapa = await (await pedir('/tienda/sitemap.xml')).text();
    const paa = await (await pedir('/simulador-paa/')).text();
    for (const k of Object.keys(UNIVERSIDADES)) {
      expect(mapa).toContain(`<loc>https://vorka.mx/simulador-paa/${k}/</loc>`);
      expect(paa).toContain(`href="/simulador-paa/${k}/"`);
    }
  });
});
