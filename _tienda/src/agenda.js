// Agenda (citas en línea para consultorios y negocios de servicios; cuarta app de Diversificación de Vorka México).
// /tienda/agenda/ → ficha comercial única: prueba de 7 días, plan mensual o anual por profesional, el paquete con Vuelve,
// comparación, preguntas y compra. Se cobra por suscripción (ver suscripciones.js). La app vive en agenda.vorka.mx (Vorka OS)
// y la página de reservas de cada negocio en vorka.mx/citas/<negocio> (→ os /con/<negocio>, ver index.js › citasPublico).
// Aquí solo se vende.
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, navTienda, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA, CHECK } from './marco.generado.js';

const APP = 'https://agenda.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_AGENDA = '/tienda/agenda/';
export const OG_AGENDA = 'https://vorka.mx/assets/tienda/agenda-og.png';
// Precio por profesional decidido por Dirección (25-10-2026): solo se usa si el plan aún no está a la venta
const PRECIO_BASE = 99;
const MAX_PROFESIONALES = 50;
// Planes: Agenda sola (por profesional) y el paquete con Vuelve (1 profesional y 1 sucursal incluidos). Cada uno con el
// complemento de su mismo intervalo: profesional adicional de Agenda y, en el paquete, sucursal adicional de Vuelve.
const PLANES = [
  { slug: 'agenda-mensual', prof: 'agenda-profesional-mensual', nombre: 'Agenda', periodo: 'Mensual', cada: 'al mes' },
  { slug: 'agenda-anual', prof: 'agenda-profesional-anual', nombre: 'Agenda', periodo: 'Anual', cada: 'al año', nota: '2 meses gratis' },
  { slug: 'agenda-vuelve-mensual', prof: 'agenda-profesional-mensual', suc: 'vuelve-sucursal-mensual', nombre: 'Agenda + Vuelve', periodo: 'Mensual', cada: 'al mes', paquete: true },
  { slug: 'agenda-vuelve-anual', prof: 'agenda-profesional-anual', suc: 'vuelve-sucursal-anual', nombre: 'Agenda + Vuelve', periodo: 'Anual', cada: 'al año', nota: '2 meses gratis', paquete: true },
];

// Lo que hoy hace Agenda (fase 1 en producción). Nada de lo que viene después va aquí.
const INCLUYE = ['Tu página de citas con tu logo, tu color y tu liga: vorka.mx/citas/tu-negocio', 'Confirmación al instante, o «yo confirmo cada cita» en los servicios que quieras',
  'Recordatorios por correo 24 h y 2 h antes, y «Recordar por WhatsApp» con el mensaje listo', 'Tus clientes cambian o cancelan desde su cita, hasta las horas antes que tú decidas',
  'Horario por profesional con pausas (como la comida) y días bloqueados', 'Servicios presenciales o por videollamada, con descanso entre citas y precio informativo',
  'Servicios privados con clave, para pacientes de seguimiento o convenios', 'Clientes con su historial, sus faltas y tus notas privadas', 'QR listo para imprimir y aviso de privacidad para tus clientes'];
// Comparación: precios publicados en la página oficial de cada producto (investigación del 25-10-2026, PLAN-AGENDA.md › 1)
const COMPARA = [
  ['Calendly', 'US$10–12 por usuario (≈ $184–221 MXN)', 'Se cobra en dólares y está pensado para agendar reuniones.'],
  ['AgendaPro', '$299 (1 profesional)', 'El WhatsApp se paga aparte: desde $100 por 50 mensajes.'],
  ['Booksy', '$499', 'Más $100 por cada miembro del equipo.'],
];
const GIROS = [
  ['medico', 'Consultorios médicos', 'Consulta general, seguimiento y consulta por videollamada.'], ['psicologia', 'Psicología y terapia', 'Primera sesión, sesión individual, de pareja o en línea.'],
  ['nutricion', 'Nutrición', 'Primera consulta y seguimientos, en tu consultorio o por videollamada.'], ['dental', 'Dentistas', 'Valoración, limpieza, resinas y revisiones de ortodoncia.'],
  ['fisio', 'Fisioterapia', 'Valoración, sesiones y masaje terapéutico con su descanso entre citas.'], ['barberia', 'Barberías', 'Corte, corte y barba, arreglo de barba: cada barbero con su horario.'],
  ['salon', 'Estéticas y salones', 'Corte, tinte, peinado y uñas, con la duración real de cada servicio.'], ['asesoria', 'Asesorías', 'Legal, contable o de negocio: primera asesoría y revisión de documentos.'],
];
const faq = ({ dias = 7, precioProf = PRECIO_BASE } = {}) => [
  ['¿Puedo probar antes de pagar?', `Sí. Armas tu agenda en <a href="${APP}/">agenda.vorka.mx</a> en unos minutos y la usas completa ${dias} días, sin tarjeta. Si te sirve, te suscribes con el mismo correo y todo sigue igual; si no, no pasa nada.`],
  ['¿Mis clientes tienen que descargar una app o crear una cuenta?', 'No. Abren tu liga, eligen el servicio, con quién, el día y la hora, y dejan su nombre y su WhatsApp. El correo es opcional. Su cita queda confirmada al instante y les damos su liga para agregarla a su calendario, ver cómo llegar, cambiarla o cancelarla.'],
  ['¿Cómo les llegan los recordatorios?', 'Si dejaron su correo, les llega su confirmación y un recordatorio 24 horas y 2 horas antes. Además, en tu panel cada cita tiene el botón «Recordar por WhatsApp»: abre WhatsApp en tu celular con el mensaje ya escrito y lo mandas tú, desde tu número, sin costo por mensaje. Agenda todavía no manda mensajes de WhatsApp automáticos.'],
  ['¿Y si alguien ya no puede venir?', 'Desde su cita puede cambiar de hora o cancelar, hasta las horas antes que tú decidas (12 por omisión). A ti te llega un correo con el cambio y el lugar queda libre para alguien más.'],
  ['¿Qué pasa con quien no llega?', 'Marcas «no vino» y queda en su ficha. Si quieres, a quien acumule 2 faltas le pides confirmación: sus siguientes citas quedan por confirmar hasta que tú las aceptes.'],
  ['¿Puedo revisar cada cita antes de aceptarla?', 'Sí. En cada servicio eliges entre confirmar al instante o «yo confirmo cada cita». También puedes hacer un servicio privado con clave, para que solo lo agende quien tú quieras.'],
  ['¿Sirve para consultas por videollamada?', 'Sí. Marcas el servicio como videollamada y pones tu liga; tu cliente la ve solo cuando su cita está confirmada.'],
  ['¿Qué cuenta como profesional?', 'Cada persona que recibe citas con su propio horario: tú, tu socia, cada barbero. Tu plan incluye uno y cada profesional adicional se suma al mismo precio. En la prueba puedes tener hasta 3 para probar con tu equipo.'],
  ['¿Cuánto cuesta y cómo pago?', `$${precioProf} al mes por profesional, o el plan anual con 2 meses gratis. En pesos mexicanos con IVA incluido. Pagas con tarjeta de crédito o débito, procesado por Stripe, y se renueva solo. Agregas o quitas profesionales desde Agenda › Cuenta y Stripe cobra solo la parte proporcional. Tu comprobante de cada cobro lo descargas en Agenda › Cuenta › Administrar mi suscripción. Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales dentro del mismo mes del cobro.`],
  ['¿Agenda cobra las citas?', 'No. El precio que pones en cada servicio es informativo: tu cliente te paga en tu negocio, como siempre. Vorka no cobra comisión por cita.'],
  ['¿Se conecta con mi calendario?', 'Tus clientes agregan su cita a su calendario con un botón (Google Calendar o archivo .ics). Tu agenda la ves en Agenda, por día y por semana para cada profesional. Por ahora no se sincroniza con el calendario de cada profesional.'],
  ['¿Qué incluye el paquete con Vuelve?', 'Las dos apps con la misma cuenta y el mismo correo: Agenda para tus citas y Vuelve, la tarjeta de lealtad en el celular de tus clientes. Incluye 1 profesional de Agenda y 1 sucursal de Vuelve; lo adicional se suma con el precio de cada app. Además, cada cita que marcas como «vino» le suma la visita en su tarjeta de Vuelve, sola: el cliente la pide al reservar (o ya la tiene) y no escaneas nada.'],
  ['¿Qué pasa con los datos de mis clientes?', 'Son tuyos. Vorka solo los guarda por tu cuenta para darte el servicio: no los vende ni los usa para publicidad. En cada reserva tus clientes ven y aceptan un aviso de privacidad.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Agenda › Cuenta, sin llamadas. Tu agenda sigue activa hasta el final del periodo que pagaste. Después queda en pausa: tu página ya no recibe citas, pero tus citas y tus clientes se quedan guardados por si vuelves.'],
];

// ---------- identidad de Agenda (la de la app: la familia de Vorka —tinta, marfil, morado y oro— y la palabra "agenda") ----------
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'), cel: ico('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>'),
  cal: ico('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4-4"/>'), campana: ico('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  equipo: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2"/>'), escudo: ico('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  vuelta: ico('<path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/>'), qr: ico('<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18.5 14h2"/>'),
  liga: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), sello: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/>'),
};
// Un ícono por giro (trazos simples, sin marcas)
const ICONO_GIRO = {
  medico: ico('<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>'), psicologia: ico('<path d="M12 21v-3M7 18h10M9 3.5a6 6 0 0 0-3 10.5c.8.7 1 1.5 1 2.5v1.5h10V16c0-1 .3-1.8 1-2.5A6 6 0 0 0 15 3.5"/><path d="M12 7v4M10 9h4"/>'),
  nutricion: ico('<path d="M12 7c-3-3-8-1-8 4 0 5 4 10 8 10s8-5 8-10c0-5-5-7-8-4z"/><path d="M12 7c0-2 1-4 3-4"/>'), dental: ico('<path d="M7 3.5c-2.5 0-3.5 2-3.5 4.5 0 3 1.5 4 2 7 .4 2.7 1 6 2.5 6s1.8-4 4-4 2.5 4 4 4 2.1-3.3 2.5-6c.5-3 2-4 2-7 0-2.5-1-4.5-3.5-4.5-2 0-3 1-5 1s-3-1-5-1z"/>'),
  fisio: ico('<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M8 10l4-1 4 1M9 21l3-7 3 7"/>'), barberia: ico('<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 18M8 16.5L20 6"/>'),
  salon: ico('<path d="M7 21V11a5 5 0 0 1 10 0v10"/><path d="M9.5 11V8M14.5 11V8M12 11V6.5"/>'), asesoria: ico('<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3.5 12.5h17"/>'),
};

// La página de reservas de un negocio de ejemplo, como la ven sus clientes en el celular (réplica de vorka.mx/citas/<negocio>)
const DIAS = [['Lun', 3], ['Mar', 4], ['Mié', 5], ['Jue', 6], ['Vie', 7]];
const HORAS = ['9:00', '9:30', '10:30', '11:00', '12:30', '13:00', '16:00', '16:30', '17:30'];
const reserva = () => `<div class="ag-res">
  <div class="ag-res-cab"><span class="ag-res-lg">A</span><span><b>Nutrición Ana Ruiz</b><small>Nutrición</small></span></div>
  <p class="ag-res-paso"><i>1</i>Consulta de seguimiento · 30 min <span>Cambiar</span></p>
  <p class="ag-res-paso"><i>2</i>Con Ana Ruiz <span>Cambiar</span></p>
  <p class="ag-res-t"><i>3</i>¿Qué día y a qué hora?</p>
  <div class="ag-res-dias">${DIAS.map(([d, n], k) => `<span${k === 1 ? ' class="sel"' : ''}><small>${d}</small>${n}</span>`).join('')}</div>
  <div class="ag-res-horas">${HORAS.map((h, k) => `<span${k === 2 ? ' class="sel"' : ''}>${h}</span>`).join('')}</div>
  <span class="ag-res-btn">Agendar mi cita</span>
</div>`;
// "Tu día" en el panel del negocio (Hoy): ✓ vino, ✗ no vino y recordar por WhatsApp
const DIA = [['9:00', 'Laura Méndez', 'Primera consulta', 'vino'], ['10:30', 'Jorge Salas', 'Seguimiento', 'vino'], ['12:30', 'Mariana Cruz', 'Seguimiento', ''], ['16:00', 'Pedro Ávila', 'Primera consulta', '']];
const tuDia = () => `<div class="ag-dia" role="img" aria-label="Ejemplo de tu día en Agenda">
  <div class="ag-dia-cab"><small>Ejemplo · hoy</small><b>4 citas</b></div>
  ${DIA.map(([h, n, s, e]) => `<div class="ag-dia-f${e ? ' hecha' : ''}"><span class="h">${h}</span><span class="t"><b>${n}</b><small>${s} · Ana Ruiz</small></span>${e ? '<span class="vino">✓ Vino</span>' : '<span class="acc"><i>✓</i><i>✗</i><i class="wa">WhatsApp</i></span>'}</div>`).join('')}
</div>`;

export async function paginaAgenda(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug), profesional: await productoPorSlug(env, x.prof), sucursal: x.suc ? await productoPorSlug(env, x.suc) : null })))).filter(x => x.prod);
  if (planes[0] && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: planes[0].prod.id, ref_code: code });
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : planes[0]?.slug;
  const error = url.searchParams.get('error') || '';
  // Desde la app (Suscribirme) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  // y cuántos profesionales usa ya (1 incluido) y, si viene del paquete, sus sucursales de Vuelve adicionales
  const profesionales = Math.min(MAX_PROFESIONALES, Math.max(1, parseInt(url.searchParams.get('profesionales') || '1', 10) || 1));
  const sucursales = Math.min(20, Math.max(0, parseInt(url.searchParams.get('sucursales') || '0', 10) || 0));
  const de = slug => planes.find(x => x.slug === slug);
  const mensual = de('agenda-mensual'), anual = de('agenda-anual'), paqM = de('agenda-vuelve-mensual'), paqA = de('agenda-vuelve-anual');
  const precioProf = mensual ? mensual.prod.precio_centavos / 100 : PRECIO_BASE;
  // El ahorro del paquete: contra Agenda + Vuelve por separado, con los precios de la tienda (solo si los dos están a la venta)
  const vuelveM = paqM && mensual ? await productoPorSlug(env, 'vuelve-mensual') : null;
  const separado = vuelveM ? mensual.prod.precio_centavos + vuelveM.precio_centavos : null;
  const ahorro = separado && separado > paqM.prod.precio_centavos ? separado - paqM.prod.precio_centavos : null;
  const nuevo = `${APP}/#/nuevo`;
  const FAQ = faq({ precioProf });
  const rs = planes.length ? await resenasDe(env, RUTA_AGENDA) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Agenda · Citas en línea para consultorios y negocios de servicios', brand: { '@type': 'Brand', name: 'Agenda' },
    description: 'Tu página de citas: tus clientes eligen servicio, profesional, día y hora, y su cita queda confirmada al instante. Recordatorios, cambios y cancelaciones solos. Prueba 7 días gratis.',
    image: [OG_AGENDA], url: `https://vorka.mx${RUTA_AGENDA}`,
    ...(planes.length ? { offers: ofertas({ ruta: RUTA_AGENDA, centavos: planes.map(x => x.prod.precio_centavos),
      detalle: planes.map(x => ({ centavos: x.prod.precio_centavos, name: `${x.nombre} · plan ${x.periodo.toLowerCase()}` })) }), ...ldResenas(rs) } : {}) },
  migas('Agenda', RUTA_AGENDA),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const datos = Object.fromEntries(planes.map(x => [x.slug, { p: x.prod.precio_centavos, pr: x.profesional?.precio_centavos ?? null, s: x.sucursal?.precio_centavos ?? null, cada: x.cada, paquete: !!x.paquete }]));
  // Tarjeta de precio de una línea (Agenda o el paquete): el mensual en grande y el anual abajo
  const plan = (m, a, { titulo, para, lista, rec = false }) => m || a ? `<article class="ag-plan${rec ? ' rec' : ''}">${a ? '<span class="ag-sello">Anual: 2 meses gratis</span>' : ''}<h3>${titulo}</h3><p class="ag-para">${para}</p>
      <p class="ag-precio"><b>${precio((m || a).prod)}</b> <small>${(m || a).cada}${(m || a).paquete ? '' : ' por profesional'}</small></p>
      ${m && a ? `<p class="ag-anual">o ${precio(a.prod)} al año${a.paquete ? '' : ' por profesional'}</p>` : ''}
      <ul>${lista.map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
      <a class="ag-btn${rec ? '' : ' ghost oscuro'}" href="?plan=${(m || a).slug}#comprar" data-plan="${(m || a).slug}">Suscribirme</a></article>` : '';
  const res = pagina({ navActual: 'catalogo', navOscuro: true, entrar: { url: `${APP}/`, app: 'Agenda' },
    titulo: 'Agenda: citas en línea para consultorios y negocios | Prueba 7 días gratis', ruta: RUTA_AGENDA, imagen: OG_AGENDA,
    descripcion: `Tu página de citas en línea: tus clientes reservan servicio, día y hora, y los recordatorios salen solos. $${precioProf} al mes por profesional. Prueba 7 días gratis.`,
    head: `<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="ag">
<section class="ag-hero"><div class="marco ag-hero-g">
  <div class="ag-hero-txt">
    <span class="ag-marca"><span>agenda</span></span>
    <h1 class="ag-h1">Tus clientes <em>agendan solos.</em></h1>
    <p class="ag-lead">Tu página de citas en línea. Tus clientes eligen el servicio, con quién, el día y la hora, y su cita queda confirmada al instante. Tú ves tu día en el celular, marcas quién vino y los recordatorios salen solos.</p>
    <div class="ag-ctas"><a class="ag-btn" href="${esc(nuevo)}">Pruébala 7 días gratis ${FLECHA}</a><a class="ag-btn ghost" href="#planes">Ver precios</a></div>
    <p class="t-ya">¿Ya tienes cuenta? <a href="${APP}/">Entra en agenda.vorka.mx</a></p>
    <ul class="ag-chips"><li>${ICONO.check}Sin tarjeta para probar</li><li>${ICONO.cel}Sin app para tus clientes</li><li>${ICONO.reloj}Lista en minutos</li></ul>
  </div>
  <div class="ag-escena" aria-hidden="true">
    <div class="ag-cel"><i class="ag-isla"></i><div class="ag-pantalla"><p class="ag-url">vorka.mx/citas/nutricion-ana-ruiz</p>${reserva()}</div></div>
    <div class="ag-noti"><span class="ag-noti-ic">${ICONO.cal}</span><span><b>Cita nueva <small>correo</small></b>Laura Méndez · martes 4, 10:30 · Consulta de seguimiento</span></div>
  </div>
</div>
${navTienda('citas')}
</section>

<section class="ag-sec" id="para-quien"><div class="marco">
  <div class="ag-cab"><span class="ag-et">Para quién es</span><h2>Para quien vive de su agenda.</h2><p>Consultorios y negocios de servicios donde cada cita cuenta. Al empezar eliges tu giro y Agenda te sugiere los servicios con su duración; tú pones tus precios.</p></div>
  <ul class="ag-giros">${GIROS.map(([g, t, d]) => `<li>${ICONO_GIRO[g]}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="ag-sec ag-osc"><div class="marco">
  <div class="ag-cab"><span class="ag-et">Cómo funciona</span><h2>Lista hoy. Desde tu celular.</h2></div>
  <ol class="ag-pasos">${[['Arma tu agenda', 'Tus servicios con su duración, tu horario con la pausa de la comida y, si son varios, cada profesional con el suyo.'], ['Comparte tu liga', 'vorka.mx/citas/tu-negocio en tu WhatsApp, tu Instagram y en un QR impreso en tu mostrador.'],
    ['Tus clientes agendan solos', 'Eligen servicio, con quién, día y hora. Su cita queda confirmada y les llegan sus recordatorios.'], ['Tú atiendes', 'Ves tu día, marcas quién vino y quién no, y le recuerdas por WhatsApp con un toque a quien haga falta.']].map(([t, d], k) => `<li><span class="ag-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="ag-sec"><div class="marco ag-dos">
  <div class="ag-cab izq"><span class="ag-et">Lo que te quita de encima</span><h2>Menos llamadas. Menos faltas.</h2><p>Deja de contestar «¿tienes lugar mañana?» a cada rato. Tu página ofrece solo las horas libres de verdad y nadie te aparta dos veces la misma hora.</p>
    ${tuDia()}</div>
  <ul class="ag-ben">${[[ICONO.cal, 'Confirmada al instante', 'Tu cliente elige una hora libre y su cita queda hecha. Si prefieres revisarlas, «yo confirmo cada cita».'],
    [ICONO.campana, 'Recordatorios que salen solos', 'Por correo, 24 h y 2 h antes. Y «Recordar por WhatsApp» con el mensaje listo, desde tu número.'],
    [ICONO.vuelta, 'Cambios sin llamadas', 'Tu cliente cambia de hora o cancela desde su cita, hasta las horas antes que tú decidas. El lugar se libera solo.'],
    [ICONO.equipo, 'Cada profesional, su horario', 'Pausas, días bloqueados y los servicios que da cada quien. «El primero disponible» para quien no tiene preferencia.'],
    [ICONO.escudo, 'Faltas a la vista', 'Quien no llega queda marcado en su ficha. A quien acumula 2 faltas le pides confirmación.'],
    [ICONO.qr, 'Tu liga y tu QR', 'Con tu logo y tu color. Si cambias tu liga, la anterior sigue funcionando.']].map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="ag-sec suave" id="incluye"><div class="marco ag-dos">
  <div class="ag-cab izq"><span class="ag-et">Qué incluye</span><h2>Lo que necesitas para que te agenden en línea.</h2><p>Un solo plan con todo, por cada profesional que recibe citas. Sin comisiones por cita y sin costo por mensaje.</p></div>
  <ul class="ag-incluye">${INCLUYE.map(i => `<li>${CHECK}<span>${esc(i)}</span></li>`).join('')}</ul>
</div></section>

<section class="ag-sec" id="compara"><div class="marco">
  <div class="ag-cab"><span class="ag-et">Compara</span><h2>Hecha para México, con un precio claro.</h2><p>Lo que cuesta al mes cada producto para una persona que atiende citas.</p></div>
  <div class="ag-tabla-c"><table class="ag-tabla">
    <thead><tr><th scope="col">Producto</th><th scope="col">Precio al mes</th><th scope="col">Lo que hay que saber</th></tr></thead>
    <tbody><tr class="nos"><th scope="row"><span class="ag-marca-t">agenda</span></th><td><b>$${precioProf.toLocaleString('es-MX')} por profesional</b></td><td>En pesos y con IVA incluido. Recordatorios por correo y WhatsApp con un toque, sin costo por mensaje.</td></tr>
      ${COMPARA.map(([n, p, d]) => `<tr><th scope="row">${n}</th><td>${p}</td><td>${d}</td></tr>`).join('')}</tbody></table></div>
  <p class="ag-nota">Precios publicados en la página oficial de cada producto, consultados el 25 de octubre de 2026. Pueden cambiar; revísalos antes de decidir. Las marcas mencionadas son de sus dueños.</p>
</div></section>

<section class="ag-sec ag-osc" id="paquete"><div class="marco ag-paq">
  <div class="ag-cab izq"><span class="ag-et">Agenda + Vuelve</span><h2>Que lleguen. Y que vuelvan.</h2>
    <p>Con el paquete tienes las dos apps con la misma cuenta y el mismo correo: Agenda para tus citas y Vuelve, la tarjeta de lealtad en el celular de tus clientes.${paqM ? ` Por ${precio(paqM.prod)} al mes${ahorro ? `, ${(ahorro / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} menos que por separado` : ''}.` : ''}</p>
    <ul class="ag-paq-l">${['Una sola suscripción y un solo cobro', '1 profesional de Agenda y 1 sucursal de Vuelve incluidos', 'Lo adicional, con el precio de cada app'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
    ${paqM || paqA ? `<div class="ag-ctas"><a class="ag-btn" href="?plan=${(paqM || paqA).slug}#comprar" data-plan="${(paqM || paqA).slug}">Quiero el paquete ${FLECHA}</a><a class="ag-btn ghost" href="/tienda/vuelve/">Conoce Vuelve</a></div>` : '<div class="ag-ctas"><a class="ag-btn ghost" href="/tienda/vuelve/">Conoce Vuelve</a></div>'}</div>
  <div class="ag-pronto"><span class="ag-pill">Solo en el paquete</span>
    <div class="ag-pronto-v" aria-hidden="true"><span class="ag-pronto-a">✓ Vino</span><span class="ag-pronto-f">${FLECHA}</span><span class="ag-pronto-s">${ICONO.sello}<b>+1 sello</b></span></div>
    <h3>Cada cita a la que llega tu cliente le suma un sello solo.</h3>
    <p>Marcas «vino» en Agenda y la visita se suma sola en la tarjeta de Vuelve de tu cliente, sin escanear nada. Al reservar, tu cliente puede pedir su tarjeta; a quien ya la tiene se le suma solo. <b>¿Te equivocaste?</b> Deshacer también quita el sello.</p></div>
</div></section>

<section class="ag-sec suave" id="planes"><div class="marco">
  <div class="ag-cab"><span class="ag-et">Precios</span><h2>Pruébala 7 días. Después, pagas por profesional.</h2><p>En pesos mexicanos con IVA incluido. Sin comisiones por cita ni costo por mensaje. Cancela cuando quieras.</p></div>
  <div class="ag-planes">
    <article class="ag-plan"><h3>Prueba</h3><p class="ag-para">Todo Agenda, 7 días</p><p class="ag-precio"><b>$0</b></p>
      <ul>${['Sin tarjeta', 'Todas las funciones', 'Hasta 3 profesionales para probar con tu equipo', 'Si decides seguir, todo se queda como lo dejaste'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="ag-btn ghost oscuro" href="${esc(nuevo)}">Empezar gratis</a></article>
    ${plan(mensual, anual, { titulo: 'Agenda', para: '1 profesional incluido', rec: true,
      lista: ['Todo lo que incluye Agenda', 'Tu página de citas y tu QR', `Profesional adicional: ${mensual?.profesional ? `${precio(mensual.profesional)} al mes` : anual?.profesional ? `${precio(anual.profesional)} al año` : 'al mismo precio'}`] })}
    ${plan(paqM, paqA, { titulo: 'Agenda + Vuelve', para: '1 profesional y 1 sucursal de Vuelve',
      lista: ['Agenda y Vuelve con la misma cuenta', separado && paqM ? `Por separado: ${precio({ precio_centavos: separado })} al mes` : 'Una sola suscripción', `Sucursal de Vuelve adicional: ${paqM?.sucursal ? `${precio(paqM.sucursal)} al mes` : 'con el precio de Vuelve'}`, 'Sello automático en cada cita'] })}
  </div>
  ${planes.length ? '' : `<p class="ag-nota" style="text-align:center">La suscripción abre muy pronto. Mientras, <a href="${esc(nuevo)}">empieza tu prueba gratis</a>.</p>`}
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Agenda', intro: `¿Aún no la pruebas? <a href="${esc(nuevo)}">Empieza gratis 7 días</a>, sin tarjeta. Si ya la estás probando, suscríbete con el mismo correo y tu agenda sigue tal cual.`,
  pasos: [['Eliges tu plan', 'Agenda o el paquete con Vuelve, mensual o anual, y cuántos profesionales atienden.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Te llega tu acceso por correo', 'Con el mismo correo de tu prueba, todo sigue igual.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-agenda" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">Plan</label><select id="slug" name="slug">${planes.map(x => `<option value="${esc(x.slug)}"${elegido === x.slug ? ' selected' : ''}>${x.nombre} · ${x.periodo} · ${precio(x.prod)} ${x.cada}${x.nota ? ` (${x.nota})` : ''}</option>`).join('')}</select></div>
    <div class="t-campo"><label for="profesionales">Profesionales que reciben citas</label><input id="profesionales" name="profesionales" type="number" inputmode="numeric" min="1" max="${MAX_PROFESIONALES}" value="${profesionales}"><small class="t-ayuda">Tu plan incluye 1. Cada profesional de más se suma al mismo precio; puedes cambiarlo después desde Agenda › Cuenta.</small></div>
    <div class="t-campo" id="campo-sucursales"><label for="sucursales">Sucursales adicionales de Vuelve</label><input id="sucursales" name="sucursales" type="number" inputmode="numeric" min="0" max="20" value="${sucursales}"><small class="t-ayuda">Solo en el paquete Agenda + Vuelve: incluye 1 sucursal y cada una de más se suma con el precio de Vuelve.</small></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo de tu agenda para que todo siga igual.</small></div>
    <p class="ag-total">Pagas hoy <b id="ag-total">${precio(de(elegido)?.prod || planes[0].prod)}</b> <span id="ag-cada"></span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/agenda/" target="_blank">condiciones de Agenda</a> (incluida la renovación automática) y el <a href="/legal/agenda/privacidad/" target="_blank">aviso de privacidad de Agenda</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="ag-precios">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/agenda/">Condiciones de Agenda</a> · <a href="/legal/agenda/privacidad/">Aviso de privacidad</a> · <a href="https://agenda.vorka.mx/citas/privacidad-clientes">Privacidad para clientes de cada negocio</a> · Agenda · Powered by vorka.mx</p>' })}
${await masTienda(env, 'negocios')}
</div>`,
  });
  return res;
}

const CSS = `
.ag{--ag-tinta:#0f0d10;--ag-morado:#6b2a85;--ag-morado-c:#c59bd9;--ag-oro:#c8a45c;--ag-crema:#f4f2f5;font-family:'Inter Tight','Inter',system-ui,-apple-system,sans-serif}
[data-tema="oscuro"] .ag{--ag-morado:#c59bd9}
.ag-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--fg);color:var(--bg);font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 10px 26px -12px rgba(20,17,20,.5);transition:transform .2s var(--ease),background .2s}
.ag-btn:hover{transform:translateY(-1px)}.ag-hero .ag-btn:not(.ghost),.ag-osc .ag-btn:not(.ghost){background:var(--ag-crema);color:var(--ag-tinta);box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}.ag-hero .ag-btn:not(.ghost):hover,.ag-osc .ag-btn:not(.ghost):hover{background:#fff}.ag-btn svg{width:17px;height:17px}
.ag-btn.ghost{background:rgba(255,255,255,.06);color:var(--ag-crema);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.ag-btn.ghost:hover{background:rgba(255,255,255,.12)}
.ag-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.ag-btn.ghost.oscuro:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* portada */
.ag-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-104px;padding:140px 0 26px;background:var(--ag-tinta);color:var(--ag-crema)}
.ag-hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(55% 70% at 80% 30%,rgba(107,42,133,.38),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(200,164,92,.1),transparent 70%)}
.ag-hero-g{display:grid;gap:40px;align-items:center;padding-bottom:30px}.ag-hero-g>*{min-width:0}
@media(min-width:960px){.ag-hero-g{grid-template-columns:1.05fr .95fr}}
.ag-marca{display:inline-flex;align-items:center;font-weight:700;font-size:30px;letter-spacing:-.05em;color:var(--ag-crema)}.ag-marca span{margin-top:-3px}
.ag-h1{font-weight:800;font-size:clamp(42px,6.6vw,80px);line-height:.98;letter-spacing:-.05em;margin:26px 0 0;max-width:11ch;text-wrap:balance}.ag-h1 em{font-style:normal;color:var(--ag-morado-c)}
.ag-lead{margin-top:20px;font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:rgba(244,242,245,.76);max-width:33em}
.ag-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.ag-chips{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14.5px;color:rgba(244,242,245,.7)}
.ag-chips li{display:inline-flex;align-items:center;gap:7px}.ag-chips svg{width:18px;height:18px;color:var(--ag-morado-c)}
.ag-hero .t-nav-tienda{margin-top:8px}.ag-hero .t-nav-tienda a{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:rgba(244,242,245,.8)}.ag-hero .t-nav-tienda a[aria-current]{background:var(--ag-crema);border-color:var(--ag-crema);color:var(--ag-tinta)}
.ag-hero>.t-nav-tienda{width:min(100% - 32px,1180px);margin:0 auto}
/* el celular con la página de reservas abierta */
.ag-escena{position:relative;justify-self:center;width:min(100%,360px);padding:10px 0 74px}
.ag-cel{position:relative;border-radius:54px;padding:12px;background:#0a0a0a;box-shadow:0 0 0 2px #2a2a2a,0 50px 90px -40px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.06)}
.ag-isla{position:absolute;top:22px;left:50%;width:96px;height:28px;border-radius:20px;background:#000;transform:translateX(-50%);z-index:2}
.ag-pantalla{border-radius:43px;overflow:hidden;background:#fbfaf8;padding:58px 14px 18px;height:600px;position:relative;color:#141114}
.ag-url{margin:0 0 12px;padding:7px 12px;border-radius:12px;background:#efece8;color:#5f5b60;font:12.5px/1.2 -apple-system,'Inter',sans-serif;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ag-res{font-family:-apple-system,'Inter',system-ui,sans-serif;font-size:13.5px}
.ag-res-cab{display:flex;align-items:center;gap:10px;margin:4px 0 14px}.ag-res-cab b{display:block;font-size:17px;letter-spacing:-.02em}.ag-res-cab small{color:#6b676c;font-size:12.5px}
.ag-res-lg{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#155e63;color:#fff;font:700 19px/1 'Inter Tight',sans-serif}
.ag-res-paso,.ag-res-t{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:10px 12px;border-radius:14px;background:#fff;border:1px solid #ebe8e3;font-weight:600}
.ag-res-paso span{margin-left:auto;color:#155e63;font-weight:600;font-size:12px}.ag-res-t{background:none;border:0;padding:8px 2px 4px;font-size:15px}
.ag-res i{display:grid;place-items:center;flex:none;width:21px;height:21px;border-radius:50%;background:#141114;color:#fff;font:700 11px/1 sans-serif;font-style:normal}
.ag-res-dias{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:6px 0 10px}.ag-res-dias span{display:grid;justify-items:center;padding:7px 0;border-radius:12px;background:#fff;border:1px solid #ebe8e3;font-weight:700;font-size:16px}
.ag-res-dias small{font-size:10.5px;font-weight:600;color:#6b676c}.ag-res-dias .sel,.ag-res-horas .sel{background:#155e63;border-color:#155e63;color:#fff}.ag-res-dias .sel small{color:rgba(255,255,255,.8)}
.ag-res-horas{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.ag-res-horas span{padding:9px 0;border-radius:12px;text-align:center;background:#fff;border:1px solid #ebe8e3;font-weight:600}
.ag-res-btn{display:block;margin-top:14px;padding:13px 0;border-radius:14px;background:#155e63;color:#fff;text-align:center;font-weight:700;font-size:15px}
.ag-noti{position:absolute;left:-36px;right:24px;bottom:0;display:flex;gap:11px;align-items:flex-start;padding:12px 14px;border-radius:22px;background:rgba(244,242,245,.92);color:#111;font:14px/1.35 -apple-system,'Inter Tight',sans-serif;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 24px 50px -20px rgba(0,0,0,.7)}
.ag-noti b{display:flex;justify-content:space-between;gap:8px;font-weight:650}.ag-noti b small{font-weight:400;color:#6b6b6b}
.ag-noti-ic{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:10px;background:var(--ag-tinta);color:var(--ag-crema)}.ag-noti-ic svg{width:21px;height:21px}
@media(max-width:600px){.ag-noti{left:-6px;right:-6px}.ag-pantalla{height:560px}}
/* secciones */
.ag-sec{padding:clamp(56px,8vw,104px) 0}.ag-sec.suave{background:var(--bg-2)}
.ag-osc{background:var(--ag-tinta);color:var(--ag-crema)}
.ag-cab{max-width:680px;margin:0 auto 38px;text-align:center}.ag-cab.izq{text-align:left;margin:0}
.ag-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ag-morado)}.ag-osc .ag-et{color:var(--ag-morado-c)}
.ag-cab h2{font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.02;letter-spacing:-.045em;margin:10px 0 0;text-wrap:balance}
.ag-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}.ag-osc .ag-cab p{color:rgba(244,242,245,.72)}
.ag-giros{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.ag-giros li{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.ag-giros svg,.ag-ben svg{width:40px;height:40px;padding:9px;border-radius:12px;background:color-mix(in srgb,var(--ag-morado) 12%,transparent);color:var(--ag-morado)}
.ag-giros b,.ag-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:12px}.ag-giros p,.ag-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.ag-pasos{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.ag-pasos li{padding:24px;border-radius:24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.ag-num{display:block;font-weight:800;font-size:15px;color:var(--ag-morado-c);letter-spacing:.04em}.ag-pasos b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:18px}.ag-pasos p{margin:6px 0 0;color:rgba(244,242,245,.7);line-height:1.5}
.ag-dos{display:grid;gap:40px;align-items:start}@media(min-width:980px){.ag-dos{grid-template-columns:.95fr 1.05fr}}
.ag-ben{list-style:none;padding:0;margin:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.ag-ben li{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
/* tu día (panel Hoy) */
.ag-dia{margin-top:28px;padding:18px;border-radius:24px;background:var(--ag-tinta);color:var(--ag-crema);box-shadow:var(--sombra-2);display:grid;gap:8px}
.ag-dia-cab{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}.ag-dia-cab small{color:rgba(244,242,245,.55);font-size:12.5px}.ag-dia-cab b{font-size:15px}
.ag-dia-f{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.ag-dia-f .h{font-weight:700;font-variant-numeric:tabular-nums;width:44px;flex:none}.ag-dia-f .t{min-width:0;flex:1}.ag-dia-f .t b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ag-dia-f .t small{color:rgba(244,242,245,.6);font-size:12.5px}
.ag-dia-f .vino{flex:none;font-size:12.5px;font-weight:700;color:#9fd8b8}.ag-dia-f.hecha{opacity:.72}
.ag-dia-f .acc{display:flex;gap:5px;flex:none}.ag-dia-f .acc i{display:grid;place-items:center;min-width:30px;height:30px;padding:0 8px;border-radius:10px;background:rgba(255,255,255,.1);font-style:normal;font-weight:700;font-size:12.5px}.ag-dia-f .acc .wa{background:rgba(197,155,217,.18);color:var(--ag-morado-c)}
@media(max-width:420px){.ag-dia-f .acc .wa{display:none}}
/* qué incluye */
.ag-incluye{list-style:none;padding:0;margin:0;display:grid;gap:10px}.ag-incluye li{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border-radius:16px;background:var(--card);border:1px solid var(--line);font-size:15.5px;line-height:1.45}
.ag-incluye svg{flex:none;width:19px;height:19px;margin-top:2px;color:var(--ag-morado)}
/* comparación */
.ag-tabla-c{overflow-x:auto;border-radius:22px;border:1px solid var(--line);background:var(--card)}
.ag-tabla{width:100%;min-width:560px;border-collapse:collapse;font-size:15.5px}.ag-tabla th,.ag-tabla td{padding:16px 18px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
.ag-tabla thead th{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--fg-2);font-weight:700}.ag-tabla tbody tr:last-child>*{border-bottom:0}
.ag-tabla tbody th{font-weight:700;white-space:nowrap}.ag-tabla td{color:var(--fg-2)}.ag-tabla .nos{background:color-mix(in srgb,var(--ag-morado) 8%,transparent)}.ag-tabla .nos td{color:var(--fg)}
.ag-marca-t{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:20px;letter-spacing:-.05em}
.ag-nota{color:var(--fg-2);font-size:14px;margin-top:14px;line-height:1.5}
/* paquete con Vuelve */
.ag-paq{display:grid;gap:34px;align-items:center}@media(min-width:960px){.ag-paq{grid-template-columns:1.05fr .95fr}}
.ag-paq-l{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:9px}.ag-paq-l li{display:flex;gap:9px;align-items:flex-start;color:rgba(244,242,245,.85)}.ag-paq-l svg{flex:none;width:19px;height:19px;margin-top:2px;color:var(--ag-morado-c)}
.ag-pronto{position:relative;padding:26px;border-radius:26px;border:1.5px solid rgba(244,242,245,.18);background:rgba(255,255,255,.03)}
.ag-pill{display:inline-block;padding:5px 12px;border-radius:999px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12px;font-weight:800;letter-spacing:.02em}
.ag-pronto-v{display:flex;align-items:center;gap:12px;margin:20px 0 4px;flex-wrap:wrap}.ag-pronto-a{padding:9px 14px;border-radius:14px;background:rgba(159,216,184,.14);color:#9fd8b8;font-weight:700}
.ag-pronto-f svg{width:22px;height:22px;color:rgba(244,242,245,.5)}.ag-pronto-s{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:14px;background:rgba(200,164,92,.16);color:#f1dfb8}.ag-pronto-s svg{width:22px;height:22px}
.ag-pronto h3{font-weight:800;font-size:clamp(22px,2.6vw,28px);letter-spacing:-.03em;line-height:1.15;margin:16px 0 0}.ag-pronto p{margin:10px 0 0;color:rgba(244,242,245,.72);line-height:1.55}.ag-pronto p b{color:var(--ag-crema)}
/* precios */
.ag-planes{display:grid;gap:18px;align-items:start;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.ag-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:26px;padding:26px;display:grid;gap:8px}
.ag-plan.rec{border-color:var(--ag-morado);box-shadow:0 30px 60px -36px rgba(107,42,133,.5)}
.ag-sello{position:absolute;top:-13px;left:24px;background:linear-gradient(100deg,#a8853f,#c8a45c 55%,#e6cf96);color:#1b1408;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.ag-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.ag-para{color:var(--fg-2);margin:0}
.ag-precio{margin:6px 0 0}.ag-precio b{font-size:38px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.ag-precio small{color:var(--fg-2)}.ag-anual{margin:0;color:var(--fg-2);font-size:15px}
.ag-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:8px}.ag-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.ag-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--ag-morado)}
.ag-total{margin:4px 0 12px;font-size:16px}.ag-total b{font-size:20px;font-variant-numeric:tabular-nums}
.ag #form-agenda .btn.acento{background:var(--fg);color:var(--bg);box-shadow:0 10px 26px -12px rgba(20,17,20,.5)}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-agenda'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('ag-precios').textContent); }catch(e){}
  var tot=document.getElementById('ag-total'), cada=document.getElementById('ag-cada'), cs=document.getElementById('campo-sucursales');
  function num(el,min,max){ return Math.min(max,Math.max(min,parseInt(el.value,10)||min)); }
  // total: el plan + cada profesional de más + (en el paquete) cada sucursal de Vuelve de más
  function pinta(){ var x=P[f.slug.value]; if(!x) return; cs.hidden=!x.paquete;
    var t=x.p+(x.pr||0)*(num(f.profesionales,1,50)-1)+(x.paquete?(x.s||0)*num(f.sucursales,0,20):0); var fr=VD.frase(t,x.cada); tot.textContent=fr.hoy; cada.textContent=fr.luego; }
  document.addEventListener('vorka:descuento',pinta); f.slug.addEventListener('change',pinta); f.profesionales.addEventListener('input',pinta); f.sucursales.addEventListener('input',pinta); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); f.slug.value=a.dataset.plan; pinta(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var x=P[f.slug.value]||{};
    var d={ slug:f.slug.value, profesionales:num(f.profesionales,1,50), sucursales:x.paquete?num(f.sucursales,0,20):0, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos) return mostrar('Debes aceptar los términos, las condiciones y el aviso de privacidad.');
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url) location.href=x.j.url; else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
})();`;
