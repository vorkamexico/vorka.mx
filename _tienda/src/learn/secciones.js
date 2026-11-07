// Vorka Learn · las secciones (exámenes y temas): su nombre corto, su color y su dibujo.
// La lista de qué secciones existen sale de los datos (src/simulador/guias.js › SIMS + GUIAS, vía src/learn/datos.js);
// aquí solo vive cómo se ven. Una sección nueva sin entrada aquí toma el color de Vorka Learn (no se rompe nada).
// Colores: «a» y «b» son el degradado del dibujo y de las tarjetas (siempre con texto blanco encima, contraste ≥ 4.5);
// «lema»: tres o cuatro palabras de qué hay en la sección (menú de computadora e índice de la portada).
// «t» es el color del texto de acento sobre el fondo claro y «to» sobre el oscuro; «s»/«so» el fondo suave de las cajas.

export const SECCIONES = {
  paa:        { grupo: 'examen', lema: 'Prueba de Aptitud Académica', corto: 'PAA',       a: '#5E2475', b: '#9A4FC0', t: '#6B2A85', to: '#D6AAEC', s: '#F4EDF7', so: 'rgba(192,138,219,.13)', motivo: 'hoja' },
  unam:       { grupo: 'examen', lema: 'Licenciatura en la UNAM', corto: 'UNAM',      a: '#173F86', b: '#3F7BD6', t: '#1D4E9E', to: '#9DBFF5', s: '#EBF1FB', so: 'rgba(120,165,240,.13)', motivo: 'libros' },
  ecoems:     { grupo: 'examen', lema: 'Prepa en el Valle de México', corto: 'ECOEMS',    a: '#075A50', b: '#1F9C86', t: '#0B6E62', to: '#79D8C4', s: '#E6F4F1', so: 'rgba(70,195,170,.13)',  motivo: 'mapa' },
  'prepa-ug': { grupo: 'examen', lema: 'Bachillerato de la UG', corto: 'Prepa UG',  a: '#933A10', b: '#DC7A2E', t: '#A3461A', to: '#F4AE7E', s: '#FBEEE4', so: 'rgba(240,150,90,.13)',  motivo: 'cuaderno' },
  ipn:        { grupo: 'examen', lema: 'Licenciatura en el IPN', corto: 'IPN', a: '#5C1530', b: '#A33A5E', t: '#7A1F40', to: '#F0A3BE', s: '#F9ECF1', so: 'rgba(230,130,165,.13)', motivo: 'libros' },
  finanzas:   { grupo: 'tema', lema: 'Tarjetas, deudas y ahorro',   corto: 'Finanzas',  a: '#155C38', b: '#2F9A62', t: '#1F7A4A', to: '#86DCAA', s: '#E8F5ED', so: 'rgba(92,196,139,.13)',  motivo: 'monedas' },
  camino:     { grupo: 'tema', lema: 'Becas, carrera y plan B',   corto: 'Camino',    a: '#3B2A86', b: '#6E5BD0', t: '#4A389E', to: '#B9ADF5', s: '#EFEDFB', so: 'rgba(160,145,240,.13)', motivo: 'senal' },
  negocio:    { grupo: 'tema', lema: 'Clientes, citas y ventas',   corto: 'Negocio',   a: '#7A1E46', b: '#C2416F', t: '#9A2858', to: '#F5A3C2', s: '#FBEAF1', so: 'rgba(235,120,165,.13)', motivo: 'tienda' },
  apps:       { grupo: 'tema', lema: 'Crea y vende tu app',   corto: 'Apps',      a: '#0D3F5C', b: '#1C6F96', t: '#155E80', to: '#8CCDEB', s: '#E8F3F9', so: 'rgba(110,190,230,.13)', motivo: 'celular' },
  fiestas:    { grupo: 'tema',   lema: 'Invitaciones y celebraciones', corto: 'Fiestas', a: '#7A2350', b: '#C04F86', t: '#962C62', to: '#F3A6CB', s: '#FAEBF2', so: 'rgba(235,130,180,.13)', motivo: 'sobre' },
  web:        { grupo: 'tema', lema: 'Tu página, paso a paso',   corto: 'Web',       a: '#4A2A0C', b: '#9A5220', t: '#94501E', to: '#F2B98A', s: '#FBF0E7', so: 'rgba(240,170,110,.13)', motivo: 'navegador' },
};
// Vorka Learn (portada, acerca, búsqueda y secciones sin color propio)
export const LEARN_COLOR = { grupo: 'tema', lema: '', corto: 'Learn', a: '#2A1035', b: '#6B2A85', t: '#6B2A85', to: '#D6AAEC', s: '#F4EDF7', so: 'rgba(192,138,219,.13)', motivo: 'libro' };
// Las claves de finanzas que podría usar la sección (finanzas, finanzas-personales…) comparten el mismo aspecto
export const aspecto = clave => SECCIONES[clave] || (/^finanzas/.test(clave || '') ? SECCIONES.finanzas : LEARN_COLOR);

// Tokens CSS por sección: <body class="lr-s-<clave>"> (o cualquier elemento con esa clase) define --sec-a, --sec-b, --sec-t y
// --sec-s, y el tema oscuro los cambia. Así cada pieza usa var(--sec-t) y no sabe en qué sección está.
export function cssSecciones(claves = []) {
  const todas = [...new Set(['learn', ...Object.keys(SECCIONES), ...claves])];
  const reglas = (sel, x, oscuro) => `${sel}{--sec-a:${x.a};--sec-b:${x.b};--sec-t:${oscuro ? x.to : x.t};--sec-s:${oscuro ? x.so : x.s}}`;
  const sel = (k, pre = '') => `${pre}.lr-s-${k}`;
  const claro = [reglas(':root[data-app="learn"]', LEARN_COLOR, false), ...todas.map(k => reglas(sel(k), aspecto(k), false))];
  const osc = pre => [reglas(`${pre}`, LEARN_COLOR, true), ...todas.map(k => reglas(sel(k, `${pre} `), aspecto(k), true))];
  return `${claro.join('')}
${osc(':root[data-app="learn"][data-tema="oscuro"]').join('')}
@media (prefers-color-scheme: dark){${osc(':root[data-app="learn"]:not([data-tema])').join('')}}`;
}
