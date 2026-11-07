// Vorka Learn › Fiestas y eventos (vorka.mx/learn/fiestas/…): guías para organizar una celebración (XV años, boda,
// bautizo, graduación): la invitación, la confirmación de asistencia y qué revisar antes de contratar proveedores.
// Misma plantilla editorial que el resto de Learn (src/learn/tema.js → paginaArticulo). Catálogo y rutas: src/learn/datos.js
// (TEMAS) y src/simulador/guias.js (TEMAS_T).
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto sale de la fuente oficial que el artículo cita en «Fuentes»: comunicados de PROFECO en gob.mx
//    (salones de fiestas, 4 de julio de 2025; paquetes de graduación, 17 de julio de 2026) y el Registro Público de Contratos
//    de Adhesión de PROFECO. Revisadas el 6 de noviembre de 2026. Lo demás (qué poner y cuándo mandar la invitación) se dice
//    como consejo nuestro, alineado con la guía rápida de cada evento de Brindi (src/brindi-guias.js).
//  - No afirmamos obligaciones legales del anfitrión sobre los datos de sus invitados (la ley de datos personales exceptúa
//    el uso exclusivamente personal); solo consejo de pedir lo mínimo.
//  - Un solo llamado final: Brindi (/tienda/brindi/), descrito con lo que hace su ficha (src/brindi.js) y lo que NO hace
//    (no manda mensajes por ti), sin precios.
import { p, ul, ol, tabla, nota, caja } from './learn/piezas.js';
import { crearTema, llamadoFinal } from './learn/tema.js';
import { ARTICULOS_NEGOCIO, TEMA_NEGOCIO } from './learn-negocio.js';

// «Sigue leyendo» mientras la sección tiene una sola guía: la de eventos con cupo y entradas de Negocio pequeño
const deNegocio = slug => { const y = ARTICULOS_NEGOCIO.find(z => z.slug === slug); return y ? [{ href: TEMA_NEGOCIO.rutaDe(y), h1: y.h1, descripcion: y.descripcion }] : []; };

export const ACTUALIZADO_FIE = '2026-11-06';
const ACTUALIZADO_TXT = 'noviembre de 2026';
export const AVISO_FIESTAS = 'Información general con fines educativos; no es asesoría legal.';

export const FIESTAS = {
  clave: 'fiestas', nombre: 'Fiestas y eventos', corto: 'Fiestas',
  indice: {
    titulo: 'Fiestas y eventos: guías para organizar tu celebración',
    descripcion: 'Guías para organizar tus XV años, tu boda o tu fiesta: la invitación digital, la confirmación de asistencia y qué revisar antes de contratar el salón.',
    h1: 'Guías para organizar tu fiesta',
    lead: 'La invitación, las confirmaciones y los proveedores de tu celebración, con consejos prácticos y lo que recomienda PROFECO antes de firmar un contrato.',
  },
};

// ---------- fuentes (todas revisadas el 6 de noviembre de 2026) ----------
const F = {
  profecoSalones: { nombre: 'PROFECO: orienta a las y los consumidores sobre la contratación de salones de fiestas infantiles (4 de julio de 2025)', url: 'https://www.gob.mx/profeco/prensa/profeco-orienta-a-las-y-los-consumidores-sobre-contratacion-de-salones-de-fiestas-infantiles?idiom=es' },
  profecoGraduaciones: { nombre: 'PROFECO: cómo contratar paquetes para graduaciones de forma segura (17 de julio de 2026)', url: 'https://www.gob.mx/profeco/prensa/profeco-como-contratar-paquetes-para-graduaciones-de-forma-segura?idiom=es' },
  rpca: { nombre: 'PROFECO: Registro Público de Contratos de Adhesión (consulta de contratos registrados)', url: 'https://rpca.profeco.gob.mx/' },
};

const S = { invitacion: 'como-hacer-invitaciones-digitales' };

const LLAMADO = {
  brindi: llamadoFinal('Conoce Brindi', '¿Quieres tu invitación digital lista hoy?',
    'Brindi, de Vorka México, hace invitaciones digitales para XV años, bodas, bautizos, graduaciones y posadas. La creas gratis y pagas solo al publicarla, un pago único por evento. Tus invitados la abren en cualquier celular sin instalar nada, ven el mapa, el itinerario y la mesa de regalos, y confirman cuántos van; tú ves en tiempo real quién viene. Según el plan, cada invitado tiene su enlace personal o un pase con QR para la entrada. Brindi no manda mensajes por ti: tú compartes la invitación desde tu propio WhatsApp.',
    '/tienda/brindi/', 'Conoce Brindi'),
};

// ---------- los artículos ----------
export const ARTICULOS_FIESTAS = [
  {
    slug: S.invitacion, llamado: 'brindi',
    titulo: 'Cómo hacer invitaciones digitales para tu fiesta',
    descripcion: 'Cómo hacer la invitación digital de tus XV años, boda o fiesta: qué poner, cuándo mandarla, cómo pedir que confirmen y qué revisar del salón.',
    h1: 'Cómo hacer invitaciones digitales para tus XV años, boda o fiesta',
    lead: 'Una invitación digital llega en segundos, se corrige sin reimprimir y te dice quién va. Para que funcione hay que cuidar tres cosas: lo que pones, cuándo la mandas y cómo pides que confirmen. Aquí está cada una, y lo que recomienda PROFECO antes de contratar el salón.',
    secciones: [
      { h2: 'Qué poner en la invitación', html: p('Esto es consejo nuestro. Ordénala como la van a leer tus invitados: primero qué se celebra y cuándo, luego dónde, y al final los detalles.')
        + tabla(['Qué', 'Para qué sirve'], [
          ['Quién celebra, qué y la fecha', 'Lo primero que se ve. Si la ceremonia y la recepción son en días distintos, pon las dos.'],
          ['Papás y padrinos', 'Es costumbre nombrarlos en XV años, bodas y bautizos.'],
          ['Lugar, hora y mapa', 'De cada sitio (misa, ceremonia civil, recepción). Con el mapa nadie se pierde.'],
          ['Itinerario', 'A qué hora es cada momento (vals, cena, fiesta), para que nadie llegue cuando ya pasó lo importante.'],
          ['Código de vestimenta', 'Si hay un color reservado para la quinceañera, la novia o las damas, dilo desde el principio.'],
          ['Mesa de regalos', 'El enlace o el número de evento, para que no tengan que preguntarte.'],
          ['Confirmación con fecha límite', 'Lo que te dice cuántas mesas y platillos apartar.'],
          ['Hospedaje y transporte', 'Si vienen invitados de otra ciudad.'],
        ])
        + caja('Lugares por invitado', p('Si la invitación es para una familia, di cuántos lugares tiene reservados. Así cada quien confirma solo los suyos y nadie llega con acompañantes de más.')) },
      { h2: 'Cuándo mandarla', html: p('Esto es consejo nuestro; no hay una regla oficial, y depende de cuánta gente viaja:')
        + tabla(['Momento', 'Qué mandar'], [
          ['De 2 a 6 meses antes', 'Un aviso de «reserva la fecha» a padrinos y a quien tiene que viajar.'],
          ['De 5 a 8 semanas antes', 'La invitación completa, con fecha límite para confirmar.'],
          ['1 o 2 semanas antes de la fecha límite', 'Un recordatorio solo a quien no ha respondido.'],
          ['La semana del evento', 'Si cambia un horario o un lugar, corrígelo en la invitación y avisa del cambio.'],
        ]) },
      { h2: 'Cómo pedir que confirmen (y que sí lo hagan)', html: p('Esto es consejo nuestro:') + ol([
          ['Pon una fecha límite clara', 'Por ejemplo, tres semanas antes del evento. Sin fecha, nadie se siente obligado a responder.'],
          ['Pide solo lo necesario', 'Si asiste, cuántas personas y, si vas a dar cena, si alguien tiene una necesidad de alimentación. No pidas datos que no vas a usar.'],
          ['Hazlo fácil', 'Que puedan confirmar con un toque desde el celular, sin crear cuentas ni descargar nada.'],
          ['Recuerda solo a quien falta', 'Un mensaje corto y amable a quien no ha respondido, no a todos.'],
        ]) },
      { h2: 'Cómo mandarla por WhatsApp', html: ul([
          '<b>Un mensaje corto y personal</b>: «¡Hola, tía Lupita! Te comparto la invitación a los XV de Sofía. Nos encantaría que nos acompañes; confírmanos aquí antes del 15 de marzo».',
          '<b>Un enlace por familia</b>, si puedes: así cada quien ve su nombre y sus lugares, y sabes exactamente quién confirmó.',
          '<b>Para quien no usa WhatsApp</b>: imprime un código QR de la invitación en una tarjeta sencilla.',
        ]) + nota('Consejo nuestro: manda los mensajes tú, desde tu número. La gente abre más lo que le llega de alguien que conoce.') },
      { h2: 'Antes de contratar el salón y los proveedores', html: p('PROFECO recomienda, al contratar un salón de fiestas:')
        + ul([
          '<b>Cotizar con al menos tres proveedores</b> antes de contratar.',
          '<b>Revisar que el contrato esté registrado</b> en el Registro Público de Contratos de Adhesión de PROFECO (rpca.profeco.gob.mx).',
          'Preguntar si cobran de más por servicios externos, como meseros, música o comida que tú lleves.',
          'Tomar en cuenta que suelen pedir un anticipo, frecuentemente del 50 %.',
        ])
        + p('Y para paquetes de eventos (por ejemplo, de graduación), PROFECO pide que el contrato especifique los servicios, las fechas de entrega, los costos, las formas de pago y las penalizaciones por cancelación, y que pidas factura, recibo o comprobante de lo que pagas.')
        + nota('Fuentes: comunicados de PROFECO sobre salones de fiestas (4 de julio de 2025) y paquetes de graduación (17 de julio de 2026).') },
      { h2: 'Antes de mandarla, revisa', html: ul([
          '¿El nombre, la fecha y las horas están bien escritos?',
          '¿El mapa abre en el lugar correcto?',
          '¿Dice cuántos lugares tiene cada invitado?',
          '¿Tiene fecha límite para confirmar?',
          '¿La abriste en tu celular y en el de alguien mayor de la familia?',
        ]) },
    ],
    faq: [
      { p: '¿Con cuánto tiempo se manda una invitación de XV años o de boda?', r: 'No hay una regla oficial. Como consejo nuestro, la invitación completa se manda de 5 a 8 semanas antes, con fecha límite para confirmar, y un aviso de «reserva la fecha» antes a quien tiene que viajar.' },
      { p: '¿Qué datos debe llevar una invitación digital?', r: 'Quién celebra y qué, la fecha, el lugar y la hora con mapa, el itinerario, el código de vestimenta si lo hay, la mesa de regalos, cuántos lugares tiene cada invitado y una fecha límite para confirmar.' },
      { p: '¿Qué revisar antes de contratar un salón de fiestas?', r: 'PROFECO recomienda cotizar con al menos tres proveedores, revisar que el contrato esté registrado en su Registro Público de Contratos de Adhesión, preguntar por cobros extra por servicios externos y pedir comprobante de lo que pagas.' },
    ],
    fuentes: [F.profecoSalones, F.profecoGraduaciones, F.rpca],
    relacionadas: [], relExtra: deNegocio('como-organizar-un-evento-y-cobrar-entradas'),
  },
];

const NOTA_PIE = `Vorka Learn es la sección de guías de Vorka México. ${AVISO_FIESTAS} No estamos afiliados a PROFECO. Brindi es una app de Vorka México.`;

export const TEMA_FIESTAS = crearTema({
  seccion: FIESTAS, articulos: ARTICULOS_FIESTAS, llamados: LLAMADO, actualizado: ACTUALIZADO_FIE, actualizadoTxt: ACTUALIZADO_TXT,
  notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las recomendaciones de PROFECO pueden cambiar, así que confírmalas antes de contratar.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_FIESTAS}</b></p>`,
  notaPie: NOTA_PIE, compartirTexto: 'Compártela con quien está organizando una fiesta.', relTitulo: 'Más guías de Vorka Learn',
});
export const RUTA_FIESTAS = TEMA_FIESTAS.ruta;
