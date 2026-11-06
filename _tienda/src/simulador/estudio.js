// Simuladores como app de estudio (nov 2026), solo para el plan Completo (práctica + examen):
//   /api/<app>/estudio            GET  → plan de estudio, apuntes y llave de push
//                                 POST → guarda { fecha_examen, dias, hora, recordatorios, sesiones }
//   /api/<app>/estudio/borrar     POST → borra el plan (los apuntes se quedan)
//   /api/<app>/apuntes            POST → { ref, texto } guarda un apunte ('r:<reactivo>', 't:<tema>' o 'general'); texto vacío lo borra
//   /api/<app>/push               POST → { endpoint, keys } suscribe este celular a los recordatorios (y manda uno de prueba)
//   /api/<app>/push/quitar        POST → { endpoint }
// El plan (las sesiones por día) lo arma el cliente (simulador/logica.js › planEstudio) con sus temas débiles; aquí se valida y
// se guarda para que el recordatorio de cada día diga qué toca. Los recordatorios salen del cron de cada hora (src/index.js)
// con la misma llave VAPID de Puntos Vorka (src/puntos-push.js).
import { one, all, run, json, fail } from '../util.js';
import { llavesPush, mandarPush } from '../puntos-push.js';

export const TZ = 'America/Mexico_City';
const MAX_APUNTES = 400, MAX_TEXTO = 4000, MAX_SESIONES = 400, MAX_PUSH = 5, POR_CORRIDA = 300;
const HORAS = [6, 22];
const TIPOS = ['temas', 'simulacro', 'repaso'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const esFecha = s => typeof s === 'string' && FECHA.test(s) && !isNaN(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
const diasEntre = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

// Fecha, hora y día de la semana en el centro de México
export function enMexico(fecha = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
    .formatToParts(new Date(fecha)).map(x => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour) % 24, semana: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}

// Plan Completo: el paquete, o Práctica + Examen comprados por separado (es lo mismo, solo que más caro). La compra de antes
// de los planes no lo incluye.
export const tieneEstudio = plan => !!(plan && (plan.paquete || (plan.practica && plan.examen)));

// Texto del recordatorio de hoy (o null si ya pasó el examen)
export function mensajeRecordatorio({ hoy, fecha_examen, sesiones = [], temas = {}, ruta }) {
  const faltan = diasEntre(hoy, fecha_examen);
  if (faltan < 0) return null;
  const url = `${ruta}/?app=1#hoy`, tag = 'estudio';
  if (faltan === 0) return { titulo: '¡Hoy es tu examen! 🍀', cuerpo: 'Lee con calma cada pregunta y administra tu tiempo. Ya te preparaste: ¡mucho éxito!', url, tag };
  if (faltan === 1) return { titulo: 'Mañana es tu examen', cuerpo: 'Hoy solo un repaso ligero de tus apuntes, prepara tus documentos y duerme temprano.', url, tag };
  const cuenta = `Faltan ${faltan} días para tu examen.`;
  const s = sesiones.find(x => x.f === hoy);
  const nombres = (s?.t || []).map(id => temas[id]?.nombre).filter(Boolean);
  if (s?.k === 'simulacro') return { titulo: 'Hoy toca simulacro 📝', cuerpo: `Mídete con un simulacro para ver cuánto has subido. ${cuenta}`, url, tag };
  if (s?.k === 'repaso') return { titulo: 'Hoy toca repaso', cuerpo: `${nombres.length ? `Repasa ${lista(nombres)} y tus apuntes.` : 'Repasa tus temas débiles y tus apuntes.'} ${cuenta}`, url, tag };
  if (nombres.length) return { titulo: `Hoy toca: ${lista(nombres)}`.slice(0, 110), cuerpo: `Unos 20 minutos de práctica con tutor y listo. ${cuenta}`, url, tag };
  return { titulo: 'Hora de estudiar 📚', cuerpo: `10 preguntas de tus temas débiles y listo. ${cuenta}`, url, tag };
}
const lista = n => n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`;

// c: { APP, RUTA, BANCO, REACTIVO }
export function crearEstudio({ APP, RUTA, BANCO, REACTIVO }) {
  const API = `/api/${APP}`;

  async function leer(env, email) {
    const e = await one(env, 'SELECT fecha_examen, dias, hora, recordatorios, sesiones, actualizado_at FROM simulador_estudio WHERE email = ? AND app = ?', email, APP);
    const apuntes = await all(env, 'SELECT ref, texto, actualizado_at FROM simulador_apuntes WHERE email = ? AND app = ? ORDER BY actualizado_at DESC', email, APP);
    const subs = (await one(env, 'SELECT COUNT(*) n FROM simulador_push WHERE email = ? AND app = ?', email, APP)).n;
    return {
      estudio: e ? { fecha_examen: e.fecha_examen, dias: e.dias.split(',').filter(Boolean).map(Number), hora: e.hora, recordatorios: !!e.recordatorios, sesiones: JSON.parse(e.sesiones || '[]'), actualizado_at: e.actualizado_at } : null,
      apuntes, push: { pub: (await llavesPush(env)).pub, suscripciones: subs },
    };
  }

  // Valida lo que manda el cliente; devuelve { error } o los datos limpios
  function validar(b, hoy) {
    if (!esFecha(b.fecha_examen)) return { error: 'Escribe la fecha de tu examen.' };
    const faltan = diasEntre(hoy, b.fecha_examen);
    if (faltan < 0) return { error: 'Esa fecha ya pasó. Escribe la fecha de tu próximo examen.' };
    if (faltan > 730) return { error: 'Esa fecha está muy lejos. Revisa el año.' };
    const dias = [...new Set((Array.isArray(b.dias) ? b.dias : []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!dias.length) return { error: 'Elige al menos un día para estudiar.' };
    const hora = Number(b.hora);
    if (!Number.isInteger(hora) || hora < HORAS[0] || hora > HORAS[1]) return { error: 'Elige una hora entre 6 de la mañana y 10 de la noche.' };
    const sesiones = (Array.isArray(b.sesiones) ? b.sesiones : []).slice(0, MAX_SESIONES)
      .filter(s => s && esFecha(s.f) && TIPOS.includes(s.k))
      .map(s => ({ f: s.f, k: s.k, t: (Array.isArray(s.t) ? s.t : []).filter(t => typeof t === 'string' && BANCO.TEMAS[t]).slice(0, 4) }));
    return { fecha_examen: b.fecha_examen, dias, hora, recordatorios: !!b.recordatorios, sesiones };
  }

  async function guardarEstudio(env, email, b) {
    const v = validar(b, enMexico().dia);
    if (v.error) return fail(v.error);
    const ahora = new Date().toISOString();
    await run(env, `INSERT INTO simulador_estudio (email, app, fecha_examen, dias, hora, recordatorios, sesiones, actualizado_at) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(email, app) DO UPDATE SET fecha_examen = excluded.fecha_examen, dias = excluded.dias, hora = excluded.hora, recordatorios = excluded.recordatorios,
        sesiones = excluded.sesiones, actualizado_at = excluded.actualizado_at,
        ultimo_aviso = CASE WHEN simulador_estudio.hora = excluded.hora THEN simulador_estudio.ultimo_aviso ELSE NULL END`,
      email, APP, v.fecha_examen, v.dias.join(','), v.hora, v.recordatorios ? 1 : 0, JSON.stringify(v.sesiones), ahora);
    return json({ ok: true, ...(await leer(env, email)) });
  }

  const REF = /^(r:[\w-]{1,60}|t:[\w-]{1,80}|general)$/;
  async function guardarApunte(env, email, b) {
    const ref = String(b.ref || '');
    if (!REF.test(ref) || (ref.startsWith('r:') && !REACTIVO[ref.slice(2)]) || (ref.startsWith('t:') && !BANCO.TEMAS[ref.slice(2)])) return fail('Apunte inválido.');
    const texto = String(b.texto ?? '').replace(/\r\n/g, '\n').trim();
    if (texto.length > MAX_TEXTO) return fail(`Tu apunte es muy largo (máximo ${MAX_TEXTO.toLocaleString('es-MX')} caracteres).`);
    if (!texto) {
      await run(env, 'DELETE FROM simulador_apuntes WHERE email = ? AND app = ? AND ref = ?', email, APP, ref);
      return json({ ok: true, borrado: true });
    }
    const ya = await one(env, 'SELECT id FROM simulador_apuntes WHERE email = ? AND app = ? AND ref = ?', email, APP, ref);
    if (!ya && (await one(env, 'SELECT COUNT(*) n FROM simulador_apuntes WHERE email = ? AND app = ?', email, APP)).n >= MAX_APUNTES)
      return fail(`Llegaste al máximo de ${MAX_APUNTES} apuntes. Borra alguno que ya no necesites.`);
    const ahora = new Date().toISOString();
    await run(env, `INSERT INTO simulador_apuntes (email, app, ref, texto, actualizado_at) VALUES (?,?,?,?,?)
      ON CONFLICT(email, app, ref) DO UPDATE SET texto = excluded.texto, actualizado_at = excluded.actualizado_at`, email, APP, ref, texto, ahora);
    return json({ ok: true, apunte: { ref, texto, actualizado_at: ahora } });
  }

  async function suscribir(env, email, b) {
    const e = String(b.endpoint || ''), k = b.keys || {};
    if (!/^https:\/\/[^\s]{8,800}$/.test(e) || !/^[\w-]{20,200}$/.test(k.p256dh || '') || !/^[\w-]{8,100}$/.test(k.auth || '')) return fail('No pudimos activar los recordatorios en este dispositivo.');
    await run(env, `INSERT INTO simulador_push (email, app, endpoint, p256dh, auth) VALUES (?,?,?,?,?)
      ON CONFLICT(endpoint) DO UPDATE SET email = excluded.email, app = excluded.app, p256dh = excluded.p256dh, auth = excluded.auth`, email, APP, e, k.p256dh, k.auth);
    await run(env, 'DELETE FROM simulador_push WHERE email = ? AND app = ? AND id NOT IN (SELECT id FROM simulador_push WHERE email = ? AND app = ? ORDER BY id DESC LIMIT ?)', email, APP, email, APP, MAX_PUSH);
    const sub = await one(env, 'SELECT * FROM simulador_push WHERE endpoint = ?', e);
    const ok = await enviarSub(env, await llavesPush(env), sub, { titulo: '¡Listo! Recordatorios activados', cuerpo: 'Así te vamos a avisar cuando te toque estudiar.', url: `${RUTA}/?app=1`, tag: 'prueba' });
    return json({ ok: true, prueba: ok });
  }

  async function rutas(req, env, p, a, permitido) {
    if (![`${API}/estudio`, `${API}/estudio/borrar`, `${API}/apuntes`, `${API}/push`, `${API}/push/quitar`].includes(p)) return null;
    if (!permitido) return fail('El plan de estudio, los recordatorios y los apuntes vienen en el plan Completo.', 403);
    const email = String(a.orden.email).toLowerCase(), M = req.method;
    if (p === `${API}/estudio` && M === 'GET') return json(await leer(env, email), 200, { 'cache-control': 'no-store' });
    if (M !== 'POST') return fail('Método no permitido', 405);
    const b = await req.json().catch(() => ({}));
    if (p === `${API}/estudio`) return guardarEstudio(env, email, b);
    if (p === `${API}/estudio/borrar`) { await run(env, 'DELETE FROM simulador_estudio WHERE email = ? AND app = ?', email, APP); return json({ ok: true }); }
    if (p === `${API}/apuntes`) return guardarApunte(env, email, b);
    if (p === `${API}/push`) return suscribir(env, email, b);
    await run(env, 'DELETE FROM simulador_push WHERE endpoint = ? AND email = ? AND app = ?', String(b.endpoint || ''), email, APP);
    return json({ ok: true });
  }

  return { rutas };
}

// Manda un push a una suscripción de los simuladores; borra las que el servicio da por muertas (404/410)
async function enviarSub(env, v, sub, datos) {
  try {
    const r = await mandarPush(v, sub, datos, { ttl: 6 * 3600 });
    if (r.status === 404 || r.status === 410) await run(env, 'DELETE FROM simulador_push WHERE id = ?', sub.id);
    else await run(env, `UPDATE simulador_push SET ${r.ok ? 'ultimo_ok' : 'ultimo_error'} = ? WHERE id = ?`, new Date().toISOString(), sub.id);
    return r.ok;
  } catch (e) {
    console.error('simulador: push', e?.message);
    await run(env, 'UPDATE simulador_push SET ultimo_error = ? WHERE id = ?', new Date().toISOString(), sub.id).catch(() => { });
    return false;
  }
}

// Cron de cada hora: el recordatorio de estudio a quien lo pidió a esta hora (centro de México), en sus días de estudio, más el
// día anterior y el día del examen. Uno al día como máximo; se deja de mandar si el acceso o el plan Completo ya no están.
// sims: los simuladores (src/simulador/index.js), para los temas, la ruta y revisar el acceso.
export async function recordatoriosEstudio(env, fecha, sims) {
  const { dia, hora, semana } = enMexico(fecha);
  const filas = await all(env, `SELECT * FROM simulador_estudio WHERE recordatorios = 1 AND hora = ? AND (ultimo_aviso IS NULL OR ultimo_aviso <> ?) AND fecha_examen >= ? LIMIT ?`,
    hora, dia, dia, POR_CORRIDA);
  const out = { revisados: filas.length, enviados: 0, sinAcceso: 0 };
  if (!filas.length) return out;
  const v = await llavesPush(env);
  for (const f of filas) {
    const marcar = () => run(env, 'UPDATE simulador_estudio SET ultimo_aviso = ? WHERE email = ? AND app = ?', dia, f.email, f.app);
    const sim = sims.find(s => s.APP === f.app);
    const faltan = diasEntre(dia, f.fecha_examen);
    if (!sim || (!f.dias.split(',').map(Number).includes(semana) && faltan > 1)) { await marcar(); continue; }
    if (!(await sim.estudioVigente(env, f.email))) {
      // Sin acceso vigente o sin plan Completo: se apagan sus recordatorios
      await run(env, 'UPDATE simulador_estudio SET recordatorios = 0 WHERE email = ? AND app = ?', f.email, f.app);
      out.sinAcceso++; continue;
    }
    let sesiones = []; try { sesiones = JSON.parse(f.sesiones || '[]'); } catch { }
    const msg = mensajeRecordatorio({ hoy: dia, fecha_examen: f.fecha_examen, sesiones, temas: sim.BANCO.TEMAS, ruta: sim.RUTA });
    await marcar();
    if (!msg) continue;
    const subs = await all(env, 'SELECT * FROM simulador_push WHERE email = ? AND app = ?', f.email, f.app);
    for (const s of subs) if (await enviarSub(env, v, s, msg)) out.enviados++;
  }
  return out;
}
