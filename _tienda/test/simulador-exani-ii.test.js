// Simulador EXANI-II: un solo simulador con módulos a elegir, 168 reactivos de tres opciones en 4 h 30 min, y sus páginas
// por universidad y «¿Cuál te sirve?»
import { describe, it, expect } from 'vitest';
import { simuladorDe } from '../src/simulador/index.js';
import { PAREJAS, MODULOS } from '../src/simulador/exani-ii.js';
import { armarPorMaterias } from '../src/simulador/armar-por-area.js';
import { armarDiagnostico } from '../src/simulador/diagnostico.js';
import { UNIVERSIDADES, paginaExaniUniversidad, paginaSelector } from '../src/simulador/exani-universidades.js';

const EX = simuladorDe('simulador-exani-ii');
const { REACTIVOS, TEMAS, TEXTOS, AREAS, SECCIONES } = EX.BANCO;
const COMUNES = ['comprension_lectora', 'redaccion_indirecta', 'pensamiento_matematico', 'ingles'];
const SECS = [...COMUNES, ...MODULOS.map(m => m[0])];

describe('Simulador EXANI-II · banco', () => {
  it('cada reactivo tiene tres opciones, una sección válida y un tema de su misma sección; ids únicos', () => {
    expect(new Set(REACTIVOS.map(r => r.id)).size).toBe(REACTIVOS.length);
    for (const r of REACTIVOS) {
      expect(SECS, r.id).toContain(r.seccion);
      expect(r.opciones, r.id).toHaveLength(3);
      expect(TEMAS[r.tema]?.seccion, `${r.id}: ${r.tema}`).toBe(r.seccion);
      if (r.texto) expect(TEXTOS[r.texto]?.seccion, r.id).toBe(r.seccion);
    }
    expect(new Set(SECCIONES.map(s => s.id))).toEqual(new Set(SECS));
  });

  it('alcanza para dos exámenes completos sin repetir con cualquier pareja de módulos', () => {
    const por = Object.fromEntries(SECS.map(m => [m, REACTIVOS.filter(r => r.seccion === m).length]));
    for (const a of AREAS) for (const m of a.materias) expect(por[m.id], `${a.id} · ${m.id}`).toBeGreaterThanOrEqual(m.reactivos * 2);
  });
});

describe('Simulador EXANI-II · examen', () => {
  it('cada pareja: 3 áreas de 30, sus 2 módulos de 24 e Inglés 30 = 168 reactivos en 270 min', () => {
    expect(AREAS.map(a => a.id)).toEqual(PAREJAS.map(p => p[0]));
    for (const a of AREAS) {
      expect(a.examen).toEqual({ reactivos: 168, minutos: 270 });
      const ids = a.materias.map(m => m.id);
      const p = PAREJAS.find(x => x[0] === a.id);
      expect(ids).toEqual(['comprension_lectora', 'redaccion_indirecta', 'pensamiento_matematico', p[1], p[2], 'ingles']);
      expect(a.medio.reactivos).toBe(84);
    }
  });

  it('arma un examen de 168 reactivos distintos, cada uno en su sección, con cada pareja', () => {
    const por = Object.fromEntries(REACTIVOS.map(r => [r.id, r]));
    for (const a of AREAS) {
      const secs = armarPorMaterias(EX.BANCO, a.materias, Math.random, new Set(), 'oficial');
      expect(new Set(secs.flat()).size, a.id).toBe(168);
      secs.forEach((s, i) => s.forEach(id => expect(por[id].seccion, `${a.id} · ${id}`).toBe(a.materias[i].id)));
    }
  });

  it('el diagnóstico gratis: 12 preguntas de las 4 secciones comunes (aunque las lecturas sean largas)', () => {
    for (let i = 0; i < 10; i++) {
      const d = armarDiagnostico(EX.BANCO, Math.random);
      expect(d.map(s => s.id)).toEqual(COMUNES);
      expect(d.flatMap(s => s.items)).toHaveLength(12);
    }
  });

  it('las parejas usan módulos que existen y no se repiten', () => {
    const ids = MODULOS.map(m => m[0]);
    expect(new Set(PAREJAS.map(p => p[0])).size).toBe(PAREJAS.length);
    for (const [, a, b] of PAREJAS) { expect(ids).toContain(a); expect(ids).toContain(b); expect(a).not.toBe(b); }
  });
});

describe('EXANI-II por universidad', () => {
  it('cada universidad tiene página con fuente oficial y sus módulos apuntan a parejas del simulador', async () => {
    const parejas = new Set(PAREJAS.map(p => p[0]));
    for (const [k, u] of Object.entries(UNIVERSIDADES)) {
      expect(u.fuentes.length, k).toBeGreaterThan(0);
      for (const f of u.fuentes) expect(f.url, k).toMatch(/^https:\/\//);
      for (const [, p] of u.modulos || []) if (p) expect(parejas.has(p), `${k}: ${p}`).toBe(true);
      const html = await paginaExaniUniversidad(k).text();
      expect(html).toContain(`https://vorka.mx/simulador-exani-ii/${k}/`);
      expect(html).toContain('No estamos afiliados');
    }
    expect(paginaExaniUniversidad('no-existe')).toBe(null);
  });

  it('«¿Cuál te sirve?» manda la UAQ y la UG a EXCOBA (no EXANI-II) y la BUAP al simulador', async () => {
    const html = await paginaSelector().text();
    expect(html).toMatch(/UAQ[\s\S]*?EXCOBA/);
    expect(html).toContain('href="/simulador-exani-ii/buap/"');
    expect(html).toContain('href="/simulador-unam/"');
  });
});
