# Vorka México · videos de Inglés del Simulador PAA (23 a 27, con 24b), estilo pizarrón y explicación sencilla.
# Genera simulador/videos/paa/23.json a 27.json. Uso: python3 _tienda/simulador/videos/ingles.py
# En Inglés se explica en español y los ejemplos van en inglés: el pizarrón marca la pista (since, if, now) y escribe la forma correcta en verde.
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
  "23": ("en_vocab", "Vocabulary & phrasal verbs", [
    paso("La pregunta", "Completa: They had to... the meeting, because the boss was sick. ¿Qué va? Call off, call on, o call up.", [
      E("They had to ____ the meeting", 60, 150, "They had to", tam=62), E("because the boss was sick.", 60, 250, "because the boss", tam=62, id="pista"),
      E("call off  ·  call on  ·  call up", 60, 400, "Call off, call on", "amarillo", 62),
      E("¿Qué va?", 60, 520, "¿Qué va?", "azul", 70),
    ]),
    paso("La idea", "Un phrasal verb es verbo más partícula, y juntos significan otra cosa. Call off no es llamar: es cancelar.", [
      E("verbo + partícula = otra cosa", 60, 160, "verbo más partícula", "amarillo", 62),
      E("call off", 60, 330, "Call off", tam=90, id="co"), E("= llamar", 420, 330, "no es llamar", "rojo", 72, "ll"), T("ll", "no es llamar"),
      E("= cancelar", 420, 470, "es cancelar", "verde", 76, "ca"), C("ca", "es cancelar", "verde"),
    ]),
    paso("La pista", "No traduzcas palabra por palabra. Lee toda la oración: el jefe estaba enfermo. Entonces la reunión se canceló: call off.", [
      E("They had to", 60, 160, "No traduzcas", tam=62), E("call off", 360, 160, "call off.", "verde", 62, "r"),
      E("the meeting", 610, 160, "No traduzcas", tam=62),
      E("because the boss was sick.", 60, 260, "Lee toda", tam=62, id="pista"), S("pista", "el jefe estaba enfermo"),
      C("r", "se canceló", "verde"), P(860, 240, "call off."),
    ]),
    paso("En pareja", "También aprende las palabras en pareja: make an appointment, do homework, take a photo.", [
      E("Aprende en pareja:", 60, 140, "en pareja", "amarillo", 70),
      E("make  an appointment", 60, 270, "make an appointment", tam=70, id="m"),
      E("do  homework", 60, 390, "do homework", tam=70, id="d"), E("take  a photo", 60, 510, "take a photo", tam=70, id="t"),
    ]),
    paso("Cuidado", "Cuidado con make y do. Make es crear algo: make a cake. Do es hacer una tarea: do the dishes.", [
      cuidado(), E("make = crear", 60, 280, "Make es crear", "amarillo", 70), E("→ make a cake", 500, 280, "make a cake", tam=62),
      E("do = una tarea", 60, 430, "Do es hacer", "azul", 70), E("→ do the dishes", 500, 430, "do the dishes", tam=62),
    ]),
    paso("Tu turno", "Tu turno. I need to... my little brother at school at three. ¿Pick up, o put off?", [
      turno(), E("I need to ____ my little brother", 60, 250, "I need to", tam=62), E("at school at three.", 60, 350, "at school", tam=62, id="p"),
      E("pick up  ·  put off", 60, 490, "Pick up", "amarillo", 66, "o"),
    ], pausa=5),
    paso("Tu turno", "Es pick up: recoger. Put off es posponer, y no tiene sentido con tu hermano.", [
      S("p", "Es pick up"), E("pick up = recoger", 560, 490, "recoger", "verde", 56, "ok"), C("ok", "recoger", "verde"),
      E("put off = posponer", 560, 570, "posponer", "rojo", 54),
    ], limpia=False),
    paso("Recuerda", "Recuerda: lee la oración completa, y aprende las palabras en pareja.", [
      recuerda(), E("1. Lee la oración completa", 70, 300, "lee la oración", tam=68), E("2. Aprende en pareja", 70, 430, "en pareja", tam=68, id="u"), S("u", "en pareja."),
    ]),
  ]),

  "24": ("en_grammar", "Conditionals: los «if»", [
    paso("La pregunta", "If it rains tomorrow, we... the game. ¿Cancel, will cancel, o would cancel?", [
      E("If it rains tomorrow,", 60, 160, "If it rains", tam=70, id="if"), E("we ____ the game.", 60, 270, "the game", tam=70),
      E("cancel · will cancel · would cancel", 60, 420, "Cancel, will cancel", "amarillo", 58),
    ]),
    paso("La clave", "La clave está en el tiempo de la parte con if. Ese tiempo te dice qué va en la otra parte.", [
      E("If it rains tomorrow,", 60, 160, "La clave", tam=70, id="if"), E("we ____ the game.", 60, 270, "La clave", tam=70),
      C("if", "la parte con if"), F([300, 190], [300, 225], "la otra parte", "amarillo"),
    ]),
    paso("Presente", "Si el if está en presente, el resultado lleva will: algo posible. Entonces: we will cancel the game.", [
      E("if + presente  →  will", 60, 160, "está en presente", "amarillo", 72, "r1"),
      E("If it rains tomorrow,", 60, 300, "algo posible", tam=66), E("we will cancel the game.", 60, 400, "we will cancel", "verde", 66, "ok"),
      S("ok", "the game.", "verde"), P(820, 380, "the game."),
    ]),
    paso("Pasado", "Si el if está en pasado, el resultado lleva would: algo imaginario. If I had money, I would travel.", [
      E("if + pasado  →  would", 60, 160, "está en pasado", "amarillo", 72),
      E("If I had money,", 60, 300, "If I had money", tam=66, id="h"), E("I would travel.", 60, 400, "I would travel", "verde", 66),
      C("h", "If I had", "rosa"), E("(imaginario)", 560, 300, "algo imaginario", "azul", 56),
    ]),
    paso("Had", "Y si el if lleva had más participio, el resultado lleva would have: un pasado que ya no cambia. If she had studied, she would have passed.", [
      E("if + had + participio  →  would have", 60, 160, "had más participio", "amarillo", 58),
      E("If she had studied,", 60, 300, "If she had studied", tam=66), E("she would have passed.", 60, 400, "she would have passed", "verde", 66),
      E("(ya no cambia)", 560, 300, "ya no cambia", "azul", 56),
    ]),
    paso("Cuidado", "Cuidado: nunca pongas will después de if. No se dice if it will rain. Se dice if it rains.", [
      cuidado(), E("if it will rain", 60, 300, "No se dice", "rojo", 80, "mal"), T("mal", "Se dice"),
      E("if it rains", 60, 450, "if it rains.", "verde", 80, "bien"), C("bien", "if it rains.", "verde"),
    ]),
    paso("Tu turno", "Tu turno. If I had time, I... you. ¿Will help, o would help?", [
      turno(), E("If I had time,", 60, 250, "If I had time", tam=72, id="h"), E("I ____ you.", 60, 360, "I... you", tam=72),
      E("will help  ·  would help", 60, 500, "Will help", "amarillo", 66),
    ], pausa=5),
    paso("Tu turno", "El if está en pasado: had. Entonces va would: I would help you.", [
      C("h", "en pasado"), E("→ would help", 470, 360, "va would", "verde", 72, "ok"), S("ok", "I would help", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: mira el tiempo del if. Presente, will. Pasado, would. Had, would have.", [
      recuerda(), E("presente → will", 70, 270, "Presente, will", tam=68), E("pasado → would", 70, 380, "Pasado, would", tam=68),
      E("had → would have", 70, 490, "Had, would have", tam=68, id="u"), S("u", "would have."),
    ]),
  ]),

  "24b": ("en_grammar", "Tenses: qué tiempo usar", [
    paso("La pregunta", "I... here since twenty twenty. ¿Live, lived, o have lived?", [
      E("I ____ here", 60, 170, "I...", tam=76), E("since 2020.", 400, 170, "since twenty", "amarillo", 76, "s"),
      E("live · lived · have lived", 60, 360, "Live, lived", "amarillo", 66),
    ]),
    paso("La pista", "Since y for son pistas: algo que empezó en el pasado y sigue hasta hoy. Eso es present perfect: have más participio.", [
      E("since / for", 60, 150, "Since y for", "amarillo", 76, "sf"), C("sf", "son pistas"),
      E("pasado", 60, 300, "empezó en el pasado", tam=66), F([270, 280], [600, 280], "sigue hasta hoy", "amarillo"), E("hoy", 640, 300, "hasta hoy", tam=66),
      E("= have + participio", 60, 460, "have más participio", "verde", 72),
    ]),
    paso("Since o for", "Since va con un punto de inicio: since twenty twenty, since Monday. For va con una cantidad de tiempo: for three years.", [
      E("since + inicio", 60, 170, "Since va con", "amarillo", 70), E("since 2020 · since Monday", 60, 270, "since Monday", tam=60),
      E("for + cantidad", 60, 410, "For va con", "azul", 70), E("for three years", 60, 510, "for three years", tam=60),
    ]),
    paso("La respuesta", "Entonces: I have lived here since twenty twenty.", [
      E("I have lived here", 60, 250, "I have lived", "verde", 76, "ok"), E("since 2020.", 60, 370, "since twenty", "amarillo", 76),
      S("ok", "have lived", "verde"), P(700, 230, "since twenty"),
    ]),
    paso("Otras pistas", "Otras pistas: now pide el continuo, I am studying now. Yesterday pide el pasado simple, I studied yesterday.", [
      E("now", 60, 200, "now pide", "amarillo", 76, "n"), E("→ I am studying now", 300, 200, "I am studying", "verde", 62),
      E("yesterday", 60, 400, "Yesterday pide", "amarillo", 70, "y"), E("→ I studied", 420, 400, "I studied", "verde", 62),
    ]),
    paso("Cuidado", "Cuidado: con yesterday nunca uses have. No es I have seen him yesterday. Es I saw him yesterday.", [
      cuidado(), E("I have seen him yesterday", 60, 300, "No es", "rojo", 66, "mal"), T("mal", "Es I saw"),
      E("I saw him yesterday", 60, 450, "I saw him", "verde", 66, "bien"), C("bien", "Es I saw", "verde"),
    ]),
    paso("Tu turno", "Tu turno. She... English for five years. ¿Studies, o has studied?", [
      turno(), E("She ____ English", 60, 250, "She...", tam=72), E("for five years.", 60, 360, "for five years", tam=72, id="f"),
      E("studies  ·  has studied", 60, 500, "Studies", "amarillo", 66),
    ], pausa=5),
    paso("Tu turno", "La pista es for five years, y sigue hasta hoy: has studied.", [
      C("f", "La pista es"), E("→ has studied", 520, 250, "has studied", "verde", 66, "ok"), S("ok", "has studied", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: busca la palabra de tiempo. Since o for, present perfect. Now, continuo. Yesterday, pasado.", [
      recuerda(), E("since / for → have + participio", 70, 270, "Since o for", tam=60), E("now → continuo (-ing)", 70, 380, "Now, continuo", tam=60),
      E("yesterday → pasado", 70, 490, "Yesterday, pasado", tam=60, id="u"), S("u", "pasado."),
    ]),
  ]),

  "25": ("en_structure", "Sentence structure", [
    paso("La pregunta", "¿Cuál está bien? Where you live? O: where do you live?", [
      E("A) Where you live?", 60, 200, "Where you live", tam=76, id="a"), E("B) Where do you live?", 60, 330, "where do you", tam=76, id="b"),
      E("¿Cuál está bien?", 60, 490, "¿Cuál está", "azul", 70),
    ]),
    paso("El orden", "En las preguntas, el orden es fijo: palabra con wh, auxiliar, sujeto y verbo.", [
      E("Wh-", 60, 200, "palabra con wh", "amarillo", 70), E("+ auxiliar", 220, 200, "auxiliar", "amarillo", 70),
      E("+ sujeto", 530, 200, "sujeto", "amarillo", 70), E("+ verbo", 780, 200, "y verbo", "amarillo", 70),
    ]),
    paso("Aplícalo", "Where, do, you, live. Por eso es la B.", [
      E("Where", 60, 380, "Where, do", tam=76), E("do", 280, 380, "do, you", tam=76), E("you", 540, 380, "you, live", tam=76), E("live?", 790, 380, "live.", tam=76),
      E("Es la B", 60, 530, "Por eso", "verde", 72, "ok"), C("ok", "es la B", "verde"),
    ], limpia=False),
    paso("Listas", "Otra que sale mucho: en listas, todo con la misma forma. I like swimming, running and reading.", [
      E("Listas: misma forma", 60, 150, "en listas", "amarillo", 70),
      E("I like swimming, running", 60, 300, "I like swimming", "verde", 66), E("and reading.", 60, 400, "and reading", "verde", 66),
      E("-ing  -ing  -ing", 560, 400, "misma forma", "azul", 60),
    ]),
    paso("Cuidado", "Cuidado con la pregunta dentro de una oración: do you know where he lives? Aquí ya no va el auxiliar. No es where does he live.", [
      cuidado(), E("Do you know where he lives?", 60, 290, "do you know", "verde", 66, "bien"),
      E("…where does he live?", 60, 440, "No es where", "rojo", 66, "mal"), T("mal", "No es where"), S("bien", "ya no va", "verde"),
    ]),
    paso("Tu turno", "Tu turno. ¿Cuál está bien? A: what she is doing? B: what is she doing?", [
      turno(), E("A) What she is doing?", 60, 260, "A: what", tam=72, id="a"), E("B) What is she doing?", 60, 380, "B: what", tam=72, id="b"),
    ], pausa=5),
    paso("Tu turno", "Es la B: what, is, she, doing. Primero el auxiliar, luego el sujeto.", [
      C("b", "Es la B", "verde"), T("a", "Primero el auxiliar"), E("auxiliar → sujeto", 60, 520, "luego el sujeto", "verde", 62),
    ], limpia=False),
    paso("Recuerda", "Recuerda: wh, auxiliar, sujeto, verbo. Y en listas, la misma forma.", [
      recuerda(), E("Wh + auxiliar + sujeto + verbo", 70, 300, "wh, auxiliar", tam=62), E("listas: misma forma", 70, 430, "en listas", tam=66, id="u"), S("u", "la misma forma"),
    ]),
  ]),

  "26": ("en_reading", "Reading comprehension", [
    paso("La pregunta", "Lee: Maya used to hate mornings. Now, she wakes up early to run before school. What changed? A: she hates running. B: she enjoys mornings now.", [
      E("Maya used to hate mornings.", 60, 140, "Maya used to", tam=62, id="u"), E("Now, she wakes up early", 60, 230, "Now, she wakes", tam=62, id="n"),
      E("to run before school.", 60, 320, "to run before", tam=62),
      E("A) She hates running.", 60, 440, "A: she hates", "amarillo", 58, "a"), E("B) She enjoys mornings now.", 60, 530, "B: she enjoys", "amarillo", 58, "b"),
    ]),
    paso("Primero", "Primero lee la pregunta, después el texto. Así sabes qué buscar.", [
      E("1. La pregunta", 60, 220, "Primero lee", "amarillo", 76), F([150, 260], [150, 340], "después el texto", "amarillo"),
      E("2. El texto", 60, 420, "después el texto", tam=76), E("(sabes qué buscar)", 450, 420, "qué buscar", "azul", 56),
    ]),
    paso("Las pistas", "Busca palabras de cambio: used to es antes, now es ahora. Antes odiaba las mañanas; ahora se levanta temprano.", [
      E("Maya used to hate mornings.", 60, 140, "Busca palabras", tam=62, id="u"), E("Now, she wakes up early", 60, 230, "Busca palabras", tam=62, id="n"),
      E("to run before school.", 60, 320, "Busca palabras", tam=62),
      E("A) She hates running.", 60, 440, "Busca palabras", "amarillo", 58, "a"), E("B) She enjoys mornings now.", 60, 530, "Busca palabras", "amarillo", 58, "b"),
      S("u", "used to es antes", "rojo"), E("antes", 790, 140, "es antes", "rojo", 50), S("n", "now es ahora", "verde"), E("ahora", 700, 230, "es ahora", "verde", 50),
    ]),
    paso("La respuesta", "Entonces es la B. La A dice algo que el texto no dice.", [
      C("b", "es la B", "verde"), T("a", "La A dice"), P(860, 510, "es la B"),
    ], limpia=False),
    paso("La actitud", "Para la actitud del autor, busca palabras con emoción: amazing, sadly, unfortunately. Ahí está su opinión.", [
      E("Actitud del autor:", 60, 150, "la actitud", "amarillo", 70),
      E("amazing · sadly · unfortunately", 60, 300, "amazing, sadly", tam=62, id="e"), S("e", "con emoción"),
      E("= su opinión", 60, 450, "su opinión", "verde", 72),
    ]),
    paso("Cuidado", "Cuidado con la opción que copia palabras del texto: tiene las mismas palabras, pero dice otra cosa.", [
      cuidado(), E("mismas palabras", 60, 290, "las mismas palabras", "amarillo", 72), E("≠ misma idea", 60, 430, "dice otra cosa", "rojo", 72),
    ]),
    paso("Tu turno", "Tu turno. Sadly, the old library closed last week. ¿Cómo se siente el autor? Happy, sad, o angry.", [
      turno(), E("Sadly, the old library", 60, 250, "Sadly, the old", tam=70, id="s"), E("closed last week.", 60, 350, "closed last week", tam=70),
      E("happy  ·  sad  ·  angry", 60, 500, "Happy, sad", "amarillo", 66),
    ], pausa=5),
    paso("Tu turno", "Es sad: la pista es sadly.", [
      E("→ sad", 560, 500, "Es sad", "verde", 72, "ok"), C("ok", "Es sad", "verde"), S("s", "la pista es sadly"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: primero la pregunta, y busca las palabras que dan la pista.", [
      recuerda(), E("1. Primero la pregunta", 70, 300, "primero la pregunta", tam=68), E("2. Busca la palabra pista", 70, 430, "busca las palabras", tam=68, id="u"), S("u", "dan la pista"),
    ]),
  ]),

  "27": ("en_writing", "Indirect writing", [
    paso("La pregunta", "¿Dónde está el error? Everyone in my class have a phone.", [
      E("Everyone in my class", 60, 200, "Everyone in my class", tam=72, id="s"), E("have a phone.", 60, 310, "have a phone", tam=72, id="v"),
      E("¿Dónde está el error?", 60, 480, "¿Dónde está", "azul", 70),
    ]),
    paso("Sujeto y verbo", "Primero revisa el sujeto y el verbo: everyone, each y nobody van en singular. Entonces: everyone has.", [
      E("Everyone in my class", 60, 160, "Primero revisa", tam=72, id="s"), E("have a phone.", 60, 270, "Primero revisa", tam=72, id="v"),
      C("s", "el sujeto y"), T("v", "van en singular"), E("everyone · each · nobody = singular", 60, 400, "everyone, each", "amarillo", 56),
      E("→ Everyone… has a phone.", 60, 530, "everyone has", "verde", 66, "ok"), S("ok", "everyone has", "verde"),
    ]),
    paso("Conectores", "Luego revisa los conectores: however es contraste, because es causa, although es aunque.", [
      E("however  = pero (contraste)", 60, 170, "however es contraste", tam=62), E("because  = porque (causa)", 60, 300, "because es causa", tam=62),
      E("although  = aunque", 60, 430, "although es aunque", tam=62),
    ]),
    paso("Ejemplo", "Por ejemplo: I was tired; however, I finished. Estaba cansado, pero terminé: es contraste.", [
      E("I was tired;", 60, 250, "I was tired", tam=72), E("however,", 430, 250, "however, I finished", "amarillo", 72, "h"),
      E("I finished.", 60, 360, "I finished", tam=72), C("h", "es contraste"), E("contraste ✓", 60, 500, "es contraste", "verde", 66),
    ]),
    paso("Cuidado", "Cuidado: although y but no van juntos. No es although it rained, but we played. Usa solo uno.", [
      cuidado(), E("Although it rained, but we played.", 60, 300, "No es although", "rojo", 56, "mal"), T("mal", "Usa solo uno"),
      E("Although it rained, we played.", 60, 450, "Usa solo uno", "verde", 56),
    ]),
    paso("Tu turno", "Tu turno. ¿Dónde está el error? Each of the students are ready.", [
      turno(), E("Each of the students", 60, 260, "Each of the", tam=72, id="s"), E("are ready.", 60, 370, "are ready", tam=72, id="v"),
      E("¿Dónde está el error?", 60, 510, "¿Dónde está", "azul", 66),
    ], pausa=5),
    paso("Tu turno", "Each va en singular: each of the students is ready.", [
      C("s", "Each va"), T("v", "en singular"), E("→ is ready", 400, 370, "is ready", "verde", 72, "ok"), S("ok", "is ready", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: primero el sujeto y el verbo, después el conector.", [
      recuerda(), E("1. Sujeto + verbo", 70, 300, "primero el sujeto"), E("2. El conector", 70, 430, "después el conector", id="u"), S("u", "el conector."),
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
