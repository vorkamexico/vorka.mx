#!/bin/zsh
# Vorka México · publica la tienda con el marketplace de creadores y las pantallas de Vorka OS (doble clic)
# Antes: el PR ya debe estar en main y la clave restringida real debe tener los permisos de Connect.
set -e
cd "$(dirname "$0")/.."
echo "1/5 · Bajando la versión aprobada (main)…"
git checkout -q main
git pull -q origin main
cd _tienda
echo "2/5 · Corriendo las pruebas…"
npx vitest run --reporter=dot
echo "3/5 · Publicando la tienda (vorka.mx/tienda y vorka.mx/creadores)…"
npx wrangler deploy
echo "4/5 · Publicando Vorka OS (pantallas de creadores, revisión y transferencias)…"
(cd ../../vorka-os && npx wrangler deploy)
echo "5/5 · Revisando que todo responda…"
for p in /tienda /creadores /api/tienda/salud; do
  printf "  %-20s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "https://vorka.mx$p")"
done
echo ""
echo "Listo. Si las tres dicen 200, ya quedó. Puedes cerrar esta ventana."
