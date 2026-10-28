-- Nombres de los planes de los simuladores (oct 2026): "Práctica ilimitada", "Simulador completo" y "Paquete completo"
-- confundían (¿cuál es el completo?). Ahora: Práctica (entrenar), Examen (2 exámenes completos) y Completo (los dos).
-- Solo cambia el nombre que se ve en la tienda, en Stripe y en los correos; el contenido y los precios no cambian.
UPDATE products SET nombre = replace(nombre, ' · Práctica ilimitada', ' · Práctica'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE slug IN ('simulador-paa-practica', 'simulador-unam-practica', 'simulador-ecoems-practica');
UPDATE products SET nombre = replace(nombre, ' · Simulador completo', ' · Examen'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE slug IN ('simulador-paa-completo', 'simulador-unam-completo', 'simulador-ecoems-completo');
UPDATE products SET nombre = replace(nombre, ' · Paquete completo', ' · Completo (práctica + examen)'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE slug IN ('simulador-paa-paquete', 'simulador-unam-paquete', 'simulador-ecoems-paquete');
