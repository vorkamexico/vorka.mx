// Simuladores de examen de la tienda. Cada uno es una configuración del motor (motor.js):
//   vorka.mx/simulador-paa   → paa.js
//   vorka.mx/simulador-unam  → unam.js (4 áreas de licenciatura)
//   vorka.mx/simulador-ecoems → ecoems.js (bachillerato UNAM e IPN, sin áreas)
//   vorka.mx/simulador-prepa-ug → prepa-ug.js (EXANI-I para el bachillerato de la UG, sin áreas, 3 opciones)
//   vorka.mx/simulador-ipn   → ipn.js (nivel superior del IPN, 3 áreas; banco de los de UNAM y PAA)
//   vorka.mx/simulador-exani-ii → exani-ii.js (licenciatura en las universidades que usan EXANI-II; 2 módulos a elegir, 3 opciones)
//   vorka.mx/simulador-excoba → excoba.js (licenciatura en la UAQ y la UG; 3 asignaturas a elegir, respuesta semiconstruida)
// Para sumar uno nuevo: su configuración, su banco y sus productos en D1 (con contenido.acceso.app = su ruta sin "/").
import { PAA } from './paa.js';
import { UNAM } from './unam.js';
import { ECOEMS } from './ecoems.js';
import { PREPA_UG } from './prepa-ug.js';
import { IPN } from './ipn.js';
import { EXANI_II } from './exani-ii.js';
import { paginaPaaUniversidad } from './paa-universidades.js';
import { paginaCalculadoraPaa } from './paa-calculadora.js';
import { paginaAciertosUnam, paginaCarreraUnam } from './unam-aciertos.js';
import { EXCOBA } from './excoba.js';
import { paginaExaniUniversidad, paginaSelector } from './exani-universidades.js';
import { paginaExcobaUniversidad } from './excoba-universidades.js';

// Se arma al usarse (no al cargar el módulo): los simuladores importan la tienda, que a su vez importa este archivo
export const simuladores = () => [PAA, UNAM, ECOEMS, PREPA_UG, IPN, EXANI_II, EXCOBA];
export const simuladorDe = app => simuladores().find(s => s.APP === app) || null;
// Simulador al que da acceso un producto (por su contenido en D1), o null
export const simuladorDeContenido = contenido => {
  try { const c = typeof contenido === 'string' ? JSON.parse(contenido || '{}') : contenido || {}; return simuladorDe(c.acceso?.app); } catch { return null; }
};

export async function rutasSimulador(req, env, url) {
  // Las guías viven en Vorka Learn (/learn/…); /<simulador>/guias/… redirige (rutasLearn, en src/index.js)
  // Páginas de la PAA por universidad: /simulador-paa/<universidad>/
  const u = url.pathname.match(/^\/simulador-paa\/([a-z-]{2,30})(\/?)$/);
  if (u && (req.method === 'GET' || req.method === 'HEAD') && !['app.js', 'app.css', 'entrar'].includes(u[1])) {
    const r = u[1] === 'calculadora' ? paginaCalculadoraPaa() : paginaPaaUniversidad(u[1]);
    if (r) return u[2] ? r : Response.redirect(`${url.origin}/simulador-paa/${u[1]}/`, 301);
  }
  // UNAM: aciertos por carrera y plantel (/simulador-unam/aciertos/ y /simulador-unam/aciertos/<carrera>/)
  const ua = url.pathname.match(/^\/simulador-unam\/aciertos(?:\/([a-z0-9-]{2,80}))?(\/?)$/);
  if (ua && (req.method === 'GET' || req.method === 'HEAD')) {
    const r = ua[1] ? paginaCarreraUnam(ua[1]) : paginaAciertosUnam();
    if (r) return ua[2] ? r : Response.redirect(`${url.origin}/simulador-unam/aciertos/${ua[1] ? `${ua[1]}/` : ''}`, 301);
  }
  // EXANI-II: «¿Cuál te sirve?» (/simulador-exani-ii/universidades/) y una página por universidad (/simulador-exani-ii/<universidad>/)
  const x = url.pathname.match(/^\/simulador-exani-ii\/([a-z-]{2,30})(\/?)$/);
  if (x && (req.method === 'GET' || req.method === 'HEAD')) {
    const r = x[1] === 'universidades' ? await paginaSelector(env) : paginaExaniUniversidad(x[1]);
    if (r) return x[2] ? r : Response.redirect(`${url.origin}/simulador-exani-ii/${x[1]}/`, 301);
  }
  // EXCOBA: una página por universidad (/simulador-excoba/uaq/ y /simulador-excoba/ug/) con las asignaturas de cada carrera
  const e = url.pathname.match(/^\/simulador-excoba\/(uaq|ug)(\/?)$/);
  if (e && (req.method === 'GET' || req.method === 'HEAD')) {
    const r = paginaExcobaUniversidad(e[1]);
    if (r) return e[2] ? r : Response.redirect(`${url.origin}/simulador-excoba/${e[1]}/`, 301);
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
