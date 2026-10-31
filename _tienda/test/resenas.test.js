// Reseñas de compradores verificados (migración 0057, src/resenas.js): el correo que las pide (una sola vez, 7 días después
// en descargables y 14 en accesos), la liga única /tienda/resena/<token>, una por orden y producto (editable hasta que se
// aprueba), la moderación de Vorka OS (Admin), la página del producto y su JSON-LD (solo aprobadas), el escape de HTML y ARCO.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { pedirResenas, validarResena, DIAS_DESCARGA, DIAS_ACCESO, VENTANA_DIAS } from '../src/resenas.js';

const DIA = 864e5;
const AHORA = new Date('2026-11-20T18:00:00.000Z');
let env, A, correos, falla;
const q = (sql, ...p) => env.DB.raw.prepare(sql).all(...p);
const prod = slug => env.DB.raw.prepare('SELECT id FROM products WHERE slug = ?').get(slug).id;

// Una orden pagada hace `dias` días con esos productos
function orden({ dias = DIAS_DESCARGA + 1, slugs = ['de-idea-a-proyecto'], email = 'mariana@correo.mx', nombre = 'Mariana López', estado = 'paid', regalo = 0, monto = 27900 } = {}) {
  const id = crypto.randomUUID();
  const paid = new Date(AHORA.getTime() - dias * DIA).toISOString();
  env.DB.raw.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, estado, paid_at, created_at, regalo) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, email, nombre, monto, estado, estado === 'paid' || estado === 'refunded' ? paid : null, paid, regalo);
  for (const s of slugs) env.DB.raw.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos) SELECT ?, id, nombre, precio_centavos FROM products WHERE slug = ?').run(id, s);
  return id;
}
const ligas = c => [...c.texto.matchAll(/https:\/\/vorka\.mx\/tienda\/resena\/([a-f0-9]{64})(?!\/baja)/g)].map(m => m[1]);
const pedir = (ruta, init = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', ...init }), env);
const mandar = (token, campos) => pedir(`/tienda/resena/${token}`, { method: 'POST', body: new URLSearchParams(campos) });
const ld = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m => [].concat(JSON.parse(m[1])));
const producto = html => ld(html).find(x => x['@type'] === 'Product');

// Pide la reseña de una orden recién creada y devuelve su token
async function tokenDe(opciones = {}) {
  orden(opciones);
  const antes = correos.length;
  await pedirResenas(env, AHORA);
  expect(correos.length).toBe(antes + 1);
  return ligas(correos.at(-1))[0];
}
async function escrita(campos = {}, opciones = {}) {
  const t = await tokenDe(opciones);
  const r = await mandar(t, { estrellas: '5', texto: 'Me sirvió muchísimo.', nombre: 'Mariana, Celaya', ...campos });
  expect(r.status).toBe(303);
  return { token: t, fila: q('SELECT * FROM resenas ORDER BY id DESC LIMIT 1')[0] };
}

beforeEach(() => {
  correos = []; falla = false;
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', CORREO: { async enviar(c) { if (falla) throw new Error('Resend 500'); correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  A = new Admin({}, env);
});

describe('correo que pide la reseña (cron)', () => {
  it('sale una sola vez por orden, 7 días después en descargables, con una liga por producto', async () => {
    const id = orden();
    expect(await pedirResenas(env, AHORA)).toMatchObject({ enviadas: 1 });
    expect(correos).toHaveLength(1);
    const c = correos[0];
    expect(c.para).toBe('mariana@correo.mx');
    expect(c.idempotencia).toBe(`resena-${id}`);
    expect(c.asunto).toContain('¿Qué te pareció');
    expect(c.html).toContain('Hola, Mariana:');
    expect(c.html).toContain('Vorka México');
    expect(c.texto).toMatch(/\/tienda\/resena\/[a-f0-9]{64}\/baja/);
    expect(ligas(c)).toHaveLength(1);
    // Solo se guarda el hash del token
    const f = q('SELECT * FROM resenas')[0];
    expect(f).toMatchObject({ order_id: id, estado: 'sin_escribir', email: 'mariana@correo.mx' });
    expect(f.token_hash).not.toBe(ligas(c)[0]);
    // Las siguientes corridas ya no mandan nada
    await pedirResenas(env, AHORA);
    await pedirResenas(env, new Date(AHORA.getTime() + 3 * DIA));
    expect(correos).toHaveLength(1);
  });

  it('respeta los tiempos: antes de los 7 días no; accesos y suscripciones a los 14; nunca a órdenes viejas', async () => {
    orden({ dias: DIAS_DESCARGA - 1, email: 'pronto@correo.mx' });
    orden({ dias: DIAS_DESCARGA + 1, slugs: ['simulador-paa-completo'], email: 'sim@correo.mx' });
    orden({ dias: DIAS_DESCARGA + VENTANA_DIAS + 1, email: 'vieja@correo.mx' });
    await pedirResenas(env, AHORA);
    expect(correos).toHaveLength(0);
    await pedirResenas(env, new Date(AHORA.getTime() + (DIAS_ACCESO - DIAS_DESCARGA) * DIA));
    expect(correos.map(c => c.para).sort()).toEqual(['pronto@correo.mx', 'sim@correo.mx']);
  });

  it('no se pide si se reembolsó, si fue para regalar, si no se cobró, si se dio de baja o si es un complemento', async () => {
    orden({ estado: 'refunded', email: 'a@correo.mx' });
    orden({ regalo: 1, email: 'b@correo.mx' });
    orden({ monto: 0, email: 'c@correo.mx' });
    orden({ slugs: ['simulador-paa-intento'], email: 'd@correo.mx' });
    orden({ email: 'e@correo.mx' });
    env.DB.raw.prepare('INSERT INTO resenas_bajas (email) VALUES (?)').run('e@correo.mx');
    await pedirResenas(env, AHORA);
    expect(correos).toHaveLength(0);
  });

  it('a la misma persona no le pide dos veces el mismo producto ni más de un correo por semana', async () => {
    orden({ dias: 9 });
    orden({ dias: 8 });
    await pedirResenas(env, AHORA);
    expect(correos).toHaveLength(1);
    await pedirResenas(env, new Date(AHORA.getTime() + 8 * DIA));
    expect(correos).toHaveLength(1);          // la segunda orden es del mismo producto (y ya salió de la ventana)
  });

  it('si el correo falla no queda marcada: se reintenta en la siguiente corrida', async () => {
    orden();
    falla = true;
    expect(await pedirResenas(env, AHORA)).toMatchObject({ enviadas: 0, fallidas: 1 });
    expect(q('SELECT * FROM resenas')).toHaveLength(0);
    falla = false;
    await pedirResenas(env, new Date(AHORA.getTime() + 3600e3));
    expect(correos).toHaveLength(1);
  });

  it('el cron de cada hora lo corre', async () => {
    orden({ dias: 8 });
    const espera = [], ctx = { waitUntil: p => espera.push(p) };
    await worker.scheduled({ scheduledTime: Date.now(), cron: '17 * * * *' }, env, ctx);
    await Promise.all(espera);
    // la orden es relativa a AHORA (noviembre); con la hora real del cron puede o no tocar: solo debe correr sin tronar
    expect(espera.length).toBeGreaterThan(0);
  });
});

describe('/tienda/resena/<token>', () => {
  it('liga inválida o desconocida → 404 sin indexar', async () => {
    for (const t of ['abc', 'x'.repeat(64), 'a'.repeat(64)]) {
      const r = await pedir(`/tienda/resena/${t}`);
      expect(r.status).toBe(404);
      expect(await r.text()).toContain('<meta name="robots" content="noindex, nofollow">');
    }
    expect((await mandar('a'.repeat(64), { estrellas: '5', nombre: 'Ana' })).status).toBe(404);
  });

  it('formulario accesible, sin indexar, con el producto', async () => {
    const t = await tokenDe();
    const r = await pedir(`/tienda/resena/${t}`);
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(h).toContain('<fieldset class="rs-estrellas"');
    expect(h).toContain('<legend>¿Cuántas estrellas le das?');
    expect(h.match(/<input type="radio" id="est-\d" name="estrellas"/g)).toHaveLength(5);
    expect(h).toContain('<label for="rs-nombre">');
    expect(h).toContain('se publiquen en la página del producto');
  });

  it('una por orden y producto: se edita mientras espera aprobación y ya no después', async () => {
    const { token, fila } = await escrita();
    expect(fila).toMatchObject({ estado: 'pendiente', estrellas: 5, nombre_publico: 'Mariana, Celaya', texto: 'Me sirvió muchísimo.' });
    expect(await (await pedir(`/tienda/resena/${token}?gracias=1`)).text()).toContain('¡Gracias por tu reseña!');
    expect((await mandar(token, { estrellas: '4', texto: '', nombre: 'Mariana L.' })).status).toBe(303);
    expect(q('SELECT estrellas, texto, nombre_publico, estado FROM resenas')).toEqual([{ estrellas: 4, texto: null, nombre_publico: 'Mariana L.', estado: 'pendiente' }]);
    await A.decidirResena(fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    const r = await mandar(token, { estrellas: '1', nombre: 'Otra' });
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('ya está publicada');
    expect(q('SELECT estrellas, nombre_publico FROM resenas')).toEqual([{ estrellas: 4, nombre_publico: 'Mariana L.' }]);
    // La base tampoco deja dos de la misma orden y producto
    expect(() => env.DB.raw.prepare('INSERT INTO resenas (token_hash, order_id, product_id, email) VALUES (?,?,?,?)').run('otro', fila.order_id, fila.product_id, 'x@y.mx')).toThrow(/UNIQUE/);
  });

  it('valida estrellas y nombre (422) sin perder lo escrito', async () => {
    const t = await tokenDe();
    let r = await mandar(t, { estrellas: '6', texto: 'Hola', nombre: 'Mariana' });
    expect(r.status).toBe(422);
    const h = await r.text();
    expect(h).toContain('Elige de 1 a 5 estrellas.');
    expect(h).toContain('>Hola</textarea>');
    r = await mandar(t, { estrellas: '3', nombre: ' ' });
    expect(r.status).toBe(422);
    expect(validarResena({ estrellas: '5', nombre: 'mariana@correo.mx' }).error.campo).toBe('nombre');
    expect(validarResena({ estrellas: '5', nombre: 'Ana', texto: 'x'.repeat(1001) }).error.campo).toBe('texto');
    expect(validarResena({ estrellas: '2', nombre: '  Ana,‮ Celaya ', texto: 'a\u0007b\n\n\n\nc' })).toEqual({ estrellas: 2, nombre: 'Ana, Celaya', texto: 'ab\n\nc' });
    expect(q("SELECT * FROM resenas WHERE estado != 'sin_escribir'")).toHaveLength(0);
  });

  it('un reembolso apaga la liga', async () => {
    const t = await tokenDe();
    env.DB.raw.exec("UPDATE orders SET estado = 'refunded'");
    expect((await pedir(`/tienda/resena/${t}`)).status).toBe(404);
  });

  it('baja: la liga pide confirmar y después ya no llegan correos', async () => {
    const t = await tokenDe();
    expect(await (await pedir(`/tienda/resena/${t}/baja`)).text()).toContain('¿Dejamos de pedirte reseñas?');
    expect(q('SELECT * FROM resenas_bajas')).toHaveLength(0);                // abrir la liga no da de baja
    expect((await pedir(`/tienda/resena/${t}/baja`, { method: 'POST' })).status).toBe(200);
    expect(q('SELECT email FROM resenas_bajas')).toEqual([{ email: 'mariana@correo.mx' }]);
    orden({ slugs: ['ruta-de-impacto'], dias: DIAS_ACCESO + 1 });
    await pedirResenas(env, new Date(AHORA.getTime() + 8 * DIA));
    expect(correos).toHaveLength(1);
  });
});

describe('página del producto y JSON-LD', () => {
  it('sin aprobar no sale ni en la página ni en el JSON-LD; aprobada sí', async () => {
    const { fila } = await escrita();
    let h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(h).not.toContain('id="resenas"');
    expect(h).not.toContain('Mariana, Celaya');
    expect(producto(h).aggregateRating).toBeUndefined();
    expect(producto(h).review).toBeUndefined();
    await A.decidirResena(fila.id, { estado: 'oculta', por: 'ana@vorka.mx' });
    h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(h).not.toContain('Mariana, Celaya');
    await A.decidirResena(fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(h).toContain('id="resenas"');
    expect(h).toContain('<b>Mariana, Celaya</b>');
    expect(h).toContain('Me sirvió muchísimo.');
    expect(h).toContain('Compra verificada');
    expect(producto(h).review).toEqual([{ '@type': 'Review', author: { '@type': 'Person', name: 'Mariana, Celaya' }, datePublished: fila.escrita_at.slice(0, 10),
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 }, reviewBody: 'Me sirvió muchísimo.' }]);
  });

  it('aggregateRating: promedio y número de las aprobadas de órdenes pagadas', async () => {
    const a = await escrita({ estrellas: '5' }, { email: 'a@correo.mx' });
    const b = await escrita({ estrellas: '4', texto: '', nombre: 'Luis, León' }, { email: 'b@correo.mx' });
    const c = await escrita({ estrellas: '1', nombre: 'Pendiente' }, { email: 'c@correo.mx' });   // sin aprobar: no cuenta
    const d = await escrita({ estrellas: '1', nombre: 'Reembolso' }, { email: 'd@correo.mx' });
    for (const x of [a, b, d]) await A.decidirResena(x.fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    env.DB.raw.prepare("UPDATE orders SET estado = 'refunded' WHERE id = ?").run(d.fila.order_id);   // reembolsada: deja de contar
    expect(c.fila.estado).toBe('pendiente');
    const h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(producto(h).aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 2, bestRating: 5, worstRating: 1 });
    expect(producto(h).review.map(r => r.author.name).sort()).toEqual(['Luis, León', 'Mariana, Celaya']);
    expect(producto(h).review.find(r => r.author.name === 'Luis, León').reviewBody).toBeUndefined();
    expect(h).toContain('<b class="num">4.5</b>');
    expect(h).toContain('2 reseñas de compras verificadas');
    expect(h).not.toContain('Reembolso');
  });

  it('escapa el HTML en la página y en el JSON-LD', async () => {
    const malo = '<script>alert(1)</script>';
    const { fila } = await escrita({ nombre: `Ana ${malo}`.slice(0, 60), texto: `Hola <img src=x onerror=alert(1)> "comillas" & ${malo}` });
    await A.decidirResena(fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    const h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(h).not.toContain('<img src=x');
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('Hola &lt;img src=x onerror=alert(1)&gt; &quot;comillas&quot; &amp; &lt;script&gt;');
    expect(h).toContain('<b>Ana &lt;script&gt;alert(1)&lt;/script&gt;</b>');
    // En el JSON-LD el texto va tal cual (es dato), pero ningún «<» puede cerrar la etiqueta <script>
    const crudo = h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
    expect(crudo).not.toContain('<');
    expect(producto(h).review[0].reviewBody).toContain('<img src=x onerror=alert(1)>');
  });

  it('las páginas de app juntan las reseñas de todos sus planes (Cupo)', async () => {
    const { fila } = await escrita({ estrellas: '4', nombre: 'Rodrigo, Querétaro' }, { slugs: ['cupo-pro'], dias: DIAS_ACCESO + 1 });
    await A.decidirResena(fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    const h = await (await pedir('/tienda/cupo/')).text();
    expect(h).toContain('Rodrigo, Querétaro');
    expect(producto(h).aggregateRating).toMatchObject({ ratingValue: 4, reviewCount: 1 });
    expect(producto(h).offers).toMatchObject({ '@type': 'AggregateOffer', url: 'https://vorka.mx/tienda/cupo/', lowPrice: '0.00', availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Vorka México', url: 'https://vorka.mx' } });
    expect(ld(h).find(x => x['@type'] === 'BreadcrumbList').itemListElement.map(x => x.name)).toEqual(['Inicio', 'Tienda', 'Cupo']);
  });
});

describe('Vorka OS: moderación y ARCO', () => {
  it('lista por estado con conteo, sin el correo completo; aprobar y ocultar con quién lo hizo', async () => {
    const { fila } = await escrita();
    await tokenDe({ email: 'otra@correo.mx' });                // pedida pero sin escribir: no aparece
    const l = await A.resenas();
    expect(l.conteo).toEqual({ pendiente: 1, aprobada: 0, oculta: 0 });
    expect(l.resenas).toHaveLength(1);
    expect(l.resenas[0]).toMatchObject({ id: fila.id, estrellas: 5, nombre_publico: 'Mariana, Celaya', email: 'ma***@correo.mx', url: 'https://vorka.mx/tienda/de-idea-a-proyecto/', publicable: true });
    expect(await A.resenasPorAprobar()).toBe(1);
    await A.decidirResena(fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    expect((await A.resenas({ estado: 'aprobada' })).resenas[0]).toMatchObject({ estado: 'aprobada', decidida_por: 'ana@vorka.mx' });
    await expect(A.decidirResena(fila.id, { estado: 'borrada', por: 'ana@vorka.mx' })).rejects.toThrow(/aprobar u ocultar/);
    await expect(A.decidirResena(fila.id, { estado: 'oculta' })).rejects.toThrow(/quién/);
    const sin = q("SELECT id FROM resenas WHERE estado = 'sin_escribir'")[0].id;
    await expect(A.decidirResena(sin, { estado: 'aprobada', por: 'ana@vorka.mx' })).rejects.toThrow(/todavía no la escriben/);
  });

  it('ARCO por correo: encuentra y borra sus reseñas (salen de la página) sin tocar las de otros', async () => {
    const m = await escrita();
    const o = await escrita({ nombre: 'Otra persona' }, { email: 'otra@correo.mx' });
    for (const x of [m, o]) await A.decidirResena(x.fila.id, { estado: 'aprobada', por: 'ana@vorka.mx' });
    const b = await A.buscarDatosCuponCorreo('Mariana@Correo.mx');
    expect(b.resenas).toHaveLength(1);
    expect(b.resenas[0]).toMatchObject({ estado: 'aprobada' });
    expect(await A.borrarDatosCuponCorreo({ email: 'mariana@correo.mx', por: 'ana@vorka.mx' })).toMatchObject({ resenas: 1 });
    expect(q('SELECT estrellas, texto, nombre_publico, email, estado, borrada_por FROM resenas WHERE id = ?', m.fila.id))
      .toEqual([{ estrellas: null, texto: null, nombre_publico: null, email: '', estado: 'borrada', borrada_por: 'ana@vorka.mx' }]);
    const h = await (await pedir('/tienda/de-idea-a-proyecto/')).text();
    expect(h).not.toContain('Mariana, Celaya');
    expect(h).toContain('Otra persona');
    expect((await pedir(`/tienda/resena/${m.token}`)).status).toBe(404);   // su liga ya no sirve
    expect((await A.buscarDatosCuponCorreo('mariana@correo.mx')).resenas).toHaveLength(0);
    // y esa orden no se vuelve a pedir
    await pedirResenas(env, AHORA);
    expect(correos.filter(c => c.para === 'mariana@correo.mx')).toHaveLength(1);
  });
});
