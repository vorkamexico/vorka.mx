// Carrito con descuento automático (src/carrito.js): 2 productos → 15 %, 3 o más → 25 % (nov 2026)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { productoPorSlug } from '../src/modelo.js';
import { enCarrito, descuentoCarrito, pctCarrito, enSuscripcion } from '../src/carrito.js';

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
  it('pago único: todo lo de Vorka (también Brindi y Cupo) menos adicionales, licencias, accesorios de Brindi y suscripciones', async () => {
    for (const s of ['simulador-paa-paquete', 'simulador-unam-practica', 'test-vocacional', 'evaluacion-liderazgo', 'que-proyecto-social', 'ruta-de-impacto', 'brindi-celebracion', 'brindi-premium', 'cupo-pro'])
      expect(enCarrito(await p(s)), s).toBe(true);
    for (const s of ['simuladores-universidad', 'simulador-paa-intento', 'test-vocacional-grupo-10', 'vuelve-mensual', 'agenda-mensual', 'brindi-musica', 'brindi-mejora-esencial', 'pagina-web-diseno'])
      expect(enCarrito(await p(s)), s).toBe(false);
    expect([pctCarrito(1), pctCarrito(2), pctCarrito(3), pctCarrito(5)]).toEqual([0, 15, 25, 25]);
    // Dos planes del mismo simulador cuentan como uno
    expect(descuentoCarrito([await p('simulador-paa-paquete'), await p('simulador-paa-practica')])).toBeNull();
  });
});

describe('GET /api/carrito', () => {
  it('suma, aplica el % y deja el último plan elegido de cada simulador', async () => {
    const d = await (await get('/api/carrito?s=simulador-paa-practica,simulador-unam-paquete,simulador-paa-paquete,brindi-musica')).json();
    expect(d.items.map(x => x.slug)).toEqual(['simulador-unam-paquete', 'simulador-paa-paquete']);
    expect(d.fuera).toEqual(['brindi-musica']);
    expect(d.quitados).toEqual(['simulador-paa-practica']);
    expect(d.suscripciones).toBeNull();
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

// Suscripciones en el carrito: todas (mensuales y anuales); precio de paquete automático cuando conviene
describe('suscripciones en el carrito', () => {
  it('entran todos los planes (mensual, anual, paquetes, página web, Negocio Completo); no complementos ni instalaciones', async () => {
    for (const s of ['agenda-mensual', 'vuelve-anual', 'agenda-vuelve-mensual', 'negocio-completo-mensual', 'pagina-web-mensual', 'vende-mensual', 'clara-mensual'])
      expect(enSuscripcion(await p(s)), s).toBe(true);
    for (const s of ['agenda-profesional-mensual', 'vuelve-sucursal-mensual', 'pagina-web-diseno', 'test-vocacional']) expect(enSuscripcion(await p(s)), s).toBe(false);
  });

  it('Agenda + Vuelve se cobran como su paquete; lo de pago único va aparte y sin contar las apps para el %', async () => {
    const d = await (await get('/api/carrito?s=test-vocacional,vuelve-mensual,agenda-mensual')).json();
    expect(d.items.map(x => x.slug)).toEqual(['test-vocacional']);
    expect(d.pct).toBe(0);
    const S = d.suscripciones, suma = (await p('vuelve-mensual')).precio_centavos + (await p('agenda-mensual')).precio_centavos;
    expect(S.items.map(x => x.slug)).toEqual(['vuelve-mensual', 'agenda-mensual']);
    expect(S.cobros).toHaveLength(1);
    expect(S.cobros[0]).toMatchObject({ slug: 'agenda-vuelve-mensual', paga: ['vuelve-mensual', 'agenda-mensual'], ahorro: suma - (await p('agenda-vuelve-mensual')).precio_centavos });
    expect(d.legales.map(l => l.url)).toEqual(['/legal/vuelve/', '/legal/agenda/']);
  });

  it('una app sola sugiere la que le falta para un paquete más barato', async () => {
    const d = await (await get('/api/carrito?s=vuelve-mensual')).json();
    expect(d.suscripciones.cobros.map(c => c.slug)).toEqual(['vuelve-mensual']);
    expect(d.suscripciones.sugerencia.ahorro).toBeGreaterThan(0);
  });

  it('página + Agenda + Vuelve = Negocio Completo', async () => {
    const d = await (await get('/api/carrito?s=pagina-web-mensual,agenda-mensual,vuelve-mensual')).json();
    expect(d.suscripciones.cobros.map(c => c.slug)).toEqual(['negocio-completo-mensual']);
  });

  it('anuales y apps sin paquete: un cobro por cada una; la página web avisa su diseño de una vez', async () => {
    const d = await (await get('/api/carrito?s=vuelve-anual,clara-mensual,pagina-web-mensual')).json();
    expect(d.suscripciones.cobros.map(c => c.slug)).toEqual(['vuelve-anual', 'clara-mensual', 'pagina-web-mensual']);
    expect(d.suscripciones.items.find(x => x.slug === 'vuelve-anual').cada).toBe('al año');
    expect(d.suscripciones.items.find(x => x.slug === 'pagina-web-mensual').instalacion).toBeGreaterThan(0);
  });

  it('un plan que cubre una app ya elegida la reemplaza', async () => {
    const d = await (await get('/api/carrito?s=agenda-mensual,agenda-vuelve-anual')).json();
    expect(d.suscripciones.items.map(x => x.slug)).toEqual(['agenda-vuelve-anual']);
    expect(d.quitados).toEqual(['agenda-mensual']);
  });

  it('cada página ofrece agregar sus planes con su nombre', async () => {
    const h = await (await get('/tienda/agenda/')).text();
    expect(h).toMatch(/data-carrito-planes='\{"agenda-mensual":"agenda","agenda-anual":"agenda"/);
    expect(h).toContain('"agenda-vuelve-mensual":"Agenda + Vuelve"');
    for (const r of ['/tienda/vende/', '/tienda/clara/', '/tienda/brindi/', '/tienda/cupo/', '/tienda/pagina-web/', '/tienda/negocio-completo/'])
      expect(await (await get(r)).text(), r).toContain("data-carrito-planes='");
  });

  it('el paquete se paga con el checkout de siempre (suscripción) y Brindi entra al carrito de pago único', async () => {
    const r = await comprar({ slug: 'agenda-vuelve-mensual', nombre: 'Ana López', email: 'ana@mail.com', terminos: true });
    expect(r.status).toBe(200);
    expect(llamadas.find(l => String(l.url).includes('checkout/sessions')).params.get('mode')).toBe('subscription');
    const r2 = await comprar({ ...base, items: [{ slug: 'brindi-celebracion' }, { slug: 'test-vocacional' }] });
    expect(r2.status).toBe(200);
  });

  it('la página del carrito: cajas de pago único y suscripciones, y quita solo lo pagado', async () => {
    const h = await (await get('/tienda/carrito/')).text();
    expect(h).toContain('id="car-sus"');
    expect(h).toContain("sessionStorage.setItem('vorka_carrito_pago',JSON.stringify(pagados))");
    expect(h).toContain('t-car-sigue');
  });
});
