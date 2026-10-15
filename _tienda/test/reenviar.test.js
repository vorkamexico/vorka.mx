import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { RESPUESTA } from '../src/reenviar.js';

let env, correos, ctx;
const pedir = (cuerpo, { ip = '1.1.1.1', metodo = 'POST' } = {}) => worker.fetch(new Request('https://vorka.mx/descargas/reenviar', {
  method: metodo, headers: { 'cf-connecting-ip': ip }, body: metodo === 'POST' ? new URLSearchParams(cuerpo) : undefined,
}), env, ctx);
const fin = () => Promise.all(ctx.pendientes);
const tokens = () => env.DB.raw.prepare('SELECT * FROM download_tokens').all();
const texto = async r => (await r.text()).replace(/<script[\s\S]*?<\/script>/g, '');

async function pagada(email, nombre = 'Ana') {
  const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email, nombre });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN' });
  return o;
}

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', RESEND_API_KEY: 're_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  ctx = { pendientes: [], waitUntil(p) { this.pendientes.push(p); } };
  correos = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => { correos.push(JSON.parse(init.body)); return new Response('{"id":"em"}'); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('/descargas/reenviar', () => {
  it('muestra el formulario', async () => {
    const r = await pedir(null, { metodo: 'GET' });
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('name="email"');
    expect(html).toContain('noindex');
  });

  it('con compra pagada: token nuevo y correo', async () => {
    await pagada('ana@mail.com');
    const r = await pedir({ email: ' ANA@mail.com ' });
    await fin();
    expect(r.status).toBe(200);
    expect(await r.text()).toContain(RESPUESTA);
    expect(tokens()).toHaveLength(1);
    expect(correos).toHaveLength(1);
    expect(correos[0].to).toEqual(['ana@mail.com']);
  });

  it('la respuesta es idéntica exista o no la compra', async () => {
    await pagada('ana@mail.com');
    const a = await texto(await pedir({ email: 'ana@mail.com' }));
    const b = await texto(await pedir({ email: 'nadie@mail.com' }));
    await fin();
    expect(a).toBe(b);
    expect(correos).toHaveLength(1);
  });

  it('órdenes no pagadas no reciben nada', async () => {
    await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'B' });
    await pedir({ email: 'b@mail.com' });
    await fin();
    expect(correos).toHaveLength(0);
    expect(tokens()).toHaveLength(0);
  });

  it('una orden reembolsada no se reenvía', async () => {
    const o = await pagada('c@mail.com');
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    await pedir({ email: 'c@mail.com' });
    await fin();
    expect(correos).toHaveLength(0);
  });

  it('varias compras → un correo por compra', async () => {
    await pagada('d@mail.com'); await pagada('d@mail.com');
    await pedir({ email: 'd@mail.com' });
    await fin();
    expect(correos).toHaveLength(2);
  });

  it('límite por correo: después de 3 en una hora, misma respuesta pero no envía', async () => {
    await pagada('e@mail.com');
    const r = [];
    for (let i = 0; i < 5; i++) r.push(await pedir({ email: 'e@mail.com' }, { ip: `2.2.2.${i}` }));
    await fin();
    expect(r.map(x => x.status)).toEqual([200, 200, 200, 200, 200]);
    expect(correos).toHaveLength(3);
  });

  it('límite por IP → 429', async () => {
    const s = [];
    for (let i = 0; i < 11; i++) s.push((await pedir({ email: `x${i}@mail.com` })).status);
    expect(s.at(-1)).toBe(429);
  });

  it('correo inválido → error en el formulario', async () => {
    const r = await pedir({ email: 'no' });
    expect(r.status).toBe(400);
    expect(await r.text()).toContain('aria-invalid="true"');
  });

  it('trampa para bots llena → misma respuesta sin enviar', async () => {
    await pagada('f@mail.com');
    const r = await pedir({ email: 'f@mail.com', sitio: 'http://spam' });
    await fin();
    expect(await r.text()).toContain(RESPUESTA);
    expect(correos).toHaveLength(0);
  });

  it('si Resend falla, no queda token huérfano y la respuesta no cambia', async () => {
    await pagada('g@mail.com');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 503 })));
    const r = await pedir({ email: 'g@mail.com' });
    await fin();
    expect(await r.text()).toContain(RESPUESTA);
    expect(tokens()).toHaveLength(0);
  });
});
