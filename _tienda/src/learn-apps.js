// Vorka Learn › Crea tu app (vorka.mx/learn/apps/…): de la idea a vender una app, un SaaS o un producto digital desde
// México, en siete guías: validar, construir, cobrar, publicar en las tiendas de apps, lo legal y fiscal, primeros clientes
// y métricas, y dónde vender. Es un «tema» (no examen): plantilla común de src/learn/tema.js. Catálogo y rutas:
// src/learn/datos.js (TEMAS) y src/simulador/guias.js (TEMAS_T).
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto (cuotas, comisiones, reglas de las tiendas, leyes) sale de la fuente que el artículo cita en
//    «Fuentes»: páginas oficiales de Apple (developer.apple.com, apple.com/newsroom), Google Play (support.google.com),
//    Stripe y Mercado Pago (sus páginas de precios para México), MDN, y las leyes en diputados.gob.mx. Revisadas el 1 de
//    noviembre de 2026. Las cuotas y comisiones cambian: se dicen «al momento de escribir» y se enlaza la fuente.
//  - Lo que no pudimos verificar en una fuente oficial no se afirma: p. ej. las comisiones de Conekta (su página de precios
//    no estaba disponible) ni tiempos de revisión de las tiendas.
//  - Los números de los ejemplos son propios, inventados y marcados (la aritmética la revisa test/learn-apps.test.js).
//  - Un solo llamado final por artículo: el programa de creadores de la tienda de Vorka, descrito con lo que hace HOY
//    (src/creadores.js y legal/creadores/). Lo que no hace (suscripciones) se dice.
//  - La tienda de Vorka aparece en el cuerpo de UNA sola guía (dónde vender), en un bloque separado y marcado como de
//    Vorka (TIENDA_VORKA, abajo). Desde nov 2026 la tienda también vende suscripciones de creadores (ver creadores.js); si cambian sus reglas, se actualizan TIENDA_VORKA, TIENDA_VORKA_FAQ y LLAMADO.
//  - Aviso al final: información general; no es asesoría legal, fiscal ni contable.
import { p, ul, ol, tabla, nota, caja, a } from './learn/piezas.js';
import { crearTema, llamadoFinal } from './learn/tema.js';

export const ACTUALIZADO_APPS = '2026-11-01';
const ACTUALIZADO_TXT = 'noviembre de 2026';
export const AVISO_APPS = 'Información general con fines educativos; no es asesoría legal, fiscal ni contable.';

export const APPS = {
  clave: 'apps', nombre: 'Crea tu app', corto: 'Apps',
  indice: {
    titulo: 'Crea tu app: de la idea a vender tu SaaS',
    descripcion: 'Guías para crear y vender una app o un SaaS desde México: validar la idea, construirla, cobrar, publicar en App Store y Google Play, impuestos y métricas.',
    h1: 'Guías para crear y vender tu app',
    lead: 'El camino completo para quien empieza: validar antes de programar, construir barato, cobrar en México, publicar en las tiendas de apps, cumplir con lo legal y fiscal, y conseguir y medir a tus primeros clientes.',
  },
};

// ---------- fuentes (todas revisadas el 1 de noviembre de 2026) ----------
const F = {
  appleProg: { nombre: 'Apple Developer: What’s included (cuota del Apple Developer Program)', url: 'https://developer.apple.com/programs/whats-included/' },
  appleSmall: { nombre: 'Apple Developer: App Store Small Business Program', url: 'https://developer.apple.com/app-store/small-business-program/' },
  appleNews: { nombre: 'Apple Newsroom: Apple announces App Store Small Business Program (18 de noviembre de 2020; comisión estándar)', url: 'https://www.apple.com/newsroom/2020/11/apple-announces-app-store-small-business-program/' },
  appleSubs: { nombre: 'Apple Developer: Auto-renewable subscriptions (ingresos del primer año y después de un año)', url: 'https://developer.apple.com/app-store/subscriptions/' },
  appleGuias: { nombre: 'Apple Developer: App Review Guidelines (guías 3.1.1, 3.1.1(a), 3.1.3(e), 4.2 y 5.1.1)', url: 'https://developer.apple.com/app-store/review/guidelines/' },
  appleBorrar: { nombre: 'Apple Developer: Offering account deletion in your app (guía 5.1.1(v))', url: 'https://developer.apple.com/support/offering-account-deletion-in-your-app/' },
  playAlta: { nombre: 'Ayuda de Play Console: Cómo usar Play Console (registro y tarifa)', url: 'https://support.google.com/googleplay/android-developer/answer/6112435?hl=es-419' },
  playPruebas: { nombre: 'Ayuda de Play Console: Requisitos de pruebas de apps para las cuentas de desarrollador personales nuevas', url: 'https://support.google.com/googleplay/android-developer/answer/14151465?hl=es-419' },
  playCargos: { nombre: 'Ayuda de Play Console: Cargos de servicio', url: 'https://support.google.com/googleplay/android-developer/answer/112622?hl=es-419' },
  playPagos: { nombre: 'Ayuda de Play Console: Política de Pagos (sistema de facturación de Google Play)', url: 'https://support.google.com/googleplay/android-developer/answer/9858738?hl=es-419' },
  playBorrar: { nombre: 'Ayuda de Play Console: Requisitos de eliminación de cuentas', url: 'https://support.google.com/googleplay/android-developer/answer/13327111?hl=es-419' },
  stripe: { nombre: 'Stripe México: Precios (tarjetas, transferencias, Billing; sin IVA)', url: 'https://stripe.com/mx/pricing' },
  stripeLocal: { nombre: 'Stripe México: Precios de métodos de pago locales (OXXO y transferencias bancarias)', url: 'https://stripe.com/mx/pricing/local-payment-methods' },
  mp: { nombre: 'Mercado Pago México: Link de pago, comisiones', url: 'https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago' },
  mdnPwa: { nombre: 'MDN Web Docs: Aplicaciones web progresivas (PWA)', url: 'https://developer.mozilla.org/es/docs/Web/Progressive_web_apps' },
  lfpc: { nombre: 'Ley Federal de Protección al Consumidor (artículos 7 Bis y 76 Bis, fracciones III, V, VI, VIII y IX; última reforma DOF 12-12-2025)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf' },
  datos: { nombre: 'Ley Federal de Protección de Datos Personales en Posesión de los Particulares (DOF 20-03-2025, última reforma DOF 14-11-2025; artículos 2, 14 y 15)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf' },
  lisr: { nombre: 'Ley del Impuesto sobre la Renta (artículos 113-A y 113-E; última reforma DOF 01-04-2024)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf' },
  liva: { nombre: 'Ley del Impuesto al Valor Agregado (artículos 1o., 1o.-A BIS y 18-B; última reforma DOF 12-11-2021)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf' },
  vorka: { nombre: 'Vorka México: Términos para creadores (actualizados el 15 de octubre de 2026)', url: 'https://vorka.mx/legal/creadores/' },
};

// ---------- piezas ----------
const ejemplo = (titulo, html) => `<div class="gu-ej"><span class="gu-ej-t">Ejemplo propio de Vorka Learn, con cifras inventadas</span>
<p class="gu-ej-p">${titulo}</p>${html}</div>`;
export const S = {
  idea: 'que-es-un-saas-y-como-validar-tu-idea',
  construir: 'como-construir-tu-primera-version',
  cobrar: 'como-cobrar-tu-app-en-mexico',
  tiendas: 'como-publicar-en-app-store-y-google-play',
  legal: 'lo-legal-y-fiscal-de-vender-una-app',
  clientes: 'primeros-clientes-y-metricas-saas',
  vender: 'donde-vender-tu-app-o-producto-digital',
};
const r = slug => `/learn/apps/${slug}/`;

// La tienda de Vorka, con lo que hace HOY (src/creadores.js, legal/creadores/). Bloque separado a propósito: cuando la
// tienda acepte suscripciones de apps de terceros, se cambia aquí (y en LLAMADO) sin tocar el resto de la guía.
export const TIENDA_VORKA = `<div class="gu-caja lr-tienda-vorka" id="tienda-vorka"><b>Es de Vorka México, quien publica esta guía</b>
${p('La tienda de Vorka México, en vorka.mx/tienda, ya está en línea y recibe visitas, y acepta productos de creadores. Esto es lo que permite hoy, según sus términos para creadores:')}
${ul([
  '<b>Qué se vende:</b> productos digitales que se entregan como archivos: plantillas, guías, cuadernos de trabajo, calculadoras, kits. Si lo que hiciste es una plantilla (de hoja de cálculo, de Notion, un kit de código), entra así.',
  '<b>Precio:</b> lo pones tú, con un mínimo de $20 MXN.',
  '<b>Comisión:</b> te quedas con el 80 % de cada venta, menos la comisión del procesador de pagos (Vorka cobra 20 %, salvo acuerdo distinto).',
  '<b>Pagos:</b> con Stripe, 7 días después de cada venta (al terminar el plazo de reembolso), a tu cuenta bancaria. Tus compradores pagan con tarjeta, OXXO o SPEI.',
  '<b>Revisión:</b> Vorka aprueba tu solicitud y revisa cada producto antes de publicarlo. Tú conservas la propiedad de lo que vendes.',
  '<b>Apps y SaaS por suscripción:</b> también puedes vender tu app con cobro mensual o anual. Tú la alojas y das el soporte; la tienda cobra cada mes o cada año, tu app consulta con una llave quién está al corriente y recibe un aviso firmado en cada alta, renovación, pago fallido o cancelación. Vorka se queda con al menos 20 % de cada cobro, también en las renovaciones, y Stripe te paga tu parte 7 días después de cada cobro mensual (11 en los anuales).',
  '<b>Lo que no hace:</b> no aloja tu app ni la programa por ti.',
])}
${p('Los detalles técnicos para conectar tu app están en vorka.mx/creadores/docs, y las reglas completas en los términos para creadores.')}
</div>`;

// La pregunta frecuente de «dónde vender» sobre la tienda de Vorka (se actualiza junto con TIENDA_VORKA)
export const TIENDA_VORKA_FAQ = { p: '¿Puedo vender mi app en la tienda de Vorka México?', r: 'Hoy la tienda de Vorka acepta productos digitales que se entregan como archivo, como plantillas, guías, kits o calculadoras, con revisión previa, precio mínimo de $20 MXN y 80 % para el creador menos la comisión del procesador de pagos. También vende apps y SaaS por suscripción mensual o anual: tú alojas la app, la tienda cobra y Vorka se queda con al menos 20 % de cada cobro, incluidas las renovaciones.' };

// El único llamado final (el mismo en las siete guías): el programa de creadores, descrito con lo que hace hoy (descargables y, desde nov 2026, suscripciones).
const LLAMADO = {
  creadores: llamadoFinal('Vende en la tienda de Vorka', '¿Ya tienes algo listo para vender?',
    'Recuerda que puedes publicarlo en la tienda de Vorka México (vorka.mx/tienda), que ya recibe visitas. Hoy acepta productos digitales que se entregan como archivo (plantillas, guías, kits, calculadoras): tú pones el precio, te quedas con el 80 % menos la comisión del procesador de pagos y Stripe te paga 7 días después de cada venta. Si tu app se cobra cada mes o cada año, también: la tienda cobra la suscripción y Vorka se queda con al menos 20 % de cada cobro. Cada producto se revisa antes de publicarse.',
    '/creadores', 'Conoce el programa para creadores'),
};

// ---------- los artículos ----------
export const ARTICULOS_APPS = [
  // =============== 1. Qué es y cómo validar ===============
  {
    slug: S.idea, llamado: 'creadores',
    titulo: 'Qué es un SaaS y cómo validar tu idea',
    descripcion: 'App, SaaS o producto digital: en qué se distinguen y cómo comprobar que alguien pagaría por tu idea antes de escribir una línea de código.',
    h1: 'Qué es un SaaS y cómo validar tu idea antes de programar',
    lead: 'La mayoría de las apps que no venden no fallan por el código, sino porque nadie las necesitaba tanto como para pagar. Antes de construir, conviene saber qué tipo de producto quieres hacer y comprobar, con personas reales, que el problema existe y que alguien pagaría por resolverlo.',
    secciones: [
      { h2: 'App, SaaS y producto digital: no son lo mismo', html: tabla(['Tipo', 'Qué es', 'Cómo se cobra casi siempre'], [
          ['App móvil', 'Un programa que se instala en el celular desde App Store o Google Play.', 'Gratis con compras dentro de la app, pago al descargar o suscripción.'],
          ['App web o PWA', 'Funciona en el navegador; una PWA además se puede instalar en la pantalla de inicio sin pasar por una tienda de apps.', 'Suscripción o pago único, con tu propia pasarela.'],
          ['SaaS (software como servicio)', 'Software que vive en internet y se usa con una cuenta: el cliente no lo instala ni lo mantiene, solo entra.', 'Suscripción mensual o anual.'],
          ['Producto digital', 'Algo que se entrega como archivo: plantilla, guía, curso grabado, kit de código.', 'Pago único.'],
        ], 'Tabla de consejo nuestro para ubicarte; no son categorías legales. La definición de PWA es de MDN Web Docs.')
        + p('Un SaaS es casi siempre una app web con suscripción. Una app móvil puede ser la puerta de entrada a un SaaS (la misma cuenta en el celular y en la computadora). Y un producto digital es la forma más sencilla de empezar a vender lo que sabes, sin mantener servidores.') },
      { h2: 'Paso 1: describe el problema en una frase', html: p('Esto es consejo nuestro. Antes de pensar en pantallas, escribe: «<b>[quién]</b> pierde <b>[tiempo o dinero]</b> cuando <b>[situación]</b>». Por ejemplo: «Las dueñas de estéticas pierden citas porque confirman a mano por mensaje».')
        + ul([
          '<b>Quién</b> debe ser alguien que puedas encontrar y con quien puedas hablar esta semana.',
          '<b>El costo</b> tiene que ser claro para esa persona, no solo para ti.',
          '<b>La situación</b> tiene que repetirse: un problema que pasa una vez al año rara vez sostiene una suscripción.',
        ]) },
      { h2: 'Paso 2: averigua quién paga', html: p('Quien usa la app no siempre es quien paga. En una app escolar usa el alumno pero paga la familia o la escuela; en una de inventarios usa el empleado pero paga el dueño. Esto es consejo nuestro: identifica a quien decide la compra y habla con esa persona.')
        + caja('Pregunta útil', p('«¿Cómo lo resuelves hoy y cuánto te cuesta?» Si hoy lo resuelven con una libreta y no les duele, tu app compite con algo gratis. Si ya pagan por una solución que no les gusta, hay mercado.')) },
      { h2: 'Paso 3: habla con 10 personas antes de programar', html: p('Esto es consejo nuestro, sin cifra oficial detrás: diez conversaciones bastan para ver si el problema se repite. Reglas para que sirvan:')
        + ol([
          ['Pregunta por el pasado, no por el futuro', '«¿Cuándo fue la última vez que te pasó?» vale más que «¿usarías una app que…?», porque a casi todos les da pena decir que no.'],
          ['No vendas en la entrevista', 'Escucha cómo lo resuelven hoy, cuánto les cuesta y qué han intentado.'],
          ['Anota frases textuales', 'Las palabras que usan tus clientes son las que después van en tu página.'],
          ['Cierra con un compromiso pequeño', 'Que te dejen su correo para avisarles, que agenden una prueba o que aparten con un anticipo.'],
        ]) },
      { h2: 'Paso 4: una página y una lista de espera', html: p('Con lo que aprendiste, arma una página sencilla: el problema en una frase, cómo lo resuelves, un precio tentativo y un botón para unirse a la lista de espera. No necesitas la app para esto; existen constructores de páginas sin código.')
        + p('Si en esa página pides nombre y correo, ya estás tratando datos personales: la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (publicada en 2025) te pide un <b>aviso de privacidad</b> que diga, al menos, quién eres y tu domicilio, qué datos pides, para qué los usarás, cómo limitar su uso y cómo ejercer los derechos de acceso, rectificación, cancelación y oposición (artículos 14 y 15).')
        + ejemplo('Mandas tu página a 200 personas del giro que elegiste; 30 se anotan en la lista y 6 aceptan apartar con un anticipo de $100. ¿Qué te dicen esos números?', ul([
          'Se anotó el 30 ÷ 200 = <b>15 %</b> de quienes la vieron.',
          'Apartó con dinero el 6 ÷ 30 = <b>20 %</b> de la lista.',
          'Juntaste 6 × $100 = <b>$600</b> de personas que ya pagaron por algo que aún no existe.',
        ]) + nota('El anticipo es la señal más fuerte: pagar cuesta más que dejar un correo.'))
        + p('Si cobras por adelantado, recuerda que en una venta en línea la Ley Federal de Protección al Consumidor te pide informar antes los términos, condiciones, costos, cargos adicionales y formas de pago (artículo 76 Bis, fracción V). Consejo nuestro: di qué entregas, cuándo, y cómo devuelves el dinero si no cumples.') },
      { h2: 'Cuándo seguir y cuándo cambiar', html: p('Esto es consejo nuestro. Sigue adelante si varias personas describen el mismo problema con sus propias palabras y alguna ya puso dinero o tiempo. Cambia la idea (no te rindas) si todos dicen «está padre» pero nadie deja su correo ni aparta. Muchas apps exitosas resolvieron al final un problema vecino del que empezaron.') },
    ],
    faq: [
      { p: '¿Cuál es la diferencia entre una app y un SaaS?', r: 'Una app es un programa que usas en el celular o en la computadora. Un SaaS es software que vive en internet y se usa con una cuenta, casi siempre con suscripción. Una app móvil puede ser la puerta de entrada a un SaaS.' },
      { p: '¿Necesito saber programar para validar mi idea?', r: 'No. Para validar basta con hablar con posibles clientes y armar una página con lista de espera. Programar viene después, cuando ya sabes que alguien pagaría.' },
      { p: '¿Necesito aviso de privacidad para una lista de espera?', r: 'Si pides datos personales como nombre y correo, sí. La Ley Federal de Protección de Datos Personales en Posesión de los Particulares pide informar con un aviso de privacidad quién eres, qué datos pides, para qué y cómo ejercer los derechos sobre ellos (artículos 14 y 15).' },
      { p: '¿Con cuántas personas debo hablar?', r: 'Como consejo nuestro, unas diez conversaciones bastan para ver si el problema se repite. Lo importante es preguntar por lo que ya les pasó, no por lo que harían.' },
    ],
    fuentes: [F.mdnPwa, F.datos, F.lfpc],
    relacionadas: [S.construir, S.cobrar, S.clientes],
  },

  // =============== 2. Construir ===============
  {
    slug: S.construir, llamado: 'creadores',
    titulo: 'Cómo construir tu app: sin código, con código o IA',
    descripcion: 'Qué es un MVP, cuándo usar herramientas sin código, cuándo programar, cómo ayudarte con IA y cuánto cuesta de verdad poner una app en línea.',
    h1: 'Cómo construir la primera versión de tu app: sin código, con código o con IA',
    lead: 'La primera versión de tu app no tiene que ser bonita ni completa: tiene que resolver el problema principal para tus primeros clientes. Aquí están los tres caminos para construirla, cómo usar la inteligencia artificial sin meterte en problemas y los costos que sí son seguros.',
    secciones: [
      { h2: 'Qué es un MVP (y qué no)', html: p('Un MVP (producto mínimo viable) es la versión más pequeña de tu app que ya le resuelve el problema principal a alguien y por la que esa persona pagaría. No es un prototipo que nadie usa ni una app a medias llena de errores.')
        + p('Esto es consejo nuestro: haz una lista de todo lo que quieres que haga tu app y tacha todo lo que no sea indispensable para resolver el problema de la frase del paso 1. Lo que queda es tu MVP. Iniciar sesión, cobrar y la función principal suelen quedarse; los reportes, los temas de colores y las integraciones casi siempre pueden esperar.') },
      { h2: 'Tres caminos para construir', html: tabla(['Camino', 'Le queda a…', 'Lo que hay que cuidar'], [
          ['Sin código', 'Quien no programa y quiere probar rápido: formularios, bases de datos visuales, constructores de apps y páginas.', 'Dependes de la plataforma: sus precios, sus límites y si puedes llevarte tus datos.'],
          ['Con poco código', 'Quien sabe algo de programación: una plantilla o un servicio que ya trae usuarios, base de datos y pagos, y tú agregas lo propio.', 'Entender lo que copias; mantenerlo actualizado.'],
          ['Con código', 'Quien programa o tiene socio técnico, cuando el producto necesita algo que las herramientas no hacen.', 'Más tiempo al inicio; la seguridad y el mantenimiento son tuyos.'],
        ], 'Tabla de consejo nuestro.')
        + p('No hay un camino correcto. Muchas personas validan sin código y reescriben cuando ya tienen clientes que pagan. Lo que importa es llegar pronto a alguien que use la app.') },
      { h2: 'Con ayuda de inteligencia artificial', html: p('Las herramientas de IA pueden escribir código, explicar errores, redactar textos y proponer pantallas. Ayudan mucho a quien empieza, pero el responsable de la app sigues siendo tú. Esto es consejo nuestro:')
        + ul([
          '<b>Revisa y prueba todo</b> lo que te genera, sobre todo inicio de sesión, cobros y permisos: ahí un error cuesta dinero o expone datos.',
          '<b>No pegues datos de tus clientes</b> ni contraseñas o llaves secretas en una herramienta de IA.',
          '<b>Pide explicaciones</b>, no solo código: si no entiendes una parte, no podrás arreglarla cuando falle.',
          '<b>Guarda versiones</b> (por ejemplo, con un sistema de control de versiones) para poder regresar cuando un cambio rompa algo.',
        ]) },
      { h2: 'Un stack sencillo para empezar', html: p('«Stack» son las piezas con que se arma tu app. Para una app web o un SaaS pequeño, casi siempre necesitas:')
        + ol([
          ['Dominio', 'El nombre de tu sitio (tuapp.mx o tuapp.com). Se renueva cada año.'],
          ['Hosting', 'Donde vive tu app. Varios proveedores tienen un nivel gratuito para empezar; revisa sus límites antes de depender de él.'],
          ['Base de datos', 'Donde guardas cuentas y datos. Muchos servicios la incluyen con el hosting o con el inicio de sesión.'],
          ['Inicio de sesión', 'Mejor uno ya probado que uno hecho por ti desde cero.'],
          ['Pagos', 'Una pasarela como Stripe o Mercado Pago (lo vemos en la guía de cobrar).'],
          ['Correo', 'Para confirmar cuentas y mandar recibos.'],
        ])
        + p(`Si tu app web cumple los requisitos de una PWA (HTTPS, un service worker y un manifiesto), tus usuarios pueden instalarla en la pantalla de inicio sin pasar por una tienda de apps, según MDN. Lo explicamos en ${a(r(S.tiendas), 'cómo publicar en App Store y Google Play')}.`) },
      { h2: 'Cuánto cuesta: lo seguro y lo variable', html: p('Al momento de escribir (noviembre de 2026), estos son los costos que publican los propios proveedores:')
        + tabla(['Concepto', 'Costo publicado', 'Fuente'], [
          ['Cuenta de Apple para publicar en App Store', '99 dólares por año (o su equivalente en moneda local donde aplica).', 'Apple Developer Program'],
          ['Cuenta de Google Play Console', 'Tarifa única de registro de 25 dólares.', 'Ayuda de Play Console'],
          ['Cobrar con tarjeta nacional en Stripe', '3.6 % + $3.00 MXN por cobro exitoso, sin IVA.', 'Stripe México'],
          ['Cobrar con Mercado Pago (link de pago, dinero al instante)', '3.49 % + $4.00 por venta; a la tarifa fija se suma IVA.', 'Mercado Pago México'],
        ], 'Cuotas y comisiones de las páginas oficiales enlazadas en «Fuentes»; pueden cambiar.')
        + p('Lo variable: dominio, hosting, base de datos, correo y herramientas sin código dependen del proveedor y del plan, y cambian seguido, así que no te damos cifras. Consejo nuestro: haz una tabla con lo que pagarás al mes con 10, 100 y 1,000 usuarios antes de elegir; algunas herramientas son baratas al inicio y caras al crecer.') },
    ],
    faq: [
      { p: '¿Qué es un MVP?', r: 'Es la versión más pequeña de tu app que ya le resuelve el problema principal a alguien y por la que esa persona pagaría. No es una app a medias ni un prototipo que nadie usa.' },
      { p: '¿Puedo hacer una app sin saber programar?', r: 'Sí, con herramientas sin código puedes construir y validar una primera versión. Cuida depender de la plataforma: sus precios, sus límites y si puedes llevarte tus datos.' },
      { p: '¿Cuánto cuesta publicar una app en las tiendas?', r: 'Al momento de escribir, Apple cobra 99 dólares por año por su programa de desarrolladores y Google Play una tarifa única de registro de 25 dólares. A eso se suman tu hosting, tu dominio y las comisiones por cobrar.' },
      { p: '¿Puedo usar inteligencia artificial para programar mi app?', r: 'Sí, ayuda mucho, pero revisa y prueba lo que genera, sobre todo inicio de sesión, cobros y permisos, y no pegues datos de clientes ni llaves secretas en la herramienta.' },
    ],
    fuentes: [F.appleProg, F.playAlta, F.stripe, F.mp, F.mdnPwa],
    relacionadas: [S.cobrar, S.tiendas, S.idea],
  },

  // =============== 3. Cobrar ===============
  {
    slug: S.cobrar, llamado: 'creadores',
    titulo: 'Cómo cobrar tu app en México: modelos y pasarelas',
    descripcion: 'Suscripción, pago único o freemium; cómo poner precio, y cuánto cobran Stripe y Mercado Pago por tarjeta, OXXO y transferencia en México.',
    h1: 'Cómo cobrar tu app en México: suscripción, pago único y pasarelas de pago',
    lead: 'Cobrar bien es tan importante como construir bien. Aquí comparamos los modelos de cobro, cómo ponerle precio a tu app, cuánto cobran las pasarelas en México por tarjeta, OXXO y transferencia, y lo que pide la ley cuando cobras de forma automática cada mes.',
    secciones: [
      { h2: 'Suscripción, pago único o freemium', html: tabla(['Modelo', 'Cómo funciona', 'Le queda a…'], [
          ['Suscripción', 'El cliente paga cada mes o cada año mientras usa la app.', 'Un SaaS o una app que da valor continuo y tiene costos continuos (servidores, soporte).'],
          ['Pago único', 'Se paga una vez y se usa para siempre (o por una versión).', 'Productos digitales, plantillas, herramientas que no cambian mucho.'],
          ['Freemium', 'Una versión gratis con límites y una de pago con más funciones.', 'Apps que se entienden mejor usándolas; necesita muchos usuarios gratis para que pocos paguen.'],
        ], 'Tabla de consejo nuestro.')
        + p('Esto es consejo nuestro: si tu app tiene costos cada mes (servidores, correos, soporte), un pago único te puede dejar en números rojos con el tiempo. Y si eliges freemium, define desde el inicio qué límite hace que alguien quiera pagar.') },
      { h2: 'Cómo ponerle precio', html: ol([
          ['Empieza por el valor, no por tu costo', 'Pregúntale a tus primeros clientes cuánto les cuesta hoy el problema (en tiempo o dinero). Tu precio debe ser una fracción clara de eso.'],
          ['Compara con lo que ya pagan', 'Si hoy pagan una herramienta parecida, tu precio se medirá contra esa.'],
          ['Ofrece pocas opciones', 'Dos o tres planes son más fáciles de elegir que seis.'],
          ['Ofrece pago anual', 'Si ofreces descuento por pagar el año, cobras por adelantado y el cliente se queda más tiempo.'],
        ])
        + p('Consejos nuestros. Una regla que sí es ley: debes informar de forma notoria y visible el <b>monto total a pagar</b>, con impuestos, comisiones y cualquier cargo adicional (artículo 7 Bis de la Ley Federal de Protección al Consumidor).') },
      { h2: 'Las pasarelas en México y lo que cobran', html: p('Una pasarela cobra a tu cliente y te deposita, a cambio de una comisión. Estas son las tarifas que publican, al momento de escribir (noviembre de 2026):')
        + tabla(['Pasarela y medio de pago', 'Comisión publicada'], [
          ['Stripe · tarjeta nacional', '3.6 % + $3.00 MXN por cobro exitoso'],
          ['Stripe · tarjeta internacional', '0.5 % adicional (y 2 % más si hay conversión de moneda obligatoria)'],
          ['Stripe · OXXO', '4 % + $3.00 MXN'],
          ['Stripe · transferencia bancaria en México', '$7.00 MXN por transacción + IVA'],
          ['Stripe Billing (para suscripciones)', '0.7 % del volumen cobrado con Billing, además de la comisión del medio de pago'],
          ['Mercado Pago · link de pago, tarjeta o saldo, dinero al instante', '3.49 % + $4.00'],
          ['Mercado Pago · mismo, dinero en 7 días / en 30 días', '3.19 % + $4.00 / 2.95 % + $4.00'],
        ], 'Fuentes: páginas de precios de Stripe México y de Link de pago de Mercado Pago México. Stripe aclara que sus comisiones excluyen el IVA; Mercado Pago indica que a la tarifa fija de $4.00 se suma IVA. Para OXXO y efectivo, Mercado Pago muestra dos cifras distintas en la misma página (3.49 % y 3.79 % + $4.00), así que confírmala en tu cuenta.')
        + p('También existe Conekta, una pasarela mexicana que acepta tarjeta, OXXO y SPEI. No pudimos consultar sus tarifas en su página oficial al escribir esta guía, así que no las incluimos: pídeselas directamente.') },
      { h2: 'Ejemplo: cuánto te queda de una suscripción', html: ejemplo('Tu SaaS cuesta $199 al mes y lo cobras con tarjeta nacional en Stripe, usando Stripe Billing. ¿Cuánto se va en comisiones de cada cobro, antes de IVA?', ul([
          'Comisión por tarjeta: 3.6 % de $199 = $7.16, más $3.00 = <b>$10.16</b>.',
          'Stripe Billing: 0.7 % de $199 = <b>$1.39</b>.',
          'Total de comisiones: $10.16 + $1.39 = <b>$11.55</b>, alrededor del 5.8 % del precio.',
          'Te quedan $199 − $11.55 = <b>$187.45</b>, antes del IVA de las comisiones y de tus propios impuestos.',
        ]) + nota('Con un precio muy bajo, la parte fija ($3.00) pesa más: en un cobro de $29, la comisión por tarjeta sería 3.6 % de $29 = $1.04, más $3.00 = $4.04, casi el 14 %.'))
        + p('Si vendes tu app dentro de App Store o Google Play, la comisión es otra: la de la tienda. La explicamos en la guía de publicar.') },
      { h2: 'Si cobras cada mes: lo que pide la ley', html: p('En diciembre de 2025 se reformó la Ley Federal de Protección al Consumidor para las compras por medios electrónicos. Si tu app se cobra sola cada mes, el artículo 76 Bis pide:')
        + ul([
          '<b>Informar de forma clara, destacada y accesible</b> si hay cobros automáticos recurrentes, cada cuándo, cuánto y en qué fecha (fracción VIII).',
          '<b>Consentimiento expreso e informado</b> de la persona para esos cobros (fracción VIII).',
          '<b>Avisar al menos con cinco días naturales de anticipación</b> cuando, según el contrato, el servicio se renueve automáticamente, y permitir cancelar sin penalización (fracción VIII).',
          '<b>Un mecanismo para cancelar el servicio, suscripción o membresía de manera inmediata</b> (fracción IX).',
        ])
        + caja('En la práctica', p('Consejo nuestro: un botón de «Cancelar suscripción» visible en la configuración de la cuenta, un correo antes de cada renovación anual y una casilla (no marcada de antemano) para aceptar los cobros automáticos.')) },
    ],
    faq: [
      { p: '¿Cuánto cobra Stripe en México?', r: 'Al momento de escribir, Stripe publica 3.6 % + $3.00 MXN por cobro exitoso con tarjeta nacional, 4 % + $3.00 MXN con OXXO y $7.00 MXN más IVA por transferencia bancaria en México. Para suscripciones, Stripe Billing suma 0.7 % del volumen. Sus comisiones no incluyen IVA.' },
      { p: '¿Cuánto cobra Mercado Pago por link de pago?', r: 'Al momento de escribir, 3.49 % + $4.00 por venta si recibes el dinero al instante, 3.19 % + $4.00 en 7 días y 2.95 % + $4.00 en 30 días, con tarjeta o saldo. A la tarifa fija se suma IVA.' },
      { p: '¿Me conviene suscripción o pago único?', r: 'Como consejo nuestro: suscripción si tu app da valor y tiene costos cada mes; pago único si es un producto que no cambia mucho, como una plantilla.' },
      { p: '¿Qué pide la ley si cobro una suscripción automática?', r: 'La Ley Federal de Protección al Consumidor (artículo 76 Bis, reformado en diciembre de 2025) pide informar con claridad los cobros recurrentes, obtener consentimiento expreso, avisar al menos cinco días naturales antes de una renovación automática y permitir cancelar de inmediato.' },
    ],
    fuentes: [F.stripe, F.stripeLocal, F.mp, F.lfpc],
    relacionadas: [S.tiendas, S.legal, S.clientes],
  },

  // =============== 4. App Store y Google Play ===============
  {
    slug: S.tiendas, llamado: 'creadores',
    titulo: 'Cómo publicar tu app en App Store y Google Play',
    descripcion: 'Cuentas de desarrollador y su costo, pruebas que pide Google, privacidad, borrado de cuenta, compras dentro de la app, comisiones y la opción PWA.',
    h1: 'Cómo publicar tu app en App Store y Google Play',
    lead: 'Publicar en las tiendas de apps te da confianza y que te encuentren, pero tiene costos, reglas y una comisión sobre lo que vendes dentro de la app. Esto es lo que piden Apple y Google al momento de escribir, y cuándo conviene una PWA en su lugar.',
    secciones: [
      { h2: 'Las cuentas de desarrollador', html: tabla(['', 'Apple (App Store)', 'Google (Google Play)'], [
          ['Costo', '99 dólares por año de membresía, o su equivalente en moneda local donde aplica.', 'Tarifa única de registro de 25 dólares.'],
          ['Requisitos que destacan', 'Organizaciones sin fines de lucro, instituciones educativas acreditadas y entidades de gobierno elegibles pueden pedir que se les exente la cuota.', 'Tener al menos 18 años; las cuentas personales deben comprobar que tienen acceso a un dispositivo Android.'],
        ], 'Fuentes: Apple Developer Program y Ayuda de Play Console, consultadas en noviembre de 2026.')
        + p('Puedes registrarte como persona o como organización. Esto es consejo nuestro: si ya tienes una empresa, regístrala como organización desde el inicio; el nombre que verán tus clientes como desarrollador sale de ahí.') },
      { h2: 'Google Play: 12 personas probando durante 14 días', html: p('Si tu cuenta personal de Google Play se creó después del 13 de noviembre de 2023, antes de pedir la publicación en producción debes hacer una <b>prueba cerrada</b> con al menos <b>12 verificadores</b> que hayan aceptado participar <b>de forma continua durante al menos 14 días</b>. Los 14 días deben ser consecutivos y quien deje de participar antes no cuenta.')
        + p('Consejo nuestro: aprovecha esa prueba. Invita a las personas de tu lista de espera; además de cumplir el requisito, te dirán qué no se entiende.') },
      { h2: 'Lo que revisan: privacidad, borrado de cuenta y que sea una app de verdad', html: ul([
          '<b>Política de privacidad.</b> Apple pide un enlace a tu política de privacidad en los datos de la app y dentro de la app, en un lugar fácil de encontrar, que diga qué datos recaba, cómo y para qué (guía 5.1.1(i)). En México, además, la ley de datos personales te pide un aviso de privacidad (lo vemos en la guía de lo legal).',
          '<b>Borrar la cuenta desde la app.</b> Si tu app permite crear cuentas, Apple exige que la persona pueda iniciar el borrado de su cuenta dentro de la app; desactivarla no basta (guía 5.1.1(v)). Google pide una ruta dentro de la app y, además, un enlace web para pedir el borrado de la cuenta y sus datos.',
          '<b>Más que una página web.</b> Apple pide que tu app tenga funciones, contenido e interfaz que la hagan más que un sitio web reempaquetado (guía 4.2).',
        ]) + nota('No te damos un tiempo de revisión porque no lo encontramos garantizado en las fuentes oficiales; las tiendas pueden rechazar tu app y pedir cambios. Consejo nuestro: no anuncies una fecha de lanzamiento hasta que la app esté aprobada.') },
      { h2: 'Compras dentro de la app y lo que cobran las tiendas', html: p('Si tu app desbloquea funciones o contenido digital (suscripciones, versión completa, contenido premium), las dos tiendas piden usar su propio sistema de pago: Apple, la compra dentro de la app (guía 3.1.1); Google, el sistema de facturación de Google Play. Si lo que vendes es un <b>bien o servicio físico</b> que se usa fuera de la app (un corte de cabello, un pedido de comida), se cobra con otros medios, no con el de la tienda (guía 3.1.3(e) de Apple y la política de pagos de Google).')
        + tabla(['', 'Apple', 'Google Play (en México)'], [
          ['Comisión estándar', '30 % en apps que venden bienes y servicios digitales, según el anuncio de Apple de 2020.', '15 % sobre el primer millón de dólares de ingresos al año y 30 % sobre lo que pase de ahí.'],
          ['Si eres pequeño', '15 % con el App Store Small Business Program, si tus ingresos netos del año anterior fueron de hasta 1 millón de dólares (y no los pasas en el año en curso). Hay que inscribirse.', 'El 15 % aplica al primer millón de dólares de cada año; revisa en Play Console si tu cuenta necesita algún paso para que se aplique.'],
          ['Suscripciones', 'Recibes 70 % del precio el primer año de servicio pagado de cada cliente y 85 % después; en el Small Business Program recibes 85 % desde el inicio (siempre menos impuestos).', '15 % en las renovaciones automáticas de suscripciones.'],
        ], 'Al momento de escribir (noviembre de 2026). Google aplica otro esquema en Estados Unidos, el Espacio Económico Europeo, Reino Unido, Australia y Japón; en los demás mercados, como México, sigue este «hasta que se implemente a nivel mundial» su actualización anunciada. Revisa las fuentes antes de calcular tus números.')
        + p('Fuera de la tienda de Estados Unidos y de algunos países con permisos especiales, las reglas de Apple no permiten que la app incluya botones o enlaces que lleven a pagar por fuera de la compra dentro de la app (guía 3.1.1(a)). Si piensas cobrar en tu sitio web, revisa esa guía vigente antes de diseñar tu app.') },
      { h2: 'La alternativa: una PWA', html: p('Una aplicación web progresiva (PWA) se instala desde el navegador en la pantalla de inicio, sin pasar por una tienda de apps (MDN Web Docs). Para muchos SaaS es la forma más barata de empezar:')
        + tabla(['', 'PWA', 'App en las tiendas'], [
          ['Costo de cuenta', 'Ninguno extra (tu hosting y dominio).', '99 dólares al año (Apple) y 25 dólares una vez (Google).'],
          ['Cobro', 'Con tu pasarela; pagas su comisión.', 'Lo digital, con el sistema de la tienda y su comisión.'],
          ['Actualizar', 'Publicas y ya está.', 'Cada versión pasa por revisión.'],
          ['Que te encuentren', 'Por buscadores y tus propios canales.', 'También dentro de las tiendas.'],
        ], 'Tabla de consejo nuestro con los costos de las fuentes citadas.')
        + p('Consejo nuestro: empieza con una PWA para validar y cobrar, y publica en las tiendas cuando tus clientes te lo pidan o cuando necesites funciones del celular que el navegador no da.') },
    ],
    faq: [
      { p: '¿Cuánto cuesta publicar una app en App Store?', r: 'Al momento de escribir, el Apple Developer Program cuesta 99 dólares por año de membresía, o su equivalente en moneda local donde aplica. Algunas organizaciones sin fines de lucro, escuelas y entidades de gobierno pueden pedir la exención.' },
      { p: '¿Cuánto cuesta publicar en Google Play?', r: 'Una tarifa única de registro de 25 dólares. Si tu cuenta es personal y se creó después del 13 de noviembre de 2023, antes de publicar debes hacer una prueba cerrada con al menos 12 verificadores durante 14 días seguidos.' },
      { p: '¿Qué comisión cobran Apple y Google?', r: 'Apple cobra 30 % de comisión estándar en bienes y servicios digitales y 15 % en su Small Business Program (ingresos netos de hasta 1 millón de dólares). Google Play, en México, 15 % sobre el primer millón de dólares al año, 30 % después y 15 % en renovaciones de suscripciones.' },
      { p: '¿Mi app tiene que permitir borrar la cuenta?', r: 'Sí, si permite crear cuentas. Apple exige que se pueda iniciar el borrado dentro de la app y Google pide una ruta en la app y un enlace web para pedirlo.' },
    ],
    fuentes: [F.appleProg, F.appleGuias, F.appleBorrar, F.appleSmall, F.appleNews, F.appleSubs, F.playAlta, F.playPruebas, F.playCargos, F.playPagos, F.playBorrar, F.mdnPwa],
    relacionadas: [S.cobrar, S.legal, S.vender],
  },

  // =============== 5. Legal y fiscal ===============
  {
    slug: S.legal, llamado: 'creadores',
    titulo: 'Lo legal y fiscal de vender una app en México',
    descripcion: 'RFC y régimen, RESICO, facturas, IVA, aviso de privacidad, términos y condiciones y lo que pide PROFECO a quien vende software en línea en México.',
    h1: 'Lo legal y fiscal de vender una app o un SaaS en México',
    lead: 'Vender software también es vender: hay impuestos, datos personales que cuidar y derechos de tus clientes que respetar. Aquí está lo básico que dicen las leyes mexicanas, para que llegues con buenas preguntas con tu contador y no te enteres tarde.',
    secciones: [
      { h2: 'Antes de empezar: esto no es asesoría', html: caja('Lee esto primero', p('Esta guía resume lo que dicen las leyes, con fines educativos. Tu caso concreto (cuánto vendes, si tienes otro empleo, si tienes socios, si vendes al extranjero) cambia lo que te toca. <b>Confírmalo con una persona contadora y, para contratos, con una abogada o un abogado</b> antes de decidir.')) },
      { h2: 'RFC y régimen fiscal', html: p('Vender tu app o tu software es un ingreso de una actividad empresarial. Necesitas tu RFC y darte de alta en un régimen. Dos datos de la Ley del Impuesto sobre la Renta para preguntar bien:')
        + ul([
          '<b>Régimen Simplificado de Confianza (RESICO).</b> Lo pueden elegir las personas físicas que solo tienen actividades empresariales, profesionales o de arrendamiento, si sus ingresos del año anterior no pasaron de <b>3.5 millones de pesos</b>; si empiezas, cuando estimes que no los pasarás (artículo 113-E). Se paga cada mes un porcentaje de lo cobrado con factura, sin IVA y sin deducciones, de <b>1 % a 2.5 %</b> según el monto mensual.',
          '<b>Si vendes a través de una plataforma</b> que conecta a vendedores con compradores, la ley prevé que esa plataforma te retenga ISR (artículo 113-A) y, en su caso, IVA. Pregunta en cada plataforma qué te retiene y qué constancia te da.',
        ])
        + p('Hay otros regímenes (por ejemplo, el de actividades empresariales y profesionales, o constituir una empresa). Cuál te conviene depende de tus ingresos y tus gastos: es la primera pregunta para tu contador.') },
      { h2: 'Facturas e IVA', html: p('La Ley del IVA grava, en general, la prestación de servicios con la <b>tasa del 16 %</b> (artículo 1o.). Cuando un cliente te pida factura, la emites como comprobante fiscal digital (CFDI) desde el portal del SAT o con un proveedor de facturación.')
        + ul([
          'La misma ley tiene reglas especiales para los <b>servicios digitales</b>: descarga o acceso a contenidos, intermediación entre terceros, clubes en línea y páginas de citas, y enseñanza a distancia o de test o ejercicios (artículo 18-B). Por eso las plataformas extranjeras de esos servicios cobran IVA a sus usuarios en México.',
          'Si tu precio ya incluye el IVA, dilo; si no, súmalo antes de mostrar el total (lo pide la ley del consumidor, abajo).',
        ])
        + caja('Pregunta para tu contador', p('«Vendo acceso a mi software por suscripción a clientes en México (y quizá en el extranjero): ¿qué régimen me conviene, cómo traslado el IVA y qué pasa con lo que vendo a otros países?»')) },
      { h2: 'Aviso de privacidad: la ley de datos de 2025', html: p('En marzo de 2025 se publicó una <b>nueva</b> Ley Federal de Protección de Datos Personales en Posesión de los Particulares, que sustituyó a la de 2010; su autoridad es la <b>Secretaría Anticorrupción y Buen Gobierno</b> (artículo 2). Toda app que guarda datos de personas (nombre, correo, teléfono, lo que suben) debe tener un aviso de privacidad (artículo 14) con, al menos (artículo 15):')
        + ol([
          ['Quién eres', 'Tu identidad y domicilio.'],
          ['Qué datos tratas', 'Señalando si alguno es sensible (salud, por ejemplo).'],
          ['Para qué', 'Las finalidades, distinguiendo las que requieren consentimiento.'],
          ['Cómo limitar su uso', 'Las opciones para limitar el uso o la divulgación.'],
          ['Derechos ARCO', 'Cómo pedir acceso, rectificación, cancelación u oposición.'],
          ['Cambios', 'Cómo avisarás si cambias el aviso.'],
        ])
        + p('Las tiendas de apps piden además su propia política de privacidad y la opción de borrar la cuenta (lo vimos en la guía de publicar).') },
      { h2: 'Términos y condiciones, y PROFECO', html: p('Si vendes en línea a consumidores, la Ley Federal de Protección al Consumidor (artículo 76 Bis) te pide, entre otras cosas:')
        + ul([
          '<b>Dar tu domicilio físico, teléfonos y demás medios</b> para reclamaciones o aclaraciones, antes de que la persona compre (fracción III).',
          '<b>Informar todos los términos, condiciones, costos, cargos adicionales y formas de pago</b> (fracción V).',
          '<b>Respetar la decisión de no recibir avisos comerciales</b> (fracción VI).',
          '<b>Si hay cobros automáticos recurrentes</b>: informarlos con claridad, pedir consentimiento expreso, avisar al menos cinco días naturales antes de una renovación automática y permitir cancelar de inmediato (fracciones VIII y IX, de diciembre de 2025).',
          '<b>Mostrar el monto total a pagar</b>, con todo incluido (artículo 7 Bis).',
        ])
        + p('Tus términos y condiciones son el lugar para poner todo eso por escrito: qué incluye cada plan, cómo se cobra, cómo se cancela, qué pasa con los datos al cancelar y cómo se atienden las quejas. Consejo nuestro: escríbelos en lenguaje claro y pide a una persona abogada que los revise.') },
    ],
    faq: [
      { p: '¿Necesito RFC para vender una app?', r: 'Sí. Vender tu app es un ingreso de una actividad empresarial y necesitas estar inscrito en un régimen. Confirma con una persona contadora cuál te conviene.' },
      { p: '¿Puedo estar en RESICO si vendo software?', r: 'La Ley del ISR permite el RESICO a personas físicas con actividades empresariales, profesionales o de arrendamiento cuyos ingresos del año anterior no pasaron de 3.5 millones de pesos (artículo 113-E). Hay excepciones, como ser socio de una persona moral; confírmalo con tu contador.' },
      { p: '¿Mi app necesita aviso de privacidad?', r: 'Sí, si trata datos personales. La ley de datos personales de 2025 pide un aviso con tu identidad y domicilio, los datos que tratas, para qué, cómo limitar su uso, cómo ejercer los derechos ARCO y cómo avisarás de cambios (artículo 15).' },
      { p: '¿Quién vigila la protección de datos personales ahora?', r: 'Con la ley publicada en marzo de 2025, la autoridad en la materia es la Secretaría Anticorrupción y Buen Gobierno (artículo 2 de la ley).' },
    ],
    fuentes: [F.lisr, F.liva, F.datos, F.lfpc],
    relacionadas: [S.cobrar, S.tiendas, S.vender],
  },

  // =============== 6. Primeros clientes y métricas ===============
  {
    slug: S.clientes, llamado: 'creadores',
    titulo: 'Primeros clientes y métricas de tu SaaS',
    descripcion: 'Cómo conseguir tus primeros clientes y qué medir: MRR, churn, CAC y LTV explicados con un ejemplo sencillo, y cómo dar soporte sin morir en el intento.',
    h1: 'Tus primeros clientes y las métricas que importan: MRR, churn, CAC y LTV',
    lead: 'Los primeros clientes casi nunca llegan solos: se buscan uno por uno. Y una vez que llegan, cuatro números te dicen si tu app va bien o solo parece ir bien. Aquí está cómo conseguir a los primeros, qué medir y cómo atenderlos.',
    secciones: [
      { h2: 'Los primeros 10 clientes, uno por uno', html: p('Esto es consejo nuestro. Al inicio no necesitas anuncios: necesitas hablar con la gente correcta.')
        + ol([
          ['Empieza por tu lista de espera', 'Quienes se anotaron ya te dijeron que tienen el problema. Escríbeles en persona, no con un correo masivo.'],
          ['Ve a donde ya están', 'Grupos, asociaciones, ferias y comunidades del giro de tus clientes.'],
          ['Acompaña el arranque', 'Configura tú la cuenta de los primeros, en una videollamada. Aprendes más en una hora viendo a alguien usar tu app que en un mes de suposiciones.'],
          ['Pide recomendaciones', 'Cuando un cliente esté contento, pregúntale a quién más le serviría.'],
        ])
        + p('Si guardas datos de tus contactos o les mandas promociones, aplica lo que vimos: aviso de privacidad (ley de datos personales, artículos 14 y 15) y respetar a quien no quiere recibir avisos comerciales (ley del consumidor, artículo 76 Bis, fracción VI).') },
      { h2: 'Las cuatro métricas, en palabras simples', html: tabla(['Métrica', 'Qué es', 'Cómo se calcula'], [
          ['MRR', 'Ingreso recurrente mensual: lo que cobras cada mes por suscripciones.', 'Suma de lo que paga al mes cada cliente activo (un plan anual cuenta como su precio entre 12).'],
          ['Churn', 'Tasa de cancelación: qué parte de tus clientes se va cada mes.', 'Clientes que cancelaron en el mes ÷ clientes al inicio del mes.'],
          ['CAC', 'Costo de adquirir un cliente.', 'Lo que gastaste en conseguir clientes en un periodo ÷ clientes nuevos de ese periodo.'],
          ['LTV', 'Valor de vida del cliente: lo que te deja un cliente mientras se queda.', 'Una forma sencilla: lo que te deja al mes ÷ churn mensual.'],
        ], 'Definiciones de uso común en la industria, explicadas por nosotros; no son normas oficiales.')
        + p('Consejo nuestro: compara LTV con CAC. Si conseguir un cliente te cuesta más de lo que te deja mientras se queda, crecer solo te hace perder más rápido.') },
      { h2: 'Ejemplo con números', html: ejemplo('Tu SaaS cobra $300 al mes. Empezaste el mes con 40 clientes, 2 cancelaron y gastaste $1,500 en anuncios que te trajeron 5 clientes nuevos. Después de comisiones e infraestructura, cada cliente te deja $240 al mes.', ul([
          'Clientes al final: 40 − 2 + 5 = 43; MRR: 43 × $300 = <b>$12,900</b>.',
          'Churn del mes: 2 ÷ 40 = <b>5 %</b>.',
          'CAC: $1,500 ÷ 5 = <b>$300</b> por cliente.',
          'LTV aproximado: $240 ÷ 5 % = <b>$4,800</b>.',
          'LTV ÷ CAC: $4,800 ÷ $300 = <b>16</b>: cada peso invertido en conseguir clientes regresa varias veces.',
        ]) + nota('Con pocos clientes, un mes malo mueve mucho los porcentajes. Mira la tendencia de tres meses, no un mes suelto.')) },
      { h2: 'Bajar el churn', html: p('Esto es consejo nuestro:')
        + ul([
          '<b>Pregunta por qué se van.</b> Una pregunta de una línea al cancelar te da más información que cualquier tablero.',
          '<b>Revisa el primer uso.</b> Mucha gente cancela porque nunca entendió cómo sacarle provecho.',
          '<b>Cuida los cobros fallidos.</b> Una tarjeta vencida no es una cancelación: avisa y da tiempo de actualizarla.',
          '<b>No escondas el botón de cancelar.</b> Además de que la ley pide un mecanismo de cancelación inmediata (artículo 76 Bis, fracción IX), esconderlo genera quejas y contracargos.',
        ])
        + p('Si cobras suscripciones dentro de App Store, ten en cuenta que Apple cuenta el año de servicio pagado de cada cliente para pagarte 85 % en lugar de 70 %, y que si alguien regresa después de 60 días sin suscripción, ese conteo se reinicia.') },
      { h2: 'Soporte que no te consume', html: ul([
          '<b>Un solo canal al inicio</b> (correo o chat) y un horario claro.',
          '<b>Una página de preguntas frecuentes</b> que crece con cada pregunta repetida.',
          '<b>Tus datos de contacto a la vista</b>: la ley del consumidor pide dar domicilio, teléfonos y demás medios para reclamaciones antes de la compra (artículo 76 Bis, fracción III).',
          '<b>Anota cada problema</b>: las quejas repetidas son tu lista de mejoras.',
        ]) + nota('Consejos nuestros, salvo la obligación de la ley del consumidor.') },
    ],
    faq: [
      { p: '¿Qué es el MRR?', r: 'Es el ingreso recurrente mensual: la suma de lo que te paga al mes cada cliente activo por su suscripción. Un plan anual cuenta como su precio dividido entre 12.' },
      { p: '¿Qué es el churn y cómo se calcula?', r: 'Es la parte de tus clientes que cancela en un periodo. Se calcula dividiendo los clientes que cancelaron en el mes entre los que tenías al inicio del mes.' },
      { p: '¿Qué son CAC y LTV?', r: 'CAC es lo que te cuesta conseguir un cliente; LTV es lo que te deja mientras se queda. Si el LTV no es claramente mayor que el CAC, crecer te hace perder dinero.' },
      { p: '¿Cómo consigo mis primeros clientes?', r: 'Como consejo nuestro: empieza por tu lista de espera, ve a donde ya están tus clientes, acompaña en persona a los primeros y pide recomendaciones cuando estén contentos.' },
    ],
    fuentes: [F.lfpc, F.datos, F.appleSubs],
    relacionadas: [S.idea, S.cobrar, S.vender],
  },

  // =============== 7. Dónde vender ===============
  {
    slug: S.vender, llamado: 'creadores',
    titulo: 'Dónde vender tu app o tu producto digital',
    descripcion: 'Tu propio sitio, App Store y Google Play o un marketplace: qué cobra cada canal, qué controlas y cuándo conviene cada uno para vender tu app.',
    h1: 'Dónde vender tu app o tu producto digital: tu sitio, las tiendas de apps o un marketplace',
    lead: 'Dónde vendes decide cuánto te queda de cada venta, quién atiende al cliente y quién trae a los compradores. No tienes que elegir uno solo; muchas apps combinan canales. Aquí comparamos los tres caminos con sus comisiones publicadas.',
    secciones: [
      { h2: 'Los tres caminos', html: tabla(['Canal', 'Lo que pagas', 'Lo que ganas', 'Lo que pierdes'], [
          ['Tu propio sitio', 'La comisión de tu pasarela (por ejemplo, Stripe: 3.6 % + $3.00 MXN por tarjeta nacional, sin IVA).', 'El margen más alto y la relación directa con tu cliente.', 'Tú traes cada visita y atiendes todo.'],
          ['App Store y Google Play', 'La comisión de la tienda en lo digital: 15 % para desarrolladores pequeños; hasta 30 % en otros casos.', 'Confianza y que te encuentren dentro de la tienda.', 'Reglas de la tienda, revisión de cada versión y parte de cada venta.'],
          ['Un marketplace', 'La comisión del marketplace (cada uno la publica en sus términos).', 'Compradores que ya llegan buscando algo.', 'Menos control del precio, la página y el contacto con el cliente.'],
        ], 'Comisiones al momento de escribir (noviembre de 2026), de las páginas de Stripe, Apple y Google citadas en «Fuentes». Revisa los términos de cada marketplace.') },
      { h2: 'Tu propio sitio: más margen, más trabajo', html: p('Vender en tu sitio te deja la mayor parte de cada venta y todos los datos de tus clientes (que debes cuidar con tu aviso de privacidad). A cambio, tú consigues el tráfico: buscadores, redes, recomendaciones, alianzas.')
        + p(`Consejo nuestro: aunque vendas en otros lados, ten tu sitio con tu nombre. Es el único canal que nadie te puede cambiar de reglas. Cómo cobrar ahí lo explicamos en ${a(r(S.cobrar), 'cómo cobrar tu app en México')}.`) },
      { h2: 'Las tiendas de apps: confianza a cambio de comisión', html: p('Si tu producto es una app móvil, las tiendas son casi obligatorias: es donde la gente busca apps. Lo digital que vendas dentro de la app se cobra con su sistema y paga su comisión; lo físico, no. En App Store, con el Small Business Program, la comisión baja a 15 % si tus ingresos netos del año anterior fueron de hasta 1 millón de dólares; en Google Play, en México, es 15 % sobre el primer millón de dólares al año.')
        + p(`Un modelo común: la app se descarga gratis y la suscripción se puede contratar dentro de la app (pagando la comisión) o en tu sitio. Antes de diseñarlo, revisa la guía 3.1.3(b) de Apple sobre servicios multiplataforma y lo que vimos en ${a(r(S.tiendas), 'cómo publicar en App Store y Google Play')}.`) },
      { h2: 'Marketplaces: compradores que ya están ahí', html: p('Un marketplace junta a muchos vendedores en un mismo lugar y trae compradores. A cambio, cobra una comisión y pone sus reglas. Esto es consejo nuestro, antes de subir tu producto:')
        + ul([
          '<b>Qué comisión cobra</b> y si es sobre el precio con o sin impuestos.',
          '<b>Cuándo te paga</b> y cómo maneja reembolsos y contracargos.',
          '<b>Quién es el vendedor ante el comprador</b> y quién da el soporte.',
          '<b>Si te retiene impuestos</b>: la ley prevé retenciones de ISR para quien vende por plataformas que intermedian (artículo 113-A de la Ley del ISR).',
          '<b>Si puedes llevarte a tus clientes</b> o sus datos si un día te vas.',
          '<b>Si es exclusivo</b>: lo ideal es poder vender también en tu sitio.',
        ]) },
      { h2: 'La tienda de Vorka México', html: TIENDA_VORKA },
      { h2: 'Cómo combinar canales', html: p('Esto es consejo nuestro. Un orden que funciona para muchas personas que empiezan:')
        + ol([
          ['Un producto digital en un marketplace', 'Una plantilla o un kit relacionado con tu app te da ventas, opiniones y una lista de clientes antes de terminar la app.'],
          ['Tu app en tu sitio', 'Como PWA o app web, cobrando con tu pasarela.'],
          ['Las tiendas de apps', 'Cuando tus clientes te pidan la app en el celular.'],
        ])
        + p('En cada canal, mide cuánto te deja una venta después de comisiones y cuánto te costó conseguirla. Con esos dos números sabrás dónde poner tu tiempo.') },
    ],
    faq: [
      { p: '¿Dónde conviene más vender una app?', r: 'Depende del producto. En tu sitio te queda más de cada venta pero tú traes a los clientes; en las tiendas de apps te encuentran más fácil pero pagas comisión; un marketplace trae compradores a cambio de comisión y menos control. Muchas apps combinan canales.' },
      TIENDA_VORKA_FAQ,
      { p: '¿Qué comisión cobran App Store y Google Play?', r: 'Al momento de escribir, 15 % para desarrolladores pequeños (Small Business Program de Apple; primer millón de dólares al año en Google Play) y hasta 30 % en otros casos. En suscripciones las reglas son distintas.' },
      { p: '¿Un marketplace me retiene impuestos?', r: 'Puede ser. La Ley del ISR prevé que las plataformas que intermedian entre vendedores y compradores retengan ISR (artículo 113-A). Pregunta a cada plataforma qué te retiene y confirma con tu contador.' },
    ],
    fuentes: [F.vorka, F.stripe, F.appleSmall, F.appleGuias, F.playCargos, F.lisr],
    relacionadas: [S.cobrar, S.tiendas, S.legal],
  },
];

const NOTA_PIE = `Vorka Learn es la sección de guías de Vorka México. ${AVISO_APPS} No estamos afiliados a Apple, Google, Stripe, Mercado Pago, Conekta, el SAT, PROFECO ni la Secretaría Anticorrupción y Buen Gobierno. La tienda y el programa para creadores son de Vorka México.`;

export const TEMA_APPS = crearTema({
  seccion: APPS, articulos: ARTICULOS_APPS, llamados: LLAMADO, actualizado: ACTUALIZADO_APPS, actualizadoTxt: ACTUALIZADO_TXT,
  notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; las cuotas, las comisiones y las reglas de las tiendas y de las leyes cambian, así que confirma lo vigente antes de decidir.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_APPS}</b></p>`,
  notaPie: NOTA_PIE, compartirTexto: 'Compártela con alguien que quiere lanzar su app.', relTitulo: 'Más guías para crear tu app',
});
export const RUTA_APPS = TEMA_APPS.ruta;
