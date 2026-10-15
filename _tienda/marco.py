# Vorka México · exporta el menú y el pie del sitio (sistema v3) para las páginas que arma el Worker de la tienda.
# Uso: python3 _tienda/marco.py   (desde la raíz del repo; correr cada vez que cambie _sitio/partes.py)
import os, sys, json
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, '_sitio'))
import partes

salida = os.path.join(RAIZ, '_tienda', 'src', 'marco.generado.js')
with open(salida, 'w', encoding='utf-8') as f:
    f.write('// GENERADO por _tienda/marco.py desde _sitio/partes.py: no editar a mano\n')
    f.write(f'export const VERSION = {json.dumps(partes.VERSION)};\n')
    f.write(f'export const NAV = {json.dumps(partes.nav("/tienda/"), ensure_ascii=False)};\n')
    f.write(f'export const PIE = {json.dumps(partes.pie(), ensure_ascii=False)};\n')
    f.write(f'export const LOGO = {json.dumps(partes.LOGO, ensure_ascii=False)};\n')
    f.write(f'export const FLECHA = {json.dumps(partes.FLECHA, ensure_ascii=False)};\n')
    f.write(f'export const CHECK = {json.dumps(partes.ICONOS["check"], ensure_ascii=False)};\n')
    f.write(f'export const DOC = {json.dumps(partes.ICONOS["doc"], ensure_ascii=False)};\n')
print('·', os.path.relpath(salida, RAIZ))
