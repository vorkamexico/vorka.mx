import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { datosUsuario, compraMeta, eventoPagina, fbcDe } from '../src/meta.js';
import { sha256 } from '../src/util.js';

let env, llamadas;
const GRAPH = 'https://graph.facebook.com/';
const aMeta = () => llamadas.filter(l => l.url.startsWith(GRAPH));
const cuerpo = l => JSON.parse(l.init.body);

function redFalsa({ metaStatus = 200 } = {}) {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url: String(url), init });
    if (String(url).startsWith(GRAPH)) return new Response(JSON.stringify(metaStatus === 200 ? { events_received: 1 } : { error: {} }), { status: metaStatus });
    if (String(url).endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }));
  }));
}

const ENCENDIDO = { META_PIXEL_ID: '123456', META_CAPI_TOKEN: 'tok', META_TEST_CODE: 'TEST1' };
const pedir = (ruta, init = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, init), env);
const ordenPagada = (extra = {}) => {
  const o = { id: '11111111-1111-4111-8111-111111111111', email: 'Ana@Mail.com', nombre: 'Ána López Pérez', monto_centavos: 27900, estado: 'paid', proveedor: 'stripe', paid_at: new Date().toISOString(), ...extra };
  env.DB.raw.prepare('INSERT INTO orders (id, email, nombre, monto_centavos, estado, proveedor, paid_at, meta_fbp, meta_ip) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(o.id, o.email, o.nombre, o.monto_centavos, o.estado, o.proveedor, o.paid_at, 'fb.1.1.abc', '1.2.3.4');
  env.DB.raw.prepare("INSERT INTO order_items (order_id, product_id, nombre, precio_centavos, cantidad) VALUES (?, 'prod_de_idea_a_proyecto', 'Kit', 27900, 1)").run(o.id);
  return o;
};

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x' };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  redFalsa();
});
afterEach(() => vi.unstubAllGlobals());

describe('Meta apagado (sin píxel ni token)', () => {
  it('config da pixel null y nada llama a Meta', async () => {
    expect(await (await pedir('/api/meta/config')).json()).toEqual({ pixel: null });
    const r = await pedir('/api/meta/evento', { method: 'POST', body: JSON.stringify({ evento: 'PageView', id: 'pageview_abc123', url: 'https://vorka.mx/' }) });
    expect(r.status).toBe(204);
    ordenPagada();
    expect((await compraMeta(env, '11111111-1111-4111-8111-111111111111')).ok).toBe(false);
    expect(aMeta()).toHaveLength(0);
  });

  it('el checkout funciona igual que antes', async () => {
    const r = await pedir('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1' },
      body: JSON.stringify({ nombre: 'Ana López', email: 'ana@mail.com', terminos: true, slug: 'de-idea-a-proyecto' }) });
    expect(r.status).toBe(200);
    expect(aMeta()).toHaveLength(0);
    expect(env.DB.raw.prepare('SELECT meta_fbp FROM orders').get().meta_fbp).toBeNull();
  });
});

describe('Meta encendido', () => {
  beforeEach(() => Object.assign(env, ENCENDIDO));

  it('datosUsuario: correo y nombre con SHA-256, en minúsculas y sin acentos', async () => {
    const u = await datosUsuario({ email: ' Ana@Mail.com ', nombre: 'Ána López Pérez', ip: '1.2.3.4', fbp: 'fb.1.1.x' });
    expect(u.em).toEqual([await sha256('ana@mail.com')]);
    expect(u.fn).toEqual([await sha256('ana')]);
    expect(u.ln).toEqual([await sha256('perez')]);
    expect(u.country).toEqual([await sha256('mx')]);
    expect(u).toMatchObject({ client_ip_address: '1.2.3.4', fbp: 'fb.1.1.x' });
    expect(u.client_user_agent).toBeUndefined();
  });

  it('fbc: usa la cookie, o la arma con ?fbclid=', () => {
    const conCookie = new Request('https://vorka.mx/', { headers: { cookie: '_fbc=fb.1.9.zzz' } });
    expect(fbcDe(conCookie, 'https://vorka.mx/')).toBe('fb.1.9.zzz');
    expect(fbcDe(new Request('https://vorka.mx/'), 'https://vorka.mx/?fbclid=ABC')).toMatch(/^fb\.1\.\d+\.ABC$/);
    expect(fbcDe(new Request('https://vorka.mx/'), 'https://vorka.mx/')).toBeNull();
  });

  it('config da el píxel', async () => {
    expect(await (await pedir('/api/meta/config')).json()).toEqual({ pixel: '123456' });
  });

  it('evento del navegador: lo reenvía a CAPI con el mismo id, IP, navegador y cookies', async () => {
    const r = await pedir('/api/meta/evento', { method: 'POST',
      headers: { 'cf-connecting-ip': '9.9.9.9', 'user-agent': 'UA', cookie: '_fbp=fb.1.2.def' },
      body: JSON.stringify({ evento: 'Contact', id: 'contact_xyz789', url: 'https://vorka.mx/servicios/?fbclid=QQ', datos: { content_name: 'WhatsApp', value: 'x', raro: 1 } }) });
    expect(r.status).toBe(204);
    const [l] = aMeta();
    expect(l.url).toContain('/v24.0/123456/events?access_token=tok');
    const b = cuerpo(l);
    expect(b.test_event_code).toBe('TEST1');
    expect(b.data[0]).toMatchObject({ event_name: 'Contact', event_id: 'contact_xyz789', action_source: 'website', event_source_url: 'https://vorka.mx/servicios/?fbclid=QQ',
      custom_data: { content_name: 'WhatsApp' } });
    expect(b.data[0].custom_data.raro).toBeUndefined();
    expect(b.data[0].user_data).toMatchObject({ client_ip_address: '9.9.9.9', client_user_agent: 'UA', fbp: 'fb.1.2.def' });
    expect(b.data[0].user_data.fbc).toMatch(/\.QQ$/);
  });

  it('el navegador no puede mandar compras, ni eventos de otro sitio, ni ids raros', async () => {
    const mal = [
      { evento: 'Purchase', id: 'compra_abc123', url: 'https://vorka.mx/' },
      { evento: 'PageView', id: 'pageview_abc123', url: 'https://otro.com/' },
      { evento: 'PageView', id: '<x>', url: 'https://vorka.mx/' },
    ];
    for (const b of mal) expect((await pedir('/api/meta/evento', { method: 'POST', body: JSON.stringify(b) })).status).toBe(400);
    expect((await pedir('/api/meta/evento', { method: 'POST', body: 'no es json' })).status).toBe(400);
    expect(aMeta()).toHaveLength(0);
  });

  it('compra: la manda una sola vez, con valor, correo cifrado y las cookies guardadas', async () => {
    const o = ordenPagada();
    expect((await compraMeta(env, o.id)).ok).toBe(true);
    expect((await compraMeta(env, o.id)).ok).toBe(false);   // ya marcada
    expect(aMeta()).toHaveLength(1);
    const ev = cuerpo(aMeta()[0]).data[0];
    expect(ev).toMatchObject({ event_name: 'Purchase', event_id: `compra_${o.id}`, custom_data: { value: 279, currency: 'MXN', order_id: o.id, content_ids: ['prod_de_idea_a_proyecto'] } });
    expect(ev.user_data).toMatchObject({ em: [await sha256('ana@mail.com')], fbp: 'fb.1.1.abc', client_ip_address: '1.2.3.4' });
    expect(env.DB.raw.prepare('SELECT meta_compra_at FROM orders').get().meta_compra_at).toBeTruthy();
  });

  it('compra: si Meta falla no se marca (se reintenta después)', async () => {
    redFalsa({ metaStatus: 500 });
    const o = ordenPagada();
    expect((await compraMeta(env, o.id)).ok).toBe(false);
    expect(env.DB.raw.prepare('SELECT meta_compra_at FROM orders').get().meta_compra_at).toBeNull();
  });

  it('compra: no manda regalos de $0, órdenes sin pagar ni compras de hace más de 7 días', async () => {
    ordenPagada({ id: '22222222-2222-4222-8222-222222222222', monto_centavos: 0, proveedor: 'cortesia' });
    ordenPagada({ id: '33333333-3333-4333-8333-333333333333', estado: 'pending', paid_at: null });
    ordenPagada({ id: '44444444-4444-4444-8444-444444444444', paid_at: new Date(Date.now() - 10 * 864e5).toISOString() });
    for (const id of ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444'])
      expect((await compraMeta(env, id)).ok).toBe(false);
    expect(aMeta()).toHaveLength(0);
  });

  it('checkout: guarda el navegador en la orden y avisa InitiateCheckout', async () => {
    const r = await pedir('/api/checkout', { method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '5.5.5.5', 'user-agent': 'UA2', cookie: '_fbp=fb.1.3.ghi; _fbc=fb.1.3.jkl', referer: 'https://vorka.mx/tienda/de-idea-a-proyecto/' },
      body: JSON.stringify({ nombre: 'Ana López', email: 'ana@mail.com', terminos: true, slug: 'de-idea-a-proyecto' }) });
    expect(r.status).toBe(200);
    const o = env.DB.raw.prepare('SELECT * FROM orders').get();
    expect(o).toMatchObject({ meta_fbp: 'fb.1.3.ghi', meta_fbc: 'fb.1.3.jkl', meta_ip: '5.5.5.5', meta_ua: 'UA2' });
    const ev = cuerpo(aMeta()[0]).data[0];
    expect(ev).toMatchObject({ event_name: 'InitiateCheckout', event_id: `checkout_${o.id}`, event_source_url: 'https://vorka.mx/tienda/de-idea-a-proyecto/', custom_data: { value: 279, currency: 'MXN' } });
  });

  it('eventoPagina no deja cerrar la etiqueta <script>', () => {
    const js = eventoPagina('ViewContent', { content_name: '</script><script>alert(1)</script>' });
    expect(js).not.toContain('</script>');
    expect(js).toContain('window.vorkaMeta');
  });
});
