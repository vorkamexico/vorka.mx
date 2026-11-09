// Vorka Learn › Tu página web (vorka.mx/learn/web/…): dos guías para quien quiere su página: cómo hacerla paso a paso
// (planear, dominio, hospedaje, diseño, Google y mantenimiento) y cómo programarla desde cero con HTML, CSS y JavaScript.
// Misma plantilla editorial que el resto de Learn (src/learn/tema.js → paginaArticulo). Catálogo y rutas:
// src/learn/datos.js (TEMAS) y src/simulador/guias.js (TEMAS_T).
// Reglas (política de la organización: sin inventar datos):
//  - Todo dato concreto sale de la fuente que el artículo cita en «Fuentes»: MDN Web Docs (qué es un dominio, HTML, CSS,
//    JavaScript y cómo publicar), Google (Search Console, Perfil de Negocio y la guía de SEO), GitHub Pages, Cloudflare Pages,
//    Let's Encrypt, Registry.MX, las WCAG del W3C y la ley de datos personales en diputados.gob.mx. Revisadas el 5 de
//    noviembre de 2026. No damos precios de dominios ni de hospedaje de terceros: cambian y dependen del proveedor.
//  - Lo demás se dice como consejo nuestro.
//  - Un solo llamado final por artículo: el plan «Tu página web» de Vorka México (/servicios/pagina-web/), con sus
//    condiciones tal cual (PLAN_WEB abajo; si cambian, se cambian aquí y en _sitio/paginaweb.py), y el puente a servicios.
//  - Aviso al final: información general.
import { p, ul, ol, tabla, nota, caja } from './learn/piezas.js';
import { crearTema } from './learn/tema.js';
import { llamadoProducto } from './learn/cta.js';
import { puenteServicios } from './learn/puente.js';
import { esc } from './paginas.js';

export const ACTUALIZADO_WEB = '2026-11-05';
const ACTUALIZADO_TXT = 'noviembre de 2026';
export const AVISO_WEB = 'Información general con fines educativos; no es asesoría técnica ni legal para tu caso.';

export const WEB = {
  clave: 'web', nombre: 'Tu página web', corto: 'Web',
  indice: {
    titulo: 'Tu página web: hazla y prográmala paso a paso',
    descripcion: 'Guías para tener tu página web: qué necesitas (dominio, hospedaje, diseño y Google) y cómo programarla desde cero con HTML, CSS y JavaScript.',
    h1: 'Guías para tener tu página web',
    lead: 'Qué necesitas para que tu negocio o tu proyecto tenga página propia, y cómo programarla tú desde cero, con lo que dicen MDN, Google y los proveedores que la publican.',
  },
};

// El plan de Vorka México (lo que se promete en /servicios/pagina-web/; se cambia aquí y en _sitio/paginaweb.py)
export const PLAN_WEB = { precio: '$499 MXN al mes', plazo: '12 meses', ruta: '/servicios/pagina-web/' };

// ---------- fuentes (todas revisadas el 5 de noviembre de 2026) ----------
const F = {
  mdnSitio: { nombre: 'MDN Web Docs: Tu primer sitio web (curso de introducción)', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website' },
  mdnHtml: { nombre: 'MDN Web Docs: Crear el contenido (HTML)', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content' },
  mdnCss: { nombre: 'MDN Web Docs: Darle estilo al contenido (CSS)', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Styling_the_content' },
  mdnJs: { nombre: 'MDN Web Docs: Agregar interactividad (JavaScript)', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Adding_interactivity' },
  mdnPublicar: { nombre: 'MDN Web Docs: Publicar tu sitio web', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Publishing_your_website' },
  mdnDominio: { nombre: 'MDN Web Docs: ¿Qué es un nombre de dominio?', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name' },
  registryMx: { nombre: 'Registry.MX: dominios .MX y registrars acreditados', url: 'https://www.registry.mx/' },
  letsencrypt: { nombre: 'Let’s Encrypt: Comenzando (certificados para HTTPS)', url: 'https://letsencrypt.org/es/getting-started/' },
  console: { nombre: 'Ayuda de Search Console: Acerca de Search Console', url: 'https://support.google.com/webmasters/answer/9128668?hl=es' },
  perfil: { nombre: 'Ayuda de Perfil de Negocio de Google: Cómo comenzar a usar el Perfil de Negocio', url: 'https://support.google.com/business/answer/3038063?hl=es-419' },
  seo: { nombre: 'Google Search Central: Guía de optimización en buscadores (SEO) para principiantes', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=es' },
  ghPages: { nombre: 'GitHub Docs: ¿Qué es GitHub Pages?', url: 'https://docs.github.com/es/pages/getting-started-with-github-pages/what-is-github-pages' },
  cfPages: { nombre: 'Cloudflare Docs: Cloudflare Pages', url: 'https://developers.cloudflare.com/pages/' },
  wcag: { nombre: 'W3C WAI: Pautas de Accesibilidad para el Contenido Web (WCAG)', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/es' },
  datos: { nombre: 'Ley Federal de Protección de Datos Personales en Posesión de los Particulares (DOF 20-03-2025; artículos 14 y 15, aviso de privacidad)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf' },
};

// ---------- piezas ----------
const codigo = (t) => `<pre class="gu-codigo"><code>${esc(t)}</code></pre>`;
export const S = { hacer: 'como-hacer-una-pagina-web', programar: 'como-programar-una-pagina-web' };

// Un solo llamado final: el plan «Tu página web» de Vorka México, con sus condiciones, y el puente con el formulario corto
const LLAMADO = {
  plan: llamadoProducto({ etiqueta: 'Tu página web con Vorka', producto: 'Tu página web', de: 'Plan mensual · Vorka México', icono: 'navegador', chip: 'Diseño incluido',
    titulo: '¿Prefieres que te la hagamos?',
    texto: `Vorka México hace y mantiene la página de tu negocio por ${PLAN_WEB.precio}, como suscripción que pagas en línea con tarjeta, más el costo del dominio. El diseño corre por nuestra cuenta con el plan de ${PLAN_WEB.plazo}.`,
    puntos: ['Hospedaje con certificado de seguridad (HTTPS).', 'Hasta 3 cambios pequeños al mes.', 'Botón de WhatsApp y formulario de contacto.', 'El alta para que Google la encuentre.'],
    nota: 'Nosotros registramos tu dominio; su costo se paga una vez al año por transferencia y, si un día te vas al corriente, te lo transferimos. Si dejas de pagar, la página se da de baja y el dominio se queda con nosotros hasta que se liquide su pago anual o los meses que falten.',
    href: PLAN_WEB.ruta, boton: 'Quiero mi página' }) +
    puenteServicios({ marcar: ['web'], texto: 'Cuéntanos de tu negocio y te decimos cómo quedaría tu página. También hacemos tiendas en línea y sistemas a la medida.' }),
};

// ---------- los artículos ----------
export const ARTICULOS_WEB = [
  // =============== 1. Hacer (desarrollar) una página web ===============
  {
    slug: S.hacer, llamado: 'plan',
    titulo: 'Cómo hacer una página web para tu negocio',
    descripcion: 'Los pasos para tener la página de tu negocio: para qué la quieres, qué poner, dominio, hospedaje, diseño para celular, Google y mantenimiento.',
    h1: 'Cómo hacer una página web para tu negocio, paso a paso',
    lead: 'Una página web no empieza en el diseño: empieza en saber para qué la quieres. Estos son los pasos en orden, desde la idea hasta que Google la encuentra, con lo que necesitas en cada uno.',
    secciones: [
      { h2: 'Paso 1: decide para qué es tu página', html: p('Esto es consejo nuestro. Antes de elegir colores, escribe en una frase qué quieres que haga la persona que llega: <b>escribirte por WhatsApp</b>, <b>agendar una cita</b>, <b>ver tu menú o tus precios</b>, <b>llegar a tu local</b> o <b>comprar en línea</b>. Esa acción es el botón principal y todo lo demás la acompaña.')
        + caja('Pregunta útil', p('«¿Qué me preguntan mis clientes por mensaje todos los días?» Horario, ubicación, precios y formas de pago casi siempre van en la página.')) },
      { h2: 'Paso 2: junta el contenido antes del diseño', html: p('Consejo nuestro: la página se arma más rápido y queda mejor cuando el contenido ya existe. Una página sencilla de negocio suele llevar:')
        + ul([
          '<b>Inicio:</b> qué haces y para quién, en una frase, con el botón principal.',
          '<b>Productos o servicios</b>, con precios si puedes darlos.',
          '<b>Fotos reales</b> de tu trabajo, tu local o tu equipo, tomadas con buena luz.',
          '<b>Cómo llegar</b>: dirección, mapa y horario.',
          '<b>Contacto</b>: WhatsApp, teléfono, correo y redes.',
          '<b>Opiniones</b> de clientes, si tienes permiso para publicarlas.',
        ]) },
      { h2: 'Paso 3: el dominio, tu dirección en internet', html: p('El dominio es el nombre con el que la gente llega a tu página (como <b>tunegocio.mx</b>). MDN explica que un dominio no se compra para siempre: pagas el derecho a usarlo por uno o más años a una empresa llamada <b>registrador</b>, y puedes renovarlo con prioridad sobre otras personas.')
        + p('Los dominios .mx (como .mx, .com.mx u .org.mx) se registran con los registrars acreditados que publica Registry.MX. Consejo nuestro: elige un nombre corto, fácil de dictar por teléfono, sin guiones si puedes, y renuévalo a tiempo: si se vence, otra persona lo puede registrar.') },
      { h2: 'Paso 4: hospedaje y el candado de seguridad', html: p('El hospedaje es el servidor donde vive tu página. Para que el navegador muestre el candado (HTTPS), tu sitio necesita un certificado de una Autoridad de Certificación; Let’s Encrypt es una de ellas y explica que para obtenerlo debes demostrar que controlas tu dominio.')
        + p('Si tu página es sencilla (texto, fotos y botones), se puede publicar como sitio estático: servicios como GitHub Pages y Cloudflare Pages publican esos archivos directamente, y MDN enseña paso a paso a hacerlo con GitHub Pages. En la siguiente guía te explicamos cómo.') },
      { h2: 'Paso 5: diseño pensado primero para el celular', html: p('Consejo nuestro: la mayoría de tus clientes va a abrir la liga desde el celular, casi siempre desde WhatsApp o redes. Revisa tu página en un teléfono antes que en la computadora: texto que se lea sin hacer zoom, botones grandes y el WhatsApp siempre a la mano.')
        + p('Para que la pueda usar cualquier persona, las pautas WCAG del W3C piden, entre otras cosas, buen contraste entre texto y fondo, texto alternativo en las imágenes y que todo se pueda usar también con teclado.') },
      { h2: 'Paso 6: formulario de contacto y aviso de privacidad', html: p('Si tu página pide nombre, correo o teléfono, estás tratando datos personales. La Ley Federal de Protección de Datos Personales en Posesión de los Particulares pide un <b>aviso de privacidad</b> que diga, al menos, quién eres y tu domicilio, qué datos pides, para qué los usarás y cómo pueden ejercer sus derechos sobre ellos (artículos 14 y 15). Pon la liga junto al formulario.') },
      { h2: 'Paso 7: que Google te encuentre', html: ol([
          ['Da de alta tu sitio en Search Console', 'Google explica que no hace falta registrarse para aparecer en la Búsqueda, pero Search Console, que es gratuito, te ayuda a confirmar que Google puede encontrar tu sitio, solicitar que indexe páginas nuevas y ver cómo te buscan.'],
          ['Crea o actualiza tu Perfil de Negocio', 'Con el Perfil de Negocio de Google administras sin costo cómo aparece tu negocio en Maps y en la Búsqueda. Pon ahí la liga de tu página.'],
          ['Títulos claros en cada página', 'La guía de SEO de Google recomienda escribir para las personas, con títulos y textos que describan lo que hay en cada página.'],
        ]) },
      { h2: 'Paso 8: mantenla viva', html: p('Esto es consejo nuestro. Una página con precios viejos o un horario que ya no es el tuyo hace perder clientes. Revísala una vez al mes: precios, promociones, fotos y que el botón de WhatsApp lleve al número correcto. Renueva el dominio y el certificado antes de que venzan.')
        + tabla(['Cada cuándo', 'Qué revisar'], [
          ['Cada mes', 'Precios, horario, promociones y que los botones funcionen.'],
          ['Cada temporada', 'Fotos nuevas y servicios que agregaste o quitaste.'],
          ['Cada año', 'Renovación del dominio y del hospedaje.'],
        ], 'Calendario de consejo nuestro.') },
    ],
    faq: [
      { p: '¿Qué necesito para tener una página web?', r: 'Un dominio (tu dirección, que se paga por uno o más años a un registrador), un hospedaje donde viva la página con su certificado de seguridad, y el contenido: qué haces, precios, fotos, ubicación y cómo contactarte.' },
      { p: '¿El dominio es mío para siempre?', r: 'No. MDN explica que pagas el derecho a usar el nombre por uno o más años y puedes renovarlo con prioridad. Si no lo renuevas, otra persona lo puede registrar.' },
      { p: '¿Necesito aviso de privacidad en mi página?', r: 'Si pides datos personales, como nombre, correo o teléfono en un formulario, sí: la Ley Federal de Protección de Datos Personales en Posesión de los Particulares pide informar quién eres, qué datos pides, para qué y cómo ejercer los derechos sobre ellos.' },
      { p: '¿Cómo hago que mi página aparezca en Google?', r: 'Google la puede encontrar sola, pero Search Console, que es gratuito, te ayuda a confirmar que la encuentra y a pedir que indexe tus páginas. También ayuda poner la liga en tu Perfil de Negocio de Google.' },
    ],
    fuentes: [F.mdnDominio, F.registryMx, F.letsencrypt, F.mdnPublicar, F.wcag, F.datos, F.console, F.perfil, F.seo],
    relacionadas: [S.programar],
  },

  // =============== 2. Programar una página web ===============
  {
    slug: S.programar, llamado: 'plan',
    titulo: 'Cómo programar una página web desde cero',
    descripcion: 'Tu primera página con HTML, CSS y JavaScript: qué hace cada uno, el código de ejemplo para copiar y cómo publicarla gratis en internet.',
    h1: 'Cómo programar una página web desde cero con HTML, CSS y JavaScript',
    lead: 'Para programar una página no necesitas instalar nada caro: un editor de texto y tu navegador bastan para empezar. Aquí armas una página sencilla con sus tres lenguajes y la publicas en internet.',
    secciones: [
      { h2: 'Los tres lenguajes de una página', html: tabla(['Lenguaje', 'Para qué sirve', 'En una frase'], [
          ['HTML', 'El contenido y su estructura: títulos, párrafos, imágenes, ligas.', 'Lo que dice tu página.'],
          ['CSS', 'El estilo: colores, tipografías, tamaños y acomodo.', 'Cómo se ve.'],
          ['JavaScript', 'La interactividad: que algo pase al tocar un botón.', 'Lo que hace.'],
        ], 'Así lo explica el curso «Tu primer sitio web» de MDN Web Docs; la última columna es resumen nuestro.') },
      { h2: 'Paso 1: prepara tu carpeta', html: ol([
          ['Instala un editor de código', 'Hay editores gratuitos; cualquiera que guarde texto sin formato sirve para empezar.'],
          ['Crea una carpeta para tu sitio', 'Por ejemplo, <b>mi-pagina</b>. Adentro van todos los archivos.'],
          ['Crea tres archivos', '<b>index.html</b> (la página), <b>estilos.css</b> (el diseño) y <b>app.js</b> (lo interactivo), como en el curso de MDN.'],
        ]) + nota('Pasos de consejo nuestro, en el orden del curso de MDN.') },
      { h2: 'Paso 2: el contenido con HTML', html: p('Copia esto en <b>index.html</b> y ábrelo con doble clic: tu navegador lo muestra aunque no tengas internet.')
        + codigo(`<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Panadería La Espiga · Celaya</title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>
  <h1>Panadería La Espiga</h1>
  <p>Pan recién hecho todos los días, de 7:00 a 20:00.</p>
  <img src="pan.jpg" alt="Charola de conchas recién horneadas">
  <a class="boton" href="https://wa.me/52XXXXXXXXXX">Pide por WhatsApp</a>
  <button id="horario">¿Estamos abiertos?</button>
  <p id="aviso"></p>
  <script src="app.js"></script>
</body>
</html>`)
        + p('El negocio del ejemplo es inventado: cambia el texto por el tuyo y las X por tu número a 10 dígitos. La línea <b>viewport</b> hace que se vea bien en el celular, y el texto <b>alt</b> describe la imagen para quien no la puede ver.') },
      { h2: 'Paso 3: el diseño con CSS', html: p('En <b>estilos.css</b>:') + codigo(`body {
  font-family: system-ui, sans-serif;
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px;
  color: #1c1b1f;
}
img { width: 100%; border-radius: 16px; }
.boton {
  display: inline-block;
  background: #1f7a4d;
  color: #fff;
  padding: 14px 22px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
}`) + p('Guarda y recarga el navegador: verás el cambio al momento. Consejo nuestro: cuida que el texto contraste con el fondo; las pautas WCAG del W3C lo piden para que todos puedan leerlo.') },
      { h2: 'Paso 4: lo interactivo con JavaScript', html: p('En <b>app.js</b>, un botón que dice si la panadería está abierta según la hora del dispositivo:') + codigo(`const boton = document.querySelector('#horario');
const aviso = document.querySelector('#aviso');

boton.addEventListener('click', () => {
  const hora = new Date().getHours();
  aviso.textContent = hora >= 7 && hora < 20
    ? '¡Sí! Te esperamos.'
    : 'Ahorita estamos cerrados. Abrimos a las 7:00.';
});`) + p('<b>querySelector</b> encuentra un elemento de la página y <b>addEventListener</b> espera a que lo toquen; son las mismas funciones que usa la introducción a JavaScript de MDN.') },
      { h2: 'Paso 5: publícala en internet', html: p('El curso de MDN enseña a publicar con GitHub Pages y menciona otras opciones de alojamiento. Dos que publican sitios estáticos directamente:')
        + ul([
          '<b>GitHub Pages</b> toma tus archivos HTML, CSS y JavaScript de un repositorio de GitHub y publica el sitio. Según su documentación, está disponible en repositorios públicos con GitHub Free.',
          '<b>Cloudflare Pages</b> publica sitios estáticos, ya sea subiendo tus archivos o conectando tu repositorio de Git.',
        ])
        + p('Los dos te dan una dirección para probar y te permiten conectar después tu propio dominio. Consejo nuestro: publica primero con la dirección de prueba, compártela con dos o tres clientes de confianza y corrige antes de anunciarla.') },
      { h2: 'Paso 6: antes de anunciarla', html: ul([
          'Ábrela en tu celular y en el de alguien más: que todo se lea sin zoom.',
          'Toca cada botón y cada liga, sobre todo el de WhatsApp.',
          'Revisa que cada imagen tenga su texto <b>alt</b>.',
          'Si agregaste un formulario que pide datos, pon tu aviso de privacidad.',
          'Da de alta tu sitio en Search Console para confirmar que Google lo encuentra.',
        ]) + nota('Lista de consejo nuestro.') },
    ],
    faq: [
      { p: '¿Qué lenguajes necesito para hacer una página web?', r: 'Tres: HTML para el contenido, CSS para el diseño y JavaScript para lo interactivo. Para una página sencilla de negocio, HTML y CSS ya hacen casi todo.' },
      { p: '¿Necesito pagar para publicar mi primera página?', r: 'Para empezar, no necesariamente: GitHub Pages publica sitios estáticos desde repositorios públicos con GitHub Free, y Cloudflare Pages también publica sitios estáticos. El dominio propio sí se paga por año a un registrador.' },
      { p: '¿Puedo ver mi página sin internet mientras la hago?', r: 'Sí. Si abres el archivo index.html con doble clic, tu navegador lo muestra desde tu computadora. Internet solo hace falta para publicarla.' },
      { p: '¿Cuánto tiempo lleva aprender?', r: 'Depende de cada quien. Como consejo nuestro: una página sencilla como la del ejemplo se puede armar en una tarde siguiendo esta guía; el diseño fino y lo interactivo se aprenden con práctica.' },
    ],
    fuentes: [F.mdnSitio, F.mdnHtml, F.mdnCss, F.mdnJs, F.mdnPublicar, F.ghPages, F.cfPages, F.wcag, F.console, F.datos],
    relacionadas: [S.hacer],
  },
];

const NOTA_PIE = `Vorka Learn es la sección de guías de Vorka México. ${AVISO_WEB} No estamos afiliados a Mozilla, Google, GitHub, Cloudflare, Let’s Encrypt ni Registry.MX.`;

export const TEMA_WEB = crearTema({
  seccion: WEB, articulos: ARTICULOS_WEB, llamados: LLAMADO, actualizado: ACTUALIZADO_WEB, actualizadoTxt: ACTUALIZADO_TXT,
  notaFuentes: `<p class="gu-nota">Actualizado: ${ACTUALIZADO_TXT}. Revisamos cada dato en estas fuentes; los servicios y sus condiciones pueden cambiar, así que confirma en su página.</p>
    <p class="gu-nota lr-aviso-fin"><b>${AVISO_WEB}</b></p>`,
  notaPie: NOTA_PIE, compartirTexto: 'Compártela con alguien que quiera su página.', relTitulo: 'La otra guía de tu página web',
});
