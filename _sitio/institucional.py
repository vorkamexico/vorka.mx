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
# Estilo del portafolio y del kit de Sparks: portada con collage de fotos reales, títulos en letra delgada con la parte dorada en negrita
# (.pf-mix), cinta de trabajos que corre, lo que hacemos como lista grande con flecha (assets/v3/estudio.css), personas con su foto
# y ciudades con foto. Sin pasos numerados ni cifras inventadas: todo sale de lo que ya está publicado en el sitio.
ESTILOS_NOS = """<style>
.ns-collage { position: relative; aspect-ratio: 1 / .92; }
.ns-collage img { position: absolute; height: auto; object-fit: cover; border-radius: 18px; box-shadow: 0 30px 60px -24px rgba(15, 13, 16, .45), 0 2px 6px rgba(15, 13, 16, .08); animation: pf-flota 7s ease-in-out infinite; }
.ns-collage .c1 { width: 44%; left: 4%; top: 0; aspect-ratio: 3 / 4; transform: rotate(-4deg); }
.ns-collage .c2 { width: 58%; right: 0; top: 16%; aspect-ratio: 4 / 3; z-index: 2; animation-delay: -2.4s; }
.ns-collage .c3 { width: 46%; left: 16%; bottom: 0; aspect-ratio: 4 / 3; z-index: 3; transform: rotate(3deg); animation-delay: -4.6s; }
.ns-tarjeta { position: absolute; right: 4%; bottom: 6%; z-index: 4; padding: 14px 16px; border-radius: 16px; background: var(--card, #fff); box-shadow: 0 24px 50px -20px rgba(15, 13, 16, .45); display: grid; gap: 4px; animation: pf-flota 7s ease-in-out infinite; animation-delay: -1.2s; }
.ns-tarjeta small { font-size: 12px; color: var(--fg-3); font-weight: 650; }
.ns-tarjeta b { font-size: 15px; letter-spacing: -.01em; }
.ns-hace { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.ns-hace div { padding: 22px 0 0; border-top: 1.5px solid var(--fg); }
.ns-hace h3 { margin: 0 0 8px; font-size: 20px; letter-spacing: -.02em; }
.ns-hace p { margin: 0; color: var(--fg-2); font-size: 15px; line-height: 1.55; }
.ns-gente { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.ns-persona { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); border-radius: 24px; overflow: hidden; background: var(--card); border: 1px solid var(--line); }
.ns-persona img { width: 100%; height: 100%; min-height: 320px; object-fit: cover; object-position: top; display: block; }
.ns-persona div { padding: 26px; display: grid; align-content: start; gap: 10px; }
.ns-persona small { color: var(--fg-3); font-weight: 650; font-size: 13px; }
.ns-persona h3 { margin: 0; font-size: 24px; letter-spacing: -.03em; }
.ns-persona p { margin: 0; color: var(--fg-2); font-size: 15.5px; line-height: 1.55; }
.ns-persona a { color: var(--morado); font-weight: 600; }
.ns-persona a svg { width: 15px; height: 15px; vertical-align: -2px; }
.ns-persona p a:only-child { white-space: nowrap; }
.ns-ciudades { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.ns-ciudad { position: relative; aspect-ratio: 3 / 4; border-radius: 20px; overflow: hidden; background: var(--noche); }
.ns-ciudad img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .7s var(--ease); }
.ns-ciudad:hover img { transform: scale(1.05); }
.ns-ciudad b { position: absolute; left: 16px; right: 16px; bottom: 14px; color: #fff; font-size: 18px; letter-spacing: -.02em; text-shadow: 0 2px 14px rgba(0, 0, 0, .5); }
.ns-ciudad::after { content: ""; position: absolute; inset: 50% 0 0; background: linear-gradient(transparent, rgba(0, 0, 0, .55)); }
.ns-ciudad b { z-index: 1; }
.ns-legal { margin-top: 22px; font-size: 14.5px; color: var(--fg-2); max-width: 820px; }
.ns-legal a { color: var(--morado); font-weight: 600; }
@media (max-width: 960px) { .ns-collage { max-width: 520px; width: 100%; margin: 0 auto; } .ns-hace { grid-template-columns: 1fr 1fr; } .ns-gente { grid-template-columns: minmax(0, 1fr); } .ns-ciudades { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ns-persona { grid-template-columns: minmax(0, 1fr); } .ns-persona img { min-height: 0; aspect-ratio: 4 / 3; } .ns-ciudades { grid-template-columns: 1fr 1fr; } .ns-hace { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { .ns-collage img, .ns-tarjeta { animation: none; } }
</style>
"""
# Lo que hacemos: (liga, nombre, qué es)
HACEMOS = [('/servicios/', 'Consultoría', 'Estrategia y dirección, liderazgo y talento, comunicación e influencia, y apps y páginas a la medida, bajo una sola dirección. Empieza con un diagnóstico de 20 minutos sin costo.'),
           ('/sparks/', 'Revista Sparks', 'Nuestro medio propio: las historias de jóvenes, proyectos y organizaciones que están moviendo su municipio.'),
           ('/learn/', 'Vorka Learn', 'Guías para tu examen de admisión, tu carrera, tus becas, tu dinero y tu negocio, con la fuente de cada dato.'),
           ('/tienda/', 'Tienda de herramientas digitales', 'Simuladores de examen, invitaciones con QR, eventos con registro y apps para negocios como Agenda, Vuelve y Vende.'),
           ('/voluntariado', 'Tú en Vorka', 'Voluntariado para jóvenes de 16 a 29 años, presencial en el Bajío y remoto desde todo México.'),
           ('/fc/', 'Vorka FC', 'Academia de fútbol para niñas y niños de 6 a 10 años en Celaya.')]
CINTA_NOS = ['/img/portafolio/inmobiliaria.webp', '/sparks/anunciate/img/premio.webp', '/img/portafolio/tel-alimentos.webp', '/img/trabajo/mentoria-800.webp',
             '/sparks/anunciate/img/grupo.webp', '/img/portafolio/mercado.webp', '/img/trabajo/tuenvorka-800.webp', '/img/portafolio/tel-seguros.webp']
CIUDADES_FOTO = [('Monterrey', 'monterrey-skyline'), ('Ciudad de México', 'cdmx-reforma'), ('Guadalajara', 'guadalajara'), ('Querétaro', 'queretaro'), ('Celaya', 'celaya')]

def pagina_nosotros():
    flecha = ico('<path d="M5 12h14M13 6l6 6-6 6"/>', 1.6)
    hacemos = ''.join(f'<a class="est-fila rv" style="--d:{i * .05}s" href="{h}"><span><b>{e(n)}</b><span>{e(d)}</span></span>{flecha}</a>' for i, (h, n, d) in enumerate(HACEMOS))
    cinta = ''.join(f'<figure><img src="{f}" alt="" loading="eager" decoding="async"></figure>' for f in CINTA_NOS * 2)
    fases = ''.join(f'<div class="rv" style="--d:{i * .06}s"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d, _) in enumerate(FASES))
    ciudades = ''.join(f'<div class="ns-ciudad rv" style="--d:{i * .05}s"><img src="/img/ciudades/{f}-960.webp" alt="{e(c)}" loading="lazy" decoding="async"><b>{e(c)}</b></div>' for i, (c, f) in enumerate(CIUDADES_FOTO))
    cuerpo = f"""{nav()}
<main id="contenido" class="pf-mix">
<section class="cabecera pf-cab">
  <div class="marco pf-cab-in">
    <div class="pf-cab-tx">
      <div class="migas"><a href="/">Inicio</a><span>/</span><span>Acerca de</span></div>
      <span class="etiqueta">Acerca de Vorka México</span>
      <h1 class="h1" style="margin-top:18px">Definimos el juego <span class="metal">con quienes lo juegan.</span></h1>
      <p class="lead">Vorka México es una consultora de estrategia, liderazgo e influencia con alcance nacional. Acompañamos a líderes, empresas, gobiernos y organizaciones en sus decisiones, en el desarrollo de quienes deciden y en su comunicación, y contamos las historias de los jóvenes que están cambiando su ciudad.</p>
      <div class="botones"><a class="btn tinta" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="/portafolio/">Ver portafolio</a></div>
    </div>
    <div class="ns-collage" aria-hidden="true">
      <img class="c1" src="/oleynickhdz/img/brandon-portada.webp" alt="" decoding="async">
      <img class="c2" src="/sparks/anunciate/img/premio.webp" alt="" decoding="async">
      <img class="c3" src="/img/equipo/ximena-pastor-charla-960.webp" alt="" decoding="async">
      <div class="ns-tarjeta"><small>Bases en</small><b>Monterrey · CDMX · Guadalajara</b><b>Querétaro · Celaya</b></div>
    </div>
  </div>
</section>
<div class="est-cinta" aria-hidden="true"><div class="est-cinta-in">{cinta}</div></div>

<section class="sec pegada" aria-labelledby="t-que">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-que">Lo que <span class="metal">hacemos</span></h2><p>Consultoría, un medio propio, guías, herramientas digitales y comunidad. Toca cualquiera para conocerla.</p></div>
    <div class="est-lista">{hacemos}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-como">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-como">Cómo <span class="metal">trabajamos</span></h2><p>Diagnóstico antes de proponer, diseño antes de ejecutar, medición antes de cerrar.</p></div>
    <div class="ns-hace">{fases}</div>
    <a class="est-barra rv" href="/portafolio/">Mira lo que han logrado nuestros clientes {flecha}</a>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-quien">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-quien">Quién <span class="metal">nos dirige</span></h2></div>
    <div class="ns-gente">
      <article class="ns-persona rv"><img src="/oleynickhdz/img/brandon-portada.webp" alt="Brandon Oleynick, fundador y CEO de Vorka México" loading="lazy" decoding="async">
        <div><small>Fundador y CEO</small><h3>Brandon Oleynick</h3><p>Líder social juvenil, conferencista y fundador de Juventudes Impactando México A.C. (<a href="https://soyimpacto.org/" target="_blank" rel="noopener">IMPACTO</a>).</p><p><a href="/oleynickhdz/">Conoce a Brandon {FLECHA}</a></p></div></article>
      <article class="ns-persona rv" style="--d:.06s"><img src="/img/equipo/ximena-pastor-retrato-960.webp" alt="Ximena Pastor, Directora Estatal de Vorka Sparks" loading="lazy" decoding="async">
        <div><small>Directora Estatal de Vorka Sparks</small><h3>Ximena Pastor</h3><p>Arquitectura y compromiso social: un enfoque hacia las personas, las ideas y las posibilidades de transformar nuestro entorno.</p><p><a href="/ximepastor/">Conoce a Ximena {FLECHA}</a></p></div></article>
    </div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-donde">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-donde">Cinco ciudades, <span class="metal">alcance nacional</span></h2><p>Con aliados locales trabajamos en toda la República, de forma presencial o a distancia.</p></div>
    <div class="ns-ciudades">{ciudades}</div>
    <p class="ns-legal">Responsable del sitio y del tratamiento de datos: Brandon Oleynick Hernández, persona física que opera bajo el nombre comercial VORKA México. Los detalles están en el <a href="/privacidad/">aviso de privacidad</a>. ¿Dudas? <a href="/contacto/">Escríbenos</a>.</p>
  </div>
</section>
{cierre()}
</main>
{pie()}"""
    pagina = {'@context': 'https://schema.org', '@type': 'AboutPage', '@id': SITIO + '/nosotros/#pagina', 'url': SITIO + '/nosotros/', 'name': 'Acerca de Vorka México',
              'inLanguage': 'es-MX', 'isPartOf': {'@type': 'WebSite', 'name': 'Vorka México', 'url': SITIO + '/'}, 'mainEntity': organizacion(), 'about': {'@id': ORG_ID}}
    extra = f'<link rel="stylesheet" href="/assets/v3/estudio.css?v={VERSION}">\n' + ESTILOS_NOS + _ld(pagina, _migas('Acerca de', '/nosotros/'))
    return cabeza('Acerca de Vorka México · Quiénes somos', 'Qué es Vorka México: consultora de estrategia, liderazgo e influencia con bases en Monterrey, CDMX, Guadalajara, Querétaro y Celaya. También publica la Revista Sparks, Vorka Learn y la tienda de herramientas digitales.', '/nosotros/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

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
