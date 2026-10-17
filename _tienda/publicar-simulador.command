#!/bin/zsh
# Vorka México · publica el Simulador PAA (doble clic, DESPUÉS de aprobar el PR en GitHub).
# Incluye: banco de 235 reactivos, simulacros sin repetir, regalos con liga de un solo uso, intentos ($50 c/u),
# portadas, tienda por secciones con el simulador como producto estrella y la página para Google.
# Se puede volver a correr sin problema.
set -e
cd "$(dirname "$0")/.."
echo "1/5 · Bajando la versión aprobada (main)…"
git checkout -q main
git pull -q origin main
cd _tienda
echo "2/5 · Corriendo las pruebas de la tienda…"
npx vitest run --reporter=dot
echo "3/5 · Actualizando la base de la tienda…"
yes | npx wrangler d1 migrations apply vorka-tienda --remote
echo "4/5 · Publicando la tienda (agrega vorka.mx/simulador-paa)…"
npx wrangler deploy
echo ""
PRECIO=$(npx wrangler d1 execute vorka-tienda --remote --json --command "SELECT precio_centavos/100 p FROM products WHERE id='prod_simulador_paa'" 2>/dev/null | grep '"p"' | grep -o '[0-9]*')
read "R?¿Poner el Simulador PAA a la venta a \$${PRECIO} MXN? (s/n) "
if [[ "$R" == [sS]* ]]; then
  npx wrangler d1 execute vorka-tienda --remote --command "UPDATE products SET activo = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id IN ('prod_simulador_paa', 'prod_simulador_paa_intento')" >/dev/null
  echo "   A la venta. (El precio se cambia en Vorka México → Tienda → Productos.)"
else
  echo "   Queda oculto. Actívalo cuando quieras en Vorka México → Tienda → Productos."
fi
# El panel (os.vorka.mx) ya no se publica desde aquí: Cloudflare lo publica solo al unir a main en GitHub (vorkamexico/os).
# Publicarlo desde la Mac dejaría lo publicado distinto de GitHub.
echo "5/5 · Revisando que todo responda…"
for u in https://vorka.mx/simulador-paa/ https://vorka.mx/tienda/ https://vorka.mx/tienda/sitemap.xml https://vorka.mx/sitemap.xml https://vorka.mx/api/tienda/salud https://os.vorka.mx; do
  printf "  %-40s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"
done
echo ""
echo "Listo. Si todas dicen 200, ya quedó."
echo "Último paso para Google (Search Console → Sitemaps): reenvía https://vorka.mx/sitemap.xml y https://vorka.mx/tienda/sitemap.xml,"
echo "y en Inspección de URLs pide indexar https://vorka.mx/simulador-paa/"
