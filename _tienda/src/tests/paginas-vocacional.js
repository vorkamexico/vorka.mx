// Test vocacional Vorka · páginas: el test gratis (indexable), el resultado con vista previa con candado, el reporte de
// pago (imprimible), las licencias para grupo y el panel del orientador.
import { pagina, esc, WHATSAPP } from '../paginas.js';
import { precio, masTienda, seccionFaq, navTienda, formCompra, SCRIPT_COMPRA } from '../tienda.js';
import { oferta, ofertas, migas, ldScript } from '../seo.js';
import { resenasDe, ldResenas, seccionResenas } from '../resenas.js';
import { pesosTexto } from '../descuentos.js';
import { FLECHA } from '../marco.generado.js';
import { CSS_TESTS } from './estilos.js';
import { TIPOS, ORDEN_TIPOS, INTERESES, HABILIDADES, PREFERENCIAS, OPC_INTERES, OPC_HABILIDAD, CARRERAS, AREAS_UNAM, RAMAS_IPN, PLAN_30, PREGUNTAS_FAMILIA, PREGUNTAS_PROFESIONAL } from './vocacional-datos.js';
import { calcular, SIMULADORES } from './vocacional.js';
import { formCompraTest, SCRIPT_COMPRA_TEST, SCRIPT_TEST, SCRIPT_IMPRIMIR, ICONO_CANDADO, PRODUCTOS_TEST, whatsapp, fechaCorta, SIN_REFERER, horaVence } from './comun.js';

const DEF = PRODUCTOS_TEST.vocacional;
const RUTA = DEF.ruta;
// Imagen para compartir (simulador/portadas_v3.py)
export const OG_VOCACIONAL = 'https://vorka.mx/assets/tienda/v3/test-vocacional-og.jpg';
const SITIO = 'https://vorka.mx';
const N_PREG = INTERESES.length + HABILIDADES.length + Object.keys(PREFERENCIAS).length;
export const DESCUENTO_PAQUETE = 4000;   // $40 MXN menos al llevar el reporte con el simulador de tu examen
const head = (extra = '') => `<style>${CSS_TESTS}</style>${extra}`;
const tipoCss = t => `--c:${TIPOS[t].color}`;

// ---------- el formulario del test (mismo en la página gratis y en el reporte de una compra sin respuestas) ----------
function pregunta(nombre, n, texto, opciones, valor, { lista = false } = {}) {
  return `<fieldset class="tv-q" id="q-${nombre}" data-req="1"><legend><span class="tv-n">${n}</span><span>${esc(texto)}</span></legend>
  <div class="tv-op${lista ? ' lista' : ''}">${opciones.map(([v, t]) => `<label><input type="radio" name="${nombre}" value="${esc(v)}" required${String(valor ?? '') === String(v) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset>`;
}
export function formTest({ accion = RUTA, datos = {}, error = '', boton = 'Ver mi perfil', extra = '' } = {}) {
  let n = 0;
  return `<form class="tv-form" id="form-test" method="post" action="${esc(accion)}" novalidate>
  <div class="tv-progreso"><span id="tv-cuenta" aria-hidden="true">0 de ${N_PREG}</span><span class="tv-barra" aria-hidden="true"><i id="tv-barra"></i></span></div>
  <p class="tv-ok" id="tv-animo" role="status" hidden>¡Vas a la mitad! Tu perfil ya se está armando.</p>
  <p class="tv-nota" id="tv-recuperado" role="status" hidden>Recuperamos las respuestas que dejaste en este navegador: sigue donde te quedaste.</p>
  ${error ? `<p class="tv-error" role="alert">${esc(error)}</p>` : ''}
  <h3 class="tv-parte">1 · Lo que te gusta <small>¿Qué tanto te gustaría hacer cada cosa? No pienses si sabes hacerlo: solo si te gustaría.</small></h3>
  ${INTERESES.map(([, t], k) => pregunta(`i${k}`, ++n, t, OPC_INTERES, datos[`i${k}`])).join('')}
  <h3 class="tv-parte">2 · Lo que se te da <small>¿Qué tan bien te sale cada cosa hoy? Sé honesta u honesto: nadie más lo ve.</small></h3>
  ${HABILIDADES.map(([, t], k) => pregunta(`h${k}`, ++n, t, OPC_HABILIDAD, datos[`h${k}`])).join('')}
  <h3 class="tv-parte">3 · Tú y tu examen <small>Con esto ajustamos tus carreras y te decimos qué examen te toca.</small></h3>
  ${Object.entries(PREFERENCIAS).map(([k, d]) => pregunta(k, ++n, d.p, d.o, datos[k], { lista: d.o.length > 3 })).join('')}
  ${extra}
  <p class="tv-error" id="tv-falta" role="alert" hidden></p>
  <button class="btn acento tv-enviar" type="submit">${esc(boton)} ${FLECHA}</button>
  <p class="tv-nota">Es orientativo: no es una prueba psicométrica ni un diagnóstico. Tus respuestas se guardan para mostrarte tu resultado; puedes borrarlas cuando quieras (<a href="/privacidad/#tests">aviso de privacidad</a>).</p>
</form>`;
}

const FAQ = precioT => [
  ['¿El test vocacional es gratis?', `Sí. Contestas ${N_PREG} preguntas (8 a 10 minutos) y al momento ves gratis tu perfil: tus 3 tipos de interés con su descripción y tu carrera más afín, sin crear cuenta. El reporte completo (20 carreras, tu examen y un plan de 30 días) cuesta ${precioT}, pago único.`],
  ['¿En qué se basa?', 'En la teoría de intereses vocacionales de John L. Holland, que agrupa los intereses en seis tipos: Realista, Investigador, Artístico, Social, Emprendedor y Convencional (RIASEC). Todas las preguntas son originales de Vorka México y combinan tres cosas: lo que te gusta, lo que se te da y lo que buscas al estudiar.'],
  ['¿Es una prueba psicométrica?', 'No. Es una herramienta orientativa para conocerte mejor y explorar carreras con más información. No es un instrumento estandarizado ni un diagnóstico, y no sustituye la orientación de una o un profesional. Úsalo para hacerte mejores preguntas, no como sentencia.'],
  ['¿Qué trae el reporte completo?', 'Tu perfil detallado (tus 3 tipos, fortalezas, ambientes de trabajo y lo que conviene cuidar), 20 carreras afines con qué se estudia y en qué se trabaja, en qué área de la UNAM o rama del IPN caen o si te toca la PAA, el simulador y las guías para tu examen, un plan de 30 días para decidir y preguntas para hablar con tu familia o tu orientador. Lo puedes imprimir o guardar en PDF.'],
  ['¿Las carreras son de una universidad en específico?', 'No. Son nombres generales de carreras que se ofrecen en México. Cada universidad las llama un poco distinto: revisa su plan de estudios y su convocatoria antes de decidir.'],
  ['¿Sirve si voy en secundaria?', 'Sí. Te ayuda a elegir una prepa o un bachillerato que vaya con tus intereses y te dice si te toca el examen ECOEMS o el de la prepa de la UG.'],
  ['Soy mamá o papá, ¿cómo lo uso?', 'Pásale la liga a tu hija o hijo para que lo conteste. Si compras el reporte, también lo puedes regalar: te llega una liga por correo para que se la mandes. El reporte trae preguntas para que platiquen en familia.'],
  ['Soy orientador, ¿hay precio para grupos?', 'Sí: licencias para 10, 30 o 100 alumnas y alumnos con precio por alumno más bajo. Recibes una sola liga para tu grupo y un panel con los resultados de quienes acepten compartirlos contigo. Todo el detalle está en <a href="/test-vocacional/escuelas/">la página para escuelas</a>.'],
  ['¿Qué hacen con mis respuestas?', 'Solo las usamos para darte tu resultado y tu reporte. No se venden ni se comparten. Si no compras ni dejas tu correo, se borran a los 12 meses, y puedes borrarlas tú cuando quieras desde tu resultado. Consulta el <a href="/privacidad/#tests">aviso de privacidad</a>.'],
  ['¿Cómo puedo pagar?', `Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. ${precioT}, pago único. El pago lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.`],
];

// Licencias para grupo: un formulario por paquete (sin JavaScript también funciona). También los usa /test-vocacional/escuelas/.
export const RUTA_ESCUELAS = `${RUTA}escuelas/`;
export const porAlumno = g => pesosTexto(Math.round(g.precio_centavos / g.contenido.licencias));
export function formsLicencias(grupos, pre = 'g') {
  return `<div class="tv-lic">${grupos.map((g, i) => `<form method="post" action="/api/checkout" class="${i === 1 ? 'dest' : ''}">
    <input type="hidden" name="slug" value="${esc(g.slug)}">
    <h3>${g.contenido.licencias} licencias</h3>
    <span class="tv-pp num">${precio(g)}</span>
    <span class="tv-nota">${porAlumno(g)} por alumno · pago único</span>
    <label class="vh" for="${pre}n-${i}">Nombre de quien compra</label><input id="${pre}n-${i}" name="nombre" type="text" required minlength="2" maxlength="120" placeholder="Tu nombre" autocomplete="name">
    <label class="vh" for="${pre}e-${i}">Correo</label><input id="${pre}e-${i}" name="email" type="email" required maxlength="254" placeholder="Tu correo (aquí llega tu panel)" autocomplete="email">
    <label class="tv-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a> y el <a href="/privacidad/#tests" target="_blank">aviso de privacidad</a>.</span></label>
    <button class="btn ${i === 1 ? 'acento' : 'blanco'}" type="submit">Comprar ${g.contenido.licencias} licencias ${FLECHA}</button>
  </form>`).join('')}</div>`;
}
// Línea para el pie de las páginas del test: lleva a la página para escuelas
export const PIE_ESCUELAS = `<p class="tv-nota tv-no-imprimir tv-pie-esc">¿Eres orientadora, orientador o das clases? <a href="${RUTA_ESCUELAS}">Usa el test con todo tu grupo</a>: licencias para grupos de 10, 30 o 100 alumnas y alumnos.</p>`;

function licencias(grupos) {
  return `<section class="tv-sec" id="escuelas"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Escuelas y orientadores</span><h2>Úsalo con todo tu grupo</h2>
    <p>Una sola liga para tu grupo: cada alumna o alumno contesta con su correo y recibe su reporte completo. En tu panel ves los resultados de quienes acepten compartirlos contigo (tipos más comunes, carreras y áreas). Cabe en una clase de 50 minutos.</p>
    <div class="tv-acciones"><a class="btn tinta" href="${RUTA_ESCUELAS}">Ver cómo funciona en escuelas ${FLECHA}</a></div></div>
  ${grupos.length ? formsLicencias(grupos) : ''}
  <p class="tv-nota">¿Necesitas factura o más de 100 licencias? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>
</div></section>`;
}

export async function landingVocacional(env, req, url, { p, grupos = [], code = null, cookie = null, error = '', datos = {}, status = 200, aviso = '' } = {}) {
  const precioT = p ? precio(p) : '$79 MXN';
  const rs = p ? await resenasDe(env, RUTA) : null;
  const F = FAQ(precioT);
  const descripcion = `Test vocacional gratis: ${N_PREG} preguntas, resultado al instante con tus 3 tipos de interés (modelo RIASEC de Holland) y tu carrera más afín. Reporte completo con 20 carreras y plan de 30 días por ${precioT}.`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Test vocacional Vorka · Reporte completo', description: descripcion, url: `${SITIO}${RUTA}`, brand: { '@type': 'Brand', name: 'Vorka México' },
      offers: grupos.length && p ? ofertas({ ruta: RUTA, centavos: [p.precio_centavos, ...grupos.map(g => g.precio_centavos)] }) : oferta({ ruta: RUTA, centavos: p?.precio_centavos ?? 7900, disponible: !!p }), ...ldResenas(rs) },
    migas('Test vocacional', RUTA),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: F.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
  ];
  return pagina({ titulo: 'Test vocacional gratis: descubre qué carrera estudiar | Vorka México', ruta: RUTA, descripcion, imagen: OG_VOCACIONAL, navActual: 'catalogo', status,
    head: head(ldScript(ld)), headers: cookie ? { 'set-cookie': cookie } : {}, script: SCRIPT_TEST('vocacional') + (p ? SCRIPT_COMPRA : ''),
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  ${navTienda('examenes')}
  <div class="tv-hero-g">
    <div>
      <span class="tv-et">Test vocacional gratis</span>
      <h1 class="tv-h1">Descubre en 10 minutos <em>qué carreras van contigo.</em></h1>
      <p class="tv-lead">${N_PREG} preguntas cortas sobre lo que te gusta, lo que se te da y lo que buscas. Al terminar ves tu perfil: tus 3 tipos de interés y tu carrera más afín.</p>
      ${aviso ? `<p class="tv-ok" role="status">${esc(aviso)}</p>` : ''}
      <div class="tv-ctas"><a class="btn acento" href="#test">Empezar el test ${FLECHA}</a><a class="btn blanco" href="#reporte">Ver qué trae el reporte</a></div>
      <p class="tv-nota" style="margin:14px 0 0"><b>Contestarlo es gratis · tu perfil básico es gratis · el reporte completo cuesta ${precioT}</b> (opcional, pago único).</p>
      <ul class="tv-chips"><li>${N_PREG} preguntas · 8 a 10 min</li><li>Sin crear cuenta</li><li>Para secundaria, prepa y familias</li></ul>
    </div>
    <div class="tv-tarjeta" aria-label="Así se ve tu resultado (ejemplo)">
      <span class="tv-et" style="color:var(--fg-2)">Ejemplo de resultado</span>
      <div class="tv-barras" style="margin-top:12px">${[['S', 82], ['A', 74], ['I', 61], ['E', 48], ['C', 35], ['R', 22]].map(([t, v]) => `<div class="tv-b" style="${tipoCss(t)}"><span>${TIPOS[t].nombre}</span><i><span style="width:${v}%"></span></i><b class="num">${v}</b></div>`).join('')}</div>
      <p class="tv-nota" style="margin:12px 0 0">Tu código: <b>SAI</b> · Psicología, Pedagogía, Ciencias de la Comunicación…</p>
    </div>
  </div>
</div></section>

<section class="tv-sec suave" id="como"><div class="marco">
  <div class="tv-cab"><span class="tv-et">Cómo funciona</span><h2>Tus intereses, tus habilidades y lo que buscas.</h2>
    <p>Usamos el modelo de seis tipos de intereses de John L. Holland (RIASEC), con preguntas propias escritas para estudiantes en México.</p></div>
  <ol class="tv-tres">${[['Contestas', `${N_PREG} preguntas rápidas: lo que te gustaría hacer, qué tan bien te sale y qué examen vas a presentar.`], ['Ves tu resultado', 'Tu perfil gratis: tus 3 tipos de interés con su puntaje y tu carrera más afín, al momento.'], ['Decides con más información', 'Si quieres, el reporte completo te da 20 carreras, tu examen y un plan de 30 días.']].map(([t, d], i) => `<li><span class="tv-num">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
  <p class="tv-nota" style="margin-top:16px">Es orientativo: no es una prueba psicométrica ni un diagnóstico.</p>
</div></section>

<section class="tv-sec" id="test"><div class="marco">
  <div class="tv-cab"><span class="tv-et">El test</span><h2>Contesta con lo primero que pienses.</h2><p>No hay respuestas buenas ni malas. Tardas de 8 a 10 minutos.</p></div>
  ${formTest({ datos, error })}
</div></section>

<section class="tv-sec suave" id="reporte"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Reporte completo · ${precioT}</span><h2>Todo lo que necesitas para decidir.</h2>
    <p>Primero haz el test gratis: al final ves una vista previa de tu reporte y lo desbloqueas ahí mismo, con el mismo correo, en un paso.</p>
    <div class="tv-acciones"><a class="btn acento" href="#test">Hacer el test gratis ${FLECHA}</a>${p?.contenido?.regalable ? `<a class="btn blanco" href="${RUTA}?regalo=1#regalar">🎁 Regalarlo</a>` : ''}</div></div>
  <ul class="tv-incluye" style="gap:10px">${['Tu perfil detallado: tus 3 tipos, tus fortalezas, dónde te sentirías a gusto y qué cuidar', '20 carreras afines con qué se estudia y en qué se trabaja', 'En qué área de la UNAM o rama del IPN cae cada una, o si te toca la PAA', 'El simulador y las guías para practicar tu examen', 'Un plan de 30 días con actividades concretas para decidir', 'Preguntas para hablar con tus papás, tu orientador y alguien que ya ejerce'].map(x => `<li style="padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line)">${x}</li>`).join('')}</ul>
</div></section>
${p ? `<section class="tv-sec" id="regalar"><div class="marco tv-dos">
  <div class="tv-cab"><span class="tv-et">Regálalo o cómpralo antes</span><h2>¿Es para tu hija, tu hijo o alguien más?</h2>
    <p>Elige «Para regalar»: te llega por correo una liga para que se la mandes, por ejemplo por WhatsApp. Quien la abre contesta el test con sus datos y recibe su reporte completo. También puedes comprarlo para ti y contestar después.</p></div>
  <div>${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1', mensajeEjemplo: '¡Para que elijas con más claridad!' })}</div>
</div></section>` : ''}
${licencias(grupos)}
${seccionResenas(rs)}
${seccionFaq({ titulo: 'Preguntas sobre el test', items: F.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una duda sobre el Test vocacional Vorka',
  pie: PIE_ESCUELAS + '<p class="t-nota t-legal">Test vocacional Vorka · Basado en la teoría RIASEC de John L. Holland, con preguntas originales de Vorka México · Orientativo: no es una prueba psicométrica · Vorka México</p>' })}
${await masTienda(env, 'examenes')}
</div>`,
  });
}

// ---------- resultado gratis con vista previa con candado ----------
export function paquetesDe(p, sims) {
  return sims.map(({ sim, prod }) => {
    const total = p.precio_centavos + prod.precio_centavos - DESCUENTO_PAQUETE;
    return { slug: prod.slug, nombre: SIMULADORES[sim].nombre, total, totalTexto: pesosTexto(total), antesTexto: pesosTexto(p.precio_centavos + prod.precio_centavos), ahorroTexto: pesosTexto(DESCUENTO_PAQUETE),
      detalle: `${prod.nombre}: práctica para tu examen.` };
  });
}

const carreraLi = (c, { detalle = false } = {}) => `<li><span class="tv-af num" title="Afinidad">${c.af}%</span><b>${esc(c.n)}</b>
  <div>${c.a ? `<span class="tv-chip">UNAM ${esc(AREAS_UNAM[c.a].split(' · ')[0])}</span>` : ''}<span class="tv-chip">Matemáticas: ${c.m}</span><span class="tv-chip">${esc(c.c.split('').map(t => TIPOS[t].nombre).join(' · '))}</span></div>
  ${detalle ? `<p class="tv-det"><b>Qué se estudia:</b> ${esc(c.e)}</p><p class="tv-det"><b>En qué se trabaja:</b> ${esc(c.t)}</p>
  <p class="tv-det"><b>Examen:</b> ${c.a ? `${esc(AREAS_UNAM[c.a])} en la UNAM${RAMAS_IPN[c.a] ? `; rama equivalente en el IPN: ${esc(RAMAS_IPN[c.a])}` : ''}.` : 'Depende de la universidad: confirma en su convocatoria (muchas privadas piden la PAA).'}</p>` : ''}</li>`;

// «¡Tu perfil está listo!»: antes de mostrarlo pide nombre y correo para guardarlo y mandárselo (se puede saltar)
export function puertaCorreo({ f, def = PRODUCTOS_TEST.vocacional, titulo = '¡Tu perfil está listo!', texto = 'Escribe tu nombre y tu correo para guardar tu resultado y mandártelo. Así no lo pierdes y lo puedes enseñar a tu familia.', error = '' }) {
  return pagina({ titulo: `${titulo} · ${def.nombre}`, ruta: `${def.ruta}resultado/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tu resultado está listo.', head: head(), status: error ? 400 : 200,
    cuerpo: `<div class="tv"><section class="tv-hero"><div class="marco" style="max-width:620px">
  <span class="tv-et">${esc(def.nombre)}</span>
  <h1 class="tv-h1">${esc(titulo)}</h1>
  <p class="tv-lead">${esc(texto)}</p>
  <form class="tv-form" method="post" action="${def.ruta}resultado/${f.id}/correo" style="margin-top:20px">
    ${error ? `<p class="tv-error" role="alert">${esc(error)}</p>` : ''}
    <div class="tv-campo"><label for="c-nombre">Tu nombre</label><input id="c-nombre" name="nombre" type="text" required minlength="2" maxlength="120" autocomplete="given-name" value="${esc(f.nombre || '')}"></div>
    <div class="tv-campo"><label for="c-email">Tu correo</label><input id="c-email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email" value="${esc(f.email || '')}"></div>
    <label class="tv-casilla"><input type="checkbox" name="consentimiento" value="on" required><span>Acepto el <a href="/privacidad/#tests" target="_blank">aviso de privacidad</a> para que guarden mi resultado y me lo manden. Si soy menor de edad, tengo permiso de mi mamá, papá o tutor.</span></label>
    <label class="tv-casilla"><input type="checkbox" name="novedades" value="on"><span>Mándenme un recordatorio de mi resultado y, de vez en cuando, guías de Vorka (opcional; me puedo dar de baja con un clic).</span></label>
    <button class="btn acento" type="submit">Ver mi perfil ${FLECHA}</button>
    <p class="tv-nota"><a href="${def.ruta}resultado/${f.id}?saltar=1">Ver mi perfil sin dejar mi correo</a></p>
  </form>
</div></section></div>`,
  });
}

// Resultado gratis: tus 3 tipos y tu carrera n.º 1; el reporte completo se ve con candado (títulos visibles, detalle bloqueado)
export function resultadoVocacional({ f, p, paquetes = [], error = '', cupon = null, codigoRef = null, enviado = false }) {
  const res = calcular(f.respuestas);
  const [t1, t2, t3] = res.tipos;
  const c1 = res.carreras[0];
  const bloqueadas = res.carreras.slice(1, 20);
  const liga = `${SITIO}${RUTA}${codigoRef ? `?ref=${encodeURIComponent(codigoRef)}` : ''}`;
  const share = whatsapp(`Hice el test vocacional de Vorka y mi código es ${res.codigo} (${TIPOS[t1].nombre}). ¿Cuál es el tuyo? Compáralo conmigo, es gratis y tarda 10 minutos: ${liga}`);
  const pagarUrl = `${SITIO}${RUTA}pagar/${f.id}`;
  const conCupon = p && cupon ? Math.max(1000, p.precio_centavos - cupon.monto) : null;
  const papa = whatsapp(`Hice un test vocacional y ya salió mi perfil (${res.codigo}). ¿Me ayudas a desbloquear mi reporte completo con 20 carreras, el examen que me toca y un plan de 30 días? Cuesta ${p ? (conCupon ? `${pesosTexto(conCupon)} con el descuento que vence el ${horaVence(cupon.hasta)}` : precio(p)) : ''}. Aquí lo ves y lo pagas: ${pagarUrl}`);
  const ya = f.order_estado === 'paid';
  return pagina({ titulo: `Tu perfil: ${res.codigo} · Test vocacional Vorka`, ruta: `${RUTA}resultado/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tu resultado del test vocacional Vorka.', head: head(), script: p && !ya ? SCRIPT_COMPRA_TEST : '',
    cuerpo: `<div class="tv">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Tu perfil gratis${f.nombre ? ` · ${esc(f.nombre.split(' ')[0])}` : ''}</span>
  <h1 class="tv-h1">Tu código es <em>${res.codigo}</em></h1>
  ${enviado ? '<p class="tv-ok" role="status">Guardamos tu resultado y te lo mandamos por correo (revisa también spam).</p>' : ''}
  <p class="tv-lead">${esc(TIPOS[t1].nombre)}, ${esc(TIPOS[t2].nombre)} y ${esc(TIPOS[t3].nombre)}: estos son los intereses que más pesan en ti hoy.</p>
  <div class="tv-codigo">${[t1, t2, t3].map(t => `<div class="tv-tipo" style="${tipoCss(t)}"><span class="tv-pt num">${res.p[t]}</span><b>${TIPOS[t].nombre}</b><small>${TIPOS[t].corto}</small><p>${esc(TIPOS[t].frase)}</p></div>`).join('')}</div>
</div></section>
<section class="tv-sec" style="padding-top:0"><div class="marco tv-dos">
  <div>
    <h2 class="h2" style="margin:0 0 14px">Tu carrera más afín</h2>
    <ol class="tv-carreras">${carreraLi(c1, { detalle: true })}</ol>
    <p class="tv-nota">Afinidad: qué tanto coincide la carrera con tus tipos (0 a 100). Es orientativo: no es una prueba psicométrica ni un diagnóstico.</p>
    ${ya ? '' : `<div class="tv-candado" style="margin-top:16px" aria-labelledby="vp-t">
      <span class="tv-et">${ICONO_CANDADO} En tu reporte completo</span>
      <h2 id="vp-t" style="margin:6px 0 10px;font-size:22px">Tus otras 19 carreras afines</h2>
      ${p ? `<a class="btn acento chico tv-no-imprimir" href="#comprar" style="margin:0 0 12px">Desbloquear por ${cupon ? pesosTexto(Math.max(1000, p.precio_centavos - cupon.monto)) : precio(p)} ${FLECHA}</a>` : ""}
      <ol class="tv-carreras" start="2" style="opacity:.75;counter-reset:c 1">${bloqueadas.map(c => `<li><span class="tv-af num" aria-label="Bloqueado">🔒</span><b>${esc(c.n)}</b><p class="tv-det" aria-hidden="true" style="filter:blur(4px);user-select:none">Qué se estudia, en qué se trabaja y su examen.</p></li>`).join('')}</ol>
      <h2 style="margin:18px 0 8px;font-size:20px">${ICONO_CANDADO} Tu plan de 30 días para decidir</h2>
      <ul class="tv-incluye">${PLAN_30.map(s => `<li>${esc(s.semana)}</li>`).join('')}</ul>
      <h2 style="margin:18px 0 8px;font-size:20px">${ICONO_CANDADO} También</h2>
      <ul class="tv-incluye"><li>Tu perfil detallado: fortalezas, ambientes de trabajo y qué cuidar</li><li>${esc(res.examen.titulo)}: el simulador y las guías para practicarlo</li><li>Preguntas para hablar con tu familia, tu orientador y alguien que ya ejerce</li></ul>
    </div>`}
  </div>
  <div id="comprar">
    ${ya ? `<div class="tv-compra"><b>Ya tienes tu reporte completo.</b><p class="tv-nota" style="margin:0">Ábrelo con el botón «Ver mi reporte» del correo que te mandamos. ¿No lo encuentras? <a href="/descargas/reenviar">Pide que te lo reenviemos</a>.</p></div>` : p ? `
    <h2 class="h2" style="margin:0 0 6px">Desbloquea tu reporte completo</h2>
    <p class="tv-nota" style="margin:0">Las 20 carreras con qué se estudia, en qué se trabaja y su examen, tu plan de 30 días y tus preguntas. Lo puedes imprimir o guardar en PDF.</p>
    ${formCompraTest(p, { resultado: f.id, nombre: f.nombre || '', email: f.email || '', paquetes, error, cupon, boton: 'Desbloquear mi reporte' })}
    <div class="tv-tarjeta tv-no-imprimir" style="margin-top:14px"><b>¿Que lo pague tu mamá o tu papá?</b>
      <p class="tv-nota" style="margin:6px 0 10px">Mándales por WhatsApp una liga para que vean qué incluye y lo paguen ellos. Llega a tu correo.</p>
      <a class="btn blanco chico" href="${esc(papa)}" target="_blank" rel="noopener">Pedírselo por WhatsApp</a></div>` : '<p class="tv-nota">El reporte completo abre muy pronto.</p>'}
    <div class="tv-tarjeta tv-no-imprimir" style="margin-top:14px"><b>Compara con tus amigos</b>
      <p class="tv-nota" style="margin:6px 0 10px">Mándales el test y comparen sus códigos.${codigoRef ? ' Con tu liga de Puntos Vorka, si alguien compra, ganas puntos.' : ''}</p>
      <a class="btn blanco chico" href="${esc(share)}" target="_blank" rel="noopener">Compartir por WhatsApp</a></div>
  </div>
</div></section>
<section class="tv-sec suave tv-no-imprimir"><div class="marco">
  <h2 class="h2" style="margin:0 0 10px">Tus respuestas, tus datos</h2>
  <p class="tv-nota">Guardamos tus respuestas para mostrarte este resultado${ya ? ' y tu reporte' : ''}. Si no compras, se borran solas a los 12 meses.${f.email ? ' Solo te escribimos lo que aceptaste.' : ''}</p>
  <form method="post" action="${RUTA}resultado/${f.id}/borrar"><button class="tv-mini" type="submit">Borrar mis respuestas ahora</button></form>
  ${PIE_ESCUELAS}
</div></section>
</div>`,
  });
}

// Liga «que lo pague mi mamá o mi papá»: qué incluye, el precio claro y la compra (el reporte llega al correo que escriban)
export function pagarVocacional({ f, p, paquetes = [], cupon = null, error = '' }) {
  const res = calcular(f.respuestas);
  const quien = f.nombre ? esc(f.nombre.split(' ')[0]) : 'Tu hija o tu hijo';
  return pagina({ titulo: 'Reporte vocacional completo · Vorka México', ruta: `${RUTA}pagar/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Desbloquea el reporte completo del Test vocacional Vorka.', head: head(), script: p ? SCRIPT_COMPRA_TEST : '',
    cuerpo: `<div class="tv"><section class="tv-hero"><div class="marco tv-dos">
  <div>
    <span class="tv-et">Test vocacional Vorka</span>
    <h1 class="tv-h1">${quien} ya contestó <em>su test vocacional</em></h1>
    <p class="tv-lead">Su código es <b>${res.codigo}</b> (${esc(res.tipos.slice(0, 3).map(t => TIPOS[t].nombre).join(', '))}). El reporte completo le ayuda a decidir con más información:</p>
    <ul class="tv-incluye" style="gap:8px">${['20 carreras afines con qué se estudia y en qué se trabaja', 'En qué área de la UNAM o rama del IPN cae cada una, o si le toca la PAA', 'El simulador y las guías para practicar su examen', 'Un plan de 30 días y preguntas para platicar en familia'].map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="tv-nota">Es orientativo: no es una prueba psicométrica ni un diagnóstico. Pago único; el reporte no vence.</p>
  </div>
  <div>${p ? formCompraTest(p, { resultado: f.id, email: f.email || '', paquetes, cupon, error, boton: 'Pagar su reporte', ayudaEmail: 'El reporte llega a este correo: puede ser el de tu hija o hijo, o el tuyo para reenviárselo.' }) : '<p class="tv-nota">El reporte completo abre muy pronto.</p>'}</div>
</div></section></div>`,
  });
}

// ---------- reporte completo ----------
function reemplazar(t, ctx) { return t.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? ''); }

export function reporteVocacional({ f, orden, token, sims = {}, codigoRef = null, regalable = true }) {
  const res = calcular(f.respuestas);
  const [t1, t2, t3] = res.tipos;
  const carreras = res.carreras.slice(0, 20);
  const nombre = (f.nombre || orden.nombre || '').split(' ')[0];
  const ctx = { carrera1: carreras[0].n, carrera2: carreras[1].n, explorar1: TIPOS[t1].explorar[0], explorar2: TIPOS[t2].explorar[1] };
  const ex = res.examen, sim = ex.sim ? SIMULADORES[ex.sim] : null, simProd = ex.sim ? sims[ex.sim] : null;
  const liga = `${SITIO}${RUTA}${codigoRef ? `?ref=${encodeURIComponent(codigoRef)}` : ''}`;
  const share = whatsapp(`Hice el test vocacional de Vorka y me ayudó a ver qué carreras van conmigo. Es gratis y tarda 10 minutos: ${liga}`);
  return pagina({ titulo: `Tu reporte vocacional: ${res.codigo} · Vorka México`, ruta: `${RUTA}reporte/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Tu reporte completo del Test vocacional Vorka.', head: head(), script: SCRIPT_IMPRIMIR,
    cuerpo: `<div class="tv tv-rep">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Reporte completo · Test vocacional Vorka</span>
  <h1 class="tv-h1">${nombre ? `${esc(nombre)}, tu` : 'Tu'} código es <em>${res.codigo}</em></h1>
  <p class="tv-lead">Contestado el ${fechaCorta(f.created_at)}. Este reporte es orientativo: te ayuda a conocerte y a explorar con más información. No es una prueba psicométrica ni un diagnóstico.</p>
  <div class="tv-acciones tv-no-imprimir"><button class="btn acento" type="button" id="tv-imprimir">Imprimir o guardar en PDF</button><a class="btn blanco" href="${esc(share)}" target="_blank" rel="noopener">Compartir el test por WhatsApp</a></div>
  ${codigoRef ? '' : '<p class="tv-nota tv-no-imprimir">¿Quieres ganar por recomendarlo? Con tu <a href="/tienda/puntos/">cuenta de Puntos Vorka</a> ganas del 10 al 30 % en puntos de lo que compren con tu liga.</p>'}
</div></section>
<div class="marco">
<section aria-labelledby="r-perfil"><h2 id="r-perfil">1. Tu perfil</h2>
  <div class="tv-barras">${ORDEN_TIPOS.map(t => `<div class="tv-b" style="${tipoCss(t)}"><span>${TIPOS[t].nombre}</span><i><span style="width:${res.p[t]}%"></span></i><b class="num">${res.p[t]}</b></div>`).join('')}</div>
  <div class="tv-codigo">${[t1, t2, t3].map((t, i) => `<div class="tv-tipo" style="${tipoCss(t)}"><span class="tv-num">${i + 1}.º</span><b>${TIPOS[t].nombre} · ${TIPOS[t].corto}</b>
    <p>${esc(TIPOS[t].perfil)}</p>
    <p><b>Tus fortalezas:</b> ${esc(TIPOS[t].fortalezas.join(' · '))}</p>
    <p><b>Dónde te sentirías a gusto:</b> ${esc(TIPOS[t].ambientes.join(' · '))}</p>
    <p><b>Qué cuidar:</b> ${esc(TIPOS[t].cuidar)}</p></div>`).join('')}</div>
</section>
<section aria-labelledby="r-carreras"><h2 id="r-carreras">2. Tus 20 carreras más afines</h2>
  <p class="tv-nota">Ordenadas por afinidad con tu código${f.respuestas.mate === 'evitar' ? ' (bajamos las que llevan muchas matemáticas, porque prefieres evitarlas)' : ''}. Son nombres generales: cada universidad las llama un poco distinto. Confirma el área y el examen en la convocatoria de cada universidad.</p>
  <ol class="tv-carreras">${carreras.map(c => carreraLi(c, { detalle: true })).join('')}</ol>
</section>
<section aria-labelledby="r-examen"><h2 id="r-examen">3. ${esc(ex.titulo)}</h2>
  <p>${esc(ex.texto)}</p>
  ${ex.area ? `<p class="tv-nota">La mayoría de tus primeras carreras están en el <b>${esc(AREAS_UNAM[ex.area])}</b> de la UNAM${RAMAS_IPN[ex.area] ? ` (en el IPN, la rama equivalente es ${esc(RAMAS_IPN[ex.area])})` : ''}.</p>` : ''}
  ${sim ? `<div class="tv-sig"><b>Tu siguiente paso: practica tu examen</b><p class="tv-nota" style="margin:6px 0 10px">El ${esc(sim.nombre)} de Vorka tiene práctica con tutor y exámenes completos con cronómetro.${simProd ? ` Desde ${esc(precioDe(simProd))}.` : ''}</p>
    <div class="tv-acciones" style="margin:0"><a class="btn acento chico" href="${sim.ruta}">Ver el ${esc(sim.nombre)} ${FLECHA}</a><a class="btn blanco chico" href="${sim.guia[0]}">Leer la guía gratis</a></div></div>`
    : `<p class="tv-nota">Guías gratis en <a href="/learn/">Vorka Learn</a>: <a href="/learn/unam/examen-unam-por-area/">examen UNAM por área</a> · <a href="/learn/paa/que-es-la-paa/">qué es la PAA</a>.</p>`}
</section>
<section aria-labelledby="r-plan"><h2 id="r-plan">4. Tu plan de 30 días para decidir</h2>
  <div class="tv-plan">${PLAN_30.map(s => `<div><b>${esc(s.semana)}</b><ul>${s.tareas.map(t => `<li>${esc(reemplazar(t, ctx))}</li>`).join('')}</ul></div>`).join('')}</div>
</section>
<section aria-labelledby="r-preg"><h2 id="r-preg">5. Preguntas para platicar</h2>
  <div class="tv-dos"><div><h3>Con tu mamá, tu papá o tu orientador</h3><ul class="tv-l">${PREGUNTAS_FAMILIA.map(q => `<li>${esc(reemplazar(q, ctx))}</li>`).join('')}</ul></div>
  <div><h3>Con alguien que ya estudia o ejerce ${esc(carreras[0].n)}</h3><ul class="tv-l">${PREGUNTAS_PROFESIONAL.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div></div>
</section>
<section class="tv-no-imprimir" aria-labelledby="r-mas"><h2 id="r-mas">Comparte y regala</h2>
  <div class="tv-acciones" style="margin:0"><a class="btn blanco" href="${esc(share)}" target="_blank" rel="noopener">Mandar el test gratis por WhatsApp</a>${regalable ? `<a class="btn blanco" href="${RUTA}?regalo=1#regalar">🎁 Regalar el reporte a alguien</a>` : ''}</div>
</section>
<section aria-labelledby="r-base"><h2 id="r-base">Cómo leer este reporte</h2>
  <p class="tv-nota">Este test se basa en la teoría de intereses vocacionales de John L. Holland (seis tipos: Realista, Investigador, Artístico, Social, Emprendedor y Convencional). Las preguntas, el catálogo de carreras y los textos son de Vorka México. Tu puntaje combina intereses (65 %), habilidades que tú percibes (25 %) y preferencias (10 %). Es orientativo: no es una prueba psicométrica estandarizada ni un diagnóstico, y no sustituye la orientación de una o un profesional. Tus intereses pueden cambiar: vuelve a contestarlo en unos meses.</p>
  <p class="tv-nota">Orden ${esc(orden.id)} · Esta liga no vence; guárdala. ¿Quieres borrar tus respuestas? Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>
  ${PIE_ESCUELAS}
</section>
</div>
</div>`,
  });
}
const precioDe = p => pesosTexto(p.precio_centavos);

// ---------- panel de grupo (orientador) y liga para unirse ----------
export function panelGrupo({ orden, grupo, usados, filas, liga }) {
  const hechos = filas.filter(r => r.contestado);
  const comparten = hechos.filter(r => r.comparte);
  const cuenta = (fn) => { const m = new Map(); for (const r of comparten) for (const k of fn(r)) m.set(k, (m.get(k) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'es')); };
  const tipos1 = cuenta(r => [r.resumen.codigo?.[0]].filter(Boolean));
  const carreras = cuenta(r => r.resumen.top || []).slice(0, 10);
  const areas = cuenta(r => r.resumen.area ? [r.resumen.area] : []);
  const barra = (lista, nombre) => lista.length ? `<div class="tv-barras">${lista.map(([k, n]) => `<div class="tv-b" style="--c:var(--morado,#6b2a85)"><span>${esc(nombre(k))}</span><i><span style="width:${Math.round(n / comparten.length * 100)}%"></span></i><b class="num">${n}</b></div>`).join('')}</div>` : '<p class="tv-nota">Todavía no hay resultados compartidos.</p>';
  const msg = whatsapp(`Contesta el test vocacional de Vorka con esta liga (tu reporte completo ya está pagado): ${liga}`);
  return pagina({ titulo: 'Panel de grupo · Test vocacional Vorka', ruta: `${RUTA}panel/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Panel del grupo del Test vocacional Vorka.', head: head(), script: SCRIPT_IMPRIMIR,
    cuerpo: `<div class="tv tv-rep">
<section class="tv-hero"><div class="marco">
  <span class="tv-et">Licencias para grupo</span>
  <h1 class="tv-h1">Tu grupo: <em>${usados} de ${grupo.cupo}</em> lugares usados</h1>
  <p class="tv-lead">Comparte esta liga con tu grupo. Cada alumna o alumno escribe su nombre y su correo, contesta el test y recibe su reporte completo. Aquí ves los resultados de quienes acepten compartirlos contigo.</p>
  <div class="tv-tarjeta" style="margin-top:16px"><b>Liga para tu grupo</b><p style="word-break:break-all;margin:8px 0"><a href="${esc(liga)}">${esc(liga)}</a></p>
    <div class="tv-acciones tv-no-imprimir" style="margin:0"><a class="btn acento chico" href="${esc(msg)}" target="_blank" rel="noopener">Mandar por WhatsApp</a><button class="btn blanco chico" type="button" id="tv-imprimir">Imprimir este panel</button></div>
    <p class="tv-nota" style="margin:10px 0 0">Quien tenga la liga puede usar un lugar: compártela solo con tu grupo.</p></div>
</div></section>
<div class="marco">
<section><h2>Avance</h2><p>${usados} se unieron · ${hechos.length} ya contestaron · ${comparten.length} aceptaron compartir su resultado contigo.</p></section>
<section><h2>Tipo de interés principal</h2>${barra(tipos1, k => TIPOS[k]?.nombre || k)}</section>
<section><h2>Carreras que más aparecen (top 5 de cada quien)</h2>${barra(carreras, k => k)}</section>
<section><h2>Área UNAM más frecuente</h2>${barra(areas, k => AREAS_UNAM[k] || k)}</section>
<section><h2>Resultados compartidos</h2>${comparten.length ? `<div class="tv-tabla-w"><table class="tv-tabla"><thead><tr><th scope="col">Nombre</th><th scope="col">Código</th><th scope="col">Primeras carreras</th></tr></thead><tbody>${comparten.map(r => `<tr><td>${esc(r.nombre || '')}</td><td><b>${esc(r.resumen.codigo || '')}</b></td><td>${esc((r.resumen.top || []).slice(0, 3).join(', '))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="tv-nota">Nadie ha compartido su resultado todavía.</p>'}
  <p class="tv-nota">Solo aparecen quienes marcaron que aceptan compartir su resultado con quien compró la licencia. Es orientativo: no es una prueba psicométrica. Orden ${esc(orden.id)}.</p></section>
</div></div>`,
  });
}

export function paginaUnirse({ grupo, usados, de, error = '', ok = '' }) {
  const lleno = usados >= grupo.cupo;
  return pagina({ titulo: 'Únete a tu grupo · Test vocacional Vorka', ruta: `${RUTA}grupo/`, noindex: true, headers: SIN_REFERER, navActual: 'catalogo',
    descripcion: 'Contesta el Test vocacional Vorka con la licencia de tu grupo.', head: head(), status: error && !ok ? 400 : 200,
    cuerpo: `<div class="tv"><section class="tv-hero"><div class="marco" style="max-width:640px">
  <span class="tv-et">Test vocacional Vorka · Licencia de grupo</span>
  <h1 class="tv-h1">Tu reporte completo <em>ya está pagado</em></h1>
  <p class="tv-lead">${de ? `${esc(de)} te invitó a` : 'Te invitaron a'} contestar el test vocacional. Escribe tus datos, contesta (unos 10 minutos) y recibe tu reporte completo con 20 carreras y un plan de 30 días.</p>
  ${ok ? `<p class="tv-ok" role="status">${ok}</p>` : lleno ? '<p class="tv-error" role="alert">Esta licencia ya no tiene lugares. Pide a quien te la compartió que compre más.</p>' : `
  <form class="tv-form" method="post" action="${RUTA}grupo/${esc(grupo.codigo)}" style="margin-top:20px">
    ${error ? `<p class="tv-error" role="alert">${esc(error)}</p>` : ''}
    <div class="tv-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" required minlength="2" maxlength="120" autocomplete="name"></div>
    <div class="tv-campo"><label for="email">Tu correo</label><input id="email" name="email" type="email" required maxlength="254" autocomplete="email"><small class="tv-nota">Aquí te llega la liga de tu reporte.</small></div>
    <label class="tv-casilla"><input type="checkbox" name="comparte" value="on"><span>Acepto que quien me dio esta licencia (mi escuela u orientador) vea mi resultado: mi código y mis primeras carreras (opcional).</span></label>
    <label class="tv-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a> y el <a href="/privacidad/#tests" target="_blank">aviso de privacidad</a>. Si soy menor de edad, tengo permiso de mi mamá, papá o tutor.</span></label>
    <button class="btn acento" type="submit">Empezar mi test ${FLECHA}</button>
    <p class="tv-nota">Quedan ${grupo.cupo - usados} de ${grupo.cupo} lugares.</p>
  </form>`}
</div></section></div>`,
  });
}

// ---------- correo del resultado gratis ----------
export function correoResultadoVocacional(env, f) {
  const res = calcular(f.respuestas);
  const url = `${env.SITE_URL}${RUTA}resultado/${f.id}`;
  return {
    asunto: `Tu resultado del test vocacional: ${res.codigo}`,
    cuerpo: { codigo: res.codigo, tipos: res.tipos.slice(0, 3).map(t => `${TIPOS[t].nombre}: ${TIPOS[t].frase}`), carreras: res.carreras.slice(0, 5).map(c => c.n), url },
  };
}
export { CARRERAS, WHATSAPP };
