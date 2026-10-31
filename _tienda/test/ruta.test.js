// Ruta de Impacto en la tienda: ficha /tienda/ruta-de-impacto/ (contenido, SEO y JSON-LD), compra de pago único, entrega con
// el acceso que da Vorka OS (RUTA.darAcceso, simulado), regalo con crearRegalo, reembolso con revocar, falla de os (la orden
// no se pierde: se reintenta y queda marcada para revisar), catálogo, sitemap, gracias y panel.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { enc, hex } from '../src/util.js';
import { clavesRuta } from '../src/ruta-entrega.js';
import { reenviarEnlace } from '../src/entrega.js';

const SECRETO = 'whsec_prueba';
let env, correos, rpc, osCaido, stripe;

async function firmar(cuerpo, t = Math.floor(Date.now() / 1000)) {
  const llave = await crypto.subtle.importKey('raw', enc.encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC', llave, enc.encode(`${t}.${cuerpo}`)))}`;
}
async function evento(tipo, objeto, extra = {}) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: { id: objeto, payment_status: 'paid', ...extra } } });
  return worker.fetch(new Request('https://vorka.mx/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await firmar(cuerpo) }, body: cuerpo }), env);
}
const pedir = (ruta, { metodo = 'GET', body, ip = '1.1.1.1', headers = {} } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { 'cf-connecting-ip': ip, ...(body ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const comprar = (extra = {}) => pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Lupita Hernández', email: 'Lupita@Mail.com', terminos: true, slug: 'ruta-de-impacto', ...extra } });
const orden = id => env.DB.raw.prepare('SELECT * FROM orders WHERE id = ?').get(id);
// Compra pagada de punta a punta: checkout → Stripe (simulado) → webhook
async function pagar(extra = {}) {
  const j = await (await comprar(extra)).json();
  stripe.orden = j.order; stripe.total = orden(j.order).monto_centavos;
  const r = await evento('checkout.session.completed', 'cs_1');
  return { id: j.order, r };
}

// Vorka OS simulado (clase Ruta de src/index.js de vorka-os): guarda las llamadas y responde como src/ruta/tienda.js
function osFalso() {
  const accesos = new Map();
  const f = nombre => async datos => {
    rpc.push({ nombre, datos });
    if (osCaido) throw new Error('Network connection lost');
    if (nombre === 'darAcceso') return { ok: true, curso: datos.curso, estado: 'activo', hasta: '2027-10-26T18:00:00.000Z', enlace: `https://ruta.vorka.mx/entrar/${'a'.repeat(63)}${rpc.length % 10}`, app: 'https://ruta.vorka.mx' };
    if (nombre === 'crearRegalo') { if (!accesos.has(datos.orden)) accesos.set(datos.orden, `https://ruta.vorka.mx/regalo/${datos.orden.replace(/[^a-z0-9]/g, '').slice(0, 20)}x${accesos.size}`); return { ok: true, curso: datos.curso, estado: 'pendiente', abierto: false, liga: accesos.get(datos.orden) }; }
    if (nombre === 'revocar') return { ok: true, revocados: 1 };
    if (nombre === 'estado') return [{ curso: 'jovenes', nombre_curso: 'Ruta de Impacto', tipo: 'compra', estado: 'activo', orden: datos.orden }];
  };
  return { darAcceso: f('darAcceso'), crearRegalo: f('crearRegalo'), revocar: f('revocar'), estado: f('estado') };
}

beforeEach(() => {
  correos = []; rpc = []; osCaido = false; stripe = { orden: null, total: 9900 };
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRETO, DOWNLOAD_TOKEN_SECRET: 'x'.repeat(64),
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } }, RUTA: osFalso() };
  env.DB.raw.exec('UPDATE products SET activo = 1');
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

describe('ficha /tienda/ruta-de-impacto/', () => {
  it('hero, cómo funciona, niveles, calle, calificación y Sparks, constancia, IMPACTO, para quién, regalar, preguntas y compra', async () => {
    const r = await pedir('/tienda/ruta-de-impacto/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('Tu proyecto social, <em>de la idea a la comunidad.</em>');
    for (const t of ['Lecciones de 3 a 5 minutos', 'Racha, XP e insignias', 'Un tutor con pistas', 'Al primer error te da una pista, no la respuesta']) expect(h).toContain(t);
    for (const n of ['El problema', 'Escuchar a la comunidad', 'La solución', 'Medir', 'Recursos y aliados', 'El piloto', 'Proyecto final']) expect(h).toContain(n);
    expect(h).toContain('5 o más entrevistas'); expect(h).toContain('Un piloto con 10 o más personas'); expect(h).toContain('3 o más fotos');
    expect(h).toContain('Sobre 100. Y muy difícil.'); expect(h).toMatch(/Exámenes de los 6 niveles<small>[^<]*<\/small><\/th><td>36/);
    expect(h).toContain('Revista Sparks'); expect(h).toContain('revisión de Vorka'); expect(h).toContain('permiso de tu mamá, papá o tutor');
    expect(h).toContain('Constancia para todos los que terminan');
    expect(h).toContain('Lo recibido va para IMPACTO.'); expect(h).toContain('href="https://soyimpacto.org/"');
    expect(h).toContain('De 15 a 29 años'); expect(h).toContain('Regálaselo a un joven');
    // compra de pago único y regalable, con el formulario de siempre
    expect(h).toContain('id="form-compra"'); expect(h).toContain('value="ruta-de-impacto"'); expect(h).toContain('Para regalar'); expect(h).toContain('$99 MXN');
    expect(h).toContain('Pago único · acceso inmediato por un año');
    // capturas reales optimizadas
    for (const img of ['mapa', 'tutor', 'proyecto', 'entrevistas', 'piloto', 'calificacion']) expect(h).toContain(`/assets/tienda/ruta/${img}.webp`);
    // sin IA y sin cifras inventadas de IMPACTO
    expect(h).not.toMatch(/inteligencia artificial|\bIA\b/i);
    expect(h).not.toContain('121 municipios');
    expect(h).toContain('aria-current="page">Proyectos · Ruta de Impacto</a>');
  });

  it('SEO: título, descripción, canónica, OG, Course y FAQPage', async () => {
    const h = await (await pedir('/tienda/ruta-de-impacto/')).text();
    expect(h).toMatch(/<title>Ruta de Impacto: curso para hacer tu proyecto social \| Jóvenes de 15 a 29 años<\/title>/);
    expect(h).toMatch(/<meta name="description" content="Curso para jóvenes de 15 a 29 años[^"]+Lo recibido va para IMPACTO\.">/);
    expect(h).toContain('<link rel="canonical" href="https://vorka.mx/tienda/ruta-de-impacto/">');
    expect(h).toContain('<meta property="og:image" content="https://vorka.mx/assets/tienda/v3/ruta-de-impacto-og.jpg">');
    expect(h).not.toContain('noindex');
    const ld = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1])).flat();
    const curso = ld.find(x => x['@type'] === 'Course');
    expect(curso).toMatchObject({ name: 'Ruta de Impacto', inLanguage: 'es-MX', provider: { name: 'Vorka México' }, audience: { suggestedMinAge: 15, suggestedMaxAge: 29 },
      offers: { price: '99.00', priceCurrency: 'MXN', category: 'Paid' }, hasCourseInstance: { courseMode: 'online' } });
    const faq = ld.find(x => x['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBeGreaterThan(10);
    expect(faq.mainEntity.map(q => q.name)).toContain('¿Qué pasa si saco 95 o más?');
    expect(JSON.stringify(faq)).not.toMatch(/<a /);
  });

  it('sin la barra final redirige; inactivo se ve sin compra y sin indexar', async () => {
    expect((await pedir('/tienda/ruta-de-impacto?ref=X')).headers.get('location')).toBe('https://vorka.mx/tienda/ruta-de-impacto/?ref=X');
    env.DB.raw.exec("UPDATE products SET activo = 0 WHERE slug = 'ruta-de-impacto'");
    const h = await (await pedir('/tienda/ruta-de-impacto/')).text();
    expect(h).toContain('noindex'); expect(h).not.toContain('id="form-compra"'); expect(h).toContain('La venta abre muy pronto');
    // y no sale en el catálogo ni en el sitemap
    expect(await (await pedir('/tienda/')).text()).not.toContain('/tienda/ruta-de-impacto/"');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).not.toContain('ruta-de-impacto');
  });

  it('?regalo=1 deja elegido «Para regalar» con un mensaje de ejemplo propio', async () => {
    const h = await (await pedir('/tienda/ruta-de-impacto/?regalo=1')).text();
    expect(h).toMatch(/value="regalo" checked/);
    expect(h).toContain('placeholder="¡Tu proyecto puede cambiar tu colonia!"');
  });
});

describe('catálogo, sitemap y ligas', () => {
  it('sale en Educación con su portada, se puede regalar desde la tarjeta y va en el sitemap', async () => {
    const h = await (await pedir('/tienda/')).text();
    const grupo = h.match(/<section class="t-grupo" data-linea="examenes"[\s\S]*?<\/section>/)[0];
    expect(grupo).toContain('href="/tienda/ruta-de-impacto/"');
    expect(grupo).toContain('/assets/tienda/v3/ruta-de-impacto-portada.webp');
    expect(grupo).toContain('/tienda/ruta-de-impacto/?regalo=1#comprar');
    expect(grupo).toContain('Exámenes y proyectos');
    const sm = await (await pedir('/tienda/sitemap.xml')).text();
    expect(sm.match(/ruta-de-impacto/g)).toHaveLength(1);
    // el slug genérico de producto no abre otra ficha: es la misma página
    expect((await pedir('/tienda/ruta-de-impacto/')).status).toBe(200);
  });
});

describe('compra y entrega', () => {
  it('checkout de pago único por $99 (sin suscripción) y, al pagar, os da el acceso y el correo lleva «Empezar mi Ruta»', async () => {
    const r = await comprar();
    expect(r.status).toBe(200);
    const { order } = await r.json();
    expect(orden(order)).toMatchObject({ monto_centavos: 9900, regalo: 0, email: 'lupita@mail.com' });
    stripe.orden = order;
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(rpc).toEqual([{ nombre: 'darAcceso', datos: { correo: 'lupita@mail.com', nombre: 'Lupita Hernández', orden: order, curso: 'jovenes', dias: 365 } }]);
    expect(correos).toHaveLength(1);
    const c = correos[0];
    expect(c.para).toBe('lupita@mail.com');
    expect(c.asunto).toBe('Tu acceso: Ruta de Impacto');
    expect(c.html).toContain('Empezar mi Ruta');
    expect(c.html).toMatch(/href="https:\/\/ruta\.vorka\.mx\/entrar\/a{63}\d"/);
    expect(c.texto).toContain('válido hasta el 26 de octubre de 2027');
    expect(c.texto).toContain('Lo recibido va para IMPACTO');
    expect(orden(order).correo_enviado_at).toBeTruthy();
    // webhook repetido: ni otro acceso ni otro correo
    await evento('checkout.session.completed', 'cs_1');
    expect(rpc).toHaveLength(1); expect(correos).toHaveLength(1);
  });

  it('gracias: «Empezar mi Ruta» y el donativo con la línea de Dirección', async () => {
    const { id } = await pagar();
    const h = await (await pedir(`/tienda/gracias?order=${id}`)).text();
    expect(h).toContain('Empezar mi Ruta'); expect(h).toContain('¡Te damos la bienvenida a Ruta de Impacto!');
    expect(h).toContain('Lo recibido va para <a href="https://soyimpacto.org/"');
  });

  it('reenviar pide a os un enlace nuevo (la misma orden) y manda otro correo', async () => {
    const { id } = await pagar();
    await reenviarEnlace(env, id, { publico: true });
    expect(rpc.map(x => [x.nombre, x.datos.orden])).toEqual([['darAcceso', id], ['darAcceso', id]]);
    expect(correos).toHaveLength(2);
    expect(correos[1].html).toContain('https://ruta.vorka.mx/entrar/');
  });
});

describe('regalo', () => {
  it('quien paga recibe una liga de ruta.vorka.mx por regalo (crearRegalo), no el acceso', async () => {
    const { id, r } = await pagar({ regalo: true, cantidad: 2, regalo_para: 'Sofía', regalo_mensaje: '¡Échale ganas a tu proyecto!' });
    expect(r.status).toBe(200);
    expect(orden(id)).toMatchObject({ regalo: 1, monto_centavos: 19800 });
    expect(rpc.map(x => x.nombre)).toEqual(['crearRegalo', 'crearRegalo']);
    expect(rpc[0].datos).toEqual({ orden: id, curso: 'jovenes', dias: 365, de_nombre: 'Lupita Hernández', mensaje: '¡Échale ganas a tu proyecto!' });
    expect(rpc[1].datos.orden).toBe(`${id}:2`);
    expect(correos).toHaveLength(1);
    const c = correos[0];
    expect(c.asunto).toBe('Tus 2 regalos: Ruta de Impacto');
    expect(c.texto.match(/https:\/\/ruta\.vorka\.mx\/regalo\/\S+/g)).toHaveLength(2);
    expect(c.html).toContain('¡Gracias por regalar <b>Ruta de Impacto</b>!');
    expect(c.html).toContain(encodeURIComponent('Te regalé Ruta de Impacto'));
    // la tienda no crea ligas propias ni tokens de acceso para quien paga
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM regalos WHERE order_id = ?').get(id).n).toBe(0);
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM download_tokens WHERE order_id = ?').get(id).n).toBe(0);
    expect(rpc.some(x => x.nombre === 'darAcceso')).toBe(false);
  });

  it('reenviar (también desde el formulario público) manda las MISMAS ligas', async () => {
    const { id } = await pagar({ regalo: true, cantidad: 1 });
    const liga = correos[0].texto.match(/https:\/\/ruta\.vorka\.mx\/regalo\/\S+/)[0];
    await reenviarEnlace(env, id, { publico: true });
    expect(correos).toHaveLength(2);
    expect(correos[1].texto).toContain(liga);
    expect(correos[1].idempotencia).not.toBe(correos[0].idempotencia);   // si fuera la misma, el proveedor no lo mandaría
  });

  it('una cortesía con liga de la tienda: al canjearla, os da el acceso a nombre de quien la abre', async () => {
    const A = new Admin({}, env); A.env = env;
    const t = await A.crearCortesias({ product_id: 'prod_ruta_de_impacto', cantidad: 1 });
    const pag = await (await pedir(t.ligas[0].replace('https://vorka.mx', ''))).text();
    expect(pag).toContain('6 niveles y el proyecto final');
    const r = await pedir('/api/regalo/canjear', { metodo: 'POST', body: { token: t.ligas[0].split('/').pop(), nombre: 'Diego', email: 'diego@mail.com', terminos: true } });
    expect(r.status).toBe(200);
    expect((await r.json()).mensaje).toMatch(/empezar tu Ruta/);
    expect(rpc[0]).toMatchObject({ nombre: 'darAcceso', datos: { correo: 'diego@mail.com', curso: 'jovenes' } });
    expect(correos[0]).toMatchObject({ para: 'diego@mail.com', asunto: 'Tu regalo está activo: Ruta de Impacto' });
  });
});

describe('reembolso', () => {
  it('reembolso total → refunded y os revoca el acceso de la orden', async () => {
    const { id } = await pagar();
    expect((await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' })).status).toBe(200);
    expect(orden(id).estado).toBe('refunded');
    expect(rpc.at(-1)).toEqual({ nombre: 'revocar', datos: { orden: id, curso: 'jovenes' } });
  });

  it('reembolso de un regalo de 3 → revoca cada liga', async () => {
    const { id } = await pagar({ regalo: true, cantidad: 3 });
    await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' });
    expect(rpc.filter(x => x.nombre === 'revocar').map(x => x.datos.orden)).toEqual(clavesRuta(id, 3));
  });

  it('si os falla al revocar, el webhook responde 500 y el reintento sí revoca', async () => {
    const { id } = await pagar();
    osCaido = true;
    expect((await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' })).status).toBe(500);
    expect(orden(id).revisar).toMatch(/^Ruta de Impacto: no se pudo quitar el acceso/);
    osCaido = false;
    expect((await evento('charge.refunded', 'ch_1', { payment_intent: 'pi_1' })).status).toBe(200);
    expect(rpc.filter(x => x.nombre === 'revocar')).toHaveLength(2);
    expect(orden(id).revisar).toBeNull();
  });
});

describe('falla de os', () => {
  it('la orden no se pierde: queda pagada, sin correo, marcada para revisar y el webhook pide reintento', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    osCaido = true;
    const { id, r } = await pagar();
    expect(r.status).toBe(500);
    const o = orden(id);
    expect(o.estado).toBe('paid');
    expect(o.correo_enviado_at).toBeNull();
    expect(o.correo_intento_at).toBeNull();   // liberada para el reintento
    expect(o.revisar).toMatch(/^Ruta de Impacto: no se pudo dar el acceso en ruta\.vorka\.mx/);
    expect(correos).toHaveLength(0);
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM download_tokens WHERE order_id = ?').get(id).n).toBe(0);
    expect(err.mock.calls.some(c => String(c[0]).startsWith('ALERTA ruta'))).toBe(true);
    // el panel lo ve en la ficha de la orden
    const A = new Admin({}, env); A.env = env;
    expect((await A.orden(id)).revisar).toMatch(/Ruta de Impacto/);
    // Stripe reintenta (o el equipo reenvía) cuando os ya responde: se entrega y se quita la nota
    osCaido = false;
    expect((await evento('checkout.session.completed', 'cs_1')).status).toBe(200);
    expect(correos).toHaveLength(1);
    expect(orden(id).correo_enviado_at).toBeTruthy();
    expect(orden(id).revisar).toBeNull();
    err.mockRestore();
  });

  it('sin el service binding RUTA tampoco se pierde la orden', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete env.RUTA;
    const { id, r } = await pagar();
    expect(r.status).toBe(500);
    expect(orden(id).revisar).toMatch(/falta el service binding RUTA/);
    err.mockRestore();
  });

  it('regalo con os caído: no se manda correo sin ligas y se reintenta', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    osCaido = true;
    const { id, r } = await pagar({ regalo: true, cantidad: 2 });
    expect(r.status).toBe(500);
    expect(correos).toHaveLength(0);
    osCaido = false;
    await evento('checkout.session.completed', 'cs_1');
    expect(correos).toHaveLength(1);
    expect(correos[0].texto.match(/ruta\.vorka\.mx\/regalo\//g)).toHaveLength(2);
    expect(orden(id).revisar).toBeNull();
    err.mockRestore();
  });
});

describe('panel (Vorka OS → Tienda)', () => {
  it('la ficha de la orden trae el estado en os y «revocar» también lo quita allá', async () => {
    const { id } = await pagar();
    const A = new Admin({}, env); A.env = env;
    const o = await A.orden(id);
    expect(o.ruta).toEqual([{ curso: 'jovenes', nombre_curso: 'Ruta de Impacto', tipo: 'compra', estado: 'activo', orden: id }]);
    expect(await A.revocar(id)).toMatchObject({ ruta: 1 });
    expect(rpc.at(-1)).toEqual({ nombre: 'revocar', datos: { orden: id, curso: 'jovenes' } });
  });

  it('una orden sin Ruta no llama a os', async () => {
    const A = new Admin({}, env); A.env = env;
    const j = await (await pedir('/api/checkout', { metodo: 'POST', body: { nombre: 'Ana', email: 'ana@mail.com', terminos: true, slug: 'de-idea-a-proyecto' } })).json();
    expect((await A.orden(j.order)).ruta).toBeNull();
    expect(rpc).toHaveLength(0);
  });
});
