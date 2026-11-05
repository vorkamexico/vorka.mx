// Demos en vivo de eventos y negocio: Cupo, Portal y Toolkit (página propia + sección en su ficha), Vuelve y Brindi (demo externa)
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { demoDe } from '../src/demos/index.js';

let env;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64) };
  globalThis.fetch = async () => new Response('null', { status: 404 });
});
const ver = (ruta) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers: { 'user-agent': 'Mozilla/5.0' } }), env);

describe('demos de eventos y negocio', () => {
  for (const [k, ficha] of [['cupo', '/tienda/cupo/'], ['portales', '/tienda/portales/'], ['toolkit', '/tienda/toolkit/']]) {
    it(`${k}: la demo responde con su título y la ficha trae la sección`, async () => {
      const d = demoDe(k);
      expect(d && d.html && d.js && d.prueba.length).toBeTruthy();
      const r = await ver(`/tienda/demo/${k}/`);
      expect(r.status).toBe(200);
      const html = await r.text();
      expect(html).toContain('<div id="dm">');
      expect(html).toContain(d.cta.replace(/&/g, '&amp;'));
      const p = await (await ver(ficha)).text();
      expect(p).toContain('id="demo"');
      expect(p).toContain(`/tienda/demo/${k}/?dentro=1`);
      expect(p).toContain('href="#demo"');
    });
  }

  it('cupo: la entrada trae un QR real y los avisos del check-in', () => {
    const { html, js } = demoDe('cupo');
    expect(html).toContain('id="cu-qr"');
    expect(js).toMatch(/M\d+ \d+h1v1h-1z/);
    for (const t of ['Cobrar en la puerta', 'Puede pasar', 'Ya había entrado']) expect(js).toContain(t);
  });

  it('toolkit: usa los precios de lista de la tienda', async () => {
    const { html } = demoDe('toolkit');
    for (const [slug, texto] of [['test-vocacional', '$79'], ['agenda-mensual', '$99'], ['cupo-pro', '$149'], ['brindi-celebracion', '$699']]) {
      const p = await env.DB.prepare('SELECT precio_centavos FROM products WHERE slug = ?').bind(slug).first();
      expect(`$${p.precio_centavos / 100}`).toBe(texto);
      expect(html).toContain(`<span class="pr">${texto}</span>`);
    }
  });

  it('vuelve: la sección de la demo sustituye a #ejemplo con la demo de vorka.mx/vuelve/demo', async () => {
    const p = await (await ver('/tienda/vuelve/')).text();
    expect(p).toContain('id="ejemplo"');
    expect(p).toContain('src="/vuelve/demo"');
    expect(p.match(/id="ejemplo"/g)).toHaveLength(1);
  });

  it('brindi: la sección de ejemplos trae los botones para compartir, sin duplicar el celular', async () => {
    const p = await (await ver('/tienda/brindi/')).text();
    expect(p).toContain('id="demos"');
    expect(p).toContain('data-copiar="https://os.vorka.mx/i/demo-boda"');
    expect(p.match(/<iframe /g)).toHaveLength(1);
    expect(p).not.toContain('id="demo"');
  });
});
