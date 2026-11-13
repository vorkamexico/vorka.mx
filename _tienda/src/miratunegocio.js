// Tienda › Mira tu negocio (vorka.mx/tienda/mira-tu-negocio/): la persona escribe el nombre de su negocio, el giro y la ciudad
// (y si quiere sube su logo y elige color) y ve al instante su tarjeta de sellos, su agenda y su página web con su nombre.
// Todo se dibuja en el navegador: no se guarda nada ni se sube el logo. «Lo quiero» abre WhatsApp con sus datos ya escritos.
// La liga se puede mandar armada: ?n=Estética%20Lumbre&g=estetica&c=Celaya abre la vista previa directo (sin el logo).
// «Lo quiero» pide nombre y WhatsApp, lo guarda como prospecto en Vorka OS (POST /api/mira-tu-negocio → /api/publico/vorka/mira-negocio)
// y luego abre WhatsApp. Si Vorka OS no responde, igual abre WhatsApp.
// Píxel: ViewContent al armar la primera vista previa y Lead al mandar «Lo quiero».
import { pagina, esc } from './paginas.js';
import { productoPorSlug, registrarAnalitica, dentroDelLimite } from './modelo.js';
import { json, sha256 } from './util.js';
import { refDeVisita, seccionFaq } from './tienda.js';
import { ldScript, migas } from './seo.js';
import { FLECHA } from './marco.generado.js';
// Sin importar negociocompleto.js (ese importa los giros de aquí): mismas constantes
const RUTA_NEGOCIO_COMPLETO = '/tienda/negocio-completo/', SLUG_NEGOCIO_COMPLETO = 'negocio-completo-mensual';

export const RUTA_MIRA = '/tienda/mira-tu-negocio/';
const WA_NUM = '528117804869';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

// Por giro: servicios de ejemplo para la agenda (nombre, hora) y para la página (con precio), premio de la tarjeta y frase de portada
export const GIROS = {
  // Belleza y cuidado personal
  estetica: { nombre: 'Estética', frase: 'Corte, color y peinado con cita.', premio: 'tu corte gratis', servicios: [['Corte de cabello', 250], ['Tinte', 650], ['Peinado', 350], ['Tratamiento', 450]],
    ideas: ['Galería de antes y después para que vean tu trabajo', 'Agenda por estilista: cada quien con sus horarios', 'Paquete de novia o XV años con apartado en línea'] },
  barberia: { nombre: 'Barbería', frase: 'Cortes y barba sin hacer fila.', premio: 'tu corte gratis', servicios: [['Corte clásico', 180], ['Corte y barba', 260], ['Arreglo de barba', 120], ['Corte niño', 150]],
    ideas: ['Que reserven su silla y ya no hagan fila', 'Fotos de cortes para que elijan el suyo antes de llegar', 'Recordatorio a las tres semanas para su siguiente corte'] },
  unas: { nombre: 'Uñas', frase: 'Manicure y pedicure con cita.', premio: 'tu manicure gratis', servicios: [['Manicure', 250], ['Gelish', 300], ['Pedicure', 320], ['Acrílico', 450]],
    ideas: ['Catálogo de diseños de temporada', 'Reservas con anticipo para no perder citas', 'Sello extra a quien trae a una amiga'] },
  pestanas: { nombre: 'Pestañas y cejas', frase: 'Pestañas y cejas listas, con cita.', premio: 'tu retoque gratis', servicios: [['Extensiones clásicas', 600], ['Retoque', 350], ['Lifting de pestañas', 450], ['Diseño de ceja', 200]],
    ideas: ['Recordatorio de retoque a las tres semanas', 'Fotos de estilos para que elijan antes de la cita', 'Cuidados después del servicio, siempre a la mano'] },
  spa: { nombre: 'Spa y masajes', frase: 'Date un respiro, reserva tu masaje.', premio: 'tu masaje gratis', servicios: [['Masaje relajante', 600], ['Facial', 550], ['Masaje descontracturante', 700], ['Piedras calientes', 750]],
    ideas: ['Tarjetas de regalo para cumpleaños y Día de las Madres', 'Paquetes para parejas con reserva en línea', 'Recordatorio mensual para que se den su tiempo'] },
  tatuajes: { nombre: 'Tatuajes', frase: 'Tu idea, en tu piel, con cita.', premio: 'tu perforación gratis', servicios: [['Tatuaje chico', 900], ['Sesión por hora', 1200], ['Perforación', 350], ['Retoque', 0]],
    ideas: ['Portafolio por estilo y por artista', 'Cotización con foto de la idea antes de agendar', 'Cuidados del tatuaje para mandar después de cada sesión'] },
  // Salud con cita
  podologia: { nombre: 'Podología', frase: 'Cuidamos tus pies, con cita.', premio: 'tu pedicure clínico gratis', servicios: [['Consulta podológica', 450], ['Pedicure clínico', 500], ['Uña enterrada', 650], ['Plantillas', 1200]],
    ideas: ['Que encuentren tu consultorio cuando busquen «podólogo cerca de mí»', 'Explicar cada tratamiento para que lleguen sin miedo', 'Recordatorio de revisión para pacientes con diabetes'] },
  dental: { nombre: 'Consultorio dental', frase: 'Tu sonrisa, con cita y sin esperas.', premio: 'tu limpieza gratis', servicios: [['Limpieza dental', 600], ['Revisión', 350], ['Resina', 800], ['Blanqueamiento', 2500]],
    ideas: ['Recordatorio de limpieza cada seis meses', 'Precios claros de los tratamientos más pedidos', 'Botón de urgencias que abre tu WhatsApp'] },
  consultorio: { nombre: 'Consultorio médico', frase: 'Consulta con cita, sin esperas largas.', premio: 'tu consulta de seguimiento gratis', servicios: [['Consulta general', 500], ['Seguimiento', 400], ['Certificado médico', 300], ['Consulta a domicilio', 900]],
    ideas: ['Agenda en línea con tus horarios reales', 'Tu cédula, especialidad y ubicación para que confíen desde antes', 'Recordatorio de seguimiento para pacientes crónicos'] },
  fisioterapia: { nombre: 'Fisioterapia', frase: 'Recupérate con un plan a tu medida.', premio: 'tu sesión gratis', servicios: [['Valoración', 500], ['Sesión de fisioterapia', 550], ['Paquete de 10 sesiones', 4800], ['Masaje deportivo', 600]],
    ideas: ['Paquetes de sesiones con su avance a la vista', 'Ejercicios para casa en una liga privada', 'Que te encuentren equipos deportivos de tu ciudad'] },
  nutricion: { nombre: 'Nutrición', frase: 'Tu plan de alimentación a tu medida.', premio: 'tu consulta gratis', servicios: [['Primera consulta', 500], ['Seguimiento', 400], ['Plan mensual', 1200], ['Medición corporal', 250]],
    ideas: ['Consulta en línea para pacientes de otras ciudades', 'Recetas y menús de muestra que se comparten solos', 'Recordatorio de seguimiento cada quince días'] },
  psicologia: { nombre: 'Psicología', frase: 'Un espacio para ti, con cita.', premio: 'una sesión de cortesía', servicios: [['Sesión individual', 600], ['Terapia de pareja', 800], ['Primera sesión', 500], ['Sesión en línea', 550]],
    ideas: ['Agenda discreta: cada quien ve solo su cita', 'Sesiones en línea con liga de videollamada', 'Explicar tu enfoque para que llegue quien sí te necesita'] },
  optica: { nombre: 'Óptica', frase: 'Examen de la vista y lentes a tu medida.', premio: 'tu limpieza y ajuste gratis', servicios: [['Examen de la vista', 0], ['Lentes graduados', 1800], ['Lentes de contacto', 900], ['Ajuste y limpieza', 0]],
    ideas: ['Catálogo de armazones con precio', 'Cita para examen de la vista en línea', 'Recordatorio anual para revisar la graduación'] },
  // Mascotas
  veterinaria: { nombre: 'Veterinaria', frase: 'Cuidamos a tu mascota como tú.', premio: 'tu baño gratis', servicios: [['Consulta', 350], ['Baño y corte', 300], ['Vacuna', 400], ['Desparasitación', 200]],
    ideas: ['Carnet de vacunas con recordatorio de la siguiente', 'Botón de urgencias a tu WhatsApp', 'Fotos de pacientes felices (con permiso de sus dueños)'] },
  estetica_canina: { nombre: 'Estética canina', frase: 'Baño y corte para tu perro, con cita.', premio: 'tu baño gratis', servicios: [['Baño chico', 250], ['Baño y corte', 350], ['Corte de uñas', 80], ['Servicio a domicilio', 450]],
    ideas: ['Reserva por tamaño de perro, con precio claro', 'Foto de cómo quedó, lista para compartir', 'Recordatorio cada mes para su siguiente baño'] },
  // Comida
  cafeteria: { nombre: 'Cafetería', frase: 'Tu café de todos los días.', premio: 'tu bebida gratis', servicios: [['Americano', 45], ['Latte', 60], ['Frappé', 75], ['Pan dulce', 35]],
    ideas: ['Menú con fotos que se actualiza desde tu celular', 'Pedidos para recoger sin hacer fila', 'Bebida de temporada con reto de sellos'] },
  restaurante: { nombre: 'Restaurante', frase: 'Comida casera, reserva tu mesa.', premio: 'tu postre gratis', servicios: [['Comida del día', 120], ['Desayuno', 95], ['Mesa para 4', 0], ['Postre', 55]],
    ideas: ['Menú del día publicado cada mañana', 'Reservas para grupos y festejos', 'Que te encuentren en Google con fotos y horario'] },
  taqueria: { nombre: 'Taquería', frase: 'Tacos como los de siempre, pide para llevar.', premio: 'tu orden gratis', servicios: [['Orden de pastor', 90], ['Gringa', 85], ['Quesadilla', 45], ['Refresco', 30]],
    ideas: ['Menú con precios y botón para pedir por WhatsApp', 'Promoción de los días flojos para llenar el local', 'Mapa y horario para quien te busca de noche'] },
  pizzeria: { nombre: 'Pizzería', frase: 'Pizza recién hecha, a domicilio o para recoger.', premio: 'tu pizza mediana gratis', servicios: [['Pizza mediana', 180], ['Pizza grande', 240], ['Alitas', 150], ['Refresco 2 L', 45]],
    ideas: ['Pedidos por WhatsApp con el menú completo', 'Promoción del martes o miércoles con aviso a tus clientes', 'Combos para fiestas con apartado'] },
  panaderia: { nombre: 'Panadería', frase: 'Pan recién hecho, diario.', premio: 'tu pan gratis', servicios: [['Concha', 14], ['Pastel por pedido', 380], ['Bolillo', 4], ['Galletas', 60]],
    ideas: ['Pedidos de pastel con fecha y anticipo', 'Avisar a qué hora sale el pan caliente', 'Rosca y pan de muerto con pedido anticipado'] },
  heladeria: { nombre: 'Nevería', frase: 'Helados y paletas para el calor.', premio: 'tu helado gratis', servicios: [['Helado sencillo', 45], ['Paleta de agua', 25], ['Malteada', 70], ['Litro para llevar', 160]],
    ideas: ['Sabores del día publicados cada mañana', 'Pedidos para fiestas y eventos', 'Reto de sellos para las tardes de calor'] },
  // Tiendas y servicios
  floreria: { nombre: 'Florería', frase: 'Flores para cada ocasión, con entrega.', premio: 'tu ramo chico gratis', servicios: [['Ramo de rosas', 450], ['Arreglo de mesa', 650], ['Entrega a domicilio', 80], ['Corona', 1500]],
    ideas: ['Catálogo con precio y pedido por WhatsApp', 'Recordatorio antes del 14 de febrero y del 10 de mayo', 'Entregas con hora y foto de cómo quedó'] },
  boutique: { nombre: 'Boutique', frase: 'Ropa y accesorios que te van.', premio: '$100 en tu siguiente compra', servicios: [['Vestido', 650], ['Blusa', 320], ['Jeans', 550], ['Accesorios', 150]],
    ideas: ['Catálogo con tallas y apartado por WhatsApp', 'Aviso a tus clientas cuando llega mercancía nueva', 'Que te encuentren en Google por tu colonia'] },
  gimnasio: { nombre: 'Gimnasio', frase: 'Entrena con nosotros, reserva tu clase.', premio: 'una semana gratis', servicios: [['Clase de spinning', 80], ['Entrenamiento personal', 300], ['Mensualidad', 550], ['Clase de yoga', 90]],
    ideas: ['Horario de clases con lugares disponibles', 'Clase de prueba gratis para que se animen', 'Reto del mes con premio a quien más viene'] },
  clases: { nombre: 'Clases y escuela', frase: 'Aprende con nosotros: inscríbete en línea.', premio: 'una clase gratis', servicios: [['Clase muestra', 0], ['Mensualidad', 900], ['Inscripción', 400], ['Clase particular', 300]],
    ideas: ['Inscripción y pago en línea', 'Horarios por nivel y por edad', 'Fotos y videos de los festivales para presumir a tus alumnos'] },
  autolavado: { nombre: 'Autolavado', frase: 'Tu auto limpio, sin esperar.', premio: 'tu lavado gratis', servicios: [['Lavado exterior', 120], ['Lavado completo', 180], ['Encerado', 350], ['Lavado de motor', 200]],
    ideas: ['Paquetes con precio claro por tamaño de auto', 'Cita para no esperar en fila el fin de semana', 'Membresía mensual de lavados'] },
  taller: { nombre: 'Taller mecánico', frase: 'Servicio para tu auto, con cita.', premio: 'tu revisión gratis', servicios: [['Afinación', 1200], ['Cambio de aceite', 650], ['Frenos', 900], ['Diagnóstico', 300]],
    ideas: ['Cita para servicio sin dejar el auto todo el día', 'Recordatorio del siguiente cambio de aceite', 'Fotos del trabajo para generar confianza'] },
  lavanderia: { nombre: 'Lavandería', frase: 'Tu ropa limpia, lista cuando la necesitas.', premio: 'tu carga gratis', servicios: [['Lavado por kilo', 30], ['Planchado por pieza', 15], ['Edredón', 180], ['Recolección a domicilio', 50]],
    ideas: ['Recolección a domicilio con hora', 'Aviso cuando la ropa está lista', 'Precios por kilo y por prenda a la vista'] },
  otro: { nombre: 'Negocio', frase: 'Reserva en línea y junta tus sellos.', premio: 'tu servicio gratis', servicios: [['Servicio', 300], ['Consulta', 400], ['Paquete', 800], ['Visita', 250]],
    ideas: ['Tus servicios y precios claros, con botón a tu WhatsApp', 'Que te encuentren en Google con tu horario y ubicación', 'Tarjeta de sellos para que tus clientes regresen'] },
};
// Preguntas de quien busca «tarjeta de lealtad» (en Google, ChatGPT o Gemini): respuestas cortas y ciertas, también como FAQPage
export const FAQ_MIRA = [
  ['¿Qué es una tarjeta de lealtad digital?', 'Es la tarjeta de sellos de siempre, pero en el celular de tu cliente: se guarda en Apple Wallet, Google Wallet o en su navegador, sin descargar ninguna app. Cada visita suma un sello o puntos y, al juntar los necesarios, se lleva su premio. Ya no se pierde ni se olvida en casa.'],
  ['¿Para qué negocios sirve?', 'Para cualquier negocio con clientes que pueden regresar: estéticas, barberías, uñas, spas, podología, consultorios dentales y médicos, fisioterapia, nutrición, ópticas, veterinarias, cafeterías, taquerías, restaurantes, panaderías, florerías, boutiques, gimnasios, escuelas, autolavados y talleres. Si tu giro no aparece, también funciona: tú eliges el premio.'],
  ['¿Mis clientes tienen que descargar una app?', 'No. Escanean el QR de tu mostrador, escriben su nombre y su celular, y su tarjeta queda en su teléfono en menos de un minuto.'],
  ['¿Cuánto cuesta?', 'Negocio Completo (tarjeta de lealtad, agenda en línea y página web) cuesta $749 al mes, con plan de 12 meses; el dominio se paga aparte. Si solo quieres la tarjeta de lealtad, <a href="/tienda/vuelve/">Vuelve</a> se prueba 7 días gratis, sin tarjeta.'],
  ['¿Cómo hago que mis clientes regresen?', 'Con un premio que se sienta cerca (de 5 a 10 visitas), un aviso automático de «te extrañamos» a quien lleva tiempo sin venir, una felicitación de cumpleaños con regalo y un premio para quien te recomiende. Todo eso viene incluido.'],
  ['¿De quién son los datos de mis clientes?', 'Tuyos. Los descargas cuando quieras, también si cancelas. Vorka no los vende ni los usa para publicidad.'],
  ['¿Cómo apoyo a IMPACTO con mi negocio?', 'Al crear tu tarjeta puedes dar un descuento a los jóvenes de IMPACTO (Juventudes Impactando México A.C.), que hacen proyectos en sus comunidades. Ellos lo usan con su credencial y tu negocio aparece destacado con el sello «Va por el futuro de México». Es opcional y lo cambias cuando quieras.'],
];
export const COLORES = ['#1f6f54', '#7a3b2e', '#1d3f72', '#8a3d6b', '#b5651d', '#222222'];

// POST /api/mira-tu-negocio { nombre, whatsapp, negocio, giro, ciudad } → prospecto en Vorka OS (máx. 5 por IP por hora)
export async function prospectoMira(req, env) {
  let b; try { b = await req.json(); } catch { return json({ error: 'Datos inválidos.' }, 400); }
  const ip = req.headers.get('cf-connecting-ip') || '';
  if (ip && !(await dentroDelLimite(env, `mira:${await sha256(ip)}`, 5, 3600))) return json({ error: 'Ya recibimos tus datos. Escríbenos por WhatsApp.' }, 429);
  const d = { nombre: String(b?.nombre || '').trim().slice(0, 100), whatsapp: String(b?.whatsapp || '').trim().slice(0, 30), negocio: String(b?.negocio || '').trim().slice(0, 60),
    giro: GIROS[b?.giro]?.nombre || '', ciudad: String(b?.ciudad || '').trim().slice(0, 40), empresa_web: b?.empresa_web || '' };
  if (d.nombre.length < 2) return json({ error: 'Escribe tu nombre.' }, 400);
  if (d.whatsapp.replace(/\D/g, '').length < 10) return json({ error: 'Escribe tu WhatsApp a 10 dígitos.' }, 400);
  if (d.negocio.length < 2) return json({ error: 'Falta el nombre de tu negocio.' }, 400);
  const pedido = new Request('https://os.vorka.mx/api/publico/vorka/mira-negocio', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
  try {
    const r = await (env.OS ? env.OS.fetch(pedido) : fetch(pedido));
    const j = await r.json().catch(() => ({}));
    return json(r.ok ? { ok: true } : { error: j.error || 'No pudimos guardar tus datos.' }, r.ok ? 200 : r.status === 400 ? 400 : 502);
  } catch { return json({ error: 'No pudimos guardar tus datos.' }, 502); }
}

export async function paginaMiraTuNegocio(env, req, url) {
  const { code, cookie } = await refDeVisita(env, req, url);
  const p = await productoPorSlug(env, SLUG_NEGOCIO_COMPLETO);
  if (p && !BOT.test(req.headers.get('user-agent') || '')) await registrarAnalitica(env, 'view_product', { product_id: p.id, ref_code: code }, req);
  const n = String(url.searchParams.get('n') || '').trim().slice(0, 60);
  const g = GIROS[url.searchParams.get('g')] ? url.searchParams.get('g') : '';
  const c = String(url.searchParams.get('c') || '').trim().slice(0, 40);
  const opciones = Object.entries(GIROS).map(([k, v]) => `<option value="${k}"${k === g ? ' selected' : ''}>${esc(v.nombre)}</option>`).join('');
  const colores = COLORES.map((col, i) => `<label class="mt-color" style="--c:${col}"><input type="radio" name="color" value="${col}"${i === 0 ? ' checked' : ''}><span aria-label="Color ${i + 1}"></span></label>`).join('');
  return pagina({ navActual: 'catalogo',
    titulo: 'Tarjeta de lealtad digital, agenda y página web: mira cómo quedaría tu negocio | Vorka México', ruta: RUTA_MIRA,
    imagen: 'https://vorka.mx/assets/tienda/v3/negocio-completo-og.jpg',
    descripcion: 'Tarjeta de lealtad digital (sellos en el celular, sin app), agenda en línea y página web para estéticas, podología, consultorios, cafeterías, taquerías y más. Escribe el nombre de tu negocio y míralo al instante, gratis.',
    head: `${ldScript([migas('Mira tu negocio', RUTA_MIRA, [['Negocio Completo', RUTA_NEGOCIO_COMPLETO]]),
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_MIRA.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }])}<style>${CSS_MIRA}</style>`, headers: cookie ? { 'set-cookie': cookie } : {},
    script: `var MT=${JSON.stringify({ giros: GIROS, wa: WA_NUM, ruta: RUTA_MIRA }).replace(/</g, '\\u003c')};${SCRIPT}`,
    cuerpo: `<section class="mt-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="/tienda/">Tienda</a> / <a href="${RUTA_NEGOCIO_COMPLETO}">Negocio Completo</a></nav>
  <h1 class="t-h1">Mira cómo quedaría tu negocio.</h1>
  <p class="t-lead">Escribe el nombre de tu negocio y te mostramos tu tarjeta de lealtad, tu agenda y tu página web, con tu nombre. Gratis y sin registrarte.</p>
  <div class="mt-g">
    <form class="t-form mt-form" id="form-mira" novalidate>
      <div class="t-campo"><label for="mt-nombre">Nombre de tu negocio</label><input id="mt-nombre" name="nombre" type="text" required maxlength="60" autocomplete="organization" placeholder="Ej. Estética Lumbre" value="${esc(n)}"></div>
      <div class="t-campo"><label for="mt-giro">¿De qué es?</label><select id="mt-giro" name="giro" required><option value="">Elige tu giro</option>${opciones}</select></div>
      <div class="t-campo"><label for="mt-ciudad">Ciudad</label><input id="mt-ciudad" name="ciudad" type="text" maxlength="40" autocomplete="address-level2" placeholder="Ej. Celaya" value="${esc(c)}"></div>
      <div class="t-campo"><span class="mt-lbl">Color de tu marca</span><div class="mt-colores">${colores}</div></div>
      <div class="t-campo"><label for="mt-logo">Tu logo <span class="nc-opc">(opcional)</span></label><input id="mt-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small class="t-ayuda">Solo se ve en tu pantalla: no lo guardamos.</small></div>
      <p class="t-error" id="mt-error" role="alert" hidden></p>
      <button class="btn acento" type="submit">Ver mi negocio ${FLECHA}</button>
    </form>
    <div class="mt-vacio" id="mt-vacio"><p>Aquí vas a ver tu tarjeta de sellos, tu agenda y tu página web.</p></div>
  </div>
</div></section>
<section class="mt-res" id="mt-res" hidden aria-live="polite"><div class="marco">
  <h2 class="t-h2">Así se vería <span data-mt="nombre"></span>.</h2>
  <div class="mt-tres">
    <figure class="mt-pieza">
      <div class="mt-tarjeta">
        <div class="mt-tar-top"><span class="mt-logo" data-mt="logo"></span><b data-mt="nombre"></b></div>
        <p class="mt-hola">Hola, Ana</p>
        <p class="mt-cuenta"><b>7</b> / 10 sellos</p>
        <div class="mt-sellos">${Array.from({ length: 10 }, (_, i) => `<span class="${i < 7 ? 'si' : i === 9 ? 'premio' : ''}"></span>`).join('')}</div>
        <p class="mt-falta">3 visitas más y te llevas <b data-mt="premio"></b>.</p>
      </div>
      <figcaption><b>Tarjeta de sellos</b> en el celular de tus clientes, sin descargar apps. Les llega aviso para que regresen.</figcaption>
    </figure>
    <figure class="mt-pieza">
      <div class="mt-agenda">
        <p class="mt-ag-dia">Agenda de hoy</p>
        <b class="mt-ag-neg" data-mt="nombre"></b>
        <ul class="mt-ag-lista" data-mt="agenda"></ul>
      </div>
      <figcaption><b>Agenda en línea</b>: tus clientes eligen día y hora solos y les llega su recordatorio.</figcaption>
    </figure>
    <figure class="mt-pieza">
      <div class="mt-web">
        <div class="mt-web-barra"><i></i><i></i><i></i><span data-mt="dominio"></span></div>
        <div class="mt-web-hero"><span class="mt-logo" data-mt="logo"></span><b data-mt="nombre"></b><p data-mt="frase"></p><div class="mt-web-btns"><span>Reservar</span><span>WhatsApp</span></div></div>
        <ul class="mt-web-serv" data-mt="servicios"></ul>
        <div class="mt-google"><small data-mt="dominio"></small><b><span data-mt="nombre"></span> · <span data-mt="giro"></span><span data-mt="enciudad"></span></b><small>Abierto · Reserva en línea · WhatsApp</small></div>
      </div>
      <figcaption><b>Página web</b> con tus servicios, tu horario y botón a tu WhatsApp, dada de alta en Google.</figcaption>
    </figure>
  </div>
  <div class="mt-ideas"><h3>Ideas para la página de <span data-mt="nombre"></span></h3><ul data-mt="ideas"></ul></div>
  <div class="mt-cta">
    <div><p class="mt-precio">Todo esto por <b>$749 al mes</b>.</p><p>Con el Arranque en 7 días diseñamos tu página a la medida de tu marca y tu primer mes va de regalo. Plan de 12 meses; el dominio se paga aparte.</p></div>
    <div class="mt-cta-btns">
      <button class="btn acento" type="button" id="mt-quiero">Lo quiero ${FLECHA}</button>
      <a class="btn blanco" href="${RUTA_NEGOCIO_COMPLETO}">Contratar en línea</a>
    </div>
    <form class="mt-datos" id="mt-datos" hidden novalidate>
      <p class="mt-datos-t">¿A quién le escribimos? Te mandamos tu propuesta por WhatsApp.</p>
      <div class="mt-datos-g">
        <div class="t-campo"><label for="mt-tu">Tu nombre</label><input id="mt-tu" name="tu" type="text" autocomplete="name" required maxlength="100"></div>
        <div class="t-campo"><label for="mt-wa">Tu WhatsApp</label><input id="mt-wa" name="wa" type="tel" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="10 dígitos"></div>
      </div>
      <input class="mt-trampa" type="text" name="empresa_web" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="t-error" id="mt-datos-error" role="alert" hidden></p>
      <button class="btn acento" type="submit" id="mt-mandar">Mandar y abrir WhatsApp ${FLECHA}</button>
      <small class="t-ayuda">Al mandar aceptas el <a href="/privacidad/" target="_blank">aviso de privacidad</a>.</small>
    </form>
    <p class="mt-nota">Es un ejemplo con datos de muestra: al contratar lo dejamos con tus servicios, tus horarios y tus precios.</p>
  </div>
</div></section>
<section class="t-sec mt-por-giro" id="giros"><div class="marco">
  <h2 class="t-h2">Tarjeta de lealtad y página web para tu giro</h2>
  <p class="t-lead">Lo que más le sirve a cada negocio. Toca el tuyo y mira cómo quedaría con tu nombre.</p>
  <div class="mt-giros">${Object.entries(GIROS).filter(([k]) => k !== 'otro').map(([k, v]) => `<article class="mt-giro"><h3><a href="${RUTA_MIRA}?g=${k}#form-mira">${esc(v.nombre)}</a></h3>
    <p class="mt-giro-premio">Premio de ejemplo: ${esc(v.premio)}.</p><ul>${v.ideas.map(i => `<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div>
  <p class="mt-otro">¿No ves tu giro? También funciona: <a href="${RUTA_MIRA}?g=otro#form-mira">pruébalo con tu nombre</a> o escríbenos por <a href="https://wa.me/${WA_NUM}?text=${encodeURIComponent('Hola, quiero ver cómo quedaría la tarjeta de lealtad y la página de mi negocio.')}" target="_blank" rel="noopener">WhatsApp</a>.</p>
</div></section>
<section class="t-sec suave mt-impacto"><div class="marco">
  <h2 class="t-h2">Tu negocio también puede impulsar a jóvenes de tu ciudad</h2>
  <p>Con tu tarjeta de lealtad puedes dar un descuento a los integrantes de <a href="https://soyimpacto.org" target="_blank" rel="noopener">IMPACTO</a> (Juventudes Impactando México A.C.), jóvenes que hacen proyectos en sus comunidades. Lo usan con su credencial, tu negocio aparece destacado con el sello «Va por el futuro de México» y te llegan clientes que regresan. Es opcional y lo cambias cuando quieras.</p>
</div></section>
${seccionFaq({ titulo: 'Tarjeta de lealtad para tu negocio', items: FAQ_MIRA.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join(''), whatsappTexto: 'Hola, tengo una pregunta sobre la tarjeta de lealtad para mi negocio.' })}`,
  });
}

export const CSS_MIRA = `.mt-hero{padding:clamp(12px,3vw,40px) 0 clamp(24px,4vw,40px)}
.mt-hero h1{margin-top:14px}.mt-hero .t-lead{margin-top:14px;max-width:620px}
.mt-g{display:grid;gap:24px;margin-top:26px;align-items:start}@media(min-width:900px){.mt-g{grid-template-columns:minmax(320px,440px) 1fr}}
.mt-g>*{min-width:0}
.mt-form{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:clamp(18px,3vw,28px);box-shadow:var(--sombra-2)}
.mt-form select{width:100%}
.mt-lbl{display:block;font-weight:600;font-size:15px;margin-bottom:8px}
.mt-colores{display:flex;gap:10px;flex-wrap:wrap}
.mt-color input{position:absolute;opacity:0;pointer-events:none}
.mt-color span{display:block;width:34px;height:34px;border-radius:50%;background:var(--c);cursor:pointer;box-shadow:0 0 0 2px var(--card),0 0 0 3px var(--line)}
.mt-color input:checked+span{box-shadow:0 0 0 3px var(--card),0 0 0 5px var(--c)}
.mt-color input:focus-visible+span{outline:2px solid var(--fg);outline-offset:4px}
.nc-opc{font-weight:400;color:var(--fg-2)}
.mt-vacio{display:none}@media(min-width:900px){.mt-vacio{display:flex;align-items:center;justify-content:center;min-height:320px;border:1.5px dashed var(--line);border-radius:var(--r);color:var(--fg-2);padding:24px;text-align:center}}
.mt-res{padding:0 0 clamp(40px,5vw,64px);--marca:#1f6f54}
.mt-res h2{margin-bottom:22px}
.mt-tres{display:grid;gap:22px}@media(min-width:900px){.mt-tres{grid-template-columns:repeat(3,minmax(0,1fr))}}
.mt-pieza{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}
.mt-pieza figcaption{font-size:15px;color:var(--fg-2)}.mt-pieza figcaption b{color:var(--fg)}
.mt-tarjeta,.mt-agenda,.mt-web{background:#fff;color:#1b1b1b;border-radius:18px;border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.08);overflow:hidden;flex:1}
.mt-logo{width:38px;height:38px;border-radius:10px;background:var(--marca);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:none;overflow:hidden}
.mt-logo img{width:100%;height:100%;object-fit:contain;background:#fff}
.mt-tarjeta{padding:18px;background:linear-gradient(180deg,#fff 0,#fff 55%,color-mix(in srgb,var(--marca) 10%,#fff) 100%)}
.mt-tar-top{display:flex;align-items:center;gap:10px}.mt-tar-top b{font-size:15.5px;line-height:1.2;overflow-wrap:anywhere}
.mt-hola{margin:16px 0 0;color:#666;font-size:14px}
.mt-cuenta{margin:2px 0 12px;font-size:16px;color:#555}.mt-cuenta b{font-size:44px;line-height:1;color:#1b1b1b;margin-right:4px}
.mt-sellos{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:14px;border-radius:14px;background:var(--marca)}
.mt-sellos span{aspect-ratio:1;border-radius:50%;border:2px solid rgba(255,255,255,.55)}
.mt-sellos span.si{background:#fff;border-color:#fff;position:relative}
.mt-sellos span.si::after{content:"";position:absolute;left:36%;top:22%;width:22%;height:42%;border:solid var(--marca);border-width:0 3px 3px 0;transform:rotate(45deg)}
.mt-sellos span.premio{border-style:dashed;border-color:#fff}
.mt-falta{margin:12px 0 0;font-size:14px;color:#444}
.mt-agenda{padding:18px}
.mt-ag-dia{margin:0;font-size:13px;color:var(--marca);font-weight:600}
.mt-ag-neg{display:block;font-size:16px;margin:2px 0 12px;overflow-wrap:anywhere}
.mt-ag-lista{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.mt-ag-lista li{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center;font-size:14px}
.mt-ag-lista time{color:#777;font-size:13px}
.mt-ag-lista div{padding:8px 10px;border-radius:10px;background:#f4f4f2;border-left:3px solid var(--marca)}
.mt-ag-lista div small{display:block;color:#777;font-size:12px}
.mt-ag-lista li.libre div{background:#fff;border:1.5px dashed #ccc;color:#888}
.mt-web-barra{display:flex;align-items:center;gap:5px;padding:9px 12px;background:#f1f1ef;font-size:12px;color:#666}
.mt-web-barra i{width:8px;height:8px;border-radius:50%;background:#d6d6d3}.mt-web-barra span{margin-left:8px;background:#fff;border-radius:6px;padding:2px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt-web-hero{padding:18px;background:var(--marca);color:#fff;display:grid;gap:6px;justify-items:start}
.mt-web-hero .mt-logo{background:#fff;color:var(--marca)}
.mt-web-hero b{font-size:20px;line-height:1.15;overflow-wrap:anywhere}.mt-web-hero p{margin:0;font-size:14px;opacity:.9}
.mt-web-btns{display:flex;gap:8px;margin-top:6px}.mt-web-btns span{font-size:13px;padding:6px 12px;border-radius:999px;background:#fff;color:var(--marca);font-weight:600}.mt-web-btns span+span{background:rgba(255,255,255,.18);color:#fff}
.mt-web-serv{list-style:none;margin:0;padding:12px 18px;display:grid;gap:6px;font-size:14px}
.mt-web-serv li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eee;padding-bottom:6px}.mt-web-serv li span:last-child{color:#666}
.mt-google{margin:4px 12px 14px;padding:10px 12px;border-radius:12px;background:#f7f7f5;display:grid;gap:2px}
.mt-google small{font-size:12px;color:#666}.mt-google b{font-size:14px;color:#1a0dab;font-weight:600}
.mt-cta{margin-top:28px;padding:clamp(18px,3vw,28px);border-radius:var(--r);background:var(--card);border:1px solid var(--line);box-shadow:var(--sombra-2);display:grid;gap:16px;align-items:center}
@media(min-width:900px){.mt-cta{grid-template-columns:1fr auto}}
.mt-cta p{margin:0;color:var(--fg-2)}.mt-precio{font-size:20px;color:var(--fg)!important;margin-bottom:4px!important}
.mt-cta-btns{display:flex;gap:10px;flex-wrap:wrap}
.mt-nota{grid-column:1/-1;font-size:13.5px}
.mt-datos{grid-column:1/-1;display:grid;gap:12px;padding-top:16px;border-top:1px solid var(--line)}
.mt-datos[hidden]{display:none}
.mt-datos-t{color:var(--fg)!important;font-weight:600}
.mt-datos-g{display:grid;gap:12px}@media(min-width:640px){.mt-datos-g{grid-template-columns:1fr 1fr}}
.mt-datos .btn{justify-self:start}
.mt-trampa{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.mt-ideas{margin-top:22px;padding:clamp(16px,3vw,24px);border-radius:var(--r);border:1px solid var(--line);background:var(--card)}
.mt-ideas h3{margin:0 0 10px;font-size:16px;line-height:1.3}
.mt-ideas ul,.mt-giro ul{margin:0;padding-left:20px;display:grid;gap:6px;color:var(--fg-2)}
.mt-por-giro .t-lead{margin-top:10px;max-width:640px}
.mt-giros{display:grid;gap:14px;margin-top:22px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))}
.mt-giro{padding:18px;border-radius:var(--r);border:1px solid var(--line);background:var(--card);min-width:0}
.mt-giro h3{margin:0 0 4px;font-size:15.5px}.mt-giro h3 a{color:inherit}
.mt-giro-premio{margin:0 0 10px;font-size:14px;color:var(--fg-2)}
.mt-giro ul{font-size:14.5px}
.mt-otro{margin-top:18px;color:var(--fg-2)}
.mt-impacto p{max-width:720px;margin-top:12px;color:var(--fg-2)}`;

const SCRIPT = `(function(){
  var f=document.getElementById('form-mira'); if(!f) return;
  var res=document.getElementById('mt-res'), vacio=document.getElementById('mt-vacio'), err=document.getElementById('mt-error'), quiero=document.getElementById('mt-quiero');
  var logo=null, visto=false, datos=null;
  var NOMBRES=['Ana','Sofía','Jorge','Mariana','Luis'], HORAS=['9:00','10:30','12:00','13:30','16:00'];
  function todos(k){ return res.querySelectorAll('[data-mt="'+k+'"]'); }
  function poner(k,t){ todos(k).forEach(function(e){ e.textContent=t; }); }
  function vaciar(e){ while(e.firstChild) e.removeChild(e.firstChild); }
  function el(tag,t){ var x=document.createElement(tag); if(t!=null) x.textContent=t; return x; }
  function dominio(n){ var s=n.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,''); return (s||'tunegocio').slice(0,28)+'.mx'; }
  function pesos(v){ return v>0 ? '$'+v.toLocaleString('es-MX') : 'Reserva'; }
  f.logo.addEventListener('change',function(){
    var a=f.logo.files&&f.logo.files[0]; logo=null; if(!a) return;
    if(a.size>3*1024*1024){ f.logo.value=''; err.textContent='Tu logo pesa mucho: usa uno de menos de 3 MB.'; err.hidden=false; return; }
    var r=new FileReader(); r.onload=function(){ logo=r.result; if(datos) dibujar(); }; r.readAsDataURL(a);
  });
  function leer(){
    var n=f.nombre.value.trim().replace(/\\s+/g,' '), g=f.giro.value, c=f.ciudad.value.trim().replace(/\\s+/g,' ');
    var col=(f.querySelector('input[name=color]:checked')||{}).value||'#1f6f54';
    return { n:n, g:g, c:c, col:col };
  }
  function dibujar(){
    var d=datos, G=MT.giros[d.g];
    res.style.setProperty('--marca', d.col);
    poner('nombre', d.n); poner('premio', G.premio); poner('frase', G.frase + (d.c ? ' En '+d.c+'.' : ''));
    poner('dominio', dominio(d.n)); poner('giro', G.nombre); poner('enciudad', d.c ? ' en '+d.c : '');
    todos('logo').forEach(function(e){ vaciar(e); if(logo){ var i=new Image(); i.alt=''; i.src=logo; e.appendChild(i); } else e.textContent=(d.n.charAt(0)||'V').toUpperCase(); });
    todos('agenda').forEach(function(ul){ vaciar(ul);
      HORAS.forEach(function(h,i){ var li=el('li'), t=el('time',h), box=el('div');
        if(i===2){ li.className='libre'; box.textContent='Disponible · reserva en línea'; }
        else { var s=G.servicios[i>2?i-1:i]; box.appendChild(el('span',s[0])); box.appendChild(el('small',NOMBRES[i])); }
        li.appendChild(t); li.appendChild(box); ul.appendChild(li); }); });
    todos('ideas').forEach(function(ul){ vaciar(ul); (G.ideas||[]).forEach(function(t){ ul.appendChild(el('li',t)); }); });
    todos('servicios').forEach(function(ul){ vaciar(ul);
      G.servicios.slice(0,3).forEach(function(s){ var li=el('li'); li.appendChild(el('span',s[0])); li.appendChild(el('span',pesos(s[1]))); ul.appendChild(li); }); });
    res.hidden=false; if(vacio) vacio.style.display='none';
  }
  function mostrar(desplazar){
    var d=leer();
    if(d.n.length<2){ err.textContent='Escribe el nombre de tu negocio.'; err.hidden=false; f.nombre.focus(); return; }
    if(!MT.giros[d.g]){ err.textContent='Elige de qué es tu negocio.'; err.hidden=false; f.giro.focus(); return; }
    err.hidden=true; datos=d; dibujar();
    try{ var q=new URLSearchParams({n:d.n,g:d.g}); if(d.c) q.set('c',d.c); history.replaceState(null,'',MT.ruta+'?'+q.toString()); }catch(e){}
    if(!visto){ visto=true; if(window.vorkaEvento) window.vorkaEvento('ViewContent',{content_name:'Mira tu negocio',content_category:d.g}); }
    if(desplazar) res.scrollIntoView({behavior:'smooth',block:'start'});
  }
  f.addEventListener('submit',function(e){ e.preventDefault(); mostrar(true); });
  f.addEventListener('change',function(e){ if(datos&&e.target.name!=='logo') mostrar(false); });
  var fd=document.getElementById('mt-datos'), errD=document.getElementById('mt-datos-error'), mandar=document.getElementById('mt-mandar'), txtM=mandar.innerHTML;
  quiero.addEventListener('click',function(){ fd.hidden=false; quiero.hidden=true; fd.tu.focus(); });
  function errorD(m){ errD.textContent=m; errD.hidden=false; mandar.disabled=false; mandar.innerHTML=txtM; }
  fd.addEventListener('submit',function(e){
    e.preventDefault(); if(!datos) return;
    var tu=fd.tu.value.trim(), wa=fd.wa.value.trim(), G=MT.giros[datos.g];
    if(tu.length<2){ fd.tu.focus(); return errorD('Escribe tu nombre.'); }
    if(wa.replace(/\\D/g,'').length<10){ fd.wa.focus(); return errorD('Escribe tu WhatsApp a 10 dígitos.'); }
    errD.hidden=true; mandar.disabled=true; mandar.textContent='Abriendo WhatsApp…';
    var msj='Hola, soy '+tu+'. Vi cómo quedaría mi negocio y lo quiero. Se llama '+datos.n+', es '+G.nombre.toLowerCase()+(datos.c?' y está en '+datos.c:'')+'.';
    var ir=function(){ location.href='https://wa.me/'+MT.wa+'?text='+encodeURIComponent(msj); };
    if(window.vorkaEvento) window.vorkaEvento('Lead',{content_name:'Mira tu negocio',content_category:datos.g});
    var listo=false, t=setTimeout(function(){ if(!listo){ listo=true; ir(); } },4000);
    fetch('/api/mira-tu-negocio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nombre:tu,whatsapp:wa,negocio:datos.n,giro:datos.g,ciudad:datos.c,empresa_web:fd.empresa_web.value})})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,s:r.status,j:j}; }); })
      .then(function(x){ if(listo) return; if(!x.ok&&x.s===400){ clearTimeout(t); return errorD(x.j.error||'Revisa tus datos.'); } listo=true; clearTimeout(t); ir(); })
      .catch(function(){ if(!listo){ listo=true; clearTimeout(t); ir(); } });
  });
  // Liga armada (?n=…&g=…): se dibuja sola y baja a la vista previa, que en el celular queda debajo del formulario
  if(f.nombre.value.trim().length>=2&&MT.giros[f.giro.value]){ mostrar(false); setTimeout(function(){ res.scrollIntoView({block:'start'}); },400); }
})();`;
