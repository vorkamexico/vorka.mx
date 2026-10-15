import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { formulario, sesionCheckout } from '../src/pagos/stripe.js';

let env, llamadas;
const URL_PAGO = 'https://checkout.stripe.com/c/pay/cs_test_1';

function stripeFalso({ status = 200 } = {}) {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, init, params: new URLSearchParams(init.body) });
    return new Response(JSON.stringify(status === 200 ? { id: `cs_test_${llamadas.length}`, url: URL_PAGO } : { error: { message: 'boom' } }), { status });
  }));
}

const pedir = (body, { tipo = 'json', ip = '1.1.1.1', cookie } = {}) => {
  const headers = { 'cf-connecting-ip': ip };
  if (cookie) headers.cookie = cookie;
  let cuerpo;
  if (tipo === 'json') { headers['content-type'] = 'application/json'; cuerpo = JSON.stringify(body); }
  else cuerpo = new URLSearchParams(body);
  return worker.fetch(new Request('https://vorka.mx/api/checkout', { method: 'POST', headers, body: cuerpo }), env);
};
const base = { nombre: 'Ana López', email: 'ana@mail.com', terminos: true, slug: 'de-idea-a-proyecto' };
const orden = () => env.DB.raw.prepare('SELECT * FROM orders').all();

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_METODOS: 'card,oxxo,customer_balance' };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('ANA', 'Ana', 15);");
  stripeFalso();
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/checkout', () => {
  it('crea la orden pending y la sesión de Stripe con el precio de la base', async () => {
    const r = await pedir({ ...base, precio: 1 }); // un precio mandado por el navegador se ignora
    expect(r.status).toBe(200);
    const { url, order } = await r.json();
    expect(url).toBe(URL_PAGO);
    const [o] = orden();
    expect(o).toMatchObject({ id: order, estado: 'pending', monto_centavos: 27900, provider_session_id: 'cs_test_1' });
    const p = llamadas[0].params;
    expect(llamadas[0].url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(llamadas[0].init.headers['idempotency-key']).toBe(`checkout-${order}`);
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('27900');
    expect(p.get('line_items[0][price_data][currency]')).toBe('mxn');
    expect(p.get('client_reference_id')).toBe(order);
    expect(p.get('payment_intent_data[metadata][order_id]')).toBe(order);
    expect(p.getAll('payment_method_types[0]').concat(p.getAll('payment_method_types[1]'), p.getAll('payment_method_types[2]'))).toEqual(['card', 'oxxo', 'customer_balance']);
    expect(p.get('payment_method_options[customer_balance][bank_transfer][type]')).toBe('mx_bank_transfer');
    expect(p.get('success_url')).toBe(`https://vorka.mx/tienda/gracias?order=${order}`);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM events WHERE tipo = 'begin_checkout'").get().n).toBe(1);
  });

  it('formulario sin JavaScript: 303 directo a Stripe', async () => {
    const r = await pedir({ ...base, terminos: 'on' }, { tipo: 'form' });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe(URL_PAGO);
  });

  it('exige aceptar términos', async () => {
    const r = await pedir({ ...base, terminos: false });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/términos/);
    expect(orden()).toHaveLength(0);
  });

  it('valida correo', async () => {
    expect((await pedir({ ...base, email: 'no-es-correo' })).status).toBe(400);
  });

  it('formulario inválido regresa a la página del producto con el error', async () => {
    const r = await pedir({ ...base, terminos: '' }, { tipo: 'form' });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toMatch(/^https:\/\/vorka\.mx\/tienda\/de-idea-a-proyecto\?error=/);
  });

  it('producto inactivo o inexistente → 404 sin llamar a Stripe', async () => {
    env.DB.raw.exec('UPDATE products SET activo = 0');
    expect((await pedir(base)).status).toBe(404);
    expect(llamadas).toHaveLength(0);
  });

  it('toma el afiliado de la cookie vorka_ref', async () => {
    await pedir(base, { cookie: 'otra=1; vorka_ref=ANA' });
    expect(orden()[0]).toMatchObject({ ref_code: 'ANA', comision_pct: 15 });
  });

  it('límite por correo: el sexto intento en 10 min → 429', async () => {
    const s = [];
    for (let i = 0; i < 6; i++) s.push((await pedir(base, { ip: `9.9.9.${i}` })).status);
    expect(s).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('límite por IP: el intento 11 → 429', async () => {
    const s = [];
    for (let i = 0; i < 11; i++) s.push((await pedir({ ...base, email: `c${i}@mail.com` })).status);
    expect(s.at(-1)).toBe(429);
    expect(s.slice(0, 10).every(x => x === 200)).toBe(true);
  });

  it('si Stripe falla: 502 y la orden queda failed', async () => {
    stripeFalso({ status: 500 });
    const r = await pedir(base);
    expect(r.status).toBe(502);
    expect(orden()[0].estado).toBe('failed');
  });
});

describe('Stripe: parámetros', () => {
  it('formulario anida objetos y listas', () => {
    expect(formulario({ a: { b: [1, 2] }, c: 'x', d: undefined }).toString()).toBe('a%5Bb%5D%5B0%5D=1&a%5Bb%5D%5B1%5D=2&c=x');
  });
  it('sin SPEI no pide Customer ni opciones de transferencia', () => {
    const s = sesionCheckout({ STRIPE_METODOS: 'card' }, { id: 'o', email: 'a@b.mx', moneda: 'MXN', items: [] }, { exito: 'e', cancelar: 'c' });
    expect(s.customer_creation).toBeUndefined();
    expect(s.payment_method_options).toEqual({});
  });
});

describe('checkout: correo con espacios', () => {
  it('acepta y normaliza " Ana@Mail.com "', async () => {
    const r = await pedir({ ...base, email: ' Ana@Mail.com ' });
    expect(r.status).toBe(200);
    expect(orden()[0].email).toBe('ana@mail.com');
  });
});
