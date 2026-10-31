// Test vocacional Vorka · para escuelas: la página de venta de las licencias para grupo (/test-vocacional/escuelas/,
// indexable) y el volante imprimible tamaño carta (/test-vocacional/escuelas/volante/, noindex) con QR propio.
// Todo lo que dicen sale de lo que hace el código: index.js (unirse, panel), paginas-vocacional.js (panelGrupo,
// paginaUnirse, reporteVocacional) y la limpieza de datos (limpiarTests). Precios: los productos test-vocacional-grupo-*.
import { pagina, esc, WHATSAPP } from '../paginas.js';
import { precio, seccionFaq, navTienda } from '../tienda.js';
import { ofertas, oferta, migas, ldScript } from '../seo.js';
import { pesosTexto } from '../descuentos.js';
import { FLECHA } from '../marco.generado.js';
import qrcode from '../vendor/qrcode.js';
import { CSS_TESTS } from './estilos.js';
import { INTERESES, HABILIDADES, PREFERENCIAS } from './vocacional-datos.js';
import { RUTA_ESCUELAS, formsLicencias, porAlumno } from './paginas-vocacional.js';
import { whatsapp } from './comun.js';

const RUTA_TEST = '/test-vocacional/';
const SITIO = 'https://vorka.mx';
export const RUTA_VOLANTE = `${RUTA_ESCUELAS}volante/`;
const N_PREG = INTERESES.length + HABILIDADES.length + Object.keys(PREFERENCIAS).length;
export const TEXTO_DEMO = 'Hola, me interesa una demostración del Test vocacional Vorka para mi escuela. Escuela: · Ciudad: · Grados y número de alumnos:';
export const WA_DEMO = `${WHATSAPP}?text=${encodeURIComponent(TEXTO_DEMO)}`;

const CSS_ESC = `
.te-cards{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}
.te-card{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--line)}.te-card h3{margin:0 0 8px;font-size:20px;letter-spacing:-.02em}
.te-card ul{margin:10px 0 0;padding-left:20px;display:grid;gap:6px;line-height:1.45;list-style:disc}.te-card p{margin:6px 0 0;line-height:1.55;color:var(--fg-2)}
.te-clase{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.te-clase li{display:grid;grid-template-columns:96px 1fr;gap:14px;padding:16px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.te-clase .te-min{font-weight:800;color:var(--tv-acento);font-size:15px}.te-clase b{display:block}.te-clase p{margin:4px 0 0;color:var(--fg-2);line-height:1.5}
@media(max-width:520px){.te-clase li{grid-template-columns:1fr;gap:4px}}
.te-priv{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.te-priv>div{padding:20px;border-radius:20px;background:var(--card);border:1px solid var(--line)}.te-priv h3{margin:0 0 8px;font-size:18px}
.te-priv ul{margin:0;padding-left:20px;display:grid;gap:6px;line-height:1.45;list-style:disc}
.te-familia{padding:22px;border-radius:22px;border:2px dashed var(--line);background:var(--card);margin-top:14px}
.te-familia h3{margin:0;font-size:20px}.te-familia p{margin:8px 0 0;line-height:1.55;color:var(--fg-2)}
.te-pasos{margin:0;padding-left:22px;list-style:decimal;display:grid;gap:8px;line-height:1.5}
.tv-pie-esc{margin-top:14px}
`;

// ---------- QR (qrcode-generator, sin servicios externos) ----------
export function qrSvg(texto, etiqueta = 'Código QR') {
  const q = qrcode(0, 'M'); q.addData(texto, 'Byte'); q.make();
  const n = q.getModuleCount(), m = 2, t = n + m * 2;
  let d = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + m} ${y + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="${esc(etiqueta)}"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#141114"/></svg>`;
}

// ---------- contenido (honesto: solo lo que hace el producto) ----------
const RECIBE_ALUMNO = ['Su perfil detallado: sus 3 tipos de interés con fortalezas, ambientes donde se sentiría a gusto y qué cuidar',
  '20 carreras afines, con qué se estudia y en qué se trabaja',
  'En qué área de la UNAM o rama del IPN cae cada carrera, o si le toca la PAA; en secundaria, si le toca el ECOEMS o el examen de la prepa de la UG',
  'Guías gratis de Vorka Learn para su examen y la recomendación del simulador que le toca (el simulador se vende aparte)',
  'Un plan de 30 días con actividades para decidir',
  'Preguntas para platicar con su familia, con su orientador y con alguien que ya ejerce'];

const CLASE = [
  ['Antes', 'Prepara la liga', 'Compra el paquete. Te llega un correo con el botón «Abrir mi panel de grupo»; ahí está la liga de tu grupo. Pide que traigan celular con datos o reserva el aula de cómputo: cada quien necesita un correo al que tenga acceso. Si son menores de edad, avisa a las familias antes de la clase.'],
  ['0 a 5 min', 'Presenta el test', 'Explica que se basa en los seis tipos de intereses de Holland, que no hay respuestas buenas ni malas y que es orientativo: no es un examen ni un diagnóstico. Aclara que compartir su resultado contigo es opcional.'],
  ['5 a 10 min', 'Comparte la liga', 'Mándala con el botón de WhatsApp de tu panel o escríbela en el pizarrón. Cada quien escribe su nombre y su correo, acepta los términos y decide si marca la casilla para compartir su resultado contigo.'],
  ['10 a 22 min', 'Contestan', `${N_PREG} preguntas, de 8 a 10 minutos. Al terminar, cada quien ve su reporte completo en pantalla y la liga le llega a su correo.`],
  ['22 a 35 min', 'Lectura guiada', 'Cada quien lee su perfil y sus 20 carreras, y subraya tres que no conocía y una que le sorprendió.'],
  ['35 a 45 min', 'En parejas o tríos', 'Quien quiera comparte su código de tres letras y comentan una de las «Preguntas para platicar» del reporte.'],
  ['45 a 50 min', 'Cierre y tarea', 'En tu panel ves cuántos contestaron. De tarea: la primera semana del plan de 30 días y platicar el reporte en casa.'],
];

const VE = ['Cuántos lugares se usaron, cuántos ya contestaron y cuántos aceptaron compartir su resultado contigo',
  'De quienes aceptaron: su nombre, su código de tres letras (por ejemplo, SAI) y sus 3 primeras carreras',
  'Gráficas del grupo hechas solo con quienes aceptaron: tipo de interés principal, carreras que más aparecen (las 5 primeras de cada quien) y área de la UNAM más frecuente'];
const NO_VE = ['El correo de nadie',
  'Las respuestas una por una ni los puntajes',
  'El reporte completo de cada quien',
  'El nombre ni el resultado de quien no marcó la casilla: solo cuenta en el número de lugares usados y de quienes ya contestaron'];

const faqEscuelas = ({ precioInd }) => [
  ['¿Cada alumno recibe el reporte completo o solo el perfil básico?', `El reporte completo: el mismo que una persona compra por ${precioInd}, con 20 carreras, el examen que le toca y un plan de 30 días. Le llega la liga a su correo y no vence.`],
  ['¿Es una prueba psicométrica?', 'No. Es una herramienta orientativa basada en la teoría de intereses vocacionales de John L. Holland (RIASEC), con preguntas originales de Vorka México. No es un instrumento estandarizado ni un diagnóstico, y no sustituye tu orientación: te da material para platicar con cada estudiante.'],
  ['¿Las alumnas y los alumnos necesitan crear una cuenta?', 'No. Solo escriben su nombre y un correo al que tengan acceso: ahí les llega la liga de su reporte por si quieren volver a verlo.'],
  ['¿Sirve para secundaria?', 'Sí. A quien va en secundaria le ayuda a elegir prepa o bachillerato, y el reporte le dice si le toca el ECOEMS (prepas de la UNAM y el IPN en el Valle de México) o el examen de la prepa de la Universidad de Guanajuato.'],
  ['¿Sirve en Celaya y el Bajío?', 'Sí. Se contesta en línea desde cualquier lugar, y el test pregunta dónde piensa presentar examen cada quien. Si elige la Universidad de Guanajuato, el reporte lo toma en cuenta: en secundaria le habla del examen de la prepa de la UG y su simulador; en prepa, le pide revisar el examen y las fechas en la convocatoria de la UG.'],
  ['¿Puedo usar un paquete con varios grupos?', 'Sí: la liga es una sola y los lugares se comparten. El panel junta a todos los que entraron con esa liga; si quieres ver cada grupo por separado, compra un paquete por grupo.'],
  ['¿Qué pasa si alguien entra dos veces?', 'Si usa el mismo correo, no gasta otro lugar: le reenviamos la liga de su reporte. Ojo: quien tenga la liga del grupo puede usar un lugar, así que compártela solo con tu grupo.'],
  ['¿Qué pasa si se acaban los lugares?', 'La liga avisa que ya no hay lugares. Puedes comprar otro paquete: llega con su propia liga y su propio panel.'],
  ['¿Vencen las licencias?', 'La liga de tu panel no vence y los lugares no tienen fecha de caducidad. Los resultados ligados a una licencia se borran 24 meses después de su última actualización.'],
  ['¿Puedo probarlo antes de comprar?', `Sí: contesta tú el <a href="${RUTA_TEST}">test gratis</a> y verás el perfil básico. Si quieres ver un reporte completo o el panel, pídenos una demostración por WhatsApp.`],
  ['¿Cómo se paga? ¿Dan factura?', 'Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI; el pago lo procesa Stripe. ¿Necesitas factura o más de 100 licencias? Escríbenos a hola@vorka.mx antes de pagar.'],
];

// ---------- la página para escuelas ----------
export function paginaEscuelas({ grupos = [], p = null } = {}) {
  const precioInd = p ? precio(p) : '$79 MXN';
  const minimo = grupos.length ? grupos.reduce((a, g) => (g.precio_centavos / g.contenido.licencias < a.precio_centavos / a.contenido.licencias ? g : a)) : null;
  const F = faqEscuelas({ precioInd });
  const descripcion = `Test vocacional para todo tu grupo de secundaria o prepa: cada alumno recibe su reporte completo y tú, un panel con los resultados de quienes acepten compartirlos.${minimo ? ` Desde ${porAlumno(minimo)} por alumno.` : ''}`;
  const ligaTest = `${SITIO}${RUTA_TEST}`;
  const waFamilias = whatsapp(`Les comparto el test vocacional de Vorka: es gratis, tarda unos 10 minutos y al terminar ven su perfil con sus 3 tipos de interés y su carrera más afín. Si su familia quiere, puede comprar el reporte completo. ${ligaTest}`);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Test vocacional Vorka · Licencias para grupo', description: descripcion, url: `${SITIO}${RUTA_ESCUELAS}`,
      brand: { '@type': 'Brand', name: 'Vorka México' }, category: 'Educación', audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' },
      offers: grupos.length ? ofertas({ ruta: RUTA_ESCUELAS, centavos: grupos.map(g => g.precio_centavos), detalle: grupos.map(g => ({ centavos: g.precio_centavos, name: `${g.contenido.licencias} licencias` })) })
        : oferta({ ruta: RUTA_ESCUELAS, centavos: 49000, disponible: false }) },
    migas('Para escuelas', RUTA_ESCUELAS, [['Test vocacional', RUTA_TEST]]),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: F.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
  ];
  return pagina({ titulo: 'Test vocacional para escuelas y orientadores | Vorka México', ruta: RUTA_ESCUELAS, descripcion, navActual: 'catalogo',
    head: `<style>${CSS_TESTS}${CSS_ESC}</style>${ldScript(ld)}`, whatsappTexto: TEXTO_DEMO,
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  ${navTienda('examenes')}
  <span class="tv-et">Escuelas, orientadores y comités de padres</span>
  <h1 class="tv-h1">El test vocacional para <em>todo tu grupo,</em> en una clase.</h1>
  <p class="tv-lead">Compartes una sola liga. Cada alumna y alumno contesta ${N_PREG} preguntas en su celular o en la computadora (de 8 a 10 minutos) y recibe su reporte completo. Tú ves en tu panel los resultados de quienes acepten compartirlos contigo.</p>
  <div class="tv-ctas"><a class="btn acento" href="${esc(WA_DEMO)}" target="_blank" rel="noopener">Pide una demostración ${FLECHA}</a><a class="btn blanco" href="#precios">Comprar licencias</a></div>
  <ul class="tv-chips"><li>Secundaria y prepa</li>${minimo ? `<li>Desde ${porAlumno(minimo)} por alumno</li>` : ''}<li>Pago único</li><li>Sin instalar nada ni crear cuentas</li></ul>
  <p class="tv-nota" style="margin-top:14px">¿Sin presupuesto? <a href="#familias">Úsalo gratis y que cada familia decida</a>.</p>
</div></section>

<section class="tv-sec suave" id="que-reciben"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Qué reciben</span><h2>Un reporte para cada quien y una vista del grupo para ti.</h2>
    <p>No es solo el perfil básico: con la licencia, cada estudiante recibe el reporte completo, el mismo que se vende por ${precioInd}.</p></div>
  <div class="te-cards">
    <div class="te-card"><h3>Cada alumna y alumno</h3><p>Su reporte completo, que puede imprimir o guardar en PDF:</p><ul>${RECIBE_ALUMNO.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="te-card"><h3>Tú, que orientas</h3><p>Una liga para tu grupo y un panel que se abre desde tu correo (la liga no vence) y puedes imprimir:</p><ul>
      <li>Lugares usados, quiénes ya contestaron y cuántos aceptaron compartir</li>
      <li>Tipo de interés principal del grupo</li><li>Carreras que más aparecen</li><li>Área de la UNAM más frecuente</li>
      <li>Una tabla con nombre, código y 3 primeras carreras de quienes aceptaron compartir</li></ul></div>
    <div class="te-card"><h3>Las familias</h3><p>El reporte trae preguntas para platicar en casa, y la decisión se vuelve una conversación con información, no una apuesta.</p>
      <p>Es orientativo: no es una prueba psicométrica ni un diagnóstico.</p></div>
  </div>
</div></section>

<section class="tv-sec" id="clase"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Cómo se usa</span><h2>Una clase de 50 minutos, paso a paso.</h2>
    <p>Una propuesta para hacerlo en una sola sesión. Ajústala a tu grupo.</p></div>
  <ol class="te-clase">${CLASE.map(([m, t, d]) => `<li><span class="te-min">${m}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ol>
  <p class="tv-nota" style="margin-top:14px">Si proyectas tu panel en el salón, muestra solo las gráficas del grupo, no la tabla con nombres.</p>
</div></section>

<section class="tv-sec suave" id="precios"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Precios</span><h2>Paquetes para tu grupo o tu escuela.</h2>
    <p>Pago único. Cada licencia es un reporte completo para una alumna o un alumno.</p></div>
  ${grupos.length ? formsLicencias(grupos, 'e') : `<p class="tv-nota">Las licencias abren muy pronto. Escríbenos por <a href="${esc(WA_DEMO)}" target="_blank" rel="noopener">WhatsApp</a> o a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>`}
  <div class="te-familia" id="familias"><span class="tv-et">Gratis para la escuela</span><h3>Opción «Que lo pague cada familia»</h3>
    <p>Comparte la liga del <a href="${RUTA_TEST}">test gratis</a>. Cada quien lo contesta, ve gratis su perfil básico (sus 3 tipos de interés y su carrera más afín) y, si su familia quiere, compra el reporte completo por ${precioInd}, pago único. Desde su resultado, cada estudiante puede mandar a su mamá o a su papá una liga para que lo paguen.</p>
    <p><b>La diferencia:</b> en esta opción no hay panel del grupo; solo ves lo que cada estudiante te quiera enseñar.</p>
    <div class="tv-acciones"><a class="btn blanco chico" href="${esc(waFamilias)}" target="_blank" rel="noopener">Mandar la liga gratis por WhatsApp</a><a class="btn blanco chico" href="${RUTA_TEST}">Ver el test gratis</a></div></div>
</div></section>

<section class="tv-sec" id="comprar"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Cómo comprar</span><h2>En cinco minutos tienes la liga de tu grupo.</h2>
    <div class="tv-acciones"><a class="btn acento" href="#precios">Comprar licencias ${FLECHA}</a><a class="btn blanco" href="${esc(WA_DEMO)}" target="_blank" rel="noopener">Pide una demostración</a></div></div>
  <ol class="te-pasos">
    <li><b>Elige tu paquete</b> y escribe tu nombre y tu correo: ahí llega tu panel.</li>
    <li><b>Paga</b> con tarjeta, en efectivo en OXXO o por transferencia SPEI. El pago lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.</li>
    <li><b>Abre tu panel</b> con el botón «Abrir mi panel de grupo» del correo. Guárdalo: la liga no vence.</li>
    <li><b>Comparte la liga del grupo</b> por WhatsApp o en el pizarrón, y sigue el avance desde tu panel.</li>
  </ol>
</div></section>

<section class="tv-sec suave" id="privacidad"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Privacidad</span><h2>Compartir su resultado contigo es decisión de cada estudiante.</h2>
    <p>Al unirse, cada quien ve una casilla, desmarcada, que dice: «Acepto que quien me dio esta licencia (mi escuela u orientador) vea mi resultado: mi código y mis primeras carreras (opcional)». También confirma que, si es menor de edad, tiene permiso de su mamá, papá o tutor.</p></div>
  <div class="te-priv">
    <div><h3>Lo que ves en tu panel</h3><ul>${VE.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div><h3>Lo que no ves</h3><ul>${NO_VE.map(x => `<li>${x}</li>`).join('')}</ul></div>
  </div>
  <p class="tv-nota" style="margin-top:14px">Las respuestas solo se usan para dar el resultado y el reporte; no se venden ni se comparten. Los resultados ligados a una licencia se borran 24 meses después de su última actualización, y cualquiera puede pedir que borremos los suyos antes escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Consulta el <a href="/privacidad/#tests">aviso de privacidad</a>.</p>
</div></section>

${seccionFaq({ titulo: 'Preguntas de escuelas y orientadores', items: F.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: TEXTO_DEMO,
  pie: `<p class="t-nota t-legal">Test vocacional Vorka · Basado en la teoría RIASEC de John L. Holland, con preguntas originales de Vorka México · Orientativo: no es una prueba psicométrica · <a href="${RUTA_VOLANTE}">Volante para imprimir</a></p>` })}
</div>`,
  });
}

// ---------- volante imprimible (carta, una hoja) ----------
const CSS_VOLANTE = `
.vo-barra{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;padding:96px 16px 16px}
.vo-barra p{margin:0;font-size:14px;color:var(--fg-2);text-align:center;width:100%}
.vo-marco{padding:0 16px 48px;overflow-x:auto}
.vo-hoja{--m:#6b2a85;--t:#141114;--g:#5d5762;box-sizing:border-box;width:8.5in;height:11in;margin:0 auto;padding:.55in .6in;background:#fff;color:var(--t);
  font-family:Inter,system-ui,sans-serif;box-shadow:0 20px 50px -20px rgba(0,0,0,.4);display:flex;flex-direction:column;overflow:hidden;color-scheme:light}
.vo-hoja *{box-sizing:border-box}
.vo-cab{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid var(--m);padding-bottom:12px}
.vo-marca{font-weight:800;font-size:20px;letter-spacing:-.02em}.vo-marca span{color:var(--m)}
.vo-et{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}
.vo-h1{font-size:44px;line-height:1.02;letter-spacing:-.04em;font-weight:800;margin:22px 0 0}.vo-h1 em{font-style:normal;color:var(--m)}
.vo-sub{font-size:17px;line-height:1.45;color:var(--g);margin:12px 0 0}
.vo-tres{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0 0;padding:0;list-style:none}
.vo-tres li{border:1.5px solid #e4dfe7;border-radius:14px;padding:12px 13px;font-size:13.5px;line-height:1.4;color:var(--g)}.vo-tres b{display:block;color:var(--t);font-size:15px;margin-bottom:4px}
.vo-medio{display:grid;grid-template-columns:1fr 2.05in;gap:22px;margin:22px 0 0;align-items:start}
.vo-tabla{width:100%;border-collapse:collapse;font-size:15px}.vo-tabla th,.vo-tabla td{padding:9px 8px;border-bottom:1px solid #e4dfe7;text-align:left}
.vo-tabla th{font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--g)}.vo-tabla td b{font-size:19px}
.vo-gratis{margin:14px 0 0;padding:12px 14px;border:2px dashed #cfc7d4;border-radius:14px;font-size:13.5px;line-height:1.45;color:var(--g)}.vo-gratis b{color:var(--t)}
.vo-qr{text-align:center}.vo-qr svg{width:2.05in;height:2.05in;display:block}.vo-qr small{display:block;font-size:12px;color:var(--g);margin-top:6px;line-height:1.35}
.vo-clase{margin:20px 0 0;font-size:13.5px;line-height:1.45;color:var(--g)}.vo-clase b{color:var(--t)}
.vo-pasos{list-style:none;padding:0;margin:20px 0 0;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;counter-reset:p}
.vo-pasos li{counter-increment:p;background:#f5f1f7;border-radius:12px;padding:10px 10px 11px;font-size:12.5px;line-height:1.35;color:var(--g)}
.vo-pasos li::before{content:counter(p);display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--m);color:#fff;font-size:11px;font-weight:800;margin-bottom:5px}
.vo-pasos b{display:block;color:var(--t);font-size:14px}
.vo-pie{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;border-top:1px solid #e4dfe7;padding-top:14px}
.vo-cta{font-size:15px;line-height:1.45}.vo-cta b{font-size:22px;letter-spacing:-.02em;display:block;color:var(--m)}
.vo-legal{font-size:10.5px;color:var(--g);max-width:3.1in;text-align:right;line-height:1.4}
@page{size:letter;margin:0}
@media print{
  html,body{background:#fff!important;margin:0!important;padding:0!important}
  body>*:not(main),.vo-barra,.saltar,.t-wa{display:none!important}
  main,.t-main,.vo-marco{padding:0!important;margin:0!important;overflow:visible!important}
  .vo-hoja{box-shadow:none;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;

export function volanteEscuelas({ grupos = [], p = null } = {}) {
  const precioInd = p ? precio(p) : '$79 MXN';
  const url = `${SITIO}${RUTA_ESCUELAS}`;
  const filas = grupos.map(g => `<tr><td>${g.contenido.licencias} alumnos</td><td><b>${precio(g)}</b></td><td>${porAlumno(g)} c/u</td></tr>`).join('');
  return pagina({ titulo: 'Volante para escuelas · Test vocacional Vorka', ruta: RUTA_VOLANTE, noindex: true, navActual: 'catalogo',
    descripcion: 'Volante imprimible del Test vocacional Vorka para escuelas.', head: `<style>${CSS_VOLANTE}</style>`,
    script: `(function(){ var b=document.getElementById('vo-imprimir'); if(b) b.addEventListener('click',function(){ window.print(); }); })();`,
    cuerpo: `<div class="vo-barra"><button class="btn acento" type="button" id="vo-imprimir">Imprimir volante</button><a class="btn blanco" href="${RUTA_ESCUELAS}">Volver a la página para escuelas</a>
  <p>Tamaño carta, una hoja. En la ventana de impresión elige «Carta», márgenes «Ninguno» y activa «Gráficos de fondo».</p></div>
<div class="vo-marco"><article class="vo-hoja" aria-label="Volante del Test vocacional Vorka para escuelas">
  <header class="vo-cab"><span class="vo-marca">Vorka <span>México</span></span><span class="vo-et">Para escuelas y orientadores</span></header>
  <h1 class="vo-h1">Test vocacional para <em>todo tu grupo,</em> en una clase.</h1>
  <p class="vo-sub">Secundaria y prepa · ${N_PREG} preguntas · de 8 a 10 minutos · en celular o computadora, sin instalar nada.</p>
  <ul class="vo-tres">
    <li><b>Reporte completo para cada quien</b>Sus 3 tipos de interés, 20 carreras afines, el examen que le toca y un plan de 30 días.</li>
    <li><b>Panel para quien orienta</b>Avance del grupo y resultados de quienes acepten compartirlos: tipos, carreras y áreas.</li>
    <li><b>Cabe en 50 minutos</b>Una sola liga para el grupo. Cada estudiante usa su nombre y su correo, sin crear cuentas.</li>
  </ul>
  <div class="vo-medio">
    <div>
      ${filas ? `<table class="vo-tabla"><thead><tr><th scope="col">Paquete</th><th scope="col">Precio</th><th scope="col">Por alumno</th></tr></thead><tbody>${filas}</tbody></table>
      <p class="vo-clase" style="margin-top:8px">Pago único con tarjeta, OXXO o SPEI. Precios en pesos mexicanos.</p>` : '<p class="vo-clase">Pregunta por los paquetes para tu grupo o tu escuela.</p>'}
      <div class="vo-gratis"><b>¿Sin presupuesto? Gratis para la escuela:</b> compartan el test gratis; cada estudiante ve su perfil básico y cada familia decide si compra el reporte completo (${precioInd}).</div>
    </div>
    <div class="vo-qr">${qrSvg(url, 'Código QR a la página para escuelas del Test vocacional Vorka')}<small>Escanea para ver cómo funciona, la privacidad y comprar<br><b>vorka.mx/test-vocacional/escuelas</b></small></div>
  </div>
  <ol class="vo-pasos">${[['5 min', 'Presentas el test'], ['5 min', 'Comparten la liga del grupo'], ['12 min', 'Contestan y ven su reporte'], ['23 min', 'Leen y platican en parejas'], ['5 min', 'Cierre y tarea en casa']].map(([m, t]) => `<li><b>${m}</b>${t}</li>`).join('')}</ol>
  <p class="vo-clase"><b>Privacidad:</b> compartir su resultado con la escuela es opcional para cada estudiante. Tú nunca ves sus correos ni sus respuestas.</p>
  <footer class="vo-pie">
    <div class="vo-cta">Pide una demostración por WhatsApp<b>+52 81 1780 4869</b>o escríbenos a hola@vorka.mx</div>
    <p class="vo-legal">Test vocacional Vorka · Basado en la teoría RIASEC de John L. Holland, con preguntas originales de Vorka México. Es orientativo: no es una prueba psicométrica ni un diagnóstico.</p>
  </footer>
</article></div>`,
  });
}
