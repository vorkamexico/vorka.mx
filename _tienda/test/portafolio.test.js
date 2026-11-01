import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import { Admin } from '../src/index.js';
import { lineaDe, esInterno } from '../src/portafolio.js';

let env, A;
const hace = d => new Date(Date.now() - d * 864e5).toISOString();
let n = 0;
function orden({ email, estado = 'paid', producto = 'prod_paa_paquete', monto = 37900, dias = 1, proveedor = 'stripe', recordatorio = null }) {
  const id = `ord_${++n}`;
  env.DB.raw.prepare(`INSERT INTO orders (id, email, nombre, monto_centavos, estado, proveedor, created_at, paid_at, recordatorio_at) VALUES (?, ?, 'X', ?, ?, ?, ?, ?, ?)`)
    .run(id, email, monto, estado, proveedor, hace(dias), estado === 'paid' ? hace(dias) : null, recordatorio);
  env.DB.raw.prepare('INSERT INTO order_items (order_id, product_id, nombre, precio_centavos) VALUES (?, ?, ?, ?)').run(id, producto, producto, monto);
  return id;
}
const linea = (r, clave) => r.lineas.find(l => l.clave === clave);

beforeEach(() => { env = { DB: d1() }; A = new Admin({}, env); });

describe('portafolio por línea de producto', () => {
  it('agrupa productos por línea y reconoce correos internos', () => {
    expect(lineaDe('prod_paa_paquete')).toBe('sim_paa');
    expect(lineaDe('prod_simulador_paa_examen')).toBe('sim_paa');
    expect(lineaDe('prod_agenda_vuelve_mensual')).toBe('agenda');
    expect(lineaDe('prod_de_idea_a_proyecto')).toBe('otros');
    expect(esInterno('pruebas+ruta@vorka.mx')).toBe(true);
    expect(esInterno('Yo@Gmail.com', ['yo@gmail.com'])).toBe(true);
    expect(esInterno('ana@gmail.com')).toBe(false);
  });

  it('cuenta ventas reales del periodo y del anterior, sin pruebas, cortesías ni correos internos', async () => {
    orden({ email: 'ana@gmail.com', dias: 2 });
    orden({ email: 'beto@gmail.com', dias: 40, monto: 24900 });
    orden({ email: 'pruebas@vorka.mx', dias: 1 });
    orden({ email: 'yo@gmail.com', dias: 1 });
    orden({ email: 'cora@gmail.com', dias: 1, monto: 0, proveedor: 'cortesia' });
    const r = await A.portafolio({ internos: ['yo@gmail.com'] });
    expect(linea(r, 'sim_paa')).toMatchObject({ ventas: 1, monto_centavos: 37900, ventas_previo: 1, monto_previo_centavos: 24900, ventas_total: 2, monto_total_centavos: 62800 });
    expect(linea(r, 'sim_paa').uso).toEqual({ etiqueta: 'resultados de simulador', valor: 0 });
  });

  it('el ingreso es lo cobrado con descuento, repartido entre los productos de la orden', async () => {
    const id = orden({ email: 'dani@gmail.com', dias: 1, monto: 36000 });   // lista $379, cobró $360
    env.DB.raw.prepare('UPDATE order_items SET precio_centavos = 37900 WHERE order_id = ?').run(id);
    const id2 = orden({ email: 'eli@gmail.com', dias: 1, monto: 20000, producto: 'prod_vende_mensual' });   // dos productos, cobró $200
    env.DB.raw.prepare('UPDATE order_items SET precio_centavos = 10000 WHERE order_id = ?').run(id2);
    env.DB.raw.prepare("INSERT INTO order_items (order_id, product_id, nombre, precio_centavos) VALUES (?, 'prod_cupo_pro', 'Cupo', 30000)").run(id2);
    const r = await A.portafolio({});
    expect(linea(r, 'sim_paa').monto_centavos).toBe(36000);
    expect(linea(r, 'vende').monto_centavos).toBe(5000);
    expect(linea(r, 'cupo').monto_centavos).toBe(15000);
  });

  it('lista interesados que no compraron, sin repetir correo y sin quien compró después', async () => {
    orden({ email: 'edwin@gmail.com', estado: 'failed', dias: 5 });
    orden({ email: 'edwin@gmail.com', estado: 'failed', dias: 3 });
    orden({ email: 'caro@gmail.com', estado: 'failed', dias: 4, recordatorio: hace(3) });
    orden({ email: 'caro@gmail.com', dias: 2 });
    orden({ email: 'pruebas+fundador@vorka.mx', estado: 'failed', producto: 'prod_vuelve_mensual', dias: 2 });
    orden({ email: 'vieja@gmail.com', estado: 'failed', dias: 60 });
    const r = await A.portafolio({});
    expect(linea(r, 'sim_paa').interesados.map(i => i.email)).toEqual(['edwin@gmail.com']);
    expect(linea(r, 'vuelve').interesados).toEqual([]);
  });
});
