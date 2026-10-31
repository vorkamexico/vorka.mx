// Páginas de la PAA por universidad (vorka.mx/simulador-paa/<universidad>/): para que nos encuentre quien busca "PAA <universidad>".
// Cada una tiene contenido propio (sus reglas, con el numeral del documento oficial), su canonical y liga al simulador.
// Regla: solo datos verificados en la fuente oficial que se cita; lo que es consejo nuestro se presenta como tal.
// No usar logos ni escudos. La estructura de la PAA sale de la guía del College Board de 2020 (sin tiempos: pudieron cambiar).
import { esc, pagina } from '../paginas.js';
import { FLECHA, CHECK } from '../marco.generado.js';

const SITIO = 'https://vorka.mx';
const RUTA = '/simulador-paa';
const PAA_2020 = 'https://latam.collegeboard.org/wp-content/uploads/2020/04/2020-PAA-Preguntas-y-Respuestas.pdf';

export const UNIVERSIDADES = {
  udem: {
    nombre: 'UDEM', completo: 'Universidad de Monterrey (UDEM)', art: 'la',
    titulo: 'PAA UDEM: puntaje mínimo (1,200) y reglas de admisión | Vorka México',
    descripcion: 'Cuánto pide la UDEM en la PAA: 1,200 en total, 550 en razonamiento verbal y matemático y promedio de 80 (Enfermería: 1,100, 500 y 70). Vigencia, constancia de otra institución, cursos remediales y portafolio.',
    h1: 'PAA para la UDEM: puntajes mínimos y cómo prepararte',
    lead: 'La UDEM pide la Prueba de Aptitud Académica (PAA) para entrar a cualquiera de sus licenciaturas. Aquí está lo que dice su lineamiento oficial de admisión, con el numeral de cada regla, y un plan para llegar a tu puntaje con el simulador.',
    fuentes: [{ nombre: 'Lineamiento de Admisión a Licenciatura de la UDEM (LO-DISE-003, versión B, emitido el 06/01/2026)', url: 'https://udem.edu.mx/sites/default/files/2026-03/LO-DISE-003-B%20Lineamiento%20Admisio%CC%81n%20a%20Licenciatura.pdf' }],
    verificado: '25 de octubre de 2026',
    minimos: {
      columnas: ['PAA total', 'Razonamiento verbal', 'Razonamiento matemático', 'Promedio'],
      filas: [['Todas las licenciaturas', '1,200', '550', '550', '80'], ['Licenciatura en Enfermería', '1,100', '500', '500', '70']],
      nota: 'Numeral 5.3.6. El promedio es de bachillerato, o su equivalente en la escala de tu prepa.',
    },
    reglas: [
      ['Tu resultado vale un año', 'La PAA tiene validez de un año desde que la presentas y debe estar vigente cuando inicias tu proceso de admisión (5.3.1).'],
      ['Sirve la PAA de otra institución', 'Puedes entregar la constancia oficial vigente de una PAA que presentaste en otra institución (5.3.3).'],
      ['En la UDEM, máximo dos veces', 'Si la presentas en la UDEM, puedes hacerlo únicamente dos veces en el mismo periodo (5.3.4).'],
      ['Si una parte queda abajo', 'Si cumples el total y el promedio pero sacas menos de 550 en razonamiento verbal o matemático (500 en Enfermería), en el primer semestre debes inscribir y acreditar un curso remedial: Lógica, Aritmética y Álgebra, o Habilidades de Comunicación Escrita (5.6).'],
      ['Portafolio en Arquitectura y Diseño', 'En Arquitectura, Artes, Diseño Gráfico, Diseño de Moda, Diseño Industrial y Diseño de Interiores, con una PAA de 1,000 a 1,199 y promedio de 80 pueden admitirte si presentas un portafolio (5.8).'],
      ['Además de la PAA', 'Todo solicitante contesta una evaluación cualitativa (5.4.5). Enfermería, Medicina, Odontología, Ingeniería Biomédica, Ciencias Ambientales y Salud, Nutrición y las tres licenciaturas de Psicología piden también una entrevista (5.5.1).'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Pon 550 como meta', 'El simulador estima cada sección en la misma escala de 200 a 800. Ponle 550 de meta (500 si vas a Enfermería) y mide en cada simulacro cuánto te falta.'],
      ['Ataca la parte más baja', 'Si una parte queda debajo de 550, aunque entres, la UDEM te pide un curso remedial en el primer semestre. Practica esa sección por tema hasta que suba.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿Cuánto necesito en la PAA para entrar a la UDEM?', r: 'Según el numeral 5.3.6 de su lineamiento de admisión: al menos 1,200 puntos de PAA, 550 en razonamiento verbal, 550 en razonamiento matemático y promedio de 80. En la Licenciatura en Enfermería: 1,100, 500 y 500, y promedio de 70.' },
      { p: '¿Puedo usar la PAA que presenté en otra universidad?', r: 'Sí. El numeral 5.3.3 dice que puedes presentar la constancia oficial vigente de los resultados de una PAA que hayas presentado en otra institución. Recuerda que debe tener menos de un año.' },
      { p: '¿Cuánto tiempo vale mi resultado de la PAA?', r: 'Un año desde que la presentas, y debe estar vigente cuando inicias tu proceso de admisión (numeral 5.3.1). Si dejas el proceso a medias y se vence, tienes que volver a presentarla.' },
      { p: '¿Qué pasa si saco menos de 550 en una parte?', r: 'Si cumples el puntaje total y el promedio pero quedas debajo de 550 en razonamiento verbal o matemático, en el primer semestre debes inscribir y acreditar el curso remedial que corresponda (numeral 5.6). Si no lo apruebas, no te readmiten al siguiente periodo.' },
      { p: '¿Y si voy a Arquitectura o a una carrera de diseño?', r: 'En Arquitectura, Artes, Diseño Gráfico, Diseño de Moda, Diseño Industrial y Diseño de Interiores, si sacas entre 1,000 y 1,199 en la PAA y tienes promedio de 80, puedes ser admitido presentando un portafolio (numeral 5.8).' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board y la aplica la universidad. No estamos afiliados a la UDEM ni al College Board.' },
    ],
  },
  'tec-de-monterrey': {
    nombre: 'Tec de Monterrey', completo: 'Tecnológico de Monterrey', art: 'el',
    titulo: 'PAA Tec de Monterrey: reglas para entrar a profesional | Vorka México',
    descripcion: 'El Tec pide la PAA para profesional (la prepa usa PIENSE II). Acepta SAT o ACT, pero la PAA solo cuenta si la aplicó un campus del Tec. Vigencia, intentos y qué más evalúa.',
    h1: 'PAA para el Tec de Monterrey: reglas de admisión a profesional',
    lead: 'El Tec usa la Prueba de Aptitud Académica (PAA) para entrar a profesional, dentro de una evaluación integral de tu expediente. Aquí está lo que dice su Reglamento de Admisiones, con el artículo de cada regla, y un plan para prepararte.',
    fuentes: [{ nombre: 'Reglamento de Admisiones para los Niveles de Preparatoria y Profesional del Tecnológico de Monterrey (edición febrero 2025)', url: 'https://tec.mx/sites/default/files/inline-files/reglamento-admisiones-preparatoria-profesional-2025.pdf' }],
    verificado: '25 de octubre de 2026',
    pideEtiqueta: 'Requisitos',
    pide: [
      ['La PAA, para profesional', 'Es la prueba institucional de admisión a profesional. Para preparatoria, el Tec usa otra: la Prueba PIENSE II (Art. 3).'],
      ['O bien SAT o ACT', 'Se aceptan como prueba equivalente y el Tec hace la equivalencia con la PAA. Su resultado vale dos años y debe estar vigente el primer día de clases (Arts. 3 y 47).'],
      ['No hay un puntaje mínimo publicado', 'Un Comité de Admisión decide con todo tu expediente: prueba de admisión, promedio, ensayo, currículo, examen de inglés y lo que el Comité pida (Arts. 3 y 10). Sus dictámenes son inapelables.'],
    ],
    reglas: [
      ['Solo cuenta la PAA aplicada por el Tec', 'El resultado de la PAA sirve para el dictamen solo si la prueba la aplicó un campus o sede del Tecnológico de Monterrey (Art. 43). Una PAA presentada en otra universidad no sirve aquí; SAT o ACT sí.'],
      ['Vale tres semestres', 'La PAA tiene vigencia de tres semestres consecutivos e inmediatos a partir del periodo para el que solicitaste admisión (Art. 44).'],
      ['Hasta tres intentos', 'Puedes presentarla como máximo tres veces: la segunda, al menos un mes después de la primera; la tercera, al menos tres meses después de la segunda (Art. 46).'],
      ['También cuenta el inglés', 'Presentar el examen institucional de ubicación de inglés (Cambridge English Placement Test) o un equivalente autorizado es requisito del proceso (Art. 3).'],
      ['Si vienes de PrepaTec', 'Con promedio de 80 o más tienes admisión a profesional. Si no llegas a 80, te piden la PAA, un ensayo y tu currículo (Art. 20).'],
      ['Carreras con cupo límite', 'Medicina, Odontología, Biociencias, Arquitectura y otros programas tienen cupo límite o requisitos diferenciados, según el campus (Anexo I).'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Llega listo a tu primer intento', 'Entre un intento y otro hay que esperar al menos uno y tres meses. Practica antes de tu primera aplicación para no gastar intentos.'],
      ['Sube la sección más baja', 'Como no hay un mínimo publicado, cada punto suma a tu expediente. Ponte una meta por sección en el simulador y practica por tema la que vaya más abajo.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿Cuánto necesito en la PAA para entrar al Tec?', r: 'El Reglamento de Admisiones no publica un puntaje mínimo. Un Comité de Admisión evalúa todo tu expediente: la prueba de admisión, tu promedio, ensayo, currículo, examen de inglés y lo que pida (Artículos 3 y 10).' },
      { p: '¿Puedo usar la PAA que presenté en otra universidad?', r: 'No. El Artículo 43 dice que la PAA solo es válida para el dictamen si la aplicó un campus o sede del Tecnológico de Monterrey. Lo que sí aceptan como equivalente es el SAT o el ACT (Artículo 3).' },
      { p: '¿Cuánto tiempo vale mi PAA en el Tec?', r: 'Tres semestres consecutivos e inmediatos a partir del periodo para el que solicitaste admisión (Artículo 44). El SAT y el ACT valen dos años desde que los presentas (Artículo 47).' },
      { p: '¿Cuántas veces puedo presentar la PAA?', r: 'Máximo tres: la segunda con al menos un mes de diferencia y la tercera con al menos tres meses después de la segunda (Artículo 46).' },
      { p: '¿Qué examen pide el Tec para la prepa?', r: 'Para preparatoria, la prueba institucional es la PIENSE II, no la PAA (Artículo 3). Nuestro simulador es de la PAA, para entrar a profesional.' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board. No estamos afiliados al Tecnológico de Monterrey ni al College Board.' },
    ],
  },
  udeg: {
    nombre: 'UdeG', completo: 'Universidad de Guadalajara (UdeG)', art: 'la',
    titulo: 'PAA UdeG: cómo se calcula tu puntaje de admisión (50 % y 50 %) | Vorka México',
    descripcion: 'En la UdeG la PAA pesa 50 % y tu promedio de bachillerato el otro 50 %. Cómo se suma tu puntaje, cuántos aspirantes entraron en 2026-B y cómo prepararte.',
    h1: 'PAA para la UdeG: cómo se calcula tu puntaje de admisión',
    lead: 'Para entrar a una licenciatura de la Universidad de Guadalajara tienes que presentar la PAA, y tu resultado pesa lo mismo que tu promedio de bachillerato. Aquí están los datos oficiales y un plan para subir tu puntaje.',
    fuentes: [
      { nombre: 'Portal de Programas Educativos de Pregrado de la UdeG', url: 'http://www.pregrado.udg.mx/Centros/Tem%C3%A1ticos/CUCEA/relaciones-publicas-y-comunicacion/aspirantes' },
      { nombre: 'UdeG: admitidos a licenciatura para 2026-B', url: 'https://www.udg.mx/es/noticia/logra-udeg-cifra-historica-con-21-mil-186-alumnos-de-licenciatura-admitidos-para-el' },
      { nombre: 'UdeG: examen de admisión 2026-B', url: 'https://www.udg.mx/es/noticia/presenta-examen-de-admision-9632-de-aspirantes-de-licenciaturas-para-el-ciclo-escolar-2026' },
    ],
    verificado: '25 de octubre de 2026',
    pideEtiqueta: 'Cómo se calcula',
    pide: [
      ['Promedio de bachillerato: 50 %', 'Tu promedio de educación media superior, en escala de 0 a 100, pesa la mitad.'],
      ['Resultado de la PAA: 50 %', 'El resultado del examen de aptitud, en escala de 0 a 100, pesa la otra mitad.'],
      ['La suma decide', 'La suma de los dos es la puntuación con la que se determina si eres admitido al programa. La UdeG publica los puntajes mínimos de ciclos anteriores de cada carrera.'],
    ],
    reglas: [
      ['La PAA es para todas las licenciaturas', 'Para ingresar a cualquier licenciatura de la UdeG debes presentar la Prueba de Aptitud Académica (portal de pregrado).'],
      ['Cuántos entraron en 2026-B', 'Hubo 49 mil 266 aspirantes a licenciatura y se admitió a 21 mil 186: el 43 por ciento, en 154 programas de 19 centros universitarios.'],
      ['El examen de 2026-B', 'Se aplicó el sábado 23 de mayo de 2026: se citó a 54 mil 844 personas y se presentaron 52 mil 824.'],
      ['Después del examen, tus documentos', 'Para 2026-B, la carga del certificado de bachillerato y el acta de nacimiento fue del 8 de junio al 31 de julio. Quien no los entrega queda fuera del proceso.'],
      ['Si vienes de una prepa de la UdeG', 'Si tu cita de examen tiene tu código, no entregas documentos: participas con promedio electrónico. Si no lo registraste, tienes que vincularlo o subir tus archivos.'],
      ['Los mínimos cambian cada ciclo', 'El puntaje que alcanza para entrar depende de la carrera, del centro universitario y del ciclo. Revisa los de ciclos anteriores de la tuya.'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Haz cuentas con tu promedio', 'Tu promedio ya está casi decidido; la PAA es la mitad que todavía puedes mover. Busca el mínimo de tu carrera en ciclos anteriores y calcula cuánto necesitas del examen.'],
      ['Practica por sección y por tema', 'El simulador estima tu puntaje en la escala de 200 a 800 del College Board; la UdeG lo usa en escala de 0 a 100. Úsalo para medir tu avance y atacar tu sección más baja.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿Cuánto pesa la PAA en la UdeG?', r: 'La mitad. Según el portal de pregrado de la UdeG, el promedio de bachillerato (de 0 a 100) pesa 50 % y el resultado del examen de aptitud (de 0 a 100) el otro 50 %. La suma de ambos determina si eres admitido.' },
      { p: '¿Cuál es el puntaje mínimo para entrar a la UdeG?', r: 'No es fijo: depende de la carrera, del centro universitario y del ciclo. La UdeG publica los puntajes mínimos de ciclos anteriores; úsalos como referencia para tu meta.' },
      { p: '¿Cuántos aspirantes admite la UdeG?', r: 'Para el calendario 2026-B hubo 49 mil 266 aspirantes a licenciatura y se admitió a 21 mil 186, el 43 por ciento, según la propia universidad.' },
      { p: '¿Qué hago después del examen?', r: 'Entregar tus documentos a tiempo. En 2026-B, la carga del certificado de bachillerato y el acta de nacimiento fue del 8 de junio al 31 de julio; quien no los entrega queda fuera del proceso.' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board. No estamos afiliados a la Universidad de Guadalajara ni al College Board.' },
    ],
  },
  itam: {
    nombre: 'ITAM', completo: 'Instituto Tecnológico Autónomo de México (ITAM)', art: 'el',
    titulo: 'PAA ITAM: examen de admisión en línea (ePAA) y reglas | Vorka México',
    descripcion: 'El ITAM aplica la ePAA del College Board en línea. Cómo es el procedimiento, si sirve la PAA de otra institución, cuándo se paga y cuántas veces puedes presentarla.',
    h1: 'PAA para el ITAM: cómo es su examen de admisión en línea',
    lead: 'El examen de admisión del ITAM es la PAA electrónica en línea (ePAA) del College Board. Aquí está lo que dice su Dirección Escolar y un plan para llegar listo a tu único intento del periodo.',
    fuentes: [
      { nombre: 'ITAM, Dirección Escolar: Examen de Admisión', url: 'https://escolar.itam.mx/licenciaturas/examen_admision.php' },
      { nombre: 'ITAM, Dirección Escolar: Examen en Otro Instituto', url: 'https://escolar.itam.mx/licenciaturas/examen_otro_instituto.php' },
    ],
    verificado: '25 de octubre de 2026',
    pideEtiqueta: 'El examen',
    pide: [
      ['ePAA en línea', 'El ITAM aplica la Prueba de Aptitud Académica electrónica, versión en línea (ePAA), diseñada por el College Board.'],
      ['Primero, tu documentación', 'Cuando envías tu documentación al Departamento de Admisiones, te dan lo necesario para presentar el examen: requisitos técnicos, fechas y documentos de preparación.'],
      ['Una vez por periodo', 'El examen de admisión solo se puede presentar una vez por periodo.'],
    ],
    reglas: [
      ['PAA de otra institución', 'Otras instituciones aplican la misma prueba y el ITAM podría revalidar ese resultado. Antes de presentarla, confirma con el ITAM que la institución tenga validez para el ITAM.'],
      ['Qué envías si la presentaste fuera', 'La carta original con tu puntaje desglosado, el comprobante de pago de la cuota y la documentación que pide el ITAM, lo antes posible.'],
      ['Cuándo se paga', 'Si tu promedio acumulado es menor a 8.5 o ya presentaste el examen en otra ocasión, tienes que pagar la cuota correspondiente.'],
      ['Tus documentos', 'Entre otros: resumen de la solicitud, acta de nacimiento, certificado de prepa (o historial o constancia con tu promedio, de no más de 30 días), CURP, identificación y foto digital.'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Solo tienes un intento por periodo', 'Como el ITAM permite presentarlo una vez por periodo, no llegues a probar suerte: practica hasta que tu puntaje estimado se estabilice.'],
      ['Ataca la sección más baja', 'Ponte una meta por sección en el simulador y practica por tema la que vaya más abajo.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿Qué examen de admisión pide el ITAM?', r: 'La Prueba de Aptitud Académica electrónica, versión en línea (ePAA), diseñada por el College Board. Al enviar tu documentación te dan los requisitos técnicos, las fechas y los documentos de preparación.' },
      { p: '¿Sirve la PAA que presenté en otra institución?', r: 'Puede servir: el ITAM dice que podría revalidar el resultado de otra institución que aplica la misma prueba, pero antes tienes que confirmar con el ITAM que esa institución tenga validez para el ITAM. Envías la carta original con el puntaje desglosado y el pago de la cuota.' },
      { p: '¿Cuántas veces puedo presentar el examen del ITAM?', r: 'Una vez por periodo.' },
      { p: '¿El examen tiene costo?', r: 'Según su página, pagas la cuota si tu promedio acumulado es menor a 8.5 o si ya presentaste el examen en otra ocasión. Revisa las cuotas vigentes en la sección de Fechas Importantes y Cuotas del ITAM.' },
      { p: '¿Cuál es el puntaje mínimo de la PAA en el ITAM?', r: 'La página de examen de admisión del ITAM no publica un puntaje mínimo. Pregunta a la Dirección Escolar por los requisitos de tu carrera.' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board. No estamos afiliados al ITAM ni al College Board.' },
    ],
  },
  iteso: {
    nombre: 'ITESO', completo: 'ITESO, Universidad Jesuita de Guadalajara', art: 'el',
    titulo: 'PAA ITESO: cómo validar tu puntaje de otra universidad | Vorka México',
    descripcion: 'El ITESO valida tu PAA de otra universidad si no tiene más de año y medio. Qué documento entregas, cuánto cuesta el trámite, fechas de examen para enero 2027 y la beca que pide PAA mayor a 1,250.',
    h1: 'PAA para el ITESO: cómo validar tu puntaje y qué beca la pide',
    lead: 'Si ya presentaste la PAA en otra universidad, el ITESO puede validar tu puntaje en lugar de pedirte otro examen. Aquí están sus reglas oficiales, las fechas de examen para entrar en enero de 2027 y un plan para subir tu puntaje.',
    fuentes: [
      { nombre: 'ITESO: preguntas frecuentes de admisión', url: 'https://iteso.mx/web/general/detalle?group_id=245342' },
      { nombre: 'ITESO: folleto Admisión Carreras, primavera (ingreso en enero 2027)', url: 'https://www.iteso.mx/documents/d/admision/26a-folleto-admision-carreras-v06' },
    ],
    verificado: '25 de octubre de 2026',
    pideEtiqueta: 'PAA de otra universidad',
    pide: [
      ['Validan tu puntaje', 'Si presentaste la Prueba de Aptitud Académica (PAA o SAT del College Board) en otra universidad y no tiene más de año y medio, el ITESO valida tu puntaje.'],
      ['Qué entregas', 'Al hacer tus trámites de admisión, agregas a tus documentos una carta de puntaje expedida por la universidad donde presentaste el examen.'],
      ['Cuánto cuesta', 'Según sus preguntas frecuentes, el trámite cuesta $400. Si en cambio presentas el examen de admisión del ITESO, la cuota es de $900 (prepa de convenio) o $1,300 (prepa sin convenio).'],
    ],
    reglas: [
      ['Pase automático por convenio', 'Si vienes de una prepa con convenio y tienes el promedio de pase automático, recibes tu carta de aceptación sin presentar examen y sin costo. El promedio requerido varía según la prepa.'],
      ['Fechas de examen para enero 2027', 'Quedan los sábados 7 y 21 de noviembre y 5 de diciembre de 2026, y el 9 de enero de 2027, presenciales.'],
      ['Resultados en días', 'Te llegan por correo entre el martes y el jueves siguientes a tu examen, junto con la Guía de Inscripción.'],
      ['Beca Descubre STEM', 'Para ingenierías: pide promedio de preparatoria mayor o igual a 90 y un puntaje en la PAA mayor a 1,250 puntos.'],
      ['Si vienes de la IBERO', 'Si presentaste examen para alguna universidad IBERO y fuiste admitido, agregas a tus documentos la carta de aceptación de esa universidad.'],
      ['Curso de preparación opcional', 'El ITESO ofrece uno presencial la semana previa a cada examen; cuesta $1,050 y tiene cupo limitado.'],
    ],
    plan: [
      ['Mide tu punto de partida', 'Haz un simulacro corto: en una sola sentada ves tu puntaje estimado por sección y qué temas te restan más puntos.'],
      ['Revisa la vigencia', 'Si ya tienes una PAA, cuenta: debe tener año y medio o menos al hacer tu trámite. Si se vence o tu puntaje es bajo, vale la pena volver a presentarla.'],
      ['Apunta a la beca', 'Si vas a una ingeniería, la Beca Descubre STEM pide más de 1,250 puntos en la PAA. Ponte una meta por sección en el simulador y ataca la más baja.'],
      ['Cierra con el examen completo', 'Cuando el simulador te diga que ya estás listo, presenta el examen completo, sin pistas, para medirte como el día del examen.'],
    ],
    faq: [
      { p: '¿El ITESO acepta la PAA que presenté en otra universidad?', r: 'Sí. Según sus preguntas frecuentes, si es la Prueba de Aptitud Académica (PAA o SAT del College Board) y no tiene una antigüedad mayor a año y medio, validan tu puntaje. Entregas una carta de puntaje de la universidad donde la presentaste y cubres el costo del trámite ($400).' },
      { p: '¿Cuánto cuesta el examen de admisión del ITESO?', r: 'Según su folleto para el ingreso en enero de 2027: $900 si vienes de una prepa de convenio y $1,300 si vienes de una prepa sin convenio.' },
      { p: '¿Cuándo son los exámenes para entrar en enero de 2027?', r: 'Según el folleto oficial, los sábados 7 y 21 de noviembre y 5 de diciembre de 2026, y el 9 de enero de 2027. Antes hubo fechas en septiembre y octubre.' },
      { p: '¿Qué puntaje de PAA pide la Beca Descubre STEM?', r: 'Más de 1,250 puntos, además de promedio de preparatoria mayor o igual a 90. Es para estudiar ingenierías y aplica para los periodos que inician en enero y agosto.' },
      { p: '¿Tengo que presentar examen si vengo de una prepa de convenio?', r: 'Si tu prepa tiene convenio y tienes el promedio de pase automático, no: recibes tu carta de aceptación y el proceso no tiene costo. El promedio requerido varía según la prepa.' },
      { p: '¿El simulador de Vorka es la PAA oficial?', r: 'No. Es un simulador de práctica con reactivos originales y un puntaje estimado para orientar tu estudio. La PAA es una prueba del College Board. No estamos afiliados al ITESO ni al College Board.' },
    ],
  },
};

const CSS = `<style>
.pu-hero{padding:clamp(12px,3vw,40px) 0 clamp(32px,4vw,56px)}
.pu-hero h1{margin-top:14px;max-width:820px}.pu-hero .t-lead{margin-top:14px;max-width:720px}
.pu-fuente{margin-top:16px;font-size:14px;color:var(--fg-2);max-width:720px}.pu-fuente a{color:var(--morado)}
.pu-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pu-tabla{width:100%;border-collapse:collapse;margin-top:22px;font-size:15.5px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sombra)}
.pu-tabla th,.pu-tabla td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line)}
.pu-tabla thead th{font-size:13px;color:var(--fg-2);font-weight:650}.pu-tabla td{font-weight:750;font-size:18px}
@media(max-width:640px){.pu-tabla thead{display:none}.pu-tabla tr{display:grid;grid-template-columns:1fr 1fr;padding:8px 0;border-bottom:1px solid var(--line)}.pu-tabla th{grid-column:1/-1;border:0;padding-bottom:4px}.pu-tabla td{border:0;padding:6px 16px}.pu-tabla td::before{content:attr(data-c);display:block;font-size:12px;font-weight:600;color:var(--fg-2)}}
.pu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;margin-top:24px}
.pu-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--sombra)}
.pu-card h3{font-size:17.5px;letter-spacing:-.02em;margin-bottom:6px}.pu-card p{color:var(--fg-2);font-size:15.5px}
.pu-pasos{display:grid;gap:12px;margin-top:24px;counter-reset:p}
.pu-paso{display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:start;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}
.pu-paso::before{counter-increment:p;content:counter(p);width:36px;height:36px;border-radius:12px;background:var(--morado-suave);color:var(--morado);display:grid;place-items:center;font-weight:800}
.pu-paso b{display:block;font-size:17px}.pu-paso span{color:var(--fg-2);font-size:15.5px}
.pu-nota{margin-top:14px;font-size:14px;color:var(--fg-2)}
</style>`;

// "con la UDEM" / "con el Tecnológico de Monterrey (Tec)"
const de = u => `${u.art} ${esc(u.completo)}`;

// Página de una universidad, o null si no existe
export function paginaPaaUniversidad(clave) {
  const u = UNIVERSIDADES[clave];
  if (!u) return null;
  const ruta = `${RUTA}/${clave}/`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: u.faq.map(f => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Simulador PAA', item: `${SITIO}${RUTA}/` },
      { '@type': 'ListItem', position: 2, name: `PAA ${u.nombre}`, item: `${SITIO}${ruta}` }] },
  ];
  const m = u.minimos;
  return pagina({ titulo: u.titulo, ruta, descripcion: u.descripcion, imagen: `${SITIO}/assets/tienda/v3/simulador-paa-og.jpg`,
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${CSS}`,
    cuerpo: `
<section class="pu-hero"><div class="marco">
  <nav class="t-volver" aria-label="Ruta"><a href="${RUTA}/">Simulador PAA</a> / PAA ${esc(u.nombre)}</nav>
  <h1 class="t-h1">${esc(u.h1)}</h1>
  <p class="t-lead">${esc(u.lead)}</p>
  <p class="pu-fuente">${u.fuentes.length > 1 ? 'Fuentes' : 'Fuente'}: ${u.fuentes.map(x => `<a href="${esc(x.url)}" rel="noopener">${esc(x.nombre)}</a>`).join('; ')}. Revisado el ${esc(u.verificado)}. Confirma siempre los requisitos vigentes con ${de(u)}.</p>
  <div class="pu-botones"><a class="btn tinta" href="${RUTA}/">Practicar con el simulador PAA ${FLECHA}</a><a class="btn blanco" href="${RUTA}/#probar">Probar un reactivo gratis</a></div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">${esc(u.pideEtiqueta || 'Puntajes mínimos')}</span><h2 class="h2" style="margin-top:14px">Lo que pide ${u.art} ${esc(u.nombre)} en la PAA</h2></div>
  ${m ? `<table class="pu-tabla"><thead><tr><th scope="col">Programa</th>${m.columnas.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
  <tbody>${m.filas.map(([p, ...v]) => `<tr><th scope="row">${esc(p)}</th>${v.map((x, i) => `<td data-c="${esc(m.columnas[i])}" class="num">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p class="pu-nota">${esc(m.nota)}</p>` : `<div class="pu-grid">${u.pide.map(([t, p]) => `<div class="pu-card"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`}
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">Reglas que conviene saber</span><h2 class="h2" style="margin-top:14px">Antes de presentar la PAA para ${u.art} ${esc(u.nombre)}</h2></div>
  <div class="pu-grid">${u.reglas.map(([t, p]) => `<div class="pu-card"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div class="cab"><span class="etiqueta">Tu plan, con el simulador</span><h2 class="h2" style="margin-top:14px">Cómo llegar a tu puntaje</h2>
  <p class="lead">Esto ya es consejo nuestro, no regla ${u.art === 'el' ? 'del' : 'de la'} ${esc(u.nombre)}.</p></div>
  <div class="pu-pasos">${u.plan.map(([t, p]) => `<div class="pu-paso"><div><b>${esc(t)}</b><span>${esc(p)}</span></div></div>`).join('')}</div>
  <div class="pu-botones"><a class="btn tinta" href="${RUTA}/">Ver planes del simulador ${FLECHA}</a></div>
</div></section>

<section class="t-sec"><div class="marco">
  <div class="cab"><span class="etiqueta">La prueba</span><h2 class="h2" style="margin-top:14px">Cómo es la PAA</h2></div>
  <ul class="pu-grid" style="list-style:none;padding:0">
    <li class="pu-card"><h3>Lectura y Redacción</h3><p>70 reactivos. Es la parte verbal.</p></li>
    <li class="pu-card"><h3>Matemáticas</h3><p>55 reactivos. Es la parte matemática.</p></li>
    <li class="pu-card"><h3>Inglés</h3><p>50 reactivos.</p></li>
  </ul>
  <p class="pu-nota">${CHECK.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} Cada parte se califica de 200 a 800. Fuente: <a href="${PAA_2020}" rel="noopener">guía de preguntas y respuestas de la PAA del College Board (2020)</a>. Puede haber cambiado: confírmalo con la universidad donde la vas a presentar.</p>
  <p class="pu-nota">Más a fondo: <a href="/simulador-paa/guias/que-es-la-paa/">qué es la PAA y qué viene</a>, <a href="/simulador-paa/guias/puntaje-paa/">cómo se calcula el puntaje</a> y <a href="/simulador-paa/guias/como-prepararte-para-la-paa/">cómo prepararte en 4 semanas</a>.</p>
</div></section>

<section class="t-sec suave"><div class="marco">
  <div><span class="etiqueta">Preguntas frecuentes</span><h2 class="h2" style="margin-top:14px">PAA y admisión ${u.art === 'el' ? 'al' : 'a la'} ${esc(u.nombre)}</h2></div>
  <div class="t-faq" style="margin-top:22px">${u.faq.map(f => `<details><summary>${esc(f.p)}</summary><div>${esc(f.r)}</div></details>`).join('')}</div>
</div></section>

<section class="t-sec"><div class="marco"><p class="t-nota">Página informativa de Vorka México. No estamos afiliados ${u.art === 'el' ? 'al' : 'a la'} ${esc(u.completo)} ni al College Board; PAA es una prueba del College Board. Los requisitos salen de las fuentes oficiales citadas arriba y pueden cambiar.</p></div></section>`,
  });
}
