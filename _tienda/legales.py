# Vorka México · páginas legales de la tienda: /legal/terminos/ y /legal/reembolsos/
# Uso: python3 _tienda/legales.py   (desde la raíz del repo). Mismo diseño que /privacidad.
# BORRADOR: revisar con abogado antes de vender en producción.
import os, re, sys
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, '_sitio'))
from partes import cabeza, nav, pie, v_metal

ACTUALIZADO = '15 de octubre de 2026'
RESPONSABLE = 'Brandon Oleynick Hernández, persona física que opera bajo el nombre comercial Vorka México'
DOMICILIO = 'Nuevo León #305, Col. Alameda, C.P. 38050, Celaya, Guanajuato, México'

# Reutiliza los estilos del aviso de privacidad (índice lateral, apartados numerados)
privacidad = open(os.path.join(RAIZ, 'privacidad', 'index.html'), encoding='utf-8').read()
ESTILO = re.search(r'<style>.*?</style>', privacidad, re.S).group(0)

BORRADOR = '<p class="borrador" role="note"><b>BORRADOR – revisar con abogado.</b> Este texto es una base de trabajo y aún no es la versión definitiva.</p>'
ESTILO_BORRADOR = '<style>.borrador{margin:0 0 28px;padding:14px 18px;border-radius:14px;background:#FBF5E8;border:1px solid #E6CF96;font-size:15px;color:#6f5420}</style>'

def pagina(ruta, titulo, titulo_html, lead, etiqueta, apartados):
    indice = ''.join(f'<li><a href="#{a}"><span>{i:02d}</span>{t}</a></li>' for i, (a, t, _) in enumerate(apartados, 1))
    cuerpo = ''.join(f'<section class="apartado" id="{a}"><h2><span class="n">{i:02d}</span>{t}</h2>{html}</section>' for i, (a, t, html) in enumerate(apartados, 1))
    return (cabeza(f'{titulo} · Vorka México', lead, ruta, extra=ESTILO + ESTILO_BORRADOR) + nav() + f'''<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gl', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/tienda/">Tienda</a><span>/</span><span>{titulo}</span></div>
    <span class="etiqueta">{etiqueta}</span>
    <h1 class="h1" style="margin-top:18px">{titulo_html}</h1>
    <p class="lead">{lead}</p>
    <div class="vigencia"><span>Última actualización: {ACTUALIZADO}</span><span>Aplica a vorka.mx/tienda</span></div>
  </div>
</section>
<section class="sec pegada">
  <div class="marco priv">
    <nav aria-label="Contenido"><b>Contenido</b><ol>{indice}</ol></nav>
    <div class="texto-aviso">{BORRADOR}{cuerpo}</div>
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

def escribir(ruta, html):
    p = os.path.join(RAIZ, ruta.strip('/'), 'index.html')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    print('·', os.path.relpath(p, RAIZ), f'{len(html) // 1024} KB')

escribir('/legal/terminos/', pagina('/legal/terminos/', 'Términos y condiciones', 'Términos y <span class="metal">condiciones.</span>',
    'Las reglas de compra en la tienda de Vorka México: qué recibes, cómo pagas, cómo se entrega y cómo puedes usar los materiales.', 'Tienda', TERMINOS))
escribir('/legal/reembolsos/', pagina('/legal/reembolsos/', 'Política de reembolsos', 'Política de <span class="metal">reembolsos.</span>',
    'Qué pasa si tu archivo llega dañado, si cambiaste de opinión o si ves un cobro que no reconoces.', 'Tienda', REEMBOLSOS))
escribir('/legal/creadores/', pagina('/legal/creadores/', 'Términos para creadores', 'Términos para <span class="metal">creadores.</span>',
    'Cómo funciona vender tus productos digitales en la tienda de Vorka México: aprobación, contenido, comisiones, pagos e impuestos.', 'Creadores', CREADORES))
