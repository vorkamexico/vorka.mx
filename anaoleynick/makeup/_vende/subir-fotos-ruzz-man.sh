#!/usr/bin/env bash
# Sube las 34 fotos de Ruzz Man (img/ruzz/*.webp) al R2 de Vende (bucket vende-archivos).
# Las claves son las mismas que pone ruzz-man.sql en productos.foto. Correr ANTES del SQL, desde la carpeta del repo vende.
#   bash <ruta>/anaoleynick/makeup/_vende/subir-fotos-ruzz-man.sh           # sube
#   bash <ruta>/anaoleynick/makeup/_vende/subir-fotos-ruzz-man.sh --probar  # solo muestra qué subiría
set -euo pipefail
IMG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../img/ruzz" && pwd)"
BUCKET="vende-archivos"
V="88b11614-16ea-4bd8-b8bd-d882d1ddadd5"
PROBAR="${1:-}"
FOTOS=(
  "shaving-gel-rosa.webp dfd72f6b-8c61-5a27-85c2-187d6f691f70-rz1.webp"
  "shaving-gel-verde.webp 653f144c-583d-5785-b5da-dd8e416b657d-rz1.webp"
  "shaving-gel-morado.webp af53a518-59bb-5b26-8c62-9fb2cd6b59ae-rz1.webp"
  "after-shave-rosa.webp fc671f66-8cc4-5d4a-8e06-2769f7f7b96a-rz1.webp"
  "after-shave-verde.webp b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095-rz1.webp"
  "after-shave-morado.webp e3e255f1-3925-5fe7-bec7-41ee211d2c42-rz1.webp"
  "after-shave-gris.webp 03c9520a-26f1-5c1c-8e43-b7c727528dee-rz1.webp"
  "after-shave-rojo.webp 859f3c1b-1a91-5433-a66d-a26bdd740c60-rz1.webp"
  "jabon-minoxidil-bergamota-romero.webp 6585aed1-cb23-527e-a969-a1aed9a57d04-rz1.webp"
  "talco-con-aroma.webp 23094b5d-e04c-53f7-9589-e92115162609-rz1.webp"
  "facial-scrub.webp d8a27cb0-b249-5565-9fde-0825effed208-rz1.webp"
  "shampoo-minoxidil.webp e8afdccb-2bb3-5dc9-936e-12abffb85340-rz1.webp"
  "smooth-pre-hair-cut.webp ec504a8e-27c2-5796-81d5-96d7f58fd015-rz1.webp"
  "acondicionador-aceite-minoxidil.webp e1eeb5b6-19c5-5c64-8cc8-e6ac186710ce-rz1.webp"
  "acondicionador-aceite.webp a72bc784-35ae-5211-bd19-44361ae97316-rz1.webp"
  "bifasic24.webp 4df8febf-6118-55dd-9c22-71d01b585b12-rz1.webp"
  "minoxidil-7.webp c42e93d0-56e5-50c5-95ba-ea2d50b2b30d-rz1.webp"
  "minoxidil-10.webp 61767d15-dd4b-56cf-bb70-64b76be24f6c-rz1.webp"
  "gel-natural-extra-fuerte.webp 314c2f43-772d-5b8a-a3ce-0419fd98bf73-rz1.webp"
  "gel-natural-fuerte.webp 33af1d93-1d57-5ca3-9d35-fb34a2eaa74b-rz1.webp"
  "gel-natural-medio.webp 2c0f4400-5bc3-5c21-8199-77201c2b9002-rz1.webp"
  "cera-gel-maxima-fijacion.webp be0fe5b6-3d20-5cc9-888d-e577427ab5d2-rz1.webp"
  "pomade-extra-fuerte.webp 171acc30-72e6-51fb-abb3-4fde189eed13-rz1.webp"
  "pomade-fuerte.webp 960e6cef-0254-5cfe-91d8-5c7fcb1be242-rz1.webp"
  "pomade-media.webp 490168ed-48b6-50d1-9925-94974c574dc3-rz1.webp"
  "pomade-baja.webp 43cdf500-d747-5889-986b-64d33f69e3ed-rz1.webp"
  "pomade-minoxidil-extra-fuerte.webp c2ea3fd0-4c69-573b-83dc-27f297c98ca8-rz1.webp"
  "spider-wax.webp 4fb05402-aecf-517a-8755-1dbb734694a5-rz1.webp"
  "pomade-matte-clay.webp 8f6c761d-82b6-59fc-8a9b-d2212a5cb0cf-rz1.webp"
  "sea-salt.webp 3d4f93da-6587-529a-85e2-a214a3ca5684-rz1.webp"
  "volutex.webp 3c21125b-4b5d-53e3-b886-0424e246ad20-rz1.webp"
  "cool7-plus.webp 22b79e65-9938-5248-b8e4-1630244b9b7a-rz1.webp"
  "towel-essence.webp 641b5379-6458-5f5a-93a9-2c93d5159ddc-rz1.webp"
  "barbicidex.webp 6dd00546-9b47-5794-aa3b-fab3280edb97-rz1.webp"
)
for par in "${FOTOS[@]}"; do
  read -r archivo nombre <<<"$par"
  origen="$IMG/$archivo"; destino="$BUCKET/productos/$V/$nombre"
  [ -f "$origen" ] || { echo "Falta $origen" >&2; exit 1; }
  if [ "$PROBAR" = "--probar" ]; then echo "subiría $origen -> $destino"; else echo "Subiendo $archivo"; npx wrangler r2 object put "$destino" --file "$origen" --content-type image/webp --remote; fi
done
echo "Listo. Ahora aplica ruzz-man.sql."
