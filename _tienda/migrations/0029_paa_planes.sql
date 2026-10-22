-- Simulador PAA en dos planes que se complementan y el paquete con los dos (oct 2026):
--   Práctica ilimitada ($199): Calentamientos, simulacros Medios y práctica por sección y por tema sin límite, con tutor.
--   Simulador completo ($249): 2 exámenes oficiales como la PAA real (175 reactivos, 3 horas, sin tutor) con reporte.
--   Paquete ($379): los dos.
-- La compra de siempre (prod_simulador_paa) deja de venderse; quien ya la tiene conserva lo que traía (2 Calentamientos,
-- 2 Medios, 1 Oficial y práctica libre). Los planes copian su contenido y cambian solo lo que da cada uno (contenido.acceso).
INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido)
SELECT 'prod_paa_practica', 'simulador-paa-practica', 'Simulador PAA · Práctica ilimitada',
  'Calentamientos, simulacros de nivel Medio y práctica por sección y por tema sin límite, con tutor y reporte.', 19900, activo, imagen, categoria, 0, '[]',
  json_set(contenido, '$.acceso', json('{"app":"simulador-paa","ruta":"/simulador-paa/","boton":"Entrar al simulador","tipo":"practica","ilimitado":true,"intentos":0,"examenes":0,"calentamientos":0}'), '$.plan', 'practica', '$.regalable', json('true'))
FROM products WHERE id = 'prod_simulador_paa';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido)
SELECT 'prod_paa_completo', 'simulador-paa-completo', 'Simulador PAA · Simulador completo',
  '2 exámenes oficiales como la PAA real: 175 reactivos y 3 horas, sin pistas, con puntaje estimado y reporte de preparación.', 24900, activo, imagen, categoria, 1, '[]',
  json_set(contenido, '$.acceso', json('{"app":"simulador-paa","ruta":"/simulador-paa/","boton":"Entrar al simulador","tipo":"completo","intentos":0,"examenes":2,"calentamientos":0}'), '$.plan', 'completo', '$.regalable', json('true'))
FROM products WHERE id = 'prod_simulador_paa';

INSERT OR IGNORE INTO products (id, slug, nombre, descripcion_corta, precio_centavos, activo, imagen, categoria, orden, r2_keys, contenido)
SELECT 'prod_paa_paquete', 'simulador-paa-paquete', 'Simulador PAA · Paquete completo',
  'Práctica ilimitada y Simulador completo juntos: practica sin límite y presenta 2 exámenes oficiales.', 37900, activo, imagen, categoria, 2, '[]',
  json_set(contenido, '$.acceso', json('{"app":"simulador-paa","ruta":"/simulador-paa/","boton":"Entrar al simulador","tipo":"paquete","ilimitado":true,"intentos":0,"examenes":2,"calentamientos":0}'), '$.plan', 'paquete', '$.regalable', json('true'))
FROM products WHERE id = 'prod_simulador_paa';

UPDATE products SET activo = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_simulador_paa';
