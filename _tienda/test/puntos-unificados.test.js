// Puntos Vorka unificado (Socios Vorka integrado): % por nivel del semestre, puntos extra con tope, renovaciones,
// transferencia a cuenta privada (solo cuentas habilitadas), ligas anteriores de socio y código escrito en el checkout.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, puntosAlReembolsar, puntosFactura, saldoDe, datosApp, codigoDe } from '../src/puntos.js';
import { transferibleDe } from '../src/puntos-retiros.js';
import { semestreMx, pctPara, puntosDe, nivelDe, MINIMO_RETIRO } from '../src/puntos-reglas.js';

let env;
const SITIO = 'https://vorka.mx';
const CLABE = '002010077777777771';   // CLABE de ejemplo con dígito verificador correcto
beforeEach(() => {
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  vi.stubGlobal('fetch', vi.fn(async url => new Response(JSON.stringify({ id: 'x', url: 'https://checkout.stripe.com/x' }))));
});
afterEach(() => vi.unstubAllGlobals());

const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
async function entrar(email) {
  const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre: 'Ana', terminos: true } })).json();
  return (await pedir(r.enlace)).headers.get('set-cookie').split(';')[0];
}
async function compraPagada(email, ref, slug = 'cupo-pro-100') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Comprador', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  return o;
}
// Ventas previas vigentes (con su orden) en una fecha dada, para armar el nivel sin pasar por Stripe
function ventasPrevias(email, n, fecha) {
  for (let i = 0; i < n; i++)
    env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, order_id, created_at) VALUES (?, 'ganado', 1, ?, ?)").run(email, `previa-${fecha}-${i}`, fecha);
}
const movs = (email, tipo = 'ganado') => env.DB.raw.prepare('SELECT * FROM puntos_movimientos WHERE email = ? AND tipo = ? AND order_id NOT LIKE ? ORDER BY id').all(email, tipo, 'previa-%');
const A = () => new Admin({}, env);

describe('Reglas', () => {
  it('niveles del 10% al 30% por ventas previas, +10 de extra con tope de 40%, y semestres de ene–jun y jul–dic (CDMX)', () => {
    expect([0, 2, 3, 9, 10, 25, 50, 200].map(n => pctPara(n))).toEqual([10, 10, 15, 15, 20, 25, 30, 30]);
    expect([pctPara(0, true), pctPara(10, true), pctPara(50, true)]).toEqual([20, 30, 40]);
    expect(puntosDe(9900, 15)).toBe(15);          // 14.85 → 15
    expect(nivelDe(3).actual).toMatchObject({ id: 'bronce', pct: 15 });
    // 1 de julio a las 05:59 UTC todavía es 30 de junio en el centro de México
    expect(semestreMx('2026-07-01T05:59:00Z')).toMatchObject({ id: '2026-1', inicio: '2026-01-01', fin: '2026-06-30' });
    expect(semestreMx('2026-07-01T06:00:00Z')).toMatchObject({ id: '2026-2', desde: '2026-07-01T06:00:00.000Z', hasta: '2027-01-01T06:00:00.000Z' });
  });
});

describe('Puntos por % del nivel del semestre', () => {
  it('cuenta solo ventas vigentes de este semestre; las del semestre pasado y las reembolsadas no suben de nivel', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    const sem = semestreMx(), pasado = new Date(new Date(sem.desde).getTime() - 864e5).toISOString();
    ventasPrevias('ana@mail.com', 60, pasado);          // Diamante el semestre pasado: ya no cuenta
    ventasPrevias('ana@mail.com', 2, new Date().toISOString());
    await compraPagada('b@mail.com', code, 'cupo-pro');  // 3a venta del semestre: aún Inicial → 10% de $149 = 15
    await compraPagada('c@mail.com', code, 'cupo-pro');  // ya son 3 previas → Bronce 15% = 22
    expect(movs('ana@mail.com').map(m => [m.puntos, m.pct, m.semestre])).toEqual([[15, 10, sem.id], [22, 15, sem.id]]);
    // Una reembolsada deja de contar para el nivel
    const r = movs('ana@mail.com')[1];
    await aplicarPago(env, r.order_id, { resultado: 'reembolsado' });
    await puntosAlReembolsar(env, r.order_id);
    const d = await datosApp(env, 'ana@mail.com');
    expect(d).toMatchObject({ ventas_semestre: 3, pct: 15 });
    expect(d.nivel.actual.id).toBe('bronce');
  });

  it('solo productos de Vorka dan puntos (los de creadores no); comprarse a uno mismo no cuenta', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    await compraPagada('ana@mail.com', code);
    expect(movs('ana@mail.com')).toEqual([]);
    env.DB.raw.exec("UPDATE products SET creador_id = NULL");
    await compraPagada('b@mail.com', code);
    expect(movs('ana@mail.com').map(m => m.base_centavos)).toEqual([9900]);
  });

  it('tope de 40% en Diamante con puntos extra', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    ventasPrevias('ana@mail.com', 50, new Date().toISOString());
    const hoy = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
    await A().guardarPromo({ slug: 'cupo-pro', inicia: hoy, termina: hoy });
    await compraPagada('b@mail.com', code, 'cupo-pro');
    expect(movs('ana@mail.com')[0]).toMatchObject({ pct: 40, puntos: 60, multiplicador: 2 });   // 40% de $149
  });

  it('renovaciones de suscripción dan puntos con el % del nivel, hasta la factura 12, sin subir de nivel y sin duplicar', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    const o = await compraPagada('negocio@mail.com', code);
    const sub = { id: 'sub_1', metadata: { order_id: o.id } };
    const f = n => ({ id: `in_${n}`, status: 'paid', amount_paid: 29900, billing_reason: n === 1 ? 'subscription_create' : 'subscription_cycle', status_transitions: { paid_at: Math.floor(Date.now() / 1000) } });
    expect(await puntosFactura(env, f(1), sub)).toBeNull();          // la factura 1 ya dio puntos con la orden
    for (let n = 2; n <= 14; n++) await puntosFactura(env, f(n), sub);
    await puntosFactura(env, f(2), sub);                               // reintento del webhook
    const ren = env.DB.raw.prepare("SELECT * FROM puntos_movimientos WHERE suscripcion_id = 'sub_1' ORDER BY id").all();
    expect(ren.length).toBe(11);                                       // pagos 2 a 12
    expect(ren[0]).toMatchObject({ puntos: 30, pct: 10, clave: 'factura:in_2', order_id: null });
    expect(ren.at(-1).nota).toContain('pago 12 de 12');
    expect((await datosApp(env, 'ana@mail.com')).ventas_semestre).toBe(1);   // las renovaciones no suben de nivel
  });
});

describe('Transferencia a cuenta (privada)', () => {
  it('no existe para cuentas sin habilitar: ni en la app ni en la API; la página pública no la menciona', async () => {
    const cookie = await entrar('ana@mail.com');
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos) VALUES ('ana@mail.com', 'ajuste', 900)");
    expect((await pedir('/api/puntos/retiro', { method: 'POST', cookie, body: { puntos: 500, clabe: CLABE, titular: 'Ana López' } })).status).toBe(404);
    const app = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(app).not.toMatch(/Transferir a mi cuenta|CLABE/);
    for (const ruta of ['/tienda/puntos/', '/tienda/', '/legal/terminos/'])
      expect((await (await pedir(ruta)).text())).not.toMatch(/transferir (tus|sus) puntos|cambiar(se)? por dinero|comisiones en dinero/i);
  });

  it('habilitada: mínimo 500, retiene 7 días los puntos de ventas recientes, es atómica y se puede pagar o cancelar', async () => {
    const cookie = await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    await A().habilitarRetiro('ana@mail.com', { puede_retirar: true, notas: 'Gente de confianza' });
    expect((await A().cuentasPuntos()).find(c => c.email === 'ana@mail.com')).toMatchObject({ puede_retirar: true, pct: 10, nivel: 'Inicial' });
    // 600 de hace 10 días (transferibles) + 15 de una venta de hoy (retenidos 7 días)
    env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, created_at) VALUES ('ana@mail.com', 'bono', 600, ?)").run(new Date(Date.now() - 10 * 864e5).toISOString());
    await compraPagada('b@mail.com', code, 'cupo-pro');
    expect(await transferibleDe(env, 'ana@mail.com')).toMatchObject({ disponibles: 615, retenidos: 15, transferibles: 600 });

    const app = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(app).toContain('Transferir a mi cuenta');
    const retiro = body => pedir('/api/puntos/retiro', { method: 'POST', cookie, body });
    expect((await (await retiro({ puntos: 400, clabe: CLABE, titular: 'Ana López' })).json()).error).toMatch(/mínimo/);
    expect((await (await retiro({ puntos: 500, clabe: '123', titular: 'Ana López' })).json()).error).toMatch(/CLABE/);
    expect((await (await retiro({ puntos: 610, clabe: CLABE, titular: 'Ana López' })).json()).error).toMatch(/hasta 600/);
    const ok = await retiro({ puntos: 550, clabe: CLABE, titular: 'Ana López', banco: 'BBVA' });
    expect(ok.status).toBe(200);
    expect((await (await retiro({ puntos: 500, clabe: CLABE, titular: 'Ana López' })).json()).error).toMatch(/en proceso/);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(65);
    expect(env.DB.raw.prepare("SELECT clabe, titular FROM puntos_cuentas WHERE email = 'ana@mail.com'").get()).toMatchObject({ clabe: CLABE, titular: 'Ana López' });

    // Panel: cola, pagar con clave de rastreo y CSV
    const [r] = await A().retirosPuntos();
    expect(r).toMatchObject({ email: 'ana@mail.com', puntos: 550, estado: 'por_pagar' });
    expect(await A().resumenRetiros()).toMatchObject({ pendientes: 1, por_pagar: 550, habilitadas: 1 });
    await expect(A().marcarRetiro(r.id, { clave_rastreo: 'x', fecha: '2026-01-01' })).rejects.toThrow(/rastreo/);
    const hoy = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
    await A().marcarRetiro(r.id, { clave_rastreo: 'MBAN01002610230001', fecha: hoy });
    await expect(A().cancelarRetiro(r.id)).rejects.toThrow(/ya no estaba/);
    const csv = await A().exportarRetirosCSV({ desde: hoy, hasta: hoy });
    expect(csv).toContain('MBAN01002610230001');

    // Otra solicitud y cancelación: los puntos regresan una sola vez
    env.DB.raw.prepare("INSERT INTO puntos_movimientos (email, tipo, puntos, created_at) VALUES ('ana@mail.com', 'bono', 500, ?)").run(new Date(Date.now() - 10 * 864e5).toISOString());
    expect((await retiro({ puntos: 500, clabe: CLABE, titular: 'Ana López' })).status).toBe(200);
    const [r2] = (await A().retirosPuntos()).filter(x => x.estado === 'por_pagar');
    await A().cancelarRetiro(r2.id, 'Datos incorrectos');
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(565);
    // Deshabilitar la cuenta quita la opción
    await A().habilitarRetiro('ana@mail.com', { puede_retirar: false });
    expect((await retiro({ puntos: 500, clabe: CLABE, titular: 'Ana López' })).status).toBe(404);
  });
});

describe('Socios Vorka integrado a Puntos Vorka', () => {
  it('las ligas ?socio= y ?codigo= dejan la cookie de la liga; el portal y sus condiciones ya no existen', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    const r = await pedir(`/tienda/?socio=${code.toLowerCase()}`);
    expect(r.headers.get('set-cookie')).toContain(`vorka_ref=${code}`);
    expect((await pedir('/tienda/?codigo=NOEXISTE')).headers.get('set-cookie') || '').not.toContain('vorka_ref');
    expect((await pedir('/tienda/socios/')).headers.get('location')).toBe('/tienda/puntos/');
    // Dice qué descuento se aplica y por qué, sin datos de quien recomendó
    const liga = await (await pedir(`/api/puntos/liga?c=${code}`)).json();
    expect(liga).toMatchObject({ valido: true, codigo: code, tipo: 'referido', texto: '5 % de descuento por recomendación' });
    expect(liga).not.toHaveProperty('nombre');
    expect(await (await pedir('/api/puntos/liga?c=NOEXISTE')).json()).toEqual({ valido: false });
  });

  it('el código escrito en el checkout gana sobre la liga y da los puntos a esa cuenta', async () => {
    await entrar('ana@mail.com');
    const code = await codigoDe(env, 'ana@mail.com');
    env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('OTRA', 'Otra', 0);");
    const r = await worker.fetch(new Request(`${SITIO}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '2.2.2.2', cookie: 'vorka_ref=OTRA' },
      body: JSON.stringify({ nombre: 'Beto Pérez', email: 'beto@mail.com', terminos: true, slug: 'cupo-pro-100', codigo: code.toLowerCase() }) }), env);
    expect(r.status).toBe(200);
    // Y quien compra recibe el 5 % por recomendación
    const precio = env.DB.raw.prepare("SELECT precio_centavos FROM products WHERE slug = 'cupo-pro-100'").get().precio_centavos;
    expect(env.DB.raw.prepare('SELECT ref_code, descuento_centavos, descuento_codigo FROM orders').get())
      .toMatchObject({ ref_code: code, descuento_centavos: Math.round(precio * 0.05), descuento_codigo: 'REFERIDO' });
  });
});
