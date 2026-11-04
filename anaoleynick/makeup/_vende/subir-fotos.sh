#!/usr/bin/env bash
# Sube las 8 fotos de producto de Ana Laura · Makeup al R2 de Vende (bucket vende-archivos, binding ARCHIVOS).
# Las claves son las mismas que pone ana-laura-makeup.sql en productos.foto y producto_fotos.clave
# (formato de Vende: productos/<vendedora>/<producto>-<versión>.<ext>, ver src/api/tienda.js).
#
# Uso (desde la carpeta del repo vende, donde está wrangler.jsonc y la sesión de Cloudflare):
#   bash <ruta>/anaoleynick/makeup/_vende/subir-fotos.sh           # sube
#   bash <ruta>/anaoleynick/makeup/_vende/subir-fotos.sh --probar  # solo muestra qué subiría
# Es idempotente: volver a correrlo reemplaza los mismos objetos. Correr ANTES del SQL.
set -euo pipefail

IMG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../img" && pwd)"
BUCKET="vende-archivos"
V="88b11614-16ea-4bd8-b8bd-d882d1ddadd5"
PROBAR="${1:-}"

FOTOS=(
  "base-liquida-frente.webp ad42ff9c-8a27-444b-b634-6262c8b4261d-al1.webp"
  "base-crema.webp 1d3c8a4d-4335-4f43-b382-75c9f5232efb-al1.webp"
  "corrector-frente.webp 46bb533d-d272-4604-99d0-420ee3ee224a-al1.webp"
  "corrector-reverso.webp 46bb533d-d272-4604-99d0-420ee3ee224a-al2.webp"
  "polvo.webp 721fb0c2-8d99-4758-aca6-143ae075667d-al1.webp"
  "desmaquillante.webp 1f662b45-a4bc-4291-839d-b3f5014cf6fa-al1.webp"
  "shampoo.webp eba363c6-24b4-408e-aba3-3509b3c7ff0b-al1.webp"
)

for par in "${FOTOS[@]}"; do
  read -r archivo nombre <<<"$par"
  origen="$IMG/$archivo"
  destino="$BUCKET/productos/$V/$nombre"
  [ -f "$origen" ] || { echo "Falta $origen" >&2; exit 1; }
  if [ "$PROBAR" = "--probar" ]; then
    echo "subiría $origen -> $destino"
  else
    echo "Subiendo $archivo"
    npx wrangler r2 object put "$destino" --file "$origen" --content-type image/webp --remote
  fi
done
echo "Listo. Ahora aplica ana-laura-makeup.sql."
