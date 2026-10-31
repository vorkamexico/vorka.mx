// Test vocacional Vorka y ¿Qué proyecto social hago? (src/tests/): migración, reglas deterministas, flujo gratis (puerta
// de correo, perfil gratis, candado, cupón real de 24 h), pago que desbloquea el reporte (webhook simulado de Stripe),
// liga inválida, paquete con simulador, licencias para grupo, recordatorio único, «que lo pague mi papá», metadatos y sitemap.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { calcular as calcularV, leerRespuestas as leerV } from '../src/tests/vocacional.js';
import { calcular as calcularP, leerRespuestas as leerP } from '../src/tests/proyecto.js';
import { mandarRecordatorios } from '../src/tests/correos.js';
import { CARRERAS } from '../src/tests/vocacional-datos.js';
import { ODS, PROYECTOS } from '../src/tests/proyecto-datos.js';

const SECRETO = 'whsec_prueba';
let env, correos, stripe;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function webhookPagado() {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: 'checkout.session.completed', data: { object: { id: 'cs_1', payment_status: 'paid' } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, form, cookie, ip = '1.1.1.1', ua } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, redirect: 'manual',
  headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}), ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...(cookie ? { cookie } : {}), ...(ua ? { 'user-agent': ua } : {}) },
  body: body ? JSON.stringify(body) : form ? new URLSearchParams(form).toString() : undefined,
}), env);
const db = sql => env.DB.raw.prepare(sql);

// Respuestas de ejemplo: le gusta lo Social y lo Artístico, quiere la UNAM y va en prepa
function respuestasV({ examen = 'unam', nivel = 'prepa', mate = 'aguanto' } = {}) {
  const tipos = ['R', 'I', 'A', 'S', 'E', 'C'];
  const r = {};
  for (let k = 0; k < 30; k++) { const t = tipos[k % 6]; r[`i${k}`] = t === 'S' || t === 'A' ? '2' : t === 'I' ? '1' : '0'; }
  for (let k = 0; k < 12; k++) { const t = tipos[k % 6]; r[`h${k}`] = t === 'S' ? '4' : t === 'A' ? '3' : '2'; }
  return { ...r, mate, lugar: 'S', motivo: 'S', duracion: 'lic', nivel, examen };
}
const respuestasP = () => ({ tipo: 'negocio', giro: 'alimentos', tamano: 'micro', expertise: ['alimentos', 'logistica'], presupuesto: '1', tiempo: '1', causas: ['alimentacion', 'ambiente'], colaborar: ['osc'], estado: 'Guanajuato', municipio: 'Celaya' });
const formP = r => { const u = new URLSearchParams(); for (const [k, v] of Object.entries(r)) [].concat(v).forEach(x => u.append(k, x)); return u; };

beforeEach(() => {
  correos = []; stripe = { orden: null, total: 7900 };
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const ok = b => new Response(JSON.stringify(b));
    if (String(url).endsWith('/customers')) return ok({ id: 'cus_1' });
    if (String(url).endsWith('/coupons')) return ok({ id: 'co_1' });
    if (String(url).endsWith('/checkout/sessions')) return ok({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
    if (String(url).includes('/checkout/sessions/')) return ok({ id: 'cs_1', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden, amount_total: stripe.total, currency: 'mxn',
      status: 'complete', payment_status: 'paid', payment_intent: { id: 'pi_1', status: 'succeeded', payment_method: { type: 'card' } } });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

// Contesta el test gratis y deja el correo; devuelve el id del resultado y la cookie
async function contestar({ correo = true, novedades = true, r = respuestasV() } = {}) {
  const res = await pedir('/test-vocacional/', { metodo: 'POST', form: r });
  expect(res.status).toBe(303);
  const id = res.headers.get('location').match(/resultado\/([a-f0-9]{32})/)[1];
  const cookie = res.headers.get('set-cookie').split(';')[0];
  if (correo) {
    const c = await pedir(`/test-vocacional/resultado/${id}/correo`, { metodo: 'POST', form: { nombre: 'Sofía Ramírez', email: 'Sofia@Mail.com', consentimiento: 'on', ...(novedades ? { novedades: 'on' } : {}) } });
    expect(c.status).toBe(303);
  }
  return { id, cookie };
}
async function pagar(body) {
  const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Sofía Ramírez', email: 'sofia@mail.com', terminos: true, ...body } });
  const j = await r.json();
  expect(r.status, j.error).toBe(200);
  stripe.orden = j.order; stripe.total = db('SELECT monto_centavos m FROM orders WHERE id = ?').get(j.order).m;
  await webhookPagado();
  return j.order;
}
const ligaDe = (correo, base = 'test-vocacional') => correo.html.match(new RegExp(`https://vorka\\.mx/${base}/entrar/([a-f0-9]{64})`))?.[1];

describe('migración 0058', () => {
  it('da de alta los productos activos con su precio, acceso y licencias ocultas', () => {
    const fila = slug => db('SELECT * FROM products WHERE slug = ?').get(slug);
    expect(fila('test-vocacional')).toMatchObject({ activo: 1, precio_centavos: 7900, categoria: 'Educación' });
    expect(JSON.parse(fila('test-vocacional').contenido)).toMatchObject({ regalable: true, acceso: { app: 'test-vocacional', ruta: '/test-vocacional/' } });
    expect(fila('que-proyecto-social')).toMatchObject({ activo: 1, precio_centavos: 14900 });
    for (const [s, n, c] of [['test-vocacional-grupo-10', 10, 49000], ['test-vocacional-grupo-30', 30, 117000], ['test-vocacional-grupo-100', 100, 290000]]) {
      expect(fila(s)).toMatchObject({ activo: 1, precio_centavos: c });
      expect(JSON.parse(fila(s).contenido)).toMatchObject({ oculto: true, licencias: n, acceso: { tipo: 'grupo' } });
    }
    for (const t of ['tests_resultados', 'tests_grupos', 'tests_metricas']) expect(db(`SELECT name FROM sqlite_master WHERE name = '${t}'`).get()).toBeTruthy();
  });
});

describe('reglas (sin IA, deterministas)', () => {
  it('mismas respuestas → mismo código y mismas carreras, siempre', () => {
    const a = leerV(respuestasV()), b = leerV(respuestasV());
    expect(a.ok).toBe(true);
    const ra = calcularV(a.r), rb = calcularV(b.r);
    expect(ra.codigo).toBe('SAI');
    expect(ra.codigo).toBe(rb.codigo);
    expect(ra.carreras.slice(0, 20).map(c => c.n)).toEqual(rb.carreras.slice(0, 20).map(c => c.n));
    expect(ra.carreras.slice(0, 5).every(c => /[SA]/.test(c.c.slice(0, 2)))).toBe(true);
    expect(ra.examen.sim).toBe('unam');
  });
  it('el examen sale de lo que contestó: secundaria + UNAM → ECOEMS; privada → PAA; IPN sin simulador', () => {
    expect(calcularV(leerV(respuestasV({ nivel: 'secundaria' })).r).examen.sim).toBe('ecoems');
    expect(calcularV(leerV(respuestasV({ examen: 'privada' })).r).examen.sim).toBe('paa');
    expect(calcularV(leerV(respuestasV({ examen: 'ipn' })).r).examen.sim).toBe(null);
  });
  it('si faltan respuestas, no califica', () => {
    const r = respuestasV(); delete r.i3; delete r.examen;
    expect(leerV(r)).toEqual({ ok: false, faltan: ['i3', 'examen'] });
  });
  it('catálogo propio: 70+ carreras con código RIASEC válido y área UNAM 0-4', () => {
    expect(CARRERAS.length).toBeGreaterThanOrEqual(70);
    for (const c of CARRERAS) { expect(c.c).toMatch(/^[RIASEC]{3}$/); expect([0, 1, 2, 3, 4]).toContain(c.a); }
  });
  it('proyecto social: 3 ideas gratis, de 5 a 8 en el reporte, con ODS oficiales', () => {
    const v = leerP(respuestasP());
    expect(v.ok).toBe(true);
    const r = calcularP(v.r);
    expect(r.gratis).toHaveLength(3);
    expect(r.reporte.length).toBeGreaterThanOrEqual(5); expect(r.reporte.length).toBeLessThanOrEqual(8);
    expect(r.gratis[0].id).toBe('rescate');
    expect(calcularP(leerP(respuestasP()).r).reporte.map(x => x.id)).toEqual(r.reporte.map(x => x.id));
    expect(Object.keys(ODS)).toHaveLength(17);
    expect(ODS[2]).toBe('Hambre cero'); expect(ODS[17]).toBe('Alianzas para lograr los objetivos');
    for (const p of PROYECTOS) for (const n of p.ods) expect(ODS[n]).toBeTruthy();
  });
});

describe('páginas y metadatos', () => {
  it('el test gratis es indexable, dice el precio antes de empezar y trae JSON-LD', async () => {
    const r = await pedir('/test-vocacional/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('<title>Test vocacional gratis');
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/test-vocacional/">');
    expect(h).not.toContain('noindex');
    expect(h).toContain('Contestarlo es gratis · tu perfil básico es gratis · el reporte completo cuesta $79 MXN');
    expect(h).toContain('"@type":"Product"'); expect(h).toContain('"@type":"FAQPage"'); expect(h).toContain('"@type":"BreadcrumbList"');
    expect(h).toContain('no es una prueba psicométrica');
    expect(h).toContain('licencias'); expect(h).toContain('name="i29"');
    const p = await (await pedir('/que-proyecto-social/')).text();
    expect(p).toContain('<link rel="canonical" href="https://vorka.mx/que-proyecto-social/">');
    expect(p).toContain('el reporte completo cuesta $149 MXN');
  });
  it('/tienda/<slug>/ lleva a la página del test; el sitemap y el catálogo las incluyen', async () => {
    const r = await pedir('/tienda/test-vocacional/?ref=ANA');
    expect(r.status).toBe(301); expect(r.headers.get('location')).toBe('/test-vocacional/?ref=ANA');
    const s = await (await pedir('/tienda/sitemap.xml')).text();
    expect(s).toContain('<loc>https://vorka.mx/test-vocacional/</loc>');
    expect(s).toContain('<loc>https://vorka.mx/que-proyecto-social/</loc>');
    expect(s).not.toContain('grupo-10');
    const t = await (await pedir('/tienda/')).text();
    expect(t).toContain('href="/test-vocacional/"');
  });
});

describe('flujo gratis del test vocacional', () => {
  it('termina → «¡Tu perfil está listo!» → correo → perfil gratis + candado + cupón real de 24 h', async () => {
    const res = await pedir('/test-vocacional/', { metodo: 'POST', form: respuestasV() });
    expect(res.status).toBe(303);
    const id = res.headers.get('location').match(/resultado\/([a-f0-9]{32})/)[1];
    const puerta = await (await pedir(`/test-vocacional/resultado/${id}`)).text();
    expect(puerta).toContain('¡Tu perfil está listo!');
    expect(puerta).toContain('noindex');
    expect(puerta).toContain('Ver mi perfil sin dejar mi correo');
    // el cupón existe en el sistema de cupones, de 1 uso, solo para el reporte y vence en 24 h
    const f = db('SELECT * FROM tests_resultados WHERE id = ?').get(id);
    const c = db('SELECT * FROM cupones_regalo WHERE codigo = ?').get(f.cupon);
    expect(c).toMatchObject({ tipo: 'monto', monto_centavos: 2000, alcance: 'producto', product_id: 'prod_test_vocacional', max_usos: 1, lote: 'auto-test-vocacional' });
    const horas = (Date.parse(c.hasta) - Date.now()) / 3600e3;
    expect(horas).toBeGreaterThan(23.9); expect(horas).toBeLessThanOrEqual(24);
    // deja su correo (con permiso de recordatorio) y se le manda el resultado
    const g = await pedir(`/test-vocacional/resultado/${id}/correo`, { metodo: 'POST', form: { nombre: 'Sofía', email: 'sofia@mail.com', consentimiento: 'on', novedades: 'on' } });
    expect(g.headers.get('location')).toBe(`/test-vocacional/resultado/${id}?enviado=1`);
    expect(correos.at(-1).asunto).toBe('Tu código vocacional: SAI');
    expect(correos.at(-1).html).toContain(f.cupon);
    const h = await (await pedir(`/test-vocacional/resultado/${id}?enviado=1`)).text();
    expect(h).toContain('Tu código es <em>SAI</em>');
    expect(h).toContain('Tu carrera más afín');
    expect(h).toContain('Tus otras 19 carreras afines');
    expect(h).toContain('Tu plan de 30 días para decidir');
    expect(h).toContain(f.cupon); expect(h).toContain('$59 MXN');
    expect(h).toContain('Pedírselo por WhatsApp'); expect(h).toContain('Compara con tus amigos');
    expect(h).toContain('id="form-compra"');
    const m = await new Admin({}, env).metricasTests({ dias: 7 });
    expect(m.productos.vocacional).toMatchObject({ termino: 1, correo: 1, candado: 1 });
  });
  it('el aviso de inicio y mitad cuenta en el embudo; un evento inventado no', async () => {
    expect((await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'inicio' } })).status).toBe(200);
    expect((await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'mitad' } })).status).toBe(200);
    expect((await pedir('/api/tests/evento', { metodo: 'POST', body: { p: 'vocacional', e: 'compra' } })).status).toBe(400);
    const m = await new Admin({}, env).metricasTests({});
    expect(m.productos.vocacional).toMatchObject({ inicio: 1, mitad: 1 });
  });
  it('si faltan respuestas, vuelve al test con el error y lo contestado', async () => {
    const r = respuestasV(); delete r.h5;
    const res = await pedir('/test-vocacional/', { metodo: 'POST', form: r });
    expect(res.status).toBe(400);
    const h = await res.text();
    expect(h).toContain('Te falta 1 pregunta.');
    expect(h).toContain('name="i0" value="0" required checked');
  });
  it('borrar mis respuestas las quita de la base', async () => {
    const { id } = await contestar();
    const r = await pedir(`/test-vocacional/resultado/${id}/borrar`, { metodo: 'POST', form: {} });
    expect(r.headers.get('location')).toBe('/test-vocacional/?borrado=1');
    expect(db('SELECT COUNT(*) n FROM tests_resultados').get().n).toBe(0);
    expect((await pedir(`/test-vocacional/resultado/${id}`)).status).toBe(404);
  });
  it('«que lo pague mi papá»: liga con lo que incluye, el precio y la compra ligada al resultado', async () => {
    const { id } = await contestar();
    const h = await (await pedir(`/test-vocacional/pagar/${id}`)).text();
    expect(h).toContain('ya contestó');
    expect(h).toContain('$59 MXN');
    expect(h).toContain(`name="resultado" value="${id}"`);
  });
});

describe('pago → reporte', () => {
  it('con el cupón de 24 h: el webhook desbloquea el reporte y la liga del correo no vence', async () => {
    const { id, cookie } = await contestar();
    const cupon = db('SELECT cupon FROM tests_resultados WHERE id = ?').get(id).cupon;
    const orden = await pagar({ slug: 'test-vocacional', resultado: id, codigo: cupon });
    const o = db('SELECT * FROM orders WHERE id = ?').get(orden);
    expect(o).toMatchObject({ estado: 'paid', monto_centavos: 5900, descuento_codigo: cupon });
    expect(db('SELECT usos FROM cupones_regalo WHERE codigo = ?').get(cupon).usos).toBe(1);
    expect(db('SELECT order_id FROM tests_resultados WHERE id = ?').get(id).order_id).toBe(orden);
    const entrega = correos.find(c => c.asunto.startsWith('Tu acceso'));
    expect(entrega.texto).toContain('la liga no vence');
    const token = ligaDe(entrega);
    expect(token).toBeTruthy();
    const e = await pedir(`/test-vocacional/entrar/${token}`);
    expect(e.status).toBe(302); expect(e.headers.get('location')).toBe(`/test-vocacional/reporte/${token}`);
    const r = await pedir(`/test-vocacional/reporte/${token}`);
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('noindex');
    expect(h).toContain('2. Tus 20 carreras más afines');
    expect((h.match(/class="tv-af num"/g) || []).length).toBe(20);
    expect(h).toContain('Tu examen: UNAM');
    expect(h).toContain('/simulador-unam/');
    expect(h).toContain('/learn/unam/examen-unam-por-area/');
    expect(h).toContain('Tu plan de 30 días para decidir');
    expect(h).toContain('Imprimir o guardar en PDF');
    // a los 8 días la liga sigue abriendo el reporte (no vence como las descargas)
    db("UPDATE download_tokens SET expires_at = '2020-01-01T00:00:00.000Z'").run();
    expect((await pedir(`/test-vocacional/reporte/${token}`)).status).toBe(200);
    // la página de gracias abre el reporte en el navegador donde se contestó (cookie), y no en otro
    const g = await (await pedir(`/tienda/gracias?order=${orden}`)).text();
    expect(g).toContain(`/test-vocacional/ver/${orden}`);
    const v = await pedir(`/test-vocacional/ver/${orden}`, { cookie });
    expect(v.status).toBe(302); expect(v.headers.get('location')).toMatch(/^\/test-vocacional\/reporte\/[a-f0-9]{64}$/);
    expect((await pedir(`/test-vocacional/ver/${orden}`)).status).toBe(403);
    // el resultado ya no muestra el candado
    expect(await (await pedir(`/test-vocacional/resultado/${id}`)).text()).toContain('Ya tienes tu reporte completo');
    const m = await new Admin({}, env).metricasTests({});
    expect(m.productos.vocacional).toMatchObject({ checkout: 1, compras: 1, compras_cupon: 1, ingresos_centavos: 5900 });
  });
  it('liga inválida o inexistente: 404; reembolsada: 410', async () => {
    expect((await pedir('/test-vocacional/reporte/no-es-token')).status).toBe(404);
    expect((await pedir(`/test-vocacional/reporte/${'a'.repeat(64)}`)).status).toBe(404);
    expect((await pedir(`/que-proyecto-social/entrar/${'b'.repeat(64)}`)).status).toBe(404);
    const { id } = await contestar();
    await pagar({ slug: 'test-vocacional', resultado: id });
    const token = ligaDe(correos.find(c => c.asunto.startsWith('Tu acceso')));
    db("UPDATE orders SET estado = 'refunded'").run();
    expect((await pedir(`/test-vocacional/reporte/${token}`)).status).toBe(410);
  });
  it('comprado sin contestar (regalo o desde la ficha): el reporte pide el test y luego lo muestra', async () => {
    await pagar({ slug: 'test-vocacional' });
    const token = ligaDe(correos.find(c => c.asunto.startsWith('Tu acceso')));
    const a = await (await pedir(`/test-vocacional/reporte/${token}`)).text();
    expect(a).toContain('Contesta y <em>ve tu reporte</em>');
    const p = await pedir(`/test-vocacional/reporte/${token}`, { metodo: 'POST', form: respuestasV() });
    expect(p.status).toBe(303);
    expect(await (await pedir(`/test-vocacional/reporte/${token}`)).text()).toContain('Tus 20 carreras más afines');
  });
  it('paquete con el simulador del examen: los dos productos con $40 de descuento real', async () => {
    db("UPDATE products SET activo = 1 WHERE slug = 'simulador-unam-practica'").run();
    const { id } = await contestar();
    const h = await (await pedir(`/test-vocacional/resultado/${id}`)).text();
    expect(h).toContain('value="simulador-unam-practica"');
    expect(h).toContain('Ahorras $40 MXN');
    const orden = await pagar({ slug: 'test-vocacional', resultado: id, paquete: 'simulador-unam-practica' });
    const o = db('SELECT * FROM orders WHERE id = ?').get(orden);
    expect(o).toMatchObject({ estado: 'paid', descuento_codigo: 'PAQUETE-TEST', descuento_codigo_centavos: 4000, monto_centavos: 7900 + 14900 - 4000 });
    expect(db('SELECT COUNT(*) n FROM order_items WHERE order_id = ?').get(orden).n).toBe(2);
    const r = await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana', email: 'a@b.mx', terminos: true, slug: 'test-vocacional', paquete: 'simulador-paa-falso' } });
    expect(r.status).toBe(400);
  });
});

describe('licencias para grupo', () => {
  it('compra 10 → panel con liga → el alumno se une, contesta y comparte → el panel lo muestra; no pasa del cupo', async () => {
    stripe.total = 49000;
    await pagar({ slug: 'test-vocacional-grupo-10' });
    const token = ligaDe(correos.find(c => c.asunto.startsWith('Tu acceso')));
    expect((await pedir(`/test-vocacional/entrar/${token}`)).headers.get('location')).toBe(`/test-vocacional/panel/${token}`);
    const panel = await (await pedir(`/test-vocacional/panel/${token}`)).text();
    expect(panel).toContain('0 de 10');
    const codigo = panel.match(/\/test-vocacional\/grupo\/([a-f0-9]{24})/)[1];
    expect((await pedir(`/test-vocacional/grupo/${codigo}`)).status).toBe(200);
    const u = await pedir(`/test-vocacional/grupo/${codigo}`, { metodo: 'POST', form: { nombre: 'Luis Pérez', email: 'luis@mail.com', terminos: 'on', comparte: 'on' } });
    expect(u.status).toBe(303);
    const rep = u.headers.get('location');
    expect(await (await pedir(rep)).text()).toContain('Contesta y <em>ve tu reporte</em>');
    await pedir(rep, { metodo: 'POST', form: respuestasV() });
    const p2 = await (await pedir(`/test-vocacional/panel/${token}`)).text();
    expect(p2).toContain('1 de 10'); expect(p2).toContain('Luis Pérez'); expect(p2).toContain('SAI');
    // mismo correo: no gasta otro lugar
    await pedir(`/test-vocacional/grupo/${codigo}`, { metodo: 'POST', form: { nombre: 'Luis Pérez', email: 'luis@mail.com', terminos: 'on' } });
    db("UPDATE tests_grupos SET cupo = 1").run();
    const lleno = await pedir(`/test-vocacional/grupo/${codigo}`, { metodo: 'POST', form: { nombre: 'Otra', email: 'otra@mail.com', terminos: 'on' } });
    expect(await lleno.text()).toContain('ya no tiene lugares');
    expect(db('SELECT COUNT(*) n FROM orders WHERE regalo_de IS NOT NULL').get().n).toBe(1);
  });
});

describe('recordatorio único y datos personales', () => {
  it('UN correo al día siguiente si aceptó y no compró; nunca dos; baja con un clic', async () => {
    const { id } = await contestar({ novedades: true });
    const { id: sin } = await contestar({ novedades: false });
    correos = [];
    const manana = new Date(Date.now() + 22 * 3600e3);
    expect(await mandarRecordatorios(env, manana)).toEqual({ revisados: 1, enviados: 1 });
    expect(correos[0].asunto).toBe('Tu resultado vocacional te espera');
    expect(correos[0].html).toContain(`/test-vocacional/resultado/${id}/baja`);
    expect(correos[0].html).toContain('sigue vigente');
    expect(await mandarRecordatorios(env, new Date(Date.now() + 30 * 3600e3))).toEqual({ revisados: 0, enviados: 0 });
    expect(db('SELECT recordatorio_at FROM tests_resultados WHERE id = ?').get(sin).recordatorio_at).toBe(null);
    const b = await pedir(`/test-vocacional/resultado/${id}/baja`);
    expect(await b.text()).toContain('no te escribiremos más');
    expect(db('SELECT baja, novedades FROM tests_resultados WHERE id = ?').get(id)).toEqual({ baja: 1, novedades: 0 });
  });
  it('ARCO desde el panel borra las respuestas de un correo', async () => {
    await contestar();
    expect(await new Admin({}, env).borrarDatosTests('SOFIA@mail.com')).toEqual({ ok: true, borrados: 1 });
  });
});

describe('¿Qué proyecto social hago?', () => {
  it('gratis: 3 ideas en una línea + candado; pagado: 5 a 8 proyectos con ODS y Ruta de Impacto', async () => {
    const res = await worker.fetch(new Request('https://vorka.mx/que-proyecto-social/', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '2.2.2.2' }, body: formP(respuestasP()).toString() }), env);
    expect(res.status).toBe(303);
    const id = res.headers.get('location').match(/resultado\/([a-f0-9]{32})/)[1];
    expect(await (await pedir(`/que-proyecto-social/resultado/${id}`)).text()).toContain('¡Tus ideas están listas!');
    const h = await (await pedir(`/que-proyecto-social/resultado/${id}?saltar=1`)).text();
    expect(h).toContain('Rescate de alimentos');
    expect(h).toContain('Celaya, Guanajuato');
    expect(h).toContain('proyectos a detalle');
    expect(h).toContain('$109 MXN');   // $149 − cupón de $40 por terminar
    stripe.total = 14900;
    const orden = await pagar({ slug: 'que-proyecto-social', resultado: id });
    const token = ligaDe(correos.find(c => c.asunto.startsWith('Tu acceso')), 'que-proyecto-social');
    const r = await (await pedir(`/que-proyecto-social/reporte/${token}`)).text();
    expect(r).toContain('Rescate de alimentos');
    expect(r).toContain('<b>ODS 2</b> Hambre cero');
    expect(r).toContain('Cómo comunicarlo sin lavado de imagen');
    expect(r).toContain('soyimpacto.org');
    expect(r).toContain(`Orden ${orden}`);
    expect((r.match(/class="tv-idea"/g) || []).length).toBeGreaterThanOrEqual(5);
  });
});
