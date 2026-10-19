// Puntos Vorka · avisos: dentro de la app (puntos_notificaciones), en el celular (Web Push) y, si se pide, por correo.
// Web Push sin dependencias, igual que Vorka OS (os/src/push.js): la llave VAPID se genera sola la primera vez y se
// guarda en puntos_ajustes; los mensajes van cifrados (RFC 8291, aes128gcm). En iPhone funciona con la app agregada
// a la pantalla de inicio (iOS 16.4+). Las suscripciones que el servicio da por muertas (404/410) se borran.
import { all, one, run, enc } from './util.js';
import { enviar, marco, boton, P, esc } from './correo.js';

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const desB64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const unir = (...partes) => { const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0)); let i = 0; for (const p of partes) { out.set(p, i); i += p.length; } return out; };

export async function llavesPush(env) {
  const ya = await one(env, "SELECT valor FROM puntos_ajustes WHERE clave = 'vapid'");
  if (ya) { try { const v = JSON.parse(ya.valor); if (v.pub && v.jwk) return v; } catch { } }
  const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const v = { pub: b64u(await crypto.subtle.exportKey('raw', par.publicKey)), jwk: await crypto.subtle.exportKey('jwk', par.privateKey) };
  await run(env, "INSERT INTO puntos_ajustes (clave, valor) VALUES ('vapid', ?) ON CONFLICT(clave) DO NOTHING", JSON.stringify(v));
  return JSON.parse((await one(env, "SELECT valor FROM puntos_ajustes WHERE clave = 'vapid'")).valor);   // por si dos solicitudes la crearon a la vez
}

async function hkdf(salt, ikm, info, largo) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, largo * 8));
}

async function cifrar(sub, texto) {
  const uaPub = desB64u(sub.p256dh), auth = desB64u(sub.auth);
  const efimera = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', efimera.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, efimera.privateKey, 256));
  const ikm = await hkdf(auth, compartido, unir(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const clave = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, clave, unir(enc.encode(texto), new Uint8Array([2]))));
  return unir(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, cifrado);
}

async function jwtVapid(v, endpoint) {
  const cab = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const cuerpo = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:hola@vorka.mx' })));
  const k = await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, enc.encode(`${cab}.${cuerpo}`));
  return `${cab}.${cuerpo}.${b64u(firma)}`;
}

async function enviarA(env, v, sub, datos) {
  try {
    const r = await fetch(sub.endpoint, {
      method: 'POST',
      headers: { authorization: `vapid t=${await jwtVapid(v, sub.endpoint)}, k=${v.pub}`, ttl: '86400', 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', urgency: 'normal' },
      body: await cifrar(sub, JSON.stringify(datos)),
    });
    const ahora = new Date().toISOString();
    if (r.status === 404 || r.status === 410) await run(env, 'DELETE FROM puntos_push WHERE id = ?', sub.id);   // ya no existe ese celular
    else await run(env, `UPDATE puntos_push SET ${r.ok ? 'ultimo_ok' : 'ultimo_error'} = ? WHERE id = ?`, ahora, sub.id);
    return r.ok;
  } catch (e) {
    console.error('push puntos', e?.message);
    await run(env, 'UPDATE puntos_push SET ultimo_error = ? WHERE id = ?', new Date().toISOString(), sub.id).catch(() => { });
    return false;
  }
}

// Manda un push a todos los celulares de la cuenta. Devuelve cuántos lo recibieron.
export async function pushA(env, email, datos) {
  const subs = await all(env, 'SELECT * FROM puntos_push WHERE email = ?', email);
  if (!subs.length) return 0;
  const v = await llavesPush(env);
  const msg = { titulo: String(datos.titulo || 'Puntos Vorka').slice(0, 120), cuerpo: String(datos.cuerpo || '').slice(0, 240), url: datos.url || '/tienda/cuenta/', tag: datos.tag || undefined };
  return (await Promise.all(subs.map(s => enviarA(env, v, s, msg)))).filter(Boolean).length;
}

/**
 * Avisa a la cuenta: guarda el aviso en la app y lo manda por push (y por correo si viene `correo`).
 * Idempotente por (email, clave): el mismo aviso nunca sale dos veces (reintentos de webhooks).
 * Nunca lanza: un aviso que falla no debe tumbar el pago ni el panel.
 */
export async function avisar(env, email, { clave, tipo, titulo, cuerpo = '', url = '/tienda/cuenta/' }, { correo } = {}) {
  try {
    const r = await run(env, 'INSERT OR IGNORE INTO puntos_notificaciones (email, clave, tipo, titulo, cuerpo, url) VALUES (?,?,?,?,?,?)', email, clave, tipo, titulo, cuerpo, url);
    if (!r.meta.changes) return false;
    await pushA(env, email, { titulo, cuerpo, url, tag: tipo });
    if (correo) {
      const enlace = `${env.SITE_URL}${url}`;
      await enviar(env, { para: email, asunto: correo.asunto || titulo, idempotencia: `puntos-aviso-${clave}`.slice(0, 120),
        html: marco(titulo, `<p style="${P}">${esc(cuerpo)}</p>${correo.extra || ''}${boton(enlace, 'Abrir Puntos Vorka')}`, { etiqueta: 'Puntos' }),
        texto: `${titulo}\n\n${cuerpo}\n\n${enlace}` });
    }
    return true;
  } catch (e) { console.error('aviso puntos', clave, e?.message); return false; }
}

export async function rutasPush(req, env, url, email, body) {
  const p = url.pathname;
  if (p === '/api/puntos/push/clave') return { pub: (await llavesPush(env)).pub };
  if (p === '/api/puntos/push/suscribir') {
    const e = String(body.endpoint || ''), k = body.keys || {};
    if (!/^https:\/\/[^\s]{8,800}$/.test(e) || !/^[\w-]{20,200}$/.test(k.p256dh || '') || !/^[\w-]{8,100}$/.test(k.auth || '')) throw Object.assign(new Error('Suscripción inválida.'), { status: 400 });
    // Máximo 10 celulares por cuenta: el más viejo se va
    await run(env, `INSERT INTO puntos_push (email, endpoint, p256dh, auth) VALUES (?,?,?,?)
      ON CONFLICT(endpoint) DO UPDATE SET email = excluded.email, p256dh = excluded.p256dh, auth = excluded.auth`, email, e, k.p256dh, k.auth);
    await run(env, 'DELETE FROM puntos_push WHERE email = ? AND id NOT IN (SELECT id FROM puntos_push WHERE email = ? ORDER BY id DESC LIMIT 10)', email, email);
    const n = await pushA(env, email, { titulo: 'Avisos activados', cuerpo: 'Te avisaremos cuando alguien compre con tu liga, subas de nivel o alcances tu meta.', tag: 'prueba' });
    return { ok: true, enviados: n };
  }
  if (p === '/api/puntos/push/quitar') {
    await run(env, 'DELETE FROM puntos_push WHERE endpoint = ? AND email = ?', String(body.endpoint || ''), email);
    return { ok: true };
  }
  return null;
}
