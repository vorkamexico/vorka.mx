# Vorka México · genera las páginas principales del sitio
# Uso: python3 _sitio/build.py   (desde la raíz del repo vorka.mx)
# Páginas: / · /servicios/ · /servicios/<slug>/ · /agenda/ · /fc/ · /404.html
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from partes import *
from datos import SERVICIOS, FORMATOS, PREGUNTAS, MOMENTOS
from agenda import pagina_agenda
from fc import pagina_fc

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOGO_DECO = LOGO.replace('<svg ', '<svg class="v-deco" ')

def escribir(ruta, contenido):
    p = os.path.join(RAIZ, ruta)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(contenido)
    print('·', ruta, f'{len(contenido) // 1024} KB')

def palabras(texto, metal_desde):
    """Titular que aparece palabra por palabra; las últimas llevan el degradado metálico."""
    out = []
    for i, p in enumerate(texto.split()):
        clase = 'p metal' if i >= metal_desde else 'p'
        out.append(f'<span class="{clase}" style="--i:{i}">{e(p)}</span>')
    return ' '.join(out)

VENTANA = [('monterrey-silla', 'Monterrey', '50% 60%'), ('cdmx-reforma', 'Ciudad de México', '30% 50%'), ('guadalajara', 'Guadalajara', '50% 45%'),
           ('queretaro', 'Querétaro', '40% 50%'), ('celaya', 'Celaya', '50% 40%')]
SECTORES = ['Sector público federal', 'Gobiernos estatales y municipales', 'Banca y finanzas', 'Grupos industriales', 'Empresas familiares',
            'Organizaciones civiles', 'Campañas y partidos', 'Startups', 'Medios y comunicación']

def chispa():
    return '<svg class="chispa" viewBox="0 0 130 40" aria-hidden="true"><defs><linearGradient id="ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B2A85" stop-opacity=".25"/><stop offset="1" stop-color="#6B2A85" stop-opacity="0"/></linearGradient></defs><path d="M0 32 L16 30 L30 33 L44 24 L58 26 L72 18 L86 20 L100 11 L114 13 L130 4 L130 40 L0 40Z" fill="url(#ch)"/><path d="M0 32 L16 30 L30 33 L44 24 L58 26 L72 18 L86 20 L100 11 L114 13 L130 4" fill="none" stroke="#6B2A85" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>'

def escena():
    cuadros = ''.join(svg_cuadro(n, f, i == 0, c) for i, (n, c, f) in enumerate(VENTANA))
    caras = ''.join(f'<i style="background-image:url(/img/ciudades/{n}-960.webp)"></i>' for n in ['monterrey', 'cdmx', 'guadalajara'])
    return f'''<div class="escena" aria-hidden="true">
    {v_contorno('contorno-v', 'vc')}
    {ventana_svg(cuadros, 'vv')}
    <div class="flota f1" data-z="1.4"><div class="tarjeta"><div class="fila-t"><span class="ok">{ICONOS['check']}</span><div><span class="t">Diagnóstico agendado</span><b>Jueves · 10:00</b><small>45 min · videollamada</small></div></div></div></div>
    <div class="flota f2" data-z="1"><div class="tarjeta"><span class="t">Prioridades del trimestre</span><div class="barras"><div>Estructura<span><i style="--w:86%"></i></span></div><div>Talento<span><i style="--w:62%"></i></span></div><div>Narrativa<span><i style="--w:40%"></i></span></div></div></div></div>
    <div class="flota f3" data-z="1.2"><div class="tarjeta"><span class="t">Conversación pública</span><b>Tendencia al alza</b>{chispa()}</div></div>
    <div class="flota f4" data-z=".8"><div class="tarjeta"><span class="t"><span class="punto"></span>Equipo en campo</span><b id="lugar">Monterrey</b></div></div>
    <div class="flota f5" data-z="1.8"><div class="icono-app ia-1">{ICONOS['brujula']}</div></div>
    <div class="flota f6" data-z="1.6"><div class="icono-app ia-2">{ICONOS['megafono']}</div></div>
    <div class="flota f7" data-z="2"><div class="icono-app ia-3">{ICONOS['personas']}</div></div>
    <div class="flota f8" data-z="1.1"><div class="tarjeta"><div class="fila-t"><div class="caras">{caras}</div><div><b>40+ consultores</b><small>senior, en red activa</small></div></div></div></div>
    <div class="escena-pie"></div>
  </div>'''

def caja_servicio(s, clase, mini='', foto_n=None, foco='70% 50%'):
    tags = ''.join(f'<span>{e(t)}</span>' for t in s['tags'][:5])
    fondo = f'<div class="foto-c" style="--foco:{foco}">{img(foto_n, "(max-width: 1020px) 100vw, 66vw", alt="")}</div>' if foto_n else ''
    extra = mini or f'<div class="chips-c">{tags}</div>'
    return f'''<a class="caja {clase} rv" href="/servicios/{s['slug']}/">{fondo}
      <span class="etq">Servicio {s['num']}<span class="ir">{FLECHA}</span></span>
      <h3 class="h3">{s['area']}</h3><p>{e(s['corta'])}</p>
      {extra}
    </a>'''

def faq_html(lista):
    return ''.join(f'<details class="rv"><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in lista)

def svg_cuadro(nombre, foco, activa=False, lugar=''):
    # La foto se recorta con la forma de la V (SVG clipPath: más estable que mask-image)
    x, y = [float(v.strip('%')) / 100 for v in foco.split()]
    alin = f"xM{'in' if x < .34 else 'id' if x < .67 else 'ax'}YM{'in' if y < .34 else 'id' if y < .67 else 'ax'}"
    ancho = 1600 if activa else 960
    return (f'<image class="cuadro{" activa" if activa else ""}" data-lugar="{lugar}" href="/img/ciudades/{nombre}-{ancho}.webp" '
            f'x="69" y="225" width="940" height="909" preserveAspectRatio="{alin} slice"/>')

def ventana_svg(cuadros, uid, clase='ventana-v'):
    return (f'<svg class="{clase}" viewBox="69 225 940 909" aria-hidden="true"><defs><clipPath id="{uid}">{V_PATHS}</clipPath></defs>'
            f'<rect x="69" y="225" width="940" height="909" fill="#0F0D10" clip-path="url(#{uid})"/><g clip-path="url(#{uid})">{cuadros}</g></svg>')

def v_foto(nombre, foco='50% 50%'):
    return ventana_svg(svg_cuadro(nombre, foco, True), 'vf', 'ventana-v v-cab')

# ---------------------------------------------------------------- inicio
def inicio():
    est, lid, inf = SERVICIOS
    mini_lid = '''<div class="mini lista-mini">
        <div class="hecho"><span class="cuadro-c"></span>Mapa de brechas</div>
        <div class="hecho"><span class="cuadro-c"></span>Plan de desarrollo</div>
        <div><span class="cuadro-c"></span>Sesión: decisiones críticas<em>Hoy</em></div>
        <div><span class="cuadro-c"></span>Simulacro de entrevista<em>Jue</em></div></div>'''
    barras = ''.join(f'<i style="--h:{h}%"></i>' for h in [28, 34, 30, 42, 46, 58, 70, 88])
    mini_inf = f'<div class="mini"><div class="dato-g"><span>Alcance por semana</span><b>↑</b></div><div class="grafica">{barras}</div></div>'
    bento = (caja_servicio(est, 'osc c-a', foto_n='monterrey-torres', foco='50% 30%')
             + caja_servicio(lid, 'c-b', mini_lid) + caja_servicio(inf, 'c-c', mini_inf)
             + '<div class="caja c-d rv"><span class="etq">Monitoreo</span><div class="cifra-c">24/7</div><p>De conversación pública y crisis para clientes activos.</p></div>'
             + '<div class="caja c-e rv"><span class="etq">Producción</span><div class="cifra-c">100%</div><p>Contenido, diseño y video hechos en casa.</p></div>'
             + f'<a class="caja c-oro c-f rv" href="/agenda/"><span class="etq">Empieza aquí<span class="ir">{FLECHA}</span></span><h3 class="h3">Diagnóstico sin costo</h3><p>45 minutos para entender tu reto y decirte cómo lo resolveríamos.</p>{LOGO_DECO}</a>')
    pasos = [('Diagnóstico', 'Escuchamos primero: contexto real, objetivos verdaderos y la brecha entre lo que se dice y lo que pasa.', 'proyecto / diagnóstico'),
             ('Diseño', 'Construimos la intervención a la medida, combinando solo lo que tu contexto exige.', 'proyecto / plan'),
             ('Activación', 'Operamos dentro de tu organización hasta que el cambio funciona solo.', 'proyecto / tablero'),
             ('Medición', 'Indicadores acordados desde el inicio. El impacto, no las horas, es la métrica.', 'proyecto / resultados')]
    botones_p = ''.join(f'<button class="paso-b" type="button" role="tab" data-ruta="{r}"><span class="n">0{i + 1}</span><b>{t}</b><span>{d}</span><i class="barra"></i></button>' for i, (t, d, r) in enumerate(pasos))
    barras2 = ''.join(f'<i style="--h:{h}%"></i>' for h in [20, 26, 31, 38, 44, 52, 60, 66, 74, 82, 90])
    pantallas = f'''<div class="pantalla"><h4>Entrevistas <em>6 de 8</em></h4>
        <div class="nota-p"><b>Dirección general</b>“Sabemos a dónde queremos ir; lo que no tenemos claro es en qué orden.”</div>
        <div class="nota-p"><b>Consejo</b>“Necesitamos indicadores que todos entendamos igual.”</div>
        <div class="nota-p"><b>Equipo operativo</b>“Los cambios llegan por correo y nadie los aterriza.”</div></div>
      <div class="pantalla"><h4>Plan de trabajo <em>12 semanas</em></h4>
        <div class="gantt"><div>Estructura<span><i style="--a:0%;--w:42%"></i></span></div><div>Talento<span><i style="--a:22%;--w:48%"></i></span></div><div>Narrativa<span><i style="--a:40%;--w:44%"></i></span></div><div>Indicadores<span><i style="--a:6%;--w:90%"></i></span></div></div>
        <div class="nota-p" style="margin-top:18px"><b>Criterio de decisión</b>Primero lo que destraba la operación; después lo que la hace crecer.</div></div>
      <div class="pantalla"><h4>Tablero <em>en curso</em></h4>
        <div class="tablero-p"><div><small>Por hacer</small><p style="--c:#A8A4A9">Taller con segunda línea</p><p style="--c:#A8A4A9">Manual de voz</p></div>
          <div><small>En curso</small><p style="--c:#6B2A85">Nuevo comité de dirección</p><p style="--c:#C8A45C">Calendario de contenido</p><p style="--c:#6B2A85">Coaching 1:1</p></div>
          <div><small>Listo</small><p style="--c:#2B8553">Mapa de prioridades</p><p style="--c:#2B8553">Diagnóstico de cultura</p></div></div></div>
      <div class="pantalla"><h4>Resultados <em>contra objetivos</em></h4>
        <div class="kpis"><div><small>Prioridades cumplidas</small><b>4 de 5</b></div><div><small>Adopción del modelo</small><b>Alta</b></div></div>
        <div class="grafica" style="height:150px">{barras2}</div></div>'''
    momentos = ''.join(f'''<a class="momento rv" href="/agenda/?momento={l}" style="--d:{i * .08}s">
        <span class="letra-v">{l}</span><h3 class="h3" style="font-size:22px">{e(t)}</h3><p>{e(d)}</p>
        <span class="para"><span>Ideal para: {e(p)}</span>{FLECHA}</span></a>''' for i, (l, t, d, p) in enumerate(MOMENTOS))
    nodos = [('monterrey-skyline', 'Monterrey', 'Industria · finanzas', 80, 14), ('cdmx-chapultepec', 'CDMX', 'Gobierno · corporativos', 86, 62),
             ('queretaro', 'Querétaro', 'Industria del Bajío', 58, 86), ('celaya', 'Celaya', 'Casa de Sparks', 28, 84), ('guadalajara', 'Guadalajara', 'Empresa · cultura', 10, 50)]
    cx, cy = 46, 42
    lineas = ''
    for k, (_, _, _, x, y) in enumerate(nodos):
        d = f'M{cx} {cy} Q{(cx + x) / 2 + (y - cy) * .25:.1f} {(cy + y) / 2 - (x - cx) * .25:.1f} {x} {y}'
        lineas += f'<path class="linea" d="{d}" vector-effect="non-scaling-stroke"/><path class="flujo" d="{d}" vector-effect="non-scaling-stroke" style="animation-delay:-{k * .5}s"/>'
    nodos_html = ''.join(f'<div class="nodo" style="left:{x}%;top:{y}%"><span class="f">{img(n, "120px", alt="")}</span><b>{c}</b><small>{s}</small></div>' for n, c, s, x, y in nodos)
    caras = ''.join(f'<i style="background-image:url(/img/ciudades/{n}-960.webp)"></i>' for n in ['cdmx-reforma', 'monterrey-silla', 'guadalajara', 'queretaro'])
    cinta = ''.join(f'<span>{s}</span>' for s in SECTORES * 2)
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="portada" aria-labelledby="t-hero">
  <div class="marco portada-c">
    <a class="aviso entra" href="/agenda/" style="--d:.05s"><b>Nuevo</b>Diagnóstico estratégico sin costo{FLECHA}</a>
    <h1 class="h-hero" id="t-hero">{palabras('Definimos el juego con quienes lo juegan.', 5)}</h1>
    <p class="lead entra" style="--d:.75s">Consultora de estrategia, liderazgo e influencia. Acompañamos a líderes, empresas y gobiernos en las decisiones que no admiten segundo intento.</p>
    <div class="botones entra" style="--d:.85s"><a class="btn tinta" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="/servicios/">Explorar servicios</a></div>
    <div class="prueba entra" style="--d:.95s"><span class="caras">{caras}</span><span><b style="color:var(--fg)" class="num">150+</b> proyectos en <b style="color:var(--fg)">26 estados</b></span></div>
  </div>
  <div class="marco">{escena()}</div>
</section>

<section class="sectores" aria-label="Experiencia">
  <p>Experiencia operativa en</p>
  <div class="cinta" aria-hidden="true"><div class="cinta-pista">{cinta}</div></div>
</section>

<section class="sec" id="servicios" aria-labelledby="t-serv">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Qué hacemos</span><h2 class="h2" id="t-serv">Tres capacidades. <span class="metal">Un solo equipo.</span></h2>
      <p class="lead">No vendemos horas ni entregables sueltos: combinamos estrategia, liderazgo e influencia según lo que tu momento exige.</p></div>
    <div class="bento">{bento}</div>
    <p class="rv" style="text-align:center;margin-top:28px"><a class="flecha" href="/servicios/">Comparar los servicios {FLECHA}</a></p>
  </div>
</section>

<section class="sec suave" id="proceso" aria-labelledby="t-proc">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Cómo trabajamos</span><h2 class="h2" id="t-proc">Cuatro fases. <span class="metal">Sin atajos.</span></h2></div>
      <p class="lead">Diagnóstico antes de proponer, diseño antes de ejecutar, medición antes de cerrar. Así se ve un proyecto con nosotros.</p></div>
    <div class="proceso">
      <div class="pasos rv" role="tablist" aria-label="Fases">{botones_p}</div>
      <div class="app-v rv" aria-hidden="true"><div class="barra-v"><i></i><i></i><i></i><span id="ruta-app">proyecto / diagnóstico</span></div><div class="pantallas">{pantallas}</div></div>
    </div>
  </div>
</section>

<section class="sec" id="momentos" aria-labelledby="t-mom">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">¿Cuándo llamarnos?</span><h2 class="h2" id="t-mom">Tres momentos. <span class="metal">¿Cuál es el tuyo?</span></h2>
      <p class="lead">No trabajamos con quien observa; trabajamos con quien decide.</p></div>
    <div class="momentos">{momentos}</div>
  </div>
</section>

<section class="sec oscura redondo" id="red" aria-labelledby="t-red">
  <div class="grano"></div>
  <div class="marco red">
    <div class="rv">
      <span class="etiqueta">Presencia nacional</span>
      <h2 class="h2" id="t-red" style="margin-top:18px">Una red que cubre <span class="metal">todo México.</span></h2>
      <p class="lead" style="margin-top:20px">Bases en cinco ciudades, equipo propio de campo y aliados locales. Entendemos la diferencia entre operar en la CDMX y en Chiapas.</p>
      <div class="datos-red">
        <div><b class="num"><span data-cuenta="26">26</span></b><span>estados con proyectos</span></div>
        <div><b class="num"><span data-cuenta="180">180</span>+</b><span>municipios atendidos</span></div>
        <div><b class="num"><span data-cuenta="45">45</span></b><span>alianzas locales</span></div>
        <div><b class="num"><span data-cuenta="3">3</span></b><span>sectores: público, privado y civil</span></div>
      </div>
    </div>
    <div class="mapa rv" aria-hidden="true">
      <svg class="lineas" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="oro-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6CF96"/><stop offset="1" stop-color="#C8A45C"/></linearGradient></defs>{lineas}</svg>
      <div class="nodo centro" style="left:{cx}%;top:{cy}%"><span class="f">{v_metal('', 'gn')}</span><b>Vorka</b></div>
      {nodos_html}
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="t-hue">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Nuestra huella</span><h2 class="h2" id="t-hue">Por qué podemos <span class="metal">responder rápido.</span></h2></div>
      <p class="lead">La experiencia da criterio, la tecnología da velocidad y el territorio da legitimidad.</p></div>
    <div class="pilares">
      <article class="pilar rv"><span class="ic">{ICONOS['brujula']}</span><h3 class="h3" style="font-size:22px">Trayectoria en decisiones difíciles</h3><p>Formación en Harvard Business School, Tec de Monterrey y ecosistemas de Silicon Valley. Experiencia en sector público federal, banca, industria e incidencia.</p>
        <dl><div><dt class="num">150+</dt><dd>proyectos con métricas verificables</dd></div><div><dt class="num">12</dt><dd>áreas de práctica sectorial</dd></div></dl></article>
      <article class="pilar rv" style="--d:.08s"><span class="ic">{ICONOS['rayo']}</span><h3 class="h3" style="font-size:22px">Consultora nativa digital</h3><p>Herramientas propias de analítica de opinión, escucha de redes y modelado de escenarios, bajo una misma dirección estratégica.</p>
        <dl><div><dt class="num">8</dt><dd>herramientas propias de análisis</dd></div><div><dt class="num">24/7</dt><dd>monitoreo para clientes activos</dd></div></dl></article>
      <article class="pilar rv" style="--d:.16s"><span class="ic">{ICONOS['globo']}</span><h3 class="h3" style="font-size:22px">Presencia nacional, no focus group</h3><p>Equipo de campo y red de aliados locales en toda la República, con contexto real de cada territorio.</p>
        <dl><div><dt class="num">180+</dt><dd>municipios con proyectos</dd></div><div><dt class="num">6</dt><dd>lenguas indígenas en la red</dd></div></dl></article>
    </div>
  </div>
</section>

<section class="sec pegada" id="sparks" aria-labelledby="t-spk">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Revista Sparks</span><h2 class="h2" id="t-spk">Lo que vemos en el campo, <span class="metal">contado.</span></h2></div>
      <p class="lead">Nuestro medio propio: historias de quienes mueven su comunidad y lo que pensamos sobre decisiones, poder y liderazgo en México.</p></div>
    <div class="sparks-g">
      <div class="notas-h rv" id="notas-sparks">
        <a class="nota-h" href="/sparks/celaya/"><span class="im">{img('celaya', '(max-width: 600px) 100vw, 400px', alt='')}</span><span class="tx"><small>Sparks Celaya</small><b>Las historias de la gente que está moviendo Celaya</b></span></a>
        <a class="nota-h" href="/sparks/"><span class="im">{img('queretaro', '(max-width: 600px) 100vw, 400px', alt='')}</span><span class="tx"><small>Revista Sparks</small><b>Ediciones por municipio en el Bajío</b></span></a>
      </div>
      <div class="boletin rv">{LOGO_DECO}
        <h3 class="h3">Boletín semanal</h3>
        <p>Una edición por semana, siete minutos de lectura. Sin spam.</p>
        <form id="boletin" novalidate>
          <input name="nombre" placeholder="Tu nombre" autocomplete="name" aria-label="Nombre">
          <input name="correo" type="email" placeholder="Tu correo" autocomplete="email" aria-label="Correo">
          <label class="casilla"><input type="checkbox" name="acepto" value="1"> Acepto recibir comunicaciones de Vorka México.</label>
          <button class="btn plata" type="submit">Suscribirme</button>
          <p class="msg" role="status"></p>
        </form>
      </div>
    </div>
    <a class="caja tira rv" href="/voluntariado">
      <span class="letra-v">TV</span>
      <span class="tira-t"><b>Programa Tú en Vorka</b><span>Voluntariado estratégico para jóvenes de 16 a 29 años. Presencial en el Bajío y remoto en todo México.</span></span>
      <span class="flecha">Conocer el programa {FLECHA}</span>
    </a>
    <a class="caja tira tira-tienda tira-paa rv" href="/simulador-paa/">
      <span class="letra-v">PAA</span>
      <span class="tira-t"><b>Simulador PAA en línea</b><span>Practica el examen de admisión con cronómetro real, un tutor que te guía cuando fallas y un reporte de qué reforzar. Prueba un reactivo gratis.</span></span>
      <span class="flecha">Probar el simulador {FLECHA}</span>
    </a>
    <a class="caja tira tira-tienda rv" href="/tienda/">
      <span class="letra-v">Kit</span>
      <span class="tira-t"><b>Tienda Vorka México</b><span>Simuladores de examen, guías, cuadernos de trabajo y calculadoras que usamos con estudiantes y clientes.</span></span>
      <span class="flecha">Ver la tienda {FLECHA}</span>
    </a>
  </div>
</section>
{cierre()}
</main>
{pie()}'''
    ld = {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "Vorka México", "url": SITIO, "logo": SITIO + "/vorka-logo.png",
          "description": "Consultora de estrategia, liderazgo e influencia con presencia nacional.", "email": CORREO, "telephone": "+52 81 1780 4869",
          "areaServed": "MX", "sameAs": [u for _, u, _ in REDES]}
    extra = f'<link rel="preload" as="image" href="/img/ciudades/monterrey-silla-1600.webp" imagesrcset="/img/ciudades/monterrey-silla-960.webp 960w, /img/ciudades/monterrey-silla-1600.webp 1600w" imagesizes="720px" fetchpriority="high">\n<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    return cabeza('Vorka México · Estrategia, liderazgo e influencia', 'Consultora de estrategia con alcance nacional. Acompañamos a líderes, empresas y gobiernos en las decisiones que no admiten segundo intento. Agenda tu diagnóstico sin costo.', '/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- servicios (hub)
def servicios_hub():
    elegir = ''.join(f'<a class="rv" href="#{s["slug"]}" style="--d:{i * .06}s"><small>Si necesitas…</small><b>{e(s["necesitas"])}</b><span>{s["area"]} {FLECHA}</span></a>' for i, s in enumerate(SERVICIOS))
    bloques = ''
    for s in SERVICIOS:
        items = ''.join(f'<li>{e(t)}</li>' for t, _ in s['items'])
        ents = ''.join(f'<li>{e(t)}</li>' for _, t, _ in s['entregables'])
        bloques += f'''<article class="servicio rv" id="{s['slug']}">
      <div class="foto-r" style="--foco:{s['foco']}">{img(s['foto'], '(max-width: 920px) 100vw, 560px', alt='')}</div>
      <div>
        <span class="etiqueta">Servicio {s['num']}</span>
        <h2 class="h2">{s['titulo']}</h2>
        <p class="promesa">{e(s['promesa'])}</p>
        <dl class="ficha">
          <div><dt>Para quién</dt><dd>{e(s['para'])}</dd></div>
          <div><dt>Qué incluye</dt><dd><ul>{items}</ul></dd></div>
          <div><dt>Qué te llevas</dt><dd><ul>{ents}</ul></dd></div>
          <div><dt>Resultado</dt><dd>{e(s['resultado'])}</dd></div>
        </dl>
        <div class="botones"><a class="btn tinta" href="/servicios/{s['slug']}/">Ver el servicio completo {FLECHA}</a><a class="btn blanco" href="/agenda/?area={s['slug']}">Agendar diagnóstico</a></div>
      </div>
    </article>'''
    filas = ''.join(f'<tr><th scope="row">{s["area"]}</th><td>{e(s["necesitas"])}</td><td>{e(s["para"])}</td><td>{e(", ".join(t for _, t, _ in s["entregables"]))}</td><td><a href="/servicios/{s["slug"]}/">Ver detalle</a></td></tr>' for s in SERVICIOS)
    formatos = ''.join(f'<article class="formato rv" style="--d:{i * .08}s"><small>{e(k)}</small><h3 class="h3">{e(t)}</h3><p>{e(d)}</p></article>' for i, (k, t, d) in enumerate(FORMATOS))
    pasos = [('Paso 1', 'Diagnóstico sin costo', 'Llenas la solicitud y, si encaja, agendamos 45 minutos.'), ('Paso 2', 'Propuesta a la medida', 'Alcance, equipo, tiempos e inversión, en claro.'),
             ('Paso 3', 'Arranque', 'Definimos indicadores y empezamos dentro de tu organización.'), ('Paso 4', 'Resultados medibles', 'Reportes contra los objetivos acordados.')]
    pasos_html = ''.join(f'<div class="rv" style="--d:{i * .08}s"><small>{n}</small><h3>{t}</h3><p>{d}</p></div>' for i, (n, t, d) in enumerate(pasos))
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in PREGUNTAS]}
    cuerpo = f'''{nav('/servicios/')}
<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gh', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Servicios</span></div>
    <span class="etiqueta">Servicios</span>
    <h1 class="h1" style="margin-top:18px">Todo para decidir, ejecutar y <span class="metal">hacerte escuchar.</span></h1>
    <p class="lead">Tres capacidades que se combinan según tu momento. Aquí está, en claro, qué hace cada una, para quién es y qué te llevas.</p>
    <div class="botones"><a class="btn tinta" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="#comparar">Comparar servicios</a></div>
  </div>
</section>
<section class="sec pegada"><div class="marco"><div class="elegir">{elegir}</div></div></section>
<section class="sec pegada"><div class="marco">{bloques}</div></section>
<section class="sec pegada" id="comparar" aria-labelledby="t-comp">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Comparativo</span><h2 class="h2" id="t-comp">Los tres, <span class="metal">de un vistazo.</span></h2></div>
      <p class="lead">Si tu reto toca más de uno, los combinamos en una sola propuesta y bajo un mismo equipo.</p></div>
    <div class="tabla-w rv"><table class="tabla"><thead><tr><th>Servicio</th><th>Si necesitas</th><th>Ideal para</th><th>Qué te llevas</th><th></th></tr></thead><tbody>{filas}</tbody></table></div>
  </div>
</section>
<section class="sec oscura redondo" aria-labelledby="t-form">
  <div class="grano"></div>
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Formas de trabajar</span><h2 class="h2" id="t-form" style="margin-top:18px">A tu ritmo, <span class="metal">con el mismo rigor.</span></h2></div>
      <p class="lead">Elegimos juntos el formato después del diagnóstico, según el tamaño del reto y la velocidad que necesitas.</p></div>
    <div class="formatos">{formatos}</div>
    <div class="linea-pasos">{pasos_html}</div>
  </div>
</section>
<section class="sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" id="t-faq">Lo que todos <span class="metal">nos preguntan.</span></h2></div>
    <div class="faq">{faq_html(PREGUNTAS)}</div>
  </div>
</section>
{cierre()}
</main>
{pie('empresas')}'''
    extra = f'<script type="application/ld+json">{json.dumps(faq_ld, ensure_ascii=False)}</script>\n'
    return cabeza('Servicios · Vorka México', 'Estrategia y Dirección, Liderazgo y Talento, Comunicación e Influencia: qué incluye cada servicio, para quién es y qué te llevas. Agenda tu diagnóstico sin costo.', '/servicios/', og='monterrey-skyline', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- detalle de servicio
def servicio(s):
    caps = ''.join(f'<article class="capacidad rv" style="--d:{(i % 3) * .06}s"><span class="n">{i + 1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (t, d) in enumerate(s['items']))
    ents = ''.join(f'<article class="entregable rv" style="--d:{i * .06}s">{ICONOS[ic]}<h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (ic, t, d) in enumerate(s['entregables']))
    pasos = ''.join(f'<div class="rv" style="--d:{i * .08}s"><small>Fase 0{i + 1}</small><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(s['pasos']))
    datos = ''.join(f'<div><b>{e(b)}</b><span>{e(t)}</span></div>' for b, t in s['datos'])
    otros = ''.join(caja_servicio(o, 'osc', foto_n=o['foto'], foco=o['foco']) for o in SERVICIOS if o is not s)
    cuerpo = f'''{nav('/servicios/')}
<main id="contenido">
<section class="cabecera cab-servicio">
  {v_foto(s['cabecera'], s['cab_foco'])}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/servicios/">Servicios</a><span>/</span><span>{s['area']}</span></div>
    <span class="etiqueta">Servicio {s['num']}</span>
    <h1 class="h1" style="margin-top:18px;max-width:640px">{s['titulo']}</h1>
    <p class="lead" style="max-width:520px">{e(s['promesa'])}</p>
    <div class="botones"><a class="btn tinta" href="/agenda/?area={s['slug']}">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="#incluye">Qué incluye</a></div>
    <div class="datos">{datos}</div>
  </div>
</section>
<section class="sec pegada" id="incluye" aria-labelledby="t-inc">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Qué incluye</span><h2 class="h2" id="t-inc">Capacidades que se combinan <span class="metal">según tu momento.</span></h2></div>
      <p class="lead"><b style="color:var(--fg)">Para quién:</b> {e(s['para'])}</p></div>
    <div class="capacidades">{caps}</div>
  </div>
</section>
<section class="sec oscura redondo" aria-labelledby="t-ent">
  <div class="grano"></div>
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Qué te llevas</span><h2 class="h2" id="t-ent" style="margin-top:18px">Entregables claros, <span class="metal">no presentaciones.</span></h2></div>
      <p class="lead">{e(s['resultado'])}</p></div>
    <div class="entregables">{ents}</div>
    <div class="linea-pasos">{pasos}</div>
  </div>
</section>
<section class="sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Antes de empezar</span><h2 class="h2" id="t-faq">Preguntas frecuentes</h2></div>
    <div class="faq">{faq_html(PREGUNTAS[:4])}</div>
  </div>
</section>
{cierre(s['cta'], destino=f"/agenda/?area={s['slug']}")}
<section class="sec" aria-labelledby="t-otros">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Ecosistema Vorka</span><h2 class="h2" id="t-otros" style="margin-top:18px">También podemos ayudarte con…</h2></div>
    <div class="otros">{otros}</div>
  </div>
</section>
</main>
{pie('empresas')}'''
    return cabeza(f"{s['area']} · Vorka México", f"{s['promesa']} {s['para']}", f"/servicios/{s['slug']}/", og=s['cabecera']) + cuerpo + '\n</body>\n</html>\n'

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
    escribir('fc/index.html', pagina_fc())
    escribir('404.html', no_encontrada())
