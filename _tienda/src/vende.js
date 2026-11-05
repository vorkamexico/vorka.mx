// Vende (registro de clientas, pedidos, cobros y ganancia para vendedoras independientes; app propia en vende.vorka.mx, Worker aparte).
// /tienda/vende/ → ficha comercial: plan gratis con límites y prueba de 7 días (viven en la app), Vende Pro mensual/anual y programas patrocinados.
// Se cobra por suscripción (ver suscripciones.js): la app pregunta por RPC (Admin.suscripcionApp(correo, 'vende')) si está al corriente.
// Aquí solo se vende. Vende no mueve dinero, no presta ni cobra a nombre de nadie (ver /legal/vende/).
import { heroMarca, seccionQueEs, indiceProducto, colorDe, CSS_MARCA, CSS_SECCIONES } from './marca-producto.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { oferta, ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA, CHECK } from './marco.generado.js';

const APP = 'https://vende.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_VENDE = '/tienda/vende/';
const pesosRedondo = c => '$' + (c / 100).toLocaleString('es-MX', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const PLANES = [{ slug: 'vende-mensual', nombre: 'Mensual', cada: 'al mes', renueva: 'cada mes' }, { slug: 'vende-anual', nombre: 'Anual', cada: 'al año', renueva: 'cada año' }];
// Límites del plan gratis: deben coincidir con LIMITES_GRATIS del Worker vende (src/config.js)
const GRATIS = { clientas: 10, pedidos: 30, productos: 50 };

const INCLUYE = ['Clientas, pedidos y productos sin límite', 'Catálogo por marca o menú de comida con costo por porción', '"Hoy": a quién escribirle, con el WhatsApp ya redactado',
  'Abonos, cuotas y estados de cuenta en PDF y Excel', 'Enlace de solo lectura para tu clienta', 'Ganancia real: vendido contra cobrado', 'Funciona sin internet y se sincroniza solo', 'Exporta todos tus datos cuando quieras'];
const FAQ = [
  ['¿Es gratis?', `Sí. Vende es gratis para siempre con hasta ${GRATIS.clientas} clientas, ${GRATIS.pedidos} pedidos al mes y ${GRATIS.productos} productos. Los primeros 7 días tienes todo sin límites para probar. Entra en <a href="${APP}/">vende.vorka.mx</a> con tu correo; no pedimos tarjeta.`],
  ['¿Vende cobra a mis clientas o mueve dinero?', 'No. Vende solo lleva el registro. Tus clientas te pagan directo a ti, en efectivo o por transferencia, como siempre. No somos banco ni financiera, no prestamos y nunca les escribimos ni les cobramos por nuestra cuenta: los mensajes los mandas tú desde tu WhatsApp.'],
  ['¿Sirve si vendo varias marcas?', 'Sí. Registras tus productos por marca (Mary Kay, Avon, Terramar, Jafra… las que manejes, solo como texto), con su precio de compra, de venta y cuánto le dura a tu clienta, para recordarte cuándo le toca volver a comprar. También configuras los ciclos o campañas de cada marca.'],
  ['¿Y si vendo comida por encargo?', 'También. Capturas tus recetas y Vende calcula el costo por porción y el precio sugerido. Armas tu menú de la semana, registras pedidos con fecha y hora de entrega y anticipo, y ves qué preparar.'],
  ['¿Mis clientas pueden ver lo que me deben?', 'Si tú quieres. Les compartes un enlace privado de solo lectura con su saldo y sus pagos, y lo desactivas cuando quieras. Desde ahí también pueden pedir no recibir promociones.'],
  ['¿Mis datos son míos?', 'Sí. Tus clientas, pedidos y cuentas son tuyos: los descargas en Excel o CSV cuando quieras. Si participas en un programa de una marca o una directora, ellas solo ven indicadores de actividad, nunca los datos de tus clientas.'],
  ['¿Funciona sin internet?', 'Sí. Puedes registrar clientas, pedidos y abonos sin señal; se envían solos al reconectar. Se instala en tu celular como una app y pesa muy poco.'],
  ['¿Qué pasa si dejo de pagar?', `Vuelves al plan gratis: todo se queda donde lo dejaste, lo ves y lo exportas. Solo no podrás pasar de ${GRATIS.clientas} clientas o ${GRATIS.pedidos} pedidos al mes.`],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Vende › Ajustes › Administrar suscripción, sin llamadas. Sigues con todo hasta el final del periodo pagado.'],
  ['Soy marca, distribuidor o directora, ¿cómo lo doy a mi equipo?', 'Con un programa patrocinado: tus vendedoras usan Vende Pro sin pagar, con tu nombre, tus colores, tu catálogo o recetario, retos y un panel con indicadores de tu equipo (sin datos personales de sus clientas). Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.'],
];

const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), candado: ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'), reloj: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  calc: ico('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v6"/>'), doc: ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
  enlace: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), campana: ico('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  historial: ico('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'), corazon: ico('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
};


// Galería con capturas reales
const GALERIA = [['hoy', 'Hoy', 'Lo que te toca: cobros, entregas, recompras y cumpleaños.'], ['cobros', 'Cobros', 'Quién te debe, cuánto y desde cuándo. Recuérdale con un toque.'],
  ['pedido', 'Anotar una venta', 'Clienta, productos y cómo te pagó. Total y ganancia al momento.'], ['clientas', 'Clientas', 'Tu cartera completa, con lo que cada una te debe.'], ['oscuro', 'Modo oscuro', 'Se pone sola según la configuración de tu teléfono.']];

export async function paginaVende(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug) })))).filter(x => x.prod);
  const mensual = planes.find(x => x.slug === 'vende-mensual'), anual = planes.find(x => x.slug === 'vende-anual');
  const plan = mensual?.prod || planes[0]?.prod || null;
  const ahorro = mensual && anual ? mensual.prod.precio_centavos * 12 - anual.prod.precio_centavos : 0;
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes[0]?.slug || '');
  const elegidoP = planes.find(x => x.slug === elegido);
  if (plan && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: plan.id, ref_code: code }, req);
  const error = url.searchParams.get('error') || '';
  // Desde la app (Pasar a Vende Pro) llega el correo de la cuenta para que la suscripción quede ligada a ella
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const rs = planes.length ? await resenasDe(env, RUTA_VENDE) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Vende · Para vendedoras por catálogo y por encargo', brand: { '@type': 'Brand', name: 'Vorka México' },
    description: 'Clientas, pedidos, cobros y ganancia real en un solo lugar, con recordatorios por WhatsApp listos para enviar. Gratis para empezar.', image: ['https://vorka.mx/assets/tienda/v3/vende-og.jpg'],
    ...(planes.length ? { offers: planes.map(x => oferta({ ruta: RUTA_VENDE, centavos: x.prod.precio_centavos, name: `Plan ${x.nombre.toLowerCase()}` })), ...ldResenas(rs) } : {}) },
  migas('Vende', RUTA_VENDE),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  return pagina({ navActual: 'catalogo', entrar: { url: `${APP}/`, app: 'Vende' },
    titulo: 'Vende: app para vender por catálogo: pedidos, cobros y tu ganancia | Gratis para empezar', ruta: RUTA_VENDE, imagen: 'https://vorka.mx/assets/tienda/v3/vende-og.jpg',
    descripcion: 'Para vendedoras por catálogo y por encargo: pedidos, cobros con estado de cuenta y tu ganancia real. Funciona sin internet. Gratis, sin tarjeta.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="ve">
${heroMarca('vende', {
  apoyo: 'Para quien vende por catálogo o por encargo: cada mañana te dice a qué clienta escribirle, con el WhatsApp ya redactado. Lleva tus pedidos, tus cobros y tu ganancia real, aunque vendas varias marcas.',
  botones: `<a class="pm-btn" href="${APP}/#/entrar">Empieza gratis ${FLECHA}</a><a class="pm-btn sec" href="#planes">Ver precio</a>`,
  despues: `<p class="pm-precio"><b>Gratis</b> para empezar, sin tarjeta${mensual ? ` · Vende Pro por ${precio(mensual.prod)} al mes` : ''}</p><p class="t-ya">¿Ya tienes cuenta? <a href="${APP}/">Entra aquí</a></p>`,
})}
${indiceProducto('vende', [['que-es', 'Qué es'], ['como', 'Cómo funciona'], ['asi-se-ve', 'Así se ve'], ['incluye', 'Qué incluye'], ['planes', 'Precio'], ['ayuda', 'Preguntas']], `<a class="pm-btn" href="${APP}/#/entrar">Empieza gratis</a>`)}
${seccionQueEs('vende', { titulo: 'Tus clientas, pedidos y cobros, en un solo lugar.',
  texto: 'Anotas a tus clientas y cada pedido, y Vende calcula cuándo le toca recomprar, cuánto te debe y cuánto ganaste de verdad. <b>Cada mañana te dice a qué clienta escribirle</b>, con el WhatsApp ya redactado. Tus clientas te pagan directo a ti, como siempre.',
  para: [['Vendedoras por catálogo', 'Varias marcas a la vez, con su costo y su precio, y el aviso de cuándo le toca recomprar a cada clienta.'], ['Cocina por encargo', 'Costo por porción, menú de la semana y pedidos con fecha de entrega y anticipo.'], ['Marcas, distribuidores y directoras', 'Darle Vende Pro a todo tu equipo con un programa patrocinado.']] })}

<section class="ve-sec" id="como"><div class="marco">
  <div class="ve-cab"><span class="ve-et">Cómo funciona</span><h2>Tu negocio, sin libreta ni hojas sueltas.</h2><p>Registrar a una clienta toma menos de 20 segundos. Lo demás lo calcula Vende: cuándo le toca recomprar, cuánto te debe y cuánto ganaste de verdad.</p></div>
  <ol class="ve-pasos">${[['Registra a tus clientas', 'Nombre, WhatsApp y lo que te sirva: talla, tono de piel, alergias, dirección. O súbelas desde un Excel.'], ['Arma tu catálogo o menú', 'Productos por marca con su costo y su precio, o platillos con receta y costo por porción.'],
    ['Anota cada pedido', 'Con descuento, envío, anticipo y si es de contado o a crédito, en cuotas o pagos libres.'], ['Abre "Hoy" cada mañana', 'Cobros, entregas, recompras y cumpleaños, con el mensaje listo para enviar por WhatsApp.']].map(([t, d], k) => `<li><span class="ve-num">0${k + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
</div></section>

<section class="ve-sec suave ve-gal-s" id="asi-se-ve"><div class="marco">
  <div class="ve-cab"><span class="ve-et">Así se ve</span><h2>Botones grandes, palabras claras.</h2><p>Hecha para quien no se lleva con la tecnología: si usas WhatsApp, puedes usar Vende. Blanca y sencilla, o en modo oscuro si así tienes tu teléfono.</p></div>
  <ul class="ve-gal">${GALERIA.map(([f, t, d]) => `<li><div class="ve-cel chico"><div class="ve-pant"><img src="/assets/tienda/vende/${f}.webp" width="600" height="1298" alt="Pantalla ${t} de Vende" loading="lazy"></div></div><b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="ve-sec"><div class="marco ve-dos">
  <div class="ve-cab izq"><span class="ve-et">Ganancia real</span><h2>Lo que vendiste no es lo que ganaste.</h2><p>Vende resta el costo del producto, los descuentos, el envío que pagas tú, los regalos y el empaque. Y separa lo vendido de lo cobrado, para que sepas cuánto es para reponer y cuánto es para ti.</p></div>
  <div class="ve-calc" role="img" aria-label="Ejemplo de ganancia de un pedido">
    <small>Ejemplo · pedido #18</small>
    <div class="ve-linea"><span>Venta (2 productos)</span><b>$630.00</b></div>
    <div class="ve-linea sub"><span>· costo de los productos</span><b>−$390.00</b></div>
    <div class="ve-linea sub"><span>· envío que pagas tú</span><b>−$35.00</b></div>
    <div class="ve-linea sub"><span>· muestra de regalo</span><b>−$25.00</b></div>
    <div class="ve-linea total"><span>Tu ganancia</span><b>$180.00</b></div>
  </div>
</div></section>

<section class="ve-sec" id="incluye"><div class="marco">
  <div class="ve-cab"><span class="ve-et">Lo que incluye</span><h2>Hecho para vender, cobrar y no perder clientas.</h2></div>
  <ul class="ve-ben">${[[ICONO.campana, 'A quién escribirle hoy', 'Recompras según cuánto le dura cada producto, cobros, entregas, cumpleaños y clientas que no compran hace tiempo. Máximo 7 al día.'],
    [ICONO.calc, 'Cobranza clara', 'Abonos en dos toques, cuotas quincenales o pagos libres. Si te pagan de más, se aplica al siguiente adeudo.'],
    [ICONO.doc, 'Estado de cuenta', 'Pedidos, abonos y saldo de cada clienta, en PDF o Excel a cualquier fecha.'],
    [ICONO.enlace, 'Tu página de catálogo', 'Una liga con tus productos o tu menú de la semana; tus clientas eligen y te piden por WhatsApp.'],
    [ICONO.historial, 'Historial de cambios', 'Si corriges un pedido o un abono, queda el motivo, el antes y el después.'],
    [ICONO.corazon, 'Motivación con hechos', 'Metas que tú decides, rachas con comodín y niveles por constancia. Nunca por comprar inventario.']].map(([i, t, d]) => `<li>${i}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
  <p class="ve-aviso">Vende es una herramienta de registro: <b>no mueve dinero, no presta y no cobra por ti</b>. Tus clientas te pagan directo, en efectivo o por transferencia.</p>
</div></section>

<section class="ve-sec suave" id="planes"><div class="marco">
  <div class="ve-cab"><span class="ve-et">Precio</span><h2>Gratis para empezar. Sin límites con Pro.</h2><p>En pesos mexicanos con IVA incluido. Cancela cuando quieras.</p></div>
  <div class="ve-planes">
    <article class="ve-plan"><h3>Gratis</h3><p class="ve-para">Para empezar a ordenar tu negocio</p><p class="ve-precio"><b>$0</b> <small>para siempre</small></p>
      <ul>${[`Hasta ${GRATIS.clientas} clientas`, `Hasta ${GRATIS.pedidos} pedidos al mes`, '"Hoy", cobranza y estado de cuenta', 'Los primeros 7 días, todo sin límites', 'Sin tarjeta'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
      <a class="ve-btn ghost oscuro" href="${APP}/#/entrar">Empezar gratis</a></article>
    ${planes.map(x => `<article class="ve-plan${x.slug === 'vende-mensual' ? ' rec' : ''}">${x.slug === 'vende-anual' && ahorro > 0 ? `<span class="ve-sello">Ahorra ${pesosRedondo(ahorro)}</span>` : ''}<h3>Pro · ${x.nombre}</h3><p class="ve-para">Todo sin límites</p><p class="ve-precio"><b>${precio(x.prod)}</b> <small>${x.cada}</small></p>
      ${x.slug === 'vende-anual' ? `<p class="ve-para" style="margin-top:-4px">Equivale a ${pesosRedondo(Math.round(x.prod.precio_centavos / 12))} al mes, en un solo pago</p>` : ''}
      <ul>${(x.slug === 'vende-anual' ? ['Todo lo del plan mensual', 'Un solo pago al año', 'Si cancelas en los primeros 10 días, te devolvemos todo'] : INCLUYE).map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
      <a class="ve-btn${x.slug === 'vende-mensual' ? '' : ' ghost oscuro'}" href="?plan=${x.slug}#comprar" data-ir="comprar" data-plan="${x.slug}">Suscribirme</a></article>`).join('')}
  </div>
  ${plan ? '' : `<p class="ve-nota" style="text-align:center">Vende Pro abre muy pronto. Mientras, <a href="${APP}/#/entrar">empieza gratis</a>: los primeros 7 días tienes todo sin límites.</p>`}
</div></section>

<section class="ve-sec" id="equipos"><div class="marco"><div class="ve-pat">
  <div class="ve-cab izq"><span class="ve-et">Para marcas, distribuidores y directoras</span><h2>Dale Vende Pro a todo tu equipo.</h2>
    <p>Con un programa patrocinado tus vendedoras lo usan sin pagar, con tu nombre y tus colores. Tú pagas a Vorka solo por las vendedoras activas del mes.</p>
    <ul>${['Tu catálogo o recetario precargado en la cuenta de cada vendedora', 'Registro con tu código o QR, midiendo de dónde llegan', 'Panel con semáforo de actividad, embudo de nuevas y retos', 'Compras comprobadas con foto de ticket y validación manual', 'Nunca ves datos personales de sus clientas: solo indicadores'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul></div>
  <div><a class="ve-btn" href="mailto:hola@vorka.mx?subject=Programa%20patrocinado%20de%20Vende">Quiero un programa ${FLECHA}</a></div>
</div></div></section>

${plan ? seccionCompra({ titulo: 'Suscríbete a Vende Pro', intro: `¿Aún no lo pruebas? <a href="${APP}/#/entrar">Empieza gratis</a>, sin tarjeta. Si ya lo usas, suscríbete con el mismo correo y todo sigue tal cual.`,
  pasos: [['Elige mensual o anual', 'Y escribe el mismo correo con el que entras a Vende.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Sigues donde estabas', 'Tu cuenta queda sin límites al instante, con todos tus registros.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo'],
  form: `<form class="t-form t-compra" id="form-vende" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <fieldset class="t-campo ve-elige"><legend>Plan</legend>${planes.map(x => `<label class="ve-op"><input type="radio" name="slug" value="${x.slug}"${x.slug === elegido ? ' checked' : ''}><span><b>${x.nombre} · ${precio(x.prod)} ${x.cada}</b>${x.slug === 'vende-anual' && ahorro > 0 ? `<small>Ahorra ${pesosRedondo(ahorro)} contra el mensual</small>` : '<small>Sin plazo forzoso</small>'}</span></label>`).join('')}</fieldset>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo con el que entras a Vende.</small></div>
    <p class="ve-total">Pagas hoy <b id="ve-hoy-p">${precio(elegidoP.prod)}</b> <span id="ve-luego">y luego ${precio(elegidoP.prod)} ${elegidoP.renueva}</span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/vende/" target="_blank">condiciones de Vende</a> (incluida la renovación automática) y el <a href="/legal/vende/privacidad/" target="_blank">aviso de privacidad de Vende</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="ve-precios">${JSON.stringify(Object.fromEntries(planes.map(x => [x.slug, { p: precio(x.prod), c: x.prod.precio_centavos, renueva: x.renueva }]))).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/vende/">Condiciones de Vende</a> · <a href="/legal/vende/privacidad/">Aviso de privacidad</a> · Vende · by Vorka México</p>' })}
<section class="pm-sec ve-cierre" style="--pm:${colorDe('vende')}"><div class="marco"><h2 class="pm-h2">Gratis para empezar. Sin límites con Pro.</h2><p>Los primeros 7 días tienes todo sin límites para probar. Entras con tu correo; no pedimos tarjeta.</p><div class="pm-ctas"><a class="pm-btn" href="${APP}/#/entrar">Empieza gratis ${FLECHA}</a></div></div></section>
${await masTienda(env, 'negocios')}
</div>`,
  });
}

const CSS = `${CSS_MARCA}${CSS_SECCIONES}
/* Estilo de marca (portadas v4): blanco, tinta y el color de Vende; sin fondos oscuros */
.ve{--ve-c:#C2256F;--ve-c2:#C2256F;--morado:#C2256F}
[data-tema="oscuro"] .ve{--ve-c2:color-mix(in srgb,#C2256F 55%,#fff);--morado:var(--ve-c2)}
/* en oscuro, los acentos de las secciones de marca se aclaran para leerse bien */
[data-tema="oscuro"] .pm-et:not(.gris),[data-tema="oscuro"] .pm-grande b{color:color-mix(in srgb,var(--pm) 55%,#fff)}
.pm-precio{margin:16px 0 0;font-size:15px;color:var(--fg-2)}.pm-precio b{font-size:22px;color:var(--fg);letter-spacing:-.02em}
.ve-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--ve-c);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 12px 28px -14px var(--ve-c);transition:transform .2s var(--ease)}
.ve-btn:hover{transform:translateY(-1px)}.ve-btn svg{width:17px;height:17px}
.ve-btn.ghost,.ve-btn.ghost.oscuro{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}.ve-btn.ghost:hover{box-shadow:inset 0 0 0 1.5px var(--fg)}
/* capturas de la app en un celular */
.ve-cel{position:relative;padding:12px;border-radius:52px;background:#16101a;box-shadow:0 40px 80px -30px rgba(0,0,0,.6),inset 0 0 0 1.5px rgba(255,255,255,.12)}
.ve-pant{border-radius:41px;overflow:hidden;background:#fff;padding-top:34px}.ve-pant img{display:block;width:100%;height:auto}
.ve-gal{list-style:none;padding:4px 16px 18px;margin:0 -16px;display:grid;grid-auto-flow:column;grid-auto-columns:min(72vw,250px);gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin}
.ve-gal li{scroll-snap-align:start}.ve-gal b{display:block;margin-top:16px;font-size:18px;letter-spacing:-.015em}.ve-gal p{margin:4px 0 0;color:var(--fg-2);font-size:15px;line-height:1.45}
.ve-cel.chico{padding:8px;border-radius:36px;box-shadow:0 24px 50px -28px rgba(20,17,20,.45),inset 0 0 0 1.5px rgba(255,255,255,.12)}.ve-cel.chico .ve-pant{border-radius:29px;padding-top:0}
@media(min-width:1180px){.ve-gal{grid-auto-flow:row;grid-template-columns:repeat(5,1fr);overflow:visible;margin:0;padding:4px 0 0}}
/* secciones */
.ve-sec{padding:clamp(64px,9vw,112px) 0;scroll-margin-top:54px}.ve-sec.suave{background:var(--bg-2)}
.ve-sec:not(.suave)+.ve-sec:not(.suave){padding-top:0}
.ve-cab{max-width:700px;margin:0 auto 44px;text-align:center}.ve-cab.izq{text-align:left;margin:0}
.ve-et{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ve-c2)}
.ve-cab h2{font-weight:800;font-size:clamp(30px,4.2vw,48px);line-height:1.05;letter-spacing:-.04em;margin:10px 0 0;text-wrap:balance}
.ve-cab p{margin:14px 0 0;font-size:18px;line-height:1.55;color:var(--fg-2)}
.ve-pasos{list-style:none;padding:0;margin:0 auto;max-width:960px;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))}
.ve-pasos li{padding:26px;border-radius:24px;background:var(--card);border:1px solid var(--line)}
.ve-num{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--ve-c) 12%,transparent);font-weight:800;font-size:14px;color:var(--ve-c2)}.ve-pasos b{display:block;font-size:19px;letter-spacing:-.02em;margin-top:18px}.ve-pasos p{margin:6px 0 0;color:var(--fg-2);line-height:1.5}
.ve-dos{display:grid;gap:44px;align-items:center}.ve-dos>*{min-width:0}@media(min-width:980px){.ve-dos{grid-template-columns:1fr 1fr;gap:64px}}
.ve-calc{padding:26px;border-radius:26px;background:var(--card);border:1px solid var(--line);font-variant-numeric:tabular-nums}
.ve-calc small{color:var(--fg-2);font-size:12.5px}
.ve-linea{display:flex;justify-content:space-between;gap:16px;margin-top:14px;font-size:16px}.ve-linea b{font-weight:700}
.ve-linea.sub{margin-top:6px;font-size:14.5px;color:var(--fg-2)}.ve-linea.total{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:19px}.ve-linea.total b{color:var(--ve-c2);font-weight:800}
.ve-ben{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.ve-ben li{padding:24px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.ve-ben svg{width:42px;height:42px;padding:10px;border-radius:12px;background:color-mix(in srgb,var(--ve-c) 12%,transparent);color:var(--ve-c2)}
.ve-ben b{display:block;font-size:17.5px;letter-spacing:-.015em;margin-top:14px}.ve-ben p{margin:6px 0 0;color:var(--fg-2);font-size:15px;line-height:1.5}
.ve-aviso{max-width:720px;margin:32px auto 0;text-align:center;color:var(--fg-2);font-size:15px;line-height:1.55}
/* precio */
.ve-planes{display:grid;gap:20px;align-items:start;max-width:1120px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))}
.ve-plan{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:28px;padding:28px;display:grid;gap:8px}
.ve-sello{position:absolute;top:-13px;left:24px;background:var(--ve-c);color:#fff;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px}
.ve-elige{border:0;padding:0;margin:0 0 6px}.ve-elige legend{font-weight:650;font-size:14px;margin-bottom:8px;padding:0}
.ve-op{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px;cursor:pointer}
.ve-op input{margin-top:3px;accent-color:var(--ve-c)}.ve-op b{display:block;font-size:15px}.ve-op small{display:block;color:var(--fg-2);font-size:13px;margin-top:2px}
.ve-op:has(input:checked){border-color:var(--ve-c);background:color-mix(in srgb,var(--ve-c) 7%,transparent)}
.ve-plan.rec{border-color:var(--ve-c);box-shadow:0 30px 60px -40px var(--ve-c)}
.ve-plan h3{font-weight:800;font-size:26px;letter-spacing:-.035em;margin:4px 0 0}.ve-para{color:var(--fg-2);margin:0}
.ve-precio{margin:6px 0 0}.ve-precio b{font-size:40px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.ve-precio small{color:var(--fg-2)}
.ve-plan ul{list-style:none;padding:0;margin:8px 0 14px;display:grid;gap:9px}.ve-plan li{display:flex;gap:8px;align-items:flex-start;font-size:15px}.ve-plan li svg{flex:none;width:18px;height:18px;margin-top:2px;color:var(--ve-c2)}
.ve-nota{color:var(--fg-2);font-size:15px;margin-top:14px}
.ve-total{margin:4px 0 12px;font-size:16px}.ve-total b{font-size:20px;font-variant-numeric:tabular-nums}
.ve #form-vende .btn.acento{background:var(--ve-c);color:#fff;box-shadow:0 12px 28px -14px var(--ve-c)}
/* programas patrocinados */
#equipos{padding-top:clamp(64px,9vw,112px)}
.ve-pat{display:grid;gap:28px;align-items:center;padding:clamp(26px,4vw,44px);border-radius:28px;background:var(--bg-2);border:1px solid var(--line)}@media(min-width:900px){.ve-pat{grid-template-columns:1.3fr .7fr;gap:48px}}
.ve-pat>*{min-width:0}.ve-pat ul{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:10px}.ve-pat li{display:flex;gap:10px;align-items:flex-start}.ve-pat li svg{flex:none;width:18px;height:18px;margin-top:3px;color:var(--ve-c2)}
/* cierre */
.ve-cierre{padding-bottom:88px;text-align:center}.ve-cierre .marco{max-width:760px}.ve-cierre p{margin:14px auto 0;font-size:18px;line-height:1.55;color:var(--fg-2);max-width:560px}.ve-cierre .pm-ctas{justify-content:center}
`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-vende'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('ve-precios').textContent); }catch(e){}
  function elegido(){ var r=f.querySelector('input[name=slug]:checked'); return r?r.value:''; }
  function pinta(){ var x=P[elegido()]; if(!x) return; var fr=VD.frase(x.c,x.renueva); document.getElementById('ve-hoy-p').textContent=fr.hoy; document.getElementById('ve-luego').textContent=fr.luego; }
  document.addEventListener('vorka:descuento',pinta);
  f.querySelectorAll('input[name=slug]').forEach(function(r){ r.addEventListener('change',pinta); }); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(){ var r=f.querySelector('input[name=slug][value="'+a.dataset.plan+'"]'); if(r){ r.checked=true; pinta(); } }); });
  document.querySelectorAll('[data-ir]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={ slug:elegido(), sucursales:0, nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
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
