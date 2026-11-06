import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { procesarPago } from '../src/webhook.js';
import { netoDelMes, ultimasPagadas, dineroStripe, completarComisionesStripe } from '../src/finanzas.js';

let env;
const DESDE = '2026-10-01T06:00:00.000Z', HASTA = '2026-11-01T06:00:00.000Z';
// Orden pagada con fecha de pago fija (CDMX = UTC−6)
const pagada = async ({ ref, metodo = 'card', creado, pagado, fee = null, puntos = 0, cargo = null }) => {
  const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'ana@mail.com', nombre: 'Ana', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: metodo, provider_payment_id: `pi_${o.id.slice(0, 6)}`, provider_charge_id: cargo });
  env.DB.raw.prepare('UPDATE orders SET created_at = ?, paid_at = ?, stripe_fee_centavos = ?, puntos_usados = ? WHERE id = ?').run(creado || pagado, pagado, fee, puntos, o.id);
  return o;
};

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('ANA', 'Ana', 20); INSERT INTO affiliates (code, nombre, comision_pct, tipo) VALUES ('PEPE', 'Pepe', 0, 'puntos');");
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"em"}')));
});
afterEach(() => vi.unstubAllGlobals());

describe('neto del mes', () => {
  it('resta Stripe, afiliados en dinero, creadores y Puntos transferidos; los Puntos usados como descuento no se vuelven a restar', async () => {
    const a = await pagada({ ref: 'ANA', pagado: '2026-10-05T18:00:00.000Z', fee: 1200 });
    const b = await pagada({ ref: 'PEPE', pagado: '2026-10-06T18:00:00.000Z', puntos: 50 });   // sin comisión de Stripe aún
    await pagada({ pagado: '2026-11-02T18:00:00.000Z', fee: 999 });                             // otro mes: no cuenta
    // b trae un producto de un creador sin transferencia programada (se estima con su %); a ya tiene su transferencia
    env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado) VALUES ('cre_a', 'Ale', 'ale@mail.com', 'aprobado');
      UPDATE order_items SET creador_id = 'cre_a', comision_pct = 20 WHERE order_id = '${b.id}';
      INSERT INTO transferencias (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, disponible_en)
        VALUES ('trf_1', '${a.id}', 'cre_a', 10000, 2000, 400, 7600, '2026-10-20');
      INSERT INTO transferencias (id, order_id, creador_id, venta_centavos, comision_vorka_centavos, comision_stripe_centavos, monto_centavos, disponible_en, estado)
        VALUES ('trf_2', '${b.id}', 'cre_a', 1, 1, 0, 5000, '2026-10-20', 'cancelada');
      INSERT INTO puntos_retiros (email, puntos, clabe, titular, estado, pagado_el) VALUES ('x@mail.com', 300, '012345678901234567', 'X', 'pagado', '2026-10-31'),
        ('y@mail.com', 999, '012345678901234567', 'Y', 'pagado', '2026-11-01'), ('z@mail.com', 50, '012345678901234567', 'Z', 'por_pagar', NULL);
      INSERT INTO puntos_movimientos (email, tipo, puntos, created_at) VALUES ('x@mail.com', 'ganado', 40, '2026-10-05T18:00:00.000Z'),
        ('x@mail.com', 'red', 5, '2026-10-05T18:00:00.000Z'), ('x@mail.com', 'revertido', -10, '2026-10-09T18:00:00.000Z'), ('x@mail.com', 'canje', -50, '2026-10-06T18:00:00.000Z');`);
    const n = await netoDelMes(env, { desde: DESDE, hasta: HASTA, mes: '2026-10' });
    const bruto = 27900 + 27900;   // (en la prueba solo se marca puntos_usados; en la vida real el monto ya viene con ese descuento)
    expect(n).toMatchObject({ compras: 2, bruto_centavos: bruto, stripe_centavos: 1200, stripe_sin_calcular: 1, afiliados_centavos: 5580, afiliados_ventas: 1,
      puntos_transferidos_centavos: 30000, puntos_transferencias: 1, puntos_descuento_centavos: 5000, puntos_generados_centavos: 3500 });
    // creadores: 7600 programado (a) + b estimado: la transferencia cancelada no cuenta y b no tiene otra → 80 % de lo vendido
    expect(n.creadores_estimado_centavos).toBe(0);   // b tiene transferencia (cancelada): no se estima
    expect(n.creadores_centavos).toBe(7600);
    expect(n.neto_centavos).toBe(bruto - 1200 - 5580 - 7600 - 30000);
  });

  it('estima la parte del creador cuando aún no hay transferencia', async () => {
    const b = await pagada({ pagado: '2026-10-06T18:00:00.000Z', fee: 1000 });
    env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado) VALUES ('cre_a', 'Ale', 'ale@mail.com', 'aprobado');
      UPDATE order_items SET creador_id = 'cre_a', comision_pct = 20 WHERE order_id = '${b.id}';`);
    const n = await netoDelMes(env, { desde: DESDE, hasta: HASTA, mes: '2026-10' });
    expect(n.creadores_estimado_centavos).toBe(Math.round(27900 * 0.8));
    expect(n.neto_centavos).toBe(27900 - 1000 - Math.round(27900 * 0.8));
  });

  it('el tablero trae el neto del mes', async () => {
    await pagada({ ref: 'ANA', pagado: '2026-10-05T18:00:00.000Z', fee: 1200 });
    const t = await new Admin({}, env).tablero({ mes: '2026-10' });
    expect(t.neto).toMatchObject({ bruto_centavos: 27900, neto_centavos: 27900 - 1200 - 5580 });
    expect(t.actual.monto_centavos).toBe(27900);
  });
});

describe('últimas compras pagadas', () => {
  it('van por fecha de pago (OXXO que se pagó después sube) y traen su método; sin pendientes ni cortesías', async () => {
    await pagada({ pagado: '2026-10-05T18:00:00.000Z', metodo: 'card' });
    const oxxo = await pagada({ creado: '2026-10-01T18:00:00.000Z', pagado: '2026-10-07T15:00:00.000Z', metodo: 'oxxo' });
    await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'B' });   // pendiente
    const l = await ultimasPagadas(env, { n: 5 });
    expect(l.map(x => x.metodo_pago)).toEqual(['oxxo', 'card']);
    expect(l[0]).toMatchObject({ id: oxxo.id, paid_at: '2026-10-07T15:00:00.000Z', created_at: '2026-10-01T18:00:00.000Z' });
  });
});

describe('comisión de Stripe por orden', () => {
  it('se guarda al confirmar el pago (webhook) y no se pisa', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'ana@mail.com', nombre: 'Ana' });
    const pago = { orderId: o.id, resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'oxxo', provider_payment_id: 'pi_1', provider_charge_id: 'ch_1', stripe_fee_centavos: 1450 };
    await procesarPago(env, pago);
    await procesarPago(env, { ...pago, stripe_fee_centavos: 9 });
    expect(env.DB.raw.prepare('SELECT stripe_fee_centavos f FROM orders WHERE id = ?').get(o.id).f).toBe(1450);
  });

  it('el cron completa las órdenes viejas preguntando a Stripe', async () => {
    env.STRIPE_SECRET_KEY = 'sk_test_x';
    const a = await pagada({ pagado: '2026-10-05T18:00:00.000Z', cargo: 'ch_a' });
    const b = await pagada({ pagado: '2026-10-06T18:00:00.000Z' });
    const ya = await pagada({ pagado: '2026-10-07T18:00:00.000Z', fee: 77 });
    fetch.mockImplementation(async url => {
      const u = String(url);
      if (u.includes('/charges/ch_a')) return Response.json({ id: 'ch_a', balance_transaction: { fee: 1300 } });
      if (u.includes('/payment_intents/')) return Response.json({ id: 'pi', latest_charge: { id: 'ch_b', balance_transaction: { fee: 1100 } } });
      return Response.json({});
    });
    expect(await completarComisionesStripe(env)).toEqual({ revisadas: 2, guardadas: 2 });
    const f = id => env.DB.raw.prepare('SELECT stripe_fee_centavos f FROM orders WHERE id = ?').get(id).f;
    expect([f(a.id), f(b.id), f(ya.id)]).toEqual([1300, 1100, 77]);
    expect(await completarComisionesStripe(env)).toEqual({ revisadas: 0, guardadas: 0 });
  });
});

describe('dinero en Stripe', () => {
  it('saldo disponible, por liberar, en camino y depositado este mes (solo MXN)', async () => {
    env.STRIPE_SECRET_KEY = 'sk_test_x';
    const s = d => Math.floor(Date.parse(d) / 1000);
    fetch.mockImplementation(async url => {
      const u = String(url);
      if (u.endsWith('/balance')) return Response.json({ livemode: true, available: [{ amount: 50000, currency: 'mxn' }, { amount: 9, currency: 'usd' }], pending: [{ amount: 12000, currency: 'mxn' }] });
      if (u.includes('/payouts')) return Response.json({ data: [
        { id: 'po_1', amount: 30000, currency: 'mxn', status: 'in_transit', arrival_date: s('2026-11-06T00:00:00Z') },
        { id: 'po_2', amount: 20000, currency: 'mxn', status: 'paid', arrival_date: s('2026-11-03T00:00:00Z') },
        { id: 'po_3', amount: 10000, currency: 'mxn', status: 'paid', arrival_date: s('2026-10-28T00:00:00Z') }] });
      return Response.json({});
    });
    const d = await dineroStripe(env, { ahora: Date.parse('2026-11-05T18:00:00Z') });
    expect(d).toMatchObject({ prueba: false, disponible_centavos: 50000, por_liberar_centavos: 12000, en_camino_centavos: 30000, depositado_mes_centavos: 20000, depositos_mes: 1 });
    expect(d.depositos.map(x => x.estado)).toEqual(['in_transit', 'paid', 'paid']);
  });

  it('sin llave de Stripe no consulta nada', async () => {
    expect(await dineroStripe(env)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
