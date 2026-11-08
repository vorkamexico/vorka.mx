#!/usr/bin/env python3
"""Imágenes de una noticia de la Revista Sparks: portada del sitio (1600×900) y post para redes (1080×1350, 4:5).

Las usa la tarea programada que escribe los borradores de noticias (las sube a Vorka OS con la llave de Vorka IA).
- Portada: una foto de la ciudad, sin texto (el sitio ya pone el título encima).
- Redes: la foto arriba y un panel de color con el título, la categoría y la marca. Sin letreros en mayúsculas ni adornos.
Si la noticia trae una foto propia y con permiso (--foto), se usa esa en lugar de las de la ciudad.

Uso:
  python3 _sparks/imagen_noticia.py --titulo "…" --categoria "Gobierno" --semilla "<slug>" --salida /ruta/carpeta [--foto foto.jpg]
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


def partir(draw, texto, f, ancho):
    lineas, actual = [], ''
    for palabra in texto.split():
        prueba = f'{actual} {palabra}'.strip()
        if draw.textlength(prueba, font=f) <= ancho:
            actual = prueba
        else:
            if actual:
                lineas.append(actual)
            actual = palabra
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
    for tam in range(78, 40, -2):
        f = fuente(tam)
        lineas = partir(d, titulo, f, W - 2 * M)
        alto = len(lineas) * int(tam * 1.12)
        if len(lineas) <= 5 and y0 + 56 + alto <= y_marca - 30:
            break
    d.text((M, y0), categoria, font=fuente(32, 'Semibold'), fill=claro)
    y = y0 + 56
    for linea in lineas:
        d.text((M, y), linea, font=f, fill='#FFFFFF')
        y += int(tam * 1.12)
    # Marca: logo + nombre, y a dónde ir
    d.line([(M, y_marca - 24), (W - M, y_marca - 24)], fill=claro, width=2)
    logo = Image.open(AQUI / 'assets' / 'logo.png').convert('RGBA')
    logo.thumbnail((56, 56))
    blanco = Image.new('RGBA', logo.size, (255, 255, 255, 255))
    lienzo.paste(blanco, (M, y_marca + 4), logo.getchannel('A'))
    d.text((M + 72, y_marca + 6), 'Revista Sparks · Celaya', font=fuente(30, 'Semibold'), fill='#FFFFFF')
    d.text((M + 72, y_marca + 44), 'Lee la nota en vorka.mx/sparks/celaya', font=fuente(26, 'Regular'), fill=claro)
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
