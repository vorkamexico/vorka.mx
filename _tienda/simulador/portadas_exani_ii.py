# Vorka México · imágenes de reporte y regalo del Simulador EXANI-II (mismo estilo que portadas_prepa_ug.py; sin escudos ni
# marcas de CENEVAL ni de ninguna universidad). La portada, la imagen para compartir y los pasos salen de portadas_v3.py.
# Uso: CHROMIUM=<ruta de Chrome> python3 _tienda/simulador/portadas_exani_ii.py → _tienda/simulador/img/exani-ii-*.png
# y se copian a assets/tienda/simulador-exani-ii-{reporte,regalo}.png (estáticas del sitio, no R2).
import pathlib
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
# Estilos, marca y tarjetas compartidas con el PAA (todo lo de portadas.py antes de generar sus imágenes)
exec((AQUI / 'portadas.py').read_text().split('with sync_playwright')[0])

def reporte_pc():
    temas = [('Funciones', 2, 5, 'bajo'), ('Ortografía', 3, 6, 'bajo'), ('Genética', 4, 6, 'medio'), ('Interpretación de textos', 9, 10, 'alto'), ('Lectura general (inglés)', 4, 4, 'alto')]
    color = {'bajo': ('#fdf1f0', '#a3261e', 'Reforzar'), 'medio': ('#fbf3e2', '#8a6a2c', 'En camino'), 'alto': ('#E7F4EC', '#2B8553', 'Fortaleza')}
    filas = ''.join(f"""<div style="display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;margin-top:14px">
      <span style="font-size:15px;font-weight:600">{n}</span><span style="justify-self:end;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:{color[c][0]};color:{color[c][1]}">{color[c][2]}</span>
      <span style="height:8px;border-radius:4px;background:#F4F2EF;overflow:hidden"><i style="display:block;height:100%;width:{100*o/t}%;background:#3F38B5;border-radius:4px"></i></span><span style="font-size:13px;font-weight:700;text-align:right">{o}/{t}</span></div>""" for n, o, t, c in temas)
    barras = ''.join(f"""<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:5px"><b>{n}</b><b>{o}/{t}</b></div>
      <div style="position:relative;height:11px;border-radius:4px;background:#F4F2EF"><i style="position:absolute;inset:0 auto 0 0;width:{100*o/t:.0f}%;background:#3F38B5;border-radius:4px"></i><u style="position:absolute;top:-4px;bottom:-4px;left:70%;width:2px;background:#141114"></u></div></div>""" for n, o, t in [('Comprensión lectora', 23, 30), ('Redacción indirecta', 21, 30), ('Pensamiento matemático', 20, 30), ('Biología', 17, 24), ('Ciencias de la salud', 16, 24), ('Inglés', 21, 30)])
    return f"""<style>{CSS}</style><div class="lienzo" style="width:1600px;height:900px;background:#F4F2EF">
<div style="position:absolute;left:80px;top:60px;width:1440px;height:780px;border-radius:22px;background:#FBFAF8;box-shadow:0 40px 90px -30px rgba(20,17,20,.35);overflow:hidden;color:#141114">
  <div style="height:46px;background:#ECEAE6;display:flex;align-items:center;gap:8px;padding:0 18px"><i style="width:12px;height:12px;border-radius:50%;background:#e06c5c"></i><i style="width:12px;height:12px;border-radius:50%;background:#e8b84c"></i><i style="width:12px;height:12px;border-radius:50%;background:#5fbf6a"></i>
    <span style="margin-left:22px;flex:1;max-width:520px;height:28px;border-radius:8px;background:#fff;font-size:13px;color:#6D696E;display:flex;align-items:center;padding:0 12px">vorka.mx/simulador-exani-ii</span></div>
  <div style="padding:32px 48px">
    <div style="font-size:14px;font-weight:650;color:#6D696E">▍Resultado del examen completo · 168 reactivos · Biología + Ciencias de la salud</div>
    <div style="display:grid;grid-template-columns:300px 1fr;gap:36px;align-items:center;margin-top:14px;background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:24px 34px">
      <svg viewBox="0 0 120 70" width="270"><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#ECEAE6" stroke-width="10" stroke-linecap="round"/><path d="M8 64a52 52 0 0 1 104 0" fill="none" stroke="#3F38B5" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="74 100"/><text x="60" y="58" text-anchor="middle" font-size="26" font-weight="750" fill="#141114">74</text></svg>
      <div><div style="font-size:30px;font-weight:750;letter-spacing:-.03em;color:#3F38B5">▰ Casi listo</div>
        <div style="margin-top:6px;font-size:18px">Aciertos estimados <b style="font-size:30px">118</b> <span style="color:#6D696E">/ 168 · meta 110</span></div><div style="margin-top:4px;font-size:16px">Sin Inglés, como el puntaje global <b style="font-size:22px">97</b> <span style="color:#6D696E">/ 138</span></div>
        <p style="margin:12px 0 0;font-size:17px;line-height:1.55;color:#6D696E">Tu estimado <b style="color:#141114">ya alcanza tu meta</b>. Tu mayor oportunidad está en <b style="color:#141114">Pensamiento matemático</b>: llevas 20 de 30.</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:16px">
      <div style="background:#fff;border:1px solid #E7E5E7;border-radius:24px;padding:22px 28px"><b style="font-size:18px">Aciertos por área</b>{barras}</div>
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
    <p class="sub" style="margin-top:22px;font-size:24px;line-height:1.45;max-width:640px">Te regalaron el Simulador EXANI-II de Vorka México.</p>
    <div style="margin-top:26px;padding:20px 24px;border-radius:22px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:22px;color:#F4F2F5;max-width:640px">¡Vas a quedar en la carrera que quieres! Estoy muy orgullosa de ti.<div style="margin-top:8px;font-size:16px;color:rgba(244,242,245,.4)">— Mamá</div></div>
  </div>
</div>
<div style="position:absolute;right:120px;bottom:90px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:999px;padding:14px 22px;box-shadow:0 20px 40px -16px rgba(20,17,20,.35);font-size:18px;font-weight:650;color:#141114">🔒 Liga de un solo uso</div>
</div>"""

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM')) if __import__('os').environ.get('CHROMIUM') else p.chromium.launch()
    for nombre, html, w, h in [('exani-ii-reporte_1600x900.png', reporte_pc(), 1600, 900), ('exani-ii-regalo_1200x900.png', regalo(), 1200, 900)]:
        pag = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pag.set_content(html)
        pag.wait_for_timeout(300)
        pag.screenshot(path=str(OUT / nombre), clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        print('·', OUT / nombre)
    nav.close()
