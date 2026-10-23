# Vorka México · páginas legales de la tienda (y de Cupo: /legal/cupo/, /legal/cupo/privacidad/, /legal/cupo/privacidad-asistentes/): /legal/terminos/, /legal/reembolsos/, /legal/creadores/ y Brindi:
# /legal/brindi/ (condiciones), /legal/brindi/privacidad/ (clientes) y /legal/brindi/privacidad-invitados/ (invitados)
# Cuentas: /legal/cuentas/ (condiciones) y /legal/cuentas/privacidad/
# Vuelve: /legal/vuelve/ (condiciones), /legal/vuelve/privacidad/ (negocios) y /legal/vuelve/privacidad-clientes/ (clientes de cada negocio)
# Uso: python3 _tienda/legales.py   (desde la raíz del repo). Mismo diseño que /privacidad.
import os, re, sys
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, '_sitio'))
from partes import cabeza, nav, pie, v_metal

ACTUALIZADO = '15 de octubre de 2026'
ACTUALIZADO_BRINDI = '18 de octubre de 2026'
ACTUALIZADO_CUPO = '19 de octubre de 2026'
ACTUALIZADO_VUELVE = '20 de octubre de 2026'
ACTUALIZADO_CUENTAS = '22 de octubre de 2026'
RESPONSABLE = 'Brandon Oleynick Hernández, persona física que opera bajo el nombre comercial Vorka México'
DOMICILIO = 'Nuevo León #305, Col. Alameda, C.P. 38050, Celaya, Guanajuato, México'

# Reutiliza los estilos del aviso de privacidad (índice lateral, apartados numerados)
privacidad = open(os.path.join(RAIZ, 'privacidad', 'index.html'), encoding='utf-8').read()
ESTILO = re.search(r'<style>.*?</style>', privacidad, re.S).group(0)


def pagina(ruta, titulo, titulo_html, lead, etiqueta, apartados, aplica='Aplica a vorka.mx/tienda', migas=None, actualizado=ACTUALIZADO):
    indice = ''.join(f'<li><a href="#{a}"><span>{i:02d}</span>{t}</a></li>' for i, (a, t, _) in enumerate(apartados, 1))
    cuerpo = ''.join(f'<section class="apartado" id="{a}"><h2><span class="n">{i:02d}</span>{t}</h2>{html}</section>' for i, (a, t, html) in enumerate(apartados, 1))
    return (cabeza(f'{titulo} · Vorka México', lead, ruta, extra=ESTILO) + nav() + f'''<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gl', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span>{migas or '<a href="/tienda/">Tienda</a>'}<span>/</span><span>{titulo}</span></div>
    <span class="etiqueta">{etiqueta}</span>
    <h1 class="h1" style="margin-top:18px">{titulo_html}</h1>
    <p class="lead">{lead}</p>
    <div class="vigencia"><span>Última actualización: {actualizado}</span><span>{aplica}</span></div>
  </div>
</section>
<section class="sec pegada">
  <div class="marco priv">
    <nav aria-label="Contenido"><b>Contenido</b><ol>{indice}</ol></nav>
    <div class="texto-aviso">{cuerpo}</div>
  </div>
</section>
</main>
''' + pie() + '</body>\n</html>\n')

def li(*xs):
    return '<ul>' + ''.join(f'<li><span>{x}</span></li>' for x in xs) + '</ul>'

TERMINOS = [
    ('quien', 'Quién vende', f'<p>Los productos de la tienda en vorka.mx/tienda los vende {RESPONSABLE} (en adelante, “Vorka”), con domicilio en {DOMICILIO}. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y WhatsApp +52 81 1780 4869.</p><p>Al comprar aceptas estos términos, la <a href="/legal/reembolsos/">política de reembolsos</a> y el <a href="/privacidad/">aviso de privacidad</a>.</p>'),
    ('productos', 'Qué vendemos', '<p>Productos digitales descargables (guías, cuadernos de trabajo, plantillas, calculadoras y materiales similares). En la página de cada producto se describe qué incluye, en qué formato viene cada archivo y qué programas necesitas para abrirlo.</p><p>No se envía nada físico.</p>'),
    ('precios', 'Precios y pago', li(
        'Los precios están en pesos mexicanos (MXN) e incluyen los impuestos aplicables. El precio que pagas es el que aparece al momento de comprar.',
        'Puedes pagar con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI. Los pagos los procesa Stripe; Vorka no recibe ni guarda los datos de tu tarjeta.',
        'Si pagas en OXXO o por SPEI, tu compra se confirma cuando el pago se refleja. La referencia de OXXO vence a los 3 días; si no se paga, la orden se cancela sin cargo.',
        'Podemos corregir errores evidentes de precio. Si ya pagaste un precio equivocado a tu favor, respetamos tu compra.')),
    ('entrega', 'Entrega', li(
        'Al confirmarse el pago te enviamos un correo con un enlace para descargar tus archivos. Revisa también spam o promociones.',
        'El enlace funciona durante 7 días y permite descargar cada archivo hasta 10 veces. Si vence, pide uno nuevo en <a href="/descargas/reenviar">vorka.mx/descargas/reenviar</a> con el correo de tu compra.',
        'Es tu responsabilidad escribir bien tu correo al comprar. Si te equivocaste, escríbenos con tu número de orden y lo corregimos.')),
    ('puntos', 'Programa de puntos Vorka', li(
        'Cualquier persona mayor de edad puede crear gratis una cuenta de puntos con su correo en <a href="/tienda/puntos/">vorka.mx/tienda/puntos</a> y recibir una liga personal para recomendar productos de la tienda. Tu cuenta se usa desde la app “Puntos Vorka” (<a href="/tienda/cuenta/">vorka.mx/tienda/cuenta</a>), que puedes agregar a la pantalla de inicio de tu celular. Para entrar te enviamos a tu correo un enlace y un código de 6 dígitos (vence en 15 minutos y sirve una sola vez).',
        'Por cada compra pagada que entre con tu liga ganas en puntos un porcentaje de lo que se pagó por productos de Vorka México (después de descuentos y con IVA incluido; los productos de creadores no dan puntos). No cuentan las compras hechas con tu mismo correo. La persona que llega con tu liga tiene 30 días para comprar.',
        '<b>Niveles.</b> El porcentaje depende de tu nivel, que se calcula con tus compras con tu liga del semestre (enero a junio y julio a diciembre, en hora del centro de México) que no se reembolsaron: Inicial 10% (de 0 a 2 compras), Bronce 15% (desde 3), Plata 20% (desde 10), Oro 25% (desde 25) y Diamante 30% (desde 50). Cada compra usa el porcentaje del nivel que tenías antes de ella. Al empezar cada semestre todas las cuentas vuelven a Inicial; los puntos que ya ganaste no cambian.',
        '<b>Puntos extra.</b> Una compra con tu liga suma 10 puntos porcentuales más a tu nivel (con un máximo de 40% en total) si incluye: (a) un producto con una promoción de puntos extra vigente el día del pago (las anunciamos en la app con sus fechas, en hora del centro de México, y aplican para todos), o (b) un producto que tú nos sugeriste desde la app y que Vorka aceptó y ligó a esa sugerencia, en compras pagadas después de aceptarla. Se cuentan una vez por compra y no se acumulan entre sí. Enviar una sugerencia no obliga a Vorka a crear el producto ni le da derechos sobre él a quien la envía; Vorka decide qué sugerencias acepta.',
        '<b>Suscripciones.</b> Si alguien contrata con tu liga una suscripción (por ejemplo, Vuelve), también ganas puntos en sus renovaciones pagadas hasta completar 12 pagos, con el porcentaje de tu nivel en ese momento. Las renovaciones no suben tu nivel.',
        'Cada punto equivale a $1 MXN de descuento en productos de Vorka México (no en productos de creadores). Se usan al pagar, con el mismo correo de tu cuenta; siempre se cobra al menos $10 MXN por compra.',
        'Si una compra hecha con tu liga se reembolsa o se desconoce el cargo, se descuentan exactamente los puntos que te dio. Si se reembolsa una compra en la que usaste puntos, te los regresamos.',
        '<b>Metas y logros.</b> Las metas y los logros son reconocimiento dentro de la app: no dan puntos ni descuentos adicionales.',
        '<b>Top del mes (opcional).</b> Solo apareces si lo activas en la app. Se muestra tu nombre y la inicial de tu apellido (por ejemplo, “Ana L.”) y tu número de compras del mes a las demás cuentas del programa; puedes desactivarlo cuando quieras.',
        '<b>Avisos.</b> Las notificaciones en tu celular son opcionales: las activas y desactivas en la app o en tu navegador. Además te avisamos en la app, y por correo cuando ganas puntos o aceptamos tu sugerencia.',
        '<b>Visitas a tu liga.</b> Para mostrarte cuántas personas abrieron tu liga contamos una visita por persona al día. No guardamos la dirección IP: solo una huella cifrada que cambia cada día y no permite identificar ni seguir a nadie.',
        'Podemos cancelar puntos obtenidos con engaños (compras falsas, spam o suplantación). Si cambiamos o terminamos el programa, te avisaremos con al menos 30 días para que uses tus puntos.',
        'Vorka puede acordar por escrito condiciones adicionales con participantes específicos del programa; esas condiciones solo aplican a quienes las firman.')),
    ('licencia', 'Uso de los materiales', li(
        'Al comprar recibes una licencia personal, no exclusiva e intransferible para usar los materiales en tus propios proyectos, negocios u organizaciones.',
        'No puedes revender, compartir públicamente, subir a sitios de descarga ni distribuir los archivos, completos o en partes, ni presentarlos como propios.',
        'Si quieres usar los materiales con un grupo (por ejemplo, en un taller, una escuela o una empresa), escríbenos para una licencia de grupo.',
        'Los derechos de autor de los materiales son de Vorka o de sus autores.')),
    ('factura', 'Facturación', '<p>Si necesitas factura (CFDI), escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tu número de orden y tus datos fiscales (RFC, nombre o razón social, régimen fiscal, código postal y uso del CFDI) dentro del mismo mes de tu compra. Las compras que no se facturan de forma individual se incluyen en la factura global.</p>'),
    ('garantia', 'Garantía y reembolsos', '<p>Si un archivo llega dañado o no abre, te lo reponemos. Las condiciones de reembolso están en la <a href="/legal/reembolsos/">política de reembolsos</a>.</p>'),
    ('responsabilidad', 'Alcance de los materiales', '<p>Los materiales son herramientas de orientación y aprendizaje. Los resultados dependen de cómo los apliques y de tu contexto; no constituyen asesoría legal, fiscal ni financiera personalizada.</p>'),
    ('cambios', 'Cambios y ley aplicable', '<p>Podemos actualizar estos términos; la versión vigente es la que aparece en esta página al momento de tu compra. Estos términos se rigen por las leyes de México, incluida la Ley Federal de Protección al Consumidor. Para cualquier queja puedes acudir a la Procuraduría Federal del Consumidor (Profeco).</p>'),
]

REEMBOLSOS = [
    ('regla', 'La regla general', '<p>Por tratarse de productos digitales que se entregan al momento, <b>no hay reembolso una vez que descargaste algún archivo</b> de tu compra.</p>'),
    ('sin-descargar', 'Si aún no descargaste nada', '<p>Si no has descargado ningún archivo, puedes pedir el reembolso dentro de los 5 días hábiles siguientes a tu compra. Escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tu número de orden. Al reembolsarse, tu enlace de descarga se desactiva.</p>'),
    ('acceso', 'Simulador PAA y productos de acceso', li(
        'En los productos que se usan en línea en lugar de descargarse (como el <a href="/simulador-paa/">Simulador PAA</a>), usarlos cuenta igual que descargar: <b>no hay reembolso una vez que empezaste un simulacro, un examen o una práctica</b>, aunque no lo termines.',
        'Si aún no lo has usado, puedes pedir el reembolso dentro de los 5 días hábiles siguientes a tu compra, como en el punto anterior. Al reembolsarse, el acceso se cierra.',
        'Si algo del simulador falla y no te deja usarlo, escríbenos: lo resolvemos o te devolvemos tu dinero.')),
    ('reposicion', 'Garantía de reposición', li(
        'Si un archivo llega dañado, incompleto o no abre en los programas indicados en la página del producto, te lo reponemos sin costo.',
        'Escríbenos con tu número de orden y una captura del error. Si no podemos resolverlo, te devolvemos tu dinero.')),
    ('cargos', 'Cobros duplicados o no reconocidos', '<p>Si ves un cobro duplicado o que no reconoces, escríbenos antes de levantar una aclaración con tu banco: lo revisamos y, si procede, lo devolvemos de inmediato. Si se inicia un contracargo, el acceso a la compra se suspende mientras se resuelve.</p>'),
    ('como', 'Cómo se hace el reembolso', '<p>El reembolso se hace al mismo medio de pago. En tarjeta puede tardar de 5 a 10 días hábiles en reflejarse, según tu banco. En OXXO o SPEI te pediremos una cuenta (CLABE) a tu nombre para transferirte.</p>'),
]

CREADORES = [
    ('partes', 'Quiénes participan', f'<p>Estos términos regulan la relación entre {RESPONSABLE} (“Vorka”) y las personas o empresas (“creadores”) que venden productos digitales propios en vorka.mx/tienda. Al enviar tu solicitud y al publicar productos aceptas estos términos.</p>'),
    ('aprobacion', 'Solicitud y aprobación', li(
        'Vorka revisa cada solicitud y puede aprobarla o rechazarla a su criterio.',
        'Cada producto se revisa antes de publicarse. Vorka puede pedir cambios, no publicarlo o retirarlo si no cumple estos términos o la calidad de la tienda.',
        'Para recibir pagos debes completar tu registro con Stripe, el procesador de pagos de Vorka, y mantener tus datos al día.')),
    ('contenido', 'Tu contenido', li(
        'Declaras que eres autor o titular de los derechos de lo que vendes y que no infringe derechos de terceros.',
        'Conservas la propiedad de tus productos. Nos das permiso no exclusivo para mostrarlos, promocionarlos, venderlos y entregarlos a los compradores mientras estén publicados.',
        'No se permiten contenidos ilegales, engañosos, ofensivos, que promuevan odio o violencia, ni datos personales de terceros.',
        'Si recibimos un reclamo sobre tu producto podemos pausarlo mientras se aclara.')),
    ('venta', 'Precio, venta y entrega', li(
        'Tú fijas el precio (mínimo $20 MXN). Vorka cobra al comprador, entrega los archivos y atiende el soporte de la compra.',
        'Vorka aparece como vendedor ante el comprador y en su estado de cuenta.')),
    ('pagos', 'Comisiones y pagos', li(
        'Por cada venta recibes: precio − comisión de Vorka (20 % salvo acuerdo distinto) − comisión del procesador de pagos de esa venta. En tu portal ves el desglose de cada venta.',
        'Los pagos se transfieren automáticamente a tu cuenta de Stripe 7 días después de cada venta, al terminar el plazo de reembolso, y de ahí a tu cuenta bancaria.',
        'Si un comprador obtiene un reembolso o desconoce el cargo, se cancela o se revierte el pago correspondiente; si ya no tienes saldo, se descuenta de tus siguientes ventas.',
        'Vorka puede cambiar la comisión para ventas futuras avisándote con 30 días de anticipación.')),
    ('impuestos', 'Impuestos', '<p>Eres responsable de tus obligaciones fiscales. Cuando la ley obligue a Vorka a retener impuestos o a reportar información sobre tus ingresos, lo hará y se reflejará en tu desglose.</p>'),
    ('baja', 'Pausa y baja', li(
        'Puedes retirar tus productos o darte de baja cuando quieras; los compradores conservan acceso a lo que ya compraron.',
        'Vorka puede pausar o cerrar tu cuenta si incumples estos términos. Los pagos de ventas válidas ya realizadas se te transfieren en su plazo.')),
    ('datos', 'Datos personales', '<p>Tratamos tus datos conforme al <a href="/privacidad/">aviso de privacidad</a>. Tus datos fiscales, de identidad y bancarios los recaba y resguarda Stripe para procesar tus pagos.</p>'),
]

# Brindi (invitaciones digitales). Redactado con base en la LFPDPPP (DOF 20-03-2025) y la LFPC (arts. 56 y 76 Bis).
# Debe revisarlo un abogado con cédula antes del lanzamiento (ver vorka-os/PLAN-BRINDI.md).
MIGAS_BRINDI = '<a href="/tienda/">Tienda</a><span>/</span><a href="/tienda/brindi/">Brindi</a>'
ARCO = li(
    'Tu nombre completo y el medio (correo) por el que quieres recibir la respuesta.',
    'Una copia de tu identificación oficial o, si actúas por otra persona o por una persona menor de edad, el documento que acredite la representación y la identificación de ambas.',
    'Qué derecho quieres ejercer (acceso, rectificación, cancelación u oposición) y sobre qué datos, con cualquier dato que nos ayude a localizarlos (por ejemplo, el enlace de la invitación).',
    'Si pides rectificar, la corrección que solicitas y, si aplica, el documento que la respalde.')
ARCO_PLAZOS = '<p>Te respondemos en un máximo de <b>20 días hábiles</b> desde que recibimos tu solicitud completa y, si procede, la hacemos efectiva dentro de los <b>15 días hábiles</b> siguientes. Estos plazos pueden ampliarse una sola vez por un periodo igual cuando el caso lo justifique, y te avisaremos. El trámite es gratuito. Si no estás de acuerdo con la respuesta, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno, autoridad encargada de la protección de datos personales en el sector privado.</p>'

BRINDI = [
    ('quien', 'Quién presta el servicio', f'<p>Brindi es un servicio de invitaciones digitales con confirmación de asistencia y pases con código QR, desarrollado y prestado por {RESPONSABLE} (en adelante, “Vorka”), con domicilio en {DOMICILIO}. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> y WhatsApp +52 81 1780 4869, de lunes a viernes de 9:00 a 18:00 h (hora del centro de México).</p><p>Estas condiciones son el contrato entre Vorka y la persona que compra o usa Brindi para organizar un evento (“tú” o “anfitrión”). Al comprar o al crear tu cuenta las aceptas, junto con los <a href="/legal/terminos/">términos de la tienda</a> y el <a href="/legal/brindi/privacidad/">aviso de privacidad de Brindi</a>. Puedes consultarlas, imprimirlas o guardarlas antes de comprar.</p>'),
    ('planes', 'Planes, precio y forma de pago', li(
        'Cada plan es un <b>pago único por un evento</b>. No hay mensualidades, renovaciones ni cargos automáticos.',
        'Los precios están en pesos mexicanos e incluyen IVA. El precio que pagas es el que ves en <a href="/tienda/brindi/">vorka.mx/tienda/brindi</a> al confirmar tu compra; no se agregan cargos ocultos.',
        'Pagas con tarjeta u OXXO a través de Stripe, nuestro procesador de pagos. Vorka nunca recibe ni guarda los datos de tu tarjeta.',
        'Lo que incluye cada plan y cada complemento (límite de invitados, número de fotos, funciones) se describe en la página de compra. Esos límites se respetan durante toda la vigencia de tu evento.',
        'Puedes crear y previsualizar tu invitación sin pagar. Para publicarla necesitas un plan.',
        'Cada plan comprado queda disponible en tu cuenta y se liga al evento al publicarlo; a partir de ese momento no se transfiere a otro evento.',
        'Si necesitas factura (CFDI), sigue lo indicado en los <a href="/legal/terminos/#factura">términos de la tienda</a>.')),
    ('entrega', 'Cómo se entrega el servicio', li(
        'Al confirmarse tu pago recibes un correo con un enlace para entrar a tu panel. Entras sin contraseña, con enlaces temporales que llegan a tu correo.',
        'Desde tu panel diseñas la invitación, registras invitados, compartes los enlaces y consultas las confirmaciones.',
        'Brindi no envía mensajes por WhatsApp ni por correo a tus invitados en tu nombre: tú decides cómo y a quién compartir cada enlace.',
        'Hacemos lo razonable para que el servicio funcione sin interrupciones, con copias de seguridad y monitoreo de errores. Puede haber mantenimientos breves o fallas de terceros (internet, nube o pagos). Te recomendamos tener una lista de respaldo el día del evento; puedes descargarla desde tu panel.')),
    ('vigencia', 'Vigencia de tu invitación', li(
        'Tu invitación queda en línea hasta 30 días después de la fecha de tu evento. Después muestra un mensaje de agradecimiento y deja de recibir confirmaciones.',
        'Conservamos la información del evento (invitados, confirmaciones, registro de entradas y fotos) 90 días más para que puedas descargarla. Después se borra de forma definitiva.',
        'Con el complemento de extensión se suman 90 días a ambos plazos.',
        'Puedes despublicar o borrar un evento, o tu cuenta completa, en cualquier momento desde tu panel.')),
    ('reembolsos', 'Cancelación y reembolsos', li(
        'Si no has publicado ninguna invitación con tu plan, puedes cancelar tu compra y recibir el <b>reembolso completo dentro de los 10 días naturales siguientes</b> al pago. Basta con escribir a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tu número de orden; no tienes que explicar el motivo.',
        'Al publicar una invitación, el servicio se presta de inmediato (la invitación queda en línea y empieza a recibir visitas y confirmaciones). Desde ese momento no hay reembolso por cambio de opinión.',
        'Siempre tienes derecho al reembolso, total o proporcional, si una falla atribuible a Brindi impide usar lo que compraste y no la resolvemos en un plazo razonable, en especial si afecta el día de tu evento.',
        'Los servicios de configuración asistida y diseño profesional se reembolsan completos si cancelas antes de que empecemos a trabajar.',
        'El reembolso se hace al mismo medio de pago, como se explica en la <a href="/legal/reembolsos/#como">política de reembolsos</a>. Al reembolsarse una compra se retira el plan o complemento y la invitación puede dejar de estar en línea.')),
    ('contenido', 'Tu contenido y uso aceptable', li(
        'Eres responsable de los textos, nombres, fotos y datos que publicas. Debes tener derecho a usarlos y el consentimiento de las personas que aparecen.',
        '<b>Personas menores de edad:</b> solo publica fotos o datos de niñas, niños o adolescentes si eres su madre, padre o tutor, o cuentas con su autorización. Para invitaciones de XV años, bautizos o cumpleaños infantiles, la cuenta debe abrirla una persona adulta.',
        'No se permite usar Brindi para engaños, fraudes, spam, suplantar a otras personas, contenido ilegal, sexual, violento o que promueva odio, ni para recabar datos de personas sin su conocimiento.',
        'Los invitados pueden reportar una invitación. Podemos ocultar contenido o suspender eventos o cuentas que incumplan estas reglas; te avisaremos el motivo y podrás responder. Si la suspensión no se debe a un incumplimiento tuyo, te reembolsamos.',
        'Conservas los derechos sobre tu contenido. Nos das permiso, no exclusivo y gratuito, de alojarlo y mostrarlo solo para prestarte el servicio, y lo retiramos cuando borras el evento. No usamos tu invitación como ejemplo ni en publicidad sin tu autorización por escrito.',
        'Los diseños, plantillas, ilustraciones y el software de Brindi son de Vorka; puedes usarlos para tu evento, pero no copiarlos ni revenderlos.')),
    ('invitados', 'Datos de tus invitados', '<p>Cuando registras invitados y recibes sus confirmaciones, tú decides para qué se usan esos datos (organizar tu evento) y Vorka los trata solo por tu cuenta y conforme a tus instrucciones para prestarte el servicio. Al usar Brindi te comprometes a:</p>' + li(
        'Pedir solo los datos que necesitas: nombre, número de lugares y, si quieres, celular, mesa y preferencia de alimentación.',
        'No capturar datos sensibles (por ejemplo, de salud, religión u orientación sexual) en los campos de invitados ni en las notas.',
        'Usar los datos solo para tu evento: no para enviar publicidad ni para entregarlos a terceros ajenos a la organización.',
        'Atender las peticiones de tus invitados para corregir o borrar sus datos. Si nos las envían a nosotros, te las haremos llegar y te ayudaremos a cumplirlas.') +
        '<p>Por nuestra parte, nos comprometemos a tratar esos datos con confidencialidad, a no venderlos ni usarlos para publicidad, a protegerlos con medidas de seguridad y a borrarlos al terminar los plazos de la sección anterior. Los invitados encuentran lo que deben saber en el <a href="/legal/brindi/privacidad-invitados/">aviso de privacidad para invitados</a>, que se enlaza en cada formulario de confirmación.</p>'),
    ('responsabilidad', 'Alcance de nuestra responsabilidad', '<p>Respondemos por prestar el servicio tal como se ofrece en la página de compra. No somos responsables de la organización, cancelación o cambios de tu evento, de lo que publiques en tu invitación ni de las decisiones que tomes con las confirmaciones. Nada en estas condiciones limita los derechos que te da la Ley Federal de Protección al Consumidor.</p>'),
    ('cambios', 'Cambios, quejas y ley aplicable', '<p>Si cambiamos estas condiciones, la versión nueva aplica a compras posteriores y la publicamos en esta página con su fecha. Lo que ya compraste conserva las condiciones del momento de la compra.</p><p>Si tienes una queja, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>; te respondemos en un máximo de 5 días hábiles. También puedes acudir a la Procuraduría Federal del Consumidor (Profeco), incluso por medio de Concilianet. Estas condiciones se rigen por las leyes federales de México.</p>'),
]

BRINDI_PRIVACIDAD = [
    ('responsable', 'Quién es el responsable', f'<p>{RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos personales de las personas que compran o usan Brindi para organizar un evento (“anfitriones”). Contacto para temas de privacidad: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p><p>Este aviso cubre a los anfitriones. Si recibiste una invitación, consulta el <a href="/legal/brindi/privacidad-invitados/">aviso de privacidad para invitados</a>. Lo relativo a tus compras en la tienda también se rige por el <a href="/privacidad/">aviso de privacidad general de Vorka</a>.</p>'),
    ('datos', 'Qué datos tratamos', li(
        '<b>Cuenta:</b> correo electrónico, nombre (si lo das) y la fecha de alta.',
        '<b>Compras:</b> productos comprados, monto, método de pago (tarjeta u OXXO), fecha, número de orden y, si llegaste por una recomendación, el código de quien te recomendó. No recibimos ni guardamos los datos de tu tarjeta: el pago lo procesa Stripe.',
        '<b>Tu evento:</b> los textos, fechas, lugares, nombres y fotos que capturas en la invitación, y la lista de invitados que registras.',
        '<b>Uso y seguridad:</b> los cambios que haces en tu cuenta (bitácora), los mensajes que nos envías a soporte y una huella cifrada e irreversible de tu dirección IP para limitar intentos repetidos.',
        '<b>Datos fiscales,</b> solo si pides factura.') + '<p><b>No pedimos datos personales sensibles</b> ni datos financieros. No necesitas darnos tu consentimiento expreso para los datos de este aviso; si no estás de acuerdo con él, no uses Brindi.</p>'),
    ('finalidades', 'Para qué los usamos', '<p><b>Finalidades necesarias</b> para prestarte el servicio:</p>' + li(
        'Crear y mantener tu cuenta y permitirte entrar con enlaces temporales enviados a tu correo.',
        'Procesar tus compras, aplicar tus planes y complementos, emitir facturas, atender reembolsos y prevenir fraudes.',
        'Guardar, mostrar y publicar tu invitación, recibir las confirmaciones de tus invitados y generar los pases y el registro de entradas.',
        'Enviarte correos sobre tu cuenta y tu evento (acceso, confirmación de compra, avisos de vencimiento).',
        'Darte soporte, atender reportes de invitaciones y cumplir obligaciones legales y fiscales.',
        'Mantener la seguridad del servicio y obtener estadísticas agregadas que no te identifican (por ejemplo, cuántas invitaciones se publican por plantilla).') +
        '<p><b>Finalidad adicional</b> (puedes negarte): enviarte, como máximo una vez al mes, novedades y promociones de Brindi y de Vorka. Para negarte escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con el asunto “Finalidades adicionales” o usa el enlace de baja de cada correo. Negarte no afecta tu servicio.</p>'),
    ('compartir', 'Con quién los compartimos', '<p><b>No vendemos ni rentamos tus datos</b> y no los compartimos con terceros para su publicidad. Para prestar el servicio usamos proveedores que los tratan solo por nuestra cuenta y bajo nuestras instrucciones (encargados), algunos con servidores fuera de México:</p>' + li(
        '<b>Cloudflare</b>: alojamiento de la aplicación, base de datos y almacenamiento de fotos.',
        '<b>Stripe</b>: procesamiento de pagos.',
        '<b>Amazon Web Services</b> (Amazon SES), <b>Resend</b> y <b>Brevo</b>: envío de correos (uno principal y los demás de respaldo).') +
        '<p>Solo entregaremos datos a una autoridad cuando una ley o una orden fundada y motivada lo exija. Si en el futuro necesitamos transferir tus datos para un fin distinto, te pediremos tu consentimiento cuando la ley lo requiera.</p>'),
    ('menores', 'Personas menores de edad', '<p>La cuenta de Brindi debe abrirla una persona mayor de edad. Si tu invitación incluye fotos o datos de niñas, niños o adolescentes (por ejemplo, en XV años, bautizos o cumpleaños), declaras ser su madre, padre o tutor o contar con su autorización. Si detectamos datos de menores publicados sin esa autorización, los retiraremos.</p>'),
    ('arco', 'Tus derechos ARCO y cómo revocar tu consentimiento', '<p>Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso (derechos ARCO), y revocar el consentimiento que nos diste. Gran parte puedes hacerlo tú mismo desde tu panel: editar tu evento, descargar tu lista de invitados y borrar eventos o tu cuenta. Para lo demás, escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con:</p>' + ARCO + ARCO_PLAZOS +
        '<p>Revocar el consentimiento o cancelar tus datos puede impedir que sigamos prestándote el servicio, y no aplica a los datos que debemos conservar por obligaciones fiscales.</p>'),
    ('conservacion', 'Cuánto tiempo los conservamos', li(
        'Datos del evento (invitación, invitados, confirmaciones, entradas y fotos): hasta 120 días después de la fecha del evento (210 con el complemento de extensión), o antes si los borras.',
        'Cuenta: mientras la uses o hasta que la borres desde tu panel.',
        'Datos de compras y facturación: durante los plazos que exigen las leyes fiscales (al menos 5 años).',
        'Huellas de IP para seguridad: se borran a más tardar 2 días después.') + '<p>Al terminar esos plazos eliminamos los datos o los convertimos en cifras que ya no identifican a nadie.</p>'),
    ('seguridad', 'Cómo los protegemos', '<p>Usamos conexiones cifradas; enlaces de acceso con vencimiento; códigos aleatorios para las invitaciones personales y los pases, que no revelan nombres; aislamiento de la información de cada cuenta; acceso interno solo para las personas que lo necesitan según su función, y bitácora de las acciones administrativas. Las invitaciones no aparecen en buscadores salvo que tú lo actives. Si ocurriera una vulneración de seguridad que afecte de forma significativa tus derechos, te lo informaremos de inmediato para que puedas protegerte.</p>'),
    ('cookies', 'Cookies', '<p>El panel de Brindi usa una sola cookie necesaria (<code>vbr</code>) para mantener tu sesión iniciada; no usamos cookies de publicidad ni herramientas de rastreo de terceros. Tu navegador también guarda los textos de tus mensajes para compartir invitaciones, para que no tengas que reescribirlos; puedes borrarlos desde la configuración de tu navegador.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>Si cambiamos este aviso, publicaremos la versión nueva en esta página con su fecha de actualización y, si el cambio es relevante (por ejemplo, una nueva finalidad), te avisaremos por correo antes de que aplique.</p>'),
]

BRINDI_INVITADOS = [
    ('resumen', 'En pocas palabras', li(
        'Tus datos los usa <b>quien te invitó</b> para organizar su evento: saber si vas, con cuántas personas y, si lo indicas, tu preferencia de alimentación.',
        'Vorka México presta la plataforma Brindi y trata tus datos solo para eso. <b>No los vendemos ni los usamos para publicidad.</b>',
        'Se borran a más tardar 120 días después del evento.',
        'Puedes pedir verlos, corregirlos o borrarlos escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.')),
    ('quien', 'Quién trata tus datos', f'<p>La persona que organiza el evento (“anfitrión”) decide qué datos te pide y para qué los usa. Su nombre aparece en la invitación y puedes contactarle directamente.</p><p>{RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, presta la plataforma Brindi: guarda y procesa tus datos <b>por cuenta del anfitrión</b> para que pueda organizar su evento, y es responsable directa solo de los datos que usa para mantener la seguridad del servicio (descritos abajo). Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>'),
    ('datos', 'Qué datos se tratan', li(
        'Los que el anfitrión registró para invitarte: tu nombre o el de tu familia, el número de lugares y, si lo capturó, tu celular y tu mesa.',
        'Los que tú das al confirmar: si asistirás, cuántas personas, tu preferencia de alimentación (opcional) y el mensaje que quieras dejar (opcional).',
        'El registro de tu entrada al evento si el anfitrión usa los pases con código QR (hora y número de personas).',
        'Para seguridad y conteo: si abriste tu invitación, el número de visitas, y una huella cifrada e irreversible de tu dirección IP para limitar intentos repetidos. No usamos cookies en la invitación.') +
        '<p><b>No pedimos datos sensibles.</b> La preferencia de alimentación es opcional y se usa solo para planear el menú; si tienes una necesidad de salud, como una alergia, coméntala directamente con el anfitrión y no la escribas en el mensaje.</p>'),
    ('finalidades', 'Para qué se usan', '<p>Solo para lo necesario para el evento: mostrarte la invitación, registrar tu respuesta, informar al anfitrión quién asistirá y cuántas personas, generar tu pase de acceso y verificarlo en la entrada. Vorka además usa la huella de IP y el conteo de visitas para proteger el servicio contra abusos y para estadísticas que no te identifican. <b>No hay finalidades adicionales</b>: no recibirás publicidad de Vorka por haber respondido una invitación.</p>'),
    ('compartir', 'Con quién se comparten', '<p>Tus datos solo los ve el anfitrión (y las personas a quienes dé acceso para la recepción del evento). Vorka no los vende, no los renta y no los comparte con terceros para su publicidad. Para operar la plataforma, Vorka usa a Cloudflare como proveedor de alojamiento y base de datos, que trata la información solo por cuenta de Vorka. Solo se entregarían datos a una autoridad si una ley o una orden fundada y motivada lo exige.</p>'),
    ('arco', 'Tus derechos', '<p>Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso (derechos ARCO), y revocar tu consentimiento. Lo más rápido es pedírselo al anfitrión, que puede corregir o borrar tu registro desde su panel. También puedes escribir a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> indicando el enlace de la invitación y lo que necesitas; se lo haremos llegar al anfitrión, le ayudaremos a atenderlo y, si se trata de los datos que Vorka trata como responsable, lo atenderemos directamente. Para identificarte podemos pedirte:</p>' + ARCO + ARCO_PLAZOS),
    ('menores', 'Personas menores de edad', '<p>Si eres menor de edad, pide a tu madre, padre o tutor que confirme tu asistencia o que te acompañe al hacerlo. Si una invitación incluye datos o fotos de menores sin autorización, puedes reportarla con el enlace “Reportar esta invitación” que aparece al final de cada invitación.</p>'),
    ('conservacion', 'Cuánto tiempo se conservan', '<p>La invitación deja de recibir respuestas 30 días después del evento y todos los datos del evento se borran de forma definitiva a más tardar 90 días después de eso (180 si el anfitrión contrató una extensión). El anfitrión puede borrarlos antes. Las huellas de IP se borran a más tardar 2 días después.</p>'),
    ('seguridad', 'Cómo se protegen', '<p>La invitación no aparece en buscadores salvo que el anfitrión lo active. Tu enlace personal y tu pase usan códigos aleatorios que no revelan tu nombre; si alguien no tiene el enlace, no puede ver tus datos. Las conexiones van cifradas y cada cuenta de anfitrión está aislada de las demás.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>Si cambiamos este aviso, la versión nueva se publicará en esta misma dirección con su fecha. Siempre puedes consultarlo desde el enlace “Aviso de privacidad” del formulario de confirmación.</p>'),
]

# Cupo (eventos con registro, cover y QR). Redactado con base en la LFPDPPP (DOF 20-03-2025) y la LFPC (art. 76 Bis).
# Debe revisarlo un abogado con cédula (ver vorka-os/PLAN-CUPO.md).
MIGAS_CUPO = '<a href="/tienda/">Tienda</a><span>/</span><a href="/tienda/cupo/">Cupo</a>'
CUPO = [
    ('quien', 'Quién presta el servicio', f'<p>Cupo es una plataforma para crear la página de un evento, recibir registros, administrar asistentes y hacer check-in con código QR, desarrollada y prestada por {RESPONSABLE} (en adelante, “Vorka”), con domicilio en {DOMICILIO}. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p><p>Estas condiciones son el contrato entre Vorka y la persona que usa Cupo para organizar un evento (“tú” u “organizador”). Al crear tu cuenta o comprar Cupo Pro las aceptas, junto con los <a href="/legal/terminos/">términos de la tienda</a> y el <a href="/legal/cupo/privacidad/">aviso de privacidad de Cupo</a>.</p>'),
    ('planes', 'Planes y precio', li(
        '<b>Gratis</b>: eventos sin costo de entrada y sin correos a los asistentes, con los límites que se indican en <a href="https://os.vorka.mx/cupo/">os.vorka.mx/cupo</a>. Puedes armar y previsualizar tu evento sin pagar; solo pagas si activas Pro al publicarlo.',
        '<b>Cupo Pro</b> (por aforo: hasta 100, 300, 1,000 o 3,000 personas por evento) y los <b>paquetes de 5 eventos</b> son pagos únicos, en pesos mexicanos con IVA incluido, a través de Stripe. No hay mensualidades ni cargos automáticos. Vorka nunca recibe los datos de tu tarjeta.',
        'Cada evento Pro comprado queda en tu cuenta y se aplica al publicar un evento; desde ese momento queda ligado a ese evento. Los del paquete deben usarse dentro de los 12 meses siguientes a la compra.',
        'Lo que incluye cada plan se describe en la página de compra al momento de pagar.')),
    ('cover', 'El cover de tu evento: el dinero es tuyo y lo cobras tú', '<p>Cupo te permite mostrar a tus asistentes cómo pagarte (tu CLABE, tu propia liga de pago o el pago en la puerta) y marcar quién ya pagó. <b>Vorka no recibe, no retiene y no transfiere ese dinero</b>, no actúa como intermediario de pagos ni como agente de cobro, y no cobra comisión por él.</p>' + li(
        'Tú eres el único responsable de cobrar el cover, de confirmar los pagos, de emitir los comprobantes o facturas que correspondan y de cumplir tus obligaciones fiscales.',
        'Tú defines y comunicas a tus asistentes tu política de cancelación y reembolso, y la cumples. Si cancelas tu evento, Cupo avisa a las personas registradas, pero los reembolsos del cover los haces tú.',
        'Frente a tus asistentes, eres tú quien ofrece el evento. Vorka solo presta la herramienta.')),
    ('reembolsos', 'Cancelación y reembolso de Cupo Pro', li(
        'Si no has aplicado tu evento Pro a ningún evento publicado, puedes pedir el reembolso completo dentro de los 10 días naturales siguientes al pago escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tu número de orden.',
        'En el paquete de 5 eventos, dentro del mismo plazo se reembolsan completos si no has usado ninguno; si ya usaste alguno, te devolvemos la parte proporcional de los que no has usado.',
        'Una vez aplicado a un evento publicado, el servicio se presta de inmediato y no hay reembolso por cambio de opinión; sí lo hay, total o proporcional, si una falla atribuible a Cupo impide usarlo y no la resolvemos en un plazo razonable.',
        'Si se reembolsa una compra, el evento vuelve al plan gratis y se desactivan las funciones Pro.')),
    ('uso', 'Uso aceptable', li(
        'Solo puedes publicar eventos lícitos y reales. No se permite usar Cupo para fraudes, para cobrar por eventos que no existen, para spam, para suplantar a otras personas ni para recabar datos de personas sin su conocimiento.',
        'Si tu evento tiene restricciones (por ejemplo, venta de alcohol solo a mayores de edad), es tu responsabilidad informarlo y verificarlo en la entrada.',
        'Cualquier persona puede reportar un evento. Podemos ocultar o suspender eventos o cuentas que incumplan estas reglas; te avisaremos el motivo. Si suspendemos un evento por un error nuestro, te reembolsamos.')),
    ('asistentes', 'Datos de tus asistentes', '<p>Tú decides para qué se usan los datos de las personas que se registran en tu evento; Vorka los trata solo por tu cuenta para prestarte el servicio (enviar entradas, recordatorios y tus avisos, y hacer el check-in). Si usas ligas para RPs, cada RP ve en su panel solo el nombre (con la inicial del apellido), el estado y la llegada de las personas que se registraron con su liga; tú eres responsable de a quién le das esa liga y de las comisiones o acuerdos que tengas con tus RPs. <b>Preguntas adicionales:</b> si pides datos extra al registrarse (por ejemplo matrícula, grupo o escuela en un evento escolar, o empresa en uno de negocios), tú decides qué pides y para qué, eres el responsable de esos datos frente a tus asistentes y debes decirles para qué los usarás. No pidas datos sensibles (salud, origen étnico, religión, opiniones políticas, vida sexual, datos biométricos), datos bancarios, contraseñas ni identificaciones oficiales. Vorka solo guarda esas respuestas por tu cuenta, no las usa para nada más y las borra junto con el evento. Te comprometes a usarlos solo para tu evento, a no enviarles publicidad que no hayan aceptado y a atender sus peticiones de corregir o borrar sus datos. Las personas encuentran lo que deben saber en el <a href="/legal/cupo/privacidad-asistentes/">aviso de privacidad para asistentes</a>, que se enlaza en cada formulario de registro.</p>'),
    ('servicio', 'Correos y disponibilidad', '<p>En los eventos con Cupo Pro (y con los correos encendidos), Cupo envía por correo las entradas, los recordatorios y tus avisos. En el plan gratis no se envían correos a tus asistentes: cada persona ve su entrada al registrarse y la conserva en su liga propia. Hacemos lo razonable para que lleguen, pero dependen de terceros (proveedores de correo y de internet) y pueden llegar a spam; por eso cada persona tiene además su entrada en una liga propia. Para proteger el servicio puede haber límites diarios de envío: las entradas y confirmaciones de pago tienen prioridad sobre los recordatorios. Te recomendamos descargar tu lista antes del evento.</p>'),
    ('conservacion', 'Cuánto se conserva', '<p>Los registros de cada evento se borran de forma definitiva 90 días después de la fecha del evento. Puedes borrar un evento o pedir que borremos tu cuenta en cualquier momento.</p>'),
    ('cambios', 'Cambios, quejas y ley aplicable', '<p>Si cambiamos estas condiciones, la versión nueva aplica a compras posteriores y la publicamos aquí con su fecha. Si tienes una queja, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>; te respondemos en un máximo de 5 días hábiles. También puedes acudir a la Procuraduría Federal del Consumidor (Profeco). Estas condiciones se rigen por las leyes federales de México.</p>'),
]

CUPO_PRIVACIDAD = [
    ('responsable', 'Quién es el responsable', f'<p>{RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos de las personas que crean eventos en Cupo (“organizadores”). Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Si te registraste a un evento, consulta el <a href="/legal/cupo/privacidad-asistentes/">aviso para asistentes</a>.</p>'),
    ('datos', 'Qué datos tratamos', li(
        '<b>Cuenta:</b> correo electrónico y, si lo das, tu nombre.',
        '<b>Tus eventos:</b> lo que capturas (título, fecha, lugar, descripción, portada, nombre del organizador) y, si cobras cover, los datos de pago que decides mostrar a tus asistentes (CLABE, banco, titular o liga de pago).',
        '<b>Compras de Cupo Pro:</b> productos, monto, fecha y número de orden. Los datos de tu tarjeta los procesa Stripe; Vorka no los recibe.',
        '<b>Uso y seguridad:</b> los avisos que envías, una bitácora de acciones y una huella cifrada e irreversible de tu dirección IP para limitar intentos repetidos.') + '<p>No pedimos datos personales sensibles.</p>'),
    ('finalidades', 'Para qué los usamos', '<p><b>Finalidades necesarias:</b> crear y mantener tu cuenta; publicar tus eventos y mostrar a tus asistentes la información que capturas; procesar tus compras y reembolsos; enviarte correos de tu cuenta y tus eventos; darte soporte, atender reportes y cumplir obligaciones legales; mantener la seguridad y obtener estadísticas agregadas que no te identifican.</p><p><b>Finalidad adicional</b> (puedes negarte): enviarte, como máximo una vez al mes, novedades de Cupo y de Vorka. Escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con el asunto “Finalidades adicionales” o usa el enlace de baja del correo.</p>'),
    ('compartir', 'Con quién los compartimos', '<p>No vendemos ni rentamos tus datos. Usamos proveedores que los tratan solo por nuestra cuenta: <b>Cloudflare</b> (alojamiento, base de datos y fotos), <b>Stripe</b> (pagos de Cupo Pro) y <b>Amazon Web Services</b> (Amazon SES), <b>Resend</b> y <b>Brevo</b> (correos), algunos con servidores fuera de México. Los datos de pago que tú publicas en tu evento los ven las personas que se registran, porque así lo decides. Solo entregaríamos datos a una autoridad si una ley o una orden fundada y motivada lo exige.</p>'),
    ('arco', 'Tus derechos ARCO', '<p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, y revocar tu consentimiento. Mucho lo haces desde tu cuenta (editar o borrar eventos). Para lo demás, escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con:</p>' + ARCO + ARCO_PLAZOS),
    ('conservacion', 'Cuánto tiempo los conservamos', li('Eventos y sus registros: hasta 90 días después de la fecha del evento, o antes si los borras.', 'Cuenta: mientras la uses o hasta que pidas borrarla.', 'Compras y facturación: durante los plazos fiscales (al menos 5 años).', 'Huellas de IP: se borran a más tardar 2 días después.')),
    ('cookies', 'Cookies', '<p>La app usa una sola cookie necesaria (<code>vcu</code>) para mantener tu sesión. La página pública de un evento no usa cookies; solo cuenta visitas sin identificar a nadie.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>Publicaremos cualquier cambio en esta página con su fecha y, si es relevante, te avisaremos por correo antes de que aplique.</p>'),
]

CUPO_ASISTENTES = [
    ('resumen', 'En pocas palabras', li(
        'Tus datos los usa <b>quien organiza el evento</b> para saber quién va, confirmar tu lugar y tu pago, y dejarte entrar.',
        'Vorka México presta la plataforma Cupo y trata tus datos solo para eso. <b>No los vendemos ni los usamos para publicidad.</b>',
        'Se borran a más tardar 90 días después del evento.',
        'Puedes pedir verlos, corregirlos o borrarlos escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> o a quien organiza.')),
    ('quien', 'Quién trata tus datos', f'<p>La persona o empresa que organiza el evento (su nombre aparece en la página) decide qué datos te pide y para qué los usa. {RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, presta la plataforma y trata tus datos <b>por cuenta del organizador</b>; es responsable directa solo de los datos que usa para la seguridad del servicio. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>'),
    ('datos', 'Qué datos se tratan', li(
        'Los que das al registrarte: nombre, correo, WhatsApp (opcional) y tus respuestas a las preguntas del organizador, si las hay.',
        'El estado de tu lugar (confirmado, por pagar, en lista de espera…), si avisaste que ya pagaste y la referencia que escribiste, y la hora en que entraste al evento.',
        'Si el evento no manda correos, el NIP de 4 números que eliges para recuperar tu entrada. Se guarda cifrado de forma irreversible: nadie, ni el organizador ni Vorka, puede leerlo.',
        'Si te registraste con la liga de un RP (relaciones públicas) del organizador, a qué RP corresponde tu registro.',
        'Para seguridad: una huella cifrada e irreversible de tu dirección IP. La página del evento no usa cookies.') + '<p><b>Preguntas adicionales del organizador.</b> Algunos eventos piden datos extra, como matrícula, grupo o escuela en eventos escolares, o empresa en eventos de negocios. Esas preguntas las define el organizador, que decide para qué usa tus respuestas y es responsable de ellas; Vorka solo las guarda por su cuenta y las borra junto con el evento. Vorka no pide datos sensibles y no permite pedirlos; responde solo lo que quieras compartir y, si tienes dudas sobre para qué se usarán, pregúntale al organizador.</p>'),
    ('finalidades', 'Para qué se usan', '<p>Registrarte, darte tu entrada con QR, mostrarte cómo pagar si el evento tiene cover, avisarte si se libera un lugar o si cambia o se cancela el evento, y verificar tu entrada en la puerta. Si el organizador tiene activados los correos, también enviarte por correo tu entrada, recordatorios automáticos (un día y dos horas antes) y sus avisos sobre el evento. <b>No hay finalidades adicionales</b>: no recibirás publicidad de Vorka por registrarte.</p>'),
    ('pagos', 'Pagos del cover', '<p>Si el evento cobra cover, le pagas directo al organizador. Vorka no recibe ese dinero ni ve tus datos bancarios: solo registra si el organizador confirmó tu pago. Los reembolsos los gestiona el organizador.</p>'),
    ('compartir', 'Con quién se comparten', '<p>Tus datos los ve el organizador y, para el check-in, las personas de su equipo a quienes él dé acceso. Si te registraste con la liga de un RP, ese RP ve solo tu nombre con la inicial de tu apellido, el estado de tu lugar y si llegaste; no ve tu correo, tu WhatsApp ni tus respuestas. Vorka usa a Cloudflare (alojamiento) y a Amazon Web Services (Amazon SES), Resend y Brevo (envío de correos) como proveedores que tratan la información solo por su cuenta. No se venden ni se rentan.</p>'),
    ('arco', 'Tus derechos', '<p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos y revocar tu consentimiento. Puedes liberar tu lugar desde tu entrada. Para lo demás, escribe al organizador o a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con el enlace del evento; se lo haremos llegar y le ayudaremos a atenderlo. Podemos pedirte:</p>' + ARCO + ARCO_PLAZOS),
    ('menores', 'Personas menores de edad', '<p>Si eres menor de edad, regístrate con el conocimiento de tu madre, padre o tutor. Si un evento no es apto para menores, el organizador debe indicarlo y verificarlo.</p>'),
    ('conservacion', 'Cuánto tiempo se conservan', '<p>Los registros del evento se borran de forma definitiva 90 días después de la fecha del evento. El organizador puede borrarlos antes. Las huellas de IP se borran a más tardar 2 días después.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>La versión vigente siempre está en esta dirección, enlazada desde cada formulario de registro.</p>'),
]

# Vuelve (tarjetas de lealtad por suscripción). Mismas bases que Cupo (LFPDPPP 2025, LFPC art. 76 Bis); aquí además hay
# renovación automática (LFPC: informar antes de contratar y permitir cancelar por el mismo medio). Debe revisarlo un abogado.
MIGAS_VUELVE = '<a href="/tienda/">Tienda</a><span>/</span><a href="/tienda/vuelve/">Vuelve</a>'
VUELVE = [
    ('quien', 'Quién presta el servicio', f'<p>Vuelve es una plataforma de tarjetas de lealtad digitales (sellos o puntos, recompensas, avisos a clientes y métricas) para negocios, desarrollada y prestada por {RESPONSABLE} (en adelante, “Vorka”), con domicilio en {DOMICILIO}. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p><p>Estas condiciones son el contrato entre Vorka y el negocio que usa Vuelve (“tú”). Al crear tu cuenta o suscribirte las aceptas, junto con los <a href="/legal/terminos/">términos de la tienda</a> y el <a href="/legal/vuelve/privacidad/">aviso de privacidad de Vuelve</a>.</p>'),
    ('prueba', 'Prueba gratis', li(
        'Al crear tu cuenta tienes 7 días naturales con todas las funciones, sin dar una tarjeta. No se te cobra nada al terminar.',
        'Si al terminar la prueba no te suscribes, tu programa queda en pausa: tus clientes conservan su tarjeta y su saldo, pero no se pueden sumar sellos ni salen avisos. Te suscribes cuando quieras y todo sigue donde lo dejaste.')),
    ('suscripcion', 'Suscripción, precio y renovación automática', li(
        'El plan es <b>mensual o anual</b>, en pesos mexicanos con IVA incluido, e incluye una sucursal. Cada sucursal adicional se suma a tu plan con el mismo periodo. El precio vigente se muestra en <a href="/tienda/vuelve/">vorka.mx/tienda/vuelve</a> antes de pagar.',
        '<b>La suscripción se renueva sola</b> al final de cada periodo y se cobra a la tarjeta que registraste, a través de Stripe. Vorka nunca recibe los datos de tu tarjeta.',
        'Si un cobro falla, Stripe lo reintenta durante algunos días y te avisamos; mientras tanto tu programa sigue funcionando. Si no se logra cobrar, la suscripción se cancela y tu programa queda en pausa.',
        'Si cambiamos el precio, te avisamos por correo al menos 30 días antes y el nuevo precio aplica hasta tu siguiente renovación después de ese aviso.',
        'Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales dentro del mismo mes del cobro.')),
    ('cancelar', 'Cancelación y reembolsos', li(
        'Cancelas cuando quieras desde Vuelve › Cuenta › Suscripción, sin llamadas ni trámites. Tu programa sigue activo hasta el final del periodo que ya pagaste; no se hacen cobros nuevos.',
        'Antes y después de cancelar puedes descargar a tus clientes en Excel.',
        'Por ser un servicio que se presta de inmediato, no hay reembolsos proporcionales por cancelar a la mitad de un periodo, salvo que una falla atribuible a Vuelve te impida usarlo y no la resolvamos en un plazo razonable; en ese caso te devolvemos la parte proporcional.',
        'Si pagaste un plan anual y cancelas dentro de los 10 días naturales siguientes al primer cobro, te devolvemos tu dinero completo si lo pides a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.')),
    ('programa', 'Tu programa y tus promesas a tus clientes', li(
        'Tú defines los sellos, los puntos, las recompensas, los niveles, los premios de referidos y los mensajes. <b>Frente a tus clientes, las recompensas las ofreces y las cumples tú.</b> Vorka solo presta la herramienta.',
        'Si cambias o terminas tu programa, avísalo a tus clientes y respeta las recompensas que ya ganaron.',
        'Tú eres responsable de lo que hace tu equipo con el escáner. Vuelve te da PIN por persona, topes y una bitácora para ayudarte a controlarlo.')),
    ('clientes', 'Datos de tus clientes', '<p>Tú eres el <b>responsable</b> de los datos de las personas que se registran en tu programa y decides para qué los usas; Vorka los trata <b>solo por tu cuenta</b> (como encargado) para prestarte el servicio: mostrar su tarjeta, sumar sellos, enviar los avisos que configures y darte tus métricas. Vuelve pone en tu página de registro un <a href="/legal/vuelve/privacidad-clientes/">aviso de privacidad para clientes</a> con tus datos de contacto, pide su aceptación y separa el permiso para recibir promociones. Te comprometes a usar esos datos solo para tu programa, a no enviar promociones a quien no las aceptó, a no venderlos y a atender sus peticiones de corregir o borrar sus datos. Vorka no usa los datos de tus clientes para nada más ni los comparte con otros negocios.</p>'),
    ('avisos', 'Avisos, tarjetas en el celular y disponibilidad', '<p>Los avisos llegan a la tarjeta del cliente (Apple Wallet, Google Wallet o tarjeta web con notificaciones) y, si dejó su correo, por correo. Su entrega depende de terceros (Apple, Google, proveedores de correo y los ajustes del celular de cada persona), así que no garantizamos que cada aviso se vea. En iPhone, el aviso por cercanía muestra la tarjeta en la pantalla de bloqueo cuando la persona pasa cerca de tu sucursal y tiene activada la ubicación; no es una notificación con sonido. Hacemos lo razonable para que Vuelve esté disponible siempre, pero puede haber interrupciones por mantenimiento o fallas de terceros.</p>'),
    ('uso', 'Uso aceptable', li(
        'Solo para negocios reales y lícitos. No se permite usar Vuelve para spam, para ofrecer recompensas que no piensas cumplir, para suplantar a otro negocio ni para recabar datos de personas sin su conocimiento.',
        'Podemos suspender una cuenta que incumpla estas reglas; te avisaremos el motivo. Si la suspensión fue por un error nuestro, te reembolsamos el periodo afectado.')),
    ('conservacion', 'Qué pasa con tus datos si te vas', '<p>Si cancelas o tu prueba termina sin suscripción, conservamos tu programa y tus clientes 90 días después del fin de tu último periodo, por si vuelves. Después se borran de forma definitiva, salvo lo que la ley nos obligue a conservar (por ejemplo, tus facturas). Puedes pedir que lo borremos antes.</p>'),
    ('cambios', 'Cambios, quejas y ley aplicable', '<p>Si cambiamos estas condiciones, te avisamos por correo y publicamos la versión nueva aquí con su fecha. Si tienes una queja, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>; te respondemos en un máximo de 5 días hábiles. También puedes acudir a la Procuraduría Federal del Consumidor (Profeco). Estas condiciones se rigen por las leyes de México.</p>'),
]

VUELVE_PRIVACIDAD = [
    ('responsable', 'Quién es el responsable', f'<p>{RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos de los negocios y de las personas que los administran en Vuelve. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>. Si eres cliente de un negocio que usa Vuelve, consulta el <a href="/legal/vuelve/privacidad-clientes/">aviso para clientes</a>.</p>'),
    ('datos', 'Qué datos tratamos', li(
        '<b>Cuenta:</b> correo electrónico y, si lo das, tu nombre.',
        '<b>Tu negocio:</b> nombre, giro, logo, colores, sucursales (dirección y ubicación) y los nombres de tu equipo (su PIN se guarda cifrado de forma irreversible).',
        '<b>Suscripción:</b> plan, monto, fechas y estado de tus pagos. Los datos de tu tarjeta los procesa Stripe; Vorka no los recibe.',
        '<b>Uso y seguridad:</b> bitácora de acciones y una huella cifrada e irreversible de tu dirección IP para limitar intentos repetidos.') + '<p>No pedimos datos personales sensibles.</p>'),
    ('finalidades', 'Para qué los usamos', '<p><b>Finalidades necesarias:</b> crear y mantener tu cuenta; prestar el servicio; cobrar tu suscripción y emitir facturas; enviarte correos de tu cuenta (accesos, avisos de cobro, reportes de tu programa); darte soporte y cumplir obligaciones legales; mantener la seguridad y obtener estadísticas agregadas que no te identifican. <b>Finalidad opcional:</b> enviarte novedades de Vorka México. Puedes negarte escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> sin que eso afecte tu servicio.</p>'),
    ('compartir', 'Con quién los compartimos', '<p>No vendemos ni rentamos tus datos. Usamos proveedores que los tratan solo por nuestra cuenta: <b>Cloudflare</b> (alojamiento, base de datos e imágenes), <b>Stripe</b> (cobro de la suscripción), <b>Amazon Web Services</b> (Amazon SES), <b>Resend</b> y <b>Brevo</b> (correos), y <b>Apple</b> y <b>Google</b> (tarjetas en Wallet), algunos con servidores fuera de México. Tu nombre comercial, logo y la información de tu programa se muestran a tus clientes en sus tarjetas.</p>'),
    ('arco', 'Tus derechos ARCO', '<p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, y revocar tu consentimiento. Mucho lo haces desde tu cuenta. Para lo demás, escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con:</p>' + ARCO + ARCO_PLAZOS),
    ('conservacion', 'Cuánto tiempo los conservamos', li('Cuenta y programa: mientras uses Vuelve y hasta 90 días después del fin de tu último periodo.', 'Suscripción y facturación: durante los plazos fiscales (al menos 5 años).', 'Huellas de IP: se borran a más tardar 2 días después.')),
    ('cookies', 'Cookies', '<p>La app usa una sola cookie necesaria (<code>vvu</code>) para mantener tu sesión. Las páginas de registro y las tarjetas de tus clientes no usan cookies de rastreo.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>Publicaremos cualquier cambio en esta página con su fecha y, si es relevante, te avisaremos por correo antes de que aplique.</p>'),
]

# Cuentas (registro de préstamos personales por suscripción, en cuentas.vorka.mx). Mismas bases que Vuelve (LFPDPPP 2025,
# LFPC: renovación automática informada y cancelación por el mismo medio). Aquí además: no es entidad financiera. Debe revisarlo un abogado.
MIGAS_CUENTAS = '<a href="/tienda/">Tienda</a><span>/</span><a href="/tienda/cuentas/">Cuentas</a>'
CUENTAS = [
    ('quien', 'Quién presta el servicio', f'<p>Cuentas es una herramienta de software para llevar el registro de préstamos personales entre familiares, amigos y personas de confianza (lo que se entregó, los abonos, los intereses pactados y el saldo), desarrollada y prestada por {RESPONSABLE} (en adelante, “Vorka”), con domicilio en {DOMICILIO}. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p><p>Estas condiciones son el contrato entre Vorka y la persona que usa Cuentas (“tú”). Al crear tu cuenta o suscribirte las aceptas, junto con los <a href="/legal/terminos/">términos de la tienda</a> y el <a href="/legal/cuentas/privacidad/">aviso de privacidad de Cuentas</a>.</p>'),
    ('no-es', 'Qué es y qué no es Cuentas', li(
        'Cuentas <b>solo registra y calcula</b>. No es un banco, una institución financiera ni una plataforma de financiamiento colectivo: no capta ni custodia dinero, no hace transferencias, no otorga créditos, no conecta a quien presta con quien pide prestado y no reporta a burós de crédito.',
        'El dinero se entrega y se paga directamente entre las personas, por sus propios medios. Los movimientos se capturan a mano y su estado (confirmado o por confirmar) es solo para tu control: no es una verificación bancaria.',
        '<b>Cuentas no sustituye un contrato ni asesoría jurídica, fiscal o financiera.</b> Los préstamos, sus intereses y sus obligaciones fiscales son responsabilidad de las partes. Para montos importantes te recomendamos un contrato o pagaré por escrito y consultar a un profesional.')),
    ('prueba', 'Plan gratis y prueba', li(
        'Cuentas es <b>gratis para siempre con 1 préstamo activo</b> (sin archivar, sin eliminar y sin liquidar), con todas sus funciones. No pedimos tarjeta.',
        'Al crear tu cuenta tienes además 7 días naturales para llevar todos los préstamos que quieras. No se te cobra nada al terminar.',
        'Si sin suscripción tienes más de 1 préstamo activo, tu cuenta queda en <b>modo consulta</b>: puedes ver, descargar e imprimir todos tus registros, pero no agregar ni cambiar movimientos. Archiva los que ya terminaron o suscríbete y todo sigue donde lo dejaste.')),
    ('referidos', 'Invita y gana', li(
        'Desde Cuentas › Ajustes tienes un enlace para invitar. Por cada persona que se registre con él y se suscriba por primera vez, te regalamos <b>un mes</b>: si tienes suscripción, como saldo a favor en tu siguiente cobro; si no, como 30 días de acceso completo.',
        'El premio es uno por cada cuenta invitada, no se cambia por dinero y no aplica a cuentas propias ni duplicadas. Podemos retirarlo si detectamos abuso.')),
    ('suscripcion', 'Suscripción, precio y renovación automática', li(
        'El plan es <b>mensual o anual</b>, en pesos mexicanos con IVA incluido. El precio vigente se muestra en <a href="/tienda/cuentas/">vorka.mx/tienda/cuentas</a> antes de pagar.',
        '<b>La suscripción se renueva sola</b> al final de cada periodo (cada mes o cada año, según tu plan) y se cobra a la tarjeta que registraste, a través de Stripe. Vorka nunca recibe los datos de tu tarjeta.',
        'Si un cobro falla, Stripe lo reintenta durante algunos días y te avisamos; mientras tanto tu cuenta sigue funcionando. Si no se logra cobrar, la suscripción se cancela y vuelves al plan gratis.',
        'Si cambiamos el precio, te avisamos por correo al menos 30 días antes y el nuevo precio aplica hasta tu siguiente renovación después de ese aviso.',
        'Si necesitas factura (CFDI), pídela a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con tus datos fiscales dentro del mismo mes del cobro.')),
    ('cancelar', 'Cancelación y reembolsos', li(
        'Cancelas cuando quieras desde Cuentas › Ajustes › Suscripción, sin llamadas ni trámites. Tu cuenta sigue completa hasta el final del periodo que ya pagaste; no se hacen cobros nuevos.',
        'Antes y después de cancelar puedes descargar tus estados de cuenta en PDF y Excel.',
        'Por ser un servicio que se presta de inmediato, no hay reembolsos proporcionales por cancelar a la mitad de un periodo, salvo que una falla atribuible a Cuentas te impida usarlo y no la resolvamos en un plazo razonable; en ese caso te devolvemos la parte proporcional.',
        'Si pagaste un plan anual y cancelas dentro de los 10 días naturales siguientes al cobro, te devolvemos tu dinero completo si lo pides a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.')),
    ('calculos', 'Cálculos y tu información', li(
        'Cuentas calcula con las condiciones que tú capturas: interés simple sobre el saldo pendiente, sin sumar intereses al capital y sin cargos por atraso salvo que los registres como pactados. Cada cálculo se puede revisar en el estado de cuenta.',
        'Revisamos los cálculos con pruebas automáticas, pero los resultados dependen de que los datos capturados sean correctos. Revisa tus registros antes de usarlos para cualquier trámite.',
        'Los intereses y condiciones deben acordarse de forma clara entre las partes y ser razonables. En México, un juez puede reducir intereses que considere excesivos.')),
    ('terceros', 'Datos de las personas que registras', '<p>Al registrar a otra persona (a quien le prestas), declaras que tienes una relación con ella y que usarás sus datos solo para llevar el registro del préstamo. Te pedimos registrar lo mínimo (su nombre y, si quieres, cómo contactarla) y nunca datos bancarios ni sensibles. Cuentas no contacta a esas personas. Si compartes un enlace de solo lectura, quien lo tenga podrá ver ese estado de cuenta hasta que lo desactives.</p>'),
    ('uso', 'Uso aceptable', li(
        'Solo para llevar registros de préstamos lícitos entre personas. No se permite usar Cuentas para cobranza abusiva, amenazas, exhibición pública de deudas, presión a familiares o conocidos, préstamos usurarios ni actividades ilícitas, ni como si fuera una entidad financiera.',
        'Podemos suspender una cuenta que incumpla estas reglas; te avisaremos el motivo. Si la suspensión fue por un error nuestro, te reembolsamos el periodo afectado.')),
    ('disponibilidad', 'Disponibilidad', '<p>Hacemos lo razonable para que Cuentas esté disponible siempre y para proteger tu información, pero puede haber interrupciones por mantenimiento o fallas de terceros. Te recomendamos descargar tus estados de cuenta de vez en cuando.</p>'),
    ('conservacion', 'Qué pasa con tus datos si te vas', '<p>Si cancelas o tu prueba termina sin suscripción, tus registros siguen disponibles en modo consulta durante 12 meses después del fin de tu último periodo, para que puedas descargarlos. Después se borran de forma definitiva, salvo lo que la ley nos obligue a conservar (por ejemplo, tus facturas). Puedes pedir que los borremos antes.</p>'),
    ('cambios', 'Cambios, quejas y ley aplicable', '<p>Si cambiamos estas condiciones, te avisamos por correo y publicamos la versión nueva aquí con su fecha. Si tienes una queja, escríbenos a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>; te respondemos en un máximo de 5 días hábiles. También puedes acudir a la Procuraduría Federal del Consumidor (Profeco). Estas condiciones se rigen por las leyes de México.</p>'),
]

CUENTAS_PRIVACIDAD = [
    ('responsable', 'Quién es el responsable', f'<p>{RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos de las personas que usan Cuentas. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>'),
    ('datos', 'Qué datos tratamos', li(
        '<b>Tu cuenta:</b> correo electrónico y nombre; y de quienes invites a tu cuenta, su correo y nombre.',
        '<b>Tus registros:</b> las personas que registras (nombre y, si los capturas, relación, teléfono, correo y notas), tus préstamos, sus condiciones, movimientos, referencias, comprobantes y contratos que subas, y tus recordatorios.',
        '<b>Suscripción:</b> plan, monto, fechas y estado de tus pagos. Los datos de tu tarjeta los procesa Stripe; Vorka no los recibe.',
        '<b>Uso y seguridad:</b> historial de cambios de tus registros y la dirección IP para limitar intentos repetidos de acceso.') + '<p>No pedimos datos bancarios, contraseñas bancarias ni datos personales sensibles. Te pedimos no capturarlos en notas ni comprobantes.</p>'),
    ('finalidades', 'Para qué los usamos', '<p><b>Finalidades necesarias:</b> crear y mantener tu cuenta; guardar tus registros, calcular saldos y generar estados de cuenta; enviarte códigos de acceso y, si lo activas, recordatorios; cobrar tu suscripción y emitir facturas; darte soporte y cumplir obligaciones legales; mantener la seguridad. <b>Finalidad opcional:</b> enviarte novedades de Vorka México. Puedes negarte escribiendo a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> sin que eso afecte tu servicio.</p><p>Los datos de las personas que registras se tratan <b>solo por tu cuenta</b>, para llevar tu registro: no las contactamos, no los usamos para nada más y no los compartimos.</p>'),
    ('compartir', 'Con quién los compartimos', '<p>No vendemos ni rentamos datos. Usamos proveedores que los tratan solo por nuestra cuenta: <b>Cloudflare</b> (alojamiento, base de datos y archivos), <b>Stripe</b> (cobro de la suscripción) y <b>Resend</b> (correos), algunos con servidores fuera de México. Si compartes un enlace de solo lectura, quien lo tenga verá ese estado de cuenta.</p>'),
    ('arco', 'Tus derechos ARCO', '<p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, y revocar tu consentimiento. Mucho lo haces desde tu cuenta. Para lo demás, escribe a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con:</p>' + ARCO + ARCO_PLAZOS),
    ('conservacion', 'Cuánto tiempo los conservamos', li('Cuenta y registros: mientras uses Cuentas y hasta 12 meses después del fin de tu último periodo.', 'Suscripción y facturación: durante los plazos fiscales (al menos 5 años).', 'Códigos de acceso: se borran a más tardar un día después de vencer.')),
    ('cookies', 'Cookies', '<p>Cuentas usa una sola cookie necesaria (<code>cs</code>) para mantener tu sesión. No usa cookies de rastreo ni publicidad.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>Publicaremos cualquier cambio en esta página con su fecha y, si es relevante, te avisaremos por correo antes de que aplique.</p>'),
]

VUELVE_CLIENTES = [
    ('resumen', 'En pocas palabras', li(
        'Tus datos los usa <b>el negocio</b> donde te registraste para darte tu tarjeta, sumar tus sellos o puntos y darte tus recompensas.',
        'Vorka México presta la plataforma Vuelve y trata tus datos solo para eso. <b>No los vendemos, no los compartimos con otros negocios y no los usamos para publicidad.</b>',
        'Solo recibes promociones si lo aceptaste; puedes dejar de recibirlas cuando quieras desde tu tarjeta.',
        'Puedes borrar tu tarjeta y tus datos desde la propia tarjeta, en cualquier momento.')),
    ('quien', 'Quién trata tus datos', f'<p>El negocio cuyo nombre aparece en tu tarjeta es el <b>responsable</b> de tus datos y decide para qué los usa dentro de su programa de lealtad. {RESPONSABLE} (“Vorka”), con domicilio en {DOMICILIO}, presta la plataforma y trata tus datos <b>por cuenta del negocio</b>; es responsable directa solo de los datos que usa para la seguridad del servicio. Contacto: <a href="mailto:hola@vorka.mx">hola@vorka.mx</a>.</p>'),
    ('datos', 'Qué datos se tratan', li(
        'Los que das al registrarte: nombre, teléfono y, si quieres, tu correo y el día y mes de tu cumpleaños (sin el año).',
        'Tu actividad en el programa: visitas, sellos o puntos, recompensas canjeadas, nivel y, si el negocio lo registra, el monto de tus compras.',
        'Si invitaste a alguien o alguien te invitó con su liga, esa relación (para darles a los dos su premio).',
        'Si agregas tu tarjeta a Apple Wallet o Google Wallet, o activas las notificaciones de tu tarjeta web, los identificadores técnicos que esos servicios generan para enviarte avisos.',
        'Para seguridad: una huella cifrada e irreversible de tu dirección IP.') + '<p>No se piden datos personales sensibles ni datos bancarios.</p>'),
    ('finalidades', 'Para qué se usan', '<p><b>Necesarias:</b> darte tu tarjeta, sumar y canjear tus sellos o puntos, avisarte de tus recompensas, felicitarte en tu cumpleaños con el regalo del negocio, darte el premio de referidos y evitar abusos. <b>Opcionales (solo si las aceptaste):</b> recibir promociones del negocio, avisos de “te extrañamos” y avisos cuando pasas cerca de una sucursal. Puedes revocar este permiso desde tu tarjeta sin perder tus sellos.</p>'),
    ('compartir', 'Con quién se comparten', '<p>Tus datos los ve el negocio y su equipo (al sellar ven tu nombre, nivel y saldo). Vorka usa a Cloudflare (alojamiento), a Amazon Web Services (Amazon SES), Resend y Brevo (correos), y a Apple y Google si agregas tu tarjeta a su Wallet; algunos tienen servidores fuera de México. No se comparten con otros negocios ni con terceros para publicidad.</p>'),
    ('arco', 'Tus derechos', '<p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos y revocar tu consentimiento. Desde tu tarjeta puedes dejar de recibir promociones o borrar tu tarjeta y tus datos. Para lo demás, escribe al negocio o a <a href="mailto:hola@vorka.mx">hola@vorka.mx</a> con el nombre del negocio; se lo haremos llegar y le ayudaremos a atenderlo. Podemos pedirte:</p>' + ARCO + ARCO_PLAZOS),
    ('menores', 'Personas menores de edad', '<p>Si eres menor de edad, regístrate con el conocimiento de tu madre, padre o tutor.</p>'),
    ('conservacion', 'Cuánto tiempo se conservan', '<p>Mientras tengas tu tarjeta y el negocio use Vuelve. Si borras tu tarjeta, tus datos se borran de inmediato (el negocio conserva solo totales sin tu nombre). Si el negocio deja Vuelve, se borran 90 días después. Las huellas de IP se borran a más tardar 2 días después.</p>'),
    ('cambios', 'Cambios a este aviso', '<p>La versión vigente siempre está en esta dirección, enlazada desde cada página de registro y desde tu tarjeta.</p>'),
]

def escribir(ruta, html):
    p = os.path.join(RAIZ, ruta.strip('/'), 'index.html')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    print('·', os.path.relpath(p, RAIZ), f'{len(html) // 1024} KB')

escribir('/legal/terminos/', pagina('/legal/terminos/', 'Términos y condiciones', 'Términos y <span class="metal">condiciones.</span>',
    'Las reglas de compra en la tienda de Vorka México: qué recibes, cómo pagas, cómo se entrega y cómo puedes usar los materiales.', 'Tienda', TERMINOS, actualizado='23 de octubre de 2026'))
escribir('/legal/reembolsos/', pagina('/legal/reembolsos/', 'Política de reembolsos', 'Política de <span class="metal">reembolsos.</span>',
    'Qué pasa si tu archivo llega dañado, si cambiaste de opinión o si ves un cobro que no reconoces.', 'Tienda', REEMBOLSOS, actualizado='22 de octubre de 2026'))
escribir('/legal/creadores/', pagina('/legal/creadores/', 'Términos para creadores', 'Términos para <span class="metal">creadores.</span>',
    'Cómo funciona vender tus productos digitales en la tienda de Vorka México: aprobación, contenido, comisiones, pagos e impuestos.', 'Creadores', CREADORES))
escribir('/legal/brindi/', pagina('/legal/brindi/', 'Condiciones de Brindi', 'Condiciones de <span class="metal">Brindi.</span>',
    'El contrato entre Vorka México y quien usa Brindi: qué incluye cada plan, cómo se entrega, cuánto tiempo está en línea tu invitación y cuándo hay reembolso.', 'Brindi', BRINDI,
    aplica='Aplica a Brindi (invitaciones digitales)', migas=MIGAS_BRINDI, actualizado=ACTUALIZADO_BRINDI))
escribir('/legal/brindi/privacidad/', pagina('/legal/brindi/privacidad/', 'Aviso de privacidad de Brindi', 'Aviso de privacidad de <span class="metal">Brindi.</span>',
    'Qué datos tratamos de las personas que crean invitaciones con Brindi, para qué los usamos y cómo ejercer tus derechos.', 'Brindi · Anfitriones', BRINDI_PRIVACIDAD,
    aplica='Aplica a quien compra o usa Brindi', migas=MIGAS_BRINDI, actualizado=ACTUALIZADO_BRINDI))
escribir('/legal/brindi/privacidad-invitados/', pagina('/legal/brindi/privacidad-invitados/', 'Aviso de privacidad para invitados', 'Aviso de privacidad para <span class="metal">invitados.</span>',
    'Recibiste una invitación hecha con Brindi. Esto es lo que pasa con los datos que das al confirmar tu asistencia.', 'Brindi · Invitados', BRINDI_INVITADOS,
    aplica='Aplica a quien recibe una invitación de Brindi', migas=MIGAS_BRINDI, actualizado=ACTUALIZADO_BRINDI))
escribir('/legal/cupo/', pagina('/legal/cupo/', 'Condiciones de Cupo', 'Condiciones de <span class="metal">Cupo.</span>',
    'El contrato entre Vorka México y quien organiza eventos con Cupo: planes, el cover de tu evento, reembolsos, uso aceptable y datos de tus asistentes.', 'Cupo', CUPO,
    aplica='Aplica a quien organiza eventos con Cupo', migas=MIGAS_CUPO, actualizado=ACTUALIZADO_CUPO))
escribir('/legal/cupo/privacidad/', pagina('/legal/cupo/privacidad/', 'Aviso de privacidad de Cupo', 'Aviso de privacidad de <span class="metal">Cupo.</span>',
    'Qué datos tratamos de las personas que organizan eventos con Cupo, para qué y cómo ejercer tus derechos.', 'Cupo · Organizadores', CUPO_PRIVACIDAD,
    aplica='Aplica a quien organiza eventos con Cupo', migas=MIGAS_CUPO, actualizado=ACTUALIZADO_CUPO))
escribir('/legal/cupo/privacidad-asistentes/', pagina('/legal/cupo/privacidad-asistentes/', 'Aviso de privacidad para asistentes', 'Aviso de privacidad para <span class="metal">asistentes.</span>',
    'Te registraste a un evento en Cupo. Esto es lo que pasa con tus datos.', 'Cupo · Asistentes', CUPO_ASISTENTES,
    aplica='Aplica a quien se registra a un evento de Cupo', migas=MIGAS_CUPO, actualizado=ACTUALIZADO_CUPO))
escribir('/legal/vuelve/', pagina('/legal/vuelve/', 'Condiciones de Vuelve', 'Condiciones de <span class="metal">Vuelve.</span>',
    'El contrato entre Vorka México y el negocio que usa Vuelve: prueba gratis, suscripción con renovación automática, cancelación, tu programa y los datos de tus clientes.', 'Vuelve', VUELVE,
    aplica='Aplica a los negocios que usan Vuelve', migas=MIGAS_VUELVE, actualizado=ACTUALIZADO_VUELVE))
escribir('/legal/vuelve/privacidad/', pagina('/legal/vuelve/privacidad/', 'Aviso de privacidad de Vuelve', 'Aviso de privacidad de <span class="metal">Vuelve.</span>',
    'Qué datos tratamos de los negocios que usan Vuelve, para qué y cómo ejercer tus derechos.', 'Vuelve · Negocios', VUELVE_PRIVACIDAD,
    aplica='Aplica a los negocios que usan Vuelve', migas=MIGAS_VUELVE, actualizado=ACTUALIZADO_VUELVE))
escribir('/legal/vuelve/privacidad-clientes/', pagina('/legal/vuelve/privacidad-clientes/', 'Aviso de privacidad para clientes', 'Aviso de privacidad para <span class="metal">clientes.</span>',
    'Te registraste en el programa de lealtad de un negocio que usa Vuelve. Esto es lo que pasa con tus datos.', 'Vuelve · Clientes', VUELVE_CLIENTES,
    aplica='Aplica a quien tiene una tarjeta de Vuelve', migas=MIGAS_VUELVE, actualizado=ACTUALIZADO_VUELVE))
escribir('/legal/cuentas/', pagina('/legal/cuentas/', 'Condiciones de Cuentas', 'Condiciones de <span class="metal">Cuentas.</span>',
    'El contrato entre Vorka México y quien usa Cuentas para llevar sus préstamos personales: qué es y qué no es, plan gratis, suscripción mensual o anual con renovación automática, invita y gana, cancelación y datos.', 'Cuentas', CUENTAS,
    aplica='Aplica a quien usa cuentas.vorka.mx', migas=MIGAS_CUENTAS, actualizado=ACTUALIZADO_CUENTAS))
escribir('/legal/cuentas/privacidad/', pagina('/legal/cuentas/privacidad/', 'Aviso de privacidad de Cuentas', 'Aviso de privacidad de <span class="metal">Cuentas.</span>',
    'Qué datos tratamos de las personas que usan Cuentas y de quienes registran en ella, para qué y cómo ejercer tus derechos.', 'Cuentas', CUENTAS_PRIVACIDAD,
    aplica='Aplica a quien usa cuentas.vorka.mx', migas=MIGAS_CUENTAS, actualizado=ACTUALIZADO_CUENTAS))
