import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken, MAX_DESCARGAS } from '../src/entrega.js';
import { vista } from '../src/gracias.js';

// R2 falso
function r2(archivos) {
  const m = new Map(Object.entries(archivos));
  return {
    async head(k) { return m.has(k) ? { size: m.get(k).length } : null; },
    async get(k) { const v = m.get(k); return v ? { body: new Blob([v]).stream(), size: v.length, httpMetadata: { contentType: 'application/pdf' } } : null; },
  };
}

let env, orden, token;
const KEYS = ['de-idea-a-proyecto/1_Guia_De_Idea_a_Proyecto.pdf', 'de-idea-a-proyecto/2_Cuaderno_de_trabajo.docx', 'de-idea-a-proyecto/3_Calculadora_De_Idea_a_Proyecto.xlsx'];
const pedir = (ruta, metodo = 'GET') => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: metodo }), env);

beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: r2(Object.fromEntries(KEYS.map(k => [k, `contenido de ${k}`]))) };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  orden = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'ana@mail.com', nombre: 'Ana López' });
  await aplicarPago(env, orden.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN', metodo_pago: 'card' });
  ({ token } = await crearToken(env, orden.id));
});

describe('/descargas/<token>', () => {
  it('lista los 3 archivos con su botón', async () => {
    const r = await pedir(`/descargas/${token}`);
    expect(r.status).toBe(200);
    expect(r.headers.get('referrer-policy')).toBe('no-referrer');
    expect(r.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    const html = await r.text();
    expect(html).toContain('Tus archivos, Ana');
    expect(html).toContain('noindex');
    for (let n = 0; n < 3; n++) expect(html).toContain(`/descargas/${token}/${n}`);
  });

  it('los 3 archivos se descargan como adjunto desde R2', async () => {
    for (let n = 0; n < 3; n++) {
      const r = await pedir(`/descargas/${token}/${n}`);
      expect(r.status).toBe(200);
      expect(r.headers.get('content-disposition')).toMatch(/^attachment; filename="/);
      expect(await r.text()).toBe(`contenido de ${KEYS[n]}`);
    }
    expect(JSON.parse(env.DB.raw.prepare('SELECT descargas FROM download_tokens').get().descargas)).toEqual(Object.fromEntries(KEYS.map(k => [k, 1])));
  });

  it(`máximo ${MAX_DESCARGAS} descargas por archivo; luego mensaje claro y enlace a reenviar`, async () => {
    for (let i = 0; i < MAX_DESCARGAS; i++) expect((await pedir(`/descargas/${token}/0`)).status).toBe(200);
    const r = await pedir(`/descargas/${token}/0`);
    expect(r.status).toBe(410);
    const html = await r.text();
    expect(html).toContain('límite de descargas');
    expect(html).toContain('/descargas/reenviar');
    // Los otros archivos siguen disponibles
    expect((await pedir(`/descargas/${token}/1`)).status).toBe(200);
    expect(await (await pedir(`/descargas/${token}`)).text()).toContain('Agotado');
  });

  it('clics simultáneos no rebasan el límite', async () => {
    const r = await Promise.all(Array.from({ length: MAX_DESCARGAS + 5 }, () => pedir(`/descargas/${token}/2`)));
    expect(r.filter(x => x.status === 200)).toHaveLength(MAX_DESCARGAS);
  });

  it('token caducado → mensaje claro y enlace a reenviar', async () => {
    env.DB.raw.exec("UPDATE download_tokens SET expires_at = '2020-01-01T00:00:00Z'");
    for (const ruta of [`/descargas/${token}`, `/descargas/${token}/0`]) {
      const r = await pedir(ruta);
      expect(r.status).toBe(410);
      const html = await r.text();
      expect(html).toContain('Tu enlace venció');
      expect(html).toContain('/descargas/reenviar');
    }
  });

  it('reembolso → el enlace deja de funcionar', async () => {
    await aplicarPago(env, orden.id, { resultado: 'reembolsado' });
    const r = await pedir(`/descargas/${token}/0`);
    expect(r.status).toBe(410);
    expect(await r.text()).toContain('ya no está activo');
  });

  it('token inexistente o malformado → página de enlace no válido', async () => {
    expect((await pedir(`/descargas/${'0'.repeat(64)}`)).status).toBe(404);
    const r = await pedir('/descargas/abc');
    expect(r.status).toBe(404);
    expect(await r.text()).toContain('Enlace no válido');
  });

  it('archivo que no existe en la lista → no válido', async () => {
    expect((await pedir(`/descargas/${token}/7`)).status).toBe(404);
  });

  it('si falta en R2 → 503 sin gastar descarga', async () => {
    env.PRODUCTOS = r2({});
    expect((await pedir(`/descargas/${token}/0`)).status).toBe(503);
    expect(env.DB.raw.prepare('SELECT descargas FROM download_tokens').get().descargas).toBe('{}');
  });

  it('nunca expone URLs de R2', async () => {
    const html = await (await pedir(`/descargas/${token}`)).text();
    expect(html).not.toMatch(/r2\.(dev|cloudflarestorage)/);
    expect(html).not.toContain('de-idea-a-proyecto/1_Guia');
  });
});

describe('/tienda/gracias', () => {
  const estadoApi = async id => (await (await pedir(`/api/ordenes/${id}`)).json());

  it('pagado: "¡Listo! Revisa tu correo" con el correo oculto', async () => {
    const html = await (await pedir(`/tienda/gracias?order=${orden.id}`)).text();
    expect(html).toContain('¡Listo! Revisa tu correo');
    expect(html).toContain('an***@mail.com');
    expect(html).not.toContain('ana@mail.com');
  });

  it('OXXO pendiente: mensaje de pago al realizarlo + sondeo', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'Beto' });
    env.DB.raw.prepare("UPDATE orders SET metodo_pago = 'oxxo' WHERE id = ?").run(o.id);
    const r = await pedir(`/tienda/gracias?order=${o.id}`);
    const html = await r.text();
    expect(html).toContain('Tu pago se confirma al realizarlo; te llegará el correo automáticamente');
    expect(html).toContain('data-vista="pendiente_efectivo"');
    // El script inline lleva el nonce de la CSP
    const nonce = r.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];
    expect(html).toContain(`<script nonce="${nonce}">(function(){`);
    expect(await estadoApi(o.id)).toEqual({ estado: 'pending', vista: 'pendiente_efectivo' });
  });

  it('rechazado: "No se completó el pago" y botón para reintentar', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'Beto' });
    await aplicarPago(env, o.id, { resultado: 'rechazado' });
    const html = await (await pedir(`/tienda/gracias?order=${o.id}`)).text();
    expect(html).toContain('No se completó el pago');
    expect(html).toContain('href="/tienda/de-idea-a-proyecto#comprar"');
  });

  it('volvió de Stripe sin pagar (cancelado=1) → ofrece reintentar', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'Beto' });
    expect(await (await pedir(`/tienda/gracias?order=${o.id}&cancelado=1`)).text()).toContain('No se completó el pago');
  });

  it('tarjeta recién pagada sin webhook todavía → "confirmando"', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'b@mail.com', nombre: 'Beto' });
    expect(await (await pedir(`/tienda/gracias?order=${o.id}`)).text()).toContain('Estamos confirmando tu pago');
  });

  it('orden inexistente → 404; la API no expone datos personales', async () => {
    expect((await pedir('/tienda/gracias?order=nada')).status).toBe(404);
    expect((await pedir('/api/ordenes/00000000-0000-0000-0000-000000000000')).status).toBe(404);
    expect(Object.keys(await estadoApi(orden.id))).toEqual(['estado', 'vista']);
  });

  it('vista() cubre todos los estados', () => {
    expect(vista({ estado: 'paid' })).toBe('pagado');
    expect(vista({ estado: 'refunded' })).toBe('reembolsado');
    expect(vista({ estado: 'pending', metodo_pago: 'customer_balance' })).toBe('pendiente_efectivo');
    expect(vista({ estado: 'pending', metodo_pago: 'oxxo' }, { cancelado: true })).toBe('pendiente_efectivo');
  });
});
