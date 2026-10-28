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
  const r = await pedir(`/simulador-ecoems/entrar/${token}`);
  expect(r.status).toBe(303); expect(r.headers.get('location')).toBe('/simulador-ecoems/');
  return soloCookie(r.headers.get('set-cookie'));
};
const iniciar = (cookie, tipo) => pedir('/api/simulador-ecoems/iniciar', { metodo: 'POST', cookie, body: JSON.stringify({ tipo }) });
const yo = async cookie => (await pedir('/api/simulador-ecoems/yo', { cookie })).json();
const abandonar = (cookie, id) => pedir('/api/simulador-ecoems/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id }) });

// Reparto de referencia de la guía UNAM-IPN: 128 reactivos, sin áreas
const EXAMEN = { habilidad_verbal: 16, habilidad_matematica: 16, espanol: 12, matematicas: 12, biologia: 12, fisica: 12, quimica: 12, historia: 12, geografia: 12, formacion_civica: 12 };

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec("UPDATE products SET activo = 1");
});

describe('simulador ECOEMS', () => {
  it('entra inactivo: sin activarlo, la página dice "muy pronto" y no vende', async () => {
    env = { ...env, DB: d1() };
    const html = await (await pedir('/simulador-ecoems/')).text();
    expect(html).toContain('Muy pronto');
    expect(html).not.toContain('name="slug" value="simulador-ecoems-');
  });

  it('página pública con sus planes de $129, $179 y $249, solo datos verificados y el aviso de no afiliación', async () => {
    const r = await pedir('/simulador-ecoems/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<title>Simulador ECOEMS 2027');
    expect(html).toContain('rel="canonical" href="https://vorka.mx/simulador-ecoems/"');
    for (const p of ['$129', '$179', '$249']) expect(html).toContain(p);
    expect(html).toContain('name="slug" value="simulador-ecoems-paquete"');   // arranca en el Completo (el recomendado)
    expect(html).toContain('Ahorras $59 MXN');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('No está afiliado a la UNAM, al IPN, al ECOEMS ni a la SEP');
    expect(html).toContain('Todavía no hay nada publicado del proceso 2027');
    expect(html).toContain('de referencia');
    expect(html).not.toMatch(/Área [1-4]|College Board|exámenes oficiales/);
    expect(html.indexOf('id="sv-ej"')).toBeLessThan(html.indexOf('id="comprar"'));
    expect(html).not.toContain('/simulador-unam/app.js');
  });

  it('la cookie del ECOEMS no abre el UNAM ni el PAA, y al revés', async () => {
    const eco = await entrar('simulador-ecoems-paquete', 'e@mail.com');
    expect((await pedir('/api/simulador-ecoems/banco', { cookie: eco })).status).toBe(200);
    expect((await pedir('/api/simulador-unam/banco', { cookie: eco })).status).toBe(401);
    expect((await pedir('/api/simulador-paa/banco', { cookie: eco })).status).toBe(401);
    const o = await comprar('simulador-unam-paquete', 'u@mail.com'); const { token } = await crearToken(env, o.id);
    const unam = soloCookie((await pedir(`/simulador-unam/entrar/${token}`)).headers.get('set-cookie'));
    expect((await pedir('/api/simulador-ecoems/banco', { cookie: unam })).status).toBe(401);
  });

  it('el banco trae las 10 materias, sin áreas, con escala de aciertos sobre 128', async () => {
    const cookie = await entrar('simulador-ecoems-practica', 'b@mail.com');
    const b = await (await pedir('/api/simulador-ecoems/banco', { cookie })).json();
    expect(b.config).toMatchObject({ examen: 'ECOEMS', escala: 'aciertos', examenReactivos: 128, examenHoras: 3 });
    expect(b.areas).toBeNull();
    expect(Object.fromEntries(b.examen.map(s => [s.id, s.reactivos]))).toEqual(EXAMEN);
    expect(b.examen.reduce((t, s) => t + s.minutos, 0)).toBe(180);
    expect(b.secciones.reduce((t, s) => t + s.reactivos, 0)).toBe(64);
    expect(b.calentamiento.reduce((t, s) => t + s.reactivos, 0)).toBe(32);
    expect(b.reactivos).toHaveLength(320);
    const app = await pedir('/simulador-ecoems/', { cookie });
    expect(await app.text()).toContain('"app":"simulador-ecoems"');
  });

  it('el examen completo arma 128 reactivos con el reparto de cada materia, sin repetir', async () => {
    const cookie = await entrar('simulador-ecoems-completo', 'c@mail.com');
    const b = await (await pedir('/api/simulador-ecoems/banco', { cookie })).json();
    const r = await iniciar(cookie, 'examen');
    expect(r.status).toBe(200);
    const d = await r.json();
    const ids = d.items.flat();
    expect(ids).toHaveLength(128);
    expect(new Set(ids).size).toBe(128);
    const materia = Object.fromEntries(b.reactivos.map(x => [x.id, x.seccion]));
    expect(Object.fromEntries(b.examen.map((s, i) => [s.id, d.items[i].length]))).toEqual(EXAMEN);
    d.items.forEach((l, i) => l.forEach(id => expect(materia[id]).toBe(b.examen[i].id)));
    await abandonar(cookie, d.id);
    // el Simulador completo trae 2 exámenes y nada de práctica
    expect((await yo(cookie)).examenes).toMatchObject({ incluidos: 2 });
    expect((await iniciar(cookie, 'corto')).status).toBe(402);
  });

  it('Práctica ilimitada: Medio de 64 y Calentamiento de 32 sin repetir, sin examen completo', async () => {
    const cookie = await entrar('simulador-ecoems-practica', 'p@mail.com');
    const medio = await (await iniciar(cookie, 'corto')).json();
    expect(medio.items.flat()).toHaveLength(64);
    expect(new Set(medio.items.flat()).size).toBe(64);
    await abandonar(cookie, medio.id);
    const cal = await (await iniciar(cookie, 'calentamiento')).json();
    expect(cal.items.flat()).toHaveLength(32);
    await abandonar(cookie, cal.id);
    expect((await iniciar(cookie, 'examen')).status).toBe(402);
    const ofertas = (await yo(cookie)).ofertas;
    expect(ofertas.completo).toMatchObject({ slug: 'simulador-ecoems-completo', precio_centavos: 17900 });
  });

  it('guarda el resultado en aciertos (global hasta 128) sin área', async () => {
    const cookie = await entrar('simulador-ecoems-paquete', 'r@mail.com');
    const { id } = await (await iniciar(cookie, 'calentamiento')).json();
    const body = JSON.stringify({ modo: 'calentamiento', intento: id, area: '1', global: 500, meta: 90,
      secciones: [{ id: 'habilidad_verbal', puntaje: 75, aciertos: 3, total: 4, tiempo: 300, limite: 360 }] });
    expect((await pedir('/api/simulador-ecoems/resultados', { metodo: 'POST', cookie, body })).status).toBe(200);
    const h = (await yo(cookie)).historial[0];
    expect(h).toMatchObject({ modo: 'calentamiento', global: 128, meta: 90 });
    expect(h.area).toBeUndefined();
  });

  it('el catálogo muestra una sola tarjeta del simulador ECOEMS y el sitemap su página', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html.match(/data-buscar="simulador ecoems en linea /g)).toHaveLength(1);
    expect(html).not.toContain('simulador-ecoems-intento');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('<loc>https://vorka.mx/simulador-ecoems/</loc>');
  });
});
