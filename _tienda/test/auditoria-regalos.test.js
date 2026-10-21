// Auditoría de regalos (octubre 2026): cada prueba falla con el código anterior y pasa con el arreglo.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { entregar, reenviarEnlace, crearToken } from '../src/entrega.js';
import { validarToken } from '../src/descargas.js';

let env, correos;
const pedir = (ruta, { metodo = 'GET', body, tipo = 'application/json' } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { ...(body ? { 'content-type': tipo } : {}), 'cf-connecting-ip': '9.9.9.9' }, body, redirect: 'manual',
}), env, { waitUntil: () => {} });
const ligasDe = c => [...new Set((c.texto.match(/https:\/\/vorka\.mx\/tienda\/regalo\/[a-f0-9]{64}/g) || []))].map(u => u.split('/').pop());
const canjear = (token, email = 'sofia@mail.com') => pedir('/api/regalo/canjear', { metodo: 'POST', body: JSON.stringify({ token, nombre: 'Sofía', email, terminos: true }) });
const regalos = id => env.DB.raw.prepare('SELECT id, product_id, estado FROM regalos WHERE order_id = ? ORDER BY id').all(id);
const admin = () => { const A = new Admin({}, env); A.env = env; return A; };

async function comprar(items, email = 'mama@mail.com') {
  const o = await crearOrden(env, { items, email, nombre: 'Laura Pérez', regalo: { para: 'Sofía', mensaje: 'Suerte' } });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  await entregar(env, o.id);
  return o;
}

beforeEach(() => {
  correos = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  // La guía descargable también se puede regalar (para probar carritos con varios regalables y descargas de regalo)
  env.DB.raw.exec(`UPDATE products SET activo = 1; UPDATE products SET contenido = json_set(contenido, '$.regalable', json('true')) WHERE id = 'prod_de_idea_a_proyecto'`);
});

describe('regalos · auditoría', () => {
  it('1. el reenvío público (/descargas/reenviar) no cambia ni apaga las ligas ya enviadas', async () => {
    const o = await comprar([{ slug: 'simulador-paa', cantidad: 2 }]);
    const [a, b] = ligasDe(correos[0]);
    const r = await pedir('/descargas/reenviar', { metodo: 'POST', body: new URLSearchParams({ email: 'mama@mail.com' }).toString(), tipo: 'application/x-www-form-urlencoded' });
    expect(r.status).toBe(200);
    // Las dos ligas originales siguen sirviendo; no se crearon nuevas
    expect(regalos(o.id).map(x => x.estado)).toEqual(['pendiente', 'pendiente']);
    expect((await canjear(a)).status).toBe(200);
    expect((await canjear(b, 'beto@mail.com')).status).toBe(200);
    // A quien compró le llega un aviso sin ligas nuevas, con soporte para cambiarlas
    const aviso = correos.find(c => c.asunto === 'Tus ligas de regalo');
    expect(aviso.para).toBe('mama@mail.com');
    expect(ligasDe(aviso)).toHaveLength(0);
    expect(aviso.texto).toContain('hola@vorka.mx');
    // El panel sí puede cambiarlas
    const o2 = await comprar([{ slug: 'simulador-paa', cantidad: 1 }], 'tia@mail.com');
    const [vieja] = ligasDe(correos.at(-1));
    await reenviarEnlace(env, o2.id);
    expect((await canjear(vieja, 'x@mail.com')).status).toBe(410);
  });

  it('2. el canje es todo o nada: si falla la orden de $0, la liga sigue pendiente', async () => {
    const o = await comprar([{ slug: 'simulador-paa', cantidad: 1 }]);
    const [liga] = ligasDe(correos[0]);
    const batch = env.DB.batch.bind(env.DB);
    let fallar = true;
    env.DB.batch = async stmts => {
      if (fallar) { fallar = false; return batch([...stmts, env.DB.prepare('INSERT INTO tabla_que_no_existe VALUES (1)')]); }
      return batch(stmts);
    };
    const r = await canjear(liga);
    expect(r.status).toBe(500);
    expect(regalos(o.id)[0].estado).toBe('pendiente');
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM orders WHERE proveedor = 'regalo'").get().n).toBe(0);
    // Al reintentar, se canjea bien
    expect((await canjear(liga)).status).toBe(200);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM orders WHERE proveedor = 'regalo'").get().n).toBe(1);
  });

  it('3. reenviar un carrito con varios productos regalables cuenta lo canjeado por producto', async () => {
    const o = await comprar([{ slug: 'simulador-paa', cantidad: 1 }, { slug: 'de-idea-a-proyecto', cantidad: 2 }]);
    const ids = regalos(o.id);
    expect(ids.map(x => x.product_id)).toEqual(['prod_simulador_paa', 'prod_de_idea_a_proyecto', 'prod_de_idea_a_proyecto']);
    // Se canjea una de la guía (la segunda liga del correo)
    const ligas = ligasDe(correos[0]);
    expect((await canjear(ligas[1])).status).toBe(200);
    await reenviarEnlace(env, o.id);
    const pendientes = regalos(o.id).filter(x => x.estado === 'pendiente').map(x => x.product_id).sort();
    // Queda una liga para el simulador y una para la guía (antes: dos de la guía y el simulador perdido)
    expect(pendientes).toEqual(['prod_de_idea_a_proyecto', 'prod_simulador_paa']);
  });

  it('4. el panel no puede volver a prender una liga reemplazada por un reenvío (dos ligas para una unidad)', async () => {
    const o = await comprar([{ slug: 'simulador-paa', cantidad: 1 }]);
    await reenviarEnlace(env, o.id);
    const [vieja, nueva] = regalos(o.id);
    expect([vieja.estado, nueva.estado]).toEqual(['revocado', 'pendiente']);
    await expect(admin().prenderLiga(vieja.id)).rejects.toThrow(/más nueva/);
    expect(regalos(o.id).filter(x => x.estado === 'pendiente')).toHaveLength(1);
    // Si se apaga la nueva, la vieja sí se puede volver a prender
    await admin().apagarLiga(nueva.id);
    await expect(admin().prenderLiga(vieja.id)).resolves.toEqual({ ok: true });
  });

  it('5. quien recibió un descargable de regalo pierde las descargas si la compra original se reembolsa', async () => {
    const o = await comprar([{ slug: 'de-idea-a-proyecto', cantidad: 1 }]);
    const [liga] = ligasDe(correos[0]);
    expect((await canjear(liga, 'maestra@mail.com')).status).toBe(200);
    const canje = env.DB.raw.prepare("SELECT id FROM orders WHERE proveedor = 'regalo'").get();
    const { token } = await crearToken(env, canje.id);
    expect((await validarToken(env, token)).ok).toBe(true);
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    expect(await validarToken(env, token)).toMatchObject({ ok: false, motivo: 'revocado' });
  });
});
