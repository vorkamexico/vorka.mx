-- Primer producto. Entra INACTIVO: se activa desde Vorka OS (Tienda → Productos) cuando los archivos ya estén en R2
-- y la página tenga su contenido final (7 pasos, para quién es, preguntas frecuentes).
INSERT INTO products (id, slug, nombre, descripcion_corta, precio_centavos, moneda, activo, r2_keys, imagen, contenido, categoria, orden)
VALUES (
  'prod_de_idea_a_proyecto',
  'de-idea-a-proyecto',
  'De Idea a Proyecto: Kit para lanzar tu negocio o proyecto social',
  'Guía, cuaderno de trabajo y calculadora para pasar de la idea a un proyecto listo para arrancar.',
  27900,
  'MXN',
  0,
  '[{"key":"de-idea-a-proyecto/1_Guia_De_Idea_a_Proyecto.pdf","nombre":"Guía De Idea a Proyecto (PDF)"},{"key":"de-idea-a-proyecto/2_Cuaderno_de_trabajo.docx","nombre":"Cuaderno de trabajo (Word)"},{"key":"de-idea-a-proyecto/3_Calculadora_De_Idea_a_Proyecto.xlsx","nombre":"Calculadora De Idea a Proyecto (Excel)"}]',
  NULL,
  '{"titular":"De la idea al proyecto, paso a paso","incluye":["Guía De Idea a Proyecto (PDF)","Cuaderno de trabajo editable (Word)","Calculadora de costos y precios (Excel)"],"pasos":[],"para_quien":[],"faq":[]}',
  'kits',
  1
);
