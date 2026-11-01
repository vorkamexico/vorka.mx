// Vorka Learn · ilustraciones originales hechas con código (SVG): fondo con el degradado de la sección, la franja inclinada
// de la marca (-28°, el ángulo de la V) y un dibujo simple del tema (hoja de respuestas, libros, mapa, cuaderno, monedas, tienda, señal, celular).
// Sin fotos ni imágenes de terceros, sin logos de universidades ni de instituciones. Pesan 2–3 KB.
// semilla: cambia detalles (qué burbuja va llena, dónde van los círculos) para que dos guías de la misma sección no se
// vean idénticas. id: sufijo para que los degradados no choquen cuando hay varios dibujos en la misma página.
import { aspecto } from './secciones.js';

export const ARTE_W = 480, ARTE_H = 270;
const ORO = '#E6CF96', ORO_2 = '#C8A45C', TINTA = '#1B1320', BLANCO = '#FFFFFF';

export function hash(t = '') { let h = 7; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
const limpio = t => String(t).replace(/[^a-z0-9-]/gi, '');

// ---------- los dibujos (coordenadas en 480×270; el centro del dibujo en ~240,140) ----------
const MOTIVOS = {
  // Hoja de respuestas con burbujas (una llena por renglón) y un lápiz
  hoja: (x, s) => {
    const filas = [0, 1, 2, 3, 4].map(r => {
      const y = 92 + r * 27, llena = (s + r * 3) % 4;
      return `<rect x="182" y="${y - 4}" width="26" height="8" rx="4" fill="${x.a}" opacity=".22"/>${[0, 1, 2, 3].map(i =>
        `<circle cx="${226 + i * 21}" cy="${y}" r="7.5" ${i === llena ? `fill="${ORO_2}"` : `fill="none" stroke="${x.a}" stroke-opacity=".55" stroke-width="2"`}/>`).join('')}`;
    }).join('');
    return `<g transform="rotate(-6 240 140)"><rect x="164" y="58" width="152" height="176" rx="14" fill="${BLANCO}"/><rect x="182" y="70" width="70" height="9" rx="4.5" fill="${x.a}" opacity=".5"/>${filas}</g>
<g transform="rotate(38 338 168)"><rect x="296" y="158" width="92" height="20" rx="4" fill="${ORO}"/><rect x="296" y="158" width="92" height="7" rx="3" fill="${BLANCO}" opacity=".35"/><path d="M388 158l26 10-26 10z" fill="#F6E7C6"/><path d="M405 164.5l9 3.5-9 3.5z" fill="${TINTA}"/><rect x="284" y="158" width="16" height="20" rx="4" fill="#F2A7B5"/></g>`;
  },
  // Pila de libros y un birrete (genérico, sin escudos)
  libros: (x, s) => {
    const l = [[150, 188, 180, BLANCO], [166, 160, 150, ORO], [158, 132, 164, BLANCO]];
    return `${l.map(([lx, ly, w, c], i) => `<rect x="${lx}" y="${ly}" width="${w}" height="26" rx="5" fill="${c}"/><rect x="${lx + 10}" y="${ly + 6}" width="${w - 20}" height="3" rx="1.5" fill="${x.a}" opacity="${i === 1 ? '.35' : '.22'}"/><rect x="${lx + 10}" y="${ly + 16}" width="${(w - 20) * (.4 + ((s >> i) % 3) * .15)}" height="3" rx="1.5" fill="${x.a}" opacity=".22"/>`).join('')}
<path d="M240 66l70 24-70 24-70-24z" fill="${TINTA}"/><path d="M204 102v18c0 9 16 16 36 16s36-7 36-16v-18l-36 12z" fill="${TINTA}" opacity=".88"/><path d="M296 95v26" stroke="${ORO}" stroke-width="3" stroke-linecap="round"/><circle cx="296" cy="124" r="5" fill="${ORO}"/>`;
  },
  // Mapa doblado con un camino y tres opciones numeradas
  mapa: (x, s) => {
    const pin = (px, py, n, c) => `<g transform="translate(${px} ${py})"><path d="M0-34c-10 0-18 8-18 18 0 13 18 30 18 30s18-17 18-30c0-10-8-18-18-18z" fill="${c}"/><circle cy="-16" r="10" fill="${BLANCO}"/><text y="-11.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" fill="${x.a}">${n}</text></g>`;
    const d = s % 2 ? 'M190 196C220 150 250 200 270 150S320 120 318 104' : 'M188 190C214 200 236 140 262 160S300 130 320 112';
    return `<path d="M148 82l62-18 62 18 62-18v136l-62 18-62-18-62 18z" fill="${BLANCO}"/><path d="M210 64v136M272 82v136" stroke="${x.a}" stroke-opacity=".14" stroke-width="2"/><path d="M148 82l62-18v136l-62 18z" fill="${x.a}" opacity=".06"/>
<path d="${d}" fill="none" stroke="${x.a}" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round" opacity=".7"/>${pin(188, 196, 3, x.b)}${pin(262, 160, 2, ORO_2)}${pin(318, 110, 1, x.a)}`;
  },
  // Cuaderno con lista de pendientes y un sol sobre los cerros
  cuaderno: (x, s) => {
    const hechas = 2 + (s % 2);
    const filas = [0, 1, 2, 3].map(i => { const y = 96 + i * 30; return `<rect x="196" y="${y}" width="16" height="16" rx="4" fill="none" stroke="${x.a}" stroke-width="2" stroke-opacity=".6"/>${i < hechas ? `<path d="M199 ${y + 8}l4 4 7-8" fill="none" stroke="${ORO_2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}<rect x="222" y="${y + 5}" width="${70 - (i % 2) * 18}" height="6" rx="3" fill="${x.a}" opacity="${i < hechas ? '.2' : '.35'}"/>`; }).join('');
    return `<circle cx="348" cy="78" r="26" fill="${ORO}"/><path d="M0 232c70-40 130-46 190-22s120 18 170-12 90-20 120-8v80H0z" fill="${BLANCO}" opacity=".12"/>
<rect x="168" y="62" width="150" height="176" rx="14" fill="${BLANCO}"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="168" cy="${84 + i * 33}" r="6" fill="${x.a}" opacity=".85"/>`).join('')}<rect x="196" y="74" width="64" height="8" rx="4" fill="${x.a}" opacity=".5"/>${filas}`;
  },
  // Monedas apiladas y barras que suben (ahorro que crece)
  monedas: (x, s) => {
    const barras = [0, 1, 2, 3].map(i => { const h = 40 + i * 30 + ((s >> i) % 2) * 6; return `<rect x="${230 + i * 30}" y="${214 - h}" width="22" height="${h}" rx="5" fill="${BLANCO}" opacity="${.55 + i * .15}"/>`; }).join('');
    const pila = [0, 1, 2, 3, 4].map(i => `<ellipse cx="184" cy="${208 - i * 15}" rx="36" ry="11" fill="${ORO_2}"/><ellipse cx="184" cy="${203 - i * 15}" rx="36" ry="11" fill="${ORO}"/>`).join('');
    return `${barras}<path d="M228 160l42-30 30 14 50-46" fill="none" stroke="${ORO}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M336 92l18-2-2 18" fill="none" stroke="${ORO}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${pila}<text x="184" y="148" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#8A6A2C">$</text>`;
  },
  // Tiendita: toldo a rayas, aparador, puerta con letrero «abierto» y una bolsa de compra
  tienda: (x, s) => {
    const rayas = [0, 1, 2, 3, 4, 5].map(i => `<path d="M${156 + i * 28} 92h28v22c0 8-6 14-14 14s-14-6-14-14z" fill="${i % 2 ? BLANCO : (s % 2 ? ORO : x.b)}"/>`).join('');
    return `<rect x="164" y="104" width="152" height="118" rx="6" fill="${BLANCO}" opacity=".95"/><rect x="152" y="80" width="176" height="14" rx="5" fill="${TINTA}"/>${rayas}
<rect x="178" y="140" width="62" height="46" rx="5" fill="${x.a}" opacity=".18"/><path d="M186 176h46" stroke="${x.a}" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/><circle cx="198" cy="164" r="7" fill="${ORO_2}"/><circle cx="218" cy="166" r="5" fill="${x.b}" opacity=".7"/>
<rect x="254" y="138" width="44" height="84" rx="5" fill="${x.a}"/><circle cx="290" cy="182" r="3" fill="${ORO}"/><rect x="259" y="146" width="34" height="13" rx="3" fill="${ORO}"/><text x="276" y="156" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8.5" font-weight="800" fill="${TINTA}">ABIERTO</text>
<g transform="translate(${336 + (s % 3) * 4} 168)"><path d="M0 12h40l-4 46H4z" fill="${ORO}"/><path d="M12 14v-6a8 8 0 0 1 16 0v6" fill="none" stroke="${BLANCO}" stroke-width="3.5" stroke-linecap="round"/></g>`;
  },
  // Señal de camino con flechas hacia distintos lados y una vereda que sube a una estrella
  senal: (x, s) => {
    const izq = s % 2;
    return `<path d="M0 238c80-30 150-30 230-12s170 10 250-16v60H0z" fill="${BLANCO}" opacity=".12"/><path d="M236 236c-8-34 30-52 22-90s30-60 70-78" fill="none" stroke="${ORO}" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" opacity=".9"/>
<path d="M346 52l6 14 15 1-11 10 4 15-14-8-14 8 4-15-11-10 15-1z" fill="${ORO}"/>
<rect x="196" y="78" width="10" height="160" rx="4" fill="${TINTA}"/>
<path d="M${izq ? 208 : 206} 92h${izq ? 92 : 96}l22 17-22 17h-${izq ? 92 : 96}z" fill="${BLANCO}"/><rect x="${izq ? 220 : 218}" y="104" width="58" height="6" rx="3" fill="${x.a}" opacity=".45"/>
<path d="M194 136h-86l-22 17 22 17h86z" fill="${ORO}"/><rect x="112" y="150" width="54" height="6" rx="3" fill="${TINTA}" opacity=".35"/>
<path d="M208 180h70l18 14-18 14h-70z" fill="${BLANCO}" opacity=".85"/><rect x="220" y="191" width="40" height="6" rx="3" fill="${x.a}" opacity=".35"/>`;
  },
  // Celular con una cuadrícula de apps (una resaltada) y una burbuja de «nueva venta» con palomita
  celular: (x, s) => {
    const sel = s % 6;
    const apps = [0, 1, 2, 3, 4, 5].map(i => { const cx = 208 + (i % 3) * 32, cy = 104 + Math.floor(i / 3) * 34;
      return `<rect x="${cx - 12}" y="${cy - 12}" width="24" height="24" rx="7" fill="${i === sel ? ORO_2 : x.a}" opacity="${i === sel ? 1 : .22}"/>`; }).join('');
    return `<path d="M0 236c80-24 160-26 240-8s160 12 240-14v56H0z" fill="${BLANCO}" opacity=".12"/>
<rect x="182" y="50" width="116" height="196" rx="22" fill="${TINTA}"/><rect x="190" y="62" width="100" height="172" rx="14" fill="${BLANCO}"/><rect x="226" y="54" width="28" height="5" rx="2.5" fill="${BLANCO}" opacity=".35"/>
${apps}<rect x="200" y="182" width="80" height="10" rx="5" fill="${x.a}" opacity=".35"/><rect x="200" y="200" width="52" height="10" rx="5" fill="${x.a}" opacity=".2"/>
<g transform="translate(${300 + (s % 3) * 6} 88)"><rect width="98" height="40" rx="14" fill="${ORO}"/><path d="M14 40l-6 12 18-12z" fill="${ORO}"/><circle cx="22" cy="20" r="10" fill="${BLANCO}"/><path d="M17 20l4 4 7-8" fill="none" stroke="${x.a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="40" y="13" width="46" height="6" rx="3" fill="${TINTA}" opacity=".45"/><rect x="40" y="24" width="30" height="5" rx="2.5" fill="${TINTA}" opacity=".25"/></g>`;
  },
  // Libro abierto con una chispa (Vorka Learn)
  libro: (x, s) => `<path d="M240 92c-26-16-62-20-92-14v128c30-6 66-2 92 14z" fill="${BLANCO}"/><path d="M240 92c26-16 62-20 92-14v128c-30-6-66-2-92 14z" fill="${BLANCO}" opacity=".9"/><path d="M240 92v128" stroke="${x.a}" stroke-opacity=".25" stroke-width="2"/>
${[0, 1, 2, 3].map(i => `<path d="M164 ${108 + i * 22}c20-3 40-1 60 6M256 ${114 + i * 22}c20-7 40-9 60-6" fill="none" stroke="${x.a}" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/>`).join('')}
<path d="M338 58l7 17 17 7-17 7-7 17-7-17-17-7 17-7z" fill="${ORO}"/><path d="M150 52l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="${ORO}" opacity=".8"/>`,
};

// Un dibujo completo (fondo + franja + motivo). Devuelve el <svg> listo para ir inline o servirse como archivo.
export function arte(clave, { semilla = '', id = '', titulo = '', w, h, clase = 'lr-arte' } = {}) {
  const x = aspecto(clave), s = hash(`${clave}/${semilla}`), g = `g${limpio(id || clave)}${s % 997}`;
  const motivo = (MOTIVOS[x.motivo] || MOTIVOS.libro)(x, s);
  const cx = 40 + (s % 5) * 18, cy = 30 + ((s >> 3) % 4) * 12, off = (s >> 5) % 40;
  const etiqueta = titulo ? ` role="img" aria-label="${titulo.replace(/"/g, '&quot;')}"` : ' aria-hidden="true" focusable="false"';
  return `<svg class="${clase}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARTE_W} ${ARTE_H}"${w ? ` width="${w}" height="${h}"` : ''}${etiqueta}><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${x.a}"/><stop offset="1" stop-color="${x.b}"/></linearGradient></defs>
<rect width="${ARTE_W}" height="${ARTE_H}" fill="url(#${g})"/><path d="M${330 + off} 0h70L${256 + off} 270h-70z" fill="${BLANCO}" opacity=".07"/><path d="M${414 + off} 0h6L${276 + off} 270h-6z" fill="${ORO}" opacity=".35"/>
<circle cx="${cx}" cy="${cy}" r="46" fill="${BLANCO}" opacity=".06"/><circle cx="${ARTE_W - cx / 2}" cy="${ARTE_H - cy / 2}" r="64" fill="${BLANCO}" opacity=".05"/>${motivo}</svg>`;
}

// Archivo SVG servido por el Worker (/learn/arte/<clave>.svg y /learn/arte/<clave>/<guía>.svg): para las miniaturas con
// <img loading="lazy">, que el navegador guarda en caché y no engordan el HTML.
export function respuestaArte(clave, semilla = '') {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${arte(clave, { semilla, id: 'f' })}`, {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=604800', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'", 'x-content-type-options': 'nosniff' },
  });
}

// Portada: un collage de las secciones (tarjetas inclinadas, cada una con su dibujo) — inline en la portada
export function arteHero(claves = []) {
  const l = (claves.length ? claves : ['paa', 'unam', 'ecoems', 'prepa-ug']).slice(0, 5);
  const pos = [[18, 30, -7, 300], [230, 6, 6, 280], [6, 222, 4, 270], [250, 210, -5, 290], [140, 120, -2, 250]];
  const tarj = l.map((k, i) => { const [px, py, r, w] = pos[i], h = Math.round(w * ARTE_H / ARTE_W);
    return `<g transform="rotate(${r} ${px + w / 2} ${py + h / 2})"><rect x="${px - 3}" y="${py + 6}" width="${w + 6}" height="${h + 6}" rx="22" fill="#000" opacity=".12"/><svg x="${px}" y="${py}" width="${w}" height="${h}" viewBox="0 0 ${ARTE_W} ${ARTE_H}"><clipPath id="hc${i}"><rect width="${ARTE_W}" height="${ARTE_H}" rx="34"/></clipPath><g clip-path="url(#hc${i})">${arte(k, { semilla: 'portada', id: `h${i}`, clase: '' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg></g>`; });
  // la tarjeta del centro va al último para quedar encima
  const orden = tarj.length === 5 ? [0, 1, 2, 3, 4] : tarj.map((_, i) => i);
  return `<svg class="lr-hero-arte" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 420" aria-hidden="true" focusable="false">${orden.map(i => tarj[i]).join('')}</svg>`;
}
