// Seguimiento del diagnóstico gratis y puntaje real (migración 0087, src/simulador/seguimiento.js)
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { simuladores } from '../src/simulador/index.js';
import { seguimientoDiagnosticos, pedirPuntajes, validarPuntaje, SEGUIMIENTO_DESDE } from '../src/simulador/seguimiento.js';
import { pedirResenas } from '../src/resenas.js';

const H = 36e5, DIA = 24 * H;
const AHORA = new Date('2026-11-20T18:00:00.000Z');            // 12:00 en el centro de México
let env, correos;
const q = (sql, ...p) => env.DB.raw.prepare(sql).all(...p);
const iso = ms => new Date(ms).toISOString();
const pedir = (ruta, init = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { redirect: 'manual', ...init }), env);
const sims = () => simuladores();

const RES = { global: 560, escala: 'paa', de: 800, aciertos: 7, total: 12, reforzar: 'matematicas', fuerte: 'ingles',
  secciones: [{ id: 'lectura', nombre: 'Lectura', aciertos: 2, total: 3, puntaje: 600 }, { id: 'matematicas', nombre: 'Matemáticas', aciertos: 1, total: 3, puntaje: 420 }] };

function diag({ email = 'ana@mail.com', creado = AHORA.getTime() - 3 * DIA, terminado = null, app = 'simulador-paa', tema = null } = {}) {
  const mates = simuladores().find(s => s.APP === app).BANCO.REACTIVOS.filter(r => r.seccion === 'matematicas').slice(0, 3).map(r => r.id);
  env.DB.raw.prepare(`INSERT INTO simulador_diagnosticos (app, email, nombre, whatsapp, acepto_at, created_at, verificado_at, items, resultado, terminado_at, seg_tema_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(app, email, 'Ana López', '5512345678', iso(creado), iso(creado), iso(creado),
    JSON.stringify([{ id: 'matematicas', items: mates }]), terminado ? JSON.stringify(RES) : null, terminado ? iso(terminado) : null, tema ? iso(tema) : null);
  return q('SELECT id FROM simulador_diagnosticos WHERE email = ?', email)[0].id;
}
function orden({ email = 'luis@mail.com', slug = 'simulador-paa-paquete', dias = 46, monto = 37900, proveedor = 'stripe', usado = true } = {}) {
  const id = crypto.randomUUID(), paid = iso(AHORA.getTime() - dias * DIA);
  env.DB.raw.prepare('INSERT INTO orders (id, email, nombre, monto_centavos, estado, proveedor, paid_at, created_at) VALUES (?,?,?,?,?,?,?,?)').run(id, email, 'Luis Pérez', monto, 'paid', proveedor, paid, paid);
  env.DB.raw.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos) SELECT ?, id, nombre, precio_centavos FROM products WHERE slug = ?').run(id, slug);
  if (usado) env.DB.raw.prepare("INSERT INTO simulador_resultados (order_id, app, modo, resultado) VALUES (?, 'simulador-paa', 'completo', '{}')").run(id);
  return id;
}

beforeEach(() => {
  correos = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
});

describe('seguimiento del diagnóstico', () => {
  it('a quien no terminó le recuerda una sola vez, con liga para darse de baja', async () => {
    diag({ creado: AHORA.getTime() - 25 * H });
    expect(await seguimientoDiagnosticos(env, AHORA, sims())).toMatchObject({ retomar: 1 });
    expect(correos[0].asunto).toBe('Tu diagnóstico PAA gratis te espera');
    expect(correos[0].texto).toContain('https://vorka.mx/simulador-paa/diagnostico/');
    expect(correos[0].texto).toMatch(/\/tienda\/simulador-baja\?i=\d+&s=[0-9a-f]{32}/);
    await seguimientoDiagnosticos(env, new Date(AHORA.getTime() + H), sims());
    expect(correos).toHaveLength(1);
  });

  it('no escribe antes de tiempo, de noche, a diagnósticos viejos ni a quien ya compró', async () => {
    diag({ email: 'nueva@mail.com', creado: AHORA.getTime() - 5 * H });
    diag({ email: 'vieja@mail.com', creado: Date.parse(SEGUIMIENTO_DESDE) - DIA, terminado: Date.parse(SEGUIMIENTO_DESDE) - DIA });
    diag({ email: 'luis@mail.com', creado: AHORA.getTime() - 3 * DIA, terminado: AHORA.getTime() - 3 * DIA });
    orden({ email: 'luis@mail.com', dias: 1 });
    expect(await seguimientoDiagnosticos(env, new Date('2026-11-20T06:00:00.000Z'), sims())).toMatchObject({ revisados: 0 });   // 00:00 en México
    await seguimientoDiagnosticos(env, AHORA, sims());
    expect(correos).toHaveLength(0);
  });

  it('a los 2 días manda su sección débil con consejos y 3 días después un código personal de 10 %', async () => {
    const id = diag({ terminado: AHORA.getTime() - 49 * H });
    expect(await seguimientoDiagnosticos(env, AHORA, sims())).toMatchObject({ tema: 1, oferta: 0 });
    expect(correos[0].asunto).toBe('Cómo subir en Matemáticas para la PAA');
    expect(correos[0].texto).toContain('560 puntos');
    expect(correos[0].html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    await seguimientoDiagnosticos(env, new Date(AHORA.getTime() + 2 * DIA), sims());
    expect(correos).toHaveLength(1);
    const despues = new Date(AHORA.getTime() + 3 * DIA + H);
    expect(await seguimientoDiagnosticos(env, despues, sims())).toMatchObject({ oferta: 1 });
    const fila = q('SELECT seg_codigo FROM simulador_diagnosticos WHERE id = ?', id)[0];
    expect(fila.seg_codigo).toMatch(/^DX-[A-Z2-9]{6}$/);
    const c = q('SELECT * FROM codigos_descuento WHERE codigo = ?', fila.seg_codigo)[0];
    expect(c).toMatchObject({ pct: 10, max_usos: 1, activo: 1 });
    expect(Date.parse(c.hasta) - despues.getTime()).toBe(72 * H);
    expect(correos[1].texto).toContain(`cupon=${fila.seg_codigo}`);
    await seguimientoDiagnosticos(env, new Date(despues.getTime() + DIA), sims());
    expect(correos).toHaveLength(2);
  });

  it('si el correo falla, lo regresa y desactiva el código', async () => {
    const id = diag({ terminado: AHORA.getTime() - 6 * DIA, tema: AHORA.getTime() - 73 * H });
    env.CORREO.enviar = async () => { throw new Error('Resend 500'); };
    expect(await seguimientoDiagnosticos(env, AHORA, sims())).toMatchObject({ oferta: 0, fallidos: 1 });
    expect(q('SELECT seg_oferta_at, seg_codigo FROM simulador_diagnosticos WHERE id = ?', id)[0]).toEqual({ seg_oferta_at: null, seg_codigo: null });
    expect(q("SELECT activo FROM codigos_descuento WHERE codigo LIKE 'DX-%'")[0].activo).toBe(0);
  });

  it('darse de baja: GET pide confirmar, POST lo apaga; con firma mala no', async () => {
    const id = diag({ creado: AHORA.getTime() - 25 * H });
    await seguimientoDiagnosticos(env, AHORA, sims());
    const liga = correos[0].texto.match(/https:\/\/vorka\.mx(\/tienda\/simulador-baja\?[^\s]+)/)[1];
    const g = await pedir(liga);
    expect(await g.text()).toContain('Sí, darme de baja');
    expect(q('SELECT seg_baja_at FROM simulador_diagnosticos WHERE id = ?', id)[0].seg_baja_at).toBeNull();
    expect(await (await pedir(liga, { method: 'POST' })).text()).toContain('ya no te escribimos');
    expect(q('SELECT seg_baja_at FROM simulador_diagnosticos WHERE id = ?', id)[0].seg_baja_at).not.toBeNull();
    expect((await pedir(`/tienda/simulador-baja?i=${id}&s=${'0'.repeat(32)}`)).status).toBe(404);
  });
});

describe('puntaje real', () => {
  it('lo pide una vez, 45 días después de la compra si no hay fecha de examen, y guarda la respuesta', async () => {
    orden();
    expect(await pedirPuntajes(env, AHORA, sims())).toMatchObject({ enviadas: 1 });
    expect(correos[0].asunto).toBe('¿Cuánto sacaste en la PAA?');
    const token = correos[0].texto.match(/\/tienda\/puntaje\/([a-f0-9]{64})/)[1];
    await pedirPuntajes(env, new Date(AHORA.getTime() + DIA), sims());
    expect(correos).toHaveLength(1);
    expect(await (await pedir(`/tienda/puntaje/${token}`)).text()).toContain('¿Cuánto sacaste en la PAA?');
    const mala = await pedir(`/tienda/puntaje/${token}`, { method: 'POST', body: new URLSearchParams({ quedo: 'si', puntaje: '950' }) });
    expect(mala.status).toBe(422);
    const ok = await pedir(`/tienda/puntaje/${token}`, { method: 'POST', body: new URLSearchParams({ quedo: 'si', puntaje: '640', universidad: 'UDEM', publicar: '1', nombre: 'Luis, Monterrey' }) });
    expect(ok.status).toBe(303);
    const p = await new Admin({}, env).puntajes();
    expect(p).toMatchObject({ pedidos: 1, respondidos: 1 });
    expect(p.puntajes[0]).toMatchObject({ puntaje: 640, quedo: 'si', universidad: 'UDEM', publicar: 1, nombre_publico: 'Luis, Monterrey' });
  });

  it('con fecha de examen espera 7 días después del examen; no a quien no lo usó', async () => {
    orden({ dias: 30 });
    env.DB.raw.prepare("INSERT INTO simulador_estudio (email, app, fecha_examen) VALUES ('luis@mail.com', 'simulador-paa', '2026-11-18')").run();
    orden({ email: 'nadie@mail.com', usado: false });
    expect(await pedirPuntajes(env, AHORA, sims())).toMatchObject({ enviadas: 0 });
    expect(await pedirPuntajes(env, new Date(AHORA.getTime() + 6 * DIA), sims())).toMatchObject({ enviadas: 1 });
    expect(correos.map(c => c.para)).toEqual(['luis@mail.com']);
  });

  it('valida: «todavía no sé» no pide puntaje; publicar pide nombre', () => {
    expect(validarPuntaje('simulador-paa', { quedo: 'espera' })).toMatchObject({ puntaje: null, quedo: 'espera' });
    expect(validarPuntaje('simulador-paa', { quedo: 'no' }).error.campo).toBe('puntaje');
    expect(validarPuntaje('simulador-paa', { quedo: 'si', puntaje: '600', publicar: '1' }).error.campo).toBe('nombre');
    expect(validarPuntaje('simulador-unam', { quedo: 'si', puntaje: '98' })).toMatchObject({ puntaje: 98 });
  });
});

describe('reseña de quien lo recibió de regalo', () => {
  it('se pide si usó el simulador y se publica como «Lo recibió de regalo»', async () => {
    orden({ email: 'sofi@mail.com', dias: 15, monto: 0, proveedor: 'regalo' });
    orden({ email: 'nousa@mail.com', dias: 15, monto: 0, proveedor: 'regalo', usado: false });
    await pedirResenas(env, AHORA);
    expect(correos.map(c => c.para)).toEqual(['sofi@mail.com']);
    const token = correos[0].texto.match(/\/tienda\/resena\/([a-f0-9]{64})/)[1];
    await pedir(`/tienda/resena/${token}`, { method: 'POST', body: new URLSearchParams({ estrellas: '5', nombre: 'Sofía, León' }) });
    const id = q('SELECT id FROM resenas WHERE email = ?', 'sofi@mail.com')[0].id;
    await new Admin({}, env).decidirResena(id, { estado: 'aprobada', por: 'equipo@vorka.mx' });
    const h = await (await pedir('/simulador-paa/')).text();
    expect(h).toContain('Lo recibió de regalo');
  });
});

describe('calculadora de puntaje PAA', () => {
  it('es pública, se indexa, trae sus metas y la ligan las páginas por universidad', async () => {
    const r = await pedir('/simulador-paa/calculadora/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('<title>Calculadora de puntaje PAA');
    expect(h).not.toContain('noindex');
    expect(h).toContain('window.PAA_CALC=');
    expect(h).toContain('"total":1200');
    expect(h).toContain('"FAQPage"');
    expect((await pedir('/simulador-paa/calculadora')).status).toBe(301);
    const udeg = await (await pedir('/simulador-paa/udeg/')).text();
    expect(udeg).toContain('href="/simulador-paa/calculadora/"');
    expect(udeg).toContain('Calcular mi puntaje UdeG');
    expect(await (await pedir('/tienda/sitemap.xml')).text()).toContain('/simulador-paa/calculadora/');
  });
});
