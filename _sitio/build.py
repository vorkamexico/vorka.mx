# Vorka México · genera las páginas principales del sitio
# Uso: python3 _sitio/build.py   (desde la raíz del repo vorka.mx)
# Páginas: / · /servicios/ · /servicios/<slug>/ · /agenda/ · /fc/ · /nosotros/ · /contacto/ · /404.html
import os, sys, json, re
sys.path.insert(0, os.path.dirname(__file__))
from partes import *
from datos import SERVICIOS, FORMATOS, PREGUNTAS, MOMENTOS, PREGUNTAS_CORTAS, PASOS_CORTOS, EJEMPLOS
from agenda import pagina_agenda
from fc import actualizar_fc
from equipo import paginas_equipo
from institucional import pagina_nosotros, pagina_contacto, ORG_ID

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def escribir(ruta, contenido):
    p = os.path.join(RAIZ, ruta)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(contenido)
    print('·', ruta, f'{len(contenido) // 1024} KB')

def faq_html(lista):
    return ''.join(f'<details class="rv"><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in lista)

# ---------------------------------------------------------------- inicio
# Estructura (v4): qué es Vorka en una frase → las tres rutas (servicios · tienda y apps · Vorka Learn) → servicios en una
# línea y cómo trabajamos → Vorka Learn → presencia y Sparks → formulario corto. Un solo CTA: «Platiquemos».
# Las anclas viejas siguen vivas (#servicios, #momentos, #proceso, #red, #sparks) porque páginas hechas a mano las usan.
SECTORES = ['Sector público federal', 'Gobiernos estatales y municipales', 'Banca y finanzas', 'Grupos industriales', 'Empresas familiares',
            'Organizaciones civiles', 'Campañas y partidos', 'Startups', 'Medios y comunicación']
CIUDADES = ['Monterrey', 'Ciudad de México', 'Guadalajara', 'Querétaro', 'Celaya']
# Secciones reales de Vorka Learn (las sirve el Worker de _tienda: src/learn/datos.js › secciones()). Si se agrega una, súmala aquí.
LEARN_EXAMENES = [('/learn/paa/', 'PAA'), ('/learn/unam/', 'UNAM'), ('/learn/ecoems/', 'ECOEMS'), ('/learn/prepa-ug/', 'Prepa UG')]
LEARN_TEMAS = [('/learn/camino/', 'Elegir tu camino'), ('/learn/finanzas/', 'Finanzas personales'), ('/learn/negocio/', 'Negocio pequeño'), ('/learn/apps/', 'Crea tu app')]
TIENDA = [('/simulador-paa/', 'Simuladores de examen (PAA, UNAM, ECOEMS, prepa UG)'), ('/tienda/brindi/', 'Brindi: invitaciones digitales con QR'),
          ('/tienda/cupo/', 'Cupo: eventos con registro y check-in'), ('/tienda/vuelve/', 'Vuelve: tarjetas de lealtad'), ('/tienda/agenda/', 'Agenda: citas en línea')]
def ligas(lista, clase='v4-tags'):
    return f'<div class="{clase}">' + ''.join(f'<a href="{h}">{e(t)}</a>' for h, t in lista) + '</div>'

# ---- piezas cortas de servicios (v5): el índice y el inicio dicen lo mínimo; el detalle vive en /servicios/<slug>/
def pasos_html():
    """«Cómo empezamos» en tres pasos de una línea (id="proceso": el pie y páginas viejas enlazan /servicios/#proceso)."""
    pasos = ''.join(f'<li><b>{i}</b><span>{e(t)}</span></li>' for i, t in enumerate(PASOS_CORTOS, 1))
    return f'''<div class="v5-proceso" id="proceso">
      <h2 class="t3">Cómo empezamos</h2>
      <ol class="v5-pasos">{pasos}</ol>
    </div>'''

def tarjetas_servicio():
    return '<div class="v5-servs">' + ''.join(f'''<a class="v5-serv" href="/servicios/{s['slug']}/">
        <span class="v5-ico">{ICONOS[s['icono']]}</span>
        <h3>{s['area']}</h3><p>{e(s['breve'])}</p>
        <span class="v4-liga">Ver más {FLECHA}</span></a>''' for s in SERVICIOS) + '</div>'

def ejemplos_html(titulo_id="t-hecho", fondo=""):
    """«Lo que hemos hecho»: trabajo propio que se puede abrir hoy (datos.EJEMPLOS)."""
    tarjetas = ''.join(f'''<a class="v5-ej" href="{h}">
        <img src="/img/trabajo/{k}-800.webp" width="800" height="600" alt="{e(alt)}" loading="lazy" decoding="async">
        <span class="v5-ej-txt"><small>{e(et)}</small><b>{e(t)}</b><span>{e(d)}</span></span></a>''' for h, k, et, t, d, alt in EJEMPLOS)
    return f'''<section class="v4-sec {fondo}" id="hecho" aria-labelledby="{titulo_id}">
  <div class="marco">
    <div class="v4-cab"><span class="etiqueta">Ejemplos</span><h2 class="t2" id="{titulo_id}">Lo que hemos hecho</h2>
      <p class="lead">Productos y proyectos propios, en línea hoy. Ábrelos y pruébalos.</p></div>
    <div class="v5-ejs">{tarjetas}</div>
  </div>
</section>'''

def banda_ciudades(cifras=True):
    """Banda de descanso: mosaico de tres ciudades base. Con cifras (respaldadas por el dueño) o solo con las ciudades."""
    texto = ('<p class="v5-cifras"><span><b>150+</b> proyectos</span><span><b>26</b> estados</span><span><b>180+</b> municipios</span>'
             '<span><b>40+</b> consultores senior</span><span>Formación <b>HBS · Tec</b></span></p>') if cifras else \
            '<p class="v5-cifras"><span>Bases en <b>Monterrey, CDMX, Guadalajara, Querétaro y Celaya</b></span></p>'
    return f'''<section class="v5-banda" aria-label="Dónde trabajamos">
  <div class="marco">
    <div class="v5-mosaico">
      <figure class="a">{img('monterrey-skyline', sizes='(max-width: 760px) 100vw, 640px')}</figure>
      <figure class="b">{img('cdmx-reforma', sizes='(max-width: 760px) 50vw, 320px')}</figure>
      <figure class="c">{img('guadalajara', sizes='(max-width: 760px) 50vw, 320px')}</figure>
    </div>
    {texto}
  </div>
</section>'''

def banda_foto(nombre, pie=''):
    """Banda de descanso: una foto ancha (alt de FOTOS) con una línea corta opcional."""
    leyenda = f'<figcaption>{e(pie)}</figcaption>' if pie else ''
    return f'''<div class="v5-banda">
  <div class="marco"><figure class="v5-ancha">{img(nombre, sizes='(max-width: 1280px) 100vw, 1200px')}{leyenda}</figure></div>
</div>'''

def inicio():
    servicios_li = ''.join(f'<li>{s["area"]}</li>' for s in SERVICIOS)
    tienda_li = ''.join(f'<li>{e(t)}</li>' for _, t in TIENDA)
    learn_li = ''.join(f'<li>{e(t)}</li>' for t in ['Exámenes de admisión: PAA, UNAM, ECOEMS y prepa UG', 'Elegir carrera y becas', 'Finanzas personales', 'Negocio pequeño y crea tu app'])
    check = ICONOS['check']
    cuerpo = f'''{nav(cta=('#platiquemos', 'Platiquemos'))}
<main id="contenido">
<section class="v4-hero centro" aria-labelledby="t-hero">
  <div class="marco">
    <span class="etiqueta">Vorka México</span>
    <h1 class="t1" id="t-hero" style="margin-top:18px">Te ayudamos a decidir, ejecutar y hacerte escuchar.</h1>
    <p class="lead">Somos una consultora de estrategia, liderazgo y comunicación que además construye apps y páginas a la medida, para empresas, gobiernos y organizaciones. También tenemos una tienda de apps y guías gratuitas en Vorka Learn.</p>
    <div class="botones"><a class="btn tinta" href="#platiquemos">Platiquemos {FLECHA}</a><a class="btn blanco" href="/servicios/">Ver servicios</a></div>
    <div class="v4-nota"><span>Diagnóstico de 20 minutos sin costo</span><span>Respuesta en máximo 2 días hábiles</span></div>
    <p class="v4-prueba"><b>150+</b> proyectos en <b>26 estados</b> · <b>40+</b> consultores senior en red activa</p>
  </div>
</section>

<section class="v4-sec" id="rutas" aria-labelledby="t-rutas" style="padding-top:0">
  <div class="marco">
    <h2 class="sr" id="t-rutas">Qué hacemos</h2>
    <div class="v4-rutas">
      <a class="v4-ruta tinta" href="/servicios/"><small>Para organizaciones</small><h3 class="t3">Servicios</h3>
        <p>Para empresas, gobiernos y organizaciones que necesitan tomar una decisión importante, fortalecer a su equipo, comunicar mejor o construir su sitio o su app.</p>
        <ul>{servicios_li}</ul><span class="v4-liga">Ver servicios {FLECHA}</span></a>
      <a class="v4-ruta" href="/tienda/"><small>Para tu negocio, evento o examen</small><h3 class="t3">Tienda y apps</h3>
        <p>Herramientas digitales listas para usar, hechas por Vorka.</p>
        <ul>{tienda_li}</ul><span class="v4-liga">Ir a la tienda {FLECHA}</span></a>
      <a class="v4-ruta" href="/learn/"><small>Para aprender, gratis</small><h3 class="t3">Vorka Learn</h3>
        <p>Guías gratis y sin registro, con fuentes oficiales citadas al final de cada una.</p>
        <ul>{learn_li}</ul><span class="v4-liga">Leer Vorka Learn {FLECHA}</span></a>
    </div>
  </div>
</section>

<section class="v4-sec suave" id="servicios" aria-labelledby="t-serv">
  <div class="marco" id="momentos">
    <div class="v4-cab"><span class="etiqueta">Servicios para organizaciones</span><h2 class="t2" id="t-serv">Cuatro servicios, un mismo equipo.</h2>
      <p class="lead">Empiezas con uno y sumas otro solo si hace falta.</p></div>
    {tarjetas_servicio()}
    {pasos_html()}
  </div>
</section>
{banda_ciudades(cifras=False)}
{ejemplos_html(fondo="suave")}

<section class="v4-sec" id="learn" aria-labelledby="t-learn">
  <div class="marco v4-learn">
    <div>
      <span class="etiqueta">Vorka Learn</span>
      <h2 class="t2" id="t-learn" style="margin-top:16px">Guías para tu examen, tu dinero y tu negocio.</h2>
      <p class="lead">Lo que conviene saber antes de presentar tu examen, cómo elegir carrera y pedir una beca, finanzas personales, negocio pequeño y cómo crear y vender tu propia app.</p>
      <ul class="v4-hechos">
        <li>{check}<span>Cada dato sale de la institución que lo publica, y lo citamos al final de cada guía.</span></li>
        <li>{check}<span>Gratis y sin registro. Si quieres practicar un examen, los simuladores están aparte.</span></li>
      </ul>
      <p style="margin-top:22px"><a class="v4-liga" href="/learn/">Ver todas las guías {FLECHA}</a></p>
    </div>
    <div>
      <div class="v4-grupo"><h3>Exámenes de admisión</h3>{ligas(LEARN_EXAMENES)}</div>
      <div class="v4-grupo"><h3>Temas</h3>{ligas(LEARN_TEMAS)}</div>
      <div class="v4-grupo"><h3>Para practicar</h3>{ligas([('/simulador-paa/', 'Simulador PAA'), ('/simulador-unam/', 'Simulador UNAM'), ('/simulador-ecoems/', 'Simulador ECOEMS'), ('/simulador-prepa-ug/', 'Simulador prepa UG')])}</div>
    </div>
  </div>
</section>

<section class="v4-sec suave" id="red" aria-labelledby="t-red">
  <div class="marco">
    <div class="v4-cab"><span class="etiqueta">Dónde estamos</span><h2 class="t2" id="t-red">Bases en cinco ciudades, proyectos en todo México.</h2></div>
    <div class="v4-dos" id="sparks">
      <div class="v4-caja">
        <h3 class="t3">Ciudades base</h3>
        <p>Trabajamos de forma presencial o a distancia en toda la República, con aliados locales.</p>
        <div class="v4-tags quietos">{''.join(f'<span>{c}</span>' for c in CIUDADES)}</div>
        <div class="v4-cifras"><div><b>150+</b><span>proyectos</span></div><div><b>26</b><span>estados con proyectos</span></div><div><b>180+</b><span>municipios atendidos</span></div><div><b>40+</b><span>consultores senior en red activa</span></div></div>
        <h3 class="t3" style="margin-top:26px">Experiencia en</h3>
        <div class="v4-tags quietos">{''.join(f'<span>{s}</span>' for s in SECTORES)}</div>
        <p style="margin-top:18px">Formación en Harvard Business School, Tec de Monterrey y ecosistemas de Silicon Valley.</p>
      </div>
      <div class="v4-caja">
        <h3 class="t3">Revista Sparks</h3>
        <p>Nuestro medio propio: historias de quienes mueven su comunidad y lo que vemos en el campo sobre decisiones y liderazgo en México.</p>
        <a class="v4-liga" href="/sparks/">Leer Sparks {FLECHA}</a>
        <form class="v4-boletin" novalidate aria-label="Boletín semanal de Sparks">
          <p style="margin:6px 0 0;font-weight:650;color:var(--fg)">Boletín semanal: una edición, siete minutos de lectura.</p>
          <input name="nombre" placeholder="Tu nombre" autocomplete="name" aria-label="Nombre">
          <input name="correo" type="email" placeholder="Tu correo" autocomplete="email" aria-label="Correo">
          <label class="casilla"><input type="checkbox" name="acepto" value="1"> Acepto recibir comunicaciones de Vorka México.</label>
          <button class="btn blanco chico" type="submit">Suscribirme</button>
          <p class="msg" role="status"></p>
        </form>
      </div>
    </div>
  </div>
</section>
{platiquemos('/', titulo='¿Tu organización necesita avanzar? Cuéntanos.', fondo='')}
</main>
{pie()}'''
    ld = {"@context": "https://schema.org", "@type": "ProfessionalService", "@id": ORG_ID, "name": "Vorka México", "url": SITIO, "logo": SITIO + "/vorka-logo.png",
          "description": "Consultora de estrategia, liderazgo y comunicación para empresas, gobiernos y organizaciones en México.", "email": CORREO, "telephone": "+52 81 1780 4869",
          "areaServed": "MX", "sameAs": [u for _, u, _ in REDES]}
    sitio_ld = {"@context": "https://schema.org", "@type": "WebSite", "name": "Vorka México", "url": SITIO + "/", "publisher": {"@id": ORG_ID}}
    extra = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (ld, sitio_ld))
    return cabeza('Vorka México: consultoría en estrategia, liderazgo y comunicación',
                  'Consultora mexicana de estrategia, liderazgo, comunicación y apps a la medida para empresas, gobiernos y organizaciones. 150+ proyectos en 26 estados. Platiquemos sin costo.',
                  '/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- servicios (índice)
# Corto (v5): una frase + una línea → 4 tarjetas (nombre, resultado, «Ver más») y cómo empezamos → banda con cifras →
# lo que hemos hecho → 4 preguntas → foto → formulario corto. El detalle de cada servicio vive en su subpágina.
def servicios_hub():
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in PREGUNTAS_CORTAS]}
    migas_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"}, {"@type": "ListItem", "position": 2, "name": "Servicios", "item": SITIO + "/servicios/"}]}
    cuerpo = f'''{nav('/servicios/', cta=('#platiquemos', 'Platiquemos'))}
<main id="contenido">
<section class="v4-hero v5-hero" aria-labelledby="t-hero">
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Servicios</span></div>
    <h1 class="t1" id="t-hero">Consultoría para decidir, ejecutar y hacerte escuchar.</h1>
    <p class="lead">Estrategia, liderazgo, comunicación y apps para empresas, gobiernos y organizaciones en México.</p>
    <div class="botones"><a class="btn tinta" href="#platiquemos">Platiquemos {FLECHA}</a><a class="btn blanco" href="#hecho">Ver ejemplos</a></div>
  </div>
</section>
<section class="v4-sec" aria-labelledby="t-serv" style="padding-top:0">
  <div class="marco">
    <h2 class="sr" id="t-serv">Servicios</h2>
    {tarjetas_servicio()}
    {pasos_html()}
  </div>
</section>
{banda_ciudades()}
{ejemplos_html(fondo='suave')}
<section class="v4-sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="v4-cab centro"><h2 class="t2" id="t-faq">Preguntas frecuentes</h2></div>
    <div class="faq">{faq_html(PREGUNTAS_CORTAS)}</div>
  </div>
</section>
{banda_foto('monterrey-silla')}
{platiquemos('/servicios/', sig=False)}
</main>
{pie('empresas')}'''
    extra = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (faq_ld, migas_ld))
    return cabeza('Consultoría en estrategia, liderazgo y comunicación · Vorka México',
                  'Cuatro servicios para empresas, gobiernos y organizaciones en México: Estrategia y Dirección, Liderazgo y Talento, Comunicación e Influencia, y Apps y páginas a la medida. Diagnóstico de 20 minutos sin costo.',
                  '/servicios/', og='monterrey-skyline', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- detalle de servicio
# Recortado: qué es, para quién, qué incluye, qué te llevas, preguntas y el mismo CTA arriba y abajo (formulario corto).
SEO_SERVICIO = {
    'estrategia': ('Consultoría en estrategia y dirección · Vorka México', 'Estrategia corporativa y pública, transformación, cultura, gobernanza y sucesión para empresas, gobiernos y fundaciones en México. Diagnóstico de 20 minutos sin costo.'),
    'liderazgo': ('Coaching ejecutivo y desarrollo de liderazgo · Vorka México', 'Coaching ejecutivo 1 a 1, coaching de equipos directivos, programas a la medida y assessment de talento en México. Diagnóstico de 20 minutos sin costo.'),
    'apps': ('Desarrollo de apps y páginas web a la medida · Vorka México', 'Sitios web, tiendas en línea, apps y sistemas a la medida, hechos por el equipo que construyó y opera Agenda, Vuelve, Cupo, Brindi y Vorka Learn. Diagnóstico de 20 minutos sin costo.'),
    'influencia': ('Comunicación estratégica, redes y manejo de crisis · Vorka México', 'Narrativa, redes sociales, diseño, video, campañas digitales, PR, vocería, manejo de crisis y sitio web bajo una sola dirección. Diagnóstico de 20 minutos sin costo.'),
}

def servicio(s):
    caps = ''.join(f'<article><h3>{e(t)}</h3><p>{e(d)}</p></article>' for t, d in s['items'])
    ents = ''.join(f'<article>{ICONOS[ic]}<h3>{e(t)}</h3><p>{e(d)}</p></article>' for ic, t, d in s['entregables'])
    otros = ''.join(f'<a class="btn blanco" href="/servicios/{o["slug"]}/">{o["area"]}</a>' for o in SERVICIOS if o is not s)
    titulo_form = re.sub(r'<[^>]+>', '', s['cta'])
    datos = ''.join(f'<div><b>{e(b)}</b><span>{e(t)}</span></div>' for b, t in s['datos'])
    datos = f'<div class="datos">{datos}</div>' if datos else ''
    # Trabajo propio (solo «Apps y páginas»): productos de Vorka que se pueden ver hoy
    propios = ''.join(f'<a class="v4-propio" href="{h}"><b>{e(n)}</b><span>{e(d)}</span></a>' for h, n, d in s.get('propios', []))
    propios = f'''<section class="v4-sec" aria-labelledby="t-prop" style="padding-top:0">
  <div class="marco">
    <div class="v4-cab"><h2 class="t2" id="t-prop">Lo que ya construimos y operamos</h2><p class="lead">Son productos propios de Vorka, en línea hoy. Puedes abrir cada uno y probarlo.</p></div>
    <div class="v4-propios">{propios}</div>
  </div>
</section>''' if propios else ''
    cuerpo = f'''{nav('/servicios/', cta=('#platiquemos', 'Platiquemos'))}
<main id="contenido">
<section class="v4-hero" aria-labelledby="t-hero">
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/servicios/">Servicios</a><span>/</span><span>{s['area']}</span></div>
    <span class="etiqueta">Servicio {s['num']}</span>
    <h1 class="t1" id="t-hero" style="margin-top:18px">{s['area']}</h1>
    <p class="lead">{e(s['promesa'])}</p>
    <dl class="v5-corto" aria-label="En corto">
      <div><dt>Resultado</dt><dd>{e(s['breve'])}</dd></div>
      <div><dt>Para quién</dt><dd>{e(s['quien'])}</dd></div>
      <div><dt>Primer paso</dt><dd>Diagnóstico de 20 minutos, sin costo.</dd></div>
    </dl>
    <div class="botones"><a class="btn tinta" href="#platiquemos">Platiquemos {FLECHA}</a><a class="btn blanco" href="#incluye">Qué incluye</a></div>
    {datos}
  </div>
</section>
{banda_foto(s['cabecera'])}
<section class="v4-sec" id="incluye" aria-labelledby="t-inc">
  <div class="marco">
    <div class="v4-cab"><h2 class="t2" id="t-inc">Qué incluye</h2><p class="lead">Tomamos solo lo que tu caso necesita.</p></div>
    <div class="v4-lista">{caps}</div>
  </div>
</section>
{propios}
<section class="v4-sec suave" aria-labelledby="t-ent">
  <div class="marco">
    <div class="v4-cab"><h2 class="t2" id="t-ent">Qué te llevas</h2><p class="lead">{e(s['resultado'])}</p></div>
    <div class="v4-lista" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">{ents}</div>
  </div>
</section>
<section class="v4-sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="v4-cab centro"><span class="etiqueta">Antes de empezar</span><h2 class="t2" id="t-faq">Preguntas frecuentes</h2></div>
    <div class="faq">{faq_html(PREGUNTAS_CORTAS)}</div>
  </div>
</section>
{platiquemos(f"/servicios/{s['slug']}/", marcar=s['interes'], area=s['slug'], titulo=titulo_form)}
<section class="v4-sec" aria-label="Otros servicios" style="padding-top:clamp(40px,5vw,64px);padding-bottom:clamp(40px,5vw,64px)">
  <div class="marco"><p style="font-weight:650;margin-bottom:14px">También podemos ayudarte con:</p><div class="v4-otros">{otros}<a class="btn blanco" href="/servicios/">Todos los servicios</a></div></div>
</section>
</main>
{pie('empresas')}'''
    ld = {"@context": "https://schema.org", "@type": "Service", "name": s['area'], "serviceType": s['area'], "description": f"{s['promesa']} {s['para']}",
          "url": f"{SITIO}/servicios/{s['slug']}/", "areaServed": {"@type": "Country", "name": "México"},
          "provider": {"@type": "ProfessionalService", "name": "Vorka México", "url": SITIO + "/"},
          "potentialAction": {"@type": "ReserveAction", "name": "Agenda tu diagnóstico sin costo", "target": f"{SITIO}/agenda/?area={s['slug']}"}}
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"}, {"@type": "ListItem", "position": 2, "name": "Servicios", "item": SITIO + "/servicios/"},
        {"@type": "ListItem", "position": 3, "name": s['area'], "item": f"{SITIO}/servicios/{s['slug']}/"}]}
    extra = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (ld, migas))
    titulo, desc = SEO_SERVICIO.get(s['slug'], (f"{s['area']} · Vorka México", f"{s['promesa']} {s['para']}"))
    return cabeza(titulo, desc, f"/servicios/{s['slug']}/", og=s['cabecera'], extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- 404
def no_encontrada():
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="cabecera" style="min-height:100svh;display:flex;align-items:center">
  {v_metal('v-fondo', 'g4', oscuro=False)}
  <div class="marco">
    <span class="etiqueta">Error 404</span>
    <h1 class="h1" style="margin-top:18px">Esta ruta no está <span class="metal">en el mapa.</span></h1>
    <p class="lead">La página que buscas cambió de lugar o ya no existe. Desde aquí te llevamos a donde sí pasan las cosas.</p>
    <div class="botones"><a class="btn tinta" href="/">Ir al inicio {FLECHA}</a><a class="btn blanco" href="/servicios/">Ver servicios</a><a class="btn blanco" href="/sparks/">Revista Sparks</a></div>
  </div>
</section>
</main>
{pie()}'''
    return cabeza('Página no encontrada · Vorka México', 'La página que buscas no existe.', '/404.html', extra='<meta name="robots" content="noindex">\n') + cuerpo + '\n</body>\n</html>\n'

if __name__ == '__main__':
    escribir('index.html', inicio())
    escribir('servicios/index.html', servicios_hub())
    for s in SERVICIOS:
        escribir(f"servicios/{s['slug']}/index.html", servicio(s))
    escribir('agenda/index.html', pagina_agenda())
    with open(os.path.join(RAIZ, 'fc/index.html'), encoding='utf-8') as f:
        escribir('fc/index.html', actualizar_fc(f.read()))
    for ruta, html in paginas_equipo().items():
        escribir(ruta, html)
    escribir('nosotros/index.html', pagina_nosotros())
    escribir('contacto/index.html', pagina_contacto())
    escribir('404.html', no_encontrada())
