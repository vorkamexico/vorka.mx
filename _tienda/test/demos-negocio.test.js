// Demos en vivo de eventos y negocio: Cupo y Portal (página propia + sección en su ficha), Vuelve y Brindi (demo externa)
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
  for (const [k, ficha] of [['cupo', '/tienda/cupo/'], ['portales', '/tienda/portales/']]) {
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

  it('vuelve: #ejemplo es el quiz de la portada y la tarjeta de ejemplo queda a una liga (vorka.mx/vuelve/demo)', async () => {
    const p = await (await ver('/tienda/vuelve/')).text();
    expect(p).toContain('id="ejemplo"');
    expect(p).toContain('href="https://vorka.mx/vuelve/demo"');
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

describe('Toolkit retirado (nunca se vendió)', () => {
  it('no tiene demo pública', () => { expect(demoDe('toolkit')).toBeNull(); });
  it('/tienda/toolkit/ manda a la tienda conservando la query', async () => {
    const r = await ver('/tienda/toolkit/?utm_source=wa&ref=ANA');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('/tienda/?utm_source=wa&ref=ANA');
  });
  it('sus demás direcciones viejas también mandan a la tienda', async () => {
    for (const ruta of ['/tienda/toolkit', '/tienda/mi-toolkit/', '/tienda/toolkit-mensual/', '/tienda/toolkit-pro-mensual/', '/tienda/canjear/TK-ABCD-EFGH']) {
      const r = await ver(ruta);
      expect(r.status, ruta).toBe(301);
      expect(r.headers.get('location'), ruta).toBe('/tienda/');
    }
  });
  it('ya no hay productos ni API del Toolkit', async () => {
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM products WHERE id LIKE 'prod_toolkit%'").get().n).toBe(0);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE 'toolkit%'").get().n).toBe(0);
    expect((await ver('/api/toolkit/saldo')).status).toBe(404);
  });
});
