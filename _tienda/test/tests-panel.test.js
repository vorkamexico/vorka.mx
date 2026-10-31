// Vorka OS › Tienda › Tests (src/tests/panel.js, migración 0059): embudo por producto y rango (hoy, 7 y 30 días, día del
// centro de México), ventas de reportes, paquetes y licencias, licencias para grupo (liga del grupo, liga nueva del panel y
// reenviar su correo), y ARCO por correo con bitácora de quién lo hizo (que nunca guarda el dato borrado).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { panelTests, diaMx } from '../src/tests/panel.js';

const SECRETO = 'whsec_prueba';
let env, correos, stripe, A;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function webhookPagado() {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: 'checkout.session.completed', data: { object: { id: stripe.sesion, payment_status: 'paid' } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, form, ip = '1.1.1.1' } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, redirect: 'manual',
  headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}), ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
  body: body ? JSON.stringify(body) : form ? new URLSearchParams(form).toString() : undefined,
}), env);
const db = sql => env.DB.raw.prepare(sql);

function respuestasV() {
  const tipos = ['R', 'I', 'A', 'S', 'E', 'C'], r = {};
  for (let k = 0; k < 30; k++) { const t = tipos[k % 6]; r[`i${k}`] = t === 'S' || t === 'A' ? '2' : t === 'I' ? '1' : '0'; }
  for (let k = 0; k < 12; k++) { const t = tipos[k % 6]; r[`h${k}`] = t === 'S' ? '4' : t === 'A' ? '3' : '2'; }
  return { ...r, mate: 'aguanto', lugar: 'S', motivo: 'S', duracion: 'lic', nivel: 'prepa', examen: 'unam' };
}

beforeEach(() => {
  correos = []; stripe = { orden: null, total: 7900, sesion: 'cs_0', n: 0 };
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  A = new Admin({}, env);
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const ok = b => new Response(JSON.stringify(b));
    if (String(url).endsWith('/customers')) return ok({ id: 'cus_1' });
    if (String(url).endsWith('/coupons')) return ok({ id: 'co_1' });
    // una sesión de Stripe distinta por compra (la tienda no acepta dos órdenes con la misma)
    if (String(url).endsWith('/checkout/sessions')) { stripe.sesion = `cs_${++stripe.n}`; return ok({ id: stripe.sesion, url: `https://checkout.stripe.com/c/pay/${stripe.sesion}` }); }
    if (String(url).includes('/checkout/sessions/')) return ok({ id: stripe.sesion, metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden, amount_total: stripe.total, currency: 'mxn',
      status: 'complete', payment_status: 'paid', payment_intent: { id: 'pi_1', status: 'succeeded', payment_method: { type: 'card' } } });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function contestar({ email = 'Sofia@Mail.com' } = {}) {
  const res = await pedir('/test-vocacional/', { metodo: 'POST', form: respuestasV() });
  const id = res.headers.get('location').match(/resultado\/([a-f0-9]{32})/)[1];
  if (email) await pedir(`/test-vocacional/resultado/${id}/correo`, { metodo: 'POST', form: { nombre: 'Sofía Ramírez', email, consentimiento: 'on', novedades: 'on' } });
  await pedir(`/test-vocacional/resultado/${id}`);   // ve el candado
  return id;
}
async function pagar(body, email = 'sofia@mail.com') {
  const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Sofía Ramírez', email, terminos: true, ...body } });
  const j = await r.json();
  expect(r.status, j.error).toBe(200);
  stripe.orden = j.order; stripe.total = db('SELECT monto_centavos m FROM orders WHERE id = ?').get(j.order).m;
  await webhookPagado();
  return j.order;
}
const paso = (p, clave) => p.embudo.find(x => x.clave === clave);

describe('embudo y ventas por rango', () => {
  it('cuenta cada paso con su % y separa reportes, paquetes y licencias; los canjes de $0 no son ventas', async () => {
    await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'inicio' } });
    await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'inicio' } });
    await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'mitad' } });
    const id = await contestar();
    const cupon = db('SELECT cupon FROM tests_resultados WHERE id = ?').get(id).cupon;
    await pagar({ slug: 'test-vocacional', resultado: id, codigo: cupon });                       // reporte con cupón: $59
    db("UPDATE products SET activo = 1 WHERE slug = 'simulador-unam-practica'").run();
    const id2 = await contestar({ email: 'beto@mail.com' });
    await pagar({ slug: 'test-vocacional', resultado: id2, paquete: 'simulador-unam-practica' }, 'beto@mail.com');   // paquete: $187
    stripe.total = 49000;
    const lic = await pagar({ slug: 'test-vocacional-grupo-10' }, 'orienta@escuela.mx');           // licencia de 10: $490
    // un alumno se une: orden de $0 (regalo), no es venta
    const g = await A.ligaPanelTests({ order_id: lic, por: 'ana@vorka.mx' });
    await pedir(new URL(g.liga_grupo).pathname, { metodo: 'POST', form: { nombre: 'Luis', email: 'luis@mail.com', terminos: 'on' } });

    const d = await A.panelTests({ rango: 'hoy' });
    expect(d.rango).toBe('hoy'); expect(d.desde).toBe(diaMx()); expect(d.hasta).toBe(diaMx());
    const v = d.productos.vocacional;
    expect(paso(v, 'inicio')).toMatchObject({ n: 2, pct: null });
    expect(paso(v, 'mitad')).toMatchObject({ n: 1, base: 'inicio', pct: 50 });
    expect(paso(v, 'termino')).toMatchObject({ n: 2, base: 'mitad', pct: 200 });
    expect(paso(v, 'correo')).toMatchObject({ n: 2, pct: 100 });
    expect(paso(v, 'candado')).toMatchObject({ n: 2, base: 'termino' });
    expect(paso(v, 'compras')).toMatchObject({ n: 2, base: 'candado', pct: 100 });
    expect(paso(v, 'compras_cupon')).toMatchObject({ n: 1, base: 'compras', pct: 50 });
    expect(paso(v, 'recuperadas').n).toBe(0);
    expect(v.ventas.reportes).toEqual({ n: 1, centavos: 5900 });
    expect(v.ventas.paquetes).toEqual({ n: 1, centavos: 7900 + 14900 - 4000 });
    expect(v.ventas.licencias).toEqual({ n: 1, centavos: 49000, lugares: 10 });
    expect(v.ventas.total).toEqual({ n: 3, centavos: 5900 + 18800 + 49000 });
    expect(v.conversion_pct).toBe(100);
    expect(d.productos.proyecto.ventas.total).toEqual({ n: 0, centavos: 0 });
    expect(JSON.stringify(d)).not.toMatch(/@/);   // sin correos en el embudo
  });

  it('hoy, 7 y 30 días con el día del centro de México; un rango inventado cae en 7 días', async () => {
    const ahora = Date.parse('2026-10-31T03:00:00.000Z');   // 30 de octubre, 21:00 en el centro de México
    const dia = n => diaMx(ahora - n * 864e5);
    expect(dia(0)).toBe('2026-10-30');
    const ins = env.DB.raw.prepare("INSERT INTO tests_metricas (dia, producto, evento, n) VALUES (?, 'proyecto', 'inicio', ?)");
    ins.run(dia(0), 1); ins.run(dia(6), 10); ins.run(dia(7), 100); ins.run(dia(29), 1000); ins.run(dia(30), 10000);
    const n = async rango => paso((await panelTests(env, { rango }, ahora)).productos.proyecto, 'inicio').n;
    expect(await n('hoy')).toBe(1);
    expect(await n('7d')).toBe(11);
    expect(await n('30d')).toBe(1111);
    expect((await panelTests(env, { rango: 'siempre' }, ahora)).rango).toBe('7d');
  });
});

describe('licencias para grupo', () => {
  it('lista con correo oculto y lugares usados; liga nueva del panel que sí abre; reenviar el correo; todo con quién lo hizo', async () => {
    stripe.total = 117000;
    const lic = await pagar({ slug: 'test-vocacional-grupo-30' }, 'orientadora@escuela.mx');
    let l = await A.gruposTests();
    expect(l.grupos).toHaveLength(1);
    expect(l.grupos[0]).toMatchObject({ order_id: lic, email: 'or***@escuela.mx', total: 30, usados: 0, liga_grupo: null, panel_abierto: false, estado: 'paid' });
    expect(JSON.stringify(l)).not.toContain('orientadora@');
    await expect(A.ligaPanelTests({ order_id: lic })).rejects.toThrow('Falta quién');
    const g = await A.ligaPanelTests({ order_id: lic, por: 'ana@vorka.mx' });
    expect(g.liga_panel).toMatch(/^https:\/\/vorka\.mx\/test-vocacional\/panel\/[a-f0-9]{64}$/);
    const panel = await pedir(new URL(g.liga_panel).pathname);
    expect(panel.status).toBe(200);
    expect(await panel.text()).toContain('0 de 30');
    await pedir(new URL(g.liga_grupo).pathname, { metodo: 'POST', form: { nombre: 'Luis', email: 'luis@mail.com', terminos: 'on', comparte: 'on' } });
    l = await A.gruposTests();
    expect(l.grupos[0]).toMatchObject({ usados: 1, liga_grupo: g.liga_grupo, panel_abierto: true });
    expect(l).toMatchObject({ lugares: 30, usados: 1 });
    correos = [];
    expect(await A.reenviarPanelTests({ order_id: lic, por: 'ana@vorka.mx' })).toEqual({ ok: true, email: 'or***@escuela.mx' });
    expect(correos).toHaveLength(1);
    expect(correos[0].para).toBe('orientadora@escuela.mx');
    expect(correos[0].html).toMatch(/\/test-vocacional\/entrar\/[a-f0-9]{64}/);
    const b = await A.bitacoraTests();
    expect(b.map(x => [x.accion, x.por])).toEqual([['reenvio_panel', 'ana@vorka.mx'], ['liga_panel', 'ana@vorka.mx']]);
    // un reporte suelto no es licencia; una licencia reembolsada no saca liga
    await expect(A.ligaPanelTests({ order_id: 'no-existe', por: 'ana@vorka.mx' })).rejects.toThrow('no existe');
    db("UPDATE orders SET estado = 'refunded' WHERE id = '" + lic + "'").run();
    await expect(A.reenviarPanelTests({ order_id: lic, por: 'ana@vorka.mx' })).rejects.toThrow('no está pagada');
    expect((await A.gruposTests()).grupos[0].estado).toBe('refunded');
  });
});

describe('datos personales', () => {
  it('ARCO: buscar no enseña respuestas; borrar pide quién, borra con la función de siempre y deja la bitácora sin el correo', async () => {
    const id = await contestar();
    await pagar({ slug: 'test-vocacional', resultado: id });
    await contestar({ email: 'otra@mail.com' });
    const b = await A.buscarDatosTestsCorreo('SOFIA@mail.com');
    expect(b.email).toBe('sofia@mail.com');
    expect(b.resultados).toHaveLength(1);
    expect(b.resultados[0]).toMatchObject({ producto: 'vocacional', pagado: true, grupo: false, contestado: true });
    expect(JSON.stringify(b)).not.toContain('respuestas');
    await expect(A.buscarDatosTestsCorreo('no es correo')).rejects.toThrow('Revisa el correo');
    await expect(A.borrarDatosTestsCorreo({ email: 'sofia@mail.com' })).rejects.toThrow('Falta quién');
    expect(await A.borrarDatosTestsCorreo({ email: 'sofia@mail.com', por: 'ana@vorka.mx' })).toEqual({ ok: true, borrados: 1 });
    expect(db("SELECT COUNT(*) n FROM tests_resultados WHERE lower(email) = 'sofia@mail.com'").get().n).toBe(0);
    expect(db("SELECT COUNT(*) n FROM tests_resultados WHERE email = 'otra@mail.com'").get().n).toBe(1);
    expect(db('SELECT COUNT(*) n FROM orders').get().n).toBe(1);   // la orden se queda (plazos fiscales)
    const bit = db('SELECT * FROM tests_bitacora').all();
    expect(bit).toHaveLength(1);
    expect(bit[0]).toMatchObject({ accion: 'arco', por: 'ana@vorka.mx', producto: 'vocacional', n: 1 });
    expect(JSON.stringify(bit)).not.toContain('sofia');
    // sin nada que borrar: no deja renglón
    expect(await A.borrarDatosTestsCorreo({ email: 'nadie@mail.com', por: 'ana@vorka.mx' })).toEqual({ ok: true, borrados: 0 });
    expect((await A.panelTests({ rango: 'hoy' })).borrados).toMatchObject({ arco: 1, arco_respuestas: 1 });
  });

  it('cuando la persona borra desde su resultado, la bitácora lo cuenta (sin datos) y el panel lo muestra', async () => {
    const id = await contestar();
    const r = await pedir(`/test-vocacional/resultado/${id}/borrar`, { metodo: 'POST' });
    expect(r.status).toBe(303);
    await pedir(`/test-vocacional/resultado/${id}/borrar`, { metodo: 'POST' });   // otra vez: ya no había nada
    expect(db('SELECT accion, por, producto, n, order_id FROM tests_bitacora').all()).toEqual([{ accion: 'borrado_persona', por: 'persona', producto: 'vocacional', n: 1, order_id: null }]);
    expect((await A.panelTests({ rango: '30d' })).borrados).toMatchObject({ persona: 1, arco: 0 });
  });
});
