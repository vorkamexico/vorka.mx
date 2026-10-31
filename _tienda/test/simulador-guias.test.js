import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { GUIAS, SIMS, guiasDe, rutaGuia, rutaIndice, textoDeGuia } from '../src/simulador/guias.js';

let env;
const pedir = (ruta, metodo = 'GET') => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), env);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

const desescapar = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => desescapar((html.match(re) || [])[1] || '');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
const indices = Object.keys(SIMS).filter(s => guiasDe(s).length).map(rutaIndice);
// «oficial» aplicado a lo nuestro (simulador, examen de práctica, reactivos): no se permite
const OFICIAL_ENGANOSO = /(simulador|simulacro|examen completo|reactivos?|preguntas?|práctica)\s+oficial/i;

describe('guías de los simuladores', () => {
  it('hay entre 8 y 12 guías, con URL única y de todos los simuladores', () => {
    expect(GUIAS.length).toBeGreaterThanOrEqual(8);
    expect(GUIAS.length).toBeLessThanOrEqual(12);
    expect(new Set(GUIAS.map(rutaGuia)).size).toBe(GUIAS.length);
    for (const s of Object.keys(SIMS)) expect(guiasDe(s).length).toBeGreaterThan(0);
  });

  it('cada guía responde 200 con title ≤ 60, description ≤ 155, canonical, OG de artículo y un solo H1', async () => {
    for (const x of GUIAS) {
      const ruta = rutaGuia(x);
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const html = await r.text();
      const titulo = meta(html, /<title>([^<]*)<\/title>/), desc = meta(html, /<meta name="description" content="([^"]*)">/);
      expect(titulo, ruta).toBe(x.titulo);
      expect(titulo.length, `${ruta}: ${titulo}`).toBeLessThanOrEqual(60);
      expect(desc, ruta).toBe(x.descripcion);
      expect(desc.length, ruta).toBeLessThanOrEqual(155);
      expect(desc.length, ruta).toBeGreaterThan(70);
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${ruta}">`);
      expect(html).toContain(`<meta property="og:url" content="https://vorka.mx${ruta}">`);
      expect(html).toContain('<meta property="og:type" content="article">');
      expect(html).not.toContain('noindex');
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(html).toContain(`<h1 class="t-h1">${x.h1}</h1>`);
    }
  });

  it('JSON-LD válido: Article con fecha y autor/editor Vorka México, BreadcrumbList y FAQPage solo si hay preguntas visibles', async () => {
    for (const x of GUIAS) {
      const html = await (await pedir(rutaGuia(x))).text();
      const ld = jsonLd(html);
      const art = ld.find(d => d['@type'] === 'Article');
      expect(art.headline).toBe(x.h1);
      expect(art.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(art.author).toMatchObject({ '@type': 'Organization', name: 'Vorka México' });
      expect(art.publisher).toMatchObject({ '@type': 'Organization', name: 'Vorka México' });
      expect(art.mainEntityOfPage['@id']).toBe(`https://vorka.mx${rutaGuia(x)}`);
      const migas = ld.find(d => d['@type'] === 'BreadcrumbList').itemListElement;
      expect(migas.map(m => m.item)).toEqual([`https://vorka.mx/${x.sim}/`, `https://vorka.mx${rutaIndice(x.sim)}`, `https://vorka.mx${rutaGuia(x)}`]);
      const faq = ld.find(d => d['@type'] === 'FAQPage');
      if (x.faq?.length) {
        expect(faq.mainEntity).toHaveLength(x.faq.length);
        // Cada pregunta del JSON-LD está respondida en la página
        for (const f of x.faq) expect(desescapar(html)).toContain(`<summary>${f.p}</summary><div>${f.r}</div>`);
      } else expect(faq).toBeUndefined();
    }
  });

  it('cada guía cita sus fuentes con enlace, dice cuándo se actualizó y lleva al simulador y a su reactivo gratis', async () => {
    for (const x of GUIAS) {
      const html = desescapar(await (await pedir(rutaGuia(x))).text());
      expect(x.fuentes.length).toBeGreaterThan(0);
      expect(html).toContain('id="fuentes">Fuentes</h2>');
      for (const f of x.fuentes) { expect(f.url).toMatch(/^https?:\/\//); expect(html).toContain(`href="${f.url}"`); }
      expect(html).toMatch(/Actualizado: <time datetime="\d{4}-\d{2}-\d{2}">[a-z]+ de \d{4}<\/time>/);
      expect(html).toContain(`href="/${x.sim}/"`);
      expect(html).toContain(`href="/${x.sim}/#probar"`);
      expect(html).toContain(`href="/${x.sim}/diagnostico/"`);
    }
  });

  it('ningún «oficial» engañoso: el simulador es de práctica y no está afiliado', async () => {
    for (const x of GUIAS) {
      expect(textoDeGuia(x), x.slug).not.toMatch(OFICIAL_ENGANOSO);
      const html = principal(await (await pedir(rutaGuia(x))).text());
      expect(html.replace(/<[^>]+>/g, ' '), x.slug).not.toMatch(OFICIAL_ENGANOSO);
      expect(html).toContain('simulador de práctica');
      expect(html).toMatch(/No estamos afiliados/);
    }
  });

  it('las guías de la PAA no dan minutos (decisión del commit 5501997)', () => {
    for (const x of guiasDe('simulador-paa')) expect(textoDeGuia(x), x.slug).not.toMatch(/\b\d+\s*minutos\b/);
  });

  it('los ejemplos de preguntas están marcados como propios', () => {
    for (const x of GUIAS) for (const y of x.secciones) {
      const ejemplos = (y.html.match(/class="gu-ej"/g) || []).length;
      expect((y.html.match(/Ejemplo propio de Vorka México/g) || []).length).toBe(ejemplos);
    }
  });

  it('todos los enlaces internos de cada guía y de cada índice existen', async () => {
    const vistos = new Map();
    for (const ruta of [...GUIAS.map(rutaGuia), ...indices]) {
      const html = principal(await (await pedir(ruta)).text());
      const internos = [...html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)].map(m => m[1]);
      expect(internos.length).toBeGreaterThan(2);
      for (const l of internos) {
        if (!vistos.has(l)) vistos.set(l, (await pedir(l)).status);
        expect(vistos.get(l), `${ruta} → ${l}`).toBe(200);
      }
      // Anclas del índice de la guía
      for (const [, id] of html.matchAll(/href="#([a-z0-9-]+)"/g)) expect(html, `${ruta} #${id}`).toContain(`id="${id}"`);
    }
  });

  it('se enlazan entre sí: cada guía liga al menos a otra guía', async () => {
    for (const x of GUIAS.filter(y => guiasDe(y.sim).length > 1)) {
      const html = principal(await (await pedir(rutaGuia(x))).text());
      expect(GUIAS.filter(y => y !== x).some(y => html.includes(`href="${rutaGuia(y)}"`)), x.slug).toBe(true);
    }
  });

  it('índices por simulador: 200, canonical, un H1 y liga a cada guía', async () => {
    for (const s of Object.keys(SIMS)) {
      const r = await pedir(rutaIndice(s));
      expect(r.status).toBe(200);
      const html = await r.text();
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${rutaIndice(s)}">`);
      expect(meta(html, /<title>([^<]*)<\/title>/).length).toBeLessThanOrEqual(60);
      expect(meta(html, /<meta name="description" content="([^"]*)">/).length).toBeLessThanOrEqual(155);
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(jsonLd(html).map(d => d['@type'])).toEqual(['CollectionPage', 'BreadcrumbList']);
      for (const x of guiasDe(s)) expect(html).toContain(`href="${rutaGuia(x)}"`);
    }
  });

  it('están en el sitemap de la tienda y las páginas de venta las ligan en «Guías para prepararte»', async () => {
    const mapa = await (await pedir('/tienda/sitemap.xml')).text();
    for (const ruta of [...GUIAS.map(rutaGuia), ...indices]) expect(mapa).toContain(`<loc>https://vorka.mx${ruta}</loc>`);
    for (const s of Object.keys(SIMS)) {
      const venta = await (await pedir(`/${s}/`)).text();
      expect(venta).toContain('Guías para prepararte');
      expect(venta).toContain(`href="${rutaIndice(s)}"`);
      for (const x of guiasDe(s)) expect(venta).toContain(`href="${rutaGuia(x)}"`);
    }
    // Las páginas de la PAA por universidad también ligan a las guías
    expect(await (await pedir('/simulador-paa/udem/')).text()).toContain('href="/simulador-paa/guias/puntaje-paa/"');
  });

  it('sin barra final redirige; una guía que no existe no se inventa; solo GET y HEAD', async () => {
    const x = GUIAS[0];
    const r = await pedir(rutaGuia(x).slice(0, -1));
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe(`https://vorka.mx${rutaGuia(x)}`);
    expect((await pedir('/simulador-paa/guias')).status).toBe(301);
    expect((await pedir('/simulador-paa/guias/no-existe/')).status).not.toBe(200);
    expect((await pedir('/simulador-unam/guias/que-es-la-paa/')).status).not.toBe(200);
    expect((await pedir(rutaGuia(x), 'HEAD')).status).toBe(200);
  });

  it('no son plantillas: títulos, descripciones y H1 distintos', () => {
    for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(GUIAS.map(x => x[k])).size).toBe(GUIAS.length);
  });
});
