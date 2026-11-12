// Simulador EXCOBA (UAQ y UG): 180 preguntas = primaria, secundaria y las 3 asignaturas de bachillerato de la carrera, con
// respuesta semiconstruida y crédito parcial (multiple, numerica, clasificar); y sus páginas por universidad.
import { d1 } from './d1.js';
import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { simuladorDe } from '../src/simulador/index.js';
import { BASICAS, ASIGNATURAS, COMBOS } from '../src/simulador/excoba.js';
import { armarPorMaterias } from '../src/simulador/armar-por-area.js';
import { armarDiagnostico } from '../src/simulador/diagnostico.js';
import { UNIVERSIDADES_EXCOBA, paginaExcobaUniversidad } from '../src/simulador/excoba-universidades.js';
import { paginaSelector } from '../src/simulador/exani-universidades.js';
import { LOGICA_JS, APP_JS } from '../src/simulador/cliente.generado.js';

const EX = simuladorDe('simulador-excoba');
const { REACTIVOS, TEMAS, AREAS, SECCIONES } = EX.BANCO;
const SECS = [...BASICAS.map(b => b[0]), ...ASIGNATURAS.map(a => a[0])];
const ctx = {}; vm.createContext(ctx); vm.runInContext(LOGICA_JS, ctx);
const L = ctx.SIM_LOGICA;

describe('Simulador EXCOBA · banco', () => {
  it('ids únicos; cada reactivo en una sección válida y con tema de su misma sección', () => {
    expect(new Set(REACTIVOS.map(r => r.id)).size).toBe(REACTIVOS.length);
    for (const r of REACTIVOS) {
      expect(SECS, r.id).toContain(r.seccion);
      expect(TEMAS[r.tema]?.seccion, `${r.id}: ${r.tema}`).toBe(r.seccion);
      expect(r.texto, r.id).toBeUndefined();
    }
    expect(new Set(SECCIONES.map(s => s.id))).toEqual(new Set(SECS));
  });

  it('cada tipo trae lo que necesita y su respuesta correcta vale 1 punto', () => {
    for (const r of REACTIVOS) {
      if (!r.tipo) { expect(r.opciones, r.id).toHaveLength(4); expect(L.calificar(r, r.correcta), r.id).toBe(1); }
      else if (r.tipo === 'multiple') expect(L.calificar(r, r.correctas), r.id).toBe(1);
      else if (r.tipo === 'clasificar') expect(L.calificar(r, r.elementos.map(e => e.categoria)), r.id).toBe(1);
      else if (r.tipo === 'numerica') for (const a of r.respuestas) expect(L.calificar(r, a), `${r.id}: ${a}`).toBe(1);
      else throw new Error(`${r.id}: tipo ${r.tipo}`);
    }
  });

  it('una parte relevante es semiconstruida en cada asignatura (al menos 30 %)', () => {
    for (const s of SECS) {
      const rs = REACTIVOS.filter(r => r.seccion === s);
      expect(rs.filter(r => r.tipo).length / rs.length, s).toBeGreaterThanOrEqual(0.3);
    }
    for (const t of ['multiple', 'numerica', 'clasificar']) expect(REACTIVOS.filter(r => r.tipo === t).length, t).toBeGreaterThan(40);
  });

  it('alcanza para dos exámenes completos sin repetir con cualquier combinación', () => {
    const por = Object.fromEntries(SECS.map(m => [m, REACTIVOS.filter(r => r.seccion === m).length]));
    for (const a of AREAS) for (const m of a.materias) expect(por[m.id], `${a.id} · ${m.id}`).toBeGreaterThanOrEqual(m.reactivos * 2);
  });
});

describe('Simulador EXCOBA · calificación con crédito parcial', () => {
  const multi = { tipo: 'multiple', opciones: ['a', 'b', 'c', 'd', 'e'], correctas: [0, 2, 3] };
  const clas = { tipo: 'clasificar', categorias: ['X', 'Y'], elementos: [{ texto: '1', categoria: 0 }, { texto: '2', categoria: 1 }, { texto: '3', categoria: 1 }, { texto: '4', categoria: 0 }] };
  it('clasificar: cada elemento vale 1/n (4 elementos → 0.25 c/u, como el instructivo)', () => {
    expect(L.calificar(clas, [0, 1, 1, 0])).toBe(1);
    expect(L.calificar(clas, [0, 1, 0, 0])).toBe(0.75);
    expect(L.calificar(clas, [1, 0, 0, 1])).toBe(0);
  });
  it('seleccionar varios: cada correcta elegida vale 1/n y no se aceptan más de n', () => {
    expect(L.calificar(multi, [3, 0, 2])).toBe(1);
    expect(L.calificar(multi, [0, 2, 4])).toBe(0.67);
    expect(L.calificar(multi, [0, 1, 2, 3])).toBe(0);
  });
  it('escribir: números con tolerancia y fracciones; expresiones equivalentes', () => {
    expect(L.calificar({ tipo: 'numerica', respuestas: ['0.75'] }, '3/4')).toBe(1);
    expect(L.calificar({ tipo: 'numerica', respuestas: ['12.57'], tolerancia: 0.01 }, '12.566')).toBe(1);
    expect(L.calificar({ tipo: 'numerica', respuestas: ['12.57'], tolerancia: 0.01 }, '12.6')).toBe(0);
    const e = { tipo: 'numerica', expresion: true, respuestas: ['x^2-9'] };
    expect(L.calificar(e, '(x+3)(x-3)')).toBe(1);
    expect(L.calificar(e, 'x²−9')).toBe(1);
    expect(L.calificar(e, '(x-3)^2')).toBe(0);
    expect(L.calificar(e, 'hola')).toBe(0);
    expect(L.calificar({ ...e, sinParentesis: true }, '(x+3)(x-3)')).toBe(0);
    expect(L.calificar({ ...e, sinParentesis: true }, 'x^2-9')).toBe(1);
  });
  it('el cliente suma los puntos del primer intento (no solo aciertos enteros)', () => {
    expect(APP_JS).toContain('st.p1 = L.calificar(r, v)');
    expect(APP_JS).toContain("role=\"checkbox\"");
  });
});

describe('Simulador EXCOBA · examen', () => {
  it('cada combinación: primaria, secundaria y sus 3 asignaturas de 20 = 180 preguntas en 180 min', () => {
    expect(AREAS.map(a => a.id)).toEqual(COMBOS.map(c => c[0]));
    for (const a of AREAS) {
      expect(a.examen).toEqual({ reactivos: 180, minutos: 180 });
      const c = COMBOS.find(x => x[0] === a.id);
      expect(a.materias.map(m => m.id)).toEqual([...BASICAS.map(b => b[0]), c[1], c[2], c[3]]);
      expect(a.medio.reactivos).toBe(90);
    }
  });

  it('arma un examen de 180 preguntas distintas, cada una en su sección, con cada combinación', () => {
    const por = Object.fromEntries(REACTIVOS.map(r => [r.id, r]));
    for (const a of AREAS) {
      const secs = armarPorMaterias(EX.BANCO, a.materias, Math.random, new Set(), 'oficial');
      expect(new Set(secs.flat()).size, a.id).toBe(180);
      secs.forEach((s, i) => s.forEach(id => expect(por[id].seccion, `${a.id} · ${id}`).toBe(a.materias[i].id)));
    }
  });

  it('las combinaciones usan asignaturas que existen y no se repiten', () => {
    const ids = ASIGNATURAS.map(a => a[0]);
    expect(new Set(COMBOS.map(c => c[0])).size).toBe(COMBOS.length);
    expect(new Set(COMBOS.map(c => c.slice(1).slice().sort().join())).size).toBe(COMBOS.length);
    for (const [, ...as] of COMBOS) { expect(new Set(as).size).toBe(3); for (const a of as) expect(ids).toContain(a); }
  });

  it('el diagnóstico gratis: 12 preguntas de opción única de primaria y secundaria', () => {
    const por = Object.fromEntries(REACTIVOS.map(r => [r.id, r]));
    for (let i = 0; i < 10; i++) {
      const d = armarDiagnostico(EX.BANCO, Math.random);
      expect(d.map(s => s.id)).toEqual(BASICAS.map(b => b[0]));
      expect(d.flatMap(s => s.items)).toHaveLength(12);
      for (const id of d.flatMap(s => s.items)) expect(por[id].tipo, id).toBeUndefined();
    }
  });
});

describe('EXCOBA por universidad', () => {
  it('la UAQ y la UG: fuente oficial, cada carrera apunta a una combinación del simulador', async () => {
    const combos = new Set(COMBOS.map(c => c[0]));
    for (const [k, u] of Object.entries(UNIVERSIDADES_EXCOBA)) {
      for (const f of u.fuentes) expect(f.url, k).toMatch(/^https:\/\//);
      for (const [c] of u.carreras) expect(combos.has(c), `${k}: ${c}`).toBe(true);
      const html = await (await paginaExcobaUniversidad({ DB: d1() }, k)).text();
      expect(html).toContain(`https://vorka.mx/simulador-excoba/${k}/`);
      expect(html).toContain('No estamos afiliados');
      expect(html).not.toMatch(/href="tel:/);
    }
    // Conteos del instructivo: UAQ 49 carreras en el Anexo I 2026-1, UG 52 en su tabla 2
    expect(UNIVERSIDADES_EXCOBA.uaq.carreras.flatMap(c => c[1])).toHaveLength(49);
    expect(UNIVERSIDADES_EXCOBA.ug.carreras.flatMap(c => c[1])).toHaveLength(52);
    // Solo la UG trae Ciencias económico-administrativas
    expect(UNIVERSIDADES_EXCOBA.uaq.carreras.some(([c]) => c.includes('cea'))).toBe(false);
    expect(await paginaExcobaUniversidad({ DB: d1() }, 'unam')).toBe(null);
  });

  it('«¿Cuál te sirve?» deja la UAQ y la UG como «Próximamente» mientras el producto no está a la venta', async () => {
    const html = await (await paginaSelector()).text();
    expect(html).not.toContain('href="/simulador-excoba/uaq/"');
    expect(html).toMatch(/UAQ[\s\S]*?Próximamente/);
    const vivo = { DB: { prepare: () => ({ bind: () => ({ first: async () => ({ id: 'prod_excoba_paquete', slug: 'simulador-excoba-paquete', activo: 1, r2_keys: '[]', contenido: '{}' }) }) }) } };
    const html2 = await (await paginaSelector(vivo)).text();
    expect(html2).toContain('href="/simulador-excoba/uaq/"');
    expect(html2).toContain('href="/simulador-excoba/ug/"');
  });
});
