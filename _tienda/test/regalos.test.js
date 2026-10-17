import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { entregar, reenviarEnlace } from '../src/entrega.js';
import { armarCompleto } from '../src/simulador/armar.js';
import { REACTIVOS } from '../src/simulador/banco.js';

let env, correos;
const pedir = (ruta, { metodo = 'GET', body, cookie } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body, redirect: 'manual',
}), env);
// Las ligas del correo al comprador
const ligasDe = c => [...new Set((c.texto.match(/https:\/\/vorka\.mx\/tienda\/regalo\/[a-f0-9]{64}/g) || []))].map(u => u.replace('https://vorka.mx', ''));
const tokenDe = ruta => ruta.split('/').pop();

async function comprarRegalo(cantidad = 2, email = 'mama@mail.com') {
  const o = await crearOrden(env, { items: [{ slug: 'simulador-paa', cantidad }], email, nombre: 'Laura Pérez', regalo: { para: 'Sofía', mensaje: '¡Mucho éxito!' } });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 24900 * cantidad, moneda: 'MXN', metodo_pago: 'card' });
  await entregar(env, o.id);
  return o;
}
const canjear = (token, email = 'sofia@mail.com') => pedir('/api/regalo/canjear', { metodo: 'POST', body: JSON.stringify({ token, nombre: 'Sofía', email, terminos: true }) });

beforeEach(() => {
  correos = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
});

describe('regalar el simulador', () => {
  it('quien compra recibe una liga por regalo (y no obtiene acceso)', async () => {
    const o = await comprarRegalo(3);
    expect(correos).toHaveLength(1);
    expect(correos[0].para).toBe('mama@mail.com');
    expect(correos[0].asunto).toMatch(/3 regalos/);
    const ligas = ligasDe(correos[0]);
    expect(ligas).toHaveLength(3);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM regalos WHERE order_id = ? AND estado = 'pendiente'").get(o.id).n).toBe(3);
    // Sin token de descarga para quien paga: su compra no le da el simulador
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM download_tokens WHERE order_id = ?').get(o.id).n).toBe(0);
    const html = await (await pedir(ligas[0])).text();
    expect(html).toContain('Sofía, tienes');
    expect(html).toContain('de <span>Laura</span>');
    expect(html).toContain('¡Mucho éxito!');
    expect(html).toContain('una sola vez');
  });

  it('cada liga funciona una sola vez y deja el acceso a nombre de quien la abre', async () => {
    await comprarRegalo(1);
    const [liga] = ligasDe(correos[0]);
    const r = await canjear(tokenDe(liga));
    expect(r.status).toBe(200);
    expect((await r.json()).url).toBe('/simulador-paa/');
    const cookie = r.headers.get('set-cookie').split(';')[0];
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo).toMatchObject({ email: 'sofia@mail.com', intentos: { incluidos: 2 } });
    // Le llega su propio acceso por correo
    expect(correos.at(-1).para).toBe('sofia@mail.com');
    expect(correos.at(-1).asunto).toMatch(/Tu regalo está activo/);
    // Segundo uso (otra persona): rechazado
    const otra = await canjear(tokenDe(liga), 'amigo@mail.com');
    expect(otra.status).toBe(410);
    expect((await otra.json()).error).toMatch(/una sola vez/);
    expect(await (await pedir(liga)).text()).toContain('Este regalo ya se abrió');
    // Quien pagó no tiene acceso con su correo
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM orders WHERE email = 'mama@mail.com' AND regalo = 0").get().n).toBe(0);
  });

  it('reenviar cambia las ligas no usadas (las viejas dejan de servir) y conserva las canjeadas', async () => {
    const o = await comprarRegalo(2);
    const [a, b] = ligasDe(correos[0]);
    await canjear(tokenDe(a));
    await reenviarEnlace(env, o.id);
    const nuevas = ligasDe(correos.at(-1));
    expect(nuevas).toHaveLength(1);
    expect((await canjear(tokenDe(b), 'x@mail.com')).status).toBe(410);
    expect((await canjear(tokenDe(nuevas[0]), 'x@mail.com')).status).toBe(200);
  });

  it('un reembolso apaga las ligas pendientes y el acceso de quien ya canjeó', async () => {
    const o = await comprarRegalo(2);
    const [a, b] = ligasDe(correos[0]);
    const r = await canjear(tokenDe(a));
    const cookie = r.headers.get('set-cookie').split(';')[0];
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    expect((await canjear(tokenDe(b), 'y@mail.com')).status).toBe(410);
    expect((await pedir('/api/simulador-paa/banco', { cookie })).status).toBe(401);
  });

  it('el checkout acepta regalos con cantidad y rechaza regalar productos no regalables', async () => {
    const ok = await pedir('/api/checkout', { metodo: 'POST', body: JSON.stringify({ slug: 'de-idea-a-proyecto', regalo: true, cantidad: 2, nombre: 'Ana', email: 'a@mail.com', terminos: true }) });
    expect(ok.status).toBe(400);
    expect((await ok.json()).error).toMatch(/no se puede regalar/);
  });

  it('la ficha del producto muestra "Para regalar" y la tienda ofrece regalarlo', async () => {
    const ficha = await (await pedir('/tienda/simulador-paa/?regalo=1')).text();
    expect(ficha).toContain('Para regalar');
    expect(ficha).toMatch(/value="regalo" checked/);
    const tienda = await (await pedir('/tienda/')).text();
    expect(tienda).toContain('/simulador-paa/?regalo=1#comprar');
  });
});

describe('banco ampliado y simulacros sin repetir', () => {
  it('el banco tiene más de 230 reactivos', () => {
    expect(REACTIVOS.length).toBeGreaterThan(230);
  });

  it('los primeros tres simulacros completos no repiten preguntas', () => {
    const vistos = new Set();
    for (let k = 0; k < 3; k++) {
      const ids = armarCompleto(Math.random, vistos).flat();
      expect(ids.filter(id => vistos.has(id))).toEqual([]);
      ids.forEach(id => vistos.add(id));
    }
  });

  it('el servidor arma el siguiente simulacro con preguntas nuevas', async () => {
    const o = await crearOrden(env, { items: [{ slug: 'simulador-paa' }], email: 'ana@mail.com', nombre: 'Ana' });
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 24900, moneda: 'MXN', metodo_pago: 'card' });
    const { cookieAcceso } = await import('../src/simulador/index.js');
    const cookie = (await cookieAcceso(env, o.id, Date.now() + 864e5)).split(';')[0];
    const a = await (await pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie })).json();
    await pedir('/api/simulador-paa/abandonar', { metodo: 'POST', cookie, body: JSON.stringify({ id: a.id }) });
    const b = await (await pedir('/api/simulador-paa/iniciar', { metodo: 'POST', cookie })).json();
    const primero = new Set(a.items.flat());
    expect(b.items.flat().filter(id => primero.has(id))).toEqual([]);
    const yo = await (await pedir('/api/simulador-paa/yo', { cookie })).json();
    expect(yo.vistos.length).toBe(92);
  });
});

describe('cortesías (accesos gratis desde el panel)', () => {
  it('crea ligas gratis de un solo uso que dan acceso, sin contar como venta', async () => {
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env); A.env = env;
    const t = await A.crearCortesias({ product_id: 'prod_simulador_paa', cantidad: 3, para: '', mensaje: 'Para tu examen', nota: 'Prepa Celaya' });
    expect(t.ligas).toHaveLength(3);
    expect(correos).toHaveLength(0);
    const html = await (await pedir(t.ligas[0].replace('https://vorka.mx', ''))).text();
    expect(html).toContain('de <span>Vorka México</span>');
    const r = await canjear(tokenDe(t.ligas[0]), 'alumna@mail.com');
    expect(r.status).toBe(200);
    expect((await canjear(tokenDe(t.ligas[0]), 'otra@mail.com')).status).toBe(410);
    const lista = await A.cortesias();
    expect(lista[0]).toMatchObject({ cantidad: 3, canjeadas: 1, pendientes: 2, quienes: 'alumna@mail.com', nota: 'Prepa Celaya' });
    expect((await A.resumen({})).ventas).toBe(0);
    // Apagar las que no se usaron; reenviar una cortesía no hace nada
    expect((await A.revocarCortesias(t.id)).revocadas).toBe(2);
    expect((await canjear(tokenDe(t.ligas[1]), 'z@mail.com')).status).toBe(410);
    await reenviarEnlace(env, t.id);
    expect(correos.filter(c => c.para === 'hola@vorka.mx')).toHaveLength(0);
  });

  it('no deja crear cortesías de productos no regalables', async () => {
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env); A.env = env;
    await expect(A.crearCortesias({ product_id: 'prod_simulador_paa_intento', cantidad: 1 })).rejects.toThrow(/no se puede regalar/);
  });
});
