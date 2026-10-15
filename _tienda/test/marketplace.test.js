import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { crearOrden, aplicarPago, listarProductos } from '../src/modelo.js';
import { calcularReparto, programarTransferencias, procesarTransferencias, anularTransferencias, DIAS_PARA_TRANSFERIR } from '../src/marketplace.js';
import { cuentaCreadorBody, cuentaLista } from '../src/pagos/connect.js';

let env, llamadas, cuentaActiva;
const transf = () => env.DB.raw.prepare('SELECT * FROM transferencias').all();

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'rk_test_x' };
  env.DB.raw.exec(`
    UPDATE products SET activo = 1;
    INSERT INTO creadores (id, nombre, email, estado, comision_pct, stripe_account_id, stripe_listo) VALUES ('cre_1', 'Lucía', 'lucia@mail.com', 'aprobado', 20, 'acct_lucia', 1);
    INSERT INTO products (id, slug, nombre, precio_centavos, activo, r2_keys, creador_id, revision) VALUES ('prod_lucia', 'plantillas-lucia', 'Plantillas de Lucía', 20000, 1, '[{"key":"x/a.pdf","nombre":"A"}]', 'cre_1', 'aprobado');`);
  llamadas = []; cuentaActiva = true;
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, init, params: new URLSearchParams(init?.body) });
    if (url.includes('/v2/core/accounts/')) return new Response(JSON.stringify({ id: 'acct_lucia', configuration: { recipient: { capabilities: { stripe_balance: {
      stripe_transfers: { status: cuentaActiva ? 'active' : 'pending' }, payouts: { status: cuentaActiva ? 'active' : 'pending' } } } } } }));
    if (url.endsWith('/reversals')) return new Response(JSON.stringify({ id: 'trr_1' }));
    if (url.endsWith('/v1/transfers')) return new Response(JSON.stringify({ id: `tr_${llamadas.length}` }));
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function ventaPagada(slug = 'plantillas-lucia', fee = 1100) {
  const o = await crearOrden(env, { items: [{ slug }], email: 'comprador@mail.com', nombre: 'Comprador' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', provider_payment_id: 'pi_1', provider_charge_id: 'ch_1' });
  await programarTransferencias(env, o.id, { fee });
  return o;
}

describe('reparto a creadores', () => {
  it('creador recibe: venta − 20 % − comisión real de Stripe; Vorka conserva su 20 % completo', () => {
    const [r] = calcularReparto([{ creador_id: 'cre_1', comision_pct: 20, precio_centavos: 20000, cantidad: 1 }], 20000, 1100);
    expect(r).toMatchObject({ venta_centavos: 20000, comision_vorka_centavos: 4000, comision_stripe_centavos: 1100, monto_centavos: 14900 });
  });

  it('carrito mixto: la comisión de Stripe se reparte en proporción y los productos de Vorka no generan transferencia', () => {
    const r = calcularReparto([
      { creador_id: 'cre_1', comision_pct: 20, precio_centavos: 10000, cantidad: 1 },
      { creador_id: 'cre_2', comision_pct: 30, precio_centavos: 20000, cantidad: 1 },
      { creador_id: null, precio_centavos: 10000, cantidad: 1 },
    ], 40000, 2000);
    expect(r.map(x => [x.creador_id, x.comision_stripe_centavos, x.monto_centavos])).toEqual([['cre_1', 500, 7500], ['cre_2', 1000, 13000]]);
  });

  it('la orden guarda a quién le toca y con qué %', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'plantillas-lucia' }], email: 'a@b.mx', nombre: 'A' });
    expect(env.DB.raw.prepare('SELECT creador_id, comision_pct FROM order_items WHERE order_id = ?').get(o.id)).toEqual({ creador_id: 'cre_1', comision_pct: 20 });
  });

  it('al pagarse se programa a 7 días, una sola vez aunque el aviso llegue repetido', async () => {
    const o = await ventaPagada();
    await programarTransferencias(env, o.id, { fee: 1100 });
    const [t] = transf();
    expect(transf()).toHaveLength(1);
    expect(t).toMatchObject({ estado: 'programada', monto_centavos: 14900, creador_id: 'cre_1' });
    const dias = (new Date(t.disponible_en) - Date.now()) / 864e5;
    expect(Math.round(dias)).toBe(DIAS_PARA_TRANSFERIR);
  });

  it('productos de Vorka no programan transferencias', async () => {
    await ventaPagada('de-idea-a-proyecto');
    expect(transf()).toHaveLength(0);
  });

  it('antes de 7 días no se envía; después sí, ligada al cargo', async () => {
    const o = await ventaPagada();
    expect((await procesarTransferencias(env)).enviadas).toBe(0);
    const despues = new Date(Date.now() + 8 * 864e5).toISOString();
    expect((await procesarTransferencias(env, despues)).enviadas).toBe(1);
    const p = llamadas.find(l => l.url.endsWith('/v1/transfers')).params;
    expect(Object.fromEntries(p)).toMatchObject({ amount: '14900', currency: 'mxn', destination: 'acct_lucia', source_transaction: 'ch_1', transfer_group: o.id });
    expect(transf()[0]).toMatchObject({ estado: 'enviada', stripe_transfer_id: expect.stringMatching(/^tr_/) });
  });

  it('si la cuenta del creador no está lista, espera y sale cuando se activa', async () => {
    await ventaPagada();
    // Después de la venta Stripe le pide algo más al creador: la orden ya pagada se liquida cuando vuelva a estar lista
    env.DB.raw.exec("UPDATE creadores SET stripe_listo = 0");
    cuentaActiva = false;
    const despues = new Date(Date.now() + 8 * 864e5).toISOString();
    expect(await procesarTransferencias(env, despues)).toMatchObject({ enviadas: 0, esperando: 1 });
    cuentaActiva = true;
    expect((await procesarTransferencias(env, despues)).enviadas).toBe(1);
  });

  it('reembolso antes de transferir → se cancela; después → se revierte', async () => {
    const a = await ventaPagada();
    await aplicarPago(env, a.id, { resultado: 'reembolsado' });
    await anularTransferencias(env, a.id);
    expect(transf()[0].estado).toBe('cancelada');

    env.DB.raw.exec('DELETE FROM transferencias');
    const b = await ventaPagada();
    await procesarTransferencias(env, new Date(Date.now() + 8 * 864e5).toISOString());
    await aplicarPago(env, b.id, { resultado: 'reembolsado' });
    expect(await anularTransferencias(env, b.id)).toBe(1);
    expect(transf().find(t => t.order_id === b.id).estado).toBe('revertida');
    expect(llamadas.some(l => l.url.endsWith('/reversals'))).toBe(true);
  });
});

describe('visibilidad en la tienda', () => {
  it('un producto de creador solo se vende si el creador está aprobado, su Stripe listo y el producto aprobado', async () => {
    const slugs = async () => (await listarProductos(env)).map(p => p.slug);
    expect(await slugs()).toContain('plantillas-lucia');
    env.DB.raw.exec("UPDATE creadores SET stripe_listo = 0");
    expect(await slugs()).not.toContain('plantillas-lucia');
    env.DB.raw.exec("UPDATE creadores SET stripe_listo = 1, estado = 'suspendido'");
    expect(await slugs()).not.toContain('plantillas-lucia');
    env.DB.raw.exec("UPDATE creadores SET estado = 'aprobado'; UPDATE products SET revision = 'en_revision' WHERE id = 'prod_lucia'");
    expect(await slugs()).not.toContain('plantillas-lucia');
    expect(await slugs()).toContain('de-idea-a-proyecto');
  });
});

describe('cuenta de Stripe del creador', () => {
  it('Accounts v2: Express, receptor con stripe_transfers, comisiones y saldos negativos de la plataforma, México', () => {
    const b = cuentaCreadorBody({ id: 'cre_1', email: 'lucia@mail.com', nombre: 'Lucía' });
    expect(b).toMatchObject({ dashboard: 'express', identity: { country: 'mx' },
      configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
      defaults: { currency: 'mxn', responsibilities: { fees_collector: 'application', losses_collector: 'application' } } });
    expect(b.configuration.merchant).toBeUndefined();
  });
  it('lista solo con transferencias y depósitos activos', () => {
    const c = s => ({ configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: s[0] }, payouts: { status: s[1] } } } } } });
    expect(cuentaLista(c(['active', 'active']))).toBe(true);
    expect(cuentaLista(c(['active', 'pending']))).toBe(false);
    expect(cuentaLista({})).toBe(false);
  });
});
