# Vorka México · videos de Matemáticas del Simulador PAA (02 a 08), estilo pizarrón y explicación sencilla.
# Genera simulador/videos/paa/0N.json. Uso: python3 _tienda/simulador/videos/mate.py
# El pizarrón mide 1000 × 620. Letra de plumón: 76 de alto si no se dice otra cosa (unos 0.4 × alto por letra).
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


VIDEOS = {
  "02": ("aritmetica", "El orden de las operaciones", [
    paso("La pregunta", "¿Cuánto es dos más tres por cuatro? ¿Veinte o catorce?", [
      E("2 + 3 × 4 = ?", 70, 230, "dos más tres", tam=100),
      E("¿20", 70, 420, "Veinte", "rojo", 90), E("o", 260, 420, "o catorce", tam=70), E("14?", 340, 420, "catorce", "verde", 90),
    ]),
    paso("La regla", "Las operaciones tienen un orden. Primero los paréntesis, luego las potencias, luego multiplicar y dividir, y al final sumar y restar.", [
      F([60, 100], [60, 500], "tienen un orden", "amarillo"),
      E("1. ( )", 110, 140, "paréntesis"), E("2. potencias", 110, 260, "potencias"),
      E("3. × ÷", 110, 380, "multiplicar"), E("4. + −", 110, 500, "sumar y restar"),
    ]),
    paso("Calcula", "Entonces, primero la multiplicación: tres por cuatro, doce. Luego la suma: dos más doce, catorce.", [
      E("2 +", 70, 180, "Entonces", tam=90), E("3 × 4", 230, 180, "primero la", tam=90, id="m"),
      C("m", "tres por cuatro", "amarillo"), F("m", [330, 300], "doce", "amarillo"),
      E("2 + 12", 70, 400, "Luego", tam=90), E("= 14", 360, 400, "catorce", "verde", 90, "r"), C("r", "catorce.", "verde"),
    ]),
    paso("Cuidado", "Cuidado: si sumas primero, te da veinte. Y está mal.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("sumar primero →", 70, 320, "si sumas", "rojo"), E("20", 680, 320, "veinte", "rojo", 110, "c"), T("c", "está mal"),
    ]),
    paso("Potencias", "Con potencias de la misma base: si multiplicas, sumas los exponentes. Si divides, los restas.", [
      E("2³ × 2⁴ = 2⁷", 70, 200, "si multiplicas", tam=90), E("(3 + 4)", 620, 200, "sumas los", "amarillo"),
      E("5⁶ ÷ 5² = 5⁴", 70, 400, "Si divides", tam=90), E("(6 − 2)", 620, 400, "los restas", "amarillo"),
    ]),
    paso("Tu turno", "Tu turno. ¿Cuánto es diez menos dos por tres?", [
      turno(), E("10 −", 70, 300, "diez menos", tam=90), E("2 × 3", 270, 300, "dos por tres", tam=90, id="m2"), E("= ?", 510, 300, "tres?", tam=90),
    ], pausa=5),
    paso("Tu turno", "Primero la multiplicación: dos por tres, seis. Luego, diez menos seis: cuatro.", [
      C("m2", "dos por tres", "amarillo"), E("10 − 6", 70, 470, "Luego", tam=90), E("= 4", 350, 470, "cuatro", "verde", 90, "r4"), C("r4", "cuatro.", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: primero multiplica y divide. Al final, suma y resta.", [
      recuerda(), E("1. × y ÷", 70, 300, "multiplica"), E("2. + y −", 70, 430, "Al final", id="u"), S("u", "suma y resta"),
    ]),
  ]),

  "03": ("algebra", "Ecuaciones: despeja la x", [
    paso("La pregunta", "Si cinco equis menos cuatro es igual a once, ¿cuánto vale equis?", [
      E("5x − 4 = 11", 70, 230, "cinco equis", tam=100), E("x = ?", 70, 420, "cuánto vale", "azul", 90),
    ]),
    paso("La idea", "Una ecuación es como una balanza. Lo que haces de un lado, lo haces del otro.", [
      D("M 170 330 L 830 330", "como una balanza", "amarillo", 7), D("M 500 330 L 440 470 L 560 470 Z", "como una balanza", "amarillo"),
      E("5x − 4", 190, 300, "Lo que haces"), E("11", 690, 300, "del otro"),
      E("+ 4", 230, 200, "de un lado", "verde"), E("+ 4", 680, 200, "lo haces del otro", "verde"),
    ]),
    paso("Despeja", "Primero quita el menos cuatro: suma cuatro en los dos lados. Te queda: cinco equis igual a quince.", [
      E("5x − 4 = 11", 70, 150, "Primero"),
      E("+4", 180, 240, "suma cuatro", "verde", 56), E("+4", 360, 240, "en los dos lados", "verde", 56),
      E("5x = 15", 70, 380, "Te queda", id="e2"),
    ]),
    paso("Despeja", "Ahora divide entre cinco en los dos lados. Equis vale tres.", [
      E("÷5", 90, 460, "divide entre cinco", "amarillo", 56), E("÷5", 250, 460, "en los dos lados", "amarillo", 56),
      E("x = 3", 520, 380, "Equis vale", "verde", 96, "r3"), C("r3", "vale tres", "verde"),
    ], limpia=False),
    paso("Comprueba", "Comprueba: cinco por tres, quince. Menos cuatro, once. ¡Sí da!", [
      E("Comprueba:", 70, 130, "Comprueba", "amarillo", 70), E("5 × 3 = 15", 70, 270, "cinco por tres"),
      E("15 − 4 = 11", 70, 400, "Menos cuatro", "verde", id="ok"), P(560, 370, "Sí da"),
    ]),
    paso("Cuidado", "Cuidado: cuando un número cambia de lado, cambia su signo. El menos cuatro llega como más cuatro.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("−4", 120, 330, "menos cuatro", "rojo", 120, "m4"), F("m4", [560, 300], "llega como", "blanco"), E("+4", 600, 330, "más cuatro", "verde", 120),
    ]),
    paso("Tu turno", "Tu turno. Si dos equis más seis es igual a veinte, ¿cuánto vale equis?", [
      turno(), E("2x + 6 = 20", 70, 300, "dos equis", tam=96),
    ], pausa=5),
    paso("Tu turno", "Resta seis: dos equis igual a catorce. Divide entre dos: equis vale siete.", [
      E("2x = 14", 70, 470, "Resta seis"), E("x = 7", 520, 470, "vale siete", "verde", 90, "r7"), C("r7", "siete.", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: lo que haces de un lado, hazlo del otro. Y al final, comprueba.", [
      recuerda(), E("lo mismo en los dos lados", 70, 300, "lo que haces", tam=70), E("y comprueba", 70, 430, "al final", id="u"), S("u", "comprueba"),
    ]),
  ]),

  "04": ("algebra", "Factorizar un trinomio", [
    paso("La pregunta", "¿Cómo se factoriza equis cuadrada, más cinco equis, más seis?", [
      E("x² + 5x + 6", 70, 230, "equis cuadrada", tam=100), E("= ( x + ? )( x + ? )", 70, 420, "factoriza", "azul", 80),
    ]),
    paso("La idea", "Busca dos números que multiplicados den seis, y sumados den cinco.", [
      E("x² +", 70, 140), E("5x", 230, 140, id="b"), E("+", 340, 140), E("6", 400, 140, id="c"),
      C("c", "multiplicados den seis"), E("multiplican → 6", 110, 320, "multiplicados", "amarillo"),
      C("b", "sumados den cinco"), E("suman → 5", 110, 460, "sumados", "amarillo"),
    ]),
    paso("Prueba", "Prueba: uno y seis multiplican seis, pero suman siete. Dos y tres multiplican seis y suman cinco. ¡Esos son!", [
      E("1 y 6 → suman 7", 70, 180, "uno y seis", id="f1"), T("f1", "pero suman siete"),
      E("2 y 3 → suman 5", 70, 330, "Dos y tres", "verde"), P(620, 300, "Esos son"),
    ]),
    paso("Prueba", "Entonces queda: equis más dos, por equis más tres.", [
      E("(x + 2)(x + 3)", 70, 500, "Entonces queda", "verde", 90, "res"), S("res", "por equis más tres", "verde"),
    ], limpia=False),
    paso("La parábola", "Si es una parábola, cruza el eje en esos números, pero con el signo contrario: en menos dos y en menos tres.", [
      E("y = (x + 2)(x + 3)", 580, 150, "Si es una parábola", "azul", 56),
      F([60, 360], [960, 360], "cruza el eje", "blanco"),
      D("M 200 120 Q 360 900 520 120", "cruza el eje", "amarillo"),
      E("−3", 215, 440, "menos tres", "rosa", 60), E("−2", 440, 440, "menos dos", "rosa", 60),
    ]),
    paso("Cuidado", "Cuidado: si el factor es equis más dos, cruza en menos dos. No en dos.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("x + 2 → x = −2", 70, 300, "cruza en menos dos", "verde", id="ok"),
      E("2", 120, 470, "No en dos", "rojo", 110, "d2"), T("d2", "No en dos"),
    ]),
    paso("Tu turno", "Tu turno. Factoriza equis cuadrada, más siete equis, más diez.", [
      turno(), E("x² + 7x + 10", 70, 300, "Factoriza", tam=96),
    ], pausa=5),
    paso("Tu turno", "Multiplican diez y suman siete: dos y cinco. Queda equis más dos, por equis más cinco.", [
      E("2 y 5", 70, 470, "dos y cinco", "amarillo"), E("(x + 2)(x + 5)", 330, 470, "Queda", "verde", id="r"), S("r", "por equis más cinco", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: dos números que multiplicados den el último, y sumados den el de en medio.", [
      recuerda(), E("× → el último", 70, 300, "multiplicados"), E("+ → el de en medio", 70, 430, "sumados", id="u"), S("u", "en medio"),
    ]),
  ]),

  "05": ("geometria", "Área y perímetro", [
    paso("La pregunta", "Un rectángulo mide ocho de largo y cinco de ancho. ¿Cuál es su área? ¿Y su perímetro?", [
      {"a": "caja", "id": "r", "x": 120, "y": 160, "w": 440, "h": 280, "en": "Un rectángulo"},
      E("8", 320, 140, "ocho de largo", "amarillo", 66), E("5", 580, 320, "cinco de ancho", "amarillo", 66),
      E("¿área?", 660, 260, "su área", "azul", 70), E("¿perímetro?", 660, 380, "su perímetro", "azul", 64),
    ]),
    paso("El área", "El área es lo de adentro, lo que cubre la pintura: largo por ancho. Ocho por cinco, cuarenta.", [
      {"a": "relleno", "sobre": "r", "desde": 0, "hasta": 1, "color": "verde", "en": "lo de adentro"},
      E("8 × 5 = 40", 190, 330, "Ocho por cinco", "tinta", 80),
    ], limpia=False),
    paso("El perímetro", "El perímetro es el borde, lo que camina una hormiga: ocho, más cinco, más ocho, más cinco. Veintiséis.", [
      {"a": "caja", "x": 120, "y": 160, "w": 440, "h": 280, "color": "amarillo", "en": "el borde"},
      E("8", 320, 140, "ocho, más", "amarillo", 66), E("5", 580, 320, "más cinco", "amarillo", 66),
      E("8", 320, 520, "más ocho", "amarillo", 66), E("5", 70, 320, "más cinco.", "amarillo", 66),
      E("= 26", 680, 320, "Veintiséis", "verde", 96, "p"), C("p", "Veintiséis", "verde"),
    ]),
    paso("Cuidado", "Cuidado: el área se mide en centímetros cuadrados. El perímetro, en centímetros.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("área →", 70, 290, "el área"), E("cm²", 320, 290, "cuadrados", "amarillo", id="u1"), S("u1", "cuadrados"),
      E("perímetro →", 70, 430, "El perímetro"), E("cm", 470, 430, "en centímetros.", "amarillo"),
    ]),
    paso("El triángulo", "Un triángulo es la mitad de un rectángulo. Su área es base por altura, entre dos.", [
      D("M 140 480 L 540 480 L 340 160 Z", "Un triángulo"),
      D("M 340 160 L 340 480", "base por altura", "amarillo", 4), E("altura", 225, 360, "altura", "amarillo", 50),
      E("base", 290, 550, "base por", tam=56),
      E("b × h ÷ 2", 600, 330, "entre dos", "verde", 84, "f"), S("f", "entre dos", "verde"),
    ]),
    paso("Tu turno", "Tu turno. Un triángulo tiene base diez y altura seis. ¿Cuál es su área?", [
      turno(), E("base = 10", 70, 260, "base diez"), E("altura = 6", 70, 380, "altura seis"), E("área = ?", 70, 500, "su área", "azul"),
    ], pausa=5),
    paso("Tu turno", "Diez por seis, sesenta. Entre dos, treinta.", [
      E("10 × 6 = 60", 520, 260, "Diez por seis"), E("60 ÷ 2 =", 520, 380, "Entre dos"),
      E("30", 820, 380, "treinta", "verde", 90, "r30"), C("r30", "treinta.", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: el área es lo de adentro. El perímetro es el borde.", [
      recuerda(), E("área = adentro", 70, 300, "el área"), E("perímetro = borde", 70, 430, "El perímetro", id="u"), S("u", "el borde"),
    ]),
  ]),

  "06": ("geometria", "Pitágoras y los ángulos del triángulo", [
    paso("La pregunta", "Una escalera de trece metros está recargada en una pared. Su base está a cinco metros. ¿A qué altura llega?", [
      D("M 720 70 L 720 520", "recargada en una pared"), D("M 200 520 L 780 520", "recargada en una pared"),
      D("M 480 520 L 720 140", "Una escalera", "amarillo", 9),
      E("13", 520, 320, "trece metros", "amarillo", 70, "t13"), E("5", 580, 590, "cinco metros", tam=66),
      E("?", 750, 340, "A qué altura", "azul", 100),
    ]),
    paso("La regla", "La pared y el piso forman un ángulo recto. Entonces se cumple: a al cuadrado, más b al cuadrado, es igual a c al cuadrado.", [
      D("M 690 520 L 690 490 L 720 490", "ángulo recto", "verde", 5),
      E("a² + b² = c²", 70, 130, "Entonces se cumple", "verde", 86),
    ], limpia=False),
    paso("Calcula", "La escalera es c: el lado más largo. Cinco al cuadrado, más la altura al cuadrado, es trece al cuadrado.", [
      C("t13", "el lado más largo"), E("25 + h² = 169", 70, 250, "Cinco al cuadrado", tam=64),
    ], limpia=False),
    paso("Calcula", "Entonces, la altura al cuadrado es ciento cuarenta y cuatro. La altura es doce.", [
      E("h² = 144", 70, 345, "ciento cuarenta", tam=64), E("h = 12", 70, 445, "La altura es", "verde", 80, "h"), C("h", "doce.", "verde"),
    ], limpia=False),
    paso("Cuidado", "Cuidado: c siempre es el lado más largo, el que está frente al ángulo recto.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("c = el lado más largo", 70, 300, "el lado más largo", id="u"), S("u", "más largo"),
      E("frente al ángulo recto", 70, 440, "frente al", "amarillo", 70),
    ]),
    paso("Los ángulos", "Otra regla: los tres ángulos de un triángulo siempre suman ciento ochenta grados.", [
      D("M 120 500 L 520 500 L 280 170 Z", "los tres ángulos"),
      E("60°", 165, 485, "los tres ángulos", "amarillo", 48), E("70°", 420, 485, "de un triángulo", "amarillo", 48), E("50°", 255, 250, "siempre suman", "amarillo", 48),
      E("= 180°", 600, 340, "ciento ochenta", "verde", 96, "s"), C("s", "grados", "verde"),
    ]),
    paso("Tu turno", "Tu turno. Un triángulo tiene un ángulo de cuarenta y otro de noventa grados. ¿Cuánto mide el tercero?", [
      turno(), E("40° + 90° + ? = 180°", 70, 300, "cuarenta", tam=70),
    ], pausa=5),
    paso("Tu turno", "Cuarenta más noventa, ciento treinta. Ciento ochenta menos ciento treinta: cincuenta.", [
      E("40 + 90 = 130", 70, 450, "Cuarenta más noventa", tam=64), E("180 − 130 =", 500, 450, "Ciento ochenta menos", tam=64),
      E("50°", 860, 450, "cincuenta", "verde", 76, "r"), C("r", "cincuenta.", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: a al cuadrado más b al cuadrado es c al cuadrado. Y los ángulos del triángulo suman ciento ochenta.", [
      recuerda(), E("a² + b² = c²", 70, 300, "a al cuadrado"), E("ángulos = 180°", 70, 430, "los ángulos", id="u"), S("u", "ciento ochenta"),
    ]),
  ]),

  "07": ("datos", "Media, mediana y moda", [
    paso("La pregunta", "Tienes estos datos: nueve, tres, catorce, siete y siete. ¿Cuál es la mediana?", [
      E("9, 3, 14, 7, 7", 70, 230, "nueve", tam=96), E("¿mediana?", 70, 420, "Cuál es la mediana", "azul", 90),
    ]),
    paso("La mediana", "La mediana es el dato de en medio. Pero primero, ordénalos de menor a mayor.", [
      E("mediana = el de en medio", 70, 150, "La mediana", tam=64),
      E("1° ordena", 70, 300, "primero, ordénalos", "amarillo", id="o"), S("o", "de menor a mayor"),
    ]),
    paso("La mediana", "Ordenados quedan: tres, siete, siete, nueve, catorce. El de en medio es siete.", [
      E("3, 7,", 70, 460, "Ordenados", tam=90), E("7", 285, 460, "siete, siete", "verde", 90, "m"), E(", 9, 14", 320, 460, "nueve, catorce", tam=90),
      C("m", "El de en medio", "verde"),
    ], limpia=False),
    paso("La media", "La media es el promedio: suma todo y divide entre cuántos son. Cuarenta entre cinco: ocho.", [
      E("media = promedio", 70, 140, "La media"),
      E("3 + 7 + 7 + 9 + 14 = 40", 70, 290, "suma todo", tam=64),
      E("40 ÷ 5 =", 70, 430, "Cuarenta entre cinco"), E("8", 370, 430, "ocho", "verde", 90, "r"), C("r", "ocho.", "verde"),
    ]),
    paso("La moda", "Y la moda es el que más se repite: el siete.", [
      E("moda = el que más se repite", 70, 160, "la moda", tam=60),
      E("3,", 70, 340, "más se repite", tam=90), E("7", 185, 340, "se repite", "verde", 90, "a"), E(",", 230, 340, tam=90),
      E("7", 285, 340, "se repite:", "verde", 90, "b"), E(", 9, 14", 335, 340, tam=90),
      C("a", "el siete", "verde"), C("b", "el siete", "verde"),
    ]),
    paso("Cuidado", "Cuidado: si no ordenas, te sale catorce. Y está mal.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("9, 3,", 70, 320, "si no ordenas", tam=90), E("14", 265, 320, "catorce", "rojo", 90, "c"), E(", 7, 7", 360, 320, tam=90),
      C("c", "te sale catorce", "rojo"), T("c", "está mal"),
    ]),
    paso("Tu turno", "Tu turno. ¿Cuál es la mediana de dos, nueve, cuatro, siete y cinco?", [
      turno(), E("2, 9, 4, 7, 5", 70, 300, "dos, nueve", tam=96),
    ], pausa=5),
    paso("Tu turno", "Ordénalos: dos, cuatro, cinco, siete, nueve. El de en medio es cinco.", [
      E("2, 4,", 70, 470, "Ordénalos", tam=90), E("5", 285, 470, "cinco, siete", "verde", 90, "r"), E(", 7, 9", 320, 470, "nueve.", tam=90),
      C("r", "El de en medio", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: para la mediana, primero ordena. Para la media, suma y divide.", [
      recuerda(), E("mediana → ordena", 70, 300, "para la mediana"), E("media → suma y divide", 70, 430, "Para la media", id="u"), S("u", "suma y divide"),
    ]),
  ]),

  "08": ("datos", "Probabilidad", [
    paso("La pregunta", "Lanzas un dado. ¿Qué probabilidad hay de que salga un número par?", [
      E("1  2  3  4  5  6", 70, 230, "Lanzas un dado", tam=90), E("¿par?", 70, 420, "número par", "azul", 90),
    ]),
    paso("La idea", "La probabilidad es: lo que quieres, entre todo lo que puede salir.", [
      E("probabilidad =", 70, 330, "La probabilidad", tam=80),
      E("lo que quieres", 560, 250, "lo que quieres", "verde", 64),
      D("M 540 290 L 960 290", "entre todo", "blanco", 6),
      E("todo lo que sale", 560, 380, "todo lo que puede", tam=64),
    ]),
    paso("Calcula", "Los pares son dos, cuatro y seis: tres casos. En total hay seis. Tres entre seis: un medio.", [
      E("1", 70, 170, "Los pares", tam=80), E("2", 170, 170, "Los pares", tam=80, id="d2"), E("3", 270, 170, "Los pares", tam=80),
      E("4", 370, 170, "Los pares", tam=80, id="d4"), E("5", 470, 170, "Los pares", tam=80), E("6", 570, 170, "Los pares", tam=80, id="d6"),
      C("d2", "son dos", "verde"), C("d4", "cuatro y", "verde"), C("d6", "seis:", "verde"),
      E("3", 150, 380, "tres casos", "verde", 90), D("M 110 410 L 240 410", "En total", "blanco", 6), E("6", 150, 510, "hay seis", tam=90),
      E("= ½", 290, 450, "un medio", "verde", 110, "r"), C("r", "un medio.", "verde"),
    ]),
    paso("Cuidado", "Cuidado: con dos dados hay treinta y seis resultados, no once. Y el siete es la suma que más sale.", [
      E("¡Cuidado!", 70, 130, "Cuidado", "rojo", 84),
      E("2 dados → 36 resultados", 70, 290, "con dos dados", tam=64),
      E("11", 70, 450, "no once", "rojo", 90, "o"), T("o", "no once"),
      E("el 7 sale más", 280, 450, "el siete", "verde", 70),
    ]),
    paso("Al menos uno", "Si te piden al menos uno, calcula lo contrario y réstalo de uno.", [
      E("al menos uno", 70, 200, "al menos uno", "amarillo", 80),
      E("= 1 − ninguno", 70, 360, "réstalo de uno", "verde", 86, "u"), S("u", "réstalo", "verde"),
    ]),
    paso("Tu turno", "Tu turno. Lanzas una moneda dos veces. ¿Qué probabilidad hay de que salga al menos un sol?", [
      turno(), E("moneda × 2", 70, 260, "una moneda"), E("¿al menos", 70, 400, "al menos un sol", "azul"), E("un sol?", 70, 510, "un sol?", "azul"),
    ], pausa=5),
    paso("Tu turno", "Lo contrario es que no salga ningún sol: águila y águila, un cuarto. Uno menos un cuarto: tres cuartos.", [
      E("ningún sol = ¼", 610, 260, "ningún sol", tam=62), E("1 − ¼ =", 640, 420, "Uno menos", tam=76),
      E("¾", 880, 420, "tres cuartos", "verde", 100, "r"), C("r", "tres cuartos.", "verde"),
    ], limpia=False),
    paso("Recuerda", "Recuerda: lo que quieres, entre todo lo que puede salir. Y al menos uno es uno menos ninguno.", [
      recuerda(), E("lo que quieres ÷ todo", 70, 300, "lo que quieres", tam=70), E("al menos uno = 1 − ninguno", 70, 430, "al menos uno es", tam=64, id="u"), S("u", "uno menos ninguno"),
    ]),
  ]),
}

for num, (tema, titulo, pasos) in VIDEOS.items():
    ruta = os.path.join(AQUI, 'paa', f'{num}.json')
    v = {"id": f"paa-{num}", "tema": tema, "titulo": titulo, "publicado": True, "voz": VOZ,
         "audio": f"/assets/tienda/simulador-videos/paa/{num}.mp3", "pasos": pasos}
    # Conserva los tiempos ya sincronizados si la voz no cambió
    if os.path.exists(ruta):
        viejo = json.load(open(ruta, encoding='utf-8'))
        if [p['voz'] for p in viejo['pasos']] == [p['voz'] for p in pasos] and 'duracion' in viejo:
            v['duracion'] = viejo['duracion']
            for p, q in zip(pasos, viejo['pasos']): p['inicio'] = q['inicio']
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(v, f, ensure_ascii=False, indent=2); f.write('\n')
    print(f'· paa/{num}.json · {len(pasos)} pasos · {sum(len(p["voz"]) for p in pasos)} letras de voz')
