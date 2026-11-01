// «¿Qué proyecto social hago?» · páginas: el cuestionario gratis (indexable), el resultado con 3 ideas y el reporte
// completo con candado, y el reporte de pago (imprimible).
import { pagina, esc } from '../paginas.js';
import { precio, masTienda, seccionFaq, navTienda, formCompra, SCRIPT_COMPRA } from '../tienda.js';
import { oferta, migas, ldScript } from '../seo.js';
import { resenasDe, ldResenas, seccionResenas } from '../resenas.js';
import { FLECHA } from '../marco.generado.js';
import { pesos } from '../util.js';
import { CSS_TESTS } from './estilos.js';
import { PREGUNTAS, ESTADOS, ODS, calcular } from './proyecto.js';
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
    return `<fieldset class="tv-q" id="q-${k}"${req ? ' data-req="1"' : ''}><legend><span class="tv-n">${++n}</span><span>${esc(d.p)}</span></legend>
    <div class="tv-op lista"${multi ? ` data-max="${d.max}"` : ''}>${ops.map(([v, t]) => `<label><input type="${multi ? 'checkbox' : 'radio'}" name="${k}" value="${esc(v)}"${marcado(k, v) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset>`;
  };
  return `<form class="tv-form" id="form-test" method="post" action="${esc(accion)}" novalidate>
  <div class="tv-progreso"><span id="tv-cuenta" aria-hidden="true">0 de 8</span><span class="tv-barra" aria-hidden="true"><i id="tv-barra"></i></span></div>
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
  ['¿Es gratis?', `Contestar es gratis y al terminar ves gratis tus 3 ideas de proyecto más afines, en una línea cada una. El reporte completo, con 5 a 8 proyectos a detalle, cuesta ${precioT}, pago único.`],
  ['¿Para quién es?', 'Para negocios y empresas de cualquier tamaño, emprendimientos, organizaciones de la sociedad civil, profesionistas independientes, escuelas y colectivos que quieren hacer algo por su comunidad y no saben por dónde empezar.'],
  ['¿Qué trae el reporte completo?', 'De 5 a 8 proyectos a tu medida. Cada uno con objetivo, a quién beneficia, primeros pasos, recursos mínimos, indicadores simples para medir, los Objetivos de Desarrollo Sostenible (ODS) de la ONU con los que se alinea, riesgos comunes y cómo comunicarlo sin lavado de imagen. Lo puedes imprimir o guardar en PDF.'],
  ['¿Cómo eligen mis ideas?', 'Con reglas claras, no al azar: cruzamos tus causas, tus fortalezas, tu giro, tu tamaño, tu presupuesto, tu tiempo y con quién quieres colaborar contra una biblioteca de proyectos escrita por Vorka México. Si un proyecto pide más dinero o tiempo del que tienes, baja en la lista.'],
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
    head: head(ldScript(ld)), headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT_TEST('proyecto') + SCRIPT_TOPE + (p ? SCRIPT_COMPRA : ''),
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  ${navTienda('examenes')}
  <div class="tv-hero-g">
    <div>
      <span class="tv-et">Para negocios, OSC y profesionistas</span>
      <h1 class="tv-h1">¿Qué proyecto social hago? <em>Descúbrelo en 5 minutos.</em></h1>
      <p class="tv-lead">Cuéntanos tu giro, en qué son buenos, cuánto dinero y tiempo tienen y qué causas les importan. Al terminar ves tus 3 ideas de proyecto más afines.</p>
      ${aviso ? `<p class="tv-ok" role="status">${esc(aviso)}</p>` : ''}
      <div class="tv-ctas"><a class="btn acento" href="#test">Empezar ${FLECHA}</a><a class="btn blanco" href="#reporte">Ver qué trae el reporte</a></div>
      <p class="tv-nota" style="margin:14px 0 0"><b>Contestarlo es gratis · tus 3 ideas son gratis · el reporte completo cuesta ${precioT}</b> (opcional, pago único).</p>
      <ul class="tv-chips"><li>10 preguntas · 5 min</li><li>Sin crear cuenta</li><li>Con indicadores y ODS</li></ul>
    </div>
    <div class="tv-tarjeta" aria-label="Ejemplo de una idea del reporte">
      <span class="tv-et" style="color:var(--fg-2)">Ejemplo de una idea del reporte</span>
      <h3 style="margin:8px 0 4px">Rescate de alimentos</h3>
      <p class="tv-nota" style="margin:0">Dona tus excedentes de comida a un comedor en lugar de tirarlos.</p>
      <p class="tv-det"><b>Indicadores:</b> kilos donados al mes · porciones · kilos que dejaste de tirar</p>
      <p><span class="tv-ods"><b>ODS 2</b> Hambre cero</span><span class="tv-ods"><b>ODS 12</b> Producción y consumo responsables</span></p>
    </div>
  </div>
</div></section>
<section class="tv-sec" id="test"><div class="marco">
  <div class="tv-cab"><span class="tv-et">El cuestionario</span><h2>Cuéntanos de ustedes.</h2><p>Contesta como organización o como persona. Tarda unos 5 minutos.</p></div>
  ${formProyecto({ datos, error })}
</div></section>
<section class="tv-sec suave" id="reporte"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Reporte completo · ${precioT}</span><h2>De la buena intención a un proyecto que se mide.</h2>
    <p>Primero contesta gratis: al final ves tus 3 ideas y una vista previa del reporte, y lo desbloqueas ahí mismo en un paso.</p>
    <div class="tv-acciones"><a class="btn acento" href="#test">Contestar gratis ${FLECHA}</a></div></div>
  <ul class="tv-incluye" style="gap:10px">${['De 5 a 8 proyectos a tu medida', 'Objetivo con cifra y fecha, a quién beneficia y primeros pasos', 'Recursos mínimos e indicadores simples para medir', 'Los ODS de la ONU con los que se alinea cada proyecto', 'Riesgos comunes y cómo evitarlos', 'Cómo comunicarlo sin lavado de imagen'].map(x => `<li style="padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line)">${x}</li>`).join('')}</ul>
</div></section>
${p ? `<section class="tv-sec" id="regalar"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Para alguien más</span><h2>¿Se lo quieres regalar a otra empresa u organización?</h2><p>Elige «Para regalar» y te llega una liga para mandársela.</p></div>
  <div>${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1', mensajeEjemplo: '¡Para que arranquemos ese proyecto!' })}</div>
</div></section>` : ''}
${seccionResenas(rs)}
${seccionFaq({ titulo: 'Preguntas frecuentes', items: F.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre ¿Qué proyecto social hago?',
  pie: '<p class="t-nota t-legal">¿Qué proyecto social hago? · Biblioteca de proyectos original de Vorka México · Guía para empezar: no es asesoría legal ni fiscal</p>' })}
${await masTienda(env, 'examenes')}
</div>`,
  });
}

const odsHtml = l => l.map(n => `<span class="tv-ods"><b>ODS ${n}</b> ${esc(ODS[n])}</span>`).join('');

export function resultadoProyecto({ f, p, error = '', cupon = null, codigoRef = null, enviado = false }) {
  const res = calcular(f.respuestas);
  const ya = f.order_estado === 'paid';
  const liga = `${SITIO}${RUTA}${codigoRef ? `?ref=${encodeURIComponent(codigoRef)}` : ''}`;
  const share = whatsapp(`Hice el cuestionario «¿Qué proyecto social hago?» de Vorka y me dio ideas buenas para nuestro negocio. Es gratis: ${liga}`);
  const bloqueadas = res.reporte.slice(3);
  return pagina({ titulo: 'Tus ideas de proyecto social · Vorka México', ruta: `${RUTA}resultado/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tus ideas de proyecto social.', head: head(), script: p && !ya ? SCRIPT_COMPRA_TEST : '',
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Tus ideas gratis${f.nombre ? ` · ${esc(f.nombre.split(' ')[0])}` : ''}</span>
  <h1 class="tv-h1">Tus 3 proyectos <em>más afines</em></h1>
  ${enviado ? '<p class="tv-ok" role="status">Guardamos tus ideas y te las mandamos por correo (revisa también spam).</p>' : ''}
  <p class="tv-lead">Para ${esc(res.lugar)}, según tu giro, tus fortalezas, tu presupuesto y tu tiempo.</p>
</div></section>
<section class="tv-sec" style="padding-top:0"><div class="marco tv-dos">
  <div>
    <ol class="tv-carreras">${res.gratis.map(x => `<li><b>${esc(x.n)}</b><p class="tv-det">${esc(x.l)}</p></li>`).join('')}</ol>
    ${ya ? '' : `<div class="tv-candado" style="margin-top:16px" aria-labelledby="vp-t">
      <span class="tv-et">${ICONO_CANDADO} En tu reporte completo</span>
      <h2 id="vp-t" style="margin:6px 0 10px;font-size:22px">${res.reporte.length} proyectos a detalle</h2>
      ${p ? `<a class="btn acento chico tv-no-imprimir" href="#comprar" style="margin:0 0 12px">Desbloquear por ${cupon ? pesos(Math.max(1000, p.precio_centavos - cupon.monto)) : precio(p)} ${FLECHA}</a>` : ""}
      <ul class="tv-incluye">${res.gratis.map(x => `<li>${esc(x.n)}: objetivo, primeros pasos, recursos, indicadores, ODS y riesgos</li>`).join('')}${bloqueadas.map(x => `<li>${esc(x.n)}</li>`).join('')}</ul>
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
    <div class="tv-tarjeta tv-no-imprimir" style="margin-top:14px"><b>Compártelo</b><p class="tv-nota" style="margin:6px 0 10px">¿Conoces otro negocio que quiera hacer algo por su comunidad?</p>
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
<section><h2>Cómo usar este reporte</h2><ul class="tv-l"><li>Elige 1 proyecto, no 5: el que más emocione a tu equipo y quepa en tu presupuesto.</li><li>Antes de arrancar, platica con 3 a 5 personas a las que quieres beneficiar: confirma que el problema es real y que tu idea les sirve.</li><li>Empieza en pequeño (un piloto de 4 a 8 semanas), mide y luego crece.</li></ul></section>
${res.reporte.map((x, i) => `<section aria-labelledby="pr-${i}"><article class="tv-idea">
  <span class="tv-num">Proyecto ${i + 1}</span><h3 id="pr-${i}">${esc(x.n)}</h3><p class="tv-nota">${esc(x.l)}</p>
  <h4>Objetivo</h4><p>${esc(x.obj)}</p>
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
