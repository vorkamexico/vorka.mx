import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { ARTICULOS_FINANZAS, FINANZAS, RUTA_FINANZAS, AVISO_FINANZAS, rutaArticuloFinanzas, tituloArticuloFinanzas, tituloIndiceFinanzas, llamadoDe, textoDeArticulo } from '../src/learn-finanzas.js';
import { GUIAS, rutaGuia } from '../src/simulador/guias.js';
import { articulos } from '../src/learn/datos.js';

let env;
const pedir = (ruta, metodo = 'GET', e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), e);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

const desescapar = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => desescapar((html.match(re) || [])[1] || '');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
const cabecera = html => html.split('<header')[1].split('</header>')[0];
// Quita los bloques de ejemplo (<div class="gu-ej">…</div>, que pueden traer divs dentro)
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
const RUTAS = ARTICULOS_FINANZAS.map(rutaArticuloFinanzas);
const TODAS = [RUTA_FINANZAS, ...RUTAS];
const DOMINIOS_GOOGLE = /googlesyndication|doubleclick|adtrafficquality|adservice\.google|googletagservices|fundingchoices/;
const AD_ENV = { ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_SLOTS: 'intro:1111111111,mitad:2222222222,final:3333333333,indice:4444444444' };
// Fuentes oficiales permitidas en esta sección (tema de dinero: solo autoridades y leyes)
const OFICIALES = /^https:\/\/(comparador\.banxico\.org\.mx|www\.banxico\.org\.mx|www\.diputados\.gob\.mx|revista\.condusef\.gob\.mx|www\.gob\.mx\/condusef|dof\.gob\.mx)\//;

describe('Vorka Learn › Finanzas personales', () => {
  it('cuatro artículos con URL única en /learn/finanzas/', () => {
    expect(ARTICULOS_FINANZAS).toHaveLength(4);
    expect(new Set(RUTAS).size).toBe(4);
    for (const r of RUTAS) expect(r).toMatch(/^\/learn\/finanzas\/[a-z0-9-]+\/$/);
    for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(ARTICULOS_FINANZAS.map(x => x[k])).size).toBe(4);
  });

  it('cada artículo responde 200 con title ≤ 60, description ≤ 155, canonical, OG de artículo y un solo H1', async () => {
    for (const x of ARTICULOS_FINANZAS) {
      const ruta = rutaArticuloFinanzas(x);
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const html = await r.text();
      const titulo = meta(html, /<title>([^<]*)<\/title>/), desc = meta(html, /<meta name="description" content="([^"]*)">/);
      expect(titulo).toBe(tituloArticuloFinanzas(x));
      expect(titulo.length, titulo).toBeLessThanOrEqual(60);
      expect(desc).toBe(x.descripcion);
      expect(desc.length, ruta).toBeLessThanOrEqual(155);
      expect(desc.length, ruta).toBeGreaterThan(70);
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${ruta}">`);
      expect(html).toContain('<meta property="og:type" content="article">');
      expect(html).not.toContain('noindex');
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(html).toContain(`<h1 class="lr-h1">${x.h1}</h1>`);
      expect(cabecera(html)).toContain('href="/learn/finanzas/" aria-current="page">Finanzas</a>');
      expect((await pedir(ruta, 'HEAD')).status).toBe(200);
    }
  });

  it('JSON-LD: Article de Vorka Learn, BreadcrumbList Learn › Finanzas personales › artículo y FAQPage solo con preguntas visibles', async () => {
    for (const x of ARTICULOS_FINANZAS) {
      const ruta = rutaArticuloFinanzas(x), html = await (await pedir(ruta)).text(), ld = jsonLd(html);
      expect(ld.map(d => d['@type'])).toEqual(['Article', 'BreadcrumbList', 'FAQPage']);
      const art = ld[0];
      expect(art.headline).toBe(x.h1);
      expect(art.author).toMatchObject({ name: 'Vorka Learn', parentOrganization: { name: 'Vorka México' } });
      expect(art.mainEntityOfPage['@id']).toBe(`https://vorka.mx${ruta}`);
      expect(art.citation).toEqual(x.fuentes.map(f => f.url));
      expect(ld[1].itemListElement.map(m => m.item)).toEqual(['https://vorka.mx/learn/', `https://vorka.mx${RUTA_FINANZAS}`, `https://vorka.mx${ruta}`]);
      expect(ld[2].mainEntity).toHaveLength(x.faq.length);
      for (const f of x.faq) expect(desescapar(html)).toContain(`<summary>${f.p}</summary><div>${f.r}</div>`);
      const migas = html.match(/<nav class="lr-migas"[\s\S]*?<\/nav>/)[0];
      expect(migas).toContain(`<a href="${RUTA_FINANZAS}">${FINANZAS.nombre}</a>`);
    }
  });

  it('fuentes oficiales con enlace, «Actualizado» y el aviso de que no es asesoría financiera', async () => {
    for (const x of ARTICULOS_FINANZAS) {
      const html = desescapar(await (await pedir(rutaArticuloFinanzas(x))).text());
      expect(x.fuentes.length).toBeGreaterThanOrEqual(3);
      expect(html).toContain('id="fuentes">Fuentes</h2>');
      for (const f of x.fuentes) { expect(f.url, f.nombre).toMatch(OFICIALES); expect(html).toContain(`href="${f.url}"`); }
      expect(html).toMatch(/Actualizado: <time datetime="\d{4}-\d{2}-\d{2}">octubre de 2026<\/time>/);
      expect(html).toContain('Actualizado: octubre de 2026.');
      const art = principal(html).split('<article')[1].split('</article>')[0];
      expect(art).toContain(AVISO_FINANZAS);
      expect(AVISO_FINANZAS).toBe('Información general con fines educativos; no es asesoría financiera personalizada.');
      expect(art.indexOf(AVISO_FINANZAS)).toBeGreaterThan(art.indexOf('id="fuentes"'));
    }
  });

  it('un solo llamado final, después de las fuentes; Cuentas solo donde encaja y descrito con lo que hace', async () => {
    const esperado = { 'como-funciona-una-tarjeta-de-credito': '/learn/finanzas/como-salir-de-deudas/', 'como-prestar-dinero-a-un-familiar-o-amigo': '/tienda/cuentas/',
      'como-organizar-una-tanda': '/learn/finanzas/como-prestar-dinero-a-un-familiar-o-amigo/', 'como-salir-de-deudas': '/tienda/cuentas/' };
    for (const x of ARTICULOS_FINANZAS) {
      const main = principal(await (await pedir(rutaArticuloFinanzas(x))).text());
      const finales = main.match(/<aside class="lr-final"[\s\S]*?<\/aside>/g) || [];
      expect(finales, x.slug).toHaveLength(1);
      expect(finales[0]).toContain(`href="${esperado[x.slug]}"`);
      expect(main.indexOf('class="lr-final"')).toBeGreaterThan(main.indexOf('id="fuentes"'));
      // Nada de tienda dentro del artículo: el único enlace a /tienda/ es el del llamado
      const art = main.split('<article')[1].split('<aside class="lr-final"')[0];
      expect(art, x.slug).not.toMatch(/\/tienda\/|carrito|MXN|t-precio|Gana puntos/i);
      expect(main.replace(finales[0], ''), x.slug).not.toContain('/tienda/');
      if (esperado[x.slug] === '/tienda/cuentas/') {
        // Lo que dice de Cuentas: registro, sin mover dinero ni prestar (src/cuentas.js)
        expect(finales[0]).toMatch(/no presta/i);
        expect(finales[0]).not.toMatch(/\$\s?\d|garantiza|cobra por ti|recupera/i);
      }
    }
    expect((await pedir('/tienda/cuentas/')).status).toBe(200);
    expect(llamadoDe(ARTICULOS_FINANZAS[0])).toContain('lr-final');
  });

  it('sin nombres de bancos ni tarjetas de terceros, y sin «agencia»', () => {
    const BANCOS = /\b(BBVA|Banorte|Santander|Banamex|Citibanamex|HSBC|Scotiabank|Inbursa|Banco Azteca|Banjercito|Nu\b|Nubank|Stori|Hey Banco|Mercado Pago|Klar|Didi|Rappi|Invex|Afirme|BanCoppel|Coppel|Liverpool)\b/;
    for (const x of ARTICULOS_FINANZAS) {
      const t = textoDeArticulo(x) + x.secciones.map(y => y.h2).join(' ') + x.h1 + x.descripcion;
      expect(t, x.slug).not.toMatch(BANCOS);
      expect(t, x.slug).not.toMatch(/agencia/i);
    }
  });

  it('los ejemplos numéricos están marcados como propios y las cifras en pesos solo aparecen dentro de ellos', () => {
    for (const x of ARTICULOS_FINANZAS) for (const y of x.secciones) {
      const ej = (y.html.match(/class="gu-ej"/g) || []).length;
      expect((y.html.match(/Ejemplo propio de Vorka Learn, con cifras inventadas/g) || []).length, y.h2).toBe(ej);
      const fuera = quitarEjemplos(y.html);
      expect(fuera.length).toBeLessThan(y.html.length + (ej ? 0 : 1));
      expect(fuera, `${x.slug} › ${y.h2}`).not.toMatch(/\$\s?\d/);
    }
  });

  it('la aritmética de los ejemplos cuadra', () => {
    const t = ARTICULOS_FINANZAS.map(x => x.secciones.map(y => y.html).join(' ')).join(' ');
    // Pago mínimo (regla 4.1 de Banxico): mayor entre 1.5 % del saldo + intereses + IVA y 1.25 % del límite
    const interes = 10000 * 0.60 / 360 * 30, iva = interes * 0.16;
    expect(Math.round(interes)).toBe(500); expect(Math.round(iva)).toBe(80);
    expect(Math.max(0.015 * 10000 + interes + iva, 0.0125 * 20000)).toBeCloseTo(730);
    expect(t).toContain('= <b>$730</b>'); expect(t).toContain('= <b>$250</b>'); expect(t).toContain('los otros $580 son intereses e IVA');
    // 50 días: del 11 de marzo al 30 de abril
    expect((Date.UTC(2026, 3, 30) - Date.UTC(2026, 2, 11)) / 864e5).toBe(50);
    expect((Date.UTC(2026, 2, 30) - Date.UTC(2026, 2, 9)) / 864e5).toBe(21);
    // Préstamo de $12,000: seis abonos de $2,000; interés simple 12 % anual a 6 meses = $720
    expect(12000 / 6).toBe(2000); expect(12000 * 0.12 * 6 / 12).toBeCloseTo(720);
    expect(t).toContain('<b>$12,720</b>');
    // Tanda: 10 × $500 = $5,000; quien cobra en la semana 2 y deja de pagar deja un hueco de 8 × $500
    expect(10 * 500).toBe(5000); expect((10 - 2) * 500).toBe(4000);
    // Inventario de deudas: intereses de un mes = saldo × tasa ÷ 12
    const meses = [[8000, 0.70, '$466.67'], [3000, 0.45, '$112.50'], [15000, 0.35, '$437.50']];
    for (const [s, r, txt] of meses) { expect((s * r / 12).toFixed(2)).toBe(txt.slice(1).replace(',', '')); expect(t).toContain(txt); }
    expect(meses.reduce((a, [s, r]) => a + Math.round(s * r / 12 * 100) / 100, 0).toFixed(2)).toBe('1016.67');
    expect(t).toContain('$1,016.67');
  });

  it('se enlazan entre sí («Sigue leyendo» con los otros tres) y se pueden compartir por WhatsApp y Facebook', async () => {
    for (const x of ARTICULOS_FINANZAS) {
      const ruta = rutaArticuloFinanzas(x), html = await (await pedir(ruta)).text();
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

  it('índice /learn/finanzas/, portada /learn/ y menú de Learn incluyen la sección', async () => {
    const r = await pedir(RUTA_FINANZAS);
    expect(r.status).toBe(200);
    const ind = await r.text();
    expect(ind).toContain(`<link rel="canonical" href="https://vorka.mx${RUTA_FINANZAS}">`);
    expect(meta(ind, /<title>([^<]*)<\/title>/)).toBe(tituloIndiceFinanzas());
    expect(tituloIndiceFinanzas().length).toBeLessThanOrEqual(60);
    expect(FINANZAS.indice.descripcion.length).toBeLessThanOrEqual(155);
    expect(ind.match(/<h1[\s>]/g) || []).toHaveLength(1);
    expect(jsonLd(ind).map(d => d['@type'])).toEqual(['CollectionPage', 'BreadcrumbList']);
    for (const x of RUTAS) expect(ind).toContain(`href="${x}"`);
    expect(principal(ind)).not.toMatch(/\$\s?\d|\/tienda\//);
    const portada = await (await pedir('/learn/')).text();
    expect(portada).toContain(`>${FINANZAS.nombre}</h2>`);
    expect(portada).toContain(`href="${RUTA_FINANZAS}"`);
    for (const x of RUTAS) expect(portada).toContain(`href="${x}"`);
    const lista = jsonLd(portada)[0].mainEntity.itemListElement.map(i => i.url);
    expect(lista).toHaveLength(articulos().length);
    expect(lista.length).toBeGreaterThanOrEqual(GUIAS.length + 4);
    for (const x of RUTAS) expect(lista).toContain(`https://vorka.mx${x}`);
    // El menú de Learn liga a Finanzas en todas las páginas de Learn, también en las guías de exámenes
    expect(cabecera(await (await pedir(rutaGuia(GUIAS[0]))).text())).toContain('href="/learn/finanzas/">Finanzas</a>');
  });

  it('están en el sitemap de Learn (y no en el de la tienda)', async () => {
    const mapa = await (await pedir('/learn/sitemap.xml')).text();
    for (const x of TODAS) expect(mapa).toContain(`<loc>https://vorka.mx${x}</loc>`);
    expect(await (await pedir('/tienda/sitemap.xml')).text()).not.toContain('/learn/finanzas/');
  });

  it('sin barra final redirige; un artículo que no existe no se inventa; solo GET y HEAD', async () => {
    const r = await pedir(RUTAS[0].slice(0, -1));
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe(`https://vorka.mx${RUTAS[0]}`);
    expect((await pedir('/learn/finanzas')).headers.get('location')).toBe('https://vorka.mx/learn/finanzas/');
    expect((await pedir('/learn/finanzas/no-existe/')).status).not.toBe(200);
    expect((await pedir('/learn/paa/como-salir-de-deudas/')).status).not.toBe(200);
    expect((await pedir(RUTAS[0], 'POST')).status).not.toBe(200);
  });
});

describe('Vorka Learn › Finanzas personales: anuncios', () => {
  it('apagados por defecto: sin script, espacios ni dominios de Google en el HTML ni en la CSP', async () => {
    for (const ruta of TODAS) {
      const r = await pedir(ruta);
      const html = await r.text();
      expect(html, ruta).not.toMatch(/adsbygoogle|lr-anuncio"|data-ad-slot|Publicidad/);
      expect(html, ruta).not.toMatch(DOMINIOS_GOOGLE);
      expect(r.headers.get('content-security-policy'), ruta).not.toMatch(DOMINIOS_GOOGLE);
    }
  });

  it('encendidos: los mismos espacios que las guías (intro, mitad y final antes del llamado; uno en el índice)', async () => {
    const e = { ...env, ...AD_ENV };
    for (const ruta of RUTAS) {
      const html = await (await pedir(ruta, 'GET', e)).text();
      for (const lugar of ['intro', 'mitad', 'final']) expect(html, `${ruta} ${lugar}`).toContain(`data-lugar="${lugar}"`);
      expect(html.match(/<ins class="adsbygoogle/g), ruta).toHaveLength(3);
      expect(html.indexOf('data-lugar="final"')).toBeLessThan(html.indexOf('class="lr-final"'));
    }
    const ind = await (await pedir(RUTA_FINANZAS, 'GET', e)).text();
    expect(ind.match(/<ins class="adsbygoogle/g)).toHaveLength(1);
  });
});
