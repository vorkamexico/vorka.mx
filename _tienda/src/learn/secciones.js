// Vorka Learn · las secciones (exámenes y temas): su nombre corto, su color y su dibujo.
// La lista de qué secciones existen sale de los datos (src/simulador/guias.js › SIMS + GUIAS, vía src/learn/datos.js);
// aquí solo vive cómo se ven. Una sección nueva sin entrada aquí toma el color de Vorka Learn (no se rompe nada).
// Colores: «a» y «b» son el degradado del dibujo y de las tarjetas (siempre con texto blanco encima, contraste ≥ 4.5);
// «t» es el color del texto de acento sobre el fondo claro y «to» sobre el oscuro; «s»/«so» el fondo suave de las cajas.

export const SECCIONES = {
  paa:        { grupo: 'examen', corto: 'PAA',       a: '#5E2475', b: '#9A4FC0', t: '#6B2A85', to: '#D6AAEC', s: '#F4EDF7', so: 'rgba(192,138,219,.13)', motivo: 'hoja' },
  unam:       { grupo: 'examen', corto: 'UNAM',      a: '#173F86', b: '#3F7BD6', t: '#1D4E9E', to: '#9DBFF5', s: '#EBF1FB', so: 'rgba(120,165,240,.13)', motivo: 'libros' },
  ecoems:     { grupo: 'examen', corto: 'ECOEMS',    a: '#075A50', b: '#1F9C86', t: '#0B6E62', to: '#79D8C4', s: '#E6F4F1', so: 'rgba(70,195,170,.13)',  motivo: 'mapa' },
  'prepa-ug': { grupo: 'examen', corto: 'Prepa UG',  a: '#933A10', b: '#DC7A2E', t: '#A3461A', to: '#F4AE7E', s: '#FBEEE4', so: 'rgba(240,150,90,.13)',  motivo: 'cuaderno' },
  finanzas:   { grupo: 'tema',   corto: 'Finanzas',  a: '#155C38', b: '#2F9A62', t: '#1F7A4A', to: '#86DCAA', s: '#E8F5ED', so: 'rgba(92,196,139,.13)',  motivo: 'monedas' },
};
// Vorka Learn (portada, acerca, búsqueda y secciones sin color propio)
export const LEARN_COLOR = { grupo: 'tema', corto: 'Learn', a: '#2A1035', b: '#6B2A85', t: '#6B2A85', to: '#D6AAEC', s: '#F4EDF7', so: 'rgba(192,138,219,.13)', motivo: 'libro' };
// Las claves de finanzas que podría usar la sección (finanzas, finanzas-personales…) comparten el mismo aspecto
export const aspecto = clave => SECCIONES[clave] || (/^finanzas/.test(clave || '') ? SECCIONES.finanzas : LEARN_COLOR);

// Tokens CSS por sección: <body class="lr-s-<clave>"> (o cualquier elemento con esa clase) define --sec-a, --sec-b, --sec-t y
// --sec-s, y el tema oscuro los cambia. Así cada pieza usa var(--sec-t) y no sabe en qué sección está.
export function cssSecciones(claves = []) {
  const todas = [...new Set([...Object.keys(SECCIONES), ...claves])];
  const reglas = (sel, x, oscuro) => `${sel}{--sec-a:${x.a};--sec-b:${x.b};--sec-t:${oscuro ? x.to : x.t};--sec-s:${oscuro ? x.so : x.s}}`;
  const sel = (k, pre = '') => `${pre}.lr-s-${k}`;
  const claro = [reglas(':root[data-app="learn"]', LEARN_COLOR, false), ...todas.map(k => reglas(sel(k), aspecto(k), false))];
  const osc = pre => [reglas(`${pre}`, LEARN_COLOR, true), ...todas.map(k => reglas(sel(k, `${pre} `), aspecto(k), true))];
  return `${claro.join('')}
${osc(':root[data-app="learn"][data-tema="oscuro"]').join('')}
@media (prefers-color-scheme: dark){${osc(':root[data-app="learn"]:not([data-tema])').join('')}}`;
}
