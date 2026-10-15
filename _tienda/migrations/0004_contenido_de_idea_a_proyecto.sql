-- Contenido de la página de venta del primer producto. BORRADOR: revisar y completar los 7 pasos con la guía.
-- Se puede editar después desde Vorka OS (Tienda → Productos).
UPDATE products SET contenido = json('{
  "titular": "De la idea al proyecto, paso a paso",
  "subtitulo": "Una guía práctica, un cuaderno de trabajo y una calculadora para ordenar tu idea, probarla y arrancar con números claros, sea un negocio o un proyecto social.",
  "portada": "De Idea a Proyecto",
  "incluye": [
    {"titulo": "Guía De Idea a Proyecto (PDF).", "texto": "El método completo, explicado paso a paso."},
    {"titulo": "Cuaderno de trabajo (Word).", "texto": "Ejercicios editables para aterrizar cada paso en tu propio proyecto."},
    {"titulo": "Calculadora (Excel).", "texto": "Costos, precio y punto de equilibrio sin fórmulas complicadas."}
  ],
  "pasos": [],
  "para_quien": [
    "Tienes una idea de negocio o de proyecto social y no sabes por dónde empezar.",
    "Ya empezaste, pero sientes que avanzas sin un plan claro.",
    "Necesitas saber cuánto cuesta arrancar y cuánto cobrar antes de invertir.",
    "Acompañas a emprendedores o jóvenes y quieres una herramienta lista para usar."
  ],
  "faq": [
    {"p": "¿Necesito experiencia previa?", "r": "No. El kit está pensado para empezar desde cero; cada paso explica qué hacer y trae un ejercicio para hacerlo."},
    {"p": "¿Qué programas necesito?", "r": "Un lector de PDF, Word (o Google Docs) y Excel (o Google Sheets). Funcionan en computadora; en celular puedes leer la guía."}
  ]
}'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'de-idea-a-proyecto';
