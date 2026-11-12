// Vorka Learn · Herramientas gratis (vorka.mx/learn/herramientas/…): dividir imagen, reducir peso, dividir PDF y código QR.
// Las tres últimas viven en src/learn/herramientas-nuevas.js (textos) y assets/herramientas/ (código del navegador).
// Cada herramienta corre completa en el navegador (su script lo sirve el Worker, src/learn/dividir-imagen-cliente.js):
// nada se sube. Debajo de la herramienta va una explicación con preguntas frecuentes (contenido propio para Google y AdSense)
// y la promoción de Vorka: lo más reciente de la Revista Sparks, guías de Learn y productos de la tienda.
// Anuncios: usa los mismos lugares de Learn (mitad y final, src/anuncios.js); sin ID en ADSENSE_SLOTS no aparece nada.
// Para agregar otra herramienta: súmala a HERRAMIENTAS, haz su página y su ruta en rutasHerramientas (el índice,
// el menú y el sitemap la leen de HERRAMIENTAS).
import { esc } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';
import { paginaLearn } from '../learn.js';
import { configAnuncios, espacioAnuncio } from '../anuncios.js';
import { listarProductos } from '../modelo.js';
import { SITIO, ld, ORG, LEARN, SITIO_LEARN, migas, migasLd } from './piezas.js';
import { articulos, OG_LEARN } from './datos.js';
import { tarjetaArticulo } from './tarjetas.js';
import { CLIENTE_DIVIDIR, V_DIVIDIR } from './dividir-imagen-cliente.js';
import { NUEVAS, CSS_NUEVAS } from './herramientas-nuevas.js';

export const RUTA_HERRAMIENTAS = '/learn/herramientas/';
const RUTA_DIVIDIR = '/learn/herramientas/dividir-imagen/';
const RUTA_JS_DIVIDIR = '/learn/herramientas/dividir-imagen.js';

// Portada de «Dividir imagen» (SVG propio, 16:10): un paisaje cortado en 3 × 3 con una pieza separada
function portadaDividir() {
  const W = 480, H = 300, x0 = 92, y0 = 40, w = 296, h = 220, g = 7;
  const cw = (w - 2 * g) / 3, ch = (h - 2 * g) / 3;
  const escena = `<rect width="${w}" height="${h}" fill="url(#hp-cielo)"/><circle cx="${w * .68}" cy="${h * .42}" r="34" fill="#FFE2A8"/>
    <path d="M0 ${h * .72} L${w * .22} ${h * .5} L${w * .4} ${h * .66} L${w * .62} ${h * .44} L${w} ${h * .7} V${h} H0Z" fill="#7B4FA6"/>
    <path d="M0 ${h * .86} L${w * .3} ${h * .7} L${w * .55} ${h * .82} L${w * .8} ${h * .68} L${w} ${h * .8} V${h} H0Z" fill="#4A2E6E"/>`;
  let piezas = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const sale = r === 0 && c === 2, dx = sale ? 26 : 0, dy = sale ? -18 : 0, x = c * (cw + g), y = r * (ch + g);
    piezas += `<g transform="translate(${x0 + x + dx} ${y0 + y + dy})"${sale ? ' filter="url(#hp-sombra)"' : ''}><svg width="${cw}" height="${ch}" viewBox="${x} ${y} ${cw} ${ch}" overflow="hidden">${escena}</svg></g>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Una foto de paisaje cortada en nueve partes" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="hp-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7B267"/><stop offset=".55" stop-color="#F28D8D"/><stop offset="1" stop-color="#B56FB8"/></linearGradient>
  <filter id="hp-sombra" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#2A1740" flood-opacity=".35"/></filter></defs>
  <rect width="${W}" height="${H}" fill="#EFE7F6"/>
  <circle cx="60" cy="250" r="90" fill="#E2D3F0"/><circle cx="430" cy="40" r="70" fill="#E2D3F0"/>
  ${piezas}
</svg>`;
}
export const urlsHerramientas = () => [RUTA_HERRAMIENTAS, ...HERRAMIENTAS.map(h => h.ruta)];

const MIGAS = [['Vorka Learn', '/learn/'], ['Herramientas', RUTA_HERRAMIENTAS]];
const ICONO_SUBIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/></svg>';

const CSS = `<style>
.di-cab .lr-lead{max-width:720px}
.di{margin-top:28px;background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);box-shadow:var(--sombra);padding:clamp(16px,3vw,28px)}
.di-zona{display:grid;place-items:center;text-align:center;gap:10px;min-height:250px;border:2px dashed var(--line-2,var(--line));border-radius:16px;padding:28px 18px;cursor:pointer;transition:border-color .15s,background .15s}
.di-zona:hover,.di-zona.di-encima,.di-zona:focus-within{border-color:var(--sec-t);background:var(--sec-s)}
.di-zona svg{width:42px;height:42px;color:var(--sec-t)}
.di-zona b{font-size:19px;letter-spacing:-.02em}.di-zona p{margin:0;color:var(--fg-2);font-size:15px}
.di-zona .btn{pointer-events:none}
.di-zona.di-cargando{opacity:.6;cursor:progress}
.di-panel{display:grid;gap:22px;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start}
@media (max-width:860px){.di-panel{grid-template-columns:1fr}}
.di-vista{position:relative;border-radius:12px;overflow:hidden;background:repeating-conic-gradient(var(--line) 0 25%,transparent 0 50%) 0 0/18px 18px;line-height:0}
.di-vista canvas{width:100%;height:auto;display:block}
.di-rejilla{position:absolute;inset:0;pointer-events:none}
.di-rejilla i{position:absolute;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.45)}
.di-v{top:0;bottom:0;width:2px;margin-left:-1px}.di-h{left:0;right:0;height:2px;margin-top:-1px}
.di-archivo{margin:10px 0 0;font-size:14px;color:var(--fg-2);display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between}
.di-archivo button{background:none;border:0;padding:0;font:inherit;color:var(--sec-t);font-weight:650;cursor:pointer;text-decoration:underline}
.di-opc{display:grid;gap:18px}
.di-opc fieldset{border:0;padding:0;margin:0;display:grid;gap:10px;min-width:0}
.di-opc legend{font-weight:700;font-size:15px;margin-bottom:8px;padding:0}
.di-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg-2,var(--line));border-radius:12px;padding:4px}
.di-seg label{display:block;text-align:center;padding:9px 8px;border-radius:9px;font-size:14.5px;font-weight:600;cursor:pointer;color:var(--fg-2)}
.di-seg input{position:absolute;opacity:0;pointer-events:none}
.di-seg label:has(input:checked){background:var(--card);color:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.di-seg label:has(input:focus-visible){outline:2px solid var(--sec-t);outline-offset:2px}
.di-par{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.di-campo{display:grid;gap:5px;font-size:14px;color:var(--fg-2);font-weight:600}
.di-campo input,.di-campo select{font:inherit;font-size:16px;color:var(--fg);background:var(--bg,#fff);border:1px solid var(--line-2,var(--line));border-radius:10px;padding:10px 12px;width:100%;min-width:0}
.di-campo input[type=range]{padding:0;border:0;background:none;accent-color:var(--sec-t)}
.di-atajos{display:flex;flex-wrap:wrap;gap:6px}
.di-atajos button{font:inherit;font-size:13.5px;font-weight:600;padding:7px 11px;border-radius:999px;border:1px solid var(--line-2,var(--line));background:var(--card);color:var(--fg);cursor:pointer}
.di-atajos button:hover{border-color:var(--sec-t);color:var(--sec-t)}
.di-info{margin:0;font-size:14.5px;color:var(--fg-2);line-height:1.5}
.di-aviso{margin:14px 0 0;padding:11px 14px;border-radius:10px;background:rgba(214,64,52,.1);color:#B4352B;font-size:14.5px;font-weight:600}
.di .btn[disabled]{opacity:.45;pointer-events:none}
.di-res{margin-top:28px;border-top:1px solid var(--line);padding-top:24px}
.di-res-cab{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.di-res-cab h2{margin:0;font-size:22px;letter-spacing:-.02em}
.di-orden{margin:10px 0 0;font-size:14.5px;color:var(--fg-2)}
.di-lista{list-style:none;padding:0;margin:18px 0 0;display:grid;grid-template-columns:repeat(var(--di-cols,3),minmax(0,1fr));gap:10px}
@media (max-width:560px){.di-lista{grid-template-columns:repeat(var(--di-cols-m,3),minmax(0,1fr));gap:6px}}
.di-lista li{display:grid;gap:6px;align-content:start}
.di-lista canvas{width:100%;height:auto;aspect-ratio:var(--di-ar);border-radius:8px;border:1px solid var(--line);background:var(--bg-2,transparent)}
.di-pie{display:flex;flex-wrap:wrap;gap:2px 8px;justify-content:space-between;align-items:baseline;font-size:12.5px;color:var(--fg-2)}
.di-pie b{color:var(--fg)}
.di-bajar{font-weight:700;color:var(--sec-t);text-decoration:none}.di-bajar:hover{text-decoration:underline}
.di-privado{margin:16px 0 0;font-size:13.5px;color:var(--fg-2);display:flex;gap:8px;align-items:center}
.di-privado svg{width:16px;height:16px;flex:none;color:var(--sec-t)}
.di-texto{margin-top:clamp(40px,6vw,64px)}
.di-texto h2{font-size:clamp(22px,2.6vw,28px);letter-spacing:-.025em;margin:36px 0 10px}
.di-texto h3{font-size:18px;letter-spacing:-.015em;margin:22px 0 6px}
.di-texto p,.di-texto li{font-size:17px;line-height:1.65;color:var(--fg-2)}
.di-texto p{margin:0 0 12px}
.di-texto ul{padding-left:20px;margin:0 0 12px}
.di-faq details{border-top:1px solid var(--line);padding:14px 0}
.di-faq details:last-child{border-bottom:1px solid var(--line)}
.di-faq summary{font-weight:700;font-size:17px;line-height:1.35;cursor:pointer;list-style:none;display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
.di-faq summary::-webkit-details-marker{display:none}
.di-faq summary::after{content:"+";flex:none;font-size:24px;line-height:22px;font-weight:400;color:var(--fg-2)}
.di-faq details[open] summary::after{content:"−"}
.di-faq details p{margin:10px 0 0}
.di-promo .gu-grid{margin-top:16px}
.di-card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);overflow:hidden;color:inherit;text-decoration:none;box-shadow:var(--sombra);transition:border-color .15s}
.di-card:hover{border-color:var(--line-2,var(--fg-3))}
.di-card-img{aspect-ratio:16/9;background:var(--bg-2,var(--line));overflow:hidden;position:relative}
.di-card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.di-card-c{padding:16px 18px 18px;display:grid;gap:6px}
.di-card-c small{font-size:13px;font-weight:650;color:var(--fg-2)}
.di-card-c h3{font-size:17px;line-height:1.3;letter-spacing:-.015em;margin:0}
.di-card-c p{margin:0;font-size:14.5px;color:var(--fg-2);line-height:1.5}
.di-mas{margin:14px 0 0;font-weight:650}.di-mas a{color:var(--sec-t);display:inline-flex;align-items:center;gap:6px;text-decoration:none}.di-mas a:hover{text-decoration:underline}
.di-mas svg,.di-arriba svg,.di-res-promo svg{width:16px;height:16px;flex:none}
/* productos para estudiantes, a la vista desde el inicio */
.di-arriba{margin-top:22px}
.di-arriba-t{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;justify-content:space-between;margin:0 0 10px;font-size:15px;color:var(--fg-2)}
.di-arriba-t b{color:var(--fg);font-size:16px}
.di-arriba-t a{color:var(--sec-t);font-weight:650;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
.di-tira{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
@media (max-width:760px){.di-tira{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:min(78%,280px);overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:20px;padding:0 20px 6px;margin:0 -20px;scrollbar-width:none}.di-tira>*{scroll-snap-align:start}}
.di-mini{display:flex;gap:12px;align-items:center;padding:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;color:inherit;text-decoration:none;box-shadow:var(--sombra);transition:border-color .15s}
.di-mini:hover{border-color:var(--sec-t)}
.di-mini img{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none;background:var(--bg-2,var(--line))}
.di-mini span{display:grid;gap:2px;min-width:0}
.di-mini b{font-size:15px;line-height:1.25;letter-spacing:-.01em}
.di-mini small{font-size:13px;line-height:1.35;color:var(--fg-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.di-res-promo{margin-top:20px;display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;justify-content:space-between;padding:16px 18px;border-radius:14px;background:var(--sec-s)}
.di-res-promo p{margin:0;font-size:15.5px;color:var(--fg);max-width:560px}
.di-res-promo .btn{flex:none}
/* anuncios propios de Vorka (Brindi, Vuelve) */
.di-ad{margin:32px 0;position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);align-items:stretch;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#2B1742,#4B2569);color:#F4F2F5;text-decoration:none;box-shadow:0 10px 30px rgba(20,10,30,.18);border:1px solid rgba(255,255,255,.12)}
.di-ad:hover .btn{transform:translateY(-1px)}
.di-ad-img{position:relative;min-height:220px;background:#221b2b}
.di-ad-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.di-ad-c{padding:clamp(20px,3vw,32px);display:grid;gap:12px;align-content:center}
.di-ad-etq{font-size:12px;font-weight:600;color:rgba(244,242,245,.6)}
.di-ad-c b{font-size:clamp(22px,2.8vw,30px);line-height:1.12;letter-spacing:-.025em;color:#fff}
.di-ad-c p{margin:0;font-size:15.5px;line-height:1.5;color:rgba(244,242,245,.78)}
.di-ad-c .btn{justify-self:start;margin-top:4px;display:inline-flex;align-items:center;gap:8px}
.di-ad-c .btn svg{width:17px;height:17px}
.di-ad[data-producto="vuelve"]{background:linear-gradient(135deg,#0E2E27,#17594A)}.di-ad[data-producto="vuelve"] .di-ad-img{background:#183029}
@media (max-width:700px){.di-ad{grid-template-columns:1fr}.di-ad-img{min-height:0;aspect-ratio:16/9}}
.he-grid{list-style:none;padding:0;margin:32px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:20px}
.he-card{display:flex;flex-direction:column;height:100%;background:var(--card);border:1px solid var(--line);border-radius:22px;overflow:hidden;color:inherit;text-decoration:none;box-shadow:var(--sombra);transition:border-color .15s,transform .2s}
.he-card:hover{border-color:var(--sec-t);transform:translateY(-2px)}
.he-portada{display:block;aspect-ratio:16/10;background:#EFE7F6;overflow:hidden}
.he-portada svg{display:block;width:100%;height:100%}
.he-c{padding:clamp(18px,2.6vw,26px);display:flex;flex-direction:column;gap:10px;flex:1}
.he-c h2{margin:0;font-size:clamp(21px,2.4vw,26px);line-height:1.15;letter-spacing:-.025em}
.he-c p{margin:0;font-size:15.5px;line-height:1.55;color:var(--fg-2)}
.he-usos{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 0;padding:0;list-style:none}
.he-usos li{font-size:13px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--sec-s);color:var(--sec-t)}
.he-pie{margin-top:auto;padding-top:8px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}
.he-pie small{font-size:13px;color:var(--fg-2)}
.he-pie .btn{display:inline-flex;align-items:center;gap:8px}.he-pie .btn svg{width:17px;height:17px}
@media (min-width:820px){.he-grid.he-uno{grid-template-columns:1fr}.he-uno .he-card{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}.he-uno .he-portada{aspect-ratio:auto;min-height:320px}}
.he-otras .he-grid{margin-top:18px;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:14px}.he-otras .he-c{padding:16px}.he-otras .he-c h2{font-size:18px}.he-otras .he-c p,.he-otras .he-usos,.he-otras .he-pie small{display:none}
${CSS_NUEVAS}</style>`;

// ---------- promoción (cada parte falla en silencio: si no carga, no aparece) ----------
let SPARKS = { t: 0, v: null };
async function noticiasSparks() {
  if (SPARKS.v && Date.now() - SPARKS.t < 10 * 60 * 1000) return SPARKS.v;
  try {
    const r = await fetch(`${SITIO}/sparks/celaya/noticias.json`, { cf: { cacheTtl: 600, cacheEverything: true }, signal: AbortSignal.timeout(2500) });
    if (!r.ok) return SPARKS.v || [];
    const d = await r.json();
    const img = String(d.img || '').replace(/\/$/, '');
    const v = (d.n || []).filter(n => n && n.s && n.t).slice(0, 3).map(n => ({
      href: `/sparks/celaya/${encodeURIComponent(n.s)}/`, titulo: n.t, resumen: n.r || '', categoria: n.c || 'Sparks', fecha: n.f || '',
      foto: img && n.i ? `${img}/${encodeURIComponent(n.i)}-800.webp` : '', alt: n.p || n.t }));
    SPARKS = { t: Date.now(), v };
    return v;
  } catch { return SPARKS.v || []; }
}

// Productos de la tienda para estudiantes (quienes más usan esta herramienta), en orden de prioridad. Sin precios: se ven
// en la ficha. Los 3 primeros que estén a la venta van arriba de la herramienta; los siguientes, abajo.
const PRODUCTOS_PROMO = ['test-vocacional', 'simulador-paa-practica', 'simulador-exani-ii-practica', 'simulador-unam-practica',
  'simulador-ipn-practica', 'que-proyecto-social', 'evaluacion-liderazgo', 'simuladores-universidad'];
async function catalogo(env) { try { return await listarProductos(env); } catch { return []; } }
async function productosPromo(env, l) {
  try {
    l ??= await listarProductos(env);
    return PRODUCTOS_PROMO.map(s => l.find(p => p.slug === s)).filter(Boolean).slice(0, 7);
  } catch { return []; }
}
const enlaceProducto = p => p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`;

// Guías de Learn para estudiantes: exámenes de admisión y «Tu camino» (becas, carrera), las más nuevas primero
function guiasPromo() {
  const l = articulos().filter(a => a.s.grupo === 'examen' || a.clave === 'camino');
  return l.sort((a, b) => String(b.x.publicado || '').localeCompare(String(a.x.publicado || ''))).slice(0, 3);
}

const tarjetaNoticia = n => `<a class="di-card" href="${esc(n.href)}">${n.foto ? `<span class="di-card-img"><img src="${esc(n.foto)}" alt="${esc(n.alt)}" width="800" height="450" loading="lazy" decoding="async"></span>` : ''}<span class="di-card-c"><small>${esc(n.categoria)}${n.fecha ? ` · ${esc(n.fecha)}` : ''}</small><h3>${esc(n.titulo)}</h3>${n.resumen ? `<p>${esc(n.resumen)}</p>` : ''}</span></a>`;
const tarjetaProducto = p => `<a class="di-card" href="${esc(enlaceProducto(p))}">${p.imagen ? `<span class="di-card-img"><img src="${esc(p.imagen)}" alt="" width="800" height="450" loading="lazy" decoding="async"></span>` : ''}<span class="di-card-c"><small>${esc(p.categoria || 'Tienda Vorka')}</small><h3>${esc(p.nombre)}</h3>${p.descripcion_corta ? `<p>${esc(p.descripcion_corta)}</p>` : ''}</span></a>`;

const corto = t => { t = String(t || ''); return t.length > 90 ? `${t.slice(0, 88).replace(/\s+\S*$/, '')}…` : t; };
const miniProducto = p => `<a class="di-mini" href="${esc(enlaceProducto(p))}">${p.imagen ? `<img src="${esc(p.imagen)}" alt="" width="64" height="64" decoding="async">` : ''}<span><b>${esc(p.nombre)}</b>${p.descripcion_corta ? `<small>${esc(corto(p.descripcion_corta))}</small>` : ''}</span></a>`;
// Tira de productos arriba de la herramienta ('' si no hay)
const tiraArriba = productos => productos.length ? `<aside class="di-arriba" aria-label="Para estudiantes, de Vorka México"><p class="di-arriba-t"><b>¿Estudias? Esto también te sirve</b><a href="/tienda/">Ver la tienda ${FLECHA}</a></p><div class="di-tira">${productos.slice(0, 3).map(miniProducto).join('')}</div></aside>` : '';
// Llamado que aparece junto con las partes ya cortadas
const llamadoResultado = p => p ? `<div class="di-res-promo"><p><b>¿Vas a presentar examen de admisión?</b> ${esc(corto(p.descripcion_corta || p.nombre))}</p><a class="btn tinta" href="${esc(enlaceProducto(p))}">${esc(p.nombre)} ${FLECHA}</a></div>` : '';

// Anuncios propios de Vorka con el formato de un anuncio: imagen grande, título, texto y botón. Se marcan como anuncio.
const ANUNCIOS_CASA = {
  brindi: { slug: 'brindi-celebracion', titulo: 'Invitaciones digitales para tu fiesta', boton: 'Ver Brindi' },
  vuelve: { slug: 'vuelve-mensual', titulo: 'Haz que tus clientes regresen', boton: 'Ver Vuelve' },
};
const anuncioCasa = (clave, lista) => {
  const a = ANUNCIOS_CASA[clave], p = lista.find(x => x.slug === a.slug);
  if (!p) return '';
  return `<a class="di-ad" data-producto="${clave}" href="${esc(enlaceProducto(p))}" aria-label="Anuncio de Vorka México: ${esc(a.titulo)}">${p.imagen ? `<span class="di-ad-img"><img src="${esc(p.imagen)}" alt="" width="800" height="450" loading="lazy" decoding="async"></span>` : ''}<span class="di-ad-c"><span class="di-ad-etq">Anuncio · ${esc(p.nombre.split(' · ')[0])} de Vorka México</span><b>${esc(a.titulo)}</b>${p.descripcion_corta ? `<p>${esc(p.descripcion_corta)}</p>` : ''}<span class="btn acento">${esc(a.boton)} ${FLECHA}</span></span></a>`;
};

async function promocion(env, productos) {
  const noticias = await noticiasSparks();
  const guias = guiasPromo();
  const bloque = (titulo, lead, tarjetas, mas) => tarjetas ? `<section class="lr-grupo di-promo"><div class="lr-grupo-cab"><h2 class="lr-h2">${titulo}</h2></div><p class="lr-grupo-lead">${lead}</p><div class="gu-grid">${tarjetas}</div><p class="di-mas">${mas}</p></section>` : '';
  return [
    bloque('Simuladores y tests para estudiantes', 'Prepárate para tu examen de admisión y elige carrera con las herramientas de Vorka México.', productos.slice(3, 7).map(tarjetaProducto).join(''), `<a href="/tienda/">Ver la tienda ${FLECHA}</a>`),
    bloque('Guías para tu examen y tu carrera', 'Guías gratis de Vorka Learn, con fuentes oficiales: qué viene en tu examen, becas y cómo elegir carrera.', guias.map(tarjetaArticulo).join(''), `<a href="/learn/">Ver todas las guías ${FLECHA}</a>`),
    bloque('Lo más reciente en Revista Sparks', 'Noticias e historias del Bajío que publica Vorka México.', noticias.map(tarjetaNoticia).join(''), `<a href="/sparks/">Leer Revista Sparks ${FLECHA}</a>`),
  ].join('');
}

// ---------- «Dividir una imagen en partes» ----------
const FAQ_DIVIDIR = [
  ['¿Mi imagen se sube a algún servidor?', 'No. El corte lo hace tu navegador, en tu celular o tu computadora. La imagen no se envía a Vorka ni a nadie más; cuando la página ya cargó, la herramienta funciona aunque te quedes sin internet.'],
  ['¿Las partes pierden calidad?', 'En PNG cada parte conserva exactamente los píxeles de la original. JPG y WebP comprimen la imagen para que pese menos; con la calidad en 92 % la diferencia casi no se nota. Si tu original es JPG y la vas a subir a redes, JPG está bien.'],
  ['¿Cómo hago el mosaico de 9 fotos en mi perfil de Instagram?', 'Divide la imagen en 3 filas y 3 columnas. Instagram acomoda tu perfil de 3 en 3 y pone la publicación más nueva arriba a la izquierda, así que publica primero la parte 9 (abajo a la derecha) y al final la 1. Desde 2025 el perfil muestra las miniaturas en vertical (proporción 3:4): si tu imagen completa también es 3:4, cada parte sale 3:4 y el mosaico encaja.'],
  ['¿Cómo hago un carrusel panorámico?', 'Usa 1 fila y tantas columnas como fotos quieras en el carrusel, y súbelas en orden de la 1 a la última. Por ejemplo, para 3 publicaciones verticales de 1080 × 1350 px, empieza con una imagen de 3240 × 1350 px.'],
  ['¿Puedo imprimir una imagen grande en varias hojas?', 'Sí. Divídela en 2 × 2 o 3 × 3, imprime cada parte en una hoja tamaño carta a hoja completa y únelas por detrás con cinta. Para que no se vea pixeleada, usa una imagen de buena resolución: cuenta unos 2500 px de ancho por cada hoja.'],
  ['¿Qué pasa si la imagen no se divide exacto?', 'En «Filas y columnas» repartimos los píxeles que sobran entre las partes, así que algunas pueden medir 1 px más que otras. En «Tamaño en píxeles» todas miden lo que pides menos las de la orilla derecha y de abajo, que quedan más chicas.'],
  ['¿Hay límite de tamaño?', 'Puedes cortar imágenes de hasta 50 megapíxeles y sacar hasta 400 partes. En celulares, las imágenes muy grandes pueden fallar por falta de memoria; si pasa, usa una versión más chica de la foto.'],
];

function herramientaDividir(llamado = '') {
  return `<div class="di" id="di">
  <label class="di-zona" id="di-zona" for="di-archivo">
    ${ICONO_SUBIR}
    <b>Elige una imagen</b>
    <p>Arrástrala aquí, pégala con Ctrl + V o tócala para buscarla. JPG, PNG, WebP o GIF.</p>
    <span class="btn tinta">Elegir imagen</span>
    <input id="di-archivo" class="vh" type="file" accept="image/*">
  </label>
  <noscript><p class="di-aviso">Para dividir imágenes necesitas activar JavaScript en tu navegador.</p></noscript>
  <p class="di-aviso" id="di-aviso" role="alert" hidden></p>
  <div class="di-panel" id="di-panel" hidden>
    <div>
      <div class="di-vista"><canvas id="di-lienzo" width="1" height="1" role="img" aria-label="Vista previa con las líneas de corte"></canvas><div class="di-rejilla" id="di-rejilla"></div></div>
      <p class="di-archivo"><span id="di-nombre"></span><button type="button" id="di-otra">Usar otra imagen</button></p>
    </div>
    <div class="di-opc">
      <fieldset>
        <legend>Cómo dividir</legend>
        <div class="di-seg"><label><input type="radio" name="di-modo" value="partes" checked>Filas y columnas</label><label><input type="radio" name="di-modo" value="px">Tamaño en píxeles</label></div>
      </fieldset>
      <div id="di-g-partes" class="di-opc">
        <div class="di-par"><label class="di-campo">Filas<input id="di-filas" type="number" inputmode="numeric" min="1" max="50" value="1"></label><label class="di-campo">Columnas<input id="di-cols" type="number" inputmode="numeric" min="1" max="50" value="3"></label></div>
        <div class="di-atajos" aria-label="Atajos"><button type="button" data-f="1" data-c="2">Carrusel de 2</button><button type="button" data-f="1" data-c="3">Carrusel de 3</button><button type="button" data-f="3" data-c="3">Mosaico 3 × 3</button><button type="button" data-f="2" data-c="3">Mosaico 2 × 3</button><button type="button" data-f="2" data-c="2">Póster 2 × 2</button></div>
      </div>
      <div id="di-g-px" class="di-par" hidden><label class="di-campo">Ancho de cada parte (px)<input id="di-ancho" type="number" inputmode="numeric" min="1"></label><label class="di-campo">Alto de cada parte (px)<input id="di-alto" type="number" inputmode="numeric" min="1"></label></div>
      <label class="di-campo">Formato<select id="di-formato"><option value="original">Igual que la original</option><option value="image/png">PNG (sin pérdida)</option><option value="image/jpeg">JPG (pesa menos)</option><option value="image/webp">WebP</option></select></label>
      <label class="di-campo" id="di-fila-calidad">Calidad: <span id="di-calidad-v">92 %</span><input id="di-calidad" type="range" min="40" max="100" value="92"></label>
      <p class="di-info" id="di-info" aria-live="polite"></p>
      <button class="btn acento" type="button" id="di-dividir">Dividir imagen ${FLECHA}</button>
    </div>
  </div>
  <div class="di-res" id="di-res" hidden>
    <div class="di-res-cab"><h2>Tus partes</h2><button class="btn tinta" type="button" id="di-zip">Descargar todas (.zip)</button></div>
    <p class="di-orden" id="di-orden" hidden></p>
    <ul class="di-lista" id="di-lista"></ul>
    ${llamado}
  </div>
  <p class="di-privado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Tu imagen no sale de tu dispositivo: el corte lo hace tu navegador.</p>
</div>`;
}

const TEXTO_DIVIDIR = `  <h2>Cómo dividir una imagen</h2>
  <p>Elige la imagen (o arrástrala, o pégala con Ctrl + V si la copiaste). Después decide cómo cortarla: por número de filas y columnas, o por el tamaño en píxeles que debe medir cada parte. Las líneas blancas de la vista previa te enseñan dónde va cada corte. Escoge el formato, toca «Dividir imagen» y descarga las partes una por una o todas juntas en un .zip.</p>
  <p>Cada archivo lleva el nombre de tu imagen y un número en orden de lectura: de izquierda a derecha y de arriba hacia abajo. La parte 1 es la de arriba a la izquierda.</p>
  <h2>Para qué sirve</h2>
  <h3>Carrusel panorámico en Instagram o Facebook</h3>
  <p>Una foto ancha cortada en columnas se ve como una sola imagen continua al deslizar el carrusel. Funciona muy bien para paisajes, fotos de grupo, el local de tu negocio o un menú.</p>
  <h3>Mosaico en tu perfil</h3>
  <p>Con 3 columnas, una imagen grande se arma en la cuadrícula de tu perfil. Es una forma llamativa de anunciar un lanzamiento, una promoción o un evento.</p>
  <h3>Imprimir en grande con una impresora normal</h3>
  <p>Si quieres un póster y solo tienes impresora de casa, divide la imagen en 4 o 9 partes, imprime cada una en una hoja y únelas.</p>
  <h3>Preparar imágenes para una página o una presentación</h3>
  <p>También sirve para separar una lámina con varias fotos, sacar cuadros de una tira de imágenes o cortar un diseño largo en partes del mismo alto.</p>`;

// Página de cualquier herramienta: encabezado, productos para estudiantes, la herramienta, anuncios de Vorka y AdSense,
// ayuda y preguntas frecuentes, las demás herramientas y la promoción de abajo.
async function paginaHerramienta(h, env) {
  const anuncios = configAnuncios(env), catalogoTienda = await catalogo(env), productos = await productosPromo(env, catalogoTienda);
  const migasH = [...MIGAS, [h.corto, h.ruta]], [ad1, ad2] = h.anuncios || ['brindi', 'vuelve'];
  const llamado = h.llamado ? llamadoResultado(productos.find(p => /simulador/.test(p.slug)) || productos[0]) : '';
  const otras = HERRAMIENTAS.filter(x => x !== h);
  const cuerpo = `<div class="marco"><div class="lr-col lr-ancha">
  <div class="di-cab">
  ${migas(migasH)}
  <h1 class="lr-h1">${esc(h.h1)}</h1>
  <p class="lr-lead">${esc(h.lead)}</p>
  </div>
  ${tiraArriba(productos)}
  ${h.panel(llamado)}
  ${anuncioCasa(ad1, catalogoTienda)}
  ${espacioAnuncio(anuncios, 'mitad')}
  <div class="lr-col" style="margin-left:0"><div class="di-texto">
  ${h.texto}
  <h2>Preguntas frecuentes</h2>
  <div class="di-faq">${h.faq.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('')}</div>
  </div></div>
  ${otras.length ? `<section class="lr-grupo he-otras"><div class="lr-grupo-cab"><h2 class="lr-h2">Más herramientas gratis</h2></div><ul class="he-grid">${otras.map(tarjetaHerramienta).join('')}</ul></section>` : ''}
  ${anuncioCasa(ad2, catalogoTienda)}
  ${await promocion(env, productos)}
  ${espacioAnuncio(anuncios, 'final')}
</div></div>
<script src="${h.script}"${h.modulo ? ' type="module"' : ' defer'}></script>`;
  const datos = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: h.nombre, description: h.descripcion, url: `${SITIO}${h.ruta}`, inLanguage: 'es-MX',
      applicationCategory: h.categoria || 'UtilitiesApplication', operatingSystem: 'Cualquiera (en el navegador)', browserRequirements: 'Requiere JavaScript',
      isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' }, publisher: ORG, isPartOf: SITIO_LEARN, provider: LEARN },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: h.faq.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) },
    migasLd(migasH),
  ];
  return paginaLearn({ titulo: h.titulo, ruta: h.ruta, descripcion: h.meta, imagen: `${SITIO}${OG_LEARN}`, imagenAlt: h.nombre,
    actual: 'herramientas', seccion: 'learn', anuncios, head: CSS + ld(datos), cuerpo });
}

const tarjetaHerramienta = h => `<li><a class="he-card" href="${h.ruta}"><span class="he-portada">${h.portada ? h.portada() : ''}</span><span class="he-c"><h2>${esc(h.nombre)}</h2><p>${esc(h.descripcion)}</p>${h.usos?.length ? `<ul class="he-usos">${h.usos.map(u => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}<span class="he-pie"><small>Gratis · en tu navegador</small><span class="btn acento">Usar gratis ${FLECHA}</span></span></span></a></li>`;

async function paginaIndice(env) {
  const anuncios = configAnuncios(env), catalogoTienda = await catalogo(env), productos = await productosPromo(env, catalogoTienda);
  const cuerpo = `<div class="marco"><div class="lr-col lr-ancha">
  <div class="di-cab">
  ${migas(MIGAS)}
  <h1 class="lr-h1">Herramientas gratis</h1>
  <p class="lr-lead">Herramientas sencillas para tus tareas, tus redes y tu negocio. Funcionan en tu navegador, no piden cuenta y tus archivos se quedan en tu dispositivo.</p>
  </div>
  <ul class="he-grid${HERRAMIENTAS.length === 1 ? ' he-uno' : ''}">${HERRAMIENTAS.map(tarjetaHerramienta).join('')}</ul>
  ${tiraArriba(productos)}
  ${anuncioCasa('brindi', catalogoTienda)}
  ${espacioAnuncio(anuncios, 'final')}
</div></div>`;
  const datos = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Herramientas gratis de Vorka Learn', url: `${SITIO}${RUTA_HERRAMIENTAS}`, inLanguage: 'es-MX', isPartOf: SITIO_LEARN, publisher: ORG,
    hasPart: HERRAMIENTAS.map(h => ({ '@type': 'WebApplication', name: h.nombre, url: `${SITIO}${h.ruta}` })) }, migasLd(MIGAS)];
  return paginaLearn({ titulo: 'Herramientas gratis | Vorka Learn', ruta: RUTA_HERRAMIENTAS, descripcion: 'Herramientas gratis de Vorka Learn que funcionan en tu navegador: reducir el peso de un PDF o foto, dividir un PDF, crear un código QR y dividir una imagen en partes.',
    imagen: `${SITIO}${OG_LEARN}`, imagenAlt: 'Herramientas gratis de Vorka Learn', actual: 'herramientas', seccion: 'learn', anuncios, head: CSS + ld(datos), cuerpo });
}

// ---------- catálogo de herramientas (el índice, el menú, el sitemap y «Más herramientas» leen de aquí) ----------
export const HERRAMIENTAS = [
  { ruta: RUTA_DIVIDIR, nombre: 'Dividir una imagen en partes', corto: 'Dividir imagen',
    descripcion: 'Corta una foto en cuadrícula para un carrusel, el mosaico de tu perfil de Instagram o para imprimirla en varias hojas. Gratis y en tu navegador.',
    usos: ['Carrusel', 'Mosaico 3 × 3', 'Póster en hojas'], portada: portadaDividir,
    titulo: 'Dividir una imagen en partes gratis (cuadrícula, carrusel) | Vorka Learn',
    meta: 'Divide una imagen en cuadrícula gratis: carrusel panorámico, mosaico 3 × 3 para Instagram o póster en varias hojas. Descarga las partes en PNG, JPG o .zip. Tu imagen no se sube.',
    h1: 'Dividir una imagen en partes',
    lead: 'Corta una foto en cuadrícula para un carrusel, el mosaico de tu perfil o para imprimirla en varias hojas. Es gratis, no pide cuenta y tu imagen se queda en tu dispositivo.',
    panel: herramientaDividir, texto: TEXTO_DIVIDIR, faq: FAQ_DIVIDIR, script: `${RUTA_JS_DIVIDIR}?v=${V_DIVIDIR}`, modulo: false, llamado: true,
    anuncios: ['brindi', 'vuelve'], categoria: 'MultimediaApplication' },
  ...NUEVAS,
];

// ---------- rutas ----------
// null si no es una ruta de herramientas; si sí, una Response (o su promesa)
export function rutasHerramientas(req, env, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const p = url.pathname;
  if (!p.startsWith('/learn/herramientas')) return null;
  if (p === RUTA_JS_DIVIDIR) return new Response(CLIENTE_DIVIDIR, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
  if (p === RUTA_HERRAMIENTAS) return paginaIndice(env);
  const h = HERRAMIENTAS.find(x => x.ruta === p);
  if (h) return paginaHerramienta(h, env);
  if (p === '/learn/herramientas' || HERRAMIENTAS.some(x => x.ruta === `${p}/`)) return new Response(null, { status: 301, headers: { location: `${url.origin}${p}/${url.search}` } });
  // Direcciones que se juntaron en otra herramienta (p. ej. «unir PDF» vive en «Dividir y unir PDF», pestaña #unir)
  const alias = HERRAMIENTAS.find(x => x.alias?.some(r => r === p || r === `${p}/`));
  if (alias) return new Response(null, { status: 301, headers: { location: `${url.origin}${alias.ruta}${url.search}#unir` } });
  return null;
}
