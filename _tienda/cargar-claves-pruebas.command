#!/bin/bash
# Igual que cargar-claves.command, pero para el ENTORNO DE PRUEBAS (claves rk_test_ y whsec_ del webhook de prueba)
exec "$(dirname "$0")/cargar-claves.command" pruebas
