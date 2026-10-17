# Vorka México · empaqueta el cliente del Simulador PAA dentro del Worker de la tienda.
# Uso: python3 _tienda/simulador/construir.py   (correr cada vez que cambie simulador/app.js o app.css)
import os, json
AQUI = os.path.dirname(os.path.abspath(__file__))
salida = os.path.join(AQUI, '..', 'src', 'simulador', 'cliente.generado.js')
js = open(os.path.join(AQUI, 'app.js'), encoding='utf-8').read()
css = open(os.path.join(AQUI, 'app.css'), encoding='utf-8').read()
with open(salida, 'w', encoding='utf-8') as f:
    f.write('// GENERADO por _tienda/simulador/construir.py desde simulador/app.js y app.css: no editar a mano\n')
    f.write(f'export const APP_JS = {json.dumps(js, ensure_ascii=False)};\n')
    f.write(f'export const APP_CSS = {json.dumps(css, ensure_ascii=False)};\n')
print('·', os.path.relpath(salida, os.path.join(AQUI, '..', '..')))
