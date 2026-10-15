#!/usr/bin/env python3
"""
SPARKS CELAYA — generador del periódico.

Lee las noticias del Google Sheet (vía Apps Script) y genera páginas estáticas en
sparks/celaya/: portada, una página por noticia, fotos optimizadas, sitemap y RSS.

Uso:
  SPARKS_API_URL=... SPARKS_TOKEN=... python3 _sparks/build.py
  python3 _sparks/build.py --datos archivo.json --salida /otra/carpeta   (pruebas locales)
  python3 _sparks/build.py --forzar                                       (regenera aunque no haya cambios)

Solo requiere Pillow (pip install pillow).
"""
import argparse
import base64
import hashlib
import html
import io
import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ_REPO = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(RAIZ_REPO, "_sitio"))
import partes  # cabecera, pie y piezas del sistema visual v3 (compartidas con todo vorka.mx)

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]
MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
TONOS = ["purple", "pink", "mustard", "terra", "green", "orange"]

# ---------------------------------------------------------------- utilidades

def esc(s):
    return html.escape(str(s or ""), quote=True)


def leer_fecha(iso):
    iso = (iso or "").strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try:
            return datetime.strptime(iso[:19] if "T" in fmt else iso[:10], fmt)
        except ValueError:
            continue
    return datetime(2000, 1, 1)


def fecha_larga(d):
    return "%d de %s de %d" % (d.day, MESES[d.month - 1], d.year)


def fecha_corta(d):
    return "%d %s %d" % (d.day, MESES_CORTOS[d.month - 1], d.year)


def tono(texto):
    return TONOS[int(hashlib.md5((texto or "").encode()).hexdigest(), 16) % len(TONOS)]


def slug_cat(c):
    s = c.lower()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n"), ("ü", "u")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def inline(s):
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\"=])(https?://[^\s<]+)", r'<a href="\1" target="_blank" rel="noopener">\1</a>', s)
    return s


def texto_a_bloques(texto):
    """Convierte el texto del formulario en una lista de bloques HTML."""
    bloques, lista = [], []

    def cerrar_lista():
        if lista:
            bloques.append("<ul>" + "".join("<li>%s</li>" % inline(x) for x in lista) + "</ul>")
            del lista[:]

    for linea in (texto or "").replace("\r", "").split("\n"):
        l = linea.strip()
        if not l:
            cerrar_lista()
            continue
        if l.startswith(("- ", "• ", "* ")):
            lista.append(l[2:].strip())
            continue
        cerrar_lista()
        if l.startswith("#"):
            bloques.append("<h2>%s</h2>" % inline(l.lstrip("#").strip()))
        elif l.startswith("> "):
            bloques.append("<blockquote>%s</blockquote>" % inline(l[2:].strip()))
        else:
            bloques.append("<p>%s</p>" % inline(l))
    cerrar_lista()
    return bloques


def youtube_id(url):
    m = re.search(r"(?:youtu\.be/|v=|/shorts/|/embed/|/live/)([\w-]{11})", url or "")
    return m.group(1) if m else None


def palabras(texto):
    return len(re.findall(r"\w+", texto or ""))


# ---------------------------------------------------------------- datos

def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "sparks-build"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def cargar_noticias(args):
    if args.datos:
        with open(args.datos, encoding="utf-8") as f:
            return json.load(f)["noticias"]
    api, token = os.environ.get("SPARKS_API_URL"), os.environ.get("SPARKS_TOKEN")
    if not api or not token:
        print("⏸  Sin SPARKS_API_URL / SPARKS_TOKEN: no se leen noticias del Sheet (solo las historias de Vorka México).")
        return []
    data = http_json(api + ("&" if "?" in api else "?") + urllib.parse.urlencode({"token": token}))
    if "error" in data:
        sys.exit("Apps Script respondió: %s" % data["error"])
    return data["noticias"]


# Historias de la Revista Sparks que vienen de Vorka México (os.vorka.mx). Solo llegan las que el equipo marcó para publicar.
OS_API = os.environ.get("SPARKS_OS_API", "https://os.vorka.mx/api/publico/sparks")


def cargar_historias_os(cfg):
    if os.environ.get("SPARKS_SIN_OS"):
        return []
    municipio = cfg["ruta"].rstrip("/").split("/")[-1]
    try:
        data = http_json("%s/noticias?%s" % (OS_API, urllib.parse.urlencode({"municipio": municipio})))
    except Exception as e:  # si Vorka México no responde, se publica lo demás
        print("  ⚠️  No se pudieron leer las historias de Vorka México (%s)" % e)
        return []
    ns = [n for n in data.get("noticias", []) if n.get("slug") and n.get("titulo")]
    print("Historias de Vorka México: %d" % len(ns))
    return ns


# Historias que ya estaban publicadas antes del periódico (el sitio de Canva de Sparks Celaya).
# Viven en _sparks/archivo/<municipio>.json con sus fotos en _sparks/archivo/<municipio>/, y se publican
# junto con las del Sheet para que el bot no las borre. Para corregir una, edita ese JSON y haz commit.
DIR_ARCHIVO = os.path.join(AQUI, "archivo")


def cargar_archivo(cfg):
    municipio = cfg["ruta"].rstrip("/").split("/")[-1]
    ruta = os.path.join(DIR_ARCHIVO, municipio + ".json")
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding="utf-8") as f:
        ns = [n for n in json.load(f)["noticias"] if n.get("slug") and n.get("titulo") and n.get("publicar", True)]
    print("Historias del archivo: %d" % len(ns))
    return ns


def bajar_foto(args, foto_id):
    """Devuelve los bytes de la foto (ya reducida por Google a máx. 1600 px)."""
    if foto_id.startswith("archivo:"):
        ruta = os.path.normpath(os.path.join(DIR_ARCHIVO, foto_id[8:]))
        if not ruta.startswith(DIR_ARCHIVO + os.sep):
            raise RuntimeError("ruta fuera del archivo")
        with open(ruta, "rb") as f:
            return f.read()
    if foto_id.startswith("os:"):
        data = http_json("%s/foto/%s" % (OS_API, urllib.parse.quote(foto_id[3:])))
        if "data" not in data:
            raise RuntimeError(data.get("error", "sin datos"))
        return base64.b64decode(data["data"])
    if foto_id.startswith("file:"):
        with open(os.path.join(os.path.dirname(args.datos), foto_id[5:]), "rb") as f:
            return f.read()
    api, token = os.environ["SPARKS_API_URL"], os.environ["SPARKS_TOKEN"]
    data = http_json(api + ("&" if "?" in api else "?") + urllib.parse.urlencode({"token": token, "img": foto_id}))
    if "data" not in data:
        raise RuntimeError(data.get("error", "sin datos"))
    return base64.b64decode(data["data"])


def id_archivo(foto_id):
    return re.sub(r"[^\w-]", "_", foto_id.replace("file:", ""))[:60]


class Almacen:
    """Dónde viven las fotos: Cloudflare R2 si hay credenciales; si no, la carpeta img/ del repo.
    Cuando se activa R2, las fotos que estaban en el repo se suben solas y se borran del repo."""
    TIPOS = {"webp": "image/webp", "jpg": "image/jpeg"}
    PATRON = re.compile(r"^(.+)-(800\.webp|1600\.webp|og\.jpg)$")

    def __init__(self, cfg, dir_img, ruta_base):
        f = cfg.get("fotos") or {}
        self.dir_img = dir_img
        self.r2 = None
        cuenta, llave, secreto = (os.environ.get(k, "").strip() for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"))
        # Acepta el Account ID solo o pegado dentro de una URL del panel / endpoint S3.
        m = re.search(r"\b([0-9a-f]{32})\b", cuenta.lower())
        if cuenta and not m:
            print("::warning title=Sparks Celaya::R2_ACCOUNT_ID no parece un Account ID de Cloudflare "
                  "(32 letras y números; panel de R2 → 'Account ID'). Mientras lo corriges, las fotos se guardan en el repo.")
        cuenta = m.group(1) if m else ""
        if cuenta and llave and secreto and f.get("bucket") and f.get("urlPublica"):
            import boto3
            self.r2 = boto3.client("s3", endpoint_url="https://%s.r2.cloudflarestorage.com" % cuenta,
                                   aws_access_key_id=llave, aws_secret_access_key=secreto, region_name="auto")
            self.bucket = f["bucket"]
            self.prefijo = (f.get("prefijo") or "celaya").strip("/")
            self.url_base = f["urlPublica"].rstrip("/") + "/" + self.prefijo
            print("Fotos → Cloudflare R2 (%s)" % self.url_base)
        else:
            self.url_base = ruta_base + "/img"
            print("Fotos → repositorio (%s)" % self.url_base)

    def url(self, nombre, variante):
        return "%s/%s-%s" % (self.url_base, nombre, variante)

    def guardar(self, nombre, variante, datos):
        if self.r2:
            self.r2.put_object(Bucket=self.bucket, Key="%s/%s-%s" % (self.prefijo, nombre, variante), Body=datos,
                               ContentType=self.TIPOS[variante.rsplit(".", 1)[1]],
                               CacheControl="public, max-age=31536000, immutable")
        else:
            os.makedirs(self.dir_img, exist_ok=True)
            with open(os.path.join(self.dir_img, "%s-%s" % (nombre, variante)), "wb") as fh:
                fh.write(datos)

    def borrar(self, nombre):
        variantes = ("800.webp", "1600.webp", "og.jpg")
        if self.r2:
            self.r2.delete_objects(Bucket=self.bucket, Delete={"Objects": [
                {"Key": "%s/%s-%s" % (self.prefijo, nombre, v)} for v in variantes]})
        for v in variantes:
            p = os.path.join(self.dir_img, "%s-%s" % (nombre, v))
            if os.path.exists(p):
                os.remove(p)

    def migrar_del_repo(self):
        if not self.r2 or not os.path.isdir(self.dir_img):
            return
        for archivo in sorted(os.listdir(self.dir_img)):
            m = self.PATRON.match(archivo)
            if m:
                with open(os.path.join(self.dir_img, archivo), "rb") as fh:
                    self.guardar(m.group(1), m.group(2), fh.read())
                print("  ☁️  %s → R2" % archivo)
            os.remove(os.path.join(self.dir_img, archivo))
        os.rmdir(self.dir_img)


def a_bytes(im, formato, **opciones):
    buf = io.BytesIO()
    im.save(buf, formato, **opciones)
    return buf.getvalue()


def procesar_fotos(args, noticias, almacen, manifest):
    """Crea versiones -800.webp, -1600.webp y -og.jpg (portadas). Solo descarga fotos nuevas.
    manifest: {nombre: [ancho, alto, tiene_og]}"""
    from PIL import Image, ImageOps

    almacen.migrar_del_repo()
    portadas = {n["fotos"][0] for n in noticias if n["fotos"]}
    for n in noticias:
        for fid in n["fotos"]:
            nombre = id_archivo(fid)
            info = manifest.get(nombre)
            if info and (fid not in portadas or info[2]):
                continue
            try:
                im = Image.open(io.BytesIO(bajar_foto(args, fid)))
                im = ImageOps.exif_transpose(im).convert("RGB")
            except Exception as e:  # una foto rota no detiene la publicación
                print("  ⚠️  foto %s omitida (%s) en «%s»" % (fid, e, n["titulo"]))
                continue
            grande = im.copy()
            grande.thumbnail((1600, 1600))
            almacen.guardar(nombre, "1600.webp", a_bytes(grande, "WEBP", quality=74, method=6))
            chica = im.copy()
            chica.thumbnail((800, 800))
            almacen.guardar(nombre, "800.webp", a_bytes(chica, "WEBP", quality=72, method=6))
            og = 0
            if fid in portadas:
                almacen.guardar(nombre, "og.jpg", a_bytes(ImageOps.fit(im, (1200, 630), centering=(0.5, 0.4)),
                                                          "JPEG", quality=80, optimize=True, progressive=True))
                og = 1
            manifest[nombre] = [grande.width, grande.height, og]
            print("  📷 %s" % nombre)

    # Borrar fotos que ya ninguna noticia usa.
    vivos = {id_archivo(f) for n in noticias for f in n["fotos"]}
    for k in list(manifest):
        if k not in vivos:
            almacen.borrar(k)
            del manifest[k]
    # Fotos que fallaron no se muestran.
    for n in noticias:
        n["fotos"] = [f for f in n["fotos"] if id_archivo(f) in manifest]


# ---------------------------------------------------------------- HTML

class Sitio:
    def __init__(self, cfg, noticias, manifest, almacen):
        self.cfg = cfg
        self.almacen = almacen
        self.base = cfg["ruta"].rstrip("/")
        self.abs = cfg["sitio"].rstrip("/") + self.base
        self.noticias = noticias
        self.manifest = manifest
        ads = cfg.get("adsense") or {}
        self.ads_cliente = (ads.get("cliente") or "").strip()
        self.ads = ads
        self.en_portada = set()

    # ---- piezas

    def url(self, n):
        return "%s/%s/" % (self.base, n["slug"])

    def img_tag(self, foto_id, alt, sizes, eager=False, clase=""):
        nombre = id_archivo(foto_id)
        w, h = self.manifest[nombre][:2]
        chica, grande = self.foto(foto_id, "800.webp"), self.foto(foto_id, "1600.webp")
        carga = 'fetchpriority="high"' if eager else 'loading="lazy"'
        return ('<img class="%s" src="%s" srcset="%s 800w, %s 1600w" '
                'sizes="%s" width="%d" height="%d" alt="%s" decoding="async" %s>') % (
            clase, chica, chica, grande, sizes, w, h, esc(alt), carga)

    def foto(self, foto_id, variante):
        return self.almacen.url(id_archivo(foto_id), variante)

    def media(self, n, sizes, eager=False):
        if n["fotos"]:
            return self.img_tag(n["fotos"][0], n["persona"] or n["titulo"], sizes, eager)
        return '<span class="noimg tone-%s" aria-hidden="true"><b>%s</b></span>' % (tono(n["categoria"]), esc(n["categoria"]))

    def meta_linea(self, n):
        partes = []
        if n["persona"]:
            partes.append('<span class="who">%s</span>' % esc(n["persona"]))
        # Sin fecha visible: las historias de la revista no caducan
        return '<div class="meta">%s</div>' % '<span class="dot" aria-hidden="true">·</span>'.join(partes) if partes else ''

    # Caja de suscripción al boletín semanal (se guarda en os.vorka.mx, desde donde sale el boletín)
    def caja_boletin(self):
        return ('<aside class="bol" aria-labelledby="bol-t"><div class="bol-tx"><h2 id="bol-t">Una historia así, cada semana en tu correo</h2>'
                '<p>El boletín de la Revista Sparks: lo nuevo de %s y de la gente que está moviendo su comunidad. Una vez por semana, sin spam.</p></div>'
                '<form class="bol-f" data-boletin novalidate><input name="nombre" placeholder="Tu nombre" autocomplete="name" aria-label="Nombre">'
                '<input name="correo" type="email" placeholder="Tu correo" autocomplete="email" aria-label="Correo">'
                '<input class="bol-trampa" name="sitio" tabindex="-1" autocomplete="off" aria-hidden="true">'
                '<label class="bol-ok"><input type="checkbox" name="acepto" value="1"><span>Acepto recibir el boletín y el <a href="/privacidad/">aviso de privacidad</a>.</span></label>'
                '<button class="btn tinta" type="submit">Suscribirme</button><p class="bol-msg" role="status"></p></form></aside>') % esc(self.cfg["ciudad"].split(",")[0])

    def kicker(self, n):
        return '<span class="kicker tone-%s">%s</span>' % (tono(n["categoria"]), esc(n["categoria"]))

    def tarjeta(self, n):
        return ('<article class="card"><a class="card-link" href="%s">'
                '<div class="card-img">%s</div>'
                '<div class="card-body">%s<h3 class="card-title">%s</h3><p class="card-sum">%s</p>%s</div>'
                '</a></article>') % (
            self.url(n), self.media(n, "(min-width:1024px) 400px, (min-width:640px) 50vw, 120px"),
            self.kicker(n), esc(n["titulo"]), esc(n["resumen"]), self.meta_linea(n))

    def anuncio(self, slot):
        slot = (self.ads.get(slot) or "").strip()
        if not (self.ads_cliente and slot):
            return ""
        return ('<div class="ad" aria-label="Publicidad"><span class="ad-label">Publicidad</span>'
                '<ins class="adsbygoogle" style="display:block" data-ad-client="%s" data-ad-slot="%s" '
                'data-ad-format="auto" data-full-width-responsive="true"></ins>'
                '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>') % (esc(self.ads_cliente), esc(slot))

    def pagina(self, titulo, descripcion, canonical, og_img, cuerpo, tipo="website", jsonld=None, extra_head=""):
        """Página con la misma cabecera, pie y estilo que el resto de vorka.mx (sistema v3, ver _sitio/partes.py)."""
        c = self.cfg
        ads = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>'
               % esc(self.ads_cliente)) if self.ads_cliente else ""
        ld = '<script type="application/ld+json">%s</script>' % json.dumps(jsonld, ensure_ascii=False).replace("</", "<\\/") if jsonld else ""
        cabeza = """<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="max-image-preview:large">
<meta name="theme-color" content="#FBFAF8">
<meta property="og:site_name" content="{nombre}">
<meta property="og:locale" content="es_MX">
<meta property="og:type" content="{tipo}">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/v3/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{base}/assets/favicon.png">
<link rel="alternate" type="application/rss+xml" title="{nombre}" href="{base}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/v3/vorka.css?v={vv}">
<link rel="stylesheet" href="{base}/assets/sparks.css?v={v}">
{extra}{ads}{ld}
</head>
<body class="sparks">
<a class="saltar" href="#contenido">Saltar al contenido</a>
""".format(titulo=esc(titulo), desc=esc(descripcion), canon=esc(canonical), og=esc(og_img), tipo=tipo,
           nombre=esc(c["nombre"]), base=self.base, extra=extra_head, ads=ads, ld=ld, v=self.version, vv=partes.VERSION)
        lb = ('<dialog class="lb" id="lb" aria-label="Galería"><button class="lb-x" data-lb-close aria-label="Cerrar">×</button>'
              '<button class="lb-nav lb-prev" data-lb-prev aria-label="Anterior">‹</button><img alt="">'
              '<button class="lb-nav lb-next" data-lb-next aria-label="Siguiente">›</button><p class="lb-cap"></p></dialog>')
        return (cabeza + partes.nav("/sparks/") + '<main id="contenido">\n' + cuerpo + '\n</main>\n' + partes.pie() + lb
                + '<script src="%s/assets/sparks.js?v=%s" defer></script>\n</body>\n</html>\n' % (self.base, self.version))

    def secciones_footer(self):
        conteo = {}
        for n in self.noticias:
            conteo[n["categoria"]] = conteo.get(n["categoria"], 0) + 1
        top = sorted(conteo, key=lambda c: (-conteo[c], c))[:5]
        return "\n".join('<li><a href="%s/?categoria=%s">%s</a></li>' % (self.base, esc(slug_cat(c)), esc(c)) for c in top)

    def og_de(self, n):
        if n and n["fotos"]:
            u = self.foto(n["fotos"][0], "og.jpg")
            return u if u.startswith("http") else self.cfg["sitio"].rstrip("/") + u
        return "%s/assets/og-default.jpg" % self.abs

    # ---- intro de la ciudad (primero se presenta la ciudad, luego sus historias)

    def intro(self):
        i = self.cfg.get("intro")
        if not i:
            return ""
        f = i.get("fotos", {})

        def img(x, sizes, clase="", eager=False):
            if not x:
                return ""
            base = "%s/assets/%s" % (self.base, x["src"])
            a = x.get("anchos", [900])
            return ('<img class="%s" src="%s-%d.webp" srcset="%s" sizes="%s" alt="%s" decoding="async"%s>') % (
                clase, base, a[-1], ", ".join("%s-%d.webp %dw" % (base, w, w) for w in a), sizes, esc(x.get("alt", "")),
                ' fetchpriority="high"' if eager else ' loading="lazy"')
        parrafos = i.get("parrafos", [])
        construye = ""
        if i.get("construye"):
            construye = '<div class="intro-construye"><p>%s</p><ul>%s</ul></div>' % (
                esc(i.get("construyeTitulo", "")), "".join("<li>%s</li>" % esc(x) for x in i["construye"]))
        lectura = "".join("<p>%s</p>" % esc(x) for x in parrafos[1:])
        if i.get("frase"):
            lectura += '<blockquote>%s</blockquote>' % esc(i["frase"])
        lectura += "".join("<p>%s</p>" % esc(x) for x in i.get("mas", []))
        if i.get("cierre"):
            lectura += '<p class="intro-final"><b>%s</b> %s</p>' % (esc(i["cierre"]), esc(i.get("cierreSub", "")))
        mas = ('<details class="intro-mas"><summary><span class="abrir">Leer la presentación completa</span><span class="cerrar">Cerrar</span></summary>'
               '<div class="intro-lectura">%s</div></details>' % lectura) if lectura else ""
        tira = "".join('<figure>%s</figure>' % img(x, "(min-width:900px) 30vw, 70vw") for x in f.get("tira", []))
        return ('<section class="intro" aria-labelledby="intro-t">'
                '<div class="intro-mosaico"><figure class="intro-hero">%s<figcaption><p class="intro-lugar">%s</p>'
                '<h2 class="intro-t" id="intro-t">%s %s</h2><a class="intro-ir" href="#front">Leer sus historias</a></figcaption></figure>'
                '<figure class="intro-lado">%s</figure></div>'
                '<div class="intro-cuerpo"><p class="intro-lead">%s</p>%s</div>'
                '%s%s%s</section>') % (
            img(f.get("principal"), "(min-width:900px) 66vw, 100vw", eager=True), esc(i.get("etiqueta", "")), esc(i.get("titulo", "")), esc(i.get("acento", "")),
            img(f.get("lateral"), "(min-width:900px) 33vw, 1px"),
            esc(parrafos[0]) if parrafos else "", construye,
            '<div class="intro-tira">%s</div>' % tira if tira else "", mas,
            '<p class="intro-credito">%s</p>' % esc(f["credito"]) if f.get("credito") else "")

    # ---- portada

    def portada(self):
        c, ns = self.cfg, self.noticias
        destacada = next((n for n in ns if n["destacada"]), ns[0] if ns else None)
        resto = [n for n in ns if n is not destacada]
        secundarias, lista = resto[:2], resto[2:]
        self.en_portada = {n["slug"] for n in [destacada] + secundarias if n}
        por_pagina = int(c.get("noticiasPorPagina", 12))
        categorias = []
        for n in ns:
            if n["categoria"] not in categorias:
                categorias.append(n["categoria"])
        categorias.sort()

        nombre = esc(c["nombre"])
        titular = nombre.replace(" ", ' <span class="metal">', 1) + "</span>" if " " in nombre else nombre
        ciudad_corta = esc(c["ciudad"].split(",")[0])
        partes_html = ['<section class="sp-cab">%s<div class="marco">'
                  '<div class="migas"><a href="/">Vorka</a><span>/</span><a href="/sparks/">Revista Sparks</a><span>/</span><span>%s</span></div>'
                  '<span class="etiqueta">Revista Sparks · Edición %s</span>'
                  '<h1 class="h1 sp-titulo">%s</h1><p class="lead">%s.</p>'
                  '<div class="sp-datos"><span class="sp-pill"><b>%d</b> %s</span>'
                  '<a class="sp-pill" href="#buscar">Buscar historias</a>'
                  '<a class="sp-pill" href="%s" target="_blank" rel="noopener">@vorka.mx</a></div>'
                  '</div></section>' % (
                      partes.v_metal("v-fondo", "gsp", oscuro=False), nombre, ciudad_corta, titular, esc(c["lema"]),
                      len(ns), "historia" if len(ns) == 1 else "historias", esc(c["instagram"])),
                  '<div class="marco">',
                  self.intro(),
                  '<div class="tools" id="buscar"><label class="search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
                  '<input type="search" id="q" placeholder="Buscar noticia, persona o tema…" aria-label="Buscar" autocomplete="off"></label>'
                  '<div class="chips" role="group" aria-label="Categorías"><button class="chip is-on" data-cat="">Todas</button>%s</div></div>' % "".join(
                      '<button class="chip" data-cat="%s">%s</button>' % (esc(slug_cat(x)), esc(x)) for x in categorias)]

        wa = "https://wa.me/528117804869?text=" + urllib.parse.quote("Hola, tengo una noticia para %s: " % c["nombre"])
        cta = ('<section class="sp-cta">%s<div class="grano"></div><div><span class="etiqueta">¿Tienes una noticia?</span>'
               '<h2 class="h2">Si está pasando en %s y <span class="metal">merece contarse,</span> escríbenos.</h2>'
               '<p class="lead">Un logro, un evento, un proyecto que está cambiando tu colonia o una persona que vale la pena conocer.</p></div>'
               '<div class="botones"><a class="btn plata" href="%s" target="_blank" rel="noopener">Escríbenos por WhatsApp %s</a>'
               '<a class="btn vidrio" href="/sparks/sumate/">Súmate al equipo</a></div></section>') % (
                   partes.v_metal("art", "gct"), ciudad_corta, esc(wa), partes.FLECHA)
        if not ns:
            partes_html.append('<p class="empty">Muy pronto, las primeras historias.</p>' + cta + '</div>')
            return self.pagina(c["nombre"], c["descripcion"], self.abs + "/", self.og_de(None), "".join(partes_html))

        lead = ('<article class="principal"><a href="%s"><div class="lead-img">%s</div>%s<h2 class="lead-title">%s</h2>'
                '<p class="lead-sum">%s</p>%s</a></article>') % (
            self.url(destacada), self.media(destacada, "(min-width:900px) 66vw, 100vw", eager=True),
            self.kicker(destacada), esc(destacada["titulo"]), esc(destacada["resumen"]), self.meta_linea(destacada))
        side = "".join(('<article class="side"><a href="%s"><div class="side-img">%s</div>%s<h3 class="side-title">%s</h3>%s</a></article>') % (
            self.url(n), self.media(n, "(min-width:900px) 30vw, 100vw"), self.kicker(n), esc(n["titulo"]), self.meta_linea(n))
            for n in secundarias)
        partes_html.append('<section class="front" id="front">%s<div class="front-side">%s</div></section>' % (lead, side))
        partes_html.append(self.anuncio("slotFeed"))

        tarjetas = []
        for i, n in enumerate(lista[:por_pagina]):
            tarjetas.append(self.tarjeta(n))
        partes_html.append('<div class="sec-head"><span class="etiqueta">Archivo</span><h2 class="h3" id="grid-title">Lo más reciente</h2></div>'
                      '<div class="grid" id="grid" data-por-pagina="%d">%s</div>'
                      '<p class="empty" id="vacio" hidden>No encontramos noticias con esa búsqueda.</p>'
                      '<div class="more"><button class="btn blanco" id="mas"%s>Cargar más noticias</button></div>%s</div>' % (
                          por_pagina, "".join(tarjetas), "" if len(lista) > por_pagina else " hidden", cta))

        jsonld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": c["nombre"],
                  "description": c["descripcion"], "url": self.abs + "/", "inLanguage": "es-MX",
                  "publisher": {"@type": "Organization", "name": "Vorka México", "url": c["sitio"]}}
        extra = '<link rel="preload" as="fetch" href="%s/noticias.json?v=%s" crossorigin>' % (self.base, self.version)
        return self.pagina("%s — %s" % (c["nombre"], c["lema"]), c["descripcion"], self.abs + "/",
                           self.og_de(destacada), "".join(partes_html), jsonld=jsonld, extra_head=extra)

    # ---- artículo

    def articulo(self, n):
        c = self.cfg
        url_abs = self.abs + "/" + n["slug"] + "/"
        bloques = texto_a_bloques(n["texto"])
        anuncio = self.anuncio("slotArticulo")
        if anuncio and len(bloques) > 3:
            bloques.insert(2, anuncio)
            anuncio = ""
        minutos = max(1, round(palabras(n["texto"]) / 200))

        meta = []
        if n["persona"]:
            meta.append('<span class="who-chip">%s</span>' % esc(n["persona"]))
        if n["autor"]:
            meta.append("<span>Por %s</span>" % esc(n["autor"]))
        meta.append("<span>%d min de lectura</span>" % minutos)

        portada = ""
        if n["fotos"]:
            portada = '<figure class="art-cover"><a href="%s" data-lb="0">%s</a>%s</figure>' % (
                self.foto(n["fotos"][0], "1600.webp"),
                self.img_tag(n["fotos"][0], n["persona"] or n["titulo"], "(min-width:1100px) 1100px, 100vw", eager=True),
                '<figcaption>%s</figcaption>' % esc(n["pie"]) if n["pie"] else "")

        video = ""
        vid = youtube_id(n["video"])
        if vid:
            video = ('<div class="video"><button class="yt" data-yt="%s" aria-label="Reproducir video">'
                     '<img src="https://i.ytimg.com/vi/%s/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">'
                     '<span class="yt-play" aria-hidden="true"></span></button></div>') % (vid, vid)
        elif n["video"].startswith("http"):
            video = '<p><a class="btn blanco" href="%s" target="_blank" rel="noopener">Ver video ↗</a></p>' % esc(n["video"])

        galeria = ""
        if len(n["fotos"]) > 1:
            galeria = '<section class="gallery" aria-label="Galería de fotos"><h2>Galería</h2><div class="gal-grid">%s</div></section>' % "".join(
                '<a href="%s" data-lb="%d">%s</a>' % (
                    self.foto(f, "1600.webp"), i, self.img_tag(f, "%s — foto %d" % (n["titulo"], i + 1), "(min-width:720px) 240px, 50vw"))
                for i, f in enumerate(n["fotos"]) if i > 0)

        etiquetas = ""
        if n["etiquetas"]:
            etiquetas = '<ul class="tags">%s</ul>' % "".join(
                '<li><a href="%s/?q=%s">#%s</a></li>' % (self.base, urllib.parse.quote(t), esc(t)) for t in n["etiquetas"])

        compartir = ('<div class="share" data-share data-title="%s" data-url="%s"><span>Compartir</span>'
                     '<a class="sh sh-wa" href="https://wa.me/?text=%s" target="_blank" rel="noopener">WhatsApp</a>'
                     '<a class="sh" href="https://www.facebook.com/sharer/sharer.php?u=%s" target="_blank" rel="noopener">Facebook</a>'
                     '<a class="sh" href="https://x.com/intent/post?url=%s&amp;text=%s" target="_blank" rel="noopener">X</a>'
                     '<button class="sh" data-copy>Copiar link</button></div>') % (
            esc(n["titulo"]), esc(url_abs), urllib.parse.quote(n["titulo"] + " " + url_abs),
            urllib.parse.quote(url_abs), urllib.parse.quote(url_abs), urllib.parse.quote(n["titulo"]))

        relacionadas = [x for x in self.noticias if x is not n and x["categoria"] == n["categoria"]][:3]
        relacionadas += [x for x in self.noticias if x is not n and x not in relacionadas][:3 - len(relacionadas)]
        rel = ""
        if relacionadas:
            rel = '<section class="related"><div class="sec-head"><span class="etiqueta">Revista Sparks</span><h2 class="h3">Sigue leyendo</h2></div><div class="grid">%s</div></section>' % "".join(
                self.tarjeta(x) for x in relacionadas)

        wa = "https://wa.me/528117804869?text=" + urllib.parse.quote("Hola, tengo una historia para %s: " % c["nombre"])
        cierre = ('<section class="sp-cta chica">%s<div class="grano"></div><div><span class="etiqueta">Revista Sparks</span>'
                  '<h2 class="h3">¿Conoces una historia así? <span class="metal">Cuéntanosla.</span></h2></div>'
                  '<div class="botones"><a class="btn plata" href="%s" target="_blank" rel="noopener">Escríbenos %s</a><a class="btn vidrio" href="%s/">Más historias</a></div></section>') % (
                      partes.v_metal("art", "gca"), esc(wa), partes.FLECHA, self.base)
        cuerpo = """<div class="marco">
<article class="art">
<nav class="migas" aria-label="Ruta"><a href="/sparks/">Revista Sparks</a><span aria-hidden="true">/</span><a href="{base}/">{nombre}</a><span aria-hidden="true">/</span><a href="{base}/?categoria={cs}">{cat}</a></nav>
<header class="art-head">{kicker}<h1 class="art-title">{titulo}</h1><p class="art-deck">{resumen}</p><div class="art-meta">{meta}</div></header>
{portada}
<div class="art-body">{texto}{anuncio}{video}{galeria}{etiquetas}{compartir}{boletin}</div>
</article>
{rel}
{cierre}
</div>""".format(cierre=cierre, base=self.base, nombre=esc(c["nombre"]), cs=esc(slug_cat(n["categoria"])), cat=esc(n["categoria"]),
                 kicker=self.kicker(n), titulo=esc(n["titulo"]), resumen=esc(n["resumen"]),
                 meta='<span class="dot" aria-hidden="true">·</span>'.join(meta), portada=portada,
                 texto="\n".join(bloques), anuncio=anuncio, video=video, galeria=galeria, etiquetas=etiquetas,
                 compartir=compartir, rel=rel, boletin=self.caja_boletin())

        autor = {"@type": "Person", "name": n["autor"]} if n["autor"] else {"@type": "Organization", "name": "Vorka México"}
        jsonld = [{
            "@context": "https://schema.org", "@type": "NewsArticle", "headline": n["titulo"][:110],
            "description": n["resumen"], "image": [self.og_de(n)], "datePublished": n["_d"].strftime("%Y-%m-%d"),
            "dateModified": n["_d"].strftime("%Y-%m-%d"), "author": autor, "inLanguage": "es-MX",
            "mainEntityOfPage": url_abs, "articleSection": n["categoria"], "keywords": ", ".join(n["etiquetas"]),
            "about": [{"@type": "Person", "name": n["persona"]}] if n["persona"] else [],
            "contentLocation": {"@type": "Place", "name": c["ciudad"]},
            "publisher": {"@type": "Organization", "name": "Vorka México", "url": c["sitio"],
                          "logo": {"@type": "ImageObject", "url": self.abs + "/assets/logo.png"}}},
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": c["nombre"], "item": self.abs + "/"},
                {"@type": "ListItem", "position": 2, "name": n["titulo"], "item": url_abs}]}]
        extra = '<meta property="article:published_time" content="%s">' % n["_d"].strftime("%Y-%m-%d")
        titulo_pag = "%s | %s" % (n["titulo"], c["nombre"])
        return self.pagina(titulo_pag, n["resumen"] or n["titulo"], url_abs, self.og_de(n), cuerpo,
                           tipo="article", jsonld=jsonld, extra_head=extra)

    # ---- índices

    def indice_json(self):
        out = []
        for n in self.noticias:
            item = {"s": n["slug"], "t": n["titulo"], "p": n["persona"], "c": n["categoria"], "k": slug_cat(n["categoria"]),
                    "o": tono(n["categoria"]), "d": n["_d"].strftime("%Y-%m-%d"), "f": fecha_corta(n["_d"]),
                    "r": n["resumen"], "g": " ".join(n["etiquetas"])}
            if n["slug"] in self.en_portada:
                item["x"] = 1
            if n["fotos"]:
                nombre = id_archivo(n["fotos"][0])
                item["i"], (item["w"], item["h"]) = nombre, self.manifest[nombre][:2]
            out.append(item)
        return json.dumps({"img": self.almacen.url_base, "n": out}, ensure_ascii=False, separators=(",", ":"))

    def sitemap(self):
        urls = ['<url><loc>%s/</loc>%s<changefreq>hourly</changefreq></url>' % (
            self.abs, "<lastmod>%s</lastmod>" % self.noticias[0]["_d"].strftime("%Y-%m-%d") if self.noticias else "")]
        for n in self.noticias:
            img = '<image:image><image:loc>%s</image:loc></image:image>' % esc(self.og_de(n)) if n["fotos"] else ""
            urls.append('<url><loc>%s/%s/</loc><lastmod>%s</lastmod>%s</url>' % (self.abs, n["slug"], n["_d"].strftime("%Y-%m-%d"), img))
        return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n%s\n</urlset>\n') % "\n".join(urls)

    def rss(self):
        items = []
        for n in self.noticias[:40]:
            items.append("<item><title>%s</title><link>%s/%s/</link><guid>%s/%s/</guid><pubDate>%s</pubDate><category>%s</category><description>%s</description>%s</item>" % (
                esc(n["titulo"]), self.abs, n["slug"], self.abs, n["slug"],
                n["_d"].replace(hour=12, tzinfo=timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000"),
                esc(n["categoria"]), esc(n["resumen"]),
                '<enclosure url="%s" type="image/jpeg" length="0"/>' % esc(self.og_de(n)) if n["fotos"] else ""))
        c = self.cfg
        return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>%s</title><link>%s/</link>'
                '<description>%s</description><language>es-mx</language>%s</channel></rss>\n') % (
            esc(c["nombre"]), self.abs, esc(c["descripcion"]), "".join(items))


# ---------------------------------------------------------------- principal

def escribir(ruta, contenido):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--datos", help="JSON local con {noticias:[...]} (para pruebas)")
    ap.add_argument("--salida", default=RAIZ_REPO, help="raíz del sitio (por defecto, el repositorio)")
    ap.add_argument("--forzar", action="store_true")
    args = ap.parse_args()
    if args.datos:
        args.datos = os.path.abspath(args.datos)

    with open(os.path.join(AQUI, "config.json"), encoding="utf-8") as f:
        cfg = json.load(f)
    destino = os.path.join(args.salida, cfg["ruta"].strip("/"))
    dir_img = os.path.join(destino, "img")

    # Primero las historias de Vorka México para que conserven el enlace que se eligió en la app
    # El archivo va al final: si un enlace se repite, gana la noticia viva (la del archivo recibe -2).
    del_os = cargar_historias_os(cfg) if not args.datos else []
    # Lo que vive en Vorka México (os.vorka.mx) manda: si la Hoja o el archivo traen la misma nota, se usa la de la app
    vistos = {slug_cat(n.get("titulo", "")) for n in del_os} | {n.get("slug") for n in del_os}
    otras = cargar_noticias(args) + (cargar_archivo(cfg) if not args.datos else [])
    noticias = del_os + [n for n in otras if slug_cat(n.get("titulo", "")) not in vistos and n.get("slug") not in vistos]
    almacen = Almacen(cfg, dir_img, cfg["ruta"].rstrip("/"))

    # Huella de todo lo que afecta al resultado: si no cambió nada, no se toca el repo.
    h = hashlib.sha256(json.dumps(noticias, sort_keys=True, ensure_ascii=False).encode() + almacen.url_base.encode())
    for extra in (os.path.join(RAIZ_REPO, "_sitio", "partes.py"), os.path.join(RAIZ_REPO, "assets", "v3", "vorka.css")):
        with open(extra, "rb") as f:
            h.update(f.read())
    for raiz, _, archivos in os.walk(AQUI):
        if "google-apps-script" in raiz:
            continue
        for a in sorted(archivos):
            with open(os.path.join(raiz, a), "rb") as f:
                h.update(f.read())
    huella = h.hexdigest()
    archivo_huella = os.path.join(destino, ".huella")
    if not args.forzar and os.path.exists(archivo_huella) and open(archivo_huella).read().strip() == huella:
        print("Sin cambios. Nada que publicar.")
        return

    usados = set()
    for n in noticias:
        # Seguridad: el slug se vuelve carpeta. Solo a-z 0-9 . _ - y sin repetirse.
        base = re.sub(r"[^a-z0-9._-]+", "-", (n.get("slug") or "").lower()).strip("._-")[:60] or "noticia"
        if base in ("assets", "img"):
            base += "-1"
        slug, k = base, 2
        while slug in usados:
            slug, k = "%s-%d" % (base, k), k + 1
        usados.add(slug)
        n["slug"] = slug
        n["_d"] = leer_fecha(n.get("fecha") or n.get("creada"))
        n["_c"] = leer_fecha(n.get("creada"))
        n.setdefault("fotos", [])
        n.setdefault("etiquetas", [])
        for k in ("persona", "resumen", "texto", "pie", "video", "autor"):
            n[k] = (n.get(k) or "").strip()
        n.setdefault("categoria", "Noticias")
        n.setdefault("destacada", False)
    noticias.sort(key=lambda n: (n["_d"], n["_c"]), reverse=True)

    manifest_path = os.path.join(destino, "fotos.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    print("Procesando %d noticias…" % len(noticias))
    procesar_fotos(args, noticias, almacen, manifest)
    escribir(manifest_path, json.dumps(manifest, sort_keys=True, indent=0))

    sitio = Sitio(cfg, noticias, manifest, almacen)
    sitio.version = huella[:8]

    # Limpia páginas viejas (noticias borradas u ocultas) y reescribe todo.
    for nombre in os.listdir(destino) if os.path.isdir(destino) else []:
        p = os.path.join(destino, nombre)
        if os.path.isdir(p) and nombre not in ("img", "assets"):
            shutil.rmtree(p)
    shutil.copytree(os.path.join(AQUI, "assets"), os.path.join(destino, "assets"), dirs_exist_ok=True)

    escribir(os.path.join(destino, "index.html"), sitio.portada())
    for n in noticias:
        escribir(os.path.join(destino, n["slug"], "index.html"), sitio.articulo(n))
    escribir(os.path.join(destino, "noticias.json"), sitio.indice_json())
    escribir(os.path.join(destino, "sitemap.xml"), sitio.sitemap())
    escribir(os.path.join(destino, "feed.xml"), sitio.rss())

    robots = os.path.join(args.salida, "robots.txt")
    linea = "Sitemap: %s/sitemap.xml" % sitio.abs
    actual = open(robots, encoding="utf-8").read() if os.path.exists(robots) else "User-agent: *\nAllow: /\n"
    if linea not in actual:
        escribir(robots, actual.rstrip("\n") + ("\n" if "Sitemap:" in actual else "\n\n") + linea + "\n")
    if sitio.ads_cliente:
        pub = sitio.ads_cliente.replace("ca-", "")
        escribir(os.path.join(args.salida, "ads.txt"), "google.com, %s, DIRECT, f08c47fec0942fa0\n" % pub)

    escribir(archivo_huella, huella)
    print("✅ Listo: %d noticias en %s" % (len(noticias), destino))


def diagnostico(e):
    """Explica el error en español. En GitHub sale como anotación visible en el resumen del Action."""
    nombre = type(e).__name__
    if isinstance(e, urllib.error.HTTPError):
        return "Apps Script respondió HTTP %s. Revisa SPARKS_API_URL (debe terminar en /exec)." % e.code
    if isinstance(e, urllib.error.URLError):
        return "No se pudo conectar con Apps Script (%s)." % e.reason
    if isinstance(e, json.JSONDecodeError):
        return ("Apps Script no devolvió datos. Revisa que la implementación sea 'Aplicación web' con acceso "
                "'Cualquier persona' y que SPARKS_API_URL termine en /exec.")
    if nombre in ("ClientError", "NoCredentialsError", "EndpointConnectionError", "PartialCredentialsError"):
        return "Cloudflare R2: %s. Revisa R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y el bucket en config.json." % e
    return "%s: %s" % (nombre, e)


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if isinstance(e.code, str):
            print("::error title=Sparks Celaya::%s" % e.code)
        raise
    except Exception as e:
        print("::error title=Sparks Celaya::%s" % diagnostico(e))
        raise
