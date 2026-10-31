// Test vocacional Vorka para escuelas: la página /test-vocacional/escuelas/ (indexable, JSON-LD, precios que salen de los
// productos de licencia, WhatsApp de demostración, privacidad que coincide con el panel), el volante carta (noindex, QR
// propio) y los enlaces desde el test, sus páginas, el sitemap y Learn.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { pesosTexto } from '../src/descuentos.js';
import { TEXTO_DEMO } from '../src/tests/paginas-escuelas.js';

let env;
const pedir = (ruta, metodo = 'GET') => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual', headers: { 'cf-connecting-ip': '1.1.1.1' } }), env);
const db = sql => env.DB.raw.prepare(sql);
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64) }; });

const grupos = () => ['test-vocacional-grupo-10', 'test-vocacional-grupo-30', 'test-vocacional-grupo-100'].map(s => {
  const f = db('SELECT precio_centavos, contenido FROM products WHERE slug = ?').get(s);
  return { slug: s, centavos: f.precio_centavos, licencias: JSON.parse(f.contenido).licencias };
});

describe('/test-vocacional/escuelas/', () => {
  it('responde 200, es indexable y trae título, descripción, canónica y JSON-LD (Product con ofertas, migas y FAQ)', async () => {
    const r = await pedir('/test-vocacional/escuelas/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('<title>Test vocacional para escuelas y orientadores | Vorka México</title>');
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/test-vocacional/escuelas/">');
    expect(h).not.toContain('noindex');
    expect(h).toMatch(/<meta name="description" content="Test vocacional para todo tu grupo[^"]+Desde \$29 MXN por alumno\.">/);
    const ld = jsonLd(h);
    const prod = ld.find(x => x['@type'] === 'Product');
    expect(prod.offers).toMatchObject({ '@type': 'AggregateOffer', lowPrice: '490.00', highPrice: '2900.00', offerCount: 3, priceCurrency: 'MXN' });
    expect(prod.offers.offers.map(o => o.price)).toEqual(['490.00', '1170.00', '2900.00']);
    expect(ld.find(x => x['@type'] === 'BreadcrumbList').itemListElement.map(i => i.item)).toEqual(['https://vorka.mx/', 'https://vorka.mx/tienda/', 'https://vorka.mx/test-vocacional/', 'https://vorka.mx/test-vocacional/escuelas/']);
    expect(ld.find(x => x['@type'] === 'FAQPage').mainEntity.length).toBeGreaterThan(5);
    expect((await pedir('/test-vocacional/escuelas')).headers.get('location')).toBe('/test-vocacional/escuelas/');
  });

  it('los precios y el precio por alumno salen de los productos de licencia; la compra usa el checkout existente', async () => {
    const h = principal(await (await pedir('/test-vocacional/escuelas/')).text());
    const gs = grupos();
    expect(gs.map(g => g.centavos)).toEqual([49000, 117000, 290000]);
    for (const g of gs) {
      expect(h).toContain(`<input type="hidden" name="slug" value="${g.slug}">`);
      expect(h).toContain(`<h3>${g.licencias} licencias</h3>`);
      expect(h).toContain(pesosTexto(g.centavos));
      expect(h).toContain(`${pesosTexto(Math.round(g.centavos / g.licencias))} por alumno`);
    }
    expect(h).toContain('$49 MXN por alumno'); expect(h).toContain('$39 MXN por alumno'); expect(h).toContain('$29 MXN por alumno');
    expect(h.match(/action="\/api\/checkout"/g).length).toBe(3);
    // Si cambia el precio en la base, la página lo sigue
    db("UPDATE products SET precio_centavos = 60000 WHERE slug = 'test-vocacional-grupo-10'").run();
    const h2 = await (await pedir('/test-vocacional/escuelas/')).text();
    expect(h2).toContain('$600 MXN'); expect(h2).toContain('$60 MXN por alumno');
  });

  it('demostración por WhatsApp al número público del pie con mensaje prellenado; opción gratis para familias', async () => {
    const h = await (await pedir('/test-vocacional/escuelas/')).text();
    const demo = `https://wa.me/528117804869?text=${encodeURIComponent(TEXTO_DEMO)}`.replace(/&/g, '&amp;');
    expect(h).toContain(`href="${demo}"`);
    expect(h).toContain('Pide una demostración');
    expect(h).toContain('WhatsApp +52 81 1780 4869');   // el mismo número del pie del sitio
    const m = principal(h);
    expect(m).toContain('Que lo pague cada familia');
    expect(m).toContain('no hay panel del grupo');
    expect(m).toContain('$79 MXN');
    expect(m).toContain('href="/test-vocacional/"');
  });

  it('dice con exactitud qué incluye la licencia y qué ve el orientador (como el panel y la liga de grupo)', async () => {
    const m = principal(await (await pedir('/test-vocacional/escuelas/')).text());
    expect(m).toContain('No es solo el perfil básico');
    expect(m).toContain('20 carreras afines');
    expect(m).toContain('el simulador se vende aparte');
    expect(m).toContain('Acepto que quien me dio esta licencia (mi escuela u orientador) vea mi resultado: mi código y mis primeras carreras (opcional)');
    expect(m).toContain('El correo de nadie');
    expect(m).toContain('24 meses');
    expect(m).toContain('Una clase de 50 minutos, paso a paso');
    expect(m).toContain('no es una prueba psicométrica');
    expect(m).not.toMatch(/agencia/i);
    expect(m).toContain('href="/test-vocacional/escuelas/volante/"');
  });

  it('sin licencias activas no ofrece comprarlas y deja el contacto', async () => {
    db("UPDATE products SET activo = 0 WHERE slug LIKE 'test-vocacional-grupo-%'").run();
    const r = await pedir('/test-vocacional/escuelas/');
    expect(r.status).toBe(200);
    const m = principal(await r.text());
    expect(m).not.toContain('action="/api/checkout"');
    expect(m).toContain('Las licencias abren muy pronto');
  });
});

describe('volante para escuelas', () => {
  it('es noindex, tamaño carta con CSS de impresión, QR propio (SVG) a la página de escuelas y los precios reales', async () => {
    const r = await pedir('/test-vocacional/escuelas/volante/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(h).not.toContain('rel="canonical"');
    expect(h).toContain('@page{size:letter;margin:0}');
    expect(h).toContain('@media print');
    expect(h).toMatch(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+" shape-rendering="crispEdges" role="img" aria-label="Código QR a la página para escuelas/);
    expect(h).not.toMatch(/api\.qrserver|chart\.googleapis|quickchart/);
    expect(h).toContain('vorka.mx/test-vocacional/escuelas');
    for (const g of grupos()) expect(h).toContain(pesosTexto(g.centavos));
    expect(h).toContain('+52 81 1780 4869');
    const s = await (await pedir('/tienda/sitemap.xml')).text();
    expect(s).not.toContain('volante');
  });
});

describe('enlaces a la página de escuelas', () => {
  it('desde la página del test (sección visible, no solo la FAQ), su pie, el sitemap y Learn', async () => {
    const h = principal(await (await pedir('/test-vocacional/')).text());
    const seccion = h.split('id="escuelas"')[1].split('</section>')[0];
    expect(seccion).toContain('href="/test-vocacional/escuelas/"');
    expect(seccion).toContain('Ver cómo funciona en escuelas');
    expect(h).toContain('tv-pie-esc');
    const s = await (await pedir('/tienda/sitemap.xml')).text();
    expect(s).toContain('<loc>https://vorka.mx/test-vocacional/escuelas/</loc>');
    const l = await pedir('/learn/camino/como-elegir-carrera/');
    expect(l.status).toBe(200);
    const lh = await l.text();
    expect(lh).toContain('href="/test-vocacional/escuelas/"');
    expect(lh.match(/href="\/test-vocacional\/escuelas\/"/g).length).toBe(1);   // una línea, no promo
    // el destino existe
    expect((await pedir('/test-vocacional/escuelas/')).status).toBe(200);
  });
});
