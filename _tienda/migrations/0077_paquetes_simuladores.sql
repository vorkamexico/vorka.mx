-- Paquetes de simuladores de universidad (nov 2026, encargo del dueño): el plan Completo de 2 o 3 simuladores por menos.
--   UNAM + IPN $499 · PAA + UNAM $549 · PAA + IPN $549 · los 3 (PAA + UNAM + IPN) $699.
-- contenido.acceso.app = 'simuladores' y acceso.apps = los simuladores que abre: cada simulador lo cuenta como su plan
-- Completo (motor.js › accesoDeItem). El correo lleva a /descargas/<token>, con un botón por simulador, y el mismo enlace
-- entra una vez a cada uno. Se venden en vorka.mx/tienda/simuladores/. Entran activos.
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido) VALUES
('prod_sim_unam_ipn', 'simuladores-unam-ipn', 'Paquete UNAM + IPN',
  'El plan Completo de los simuladores UNAM e IPN: práctica sin límite y 2 exámenes completos de tu área en cada uno.',
  49900, 1, '/assets/tienda/v3/simuladores-portada.webp', 'Exámenes', 1, '[]',
  '{"acceso": {"app": "simuladores", "apps": ["simulador-unam", "simulador-ipn"], "nombres": ["UNAM", "IPN"], "ruta": "/tienda/simuladores/", "boton": "Entrar a tus simuladores", "tipo": "paquete", "ilimitado": true, "intentos": 0, "examenes": 2, "calentamientos": 0, "detalle": "Plan Completo de cada simulador · 6 meses"}, "plan": "paquete", "regalable": true, "titular": "Prepárate para la UNAM y el IPN", "subtitulo": "Práctica sin límite con tutor, exámenes completos, plan de estudio y app en cada simulador, por menos que comprarlos por separado.", "portada": "Simuladores"}'),
('prod_sim_paa_unam', 'simuladores-paa-unam', 'Paquete PAA + UNAM',
  'El plan Completo de los simuladores PAA y UNAM: práctica sin límite y exámenes completos en cada uno.',
  54900, 1, '/assets/tienda/v3/simuladores-portada.webp', 'Exámenes', 2, '[]',
  '{"acceso": {"app": "simuladores", "apps": ["simulador-paa", "simulador-unam"], "nombres": ["PAA", "UNAM"], "ruta": "/tienda/simuladores/", "boton": "Entrar a tus simuladores", "tipo": "paquete", "ilimitado": true, "intentos": 0, "examenes": 2, "calentamientos": 0, "detalle": "Plan Completo de cada simulador · 6 meses"}, "plan": "paquete", "regalable": true, "titular": "Prepárate para la PAA y la UNAM", "subtitulo": "Práctica sin límite con tutor, exámenes completos, plan de estudio y app en cada simulador, por menos que comprarlos por separado.", "portada": "Simuladores"}'),
('prod_sim_paa_ipn', 'simuladores-paa-ipn', 'Paquete PAA + IPN',
  'El plan Completo de los simuladores PAA e IPN: práctica sin límite y exámenes completos en cada uno.',
  54900, 1, '/assets/tienda/v3/simuladores-portada.webp', 'Exámenes', 3, '[]',
  '{"acceso": {"app": "simuladores", "apps": ["simulador-paa", "simulador-ipn"], "nombres": ["PAA", "IPN"], "ruta": "/tienda/simuladores/", "boton": "Entrar a tus simuladores", "tipo": "paquete", "ilimitado": true, "intentos": 0, "examenes": 2, "calentamientos": 0, "detalle": "Plan Completo de cada simulador · 6 meses"}, "plan": "paquete", "regalable": true, "titular": "Prepárate para la PAA y el IPN", "subtitulo": "Práctica sin límite con tutor, exámenes completos, plan de estudio y app en cada simulador, por menos que comprarlos por separado.", "portada": "Simuladores"}'),
('prod_sim_universidad', 'simuladores-universidad', 'Paquete Universidad: PAA + UNAM + IPN',
  'El plan Completo de los 3 simuladores de universidad: PAA, UNAM e IPN, con práctica sin límite y exámenes completos en cada uno.',
  69900, 1, '/assets/tienda/v3/simuladores-portada.webp', 'Exámenes', 4, '[]',
  '{"acceso": {"app": "simuladores", "apps": ["simulador-paa", "simulador-unam", "simulador-ipn"], "nombres": ["PAA", "UNAM", "IPN"], "ruta": "/tienda/simuladores/", "boton": "Entrar a tus simuladores", "tipo": "paquete", "ilimitado": true, "intentos": 0, "examenes": 2, "calentamientos": 0, "detalle": "Plan Completo de cada simulador · 6 meses"}, "plan": "paquete", "regalable": true, "titular": "Los 3 simuladores de universidad", "subtitulo": "Práctica sin límite con tutor, exámenes completos, plan de estudio y app en cada simulador, por menos que comprarlos por separado.", "portada": "Simuladores"}');
