// Retroalimentación del Simulador PAA (nov 2026): gráfica de avance seleccionable, práctica libre por temas y puntaje
// según la universidad. La lógica del cliente (simulador/logica.js) se prueba en node con vm.
import { describe, it, expect, beforeEach } from 'vitest';
import vm from 'node:vm';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { cookieAcceso, simuladores } from '../src/simulador/index.js';
import { UNIVERSIDADES, PUNTAJE_UNIVERSIDADES, universidadesCliente, BECAS_PAA } from '../src/simulador/paa-universidades.js';
import { LOGICA_JS, APP_JS } from '../src/simulador/cliente.generado.js';

const ctx = {}; vm.createContext(ctx); vm.runInContext(LOGICA_JS, ctx);
const L = ctx.SIM_LOGICA;
const TZ = 'America/Mexico_City';
const uni = id => universidadesCliente().find(u => u.id === id);
const bancoCliente = s => ({ secciones: s.BANCO.SECCIONES, temas: s.BANCO.TEMAS, reactivos: s.BANCO.REACTIVOS });
// Resultados que solo traen el puntaje (sin aciertos): partesPAA combina los puntajes; con aciertos usa la tabla de conversión (ver abajo)
const sec = (id, puntaje, total) => ({ id, puntaje, total, aciertos: null, segundo: 0 });

describe('gráfica de avance', () => {
  const lista = [
    { modo: 'calentamiento', global: 610, fecha: '2026-11-01T21:35:00Z' },
    { modo: 'completo', global: 620, fecha: '2026-11-02T02:10:00Z' },
    { modo: 'completo', global: 600, fecha: '2026-11-02T15:00:00Z' },
    { modo: 'examen', tutor: true, global: 630, fecha: '2026-11-03T16:45:00Z' },
  ];
  const d = L.datosGrafica(lista, { valor: x => x.global, lim: { min: 200, max: 800 }, meta: 750, unidad: 'puntos', tz: TZ });

  it('no empieza en 200 cuando eso aplana las barras, e incluye la meta', () => {
    expect(d.eje.min).toBeGreaterThan(200);
    expect(d.eje.min).toBeLessThanOrEqual(600);
    expect(d.eje.max).toBeGreaterThanOrEqual(750);
    expect(d.meta).toMatchObject({ valor: 750 });
    // la diferencia de 30 puntos se ve: antes (eje 200–800) eran 5 % de alto, ahora mucho más
    const altos = d.barras.map(b => b.alto);
    expect(Math.max(...altos) - Math.min(...altos)).toBeGreaterThan(10);
    expect(d.ticks.length).toBeGreaterThanOrEqual(3);
    expect(d.ticks.length).toBeLessThanOrEqual(6);
  });

  it('cada barra trae su valor, tipo, fecha corta, hora y una etiqueta completa para lector de pantalla', () => {
    expect(d.barras.map(b => b.texto)).toEqual(['610', '620', '600', '630']);
    expect(d.barras.map(b => b.tipo)).toEqual(['Calentamiento', 'Simulacro Medio', 'Simulacro Medio', 'Examen completo con tutor']);
    expect(d.barras[1].fechaCorta).toBe('1 nov');      // 02:10 UTC = 20:10 del 1 de nov en CDMX
    expect(d.barras[1].hora).toBe('20:10');
    expect(d.barras[1].fechaLarga).toMatch(/domingo, 1 de noviembre de 2026, 8:10/);
    expect(d.barras[1].etiqueta).toMatch(/^Simulacro Medio, domingo, 1 de noviembre de 2026, 8:10.*: 620 puntos$/);
    expect(d.barras[3].etiqueta).toMatch(/\(el más reciente\)$/);
  });

  it('en escala total (UDEM) usa 400–1,600, separa miles y marca la referencia', () => {
    const u = uni('udem');
    const r = { modo: 'completo', fecha: '2026-11-01T12:00:00Z', secciones: [sec('lectura', 600, 12), sec('redaccion', 600, 6), sec('matematicas', 620, 14)] };
    const r2 = { ...r, secciones: [sec('lectura', 640, 12), sec('redaccion', 640, 6), sec('matematicas', 660, 14)] };
    const g = L.datosGrafica([r, r2], { valor: x => L.puntajeUni(x, u).valor, lim: { min: 400, max: 1600 }, meta: L.metaEnEscala(550, u), ref: u.ref });
    expect(g.barras.map(b => b.texto)).toEqual(['1,220', '1,300']);
    expect(g.ref).toMatchObject({ valor: 1200, texto: 'Mínimo UDEM' });
    expect(g.meta.valor).toBe(1100);
    expect(g.eje.min).toBeGreaterThanOrEqual(400);
  });

  it('por aciertos (UNAM, ECOEMS) el eje queda dentro de 0 y el total', () => {
    const e = L.rangoEje([70, 74, 80], { min: 0, max: 120 });
    expect(e.min).toBeGreaterThanOrEqual(0); expect(e.max).toBeLessThanOrEqual(120);
    expect(e.min).toBeGreaterThan(0);
    expect(L.rangoEje([795, 800], { min: 200, max: 800 }).max).toBe(800);
  });

  it('el cliente pinta las barras como botones con aria-pressed, flechas y detalle con fecha completa', () => {
    expect(APP_JS).toContain('var SIM_LOGICA');
    expect(APP_JS).toMatch(/class="sim-gh-b[^]*aria-pressed/);
    expect(APP_JS).toContain("'ArrowRight'");
    expect(APP_JS).toContain('b.fechaLarga');
    expect(APP_JS).toContain('para que se noten las diferencias');
  });
});

describe('práctica libre por temas', () => {
  it('los 4 simuladores tienen temas etiquetados en su banco y se pueden elegir', () => {
    expect(simuladores().map(s => s.APP)).toEqual(['simulador-paa', 'simulador-unam', 'simulador-ecoems', 'simulador-prepa-ug', 'simulador-ipn', 'simulador-exani-ii']);
    for (const s of simuladores()) {
      const B = bancoCliente(s);
      expect(L.hayTemas(B), s.APP).toBe(true);
      const grupos = L.temasPorSeccion(B, {});
      // cada tema con reactivos aparece en su sección con su nombre real y cuenta exacta
      const n = grupos.reduce((a, g) => a + g.temas.reduce((b, t) => b + t.total, 0), 0);
      expect(n, s.APP).toBe(B.reactivos.length);
      for (const g of grupos) for (const t of g.temas) {
        expect(B.temas[t.id].seccion).toBe(g.id);
        expect(t.nombre).toBe(B.temas[t.id].nombre);
      }
    }
  });

  it('cuenta cuántas preguntas ya vio por tema', () => {
    const B = bancoCliente(simuladores()[0]);
    const alg = B.reactivos.filter(r => r.tema === 'algebra');
    const visto = { [alg[0].id]: 1, [alg[1].id]: 1 };
    const t = L.temasPorSeccion(B, visto).find(g => g.id === 'matematicas').temas.find(x => x.id === 'algebra');
    expect(t).toMatchObject({ total: alg.length, vistos: 2 });
  });

  it('solo trae reactivos de los temas elegidos, repartidos, con los fallados primero', () => {
    const B = bancoCliente(simuladores()[0]);
    let semilla = 1; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const temas = ['algebra', 'conectores'];
    const falla = B.reactivos.find(r => r.tema === 'conectores');
    const items = L.elegirPractica(B.reactivos, temas, { n: 10, fallados: { [falla.id]: 1 }, vistos: {}, azar });
    expect(items).toHaveLength(10);
    expect(items.every(r => temas.includes(r.tema))).toBe(true);
    expect(items.filter(r => r.tema === 'algebra')).toHaveLength(5);
    expect(items.map(r => r.id)).toContain(falla.id);
    expect(L.elegirPractica(B.reactivos, ['algebra'], { n: 20, azar }).every(r => r.tema === 'algebra')).toBe(true);
    expect(L.elegirPractica(B.reactivos, ['no-existe'], { n: 10, azar })).toHaveLength(0);
  });

  it('sugiere los temas más débiles con todo el historial (no solo el último simulacro)', () => {
    const TEMAS = simuladores()[0].BANCO.TEMAS;
    const hist = [
      { modo: 'practica', temas: { algebra: { ok: 1, total: 4 }, conectores: { ok: 4, total: 4 } } },
      { modo: 'completo', temas: { algebra: { ok: 1, total: 2 }, geometria: { ok: 1, total: 3 }, inventado: { ok: 0, total: 9 } } },
    ];
    const agg = L.desempenoTemas(hist);
    expect(agg.algebra).toEqual({ ok: 2, total: 6 });
    const d = L.temasDebiles(agg, TEMAS, 4, 2);
    expect(d.map(t => t.id)).toEqual(['algebra', 'geometria']);
    expect(L.temasDebiles({}, TEMAS, 4)).toEqual([]);
  });
});

describe('puntaje según la universidad', () => {
  it('cada universidad del cliente sale de las verificadas, con su fuente oficial', () => {
    const us = universidadesCliente();
    expect(us.map(u => u.id)).toEqual(Object.keys(UNIVERSIDADES));
    for (const u of us) {
      expect(UNIVERSIDADES[u.id].fuentes.map(f => f.url)).toContain(u.fuente.url);
      expect(['total', 'paa']).toContain(u.escala);
      expect(u.explica.length).toBeGreaterThan(40);
      expect(u.verificado).toBe(UNIVERSIDADES[u.id].verificado);
    }
    // los mínimos de la UDEM son los de su tabla oficial (numeral 5.3.6)
    const fila = UNIVERSIDADES.udem.minimos.filas[0];
    expect(PUNTAJE_UNIVERSIDADES.udem.minimos).toEqual({ total: Number(fila[1].replace(',', '')), verbal: Number(fila[2]), mate: Number(fila[3]) });
    // la beca del ITESO pide más de 1,250 (folleto citado en su página)
    expect(UNIVERSIDADES.iteso.reglas.some(r => r[1].includes('1,250'))).toBe(true);
    expect(PUNTAJE_UNIVERSIDADES.iteso.ref.valor).toBe(1250);
  });

  it('UDEM: suma Lectura y Redacción (una parte, pesada por reactivos) + Matemáticas y revisa sus mínimos', () => {
    const u = uni('udem');
    const res = { global: 650, secciones: [sec('lectura', 600, 12), sec('redaccion', 700, 6), sec('matematicas', 640, 14), sec('ingles', 500, 10)] };
    const p = L.puntajeUni(res, u);
    expect(p).toMatchObject({ escala: 'total', min: 400, max: 1600, valor: 1270, partes: { verbal: 630, mate: 640, total: 1270 } });
    expect(L.cumpleMinimos(p.partes, u)).toMatchObject({ todo: true });
    const bajo = L.puntajeUni({ secciones: [sec('lectura', 520, 12), sec('redaccion', 540, 6), sec('matematicas', 700, 14)] }, u);
    expect(bajo.valor).toBe(1230);
    expect(L.cumpleMinimos(bajo.partes, u)).toMatchObject({ total: true, verbal: false, todo: false });
    expect(L.metaEnEscala(550, u)).toBe(1100);
  });

  it('ITESO usa el mismo total; sin mínimo de admisión publicado', () => {
    const u = uni('iteso');
    expect(u.sinMinimo).toBe(true);
    expect(L.puntajeUni({ secciones: [sec('lectura', 600, 6), sec('redaccion', 600, 6), sec('matematicas', 680, 6)] }, u).valor).toBe(1280);
    expect(L.cumpleMinimos({ total: 1280, verbal: 600, mate: 680 }, u)).toBeNull();
  });

  it('UdeG e ITAM: sin conversión ni mínimo publicados, se queda la escala del College Board con la nota', () => {
    const res = { global: 630, secciones: [sec('lectura', 600, 6), sec('redaccion', 640, 6), sec('matematicas', 650, 6)] };
    for (const id of ['udeg', 'itam']) {
      const u = uni(id);
      expect(u.sinMinimo, id).toBe(true);
      expect(u.escala, id).toBe('paa');
      expect(L.puntajeUni(res, u), id).toEqual({ valor: 630, min: 200, max: 800, escala: 'paa' });
      expect(L.metaEnEscala(700, u)).toBe(700);
    }
    // la UdeG explica su 0 a 100 y por qué no se convierte (no inventamos la fórmula)
    expect(uni('udeg').explica).toMatch(/0 a 100/);
    expect(uni('udeg').explica).toMatch(/no publica cómo pasa/);
    expect(APP_JS).toContain('Esta universidad no publica un puntaje mínimo; revisa su convocatoria.');
    // sin universidad elegida: escala estándar
    expect(L.puntajeUni(res, null).valor).toBe(630);
    expect(L.puntajeUni({ global: null, secciones: [] }, uni('udem'))).toBeNull();
  });
});

describe('tabla de conversión PAA y meta de beca', () => {
  const conAciertos = (id, aciertos, total) => ({ id, aciertos, total, puntaje: 0 });
  it('la tabla convierte aciertos a 200–800: 70 en Lectura y Redacción y 55 en Matemáticas', () => {
    expect(L.TABLA_LR).toHaveLength(71); expect(L.TABLA_M).toHaveLength(56);
    expect([L.TABLA_LR[0], L.TABLA_LR[1], L.TABLA_LR[56], L.TABLA_LR[70]]).toEqual([200, 208, 672, 800]);
    expect([L.TABLA_M[0], L.TABLA_M[1], L.TABLA_M[42], L.TABLA_M[55]]).toEqual([200, 205, 688, 800]);
    // siempre crece con cada acierto
    for (const T of [L.TABLA_LR, L.TABLA_M]) for (let i = 1; i < T.length; i++) expect(T[i]).toBeGreaterThan(T[i - 1]);
  });
  it('examen completo: 56 de Lectura y Redacción + 42 de Matemáticas = 1,360 (la meta de beca)', () => {
    const secs = [conAciertos('lectura', 36, 45), conAciertos('redaccion', 20, 25), conAciertos('matematicas', 42, 55), conAciertos('ingles', 30, 50)];
    expect(L.partesPAA(secs)).toEqual({ verbal: 672, mate: 688, total: 1360, aciertosLR: 56, aciertosMate: 42 });
    expect(L.faltanParaMeta(1360, 56, 42)).toMatchObject({ alcanza: true, faltan: 0 });
    expect(L.puntajeTabla(36, 45, 'lr')).toBe(L.TABLA_LR[56]);
    expect(L.parteDeSeccion('ingles')).toBeNull();
  });
  it('simulacros cortos se llevan al tamaño del examen real', () => {
    expect(L.aciertosEquivalentes(10, 20, 'lr')).toBe(35);
    expect(L.aciertosEquivalentes(10, 20, 'mate')).toBe(28);
    expect(L.puntajeTabla(20, 20, 'mate')).toBe(800);
  });
  it('cuántos aciertos faltan y las combinaciones mínimas para 1,360', () => {
    const f = L.faltanParaMeta(1360, 50, 38);
    expect(f.alcanza).toBe(false);
    expect(L.TABLA_LR[f.lr] + L.TABLA_M[f.mate]).toBeGreaterThanOrEqual(1360);
    expect(f.faltan).toBe(f.lr - 50 + f.mate - 38);
    // nadie llega con menos aciertos
    for (let i = 50; i <= 70; i++) for (let j = 38; j <= 55; j++) if (L.TABLA_LR[i] + L.TABLA_M[j] >= 1360) expect(i - 50 + j - 38).toBeGreaterThanOrEqual(f.faltan);
    const cs = L.combinacionesMeta(1360);
    expect(cs[0]).toMatchObject({ mate: 55, lr: 43 });
    expect(cs.find(c => c.mate === 42)).toMatchObject({ lr: 56, total: 1360 });
    for (const c of cs) { expect(c.total).toBeGreaterThanOrEqual(1360); if (c.lr > 0) expect(L.TABLA_LR[c.lr - 1] + L.TABLA_M[c.mate]).toBeLessThan(1360); }
  });
  it('el Tec muestra el total sin meta propia; las becas son referencias para postularse que el estudiante elige', () => {
    const u = uni('tec-de-monterrey');
    expect(u).toMatchObject({ escala: 'total', sinMinimo: true });
    expect(u.beca).toBeUndefined(); expect(u.metaSeccion).toBeUndefined(); expect(u.ref).toBeUndefined();
    expect(L.metaEnEscala(680, u)).toBe(1360);
    expect(BECAS_PAA.map(b => [b.nombre, b.paa, b.promedio])).toEqual([['Líderes del Mañana', 1360, 90], ['Fundación Zaber', 1360, 90], ['Fundación Gallagher', 1400, 95]]);
    for (const b of BECAS_PAA) expect(b.paa % 2).toBe(0);   // se guarda como meta por sección (la mitad)
    expect(APP_JS).toContain('para postularte');
    expect(APP_JS).toContain('Llegar a él no te da la beca');
    expect(APP_JS).not.toContain('Alcanzas tu beca');
    expect(APP_JS).toContain('Tabla de conversión de aciertos a puntaje PAA');
  });
});

describe('servidor', () => {
  let env, cookie;
  beforeEach(async () => {
    env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
    env.DB.raw.exec('UPDATE products SET activo = 1');
    const o = await crearOrden(env, { items: [{ slug: 'simulador-paa' }], email: 'ana@mail.com', nombre: 'Ana López' });
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos ?? 24900, moneda: 'MXN', metodo_pago: 'card' });
    cookie = (await cookieAcceso(env, o.id, Date.now() + 864e5)).split(';')[0];
  });
  const pedir = (ruta, op = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: op.metodo || 'GET', headers: { cookie, 'content-type': 'application/json' }, body: op.body }), env);

  it('la configuración del PAA trae las universidades; los otros simuladores no', async () => {
    const b = await (await pedir('/api/simulador-paa/banco')).json();
    expect(b.config.universidades.map(u => u.id)).toEqual(Object.keys(UNIVERSIDADES));
    for (const s of simuladores().slice(1)) expect(s.BANCO).toBeTruthy();
    expect(JSON.stringify(simuladores().slice(1).map(s => s.APP))).not.toContain('paa');
  });

  it('guardar una práctica de temas no gasta intentos', async () => {
    const antes = await (await pedir('/api/simulador-paa/yo')).json();
    const body = JSON.stringify({ modo: 'practica', secciones: [{ id: 'practica', puntaje: 500, aciertos: 6, segundo: 2, total: 10 }],
      temas: { algebra: { ok: 3, total: 5 }, geometria: { ok: 3, total: 5 } }, fallados: [], global: null, meta: 600, confianza: 50 });
    expect((await pedir('/api/simulador-paa/resultados', { metodo: 'POST', body })).status).toBe(200);
    const yo = await (await pedir('/api/simulador-paa/yo')).json();
    expect(yo.historial[0]).toMatchObject({ modo: 'practica', temas: { algebra: { ok: 3, total: 5 } } });
    for (const k of ['intentos', 'examenes', 'calentamientos']) expect(yo[k].usados, k).toBe(antes[k].usados);
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM simulador_intentos').get().n).toBe(0);
  });
});
