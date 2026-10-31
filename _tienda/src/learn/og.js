// Vorka Learn · imagen para compartir (Open Graph, 1200×630) de cada guía, sección y de la portada: el título, la
// etiqueta de la sección con su color y su dibujo. Es HTML + SVG; herramientas/learn-og/generar.mjs lo convierte en PNG
// con Playwright (WhatsApp y Facebook no aceptan SVG en og:image) y lo deja en assets/learn/og/.
import { LOGO } from '../marco.generado.js';
import { aspecto } from './secciones.js';
import { arte } from './arte.js';
import { secciones, articulos, ogArticulo, ogSeccion, OG_LEARN } from './datos.js';
import { LEARN_PORTADA } from '../simulador/guias.js';

const e = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function htmlOg({ titulo, clave = 'learn', etiqueta = 'Vorka Learn', pie = 'Guía con fuentes oficiales', semilla = '' }) {
  const x = aspecto(clave);
  const tam = titulo.length > 70 ? 54 : titulo.length > 48 ? 62 : 72;
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:Inter,"Inter Display",Arial,sans-serif;color:#fff;background:linear-gradient(120deg,#151017 0%,${x.a} 52%,${x.b} 115%);position:relative}
.franja{position:absolute;top:-40px;bottom:-40px;left:640px;width:150px;background:rgba(255,255,255,.07);transform:skewX(-28deg)}
.franja2{position:absolute;top:-40px;bottom:-40px;left:810px;width:6px;background:rgba(230,207,150,.45);transform:skewX(-28deg)}
.txt{position:absolute;left:72px;top:64px;bottom:64px;width:640px;display:flex;flex-direction:column}
.marca{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:800;letter-spacing:-.02em}
.marca svg{width:40px;height:39px}.marca b{color:#E6CF96;font-weight:800}
.etq{align-self:flex-start;margin-top:40px;padding:10px 20px;border-radius:999px;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.28);font-size:24px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
h1{margin-top:22px;font-size:${tam}px;line-height:1.06;letter-spacing:-.035em;font-weight:800;text-wrap:balance}
.pie{margin-top:auto;display:flex;gap:18px;align-items:center;font-size:24px;font-weight:600;color:rgba(255,255,255,.85)}
.pie i{width:8px;height:8px;border-radius:50%;background:#E6CF96}
.arte{position:absolute;right:56px;top:150px;width:420px;border-radius:28px;overflow:hidden;transform:rotate(4deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.55);border:4px solid rgba(255,255,255,.9)}
.arte svg{display:block;width:100%;height:auto}
</style></head><body><div class="franja"></div><div class="franja2"></div>
<div class="arte">${arte(clave, { semilla, id: 'og' })}</div>
<div class="txt"><div class="marca">${LOGO}<span>Vorka <b>Learn</b></span></div><span class="etq">${e(etiqueta)}</span><h1>${e(titulo)}</h1><div class="pie"><span>vorka.mx/learn</span><i></i><span>${e(pie)}</span></div></div>
</body></html>`;
}

// Todas las imágenes que deben existir: { archivo (ruta pública), html }
export const listaOg = () => [
  { archivo: OG_LEARN, html: htmlOg({ titulo: LEARN_PORTADA.h1, etiqueta: 'Guías gratis', pie: 'Con fuentes oficiales', semilla: 'portada' }) },
  ...secciones().map(s => ({ archivo: ogSeccion(s.clave), html: htmlOg({ titulo: s.indice.h1, clave: s.clave, etiqueta: s.nombre, pie: `${s.n} ${s.n === 1 ? 'guía' : 'guías'} con fuentes oficiales`, semilla: 'indice' }) })),
  ...articulos().map(a => ({ archivo: ogArticulo(a), html: htmlOg({ titulo: a.x.h1, clave: a.clave, etiqueta: `Guía · ${a.s.corto}`, semilla: a.slug }) })),
];
