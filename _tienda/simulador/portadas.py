# Vorka México · imágenes del Simulador PAA para la tienda y para compartir (Google, WhatsApp, redes).
# Uso: python3 _tienda/simulador/portadas.py   → _tienda/simulador/img/
#   portada_1600x1200.png  (portada del producto en la tienda; se sube a R2 como portadas/simulador-paa-v2.png)
#   og_1200x630.png        (vista previa al compartir vorka.mx/simulador-paa)
#   reporte_1600x900.png  (el reporte en computadora; portadas/simulador-paa-reporte.png)
#   regalo_1200x900.png    (tarjeta de regalo; portadas/simulador-paa-regalo.png)
# Requiere Playwright con Chrome (mismo método que productos-digitales/fuente/mockups.py).
import pathlib
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
OUT = AQUI / 'img'
OUT.mkdir(exist_ok=True)
V = '<svg viewBox="69 225 940 909" fill="currentColor"><path d="M69 226H311L652 877L526 1133Z"/><path d="M605 225H1009C930 290 830 380 800 473C775 360 700 270 605 225Z"/></svg>'

CSS = """
*{box-sizing:border-box} html,body{margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter",sans-serif;-webkit-font-smoothing:antialiased}
.lienzo{position:relative;overflow:hidden;background:#0F0D10;color:#F4F2F5}
.vfondo{position:absolute;color:#fff;opacity:.05}
.marca{display:inline-flex;align-items:center;gap:12px;font-weight:700;letter-spacing:-.02em;color:#fff}
.marca .v{color:#E6CF96;display:inline-block}
.marca small{color:rgba(244,242,245,.4);font-weight:600;font-size:inherit}
.eti{display:flex;align-items:center;gap:14px;font-weight:650;color:rgba(244,242,245,.66)}
.eti i{width:6px;transform:skewX(-28deg);border-radius:1px;background:#C8A45C}
h1{margin:0;font-weight:800;letter-spacing:-.05em;color:#fff}
h1 span{color:#E6CF96}
.sub{color:rgba(244,242,245,.72)}
.pill{display:inline-flex;align-items:center;padding:8px 18px;border-radius:999px;font-weight:650;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#fff}
/* teléfono */
.tel{position:absolute;width:430px;height:880px;border-radius:64px;background:#1b1a1d;padding:14px;box-shadow:0 2px 0 rgba(255,255,255,.08) inset,0 40px 90px -20px rgba(0,0,0,.7),0 0 0 2px #2a282c}
.pant{width:100%;height:100%;border-radius:52px;background:#FBFAF8;overflow:hidden;color:#141114;position:relative}
.isla{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#0b0a0c}
.barra{display:flex;align-items:center;justify-content:space-between;padding:62px 26px 14px;border-bottom:1px solid #E7E5E7}
.barra .m{display:flex;align-items:center;gap:8px;font-weight:650;font-size:17px}.barra .m svg{width:22px;height:21px}
.reloj{background:#141114;color:#fff;border-radius:999px;padding:6px 12px;font-weight:700;font-size:15px}
.cuerpo{padding:18px 24px}
.prog{height:4px;border-radius:4px;background:#ECEAE6;margin-bottom:12px}.prog i{display:block;height:100%;width:42%;background:#6B2A85;border-radius:4px}
.cab{display:flex;justify-content:space-between;font-size:13px;color:#6D696E;margin-bottom:14px}
.tema{color:#6B2A85;background:#F3ECF6;border-radius:999px;padding:2px 9px;font-weight:650;font-size:12px}
.enun{font-size:18px;font-weight:650;letter-spacing:-.02em;line-height:1.35;margin-bottom:14px}
.op{display:flex;gap:10px;align-items:center;border:1.5px solid #E7E5E7;border-radius:14px;padding:11px 12px;margin-bottom:9px;font-size:15px;background:#fff}
.op b{width:24px;height:24px;border-radius:8px;background:#F4F2EF;display:grid;place-items:center;font-size:12px}
.op.x{opacity:.55;border-style:dashed;text-decoration:line-through}
.pista{margin-top:12px;background:#fbf6ea;border:1px solid #eedfb8;border-radius:16px;padding:13px 14px;font-size:13.5px;line-height:1.45}
.pista strong{display:block;font-size:14.5px;margin-bottom:3px}
/* tarjeta del reporte */
.rep{position:absolute;background:#fff;color:#141114;border-radius:28px;padding:26px 28px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6)}
.rep .t{font-size:14px;font-weight:650;color:#6D696E}
.rep .e{font-size:22px;font-weight:750;color:#6B2A85;letter-spacing:-.03em;margin-top:2px}
.rep .barras{margin-top:14px;display:flex;flex-direction:column;gap:11px}
.rep .f{font-size:13px;display:flex;justify-content:space-between;font-weight:650;margin-bottom:4px}
.rep .b{height:9px;border-radius:4px;background:#F4F2EF;position:relative}.rep .b i{position:absolute;inset:0 auto 0 0;background:#6B2A85;border-radius:4px}
.rep .b u{position:absolute;top:-3px;bottom:-3px;width:2px;background:#141114}
"""

def telefono(x, y, escala=1, rot=0):
    return f"""<div class="tel" style="left:{x}px;top:{y}px;transform:scale({escala}) rotate({rot}deg);transform-origin:top left"><div class="pant"><div class="isla"></div>
  <div class="barra"><span class="m">{V}Simulador <b>PAA</b></span><span class="reloj">11:42</span></div>
  <div class="cuerpo"><div class="prog"><i></i></div>
    <div class="cab"><span>Redacción · <b>5</b> de 12</span><span class="tema">Conectores</span></div>
    <div class="enun">"El proyecto era costoso; ______, el comité lo aprobó por su alto impacto social."</div>
    <div class="op"><b>A</b>por consiguiente</div>
    <div class="op x"><b>B</b>es decir</div>
    <div class="op"><b>C</b>no obstante</div>
    <div class="op"><b>D</b>además</div>
    <div class="pista"><strong>Todavía no. Pista del tutor</strong>Lo esperable si algo es costoso es que NO se apruebe. ¿Qué conector introduce un resultado contrario a lo esperado?</div>
  </div></div></div>"""

def reporte(x, y, w=360, escala=1):
    filas = [('Lectura', 640, 73), ('Redacción', 590, 65), ('Matemáticas', 560, 60), ('Inglés', 610, 68)]
    b = ''.join(f'<div><div class="f"><span>{n}</span><span>{p}</span></div><div class="b"><i style="width:{w_}%"></i><u style="left:66%"></u></div></div>' for n, p, w_ in filas)
    return f"""<div class="rep" style="left:{x}px;top:{y}px;width:{w}px;transform:scale({escala});transform-origin:top left">
  <div class="t">Medidor de preparación</div><div class="e">Casi listo · 78</div>
  <div class="barras">{b}</div></div>"""

def portada():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1600px;height:1200px">
<div class="vfondo" style="right:-180px;bottom:-260px;width:1050px">{V}</div>
<div style="position:absolute;left:96px;top:170px;width:700px">
  <span class="marca" style="font-size:24px"><span class="v" style="width:30px;height:29px">{V}</span>Vorka <small>México</small></span>
  <div class="eti" style="margin-top:58px;font-size:22px"><i style="height:22px"></i>Prueba de Aptitud Académica</div>
  <h1 style="margin-top:22px;font-size:112px;line-height:.94">Simulador<br><span>PAA.</span></h1>
  <p class="sub" style="margin:30px 0 0;font-size:27px;line-height:1.42;max-width:600px">Practica Lectura, Redacción, Matemáticas e Inglés con cronómetro real y un tutor que te guía cuando fallas.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:38px;font-size:20px"><span class="pill">235 reactivos</span><span class="pill">Tutor de 2 intentos</span><span class="pill">Reporte de preparación</span></div>
</div>
{telefono(930, 118)}
{reporte(1170, 730, 330)}
<div style="position:absolute;left:96px;right:96px;bottom:120px;border-top:1px solid rgba(255,255,255,.1);padding-top:26px;font-size:22px;color:rgba(244,242,245,.6)">46 reactivos por simulacro · Explicación paso a paso · Acceso por un año</div>
</div>"""

def og():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1200px;height:630px">
<div class="vfondo" style="right:-120px;bottom:-200px;width:700px">{V}</div>
<div style="position:absolute;left:72px;top:72px;width:620px">
  <span class="marca" style="font-size:20px"><span class="v" style="width:25px;height:24px">{V}</span>Vorka <small>México</small></span>
  <div class="eti" style="margin-top:44px;font-size:19px"><i style="height:19px"></i>Prueba de Aptitud Académica</div>
  <h1 style="margin-top:16px;font-size:88px;line-height:.95">Simulador <span>PAA</span></h1>
  <p class="sub" style="margin:22px 0 0;font-size:24px;line-height:1.4">Examen de práctica en línea con tutor, explicación paso a paso y puntaje estimado.</p>
</div>
{telefono(760, 70, .62, 0)}
{reporte(905, 400, 280, .85)}
</div>"""

def reporte_pc():
    temas = [('Conectores y transiciones', 1, 3, 'bajo'), ('Inferencias', 2, 4, 'bajo'), ('Geometría', 2, 3, 'medio'), ('Vocabulario en contexto', 3, 3, 'alto'), ('Grammar', 4, 4, 'alto')]
    color = {'bajo': ('#fdf1f0', '#a3261e', 'Reforzar'), 'medio': ('#fbf3e2', '#8a6a2c', 'En camino'), 'alto': ('#E7F4EC', '#2B8553', 'Fortaleza')}
    filas = ''.join(f"""<div style="display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;margin-top:14px">
      <span style="font-size:15px;font-weight:600">{n}</span><span style="justify-self:end;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:{color[c][0]};color:{color[c][1]}">{color[c][2]}</span>
      <span style="height:8px;border-radius:4px;background:#F4F2EF;overflow:hidden"><i style="display:block;height:100%;width:{100*o/t}%;background:#6B2A85;border-radius:4px"></i></span><span style="font-size:13px;font-weight:700;text-align:right">{o}/{t}</span></div>""" for n, o, t, c in temas)
    barras = ''.join(f"""<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px"><b>{n}</b><b>{p}</b></div>
      <div style="position:relative;height:12px;border-radius:4px;background:#F4F2EF"><i style="position:absolute;inset:0 auto 0 0;width:{(p-200)/6}%;background:#6B2A85;border-radius:4px"></i><u style="position:absolute;top:-4px;bottom:-4px;left:66.6%;width:2px;background:#141114"></u></div></div>""" for n, p in [('Lectura', 640), ('Redacción', 560), ('Matemáticas', 590), ('Inglés', 620)])
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1600px;height:900px;background:#F4F2EF">
<div style="position:absolute;left:80px;top:60px;width:1440px;height:780px;border-radius:22px;background:#FBFAF8;box-shadow:0 40px 90px -30px rgba(20,17,20,.35);overflow:hidden;color:#141114">
  <div style="height:46px;background:#ECEAE6;display:flex;align-items:center;gap:8px;padding:0 18px"><i style="width:12px;height:12px;border-radius:50%;background:#e06c5c"></i><i style="width:12px;height:12px;border-radius:50%;background:#e8b84c"></i><i style="width:12px;height:12px;border-radius:50%;background:#5fbf6a"></i>
    <span style="margin-left:22px;flex:1;max-width:520px;height:28px;border-radius:8px;background:#fff;font-size:13px;color:#6D696E;display:flex;align-items:center;padding:0 12px">vorka.mx/simulador-paa</span></div>
  <div style="padding:36px 48px">
    <div style="font-size:14px;font-weight:650;color:#6D696E">▍Resultado del simulacro completo</div>
    <div style="display:grid;grid-template-columns:300px 1fr;gap:36px;align-items:center;margin-top:16px;background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:28px 34px">
      <svg viewBox="0 0 120 70" width="280"><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#ECEAE6" stroke-width="10" stroke-linecap="round"/><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#6B2A85" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="78 100"/><text x="60" y="58" text-anchor="middle" font-size="26" font-weight="750" fill="#141114">78</text></svg>
      <div><div style="font-size:30px;font-weight:750;letter-spacing:-.03em;color:#6B2A85">▰ Casi listo</div>
        <div style="margin-top:6px;font-size:18px">Puntaje estimado <b style="font-size:30px">600</b> <span style="color:#6D696E">/ 800 · meta 600</span></div>
        <p style="margin:12px 0 0;font-size:17px;line-height:1.55;color:#6D696E">Tu promedio estimado <b style="color:#141114">ya alcanza tu meta</b>. Tu mayor oportunidad está en <b style="color:#141114">Redacción</b>: subir de 560 a 600 equivale a acertar <b style="color:#141114">1 reactivo más</b> de cada 10.</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">
      <div style="background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:24px 28px"><b style="font-size:18px">Puntaje estimado por sección</b>{barras}</div>
      <div style="background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:24px 28px"><b style="font-size:18px">Aciertos por tema</b>{filas}</div>
    </div>
  </div>
</div></div>"""

def regalo():
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1200px;height:900px;background:#F4F2EF">
<div style="position:absolute;left:150px;top:110px;width:900px;height:560px;border-radius:36px;background:#0F0D10;overflow:hidden;box-shadow:0 50px 100px -30px rgba(20,17,20,.55);transform:rotate(-3deg)">
  <div class="vfondo" style="right:-90px;bottom:-130px;width:520px">{V}</div>
  <div style="position:absolute;left:60px;top:56px;right:60px">
    <div style="font-size:64px">🎁</div>
    <h1 style="margin-top:22px;font-size:68px;line-height:1">Sofía, tienes un<br>regalo de <span>Ana</span></h1>
    <p class="sub" style="margin-top:22px;font-size:24px;line-height:1.45;max-width:640px">Te regalaron el Simulador PAA de Vorka México.</p>
    <div style="margin-top:26px;padding:20px 24px;border-radius:22px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:22px;color:#F4F2F5;max-width:640px">¡Mucho éxito en tu examen! Sé que lo vas a lograr.<div style="margin-top:8px;font-size:16px;color:rgba(244,242,245,.4)">— Ana</div></div>
  </div>
</div>
<div style="position:absolute;right:120px;bottom:90px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:999px;padding:14px 22px;box-shadow:0 20px 40px -16px rgba(20,17,20,.35);font-size:18px;font-weight:650;color:#141114">🔒 Liga de un solo uso</div>
</div>"""

with sync_playwright() as p:
    nav = p.chromium.launch(channel='chrome')
    for nombre, html, w, h in [('portada_1600x1200.png', portada(), 1600, 1200), ('og_1200x630.png', og(), 1200, 630), ('reporte_1600x900.png', reporte_pc(), 1600, 900), ('regalo_1200x900.png', regalo(), 1200, 900)]:
        pag = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pag.set_content(html)
        pag.wait_for_timeout(300)
        pag.screenshot(path=str(OUT / nombre), clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        print('·', OUT / nombre)
    nav.close()
