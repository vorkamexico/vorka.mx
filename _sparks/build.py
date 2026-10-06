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
        print("⏸  Aún no hay SPARKS_API_URL / SPARKS_TOKEN en los secrets de GitHub. Nada que publicar todavía.")
        sys.exit(0)
    data = http_json(api + ("&" if "?" in api else "?") + urllib.parse.urlencode({"token": token}))
    if "error" in data:
        sys.exit("Apps Script respondió: %s" % data["error"])
    return data["noticias"]


def bajar_foto(args, foto_id):
    """Devuelve los bytes de la foto (ya reducida por Google a máx. 1600 px)."""
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
        partes.append('<time datetime="%s">%s</time>' % (n["_d"].strftime("%Y-%m-%d"), fecha_corta(n["_d"])))
        return '<div class="meta">%s</div>' % '<span class="dot" aria-hidden="true">·</span>'.join(partes)

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
        c = self.cfg
        ads = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>'
               % esc(self.ads_cliente)) if self.ads_cliente else ""
        ld = '<script type="application/ld+json">%s</script>' % json.dumps(jsonld, ensure_ascii=False).replace("</", "<\\/") if jsonld else ""
        return """<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="max-image-preview:large">
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
<link rel="icon" type="image/png" href="{base}/assets/favicon.png">
<link rel="apple-touch-icon" href="{base}/assets/favicon.png">
<link rel="alternate" type="application/rss+xml" title="{nombre}" href="{base}/feed.xml">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F0F0E" media="(prefers-color-scheme: dark)">
<link rel="stylesheet" href="{base}/assets/sparks.css?v={v}">
{extra}{ads}{ld}
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="topbar"><div class="shell topbar-inner">
<a href="/" class="brand" aria-label="Vorka México — inicio"><img class="brand-logo" src="{base}/assets/logo.png" alt="" width="30" height="29"><span class="brand-name">Vorka <span>México</span></span></a>
<nav class="nav" aria-label="Sparks">
<a href="{base}/">Portada</a>
<a class="hide-sm" href="{ig}" target="_blank" rel="noopener">Instagram</a>
<a class="nav-search" href="{base}/#buscar" aria-label="Buscar noticias"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></a>
</nav></div></header>
<main id="contenido">
{cuerpo}
</main>
<footer class="foot"><div class="shell">
<div class="foot-cols">
<div class="foot-col foot-brand">
<h5>{nombre}</h5>
<p class="desc">{lema}. Un medio de <b>Vorka Sparks</b> hecho en {ciudad}.</p>
<img class="foot-mark" src="{base}/assets/logo.png" alt="Vorka" width="56" height="55" loading="lazy">
</div>
<div class="foot-col"><h5>Secciones</h5><ul>
<li><a href="{base}/">Portada</a></li>
{secciones}
<li><a href="{base}/#buscar">Buscar noticias</a></li>
</ul></div>
<div class="foot-col"><h5>Vorka</h5><ul>
<li><a href="/">Vorka México</a></li>
<li><a href="/#sparks">Vorka Sparks</a></li>
<li><a href="/voluntariado">Tú en Vorka</a></li>
<li><a href="/servicios/estrategia">Servicios</a></li>
<li><a href="/#contact">Hablemos</a></li>
</ul></div>
<div class="foot-col"><h5>Contacto</h5><ul>
<li><a href="https://wa.me/528117804869?text={wa_historia}" target="_blank" rel="noopener">Comparte una historia</a></li>
<li><a href="mailto:vorkamexico@gmail.com">vorkamexico@gmail.com</a></li>
<li><a href="https://wa.me/528117804869" target="_blank" rel="noopener">+52 81 1780 4869</a></li>
<li><a href="{base}/feed.xml">RSS</a></li>
</ul></div>
</div>
<div class="foot-tagline">
<div class="left">Historias reales de la gente que está moviendo {ciudad_corta}. Si conoces una, cuéntanosla.</div>
<div class="right">definiendo el juego</div>
</div>
<div class="foot-bottom">
<div class="foot-social">
<a href="https://www.instagram.com/vorka.mx/" target="_blank" rel="noopener" aria-label="Instagram — @vorka.mx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
<a href="https://www.tiktok.com/@vorka.mx" target="_blank" rel="noopener" aria-label="TikTok — @vorka.mx"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3.5h-2.7v12.1a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.77.12V10.4a5.4 5.4 0 1 0 4.53 5.32V8.62a6.6 6.6 0 0 0 3.9 1.26V7.2a3.9 3.9 0 0 1-3.9-3.7Z"/></svg></a>
<a href="https://www.facebook.com/vorka.mx" target="_blank" rel="noopener" aria-label="Facebook — vorka.mx"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21.95v-8.05h2.7l.4-3.13H13.5V8.78c0-.9.25-1.52 1.55-1.52h1.66V4.46a22 22 0 0 0-2.42-.13c-2.4 0-4.04 1.46-4.04 4.15v2.32H7.55v3.13h2.7v8.02h3.25Z"/></svg></a>
</div>
<div class="foot-name">{nombre}<small>vorka.mx{base}</small></div>
<div class="foot-copy">© {anio} Vorka México.<br>Todos los derechos reservados.</div>
</div></div></footer>
<dialog class="lb" id="lb" aria-label="Galería"><button class="lb-x" data-lb-close aria-label="Cerrar">×</button><button class="lb-nav lb-prev" data-lb-prev aria-label="Anterior">‹</button><img alt=""><button class="lb-nav lb-next" data-lb-next aria-label="Siguiente">›</button><p class="lb-cap"></p></dialog>
<script src="{base}/assets/sparks.js?v={v}" defer></script>
</body>
</html>
""".format(titulo=esc(titulo), desc=esc(descripcion), canon=esc(canonical), og=esc(og_img), tipo=tipo,
           nombre=esc(c["nombre"]), lema=esc(c["lema"]), base=self.base, ig=esc(c["instagram"]),
           ciudad=esc(c["ciudad"]), ciudad_corta=esc(c["ciudad"].split(",")[0]), anio=datetime.now().year,
           secciones=self.secciones_footer(), wa_historia=urllib.parse.quote("Hola, tengo una historia para %s: " % c["nombre"]), cuerpo=cuerpo, extra=extra_head,
           ads=ads, ld=ld, v=self.version)

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

        partes = ['<div class="shell">',
                  '<section class="mast"><div class="mast-top"><span class="eyebrow">Vorka Sparks</span>'
                  '<span class="mast-date" data-hoy></span></div>'
                  '<h1 class="mast-title">%s</h1><p class="mast-lema">%s</p></section>' % (
                      esc(c["nombre"]).replace(" ", " <em>", 1) + "</em>" if " " in c["nombre"] else esc(c["nombre"]),
                      esc(c["lema"])),
                  '<div class="tools" id="buscar"><label class="search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
                  '<input type="search" id="q" placeholder="Buscar noticia, persona o tema…" aria-label="Buscar" autocomplete="off"></label>'
                  '<div class="chips" role="group" aria-label="Categorías"><button class="chip is-on" data-cat="">Todas</button>%s</div></div>' % "".join(
                      '<button class="chip" data-cat="%s">%s</button>' % (esc(slug_cat(x)), esc(x)) for x in categorias)]

        if not ns:
            partes.append('<p class="empty">Muy pronto, las primeras noticias.</p></div>')
            return self.pagina(c["nombre"], c["descripcion"], self.abs + "/", self.og_de(None), "".join(partes))

        lead = ('<article class="lead"><a href="%s"><div class="lead-img">%s</div>%s<h2 class="lead-title">%s</h2>'
                '<p class="lead-sum">%s</p>%s</a></article>') % (
            self.url(destacada), self.media(destacada, "(min-width:900px) 66vw, 100vw", eager=True),
            self.kicker(destacada), esc(destacada["titulo"]), esc(destacada["resumen"]), self.meta_linea(destacada))
        side = "".join(('<article class="side"><a href="%s"><div class="side-img">%s</div>%s<h3 class="side-title">%s</h3>%s</a></article>') % (
            self.url(n), self.media(n, "(min-width:900px) 30vw, 100vw"), self.kicker(n), esc(n["titulo"]), self.meta_linea(n))
            for n in secundarias)
        partes.append('<section class="front" id="front">%s<div class="front-side">%s</div></section>' % (lead, side))
        partes.append(self.anuncio("slotFeed"))

        tarjetas = []
        for i, n in enumerate(lista[:por_pagina]):
            tarjetas.append(self.tarjeta(n))
        partes.append('<div class="sec-head"><h2 id="grid-title">Lo más reciente</h2></div>'
                      '<div class="grid" id="grid" data-por-pagina="%d">%s</div>'
                      '<p class="empty" id="vacio" hidden>No encontramos noticias con esa búsqueda.</p>'
                      '<div class="more"><button class="btn" id="mas"%s>Cargar más noticias</button></div></div>' % (
                          por_pagina, "".join(tarjetas), "" if len(lista) > por_pagina else " hidden"))

        jsonld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": c["nombre"],
                  "description": c["descripcion"], "url": self.abs + "/", "inLanguage": "es-MX",
                  "publisher": {"@type": "Organization", "name": "Vorka México", "url": c["sitio"]}}
        extra = '<link rel="preload" as="fetch" href="%s/noticias.json?v=%s" crossorigin>' % (self.base, self.version)
        return self.pagina("%s — %s" % (c["nombre"], c["lema"]), c["descripcion"], self.abs + "/",
                           self.og_de(destacada), "".join(partes), jsonld=jsonld, extra_head=extra)

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
        meta.append('<time datetime="%s">%s</time>' % (n["_d"].strftime("%Y-%m-%d"), fecha_larga(n["_d"])))
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
            video = '<p><a class="btn" href="%s" target="_blank" rel="noopener">Ver video ↗</a></p>' % esc(n["video"])

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
            rel = '<section class="related"><div class="sec-head"><h2>Sigue leyendo</h2></div><div class="grid">%s</div></section>' % "".join(
                self.tarjeta(x) for x in relacionadas)

        cuerpo = """<div class="shell">
<article class="art">
<nav class="crumbs" aria-label="Ruta"><a href="{base}/">{nombre}</a><span aria-hidden="true">/</span><a href="{base}/?categoria={cs}">{cat}</a></nav>
<header class="art-head">{kicker}<h1 class="art-title">{titulo}</h1><p class="art-deck">{resumen}</p><div class="art-meta">{meta}</div></header>
{portada}
<div class="art-body">{texto}{anuncio}{video}{galeria}{etiquetas}{compartir}</div>
</article>
{rel}
</div>""".format(base=self.base, nombre=esc(c["nombre"]), cs=esc(slug_cat(n["categoria"])), cat=esc(n["categoria"]),
                 kicker=self.kicker(n), titulo=esc(n["titulo"]), resumen=esc(n["resumen"]),
                 meta='<span class="dot" aria-hidden="true">·</span>'.join(meta), portada=portada,
                 texto="\n".join(bloques), anuncio=anuncio, video=video, galeria=galeria, etiquetas=etiquetas,
                 compartir=compartir, rel=rel)

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

    noticias = cargar_noticias(args)
    almacen = Almacen(cfg, dir_img, cfg["ruta"].rstrip("/"))

    # Huella de todo lo que afecta al resultado: si no cambió nada, no se toca el repo.
    h = hashlib.sha256(json.dumps(noticias, sort_keys=True, ensure_ascii=False).encode() + almacen.url_base.encode())
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

    for n in noticias:
        n["_d"] = leer_fecha(n.get("fecha") or n.get("creada"))
        n["_c"] = leer_fecha(n.get("creada"))
        n.setdefault("fotos", [])
        n.setdefault("etiquetas", [])
        for k in ("persona", "resumen", "texto", "pie", "video", "autor"):
            n[k] = (n.get(k) or "").strip()
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
