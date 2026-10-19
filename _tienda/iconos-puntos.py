# Vorka México · íconos de la app "Puntos Vorka" (PWA en vorka.mx/tienda/cuenta/)
# Dibuja la V del logo en oro metálico sobre tinta con un brillo morado y los guarda dentro del Worker
# (src/puntos-iconos.generado.js, base64) para que la app no dependa de cuándo se publique el sitio.
# Uso: python3 _tienda/iconos-puntos.py   (desde la raíz del repo; requiere Pillow)
import os, base64, io, json
from PIL import Image, ImageDraw, ImageFilter

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SALIDA = os.path.join(RAIZ, '_tienda', 'src', 'puntos-iconos.generado.js')

def bezier(p0, p1, p2, p3, n=40):
    out = []
    for i in range(1, n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out

# La V del logo (viewBox 69 225 940 909)
V1 = [(69, 226), (311, 226), (652, 877), (526, 1133)]
V2 = [(605, 225), (1009, 225)] + bezier((1009, 225), (930, 290), (830, 380), (800, 473)) + bezier((800, 473), (775, 360), (700, 270), (605, 225))

def icono(lado, escala_v=0.56, redondo=False):
    S = lado * 4                                    # se dibuja grande y se reduce: bordes suaves
    img = Image.new('RGB', (S, S), (20, 17, 20))
    # Brillo morado abajo a la derecha y un toque arriba
    glow = Image.new('RGB', (S, S), (0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([S * .35, S * .45, S * 1.25, S * 1.35], fill=(107, 42, 133))
    g.ellipse([-S * .3, -S * .45, S * .55, S * .25], fill=(60, 26, 76))
    glow = glow.filter(ImageFilter.GaussianBlur(S * .16))
    img = Image.blend(img, glow, .85)
    # Degradado metálico (oro) para la V
    oro = Image.new('RGB', (S, S))
    paradas = [(0, (111, 84, 32)), (.35, (230, 207, 150)), (.62, (200, 164, 92)), (1, (138, 106, 44))]
    fila = []
    for x in range(S):
        t = x / (S - 1)
        for i in range(len(paradas) - 1):
            (t0, c0), (t1, c1) = paradas[i], paradas[i + 1]
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                fila.append(tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3)))
                break
    linea = Image.new('RGB', (S, 1))
    linea.putdata(fila)
    oro = linea.resize((S, S))
    oro = oro.rotate(-28, resample=Image.BICUBIC, expand=False, fillcolor=(200, 164, 92))
    # Máscara de la V, centrada
    mascara = Image.new('L', (S, S), 0)
    m = ImageDraw.Draw(mascara)
    ancho_v, alto_v = 940, 909
    k = S * escala_v / ancho_v
    ox = (S - ancho_v * k) / 2 - 69 * k
    oy = (S - alto_v * k) / 2 - 225 * k + S * .01
    tr = lambda pts: [(ox + x * k, oy + y * k) for x, y in pts]
    m.polygon(tr(V1), fill=255)
    m.polygon(tr(V2), fill=255)
    img.paste(oro, (0, 0), mascara)
    img = img.resize((lado, lado), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True)
    return buf.getvalue()

iconos = {
    '192': icono(192),
    '512': icono(512),
    '180': icono(180),                  # apple-touch-icon (iOS le pone sus propias esquinas)
    'maskable': icono(512, escala_v=0.44),   # zona segura para Android (círculo del 80 %)
}
with open(SALIDA, 'w', encoding='utf-8') as f:
    f.write('// GENERADO por _tienda/iconos-puntos.py: no editar a mano\n')
    f.write('export const ICONOS = ' + json.dumps({k: base64.b64encode(v).decode() for k, v in iconos.items()}) + ';\n')
for k, v in iconos.items():
    print('·', k, len(v), 'bytes')
print('·', os.path.relpath(SALIDA, RAIZ))
