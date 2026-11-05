// Catálogo para compartir (catalogo-compartir.js): la página con portadas y precios, quién lo recomienda con su código,
// la portada JPG para la vista previa de WhatsApp y el mensaje listo para grupos (con precios reales y la liga con código).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { itemsCatalogo, mensajeCatalogo, ligaCatalogo, PORTADA_CATALOGO } from '../src/catalogo-compartir.js';
import { PCT_REFERIDO } from '../src/descuentos.js';

let env;
const SITIO = 'https://vorka.mx';
beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, email, comision_pct, activo, tipo, publico) VALUES ('P-ANA1', 'Ana López', 'ana@mail.com', 0, 1, 'puntos', 'ANAVENDE')");
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
});
afterEach(() => vi.unstubAllGlobals());
const pedir = ruta => worker.fetch(new Request(SITIO + ruta, { headers: { 'cf-connecting-ip': '1.1.1.1' } }), env);

describe('Catálogo para compartir', () => {
  it('agrupa por línea, un renglón por producto con su precio más bajo', async () => {
    const s = await itemsCatalogo(env);
    expect(s.length).toBeGreaterThan(0);
    const todos = s.flatMap(x => x.items);
    expect(todos.every(x => Number.isFinite(x.desde) && x.desde > 0 && x.ruta.startsWith('/'))).toBe(true);
    expect(new Set(todos.map(x => x.ruta)).size).toBe(todos.length);   // sin repetidos
  });
  it('la página sin código: portada JPG en la vista previa y se puede indexar', async () => {
    const r = await pedir('/tienda/catalogo/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain(`<meta property="og:image" content="${PORTADA_CATALOGO}">`);
    expect(PORTADA_CATALOGO).toMatch(/\.jpg$/);
    expect(html).not.toContain('noindex');
    expect(html).toContain('class="cat-p"');
  });
  it('con código: dice quién lo recomienda, su descuento y las ligas llevan su código', async () => {
    const html = await (await pedir('/tienda/catalogo/?ref=ANAVENDE')).text();
    expect(html).toContain('Te lo recomienda');
    expect(html).toContain('Código <b>ANAVENDE</b>');
    expect(html).toContain(`${PCT_REFERIDO} % de descuento`);
    expect(html).toMatch(/class="cat-p" href="[^"]*ref=ANAVENDE/);
    expect(html).toContain('noindex');
    expect(html).not.toContain('ana@mail.com');
  });
  it('un código que no existe no inventa a nadie', async () => {
    const html = await (await pedir('/tienda/catalogo/?ref=NOEXISTE')).text();
    expect(html).not.toContain('Te lo recomienda');
  });
  it('el mensaje trae precios reales, el código y la liga con código', async () => {
    const s = await itemsCatalogo(env);
    const m = mensajeCatalogo(s, { code: 'ANAVENDE', nombre: 'Ana' });
    expect(m).toContain('*Catálogo Vorka México*');
    expect(m).toContain(`Con mi código *ANAVENDE* tienes ${PCT_REFERIDO} % de descuento`);
    expect(m).toContain(ligaCatalogo('ANAVENDE'));
    expect(m).toMatch(/: (desde )?\$\d/);
    expect(m.length).toBeLessThan(2000);
  });
});
