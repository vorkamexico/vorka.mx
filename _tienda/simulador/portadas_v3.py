# Vorka México · portadas v3 de TODA la tienda: cada producto con su color, nombre grande, beneficio y tres datos
# legibles en la tarjeta del catálogo (~460 px de ancho). Simuladores: además su imagen para compartir y dos
# imágenes 16:10 para "Cómo funciona" (antes se recortaba la de compartir). Sin logos ni colores institucionales.
# Datos: solo los que ya dicen la descripción oficial de cada producto o su banco (si cambian, actualizar aquí).
# Uso: CHROMIUM=<ruta de Chrome> python3 _tienda/simulador/portadas_v3.py → assets/tienda/v3/*.webp (y *-og.jpg)
import os, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

AQUI = pathlib.Path(__file__).parent
exec((AQUI / 'portadas.py').read_text().split('def telefono')[0])   # CSS base, V (logo)
OUT = AQUI.parent.parent / 'assets' / 'tienda' / 'v3'
OUT.mkdir(parents=True, exist_ok=True)

EXTRA = """
.t3 h1{font-weight:850;letter-spacing:-.055em;line-height:.86}
.t3 .chip{display:inline-flex;align-items:center;gap:12px;padding:14px 26px;border-radius:999px;font-weight:750}
.t3 .chip i{width:12px;height:12px;border-radius:50%;display:inline-block}
.t3 .tag{display:inline-flex;align-items:center;padding:10px 22px;border-radius:999px;font-weight:700}
.t3 .glow{position:absolute;border-radius:50%;filter:blur(100px)}
.callout{position:absolute;background:#fff;color:#141114;border-radius:24px;padding:22px 26px;box-shadow:0 30px 60px -24px rgba(20,17,20,.35);font-size:30px;font-weight:750;letter-spacing:-.02em;line-height:1.2}
.callout small{display:block;font-size:20px;font-weight:600;color:#6D696E;margin-top:6px;letter-spacing:0}
.ui{font-family:inherit;color:#141114}
.ui .h{font-size:24px;font-weight:800;letter-spacing:-.03em}
.ui .s{font-size:15px;color:#6D696E}
.ui .card{background:#fff;border:1px solid #E7E5E7;border-radius:18px;padding:14px 16px;margin-top:12px}
.ui .btn{display:block;text-align:center;border-radius:14px;padding:13px;font-weight:750;font-size:16px;margin-top:12px}
.ui .fila{display:flex;justify-content:space-between;align-items:center;font-size:15px;padding:10px 0;border-bottom:1px solid #F0EEEC}
.hoja{position:absolute;width:520px;height:680px;background:#FBFAF8;border-radius:10px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6);padding:46px 44px;color:#141114}
.hoja .k{font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.hoja h4{font-size:44px;line-height:1.02;letter-spacing:-.04em;margin:14px 0 18px;font-weight:850}
.hoja .l{height:12px;border-radius:6px;background:#ECEAE6;margin:12px 0}
"""

# ---------- visuales por producto ----------
def tel(inner, x, y, escala=1.0, rot=0):
    return f'<div class="tel" style="left:{x}px;top:{y}px;transform:scale({escala}) rotate({rot}deg);transform-origin:top left"><div class="pant"><div class="isla"></div>{inner}</div></div>'

def sim_ui(s, reloj_grande=False):
    ops = ''.join(f'<div class="op{" x" if i == s["mal"] else ""}"><b>{"ABCD"[i]}</b>{o}</div>' for i, o in enumerate(s['ops']))
    ac = s['ui']
    reloj = f'<span class="reloj" style="{"font-size:22px;padding:8px 16px;background:" + ac + ";color:#fff" if reloj_grande else ""}">{s["reloj"]}</span>'
    return f"""<div class="barra"><span class="m">{V}Simulador <b>{s['nombre']}</b></span>{reloj}</div>
  <div class="cuerpo"><div class="prog"><i style="background:{ac}"></i></div>
    <div class="cab"><span>{s['seccion']} · <b>{s['n']}</b></span><span class="tema" style="color:{ac};background:{ac}1a">{s['tema']}</span></div>
    <div class="enun">{s['enun']}</div>{ops}
    <div class="pista"><strong>Todavía no. Pista del tutor</strong>{s['pista']}</div></div>"""

def sim_rep(s, x, y, w):
    titulo, filas, tipo = s['rep']; ac = s['ui']
    def barra(n, a, b):
        pct = (a - 200) / 6 if tipo == 'pts' else 100 * a / b
        return f'<div><div class="f"><span>{n}</span><span>{a if tipo == "pts" else f"{a}/{b}"}</span></div><div class="b"><i style="width:{pct:.0f}%;background:{ac}"></i><u style="left:70%"></u></div></div>'
    return f"""<div class="rep" style="left:{x}px;top:{y}px;width:{w}px"><div class="t">Medidor de preparación</div>
  <div class="e" style="color:{ac}">{titulo}</div><div class="barras">{''.join(barra(*f) for f in filas)}</div></div>"""

def ui_brindi():
    return """<div class="ui" style="padding:70px 26px 0;text-align:center;background:linear-gradient(#FFF8F1,#FBFAF8)">
  <div class="s" style="letter-spacing:.2em;text-transform:uppercase;font-size:12px">Nuestra boda</div>
  <div style="font-family:Georgia,serif;font-size:46px;line-height:1.05;margin:16px 0 6px;color:#5A1A2E">Valeria<br><span style="font-size:30px">&amp;</span><br>Andrés</div>
  <div class="s">Sábado 14 de marzo · 18:00 h</div>
  <div class="card" style="text-align:left"><b>¿Nos acompañas?</b><div class="s">Confirma antes del 1 de marzo</div>
    <span class="btn" style="background:#5A1A2E;color:#fff">Confirmar asistencia</span><span class="btn" style="background:#F4F2EF">No podré ir</span></div>
  <div class="card" style="display:flex;gap:14px;align-items:center;text-align:left"><svg width="70" height="70" viewBox="0 0 7 7"><path fill="#141114" d="M0 0h3v3H0zM4 0h3v3H4zM0 4h3v3H0zM4 4h1v1H4zM6 4h1v1H6zM5 5h1v1H5zM4 6h1v1H4zM6 6h1v1H6z"/><path fill="#fff" d="M1 1h1v1H1zM5 1h1v1H5zM1 5h1v1H1z"/></svg><div><b>Tu pase con QR</b><div class="s">Familia Pérez · 4 personas</div></div></div></div>"""

def ui_cupo():
    return """<div class="ui" style="padding:70px 26px 0">
  <div style="border-radius:20px;height:190px;background:linear-gradient(135deg,#2B0F5C,#7B2FF7);color:#fff;padding:20px;display:flex;flex-direction:column;justify-content:flex-end">
    <div style="font-size:13px;opacity:.75;letter-spacing:.12em;text-transform:uppercase">Sábado · 22:00 h</div><div style="font-size:30px;font-weight:850;letter-spacing:-.03em">Noche de Brujas</div></div>
  <div class="fila"><span>Cover</span><b>$150</b></div><div class="fila"><span>Registrados</span><b>184 / 300</b></div>
  <span class="btn" style="background:#141114;color:#fff">Registrarme</span>
  <div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><b>Check-in</b><div class="s">Escanea el QR en la entrada</div></div><span style="font-size:30px">✓</span></div></div>"""

def ui_vuelve():
    sellos = ''.join(f'<span style="width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:26px;{"background:#8E1B2E;color:#fff" if i < 7 else "border:2px dashed #D9C9CC;color:#D9C9CC"}">☕</span>' for i in range(10))
    return f"""<div class="ui" style="padding:70px 26px 0">
  <div style="border-radius:24px;background:#1F1418;color:#fff;padding:22px">
    <div style="display:flex;justify-content:space-between"><b style="font-size:20px">Café La Paloma</b><span style="font-size:14px;opacity:.7">Tarjeta de sellos</span></div>
    <div style="font-size:44px;font-weight:850;margin:14px 0 4px">7 de 10</div><div style="font-size:14px;opacity:.7">Te faltan 3 para tu bebida gratis</div></div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:20px;justify-items:center">{sellos}</div>
  <div class="card"><b>Apple Wallet · Google Wallet</b><div class="s">Tus clientes la guardan en su celular, sin descargar app.</div></div></div>"""

def ui_cuentas():
    filas = ''.join(f'<div class="fila"><span>Abono recibido<br><small class="s">{d}</small></span><b style="color:#0F7A5A">−${m}</b></div>' for d, m in [('15 oct', '1,500.00'), ('1 oct', '1,500.00'), ('15 sep', '1,500.00')])
    return f"""<div class="ui" style="padding:70px 26px 0">
  <div class="s">Préstamo a</div><div class="h">Carla Méndez</div>
  <div style="border-radius:20px;background:#0D3B45;color:#fff;padding:20px;margin-top:14px"><div style="font-size:14px;opacity:.75">Saldo al día de hoy</div>
    <div style="font-size:44px;font-weight:850;letter-spacing:-.03em">$20,685.27</div><div style="font-size:14px;opacity:.75">Interés 2% mensual · claro para los dos</div></div>
  {filas}<span class="btn" style="background:#F4F2EF">Estado de cuenta · PDF · Excel</span></div>"""

def ui_vende():
    return """<div class="ui" style="padding:70px 26px 0">
  <div class="s">Hoy</div><div class="h">Hola, Fernanda</div>
  <div class="card" style="background:#FDEAF4;border-color:#F6C7DF"><b>6 cosas por hacer hoy</b><div class="s">2 cobros · 3 entregas · 1 pedido</div></div>
  <div class="card"><b>Cobro pendiente: Adriana Cruz</b><div class="s">$450 de su pedido del 12 de octubre</div>
    <span class="btn" style="background:#25D366;color:#fff">Mandar WhatsApp</span></div>
  <div class="fila"><span>Ganancia real del mes</span><b>$7,023.63</b></div><div class="fila"><span>Pedidos activos</span><b>14</b></div></div>"""

def ui_agenda():
    horas = ''.join(f'<span style="border:1.5px solid {"#047857" if h == "10:30" else "#E7E5E7"};background:{"#047857" if h == "10:30" else "#fff"};color:{"#fff" if h == "10:30" else "#141114"};border-radius:12px;padding:11px 0;text-align:center;font-weight:750;font-size:17px">{h}</span>' for h in ['9:00', '9:30', '10:30', '11:00', '12:30', '16:00'])
    dias = ''.join(f'<span style="border-radius:14px;padding:8px 0;text-align:center;{"background:#047857;color:#fff" if d == "4" else "border:1.5px solid #E7E5E7"}"><small style="display:block;font-size:12px;opacity:.75">{n}</small><b style="font-size:20px">{d}</b></span>' for n, d in [('Lun', '3'), ('Mar', '4'), ('Mié', '5'), ('Jue', '6')])
    return f"""<div class="ui" style="padding:70px 26px 0">
  <div style="display:flex;gap:12px;align-items:center"><span style="width:44px;height:44px;border-radius:12px;background:#047857;color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px">A</span>
    <div><div class="h" style="font-size:20px">Nutrición Ana Ruiz</div><div class="s">Consulta de seguimiento · 30 min</div></div></div>
  <div style="margin-top:18px;font-weight:800;font-size:17px">¿Qué día y a qué hora?</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px">{dias}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">{horas}</div>
  <span class="btn" style="background:#047857;color:#fff">Agendar mi cita</span>
  <div class="card" style="background:#ECFDF5;border-color:#A7F3D0"><b>✓ Cita confirmada</b><div class="s">Martes 4 · 10:30 · te llega tu recordatorio</div></div></div>"""

# Ruta de Impacto: el mapa de la ruta como se ve en ruta.vorka.mx (racha, XP, el nivel y sus lecciones; la siguiente se abre al
# terminar la anterior). Morado y oro de la app; el texto es el del nivel 1 real.
def ui_ruta():
    def nodo(estado, titulo, dx):
        cara = {'hecho': 'background:#6B2A85;color:#fff;box-shadow:0 7px 0 #4A1C5C', 'ahora': 'background:#C8A45C;color:#141114;box-shadow:0 7px 0 #8E7136,0 0 0 12px rgba(200,164,92,.22)',
                'cerrado': 'background:#ECEAE6;color:#9A969B;box-shadow:0 7px 0 #D3D0CC'}[estado]
        ic = {'hecho': '✓', 'ahora': '★', 'cerrado': '🔒'}[estado]
        burbuja = '<div style="position:absolute;top:-46px;left:50%;transform:translateX(-50%);background:#141114;color:#fff;border-radius:10px;padding:6px 12px;font-size:15px;font-weight:750;white-space:nowrap">Empezar</div>' if estado == 'ahora' else ''
        return f'''<div style="position:relative;margin:{66 if estado == "ahora" else 18}px auto 0;width:220px;text-align:center;transform:translateX({dx}px)">{burbuja}
  <div style="width:82px;height:76px;margin:0 auto;border-radius:50%;display:grid;place-items:center;font-size:32px;font-weight:800;{cara}">{ic}</div>
  <div style="margin-top:12px;font-size:16px;font-weight:750;line-height:1.2;color:{"#141114" if estado != "cerrado" else "#6D696E"}">{titulo}</div></div>'''
    stat = lambda v, n, c: f'<div style="flex:1;border:1px solid #E7E5E7;border-radius:16px;padding:10px 12px;background:#fff"><b style="font-size:24px;color:{c}">{v}</b><div class="s" style="font-size:13px">{n}</div></div>'
    return f"""<div class="ui" style="padding:66px 22px 0">
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:21px;letter-spacing:-.03em">ruta de impacto</b>
    <span style="background:#F6EEDC;border-radius:999px;padding:5px 12px;font-weight:800;color:#8E5B0C">🔥 7</span></div>
  <div class="s" style="margin-top:4px">Proyecto: <b style="color:#141114">Canal limpio</b></div>
  <div style="display:flex;gap:8px;margin-top:14px">{stat('🔥 7', 'Racha', '#8E5B0C')}{stat('⚡ 120', 'XP', '#6B2A85')}{stat('10/10', 'Meta de hoy', '#141114')}</div>
  <div style="margin-top:16px;border-radius:20px;background:#141114;color:#fff;padding:16px 18px"><div style="color:#C8A45C;font-size:13px;font-weight:800;letter-spacing:.1em">NIVEL 1</div>
    <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">El problema</div><div style="font-size:14px;opacity:.75">Distinguir el problema de sus síntomas y probarlo con datos</div></div>
  {nodo('hecho', 'Problema, síntoma o solución disfrazada', -40)}{nodo('ahora', 'El árbol de problemas', 40)}{nodo('cerrado', '¿A quién le pasa?', -20)}</div>"""

def hojas(color, titulo, partes):
    a = f'<div class="hoja" style="left:930px;top:260px;transform:rotate(8deg);opacity:.9"><div class="k" style="color:{color}">Workbook</div><div class="l" style="width:80%"></div><div class="l"></div><div class="l" style="width:60%"></div></div>'
    b = f'<div class="hoja" style="left:880px;top:220px;transform:rotate(3deg)"><div class="k" style="color:{color}">Vorka México · Kit digital</div><h4>{titulo}</h4>' + ''.join(f'<div style="display:flex;gap:12px;align-items:center;font-size:20px;font-weight:650;margin:14px 0"><span style="width:30px;height:30px;border-radius:9px;background:{color};color:#fff;display:grid;place-items:center;font-size:16px">{i + 1}</span>{t}</div>' for i, t in enumerate(partes)) + '</div>'
    return a + b

# ---------- productos ----------
SIM_TIEMPOS = dict(seccion='', n='', tema='')
SIMS = {
  'paa': dict(nombre='PAA', ui='#1E5BB8', reloj='42:10', seccion='Redacción', n='5 de 25', tema='Conectores',
    enun='"El proyecto era costoso; ______, el comité lo aprobó por su alto impacto social."', ops=['por consiguiente', 'es decir', 'no obstante', 'además'], mal=1,
    pista='Si algo es costoso, lo esperable es que NO se apruebe. ¿Qué conector introduce un resultado contrario?',
    rep=('Casi listo · 610', [('Lectura', 640, 0), ('Redacción', 590, 0), ('Matemáticas', 560, 0), ('Inglés', 610, 0)], 'pts')),
  'unam': dict(nombre='UNAM', ui='#B07D00', reloj='1:58:20', seccion='Matemáticas', n='7 de 24', tema='Ecuaciones',
    enun='Si 3x − 7 = 11, ¿cuál es el valor de x?', ops=['4/3', '6', '18', '4'], mal=2,
    pista='Llegaste bien a 3x = 18, pero falta un paso: ¿qué haces con el 3 que multiplica a x?',
    rep=('Casi listo · 86/120', [('Español', 14, 18), ('Matemáticas', 17, 24), ('Biología', 10, 13), ('Química', 8, 13)], 'ac')),
  'ecoems': dict(nombre='ECOEMS', ui='#D9480F', reloj='2:41:05', seccion='Habilidad matemática', n='5 de 16', tema='Sucesiones',
    enun='¿Qué número sigue? 3, 7, 15, 31, …', ops=['47', '63', '62', '61'], mal=2,
    pista='Compara cada número con el doble del anterior: ¿qué le falta al doble para llegar al siguiente?',
    rep=('Casi listo · 92/128', [('Hab. verbal', 13, 16), ('Hab. matemática', 11, 16), ('Matemáticas', 8, 12), ('Biología', 10, 12)], 'ac')),
  'prepa-ug': dict(nombre='prepa UG', ui='#2B8A3E', reloj='3:12:40', seccion='Pensamiento matemático', n='9 de 40', tema='Sentido numérico',
    enun='Una mochila de $450 tiene 20 % de descuento. ¿Cuánto se paga?', ops=['$360', '$430', '$90'], mal=1,
    pista='El 20 % de 450 no son 20 pesos: ¿cuánto es la quinta parte de 450?',
    rep=('Casi listo · 112/160', [('Lectora', 23, 30), ('Redacción', 21, 30), ('Matemático', 27, 40), ('Científico', 22, 30)], 'ac')),
}
OSCURO = dict(texto='#fff', suave='rgba(255,255,255,.82)', chipf='rgba(255,255,255,.14)', tagf='rgba(0,0,0,.22)')
CLARO = dict(texto='#1A1405', suave='rgba(26,20,5,.78)', chipf='rgba(26,20,5,.10)', tagf='rgba(26,20,5,.12)')

P = {
  'simulador-paa': dict(**OSCURO, fondo='linear-gradient(140deg,#071A3D 0%,#0F3C86 55%,#1E5BB8 100%)', acento='#9CD3FF', pre='Simulador', nombre='PAA',
    tag='Prueba de Aptitud Académica', beneficio='Practica como el día del examen y sube tu puntaje.', datos=['642 reactivos', 'Tutor con pistas', 'Puntaje 200–800'], sim='paa'),
  'simulador-unam': dict(**CLARO, fondo='linear-gradient(140deg,#F6C318 0%,#F2B705 55%,#E8A100 100%)', acento='#1A1405', pre='Simulador', nombre='UNAM', px=240,
    tag='Examen de licenciatura · 4 áreas', beneficio='Practica con el peso de las materias de tu área.', datos=['476 reactivos', '4 áreas', '120 reactivos en 3 h'], sim='unam'),
  'simulador-ecoems': dict(**OSCURO, fondo='linear-gradient(140deg,#B53A07 0%,#E8590C 55%,#F7931E 100%)', acento='#FFE3A3', pre='Simulador', nombre='ECOEMS', px=176,
    tag='Para la prepa UNAM e IPN', beneficio='Prepárate desde la secundaria con un tutor que te guía.', datos=['320 reactivos', '10 materias', '128 reactivos en 3 h'], sim='ecoems'),
  # Verde hoja claro con texto oscuro: no repite los verdes profundos de Agenda ni del kit Idea en Orden
  'simulador-prepa-ug': dict(**CLARO, fondo='linear-gradient(140deg,#B6E86A 0%,#7ED957 55%,#4CB944 100%)', acento='#0F2E12', pre='Simulador', nombre='Prepa UG', px=200,
    tag='EXANI-I · Prepa de la UG', beneficio='Prepárate desde la secundaria con un tutor que te guía.', datos=['400 reactivos', '5 áreas', '160 reactivos en 4.5 h'], sim='prepa-ug'),
  'brindi': dict(**OSCURO, fondo='linear-gradient(140deg,#2A0A16 0%,#5A1A2E 55%,#8A2E4A 100%)', acento='#F3D9A4', pre='', nombre='Brindi',
    tag='Invitaciones digitales', beneficio='Tu invitación con confirmación y acceso con QR.', datos=['6 diseños premium', 'Confirmaciones al momento', 'Pase con QR'], ui=ui_brindi),
  'cupo': dict(**OSCURO, fondo='linear-gradient(140deg,#17062F 0%,#3A1C71 55%,#6D28D9 100%)', acento='#C8F560', pre='', nombre='Cupo',
    tag='Eventos con registro', beneficio='La página de tu evento, con registro, cover y check-in.', datos=['Gratis hasta 30 personas', 'Cover sin comisión', 'Check-in con QR'], ui=ui_cupo),
  'agenda': dict(**OSCURO, fondo='linear-gradient(140deg,#022C22 0%,#065F46 55%,#059669 100%)', acento='#B7F7D9', pre='', nombre='Agenda', px=218,
    tag='Citas en línea para tu negocio', beneficio='Tus clientes reservan solos, a cualquier hora.', datos=['Confirmación al instante', 'Recordatorios', 'Prueba 7 días gratis'], ui=ui_agenda),
  'vuelve': dict(**OSCURO, fondo='linear-gradient(140deg,#4A0D18 0%,#8E1B2E 55%,#C9364F 100%)', acento='#FFD6A0', pre='', nombre='Vuelve',
    tag='Lealtad para tu negocio', beneficio='Que tus clientes vuelvan solos, con sellos o puntos.', datos=['Sin descargar app', 'Avisos automáticos', 'Prueba 7 días gratis'], ui=ui_vuelve),
  'cuentas': dict(**OSCURO, fondo='linear-gradient(140deg,#06262D 0%,#0D4F5A 55%,#14808A 100%)', acento='#9FF0E1', pre='', nombre='Cuentas', px=200,
    tag='Tus préstamos personales', beneficio='Lo que prestas, claro y en orden.', datos=['Intereses claros', 'PDF y Excel', 'Prueba 7 días gratis'], ui=ui_cuentas),
  'vende': dict(**OSCURO, fondo='linear-gradient(140deg,#4D0836 0%,#9C1468 55%,#D63384 100%)', acento='#FFD1EC', pre='', nombre='Vende',
    tag='Venta por catálogo o encargo', beneficio='Clientas, pedidos y cobros en orden.', datos=['Ganancia real', 'WhatsApp listo', 'Gratis para empezar'], ui=ui_vende),
  # Índigo profundo con oro: no repite el azul de PAA ni los morados de Cupo y del kit Idea → Negocio. og=True: también su imagen para compartir
  'ruta-de-impacto': dict(**OSCURO, fondo='linear-gradient(140deg,#120E33 0%,#2A2479 55%,#4338CA 100%)', acento='#F5D08A', pre='Ruta de', nombre='Impacto', px=210,
    tag='Proyectos sociales · 15 a 29 años', beneficio='Tu proyecto social, de la idea a la comunidad.', datos=['6 niveles + final', 'Tutor con pistas', 'Pago único · 1 año'], ui=ui_ruta, og=True),
  'idea-en-orden': dict(**OSCURO, fondo='linear-gradient(140deg,#0B2A17 0%,#14532D 55%,#1F7A44 100%)', acento='#BEF264', pre='Kit', nombre='Idea en Orden',
    tag='Emprendimiento · Nivel 1', beneficio='Ordena tu idea y planea tus próximos 7 días.', datos=['Workbook PDF · 32 págs.', 'Word y Excel', '6 herramientas'],
    hojas=('#1F7A44', 'Idea en Orden', ['Tu idea en una frase', 'El problema y el cliente', 'Matriz de prioridades', 'Plan de 7 días'])),
  'idea-negocio': dict(**OSCURO, fondo='linear-gradient(140deg,#1E0B3D 0%,#3B1A78 55%,#5B2A9E 100%)', acento='#D8C4FF', pre='Kit', nombre='Idea → Negocio',
    tag='Emprendimiento · Nivel 2', beneficio='Valida tu idea con clientes reales y haz tus números.', datos=['Workbook PDF · 32 págs.', '2 Excel', 'Incluye Nivel 1'],
    hojas=('#5B2A9E', 'Idea → Negocio', ['Entrevistas y preventa', 'Costos y precio', 'Punto de equilibrio', 'Plan de 30 días'])),
}

def marca(tam, p):
    sub = 'rgba(26,20,5,.55)' if p['texto'] != '#fff' else 'rgba(255,255,255,.55)'
    return f'<span class="marca" style="font-size:{tam}px;color:{p["texto"]}"><span class="v" style="width:{tam*1.25}px;height:{tam*1.2}px;color:{p["acento"] if p["texto"] == "#fff" else p["texto"]}">{V}</span>Vorka <small style="color:{sub}">México</small></span>'

def tam_nombre(n, base):
    return base if len(n) <= 6 else int(base * 6.2 / len(n)) if len(n) > 8 else int(base * .8)

def portada(k, p):
    chips = ''.join(f'<span class="chip" style="background:{p["chipf"]};color:{p["texto"]};font-size:36px"><i style="background:{p["acento"] if p["texto"] == "#fff" else "#fff"}"></i>{d}</span>' for d in p['datos'])
    if 'sim' in p:
        s = SIMS[p['sim']]; visual = tel(sim_ui(s), 1010, 150, 1.12, 5) + sim_rep(s, 1100, 840, 360)
    elif 'ui' in p:
        visual = tel(p['ui'](), 1020, 150, 1.12, 5)
    else:
        visual = hojas(*p['hojas'])
    nombre_px = p.get('px') or (300 if len(p['nombre']) <= 4 else tam_nombre(p['nombre'], 236))
    return f"""<style>{CSS}{EXTRA}</style><div class="lienzo t3" style="width:1600px;height:1200px;background:{p['fondo']};color:{p['texto']}">
<div class="glow" style="width:700px;height:700px;right:-120px;top:-160px;background:{p['acento']};opacity:{.28 if p['texto'] == '#fff' else .35}"></div>
<div class="vfondo" style="right:-200px;bottom:-300px;width:1100px;opacity:.07;color:{p['texto']}">{V}</div>
<div style="position:absolute;left:90px;top:84px">{marca(34, p)}</div>
<div style="position:absolute;left:90px;top:{240 if p['pre'] else 300}px;width:820px">
  <span class="tag" style="font-size:34px;background:{p['tagf']};color:{p['texto']}">{p['tag']}</span>
  {f'<div style="margin-top:34px;font-size:92px;font-weight:800;letter-spacing:-.04em;color:{p["suave"]};line-height:1">{p["pre"]}</div>' if p['pre'] else '<div style="height:40px"></div>'}
  <h1 style="font-size:{nombre_px}px;margin-top:6px;color:{p['acento'] if p['texto'] == '#fff' else p['texto']}">{p['nombre']}</h1>
  <p style="margin:30px 0 0;font-size:52px;line-height:1.18;font-weight:650;letter-spacing:-.02em;color:{p['texto']};max-width:800px">{p['beneficio']}</p>
</div>
<div style="position:absolute;left:90px;bottom:90px;display:flex;gap:16px;flex-wrap:wrap;width:860px">{chips}</div>
{visual}
</div>"""

def og(k, p):
    if 'ui' in p: return og_app(k, p)
    s = SIMS[p['sim']]
    return f"""<style>{CSS}{EXTRA}</style><div class="lienzo t3" style="width:1200px;height:630px;background:{p['fondo']};color:{p['texto']}">
<div class="glow" style="width:500px;height:500px;right:-100px;top:-160px;background:{p['acento']};opacity:.3"></div>
<div style="position:absolute;left:64px;top:56px">{marca(24, p)}</div>
<div style="position:absolute;left:64px;top:150px;width:640px">
  <span class="tag" style="font-size:24px;background:{p['tagf']};color:{p['texto']}">{p['tag']}</span>
  <div style="margin-top:22px;font-size:60px;font-weight:800;letter-spacing:-.04em;color:{p['suave']};line-height:1">Simulador</div>
  <h1 style="font-size:{170 if len(p['nombre']) <= 4 else 118}px;color:{p['acento'] if p['texto'] == '#fff' else p['texto']}">{p['nombre']}</h1>
  <p style="margin:18px 0 0;font-size:30px;line-height:1.2;font-weight:650">{p['beneficio']}</p>
</div>
{tel(sim_ui(s), 790, 60, .66, 5)}
</div>"""

# Imagen para compartir de una app (la de los simuladores, con su pantalla): pre + nombre, beneficio y el celular
def og_app(k, p):
    return f"""<style>{CSS}{EXTRA}</style><div class="lienzo t3" style="width:1200px;height:630px;background:{p['fondo']};color:{p['texto']}">
<div class="glow" style="width:500px;height:500px;right:-100px;top:-160px;background:{p['acento']};opacity:.3"></div>
<div style="position:absolute;left:64px;top:56px">{marca(24, p)}</div>
<div style="position:absolute;left:64px;top:140px;width:660px">
  <span class="tag" style="font-size:24px;background:{p['tagf']};color:{p['texto']}">{p['tag']}</span>
  {f'<div style="margin-top:22px;font-size:60px;font-weight:800;letter-spacing:-.04em;color:{p["suave"]};line-height:1">{p["pre"]}</div>' if p['pre'] else ''}
  <h1 style="font-size:130px;color:{p['acento']}">{p['nombre']}</h1>
  <p style="margin:18px 0 0;font-size:32px;line-height:1.2;font-weight:650">{p['beneficio']}</p>
</div>
{tel(p['ui'](), 790, 60, .66, 5)}
</div>"""

def paso(k, p, cual):
    s = SIMS[p['sim']]
    if cual == 'tutor':
        c = [('1.er error: una pista', 'No te da la respuesta: te explica el método.'), ('2.º intento: paso a paso', 'Ves la solución y la regla detrás.')]
    else:
        c = [('Con cronómetro', 'Como el día del examen.'), ('Preguntas nuevas', 'Cada simulacro prioriza las que no has visto.')]
    llamadas = ''.join(f'<div class="callout" style="left:860px;top:{250 + i * 270}px;width:560px">{t}<small>{d}</small></div>' for i, (t, d) in enumerate(c))
    return f"""<style>{CSS}{EXTRA}</style><div class="lienzo t3" style="width:1600px;height:1000px;background:{p['fondo']}">
<div class="glow" style="width:600px;height:600px;left:300px;top:200px;background:{p['acento']};opacity:.3"></div>
{tel(sim_ui(s, reloj_grande=(cual == 'reloj')), 300, 70)}{llamadas}</div>"""

with sync_playwright() as pw:
    nav = pw.chromium.launch(executable_path=os.environ['CHROMIUM']) if os.environ.get('CHROMIUM') else pw.chromium.launch()
    def foto(nombre, html, w, h):
        pag = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pag.set_content(html); pag.wait_for_timeout(250)
        png = OUT / (nombre + '.png')
        pag.screenshot(path=str(png), clip={'x': 0, 'y': 0, 'width': w, 'height': h}); pag.close()
        # para compartir (WhatsApp, Facebook) va en JPG, que todos muestran; el resto en WebP, más ligero
        ext = 'jpg' if nombre.endswith('-og') else 'webp'
        im = Image.open(png).convert('RGB')
        im.save(OUT / f'{nombre}.{ext}', 'JPEG' if ext == 'jpg' else 'WEBP', quality=88, **({} if ext == 'jpg' else {'method': 6}))
        png.unlink(); print('·', OUT / f'{nombre}.{ext}')
    SOLO = [x for x in os.environ.get('SOLO', '').split(',') if x]   # SOLO=agenda: solo esa portada
    for k, p in P.items():
        if SOLO and k not in SOLO: continue
        foto(f'{k}-portada', portada(k, p), 1600, 1200)
        if 'sim' in p or p.get('og'):
            foto(f'{k}-og', og(k, p), 1200, 630)
        if 'sim' in p:
            foto(f'{k}-paso-reloj', paso(k, p, 'reloj'), 1600, 1000)
            foto(f'{k}-paso-tutor', paso(k, p, 'tutor'), 1600, 1000)
    nav.close()
