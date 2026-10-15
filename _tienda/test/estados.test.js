import { describe, it, expect } from 'vitest';
import { transicion, ESTADOS, RESULTADOS } from '../src/estados.js';

describe('máquina de estados de la orden', () => {
  it('pending + aprobado → paid y entrega', () => {
    expect(transicion('pending', 'aprobado')).toEqual({ estado: 'paid', accion: 'entregar', cambia: true });
  });
  it('OXXO/SPEI sin pagar: pending + pendiente sigue pending sin acción', () => {
    expect(transicion('pending', 'pendiente')).toEqual({ estado: 'pending', accion: null, cambia: false });
  });
  it('rechazado → failed', () => {
    expect(transicion('pending', 'rechazado').estado).toBe('failed');
  });
  it('paid + aprobado otra vez no vuelve a entregar', () => {
    expect(transicion('paid', 'aprobado')).toEqual({ estado: 'paid', accion: null, cambia: false });
  });
  it('paid + reembolsado → refunded y revoca', () => {
    expect(transicion('paid', 'reembolsado')).toEqual({ estado: 'refunded', accion: 'revocar', cambia: true });
  });
  it('un pago tardío sobre failed sí se entrega', () => {
    expect(transicion('failed', 'aprobado').accion).toBe('entregar');
  });
  it('refunded es terminal', () => {
    for (const r of RESULTADOS) expect(transicion('refunded', r).estado).toBe('refunded');
  });
  it('solo "aprobado" puede producir una entrega', () => {
    for (const e of ESTADOS) for (const r of RESULTADOS)
      if (transicion(e, r).accion === 'entregar') expect(r).toBe('aprobado');
  });
  it('rechaza estados o resultados desconocidos', () => {
    expect(() => transicion('x', 'aprobado')).toThrow();
    expect(() => transicion('pending', 'x')).toThrow();
  });
});
