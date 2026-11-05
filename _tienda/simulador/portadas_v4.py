# Vorka México · portadas v4 de TODA la tienda, con la estructura de Clara (la que se eligió como la más profesional):
# a la izquierda, en blanco, «V Producto by Vorka México», un titular en tinta con una sola frase en el color del producto,
# una línea de apoyo y tres datos; a la derecha, en gris claro, el celular derecho con la pantalla real del producto.
# Mismas pantallas y datos que portadas_v3.py (solo lo que ya dicen la descripción oficial o el banco de cada producto).
# Clara: también con objetos (su tarjeta con corte y pago, el ticket del día y lo que alcanza), en su azul.
# Uso: python3 _tienda/simulador/portadas_v4.py → assets/tienda/v3/<producto>-portada.webp y <producto>-og.jpg (mismas rutas)
#      SOLO=vuelve,cupo para algunas.
import os, pathlib, base64, io
from playwright.sync_api import sync_playwright
from PIL import Image

AQUI = pathlib.Path(__file__).parent
fuente = (AQUI / 'portadas_v3.py').read_text()
exec(fuente.split('with sync_playwright() as pw:')[0])   # CSS, V, tel(), sim_ui(), ui_*(), SIMS y P de la v3
OUT = AQUI.parent.parent / 'assets' / 'tienda' / 'v3'

TINTA, GRIS, PANEL = '#141114', '#5F5A63', '#F1F0F2'
# Por producto: color (oscuro, legible sobre blanco), titular (la parte entre [] va en color), apoyo y 3 datos (**negritas**)
V4 = {
  'simulador-paa': ('#1E5BB8', 'Simulador PAA', 'Practica como el día del examen y [sube tu puntaje.]', 'Lectura, redacción, matemáticas e inglés, con un tutor que te da pistas.', ['**642** reactivos', '**Tutor** con pistas', 'Puntaje **200–800**']),
  'simulador-unam': ('#9A6B00', 'Simulador UNAM', 'Practica [con el peso de tu área.]', 'Simulacros con cronómetro y práctica por materia para las 4 áreas.', ['**476** reactivos', '**4** áreas', '**120** reactivos en 3 h']),
  'simulador-ecoems': ('#D9480F', 'Simulador ECOEMS', 'Llega a la prepa UNAM o al IPN [bien preparado.]', 'Un tutor que te guía desde la secundaria, materia por materia.', ['**320** reactivos', '**10** materias', '**128** reactivos en 3 h']),
  'simulador-prepa-ug': ('#2B8A3E', 'Simulador prepa UG', 'Prepárate para el EXANI-I [de la prepa de la UG.]', 'Simulacros completos y práctica por área con tutor.', ['**400** reactivos', '**5** áreas', '**160** reactivos en 4.5 h']),
  'brindi': ('#8A2E4A', 'Brindi', 'Tu invitación digital, [lista en minutos.]', 'Confirmaciones al momento y acceso con QR para bodas, XV años y toda celebración.', ['**6** diseños premium', 'Confirmaciones **al momento**', 'Pase con **QR**']),
  'cupo': ('#6D28D9', 'Cupo', 'Tu evento, con registro [y entrada con QR.]', 'Cobra el cover sin comisión por boleto y controla la entrada con QR.', ['**Gratis** hasta 30 personas', 'Cover **sin comisión**', 'Check-in con **QR**']),
  'agenda': ('#05785A', 'Agenda', 'Tus clientes reservan solos, [a cualquier hora.]', 'Confirmación al instante y recordatorios para que nadie falte.', ['Confirmación **al instante**', '**Recordatorios**', 'Prueba **7 días** gratis']),
  'vuelve': ('#B42A44', 'Vuelve', 'Que tus clientes [vuelvan solos.]', 'Tarjeta de sellos o puntos en Apple y Google Wallet, con avisos automáticos.', ['**Sin** descargar app', 'Avisos **automáticos**', 'Prueba **7 días** gratis']),
  'cuentas': ('#0E6F78', 'Cuentas', 'Lo que prestas, [claro y en orden.]', 'Cada abono, intereses claros y el saldo al día de tus préstamos personales.', ['Intereses **claros**', '**PDF** y Excel', 'Prueba **7 días** gratis']),
  'vende': ('#C2256F', 'Vende', 'Clientas, pedidos y cobros, [en orden.]', 'Para venta por catálogo o encargo: tu ganancia real y mensajes listos para WhatsApp.', ['Ganancia **real**', '**WhatsApp** listo', '**Gratis** para empezar']),
  'ruta-de-impacto': ('#4338CA', 'Ruta de Impacto', 'Tu proyecto social, [de la idea a la comunidad.]', 'Un curso por niveles con tutor, para jóvenes de 15 a 29 años.', ['**6** niveles + final', '**Tutor** con pistas', 'Pago único · **1 año**']),
  'idea-en-orden': ('#1F7A44', 'Kit Idea en Orden', 'Ordena tu idea y [planea tus próximos 7 días.]', 'Emprendimiento nivel 1: workbook y herramientas para arrancar.', ['Workbook **PDF** · 32 págs.', '**Word** y Excel', '**6** herramientas']),
  'idea-negocio': ('#5B2A9E', 'Kit Idea → Negocio', 'Valida tu idea con [clientes reales.]', 'Emprendimiento nivel 2: entrevistas, preventa, costos y punto de equilibrio.', ['Workbook **PDF** · 32 págs.', '**2** Excel', 'Incluye **Nivel 1**']),
  'test-vocacional': ('#5B1F7A', 'Test vocacional', 'Descubre [qué carreras van contigo.]', 'Tu perfil de intereses y las carreras afines, explicado claro.', ['**48** preguntas', 'Perfil básico **gratis**', '**20** carreras afines']),
  'que-proyecto-social': ('#A8501F', '¿Qué proyecto social hago?', 'Tu proyecto social, [a tu medida.]', 'Para negocios, OSC y profesionistas, con indicadores y ODS.', ['**10** preguntas · 5 min', 'De **5 a 8** proyectos', 'Indicadores y **ODS**']),
  'evaluacion-liderazgo': ('#5B2A63', 'Evaluación de liderazgo', 'Lo que crees de ti, [contra lo que has hecho.]', 'Desde 12 años: 12 dimensiones y 3 acciones para 30 días.', ['**80** preguntas · 25 min', '**12** dimensiones', '**2** aplicaciones']),
  'toolkit': ('#8A6A1F', 'Toolkit', 'Pagas $599 y [recibes $800 cada mes.]', 'Saldo para toda la tienda: simuladores, reportes, meses de apps y códigos de regalo. Nunca vence.', ['Simuladores y **reportes**', 'Meses de **apps**', 'Códigos de **regalo**']),
  'toolkit-pro': ('#3E3A66', 'Toolkit Pro', 'Pagas $1,199 y [recibes $1,800 cada mes.]', 'Para quien compra seguido o revende con códigos de regalo.', ['Simuladores y **reportes**', 'Meses de **apps**', 'Códigos de **regalo**']),
  'portales': ('#0F5A8A', 'Portal', 'Tus propiedades, [en tu propio portal.]', 'Publica tus inmuebles con fotos y recibe a los interesados por WhatsApp.', ['Tu **portal** propio', 'Fotos y **ficha** por inmueble', 'Interesados por **WhatsApp**']),
  'clara': ('#1F5FD6', 'Clara', 'Tu dinero, claro. Anota todo [en segundos.]', 'Gastos, ingresos y tarjetas en un solo lugar. Clara te dice cuánto te alcanza al día.', ['**Efectivo**, débito y crédito', '**Sin** conectar tu banco', 'Desde **15** años']),
}

def ui_portales():
    casas = [('Casa en Los Pinos', '3 rec · 2 baños · 180 m²', '$2,450,000', '#C9D7E3'), ('Depa en el Centro', '2 rec · 1 baño · 85 m²', '$1,180,000', '#E3D6C9'), ('Terreno en Rinconada', '250 m² · uso habitacional', '$690,000', '#D3E3C9')]
    tarj = ''.join(f'<div class="card" style="display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;padding:10px"><span style="height:76px;border-radius:12px;background:{c}"></span><span><b style="font-size:16px">{n}</b><div class="s">{d}</div><b style="color:#0F5A8A">{p}</b></span></div>' for n, d, p, c in casas)
    return f"""<div class="ui" style="padding:70px 22px 0"><div class="s">Inmobiliaria de ejemplo</div><div class="h">Propiedades en venta</div>
  <div style="display:flex;gap:6px;margin-top:10px">{''.join(f'<span style="font-size:13px;font-weight:700;border-radius:999px;padding:6px 12px;background:{b};color:{t}">{x}</span>' for x, b, t in [('Todas', '#141114', '#fff'), ('Casas', '#F1F0F2', '#141114'), ('Terrenos', '#F1F0F2', '#141114')])}</div>
  {tarj}<span class="btn" style="background:#1f8f4e;color:#fff">Me interesa · WhatsApp</span></div>"""

# ---------- objetos (sin celulares): cada producto con algo que se siente real ----------
# Se dibujan en un lienzo de 672×1200 (el panel gris de la portada); para compartir se escala.
SOMBRA = 'box-shadow:0 2px 2px rgba(20,17,20,.06),0 30px 70px -22px rgba(20,17,20,.45)'
def qr(px, color='#141114'):
    import random
    r = random.Random(7); n = 21; c = ''
    for y in range(n):
        for x in range(n):
            esq = (x < 7 and y < 7) or (x > 13 and y < 7) or (x < 7 and y > 13)
            if esq:
                borde = x in (0, 6, 14, 20) or y in (0, 6, 14, 20); centro = (2 <= x % 14 <= 4 or 2 <= x <= 4) and (2 <= y % 14 <= 4 or 2 <= y <= 4)
                on = borde or (2 <= (x if x < 7 else x - 14) <= 4 and 2 <= (y if y < 7 else y - 14) <= 4)
            else: on = r.random() < .48
            if on: c += f'<rect x="{x}" y="{y}" width="1" height="1"/>'
    return f'<svg width="{px}" height="{px}" viewBox="0 0 {n} {n}" shape-rendering="crispEdges" fill="{color}">{c}</svg>'

def obj_brindi():
    return f"""
<div style="position:absolute;left:70px;top:450px;width:540px;height:380px;background:linear-gradient(160deg,#EFE4D6,#E2D3C0);border-radius:10px;transform:rotate(-9deg);{SOMBRA}">
  <div style="position:absolute;inset:0;clip-path:polygon(0 0,100% 0,50% 58%);background:linear-gradient(180deg,#E6D7C4,#D9C6AE);border-radius:10px"></div>
  <div style="position:absolute;left:236px;top:176px;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#A8405F,#6E1F37);display:grid;place-items:center;color:#F3D9A4;font:italic 700 30px Georgia,serif;box-shadow:0 6px 14px rgba(80,10,30,.4)">B</div></div>
<div style="position:absolute;left:150px;top:270px;width:420px;height:600px;background:#FFFBF4;border-radius:6px;transform:rotate(5deg);{SOMBRA};text-align:center;color:#5A1A2E">
  <div style="position:absolute;inset:18px;border:1.5px solid #D9B77A;border-radius:3px"></div>
  <div style="margin-top:70px;font:600 15px Inter,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#9A7A50">Nuestra boda</div>
  <div style="font:400 64px/1.02 Georgia,serif;margin-top:34px">Valeria</div><div style="font:italic 400 38px Georgia,serif;color:#B8925A;margin:6px 0">&amp;</div><div style="font:400 64px/1.02 Georgia,serif">Andrés</div>
  <div style="width:60px;height:1px;background:#D9B77A;margin:34px auto"></div>
  <div style="font:500 19px Inter,sans-serif;color:#6E5A4E">Sábado 14 de marzo · 18:00 h</div>
  <div style="position:absolute;left:0;right:0;bottom:56px;display:flex;justify-content:center;align-items:center;gap:14px;font:600 14px Inter,sans-serif;color:#6E5A4E">{qr(64, '#5A1A2E')}<span style="text-align:left">Tu pase<br>de entrada</span></div></div>"""

def obj_sim(k):
    s = SIMS[P[k]['sim']]; color = V4[k][0]
    titulo, barras, tipo = s['rep']
    filas = ''.join(f'<div style="margin-top:22px"><div style="display:flex;justify-content:space-between;font:600 18px Inter,sans-serif"><span>{n}</span><b>{a if tipo == "pts" else f"{a}/{b}"}</b></div><div style="height:10px;border-radius:5px;background:#ECEAEE;margin-top:8px"><i style="display:block;height:100%;width:{(a - 200) / 600 * 100 if tipo == "pts" else a / b * 100:.0f}%;border-radius:5px;background:{color}"></i></div></div>' for n, a, b in barras)
    burbujas = ''.join(f'<div style="display:flex;gap:12px;align-items:center;margin-top:13px;font:600 15px Inter,sans-serif;color:#8A8590"><span style="width:26px">{f}</span>' + ''.join(f'<span style="width:24px;height:24px;border-radius:50%;border:1.5px solid #B9B4BE;{"background:" + color + ";border-color:" + color if (f * 3 + o) % 4 == 0 else ""}"></span>' for o in range(4)) + '</div>' for f in range(1, 16))
    return f"""
<div style="position:absolute;left:60px;top:170px;width:400px;height:820px;background:#FDFDFC;border-radius:6px;transform:rotate(-8deg);{SOMBRA};padding:36px 34px">
  <div style="font:700 14px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8A8590">Hoja de respuestas</div>{burbujas}</div>
<div style="position:absolute;left:180px;top:250px;width:450px;height:680px;background:#fff;border-radius:8px;transform:rotate(4deg);{SOMBRA};padding:44px 42px;color:#141114">
  <div style="font:700 14px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:{color}">Reporte de preparación</div>
  <div style="font:850 40px/1.05 Inter,sans-serif;letter-spacing:-.03em;margin-top:14px">Simulador {s['nombre']}</div>
  <div style="display:flex;align-items:baseline;gap:12px;margin-top:26px"><b style="font:850 92px Inter,sans-serif;letter-spacing:-.05em;color:{color}">{titulo.split('·')[1].strip()}</b><span style="font:600 18px Inter,sans-serif;color:#5F5A63">{titulo.split('·')[0].strip()}</span></div>
  {filas}</div>"""

def obj_cupo():
    return f"""
<div style="position:absolute;left:-40px;top:780px;width:760px;height:96px;background:linear-gradient(90deg,#C8F560,#B5E84A);transform:rotate(-14deg);{SOMBRA};display:flex;align-items:center;gap:40px;padding-left:60px;font:850 30px Inter,sans-serif;letter-spacing:.2em;color:#17062F">CUPO · ACCESO · CUPO · ACCESO</div>
<div style="position:absolute;left:50px;top:300px;width:580px;height:300px;transform:rotate(-6deg);{SOMBRA};border-radius:22px;display:grid;grid-template-columns:1fr 190px;overflow:hidden">
  <div style="background:linear-gradient(140deg,#2B0F5C,#6D28D9);color:#fff;padding:30px 32px;position:relative">
    <div style="font:700 14px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.75">Sábado · 22:00 h</div>
    <div style="font:850 48px/1 Inter,sans-serif;letter-spacing:-.03em;margin-top:16px">Noche de<br>Brujas</div>
    <div style="font:600 17px Inter,sans-serif;opacity:.8;margin-top:26px">Cover $150 · Registro 184 / 300</div></div>
  <div style="background:#fff;display:grid;place-items:center;border-left:3px dashed #D7D0E6;position:relative">{qr(128, '#2B0F5C')}<span style="position:absolute;bottom:22px;font:700 13px Inter,sans-serif;letter-spacing:.14em;color:#6D28D9">CHECK-IN</span></div></div>"""

def obj_vuelve():
    # Como la tarjeta real de Vuelve: crema, logo y nombre, nivel, «Hola», sellos grandes, franja con foto y los sellos encima
    sellos = ''.join(f'<span style="width:74px;height:74px;border-radius:50%;display:grid;place-items:center;{"background:#FBF7F0;color:#1A1410;box-shadow:0 6px 16px rgba(0,0,0,.35)" if i < 7 else ("border:2.5px solid #D9B77A;color:#D9B77A" if i == 9 else "border:2px solid rgba(255,255,255,.55)")};font-size:30px">{"✓" if i < 7 else ("★" if i == 9 else "")}</span>' for i in range(10))
    return f"""
<div style="position:absolute;left:150px;top:640px;width:470px;height:300px;border-radius:26px;transform:rotate(7deg);{SOMBRA};background:#fff;padding:30px;display:flex;gap:26px;align-items:center;color:#141114">
  <div style="border:1px solid #ECE7DF;border-radius:16px;padding:12px">{qr(150)}</div>
  <div><b style="font:750 28px Inter,sans-serif;letter-spacing:-.02em">Muéstralo al pagar</b><div style="font:500 18px/1.4 Inter,sans-serif;color:#6B655F;margin-top:8px">Te sumamos tu visita en un segundo.</div><div style="font:600 22px ui-monospace,Menlo,monospace;letter-spacing:.12em;margin-top:10px">7KQ2XM</div></div></div>
<div style="position:absolute;left:40px;top:160px;width:560px;border-radius:34px;transform:rotate(-4deg);{SOMBRA};background:linear-gradient(170deg,#F4EEE4,#EEE6D9);overflow:hidden;color:#1A1410">
  <div style="display:flex;align-items:center;gap:16px;padding:30px 32px 0"><span style="width:58px;height:58px;border-radius:14px;background:linear-gradient(140deg,#5A3A22,#2E1C10);display:grid;place-items:center;color:#F3D9A4;font:700 30px Georgia,serif">C</span>
    <b style="font:750 30px Inter,sans-serif;letter-spacing:-.02em;flex:1">Café El Celayense</b><span style="border:1.5px solid #D9B77A;color:#9A7A50;border-radius:999px;padding:6px 18px;font:600 19px Inter,sans-serif">Oro</span></div>
  <div style="padding:34px 32px 0;font:500 24px Inter,sans-serif;color:#7A7268">Hola, Ana</div>
  <div style="display:flex;align-items:baseline;gap:12px;padding:0 32px"><b style="font:800 150px/1 Inter,sans-serif;letter-spacing:-.06em">7</b><span style="font:500 40px Inter,sans-serif;color:#7A7268">/ 10 sellos</span></div>
  <div style="margin-top:22px;height:200px;background:radial-gradient(120% 140% at 20% 30%,#8B5A34,#3B2414 55%,#1E120A);position:relative">
    <div style="position:absolute;inset:0;background:radial-gradient(40% 60% at 75% 40%,rgba(255,220,170,.35),transparent 70%)"></div>
    <div style="position:absolute;left:26px;right:26px;top:24px;display:grid;grid-template-columns:repeat(5,74px);justify-content:space-between;gap:14px 0">{sellos}</div></div>
  <div style="padding:24px 32px 30px;font:500 23px Inter,sans-serif;color:#7A7268">3 visitas más y te llevas <b style="color:#1A1410">tu bebida gratis</b>.</div></div>"""

def hoja_papel(left, top, w, h, rot, inner, fondo='#fff'):
    return f'<div style="position:absolute;left:{left}px;top:{top}px;width:{w}px;height:{h}px;background:{fondo};border-radius:8px;transform:rotate({rot}deg);{SOMBRA};padding:44px 42px;color:#141114;overflow:hidden">{inner}</div>'
def eti(color, t): return f'<div style="font:700 14px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:{color}">{t}</div>'

def obj_agenda():
    horas = [('9:00', 'Corte de cabello', 'Mariana R.', '#05785A'), ('10:30', 'Manicure', 'Lucía G.', '#C2256F'), ('12:00', 'Disponible', '', ''), ('13:30', 'Tinte', 'Sofía M.', '#6D28D9'), ('16:00', 'Corte y barba', 'Jorge P.', '#05785A')]
    filas = ''.join(f'<div style="display:grid;grid-template-columns:76px 1fr;gap:14px;align-items:center;margin-top:16px"><b style="font:700 19px Inter,sans-serif;color:#5F5A63">{h}</b>' + (f'<div style="border-left:5px solid {c};background:{c}14;border-radius:10px;padding:12px 16px"><b style="font:700 20px Inter,sans-serif">{t}</b><div style="font:500 16px Inter,sans-serif;color:#5F5A63">{n}</div></div>' if c else '<div style="border:2px dashed #D6D2DA;border-radius:10px;padding:16px;font:600 18px Inter,sans-serif;color:#9A95A0">Disponible · reserva en línea</div>') + '</div>' for h, t, n, c in horas)
    return f"""
<div style="position:absolute;left:330px;top:120px;width:250px;height:280px;border-radius:24px;background:#fff;transform:rotate(8deg);{SOMBRA};overflow:hidden;text-align:center">
  <div style="background:#05785A;color:#fff;font:800 24px Inter,sans-serif;letter-spacing:.14em;padding:16px">JUEVES</div><div style="font:850 140px/1.2 Inter,sans-serif;letter-spacing:-.06em;color:#141114">14</div></div>
{hoja_papel(60, 300, 520, 640, -3, eti('#05785A', 'Agenda de hoy') + '<div style="font:850 38px Inter,sans-serif;letter-spacing:-.03em;margin-top:10px">Estética Lumbre</div>' + filas)}"""

def obj_cuentas():
    abonos = ''.join(f'<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px dashed #D9D4DD;font:600 19px Inter,sans-serif"><span>Abono · {d}</span><b style="color:#0E6F78">−${m}</b></div>' for d, m in [('1 sep', '1,500.00'), ('15 sep', '1,500.00'), ('1 oct', '1,500.00'), ('15 oct', '1,500.00')])
    return f"""
{hoja_papel(70, 170, 500, 420, -6, eti('#0E6F78', 'Pagaré') + '<div style="font:400 32px/1.35 Georgia,serif;margin-top:16px">Debo y pagaré a la orden de <u>Ana López</u> la cantidad de <b>$24,000.00</b></div><div style="font:500 17px Inter,sans-serif;color:#5F5A63;margin-top:22px">Celaya, Gto. · 1 de agosto</div><div style="margin-top:44px;width:220px;border-top:1.5px solid #141114;padding-top:8px;font:500 15px Inter,sans-serif;color:#5F5A63">Firma</div>', '#FBF8F1')}
{hoja_papel(150, 470, 460, 520, 4, eti('#0E6F78', 'Estado de cuenta') + '<div style="font:850 34px Inter,sans-serif;letter-spacing:-.03em;margin-top:10px">Préstamo a Carla M.</div><div style="margin-top:18px;background:#0E3B42;color:#fff;border-radius:16px;padding:18px 20px"><div style="font:600 15px Inter,sans-serif;opacity:.7">Saldo al día de hoy</div><div style="font:850 46px Inter,sans-serif;letter-spacing:-.04em">$20,685.27</div><div style="font:500 14px Inter,sans-serif;opacity:.7">Interés 2 % mensual · claro para los dos</div></div>' + abonos)}"""

def obj_vende():
    prods = ''.join(f'<div style="border-radius:14px;overflow:hidden;background:#fff;border:1px solid #EFE7EC"><div style="height:120px;background:{c}"></div><div style="padding:10px 12px"><b style="font:700 16px Inter,sans-serif">{n}</b><div style="font:700 16px Inter,sans-serif;color:#C2256F">{pr}</div></div></div>' for n, pr, c in [('Labial mate', '$189', 'linear-gradient(135deg,#F7C6D9,#E87AA6)'), ('Crema facial', '$320', 'linear-gradient(135deg,#FBE6D4,#F2C29B)'), ('Perfume 50 ml', '$590', 'linear-gradient(135deg,#E6DDF7,#B9A3E8)'), ('Rímel', '$210', 'linear-gradient(135deg,#E4E4E4,#A9A9A9)')])
    return f"""
{hoja_papel(40, 160, 560, 700, -5, eti('#C2256F', 'Catálogo · Noviembre') + '<div style="font:850 40px Inter,sans-serif;letter-spacing:-.03em;margin:10px 0 18px">Lo más pedido</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' + prods + '</div>', '#FFF7FB')}
<div style="position:absolute;left:300px;top:700px;width:320px;border-radius:20px;background:#fff;transform:rotate(6deg);{SOMBRA};padding:22px 24px;color:#141114">
  {eti('#C2256F', 'Pedido #128')}<div style="font:750 22px Inter,sans-serif;margin-top:8px">Laura · 3 productos</div>
  <div style="display:flex;justify-content:space-between;margin-top:14px;font:600 18px Inter,sans-serif"><span>Total</span><b>$1,099</b></div>
  <div style="display:flex;justify-content:space-between;margin-top:6px;font:600 18px Inter,sans-serif;color:#0F7A5A"><span>Tu ganancia</span><b>$274</b></div>
  <div style="margin-top:14px;background:#1f8f4e;color:#fff;border-radius:12px;padding:10px;text-align:center;font:750 17px Inter,sans-serif">Avisar por WhatsApp</div></div>"""

def obj_ruta():
    niveles = ''.join(f'<div style="display:flex;gap:16px;align-items:center;margin-top:16px"><span style="width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font:800 20px Inter,sans-serif;{"background:#4338CA;color:#fff" if n < 3 else ("border:3px solid #4338CA;color:#4338CA" if n == 3 else "border:2px solid #D6D2E8;color:#9A95B5")}">{"✓" if n < 3 else n}</span><b style="font:650 21px Inter,sans-serif;{"color:#9A95B5" if n > 3 else ""}">{t}</b></div>' for n, t in enumerate(['El problema', 'Tu comunidad', 'La idea', 'El plan', 'Aliados y recursos', 'Arranque', 'Proyecto final'], 0))
    return f"""
<div style="position:absolute;left:250px;top:120px;width:360px;height:250px;border-radius:12px;background:linear-gradient(140deg,#FFFBF0,#F6EED8);transform:rotate(7deg);{SOMBRA};padding:30px;text-align:center;color:#2A2479">
  <div style="position:absolute;inset:12px;border:2px solid #D9B77A;border-radius:6px"></div>
  <div style="font:700 13px Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#9A7A50">Constancia</div><div style="font:400 34px Georgia,serif;margin-top:12px">Ruta de Impacto</div>
  <div style="font:500 16px Inter,sans-serif;color:#5F5A63;margin-top:12px">Proyecto social terminado</div><div style="width:56px;height:56px;border-radius:50%;margin:16px auto 0;background:radial-gradient(circle at 35% 30%,#F5D08A,#C8A45C)"></div></div>
{hoja_papel(60, 330, 500, 640, -4, eti('#4338CA', 'Tu avance') + '<div style="font:850 38px Inter,sans-serif;letter-spacing:-.03em;margin-top:10px">Huerto escolar</div>' + niveles)}"""

def obj_vocacional():
    letras = ''.join(f'<span style="width:96px;height:96px;border-radius:22px;display:grid;place-items:center;font:850 52px Inter,sans-serif;color:#fff;background:{c}">{l}</span>' for l, c in [('S', '#2E8B57'), ('A', '#9A3B8C'), ('I', '#2F6FB0')])
    tipos = [('Social', 82, '#2E8B57'), ('Artístico', 74, '#9A3B8C'), ('Investigador', 61, '#2F6FB0'), ('Emprendedor', 48, '#C8A45C'), ('Convencional', 35, '#5B6B7A'), ('Realista', 22, '#B5651D')]
    barras = ''.join(f'<div style="display:grid;grid-template-columns:150px 1fr 40px;gap:12px;align-items:center;margin-top:14px;font:600 18px Inter,sans-serif"><span>{n}</span><i style="height:12px;border-radius:6px;background:linear-gradient(90deg,{c} {v}%,#EEE9F2 {v}%)"></i><b>{v}</b></div>' for n, v, c in tipos)
    return hoja_papel(60, 180, 540, 840, -3, eti('#5B1F7A', 'Tu resultado') + '<div style="font:850 40px Inter,sans-serif;letter-spacing:-.03em;margin:10px 0 20px">Tu código vocacional</div><div style="display:flex;gap:16px">' + letras + '</div>' + barras + '<div style="margin-top:24px;background:#F6F0FA;border-radius:14px;padding:16px 18px"><b style="font:750 19px Inter,sans-serif">Carreras afines</b><div style="font:500 17px Inter,sans-serif;color:#5F5A63;margin-top:4px">Psicología, Pedagogía, Comunicación…</div></div>')

def obj_proyecto():
    ideas = [('Rescate de alimentos', [2, 12], '#F9DCC4'), ('Clínica de finanzas', [1, 8, 10], '#DCE8F7'), ('Huerto escolar', [15, 4, 13], '#DDF0D8')]
    tarj = ''.join(f'<div style="position:absolute;left:{60 + i * 40}px;top:{300 + i * 250}px;width:480px;border-radius:22px;background:#fff;transform:rotate({[-6, 3, -2][i]}deg);{SOMBRA};padding:26px 28px;color:#141114"><div style="display:flex;gap:14px;align-items:center"><span style="width:52px;height:52px;border-radius:14px;background:#A8501F;color:#fff;display:grid;place-items:center;font:800 24px Inter,sans-serif">{i + 1}</span><b style="font:800 28px Inter,sans-serif;letter-spacing:-.02em">{n}</b></div><div style="display:flex;gap:8px;margin-top:16px">' + ''.join(f'<span style="background:{bg};color:#5A2A0C;border-radius:999px;padding:6px 14px;font:750 16px Inter,sans-serif">ODS {o}</span>' for o in ods) + '</div></div>' for i, (n, ods, bg) in enumerate(ideas))
    return tarj

def obj_liderazgo():
    dims = [('Servicio', 7.4), ('Iniciativa', 5.2), ('Medición de impacto', 4.1), ('Resiliencia', 7.0), ('Comunicación', 6.3)]
    filas = ''.join(f'<div style="margin-top:18px"><div style="display:flex;justify-content:space-between;font:650 19px Inter,sans-serif"><span>{n}</span><b>{v:.1f}</b></div><div style="height:10px;border-radius:5px;background:#EEE9F0;margin-top:8px"><i style="display:block;height:100%;width:{v * 10}%;border-radius:5px;background:#5B2A63"></i></div></div>' for n, v in dims)
    return f"""
{hoja_papel(70, 160, 520, 820, -3, eti('#5B2A63', 'Ejemplo ilustrativo') + '<div style="font:850 38px Inter,sans-serif;letter-spacing:-.03em;margin-top:10px">Evaluación de liderazgo</div><div style="display:flex;align-items:baseline;gap:12px;margin-top:20px"><b style="font:850 110px/1 Inter,sans-serif;letter-spacing:-.05em;color:#5B2A63">58</b><span style="font:600 20px Inter,sans-serif;color:#5F5A63">de 100 · En construcción</span></div>' + filas)}
<div style="position:absolute;left:400px;top:820px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F2D79B,#C8A45C 60%,#9A7A30);transform:rotate(-10deg);{SOMBRA};display:grid;place-items:center;text-align:center;color:#3A2810;font:800 20px/1.2 Inter,sans-serif">12<br><span style="font-size:15px;font-weight:700">dimensiones</span></div>"""

def obj_toolkit(monto='$800', pago='$599', nombre='Toolkit', fondo='linear-gradient(140deg,#1C160C,#4A3818)', acento='#F2CF7E'):
    return f"""
<div style="position:absolute;left:150px;top:600px;width:440px;height:280px;border-radius:24px;transform:rotate(8deg);{SOMBRA};background:#fff;padding:26px 28px;color:#141114">
  {eti('#8A6A1F', 'Código de regalo')}<div style="font:800 34px ui-monospace,Menlo,monospace;letter-spacing:2px;margin-top:14px">TK-7KQ2-XM4P</div>
  <div style="font:500 18px Inter,sans-serif;color:#5F5A63;margin-top:10px">Simulador PAA · para quien tú quieras</div>
  <div style="position:absolute;right:26px;bottom:24px;background:#1f8f4e;color:#fff;border-radius:12px;padding:10px 16px;font:750 17px Inter,sans-serif">Enviar por WhatsApp</div></div>
<div style="position:absolute;left:50px;top:230px;width:540px;height:340px;border-radius:28px;transform:rotate(-6deg);{SOMBRA};background:{fondo};color:#fff;padding:34px 36px;overflow:hidden">
  <div style="position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:{acento};opacity:.16"></div>
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font:800 28px Inter,sans-serif">{nombre}</b><span style="width:44px;height:42px;color:{acento}">{V}</span></div>
  <div style="font:600 17px Inter,sans-serif;opacity:.7;margin-top:46px">Tu saldo cada mes</div>
  <div style="font:850 96px/1 Inter,sans-serif;letter-spacing:-.05em;color:{acento}">{monto}</div>
  <div style="font:600 18px Inter,sans-serif;opacity:.75;margin-top:12px">Pagas {pago} · nunca vence</div></div>"""

def obj_portales():
    casas = [('Casa en Los Pinos', '3 rec · 2 baños · 180 m²', '$2,450,000', 'linear-gradient(160deg,#BFD3E6,#7FA2C2)'), ('Depa en el Centro', '2 rec · 1 baño · 85 m²', '$1,180,000', 'linear-gradient(160deg,#E8D8C6,#C2A27F)')]
    tarj = ''.join(f'<div style="position:absolute;left:{60 + i * 90}px;top:{150 + i * 400}px;width:470px;border-radius:24px;background:#fff;transform:rotate({[-5, 4][i]}deg);{SOMBRA};overflow:hidden;color:#141114"><div style="height:230px;background:{bg};position:relative"><svg viewBox="0 0 200 120" style="position:absolute;left:50%;bottom:0;width:260px;transform:translateX(-50%)"><path d="M30 120V62l70-48 70 48v58z" fill="rgba(255,255,255,.85)"/><rect x="88" y="78" width="24" height="42" fill="rgba(20,40,60,.55)"/><rect x="50" y="72" width="26" height="22" fill="rgba(20,40,60,.4)"/><rect x="124" y="72" width="26" height="22" fill="rgba(20,40,60,.4)"/></svg><span style="position:absolute;left:18px;top:18px;background:#fff;border-radius:999px;padding:6px 14px;font:750 15px Inter,sans-serif">En venta</span></div><div style="padding:20px 24px"><b style="font:800 26px Inter,sans-serif">{n}</b><div style="font:500 17px Inter,sans-serif;color:#5F5A63;margin-top:4px">{d}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><b style="font:850 28px Inter,sans-serif;color:#0F5A8A">{p}</b><span style="background:#1f8f4e;color:#fff;border-radius:12px;padding:8px 14px;font:750 15px Inter,sans-serif">WhatsApp</span></div></div></div>' for i, (n, d, p, bg) in enumerate(casas))
    return tarj

def obj_kit(k):
    color, titulo, partes = P[k]['hojas']
    lista = ''.join(f'<div style="display:flex;gap:12px;align-items:center;margin-top:16px;font:650 20px Inter,sans-serif"><span style="width:28px;height:28px;border-radius:8px;background:{color};color:#fff;display:grid;place-items:center;font-size:15px">{i + 1}</span>{t}</div>' for i, t in enumerate(partes))
    return hoja_papel(150, 230, 440, 600, 7, '<div class="l" style="height:12px;border-radius:6px;background:#ECEAE6;margin:12px 0;width:70%"></div>' * 14, '#F7F5F0') + hoja_papel(60, 280, 480, 640, -4, eti(color, 'Vorka México · Kit digital') + f'<div style="font:850 46px/1.02 Inter,sans-serif;letter-spacing:-.04em;margin:14px 0 10px">{titulo}</div>' + lista, '#FDFCF9')

def obj_clara():
    # Clara: lo que se anota en ella, como objetos reales: una tarjeta con su corte y su pago, el ticket del día y lo que alcanza
    gastos = ''.join(f'<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px dashed #D9D6DE;font:600 19px ui-monospace,Menlo,monospace"><span>{n}</span><b style="color:{c}">{m}</b></div>' for n, m, c in [('TACOS', '−$150.00', '#D9534F'), ('LUZ', '−$420.00', '#D9534F'), ('CAMIÓN', '−$22.00', '#D9534F'), ('QUINCENA', '+$6,500.00', '#1E8A5A')])
    return f"""
<div style="position:absolute;left:80px;top:500px;width:430px;height:470px;background:#FFFFFE;border-radius:6px 6px 0 0;transform:rotate(-5deg);{SOMBRA};padding:40px 38px 0;color:#141114;clip-path:polygon(0 0,100% 0,100% 96%,95% 100%,90% 96%,85% 100%,80% 96%,75% 100%,70% 96%,65% 100%,60% 96%,55% 100%,50% 96%,45% 100%,40% 96%,35% 100%,30% 96%,25% 100%,20% 96%,15% 100%,10% 96%,5% 100%,0 96%)">
  <div style="text-align:center;font:800 22px ui-monospace,Menlo,monospace;letter-spacing:.16em">LO DE HOY</div>
  <div style="text-align:center;font:500 16px ui-monospace,Menlo,monospace;color:#6D696E;margin:6px 0 16px">DOMINGO 1 DE NOVIEMBRE</div>{gastos}
  <div style="display:flex;justify-content:space-between;margin-top:18px;font:800 22px ui-monospace,Menlo,monospace"><span>EFECTIVO</span><span>$1,240.00</span></div></div>
<div style="position:absolute;left:60px;top:170px;width:540px;height:340px;border-radius:26px;transform:rotate(-8deg);{SOMBRA};background:linear-gradient(135deg,#2B6FE8,#1F5FD6 45%,#123E99);color:#fff;padding:32px 34px;overflow:hidden">
  <div style="position:absolute;right:-80px;top:-90px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.10)"></div>
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font:800 26px Inter,sans-serif">Mi tarjeta</b><span style="width:62px;height:46px;border-radius:9px;background:linear-gradient(135deg,#F3DFA0,#C8A45C)"></span></div>
  <div style="font:600 28px ui-monospace,Menlo,monospace;letter-spacing:.18em;margin-top:48px">•••• •••• •••• 4821</div>
  <div style="display:flex;gap:46px;margin-top:30px;font:600 15px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.8"><span>Corte<br><b style="font-size:24px;letter-spacing:0;opacity:1">día 15</b></span><span>Pagar antes del<br><b style="font-size:24px;letter-spacing:0">día 5</b></span></div></div>
<div style="position:absolute;left:400px;top:915px;width:230px;height:210px;background:#FFF3B8;transform:rotate(6deg);{SOMBRA};padding:26px 24px;color:#141114">
  <div style="font:700 17px Inter,sans-serif;color:#6D5A1E">Te alcanzan</div><div style="font:850 62px/1.05 Inter,sans-serif;letter-spacing:-.04em;color:#1F5FD6">$133</div>
  <div style="font:600 18px Inter,sans-serif;color:#6D5A1E">al día hasta el 15</div></div>"""

OBJETOS = {'clara': obj_clara, 'brindi': obj_brindi, 'vuelve': obj_vuelve, 'cupo': obj_cupo, 'agenda': obj_agenda, 'cuentas': obj_cuentas, 'vende': obj_vende, 'ruta-de-impacto': obj_ruta,
  'test-vocacional': obj_vocacional, 'que-proyecto-social': obj_proyecto, 'evaluacion-liderazgo': obj_liderazgo, 'toolkit': obj_toolkit, 'portales': obj_portales,
  'toolkit-pro': lambda: obj_toolkit('$1,800', '$1,199', 'Toolkit Pro', 'linear-gradient(140deg,#14141F,#3E3A66)', '#F2CF7E'),
  'idea-en-orden': lambda: obj_kit('idea-en-orden'), 'idea-negocio': lambda: obj_kit('idea-negocio'),
  **{k: (lambda k=k: obj_sim(k)) for k in ['simulador-paa', 'simulador-unam', 'simulador-ecoems', 'simulador-prepa-ug']}}

def visual(k):
    if k in OBJETOS: return ('obj', OBJETOS[k]()), None
    if k == 'portales': return ui_portales(), None
    if k == 'clara': return None, None
    p = P[k]
    if 'sim' in p: return sim_ui(SIMS[p['sim']]), SIMS[p['sim']]
    if 'ui' in p: return p['ui'](), None
    return None, p['hojas']

def titular(t, color):
    a, _, r = t.partition('['); m, _, z = r.partition(']')
    return f'{a}<span style="color:{color}">{m}</span>{z}'
def dato(d): return d.replace('**', '<b>', 1).replace('**', '</b>', 1)
LOGO_V = lambda color: f'<span style="display:inline-block;width:1.05em;height:1em;color:{TINTA};vertical-align:-.1em">{V}</span>'

CLARA_PANEL = None
def panel_clara():
    global CLARA_PANEL
    if CLARA_PANEL is None:
        im = Image.open(OUT / 'clara-portada.webp').convert('RGB')
        caja = im.crop((928, 0, 1600, 1200)); b = io.BytesIO(); caja.save(b, 'PNG')
        CLARA_PANEL = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
    return CLARA_PANEL

def lienzo(k, w, h):
    color, nombre, tit, apoyo, datos = V4[k]
    s = w / 1600   # escala: portada 1600×1200, para compartir 1200×630
    og = h < 1000
    pw = int(w * (.42 if og else .42))   # ancho del panel gris
    ui, extra = visual(k)
    if isinstance(ui, tuple):
        esc = h / 1200
        z = esc * .84   # los objetos van más chicos que el panel, centrados, para que nunca se corten
        der = f'<div style="position:absolute;left:{w - pw + (pw - 672 * z) / 2}px;top:{(h - 1200 * z) / 2}px;width:672px;height:1200px;transform:scale({z});transform-origin:top left">{ui[1]}</div>'
    elif ui is not None:
        esc = (h * .78) / 880
        der = tel(ui, w - pw + (pw - 430 * esc) / 2, (h - 880 * esc) / 2 + (10 if og else 30), esc, 0)
        if extra and not og: der += sim_rep(extra, w - pw - 40, int(h * .64), 340)
    else:
        der = f'<div style="position:absolute;left:{w - pw - 640}px;top:{-40 if og else 0}px;transform:scale({.6 if og else 1});transform-origin:top left">{hojas(*extra)}</div>'
    t1, t2, tl, td, pad = (96, 40, 30, 25, 110) if not og else (60, 27, 21, 18, 64)
    return f"""<style>{CSS}{EXTRA}
.v4{{font-family:Inter,system-ui,sans-serif;color:{TINTA}}}
.v4 h1{{font-size:{t1}px;line-height:1.02;letter-spacing:-.045em;font-weight:800;margin:0;color:{TINTA}}}
.v4 .marca4{{font-size:{t2}px;font-weight:750;letter-spacing:-.02em;display:flex;flex-wrap:wrap;align-items:baseline;gap:.1em .35em}}
.v4 .marca4 small{{white-space:nowrap}}
.v4 .marca4 small{{font-size:.62em;font-weight:600;color:{GRIS};letter-spacing:0}}
.v4 .apoyo{{font-size:{tl}px;line-height:1.4;color:{GRIS};margin:{int(34*s/ (1 if not og else .75))}px 0 0;font-weight:500}}
.v4 .datos{{display:flex;gap:{30 if not og else 20}px;flex-wrap:wrap;font-size:{td}px;color:{GRIS};margin-top:{40 if not og else 22}px}}
.v4 .datos b{{color:{TINTA};font-weight:750}}
</style><div class="lienzo v4" style="width:{w}px;height:{h}px;background:#fff;overflow:hidden">
<div style="position:absolute;right:0;top:0;bottom:0;width:{pw}px;background:{PANEL}"></div>
{der}
<div style="position:absolute;left:{pad}px;top:0;bottom:0;width:{w - pw - pad - (60 if not og else 40)}px;display:flex;flex-direction:column;justify-content:center">
  <div class="marca4">{LOGO_V(color)}<span>{nombre}</span><small>by Vorka México</small></div>
  <h1 style="margin-top:{56 if not og else 26}px">{titular(tit, color)}</h1>
  <p class="apoyo">{apoyo}</p>
  <div class="datos">{''.join(f'<span>{dato(d)}</span>' for d in datos)}</div>
</div></div>"""

CON_OG = set(V4)   # todas llevan su imagen para compartir (JPG, que WhatsApp sí muestra)
with sync_playwright() as pw:
    nav = pw.chromium.launch(executable_path=os.environ['CHROMIUM']) if os.environ.get('CHROMIUM') else pw.chromium.launch()
    def foto(nombre, html, w, h):
        pag = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pag.set_content(html); pag.wait_for_timeout(300)
        png = OUT / (nombre + '.png')
        pag.screenshot(path=str(png), clip={'x': 0, 'y': 0, 'width': w, 'height': h}); pag.close()
        ext = 'jpg' if nombre.endswith('-og') else 'webp'
        im = Image.open(png).convert('RGB')
        im.save(OUT / f'{nombre}.{ext}', 'JPEG' if ext == 'jpg' else 'WEBP', quality=88, **({} if ext == 'jpg' else {'method': 6}))
        png.unlink(); print('·', OUT / f'{nombre}.{ext}')
    SOLO = [x for x in os.environ.get('SOLO', '').split(',') if x]
    for k in V4:
        if SOLO and k not in SOLO: continue
        foto(f'{k}-portada', lienzo(k, 1600, 1200), 1600, 1200)
        if k in CON_OG: foto(f'{k}-og', lienzo(k, 1200, 630), 1200, 630)
    nav.close()
