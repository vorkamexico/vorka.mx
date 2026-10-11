# Vorka México · genera las páginas principales del sitio
# Uso: python3 _sitio/build.py   (desde la raíz del repo vorka.mx)
# Páginas: / · /servicios/ · /servicios/<slug>/ · /agenda/ · /404.html
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from partes import *
from datos import SERVICIOS, FORMATOS, PREGUNTAS, MOMENTOS
from agenda import pagina_agenda, campo

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def escribir(ruta, contenido):
    p = os.path.join(RAIZ, ruta)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(contenido)
    print('·', ruta, f'{len(contenido) // 1024} KB')

CIUDADES = [
    ('cdmx-reforma', 'Ciudad de México', '19.43° N · 99.13° O', '50% 55%', '40% 50%'),
    ('monterrey-silla', 'Monterrey', '25.67° N · 100.31° O', '50% 62%', '55% 60%'),
    ('guadalajara', 'Guadalajara', '20.67° N · 103.35° O', '50% 45%', '50% 45%'),
    ('queretaro', 'Querétaro', '20.59° N · 100.39° O', '50% 50%', '30% 50%'),
    ('celaya', 'Celaya', '20.52° N · 100.81° O', '50% 40%', '50% 40%'),
]
CINTA = ['Estrategia corporativa', 'Gobernanza y consejos', 'Coaching ejecutivo', 'Transformación operativa', 'Narrativa y vocería', 'Manejo de crisis', 'Campañas digitales', 'Planeación sucesoria', 'Cultura organizacional', 'Diseño y branding', 'Programas ejecutivos', 'Relaciones públicas']

def tarjeta_servicio(s, sizes='(max-width: 1020px) 100vw, 33vw'):
    tags = ''.join(f'<li>{e(t)}</li>' for t in s['tags'][:5])
    return f'''<a class="serv rv" href="/servicios/{s['slug']}/">
      {foto(s['foto'], foco=s['foco'], sizes=sizes)}
      <div class="serv-top"><span>Servicio {s['num']}</span><i>{FLECHA}</i></div>
      <div class="serv-c"><h3>{s['area']}</h3><p>{e(s['corta'])}</p><ul>{tags}</ul></div>
    </a>'''

# ---------------------------------------------------------------- inicio
def inicio():
    diapos = ''.join(f'<div class="diapo{" activa" if i == 0 else ""}" style="--foco:{f};--foco-m:{fm}">{img(n, "100vw", carga="eager" if i < 2 else "lazy", prioridad=i == 0)}</div>' for i, (n, c, g, f, fm) in enumerate(CIUDADES))
    btns = ''.join(f'<button class="ciudad-btn{" activa" if i == 0 else ""}" type="button" aria-pressed="{"true" if i == 0 else "false"}" aria-label="Ver {c}"><b>{c}</b><small>{g}</small></button>' for i, (n, c, g, f, fm) in enumerate(CIUDADES))
    cinta = ''.join(f'<span>{t}</span>' for t in CINTA * 2)
    servicios = ''.join(tarjeta_servicio(s) for s in SERVICIOS)
    momentos = ''.join(f'''<a class="momento rv" href="/agenda/?momento={l}">
        <span class="letra">{l}</span>
        <div><h3>{e(t)}</h3></div>
        <div><p>{e(d)}</p><div class="ideal">Ideal para: {e(i)}</div></div>
        <span class="ir">{FLECHA}</span>
      </a>''' for l, t, d, i in MOMENTOS)
    pasos = [('Diagnóstico', 'Escuchamos primero. Mapeamos el contexto real, los objetivos verdaderos y la brecha entre lo que se dice y lo que pasa adentro.'),
             ('Diseño', 'Construimos la intervención a la medida. Combinamos servicios según lo que el contexto exige, no según un catálogo fijo.'),
             ('Activación', 'Acompañamos la ejecución de principio a fin. Operamos dentro del cliente. Entregamos resultado, no un plan.'),
             ('Medición', 'Indicadores acordados desde el inicio. El impacto real, no las horas facturadas, es la única métrica de éxito.')]
    metodo = ''.join(f'<div class="paso rv" style="--d:{i * .08}s"><span class="num">FASE 0{i + 1}</span><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(pasos))
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="portada" aria-label="Portada">
  <div class="diapos" aria-hidden="true">{diapos}</div>
  <div class="portada-c marco">
    <span class="kicker">Consultora de estrategia · México</span>
    <h1 class="display">Definimos el juego <em>con quienes lo juegan.</em></h1>
    <p class="lead">Estrategia, liderazgo e influencia para líderes, empresas y gobiernos que enfrentan decisiones que no admiten segundo intento, y todo lo necesario para ejecutarlas y comunicarlas bien.</p>
    <div class="botones"><a class="btn oro" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><a class="btn linea" href="/servicios/">Explorar servicios</a></div>
    <div class="portada-pie" role="group" aria-label="Ciudades">{btns}</div>
  </div>
</section>
<div class="cinta" aria-hidden="true"><div class="cinta-pista">{cinta}</div></div>

<section class="sec clara" aria-labelledby="t-cifras">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Vorka México en cifras</span><h2 class="titulo" id="t-cifras">Criterio probado en <em>decisiones reales.</em></h2></div>
      <p class="lead rv">Somos una consultora con presencia física, digital y editorial. La experiencia nos da criterio, la tecnología nos da velocidad y el territorio nos da contexto.</p>
    </div>
    <div class="cifras rv">
      <div class="cifra"><b><span data-cuenta="150">150</span><sup>+</sup></b><span>proyectos concluidos con métricas verificables</span></div>
      <div class="cifra"><b><span data-cuenta="26">26</span></b><span>estados de la República con proyectos ejecutados</span></div>
      <div class="cifra"><b><span data-cuenta="40">40</span><sup>+</sup></b><span>consultores senior en red activa</span></div>
      <div class="cifra"><b><span data-cuenta="3">3</span></b><span>sectores: público, privado y sociedad civil</span></div>
    </div>
  </div>
</section>

<section class="sec oscura" id="servicios" aria-labelledby="t-serv">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Qué hacemos</span><h2 class="titulo" id="t-serv">Tres capacidades. <em>Un solo criterio.</em></h2></div>
      <div class="rv"><p class="lead">No vendemos horas ni entregables sueltos: combinamos estrategia, liderazgo e influencia según lo que tu momento exige, bajo una sola dirección.</p><p style="margin-top:22px"><a class="enlace" href="/servicios/">Compara los servicios {FLECHA}</a></p></div>
    </div>
    <div class="servicios">{servicios}</div>
  </div>
</section>

<section class="sec clara clara-2" id="momentos" aria-labelledby="t-mom">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">¿Cuándo llamarnos?</span><h2 class="titulo" id="t-mom">Tres momentos. <em>¿Cuál es el tuyo?</em></h2></div>
      <p class="lead rv">No trabajamos con quien observa; trabajamos con quien decide. Así llegan nuestros clientes por primera vez.</p>
    </div>
    <div class="momentos">{momentos}</div>
  </div>
</section>

<section class="sec oscura" id="metodo" aria-labelledby="t-met">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Cómo trabajamos</span><h2 class="titulo" id="t-met">Cuatro fases. <em>Sin atajos.</em></h2></div>
      <p class="lead rv">Diagnóstico antes de proponer. Diseño antes de ejecutar. Ejecución antes de medir. Medición antes de cerrar. Por eso el cambio se sostiene cuando nos vamos.</p>
    </div>
    <div class="metodo">{metodo}</div>
  </div>
</section>

<section class="sec clara" id="huella" aria-labelledby="t-hue">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Nuestra huella</span><h2 class="titulo" id="t-hue">Por qué podemos <em>responder rápido.</em></h2></div>
      <p class="lead rv">Tres dimensiones que se refuerzan: la experiencia da criterio, la digitalización da velocidad y el territorio da legitimidad.</p>
    </div>
    <div class="huella">
      <article class="pilar rv"><span class="kicker">Experiencia</span><h3>Trayectoria en decisiones difíciles.</h3><p>Formación cruzada entre programas ejecutivos de Harvard Business School, Tec de Monterrey y ecosistemas de innovación en Silicon Valley. Experiencia operativa en el sector público federal, la banca, grupos industriales y organizaciones de incidencia.</p>
        <dl><div><dt>150+</dt><dd>proyectos con métricas verificables</dd></div><div><dt>12</dt><dd>áreas de práctica sectorial</dd></div></dl></article>
      <article class="pilar rv" style="--d:.08s"><span class="kicker">Digitalización</span><h3>Consultora nativa digital.</h3><p>Herramientas propias de analítica de opinión, escucha de redes y modelado de escenarios. Producción de contenido, diseño, campañas y monitoreo bajo una misma dirección estratégica.</p>
        <dl><div><dt>8</dt><dd>herramientas propias de análisis y monitoreo</dd></div><div><dt>24/7</dt><dd>monitoreo de crisis para clientes activos</dd></div></dl></article>
      <article class="pilar rv" style="--d:.16s"><span class="kicker">Alcance</span><h3>Presencia nacional, no focus group.</h3><p>Equipo propio de campo y red de aliados locales en toda la República. Entendemos la diferencia entre operar en la CDMX y en Chiapas, entre Monterrey y Chilpancingo.</p>
        <dl><div><dt>180+</dt><dd>municipios con proyectos ejecutados</dd></div><div><dt>45</dt><dd>alianzas con organizaciones locales</dd></div></dl></article>
    </div>
  </div>
</section>

<section class="sec oscura" id="ciudades" aria-labelledby="t-ciu">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Dónde trabajamos</span><h2 class="titulo" id="t-ciu">Estamos donde se <em>toman las decisiones.</em></h2></div>
      <p class="lead rv">De la Ciudad de México al Bajío y al norte: presencia física, equipo de campo y aliados locales que conocen cada territorio.</p>
    </div>
    <div class="mosaico">
      <figure class="foto m1 rv" style="--foco:50% 55%">{img('cdmx-chapultepec', '(max-width: 860px) 100vw, 58vw')}<figcaption><b>Ciudad de México</b><span>Gobierno · corporativos · medios</span></figcaption></figure>
      <figure class="foto m2 rv" style="--foco:50% 60%">{img('monterrey-skyline', '(max-width: 860px) 50vw, 42vw')}<figcaption><b>Monterrey</b><span>Industria · finanzas · empresa familiar</span></figcaption></figure>
      <figure class="foto m3 rv" style="--foco:50% 40%">{img('guadalajara', '(max-width: 860px) 50vw, 42vw')}<figcaption><b>Guadalajara</b><span>Empresa · innovación · cultura</span></figcaption></figure>
      <figure class="foto m4 rv" style="--foco:30% 50%">{img('queretaro', '(max-width: 860px) 50vw, 33vw')}<figcaption><b>Querétaro</b><span>Industria · crecimiento del Bajío</span></figcaption></figure>
      <figure class="foto m5 rv" style="--foco:50% 35%">{img('celaya', '(max-width: 860px) 50vw, 25vw')}<figcaption><b>Celaya</b><span>Nuestra casa · Revista Sparks</span></figcaption></figure>
      <div class="nota rv"><b class="titulo-m" style="font-size:30px">Y en toda la República.</b><p>Con aliados locales llegamos a donde esté tu proyecto, presencial o a distancia.</p></div>
    </div>
  </div>
</section>

<section class="sec clara" id="sparks" aria-labelledby="t-spk">
  <div class="marco sparks">
    <div class="rv">
      <span class="kicker">Vorka Sparks</span>
      <h2 class="titulo" id="t-spk">¿Todavía no es el momento? <em>Léenos primero.</em></h2>
      <p class="lead">Nuestro medio propio. Lo que vemos en el campo y pensamos puertas adentro sobre decisiones, poder y liderazgo en México, con historias de personas que mueven su comunidad.</p>
      <div class="botones"><a class="btn tinta" href="/sparks/celaya/">Leer Sparks Celaya {FLECHA}</a><a class="btn linea" href="https://www.instagram.com/vorka.mx/" target="_blank" rel="noopener">@vorka.mx</a></div>
    </div>
    <form class="tarjeta rv" id="boletin" novalidate>
      <h3>Boletín semanal</h3>
      <p>Una edición por semana, lectura de siete minutos. Sin spam; te das de baja cuando quieras.</p>
      <div class="campos" style="grid-template-columns:1fr">
        {campo('b-nombre', 'Nombre', req=True, auto='name').replace('name="b-nombre"', 'name="nombre"')}
        {campo('b-correo', 'Correo', 'email', req=True, auto='email').replace('name="b-correo"', 'name="correo"')}
        {campo('b-org', 'Organización (opcional)', auto='organization').replace('name="b-org"', 'name="organizacion"')}
        <label class="casilla"><input type="checkbox" name="acepto" value="1"> Acepto recibir comunicaciones de Vorka México.</label>
      </div>
      <button class="btn tinta" type="submit" style="width:100%;margin-top:18px">Suscribirme {FLECHA}</button>
      <p class="msg" role="status" style="margin-top:12px;font-size:14px;color:#B3412F"></p>
    </form>
  </div>
</section>

<section class="sec compacta oscura-2" aria-labelledby="t-tev">
  <div class="marco cabeza" style="margin-bottom:0">
    <div class="rv"><span class="kicker">Programa Tú en Vorka</span><h2 class="titulo-m" id="t-tev">Juventudes que mueven <em>lo que viene.</em></h2></div>
    <div class="rv"><p class="lead">Voluntariado estratégico para jóvenes de 16 a 29 años: aprenden a construir y guiar proyectos reales desde dentro. Presencial en el Bajío y remoto desde todo México.</p><div class="botones" style="margin-top:24px"><a class="btn linea" href="/voluntariado">Conocer el programa {FLECHA}</a></div></div>
  </div>
</section>
{cierre()}
</main>
{pie()}'''
    ld = {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "Vorka México", "url": SITIO, "logo": SITIO + "/vorka-logo.png",
          "description": "Consultora de estrategia, liderazgo e influencia con presencia nacional.", "email": CORREO, "telephone": "+52 81 1780 4869",
          "areaServed": "MX", "address": {"@type": "PostalAddress", "addressCountry": "MX"},
          "sameAs": [u for _, u, _ in REDES]}
    extra = f'<link rel="preload" as="image" href="/img/ciudades/cdmx-reforma-1600.webp" imagesrcset="/img/ciudades/cdmx-reforma-960.webp 960w, /img/ciudades/cdmx-reforma-1600.webp 1600w, /img/ciudades/cdmx-reforma-2400.webp 2400w" imagesizes="100vw" fetchpriority="high">\n<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    return cabeza('Vorka México · Estrategia, liderazgo e influencia', 'Consultora de estrategia con alcance nacional. Acompañamos a líderes, empresas y gobiernos en las decisiones que no admiten segundo intento. Agenda tu diagnóstico sin costo.', '/', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- servicios (hub)
def servicios_hub():
    necesidad = ''.join(f'<a class="rv" href="#{s["slug"]}" style="--d:{i * .06}s"><span class="q">Si necesitas…</span><b>{e(s["necesitas"])}</b><span>{s["area"]} {FLECHA}</span></a>' for i, s in enumerate(SERVICIOS))
    bloques = ''
    for i, s in enumerate(SERVICIOS):
        items = ''.join(f'<li>{e(t)}</li>' for t, _ in s['items'])
        ents = ''.join(f'<li>{e(t)}</li>' for _, t, _ in s['entregables'])
        bloques += f'''<article class="bloque{' inv' if i % 2 else ''}" id="{s['slug']}">
      {foto(s['foto'], foco=s['foco'], sizes='(max-width: 960px) 100vw, 50vw', clase='foto rv')}
      <div class="rv">
        <span class="num">SERVICIO {s['num']}</span>
        <h2 class="titulo">{s['titulo']}</h2>
        <p class="promesa">{e(s['promesa'])}</p>
        <dl class="ficha">
          <div><dt>Para quién</dt><dd>{e(s['para'])}</dd></div>
          <div><dt>Qué incluye</dt><dd><ul>{items}</ul></dd></div>
          <div><dt>Qué te llevas</dt><dd><ul>{ents}</ul></dd></div>
          <div><dt>Resultado</dt><dd>{e(s['resultado'])}</dd></div>
        </dl>
        <div class="botones"><a class="btn oro" href="/servicios/{s['slug']}/">Ver el servicio completo {FLECHA}</a><a class="btn linea" href="/agenda/?area={s['slug']}">Agendar diagnóstico</a></div>
      </div>
    </article>'''
    filas = ''.join(f'<tr><th scope="row">{s["area"]}</th><td>{e(s["necesitas"])}</td><td>{e(s["para"])}</td><td>{e(", ".join(t for _, t, _ in s["entregables"]))}</td><td><a href="/servicios/{s["slug"]}/">Ver detalle</a></td></tr>' for s in SERVICIOS)
    formatos = ''.join(f'<article class="formato rv" style="--d:{i * .08}s"><span class="kicker">{e(k)}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (k, t, d) in enumerate(FORMATOS))
    faq = ''.join(f'<details><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in PREGUNTAS)
    pasos = [('01', 'Diagnóstico sin costo', 'Llenas la solicitud y, si encaja, agendamos 45 minutos para entender tu reto.'), ('02', 'Propuesta a la medida', 'Te enviamos alcance, equipo, tiempos e inversión, combinando solo lo que necesitas.'), ('03', 'Arranque', 'Definimos indicadores y empezamos a trabajar dentro de tu organización.'), ('04', 'Resultados medibles', 'Reportes claros contra los objetivos acordados desde el inicio.')]
    pasos_html = ''.join(f'<div class="paso rv" style="--d:{i * .08}s"><span class="num">PASO {n}</span><h3>{t}</h3><p>{d}</p></div>' for i, (n, t, d) in enumerate(pasos))
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in PREGUNTAS]}
    cuerpo = f'''{nav('/servicios/')}
<main id="contenido">
<section class="cabecera">
  {foto('monterrey-skyline', foco='50% 55%', foco_m='60% 50%', carga='eager', prioridad=True)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><span>Servicios</span></div>
    <span class="kicker">Servicios</span>
    <h1 class="display">Todo lo que necesitas para <em>decidir, ejecutar y hacerte escuchar.</em></h1>
    <p class="lead">Tres capacidades que se combinan según tu momento. Aquí está, en claro, qué hace cada una, para quién es y qué te llevas.</p>
    <div class="botones"><a class="btn oro" href="/agenda/">Agenda tu diagnóstico {FLECHA}</a><a class="btn linea" href="#comparar">Comparar servicios</a></div>
  </div>
</section>

<section class="sec compacta clara" aria-label="Elige por necesidad">
  <div class="marco">
    <div class="cabeza sola rv"><span class="kicker">Empieza por aquí</span><h2 class="titulo-m">¿Qué necesitas resolver?</h2></div>
    <div class="necesidad">{necesidad}</div>
  </div>
</section>

<section class="sec oscura" aria-label="Servicios">
  <div class="marco">{bloques}</div>
</section>

<section class="sec clara" id="comparar" aria-labelledby="t-comp">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Comparativo</span><h2 class="titulo" id="t-comp">Los tres servicios, <em>de un vistazo.</em></h2></div>
      <p class="lead rv">Si tu reto toca más de uno, no te preocupes: los combinamos en una sola propuesta y bajo un mismo equipo.</p>
    </div>
    <div class="tabla-wrap rv"><table class="tabla"><thead><tr><th>Servicio</th><th>Si necesitas</th><th>Ideal para</th><th>Qué te llevas</th><th></th></tr></thead><tbody>{filas}</tbody></table></div>
  </div>
</section>

<section class="sec oscura" aria-labelledby="t-form">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Formas de trabajar</span><h2 class="titulo" id="t-form">A tu ritmo, <em>con el mismo rigor.</em></h2></div>
      <p class="lead rv">Elegimos juntos el formato después del diagnóstico, según el tamaño del reto y la velocidad que necesitas.</p>
    </div>
    <div class="formatos">{formatos}</div>
    <div class="metodo" style="margin-top:clamp(72px,9vw,120px)">{pasos_html}</div>
  </div>
</section>

<section class="sec clara" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cabeza sola rv"><span class="kicker">Preguntas frecuentes</span><h2 class="titulo" id="t-faq">Lo que todos <em>nos preguntan.</em></h2></div>
    <div class="faq rv">{faq}</div>
  </div>
</section>
{cierre('cdmx-reforma')}
</main>
{pie()}'''
    extra = f'<script type="application/ld+json">{json.dumps(faq_ld, ensure_ascii=False)}</script>\n'
    return cabeza('Servicios · Vorka México', 'Estrategia y Dirección, Liderazgo y Talento, Comunicación e Influencia: qué incluye cada servicio, para quién es y qué te llevas. Agenda tu diagnóstico sin costo.', '/servicios/', og='monterrey-skyline', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- detalle de servicio
def servicio(s):
    caps = ''.join(f'<article class="capacidad rv"><span class="num">{i + 1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (t, d) in enumerate(s['items']))
    ents = ''.join(f'<article class="entregable rv" style="--d:{i * .06}s">{ICONOS[ic]}<h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (ic, t, d) in enumerate(s['entregables']))
    pasos = ''.join(f'<div class="paso rv" style="--d:{i * .08}s"><span class="num">FASE 0{i + 1}</span><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(s['pasos']))
    datos = ''.join(f'<div><b>{e(b)}</b><span>{e(t)}</span></div>' for b, t in s['datos'])
    otros = ''.join(tarjeta_servicio(o, '(max-width: 760px) 100vw, 50vw') for o in SERVICIOS if o is not s)
    faq = ''.join(f'<details><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in PREGUNTAS[:3])
    cuerpo = f'''{nav('/servicios/')}
<main id="contenido">
<section class="cabecera">
  {foto(s['cabecera'], foco=s['cab_foco'], foco_m=s['cab_foco_m'], carga='eager', prioridad=True)}
  <div class="marco">
    <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/servicios/">Servicios</a><span>/</span><span>{s['area']}</span></div>
    <span class="kicker">Servicio {s['num']}</span>
    <h1 class="display">{s['titulo']}</h1>
    <p class="lead">{e(s['promesa'])}</p>
    <div class="botones"><a class="btn oro" href="/agenda/?area={s['slug']}">Agenda tu diagnóstico {FLECHA}</a><a class="btn linea" href="#incluye">Qué incluye</a></div>
    <div class="datos">{datos}</div>
  </div>
</section>

<section class="sec clara" id="incluye" aria-labelledby="t-inc">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Qué incluye</span><h2 class="titulo" id="t-inc">Capacidades que se combinan <em>según tu momento.</em></h2></div>
      <div class="rv"><p class="lead"><b style="color:var(--tinta)">Para quién:</b> {e(s['para'])}</p></div>
    </div>
    <div class="capacidades">{caps}</div>
  </div>
</section>

<section class="sec oscura" aria-labelledby="t-ent">
  <div class="marco">
    <div class="cabeza">
      <div class="rv"><span class="kicker">Qué te llevas</span><h2 class="titulo" id="t-ent">Entregables claros, <em>no presentaciones.</em></h2></div>
      <p class="lead rv">{e(s['resultado'])}</p>
    </div>
    <div class="entregables">{ents}</div>
    <div class="metodo" style="margin-top:clamp(72px,9vw,120px)">{pasos}</div>
  </div>
</section>

<section class="sec clara" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cabeza sola rv"><span class="kicker">Antes de empezar</span><h2 class="titulo-m" id="t-faq">Preguntas frecuentes</h2></div>
    <div class="faq rv">{faq}</div>
    <p class="rv" style="margin-top:28px"><a class="enlace" href="/servicios/#comparar">Comparar con los otros servicios {FLECHA}</a></p>
  </div>
</section>
{cierre(s['foto'] if s['foto'] != s['cabecera'] else 'monterrey-silla', s['cta'], destino=f"/agenda/?area={s['slug']}")}
<section class="sec compacta oscura-2" aria-labelledby="t-otros">
  <div class="marco">
    <div class="cabeza sola rv"><span class="kicker">Ecosistema Vorka</span><h2 class="titulo-m" id="t-otros">También podemos ayudarte con…</h2></div>
    <div class="otros">{otros}</div>
  </div>
</section>
</main>
{pie()}'''
    return cabeza(f"{s['area']} · Vorka México", f"{s['promesa']} {s['para']}", f"/servicios/{s['slug']}/", og=s['cabecera']) + cuerpo + '\n</body>\n</html>\n'

# ---------------------------------------------------------------- 404
def no_encontrada():
    cuerpo = f'''{nav()}
<main id="contenido">
<section class="cabecera" style="min-height:100svh">
  {foto('cdmx-noche', foco='50% 40%', carga='eager')}
  <div class="marco">
    <span class="kicker">Error 404</span>
    <h1 class="display">Esta ruta no está <em>en el mapa.</em></h1>
    <p class="lead">La página que buscas cambió de lugar o ya no existe. Desde aquí te llevamos a donde sí pasan las cosas.</p>
    <div class="botones"><a class="btn oro" href="/">Ir al inicio {FLECHA}</a><a class="btn linea" href="/servicios/">Ver servicios</a><a class="btn linea" href="/sparks/">Revista Sparks</a></div>
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
    escribir('404.html', no_encontrada())
