# Vorka México · kit de medios de la Revista Sparks (/sparks/anunciate/): para marcas y negocios con público joven que quieren estar en Sparks.
# Cifras reales de enero a septiembre de 2026 (reporte trimestral de Vorka México sobre el contenido de Celaya; las mismas de la ficha de
# patrocinios en PROPUESTAS/sparks-patrocinios). SIN precios: las tarifas son privadas (solo Ejecutivo) y van en la propuesta de cada marca.
# Fotos reales publicadas en Sparks (sparks/anunciate/img/). Reglas editoriales: todo lo pagado va marcado «Contenido pagado»; patrocinar no
# compra decisiones editoriales; no se acepta contenido de partidos ni candidatos.
from partes import *

CIFRAS = [('313,800', 'de alcance acumulado'), ('7,138', 'de alcance promedio por publicación'), ('1,351', 'estudiantes en activaciones'), ('72', 'proyectos juveniles acompañados')]
REDES_P = [('Instagram', 64), ('TikTok', 30), ('Facebook', 6)]
FORMAS = [
    ('nota', 'Nota de marca', 'Que te conozcan',
     'Contamos una historia real de tu negocio o tu marca: quién está detrás, qué hace distinto y por qué le importa a los jóvenes de Celaya.',
     ['Entrevista y fotos en tu lugar, hechas por el equipo de Sparks.', 'Se publica en vorka.mx/sparks, Instagram, TikTok y Facebook.', 'A los 7 días te mandamos su alcance e interacciones.'],
     'Hola, vi el kit de Sparks y me interesa una nota de marca para mi negocio.'),
    ('seccion', 'Patrocinio de sección', 'Estar presente todo el mes',
     'Tu marca acompaña una sección de la revista (Historias, Eventos o la que mejor te quede) mes con mes.',
     ['Tu logo en la sección, en el sitio y en sus publicaciones.', 'Mención de tu marca en 2 publicaciones de redes al mes.', 'Reporte mensual con el alcance de la sección. Mínimo 3 meses.'],
     'Hola, vi el kit de Sparks y me interesa patrocinar una sección.'),
    ('activacion', 'Presencia en activaciones', 'Llegar en persona',
     'Sparks también está en la calle: talleres, conferencias y eventos con estudiantes de Celaya.',
     ['Tu marca en el evento y en su cobertura en redes.', 'Un espacio para presentarte o regalar algo a los asistentes.', 'Fotos y reporte del evento para tus redes.'],
     'Hola, vi el kit de Sparks y me interesa estar en una activación con estudiantes.'),
]
PARA = ['Cafeterías y restaurantes', 'Lugares para salir', 'Gimnasios y estudios', 'Deportes', 'Cursos e idiomas', 'Capacitación',
        'Bancos y cajas', 'Apps para jóvenes', 'Ropa y accesorios', 'Tecnología', 'Marcas locales', 'Empresas que buscan talento joven']
CINTA_K = ['viaje', 'futbol', 'premio', 'porto', 'grupo', 'reconocimiento', 'evento']

def pagina_anunciate():
    flecha = ico('<path d="M5 12h14M13 6l6 6-6 6"/>', 1.6)
    cinta = ''.join(f'<figure><img src="/sparks/anunciate/img/{k}.webp" alt="" loading="eager" decoding="async"></figure>' for k in CINTA_K * 2)
    cif = ''.join(f'<div class="rv" style="--d:{i * .06}s"><b>{e(n)}</b><span>{e(t)}</span></div>' for i, (n, t) in enumerate(CIFRAS))
    redes = ''.join(f'<div class="ak-red"><span>{e(n)}</span><i style="--p:{p}%"></i><b>{p} %</b></div>' for n, p in REDES_P)
    formas = ''.join(f"""<details class="ak-forma rv" style="--d:{i * .05}s" id="{k}"{' open' if i == 0 else ''}><summary class="est-fila"><span><b>{e(t)}</b><span>{e(sub)}</span></span>{flecha}</summary>
      <div class="ak-forma-in"><p>{e(d)}</p><ul>{''.join(f'<li>{e(x)}</li>' for x in l)}</ul><a class="est-pill" href="{wa(msg)}" target="_blank" rel="noopener">Quiero mi propuesta {FLECHA}</a></div></details>"""
        for i, (k, t, sub, d, l, msg) in enumerate(FORMAS))
    redes_mini = ''.join(f'<span><i style="--p:{p}%"></i>{e(n)} {p} %</span>' for n, p in REDES_P)
    chips = ''.join(f'<span>{e(x)}</span>' for x in PARA * 2)
    pide = wa('Hola, vi el kit de Sparks y quiero mi propuesta.')
    cuerpo = f'''{nav('/sparks/', cta=(pide, 'Quiero mi propuesta'))}
<main id="contenido" class="pf-mix">
<section class="cabecera pf-cab">
  <div class="marco pf-cab-in">
    <div class="pf-cab-tx">
      <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/sparks/">Sparks</a><span>/</span><span>Anúnciate</span></div>
      <span class="etiqueta">Revista Sparks · Kit de medios</span>
      <h1 class="h1" style="margin-top:18px">Llega a los jóvenes de Celaya <span class="metal">con historias,</span> no con anuncios.</h1>
      <p class="lead">Sparks cuenta historias reales de jóvenes y de su ciudad en el sitio, Instagram, TikTok y Facebook. Tu marca puede estar ahí, de forma clara y bien hecha.</p>
      <div class="botones"><a class="btn tinta" href="{pide}" target="_blank" rel="noopener">Quiero mi propuesta {FLECHA}</a><a class="btn blanco" href="#formas">Ver formas de sumarte</a></div>
    </div>
    <div class="ak-collage" aria-hidden="true">
      <img class="c1" src="/sparks/anunciate/img/futbol.webp" width="1000" height="666" alt="" decoding="async">
      <img class="c2" src="/sparks/anunciate/img/premio.webp" width="1000" height="562" alt="" decoding="async">
      <img class="c3" src="/sparks/anunciate/img/viaje.webp" width="1000" height="750" alt="" decoding="async">
      <div class="ak-tarjeta"><small>Alcance enero a septiembre</small><b>313,800</b>{redes_mini}</div>
    </div>
  </div>
</section>
<div class="est-cinta" aria-hidden="true"><div class="est-cinta-in">{cinta}</div></div>
<section class="sec pegada" aria-labelledby="t-llega">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-llega">Una comunidad joven que <span class="metal">sí nos lee</span></h2><p>Estudiantes de prepa y universidad, sus familias y quienes trabajan con ellos. Ofrecemos estar cerca de esa comunidad, no impresiones sueltas.</p></div>
    <div class="est-cifras">{cif}</div>
    <div class="ak-redes rv"><p>De dónde viene el alcance</p>{redes}</div>
    <p class="ak-fuente">Enero a septiembre de 2026. Fuente: reporte trimestral de Vorka México sobre el contenido de Celaya.</p>
  </div>
</section>
<section class="sec pegada" id="formas" aria-labelledby="t-formas">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-formas">Elige cómo <span class="metal">quieres estar</span></h2><p>Te mandamos una propuesta con tarifas para tu marca en menos de 24 horas. Cada formato incluye su reporte de resultados.</p></div>
    <div class="est-lista">{formas}</div>
  </div>
</section>
<section class="sec pegada" aria-labelledby="t-para">
  <div class="marco"><div class="est-cab rv"><h2 class="h2" id="t-para">Para marcas que quieren <span class="metal">a los jóvenes</span> de Celaya</h2></div></div>
  <div class="est-chips" aria-label="Para quién es"><div class="est-chips-in">{chips}</div></div>
  <div class="marco"><div class="ak-reglas rv"><h3 class="h3">Reglas claras</h3>
    <p>Todo lo pagado se publica con la etiqueta «Contenido pagado». Patrocinar no compra decisiones editoriales: las historias las elige el equipo de Sparks. No aceptamos contenido de partidos políticos ni candidatos. La Revista Sparks es de Vorka México.</p></div></div>
</section>
<section class="sec oscura redondo" aria-labelledby="t-cierre">
  <div class="grano"></div>
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-cierre" style="color:#fff">¿Platicamos <span class="metal">tu propuesta?</span></h2><p style="color:var(--claro-2)">Escríbenos por WhatsApp con el nombre de tu marca y lo que buscas. Te respondemos con una propuesta y sus tarifas.</p></div>
    <a class="est-barra rv" href="{pide}" target="_blank" rel="noopener">Escribir por WhatsApp {flecha}</a>
  </div>
</section>
</main>
{pie()}'''
    extra = f'<link rel="stylesheet" href="/assets/v3/estudio.css?v={VERSION}">\n<link rel="stylesheet" href="/sparks/anunciate/anunciate.css?v={VERSION}">\n'
    return cabeza('Anúnciate en la Revista Sparks · Vorka México',
                  'Kit de medios de la Revista Sparks: llega a los jóvenes de Celaya con historias reales. Nota de marca, patrocinio de sección y presencia en activaciones, con reporte de resultados.',
                  '/sparks/anunciate/', extra=extra) + cuerpo + '\n</body>\n</html>\n'
