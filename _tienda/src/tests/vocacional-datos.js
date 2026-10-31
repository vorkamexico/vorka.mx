// Test vocacional Vorka · contenido propio (preguntas, perfiles y catálogo de carreras).
//
// Base: la teoría de intereses vocacionales de John L. Holland (seis tipos: Realista, Investigador, Artístico, Social,
// Emprendedor y Convencional, «RIASEC»). La teoría es conocimiento público; las preguntas de este archivo son 100 %
// originales de Vorka México, escritas en español de México. NO se copió ningún reactivo de instrumentos con derechos
// (Self-Directed Search, Strong, etc.). El O*NET Interest Profiler del Departamento del Trabajo de EE. UU. se usó solo
// como referencia conceptual de cómo se describen los seis tipos; no se usa ninguno de sus reactivos ni de sus textos.
//
// Es una herramienta ORIENTATIVA: no es una prueba psicométrica estandarizada ni un diagnóstico. Así se dice en cada página.
//
// Catálogo de carreras: nombres genéricos de licenciaturas en México. «Qué se estudia» y «en qué se trabaja» son
// descripciones generales escritas por Vorka. El código RIASEC de cada carrera lo asignó Vorka como referencia (no es un
// dato oficial). area: el área de la UNAM donde está esa licenciatura (1 Físico-Matemáticas e Ingenierías, 2 Biológicas,
// Químicas y de la Salud, 3 Sociales, 4 Humanidades y Artes); 0 = no la asignamos (no la ubicamos con ese nombre o no
// tenemos certeza): el reporte pide confirmarlo en la guía de carreras de la UNAM. No se dice en qué universidad se estudia.

export const TIPOS = {
  R: { nombre: 'Realista', corto: 'Hacer con tus manos', color: '#B5651D',
    frase: 'Te gusta lo concreto: construir, reparar, moverte y ver resultados que se pueden tocar.',
    perfil: 'Las personas con intereses realistas disfrutan trabajar con objetos, herramientas, máquinas, plantas o animales. Prefieren aprender haciendo y les satisface ver un resultado tangible: algo que funciona, que quedó armado o que creció. Suelen ser prácticas y directas.',
    fortalezas: ['Resolver problemas prácticos', 'Habilidad manual y sentido espacial', 'Constancia en tareas físicas o técnicas'],
    ambientes: ['Talleres y laboratorios técnicos', 'Obras, campo o planta industrial', 'Trabajo al aire libre'],
    cuidar: 'Puede costarte la teoría que no ves aplicada. Busca carreras con prácticas desde los primeros semestres.',
    explorar: ['Arma o repara algo que nunca hayas abierto (con un tutorial) y anota qué disfrutaste', 'Visita un taller, una obra o una granja y pregunta cómo es un día normal'] },
  I: { nombre: 'Investigador', corto: 'Entender y descubrir', color: '#2F6FB0',
    frase: 'Te gusta entender por qué pasan las cosas: preguntar, analizar y comprobar.',
    perfil: 'Las personas con intereses de investigación disfrutan observar, analizar y resolver problemas complejos. Les atraen las ciencias, las matemáticas y la tecnología, y se sienten cómodas con preguntas que no tienen respuesta inmediata. Suelen ser curiosas, críticas y metódicas.',
    fortalezas: ['Pensamiento analítico', 'Curiosidad y aprendizaje autónomo', 'Rigor para comprobar ideas'],
    ambientes: ['Laboratorios y centros de investigación', 'Equipos de tecnología y datos', 'Hospitales y clínicas'],
    cuidar: 'Puedes perderte en los detalles. Practica explicar tus ideas en sencillo y terminar a tiempo.',
    explorar: ['Elige una pregunta que te intrigue y busca 3 fuentes confiables para responderla', 'Haz un curso gratis de programación, estadística o ciencias y mide cuánto lo disfrutas'] },
  A: { nombre: 'Artístico', corto: 'Crear y expresar', color: '#9A3B8C',
    frase: 'Te gusta crear algo propio: diseñar, escribir, actuar o imaginar lo que no existe.',
    perfil: 'Las personas con intereses artísticos disfrutan expresarse y crear con libertad: imágenes, textos, música, espacios o experiencias. Prefieren tareas sin una sola respuesta correcta y valoran la originalidad. Suelen ser sensibles, imaginativas e independientes.',
    fortalezas: ['Creatividad y originalidad', 'Sensibilidad estética', 'Comunicar ideas de forma memorable'],
    ambientes: ['Estudios de diseño, foto o video', 'Agencias creativas, editoriales y medios', 'Escenarios, museos y espacios culturales'],
    cuidar: 'La rutina y las reglas rígidas pueden pesarte. Combina tu creatividad con un oficio concreto (diseño, comunicación, arquitectura) para que se convierta en trabajo.',
    explorar: ['Haz un proyecto creativo con fecha de entrega (un cartel, un video, un cuento) y compártelo', 'Arma un portafolio sencillo con 5 trabajos tuyos'] },
  S: { nombre: 'Social', corto: 'Ayudar y enseñar', color: '#2E8B57',
    frase: 'Te gusta estar con personas: escuchar, explicar, cuidar y ayudar a que otros crezcan.',
    perfil: 'Las personas con intereses sociales disfrutan ayudar, enseñar, orientar o cuidar a otras. Se fijan en cómo se sienten los demás y les satisface ver que alguien mejora gracias a su apoyo. Suelen ser empáticas, pacientes y cooperativas.',
    fortalezas: ['Empatía y escucha', 'Explicar y enseñar', 'Trabajo en equipo y comunidad'],
    ambientes: ['Escuelas y centros comunitarios', 'Hospitales, clínicas y consultorios', 'Organizaciones sociales y gobierno'],
    cuidar: 'Puedes cargar con los problemas de otros. Aprende a poner límites y a cuidarte tú también.',
    explorar: ['Haz voluntariado unas horas (en una escuela, un asilo o una organización) y anota cómo te sentiste', 'Da una asesoría a alguien de un tema que domines'] },
  E: { nombre: 'Emprendedor', corto: 'Liderar y convencer', color: '#C8A45C',
    frase: 'Te gusta tomar la iniciativa: dirigir, vender una idea, negociar y hacer que las cosas pasen.',
    perfil: 'Las personas con intereses emprendedores disfrutan influir, organizar personas y tomar decisiones para lograr metas. Les atraen los negocios, el liderazgo y la competencia, y no les asusta el riesgo. Suelen ser seguras, persuasivas y con mucha energía.',
    fortalezas: ['Iniciativa y liderazgo', 'Persuasión y negociación', 'Tomar decisiones con información incompleta'],
    ambientes: ['Empresas y startups', 'Ventas, mercadotecnia y negocios', 'Política, despachos y consultoría'],
    cuidar: 'Puedes aburrirte con tareas de detalle. Rodéate de gente ordenada y aprende lo básico de números.',
    explorar: ['Vende algo pequeño en tu escuela o en línea durante 2 semanas y lleva tus cuentas', 'Organiza un evento o una actividad con un equipo y una meta clara'] },
  C: { nombre: 'Convencional', corto: 'Ordenar y administrar', color: '#5B6B7A',
    frase: 'Te gusta el orden: que los datos cuadren, que haya un método y que todo salga sin errores.',
    perfil: 'Las personas con intereses convencionales disfrutan organizar información, seguir procedimientos y trabajar con datos, números y documentos. Valoran la claridad, la estabilidad y hacer bien las cosas desde la primera vez. Suelen ser responsables, precisas y confiables.',
    fortalezas: ['Organización y precisión', 'Manejo de datos y números', 'Responsabilidad y constancia'],
    ambientes: ['Oficinas y áreas de administración', 'Bancos, despachos contables y gobierno', 'Áreas de calidad, logística y sistemas'],
    cuidar: 'Los cambios inesperados pueden estresarte. Practica decisiones rápidas en situaciones sin manual.',
    explorar: ['Lleva durante un mes un registro de tus gastos en una hoja de cálculo', 'Ayuda a organizar las cuentas o el inventario de un negocio familiar'] },
};
export const ORDEN_TIPOS = ['R', 'I', 'A', 'S', 'E', 'C'];

// 30 preguntas de intereses (5 por tipo, intercaladas). Respuesta: 2 = me gusta, 1 = me da igual, 0 = no me gusta.
export const INTERESES = [
  ['R', 'Armar o reparar cosas: una bici, un mueble, un aparato.'],
  ['I', 'Resolver un problema difícil de matemáticas o de lógica.'],
  ['A', 'Dibujar, diseñar, tomar fotos o hacer videos.'],
  ['S', 'Explicarle un tema a alguien hasta que lo entienda.'],
  ['E', 'Vender algo o convencer a otras personas de una idea.'],
  ['C', 'Llevar el control del dinero, un inventario o unos registros.'],
  ['R', 'Trabajar al aire libre: en el campo, en una obra o con animales.'],
  ['I', 'Hacer experimentos para comprobar si una idea es cierta.'],
  ['A', 'Escribir historias, poemas, guiones o canciones.'],
  ['S', 'Escuchar a una amiga o un amigo con un problema y ayudarle a ver opciones.'],
  ['E', 'Dirigir a un equipo para lograr una meta.'],
  ['C', 'Organizar archivos, horarios o listas para que todo esté en orden.'],
  ['R', 'Usar herramientas o máquinas para construir algo con tus manos.'],
  ['I', 'Investigar por qué pasa algo: una enfermedad, un fenómeno natural, un dato raro.'],
  ['A', 'Actuar, bailar, cantar o tocar un instrumento frente a otras personas.'],
  ['S', 'Cuidar o acompañar a niñas, niños, personas mayores o enfermas.'],
  ['E', 'Empezar un negocio o un proyecto propio, aunque tenga riesgo.'],
  ['C', 'Seguir un procedimiento paso a paso y que salga sin errores.'],
  ['R', 'Entender cómo funciona un motor, un circuito o una instalación eléctrica.'],
  ['I', 'Leer o ver contenido de ciencia, tecnología o el espacio por gusto.'],
  ['A', 'Inventar cómo se ve algo: un logo, un cuarto, una prenda, un personaje.'],
  ['S', 'Participar como voluntaria o voluntario en tu comunidad.'],
  ['E', 'Hablar en público o representar a tu grupo.'],
  ['C', 'Trabajar con hojas de cálculo, formularios o bases de datos.'],
  ['R', 'Cuidar plantas, cultivos o animales.'],
  ['I', 'Analizar datos o gráficas para sacar una conclusión.'],
  ['A', 'Expresar ideas de forma original, aunque no haya una respuesta correcta.'],
  ['S', 'Organizar actividades para que un grupo conviva y se integre.'],
  ['E', 'Negociar: llegar a un acuerdo que convenga a las dos partes.'],
  ['C', 'Revisar documentos para encontrar errores o datos que no cuadran.'],
];
export const OPC_INTERES = [[2, 'Me gusta'], [1, 'Me da igual'], [0, 'No me gusta']];

// 12 preguntas de habilidades percibidas (2 por tipo). Respuesta 1 a 4.
export const HABILIDADES = [
  ['R', 'Usar herramientas o arreglar cosas.'],
  ['I', 'Matemáticas y resolver problemas.'],
  ['A', 'Crear algo original: un dibujo, una canción, un texto, un diseño.'],
  ['S', 'Explicar y enseñar a otras personas.'],
  ['E', 'Convencer y hablar en público.'],
  ['C', 'Ser ordenada u ordenado y entregar a tiempo.'],
  ['R', 'Actividades físicas o manuales que piden precisión.'],
  ['I', 'Entender temas de ciencias: biología, química o física.'],
  ['A', 'Imaginar soluciones distintas a las de siempre.'],
  ['S', 'Darte cuenta de cómo se sienten los demás.'],
  ['E', 'Tomar decisiones y organizar a un equipo.'],
  ['C', 'Trabajar con números y datos sin equivocarte.'],
];
export const OPC_HABILIDAD = [[4, 'Muy bien'], [3, 'Bien'], [2, 'Me cuesta'], [1, 'Me cuesta mucho']];

// Preferencias y contexto (una opción cada una)
export const PREFERENCIAS = {
  mate: { p: '¿Cómo te llevas con las matemáticas?', o: [['gustan', 'Me gustan'], ['aguanto', 'Las aguanto'], ['evitar', 'Prefiero evitarlas']] },
  lugar: { p: '¿Dónde te imaginas trabajando?', o: [['R', 'En un taller, una obra o al aire libre'], ['I', 'En un laboratorio o frente a la computadora resolviendo problemas'], ['A', 'En un estudio creativo'], ['S', 'Con gente: escuela, hospital o comunidad'], ['E', 'Dirigiendo un negocio o un equipo'], ['C', 'En una oficina con orden y procesos claros']] },
  motivo: { p: '¿Qué pesa más para ti al elegir carrera?', o: [['S', 'Ayudar a otras personas'], ['E', 'Ganar bien y crecer rápido'], ['A', 'Crear cosas propias'], ['I', 'Aprender y descubrir'], ['C', 'Tener estabilidad'], ['R', 'Hacer cosas concretas y útiles']] },
  duracion: { p: '¿Cuánto tiempo quieres estudiar después de la prepa?', o: [['corta', 'Lo menos posible: quiero trabajar pronto'], ['lic', 'Una licenciatura de 4 o 5 años'], ['larga', 'Lo que haga falta, incluso un posgrado'], ['nose', 'Todavía no sé']] },
  nivel: { p: '¿En qué vas?', o: [['secundaria', 'Secundaria'], ['prepa', 'Prepa o bachillerato'], ['egresado', 'Ya terminé la prepa'], ['universidad', 'Ya estoy en la universidad y quiero cambiar']] },
  examen: { p: '¿Dónde piensas presentar examen?', o: [['unam', 'UNAM'], ['ipn', 'IPN'], ['ug', 'Universidad de Guanajuato'], ['privada', 'Una universidad privada'], ['otra', 'Otra o todavía no sé']] },
};

// ---------- catálogo de carreras ----------
// [nombre, código RIASEC, área UNAM (0 = sin asignar), matemáticas ('alta' | 'media' | 'baja'), qué se estudia, en qué se trabaja]
const C = (n, c, a, m, e, t) => ({ n, c, a, m, e, t });
export const CARRERAS = [
  // Área 1 · Físico-Matemáticas e Ingenierías
  C('Ingeniería Civil', 'RIC', 1, 'alta', 'Estructuras, materiales, hidráulica, topografía, cálculo y gestión de obras.', 'Constructoras, obra pública, supervisión y cálculo de estructuras, vías de comunicación y agua.'),
  C('Ingeniería Mecánica', 'RIC', 1, 'alta', 'Mecánica, termodinámica, diseño de máquinas y procesos de manufactura.', 'Industria automotriz y de manufactura, mantenimiento industrial y energía.'),
  C('Ingeniería Mecatrónica', 'RIE', 1, 'alta', 'Mecánica, electrónica, control automático y programación de robots.', 'Automatización de fábricas, robótica, diseño de equipos y líneas de producción.'),
  C('Ingeniería Eléctrica Electrónica', 'IRC', 1, 'alta', 'Circuitos, sistemas eléctricos de potencia, electrónica y control.', 'Empresas de energía, industria electrónica, telecomunicaciones y mantenimiento de instalaciones.'),
  C('Ingeniería en Computación', 'IRC', 1, 'alta', 'Programación, arquitectura de computadoras, redes y sistemas digitales.', 'Desarrollo de software, infraestructura tecnológica, sistemas embebidos y ciberseguridad.'),
  C('Ingeniería en Telecomunicaciones', 'IRC', 1, 'alta', 'Señales, redes, comunicaciones inalámbricas y fibra óptica.', 'Empresas de telefonía e internet, redes corporativas y transmisión de datos.'),
  C('Ingeniería Industrial', 'ECI', 1, 'alta', 'Procesos, calidad, logística, estadística y administración de operaciones.', 'Manufactura, logística, cadenas de suministro, calidad y consultoría de procesos.'),
  C('Ingeniería Ambiental', 'IRS', 0, 'alta', 'Contaminación del agua, el aire y el suelo, tratamiento de residuos e impacto ambiental.', 'Consultoría ambiental, industria (cumplimiento de normas), gobierno y organizaciones ambientales.'),
  C('Ingeniería Petrolera', 'RIC', 1, 'alta', 'Geología, yacimientos, perforación y producción de hidrocarburos.', 'Empresas de energía, servicios petroleros y evaluación de yacimientos.'),
  C('Ingeniería Geológica', 'IRC', 1, 'alta', 'Rocas, suelos, mapas geológicos y riesgos naturales.', 'Minería, construcción (estudios de suelo), agua subterránea y protección civil.'),
  C('Arquitectura', 'ARI', 1, 'media', 'Diseño arquitectónico, construcción, estructuras, historia y representación.', 'Despachos de arquitectura, construcción, desarrollo inmobiliario y diseño de interiores.'),
  C('Diseño Industrial', 'ARE', 1, 'media', 'Diseño de productos, materiales, procesos de fabricación y ergonomía.', 'Diseño de muebles, empaques y productos, manufactura y emprendimiento.'),
  C('Urbanismo', 'IAS', 1, 'media', 'Planeación de ciudades, uso de suelo, movilidad y vivienda.', 'Gobierno municipal y estatal, consultoría urbana y desarrollo inmobiliario.'),
  C('Actuaría', 'ICE', 1, 'alta', 'Probabilidad, estadística, finanzas y modelos de riesgo.', 'Aseguradoras, bancos, administradoras de fondos para el retiro y análisis de riesgo.'),
  C('Matemáticas', 'IAC', 1, 'alta', 'Álgebra, análisis, geometría, probabilidad y demostraciones.', 'Docencia, investigación, análisis de datos, finanzas y tecnología.'),
  C('Física', 'IRC', 1, 'alta', 'Mecánica, electromagnetismo, física cuántica y experimentación.', 'Investigación, docencia, instrumentación, tecnología y análisis de datos.'),
  C('Ciencias de la Computación', 'ICR', 1, 'alta', 'Algoritmos, programación, teoría de la computación e inteligencia artificial.', 'Desarrollo de software, ciencia de datos, investigación y empresas de tecnología.'),
  C('Matemáticas Aplicadas y Computación', 'ICR', 1, 'alta', 'Matemáticas, programación, optimización y modelación.', 'Análisis de datos, desarrollo de software, finanzas y consultoría.'),
  C('Ciencia de Datos', 'ICE', 1, 'alta', 'Estadística, programación, bases de datos y aprendizaje automático.', 'Análisis de datos en empresas, gobierno, salud, comercio y tecnología.'),
  // Área 2 · Biológicas, Químicas y de la Salud
  C('Medicina (Médico Cirujano)', 'ISR', 2, 'media', 'Anatomía, fisiología, farmacología, clínica e internado en hospitales.', 'Hospitales, clínicas, consultorio propio, salud pública e investigación.'),
  C('Enfermería', 'SIR', 2, 'media', 'Cuidado del paciente, procedimientos clínicos, salud comunitaria y farmacología.', 'Hospitales, clínicas, atención en casa, escuelas y salud pública.'),
  C('Odontología (Cirujano Dentista)', 'IRS', 2, 'media', 'Anatomía de la boca, prevención, tratamientos dentales y prácticas con pacientes.', 'Consultorio propio, clínicas dentales, salud pública y especialidades.'),
  C('Psicología', 'SIA', 2, 'media', 'Procesos mentales, desarrollo humano, evaluación, estadística e intervención.', 'Clínica, escuelas, empresas (recursos humanos), salud y organizaciones sociales.'),
  C('Biología', 'IRA', 2, 'media', 'Seres vivos, ecología, genética, evolución y trabajo de campo.', 'Investigación, conservación, docencia, laboratorios e industria.'),
  C('Medicina Veterinaria y Zootecnia', 'IRS', 2, 'media', 'Anatomía y salud animal, producción animal y clínica veterinaria.', 'Clínicas veterinarias, granjas y ranchos, industria alimentaria y salud pública.'),
  C('Optometría', 'ISR', 2, 'media', 'Visión, óptica, evaluación de la vista y adaptación de lentes.', 'Ópticas, consultorio propio, clínicas oftalmológicas y salud escolar.'),
  C('Fisioterapia', 'SRI', 2, 'baja', 'Anatomía, movimiento, rehabilitación y terapia física.', 'Clínicas de rehabilitación, hospitales, deporte y consultorio propio.'),
  C('Nutriología', 'SIE', 2, 'media', 'Alimentación, bioquímica, nutrición clínica y salud pública.', 'Consulta, hospitales, industria de alimentos, deporte y programas comunitarios.'),
  C('Ciencia Forense', 'IRC', 2, 'media', 'Criminalística, química y biología forense, derecho y análisis de evidencia.', 'Fiscalías, servicios periciales, laboratorios y peritaje privado.'),
  C('Ingeniería Agrícola', 'RIE', 2, 'media', 'Suelos, cultivos, riego, maquinaria agrícola y producción.', 'Agronegocios, producción agrícola, asesoría técnica y gobierno.'),
  C('Ciencias Genómicas', 'IRC', 2, 'alta', 'Genética, biología molecular, bioinformática y estadística.', 'Investigación, laboratorios de diagnóstico y biotecnología.'),
  // Área 3 · Ciencias Sociales
  C('Administración', 'ECS', 3, 'media', 'Organización de empresas, finanzas, mercadotecnia, recursos humanos y estrategia.', 'Empresas de todo tamaño, negocio propio, gobierno y consultoría.'),
  C('Contaduría', 'CEI', 3, 'media', 'Contabilidad, impuestos, auditoría, costos y finanzas.', 'Despachos contables, áreas de finanzas, auditoría y negocio propio.'),
  C('Derecho', 'ESI', 3, 'baja', 'Leyes, constitución, derecho civil, penal, laboral y mercantil, y argumentación.', 'Despachos, juzgados y fiscalías, empresas, notarías y gobierno.'),
  C('Economía', 'IEC', 3, 'alta', 'Microeconomía, macroeconomía, estadística, econometría y política económica.', 'Bancos, gobierno, consultoría, análisis de mercados e investigación.'),
  C('Relaciones Internacionales', 'ESA', 3, 'baja', 'Política internacional, historia, comercio exterior, idiomas y diplomacia.', 'Servicio exterior, organismos internacionales, comercio exterior y empresas globales.'),
  C('Ciencias Políticas y Administración Pública', 'ESI', 3, 'baja', 'Teoría política, gobierno, políticas públicas y análisis social.', 'Gobierno, partidos y congresos, consultoría política y organizaciones sociales.'),
  C('Sociología', 'ISA', 3, 'media', 'Sociedad, desigualdad, métodos de investigación y estadística social.', 'Investigación, encuestas y opinión pública, gobierno y organizaciones sociales.'),
  C('Ciencias de la Comunicación', 'AES', 3, 'baja', 'Periodismo, producción audiovisual, comunicación organizacional y medios digitales.', 'Medios, agencias de comunicación, áreas de comunicación de empresas y producción de contenido.'),
  C('Trabajo Social', 'SEC', 3, 'baja', 'Intervención social, comunidad, familia, políticas sociales e investigación.', 'Gobierno, hospitales, escuelas, organizaciones sociales y programas comunitarios.'),
  C('Informática', 'CIE', 3, 'media', 'Sistemas de información, bases de datos, programación y administración de tecnología.', 'Áreas de sistemas de empresas, desarrollo de software y consultoría tecnológica.'),
  C('Negocios Internacionales', 'ECS', 3, 'media', 'Comercio exterior, logística internacional, finanzas e idiomas.', 'Empresas exportadoras e importadoras, logística, aduanas y consultoría.'),
  C('Antropología', 'ISA', 0, 'baja', 'Culturas, sociedades, métodos de campo y patrimonio.', 'Investigación, museos, gobierno, desarrollo comunitario y consultoría social.'),
  // Área 4 · Humanidades y Artes
  C('Pedagogía', 'SAE', 4, 'baja', 'Teorías del aprendizaje, diseño de programas educativos, orientación y evaluación.', 'Escuelas, capacitación en empresas, diseño de cursos y orientación educativa.'),
  C('Filosofía', 'AIS', 4, 'baja', 'Ética, lógica, historia de las ideas y argumentación.', 'Docencia, investigación, edición, ética en organizaciones y consultoría.'),
  C('Historia', 'IAS', 4, 'baja', 'Procesos históricos, investigación en archivos y escritura.', 'Docencia, investigación, museos, archivos y divulgación.'),
  C('Lengua y Literaturas Hispánicas', 'ASI', 4, 'baja', 'Literatura, lingüística, análisis de textos y escritura.', 'Docencia, edición, corrección de estilo, escritura y medios.'),
  C('Diseño y Comunicación Visual', 'AER', 4, 'baja', 'Diseño gráfico, ilustración, fotografía, tipografía y medios digitales.', 'Agencias y estudios de diseño, editoriales, medios digitales y trabajo independiente.'),
  C('Artes Visuales', 'AIR', 4, 'baja', 'Pintura, escultura, grabado, arte digital y teoría del arte.', 'Producción artística, galerías y museos, docencia y diseño.'),
  C('Música', 'ASR', 4, 'baja', 'Instrumento o canto, teoría musical, armonía y práctica de conjunto.', 'Orquestas y agrupaciones, docencia, producción musical y espectáculos.'),
  C('Literatura Dramática y Teatro', 'ASE', 4, 'baja', 'Actuación, dirección, dramaturgia e historia del teatro.', 'Compañías de teatro, cine y televisión, docencia y gestión cultural.'),
  C('Cinematografía', 'AER', 4, 'baja', 'Guion, dirección, fotografía, edición y producción de cine.', 'Producción audiovisual, cine, publicidad y plataformas digitales.'),
  C('Enseñanza de Inglés', 'SAC', 4, 'baja', 'Lengua inglesa, didáctica y evaluación del aprendizaje de idiomas.', 'Escuelas, institutos de idiomas, capacitación en empresas y clases particulares.'),
  C('Traducción', 'ACI', 4, 'baja', 'Idiomas, técnicas de traducción e interpretación y cultura.', 'Traducción independiente, editoriales, empresas globales y organismos internacionales.'),
  C('Bibliotecología y Estudios de la Información', 'CIS', 4, 'baja', 'Organización de la información, archivos, bibliotecas y gestión documental.', 'Bibliotecas, archivos, centros de documentación y gestión de información en empresas.'),
  C('Danza', 'ARS', 0, 'baja', 'Técnica de danza, composición coreográfica, historia y pedagogía de la danza.', 'Compañías de danza, docencia, espectáculos y gestión cultural.'),
  // Sin área asignada (nombres genéricos; se ofrecen en universidades públicas y privadas con distintos nombres)
  C('Química', 'IRC', 0, 'alta', 'Química orgánica, inorgánica, analítica, fisicoquímica y laboratorio.', 'Laboratorios, industria química y farmacéutica, control de calidad e investigación.'),
  C('Ingeniería Química', 'IRC', 0, 'alta', 'Procesos químicos, balances de materia y energía, diseño de plantas.', 'Industria química, farmacéutica, de alimentos y energía.'),
  C('Química Farmacéutico Biológica', 'IRC', 0, 'alta', 'Química, biología, análisis clínicos y desarrollo de medicamentos.', 'Laboratorios clínicos, industria farmacéutica, hospitales y control de calidad.'),
  C('Biotecnología', 'IRC', 0, 'alta', 'Biología molecular, microbiología, bioprocesos y genética.', 'Industria de alimentos, farmacéutica y agrícola, laboratorios e investigación.'),
  C('Ingeniería Biomédica', 'IRS', 0, 'alta', 'Electrónica, biología, equipos médicos e imagenología.', 'Hospitales (equipo médico), empresas de dispositivos médicos e investigación.'),
  C('Ingeniería Aeronáutica', 'RIC', 0, 'alta', 'Aerodinámica, estructuras, motores y mantenimiento de aeronaves.', 'Industria aeroespacial, aerolíneas y mantenimiento de aeronaves.'),
  C('Ingeniería en Sistemas Computacionales', 'ICR', 0, 'alta', 'Programación, bases de datos, redes e ingeniería de software.', 'Desarrollo de software, sistemas en empresas, consultoría y tecnología.'),
  C('Ingeniería en Logística', 'CER', 0, 'media', 'Cadena de suministro, transporte, almacenes e inventarios.', 'Empresas de logística, distribución, comercio electrónico y manufactura.'),
  C('Mercadotecnia', 'EAS', 0, 'media', 'Investigación de mercados, marca, publicidad, ventas y marketing digital.', 'Agencias, áreas de marketing, comercio electrónico y negocio propio.'),
  C('Finanzas', 'CEI', 0, 'alta', 'Mercados financieros, inversiones, análisis financiero y riesgo.', 'Bancos, casas de bolsa, áreas de finanzas de empresas y asesoría.'),
  C('Gastronomía', 'ARE', 0, 'baja', 'Técnicas de cocina, panadería, administración de restaurantes e higiene.', 'Restaurantes, hoteles, banquetes, producción de alimentos y negocio propio.'),
  C('Turismo', 'ESC', 0, 'baja', 'Gestión de hoteles y destinos, agencias de viajes, idiomas y servicio.', 'Hoteles, agencias, aerolíneas, eventos y promoción turística.'),
  C('Diseño de Modas', 'AER', 0, 'baja', 'Diseño de prendas, patronaje, textiles e industria de la moda.', 'Marcas de ropa, producción textil, estilismo y marca propia.'),
  C('Animación y Arte Digital', 'AIR', 0, 'media', 'Dibujo, modelado 3D, animación y producción digital.', 'Estudios de animación, videojuegos, publicidad y trabajo independiente.'),
  C('Criminología', 'ISE', 0, 'baja', 'Causas del delito, victimología, derecho penal y prevención.', 'Seguridad pública y privada, sistema penitenciario, fiscalías y prevención del delito.'),
  C('Ciencias del Deporte', 'SRE', 0, 'baja', 'Entrenamiento, fisiología del ejercicio, nutrición deportiva y gestión deportiva.', 'Clubes, escuelas, gimnasios, entrenamiento personal y programas de activación física.'),
  C('Educación Primaria', 'SAC', 0, 'baja', 'Didáctica, desarrollo infantil, planeación y evaluación del aprendizaje.', 'Escuelas primarias públicas y privadas, apoyo educativo y diseño de materiales.'),
  C('Gerontología', 'SIC', 0, 'baja', 'Envejecimiento, salud del adulto mayor, cuidados y políticas sociales.', 'Residencias y centros de día, programas de gobierno, atención en casa y organizaciones sociales.'),
  C('Comercio Internacional', 'ECS', 0, 'media', 'Aduanas, tratados comerciales, logística y negociación.', 'Agencias aduanales, empresas exportadoras, logística y gobierno.'),
];

export const AREAS_UNAM = {
  1: 'Área 1 · Ciencias Físico-Matemáticas y de las Ingenierías',
  2: 'Área 2 · Ciencias Biológicas, Químicas y de la Salud',
  3: 'Área 3 · Ciencias Sociales',
  4: 'Área 4 · Humanidades y de las Artes',
};
// Ramas del IPN (nivel superior). Se sugiere la rama equivalente al área; si la carrera se imparte ahí, se confirma en su convocatoria.
export const RAMAS_IPN = { 1: 'Ingeniería y Ciencias Físico Matemáticas', 2: 'Ciencias Médico Biológicas', 3: 'Ciencias Sociales y Administrativas' };

// ---------- plan de 30 días y preguntas (se personalizan con tus tipos y carreras) ----------
export const PLAN_30 = [
  { semana: 'Semana 1 · Conócete', tareas: [
    'Relee tu perfil y subraya 3 frases que sí te describen y 1 que no.',
    'Escribe en una hoja las 5 carreras de tu reporte que más te llamaron la atención y por qué.',
    'Pregunta a 2 personas que te conocen bien en qué te ven trabajando y compáralo con tu resultado.',
    '{explorar1}',
  ] },
  { semana: 'Semana 2 · Investiga', tareas: [
    'Busca el plan de estudios de {carrera1} y {carrera2} en la página de 2 universidades distintas.',
    'Marca en cada plan las 3 materias que más te emocionan y las 3 que más te asustan.',
    'Revisa qué examen de admisión pide cada universidad, sus fechas y sus requisitos.',
    'Mira 2 videos o entrevistas de personas que trabajan en {carrera1}.',
  ] },
  { semana: 'Semana 3 · Pruébalo', tareas: [
    'Habla 20 minutos con alguien que estudie o ejerza {carrera1}: usa las preguntas de este reporte.',
    '{explorar2}',
    'Si puedes, acompaña a alguien a su trabajo media jornada o visita una feria de universidades.',
    'Haz un diagnóstico de tu examen de admisión para saber de dónde partes.',
  ] },
  { semana: 'Semana 4 · Decide', tareas: [
    'Haz una tabla con tus 3 carreras finalistas: lo que te gusta, lo que te preocupa, costo y examen.',
    'Platica tu tabla con tu mamá, tu papá o tu orientador con las preguntas de abajo.',
    'Elige tu primera opción y una segunda opción realista.',
    'Arma tu calendario de estudio para el examen hasta el día de la prueba.',
  ] },
];
export const PREGUNTAS_FAMILIA = [
  '¿Qué ven en mí que yo no veo cuando hablan de mi futuro?',
  'De estas 3 carreras, ¿cuál creen que va más con cómo soy y por qué?',
  '¿Qué presupuesto real tenemos para colegiatura, transporte y materiales? ¿Necesito buscar beca?',
  '¿Estaría dispuesta o dispuesto a cambiarme de ciudad para estudiar? ¿Qué necesitaríamos?',
  '¿Qué les preocupa de {carrera1}? ¿Qué información nos falta para resolverlo?',
  '¿A quién conocemos que estudie o trabaje en algo de esto y pueda platicar conmigo?',
  '¿Cuál es nuestro plan B si no quedo a la primera?',
];
export const PREGUNTAS_PROFESIONAL = [
  '¿Cómo es un día normal en tu trabajo? ¿Qué es lo que más y lo que menos te gusta?',
  '¿Qué materia de la carrera fue la más difícil y cómo la sacaste?',
  '¿Qué habilidad te hubiera gustado desarrollar antes de entrar?',
  '¿Cómo está el trabajo en esta área hoy en tu ciudad?',
  'Si volvieras a elegir, ¿estudiarías lo mismo? ¿Por qué?',
];
