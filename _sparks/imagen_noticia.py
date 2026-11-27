#!/usr/bin/env python3
"""Imágenes de una noticia de la Revista Sparks: portada del sitio (1600×900) y post para redes (1080×1350, 4:5).

Las usa la tarea programada que escribe los borradores de noticias (las sube a Vorka OS con la llave de Vorka IA).
- Portada: una foto de la ciudad, sin texto (el sitio ya pone el título encima).
- Redes: la foto arriba y un panel de color con el título, la categoría y la marca. Sin letreros en mayúsculas ni adornos.
Si la noticia trae una foto propia y con permiso (--foto), se usa esa en lugar de las de la ciudad.

Uso:
  python3 _sparks/imagen_noticia.py --titulo "**Lo importante** y lo demás" --categoria "Gobierno" --semilla "<slug>" --salida /ruta/carpeta [--foto foto.jpg] [--globos globos.json] [--municipio Cortazar]
--globos (portadas llamativas, regla de Brandon del 27 nov 2026): globos de diálogo y datos encima de la imagen, con el texto exacto
de la nota (la ilustración va SIN letras; las letras las pone este script para que salgan bien escritas). globos.json es una lista:
  {"texto": "¡Mejor llamo al **800 TECUIDO**!", "x": 0.06, "y": 0.06, "ancho": 0.36, "cola": [0.22, 0.42], "tipo": "globo"}
  x, y = esquina de arriba a la izquierda; ancho = ancho máximo; cola = a dónde apunta (quien habla). Todo en fracciones de la imagen.
  tipo: «globo» (blanco, lo que dice alguien), «voz» (negro, la voz del teléfono o de alguien que no sale), «dato» (etiqueta de color
  con una cifra o fecha de la nota, sin cola). Mantén x entre 0.08 y 0.92: en la imagen para redes se recortan un poco los lados.
Regla de títulos: la cabeza (hasta los dos puntos o hasta «|») va sola, grande y en negritas; el resto abajo, un poco más chico,
con lo importante entre **…** en negritas y lo demás en peso normal (sin asteriscos, todo en negritas).
Escribe portada.jpg y redes.jpg en la carpeta de salida.
"""
import argparse
import hashlib
from pathlib import Path

import json

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

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
    out, antes = [], ' '
    for i, trozo in enumerate(titulo.split('**')):
        pals = trozo.split()
        pegado = out and trozo[:1].strip() and antes[-1:].strip()   # «**enero**,»: la coma va pegada, sin espacio
        if trozo:
            antes = trozo
        if pals and pegado:
            out[-1] = (out[-1][0] + pals.pop(0), out[-1][1])
        out += [(p, i % 2 == 1) for p in pals]
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


def globos(img, lista, acento):
    """Pinta globos de diálogo y etiquetas de datos sobre la imagen (en una copia de 1920 de ancho)."""
    base = img.convert('RGB')
    base = base.resize((1920, round(1920 * base.height / base.width)), Image.LANCZOS)
    W, H = base.size
    S = 2   # se dibuja al doble y se baja, para que las orillas salgan suaves
    for g in lista:
        tipo = g.get('tipo', 'globo')
        tam = int(g.get('tam', 50 if tipo != 'dato' else 44))
        fb, fr = fuente(tam * S, 'Heavy' if tipo == 'dato' else 'Bold'), fuente(tam * S, 'Medium')
        capa = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
        d = ImageDraw.Draw(capa)
        pals = palabras(g['texto'])
        if tipo == 'dato':
            pals = [(p, True) for p, _ in pals]
        relleno = int(tam * (0.62 if tipo != 'dato' else 0.5)) * S
        lineas = partir(d, pals, fb, fr, g.get('ancho', 0.36) * W * S - 2 * relleno)
        salto = int(tam * 1.2) * S
        esp = d.textlength(' ', font=fr)
        ancho_txt = max(sum(wp for _, _, wp in l) + esp * (len(l) - 1) for l in lineas)
        x0, y0 = g['x'] * W * S, g['y'] * H * S
        x1, y1 = x0 + ancho_txt + 2 * relleno, y0 + len(lineas) * salto + 2 * relleno - int(tam * 0.2) * S
        radio = min((y1 - y0) / 2, 46 * S) if tipo != 'dato' else (y1 - y0) / 2
        forma = Image.new('L', capa.size, 0)
        fd = ImageDraw.Draw(forma)
        fd.rounded_rectangle([x0, y0, x1, y1], radius=radio, fill=255)
        if g.get('cola') and tipo != 'dato':
            cx, cy = g['cola'][0] * W * S, g['cola'][1] * H * S
            mx = min(max(cx, x0 + radio + 30 * S), x1 - radio - 30 * S)   # la cola sale del lado más cercano a quien habla
            if cy > y1:
                fd.polygon([(mx - 34 * S, y1 - 10 * S), (mx + 34 * S, y1 - 10 * S), (cx, cy)], fill=255)
            elif cy < y0:
                fd.polygon([(mx - 34 * S, y0 + 10 * S), (mx + 34 * S, y0 + 10 * S), (cx, cy)], fill=255)
            else:
                my = (y0 + y1) / 2
                lx = x1 - 10 * S if cx > x1 else x0 + 10 * S
                fd.polygon([(lx, my - 30 * S), (lx, my + 30 * S), (cx, cy)], fill=255)
        if tipo == 'dato':
            tinta, papel, borde = (255, 255, 255), acento, None
        elif tipo == 'voz':
            tinta, papel, borde = (255, 255, 255), (20, 20, 22), (255, 255, 255)
        else:
            tinta, papel, borde = (17, 17, 17), (255, 255, 255), (17, 17, 17)
        sombra = forma.filter(ImageFilter.GaussianBlur(14 * S)).point(lambda v: int(v * 0.45))
        capa.paste((0, 0, 0, 255), (6 * S, 12 * S), sombra)
        if borde:
            grueso = forma.filter(ImageFilter.MaxFilter(9 * S + 1))
            capa.paste(borde + (255,), (0, 0), grueso)
        capa.paste(papel + (255,) if isinstance(papel, tuple) else papel, (0, 0), forma)
        y = y0 + relleno - int(tam * 0.12) * S
        for linea in lineas:
            w_l = sum(wp for _, _, wp in linea) + esp * (len(linea) - 1)
            x = x0 + relleno + (ancho_txt - w_l) / 2
            for p, b, wp in linea:
                d.text((x, y), p, font=fb if b else fr, fill=tinta)
                x += wp + esp
            y += salto
        capa = capa.resize((W, H), Image.LANCZOS)
        base.paste(capa, (0, 0), capa)
    return base


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def generar(titulo, categoria, semilla, salida, foto=None, lista_globos=None, municipio='Celaya'):
    n = int(hashlib.sha1(semilla.encode()).hexdigest(), 16)
    fondo, claro = TONOS[n % len(TONOS)]
    img = Image.open(foto) if foto else Image.open(AQUI / 'assets' / FOTOS[n % len(FOTOS)])
    if lista_globos:
        img = globos(img, lista_globos, hex_rgb(fondo))
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
    slug = municipio.lower().replace(' ', '-')
    t1, t2 = f'Revista Sparks · {municipio}', f'Lee la nota en vorka.mx/sparks/{slug}'
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
    a.add_argument('--globos', help='JSON con globos de diálogo y datos (ver arriba)')
    a.add_argument('--municipio', default='Celaya')
    x = a.parse_args()
    lista = json.loads(Path(x.globos).read_text()) if x.globos else None
    for p in generar(x.titulo, x.categoria, x.semilla or x.titulo, x.salida, x.foto, lista, x.municipio):
        print(p)
