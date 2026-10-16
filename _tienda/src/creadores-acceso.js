// Acceso al portal de creadores: enlace mágico por correo (30 min, un solo uso) → sesión en cookie (30 días)
import { one, run, aleatorio } from './util.js';
import { hashToken } from './entrega.js';

const COOKIE = 'vorka_creador';
const ENLACE_MIN = 30;
const SESION_DIAS = 30;

export async function crearEnlace(env, creadorId) {
  const token = aleatorio(32);
  await run(env, "INSERT INTO creador_accesos (token_hash, creador_id, tipo, expira_at) VALUES (?, ?, 'enlace', ?)",
    await hashToken(env, token), creadorId, new Date(Date.now() + ENLACE_MIN * 60e3).toISOString());
  return `${env.SITE_URL}/creadores/acceso/${token}`;
}

// Canjea el enlace (una sola vez) por una sesión. Devuelve la cabecera Set-Cookie o null.
export async function canjearEnlace(env, token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  const h = await hashToken(env, token);
  const ahora = new Date().toISOString();
  const r = await run(env, "UPDATE creador_accesos SET usado_at = ? WHERE token_hash = ? AND tipo = 'enlace' AND usado_at IS NULL AND expira_at > ?", ahora, h, ahora);
  if (!r.meta.changes) return null;
  const { creador_id } = await one(env, 'SELECT creador_id FROM creador_accesos WHERE token_hash = ?', h);
  const sesion = aleatorio(32);
  await run(env, "INSERT INTO creador_accesos (token_hash, creador_id, tipo, expira_at) VALUES (?, ?, 'sesion', ?)",
    await hashToken(env, sesion), creador_id, new Date(Date.now() + SESION_DIAS * 864e5).toISOString());
  return `${COOKIE}=${sesion}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESION_DIAS * 86400}`;
}

const leerCookie = req => (req.headers.get('cookie') || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === COOKIE)?.[1];

// Creador de la sesión (aprobado o suspendido; suspendido solo puede ver). null si no hay sesión válida.
export async function creadorActual(req, env) {
  const t = leerCookie(req);
  if (!/^[a-f0-9]{64}$/.test(t || '')) return null;
  return one(env, `SELECT c.* FROM creador_accesos a JOIN creadores c ON c.id = a.creador_id
    WHERE a.token_hash = ? AND a.tipo = 'sesion' AND a.expira_at > ? AND c.estado IN ('aprobado','suspendido')`, await hashToken(env, t), new Date().toISOString());
}

export async function cerrarSesion(req, env) {
  const t = leerCookie(req);
  if (/^[a-f0-9]{64}$/.test(t || '')) await run(env, 'DELETE FROM creador_accesos WHERE token_hash = ?', await hashToken(env, t));
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Las acciones que cambian algo solo se aceptan desde el propio sitio
export function mismoOrigen(req, env) {
  const o = req.headers.get('origin');
  return !o || o === new URL(env.SITE_URL).origin;
}
