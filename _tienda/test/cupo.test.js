import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { correoEntrega } from '../src/entrega.js';

let env, A;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' } }), env);
async function comprar(slug, email = 'org@mail.com') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Org Eventos' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  return o;
}
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  A = new Admin({}, env);
});

describe('Cupo en la tienda', () => {
  it('Cupo Pro y el paquete están a la venta, en su propia línea del catálogo', async () => {
    const ps = await A.productosApp('cupo');
    expect(ps.map(p => p.slug).sort()).toEqual(['cupo-paquete-5', 'cupo-pro']);
    const html = await (await pedir('/tienda/')).text();
    expect(html).toContain('href="#eventos"');
    expect(html).toContain('Eventos con registro y cover');
    expect(html).toContain('$139 MXN');
    const ficha = await (await pedir('/tienda/cupo-pro/')).text();
    expect(ficha).toContain('Tu evento con correos, recordatorios y cover');
    expect(ficha).toContain('¿Puedo armar mi evento antes de pagar?');
    expect(ficha).toContain('Pago único · un evento Pro');
    expect(ficha).not.toContain('por un año');
  });

  it('la compra lleva a os.vorka.mx/cupo y Vorka OS ve el paquete con sus 5 unidades', async () => {
    const o = await comprar('cupo-paquete-5');
    const items = await env.DB.prepare('SELECT i.*, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?').bind(o.id).all();
    const c = correoEntrega(env, { ...o, regalo_de: null }, items.results, 'a'.repeat(64));
    expect(c.html).toContain(`https://os.vorka.mx/cupo/entrar/${'a'.repeat(64)}`);
    expect(c.texto).toMatch(/Entrar a Cupo|os\.vorka\.mx\/cupo/);
    const compras = await A.comprasApp('org@mail.com', 'cupo');
    expect(compras[0].items[0].acceso).toMatchObject({ app: 'cupo', tipo: 'paquete', unidades: 5, meses: 12 });
  });
});

describe('Brindi o Cupo', () => {
  it('el catálogo, la página de Brindi y la ficha de Cupo explican cuál conviene', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_brindi_%'");
    for (const ruta of ['/tienda/', '/tienda/brindi/', '/tienda/cupo-pro/']) {
      const html = await (await pedir(ruta)).text();
      expect(html, ruta).toContain('¿Brindi o Cupo?');
      expect(html, ruta).toContain('Regla rápida');
    }
    expect(await (await pedir('/tienda/cupo-pro/')).text()).toContain('$139 MXN');
  });
});
