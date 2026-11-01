import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import { crearOrden, aplicarPago, listarProductos, registrarEvento, marcarEvento, dentroDelLimite, ordenPorId } from '../src/modelo.js';

let env;
const aprobado = o => ({ resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'mxn', provider_payment_id: 'pi_1', metodo_pago: 'card' });

beforeEach(() => {
  env = { DB: d1() };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('ANA', 'Ana', 20), ('OFF', 'Off', 10); UPDATE affiliates SET activo = 0 WHERE code = 'OFF';");
});

describe('modelo de datos', () => {
  it('el seed trae el kit De Idea a Proyecto a $279 MXN', async () => {
    const p = (await listarProductos(env)).find(x => x.slug === 'de-idea-a-proyecto');
    expect(p.slug).toBe('de-idea-a-proyecto');
    expect(p.precio_centavos).toBe(27900);
    expect(p.r2_keys).toHaveLength(3);
  });

  it('el seed entra inactivo (no se vende sin archivos); solo los accesos de apps pueden entrar a la venta', async () => {
    const env2 = { DB: d1() };
    const activos = await listarProductos(env2);
    expect(activos.every(p => p.contenido?.acceso)).toBe(true);
    // los demás niveles de Cupo se venden en /tienda/cupo/ sin listarse; Cuentas entra activo (decisión 2026-10-22);
    // los reportes de los tests entran activos por encargo del dueño (migración 0058; las licencias de grupo, ocultas)
    expect(activos.map(p => p.slug)).toEqual(['test-vocacional', 'que-proyecto-social', 'cupo-pro', 'cuentas-mensual']);
  });

  it('crea la orden con el precio de la base y el afiliado activo', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: ' Ana@Mail.com ', nombre: 'Ana', ref: 'ana' });
    expect(o.monto_centavos).toBe(27900);
    expect(o.email).toBe('ana@mail.com');
    expect(o.ref_code).toBe('ANA');
    expect(o.comision_pct).toBe(20);
    expect((await ordenPorId(env, o.id)).estado).toBe('pending');
  });

  it('ignora afiliados inactivos o inexistentes', async () => {
    expect((await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A', ref: 'OFF' })).ref_code).toBeNull();
    expect((await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A', ref: 'NADA' })).ref_code).toBeNull();
  });

  it('rechaza productos que no existen', async () => {
    await expect(crearOrden(env, { items: [{ slug: 'nope' }], email: 'a@b.mx', nombre: 'A' })).rejects.toThrow('producto');
  });

  it('el mismo pago aprobado 3 veces solo entrega una vez', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A' });
    const r = await Promise.all([1, 2, 3].map(() => aplicarPago(env, o.id, aprobado(o))));
    expect(r.filter(x => x.accion === 'entregar')).toHaveLength(1);
    const final = await ordenPorId(env, o.id);
    expect(final.estado).toBe('paid');
    expect(final.paid_at).toBeTruthy();
  });

  it('no entrega si el monto no coincide', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A' });
    const r = await aplicarPago(env, o.id, { ...aprobado(o), monto_centavos: 100 });
    expect(r.motivo).toBe('monto_no_coincide');
    expect((await ordenPorId(env, o.id)).estado).toBe('pending');
  });

  it('reembolso revoca los tokens', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A' });
    await aplicarPago(env, o.id, aprobado(o));
    env.DB.raw.prepare("INSERT INTO download_tokens (order_id, token_hash, expires_at) VALUES (?, 'h', '2099-01-01')").run(o.id);
    const r = await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    expect(r.accion).toBe('revocar');
    expect(env.DB.raw.prepare('SELECT revocado FROM download_tokens').get().revocado).toBe(1);
  });

  it('un evento de webhook repetido se detecta', async () => {
    expect(await registrarEvento(env, 'stripe', 'evt_1', 'x', '{}')).toBe(true);
    await marcarEvento(env, 'stripe', 'evt_1');
    expect(await registrarEvento(env, 'stripe', 'evt_1', 'x', '{}')).toBe(false);
  });

  it('un evento que falló se puede reintentar', async () => {
    await registrarEvento(env, 'stripe', 'evt_2', 'x', '{}');
    await marcarEvento(env, 'stripe', 'evt_2', 'boom');
    expect(await registrarEvento(env, 'stripe', 'evt_2', 'x', '{}')).toBe(true);
  });

  it('límite de peticiones por ventana', async () => {
    const r = [];
    for (let i = 0; i < 4; i++) r.push(await dentroDelLimite(env, 'checkout:ip:x', 3, 60));
    expect(r).toEqual([true, true, true, false]);
  });
});

describe('visitas: una por persona y producto cada 30 minutos', () => {
  it('recargar o una revisión automática desde la misma IP no infla las vistas', async () => {
    const { d1 } = await import('./d1.js');
    const { registrarAnalitica } = await import('../src/modelo.js');
    const env = { DB: d1() };
    const req = ip => new Request('https://vorka.mx/tienda/x', { headers: { 'cf-connecting-ip': ip } });
    for (let i = 0; i < 20; i++) await registrarAnalitica(env, 'view_product', { product_id: 'prod_a' }, req('1.1.1.1'));
    await registrarAnalitica(env, 'view_product', { product_id: 'prod_a' }, req('2.2.2.2'));
    await registrarAnalitica(env, 'view_product', { product_id: 'prod_b' }, req('1.1.1.1'));
    await registrarAnalitica(env, 'begin_checkout', { product_id: 'prod_a' }, req('1.1.1.1'));
    const n = env.DB.raw.prepare("SELECT tipo, product_id, COUNT(*) n FROM events GROUP BY tipo, product_id ORDER BY tipo, product_id").all();
    expect(n).toEqual([{ tipo: 'begin_checkout', product_id: 'prod_a', n: 1 }, { tipo: 'view_product', product_id: 'prod_a', n: 2 }, { tipo: 'view_product', product_id: 'prod_b', n: 1 }]);
  });
});
