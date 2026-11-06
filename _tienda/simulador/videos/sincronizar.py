# Vorka México · sincroniza un video del simulador con su voz.
# Uso: python3 _tienda/simulador/videos/sincronizar.py paa/01.json ruta/al/audio.mp3
#   1. Convierte el audio a MP3 mono de 64 kbps y lo guarda donde dice "audio" en el JSON (assets/…, lo sirve Pages).
#   2. Detecta los silencios (ffmpeg silencedetect) y calcula cuándo empieza cada paso: estima por la cantidad de letras
#      de la voz de cada paso y ajusta al silencio más cercano (la narración lleva una pausa entre pasos).
#   3. Escribe "inicio" en cada paso y "duracion" en el video.
# Necesita ffmpeg y ffprobe.
import json, os, re, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))   # raíz del repo (la que publica Pages)


def silencios(mp3, umbral='-38dB', minimo=0.30):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp3, '-af', f'silencedetect=noise={umbral}:d={minimo}', '-f', 'null', '-'],
                       capture_output=True, text=True)
    ini = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    fin = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    return [(a, b) for a, b in zip(ini, fin)]


def duracion(mp3):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).strip())


def letras(t):
    return len(re.sub(r'\[[^\]]*\]', '', t).strip())


def main(json_rel, fuente):
    ruta = os.path.join(AQUI, json_rel)
    v = json.load(open(ruta, encoding='utf-8'))
    destino = os.path.join(RAIZ, v['audio'].lstrip('/'))
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', fuente, '-ac', '1', '-b:a', '64k', destino], check=True)
    total = duracion(destino)
    sil = silencios(destino)
    pasos = v['pasos']
    n = [letras(p['voz']) for p in pasos]
    suma = sum(n)
    # Tiempo de voz sin los silencios del inicio y del final
    arranque = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
    cierre = sil[-1][0] if sil and sil[-1][1] > total - 0.05 else total
    medios = [(a + b) / 2 for a, b in sil if a > arranque + 0.5 and b < cierre - 0.5]
    # Caso ideal: hay exactamente una pausa larga (las [pause] de la narración) entre cada par de pasos
    largas = [(a + b) / 2 for a, b in silencios(destino, minimo=0.6) if a > arranque + 0.5 and b < cierre - 0.5]
    if len(largas) == len(pasos) - 1:
        for p, t in zip(pasos, [0.0] + [round(x, 2) for x in largas]):
            p['inicio'] = t
        v['duracion'] = round(total, 2)
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(v, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'· {os.path.relpath(destino, RAIZ)} ({total:.1f} s, {os.path.getsize(destino) // 1024} KB) · {len(largas)} pausas largas = {len(pasos)} pasos ✓')
        return
    print(f'  {len(largas)} pausas largas para {len(pasos)} pasos: se estima por letras y se ajusta al silencio más cercano')
    inicios, acumulado, usados = [0.0], 0, set()
    for i in range(1, len(pasos)):
        acumulado += n[i - 1]
        estimado = arranque + (cierre - arranque) * acumulado / suma
        cands = [(abs(m - estimado), k) for k, m in enumerate(medios) if k not in usados and m > inicios[-1] + 0.8]
        cerca = [c for c in cands if c[0] <= 4.0]
        if cerca:
            _, k = min(cerca)
            usados.add(k)
            inicios.append(round(medios[k], 2))
        else:
            inicios.append(round(max(estimado, inicios[-1] + 0.8), 2))
        print(f'  paso {i + 1:2}: estimado {estimado:6.2f} s → {inicios[-1]:6.2f} s' + ('' if cerca else '  (sin silencio cerca: estimado)'))
    for p, t in zip(pasos, inicios):
        p['inicio'] = t
    v['duracion'] = round(total, 2)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(v, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'· {os.path.relpath(destino, RAIZ)} ({total:.1f} s, {os.path.getsize(destino) // 1024} KB) · {len(sil)} silencios')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('Uso: python3 sincronizar.py paa/01.json audio.mp3')
    main(sys.argv[1], sys.argv[2])
