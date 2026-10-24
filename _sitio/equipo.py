# Vorka México · /equipo/<persona>/: páginas del equipo Vorka, hechas por Vorka.
# Cada persona es un diccionario con sus textos y fotos (img/equipo/<slug>-<foto>-960|1600.webp).
# La primera es Ximena Pastor (arquitectura): plano de arquitectura con la identidad de Vorka.
# Más adelante /equipo/ reunirá a todo el equipo con las mismas fichas.
import json
from partes import *

OS = 'https://os.vorka.mx'

XIMENA = {
    'slug': 'ximena-pastor',
    'nombre': 'Ximena Pastor',
    'nombre_completo': 'Brenda Ximena Pastor Aguilar',
    'rol': 'Directora Estatal de Vorka Sparks',
    'disciplina': 'Arquitectura y compromiso social',
    'frase': 'Enfoque hacia las personas, las ideas y las posibilidades de transformar nuestro entorno.',
    'lugar': 'San Miguel de Allende, Gto. · Querétaro, Qro.',
    'mentor': 'ximena',   # agenda pública en os.vorka.mx/agendar?m=ximena
    'correo': 'brendapastor0@gmail.com',
    'whatsapp': '524151887476',
    'tel': '+52 415 188 7476',
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
EJES = 'ABCDE'


def foto(p, k, sizes, carga='lazy', prioridad=False, clase=''):
    w960, w1600, _, alt = p['fotos'][k]
    base = f"/img/equipo/{p['slug']}-{k}"
    srcset = f'{base}-960.webp {w960}w' + (f', {base}-1600.webp {w1600}w' if w1600 > w960 else '')
    extra = ' fetchpriority="high"' if prioridad else ''
    return f'<img{f" class={chr(34)}{clase}{chr(34)}" if clase else ""} src="{base}-1600.webp" srcset="{srcset}" sizes="{sizes}" alt="{e(alt)}" loading="{carga}" decoding="async"{extra}>'


def cota(texto):
    """Línea de cota de plano: |—— texto ——|"""
    return f'<div class="cota" aria-hidden="true"><i></i><span>{e(texto)}</span><i></i></div>'


def pagina_persona(p):
    ruta = f"/equipo/{p['slug']}/"
    agendar = f"{OS}/agendar?m={p['mentor']}"
    wa_url = f"https://wa.me/{p['whatsapp']}?text=" + quote(f"Hola {p['nombre'].split()[0]}, vi tu página en Vorka México y me gustaría platicar contigo.")
    titulo = f"{p['nombre']} · {p['disciplina']} | Equipo Vorka"
    desc = f"{p['nombre']}, {p['rol']} en Vorka México. {p['disciplina']}: {p['frase']}"
    og = f"{SITIO}/img/equipo/{p['slug']}-retrato-og.jpg"
    ld = {'@context': 'https://schema.org', '@type': 'ProfilePage', 'url': SITIO + ruta, 'mainEntity': {
        '@type': 'Person', 'name': p['nombre'], 'alternateName': p['nombre_completo'], 'jobTitle': p['rol'], 'description': p['frase'],
        'image': f"{SITIO}/img/equipo/{p['slug']}-retrato-1600.webp", 'email': f"mailto:{p['correo']}", 'sameAs': [p['linkedin'], p['instagram']],
        'worksFor': {'@type': 'Organization', 'name': 'Vorka México', 'url': SITIO},
        'alumniOf': [{'@type': 'CollegeOrUniversity', 'name': 'Tecnológico de Monterrey'}, {'@type': 'EducationalOrganization', 'name': 'CBTIS No. 60'}],
        'award': [f'{n} · {o} ({a})' for n, o, a in p['reconocimientos']],
        'knowsAbout': ['Arquitectura', 'Diseño social', 'Servicio comunitario', 'Coordinación de equipos', 'Gestión de proyectos']}}
    extra = f'''<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/equipo.css?v={VERSION}">
<meta property="og:image:alt" content="{e(p['nombre'])}, equipo Vorka">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
'''
    hitos = [('2020', 'Técnico en Construcción'), ('2022', 'Caring SMA'), ('2023', 'Arquitectura · Tec'), ('2024', 'Harvard · Aspire'), ('2026', 'Vorka Sparks')]
    linea = ''.join(f'<li><b class="mono">{a}</b><span>{e(t)}</span></li>' for a, t in hitos)

    def lamina(i, t, d, tono=''):
        return f'''<article class="lamina{tono}"><header><span class="mono">LÁMINA {i:02d}</span><span class="mono">EJE {EJES[i - 1]}</span></header>
      <b class="lam-n" aria-hidden="true">{i:02d}</b><h3>{e(t)}</h3><p>{e(d)}</p></article>'''

    man_t, man_s, man = p['manifiesto']
    vis_t, vis_s, vis = p['vision']
    manifiesto = ''.join(lamina(i, t, d) for i, (t, d) in enumerate(man, 1))
    vision = ''.join(f'<li><span class="mono">{i:02d}</span><div><h3>{e(t)}</h3><p>{e(d)}</p></div></li>' for i, (t, d) in enumerate(vis, 1))

    def tramo(org, puesto, fechas, desc, img_k=None):
        fig = f'<figure class="tr-foto">{foto(p, img_k, "(min-width: 980px) 420px, 100vw")}</figure>' if img_k else ''
        return f'''<article class="tramo"><div class="tr-txt"><span class="mono">{e(fechas)}</span><h3>{e(puesto)}</h3><b>{e(org)}</b><p>{e(desc)}</p></div>{fig}</article>'''
    experiencia = ''.join(tramo(*x) for x in p['experiencia'])
    educacion = ''.join(tramo(*x) for x in p['educacion'])
    fila = lambda n, o, a: f'<tr><th scope="row">{e(n)}</th><td>{e(o)}</td><td class="mono">{a}</td></tr>'
    certs = ''.join(fila(*x) for x in p['certificaciones'])
    recs = ''.join(fila(*x) for x in p['reconocimientos'])
    habs = ''.join(f'<li><span class="mono">{i:02d}</span>{e(h)}</li>' for i, h in enumerate(p['habilidades'], 1))
    primero = p['nombre'].split()[0]
    ICO_MAIL = ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>')
    ICO_WA = ico('<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.2-4.4A8.4 8.4 0 1 1 21 11.5Z"/>')
    ICO_IN = ico('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>')
    ICO_IG = ico('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>')
    ICO_CAL = ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')

    cuerpo = f'''{nav(cta=(agendar, f'Agendar con {primero}'))}
<main id="contenido" class="eq">
  <section class="eq-hero plano">
    <div class="marco eq-hero-g">
      <div class="eq-hero-t">
        <nav class="eq-migas mono" aria-label="Ruta"><a href="/">Vorka México</a><span>/</span><span>Equipo Vorka</span></nav>
        <p class="eq-rotulo mono"><span>PLANO 01</span><span>{e(p['disciplina'].upper())}</span></p>
        <h1 class="eq-nombre">{e(p['nombre'].split()[0])}<br><span>{e(" ".join(p['nombre'].split()[1:]))}</span></h1>
        <p class="eq-frase">{e(p['frase'])}</p>
        <p class="eq-rol"><span class="eq-sello">{LOGO}</span><span><b>{e(p['rol'])}</b><small>Equipo Vorka México</small></span></p>
        <div class="botones"><a class="btn tinta" href="{agendar}" rel="noopener">{ICO_CAL} Agendar una sesión</a><a class="btn blanco" href="#contacto">Contacto</a></div>
      </div>
      <figure class="eq-retrato">
        <div class="eq-marco">{foto(p, 'retrato', '(min-width: 980px) 460px, 90vw', carga='eager', prioridad=True)}</div>
        {cota(p['lugar'])}
        <figcaption class="mono">FIG. 01 — {e(p['nombre'].upper())}</figcaption>
      </figure>
    </div>
    <div class="marco"><ol class="eq-linea" aria-label="Trayectoria en el tiempo">{linea}</ol></div>
  </section>

  <section class="sec" id="manifiesto">
    <div class="marco">
      <div class="eq-cab"><span class="mono eq-etq">MANIFIESTO</span><h2 class="eq-h2">{e(man_t)}</h2><p class="lead">{e(man_s)}</p></div>
      <div class="laminas">{manifiesto}</div>
    </div>
  </section>

  <section class="sec suave" id="trayectoria">
    <div class="marco">
      <div class="eq-cab"><span class="mono eq-etq">TRAYECTORIA · CORTE A–A′</span><h2 class="eq-h2">Experiencia</h2></div>
      <div class="tramos">{experiencia}</div>
      <div class="eq-cab" style="margin-top:clamp(64px,8vw,110px)"><span class="mono eq-etq">TRAYECTORIA · CORTE B–B′</span><h2 class="eq-h2">Educación</h2></div>
      <div class="tramos con-foto">{educacion}<figure class="tr-foto alta">{foto(p, 'biblioteca', '(min-width: 980px) 420px, 100vw')}</figure></div>
    </div>
  </section>

  <section class="sec oscura plano-osc" id="vision">
    <div class="marco eq-vision">
      <div class="eq-cab"><span class="mono eq-etq">MI VISIÓN</span><h2 class="eq-h2">{e(vis_t)}</h2><p class="lead">{e(vis_s)}</p>
        <figure class="vis-foto">{foto(p, 'prepatec', '(min-width: 980px) 480px, 100vw')}<figcaption class="mono">FIG. 02 — CONSTRUIR EN COMUNIDAD</figcaption></figure></div>
      <ol class="vis-lista">{vision}</ol>
    </div>
  </section>

  <section class="sec" id="especificaciones">
    <div class="marco">
      <div class="eq-cab"><span class="mono eq-etq">ESPECIFICACIONES</span><h2 class="eq-h2">Habilidades, certificaciones y reconocimientos</h2></div>
      <div class="specs">
        <div class="spec"><h3 class="mono">HABILIDADES</h3><ul class="habs">{habs}</ul></div>
        <div class="spec"><h3 class="mono">CERTIFICACIONES</h3><table class="tabla-spec"><tbody>{certs}</tbody></table>
          <h3 class="mono" style="margin-top:34px">RECONOCIMIENTOS</h3><table class="tabla-spec"><tbody>{recs}</tbody></table></div>
        <figure class="spec-foto">{foto(p, 'reconocimiento', '(min-width: 980px) 340px, 80vw')}<figcaption class="mono">FIG. 03 — RECONOCIMIENTO</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="sec suave plano" id="contacto">
    <div class="marco eq-contacto">
      <div>
        <span class="mono eq-etq">AGENDA</span>
        <h2 class="eq-h2">Platiquemos sobre tu proyecto o tu comunidad.</h2>
        <p class="lead">Agenda una sesión 1:1 o una mentoría con {e(primero)}: eliges el tipo de sesión, el día y la hora, y te llega la confirmación a tu correo.</p>
        <div class="botones"><a class="btn tinta" href="{agendar}" rel="noopener">{ICO_CAL} Agendar una sesión {FLECHA}</a><a class="btn blanco" href="{wa_url}" target="_blank" rel="noopener">WhatsApp</a></div>
      </div>
      <ul class="eq-medios">
        <li><a href="mailto:{p['correo']}">{ICO_MAIL}<span><small class="mono">CORREO</small>{e(p['correo'])}</span></a></li>
        <li><a href="{wa_url}" target="_blank" rel="noopener">{ICO_WA}<span><small class="mono">WHATSAPP</small>{e(p['tel'])}</span></a></li>
        <li><a href="{p['linkedin']}" target="_blank" rel="noopener">{ICO_IN}<span><small class="mono">LINKEDIN</small>in/ximena-pastor</span></a></li>
        <li><a href="{p['instagram']}" target="_blank" rel="noopener">{ICO_IG}<span><small class="mono">INSTAGRAM</small>@ximenaaguilar1</span></a></li>
      </ul>
    </div>
  </section>

  <section class="eq-firma"><div class="marco"><p class="mono"><span>{LOGO}</span>Página del Equipo Vorka · diseñada y desarrollada por Vorka México</p></div></section>
</main>
{pie()}'''
    return (cabeza(titulo, desc, ruta, extra=extra).replace(f'{SITIO}/img/ciudades/cdmx-reforma-1600.webp', og) + cuerpo + '\n</body>\n</html>\n')


def paginas_equipo():
    return {f"equipo/{p['slug']}/index.html": pagina_persona(p) for p in EQUIPO}
