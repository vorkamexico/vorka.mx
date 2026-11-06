# Vorka México · páginas institucionales: /nosotros/ (Acerca de) y /contacto/
# Solo usan información que ya está publicada en el sitio (inicio, servicios, datos.py, equipo, llms.txt,
# aviso de privacidad, tienda y Vorka Learn). Si cambia algo aquí, cámbialo también en su fuente.
import json
from partes import *
from datos import SERVICIOS, FASES

TELEFONO = '+52 81 1780 4869'
SOBRE = ico('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>')
CIUDADES = ['Monterrey', 'Ciudad de México', 'Guadalajara', 'Querétaro', 'Celaya']

# La misma organización en todas las páginas (el inicio usa este @id)
ORG_ID = SITIO + '/#organizacion'
def organizacion():
    return {
        '@type': 'ProfessionalService', '@id': ORG_ID, 'name': 'Vorka México', 'url': SITIO + '/', 'logo': SITIO + '/vorka-logo.png',
        'description': 'Consultora de estrategia, liderazgo e influencia con alcance nacional.',
        'email': CORREO, 'telephone': TELEFONO, 'areaServed': 'MX', 'sameAs': [u for _, u, _ in REDES],
        'founder': {'@type': 'Person', 'name': 'Brandon Oleynick', 'url': SITIO + '/oleynickhdz/', 'jobTitle': 'Fundador y CEO'},
        'contactPoint': [{'@type': 'ContactPoint', 'contactType': 'customer support', 'email': CORREO, 'telephone': TELEFONO,
                          'areaServed': 'MX', 'availableLanguage': 'es', 'url': SITIO + '/contacto/'}],
        'subOrganization': [{'@type': 'Organization', 'name': 'Vorka Learn', 'url': SITIO + '/learn/'}],
    }

def _ld(*objs):
    return ''.join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n' for o in objs)

def _migas(nombre, ruta):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITIO + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': nombre, 'item': SITIO + ruta}]}

# Complementos sobre el sistema v3 (mismo criterio que /privacidad/: estilos de la página, no del sitio)
ESTILOS = '''<style>
.ac-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.ac-grid.tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ac-c { padding: 28px; border-radius: var(--r); background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; min-width: 0; overflow-wrap: anywhere; }
.ac-c .ic { width: 44px; height: 44px; border-radius: 14px; background: var(--bg-2); display: grid; place-items: center; }
.ac-c .ic svg { width: 22px; height: 22px; }
.ac-c p, .ac-c li { color: var(--fg-2); font-size: 15.5px; line-height: 1.6; }
.ac-c p b, .ac-c li b { color: var(--fg); font-weight: 650; }
.ac-c ul { display: grid; gap: 8px; }
.ac-c li { display: flex; gap: 12px; }
.ac-c li::before { content: ""; flex: none; width: 4px; height: 12px; margin-top: 7px; border-radius: 1px; background: var(--oro); transform: skewX(var(--skew)); }
.ac-c a:not(.btn):not(.flecha) { color: var(--morado); font-weight: 600; }
.ac-c .ligas { margin-top: auto; padding-top: 14px; display: flex; flex-wrap: wrap; gap: 8px 20px; }
.ac-c .dato { font-size: clamp(20px, 2vw, 24px); font-weight: 720; letter-spacing: -.03em; color: var(--fg); }
.ac-c .btn { align-self: flex-start; margin-top: auto; }
.ac-pasos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.ac-pasos div { padding: 22px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); }
.ac-pasos small { font-size: 13px; font-weight: 700; color: var(--morado); }
.ac-pasos h3 { font-size: 18px; font-weight: 700; letter-spacing: -.02em; margin: 6px 0; }
.ac-pasos p { color: var(--fg-2); font-size: 15px; line-height: 1.55; }
.ac-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.ac-chips span { display: inline-flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 600; padding: 9px 14px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); }
.ac-chips svg { width: 16px; height: 16px; color: var(--morado); }
.ac-ligas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.ac-ligas a { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-radius: 18px; background: var(--card); border: 1px solid var(--line); text-decoration: none; font-weight: 650; transition: border-color .2s, transform .2s var(--ease); }
.ac-ligas a small { display: block; font-size: 13.5px; font-weight: 500; color: var(--fg-2); margin-top: 2px; }
.ac-ligas a svg { width: 18px; height: 18px; flex: none; }
.ac-ligas a:hover { border-color: var(--line-2); transform: translateY(-2px); }
.ac-redes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.ac-redes a { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-radius: 18px; background: var(--card); border: 1px solid var(--line); text-decoration: none; font-weight: 650; min-width: 0; }
.ac-redes a small { display: block; font-size: 13px; font-weight: 500; color: var(--fg-2); overflow-wrap: anywhere; }
.ac-redes svg { width: 22px; height: 22px; flex: none; }
.ac-nota { margin-top: 18px; font-size: 14.5px; color: var(--fg-2); max-width: 760px; }
.ac-nota a { color: var(--morado); font-weight: 600; }
@media (max-width: 960px) { .ac-grid.tres, .ac-ligas { grid-template-columns: 1fr 1fr; } .ac-pasos, .ac-redes { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .ac-grid, .ac-grid.tres, .ac-ligas, .ac-pasos, .ac-redes { grid-template-columns: minmax(0, 1fr); } .ac-c { padding: 22px; } }
</style>
'''

def _ligas(*pares):
    return '<div class="ligas">' + ''.join(f'<a class="flecha" href="{h}">{t} {FLECHA}</a>' for h, t in pares) + '</div>'

def _tarjeta(icono, titulo, cuerpo, ligas=''):
    return f'<article class="ac-c rv"><span class="ic">{ICONOS[icono]}</span><h3 class="h3" style="font-size:22px">{titulo}</h3>{cuerpo}{ligas}</article>'

# ---------------------------------------------------------------- /nosotros/
def pagina_nosotros():
    servicios = ''.join(f'<li><span><a href="/servicios/{s["slug"]}/">{s["area"]}</a>: {e(s["corta"])}</span></li>' for s in SERVICIOS)
    que_hacemos = ''.join([
        _tarjeta('brujula', 'Consultoría', f'<p>Cuatro servicios, piezas de una misma solución integral, bajo una sola dirección estratégica:</p><ul>{servicios}</ul>'
                 '<p>Todo empieza con un <b>diagnóstico estratégico de 20 minutos sin costo</b>.</p>',
                 _ligas(('/servicios/', 'Ver servicios'), ('/agenda/', 'Agenda tu diagnóstico'))),
        _tarjeta('doc', 'Vorka Learn', '<p>La sección de guías de Vorka México: lo que conviene saber antes de presentar un examen de admisión (qué viene, cómo se califica y cómo estudiar), cómo elegir carrera y pedir una beca, finanzas personales, negocio pequeño y cómo crear y vender tu propia app.</p>'
                 '<p>Cada dato sale de la institución que lo publica y lo citamos al final de cada guía. Las guías son informativas: no estamos afiliados a las instituciones que aplican esos exámenes.</p>'
                 '<p>En Vorka Learn se muestran anuncios de Google AdSense; lo explicamos en nuestro <a href="/privacidad/">aviso de privacidad</a>.</p>',
                 _ligas(('/learn/', 'Ir a Vorka Learn'))),
        _tarjeta('rayo', 'Tienda de herramientas digitales', '<p>Productos digitales con entrega inmediata:</p><ul>'
                 '<li><span>Simuladores en línea de examen de admisión: <a href="/simulador-paa/">PAA</a>, <a href="/simulador-unam/">UNAM</a>, <a href="/simulador-ipn/">IPN</a>, <a href="/simulador-ecoems/">ECOEMS</a> y <a href="/simulador-prepa-ug/">prepa UG (EXANI-I)</a>.</span></li>'
                 '<li><span>Invitaciones digitales con QR (<a href="/tienda/brindi/">Brindi</a>) y eventos con registro (<a href="/tienda/cupo/">Cupo</a>).</span></li>'
                 '<li><span>Apps para negocios: <a href="/tienda/agenda/">Agenda</a>, <a href="/tienda/vuelve/">Vuelve</a>, <a href="/tienda/vende/">Vende</a> y <a href="/tienda/cuentas/">Cuentas</a>.</span></li>'
                 '<li><span>El curso <a href="/tienda/ruta-de-impacto/">Ruta de Impacto</a> y kits para emprender.</span></li></ul>',
                 _ligas(('/tienda/', 'Ver la tienda'))),
        _tarjeta('megafono', 'Revista Sparks', '<p>Nuestro medio propio: historias de las personas, proyectos y organizaciones que están moviendo su municipio, y lo que pensamos sobre decisiones, poder y liderazgo en México.</p>'
                 '<p>La primera edición local es <a href="/sparks/celaya/">Sparks Celaya</a>, con historias y noticias de Celaya, Guanajuato.</p>',
                 _ligas(('/sparks/', 'Leer Sparks'), ('/sparks/sumate/', 'Súmate'))),
    ])
    comunidad = _tarjeta('personas', 'Comunidad', '<ul><li><span><a href="/voluntariado">Tú en Vorka</a>: voluntariado para jóvenes de 16 a 29 años, presencial en el Bajío y remoto desde todo México.</span></li>'
                         '<li><span><a href="/fc/">Vorka FC</a>: academia de fútbol para niñas y niños de 6 a 10 años en Celaya.</span></li></ul>')
    # Las mismas cuatro fases del inicio y de /servicios/ (datos.FASES)
    pasos_html = ''.join(f'<div class="rv" style="--d:{i * .06}s"><small>0{i + 1}</small><h3>{t}</h3><p>{d}</p></div>' for i, (t, d, _) in enumerate(FASES))
    chips = ''.join(f'<span>{ICONOS["pin"]}{c}</span>' for c in CIUDADES)
    ligas = [('/servicios/', 'Servicios', 'Consultoría y diagnóstico'), ('/learn/', 'Vorka Learn', 'Guías de admisión, dinero y negocio'),
             ('/tienda/', 'Tienda', 'Herramientas digitales'), ('/sparks/', 'Revista Sparks', 'Historias de quienes mueven su municipio'),
             ('/privacidad/', 'Aviso de privacidad', 'Tus datos y tus derechos'), ('/contacto/', 'Contacto', 'Correo, WhatsApp y redes')]
    ligas_html = ''.join(f'<a href="{h}"><span>{t}<small>{d}</small></span>{FLECHA}</a>' for h, t, d in ligas)
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gh', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Acerca de</span></div>
    <span class="etiqueta">Acerca de Vorka México</span>
    <h1 class="h1" style="margin-top:18px">Quiénes somos y <span class="metal">qué hacemos.</span></h1>
    <p class="lead">Vorka México es una consultora de estrategia, liderazgo e influencia con alcance nacional. Acompañamos a líderes, empresas, gobiernos y organizaciones en decisiones de dirección, en el desarrollo de quienes deciden y en su comunicación pública.</p>
    <div class="botones"><a class="btn tinta" href="/servicios/">Ver servicios {FLECHA}</a><a class="btn blanco" href="/contacto/">Contacto</a></div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-que">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Qué hacemos</span><h2 class="h2" id="t-que">Consultoría, guías, herramientas <span class="metal">y un medio propio.</span></h2></div>
      <p class="lead">Además de la consultoría, Vorka México publica guías en Vorka Learn, vende herramientas digitales en su tienda y cuenta historias en la Revista Sparks.</p></div>
    <div class="ac-grid">{que_hacemos}</div>
    <div class="ac-grid" style="grid-template-columns:minmax(0,1fr);margin-top:14px">{comunidad}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-como">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Cómo trabajamos</span><h2 class="h2" id="t-como">Cuatro <span class="metal">fases.</span></h2>
      <p class="lead">Diagnóstico antes de proponer, diseño antes de ejecutar, medición antes de cerrar.</p></div>
    <div class="ac-pasos">{pasos_html}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-quien">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Dónde estamos y quién nos dirige</span><h2 class="h2" id="t-quien">Bases en cinco ciudades, <span class="metal">alcance nacional.</span></h2></div>
    <div class="ac-grid">
      <article class="ac-c rv"><span class="ic">{ICONOS['globo']}</span><h3 class="h3" style="font-size:22px">Dónde estamos</h3>
        <p>Tenemos bases en Monterrey, Ciudad de México, Guadalajara, Querétaro y Celaya, y con aliados locales trabajamos en toda la República, de forma presencial o a distancia.</p>
        <div class="ac-chips" style="margin-top:4px">{chips}</div></article>
      <article class="ac-c rv"><span class="ic">{ICONOS['personas']}</span><h3 class="h3" style="font-size:22px">Quién nos dirige</h3>
        <p><a href="/oleynickhdz/">Brandon Oleynick</a> es fundador y CEO de Vorka México. También es líder social juvenil, conferencista y fundador de Juventudes Impactando México A.C. (<a href="https://soyimpacto.org/" target="_blank" rel="noopener">IMPACTO</a>).</p>
        <p><a href="/ximepastor/">Ximena Pastor</a> es Directora Estatal de Vorka Sparks.</p>
        <p>Responsable del sitio y del tratamiento de datos: Brandon Oleynick Hernández, persona física que opera bajo el nombre comercial VORKA México. Los detalles están en el <a href="/privacidad/">aviso de privacidad</a>.</p></article>
    </div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-mas">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Conoce más</span><h2 class="h2" id="t-mas">Todo Vorka, <span class="metal">a un clic.</span></h2></div>
    <div class="ac-ligas rv">{ligas_html}</div>
  </div>
</section>
{cierre()}
</main>
{pie()}'''
    pagina = {'@context': 'https://schema.org', '@type': 'AboutPage', '@id': SITIO + '/nosotros/#pagina', 'url': SITIO + '/nosotros/', 'name': 'Acerca de Vorka México',
              'inLanguage': 'es-MX', 'isPartOf': {'@type': 'WebSite', 'name': 'Vorka México', 'url': SITIO + '/'}, 'mainEntity': organizacion(), 'about': {'@id': ORG_ID}}
    extra = ESTILOS + _ld(pagina, _migas('Acerca de', '/nosotros/'))
    return cabeza('Acerca de Vorka México · Quiénes somos', 'Qué es Vorka México: consultora de estrategia, liderazgo e influencia con bases en Monterrey, CDMX, Guadalajara, Querétaro y Celaya. También publica Vorka Learn, la tienda de herramientas digitales y la Revista Sparks.', '/nosotros/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- /contacto/
def pagina_contacto():
    wa_general = wa('Hola Vorka, tengo una pregunta.')
    wa_compra = wa('Hola Vorka, hice una compra en la tienda y no me llegó el correo.')
    canales = ''.join([
        f'<article class="ac-c rv"><span class="ic">{SOBRE}</span><h3 class="h3" style="font-size:22px">Correo</h3>'
        f'<p class="dato">{CORREO}</p><p>Para cualquier tema: consultoría, compras de la tienda, Vorka Learn, Revista Sparks o tus datos personales.</p>'
        f'<a class="btn tinta chico" href="mailto:{CORREO}">Escribir un correo {FLECHA}</a></article>',
        f'<article class="ac-c rv" style="--d:.06s"><span class="ic">{ICONOS["voz"]}</span><h3 class="h3" style="font-size:22px">WhatsApp</h3>'
        f'<p class="dato">{TELEFONO}</p><p>Escríbenos por WhatsApp si prefieres una conversación rápida.</p>'
        f'<a class="btn tinta chico" href="{wa_general}" target="_blank" rel="noopener">Abrir WhatsApp {FLECHA}</a></article>',
        f'<article class="ac-c rv" style="--d:.12s"><span class="ic">{ICONOS["cal"]}</span><h3 class="h3" style="font-size:22px">Consultoría</h3>'
        f'<p class="dato">Diagnóstico sin costo</p><p>Si buscas a Vorka para tu empresa, gobierno u organización, agenda un diagnóstico estratégico de 20 minutos sin costo ni compromiso.</p>'
        f'<a class="btn tinta chico" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a></article>',
    ])
    compras = ''.join([
        _tarjeta('doc', '¿No te llegó el correo de tu compra?',
                 '<p>Pide un enlace nuevo en <a href="/descargas/reenviar">Recupera tus archivos</a>: escribe el correo con el que compraste y te mandamos un enlace nuevo, válido por 7 días.</p>'
                 f'<p>¿No te llega nada o ya no tienes acceso a ese correo? Escríbenos a <a href="mailto:{CORREO}">{CORREO}</a> o por <a href="{wa_compra}" target="_blank" rel="noopener">WhatsApp</a> con tu nombre y la fecha de compra, y lo resolvemos.</p>',
                 _ligas(('/descargas/reenviar', 'Recuperar mis archivos'), ('/descargas/reenviar?para=simulador', 'Entrar a mi Simulador PAA'))),
        _tarjeta('candado', 'Reembolsos y condiciones',
                 '<p>Qué cubre cada compra, cómo pedir un reembolso y en qué plazos.</p>',
                 _ligas(('/legal/reembolsos/', 'Política de reembolsos'), ('/legal/terminos/', 'Términos y condiciones'))),
    ])
    otros = ''.join([
        _tarjeta('ojo', 'Tus datos personales', '<p>Para acceder, rectificar, cancelar u oponerte al uso de tus datos (derechos ARCO), o para revocar tu consentimiento, escríbenos a '
                 f'<a href="mailto:{CORREO}">{CORREO}</a>. El procedimiento está en el aviso de privacidad.</p>', _ligas(('/privacidad/#arco', 'Derechos ARCO'), ('/privacidad/', 'Aviso de privacidad'))),
        _tarjeta('megafono', 'Revista Sparks', '<p>¿Conoces a alguien que está moviendo su municipio, o quieres escribir para Sparks?</p>',
                 _ligas(('https://os.vorka.mx/historia', 'Cuenta tu historia'), ('/sparks/sumate/', 'Súmate a Sparks'))),
        _tarjeta('personas', 'Comunidad y conferencias', '<p>Voluntariado para jóvenes, la academia Vorka FC en Celaya y conferencias de Brandon Oleynick.</p>',
                 _ligas(('/voluntariado', 'Tú en Vorka'), ('/fc/#inscripcion', 'Vorka FC'), ('/oleynickhdz/conferencias/solicitar/', 'Conferencias'))),
    ])
    usuarios = {'Instagram': '@vorka.mx', 'LinkedIn': 'vorkamx', 'Facebook': 'vorka.mx', 'TikTok': '@vorka.mx'}
    redes = ''.join(f'<a href="{u}" target="_blank" rel="noopener">{s}<span>{n}<small>{usuarios.get(n, "")}</small></span></a>' for n, u, s in REDES)
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gh', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Contacto</span></div>
    <span class="etiqueta">Contacto</span>
    <h1 class="h1" style="margin-top:18px">Escríbenos. <span class="metal">Te respondemos.</span></h1>
    <p class="lead">Estas son todas las formas de contactar a Vorka México: correo, WhatsApp y nuestras redes oficiales. Si tu duda es sobre una compra de la tienda, abajo está qué hacer.</p>
  </div>
</section>

<section class="sec pegada" aria-label="Canales de contacto">
  <div class="marco"><div class="ac-grid tres">{canales}</div></div>
</section>

<section class="sec pegada" aria-labelledby="t-compras">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Compras de la tienda</span><h2 class="h2" id="t-compras">Ayuda con <span class="metal">tu compra.</span></h2></div>
    <div class="ac-grid">{compras}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-otros">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Otros temas</span><h2 class="h2" id="t-otros">¿Buscas <span class="metal">otra cosa?</span></h2></div>
    <div class="ac-grid tres">{otros}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-redes">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Redes oficiales</span><h2 class="h2" id="t-redes">Síguenos.</h2></div>
    <div class="ac-redes rv">{redes}</div>
    <p class="ac-nota">Son las cuentas oficiales que enlazamos en todo el sitio. ¿Quieres saber más de nosotros? Lee <a href="/nosotros/">Acerca de Vorka México</a>.</p>
  </div>
</section>
<div style="height:clamp(64px,8vw,110px)"></div>
</main>
{pie()}'''
    pagina = {'@context': 'https://schema.org', '@type': 'ContactPage', '@id': SITIO + '/contacto/#pagina', 'url': SITIO + '/contacto/', 'name': 'Contacto · Vorka México',
              'inLanguage': 'es-MX', 'isPartOf': {'@type': 'WebSite', 'name': 'Vorka México', 'url': SITIO + '/'}, 'mainEntity': organizacion()}
    extra = ESTILOS + _ld(pagina, _migas('Contacto', '/contacto/'))
    return cabeza('Contacto · Vorka México', 'Contacta a Vorka México: correo hola@vorka.mx, WhatsApp +52 81 1780 4869 y redes oficiales. Ayuda con compras de la tienda y con tus datos personales.', '/contacto/', extra=extra) + cuerpo + '\n</body>\n</html>\n'
