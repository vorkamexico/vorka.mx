import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken } from '../src/entrega.js';

function r2() {
  const m = new Map();
  return {
    m,
    async put(k, v, o) { const buf = v instanceof ReadableStream ? await new Response(v).arrayBuffer() : v; m.set(k, { buf, o }); return { size: buf.byteLength ?? buf.length }; },
    async get(k) { const x = m.get(k); return x ? { body: new Blob([x.buf]).stream(), size: x.buf.byteLength, httpMetadata: x.o?.httpMetadata } : null; },
    async head(k) { return m.has(k) ? { size: 1 } : null; },
    async delete(k) { m.delete(k); },
  };
}

let env, A;
const pagar = async (email = 'ana@mail.com', ref) => {
  const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email, nombre: 'Ana López', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 27900, moneda: 'MXN', metodo_pago: 'oxxo', provider_payment_id: 'pi_123' });
  return o;
};
const archivo = (txt = 'hola') => ({ nombre: 'Guía Única.pdf', tipo: 'application/pdf', cuerpo: new Blob([txt]).stream(), tamano: txt.length });

beforeEach(() => {
  env = { DB: d1(), PRODUCTOS: r2(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('ANA', 'Ana', 20);");
  A = new Admin({}, env);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"em"}')));
});
afterEach(() => vi.unstubAllGlobals());

describe('productos desde el panel (sin código)', () => {
  it('crea un producto con slug automático, precio en pesos y contenido', async () => {
    const p = await A.guardarProducto({ nombre: 'Guía de Liderazgo Juvenil', precio: '149.50', descripcion_corta: 'Para jóvenes', contenido: {
      titular: 'Lidera desde hoy', incluye: [{ titulo: 'PDF', texto: '40 páginas' }], pasos: [{ titulo: 'Paso 1' }], para_quien: ['Jóvenes'], faq: [{ p: '¿Sirve?', r: 'Sí <b>mucho</b>\nde verdad' }] } });
    expect(p).toMatchObject({ slug: 'guia-de-liderazgo-juvenil', precio_centavos: 14950, activo: false });
    expect(p.contenido.faq[0].r).toBe('Sí &lt;b&gt;mucho&lt;/b&gt;<br>de verdad');
    expect((await A.producto(p.id)).contenido.faq[0].r).toBe('Sí <b>mucho</b>\nde verdad');
  });

  it('el slug no se repite', async () => {
    const a = await A.guardarProducto({ nombre: 'Kit Uno', precio: 10 });
    const b = await A.guardarProducto({ nombre: 'Kit Uno', precio: 10 });
    expect([a.slug, b.slug]).toEqual(['kit-uno', 'kit-uno-2']);
  });

  it('no se puede poner a la venta sin archivos', async () => {
    await expect(A.guardarProducto({ nombre: 'Kit Vacío', precio: 10, activo: true })).rejects.toThrow(/al menos un archivo/);
  });

  it('subir archivo → queda en R2 privado y en la lista; luego se puede activar y aparece en la tienda', async () => {
    let p = await A.guardarProducto({ nombre: 'Kit Nuevo', precio: 99 });
    p = await A.subirArchivo(p.id, archivo());
    expect(p.r2_keys).toEqual([{ key: 'kit-nuevo/Guia_Unica.pdf', nombre: 'Guía Única' }]);
    expect(env.PRODUCTOS.m.has('kit-nuevo/Guia_Unica.pdf')).toBe(true);
    p = await A.guardarProducto({ id: p.id, nombre: p.nombre, precio: 99, activo: true, archivos: [{ key: p.r2_keys[0].key, nombre: 'La guía' }] });
    expect(p.activo).toBe(true);
    expect(p.r2_keys[0].nombre).toBe('La guía');
    const html = await (await worker.fetch(new Request('https://vorka.mx/tienda/'), env)).text();
    expect(html).toContain('/tienda/kit-nuevo/');
    expect(html).toContain('$99 MXN');
  });

  it('cambiar precio desde el panel cambia lo que cobra el checkout', async () => {
    const p = (await A.productos()).find(x => x.slug === 'de-idea-a-proyecto');
    for (const a of p.r2_keys) env.PRODUCTOS.m.set(a.key, { buf: new Uint8Array(1) });
    await A.guardarProducto({ id: p.id, nombre: p.nombre, precio: 199, activo: true });
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'a@b.mx', nombre: 'A' });
    expect(o.monto_centavos).toBe(19900);
  });

  it('archivos ajenos no se pueden colar al renombrar', async () => {
    const p = (await A.productos())[0];
    await expect(A.guardarProducto({ id: p.id, nombre: p.nombre, precio: 279, archivos: [{ key: 'otro/secreto.pdf', nombre: 'x' }] })).rejects.toThrow(/ya no existe/);
  });

  it('archivo vacío o demasiado grande → error claro', async () => {
    const p = (await A.productos())[0];
    await expect(A.subirArchivo(p.id, { ...archivo(), tamano: 0 })).rejects.toThrow(/vacío/);
    await expect(A.subirArchivo(p.id, { ...archivo(), tamano: 200 * 1048576 })).rejects.toThrow(/100 MB/);
  });

  it('quitar el último archivo de un producto activo no se permite', async () => {
    let p = await A.guardarProducto({ nombre: 'Kit X', precio: 1 });
    p = await A.subirArchivo(p.id, archivo());
    p = await A.guardarProducto({ id: p.id, nombre: 'Kit X', precio: 1, activo: true });
    await expect(A.quitarArchivo(p.id, p.r2_keys[0].key)).rejects.toThrow(/Desactívalo/);
  });

  it('portada: se sube, se sirve en /tienda/img y solo acepta imágenes', async () => {
    const p = (await A.productos())[0];
    await expect(A.subirPortada(p.id, { tipo: 'application/pdf', cuerpo: new Blob(['x']).stream(), tamano: 1 })).rejects.toThrow(/JPG, PNG o WebP/);
    const q = await A.subirPortada(p.id, { tipo: 'image/png', cuerpo: new Blob(['png']).stream(), tamano: 3 });
    expect(q.imagen).toMatch(/^\/tienda\/img\/portadas\/de-idea-a-proyecto-[a-z0-9]+\.png$/);
    const r = await worker.fetch(new Request(`https://vorka.mx${q.imagen}`), env);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('image/png');
    // Los archivos de venta nunca salen por la ruta de imágenes
    expect((await worker.fetch(new Request('https://vorka.mx/tienda/img/de-idea-a-proyecto/1.pdf'), env)).status).toBe(404);
  });

  it('borrar solo productos sin órdenes', async () => {
    await pagar();
    const p = (await A.productos())[0];
    expect(p.vendidos).toBe(1);
    await expect(A.borrarProducto(p.id)).rejects.toThrow(/desactívalo/);
    const n = await A.guardarProducto({ nombre: 'Borrable', precio: 1 });
    await A.borrarProducto(n.id);
    expect((await A.productos()).some(x => x.id === n.id)).toBe(false);
  });
});

describe('órdenes', () => {
  it('lista con filtros por estado, afiliado, producto y búsqueda', async () => {
    await pagar('ana@mail.com', 'ANA');
    await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'beto@mail.com', nombre: 'Beto' });
    expect((await A.ordenes({})).total).toBe(2);
    expect((await A.ordenes({ estado: 'paid' })).ordenes.map(o => o.email)).toEqual(['ana@mail.com']);
    expect((await A.ordenes({ afiliado: 'ana' })).total).toBe(1);
    expect((await A.ordenes({ q: 'beto' })).total).toBe(1);
    expect((await A.ordenes({ producto: 'prod_de_idea_a_proyecto' })).total).toBe(2);
    expect((await A.ordenes({ estado: 'basura', desde: 'x' })).total).toBe(2); // filtros inválidos se ignoran
  });

  it('detalle, reenviar y revocar', async () => {
    const o = await pagar();
    await crearToken(env, o.id);
    let d = await A.orden(o.id);
    expect(d.items[0].slug).toBe('de-idea-a-proyecto');
    expect(d.tokens).toHaveLength(1);
    await A.reenviar(o.id);
    d = await A.orden(o.id);
    expect(d.tokens).toHaveLength(2);
    expect((await A.revocar(o.id)).revocados).toBe(2);
    expect((await A.orden(o.id)).tokens.every(t => t.revocado)).toBe(true);
  });

  it('no reenvía a órdenes sin pagar', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'x@mail.com', nombre: 'X' });
    await expect(A.reenviar(o.id)).rejects.toThrow(/pagadas/);
  });

  it('CSV para el contador: fecha, orden, correo, monto, método e ID de pago', async () => {
    const o = await pagar();
    const hoy = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
    const csv = await A.exportarCSV({ desde: hoy, hasta: hoy });
    const [enc, fila] = csv.replace('﻿', '').trim().split('\r\n');
    expect(enc).toBe('fecha,orden,nombre,correo,producto,monto,moneda,metodo_pago,id_pago_stripe,estado');
    expect(fila).toContain(o.id);
    expect(fila).toContain('ana@mail.com,');
    expect(fila).toContain(',279.00,MXN,oxxo,pi_123,pagada');
    expect(await A.exportarCSV({ desde: '2020-01-01', hasta: '2020-01-31' })).toBe('﻿fecha,orden,nombre,correo,producto,monto,moneda,metodo_pago,id_pago_stripe,estado\r\n');
    await expect(A.exportarCSV({ desde: 'x', hasta: hoy })).rejects.toThrow(/fechas/);
  });

  it('resumen del mes', async () => {
    await pagar();
    const r = await A.resumen({});
    expect(r).toMatchObject({ ventas: 1, monto_centavos: 27900 });
    expect(r.embudo[0]).toMatchObject({ nombre: expect.any(String) });
  });
});

describe('afiliados', () => {
  it('alta, edición y código repetido', async () => {
    await A.guardarAfiliado({ code: 'beto-2026', nombre: 'Beto', email: 'Beto@Mail.com', comision_pct: '15', nuevo: true });
    await expect(A.guardarAfiliado({ code: 'BETO-2026', nombre: 'Otro', comision_pct: 10, nuevo: true })).rejects.toThrow(/ya existe/);
    await A.guardarAfiliado({ code: 'BETO-2026', nombre: 'Beto R.', comision_pct: 12, activo: false });
    const b = (await A.afiliados()).find(a => a.code === 'BETO-2026');
    expect(b).toMatchObject({ nombre: 'Beto R.', comision_pct: 12, activo: false, email: null });
    await expect(A.guardarAfiliado({ code: 'mal código!', nombre: 'X', comision_pct: 1 })).rejects.toThrow(/letras, números/);
  });

  it('reporte por mes: ventas, monto y comisión con el % de cada venta', async () => {
    await pagar('a@mail.com', 'ANA');
    await A.guardarAfiliado({ code: 'ANA', nombre: 'Ana', comision_pct: 50 }); // cambiar el % no altera ventas pasadas
    await pagar('b@mail.com', 'ANA');
    const mes = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 7);
    const r = await A.reporteAfiliados({ mes });
    expect(r.afiliados[0]).toMatchObject({ code: 'ANA', ventas: 2, monto_centavos: 55800, comision_centavos: 5580 + 13950 });
    expect(r.total.comision_centavos).toBe(19530);
  });
});

describe('editar sin contenido', () => {
  it('guardar solo precio conserva la página de venta', async () => {
    const p = (await A.productos())[0];
    await A.guardarProducto({ id: p.id, nombre: p.nombre, precio: 300 });
    expect((await A.producto(p.id)).contenido.titular).toBe(p.contenido.titular);
  });
});

describe('archivos faltantes', () => {
  it('no deja activar si un archivo de la lista no está en R2', async () => {
    const p = (await A.productos()).find(x => x.slug === 'de-idea-a-proyecto'); // el seed trae archivos de ejemplo que no existen
    await expect(A.guardarProducto({ id: p.id, nombre: p.nombre, precio: 279, activo: true })).rejects.toThrow(/Falta subir/);
  });
});
