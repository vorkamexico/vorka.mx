// Negocio Completo: /tienda/negocio-completo/, suscripción de $749 al mes (paquete Agenda + Vuelve + página web) con la
// «Arranque en 7 días» de $1,490 como casilla opcional de pago único (va en la misma sesión de Stripe, sin recurring).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';

let env, llamadas;
const pedir = (ruta, { metodo = 'GET', body } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': '1.1.1.1', ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@correo.mx', terminos: true, slug: 'negocio-completo-mensual', ...extra } });
const sesiones = () => llamadas.filter(l => l.url.endsWith('/checkout/sessions'));

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x' };
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url: String(url), params: new URLSearchParams(init.body) });
    if (String(url).endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    if (String(url).includes('/coupons/')) return new Response('{}', { status: 404 });
    if (String(url).endsWith('/coupons')) return new Response(JSON.stringify({ id: new URLSearchParams(init.body).get('id') || 'cup_1' }));
    const id = `cs_${llamadas.length}`;
    return new Response(JSON.stringify({ id, url: `https://checkout.stripe.com/c/pay/${id}` }));
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Negocio Completo', () => {
  it('la página muestra $749 al mes y el Arranque opcional de $1,490', async () => {
    const r = await pedir('/tienda/negocio-completo/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('$749');
    expect(h).toContain('name="instalacion"');
    expect(h).toContain('$1,490');
    expect(h).toContain('Arranque en 7 días');
    expect(h).toContain('transferencia');
    expect(h).toContain('plan de 12 meses');
    expect(h).not.toContain('plazo forzoso');
    expect(h).toContain('El dominio corre por tu cuenta');
    expect(h).toContain('¿Puedo bajar de plan?');
  });

  it('aparece en el catálogo con su tarjeta y su precio al mes; la instalación no', async () => {
    const h = await (await pedir('/tienda/')).text();
    expect(h).toContain('Negocio Completo · Página, agenda y lealtad');
    expect(h).toContain('/tienda/negocio-completo/');
    expect(h).not.toContain('Arranque en 7 días</');
  });

  it('la ficha genérica del producto lleva a su página', async () => {
    const r = await pedir('/tienda/negocio-completo-mensual/');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('/tienda/negocio-completo/');
  });

  it('sin instalación: suscripción de $749 al mes como paquete Agenda + Vuelve', async () => {
    expect((await comprar()).status).toBe(200);
    const o = env.DB.raw.prepare('SELECT * FROM orders').get();
    expect(o.monto_centavos).toBe(74900);
    const p = sesiones()[0].params;
    expect(p.get('mode')).toBe('subscription');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('74900');
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[1][price_data][unit_amount]')).toBeNull();
    expect(p.get('subscription_data[metadata][app]')).toBe('agenda-vuelve');
  });

  it('con instalación: el primer cobro suma $1,490 de pago único (sin recurring)', async () => {
    expect((await comprar({ instalacion: true })).status).toBe(200);
    expect(env.DB.raw.prepare('SELECT monto_centavos FROM orders').get().monto_centavos).toBe(74900 + 149000);
    const p = sesiones()[0].params;
    expect(p.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(p.get('line_items[1][price_data][unit_amount]')).toBe('149000');
    expect(p.get('line_items[1][price_data][recurring][interval]')).toBeNull();
    expect(p.get('subscription_data[metadata][product_id]')).toBe('prod_negocio_completo_mensual');
  });

  it('la liga del cupón de regalo trae el código escrito en la página', async () => {
    const h = await (await pedir('/tienda/negocio-completo/?cupon=REGALO-AB12-CD34')).text();
    expect(h).toContain('value="REGALO-AB12-CD34"');
  });

  it('cupón de regalo del 100 %: el primer mes sale en el cobro mínimo y la instalación se cobra completa', async () => {
    const cupon = codigo => env.DB.raw.prepare(`INSERT INTO cupones_regalo (codigo, lote, tipo, pct, alcance, product_id, max_usos, usos, hasta)
      VALUES (?, 'l1', 'pct', 100, 'producto', 'prod_negocio_completo_mensual', 1, 0, '2027-12-31')`).run(codigo);
    cupon('REGALO-AAAA-BBBB'); cupon('REGALO-CCCC-DDDD');
    expect((await comprar({ codigo: 'REGALO-AAAA-BBBB' })).status).toBe(200);
    expect((await comprar({ email: 'otra@correo.mx', codigo: 'REGALO-CCCC-DDDD', instalacion: true })).status).toBe(200);
    const montos = env.DB.raw.prepare('SELECT email, monto_centavos FROM orders ORDER BY email').all();
    expect(montos).toEqual([{ email: 'laura@correo.mx', monto_centavos: 1000 }, { email: 'otra@correo.mx', monto_centavos: 149000 }]);
  });

  it('la instalación no se compra sola ni con otro plan', async () => {
    const sola = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Laura Pérez', email: 'laura@correo.mx', terminos: true, slug: 'negocio-completo-instalacion' } });
    expect(sola.status).toBe(400);
    const otro = await comprar({ slug: 'pagina-web-mensual', instalacion: true });
    expect(otro.status).toBe(400);
    expect(sesiones()).toHaveLength(0);
  });
});
