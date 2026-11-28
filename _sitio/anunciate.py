# Vorka México · kit de medios de la Revista Sparks (/sparks/anunciate/): para marcas y negocios con público joven que quieren estar en Sparks.
# Alcance: suma de TODAS las publicaciones de Sparks medidas en Vorka OS (reporte_piezas de todos los municipios), en vivo.
# Sin precios públicos (Brandon, 2026-11-25): «precios accesibles» y se cotiza por mensaje. Los precios viven en vorka-os/src/catalogo-sparks.js.
# Las solicitudes van a os.vorka.mx › Prospectos (POST /api/publico/vorka/interes, origen sparks_kit, WhatsApp obligatorio).
# Fotos reales publicadas en Sparks (sparks/anunciate/img/).
from partes import *

# El alcance se lee en vivo de os.vorka.mx/api/publico/sparks/alcance (suma de todas las publicaciones medidas): al construir la página
# y otra vez en el navegador, así nunca hay que actualizarlo a mano. Si os no responde, quedan estas cifras (consulta del 2026-11-24).
API_ALCANCE = 'https://os.vorka.mx/api/publico/sparks/alcance'
ALCANCE_RESPALDO = {'total': 458885, 'promedio': 6650, 'anio': 2026,
                    'redes': [{'red': 'Instagram', 'pct': 63}, {'red': 'TikTok', 'pct': 32}, {'red': 'Facebook', 'pct': 5}]}

def datos_alcance():
    import json, urllib.request
    try:
        with urllib.request.urlopen(urllib.request.Request(API_ALCANCE, headers={'User-Agent': 'vorka-sitio'}), timeout=6) as r:
            d = json.load(r)
        return d if d.get('total') else ALCANCE_RESPALDO
    except Exception:
        return ALCANCE_RESPALDO

def miles(n):
    return f'{int(n):,}'

# (clave, nombre, para qué, precio, qué es, qué incluye)
FORMAS = [
    ('nota', 'Nota de tu negocio', 'La hacemos nosotros de principio a fin', 'Precio accesible',
     'Publicamos una nota sobre tu negocio o tu marca. Vamos contigo, te entrevistamos, tomamos fotos y video, la escribimos y la publicamos: tú solo nos abres la puerta.',
     ['Entrevista, fotos y video en tu lugar, hechos por el equipo de Sparks.', 'Se publica en vorka.mx/sparks, Instagram, TikTok y Facebook.', 'A los 7 días te mandamos su alcance e interacciones.']),
    ('contenido', 'Nota con tu contenido', 'Tú nos mandas el material', 'Precio accesible',
     'Te mandamos el guion y el manual de Sparks. Tú grabas, tomas las fotos y nos mandas todo; nosotros lo editamos, escribimos la nota y la publicamos.',
     ['Guion y manual para que tu material se vea como Sparks.', 'Edición, texto y publicación en el sitio y las tres redes.', 'A los 7 días te mandamos su alcance e interacciones.']),
    ('patrocinio-nota', 'Patrocina una nota', 'Tu marca junto a una historia', 'Precio accesible',
     'Tu marca acompaña una historia de Sparks sobre un joven o un proyecto, con tu logo y la mención «Esta historia llega gracias a…».',
     ['Tu logo en la nota del sitio y en sus publicaciones.', 'Mención de tu marca en el texto de redes.', 'Nosotros elegimos y contamos la historia; tú ayudas a que llegue más lejos.']),
    ('seccion', 'Patrocinio de sección', 'Estar presente todo el mes', 'Mensual · mínimo 3 meses',
     'Tu marca acompaña una sección de la revista (Historias, Eventos o la que mejor te quede) mes con mes.',
     ['Tu logo en la sección, en el sitio y en sus publicaciones.', 'Mención de tu marca en 2 publicaciones de redes al mes.', 'Reporte mensual con el alcance de la sección.']),
    ('activacion', 'Presencia en activaciones', 'Llegar en persona', 'Según el evento',
     'Sparks también está en la calle: talleres, conferencias y eventos con estudiantes.',
     ['Tu marca en el evento y en su cobertura en redes.', 'Un espacio para presentarte o regalar algo a los asistentes.', 'Fotos y reporte del evento para tus redes.']),
]
PARA = ['Cafeterías y restaurantes', 'Lugares para salir', 'Gimnasios y estudios', 'Deportes', 'Cursos e idiomas', 'Capacitación',
        'Bancos y cajas', 'Apps para jóvenes', 'Ropa y accesorios', 'Tecnología', 'Marcas locales', 'Empresas que buscan talento joven']
# Proyectos que impulsamos: las notas de jóvenes MÁS LEÍDAS de los últimos 60 días (os.vorka.mx/api/publico/sparks/populares, en el navegador);
# mientras no haya lecturas, o si os no responde, salen estas historias (de sparks/celaya/noticias.json; si una ya no está, se omite)
PROYECTOS = ['andrea', 'sara', 'amay-caballero', 'coria', 'ximena-martinez', 'chimal']

def proyectos_html():
    import json, os
    ruta = os.path.join(os.path.dirname(__file__), '..', 'sparks', 'celaya', 'noticias.json')
    try:
        d = json.load(open(ruta, encoding='utf-8'))
    except Exception:
        return ''
    por = {n['s']: n for n in d.get('n', [])}
    # Las fotos viven en fotos.vorka.mx; si la copia local se generó sin R2 trae rutas del repo que no existen en línea
    base = d.get('img') if str(d.get('img', '')).startswith('https://') else 'https://fotos.vorka.mx/celaya'
    tarjetas = []
    for i, k in enumerate(x for x in PROYECTOS if x in por):
        n = por[k]
        tarjetas.append(f'<a class="ak-proy rv" style="--d:{(i % 3) * .07}s" href="/sparks/celaya/{e(n["s"])}/"><span class="im"><img src="{e(base)}/{e(n["i"])}-800.webp" alt="{e(n.get("p") or "")}" loading="lazy" decoding="async"></span>'
                        f'<b>{e(n["t"])}</b><span>Leer su historia</span></a>')
    return ''.join(tarjetas)

CINTA_K = ['viaje', 'futbol', 'premio', 'porto', 'grupo', 'reconocimiento', 'evento']

def solicitud_html():
    """Formulario que llega a os.vorka.mx › Prospectos. WhatsApp obligatorio: por ahí se manda la propuesta."""
    ops = ''.join(f'<option value="{e(k)}">{e(t)}</option>' for k, t, _, pr, _, _ in FORMAS)
    return f'''<section class="sec oscura redondo ak-sol" id="solicitud" aria-labelledby="t-sol">
  <div class="grano"></div>
  <div class="marco plat-in">
    <div class="rv">
      <span class="etiqueta">Tu propuesta</span>
      <h2 class="h2" id="t-sol" style="margin-top:18px;color:#fff">Cuéntanos de tu marca y <span class="metal">te escribimos.</span></h2>
      <p class="lead" style="color:var(--claro-2)">Déjanos tus datos y el formato que te interesa. En menos de 24 horas te escribimos por WhatsApp con tu propuesta y lo que sigue.</p>
      <div class="botones"><a class="btn vidrio" href="{wa('Hola, vi el kit de Sparks y quiero mi propuesta.')}" target="_blank" rel="noopener">Prefiero escribir por WhatsApp</a></div>
    </div>
    <div class="v4-form-caja rv" style="--d:.1s">
      <form class="v4-form ak-form" novalidate>
        <div class="trampa" aria-hidden="true"><label>No llenar <input name="empresa_web" tabindex="-1" autocomplete="off"></label></div>
        <label class="v4-campo"><span>Tu nombre</span><input name="nombre" autocomplete="name" required minlength="3" maxlength="100"></label>
        <label class="v4-campo"><span>Tu negocio o marca</span><input name="organizacion" autocomplete="organization" required maxlength="140"></label>
        <label class="v4-campo"><span>WhatsApp</span><input name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="10 dígitos"></label>
        <label class="v4-campo"><span>Correo</span><input name="correo" type="email" autocomplete="email" inputmode="email" required maxlength="120"></label>
        <label class="v4-campo"><span>¿Qué te interesa?</span><select name="formato">{ops}<option value="no-se">Todavía no sé, quiero que me orienten</option></select></label>
        <label class="v4-campo"><span>Algo que debamos saber <small>(opcional)</small></span><textarea name="mensaje" rows="3" maxlength="800"></textarea></label>
        <label class="casilla v4-casilla"><input type="checkbox" name="acepta" value="1"> <span>Acepto el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a> y que Vorka México me contacte.</span></label>
        <button class="btn tinta v4-enviar" type="submit">Quiero mi propuesta {FLECHA}</button>
        <p class="v4-msg" role="status" aria-live="polite"></p>
      </form>
      <div class="v4-exito" hidden tabindex="-1">
        <span class="v4-ok">{ICONOS['check']}</span>
        <h3 class="h3">Listo<span data-nombre></span>. Ya tenemos tu solicitud.</h3>
        <p>En menos de 24 horas te escribimos por WhatsApp con tu propuesta.</p>
        <p class="v4-folio" hidden>Tu folio: <b data-folio></b></p>
      </div>
    </div>
  </div>
</section>
<script>
(() => {{
  const API = /^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname) ? 'http://localhost:8787/api/publico/vorka/interes' : 'https://os.vorka.mx/api/publico/vorka/interes';
  const f = document.querySelector('.ak-form'), msg = f.querySelector('.v4-msg'), btn = f.querySelector('.v4-enviar'), ok = f.parentNode.querySelector('.v4-exito'), sel = f.querySelector('[name=formato]');
  // «Quiero esta» en cada formato: lo elige en el formulario y baja hasta él
  document.querySelectorAll('[data-formato]').forEach(a => a.addEventListener('click', () => {{ sel.value = a.dataset.formato; }}));
  const falla = (t, campo) => {{
    msg.textContent = t; f.querySelectorAll('.v4-campo.error').forEach(c => c.classList.remove('error'));
    if (campo) {{ const el = f.querySelector('[name="' + campo + '"]'); el.closest('.v4-campo').classList.add('error'); el.focus(); }}
  }};
  f.addEventListener('submit', ev => {{
    ev.preventDefault();
    const d = new FormData(f), v = k => String(d.get(k) || '').trim();
    const x = {{ nombre: v('nombre').replace(/\\s+/g, ' '), organizacion: v('organizacion'), whatsapp: v('whatsapp'), correo: v('correo').toLowerCase(),
      intereses: ['sparks'], origen: 'sparks_kit', acepta: !!d.get('acepta'), empresa_web: v('empresa_web') }};
    if (x.nombre.length < 3) return falla('Escribe tu nombre.', 'nombre');
    if (x.organizacion.length < 2) return falla('Escribe el nombre de tu negocio o marca.', 'organizacion');
    if (x.whatsapp.replace(/\\D/g, '').length < 10) return falla('Escribe tu WhatsApp a 10 dígitos: por ahí te mandamos tu propuesta.', 'whatsapp');
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{{2,}}$/.test(x.correo)) return falla('Revisa tu correo.', 'correo');
    if (!x.acepta) return falla('Necesitamos que aceptes el aviso de privacidad.');
    falla('');
    x.mensaje = 'Formato: ' + sel.options[sel.selectedIndex].text + (v('mensaje') ? '\\n' + v('mensaje') : '') + '\\nEnviado desde vorka.mx/sparks/anunciate/';
    btn.disabled = true;
    fetch(API, {{ method: 'POST', headers: {{ 'content-type': 'application/json' }}, body: JSON.stringify(x) }})
      .then(r => r.json().catch(() => ({{}})).then(j => {{ if (!r.ok) throw new Error(j.error || 'No se pudo enviar.'); return j; }}))
      .then(j => {{
        ok.querySelector('[data-nombre]').textContent = ', ' + x.nombre.split(' ')[0];
        if (j.folio) {{ ok.querySelector('[data-folio]').textContent = j.folio; ok.querySelector('.v4-folio').hidden = false; }}
        f.hidden = true; ok.hidden = false; ok.focus();
        if (window.vorkaEvento) window.vorkaEvento('Lead', {{ content_name: 'Kit Sparks' }});
      }})
      .catch(er => {{ btn.disabled = false; falla((er && er.message) || 'No pudimos enviar. Intenta de nuevo o escríbenos por WhatsApp.'); }});
  }});
}})();
</script>'''

def pagina_anunciate():
    al = datos_alcance()
    REDES_P = [(x['red'], x['pct']) for x in al['redes']]
    CIFRAS = [(miles(al['total']), 'de alcance acumulado en redes', 'total'), (miles(al['promedio']), 'de alcance promedio por publicación', 'promedio'),
              ('1,351', 'estudiantes en activaciones', ''), ('72', 'proyectos juveniles acompañados', '')]
    FUENTE = f'Todas las publicaciones de Sparks medidas desde {al.get("anio") or 2026}, en todas las ediciones y municipios. Se actualiza solo. Fuente: reportes de Vorka México.'
    cinta = ''.join(f'<figure><img src="/sparks/anunciate/img/{k}.webp" alt="" loading="eager" decoding="async"></figure>' for k in CINTA_K * 2)
    atr = lambda k: f' data-al="{k}"' if k else ''
    cif = ''.join(f'<div class="rv" style="--d:{i * .06}s"><b{atr(k)}>{e(n)}</b><span>{e(t)}</span></div>' for i, (n, t, k) in enumerate(CIFRAS))
    redes = ''.join(f'<div class="ak-red" data-red="{e(n)}"><span>{e(n)}</span><i style="--p:{p}%"></i><b>{p} %</b></div>' for n, p in REDES_P)
    flecha = ico('<path d="M5 12h14M13 6l6 6-6 6"/>', 1.6)
    formas = ''.join(f"""<details class="ak-forma rv" style="--d:{i * .05}s" id="{k}"{' open' if i == 0 else ''}><summary class="est-fila"><span><b>{e(t)}</b><span>{e(sub)}</span><i class="ak-precio">{e(pr)}</i></span>{flecha}</summary>
      <div class="ak-forma-in"><p>{e(d)}</p><ul>{''.join(f'<li>{e(x)}</li>' for x in l)}</ul><a class="est-pill" href="#solicitud" data-formato="{k}">Quiero esta {FLECHA}</a></div></details>"""
        for i, (k, t, sub, pr, d, l) in enumerate(FORMAS))
    redes_mini = ''.join(f'<span data-red="{e(n)}"><i style="--p:{p}%"></i>{e(n)} <em>{p}</em> %</span>' for n, p in REDES_P)
    chips = ''.join(f'<span>{e(x)}</span>' for x in PARA * 2)
    cuerpo = f'''{nav('/sparks/', cta=('#solicitud', 'Quiero mi propuesta'))}
<main id="contenido" class="pf-mix">
<section class="cabecera pf-cab">
  <div class="marco pf-cab-in">
    <div class="pf-cab-tx">
      <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/sparks/">Sparks</a><span>/</span><span>Anúnciate</span></div>
      <span class="etiqueta">Revista Sparks · Kit de medios</span>
      <h1 class="h1" style="margin-top:18px">Llega a los jóvenes de México <span class="metal">con historias,</span> no con anuncios.</h1>
      <p class="lead">Sparks cuenta los proyectos que impulsan jóvenes de México: lo que estudian, crean, compiten y hacen por su comunidad. Tu marca puede impulsarlos con nosotros en el sitio, Instagram, TikTok y Facebook.</p>
      <div class="botones"><a class="btn tinta" href="#solicitud">Quiero mi propuesta {FLECHA}</a><a class="btn blanco" href="#formas">Ver formas</a></div>
    </div>
    <div class="ak-collage" aria-hidden="true">
      <img class="c1" src="/sparks/anunciate/img/futbol.webp" width="1000" height="666" alt="" decoding="async">
      <img class="c2" src="/sparks/anunciate/img/premio.webp" width="1000" height="562" alt="" decoding="async">
      <img class="c3" src="/sparks/anunciate/img/viaje.webp" width="1000" height="750" alt="" decoding="async">
      <div class="ak-tarjeta"><small>Alcance acumulado en redes</small><b data-al="total">{miles(al["total"])}</b>{redes_mini}</div>
    </div>
  </div>
</section>
<div class="est-cinta" aria-hidden="true"><div class="est-cinta-in">{cinta}</div></div>
<section class="sec pegada" aria-labelledby="t-proy">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-proy">Los proyectos <span class="metal">que impulsamos</span></h2><p>Jóvenes que estudian, emprenden, compiten y sirven a su comunidad. Sparks cuenta su historia y tu marca puede ser parte de lo que viene.</p></div>
    <div class="ak-proys">{proyectos_html()}</div>
  </div>
</section>
<section class="sec pegada" aria-labelledby="t-llega">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-llega">Una comunidad joven que <span class="metal">sí nos lee</span></h2><p>Estudiantes de prepa y universidad, sus familias y quienes trabajan con ellos, en varios municipios. Ofrecemos estar cerca de esa comunidad, no impresiones sueltas.</p></div>
    <div class="est-cifras">{cif}</div>
    <div class="ak-redes rv"><p>De dónde viene el alcance</p>{redes}</div>
    <p class="ak-fuente">{e(FUENTE)}</p>
  </div>
</section>
<section class="sec pegada" id="formas" aria-labelledby="t-formas">
  <div class="marco">
    <div class="est-cab rv"><h2 class="h2" id="t-formas">Elige cómo <span class="metal">quieres estar</span></h2><p>Precios accesibles para negocios y marcas de todos los tamaños. Escríbenos y te mandamos tu propuesta por WhatsApp; cada formato incluye su reporte de resultados.</p></div>
    <div class="est-lista">{formas}</div>
  </div>
</section>
<section class="sec pegada" aria-labelledby="t-para">
  <div class="marco"><div class="est-cab rv"><h2 class="h2" id="t-para">Para marcas que quieren <span class="metal">a los jóvenes</span> de México</h2></div></div>
  <div class="est-chips" aria-label="Para quién es"><div class="est-chips-in">{chips}</div></div>
</section>
{solicitud_html()}
<script>
// Los proyectos que impulsamos: las notas de jóvenes más leídas (se actualiza solo). Si no hay datos, se queda la lista de la página.
(() => {{
  const CATS = ['Historias', 'Emprendimiento', 'Deporte', 'Educación', 'Cultura'], ED = ['celaya', 'cortazar', 'nacional'];
  const caja = document.querySelector('.ak-proys'); if (!caja) return;
  const esc = t => String(t || '').replace(/[&<>"]/g, c => ({{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }})[c]);
  Promise.all([fetch('https://os.vorka.mx/api/publico/sparks/populares').then(r => r.ok ? r.json() : null).catch(() => null),
    ...ED.map(ed => fetch('/sparks/' + ed + '/noticias.json').then(r => r.ok ? r.json() : null).catch(() => null))]).then(([pop, ...eds]) => {{
    if (!pop || !pop.notas || !pop.notas.length) return;
    const por = {{}};
    eds.forEach((d, i) => d && (d.n || []).forEach(n => {{ por[ED[i] + '/' + n.s] = {{ n, img: d.img, ed: ED[i] }}; }}));
    const top = pop.notas.map(x => por[x.e + '/' + x.s]).filter(x => x && CATS.includes(x.n.c) && x.n.p && x.n.i).slice(0, 6);   // solo historias de una persona (con nombre), nunca noticias
    if (top.length < 3) return;
    // Completa con las de la página que no estén ya
    const ya = new Set(top.map(x => '/sparks/' + x.ed + '/' + x.n.s + '/'));
    const resto = [...caja.querySelectorAll('.ak-proy')].filter(a => !ya.has(a.getAttribute('href'))).slice(0, 6 - top.length).map(a => a.outerHTML);
    caja.innerHTML = top.map(x => '<a class="ak-proy rv visto" href="/sparks/' + x.ed + '/' + esc(x.n.s) + '/"><span class="im"><img src="' + esc(x.img) + '/' + esc(x.n.i) + '-800.webp" alt="' + esc(x.n.p) + '" loading="lazy" decoding="async"></span><b>' + esc(x.n.t) + '</b><span>Leer su historia</span></a>').join('') + resto.join('');
  }});
}})();
// Alcance en vivo desde os.vorka.mx (mismo cálculo que al construir la página); si no responde, se quedan las cifras de la página
fetch('{API_ALCANCE}').then(r => r.ok ? r.json() : null).then(d => {{
  if (!d || !d.total) return;
  const m = n => Number(n).toLocaleString('en-US');
  document.querySelectorAll('[data-al=total]').forEach(x => x.textContent = m(d.total));
  document.querySelectorAll('[data-al=promedio]').forEach(x => x.textContent = m(d.promedio));
  (d.redes || []).forEach(r => document.querySelectorAll('[data-red="' + r.red + '"]').forEach(x => {{
    const i = x.querySelector('i'); if (i) i.style.setProperty('--p', r.pct + '%');
    const t = x.querySelector('b') || x.querySelector('em'); if (t) t.textContent = x.querySelector('b') ? r.pct + ' %' : r.pct;
  }}));
}}).catch(() => {{}});
</script>
</main>
{pie()}'''
    extra = f'<link rel="stylesheet" href="/assets/v3/estudio.css?v={VERSION}">\n<link rel="stylesheet" href="/sparks/anunciate/anunciate.css?v={VERSION}">\n'
    return cabeza('Anúnciate en la Revista Sparks · Vorka México',
                  'Kit de medios de la Revista Sparks: llega a los jóvenes de México con historias reales. Notas de tu negocio, patrocinio de historias y de secciones a precios accesibles, con reporte de resultados.',
                  '/sparks/anunciate/', extra=extra) + cuerpo + '\n</body>\n</html>\n'
