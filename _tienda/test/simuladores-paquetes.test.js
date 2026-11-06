// Paquetes de simuladores (migración 0077) y la página vorka.mx/tienda/simuladores/: el paquete cuenta como plan Completo en
// cada simulador que incluye, el enlace del correo entra una vez a cada uno, y en la tienda los simuladores son una tarjeta.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken } from '../src/entrega.js';
import { simuladorDe } from '../src/simulador/index.js';

let env;
const pedir = (ruta, { cookie } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone)', ...(cookie ? { cookie } : {}) } }), env);
async function comprar(slug, email = 'ana@mail.com') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Ana López' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  return o;
}
const cookieDe = r => (r.headers.get('set-cookie') || '').split(';')[0];

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 201 })));
});
afterEach(() => vi.unstubAllGlobals());

describe('paquetes de simuladores', () => {
  it('se venden activos a $499, $549 y $699', () => {
    const p = Object.fromEntries(env.DB.raw.prepare("SELECT slug, precio_centavos, activo FROM products WHERE slug LIKE 'simuladores-%'").all().map(x => [x.slug, [x.precio_centavos, x.activo]]));
    expect(p).toEqual({ 'simuladores-unam-ipn': [49900, 1], 'simuladores-paa-unam': [54900, 1], 'simuladores-paa-ipn': [54900, 1], 'simuladores-universidad': [69900, 1] });
  });

  it('UNAM + IPN da el plan Completo en los dos (con plan de estudio y 2 exámenes) y no abre el PAA', async () => {
    const o = await comprar('simuladores-unam-ipn');
    for (const app of ['simulador-unam', 'simulador-ipn']) {
      const s = simuladorDe(app), a = await s.ordenConAcceso(env, o.id);
      expect(a, app).toBeTruthy();
      const cookie = (await s.cookieAcceso(env, o.id, a.vence)).split(';')[0];
      const yo = await (await pedir(`/api/${app}/yo`, { cookie })).json();
      expect(yo.plan, app).toMatchObject({ paquete: true, practica: true, estudio: true });
      expect(yo.examenes.incluidos, app).toBe(2);
    }
    expect(await simuladorDe('simulador-paa').ordenConAcceso(env, o.id)).toBeNull();
  });

  it('el enlace del correo entra directo una vez a cada simulador del paquete', async () => {
    const o = await comprar('simuladores-universidad');
    const { token } = await crearToken(env, o.id);
    for (const app of ['simulador-paa', 'simulador-unam', 'simulador-ipn']) {
      const r = await pedir(`/${app}/entrar/${token}`);
      expect([302, 303], app).toContain(r.status);
      expect(cookieDe(r), app).toMatch(/=/);
    }
    // La segunda vez en el mismo simulador ya pide el código del correo (no entra directo)
    const otra = await pedir(`/simulador-unam/entrar/${token}`);
    expect(otra.headers.get('set-cookie') || '').toBe('');
  });

  it('la página de su compra trae un botón por simulador', async () => {
    const o = await comprar('simuladores-paa-ipn');
    const { token } = await crearToken(env, o.id);
    const html = await (await pedir(`/descargas/${token}`)).text();
    expect(html).toContain(`/simulador-paa/entrar/${token}`);
    expect(html).toContain(`/simulador-ipn/entrar/${token}`);
    expect(html).not.toContain(`/simuladores/entrar/`);
  });
});

describe('vorka.mx/tienda/simuladores', () => {
  it('muestra los 5 simuladores y los 4 paquetes; ?paquete= elige cuál se compra', async () => {
    const r = await pedir('/tienda/simuladores/');
    expect(r.status).toBe(200);
    const html = await r.text();
    for (const app of ['simulador-paa', 'simulador-unam', 'simulador-ipn', 'simulador-ecoems', 'simulador-prepa-ug']) expect(html).toContain(`href="/${app}/"`);
    for (const slug of ['simuladores-universidad', 'simuladores-unam-ipn', 'simuladores-paa-unam', 'simuladores-paa-ipn']) expect(html).toContain(`?paquete=${slug}`);
    expect(html).toContain('name="slug" value="simuladores-universidad"');
    const otro = await (await pedir('/tienda/simuladores/?paquete=simuladores-unam-ipn')).text();
    expect(otro).toContain('name="slug" value="simuladores-unam-ipn"');
  });

  it('la ficha suelta de un paquete lleva a la página con ese paquete elegido', async () => {
    const r = await pedir('/tienda/simuladores-paa-unam/');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('https://vorka.mx/tienda/simuladores/?paquete=simuladores-paa-unam#comprar');
  });

  it('en el catálogo de la tienda los simuladores y paquetes son una sola tarjeta', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html).toContain('href="/tienda/simuladores/"');
    expect(html).not.toContain('href="/simulador-paa/"');
    expect(html).not.toContain('href="/simulador-ipn/"');
  });
});
