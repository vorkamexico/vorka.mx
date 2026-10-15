#!/bin/bash
# Vorka México · carga las claves de la tienda en Cloudflare (doble clic en este archivo)
# Las claves se escriben ocultas y van directo a los secretos del Worker vorka-tienda: no se guardan en ningún archivo.
cd "$(dirname "$0")" || exit 1

echo ""
echo "Tienda Vorka México · cargar claves"
echo "Pega cada clave cuando te la pida y presiona Enter (no se ve mientras la pegas, es normal)."
echo "Si quieres saltarte una, deja vacío y presiona Enter."
echo ""

cargar() { # nombre, descripción, prefijos válidos
  local nombre="$1" texto="$2" prefijos="$3" valor=""
  while true; do
    printf "%s: " "$texto"
    read -rs valor; echo ""
    if [ -z "$valor" ]; then echo "  · Saltada."; return; fi
    if [[ "$valor" =~ ^($prefijos) ]]; then break; fi
    echo "  ✗ No parece correcta (debe empezar con ${prefijos//|/ o }). Intenta de nuevo."
  done
  if printf "%s" "$valor" | npx --yes wrangler secret put "$nombre" >/dev/null 2>&1; then
    echo "  ✓ Guardada."
  else
    echo "  ✗ No se pudo guardar. Revisa que hayas iniciado sesión en Cloudflare (npx wrangler login)."
  fi
}

cargar STRIPE_SECRET_KEY     "1/3 Clave restringida de Stripe (rk_test_… o rk_live_…)" "rk_test_|rk_live_|sk_test_|sk_live_"
cargar STRIPE_WEBHOOK_SECRET "2/3 Secreto del webhook de Stripe (whsec_…)"              "whsec_"
cargar RESEND_API_KEY        "3/3 Clave de Resend (re_…)"                               "re_"

echo ""
echo "Listo. Secretos que tiene la tienda ahora:"
npx --yes wrangler secret list 2>/dev/null | grep -o '"name": "[A-Z_]*"' | sed 's/"name": /  · /'
echo ""
read -rp "Presiona Enter para cerrar."
