// El JavaScript que se manda al navegador (simuladores y diagnóstico) tiene que compilar: un error de sintaxis deja la app
// en «Preparando tu simulador…» para todas las personas (pasó el 28 de oct de 2026 por un «+» faltante).
import { describe, it, expect } from 'vitest';
import * as cliente from '../src/simulador/cliente.generado.js';

describe('JavaScript de los simuladores para el navegador', () => {
  for (const [nombre, codigo] of Object.entries(cliente)) {
    if (typeof codigo !== 'string' || !/_JS$/.test(nombre)) continue;
    it(`${nombre} compila`, () => {
      expect(() => new Function(codigo)).not.toThrow();
    });
  }
});
