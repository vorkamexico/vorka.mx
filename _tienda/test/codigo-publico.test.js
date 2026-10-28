// Embajadores de venta: cambiar el código público (alias) sin romper las ligas viejas, y «Mis ventas» sin datos de clientes
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar } from '../src/puntos.js';
import { resolverDescuento } from '../src/descuentos.js';
import { problemaCodigo } from '../src/codigo-publico.js';

let env, A, original;
const ANA = 'ana@vorka.mx';
beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"x"}')));
  A = new Admin({}, env);
  original = await A.codigoPuntos(ANA, 'Ana López');
});
afterEach(() => vi.unstubAllGlobals());

async function compraPagada(email, ref) {
  const o = await crearOrden(env, { items: [{ slug: 'cupo-pro' }], email, nombre: 'Cliente Secreto', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  return o;
}
const hace = dias => new Date(Date.now() - dias * 864e5).toISOString();

describe('código público', () => {
  it('valida formato, reservados y groserías', () => {
    expect(problemaCodigo('ANA')).toMatch(/4 a 12/);
    expect(problemaCodigo('ANA LOPEZ')).toMatch(/4 a 12/);
    expect(problemaCodigo('12345')).toMatch(/letra/);
    expect(problemaCodigo('VORKAANA')).toMatch(/reservado/);
    expect(problemaCodigo('XPENDEJOX')).toMatch(/cualquier cliente/);
    expect(problemaCodigo('ANAVENDE')).toBeNull();
  });

  it('el nuevo se muestra y funciona; el anterior sigue sirviendo y los puntos llegan a la misma cuenta', async () => {
    const r = await A.cambiarCodigo(ANA, 'anavende');
    expect(r).toMatchObject({ ok: true, code: 'ANAVENDE', antes: original });
    expect(await A.codigoPuntos(ANA)).toBe('ANAVENDE');
    expect((await A.puntosApp(ANA)).code).toBe('ANAVENDE');
    expect((await A.infoCodigo(ANA)).original).toBe(original);
    // los dos dan el 5 % y cuentan para Ana (la orden guarda el code original)
    for (const c of ['ANAVENDE', original, 'anavende']) {
      const d = await resolverDescuento(env, { liga: c, email: 'otro@mail.com' });
      expect(d.ref).toBe(original);
      expect(d.descuento?.tipo).toBe('referido');
    }
    const o = await compraPagada('cliente@mail.com', 'ANAVENDE');
    expect(env.DB.raw.prepare('SELECT ref_code c FROM orders WHERE id = ?').get(o.id).c).toBe(original);
    await compraPagada('cliente2@mail.com', original);
    const v = await A.ventasVendedor(ANA);
    expect(v.total.ventas).toBe(2);
    expect(v.total.puntos).toBeGreaterThan(0);
    expect(JSON.stringify(v)).not.toMatch(/cliente|Secreto/i);   // nada de quien compró
  });

  it('la liga ?ref= con el código nuevo guarda la cookie y la página de compra lo reconoce', async () => {
    await A.cambiarCodigo(ANA, 'ANAVENDE');
    const r = await worker.fetch(new Request('https://vorka.mx/tienda/?ref=ANAVENDE'), env);
    expect(r.headers.get('set-cookie')).toContain(`vorka_ref=${original}`);
    const l = await worker.fetch(new Request('https://vorka.mx/api/puntos/liga?c=ANAVENDE&slug=cupo-pro'), env);
    expect(await l.json()).toMatchObject({ valido: true, tipo: 'referido' });
  });

  it('una vez cada 30 días, sin robar códigos de otros ni de descuento', async () => {
    const beto = await A.codigoPuntos('beto@vorka.mx', 'Beto');
    expect(await A.cambiarCodigo(ANA, beto)).toMatchObject({ ok: false, error: expect.stringMatching(/alguien más/) });
    env.DB.raw.prepare("INSERT OR IGNORE INTO codigos_descuento (codigo, pct) VALUES ('FUNDADOR30', 30)").run();
    expect((await A.cambiarCodigo(ANA, 'FUNDADOR30')).ok).toBe(false);
    expect((await A.cambiarCodigo(ANA, 'ANAUNO')).ok).toBe(true);
    expect(await A.cambiarCodigo(ANA, 'ANADOS')).toMatchObject({ ok: false, error: expect.stringMatching(/30 días/) });
    expect((await A.infoCodigo(ANA)).puede_cambiar_desde).toBeTruthy();
    // el alias de Ana tampoco se lo puede quedar Beto
    env.DB.raw.prepare('UPDATE affiliates SET publico_cambiado_at = ?').run(hace(31));
    expect((await A.cambiarCodigo('beto@vorka.mx', 'ANAUNO')).ok).toBe(false);
    // pasados los 30 días cambia otra vez, y el de antes (ANAUNO) sigue funcionando
    expect((await A.cambiarCodigo(ANA, 'ANADOS')).ok).toBe(true);
    expect((await resolverDescuento(env, { liga: 'ANAUNO' })).ref).toBe(original);
    // y puede volver a uno suyo
    env.DB.raw.prepare('UPDATE affiliates SET publico_cambiado_at = ?').run(hace(31));
    expect(await A.cambiarCodigo(ANA, original)).toMatchObject({ ok: true, code: original });
    expect(await A.codigoPuntos(ANA)).toBe(original);
  });

  it('una cuenta que no existe no cambia nada', async () => {
    expect(await A.cambiarCodigo('nadie@mail.com', 'NADIE1')).toMatchObject({ ok: false });
    expect(await A.infoCodigo('nadie@mail.com')).toBeNull();
  });
});
