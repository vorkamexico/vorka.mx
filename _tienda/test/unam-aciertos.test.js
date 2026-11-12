// Aciertos UNAM por carrera y plantel (src/simulador/unam-aciertos.js, datos oficiales de la DGAE)
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { MINIMOS_UNAM } from '../src/simulador/datos/unam-minimos.js';
import { CARRERAS, conPagina, slugCarrera, MINIMO_PAGINA } from '../src/simulador/unam-aciertos.js';

let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), env);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx' }; });

describe('datos de la DGAE', () => {
  it('son los 220 programas, en 4 áreas, con mínimos de 40 a 111', () => {
    expect(MINIMOS_UNAM).toHaveLength(220);
    expect(new Set(MINIMOS_UNAM.map(r => r[0]))).toEqual(new Set([1, 2, 3, 4]));
    const m = MINIMOS_UNAM.map(r => r[4]);
    expect(Math.min(...m)).toBe(40); expect(Math.max(...m)).toBe(111);
    expect(CARRERAS['medico-cirujano'].programas.map(p => p.minimo)).toEqual([111, 106, 105]);
    expect(slugCarrera('Química Farmacéutico Biológica')).toBe('quimica-farmaceutico-biologica');
  });
});

describe('páginas', () => {
  it('la general trae los 220 programas, calculadora, fuente y FAQ', async () => {
    const r = await pedir('/simulador-unam/aciertos/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect((h.match(/data-min="/g) || []).length).toBe(220);
    expect(h).toContain('id="ua-tus"');
    expect(h).toContain('escolar.unam.mx/Licenciatura2026/oferta_lugares/cortes_minimos.html');
    expect(h).toContain('"FAQPage"');
    expect(h).toContain('href="/simulador-unam/aciertos/medico-cirujano/"');
    expect((await pedir('/simulador-unam/aciertos')).status).toBe(301);
  });

  it('una carrera trae sus planteles; las de poca demanda no tienen página', async () => {
    const h = await (await pedir('/simulador-unam/aciertos/medico-cirujano/')).text();
    expect(h).toContain('<title>Aciertos para Médico Cirujano en la UNAM');
    expect((h.match(/data-min="/g) || []).length).toBe(3);
    expect(h).toContain('Área 2');
    const baja = Object.entries(CARRERAS).find(([, c]) => c.max < MINIMO_PAGINA)[0];
    expect((await pedir(`/simulador-unam/aciertos/${baja}/`)).status).not.toBe(200);
    expect(conPagina()).toContain('derecho');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('/simulador-unam/aciertos/derecho/');
    expect(await (await pedir('/simulador-unam/')).text()).toContain('href="/simulador-unam/aciertos/medico-cirujano/"');
    expect(await (await pedir('/simulador-paa/')).text()).toContain('href="/simulador-paa/calculadora/"');
  });
});
