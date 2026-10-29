// Cupones de regalo (migración 0055, src/cupones-regalo.js y src/descuentos.js): se crean en Vorka OS › Tienda › Regalar,
// son transferibles y se aplican como cualquier código: % o monto, alcance (tienda, línea o producto), usos, vigencia, no
// acumulables (gana el mayor y el referido sigue ganando puntos), cobro mínimo, Stripe, «Pagas hoy», ?cupon= y envío por correo.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import vm from 'node:vm';
import fs from 'node:fs';
import { d1 } from './d1.js';
import worker, { Admin } from '../src/index.js';
import { aplicarPago, crearOrden } from '../src/modelo.js';
import { puntosAlPagar } from '../src/puntos.js';
import { CLIENTE_DESCUENTO, centavosMonto, evaluarCodigo } from '../src/descuentos.js';
import { codigoAzar, FORMATO_CODIGO, leerDestinatarios, crearCuponesRegalo, enviarCuponRegalo, revocarCuponesRegalo, cuponesRegalo } from '../src/cupones-regalo.js';
import { COBRO_MINIMO } from '../src/puntos-reglas.js';

const SITIO = 'https://vorka.mx';
let env, llamadas, cupones, ip, correos, correoFalla;

function stripeFalso() {
  llamadas = []; cupones = new Map();
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const params = new URLSearchParams(init.body);
    llamadas.push({ url, init, params });
    const ok = b => new Response(JSON.stringify(b));
    const ruta = String(url).replace('https://api.stripe.com/v1', '');
    if (ruta === '/customers') return ok({ id: 'cus_1' });
    if (ruta.startsWith('/coupons')) {
      if (init.method === 'GET') {
        const c = cupones.get(decodeURIComponent(ruta.slice('/coupons/'.length)));
        return c ? ok(c) : new Response(JSON.stringify({ error: { code: 'resource_missing' } }), { status: 404 });
      }
      const id = params.get('id') || `cupon_${cupones.size + 1}`;
      if (cupones.has(id)) return new Response(JSON.stringify({ error: { code: 'resource_already_exists' } }), { status: 400 });
      const n = k => params.get(k) ? Number(params.get(k)) : null;
      const c = { id, valid: true, percent_off: n('percent_off'), amount_off: n('amount_off'), currency: params.get('currency'), duration: params.get('duration'), name: params.get('name'), max_redemptions: n('max_redemptions') };
      cupones.set(id, c);
      return ok(c);
    }
    if (ruta === '/checkout/sessions') return ok({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/cs_x' });
    return new Response('{}', { status: 404 });
  }));
}
const sesion = () => llamadas.filter(l => l.url === 'https://api.stripe.com/v1/checkout/sessions').at(-1).params;
const postsCupon = () => llamadas.filter(l => String(l.url).startsWith('https://api.stripe.com/v1/coupons') && l.init.method === 'POST');
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': `10.1.0.${++ip}`, ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined }), env);
let n = 0;
const comprar = (extra = {}, op = {}) => pedir('/api/checkout', { method: 'POST', ...op,
  body: { nombre: 'Laura Pérez', email: `cliente${++n}@correo.mx`, terminos: true, slug: 'de-idea-a-proyecto', ...extra } });
const ultima = () => env.DB.raw.prepare('SELECT * FROM orders ORDER BY rowid DESC LIMIT 1').get();
const precio = slug => env.DB.raw.prepare('SELECT precio_centavos FROM products WHERE slug = ?').get(slug).precio_centavos;
const idDe = slug => env.DB.raw.prepare('SELECT id FROM products WHERE slug = ?').get(slug).id;
const fila = c => env.DB.raw.prepare('SELECT * FROM cupones_regalo WHERE codigo = ?').get(c);
const pagar = (o, monto = o.monto_centavos) => aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: monto, moneda: 'MXN', provider_payment_id: `pi_${o.id}` });
const uno = async (d = {}) => (await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'tienda', ...d })).cupones[0].codigo;

beforeEach(() => {
  ip = 0; correos = []; correoFalla = false;
  // Correo simulado: la clase Correo de Vorka OS por el binding CORREO (nunca se manda nada de verdad)
  env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64),
    CORREO: { enviar: async m => { if (correoFalla) throw new Error('Resend 500: caído'); correos.push(m); return { id: `c_${correos.length}` }; } } };
  env.DB.raw.exec("UPDATE products SET activo = 1; INSERT INTO affiliates (code, nombre, email, comision_pct, tipo) VALUES ('ANA', 'Ana López', 'ana@vorka.mx', 0, 'puntos');");
  stripeFalso();
});
afterEach(() => vi.unstubAllGlobals());

describe('crear cupones de regalo', () => {
  it('códigos legibles REGALO-XXXX-XXXX, sin caracteres ambiguos y únicos', () => {
    const vistos = new Set();
    for (let i = 0; i < 2000; i++) { const c = codigoAzar(); expect(c).toMatch(FORMATO_CODIGO); expect(c.slice(7)).not.toMatch(/[01ILO]/); vistos.add(c); }
    expect(vistos.size).toBe(2000);
  });

  it('por omisión: 1 uso y 90 días; se crean de 1 a 50 por tanda; «para» y nota son internos', async () => {
    const r = await crearCuponesRegalo(env, { tipo: 'pct', pct: 15, alcance: 'tienda', cantidad: 3, para: 'Sorteo', nota: 'Instagram' });
    expect(r.cupones).toHaveLength(3);
    expect(new Set(r.cupones.map(c => c.codigo)).size).toBe(3);
    const f = fila(r.cupones[0].codigo);
    expect(f).toMatchObject({ tipo: 'pct', pct: 15, max_usos: 1, usos: 0, alcance: 'tienda', para: 'Sorteo', nota: 'Instagram', lote: r.lote });
    const dias = (Date.parse(f.hasta) - Date.parse(new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10))) / 864e5;
    expect(dias).toBe(90);
    expect(r.cupones[0].url).toBe(`${SITIO}/tienda/?cupon=${r.cupones[0].codigo}`);
    await expect(crearCuponesRegalo(env, { tipo: 'pct', pct: 4, alcance: 'tienda' })).rejects.toThrow('5 a 100');
    await expect(crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'tienda', cantidad: 51 })).rejects.toThrow('50');
    await expect(crearCuponesRegalo(env, { tipo: 'monto', alcance: 'tienda' })).rejects.toThrow('monto');
    await expect(crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'linea', linea: 'nada' })).rejects.toThrow('línea');
    await expect(crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'producto', product_id: 'no-existe' })).rejects.toThrow('producto');
    await expect(crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'tienda', hasta: '2020-01-01' })).rejects.toThrow('antes de hoy');
  });

  it('la liga de un cupón de un producto lleva a su ficha; la de una línea, a la tienda en esa línea', async () => {
    const p = (await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'producto', product_id: idDe('vuelve-mensual') })).cupones[0];
    expect(p.url).toBe(`${SITIO}/tienda/vuelve/?cupon=${p.codigo}`);
    const g = (await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'producto', product_id: idDe('de-idea-a-proyecto') })).cupones[0];
    expect(g.url).toBe(`${SITIO}/tienda/de-idea-a-proyecto/?cupon=${g.codigo}`);
    const l = (await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'linea', linea: 'examenes' })).cupones[0];
    expect(l.url).toBe(`${SITIO}/tienda/?cupon=${l.codigo}#examenes`);
  });
});

describe('pago único', () => {
  it('porcentaje: descuento sobre el precio, un solo cupón amount_off de un uso en Stripe', async () => {
    const c = await uno({ pct: 20 });
    const r = await comprar({ codigo: c.toLowerCase() });
    expect((await r.json()).descuento).toBe(`${c}: 20 % de descuento (cupón de regalo)`);
    const p = precio('de-idea-a-proyecto'), d = Math.round(p * 0.2);
    expect(ultima()).toMatchObject({ descuento_codigo: c, descuento_pct: 20, descuento_duracion: null, descuento_codigo_centavos: d, monto_centavos: p - d });
    const [cup] = postsCupon();
    expect(cup.params.get('amount_off')).toBe(String(d));
    expect(cup.params.get('max_redemptions')).toBe('1');
    expect(cup.params.get('name')).toBe(`${c} 20 %`);
  });

  it('monto fijo: descuenta el monto exacto', async () => {
    const c = await uno({ tipo: 'monto', pct: undefined, monto_pesos: 100 });
    await comprar({ codigo: c });
    expect(ultima()).toMatchObject({ descuento_codigo: c, descuento_pct: null, descuento_codigo_centavos: 10000, descuento_monto_centavos: 10000, monto_centavos: precio('de-idea-a-proyecto') - 10000 });
    expect(postsCupon()[0].params.get('name')).toBe(`${c} $100`);
  });

  it('monto mayor que el precio: deja el cobro mínimo y lo que sobra se pierde (sin saldo)', async () => {
    const c = await uno({ tipo: 'monto', pct: undefined, monto_pesos: 5000, max_usos: 2 });
    await comprar({ codigo: c });
    const p = precio('de-idea-a-proyecto');
    expect(ultima()).toMatchObject({ monto_centavos: COBRO_MINIMO, descuento_codigo_centavos: p - COBRO_MINIMO, descuento_monto_centavos: 500000 });
    await pagar(ultima());
    // El cupón no guarda saldo: el siguiente uso vuelve a valer el monto completo, nada más (no se acumula lo que sobró)
    expect(fila(c).usos).toBe(1);
    await comprar({ codigo: c, slug: 'evaluacion-liderazgo' });
    expect(ultima().descuento_codigo_centavos).toBe(precio('evaluacion-liderazgo') - COBRO_MINIMO);
  });

  it('100 %: siempre queda el cobro mínimo de $10', async () => {
    const c = await uno({ pct: 100 });
    await comprar({ codigo: c });
    expect(ultima().monto_centavos).toBe(COBRO_MINIMO);
  });

  it('se combina con los puntos de quien compra (el cupón primero, los puntos sobre lo que queda)', async () => {
    const c = await uno({ pct: 20 });
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('beto@mail.com', 'bono', 50, 'prueba')");
    const o = await crearOrden(env, { items: [{ slug: 'de-idea-a-proyecto' }], email: 'beto@mail.com', nombre: 'Beto', puntos: { email: 'beto@mail.com', disponibles: 50 },
      descuento: (await evaluarCodigo(env, c, { lineas: null })) });
    const p = precio('de-idea-a-proyecto'), d = Math.round(p * 0.2);
    expect(o).toMatchObject({ descuento_codigo_centavos: d, puntos_usados: 50, descuento_centavos: d + 5000, monto_centavos: p - d - 5000 });
  });
});

describe('suscripciones: solo el primer cobro (once)', () => {
  it('porcentaje: cupón percent_off once reutilizable por valor', async () => {
    const c = await uno({ pct: 25, max_usos: 5 });
    const r = await comprar({ slug: 'vuelve-mensual', codigo: c, sucursales: 2 });
    expect((await r.json()).descuento).toBe(`${c}: 25 % en tu primer pago (cupón de regalo)`);
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_regalo_25p_once');
    expect(cupones.get('vorka_regalo_25p_once')).toMatchObject({ percent_off: 25, duration: 'once' });
    const t = precio('vuelve-mensual') + 2 * precio('vuelve-sucursal-mensual');
    expect(ultima()).toMatchObject({ descuento_duracion: 'once', descuento_codigo_centavos: Math.round(t * 0.25), monto_centavos: t - Math.round(t * 0.25) });
    // Otro cupón con el mismo % usa el mismo cupón de Stripe
    const c2 = await uno({ pct: 25 });
    await comprar({ slug: 'agenda-mensual', codigo: c2 });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_regalo_25p_once');
    expect(postsCupon()).toHaveLength(1);
    expect(sesion().has('allow_promotion_codes')).toBe(false);
  });

  it('monto fijo: cupón amount_off once en pesos', async () => {
    const c = await uno({ tipo: 'monto', pct: undefined, monto_pesos: 200 });
    await comprar({ slug: 'vuelve-anual', codigo: c });
    expect(sesion().get('discounts[0][coupon]')).toBe('vorka_regalo_20000c_once');
    expect(cupones.get('vorka_regalo_20000c_once')).toMatchObject({ amount_off: 20000, currency: 'mxn', duration: 'once' });
    expect(ultima()).toMatchObject({ descuento_duracion: 'once', descuento_codigo_centavos: 20000, monto_centavos: precio('vuelve-anual') - 20000 });
  });

  it('un % que topa con el cobro mínimo se manda como monto exacto (Stripe cobra lo mismo que la orden)', async () => {
    const c = await uno({ pct: 100 });
    await comprar({ slug: 'cuentas-mensual', codigo: c });
    const d = precio('cuentas-mensual') - COBRO_MINIMO;
    expect(sesion().get('discounts[0][coupon]')).toBe(`vorka_regalo_${d}c_once`);
    expect(ultima().monto_centavos).toBe(COBRO_MINIMO);
  });
});

describe('alcance', () => {
  it('por línea: aplica en Educación y no en Negocios (con mensaje claro)', async () => {
    const c = await uno({ alcance: 'linea', linea: 'examenes', max_usos: 3 });
    await comprar({ codigo: c, slug: 'simulador-paa' });
    expect(ultima().descuento_codigo).toBe(c);
    const j = await (await comprar({ codigo: c, slug: 'vuelve-mensual' })).json();
    expect(j.aviso).toBe(`El cupón ${c} es solo para productos de Educación.`);
    expect(ultima()).toMatchObject({ descuento_codigo: null, monto_centavos: precio('vuelve-mensual') });
  });

  it('por producto: aplica solo en ese producto', async () => {
    const c = await uno({ alcance: 'producto', product_id: idDe('evaluacion-liderazgo'), max_usos: 3 });
    await comprar({ codigo: c, slug: 'evaluacion-liderazgo' });
    expect(ultima().descuento_codigo).toBe(c);
    const j = await (await comprar({ codigo: c, slug: 'de-idea-a-proyecto' })).json();
    expect(j.aviso).toMatch(/es solo para Evaluación/);
    expect(ultima().descuento_codigo).toBeNull();
  });

  it('nunca en productos de creadores', async () => {
    env.DB.raw.exec(`INSERT INTO creadores (id, nombre, email, estado, stripe_listo) VALUES ('cre_1', 'Crea', 'c@x.mx', 'aprobado', 1);
      INSERT INTO products (id, slug, nombre, precio_centavos, activo, categoria, creador_id, revision) VALUES ('p_cre', 'guia-creador', 'Guía', 20000, 1, 'kits', 'cre_1', 'aprobado')`);
    const c = await uno();
    const j = await (await comprar({ codigo: c, slug: 'guia-creador' })).json();
    expect(j.aviso).toBe(`El cupón ${c} solo aplica en productos de Vorka México, no en los de creadores.`);
  });

  it('Brindi: un cupón de un plan no descuenta los complementos (la página y el servidor igual)', async () => {
    const c = await uno({ alcance: 'producto', product_id: idDe('brindi-intimo'), pct: 50 });
    await pedir('/api/checkout', { method: 'POST', body: { nombre: 'Laura', email: 'l@x.mx', terminos: true, codigo: c, items: [{ slug: 'brindi-intimo', cantidad: 1 }, { slug: 'brindi-musica', cantidad: 1 }] } });
    const p = precio('brindi-intimo'), m = precio('brindi-musica');
    expect(ultima().monto_centavos).toBe(p + m - Math.round(p / 2));
    const { descuento } = await (await pedir(`/api/puntos/liga?c=${c}&slug=brindi-intimo`)).json();
    expect(descuento.slugs).toEqual(['brindi-intimo']);
    const VD = navegador(); VD.fijar(descuento);
    expect(VD.en('brindi-musica')).toBe(false);
    expect(VD.hoy(p + m, p)).toBe(ultima().monto_centavos);
  });
});

describe('transferible, usos, vigencia y revocar', () => {
  it('otro correo puede usarlo; el uso cuenta al pagar, no al abrir el pago', async () => {
    const c = await uno({ max_usos: 2 });
    await comprar({ codigo: c });
    const a = ultima();
    expect(fila(c).usos).toBe(0);
    await pagar(a);
    expect(fila(c).usos).toBe(1);
    await pagar(a);   // el webhook repetido no cuenta dos veces
    expect(fila(c).usos).toBe(1);
    await comprar({ codigo: c });   // otra persona, otro correo
    const b = ultima();
    expect(b.email).not.toBe(a.email);
    expect(b.descuento_codigo).toBe(c);
    await pagar(b);
    expect(fila(c).usos).toBe(2);
    const j = await (await comprar({ codigo: c })).json();
    expect(j.aviso).toBe(`El cupón ${c} ya se usó las 2 veces que permitía.`);
    expect(ultima().descuento_codigo).toBeNull();
  });

  it('con un uso apartado por una compra sin pagar, otro correo no lo puede abrir (el mismo correo sí)', async () => {
    const c = await uno();
    await pedir('/api/checkout', { method: 'POST', body: { nombre: 'Uno', email: 'uno@x.mx', terminos: true, slug: 'de-idea-a-proyecto', codigo: c } });
    const j = await (await comprar({ codigo: c })).json();
    expect(j.aviso).toMatch(/está en otra compra que espera su pago/);
    await pedir('/api/checkout', { method: 'POST', body: { nombre: 'Uno', email: 'uno@x.mx', terminos: true, slug: 'de-idea-a-proyecto', codigo: c } });
    expect(ultima()).toMatchObject({ email: 'uno@x.mx', descuento_codigo: c });
  });

  it('agotado, vencido y revocado no aplican', async () => {
    const usado = await uno();
    env.DB.raw.exec(`UPDATE cupones_regalo SET usos = 1 WHERE codigo = '${usado}'`);
    expect((await (await comprar({ codigo: usado })).json()).aviso).toBe(`El cupón ${usado} ya se usó.`);
    const viejo = await uno();
    env.DB.raw.exec(`UPDATE cupones_regalo SET hasta = '2026-01-31' WHERE codigo = '${viejo}'`);
    expect((await (await comprar({ codigo: viejo })).json()).aviso).toBe(`El cupón ${viejo} venció el 31 de enero de 2026.`);
    const rev = await uno();
    await revocarCuponesRegalo(env, { codigo: rev, por: 'brandon@vorka.mx' });
    expect((await (await comprar({ codigo: rev })).json()).aviso).toBe(`El cupón ${rev} ya no está vigente.`);
    expect(ultima().descuento_codigo).toBeNull();
    // vence al terminar el día en hora del centro de México
    env.DB.raw.exec(`UPDATE cupones_regalo SET hasta = '2026-10-27' WHERE codigo = '${viejo}'`);
    expect((await evaluarCodigo(env, viejo, { ahora: '2026-10-28T05:59:00.000Z' })).valido).toBe(true);
    expect((await evaluarCodigo(env, viejo, { ahora: '2026-10-28T06:00:00.000Z' })).valido).toBe(false);
  });

  it('revocar una tanda solo apaga los que siguen vigentes', async () => {
    const r = await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'tienda', cantidad: 3 });
    env.DB.raw.exec(`UPDATE cupones_regalo SET usos = 1 WHERE codigo = '${r.cupones[0].codigo}'`);
    expect(await revocarCuponesRegalo(env, { lote: r.lote })).toEqual({ revocados: 2 });
    expect(fila(r.cupones[0].codigo).revocado_at).toBeNull();
  });
});

describe('no se acumula', () => {
  it('con FUNDADOR30: un solo campo, se aplica solo el cupón y FUNDADOR30 no gasta lugar', async () => {
    const c = await uno({ pct: 40 });
    await comprar({ slug: 'vuelve-mensual', codigo: c });
    await pagar(ultima());
    expect(ultima().descuento_codigo).toBe(c);
    expect(sesion().getAll('discounts[0][coupon]')).toHaveLength(1);
    expect(sesion().has('discounts[1][coupon]')).toBe(false);
    expect(env.DB.raw.prepare("SELECT usos FROM codigos_descuento WHERE codigo = 'FUNDADOR30'").get().usos).toBe(0);
  });

  it('con el 5 %: gana el cupón si da más y quien recomendó igual suma sus puntos', async () => {
    const c = await uno({ pct: 20 });
    await comprar({ codigo: c }, { cookie: 'vorka_ref=ANA' });
    const o = ultima();
    expect(o).toMatchObject({ descuento_codigo: c, ref_code: 'ANA' });
    await pagar(o);
    await puntosAlPagar(env, o.id);
    const g = env.DB.raw.prepare("SELECT * FROM puntos_movimientos WHERE order_id = ? AND tipo = 'ganado'").get(o.id);
    expect(g.email).toBe('ana@vorka.mx');
    expect(g.base_centavos).toBe(o.monto_centavos);
  });

  it('con el 5 %: si el 5 % da más, se aplica el 5 %, se avisa y el cupón no gasta uso', async () => {
    const c = await uno({ tipo: 'monto', pct: undefined, monto_pesos: 10 });
    const j = await (await comprar({ codigo: c, slug: 'vuelve-anual' }, { cookie: 'vorka_ref=ANA' })).json();
    expect(j.aviso).toBe(`El cupón ${c} no se acumula con el 5 % por recomendación: se aplica el que te da más descuento en esta compra.`);
    const o = ultima();
    expect(o).toMatchObject({ descuento_codigo: 'REFERIDO', ref_code: 'ANA' });
    await pagar(o);
    expect(fila(c).usos).toBe(0);
  });
});

function navegador() {
  const ctx = { window: {}, document: { dispatchEvent() {} }, Event: class {} };
  vm.runInNewContext(CLIENTE_DESCUENTO, ctx);
  return ctx.window.VD;
}

describe('«Pagas hoy» en la página de compra', () => {
  it('monto fijo: la página calcula lo mismo que el servidor y dice cuánto se pierde', async () => {
    const c = await uno({ tipo: 'monto', pct: undefined, monto_pesos: 5000, max_usos: 5 });
    const { descuento, texto } = await (await pedir(`/api/puntos/liga?c=${c}&slug=de-idea-a-proyecto`)).json();
    expect(texto).toBe(`${c}: $5,000 MXN de descuento (cupón de regalo)`);
    expect(descuento).toMatchObject({ pct: null, monto: 500000, duracion: null, slugs: null, etiqueta: 'cupón de regalo' });
    const sobra = { hidden: true, textContent: '' };
    const ctx = { window: {}, document: { dispatchEvent() {}, getElementById: id => id === 'codigo-sobra' ? sobra : null }, Event: class {} };
    vm.runInNewContext(CLIENTE_DESCUENTO, ctx);
    const VD = ctx.window.VD;
    VD.fijar(descuento);
    const p = precio('de-idea-a-proyecto');
    await comprar({ codigo: c });
    expect(VD.hoy(p)).toBe(ultima().monto_centavos);
    expect(sobra.hidden).toBe(false);
    expect(sobra.textContent).toBe(`Tu cupón es de $5,000 MXN: en esta compra se descuentan ${VD.pesos(p - COBRO_MINIMO)} (siempre se cobran al menos $10 MXN). Lo que sobra (${VD.pesos(500000 - p + COBRO_MINIMO)}) se pierde: no queda como saldo.`);
    for (let t = COBRO_MINIMO; t < 300000; t += 991) expect(VD.hoy(t)).toBe(t - centavosMonto(t, t, 500000, COBRO_MINIMO));
  });

  it('suscripción con %: «Pagas hoy … (cupón de regalo) y luego …»', async () => {
    const c = await uno({ pct: 50 });
    const { descuento } = await (await pedir(`/api/puntos/liga?c=${c}&slug=vuelve-mensual`)).json();
    const VD = navegador(); VD.fijar(descuento);
    expect(VD.frase(39900, 'al mes')).toEqual({ hoy: '$199.50 MXN', luego: '(cupón de regalo) y luego $399 MXN al mes' });
  });
});

// Ejecuta el script de la página de compra con un DOM mínimo: lo que hace al cargar con ?cupon= o con uno guardado
async function cargarCompra(ruta, { guardado = null } = {}) {
  const html = await (await pedir(ruta)).text();
  const scripts = [...html.matchAll(/<script nonce="[^"]+">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const socio = scripts.find(s => s.includes('t-socio-abrir')), cupon = scripts.find(s => s.includes("localStorage.setItem('vorka_cupon'"));
  const el = (extra = {}) => ({ hidden: false, value: '', textContent: '', className: '', classList: { add() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, focus() {}, ...extra });
  const nodos = { button: el(), '.t-socio-c': el({ hidden: true }), input: el(), '#codigo-msj': el() };
  const caja = el({ querySelector: s => nodos[s] });
  const terminos = el({ closest: () => el({ before() {} }) });
  const form = el({ querySelector: s => s === 'input[name=terminos]' ? terminos : s.includes('slug') ? { value: new URL(SITIO + ruta).pathname.split('/').filter(Boolean).at(-1) } : null });
  const almacen = new Map(guardado ? [['vorka_cupon', JSON.stringify({ c: guardado, t: Date.now() })]] : []);
  const fijados = [];
  const ctx = {
    location: { search: new URL(SITIO + ruta).search }, URLSearchParams, JSON, Date, String, encodeURIComponent, setTimeout, clearTimeout,
    localStorage: { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: k => almacen.delete(k) },
    window: { fetch: true, VD: { fijar: d => fijados.push(d) } },
    document: { getElementById: id => id === 'form-compra' ? form : null, createElement: () => caja, querySelectorAll: () => [], createTextNode: t => t },
    fetch: async (u, o) => pedir(u, o),
  };
  ctx.window.document = ctx.document;
  vm.runInNewContext(cupon, ctx);
  vm.runInNewContext(socio.replace('if(window.VD)', 'if(window.VD)').replace(/VD\.fijar/g, 'window.VD.fijar'), ctx);
  await new Promise(r => setTimeout(r, 60));
  return { input: nodos.input, abierto: !nodos['.t-socio-c'].hidden, almacen, fijados };
}

describe('?cupon= en la tienda', () => {
  it('la ficha del producto con ?cupon= prellena el campo, lo revisa y lo guarda para otras páginas', async () => {
    const c = await uno({ pct: 20 });
    const r = await cargarCompra(`/tienda/de-idea-a-proyecto/?cupon=${c.toLowerCase()}`);
    expect(r.input.value).toBe(c);
    expect(r.abierto).toBe(true);
    expect(r.fijados.at(-1)).toMatchObject({ pct: 20, etiqueta: 'cupón de regalo' });
    expect(JSON.parse(r.almacen.get('vorka_cupon')).c).toBe(c);
  });

  it('desde la portada (/tienda/?cupon=) llega guardado a la página de compra; si ya no sirve, se olvida', async () => {
    const c = await uno({ pct: 20 });
    const h = await (await pedir(`/tienda/?cupon=${c}`)).text();
    expect(h).toContain('Tienes un cupón de regalo');
    expect(h).toContain(c);
    expect(h).toMatch(/20 % de descuento en toda la tienda de Vorka México, hasta el/);
    const r = await cargarCompra('/tienda/de-idea-a-proyecto/', { guardado: c });
    expect(r.input.value).toBe(c);
    env.DB.raw.exec(`UPDATE cupones_regalo SET usos = 1 WHERE codigo = '${c}'`);
    const v = await cargarCompra('/tienda/de-idea-a-proyecto/', { guardado: c });
    expect(v.input.value).toBe('');
    expect(v.almacen.has('vorka_cupon')).toBe(false);
    // la portada también avisa si el cupón ya no sirve
    expect(await (await pedir(`/tienda/?cupon=${c}`)).text()).toContain(`El cupón ${c} ya se usó.`);
  });
});

describe('envío por correo', () => {
  it('lote con «Nombre, correo»: un cupón por persona y a cada una le llega el suyo', async () => {
    const r = await crearCuponesRegalo(env, { tipo: 'monto', monto_pesos: 150, alcance: 'linea', linea: 'eventos', destinatarios: 'Sofía Ruiz, sofia@correo.mx\nmario@correo.mx\n\nLuis; LUIS@correo.mx' });
    expect(r.cupones).toHaveLength(3);
    expect(r.enviados).toBe(3);
    expect(correos.map(m => m.para)).toEqual(['sofia@correo.mx', 'mario@correo.mx', 'luis@correo.mx']);
    const m = correos[0];
    expect(m.asunto).toBe('Sofía, te regalamos un cupón de Vorka México');
    expect(m.de).toBe('Vorka México <tienda@vorka.mx>');
    for (const t of [r.cupones[0].codigo, '$150 MXN de descuento', 'los productos de Eventos', 'Usar mi cupón', `?cupon=${r.cupones[0].codigo}`, 'Es transferible:', 'regálaselo a alguien más'])
      expect(m.html).toContain(t);
    expect(m.texto).toContain(`Usar mi cupón: ${SITIO}/tienda/?cupon=${r.cupones[0].codigo}#eventos`);
    expect(correos[1].html).toContain(r.cupones[1].codigo);
    expect(correos[1].html).not.toContain(r.cupones[0].codigo);
    expect(fila(r.cupones[0].codigo)).toMatchObject({ envio_nombre: 'Sofía Ruiz', envio_email: 'sofia@correo.mx', envio_estado: 'enviado', envios: 1, para: null });
    expect(r.cupones[0].envio).toMatchObject({ email: 'sofia@correo.mx', estado: 'enviado' });
  });

  it('el correo no amarra el cupón: otra persona lo puede usar', async () => {
    const r = await crearCuponesRegalo(env, { tipo: 'pct', pct: 20, alcance: 'tienda', destinatarios: 'Sofía, sofia@correo.mx' });
    await pedir('/api/checkout', { method: 'POST', body: { nombre: 'Otra', email: 'otra@x.mx', terminos: true, slug: 'de-idea-a-proyecto', codigo: r.cupones[0].codigo } });
    expect(ultima()).toMatchObject({ email: 'otra@x.mx', descuento_codigo: r.cupones[0].codigo });
  });

  it('valida los correos, sin repetidos y con tope por tanda', () => {
    expect(() => leerDestinatarios('Sofía, sofia@correo')).toThrow('Renglón 1');
    expect(() => leerDestinatarios('a@x.mx\nA@x.mx')).toThrow('repetido');
    expect(() => leerDestinatarios(Array.from({ length: 51 }, (_, i) => `p${i}@x.mx`).join('\n'))).toThrow('50');
    expect(leerDestinatarios('"Ana López", ana@x.mx')).toEqual([{ nombre: 'Ana López', email: 'ana@x.mx' }]);
  });

  it('mandar y reenviar uno ya creado; si falla se guarda y se puede reintentar', async () => {
    const c = await uno();
    await expect(enviarCuponRegalo(env, c)).rejects.toThrow('nombre y el correo');
    await expect(enviarCuponRegalo(env, c, { nombre: 'Ana', email: 'no-es-correo' })).rejects.toThrow('correo');
    correoFalla = true;
    expect(await enviarCuponRegalo(env, c, { nombre: 'Ana', email: 'ana@correo.mx' })).toMatchObject({ ok: false });
    expect(fila(c)).toMatchObject({ envio_estado: 'fallo', envios: 1, envio_email: 'ana@correo.mx' });
    correoFalla = false;
    expect(await enviarCuponRegalo(env, c)).toMatchObject({ ok: true, email: 'ana@correo.mx' });   // Reenviar
    expect(fila(c)).toMatchObject({ envio_estado: 'enviado', envio_error: null, envios: 2 });
    expect(correos).toHaveLength(1);
    await revocarCuponesRegalo(env, { codigo: c });
    await expect(enviarCuponRegalo(env, c)).rejects.toThrow('revocado');
  });

  it('por el panel (Admin): crear, listar con usos, descuento dado y órdenes, enviar y revocar', async () => {
    const a = new Admin({}, env);
    const r = await a.crearCuponesRegalo({ tipo: 'pct', pct: 20, alcance: 'tienda', max_usos: 2, nota: 'Alianza' });
    const c = r.cupones[0].codigo;
    await comprar({ codigo: c });
    await pagar(ultima());
    const l = await a.cuponesRegalo();
    const x = l.cupones.find(y => y.codigo === c);
    expect(x).toMatchObject({ estado: 'vigente', usos: 1, restantes: 1, descuento_dado_centavos: ultima().descuento_codigo_centavos, valor: '20 % de descuento', aplica_en: 'toda la tienda de Vorka México' });
    expect(x.ordenes).toEqual([expect.objectContaining({ id: ultima().id, estado: 'paid' })]);
    expect(l.lineas.map(y => y.id)).toEqual(['examenes', 'negocios', 'eventos', 'finanzas']);
    expect(l.productos.every(p => !p.slug.includes('intento') && !p.slug.includes('sucursal'))).toBe(true);
    expect(await a.enviarCuponRegalo(c, { nombre: 'Ana', email: 'ana@correo.mx' })).toMatchObject({ ok: true });
    await a.revocarCuponesRegalo({ codigo: c });
    expect((await a.cuponesRegalo()).cupones.find(y => y.codigo === c).estado).toBe('revocado');
  });
});

describe('condiciones', () => {
  it('/legal/terminos/#descuentos explica los cupones de regalo', () => {
    const h = fs.readFileSync(new URL('../../legal/terminos/index.html', import.meta.url), 'utf8');
    for (const t of ['Cupones de regalo', 'transferibles', 'no tienen valor en efectivo', 'no generan saldo', 'no se acumulan']) expect(h).toContain(t);
  });
});
