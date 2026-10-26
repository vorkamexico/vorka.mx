-- Agenda (citas en línea para consultorios y negocios de servicios; cuarta app de Diversificación). La app vive en Vorka OS:
-- el dueño entra por agenda.vorka.mx y sus clientes reservan en vorka.mx/citas/<negocio> (ver vorka-os/PLAN-AGENDA.md).
-- Se cobra por SUSCRIPCIÓN (Stripe Billing), igual que Vuelve: $99 al mes por profesional (1 incluido) y anual con 2 meses
-- gratis ($990 por profesional). La prueba de 7 días vive en la app, sin tarjeta; aquí solo se vende la suscripción.
-- Paquete Agenda + Vuelve: $449 al mes o $4,490 al año, la misma cuenta y el mismo correo para las dos apps. Incluye 1
-- profesional de Agenda y 1 sucursal de Vuelve; lo adicional se cobra con los complementos de cada app.
-- Precios con IVA incluido, como los de Vuelve. Decisión de Dirección del 25-10-2026.
--
-- contenido.suscripcion.extras: { <tipo de complemento>: <id del producto> } (profesional, sucursal). El plan de Vuelve
-- sigue con su "extra" de siempre (= sucursal).
-- contenido.acceso.apps: las apps que abre la compra. El paquete se guarda en suscripciones con app = 'agenda-vuelve' y
-- cuenta como suscripción de las dos (suscripciones.js › PAQUETES). acceso.tambien: el segundo botón del correo de entrega.
-- Entran INACTIVOS: se activan desde Vorka OS › Tienda › Productos (o con el UPDATE del final de README-TIENDA.md, sección Agenda).

-- Profesionales adicionales pagados (además del incluido), aparte de las sucursales de Vuelve
ALTER TABLE suscripciones ADD COLUMN profesionales INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, categoria, orden, r2_keys, imagen, contenido) VALUES
('prod_agenda_mensual', 'agenda-mensual', 'Agenda · plan mensual', 'Citas en línea para tu consultorio o negocio: tus clientes eligen servicio, profesional, día y hora, y su cita queda confirmada al instante. Recordatorios por correo y tu día en el celular. $99 al mes por profesional.', 9900, 0, 'Citas', 48, '[]', '/assets/tienda/agenda.webp',
  json('{"acceso":{"app":"agenda","tipo":"suscripcion","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda","detalle":"Suscripción mensual · cancela cuando quieras"},"suscripcion":{"intervalo":"month","extras":{"profesional":"prod_agenda_profesional_mensual"}}}')),
('prod_agenda_anual', 'agenda-anual', 'Agenda · plan anual', 'Todo Agenda por un año, con 2 meses gratis: tu página de reservas, recordatorios y tu día en el celular. $990 al año por profesional.', 99000, 0, 'Citas', 49, '[]', '/assets/tienda/agenda.webp',
  json('{"oculto":true,"acceso":{"app":"agenda","tipo":"suscripcion","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda","detalle":"Suscripción anual · 2 meses gratis"},"suscripcion":{"intervalo":"year","extras":{"profesional":"prod_agenda_profesional_anual"}}}')),
('prod_agenda_profesional_mensual', 'agenda-profesional-mensual', 'Agenda · profesional adicional (mensual)', 'Un profesional más en tu agenda, con su horario, sus servicios y sus días bloqueados.', 9900, 0, 'Citas', 50, '[]', '/assets/tienda/agenda.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"agenda","tipo":"profesional","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda"},"suscripcion":{"intervalo":"month"}}')),
('prod_agenda_profesional_anual', 'agenda-profesional-anual', 'Agenda · profesional adicional (anual)', 'Un profesional más en tu agenda por un año, con 2 meses gratis.', 99000, 0, 'Citas', 51, '[]', '/assets/tienda/agenda.webp',
  json('{"oculto":true,"complemento":true,"acceso":{"app":"agenda","tipo":"profesional","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda"},"suscripcion":{"intervalo":"year"}}')),
('prod_agenda_vuelve_mensual', 'agenda-vuelve-mensual', 'Agenda + Vuelve · paquete mensual', 'Citas en línea y tarjeta de lealtad digital con la misma cuenta y el mismo correo. Incluye 1 profesional de Agenda y 1 sucursal de Vuelve.', 44900, 0, 'Citas', 52, '[]', '/assets/tienda/agenda.webp',
  json('{"oculto":true,"acceso":{"app":"agenda-vuelve","apps":["agenda","vuelve"],"tipo":"suscripcion","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda","tambien":[{"app":"vuelve","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"}],"detalle":"Suscripción mensual · Agenda y Vuelve"},"suscripcion":{"intervalo":"month","extras":{"profesional":"prod_agenda_profesional_mensual","sucursal":"prod_vuelve_sucursal_mensual"}}}')),
('prod_agenda_vuelve_anual', 'agenda-vuelve-anual', 'Agenda + Vuelve · paquete anual', 'Agenda y Vuelve por un año, con 2 meses gratis. Incluye 1 profesional de Agenda y 1 sucursal de Vuelve.', 449000, 0, 'Citas', 53, '[]', '/assets/tienda/agenda.webp',
  json('{"oculto":true,"acceso":{"app":"agenda-vuelve","apps":["agenda","vuelve"],"tipo":"suscripcion","ruta":"/tienda/agenda/","url":"https://agenda.vorka.mx/entrar/","boton":"Entrar a Agenda","tambien":[{"app":"vuelve","url":"https://os.vorka.mx/vuelve/entrar/","boton":"Entrar a Vuelve"}],"detalle":"Suscripción anual · Agenda y Vuelve"},"suscripcion":{"intervalo":"year","extras":{"profesional":"prod_agenda_profesional_anual","sucursal":"prod_vuelve_sucursal_anual"}}}'));
