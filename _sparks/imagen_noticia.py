#!/usr/bin/env python3
"""Imágenes de una noticia de la Revista Sparks: portada del sitio (1600×900) y post para redes (1080×1350, 4:5).

Las usa la tarea programada que escribe los borradores de noticias (las sube a Vorka OS con la llave de Vorka IA).
- Portada: una foto de la ciudad, sin texto (el sitio ya pone el título encima).
- Redes: la foto arriba y un panel de color con el título, la categoría y la marca. Sin letreros en mayúsculas ni adornos.
Si la noticia trae una foto propia y con permiso (--foto), se usa esa en lugar de las de la ciudad.

Uso:
  python3 _sparks/imagen_noticia.py --titulo "**Lo importante** y lo demás" --categoria "Gobierno" --semilla "<slug>" --salida /ruta/carpeta [--foto foto.jpg]
Regla de títulos: la cabeza (hasta los dos puntos o hasta «|») va sola, grande y en negritas; el resto abajo, un poco más chico,
con lo importante entre **…** en negritas y lo demás en peso normal (sin asteriscos, todo en negritas).
Escribe portada.jpg y redes.jpg en la carpeta de salida.
"""
import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

AQUI = Path(__file__).resolve().parent
FOTOS = ['celaya-arcos-900.webp', 'celaya-guitarra-1200.webp', 'celaya-jardin-1200.webp', 'celaya-templo-1200.webp', 'celaya-torre-1600.webp']
# Los tonos de la revista (sparks.css): fondo del panel y un acento claro
TONOS = [('#6B2A85', '#F3ECF6'), ('#B83C78', '#FBEAF2'), ('#2B7A4B', '#E7F4EC'), ('#B8432F', '#FBEBE8'), ('#B5601C', '#FCEFE3'), ('#9A6B10', '#FBF2E1')]
FUENTE = '/System/Library/Fonts/SFNS.ttf'


def fuente(tam, peso='Bold'):
    f = ImageFont.truetype(FUENTE, tam)
    try:
        f.set_variation_by_name(peso)
    except Exception:
        pass
    return f


def palabras(titulo):
    """«**Lo importante** y lo demás» → [(palabra, negrita)]. Sin asteriscos, todo el título va en negritas."""
    if '**' not in titulo:
        return [(p, True) for p in titulo.split()]
    out = []
    for i, trozo in enumerate(titulo.split('**')):
        out += [(p, i % 2 == 1) for p in trozo.split()]
    return out


def partes(titulo):
    """Separa la cabeza del título: hasta «|» si lo hay; si no, hasta los primeros dos puntos. El resto empieza con mayúscula."""
    t = titulo.strip()
    if '|' in t:
        cab, resto = t.split('|', 1)
    elif ':' in t.replace('**', '')[:70]:
        i = t.index(':') + 1
        if t[i:i + 2] == '**' and t[:i].count('**') % 2 == 1:   # «**Saboreando Celaya:** …»: los asteriscos de cierre van con la cabeza
            i += 2
        cab, resto = t[:i], t[i:]
    else:
        return '', t
    cab, resto = cab.replace('**', '').strip(), resto.strip()
    if resto.startswith('**'):
        resto = '**' + resto[2:3].upper() + resto[3:]
    elif resto:
        resto = resto[0].upper() + resto[1:]
    return cab, resto


def partir(draw, pals, fb, fr, ancho):
    """Reparte las palabras en líneas que quepan, midiendo cada una con su propio peso."""
    esp = draw.textlength(' ', font=fr)
    lineas, actual, w = [], [], 0
    for p, b in pals:
        wp = draw.textlength(p, font=fb if b else fr)
        if actual and w + esp + wp > ancho:
            lineas.append(actual)
            actual, w = [], 0
        w += (esp if actual else 0) + wp
        actual.append((p, b, wp))
    if actual:
        lineas.append(actual)
    return lineas


def recorte(foto, w, h):
    return ImageOps.fit(foto.convert('RGB'), (w, h), Image.LANCZOS, centering=(0.5, 0.5))


def generar(titulo, categoria, semilla, salida, foto=None):
    n = int(hashlib.sha1(semilla.encode()).hexdigest(), 16)
    fondo, claro = TONOS[n % len(TONOS)]
    img = Image.open(foto) if foto else Image.open(AQUI / 'assets' / FOTOS[n % len(FOTOS)])
    salida = Path(salida)
    salida.mkdir(parents=True, exist_ok=True)

    recorte(img, 1600, 900).save(salida / 'portada.jpg', quality=84, optimize=True, progressive=True)

    W, H, M = 1080, 1350, 84
    lienzo = Image.new('RGB', (W, H), fondo)
    alto_foto = 700
    lienzo.paste(recorte(img, W, alto_foto), (0, 0))
    d = ImageDraw.Draw(lienzo)
    # Título: el tamaño más grande que quepa en 5 líneas dentro del panel
    y0, y_marca = alto_foto + 64, H - 120
    # Regla de títulos: la cabeza (hasta los dos puntos, o hasta «|») va sola, grande y en negritas; el resto en otra línea,
    # un poco más chico (78 %), con lo importante en negritas (entre **…**) y lo demás en peso normal.
    cabeza, resto = partes(titulo)
    pc = [(p, True) for p, _ in palabras(cabeza)] if cabeza else []
    pr = palabras(resto)
    ancho = W - 2 * M
    for tam in range(84, 36, -2):
        tr = round(tam * 0.78)
        fcb = fuente(tam, 'Bold')
        frb, frr = fuente(tr, 'Bold'), fuente(tr, 'Regular')
        lc = partir(d, pc, fcb, fcb, ancho) if pc else []
        lr = partir(d, pr, frb, frr, ancho) if pr else []
        alto = len(lc) * int(tam * 1.08) + (int(tam * 0.16) if lc and lr else 0) + len(lr) * int(tr * 1.16)
        if len(lc) <= 2 and len(lc) + len(lr) <= 6 and y0 + 56 + alto <= y_marca - 30:
            break
    d.text((M, y0), categoria, font=fuente(32, 'Semibold'), fill=claro)
    y = y0 + 56

    def pintar(lineas, fb, fr, salto):
        nonlocal y
        esp = d.textlength(' ', font=fr)
        for linea in lineas:
            x = M
            for p, b, wp in linea:
                d.text((x, y), p, font=fb if b else fr, fill='#FFFFFF')
                x += wp + esp
            y += salto
    pintar(lc, fcb, fcb, int(tam * 1.08))
    if lc and lr:
        y += int(tam * 0.16)
    pintar(lr, frb, frr, int(tr * 1.16))
    # Marca: logo + nombre, y a dónde ir
    d.line([(M, y_marca - 24), (W - M, y_marca - 24)], fill=claro, width=2)
    logo = Image.open(AQUI / 'assets' / 'logo.png').convert('RGBA')
    logo.thumbnail((56, 56))
    # El logo se centra con lo que se ve de las dos líneas (de lo alto de la «R» a lo bajo de la «j»), no con sus cajas
    f1, f2 = fuente(30, 'Semibold'), fuente(26, 'Regular')
    t1, t2 = 'Revista Sparks · Celaya', 'Lee la nota en vorka.mx/sparks/celaya'
    x_txt, y1, y2 = M + 72, y_marca + 6, y_marca + 44
    arriba, abajo = d.textbbox((x_txt, y1), t1, font=f1)[1], d.textbbox((x_txt, y2), t2, font=f2)[3]
    alfa = logo.getchannel('A')
    caja = alfa.getbbox() or (0, 0, logo.width, logo.height)   # lo que se ve del logo, sin su margen transparente
    alfa = alfa.crop(caja)
    y_logo = round((arriba + abajo) / 2 - alfa.height / 2)
    lienzo.paste(Image.new('RGBA', alfa.size, (255, 255, 255, 255)), (M, y_logo), alfa)
    d.text((x_txt, y1), t1, font=f1, fill='#FFFFFF')
    d.text((x_txt, y2), t2, font=f2, fill=claro)
    lienzo.save(salida / 'redes.jpg', quality=86, optimize=True, progressive=True)
    return salida / 'portada.jpg', salida / 'redes.jpg'


if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('--titulo', required=True)
    a.add_argument('--categoria', default='Comunidad')
    a.add_argument('--semilla', default='')
    a.add_argument('--salida', required=True)
    a.add_argument('--foto')
    x = a.parse_args()
    for p in generar(x.titulo, x.categoria, x.semilla or x.titulo, x.salida, x.foto):
        print(p)
