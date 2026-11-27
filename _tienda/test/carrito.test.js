// Carrito con descuento automático (src/carrito.js): 2 productos → 15 %, 3 o más → 25 % (nov 2026)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { productoPorSlug } from '../src/modelo.js';
import { enCarrito, descuentoCarrito, pctCarrito, enMensual } from '../src/carrito.js';

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
    const d = await (await get('/api/carrito?s=simulador-paa-practica,simulador-unam-paquete,simulador-paa-paquete,brindi-celebracion')).json();
    expect(d.items.map(x => x.slug)).toEqual(['simulador-unam-paquete', 'simulador-paa-paquete']);
    expect(d.fuera).toEqual(['brindi-celebracion']);
    expect(d.mensual).toBeNull();
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

// Fase 3: apps de negocio en el carrito, con precio de paquete cuando juntas las de uno
describe('mensualidad en el carrito', () => {
  it('entran los planes mensuales de Agenda, Vuelve, Brillo y Mostrador; no paquetes, anuales, complementos ni servicios', async () => {
    for (const s of ['agenda-mensual', 'vuelve-mensual', 'mostrador-mensual', 'brillo-basico-mensual']) expect(enMensual(await p(s)), s).toBe(true);
    for (const s of ['agenda-vuelve-mensual', 'agenda-anual', 'negocio-completo-mensual', 'pagina-web-mensual', 'vende-mensual', 'agenda-profesional-mensual', 'test-vocacional'])
      expect(enMensual(await p(s)), s).toBe(false);
  });

  it('Agenda + Vuelve se contratan como su paquete y dice cuánto ahorras', async () => {
    const d = await (await get('/api/carrito?s=test-vocacional,vuelve-mensual,agenda-mensual')).json();
    expect(d.items.map(x => x.slug)).toEqual(['test-vocacional']);              // lo único va aparte
    expect(d.pct).toBe(0);                                                        // las apps no cuentan para el 15 %
    expect(d.mensual.items.map(x => x.slug)).toEqual(['vuelve-mensual', 'agenda-mensual']);
    const paq = await p('agenda-vuelve-mensual'), suma = (await p('vuelve-mensual')).precio_centavos + (await p('agenda-mensual')).precio_centavos;
    expect(d.mensual.plan).toMatchObject({ slug: 'agenda-vuelve-mensual', paquete: true, precio: paq.precio_centavos, separado: suma, ahorro: suma - paq.precio_centavos });
    expect(d.mensual.legales.map(l => l.url)).toEqual(['/legal/vuelve/', '/legal/agenda/']);
  });

  it('una sola app se contrata sola y sugiere la que le falta para un paquete más barato', async () => {
    const d = await (await get('/api/carrito?s=vuelve-mensual')).json();
    expect(d.mensual.plan).toMatchObject({ slug: 'vuelve-mensual', paquete: false });
    const s = d.mensual.sugerencias.find(x => x.faltan.map(f => f.slug).join() === 'agenda-mensual');
    expect(s).toBeTruthy();
    expect(s.precio).toBe((await p('agenda-vuelve-mensual')).precio_centavos);
    expect(s.precio).toBeLessThan(s.separado);
  });

  it('si el paquete no sale más barato, cada app se contrata por separado', async () => {
    const d = await (await get('/api/carrito?s=brillo-basico-mensual,vuelve-mensual,agenda-mensual')).json();
    const suma = d.mensual.items.reduce((t, x) => t + x.precio, 0);
    if ((await p('brillo-paquete-mensual')).precio_centavos >= suma) { expect(d.mensual.plan).toBeNull(); expect(d.mensual.separadas).toBe(true); }
  });

  it('un plan nuevo de la misma app reemplaza al anterior', async () => {
    const d = await (await get('/api/carrito?s=brillo-basico-mensual,brillo-profesional-mensual')).json();
    expect(d.mensual.items.map(x => x.slug)).toEqual(['brillo-profesional-mensual']);
  });

  it('la página de Agenda ofrece agregar solo su plan mensual', async () => {
    const h = await (await get('/tienda/agenda/')).text();
    expect(h).toContain(`data-carrito-planes='{"agenda-mensual":"agenda"}'`);
  });

  it('el paquete se paga con el checkout de siempre (suscripción)', async () => {
    const r = await comprar({ slug: 'agenda-vuelve-mensual', nombre: 'Ana López', email: 'ana@mail.com', terminos: true });
    expect(r.status).toBe(200);
    expect(llamadas.find(l => String(l.url).includes('checkout/sessions')).params.get('mode')).toBe('subscription');
  });

  it('la página del carrito tiene su sección de mensualidad y el carrito quita solo lo pagado', async () => {
    const h = await (await get('/tienda/carrito/')).text();
    expect(h).toContain('id="car-mes"');
    expect(h).toContain("sessionStorage.setItem('vorka_carrito_pago',JSON.stringify(pagados))");
    expect(h).toContain('cancelado=');
  });
});
