// «Lo que sigue» después de pagar (src/siguiente.js): sugerencias según lo que compró y un cupón de 20 % para el segundo
// producto de Educación, en la página de gracias y en el correo de acceso. Solo compras pagadas con dinero.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { entregar } from '../src/entrega.js';
import { siguienteDe, PCT_SIGUIENTE } from '../src/siguiente.js';

let env, correos;
const q = (sql, ...p) => env.DB.raw.prepare(sql).all(...p);
function orden({ slugs = ['simulador-paa-practica'], proveedor = 'stripe', monto = 19900, regalo = 0, estado = 'paid' } = {}) {
  const id = crypto.randomUUID();
  env.DB.raw.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, estado, proveedor, paid_at, regalo) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, 'ana@correo.mx', 'Ana Ruiz', monto, estado, proveedor, new Date().toISOString(), regalo);
  for (const s of slugs) env.DB.raw.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos) SELECT ?, id, nombre, precio_centavos FROM products WHERE slug = ?').run(id, s);
  return id;
}
const items = id => q('SELECT p.slug, p.contenido FROM order_items i JOIN products p ON p.id = i.product_id WHERE i.order_id = ?', id);
const leer = id => q('SELECT * FROM orders WHERE id = ?', id)[0];

beforeEach(() => {
  correos = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 'x'.repeat(32), CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
});

describe('lo que sigue', () => {
  it('simulador PAA: otro examen con cupón y asesoría; el cupón es de un uso, 20 % y solo Educación', async () => {
    const id = orden();
    const s = await siguienteDe(env, leer(id), items(id));
    expect(s.cupon.codigo).toMatch(/^REGALO-/);
    expect(s.sugerencias.map(x => x.titulo)).toEqual(['¿Vas a presentar en otra universidad?', 'Una asesoría con Brandon']);
    expect(s.sugerencias[0].href).toBe(`/simulador-exani-ii/universidades/?cupon=${s.cupon.codigo}`);
    const c = q('SELECT * FROM cupones_regalo WHERE codigo = ?', s.cupon.codigo)[0];
    expect(c).toMatchObject({ tipo: 'pct', pct: PCT_SIGUIENTE, alcance: 'linea', linea: 'examenes', max_usos: 1, lote: `siguiente-${id}` });
  });
  it('un solo cupón por orden aunque se abra la página varias veces', async () => {
    const id = orden();
    const a = await siguienteDe(env, leer(id), items(id)), b = await siguienteDe(env, leer(id), items(id));
    expect(b.cupon.codigo).toBe(a.cupon.codigo);
    expect(q('SELECT COUNT(*) n FROM cupones_regalo WHERE lote = ?', `siguiente-${id}`)[0].n).toBe(1);
  });
  it('test vocacional: sugiere la evaluación de liderazgo con su precio real', async () => {
    const id = orden({ slugs: ['test-vocacional'], monto: 7900 });
    const s = await siguienteDe(env, leer(id), items(id));
    const lid = q("SELECT nombre, precio_centavos FROM products WHERE slug = 'evaluacion-liderazgo'")[0];
    expect(s.sugerencias[0]).toMatchObject({ titulo: lid.nombre, precio: lid.precio_centavos });
  });
  it('nada en regalos, cortesías, órdenes sin pagar, simulacros adicionales ni productos que no son de Educación', async () => {
    for (const o of [{ regalo: 1 }, { proveedor: 'cortesia', monto: 0 }, { estado: 'pending' }, { slugs: ['simulador-paa-intento'] }, { slugs: ['de-idea-a-proyecto'] }]) {
      const id = orden(o);
      expect(await siguienteDe(env, leer(id), items(id))).toBeNull();
    }
    expect(q("SELECT COUNT(*) n FROM cupones_regalo WHERE lote LIKE 'siguiente-%'")[0].n).toBe(0);
  });
  it('va en la página de gracias y en el correo de acceso', async () => {
    const id = orden();
    const html = await (await worker.fetch(new Request(`https://vorka.mx/tienda/gracias?order=${id}`), env)).text();
    expect(html).toContain('Lo que sigue');
    const codigo = q('SELECT codigo FROM cupones_regalo WHERE lote = ?', `siguiente-${id}`)[0].codigo;
    expect(html).toContain(codigo);
    expect(await entregar(env, id)).toBe(true);
    const c = correos.at(-1);
    expect(c.html).toContain(codigo);
    expect(c.texto).toContain('https://vorka.mx/simulador-exani-ii/universidades/?cupon=' + codigo);
  });
});

describe('medición del ticket (tablero de Vorka OS)', () => {
  it('ticket promedio, compras con varios productos, órdenes creadas, abandonos y regresos de la pasarela', async () => {
    const { tablero } = await import('../src/admin.js');
    orden({ monto: 20000 });
    orden({ slugs: ['simulador-paa-practica', 'test-vocacional'], monto: 30000 });
    orden({ estado: 'failed' });
    const p = orden({ estado: 'pending' });
    await worker.fetch(new Request(`https://vorka.mx/tienda/gracias?order=${p}&cancelado=1`), env);
    await worker.fetch(new Request(`https://vorka.mx/tienda/gracias?order=${p}&cancelado=1`), env);
    orden({ proveedor: 'cortesia', monto: 0 });
    const t = (await tablero(env)).ticket;
    expect(t).toMatchObject({ ventas: 2, promedio_centavos: 25000, varios: 1, creadas: 4, se_quedaron: 1, volvieron: 1 });
  });
});
