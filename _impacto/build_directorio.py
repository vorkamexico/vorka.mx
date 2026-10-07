#!/usr/bin/env python3
"""Actualiza el Directorio Nacional de IMPACTO (impacto/estructura) desde el Sheet.

Lee la lista de líderes activos de la API del Apps Script (_impacto/google-apps-script),
reescribe el bloque `const DATA = [...]` de impacto/estructura/index.html y baja las fotos
nuevas a impacto/estructura/fotos/<slug>.webp. No toca nada más de la página.

Uso:
  IMPACTO_API_URL=... IMPACTO_TOKEN=... python3 _impacto/build_directorio.py
  python3 _impacto/build_directorio.py --datos prueba.json      # sin API, para probar
"""
import argparse
import base64
import io
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINA = os.path.join(RAIZ, "impacto", "estructura", "index.html")
FOTOS = os.path.join(RAIZ, "impacto", "estructura", "fotos")
MANIFEST = os.path.join(RAIZ, "_impacto", "fotos.json")

CARGOS = {"presidente", "vicepresidente", "vicepresidente regional", "consejero", "director", "secretaría", "representante"}
ESTRUCTURAS = {"nacional", "estatal", "distrital", "municipal"}
BLOQUE = re.compile(r"(  const DATA = \[\n)(.*?)(\n  \];)", re.S)
FILA = re.compile(r'nombre:"([^"]*)"')

# Si la lista nueva trae menos del 80 % de las personas actuales, algo salió mal (hoja vacía,
# filtro puesto, etc.): no se publica. Para una limpieza grande a propósito: IMPACTO_FORZAR=1.
MINIMO = 0.8


def slug(nombre):
    s = unicodedata.normalize("NFD", nombre or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s)


def api(params):
    base, token = os.environ["IMPACTO_API_URL"], os.environ["IMPACTO_TOKEN"]
    url = base + ("&" if "?" in base else "?") + urllib.parse.urlencode(dict(params, token=token))
    req = urllib.request.Request(url, headers={"User-Agent": "impacto-directorio"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    if isinstance(data, dict) and data.get("error"):
        raise SystemExit("La API respondió: %s" % data["error"])
    return data


def cargar(args):
    if args.datos:
        with open(args.datos, encoding="utf-8") as f:
            return json.load(f)["lideres"]
    if not os.environ.get("IMPACTO_API_URL") or not os.environ.get("IMPACTO_TOKEN"):
        print("⏸  Aún no hay IMPACTO_API_URL / IMPACTO_TOKEN en los secrets de GitHub. Nada que actualizar.")
        sys.exit(0)
    return api({"api": "directorio"})["lideres"]


def limpiar(lideres):
    buenos, malos = [], []
    for l in lideres:
        d = {k: str(l.get(k) or "").strip() for k in ("cargo", "estructura", "resultado", "nombre", "estado", "foto")}
        d["cargo"], d["estructura"] = d["cargo"].lower(), d["estructura"].lower()
        if d["cargo"] == "secretaria":
            d["cargo"] = "secretaría"
        if d["nombre"] and d["estado"] and d["cargo"] in CARGOS and d["estructura"] in ESTRUCTURAS:
            buenos.append(d)
        else:
            malos.append(d)
    for m in malos:
        print("  ⚠️  omitido (cargo o estructura no reconocidos): %s · %s %s" % (m["nombre"] or "(sin nombre)", m["cargo"], m["estructura"]))
    return buenos


def js(v):
    return json.dumps(v, ensure_ascii=False)


def reescribir_pagina(lideres):
    with open(PAGINA, encoding="utf-8") as f:
        html = f.read()
    m = BLOQUE.search(html)
    if not m:
        raise SystemExit("No encontré el bloque `const DATA = [` en %s. ¿Cambió la página?" % PAGINA)

    antes = FILA.findall(m.group(2))
    despues = [l["nombre"] for l in lideres]
    if len(despues) < MINIMO * len(antes) and os.environ.get("IMPACTO_FORZAR") != "1":
        raise SystemExit("La lista nueva tiene %d personas y la publicada %d. No publico por seguridad "
                         "(revisa el Sheet o corre con IMPACTO_FORZAR=1)." % (len(despues), len(antes)))

    filas = "\n".join(
        "    {cargo:%s,estructura:%s,resultado:%s,nombre:%s,estado:%s}," %
        (js(l["cargo"]), js(l["estructura"]), js(l["resultado"]), js(l["nombre"]), js(l["estado"]))
        for l in lideres)
    nuevo = html[:m.start(2)] + filas + html[m.end(2):]

    a, d = {slug(n) for n in antes}, {slug(n) for n in despues}
    for n in sorted(d - a):
        print("  ➕ %s" % n)
    for n in sorted(a - d):
        print("  ➖ %s" % n)
    if nuevo != html:
        with open(PAGINA, "w", encoding="utf-8") as f:
            f.write(nuevo)
        print("Directorio: %d personas." % len(lideres))
    else:
        print("Directorio sin cambios (%d personas)." % len(lideres))


def bajar_foto(args, foto_id):
    if args.datos:
        return None
    data = api({"img": foto_id})
    return base64.b64decode(data["data"]) if data.get("data") else None


def fotos(args, lideres):
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("  (sin Pillow: no se procesan fotos)")
        return
    manifest = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            manifest = json.load(f)
    os.makedirs(FOTOS, exist_ok=True)
    cambio = False
    for l in lideres:
        fid, s = l.get("foto"), slug(l["nombre"])
        if not fid or not s or manifest.get(s) == fid:
            continue
        try:
            datos = bajar_foto(args, fid)
            if not datos:
                continue
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(datos))).convert("RGB")
            im = ImageOps.fit(im, (400, 400), Image.LANCZOS, centering=(0.5, 0.35))  # recorte cuadrado, prioriza la cara
            im.save(os.path.join(FOTOS, s + ".webp"), "WEBP", quality=82, method=6)
            manifest[s] = fid
            cambio = True
            print("  📷 %s" % s)
        except Exception as e:  # una foto rota no detiene el directorio
            print("  ⚠️  foto de %s omitida (%s)" % (l["nombre"], e))
    if cambio:
        with open(MANIFEST, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=1, sort_keys=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--datos", help="JSON local con {lideres:[...]} en lugar de la API")
    args = p.parse_args()
    lideres = limpiar(cargar(args))
    reescribir_pagina(lideres)
    fotos(args, lideres)


if __name__ == "__main__":
    main()
