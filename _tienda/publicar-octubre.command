#!/bin/zsh
# Vorka México · publica los ajustes de octubre (doble clic, una sola vez, DESPUÉS de aprobar el PR en GitHub)
# Tienda: recordatorio de órdenes sin pagar, enlaces editables con redirección y portada nueva de /tienda.
# Vorka OS: avisos con horario, pendientes al celular (o correo), página "Mis pendientes", invitar clientes a reuniones
# y la base para Instagram. Se puede volver a correr sin problema.
set -e
cd "$(dirname "$0")/.."
echo "1/6 · Bajando la versión aprobada (main)…"
git checkout -q main
git pull -q origin main
cd _tienda
echo "2/6 · Corriendo las pruebas de la tienda…"
npx vitest run --reporter=dot
echo "3/6 · Actualizando la base de la tienda…"
yes | npx wrangler d1 migrations apply vorka-tienda --remote
echo "4/6 · Publicando la tienda…"
npx wrangler deploy
echo "5/6 · Actualizando y publicando Vorka OS…"
cd ../../vorka-os
npx wrangler d1 execute vorka-os --remote --yes --file=migracion_026_avisos_instagram.sql >/dev/null 2>&1 && echo "   base lista" || echo "   (la base ya estaba actualizada)"
npx wrangler deploy
echo "6/6 · Revisando que todo responda…"
for u in https://vorka.mx/tienda https://vorka.mx/api/tienda/salud https://os.vorka.mx; do
  printf "  %-36s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"
done
echo ""
echo "Listo. Si las tres dicen 200, ya quedó. Puedes cerrar esta ventana."
