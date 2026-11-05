// Tarjeta de Embajador(a) en Wallet (puntos.js › /api/puntos/wallet/*): sin sesión manda a entrar; con sesión le pide a os
// (entrypoint Wallet, aquí simulado) el pase de Apple o la liga de Google con su nombre, su código público y la liga a la tienda.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { PCT_REFERIDO } from '../src/descuentos.js';

let env, pedidos;
const SITIO = 'https://vorka.mx';
beforeEach(() => {
  pedidos = [];
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64),
    WALLET: { embajadorApple: async d => { pedidos.push(['apple', d]); return new Uint8Array([80, 75, 3, 4]); }, embajadorGoogle: async d => { pedidos.push(['google', d]); return 'https://pay.google.com/gp/v/save/abc'; } } };
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
});
afterEach(() => vi.unstubAllGlobals());
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
async function entrar(email) {
  const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre: 'Ana', terminos: true } })).json();
  return (await pedir(r.enlace)).headers.get('set-cookie').split(';')[0];
}

describe('Wallet de embajadores', () => {
  it('sin sesión manda a entrar a la app', async () => {
    const r = await pedir('/api/puntos/wallet/apple');
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe(`${SITIO}/tienda/cuenta/`);
    expect(pedidos).toHaveLength(0);
  });
  it('Apple: regresa el .pkpass con su código y la liga a la tienda', async () => {
    const cookie = await entrar('ana@mail.com');
    const r = await pedir('/api/puntos/wallet/apple', { cookie });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('application/vnd.apple.pkpass');
    const [, d] = pedidos[0];
    expect(d.email).toBe('ana@mail.com');
    expect(d.code).toMatch(/^[A-Za-z0-9_-]{2,40}$/);
    expect(d.liga).toBe(`${SITIO}/tienda/?ref=${encodeURIComponent(d.code)}`);
    expect(d.tema).toBe('noche');
  });
  it('Google: manda a la liga de guardar', async () => {
    const cookie = await entrar('ana@mail.com');
    const r = await pedir('/api/puntos/wallet/google', { cookie });
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe('https://pay.google.com/gp/v/save/abc');
  });
  it('si os falla, avisa sin tronar', async () => {
    env.WALLET.embajadorApple = async () => { throw new Error('sin llaves'); };
    const cookie = await entrar('ana@mail.com');
    expect((await pedir('/api/puntos/wallet/apple', { cookie })).status).toBe(502);
  });
  it('la app muestra los botones de Wallet', async () => {
    const cookie = await entrar('ana@mail.com');
    const html = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(html).toContain('/api/puntos/wallet/apple');
    expect(html).toContain('/api/puntos/wallet/google');
  });

  it('personalizar: tema, QR al catálogo y foto (con su liga para Google); valida lo que llega', async () => {
    const cookie = await entrar('ana@mail.com');
    const post = body => worker.fetch(new Request(SITIO + '/api/puntos/wallet/ajustes', { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: SITIO, 'cf-connecting-ip': '1.1.1.1' }, body: JSON.stringify(body) }), env);
    expect((await post({ tema: 'rosa' })).status).toBe(400);
    expect((await post({ qr: 'otro' })).status).toBe(400);
    expect((await post({ foto: 'data:image/jpeg;base64,AAAA' })).status).toBe(400);
    expect((await post({ tema: 'marfil', qr: 'catalogo' })).status).toBe(200);
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    expect((await post({ foto: `data:image/png;base64,${png}` })).status).toBe(200);
    const a = await (await pedir('/api/puntos/wallet/ajustes', { cookie })).json();
    expect(a).toMatchObject({ tema: 'marfil', qr: 'catalogo', foto: true });
    await pedir('/api/puntos/wallet/apple', { cookie });
    const d = pedidos.at(-1)[1];
    expect(d.tema).toBe('marfil');
    expect(d.liga).toMatch(/\/tienda\/catalogo\/\?ref=/);
    expect(d.foto_png).toBe(png);
    expect(d.foto_url).toMatch(/^https:\/\/vorka\.mx\/api\/puntos\/wallet\/foto\/[a-f0-9]{32}\.png$/);
    const foto = await pedir(new URL(d.foto_url).pathname);
    expect(foto.status).toBe(200);
    expect(foto.headers.get('content-type')).toBe('image/png');
    expect((await post({ foto: null })).status).toBe(200);
    expect((await (await pedir('/api/puntos/wallet/ajustes', { cookie })).json()).foto).toBe(false);
    // otra página no puede cambiarla
    const ajeno = await worker.fetch(new Request(SITIO + '/api/puntos/wallet/ajustes', { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: 'https://otro.com' }, body: '{"tema":"oro"}' }), env);
    expect(ajeno.status).toBe(403);
  });
});
