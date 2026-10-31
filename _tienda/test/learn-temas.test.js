// Vorka Learn › secciones de tema hechas con src/learn/tema.js: «Negocio pequeño» (/learn/negocio/) y «Elegir tu camino»
// (/learn/camino/). Mismas verificaciones que Finanzas personales (test/learn-finanzas.test.js): SEO, JSON-LD, fuentes
// oficiales, «Actualizado», un solo llamado final al producto correcto, ejemplos marcados, compartir, «Sigue leyendo»,
// enlaces internos, índice, portada, sitemap y anuncios apagados.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { NEGOCIO, ARTICULOS_NEGOCIO, TEMA_NEGOCIO, AVISO_NEGOCIO } from '../src/learn-negocio.js';
import { CAMINO, ARTICULOS_CAMINO, TEMA_CAMINO } from '../src/learn-camino.js';
import { secciones } from '../src/learn/datos.js';
import { buscarGuias } from '../src/learn/extra.js';

let env;
const pedir = (ruta, metodo = 'GET', e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), e);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

const desescapar = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => desescapar((html.match(re) || [])[1] || '');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
const cabecera = html => html.split('<header')[1].split('</header>')[0];
function quitarEjemplos(html) {
  let s = html, i;
  while ((i = s.indexOf('<div class="gu-ej">')) >= 0) {
    let n = 0, j = i;
    const re = /<\/?div\b[^>]*>/g;
    re.lastIndex = i;
    for (let m; (m = re.exec(s));) { n += m[0][1] === '/' ? -1 : 1; if (!n) { j = re.lastIndex; break; } }
    s = s.slice(0, i) + s.slice(j);
  }
  return s;
}
const DOMINIOS_GOOGLE = /googlesyndication|doubleclick|adtrafficquality|adservice\.google|googletagservices|fundingchoices/;
const AD_ENV = { ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_SLOTS: 'intro:1111111111,mitad:2222222222,final:3333333333,indice:4444444444' };

const TEMAS = [
  { S: NEGOCIO, X: ARTICULOS_NEGOCIO, T: TEMA_NEGOCIO, n: 4,
    // Fuentes oficiales: INEGI, leyes en diputados.gob.mx y PROFECO en gob.mx
    oficiales: /^https:\/\/(www\.inegi\.org\.mx|www\.diputados\.gob\.mx|www\.gob\.mx\/profeco)\//,
    llamado: { 'como-hacer-que-tus-clientes-regresen': '/tienda/vuelve/', 'como-dejar-de-perder-citas': '/tienda/agenda/',
      'como-vender-por-catalogo': '/tienda/vende/', 'como-organizar-un-evento-y-cobrar-entradas': '/tienda/cupo/' },
    // Lo que cada llamado debe decir (y no prometer), leído de la ficha de cada app
    dice: { '/tienda/vuelve/': [/Apple Wallet/, /No manda WhatsApp/], '/tienda/agenda/': [/todavía no manda WhatsApp automáticos/, /lo mandas tú/],
      '/tienda/vende/': [/no mueve dinero, no presta y no cobra por ti/, /gratis con hasta 10 clientas/i], '/tienda/cupo/': [/no cobra comisión/, /te paga directo a ti/, /gratis hasta 30 personas/i] },
    aviso: AVISO_NEGOCIO, sinPesos: true },
  { S: CAMINO, X: ARTICULOS_CAMINO, T: TEMA_CAMINO, n: 3,
    oficiales: /^https:\/\/(www\.gob\.mx\/(becasbenitojuarez|sep)|comparacarreras\.imco\.org\.mx|repositorio\.dgae\.unam\.mx|oferta\.unam\.mx|admision\.uam\.mx|uacm\.edu\.mx)\//,
    // Sin Test vocacional en main todavía: «elegir carrera» apunta a Practica (TODO en src/learn-camino.js)
    llamado: { 'becas-para-prepa-y-universidad': '/learn/camino/como-elegir-carrera/', 'como-elegir-carrera': '/learn/#practica', 'que-hacer-si-no-te-quedaste-en-la-unam': '/simulador-unam/' },
    dice: { '/simulador-unam/': [/simulador de práctica/, /estimación/] }, aviso: null, sinPesos: false },
];

for (const { S, X, T, n, oficiales, llamado, dice, aviso, sinPesos } of TEMAS) {
  const RUTAS = X.map(T.rutaDe), TODAS = [T.ruta, ...RUTAS];

  describe(`Vorka Learn › ${S.nombre}`, () => {
    it(`${n} artículos con URL única en /learn/${S.clave}/ y la sección en el catálogo como «tema»`, () => {
      expect(X).toHaveLength(n);
      expect(T.ruta).toBe(`/learn/${S.clave}/`);
      expect(new Set(RUTAS).size).toBe(n);
      for (const r of RUTAS) expect(r).toMatch(new RegExp(`^/learn/${S.clave}/[a-z0-9-]+/$`));
      for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(X.map(x => x[k])).size).toBe(n);
      const s = secciones().find(y => y.clave === S.clave);
      expect(s.grupo).toBe('tema');
      expect(s.n).toBe(n);
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
        expect(html).not.toContain('noindex');
        expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
        expect(html).toContain(`<body class="lr-s-${S.clave}">`);
        expect(cabecera(html)).toContain(`href="${T.ruta}" aria-current="page">${S.corto}</a>`);
        expect((await pedir(ruta, 'HEAD')).status).toBe(200);
      }
    });

    it('JSON-LD: Article, BreadcrumbList Learn › sección › artículo y FAQPage con las preguntas visibles', async () => {
      for (const x of X) {
        const ruta = T.rutaDe(x), html = await (await pedir(ruta)).text(), ld = jsonLd(html);
        expect(ld.map(d => d['@type'])).toEqual(['Article', 'BreadcrumbList', 'FAQPage']);
        expect(ld[0].headline).toBe(x.h1);
        expect(ld[0].author).toMatchObject({ name: 'Vorka Learn', parentOrganization: { name: 'Vorka México' } });
        expect(ld[0].citation).toEqual(x.fuentes.map(f => f.url));
        expect(ld[0].articleSection).toBe(S.nombre);
        expect(ld[1].itemListElement.map(m => m.item)).toEqual(['https://vorka.mx/learn/', `https://vorka.mx${T.ruta}`, `https://vorka.mx${ruta}`]);
        expect(ld[2].mainEntity).toHaveLength(x.faq.length);
        for (const f of x.faq) expect(desescapar(html)).toContain(`<summary>${f.p}</summary><div>${f.r}</div>`);
      }
    });

    it('fuentes oficiales con enlace (al menos 3), «Actualizado: octubre de 2026» y, si aplica, el aviso de no asesoría', async () => {
      for (const x of X) {
        const html = desescapar(await (await pedir(T.rutaDe(x))).text());
        expect(x.fuentes.length, x.slug).toBeGreaterThanOrEqual(3);
        expect(html).toContain('id="fuentes">Fuentes</h2>');
        for (const f of x.fuentes) { expect(f.url, f.nombre).toMatch(oficiales); expect(html).toContain(`href="${f.url}"`); }
        expect(html).toMatch(/Actualizado: <time datetime="2026-10-31">octubre de 2026<\/time>/);
        expect(html).toContain('Actualizado: octubre de 2026.');
        if (aviso) {
          const art = principal(html).split('<article')[1].split('</article>')[0];
          expect(art.indexOf(aviso)).toBeGreaterThan(art.indexOf('id="fuentes"'));
        }
      }
    });

    it('un solo llamado final, después de las fuentes, al producto correcto y descrito con lo que hace', async () => {
      for (const x of X) {
        const main = principal(await (await pedir(T.rutaDe(x))).text());
        const finales = main.match(/<aside class="lr-final"[\s\S]*?<\/aside>/g) || [];
        expect(finales, x.slug).toHaveLength(1);
        expect(finales[0], x.slug).toContain(`href="${llamado[x.slug]}"`);
        expect(main.indexOf('class="lr-final"')).toBeGreaterThan(main.indexOf('id="fuentes"'));
        // Nada de tienda dentro del artículo: el único enlace a /tienda/ es el del llamado
        const art = main.split('<article')[1].split('<aside class="lr-final"')[0];
        expect(art, x.slug).not.toMatch(/\/tienda\/|carrito|MXN|t-precio|Gana puntos/i);
        expect(main.replace(finales[0], ''), x.slug).not.toContain('/tienda/');
        for (const re of dice[llamado[x.slug]] || []) expect(finales[0], `${x.slug} ${re}`).toMatch(re);
        expect(finales[0], x.slug).not.toMatch(/\$\s?\d|garantiza|oficial de la UNAM/i);
      }
      for (const href of new Set(Object.values(llamado))) expect((await pedir(href.split('#')[0])).status, href).toBe(200);
    });

    it('sin «agencia», ejemplos marcados como propios y, en Negocio, cifras en pesos solo dentro de los ejemplos', () => {
      for (const x of X) {
        const t = T.textoDe(x) + x.secciones.map(y => y.h2).join(' ') + x.h1 + x.descripcion + x.titulo;
        expect(t, x.slug).not.toMatch(/agencia/i);
        for (const y of x.secciones) {
          const ej = (y.html.match(/class="gu-ej"/g) || []).length;
          expect((y.html.match(/Ejemplo propio de Vorka Learn, con cifras inventadas/g) || []).length, y.h2).toBe(ej);
          if (sinPesos) expect(quitarEjemplos(y.html), `${x.slug} › ${y.h2}`).not.toMatch(/\$\s?\d/);
        }
      }
    });

    it('«Sigue leyendo» con las otras guías de la sección y botones para compartir', async () => {
      for (const x of X) {
        const ruta = T.rutaDe(x), html = await (await pedir(ruta)).text();
        const sigue = html.split('class="lr-sigue"')[1].split('</section>')[0];
        for (const y of RUTAS.filter(r => r !== ruta)) expect(sigue, `${ruta} → ${y}`).toContain(`href="${y}"`);
        expect(html).toContain(encodeURIComponent(`https://vorka.mx${ruta}?utm_source=whatsapp&utm_medium=compartir&utm_campaign=learn`));
        expect(html).toContain(`facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://vorka.mx${ruta}?utm_source=facebook`)}`);
      }
    });

    it('todos los enlaces internos existen (sin redirecciones) y las anclas apuntan a algo', async () => {
      const vistos = new Map();
      for (const ruta of TODAS) {
        const html = await (await pedir(ruta)).text();
        for (const [, l] of html.matchAll(/href="(\/(?:learn|tienda|simulador-)[^"#?]*)(?:[#?][^"]*)?"/g)) {
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
      expect(ind).toContain(`<link rel="canonical" href="https://vorka.mx${T.ruta}">`);
      expect(meta(ind, /<title>([^<]*)<\/title>/)).toBe(T.tituloIndice());
      expect(T.tituloIndice().length).toBeLessThanOrEqual(60);
      expect(S.indice.descripcion.length).toBeLessThanOrEqual(155);
      expect(ind.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(jsonLd(ind).map(d => d['@type'])).toEqual(['CollectionPage', 'BreadcrumbList']);
      expect(ind).toContain(`<meta property="og:image" content="https://vorka.mx/assets/learn/og/${S.clave}.png">`);
      for (const x of RUTAS) expect(ind).toContain(`href="${x}"`);
      expect(principal(ind)).not.toMatch(/\/tienda\//);
      const portada = await (await pedir('/learn/')).text();
      expect(portada).toContain(`>${S.nombre}</h2>`);
      for (const x of RUTAS) expect(portada).toContain(`href="${x}"`);
      expect(cabecera(portada)).toContain(`href="${T.ruta}">${S.corto}</a>`);
      expect(await (await pedir('/learn/acerca/')).text()).toContain(S.nombre);
      for (const x of X) expect(buscarGuias(x.h1).map(a => a.ruta), x.slug).toContain(T.rutaDe(x));
      const rss = await (await pedir('/learn/feed.xml')).text();
      for (const x of RUTAS) expect(rss).toContain(`<guid isPermaLink="true">https://vorka.mx${x}</guid>`);
      const mapa = await (await pedir('/learn/sitemap.xml')).text();
      for (const x of TODAS) expect(mapa).toContain(`<loc>https://vorka.mx${x}</loc>`);
      expect(await (await pedir(`/learn/arte/${S.clave}/${X[0].slug}.svg`)).text()).toContain('<svg');
    });

    it('sin barra final redirige; lo que no existe no se inventa; solo GET y HEAD', async () => {
      const r = await pedir(RUTAS[0].slice(0, -1));
      expect(r.status).toBe(301);
      expect(r.headers.get('location')).toBe(`https://vorka.mx${RUTAS[0]}`);
      expect((await pedir(T.ruta.slice(0, -1))).headers.get('location')).toBe(`https://vorka.mx${T.ruta}`);
      expect((await pedir(`${T.ruta}no-existe/`)).status).not.toBe(200);
      expect((await pedir(`/learn/paa/${X[0].slug}/`)).status).not.toBe(200);
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
}

describe('Vorka Learn › Negocio pequeño: la aritmética de los ejemplos cuadra', () => {
  it('sellos, citas perdidas, ganancia real, comisiones y punto de equilibrio', () => {
    const t = ARTICULOS_NEGOCIO.map(x => x.secciones.map(y => y.html).join(' ')).join(' ');
    // Tarjeta de sellos: 9 × $40 = $360; el premio cuesta $12 → 3.3 %
    expect(9 * 40).toBe(360); expect((12 / 360 * 100).toFixed(1)).toBe('3.3');
    expect(t).toContain('9 × $40 = <b>$360</b>'); expect(t).toContain('<b>3.3 %</b>');
    // Citas: 3 × $250 = $750 por semana; 4 semanas = $3,000
    expect(3 * 250).toBe(750); expect(4 * 750).toBe(3000);
    expect(t).toContain('3 × $250 = <b>$750</b>'); expect(t).toContain('4 × $750 = <b>$3,000</b>');
    // Catálogo: $1,200 con 30 % de descuento = $840; 360 − 60 − 30 = 270
    expect(1200 * 0.7).toBeCloseTo(840); expect(1200 - 840 - 60 - 30).toBe(270);
    expect(t).toContain('$1,200 × 70 % = <b>$840</b>'); expect(t).toContain('$360 − $60 − $30 = <b>$270</b>');
    // Comisión 20 %: sobre $5,000 = $1,000; sobre $4,000 = $800
    expect(5000 * 0.2).toBe(1000); expect(4000 * 0.2).toBe(800);
    expect(t).toContain('20 % de $5,000 = <b>$1,000</b>'); expect(t).toContain('20 % de $4,000 = <b>$800</b>');
    // Evento: $3,600 ÷ $150 = 24 entradas; 40 × $150 = $6,000; ganancia $2,400
    expect(3600 / 150).toBe(24); expect(40 * 150).toBe(6000); expect(6000 - 3600).toBe(2400);
    expect(t).toContain('$3,600 ÷ $150 = <b>24 entradas</b>'); expect(t).toContain('$6,000 − $3,600 = <b>$2,400</b>');
  });
});
