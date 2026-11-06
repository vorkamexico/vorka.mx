# Vorka México · videos de Lectura del Simulador PAA (09 a 14), estilo pizarrón y explicación sencilla.
# Genera simulador/videos/paa/0N.json y 1N.json. Uso: python3 _tienda/simulador/videos/lectura.py
# En Lectura el pizarrón escribe un texto corto y luego subraya pistas, encierra palabras y tacha trampas.
import json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
VOZ = {"voice_id": "1xS79gv6DdMmXOOsmZFg", "nombre": "Brandon", "modelo": "eleven_v4"}


def E(texto, x, y, en=None, color=None, tam=None, id=None):
    a = {"a": "escribe", "texto": texto, "x": x, "y": y}
    if id: a["id"] = id
    if color: a["color"] = color
    if tam: a["tam"] = tam
    if en: a["en"] = en
    return a
def C(sobre, en, color="rosa"): return {"a": "circulo", "sobre": sobre, "color": color, "en": en}
def S(sobre, en, color="amarillo"): return {"a": "subraya", "sobre": sobre, "color": color, "en": en}
def T(sobre, en): return {"a": "tacha", "sobre": sobre, "color": "rojo", "en": en}
def F(de, hacia, en, color="blanco"): return {"a": "flecha", "de": de, "hacia": hacia, "color": color, "en": en}
def D(d, en, color="blanco", ancho=None):
    a = {"a": "trazo", "d": d, "color": color, "en": en}
    if ancho: a["ancho"] = ancho
    return a
def P(x, y, en): return {"a": "palomita", "x": x, "y": y, "en": en}
def paso(escena, voz, acciones, limpia=True, pausa=None):
    p = {"escena": escena, "voz": voz, "acciones": acciones}
    if limpia: p["limpia"] = True
    if pausa: p["pausa"] = pausa
    return p
def turno(): return E("Tu turno", 60, 110, "Tu turno", "azul", 66)
def recuerda(): return E("Recuerda", 70, 140, "Recuerda", "amarillo", 84)
def cuidado(): return E("¡Cuidado!", 60, 130, "Cuidado", "rojo", 84)


VIDEOS = {
  "09": ("vocabulario", "Vocabulario en contexto", [
    paso("La pregunta", "Lee esta oración: el río arrastró todo, pero el viejo puente resistió estoico. ¿Qué significa estoico?", [
      E("El río arrastró todo,", 60, 150, "el río arrastró", tam=66, id="l1"),
      E("pero", 60, 250, "pero el viejo", tam=66, id="pero"), E("el viejo puente", 185, 250, "viejo puente", tam=66),
      E("resistió", 60, 350, "resistió", tam=66, id="res"), E("estoico.", 270, 350, "resistió estoico", "amarillo", 66, "est"),
      E("¿estoico = ?", 60, 500, "¿Qué significa", "azul", 70),
    ]),
    paso("Las pistas", "No necesitas el diccionario: busca pistas. El río arrastró todo, pero el puente no: resistió.", [
      S("l1", "El río arrastró todo"), C("pero", "pero el puente no"), S("res", "resistió.", "verde"),
    ], limpia=False),
    paso("Tu palabra", "Ahora pon tu propia palabra: firme, sin rendirse. Eso significa estoico.", [
      E("= firme", 540, 350, "firme", "verde", 76, "f"), C("f", "sin rendirse", "verde"), P(850, 320, "Eso significa"),
    ], limpia=False),
    paso("El método", "El truco: tapa la palabra, lee lo de alrededor, pon tu palabra y prueba cada opción.", [
      E("1. Tapa la palabra", 60, 140, "tapa la palabra", tam=66), E("2. Lee lo de alrededor", 60, 250, "lee lo de alrededor", tam=66),
      E("3. Pon tu palabra", 60, 360, "pon tu palabra", tam=66), E("4. Prueba las opciones", 60, 470, "prueba cada opción", tam=66, id="u"),
      S("u", "cada opción"),
    ]),
    paso("Cuidado", "Cuidado con el significado de diccionario. Estoico también es un tipo de filósofo, pero aquí se habla de un puente.", [
      cuidado(), E("estoico = filósofo", 60, 300, "filósofo", "rojo", 76, "fil"), T("fil", "pero aquí"),
      E("aquí: un puente", 60, 460, "se habla de un puente", "verde", 76),
    ]),
    paso("Tu turno", "Tu turno. Su respuesta fue tan escueta que cupo en una sola línea. ¿Qué significa escueta?", [
      turno(), E("Su respuesta fue tan", 60, 240, "Su respuesta", tam=64),
      E("escueta", 60, 340, "tan escueta", "amarillo", 64, "esc"), E("que cupo en una sola línea.", 240, 340, "que cupo", tam=64, id="pista"),
      E("¿escueta = ?", 60, 480, "¿Qué significa", "azul", 70),
    ], pausa=5),
    paso("Tu turno", "La pista es: cupo en una sola línea. Escueta significa breve, con pocas palabras.", [
      S("pista", "La pista es"), E("= breve", 470, 480, "significa breve", "verde", 76, "br"), C("br", "pocas palabras", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: el significado lo decide la oración, no el diccionario.", [
      recuerda(), E("lo decide la oración,", 70, 300, "lo decide la oración"), E("no el diccionario", 70, 430, "no el diccionario", id="u"), S("u", "diccionario"),
    ]),
  ]),

  "10": ("idea_central", "La idea central", [
    paso("La pregunta", "Lee: muchos creen que los videojuegos solo distraen. Sin embargo, algunos mejoran la atención. Por eso, ya se usan en clases de ciencias. ¿Cuál es la idea central?", [
      E("Muchos creen que los videojuegos", 60, 130, "muchos creen", tam=54),
      E("solo distraen.", 60, 210, "solo distraen", tam=54), E("Sin embargo,", 330, 210, "Sin embargo, algunos", tam=54, id="se"), E("algunos", 580, 210, "algunos mejoran", tam=54),
      E("mejoran la atención.", 60, 290, "mejoran la atención", tam=54, id="mej"), E("Por eso, ya", 460, 290, "Por eso, ya", tam=54),
      E("se usan en clases de ciencias.", 60, 370, "clases de ciencias", tam=54, id="det"),
      E("¿idea central?", 60, 510, "Cuál es la idea central", "azul", 70),
    ]),
    paso("La idea", "La idea central es como un paraguas: tiene que cubrir todo el texto.", [
      D("M 40 95 Q 470 0 920 95", "como un paraguas", "amarillo", 6),
      E("cubre TODO el texto", 470, 510, "cubrir todo", "amarillo", 60),
    ], limpia=False),
    paso("La pista", "En los textos que opinan, la idea del autor llega después de un sin embargo.", [
      C("se", "después de un sin embargo"), S("mej", "la idea del autor", "verde"),
    ], limpia=False),
    paso("La respuesta", "Entonces, la idea central es: algunos videojuegos ayudan a aprender, y las escuelas ya los usan.", [
      E("Idea central:", 60, 150, "la idea central es", "amarillo", 70),
      E("algunos videojuegos ayudan", 60, 290, "algunos videojuegos", "verde", 64), E("a aprender, y ya se usan", 60, 390, "las escuelas", "verde", 64),
      P(820, 360, "ya los usan"),
    ]),
    paso("Cuidado", "Cuidado con dos trampas: un detalle, que se queda chiquito, y una idea tan general que podría ser de otro libro.", [
      cuidado(), E("«se usan en ciencias»", 60, 280, "un detalle", "rojo", 56, "d"), E("→ un detalle", 560, 280, "un detalle", "rojo", 56), T("d", "chiquito"),
      E("«la tecnología cambió todo»", 60, 440, "tan general", "rojo", 54, "g"), E("→ muy general", 660, 440, "tan general", "rojo", 50), T("g", "de otro libro"),
    ]),
    paso("Tu turno", "Tu turno. ¿Cuál es el mejor título? A: historia de los videojuegos. B: videojuegos, de distracción a herramienta. C: cómo ganar en tus juegos.", [
      turno(), E("A) Historia de los videojuegos", 60, 240, "historia de los", tam=56, id="a"),
      E("B) De distracción a herramienta", 60, 350, "de distracción", tam=56, id="b"), E("C) Cómo ganar en tus juegos", 60, 460, "cómo ganar", tam=56, id="c"),
    ], pausa=5),
    paso("Tu turno", "Es la B: resume todo el texto. La A habla de otra cosa, y la C es un instructivo.", [
      C("b", "Es la B", "verde"), T("a", "La A habla"), T("c", "la C es"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: la idea central cubre todo el texto. Ni un detalle, ni algo demasiado general.", [
      recuerda(), E("cubre todo el texto", 70, 300, "cubre todo"), E("ni detalle, ni muy general", 70, 430, "Ni un detalle", tam=66, id="u"), S("u", "demasiado general"),
    ]),
  ]),

  "11": ("inferencia", "Inferencias", [
    paso("La pregunta", "Lee: Mariana miró el reloj por tercera vez. Cuando se abrió la puerta del tren, guardó su libro y se puso de puntillas. ¿Qué se infiere?", [
      E("Mariana miró el reloj", 60, 120, "Mariana miró", tam=56),
      E("por tercera vez.", 60, 200, "por tercera vez", tam=56, id="p1"), E("Cuando se abrió", 375, 200, "Cuando se abrió", tam=56),
      E("la puerta del tren,", 60, 280, "la puerta del tren", tam=56), E("guardó su", 425, 280, "guardó su libro", tam=56),
      E("libro", 60, 360, "su libro", tam=56), E("y se puso de puntillas.", 150, 360, "de puntillas", tam=56, id="p3"),
      E("¿Qué se infiere?", 60, 480, "Qué se infiere", "azul", 64),
    ]),
    paso("Las pistas", "Inferir no es adivinar: es juntar pistas. Miró el reloj tres veces: está esperando. Se puso de puntillas: busca a alguien.", [
      S("p1", "tres veces"), E("espera", 790, 200, "está esperando", "amarillo", 52),
      S("p3", "de puntillas:"), E("busca", 760, 360, "busca a alguien", "amarillo", 52),
    ], limpia=False),
    paso("Se infiere", "Entonces se infiere: Mariana espera con ansias a alguien que llega en ese tren.", [
      E("→ espera a alguien del tren", 60, 570, "espera con ansias", "verde", 56, "inf"), S("inf", "en ese tren", "verde"),
    ], limpia=False),
    paso("Cuidado", "Cuidado con tres trampas: palabras absolutas como siempre o nunca, datos que el texto no dice, y frases copiadas tal cual.", [
      cuidado(), E("1. siempre, nunca", 60, 260, "palabras absolutas", "rojo", 66),
      E("2. datos que no están", 60, 370, "datos que el texto", "rojo", 66), E("3. frases copiadas", 60, 480, "frases copiadas", "rojo", 66),
    ]),
    paso("Un ejemplo", "Por ejemplo: Mariana odia leer. Falso: guardar un libro no es odiar leer.", [
      E("«Mariana odia leer»", 60, 260, "Mariana odia leer", "rojo", 76, "o"), T("o", "Falso"),
      E("guardar ≠ odiar", 60, 430, "no es odiar", "verde", 80),
    ]),
    paso("Tu turno", "Tu turno. Don Ramiro apagó la luz de su tienda despacio, como quien se despide. ¿Qué se infiere?", [
      turno(), E("Don Ramiro apagó la luz", 60, 240, "Don Ramiro", tam=60),
      E("despacio,", 60, 340, "despacio", tam=60, id="d1"), E("como quien se despide.", 290, 340, "como quien se despide", tam=60, id="d2"),
      E("¿Qué se infiere?", 60, 470, "Qué se infiere", "azul", 60),
    ], pausa=5),
    paso("Tu turno", "Las pistas son despacio y como quien se despide. Se infiere que algo está terminando para él.", [
      S("d1", "despacio y"), S("d2", "como quien se despide."), E("→ algo termina", 500, 470, "algo está terminando", "verde", 64),
    ], limpia=False),
    paso("Recuerda", "Recuerda: si no puedes señalar la pista en el texto, no es la respuesta.", [
      recuerda(), E("señala la pista", 70, 300, "señalar la pista"), E("en el texto", 70, 430, "en el texto", id="u"), S("u", "no es la respuesta"),
    ]),
  ]),

  "12": ("evidencia", "Evidencia: la cita que lo prueba", [
    paso("La pregunta", "Te dicen: cortar los árboles alejó a los colibríes. ¿Qué cita lo demuestra?", [
      E("Cortar los árboles →", 60, 150, "cortar los árboles", tam=64), E("se fueron los colibríes", 60, 250, "alejó a los colibríes", tam=64),
      E("¿Qué cita lo prueba?", 60, 420, "Qué cita", "azul", 70),
    ]),
    paso("La idea", "La cita correcta prueba toda la idea. Pártela en dos: la causa y el efecto.", [
      E("causa:", 60, 220, "la causa", "amarillo"), E("cortar los árboles", 270, 220, "la causa", tam=66),
      E("efecto:", 60, 380, "el efecto", "amarillo"), E("se fueron los colibríes", 280, 380, "el efecto", tam=60),
    ]),
    paso("Revisa", "Revisa cada cita. El cerro quedó pelón: solo tiene la causa. Sin las flores, los colibríes no volvieron: tiene las dos. ¡Esa es!", [
      E("A) «El cerro quedó pelón»", 60, 200, "El cerro quedó", tam=58, id="a"), E("solo causa", 700, 200, "solo tiene la causa", "rojo", 50), T("a", "tiene la causa."),
      E("B) «Sin las flores, los", 60, 340, "Sin las flores", tam=58, id="b1"), E("colibríes no volvieron»", 110, 420, "no volvieron", tam=58, id="b2"),
      S("b2", "tiene las dos", "verde"), P(720, 390, "Esa es"),
    ]),
    paso("Cuidado", "Cuidado: la cita trampa está en el mismo párrafo y habla del mismo tema, pero no demuestra lo que te preguntan.", [
      cuidado(), E("mismo párrafo ≠ prueba", 60, 300, "mismo párrafo", "rojo", 72), E("mismo tema ≠ prueba", 60, 440, "mismo tema", "rojo", 72),
    ]),
    paso("El truco", "Un truco: di en voz alta, se sabe que pasó esto, porque el texto dice esto otro. Si suena lógico, es la buena.", [
      E("Se sabe que ____", 60, 210, "se sabe que", tam=72), E("porque el texto dice ____", 60, 340, "porque el texto", tam=66),
      E("¿suena lógico?", 60, 480, "Si suena lógico", "verde", 72, "l"), P(560, 450, "es la buena"),
    ]),
    paso("Tu turno", "Tu turno. ¿Qué cita prueba que el mural le devolvió a la abuela las ganas de salir? A: el mural cubrió la pared. B: desde que lo pintaron, la abuela sale cada mañana a verlo.", [
      turno(), E("A) «El mural cubrió la pared»", 60, 250, "el mural cubrió", tam=56, id="a"),
      E("B) «Desde que lo pintaron, la", 60, 370, "desde que lo pintaron", tam=56, id="b"), E("abuela sale cada mañana»", 110, 450, "sale cada mañana", tam=56),
    ], pausa=5),
    paso("Tu turno", "Es la B: tiene el mural y el cambio en la abuela. La A solo describe el mural.", [
      C("b", "Es la B", "verde"), T("a", "La A solo"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: parte la idea en piezas. La cita correcta las prueba todas.", [
      recuerda(), E("parte la idea en piezas", 70, 300, "parte la idea", tam=70), E("la cita las prueba todas", 70, 430, "las prueba todas", tam=70, id="u"), S("u", "todas."),
    ]),
  ]),

  "13": ("analisis_literario", "Figuras y narradores", [
    paso("La pregunta", "Tus ojos brillan como luceros. Tus ojos son dos luceros. ¿Cuál es símil y cuál es metáfora?", [
      E("Tus ojos brillan", 60, 170, "Tus ojos brillan", tam=70), E("como", 500, 170, "como luceros", "amarillo", 70, "como"), E("luceros", 650, 170, "como luceros", tam=70),
      E("Tus ojos son dos luceros", 60, 350, "son dos luceros", tam=70), E("¿símil o metáfora?", 60, 500, "Cuál es símil", "azul", 70),
    ]),
    paso("La diferencia", "La diferencia es una palabra: como. Con como, es símil. Sin como, es metáfora.", [
      C("como", "una palabra"), E("= símil", 60, 250, "es símil", "amarillo", 62), E("= metáfora", 60, 425, "es metáfora", "verde", 62),
    ], limpia=False),
    paso("Otras figuras", "Otras que salen mucho: personificación, cuando una cosa hace algo de persona. E hipérbole, cuando se exagera.", [
      E("Personificación:", 60, 190, "personificación", "amarillo", 66), E("«el viento susurraba»", 60, 285, "algo de persona", tam=62),
      E("Hipérbole:", 60, 410, "hipérbole", "amarillo", 66), E("«te lo dije mil veces»", 60, 505, "se exagera", tam=62),
    ]),
    paso("El narrador", "Para el narrador, pregunta: ¿habla en primera persona? Si cuenta su propia historia, es protagonista. Si cuenta lo que le pasa a otro, es testigo.", [
      E("¿Habla en «yo»?", 60, 150, "primera persona", tam=72),
      E("su historia → protagonista", 60, 290, "es protagonista", "verde", 60), E("la de otro → testigo", 60, 410, "es testigo", "amarillo", 60),
    ]),
    paso("El narrador", "Y si habla en tercera persona y sabe lo que todos piensan, es omnisciente.", [
      E("«él» y sabe todo → omnisciente", 60, 540, "tercera persona", "azul", 54),
    ], limpia=False),
    paso("Cuidado", "Cuidado: en poesía, no leas al pie de la letra. Un árbol que es un reloj sin manecillas no es un reloj: marca el paso del tiempo.", [
      cuidado(), E("«un reloj sin manecillas»", 60, 270, "reloj sin manecillas", tam=62),
      E("≠ un reloj de verdad", 60, 380, "no es un reloj", "rojo", 62),
      E("= marca el tiempo", 60, 500, "marca el paso", "verde", 66),
    ]),
    paso("Tu turno", "Tu turno. Mi hermano llegó tarde. Yo lo vi esconder las manos. ¿Qué narrador es?", [
      turno(), E("«Mi hermano llegó tarde.", 60, 260, "Mi hermano", tam=60), E("Yo lo vi esconder las manos.»", 60, 350, "Yo lo vi", tam=60),
      E("¿Qué narrador es?", 60, 480, "Qué narrador", "azul", 60),
    ], pausa=5),
    paso("Tu turno", "Es testigo: habla en primera persona, pero la historia es de su hermano.", [
      E("testigo", 520, 480, "Es testigo", "verde", 80, "t"), C("t", "la historia es de su hermano", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: con como, símil. Sin como, metáfora. Y en poesía, busca el sentido figurado.", [
      recuerda(), E("con «como» → símil", 70, 280, "con como"), E("sin «como» → metáfora", 70, 400, "Sin como"),
      E("busca el sentido figurado", 70, 520, "sentido figurado", tam=60, id="u"), S("u", "figurado"),
    ]),
  ]),

  "14": ("proposito_tono", "Propósito, tono y estructura", [
    paso("La pregunta", "En el párrafo cuatro: las redes nos acercan. En el cinco: esto no significa que reemplacen una plática en persona. ¿Qué hace el párrafo cinco?", [
      E("Párrafo 4:", 60, 120, "párrafo cuatro", "amarillo", 56), E("Las redes nos acercan.", 60, 200, "nos acercan", tam=60),
      E("Párrafo 5:", 60, 300, "En el cinco", "amarillo", 56), E("¿Qué hace el 5?", 560, 300, "Qué hace", "azul", 60),
      E("«Esto no significa que", 60, 380, "esto no significa", tam=60, id="e"), E("reemplacen una plática»", 60, 460, "reemplacen", tam=60),
    ]),
    paso("Matiza", "Esto no significa que: pone un límite a lo anterior. A eso se le llama matizar.", [
      S("e", "pone un límite"), E("= matiza", 630, 460, "matizar", "verde", 80, "m"), C("m", "se le llama", "verde"),
    ], limpia=False),
    paso("El tono", "Para el tono, mira las palabras con emoción. Extraño, ya no está, aquellas tardes: eso es nostálgico.", [
      E("Tono = palabras con emoción", 60, 150, "Para el tono", tam=60),
      E("extraño · ya no está ·", 60, 290, "Extraño", "amarillo", 62), E("aquellas tardes", 60, 370, "aquellas tardes", "amarillo", 62),
      E("→ nostálgico", 60, 510, "es nostálgico", "verde", 76, "n"), S("n", "nostálgico.", "verde"),
    ]),
    paso("El propósito", "Para el propósito, pregunta: ¿para qué lo escribió? Si da datos, informa. Si opina y te pide algo, quiere convencer.", [
      E("¿Para qué lo escribió?", 60, 150, "para qué lo escribió", "amarillo", 66),
      E("datos → informa", 60, 300, "Si da datos", tam=72), E("opina → convence", 60, 440, "quiere convencer", tam=72),
    ]),
    paso("La estructura", "Para la estructura, busca marcas. Fechas: orden en el tiempo. Por eso: causa y efecto. Un problema y propuestas: problema y solución.", [
      E("fechas → cronológica", 60, 180, "Fechas", tam=64), E("por eso → causa y efecto", 60, 320, "Por eso:", tam=64),
      E("problema → solución", 60, 460, "problema y solución", tam=64),
    ]),
    paso("Cuidado", "Cuidado: matizar no es contradecir. El párrafo cinco no dice que las redes sean malas: solo pone un límite.", [
      cuidado(), E("matizar ≠ contradecir", 60, 300, "matizar no es", "amarillo", 76),
      E("solo pone un límite", 60, 450, "solo pone un límite", "verde", 70),
    ]),
    paso("Tu turno", "Tu turno. Qué maravilla de servicio: tres horas de espera. ¿Cuál es el tono?", [
      turno(), E("«¡Qué", 60, 240, "Qué maravilla", tam=58), E("maravilla", 200, 240, "maravilla de servicio", tam=58, id="mv"), E("de servicio:", 405, 240, "de servicio", tam=58),
      E("tres horas de espera!»", 60, 330, "tres horas", tam=58, id="h"), E("¿Cuál es el tono?", 60, 470, "Cuál es el tono", "azul", 60),
    ], pausa=5),
    paso("Tu turno", "Es irónico: dice maravilla, pero los hechos dicen lo contrario.", [
      E("irónico", 520, 470, "Es irónico", "verde", 80, "i"), C("mv", "dice maravilla", "rosa"), S("h", "los hechos", "rojo"), C("i", "lo contrario", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: el tono está en las palabras con emoción. Y la función de un párrafo, en cómo se une con los de al lado.", [
      recuerda(), E("tono → palabras con emoción", 70, 300, "el tono está", tam=62), E("función → mira los de al lado", 70, 430, "la función", tam=62, id="u"), S("u", "los de al lado"),
    ]),
  ]),
}

for num, (tema, titulo, pasos) in VIDEOS.items():
    ruta = os.path.join(AQUI, 'paa', f'{num}.json')
    v = {"id": f"paa-{num}", "tema": tema, "titulo": titulo, "publicado": True, "voz": VOZ,
         "audio": f"/assets/tienda/simulador-videos/paa/{num}.mp3", "pasos": pasos}
    if os.path.exists(ruta):
        viejo = json.load(open(ruta, encoding='utf-8'))
        if [p['voz'] for p in viejo['pasos']] == [p['voz'] for p in pasos] and 'duracion' in viejo:
            v['duracion'] = viejo['duracion']
            for p, q in zip(pasos, viejo['pasos']): p['inicio'] = q['inicio']
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(v, f, ensure_ascii=False, indent=2); f.write('\n')
    print(f'· paa/{num}.json · {len(pasos)} pasos · {sum(len(p["voz"]) for p in pasos)} letras de voz')
