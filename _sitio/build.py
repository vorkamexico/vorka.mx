# Vorka México · genera las páginas principales del sitio
# Uso: python3 _sitio/build.py   (desde la raíz del repo vorka.mx)
# Páginas: / · /servicios/ · /servicios/<slug>/ · /agenda/ · /fc/ · /nosotros/ · /contacto/ · /404.html
# Diseño: sistema visual v3 (portada con la V y tarjetas flotantes, titulares con degradado metálico, etiquetas «/», bento,
# secciones oscuras redondeadas, aparición al hacer scroll). El contenido es el corto: tres caminos, cuatro servicios,
# lo que hemos hecho, Vorka Learn, cifras con respaldo y el formulario corto (#platiquemos) como único CTA.
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from partes import *
from datos import SERVICIOS, PREGUNTAS_CORTAS, PASOS_CORTOS, EJEMPLOS, FORMATOS
from agenda import pagina_agenda
from fc import actualizar_fc
from equipo import paginas_equipo
from institucional import pagina_nosotros, pagina_contacto, ORG_ID

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOGO_DECO = LOGO.replace('<svg ', '<svg class="v-deco" ')
CTA_FORM = ('#platiquemos', 'Agenda tu diagnóstico')   # en páginas que ya tienen el formulario corto, el botón del menú baja a él

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
    <div class="flota f1" data-z="1.4"><div class="tarjeta"><div class="fila-t"><span class="ok">{ICONOS['check']}</span><div><span class="t">Diagnóstico agendado</span><b>Jueves · 10:00</b><small>20 min · videollamada</small></div></div></div></div>
    <div class="flota f2" data-z="1"><div class="tarjeta"><span class="t">Prioridades del trimestre</span><div class="barras"><div>Estructura<span><i style="--w:86%"></i></span></div><div>Talento<span><i style="--w:62%"></i></span></div><div>Narrativa<span><i style="--w:40%"></i></span></div></div></div></div>
    <div class="flota f3" data-z="1.2"><div class="tarjeta"><span class="t">Conversación pública</span><b>Tendencia al alza</b>{chispa()}</div></div>
    <div class="flota f4" data-z=".8"><div class="tarjeta"><span class="t"><span class="punto"></span>Equipo en campo</span><b id="lugar">Monterrey</b></div></div>
    <div class="flota f5" data-z="1.8"><div class="icono-app ia-1">{ICONOS['brujula']}</div></div>
    <div class="flota f6" data-z="1.6"><div class="icono-app ia-2">{ICONOS['megafono']}</div></div>
    <div class="flota f7" data-z="2"><div class="icono-app ia-3">{ICONOS['personas']}</div></div>
    <div class="flota f8" data-z="1.1"><div class="tarjeta"><div class="fila-t"><div class="caras">{caras}</div><div><b>40+ consultores</b><small>senior, en red activa</small></div></div></div></div>
    <div class="escena-pie"></div>
  </div>'''

def caja_servicio(s, clase, mini='', foto_n=None, foco='70% 50%', corto=False):
    """Tarjeta v3 de un servicio. corto=True: la línea breve y «Ver más» (inicio); si no, la descripción v3 (otros servicios)."""
    tags = ''.join(f'<span>{e(t)}</span>' for t in s['tags'][:5])
    fondo = f'<div class="foto-c" style="--foco:{foco}">{img(foto_n, "(max-width: 1020px) 100vw, 66vw", alt="")}</div>' if foto_n else ''
    extra = mini or f'<div class="chips-c">{tags}</div>'
    ver = f'<span class="flecha ver">Ver más {FLECHA}</span>' if corto else ''
    return f'''<a class="caja {clase} rv" href="/servicios/{s['slug']}/">{fondo}
      <span class="etq">Servicio {s['num']}<span class="ir">{FLECHA}</span></span>
      <h3 class="h3">{s['area']}</h3><p>{e(s['breve'] if corto else s['corta'])}</p>
      {extra}{ver}
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

# ---- piezas compartidas por el inicio y el índice de servicios
def hecho_html(pegada=False):
    """«Lo que hemos hecho»: trabajo propio que se puede abrir hoy (datos.EJEMPLOS), con las tarjetas de nota de v3.
    pegada=True: sin el aire de arriba (cuando sigue a otra sección del mismo fondo)."""
    tarjetas = ''.join(f'''<a class="nota-h rv" href="{h}" style="--d:{(i % 3) * .06}s"><span class="im"><img src="/img/trabajo/{k}-800.webp" width="800" height="600" alt="{e(alt)}" loading="lazy" decoding="async"></span>
        <span class="tx"><small>{e(et)}</small><b>{e(t)}</b><span>{e(d)}</span></span></a>''' for i, (h, k, et, t, d, alt) in enumerate(EJEMPLOS))
    return f'''<section class="sec{' pegada' if pegada else ''}" id="hecho" aria-labelledby="t-hecho">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Lo que hemos hecho</span><h2 class="h2" id="t-hecho">Productos propios, <span class="metal">en línea hoy.</span></h2></div>
      <p class="lead">Apps, simuladores, un medio y una academia que hacemos y operamos nosotros. Ábrelos y pruébalos.</p></div>
    <div class="hecho-g">{tarjetas}</div>
  </div>
</section>'''

def banda(foto, foco, etq, titulo, chips):
    """Banda de foto v3: tarjeta oscura ancha con la foto de fondo y el degradado de las cajas del bento."""
    ch = ''.join(f'<span>{c}</span>' for c in chips)
    return f'''<div class="caja osc banda rv"><div class="foto-c" style="--foco:{foco}">{img(foto, "(max-width: 1280px) 100vw, 1240px", alt="")}</div>
      <span class="etq">{etq}</span><h3 class="h2">{titulo}</h3><div class="chips-c">{ch}</div></div>'''

CIFRAS_CHIPS = ['<b>180+</b> municipios', '<b>40+</b> consultores senior', 'Formación <b>HBS · Tec</b>', 'Bases en Monterrey, CDMX, Guadalajara, Querétaro y Celaya']

# ---------------------------------------------------------------- inicio
# Portada v3 intacta → sectores → tres caminos (servicios · tienda y apps · Vorka Learn) → cuatro servicios en el bento →
# cómo trabajamos (fases con la maqueta de la app) → lo que hemos hecho → por qué podemos responder rápido (pilares) →
# presencia y cifras (sección oscura con el mapa) → Revista Sparks y boletín → Vorka Learn → formulario corto.
# Las anclas viejas siguen vivas (#momentos, #servicios, #proceso, #red, #sparks): páginas hechas a mano las usan.
CAMINOS = [('S', '/servicios/', 'Servicios para organizaciones', 'Estrategia, liderazgo, comunicación y apps a la medida para tomar decisiones importantes y ejecutarlas.', 'empresas · gobiernos · organizaciones'),
           ('T', '/tienda/', 'Tienda y apps', 'Herramientas listas para usar: simuladores de examen, invitaciones, eventos con registro, lealtad y citas en línea.', 'negocios · eventos · estudiantes'),
           ('L', '/learn/', 'Vorka Learn', 'Guías gratis y sin registro para tu examen, tu dinero y tu negocio, con fuentes oficiales citadas.', 'estudiantes · familias · emprendedores')]
LEARN = [('E', '', '/learn/', 'Exámenes de admisión', 'PAA, UNAM, ECOEMS y prepa UG: qué viene, cómo se califica y cómo prepararte.', 'Ver guías'),
         ('C', ' tira-paa', '/learn/camino/', 'Tu camino y tu dinero', 'Cómo elegir carrera, pedir una beca y ordenar tus finanzas personales.', 'Leer'),
         ('N', ' tira-tienda', '/learn/negocio/', 'Negocio pequeño y crea tu app', 'Lo básico para arrancar un negocio y cómo crear y vender tu propia app.', 'Leer')]

def inicio():
    est, lid, inf, apps = SERVICIOS
    mini_lid = '''<div class="mini lista-mini">
        <div class="hecho"><span class="cuadro-c"></span>Mapa de brechas</div>
        <div class="hecho"><span class="cuadro-c"></span>Plan de desarrollo</div>
        <div><span class="cuadro-c"></span>Sesión: decisiones críticas<em>Hoy</em></div>
        <div><span class="cuadro-c"></span>Simulacro de entrevista<em>Jue</em></div></div>'''
    barras = ''.join(f'<i style="--h:{h}%"></i>' for h in [28, 34, 30, 42, 46, 58, 70, 88])
    mini_inf = f'<div class="mini"><div class="dato-g"><span>Alcance por semana</span><b>↑</b></div><div class="grafica">{barras}</div></div>'
    bento = (caja_servicio(est, 'osc c-a', foto_n='monterrey-torres', foco='50% 30%', corto=True)
             + caja_servicio(lid, 'c-b', mini_lid, corto=True) + caja_servicio(inf, 'c-c', mini_inf, corto=True)
             + caja_servicio(apps, 'c-g', corto=True)
             + f'<a class="caja c-oro c-g rv" href="#platiquemos"><span class="etq">Empieza aquí<span class="ir">{FLECHA}</span></span><h3 class="h3">Diagnóstico sin costo</h3><p>20 minutos para entender tu reto y decirte cómo lo resolveríamos.</p>{LOGO_DECO}</a>')
    caminos = ''.join(f'''<a class="momento rv" href="{h}" style="--d:{i * .08}s">
        <span class="letra-v">{l}</span><h3 class="h3" style="font-size:22px">{e(t)}</h3><p>{e(d)}</p>
        <span class="para"><span>Ideal para: {e(p)}</span>{FLECHA}</span></a>''' for i, (l, h, t, d, p) in enumerate(CAMINOS))
    tiras = ''.join(f'''<a class="caja tira{c} rv" href="{h}">
      <span class="letra-v">{l}</span>
      <span class="tira-t"><b>{e(t)}</b><span>{e(d)}</span></span>
      <span class="flecha">{f} {FLECHA}</span>
    </a>''' for l, c, h, t, d, f in LEARN)
    nodos = [('monterrey-skyline', 'Monterrey', 'Industria · finanzas', 80, 14), ('cdmx-chapultepec', 'CDMX', 'Gobierno · corporativos', 86, 62),
             ('queretaro', 'Querétaro', 'Industria del Bajío', 58, 86), ('celaya', 'Celaya', 'Casa de Sparks', 28, 84), ('guadalajara', 'Guadalajara', 'Empresa · cultura', 10, 50)]
    cx, cy = 46, 42
    lineas = ''
    for k, (_, _, _, x, y) in enumerate(nodos):
        d = f'M{cx} {cy} Q{(cx + x) / 2 + (y - cy) * .25:.1f} {(cy + y) / 2 - (x - cx) * .25:.1f} {x} {y}'
        lineas += f'<path class="linea" d="{d}" vector-effect="non-scaling-stroke"/><path class="flujo" d="{d}" vector-effect="non-scaling-stroke" style="animation-delay:-{k * .5}s"/>'
    nodos_html = ''.join(f'<div class="nodo" style="left:{x}%;top:{y}%"><span class="f">{img(n, "120px", alt="")}</span><b>{c}</b><small>{s}</small></div>' for n, c, s, x, y in nodos)
    # Cómo trabajamos (v3): cuatro fases que avanzan solas, con la maqueta de la app a la derecha
    fases = [('Diagnóstico', 'Escuchamos primero: contexto real y la brecha entre lo que se dice y lo que pasa.', 'proyecto / diagnóstico'),
             ('Diseño', 'La intervención a la medida, solo con lo que tu caso exige.', 'proyecto / plan'),
             ('Activación', 'Operamos dentro hasta que el cambio funciona solo.', 'proyecto / tablero'),
             ('Medición', 'Indicadores acordados desde el inicio.', 'proyecto / resultados')]
    botones_p = ''.join(f'<button class="paso-b" type="button" role="tab" data-ruta="{r}"><span class="n">0{i + 1}</span><b>{t}</b><span>{d}</span><i class="barra"></i></button>' for i, (t, d, r) in enumerate(fases))
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
    caras = ''.join(f'<i style="background-image:url(/img/ciudades/{n}-960.webp)"></i>' for n in ['cdmx-reforma', 'monterrey-silla', 'guadalajara', 'queretaro'])
    cinta = ''.join(f'<span>{s}</span>' for s in SECTORES * 2)
    cuerpo = f'''{nav(cta=CTA_FORM)}
<main id="contenido">
<section class="portada" aria-labelledby="t-hero">
  <div class="marco portada-c">
    <a class="aviso entra" href="#platiquemos" style="--d:.05s"><b>Nuevo</b>Diagnóstico estratégico sin costo{FLECHA}</a>
    <h1 class="h-hero" id="t-hero">{palabras('Definimos el juego con quienes lo juegan.', 5)}</h1>
    <p class="lead entra" style="--d:.75s">Consultora de estrategia, liderazgo, comunicación y apps a la medida. Acompañamos a líderes, empresas y gobiernos en las decisiones que no admiten segundo intento.</p>
    <div class="botones entra" style="--d:.85s"><a class="btn tinta" href="#platiquemos">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="/servicios/">Explorar servicios</a></div>
    <div class="prueba entra" style="--d:.95s"><span class="caras">{caras}</span><span><b style="color:var(--fg)" class="num">150+</b> proyectos en <b style="color:var(--fg)">26 estados</b></span></div>
  </div>
  <div class="marco">{escena()}</div>
</section>

<section class="sectores" aria-label="Experiencia">
  <p>Experiencia operativa en</p>
  <div class="cinta" aria-hidden="true"><div class="cinta-pista">{cinta}</div></div>
</section>

<section class="sec" id="momentos" aria-labelledby="t-cam">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Qué hacemos</span><h2 class="h2" id="t-cam">Tres caminos. <span class="metal">¿Cuál es el tuyo?</span></h2>
      <p class="lead">Consultoría para organizaciones, herramientas listas para usar y guías gratis.</p></div>
    <div class="momentos">{caminos}</div>
  </div>
</section>

<section class="sec pegada" id="servicios" aria-labelledby="t-serv">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Servicios</span><h2 class="h2" id="t-serv">Cuatro servicios. <span class="metal">Un solo equipo.</span></h2>
      <p class="lead">Empiezas con uno y sumas otro solo si hace falta.</p></div>
    <div class="bento">{bento}</div>
    <p class="rv" style="text-align:center;margin-top:28px"><a class="flecha" href="/servicios/">Ver todos los servicios {FLECHA}</a></p>
  </div>
</section>

<section class="sec suave" id="proceso" aria-labelledby="t-proc">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Cómo trabajamos</span><h2 class="h2" id="t-proc">Cuatro fases. <span class="metal">Sin atajos.</span></h2></div>
      <p class="lead">Así se ve un proyecto con nosotros, del primer día al cierre.</p></div>
    <div class="proceso">
      <div class="pasos rv" role="tablist" aria-label="Fases">{botones_p}</div>
      <div class="app-v rv" aria-hidden="true"><div class="barra-v"><i></i><i></i><i></i><span id="ruta-app">proyecto / diagnóstico</span></div><div class="pantallas">{pantallas}</div></div>
    </div>
  </div>
</section>

{hecho_html()}

<section class="sec pegada" aria-labelledby="t-hue">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Nuestra huella</span><h2 class="h2" id="t-hue">Por qué podemos <span class="metal">responder rápido.</span></h2></div>
      <p class="lead">Criterio por experiencia, velocidad por tecnología y legitimidad por territorio.</p></div>
    <div class="pilares">
      <article class="pilar rv"><span class="ic">{ICONOS['brujula']}</span><h3 class="h3" style="font-size:22px">Trayectoria en decisiones difíciles</h3><p>Sector público federal, banca, industria e incidencia.</p>
        <dl><div><dt>HBS · Tec</dt><dd>y Silicon Valley: formación del equipo directivo</dd></div><div><dt class="num">3</dt><dd>sectores: público, privado y civil</dd></div></dl></article>
      <article class="pilar rv" style="--d:.08s"><span class="ic">{ICONOS['rayo']}</span><h3 class="h3" style="font-size:22px">Consultora nativa digital</h3><p>Hacemos y operamos nuestras propias apps, bajo la misma dirección estratégica.</p>
        <dl><div><dt class="num">10</dt><dd>productos propios en línea</dd></div><div><dt class="num">4</dt><dd>simuladores de examen con tutor</dd></div></dl></article>
      <article class="pilar rv" style="--d:.16s"><span class="ic">{ICONOS['globo']}</span><h3 class="h3" style="font-size:22px">Presencia nacional, no focus group</h3><p>Equipo de campo y aliados locales, con contexto real de cada territorio.</p>
        <dl><div><dt class="num">5</dt><dd>ciudades base</dd></div><div><dt>Campo</dt><dd>equipo propio, presencial o a distancia</dd></div></dl></article>
    </div>
  </div>
</section>

<section class="sec oscura redondo" id="red" aria-labelledby="t-red">
  <div class="grano"></div>
  <div class="marco red">
    <div class="rv">
      <span class="etiqueta">Presencia nacional</span>
      <h2 class="h2" id="t-red" style="margin-top:18px">Una red que cubre <span class="metal">todo México.</span></h2>
      <p class="lead" style="margin-top:20px">Entendemos la diferencia entre operar en la CDMX y en Chiapas.</p>
      <div class="datos-red">
        <div><b class="num"><span data-cuenta="150">150</span>+</b><span>proyectos</span></div>
        <div><b class="num"><span data-cuenta="26">26</span></b><span>estados con proyectos</span></div>
        <div><b class="num"><span data-cuenta="180">180</span>+</b><span>municipios atendidos</span></div>
        <div><b class="num"><span data-cuenta="40">40</span>+</b><span>consultores senior en red activa</span></div>
      </div>
    </div>
    <div class="mapa rv" aria-hidden="true">
      <svg class="lineas" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="oro-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6CF96"/><stop offset="1" stop-color="#C8A45C"/></linearGradient></defs>{lineas}</svg>
      <div class="nodo centro" style="left:{cx}%;top:{cy}%"><span class="f">{v_metal('', 'gn')}</span><b>Vorka</b></div>
      {nodos_html}
    </div>
  </div>
</section>

<section class="sec" id="sparks" aria-labelledby="t-spk">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Revista Sparks</span><h2 class="h2" id="t-spk">Lo que vemos en el campo, <span class="metal">contado.</span></h2></div>
      <p class="lead">Nuestro medio propio: historias de quienes mueven su comunidad.</p></div>
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
      <span class="tira-t"><b>Programa Tú en Vorka</b><span>Voluntariado estratégico para jóvenes de 16 a 29 años, en el Bajío y a distancia.</span></span>
      <span class="flecha">Conocer el programa {FLECHA}</span>
    </a>
  </div>
</section>

<section class="sec pegada" id="learn" aria-labelledby="t-learn">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Vorka Learn</span><h2 class="h2" id="t-learn">Guías para tu examen, <span class="metal">tu dinero y tu negocio.</span></h2></div>
      <p class="lead">Gratis y sin registro. Cada dato sale de la institución que lo publica y la citamos al final de cada guía.</p></div>
    {tiras}
    <p class="rv" style="text-align:center;margin-top:28px"><a class="flecha" href="/learn/">Ver todas las guías {FLECHA}</a></p>
  </div>
</section>
{platiquemos('/')}
</main>
{pie()}'''
    ld = {"@context": "https://schema.org", "@type": "ProfessionalService", "@id": ORG_ID, "name": "Vorka México", "url": SITIO, "logo": SITIO + "/vorka-logo.png",
          "description": "Consultora de estrategia, liderazgo, comunicación y apps a la medida para empresas, gobiernos y organizaciones en México.", "email": CORREO, "telephone": "+52 81 1780 4869",
          "areaServed": "MX", "sameAs": [u for _, u, _ in REDES]}
    sitio_ld = {"@context": "https://schema.org", "@type": "WebSite", "name": "Vorka México", "url": SITIO + "/", "publisher": {"@id": ORG_ID}}
    extra = ('<link rel="preload" as="image" href="/img/ciudades/monterrey-silla-1600.webp" fetchpriority="high">\n'
             + ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (ld, sitio_ld)))
    return cabeza('Vorka México: consultoría en estrategia, liderazgo y comunicación',
                  'Consultora mexicana de estrategia, liderazgo, comunicación y apps a la medida para empresas, gobiernos y organizaciones. 150+ proyectos en 26 estados. Diagnóstico sin costo.',
                  '/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- servicios (índice)
# Cabecera v3 (V translúcida de fondo) → «Si necesitas…» (4) → formas de trabajar y cómo empezamos (sección oscura) →
# lo que hemos hecho → banda de foto con cifras → preguntas → formulario corto. El detalle vive en cada subpágina.
def servicios_hub():
    elegir = ''.join(f'<a class="rv" href="/servicios/{s["slug"]}/" style="--d:{i * .06}s"><small>Si necesitas…</small><b>{e(s["necesitas"])}</b><span>{s["area"]} {FLECHA}</span></a>' for i, s in enumerate(SERVICIOS))
    pasos = ''.join(f'<div class="rv" style="--d:{i * .08}s"><small>Paso {i + 1}</small><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(PASOS_CORTOS))
    formatos = ''.join(f'<article class="formato rv" style="--d:{i * .08}s"><small>{e(k)}</small><h3 class="h3">{e(t)}</h3><p>{e(d)}</p></article>' for i, (k, t, d) in enumerate(FORMATOS))
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in PREGUNTAS_CORTAS]}
    migas_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"}, {"@type": "ListItem", "position": 2, "name": "Servicios", "item": SITIO + "/servicios/"}]}
    cuerpo = f'''{nav('/servicios/', cta=CTA_FORM)}
<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gh', oscuro=False)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Servicios</span></div>
    <span class="etiqueta">Servicios</span>
    <h1 class="h1" style="margin-top:18px">Todo para decidir, ejecutar y <span class="metal">hacerte escuchar.</span></h1>
    <p class="lead">Cuatro servicios que se combinan según tu momento, para empresas, gobiernos y organizaciones en México.</p>
    <div class="botones"><a class="btn tinta" href="#platiquemos">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="#hecho">Ver lo que hemos hecho</a></div>
  </div>
</section>
<section class="sec pegada" aria-label="Servicios"><div class="marco"><div class="elegir">{elegir}</div></div></section>
<section class="sec oscura redondo" id="proceso" aria-labelledby="t-proc">
  <div class="grano"></div>
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Formas de trabajar</span><h2 class="h2" id="t-proc" style="margin-top:18px">A tu ritmo, <span class="metal">con el mismo rigor.</span></h2></div>
      <p class="lead">Elegimos el formato juntos, después del diagnóstico. Así empezamos, en tres pasos y sin compromiso.</p></div>
    <div class="formatos">{formatos}</div>
    <div class="linea-pasos tres">{pasos}</div>
  </div>
</section>
{hecho_html()}
<section class="sec pegada" aria-label="Dónde trabajamos" style="padding-bottom:0"><div class="marco">{banda('monterrey-skyline', '50% 50%', 'Presencia nacional', '150+ proyectos en <span class="metal-osc">26 estados.</span>', CIFRAS_CHIPS)}</div></section>
<section class="sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" id="t-faq">Lo que todos <span class="metal">nos preguntan.</span></h2></div>
    <div class="faq">{faq_html(PREGUNTAS_CORTAS)}</div>
  </div>
</section>
{platiquemos('/servicios/')}
</main>
{pie('empresas')}'''
    extra = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (faq_ld, migas_ld))
    return cabeza('Consultoría en estrategia, liderazgo y comunicación · Vorka México',
                  'Cuatro servicios para empresas, gobiernos y organizaciones en México: Estrategia y Dirección, Liderazgo y Talento, Comunicación e Influencia, y Apps y páginas a la medida. Diagnóstico de 20 minutos sin costo.',
                  '/servicios/', og='monterrey-skyline', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- detalle de servicio
# Cabecera v3 con la V recortada sobre la foto y el «En corto» arriba → qué incluye → (apps: lo que ya construimos) →
# qué te llevas y fases (sección oscura) → preguntas → formulario corto → otros servicios.
SEO_SERVICIO = {
    'estrategia': ('Consultoría en estrategia y dirección · Vorka México', 'Estrategia corporativa y pública, transformación, cultura, gobernanza y sucesión para empresas, gobiernos y fundaciones en México. Diagnóstico de 20 minutos sin costo.'),
    'liderazgo': ('Coaching ejecutivo y desarrollo de liderazgo · Vorka México', 'Coaching ejecutivo 1 a 1, coaching de equipos directivos, programas a la medida y assessment de talento en México. Diagnóstico de 20 minutos sin costo.'),
    'apps': ('Desarrollo de apps y páginas web a la medida · Vorka México', 'Sitios web, tiendas en línea, apps y sistemas a la medida, hechos por el equipo que construyó y opera Agenda, Vuelve, Cupo, Brindi y Vorka Learn. Diagnóstico de 20 minutos sin costo.'),
    'influencia': ('Comunicación estratégica, redes y manejo de crisis · Vorka México', 'Narrativa, redes sociales, diseño, video, campañas digitales, PR, vocería, manejo de crisis y sitio web bajo una sola dirección. Diagnóstico de 20 minutos sin costo.'),
}

def servicio(s):
    caps = ''.join(f'<article class="capacidad rv" style="--d:{(i % 3) * .06}s"><span class="n">{i + 1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (t, d) in enumerate(s['items']))
    ents = ''.join(f'<article class="entregable rv" style="--d:{i * .06}s">{ICONOS[ic]}<h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (ic, t, d) in enumerate(s['entregables']))
    pasos = ''.join(f'<div class="rv" style="--d:{i * .08}s"><small>Fase 0{i + 1}</small><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(s['pasos']))
    datos = ''.join(f'<div><b>{e(b)}</b><span>{e(t)}</span></div>' for b, t in s['datos'])
    datos = f'<div class="datos">{datos}</div>' if datos else ''
    otros = ''.join(caja_servicio(o, 'osc', foto_n=o['foto'], foco=o['foco']) for o in SERVICIOS if o is not s)
    # Trabajo propio (solo «Apps y páginas»): productos de Vorka que se pueden abrir hoy
    propios = ''.join(f'<a class="capacidad rv" href="{h}" style="--d:{(i % 3) * .06}s"><h3>{e(n)}</h3><p>{e(d)}</p></a>' for i, (h, n, d) in enumerate(s.get('propios', [])))
    propios = f'''<section class="sec pegada" aria-labelledby="t-prop">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Trabajo propio</span><h2 class="h2" id="t-prop">Lo que ya construimos <span class="metal">y operamos.</span></h2></div>
      <p class="lead">Productos de Vorka en línea hoy. Puedes abrir cada uno y probarlo.</p></div>
    <div class="capacidades">{propios}</div>
  </div>
</section>''' if propios else ''
    cuerpo = f'''{nav('/servicios/', cta=CTA_FORM)}
<main id="contenido">
<section class="cabecera cab-servicio">
  {v_foto(s['cabecera'], s['cab_foco'])}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/servicios/">Servicios</a><span>/</span><span>{s['area']}</span></div>
    <span class="etiqueta">Servicio {s['num']}</span>
    <h1 class="h1" style="margin-top:18px;max-width:640px">{s['titulo']}</h1>
    <p class="lead" style="max-width:520px">{e(s['promesa'])}</p>
    <dl class="ficha corto" aria-label="En corto">
      <div><dt>Resultado</dt><dd>{e(s['breve'])}</dd></div>
      <div><dt>Para quién</dt><dd>{e(s['quien'])}</dd></div>
      <div><dt>Primer paso</dt><dd>Diagnóstico de 20 minutos, sin costo.</dd></div>
    </dl>
    <div class="botones"><a class="btn tinta" href="#platiquemos">Agenda tu diagnóstico {FLECHA}</a><a class="btn blanco" href="#incluye">Qué incluye</a></div>
    {datos}
  </div>
</section>
<section class="sec pegada" id="incluye" aria-labelledby="t-inc">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Qué incluye</span><h2 class="h2" id="t-inc">Capacidades que se combinan <span class="metal">según tu momento.</span></h2></div>
      <p class="lead"><b style="color:var(--fg)">Para quién:</b> {e(s['para'])}</p></div>
    <div class="capacidades">{caps}</div>
  </div>
</section>
{propios}
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
    <div class="faq">{faq_html(PREGUNTAS_CORTAS)}</div>
  </div>
</section>
{platiquemos(f"/servicios/{s['slug']}/", marcar=s['interes'], area=s['slug'], titulo=s['cta'])}
<section class="sec" aria-labelledby="t-otros">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Ecosistema Vorka</span><h2 class="h2" id="t-otros" style="margin-top:18px">También podemos ayudarte con…</h2></div>
    <div class="otros">{otros}</div>
  </div>
</section>
</main>
{pie('empresas')}'''
    ld = {"@context": "https://schema.org", "@type": "Service", "name": s['area'], "serviceType": s['area'], "description": f"{s['promesa']} {s['para']}",
          "url": f"{SITIO}/servicios/{s['slug']}/", "areaServed": {"@type": "Country", "name": "México"},
          "provider": {"@type": "ProfessionalService", "name": "Vorka México", "url": SITIO + "/"},
          "potentialAction": {"@type": "ReserveAction", "name": "Agenda tu diagnóstico sin costo", "target": f"{SITIO}/servicios/{s['slug']}/#platiquemos"}}
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
