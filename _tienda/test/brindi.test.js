import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken, correoEntrega } from '../src/entrega.js';

let env, A;
const pedir = ruta => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' } }), env);
async function comprar(slug, email = 'ana@mail.com', monto) {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Ana López' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: monto ?? o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  return o;
}

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  A = new Admin({}, env);
});

describe('Brindi en la tienda', () => {
  it('los productos entran ocultos y no se pueden comprar hasta activarlos', async () => {
    const ps = await A.productosApp('brindi');
    expect(ps).toHaveLength(11);
    expect(ps.every(p => !p.activo)).toBe(true);
    await expect(crearOrden(env, { items: [{ slug: 'brindi-celebracion' }], email: 'a@b.mx', nombre: 'Ana' })).rejects.toThrow('producto');
    const html = await (await pedir('/tienda/brindi/')).text();
    expect(html).toContain('Muy pronto');
    expect(html).not.toContain('id="form-brindi"');
    expect(html).toContain('https://os.vorka.mx/brindi/');   // se puede crear gratis
  });

  it('la ficha muestra planes, complementos, demostraciones, FAQ y el formulario con precios de la base', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_brindi_%'");
    const r = await pedir('/tienda/brindi/');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-security-policy')).toContain('frame-src https://os.vorka.mx');
    const html = await r.text();
    for (const t of ['$399 MXN', '$599 MXN', '$1,290 MXN', 'Recomendado', 'id="form-brindi"', 'value="brindi-celebracion" selected', '+100 invitados', '/i/demo-xv', 'QR de acceso', 'Powered by vorka.mx', 'FAQPage'])
      expect(html, t).toContain(t);
    expect((await pedir('/tienda/brindi')).status).toBe(301);
    // Las páginas de los planes ocultos llevan a la ficha
    expect((await pedir('/tienda/brindi-premium/')).headers.get('location')).toBe('/tienda/brindi/');
  });

  it('en el catálogo sale solo el plan Celebración, en su sección', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const html = await (await pedir('/tienda/')).text();
    expect(html).toContain('Invitaciones digitales');
    // Una sola tarjeta de Brindi, con su portada y el precio del plan más barato
    expect(html).toContain('Brindi · Invitaciones digitales');
    expect(html).toContain('/assets/tienda/brindi.webp');
    expect(html).toContain('Desde $399 MXN');
    expect(html).not.toContain('Brindi · Plan Premium');
    expect(html.match(/class="t-(?:hz-img|prod rv)[^>]*href="\/tienda\/brindi\/"/g)).toHaveLength(1);
    const mapa = await (await pedir('/tienda/sitemap.xml')).text();
    expect(mapa.match(/\/tienda\/brindi\//g)).toHaveLength(1);
  });

  it('el correo de compra lleva a os.vorka.mx con el texto de Brindi', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const o = await comprar('brindi-celebracion');
    const items = await env.DB.prepare('SELECT i.*, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?').bind(o.id).all();
    const c = correoEntrega(env, { ...o, regalo_de: null }, items.results, 'a'.repeat(64));
    expect(c.html).toContain(`https://os.vorka.mx/brindi/entrar/${'a'.repeat(64)}`);
    expect(c.texto).toContain('os.vorka.mx/brindi');
    expect(c.html).toContain('Crear mi invitación');
  });

  it('validarAcceso: solo tokens vigentes de órdenes pagadas con productos de la app', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const o = await comprar('brindi-premium');
    const { token } = await crearToken(env, o.id);
    expect(await A.validarAcceso(token, 'brindi')).toEqual({ order_id: o.id, email: 'ana@mail.com', nombre: 'Ana López' });
    expect(await A.validarAcceso(token, 'simulador-paa')).toBeNull();
    expect(await A.validarAcceso('f'.repeat(64), 'brindi')).toBeNull();
    expect(await A.validarAcceso('no-es-token', 'brindi')).toBeNull();
    // Otra compra (no Brindi) no da acceso
    const otra = await comprar('simulador-paa');
    expect(await A.validarAcceso((await crearToken(env, otra.id)).token, 'brindi')).toBeNull();
    // Reembolso: el token se revoca
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    expect(await A.validarAcceso(token, 'brindi')).toBeNull();
  });

  it('comprasApp devuelve los créditos por correo y marca los reembolsos', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const a = await comprar('brindi-celebracion');
    const b = await comprar('brindi-100-invitados');
    await comprar('brindi-esencial', 'otra@mail.com');
    let l = await A.comprasApp('ANA@mail.com', 'brindi');
    expect(l.map(x => x.order_id)).toEqual([a.id, b.id]);
    expect(l[0].items[0]).toMatchObject({ slug: 'brindi-celebracion', cantidad: 1, acceso: { app: 'brindi', tipo: 'plan', plan: 'celebracion' } });
    expect(l[1].items[0].acceso).toMatchObject({ tipo: 'invitados', cantidad: 100 });
    await aplicarPago(env, a.id, { resultado: 'reembolsado' });
    l = await A.comprasApp('ana@mail.com', 'brindi');
    expect(l.find(x => x.order_id === a.id).estado).toBe('refunded');
  });

  it('resumenApp cuenta visitas, compras, monto y reembolsos por producto', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    await pedir('/tienda/brindi/');
    await comprar('brindi-celebracion');
    const r = await comprar('brindi-celebracion', 'b@mail.com');
    await aplicarPago(env, r.id, { resultado: 'reembolsado' });
    const d = await A.resumenApp('brindi', {});
    const cel = d.productos.find(p => p.slug === 'brindi-celebracion');
    expect(cel).toMatchObject({ vistas: 1, compras: 1, monto_centavos: 59900, reembolsos: 1, activo: true, tipo: 'plan' });
  });
});
