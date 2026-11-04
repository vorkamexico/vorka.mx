// «Ventas del equipo» (Vorka OS): ventasPorVendedor trae todas las ventas con código del periodo, con su vendedor, productos,
// monto, puntos, reembolso y red de Embajadores, más el resumen por vendedor. Nunca datos de quien compró.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, puntosAlReembolsar } from '../src/puntos.js';
import { nombreDeCuenta } from '../src/codigo-publico.js';

const SITIO = 'https://vorka.mx';
let env, A;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"x"}')));
  A = new Admin({}, env);
});
afterEach(() => vi.unstubAllGlobals());

const q1 = (sql, ...p) => env.DB.raw.prepare(sql).get(...p);
const codigo = email => q1("SELECT code FROM affiliates WHERE email = ? AND tipo = 'puntos'", email).code;
async function compra(comprador, vendedor, slug = 'cupo-pro', cuando = null) {
  const o = await crearOrden(env, { items: [{ slug }], email: comprador, nombre: 'Cliente Secreto', ref: codigo(vendedor) });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  if (cuando) env.DB.raw.prepare("UPDATE puntos_movimientos SET created_at = ? WHERE order_id = ? AND tipo = 'ganado'").run(cuando, o.id);
  return q1('SELECT * FROM orders WHERE id = ?', o.id);
}
const registrar = (email, nombre, invito) => worker.fetch(new Request(SITIO + '/api/puntos/registro', { method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.0.0.9' }, body: JSON.stringify({ email, nombre, clave: 'unaclave123', terminos: true, ...(invito ? { invito } : {}) }) }), env);

describe('ventasPorVendedor', () => {
  it('cada venta con su vendedor, productos, monto y puntos; resumen por vendedor; sin datos de quien compró', async () => {
    await A.codigoPuntos('ana@vorka.mx', 'Ana López');
    await A.codigoPuntos('wendydelgado150409@gmail.com');   // cuenta sin nombre: la tienda guarda el inicio del correo
    const o1 = await compra('cliente1@mail.com', 'ana@vorka.mx');
    await compra('cliente2@mail.com', 'ana@vorka.mx', 'cupo-pro');
    await compra('cliente3@mail.com', 'wendydelgado150409@gmail.com');
    const r = await A.ventasPorVendedor({});
    expect(r.ventas).toHaveLength(3);
    expect(r.resumen).toMatchObject({ ventas: 3, reembolsadas: 0, vendedores: 2 });
    expect(r.resumen.monto_centavos).toBe(r.ventas.reduce((s, v) => s + v.monto_centavos, 0));
    expect(r.resumen.puntos).toBeGreaterThan(0);
    const ana = r.vendedores.find(v => v.email === 'ana@vorka.mx');
    expect(ana).toMatchObject({ nombre: 'Ana López', code: codigo('ana@vorka.mx'), ventas: 2, reembolsadas: 0 });
    expect(ana.monto_centavos).toBe(o1.monto_centavos * 2);
    // Sin nombre de verdad: null (nunca el correo ni su inicio); su código sí
    const w = r.vendedores.find(v => v.email === 'wendydelgado150409@gmail.com');
    expect(w.nombre).toBeNull();
    expect(w.code).toBe(codigo('wendydelgado150409@gmail.com'));
    const v = r.ventas.find(x => x.email === 'wendydelgado150409@gmail.com');
    expect(v).toMatchObject({ nombre: null, reembolsada: false, renovacion: false, por_red: false });
    expect(Array.isArray(v.productos) && v.productos.length).toBeTruthy();
    expect(v.fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Nada de quien compró
    expect(JSON.stringify(r)).not.toMatch(/cliente\d@mail|Secreto/);
    // Lo más reciente primero
    expect(r.ventas.map(x => x.id)).toEqual([...r.ventas.map(x => x.id)].sort((a, b) => b - a));
  });

  it('reembolsada: queda en la lista marcada y no suma ventas, monto ni puntos', async () => {
    await A.codigoPuntos('ana@vorka.mx', 'Ana López');
    const o = await compra('cliente1@mail.com', 'ana@vorka.mx');
    await compra('cliente2@mail.com', 'ana@vorka.mx');
    await puntosAlReembolsar(env, o.id);
    const r = await A.ventasPorVendedor({});
    expect(r.ventas).toHaveLength(2);
    expect(r.ventas.filter(x => x.reembolsada)).toHaveLength(1);
    expect(r.resumen).toMatchObject({ ventas: 1, reembolsadas: 1 });
    expect(r.vendedores[0]).toMatchObject({ ventas: 1, reembolsadas: 1, monto_centavos: o.monto_centavos });
    expect(r.resumen.puntos).toBe(r.ventas.find(x => !x.reembolsada).puntos);
  });

  it('periodo: desde/hasta (ISO) y mes en hora del centro de México', async () => {
    await A.codigoPuntos('ana@vorka.mx', 'Ana López');
    await compra('c1@mail.com', 'ana@vorka.mx', 'cupo-pro', '2026-10-31T05:30:00.000Z');   // 30 oct, 23:30 en CDMX
    await compra('c2@mail.com', 'ana@vorka.mx', 'cupo-pro', '2026-11-01T06:30:00.000Z');   // 1 nov, 00:30 en CDMX
    expect((await A.ventasPorVendedor({ mes: '2026-11' })).ventas).toHaveLength(1);
    expect((await A.ventasPorVendedor({ mes: '2026-10' })).ventas).toHaveLength(1);
    const r = await A.ventasPorVendedor({ desde: '2026-11-01T06:00:00.000Z', hasta: '2026-12-01T06:00:00.000Z' });
    expect(r.ventas).toHaveLength(1);
    expect(r).toMatchObject({ desde: '2026-11-01T06:00:00.000Z', hasta: '2026-12-01T06:00:00.000Z' });
    expect((await A.ventasPorVendedor({ desde: 'no es fecha' })).ventas).toHaveLength(2);   // fecha inválida = sin límite
  });

  it('red de Embajadores: la venta de alguien invitado dice que pagó red; su cuenta está en la red', async () => {
    await A.codigoPuntos('leo@mail.com', 'Leo Ramírez');
    expect((await registrar('sara@mail.com', 'Sara Gómez', codigo('leo@mail.com'))).status).toBe(200);
    await compra('cliente@mail.com', 'sara@mail.com');
    const r = await A.ventasPorVendedor({});
    expect(r.ventas[0]).toMatchObject({ email: 'sara@mail.com', nombre: 'Sara Gómez', por_red: true });
    expect(r.ventas[0].red_puntos).toBeGreaterThan(0);
    expect(r.vendedores[0]).toMatchObject({ patrocinado: true, en_red: true });
    expect(JSON.stringify(r)).not.toContain('leo@mail.com');   // el patrocinador no viaja: solo si hubo red
  });

  it('el límite recorta la lista pero no el resumen', async () => {
    await A.codigoPuntos('ana@vorka.mx', 'Ana López');
    for (let i = 0; i < 3; i++) await compra(`c${i}@mail.com`, 'ana@vorka.mx');
    const r = await A.ventasPorVendedor({ limite: 2 });
    expect(r.ventas).toHaveLength(2);
    expect(r.truncado).toBe(true);
    expect(r.resumen.ventas).toBe(3);
  });

  it('nombreDeCuenta: nunca un correo ni el inicio del correo', () => {
    expect(nombreDeCuenta('wendydelgado150409@gmail.com', null, 'wendydelgado150409')).toBeNull();
    expect(nombreDeCuenta('x@y.mx', 'otro@correo.mx')).toBeNull();
    expect(nombreDeCuenta('x@y.mx', null, 'Xime P.')).toBe('Xime P.');
    expect(nombreDeCuenta('x@y.mx', 'Ximena', 'xx')).toBe('Ximena');
  });

  it('Embajadores: el top de vendedores no usa el correo como nombre', async () => {
    await A.codigoPuntos('wendydelgado150409@gmail.com');
    await compra('cliente@mail.com', 'wendydelgado150409@gmail.com');
    const r = await A.resumenEmbajadores({});
    expect(r.top_vendedores[0]).toMatchObject({ email: 'wendydelgado150409@gmail.com', nombre: null });
  });

  it('Pedidos: la orden dice quién la vendió (cuenta de Puntos) con su nombre real o null, y su código', async () => {
    await A.codigoPuntos('wendydelgado150409@gmail.com');
    const o = await compra('cliente@mail.com', 'wendydelgado150409@gmail.com');
    expect((await A.orden(o.id)).vendedor).toEqual({ email: 'wendydelgado150409@gmail.com', nombre: null, code: codigo('wendydelgado150409@gmail.com') });
    await A.codigoPuntos('ana@vorka.mx', 'Ana López');
    const o2 = await compra('cliente2@mail.com', 'ana@vorka.mx');
    expect((await A.orden(o2.id)).vendedor.nombre).toBe('Ana López');
  });
});
