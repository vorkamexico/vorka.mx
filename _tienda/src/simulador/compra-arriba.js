// Compra visible en las páginas de investigación de los simuladores (nov 2026): universidades del PAA, EXANI-II y EXCOBA,
// calculadora PAA y aciertos UNAM. Antes solo había «Practicar con el simulador» al final y nadie llegaba.
//   tarjeta: va arriba, justo después de la herramienta o del texto de inicio: qué es, precio real de D1 y «Comprar».
//   barra:   la misma barra fija del celular que tiene la página de venta (t-barra), con «Prueba gratis» y «Comprar».
// Los dos botones llevan directo al formulario de compra del simulador con el plan Completo elegido (?plan=paquete#comprar).
import { esc } from '../paginas.js';
import { productoPorSlug } from '../modelo.js';
import { FLECHA } from '../marco.generado.js';

const pesos = c => `$${(c / 100).toLocaleString('es-MX')}`;

// app: 'simulador-paa'… · nombre: 'Simulador PAA' · para: frase corta de para quién es («para la UNAM»)
export async function compraSimulador(env, { app, nombre, para = '', puntos = [] }) {
  const ruta = `/${app}`;
  const [paquete, practica] = await Promise.all([productoPorSlug(env, `${app}-paquete`), productoPorSlug(env, `${app}-practica`)]).catch(() => [null, null]);
  const comprar = `${ruta}/?plan=paquete#comprar`;
  if (!paquete) return { tarjeta: '', barra: '' };
  const desde = practica && practica.precio_centavos < paquete.precio_centavos ? practica.precio_centavos : null;
  const lista = (puntos.length ? puntos : ['Exámenes como el real, con cronómetro', 'Tutor con pistas cuando fallas', 'Tu resultado estimado y qué reforzar']);
  const tarjeta = `<aside class="ca-caja" aria-label="Comprar el ${esc(nombre)}">
  <div class="ca-txt">
    <b class="ca-t">${esc(nombre)}${para ? ` <span>${esc(para)}</span>` : ''}</b>
    <ul>${lista.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
  <div class="ca-precio">
    <p><b class="num">${pesos(paquete.precio_centavos)}</b> <small>MXN · plan Completo${desde ? `, o desde ${pesos(desde)}` : ''}</small></p>
    <a class="btn acento" href="${comprar}">Comprar el simulador ${FLECHA}</a>
    <a class="ca-gratis" href="${ruta}/diagnostico/">Antes, haz el diagnóstico gratis</a>
  </div>
</aside>`;
  const barra = `<div class="t-barra" id="barra-compra"><div><b class="num">${pesos(paquete.precio_centavos)}</b><small>${esc(nombre)}</small></div><div class="sv-barra-b"><a class="btn blanco chico" href="${ruta}/diagnostico/">Prueba gratis</a><a class="btn acento chico" href="${comprar}">Comprar</a></div></div>`;
  return { tarjeta, barra };
}

export const CSS_COMPRA = `<style>
.ca-caja{display:grid;gap:16px;grid-template-columns:1fr;margin-top:24px;padding:20px;border-radius:var(--r);background:var(--card);border:1.5px solid var(--morado);box-shadow:var(--sombra);max-width:820px}
@media(min-width:760px){.ca-caja{grid-template-columns:1.3fr 1fr;align-items:center;padding:22px 24px}}
.ca-t{display:block;font-size:19px;letter-spacing:-.02em}.ca-t span{font-weight:600;color:var(--fg-2);font-size:15.5px}
.ca-txt ul{margin:10px 0 0;padding-left:18px;color:var(--fg-2);font-size:15px;display:grid;gap:4px}
.ca-precio p{margin:0 0 10px}.ca-precio b{font-size:28px;font-weight:800;letter-spacing:-.03em}.ca-precio small{color:var(--fg-2);font-size:14px}
.ca-precio .btn{width:100%;justify-content:center}
.ca-gratis{display:block;margin-top:10px;text-align:center;font-size:14.5px;color:var(--morado);font-weight:600}
.sv-barra-b{display:flex;gap:6px}.t-barra b,.t-barra small{white-space:nowrap}.t-barra .sv-barra-b .btn{padding-inline:12px;font-size:14px}@media(max-width:370px){.t-barra small{display:none}}
</style>`;
