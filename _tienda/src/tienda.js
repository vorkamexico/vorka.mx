// /tienda            → catálogo (productos activos de D1)
// /tienda/<slug>     → página de venta con formulario de compra
// /tienda/sitemap.xml → sitemap dinámico de la tienda
// ?ref=CODIGO en cualquier página de la tienda guarda la cookie vorka_ref (30 días) si el afiliado existe y está activo
// (y, si es una cuenta de Puntos Vorka, cuenta la visita).
import { pesos } from './util.js';
import { listarProductos, productoPorSlug, productoPorSlugAnterior, afiliadoActivo, registrarAnalitica } from './modelo.js';
import { pagina, aviso, esc, ICONOS, WHATSAPP } from './paginas.js';
import { FLECHA, CHECK, LOGO } from './marco.generado.js';
import { ELEGIR } from './elegir.js';
import { contarVisita } from './puntos.js';

const SITIO = 'https://vorka.mx';
export const CANDADO_PAGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const COOKIE_DIAS = 30;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

// Preguntas que aplican a todos los productos digitales (se suman a las del producto)
const FAQ_TIENDA = [
  { p: '¿Cómo recibo mis archivos?', r: 'En cuanto se confirma tu pago te llega un correo con un enlace de descarga. Funciona 7 días y puedes descargar cada archivo hasta 10 veces. Si se vence, pides uno nuevo en <a href="/descargas/reenviar">vorka.mx/descargas/reenviar</a>.' },
  { p: '¿Cómo puedo pagar?', r: 'Con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. El pago es seguro y lo procesa Stripe; nosotros nunca vemos los datos de tu tarjeta.' },
  { p: 'Pagué en OXXO o por SPEI, ¿cuándo me llega?', r: 'En cuanto el pago se refleja te llega el correo automáticamente. En OXXO suele tardar unos minutos y tienes 3 días para pagar con tu referencia.' },
  { p: '¿Hay reembolsos?', r: 'Por ser un producto digital descargable no hay reembolso una vez descargado. Si un archivo llega dañado o no abre, te lo reponemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.' },
  { p: '¿Me pueden facturar?', r: 'Sí. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales y el número de orden que viene en tu correo, dentro del mismo mes de la compra.' },
];

// Para productos de acceso (apps como el Simulador PAA): cómo se recibe y la política de reembolso cambian
const FAQ_ACCESO = [
  { p: '¿Cómo recibo mi acceso?', r: 'En cuanto se confirma tu pago te llega un correo con el botón para entrar. Si cambias de dispositivo o lo pierdes, pide uno nuevo en <a href="/descargas/reenviar">vorka.mx/descargas/reenviar</a> con el correo de tu compra.' },
  FAQ_TIENDA[1], FAQ_TIENDA[2],
  { p: '¿Hay reembolsos?', r: 'Por ser un producto digital de acceso inmediato no hay reembolso una vez que entras. Si algo no funciona, escríbenos y lo resolvemos. Consulta la <a href="/legal/reembolsos/">política de reembolsos</a>.' },
  FAQ_TIENDA[4],
];

// Guarda la cookie de afiliado (si el código es válido) y devuelve el código vigente
export async function refDeVisita(env, req, url) {
  const nuevo = url.searchParams.get('ref');
  if (nuevo && /^[A-Za-z0-9_-]{1,40}$/.test(nuevo)) {
    const a = await afiliadoActivo(env, nuevo);
    if (a) {
      // Puntos Vorka: cuenta la visita para "N personas abrieron tu liga" (una por persona y día; no guarda IPs)
      if (req.method === 'GET') await contarVisita(env, req, a.code);
      return { code: a.code, cookie: `vorka_ref=${a.code}; Max-Age=${COOKIE_DIAS * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax` };
    }
  }
  return { code: null, cookie: null };
}

// Portada: la imagen del producto o, si no hay, una portada con la V y el nombre
const portada = (p, clase = '') => p.imagen
  ? `<img class="t-portada-img ${clase}" src="${esc(p.imagen)}" alt="Portada de ${esc(p.nombre)}" width="1600" height="1200" decoding="async">`
  : `<div class="t-portada ${clase}" role="img" aria-label="Portada de ${esc(p.nombre)}"><span class="t-portada-v">${LOGO}</span><b>${esc(p.contenido.portada || p.nombre.split(':')[0])}</b><small>Vorka México</small></div>`;

export const precio = p => p.precio_centavos % 100 ? pesos(p.precio_centavos) : `$${(p.precio_centavos / 100).toLocaleString('es-MX')} MXN`;

// Líneas de la tienda según la categoría del producto (se agrupan sin importar mayúsculas ni acentos).
// Una categoría nueva desde el panel aparece sola como línea con su propio nombre.
const SECCIONES_TIENDA = [
  { id: 'examenes', claves: ['examenes', 'educacion'], linea: 'Educación', titulo: 'Preparación para exámenes', texto: 'Simuladores con tutor y reporte de preparación para llegar seguro a tu examen de admisión.' },
  { id: 'invitaciones', claves: ['invitaciones'], linea: 'Celebraciones', titulo: 'Invitaciones digitales', texto: 'Brindi: invitaciones con QR para bodas, XV años y toda celebración, con confirmaciones y control de acceso.' },
  { id: 'eventos', claves: ['eventos'], linea: 'Eventos', titulo: 'Eventos con registro y cover', texto: 'Cupo: la página de tu evento, registro sin cuentas y check-in con QR, gratis hasta 30 personas. Con Pro (desde $99): correos y recordatorios, cover directo a ti y ligas para tus RPs.' },
  { id: 'lealtad', claves: ['lealtad'], linea: 'Negocios', titulo: 'Lealtad para tu negocio', texto: 'Vuelve: tarjeta de sellos o puntos en el celular de tus clientes, avisos automáticos y el dinero que te traen de vuelta, medido. Prueba gratis 7 días.' },
  { id: 'emprender', claves: ['kits', 'emprender'], linea: 'Emprendimiento', titulo: 'Kits para emprender', texto: 'Herramientas paso a paso para ordenar tu idea, validarla con clientes y hacer tus números.' },
];
const sinAcentos = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function seccionesCatalogo(productos) {
  const grupos = new Map();
  for (const p of productos) {
    const k = sinAcentos(p.categoria);
    const def = SECCIONES_TIENDA.find(s => s.claves.includes(k));
    const id = def?.id || (k ? k.replace(/[^a-z0-9]+/g, '-') : 'mas');
    if (!grupos.has(id)) grupos.set(id, { id, linea: def?.linea || p.categoria || 'Más', titulo: def?.titulo || p.categoria || 'Más productos', texto: def?.texto || '', productos: [] });
    grupos.get(id).productos.push(p);
  }
  // El orden de las secciones sigue al primer producto de cada una (campo "orden" del panel)
  return [...grupos.values()];
}
// Producto que abre una app (Simulador PAA, Brindi) en lugar de entregar archivos
const esAcceso = p => !!p.contenido?.acceso;
const enlace = p => p.contenido?.acceso?.ruta || `/tienda/${p.slug}/`;

// Brindi se vende por planes en su propia página: en el catálogo es una sola tarjeta con su portada y "desde"
export const PORTADA_BRINDI = '/assets/tienda/brindi.webp';
const BRINDI = {
  nombre: 'Brindi · Invitaciones digitales',
  texto: 'Invitaciones digitales para bodas, XV años, bautizos y cumpleaños. Se comparten por WhatsApp, reciben confirmaciones y controlan el acceso con QR.',
  incluye: ['Seis diseños premium que personalizas a tu gusto', 'Confirmaciones y control de acompañantes', 'Pase con QR para la entrada de tu evento'],
};
const esBrindi = p => p.contenido?.acceso?.app === 'brindi';
const CUPO = {
  nombre: 'Cupo · Eventos con registro',
  texto: 'La página de tu evento en un minuto: registro sin cuentas, entrada con QR y check-in. Gratis hasta 30 personas; con Pro, correos, cover sin comisión y ligas para RPs.',
  incluye: ['Gratis hasta 30 personas', 'Cupo Pro desde $99 según tu aforo', 'Cover directo a ti y ligas para RPs'],
};
const esCupo = p => p.contenido?.acceso?.app === 'cupo';

// Cómo se presenta cada producto en el catálogo (una sola tarjeta por página de destino)
function vistas(productos, desdeBrindi) {
  const vistos = new Set();
  return productos.map(p => {
    const url = enlace(p);
    if (vistos.has(url)) return null;
    vistos.add(url);
    if (esBrindi(p)) return { p, url, nombre: BRINDI.nombre, texto: BRINDI.texto, incluye: BRINDI.incluye, cat: 'Acceso en línea',
      img: { ...p, imagen: p.imagen || PORTADA_BRINDI }, precio: `Desde ${precio({ precio_centavos: desdeBrindi ?? p.precio_centavos })}`, regalable: false };
    if (esCupo(p)) return { p, url, nombre: CUPO.nombre, texto: CUPO.texto, incluye: CUPO.incluye, cat: 'Acceso en línea',
      img: { ...p, imagen: p.imagen || '/assets/tienda/cupo.webp' }, precio: 'Gratis · Pro desde $99 MXN', regalable: false };
    return { p, url, nombre: p.nombre, texto: p.descripcion_corta, incluye: (p.contenido?.incluye || []).slice(0, 3).map(x => x.titulo || x),
      cat: esAcceso(p) ? 'Acceso en línea' : 'Descarga digital', img: p, precio: precio(p), regalable: !!p.contenido?.regalable };
  }).filter(Boolean);
}

// Secciones a dos columnas en computadora (en celular, una debajo de otra): así no queda una columna angosta con vacío a los lados.
// Preguntas frecuentes: a la izquierda el título y cómo contactarnos; a la derecha las preguntas
export const seccionFaq = ({ titulo = 'Antes de comprar', items, pie = '', suave = false }) => `<section class="t-sec${suave ? ' suave' : ''}" id="ayuda"><div class="marco t-dos">
  <div class="t-dos-a"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2">${titulo}</h2>
    <p class="t-dos-txt">¿No encuentras tu respuesta? Te contesta una persona del equipo, en horario laboral de México.</p>
    <div class="t-contacto"><a class="btn blanco chico" href="mailto:hola@vorka.mx">Escríbenos</a><a class="btn blanco chico" href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a></div></div>
  <div class="t-dos-b"><div class="t-faq">${items}</div>${pie}</div>
</div></section>`;
// Compra: a la izquierda qué pasa después y las garantías; a la derecha el formulario
export const seccionCompra = ({ titulo, intro = '', pasos, garantias, form }) => `<section class="t-sec suave" id="comprar"><div class="marco t-dos t-dos-compra">
  <div class="t-dos-a"><span class="etiqueta">Compra segura</span><h2 class="h2">${titulo}</h2>${intro ? `<p class="t-dos-txt">${intro}</p>` : ''}
    <ol class="t-pasos-compra">${pasos.map(([t, d], i) => `<li><span class="num">${i + 1}</span><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span></li>`).join('')}</ol>
    <ul class="t-garantias">${garantias.map(g => `<li>${CHECK}<span>${g}</span></li>`).join('')}</ul></div>
  <div class="t-dos-b">${form}</div>
</div></section>`;
const faqHtml = l => l.map(f => `<details><summary>${esc(f.p)}</summary><div>${f.r}</div></details>`).join('');

// Barra de la tienda en cada página de producto: brincar a otra línea sin regresar al inicio
const NAV_TIENDA = [['examenes', 'Exámenes', '/tienda/#examenes'], ['invitaciones', 'Invitaciones · Brindi', '/tienda/brindi/'], ['eventos', 'Eventos · Cupo', '/tienda/cupo/'],
  ['lealtad', 'Lealtad · Vuelve', '/tienda/vuelve/'], ['emprender', 'Kits para emprender', '/tienda/#emprender'], ['puntos', 'Puntos Vorka', '/tienda/puntos/']];
export const navTienda = actual => `<nav class="t-nav-tienda" aria-label="Tienda"><a class="t-nav-inicio" href="/tienda/">← Toda la tienda</a>${NAV_TIENDA.map(([id, n, u]) => `<a href="${u}"${id === actual ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>`;
const seccionDe = p => seccionesCatalogo([p])[0]?.id;

// "También en la tienda": las demás líneas, con su portada y precio de entrada, al final de cada página
export async function masTienda(env, actual) {
  const productos = await listarProductos(env);
  const planes = (await env.DB.prepare('SELECT precio_centavos, contenido FROM products WHERE activo = 1').all()).results
    .filter(x => { try { const a = JSON.parse(x.contenido || '{}').acceso; return a?.app === 'brindi' && a?.tipo === 'plan'; } catch { return false; } });
  const desdeBrindi = planes.length ? Math.min(...planes.map(x => x.precio_centavos)) : null;
  const otras = seccionesCatalogo(productos).filter(g => g.id !== actual).map(g => ({ ...g, vistas: vistas(g.productos, desdeBrindi) })).filter(g => g.vistas.length);
  if (!otras.length) return '';
  const desde = g => g.vistas.some(v => esCupo(v.p)) ? 'gratis para empezar' : `desde ${g.vistas.find(v => esBrindi(v.p))?.precio.replace('Desde ', '') || precio({ precio_centavos: Math.min(...g.vistas.map(v => v.p.precio_centavos)) })}`;
  return `<section class="t-sec suave t-mas"><div class="marco">
  <div class="cab"><span class="etiqueta">También en la tienda</span><h2 class="h2">Sigue explorando</h2></div>
  <div class="t-lineas">${otras.map(g => `<a class="t-linea-t" href="${esc(g.vistas.length === 1 ? g.vistas[0].url : `/tienda/#${g.id}`)}">
    <span class="t-linea-t-img">${portada(g.vistas[0].img)}</span>
    <span class="t-linea-t-x"><small>${esc(g.linea)}</small><b>${esc(g.titulo)}</b><span>${g.vistas.length === 1 ? '1 producto' : `${g.vistas.length} productos`} · ${desde(g)}</span></span>
    <span class="t-linea-t-f" aria-hidden="true">${FLECHA}</span></a>`).join('')}</div>
  <p class="t-nota t-mas-pie">¿Compras para alguien más? Varios productos se pueden <b>regalar</b> desde su página. ¿Dudas? <a href="mailto:hola@vorka.mx">hola@vorka.mx</a></p>
</div></section>`;
}

export async function paginaCatalogo(env, req, url) {
  const { cookie } = await refDeVisita(env, req, url);
  const productos = await listarProductos(env);
  // Precio de entrada de Brindi: el plan más barato a la venta (los planes viven ocultos del catálogo)
  const planesBrindi = (await env.DB.prepare('SELECT precio_centavos, contenido FROM products WHERE activo = 1').all()).results
    .filter(x => { try { const a = JSON.parse(x.contenido || '{}').acceso; return a?.app === 'brindi' && a?.tipo === 'plan'; } catch { return false; } });
  const desdeBrindi = planesBrindi.length ? Math.min(...planesBrindi.map(x => x.precio_centavos)) : null;
  const secciones = seccionesCatalogo(productos).map(g => ({ ...g, vistas: vistas(g.productos, desdeBrindi) }));
  const todas = secciones.flatMap(g => g.vistas);

  // Portada de la tienda: menos es más. Arriba la promesa y una vitrina con las líneas; abajo una sola cuadrícula de
  // productos con tarjetas iguales y filtros por línea (sin JavaScript se ven todos).
  const desde = g => { const b = g.vistas.find(v => esBrindi(v.p)); if (g.vistas.some(v => esCupo(v.p))) return 'Gratis para empezar'; return `Desde ${b ? b.precio.replace('Desde ', '') : precio({ precio_centavos: Math.min(...g.vistas.map(v => v.p.precio_centavos)) })}`; };
  // Tarjeta de producto: la portada completa (4:3, sin recortar) sobre fondo neutro, nombre, precio y un solo botón
  const tarjeta = (v, g, primera) => `
    <article class="t-card" data-linea="${esc(g.id)}" data-buscar="${esc(sinAcentos(`${v.nombre} ${v.texto || ''} ${g.linea} ${g.titulo}`))}"${primera ? ` id="${esc(g.id)}"` : ''}>
      <a class="t-card-img" href="${esc(v.url)}" tabindex="-1" aria-hidden="true">${portada(v.img)}<span class="t-card-ver">Ver detalles</span></a>
      <div class="t-card-t">
        <span class="t-cat">${esc(g.linea)}</span>
        <h3><a href="${esc(v.url)}">${esc(v.nombre)}</a></h3>
        <p>${esc(v.texto)}</p>
        <div class="t-card-pie"><b class="num">${v.precio}</b><span class="t-card-acc">${v.regalable ? `<a class="t-card-regalo" href="${esc(v.url)}?regalo=1#comprar" aria-label="Regalar ${esc(v.nombre)}">🎁</a>` : ''}<a class="btn blanco chico" href="${esc(v.url)}">Ver ${FLECHA}</a></span></div>
      </div>
    </article>`;
  // Categorías en mosaico: cada línea con su nombre y su portada completa; si la línea tiene un solo producto, lleva directo a él
  const tile = (g, i) => { const una = g.vistas.length === 1, v = g.vistas[0];
    return `<a class="t-bento-t${i === 0 ? ' grande' : ''}" data-linea="${esc(g.id)}" href="${esc(una ? v.url : `#${g.id}`)}"${una ? '' : ` data-f="${esc(g.id)}"`}>
      <span class="t-bento-x"><small>${esc(g.linea)}</small><b>${esc(g.titulo)}</b><em>${una ? desde(g) : `${g.vistas.length} productos · ${desde(g).toLowerCase()}`}</em></span>
      <span class="t-bento-img" aria-hidden="true">${portada(v.img)}</span><span class="t-bento-f" aria-hidden="true">${FLECHA}</span></a>`; };
  const destacado = todas[0] && { ...todas[0], linea: secciones[0].linea };
  // Lo nuevo de la tienda (solo si está a la venta): la pastilla de arriba de la portada
  const lealtad = secciones.find(g => g.id === 'lealtad');
  const nuevo = lealtad ? { url: lealtad.vistas[0].url, chip: 'Vuelve: tarjetas de lealtad para tu negocio' } : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: todas.map((v, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${v.url}`, name: v.nombre })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_TIENDA.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r.replace(/<[^>]+>/g, '') } })) }];
  return pagina({
    titulo: 'Tienda Vorka México · Simulador PAA, invitaciones digitales y kits', ruta: '/tienda/', navActual: 'inicio',
    descripcion: 'Simulador PAA para tu examen de admisión, invitaciones digitales con QR para tus celebraciones y kits para emprender. Productos digitales de Vorka México con entrega inmediata.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT_CATALOGO, whatsapp: true, navOscuro: true,
    cuerpo: `
<section class="t-hero">
  <picture class="t-hero-foto" aria-hidden="true"><source type="image/webp" srcset="/img/ciudades/cdmx-noche-960.webp 960w, /img/ciudades/cdmx-noche-1600.webp 1600w, /img/ciudades/cdmx-noche-2400.webp 2400w" sizes="100vw"><img src="/img/ciudades/cdmx-noche-1600.webp" alt="" width="1600" height="900" fetchpriority="high" decoding="async"></picture>
  <div class="marco t-hero-g">
    <div class="t-hero-txt">
      ${nuevo ? `<a class="t-hero-chip" href="${esc(nuevo.url)}"><b>Nuevo</b><span>${esc(nuevo.chip)}</span>${FLECHA}</a>` : '<span class="etiqueta">Tienda Vorka México</span>'}
      <h1 class="t-hero-h1">Todo para avanzar, <span class="metal">en un solo lugar.</span></h1>
      <p class="t-hero-sub">Exámenes, celebraciones, eventos y herramientas para tu negocio. Digital y al momento.</p>
      <div class="botones"><a class="btn acento" href="#productos">Explorar catálogo ${FLECHA}</a><a class="btn vidrio" href="/tienda/puntos/">Gana puntos</a></div>
      <ul class="t-hero-sellos" aria-label="Por qué comprar aquí"><li>${ICONOS.rayo}Entrega inmediata</li><li>${CANDADO_PAGO}Pago protegido</li><li>${ICONOS.tarjeta}Tarjeta, OXXO o SPEI</li></ul>
    </div>
    ${destacado ? `<a class="t-hero-pieza" href="${esc(destacado.url)}"><span class="t-hero-img">${portada(destacado.img)}</span><span class="t-hero-prot">${CANDADO_PAGO}Compra protegida</span>
      <span class="t-hero-cap"><small>Destacado · ${esc(destacado.linea)}</small><b>${esc(destacado.nombre)}</b><em class="num">${destacado.precio}</em></span></a>` : ''}
  </div>
  ${secciones.length > 1 ? `<nav class="marco t-hero-lineas" aria-label="Explora por línea">${secciones.map(g => `<a href="${esc(g.vistas.length === 1 ? g.vistas[0].url : `#${g.id}`)}"${g.vistas.length === 1 ? '' : ` data-f="${esc(g.id)}"`} data-linea="${esc(g.id)}"><i aria-hidden="true"></i>${esc(g.linea)}</a>`).join('')}<a class="t-hero-todas" href="#categorias">Todas las categorías ${FLECHA}</a></nav>` : ''}
</section>
<section class="t-sec t-confia" aria-label="Compra con confianza"><div class="marco"><ul class="t-confia-g">
  <li>${ICONOS.rayo}<b>Entrega inmediata</b><span>Tu archivo o tu acceso llega a tu correo en cuanto se confirma el pago.</span></li>
  <li>${CANDADO_PAGO}<b>Pago protegido</b><span>Lo procesa Stripe. Nosotros nunca vemos los datos de tu tarjeta.</span></li>
  <li>${ICONOS.tarjeta}<b>Paga como quieras</b><span>Tarjeta de crédito o débito, efectivo en OXXO o transferencia SPEI.</span></li>
  <li>${ICONOS.chat}<b>Personas reales</b><span>Te contesta alguien del equipo por correo o WhatsApp, en horario laboral.</span></li>
</ul></div></section>
${secciones.length ? `<section class="t-sec t-categorias" id="categorias"><div class="marco">
  <div class="t-cat-cab"><h2 class="h2">Categorías</h2></div>
  <nav class="t-bento" aria-label="Categorías de la tienda">${secciones.map(tile).join('')}
    <a class="t-bento-t t-bento-puntos" href="/tienda/puntos/"><span class="t-bento-x"><small>Puntos Vorka</small><b>Recomienda y gana</b><em>10 puntos por cada compra con tu liga · 1 punto = $1</em></span><span class="t-bento-v" aria-hidden="true">${LOGO}</span><span class="t-bento-f" aria-hidden="true">${FLECHA}</span></a>
  </nav>
</div></section>` : ''}
<section class="t-sec t-catalogo" id="productos"><div class="marco">
  <div class="t-cat-cab"><h2 class="h2">Catálogo</h2>
    <label class="t-buscar" hidden><span class="vh">Buscar en la tienda</span>${ICONOS.buscar}<input type="search" id="buscar" placeholder="Buscar: simulador, boda, evento…" autocomplete="off" enterkeyhint="search"></label>
    ${secciones.length > 1 ? `<div class="t-filtros" role="group" aria-label="Filtrar por línea"><a href="#productos" data-f="" aria-current="true">Todo</a>${secciones.map(g => `<a href="#${esc(g.id)}" data-f="${esc(g.id)}">${esc(g.linea)}</a>`).join('')}</div>` : ''}</div>
  ${secciones.length ? `<div class="t-cards">${secciones.map(g => g.vistas.map((v, i) => tarjeta(v, g, i === 0)).join('')).join('')}</div>
  <p class="t-sin" id="sin-resultados" hidden role="status">No encontramos nada con esa búsqueda. Prueba con otra palabra o <a href="${WHATSAPP}" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>.</p>`
    : `<p class="t-vacio">Muy pronto tendremos productos aquí. Mientras tanto, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>`}
  <a class="t-puntos-banda" href="/tienda/puntos/"><span><b>Recomienda y gana.</b> 10 puntos por cada compra con tu liga, canjeables en toda la tienda (1 punto = $1).</span><span class="btn acento chico">Crear mi cuenta de puntos ${FLECHA}</span></a>
</div></section>
${seccionFaq({ items: faqHtml(FAQ_TIENDA), pie: env.MARKETPLACE === '1' ? '<p class="t-nota">¿Creas recursos? <a href="/creadores">Vende en la tienda</a>.</p>' : '' })}`,
  });
}

// Filtros del catálogo: muestran solo una línea sin recargar (sin JavaScript, los enlaces bajan a esa línea)
// y el buscador (sin JavaScript no aparece): filtra por nombre, descripción y línea, sin importar acentos
const SCRIPT_CATALOGO = `(function(){
  var fs=[].slice.call(document.querySelectorAll('.t-filtros [data-f]')), cards=[].slice.call(document.querySelectorAll('.t-cards .t-card'));
  var caja=document.querySelector('.t-buscar'), q=document.getElementById('buscar'), sin=document.getElementById('sin-resultados'), linea='';
  var norm=function(t){ return String(t||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim(); };
  function pinta(){ var t=norm(q&&q.value), n=0; cards.forEach(function(c){ var ver=(!linea||c.dataset.linea===linea)&&(!t||t.split(/\\s+/).every(function(p){ return c.dataset.buscar.indexOf(p)>-1; })); c.hidden=!ver; if(ver) n++; }); if(sin) sin.hidden=n>0; }
  function filtra(k){ linea=k; fs.forEach(function(a){ if(a.dataset.f===k) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); }); pinta(); }
  document.addEventListener('click',function(e){ var a=e.target.closest('[data-f]'); if(!a||!fs.length) return; e.preventDefault(); filtra(a.dataset.f); document.getElementById('productos').scrollIntoView({behavior:'smooth'}); history.replaceState(null,'',a.dataset.f?'#'+a.dataset.f:'#productos'); });
  if(caja&&q){ caja.hidden=false; q.addEventListener('input',pinta); }
  // la lupa del menú lleva aquí y abre el buscador
  function enfocar(){ if(location.hash==='#buscar'&&q){ document.getElementById('productos').scrollIntoView(); q.focus(); } }
  window.addEventListener('hashchange',enfocar);
  var h=location.hash.slice(1); if(h&&fs.some(function(a){ return a.dataset.f===h; })) filtra(h); else enfocar();
})();`;

// Formulario de compra: funciona sin JavaScript (POST normal → 303 a Stripe) y con JavaScript (fetch + errores en línea)
// Formulario de compra. Los productos con contenido.regalable muestran "Para mí / Para regalar":
// al regalar se eligen cuántos (una liga de un solo uso por unidad), para quién y un mensaje.
// Sin JavaScript también funciona (el bloque de regalo se muestra con :has() y el servidor valida).
export const formCompra = (p, { error = '', ref = '', regalo = false } = {}) => {
  const regalable = !!p.contenido?.regalable;
  return `
<form class="t-form t-compra${regalable ? ' t-regalable' : ''}" id="form-compra" method="post" action="/api/checkout" novalidate data-unidad="${p.precio_centavos}">
  <input type="hidden" name="slug" value="${esc(p.slug)}">
  ${ref ? `<input type="hidden" name="ref" value="${esc(ref)}">` : ''}
  ${regalable ? `<div class="t-modo" role="radiogroup" aria-label="¿Para quién es?">
    <label><input type="radio" name="para_quien" value="yo"${regalo ? '' : ' checked'}><span>Para mí</span></label>
    <label><input type="radio" name="para_quien" value="regalo"${regalo ? ' checked' : ''}><span>🎁 Para regalar</span></label>
  </div>
  <input type="checkbox" name="regalo" value="on" id="es-regalo" hidden${regalo ? ' checked' : ''}>` : ''}
  <div class="t-precio"><b class="num" id="precio-total">${precio(p)}</b><span id="precio-nota">${esc(['cupo', 'brindi'].includes(p.contenido?.acceso?.app) && p.contenido.acceso.detalle ? p.contenido.acceso.detalle : `Pago único · ${esAcceso(p) ? 'acceso inmediato por un año' : 'descarga inmediata'}`)}</span></div>
  ${regalable ? `<fieldset class="t-regalo-campos" id="regalo-campos">
    <legend class="sr">Datos del regalo</legend>
    <div class="t-cant"><span><b>¿Cuántos regalas?</b><small>Una liga por persona; cada una funciona una sola vez.</small></span>
      <div class="t-cant-c"><button type="button" data-cant="-1" aria-label="Uno menos">−</button><input id="cantidad" name="cantidad" type="number" inputmode="numeric" min="1" max="10" value="1" aria-label="Cantidad de regalos"><button type="button" data-cant="1" aria-label="Uno más">+</button></div></div>
    <div class="t-campo"><label for="regalo_para">¿Para quién es? <small>(opcional)</small></label><input id="regalo_para" name="regalo_para" type="text" maxlength="80" placeholder="Ej. Sofía"></div>
    <div class="t-campo"><label for="regalo_mensaje">Mensaje en la tarjeta <small>(opcional)</small></label><textarea id="regalo_mensaje" name="regalo_mensaje" maxlength="280" rows="3" placeholder="¡Mucho éxito en tu examen!"></textarea></div>
  </fieldset>` : ''}
  <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
  <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254"><small class="t-ayuda" id="ayuda-email">${esAcceso(p) ? 'Aquí te llega tu acceso. Úsalo también para entrar después.' : 'Aquí te llegan tus archivos.'}</small>${regalable ? '<small class="t-ayuda t-ayuda-regalo">Aquí te llegan las ligas de regalo para que las compartas.</small>' : ''}</div>
  <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos y condiciones</a> y el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</span></label>
  <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
  <button class="btn acento" type="submit" id="btn-compra"><span class="t-btn-yo">Comprar ahora</span>${regalable ? '<span class="t-btn-regalo">Comprar regalo</span>' : ''} ${FLECHA}</button>
  <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta, OXXO o SPEI con Stripe</span></p>
</form>`;
};

const SCRIPT_PESTANAS = `(function(){ var ts=[].slice.call(document.querySelectorAll('.t-tabs [role=tab]')); if(!ts.length) return;
  var ps=ts.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); }); document.documentElement.classList.add('con-pestanas');
  function ve(i,foco){ ts.forEach(function(t,k){ t.setAttribute('aria-selected',k===i?'true':'false'); t.tabIndex=k===i?0:-1; ps[k].hidden=k!==i; }); if(foco) ts[i].focus(); }
  ts.forEach(function(t,i){ t.addEventListener('click',function(){ ve(i); }); t.addEventListener('keydown',function(e){ var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(k){ e.preventDefault(); ve((i+k+ts.length)%ts.length,true); } }); });
  ve(0);
})();`;
export const SCRIPT_COMPRA = `(function(){
  var f=document.getElementById('form-compra'); if(!f||!window.fetch) return;
  // Para mí / Para regalar: cantidad, precio total y textos
  var cant=document.getElementById('cantidad'), nota=document.getElementById('precio-nota'), total=document.getElementById('precio-total'), regalo=document.getElementById('es-regalo'), unidad=+f.dataset.unidad;
  function pesos(c){ return '$'+(c/100).toLocaleString('es-MX')+' MXN'; }
  function pinta(){ var esR=regalo&&regalo.checked, n=cant?Math.min(10,Math.max(1,parseInt(cant.value,10)||1)):1; if(cant) cant.value=n; if(total) total.textContent=pesos(unidad*(esR?n:1)); if(nota){ if(!nota.dataset.base) nota.dataset.base=nota.textContent; nota.textContent=esR?(n>1?n+' ligas de regalo':'1 liga de regalo')+' · cada una da un año de acceso':nota.dataset.base; } f.classList.toggle('es-regalo',!!esR); }
  f.querySelectorAll('input[name=para_quien]').forEach(function(r){ r.addEventListener('change',function(){ if(regalo) regalo.checked=(r.value==='regalo'&&r.checked); pinta(); }); });
  f.querySelectorAll('[data-cant]').forEach(function(b){ b.addEventListener('click',function(){ cant.value=(parseInt(cant.value,10)||1)+(+b.dataset.cant); pinta(); }); });
  if(cant) cant.addEventListener('input',pinta);
  pinta();
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={}; new FormData(f).forEach(function(v,k){d[k]=v;}); d.terminos=!!f.terminos.checked; delete d.para_quien;
    if(regalo&&regalo.checked){ d.regalo=true; d.cantidad=+cant.value||1; } else { delete d.regalo; delete d.cantidad; delete d.regalo_para; delete d.regalo_mensaje; }
    if(!d.nombre||d.nombre.trim().length<2){ f.nombre.focus(); return mostrar('Escribe tu nombre.'); }
    if(!f.email.checkValidity()||!d.email){ f.email.focus(); return mostrar('Escribe un correo válido.'); }
    if(!d.terminos){ return mostrar('Debes aceptar los términos y el aviso de privacidad.'); }
    err.hidden=true; btn.disabled=true; btn.textContent='Abriendo el pago…';
    fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){ if(x.ok&&x.j.url){ location.href=x.j.url; } else mostrar(x.j.error||'No pudimos abrir el pago. Intenta de nuevo.'); })
      .catch(function(){ mostrar('Sin conexión. Revisa tu internet e intenta de nuevo.'); });
  });
  // Barra fija en celular: se oculta cuando el formulario está a la vista
  var barra=document.getElementById('barra-compra');
  if(barra&&'IntersectionObserver' in window) new IntersectionObserver(function(es){ barra.classList.toggle('oculta',es[0].isIntersecting); }).observe(f);
})();`;

// Pestañas de la ficha (Descripción · Detalles · Preguntas): solo las que tienen contenido. Sin JavaScript se ven todas, una tras otra.
const pestanas = l => { const v = l.filter(([, , h]) => h); if (!v.length) return '';
  return `<section class="t-sec t-ficha"><div class="marco"><div class="t-tabs" role="tablist" aria-label="Información del producto">${v.map(([id, t], i) =>
    `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(t)}</button>`).join('')}</div>
  ${v.map(([id, t, h], i) => `<div class="t-panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" data-i="${i}">${h}</div>`).join('')}</div></section>`; };
const lista = items => `<ul class="t-lista">${items.map(t => `<li>${CHECK}<span>${typeof t === 'string' ? esc(t) : `<b>${esc(t.titulo)}</b>${t.texto ? ` ${esc(t.texto)}` : ''}`}</span></li>`).join('')}</ul>`;

export async function paginaProducto(env, req, url, slug) {
  const p = await productoPorSlug(env, slug);
  if (!p) {
    // Le cambiaron el enlace: redirigir para siempre al nuevo (conserva ?ref= y demás)
    const nuevo = await productoPorSlugAnterior(env, slug);
    if (nuevo) return new Response(null, { status: 301, headers: { location: `/tienda/${nuevo.slug}/${url.search}`, 'cache-control': 'public, max-age=3600' } });
  }
  // Cupo: todos sus niveles y paquetes se venden en su página única, con el plan ya elegido
  // Vuelve: sus planes y sucursales se contratan en su página única
  if (p?.contenido?.acceso?.app === 'vuelve') {
    const q = new URLSearchParams(url.search); q.set('plan', p.slug);
    return new Response(null, { status: 301, headers: { location: `/tienda/vuelve/?${q}#comprar`, 'cache-control': 'public, max-age=3600' } });
  }
  if (p?.contenido?.acceso?.app === 'cupo') {
    const q = new URLSearchParams(url.search); q.set('plan', p.slug);
    return new Response(null, { status: 301, headers: { location: `/tienda/cupo/?${q}#comprar`, 'cache-control': 'public, max-age=3600' } });
  }
  // Productos ocultos (simulacros adicionales) se compran desde su app, no tienen página propia
  if (p?.contenido?.oculto) return new Response(null, { status: 302, headers: { location: p.contenido.acceso?.ruta || '/tienda/' } });
  if (!p) return pagina({
    titulo: 'Producto no disponible · Vorka México', ruta: `/tienda/${slug}/`, noindex: true, status: 404,
    cuerpo: aviso({ clase: 'alerta', titulo: 'Este producto no está disponible', texto: 'Puede que ya no esté a la venta o que el enlace tenga un error.',
      extra: `<div class="botones t-centro"><a class="btn tinta" href="/tienda/">Ver la tienda ${FLECHA}</a></div>` }),
  });
  const { code, cookie } = await refDeVisita(env, req, url);
  if (!BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code });

  const c = p.contenido;
  // Si el producto tiene su propia página (p. ej. vorka.mx/simulador-paa/), esa es la canónica para Google
  const ruta = c.acceso?.ruta || `/tienda/${p.slug}/`;
  const imagen = p.imagen ? new URL(p.imagen, SITIO).toString() : undefined;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, description: p.descripcion_corta, sku: p.id,
    brand: { '@type': 'Brand', name: 'Vorka México' }, ...(imagen ? { image: [imagen] } : {}),
    offers: { '@type': 'Offer', url: SITIO + ruta, price: (p.precio_centavos / 100).toFixed(2), priceCurrency: p.moneda, availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Vorka México' } },
  };
  const faq = [...(c.faq || []), ...(esAcceso(p) ? FAQ_ACCESO : FAQ_TIENDA)];
  const pasos = c.pasos || [];

  return pagina({
    titulo: `${p.nombre} · Vorka México`, descripcion: p.descripcion_corta, ruta, imagen,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT_COMPRA + SCRIPT_PESTANAS, navActual: 'catalogo',
    cuerpo: `
<section class="t-sec t-hero"><div class="marco t-hero-g">
  <div class="t-hero-txt">
    ${navTienda(seccionDe(p))}
    <h1 class="t-h1 t-nombre">${esc(c.titular || p.nombre)}</h1>
    ${c.titular ? `<p class="t-sub">${esc(p.nombre)}</p>` : ''}
    <p class="t-lead">${esc(c.subtitulo || p.descripcion_corta)}</p>
    <div class="t-portada-hero">${portada(p, 'grande')}</div>
  </div>
  <aside class="t-hero-compra" id="comprar" aria-label="Comprar">
    ${formCompra(p, { error: url.searchParams.get('error') || '', ref: code || '', regalo: url.searchParams.get('regalo') === '1' })}
  </aside>
</div></section>
${pestanas([
  ['descripcion', 'Descripción', [c.para_quien?.length ? `<h2 class="t-h2">Te sirve si…</h2>${lista(c.para_quien)}` : '', c.incluye?.length ? `<h2 class="t-h2">Qué incluye</h2>${lista(c.incluye)}` : ''].filter(Boolean).join('')],
  ['detalles', pasos.length === 7 ? 'Los 7 pasos' : 'Paso a paso', pasos.length ? `<ol class="t-pasos">${pasos.map((s, i) => `<li><span class="t-paso-n num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.titulo)}</h3>${s.texto ? `<p>${esc(s.texto)}</p>` : ''}</li>`).join('')}</ol>` : ''],
  ['preguntas', 'Preguntas', `<h2 class="t-h2 sr">Preguntas frecuentes</h2><div class="t-faq">${faqHtml(faq)}</div>
    <p class="t-nota">¿No encuentras tu respuesta? Te contesta una persona: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> o <a href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>.</p>
    <div class="botones t-faq-cta"><a class="btn acento" href="#comprar">Comprar por ${precio(p)} ${FLECHA}</a></div>`],
])}
${c.acceso?.app === 'cupo' ? ELEGIR('cupo') : ''}
${await masTienda(env, seccionDe(p))}
<div class="t-barra" id="barra-compra"><div><b class="num">${precio(p)}</b><small>${esAcceso(p) ? 'Acceso inmediato' : 'Descarga inmediata'}</small></div><a class="btn acento chico" href="#comprar">Comprar</a></div>`,
  });
}

export async function sitemapTienda(env) {
  const ps = await listarProductos(env);
  const urls = [`<url><loc>${SITIO}/tienda/</loc><priority>0.8</priority></url>`,
    `<url><loc>${SITIO}/tienda/brindi/</loc><priority>0.9</priority></url>`,   // Brindi tiene página aunque sus planes aún estén ocultos
    // Varios productos comparten página (Brindi): cada ruta va una sola vez
    // Si el producto tiene página propia (p. ej. /simulador-paa/), en el sitemap va esa (es la canónica)
    ...ps.map(p => p.contenido.acceso?.ruta
      ? `<url><loc>${SITIO}${p.contenido.acceso.ruta}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.9</priority></url>`
      : `<url><loc>${SITIO}/tienda/${p.slug}/</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.7</priority></url>`)].filter((u, i, a) => a.findIndex(x => x.split('</loc>')[0] === u.split('</loc>')[0]) === i);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join('\n  ')}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
