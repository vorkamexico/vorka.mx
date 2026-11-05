// Suscripciones por transferencia (sin Stripe): se crean con el correo desde Vorka OS, la app las ve como cualquier suscripción,
// se prenden y apagan, un pago extiende un periodo, vencen con gracia y se pausan solas; nada de esto llama a Stripe.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { Admin } from '../src/index.js';
import { revisarTransferencias, SIN_VENCER } from '../src/transferencias.js';

let env, llamadas, A;
const DIA = 864e5;
const fechar = (id, iso) => env.DB.raw.prepare('UPDATE suscripciones SET periodo_fin = ? WHERE id = ?').run(iso, id);

beforeEach(() => {
  llamadas = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), STRIPE_SECRET_KEY: 'sk_test_x', CORREO: { async enviar() { return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  vi.stubGlobal('fetch', vi.fn(async url => { llamadas.push(String(url)); return new Response('{}'); }));
  A = new Admin({}, env);
});
afterEach(() => vi.unstubAllGlobals());

describe('suscripción por transferencia', () => {
  it('se crea con el correo, la app la ve vigente y no toca Stripe', async () => {
    const s = await A.crearSuscripcionTransferencia({ email: ' OleynickAna@Gmail.com ', nombre: 'Oleynick Center', product_id: 'prod_vuelve_mensual', monto_centavos: 39900 });
    expect(s.id).toMatch(/^tra_/);
    expect(s.metodo).toBe('transferencia');
    const app = await A.suscripcionApp('oleynickana@gmail.com', 'vuelve');
    expect(app.vigente).toBe(true);
    expect(app.transferencia).toBe(true);
    expect(app.monto_centavos).toBe(39900);
    expect(Date.parse(app.periodo_fin) - Date.now()).toBeGreaterThan(27 * DIA);
    expect(llamadas.filter(u => u.includes('stripe'))).toHaveLength(0);
  });

  it('sin cobro no vence y no cuenta como ingreso', async () => {
    await A.crearSuscripcionTransferencia({ email: 'inda@correo.mx', product_id: 'prod_clara_mensual', cobrar: false });
    const app = await A.suscripcionApp('inda@correo.mx', 'clara');
    expect(app.vigente).toBe(true);
    expect(app.periodo_fin).toBe(SIN_VENCER);
    const p = await A.panelSuscripciones();
    expect(p.resumen.mrr_transferencia).toBe(0);
    expect(p.resumen.sin_cobro).toBe(1);
    expect(p.suscripciones.find(x => x.email === 'inda@correo.mx').periodo_fin).toBeNull();
  });

  it('no duplica una vigente del mismo correo y app', async () => {
    await A.crearSuscripcionTransferencia({ email: 'a@correo.mx', product_id: 'prod_vuelve_mensual' });
    await expect(A.crearSuscripcionTransferencia({ email: 'a@correo.mx', product_id: 'prod_vuelve_mensual' })).rejects.toThrow(/ya tiene/);
  });

  it('el interruptor apaga y prende el acceso', async () => {
    const s = await A.crearSuscripcionTransferencia({ email: 'b@correo.mx', product_id: 'prod_vuelve_mensual' });
    await A.prenderSuscripcion(s.id, false);
    expect((await A.suscripcionApp('b@correo.mx', 'vuelve')).vigente).toBe(false);
    await A.prenderSuscripcion(s.id, true);
    expect((await A.suscripcionApp('b@correo.mx', 'vuelve')).vigente).toBe(true);
  });

  it('vence con gracia, se pausa sola y el pago la regresa extendiendo desde su fecha', async () => {
    const s = await A.crearSuscripcionTransferencia({ email: 'c@correo.mx', product_id: 'prod_vuelve_mensual', gracia_dias: 10 });
    fechar(s.id, new Date(Date.now() - 3 * DIA).toISOString());
    await revisarTransferencias(env);
    let app = await A.suscripcionApp('c@correo.mx', 'vuelve');
    expect(app.estado).toBe('past_due');
    expect(app.vigente).toBe(true);
    fechar(s.id, new Date(Date.now() - 12 * DIA).toISOString());
    await revisarTransferencias(env);
    app = await A.suscripcionApp('c@correo.mx', 'vuelve');
    expect(app.estado).toBe('unpaid');
    expect(app.vigente).toBe(false);
    const antes = Date.now() - 12 * DIA;
    const r = await A.pagoSuscripcion(s.id, { clave: 'cobro-7' });
    expect(r.estado).toBe('active');
    expect(Math.abs(Date.parse(r.periodo_fin) - (antes + 30 * DIA))).toBeLessThan(3 * DIA);
    // el mismo pago dos veces no extiende dos veces
    const r2 = await A.pagoSuscripcion(s.id, { clave: 'cobro-7' });
    expect(r2.periodo_fin).toBe(r.periodo_fin);
  });

  it('un pago no prende una apagada a mano', async () => {
    const s = await A.crearSuscripcionTransferencia({ email: 'd@correo.mx', product_id: 'prod_vuelve_mensual' });
    await A.prenderSuscripcion(s.id, false);
    expect((await A.pagoSuscripcion(s.id, {})).estado).toBe('canceled');
  });

  it('sucursales, portal, cancelar y mes de premio funcionan sin Stripe', async () => {
    await A.crearSuscripcionTransferencia({ email: 'e@correo.mx', product_id: 'prod_vuelve_mensual' });
    expect((await A.lugaresApp('e@correo.mx', 'vuelve', 2)).sucursales).toBe(2);
    expect((await A.portalApp('e@correo.mx', 'vuelve', 'https://os.vorka.mx/vuelve/')).transferencia).toBe(true);
    const antes = (await A.suscripcionApp('e@correo.mx', 'vuelve')).periodo_fin;
    await A.creditoApp('e@correo.mx', 'vuelve', 39900, 'Recomendó Vuelve', 'k1');
    await A.creditoApp('e@correo.mx', 'vuelve', 39900, 'Recomendó Vuelve', 'k1');
    expect(Date.parse((await A.suscripcionApp('e@correo.mx', 'vuelve')).periodo_fin) - Date.parse(antes)).toBeGreaterThan(27 * DIA);
    expect(Date.parse((await A.suscripcionApp('e@correo.mx', 'vuelve')).periodo_fin) - Date.parse(antes)).toBeLessThan(32 * DIA);
    expect((await A.cancelarApp('e@correo.mx', 'vuelve')).transferencia).toBe(true);
    expect(llamadas.filter(u => u.includes('stripe'))).toHaveLength(0);
  });

  it('el panel lista planes de suscripción (sin complementos)', async () => {
    const p = await A.panelSuscripciones();
    const ids = p.planes.map(x => x.id);
    expect(ids).toContain('prod_vuelve_mensual');
    expect(ids).toContain('prod_clara_mensual');
    expect(ids).not.toContain('prod_vuelve_sucursal_mensual');
  });
});
