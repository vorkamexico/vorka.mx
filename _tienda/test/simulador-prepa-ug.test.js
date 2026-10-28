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
  const r = await pedir(`/simulador-prepa-ug/entrar/${token}`);
  expect(r.status).toBe(303); expect(r.headers.get('location')).toBe('/simulador-prepa-ug/');
  return soloCookie(r.headers.get('set-cookie'));
};
const iniciar = (cookie, tipo) => pedir('/api/simulador-prepa-ug/iniciar', { metodo: 'POST', cookie, body: JSON.stringify({ tipo }) });
const yo = async cookie => (await pedir('/api/simulador-prepa-ug/yo', { cookie })).json();
const abandonar = (cookie, id) => pedir('/api/simulador-prepa-ug/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id }) });

// Ficha técnica de la UG (ago-dic 2026): 160 reactivos en 5 áreas
const EXAMEN = { comprension_lectora: 30, redaccion_indirecta: 30, pensamiento_matematico: 40, pensamiento_cientifico: 30, ingles: 30 };

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec("UPDATE products SET activo = 1");
});

describe('simulador prepa UG', () => {
  it('entra inactivo: sin activarlo, la página dice "muy pronto" y no vende', async () => {
    env = { ...env, DB: d1() };
    const html = await (await pedir('/simulador-prepa-ug/')).text();
    expect(html).toContain('Muy pronto');
    expect(html).not.toContain('name="slug" value="simulador-prepa-ug-');
  });

  it('página pública con sus planes de $129, $179 y $249, solo datos verificados y el aviso de no afiliación', async () => {
    const r = await pedir('/simulador-prepa-ug/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<title>Simulador EXANI-I 2027 para la prepa de la UG');
    expect(html).toContain('rel="canonical" href="https://vorka.mx/simulador-prepa-ug/"');
    for (const p of ['$129', '$179', '$249']) expect(html).toContain(p);
    expect(html).toContain('name="slug" value="simulador-prepa-ug-paquete"');   // arranca en el Completo (el recomendado)
    expect(html).toContain('Ahorras $59 MXN');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('No está afiliado a la Universidad de Guanajuato, a CENEVAL ni a la Secretaría de Educación de Guanajuato');
    expect(html).toContain('Todavía no hay convocatoria publicada para entrar a primer semestre en 2027');
    for (const d of ['70 %', '22 de mayo', '19 de junio', '27 %', '26 %']) expect(html).toContain(d);
    expect(html).not.toMatch(/College Board|exámenes oficiales|examen oficial de la UG|Índice CENEVAL de/);
    expect(html).not.toMatch(/<img[^>]+(ugto|escudo|ceneval)/i);   // sin logos ni escudos de la UG o de CENEVAL
    expect(html.indexOf('id="sv-ej"')).toBeLessThan(html.indexOf('id="comprar"'));
    // el reactivo de muestra trae 3 opciones, como el EXANI-I
    const ej = html.slice(html.indexOf('id="sv-ej"'), html.indexOf('id="comprar"'));
    expect((ej.match(/<button type="button" data-o=/g) || []).length).toBe(3);
    expect(html).not.toContain('/simulador-ecoems/app.js');
  });

  it('la cookie de la prepa UG no abre el ECOEMS, el UNAM ni el PAA, y al revés', async () => {
    const ug = await entrar('simulador-prepa-ug-paquete', 'e@mail.com');
    expect((await pedir('/api/simulador-prepa-ug/banco', { cookie: ug })).status).toBe(200);
    expect((await pedir('/api/simulador-unam/banco', { cookie: ug })).status).toBe(401);
    expect((await pedir('/api/simulador-ecoems/banco', { cookie: ug })).status).toBe(401);
    expect((await pedir('/api/simulador-paa/banco', { cookie: ug })).status).toBe(401);
    const o = await comprar('simulador-unam-paquete', 'u@mail.com'); const { token } = await crearToken(env, o.id);
    const unam = soloCookie((await pedir(`/simulador-unam/entrar/${token}`)).headers.get('set-cookie'));
    expect((await pedir('/api/simulador-prepa-ug/banco', { cookie: unam })).status).toBe(401);
  });

  it('el banco trae las 5 áreas con 3 opciones, escala de aciertos sobre 160 y los pesos de la ficha', async () => {
    const cookie = await entrar('simulador-prepa-ug-practica', 'b@mail.com');
    const b = await (await pedir('/api/simulador-prepa-ug/banco', { cookie })).json();
    expect(b.config).toMatchObject({ examen: 'EXANI-I', escala: 'aciertos', examenReactivos: 160, examenHoras: 4.5,
      ponderacion: { comprension_lectora: 20, redaccion_indirecta: 20, pensamiento_matematico: 27, pensamiento_cientifico: 26, ingles: 7 } });
    expect(b.areas).toBeNull();
    expect(Object.fromEntries(b.examen.map(s => [s.id, s.reactivos]))).toEqual(EXAMEN);
    expect(b.examen.reduce((t, s) => t + s.minutos, 0)).toBe(270);
    expect(b.secciones.reduce((t, s) => t + s.reactivos, 0)).toBe(80);
    expect(b.calentamiento.reduce((t, s) => t + s.reactivos, 0)).toBe(42);
    expect(b.reactivos).toHaveLength(400);
    for (const x of b.reactivos) { expect(x.opciones).toHaveLength(3); expect([0, 1, 2]).toContain(x.correcta); }
    // Comprensión lectora: todo sobre lecturas, de 3 o 6 preguntas
    const lec = b.reactivos.filter(x => x.seccion === 'comprension_lectora');
    expect(lec.every(x => x.texto && b.textos[x.texto])).toBe(true);
    const porTexto = {}; lec.forEach(x => { porTexto[x.texto] = (porTexto[x.texto] || 0) + 1; });
    for (const n of Object.values(porTexto)) expect([3, 6]).toContain(n);
    const app = await pedir('/simulador-prepa-ug/', { cookie });
    expect(await app.text()).toContain('"app":"simulador-prepa-ug"');
  });

  it('el examen completo arma 160 reactivos con el reparto de cada área, sin repetir', async () => {
    const cookie = await entrar('simulador-prepa-ug-completo', 'c@mail.com');
    const b = await (await pedir('/api/simulador-prepa-ug/banco', { cookie })).json();
    const r = await iniciar(cookie, 'examen');
    expect(r.status).toBe(200);
    const d = await r.json();
    const ids = d.items.flat();
    expect(ids).toHaveLength(160);
    expect(new Set(ids).size).toBe(160);
    const materia = Object.fromEntries(b.reactivos.map(x => [x.id, x.seccion]));
    expect(Object.fromEntries(b.examen.map((s, i) => [s.id, d.items[i].length]))).toEqual(EXAMEN);
    d.items.forEach((l, i) => l.forEach(id => expect(materia[id]).toBe(b.examen[i].id)));
    await abandonar(cookie, d.id);
    // el Simulador completo trae 2 exámenes y nada de práctica
    expect((await yo(cookie)).examenes).toMatchObject({ incluidos: 2 });
    expect((await iniciar(cookie, 'corto')).status).toBe(402);
  });

  it('Práctica: Medio de 80 y Calentamiento de 42 sin repetir, sin examen completo', async () => {
    const cookie = await entrar('simulador-prepa-ug-practica', 'p@mail.com');
    const medio = await (await iniciar(cookie, 'corto')).json();
    expect(medio.items.flat()).toHaveLength(80);
    expect(new Set(medio.items.flat()).size).toBe(80);
    await abandonar(cookie, medio.id);
    const cal = await (await iniciar(cookie, 'calentamiento')).json();
    expect(cal.items.flat()).toHaveLength(42);
    await abandonar(cookie, cal.id);
    expect((await iniciar(cookie, 'examen')).status).toBe(402);
    const ofertas = (await yo(cookie)).ofertas;
    expect(ofertas.completo).toMatchObject({ slug: 'simulador-prepa-ug-completo', precio_centavos: 17900 });
  });

  it('guarda el resultado en aciertos (global hasta 160) sin área', async () => {
    const cookie = await entrar('simulador-prepa-ug-paquete', 'r@mail.com');
    const { id } = await (await iniciar(cookie, 'calentamiento')).json();
    const body = JSON.stringify({ modo: 'calentamiento', intento: id, area: '1', global: 500, meta: 100,
      secciones: [{ id: 'comprension_lectora', puntaje: 75, aciertos: 3, total: 4, tiempo: 300, limite: 360 }] });
    expect((await pedir('/api/simulador-prepa-ug/resultados', { metodo: 'POST', cookie, body })).status).toBe(200);
    const h = (await yo(cookie)).historial[0];
    expect(h).toMatchObject({ modo: 'calentamiento', global: 160, meta: 100 });
    expect(h.area).toBeUndefined();
  });

  it('el catálogo muestra una sola tarjeta del simulador prepa UG y el sitemap su página', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html.match(/data-buscar="simulador ecoems en linea /g)).toHaveLength(1);
    expect(html).not.toContain('simulador-prepa-ug-intento');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('<loc>https://vorka.mx/simulador-prepa-ug/</loc>');
  });
});
