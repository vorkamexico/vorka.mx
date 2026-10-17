import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';

let env;
const pedir = (ruta, headers = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers }), env);
const eventos = tipo => env.DB.raw.prepare('SELECT * FROM events WHERE tipo = ?').all(tipo);

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx' };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct, activo) VALUES ('ANA', 'Ana', 20, 1), ('OFF', 'Off', 10, 0);");
});

describe('/tienda (catálogo)', () => {
  it('lista los productos activos desde D1 con su precio', async () => {
    const r = await pedir('/tienda/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('href="/tienda/de-idea-a-proyecto/"');
    expect(html).toContain('$279 MXN');
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('<link rel="canonical" href="https://vorka.mx/tienda/">');
  });

  it('la portada destaca el primer producto del orden del catálogo y explica cómo comprar', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html).toMatch(/class="t-destacado" href="\/tienda\/de-idea-a-proyecto\/"/);
    expect(html).toContain('Destacado');
    expect(html).toContain('Recíbelo al momento');
    expect(html).toContain('id="productos"');
  });

  it('sin productos activos muestra un estado vacío', async () => {
    env.DB.raw.exec('UPDATE products SET activo = 0');
    const html = await (await pedir('/tienda')).text();
    expect(html).toContain('Muy pronto');
    expect(html).not.toContain('de-idea-a-proyecto');
  });

  it('el precio sale de la base: cambiarlo cambia la página', async () => {
    env.DB.raw.exec('UPDATE products SET precio_centavos = 34900');
    expect(await (await pedir('/tienda/')).text()).toContain('$349 MXN');
  });
});

describe('/tienda/<slug> (página de venta)', () => {
  it('muestra titular, qué incluye, para quién, FAQ, precio y formulario', async () => {
    const r = await pedir('/tienda/de-idea-a-proyecto/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('De la idea al proyecto, paso a paso');
    expect(html).toContain('Qué incluye');
    expect(html).toContain('Te sirve si…');
    expect(html).toContain('Preguntas frecuentes');
    expect(html).toContain('id="form-compra" method="post" action="/api/checkout"');
    expect(html).toContain('name="terminos"');
    expect(html).toContain('id="barra-compra"');
    expect(html).toContain('<meta property="og:title"');
  });

  it('JSON-LD Product / Offer con precio y moneda', async () => {
    const html = await (await pedir('/tienda/de-idea-a-proyecto')).text();
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
    expect(ld['@type']).toBe('Product');
    expect(ld.offers).toMatchObject({ '@type': 'Offer', price: '279.00', priceCurrency: 'MXN', availability: 'https://schema.org/InStock' });
  });

  it('producto inactivo o inexistente → 404', async () => {
    expect((await pedir('/tienda/no-existe/')).status).toBe(404);
    env.DB.raw.exec('UPDATE products SET activo = 0');
    expect((await pedir('/tienda/de-idea-a-proyecto/')).status).toBe(404);
  });

  it('muestra el error que regresa el checkout sin JavaScript', async () => {
    const html = await (await pedir('/tienda/de-idea-a-proyecto?error=Escribe%20tu%20nombre.')).text();
    expect(html).toMatch(/<p class="t-error" id="error-compra" role="alert">Escribe tu nombre\.<\/p>/);
  });

  it('registra view_product, pero no para bots', async () => {
    await pedir('/tienda/de-idea-a-proyecto/', { 'user-agent': 'Mozilla/5.0 (iPhone)' });
    await pedir('/tienda/de-idea-a-proyecto/', { 'user-agent': 'Googlebot/2.1' });
    expect(eventos('view_product')).toHaveLength(1);
  });

  it('el script inline lleva el nonce de la CSP', async () => {
    const r = await pedir('/tienda/de-idea-a-proyecto/');
    const nonce = r.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];
    expect(await r.text()).toContain(`<script nonce="${nonce}">(function(){`);
  });
});

describe('afiliados (?ref=)', () => {
  it('código activo → cookie vorka_ref de 30 días y queda en el formulario', async () => {
    const r = await pedir('/tienda/de-idea-a-proyecto/?ref=ana');
    const c = r.headers.get('set-cookie');
    expect(c).toContain('vorka_ref=ANA');
    expect(c).toContain(`Max-Age=${30 * 86400}`);
    expect(c).toMatch(/HttpOnly/);
    expect(await r.text()).toContain('name="ref" value="ANA"');
    expect(eventos('view_product')[0].ref_code).toBe('ANA');
  });

  it('también desde el catálogo', async () => {
    expect((await pedir('/tienda/?ref=ANA')).headers.get('set-cookie')).toContain('vorka_ref=ANA');
  });

  it('código inactivo o inexistente → sin cookie', async () => {
    expect((await pedir('/tienda/?ref=OFF')).headers.get('set-cookie')).toBeNull();
    expect((await pedir('/tienda/?ref=NADA')).headers.get('set-cookie')).toBeNull();
    expect((await pedir('/tienda/?ref=<script>')).headers.get('set-cookie')).toBeNull();
  });
});

describe('sitemap de la tienda', () => {
  it('incluye catálogo y productos activos', async () => {
    const xml = await (await pedir('/tienda/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://vorka.mx/tienda/</loc>');
    expect(xml).toContain('<loc>https://vorka.mx/tienda/de-idea-a-proyecto/</loc>');
  });
});

describe('rutas que no deben chocar', () => {
  it('/tienda/gracias no se trata como producto', async () => {
    expect(await (await pedir('/tienda/gracias?order=nada')).text()).toContain('No encontramos esa orden');
  });
});

describe('estilos de la tienda', () => {
  it('el Worker sirve tienda.css y las páginas lo enlazan con versión', async () => {
    const r = await pedir('/tienda/estilos.css');
    expect(r.headers.get('content-type')).toContain('text/css');
    expect(await r.text()).toContain('.t-prod');
    expect(await (await pedir('/tienda/')).text()).toMatch(/href="\/tienda\/estilos\.css\?v=[a-z0-9]+"/);
  });
});
