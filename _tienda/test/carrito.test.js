// Carrito con descuento automático (src/carrito.js): 2 productos → 15 %, 3 o más → 25 % (nov 2026)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { productoPorSlug } from '../src/modelo.js';
import { enCarrito, descuentoCarrito, pctCarrito } from '../src/carrito.js';

let env, llamadas;
function stripeFalso() {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, params: new URLSearchParams(init?.body) });
    if (String(url).endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    if (String(url).includes('/coupons')) return new Response(JSON.stringify({ id: 'cupon_1' }));
    return new Response(JSON.stringify({ id: `cs_test_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/x' }));
  }));
}
const get = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual' }), env);
const comprar = body => worker.fetch(new Request('https://vorka.mx/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1' }, body: JSON.stringify(body) }), env);
const base = { carrito: true, nombre: 'Ana López', email: 'ana@mail.com', terminos: true };
const ordenes = () => env.DB.raw.prepare('SELECT * FROM orders ORDER BY created_at').all();
const p = slug => productoPorSlug(env, slug);

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x' };
  env.DB.raw.exec('UPDATE products SET activo = 1;');
  stripeFalso();
});
afterEach(() => vi.unstubAllGlobals());

describe('qué entra al carrito', () => {
  it('simuladores, tests, liderazgo y Ruta sí; paquetes, adicionales, licencias y suscripciones no', async () => {
    for (const s of ['simulador-paa-paquete', 'simulador-unam-practica', 'test-vocacional', 'evaluacion-liderazgo', 'que-proyecto-social', 'ruta-de-impacto'])
      expect(enCarrito(await p(s)), s).toBe(true);
    for (const s of ['simuladores-universidad', 'simulador-paa-intento', 'test-vocacional-grupo-10', 'vuelve-mensual', 'agenda-mensual', 'brindi-celebracion'])
      expect(enCarrito(await p(s)), s).toBe(false);
    expect([pctCarrito(1), pctCarrito(2), pctCarrito(3), pctCarrito(5)]).toEqual([0, 15, 25, 25]);
    // Dos planes del mismo simulador cuentan como uno
    expect(descuentoCarrito([await p('simulador-paa-paquete'), await p('simulador-paa-practica')])).toBeNull();
  });
});

describe('GET /api/carrito', () => {
  it('suma, aplica el % y deja el último plan elegido de cada simulador', async () => {
    const d = await (await get('/api/carrito?s=simulador-paa-practica,simulador-unam-paquete,simulador-paa-paquete,vuelve-mensual')).json();
    expect(d.items.map(x => x.slug)).toEqual(['simulador-unam-paquete', 'simulador-paa-paquete']);
    expect(d.fuera).toEqual(['vuelve-mensual']);
    expect(d.pct).toBe(15);
    expect(d.total).toBe(d.subtotal - Math.round(d.subtotal * 0.15));
    expect(d.siguiente).toEqual({ faltan: 1, pct: 25 });
    expect(d.sugerencias.every(x => !['simulador-unam', 'simulador-paa'].includes(x.app))).toBe(true);
    const tres = await (await get('/api/carrito?s=simulador-paa-paquete,test-vocacional,evaluacion-liderazgo')).json();
    expect([tres.pct, tres.siguiente]).toEqual([25, null]);
  });
});

describe('compra del carrito', () => {
  it('3 productos: una sola orden con 25 % de descuento y el cupón en Stripe', async () => {
    const r = await comprar({ ...base, items: [{ slug: 'simulador-paa-paquete' }, { slug: 'test-vocacional' }, { slug: 'evaluacion-liderazgo' }] });
    expect(r.status).toBe(200);
    const [o] = ordenes();
    const sub = (await p('simulador-paa-paquete')).precio_centavos + (await p('test-vocacional')).precio_centavos + (await p('evaluacion-liderazgo')).precio_centavos;
    expect(o).toMatchObject({ descuento_codigo: 'CARRITO', descuento_pct: 25, monto_centavos: sub - Math.round(sub * 0.25) });
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM order_items WHERE order_id = ?').get(o.id).n).toBe(3);
  });

  it('rechaza suscripciones, regalos y dos planes del mismo simulador', async () => {
    expect((await comprar({ ...base, items: [{ slug: 'simulador-paa-paquete' }, { slug: 'vuelve-mensual' }] })).status).toBe(400);
    expect((await comprar({ ...base, regalo: true, items: [{ slug: 'simulador-paa-paquete' }, { slug: 'test-vocacional' }] })).status).toBe(400);
    const r = await comprar({ ...base, items: [{ slug: 'simulador-paa-paquete' }, { slug: 'simulador-paa-practica' }] });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/dos planes del mismo producto/);
    expect(ordenes()).toHaveLength(0);
  });

  it('un solo producto en el carrito no lleva descuento', async () => {
    expect((await comprar({ ...base, items: [{ slug: 'test-vocacional' }] })).status).toBe(200);
    expect(ordenes()[0].descuento_codigo).toBeNull();
  });
});

describe('páginas', () => {
  it('la página del carrito, el botón en las fichas y los simuladores sin paquetes fijos', async () => {
    const c = await get('/tienda/carrito/');
    expect(c.status).toBe(200);
    expect(await c.text()).toContain('id="car-form"');
    expect((await get('/tienda/carrito')).status).toBe(301);
    expect(await (await get('/tienda/evaluacion-liderazgo/')).text()).toContain('data-carrito="liderazgo"');
    expect(await (await get('/simulador-paa/?plan=paquete')).text()).toMatch(/data-carrito="simulador-paa"/);
    const sims = await (await get('/tienda/simuladores/')).text();
    expect(sims).toContain('data-carrito-slug="simulador-unam-paquete"');
    expect(sims).not.toContain('id="paquetes"');
    // Liga vieja de un paquete: sigue vendiéndose
    expect(await (await get('/tienda/simuladores/?paquete=simuladores-universidad')).text()).toContain('id="paquetes"');
    // El script del carrito está en toda la tienda
    expect(await (await get('/tienda/')).text()).toContain('vorka_carrito');
  });
});
