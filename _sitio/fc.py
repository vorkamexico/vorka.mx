# Vorka México · /fc/: Vorka FC, academia de fútbol en Celaya. La inscripción llega a os.vorka.mx (Vorka FC).
from partes import *

# Mismos textos que acepta el servidor (vorka-os/src/fc.js)
CUPO, EDADES, MENSUALIDAD = 25, (6, 10), 980
RAMAS = ['Varonil', 'Femenil']
POSICIONES = ['Portero', 'Defensa', 'Medio', 'Delantero', 'Aún no sé']
EXPERIENCIA = ['Ninguna, sería su primera vez', 'Juega en la escuela o con amigos', 'Ya estuvo en una escuela de fútbol o liga']
PARENTESCOS = ['Mamá', 'Papá', 'Tutor(a) legal', 'Otro familiar']
ASISTENCIA = ['Sí, los 3 días', 'Solo algunos días']
APORTACION = ['Por ahora no puedo aportar', 'Hasta $100 al mes', '$100 a $300 al mes', 'Más de $300 al mes', 'Prefiero aportar material (balones, conos)']
BECA = ['Sí', 'No', 'Tal vez']
COMO = ['Instagram', 'Facebook', 'TikTok', 'Recomendación', 'Escuela', 'Vorka México', 'Otro']

# Una sesión de 90 minutos (minutos, nombre, qué se hace, intensidad del azul)
SESION = [(15, 'Activación', 'Movilidad y coordinación con balón', '22%'), (25, 'Técnica', 'Conducción, pase y control', '55%'),
          (25, 'Juego reducido', 'Rondos y 3 vs 3', '100%'), (20, 'Partido', 'Aplicar lo aprendido', '78%'), (5, 'Cierre', 'Estiramiento y plática', '12%')]
FAQ = [
    ('¿De verdad los primeros 3 meses son gratis?', 'Sí. Durante los primeros 3 meses no hay mensualidad. Pedimos una cuota voluntaria, la que cada familia pueda, para comprar balones y conos y pagar el uso de la cancha. Si por ahora no puedes aportar, tu hijo o hija entrena igual.'),
    ('¿Cuánto cuesta después?', f'Desde el cuarto mes la mensualidad es de ${MENSUALIDAD:,} al mes. Hay becas: márcalo en la inscripción y lo platicamos contigo.'),
    ('¿Dónde está la cancha?', 'En Celaya. La ubicación exacta está por confirmar; te la mandamos por WhatsApp en cuanto confirmemos tu lugar.'),
    ('¿Qué tiene que llevar a su primer entrenamiento?', 'Ropa deportiva, tenis o tachos, espinilleras y una botella de agua. Para la inscripción formal: acta de nacimiento, CURP y certificado médico reciente.'),
    ('Mi hijo o hija nunca ha jugado, ¿puede entrar?', f'Claro. El programa es para niñas y niños de {EDADES[0]} a {EDADES[1]} años, juegues o no. Formamos grupos por nivel dentro de la sesión.'),
    ('¿Qué pasa si ya no hay lugares?', f'El grupo es de {CUPO} jugadores para que cada quien toque mucho balón. Si ya está lleno, tu solicitud entra en lista de espera y te avisamos en orden de llegada cuando se libere un lugar.'),
]

def opciones(nombre, lista, tarjetas=False):
    clase = 'opciones tarjetas' if tarjetas else 'opciones'
    ops = ''.join(f'<label class="op-fc"><input type="radio" name="{nombre}" value="{e(v)}"><span>{e(v)}</span></label>' for v in lista)
    return f'<div class="{clase}" role="radiogroup">{ops}</div>'

def select(nombre, lista):
    return f'<select id="f-{nombre}" name="{nombre}"><option value="">Selecciona</option>' + ''.join(f'<option>{e(v)}</option>' for v in lista) + '</select>'

CHECK = ICONOS['check']
FONDO_LOBO = '<span class="lobo fondo" aria-hidden="true"></span>'
TRAZO = '<svg class="trazo" viewBox="0 0 600 90" fill="none" aria-hidden="true"><path d="M8 70 C 120 52, 260 40, 430 30 S 560 22, 590 18 M 548 4 L 592 18 L 552 40" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#grano)"/></svg>'
GRANO = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="grano" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="1" seed="7" result="r"/>
  <feColorMatrix in="r" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.9" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in"/></filter></svg>'''

def pagina_fc():
    seg = ''.join(f'<div class="seg{" f" if int(o[:-1]) >= 55 else ""}" style="--m:{m};--o:{o}" title="{e(n)} · {m} min"><b>{m}′</b><span>{e(n)}</span></div>' for m, n, _, o in SESION)
    ley = ''.join(f'<div style="flex:{m} 1 0"><b style="color:var(--fg)">{e(n)}.</b> {e(d)}</div>' for m, n, d, _ in SESION)
    dias = ''.join(f'''<div class="dia{' si' if d in ('Lun', 'Mié', 'Vie') else ''}"><b>{d}</b><div class="col">{'<div class="bloque"><strong>Vorka FC</strong><small>5:00–6:30 pm</small></div>' if d in ('Lun', 'Mié', 'Vie') else ''}</div></div>'''
                   for d in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])
    faq = ''.join(f'<details class="rv"><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in FAQ)
    banda = ''.join(f'<span>{t}</span>' for t in ['3 meses gratis', 'Cuota voluntaria', f'{EDADES[0]} a {EDADES[1]} años', 'Lun · Mié · Vie', '5:00 a 6:30 pm', f'Cupo {CUPO}', 'Becas', 'Celaya, Gto.'])
    ld = {'@context': 'https://schema.org', '@type': 'SportsOrganization', 'name': 'Vorka FC', 'sport': 'Soccer', 'url': f'{SITIO}/fc/',
          'description': f'Academia de fútbol para niñas y niños de {EDADES[0]} a {EDADES[1]} años en Celaya, Guanajuato.',
          'parentOrganization': {'@type': 'Organization', 'name': 'Vorka México', 'url': SITIO},
          'location': {'@type': 'Place', 'address': {'@type': 'PostalAddress', 'addressLocality': 'Celaya', 'addressRegion': 'Guanajuato', 'addressCountry': 'MX'}}}
    import json
    extra = f'''<link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/fc.css?v={VERSION}">
<meta property="og:image:alt" content="Vorka FC, academia de fútbol en Celaya">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
'''
    cuerpo = f'''{nav(actual='/fc/#programa', oscuro=True, publico='fc')}
{GRANO}
<main id="contenido" class="fc">
  <section class="fc-hero">
    <div class="foto" style="--foco:50% 62%"><img src="/img/fc/madero-1600.webp" srcset="/img/fc/madero-960.webp 960w, /img/fc/madero-1600.webp 1600w, /img/fc/madero-2400.webp 2400w" sizes="100vw" alt="" fetchpriority="high" decoding="async"></div>
    <div class="marco fc-hero-grid">
      <div class="lockup">
        <span class="lobo" aria-hidden="true"></span>
        <h1 class="fc-d"><span>Vorka</span><span>FC</span><span class="sr"> · Academia de fútbol en Celaya</span></h1>
        {TRAZO}
      </div>
      <div class="fc-hero-txt">
        <span class="chip-vivo"><i></i><span>Inscripciones abiertas · <b data-lugares>{CUPO}</b> lugares</span></span>
        <p class="lead">Academia de fútbol para niñas y niños de <b>{EDADES[0]} a {EDADES[1]} años</b> en Celaya. <b>Los primeros 3 meses son gratis</b>, con cuota voluntaria.</p>
        <div class="botones"><a class="btn azul" href="#inscripcion">Inscribir a mi hijo o hija {FLECHA}</a><a class="btn vidrio" href="#programa">Ver el programa</a></div>
        <div class="datos-hero"><div><b>L·Mi·V</b><span>Lunes, miércoles y viernes</span></div><div><b class="num">5–6:30</b><span>de la tarde</span></div><div><b class="num">{CUPO}</b><span>lugares por grupo</span></div></div>
      </div>
    </div>
  </section>
  <div class="banda" aria-hidden="true"><div class="banda-pista">{banda}{banda}</div></div>

  <section class="sec" id="programa">
    <div class="marco">
      <div class="cab rv"><span class="etiqueta">El programa</span><h2 class="fc-d fc-h2" style="margin-top:18px">Fútbol en serio <em>desde chicos</em></h2>
        <p class="lead">Tres entrenamientos a la semana, grupos chicos y mucho balón. Técnica, juego en equipo y disciplina, en un ambiente donde equivocarse es parte de aprender.</p></div>
      <div class="ficha">
        <div class="dato rv"><small>Edades</small><b class="num">{EDADES[0]}–{EDADES[1]}<sub>años</sub></b><p>Niñas y niños, juegues o no.</p></div>
        <div class="dato rv" style="--d:.06s"><small>Días</small><b>L·Mi·V</b><p>Lunes, miércoles y viernes.</p></div>
        <div class="dato rv" style="--d:.12s"><small>Horario</small><b class="num">5:00<sub>a 6:30 pm</sub></b><p>90 minutos por sesión.</p></div>
        <div class="dato azul rv" style="--d:.18s"><small>Cupo máximo</small><b class="num"><span data-lugares>{CUPO}</span><sub>de {CUPO} libres</sub></b><div class="cupo-barra"><i data-barra></i></div><p data-cupo-texto>Grupo de {CUPO} jugadores.</p></div>
      </div>
      <div class="semana rv">
        <div class="semana-cab"><h3>Tu semana en Vorka FC</h3><span>4.5 horas de fútbol a la semana</span></div>
        <div class="dias"><div class="hora" aria-hidden="true"><span>3 pm</span><span>4 pm</span><span>5 pm</span><span>6 pm</span><span>7 pm</span></div>{dias}</div>
      </div>
    </div>
  </section>

  <section class="sec oscura" id="costo">
    <div class="marco">
      <div class="cab rv"><span class="etiqueta">Cuánto cuesta</span><h2 class="fc-d fc-h2" style="margin-top:18px">Empieza <em>sin pagar</em> mensualidad</h2>
        <p class="lead">Queremos que ninguna familia se quede fuera por dinero. Por eso arrancamos gratis y hay becas.</p></div>
      <div class="costo">
        <div class="etapa e1 rv"><span class="cuando">Meses 1 a 3</span><div class="precio">Gratis</div>
          <p>Sin mensualidad. Cada familia da una <b>cuota voluntaria</b>, la que pueda, y se usa en:</p>
          <ul><li>{CHECK}Balones</li><li>{CHECK}Conos y material de entrenamiento</li><li>{CHECK}Uso de la cancha</li></ul></div>
        <div class="flecha-costo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></div>
        <div class="etapa e2 rv" style="--d:.1s"><span class="cuando">Desde el mes 4</span><div class="precio num">${MENSUALIDAD}<small>al mes</small></div>
          <p>Tres entrenamientos por semana con entrenador, material y seguimiento de cada jugador.</p>
          <div class="sello-beca"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 15 8l6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z"/></svg><div><b>Hay becas</b><span>Márcalo en la inscripción y lo platicamos.</span></div></div></div>
      </div>
    </div>
  </section>

  <section class="sec" id="sesion">
    <div class="marco">
      <div class="cab rv"><span class="etiqueta">Así entrenamos</span><h2 class="fc-d fc-h2" style="margin-top:18px">90 minutos <em>con balón</em></h2>
        <p class="lead">Cada sesión sigue la misma estructura para que los niños sepan qué viene y aprovechen cada minuto.</p></div>
      <div class="sesion rv"><div class="sesion-barra">{seg}</div><div class="escala" aria-hidden="true"><span>0′</span><span>15′</span><span>30′</span><span>45′</span><span>60′</span><span>75′</span><span>90′</span></div><div class="sesion-leyenda">{ley}</div></div>
    </div>
  </section>

  <section class="sec pegada" id="celaya">
    <div class="marco">
      <div class="cab rv"><span class="etiqueta">Hecho en Celaya</span><h2 class="fc-d fc-h2" style="margin-top:18px">La manada <em>juega en casa</em></h2></div>
      <div class="celaya">
        <figure class="grande rv"><img src="/img/fc/carmen-1600.webp" srcset="/img/fc/carmen-960.webp 960w, /img/fc/carmen-1600.webp 1600w" sizes="(max-width: 860px) 100vw, 40vw" alt="Templo del Carmen desde la calle Francisco I. Madero, Celaya" loading="lazy" decoding="async"><figcaption>Templo del Carmen</figcaption></figure>
        <figure class="rv" style="--d:.06s"><img src="/img/fc/bola-agua-960.webp" sizes="(max-width: 860px) 50vw, 30vw" alt="La Bola del Agua, Celaya" loading="lazy" decoding="async"><figcaption>Bola del Agua</figcaption></figure>
        <figure class="rv" style="--d:.12s"><img src="/img/fc/balon-960.webp" srcset="/img/fc/balon-960.webp 960w, /img/fc/balon-1600.webp 1600w" sizes="(max-width: 860px) 50vw, 30vw" alt="Balón de fútbol sobre el pasto" loading="lazy" decoding="async"><figcaption>Cancha por confirmar</figcaption></figure>
        <div class="ubica rv" style="--d:.18s"><span class="lobo" aria-hidden="true"></span>
          <h3>Celaya, Guanajuato</h3>
          <p>Estamos cerrando la cancha. Al inscribirte te mandamos la ubicación exacta por WhatsApp antes del primer entrenamiento.</p>
          <span class="ubica-pin">{ICONOS['pin']}Ubicación por confirmar</span></div>
      </div>
    </div>
  </section>

  <section class="sec fc-azul" id="inscripcion">
    {FONDO_LOBO}
    <div class="marco ins-grid">
      <div class="ins-lado">
        <div><span class="etiqueta">Inscripción</span><h2 class="fc-d fc-h2" style="margin-top:18px">Aparta su lugar</h2></div>
        <p class="lead">Toma 3 minutos. Te escribimos por WhatsApp para confirmar y darte la ubicación.</p>
        <ol id="marcas"><li>Jugador</li><li>Familia</li><li>Programa</li><li>Confirmar</li></ol>
      </div>
      <div class="tarjeta-f">
        <div class="prog-m"><span id="num-paso">Paso 1 de 4 · Jugador</span><div class="pista"><i id="pista" style="width:25%"></i></div></div>
        <form id="fc-form" novalidate>
          <div class="trampa" aria-hidden="true"><label>Sitio web <input name="sitio" tabindex="-1" autocomplete="off"></label></div>

          <div class="paso-fc activo" data-paso="1">
            <div><h3>¿Quién va a jugar?</h3><p class="sub">Datos del niño o niña, como en su acta de nacimiento.</p></div>
            <div class="filas">
              <div class="cf ancho"><label for="f-jugador">Nombre completo</label><input id="f-jugador" name="jugador" autocomplete="off" required><span class="error">Escribe nombre y apellidos.</span></div>
              <div class="cf"><label for="f-fecha_nac">Fecha de nacimiento</label><input id="f-fecha_nac" name="fecha_nac" type="date" required><span class="ayuda" id="edad-ayuda"></span><span class="error" id="edad-error">Revisa la fecha.</span></div>
              <div class="cf"><span class="lbl">Rama</span>{opciones('rama', RAMAS)}<span class="error">Elige una opción.</span></div>
              <div class="cf ancho"><span class="lbl">Posición favorita</span>{opciones('posicion', POSICIONES)}<span class="error">Elige una (o “Aún no sé”).</span></div>
              <div class="cf ancho"><span class="lbl">¿Ha jugado antes?</span>{opciones('experiencia', EXPERIENCIA, True)}<span class="error">Elige una opción.</span></div>
              <div class="cf ancho"><label for="f-salud">Alergias o condiciones médicas <span class="opc">(opcional)</span></label><textarea id="f-salud" name="salud" placeholder="Asma, alergias, lesiones… Nos ayuda a cuidarlo."></textarea></div>
            </div>
          </div>

          <div class="paso-fc" data-paso="2">
            <div><h3>Mamá, papá o tutor</h3><p class="sub">Con quien nos comunicamos. Te mandamos la confirmación por WhatsApp y correo.</p></div>
            <div class="filas">
              <div class="cf"><label for="f-tutor">Nombre completo</label><input id="f-tutor" name="tutor" autocomplete="name" required><span class="error">Escribe nombre y apellidos.</span></div>
              <div class="cf"><label for="f-parentesco">Parentesco</label>{select('parentesco', PARENTESCOS)}<span class="error">Elige el parentesco.</span></div>
              <div class="cf"><label for="f-whatsapp">WhatsApp</label><input id="f-whatsapp" name="whatsapp" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10 dígitos" required><span class="error">Escribe 10 dígitos.</span></div>
              <div class="cf"><label for="f-correo">Correo</label><input id="f-correo" name="correo" type="email" autocomplete="email" placeholder="nombre@correo.com" required><span class="error">Revisa el correo.</span></div>
              <div class="cf"><label for="f-colonia">Colonia</label><input id="f-colonia" name="colonia" autocomplete="address-level3" required><span class="error">Escribe la colonia.</span></div>
              <div class="cf"><label for="f-municipio">Municipio</label><input id="f-municipio" name="municipio" autocomplete="address-level2" value="Celaya" required><span class="error">Escribe el municipio.</span></div>
              <div class="cf ancho"><label for="f-emergencia">Contacto de emergencia <span class="opc">(opcional)</span></label><input id="f-emergencia" name="emergencia" placeholder="Nombre y teléfono de otra persona"></div>
            </div>
          </div>

          <div class="paso-fc" data-paso="3">
            <div><h3>Programa y apoyo</h3><p class="sub">Lunes, miércoles y viernes de 5:00 a 6:30 pm. Los primeros 3 meses son gratis.</p></div>
            <div class="cf"><span class="lbl">¿Puede asistir los 3 días?</span>{opciones('asistencia', ASISTENCIA)}<span class="error">Elige una opción.</span></div>
            <div class="cf"><span class="lbl">Cuota voluntaria de los primeros 3 meses</span><span class="ayuda">Se usa en balones, conos y la cancha. Cualquier opción está bien.</span>{opciones('aportacion', APORTACION, True)}<span class="error">Elige una opción.</span></div>
            <div class="cf"><span class="lbl">Desde el mes 4 la mensualidad es de ${MENSUALIDAD}. ¿Te interesa una beca?</span>{opciones('beca', BECA)}<span class="error">Elige una opción.</span></div>
            <div class="cf"><label for="f-como_supo">¿Cómo nos conociste? <span class="opc">(opcional)</span></label>{select('como_supo', COMO)}</div>
          </div>

          <div class="paso-fc" data-paso="4">
            <div><h3>Revisa y envía</h3><p class="sub">Si algo está mal, toca “Editar”.</p></div>
            <div class="resumen-f" id="resumen"></div>
            <label class="acepto"><input type="checkbox" name="acepta" id="f-acepta"><span>Soy la mamá, papá o tutor del jugador. Leí el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a> y autorizo a Vorka México a usar estos datos para la inscripción a Vorka FC.</span></label>
          </div>

          <div class="aviso-f" id="aviso" role="alert"></div>
          <div class="acciones-f" id="acciones">
            <button type="button" class="btn blanco" id="atras" hidden>Atrás</button>
            <span class="guardado" id="guardado"></span><span class="esp"></span>
            <button type="button" class="btn azul" id="sig">Continuar {FLECHA}</button>
            <button type="submit" class="btn azul" id="enviar" hidden>Enviar inscripción {FLECHA}</button>
          </div>
        </form>

        <div class="exito-fc" id="exito" role="status" aria-live="polite">
          <div class="sello">{CHECK}</div>
          <div><h3 id="exito-titulo">¡Listo! Ya está en la manada.</h3><p class="sub" id="exito-sub"></p></div>
          <div class="folio-fc"><div><small>Folio</small><b id="folio"></b></div><button type="button" class="btn blanco chico" id="copiar">Copiar folio</button></div>
          <ol class="sigue">
            <li><b>Te escribimos por WhatsApp</b><span>Para confirmar el lugar y mandarte la ubicación de la cancha.</span></li>
            <li><b>Primer entrenamiento</b><span>Lunes, miércoles o viernes a las 5:00 pm. Ropa deportiva, espinilleras y agua.</span></li>
            <li><b>Inscripción formal</b><span>Entregas los documentos y arrancan los 3 meses gratis.</span></li>
          </ol>
          <div class="docs-fc"><span>Acta de nacimiento</span><span>CURP</span><span>Certificado médico</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec suave" id="preguntas">
    <div class="marco">
      <div class="cab rv" style="text-align:center"><span class="etiqueta">Preguntas</span><h2 class="fc-d fc-h2" style="margin-top:18px">Lo que <em>nos preguntan</em></h2></div>
      <div class="faq">{faq}</div>
    </div>
  </section>

  <section class="sec pegada suave">
    <div class="marco">
      <div class="respaldo rv">
        {v_metal('art', 'gfc', oscuro=False)}
        <div><h3>Un proyecto de Vorka México</h3><p>Vorka FC es parte de Vorka México, la misma organización detrás de la Revista Sparks y de Tú en Vorka en Celaya. Si tienes dudas, escríbenos.</p></div>
        <div class="botones"><a class="btn tinta" href="{wa('Hola, quiero información de Vorka FC.')}" target="_blank" rel="noopener">WhatsApp {FLECHA}</a><a class="btn blanco" href="/">Conoce Vorka</a></div>
      </div>
      <p class="creditos">Fotos de Celaya: Juan Carlos Fonseca Mata, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener">CC BY-SA 4.0</a>, vía Wikimedia Commons, en blanco y negro. Balón: Peter Glaser, dominio público.</p>
    </div>
  </section>
</main>
{pie('fc')}{JS}'''
    return (cabeza('Vorka FC · Academia de fútbol en Celaya', f'Academia de fútbol para niñas y niños de {EDADES[0]} a {EDADES[1]} años en Celaya. Lunes, miércoles y viernes de 5:00 a 6:30 pm. Los primeros 3 meses son gratis, con cuota voluntaria. Cupo de {CUPO}.',
                   '/fc/', og='celaya', extra=extra).replace(f'{SITIO}/img/ciudades/celaya-1600.webp', f'{SITIO}/img/fc/madero-1600.webp')
            + cuerpo + '\n</body>\n</html>\n')

JS = r'''<script>
(function () {
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8787' : 'https://os.vorka.mx';
  var CLAVE = 'vorka_fc_v1', TOTAL = 4, EDAD = [6, 10], CUPO = 25;
  var NOMBRES = ['Jugador', 'Familia', 'Programa', 'Confirmar'];
  var f = document.getElementById('fc-form'), pasos = f.querySelectorAll('.paso-fc'), marcas = document.querySelectorAll('#marcas li');
  var atras = document.getElementById('atras'), sig = document.getElementById('sig'), enviar = document.getElementById('enviar');
  var aviso = document.getElementById('aviso'), guard = document.getElementById('guardado');
  var actual = 1, enviado = false, t;

  // Lugares disponibles (en vivo desde os.vorka.mx)
  function pintarCupo(c) {
    document.querySelectorAll('[data-lugares]').forEach(function (el) { el.textContent = c.lugares; });
    var b = document.querySelector('[data-barra]'); if (b) b.style.setProperty('--p', Math.round(c.ocupados / c.cupo * 100) + '%');
    var tx = document.querySelector('[data-cupo-texto]');
    if (tx) tx.textContent = c.lugares ? (c.lugares <= 5 ? '¡Últimos lugares!' : c.ocupados + ' lugares ya apartados.') : 'Grupo lleno: entra en lista de espera.';
  }
  fetch(API + '/api/publico/fc/cupo').then(function (r) { return r.ok ? r.json() : null; }).then(function (c) { if (c) pintarCupo(c); }).catch(function () { });

  function edad(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (!m) return null;
    var h = new Date(), e = h.getFullYear() - +m[1];
    if (h.getMonth() + 1 < +m[2] || (h.getMonth() + 1 === +m[2] && h.getDate() < +m[3])) e--;
    return e;
  }
  function datos() { var d = {}; new FormData(f).forEach(function (v, k) { d[k] = typeof v === 'string' ? v.trim() : v; }); return d; }
  function campo(n) { var el = f.querySelector('[name="' + n + '"]'); return el && el.closest('.cf'); }
  function marcar(n, ok) { var c = campo(n); if (c) c.classList.toggle('mal', !ok); return ok; }
  var REGLAS = {
    1: function (d) {
      var e = edad(d.fecha_nac), ok = true;
      var err = document.getElementById('edad-error');
      err.textContent = e === null ? 'Indica su fecha de nacimiento.' : 'Por ahora el programa es para niñas y niños de ' + EDAD[0] + ' a ' + EDAD[1] + ' años.';
      ok = marcar('jugador', d.jugador.length >= 5 && /\s/.test(d.jugador)) && ok;
      ok = marcar('fecha_nac', e !== null && e >= EDAD[0] && e <= EDAD[1]) && ok;
      ok = marcar('rama', !!d.rama) && ok; ok = marcar('posicion', !!d.posicion) && ok; ok = marcar('experiencia', !!d.experiencia) && ok;
      return ok;
    },
    2: function (d) {
      var ok = marcar('tutor', d.tutor.length >= 5 && /\s/.test(d.tutor));
      ok = marcar('parentesco', !!d.parentesco) && ok;
      ok = marcar('whatsapp', d.whatsapp.replace(/\D/g, '').length === 10) && ok;
      ok = marcar('correo', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) && ok;
      ok = marcar('colonia', d.colonia.length >= 2) && ok; ok = marcar('municipio', d.municipio.length >= 2) && ok;
      return ok;
    },
    3: function (d) { var ok = marcar('asistencia', !!d.asistencia); ok = marcar('aportacion', !!d.aportacion) && ok; return marcar('beca', !!d.beca) && ok; }
  };
  function falla(m) { aviso.textContent = m; aviso.classList.add('si'); }
  function mostrar(n, sinScroll) {
    actual = Math.max(1, Math.min(TOTAL, n)); aviso.classList.remove('si');
    pasos.forEach(function (p) { p.classList.toggle('activo', +p.dataset.paso === actual); });
    marcas.forEach(function (m, i) { m.classList.toggle('activo', i + 1 === actual); m.classList.toggle('hecho', i + 1 < actual); });
    document.getElementById('num-paso').textContent = 'Paso ' + actual + ' de ' + TOTAL + ' · ' + NOMBRES[actual - 1];
    document.getElementById('pista').style.width = (actual / TOTAL * 100) + '%';
    atras.hidden = actual === 1; sig.hidden = actual === TOTAL; enviar.hidden = actual !== TOTAL;
    if (actual === TOTAL) resumen();
    if (!sinScroll) document.getElementById('inscripcion').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  sig.addEventListener('click', function () {
    var ok = REGLAS[actual](datos());
    if (!ok) { falla('Revisa los campos marcados en rojo.'); var m = f.querySelector('.paso-fc.activo .mal input, .paso-fc.activo .mal select'); if (m) m.focus({ preventScroll: false }); return; }
    mostrar(actual + 1);
  });
  atras.addEventListener('click', function () { mostrar(actual - 1); });
  f.addEventListener('change', function (e) {
    var c = e.target.closest('.cf'); if (c && c.classList.contains('mal')) REGLAS[actual] && REGLAS[actual](datos());
    if (e.target.name === 'fecha_nac') { var x = edad(e.target.value); document.getElementById('edad-ayuda').innerHTML = x === null ? '' : x + ' años' + (x >= EDAD[0] && x <= EDAD[1] ? ' · <b>entra al programa</b>' : ''); }
    guardar();
  });
  f.addEventListener('input', function (e) { if (e.target.name === 'whatsapp') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); clearTimeout(t); t = setTimeout(guardar, 500); });

  var ETQ = [['Jugador', 1, [['jugador', 'Nombre'], ['fecha_nac', 'Nacimiento'], ['rama', 'Rama'], ['posicion', 'Posición'], ['experiencia', 'Experiencia'], ['salud', 'Salud']]],
    ['Familia', 2, [['tutor', 'Nombre'], ['parentesco', 'Parentesco'], ['whatsapp', 'WhatsApp'], ['correo', 'Correo'], ['colonia', 'Colonia'], ['municipio', 'Municipio'], ['emergencia', 'Emergencia']]],
    ['Programa', 3, [['asistencia', 'Los 3 días'], ['aportacion', 'Cuota voluntaria'], ['beca', 'Beca'], ['como_supo', 'Nos conoció por']]]];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function resumen() {
    var d = datos();
    if (d.fecha_nac) { var p = d.fecha_nac.split('-'); d.fecha_nac = p[2] + '/' + p[1] + '/' + p[0] + ' (' + edad(datos().fecha_nac) + ' años)'; }
    document.getElementById('resumen').innerHTML = ETQ.map(function (g) {
      return '<section><h4>' + g[0] + '<button type="button" data-ir="' + g[1] + '">Editar</button></h4><dl>' + g[2].map(function (x) { return d[x[0]] ? '<dt>' + x[1] + '</dt><dd>' + esc(d[x[0]]) + '</dd>' : ''; }).join('') + '</dl></section>';
    }).join('');
    document.querySelectorAll('[data-ir]').forEach(function (b) { b.onclick = function () { mostrar(+b.dataset.ir); }; });
  }

  // Borrador en este dispositivo
  function guardar() {
    if (enviado) return;
    try { var d = datos(); delete d.acepta; delete d.sitio; localStorage.setItem(CLAVE, JSON.stringify(d)); guard.textContent = 'Avance guardado'; } catch (e) { }
  }
  try {
    var b = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (b) Object.keys(b).forEach(function (k) {
      f.querySelectorAll('[name="' + k + '"]').forEach(function (el) { if (el.type === 'radio') el.checked = el.value === b[k]; else el.value = b[k]; });
    });
  } catch (e) { }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (actual !== TOTAL) return;
    if (!document.getElementById('f-acepta').checked) return falla('Para enviar, acepta el aviso de privacidad.');
    var d = datos(); d.acepta = true;
    enviar.disabled = true; enviar.firstChild.textContent = 'Enviando… ';
    fetch(API + '/api/publico/fc/inscripcion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'No se pudo enviar.'); return j; }); })
      .then(function (j) {
        enviado = true; try { localStorage.removeItem(CLAVE); } catch (e) { }
        var nino = d.jugador.split(/\s+/)[0], ex = document.getElementById('exito');
        document.getElementById('folio').textContent = j.folio;
        if (j.espera) {
          ex.classList.add('espera');
          document.getElementById('exito-titulo').textContent = nino + ' quedó en lista de espera';
          document.getElementById('exito-sub').textContent = 'Los ' + CUPO + ' lugares ya están apartados. Si se libera uno, te escribimos por WhatsApp en orden de llegada. Te mandamos el folio a ' + d.correo + '.';
        } else document.getElementById('exito-sub').textContent = 'Apartamos el lugar de ' + nino + '. Te mandamos la confirmación a ' + d.correo + '.';
        f.hidden = true; document.querySelector('.prog-m').hidden = true; ex.classList.add('si');
        marcas.forEach(function (m) { m.classList.remove('activo'); m.classList.add('hecho'); });
        document.getElementById('inscripcion').scrollIntoView({ behavior: 'smooth', block: 'start' });
        fetch(API + '/api/publico/fc/cupo').then(function (r) { return r.ok ? r.json() : null; }).then(function (c) { if (c) pintarCupo(c); }).catch(function () { });
      })
      .catch(function (x) { falla(x.message === 'Failed to fetch' ? 'No pudimos conectar. Revisa tu internet e intenta de nuevo.' : x.message); enviar.disabled = false; enviar.firstChild.textContent = 'Enviar inscripción '; });
  });
  document.getElementById('copiar').addEventListener('click', function () {
    var v = document.getElementById('folio').textContent, b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { b.textContent = 'Copiado'; }, function () { b.textContent = v; });
  });
  mostrar(1, true);
})();
</script>
'''


# La portada de /fc/ se diseña a mano en fc/index.html (escudo, lobo, fotos de Celaya).
# build.py ya no la regenera completa: solo le pone el menú y el pie de Vorka FC de partes.py.
# pagina_fc() se queda como referencia del primer diseño.
def actualizar_fc(html):
    import re
    menu = nav(actual='/fc/#programa', oscuro=True, publico='fc')
    a, b = html.index('<header class="nav'), html.index('<div class="menu-movil"')
    b = html.index('</div>', b) + len('</div>')
    html = html[:a] + menu.strip() + html[b:]
    a, b = html.index('<footer'), html.index('</footer>') + len('</footer>')
    pie_fc = re.search(r'<footer.*?</footer>', pie('fc'), re.S).group(0)
    return html[:a] + pie_fc + html[b:]
