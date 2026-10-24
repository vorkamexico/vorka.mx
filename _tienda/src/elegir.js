// ¿Brindi o Cupo? Mismo bloque en el catálogo, en la página de Brindi y en la ficha de Cupo, para que nadie compre el equivocado.
import { FLECHA } from './marco.generado.js';

export const ELEGIR = (resaltar = '') => `
<section class="t-sec t-elegir-s"><div class="marco">
  <div class="cab rv"><span class="etiqueta">¿Cuál me conviene?</span><h2 class="h2">¿Brindi o Cupo?</h2>
    <p class="t-lead">Los dos son de Vorka México y sirven para cosas distintas. <b>Regla rápida:</b> si la invitación es parte del recuerdo y el evento se planea con meses, Brindi. Si es de esta semana y lo que importa es saber quién va (y quién pagó), Cupo.</p></div>
  <div class="t-elegir">
    <a class="t-elegir-c rv${resaltar === 'brindi' ? ' es' : ''}" href="/tienda/brindi/"><span class="t-cat">Momentos importantes</span><b>Brindi · Invitaciones digitales</b>
      <p>Bodas, XV años, bautizos y aniversarios. Invitación con diseño de autor, padres y padrinos, itinerario, mesa de regalos, confirmación por invitado y acceso con QR.</p>
      <ul><li>Se prepara con calma y se ve espectacular</li><li>Confirmación y acompañantes por invitado</li><li>Desde $299 MXN por evento</li></ul><span class="flecha">Conocer Brindi ${FLECHA}</span></a>
    <a class="t-elegir-c rv${resaltar === 'cupo' ? ' es' : ''}" href="/tienda/cupo/"><span class="t-cat">Rápido e informal</span><b>Cupo · Eventos con registro</b>
      <p>Fiestas, Halloween, networking, talleres, cumpleaños casuales y eventos de negocio. Una página con los datos, registro en segundos, cover directo a ti y check-in con QR.</p>
      <ul><li>Listo en un minuto, desde el celular</li><li>Cover sin comisiones y ligas para RPs</li><li>Gratis hasta 30 personas · Pro desde $99 MXN según tu aforo</li></ul><span class="flecha">Conocer Cupo ${FLECHA}</span></a>
  </div>
</div></section>`;
