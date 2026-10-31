// Vorka Learn › Negocio pequeño (vorka.mx/learn/negocio/…): guías prácticas para quien tiene un negocio chico (cafetería,
// estética, consultorio, venta por catálogo, eventos). Misma plantilla editorial que el resto de Learn (src/learn/tema.js →
// paginaArticulo). Rutas, sitemap y catálogo: src/simulador/guias.js (rutasLearn, urlsGuias) y src/learn/datos.js (TEMAS).
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto (cifras, reglas, obligaciones) sale de la fuente oficial que el artículo cita en «Fuentes»: INEGI,
//    la Ley Federal de Protección al Consumidor (PROFECO), la Ley Federal de Protección de Datos Personales en Posesión de
//    los Particulares y la Ley del ISR, en diputados.gob.mx; comunicados de PROFECO en gob.mx. Revisadas el 31 de octubre
//    de 2026. Donde no hay dato oficial, consejos prácticos sin cifras, dichos como consejo.
//  - Los números de los ejemplos son propios, inventados y marcados (la aritmética la revisa test/learn-temas.test.js).
//  - Un solo llamado final por artículo, a la app que corresponde, descrita con lo que hace hoy su ficha (src/vuelve.js,
//    src/agenda.js, src/vende.js, src/cupo.js), sin precios ni promesas. Lo que NO hace se dice.
//  - Aviso al final: información general; no es asesoría legal ni fiscal.
import { p, ul, ol, tabla, nota, caja } from './learn/piezas.js';
import { crearTema, llamadoFinal } from './learn/tema.js';

export const ACTUALIZADO_NEG = '2026-10-31';
const ACTUALIZADO_TXT = 'octubre de 2026';
export const AVISO_NEGOCIO = 'Información general con fines educativos; no es asesoría legal, fiscal ni contable.';

export const NEGOCIO = {
  clave: 'negocio', nombre: 'Negocio pequeño', corto: 'Negocio',
  indice: {
    titulo: 'Negocio pequeño: guías prácticas con fuentes',
    descripcion: 'Guías para tu negocio pequeño: clientes que regresan, citas que no se pierden, venta por catálogo con cuentas claras y eventos con cupo y lista.',
    h1: 'Guías para tu negocio pequeño',
    lead: 'Lealtad, citas, venta por catálogo y eventos, explicados con consejos que se pueden aplicar mañana y con lo que dicen INEGI, PROFECO y las leyes que aplican.',
  },
};

// ---------- fuentes (todas revisadas el 31 de octubre de 2026) ----------
const F = {
  inegiCe: { nombre: 'INEGI: Comunicado de prensa 79/25, Censos Económicos 2024, resultados definitivos (24 de julio de 2025)', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/ce/CE2024_def.pdf' },
  lfpc: { nombre: 'Ley Federal de Protección al Consumidor (artículos 7, 7 Bis, 17, 18, 18 Bis, 46 a 50, 57, 92 Bis y 92 Ter; última reforma DOF 12-12-2025)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf' },
  datos: { nombre: 'Ley Federal de Protección de Datos Personales en Posesión de los Particulares (publicada en el DOF el 20 de marzo de 2025; artículos 14 y 15, aviso de privacidad)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf' },
  lisr: { nombre: 'Ley del Impuesto sobre la Renta (artículo 113-E, Régimen Simplificado de Confianza, y disposiciones transitorias del decreto del 9 de diciembre de 2019)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf' },
  profecoEventos: { nombre: 'PROFECO: Recuerda Profeco a qué tiene derecho la población consumidora en caso de cancelación de eventos (abril de 2025)', url: 'https://www.gob.mx/profeco/prensa/recuerda-profeco-a-que-tiene-derecho-la-poblacion-consumidora-en-caso-de-cancelacion-de-eventos' },
};

// ---------- piezas ----------
const ejemplo = (titulo, html) => `<div class="gu-ej"><span class="gu-ej-t">Ejemplo propio de Vorka Learn, con cifras inventadas</span>
<p class="gu-ej-p">${titulo}</p>${html}</div>`;
const S = { vuelve: 'como-hacer-que-tus-clientes-regresen', agenda: 'como-dejar-de-perder-citas', vende: 'como-vender-por-catalogo', cupo: 'como-organizar-un-evento-y-cobrar-entradas' };

// Llamados finales: cada app descrita con lo que hace hoy su ficha en la tienda (y lo que no hace)
const LLAMADO = {
  vuelve: llamadoFinal('Conoce Vuelve', '¿Quieres tu tarjeta de sellos o puntos sin imprimir nada?',
    'Vuelve, de Vorka México, es una tarjeta de lealtad digital: tus clientes escanean tu QR, dejan su nombre y su teléfono y guardan su tarjeta en Apple Wallet, Google Wallet o en su navegador, sin descargar una app. Eliges sellos o puntos y tus premios; Vuelve manda solo la felicitación de cumpleaños y el «te extrañamos» a la tarjeta de su celular (y por correo, si te lo dieron) y te muestra cuántos regresaron. No manda WhatsApp. Puedes probarla 7 días sin tarjeta.',
    '/tienda/vuelve/', 'Conoce Vuelve'),
  agenda: llamadoFinal('Conoce Agenda', '¿Quieres que tus clientes agenden solos?',
    'Agenda, de Vorka México, te da tu página de citas: tus clientes eligen servicio, con quién, día y hora, sin crear cuenta. Si dejan su correo, les llegan la confirmación y recordatorios 24 y 2 horas antes; para WhatsApp, cada cita tiene un botón que abre el mensaje ya escrito y lo mandas tú desde tu número. Agenda todavía no manda WhatsApp automáticos. Puedes probarla 7 días sin tarjeta.',
    '/tienda/agenda/', 'Conoce Agenda'),
  vende: llamadoFinal('Conoce Vende', '¿Llevas tus pedidos y abonos en una libreta?',
    'Vende, de Vorka México, es una app para quien vende por catálogo o por encargo: registra a tus clientas, tus pedidos y sus abonos, te calcula la ganancia real de cada venta y cada mañana te dice a quién escribirle, con el WhatsApp ya redactado para que lo mandes tú. Es gratis con hasta 10 clientas y 30 pedidos al mes. Vende solo lleva el registro: no mueve dinero, no presta y no cobra por ti.',
    '/tienda/vende/', 'Conoce Vende'),
  cupo: llamadoFinal('Conoce Cupo', '¿Vas a organizar tu próximo evento?',
    'Cupo, de Vorka México, te arma la página de tu evento con registro sin cuentas, entrada con QR y check-in desde tu celular, también sin señal. Es gratis hasta 30 personas; para más lugares, correos o cobro anticipado está Cupo Pro, que se paga por evento. Cupo no cobra comisión por tus entradas: la gente te paga directo a ti.',
    '/tienda/cupo/', 'Conoce Cupo'),
};

// ---------- los artículos ----------
export const ARTICULOS_NEGOCIO = [
  // =============== 1. Lealtad (Vuelve) ===============
  {
    slug: S.vuelve, llamado: 'vuelve',
    titulo: 'Cómo hacer que tus clientes regresen',
    descripcion: 'Tarjeta de sellos o de puntos, premios que sí convienen, recordatorios que no molestan y lo que dice la ley de tus promociones, para un negocio pequeño.',
    h1: 'Cómo hacer que tus clientes regresen: sellos, puntos y recordatorios',
    lead: 'Conseguir un cliente nuevo cuesta trabajo; que el que ya te conoce vuelva es más sencillo si se lo pides bien. Aquí está cómo armar un programa de lealtad que te convenga, cómo recordarle a tu gente que existes sin volverte spam y qué dice la ley de tus promociones.',
    secciones: [
      { h2: 'Por qué vale la pena cuidar a quien ya te compró', html: p('En México casi todos los negocios son chicos. Según los Censos Económicos 2024 del INEGI, en 2023 las microempresas (10 personas o menos) eran el <b>95.4 %</b> de las unidades económicas del sector privado y paraestatal, y daban trabajo al <b>41.4 %</b> del personal ocupado.')
        + p('Un negocio chico rara vez tiene presupuesto para anuncios todo el año. Lo que sí tiene es trato directo: sabe cómo se llama su clienta y qué pide. Un programa de lealtad convierte ese trato en una razón concreta para regresar (esto ya es consejo nuestro).') },
      { h2: 'Sellos, puntos o niveles: cuál te conviene', html: tabla(['Tipo', 'Cómo funciona', 'Le queda a…'], [
          ['Sellos', 'Un sello por visita o por compra; al juntar cierto número, un premio.', 'Negocios con compras parecidas entre sí: café, corte de cabello, lavado de auto, tortas.'],
          ['Puntos', 'Puntos según lo que gasta cada quien; los cambia por premios.', 'Negocios con tickets muy distintos: papelería, ferretería, restaurante.'],
          ['Niveles', 'Quien viene más sube de nivel y recibe un trato mejor.', 'Como complemento, cuando ya tienes clientes muy frecuentes.'],
        ], 'Tabla de consejo nuestro: no hay una regla oficial sobre cuál usar.')
        + p('Si dudas, empieza con sellos: son los más fáciles de explicar en una frase («a la décima, va por nuestra cuenta»).') },
      { h2: 'Cómo diseñar el premio sin regalar tu ganancia', html: ol([
          ['Que se alcance', 'Si tu clienta viene cada semana, un premio a las 8 o 10 visitas se siente cerca. Uno a las 30 visitas se olvida.'],
          ['Que te cueste poco y valga mucho', 'Lo que importa es tu costo, no el precio de lista: un café o un lavado extra te cuesta menos de lo que cobras por él.'],
          ['Que sea claro', 'Qué cuenta como visita, qué premio, hasta cuándo y si hay excepciones. Escríbelo en la tarjeta o en el cartel.'],
          ['Que no se pueda abusar', 'Un sello por visita y por día, y que solo sellen las personas de tu equipo.'],
        ])
        + ejemplo('Una cafetería vende el café en $40 y le cuesta $12 prepararlo. Su tarjeta da el décimo café gratis. ¿Cuánto le cuesta el premio?', ul([
          'La clienta paga 9 cafés: 9 × $40 = <b>$360</b>.',
          'El décimo, gratis, le cuesta a la cafetería <b>$12</b> (su costo, no su precio).',
          'El premio es $12 ÷ $360 = <b>3.3 %</b> de lo que la clienta pagó en ese ciclo.',
        ]) + nota('Si el premio fuera un descuento de $40 en efectivo, costaría más del triple. Por eso conviene premiar con producto o servicio.')) },
      { h2: 'Lo que dice la ley de tus promociones', html: p('La Ley Federal de Protección al Consumidor llama <b>promoción</b>, entre otras, a ofrecer un producto o servicio con el incentivo de darte otro gratis o a precio reducido (artículo 46). Una tarjeta de «el décimo gratis» entra ahí. Lo que pide la ley:')
        + ul([
          '<b>No necesitas autorización ni avisar</b> para hacer una promoción, salvo que una norma oficial mexicana lo pida (artículo 47).',
          '<b>Anuncia las condiciones y el plazo</b> (o cuántas piezas hay). Si no pones plazo ni volumen, se presume que la promoción sigue hasta que avises que se acabó, de modo suficiente y por los mismos medios en que la anunciaste (artículo 48).',
          '<b>Quien cumpla los requisitos tiene derecho al premio</b> mientras dure el plazo o haya existencias (artículo 48).',
          '<b>Si no cumples</b>, la persona puede exigir que cumplas, aceptar algo equivalente o cancelar, y en todo caso cobrarte la diferencia de precio (artículo 50).',
        ])
        + caja('En la práctica', p('Pon en la tarjeta o en tu cartel qué se premia, cómo y hasta cuándo. Si un día cambias el programa, avísalo por los mismos medios y respeta las tarjetas que ya estaban a punto de completarse (esto último es consejo nuestro).')) },
      { h2: 'Recordatorios que no molestan', html: p('Recordarle a tu clienta que le falta un sello o que es su cumpleaños funciona mejor que un anuncio. Pero hay reglas cuando el mensaje es publicidad:')
        + ul([
          'La publicidad que mandas debe decir el <b>nombre, domicilio y teléfono</b> (o, si no, la dirección electrónica) de tu negocio y de la Procuraduría Federal del Consumidor (artículo 17 de la ley del consumidor).',
          'Tu cliente puede pedirte <b>que no le mandes publicidad</b>, y desde ese momento ya no puedes mandarle. Tampoco a quien se inscribió en el registro de PROFECO de personas que no quieren publicidad (artículos 17, 18 y 18 Bis).',
          'Si guardas nombres y teléfonos, la ley de datos personales te pide un <b>aviso de privacidad</b> que diga, al menos, quién eres y tu domicilio, qué datos guardas, para qué los usas, cómo limitar su uso y cómo ejercer los derechos de acceso, rectificación, cancelación y oposición (artículos 14 y 15).',
        ])
        + p('Como consejo nuestro: pide permiso al registrar a la persona, manda pocos mensajes y que cada uno le sirva (su premio está cerca, su cumpleaños, una novedad real). Si alguien te pide que pares, para.') },
      { h2: 'Cómo saber si funciona', html: p('Esto es consejo nuestro. Antes de empezar, anota tres números de un mes normal; un mes después de lanzar el programa, compáralos:')
        + ul(['Cuántos clientes distintos te visitaron.', 'Cuántos de ellos vinieron más de una vez.', 'Cada cuánto regresa, en promedio, una clienta frecuente.'])
        + p('Si los clientes que repiten no suben en dos o tres meses, cambia el premio o lo cerca que está, no el programa entero.') },
    ],
    faq: [
      { p: '¿Necesito permiso de PROFECO para dar una tarjeta de sellos?', r: 'No. Según el artículo 47 de la Ley Federal de Protección al Consumidor, las promociones no necesitan autorización ni aviso, salvo que una norma oficial mexicana lo pida. Sí debes anunciar sus condiciones y su plazo (artículo 48).' },
      { p: '¿Qué pasa si no pongo fecha de vencimiento a mi promoción?', r: 'El artículo 48 de la ley del consumidor dice que, si no fijas plazo ni volumen, se presume que la promoción sigue vigente hasta que avises públicamente que se terminó, por los mismos medios en que la anunciaste.' },
      { p: '¿Puedo mandar promociones por mensaje a mis clientes?', r: 'Sí, con reglas: la publicidad debe identificar a tu negocio y a PROFECO, no puedes mandarla a quien te pidió no recibirla ni a quien está en el registro de PROFECO, y si guardas sus datos necesitas un aviso de privacidad.' },
      { p: '¿Me conviene más sellos o puntos?', r: 'Como consejo nuestro: sellos si tus clientes compran más o menos lo mismo cada vez (café, corte, lavado); puntos si sus compras varían mucho de precio.' },
    ],
    fuentes: [F.inegiCe, F.lfpc, F.datos],
    relacionadas: [S.agenda, S.vende, S.cupo],
  },

  // =============== 2. Citas (Agenda) ===============
  {
    slug: S.agenda, llamado: 'agenda',
    titulo: 'Cómo dejar de perder citas en tu negocio',
    descripcion: 'Agenda en línea, confirmaciones y recordatorios por WhatsApp, y una política de cancelación clara para que tus clientes no te dejen esperando.',
    h1: 'Cómo dejar de perder citas: agenda en línea, confirmaciones y recordatorios',
    lead: 'Cada cita a la que nadie llega es una hora que ya no recuperas. La mayoría de las faltas no son mala fe: la gente se olvida o no encontró cómo avisar. Esto es lo que puedes hacer para que pase menos, desde que agendan hasta el día de la cita.',
    secciones: [
      { h2: 'Cuánto te cuesta una cita perdida', html: p('No hay una cifra oficial de faltas por giro en México, así que haz la cuenta con tus propios números. Basta una semana de anotar quién no llegó:')
        + ejemplo('Una estética cobra $250 por servicio y en una semana normal le fallan 3 citas. ¿Cuánto deja de cobrar?', ul([
          'Por semana: 3 × $250 = <b>$750</b>.',
          'En un mes de 4 semanas: 4 × $750 = <b>$3,000</b>.',
        ]) + nota('Y eso sin contar el tiempo que pagaste a tu equipo esperando. Con tus números, la cuenta te dice cuánto vale la pena invertir en evitarlo.')) },
      { h2: 'Paso 1: que agenden solos, a cualquier hora', html: p('Esto es consejo nuestro. Muchas citas se pierden antes de existir: la persona escribe a las 11 de la noche, nadie contesta y agenda en otro lado. Una agenda en línea resuelve tres cosas:')
        + ul([
          '<b>Ven tus horarios libres reales</b>, sin ir y venir de mensajes.',
          '<b>Queda por escrito</b> qué servicio, con quién, qué día y a qué hora.',
          '<b>Te dejan su contacto</b> para confirmar y recordar.',
        ])
        + p('Los Censos Económicos 2024 del INEGI preguntaron por primera vez si los negocios usaban internet: <b>1,444,950 unidades económicas</b> lo usaron para sus actividades en 2023. Tus clientes ya agendan otras cosas por internet; tu negocio también puede.') },
      { h2: 'Paso 2: confirma y recuerda', html: p('Como consejo nuestro, dos recordatorios funcionan bien: uno <b>el día anterior</b>, que le da tiempo de avisar si no puede, y otro <b>unas horas antes</b>. Que cada mensaje traiga lo necesario:')
        + ol([
          ['Qué y cuándo', 'Servicio, día, hora y con quién.'],
          ['Dónde', 'La dirección o la liga de la videollamada.'],
          ['Cómo cambiarla', 'Una liga o un número para mover o cancelar. Si avisar es fácil, avisan.'],
        ])
        + caja('Por WhatsApp, con cuidado', p('Usa el número de tu negocio y escribe como persona, no como robot: «Hola, Laura, te esperamos mañana a las 5 para tu corte. Si no puedes venir, avísanos aquí y te damos otra hora». Si además quieres mandarle promociones, eso ya es publicidad: la ley del consumidor le permite pedirte que no le mandes más, y debes respetarlo (artículos 17 y 18 Bis).'))
        + p('Si guardas nombres, teléfonos o notas de tus clientes, la ley de datos personales te pide un <b>aviso de privacidad</b> con quién eres, qué datos guardas y para qué, y cómo pueden ejercer sus derechos sobre ellos (artículos 14 y 15).') },
      { h2: 'Paso 3: una política de cancelación clara', html: p('La ley del consumidor obliga a todo proveedor a informar y respetar sus precios, plazos, fechas, reservaciones y demás condiciones (artículo 7), y a los establecimientos de servicios a tener a la vista la tarifa de sus principales servicios (artículo 57). Lo mismo vale para tus reglas de citas: lo que no avisaste antes, no lo puedes cobrar después.')
        + p('Esto es consejo nuestro para armarla:')
        + ul([
          '<b>Con cuánto tiempo se cancela sin problema</b> (por ejemplo, hasta el día anterior).',
          '<b>Qué pasa si no llega y no avisa</b>: una advertencia la primera vez; anticipo para la siguiente cita si se repite.',
          '<b>Cuánta tolerancia hay</b> si llega tarde, para no recorrer a todos los que siguen.',
        ])
        + p('Ponla donde se vea: al agendar, en el recordatorio y en tu mostrador.') },
      { h2: 'Paso 4: qué hacer con los huecos', html: ul([
          '<b>Lista de espera.</b> Anota a quien quería una hora que estaba llena; si alguien cancela, escríbele primero.',
          '<b>Historial de faltas.</b> Si una persona falla seguido, pídele anticipo o confirmación expresa antes de apartarle lugar.',
          '<b>Revisa tus horarios.</b> Si siempre fallan las citas de cierta hora, quizá ese horario no le acomoda a tu clientela.',
        ]) + nota('Consejos nuestros, sin cifras oficiales detrás: pruébalos un mes y compara cuántas faltas tuviste.') },
    ],
    faq: [
      { p: '¿Puedo cobrar si un cliente no llega a su cita?', r: 'Solo lo que hayas informado antes. La Ley Federal de Protección al Consumidor obliga a informar y respetar las condiciones, plazos y reservaciones (artículo 7). Si tu política de cancelación y su costo estaban claros al agendar, es más fácil aplicarla.' },
      { p: '¿Cuándo conviene mandar el recordatorio?', r: 'Como consejo nuestro, el día anterior, para que tenga tiempo de avisar si no puede, y otra vez unas horas antes de la cita.' },
      { p: '¿Necesito aviso de privacidad si guardo teléfonos de mis clientes?', r: 'Sí. La Ley Federal de Protección de Datos Personales en Posesión de los Particulares de 2025 pide informar con un aviso de privacidad quién guarda los datos, cuáles, para qué y cómo ejercer los derechos sobre ellos (artículos 14 y 15).' },
    ],
    fuentes: [F.inegiCe, F.lfpc, F.datos],
    relacionadas: [S.vuelve, S.cupo, S.vende],
  },

  // =============== 3. Venta por catálogo (Vende) ===============
  {
    slug: S.vende, llamado: 'vende',
    titulo: 'Cómo vender por catálogo sin perder dinero',
    descripcion: 'Ganancia real, comisiones claras con tus vendedoras, control de pedidos y abonos, y lo básico de impuestos si vendes por catálogo o por encargo.',
    h1: 'Cómo vender por catálogo: ganancia real, comisiones claras y pedidos en orden',
    lead: 'Vender por catálogo parece fácil: enseñas la revista, anotas el pedido y cobras. Donde se pierde el dinero es en lo que no se anota: el envío, el regalito, el abono que nadie registró. Aquí está cómo llevar las cuentas, cómo acordar comisiones claras si trabajas con otras vendedoras y lo básico de impuestos.',
    secciones: [
      { h2: 'Lo que vendiste no es lo que ganaste', html: p('Tu ganancia es lo que te queda después de pagar el producto y todo lo que pusiste de tu bolsa para venderlo. Esto es consejo nuestro: resta cada pedido completo, no solo el descuento de la marca.')
        + ejemplo('Vendes tres productos a precio de catálogo por $1,200. La marca te los da con 30 % de descuento, tú pagas $60 de envío y regalas una muestra que te costó $30. ¿Cuánto ganaste?', ul([
          'Lo que pagas a la marca: $1,200 × 70 % = <b>$840</b>.',
          'Ganancia «de catálogo»: $1,200 − $840 = $360.',
          'Ganancia real: $360 − $60 − $30 = <b>$270</b>.',
        ]) + nota('Y si la clienta te lo paga en abonos, esos $270 todavía no están en tu bolsa: es ganancia vendida, no cobrada.')) },
      { h2: 'Si trabajas con otras vendedoras: comisiones claras', html: p('Si diriges a un grupo de vendedoras, la mayoría de los pleitos salen de una comisión que cada quien entendió distinto. Como consejo nuestro, pónganse de acuerdo por escrito en cinco cosas:')
        + ol([
          ['El porcentaje', 'Y si cambia según cuánto vende cada una.'],
          ['Sobre qué se calcula', 'Precio de catálogo o con descuento; con o sin envío.'],
          ['Sobre lo vendido o sobre lo cobrado', 'Es la diferencia más importante (ver el ejemplo).'],
          ['Cuándo se paga', 'Cada semana, cada campaña o al cierre del mes.'],
          ['Qué pasa con devoluciones y clientas que no pagan', 'Quién absorbe la pérdida.'],
        ])
        + ejemplo('Una vendedora de tu equipo vendió $5,000 en la campaña y ya cobró $4,000. Su comisión es de 20 %. ¿Cuánto le toca?', ul([
          'Si es sobre lo vendido: 20 % de $5,000 = <b>$1,000</b>.',
          'Si es sobre lo cobrado: 20 % de $4,000 = <b>$800</b>, y los otros $200 cuando cobre lo que falta.',
        ]) + nota('Las dos formas son válidas; lo que no funciona es no haberlo dicho antes.')) },
      { h2: 'Pedidos y abonos en orden', html: p('Esto es consejo nuestro. Para cada pedido anota, el mismo día:')
        + ul([
          '<b>Quién, qué y cuánto</b>: clienta, productos, precio y descuento si lo diste.',
          '<b>Cómo te va a pagar</b>: de contado o en abonos, y cada cuándo.',
          '<b>Cada abono</b> con su fecha, en cuanto lo recibas.',
          '<b>Cuándo entregas</b> y si ya entregaste.',
        ])
        + p('Con eso puedes darle a cada clienta su estado de cuenta (lo que pidió, lo que abonó y lo que falta) y cobrar sin pena, porque las cuentas están a la vista. Si una clienta te debe de varias campañas, no le vendas más a crédito hasta que se ponga al corriente.') },
      { h2: 'Lo básico de impuestos', html: p('Vender por catálogo es una actividad empresarial y lo que ganas es un ingreso. Dos datos de la Ley del Impuesto sobre la Renta que te sirven para preguntar bien:')
        + ul([
          'Existe el <b>Régimen Simplificado de Confianza</b> para personas físicas con actividad empresarial, profesional o de arrendamiento, si sus ingresos del año anterior no pasaron de <b>3.5 millones de pesos</b> (artículo 113-E). Ahí se paga cada mes un porcentaje de lo cobrado con factura, de <b>1 % a 2.5 %</b> según el monto.',
          'La ley permite que Hacienda fije, con reglas generales, un esquema para facilitar el cumplimiento a los <b>vendedores independientes de productos al menudeo por catálogo</b> (disposiciones transitorias del decreto publicado en el Diario Oficial el 9 de diciembre de 2019).',
        ])
        + caja('Pregunta antes de decidir', p('Qué régimen te toca y si te aplica una facilidad depende de tu caso: cuánto vendes, si tienes otro empleo, si la marca te retiene impuestos. Confírmalo con el SAT o con una persona contadora antes de inscribirte.')) },
    ],
    faq: [
      { p: '¿Cómo calculo mi ganancia en una venta por catálogo?', r: 'Al precio de venta réstale lo que pagaste a la marca y todo lo que pusiste de tu bolsa: envío, regalos, empaque. Y separa lo vendido de lo cobrado: si te pagan en abonos, la ganancia llega poco a poco.' },
      { p: '¿La comisión de mis vendedoras se paga sobre lo vendido o lo cobrado?', r: 'Las dos formas existen. Como consejo nuestro, acuérdenlo por escrito antes de empezar, junto con el porcentaje, cuándo se paga y qué pasa con devoluciones y clientas que no pagan.' },
      { p: '¿Tengo que pagar impuestos si vendo por catálogo?', r: 'Lo que ganas vendiendo es un ingreso de una actividad empresarial. La Ley del ISR prevé el Régimen Simplificado de Confianza para personas físicas con ingresos de hasta 3.5 millones de pesos al año; confirma con el SAT o con una persona contadora qué te aplica.' },
    ],
    fuentes: [F.lisr, F.lfpc, F.inegiCe],
    relacionadas: [S.vuelve, S.agenda, S.cupo],
  },

  // =============== 4. Eventos (Cupo) ===============
  {
    slug: S.cupo, llamado: 'cupo',
    titulo: 'Cómo organizar un evento y cobrar entradas',
    descripcion: 'Cupo, registro, cobro de entradas, reembolsos y lista de asistencia: cómo organizar un taller, una fiesta o un evento de tu negocio sin enredos.',
    h1: 'Cómo organizar un evento y cobrar entradas sin enredos',
    lead: 'Un taller, una noche de karaoke, una posada o la presentación de tu producto: el reto no es la idea, es saber cuánta gente viene, quién ya pagó y quién está en la puerta. Esto es lo que conviene decidir antes, durante y después.',
    secciones: [
      { h2: 'Antes de abrir el registro: el cupo y los números', html: p('Esto es consejo nuestro. Define tres cosas antes de anunciar nada:')
        + ol([
          ['Cuántas personas caben', 'Pregunta al lugar cuál es su aforo permitido y quédate debajo. Cuenta a tu equipo y a los invitados de cortesía.'],
          ['Cuánto te cuesta el evento', 'Lugar, comida, materiales, sonido, publicidad.'],
          ['Cuántas entradas necesitas vender para no perder', 'Así sabes si el precio y el cupo tienen sentido.'],
        ])
        + ejemplo('Organizas un taller para 40 personas. Te cuesta $3,600 en total (lugar, materiales y café) y cobras $150 por entrada. ¿Con cuántas entradas recuperas lo invertido y cuánto ganas si se llena?', ul([
          'Para no perder: $3,600 ÷ $150 = <b>24 entradas</b>.',
          'Si se llena: 40 × $150 = $6,000; ganancia: $6,000 − $3,600 = <b>$2,400</b>.',
        ]) + nota('Si a las dos semanas llevas menos de 24, todavía tienes tiempo de mover el precio, la fecha o la difusión.')) },
      { h2: 'El registro: pide solo lo necesario', html: p('Con nombre y un contacto (teléfono o correo) basta para la mayoría de los eventos. Cada dato extra es un dato más que cuidar.')
        + p('Si guardas datos de quienes se registran, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares pide un <b>aviso de privacidad</b> que diga, al menos, quién eres y tu domicilio, qué datos tratas, para qué, cómo pueden limitar su uso y cómo ejercer sus derechos (artículos 14 y 15).')
        + p('Como consejo nuestro, abre lista de espera cuando se llene: siempre hay quien cancela.') },
      { h2: 'Cobrar las entradas', html: p('La ley del consumidor pide dos cosas que aplican directo a tus entradas:')
        + ul([
          '<b>El precio total, visible.</b> Debes informar de forma notoria el monto total a pagar, incluidas comisiones y cualquier cargo adicional (artículo 7 Bis). Si anuncias un precio «más cargo por servicio», di también cuánto es el total.',
          '<b>Respetar lo que ofreciste.</b> Precio, fecha, lugar, lo que incluye la entrada y demás condiciones (artículo 7).',
        ])
        + p('Esto es consejo nuestro para no perder la cuenta:')
        + ul([
          'Si cobras por transferencia, pide que pongan su nombre en el concepto y márcalo como pagado en tu lista el mismo día.',
          'Decide si apartas el lugar al registrarse o hasta que paguen, y dilo.',
          'Si cobras en la puerta, ten a la mano quién ya pagó para no cobrar dos veces.',
        ]) },
      { h2: 'Si cambias la fecha o cancelas', html: p('Publica tu política de reembolso antes de vender la primera entrada. Si el evento se cancela o no se presta por causas que te tocan, la ley del consumidor da derecho a una bonificación o compensación (artículo 92 Bis), que no puede ser menor al <b>20 % del precio pagado</b> (artículo 92 Ter).')
        + p('PROFECO ha recordado, en sus comunicados sobre cancelaciones de eventos, que quien compra puede pedir el reembolso de lo que no se le dio y presentar una queja si no se lo dan.')
        + caja('Consejo nuestro', p('Si tienes que mover la fecha, avisa a todos por el mismo medio en que se registraron y ofrece dos opciones: usar su entrada en la nueva fecha o recibir su dinero de vuelta.')) },
      { h2: 'El día del evento: la lista en la puerta', html: ul([
          '<b>Una sola lista</b>, compartida con quien recibe, para que nadie entre dos veces con la misma entrada.',
          '<b>Entrada con código o QR</b>, si puedes: se revisa más rápido que buscar nombres en una hoja.',
          '<b>Un respaldo sin internet</b>: la lista descargada o impresa por si falla la señal.',
          '<b>Marca la llegada</b> de cada persona. Al final sabrás cuántos vinieron de los que se registraron, y eso te sirve para el próximo cupo.',
        ]) + nota('Consejos nuestros.') },
      { h2: 'Después del evento', html: p('Agradece y, si quieres avisar del próximo, recuerda que eso ya es publicidad: la ley del consumidor permite que la persona te pida no recibirla, y debes respetarlo (artículos 17 y 18 Bis). Compara cuántos se registraron, cuántos pagaron y cuántos llegaron: con esos tres números ajustas el cupo y el precio del siguiente.') },
    ],
    faq: [
      { p: '¿Tengo que mostrar el precio final de la entrada?', r: 'Sí. El artículo 7 Bis de la Ley Federal de Protección al Consumidor pide informar de forma notoria el monto total a pagar, incluidas comisiones y cualquier cargo adicional.' },
      { p: '¿Qué pasa si cancelo mi evento?', r: 'Si el servicio no se presta por causas que te tocan, la ley del consumidor da derecho a una bonificación o compensación no menor al 20 % del precio pagado (artículos 92 Bis y 92 Ter). PROFECO recomienda reclamar el reembolso y, si no se da, presentar una queja.' },
      { p: '¿Cómo calculo cuántas entradas necesito vender?', r: 'Divide lo que te cuesta el evento entre el precio de la entrada. El resultado es cuántas necesitas para no perder; lo que vendas arriba de eso es tu ganancia.' },
    ],
    fuentes: [F.lfpc, F.profecoEventos, F.datos],
    relacionadas: [S.vuelve, S.agenda, S.vende],
  },
];

const NOTA_PIE = `Vorka Learn es la sección de guías de Vorka México. ${AVISO_NEGOCIO} No estamos afiliados al INEGI, a PROFECO ni al SAT. Vuelve, Agenda, Vende y Cupo son apps de Vorka México.`;

export const TEMA_NEGOCIO = crearTema({
  seccion: NEGOCIO, articulos: ARTICULOS_NEGOCIO, llamados: LLAMADO, actualizado: ACTUALIZADO_NEG, actualizadoTxt: ACTUALIZADO_TXT,
  notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las leyes y sus reglas pueden cambiar, así que confirma lo que aplica a tu caso.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_NEGOCIO}</b></p>`,
  notaPie: NOTA_PIE, compartirTexto: 'Compártela con alguien que tenga un negocio.', relTitulo: 'Más guías para tu negocio',
});
export const RUTA_NEGOCIO = TEMA_NEGOCIO.ruta;
export const rutaArticuloNegocio = TEMA_NEGOCIO.rutaDe;
export const paginaArticuloNegocio = TEMA_NEGOCIO.pagina;
export const urlsNegocio = TEMA_NEGOCIO.urls;
