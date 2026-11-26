// IPN: aciertos y lugares por carrera (src/simulador/ipn-aciertos.js, anexo oficial de oferta) y las 3 páginas nuevas
// de EXANI-II (UAEM Morelos, UMSNH y UAZ) — nov 2026
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { LUGARES_IPN } from '../src/simulador/datos/ipn-lugares.js';
import { CARRERAS_IPN } from '../src/simulador/ipn-aciertos.js';

let env;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), env);
beforeEach(() => { env = { DB: d1(), SITE_URL: 'https://vorka.mx' }; });

describe('datos del IPN', () => {
  it('son las 107 opciones del anexo, en 3 áreas, con lugares enteros', () => {
    expect(LUGARES_IPN).toHaveLength(107);
    expect(new Set(LUGARES_IPN.map(r => r[0]))).toEqual(new Set(['icfm', 'cmb', 'csa']));
    for (const r of LUGARES_IPN) { expect(Number.isInteger(r[3]) && Number.isInteger(r[4]), r[2]).toBe(true); expect(r[5], r[2]).toBeTruthy(); }
    const esm = LUGARES_IPN.find(r => r[1].includes('(ESM)') && r[2] === 'Médico Cirujano y Partero');
    expect([esm[3], esm[4]]).toEqual([330, 330]);
    // cada carrera con página encuentra sus programas
    for (const [s, c] of Object.entries(CARRERAS_IPN)) expect(LUGARES_IPN.filter(r => c.busca.test(r[2])).length, s).toBeGreaterThan(0);
  });
});

describe('páginas del IPN', () => {
  it('la general trae las 107 opciones, fuente oficial, FAQ y ligas a las carreras; sin aciertos mínimos inventados', async () => {
    const r = await pedir('/simulador-ipn/aciertos/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect((h.match(/<tr data-q="/g) || []).length).toBe(107);
    expect(h).toContain('admision.ipn.mx/nse/convocatoria/ANEXO/escolarizado272.html');
    expect(h).toContain('"FAQPage"');
    expect(h).toContain('href="/simulador-ipn/aciertos/medicina/"');
    expect(h).toContain('href="/simulador-ipn/#probar"');
    expect(h).not.toMatch(/simulador oficial/i);
    expect((await pedir('/simulador-ipn/aciertos')).status).toBe(301);
  });

  it('cada carrera trae sus escuelas y lugares; las demás no tienen página', async () => {
    const h = await (await pedir('/simulador-ipn/aciertos/medicina/')).text();
    expect(h).toContain('<title>¿Cuántos aciertos pide el IPN para Medicina?');
    expect((h.match(/<tr data-q="/g) || []).length).toBe(4);   // ESM, ENMH (2) y CICS Milpa Alta
    expect(h).toContain('Ciencias Médico Biológicas');
    for (const s of Object.keys(CARRERAS_IPN)) expect((await pedir(`/simulador-ipn/aciertos/${s}/`)).status, s).toBe(200);
    expect((await pedir('/simulador-ipn/aciertos/turismo/')).status).not.toBe(200);
    const mapa = await (await pedir('/tienda/sitemap.xml')).text();
    expect(mapa).toContain('/simulador-ipn/aciertos/ingenieria-civil/');
    expect(mapa).toContain('/simulador-exani-ii/uaem-morelos/');
    expect(await (await pedir('/simulador-ipn/')).text()).toContain('href="/simulador-ipn/aciertos/odontologia/"');
  });
});

describe('EXANI-II: UAEM Morelos, UMSNH y UAZ', () => {
  it('tienen página con fuente oficial, y salen una sola vez en «¿Cuál te sirve?»', async () => {
    for (const [k, fuente] of [['uaem-morelos', 'uaem.mx'], ['umsnh', 'umich.mx'], ['uaz', 'escolar.uaz.edu.mx']]) {
      const h = await (await pedir(`/simulador-exani-ii/${k}/`)).text();
      expect(h, k).toContain(fuente);
      expect(h, k).toContain('href="/simulador-exani-ii/#probar"');
      expect(h, k).not.toMatch(/simulador oficial/i);
    }
    expect(await (await pedir('/simulador-exani-ii/uaz/')).text()).toContain('Médico General (Zacatecas, ingreso agosto 2026)');
    const sel = await (await pedir('/simulador-exani-ii/universidades/')).text();
    expect((sel.match(/<b>UMSNH<\/b>/g) || []).length).toBe(1);
    expect((sel.match(/<b>UAZ<\/b>/g) || []).length).toBe(1);
    expect(sel).toContain('href="/simulador-exani-ii/uaem-morelos/"');
  });
});

describe('compra arriba en las páginas nuevas', () => {
  it('precio y «Comprar» dentro del inicio y la barra fija', async () => {
    env.DB.raw.exec('UPDATE products SET activo = 1');
    for (const [ruta, app] of [['/simulador-ipn/aciertos/', 'simulador-ipn'], ['/simulador-ipn/aciertos/sistemas-computacionales/', 'simulador-ipn'], ['/simulador-exani-ii/umsnh/', 'simulador-exani-ii']]) {
      const h = await (await pedir(ruta)).text();
      const caja = h.indexOf('class="ca-caja"');
      expect(caja, ruta).toBeGreaterThan(0);
      expect(caja, ruta).toBeLessThan(h.indexOf('class="t-sec'));
      expect(h, ruta).toContain(`href="/${app}/?plan=paquete#comprar"`);
      expect(h, ruta).toContain('id="barra-compra"');
    }
  });
});
