# Vorka México · videos de Redacción del Simulador PAA (15 a 22), estilo pizarrón y explicación sencilla.
# Genera simulador/videos/paa/15.json a 22.json. Uso: python3 _tienda/simulador/videos/redaccion.py
# En Redacción el pizarrón escribe una oración, marca el error (tacha o encierra) y escribe la versión correcta en verde.
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
  "15": ("concordancia", "Concordancia: ¿quién hace la acción?", [
    paso("La pregunta", "¿Está bien esta oración? La caja de los lápices están en la mesa.", [
      E("La caja", 60, 180, "La caja", tam=72, id="caja"), E("de los lápices", 280, 180, "de los lápices", tam=72, id="de"),
      E("están", 60, 300, "están", "amarillo", 72, "v"), E("en la mesa.", 225, 300, "en la mesa", tam=72),
      E("¿Está bien?", 60, 480, "¿Está bien", "azul", 76),
    ]),
    paso("La idea", "El verbo concuerda con quien hace la acción. Y quien hace la acción no es lo que va después del de.", [
      E("verbo  =  quien hace la acción", 60, 180, "El verbo concuerda", "amarillo", 62),
      E("lo que va después del «de»", 60, 340, "lo que va después", tam=62, id="no"), T("no", "no es lo que"),
    ]),
    paso("Tapa el de", "Tapa lo que va después del de. Queda: la caja están. Suena mal. Lo correcto es: la caja está.", [
      E("La caja", 60, 180, "Tapa lo que", tam=72, id="caja"), E("de los lápices", 280, 180, "después del de", tam=72, id="de"),
      E("están", 60, 300, "Queda", "amarillo", 72, "v"), E("en la mesa.", 225, 300, "Queda", tam=72),
      T("de", "la caja están"), C("caja", "Suena mal"), T("v", "Suena mal"),
      E("La caja está en la mesa.", 60, 470, "Lo correcto", "verde", 72, "ok"), S("ok", "la caja está", "verde"),
    ]),
    paso("Cuidado", "Cuidado con el se. Se venden casas: el verbo va en plural porque concuerda con casas.", [
      cuidado(), E("Se vende casas", 60, 290, "Cuidado con el se", "rojo", 76, "mal"), T("mal", "Se venden"),
      E("Se venden casas", 60, 440, "Se venden casas", "verde", 76, "bien"),
      C("bien", "en plural", "verde"), F([620, 420], [700, 420], "concuerda con casas", "verde"), E("casas", 720, 440, "concuerda con casas", "verde", 60),
    ]),
    paso("Tu turno", "Tu turno. El grupo de alumnos llegaron tarde. ¿Qué cambia?", [
      turno(), E("El grupo", 60, 260, "El grupo", tam=72, id="g"), E("de alumnos", 290, 260, "de alumnos", tam=72, id="de"),
      E("llegaron tarde.", 60, 370, "llegaron tarde", tam=72, id="v"), E("¿Qué cambia?", 60, 470, "¿Qué cambia", "azul", 72),
    ], pausa=5),
    paso("Tu turno", "Tapa de alumnos. Queda: el grupo llegaron. Debe ser: el grupo llegó.", [
      T("de", "Tapa de alumnos"), C("g", "el grupo llegaron"), T("v", "el grupo llegaron"),
      E("→ El grupo llegó tarde.", 60, 575, "Debe ser", "verde", 62, "ok"), S("ok", "el grupo llegó", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: tapa lo que va después del de, y pregúntate quién hace la acción.", [
      recuerda(), E("1. Tapa el «de…»", 70, 300, "tapa lo que va"), E("2. ¿Quién hace la acción?", 70, 430, "quién hace la acción", id="u"), S("u", "la acción"),
    ]),
  ]),

  "16": ("puntuacion", "Puntuación", [
    paso("La pregunta", "¿Dónde está el error? Los alumnos del grupo tres, ganaron el concurso.", [
      E("Los alumnos del grupo tres", 60, 180, "Los alumnos", tam=66, id="suj"), E(",", 672, 180, "grupo tres", "amarillo", 80, "coma"),
      E("ganaron el concurso.", 60, 300, "ganaron el concurso", tam=66, id="verb"),
      E("¿Dónde está el error?", 60, 480, "¿Dónde está", "azul", 72),
    ]),
    paso("La regla", "La regla que más sale: nunca pongas coma entre el sujeto y el verbo. ¿Quién ganó? Los alumnos del grupo tres. ¿Qué hicieron? Ganaron. Entre los dos, nada de coma.", [
      S("suj", "¿Quién ganó?", "azul"), E("sujeto", 70, 240, "¿Quién ganó?", "azul", 46),
      S("verb", "¿Qué hicieron?", "verde"), E("verbo", 70, 360, "¿Qué hicieron?", "verde", 46),
      C("coma", "nada de coma", "rojo"), T("coma", "nada de coma"),
    ], limpia=False),
    paso("Sí va coma", "Sí va coma cuando le hablas a alguien: Ana, ven. Y para un dato extra en medio: mi hermano, que es doctor, vino.", [
      E("Sí va coma:", 60, 130, "Sí va coma", "amarillo", 70),
      E("Ana, ven.", 60, 260, "Ana, ven", tam=72, id="a"), E("← le hablas a alguien", 360, 260, "le hablas", "verde", 52),
      E("Mi hermano, que es doctor, vino.", 60, 420, "mi hermano", tam=62, id="h"),
      E("dato extra", 330, 500, "dato extra", "verde", 52), F([400, 470], [400, 440], "en medio", "verde"),
    ]),
    paso("Punto y coma", "Y antes de sin embargo va punto y coma: estudié mucho; sin embargo, reprobé.", [
      E("Estudié mucho", 60, 250, "estudié mucho", tam=66), E(";", 440, 250, "punto y coma", "amarillo", 90, "pc"),
      E("sin embargo, reprobé.", 60, 370, "sin embargo, reprobé", tam=66), C("pc", "punto y coma:"),
    ]),
    paso("Tu turno", "Tu turno. ¿Cuál está bien? A: Mi perro, ladra mucho. B: Mi perro ladra mucho.", [
      turno(), E("A)  Mi perro, ladra mucho.", 60, 270, "A: Mi perro", tam=70, id="a"),
      E("B)  Mi perro ladra mucho.", 60, 390, "B: Mi perro", tam=70, id="b"), E("¿Cuál está bien?", 60, 520, "¿Cuál está", "azul", 66),
    ], pausa=5),
    paso("Tu turno", "Es la B. Mi perro es el sujeto y ladra es el verbo: no los separes.", [
      C("b", "Es la B", "verde"), T("a", "no los separes"), P(880, 360, "Es la B"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: sujeto y verbo van juntos, sin coma.", [
      recuerda(), E("sujeto + verbo", 70, 300, "sujeto y verbo"), E("= juntos, sin coma", 70, 430, "sin coma", id="u"), S("u", "sin coma"),
    ]),
  ]),

  "17": ("ortografia", "Ortografía y acentuación", [
    paso("La pregunta", "¿Lleva acento? Camion, arbol, musica.", [
      E("camion", 60, 220, "Camion", tam=80), E("arbol", 380, 220, "arbol", tam=80), E("musica", 650, 220, "musica", tam=80),
      E("¿Lleva acento?", 60, 450, "¿Lleva acento", "azul", 76),
    ]),
    paso("La fuerte", "Primero busca la sílaba que suena más fuerte. Ca, mión. Ár, bol. Mú, si, ca.", [
      E("ca-MIÓN", 60, 220, "Ca, mión", "amarillo", 80, "a"), E("ÁR-bol", 380, 220, "Ár, bol", "amarillo", 80, "b"), E("MÚ-si-ca", 650, 220, "Mú, si, ca", "amarillo", 80, "c"),
      S("a", "Ca, mión"), S("b", "Ár, bol"), S("c", "Mú, si, ca"),
    ]),
    paso("Las reglas", "Si la fuerte es la última, es aguda: lleva acento si termina en n, s o vocal. Si es la penúltima, es grave: lleva si no termina en n, s o vocal. Y si es antes, es esdrújula: siempre lleva.", [
      E("aguda:  termina en n, s, vocal → ✓", 60, 150, "es aguda", tam=56), E("camión", 760, 220, "lleva acento si", "verde", 60, "ca"),
      E("grave:  NO termina en n, s, vocal → ✓", 60, 320, "es grave", tam=56), E("árbol", 760, 390, "lleva si no", "verde", 60, "ar"),
      E("esdrújula:  siempre ✓", 60, 490, "esdrújula", tam=56), E("música", 760, 560, "siempre lleva", "verde", 60, "mu"),
    ]),
    paso("Cuidado", "Cuidado con las parejas. Él con acento es persona; el sin acento va antes de una cosa. Tú es persona; tu es de algo. Y hay es de haber, ahí es lugar, ay es queja.", [
      cuidado(), E("él = persona   ·   el = el libro", 60, 260, "Él con acento", tam=60),
      E("tú = persona   ·   tu = tu libro", 60, 370, "Tú es persona", tam=60),
      E("hay = haber · ahí = lugar · ay = queja", 60, 480, "hay es de haber", tam=56),
    ]),
    paso("Tu turno", "Tu turno. ¿Lleva acento la palabra lapiz?", [
      turno(), E("lapiz", 60, 320, "lapiz", tam=110, id="l"), E("¿Lleva acento?", 60, 500, "¿Lleva acento", "azul", 72),
    ], pausa=5),
    paso("Tu turno", "Suena: lá, piz. Es grave, y termina en z, no en n, s o vocal. Sí lleva: lápiz.", [
      E("LÁ-piz", 560, 320, "lá, piz", "amarillo", 80), E("grave + z → ✓", 560, 420, "Es grave", tam=60),
      E("lápiz", 600, 530, "Sí lleva", "verde", 80, "ok"), C("ok", "Sí lleva", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: primero encuentra la fuerte, luego aplica la regla.", [
      recuerda(), E("1. ¿Cuál suena fuerte?", 70, 300, "encuentra la fuerte"), E("2. Aplica la regla", 70, 430, "aplica la regla", id="u"), S("u", "la regla"),
    ]),
  ]),

  "18": ("conectores", "Conectores: la relación entre las ideas", [
    paso("La pregunta", "Estudié toda la noche... saqué diez. ¿Qué conector va en medio? Sin embargo, por eso, o además.", [
      E("Estudié toda la noche, ____", 60, 160, "Estudié toda", tam=64), E("saqué diez.", 60, 260, "saqué diez", tam=64),
      E("sin embargo  ·  por eso  ·  además", 60, 400, "Sin embargo, por eso", "amarillo", 58),
      E("¿Qué conector va?", 60, 520, "¿Qué conector", "azul", 66),
    ]),
    paso("La relación", "Antes de ver las opciones, pregúntate: ¿cómo se relacionan las dos ideas?", [
      E("idea 1", 80, 280, "las dos ideas", tam=76, id="i1"), E("idea 2", 700, 280, "las dos ideas", tam=76, id="i2"),
      F([320, 260], [660, 260], "cómo se relacionan", "amarillo"), E("¿?", 460, 230, "cómo se relacionan", "amarillo", 76),
    ]),
    paso("Las familias", "Si una causa la otra: por eso, así que. Si chocan: sin embargo, pero. Si se suman: además, también.", [
      E("causa →  por eso, así que", 60, 170, "una causa", "verde", 64),
      E("chocan →  sin embargo, pero", 60, 320, "Si chocan", "rojo", 64),
      E("se suman →  además, también", 60, 470, "se suman", "azul", 64),
    ]),
    paso("La respuesta", "Estudié y saqué diez: una causa la otra. Va por eso.", [
      E("Estudié toda la noche,", 60, 220, "Estudié y", tam=64), E("por eso", 640, 220, "Va por eso", "verde", 64, "ok"),
      E("saqué diez.", 60, 330, "saqué diez", tam=64), C("ok", "Va por eso", "verde"), P(500, 470, "Va por eso"),
    ]),
    paso("Cuidado", "Cuidado: sin embargo suena elegante, pero es para ideas que chocan. Úsalo solo si de verdad se oponen.", [
      cuidado(), E("sin embargo", 60, 300, "sin embargo suena", "amarillo", 80, "se"),
      E("= ideas que chocan", 60, 440, "ideas que chocan", "rojo", 72), C("se", "elegante"),
    ]),
    paso("Tu turno", "Tu turno. Llovió mucho... el partido siguió. ¿Qué conector va?", [
      turno(), E("Llovió mucho, ____", 60, 250, "Llovió mucho", tam=70), E("el partido siguió.", 60, 360, "el partido siguió", tam=70),
      E("¿Qué conector va?", 60, 500, "¿Qué conector", "azul", 70),
    ], pausa=5),
    paso("Tu turno", "Llovía, pero se jugó: chocan. Va sin embargo.", [
      E("sin embargo", 560, 250, "Va sin embargo", "verde", 66, "ok"), C("ok", "Va sin embargo", "verde"), E("chocan", 560, 500, "chocan", "rojo", 66),
    ], limpia=False),
    paso("Recuerda", "Recuerda: primero la relación, después el conector.", [
      recuerda(), E("1. ¿Cómo se relacionan?", 70, 300, "primero la relación"), E("2. Elige el conector", 70, 430, "después el conector", id="u"), S("u", "el conector"),
    ]),
  ]),

  "19": ("orden_logico", "Orden lógico", [
    paso("La pregunta", "Ordena estas oraciones. A: después, sirve el agua en la taza. B: primero, hierve el agua. C: por último, agrega el té.", [
      E("A) Después, sirve el agua en la taza.", 60, 160, "A: después", tam=58, id="a"),
      E("B) Primero, hierve el agua.", 60, 280, "B: primero", tam=58, id="b"),
      E("C) Por último, agrega el té.", 60, 400, "C: por último", tam=58, id="c"),
      E("¿En qué orden?", 60, 530, "Ordena", "azul", 66),
    ]),
    paso("Las marcas", "Busca las palabras de orden: primero, después, por último. Ellas te dicen dónde va cada una.", [
      C("b", "primero,", "amarillo"), C("a", "después,", "amarillo"), C("c", "por último", "amarillo"),
    ], limpia=False),
    paso("La respuesta", "Entonces: primero la B, luego la A y al final la C.", [
      E("B", 140, 300, "primero la B", "verde", 130), F([250, 260], [380, 260], "luego la A", "verde"),
      E("A", 420, 300, "luego la A", "verde", 130), F([530, 260], [660, 260], "al final", "verde"), E("C", 700, 300, "la C", "verde", 130),
    ]),
    paso("La primera", "Si no hay palabras de orden, busca la que presenta el tema. Esa va primero.", [
      E("Sin marcas:", 60, 180, "Si no hay", "amarillo", 70),
      E("la que presenta el tema", 60, 330, "presenta el tema", tam=72, id="p"), E("→ va primero", 60, 450, "va primero", "verde", 72), S("p", "presenta"),
    ]),
    paso("Cuidado", "Cuidado: una oración que empieza con por eso o también nunca va primero, porque necesita algo antes.", [
      cuidado(), E("«Por eso…»  «También…»", 60, 300, "por eso o también", "amarillo", 72, "x"),
      E("nunca van primero", 60, 440, "nunca va primero", "rojo", 72), S("x", "algo antes", "rojo"),
    ]),
    paso("Tu turno", "Tu turno. A: por eso, se quedó en casa. B: ayer amaneció con fiebre. C: al día siguiente, ya se sentía mejor.", [
      turno(), E("A) Por eso, se quedó en casa.", 60, 240, "A: por eso", tam=58, id="a"),
      E("B) Ayer amaneció con fiebre.", 60, 350, "B: ayer", tam=58, id="b"),
      E("C) Al día siguiente, ya se sentía mejor.", 60, 460, "C: al día", tam=54, id="c"),
    ], pausa=5),
    paso("Tu turno", "La B va primero: presenta lo que pasó. Luego la A, por el por eso. Y al final la C, al día siguiente.", [
      C("b", "La B va primero", "verde"), E("1", 880, 350, "La B va", "verde", 70),
      E("2", 880, 240, "Luego la A", "verde", 70), E("3", 900, 460, "al final la C", "verde", 70),
    ], limpia=False),
    paso("Recuerda", "Recuerda: busca la que presenta, y sigue las palabras de orden.", [
      recuerda(), E("1. La que presenta va primero", 70, 300, "busca la que presenta", tam=66), E("2. Sigue las marcas de orden", 70, 430, "palabras de orden", tam=66, id="u"), S("u", "de orden"),
    ]),
  ]),

  "20": ("coherencia", "Coherencia y unidad", [
    paso("La pregunta", "¿Qué oración sobra? Las abejas polinizan las flores. Sin ellas, habría menos frutas. Las avispas también pican. Por eso, cuidarlas es cuidar la comida.", [
      E("1. Las abejas polinizan las flores.", 60, 130, "Las abejas polinizan", tam=56, id="o1"),
      E("2. Sin ellas, habría menos frutas.", 60, 230, "habría menos frutas", tam=56, id="o2"),
      E("3. Las avispas también pican.", 60, 330, "avispas también pican", tam=56, id="o3"),
      E("4. Por eso, cuidarlas es cuidar la comida.", 60, 430, "cuidar la comida", tam=52, id="o4"),
      E("¿Qué oración sobra?", 60, 540, "¿Qué oración sobra", "azul", 64),
    ]),
    paso("Una línea", "Primero di en una línea de qué trata: las abejas son importantes para la comida.", [
      E("De qué trata:", 60, 170, "Primero di", "amarillo", 70),
      E("abejas → importantes", 60, 320, "las abejas son importantes", "verde", 76, "l"), E("para la comida", 60, 440, "para la comida", "verde", 76), S("l", "importantes"),
    ]),
    paso("Compara", "Compara cada oración con esa línea. La tres habla de avispas y de picar: esa sobra.", [
      E("1. Las abejas polinizan las flores.", 60, 130, "Compara", tam=56, id="o1"),
      E("2. Sin ellas, habría menos frutas.", 60, 230, "cada oración", tam=56, id="o2"),
      E("3. Las avispas también pican.", 60, 330, "cada oración", tam=56, id="o3"),
      E("4. Por eso, cuidarlas es cuidar la comida.", 60, 430, "con esa línea", tam=52, id="o4"),
      P(900, 110, "con esa línea"), P(900, 210, "con esa línea"), P(900, 410, "con esa línea"),
      C("o3", "La tres", "rojo"), T("o3", "esa sobra"),
    ]),
    paso("Cuidado", "Cuidado: la que sobra suele ser del mismo tema general, como insectos, pero no de la idea del párrafo.", [
      cuidado(), E("mismo tema general  (insectos)", 60, 300, "mismo tema general", "amarillo", 64),
      E("≠ la idea del párrafo", 60, 440, "no de la idea", "rojo", 72),
    ]),
    paso("Tu turno", "Tu turno. Un párrafo sobre ahorrar agua: cierra la llave al lavarte los dientes. Báñate en cinco minutos. El mar es salado. Así cuidas el agua.", [
      turno(), E("1. Cierra la llave al lavarte los dientes.", 60, 220, "cierra la llave", tam=52, id="o1"),
      E("2. Báñate en cinco minutos.", 60, 320, "Báñate", tam=52, id="o2"),
      E("3. El mar es salado.", 60, 420, "El mar es salado", tam=52, id="o3"),
      E("4. Así cuidas el agua.", 60, 520, "Así cuidas", tam=52, id="o4"),
    ], pausa=5),
    paso("Tu turno", "Sobra la tres: habla de agua, pero no de cómo ahorrarla.", [
      C("o3", "Sobra la tres", "rojo"), T("o3", "habla de agua"), E("no ahorra agua", 560, 420, "no de cómo", "rojo", 56),
    ], limpia=False),
    paso("Recuerda", "Recuerda: di de qué trata en una línea. La que no cabe en esa línea, sobra.", [
      recuerda(), E("1. ¿De qué trata? (una línea)", 70, 300, "en una línea", tam=66), E("2. La que no cabe, sobra", 70, 430, "no cabe", tam=66, id="u"), S("u", "sobra."),
    ]),
  ]),

  "21": ("combinacion", "Combinación de oraciones", [
    paso("La pregunta", "Une estas dos oraciones en una: Luis perdió el camión. Luis llegó tarde.", [
      E("Luis perdió el camión.", 60, 200, "Luis perdió", tam=72), E("Luis llegó tarde.", 60, 320, "Luis llegó", tam=72),
      E("¿Cómo las unes?", 60, 490, "Une estas", "azul", 72),
    ]),
    paso("Tres reglas", "La mejor unión cumple tres cosas: no pierde información, no repite al sujeto, y usa el nexo correcto.", [
      E("La mejor unión:", 60, 130, "La mejor unión", "amarillo", 70),
      E("1. No pierde información", 60, 260, "no pierde", tam=66), E("2. No repite al sujeto", 60, 370, "no repite", tam=66),
      E("3. Usa el nexo correcto", 60, 480, "el nexo correcto", tam=66, id="u"), S("u", "nexo correcto"),
    ]),
    paso("La relación", "¿Cómo se relacionan? Perdió el camión, y por eso llegó tarde: es causa. El nexo de causa es porque.", [
      E("perdió el camión", 60, 250, "Perdió el camión", tam=66), F([520, 230], [640, 230], "por eso", "amarillo"),
      E("llegó tarde", 660, 250, "llegó tarde", tam=66), E("causa  →  porque", 60, 430, "es causa", "verde", 76, "c"), C("c", "es porque", "verde"),
    ]),
    paso("La respuesta", "Queda: Luis llegó tarde porque perdió el camión. Tiene todo, y Luis aparece una sola vez.", [
      E("Luis llegó tarde", 60, 230, "Queda", "verde", 72), E("porque", 560, 230, "porque perdió", "amarillo", 72, "p"),
      E("perdió el camión.", 60, 340, "perdió el camión", "verde", 72), C("p", "Tiene todo"), P(700, 460, "una sola vez"),
    ]),
    paso("Cuidado", "Cuidado con dos trampas: la que repite, Luis perdió el camión y Luis llegó tarde. Y la que cambia el sentido: llegó tarde aunque perdió el camión.", [
      cuidado(), E("Luis perdió… y Luis llegó…", 60, 290, "la que repite", tam=62, id="r"), T("r", "y Luis llegó tarde"),
      E("…aunque perdió el camión", 60, 440, "cambia el sentido", tam=62, id="a"), T("a", "aunque perdió"),
    ]),
    paso("Tu turno", "Tu turno. Une: mi tía tiene un gato. El gato es naranja.", [
      turno(), E("Mi tía tiene un gato.", 60, 260, "mi tía tiene", tam=72), E("El gato es naranja.", 60, 380, "El gato es naranja", tam=72),
      E("¿Cómo las unes?", 60, 510, "Une", "azul", 66),
    ], pausa=5),
    paso("Tu turno", "Queda: mi tía tiene un gato naranja. No repites el gato y no pierdes nada.", [
      E("Mi tía tiene un gato naranja.", 60, 260, "Queda", "verde", 66, "ok"), P(870, 230, "no pierdes nada"),
    ], limpia=True),
    paso("Recuerda", "Recuerda: todo junto, sin repetir, y con el nexo que dice la relación.", [
      recuerda(), E("todo junto, sin repetir", 70, 300, "todo junto"), E("+ el nexo correcto", 70, 430, "con el nexo", id="u"), S("u", "la relación"),
    ]),
  ]),

  "22": ("titulo_cierre", "Título y cierre", [
    paso("La pregunta", "Un texto habla de cómo el ruido de la ciudad afecta el sueño, la salud y el humor. ¿Qué título va? A: los coches. B: el ruido nos enferma. C: la vida en el campo.", [
      E("Texto: el ruido afecta sueño, salud, humor", 60, 130, "el ruido de la ciudad", tam=50),
      E("A) Los coches", 60, 270, "A: los coches", tam=68, id="a"), E("B) El ruido nos enferma", 60, 380, "B: el ruido", tam=68, id="b"),
      E("C) La vida en el campo", 60, 490, "C: la vida", tam=68, id="c"),
    ]),
    paso("La idea", "El título es la idea central en pocas palabras: tiene que cubrir todo el texto.", [
      E("título  =  idea central", 60, 260, "El título es", "amarillo", 76), E("cubre TODO el texto", 60, 420, "cubrir todo", "verde", 76, "u"), S("u", "todo el texto", "verde"),
    ]),
    paso("Descarta", "La A es solo un detalle. La C habla de otra cosa. La B cubre todo.", [
      E("Texto: el ruido afecta sueño, salud, humor", 60, 130, "La A", tam=50),
      E("A) Los coches", 60, 270, "La A", tam=68, id="a"), E("B) El ruido nos enferma", 60, 380, "La B", tam=68, id="b"),
      E("C) La vida en el campo", 60, 490, "La C", tam=68, id="c"),
      T("a", "solo un detalle"), E("detalle", 560, 270, "solo un detalle", "rojo", 52),
      T("c", "otra cosa"), E("otro tema", 700, 490, "otra cosa", "rojo", 52),
      C("b", "cubre todo", "verde"), P(800, 360, "cubre todo"),
    ]),
    paso("El cierre", "Para el cierre, lo mismo: retoma la idea de todo el texto, sin meter algo nuevo.", [
      E("Cierre:", 60, 170, "Para el cierre", "amarillo", 76),
      E("✓ retoma todo el texto", 60, 320, "retoma la idea", "verde", 70), E("✗ nada nuevo", 60, 450, "sin meter algo nuevo", "rojo", 70),
    ]),
    paso("Cuidado", "Cuidado con el cierre que abre un tema nuevo, como: y también hay mucha basura. Eso no cierra, abre.", [
      cuidado(), E("«…y también hay mucha basura.»", 60, 300, "y también hay", tam=62, id="x"), T("x", "no cierra"),
      E("no cierra: abre", 60, 450, "abre", "rojo", 72),
    ]),
    paso("Tu turno", "Tu turno. Un texto sobre los beneficios de leer diario. ¿Qué cierre va? A: leer un poco cada día nos hace pensar mejor. B: los libros digitales son baratos.", [
      turno(), E("Texto: beneficios de leer diario", 60, 220, "beneficios de leer", tam=56),
      E("A) Leer cada día nos hace pensar mejor.", 60, 340, "A: leer", tam=52, id="a"),
      E("B) Los libros digitales son baratos.", 60, 450, "B: los libros", tam=52, id="b"),
    ], pausa=5),
    paso("Tu turno", "Es la A: retoma todo el texto. La B mete un tema nuevo.", [
      C("a", "Es la A", "verde"), T("b", "un tema nuevo"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: título y cierre cubren todo el texto. Ni un detalle, ni algo nuevo.", [
      recuerda(), E("cubren todo el texto", 70, 300, "título y cierre"), E("ni detalle, ni algo nuevo", 70, 430, "Ni un detalle", id="u"), S("u", "algo nuevo"),
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
