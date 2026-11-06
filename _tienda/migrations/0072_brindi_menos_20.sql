-- Brindi: los planes bajan 20 % para que se venda más fácil (decisión del usuario, 6-11-2026; nadie había pagado un plan).
-- Escalera: Íntimo $299→$239 · Esencial $449→$359 · Celebración $699→$559 · Premium $1,290→$1,029.
-- Las mejoras siguen cobrando la diferencia exacta: Íntimo→Esencial $120 · Esencial→Celebración $200 · Celebración→Premium $470.
-- Paquete Organizador: 5 Celebración por $1,899 ($380 por evento; ahorra $896 contra $2,795, 32 %, igual que antes).
-- Los complementos y servicios (+100 invitados, extensión, plantilla, álbum, música, configuración y diseño) no cambian.
UPDATE products SET precio_centavos = 23900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_intimo';
UPDATE products SET precio_centavos = 35900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_esencial';
UPDATE products SET precio_centavos = 55900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_celebracion';
UPDATE products SET precio_centavos = 102900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_premium';
UPDATE products SET precio_centavos = 12000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_esencial';
UPDATE products SET precio_centavos = 20000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_celebracion';
UPDATE products SET precio_centavos = 47000, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_mejora_premium';
UPDATE products SET precio_centavos = 189900, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'prod_brindi_organizador';
