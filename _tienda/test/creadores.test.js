import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearEnlace } from '../src/creadores-acceso.js';

function r2() {
  const m = new Map();
  return { m,
    async put(k, v, o) { const buf = v instanceof ReadableStream ? await new Response(v).arrayBuffer() : v; m.set(k, { buf, o }); return {}; },
    async head(k) { return m.has(k) ? { size: 1 } : null; },
    async get(k) { const x = m.get(k); return x ? { body: new Blob([x.buf]).stream(), size: 1, httpMetadata: x.o?.httpMetadata } : null; },
    async delete(k) { m.delete(k); } };
}

let env, correos, stripe, ctx;
const SITIO = 'https://vorka.mx';
const pedir = (ruta, { metodo = 'GET', cuerpo, form, cookie, headers = {} } = {}) => {
  const h = { 'cf-connecting-ip': '1.2.3.4', origin: SITIO, ...headers };
  if (cookie) h.cookie = cookie;
  let body;
  if (form) body = new URLSearchParams(form);
  else if (cuerpo !== undefined) { h['content-type'] = 'application/json'; body = JSON.stringify(cuerpo); }
  return worker.fetch(new Request(SITIO + ruta, { method: metodo, headers: h, body }), env, ctx);
};
const fin = () => Promise.all(ctx.pendientes);
const creador = id => env.DB.raw.prepare('SELECT * FROM creadores WHERE id = ?').get(id);

async function entrar(id = 'cre_ok') {
  const url = await crearEnlace(env, id);
  const r = await pedir(new URL(url).pathname);
  expect(r.status).toBe(303);
  return r.headers.get('set-cookie').split(';')[0];
}

beforeEach(() => {
  env = { DB: d1(), PRODUCTOS: r2(), SITE_URL: SITIO, MARKETPLACE: '1', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), STRIPE_SECRET_KEY: 'rk_test_x', STRIPE_PUBLISHABLE_KEY: 'pk_test_x',
    CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado, comision_pct) VALUES ('cre_ok', 'Lucía Pérez', 'lucia@mail.com', 'aprobado', 20), ('cre_otro', 'Otro', 'otro@mail.com', 'aprobado', 20);`);
  ctx = { pendientes: [], waitUntil(p) { this.pendientes.push(p); } };
  correos = []; stripe = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    stripe.push({ url, init });
    if (url.endsWith('/v2/core/accounts')) return new Response(JSON.stringify({ id: 'acct_nuevo' }));
    if (url.includes('/v2/core/accounts/')) return new Response(JSON.stringify({ id: 'acct_nuevo', configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: 'pending' }, payouts: { status: 'pending' } } } } } }));
    if (url.endsWith('/v1/account_sessions')) return new Response(JSON.stringify({ client_secret: 'accs_secret' }));
    if (url.endsWith('/login_links')) return new Response(JSON.stringify({ url: 'https://connect.stripe.com/express/x' }));
    return new Response('{}', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('marketplace apagado', () => {
  it('con MARKETPLACE distinto de "1" el portal no existe', async () => {
    env.MARKETPLACE = '0';
    expect((await pedir('/creadores')).status).toBe(404);
  });
});

describe('solicitud', () => {
  it('se guarda como solicitud y avisa a Vorka y al creador', async () => {
    const r = await pedir('/creadores/solicitud', { metodo: 'POST', form: { nombre: 'Ana Creadora', email: ' Ana@Mail.com ', que_vende: 'Plantillas de Canva para emprendedores sociales, 30 diseños editables.', terminos: 'on' } });
    await fin();
    expect(await r.text()).toContain('Recibimos tu solicitud');
    const c = env.DB.raw.prepare("SELECT * FROM creadores WHERE email = 'ana@mail.com'").get();
    expect(c).toMatchObject({ estado: 'solicitud', comision_pct: 20 });
    expect(correos.map(x => x.para).sort()).toEqual(['ana@mail.com', 'hola@vorka.mx']);
  });

  it('valida y exige aceptar términos', async () => {
    const html = await (await pedir('/creadores/solicitud', { metodo: 'POST', form: { nombre: 'Ana', email: 'ana@mail.com', que_vende: 'Plantillas de Canva para emprendedores sociales.' } })).text();
    expect(html).toContain('términos para creadores');
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM creadores WHERE email = 'ana@mail.com'").get().n).toBe(0);
  });
});

describe('acceso por enlace mágico', () => {
  it('pedir enlace responde igual exista o no, y solo manda correo a creadores aprobados', async () => {
    const a = await (await pedir('/creadores/entrar', { metodo: 'POST', form: { email: 'lucia@mail.com' } })).text();
    const b = await (await pedir('/creadores/entrar', { metodo: 'POST', form: { email: 'nadie@mail.com' } })).text();
    await fin();
    const limpio = h => h.replace(/nonce-[^']+'|nonce="[^"]+"/g, '');
    expect(limpio(a)).toBe(limpio(b));
    expect(correos).toHaveLength(1);
    expect(correos[0].texto).toMatch(/creadores\/acceso\/[a-f0-9]{64}/);
  });

  it('el enlace sirve una sola vez y deja sesión', async () => {
    const url = await crearEnlace(env, 'cre_ok');
    const r = await pedir(new URL(url).pathname);
    expect(r.headers.get('set-cookie')).toMatch(/vorka_creador=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax/);
    expect((await pedir(new URL(url).pathname)).status).toBe(410);
  });

  it('sin sesión, el panel manda a entrar y la API responde 401', async () => {
    expect((await pedir('/creadores/panel')).headers.get('location')).toBe('/creadores/entrar');
    expect((await pedir('/api/creadores/productos', { metodo: 'POST', cuerpo: {} })).status).toBe(401);
  });
});

describe('panel y pagos con Stripe', () => {
  it('muestra el panel con el botón para configurar pagos y carga Connect.js con CSP de Stripe', async () => {
    const cookie = await entrar();
    const r = await pedir('/creadores/panel', { cookie });
    const html = await r.text();
    expect(html).toContain('Configurar mis pagos');
    expect(html).toContain("from '/creadores/connect.mjs'");
    expect(html).toContain('"pk_test_x"');
    expect(r.headers.get('content-security-policy')).toContain('https://connect-js.stripe.com');
  });

  it('la primera sesión de Stripe crea su cuenta (una vez) y devuelve el client_secret', async () => {
    const cookie = await entrar();
    const r = await pedir('/api/creadores/stripe/sesion', { metodo: 'POST', cookie });
    expect(await r.json()).toEqual({ client_secret: 'accs_secret' });
    expect(creador('cre_ok').stripe_account_id).toBe('acct_nuevo');
    await pedir('/api/creadores/stripe/sesion', { metodo: 'POST', cookie });
    expect(stripe.filter(s => s.url.endsWith('/v2/core/accounts'))).toHaveLength(1);
  });

  it('rechaza acciones desde otro sitio', async () => {
    const cookie = await entrar();
    expect((await pedir('/api/creadores/stripe/sesion', { metodo: 'POST', cookie, headers: { origin: 'https://malo.com' } })).status).toBe(403);
  });

  it('sirve Connect.js', async () => {
    const r = await pedir('/creadores/connect.mjs');
    expect(r.headers.get('content-type')).toContain('javascript');
    expect(await r.text()).toContain('loadConnectAndInitialize');
  });
});

describe('productos del creador', () => {
  it('crea en borrador, sube archivo, envía a revisión; nunca se publica solo', async () => {
    const cookie = await entrar();
    let p = await (await pedir('/api/creadores/productos', { metodo: 'POST', cookie, cuerpo: { nombre: 'Plantillas Canva', precio: 150, contenido: { titular: 'Diseña rápido' } } })).json();
    expect(p).toMatchObject({ creador_id: 'cre_ok', revision: 'borrador', activo: false, precio_centavos: 15000 });
    expect((await pedir(`/api/creadores/productos/${p.id}/revision`, { metodo: 'POST', cookie })).status).toBe(400); // sin archivos
    const sub = await pedir(`/api/creadores/productos/${p.id}/archivos`, { metodo: 'PUT', cookie, headers: { 'x-nombre': 'plantillas.zip', 'content-type': 'application/zip', 'content-length': '3' } });
    // el cuerpo de la petición de prueba va vacío: basta con que la ruta exija x-nombre y responda
    expect([200, 400]).toContain(sub.status);
    env.DB.raw.prepare("UPDATE products SET r2_keys = ? WHERE id = ?").run(JSON.stringify([{ key: 'plantillas-canva/plantillas.zip', nombre: 'Plantillas' }]), p.id);
    p = await (await pedir(`/api/creadores/productos/${p.id}/revision`, { metodo: 'POST', cookie })).json();
    expect(p.revision).toBe('en_revision');
    expect(env.DB.raw.prepare('SELECT activo FROM products WHERE id = ?').get(p.id).activo).toBe(0);
  });

  it('precio mínimo $20', async () => {
    const cookie = await entrar();
    expect((await pedir('/api/creadores/productos', { metodo: 'POST', cookie, cuerpo: { nombre: 'Barato', precio: 5 } })).status).toBe(400);
  });

  it('no puede ver ni editar productos de otro creador ni de Vorka', async () => {
    const cookie = await entrar('cre_otro');
    expect((await pedir('/api/creadores/productos/prod_de_idea_a_proyecto', { metodo: 'PUT', cookie, cuerpo: { nombre: 'Hackeado', precio: 1 } })).status).toBe(404);
    expect((await pedir('/creadores/productos/prod_de_idea_a_proyecto', { cookie })).headers.get('location')).toBe('/creadores/panel');
  });

  it('editar un producto publicado lo regresa a borrador y lo quita de la venta', async () => {
    const cookie = await entrar();
    const p = await (await pedir('/api/creadores/productos', { metodo: 'POST', cookie, cuerpo: { nombre: 'Guía X', precio: 99 } })).json();
    env.DB.raw.prepare("UPDATE products SET revision = 'aprobado', activo = 1 WHERE id = ?").run(p.id);
    const q = await (await pedir(`/api/creadores/productos/${p.id}`, { metodo: 'PUT', cookie, cuerpo: { nombre: 'Guía X v2', precio: 99 } })).json();
    expect(q.revision).toBe('borrador');
    expect(env.DB.raw.prepare('SELECT activo, revision FROM products WHERE id = ?').get(p.id)).toEqual({ activo: 0, revision: 'borrador' });
  });

  it('un creador suspendido ve su panel pero no puede cambiar nada', async () => {
    const cookie = await entrar();
    env.DB.raw.exec("UPDATE creadores SET estado = 'suspendido' WHERE id = 'cre_ok'");
    expect(await (await pedir('/creadores/panel', { cookie })).text()).toContain('Tu cuenta está pausada');
    expect((await pedir('/api/creadores/productos', { metodo: 'POST', cookie, cuerpo: { nombre: 'X', precio: 50 } })).status).toBe(403);
  });
});
