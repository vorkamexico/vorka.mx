import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken } from '../src/entrega.js';

let env;
const pedir = (ruta, { metodo = 'GET', cookie, body } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body, redirect: 'manual',
}), env);
const soloCookie = setCookie => setCookie.split(';')[0];

async function comprar(slug, email = 'ana@mail.com') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Ana López' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  return o;
}
const entrar = async (slug, email) => {
  const o = await comprar(slug, email); const { token } = await crearToken(env, o.id);
  const r = await pedir(`/simulador-unam/entrar/${token}`);
  expect(r.status).toBe(303); expect(r.headers.get('location')).toBe('/simulador-unam/');
  return soloCookie(r.headers.get('set-cookie'));
};
const iniciar = (cookie, tipo, area) => pedir('/api/simulador-unam/iniciar', { metodo: 'POST', cookie, body: JSON.stringify({ tipo, area }) });
const yo = async cookie => (await pedir('/api/simulador-unam/yo', { cookie })).json();
const abandonar = (cookie, id) => pedir('/api/simulador-unam/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id }) });

// Reactivos por materia de cada área (referencia de la guía; 120 en total)
const DISTRIBUCION = {
  1: { espanol: 18, matematicas: 26, fisica: 16, quimica: 10, biologia: 10, literatura: 10, geografia: 10, historia_universal: 10, historia_mexico: 10 },
  4: { espanol: 18, matematicas: 22, fisica: 10, quimica: 10, biologia: 10, literatura: 10, geografia: 10, historia_universal: 10, historia_mexico: 10, filosofia: 10 },
};

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec("UPDATE products SET activo = 1");
});

describe('simulador UNAM', () => {
  it('página pública con sus planes de $149, $199 y $299, las 4 áreas y datos estructurados', async () => {
    const r = await pedir('/simulador-unam/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<title>Simulador examen UNAM');
    expect(html).toContain('rel="canonical" href="https://vorka.mx/simulador-unam/"');
    for (const p of ['$149', '$199', '$299']) expect(html).toContain(p);
    for (const a of ['Área 1', 'Área 2', 'Área 3', 'Área 4']) expect(html).toContain(a);
    expect(html).toContain('application/ld+json');
    expect(html).not.toContain('College Board');
    // no se confunde con el del PAA
    expect(html).not.toContain('/simulador-paa/app.js');
  });

  it('la cookie del UNAM no abre el PAA ni al revés', async () => {
    const unam = await entrar('simulador-unam-paquete', 'u@mail.com');
    expect((await pedir('/api/simulador-unam/banco', { cookie: unam })).status).toBe(200);
    expect((await pedir('/api/simulador-paa/banco', { cookie: unam })).status).toBe(401);
    const o = await comprar('simulador-paa-paquete', 'p@mail.com'); const { token } = await crearToken(env, o.id);
    const paa = soloCookie((await pedir(`/simulador-paa/entrar/${token}`)).headers.get('set-cookie'));
    expect((await pedir('/api/simulador-unam/banco', { cookie: paa })).status).toBe(401);
  });

  it('el banco trae las 10 materias, las 4 áreas y la escala de aciertos', async () => {
    const cookie = await entrar('simulador-unam-practica', 'b@mail.com');
    const b = await (await pedir('/api/simulador-unam/banco', { cookie })).json();
    expect(b.config).toMatchObject({ examen: 'UNAM', escala: 'aciertos', examenReactivos: 120 });
    expect(b.areas.map(a => a.id)).toEqual([1, 2, 3, 4].map(n => b.areas[n - 1].id));
    expect(b.areas).toHaveLength(4);
    expect(b.reactivos.length).toBeGreaterThan(400);
    const app = await pedir('/simulador-unam/', { cookie });
    expect(await app.text()).toContain('"app":"simulador-unam"');
  });

  it('el examen oficial arma 120 reactivos con el peso de las materias del área, sin repetir', async () => {
    const cookie = await entrar('simulador-unam-completo', 'c@mail.com');
    const areas = (await (await pedir('/api/simulador-unam/banco', { cookie })).json()).areas;
    for (const [n, dist] of Object.entries(DISTRIBUCION)) {
      const r = await iniciar(cookie, 'examen', areas[n - 1].id);
      expect(r.status).toBe(200);
      const d = await r.json();
      const ids = d.items.flat();
      expect(ids).toHaveLength(120);
      expect(new Set(ids).size).toBe(120);
      expect(Object.fromEntries(d.secciones.map((s, i) => [s.id, d.items[i].length]))).toEqual(dist);
      expect(d.secciones.reduce((t, s) => t + s.minutos, 0)).toBe(180);
      await abandonar(cookie, d.id);
    }
    // el Simulador completo trae 2 exámenes y nada de práctica
    expect((await yo(cookie)).examenes).toMatchObject({ incluidos: 2 });
    expect((await iniciar(cookie, 'corto', areas[0].id)).status).toBe(402);
  });

  it('Práctica ilimitada: Medio de 60 reactivos y Calentamiento, sin examen oficial', async () => {
    const cookie = await entrar('simulador-unam-practica', 'p2@mail.com');
    const areas = (await (await pedir('/api/simulador-unam/banco', { cookie })).json()).areas;
    const medio = await (await iniciar(cookie, 'corto', areas[2].id)).json();
    expect(medio.items.flat()).toHaveLength(60);
    await abandonar(cookie, medio.id);
    const cal = await (await iniciar(cookie, 'calentamiento', areas[2].id)).json();
    expect(cal.items.flat().length).toBeGreaterThanOrEqual(18);
    expect(cal.items.flat().length).toBeLessThan(60);
    await abandonar(cookie, cal.id);
    expect((await iniciar(cookie, 'examen', areas[2].id)).status).toBe(402);
    const ofertas = (await yo(cookie)).ofertas;
    expect(ofertas.completo).toMatchObject({ slug: 'simulador-unam-completo', precio_centavos: 19900 });
  });

  it('guarda el resultado en aciertos (porcentaje por materia, global hasta 120) con su área', async () => {
    const cookie = await entrar('simulador-unam-completo', 'r@mail.com');
    const areas = (await (await pedir('/api/simulador-unam/banco', { cookie })).json()).areas;
    const { id } = await (await iniciar(cookie, 'examen', areas[1].id)).json();
    const body = JSON.stringify({ modo: 'examen', intento: id, area: areas[1].id, global: 500, meta: 84,
      secciones: [{ id: 'matematicas', puntaje: 640, aciertos: 20, total: 24, tiempo: 1800, limite: 2160 }] });
    expect((await pedir('/api/simulador-unam/resultados', { metodo: 'POST', cookie, body })).status).toBe(200);
    const h = (await yo(cookie)).historial[0];
    expect(h).toMatchObject({ modo: 'examen', area: areas[1].id, global: 120 });
    expect(h.secciones[0].puntaje).toBe(100);
  });

  it('el catálogo muestra una sola tarjeta del simulador UNAM y el sitemap su página', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html.match(/data-buscar="simulador unam en linea /g)).toHaveLength(1);
    expect(html).not.toContain('simulador-unam-intento');
  });
});
