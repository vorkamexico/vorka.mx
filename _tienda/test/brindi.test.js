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
    expect(ps).toHaveLength(14);
    // Entran ocultos; el álbum de invitados se puso a la venta con la migración 0035 (después de publicar os.vorka.mx)
    expect(ps.filter(p => !['brindi-album', 'brindi-intimo', 'brindi-mejora-esencial'].includes(p.slug)).every(p => !p.activo)).toBe(true);   // los de 0034–0036 se pusieron a la venta ya aprobados
    expect(ps.find(p => p.slug === 'brindi-album').activo).toBe(true);
    await expect(crearOrden(env, { items: [{ slug: 'brindi-celebracion' }], email: 'a@b.mx', nombre: 'Ana' })).rejects.toThrow('producto');
    // Sin ningún plan a la venta, la página no ofrece pagar (pero sí crear gratis)
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE id = 'prod_brindi_intimo'");
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
    for (const t of ['$299 MXN', '$449 MXN', '$699 MXN', '$1,290 MXN', 'Hasta <b>150</b>', 'Hasta <b>600</b>', 'Recomendado', 'id="form-brindi"', 'value="brindi-celebracion" data-precio="69900" selected', '+100 invitados', '/i/demo-xv', 'QR de acceso', 'Powered by vorka.mx', 'FAQPage'])
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
    expect(html).toContain('Desde $299 MXN');
    expect(html).not.toContain('Brindi · Plan Premium');
    expect(html.match(/class="t-card-img" href="\/tienda\/brindi\/"/g)).toHaveLength(1);
    const mapa = await (await pedir('/tienda/sitemap.xml')).text();
    expect(mapa.match(/\/tienda\/brindi\/<\/loc>/g)).toHaveLength(1);
    for (const k of ['bodas', 'xv-anos', 'bautizo', 'graduacion', 'posadas', 'organizadores']) expect(mapa, k).toContain(`/tienda/brindi/${k}/</loc>`);
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
    expect(cel).toMatchObject({ vistas: 1, compras: 1, monto_centavos: 69900, reembolsos: 1, activo: true, tipo: 'plan' });
  });

  it('un plan con complementos en la misma compra: un solo correo de acceso y todo queda para la app', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const o = await crearOrden(env, { items: [{ slug: 'brindi-celebracion' }, { slug: 'brindi-100-invitados' }, { slug: 'brindi-configuracion-asistida' }], email: 'multi@mail.com', nombre: 'Ana López' });
    expect(o.monto_centavos).toBe(69900 + 14900 + 39900);
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
    const items = await env.DB.prepare('SELECT i.*, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?').bind(o.id).all();
    const c = correoEntrega(env, { ...o, regalo_de: null }, items.results, 'b'.repeat(64));
    expect(c.html).toContain(`https://os.vorka.mx/brindi/entrar/${'b'.repeat(64)}`);
    const compras = await A.comprasApp('multi@mail.com', 'brindi');
    expect(compras).toHaveLength(1);
    expect(compras[0].items.map(x => x.slug).sort()).toEqual(['brindi-100-invitados', 'brindi-celebracion', 'brindi-configuracion-asistida']);
  });

  it('navegar la tienda: barra de líneas, sin "Sigue explorando" (distrae al que organiza su evento) y complementos para sumar al plan', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1");
    const html = await (await pedir('/tienda/brindi/')).text();
    expect(html).toContain('class="t-nav-tienda"');
    expect(html).toMatch(/href="\/tienda\/brindi\/" aria-current="page"/);
    expect(html).not.toContain('Sigue explorando');
    expect(html).not.toContain('Regla rápida');   // Brindi o Cupo queda en una línea
    expect(html).toContain('href="/tienda/cupo/">Cupo</a> es gratis hasta 30 personas');
    expect(html).toContain('id="br-suma"');
    expect(html).toContain('value="brindi-100-invitados" data-precio="14900"');
    expect(html).toContain('<option value="brindi-celebracion" data-precio="69900" selected');
    expect(html).not.toMatch(/name="extra" value="brindi-mejora/);   // las mejoras no se suman a un plan nuevo
    const cupo = await (await pedir('/tienda/cupo/')).text();
    expect(cupo).toContain('Sigue explorando');
    expect(cupo).toMatch(/href="\/tienda\/cupo\/" aria-current="page"/);
  });

  it('el camino principal es crearla gratis: botón fijo en celular, planes que llevan a la app y el pago para quien ya la creó', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_brindi_%'");
    const html = await (await pedir('/tienda/brindi/')).text();
    expect(html).toContain('id="barra-brindi"');
    expect(html.match(/>Empezar gratis</g)).toHaveLength(4);
    expect(html).toContain('¿Ya la creaste? Paga Premium aquí');
    expect(html).toContain('¿Ya la creaste? Paga aquí');
    expect(html).toContain('<details class="br-compl">');   // complementos plegados
    expect(html).toContain('href="https://soyimpacto.org/"');
    expect(html).toContain('Imprimir 200 invitaciones con sobre: desde $9,000 MXN');
    expect(html).toContain('https://www.eventplannermexico.mx/invitaciones-para-eventos/');
    expect(html).toContain('/brindi/og/gala.webp');
    expect(html).toContain('Diseño Gala · incluido en Premium o +$149 MXN en otro plan');
    // Gala no se ofrece junto con Premium (ya lo incluye)
    expect(html).toContain('value="brindi-plantilla-premium" data-precio="14900" data-incluido-en="brindi-premium"');
    expect(html).toContain('value="brindi-album" data-precio="19900" data-incluido-en="brindi-premium"');
    expect(html).toContain('Álbum de fotos de tus invitados');
  });

  it('el WhatsApp de la página habla de Brindi, no de la consultoría', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_brindi_%'");
    const html = await (await pedir('/tienda/brindi/bodas/')).text();
    const msg = encodeURIComponent('Hola, tengo dudas sobre Brindi para mi boda.');
    expect(html.split(`wa.me/528117804869?text=${msg}`).length - 1).toBe(2);   // preguntas frecuentes y pie
    expect(html).not.toContain('ya%20decid%C3%AD%20avanzar');
  });

  it('páginas por tipo de evento: título, demostración y canónica propios; las desconocidas no existen', async () => {
    env.DB.raw.exec("UPDATE products SET activo = 1 WHERE id LIKE 'prod_brindi_%'");
    const xv = await (await pedir('/tienda/brindi/xv-anos/')).text();
    expect(xv).toContain('<title>Invitaciones digitales para XV años con QR | Brindi</title>');
    expect(xv).toContain('<link rel="canonical" href="https://vorka.mx/tienda/brindi/xv-anos/">');
    expect(xv).toContain('<iframe src="https://os.vorka.mx/i/demo-xv"');
    const org = await (await pedir('/tienda/brindi/organizadores/')).text();
    expect(org).toContain('<option value="brindi-paquete-organizador" data-precio="279000" selected');
    expect(org).toContain('Gana con tu liga');
    expect(org).toContain('Diseños con tu marca');
    expect(org).toContain('https://os.vorka.mx/brindi/#/organizador');
    expect(org).toContain('Compra tu paquete');
    const pos = await (await pedir('/tienda/brindi/posadas/')).text();
    expect(pos).toContain('<option value="brindi-premium" data-precio="129000" selected');
    expect((await pedir('/tienda/brindi/bodas')).status).toBe(301);
    expect((await pedir('/tienda/brindi/xyz/')).status).not.toBe(200);
  });

  it('quien llega desde el pie de una invitación crea su cuenta marcada con ese origen', async () => {
    const html = await (await pedir('/tienda/brindi/?desde=invitacion&utm_source=invitacion')).text();
    expect(html).toContain('href="https://os.vorka.mx/brindi/?origen=invitacion"');
  });

  it('codigoPuntos: la liga del anfitrión se crea una vez y se reutiliza', async () => {
    const a = await A.codigoPuntos('Mariana@Mail.com', 'Mariana Robles');
    expect(a).toMatch(/^MARIANAR[A-Z0-9]{2,8}$/);
    expect(await A.codigoPuntos('mariana@mail.com', 'Otra')).toBe(a);
    expect(await A.codigoPuntos('no-es-correo', 'X')).toBeNull();
    const p = await A.puntosApp('mariana@mail.com', 'Mariana');
    expect(p).toMatchObject({ code: a, liga: `https://vorka.mx/tienda/brindi/?ref=${a}`, disponibles: 0, ventas: 0 });
    expect(p.pct).toBeGreaterThan(0);
    expect(typeof p.nivel).toBe('string');
  });
});
