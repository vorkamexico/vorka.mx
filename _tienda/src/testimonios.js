// Testimonios que nos mandaron por WhatsApp, publicados con permiso de quien los escribió (Dirección, 2026-11-27).
// NO son reseñas del sistema (src/resenas.js): no traen estrellas, no entran al promedio ni al JSON-LD de calificación
// (Google pide que las calificaciones sean reales). Se edita solo ortografía y largo, sin cambiar lo que dicen.
// quien: nombre de pila con su permiso, o una descripción si no dio nombre · detalle: de dónde viene (verificado si compró)
// estrellas: SOLO si la persona dio la calificación (2026-11-27 ambos dijeron 5 por WhatsApp). Se muestran, pero no entran
// al JSON-LD. resena: true si además ya es reseña del sistema (compra verificada): en la página del producto no se repite.
import { esc } from './paginas.js';

export const TESTIMONIOS = {
  'simulador-paa': [
    { quien: 'Edwin', detalle: 'Compró el Simulador PAA', estrellas: 5, resena: true,
      texto: 'Sí me ha servido mucho; he aprendido demasiado.' },
    { quien: 'Estudiante que presenta la PAA', detalle: 'Usa el Simulador PAA', estrellas: 5,
      corto: 'He tenido avances muy notorios en el dominio de los temas, y lo mejor son los precios súper accesibles.',
      texto: 'Me ha parecido sumamente eficiente: he tenido avances muy notorios en el dominio de los temas desde que lo adquirí. Cada herramienta suma a que estemos más seguros con nuestra preparación, y lo mejor son los precios súper accesibles.' },
  ],
};
export const todosLosTestimonios = () => Object.entries(TESTIMONIOS).flatMap(([app, l]) => l.map(t => ({ ...t, app })));

const CSS = `<style>.ts-tes{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:12px}@media(min-width:760px){.ts-tes{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}}
.ts-tes li{padding:20px 22px;border-radius:20px;background:var(--card,var(--bg));border:1px solid var(--line);display:grid;gap:12px;align-content:space-between}
.ts-tes p{margin:0;font-size:16px;line-height:1.55;color:var(--fg)}.ts-tes p::before{content:'«'}.ts-tes p::after{content:'»'}
.ts-tes span{display:flex;flex-direction:column;font-size:13.5px;color:var(--fg-2)}.ts-tes b{font-size:15px;color:var(--fg)}.ts-est{display:flex;gap:2px;color:#E2A72E;font-style:normal}</style>`;

const ESTRELLA = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>';
const estrellas = n => n ? `<i class="ts-est" role="img" aria-label="${n} de 5 estrellas">${ESTRELLA.repeat(n)}</i>` : '';
export const listaTestimonios = l => `${CSS}<ul class="ts-tes">${l.map(t => `<li>${estrellas(t.estrellas)}<p>${esc(t.texto)}</p><span><b>${esc(t.quien)}</b>${esc(t.detalle)}</span></li>`).join('')}</ul>`;

/** Sección para la página de un producto. Sin testimonios, nada. */
export function seccionTestimonios(app, { titulo = 'Lo que nos cuentan quienes lo usan', todas = false } = {}) {
  const l = (TESTIMONIOS[app] || []).filter(t => todas || !t.resena);   // en la ficha, las que ya son reseña salen en «Reseñas»
  if (!l?.length) return '';
  return `<section class="t-sec" aria-labelledby="ts-tes-t"><div class="marco"><h2 class="h2" id="ts-tes-t">${esc(titulo)}</h2>${listaTestimonios(l)}</div></section>`;
}

// Franja compacta para la portada de la tienda: una línea con las estrellas y dos citas cortas (en celular, se desliza de lado).
const CSS_FRANJA = `<style>.ts-fr{margin-top:22px;display:grid;gap:12px;grid-template-columns:auto 1fr;align-items:center;padding:14px 16px;border-radius:20px;background:var(--card,var(--bg));border:1px solid var(--line)}
.ts-fr-cab{display:grid;gap:2px;padding-right:14px;border-right:1px solid var(--line)}.ts-fr-cab b{font-size:14px}.ts-fr-cab small{font-size:12.5px;color:var(--fg-2)}
.ts-fr .ts-est{display:flex;gap:1px;color:#E2A72E}.ts-fr .ts-est svg{width:14px;height:14px}
.ts-fr ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ts-fr li{display:grid;gap:3px;min-width:0}.ts-fr p{margin:0;font-size:14px;line-height:1.45;color:var(--fg);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ts-fr li small{font-size:12.5px;color:var(--fg-2)}
@media(max-width:700px){.ts-fr{grid-template-columns:1fr;gap:10px}.ts-fr-cab{border:0;padding:0;grid-template-columns:auto 1fr;align-items:center;column-gap:8px}.ts-fr-cab small{grid-column:1/-1}
  .ts-fr ul{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;margin:0 -4px;padding:0 4px 2px;scrollbar-width:none}.ts-fr ul::-webkit-scrollbar{display:none}
  .ts-fr li{flex:0 0 86%;scroll-snap-align:start;padding:10px 12px;border-radius:14px;background:var(--bg-2,rgba(0,0,0,.04))}}</style>`;
export const franjaTestimonios = l => l.length ? `${CSS_FRANJA}<div class="ts-fr" aria-label="Lo que dicen quienes ya lo usan"><div class="ts-fr-cab">${estrellas(5)}<b>Lo que dicen quienes ya lo usan</b><small>Calificaciones dadas por clientes del Simulador PAA</small></div>
  <ul>${l.map(t => `<li><p>«${esc(t.corto || t.texto)}»</p><small><b>${esc(t.quien)}</b> · ${esc(t.detalle)}</small></li>`).join('')}</ul></div>` : '';
