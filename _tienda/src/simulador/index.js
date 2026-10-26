// Simuladores de examen de la tienda. Cada uno es una configuración del motor (motor.js):
//   vorka.mx/simulador-paa   → paa.js
//   vorka.mx/simulador-unam  → unam.js (4 áreas de licenciatura)
//   vorka.mx/simulador-ecoems → ecoems.js (bachillerato UNAM e IPN, sin áreas)
// Para sumar uno nuevo: su configuración, su banco y sus productos en D1 (con contenido.acceso.app = su ruta sin "/").
import { PAA } from './paa.js';
import { UNAM } from './unam.js';
import { ECOEMS } from './ecoems.js';
import { paginaPaaUniversidad } from './paa-universidades.js';

// Se arma al usarse (no al cargar el módulo): los simuladores importan la tienda, que a su vez importa este archivo
export const simuladores = () => [PAA, UNAM, ECOEMS];
export const simuladorDe = app => simuladores().find(s => s.APP === app) || null;
// Simulador al que da acceso un producto (por su contenido en D1), o null
export const simuladorDeContenido = contenido => {
  try { const c = typeof contenido === 'string' ? JSON.parse(contenido || '{}') : contenido || {}; return simuladorDe(c.acceso?.app); } catch { return null; }
};

export async function rutasSimulador(req, env, url) {
  // Páginas de la PAA por universidad: /simulador-paa/<universidad>/
  const u = url.pathname.match(/^\/simulador-paa\/([a-z-]{2,30})(\/?)$/);
  if (u && (req.method === 'GET' || req.method === 'HEAD') && !['app.js', 'app.css', 'entrar'].includes(u[1])) {
    const r = paginaPaaUniversidad(u[1]);
    if (r) return u[2] ? r : Response.redirect(`${url.origin}/simulador-paa/${u[1]}/`, 301);
  }
  for (const s of simuladores()) { const r = await s.rutas(req, env, url); if (r) return r; }
  return null;
}

// Compatibilidad: quien no dice de qué simulador habla, habla del PAA (el primero)
export const APP = 'simulador-paa';
export const cookieAcceso = (env, orderId, venceMs, app = APP, op = {}) => simuladorDe(app).cookieAcceso(env, orderId, venceMs, op);
export const ordenConAcceso = (env, orderId, ahora, app = APP) => simuladorDe(app).ordenConAcceso(env, orderId, ahora);
// Solo puede comprar simulacros o exámenes adicionales quien ya tiene ese simulador (lo revisa /api/checkout)
export const puedeComprarIntento = (env, email, app = APP) => (simuladorDe(app) || PAA).puedeComprarIntento(env, email);
