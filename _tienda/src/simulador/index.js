// Simuladores de examen de la tienda. Cada uno es una configuración del motor (motor.js):
//   vorka.mx/simulador-paa   → paa.js
//   vorka.mx/simulador-unam  → unam.js (4 áreas de licenciatura)
// Para sumar uno nuevo: su configuración, su banco y sus productos en D1 (con contenido.acceso.app = su ruta sin "/").
import { PAA } from './paa.js';
import { UNAM } from './unam.js';

// Se arma al usarse (no al cargar el módulo): los simuladores importan la tienda, que a su vez importa este archivo
export const simuladores = () => [PAA, UNAM];
export const simuladorDe = app => simuladores().find(s => s.APP === app) || null;
// Simulador al que da acceso un producto (por su contenido en D1), o null
export const simuladorDeContenido = contenido => {
  try { const c = typeof contenido === 'string' ? JSON.parse(contenido || '{}') : contenido || {}; return simuladorDe(c.acceso?.app); } catch { return null; }
};

export async function rutasSimulador(req, env, url) {
  for (const s of simuladores()) { const r = await s.rutas(req, env, url); if (r) return r; }
  return null;
}

// Compatibilidad: quien no dice de qué simulador habla, habla del PAA (el primero)
export const APP = 'simulador-paa';
export const cookieAcceso = (env, orderId, venceMs, app = APP) => simuladorDe(app).cookieAcceso(env, orderId, venceMs);
export const ordenConAcceso = (env, orderId, ahora, app = APP) => simuladorDe(app).ordenConAcceso(env, orderId, ahora);
// Solo puede comprar simulacros o exámenes adicionales quien ya tiene ese simulador (lo revisa /api/checkout)
export const puedeComprarIntento = (env, email, app = APP) => (simuladorDe(app) || PAA).puedeComprarIntento(env, email);
