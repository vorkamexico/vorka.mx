# Vorka México · piezas compartidas del sitio (cabeza, menú, pie, íconos, fotos)
import html

SITIO = 'https://www.vorka.mx'
CORREO = 'vorkamexico@gmail.com'
WHATSAPP = '528117804869'
WA_MSG = 'Hola Vorka, ya decidí avanzar. Me gustaría empezar formalmente el proceso.'
VERSION = '1'

def e(s):
    return html.escape(str(s), quote=True)

LOGO = '<svg viewBox="69 225 940 909" aria-hidden="true"><path fill="currentColor" d="M69 226H311L652 877L526 1133Z"/><path fill="currentColor" d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>'
FLECHA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ICONOS = {
    'doc': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    'mapa': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    'tablero': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    'ruta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/></svg>',
    'lupa': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    'candado': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    'voz': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    'senal': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0M7.5 12a4.5 4.5 0 0 1 9 0"/><circle cx="12" cy="12" r="1.5"/><path d="M12 14v7"/></svg>',
    'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>',
}
REDES = [
    ('Instagram', 'https://www.instagram.com/vorka.mx/', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'),
    ('LinkedIn', 'https://www.linkedin.com/company/vorkamx/', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg>'),
    ('Facebook', 'https://www.facebook.com/vorka.mx', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V6.8c0-.8.5-1 1-1h2.3V2.2L14.2 2C10.9 2 10 4.2 10 6.3v2.2H7.5v3.7H10V22h4v-9.8h3l.4-3.7z"/></svg>'),
    ('TikTok', 'https://www.tiktok.com/@vorka.mx', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2.3 1.9 3.8 4.2 4v3.4c-1.5.1-2.9-.4-4.2-1.2v6.3c0 3.6-2.6 6.5-6.3 6.5S4 19 4 15.6c0-3.7 3.2-6.6 7.1-6.1v3.6c-1.6-.4-3.4.6-3.4 2.4 0 1.4 1 2.6 2.6 2.6 1.6 0 2.6-1.2 2.6-2.8V3z"/></svg>'),
]

# Fotos disponibles en /img/ciudades/<nombre>-<ancho>.webp
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

# Algunas fotos verticales se guardaron más angostas que su nombre
ANCHOS_REALES = {'cdmx-noche': {2400: 2000}, 'monterrey-torres': {1600: 1200}}

def img(nombre, sizes='100vw', alt=None, carga='lazy', prioridad=False):
    n = FOTOS[nombre][0]
    reales = ANCHOS_REALES.get(nombre, {})
    srcset = ', '.join(f'/img/ciudades/{nombre}-{w}.webp {reales.get(w, w)}w' for w in [960, 1600, 2400][:n])
    a = FOTOS[nombre][1] if alt is None else alt
    extra = ' fetchpriority="high"' if prioridad else ''
    return f'<img src="/img/ciudades/{nombre}-1600.webp" srcset="{srcset}" sizes="{sizes}" alt="{e(a)}" loading="{carga}" decoding="async"{extra}>'

def foto(nombre, clase='foto', foco='50% 50%', foco_m=None, sizes='100vw', alt=None, carga='lazy', prioridad=False):
    estilo = f'--foco:{foco}' + (f';--foco-m:{foco_m}' if foco_m else '')
    return f'<div class="{clase}" style="{estilo}">{img(nombre, sizes, alt, carga, prioridad)}</div>'

def wa(msg=WA_MSG):
    from urllib.parse import quote
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
<meta name="theme-color" content="#0A0A0B">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vorka México">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descripcion)}">
<meta property="og:url" content="{SITIO}{ruta}">
<meta property="og:image" content="{SITIO}/img/ciudades/{og}-1600.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/v2/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/vorka-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v2/vorka.css?v={VERSION}">
{extra}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
'''

MENU = [('/servicios/', 'Servicios'), ('/#metodo', 'Método'), ('/#momentos', 'Para quién'), ('/#huella', 'Huella'), ('/sparks/', 'Sparks'), ('/voluntariado', 'Tú en Vorka')]

def nav(actual='', siempre=False):
    cur = ' aria-current="page"'
    links = ''.join(f'<a href="{h}"{cur if h == actual else ""}>{t}</a>' for h, t in MENU)
    movil = ''.join(f'<a href="{h}">{t}</a>' for h, t in MENU)
    return f'''<header class="nav{' siempre' if siempre else ''}">
  <div class="marco">
    <a class="marca" href="/" aria-label="Vorka México, inicio">{LOGO}Vorka <span>México</span></a>
    <nav class="nav-links" aria-label="Principal">{links}</nav>
    <a class="btn oro escritorio" href="/agenda/">Agenda tu diagnóstico</a>
    <button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil"><i></i></button>
  </div>
</header>
<div class="menu-movil" id="menu-movil">{movil}<a class="btn oro" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><div class="pie-m">ESTRATEGIA · LIDERAZGO · INFLUENCIA</div></div>
'''

def pie():
    redes = ''.join(f'<a href="{u}" target="_blank" rel="noopener" aria-label="{n}">{s}</a>' for n, u, s in REDES)
    return f'''<footer class="pie">
  <div class="marco">
    <div class="pie-top">
      <div>
        <a class="marca" href="/">{LOGO}Vorka <span>México</span></a>
        <p class="pie-lema">Definimos el juego <em>con quienes lo juegan.</em></p>
        <div class="redes">{redes}</div>
      </div>
      <div><h4>Servicios</h4><ul>
        <li><a href="/servicios/estrategia/">Estrategia y Dirección</a></li>
        <li><a href="/servicios/liderazgo/">Liderazgo y Talento</a></li>
        <li><a href="/servicios/influencia/">Comunicación e Influencia</a></li>
        <li><a href="/servicios/">Todos los servicios</a></li></ul></div>
      <div><h4>Vorka</h4><ul>
        <li><a href="/#metodo">Cómo trabajamos</a></li>
        <li><a href="/#huella">Nuestra huella</a></li>
        <li><a href="/sparks/">Revista Sparks</a></li>
        <li><a href="/voluntariado">Tú en Vorka</a></li></ul></div>
      <div><h4>Contacto</h4><ul>
        <li><a href="/agenda/">Agenda tu diagnóstico</a></li>
        <li><a href="mailto:{CORREO}">{CORREO}</a></li>
        <li><a href="{wa()}" target="_blank" rel="noopener">WhatsApp +52 81 1780 4869</a></li>
        <li>Monterrey · CDMX · Guadalajara · Querétaro · Celaya</li></ul></div>
    </div>
    <div class="pie-base"><span>© <span id="anio">2026</span> Vorka México. Todos los derechos reservados.</span><nav><a href="/privacidad/">Aviso de privacidad</a><a href="/agenda/">Contacto</a></nav></div>
  </div>
</footer>
<script src="/assets/v2/vorka.js?v={VERSION}" defer></script>
'''

def cierre(foto_n='monterrey-silla', titulo='Cuéntanos tu momento. <em>Te devolvemos un plan.</em>', lead='Una sesión de diagnóstico de 45 minutos, sin costo. Nos cuentas el contexto y qué está sobre la mesa; te devolvemos una lectura honesta y, si podemos ayudarte, cómo lo haríamos.', destino='/agenda/'):
    return f'''<section class="cierre" id="contact">
  {foto(foto_n, foco='50% 60%')}
  <div class="marco rv">
    <span class="kicker">Trabaja con nosotros</span>
    <h2 class="titulo">{titulo}</h2>
    <p class="lead">{lead}</p>
    <div class="botones"><a class="btn oro" href="{destino}">Agenda tu diagnóstico {FLECHA}</a><a class="btn linea" href="{wa()}" target="_blank" rel="noopener">Ya decidí: escribir por WhatsApp</a></div>
    <div class="garantias"><span>45 minutos</span><span>Sin costo</span><span>Respuesta en 2 días hábiles</span><span>Propuesta a la medida</span></div>
  </div>
</section>
'''
