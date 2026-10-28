import { describe, it, expect, beforeEach } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { armarDiagnostico, whatsappMx, TOTAL_DIAG } from '../src/simulador/diagnostico.js';
import * as BANCO_PAA from '../src/simulador/banco.js';
import { UNAM } from '../src/simulador/unam.js';
import { ECOEMS } from '../src/simulador/ecoems.js';

let env, correos;
const pedir = (ruta, { metodo = 'GET', cookie, body, origin } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...(origin ? { origin } : {}) },
  body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
}), env);
const DATOS = { nombre: 'Ana López', email: 'Ana@Mail.com', whatsapp: '+52 55 1234 5678', acepto: true };
const claveDe = c => c.asunto.match(/^(\d{6})/)[1];
const API = '/api/simulador-paa/diagnostico';

beforeEach(() => {
  correos = [];
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), CORREO: { async enviar(c) { correos.push(c); return { id: 'em' }; } } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
});

async function entrar(datos = DATOS) {
  expect((await pedir(`${API}/pedir`, { metodo: 'POST', body: datos })).status).toBe(200);
  const r = await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: datos.email, codigo: claveDe(correos.at(-1)) } });
  expect(r.status).toBe(200);
  return { cookie: r.headers.get('set-cookie').split(';')[0], estado: await r.json() };
}

describe('diagnóstico gratis', () => {
  it('la página se puede indexar y trae el flujo', async () => {
    const r = await pedir('/simulador-paa/diagnostico/');
    expect(r.status).toBe(200);
    const h = await r.text();
    expect(h).toContain('Diagnóstico PAA gratis');
    expect(h).toContain('id="dx"');
    expect(h).toContain('window.DX=');
    expect(h).toContain('Lectura, Redacción, Matemáticas e Inglés');
    expect(h).not.toContain('noindex');
    expect((await pedir('/simulador-paa/diagnostico')).status).toBe(301);
  });

  it('valida los datos antes de mandar la clave', async () => {
    for (const [cambio, txt] of [[{ nombre: '' }, 'nombre'], [{ email: 'ana@' }, 'correo'], [{ whatsapp: '12345' }, 'WhatsApp'], [{ acepto: false }, 'aviso de privacidad']]) {
      const r = await pedir(`${API}/pedir`, { metodo: 'POST', body: { ...DATOS, ...cambio } });
      expect(r.status).toBe(400); expect((await r.json()).error).toContain(txt);
    }
    expect(correos).toHaveLength(0);
    expect((await pedir(`${API}/pedir`, { metodo: 'POST', body: DATOS, origin: 'https://otro.com' })).status).toBe(403);
  });

  it('la clave llega al correo, se valida y deja entrar; con clave mala no', async () => {
    await pedir(`${API}/pedir`, { metodo: 'POST', body: DATOS });
    expect(correos[0].para).toBe('ana@mail.com');
    const cod = claveDe(correos[0]);
    const mala = String((Number(cod) + 1) % 1e6).padStart(6, '0');
    const r1 = await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: 'ana@mail.com', codigo: mala } });
    expect(r1.status).toBe(400);
    expect((await pedir(`${API}/estado`)).status).toBe(401);
    const r2 = await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: 'ANA@mail.com', codigo: cod } });
    expect(r2.status).toBe(200);
    const e = await r2.json();
    const ids = e.secciones.flatMap(s => s.items);
    expect(ids).toHaveLength(TOTAL_DIAG);
    expect(new Set(ids).size).toBe(TOTAL_DIAG);
    expect(e.secciones.map(s => s.id)).toEqual(['lectura', 'redaccion', 'matematicas', 'ingles']);
    expect(Object.keys(e.reactivos)).toHaveLength(TOTAL_DIAG);
    expect(e.planes.paquete.precio_centavos).toBe(37900);
    // la misma clave no sirve dos veces
    expect((await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: 'ana@mail.com', codigo: cod } })).status).toBe(410);
    // se guardan sus datos para el seguimiento
    const fila = env.DB.raw.prepare('SELECT * FROM simulador_diagnosticos').get();
    expect(fila).toMatchObject({ app: 'simulador-paa', email: 'ana@mail.com', nombre: 'Ana López', whatsapp: '5512345678' });
    expect(fila.verificado_at).toBeTruthy();
  });

  it('5 claves malas bloquean esa clave', async () => {
    await pedir(`${API}/pedir`, { metodo: 'POST', body: DATOS });
    const cod = claveDe(correos[0]), mala = cod === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: 'ana@mail.com', codigo: mala } });
    expect((await pedir(`${API}/codigo`, { metodo: 'POST', body: { email: 'ana@mail.com', codigo: cod } })).status).toBe(429);
  });

  it('califica en el servidor, manda el resultado por correo y no deja repetirlo', async () => {
    const { cookie, estado } = await entrar();
    expect((await pedir(`${API}/estado`, { cookie })).status).toBe(200);
    // todo bien a la primera en Lectura y Redacción; todo mal en Matemáticas e Inglés
    const resp = {};
    for (const s of estado.secciones) for (const id of s.items) {
      const r = estado.reactivos[id], bien = ['lectura', 'redaccion'].includes(s.id);
      resp[id] = { sel1: bien ? r.correcta : (r.correcta + 1) % 4, sel2: null };
    }
    const t = await (await pedir(`${API}/terminar`, { metodo: 'POST', cookie, body: { resp } })).json();
    expect(t.resultado.secciones.find(s => s.id === 'lectura').puntaje).toBe(800);
    expect(t.resultado.secciones.find(s => s.id === 'matematicas').puntaje).toBe(200);
    expect(t.resultado.global).toBe(600);    // promedio de Lectura, Redacción y Matemáticas, como el simulador
    expect(t.resultado.aciertos).toBe(6);
    expect(['matematicas', 'ingles']).toContain(t.resultado.reforzar);
    const res = correos.find(c => /Tu diagnóstico PAA/.test(c.asunto));
    expect(res.para).toBe('ana@mail.com');
    expect(res.html).toContain('/simulador-paa/?plan=paquete#comprar');
    // otra vez: devuelve el mismo, sin recalificar ni mandar otro correo
    const otra = await (await pedir(`${API}/terminar`, { metodo: 'POST', cookie, body: { resp: {} } })).json();
    expect(otra.resultado.global).toBe(600);
    expect(correos.filter(c => /Tu diagnóstico PAA/.test(c.asunto))).toHaveLength(1);
    // volver a pedir la clave con el mismo correo muestra su resultado, no un diagnóstico nuevo
    const { estado: e2 } = await entrar();
    expect(e2.resultado.global).toBe(600);
  });

  it('la cookie alterada no entra', async () => {
    const { cookie } = await entrar();
    const mala = cookie.replace(/.$/, c => (c === 'a' ? 'b' : 'a'));
    expect((await pedir(`${API}/estado`, { cookie: mala })).status).toBe(401);
    expect((await pedir('/api/simulador-unam/diagnostico/estado', { cookie: cookie.replace('vk_paa_dx', 'vk_unam_dx') })).status).toBe(401);
  });

  it('limita las claves por correo', async () => {
    for (let i = 0; i < 3; i++) expect((await pedir(`${API}/pedir`, { metodo: 'POST', body: DATOS })).status).toBe(200);
    expect((await pedir(`${API}/pedir`, { metodo: 'POST', body: DATOS })).status).toBe(429);
  });
});

describe('armado del diagnóstico', () => {
  it('WhatsApp de México a 10 dígitos', () => {
    expect(whatsappMx('55 1234 5678')).toBe('5512345678');
    expect(whatsappMx('+52 1 55 1234 5678')).toBe('5512345678');
    expect(whatsappMx('5215512345678')).toBe('5512345678');
    expect(whatsappMx('0512345678')).toBe(null);
    expect(whatsappMx('551234567')).toBe(null);
  });

  const azar = s => { let a = s; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; };
  for (const [nombre, banco] of [['PAA', BANCO_PAA], ['UNAM', UNAM.BANCO], ['ECOEMS', ECOEMS.BANCO]]) {
    it(`${nombre}: ${TOTAL_DIAG} reactivos de opción múltiple, sin repetir y de menor a mayor dificultad`, () => {
      expect(banco?.REACTIVOS?.length).toBeGreaterThan(0);
      for (let semilla = 1; semilla < 30; semilla++) {
        const secs = armarDiagnostico(banco, azar(semilla));
        const ids = secs.flatMap(s => s.items);
        expect(ids.length).toBe(TOTAL_DIAG);
        expect(new Set(ids).size).toBe(ids.length);
        const R = Object.fromEntries(banco.REACTIVOS.map(r => [r.id, r]));
        for (const s of secs) {
          const d = s.items.map(id => R[id].dificultad);
          expect(d).toEqual([...d].sort((a, b) => a - b));
          for (const id of s.items) { expect(R[id].seccion).toBe(s.id); expect(R[id].opciones).toHaveLength(4); }
          // en lectura, una sola lectura corta para todo el bloque
          const textos = new Set(s.items.map(id => R[id].texto).filter(Boolean));
          expect(textos.size).toBeLessThanOrEqual(1);
        }
      }
    });
  }
});

describe('seguimiento en Vorka OS', () => {
  it('lista los diagnósticos con su resultado, si ya compraron y si ya les escribimos', async () => {
    const admin = await import('../src/admin.js');
    await entrar();
    let l = await admin.diagnosticos(env, {});
    expect(l.resumen).toMatchObject({ total: 1, terminaron: 0, compraron: 0 });
    expect(l.diagnosticos[0]).toMatchObject({ nombre: 'Ana López', whatsapp: '5512345678', compro: false, resultado: null });
    const { cookie } = await entrar();
    await pedir(`${API}/terminar`, { metodo: 'POST', cookie, body: { resp: {} } });
    expect((await admin.diagnosticos(env, { estado: 'pendientes' })).diagnosticos).toHaveLength(1);
    await admin.marcarDiagnostico(env, l.diagnosticos[0].id, true);
    expect((await admin.diagnosticos(env, { estado: 'pendientes' })).diagnosticos).toHaveLength(0);
    l = await admin.diagnosticos(env, { estado: 'todos', app: 'simulador-paa' });
    expect(l.diagnosticos[0].resultado).toMatchObject({ global: 200, de: 800, aciertos: 0 });
    expect(l.diagnosticos[0].contactado_at).toBeTruthy();
  });
});
