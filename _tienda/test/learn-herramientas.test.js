// Vorka Learn · Herramientas gratis (/learn/herramientas/…): «Dividir una imagen en partes», su script, la promoción
// (Sparks, guías y tienda), los anuncios y el sitemap.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { CLIENTE_DIVIDIR } from '../src/learn/dividir-imagen-cliente.js';

let env;
const pedir = (ruta, e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), e);
const NOTICIAS = { img: 'https://fotos.vorka.mx/celaya', n: [
  { s: 'nota-uno', t: 'Nota uno de prueba', r: 'Resumen uno', c: 'Eventos', f: '11 nov 2026', i: 'os_n1-1' },
  { s: 'nota-dos', t: 'Nota dos de prueba', r: 'Resumen dos', c: 'Gobierno', f: '10 nov 2026', i: 'os_n2-1' },
] };
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  vi.stubGlobal('fetch', vi.fn(async u => String(u).endsWith('/sparks/celaya/noticias.json') ? Response.json(NOTICIAS) : new Response('no', { status: 404 })));
});
afterEach(() => vi.unstubAllGlobals());

describe('Herramientas de Vorka Learn', () => {
  it('la página de dividir imagen trae la herramienta, la ayuda, el JSON-LD y su script', async () => {
    const r = await pedir('/learn/herramientas/dividir-imagen/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<h1 class="lr-h1">Dividir una imagen en partes</h1>');
    for (const id of ['di-archivo', 'di-filas', 'di-cols', 'di-formato', 'di-dividir', 'di-zip']) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('<link rel="canonical" href="https://vorka.mx/learn/herramientas/dividir-imagen/">');
    expect(html).toContain('"@type":"WebApplication"');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toMatch(/<script src="\/learn\/herramientas\/dividir-imagen\.js\?v=\w+" defer><\/script>/);
    // Menú de Learn con la liga a Herramientas marcada
    expect(html).toContain('<a href="/learn/herramientas/" aria-current="page">Herramientas</a>');
  });

  it('promociona Sparks, guías de Learn y la tienda (sin precios)', async () => {
    const html = await (await pedir('/learn/herramientas/dividir-imagen/')).text();
    expect(html).toContain('href="/sparks/celaya/nota-uno/"');
    expect(html).toContain('https://fotos.vorka.mx/celaya/os_n1-1-800.webp');
    expect(html).toContain('Lo más reciente en Revista Sparks');
    expect(html).toContain('Guías para tu examen y tu carrera');
    expect(html).not.toMatch(/class="gu-card lr-s-(web|apps|negocio|finanzas|fiestas)"/);
    // Productos para estudiantes ARRIBA de la herramienta (a la vista sin bajar)
    const antes = html.split('id="di"')[0];
    expect(antes).toContain('class="di-arriba"');
    expect((antes.match(/class="di-mini"/g) || []).length).toBe(3);
    expect(antes).toMatch(/class="di-mini" href="\/(test-vocacional|simulador-[a-z-]+)\/"/);
    expect(html).toContain('class="di-res-promo"');
    // Las flechas de las ligas tienen tamaño (antes salían gigantes)
    expect(html).toContain('.di-mas svg,.di-arriba svg,.di-res-promo svg{width:16px;height:16px;flex:none}');
    expect(html.split('<main')[1]).not.toMatch(/\$\s?\d/);
  });

  it('si Sparks no responde, la página sale igual sin esa sección', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red'); }));
    const r = await pedir('/learn/herramientas/dividir-imagen/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('id="di-dividir"');
  });

  it('anuncios: apagados no dejan hueco; con slots aparecen mitad y final y la CSP se abre a Google', async () => {
    let html = await (await pedir('/learn/herramientas/dividir-imagen/')).text();
    expect(html).not.toContain('adsbygoogle');
    const r = await pedir('/learn/herramientas/dividir-imagen/', { ...env, ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_SLOTS: 'mitad:1111111111,final:2222222222' });
    html = await r.text();
    expect(html).toContain('data-ad-slot="1111111111"');
    expect(html).toContain('data-ad-slot="2222222222"');
    expect(html).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456');
    expect(r.headers.get('content-security-policy')).toContain('googlesyndication.com');
  });

  it('el script se sirve como JS con caché y es sintaxis válida', async () => {
    const r = await pedir('/learn/herramientas/dividir-imagen.js');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('javascript');
    const js = await r.text();
    expect(js).toBe(CLIENTE_DIVIDIR);
    expect(() => new Function(js)).not.toThrow();
    expect(js).toContain("var MAX_PIEZAS = 400");
    expect(js).toContain('/^image\\/(png|jpeg|webp)$/');
  });

  it('índice, redirecciones y sitemap', async () => {
    const r = await pedir('/learn/herramientas/');
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('href="/learn/herramientas/dividir-imagen/"');
    const s = await pedir('/learn/herramientas/dividir-imagen');
    expect(s.status).toBe(301);
    expect(s.headers.get('location')).toBe('https://vorka.mx/learn/herramientas/dividir-imagen/');
    const mapa = await (await pedir('/learn/sitemap.xml')).text();
    expect(mapa).toContain('<loc>https://vorka.mx/learn/herramientas/</loc>');
    expect(mapa).toContain('<loc>https://vorka.mx/learn/herramientas/dividir-imagen/</loc>');
    expect((await pedir('/learn/herramientas/no-existe/')).status).toBe(404);
  });
});
