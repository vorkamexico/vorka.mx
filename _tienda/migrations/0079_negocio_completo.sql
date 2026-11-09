-- Negocio Completo (nov 2026): página web + Agenda + Vuelve en UNA suscripción de $749 al mes (campaña de Meta a WhatsApp).
-- Se guarda como el paquete Agenda + Vuelve (acceso.app 'agenda-vuelve'): abre las dos apps con el mismo correo y Vorka OS
-- lo reconoce sin cambios. La página web es servicio (sin app): se empieza por WhatsApp (acceso.pagina = true).
-- Instalación y personalización de la página: pago único OPCIONAL de $3,490 que se marca en la misma compra (suscripcion.instalacion).
-- Stripe la cobra junto con el primer mes (precio sin recurring en la sesión de suscripción). No se vende sola.
-- Página de compra: /tienda/negocio-completo/ (src/negociocompleto.js).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_negocio_completo_mensual', 'negocio-completo-mensual', 'Negocio Completo · plan mensual', 'Tu página web, tu tarjeta de lealtad digital (Vuelve) y tu agenda de citas en línea, en una sola suscripción.', 74900, 1, 'Servicios', 61, '[]', '/assets/tienda/v3/pagina-web-portada.webp',
  json('{"oculto":true,"acceso":{"app":"agenda-vuelve","apps":["agenda","vuelve"],"tipo":"suscripcion","pagina":true,"ruta":"/tienda/negocio-completo/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda","tambien":[{"app":"vuelve","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"}],"detalle":"Suscripción mensual · Página web, Agenda y Vuelve"},"suscripcion":{"intervalo":"month","extras":{"profesional":"prod_agenda_profesional_mensual","sucursal":"prod_vuelve_sucursal_mensual"},"instalacion":"prod_negocio_completo_instalacion"}}')),
('prod_negocio_completo_instalacion', 'negocio-completo-instalacion', 'Instalación y personalización de tu página', 'Configuramos tu página web con tu logo, fotos y servicios, tu Agenda y tu tarjeta de Vuelve. Pago único.', 349000, 1, 'Servicios', 62, '[]', NULL,
  json('{"oculto":true,"instalacion_de":"prod_negocio_completo_mensual"}'));
