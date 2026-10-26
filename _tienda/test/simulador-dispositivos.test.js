import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { crearToken } from '../src/entrega.js';
import { cookieAcceso } from '../src/simulador/index.js';

// Cuentas compartidas: máximo 2 dispositivos por cuenta y código por correo al reusar una liga
let env, orden, token;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const pedir = (ruta, { metodo = 'GET', cookie, form, origin } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, redirect: 'manual',
  headers: { 'user-agent': IPHONE, ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}), ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
  body: form ? new URLSearchParams(form).toString() : undefined,
}), env);
const soloCookie = sc => sc.split(';')[0];
const enviarCodigo = cookie => pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'enviar' }, cookie });
const codigoDe = html => html.match(/tu código es <b>(\d{6})<\/b>/)[1];
const banco = cookie => pedir('/api/simulador-paa/banco', { cookie });

beforeEach(async () => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  orden = await crearOrden(env, { items: [{ slug: 'simulador-paa-paquete' }], email: 'Ana@Mail.com', nombre: 'Ana López' });
  await aplicarPago(env, orden.id, { resultado: 'aprobado', monto_centavos: orden.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  ({ token } = await crearToken(env, orden.id));
});

describe('simulador: liga del correo y código', () => {
  it('la primera vez la liga entra directo; reusada en otro navegador pide código, y en el mismo navegador entra', async () => {
    const r = await pedir(`/simulador-paa/entrar/${token}`);
    expect(r.status).toBe(303);
    const cookie = soloCookie(r.headers.get('set-cookie'));
    expect((await banco(cookie)).status).toBe(200);
    // mismo navegador: entra sin código
    expect((await pedir(`/simulador-paa/entrar/${token}`, { cookie })).status).toBe(303);
    // otro navegador (la liga reenviada): pide código y no deja cookie
    const otro = await pedir(`/simulador-paa/entrar/${token}`);
    expect(otro.status).toBe(200);
    expect(otro.headers.get('set-cookie')).toBeNull();
    const html = await otro.text();
    expect(html).toContain('Confirma que eres tú');
    expect(html).toMatch(/<b>[^<]*@mail\.com<\/b>/);
    expect(html).not.toContain('ana@mail.com');   // el correo se muestra oculto
    expect(html).toContain('noindex');
    // con no-referrer el navegador manda Origin "null" en el formulario y el código nunca se podría pedir
    expect(otro.headers.get('referrer-policy')).toBe('same-origin');
  });

  it('con el código correcto entra; con uno incorrecto no, y a los 5 intentos hay que pedir otro', async () => {
    await pedir(`/simulador-paa/entrar/${token}`);   // primer uso (dueño)
    const pag = await enviarCodigo();
    expect(pag.status).toBe(200);
    const cod = codigoDe(await pag.text());
    const malo = String((Number(cod) + 1) % 1e6).padStart(6, '0');
    const fallo = await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: malo } });
    expect(await fallo.text()).toContain('Ese código no es correcto');
    expect(fallo.headers.get('set-cookie')).toBeNull();
    const ok = await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: cod } });
    expect(ok.status).toBe(303);
    expect((await banco(soloCookie(ok.headers.get('set-cookie')))).status).toBe(200);
    // un solo uso
    expect(await (await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: cod } })).text()).toContain('Pide uno nuevo');
    // intentos
    const cod2 = codigoDe(await (await enviarCodigo()).text());
    for (let i = 0; i < 5; i++) await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: '000000' === cod2 ? '111111' : '000000' } });
    expect(await (await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: cod2 } })).text()).toContain('Demasiados intentos');
  });

  it('el código vence, solo vale el último y no se mandan códigos sin límite', async () => {
    await pedir(`/simulador-paa/entrar/${token}`);
    const viejo = codigoDe(await (await enviarCodigo()).text());
    const nuevo = codigoDe(await (await enviarCodigo()).text());
    if (viejo !== nuevo) {
      const r = await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: viejo } });
      expect(r.status).toBe(200); expect(r.headers.get('set-cookie')).toBeNull();
    }
    env.DB.raw.exec("UPDATE simulador_codigos SET expira_at = '2000-01-01T00:00:00Z'");
    expect(await (await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'codigo', codigo: nuevo } })).text()).toContain('ya venció');
    await enviarCodigo();
    expect(await (await enviarCodigo()).text()).toContain('Ya te mandamos varios códigos');
  });

  it('un POST desde otro sitio no manda códigos', async () => {
    await pedir(`/simulador-paa/entrar/${token}`);
    const r = await pedir(`/simulador-paa/entrar/${token}`, { metodo: 'POST', form: { accion: 'enviar' }, origin: 'https://otro.com' });
    expect(await r.text()).toContain('Solicitud inválida');
    expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM simulador_codigos').get().n).toBe(0);
  });
});

describe('simulador: máximo 2 dispositivos', () => {
  it('al entrar un tercero se cierra el más antiguo, con aviso en la página y en la API', async () => {
    const vence = Date.now() + 864e5;
    const uno = soloCookie(await cookieAcceso(env, orden.id, vence));
    const dos = soloCookie(await cookieAcceso(env, orden.id, vence));
    expect((await banco(uno)).status).toBe(200);
    const tres = soloCookie(await cookieAcceso(env, orden.id, vence));
    const r = await banco(uno);
    expect(r.status).toBe(401);
    expect((await r.json()).error).toContain('otro dispositivo');
    const pag = await pedir('/simulador-paa/', { cookie: uno });
    expect(await pag.text()).toContain('Tu sesión se cerró en este dispositivo');
    expect(pag.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await banco(dos)).status).toBe(200);
    expect((await banco(tres)).status).toBe(200);
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM simulador_dispositivos WHERE revocado_at IS NULL").get().n).toBe(2);
  });

  it('cerrar sesión libera el lugar de ese dispositivo', async () => {
    const vence = Date.now() + 864e5;
    const uno = soloCookie(await cookieAcceso(env, orden.id, vence));
    const dos = soloCookie(await cookieAcceso(env, orden.id, vence));
    await pedir('/api/simulador-paa/salir', { metodo: 'POST', cookie: dos });
    const tres = soloCookie(await cookieAcceso(env, orden.id, vence));
    expect((await banco(uno)).status).toBe(200);
    expect((await banco(tres)).status).toBe(200);
    expect((await banco(dos)).status).toBe(401);
  });

  it('las cookies del formato anterior (sin dispositivo) ya no abren el simulador', async () => {
    const vieja = 'vk_paa=' + `${orden.id}.${Math.floor(Date.now() / 1000) + 3600}.${'a'.repeat(64)}`;
    expect((await banco(vieja)).status).toBe(401);
  });
});
