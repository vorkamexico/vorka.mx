import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { GUIAS, SIMS, guiasDe, rutaGuia, rutaIndice, rutaViejaGuia, rutaViejaIndice, textoDeGuia, tituloGuia, LEARN_PORTADA } from '../src/simulador/guias.js';
import { DOMINIOS_ADSENSE, configAnuncios } from '../src/anuncios.js';

let env;
const pedir = (ruta, metodo = 'GET', e = env) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo, redirect: 'manual' }), e);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; env.DB.raw.exec('UPDATE products SET activo = 1'); });

const desescapar = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => desescapar((html.match(re) || [])[1] || '');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
const principal = html => html.split('<main')[1].split('</main>')[0];
const cabecera = html => html.split('<header')[1].split('</header>')[0];
const indices = Object.keys(SIMS).filter(s => guiasDe(s).length).map(rutaIndice);
const LEARN = ['/learn/', ...indices, ...GUIAS.map(rutaGuia)];
// «oficial» aplicado a lo nuestro (simulador, examen de práctica, reactivos): no se permite
const OFICIAL_ENGANOSO = /(simulador|simulacro|examen completo|reactivos?|preguntas?|práctica)\s+oficial/i;
// Ligas al simulador (venta, diagnóstico o reactivo de prueba); las páginas de la PAA por universidad no cuentan
const ligasSim = (html, sim) => [...html.matchAll(new RegExp(`href="/${sim}/(?:diagnostico/|#[a-z-]+)?"`, 'g'))].length;
const DOMINIOS_GOOGLE = /googlesyndication|doubleclick|adtrafficquality|adservice\.google|googletagservices|fundingchoices/;
const AD_ENV = { ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_SLOTS: 'intro:1111111111,mitad:2222222222,final:3333333333,indice:4444444444' };

describe('Vorka Learn: guías de estudio', () => {
  it('hay entre 8 y 12 guías, con URL única y de todos los simuladores', () => {
    expect(GUIAS.length).toBeGreaterThanOrEqual(8);
    expect(GUIAS.length).toBeLessThanOrEqual(12);
    expect(new Set(GUIAS.map(rutaGuia)).size).toBe(GUIAS.length);
    for (const s of Object.keys(SIMS)) expect(guiasDe(s).length).toBeGreaterThan(0);
    for (const x of GUIAS) expect(rutaGuia(x)).toMatch(/^\/learn\/(paa|unam|ecoems|prepa-ug)\/[a-z0-9-]+\/$/);
  });

  it('cada URL vieja /<simulador>/guias/… responde 301 directo a su URL nueva en /learn/ (sin cadenas)', async () => {
    const pares = [...GUIAS.map(x => [rutaViejaGuia(x), rutaGuia(x)]), ...Object.keys(SIMS).map(s => [rutaViejaIndice(s), rutaIndice(s)])];
    for (const [vieja, nueva] of pares) for (const v of [vieja, vieja.slice(0, -1)]) {
      const r = await pedir(v);
      expect(r.status, v).toBe(301);
      expect(r.headers.get('location'), v).toBe(`https://vorka.mx${nueva}`);
      expect((await pedir(nueva)).status, nueva).toBe(200);   // el destino ya es la página final
    }
    // Conserva la query (utm de enlaces compartidos antes del cambio)
    const r = await pedir(`${rutaViejaGuia(GUIAS[0])}?utm_source=whatsapp`);
    expect(r.headers.get('location')).toBe(`https://vorka.mx${rutaGuia(GUIAS[0])}?utm_source=whatsapp`);
    expect((await pedir('/simulador-paa/guias/no-existe/')).status).not.toBe(200);
    expect((await pedir('/simulador-paa/guias/no-existe/')).status).not.toBe(301);
  });

  it('cada guía responde 200 con title ≤ 60, description ≤ 155, canonical, OG de artículo y un solo H1', async () => {
    for (const x of GUIAS) {
      const ruta = rutaGuia(x);
      const r = await pedir(ruta);
      expect(r.status, ruta).toBe(200);
      const html = await r.text();
      const titulo = meta(html, /<title>([^<]*)<\/title>/), desc = meta(html, /<meta name="description" content="([^"]*)">/);
      expect(titulo, ruta).toBe(tituloGuia(x));
      expect(titulo.length, `${ruta}: ${titulo}`).toBeLessThanOrEqual(60);
      expect(titulo, ruta).not.toMatch(/Tienda/);
      expect(desc, ruta).toBe(x.descripcion);
      expect(desc.length, ruta).toBeLessThanOrEqual(155);
      expect(desc.length, ruta).toBeGreaterThan(70);
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${ruta}">`);
      expect(html).toContain(`<meta property="og:url" content="https://vorka.mx${ruta}">`);
      expect(html).toContain('<meta property="og:type" content="article">');
      expect(html).not.toContain('noindex');
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(html).toContain(`<h1 class="lr-h1">${x.h1}</h1>`);
    }
  });

  it('marca Vorka Learn y migas Vorka Learn › Examen › Guía', async () => {
    for (const x of GUIAS) {
      const html = await (await pedir(rutaGuia(x))).text();
      const cab = cabecera(html);
      expect(cab).toContain('<b>Learn</b>');
      expect(cab).not.toContain('Tienda');
      for (const s of indices) expect(cab).toContain(`href="${s}"`);
      const migas = html.match(/<nav class="lr-migas"[\s\S]*?<\/nav>/)[0];
      expect([...migas.matchAll(/<li>/g)]).toHaveLength(3);
      expect(migas).toContain('<a href="/learn/">Vorka Learn</a>');
      expect(migas).toContain(`<a href="${rutaIndice(x.sim)}">${SIMS[x.sim].examen}</a>`);
      expect(migas).toContain(`aria-current="page">${x.h1}</span>`);
    }
  });

  it('nada de tienda: sin precios, carrito, puntos, tarjeta de venta ni «reactivo gratis»; exactamente un llamado final al simulador', async () => {
    for (const x of GUIAS) {
      const html = await (await pedir(rutaGuia(x))).text();
      const main = principal(html), ruta = rutaGuia(x);
      // Precios nuestros no (los montos del contenido sí: el costo de la cédula de la UG o un problema de porcentajes)
      const sinEjemplos = html.replace(/<div class="gu-ej">[\s\S]*?<\/details><\/div>/g, '');
      expect(sinEjemplos, ruta).not.toMatch(/MXN|Comprar|carrito|Gana puntos|data-app="tienda"|t-precio|t-barra|class="num"|\/tienda\/puntos|precio/i);
      expect(sinEjemplos.replace(/La cédula de admisión costó \$1,645\./, ''), ruta).not.toMatch(/\$\s?\d/);
      expect(cabecera(html), ruta).not.toMatch(/\/tienda\//);
      expect(main, ruta).not.toMatch(/gu-cta|gu-lado|#probar|reactivo gratis|Diagnóstico gratis/i);
      expect(html, ruta).not.toMatch(/form-compra|SCRIPT_PUNTOS|\/api\/puntos/);
      // Un solo llamado al final, con el botón al simulador de esa guía
      const finales = main.match(/<aside class="lr-final"[\s\S]*?<\/aside>/g) || [];
      expect(finales, ruta).toHaveLength(1);
      expect(finales[0]).toContain(`href="/${x.sim}/"`);
      expect(main.indexOf('lr-final')).toBeGreaterThan(main.indexOf('id="fuentes"'));
      // Como mucho un enlace de texto al simulador dentro del artículo (además del llamado final)
      const art = main.split('<article')[1].split('<aside class="lr-final"')[0];
      expect(ligasSim(art, x.sim), ruta).toBeLessThanOrEqual(1);
      for (const s of Object.keys(SIMS).filter(k => k !== x.sim)) expect(ligasSim(art, s), `${ruta} → ${s}`).toBe(0);
    }
  });

  it('JSON-LD: Article de Vorka Learn (parte de Vorka México), BreadcrumbList y FAQPage solo con preguntas visibles', async () => {
    for (const x of GUIAS) {
      const html = await (await pedir(rutaGuia(x))).text();
      const ld = jsonLd(html);
      const art = ld.find(d => d['@type'] === 'Article');
      expect(art.headline).toBe(x.h1);
      expect(art.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(art.author).toMatchObject({ '@type': 'Organization', name: 'Vorka Learn', parentOrganization: { '@type': 'Organization', name: 'Vorka México' } });
      expect(art.publisher).toMatchObject({ '@type': 'Organization', name: 'Vorka México' });
      expect(art.publisher.logo.url).toMatch(/^https:\/\/vorka\.mx\//);
      expect(art.mainEntityOfPage['@id']).toBe(`https://vorka.mx${rutaGuia(x)}`);
      const migas = ld.find(d => d['@type'] === 'BreadcrumbList').itemListElement;
      expect(migas.map(m => m.item)).toEqual(['https://vorka.mx/learn/', `https://vorka.mx${rutaIndice(x.sim)}`, `https://vorka.mx${rutaGuia(x)}`]);
      expect(migas.map(m => m.name)).toEqual(['Vorka Learn', SIMS[x.sim].examen, x.h1]);
      const faq = ld.find(d => d['@type'] === 'FAQPage');
      if (x.faq?.length) {
        expect(faq.mainEntity).toHaveLength(x.faq.length);
        for (const f of x.faq) expect(desescapar(html)).toContain(`<summary>${f.p}</summary><div>${f.r}</div>`);
      } else expect(faq).toBeUndefined();
    }
  });

  it('cada guía cita sus fuentes con enlace y dice cuándo se actualizó', async () => {
    for (const x of GUIAS) {
      const html = desescapar(await (await pedir(rutaGuia(x))).text());
      expect(x.fuentes.length).toBeGreaterThan(0);
      expect(html).toContain('id="fuentes">Fuentes</h2>');
      for (const f of x.fuentes) { expect(f.url).toMatch(/^https?:\/\//); expect(html).toContain(`href="${f.url}"`); }
      expect(html).toMatch(/Actualizado: <time datetime="\d{4}-\d{2}-\d{2}">[a-z]+ de \d{4}<\/time>/);
    }
  });

  it('cada guía se puede compartir (WhatsApp y Facebook con utm a la URL nueva) y ECOEMS y Prepa UG se recomiendan entre sí', async () => {
    for (const x of GUIAS) {
      const html = await (await pedir(rutaGuia(x))).text();
      expect(html, rutaGuia(x)).toContain('https://wa.me/?text=');
      expect(html, rutaGuia(x)).toContain(encodeURIComponent(`https://vorka.mx${rutaGuia(x)}?utm_source=whatsapp&utm_medium=compartir&utm_campaign=learn`));
      expect(html, rutaGuia(x)).toContain(`facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://vorka.mx${rutaGuia(x)}?utm_source=facebook`)}`);
      expect(html, rutaGuia(x)).toContain('Sigue leyendo');
    }
    const ug = await (await pedir('/learn/prepa-ug/examen-admision-prepa-ug/')).text();
    expect(ug).toContain('href="/learn/ecoems/');
    const ec = await (await pedir('/learn/ecoems/que-viene-en-el-examen-ecoems/')).text();
    expect(ec).toContain('href="/learn/prepa-ug/examen-admision-prepa-ug/"');
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

  it('todos los enlaces internos de Learn existen (sin pasar por redirecciones)', async () => {
    const vistos = new Map();
    for (const ruta of LEARN) {
      const html = await (await pedir(ruta)).text();
      const internos = [...html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)].map(m => m[1])
        .filter(l => !/^\/(assets|tienda\/estilos\.css|vorka-logo\.png)/.test(l) && !/^\/(servicios|sparks|voluntariado|fc|agenda|privacidad)?\/?$|^\/(servicios|sparks|fc|agenda)\//.test(l));
      expect(internos.length).toBeGreaterThan(2);
      for (const l of internos) {
        if (!/^\/(learn|simulador-|tienda)/.test(l)) continue;   // el resto es el sitio estático (pie)
        if (!vistos.has(l)) vistos.set(l, (await pedir(l)).status);
        expect(vistos.get(l), `${ruta} → ${l}`).toBe(200);
      }
      expect(principal(html), ruta).not.toMatch(/\/simulador-[a-z-]+\/guias\//);
      for (const [, id] of principal(html).matchAll(/href="#([a-z0-9-]+)"/g)) expect(html, `${ruta} #${id}`).toContain(`id="${id}"`);
    }
  });

  it('se enlazan entre sí: cada guía liga al menos a otra guía', async () => {
    for (const x of GUIAS.filter(y => guiasDe(y.sim).length > 1)) {
      const html = principal(await (await pedir(rutaGuia(x))).text());
      expect(GUIAS.filter(y => y !== x).some(y => html.includes(`href="${rutaGuia(y)}"`)), x.slug).toBe(true);
    }
  });

  it('portada /learn/ e índices por examen: 200, canonical, un H1, JSON-LD y liga a cada guía', async () => {
    const r = await pedir('/learn/');
    expect(r.status).toBe(200);
    const portada = await r.text();
    expect(portada).toContain('<link rel="canonical" href="https://vorka.mx/learn/">');
    expect(meta(portada, /<title>([^<]*)<\/title>/)).toBe(LEARN_PORTADA.titulo);
    expect(LEARN_PORTADA.titulo.length).toBeLessThanOrEqual(60);
    expect(LEARN_PORTADA.descripcion.length).toBeLessThanOrEqual(155);
    expect(portada.match(/<h1[\s>]/g) || []).toHaveLength(1);
    for (const x of GUIAS) expect(portada).toContain(`href="${rutaGuia(x)}"`);
    for (const s of Object.keys(SIMS)) expect(portada).toContain(`>${SIMS[s].examen}</h2>`);
    expect(jsonLd(portada).map(d => d['@type'])).toEqual(['CollectionPage']);
    for (const s of Object.keys(SIMS)) {
      const ri = await pedir(rutaIndice(s));
      expect(ri.status).toBe(200);
      const html = await ri.text();
      expect(html).toContain(`<link rel="canonical" href="https://vorka.mx${rutaIndice(s)}">`);
      expect(meta(html, /<title>([^<]*)<\/title>/).length).toBeLessThanOrEqual(60);
      expect(meta(html, /<meta name="description" content="([^"]*)">/).length).toBeLessThanOrEqual(155);
      expect(html.match(/<h1[\s>]/g) || []).toHaveLength(1);
      expect(jsonLd(html).map(d => d['@type'])).toEqual(['CollectionPage', 'BreadcrumbList']);
      for (const x of guiasDe(s)) expect(html).toContain(`href="${rutaGuia(x)}"`);
      expect(principal(html)).not.toMatch(/Diagnóstico gratis|\$\s?\d/);
    }
  });

  it('sitemap propio /learn/sitemap.xml con las URL nuevas (y ya no en el de la tienda); robots.txt lo declara', async () => {
    const r = await pedir('/learn/sitemap.xml');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('xml');
    const mapa = await r.text();
    for (const ruta of LEARN) expect(mapa).toContain(`<loc>https://vorka.mx${ruta}</loc>`);
    expect(mapa).not.toContain('/guias/');
    const tienda = await (await pedir('/tienda/sitemap.xml')).text();
    expect(tienda).not.toContain('/guias/');
    expect(tienda).not.toContain('/learn/');
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(new URL('../../robots.txt', import.meta.url), 'utf8')).toContain('Sitemap: https://vorka.mx/learn/sitemap.xml');
  });

  it('las páginas de venta siguen ligando a las guías en «Guías para prepararte» (ya en /learn/)', async () => {
    for (const s of Object.keys(SIMS)) {
      const venta = await (await pedir(`/${s}/`)).text();
      expect(venta).toContain('Guías para prepararte');
      expect(venta).toContain(`href="${rutaIndice(s)}"`);
      for (const x of guiasDe(s)) expect(venta).toContain(`href="${rutaGuia(x)}"`);
      expect(venta).not.toContain('/guias/');
    }
    const udem = await (await pedir('/simulador-paa/udem/')).text();
    expect(udem).toContain('href="/learn/paa/puntaje-paa/"');
    expect(udem).not.toContain('/simulador-paa/guias/');
  });

  it('sin barra final redirige; una guía o examen que no existe no se inventa; solo GET y HEAD', async () => {
    const x = GUIAS[0];
    const r = await pedir(rutaGuia(x).slice(0, -1));
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe(`https://vorka.mx${rutaGuia(x)}`);
    expect((await pedir('/learn')).headers.get('location')).toBe('https://vorka.mx/learn/');
    expect((await pedir('/learn/paa')).headers.get('location')).toBe('https://vorka.mx/learn/paa/');
    expect((await pedir('/learn/paa/no-existe/')).status).not.toBe(200);
    expect((await pedir('/learn/unam/que-es-la-paa/')).status).not.toBe(200);
    expect((await pedir('/learn/sat/')).status).not.toBe(200);
    expect((await pedir(rutaGuia(x), 'HEAD')).status).toBe(200);
    expect((await pedir(rutaGuia(x), 'POST')).status).not.toBe(200);
  });

  it('no son plantillas: títulos, descripciones y H1 distintos', () => {
    for (const k of ['titulo', 'descripcion', 'h1', 'lead']) expect(new Set(GUIAS.map(x => x[k])).size).toBe(GUIAS.length);
    expect(new Set(GUIAS.map(tituloGuia)).size).toBe(GUIAS.length);
  });
});

describe('Vorka Learn: anuncios (AdSense)', () => {
  it('apagados por defecto: sin adsbygoogle, sin espacios ni dominios de Google Ads en el HTML ni en la CSP; ads.txt 404', async () => {
    expect(configAnuncios({})).toBeNull();
    expect(configAnuncios({ ADSENSE_CLIENT: '' })).toBeNull();
    expect(configAnuncios({ ADSENSE_CLIENT: 'cualquier-cosa' })).toBeNull();
    for (const ruta of LEARN) {
      const r = await pedir(ruta);
      const html = await r.text(), csp = r.headers.get('content-security-policy');
      expect(html, ruta).not.toMatch(/adsbygoogle|lr-anuncio"|data-ad-slot|Publicidad/);
      expect(html, ruta).not.toMatch(DOMINIOS_GOOGLE);
      expect(csp, ruta).not.toMatch(DOMINIOS_GOOGLE);
    }
    expect((await pedir('/ads.txt')).status).toBe(404);
  });

  it('encendidos con ADSENSE_CLIENT/ADSENSE_SLOTS: script con nonce, espacios con alto reservado y CSP abierta solo en Learn', async () => {
    const e = { ...env, ...AD_ENV };
    const x = GUIAS.find(y => y.secciones.length >= 4);
    const r = await pedir(rutaGuia(x), 'GET', e);
    const html = await r.text(), csp = r.headers.get('content-security-policy');
    const n = csp.match(/'nonce-([^']+)'/)[1];
    expect(html).toContain(`<script async nonce="${n}" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>`);
    for (const lugar of ['intro', 'mitad', 'final']) expect(html, lugar).toContain(`data-lugar="${lugar}"`);
    expect(html.match(/<ins class="adsbygoogle/g)).toHaveLength(3);
    expect(html).toContain('data-ad-slot="1111111111"');
    // El anuncio final va antes del llamado al simulador
    expect(html.indexOf('data-lugar="final"')).toBeLessThan(html.indexOf('class="lr-final"'));
    for (const d of DOMINIOS_ADSENSE.script) expect(csp.split('; ').find(p => p.startsWith('script-src'))).toContain(d);
    for (const d of DOMINIOS_ADSENSE.frame) expect(csp.split('; ').find(p => p.startsWith('frame-src'))).toContain(d);
    for (const d of DOMINIOS_ADSENSE.connect) expect(csp.split('; ').find(p => p.startsWith('connect-src'))).toContain(d);
    // Índices: un espacio entre grupos
    for (const ruta of ['/learn/', '/learn/paa/']) {
      const h = await (await pedir(ruta, 'GET', e)).text();
      expect(h.match(/<ins class="adsbygoogle/g), ruta).toHaveLength(1);
      expect(h, ruta).toContain('data-lugar="indice"');
    }
    // Nunca en la tienda, el pago, la cuenta ni la venta del simulador
    for (const ruta of ['/tienda/', '/tienda/puntos/', '/simulador-paa/', '/simulador-paa/udem/', '/descargas/reenviar/']) {
      const t = await pedir(ruta, 'GET', e);
      const th = await t.text();
      expect(th, ruta).not.toMatch(/adsbygoogle/);
      expect(t.headers.get('content-security-policy') || '', ruta).not.toMatch(DOMINIOS_GOOGLE);
    }
    // ads.txt sale de la misma variable
    const a = await pedir('/ads.txt', 'GET', e);
    expect(a.status).toBe(200);
    expect(await a.text()).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  });

  it('con ADSENSE_CLIENT pero sin bloques: script sí, espacios no (no quedan huecos)', async () => {
    const e = { ...env, ADSENSE_CLIENT: AD_ENV.ADSENSE_CLIENT, ADSENSE_SLOTS: '' };
    const html = await (await pedir(rutaGuia(GUIAS[0]), 'GET', e)).text();
    expect(html).toContain('adsbygoogle.js?client=');
    expect(html).not.toMatch(/<ins class="adsbygoogle|lr-anuncio"/);
  });
});
