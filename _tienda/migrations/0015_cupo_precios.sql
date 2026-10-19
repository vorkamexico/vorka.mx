-- Cupo: precio de lanzamiento más accesible (decisión de Dirección, 19-10-2026).
-- Cupo Pro $99 por evento y paquete de 5 eventos $399 (sale en $79.80 por evento). Se cambian después desde Tienda › Productos.
UPDATE products SET precio_centavos = 9900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_pro';
UPDATE products SET precio_centavos = 39900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_paquete5';

-- La ficha de Cupo Pro aclara cuándo conviene Brindi
UPDATE products SET contenido = json_set(contenido, '$.faq', json('[{"p":"¿Cupo o Brindi?","r":"Cupo es para eventos rápidos o informales: fiestas, Halloween, networking, talleres y eventos de negocio. Para una boda, XV años o bautizo, donde la invitación es parte del recuerdo, te conviene <a href=\"/tienda/brindi/\">Brindi</a>."},{"p":"¿Cupo cobra comisión por mi cover?","r":"No. Las personas te pagan directo a ti y tú confirmas cada pago. Solo pagas Cupo Pro una vez por evento."},{"p":"¿Necesito Pro para eventos gratis?","r":"No. Los eventos gratis de hasta 100 personas no cuestan nada en <a href=\"https://os.vorka.mx/cupo/\">os.vorka.mx/cupo</a>."},{"p":"¿Cómo lo uso después de pagar?","r":"Te llega un correo con el botón “Entrar a Cupo”. Al publicar tu evento eliges usar tu evento Pro."}]')),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_cupo_pro';
