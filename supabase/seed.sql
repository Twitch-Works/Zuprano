-- Demo catalogue (mirrors the products shown on zuprano.com) and default config.
insert into public.products
  (name, description, sku, brand, category, price, original_price, discount, stock, images, image_url, thumbnail,
   is_public, is_active, compatibility, variants, rating, reviews_count, created_at)
values
  ('iPhone 15 Pro Max Case', 'Premium protective case with micro-dot pattern', 'SPG-IP15PM-001', 'Spigen', 'Phone Cases & Covers', 1299, 1499, 13, 90, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['iPhone 15 Pro Max','iPhone']::text[], '[{"id": "var-001-black", "name": "Color", "value": "Black", "price": 1299, "stock": 50}, {"id": "var-001-white", "name": "Color", "value": "White", "price": 1299, "stock": 40}]'::jsonb, 4.8, 324, now() - interval '0 minutes'),
  ('Tempered Glass Screen Protector', '9H hardness, anti-fingerprint coating', 'SPG-SCR-001', 'Spigen', 'Tempered Glass', 299, 399, 25, 180, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['iPhone','Samsung']::text[], '[{"id": "var-002-clear", "name": "Type", "value": "Clear", "price": 299, "stock": 100}, {"id": "var-002-matte", "name": "Type", "value": "Matte", "price": 349, "stock": 80}]'::jsonb, 4.6, 512, now() - interval '1 minutes'),
  ('USB-C Fast Charging Cable', '100W support, 2m length, nylon braided', 'ANK-USB-001', 'Anker', 'Charging Cables', 449, 599, 25, 220, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['iPhone','Samsung','OnePlus','Pixel']::text[], '[{"id": "var-003-2m", "name": "Length", "value": "2m", "price": 449, "stock": 120}, {"id": "var-003-3m", "name": "Length", "value": "3m", "price": 499, "stock": 100}]'::jsonb, 4.7, 1203, now() - interval '2 minutes'),
  ('AirPods Pro Silicone Case', 'Shockproof case with magnetic closure', 'SPG-ARP-001', 'Spigen', 'Earbuds & Headphones', 599, null, null, 150, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['AirPods']::text[], '[{"id": "var-004-black", "name": "Color", "value": "Black", "price": 599, "stock": 60}, {"id": "var-004-white", "name": "Color", "value": "White", "price": 599, "stock": 50}, {"id": "var-004-navy", "name": "Color", "value": "Navy", "price": 599, "stock": 40}]'::jsonb, 4.9, 287, now() - interval '3 minutes'),
  ('Adjustable Phone Stand', 'Aluminum construction, wide angle support', 'MOF-STD-001', 'Moft', 'Phone Holders & Stands', 799, 999, 20, 150, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['iPhone','Samsung','OnePlus','Pixel','iPad']::text[], '[{"id": "var-005-silver", "name": "Color", "value": "Silver", "price": 799, "stock": 70}, {"id": "var-005-black", "name": "Color", "value": "Black", "price": 799, "stock": 80}]'::jsonb, 4.5, 456, now() - interval '4 minutes'),
  ('Samsung Galaxy S24 Case', 'Military-grade protection with precision cutouts', 'SPG-SAM-S24', 'Spigen', 'Phone Cases & Covers', 1099, null, null, 110, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['Samsung']::text[], '[{"id": "var-006-black", "name": "Color", "value": "Black", "price": 1099, "stock": 45}, {"id": "var-006-white", "name": "Color", "value": "White", "price": 1099, "stock": 35}, {"id": "var-006-gray", "name": "Color", "value": "Gray", "price": 1099, "stock": 30}]'::jsonb, 4.7, 289, now() - interval '5 minutes'),
  ('20W USB-C Power Adapter', 'Fast charging, compact design, global voltage', 'ANK-CHG-20W', 'Anker', 'Chargers & Adapters', 749, 999, 25, 300, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['iPhone','Samsung','OnePlus','Pixel']::text[], '[{"id": "var-007-single", "name": "Pack", "value": "Single", "price": 749, "stock": 200}, {"id": "var-007-twin", "name": "Pack", "value": "Twin Pack", "price": 1299, "stock": 100}]'::jsonb, 4.8, 892, now() - interval '6 minutes'),
  ('OnePlus 12 Pro Case', 'Slim fit, matte finish, scratch resistant', 'NIL-OP12-001', 'Nillkin', 'Phone Cases & Covers', 899, null, null, 95, array['https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877']::text[], 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', 'https://casegear.in/cdn/shop/files/Back_Image_93def66d-9216-4683-9a09-d9328f8fe847.png?v=1763104877', true, true, array['OnePlus']::text[], '[{"id": "var-008-black", "name": "Color", "value": "Black", "price": 899, "stock": 55}, {"id": "var-008-red", "name": "Color", "value": "Red", "price": 899, "stock": 40}]'::jsonb, 4.6, 178, now() - interval '7 minutes');

-- Demo phones. Replace the lifestyle photos with packshots from the admin panel.
insert into public.products
  (name, description, sku, brand, category, price, original_price, discount, stock, images, image_url, thumbnail,
   is_public, is_active, compatibility, variants, specs, rating, reviews_count, created_at)
select name, description, sku, brand, category, price, original_price, discount, stock, array[img]::text[], img, img,
       true, true, '{}'::text[], variants::jsonb, specs::jsonb, rating, reviews, now() - (ord || ' minutes')::interval
from (values
  (1, 'Apple iPhone 16 Pro', 'Titanium design, A18 Pro chip and a 48MP Fusion camera with 5x telephoto.', 'APL-IP16P', 'Apple', 'Apple',
   119900, 124900, 4, 40, 'https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?auto=format&fit=crop&q=80&w=900',
   '[{"id": "ip16p-128", "name": "Storage", "value": "128GB", "price": 119900, "stock": 15}, {"id": "ip16p-256", "name": "Storage", "value": "256GB", "price": 129900, "stock": 15}, {"id": "ip16p-512", "name": "Storage", "value": "512GB", "price": 149900, "stock": 10}]',
   '[{"label": "Display", "value": "6.3\" Super Retina XDR, 120Hz"}, {"label": "Processor", "value": "A18 Pro"}, {"label": "Storage", "value": "128GB / 256GB / 512GB"}, {"label": "Camera", "value": "48MP + 48MP + 12MP"}, {"label": "Front Camera", "value": "12MP"}, {"label": "Battery", "value": "Up to 27 hrs video"}, {"label": "OS", "value": "iOS 18"}, {"label": "Network", "value": "5G"}]',
   4.8, 214),
  (2, 'Samsung Galaxy S24 Ultra', 'Galaxy AI, titanium frame, built-in S Pen and a 200MP camera.', 'SAM-S24U', 'Samsung', 'Samsung',
   129999, 134999, 4, 30, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=900',
   '[{"id": "s24u-256", "name": "Storage", "value": "12GB / 256GB", "price": 129999, "stock": 18}, {"id": "s24u-512", "name": "Storage", "value": "12GB / 512GB", "price": 139999, "stock": 12}]',
   '[{"label": "Display", "value": "6.8\" QHD+ Dynamic AMOLED 2X, 120Hz"}, {"label": "Processor", "value": "Snapdragon 8 Gen 3"}, {"label": "RAM", "value": "12GB"}, {"label": "Storage", "value": "256GB / 512GB"}, {"label": "Camera", "value": "200MP + 50MP + 12MP + 10MP"}, {"label": "Front Camera", "value": "12MP"}, {"label": "Battery", "value": "5000mAh, 45W"}, {"label": "OS", "value": "Android 14, One UI 6.1"}, {"label": "Network", "value": "5G"}]',
   4.7, 189),
  (3, 'OnePlus 12', 'Hasselblad camera, 2K 120Hz display and 80W SUPERVOOC charging.', 'OPL-12', 'OnePlus', 'OnePlus',
   64999, 69999, 7, 50, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=900',
   '[{"id": "op12-256", "name": "Storage", "value": "12GB / 256GB", "price": 64999, "stock": 30}, {"id": "op12-512", "name": "Storage", "value": "16GB / 512GB", "price": 69999, "stock": 20}]',
   '[{"label": "Display", "value": "6.82\" 2K LTPO AMOLED, 120Hz"}, {"label": "Processor", "value": "Snapdragon 8 Gen 3"}, {"label": "RAM", "value": "12GB / 16GB"}, {"label": "Storage", "value": "256GB / 512GB"}, {"label": "Camera", "value": "50MP + 64MP + 48MP"}, {"label": "Front Camera", "value": "32MP"}, {"label": "Battery", "value": "5400mAh, 80W"}, {"label": "OS", "value": "Android 14, OxygenOS 14"}, {"label": "Network", "value": "5G"}]',
   4.6, 342),
  (4, 'Google Pixel 9', 'Gemini built in, Tensor G4 and the best of Google''s camera.', 'GGL-PX9', 'Google', 'Google Pixel',
   79999, null, null, 25, 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=900',
   '[{"id": "px9-256", "name": "Storage", "value": "12GB / 256GB", "price": 79999, "stock": 25}]',
   '[{"label": "Display", "value": "6.3\" Actua OLED, 120Hz"}, {"label": "Processor", "value": "Google Tensor G4"}, {"label": "RAM", "value": "12GB"}, {"label": "Storage", "value": "256GB"}, {"label": "Camera", "value": "50MP + 48MP"}, {"label": "Front Camera", "value": "10.5MP"}, {"label": "Battery", "value": "4700mAh, 27W"}, {"label": "OS", "value": "Android 14"}, {"label": "Network", "value": "5G"}]',
   4.5, 97),
  (5, 'Redmi Note 13 Pro 5G', '200MP camera, 1.5K AMOLED display and 67W turbo charging.', 'RDM-N13P', 'Redmi', 'Redmi',
   23999, 26999, 11, 80, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=900',
   '[{"id": "rn13p-128", "name": "Storage", "value": "8GB / 128GB", "price": 23999, "stock": 40}, {"id": "rn13p-256", "name": "Storage", "value": "8GB / 256GB", "price": 25999, "stock": 40}]',
   '[{"label": "Display", "value": "6.67\" 1.5K AMOLED, 120Hz"}, {"label": "Processor", "value": "Snapdragon 7s Gen 2"}, {"label": "RAM", "value": "8GB"}, {"label": "Storage", "value": "128GB / 256GB"}, {"label": "Camera", "value": "200MP + 8MP + 2MP"}, {"label": "Front Camera", "value": "16MP"}, {"label": "Battery", "value": "5100mAh, 67W"}, {"label": "Network", "value": "5G"}]',
   4.4, 1204),
  (6, 'Nothing Phone (2a)', 'Glyph Interface, clean Nothing OS and a 50MP dual camera.', 'NTH-2A', 'Nothing', 'Nothing',
   23999, 25999, 8, 60, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=900',
   '[{"id": "n2a-128", "name": "Storage", "value": "8GB / 128GB", "price": 23999, "stock": 30}, {"id": "n2a-256", "name": "Storage", "value": "12GB / 256GB", "price": 27999, "stock": 30}]',
   '[{"label": "Display", "value": "6.7\" Flexible AMOLED, 120Hz"}, {"label": "Processor", "value": "Dimensity 7200 Pro"}, {"label": "RAM", "value": "8GB / 12GB"}, {"label": "Storage", "value": "128GB / 256GB"}, {"label": "Camera", "value": "50MP + 50MP"}, {"label": "Front Camera", "value": "32MP"}, {"label": "Battery", "value": "5000mAh, 45W"}, {"label": "Network", "value": "5G"}]',
   4.5, 611)
) as t(ord, name, description, sku, brand, category, price, original_price, discount, stock, img, variants, specs, rating, reviews);

insert into public.campaigns (name, type, discount_percent, budget, spent, reach, status, conversion_rate) values
  ('Easter Special', 'Seasonal', 30, 50000, 38500, 234, 'Active', 12.4),
  ('Flash Sale - 24 Hours', 'Limited Time', 40, 100000, 94200, 456, 'Completed', 18.7),
  ('May Mega Sale', 'Monthly', 35, 75000, 0, 0, 'Scheduled', null);

insert into public.settings (id, data) values ('business_config', '{
  "businessName": "Zuprano",
  "businessEmail": "admin@zuprano.com",
  "currency": "INR",
  "timezone": "IST",
  "address": "",
  "preferences": {"bulkOrders": true, "autoship": false, "returns": true, "loyaltyProgram": true}
}'::jsonb)
on conflict (id) do nothing;
