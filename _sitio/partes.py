# Vorka México · piezas compartidas del sitio (cabeza, menú, pie, íconos, fotos)
import html
from urllib.parse import quote

SITIO = 'https://vorka.mx'
CORREO = 'vorkamexico@gmail.com'
WHATSAPP = '528117804869'
WA_MSG = 'Hola Vorka, ya decidí avanzar. Me gustaría empezar formalmente el proceso.'
VERSION = '7'

def e(s):
    return html.escape(str(s), quote=True)

V_PATHS = '<path d="M69 226H311L652 877L526 1133Z"/><path d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/>'
LOGO = f'<svg viewBox="69 225 940 909" aria-hidden="true" fill="currentColor">{V_PATHS}</svg>'

def v_metal(clase, uid, oscuro=True):
    """La V del logo con el degradado metálico de os.vorka.mx (plata → oro)."""
    stops = ('<stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#bfc3c9"/><stop offset=".8" stop-color="#d6b36a"/><stop offset="1" stop-color="#a8853f"/>' if oscuro else
             '<stop offset="0" stop-color="#ECEAE6"/><stop offset=".55" stop-color="#D9D6D9"/><stop offset="1" stop-color="#E6CF96"/>')
    return f'<svg class="{clase}" viewBox="69 225 940 909" aria-hidden="true"><defs><linearGradient id="{uid}" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient></defs><g fill="url(#{uid})">{V_PATHS}</g></svg>'

def v_contorno(clase, uid):
    return f'<svg class="{clase}" viewBox="60 216 958 927" aria-hidden="true"><defs><linearGradient id="{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141114" stop-opacity=".22"/><stop offset=".7" stop-color="#c8a45c" stop-opacity=".9"/><stop offset="1" stop-color="#c8a45c" stop-opacity=".3"/></linearGradient></defs><g fill="none" stroke="url(#{uid})" stroke-width="3">{V_PATHS}</g></svg>'

def ico(d, w=1.7):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'

FLECHA = ico('<path d="M5 12h14M13 6l6 6-6 6"/>', 2)
ICONOS = {
    'doc': ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    'mapa': ico('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    'tablero': ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    'ruta': ico('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>'),
    'lupa': ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    'candado': ico('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    'voz': ico('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    'senal': ico('<path d="M4 12a8 8 0 0 1 16 0M7.5 12a4.5 4.5 0 0 1 9 0"/><circle cx="12" cy="12" r="1.5"/><path d="M12 14v7"/>'),
    'check': ico('<path d="M5 12.5 10 17 19 7"/>', 2.4),
    'brujula': ico('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
    'personas': ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>'),
    'megafono': ico('<path d="M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M18 8a5 5 0 0 1 0 8"/>'),
    'cal': ico('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    'pin': ico('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    'rayo': ico('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>'),
    'ojo': ico('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    'globo': ico('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
}
REDES = [
    ('Instagram', 'https://www.instagram.com/vorka.mx/', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'),
    ('LinkedIn', 'https://www.linkedin.com/company/vorkamx/', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg>'),
    ('Facebook', 'https://www.facebook.com/vorka.mx', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V6.8c0-.8.5-1 1-1h2.3V2.2L14.2 2C10.9 2 10 4.2 10 6.3v2.2H7.5v3.7H10V22h4v-9.8h3l.4-3.7z"/></svg>'),
    ('TikTok', 'https://www.tiktok.com/@vorka.mx', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2.3 1.9 3.8 4.2 4v3.4c-1.5.1-2.9-.4-4.2-1.2v6.3c0 3.6-2.6 6.5-6.3 6.5S4 19 4 15.6c0-3.7 3.2-6.6 7.1-6.1v3.6c-1.6-.4-3.4.6-3.4 2.4 0 1.4 1 2.6 2.6 2.6 1.6 0 2.6-1.2 2.6-2.8V3z"/></svg>'),
]

# Fotos en /img/ciudades/<nombre>-<ancho>.webp
FOTOS = {
    'cdmx-reforma': (3, 'Torres de Paseo de la Reforma, Ciudad de México'),
    'cdmx-chapultepec': (3, 'Vista aérea de Polanco y el Bosque de Chapultepec, Ciudad de México'),
    'cdmx-noche': (3, 'Rascacielos de la Ciudad de México de noche'),
    'cdmx': (3, 'Atardecer sobre la Ciudad de México'),
    'monterrey-silla': (3, 'Cerro de la Silla al atardecer, Monterrey'),
    'monterrey-skyline': (3, 'Rascacielos de Monterrey con la Sierra Madre al fondo'),
    'monterrey-torres': (2, 'Torres corporativas en Monterrey'),
    'monterrey': (3, 'Silueta de Monterrey al atardecer'),
    'guadalajara': (3, 'Catedral de Guadalajara'),
    'queretaro': (3, 'Acueducto de Querétaro'),
    'celaya': (3, 'Templo de Celaya, Guanajuato'),
    'sala-consejo': (3, 'Sala de consejo con vista a la ciudad'),
}
ANCHOS_REALES = {'cdmx-noche': {2400: 2000}, 'monterrey-torres': {1600: 1200}}

def img(nombre, sizes='100vw', alt=None, carga='lazy', prioridad=False):
    n = FOTOS[nombre][0]
    reales = ANCHOS_REALES.get(nombre, {})
    srcset = ', '.join(f'/img/ciudades/{nombre}-{w}.webp {reales.get(w, w)}w' for w in [960, 1600, 2400][:n])
    a = FOTOS[nombre][1] if alt is None else alt
    extra = ' fetchpriority="high"' if prioridad else ''
    return f'<img src="/img/ciudades/{nombre}-1600.webp" srcset="{srcset}" sizes="{sizes}" alt="{e(a)}" loading="{carga}" decoding="async"{extra}>'

def wa(msg=WA_MSG):
    return f'https://wa.me/{WHATSAPP}?text={quote(msg)}'

def cabeza(titulo, descripcion, ruta, og='cdmx-reforma', extra=''):
    return f'''<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descripcion)}">
<link rel="canonical" href="{SITIO}{ruta}">
<meta name="theme-color" content="#FBFAF8">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vorka México">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descripcion)}">
<meta property="og:url" content="{SITIO}{ruta}">
<meta property="og:image" content="{SITIO}/img/ciudades/{og}-1600.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/vorka-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/vorka.css?v={VERSION}">
{extra}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
'''

MENU = [('/servicios/', 'Servicios'), ('/#proceso', 'Cómo trabajamos'), ('/#momentos', 'Para quién'), ('/#red', 'Presencia'), ('/sparks/', 'Sparks'), ('/tienda/', 'Tienda'), ('/voluntariado', 'Tú en Vorka')]

# Vorka FC es para familias de Celaya: su menú habla de la academia, Sparks y la comunidad, no de consultoría ni de la tienda
MENU_FC = [('/fc/#programa', 'Programa'), ('/fc/#costo', 'Costo'), ('/fc/#celaya', 'Dónde'), ('/sparks/celaya/', 'Noticias de Celaya'), ('/sparks/', 'Revista Sparks'), ('/voluntariado', 'Tú en Vorka')]
CTA = {'general': ('/agenda/', 'Agenda tu diagnóstico'), 'fc': ('/fc/#inscripcion', 'Inscribir a mi hijo o hija')}

def nav(actual='', oscuro=False, publico='general'):
    cur = ' aria-current="page"'
    menu = MENU_FC if publico == 'fc' else MENU
    links = ''.join(f'<a href="{h}"{cur if h == actual else ""}>{t}</a>' for h, t in menu)
    movil = ''.join(f'<a href="{h}">{t}</a>' for h, t in menu)
    cta, cta_t = CTA.get(publico, CTA['general'])
    return f'''<header class="nav{' oscuro' if oscuro else ''}">
  <div class="nav-in">
    <a class="marca" href="/" aria-label="Vorka México, inicio">{LOGO}Vorka <span>México</span></a>
    <nav class="nav-links" aria-label="Principal">{links}</nav>
    <a class="btn tinta escritorio" href="{cta}">{cta_t}</a>
    <button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil"><i></i></button>
  </div>
</header>
<div class="menu-movil" id="menu-movil">{movil}<a class="btn tinta" href="{cta}">{cta_t} {FLECHA}</a></div>
'''

# El pie cambia según para quién es la página:
#  general  → todo lo de Vorka (inicio, 404)
#  empresas → servicios y agenda: sin el Simulador PAA (es para estudiantes)
#  fc       → familias de Vorka FC: la academia, Sparks y la comunidad, sin servicios ni tienda
def pie(publico='general'):
    redes = ''.join(f'<a href="{u}" target="_blank" rel="noopener" aria-label="{n}">{s}</a>' for n, u, s in REDES)
    if publico == 'fc':
        columnas = f'''<div><h4>Vorka FC</h4><ul>
        <li><a href="/fc/#programa">Programa y horarios</a></li>
        <li><a href="/fc/#costo">Costo</a></li>
        <li><a href="/fc/#celaya">Dónde entrenamos</a></li>
        <li><a href="/fc/#inscripcion">Inscripción</a></li></ul></div>
      <div><h4>Vorka en Celaya</h4><ul>
        <li><a href="/sparks/celaya/">Noticias de Celaya</a></li>
        <li><a href="/sparks/">Revista Sparks</a></li>
        <li><a href="/sparks/sumate/">Cuenta tu historia</a></li>
        <li><a href="/voluntariado">Tú en Vorka · voluntariado</a></li>
        <li><a href="/">Quiénes somos</a></li></ul></div>
      <div><h4>Contacto</h4><ul>
        <li><a href="{wa('Hola, quiero información de Vorka FC.')}" target="_blank" rel="noopener">WhatsApp +52 81 1780 4869</a></li>
        <li><a href="mailto:{CORREO}">{CORREO}</a></li></ul></div>'''
        lema, base = 'Fútbol, valores y comunidad en Celaya.', '<a href="/privacidad/">Aviso de privacidad</a>'
    else:
        simulador = '' if publico == 'empresas' else '\n        <li><a href="/simulador-paa/">Simulador PAA</a></li>'
        columnas = f'''<div><h4>Servicios</h4><ul>
        <li><a href="/servicios/estrategia/">Estrategia y Dirección</a></li>
        <li><a href="/servicios/liderazgo/">Liderazgo y Talento</a></li>
        <li><a href="/servicios/influencia/">Comunicación e Influencia</a></li>
        <li><a href="/servicios/">Comparar servicios</a></li></ul></div>
      <div><h4>Vorka</h4><ul>
        <li><a href="/#proceso">Cómo trabajamos</a></li>
        <li><a href="/#red">Presencia nacional</a></li>
        <li><a href="/sparks/">Revista Sparks</a></li>
        <li><a href="/tienda/">Tienda</a></li>{simulador}
        <li><a href="/voluntariado">Tú en Vorka</a></li>
        <li><a href="/fc/">Vorka FC</a></li></ul></div>
      <div><h4>Contacto</h4><ul>
        <li><a href="/agenda/">Agenda tu diagnóstico</a></li>
        <li><a href="mailto:{CORREO}">{CORREO}</a></li>
        <li><a href="{wa()}" target="_blank" rel="noopener">WhatsApp +52 81 1780 4869</a></li></ul></div>'''
        lema, base = 'Definimos el juego con quienes lo juegan.', '<a href="/privacidad/">Aviso de privacidad</a><a href="/agenda/">Contacto</a>'
    return f'''<footer class="pie">
  <div class="marco">
    <div class="pie-top">
      <div>
        <a class="marca" href="/">{LOGO}Vorka <span>México</span></a>
        <p class="pie-lema">{lema}</p>
        <div class="redes">{redes}</div>
      </div>
      {columnas}
    </div>
    <div class="marca-xl" aria-hidden="true">{LOGO}<b>Vorka</b></div>
    <div class="pie-base"><span>© <span id="anio">2026</span> Vorka México · Monterrey · CDMX · Guadalajara · Querétaro · Celaya</span><nav>{base}</nav></div>
  </div>
</footer>
<script src="/assets/v3/vorka.js?v={VERSION}" defer></script>
'''

def cierre(titulo='Tu próxima gran decisión empieza con <span class="metal">una conversación.</span>',
           lead='Agenda un diagnóstico de 45 minutos, sin costo. Nos cuentas el contexto y te devolvemos una lectura honesta y, si podemos ayudarte, cómo lo haríamos.', destino='/agenda/'):
    return f'''<section class="cierre" id="contact">
  {v_metal('art', 'gc')}<div class="glow"></div><div class="grano"></div>
  <div class="marco rv">
    <span class="etiqueta">Diagnóstico sin costo</span>
    <h2 class="h1" style="margin-top:18px">{titulo}</h2>
    <p class="lead">{lead}</p>
    <div class="botones"><a class="btn plata" href="{destino}">Agenda tu diagnóstico {FLECHA}</a><a class="btn vidrio" href="{wa()}" target="_blank" rel="noopener">Escribir por WhatsApp</a></div>
    <div class="garantias"><span>45 minutos</span><span>Sin costo ni compromiso</span><span>Respuesta en 2 días hábiles</span></div>
  </div>
</section>
'''
