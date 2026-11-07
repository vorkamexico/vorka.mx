// Vorka Learn · el llamado final de cada guía (uno por artículo, después de las fuentes). Dos formas:
//   llamadoProducto({...}) → un producto o programa de Vorka México: marca con ícono, una pregunta, una frase de para qué
//     sirve, 3 o 4 beneficios con palomita, una etiqueta corta (p. ej. «Gratis para empezar»), el botón y, si aplica, una
//     acción secundaria. Lo que el producto NO hace va en «nota», a la vista y sin letra chiquita escondida.
//   llamadoGuia({...})    → la siguiente guía recomendada, cuando ningún producto encaja de verdad.
// Siempre <aside class="lr-final" data-cta="…">: las pruebas y los estilos buscan esa clase exacta. Sin precios en pesos:
// el precio se ve en la ficha de cada producto. Son declaraciones de función a propósito (ver el ciclo en learn/datos.js).
import { esc } from '../paginas.js';
import { FLECHA } from '../marco.generado.js';

const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
// Íconos de línea de cada producto (24×24)
export const ICONO_CTA = {
  sobre: I('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>'),
  cartera: I('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4"/><rect x="4" y="9" width="16" height="11" rx="2.5"/><path d="M16.5 14.5h.01"/>'),
  libreta: I('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  estrella: I('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  calendario: I('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17M8 14h3"/>'),
  bolsa: I('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  boleto: I('<path d="M3.5 8.5V6h17v2.5a2.5 2.5 0 0 0 0 5V16h-17v-2.5a2.5 2.5 0 0 0 0-5z"/><path d="M14 6v10" stroke-dasharray="2 2"/>'),
  brujula: I('<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  palomita: I('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 12.5 11 15l4.5-5.5"/>'),
  personas: I('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.5 14.6c2.4-.3 4.4.9 5 3.9"/>'),
  navegador: I('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 8.5h18M9.5 12.5l-2 2 2 2M14.5 12.5l2 2-2 2"/>'),
  subir: I('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/>'),
  libro: I('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"/>'),
};
const PALOMITA = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 10.5 3 3 7-7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const INFO = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 9v4.5M10 6.5h.01" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';

/**
 * llamadoProducto({ etiqueta, producto, de, icono, chip, titulo, texto, puntos, nota, href, boton, href2, boton2 })
 *   producto: nombre que se ve junto al ícono («Brindi»); de: segunda línea («Invitaciones digitales · Vorka México»).
 *   puntos: 3 o 4 beneficios (HTML corto). nota: lo que NO hace (texto). href2/boton2: acción secundaria opcional.
 */
export function llamadoProducto(o) {
  const ico = ICONO_CTA[o.icono] || ICONO_CTA.libro;
  return `<aside class="lr-final" data-cta="producto" aria-label="${esc(o.etiqueta || o.producto)}">
  <div class="lr-cta-in">
    <div class="lr-cta-txt">
      <div class="lr-cta-marca"><span class="lr-cta-ico">${ico}</span><span><b>${esc(o.producto)}</b><small>${esc(o.de || 'de Vorka México')}</small></span></div>
      ${o.chip ? `<span class="lr-cta-chip">${esc(o.chip)}</span>` : ''}
      <p class="lr-final-t">${o.titulo}</p>
      <p class="lr-cta-lead">${o.texto}</p>
      <div class="lr-cta-acc"><a class="btn tinta" href="${o.href}">${o.boton} ${FLECHA}</a>${o.href2 ? `<a class="lr-cta-sec" href="${o.href2}">${o.boton2}</a>` : ''}</div>
    </div>
    <div class="lr-cta-lado">
      <ul class="lr-cta-puntos">${o.puntos.map(x => `<li>${PALOMITA}<span>${x}</span></li>`).join('')}</ul>
      ${o.nota ? `<p class="lr-cta-nota">${INFO}<span>${o.nota}</span></p>` : ''}
    </div>
  </div>
</aside>`;
}

/** llamadoGuia({ titulo, texto, href, boton }) → la siguiente guía recomendada (tarjeta clara con el color de la sección). */
export function llamadoGuia(o) {
  return `<aside class="lr-final" data-cta="guia" aria-label="Siguiente guía">
  <div class="lr-cta-in">
    <span class="lr-cta-ico">${ICONO_CTA.libro}</span>
    <div class="lr-cta-txt"><span class="lr-cta-sobre">Siguiente guía</span><p class="lr-final-t">${o.titulo}</p><p class="lr-cta-lead">${o.texto}</p></div>
    <a class="btn tinta" href="${o.href}">${o.boton} ${FLECHA}</a>
  </div>
</aside>`;
}

// Estilos (los incluye src/learn/estilos.js)
export const CSS_CTA = `
.lr-final{position:relative;overflow:hidden;isolation:isolate;margin:44px 0 0;border-radius:28px}
.lr-final[data-cta="producto"]{padding:clamp(22px,4vw,36px);background:linear-gradient(140deg,var(--sec-a),var(--sec-b));color:#fff;box-shadow:0 24px 48px -28px var(--sec-a)}
.lr-final[data-cta="producto"]::after{content:"";position:absolute;z-index:-1;right:6%;top:-30%;bottom:-30%;width:120px;background:rgba(255,255,255,.07);transform:skewX(-28deg)}
.lr-cta-in{display:grid;gap:22px}
@media (min-width:760px){.lr-final[data-cta="producto"] .lr-cta-in{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:30px;align-items:center}}
.lr-cta-marca{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin-bottom:16px}
.lr-cta-ico{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);color:#fff}
.lr-cta-ico svg{width:24px;height:24px}
.lr-cta-marca b{display:block;font-size:17px;font-weight:780;letter-spacing:-.01em;line-height:1.2}
.lr-cta-marca small{display:block;font-size:13px;color:rgba(255,255,255,.75);line-height:1.3}
.lr-cta-chip{display:inline-block;margin:0 0 12px;padding:6px 12px;border-radius:999px;background:#fff;color:var(--sec-a);font-size:12.5px;font-weight:750;letter-spacing:.01em;white-space:nowrap}
.lr-art .lr-final .lr-final-t,.lr-final .lr-final-t{display:block;margin:0 0 8px;font-size:clamp(22px,2.6vw,27px);line-height:1.18;font-weight:800;letter-spacing:-.02em;color:#fff}
.lr-art .lr-final .lr-cta-lead,.lr-final .lr-cta-lead{margin:0 0 20px;font-size:16.5px;line-height:1.55;color:rgba(255,255,255,.88)}
.lr-cta-acc{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px}
:root[data-app] .lr-art .lr-final .btn.tinta,:root[data-app] .lr-final .btn.tinta{background:#fff;color:#141114;text-decoration:none;white-space:normal;text-align:center;box-shadow:0 12px 26px -14px rgba(0,0,0,.55)}
.lr-art .lr-final a.lr-cta-sec,.lr-cta-sec{font-size:15px;font-weight:650;color:#fff;text-decoration:underline;text-decoration-color:rgba(255,255,255,.45);text-underline-offset:4px}
.lr-cta-lado{padding:18px 18px 16px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.lr-art .lr-final .lr-cta-puntos,.lr-cta-puntos{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.lr-art .lr-final .lr-cta-puntos li,.lr-cta-puntos li{display:flex;gap:10px;align-items:flex-start;margin:0;padding:0;font-size:15px;line-height:1.45;color:#fff}
.lr-cta-puntos li::before{content:none}
.lr-cta-puntos svg{flex:none;width:20px;height:20px;margin-top:1px;padding:2px;border-radius:50%;background:#fff;color:var(--sec-a)}
.lr-art .lr-final .lr-cta-nota,.lr-cta-nota{display:flex;gap:8px;align-items:flex-start;margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.18);font-size:13.5px;line-height:1.45;color:rgba(255,255,255,.8)}
.lr-cta-nota svg{flex:none;width:17px;height:17px;margin-top:1px}
/* siguiente guía: tarjeta clara con el color de la sección */
.lr-final[data-cta="guia"]{padding:clamp(18px,3vw,26px);background:var(--sec-s);border:1.5px solid var(--sec-t)}
.lr-final[data-cta="guia"] .lr-cta-in{grid-template-columns:auto 1fr;align-items:center}
@media (min-width:700px){.lr-final[data-cta="guia"] .lr-cta-in{grid-template-columns:auto 1fr auto}}
.lr-final[data-cta="guia"] .lr-cta-ico{background:linear-gradient(135deg,var(--sec-a),var(--sec-b));border:0}
.lr-final[data-cta="guia"] .lr-final-t{color:var(--fg);font-size:20px;margin-bottom:4px}
.lr-final[data-cta="guia"] .lr-cta-lead{margin:0;color:var(--fg-2);font-size:15px}
.lr-cta-sobre{display:block;margin-bottom:4px;font-size:12px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;color:var(--sec-t)}
@media (max-width:699px){.lr-final[data-cta="guia"] .btn{grid-column:1 / -1}}
:root[data-app] .lr-art .lr-final[data-cta="guia"] .btn.tinta,:root[data-app] .lr-final[data-cta="guia"] .btn.tinta{background:var(--fg);color:var(--bg)}
`;
