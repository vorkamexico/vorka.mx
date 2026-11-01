// Equipo de Vorka México: sus cuentas de Puntos ganan ×FACTOR_EQUIPO (1.5) sobre el % de su nivel (+ extra), con el
// mismo tope de siempre (PCT_TOPE) y sobre lo efectivamente cobrado. Vorka OS manda la lista por RPC (Admin.equipoPuntos).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, puntosAlReembolsar, puntosFactura, saldoDe } from '../src/puntos.js';
import { FACTOR_EQUIPO, PCT_TOPE, pctPara, pctEfectivo } from '../src/puntos-reglas.js';

let env, A;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"x"}')));
  A = new Admin({}, env);
});
afterEach(() => vi.unstubAllGlobals());

async function compraPagada(email, ref, slug = 'cupo-pro') {   // Cupo Pro: $149
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Comprador', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  return o;
}
const ganado = email => env.DB.raw.prepare("SELECT * FROM puntos_movimientos WHERE email = ? AND tipo = 'ganado' AND order_id NOT LIKE 'previa-%' ORDER BY id").all(email);
function ventasPrevias(email, n) {
  for (let i = 0; i < n; i++)
    env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, order_id, created_at) VALUES (?, 'ganado', 1, ?, ?)").run(email, `previa-${i}`, new Date().toISOString());
}

describe('Reglas del equipo', () => {
  it('×1.5 sobre el % del nivel con el tope de siempre', () => {
    expect(FACTOR_EQUIPO).toBe(1.5);
    expect([0, 3, 10, 25, 50].map(n => pctPara(n, false, true))).toEqual([15, 22.5, 30, 37.5, PCT_TOPE]);
    expect([0, 3, 10, 25, 50].map(n => pctPara(n))).toEqual([10, 15, 20, 25, 30]);   // externos: sin cambio
    expect(pctPara(0, true, true)).toBe(30);       // Inicial con extra: (10 + 10) × 1.5
    expect(pctPara(10, true, true)).toBe(PCT_TOPE); // Plata con extra: 45 → tope
    expect(pctEfectivo(20, false)).toBe(20);
  });
});

describe('equipoPuntos (lista desde Vorka OS)', () => {
  it('marca exactamente esas cuentas, desmarca a quien ya no está y no crea cuentas', async () => {
    for (const e of ['ana@vorka.mx', 'beto@vorka.mx', 'externa@mail.com']) await A.codigoPuntos(e, 'X');
    let r = await A.equipoPuntos(['ANA@vorka.mx ', 'beto@vorka.mx', 'nadie@vorka.mx', 'no es correo']);
    expect(r.marcados).toEqual(['ana@vorka.mx', 'beto@vorka.mx']);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM puntos_cuentas WHERE email = 'nadie@vorka.mx'").get().n).toBe(0);
    r = await A.equipoPuntos(['ana@vorka.mx']);   // Beto se dio de baja en os
    expect(r.marcados).toEqual(['ana@vorka.mx']);
    expect(r.cambios).toBe(1);
    expect((await A.equipoPuntos(['ana@vorka.mx'])).cambios).toBe(0);   // idempotente
    expect((await A.equipoPuntos([])).marcados).toEqual([]);             // lista vacía: nadie es equipo
    await expect(A.equipoPuntos('ana@vorka.mx')).rejects.toThrow();
  });

  it('puntosApp dice si la cuenta es del equipo, su factor y su % efectivo', async () => {
    await A.codigoPuntos('ana@vorka.mx', 'Ana');
    expect(await A.puntosApp('ana@vorka.mx', 'Ana')).toMatchObject({ equipo: false, factor: 1, pct: 10, pct_efectivo: 10 });
    await A.equipoPuntos(['ana@vorka.mx']);
    ventasPrevias('ana@vorka.mx', 10);   // Plata
    expect(await A.puntosApp('ana@vorka.mx', 'Ana')).toMatchObject({ equipo: true, factor: 1.5, nivel: 'Plata', pct: 20, pct_efectivo: 30 });
    expect((await A.catalogoPuntos('X')).reglas.factor_equipo).toBe(1.5);
  });
});

describe('Ganar puntos como equipo', () => {
  it('gana 1.5 veces lo de una persona externa sobre lo cobrado; los ya ganados no cambian', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana'), ext = await A.codigoPuntos('luz@mail.com', 'Luz');
    await compraPagada('c1@mail.com', eq);   // antes de ser equipo: 10% de $149 = 15
    await A.equipoPuntos(['ana@vorka.mx']);
    await compraPagada('c2@mail.com', eq);   // equipo Inicial: 15% de $149 = 22.35 → 22
    await compraPagada('c3@mail.com', ext);  // externa Inicial: 10% → 15
    const [antes, despues] = ganado('ana@vorka.mx');
    expect(antes).toMatchObject({ puntos: 15, pct: 10, factor: 1 });
    expect(despues).toMatchObject({ puntos: 22, pct: 15, factor: 1.5 });
    expect(ganado('luz@mail.com')[0]).toMatchObject({ puntos: 15, pct: 10, factor: 1 });
    // al dejar de ser equipo, lo ganado se queda y lo nuevo vuelve al % normal
    await A.equipoPuntos([]);
    await compraPagada('c4@mail.com', eq);
    expect(ganado('ana@vorka.mx').map(m => m.puntos)).toEqual([15, 22, 15]);
    expect((await saldoDe(env, 'ana@vorka.mx')).disponibles).toBe(52);
  });

  it('respeta el tope de % (Diamante y puntos extra) y el reembolso revierte exacto', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    ventasPrevias('ana@vorka.mx', 50);   // Diamante 30% → ×1.5 = 45 → tope 40
    const o = await compraPagada('c1@mail.com', eq);
    expect(ganado('ana@vorka.mx')[0]).toMatchObject({ pct: PCT_TOPE, puntos: 60, factor: 1.5 });   // 40% de $149
    await puntosAlReembolsar(env, o.id);
    const rev = env.DB.raw.prepare("SELECT puntos FROM puntos_movimientos WHERE order_id = ? AND tipo = 'revertido'").get(o.id);
    expect(rev.puntos).toBe(-60);
  });

  it('comprarse a sí mismo sigue sin dar puntos, aunque sea del equipo', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    await compraPagada('ana@vorka.mx', eq);
    expect(ganado('ana@vorka.mx')).toHaveLength(0);
  });

  it('renovaciones de suscripción también llevan el ×1.5', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    const o = await compraPagada('negocio@mail.com', eq);
    await puntosFactura(env, { id: 'in_2', status: 'paid', amount_paid: 29900, billing_reason: 'subscription_cycle', status_transitions: { paid_at: Math.floor(Date.now() / 1000) } },
      { id: 'sub_1', metadata: { order_id: o.id } });
    expect(env.DB.raw.prepare("SELECT puntos, pct, factor FROM puntos_movimientos WHERE clave = 'factura:in_2'").get()).toEqual({ puntos: 45, pct: 15, factor: 1.5 });
  });
});

describe('Suscripciones del equipo: % de su nivel una vez o 5 % recurrente', () => {
  const factura = (id, monto = 39900) => ({ id, status: 'paid', amount_paid: monto, billing_reason: 'subscription_cycle', status_transitions: { paid_at: Math.floor(Date.now() / 1000) } });
  const renovar = (o, id) => puntosFactura(env, factura(id), { id: `sub_${o.id}`, metadata: { order_id: o.id } });
  const mov = clave => env.DB.raw.prepare('SELECT puntos, pct, factor FROM puntos_movimientos WHERE clave = ?').get(clave);
  const vuelve = ref => compraPagada('negocio@mail.com', ref, 'vuelve-mensual');   // $399 al mes
  beforeEach(() => env.DB.raw.exec("UPDATE products SET activo = 1 WHERE slug = 'vuelve-mensual'"));

  it('por omisión es recurrente: 5 % fijo (sin ×1.5) en el primer pago y en cada renovación, sin límite de 12', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    expect(await A.modoSuscripcion('ana@vorka.mx')).toMatchObject({ modo: 'recurrente', equipo: true, pct_recurrente: 5 });
    const o = await vuelve(eq);
    expect(env.DB.raw.prepare('SELECT ref_modo FROM orders WHERE id = ?').get(o.id).ref_modo).toBe('recurrente');
    expect(ganado('ana@vorka.mx')[0]).toMatchObject({ puntos: 20, pct: 5, factor: 1 });   // 5 % de $399
    for (let i = 2; i <= 15; i++) await renovar(o, `in_r${i}`);
    expect(mov('factura:in_r15')).toEqual({ puntos: 20, pct: 5, factor: 1 });              // pasó la factura 12 y sigue
  });

  it('pago único: su % de nivel con ×1.5 en el primer pago y las renovaciones ya no dan puntos', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    expect(await A.modoSuscripcion('ana@vorka.mx', 'unico')).toMatchObject({ ok: true, modo: 'unico' });
    const o = await vuelve(eq);
    expect(ganado('ana@vorka.mx')[0]).toMatchObject({ pct: 15, factor: 1.5, puntos: 60 });  // 15 % de $399
    await renovar(o, 'in_u2');
    expect(mov('factura:in_u2')).toBeUndefined();
  });

  it('cada venta se queda con su modo aunque cambie la preferencia; al salir del equipo deja de ganar el recurrente', async () => {
    const eq = await A.codigoPuntos('ana@vorka.mx', 'Ana');
    await A.equipoPuntos(['ana@vorka.mx']);
    const o = await vuelve(eq);                       // recurrente
    await A.modoSuscripcion('ana@vorka.mx', 'unico');
    await renovar(o, 'in_c2');
    expect(mov('factura:in_c2')).toMatchObject({ pct: 5 });
    await A.equipoPuntos([]);                          // se dio de baja en Vorka OS
    await renovar(o, 'in_c3');
    expect(mov('factura:in_c3')).toBeUndefined();
    expect((await A.modoSuscripcion('ana@vorka.mx', 'otro')).ok).toBe(false);
  });

  it('fuera del equipo nada cambia: % del nivel en cada pago hasta la factura 12', async () => {
    const ex = await A.codigoPuntos('externa@mail.com', 'Ext');
    const o = await vuelve(ex);
    expect(env.DB.raw.prepare('SELECT ref_modo FROM orders WHERE id = ?').get(o.id).ref_modo).toBeNull();
    await renovar(o, 'in_e2');
    expect(mov('factura:in_e2')).toMatchObject({ pct: 10, factor: 1 });
  });
});
