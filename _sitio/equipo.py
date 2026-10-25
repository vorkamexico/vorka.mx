# Vorka México · páginas del equipo Vorka, hechas por Vorka (en /equipo/<persona>/ o en su dirección corta, p. ej. /ximepastor/).
# Cada persona es un diccionario con sus textos y fotos (img/equipo/<slug>-<foto>-960|1600.webp).
# Sin correo ni teléfono a la vista: el contacto es por WhatsApp (botón) y la agenda de os.vorka.mx.
# La primera es Ximena Pastor (arquitectura): foto a pantalla completa, bocetos a mano y color, con la barra y el pie de Vorka.
# Más adelante /equipo/ reunirá a todo el equipo con las mismas fichas.
import hashlib
import json
import os
from partes import *

# La hoja de estilos se pide con una huella de su contenido: si cambia, los navegadores la bajan de nuevo
# (con un número fijo seguían usando la anterior hasta 4 horas)
CSS_VER = hashlib.md5(open(os.path.join(os.path.dirname(__file__), '..', 'assets', 'v3', 'equipo.css'), 'rb').read()).hexdigest()[:8]

OS = 'https://os.vorka.mx'

XIMENA = {
    'slug': 'ximena-pastor',   # nombre de sus fotos (img/equipo/ximena-pastor-*)
    'ruta': '/ximepastor/',    # su dirección corta en vorka.mx (/equipo/ximena-pastor/ redirige aquí)
    'nombre': 'Ximena Pastor',
    'nombre_completo': 'Brenda Ximena Pastor Aguilar',
    'rol': 'Directora Estatal de Vorka Sparks',
    'disciplina': 'Arquitectura y compromiso social',
    'frase': 'Enfoque hacia las personas, las ideas y las posibilidades de transformar nuestro entorno.',
    'lugar': 'San Miguel de Allende, Gto. · Querétaro, Qro.',
    'mentor': 'ximepastor',   # agenda pública en os.vorka.mx/agendar/ximepastor
    'whatsapp': '524151887476',
    'linkedin': 'https://www.linkedin.com/in/ximena-pastor',
    'instagram': 'https://www.instagram.com/ximenaaguilar1/',
    # (foto, ancho real a 960, ancho real a 1600, alto/ancho, texto alternativo)
    'fotos': {
        'retrato': (960, 1000, 1.5, 'Ximena Pastor sonriendo, retrato al aire libre'),
        'biblioteca': (960, 1280, 0.666, 'Ximena Pastor en una biblioteca entre libreros'),
        'charla': (960, 1600, 0.5625, 'Ximena Pastor dando una charla frente a un grupo de estudiantes'),
        'reconocimiento': (853, 853, 1.5, 'Ximena Pastor con su reconocimiento'),
        'prepatec': (960, 1280, 0.75, 'Ximena Pastor con un grupo de jóvenes en PrepaTec'),
        'comunidad': (721, 721, 2.22, 'Ximena Pastor con voluntarios en una actividad comunitaria'),
    },
    'experiencia': [
        ('Vorka México', 'Directora Estatal de Vorka Sparks', 'Febrero de 2026 — Presente', 'Vorka Sparks es el programa de Vorka México que cuenta las historias de jóvenes que están transformando su comunidad.', 'charla'),
        ('Caring SMA · San Miguel de Allende', 'Voluntariado y servicio comunitario', 'Septiembre de 2022 — Abril de 2025', 'Creación y desarrollo de una iniciativa de voluntariado y servicio comunitario, enfocada en generar impacto positivo en la comunidad.', 'comunidad'),
    ],
    'educacion': [
        ('Tecnológico de Monterrey · Querétaro', 'Arquitectura', 'Agosto de 2023 — Presente', 'Formación en diseño de espacios con enfoque social y ambiental, orientada a crear soluciones inclusivas, sostenibles e innovadoras que mejoren el entorno y la calidad de vida de las personas.'),
        ('CBTIS No. 60 · San Miguel de Allende', 'Técnico en Construcción', 'Agosto de 2020 — Julio de 2023', 'Formación en análisis de costos y presupuestos, criterios de diseño arquitectónico, sistemas constructivos, instalaciones, especificación de acabados y levantamientos topográficos.'),
    ],
    'manifiesto': ('Lo que me mueve.', 'Las ideas que inspiran lo que hago.', [
        ('Siempre podemos aprender, cambiar y crecer.', 'Creo en la capacidad de aprender, cambiar y elegir quién queremos ser. Cada experiencia nos abre nuevas perspectivas y cada decisión nos permite acercarnos a la persona que queremos construir.'),
        ('Mirar distinto es el principio de crear algo nuevo.', 'Escuchar otras historias y conocer diferentes perspectivas nos permite cuestionar lo que damos por hecho. Entender otras formas de ver el mundo abre nuevas posibilidades.'),
        ('Crear es darle forma a lo que imaginamos.', 'A través de la arquitectura, el arte y las ideas, encuentro maneras de expresar lo que veo, siento y pienso. Me mueve transformar una idea en algo que otros puedan experimentar, descubrir o hacer suyo.'),
        ('Las mejores ideas crecen cuando se comparten.', 'Creo en lo que sucede cuando diferentes personas, experiencias y formas de pensar se encuentran. Compartir conocimientos, colaborar y construir con otros nos permite llegar más lejos de lo que podríamos imaginar por separado.'),
        ('Quiero construir cosas que trasciendan.', 'Me interesa desarrollar proyectos, ideas y experiencias que permanezcan en el tiempo y dejen algo en las personas. Crear no solo por lo que podemos lograr hoy, sino por lo que podemos aportar a futuro.'),
    ]),
    'vision': ('Crear nuevas formas de ver y transformar nuestro entorno.', 'Mi manera de entender el mundo y los proyectos que quiero desarrollar.', [
        ('Las personas deben ser parte de las decisiones que las afectan.', 'Creo en proyectos que escuchen a las personas y tomen en cuenta sus necesidades, ideas y experiencias. Las mejores soluciones nacen cuando las personas dejan de ser únicamente quienes reciben los resultados y se convierten en parte activa de su construcción.'),
        ('Los espacios también construyen comunidad.', 'La arquitectura tiene la capacidad de influir en cómo vivimos, convivimos y nos relacionamos con nuestro entorno. Me interesa pensar en espacios que respondan a las necesidades de las personas, favorezcan la convivencia y generen un sentido de pertenencia.'),
        ('Cada historia puede ampliar nuestra perspectiva.', 'Conocer otras experiencias nos permite cuestionar lo que damos por hecho y entender realidades distintas a la nuestra. Dar espacio a distintas voces también ayuda a cambiar la manera en que vemos una comunidad.'),
        ('La creatividad también es una forma de transformar.', 'El arte, el diseño y la arquitectura permiten imaginar posibilidades que todavía no existen. Me interesa explorar cómo las ideas pueden convertirse en propuestas concretas que comuniquen, conecten con las personas y generen nuevas maneras de entender lo que nos rodea.'),
        ('El cambio se construye en comunidad.', 'Los proyectos que generan cambios duraderos necesitan colaboración, compromiso y distintas formas de conocimiento. Creo en conectar personas e ideas para desarrollar iniciativas que respondan a necesidades reales y tengan un impacto más allá de sus resultados inmediatos.'),
    ]),
    'habilidades': ['Coordinación de equipos', 'Pensamiento creativo y visual', 'Escritura y comunicación de ideas', 'Gestión de proyectos'],
    'certificaciones': [('Aspire Leaders Program', 'Harvard Business School', '2024'), ('Mentalidad Transformadora', 'Santander Open Academy', '2026')],
    'reconocimientos': [('Líderes del Mañana', 'Tecnológico de Monterrey', '2023'), ('Chavos que Inspiran', 'Fundación BBVA', '2023'), ('Destinos Brillantes', 'Jóvenes Adelante', '2024')],
}

EQUIPO = [XIMENA]


def foto(p, k, sizes, carga='lazy', prioridad=False, clase=''):
    w960, w1600, _, alt = p['fotos'][k]
    base = f"/img/equipo/{p['slug']}-{k}"
    srcset = f'{base}-960.webp {w960}w' + (f', {base}-1600.webp {w1600}w' if w1600 > w960 else '')
    extra = ' fetchpriority="high"' if prioridad else ''
    return f'<img{f" class={chr(34)}{clase}{chr(34)}" if clase else ""} src="{base}-1600.webp" srcset="{srcset}" sizes="{sizes}" alt="{e(alt)}" loading="{carga}" decoding="async"{extra}>'


# Trazos a mano (bocetos de arquitecta): subrayado, flecha y una casita de línea
TRAZO = '<svg class="trazo" viewBox="0 0 420 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 28 C 80 10, 170 34, 250 18 S 380 8, 416 22" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>'
FLECHITA = '<svg class="flechita" viewBox="0 0 90 60" aria-hidden="true"><path d="M6 52 C 20 20, 50 10, 80 14 M66 4 L82 14 L68 26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CASITA = '<svg class="casita" viewBox="0 0 160 120" aria-hidden="true"><path d="M10 112 L10 58 L80 12 L150 58 L150 112 Z M56 112 L56 74 L104 74 L104 112 M24 60 L24 104 M136 60 L136 104 M2 112 L158 112" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
COLORES = ['terracota', 'ocre', 'salvia', 'tinta', 'cielo']


def con_sparks(t):
    """Texto escapado con 'Vorka Sparks' enlazado a la revista."""
    return e(t).replace('Vorka Sparks', '<a class="xp-link" href="/sparks/">Vorka Sparks</a>')


def pagina_persona(p):
    ruta = p.get('ruta') or f"/equipo/{p['slug']}/"
    agendar = f"{OS}/agendar/{p['mentor']}"
    primero = p['nombre'].split()[0]
    wa_url = f"https://wa.me/{p['whatsapp']}?text=" + quote(f"Hola {primero}, vi tu página en Vorka México y me gustaría platicar contigo.")
    titulo = f"{p['nombre']} · {p['disciplina']} | Vorka México"
    desc = f"{p['nombre']}, {p['rol']} en Vorka México. {p['disciplina']}: {p['frase']}"
    og = f"{SITIO}/img/equipo/{p['slug']}-retrato-og.jpg"
    ld = {'@context': 'https://schema.org', '@type': 'ProfilePage', 'url': SITIO + ruta, 'mainEntity': {
        '@type': 'Person', 'name': p['nombre'], 'alternateName': p['nombre_completo'], 'jobTitle': p['rol'], 'description': p['frase'],
        'image': f"{SITIO}/img/equipo/{p['slug']}-retrato-1600.webp", 'sameAs': [p['linkedin'], p['instagram']],
        'worksFor': {'@type': 'Organization', 'name': 'Vorka México', 'url': SITIO},
        'alumniOf': [{'@type': 'CollegeOrUniversity', 'name': 'Tecnológico de Monterrey'}, {'@type': 'EducationalOrganization', 'name': 'CBTIS No. 60'}],
        'award': [f'{n} · {o} ({a})' for n, o, a in p['reconocimientos']],
        'knowsAbout': ['Arquitectura', 'Diseño social', 'Servicio comunitario', 'Coordinación de equipos', 'Gestión de proyectos']}}
    extra = f'''<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/equipo.css?v={CSS_VER}">
<meta property="og:image:alt" content="{e(p['nombre'])}, Vorka México">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
'''
    man_t, man_s, man = p['manifiesto']
    vis_t, vis_s, vis = p['vision']
    tarjetas = ''.join(f'''<article class="tarjeta t-{COLORES[i % 5]}"><span class="t-n">{i + 1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>''' for i, (t, d) in enumerate(man))
    vision = ''.join(f'<li><span class="v-n">{i:02d}</span><div><h3>{e(t)}</h3><p>{e(d)}</p></div></li>' for i, (t, d) in enumerate(vis, 1))

    def hito(anio, puesto, org, fechas, texto, color):
        return f'''<li class="hito h-{color}"><span class="h-anio">{anio}</span><div><h3>{con_sparks(puesto)}</h3><b>{e(org)}</b><small>{e(fechas)}</small><p>{con_sparks(texto)}</p></div></li>'''
    exp, edu = p['experiencia'], p['educacion']
    hitos = (hito('2026', exp[0][1], exp[0][0], exp[0][2], exp[0][3], 'terracota') + hito('2023', edu[0][1], edu[0][0], edu[0][2], edu[0][3], 'cielo')
             + hito('2022', exp[1][1], exp[1][0], exp[1][2], exp[1][3], 'salvia') + hito('2020', edu[1][1], edu[1][0], edu[1][2], edu[1][3], 'ocre'))
    habs = ''.join(f'<li class="chip c-{COLORES[i % 4]}">{e(h)}</li>' for i, h in enumerate(p['habilidades']))
    premio = lambda n, o, a: f'<li><span class="p-anio">{a}</span><b>{e(n)}</b><small>{e(o)}</small></li>'
    recs = ''.join(premio(*x) for x in p['reconocimientos'])
    certs = ''.join(premio(*x) for x in p['certificaciones'])
    ICO_WA = ico('<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.2-4.4A8.4 8.4 0 1 1 21 11.5Z"/>')
    ICO_IN = ico('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>')
    ICO_IG = ico('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>')
    ICO_CAL = ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')
    menu = [('#manifiesto', 'Manifiesto'), ('#trayectoria', 'Trayectoria'), ('#vision', 'Visión'), ('#reconocimientos', 'Reconocimientos'), ('#contacto', 'Contacto')]
    apellido = ' '.join(p['nombre'].split()[1:])

    cuerpo = f'''{nav(oscuro=True, cta=(agendar, f'Agendar con {primero}'), menu=menu)}
<main id="contenido" class="xp">
  <section class="xp-hero">
    <div class="xp-hero-foto">{foto(p, 'biblioteca', '100vw', carga='eager', prioridad=True)}</div>
    <div class="marco xp-hero-in">
      <div>
        <p class="xp-kicker"><span class="mano">hola, soy</span></p>
        <h1 class="xp-nombre">{e(primero)}<br><span class="subr">{e(apellido)}{TRAZO}</span></h1>
        <p class="xp-disc"><i></i>{e(p['disciplina'])}</p>
      </div>
      <div class="xp-hero-lado">
        <p>{con_sparks(p['rol'])} en Vorka México. Estudio Arquitectura en el Tecnológico de Monterrey y diseño desde las personas, las ideas y la comunidad.</p>
        <div class="botones"><a class="btn blanco" href="{agendar}" rel="noopener">{ICO_CAL} Agendar una sesión</a><a class="btn vidrio" href="{wa_url}" target="_blank" rel="noopener">{ICO_WA} WhatsApp</a></div>
      </div>
    </div>
  </section>

  <section class="xp-intro">
    <div class="marco xp-intro-g">
      <div class="xp-intro-l"><span class="xp-etq">Mi enfoque</span>{CASITA}<span class="mano nota">espacios para convivir</span></div>
      <p class="xp-grande"><mark class="m-ocre">Los espacios también construyen comunidad</mark>, y las mejores soluciones nacen cuando <mark class="m-salvia">las personas se vuelven parte</mark> de su construcción. Mi forma de crear es <mark class="m-terracota">mirar distinto</mark>.</p>
    </div>
  </section>

  <section class="xp-sec" id="manifiesto">
    <div class="marco">
      <div class="xp-cab"><span class="xp-etq">Manifiesto</span><h2>{e(man_t)}</h2><p>{e(man_s)}</p>{FLECHITA}</div>
      <div class="tablero">{tarjetas}</div>
    </div>
  </section>

  <section class="xp-collage" aria-label="Fotos">
    <div class="marco collage">
      <figure class="cl-a">{foto(p, 'charla', '(min-width: 980px) 640px, 100vw')}<figcaption class="mano">compartiendo ideas · <a class="xp-link" href="/sparks/">Vorka Sparks</a></figcaption></figure>
      <figure class="cl-b polaroid">{foto(p, 'retrato', '(min-width: 980px) 340px, 70vw')}<figcaption class="mano">yo, {e(primero)} ✦</figcaption></figure>
      <figure class="cl-c">{foto(p, 'prepatec', '(min-width: 980px) 460px, 100vw')}<figcaption class="mano">construir en comunidad</figcaption></figure>
      <figure class="cl-d polaroid">{foto(p, 'comunidad', '(min-width: 980px) 260px, 60vw')}<figcaption class="mano">Caring SMA</figcaption></figure>
    </div>
  </section>

  <section class="xp-sec" id="trayectoria">
    <div class="marco xp-tray">
      <div class="xp-cab"><span class="xp-etq">Trayectoria</span><h2>Lo que he construido hasta hoy.</h2><p>Experiencia y formación, de la obra al aula y a la comunidad.</p></div>
      <ol class="hitos">{hitos}</ol>
    </div>
  </section>

  <section class="xp-sec xp-vision" id="vision">
    <div class="marco xp-vision-g">
      <div class="xp-cab"><span class="xp-etq">Mi visión</span><h2>{e(vis_t)}</h2><p>{e(vis_s)}</p></div>
      <ol class="vision">{vision}</ol>
    </div>
  </section>

  <section class="xp-sec" id="reconocimientos">
    <div class="marco xp-reco">
      <div><span class="xp-etq">Reconocimientos</span><ul class="premios">{recs}</ul></div>
      <div><span class="xp-etq">Certificaciones</span><ul class="premios">{certs}</ul>
        <span class="xp-etq" style="margin-top:44px">Habilidades</span><ul class="chips">{habs}</ul></div>
      <figure class="polaroid reco-foto">{foto(p, 'reconocimiento', '(min-width: 980px) 300px, 70vw')}<figcaption class="mano">¡un logro más!</figcaption></figure>
    </div>
  </section>

  <section class="xp-contacto" id="contacto">
    <div class="marco xp-contacto-g">
      <div>
        <span class="mano xp-mano-claro">¿platicamos?</span>
        <h2>Construyamos algo que <span class="subr">trascienda{TRAZO}</span></h2>
        <p>Agenda una sesión 1:1 o una mentoría: eliges el tipo de sesión, el día y la hora, y te llega la confirmación a tu correo.</p>
        <div class="botones"><a class="btn blanco" href="{agendar}" rel="noopener">{ICO_CAL} Agendar una sesión {FLECHA}</a><a class="btn vidrio" href="{wa_url}" target="_blank" rel="noopener">{ICO_WA} WhatsApp</a></div>
      </div>
      <ul class="xp-redes">
        <li><a href="{p['linkedin']}" target="_blank" rel="noopener">{ICO_IN}<span>LinkedIn</span></a></li>
        <li><a href="{p['instagram']}" target="_blank" rel="noopener">{ICO_IG}<span>Instagram</span></a></li>
      </ul>
    </div>
  </section>
</main>
{pie()}
<script>
(function () {{
  var nav = document.querySelector('.nav'), hero = document.querySelector('.xp-hero');
  if (!nav || !hero) return;
  function tono() {{ nav.classList.toggle('oscuro', window.scrollY < hero.offsetHeight - 80); }}
  tono(); window.addEventListener('scroll', tono, {{ passive: true }}); window.addEventListener('resize', tono);
}})();
</script>'''
    return (cabeza(titulo, desc, ruta, extra=extra).replace(f'{SITIO}/img/ciudades/cdmx-reforma-1600.webp', og).replace('<meta name="theme-color" content="#FBFAF8">', '<meta name="theme-color" content="#1B1916">') + cuerpo + '\n</body>\n</html>\n')


def paginas_equipo():
    return {(p.get('ruta') or f"/equipo/{p['slug']}/").strip('/') + '/index.html': pagina_persona(p) for p in EQUIPO}
