// Socios Vorka: alta, atribución (liga y código), descuento, comisión escalonada por mes, retención, reembolsos,
// suscripciones, pagos (lote semanal e inmediato), portal con enlace mágico y seguridad.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { enc, hex } from '../src/util.js';
import { clabeValida, comisionAlPagar, comisionAlReembolsar, comisionFactura, liberarComisiones, loteSemanal, crearPago, pctPara } from '../src/socios.js';

const SECRETO = 'whsec_prueba';
let env, correos, llamadas, stripe;
// CLABE de prueba con su dígito verificador correcto
const clabe = base => base + (10 - [...base].reduce((s, d, i) => s + (Number(d) * [3, 7, 1][i % 3]) % 10, 0) % 10) % 10;
const CLABE = clabe('01218000118359719'.slice(0, 17));
const A = () => { const a = new Admin({}, env); a.env = env; return a; };
const pedir = (ruta, { metodo = 'GET', body, cookie, ip = '1.1.1.1', origin } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, redirect: 'manual', headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) },
  body: body ? JSON.stringify(body) : undefined }), env);
const fila = (sql, ...p) => env.DB.raw.prepare(sql).get(...p);
const filas = (sql, ...p) => env.DB.raw.prepare(sql).all(...p);
const nuevoSocio = (x = {}) => A().guardarSocio({ code: 'ana-celaya', nombre: 'Ana López', email: 'ana@socia.mx', telefono: '461 123 4567', clabe: CLABE, banco: 'BBVA', ...x });

// Una venta pagada con el socio en una fecha dada (paid_at controla el mes y la retención)
async function venta(socio, pagada, { slug = 'de-idea-a-proyecto', email = `c${Math.random().toString(36).slice(2, 8)}@mail.com` } = {}) {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Cliente', socio });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  env.DB.raw.prepare('UPDATE orders SET paid_at = ? WHERE id = ?').run(pagada, o.id);
  await comisionAlPagar(env, o.id);
  return o;
}

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto, extra = {}) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, ...extra } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}

beforeEach(() => {
  correos = []; llamadas = []; stripe = {};
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 's'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    llamadas.push({ url, params: new URLSearchParams(init.body) });
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/coupons')) return ok({ id: 'cupon_1' });
    if (url.endsWith('/checkout/sessions')) return ok({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/x' });
    if (url.includes('/checkout/sessions/')) return ok(stripe.sesion);
    if (url.includes('/payment_intents/')) return ok(stripe.pi);
    if (url.includes('/subscriptions/')) return ok(stripe.sub);
    if (url.includes('/invoices/')) return ok(stripe.factura);
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('alta de socios (Vorka OS)', () => {
  it('valida la CLABE con su dígito verificador, guarda el código en mayúsculas y no repite códigos', async () => {
    expect(clabeValida(CLABE)).toBe(true);
    expect(clabeValida(CLABE.slice(0, 17) + ((Number(CLABE[17]) + 1) % 10))).toBe(false);
    expect(clabeValida('12345')).toBe(false);
    await expect(nuevoSocio({ clabe: CLABE.slice(0, 17) + ((Number(CLABE[17]) + 1) % 10) })).rejects.toThrow(/CLABE no es válida/);
    await expect(nuevoSocio({ code: 'ana celaya' })).rejects.toThrow(/código/);
    await expect(nuevoSocio({ rfc: 'XXX' })).rejects.toThrow(/RFC/);
    const s = await nuevoSocio({ rfc: 'lopa800101ab1', invitar: true });
    expect(s.socio).toMatchObject({ code: 'ANA-CELAYA', rfc: 'LOPA800101AB1', estado: 'activo', descuento_pct: 0 });
    await expect(nuevoSocio({ code: 'Ana-Celaya', email: 'otra@mail.com' })).rejects.toThrow(/ya es de otro socio/);
    // Bienvenida con su código, su liga y el portal (sin contraseña)
    expect(correos[0].para).toBe('ana@socia.mx');
    expect(correos[0].texto).toContain('https://vorka.mx/tienda/?socio=ANA-CELAYA');
    expect(correos[0].texto).toContain('/tienda/socios/');
    // La lista del panel no muestra la CLABE completa
    const [l] = await A().socios();
    expect(l.clabe).toBe(`•••• ${CLABE.slice(-4)}`);
  });
});

describe('atribución y descuento', () => {
  it('la liga ?socio= deja la cookie 30 días y el checkout liga la orden, con el descuento del socio en el cupón', async () => {
    await nuevoSocio({ descuento_pct: 10 });
    const v = await pedir('/tienda/?socio=ana-celaya');
    const galleta = v.headers.get('set-cookie');
    expect(galleta).toMatch(/vorka_socio=ANA-CELAYA; Max-Age=2592000; Path=\/; Secure; HttpOnly; SameSite=Lax/);
    // ?codigo= también sirve en cualquier página de la tienda
    expect((await pedir('/tienda/de-idea-a-proyecto/?codigo=ANA-CELAYA')).headers.get('set-cookie')).toMatch(/vorka_socio=ANA-CELAYA/);
    const r = await pedir('/api/checkout', { metodo: 'POST', cookie: galleta.split(';')[0], body: { nombre: 'Beto', email: 'beto@mail.com', terminos: true, slug: 'de-idea-a-proyecto' } });
    expect(r.status).toBe(200);
    expect(fila('SELECT * FROM orders')).toMatchObject({ socio_id: 1, socio_descuento_centavos: 2790, descuento_centavos: 2790, monto_centavos: 25110, puntos_usados: 0 });
    const cupon = llamadas.find(l => l.url.endsWith('/coupons')).params;
    expect(cupon.get('amount_off')).toBe('2790');
    expect(cupon.get('name')).toBe('Código ANA-CELAYA');
  });

  it('descuento del socio y puntos juntos: un solo cupón, primero el código y luego puntos enteros (queda al menos el cobro mínimo)', async () => {
    await nuevoSocio({ descuento_pct: 10 });
    await pedir('/api/puntos/entrar', { metodo: 'POST', body: { email: 'beto@mail.com', nombre: 'Beto', terminos: true } });
    const acceso = correos.at(-1).texto.match(/https:\/\/vorka\.mx(\/tienda\/puntos\/acceso\/[a-f0-9]{64})/)[1];
    const sesion = (await pedir(acceso)).headers.get('set-cookie').split(';')[0];
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('beto@mail.com', 'ajuste', 500, 'prueba')");
    const r = await pedir('/api/checkout', { metodo: 'POST', cookie: sesion, body: { nombre: 'Beto', email: 'beto@mail.com', terminos: true, slug: 'cupo-pro', codigo: 'ANA-CELAYA', usar_puntos: true } });
    expect(r.status).toBe(200);
    expect(fila('SELECT socio_descuento_centavos, puntos_usados, descuento_centavos, monto_centavos FROM orders')).toEqual({ socio_descuento_centavos: 1490, puntos_usados: 124, descuento_centavos: 1490 + 12400, monto_centavos: 1010 });
    expect(llamadas.find(l => l.url.endsWith('/coupons')).params.get('name')).toBe('Código ANA-CELAYA + Puntos Vorka');
  });

  it('el código escrito en el checkout funciona sin liga y gana sobre la cookie de otro socio', async () => {
    await nuevoSocio();
    await nuevoSocio({ code: 'LUIS-LEON', nombre: 'Luis', email: 'luis@socio.mx' });
    const r = await pedir('/api/checkout', { metodo: 'POST', cookie: 'vorka_socio=LUIS-LEON', body: { nombre: 'Beto', email: 'beto@mail.com', terminos: true, slug: 'de-idea-a-proyecto', codigo: 'ana-celaya' } });
    expect(r.status).toBe(200);
    expect(fila('SELECT socio_id, monto_centavos FROM orders')).toEqual({ socio_id: 1, monto_centavos: 27900 });
  });

  it('un código que no existe, de un socio suspendido o el propio se ignora (la compra sigue sin descuento)', async () => {
    await nuevoSocio({ descuento_pct: 20 });
    const comprar = (extra, email = 'beto@mail.com') => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Beto', email, terminos: true, slug: 'de-idea-a-proyecto', ...extra } });
    expect((await comprar({ codigo: 'NO-EXISTE' })).status).toBe(200);
    expect((await comprar({ codigo: 'ANA-CELAYA' }, 'ana@socia.mx')).status).toBe(200);   // comprarse a sí misma
    await A().estadoSocio(1, 'suspendido');
    expect((await comprar({ codigo: 'ANA-CELAYA' }, 'caro@mail.com')).status).toBe(200);
    expect(filas('SELECT socio_id, monto_centavos FROM orders').every(o => o.socio_id === null && o.monto_centavos === 27900)).toBe(true);
    expect((await pedir('/tienda/?socio=ANA-CELAYA')).headers.get('set-cookie')).toBeNull();
    expect(await (await pedir('/api/socios/codigo?c=ANA-CELAYA')).json()).toEqual({ valido: false });
  });

  it('el buscador de códigos solo dice nombre y descuento, y tiene límite por IP', async () => {
    await nuevoSocio({ descuento_pct: 10 });
    expect(await (await pedir('/api/socios/codigo?c=ana-celaya')).json()).toMatchObject({ valido: true, codigo: 'ANA-CELAYA', nombre: 'Ana', descuento_pct: 10 });
    const j = await (await pedir('/api/socios/codigo', { cookie: 'vorka_socio=ANA-CELAYA' })).json();
    expect(j).toMatchObject({ valido: true, de_liga: true });
    expect(JSON.stringify(j)).not.toMatch(/socia\.mx|clabe|telefono/i);
    let ultimo;
    for (let i = 0; i < 31; i++) ultimo = await pedir(`/api/socios/codigo?c=PRUEBA${i}`, { ip: '7.7.7.7' });
    expect(ultimo.status).toBe(429);
    // El formulario de compra trae el campo de código de socio
    expect(await (await pedir('/tienda/de-idea-a-proyecto/')).text()).toContain('¿Tienes un código de socio?');
  });
});

describe('comisiones', () => {
  it('escalonada: 15% en las ventas 1 a 10 del mes, 25% desde la 11; el mes siguiente vuelve a empezar (hora de CDMX)', async () => {
    await nuevoSocio();
    for (let i = 0; i < 10; i++) await venta(1, `2026-10-${String(10 + i).padStart(2, '0')}T18:00:00.000Z`);
    // 31 de octubre a las 23:00 en CDMX (1 de noviembre en UTC): sigue siendo octubre → venta 11
    await venta(1, '2026-11-01T05:00:00.000Z');
    await venta(1, '2026-11-01T07:00:00.000Z');   // 1 de noviembre 01:00 en CDMX → venta 1 de noviembre
    const c = filas('SELECT venta_n, pct, base_centavos, monto_centavos, mes, estado FROM socios_comisiones ORDER BY id');
    expect(c.slice(0, 10).every((x, i) => x.venta_n === i + 1 && x.pct === 15 && x.monto_centavos === 4185 && x.mes === '2026-10')).toBe(true);
    expect(c[10]).toMatchObject({ venta_n: 11, pct: 25, base_centavos: 27900, monto_centavos: 6975, mes: '2026-10', estado: 'pendiente' });
    expect(c[11]).toMatchObject({ venta_n: 1, pct: 15, mes: '2026-11' });
    expect(pctPara([{ desde: 1, pct: 15 }, { desde: 11, pct: 25 }], 10)).toBe(15);
    // Idempotente: el webhook repetido no duplica
    await comisionAlPagar(env, filas('SELECT id FROM orders')[0].id);
    expect(filas('SELECT id FROM socios_comisiones')).toHaveLength(12);
  });

  it('los niveles se pueden cambiar en general y por socio', async () => {
    await A().guardarAjustesSocios({ niveles: [{ desde: 1, pct: 10 }, { desde: 3, pct: 20 }], retencion_dias: 7, facturas_suscripcion: 12, correo_avisos: 'pagos@vorka.mx' });
    await expect(A().guardarAjustesSocios({ niveles: [{ desde: 2, pct: 10 }], retencion_dias: 7, facturas_suscripcion: 12, correo_avisos: 'pagos@vorka.mx' })).rejects.toThrow(/venta 1/);
    await nuevoSocio();
    await nuevoSocio({ code: 'LUIS', email: 'luis@socio.mx', niveles: [{ desde: 1, pct: 30 }] });
    for (let i = 0; i < 3; i++) await venta(1, '2026-10-10T18:00:00.000Z');
    await venta(2, '2026-10-10T18:00:00.000Z');
    expect(filas('SELECT socio_id, pct FROM socios_comisiones ORDER BY id').map(x => `${x.socio_id}:${x.pct}`)).toEqual(['1:10', '1:10', '1:20', '2:30']);
  });

  it('retención: pendiente hasta 7 días después del pago; luego disponible', async () => {
    await nuevoSocio();
    await venta(1, '2026-10-10T18:00:00.000Z');
    await liberarComisiones(env, new Date('2026-10-17T17:59:00.000Z'));
    expect(fila('SELECT estado FROM socios_comisiones').estado).toBe('pendiente');
    await liberarComisiones(env, new Date('2026-10-17T18:00:00.000Z'));
    expect(fila('SELECT estado FROM socios_comisiones').estado).toBe('disponible');
  });

  it('reembolso antes de pagar al socio: la comisión se cancela (y sale del pago por hacer); no cuenta para el nivel', async () => {
    await nuevoSocio();
    const o1 = await venta(1, '2026-10-01T18:00:00.000Z');
    await venta(1, '2026-10-01T18:00:00.000Z');
    await liberarComisiones(env, new Date('2026-10-20T00:00:00.000Z'));
    const pago = await crearPago(env, 1, { origen: 'semanal', semana: '2026-10-19' });
    expect(pago.monto_centavos).toBe(8370);
    await aplicarPago(env, o1.id, { resultado: 'reembolsado' });
    await comisionAlReembolsar(env, o1.id);
    expect(fila('SELECT estado, pago_id FROM socios_comisiones WHERE order_id = ?', o1.id)).toEqual({ estado: 'cancelada', pago_id: null });
    expect(fila('SELECT monto_centavos, estado FROM socios_pagos').monto_centavos).toBe(4185);
    // La siguiente venta del mes es la 2 (la cancelada no cuenta)
    await venta(1, '2026-10-21T18:00:00.000Z');
    expect(fila('SELECT venta_n FROM socios_comisiones ORDER BY id DESC').venta_n).toBe(2);
  });

  it('reembolso después de pagarle: ajuste negativo que se descuenta del siguiente pago', async () => {
    await nuevoSocio();
    const o1 = await venta(1, '2026-10-01T18:00:00.000Z');
    await liberarComisiones(env, new Date('2026-10-20T00:00:00.000Z'));
    const p1 = await crearPago(env, 1, { origen: 'semanal', semana: '2026-10-19' });
    await A().marcarPagoSocio(p1.id, { clave_rastreo: 'MBAN01002610190001', fecha: '2026-10-19' });
    expect(fila('SELECT estado FROM socios_comisiones').estado).toBe('pagada');
    await aplicarPago(env, o1.id, { resultado: 'reembolsado' });
    await comisionAlReembolsar(env, o1.id);
    await comisionAlReembolsar(env, o1.id);   // idempotente
    const aj = filas("SELECT * FROM socios_comisiones WHERE tipo = 'ajuste'");
    expect(aj).toHaveLength(1);
    expect(aj[0]).toMatchObject({ monto_centavos: -4185, estado: 'disponible' });
    // Mientras el saldo sea negativo no hay pago; con una venta nueva (25% no: es la venta 2 de octubre → 15%) se compensa
    expect(await crearPago(env, 1, { origen: 'semanal', semana: '2026-10-26' })).toBeNull();
    await venta(1, '2026-10-02T18:00:00.000Z');
    await venta(1, '2026-10-02T18:00:00.000Z');
    await liberarComisiones(env, new Date('2026-10-26T00:00:00.000Z'));
    const p2 = await crearPago(env, 1, { origen: 'semanal', semana: '2026-10-26' });
    expect(p2.monto_centavos).toBe(4185 * 2 - 4185);
  });

  it('suscripciones: comisión en la compra y en las renovaciones hasta la factura 12 (configurable)', async () => {
    await nuevoSocio();
    const o = await venta(1, '2026-10-01T18:00:00.000Z', { slug: 'vuelve-mensual' });
    const sub = { id: 'sub_1', metadata: { order_id: o.id } };
    // La primera factura es la compra (ya tiene su comisión)
    expect(await comisionFactura(env, { id: 'in_0', status: 'paid', amount_paid: 39900, billing_reason: 'subscription_create' }, sub)).toBeNull();
    for (let i = 2; i <= 14; i++)
      await comisionFactura(env, { id: `in_${i}`, status: 'paid', amount_paid: 39900, billing_reason: 'subscription_cycle', status_transitions: { paid_at: Date.parse(`2027-${String(i - 1).padStart(2, '0')}-02T18:00:00Z`) / 1000 } }, sub);
    await comisionFactura(env, { id: 'in_2', status: 'paid', amount_paid: 39900, billing_reason: 'subscription_cycle' }, sub);   // repetida
    const c = filas('SELECT numero_factura, factura_id, cuenta_nivel, pct, monto_centavos FROM socios_comisiones ORDER BY id');
    expect(c).toHaveLength(12);   // compra + 11 renovaciones
    expect(c.at(-1)).toMatchObject({ numero_factura: 12, factura_id: 'in_12', cuenta_nivel: 0, pct: 15, monto_centavos: 5985 });
    // Una renovación reembolsada en Stripe se anula a mano desde el panel
    const ren = fila("SELECT id FROM socios_comisiones WHERE factura_id = 'in_5'");
    await A().anularComisionSocio(ren.id);
    expect(fila('SELECT estado FROM socios_comisiones WHERE id = ?', ren.id).estado).toBe('cancelada');
    await expect(A().anularComisionSocio(ren.id)).rejects.toThrow(/ya estaba cancelada/);
  });

  it('el webhook crea la comisión al pagarse, cancela en reembolso y paga renovaciones con invoice.paid', async () => {
    await nuevoSocio();
    const o = await crearOrden(env, { items: [{ slug: 'vuelve-mensual' }], email: 'cafe@mail.com', nombre: 'Café', socio: 1, suscripcion: true });
    stripe.sesion = { id: 'cs_1', metadata: { order_id: o.id }, client_reference_id: o.id, amount_total: 39900, currency: 'mxn', status: 'complete', payment_status: 'paid', payment_intent: null, subscription: 'sub_1' };
    stripe.sub = { id: 'sub_1', status: 'active', customer: 'cus_1', metadata: { order_id: o.id, app: 'vuelve', email: 'cafe@mail.com', product_id: 'prod_vuelve_mensual' },
      items: { data: [{ quantity: 1, current_period_end: 1893456000, price: { unit_amount: 39900, recurring: { interval: 'month' }, product: { metadata: { product_id: 'prod_vuelve_mensual' } } } }] } };
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(fila('SELECT clave, estado, monto_centavos FROM socios_comisiones')).toEqual({ clave: `orden:${o.id}`, estado: 'pendiente', monto_centavos: 5985 });
    stripe.factura = { id: 'in_2', status: 'paid', amount_paid: 39900, billing_reason: 'subscription_cycle', parent: { subscription_details: { subscription: 'sub_1' } } };
    expect((await evento('invoice.paid', 'in_2')).status).toBe(200);
    expect(fila("SELECT numero_factura FROM socios_comisiones WHERE factura_id = 'in_2'").numero_factura).toBe(2);
    stripe.pi = { id: 'pi_1', metadata: { order_id: o.id }, latest_charge: { refunded: true } };
    expect((await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' })).status).toBe(200);
    expect(fila('SELECT estado FROM socios_comisiones WHERE clave = ?', `orden:${o.id}`).estado).toBe('cancelada');
  });
});

describe('pagos', () => {
  it('lote semanal: solo los lunes (CDMX), uno por socio y semana; marcar pagado guarda el SPEI y avisa al socio', async () => {
    await nuevoSocio();
    await venta(1, '2026-10-01T18:00:00.000Z');
    expect(await loteSemanal(env, new Date('2026-10-20T18:00:00.000Z'))).toEqual({ pagos: 0 });   // martes
    // Lunes 19 de octubre a las 00:30 en CDMX (06:30 UTC)
    expect((await loteSemanal(env, new Date('2026-10-19T06:30:00.000Z'))).pagos).toBe(1);
    expect((await loteSemanal(env, new Date('2026-10-19T07:30:00.000Z'))).pagos).toBe(0);   // la siguiente hora no duplica
    const [p] = await A().pagosSocios();
    expect(p).toMatchObject({ estado: 'por_pagar', origen: 'semanal', semana: '2026-10-19', monto_centavos: 4185, clabe: CLABE, comisiones: 1 });
    await expect(A().marcarPagoSocio(p.id, { clave_rastreo: 'x', fecha: '2026-10-19' })).rejects.toThrow(/clave de rastreo/);
    await A().marcarPagoSocio(p.id, { clave_rastreo: 'mban01002610190001', fecha: '2026-10-19' });
    expect(fila('SELECT estado, clave_rastreo, pagado_el FROM socios_pagos')).toEqual({ estado: 'pagado', clave_rastreo: 'MBAN01002610190001', pagado_el: '2026-10-19' });
    expect(correos.at(-1)).toMatchObject({ para: 'ana@socia.mx' });
    expect(correos.at(-1).texto).toContain('MBAN01002610190001');
    await expect(A().marcarPagoSocio(p.id, { clave_rastreo: 'MBAN01002610190001', fecha: '2026-10-19' })).rejects.toThrow(/ya no estaba/);
    // CSV de comisiones
    const csv = await A().exportarSociosCSV({ desde: '2026-01-01', hasta: '2030-12-31' });
    expect(csv).toContain('ANA-CELAYA');
    expect(csv).toContain('MBAN01002610190001');
  });

  it('portal: entrar con enlace mágico, ver sus datos (sin datos de compradores) y pedir el pago inmediato', async () => {
    await nuevoSocio();
    await venta(1, new Date().toISOString(), { email: 'compradora.secreta@mail.com' });
    // Sin sesión: la entrada. El código no da acceso.
    expect(await (await pedir('/tienda/socios/')).text()).toContain('Mandarme el enlace');
    expect(await (await pedir('/api/socios/pago', { metodo: 'POST', cookie: 'vorka_socio=ANA-CELAYA' })).json()).toMatchObject({ error: expect.stringMatching(/sesión/) });
    // Un correo que no es de socio recibe la misma respuesta y ningún correo
    expect(await (await pedir('/api/socios/entrar', { metodo: 'POST', body: { email: 'nadie@mail.com' } })).json()).toEqual({ ok: true });
    expect(correos).toHaveLength(0);
    expect((await pedir('/api/socios/entrar', { metodo: 'POST', body: { email: 'ana@socia.mx' }, origin: 'https://malo.com' })).status).toBe(403);
    await pedir('/api/socios/entrar', { metodo: 'POST', body: { email: 'ANA@socia.mx' } });
    const enlace = correos[0].texto.match(/https:\/\/vorka\.mx(\/tienda\/socios\/acceso\/[a-f0-9]{64})/)[1];
    const a = await pedir(enlace);
    expect(a.status).toBe(303);
    const cookie = a.headers.get('set-cookie').split(';')[0];
    expect((await pedir(enlace)).status).toBe(410);   // un solo uso
    const html = await (await pedir('/tienda/socios/', { cookie })).text();
    expect(html).toContain('ANA-CELAYA');
    expect(html).toContain('vorka.mx/tienda/?socio=ANA-CELAYA');
    expect(html).toContain('<svg');                   // QR
    expect(html).toContain('De Idea a Proyecto');
    expect(html).not.toContain('compradora.secreta');
    expect(html).not.toContain(CLABE);                // solo la terminación
    // Aún en retención: no hay nada que cobrar
    let r = await pedir('/api/socios/pago', { metodo: 'POST', cookie });
    expect(r.status).toBe(409);
    env.DB.raw.exec("UPDATE socios_comisiones SET disponible_en = '2026-01-01T00:00:00.000Z'");
    r = await pedir('/api/socios/pago', { metodo: 'POST', cookie });
    expect(r.status).toBe(200);
    expect((await r.json()).monto_centavos).toBe(4185);
    expect(fila('SELECT origen, estado FROM socios_pagos')).toEqual({ origen: 'inmediato', estado: 'por_pagar' });
    // Aviso al equipo
    expect(correos.at(-1).para).toBe('hola@vorka.mx');
    expect(correos.at(-1).asunto).toMatch(/Pago inmediato pedido: Ana López/);
    expect((await (await pedir('/api/socios/pago', { metodo: 'POST', cookie })).json()).error).toMatch(/Ya pediste/);
    // El lote del lunes no lo vuelve a incluir
    expect((await loteSemanal(env, new Date(), { forzar: true })).pagos).toBe(0);
    // En el panel, el inmediato sale primero
    expect((await A().pagosSocios())[0].origen).toBe('inmediato');
    // QR descargable solo con sesión
    expect((await pedir('/tienda/socios/qr.svg')).status).toBe(401);
    expect((await pedir('/tienda/socios/qr.svg', { cookie })).headers.get('content-type')).toBe('image/svg+xml');
    // Suspendido: se cierran sus sesiones
    await A().estadoSocio(1, 'suspendido');
    expect(await (await pedir('/tienda/socios/', { cookie })).text()).toContain('Mandarme el enlace');
  });

  it('cada socio solo ve lo suyo', async () => {
    await nuevoSocio();
    await nuevoSocio({ code: 'LUIS', email: 'luis@socio.mx', nombre: 'Luis Pérez' });
    await venta(1, '2026-10-01T18:00:00.000Z', { slug: 'de-idea-a-proyecto' });
    await venta(2, '2026-10-01T18:00:00.000Z', { slug: 'cupo-pro' });
    await pedir('/api/socios/entrar', { metodo: 'POST', body: { email: 'luis@socio.mx' } });
    const enlace = correos.at(-1).texto.match(/https:\/\/vorka\.mx(\/tienda\/socios\/acceso\/[a-f0-9]{64})/)[1];
    const cookie = (await pedir(enlace)).headers.get('set-cookie').split(';')[0];
    const html = await (await pedir('/tienda/socios/', { cookie })).text();
    expect(html).toContain('LUIS');
    expect(html).not.toContain('ANA-CELAYA');
    expect(html).not.toContain('De Idea a Proyecto');
  });
});
