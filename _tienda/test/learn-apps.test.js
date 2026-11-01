// Vorka Learn › Crea tu app (/learn/apps/): las mismas verificaciones que las otras secciones de tema
// (test/learn-temas.test.js): SEO, JSON-LD, fuentes con enlace, «Actualizado», un solo llamado final, ejemplos marcados,
// compartir, «Sigue leyendo», enlaces internos, índice, portada, búsqueda, RSS, sitemap y anuncios. Además:
//  - el llamado final lleva al programa para creadores y dice lo que la tienda hace HOY (descargables y suscripciones con al menos 20 % para Vorka en cada cobro);
//  - la tienda de Vorka solo aparece en el cuerpo de la guía «dónde vender», dentro de su bloque marcado (TIENDA_VORKA);
//  - la aritmética de los ejemplos cuadra.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { APPS, ARTICULOS_APPS, TEMA_APPS, AVISO_APPS, TIENDA_VORKA, TIENDA_VORKA_FAQ, S } from '../src/learn-apps.js';
import { secciones } from '../src/learn/datos.js';
import { buscarGuias } from '../src/learn/extra.js';

let env;
const pedir = (ruta, metodo = 'GET', e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), e);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), MARKETPLACE: '1' }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

const desescapar = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => desescapar((html.match(re) || [])[1] || '');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
const cabecera = html => html.split('<header')[1].split('</header>')[0];
const DOMINIOS_GOOGLE = /googlesyndication|doubleclick|adtrafficquality|adservice\.google|googletagservices|fundingchoices/;
const AD_ENV = { ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_SLOTS: 'intro:1111111111,mitad:2222222222,final:3333333333,indice:4444444444' };
// Fuentes: páginas oficiales de Apple, Google Play, Stripe, Mercado Pago, MDN, leyes en diputados.gob.mx y los términos de Vorka
const OFICIALES = /^https:\/\/(developer\.apple\.com|www\.apple\.com\/newsroom|support\.google\.com\/googleplay|stripe\.com\/mx|www\.mercadopago\.com\.mx|developer\.mozilla\.org|www\.diputados\.gob\.mx|vorka\.mx\/legal\/creadores)\//;

const X = ARTICULOS_APPS, T = TEMA_APPS, RUTAS = X.map(T.rutaDe), TODAS = [T.ruta, ...RUTAS];
const finalDe = main => (main.match(/<aside class="lr-final"[\s\S]*?<\/aside>/g) || []);

describe('Vorka Learn › Crea tu app', () => {
  it('7 artículos con URL única en /learn/apps/ y la sección en el catálogo como «tema»', () => {
    expect(X).toHaveLength(7);
    expect(T.ruta).toBe('/learn/apps/');
    expect(new Set(RUTAS).size).toBe(7);
    for (const r of RUTAS) expect(r).toMatch(/^\/learn\/apps\/[a-z0-9-]+\/$/);
    for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(X.map(x => x[k])).size).toBe(7);
    const s = secciones().find(y => y.clave === 'apps');
    expect(s.grupo).toBe('tema');
    expect(s.n).toBe(7);
  });

  it('cada artículo: 200, title ≤ 60, description 70–155, canonical, OG de artículo, un solo H1 y menú marcado', async () => {
    for (const x of X) {
      const ruta = T.rutaDe(x), r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const html = await r.text();
      const titulo = meta(html, /<title>([^<]*)<\/title>/), desc = meta(html, /<meta name="description" content="([^"]*)">/);
      expect(titulo).toBe(T.titulo(x));
      expect(titulo.length, titulo).toBeLessThanOrEqual(60);
      expect(desc).toBe(x.descripcion);
      expect(desc.length, ruta).toBeLessThanOrEqual(155);
      expect(desc.length, ruta).toBeGreaterThan(70);
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${ruta}">`);
      expect(html).toContain('<meta property="og:type" content="article">');
      expect(html).toContain(`<meta property="og:image" content="https://vorka.mx/assets/learn/og/apps-${x.slug}.png">`);
      expect(html).not.toContain('noindex');
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(html).toContain('<body class="lr-s-apps">');
      expect(cabecera(html)).toContain(`href="${T.ruta}" aria-current="page">${APPS.corto}</a>`);
      expect((await pedir(ruta, 'HEAD')).status).toBe(200);
    }
  });

  it('JSON-LD: Article, BreadcrumbList Learn › Crea tu app › artículo y FAQPage con las preguntas visibles', async () => {
    for (const x of X) {
      const ruta = T.rutaDe(x), html = await (await pedir(ruta)).text(), ld = jsonLd(html);
      expect(ld.map(d => d['@type'])).toEqual(['Article', 'BreadcrumbList', 'FAQPage']);
      expect(ld[0]).toMatchObject({ '@context': 'https://schema.org', headline: x.h1, description: x.descripcion, inLanguage: 'es-MX', articleSection: APPS.nombre,
        datePublished: '2026-11-01', dateModified: '2026-11-01' });
      expect(ld[0].author).toMatchObject({ name: 'Vorka Learn', parentOrganization: { name: 'Vorka México' } });
      expect(ld[0].citation).toEqual(x.fuentes.map(f => f.url));
      expect(ld[0].image).toEqual([`https://vorka.mx/assets/learn/og/apps-${x.slug}.png`]);
      expect(ld[1].itemListElement.map(m => m.item)).toEqual(['https://vorka.mx/learn/', 'https://vorka.mx/learn/apps/', `https://vorka.mx${ruta}`]);
      expect(ld[2].mainEntity).toHaveLength(x.faq.length);
      for (const q of ld[2].mainEntity) expect(q).toMatchObject({ '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } });
      for (const f of x.faq) expect(desescapar(html)).toContain(`<summary>${f.p}</summary><div>${f.r}</div>`);
    }
  });

  it('fuentes oficiales con enlace (al menos 3), «Actualizado: noviembre de 2026» y el aviso de no asesoría después de las fuentes', async () => {
    for (const x of X) {
      const html = desescapar(await (await pedir(T.rutaDe(x))).text());
      expect(x.fuentes.length, x.slug).toBeGreaterThanOrEqual(3);
      expect(html).toContain('id="fuentes">Fuentes</h2>');
      for (const f of x.fuentes) { expect(f.url, f.nombre).toMatch(OFICIALES); expect(html).toContain(`href="${f.url}"`); }
      expect(html).toMatch(/Actualizado: <time datetime="2026-11-01">noviembre de 2026<\/time>/);
      expect(html).toContain('Actualizado: noviembre de 2026.');
      const art = principal(html).split('<article')[1].split('</article>')[0];
      expect(art.indexOf(AVISO_APPS)).toBeGreaterThan(art.indexOf('id="fuentes"'));
    }
  });

  it('un solo llamado final, después de las fuentes, al programa para creadores, con lo que la tienda hace hoy', async () => {
    for (const x of X) {
      const main = principal(await (await pedir(T.rutaDe(x))).text());
      const finales = finalDe(main);
      expect(finales, x.slug).toHaveLength(1);
      expect(finales[0]).toContain('href="/creadores"');
      expect(main.indexOf('class="lr-final"')).toBeGreaterThan(main.indexOf('id="fuentes"'));
      // Lo que dice el programa hoy (src/creadores.js, legal/creadores/) y lo que no hace
      for (const re of [/vorka\.mx\/tienda/, /80 %/, /7 días/, /se revisa/, /cada mes o cada año/, /al menos 20 % de cada cobro/]) expect(finales[0], `${x.slug} ${re}`).toMatch(re);
      expect(finales[0]).not.toMatch(/\$\s?\d|garantiza|miles de|visitas al mes/i);
    }
    expect((await pedir('/creadores')).status).toBe(200);
  });

  it('la tienda de Vorka solo aparece en el cuerpo de «dónde vender», en su bloque marcado y fiel a los términos', async () => {
    for (const x of X) {
      const main = principal(await (await pedir(T.rutaDe(x))).text());
      const art = main.split('<article')[1].split('<aside class="lr-final"')[0];
      expect(art, x.slug).not.toMatch(/\/tienda\/|carrito|MXN<\/span>|t-precio|Gana puntos/i);
      // Fuera del bloque, de su título y de su pregunta frecuente (TIENDA_VORKA_FAQ), no se menciona la tienda
      const faq = `<summary>${TIENDA_VORKA_FAQ.p}</summary><div>${TIENDA_VORKA_FAQ.r}</div>`;
      const sinBloque = desescapar(art.replace(TIENDA_VORKA, '')).replace(faq, '').replace('<h2 id="s5">La tienda de Vorka México</h2>', '');
      expect(sinBloque, x.slug).not.toMatch(/tienda de Vorka|vorka\.mx\/tienda|hola@vorka/i);
      if (x.slug === S.vender) { expect(art).toContain('id="tienda-vorka"'); expect(desescapar(art)).toContain(faq); }
      else expect(art).not.toContain('id="tienda-vorka"');
    }
    // Lo que dice el bloque sale de los términos para creadores (legal/creadores/) y de src/creadores.js
    for (const re of [/quien publica esta guía/, /mínimo de \$20 MXN/, /80 %/, /20 %, salvo acuerdo distinto/, /7 días después de cada venta/, /tarjeta, OXXO o SPEI/,
      /revisa cada producto/, /por suscripción/, /al menos 20 % de cada cobro/, /creadores\/docs/]) expect(TIENDA_VORKA).toMatch(re);
    expect(TIENDA_VORKA).not.toMatch(/\d[\d,.]*\s*(visitas|visitantes|usuarios)/i);
  });

  it('ejemplos marcados como propios y sin «agencia»', () => {
    for (const x of X) {
      const t = T.textoDe(x) + x.secciones.map(y => y.h2).join(' ') + x.h1 + x.descripcion + x.titulo;
      expect(t, x.slug).not.toMatch(/agencia/i);
      for (const y of x.secciones) {
        const ej = (y.html.match(/class="gu-ej"/g) || []).length;
        expect((y.html.match(/Ejemplo propio de Vorka Learn, con cifras inventadas/g) || []).length, y.h2).toBe(ej);
      }
    }
  });

  it('«Sigue leyendo» con tres guías de la sección y botones para compartir', async () => {
    for (const x of X) {
      const ruta = T.rutaDe(x), html = await (await pedir(ruta)).text();
      const sigue = html.split('class="lr-sigue"')[1].split('</section>')[0];
      const enlaces = [...sigue.matchAll(/href="(\/learn\/apps\/[a-z0-9-]+\/)"/g)].map(m => m[1]);
      expect(new Set(enlaces).size, ruta).toBe(3);
      for (const s of x.relacionadas) expect(sigue, `${ruta} → ${s}`).toContain(`href="/learn/apps/${s}/"`);
      expect(enlaces).not.toContain(ruta);
      expect(html).toContain(encodeURIComponent(`https://vorka.mx${ruta}?utm_source=whatsapp&utm_medium=compartir&utm_campaign=learn`));
    }
  });

  it('todos los enlaces internos existen (sin redirecciones) y las anclas apuntan a algo', async () => {
    const vistos = new Map();
    for (const ruta of TODAS) {
      const html = await (await pedir(ruta)).text();
      for (const [, l] of html.matchAll(/href="(\/(?:learn|tienda|creadores|simulador-)[^"#?]*)(?:[#?][^"]*)?"/g)) {
        if (/^\/tienda\/estilos\.css/.test(l)) continue;
        if (!vistos.has(l)) vistos.set(l, (await pedir(l)).status);
        expect(vistos.get(l), `${ruta} → ${l}`).toBe(200);
      }
      for (const [, id] of principal(html).matchAll(/href="#([a-z0-9-]+)"/g)) expect(html, `${ruta} #${id}`).toContain(`id="${id}"`);
    }
  });

  it('índice, portada, menú, búsqueda, RSS y sitemap incluyen la sección', async () => {
    const r = await pedir(T.ruta);
    expect(r.status).toBe(200);
    const ind = await r.text();
    expect(ind).toContain('<link rel="canonical" href="https://vorka.mx/learn/apps/">');
    expect(meta(ind, /<title>([^<]*)<\/title>/)).toBe(T.tituloIndice());
    expect(T.tituloIndice().length).toBeLessThanOrEqual(60);
    expect(APPS.indice.descripcion.length).toBeLessThanOrEqual(155);
    expect(ind.match(/<h1[\s>]/g) || []).toHaveLength(1);
    expect(jsonLd(ind).map(d => d['@type'])).toEqual(['CollectionPage', 'BreadcrumbList']);
    expect(ind).toContain('<meta property="og:image" content="https://vorka.mx/assets/learn/og/apps.png">');
    for (const x of RUTAS) expect(ind).toContain(`href="${x}"`);
    const portada = await (await pedir('/learn/')).text();
    expect(portada).toContain(`>${APPS.nombre}</h2>`);
    for (const x of RUTAS) expect(portada).toContain(`href="${x}"`);
    expect(cabecera(portada)).toContain(`href="${T.ruta}">${APPS.corto}</a>`);
    expect(portada).toContain('<a class="lr-m-sec lr-s-apps" href="/learn/apps/">');
    expect(await (await pedir('/learn/acerca/')).text()).toContain(APPS.nombre);
    for (const x of X) expect(buscarGuias(x.h1).map(a => a.ruta), x.slug).toContain(T.rutaDe(x));
    expect(buscarGuias('saas')[0].clave).toBe('apps');
    expect(buscarGuias('google play').map(a => a.ruta)).toContain(`/learn/apps/${S.tiendas}/`);
    const busq = await (await pedir('/learn/buscar/?q=mrr%20churn')).text();
    expect(busq).toContain(`href="/learn/apps/${S.clientes}/"`);
    const rss = await (await pedir('/learn/feed.xml')).text();
    for (const x of RUTAS) expect(rss).toContain(`<guid isPermaLink="true">https://vorka.mx${x}</guid>`);
    const mapa = await (await pedir('/learn/sitemap.xml')).text();
    for (const x of TODAS) expect(mapa).toContain(`<loc>https://vorka.mx${x}</loc>`);
    const svg = await (await pedir(`/learn/arte/apps/${X[0].slug}.svg`)).text();
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/<script|href="http/);
  });

  it('sin barra final redirige; lo que no existe no se inventa; solo GET y HEAD', async () => {
    const r = await pedir(RUTAS[0].slice(0, -1));
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe(`https://vorka.mx${RUTAS[0]}`);
    expect((await pedir('/learn/apps')).headers.get('location')).toBe('https://vorka.mx/learn/apps/');
    expect((await pedir('/learn/apps/no-existe/')).status).not.toBe(200);
    expect((await pedir(`/learn/negocio/${X[0].slug}/`)).status).not.toBe(200);
    expect((await pedir(RUTAS[0], 'POST')).status).not.toBe(200);
  });

  it('anuncios apagados por defecto; encendidos, los mismos espacios que las guías', async () => {
    for (const ruta of TODAS) {
      const r = await pedir(ruta), html = await r.text();
      expect(html, ruta).not.toMatch(/adsbygoogle|lr-anuncio"|data-ad-slot|Publicidad/);
      expect(html, ruta).not.toMatch(DOMINIOS_GOOGLE);
      expect(r.headers.get('content-security-policy'), ruta).not.toMatch(DOMINIOS_GOOGLE);
    }
    const e = { ...env, ...AD_ENV };
    for (const ruta of RUTAS) {
      const html = await (await pedir(ruta, 'GET', e)).text();
      for (const lugar of ['intro', 'mitad', 'final']) expect(html, `${ruta} ${lugar}`).toContain(`data-lugar="${lugar}"`);
      expect(html.indexOf('data-lugar="final"')).toBeLessThan(html.indexOf('class="lr-final"'));
    }
  });
});

describe('Vorka Learn › Crea tu app: los datos verificados y la aritmética de los ejemplos', () => {
  const t = X.map(x => x.secciones.map(y => y.html).join(' ')).join(' ');
  it('cuotas y comisiones tal como las publican las fuentes (noviembre de 2026)', () => {
    for (const s of ['99 dólares por año', 'Tarifa única de registro de 25 dólares', '3.6 % + $3.00 MXN', '4 % + $3.00 MXN', '$7.00 MXN por transacción + IVA', '0.7 % del volumen',
      '3.49 % + $4.00', '3.19 % + $4.00 / 2.95 % + $4.00', 'al menos <b>12 verificadores</b>', '<b>de forma continua durante al menos 14 días</b>', '13 de noviembre de 2023',
      '<b>3.5 millones de pesos</b>', '<b>1 % a 2.5 %</b>', '<b>tasa del 16 %</b>', 'Secretaría Anticorrupción y Buen Gobierno', 'cinco días naturales']) expect(t, s).toContain(s);
    // Conekta: sin tarifas (no se pudieron verificar en su página oficial)
    expect(t).toMatch(/Conekta[^.]*\. No pudimos consultar sus tarifas/);
    expect(t).not.toMatch(/Conekta[^<]*\d+(\.\d+)?\s?%/);
  });
  it('validación, suscripción con Stripe y métricas', () => {
    // Lista de espera: 30 ÷ 200 = 15 %; 6 ÷ 30 = 20 %; 6 × $100 = $600
    expect(30 / 200).toBe(0.15); expect(6 / 30).toBe(0.2); expect(6 * 100).toBe(600);
    for (const s of ['30 ÷ 200 = <b>15 %</b>', '6 ÷ 30 = <b>20 %</b>', '6 × $100 = <b>$600</b>']) expect(t).toContain(s);
    // Stripe: 3.6 % de $199 = 7.16 + 3 = 10.16; Billing 0.7 % = 1.39; total 11.55 (5.8 %); quedan 187.45
    expect((199 * 0.036).toFixed(2)).toBe('7.16'); expect((199 * 0.007).toFixed(2)).toBe('1.39');
    expect((10.16 + 1.39).toFixed(2)).toBe('11.55'); expect((11.55 / 199 * 100).toFixed(1)).toBe('5.8'); expect((199 - 11.55).toFixed(2)).toBe('187.45');
    expect((29 * 0.036).toFixed(2)).toBe('1.04'); expect(Math.round(4.04 / 29 * 100)).toBe(14);
    for (const s of ['3.6 % de $199 = $7.16, más $3.00 = <b>$10.16</b>', '0.7 % de $199 = <b>$1.39</b>', '$10.16 + $1.39 = <b>$11.55</b>, alrededor del 5.8 %', '$199 − $11.55 = <b>$187.45</b>', '3.6 % de $29 = $1.04, más $3.00 = $4.04, casi el 14 %']) expect(t).toContain(s);
    // Métricas: 40 − 2 + 5 = 43; 43 × 300 = 12,900; churn 5 %; CAC 300; LTV 4,800; LTV ÷ CAC = 16
    expect(40 - 2 + 5).toBe(43); expect(43 * 300).toBe(12900); expect(2 / 40).toBe(0.05); expect(1500 / 5).toBe(300); expect(240 / 0.05).toBeCloseTo(4800); expect(4800 / 300).toBe(16);
    for (const s of ['40 − 2 + 5 = 43; MRR: 43 × $300 = <b>$12,900</b>', '2 ÷ 40 = <b>5 %</b>', '$1,500 ÷ 5 = <b>$300</b>', '$240 ÷ 5 % = <b>$4,800</b>', '$4,800 ÷ $300 = <b>16</b>']) expect(t).toContain(s);
  });
});
