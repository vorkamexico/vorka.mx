// Evaluación de liderazgo Vorka en la tienda: ficha /tienda/evaluacion-liderazgo/ (contenido honesto, SEO, inactivo), compra de
// $149 con la liga personal que da Vorka OS (LIDERAZGO.darAcceso, simulado), regalo con crearRegalo, reembolso con revocar y
// falla de os por el mismo camino que Ruta de Impacto (ruta-entrega.js › APPS_OS), sin tocar el binding de Ruta.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { clavesRuta } from '../src/ruta-entrega.js';

const SECRETO = 'whsec_prueba';
let env, correos, rpc, rpcRuta, osCaido, stripe;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto, extra = {}) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, payment_status: 'paid', ...extra } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1' } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Rocío Martínez', email: 'Rocio@Mail.com', terminos: true, slug: 'evaluacion-liderazgo', ...extra } });
const orden = id => env.DB.raw.prepare('SELECT * FROM orders WHERE id = ?').get(id);
async function pagar(extra = {}) {
  const j = await (await comprar(extra)).json();
  stripe.orden = j.order; stripe.total = orden(j.order).monto_centavos;
  const r = await evento('checkout.session.completed', 'cs_1');
  return { id: j.order, r };
}
// Vorka OS simulado (clase Liderazgo de vorka-os/src/index.js): responde como src/liderazgo/index.js
function osFalso(lista, host) {
  const ligas = new Map();
  const f = nombre => async datos => {
    lista.push({ nombre, datos });
    if (osCaido) throw new Error('Network connection lost');
    if (nombre === 'darAcceso') return { ok: true, estado: 'activo', hasta: null, enlace: `https://${host}/e/${'b'.repeat(47)}${lista.length % 10}`, app: `https://${host}` };
    if (nombre === 'crearRegalo') { if (!ligas.has(datos.orden)) ligas.set(datos.orden, `https://${host}/e/${'c'.repeat(47)}${ligas.size}`); return { ok: true, estado: 'activo', abierto: false, liga: ligas.get(datos.orden) }; }
    if (nombre === 'revocar') return { ok: true, revocados: 1 };
    if (nombre === 'estado') return [{ curso: 'liderazgo', nombre_curso: 'Evaluación de liderazgo Vorka', tipo: 'compra', estado: 'activo', hechas: 0 }];
  };
  return { darAcceso: f('darAcceso'), crearRegalo: f('crearRegalo'), revocar: f('revocar'), estado: f('estado') };
}

beforeEach(() => {
  correos = []; rpc = []; rpcRuta = []; osCaido = false; stripe = { orden: null, total: 14900 };
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } }, RUTA: osFalso(rpcRuta, 'ruta.vorka.mx'), LIDERAZGO: osFalso(rpc, 'liderazgo.vorka.mx') };
  env.DB.raw.exec("UPDATE products SET activo = 1 WHERE slug = 'evaluacion-liderazgo'");
  vi.stubGlobal('fetch', vi.fn(async url => {
    const ok = b => new Response(JSON.stringify(b));
    if (url.endsWith('/customers')) return ok({ id: 'cus_1' });
    if (url.endsWith('/checkout/sessions')) return ok({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
    if (url.includes('/checkout/sessions/')) return ok({ id: 'cs_1', metadata: { order_id: stripe.orden }, client_reference_id: stripe.orden, amount_total: stripe.total, currency: 'mxn',
      status: 'complete', payment_status: 'paid', payment_intent: { id: 'pi_1', status: 'succeeded', payment_method: { type: 'card' } } });
    if (url.includes('/payment_intents/')) return ok({ id: 'pi_1', metadata: { order_id: stripe.orden }, latest_charge: { id: 'ch_1', refunded: true } });
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('producto', () => {
  it('la migración lo deja INACTIVO, a $149, regalable y con la app de os', () => {
    const fresco = d1().raw.prepare("SELECT * FROM products WHERE slug = 'evaluacion-liderazgo'").get();
    expect(fresco).toMatchObject({ activo: 0, precio_centavos: 14900, categoria: 'Educación' });
    const c = JSON.parse(fresco.contenido);
    expect(c).toMatchObject({ regalable: true, acceso: { app: 'liderazgo', ruta: '/tienda/evaluacion-liderazgo/' } });
  });
});

describe('ficha /tienda/evaluacion-liderazgo/', () => {
  it('dice lo que es y lo que NO es, las 12 dimensiones, el seguimiento, menores y compra', async () => {
    const r = await pedir('/tienda/evaluacion-liderazgo/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('¿Dónde estás hoy <em>como líder?</em>');
    for (const d of ['Liderazgo', 'Iniciativa', 'Servicio', 'Trabajo en equipo', 'Comunicación', 'Resiliencia', 'Claridad de propósito', 'Visión', 'Capacidad de ejecución', 'Medición de impacto', 'Autoconocimiento', 'Capacidad de movilización']) expect(h).toContain(`<li>${d}</li>`);
    expect(h).toContain('No es una prueba psicométrica');
    expect(h).toContain('no es una probabilidad de admisión');
    expect(h).toContain('Ejemplo ilustrativo');
    expect(h).toContain('2 aplicaciones');
    expect(h).toContain('Desde 15 años, con permiso.');
    expect(h).toContain('id="form-compra"'); expect(h).toContain('value="evaluacion-liderazgo"'); expect(h).toContain('$149 MXN');
    expect(h).toContain('href="/privacidad/#evaluacion-liderazgo"');
    // nada de promesas que no se sostienen
    expect(h).not.toMatch(/validada científicamente|garantiza|psicométrica validada|inteligencia artificial|\bIA\b/i);
  });

  it('SEO y estados: sin barra redirige; inactivo sin compra y sin indexar; fuera del catálogo', async () => {
    expect((await pedir('/tienda/evaluacion-liderazgo?ref=X')).headers.get('location')).toBe('https://vorka.mx/tienda/evaluacion-liderazgo/?ref=X');
    let h = await (await pedir('/tienda/evaluacion-liderazgo/')).text();
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/tienda/evaluacion-liderazgo/">');
    const ld = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1])).flat();
    expect(ld.find(x => x['@type'] === 'Product').offers).toMatchObject({ price: '149.00', priceCurrency: 'MXN' });
    expect(await (await pedir('/tienda/')).text()).toContain('href="/tienda/evaluacion-liderazgo/"');
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug = 'evaluacion-liderazgo'");
    h = await (await pedir('/tienda/evaluacion-liderazgo/')).text();
    expect(h).toContain('noindex'); expect(h).not.toContain('id="form-compra"'); expect(h).toContain('La venta abre muy pronto');
    expect(await (await pedir('/tienda/')).text()).not.toContain('/tienda/evaluacion-liderazgo/"');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).not.toContain('evaluacion-liderazgo');
  });
});

describe('compra, regalo y reembolso', () => {
  it('al pagar, os (LIDERAZGO, no RUTA) da la liga y el correo lleva «Empezar mi evaluación»', async () => {
    const { id, r } = await pagar();
    expect(r.status).toBe(200);
    expect(orden(id)).toMatchObject({ monto_centavos: 14900, regalo: 0 });
    expect(rpc).toEqual([{ nombre: 'darAcceso', datos: { correo: 'rocio@mail.com', nombre: 'Rocío Martínez', orden: id, curso: 'jovenes', dias: 365 } }]);
    expect(rpcRuta).toHaveLength(0);
    expect(correos).toHaveLength(1);
    expect(correos[0].asunto).toBe('Tu acceso: Evaluación de liderazgo Vorka');
    expect(correos[0].html).toContain('Empezar mi evaluación');
    expect(correos[0].html).toMatch(/href="https:\/\/liderazgo\.vorka\.mx\/e\/b{47}\d"/);
    expect(correos[0].texto).toContain('2 aplicaciones');
    expect(correos[0].texto).not.toContain('IMPACTO (soyimpacto.org)');
    const g = await (await pedir(`/tienda/gracias?order=${id}`)).text();
    expect(g).toContain('¡Te damos la bienvenida a la Evaluación de liderazgo Vorka!');
  });

  it('regalo de 2: una liga de liderazgo.vorka.mx por unidad y el texto propio', async () => {
    const { id } = await pagar({ regalo: true, cantidad: 2, regalo_mensaje: '¡Para que veas todo lo que ya lograste!' });
    expect(rpc.map(x => [x.nombre, x.datos.orden])).toEqual([['crearRegalo', id], ['crearRegalo', `${id}:2`]]);
    const c = correos[0];
    expect(c.asunto).toBe('Tus 2 regalos: Evaluación de liderazgo Vorka');
    expect(c.texto.match(/https:\/\/liderazgo\.vorka\.mx\/e\/\S+/g)).toHaveLength(2);
    expect(c.html).toContain('¡Gracias por regalar la <b>Evaluación de liderazgo Vorka</b>!');
    expect(c.html).toContain('2 aplicaciones');
    expect(c.html).toContain(encodeURIComponent('Te regalé la Evaluación de liderazgo Vorka'));
    expect(c.html).not.toContain('soyimpacto.org');
  });

  it('reembolso: revoca en os cada liga de la orden', async () => {
    const { id } = await pagar({ regalo: true, cantidad: 3 });
    await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' });
    expect(rpc.filter(x => x.nombre === 'revocar').map(x => x.datos.orden)).toEqual(clavesRuta(id, 3));
  });

  it('si os falla, la orden no se pierde y la nota dice cuál app', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    osCaido = true;
    const { id, r } = await pagar();
    expect(r.status).toBe(500);
    expect(orden(id).revisar).toMatch(/^Evaluación de liderazgo: no se pudo dar el acceso en liderazgo\.vorka\.mx/);
    expect(err.mock.calls.some(c => String(c[0]).startsWith('ALERTA liderazgo'))).toBe(true);
    osCaido = false;
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(orden(id).revisar).toBeNull();
    err.mockRestore();
  });

  it('sin el service binding LIDERAZGO tampoco se pierde la orden', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete env.LIDERAZGO;
    const { id, r } = await pagar();
    expect(r.status).toBe(500);
    expect(orden(id).revisar).toMatch(/falta el service binding LIDERAZGO/);
    err.mockRestore();
  });

  it('el panel ve qué dio la orden en liderazgo.vorka.mx', async () => {
    const { id } = await pagar();
    const A = new Admin({}, env); A.env = env;
    expect((await A.orden(id)).ruta).toEqual([expect.objectContaining({ curso: 'liderazgo', estado: 'activo' })]);
  });
});
