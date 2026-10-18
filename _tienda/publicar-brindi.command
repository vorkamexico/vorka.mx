#!/bin/zsh
# Vorka México · publica Brindi en la tienda (doble clic, DESPUÉS de unir a main los PR de vorkamexico/os y vorkamexico/vorka.mx).
# Incluye: productos de Brindi (entran ocultos), ficha vorka.mx/tienda/brindi/, correos de acceso a os.vorka.mx y RPC para Vorka OS.
# Se puede volver a correr sin problema.
set -e
cd "$(dirname "$0")/.."
echo "1/5 · Bajando la versión aprobada (main)…"
git checkout -q main
git pull -q origin main
cd _tienda
echo "2/5 · Corriendo las pruebas de la tienda…"
npx vitest run --reporter=dot
echo "3/5 · Actualizando la base de la tienda (productos de Brindi, ocultos)…"
yes | npx wrangler d1 migrations apply vorka-tienda --remote
echo "4/5 · Publicando la tienda (agrega vorka.mx/tienda/brindi/)…"
npx wrangler deploy
echo ""
read "R?¿Poner a la venta los planes y complementos de Brindi ya? (s/n) "
if [[ "$R" == [sS]* ]]; then
  npx wrangler d1 execute vorka-tienda --remote --command "UPDATE products SET activo = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id LIKE 'prod_brindi_%'" >/dev/null
  echo "   A la venta. (Precios y productos se cambian en Vorka México → Tienda → Productos.)"
else
  echo "   Quedan ocultos. La ficha muestra “Muy pronto” y deja crear invitaciones gratis."
fi
# os.vorka.mx se publica solo al unir a main (Workers Builds). Sus tablas se crean solas la primera vez.
echo "5/5 · Revisando que todo responda…"
for u in https://vorka.mx/tienda/brindi/ https://vorka.mx/tienda/ https://vorka.mx/api/tienda/salud https://os.vorka.mx/brindi/ https://os.vorka.mx/i/demo-boda https://os.vorka.mx/brindi/og/aurora.png; do
  printf "  %-42s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"
done
echo ""
echo "Listo. Si todas dicen 200, ya quedó. Prueba una compra real de bajo monto antes de anunciarlo (ver PLAN-BRINDI.md)."
