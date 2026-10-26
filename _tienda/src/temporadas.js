// Temas de temporada de la tienda: visten la tienda (color de acento, decoración en la portada, aviso y la línea que se
// destaca) en las fechas que importan en México. Se prenden solos por calendario (hora de CDMX) y desde el panel de la
// Tienda en Vorka OS se pueden apagar o fijar uno (tabla ajustes, clave "temporada": auto · apagado · <id>).
// Los avisos nunca prometen descuentos: solo invitan a la línea que va con la fecha.

const TZ_MS = 6 * 3600e3;   // CDMX es UTC−6 todo el año
const md = d => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
// n-ésimo día de la semana (0 = domingo) de un mes, en UTC (las fechas se manejan como días de CDMX)
function enesimo(anio, mes, dia, n) { const d = new Date(Date.UTC(anio, mes - 1, 1)); d.setUTCDate(1 + ((dia - d.getUTCDay() + 7) % 7) + (n - 1) * 7); return d; }
const mas = (d, dias) => new Date(d.getTime() + dias * 864e5);

export const TEMPORADAS = [
  { id: 'ano-nuevo', nombre: 'Año Nuevo', desde: '12-26', hasta: '01-06', acento: '#E6CF96', acento2: '#F2DFAE', sobre: '#1B1408', deco: 'confeti', colores: ['#E6CF96', '#C8A45C', '#FFFFFF', '#C08ADB'],
    aviso: 'Metas nuevas: empieza el año con todo', destacar: 'negocios' },
  { id: 'san-valentin', nombre: 'San Valentín', desde: '02-01', hasta: '02-14', acento: '#E8577E', acento2: '#F07596', sobre: '#FFFFFF', deco: 'corazones', colores: ['#E8577E', '#F6A5B9', '#FFFFFF'],
    aviso: 'Celebra el mes del amor con una invitación digital', destacar: 'eventos' },
  { id: 'dia-del-nino', nombre: 'Día del Niño', desde: '04-20', hasta: '04-30', acento: '#F2C94C', acento2: '#F6D873', sobre: '#1B1408', deco: 'confeti', colores: ['#F2C94C', '#45B7E8', '#E8577E', '#6FD39B'],
    aviso: 'Arma su fiesta con invitación y registro', destacar: 'eventos' },
  { id: 'dia-de-las-madres', nombre: 'Día de las Madres', desde: '05-01', hasta: '05-10', acento: '#E58AAA', acento2: '#EEA3BE', sobre: '#2A0E18', deco: 'corazones', colores: ['#E58AAA', '#F6C7D6', '#FFFFFF'],
    aviso: 'Un festejo inolvidable para mamá', destacar: 'eventos' },
  { id: 'dia-del-padre', nombre: 'Día del Padre', fechas: a => { const d = enesimo(a, 6, 0, 3); return [mas(d, -10), d]; }, acento: '#6FA3D9', acento2: '#8DB7E2', sobre: '#08121F', deco: 'estrellas', colores: ['#6FA3D9', '#FFFFFF', '#E6CF96'],
    aviso: 'Celebra a papá como se merece', destacar: 'eventos' },
  { id: 'regreso-a-clases', nombre: 'Regreso a clases', desde: '08-01', hasta: '09-05', acento: '#7FB7E6', acento2: '#9BC8EC', sobre: '#08121F', deco: 'estrellas', colores: ['#7FB7E6', '#F2C94C', '#FFFFFF'],
    aviso: 'Prepárate para tu examen de admisión', destacar: 'examenes' },
  { id: 'fiestas-patrias', nombre: 'Fiestas patrias', desde: '09-06', hasta: '09-16', acento: '#2FA36B', acento2: '#45B67E', sobre: '#FFFFFF', deco: 'papel', colores: ['#2FA36B', '#FFFFFF', '#D6283C'],
    aviso: '¡Viva México! Tu noche mexicana con registro y cover', destacar: 'eventos' },
  { id: 'halloween', nombre: 'Halloween y Día de Muertos', desde: '10-15', hasta: '11-02', acento: '#FF8A3D', acento2: '#FFA25F', sobre: '#1F0D02', deco: 'papel', colores: ['#FF8A3D', '#C08ADB', '#F2C94C', '#E8577E', '#45B7E8'],
    aviso: 'Tu fiesta con registro, cover y QR', destacar: 'eventos' },
  // El Buen Fin: del viernes antes del tercer lunes de noviembre al martes siguiente (2026: 13 al 17)
  { id: 'buen-fin', nombre: 'El Buen Fin', fechas: a => { const l = enesimo(a, 11, 1, 3); return [mas(l, -3), mas(l, 1)]; }, acento: '#E5484D', acento2: '#EC6A6E', sobre: '#FFFFFF', deco: 'confeti', colores: ['#E5484D', '#F2C94C', '#FFFFFF'],
    aviso: 'Herramientas para avanzar, al momento', destacar: null },
  { id: 'navidad', nombre: 'Navidad', desde: '12-01', hasta: '12-25', acento: '#2FA36B', acento2: '#45B67E', sobre: '#FFFFFF', deco: 'luces', colores: ['#E5484D', '#2FA36B', '#F2C94C', '#45B7E8'],
    aviso: 'Invitaciones para tus posadas y regalos digitales', destacar: 'eventos' },
];
export const temporadaPorId = id => TEMPORADAS.find(t => t.id === id) || null;

// La temporada que toca en una fecha (o null). Las de fecha exacta (Buen Fin, Día del Padre) ganan sobre las de rango.
export function temporadaDe(fecha = new Date()) {
  const d = new Date(fecha.getTime() - TZ_MS), hoy = md(d), a = d.getUTCFullYear();
  const dentro = t => {
    if (t.fechas) { const [x, y] = t.fechas(a); return d >= new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())) && d < mas(y, 1); }
    return t.desde <= t.hasta ? hoy >= t.desde && hoy <= t.hasta : hoy >= t.desde || hoy <= t.hasta;
  };
  return TEMPORADAS.find(t => t.fechas && dentro(t)) || TEMPORADAS.find(t => !t.fechas && dentro(t)) || null;
}
// Con el ajuste del panel: 'auto' (por calendario), 'apagado' o el id de una temporada fija
export const temporadaVigente = (modo = 'auto', fecha = new Date()) => modo === 'apagado' ? null : modo && modo !== 'auto' ? temporadaPorId(modo) : temporadaDe(fecha);

// ---------- el ajuste (se lee una vez por minuto por Worker; pagina() lo usa sin tocar la base) ----------
let CACHE = { modo: 'auto', t: 0 };
export async function cargarTemporada(env) {
  if (Date.now() - CACHE.t < 60e3) return;
  try { const r = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'temporada'").first(); CACHE = { modo: r?.valor || 'auto', t: Date.now() }; }
  catch { CACHE = { modo: 'auto', t: Date.now() }; }   // sin la tabla (antes de la migración) se queda en automático
}
export const temporadaActual = () => temporadaVigente(CACHE.modo);
export const olvidarTemporada = () => { CACHE.t = 0; };

// ---------- decoración (SVG ligero, sin imágenes) ----------
// Posiciones fijas pero "al azar" (misma semilla siempre: la página no cambia entre visitas)
function azar(semilla) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const r1 = n => Math.round(n * 10) / 10;
export function decoracion(t) {
  if (!t) return '';
  const R = azar(t.id.length * 7919), C = i => t.colores[i % t.colores.length];
  let g = '';
  if (t.deco === 'papel') {   // papel picado: un cordón con banderitas caladas
    g += '<path d="M0 8 Q360 26 720 8 T1440 8" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>';
    for (let i = 0; i < 24; i++) {
      const x = 12 + i * 60, y = 8 + Math.sin((x / 1440) * Math.PI * 2) * 9, c = C(i);
      g += `<g transform="translate(${x} ${r1(y)}) rotate(${r1((R() - .5) * 8)})"><path d="M0 0h44v40l-7-6-7 6-8-6-7 6-8-6-7 6z" fill="${c}" opacity=".92"/><path d="M8 9h6v6h-6zM19 9h6v6h-6zM30 9h6v6h-6zM13 21l9-5 9 5-9 5z" fill="#0F0D10" opacity=".55"/></g>`;
    }
    return `<svg class="t-deco papel" viewBox="0 0 1440 64" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${g}</svg>`;
  }
  if (t.deco === 'luces') {   // luces navideñas en un cable
    g += '<path d="M0 10 Q180 34 360 12 T720 12 T1080 12 T1440 12" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>';
    for (let i = 0; i < 36; i++) {
      const x = 20 + i * 40, y = 12 + Math.abs(Math.sin((x / 360) * Math.PI)) * 18, c = C(i);
      g += `<circle cx="${x}" cy="${r1(y + 9)}" r="11" fill="${c}" opacity=".22"/><rect x="${x - 3.5}" y="${r1(y)}" width="7" height="6" rx="1.5" fill="#bbb"/><ellipse cx="${x}" cy="${r1(y + 11)}" rx="5" ry="7" fill="${c}"/>`;
    }
    return `<svg class="t-deco luces" viewBox="0 0 1440 64" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${g}</svg>`;
  }
  // corazones, confeti y estrellas: repartidos en la portada, tenues para no competir con el texto
  for (let i = 0; i < 38; i++) {
    const x = r1(R() * 1440), y = r1(R() * 640), s = r1(.6 + R() * 1.1), rot = r1(R() * 360), c = C(i), o = r1(.25 + R() * .45);
    if (t.deco === 'corazones') g += `<path transform="translate(${x} ${y}) scale(${s}) rotate(${rot % 40 - 20})" d="M0 6C-6-3-16 2-12 10L0 20 12 10C16 2 6-3 0 6z" fill="${c}" opacity="${o}"/>`;
    else if (t.deco === 'estrellas') g += `<path transform="translate(${x} ${y}) scale(${s})" d="M0-10L2.5-2.5 10 0 2.5 2.5 0 10-2.5 2.5-10 0-2.5-2.5z" fill="${c}" opacity="${o}"/>`;
    else g += `<rect transform="translate(${x} ${y}) rotate(${rot})" x="-6" y="-2.5" width="${r1(8 + R() * 8)}" height="5" rx="1.5" fill="${c}" opacity="${o}"/>`;
  }
  return `<svg class="t-deco lluvia" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${g}</svg>`;
}
// Los colores de la temporada sobre el acento de la tienda
export const estiloTemporada = t => t ? `<style>:root[data-app]{--acento:${t.acento};--acento-2:${t.acento2};--sobre-acento:${t.sobre}}</style>` : '';
