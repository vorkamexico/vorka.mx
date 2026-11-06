// Simuladores como app (nov 2026): instalable (manifiesto, service worker, ícono propio), «Entrar con mi correo» para la app
// instalada, y plan de estudio, apuntes y recordatorios al celular solo para el plan Completo.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d1 } from './d1.js';
import worker from '../src/index.js';
import { crearOrden, aplicarPago } from '../src/modelo.js';
import { cookieAcceso, simuladores } from '../src/simulador/index.js';
import { PAA } from '../src/simulador/paa.js';
import { enMexico, mensajeRecordatorio, recordatoriosEstudio, tieneEstudio } from '../src/simulador/estudio.js';

let env, envios;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const pedir = (ruta, { metodo = 'GET', cookie, form, body } = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, {
  method: metodo, redirect: 'manual',
  headers: { 'user-agent': IPHONE, ...(cookie ? { cookie } : {}), ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
  body: form ? new URLSearchParams(form).toString() : body ? JSON.stringify(body) : undefined,
}), env);
const soloCookie = sc => sc.split(';')[0];
async function comprar(slug, email = 'ana@mail.com') {
  const o = await crearOrden(env, { items: [{ slug }], email, nombre: 'Ana López' });
  await aplicarPago(env, o.id, { resultado: 'aprobado', monto_centavos: o.monto_centavos, moneda: 'MXN', metodo_pago: 'card' });
  return soloCookie(await cookieAcceso(env, o.id, Date.now() + 864e5));
}
const b64u = buf => Buffer.from(buf).toString('base64url');
async function suscripcion(n = 1) {
  const par = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  return { endpoint: `https://fcm.googleapis.com/fcm/send/prueba-${n}-${'x'.repeat(20)}`, keys: { p256dh: b64u(await crypto.subtle.exportKey('raw', par.publicKey)), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) } };
}
const tema = Object.keys(PAA.BANCO.TEMAS)[0], tema2 = Object.keys(PAA.BANCO.TEMAS)[1];
const reactivo = PAA.BANCO.REACTIVOS[0].id;

beforeEach(() => {
  env = { DB: d1(), SITE_URL: 'https://vorka.mx', DOWNLOAD_TOKEN_SECRET: 's'.repeat(64), PRODUCTOS: { head: async () => ({ size: 1 }) } };
  env.DB.raw.exec('UPDATE products SET activo = 1');
  envios = [];
  vi.stubGlobal('fetch', vi.fn(async (u, op) => { envios.push({ url: String(u), op }); return new Response(null, { status: 201 }); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('app instalable', () => {
  it('cada simulador sirve su manifiesto con su librito y su service worker', async () => {
    for (const s of simuladores()) {
      const m = await pedir(`${s.RUTA}/manifest.webmanifest`);
      expect(m.headers.get('content-type')).toContain('application/manifest+json');
      const j = await m.json();
      expect(j).toMatchObject({ display: 'standalone', scope: `${s.RUTA}/`, start_url: `${s.RUTA}/?app=1`, lang: 'es-MX' });
      expect(j.short_name.length).toBeLessThanOrEqual(15);
      expect(j.icons.map(i => i.purpose)).toEqual(expect.arrayContaining(['any', 'maskable']));
      for (const i of j.icons) expect(i.src).toMatch(/^\/assets\/tienda\/simulador-app\/[a-z-]+-(icono|maskable)-(192|512)\.png$/);
      const sw = await pedir(`${s.RUTA}/sw.js`);
      expect(sw.headers.get('content-type')).toContain('javascript');
      expect(sw.headers.get('cache-control')).toBe('no-cache');
      const js = await sw.text();
      expect(js).toContain("addEventListener('push'");
      expect(js).toContain("addEventListener('notificationclick'");
      expect(() => new Function(js)).not.toThrow();
    }
  });

  it('la app trae manifiesto, ícono para iPhone (no el logo de Vorka) y «Powered by vorka.mx»', async () => {
    const cookie = await comprar('simulador-paa-practica');
    const html = await (await pedir('/simulador-paa/', { cookie })).text();
    expect(html).toContain('<link rel="manifest" href="/simulador-paa/manifest.webmanifest">');
    expect(html).toContain('rel="apple-touch-icon" href="/assets/tienda/simulador-app/paa-apple-180.png"');
    expect(html).toContain('Powered by <b>vorka.mx</b>');
  });

  it('la app instalada sin sesión va a «Entrar con mi correo»; la página normal sigue mostrando la venta', async () => {
    const r = await pedir('/simulador-paa/?app=1');
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/simulador-paa/entrar/?app=1');
    expect((await pedir('/simulador-paa/')).status).toBe(200);
  });
});

describe('entrar con mi correo', () => {
  it('manda un código solo si el correo tiene acceso, sin revelarlo, y con el código entra', async () => {
    await comprar('simulador-paa-paquete');
    const nadie = await pedir('/simulador-paa/entrar/', { metodo: 'POST', form: { accion: 'enviar', email: 'otro@mail.com' } });
    const htmlNadie = await nadie.text();
    expect(htmlNadie).toContain('Escribe tu código');
    expect(htmlNadie).not.toContain('tu código es <b>');
    expect(env.DB.raw.prepare("SELECT COUNT(*) n FROM simulador_codigos WHERE email = 'otro@mail.com'").get().n).toBe(0);

    const pag = await pedir('/simulador-paa/entrar/', { metodo: 'POST', form: { accion: 'enviar', email: 'Ana@Mail.com' } });
    const cod = (await pag.text()).match(/tu código es <b>(\d{6})<\/b>/)[1];
    const malo = await pedir('/simulador-paa/entrar/', { metodo: 'POST', form: { accion: 'codigo', email: 'ana@mail.com', codigo: String((Number(cod) + 1) % 1e6).padStart(6, '0') } });
    expect(await malo.text()).toContain('no es correcto');
    const ok = await pedir('/simulador-paa/entrar/', { metodo: 'POST', form: { accion: 'codigo', email: 'ana@mail.com', codigo: cod } });
    expect(ok.status).toBe(303);
    const cookie = soloCookie(ok.headers.get('set-cookie'));
    expect((await pedir('/api/simulador-paa/yo', { cookie })).status).toBe(200);
    // un código no sirve dos veces
    const otra = await pedir('/simulador-paa/entrar/', { metodo: 'POST', form: { accion: 'codigo', email: 'ana@mail.com', codigo: cod } });
    expect(otra.headers.get('set-cookie')).toBeNull();
  });
});

describe('la app y el navegador del mismo celular cuentan como un solo dispositivo', () => {
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
  const conUA = (ruta, ua, op = {}) => worker.fetch(new Request(`https://vorka.mx${ruta}`, { method: op.form ? 'POST' : 'GET', redirect: 'manual',
    headers: { 'user-agent': ua, ...(op.cookie ? { cookie: op.cookie } : {}), ...(op.form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: op.form ? new URLSearchParams(op.form).toString() : undefined }), env);
  async function entrar(ruta, ua) {
    const cod = (await (await conUA(ruta, ua, { form: { accion: 'enviar', email: 'ana@mail.com' } })).text()).match(/tu código es <b>(\d{6})<\/b>/)[1];
    return soloCookie((await conUA(ruta, ua, { form: { accion: 'codigo', email: 'ana@mail.com', codigo: cod } })).headers.get('set-cookie'));
  }

  it('al entrar desde la app se cierra Safari del iPhone (sin correo de aviso) y la computadora sigue', async () => {
    await comprar('simulador-paa-paquete');
    const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const safari = await entrar('/simulador-paa/entrar/', IPHONE);
    const mac = await entrar('/simulador-paa/entrar/', MAC);
    const appIos = await entrar('/simulador-paa/entrar/?app=1', IPHONE.replace(' Safari/604.1', ''));
    expect((await pedir('/api/simulador-paa/yo', { cookie: appIos })).status).toBe(200);
    expect((await pedir('/api/simulador-paa/yo', { cookie: mac })).status).toBe(200);           // la computadora no se cierra
    const r = await pedir('/simulador-paa/', { cookie: safari });
    expect(await r.text()).toContain('Ahora usas la app en este celular');
    // Safari se cerró por la app; la app no sacó a la computadora (lo de «otro dispositivo» es el acceso que crea comprar())
    const disp = env.DB.raw.prepare("SELECT etiqueta, motivo FROM simulador_dispositivos WHERE revocado_at IS NOT NULL AND etiqueta LIKE 'iPhone%' OR etiqueta LIKE 'Mac%' AND revocado_at IS NOT NULL").all();
    expect(disp.map(d => [d.etiqueta, d.motivo])).toEqual([['iPhone · Safari', 'app']]);
    expect(env.DB.raw.prepare("SELECT etiqueta FROM simulador_dispositivos WHERE revocado_at IS NULL ORDER BY etiqueta").all().map(d => d.etiqueta)).toEqual(['Mac · Safari', 'iPhone · App']);
  });

  it('en Android pasa lo mismo con Chrome; entrar sin ?app=1 no cierra nada', async () => {
    await comprar('simulador-paa-paquete');
    const chrome = await entrar('/simulador-paa/entrar/', ANDROID);
    const otro = await entrar('/simulador-paa/entrar/', ANDROID);          // otro navegador, sin la app: cuenta aparte
    expect((await pedir('/api/simulador-paa/yo', { cookie: chrome })).status).toBe(200);
    expect((await pedir('/api/simulador-paa/yo', { cookie: otro })).status).toBe(200);
    await entrar('/simulador-paa/entrar/?app=1', ANDROID);
    expect((await pedir('/api/simulador-paa/yo', { cookie: chrome })).status).toBe(401);
  });
});

describe('plan de estudio, apuntes y recordatorios (plan Completo)', () => {
  it('quién lo tiene: el Completo (o Práctica + Examen); la compra de antes de los planes no', () => {
    expect(tieneEstudio({ paquete: true })).toBe(true);
    expect(tieneEstudio({ practica: true, examen: true })).toBe(true);
    expect(tieneEstudio({ legado: true })).toBe(false);
    expect(tieneEstudio({ legado: true, practica: true })).toBe(false);
    expect(tieneEstudio({ practica: true })).toBe(false);
    expect(tieneEstudio({ examen: true, completo: true })).toBe(false);
  });

  it('con Práctica sola está bloqueado (403) y /yo lo dice', async () => {
    const cookie = await comprar('simulador-paa-practica');
    expect((await (await pedir('/api/simulador-paa/yo', { cookie })).json()).plan.estudio).toBe(false);
    expect((await pedir('/api/simulador-paa/estudio', { cookie })).status).toBe(403);
    expect((await pedir('/api/simulador-paa/apuntes', { cookie, metodo: 'POST', body: { ref: `r:${reactivo}`, texto: 'hola' } })).status).toBe(403);
  });

  it('comprar el Examen además de la Práctica lo desbloquea', async () => {
    const cookie = await comprar('simulador-paa-practica');
    await comprar('simulador-paa-completo');
    expect((await (await pedir('/api/simulador-paa/yo', { cookie })).json()).plan.estudio).toBe(true);
    expect((await pedir('/api/simulador-paa/estudio', { cookie })).status).toBe(200);
  });

  it('guarda y valida el plan', async () => {
    const cookie = await comprar('simulador-paa-paquete');
    const hoy = enMexico().dia, en30 = new Date(Date.parse(`${hoy}T12:00:00Z`) + 30 * 864e5).toISOString().slice(0, 10);
    const vacio = await (await pedir('/api/simulador-paa/estudio', { cookie })).json();
    expect(vacio.estudio).toBeNull();
    expect(vacio.push.pub).toMatch(/^[\w-]{80,}$/);
    const mal = async (b, txt) => { const r = await pedir('/api/simulador-paa/estudio', { cookie, metodo: 'POST', body: b }); expect(r.status).toBe(400); expect((await r.json()).error).toContain(txt); };
    await mal({ fecha_examen: '2020-01-01', dias: [1], hora: 19 }, 'ya pasó');
    await mal({ fecha_examen: '2026-02-30', dias: [1], hora: 19 }, 'fecha');
    await mal({ fecha_examen: en30, dias: [], hora: 19 }, 'al menos un día');
    await mal({ fecha_examen: en30, dias: [1], hora: 3 }, 'hora');
    const r = await pedir('/api/simulador-paa/estudio', { cookie, metodo: 'POST', body: { fecha_examen: en30, dias: [1, 3, 3, 9], hora: 19, recordatorios: true,
      sesiones: [{ f: hoy, k: 'temas', t: [tema, 'tema-que-no-existe', tema2] }, { f: 'mal', k: 'temas', t: [] }, { f: hoy, k: 'otro', t: [] }] } });
    expect(r.status).toBe(200);
    const { estudio } = await r.json();
    expect(estudio).toMatchObject({ fecha_examen: en30, dias: [1, 3], hora: 19, recordatorios: true });
    expect(estudio.sesiones).toEqual([{ f: hoy, k: 'temas', t: [tema, tema2] }]);
    expect((await pedir('/api/simulador-paa/estudio/borrar', { cookie, metodo: 'POST', body: {} })).status).toBe(200);
    expect((await (await pedir('/api/simulador-paa/estudio', { cookie })).json()).estudio).toBeNull();
  });

  it('apuntes por pregunta y por tema: se guardan, se editan y se borran; no se aceptan referencias inventadas', async () => {
    const cookie = await comprar('simulador-paa-paquete');
    const apunte = b => pedir('/api/simulador-paa/apuntes', { cookie, metodo: 'POST', body: b });
    expect((await apunte({ ref: `r:${reactivo}`, texto: '  Primero despejo x  ' })).status).toBe(200);
    expect((await apunte({ ref: `t:${tema}`, texto: 'Fórmula clave' })).status).toBe(200);
    expect((await apunte({ ref: `r:${reactivo}`, texto: 'Primero despejo x, luego sustituyo' })).status).toBe(200);
    let { apuntes } = await (await pedir('/api/simulador-paa/estudio', { cookie })).json();
    expect(apuntes.map(a => [a.ref, a.texto]).sort()).toEqual([[`r:${reactivo}`, 'Primero despejo x, luego sustituyo'], [`t:${tema}`, 'Fórmula clave']]);
    expect((await apunte({ ref: 'r:no-existe', texto: 'x' })).status).toBe(400);
    expect((await apunte({ ref: '<script>', texto: 'x' })).status).toBe(400);
    expect((await apunte({ ref: 'general', texto: 'x'.repeat(4001) })).status).toBe(400);
    expect((await apunte({ ref: `t:${tema}`, texto: '' })).status).toBe(200);
    ({ apuntes } = await (await pedir('/api/simulador-paa/estudio', { cookie })).json());
    expect(apuntes.map(a => a.ref)).toEqual([`r:${reactivo}`]);
    // los apuntes son de cada cuenta
    const otra = await comprar('simulador-paa-paquete', 'beto@mail.com');
    expect((await (await pedir('/api/simulador-paa/estudio', { cookie: otra })).json()).apuntes).toEqual([]);
  });

  it('suscribe el celular, manda un aviso de prueba cifrado y deja quitarlo', async () => {
    const cookie = await comprar('simulador-paa-paquete');
    const sub = await suscripcion();
    const r = await pedir('/api/simulador-paa/push', { cookie, metodo: 'POST', body: sub });
    expect(await r.json()).toMatchObject({ ok: true, prueba: true });
    expect(envios).toHaveLength(1);
    expect(envios[0].url).toBe(sub.endpoint);
    expect(envios[0].op.headers['content-encoding']).toBe('aes128gcm');
    expect(envios[0].op.headers.authorization).toMatch(/^vapid t=.+, k=.+/);
    expect((await (await pedir('/api/simulador-paa/estudio', { cookie })).json()).push.suscripciones).toBe(1);
    expect((await pedir('/api/simulador-paa/push', { cookie, metodo: 'POST', body: { endpoint: 'http://malo', keys: {} } })).status).toBe(400);
    await pedir('/api/simulador-paa/push/quitar', { cookie, metodo: 'POST', body: { endpoint: sub.endpoint } });
    expect((await (await pedir('/api/simulador-paa/estudio', { cookie })).json()).push.suscripciones).toBe(0);
  });
});

describe('recordatorios del cron', () => {
  // Lunes 9 nov 2026, 19:17 en CDMX = 01:17 UTC del martes
  const LUNES_19 = new Date('2026-11-10T01:17:00Z');
  it('enMexico da la fecha, hora y día de la semana del centro de México', () => {
    expect(enMexico(LUNES_19)).toEqual({ dia: '2026-11-09', hora: 19, semana: 1 });
  });

  it('el mensaje dice qué toca hoy y cuántos días faltan; el día anterior y el día del examen cambian', () => {
    const temas = PAA.BANCO.TEMAS, ruta = '/simulador-paa';
    const m = mensajeRecordatorio({ hoy: '2026-11-09', fecha_examen: '2026-12-09', sesiones: [{ f: '2026-11-09', k: 'temas', t: [tema, tema2] }], temas, ruta });
    expect(m.titulo).toBe(`Hoy toca: ${temas[tema].nombre} y ${temas[tema2].nombre}`.slice(0, 110));
    expect(m.cuerpo).toContain('Faltan 30 días');
    expect(m.url).toBe('/simulador-paa/?app=1#hoy');
    expect(mensajeRecordatorio({ hoy: '2026-11-09', fecha_examen: '2026-12-09', sesiones: [{ f: '2026-11-09', k: 'simulacro', t: [] }], temas, ruta }).titulo).toContain('simulacro');
    expect(mensajeRecordatorio({ hoy: '2026-11-09', fecha_examen: '2026-12-09', sesiones: [], temas, ruta }).titulo).toContain('Hora de estudiar');
    expect(mensajeRecordatorio({ hoy: '2026-12-08', fecha_examen: '2026-12-09', temas, ruta }).titulo).toBe('Mañana es tu examen');
    expect(mensajeRecordatorio({ hoy: '2026-12-09', fecha_examen: '2026-12-09', temas, ruta }).titulo).toContain('Hoy es tu examen');
    expect(mensajeRecordatorio({ hoy: '2026-12-10', fecha_examen: '2026-12-09', temas, ruta })).toBeNull();
  });

  async function conPlan({ slug = 'simulador-paa-paquete', dias = '1,3,5', hora = 19, fecha = '2026-12-09' } = {}) {
    await comprar(slug);
    const sub = await suscripcion();
    env.DB.raw.prepare("INSERT INTO simulador_estudio (email, app, fecha_examen, dias, hora, recordatorios, sesiones) VALUES ('ana@mail.com','simulador-paa',?,?,?,1,?)")
      .run(fecha, dias, hora, JSON.stringify([{ f: '2026-11-09', k: 'temas', t: [tema] }]));
    env.DB.raw.prepare("INSERT INTO simulador_push (email, app, endpoint, p256dh, auth) VALUES ('ana@mail.com','simulador-paa',?,?,?)").run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
    return sub;
  }

  it('manda uno a su hora, en su día de estudio, y no lo repite el mismo día', async () => {
    vi.setSystemTime(new Date('2026-11-09T18:00:00Z'));
    try {
      await conPlan();
      expect(await recordatoriosEstudio(env, new Date('2026-11-10T00:17:00Z'), simuladores())).toMatchObject({ revisados: 0 });   // 18:17, otra hora
      expect(await recordatoriosEstudio(env, LUNES_19, simuladores())).toMatchObject({ revisados: 1, enviados: 1 });
      expect(await recordatoriosEstudio(env, LUNES_19, simuladores())).toMatchObject({ revisados: 0 });
      // martes no es día de estudio
      expect(await recordatoriosEstudio(env, new Date('2026-11-11T01:17:00Z'), simuladores())).toMatchObject({ enviados: 0 });
    } finally { vi.useRealTimers(); }
  });

  it('el día antes del examen avisa aunque no sea día de estudio', async () => {
    vi.setSystemTime(new Date('2026-11-09T18:00:00Z'));
    try {
      await conPlan({ dias: '1', fecha: '2026-11-11' });
      expect(await recordatoriosEstudio(env, new Date('2026-11-11T01:17:00Z'), simuladores())).toMatchObject({ enviados: 1 });   // martes 10
    } finally { vi.useRealTimers(); }
  });

  it('sin plan Completo se apagan sus recordatorios', async () => {
    vi.setSystemTime(new Date('2026-11-09T18:00:00Z'));
    try {
      await conPlan({ slug: 'simulador-paa-practica' });
      expect(await recordatoriosEstudio(env, LUNES_19, simuladores())).toMatchObject({ enviados: 0, sinAcceso: 1 });
      expect(env.DB.raw.prepare('SELECT recordatorios FROM simulador_estudio').get().recordatorios).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('borra el celular que el servicio de push da por muerto', async () => {
    vi.setSystemTime(new Date('2026-11-09T18:00:00Z'));
    try {
      await conPlan();
      fetch.mockImplementation(async () => new Response(null, { status: 410 }));
      await recordatoriosEstudio(env, LUNES_19, simuladores());
      expect(env.DB.raw.prepare('SELECT COUNT(*) n FROM simulador_push').get().n).toBe(0);
    } finally { vi.useRealTimers(); }
  });
});

describe('plan de estudio (lógica del cliente)', async () => {
  const vm = await import('node:vm');
  const { LOGICA_JS } = await import('../src/simulador/cliente.generado.js');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(LOGICA_JS, ctx);
  const L = ctx.SIM_LOGICA;
  const temas = [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }, { id: 'c', nombre: 'C' }, { id: 'd', nombre: 'D' }, { id: 'e', nombre: 'E' }];

  it('solo usa los días elegidos, antes del examen, y empieza por los temas más débiles', () => {
    // lunes 9 nov → examen lunes 30 nov; estudia lunes, miércoles y viernes
    const p = L.planEstudio({ hoy: '2026-11-09', fechaExamen: '2026-11-30', dias: [1, 3, 5], temas, desempeno: { c: { ok: 1, total: 5 }, a: { ok: 5, total: 5 } } });
    expect(p.map(s => s.f)).toEqual(['2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23', '2026-11-25', '2026-11-27']);
    expect(p.every(s => [1, 3, 5].includes(L.semanaDe(s.f)))).toBe(true);
    expect(p[0]).toMatchObject({ k: 'temas' });
    expect(p[0].t[0]).toBe('c');                                   // el más débil primero
    expect(p.flatMap(s => s.t).indexOf('a')).toBeGreaterThan(p.flatMap(s => s.t).indexOf('b'));   // el que domina, al final
    expect(p[5].k).toBe('simulacro');                              // cada 6.ª sesión
    expect(p[p.length - 1]).toMatchObject({ k: 'repaso', t: ['c', 'b', 'd'] });
    // todos los temas salen al menos una vez
    expect(new Set(p.flatMap(s => s.t))).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
  });

  it('sin días posibles o con el examen hoy no arma nada', () => {
    expect(L.planEstudio({ hoy: '2026-11-09', fechaExamen: '2026-11-09', dias: [1], temas })).toEqual([]);
    expect(L.planEstudio({ hoy: '2026-11-09', fechaExamen: '2026-11-10', dias: [0], temas })).toEqual([]);
  });

  it('cuenta una sesión como cumplida si ese día practicó alguno de sus temas (o hizo un simulacro)', () => {
    const ses = [{ f: '2026-11-09', k: 'temas', t: ['a'] }, { f: '2026-11-11', k: 'temas', t: ['b'] }, { f: '2026-11-13', k: 'simulacro', t: [] }];
    const hist = [
      { modo: 'practica', fecha: '2026-11-10T03:00:00Z', temas: { a: { ok: 1, total: 2 } } },   // 9 nov a las 21:00 en CDMX
      { modo: 'practica', fecha: '2026-11-11T18:00:00Z', temas: { c: { ok: 1, total: 1 } } },   // otro tema
      { modo: 'completo', fecha: '2026-11-13T18:00:00Z', temas: {} },
    ];
    expect(L.sesionesHechas(ses, hist, 'America/Mexico_City')).toEqual({ '2026-11-09': true, '2026-11-13': true });
  });
});

describe('videos explicativos', async () => {
  const { VIDEOS } = await import('../src/simulador/videos.generado.js');
  it('cada video publicado tiene audio, pasos en orden y vistas que la app sabe dibujar', () => {
    const tipos = ['escribe', 'flecha', 'circulo', 'subraya', 'tacha', 'caja', 'relleno', 'palomita'];
    for (const [app, vs] of Object.entries(VIDEOS)) for (const v of vs) {
      const sim = simuladores().find(s => s.APP === app);
      expect(sim.BANCO.TEMAS[v.tema], `${v.id}: tema`).toBeTruthy();
      expect(v.audio).toMatch(/^\/assets\/tienda\/simulador-videos\/.+\.mp3$/);
      expect(v.pasos[0].inicio).toBe(0);
      v.pasos.forEach((p, i) => {
        if (i) expect(p.inicio, `${v.id} paso ${i + 1}`).toBeGreaterThan(v.pasos[i - 1].inicio);
        expect(p.inicio).toBeLessThan(v.duracion);
        expect(p.voz.length).toBeGreaterThan(10);
        const ids = new Set(v.pasos.flatMap(x => x.acciones.filter(a => a.id).map(a => a.id)));
        for (const a of p.acciones) {
          expect(tipos, `${v.id} paso ${i + 1}`).toContain(a.a);
          // la frase que dispara la acción tiene que estar en la voz de su paso (si no, sale a destiempo)
          if (a.en) expect(p.voz.toLowerCase(), `${v.id} paso ${i + 1}: «${a.en}»`).toContain(a.en.toLowerCase());
          if (a.sobre) expect(ids.has(a.sobre), `${v.id}: «${a.sobre}»`).toBe(true);
          if (a.a === 'flecha') expect(a.hacia, `${v.id}: flecha sin «hacia»`).toBeTruthy();
          if (a.a === 'escribe') expect(a.x + a.texto.length * 0.4 * (a.tam || 76), `${v.id}: «${a.texto}» se sale del pizarrón`).toBeLessThan(1000);
        }
      });
    }
    expect((VIDEOS['simulador-paa'] || []).map(v => v.id)).toContain('paa-01');
  });

  it('con plan Completo llegan completos; sin él, solo el título (para ofrecerlos)', async () => {
    const completo = await comprar('simulador-paa-paquete');
    const d = await (await pedir('/api/simulador-paa/videos', { cookie: completo })).json();
    expect(d.bloqueado).toBeUndefined();
    expect(d.videos[0].pasos.length).toBeGreaterThan(5);
    expect(d.videos[0].audio).toBe('/assets/tienda/simulador-videos/paa/01.mp3');
    const practica = await comprar('simulador-paa-practica', 'beto@mail.com');
    const x = await (await pedir('/api/simulador-paa/videos', { cookie: practica })).json();
    expect(x.bloqueado).toBe(true);
    expect(x.videos[0]).toEqual({ id: 'paa-01', tema: 'aritmetica', titulo: expect.any(String), duracion: expect.any(Number) });
    expect((await pedir('/api/simulador-paa/videos')).status).toBe(401);
  });
});
