// Embajadores Vorka (migración 0066): patrocinador por liga de invitación, ganancias de red 5 % / 2 % con tope de 50 %,
// bono de arranque, rangos del mes, reembolsos, RPC para Vorka OS y la página privada del programa.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { procesarPago } from '../src/webhook.js';
import { puntosAlPagar, puntosAlReembolsar, puntosFactura, datosApp } from '../src/puntos.js';
import { redAlReembolsoParcial, rangoMes, gananciasDe, gananciasReales } from '../src/embajadores.js';
import { vistasEmbajador } from '../src/embajadores-app.js';
import { transferibleDe } from '../src/puntos-retiros.js';
import { PCT_RED, PCT_TOPE_VENTA, BONO_ARRANQUE, PCT_TOPE, puntosDe, pctRed, mesMx } from '../src/puntos-reglas.js';
import { REFERIDO, PCT_REFERIDO } from '../src/descuentos.js';

const SITIO = 'https://vorka.mx';
let env, A;
beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"x"}')));
  A = new Admin({}, env);
});
afterEach(() => vi.unstubAllGlobals());

const q = (sql, ...p) => env.DB.raw.prepare(sql).all(...p);
const q1 = (sql, ...p) => env.DB.raw.prepare(sql).get(...p);
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': `10.0.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined }), env);
// Alta en la app con contraseña (mismo flujo de siempre); invito = código de la liga de invitación
async function registrar(email, nombre, invito, extra = {}) {
  const r = await pedir('/api/puntos/registro', { method: 'POST', body: { email, nombre, clave: 'unaclave123', terminos: true, ...(invito ? { invito } : {}) }, ...extra });
  return { status: r.status, cookie: r.headers.get('set-cookie')?.split(';')[0] };
}
const codigo = email => q1("SELECT code FROM affiliates WHERE email = ? AND tipo = 'puntos'", email).code;
const patrocinador = email => q1('SELECT patrocinador FROM puntos_cuentas WHERE email = ?', email)?.patrocinador ?? null;
const red = (email) => q("SELECT puntos, pct, nivel_red, vendedor, venta, nota, clave FROM puntos_movimientos WHERE email = ? AND tipo = 'red' ORDER BY id", email);
const ref = (email, ...a) => q1(`SELECT COALESCE(SUM(puntos), 0) s FROM puntos_movimientos WHERE email = ? AND tipo IN (${a.map(() => '?').join(',')})`, email, ...a).s;

// Compra pagada con la liga de `vendedor` (con el 5 % de descuento por recomendación, como en la tienda)
async function venta(comprador, vendedor, { slug = 'cupo-pro', pi = null, conDescuento = true } = {}) {
  const o = await crearOrden(env, { items: [{ slug }], email: comprador, nombre: 'Cliente', ref: codigo(vendedor),
    descuento: conDescuento ? { tipo: 'referido', codigo: REFERIDO, pct: PCT_REFERIDO, meses: null, app: null } : null });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', provider_payment_id: pi });
  await puntosAlPagar(env, o.id);
  return q1('SELECT * FROM orders WHERE id = ?', o.id);
}
// Red de prueba: Leo (sin patrocinador) → Sara (invitada por Leo) → Tito (invitado por Sara)
async function redBase() {
  await A.codigoPuntos('leo@mail.com', 'Leo Ramírez');
  expect((await registrar('sara@mail.com', 'Sara Gómez', codigo('leo@mail.com'))).status).toBe(200);
  expect((await registrar('tito@mail.com', 'Tito Díaz', codigo('sara@mail.com'))).status).toBe(200);
}
const precio = slug => q1('SELECT precio_centavos FROM products WHERE slug = ?', slug).precio_centavos;

describe('Alta por invitación y patrocinador fijo', () => {
  it('la cuenta nueva queda con su patrocinador (con bitácora); registrarse no da puntos a nadie', async () => {
    await redBase();
    expect(patrocinador('sara@mail.com')).toBe('leo@mail.com');
    expect(patrocinador('tito@mail.com')).toBe('sara@mail.com');
    expect(q("SELECT email, despues, por FROM puntos_patrocinio_bitacora ORDER BY id")).toEqual([
      { email: 'sara@mail.com', despues: 'leo@mail.com', por: 'invitacion' }, { email: 'tito@mail.com', despues: 'sara@mail.com', por: 'invitacion' }]);
    // Sin ganancias por registrarse o por invitar
    expect(q1('SELECT COUNT(*) n FROM puntos_movimientos').n).toBe(0);
  });

  it('la cookie de /tienda/puntos/unete/ también sirve; quien ya tiene cuenta no cambia de patrocinador', async () => {
    await redBase();
    const u = await pedir(`/tienda/puntos/unete/${codigo('leo@mail.com')}`);
    expect(u.status).toBe(200);
    const galleta = u.headers.get('set-cookie').split(';')[0];
    expect(galleta).toBe(`vorka_unete=${codigo('leo@mail.com')}`);
    expect((await registrar('nora@mail.com', 'Nora Luna', null, { cookie: galleta })).status).toBe(200);
    expect(patrocinador('nora@mail.com')).toBe('leo@mail.com');
    // Tito ya tiene cuenta: registrarse otra vez con otra liga no cambia nada
    expect((await registrar('tito@mail.com', 'Tito', codigo('nora@mail.com'))).status).toBe(409);
    expect(patrocinador('tito@mail.com')).toBe('sara@mail.com');
    // Abrir otra liga con sesión: la página lo dice y no cambia
    const { cookie } = await registrar('ivan@mail.com', 'Iván Soto', codigo('sara@mail.com'));
    const h = await (await pedir(`/tienda/puntos/unete/${codigo('leo@mail.com')}`, { cookie })).text();
    expect(h).toContain('Tu equipo no cambia');
    expect(patrocinador('ivan@mail.com')).toBe('sara@mail.com');
    // Una cuenta que ya existía (liga de Brindi, sin contraseña) no toma patrocinador al crear su contraseña
    await A.codigoPuntos('anfitrion@mail.com', 'Anfitrión');
    expect((await registrar('anfitrion@mail.com', 'Anfitrión', codigo('leo@mail.com'))).status).toBe(409);
    expect(patrocinador('anfitrion@mail.com')).toBe(null);
  });

  it('un código que no existe no deja patrocinador', async () => {
    expect((await registrar('sola@mail.com', 'Sola', 'NOEXISTE99')).status).toBe(200);
    expect(patrocinador('sola@mail.com')).toBe(null);
  });
});

describe('Cambio de patrocinador (admin) sin ciclos', () => {
  it('rechaza patrocinarse a sí mismo y a alguien de su propio equipo; con motivo deja bitácora', async () => {
    await redBase();
    expect(await A.cambiarPatrocinador('leo@mail.com', 'leo@mail.com', 'Prueba de ciclo')).toMatchObject({ ok: false });
    expect(await A.cambiarPatrocinador('leo@mail.com', 'tito@mail.com', 'Prueba de ciclo')).toMatchObject({ ok: false, error: expect.stringContaining('ciclo') });
    expect(await A.cambiarPatrocinador('leo@mail.com', 'sara@mail.com', 'Prueba de ciclo')).toMatchObject({ ok: false });
    expect(await A.cambiarPatrocinador('tito@mail.com', 'leo@mail.com', '')).toMatchObject({ ok: false, error: 'Escribe el motivo del cambio.' });
    expect(await A.cambiarPatrocinador('tito@mail.com', 'nadie@mail.com', 'Corrección')).toMatchObject({ ok: false });
    expect(await A.cambiarPatrocinador('tito@mail.com', 'leo@mail.com', 'Lo invitó Leo en persona', 'brandon@vorka.mx')).toMatchObject({ ok: true, antes: 'sara@mail.com', despues: 'leo@mail.com' });
    expect(patrocinador('tito@mail.com')).toBe('leo@mail.com');
    expect(q1("SELECT antes, despues, motivo, por FROM puntos_patrocinio_bitacora WHERE email = 'tito@mail.com' ORDER BY id DESC")).toEqual(
      { antes: 'sara@mail.com', despues: 'leo@mail.com', motivo: 'Lo invitó Leo en persona', por: 'brandon@vorka.mx' });
    expect(await A.cambiarPatrocinador('tito@mail.com', null, 'Quitar patrocinador')).toMatchObject({ ok: true, despues: null });
  });
});

describe('Ganancias de red', () => {
  it('5 % al nivel 1 y 2 % al nivel 2 sobre lo cobrado (precio real de la base, con el 5 % al cliente); nota sin datos del cliente', async () => {
    await redBase();
    const o = await venta('cliente@correo.com', 'tito@mail.com');
    const cobrado = precio('cupo-pro') - Math.round(precio('cupo-pro') * 5 / 100);
    expect(o.monto_centavos).toBe(cobrado);   // Cupo Pro $149 → $141.55
    expect(q1("SELECT puntos, pct FROM puntos_movimientos WHERE email = 'tito@mail.com' AND tipo = 'ganado'")).toEqual({ puntos: puntosDe(cobrado, 10), pct: 10 });
    expect(red('sara@mail.com')).toEqual([expect.objectContaining({ puntos: puntosDe(cobrado, 5), pct: 5, nivel_red: 1, vendedor: 'tito@mail.com', venta: o.id, nota: 'Venta de tu equipo · Tito D. (nivel 1)' })]);
    expect(red('leo@mail.com')).toEqual([expect.objectContaining({ puntos: puntosDe(cobrado, 2), pct: 2, nivel_red: 2, nota: 'Venta de tu equipo · Tito D. (nivel 2)' })]);
    expect([puntosDe(cobrado, 10), puntosDe(cobrado, 5), puntosDe(cobrado, 2)]).toEqual([14, 7, 3]);
    expect(JSON.stringify(q('SELECT * FROM puntos_movimientos'))).not.toContain('cliente@correo.com');
    expect(JSON.stringify(q('SELECT * FROM puntos_notificaciones'))).not.toContain('cliente@correo.com');
    // Sin ×1.5 aunque el patrocinador sea del equipo de Vorka
    await A.equipoPuntos(['sara@mail.com']);
    await venta('otro@correo.com', 'tito@mail.com');
    expect(red('sara@mail.com').map(x => x.pct)).toEqual([5, 5]);
  });

  it('tope de 50 % por venta: Diamante del equipo (×1.5 → 40 %) + 5 % de descuento deja 5 % al nivel 1 y nada al nivel 2', async () => {
    await redBase();
    expect(pctRed(PCT_TOPE, PCT_REFERIDO)).toEqual([5, 0]);
    expect(pctRed(30, 5)).toEqual([5, 2]);
    expect(pctRed(45, 5)).toEqual([0, 0]);
    expect(pctRed(44, 5)).toEqual([1, 0]);
    await A.equipoPuntos(['tito@mail.com']);
    for (let i = 0; i < 50; i++) env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, order_id) VALUES ('tito@mail.com', 'ganado', 1, ?)").run(`previa-${i}`);
    const o = await venta('cliente@correo.com', 'tito@mail.com');
    const g = q1("SELECT pct, factor FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'", o.id);
    expect(g).toEqual({ pct: PCT_TOPE, factor: 1.5 });
    expect(red('sara@mail.com')).toEqual([expect.objectContaining({ pct: 5, nivel_red: 1 })]);
    expect(red('leo@mail.com')).toEqual([]);
    expect(g.pct + PCT_REFERIDO + red('sara@mail.com')[0].pct).toBeLessThanOrEqual(PCT_TOPE_VENTA);
  });

  it('el líder cobra de su equipo aunque él no venda; idempotente frente a reintentos del webhook', async () => {
    await redBase();
    const o = await crearOrden(env, { items: [{ slug: 'cupo-pro' }], email: 'cliente@correo.com', nombre: 'Cliente', ref: codigo('tito@mail.com') });
    const pago = { orderId: o.id, resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' };
    for (let i = 0; i < 3; i++) await procesarPago(env, pago);
    expect(red('sara@mail.com')).toHaveLength(1);
    expect(red('leo@mail.com')).toHaveLength(1);
    expect(q1("SELECT COUNT(*) n FROM puntos_notificaciones WHERE email = 'sara@mail.com' AND tipo = 'red'").n).toBe(1);
    expect(ref('leo@mail.com', 'ganado')).toBe(0);
  });

  it('compras propias o dentro de la red no cuentan para la red, el bono ni los rangos', async () => {
    await redBase();
    await venta('tito@mail.com', 'tito@mail.com');           // a sí mismo: ni puntos
    expect(ref('tito@mail.com', 'ganado')).toBe(0);
    const o = await venta('sara@mail.com', 'tito@mail.com');  // su patrocinadora le compra
    expect(q1("SELECT excluida FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'", o.id).excluida).toBe(1);
    await venta('leo@mail.com', 'tito@mail.com');            // el de nivel 2 le compra
    expect(red('sara@mail.com')).toEqual([]);
    expect(red('leo@mail.com')).toEqual([]);
    expect(ref('tito@mail.com', 'arranque')).toBe(0);
    expect((await rangoMes(env, 'sara@mail.com')).activos).toBe(0);
  });

  it('lo pagado con saldo del Toolkit y los productos de creadores no dan red', async () => {
    await redBase();
    // Orden de saldo: $0 y sin liga (así las crea toolkit.js)
    const o = await crearOrden(env, { items: [{ slug: 'cupo-pro' }], email: 'cliente@correo.com', nombre: 'Cliente', ref: codigo('tito@mail.com'), proveedor: 'saldo' });
    env.DB.raw.prepare("UPDATE orders SET monto_centavos = 0, saldo_centavos = 14900 WHERE id = ?").run(o.id);
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 0, moneda: 'MXN' });
    await puntosAlPagar(env, o.id);
    env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado, stripe_listo) VALUES ('cre_a', 'Ale', 'ale@mail.com', 'aprobado', 1);
      INSERT INTO products (id, slug, nombre, precio_centavos, r2_keys, creador_id, revision, activo) VALUES ('prod_ale', 'guia-ale', 'Guía de Ale', 9900, '[]', 'cre_a', 'aprobado', 1);`);
    await venta('cliente2@correo.com', 'tito@mail.com', { slug: 'guia-ale', conDescuento: false });
    expect(ref('tito@mail.com', 'ganado')).toBe(0);
    expect(red('sara@mail.com')).toEqual([]);
    expect(red('leo@mail.com')).toEqual([]);
  });

  it('reembolso parcial revierte la parte proporcional (idempotente) y el total revierte el resto', async () => {
    await redBase();
    const v = await venta('cliente@correo.com', 'tito@mail.com', { pi: 'pi_2' });
    const [n1] = red('sara@mail.com'), [n2] = red('leo@mail.com');
    const rev = { pago_id: 'pi_2', parcial: true, monto: v.monto_centavos, reembolsado: Math.round(v.monto_centavos / 2) };
    await redAlReembolsoParcial(env, rev);
    await redAlReembolsoParcial(env, rev);   // mismo evento otra vez
    expect(ref('sara@mail.com', 'red')).toBe(n1.puntos - Math.round(n1.puntos / 2));
    expect(ref('leo@mail.com', 'red')).toBe(n2.puntos - Math.round(n2.puntos / 2));
    // Reembolso completo después: se revierte lo que quedaba (y el ganado del vendedor, como siempre)
    await aplicarPago(env, v.id, { resultado: 'reembolsado', provider_payment_id: 'pi_2' });
    await puntosAlReembolsar(env, v.id);
    await puntosAlReembolsar(env, v.id);
    expect(ref('sara@mail.com', 'red')).toBe(0);
    expect(ref('leo@mail.com', 'red')).toBe(0);
    expect(ref('tito@mail.com', 'ganado', 'revertido')).toBe(0);
  });

  it('reembolso total directo revierte toda la red', async () => {
    await redBase();
    const v = await venta('cliente@correo.com', 'tito@mail.com');
    await puntosAlReembolsar(env, v.id);
    expect(ref('sara@mail.com', 'red')).toBe(0);
    expect(red('sara@mail.com').map(x => x.puntos)).toEqual([7, -7]);
  });

  it('las ganancias de red se retienen los mismos días para transferir', async () => {
    await redBase();
    await venta('cliente@correo.com', 'tito@mail.com');
    const t = await transferibleDe(env, 'sara@mail.com');
    expect(t).toMatchObject({ disponibles: 7, retenidos: 7, transferibles: 0 });
    expect((await transferibleDe(env, 'sara@mail.com', new Date(Date.now() + 8 * 864e5))).transferibles).toBe(7);
  });
});

describe('Suscripciones', () => {
  const factura = (id, monto = 39900) => ({ id, status: 'paid', amount_paid: monto, billing_reason: 'subscription_cycle', status_transitions: { paid_at: Math.floor(Date.now() / 1000) } });
  beforeEach(() => env.DB.raw.exec("UPDATE products SET activo = 1 WHERE slug = 'vuelve-mensual'"));

  it('vendedor del equipo en 5 % recurrente: la red cobra 5 / 2 en el primer pago y en las renovaciones hasta la 12', async () => {
    await redBase();
    await A.equipoPuntos(['tito@mail.com']);
    const o = await venta('negocio@correo.com', 'tito@mail.com', { slug: 'vuelve-mensual', conDescuento: false });
    expect(red('sara@mail.com').map(x => x.puntos)).toEqual([puntosDe(o.monto_centavos, 5)]);
    const sub = { id: 'sub_1', metadata: { order_id: o.id } };
    for (let n = 2; n <= 13; n++) await puntosFactura(env, factura(`in_${n}`), sub);
    await puntosFactura(env, factura('in_5'), sub);   // reintento
    // El vendedor gana en las 13 (recurrente sin límite); la red, hasta la factura 12
    expect(q1("SELECT COUNT(*) n FROM puntos_movimientos WHERE email = 'tito@mail.com' AND tipo = 'ganado'").n).toBe(13);
    expect(red('sara@mail.com')).toHaveLength(12);
    expect(red('leo@mail.com')).toHaveLength(12);
    expect(red('sara@mail.com')[1]).toMatchObject({ puntos: puntosDe(39900, 5), venta: 'factura:in_2', nota: 'Venta de tu equipo · Tito D. (nivel 1) · renovación' });
    expect(red('leo@mail.com')[1]).toMatchObject({ puntos: puntosDe(39900, 2) });
  });

  it('vendedor fuera del equipo (solo el primer pago): las renovaciones no le dan puntos y la red tampoco cobra', async () => {
    await redBase();
    const o = await venta('negocio@correo.com', 'tito@mail.com', { slug: 'vuelve-mensual' });
    await puntosFactura(env, factura('in_2'), { id: 'sub_2', metadata: { order_id: o.id } });
    expect(red('sara@mail.com')).toHaveLength(1);
  });
});

describe('Bono de arranque', () => {
  it('+50 al vendedor nuevo en su primera venta dentro de 30 días, una sola vez; no al líder ni a la red; se revierte con el reembolso', async () => {
    await redBase();
    const v1 = await venta('c1@correo.com', 'tito@mail.com');
    await venta('c2@correo.com', 'tito@mail.com');
    expect(q("SELECT puntos FROM puntos_movimientos WHERE email = 'tito@mail.com' AND tipo = 'arranque'")).toEqual([{ puntos: BONO_ARRANQUE }]);
    expect(ref('sara@mail.com', 'arranque') + ref('leo@mail.com', 'arranque')).toBe(0);
    // la red se calcula solo sobre las ventas (el bono no da red)
    expect(ref('sara@mail.com', 'red')).toBe(14);
    await puntosAlReembolsar(env, v1.id);
    expect(ref('tito@mail.com', 'arranque')).toBe(0);
    await venta('c3@correo.com', 'tito@mail.com');   // no se vuelve a dar
    expect(ref('tito@mail.com', 'arranque')).toBe(0);
  });

  it('fuera de 30 días no hay bono; tampoco para cuentas que no entraron con invitación', async () => {
    await redBase();
    env.DB.raw.prepare("UPDATE puntos_cuentas SET created_at = ? WHERE email = 'tito@mail.com'").run(new Date(Date.now() - 31 * 864e5).toISOString());
    await venta('c1@correo.com', 'tito@mail.com');
    expect(ref('tito@mail.com', 'arranque')).toBe(0);
    await venta('c2@correo.com', 'leo@mail.com');   // Leo no tiene patrocinador
    expect(ref('leo@mail.com', 'arranque')).toBe(0);
  });
});

describe('Rangos del mes', () => {
  const nueva = async (email, nombre, pat) => { await A.codigoPuntos(email, nombre); if (pat) env.DB.raw.prepare('UPDATE puntos_cuentas SET patrocinador = ? WHERE email = ?').run(pat, email); };
  it('Líder: 3 de su equipo directo con venta en el mes, sin ventas propias; Élite con 2 Líderes; aviso una vez', async () => {
    await nueva('eva@mail.com', 'Eva Ruiz');
    for (const x of ['a', 'b', 'c']) await nueva(`${x}@mail.com`, `Persona ${x}`, 'eva@mail.com');
    for (const x of ['a1', 'a2', 'a3']) await nueva(`${x}@mail.com`, `P ${x}`, 'a@mail.com');
    for (const x of ['b1', 'b2', 'b3']) await nueva(`${x}@mail.com`, `P ${x}`, 'b@mail.com');
    expect((await rangoMes(env, 'eva@mail.com')).id).toBe('vendedor');
    let i = 0;
    for (const x of ['a1', 'a2', 'a3']) await venta(`c${i++}@correo.com`, `${x}@mail.com`);
    expect(await rangoMes(env, 'a@mail.com')).toMatchObject({ id: 'lider', activos: 3 });   // A no vendió y es Líder
    expect(ref('a@mail.com', 'ganado')).toBe(0);
    for (const x of ['b1', 'b2', 'b3']) await venta(`c${i++}@correo.com`, `${x}@mail.com`);
    for (const x of ['a', 'b']) await venta(`c${i++}@correo.com`, `${x}@mail.com`);
    expect((await rangoMes(env, 'eva@mail.com')).id).toBe('vendedor');   // 2 activos
    await venta(`c${i++}@correo.com`, 'c@mail.com');
    expect(await rangoMes(env, 'eva@mail.com')).toMatchObject({ id: 'elite', activos: 3, lideres: 2 });
    expect(q("SELECT email, rango FROM puntos_rangos ORDER BY email")).toEqual([{ email: 'a@mail.com', rango: 'lider' }, { email: 'b@mail.com', rango: 'lider' }, { email: 'eva@mail.com', rango: 'elite' }]);
    expect(q("SELECT titulo FROM puntos_notificaciones WHERE email = 'eva@mail.com' AND tipo = 'rango'")).toEqual([{ titulo: '¡Subiste a Líder Élite!' }]);
    // El mes siguiente se empieza de nuevo
    const sig = mesMx(new Date(Date.parse(mesMx().hasta) + 864e5)).id;
    expect((await rangoMes(env, 'eva@mail.com', sig)).id).toBe('vendedor');
    // Líderes del mes: solo quienes activaron el Top
    expect((await A.resumenEmbajadores({})).por_rango).toMatchObject({ lider: 2, elite: 1 });
    env.DB.raw.exec("UPDATE puntos_cuentas SET ranking = 1 WHERE email = 'eva@mail.com'");
    const d = await datosApp(env, 'a@mail.com');
    expect(d.embajadores.lideres).toEqual([expect.objectContaining({ nombre: 'Eva R.', rango: 'Líder Élite', email: undefined })]);
  });
});

describe('RPC para Vorka OS', () => {
  it('resumenEmbajadores separa propias / red 1 / red 2 / bono y calcula el % de ventas propias', async () => {
    await redBase();
    await venta('c1@correo.com', 'tito@mail.com');   // Tito 14 + bono 50 · Sara 7 · Leo 3
    await venta('c2@correo.com', 'sara@mail.com');   // Sara 14 + bono 50 · Leo 7
    const r = await A.resumenEmbajadores({ mes: mesMx().id });
    expect(r.embajadores).toMatchObject({ registrados: 3, activos: 2, nuevos: 3, nuevos_invitados: 2 });
    expect(r.puntos).toEqual({ propias: 28, red_nivel1: 14, red_nivel2: 3, arranque: 100, total: 145 });
    expect(r.pct_propias).toBe(Math.round(28 / 145 * 1000) / 10);
    expect(r).toMatchObject({ meta_pct_propias: 80, cumple_meta: false, ventas: { validas: 2 } });
    expect(r.top_vendedores.map(x => x.email).sort()).toEqual(['sara@mail.com', 'tito@mail.com']);
    expect(JSON.stringify(r)).not.toContain('correo.com');   // nunca datos de clientes
    const e = await A.embajador('sara@mail.com');
    expect(e).toMatchObject({ patrocinador: { email: 'leo@mail.com' }, conteos: { directos: 1, nivel2: 0, activos_mes: 1 },
      equipo_directo: [expect.objectContaining({ email: 'tito@mail.com', ventas_mes: 1, activo: true })] });
    expect(e.ganancias.mes).toMatchObject({ propias: 14, arranque: 50, red1: 7, red2: 0 });
    expect(JSON.stringify(e)).not.toContain('correo.com');
    expect(await A.embajador('nadie@mail.com')).toBe(null);
  });
});

describe('Pantallas', () => {
  it('Mi equipo, Mis ganancias e Invita en la app; sin datos de clientes', async () => {
    await redBase();
    await registrar('mia@mail.com', 'Mía Paz', codigo('sara@mail.com'));
    env.DB.raw.prepare("UPDATE puntos_cuentas SET created_at = ? WHERE email = 'mia@mail.com'").run(new Date(Date.now() - 40 * 864e5).toISOString());
    await venta('cliente@correo.com', 'tito@mail.com');
    const { cookie } = await registrar('x@mail.com', 'Xavi', null);   // solo para tener un flujo de sesión
    expect(cookie).toBeTruthy();
    const d = await datosApp(env, 'sara@mail.com');
    expect(d.embajadores.equipo.map(p => p.nombre)).toEqual(['Tito Díaz', 'Mía Paz']);
    expect(d.embajadores.equipo[1]).toMatchObject({ dias_sin_vender: 40, nunca: true });
    expect(d.embajadores.ganancias.mes.red1).toBe(7);
    const html = vistasEmbajador(d);
    for (const t of ['id="v-equipo"', 'id="v-ganancias"', 'id="v-invita"', 'Aún no vende', 'Copiar mensaje de ánimo', '/tienda/puntos/unete/', 'no se gana por invitar']) expect(html).toContain(t);
    expect(html).not.toContain('cliente@correo.com');
    expect(html).not.toContain('tito@mail.com');   // ni los correos de su equipo
    const leo = await datosApp(env, 'leo@mail.com');
    expect(leo.embajadores.nivel2).toEqual([expect.objectContaining({ de: 'Sara G.', personas: 2, activos: 1, nombres: ['Mía P.', 'Tito D.'] })]);
  });

  it('la app con sesión tiene la pestaña Equipo', async () => {
    const { cookie } = await registrar('ana@mail.com', 'Ana', null);
    const h = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(h).toContain('data-ir="equipo"');
    expect(h).toContain('id="v-invita"');
  });
});

describe('Página del programa: privada', () => {
  it('sin sesión ni liga no se muestra; con liga válida o con sesión sí; siempre noindex', async () => {
    await A.codigoPuntos('leo@mail.com', 'Leo Ramírez');
    let r = await pedir('/tienda/puntos/embajadores/');
    expect(r.status).toBe(404);
    expect(await r.text()).toContain('Pide la liga a quien te invitó');
    expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    r = await pedir('/tienda/puntos/embajadores/?i=NOEXISTE');
    expect(r.status).toBe(404);
    r = await pedir(`/tienda/puntos/embajadores/?i=${codigo('leo@mail.com')}`);
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(h).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(h).toContain('Te invitó <b>Leo R.</b>');
    expect(h).toContain('BORRADOR');
    expect(h).toContain(`$${(precio('cupo-pro') / 100).toLocaleString('es-MX')}`);   // ejemplo con precios reales
    expect(h).not.toContain('id="ganancias-reales"');   // menos de 20 cuentas con ganancias
    // con la cookie de la liga de invitación
    r = await pedir('/tienda/puntos/embajadores/', { cookie: `vorka_unete=${codigo('leo@mail.com')}` });
    expect(r.status).toBe(200);
    // con sesión
    const { cookie } = await registrar('ana@mail.com', 'Ana', null);
    r = await pedir('/tienda/puntos/embajadores/', { cookie });
    expect(r.status).toBe(200);
    // registro por invitación: noindex, y una liga inválida no se muestra
    r = await pedir(`/tienda/puntos/unete/${codigo('leo@mail.com')}`);
    expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await r.text()).toContain('Leo R.</b> te invita');
    expect((await pedir('/tienda/puntos/unete/NOEXISTE')).status).toBe(404);
  });

  it('la página pública de Puntos, el sitemap y la app sin sesión no mencionan la red', async () => {
    for (const ruta of ['/tienda/puntos/', '/tienda/cuenta/', '/tienda/sitemap.xml', '/tienda/']) {
      const h = await (await pedir(ruta)).text();
      expect(h).not.toContain('/tienda/puntos/embajadores');
      expect(h).not.toContain('Embajadores Vorka');
      expect(h).not.toMatch(/nivel 2|ganancias de equipo/i);
    }
  });

  it('Ganancias reales aparece solo con al menos 20 cuentas con ganancias (promedio y mediana reales)', async () => {
    expect((await gananciasReales(env)).visible).toBe(false);
    const mesPasado = new Date(Date.parse(mesMx().desde) - 10 * 864e5).toISOString();
    for (let i = 1; i <= 20; i++) env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, order_id, created_at) VALUES (?, 'ganado', ?, ?, ?)").run(`p${i}@mail.com`, i * 10, `o${i}`, mesPasado);
    expect(await gananciasReales(env)).toMatchObject({ visible: true, cuentas: 20, promedio: 105, mediana: 105 });
    await A.codigoPuntos('leo@mail.com', 'Leo');
    const h = await (await pedir(`/tienda/puntos/embajadores/?i=${codigo('leo@mail.com')}`)).text();
    expect(h).toContain('id="ganancias-reales"');
    expect(h).toContain('mediana 105 puntos');
  });
});

describe('gananciasDe', () => {
  it('separa mis ventas (con bono) y mi equipo, del mes y del semestre', async () => {
    await redBase();
    await venta('c1@correo.com', 'tito@mail.com');
    const g = await gananciasDe(env, 'sara@mail.com');
    expect(g.mes).toMatchObject({ mis_ventas: 0, mi_equipo: 7, red1: 7, red2: 0, total: 7 });
    expect(g.semestre.total).toBe(7);
    expect(PCT_RED).toEqual([5, 2]);
  });
});
