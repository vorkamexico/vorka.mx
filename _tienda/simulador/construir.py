# Vorka México · empaqueta el cliente del Simulador PAA dentro del Worker de la tienda.
# Uso: python3 _tienda/simulador/construir.py   (correr cada vez que cambie simulador/logica.js, app.js, app.css, diag.js o un video)
# APP_JS = logica.js (funciones puras: gráfica, temas, puntaje por universidad) + app.js. LOGICA_JS va aparte para las pruebas.
import os, json
AQUI = os.path.dirname(os.path.abspath(__file__))
salida = os.path.join(AQUI, '..', 'src', 'simulador', 'cliente.generado.js')
logica = open(os.path.join(AQUI, 'logica.js'), encoding='utf-8').read()
js = logica + '\n' + open(os.path.join(AQUI, 'app.js'), encoding='utf-8').read()
css = open(os.path.join(AQUI, 'app.css'), encoding='utf-8').read()
diag = open(os.path.join(AQUI, 'diag.js'), encoding='utf-8').read()
with open(salida, 'w', encoding='utf-8') as f:
    f.write('// GENERADO por _tienda/simulador/construir.py desde simulador/logica.js, app.js, app.css y diag.js: no editar a mano\n')
    f.write(f'export const APP_JS = {json.dumps(js, ensure_ascii=False)};\n')
    f.write(f'export const APP_CSS = {json.dumps(css, ensure_ascii=False)};\n')
    f.write(f'export const DIAG_JS = {json.dumps(diag, ensure_ascii=False)};\n')
    f.write(f'export const LOGICA_JS = {json.dumps(logica, ensure_ascii=False)};\n')
print('·', os.path.relpath(salida, os.path.join(AQUI, '..', '..')))

# Videos explicativos: simulador/videos/<simulador>/*.json → src/simulador/videos.generado.js (solo lo que usa la app)
import glob
CARPETA_APP = {'paa': 'simulador-paa', 'unam': 'simulador-unam', 'ecoems': 'simulador-ecoems', 'prepa-ug': 'simulador-prepa-ug'}
videos = {}
for carpeta, app in CARPETA_APP.items():
    for ruta in sorted(glob.glob(os.path.join(AQUI, 'videos', carpeta, '*.json'))):
        v = json.load(open(ruta, encoding='utf-8'))
        if not v.get('publicado'):
            continue
        con_voz = 'duracion' in v and all('inicio' in p for p in v['pasos']) and os.path.exists(os.path.join(AQUI, '..', '..', v['audio'].lstrip('/')))
        if not con_voz:
            # Sin voz todavía: tiempos estimados por la cantidad de letras (14 por segundo y una pausa entre pasos) para revisar
            # la animación con subtítulos. Sale solo como borrador (ver motor.js › /videos).
            t = 0.0
            for p in v['pasos']:
                p['inicio'] = round(t, 2)
                t += len(p['voz']) / 14 + 0.9
            v['duracion'] = round(t, 2)
            v['borrador'] = True
        videos.setdefault(app, []).append({'id': v['id'], 'tema': v['tema'], 'titulo': v['titulo'], 'audio': v['audio'] if con_voz else None, 'duracion': v['duracion'],
            'borrador': bool(v.get('borrador')), 'pasos': [{k: p[k] for k in ('escena', 'voz', 'acciones', 'limpia', 'inicio', 'pausa') if k in p} for p in v['pasos']]})
salida_v = os.path.join(AQUI, '..', 'src', 'simulador', 'videos.generado.js')
with open(salida_v, 'w', encoding='utf-8') as f:
    f.write('// GENERADO por _tienda/simulador/construir.py desde simulador/videos/*/*.json: no editar a mano\n')
    f.write(f'export const VIDEOS = {json.dumps(videos, ensure_ascii=False)};\n')
print('·', os.path.relpath(salida_v, os.path.join(AQUI, '..', '..')), '·', sum(len(x) for x in videos.values()), 'videos')
