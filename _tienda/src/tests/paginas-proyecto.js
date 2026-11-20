// «¿Qué proyecto social hago?» · páginas: el cuestionario gratis (indexable), el resultado con 3 ideas y el reporte
// completo con candado, y el reporte de pago (imprimible).
import { pagina, esc } from '../paginas.js';
import { precio, masTienda, seccionFaq, formCompra, SCRIPT_COMPRA } from '../tienda.js';
import { oferta, migas, ldScript } from '../seo.js';
import { resenasDe, ldResenas, seccionResenas } from '../resenas.js';
import { FLECHA } from '../marco.generado.js';
import { pesos } from '../util.js';
import { CSS_TESTS, CSS_MARCA_TEST, CSS_JUEGO } from './estilos.js';
import { heroMarca, seccionQueEs, indiceProducto, colorDe } from '../marca-producto.js';
import { seccionDemo } from '../demos/marco.js';
import { demoDe } from '../demos/index.js';
import { PREGUNTAS, ESTADOS, ODS, calcular, voluntariadoDe } from './proyecto.js';
import { formCompraTest, SCRIPT_COMPRA_TEST, SCRIPT_TEST, SCRIPT_IMPRIMIR, SCRIPT_TOPE, ICONO_CANDADO, PRODUCTOS_TEST, whatsapp, fechaCorta, SIN_REFERER } from './comun.js';

const DEF = PRODUCTOS_TEST.proyecto;
const RUTA = DEF.ruta;
// Imagen para compartir (simulador/portadas_v3.py)
const OG_PROYECTO = 'https://vorka.mx/assets/tienda/v3/que-proyecto-social-og.jpg';
const SITIO = 'https://vorka.mx';
const RUTA_IMPACTO = '/tienda/ruta-de-impacto/';
const head = (extra = '') => `<style>${CSS_TESTS}</style>${extra}`;

export function formProyecto({ datos = {}, error = '', accion = RUTA, boton = 'Ver mis ideas' } = {}) {
  let n = 0;
  const marcado = (k, v) => [].concat(datos[k] ?? []).map(String).includes(String(v));
  const q = (k, d) => {
    const multi = !!d.multi, ops = d.unica || d.multi, req = k !== 'colaborar';
    const ayuda = multi ? (req ? `Elige hasta ${d.max}.` : 'Elige las que quieras, o sáltala.') : 'Elige una.';
    return `<fieldset class="tv-q" id="q-${k}"${req ? ' data-req="1"' : ''}><legend><span class="tv-n">${++n}</span><span>${esc(d.p.replace(/ \((hasta \d+|las que quieras)\)$/, ''))}</span></legend>
    <p class="tj-ayuda">${ayuda}</p>
    <div class="tv-op lista"${multi ? ` data-max="${d.max}"` : ''}>${ops.map(([v, t]) => `<label><input type="${multi ? 'checkbox' : 'radio'}" name="${k}" value="${esc(v)}"${marcado(k, v) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset>`;
  };
  return `<form class="tv-form tv-ps" id="form-test" method="post" action="${esc(accion)}" novalidate>
  <div class="tv-progreso"><span id="tv-cuenta" aria-hidden="true">0 de ${Object.keys(PREGUNTAS).filter(k => k !== 'colaborar').length + 1}</span><span class="tv-barra" aria-hidden="true"><i id="tv-barra"></i></span></div>
  <p class="tv-ok" id="tv-animo" role="status" hidden>¡Vas a la mitad! Tus ideas ya se están armando.</p>
  <p class="tv-nota" id="tv-recuperado" role="status" hidden>Recuperamos las respuestas que dejaste en este navegador: sigue donde te quedaste.</p>
  ${error ? `<p class="tv-error" role="alert">${esc(error)}</p>` : ''}
  ${Object.entries(PREGUNTAS).map(([k, d]) => q(k, d)).join('')}
  <fieldset class="tv-q" id="q-estado" data-req="1"><legend><span class="tv-n">${++n}</span><span>¿Dónde están?</span></legend>
    <div class="tv-campo" style="clear:both"><label for="estado">Estado</label><select id="estado" name="estado" required><option value="">Elige tu estado</option>${ESTADOS.map(e => `<option${datos.estado === e ? ' selected' : ''}>${esc(e)}</option>`).join('')}</select></div>
    <div class="tv-campo" style="margin-top:10px"><label for="municipio">Municipio <small>(opcional)</small></label><input id="municipio" name="municipio" type="text" maxlength="80" value="${esc(datos.municipio || '')}" placeholder="Ej. Celaya"></div>
  </fieldset>
  <p class="tv-error" id="tv-falta" role="alert" hidden></p>
  <button class="btn acento tv-enviar" type="submit">${esc(boton)} ${FLECHA}</button>
  <p class="tv-nota">Es una guía para empezar: no sustituye un diagnóstico de tu comunidad. Tus respuestas se guardan para mostrarte tus ideas; puedes borrarlas cuando quieras (<a href="/privacidad/#tests">aviso de privacidad</a>).</p>
</form>`;
}

const FAQ = precioT => [
  ['¿Es gratis?', `Contestar es gratis y al terminar ves gratis tus 3 ideas de proyecto más afines, en una línea cada una. El reporte completo, con 5 a 8 proyectos a detalle y la versión corta de cada uno, cuesta ${precioT}, pago único.`],
  ['¿Para quién es?', 'Para personas, estudiantes y jóvenes, colectivos, escuelas, organizaciones de la sociedad civil, profesionistas, negocios y empresas que quieren hacer algo por su comunidad y no saben por dónde empezar. También para quien ya tiene un proyecto y quiere sumarle algo.'],
  ['¿Qué trae el reporte completo?', 'De 5 a 8 proyectos a tu medida, de causas distintas (educación, salud mental, medio ambiente, cultura, deporte, participación juvenil y más). Cada uno trae una versión corta para arrancar en 2 a 4 semanas con poco dinero y la versión completa: objetivo, a quién beneficia, primeros pasos, recursos mínimos, indicadores simples, los Objetivos de Desarrollo Sostenible (ODS) de la ONU con los que se alinea, riesgos comunes y cómo comunicarlo sin lavado de imagen. Si ya tienes un proyecto, trae una ruta para sumarle la idea. Lo puedes imprimir o guardar en PDF.'],
  ['¿Cómo eligen mis ideas?', 'Con reglas claras, no al azar: cruzamos tus causas, a quién quieres ayudar, cómo te gusta participar, tus fortalezas, tu presupuesto, tu tiempo, el tipo de lugar y qué tan grande quieres empezar contra una biblioteca de más de 100 proyectos escrita por Vorka México. Cada idea te dice por qué te salió. Si un proyecto pide más dinero o tiempo del que tienes, baja en la lista, y el reporte mezcla causas distintas para que tengas de dónde escoger.'],
  ['¿Qué es el lavado de imagen?', 'Presumir un impacto social o ambiental que no es real o que es mucho menor de lo que se dice. Cada idea trae consejos para comunicar con cifras reales y dejar que la comunidad sea la protagonista.'],
  ['¿Es asesoría legal o fiscal?', 'No. Es una guía para empezar. Para donativos deducibles, contratos o trámites, consulta con una o un profesional.'],
  ['¿Qué hacen con mis respuestas?', 'Solo las usamos para darte tus ideas y tu reporte. No se venden ni se comparten. Si no compras, se borran a los 12 meses, y puedes borrarlas tú cuando quieras. Consulta el <a href="/privacidad/#tests">aviso de privacidad</a>.'],
  ['¿Cómo puedo pagar?', `Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. ${precioT}, pago único. El pago lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.`],
];

export async function landingProyecto(env, req, url, { p, code = null, cookie = null, error = '', datos = {}, status = 200, aviso = '' } = {}) {
  const precioT = p ? precio(p) : '$149 MXN';
  const rs = p ? await resenasDe(env, RUTA) : null;
  const F = FAQ(precioT);
  const descripcion = `¿Qué proyecto social hacer según tu giro, tu experiencia, tu presupuesto y tu tiempo? Contesta gratis y ve tus 3 ideas al momento. Reporte con 5 a 8 proyectos, indicadores y ODS por ${precioT}.`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: '¿Qué proyecto social hago? · Reporte completo', description: descripcion, url: `${SITIO}${RUTA}`, image: [OG_PROYECTO], brand: { '@type': 'Brand', name: 'Vorka México' },
    offers: oferta({ ruta: RUTA, centavos: p?.precio_centavos ?? 14900, disponible: !!p }), ...ldResenas(rs) }, migas('¿Qué proyecto social hago?', RUTA),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: F.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  return pagina({ titulo: '¿Qué proyecto social hago? Ideas según tu giro y tu presupuesto | Vorka México', ruta: RUTA, descripcion, imagen: OG_PROYECTO, navActual: 'catalogo', status,
    head: head(`${ldScript(ld)}<style>${CSS_MARCA_TEST}${CSS_JUEGO}</style>`), headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT_TEST('proyecto') + SCRIPT_TOPE + SCRIPT_JUEGO + (p ? SCRIPT_COMPRA : ''),
    cuerpo: `<div class="tv tv-marca" style="--pm:${colorDe('que-proyecto-social')}">
${heroMarca('que-proyecto-social', {
  apoyo: 'Cuéntanos quiénes son, en qué son buenos, cuánto dinero y tiempo tienen y qué causas les importan. Al terminar ves tus 3 ideas de proyecto más afines, cada una con una versión corta para arrancar en semanas.',
  antes: aviso ? `<p class="tv-ok" role="status" style="margin-top:16px">${esc(aviso)}</p>` : '',
  botones: `<a class="pm-btn" href="#test">Empezar ${FLECHA}</a><a class="pm-btn sec" href="#reporte">Ver qué trae el reporte</a>`,
  despues: `<p class="pm-gratis"><b>Contestarlo es gratis · tus 3 ideas son gratis · el reporte completo cuesta ${precioT}</b> (opcional, pago único). Sin crear cuenta.</p>`,
})}
${indiceProducto('que-proyecto-social', [['que-es', 'Qué es'], ['demo', 'Pruébalo'], ['test', 'El cuestionario'], ['reporte', 'Reporte completo'], ...(p ? [['regalar', 'Regalar']] : []), ['ayuda', 'Preguntas']], `<a class="pm-btn" href="#test">Empezar</a>`)}
${seccionQueEs('que-proyecto-social', { titulo: '¿Qué proyecto social hago? Ideas según tu giro y tu presupuesto.',
  texto: 'Un cuestionario de unos 4 minutos que cruza tus causas, a quién quieres ayudar, cómo te gusta participar, tus fortalezas, tu presupuesto y tu tiempo con una biblioteca de proyectos escrita por Vorka México. <b>Al terminar ves gratis tus 3 ideas más afines</b>; el reporte completo trae de 5 a 8 proyectos de causas distintas, cada uno con una versión corta para arrancar en 2 a 4 semanas y su versión completa con indicadores y ODS.',
  para: [['Jóvenes, estudiantes y colectivos', 'Quieren hacer algo por su comunidad con poco dinero y poco tiempo, y empezar ya.'], ['Organizaciones, escuelas y proyectos que ya existen', 'Buscan sumar una actividad nueva que quepa en lo que ya hacen.'], ['Negocios y profesionistas', 'Quieren un proyecto que se pueda medir y comunicar con cifras reales, sin lavado de imagen.']] })}
${seccionDemo('que-proyecto-social', demoDe('que-proyecto-social'))}
<section class="tv-sec" id="test"><div class="marco">
  <div class="tv-cab"><span class="tv-et">El cuestionario</span><h2>Cuéntanos de ustedes.</h2><p>Una pregunta a la vez, con un toque. Contesta como persona, grupo u organización: tarda unos 4 minutos.</p></div>
  ${formProyecto({ datos, error })}
</div></section>
<section class="tv-sec suave" id="reporte"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Reporte completo · ${precioT}</span><h2>De la buena intención a un proyecto que se mide.</h2>
    <p>Primero contesta gratis: al final ves tus 3 ideas y una vista previa del reporte, y lo desbloqueas ahí mismo en un paso.</p>
    <div class="tv-acciones"><a class="btn acento" href="#test">Contestar gratis ${FLECHA}</a></div>
    <div class="tv-tarjeta tv-ejemplo" aria-label="Ejemplo de una idea del reporte">
      <span class="tv-et" style="color:var(--fg-2)">Ejemplo de una idea del reporte</span>
      <h3 style="margin:8px 0 4px">Rescate de alimentos</h3>
      <p class="tv-nota" style="margin:0">Dona tus excedentes de comida a un comedor en lugar de tirarlos.</p>
      <p class="tv-det"><b>Indicadores:</b> kilos donados al mes · porciones · kilos que dejaste de tirar</p>
      <p><span class="tv-ods"><b>ODS 2</b> Hambre cero</span><span class="tv-ods"><b>ODS 12</b> Producción y consumo responsables</span></p>
    </div>
  </div>
  <ul class="tv-incluye" style="gap:10px">${['De 5 a 8 proyectos a tu medida, de causas distintas', 'Versión corta de cada uno para arrancar en 2 a 4 semanas con poco dinero', 'Ruta para sumar la idea a un proyecto que ya tienes', 'Objetivo con cifra y fecha, a quién beneficia y primeros pasos', 'Recursos mínimos e indicadores simples para medir', 'Los ODS de la ONU con los que se alinea cada proyecto', 'Riesgos comunes y cómo evitarlos', 'Cómo comunicarlo sin lavado de imagen'].map(x => `<li style="padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line)">${x}</li>`).join('')}</ul>
</div></section>
${p ? `<section class="tv-sec" id="regalar"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Para alguien más</span><h2>¿Se lo quieres regalar a otra empresa u organización?</h2><p>Elige «Para regalar» y te llega una liga para mandársela.</p></div>
  <div>${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1', mensajeEjemplo: '¡Para que arranquemos ese proyecto!' })}</div>
</div></section>` : ''}
${seccionResenas(rs)}
${seccionFaq({ titulo: 'Preguntas frecuentes', items: F.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre ¿Qué proyecto social hago?',
  pie: '<p class="t-nota t-legal">¿Qué proyecto social hago? · Biblioteca de proyectos original de Vorka México · Guía para empezar: no es asesoría legal ni fiscal</p>' })}
<section class="tv-sec tv-cierre"><div class="marco"><h2>Tu proyecto social, <em>a tu medida.</em></h2><div class="tv-ctas"><a class="pm-btn" href="#test">Contestar gratis ${FLECHA}</a></div></div></section>
${await masTienda(env, 'examenes')}
</div>`,
  });
}

// Si contestó 1 a 2 horas al mes: lo honesto es sumarse a algo que ya existe (IMPACTO, desde los 12 años)
const avisoPocoTiempo = (r, { corto = false } = {}) => `<section${corto ? ' class="tv-tarjeta" style="margin-top:16px"' : ''}><h2${corto ? ' style="margin:0 0 6px;font-size:20px"' : ''}>Con 1 a 2 horas al mes, lo que más rinde es sumarte a algo que ya existe</h2>
  <p>Un proyecto propio pide, sobre todo al principio, unas horas cada semana: convocar, coordinar, dar seguimiento. Con 1 a 2 horas al mes es muy difícil sostenerlo, y no pasa nada. Tu tiempo rinde mucho más dentro de un equipo que ya tiene la gente, el espacio y la convocatoria.</p>
  <ul class="tv-l"><li>Súmate como voluntaria o voluntario a un proyecto que ya esté andando. En IMPACTO, la red de jóvenes que transforma sus comunidades, hay equipos en varios municipios y puedes postularte desde los 12 años.</li>
  <li>Lleva ahí una de ${corto ? 'tus ideas' : 'las ideas de este reporte'} en su versión corta: la puedes proponer como actividad del equipo.</li>
  <li>Si más adelante tienes medio día a la semana, vuelve a contestar el cuestionario y te saldrán proyectos para hacer por tu cuenta.</li></ul>
  <div class="tv-acciones tv-no-imprimir" style="margin:10px 0 0"><a class="btn blanco chico" href="${esc(voluntariadoDe(r.estado))}" target="_blank" rel="noopener">Ver voluntariado de IMPACTO${r.estado ? ` en ${esc(r.estado)}` : ''}</a></div>
  <p class="tv-nota">Liga: ${esc(voluntariadoDe(r.estado))}</p>
</section>`;

// Modo juego: una pregunta por pantalla, pase automático en las de una opción, «Siguiente» en las de varias y en la última
// el botón de enviar. Se monta encima del formulario normal (SCRIPT_TEST sigue guardando avance y validando).
const SCRIPT_JUEGO = `(function(){
  var f=document.getElementById('form-test'); if(!f||!f.classList.contains('tv-ps')) return;
  var qs=[].slice.call(f.querySelectorAll('.tv-q')), n=qs.length, i=0, env=f.querySelector('.tv-enviar'); if(!n||!env) return;
  f.classList.add('tv-juego');
  var cab=document.createElement('div'); cab.className='tj-cab';
  cab.innerHTML='<button type="button" class="tj-atras">← Atrás</button><span class="tj-num" aria-live="polite"></span><span class="tj-barra" aria-hidden="true"><i></i></span>';
  f.insertBefore(cab,f.firstChild);
  var pie=document.createElement('div'); pie.className='tj-pie'; pie.innerHTML='<button type="button" class="tj-sig">Siguiente →</button>';
  var ap=document.createElement('p'); ap.className='tj-aplauso'; ap.setAttribute('aria-live','polite');
  f.insertBefore(pie,env); f.insertBefore(ap,env);
  var atras=cab.querySelector('.tj-atras'), num=cab.querySelector('.tj-num'), barra=cab.querySelector('.tj-barra i'), sig=pie.querySelector('.tj-sig');
  var frases=['¡Va!','¡Buena elección!','¡Eso!','Ya vas a la mitad','¡Muy bien!','Ya casi','Última pregunta'];
  function hecha(q){ var s=q.querySelector('select'); return !!q.querySelector('input:checked')||!!(s&&s.value); }
  function arriba(){ var y=f.getBoundingClientRect().top+window.scrollY-110; if(Math.abs(window.scrollY-y)>30) window.scrollTo({top:y,behavior:'smooth'}); }
  function ver(k,mover){ i=Math.max(0,Math.min(n-1,k)); var q=qs[i];
    qs.forEach(function(x,j){ x.classList.toggle('tj-ver',j===i); });
    num.textContent=(i+1)+' de '+n; barra.style.width=((i+(hecha(q)?1:0))/n*100)+'%'; atras.hidden=i===0;
    var radio=!!q.querySelector('input[type=radio]'), ultima=i===n-1;
    pie.hidden=ultima||(radio&&!hecha(q)); env.hidden=!ultima;
    sig.disabled=!!q.dataset.req&&!hecha(q); sig.textContent=!q.dataset.req&&!hecha(q)?'Saltar →':'Siguiente →';
    ap.textContent=ultima?frases[6]:i>=n-3?frases[5]:i===Math.floor(n/2)?frases[3]:i>0?frases[i%3]:'';
    if(mover) arriba(); }
  f.addEventListener('change',function(e){ var q=e.target.closest('.tv-q'); if(q!==qs[i]) return;
    if(e.target.type==='radio'){ ver(i); setTimeout(function(){ if(qs[i]===q&&i<n-1) ver(i+1,true); },320); } else ver(i); });
  sig.addEventListener('click',function(){ ver(i+1,true); });
  atras.addEventListener('click',function(){ ver(i-1,true); });
  f.addEventListener('submit',function(e){ if(!e.defaultPrevented) return; var j=qs.findIndex(function(q){ return q.dataset.req&&!hecha(q); }); if(j>-1) ver(j,true); });
  var primera=qs.findIndex(function(q){ return q.dataset.req&&!hecha(q); }); ver(primera<0?n-1:primera);
})();`;

const odsHtml = l => l.map(n => `<span class="tv-ods"><b>ODS ${n}</b> ${esc(ODS[n])}</span>`).join('');

export function resultadoProyecto({ f, p, error = '', cupon = null, codigoRef = null, enviado = false }) {
  const res = calcular(f.respuestas);
  const ya = f.order_estado === 'paid';
  const liga = `${SITIO}${RUTA}${codigoRef ? `?ref=${encodeURIComponent(codigoRef)}` : ''}`;
  const share = whatsapp(`Hice el cuestionario «¿Qué proyecto social hago?» de Vorka y me dio ideas buenas para nuestro proyecto. Es gratis: ${liga}`);
  const bloqueadas = res.reporte.slice(3);
  return pagina({ titulo: 'Tus ideas de proyecto social · Vorka México', ruta: `${RUTA}resultado/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tus ideas de proyecto social.', head: head(), script: p && !ya ? SCRIPT_COMPRA_TEST : '',
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Tus ideas gratis${f.nombre ? ` · ${esc(f.nombre.split(' ')[0])}` : ''}</span>
  <h1 class="tv-h1">Tus 3 proyectos <em>más afines</em></h1>
  ${enviado ? '<p class="tv-ok" role="status">Guardamos tus ideas y te las mandamos por correo (revisa también spam).</p>' : ''}
  <p class="tv-lead">Para ${esc(res.lugar)}, según lo que contestaste. Cada idea te dice por qué te salió.</p>
</div></section>
<section class="tv-sec" style="padding-top:0"><div class="marco tv-dos">
  <div>
    <ol class="tv-carreras">${res.gratis.map(x => `<li><b>${esc(x.n)}</b><p class="tv-det">${esc(x.l)}</p><p class="tv-nota" style="margin:4px 0 0">${esc(x.areaN)} · versión corta de ${x.c.pasos.length} semanas</p>${x.por.length ? `<p class="tv-nota" style="margin:2px 0 0">Te salió porque ${esc(x.por.join('; '))}.</p>` : ''}</li>`).join('')}</ol>
    ${res.poco ? avisoPocoTiempo(f.respuestas, { corto: true }) : ''}
    ${ya ? '' : `<div class="tv-candado" style="margin-top:16px" aria-labelledby="vp-t">
      <span class="tv-et">${ICONO_CANDADO} En tu reporte completo</span>
      <h2 id="vp-t" style="margin:6px 0 10px;font-size:22px">${res.reporte.length} proyectos a detalle</h2>
      ${p ? `<a class="btn acento chico tv-no-imprimir" href="#comprar" style="margin:0 0 12px">Desbloquear por ${cupon ? pesos(Math.max(1000, p.precio_centavos - cupon.monto)) : precio(p)} ${FLECHA}</a>` : ""}
      <ul class="tv-incluye">${res.gratis.map(x => `<li>${esc(x.n)}: versión corta semana por semana, objetivo, primeros pasos, recursos, indicadores, ODS y riesgos</li>`).join('')}${bloqueadas.map(x => `<li>${esc(x.n)}</li>`).join('')}</ul>
      <p class="tv-det" aria-hidden="true" style="filter:blur(4px);user-select:none">Objetivo: que 10 personas de tu municipio… Primeros pasos: 1. … 2. … Indicadores: … ODS …</p>
      <h2 style="margin:18px 0 8px;font-size:20px">${ICONO_CANDADO} Cómo comunicarlo sin lavado de imagen</h2>
      <h2 style="margin:8px 0;font-size:20px">${ICONO_CANDADO} Con quién aliarte y tu siguiente paso</h2>
    </div>`}
  </div>
  <div id="comprar">
    ${ya ? '<div class="tv-compra"><b>Ya tienes tu reporte completo.</b><p class="tv-nota" style="margin:0">Ábrelo con el botón «Ver mi reporte» del correo que te mandamos. ¿No lo encuentras? <a href="/descargas/reenviar">Pide que te lo reenviemos</a>.</p></div>'
      : p ? `<h2 class="h2" style="margin:0 0 6px">Desbloquea tu reporte completo</h2>
    <p class="tv-nota" style="margin:0">${res.reporte.length} proyectos a detalle, listos para presentarlos a tu equipo. Lo puedes imprimir o guardar en PDF.</p>
    ${formCompraTest(p, { resultado: f.id, nombre: f.nombre || '', email: f.email || '', error, cupon, boton: 'Desbloquear mi reporte' })}` : '<p class="tv-nota">El reporte completo abre muy pronto.</p>'}
    <div class="tv-tarjeta tv-no-imprimir" style="margin-top:14px"><b>Compártelo</b><p class="tv-nota" style="margin:6px 0 10px">¿Conoces a alguien que quiera hacer algo por su comunidad?</p>
      <a class="btn blanco chico" href="${esc(share)}" target="_blank" rel="noopener">Compartir por WhatsApp</a></div>
  </div>
</div></section>
<section class="tv-sec suave tv-no-imprimir"><div class="marco">
  <h2 class="h2" style="margin:0 0 10px">Tus respuestas, tus datos</h2>
  <p class="tv-nota">Guardamos tus respuestas para mostrarte tus ideas${ya ? ' y tu reporte' : ''}. Si no compras, se borran solas a los 12 meses.</p>
  <form method="post" action="${RUTA}resultado/${f.id}/borrar"><button class="tv-mini" type="submit">Borrar mis respuestas ahora</button></form>
</div></section>
</div>`,
  });
}

const COLAB = { empleados: 'Tu equipo: invítalo desde el diseño, no solo el día de la foto.', clientes: 'Tus clientes: pueden sumar con redondeo, difusión o tiempo; rinde cuentas cada mes.', escuelas: 'Escuelas: entra por la dirección o la orientación, con permisos por escrito si hay menores.',
  osc: 'Una OSC: pregunta qué necesitan antes de proponer; ellos conocen a la comunidad.', gobierno: 'El municipio: pide permisos y compromisos de mantenimiento por escrito.', empresas: 'Otras empresas: una alianza reparte costos y hace el proyecto más estable.', jovenes: 'Jóvenes voluntarios: dales responsabilidades reales y reconocimiento.' };

export function reporteProyecto({ f, orden, rutaActiva = false }) {
  const res = calcular(f.respuestas);
  const nombre = (f.nombre || orden.nombre || '').split(' ')[0];
  const r = f.respuestas;
  return pagina({ titulo: 'Tu reporte: ¿Qué proyecto social hago? · Vorka México', ruta: `${RUTA}reporte/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tu reporte completo de proyectos sociales.', head: head(), script: SCRIPT_IMPRIMIR,
    cuerpo: `<div class="tv tv-rep">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Reporte completo · ¿Qué proyecto social hago?</span>
  <h1 class="tv-h1">${nombre ? `${esc(nombre)}, estos` : 'Estos'} son tus <em>${res.reporte.length} proyectos</em></h1>
  <p class="tv-lead">Para ${esc(res.lugar)}. Contestado el ${fechaCorta(f.created_at)}. Es una guía para empezar: ajústala con lo que te diga tu comunidad.</p>
  <div class="tv-acciones tv-no-imprimir"><button class="btn acento" type="button" id="tv-imprimir">Imprimir o guardar en PDF</button></div>
</div></section>
<div class="marco">
<section><h2>Cómo usar este reporte</h2><ul class="tv-l"><li>Los proyectos son de causas distintas para que tengas de dónde escoger. Elige 1, el que más te emocione y quepa en tu tiempo y tu dinero.</li><li>Arranca con su versión corta: 2 a 4 semanas, con poco dinero. Si funciona, pasa a la versión completa.</li><li>Antes de arrancar, platica con 3 a 5 personas a las que quieres beneficiar: confirma que el problema es real y que tu idea les sirve.</li></ul></section>
<section><h2>Empieza esta semana</h2>
  <p>Con tu primer proyecto, <b>${esc(res.reporte[0].n)}</b>, esto es lo que puedes hacer en los próximos 7 días:</p>
  <ul class="tv-l"><li>${esc(res.reporte[0].c.pasos[0])}</li><li>Escríbele a 3 personas a las que quieres beneficiar y pregúntales si les serviría.</li><li>Pon fecha en tu calendario para la semana 2 y busca a 1 persona que te acompañe.</li></ul>
</section>
${res.poco ? avisoPocoTiempo(r) : ''}
${res.sumar ? `<section><h2>Cómo sumar una idea a tu proyecto</h2>
  <p>Ya tienes un proyecto andando. Antes de abrir otro, prueba la idea como una actividad más de lo que ya haces:</p>
  <ol class="tv-l"><li>Elige la idea que comparta público con tu proyecto: las mismas personas, la misma escuela o la misma colonia.</li><li>Ponla como una actividad dentro de tu proyecto, con tu nombre y tus redes. Así no empiezas de cero con la convocatoria.</li><li>Hazla primero en su versión corta, con 1 o 2 personas de tu equipo como responsables.</li><li>Mide con 1 indicador de la idea y súmalo a lo que ya reportas.</li><li>Al terminar, decide con tu equipo si se queda como actividad fija, si crece o si la dejas.</li></ol>
</section>` : ''}
${res.reporte.map((x, i) => `<section aria-labelledby="pr-${i}"><article class="tv-idea">
  <span class="tv-num">Proyecto ${i + 1}${x.areaN ? ` · ${esc(x.areaN)}` : ''}</span><h3 id="pr-${i}">${esc(x.n)}</h3><p class="tv-nota">${esc(x.l)}</p>${x.por.length ? `<p class="tv-nota"><b>Te salió porque</b> ${esc(x.por.join('; '))}.</p>` : ''}
  <div class="tv-corto"><h4>Versión corta: ${x.c.pasos.length} semanas</h4><p><b>Meta:</b> ${esc(x.c.meta)}<br><b>Costo:</b> ${esc(x.c.costo)}</p>
    <ol class="tv-l">${x.c.pasos.map((s, k) => `<li><b>Semana ${k + 1}.</b> ${esc(s)}</li>`).join('')}</ol></div>
  <h4>Versión completa · Objetivo</h4><p>${esc(x.obj)}</p>
  <h4>A quién beneficia</h4><p>${esc(x.benef)}</p>
  <h4>Primeros pasos</h4><ol class="tv-l">${x.pasos.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  <h4>Recursos mínimos</h4><p>${esc(x.recursos)}</p>
  <h4>Cómo medir tu impacto</h4><ul class="tv-l">${x.ind.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  <h4>ODS de la ONU con los que se alinea</h4><p>${odsHtml(x.ods)}</p>
  <h4>Riesgos comunes</h4><ul class="tv-l">${x.riesgos.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  <h4>Cómo comunicarlo sin lavado de imagen</h4><ul class="tv-l">${x.comunicar.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
</article></section>`).join('')}
<section><h2>Comunicar sin lavado de imagen: las reglas de siempre</h2><ul class="tv-l">
  <li>Di lo que hiciste con cifras reales (personas, kilos, horas), aunque sean pequeñas. Nunca «miles de vidas transformadas» sin datos.</li>
  <li>La comunidad y tus aliados son los protagonistas; tu marca, un agradecimiento discreto.</li>
  <li>No publiques fotos de personas en situación vulnerable ni de menores sin permiso escrito de su tutor.</li>
  <li>Cuenta también lo que no salió y qué vas a cambiar: da más confianza que la perfección.</li>
  <li>No digas «sustentable», «verde» o «socialmente responsable» si no lo puedes demostrar.</li>
</ul></section>
${(r.colaborar || []).length ? `<section><h2>Con quién aliarte</h2><ul class="tv-l">${r.colaborar.map(k => COLAB[k] ? `<li>${esc(COLAB[k])}</li>` : '').join('')}</ul></section>` : ''}
<section class="tv-no-imprimir"><h2>Tu siguiente paso</h2><div class="tv-sig">
  <b>¿Tu proyecto involucra jóvenes?</b>
  <p class="tv-nota" style="margin:6px 0 10px">Ruta de Impacto es el curso interactivo de Vorka para jóvenes de 15 a 29 años que quieren sacar adelante un proyecto social: lecciones cortas, un tutor y trabajo de campo de verdad (entrevistas y un piloto). Puedes regalarlo a las y los jóvenes de tu proyecto. Lo recibido va para IMPACTO (<a href="https://soyimpacto.org/" target="_blank" rel="noopener">soyimpacto.org</a>), la red de jóvenes que transforma sus comunidades.</p>
  <div class="tv-acciones" style="margin:0">${rutaActiva ? `<a class="btn acento chico" href="${RUTA_IMPACTO}?regalo=1#comprar">Regalar Ruta de Impacto ${FLECHA}</a>` : ''}<a class="btn blanco chico" href="https://soyimpacto.org/" target="_blank" rel="noopener">Conocer IMPACTO</a></div>
</div></section>
<section><h2>De dónde salen estas ideas</h2>
  <p class="tv-nota">Las elegimos con reglas a partir de tus respuestas (causas, fortalezas, giro, tamaño, presupuesto, tiempo y aliados) en una biblioteca de proyectos original de Vorka México. Los ODS son los 17 Objetivos de Desarrollo Sostenible de la Agenda 2030 de la ONU. Es una guía para empezar: no es asesoría legal ni fiscal ni sustituye un diagnóstico de tu comunidad.</p>
  <p class="tv-nota">Orden ${esc(orden.id)} · Esta liga no vence; guárdala. ¿Quieres borrar tus respuestas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>
</section>
</div></div>`,
  });
}
