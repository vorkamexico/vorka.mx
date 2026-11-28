// Testimonios que nos mandaron por WhatsApp, publicados con permiso de quien los escribió (Dirección, 2026-11-27).
// NO son reseñas del sistema (src/resenas.js): no traen estrellas, no entran al promedio ni al JSON-LD de calificación
// (Google pide que las calificaciones sean reales). Se edita solo ortografía y largo, sin cambiar lo que dicen.
// quien: nombre de pila con su permiso, o una descripción si no dio nombre · detalle: de dónde viene (verificado si compró)
import { esc } from './paginas.js';

export const TESTIMONIOS = {
  'simulador-paa': [
    { quien: 'Edwin', detalle: 'Compró el Simulador PAA',
      texto: 'Sí me ha servido mucho; he aprendido demasiado.' },
    { quien: 'Estudiante que presenta la PAA', detalle: 'Usa el Simulador PAA',
      texto: 'Me ha parecido sumamente eficiente: he tenido avances muy notorios en el dominio de los temas desde que lo adquirí. Cada herramienta suma a que estemos más seguros con nuestra preparación, y lo mejor son los precios súper accesibles.' },
  ],
};
export const todosLosTestimonios = () => Object.entries(TESTIMONIOS).flatMap(([app, l]) => l.map(t => ({ ...t, app })));

const CSS = `<style>.ts-tes{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:12px}@media(min-width:760px){.ts-tes{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}}
.ts-tes li{padding:20px 22px;border-radius:20px;background:var(--card,var(--bg));border:1px solid var(--line);display:grid;gap:12px;align-content:space-between}
.ts-tes p{margin:0;font-size:16px;line-height:1.55;color:var(--fg)}.ts-tes p::before{content:'«'}.ts-tes p::after{content:'»'}
.ts-tes span{display:flex;flex-direction:column;font-size:13.5px;color:var(--fg-2)}.ts-tes b{font-size:15px;color:var(--fg)}</style>`;

export const listaTestimonios = l => `${CSS}<ul class="ts-tes">${l.map(t => `<li><p>${esc(t.texto)}</p><span><b>${esc(t.quien)}</b>${esc(t.detalle)}</span></li>`).join('')}</ul>`;

/** Sección para la página de un producto. Sin testimonios, nada. */
export function seccionTestimonios(app, { titulo = 'Lo que nos cuentan quienes lo usan' } = {}) {
  const l = TESTIMONIOS[app];
  if (!l?.length) return '';
  return `<section class="t-sec" aria-labelledby="ts-tes-t"><div class="marco"><h2 class="h2" id="ts-tes-t">${esc(titulo)}</h2>${listaTestimonios(l)}</div></section>`;
}
