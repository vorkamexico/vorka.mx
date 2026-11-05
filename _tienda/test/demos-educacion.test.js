// Demos en vivo de educación (src/demos): simuladores PAA, UNAM, ECOEMS y prepa UG, test vocacional, ¿Qué proyecto social
// hago?, Ruta de Impacto y Evaluación de liderazgo. Cada demo responde en /tienda/demo/<clave>/ con su título y la página
// de su producto trae la sección id="demo". Además: los reactivos salen del banco real y la regla de afinidad que corre
// en el navegador da lo mismo que la del servidor.
import { describe, it, expect, beforeAll } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { demoDe } from '../src/demos/index.js';
import SIM from '../src/demos/simulador.js';
import { AFINIDAD_JS } from '../src/demos/tests.js';
import { afinidad } from '../src/tests/proyecto.js';
import { PREGUNTAS, PROYECTOS, TAMANOS } from '../src/tests/proyecto-datos.js';
import { REACTIVOS as REACTIVOS_PAA } from '../src/simulador/banco.js';

let env;
beforeAll(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; });
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { headers: { 'user-agent': 'Mozilla/5.0' } }), env);
const datosDe = js => JSON.parse(js.slice(js.indexOf('=') + 1, js.indexOf(';\n(()=>')));

const DEMOS = [
  ['simulador-paa', '/simulador-paa/'], ['simulador-unam', '/simulador-unam/'], ['simulador-ecoems', '/simulador-ecoems/'], ['simulador-prepa-ug', '/simulador-prepa-ug/'],
  ['test-vocacional', '/test-vocacional/'], ['que-proyecto-social', '/que-proyecto-social/'],
  ['ruta-de-impacto', '/tienda/ruta-de-impacto/'], ['evaluacion-liderazgo', '/tienda/evaluacion-liderazgo/'],
];

describe('demos de educación', () => {
  for (const [k, pagina] of DEMOS) {
    it(`${k}: /tienda/demo/${k}/ responde con su título y su página trae la demo`, async () => {
      const d = demoDe(k);
      expect(d?.titulo).toBeTruthy();
      expect(d.prueba).toHaveLength(3);
      const r = await pedir(`/tienda/demo/${k}/`);
      expect(r.status).toBe(200);
      const html = await r.text();
      expect(html).toMatch(/<title>Demo de [^<]+: pruébalo gratis, sin registrarte \| Vorka México<\/title>/);
      expect(html).not.toMatch(/fetch\(|localStorage/);
      // El js de la demo se puede leer (sin errores de sintaxis)
      expect(() => new Function(d.js)).not.toThrow();
      const p = await pedir(pagina);
      expect(p.status).toBe(200);
      const ph = await p.text();
      expect(ph).toContain('id="demo"');
      expect(ph).toContain(`/tienda/demo/${k}/?dentro=1`);
    });
  }

  it('simuladores: 5 reactivos reales de su banco, con pista, pasos y regla, y un ritmo por reactivo', () => {
    for (const k of ['paa', 'unam', 'ecoems', 'prepa-ug']) {
      const D = datosDe(SIM[k].js);
      expect(D.r).toHaveLength(5);
      for (const r of D.r) {
        expect(r.o.length).toBeGreaterThanOrEqual(3);
        expect(r.k).toBeLessThan(r.o.length);
        expect(r.p && r.pa.length && r.rg && r.c).toBeTruthy();
        expect(r.seg).toBeGreaterThan(30);
      }
    }
    // El primero del PAA es el reactivo L4-voc-7 tal cual
    const paa = datosDe(SIM.paa.js).r[0], banco = REACTIVOS_PAA.find(x => x.id === 'L4-voc-7');
    expect(paa.e).toBe(banco.enunciado);
    expect(paa.o).toEqual(banco.opciones);
    expect(paa.k).toBe(banco.correcta);
  });

  it('¿Qué proyecto social hago?: la regla del navegador da lo mismo que proyecto.js › afinidad', () => {
    const fn = new Function('TAMANOS', `${AFINIDAD_JS}; return afinidad;`)(TAMANOS);
    const valores = k => (PREGUNTAS[k].unica || PREGUNTAS[k].multi).map(([v]) => v);
    let azar = 7; const rnd = n => (azar = (azar * 9301 + 49297) % 233280) % n;
    for (let n = 0; n < 60; n++) {
      const tomar = (k, m) => [...new Set(Array.from({ length: m }, () => valores(k)[rnd(valores(k).length)]))];
      const r = { causas: tomar('causas', 3), expertise: tomar('expertise', 3), colaborar: [], giro: '',
        tamano: valores('tamano')[rnd(5)], presupuesto: valores('presupuesto')[rnd(5)], tiempo: valores('tiempo')[rnd(4)] };
      for (const pr of PROYECTOS) expect(fn(pr, r)).toBe(afinidad(pr, r));
    }
  });
});
