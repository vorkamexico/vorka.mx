import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken, correoEntrega } from '../src/entrega.js';
import { cookieAcceso } from '../src/simulador/index.js';
import { SECCIONES, SECCIONES_EXAMEN, TEMAS, TEXTOS, REACTIVOS } from '../src/simulador/banco.js';
import * as admin from '../src/admin.js';

let env, orden, token;
const pedir = (ruta, { metodo = 'GET', cookie, body } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body, redirect: 'manual',
}), env);
const soloCookie = setCookie => setCookie.split(';')[0];

async function comprar(slug = 'simulador-paa', email = 'ana@mail.com') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Ana López' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos ?? 24900, moneda: 'MXN', metodo_pago: 'card' });
  return o;
}

beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec("UPDATE products SET activo = 1");
  orden = await comprar();
  ({ token } = await crearToken(env, orden.id));
});

describe('banco de reactivos', () => {
  it('cada reactivo es válido y tiene tutor completo', () => {
    const ids = new Set();
    for (const r of REACTIVOS) {
      expect(ids.has(r.id), r.id).toBe(false); ids.add(r.id);
      expect(TEMAS[r.tema]?.seccion, r.id).toBe(r.seccion);
      if (r.texto) expect(TEXTOS[r.texto], r.id).toBeTruthy();
      if (r.tipo === 'abierta') expect(r.respuestas.length, r.id).toBeGreaterThan(0);
      else { expect(r.opciones, r.id).toHaveLength(4); expect(r.correcta >= 0 && r.correcta < 4, r.id).toBe(true); }
      expect(r.pista && r.regla && r.pasos.length, r.id).toBeTruthy();
      // Las explicaciones no nombran letras sueltas: el cliente baraja las opciones
      for (const t of [r.pista, ...r.pasos, r.regla]) expect(t, r.id).not.toMatch(/\bopci[oó]n [A-D]\b/);
    }
  });

  it('alcanza para armar cada sección del simulacro', () => {
    for (const s of SECCIONES) {
      const sueltos = REACTIVOS.filter(r => r.seccion === s.id && !r.texto).length;
      const textos = Object.values(TEXTOS).filter(t => t.seccion === s.id);
      if (s.id === 'lectura') {
        expect(textos.filter(t => t.tipo === 'literario').length).toBeGreaterThan(0);
        expect(textos.filter(t => t.tipo === 'no_literario').length).toBeGreaterThan(0);
      } else expect(sueltos, s.id).toBeGreaterThanOrEqual(s.reactivos - (s.id === 'ingles' ? 4 : 0));
    }
  });
});

describe('acceso al simulador', () => {
  it('sin acceso muestra la página pública para Google con compra directa y datos estructurados', async () => {
    const r = await pedir('/simulador-paa/');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).not.toContain('/simulador-paa/app.js');
    expect(html).toContain('<link rel="canonical" href="https://vorka.mx/simulador-paa/">');
    expect(html).toContain('<title>Simulador PAA 2026 en línea');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('simulador-paa-og.png');
    // tres planes que se complementan; de fábrica se elige el más barato y el paquete muestra cuánto ahorra
    for (const k of ['practica', 'completo', 'paquete']) expect(html).toContain(`href="?plan=${k}#comprar"`);
    expect(html).toContain('name="slug" value="simulador-paa-practica"');
    expect(html).toContain('Ahorra $69 MXN');
    expect(html).toContain('"@type":"AggregateOffer"');
    expect(await (await pedir('/simulador-paa/?plan=paquete')).text()).toContain('name="slug" value="simulador-paa-paquete"');
    // el reactivo de prueba va antes del formulario de compra, y la página ya no dice "oficiales" ni minutos de la PAA
    expect(html.indexOf('id="sv-ej"')).toBeLessThan(html.indexOf('id="comprar"'));
    expect(html).not.toMatch(/exámenes oficiales|Examen Oficial/);
    expect(html).not.toMatch(/\d+ min</);
    expect(html).not.toContain('noindex');
  });

  it('el enlace del correo deja una cookie que abre la app y la API', async () => {
    const r = await pedir(`/simulador-paa/entrar/${token}`);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/simulador-paa/');
    const sc = r.headers.get('set-cookie');
    expect(sc).toMatch(/HttpOnly/); expect(sc).toMatch(/Secure/);
    const cookie = soloCookie(sc);
    const app = await pedir('/simulador-paa/', { cookie });
    expect(await app.text()).toContain('/simulador-paa/app.js');
    expect(app.headers.get('content-security-policy')).toContain('https://os.vorka.mx');
    const banco = await (await pedir('/api/simulador-paa/banco', { cookie })).json();
    expect(banco.reactivos.length).toBe(REACTIVOS.length);
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo).toMatchObject({ nombre: 'Ana López', email: 'ana@mail.com', historial: [] });
  });

  it('la API sin cookie, con cookie alterada o de otra compra responde 401', async () => {
    expect((await pedir('/api/simulador-paa/banco')).status).toBe(401);
    const cookie = soloCookie(await cookieAcceso(env, orden.id, Date.now() + 864e5));
    expect((await pedir('/api/simulador-paa/banco', { cookie: cookie.replace(/.$/, c => c === 'a' ? 'b' : 'a') })).status).toBe(401);
    // Compra de otro producto (sin acceso a la app)
    const otra = await comprar('de-idea-a-proyecto', 'luis@mail.com');
    const ajena = soloCookie(await cookieAcceso(env, otra.id, Date.now() + 864e5));
    expect((await pedir('/api/simulador-paa/banco', { cookie: ajena })).status).toBe(401);
  });

  it('un reembolso corta el acceso aunque la cookie siga vigente', async () => {
    const cookie = soloCookie(await cookieAcceso(env, orden.id, Date.now() + 864e5));
    env.DB.raw.prepare("UPDATE orders SET estado = 'refunded' WHERE id = ?").run(orden.id);
    expect((await pedir('/api/simulador-paa/banco', { cookie })).status).toBe(401);
  });

  it('el acceso dura un año desde la compra; un token de descarga vencido sigue sirviendo dentro del año', async () => {
    env.DB.raw.prepare("UPDATE download_tokens SET expires_at = '2000-01-01T00:00:00Z'").run();
    expect((await pedir(`/simulador-paa/entrar/${token}`)).status).toBe(303);
    env.DB.raw.prepare("UPDATE orders SET paid_at = '2020-01-01T00:00:00Z' WHERE id = ?").run(orden.id);
    expect((await pedir(`/simulador-paa/entrar/${token}`)).status).toBe(410);
    expect((await pedir('/simulador-paa/entrar/' + 'f'.repeat(64))).status).toBe(404);
  });

  it('guarda resultados, limpia campos y los devuelve en el historial', async () => {
    const cookie = soloCookie(await cookieAcceso(env, orden.id, Date.now() + 864e5));
    const { id } = await (await pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie })).json();
    const body = JSON.stringify({ modo: 'completo', intento: id, global: 9999, meta: 600, confianza: 72, extra: 'x',
      secciones: [{ id: 'lectura', puntaje: 610, aciertos: 8, segundo: 2, total: 12, tiempo: 700, limite: 840 }],
      temas: { inferencia: { ok: 2, total: 3 }, inventado: { ok: 1, total: 1 } }, fallados: ['L-sue-3'] });
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', cookie, body })).status).toBe(200);
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo.historial).toHaveLength(1);
    expect(yo.historial[0]).toMatchObject({ modo: 'completo', global: 800, confianza: 72, temas: { inferencia: { ok: 2, total: 3 } }, fallados: ['L-sue-3'] });
    expect(yo.historial[0].temas.inventado).toBeUndefined();
    expect(yo.historial[0].extra).toBeUndefined();
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', cookie, body: '{"modo":"otro"}' })).status).toBe(400);
    // El mismo intento no se puede cerrar dos veces
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', cookie, body })).status).toBe(409);
  });

  it('cliente público y con caché larga', async () => {
    const r = await pedir('/simulador-paa/app.js');
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toContain('immutable');
  });
});

describe('integración con la tienda', () => {
  it('la página de descargas muestra el botón para entrar', async () => {
    const html = await (await pedir(`/descargas/${token}`)).text();
    expect(html).toContain(`/simulador-paa/entrar/${token}`);
    expect(html).toContain('Tu acceso, Ana');
  });

  it('el correo de entrega lleva directo al simulador', () => {
    const c = correoEntrega(env, { id: orden.id, nombre: 'Ana López' }, [{ nombre: 'Simulador PAA', contenido: JSON.stringify({ acceso: { app: 'simulador-paa', boton: 'Entrar al simulador' } }) }], 'abc');
    expect(c.asunto).toBe('Tu acceso: Simulador PAA');
    expect(c.html).toContain('https://vorka.mx/simulador-paa/entrar/abc');
    expect(c.texto).toContain('Entrar al simulador');
  });

  it('el panel puede activar el producto sin archivos y conserva contenido.acceso al editar', async () => {
    const p = await admin.productoPorId(env, 'prod_simulador_paa');
    await admin.guardarProducto(env, { id: p.id, nombre: p.nombre, precio: 299, activo: true, contenido: { titular: 'Nuevo titular', incluye: [], pasos: [], para_quien: [], faq: [] } });
    const d = await admin.productoPorId(env, p.id);
    expect(d.activo).toBe(true);
    expect(d.contenido.acceso.app).toBe('simulador-paa');
    expect(d.contenido.titular).toBe('Nuevo titular');
  });
});

describe('intentos de simulacro completo', () => {
  const cookieDe = async o => soloCookie(await cookieAcceso(env, o.id, Date.now() + 864e5));
  const iniciar = cookie => pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie });
  const yo = async cookie => (await pedir('/api/simulador-paa/yo', { cookie })).json();

  it('la compra trae 2; el tercero pide comprar; abandonar no devuelve el intento', async () => {
    const cookie = await cookieDe(orden);
    expect((await yo(cookie)).intentos).toMatchObject({ incluidos: 2, usados: 0, disponibles: 2, abierto: null });
    const a = await (await iniciar(cookie)).json();
    expect(a.items).toHaveLength(4);
    expect(a.items.map(x => x.length)).toEqual(SECCIONES.map(s => s.reactivos));
    // Retomar (otro dispositivo) no gasta otro intento
    const a2 = await (await iniciar(cookie)).json();
    expect(a2).toMatchObject({ id: a.id, retomado: true });
    expect((await yo(cookie)).intentos).toMatchObject({ usados: 1, disponibles: 1 });
    await pedir('/api/simulador-paa/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id: a.id }) });
    expect((await yo(cookie)).intentos).toMatchObject({ usados: 1, disponibles: 1, abierto: null });
    await iniciar(cookie);
    await pedir('/api/simulador-paa/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id: (await yo(cookie)).intentos.abierto.id }) });
    const r = await iniciar(cookie);
    expect(r.status).toBe(402);
    expect((await r.json()).sinIntentos).toBe(true);
    // Las secciones sueltas no gastan intentos
    const sec = JSON.stringify({ modo: 'seccion', secciones: [{ id: 'lectura', puntaje: 500, aciertos: 6, total: 12 }], temas: {} });
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', cookie, body: sec })).status).toBe(200);
  });

  it('un simulacro adicional comprado con el mismo correo suma intentos (por cantidad)', async () => {
    const extra = await crearOrden(env, { items: [{ slug: 'simulador-paa-intento', cantidad: 3 }], email: 'ana@mail.com', nombre: 'Ana López' });
    expect(extra.monto_centavos).toBe(15000);
    await aplicarPago(env, extra.id, { resultado: 'aprobado', monto_centavos: 15000, moneda: 'MXN', metodo_pago: 'card' });
    const y = await yo(await cookieDe(orden));
    expect(y.intentos).toMatchObject({ incluidos: 5, disponibles: 5 });
    expect(y.intentoExtra).toEqual({ slug: 'simulador-paa-intento', precio_centavos: 5000 });
    // Con la cookie de la compra del intento también entra, y el historial es el mismo (el de la compra base)
    const y2 = await yo(await cookieDe(extra));
    expect(y2.intentos.incluidos).toBe(5);
  });

  it('comprar solo el intento no da acceso, y el checkout lo bloquea si no tienes el simulador', async () => {
    const r = await worker.fetch(new Request('https://vorka.mx/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ slug: 'simulador-paa-intento', cantidad: 1 }], nombre: 'Luis', email: 'luis@mail.com', terminos: true }) }), env);
    expect(r.status).toBe(403);
    const sola = await comprar('simulador-paa-intento', 'luis@mail.com');
    expect((await pedir('/api/simulador-paa/banco', { cookie: soloCookie(await cookieAcceso(env, sola.id, Date.now() + 864e5)) })).status).toBe(401);
  });
});

describe('examen PAA completo (estructura real)', () => {
  const cookieDe = async o => soloCookie(await cookieAcceso(env, o.id, Date.now() + 864e5));
  const iniciarEx = cookie => pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie, body: JSON.stringify({ tipo: 'examen' }) });
  const yo = async cookie => (await pedir('/api/simulador-paa/yo', { cookie })).json();

  it('la compra trae 1 examen completo de 175 reactivos sin repetir, aparte de los 2 cortos', async () => {
    const cookie = await cookieDe(orden);
    const y = await yo(cookie);
    expect(y.examenes).toMatchObject({ incluidos: 1, disponibles: 1 });
    expect(y.intentos).toMatchObject({ incluidos: 2, disponibles: 2 });
    expect(y.examenExtra).toEqual({ slug: 'simulador-paa-examen', precio_centavos: 10000 });
    const a = await (await iniciarEx(cookie)).json();
    expect(a.items.map(x => x.length)).toEqual(SECCIONES_EXAMEN.map(s => s.reactivos));
    expect(a.items.flat()).toHaveLength(175);
    expect(new Set(a.items.flat()).size).toBe(175);
    // gastar el examen no toca los cortos
    expect((await yo(cookie)).intentos).toMatchObject({ disponibles: 2 });
    // el resultado del examen cierra su intento
    const res = JSON.stringify({ modo: 'examen', intento: a.id, secciones: [{ id: 'lectura', puntaje: 600, aciertos: 30, total: 45 }], temas: {} });
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', cookie, body: res })).status).toBe(200);
    const r = await iniciarEx(cookie);
    expect(r.status).toBe(402);
  });

  it('un examen adicional de $100 suma un examen, y solo lo compra quien ya tiene el simulador', async () => {
    const ex = await crearOrden(env, { items: [{ slug: 'simulador-paa-examen', cantidad: 2 }], email: 'ana@mail.com', nombre: 'Ana López' });
    expect(ex.monto_centavos).toBe(20000);
    await aplicarPago(env, ex.id, { resultado: 'aprobado', monto_centavos: 20000, moneda: 'MXN', metodo_pago: 'card' });
    const y = await yo(await cookieDe(orden));
    expect(y.examenes).toMatchObject({ incluidos: 3 });
    expect(y.intentos).toMatchObject({ incluidos: 2 });
    const r = await worker.fetch(new Request('https://vorka.mx/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ slug: 'simulador-paa-examen', cantidad: 1 }], nombre: 'Luis', email: 'luis@mail.com', terminos: true }) }), env);
    expect(r.status).toBe(403);
  });
});

describe('tienda por secciones y SEO', () => {
  it('el catálogo agrupa por secciones y no lista el simulacro adicional', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html).toMatch(/data-linea="examenes"[^>]*><i aria-hidden="true"><\/i>Educación<\/a>/);
    expect(html).toMatch(/data-linea="emprender"[^>]*><i aria-hidden="true"><\/i>Emprendimiento<\/a>/);
    expect(html).toContain('href="#examenes"');
    expect(html).not.toContain('simulador-paa-intento');
  });

  it('la página del intento redirige al simulador y la del simulador apunta a su página canónica', async () => {
    const r = await pedir('/tienda/simulador-paa-intento/');
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe('/simulador-paa/');
    const html = await (await pedir('/tienda/simulador-paa/')).text();
    expect(html).toContain('<link rel="canonical" href="https://vorka.mx/simulador-paa/">');
    expect(html).toContain('acceso inmediato por un año');
  });

  it('el sitemap incluye vorka.mx/simulador-paa/', async () => {
    const xml = await (await pedir('/tienda/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://vorka.mx/simulador-paa/</loc>');
    expect(xml).not.toContain('/tienda/simulador-paa/');
    expect(xml).not.toContain('simulador-paa-intento');
  });
});

describe('planes: Práctica ilimitada, Simulador completo y paquete', () => {
  const entrar = async (slug, email) => { const o = await comprar(slug, email); const { token: t } = await crearToken(env, o.id); return soloCookie((await pedir(`/simulador-paa/entrar/${t}`)).headers.get('set-cookie')); };
  const iniciar = (cookie, tipo) => pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie, body: JSON.stringify({ tipo }) });
  const abandonar = async (cookie, id) => pedir('/api/simulador-paa/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id }) });

  it('Práctica ilimitada: Calentamientos y Medios sin límite, sin examen oficial', async () => {
    const cookie = await entrar('simulador-paa-practica', 'pra@mail.com');
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo.plan).toEqual({ practica: true, completo: false, legado: false });
    expect(yo.intentos).toMatchObject({ ilimitado: true }); expect(yo.calentamientos).toMatchObject({ ilimitado: true });
    expect(yo.examenes).toMatchObject({ incluidos: 0, disponibles: 0 });
    expect(yo.ofertas.completo).toMatchObject({ slug: 'simulador-paa-completo', precio_centavos: 24900 });
    for (let i = 0; i < 4; i++) { const r = await (await iniciar(cookie, 'corto')).json(); expect(r.id).toBeTruthy(); await abandonar(cookie, r.id); }
    const ex = await iniciar(cookie, 'examen');
    expect(ex.status).toBe(402);
    expect((await ex.json()).error).toContain('Simulador completo');
  });

  it('Simulador completo: 2 exámenes oficiales y nada de práctica', async () => {
    const cookie = await entrar('simulador-paa-completo', 'com@mail.com');
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo.plan).toEqual({ practica: false, completo: true, legado: false });
    expect(yo.examenes).toMatchObject({ incluidos: 2, disponibles: 2 });
    const corto = await iniciar(cookie, 'corto');
    expect(corto.status).toBe(402);
    expect((await corto.json()).error).toContain('Práctica ilimitada');
    expect((await iniciar(cookie, 'examen')).status).toBe(200);
  });

  it('el paquete trae los dos, y quien compró antes conserva lo que traía su compra', async () => {
    const cookie = await entrar('simulador-paa-paquete', 'paq@mail.com');
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo.plan).toEqual({ practica: true, completo: true, legado: false });
    expect(yo.intentos.ilimitado).toBe(true); expect(yo.examenes.incluidos).toBe(2);
    // la compra de siempre (la de beforeEach): 2 Medios, 1 Oficial y 2 Calentamientos, como antes
    const c0 = soloCookie((await pedir(`/simulador-paa/entrar/${token}`)).headers.get('set-cookie'));
    const yo0 = await (await pedir('/api/simulador-paa/yo', { cookie: c0 })).json();
    expect(yo0.plan).toEqual({ practica: false, completo: false, legado: true });
    expect(yo0.intentos).toMatchObject({ incluidos: 2, ilimitado: false }); expect(yo0.examenes.incluidos).toBe(1); expect(yo0.calentamientos.incluidos).toBe(2);
    // si compra la Práctica ilimitada, sus Medios se vuelven ilimitados
    await comprar('simulador-paa-practica', 'ana@mail.com');
    const yo1 = await (await pedir('/api/simulador-paa/yo', { cookie: c0 })).json();
    expect(yo1.plan).toEqual({ practica: true, completo: false, legado: true }); expect(yo1.intentos.ilimitado).toBe(true);
  });

  it('el catálogo muestra una sola tarjeta del simulador, desde el plan más barato', async () => {
    const html = await (await pedir('/tienda/')).text();
    expect(html.match(/class="t-card-img" href="\/simulador-paa\/"/g)).toHaveLength(1);
    expect(html).toMatch(/Desde \$199 MXN/);
  });
});

describe('reembolsos del simulador (panel)', () => {
  it('sin usar: sí aplica; con un simulacro empezado: no aplica', async () => {
    expect((await admin.orden(env, orden.id)).reembolso).toMatchObject({ aplica: true });
    env.DB.raw.exec(`INSERT INTO simulador_intentos (email, items) VALUES ('ana@mail.com', '[]')`);
    const r = (await admin.orden(env, orden.id)).reembolso;
    expect(r.aplica).toBe(false);
    expect(r.motivo).toMatch(/Ya usó el simulador/);
  });
});
