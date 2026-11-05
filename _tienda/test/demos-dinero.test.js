// Demos en vivo de las apps de dinero (Cuentas, Clara y Vende): /tienda/demo/<clave>/ responde con su título y su flujo,
// y la página de cada producto trae la sección «Pruébalo aquí» (id="demo") con el celular que la muestra.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { demoDe } from '../src/demos/index.js';

let env;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec('UPDATE products SET activo = 1');
});
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers: { 'user-agent': 'Mozilla/5.0' } }), env);

const DEMOS = [
  ['cuentas', 'Registra un préstamo y su primer abono.', ['id="cu-crear"', 'Registrar abono', 'planificar(']],
  ['clara', 'Anota un gasto y mira cuánto te queda.', ['data-anotar="gasto"', 'Te alcanzan', 'Pago sin intereses vs. pago mínimo']],
  ['vende', 'Anota una venta y mira cuánto ganaste de verdad.', ['Anotar una venta', 'Mandarle WhatsApp', 'Ganancia real']],
];

describe('demos de las apps de dinero', () => {
  for (const [k, titulo, piezas] of DEMOS) {
    it(`${k}: la demo tiene contrato completo y su página responde 200`, async () => {
      const d = demoDe(k);
      expect(d && d.titulo).toBe(titulo);
      expect(d.prueba).toHaveLength(3);
      for (const c of ['texto', 'cta', 'css', 'html', 'js']) expect(typeof d[c]).toBe('string');
      expect(() => new Function(d.js)).not.toThrow();
      expect(d.js).not.toMatch(/fetch\(|localStorage|XMLHttpRequest/);
      const r = await pedir(`/tienda/demo/${k}/`);
      expect(r.status).toBe(200);
      const html = await r.text();
      expect(html).toContain(`Demo de ${k === 'cuentas' ? 'Cuentas' : k === 'clara' ? 'Clara' : 'Vende'}`);
      expect(html).toContain(`<meta name="description" content="${d.texto.replace(/"/g, '&quot;')}">`);
      for (const p of piezas) expect(html).toContain(p);
    });
    it(`${k}: la página del producto incluye la sección de la demo y su liga en el índice`, async () => {
      const html = await (await pedir(`/tienda/${k}/`)).text();
      expect(html).toContain('id="demo"');
      expect(html).toContain(`src="/tienda/demo/${k}/?dentro=1"`);
      expect(html).toContain(titulo);
      expect(html).toContain('href="#demo"');
    });
  }
});
