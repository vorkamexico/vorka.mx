import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { puntosAlPagar, puntosAlReembolsar, saldoDe, descuentoMaximo, datosApp } from '../src/puntos.js';
import { diaMx, sumarDias, nivelDe, objetivoMeta, nombrePublico } from '../src/puntos-reglas.js';

let env, llamadas;
const SITIO = 'https://vorka.mx';
function stripeFalso() {
  llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    llamadas.push({ url, params: new URLSearchParams(init?.body) });
    if (url.endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_1' }));
    if (url.endsWith('/coupons')) return new Response(JSON.stringify({ id: 'cupon_1' }));
    return new Response(JSON.stringify({ id: `cs_${llamadas.length}`, url: 'https://checkout.stripe.com/c/pay/x' }));
  }));
}
const pedir = (ruta, { method = 'GET', body, cookie } = {}) => worker.fetch(new Request(SITIO + ruta, {
  method, redirect: 'manual', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);

// Crea la cuenta de puntos y devuelve la cookie de sesión
async function entrar(email, nombre = 'Ana') {
  const rr = await pedir('/api/puntos/entrar', { method: 'POST', body: { email, nombre, terminos: true } }); const r = await rr.json();
  expect(r.enlace).toMatch(/^\/tienda\/puntos\/acceso\/[a-f0-9]{64}$/);
  const a = await pedir(r.enlace);
  expect(a.status).toBe(303);
  return a.headers.get('set-cookie').split(';')[0];
}
async function compraPagada(email, ref, slug = 'cupo-pro-100') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Comprador', ref });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN' });
  await puntosAlPagar(env, o.id);
  return o;
}

beforeEach(() => { env = { DB: d1(), SITE_URL: SITIO, STRIPE_SECRET_KEY: 'sk_test_x', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64) }; stripeFalso(); });
afterEach(() => vi.unstubAllGlobals());

describe('Programa de puntos', () => {
  it('crear cuenta da una liga propia; cada compra con ella suma 10 puntos (no las propias) y un reembolso los revierte', async () => {
    const cookie = await entrar('ana@mail.com');
    const cuenta = await (await pedir('/tienda/cuenta/', { cookie })).text();
    const code = cuenta.match(/\?ref=([A-Z0-9]+)/)[1];
    expect(cuenta).toContain('data-sensible>0</b><span>puntos</span>');
    expect(env.DB.raw.prepare("SELECT tipo FROM affiliates WHERE code = ?").get(code).tipo).toBe('puntos');

    await compraPagada('beto@mail.com', code);
    const o2 = await compraPagada('caro@mail.com', code);
    await compraPagada('ana@mail.com', code);            // comprarse a sí misma no cuenta
    await puntosAlPagar(env, o2.id);                      // reintento del webhook: no duplica
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(20);

    await aplicarPago(env, o2.id, { resultado: 'reembolsado' });
    await puntosAlReembolsar(env, o2.id);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(10);
    const s = await (await pedir('/api/puntos/saldo', { cookie })).json();
    expect(s).toMatchObject({ cuenta: true, email: 'ana@mail.com', disponibles: 10 });
    expect((await pedir('/tienda/cuenta/', { cookie })).status).toBe(200);
    // Sin sesión, la app muestra su propia entrada (correo + código), también dentro de la app instalada
    const sin = await pedir('/tienda/cuenta/');
    expect(sin.status).toBe(200);
    expect(await sin.text()).toContain('id="pv-p-correo"');
  });

  it('los puntos se canjean al pagar: cupón de Stripe por el descuento, orden por el neto y se descuentan al confirmarse', async () => {
    const cookie = await entrar('ana@mail.com');
    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('ana@mail.com', 'ajuste', 500, 'prueba')");
    // $149: el descuento deja el cobro mínimo de $10
    const r = await pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(200);
    const o = env.DB.raw.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').get();
    expect(o).toMatchObject({ descuento_centavos: 13900, monto_centavos: 1000, puntos_email: 'ana@mail.com' });
    const cupon = llamadas.find(l => l.url.endsWith('/coupons'));
    expect(cupon.params.get('amount_off')).toBe('13900');
    expect(llamadas.find(l => l.url.endsWith('/checkout/sessions')).params.get('discounts[0][coupon]')).toBe('cupon_1');
    // Mientras se paga, los puntos quedan apartados (no se pueden usar dos veces)
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(361);
    await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: 1000, moneda: 'MXN' });
    await puntosAlPagar(env, o.id);
    expect(await saldoDe(env, 'ana@mail.com')).toMatchObject({ total: 361, disponibles: 361 });
  });

  it('no deja usar puntos sin sesión ni con otro correo', async () => {
    let r = await pedir('/api/checkout', { method: 'POST', body: { slug: 'cupo-pro', nombre: 'Ana', email: 'ana@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(401);
    const cookie = await entrar('ana@mail.com');
    r = await pedir('/api/checkout', { method: 'POST', cookie, body: { slug: 'cupo-pro', nombre: 'Ana', email: 'otra@mail.com', terminos: true, usar_puntos: true } });
    expect(r.status).toBe(400);
    expect(descuentoMaximo(5, 900)).toBe(0);            // menos de $10: no hay descuento
    expect(descuentoMaximo(5, 14900)).toBe(500);
  });

  it('la página del programa, la tienda y los formularios de compra lo anuncian; los afiliados de dinero no se mezclan', async () => {
    const programa = await (await pedir('/tienda/puntos/')).text();
    expect(programa).toContain('Gana <span class="pv-metal">descuentos.</span>');
    expect(programa).toContain('id="pv-p-codigo"');           // éxito con código, sin pantalla congelada
    const tienda = await (await pedir('/tienda/')).text();
    expect(tienda).toContain('/tienda/puntos/');
    expect(await (await pedir('/tienda/cupo/')).text()).toContain("fetch('/api/puntos/saldo'");
    await entrar('ana@mail.com');
    env.DB.raw.exec("INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('PROFE', 'Profe', 15)");
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env);
    expect((await A.afiliados()).map(a => a.code)).toEqual(['PROFE']);
    expect((await A.resumenPuntos()).cuentas).toBe(1);
  });
});

// ---------- Puntos Vorka como app ----------
const codigoDeCuenta = cookie => pedir('/tienda/cuenta/', { cookie }).then(r => r.text()).then(t => t.match(/\?ref=([A-Z0-9]+)/)[1]);
const movs = (email, tipo = 'ganado') => env.DB.raw.prepare('SELECT * FROM puntos_movimientos WHERE email = ? AND tipo = ? ORDER BY id').all(email, tipo);
const avisos = email => env.DB.raw.prepare('SELECT clave, tipo, titulo FROM puntos_notificaciones WHERE email = ? ORDER BY id').all(email);

describe('Puntos Vorka · entrar con código (app instalada)', () => {
  it('el mismo correo trae enlace y código de 6 dígitos: un uso, 15 minutos, intentos limitados y solo vale el último', async () => {
    let r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email: 'Ana@Mail.com', nombre: 'Ana López', terminos: true } })).json();
    expect(r).toMatchObject({ ok: true, reenviar_en: 60 });
    expect(r.codigo).toMatch(/^\d{6}$/);
    const fila = env.DB.raw.prepare('SELECT * FROM puntos_codigos WHERE email = ?').get('ana@mail.com');
    expect(fila.codigo_hash).not.toContain(r.codigo);                               // solo el hash
    expect(new Date(fila.expira_at) - Date.now()).toBeGreaterThan(14 * 60e3);

    const malo = r.codigo === '000000' ? '111111' : '000000';
    let x = await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'ana@mail.com', codigo: malo } });
    expect(x.status).toBe(400);
    expect((await x.json()).error).toContain('quedan 4 intentos');
    // Un código nuevo invalida el anterior
    const viejo = r.codigo;
    r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email: 'ana@mail.com', terminos: true } })).json();
    if (viejo !== r.codigo) expect((await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'ana@mail.com', codigo: viejo } })).status).toBe(400);

    x = await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'ana@mail.com', codigo: r.codigo } });
    expect(x.status).toBe(200);
    const cookie = x.headers.get('set-cookie').split(';')[0];
    expect(cookie).toMatch(/^vorka_cuenta=[a-f0-9]{64}$/);
    expect(await (await pedir('/api/puntos/saldo', { cookie })).json()).toMatchObject({ cuenta: true, email: 'ana@mail.com' });
    // Un solo uso
    expect((await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'ana@mail.com', codigo: r.codigo } })).status).toBe(400);
    // El nombre se guarda para el ranking
    expect(env.DB.raw.prepare('SELECT nombre FROM puntos_cuentas WHERE email = ?').get('ana@mail.com').nombre).toBe('Ana López');
  });

  it('5 intentos fallidos bloquean el código; un código vencido no sirve', async () => {
    const r = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email: 'beto@mail.com', terminos: true } })).json();
    const malo = r.codigo === '123456' ? '654321' : '123456';
    for (let i = 0; i < 5; i++) await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'beto@mail.com', codigo: malo } });
    let x = await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'beto@mail.com', codigo: r.codigo } });
    expect(x.status).toBe(429);
    const r2 = await (await pedir('/api/puntos/entrar', { method: 'POST', body: { email: 'beto@mail.com', terminos: true } })).json();
    env.DB.raw.exec("UPDATE puntos_codigos SET expira_at = '2020-01-01T00:00:00Z'");
    x = await pedir('/api/puntos/codigo', { method: 'POST', body: { email: 'beto@mail.com', codigo: r2.codigo } });
    expect(x.status).toBe(400);
    expect((await x.json()).error).toContain('venció');
    // Otro origen no puede pedir códigos
    const ajeno = await worker.fetch(new Request(SITIO + '/api/puntos/entrar', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://malo.com' }, body: JSON.stringify({ email: 'x@mail.com', terminos: true }) }), env);
    expect(ajeno.status).toBe(403);
  });
});

describe('Puntos Vorka · cuenta con contraseña', () => {
  const sesion = r => (r.headers.get('set-cookie') || '').split(';')[0];
  it('reconoce el correo: nuevo → crea con contraseña; existente → entra con contraseña; no se duplica', async () => {
    let r = await (await pedir('/api/puntos/existe', { method: 'POST', body: { email: 'Nueva@Mail.com' } })).json();
    expect(r).toMatchObject({ existe: false, con_clave: false });
    let x = await pedir('/api/puntos/registro', { method: 'POST', body: { email: 'Nueva@Mail.com', nombre: 'Nora Pérez', clave: 'corta', terminos: true } });
    expect(x.status).toBe(400);
    x = await pedir('/api/puntos/registro', { method: 'POST', body: { email: 'Nueva@Mail.com', nombre: 'Nora Pérez', clave: 'unaclave123', terminos: true } });
    expect(x.status).toBe(200);
    const c = sesion(x); expect(c).toMatch(/^vorka_cuenta=[a-f0-9]{64}$/);
    expect((await (await pedir('/api/puntos/saldo', { cookie: c })).json()).email).toBe('nueva@mail.com');
    r = await (await pedir('/api/puntos/existe', { method: 'POST', body: { email: 'nueva@mail.com' } })).json();
    expect(r).toMatchObject({ existe: true, con_clave: true, nombre: 'Nora' });
    // otra vez con el mismo correo: no crea otra cuenta
    x = await pedir('/api/puntos/registro', { method: 'POST', body: { email: 'nueva@mail.com', nombre: 'Otra', clave: 'otraclave123', terminos: true } });
    expect(x.status).toBe(409); expect((await x.json()).con_clave).toBe(true);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM puntos_cuentas WHERE email = 'nueva@mail.com'").get().n).toBe(1);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM affiliates WHERE email = 'nueva@mail.com'").get().n).toBe(1);
    expect((await pedir('/api/puntos/login', { method: 'POST', body: { email: 'nueva@mail.com', clave: 'mala-clave' } })).status).toBe(401);
    x = await pedir('/api/puntos/login', { method: 'POST', body: { email: 'NUEVA@mail.com', clave: 'unaclave123' } });
    expect(x.status).toBe(200); expect(sesion(x)).toMatch(/^vorka_cuenta=/);
  });
  it('una cuenta de antes (sin contraseña) no se puede tomar sin el código del correo', async () => {
    await entrar('vieja@mail.com', 'Vicky');
    const r = await (await pedir('/api/puntos/existe', { method: 'POST', body: { email: 'vieja@mail.com' } })).json();
    expect(r).toMatchObject({ existe: true, con_clave: false });
    expect((await pedir('/api/puntos/registro', { method: 'POST', body: { email: 'vieja@mail.com', nombre: 'Intrusa', clave: 'tomarla123', terminos: true } })).status).toBe(409);
    expect((await pedir('/api/puntos/login', { method: 'POST', body: { email: 'vieja@mail.com', clave: 'loquesea123' } })).status).toBe(409);
    expect((await pedir('/api/puntos/clave/nueva', { method: 'POST', body: { email: 'vieja@mail.com', codigo: '000000', clave: 'tomarla123' } })).status).toBe(400);
    const cod = (await (await pedir('/api/puntos/clave/codigo', { method: 'POST', body: { email: 'vieja@mail.com' } })).json()).codigo;
    expect(cod).toMatch(/^\d{6}$/);
    const x = await pedir('/api/puntos/clave/nueva', { method: 'POST', body: { email: 'vieja@mail.com', codigo: cod, clave: 'mipropia123' } });
    expect(x.status).toBe(200);
    expect((await pedir('/api/puntos/login', { method: 'POST', body: { email: 'vieja@mail.com', clave: 'mipropia123' } })).status).toBe(200);
    // el código ya no sirve otra vez
    expect((await pedir('/api/puntos/clave/nueva', { method: 'POST', body: { email: 'vieja@mail.com', codigo: cod, clave: 'otra12345' } })).status).toBe(400);
  });
});

describe('Puntos Vorka · puntos dobles', () => {
  it('una sugerencia aceptada da 2× (20) solo a quien la sugirió y solo en ese producto; el reembolso revierte exactamente 20', async () => {
    const cookie = await entrar('ana@mail.com');
    const code = await codigoDeCuenta(cookie);
    const otra = await entrar('caro@mail.com', 'Caro');
    const codeCaro = await codigoDeCuenta(otra);
    expect((await pedir('/api/puntos/sugerir', { method: 'POST', cookie, body: { idea: 'x' } })).status).toBe(400);
    expect((await pedir('/api/puntos/sugerir', { method: 'POST', cookie, body: { idea: 'Cupo para 100 personas', para_quien: 'Fiestas chicas', por_que: 'Lo piden mucho' } })).status).toBe(200);
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env);
    const [s] = await A.sugerenciasPuntos();
    expect(s).toMatchObject({ estado: 'nueva', idea: 'Cupo para 100 personas', code });
    await expect(A.decidirSugerencia(s.id, { aceptar: true })).rejects.toThrow(/producto/);
    await A.decidirSugerencia(s.id, { aceptar: true, slug: 'cupo-pro-100', nota: '¡Gracias!' });
    expect(avisos('ana@mail.com').map(a => a.clave)).toContain(`sugerencia:${s.id}`);

    const o1 = await compraPagada('beto@mail.com', code, 'cupo-pro-100');
    await compraPagada('dani@mail.com', code, 'cupo-pro');            // otro producto: 10
    await compraPagada('eli@mail.com', codeCaro, 'cupo-pro-100');     // otra cuenta: 10
    await puntosAlPagar(env, o1.id);                                  // reintento: no duplica
    expect(movs('ana@mail.com').map(m => [m.puntos, m.multiplicador, m.motivo])).toEqual([[20, 2, 'sugerencia'], [10, 1, null]]);
    expect(movs('caro@mail.com').map(m => m.puntos)).toEqual([10]);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(30);

    await aplicarPago(env, o1.id, { resultado: 'reembolsado' });
    await puntosAlReembolsar(env, o1.id);
    await puntosAlReembolsar(env, o1.id);
    expect(movs('ana@mail.com', 'revertido').map(m => m.puntos)).toEqual([-20]);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(10);
    const app = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(app).toContain('Puntos dobles · tu idea');
    expect(app).toContain('Aceptada');
  });

  it('una promoción de puntos dobles aplica a todos en sus fechas (CDMX); fuera de fechas son 10', async () => {
    const cookie = await entrar('ana@mail.com');
    const code = await codigoDeCuenta(cookie);
    const { Admin } = await import('../src/index.js');
    const A = new Admin({}, env);
    const hoy = diaMx();
    await expect(A.guardarPromo({ slug: 'cupo-pro', inicia: hoy, termina: sumarDias(hoy, -1) })).rejects.toThrow(/antes/);
    await A.guardarPromo({ slug: 'cupo-pro', inicia: hoy, termina: sumarDias(hoy, 3), nota: 'Buen Fin' });
    await A.guardarPromo({ slug: 'cupo-pro-100', inicia: sumarDias(hoy, 1), termina: sumarDias(hoy, 5) });   // empieza mañana
    expect((await A.promosPuntos()).length).toBe(2);
    expect((await A.resumenPuntos()).promos_vigentes).toBe(1);

    const o = await compraPagada('beto@mail.com', code, 'cupo-pro');
    await compraPagada('caro@mail.com', code, 'cupo-pro-100');
    expect(movs('ana@mail.com').map(m => [m.puntos, m.motivo])).toEqual([[20, 'promo'], [10, null]]);
    expect(avisos('ana@mail.com').find(a => a.clave === `ganado:${o.id}`).titulo).toBe('¡Puntos dobles! +20 puntos');
    await aplicarPago(env, o.id, { resultado: 'reembolsado' });
    await puntosAlReembolsar(env, o.id);
    expect((await saldoDe(env, 'ana@mail.com')).disponibles).toBe(10);
    // Si la orden tiene varios productos, cuenta el mayor multiplicador (una vez por orden, sin acumular)
    const o3 = await crearOrden(env, { items: [{ slug: 'cupo-pro-100' }, { slug: 'cupo-pro' }], email: 'dani@mail.com', nombre: 'Dani', ref: code });
    await aplicarPago(env, o3.id, { resultado: 'aprobado', monto_centavos: o3.monto_centavos, moneda: 'MXN' });
    await puntosAlPagar(env, o3.id);
    expect(movs('ana@mail.com').at(-1)).toMatchObject({ puntos: 20, multiplicador: 2, motivo: 'promo', order_id: o3.id });
    expect(await (await pedir('/tienda/cuenta/', { cookie })).text()).toContain('Puntos dobles · hasta');
    await A.borrarPromo((await A.promosPuntos())[0].id);
    expect((await A.promosPuntos()).length).toBe(1);
  });
});

describe('Puntos Vorka · visitas, avisos y app', () => {
  it('cuenta una visita por persona, código y día (sin guardar IPs); bots, ligas de dinero y la propia no cuentan', async () => {
    const cookie = await entrar('ana@mail.com');
    const code = await codigoDeCuenta(cookie);
    env.DB.raw.exec("INSERT INTO affiliates (code, nombre, comision_pct) VALUES ('PROFE', 'Profe', 15)");
    const visita = (ref, ip, extra = {}) => worker.fetch(new Request(`${SITIO}/tienda/?ref=${ref}`, { headers: { 'cf-connecting-ip': ip, 'user-agent': 'Mozilla/5.0', ...extra } }), env);
    await visita(code, '9.9.9.9'); await visita(code, '9.9.9.9'); await visita(code.toLowerCase(), '8.8.8.8');
    await visita(code, '7.7.7.7', { 'user-agent': 'WhatsApp/2.23' });
    await visita(code, '6.6.6.6', { cookie });                       // la dueña abriendo su propia liga
    await visita('PROFE', '5.5.5.5');
    const filas = env.DB.raw.prepare('SELECT * FROM puntos_visitas').all();
    expect(filas.length).toBe(2);
    expect(filas.every(f => f.code === code && f.dia === diaMx() && /^[a-f0-9]{32}$/.test(f.visitante) && !f.visitante.includes('9.9.9.9'))).toBe(true);
    const d = await datosApp(env, 'ana@mail.com');
    expect(d.semana.visitas).toBe(2);
    expect(await (await pedir('/tienda/cuenta/', { cookie })).text()).toContain('2 personas abrieron</b> tu liga esta semana');
  });

  it('avisa (app, push y correo) al ganar, subir de nivel y cumplir la meta, sin repetir; borra suscripciones muertas', async () => {
    const cookie = await entrar('ana@mail.com');
    const code = await codigoDeCuenta(cookie);
    // Meta: Cupo Pro 100 ($99) → 89 puntos
    expect((await pedir('/api/puntos/meta', { method: 'POST', cookie, body: { product_id: 'prod_no_existe' } })).status).toBe(400);
    expect((await pedir('/api/puntos/meta', { method: 'POST', cookie, body: { product_id: 'prod_cupo_pro_100' } })).status).toBe(200);
    // Un celular con avisos (llaves reales de prueba) cuyo servicio responde 410: se borra
    const par = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const pub = Buffer.from(await crypto.subtle.exportKey('raw', par.publicKey)).toString('base64url');
    const enviados = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).startsWith('https://push.ejemplo.com/')) { enviados.push({ url, init }); return new Response('', { status: String(url).endsWith('/muerto') ? 410 : 201 }); }
      return new Response(JSON.stringify({ id: 'x', url: 'https://checkout.stripe.com/x' }));
    }));
    let r = await pedir('/api/puntos/push/suscribir', { method: 'POST', cookie, body: { endpoint: 'https://push.ejemplo.com/vivo', keys: { p256dh: pub, auth: 'AAAAAAAAAAAAAAAAAAAAAA' } } });
    expect(r.status).toBe(200);
    expect((await r.json()).enviados).toBe(1);
    expect(enviados[0].init.headers['content-encoding']).toBe('aes128gcm');
    expect(enviados[0].init.headers.authorization).toMatch(/^vapid t=.+\..+\..+, k=[\w-]{80,}$/);
    await pedir('/api/puntos/push/suscribir', { method: 'POST', cookie, body: { endpoint: 'https://push.ejemplo.com/muerto', keys: { p256dh: pub, auth: 'AAAAAAAAAAAAAAAAAAAAAA' } } });
    expect(env.DB.raw.prepare('SELECT endpoint FROM puntos_push').all().map(x => x.endpoint)).toEqual(['https://push.ejemplo.com/vivo']);
    expect((await pedir('/api/puntos/push/suscribir', { method: 'POST', cookie, body: { endpoint: 'http://inseguro', keys: {} } })).status).toBe(400);

    env.DB.raw.exec("INSERT INTO puntos_movimientos (email, tipo, puntos, nota) VALUES ('ana@mail.com', 'ajuste', 60, 'prueba')");
    const o = await compraPagada('b@mail.com', code);
    await puntosAlPagar(env, o.id);                       // reintento: sin avisos repetidos
    await compraPagada('c@mail.com', code);
    await compraPagada('d@mail.com', code);               // 3 ventas → Bronce; 60 + 30 = 90 ≥ 89 → meta
    const a = avisos('ana@mail.com');
    expect(a.filter(x => x.tipo === 'ganado').length).toBe(3);
    expect(a.find(x => x.tipo === 'nivel')).toMatchObject({ clave: 'nivel:bronce', titulo: 'Subiste a nivel Bronce' });
    expect(a.filter(x => x.tipo === 'meta').length).toBe(1);
    expect(enviados.length).toBeGreaterThanOrEqual(6);    // prueba + 3 ganados + nivel + meta
    // Bandeja de la app: punto de no leídas y se marcan al abrir Actividad
    let app = await (await pedir('/tienda/cuenta/', { cookie })).text();
    expect(app).toContain('class="badge" id="badge">5<');
    expect(app).toContain('¡Ya te alcanza!');
    expect((await pedir('/api/puntos/leidas', { method: 'POST', cookie })).status).toBe(200);
    expect(await (await pedir('/api/puntos/estado', { cookie })).json()).toMatchObject({ cuenta: true, total: 90, no_leidas: 0 });
    const d = await datosApp(env, 'ana@mail.com');
    expect(d.logros.filter(l => l.ok).map(l => l.id)).toEqual(['primera', 'meta', 'avisos']);
    expect(d.nivel.actual.id).toBe('bronce');
  });

  it('Top del mes: solo quien lo activa, con nombre e inicial; sin sesión las acciones piden entrar', async () => {
    const cookie = await entrar('ana@mail.com', 'Ana');
    const code = await codigoDeCuenta(cookie);
    const beto = await entrar('beto@mail.com', 'Beto');
    await compraPagada('x@mail.com', code);
    await compraPagada('y@mail.com', await codigoDeCuenta(beto));
    expect((await pedir('/api/puntos/ajustes', { method: 'POST', cookie: beto, body: { ranking: true, nombre: '' } })).status).toBe(400);
    const r = await (await pedir('/api/puntos/ajustes', { method: 'POST', cookie, body: { ranking: true, nombre: 'ana maría lópez' } })).json();
    expect(r).toMatchObject({ ok: true, nombre_publico: 'Ana M.' });
    expect(nombrePublico('Ana López Pérez')).toBe('Ana L.');
    const d = await datosApp(env, 'ana@mail.com');
    expect(d.top).toEqual([{ lugar: 1, nombre: 'Ana M.', ventas: 1, yo: true, email: undefined }]);
    expect((await pedir('/api/puntos/meta', { method: 'POST', body: { product_id: null } })).status).toBe(401);
    expect((await pedir('/api/puntos/sugerir', { method: 'POST', body: { idea: 'algo' } })).status).toBe(401);
  });

  it('la app, el manifiesto, el service worker y los íconos se sirven; reglas de niveles y metas', async () => {
    const cookie = await entrar('ana@mail.com');
    const res = await pedir('/tienda/cuenta/', { cookie });
    const app = await res.text();
    expect(res.headers.get('content-security-policy')).toContain("script-src 'self' 'nonce-");
    for (const t of ['data-ir="compartir"', 'data-ir="metas"', 'data-ir="actividad"', 'id="h-ajustes"', 'id="sw-push"', 'id="sw-top"', 'https://wa.me/?text=', 'https://t.me/share/url', 'https://x.com/intent/post', 'aria-label="Código QR de tu liga"', 'rel="manifest"', 'apple-touch-icon', 'Sugiere un producto'])
      expect(app).toContain(t);
    expect(app).not.toContain('Vorka OS');
    // Productos ocultos del catálogo no se comparten
    expect(app).not.toContain('Simulacro adicional');
    const m = await (await pedir('/tienda/cuenta/manifest.webmanifest')).json();
    expect(m).toMatchObject({ name: 'Puntos Vorka', start_url: '/tienda/cuenta/', scope: '/tienda/cuenta/', display: 'standalone' });
    const sw = await pedir('/tienda/cuenta/sw.js');
    expect(sw.headers.get('content-type')).toContain('javascript');
    expect(await sw.text()).toContain("addEventListener('push'");
    for (const n of ['192', '512', '180', 'maskable']) {
      const png = new Uint8Array(await (await pedir(`/tienda/cuenta/iconos/${n}.png`)).arrayBuffer());
      expect([...png.slice(1, 4)]).toEqual([80, 78, 71]);   // "PNG"
    }
    expect(nivelDe(0).actual.id).toBe('inicial');
    expect(nivelDe(9)).toMatchObject({ actual: { id: 'bronce' }, faltan: 1 });
    expect(nivelDe(60)).toMatchObject({ actual: { id: 'diamante' }, siguiente: null });
    expect(objetivoMeta(9900)).toBe(89);
    // Enlace vencido manda a pedir otro correo
    expect((await pedir('/tienda/puntos/acceso/' + 'a'.repeat(64))).status).toBe(410);
  });
});
