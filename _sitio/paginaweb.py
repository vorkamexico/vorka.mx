# Vorka México · /servicios/pagina-web/: el plan «Tu página web» para negocios pequeños.
# Precio y condiciones acordados por Vorka (5 nov 2026): $299 MXN al mes con hospedaje y SSL, hasta 3 cambios pequeños al
# mes, botón de WhatsApp y formulario, y alta en Google; el diseño corre por nuestra cuenta con plan de 12 meses (si cancela
# antes, paga los meses que falten); Vorka registra el dominio y le cobra su costo una vez al año, y si se va se lo
# transfiere. Si cambia algo, cámbialo también en _tienda/src/learn-web.js (PLAN_WEB y el llamado de las guías).
import json
from partes import *

PRECIO = '$299'
TIENDA = '/tienda/pagina-web/'   # suscripción en línea (Stripe), _tienda/src/paginaweb.js
WA_PLAN = 'Hola Vorka, quiero mi página web de $299 al mes.'
INCLUYE = [
    ('globo', 'Hospedaje y candado de seguridad', 'Tu página en línea con certificado SSL (HTTPS), sin pagar servidor aparte.'),
    ('doc', 'Hasta 3 cambios pequeños al mes', 'Textos, fotos, precios u horarios: nos escribes y lo cambiamos.'),
    ('rayo', 'Botón de WhatsApp y formulario', 'Tus clientes te escriben directo desde la página.'),
    ('pin', 'Que Google te encuentre', 'Alta en Google Search Console y la liga en tu Perfil de Negocio de Google.'),
]
PASOS = [('Te suscribes', 'En línea con tu tarjeta, y nos escribes por WhatsApp para contarnos de tu negocio.'),
         ('Diseñamos', 'Armamos tu página con tu logo, tus fotos y tus textos. Si no los tienes listos, te ayudamos a definirlos.'),
         ('Revisas', 'Te la mostramos antes de publicarla y la ajustamos contigo.'),
         ('Publicamos', 'En tu dominio, con candado de seguridad y lista para compartir.')]
CONDICIONES = [
    ('Plan de 12 meses', f'El diseño no tiene costo porque el plan es de 12 meses ({PRECIO} al mes). Si cancelas antes, pagas los meses que falten.'),
    ('Tu dominio', 'Lo registramos por ti; su costo exacto se paga una vez al año por transferencia, y te pasamos los datos por WhatsApp. Si un día dejas el plan, te lo transferimos.'),
    ('Cambios más grandes', 'Secciones nuevas, tienda en línea o sistemas a la medida se cotizan aparte.'),
]
PREGUNTAS_WEB = [
    ('¿Cuánto cuesta en total?', f'{PRECIO} MXN al mes, que se cobran en tu tarjeta como suscripción, más el costo de tu dominio, que se paga una vez al año por transferencia. El diseño no tiene costo con el plan de 12 meses.'),
    ('¿Cómo me suscribo?', 'En línea, en vorka.mx/tienda/pagina-web, con tarjeta de crédito o débito. Al terminar el pago te llega un botón para escribirnos por WhatsApp y empezar tu página.'),
    ('¿Cuánto cuesta el dominio?', 'Depende de la terminación (.mx, .com.mx, .com…) y del registrador. Antes de registrarlo te decimos el costo exacto por WhatsApp y lo pagas por transferencia.'),
    ('¿El dominio queda a mi nombre?', 'Lo registramos nosotros para darte el servicio completo. Si dejas el plan, te lo transferimos para que lo sigas usando.'),
    ('¿Qué pasa si quiero cancelar?', 'El plan es de 12 meses porque el diseño corre por nuestra cuenta. Si cancelas antes, pagas los meses que falten; después de los 12 meses sigues mes con mes. Tu tarjeta y tu suscripción se administran en vorka.mx/tienda/suscripcion.'),
    ('¿Qué cuenta como cambio pequeño?', 'Cambiar textos, fotos, precios, horarios o datos de contacto. Incluye hasta 3 al mes; lo que sea más grande, como secciones nuevas o una tienda en línea, se cotiza aparte.'),
    ('¿Puedo vender en línea desde mi página?', 'La página del plan es para presentar tu negocio y que te escriban. Si necesitas tienda en línea con carrito y cobro, la cotizamos aparte en Apps y páginas a la medida.'),
]

ESTILOS = '''<style>
.pw-g { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 32px 56px; align-items: center; }
.pw-precio { padding: 30px; border-radius: 28px; background: var(--noche); color: #F4F2F5; box-shadow: 0 30px 70px -40px rgba(15,13,16,.7); position: relative; overflow: hidden; }
.pw-precio::after { content: ""; position: absolute; inset: auto -40% -60% auto; width: 80%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(200,164,92,.28), transparent 65%); }
.pw-precio .etiqueta { color: #E2C27C; }
.pw-cifra { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 4px; }
.pw-cifra b { font-size: clamp(56px, 9vw, 76px); font-weight: 800; letter-spacing: -.05em; line-height: 1; background: var(--metal-osc); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pw-cifra span { font-size: 17px; color: rgba(244,242,245,.7); }
.pw-mas { font-size: 15px; color: rgba(244,242,245,.72); margin: 0 0 18px; }
.pw-lista { display: grid; gap: 10px; margin: 0 0 22px; padding: 0; list-style: none; }
.pw-lista li { display: flex; gap: 10px; align-items: flex-start; font-size: 15.5px; color: rgba(244,242,245,.92); }
.pw-lista svg { width: 18px; height: 18px; flex: none; margin-top: 3px; color: #7bd3a0; }
.pw-precio .btn { width: 100%; justify-content: center; position: relative; z-index: 1; }
.pw-nota { font-size: 13px; color: rgba(244,242,245,.55); margin: 12px 0 0; text-align: center; position: relative; z-index: 1; }
.pw-inc { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.pw-c { padding: 24px; border-radius: var(--r); background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.pw-c .ic { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--morado-suave); color: var(--morado); }
.pw-c .ic svg { width: 22px; height: 22px; }
.pw-c h3 { font-size: 18px; letter-spacing: -.02em; }
.pw-c p { color: var(--fg-2); font-size: 15px; }
.pw-pasos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; counter-reset: paso; }
.pw-pasos div { padding: 22px; border-radius: var(--r); background: var(--card); border: 1px solid var(--line); }
.pw-pasos small { font-weight: 800; color: var(--morado); letter-spacing: .08em; }
.pw-pasos h3 { font-size: 18px; margin: 6px 0; }
.pw-pasos p, .pw-cond p { color: var(--fg-2); font-size: 15px; }
.pw-cond { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.pw-cond div { padding: 22px; border-radius: var(--r); background: var(--bg-2, #F4F2EF); border-left: 4px solid var(--oro, #C8A45C); }
.pw-cond h3 { font-size: 17px; margin-bottom: 6px; }
.pw-learn { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.pw-learn a { display: flex; justify-content: space-between; gap: 14px; align-items: center; padding: 22px; border-radius: var(--r); background: var(--card); border: 1px solid var(--line); color: inherit; text-decoration: none; }
.pw-learn a b { display: block; font-size: 17px; letter-spacing: -.02em; }
.pw-learn a small { color: var(--fg-2); font-size: 14.5px; }
.pw-learn svg { width: 20px; height: 20px; flex: none; color: var(--morado); }
@media (max-width: 980px) { .pw-g { grid-template-columns: minmax(0, 1fr); } .pw-inc, .pw-pasos { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pw-cond { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) { .pw-inc, .pw-pasos, .pw-learn { grid-template-columns: minmax(0, 1fr); } .pw-precio { padding: 24px; } }
</style>'''

def faq(lista):
    return ''.join(f'<details class="rv"><summary>{e(q)}<i aria-hidden="true"></i></summary><p>{e(a)}</p></details>' for q, a in lista)

def pagina_web():
    incluye_lista = ''.join(f'<li>{ICONOS["check"]}<span>{e(t)}</span></li>' for _, t, _ in INCLUYE)
    incluye = ''.join(f'<article class="pw-c rv" style="--d:{i * .06}s"><span class="ic">{ICONOS[ic]}</span><h3>{e(t)}</h3><p>{e(d)}</p></article>' for i, (ic, t, d) in enumerate(INCLUYE))
    pasos = ''.join(f'<div class="rv" style="--d:{i * .06}s"><small>0{i + 1}</small><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(PASOS))
    cond = ''.join(f'<div class="rv"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in CONDICIONES)
    learn = (f'<a href="/learn/web/como-hacer-una-pagina-web/"><span><b>Cómo hacer una página web para tu negocio</b><small>Los pasos: dominio, hospedaje, diseño y Google.</small></span>{FLECHA}</a>'
             f'<a href="/learn/web/como-programar-una-pagina-web/"><span><b>Cómo programar una página web desde cero</b><small>HTML, CSS y JavaScript, con código para copiar.</small></span>{FLECHA}</a>')
    cuerpo = f'''{nav('/servicios/', cta=('#platiquemos', 'Quiero mi página'))}
<main id="contenido">
<section class="cabecera">
  {v_metal('v-fondo', 'gw', oscuro=False)}
  <div class="marco pw-g">
    <div>
      <div class="migas"><a href="/">Inicio</a><span>/</span><a href="/servicios/">Servicios</a><span>/</span><span>Tu página web</span></div>
      <span class="etiqueta">Tu página web</span>
      <h1 class="h1" style="margin-top:18px">Tu página web, <span class="metal">lista y cuidada.</span></h1>
      <p class="lead">La diseñamos, la publicamos y la mantenemos por ti. Tú pagas una renta de {PRECIO} al mes y tu dominio; el diseño corre por nuestra cuenta.</p>
      <div class="botones"><a class="btn tinta" href="{TIENDA}">Suscribirme en línea {FLECHA}</a><a class="btn blanco" href="{wa(WA_PLAN)}" target="_blank" rel="noopener">Platicar por WhatsApp</a></div>
    </div>
    <aside class="pw-precio rv" aria-label="Precio del plan">
      <span class="etiqueta">Plan Tu página web</span>
      <div class="pw-cifra"><b>{PRECIO}</b><span>MXN al mes</span></div>
      <p class="pw-mas">Suscripción mensual con tarjeta. + tu dominio, a su costo, una vez al año por transferencia. Diseño sin costo con el plan de 12 meses.</p>
      <ul class="pw-lista">{incluye_lista}</ul>
      <a class="btn plata" href="{TIENDA}">Suscribirme {FLECHA}</a>
      <p class="pw-nota">Pago seguro con Stripe. ¿Dudas? <a href="{wa(WA_PLAN)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">WhatsApp</a></p>
    </aside>
  </div>
</section>

<section class="sec pegada" id="incluye" aria-labelledby="t-inc">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Qué incluye</span><h2 class="h2" id="t-inc">Todo para que tu negocio <span class="metal">se vea y te escriban.</span></h2></div>
      <p class="lead">Para negocios, profesionistas y emprendedores que quieren una página propia sin preocuparse por servidores, renovaciones ni cambios.</p></div>
    <div class="pw-inc">{incluye}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-pasos">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Cómo funciona</span><h2 class="h2" id="t-pasos">De un mensaje <span class="metal">a tu página en línea.</span></h2></div>
    <div class="pw-pasos">{pasos}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-cond">
  <div class="marco">
    <div class="cab rv"><span class="etiqueta">Sin letras chiquitas</span><h2 class="h2" id="t-cond">Las condiciones, <span class="metal">claras desde el inicio.</span></h2></div>
    <div class="pw-cond">{cond}</div>
  </div>
</section>

<section class="sec pegada" aria-labelledby="t-learn">
  <div class="marco">
    <div class="cab par rv"><div><span class="etiqueta">Vorka Learn</span><h2 class="h2" id="t-learn">¿Prefieres hacerla <span class="metal">tú mismo?</span></h2></div>
      <p class="lead">Te explicamos cómo, paso a paso y con fuentes oficiales, en dos guías gratis.</p></div>
    <div class="pw-learn rv">{learn}</div>
  </div>
</section>

<section class="sec" aria-labelledby="t-faq">
  <div class="marco">
    <div class="cab centro rv"><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" id="t-faq">Lo que nos <span class="metal">preguntan.</span></h2></div>
    <div class="faq">{faq(PREGUNTAS_WEB)}</div>
  </div>
</section>
{platiquemos('/servicios/pagina-web/', marcar=('web',), area='pagina-web', titulo='Cuéntanos de tu negocio y <span class="metal">armamos tu página.</span>')}
</main>
{pie('empresas')}'''
    servicio = {'@context': 'https://schema.org', '@type': 'Service', 'name': 'Tu página web', 'serviceType': 'Diseño, hospedaje y mantenimiento de páginas web',
                'description': f'Página web para tu negocio por {PRECIO} MXN al mes más el costo del dominio: hospedaje con SSL, hasta 3 cambios pequeños al mes, botón de WhatsApp y formulario, y alta en Google. Diseño sin costo con plan de 12 meses.',
                'url': SITIO + '/servicios/pagina-web/', 'areaServed': {'@type': 'Country', 'name': 'México'},
                'provider': {'@type': 'ProfessionalService', 'name': 'Vorka México', 'url': SITIO + '/'},
                'offers': {'@type': 'Offer', 'price': '299', 'priceCurrency': 'MXN', 'url': SITIO + '/servicios/pagina-web/',
                           'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': '299', 'priceCurrency': 'MXN', 'unitText': 'MONTH'}}}
    faq_ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in PREGUNTAS_WEB]}
    migas = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITIO + '/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Servicios', 'item': SITIO + '/servicios/'},
        {'@type': 'ListItem', 'position': 3, 'name': 'Tu página web', 'item': SITIO + '/servicios/pagina-web/'}]}
    extra = ESTILOS + ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (servicio, faq_ld, migas))
    return cabeza(f'Tu página web por {PRECIO} al mes · Vorka México',
                  f'Página web para tu negocio por {PRECIO} MXN al mes más tu dominio: diseño sin costo, hospedaje con SSL, cambios cada mes, botón de WhatsApp y alta en Google.',
                  '/servicios/pagina-web/', og='cdmx-reforma', extra=extra) + cuerpo + '\n</body>\n</html>\n'

# Banda corta que lleva al plan desde /servicios/ y desde Apps y páginas a la medida
def banda_pagina_web():
    return f'''<section class="sec pegada" aria-label="Plan Tu página web"><div class="marco">
  <a class="pw-banda rv" href="/servicios/pagina-web/">
    <span class="pw-banda-t"><span class="etiqueta">Nuevo · Tu página web</span><b>La página de tu negocio por <span class="metal">{PRECIO} al mes.</span></b>
      <small>Diseño sin costo, hospedaje con candado de seguridad, cambios cada mes y botón de WhatsApp. Solo pagas la renta y tu dominio.</small></span>
    <span class="btn tinta">Ver el plan {FLECHA}</span>
  </a>
</div></section>
<style>.pw-banda{{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px 28px;padding:28px 30px;border-radius:28px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sombra-2,0 20px 50px -30px rgba(15,13,16,.35));color:inherit;text-decoration:none}}
.pw-banda-t{{display:flex;flex-direction:column;gap:8px;max-width:640px}}.pw-banda-t b{{font-size:clamp(22px,3vw,30px);letter-spacing:-.03em;line-height:1.15}}.pw-banda-t small{{color:var(--fg-2);font-size:15.5px}}</style>'''
