// Vorka Learn · puente «¿Lo hacemos por ti?» al final de las guías de Negocio pequeño y Crea tu app.
// Es el mismo formulario corto del sitio (_sitio/partes.py › platiquemos): 4 datos que llegan a os.vorka.mx › Prospectos
// por POST /api/publico/vorka/interes con origen 'learn'. El envío lo hace /assets/v3/vorka.js (form.platiquemos), que el
// pie de Learn ya carga; la CSP de Learn abre connect-src a os.vorka.mx para esto (src/learn.js).
// Las opciones usan las mismas claves y textos que os (src/prospectos.js › INTERESES).
import { FLECHA, CHECK } from '../marco.generado.js';
import { esc } from '../paginas.js';

const INTERESES = [['estrategia', 'Estrategia y consultoría'], ['equipos', 'Formación y liderazgo de equipos'], ['redes', 'Redes sociales y contenido'],
  ['web', 'Página web o tienda en línea'], ['sistemas', 'Sistema o app a la medida']];
const WA = `https://wa.me/528117804869?text=${encodeURIComponent('Hola Vorka, me gustaría platicar sobre un proyecto.')}`;

/** puenteServicios({ pagina, texto, marcar }) → html. pagina: ruta que queda en la bandeja (sin ella, la ruta de la guía); marcar: claves ya elegidas. */
export function puenteServicios({ pagina = '', texto, marcar = [] }) {
  const ops = INTERESES.map(([k, t]) => `<label class="v4-chip"><input type="checkbox" name="intereses" value="${k}"${marcar.includes(k) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('');
  return `<section class="v4-plat lr-puente" id="platiquemos" aria-labelledby="t-plat">
  <div class="v4-plat-in">
    <div class="v4-plat-txt">
      <span class="etiqueta">Servicios de Vorka México</span>
      <h2 class="t2" id="t-plat">¿Lo hacemos por ti?</h2>
      <p class="lead">${texto}</p>
      <p class="v4-alt">Déjanos cuatro datos y te escribimos en menos de un día hábil, sin costo ni compromiso. ¿Prefieres WhatsApp? <a href="${WA}" target="_blank" rel="noopener">Escríbenos al +52 81 1780 4869</a></p>
    </div>
    <div class="v4-form-caja">
      <form class="v4-form platiquemos" novalidate ${pagina ? `data-pagina="${esc(pagina)}" ` : ''}data-origen="learn">
        <div class="trampa" aria-hidden="true"><label>No llenar <input name="empresa_web" tabindex="-1" autocomplete="off"></label></div>
        <label class="v4-campo"><span>Nombre</span><input name="nombre" autocomplete="name" required minlength="3" maxlength="100"></label>
        <label class="v4-campo"><span>Correo</span><input name="correo" type="email" autocomplete="email" inputmode="email" required maxlength="120"></label>
        <label class="v4-campo"><span>Organización o negocio <small>(opcional)</small></span><input name="organizacion" autocomplete="organization" maxlength="140"></label>
        <fieldset class="v4-campo"><legend>¿En qué te podemos ayudar?</legend><div class="v4-chips">${ops}</div></fieldset>
        <label class="casilla v4-casilla"><input type="checkbox" name="acepta" value="1"> <span>Acepto el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a> y que Vorka México me contacte.</span></label>
        <button class="btn tinta v4-enviar" type="submit">Enviar ${FLECHA}</button>
        <p class="v4-msg" role="status" aria-live="polite"></p>
      </form>
      <div class="v4-exito" hidden tabindex="-1">
        <span class="v4-ok">${CHECK}</span>
        <h3 class="t3">Listo, <span data-nombre></span>. Ya tenemos tus datos.</h3>
        <p>Te escribimos a <b data-correo></b> en menos de un día hábil. Revisa también tu carpeta de spam.</p>
        <p class="v4-folio" hidden>Tu folio: <b data-folio></b></p>
      </div>
    </div>
  </div>
</section>`;
}
