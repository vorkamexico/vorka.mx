# Vorka México · imágenes del Simulador UNAM (mismo estilo que portadas.py del PAA; sin escudos ni marcas de la UNAM).
# Uso: python3 _tienda/simulador/portadas_unam.py   → _tienda/simulador/img/unam-*.png
#   unam-portada_1600x1200.png → R2 portadas/simulador-unam-portada.png (portada en la tienda)
#   unam-og_1200x630.png       → R2 portadas/simulador-unam-og.png (vista previa al compartir)
#   unam-reporte_1600x900.png  → R2 portadas/simulador-unam-reporte.png
#   unam-regalo_1200x900.png   → R2 portadas/simulador-unam-regalo.png
import pathlib
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
# Estilos, marca y tarjetas compartidas con el PAA (todo lo de portadas.py antes de generar sus imágenes)
exec((AQUI / 'portadas.py').read_text().split('with sync_playwright')[0])

def telefono(x, y, escala=1, rot=0):
    return f"""<div class="tel" style="left:{x}px;top:{y}px;transform:scale({escala}) rotate({rot}deg);transform-origin:top left"><div class="pant"><div class="isla"></div>
  <div class="barra"><span class="m">{V}Simulador <b>UNAM</b></span><span class="reloj">1:58:20</span></div>
  <div class="cuerpo"><div class="prog"><i></i></div>
    <div class="cab"><span>Matemáticas · <b>7</b> de 24</span><span class="tema">Ecuaciones</span></div>
    <div class="enun">Si 3x − 7 = 11, ¿cuál es el valor de x?</div>
    <div class="op"><b>A</b>4/3</div>
    <div class="op"><b>B</b>6</div>
    <div class="op x"><b>C</b>18</div>
    <div class="op"><b>D</b>4</div>
    <div class="pista"><strong>Todavía no. Pista del tutor</strong>Llegaste bien a 3x = 18, pero falta un paso: ¿qué haces con el 3 que multiplica a x?</div>
  </div></div></div>"""

def reporte(x, y, w=360, escala=1):
    filas = [('Español', 14, 18), ('Matemáticas', 17, 24), ('Biología', 10, 13), ('Química', 8, 13)]
    b = ''.join(f'<div><div class="f"><span>{n}</span><span>{o}/{t}</span></div><div class="b"><i style="width:{100*o/t:.0f}%"></i><u style="left:70%"></u></div></div>' for n, o, t in filas)
    return f"""<div class="rep" style="left:{x}px;top:{y}px;width:{w}px;transform:scale({escala});transform-origin:top left">
  <div class="t">Medidor de preparación · Área 2</div><div class="e">Casi listo · 86/120</div>
  <div class="barras">{b}</div></div>"""

def portada():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1600px;height:1200px">
<div class="vfondo" style="right:-180px;bottom:-260px;width:1050px">{V}</div>
<div style="position:absolute;left:96px;top:170px;width:720px">
  <span class="marca" style="font-size:24px"><span class="v" style="width:30px;height:29px">{V}</span>Vorka <small>México</small></span>
  <div class="eti" style="margin-top:58px;font-size:22px"><i style="height:22px"></i>Examen de licenciatura · 4 áreas</div>
  <h1 style="margin-top:22px;font-size:112px;line-height:.94">Simulador<br><span>UNAM.</span></h1>
  <p class="sub" style="margin:30px 0 0;font-size:27px;line-height:1.42;max-width:620px">Practica las 10 materias con el peso de tu área, cronómetro real y un tutor que te guía cuando fallas.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:38px;font-size:20px"><span class="pill">Áreas 1, 2, 3 y 4</span><span class="pill">120 reactivos en 3 horas</span><span class="pill">Reporte por materia</span></div>
</div>
{telefono(930, 118)}
{reporte(1150, 730, 350)}
<div style="position:absolute;left:96px;right:96px;bottom:120px;border-top:1px solid rgba(255,255,255,.1);padding-top:26px;font-size:22px;color:rgba(244,242,245,.6)">Más de 470 reactivos originales · Explicación paso a paso · Acceso por un año</div>
</div>"""

def og():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1200px;height:630px">
<div class="vfondo" style="right:-120px;bottom:-200px;width:700px">{V}</div>
<div style="position:absolute;left:72px;top:72px;width:640px">
  <span class="marca" style="font-size:20px"><span class="v" style="width:25px;height:24px">{V}</span>Vorka <small>México</small></span>
  <div class="eti" style="margin-top:44px;font-size:19px"><i style="height:19px"></i>Examen de licenciatura · 4 áreas</div>
  <h1 style="margin-top:16px;font-size:88px;line-height:.95">Simulador <span>UNAM</span></h1>
  <p class="sub" style="margin:22px 0 0;font-size:24px;line-height:1.4">Examen de práctica en línea de tu área con tutor, explicación paso a paso y aciertos estimados.</p>
</div>
{telefono(760, 70, .62, 0)}
{reporte(890, 400, 300, .85)}
</div>"""

def reporte_pc():
    temas = [('Estequiometría', 1, 3, 'bajo'), ('Genética', 2, 4, 'bajo'), ('Funciones', 2, 3, 'medio'), ('Comprensión de lectura', 4, 4, 'alto'), ('México contemporáneo', 3, 3, 'alto')]
    color = {'bajo': ('#fdf1f0', '#a3261e', 'Reforzar'), 'medio': ('#fbf3e2', '#8a6a2c', 'En camino'), 'alto': ('#E7F4EC', '#2B8553', 'Fortaleza')}
    filas = ''.join(f"""<div style="display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;margin-top:14px">
      <span style="font-size:15px;font-weight:600">{n}</span><span style="justify-self:end;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:{color[c][0]};color:{color[c][1]}">{color[c][2]}</span>
      <span style="height:8px;border-radius:4px;background:#F4F2EF;overflow:hidden"><i style="display:block;height:100%;width:{100*o/t}%;background:#6B2A85;border-radius:4px"></i></span><span style="font-size:13px;font-weight:700;text-align:right">{o}/{t}</span></div>""" for n, o, t, c in temas)
    barras = ''.join(f"""<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:5px"><b>{n}</b><b>{o}/{t}</b></div>
      <div style="position:relative;height:11px;border-radius:4px;background:#F4F2EF"><i style="position:absolute;inset:0 auto 0 0;width:{100*o/t:.0f}%;background:#6B2A85;border-radius:4px"></i><u style="position:absolute;top:-4px;bottom:-4px;left:70%;width:2px;background:#141114"></u></div></div>""" for n, o, t in [('Español', 14, 18), ('Matemáticas', 17, 24), ('Biología', 10, 13), ('Química', 8, 13), ('Física', 9, 12)])
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1600px;height:900px;background:#F4F2EF">
<div style="position:absolute;left:80px;top:60px;width:1440px;height:780px;border-radius:22px;background:#FBFAF8;box-shadow:0 40px 90px -30px rgba(20,17,20,.35);overflow:hidden;color:#141114">
  <div style="height:46px;background:#ECEAE6;display:flex;align-items:center;gap:8px;padding:0 18px"><i style="width:12px;height:12px;border-radius:50%;background:#e06c5c"></i><i style="width:12px;height:12px;border-radius:50%;background:#e8b84c"></i><i style="width:12px;height:12px;border-radius:50%;background:#5fbf6a"></i>
    <span style="margin-left:22px;flex:1;max-width:520px;height:28px;border-radius:8px;background:#fff;font-size:13px;color:#6D696E;display:flex;align-items:center;padding:0 12px">vorka.mx/simulador-unam</span></div>
  <div style="padding:32px 48px">
    <div style="font-size:14px;font-weight:650;color:#6D696E">▍Resultado del examen completo · Área 2: Ciencias Biológicas, Químicas y de la Salud</div>
    <div style="display:grid;grid-template-columns:300px 1fr;gap:36px;align-items:center;margin-top:14px;background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:24px 34px">
      <svg viewBox="0 0 120 70" width="270"><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#ECEAE6" stroke-width="10" stroke-linecap="round"/><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#6B2A85" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="78 100"/><text x="60" y="58" text-anchor="middle" font-size="26" font-weight="750" fill="#141114">78</text></svg>
      <div><div style="font-size:30px;font-weight:750;letter-spacing:-.03em;color:#6B2A85">▰ Casi listo</div>
        <div style="margin-top:6px;font-size:18px">Aciertos estimados <b style="font-size:30px">86</b> <span style="color:#6D696E">/ 120 · meta 84</span></div>
        <p style="margin:12px 0 0;font-size:17px;line-height:1.55;color:#6D696E">Tu estimado <b style="color:#141114">ya alcanza tu meta</b>. Tu mayor oportunidad está en <b style="color:#141114">Química</b>: subir de 8 a 10 aciertos te da un margen más cómodo.</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:16px">
      <div style="background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:22px 28px"><b style="font-size:18px">Aciertos por materia</b>{barras}</div>
      <div style="background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:22px 28px"><b style="font-size:18px">Aciertos por tema</b>{filas}</div>
    </div>
  </div>
</div></div>"""

def regalo():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1200px;height:900px;background:#F4F2EF">
<div style="position:absolute;left:150px;top:110px;width:900px;height:560px;border-radius:36px;background:#0F0D10;overflow:hidden;box-shadow:0 50px 100px -30px rgba(20,17,20,.55);transform:rotate(-3deg)">
  <div class="vfondo" style="right:-90px;bottom:-130px;width:520px">{V}</div>
  <div style="position:absolute;left:60px;top:56px;right:60px">
    <div style="font-size:64px">🎁</div>
    <h1 style="margin-top:22px;font-size:68px;line-height:1">Diego, tienes un<br>regalo de <span>Mamá</span></h1>
    <p class="sub" style="margin-top:22px;font-size:24px;line-height:1.45;max-width:640px">Te regalaron el Simulador UNAM de Vorka México.</p>
    <div style="margin-top:26px;padding:20px 24px;border-radius:22px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:22px;color:#F4F2F5;max-width:640px">¡Vas a quedar en la carrera que quieres! Estoy muy orgullosa de ti.<div style="margin-top:8px;font-size:16px;color:rgba(244,242,245,.4)">— Mamá</div></div>
  </div>
</div>
<div style="position:absolute;right:120px;bottom:90px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:999px;padding:14px 22px;box-shadow:0 20px 40px -16px rgba(20,17,20,.35);font-size:18px;font-weight:650;color:#141114">🔒 Liga de un solo uso</div>
</div>"""

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM')) if __import__('os').environ.get('CHROMIUM') else p.chromium.launch()
    for nombre, html, w, h in [('unam-portada_1600x1200.png', portada(), 1600, 1200), ('unam-og_1200x630.png', og(), 1200, 630), ('unam-reporte_1600x900.png', reporte_pc(), 1600, 900), ('unam-regalo_1200x900.png', regalo(), 1200, 900)]:
        pag = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pag.set_content(html)
        pag.wait_for_timeout(300)
        pag.screenshot(path=str(OUT / nombre), clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        print('·', OUT / nombre)
    nav.close()
