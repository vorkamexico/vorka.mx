// Simulador IPN (nivel superior): banco acomodado en las 8 materias del IPN, 3 áreas de 140 reactivos y su página de venta
import { describe, it, expect } from 'vitest';
import { simuladorDe } from '../src/simulador/index.js';

const IPN = simuladorDe('simulador-ipn');
const { REACTIVOS, TEMAS, TEXTOS, AREAS, SECCIONES } = IPN.BANCO;
const MATERIAS = ['matematicas', 'escrita', 'lectora', 'quimica', 'fisica', 'biologia', 'historia', 'ingles'];

describe('Simulador IPN · banco', () => {
  it('cada reactivo está en una de las 8 materias, con un tema de su misma materia, y los ids no se repiten', () => {
    expect(new Set(REACTIVOS.map(r => r.id)).size).toBe(REACTIVOS.length);
    for (const r of REACTIVOS) {
      expect(MATERIAS, r.id).toContain(r.seccion);
      expect(TEMAS[r.tema], `${r.id}: tema ${r.tema}`).toBeTruthy();
      expect(TEMAS[r.tema].seccion, `${r.id}: ${r.tema}`).toBe(r.seccion);
      if (r.texto) { expect(TEXTOS[r.texto], r.id).toBeTruthy(); expect(TEXTOS[r.texto].seccion, r.id).toBe(r.seccion); }
    }
    expect(SECCIONES.map(s => s.id)).toEqual(MATERIAS);
  });

  it('alcanza para dos exámenes completos sin repetir en cada área', () => {
    const por = Object.fromEntries(MATERIAS.map(m => [m, REACTIVOS.filter(r => r.seccion === m).length]));
    for (const a of AREAS) for (const m of a.materias) expect(por[m.id], `${a.id} · ${m.id}`).toBeGreaterThanOrEqual(m.reactivos * 2);
  });

  it('cada área suma 140 reactivos en 3 horas; el Medio es la mitad', () => {
    expect(AREAS.map(a => a.id)).toEqual(['icfm', 'cmb', 'csa']);
    for (const a of AREAS) {
      expect(a.examen).toEqual({ reactivos: 140, minutos: 180 });
      expect(a.medio.reactivos).toBeGreaterThanOrEqual(68);
      expect(a.medio.reactivos).toBeLessThanOrEqual(72);
    }
  });
});
