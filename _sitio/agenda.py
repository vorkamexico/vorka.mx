# Vorka México · /agenda/: solicitud de diagnóstico por pasos. Los datos llegan a os.vorka.mx (Prospectos).
from partes import *

# Mismos textos que acepta el servidor (vorka-os/src/prospectos.js)
TIPOS = [('Empresa establecida', 'Con operación y equipo consolidados'), ('Startup o empresa en crecimiento', 'Escalando producto, mercado o equipo'),
         ('Gobierno o sector público', 'Dependencia, secretaría o municipio'), ('Campaña o figura política', 'Candidatura, partido o equipo de gobierno'),
         ('Fundación u organización civil', 'Incidencia, filantropía o RSE'), ('Marca personal o figura pública', 'Líder, vocero, creador o experto'),
         ('Emprendimiento en etapa inicial', 'Validando idea o primeros clientes')]
TAMANOS = ['1 a 10 personas', '11 a 50 personas', '51 a 200 personas', '201 a 1,000 personas', 'Más de 1,000 personas']
FACTURACION = ['Menos de $1 millón al año', '$1 a $10 millones al año', '$10 a $50 millones al año', '$50 a $250 millones al año', 'Más de $250 millones al año', 'No aplica (gobierno u organización civil)', 'Prefiero no decirlo']
ANTIGUEDAD = ['Menos de 1 año', '1 a 3 años', '3 a 10 años', 'Más de 10 años']
SECTORES = ['Agroindustria', 'Automotriz y manufactura', 'Banca, finanzas y seguros', 'Comercio y retail', 'Construcción e inmobiliario', 'Educación', 'Energía', 'Gobierno y sector público',
            'Industria alimentaria', 'Logística y transporte', 'Medios y entretenimiento', 'Organizaciones civiles', 'Política', 'Salud', 'Servicios profesionales', 'Tecnología', 'Turismo y hospitalidad', 'Otro']
AREAS = [('Estrategia y Dirección', 'estrategia', 'Rumbo, prioridades, transformación, gobernanza'), ('Liderazgo y Talento', 'liderazgo', 'Coaching, equipos directivos, programas'),
         ('Comunicación e Influencia', 'influencia', 'Narrativa, redes, campañas, PR, crisis'), ('Aún no lo sé', 'nose', 'Quiero que me orienten')]
MOMENTOS = [('Una decisión que no admite segundo intento', 'A'), ('Un cambio que no está aterrizando', 'B'), ('Influir en un ecosistema', 'C'), ('Otro', '')]
URGENCIAS = ['Es urgente: esta semana', 'En las próximas semanas', 'En 1 a 3 meses', 'Estoy explorando opciones']
DECISORES = ['Yo tomo la decisión', 'La tomo con socios o consejo', 'Recomiendo a quien decide']
PRESUPUESTOS = ['Menos de $15,000 al mes', '$15,000 a $40,000 al mes', '$40,000 a $100,000 al mes', 'Más de $100,000 al mes', 'Proyecto con presupuesto cerrado', 'Aún no lo tengo definido']
MODALIDADES = ['Videollamada', 'Presencial en CDMX', 'Presencial en Monterrey', 'Presencial en Guadalajara', 'Presencial en Querétaro', 'Presencial en Celaya']
HORARIOS = ['Mañana (9 a 13 h)', 'Tarde (13 a 18 h)', 'Me adapto']
ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
           'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
           'Yucatán', 'Zacatecas', 'Fuera de México']
COMO = ['Recomendación de alguien', 'LinkedIn', 'Instagram', 'Google', 'Revista Sparks', 'Evento o conferencia', 'Ya fui cliente', 'Otro']

def campo(nombre, etiqueta, tipo='text', req=False, ancho=False, auto='', ayuda='', extra=''):
    i = f'f-{nombre}'
    clase = 'campo' + (' req' if req else '') + (' ancho' if ancho else '')
    a = f' autocomplete="{auto}"' if auto else ''
    r = ' required' if req else ''
    ay = f'<span class="ayuda">{ayuda}</span>' if ayuda else ''
    if tipo == 'textarea':
        ctl = f'<textarea id="{i}" name="{nombre}" placeholder=" "{r}{extra}></textarea>'
    else:
        ctl = f'<input id="{i}" name="{nombre}" type="{tipo}" placeholder=" "{a}{r}{extra}>'
    return f'<div class="{clase}">{ctl}<label for="{i}">{etiqueta}</label>{ay}</div>'

def selecto(nombre, etiqueta, opciones, req=False, ancho=False):
    i = f'f-{nombre}'
    ops = ''.join(f'<option>{e(o)}</option>' for o in opciones)
    return f'<div class="campo{" req" if req else ""}{" ancho" if ancho else ""}"><select id="{i}" name="{nombre}"{" required" if req else ""}><option value="" disabled selected hidden></option>{ops}</select><label for="{i}">{etiqueta}</label></div>'

def chips(nombre, opciones, multiple=False, clase='chips'):
    t = 'checkbox' if multiple else 'radio'
    return f'<div class="{clase}" role="group">' + ''.join(f'<label class="chip"><input type="{t}" name="{nombre}" value="{e(o)}"><span>{e(o)}</span></label>' for o in opciones) + '</div>'

def pregunta(titulo, ayuda='', req=True):
    return f'<p class="preg{" req" if req else ""}">{titulo}{f"<small>{ayuda}</small>" if ayuda else ""}</p>'

CSS = '''<style>
.agenda { --tinta: var(--fg); --tinta-2: var(--fg-2); --tinta-3: var(--fg-3); --hueso: var(--bg); --hueso-2: var(--bg-2); --hueso-3: var(--bg-3); --oro-osc: #8a6a2c;
  --linea-c: var(--line); --linea-c2: var(--line-2); --blanco: var(--claro); --gris: var(--claro-2); --linea-o2: rgba(255,255,255,.14); }
.campo { position: relative; display: block; }
.campo input, .campo select, .campo textarea { width: 100%; font: inherit; font-size: 16px; color: var(--fg); background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 24px 16px 9px; min-height: 58px; transition: border-color .2s, box-shadow .2s; -webkit-appearance: none; appearance: none; }
.campo select { padding-right: 40px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23141114' stroke-width='1.6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; }
.campo textarea { min-height: 140px; resize: vertical; line-height: 1.5; padding-top: 28px; }
.campo label { position: absolute; left: 17px; top: 18px; font-size: 16px; color: var(--fg-3); pointer-events: none; transition: all .18s var(--ease); }
.campo input:focus, .campo select:focus, .campo textarea:focus { outline: none; border-color: var(--fg); box-shadow: 0 0 0 4px rgba(107, 42, 133, .12); }
.campo input:focus + label, .campo input:not(:placeholder-shown) + label, .campo textarea:focus + label, .campo textarea:not(:placeholder-shown) + label, .campo select:focus + label, .campo select.lleno + label { top: 8px; font-size: 11.5px; font-weight: 650; color: var(--fg-2); }
.campo.req label::after { content: " *"; color: var(--morado); }
.campo.error input, .campo.error select, .campo.error textarea { border-color: #C4412F; }
.campo .ayuda { display: block; font-size: 12.5px; color: var(--fg-3); margin-top: 7px; }
.campos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.campos .ancho { grid-column: 1 / -1; }
@media (max-width: 620px) { .campos { grid-template-columns: 1fr; } }
.casilla { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--fg-2); cursor: pointer; }
.casilla input { width: 20px; height: 20px; margin: 1px 0 0; accent-color: var(--fg); flex: none; }
.casilla a { color: var(--fg); font-weight: 650; }
.trampa { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.ag-lado .art { position: absolute; right: -42%; top: -14%; height: 52%; aspect-ratio: 940 / 909; z-index: -1; opacity: .3; }
.ag-lado .glow { position: absolute; left: -30%; right: -30%; bottom: -30%; height: 70%; background: radial-gradient(50% 50% at 50% 50%, rgba(214,179,106,.18), transparent 70%); z-index: -1; }
.ag-lado { background: var(--noche); color: var(--claro); }
.ag-lado .h1 em, .ag-lado .h1 .metal { background: var(--metal-osc); -webkit-background-clip: text; background-clip: text; color: transparent; }
.agenda { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); min-height: 100svh; }
.ag-lado { position: relative; isolation: isolate; padding: 130px clamp(24px, 4vw, 64px) 56px; display: flex; flex-direction: column; overflow: hidden; }
.ag-lado .foto { position: absolute; inset: 0; z-index: -2; }

.ag-pega { position: sticky; top: 130px; }
.ag-lado .h1 { font-size: clamp(38px, 3.8vw, 58px); margin: 20px 0 18px; }
.ag-lado .lead { font-size: 18px; color: rgba(247,245,240,.8); }
.ag-incluye { margin-top: 36px; display: grid; gap: 14px; }
.ag-incluye li { display: grid; grid-template-columns: 34px 1fr; gap: 14px; align-items: start; font-size: 15.5px; color: rgba(247,245,240,.85); }
.ag-incluye svg { width: 34px; height: 34px; padding: 8px; border-radius: 11px; background: rgba(255,255,255,.08); color: var(--oro-claro); }
.ag-incluye b { color: var(--blanco); display: block; font-weight: 600; }
.ag-nota { margin-top: 36px; padding: 18px 20px; border: 1px solid var(--linea-o2); border-radius: 14px; font-size: 14px; color: var(--gris); background: rgba(10,10,11,.35); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.ag-form { background: var(--hueso); color: var(--tinta); padding: 120px clamp(20px, 5vw, 80px) 72px; }
.ag-caja { max-width: 760px; margin: 0 auto; }
.pasos-ag { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-bottom: 14px; }
.pasos-ag button { background: none; border: 0; padding: 0; text-align: left; cursor: default; font-size: 12.5px; font-weight: 650; color: var(--tinta-3); }
.pasos-ag button::before { content: ""; display: block; height: 3px; border-radius: 3px; background: var(--hueso-3); margin-bottom: 10px; transition: background .4s var(--ease); }
.pasos-ag button.hecho, .pasos-ag button.activo { color: var(--tinta); }
.pasos-ag button.hecho { cursor: pointer; }
.pasos-ag button.hecho::before { background: var(--tinta); }
.pasos-ag button.activo::before { background: var(--oro); }
.estado-ag { display: flex; justify-content: space-between; font-size: 13px; color: var(--tinta-3); margin-bottom: 34px; min-height: 20px; }
.guardado { opacity: 0; transition: opacity .3s; }
.guardado.si { opacity: 1; }
.retomar { display: none; gap: 14px; align-items: center; flex-wrap: wrap; padding: 16px 18px; border-radius: 14px; background: #fff; border: 1px solid var(--linea-c2); margin-bottom: 26px; font-size: 14.5px; }
.retomar.si { display: flex; }
.retomar b { display: block; }
.ag-form .btn.linea { color: var(--tinta); border-color: var(--linea-c2); }
.ag-form .btn.linea:hover { border-color: var(--tinta); background: rgba(0,0,0,.04); }
.retomar .btn { min-height: 40px; padding: 0 16px; font-size: 14px; }
.retomar div { flex: 1; min-width: 180px; }
.paso-ag { display: none; }
.paso-ag.activo { display: block; }
@media (prefers-reduced-motion: no-preference) { .paso-ag.activo { animation: entra .45s var(--ease); } }
@keyframes entra { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.paso-ag h2 { font-weight: 750; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.04; letter-spacing: -.04em; }
.paso-ag h2 em, .exito h2 em { font-style: normal; background: var(--metal); -webkit-background-clip: text; background-clip: text; color: transparent; }
.paso-ag > p { color: var(--tinta-2); margin: 12px 0 30px; font-size: 16.5px; }
.preg { font-weight: 600; font-size: 16px; margin: 28px 0 12px; }
.preg.req::after { content: " *"; color: var(--oro-osc); }
.preg small { display: block; font-weight: 400; font-size: 13.5px; color: var(--tinta-3); margin-top: 3px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { position: relative; cursor: pointer; }
.chip input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.chip span { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--linea-c2); background: #fff; font-size: 14.5px; font-weight: 500; transition: all .2s var(--ease); }
.chip:hover span { border-color: var(--tinta); }
.chip input:checked + span { background: var(--tinta); border-color: var(--tinta); color: var(--hueso); }
.chip input:focus-visible + span { outline: 2px solid var(--oro); outline-offset: 2px; }
.tarjetas-op { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.op { position: relative; cursor: pointer; }
.op input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.op > span { display: block; height: 100%; padding: 18px 18px 18px 50px; border-radius: 16px; border: 1px solid var(--linea-c); background: #fff; transition: all .2s var(--ease); position: relative; }
.op > span::before { content: ""; position: absolute; left: 18px; top: 20px; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--tinta-3); transition: all .2s; }
.op.multi > span::before { border-radius: 5px; }
.op b { display: block; font-size: 15.5px; font-weight: 600; }
.op small { display: block; font-size: 13.5px; color: var(--tinta-3); margin-top: 3px; line-height: 1.4; }
.op:hover > span { border-color: var(--tinta); }
.op input:checked + span { border-color: var(--tinta); box-shadow: inset 0 0 0 1px var(--tinta); background: #FFFDF8; }
.op input:checked + span::before { background: var(--tinta); border-color: var(--tinta); box-shadow: inset 0 0 0 4px #fff; }
.op.multi input:checked + span::before { box-shadow: none; background: var(--tinta) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M5 12.5 10 17 19 7'/%3E%3C/svg%3E") center / 12px no-repeat; }
.op input:focus-visible + span { outline: 2px solid var(--oro); outline-offset: 2px; }
@media (max-width: 620px) { .tarjetas-op { grid-template-columns: 1fr; } }
.contador { font-size: 12.5px; color: var(--tinta-3); text-align: right; margin-top: 6px; }
.contador.ok { color: #3E7B3A; }
.revision { background: #fff; border: 1px solid var(--linea-c2); border-radius: 16px; padding: 6px 22px; margin-bottom: 22px; }
.revision h3 { font-size: 13px; font-weight: 650; color: var(--tinta-3); margin: 18px 0 4px; display: flex; justify-content: space-between; }
.revision h3 button { background: none; border: 0; font: inherit; color: var(--oro-osc); cursor: pointer; letter-spacing: .06em; }
.revision dl > div { display: grid; grid-template-columns: 180px 1fr; gap: 14px; padding: 9px 0; border-bottom: 1px solid var(--linea-c); font-size: 14.5px; }
.revision dl > div:last-child { border-bottom: 0; }
.revision dt { color: var(--tinta-3); }
.revision dd { font-weight: 500; white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 560px) { .revision dl > div { grid-template-columns: 1fr; gap: 2px; } }
.nav-ag { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--linea-c2); }
.nav-ag .atras { background: none; border: 0; font-weight: 600; font-size: 15px; cursor: pointer; padding: 12px 4px; color: var(--tinta-2); }
.nav-ag .atras:hover { color: var(--tinta); }
.nav-ag .atras.oculto { visibility: hidden; }
.aviso-err { display: none; margin-top: 18px; padding: 14px 16px; border-radius: 12px; background: #F8E3DE; color: #8A2E1F; font-size: 14.5px; }
.aviso-err.si { display: block; }
.exito { display: none; text-align: left; }
.exito.si { display: block; }
.exito .sello { width: 64px; height: 64px; border-radius: 50%; background: var(--tinta); color: var(--oro-claro); display: grid; place-items: center; margin-bottom: 28px; }
.exito .sello svg { width: 30px; height: 30px; }
.exito h2 { font-weight: 750; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.02; letter-spacing: -.045em; }

.folio { display: inline-flex; gap: 12px; align-items: center; margin: 26px 0 8px; padding: 14px 20px; border-radius: 12px; border: 1px dashed var(--oro-osc); font-size: 15px; font-weight: 650; letter-spacing: .04em; background: #fff; font-variant-numeric: tabular-nums; }
.linea-t { margin-top: 34px; display: grid; gap: 0; border-left: 1px solid var(--linea-c2); padding-left: 0; }
.linea-t li { position: relative; padding: 0 0 22px 28px; }
.linea-t li::before { content: ""; position: absolute; left: -6px; top: 6px; width: 11px; height: 11px; border-radius: 50%; background: var(--hueso-3); border: 2px solid var(--hueso); }
.linea-t li.ya::before { background: var(--tinta); }
.linea-t b { display: block; font-size: 16px; }
.linea-t span { font-size: 14.5px; color: var(--tinta-2); }
@media (max-width: 960px) {
  .ag-lado .art { display: none; }
  .agenda { grid-template-columns: 1fr; }
  .ag-lado { padding: 120px var(--x) 48px; min-height: 0; }
  .ag-pega { position: static; }
  .ag-incluye { grid-template-columns: 1fr 1fr; }
  .ag-nota { display: none; }
  .ag-form { padding: 56px var(--x) 64px; }
}
@media (max-width: 560px) { .ag-incluye { grid-template-columns: 1fr; } .pasos-ag button { font-size: 0; } .pasos-ag button::before { margin-bottom: 0; } }
</style>
'''

JS = r'''<script>
(function () {
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8787' : 'https://os.vorka.mx';
  var CLAVE = 'vorka_agenda_v1', TOTAL = 5;
  var f = document.getElementById('ag'), pasos = f.querySelectorAll('.paso-ag'), marcas = document.querySelectorAll('.pasos-ag button');
  var atras = document.getElementById('atras'), sig = document.getElementById('sig'), enviar = document.getElementById('enviar');
  var err = document.getElementById('err'), guard = document.getElementById('guardado'), num = document.getElementById('num-paso');
  var actual = 1;

  function datos() {
    var d = {};
    new FormData(f).forEach(function (v, k) { if (k === 'areas') (d.areas = d.areas || []).push(v); else d[k] = typeof v === 'string' ? v.trim() : v; });
    d.areas = d.areas || [];
    return d;
  }
  function mostrar(n, sinScroll) {
    actual = Math.max(1, Math.min(TOTAL, n));
    pasos.forEach(function (p) { p.classList.toggle('activo', +p.dataset.paso === actual); });
    marcas.forEach(function (b, i) { b.classList.toggle('activo', i + 1 === actual); b.classList.toggle('hecho', i + 1 < actual); b.setAttribute('aria-current', i + 1 === actual ? 'step' : 'false'); });
    num.textContent = 'Paso ' + actual + ' de ' + TOTAL;
    atras.classList.toggle('oculto', actual === 1);
    sig.hidden = actual === TOTAL; enviar.hidden = actual !== TOTAL;
    if (actual === TOTAL) revisar();
    err.classList.remove('si');
    if (!sinScroll) { document.querySelector('.ag-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); guardar(); }
  }
  function falla(msg, el) {
    err.textContent = msg; err.classList.add('si');
    if (el) { var c = el.closest('.campo'); if (c) c.classList.add('error'); el.focus({ preventScroll: true }); (c || el).scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return false;
  }
  function valida(n) {
    var d = datos(), q = function (s) { return f.querySelector('[name="' + s + '"]'); };
    f.querySelectorAll('.campo.error').forEach(function (c) { c.classList.remove('error'); });
    if (n === 1) {
      if (d.nombre.length < 3) return falla('Escribe tu nombre completo.', q('nombre'));
      if (!d.cargo) return falla('Cuéntanos tu cargo o rol.', q('cargo'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) return falla('Revisa tu correo: ahí te confirmamos.', q('correo'));
      if (d.whatsapp.replace(/\D/g, '').length < 10) return falla('Escribe tu WhatsApp a 10 dígitos.', q('whatsapp'));
      if (!d.estado) return falla('Elige tu estado.', q('estado'));
    }
    if (n === 2) {
      if (d.organizacion.length < 2) return falla('Escribe el nombre de tu organización, empresa o proyecto.', q('organizacion'));
      if (!d.tipo_org) return falla('Elige qué tipo de organización es.');
      if (!d.tamano) return falla('Elige el tamaño de tu equipo.');
    }
    if (n === 3) {
      if (!d.areas.length) return falla('Elige al menos un área en la que te podemos ayudar.');
      if ((d.reto || '').length < 40) return falla('Cuéntanos tu reto con un poco más de detalle (mínimo 40 caracteres).', q('reto'));
    }
    if (n === 4) {
      if (!d.urgencia) return falla('Cuéntanos qué tan pronto necesitas avanzar.');
      if (!d.decisor) return falla('Cuéntanos quién toma la decisión.');
      if (!d.presupuesto) return falla('Elige un rango de inversión. Nos ayuda a proponerte algo realista.');
    }
    return true;
  }
  sig.addEventListener('click', function () { if (valida(actual)) mostrar(actual + 1); });
  atras.addEventListener('click', function () { mostrar(actual - 1); });
  marcas.forEach(function (b, i) { b.addEventListener('click', function () { if (i + 1 < actual) mostrar(i + 1); }); });
  f.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && actual < TOTAL) { e.preventDefault(); sig.click(); } });

  // Contador del reto
  var reto = f.querySelector('[name=reto]'), cont = document.getElementById('cont-reto');
  function contar() { var n = reto.value.trim().length; cont.textContent = n < 40 ? 'Faltan ' + (40 - n) + ' caracteres' : n < 220 ? n + ' caracteres · entre más contexto, mejor llegamos preparados' : n + ' caracteres · ¡excelente!'; cont.classList.toggle('ok', n >= 40); }
  reto.addEventListener('input', contar);

  // Guardado automático en este navegador
  var t;
  var enviado = false;
  function guardar() { if (enviado) return; try { var d = datos(); d._paso = actual; d._t = Date.now(); localStorage.setItem(CLAVE, JSON.stringify(d)); guard.classList.add('si'); clearTimeout(guard._t); guard._t = setTimeout(function () { guard.classList.remove('si'); }, 1400); } catch (e) {} }
  f.addEventListener('input', function () { clearTimeout(t); t = setTimeout(guardar, 400); });
  f.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') e.target.classList.toggle('lleno', !!e.target.value); clearTimeout(t); t = setTimeout(guardar, 200); });
  function aplicar(d) {
    Object.keys(d).forEach(function (k) {
      if (k.charAt(0) === '_') return;
      var v = d[k];
      f.querySelectorAll('[name="' + k + '"]').forEach(function (el) {
        if (el.type === 'radio' || el.type === 'checkbox') el.checked = Array.isArray(v) ? v.indexOf(el.value) >= 0 : el.value === v;
        else { el.value = v; if (el.tagName === 'SELECT') el.classList.toggle('lleno', !!v); }
      });
    });
    contar();
  }
  var previo = null; try { previo = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
  if (previo && previo.nombre) {
    var r = document.getElementById('retomar'), min = Math.round((Date.now() - (previo._t || 0)) / 60000);
    document.getElementById('retomar-t').textContent = min < 1 ? 'Guardada hace un momento' : min < 60 ? 'Guardada hace ' + min + ' min' : min < 1440 ? 'Guardada hace ' + Math.round(min / 60) + ' h' : 'Guardada hace ' + Math.round(min / 1440) + ' días';
    r.classList.add('si');
    document.getElementById('retomar-si').onclick = function () { aplicar(previo); r.classList.remove('si'); mostrar(previo._paso || 1); };
    document.getElementById('retomar-no').onclick = function () { try { localStorage.removeItem(CLAVE); } catch (e) {} r.classList.remove('si'); };
  }

  // Lo que venga en la liga (?area=estrategia&momento=A)
  var qs = new URLSearchParams(location.search), MAPA = { estrategia: 'Estrategia y Dirección', liderazgo: 'Liderazgo y Talento', influencia: 'Comunicación e Influencia' };
  var MOM = { A: 'Una decisión que no admite segundo intento', B: 'Un cambio que no está aterrizando', C: 'Influir en un ecosistema' };
  if (MAPA[qs.get('area')]) { var a = f.querySelector('[name=areas][value="' + MAPA[qs.get('area')] + '"]'); if (a) a.checked = true; }
  if (MOM[qs.get('momento')]) { var m = f.querySelector('[name=momento][value="' + MOM[qs.get('momento')] + '"]'); if (m) m.checked = true; }
  var origen = qs.get('area') || (qs.get('momento') ? 'momento ' + qs.get('momento') : (document.referrer.indexOf(location.host) > -1 ? new URL(document.referrer).pathname : 'directo'));

  // Revisión
  var ETQ = [['Tú', 1, [['nombre', 'Nombre'], ['cargo', 'Cargo'], ['correo', 'Correo'], ['whatsapp', 'WhatsApp'], ['linkedin', 'LinkedIn'], ['ciudad', 'Ciudad'], ['estado', 'Estado']]],
    ['Organización', 2, [['organizacion', 'Organización'], ['tipo_org', 'Tipo'], ['sector', 'Sector'], ['tamano', 'Tamaño'], ['facturacion', 'Facturación'], ['antiguedad', 'Antigüedad'], ['sitio', 'Sitio o redes']]],
    ['Tu reto', 3, [['areas', 'Áreas'], ['momento', 'Momento'], ['reto', 'Qué necesitas resolver'], ['intentado', 'Qué has intentado']]],
    ['Decisión y agenda', 4, [['urgencia', 'Urgencia'], ['decisor', 'Decisión'], ['presupuesto', 'Inversión'], ['modalidad', 'Modalidad'], ['horario', 'Horario'], ['como_supo', 'Cómo nos conociste']]]];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function revisar() {
    var d = datos();
    document.getElementById('revision').innerHTML = ETQ.map(function (g) {
      var filas = g[2].map(function (x) { var v = Array.isArray(d[x[0]]) ? d[x[0]].join(', ') : d[x[0]]; return v ? '<div><dt>' + x[1] + '</dt><dd>' + esc(v) + '</dd></div>' : ''; }).join('');
      return '<h3>' + g[0] + '<button type="button" data-ir="' + g[1] + '">Editar</button></h3><dl>' + filas + '</dl>';
    }).join('');
    document.querySelectorAll('[data-ir]').forEach(function (b) { b.onclick = function () { mostrar(+b.dataset.ir); }; });
  }

  // Envío a os.vorka.mx
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (actual !== TOTAL) return;
    var d = datos();
    if (!f.querySelector('[name=acepta]').checked) return falla('Necesitamos que aceptes el aviso de privacidad.');
    d.acepta = true; d.origen = origen;
    enviar.disabled = true; enviar.firstChild.textContent = 'Enviando… ';
    fetch(API + '/api/publico/vorka/diagnostico', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'No se pudo enviar.'); return j; }); })
      .then(function (j) {
        enviado = true; clearTimeout(t);
        try { localStorage.removeItem(CLAVE); } catch (e) {}
        document.getElementById('folio').textContent = j.folio;
        document.getElementById('exito-correo').textContent = d.correo;
        document.getElementById('exito-nombre').textContent = d.nombre.split(/\s+/)[0];
        f.hidden = true; document.querySelector('.cabeza-ag').hidden = true;
        document.getElementById('exito').classList.add('si');
        document.querySelector('.ag-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function (x) { falla(x.message === 'Failed to fetch' ? 'No pudimos conectar. Revisa tu internet e intenta de nuevo.' : x.message); enviar.disabled = false; enviar.firstChild.textContent = 'Enviar solicitud '; });
  });

  contar(); mostrar(1, true);
})();
</script>
'''

def pagina_agenda():
    tipos = ''.join(f'<label class="op"><input type="radio" name="tipo_org" value="{e(t)}"><span><b>{e(t)}</b><small>{e(d)}</small></span></label>' for t, d in TIPOS)
    areas = ''.join(f'<label class="op multi"><input type="checkbox" name="areas" value="{e(t)}"><span><b>{e(t)}</b><small>{e(d)}</small></span></label>' for t, _, d in AREAS)
    momentos = ''.join(f'<label class="op"><input type="radio" name="momento" value="{e(t)}"><span><b>{e(t)}</b></span></label>' for t, _ in MOMENTOS)
    inc = [('Una lectura honesta', 'Qué vemos en tu caso, aunque no sea lo que esperabas oír.'), ('Prioridades claras', 'Por dónde empezar y qué dejar para después.'),
           ('Cómo lo haríamos', 'Si podemos ayudarte, el enfoque, el equipo y los tiempos.'), ('Sin costo ni compromiso', '20 minutos, por videollamada o en persona.')]
    inc_html = ''.join(f'<li>{ICONOS["check"]}<span><b>{t}</b>{d}</span></li>' for t, d in inc)
    pasos_n = ['Tú', 'Organización', 'Tu reto', 'Decisión', 'Revisar']
    marcas = ''.join(f'<button type="button" aria-label="Paso {i + 1}: {t}">{t}</button>' for i, t in enumerate(pasos_n))
    cuerpo = f'''{nav()}
<main id="contenido" class="agenda">
  <aside class="ag-lado">
    {v_metal('art', 'ga')}<div class="glow"></div><div class="grano"></div>
    <div class="ag-pega">
      <span class="etiqueta">Diagnóstico sin costo</span>
      <h1 class="h1">Cuéntanos tu momento. <span class="metal">Te devolvemos un plan.</span></h1>
      <p class="lead">Una sesión de 20 minutos con nuestro equipo para entender tu reto y decirte, con claridad, cómo lo resolveríamos.</p>
      <ul class="ag-incluye">{inc_html}</ul>
      <p class="ag-nota">Damos un número limitado de diagnósticos al mes. Con estas preguntas llegamos preparados a tu sesión; si no somos el equipo correcto para tu caso, te lo decimos con la misma claridad. Te respondemos en máximo 2 días hábiles.</p>
    </div>
  </aside>
  <section class="ag-form" aria-label="Solicitud de diagnóstico">
    <div class="ag-caja">
      <div class="cabeza-ag">
        <div class="pasos-ag">{marcas}</div>
        <div class="estado-ag"><span id="num-paso">Paso 1 de 5</span><span class="guardado" id="guardado">✓ Progreso guardado</span></div>
        <div class="retomar" id="retomar"><div><b>Tienes una solicitud a medias</b><span id="retomar-t"></span></div><button class="btn tinta" type="button" id="retomar-si">Continuar</button><button class="btn blanco" type="button" id="retomar-no">Empezar de nuevo</button></div>
      </div>
      <form id="ag" novalidate>
        <div class="trampa" aria-hidden="true"><label>No llenar <input name="empresa_web" tabindex="-1" autocomplete="off"></label></div>

        <div class="paso-ag" data-paso="1">
          <h2>Primero, <em>tú.</em></h2>
          <p>Con quién vamos a platicar y cómo te contactamos.</p>
          <div class="campos">
            {campo('nombre', 'Nombre completo', req=True, auto='name')}
            {campo('cargo', 'Cargo o rol', req=True, auto='organization-title', ayuda='Ej. Director general, socia fundadora, secretario.')}
            {campo('correo', 'Correo', 'email', req=True, auto='email')}
            {campo('whatsapp', 'WhatsApp', 'tel', req=True, auto='tel', extra=' inputmode="tel"')}
            {campo('linkedin', 'LinkedIn (opcional)', 'url', ancho=True, ayuda='Nos ayuda a conocerte antes de la sesión.')}
            {selecto('estado', 'Estado', ESTADOS, req=True)}
            {campo('ciudad', 'Ciudad o municipio', auto='address-level2')}
          </div>
        </div>

        <div class="paso-ag" data-paso="2">
          <h2>Tu <em>organización.</em></h2>
          <p>Empresa, institución, proyecto o marca: lo que quieres llevar al siguiente nivel.</p>
          <div class="campos">
            {campo('organizacion', 'Nombre de la organización', req=True, ancho=True, auto='organization')}
          </div>
          {pregunta('¿Qué tipo de organización es?')}
          <div class="tarjetas-op">{tipos}</div>
          {pregunta('¿Cuántas personas trabajan ahí?')}
          {chips('tamano', TAMANOS)}
          <div class="campos" style="margin-top:28px">
            {selecto('sector', 'Sector', SECTORES)}
            {selecto('antiguedad', 'Antigüedad', ANTIGUEDAD)}
            {selecto('facturacion', 'Facturación anual aproximada', FACTURACION, ancho=True)}
            {campo('sitio', 'Sitio web o redes (opcional)', ancho=True, ayuda='vorka.mx, @tuempresa, etc.')}
          </div>
        </div>

        <div class="paso-ag" data-paso="3">
          <h2>Tu <em>reto.</em></h2>
          <p>Mientras más claro, mejor llegamos preparados. Nadie fuera de nuestro equipo verá esto.</p>
          {pregunta('¿En qué te podemos ayudar?', 'Elige una o varias.')}
          <div class="tarjetas-op">{areas}</div>
          {pregunta('¿Cuál se parece más a tu momento?', '', req=False)}
          <div class="tarjetas-op">{momentos}</div>
          <div class="campos" style="margin-top:28px">
            <div class="ancho">{campo('reto', '¿Qué necesitas resolver?', 'textarea', req=True, extra=' maxlength="4000"')}<div class="contador" id="cont-reto"></div></div>
            {campo('intentado', '¿Qué has intentado hasta ahora? (opcional)', 'textarea', ancho=True, extra=' maxlength="2000" style="min-height:100px"')}
          </div>
        </div>

        <div class="paso-ag" data-paso="4">
          <h2>Decisión y <em>agenda.</em></h2>
          <p>Para proponerte algo realista desde la primera conversación.</p>
          {pregunta('¿Qué tan pronto necesitas avanzar?')}
          {chips('urgencia', URGENCIAS)}
          {pregunta('¿Quién toma la decisión de contratar?')}
          {chips('decisor', DECISORES)}
          {pregunta('¿Qué inversión tienes contemplada?', 'Un rango aproximado. No es un compromiso; nos ayuda a proponerte algo a tu medida.')}
          {chips('presupuesto', PRESUPUESTOS)}
          {pregunta('¿Cómo prefieres la sesión?', '', req=False)}
          {chips('modalidad', MODALIDADES)}
          {pregunta('¿En qué horario?', '', req=False)}
          {chips('horario', HORARIOS)}
          <div class="campos" style="margin-top:28px">{selecto('como_supo', '¿Cómo nos conociste?', COMO, ancho=True)}</div>
        </div>

        <div class="paso-ag" data-paso="5">
          <h2>Revisa y <em>envía.</em></h2>
          <p>Confirma que todo esté bien. Puedes editar cualquier sección.</p>
          <div class="revision" id="revision"></div>
          <label class="casilla"><input type="checkbox" name="acepta" value="1"> <span>Acepto el <a href="/privacidad/" target="_blank" rel="noopener">aviso de privacidad</a> y que Vorka México me contacte sobre esta solicitud.</span></label>
        </div>

        <div class="aviso-err" id="err" role="alert"></div>
        <div class="nav-ag">
          <button type="button" class="atras" id="atras">← Anterior</button>
          <button type="button" class="btn tinta" id="sig">Continuar {FLECHA}</button>
          <button type="submit" class="btn tinta" id="enviar" hidden>Enviar solicitud {FLECHA}</button>
        </div>
      </form>

      <div class="exito" id="exito" role="status" aria-live="polite">
        <div class="sello">{ICONOS['check']}</div>
        <h2>Gracias, <span id="exito-nombre"></span>. <em>Ya estamos en ello.</em></h2>
        <div class="folio">Folio <b id="folio"></b></div>
        <p style="color:var(--tinta-2)">Te enviamos la confirmación a <b id="exito-correo"></b>. Guarda tu folio por si necesitas escribirnos.</p>
        <ol class="linea-t">
          <li class="ya"><b>Solicitud recibida</b><span>Tu información llegó directo a nuestro equipo.</span></li>
          <li><b>Revisión personal · máximo 2 días hábiles</b><span>Leemos tu caso con calma para ver cómo podemos aportarte.</span></li>
          <li><b>Diagnóstico de 20 minutos</b><span>Si encaja, te llega la invitación a tu calendario con fecha y enlace.</span></li>
          <li><b>Propuesta a la medida</b><span>Alcance, equipo, tiempos e inversión, en claro.</span></li>
        </ol>
        <div class="botones" style="margin-top:28px"><a class="btn tinta" href="/sparks/celaya/">Mientras tanto, lee Sparks {FLECHA}</a><a class="btn blanco" href="/">Volver al inicio</a></div>
      </div>
    </div>
  </section>
</main>
{pie('empresas')}{JS}'''
    return cabeza('Agenda tu diagnóstico · Vorka México', 'Solicita una sesión de diagnóstico de 20 minutos sin costo con Vorka México. Cuéntanos tu reto y te devolvemos una lectura honesta y un plan.', '/agenda/', og='cdmx-noche', extra=CSS) + cuerpo + '\n</body>\n</html>\n'
