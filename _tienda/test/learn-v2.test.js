// Vorka Learn v2: encabezado y menú al estilo Vorka, colores y dibujos por sección, imágenes OG, búsqueda, acerca, RSS y
// la experiencia de lectura. Recorre TODAS las secciones del catálogo (src/learn/datos.js), así una sección nueva queda
// probada sin tocar este archivo.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { secciones, articulos, ogArticulo, ogSeccion, OG_LEARN } from '../src/learn/datos.js';
import { listaOg } from '../src/learn/og.js';
import { buscarGuias } from '../src/learn/extra.js';

let env;
const pedir = (ruta, metodo = 'GET', e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), e);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });
const cabecera = html => html.split('<header')[1].split('</header>')[0];
const menu = html => html.match(/<div class="menu-movil lr-menu"[\s\S]*?<\/div>\n<main/)[0];
const principal = html => html.split('<main')[1].split('</main>')[0];
const RAIZ = new URL('../../', import.meta.url);

const SECCIONES = secciones(), ARTICULOS = articulos();
const PAGINAS = ['/learn/', ...SECCIONES.map(s => s.ruta), ...ARTICULOS.map(a => a.ruta), '/learn/buscar/?q=puntaje', '/learn/acerca/'];

describe('Vorka Learn v2: encabezado y menú', () => {
  it('el catálogo tiene los exámenes y Finanzas personales', () => {
    expect(SECCIONES.map(s => s.clave)).toEqual(expect.arrayContaining(['paa', 'unam', 'ecoems', 'prepa-ug', 'finanzas']));
    expect(SECCIONES.find(s => s.clave === 'finanzas').grupo).toBe('tema');
  });

  it('todas las páginas de Learn llevan la píldora Vorka (logo, Learn, lupa, Practica, menú) y el pie de Vorka', async () => {
    for (const ruta of PAGINAS) {
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const html = await r.text(), cab = cabecera(html);
      expect(html, ruta).toContain('<header class="nav t-navs lr-navs">');
      expect(cab, ruta).toContain('Vorka <b>Learn</b>');
      expect(cab, ruta).toContain('href="/learn/buscar/"');
      expect(cab, ruta).toMatch(/class="btn acento t-pastilla lr-practica" href="[^"]+"[^>]*><svg[\s\S]*?<span>Practica<\/span>/);
      expect(cab, ruta).toContain('<button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil">');
      for (const s of SECCIONES) expect(cab, `${ruta} → ${s.ruta}`).toContain(`href="${s.ruta}"`);
      // Menú: buscador, secciones con su color, Practica, Acerca, Tienda (discreta), Vorka México y apariencia
      const m = menu(html);
      expect(m).toContain('role="dialog"');
      expect(m).toContain('action="/learn/buscar/"');
      for (const s of SECCIONES) expect(m).toContain(`class="lr-m-sec lr-s-${s.clave}" href="${s.ruta}"`);
      expect(m).toContain('href="/learn/acerca/"');
      expect(m).toContain('<li class="lr-m-discreto"><a href="/tienda/">Tienda Vorka</a>');
      expect(m).toContain('data-tema-op="oscuro"');
      expect(html).toContain('<footer class="pie">');
      // El script del menú/lectura lleva el nonce de la CSP
      const n = r.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];
      expect(html).toContain(`<script nonce="${n}">(function(){var d=document,h=d.documentElement`);
      expect(html).toContain('<link rel="alternate" type="application/rss+xml" title="Vorka Learn" href="/learn/feed.xml">');
    }
  });

  it('«Practica» lleva al simulador del examen en sus páginas y a la sección Practica de la portada en el resto', async () => {
    const pr = html => cabecera(html).match(/lr-practica" href="([^"]+)"/)[1];
    for (const s of SECCIONES) {
      const esperado = s.simulador ? s.simulador.href : '/learn/#practica';
      expect(pr(await (await pedir(s.ruta)).text()), s.ruta).toBe(esperado);
      expect(pr(await (await pedir(s.articulos.map(s.rutaDe)[0])).text()), s.clave).toBe(esperado);
    }
    const portada = await (await pedir('/learn/')).text();
    expect(pr(portada)).toBe('/learn/#practica');
    expect(portada).toContain('id="practica"');
    for (const s of SECCIONES.filter(x => x.simulador)) expect(principal(portada)).toContain(`href="${s.simulador.href}"`);
  });
});

describe('Vorka Learn v2: color, dibujos e imágenes', () => {
  it('cada página pinta con el color de su sección y cada artículo tiene su dibujo, minutos de lectura e índice con flecha', async () => {
    for (const a of ARTICULOS) {
      const html = await (await pedir(a.ruta)).text();
      expect(html, a.ruta).toContain(`<body class="lr-s-${a.clave}">`);
      expect(html, a.ruta).toMatch(/<div class="lr-portadilla"><svg [^>]*class="lr-arte"/);
      expect(html, a.ruta).toMatch(/\d+ min de lectura/);
      expect(html, a.ruta).toMatch(/<details class="lr-toc"><summary><span class="lr-toc-ico">[\s\S]*?En esta guía <span class="lr-toc-n">· \d+ apartados<\/span>[\s\S]*?<span class="lr-toc-fl">/);
      expect(html, a.ruta).toContain('<div class="lr-progreso" aria-hidden="true"><i></i></div>');
      expect(html, a.ruta).toContain('class="lr-subir" href="#contenido"');
    }
    for (const s of SECCIONES) expect(await (await pedir(s.ruta)).text()).toContain(`<body class="lr-s-${s.clave}">`);
    // La barra de progreso solo va en los artículos
    expect(await (await pedir('/learn/')).text()).not.toContain('lr-progreso"');
  });

  it('las tarjetas llevan miniatura con carga diferida y medidas (no mueven la página) y etiqueta de color', async () => {
    const html = principal(await (await pedir('/learn/')).text());
    const imgs = [...html.matchAll(/<img [^>]*>/g)].map(m => m[0]);
    expect(imgs.length).toBeGreaterThanOrEqual(ARTICULOS.length);
    for (const i of imgs) { expect(i).toContain('loading="lazy"'); expect(i).toContain('width="480" height="270"'); expect(i).toContain('alt=""'); }
    for (const a of ARTICULOS) expect(html).toContain(`<a class="gu-card lr-s-${a.clave}" href="${a.ruta}">`);
    expect(html).toContain('<svg class="lr-hero-arte"');
  });

  it('los dibujos se sirven como SVG propios (sin scripts ni imágenes externas); una sección que no existe no', async () => {
    for (const s of [...SECCIONES.map(x => x.clave), 'learn']) {
      const r = await pedir(`/learn/arte/${s}/algo.svg`);
      expect(r.status, s).toBe(200);
      expect(r.headers.get('content-type')).toContain('image/svg+xml');
      const svg = await r.text();
      expect(svg).toMatch(/^<\?xml[\s\S]*<svg [\s\S]*<\/svg>$/);
      expect(svg).not.toMatch(/<script|<image|href="http/);
    }
    expect((await pedir('/learn/arte/sat.svg')).status).not.toBe(200);
  });

  it('imagen para compartir (PNG 1200×630) de cada artículo, sección y portada; og:image apunta a ella', async () => {
    const png = ruta => { const b = readFileSync(new URL(`.${ruta}`, RAIZ)); return { firma: b.subarray(1, 4).toString(), w: b.readUInt32BE(16), h: b.readUInt32BE(20), kb: b.length / 1024 }; };
    for (const o of listaOg()) {
      expect(existsSync(new URL(`.${o.archivo}`, RAIZ)), `${o.archivo}: corre node herramientas/learn-og/generar.mjs`).toBe(true);
      const i = png(o.archivo);
      expect(i.firma).toBe('PNG');
      expect([i.w, i.h], o.archivo).toEqual([1200, 630]);
      expect(i.kb, o.archivo).toBeLessThan(400);
    }
    expect(listaOg().map(o => o.archivo)).toEqual(expect.arrayContaining([OG_LEARN, ...SECCIONES.map(s => ogSeccion(s.clave)), ...ARTICULOS.map(ogArticulo)]));
    for (const a of ARTICULOS) {
      const html = await (await pedir(a.ruta)).text();
      expect(html, a.ruta).toContain(`<meta property="og:image" content="https://vorka.mx${ogArticulo(a)}">`);
      expect(html).toContain('<meta property="og:image:width" content="1200">');
    }
    expect(await (await pedir('/learn/')).text()).toContain(`<meta property="og:image" content="https://vorka.mx${OG_LEARN}">`);
  });
});

describe('Vorka Learn v2: búsqueda, acerca y RSS', () => {
  it('busca en todas las secciones (sin acentos ni mayúsculas importar), marca las palabras y no se indexa', async () => {
    expect(buscarGuias('aciertos UNAM')[0].ruta).toBe('/learn/unam/cuantos-aciertos-para-entrar-a-la-unam/');
    expect(buscarGuias('TANDA').map(a => a.ruta)).toContain('/learn/finanzas/como-organizar-una-tanda/');
    expect(buscarGuias('examen ecoems').map(a => a.ruta)).toContain('/learn/ecoems/que-viene-en-el-examen-ecoems/');
    expect(buscarGuias('')).toEqual([]);
    const r = await pedir('/learn/buscar/?q=puntaje%20paa');
    const html = await r.text();
    expect(r.headers.get('x-robots-tag')).toBe('noindex, follow');
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain('href="/learn/paa/puntaje-paa/"');
    expect(html).toMatch(/<mark>puntaje<\/mark>/i);
    expect(html).toContain('value="puntaje paa"');
    // Sin resultados y con texto peligroso: se escapa
    const raro = await (await pedir(`/learn/buscar/?q=${encodeURIComponent('<script>zzqx</script>')}`)).text();
    expect(raro).not.toContain('<script>zzqx');
    expect(raro).toContain('No encontramos guías');
    // Sin búsqueda: sugerencias y secciones
    const vacia = await (await pedir('/learn/buscar/')).text();
    expect(vacia).toContain('autofocus');
    for (const s of SECCIONES) expect(principal(vacia)).toContain(`href="${s.ruta}"`);
    expect((await pedir('/learn/buscar')).status).toBe(301);
  });

  it('«Acerca de Vorka Learn»: quién la hace, cómo verificamos, sin afiliación y cómo reportar un error', async () => {
    const r = await pedir('/learn/acerca/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<link rel="canonical" href="https://vorka.mx/learn/acerca/">');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    for (const t of ['Quién la hace', 'Cómo verificamos los datos', 'Sin afiliación', 'Cómo reportar un error', 'Celaya', 'College Board', 'asesoría financiera']) expect(html, t).toContain(t);
    expect(html).toContain('href="mailto:hola@vorka.mx');
    expect(html).toContain('id="errores"');
    expect(html).toContain('"@type":"AboutPage"');
    expect(html).not.toMatch(/agencia/i);
    // Cada artículo liga a «Avísanos» y está en el sitemap
    expect(await (await pedir(ARTICULOS[0].ruta)).text()).toContain('href="/learn/acerca/#errores"');
    expect(await (await pedir('/learn/sitemap.xml')).text()).toContain('<loc>https://vorka.mx/learn/acerca/</loc>');
    expect(await (await pedir('/learn/sitemap.xml')).text()).not.toContain('/learn/buscar/');
  });

  it('RSS /learn/feed.xml válido con todos los artículos', async () => {
    const r = await pedir('/learn/feed.xml');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('application/rss+xml');
    const xml = await r.text();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0" xmlns:atom="http:\/\/www.w3.org\/2005\/Atom">/);
    expect(xml).toContain('<atom:link href="https://vorka.mx/learn/feed.xml" rel="self" type="application/rss+xml"/>');
    const items = xml.match(/<item>[\s\S]*?<\/item>/g);
    expect(items).toHaveLength(ARTICULOS.length);
    for (const a of ARTICULOS) expect(xml).toContain(`<guid isPermaLink="true">https://vorka.mx${a.ruta}</guid>`);
    for (const it of items) {
      expect(it).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/);
      expect(it).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
    }
    // Etiquetas abiertas = cerradas (XML bien formado a grandes rasgos)
    for (const t of ['item', 'title', 'link', 'description', 'channel']) expect((xml.match(new RegExp(`<${t}>`, 'g')) || []).length).toBe((xml.match(new RegExp(`</${t}>`, 'g')) || []).length);
  });
});
