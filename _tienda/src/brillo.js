// Brillo (control diario para estéticas, salones, barberías, uñas y spas; quinta app de Diversificación de Vorka México).
// /tienda/brillo/ → ficha comercial única: prueba de 7 días, planes Básico y Profesional (mensual o anual), sucursales
// adicionales (Business), el paquete con Vuelve y Agenda, comparación, preguntas y compra. Se cobra por suscripción (ver
// suscripciones.js). La app vive en brillo.vorka.mx (Vorka OS). Aquí solo se vende. Precios: migrations/0089_brillo.sql.
import { heroMarca, seccionQueEs, indiceProducto, colorDe, CSS_MARCA, CSS_SECCIONES } from './marca-producto.js';
import { productoPorSlug, registrarAnalitica } from './modelo.js';
import { pagina, esc } from './paginas.js';
import { refDeVisita, precio, masTienda, seccionFaq, seccionCompra, CANDADO_PAGO } from './tienda.js';
import { ofertas, migas } from './seo.js';
import { resenasDe, ldResenas, seccionResenas } from './resenas.js';
import { FLECHA, CHECK } from './marco.generado.js';
import { barraCompra } from './barra-compra.js';

const APP = 'https://brillo.vorka.mx';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
export const RUTA_BRILLO = '/tienda/brillo/';
export const OG_BRILLO = 'https://vorka.mx/assets/tienda/v3/brillo-og.jpg';
const MAX_SUCURSALES = 20;
const PLANES = [
  { slug: 'brillo-basico-mensual', suc: 'brillo-sucursal-mensual', nombre: 'Básico', periodo: 'Mensual', cada: 'al mes' },
  { slug: 'brillo-profesional-mensual', suc: 'brillo-sucursal-mensual', nombre: 'Profesional', periodo: 'Mensual', cada: 'al mes' },
  { slug: 'brillo-basico-anual', suc: 'brillo-sucursal-anual', nombre: 'Básico', periodo: 'Anual', cada: 'al año', nota: '2 meses gratis' },
  { slug: 'brillo-profesional-anual', suc: 'brillo-sucursal-anual', nombre: 'Profesional', periodo: 'Anual', cada: 'al año', nota: '2 meses gratis' },
  { slug: 'brillo-paquete-mensual', nombre: 'Brillo + Vuelve + Agenda', periodo: 'Mensual', cada: 'al mes', paquete: true },
  { slug: 'brillo-paquete-anual', nombre: 'Brillo + Vuelve + Agenda', periodo: 'Anual', cada: 'al año', nota: '2 meses gratis', paquete: true },
];

// Lo que hoy hace Brillo (en producción). Nada de lo que viene después va aquí.
const INCLUYE = [
  ['Registro desde el celular', 'Cada técnica entra con la liga del salón y su PIN y registra clienta, servicio y cómo pagó en segundos.'],
  ['Lista oficial de precios', 'Con buscador y protocolos. Si alguien cobra distinto, pide el motivo y queda marcado para revisión.'],
  ['Corte de caja diario', 'Servicios por técnica, cobros por forma de pago, anticipos, pendientes y la diferencia de caja.'],
  ['Apertura y cierre', 'Una vez al día, con la hora y quién lo hizo. En el cierre, la evaluación rápida de cada técnica.'],
  ['Incidencias y garantías', 'Qué pasó, quién hizo el trabajo, quién autorizó la solución y cuánto le costó al salón, con fotos.'],
  ['Tareas del equipo', 'La limpieza y lo que le toca a cada quien cada día; lo palomean desde su celular.'],
  ['Agenda con Google Calendar', 'Citas por técnica, recordatorios por WhatsApp con un toque y tu calendario de Google unido.'],
  ['Comisiones y evaluaciones', 'Por servicio o semanales con tope. Evaluación quincenal con lo que dicen los registros.'],
  ['Inventario y gastos', 'Insumos y productos con su mínimo, y la utilidad del mes: lo vendido menos lo gastado.'],
];
const COMPARA = [
  ['AgendaPro', '$299 (1 profesional)', 'Pensado en citas. El WhatsApp se paga aparte.'],
  ['Booksy', '$499', 'Más $100 por cada miembro del equipo. Pensado en reservas.'],
];
const faq = () => [
  ['¿Puedo probar antes de pagar?', `Sí. Das de alta tu salón en <a href="${APP}/">brillo.vorka.mx</a> en unos minutos y lo usas completo 7 días, sin tarjeta. Si te sirve, te suscribes con el mismo correo y todo sigue igual.`],
  ['¿Mi equipo tiene que descargar una app?', 'No. Les mandas la liga del salón por WhatsApp, la guardan en su pantalla de inicio con el logo de tu salón y entran con su PIN. No necesitan correo ni contraseña.'],
  ['¿Qué diferencia hay entre Básico y Profesional?', 'Los dos traen todo Brillo. Básico es para salones chicos: una sucursal y hasta 3 personas del equipo además de ti. Profesional es para hasta 8 personas. Si tienes más de una sucursal, cada sucursal adicional se suma a tu plan.'],
  ['¿Brillo cobra a mis clientas?', 'No. Brillo registra lo que se cobra en tu salón (efectivo, tarjeta, transferencia y anticipos) para que el corte cuadre. El dinero lo recibes tú, como siempre.'],
  ['¿Sirve si no estoy en el salón?', 'Para eso está hecho. Ves en tu celular lo que se vendió, lo que entró, si cuadró la caja, quién abrió y a qué hora, y lo que necesita tu atención. La bitácora guarda quién hizo qué.'],
  ['¿Se conecta con Google Calendar?', 'Sí. Desde la agenda conectas el calendario del salón: cada cita se crea, se mueve o se cancela sola ahí, y lo que ya tenías se ve en Brillo.'],
  ['¿Y con Vuelve?', 'Si tienes Vuelve con el mismo correo, cada servicio que se registra con el WhatsApp de la clienta le suma su sello solo. Con el paquete tienes Brillo, Vuelve y Agenda en una sola suscripción.'],
  ['¿Cuánto cuesta y cómo pago?', 'Básico $349 y Profesional $649 al mes, o el plan anual con 2 meses gratis. Cada sucursal adicional, $399 al mes. En pesos mexicanos con IVA incluido. Pagas con tarjeta de crédito o débito, procesado por Stripe, y se renueva solo. Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.'],
  ['¿Qué pasa con los datos de mis clientas y mi equipo?', 'Son tuyos. Vorka solo los guarda por tu cuenta para darte el servicio: no los vende ni los usa para publicidad. Las fotos de los trabajos no se guardan en Brillo: se mandan al grupo de WhatsApp del salón.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí, desde Brillo › Cuenta, sin llamadas. Brillo sigue activo hasta el final del periodo que pagaste. Después queda en pausa: puedes consultar todo, pero no registrar.'],
];

const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS = [ico('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>'), ico('<path d="M4 6h16M4 12h16M4 18h10"/>'), ico('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>'),
  ico('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'), ico('<path d="M12 3l9.5 16.5h-19L12 3z"/><path d="M12 10v4M12 17h.01"/>'), ico('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
  ico('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'), ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2"/>'), ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')];

export async function paginaBrillo(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const planes = (await Promise.all(PLANES.map(async x => ({ ...x, prod: await productoPorSlug(env, x.slug), sucursal: x.suc ? await productoPorSlug(env, x.suc) : null })))).filter(x => x.prod);
  if (planes[0] && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: planes[0].prod.id, ref_code: code }, req);
  const elegido = planes.some(x => x.slug === url.searchParams.get('plan')) ? url.searchParams.get('plan') : (planes.find(x => x.slug === 'brillo-profesional-mensual') || planes[0])?.slug;
  const error = url.searchParams.get('error') || '';
  const correo = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(url.searchParams.get('email') || '') ? url.searchParams.get('email') : '';
  const sucursales = Math.min(MAX_SUCURSALES, Math.max(0, parseInt(url.searchParams.get('sucursales') || '0', 10) || 0));
  const de = slug => planes.find(x => x.slug === slug);
  const bM = de('brillo-basico-mensual'), bA = de('brillo-basico-anual'), pM = de('brillo-profesional-mensual'), pA = de('brillo-profesional-anual'), qM = de('brillo-paquete-mensual'), qA = de('brillo-paquete-anual');
  // El ahorro del paquete contra las tres apps por separado (con los precios de la tienda)
  const [vuelveM, agendaM] = qM && pM ? await Promise.all([productoPorSlug(env, 'vuelve-mensual'), productoPorSlug(env, 'agenda-mensual')]) : [null, null];
  const separado = vuelveM && agendaM ? pM.prod.precio_centavos + vuelveM.precio_centavos + agendaM.precio_centavos : null;
  const ahorro = separado && separado > qM.prod.precio_centavos ? separado - qM.prod.precio_centavos : null;
  const nuevo = `${APP}/#/nuevo`;
  const FAQ = faq();
  const rs = planes.length ? await resenasDe(env, RUTA_BRILLO) : null;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Brillo · Control diario para estéticas y salones', brand: { '@type': 'Brand', name: 'Brillo' },
    description: 'Cada técnica registra sus servicios desde su celular y la dueña ve ventas, corte de caja, incidencias, agenda y a su equipo. Prueba 7 días gratis.',
    image: [OG_BRILLO], url: `https://vorka.mx${RUTA_BRILLO}`,
    ...(planes.length ? { offers: ofertas({ ruta: RUTA_BRILLO, centavos: planes.map(x => x.prod.precio_centavos), detalle: planes.map(x => ({ centavos: x.prod.precio_centavos, name: `${x.nombre} · plan ${x.periodo.toLowerCase()}` })) }), ...ldResenas(rs) } : {}) },
  migas('Brillo', RUTA_BRILLO),
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }];
  const datos = Object.fromEntries(planes.map(x => [x.slug, { p: x.prod.precio_centavos, s: x.sucursal?.precio_centavos ?? null, cada: x.cada, paquete: !!x.paquete }]));
  const tarjeta = (m, a, { titulo, para, lista, rec = false }) => m || a ? `<article class="bl-plan${rec ? ' rec' : ''}">${rec ? '<span class="bl-sello">El más elegido</span>' : ''}<h3>${titulo}</h3><p class="bl-para">${para}</p>
      <p class="bl-precio"><b>${precio((m || a).prod)}</b> <small>${(m || a).cada}</small></p>${m && a ? `<p class="bl-anual">o ${precio(a.prod)} al año, 2 meses gratis</p>` : ''}
      <ul>${lista.map(i => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
      <a class="bl-btn${rec ? '' : ' ghost'}" href="?plan=${(m || a).slug}#comprar" data-plan="${(m || a).slug}">Suscribirme</a></article>` : '';
  return pagina({ navActual: 'catalogo', entrar: { url: `${APP}/`, app: 'Brillo' },
    titulo: 'Brillo: control para estéticas y salones | Prueba 7 días gratis', ruta: RUTA_BRILLO, imagen: OG_BRILLO,
    descripcion: 'Cada técnica registra sus servicios desde su celular y tú ves ventas, corte de caja, incidencias, agenda y a tu equipo, aunque no estés en el salón. Desde $349 al mes. Prueba 7 días gratis.',
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><style>${CSS}</style>`,
    headers: cookie ? { 'set-cookie': cookie } : {},
    script: SCRIPT,
    cuerpo: `<div class="bl">
${heroMarca('brillo', {
  apoyo: 'Cada técnica registra sus servicios desde su celular en segundos. Tú ves cuánto se vendió, cuánto entró, si cuadró la caja y qué necesita tu atención, aunque no estés en el salón.',
  botones: `<a class="pm-btn" href="${esc(nuevo)}">Pruébalo 7 días gratis ${FLECHA}</a><a class="pm-btn sec" href="#planes">Ver precios</a>`,
  despues: `<p class="pm-precio">Desde <b>${bM ? precio(bM.prod) : '$349 MXN'}</b> al mes · prueba 7 días gratis, sin tarjeta</p><p class="t-ya">¿Ya tienes cuenta? <a href="${APP}/">Entra en brillo.vorka.mx</a></p>`,
})}
${indiceProducto('brillo', [['que-es', 'Qué es'], ['incluye', 'Qué incluye'], ['compara', 'Compara'], ['paquete', 'Paquete'], ['planes', 'Precios'], ['ayuda', 'Preguntas']], `<a class="pm-btn" href="${esc(nuevo)}">Pruébalo gratis</a>`)}
${seccionQueEs('brillo', { titulo: 'Tu salón en orden, aunque no estés.',
  texto: 'Brillo pone en un solo lugar lo que hoy vive en libretas, chats y la memoria de alguien: <b>qué se hizo, quién lo hizo, cuánto se cobró y si cuadra la caja</b>. Tu equipo registra desde su celular y tú lo ves todo con su hora.',
  para: [['Estéticas y salones con equipo', 'Saber qué hizo cada técnica, cuánto se cobró y pagar comisiones sin pleitos.'], ['Uñas, pestañas, barberías y spas', 'Una lista de precios única y protocolos que todas conocen.'], ['Dueñas que no pueden estar todo el día', 'Abrir el celular y ver si el día va bien, sin llamar a nadie.']] })}

<section class="bl-sec suave" id="incluye"><div class="marco">
  <div class="bl-cab"><span class="bl-et">Qué incluye</span><h2>Lo que necesita un salón para trabajar en orden.</h2><p>Los dos planes traen todo Brillo. La diferencia es cuántas personas de tu equipo lo usan.</p></div>
  <ul class="bl-incluye">${INCLUYE.map(([t, d], i) => `<li>${ICONOS[i]}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
</div></section>

<section class="bl-sec" id="compara"><div class="marco">
  <div class="bl-cab"><span class="bl-et">Compara</span><h2>Hecho para cómo trabaja un salón en México.</h2><p>Las apps de reservas te ayudan a agendar. Brillo te ayuda a controlar lo que pasa en el salón.</p></div>
  <div class="bl-tabla-c"><table class="bl-tabla"><thead><tr><th scope="col">Producto</th><th scope="col">Precio al mes</th><th scope="col">Lo que hay que saber</th></tr></thead>
    <tbody><tr class="nos"><th scope="row">Brillo</th><td><b>Desde ${bM ? precio(bM.prod) : '$349 MXN'}</b></td><td>Registro por técnica, corte de caja, incidencias, comisiones y evaluaciones. En pesos y con IVA incluido.</td></tr>
    ${COMPARA.map(([n, p, d]) => `<tr><th scope="row">${n}</th><td>${p}</td><td>${d}</td></tr>`).join('')}</tbody></table></div>
  <p class="bl-nota">Precios publicados en la página oficial de cada producto, consultados el 25 de octubre de 2026. Pueden cambiar; revísalos antes de decidir. Las marcas mencionadas son de sus dueños.</p>
</div></section>

<section class="bl-sec suave" id="paquete"><div class="marco bl-dos">
  <div class="bl-cab izq"><span class="bl-et">Brillo + Vuelve + Agenda</span><h2>Que te reserven, que vuelvan y que todo cuadre.</h2>
    <p>Con el paquete tienes las tres apps con la misma cuenta y el mismo correo: Brillo para el control del salón, Vuelve para la tarjeta de lealtad de tus clientas y Agenda para tus citas en línea.${qM ? ` Por ${precio(qM.prod)} al mes${ahorro ? `, ${(ahorro / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} menos que por separado` : ''}.` : ''}</p>
    <div class="bl-ctas">${qM || qA ? `<a class="bl-btn" href="?plan=${(qM || qA).slug}#comprar" data-plan="${(qM || qA).slug}">Quiero el paquete ${FLECHA}</a>` : ''}<a class="bl-btn ghost" href="/tienda/vuelve/">Conoce Vuelve</a></div></div>
  <ul class="bl-paq">${['Brillo Profesional, hasta 8 personas', 'Vuelve con 1 sucursal: cada servicio registrado le suma el sello a la clienta', 'Agenda con 1 profesional y tu página de citas', 'Una sola suscripción y un solo cobro'].map(x => `<li>${CHECK}<span>${x}</span></li>`).join('')}</ul>
</div></section>

${barraCompra({ titulo: 'Brillo', detalle: `Desde ${bM ? precio(bM.prod) : '$349 MXN'} al mes · prueba 7 días gratis`, href: '#planes', boton: 'Ver planes' })}
<section class="bl-sec" id="planes"><div class="marco">
  <div class="bl-cab"><span class="bl-et">Precios</span><h2>Pruébalo 7 días. Después, elige tu plan.</h2><p>En pesos mexicanos con IVA incluido. Sin comisiones por servicio. Cancela cuando quieras.</p></div>
  <div class="bl-planes">
    ${tarjeta(bM, bA, { titulo: 'Básico', para: '1 sucursal · hasta 3 personas', lista: ['Todo Brillo', 'Registro, corte, incidencias y agenda', 'Para salones que empiezan a crecer'] })}
    ${tarjeta(pM, pA, { titulo: 'Profesional', para: 'Hasta 8 personas', rec: true, lista: ['Todo Brillo', 'Comisiones, evaluaciones e inventario', `Sucursal adicional: ${pM?.sucursal ? `${precio(pM.sucursal)} al mes` : '$399 MXN al mes'}`] })}
    ${tarjeta(qM, qA, { titulo: 'Brillo + Vuelve + Agenda', para: 'Las tres apps, una cuenta', lista: ['Brillo Profesional', 'Tarjeta de lealtad y citas en línea', separado && qM ? `Por separado: ${precio({ precio_centavos: separado })} al mes` : 'Una sola suscripción'] })}
  </div>
  <p class="bl-nota" style="text-align:center">¿Más de una sucursal? Elige Profesional y suma cada sucursal adicional al comprar. <a href="${esc(nuevo)}">O empieza tu prueba gratis</a>, sin tarjeta.</p>
</div></section>

${planes.length ? seccionCompra({ titulo: 'Suscríbete a Brillo', intro: `¿Aún no lo pruebas? <a href="${esc(nuevo)}">Empieza gratis 7 días</a>, sin tarjeta. Si ya lo estás probando, suscríbete con el mismo correo y tu salón sigue tal cual.`,
  pasos: [['Eliges tu plan', 'Básico, Profesional o el paquete, mensual o anual, y tus sucursales.'], ['Pagas con tarjeta', 'Se renueva solo; lo cancelas cuando quieras.'], ['Te llega tu acceso por correo', 'Con el mismo correo de tu prueba, todo sigue igual.']],
  garantias: ['Pago seguro con Stripe: nunca vemos tu tarjeta', 'Sin contratos ni permanencia', 'Soporte de personas por correo y WhatsApp'],
  form: `<form class="t-form t-compra" id="form-brillo" method="post" action="/api/checkout" novalidate>
    ${code ? `<input type="hidden" name="ref" value="${esc(code)}">` : ''}
    <div class="t-campo"><label for="slug">Plan</label><select id="slug" name="slug">${planes.map(x => `<option value="${esc(x.slug)}"${elegido === x.slug ? ' selected' : ''}>${x.nombre} · ${x.periodo} · ${precio(x.prod)} ${x.cada}${x.nota ? ` (${x.nota})` : ''}</option>`).join('')}</select></div>
    <div class="t-campo" id="campo-sucursales"><label for="sucursales">Sucursales adicionales</label><input id="sucursales" name="sucursales" type="number" inputmode="numeric" min="0" max="${MAX_SUCURSALES}" value="${sucursales}"><small class="t-ayuda">Tu plan incluye 1 sucursal. Cada una de más se suma a tu plan; puedes cambiarlo después desde Brillo › Cuenta.</small></div>
    <div class="t-campo"><label for="nombre">Tu nombre</label><input id="nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="120"></div>
    <div class="t-campo"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${esc(correo)}"><small class="t-ayuda">Usa el mismo correo de tu salón en Brillo para que todo siga igual.</small></div>
    <p class="bl-total">Pagas hoy <b id="bl-total">${precio(de(elegido)?.prod || planes[0].prod)}</b> <span id="bl-cada"></span></p>
    <label class="t-casilla"><input type="checkbox" name="terminos" value="on" required><span>Acepto los <a href="/legal/terminos/" target="_blank">términos</a>, las <a href="/legal/brillo/" target="_blank">condiciones de Brillo</a> (incluida la renovación automática) y el <a href="/legal/brillo/privacidad/" target="_blank">aviso de privacidad de Brillo</a>.</span></label>
    <p class="t-error" id="error-compra" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
    <button class="btn acento" type="submit" id="btn-compra">Ir a pagar ${FLECHA}</button>
    <p class="t-pago">${CANDADO_PAGO}<span><b>Pago 100% protegido</b> · Tarjeta de crédito o débito con Stripe · Se renueva solo y lo cancelas cuando quieras</span></p>
  </form><script type="application/json" id="bl-precios">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>` }) : ''}

${seccionResenas(rs)}
${seccionFaq({ titulo: 'Antes de empezar', items: FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), pie: '<p class="t-nota t-legal"><a href="/legal/brillo/">Condiciones de Brillo</a> · <a href="/legal/brillo/privacidad/">Aviso de privacidad</a> · Brillo · Powered by vorka.mx</p>' })}
<section class="pm-sec bl-cierre" style="--pm:${colorDe('brillo')}"><div class="marco"><h2 class="pm-h2">Tu salón en orden, aunque no estés.</h2><p>Pruébalo 7 días sin tarjeta. Si te sirve, te suscribes con el mismo correo y todo sigue igual.</p><div class="pm-ctas"><a class="pm-btn" href="${esc(nuevo)}">Pruébalo 7 días gratis ${FLECHA}</a></div></div></section>
${await masTienda(env, 'negocios')}
</div>`,
  });
}

const CSS = `${CSS_MARCA}${CSS_SECCIONES}
.bl{--bl-c:#A3245E;--bl-c2:#A3245E}
[data-tema="oscuro"] .bl{--bl-c2:color-mix(in srgb,#A3245E 55%,#fff)}
[data-tema="oscuro"] .pm-et:not(.gris),[data-tema="oscuro"] .pm-grande b{color:color-mix(in srgb,var(--pm) 55%,#fff)}
.pm-precio{margin:16px 0 0;font-size:15px;color:var(--fg-2)}.pm-precio b{font-size:22px;color:var(--fg);letter-spacing:-.02em}
.bl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--bl-c);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 12px 28px -14px var(--bl-c)}
.bl-btn svg{width:17px;height:17px}.bl-btn.ghost{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--line-2)}
.bl-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.bl-sec{padding:clamp(64px,9vw,104px) 0;scroll-margin-top:54px}.bl-sec.suave{background:var(--bg-2)}
.bl-cab{max-width:680px;margin:0 auto 40px;text-align:center}.bl-cab.izq{text-align:left;margin:0 0 24px}
.bl-et{display:inline-block;font-size:14px;font-weight:650;color:var(--bl-c2)}
.bl-cab h2{font-weight:800;font-size:clamp(28px,4vw,44px);line-height:1.06;letter-spacing:-.04em;margin:10px 0 0;text-wrap:balance}
.bl-cab p{color:var(--fg-2);font-size:17px;line-height:1.55;margin:14px 0 0}
.bl-incluye{list-style:none;margin:0;padding:0;display:grid;gap:14px}@media(min-width:720px){.bl-incluye{grid-template-columns:repeat(3,1fr)}}
.bl-incluye li{background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:20px}.bl-incluye svg{width:24px;height:24px;color:var(--bl-c2)}
.bl-incluye b{display:block;font-size:17px;margin:10px 0 4px}.bl-incluye p{margin:0;color:var(--fg-2);font-size:15px;line-height:1.5}
.bl-tabla-c{overflow-x:auto;border:1px solid var(--line);border-radius:16px}.bl-tabla{width:100%;border-collapse:collapse;font-size:15px;min-width:560px}
.bl-tabla th,.bl-tabla td{padding:14px 16px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}.bl-tabla tr:last-child th,.bl-tabla tr:last-child td{border-bottom:0}
.bl-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:600}.bl-tabla .nos{background:color-mix(in srgb,var(--bl-c) 7%,transparent)}.bl-tabla .nos th{color:var(--bl-c2)}
.bl-nota{font-size:13.5px;color:var(--fg-2);margin:14px 0 0}.bl-nota a{color:inherit}
.bl-dos{display:grid;gap:28px;align-items:center}@media(min-width:900px){.bl-dos{grid-template-columns:1.1fr .9fr;gap:56px}}
.bl-paq{list-style:none;margin:0;padding:22px;display:grid;gap:12px;background:var(--bg);border:1px solid var(--line);border-radius:20px}
.bl-paq li,.bl-plan li{display:flex;gap:10px;align-items:flex-start;font-size:15.5px;line-height:1.45}.bl-paq svg,.bl-plan li svg{width:18px;height:18px;flex:none;margin-top:2px;color:var(--bl-c2)}
.bl-planes{display:grid;gap:16px}@media(min-width:900px){.bl-planes{grid-template-columns:repeat(3,1fr);align-items:start}}
.bl-plan{position:relative;background:var(--bg);border:1px solid var(--line);border-radius:22px;padding:26px;display:grid;gap:10px}
.bl-plan.rec{border:2px solid var(--bl-c)}.bl-sello{position:absolute;top:-12px;left:24px;background:var(--bl-c);color:#fff;font-size:12.5px;font-weight:650;padding:4px 12px;border-radius:999px}
.bl-plan h3{margin:0;font-size:21px;letter-spacing:-.02em}.bl-para{margin:0;color:var(--fg-2);font-size:15px}
.bl-precio{margin:6px 0 0}.bl-precio b{font-size:34px;letter-spacing:-.04em}.bl-precio small{color:var(--fg-2)}.bl-anual{margin:0;font-size:14px;color:var(--fg-2)}
.bl-plan ul{list-style:none;margin:6px 0 10px;padding:0;display:grid;gap:8px}
.bl-total{font-size:16px;margin:4px 0 12px}.bl-total b{font-size:22px}
`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-brillo'); if(!f||!window.fetch) return;
  var P={}; try{ P=JSON.parse(document.getElementById('bl-precios').textContent); }catch(e){}
  var tot=document.getElementById('bl-total'), cada=document.getElementById('bl-cada'), cs=document.getElementById('campo-sucursales');
  function num(el,min,max){ return Math.min(max,Math.max(min,parseInt(el.value,10)||min)); }
  function fmt(c){ return '$'+(c/100).toLocaleString('es-MX',{maximumFractionDigits:2})+' MXN'; }
  function pinta(){ var x=P[f.slug.value]; if(!x) return; cs.hidden=!!x.paquete||!x.s;
    var t=x.p+(x.paquete?0:(x.s||0)*num(f.sucursales,0,20));
    if(window.VD&&VD.frase){ var fr=VD.frase(t,x.cada); tot.textContent=fr.hoy; cada.textContent=fr.luego; } else { tot.textContent=fmt(t); cada.textContent=x.cada; } }
  document.addEventListener('vorka:descuento',pinta); f.slug.addEventListener('change',pinta); f.sucursales.addEventListener('input',pinta); pinta();
  document.querySelectorAll('[data-plan]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); f.slug.value=a.dataset.plan; pinta(); document.getElementById('comprar').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ f.nombre.focus({preventScroll:true}); },500); }); });
  var err=document.getElementById('error-compra'), btn=document.getElementById('btn-compra'), txt=btn.innerHTML;
  function mostrar(m){ err.textContent=m; err.hidden=false; btn.disabled=false; btn.innerHTML=txt; }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var x=P[f.slug.value]||{};
    var d={ slug:f.slug.value, sucursales:x.paquete?0:num(f.sucursales,0,20), nombre:f.nombre.value, email:f.email.value.trim(), terminos:!!f.terminos.checked }; if(f.ref) d.ref=f.ref.value; if(f.codigo&&f.codigo.value) d.codigo=f.codigo.value.trim();
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
