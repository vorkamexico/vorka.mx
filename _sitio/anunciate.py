# Vorka México · kit de medios de la Revista Sparks (/sparks/anunciate/): para marcas y negocios con público joven que quieren estar en Sparks.
# Cifras reales de enero a septiembre de 2026 (reporte trimestral de Vorka México sobre el contenido de Celaya; las mismas de la ficha de
# patrocinios en PROPUESTAS/sparks-patrocinios). SIN precios: las tarifas son privadas (solo Ejecutivo) y van en la propuesta de cada marca.
# Fotos reales publicadas en Sparks (sparks/anunciate/img/). Reglas editoriales: todo lo pagado va marcado «Contenido pagado»; patrocinar no
# compra decisiones editoriales; no se acepta contenido de partidos ni candidatos.
from partes import *

CIFRAS = [('54', 'publicaciones de Celaya'), ('313,800', 'de alcance acumulado'), ('7,138', 'de alcance promedio por publicación'),
          ('28', 'publicaciones arriba de 5,000'), ('1,351', 'estudiantes en activaciones'), ('72', 'proyectos juveniles acompañados')]
REDES_P = [('Instagram', 64), ('TikTok', 30), ('Facebook', 6)]
FORMAS = [
    ('nota', 'Que te conozcan', 'Nota de marca',
     'Contamos una historia real de tu negocio o tu marca: quién está detrás, qué hace distinto y por qué le importa a los jóvenes de Celaya.',
     ['Entrevista y fotos en tu lugar, hechas por el equipo de Sparks.', 'Se publica en vorka.mx/sparks, Instagram, TikTok y Facebook.', 'A los 7 días te mandamos su alcance e interacciones.'],
     'Hola, vi el kit de Sparks y me interesa una nota de marca para mi negocio.'),
    ('seccion', 'Estar presente todo el mes', 'Patrocinio de sección',
     'Tu marca acompaña una sección de la revista (Historias, Eventos o la que mejor te quede) mes con mes.',
     ['Tu logo en la sección, en el sitio y en sus publicaciones.', 'Mención de tu marca en 2 publicaciones de redes al mes.', 'Reporte mensual con el alcance de la sección. Mínimo 3 meses.'],
     'Hola, vi el kit de Sparks y me interesa patrocinar una sección.'),
    ('activacion', 'Llegar en persona', 'Presencia en activaciones',
     'Sparks también está en la calle: talleres, conferencias y eventos con estudiantes de Celaya.',
     ['Tu marca en el evento y en su cobertura en redes.', 'Un espacio para presentarte o regalar algo a los asistentes.', 'Fotos y reporte del evento para tus redes.'],
     'Hola, vi el kit de Sparks y me interesa estar en una activación con estudiantes.'),
]
PARA = ['Cafeterías, restaurantes y lugares para salir', 'Gimnasios, estudios y deportes', 'Cursos, idiomas y capacitación', 'Bancos, cajas y apps con productos para jóvenes',
        'Marcas locales de ropa, accesorios y tecnología', 'Empresas que buscan talento joven']
GALERIA = [('viaje', 'Una joven de Celaya rumbo a un intercambio'), ('futbol', 'Deporte juvenil en la ciudad'), ('premio', 'Jóvenes premiados por sus proyectos'),
           ('porto', 'Estudiantes de Celaya en el extranjero'), ('grupo', 'Activación con estudiantes'), ('reconocimiento', 'Reconocimiento a una joven de Celaya')]

def pagina_anunciate():
    cif = ''.join(f'<div class="ak-c rv" style="--d:{(i % 3) * .06}s"><b>{e(n)}</b><span>{e(t)}</span></div>' for i, (n, t) in enumerate(CIFRAS))
    redes = ''.join(f'<div class="ak-red"><span>{e(n)}</span><i style="--p:{p}%"></i><b>{p} %</b></div>' for n, p in REDES_P)
    formas = ''.join(f'''<article class="ak-f rv" style="--d:{i * .07}s" id="{k}"><p class="ak-f-s">{e(sub)}</p><h3 class="h3">{e(t)}</h3><p class="ak-f-d">{e(d)}</p>
      <ul>{''.join(f'<li>{e(x)}</li>' for x in l)}</ul><a class="btn tinta chico" href="{wa(msg)}" target="_blank" rel="noopener">Quiero mi propuesta {FLECHA}</a></article>'''
        for i, (k, t, sub, d, l, msg) in enumerate(FORMAS))
    gal = ''.join(f'<figure class="ak-g{" grande" if i == 0 else ""}"><img src="/sparks/anunciate/img/{k}.webp" alt="{e(a)}" loading="{"eager" if i < 3 else "lazy"}" decoding="async"><figcaption>{e(a)}</figcaption></figure>' for i, (k, a) in enumerate(GALERIA))
    para = ''.join(f'<li>{e(x)}</li>' for x in PARA)
    cuerpo = f'''{nav('/sparks/', cta=(wa('Hola, vi el kit de Sparks y quiero mi propuesta.'), 'Quiero mi propuesta'))}
<main id="contenido">
<section class="cabecera ak-cab">
  <div class="marco ak-cab-in">
    <div>
      <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/sparks/">Sparks</a><span>/</span><span>Anúnciate</span></div>
      <span class="etiqueta">Revista Sparks · para marcas</span>
      <h1 class="h1" style="margin-top:18px">Llega a los jóvenes de Celaya <span class="metal">con historias, no con anuncios.</span></h1>
      <p class="lead">Sparks cuenta historias reales de jóvenes y de su ciudad en el sitio, Instagram, TikTok y Facebook. Tu marca puede estar ahí, de forma clara y bien hecha.</p>
      <div class="botones"><a class="btn tinta" href="{wa('Hola, vi el kit de Sparks y quiero mi propuesta.')}" target="_blank" rel="noopener">Quiero mi propuesta {FLECHA}</a><a class="btn blanco" href="#formas">Ver formas de sumarte</a></div>
    </div>
    <div class="ak-gal">{gal}</div>
  </div>
</section>
<section class="sec pegada" aria-labelledby="t-llega">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">A quién llegas</span><h2 class="h2" id="t-llega" style="margin-top:18px">Una comunidad joven <span class="metal">que sí nos lee.</span></h2></div>
      <p class="lead">Estudiantes de prepa y universidad, sus familias y quienes trabajan con ellos. Lo que ofrecemos es estar cerca de esa comunidad, no impresiones sueltas.</p></div>
    <div class="ak-cifras">{cif}</div>
    <div class="ak-redes rv"><p>De dónde viene el alcance</p>{redes}</div>
    <p class="ak-fuente">Enero a septiembre de 2026. Fuente: reporte trimestral de Vorka México sobre el contenido de Celaya.</p>
  </div>
</section>
<section class="sec oscura redondo" id="formas" aria-labelledby="t-formas">
  <div class="grano"></div>
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Formas de sumarte</span><h2 class="h2" id="t-formas" style="margin-top:18px">Elige cómo <span class="metal">quieres estar.</span></h2></div>
      <p class="lead">Te mandamos una propuesta con tarifas para tu marca en menos de 24 horas. Cada formato incluye su reporte de resultados.</p></div>
    <div class="ak-formas">{formas}</div>
  </div>
</section>
<section class="sec" aria-labelledby="t-para">
  <div class="marco ak-dos">
    <div class="rv"><span class="etiqueta">Para quién es</span><h2 class="h2" id="t-para" style="margin-top:18px">Marcas que quieren <span class="metal">a los jóvenes de Celaya.</span></h2>
      <ul class="ak-para">{para}</ul></div>
    <div class="ak-reglas rv" style="--d:.08s"><h3 class="h3">Reglas claras</h3>
      <p>Todo lo pagado se publica con la etiqueta «Contenido pagado».</p>
      <p>Patrocinar no compra decisiones editoriales: las historias las elige el equipo de Sparks.</p>
      <p>No aceptamos contenido de partidos políticos ni candidatos.</p>
      <p>La Revista Sparks es de Vorka México.</p></div>
  </div>
</section>
<section class="cierre plat" aria-labelledby="t-cierre">
  {v_metal('art', 'gak')}<div class="glow"></div><div class="grano"></div>
  <div class="marco" style="text-align:center">
    <h2 class="h2" id="t-cierre">¿Platicamos tu propuesta?</h2>
    <p class="lead" style="margin:16px auto 0">Escríbenos por WhatsApp con el nombre de tu marca y lo que buscas. Te respondemos con una propuesta y sus tarifas.</p>
    <div class="botones" style="justify-content:center"><a class="btn plata" href="{wa('Hola, vi el kit de Sparks y quiero mi propuesta.')}" target="_blank" rel="noopener">Escribir por WhatsApp {FLECHA}</a><a class="btn vidrio" href="https://www.instagram.com/vorka.mx/" target="_blank" rel="noopener">Instagram @vorka.mx</a></div>
  </div>
</section>
</main>
{pie()}'''
    extra = '<link rel="stylesheet" href="/sparks/anunciate/anunciate.css?v=' + VERSION + '">\n'
    return cabeza('Anúnciate en la Revista Sparks · Vorka México',
                  'Kit de medios de la Revista Sparks: llega a los jóvenes de Celaya con historias reales. Nota de marca, patrocinio de sección y presencia en activaciones, con reporte de resultados.',
                  '/sparks/anunciate/', extra=extra) + cuerpo + '\n</body>\n</html>\n'
