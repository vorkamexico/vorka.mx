-- Brindi (invitaciones digitales, marca propia de Diversificación): planes y complementos como productos de ACCESO.
-- contenido.acceso.app = 'brindi' → el correo de compra lleva a os.vorka.mx/brindi/entrar/<token> (acceso.url) y os.vorka.mx
-- convierte cada unidad pagada en un "crédito" que el cliente aplica a su evento (ver vorka-os/PLAN-BRINDI.md).
-- TODOS ENTRAN INACTIVOS: se ponen a la venta desde Vorka México → Tienda cuando se apruebe el lanzamiento.
-- Solo el plan Celebración aparece en el catálogo (lleva a /tienda/brindi/); los demás son "oculto" y se compran desde esa página.

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, contenido) VALUES
('prod_brindi_esencial', 'brindi-esencial', 'Brindi · Plan Esencial', 'Invitación digital con enlace, QR general y confirmación de asistencia para hasta 100 invitados.', 29900, 0, 'Invitaciones', 20, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"plan","plan":"esencial","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Crear mi invitación","detalle":"Un evento · en línea hasta 30 días después de la fecha"}}')),
('prod_brindi_celebracion', 'brindi-celebracion', 'Brindi · Plan Celebración', 'Invitaciones digitales con enlace y QR por invitado, control de acompañantes y estadísticas. Hasta 300 invitados.', 59900, 0, 'Invitaciones', 21, '[]',
  json('{"acceso":{"app":"brindi","tipo":"plan","plan":"celebracion","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Crear mi invitación","detalle":"Un evento · en línea hasta 30 días después de la fecha"},"portada":"Brindi"}')),
('prod_brindi_premium', 'brindi-premium', 'Brindi · Plan Premium', 'Plantillas premium, pase de acceso con QR, recepción con escáner y registro de entradas. Hasta 1,000 invitados.', 99900, 0, 'Invitaciones', 22, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"plan","plan":"premium","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Crear mi invitación","detalle":"Un evento · en línea hasta 30 días después de la fecha"}}')),
('prod_brindi_invitados_100', 'brindi-100-invitados', 'Brindi · +100 invitados', 'Suma 100 invitados al límite de un evento con plan.', 14900, 0, 'Invitaciones', 30, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"invitados","cantidad":100,"ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarlo a mi evento","detalle":"Se aplica desde Ajustes del evento"}}')),
('prod_brindi_extension', 'brindi-extension-90', 'Brindi · Extensión de 90 días', 'Mantiene tu invitación en línea y tus datos 90 días más.', 9900, 0, 'Invitaciones', 31, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"extension","cantidad":90,"ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarlo a mi evento","detalle":"Se aplica desde Ajustes del evento"}}')),
('prod_brindi_mejora_celebracion', 'brindi-mejora-celebracion', 'Brindi · Mejora a Celebración', 'Cambia un evento Esencial a Celebración (pagas solo la diferencia).', 30000, 0, 'Invitaciones', 32, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"mejora","plan":"celebracion","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarla a mi evento","detalle":"Para eventos con plan Esencial"}}')),
('prod_brindi_mejora_premium', 'brindi-mejora-premium', 'Brindi · Mejora a Premium', 'Cambia un evento Celebración a Premium (pagas solo la diferencia).', 40000, 0, 'Invitaciones', 33, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"mejora","plan":"premium","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarla a mi evento","detalle":"Para eventos con plan Celebración"}}')),
('prod_brindi_plantilla_premium', 'brindi-plantilla-premium', 'Brindi · Plantillas premium', 'Desbloquea las plantillas premium (Gala, Noche de estrellas…) en un evento Esencial o Celebración.', 14900, 0, 'Invitaciones', 34, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"plantilla_premium","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Aplicarlo a mi evento","detalle":"Se aplica desde Ajustes del evento"}}')),
('prod_brindi_configuracion', 'brindi-configuracion-asistida', 'Brindi · Configuración asistida', 'Cargamos tu lista de invitados y dejamos todo listo contigo en una videollamada de 30 minutos.', 39900, 0, 'Invitaciones', 35, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"servicio","servicio":"configuracion","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Entrar a Brindi","detalle":"Te escribimos en un día hábil para agendar"}}')),
('prod_brindi_diseno', 'brindi-diseno-profesional', 'Brindi · Diseño profesional', 'Nuestro equipo personaliza tu invitación (textos, fotos y paleta) con dos rondas de cambios.', 149000, 0, 'Invitaciones', 36, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"servicio","servicio":"diseno","ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Entrar a Brindi","detalle":"Te escribimos en un día hábil para empezar"}}')),
('prod_brindi_organizador', 'brindi-paquete-organizador', 'Brindi · Paquete Organizador (5 eventos)', 'Cinco eventos con plan Celebración para organizadores, salones y fotógrafos. 17 % de descuento.', 249000, 0, 'Invitaciones', 37, '[]',
  json('{"oculto":true,"acceso":{"app":"brindi","tipo":"paquete","plan":"celebracion","unidades":5,"ruta":"/tienda/brindi/","url":"https://os.vorka.mx/brindi/entrar/","boton":"Crear mis invitaciones","detalle":"Cinco planes Celebración, uno por evento"}}'));
