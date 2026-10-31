// Borrado de los datos de quien recibe un cupón de regalo (migración 0056, src/cupones-regalo.js): lo que promete el aviso
// de privacidad (vorka.mx/privacidad/#conservamos y #arco). El cron anonimiza 12 meses después de que el cupón venció, se
// terminó de usar o se revocó; el panel borra los de un cupón o todos los de un correo (ARCO). Se conserva lo contable,
// las órdenes no se tocan y la bitácora dice quién y cuándo, nunca el dato.
import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker, { Admin, esHoraDeLimpiar } from '../src/index.js';
import { anonimizarCuponesViejos, corteConservar, cuponesRegalo } from '../src/cupones-regalo.js';

const AHORA = new Date('2026-10-29T12:00:00.000Z');   // corte: 2025-10-29T12:00Z
let env, A;
const fila = c => env.DB.raw.prepare('SELECT * FROM cupones_regalo WHERE codigo = ?').get(c);
const bitacora = () => env.DB.raw.prepare('SELECT * FROM cupones_regalo_borrados ORDER BY id').all();
let n = 0;

// Un cupón enviado por correo con todos sus datos personales; `extra` cambia vigencia, usos o revocación
function cupon(extra = {}) {
  const codigo = extra.codigo || `REGALO-TEST-${String(++n).padStart(4, '0')}`;
  const c = { codigo, lote: 'lote-1', tipo: 'monto', monto_centavos: 20000, alcance: 'tienda', max_usos: 1, usos: 0, hasta: '2027-12-31',
    para: 'Sofía (sorteo)', nota: 'Ganadora del sorteo de sofia@correo.mx', creado: '2025-01-10T18:00:00.000Z', creado_por: 'ana@vorka.mx',
    envio_nombre: 'Sofía Ruiz', envio_email: 'sofia@correo.mx', envio_at: '2025-01-10T18:01:00.000Z', envio_estado: 'enviado', envio_error: null, envios: 1, ...extra, };
  delete c.orden;
  const cols = Object.keys(c);
  env.DB.raw.prepare(`INSERT INTO cupones_regalo (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map(k => c[k]));
  if (extra.orden) env.DB.raw.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, estado, paid_at, descuento_codigo, descuento_codigo_centavos, descuento_monto_centavos)
    VALUES (?, 'quien.compra@correo.mx', 'Quien Compra', 4900, 'paid', ?, ?, 20000, 20000)`).run(crypto.randomUUID(), extra.orden, codigo);
  return codigo;
}
const anonimo = c => { const f = fila(c); return [f.envio_nombre, f.envio_email, f.envio_error, f.para, f.nota].every(v => v === null); };
const intacto = c => { const f = fila(c); return f.envio_nombre === 'Sofía Ruiz' && f.envio_email === 'sofia@correo.mx' && !!f.para && !!f.nota; };

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx' };
  A = new Admin({}, env);
});

describe('cron: anonimiza a los 12 meses', () => {
  it('el corte es de 12 meses de calendario', () => {
    expect(corteConservar(AHORA)).toBe('2025-10-29T12:00:00.000Z');
  });

  it('venció, se revocó o se terminó de usar hace más de 12 meses → anonimizado; lo reciente se queda', async () => {
    const vencidoViejo = cupon({ hasta: '2025-10-20' });
    const vencidoJusto = cupon({ hasta: '2025-10-28' });          // terminó 2025-10-29T06:00Z, antes del corte
    const vencidoReciente = cupon({ hasta: '2025-10-29' });       // termina 2025-10-30T06:00Z: aún no cumple 12 meses
    const revocadoViejo = cupon({ revocado_at: '2025-09-01T10:00:00.000Z', revocado_por: 'ana@vorka.mx' });
    const revocadoReciente = cupon({ revocado_at: '2026-01-01T10:00:00.000Z' });
    const usadoViejo = cupon({ usos: 1, orden: '2025-08-01T15:00:00.000Z' });
    const usadoReciente = cupon({ usos: 1, orden: '2026-05-01T15:00:00.000Z' });
    const usosPendientes = cupon({ max_usos: 2, usos: 1, orden: '2025-01-15T15:00:00.000Z' });  // sigue vigente: no ha terminado
    const vigente = cupon();

    const r = await anonimizarCuponesViejos(env, AHORA);
    expect(r).toEqual({ anonimizados: 4, corte: '2025-10-29T12:00:00.000Z' });
    for (const c of [vencidoViejo, vencidoJusto, revocadoViejo, usadoViejo]) expect(anonimo(c), c).toBe(true);
    for (const c of [vencidoReciente, revocadoReciente, usadoReciente, usosPendientes, vigente]) expect(intacto(c), c).toBe(true);
  });

  it('conserva lo de contabilidad y reportes, y no toca las órdenes', async () => {
    const c = cupon({ usos: 1, orden: '2025-03-01T15:00:00.000Z', hasta: '2025-06-30', envio_estado: 'fallo', envio_error: 'Resend 422: sofia@correo.mx inválido', envios: 2 });
    const antes = fila(c);
    const orden = env.DB.raw.prepare('SELECT * FROM orders WHERE descuento_codigo = ?').get(c);
    await anonimizarCuponesViejos(env, AHORA);
    const f = fila(c);
    expect(anonimo(c)).toBe(true);
    for (const k of ['codigo', 'lote', 'tipo', 'monto_centavos', 'alcance', 'max_usos', 'usos', 'hasta', 'creado', 'creado_por', 'envio_at', 'envio_estado', 'envios'])
      expect(f[k], k).toEqual(antes[k]);
    expect(env.DB.raw.prepare('SELECT * FROM orders WHERE descuento_codigo = ?').get(c)).toEqual(orden);
  });

  it('bitácora: un renglón por cupón, «automatico», sin el dato borrado; no repite en la siguiente corrida', async () => {
    const c = cupon({ hasta: '2025-01-31' });
    cupon({ hasta: '2025-01-31', para: null, nota: null, envio_nombre: null, envio_email: null, envio_at: null, envio_estado: null, envios: 0 });  // sin datos: nada que borrar
    await anonimizarCuponesViejos(env, AHORA);
    expect(await anonimizarCuponesViejos(env, AHORA)).toMatchObject({ anonimizados: 0 });
    const b = bitacora();
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ codigo: c, por: 'automatico', motivo: 'plazo' });
    expect(JSON.stringify(b)).not.toMatch(/sofia|Sofía/i);
  });

  it('corre en el cron de cada hora solo una vez al día (09 UTC)', async () => {
    expect(esHoraDeLimpiar({ scheduledTime: Date.UTC(2026, 9, 29, 9, 17) })).toBe(true);
    expect(esHoraDeLimpiar({ scheduledTime: Date.UTC(2026, 9, 29, 10, 17) })).toBe(false);
    const viejo = cupon({ hasta: '2024-12-31' });
    const espera = [], ctx = { waitUntil: p => espera.push(p) };
    await worker.scheduled({ scheduledTime: Date.UTC(2026, 9, 29, 10, 17), cron: '17 * * * *' }, env, ctx);
    await Promise.all(espera);
    expect(intacto(viejo)).toBe(true);
    await worker.scheduled({ scheduledTime: Date.UTC(2026, 9, 29, 9, 17), cron: '17 * * * *' }, env, ctx);
    await Promise.all(espera);
    expect(anonimo(viejo)).toBe(true);
  });
});

describe('panel: «Borrar datos de quien lo recibe»', () => {
  it('anonimiza de inmediato ese cupón (aunque siga vigente), deja quién y cuándo, y la lista lo muestra', async () => {
    const c = cupon(), otro = cupon();
    expect(await A.borrarDatosCupon({ codigo: c.toLowerCase(), por: 'ana@vorka.mx' })).toEqual({ ok: true, codigo: c, borrados: 1 });
    expect(anonimo(c)).toBe(true);
    expect(intacto(otro)).toBe(true);
    expect(fila(c).hasta).toBe('2027-12-31');   // el cupón sigue sirviendo
    const b = bitacora();
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ codigo: c, por: 'ana@vorka.mx', motivo: 'panel' });
    expect(b[0].borrado_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(JSON.stringify(b)).not.toMatch(/sofia|Sofía/i);
    const v = (await cuponesRegalo(env)).cupones.find(x => x.codigo === c);
    expect(v).toMatchObject({ con_datos: false, para: null, nota: null, datos_borrados: { por: 'ana@vorka.mx', motivo: 'panel' } });
    expect(v.envio).toMatchObject({ nombre: null, email: null, estado: 'enviado', envios: 1 });
    expect((await cuponesRegalo(env)).cupones.find(x => x.codigo === otro)).toMatchObject({ con_datos: true, datos_borrados: null });
  });

  it('pide quién lo borra; un cupón sin datos o que no existe responde con un mensaje claro', async () => {
    const c = cupon();
    await expect(A.borrarDatosCupon({ codigo: c })).rejects.toThrow(/quién del equipo/);
    await expect(A.borrarDatosCupon({ codigo: 'REGALO-NADA-NADA', por: 'ana@vorka.mx' })).rejects.toThrow(/no existe/);
    await A.borrarDatosCupon({ codigo: c, por: 'ana@vorka.mx' });
    await expect(A.borrarDatosCupon({ codigo: c, por: 'ana@vorka.mx' })).rejects.toThrow(/ya no tiene datos/);
    expect(bitacora()).toHaveLength(1);
  });
});

describe('panel: solicitud ARCO por correo', () => {
  it('busca el correo en el envío, «para quién», la nota y el error, sin importar mayúsculas', async () => {
    const enviado = cupon();
    const enNota = cupon({ envio_nombre: null, envio_email: null, envio_at: null, envio_estado: null, envios: 0, para: null, nota: 'Pedido por SOFIA@correo.mx' });
    const deOtra = cupon({ envio_email: 'mario@correo.mx', envio_nombre: 'Mario', para: 'Mario', nota: null });
    const r = await A.buscarDatosCuponCorreo('  Sofia@Correo.MX ');
    expect(r.email).toBe('sofia@correo.mx');
    expect(r.cupones.map(c => c.codigo).sort()).toEqual([enviado, enNota].sort());
    expect(r.cupones[0]).toHaveProperty('estado');
    expect(r.cupones.map(c => c.codigo)).not.toContain(deOtra);
    await expect(A.buscarDatosCuponCorreo('no-es-correo')).rejects.toThrow(/Revisa el correo/);
  });

  it('«Borrar todos los datos de este correo en cupones»: anonimiza todos, deja los de otras personas y la bitácora dice ARCO', async () => {
    const a = cupon(), b = cupon({ hasta: '2025-01-01' }), otra = cupon({ envio_email: 'mario@correo.mx', envio_nombre: 'Mario', para: 'Mario', nota: null });
    // Código personal de Sparks con el correo en su descripción (admin.crearCodigoRegalo)
    env.DB.raw.prepare("INSERT INTO codigos_descuento (codigo, pct, meses, max_usos, hasta, nombre) VALUES ('SPARKS-SOFIA-AB12', 20, 1, 1, '2026-12-31', 'Regalo Sparks · sofia@correo.mx')").run();
    const r = await A.borrarDatosCuponCorreo({ email: 'sofia@correo.mx', por: 'ana@vorka.mx' });
    expect(r).toEqual({ ok: true, borrados: 2, codigos: 1, resenas: 0 });
    expect(anonimo(a) && anonimo(b)).toBe(true);
    expect(fila(otra)).toMatchObject({ envio_email: 'mario@correo.mx', para: 'Mario' });
    expect(env.DB.raw.prepare("SELECT nombre FROM codigos_descuento WHERE codigo = 'SPARKS-SOFIA-AB12'").get().nombre).toBe('Regalo Sparks');
    const bit = bitacora();
    expect(bit.map(x => x.codigo).sort()).toEqual([a, b, 'SPARKS-SOFIA-AB12'].sort());
    expect(bit.every(x => x.por === 'ana@vorka.mx' && x.motivo === 'arco')).toBe(true);
    expect(JSON.stringify(bit)).not.toMatch(/sofia@|Sofía/i);   // (el código de Sparks lleva el nombre corto: es el código, no un dato del envío)
    // Ya no queda nada de ese correo
    expect(await A.buscarDatosCuponCorreo('sofia@correo.mx')).toMatchObject({ cupones: [], codigos: [] });
    expect(await A.borrarDatosCuponCorreo({ email: 'sofia@correo.mx', por: 'ana@vorka.mx' })).toEqual({ ok: true, borrados: 0, codigos: 0, resenas: 0 });
    await expect(A.borrarDatosCuponCorreo({ email: 'sofia@correo.mx' })).rejects.toThrow(/quién del equipo/);
  });
});
