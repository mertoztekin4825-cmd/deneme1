BEGIN TRANSACTION;

INSERT INTO users (name, email, hash) VALUES
  ('Yönetici', 'admin@yesilmarket.com', '$2b$10$C6UzMDM.H6dfI/f/IKxGhuJ0vv1WvxMerO/xerj1u2Gj8vj7yC4a'),
  ('Ayşe Güneş', 'ayse@yesilmarket.com', '$2b$10$C6UzMDM.H6dfI/f/IKxGhuJ0vv1WvxMerO/xerj1u2Gj8vj7yC4a');

INSERT INTO categories (name, slug) VALUES
  ('Meyve', 'meyve'),
  ('Sebze', 'sebze'),
  ('Organik', 'organik');

INSERT INTO products (category_id, name, slug, price, unit, stock, image, description) VALUES
  (1, 'Elma', 'elma', 19.90, 'kg', 120, 'https://picsum.photos/seed/elma/600/400', 'Günlük toplanmış taze elmalar.'),
  (1, 'Muz', 'muz', 29.50, 'kg', 90, 'https://picsum.photos/seed/muz/600/400', 'İthal muz, yumuşak dokulu.'),
  (1, 'Çilek', 'cilek', 39.90, 'kg', 60, 'https://picsum.photos/seed/cilek/600/400', 'Organik sertifikalı çilekler.'),
  (1, 'Portakal', 'portakal', 24.90, 'kg', 80, 'https://picsum.photos/seed/portakal/600/400', 'C vitamini deposu portakallar.'),
  (1, 'Mandalina', 'mandalina', 22.50, 'kg', 75, 'https://picsum.photos/seed/mandalina/600/400', 'Sulu ve tatlı mandalinalar.'),
  (2, 'Domates', 'domates', 14.90, 'kg', 150, 'https://picsum.photos/seed/domates/600/400', 'Kokulu tarla domatesi.'),
  (2, 'Salatalık', 'salatalik', 9.90, 'kg', 140, 'https://picsum.photos/seed/salatalik/600/400', 'Körpe salatalıklar.'),
  (2, 'Biber', 'biber', 12.50, 'kg', 130, 'https://picsum.photos/seed/biber/600/400', 'Yeşil köy biberi.'),
  (2, 'Patlıcan', 'patlican', 15.90, 'kg', 110, 'https://picsum.photos/seed/patlican/600/400', 'İri mor patlıcan.'),
  (2, 'Marul', 'marul', 7.90, 'adet', 100, 'https://picsum.photos/seed/marul/600/400', 'Kıvırcık marul.'),
  (3, 'Avokado', 'avokado', 34.90, 'adet', 85, 'https://picsum.photos/seed/avokado/600/400', 'Olgunlaşmaya hazır avokado.'),
  (3, 'Ispanak', 'ispanak', 11.90, 'kg', 95, 'https://picsum.photos/seed/ispanak/600/400', 'Taze kışlık ıspanak.');

INSERT INTO ads (title, image, link, is_active, position) VALUES
  ('Haftanın Kampanyası', 'https://picsum.photos/seed/banner1/1200/400', '#', 1, 'banner'),
  ('Organik Paket İndirimi', 'https://picsum.photos/seed/banner2/1200/400', '#', 1, 'banner'),
  ('Kış Meyveleri', 'https://picsum.photos/seed/banner3/1200/400', '#', 1, 'banner'),
  ('Ücretsiz Kargo', 'https://picsum.photos/seed/sidebar1/400/400', '#', 1, 'sidebar'),
  ('Haftanın Çiftçisi', 'https://picsum.photos/seed/sidebar2/400/400', '#', 1, 'sidebar');

COMMIT;
