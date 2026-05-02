-- Seed menu categories and items for Restaurant City
-- Run this in the Supabase SQL editor AFTER running 0001_init.sql and 0002_promo_codes.sql

-- Categories (no description column — matches schema)
INSERT INTO menu_categories (id, name, sort_order, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Starters',  1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Mains',     2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Pasta',     3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Pizza',     4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Desserts',  5, true),
  ('a0000000-0000-0000-0000-000000000006', 'Drinks',    6, true)
ON CONFLICT (id) DO NOTHING;

-- Menu items (no sort_order column — matches schema)
INSERT INTO menu_items (id, name, description, price_cents, category_id, dietary_tags, is_available, is_featured)
VALUES
  -- Starters
  ('b0000000-0000-0000-0000-000000000001', 'Bruschetta al Pomodoro',    'Toasted sourdough, heirloom tomatoes, basil oil, aged balsamic',           1200, 'a0000000-0000-0000-0000-000000000001', ARRAY['vegan'],                    true, true),
  ('b0000000-0000-0000-0000-000000000002', 'Burrata & Prosciutto',      'Creamy burrata, San Daniele prosciutto, rocket, Sicilian pistachio crumb', 1600, 'a0000000-0000-0000-0000-000000000001', ARRAY['gluten-free'],               true, false),
  ('b0000000-0000-0000-0000-000000000003', 'Calamari Fritti',           'Lightly battered squid rings, saffron aioli, lemon',                       1400, 'a0000000-0000-0000-0000-000000000001', ARRAY[]::text[],                   true, false),
  ('b0000000-0000-0000-0000-000000000004', 'Mushroom Arancini (4 pcs)', 'Arborio rice, wild mushroom & truffle, smoked scamorza, pomodoro dip',     1300, 'a0000000-0000-0000-0000-000000000001', ARRAY['vegetarian'],               true, true),

  -- Mains
  ('b0000000-0000-0000-0000-000000000005', 'Bistecca alla Fiorentina',  '400g dry-aged T-bone, rosemary potatoes, salsa verde',                     3800, 'a0000000-0000-0000-0000-000000000002', ARRAY['gluten-free'],               true, true),
  ('b0000000-0000-0000-0000-000000000006', 'Branzino al Forno',         'Whole sea bass, capers, olives, cherry tomatoes, white wine',              3200, 'a0000000-0000-0000-0000-000000000002', ARRAY['gluten-free','dairy-free'],  true, false),
  ('b0000000-0000-0000-0000-000000000007', 'Pollo alla Cacciatora',     'Free-range chicken thighs, olives, peppers, rosemary, polenta',            2600, 'a0000000-0000-0000-0000-000000000002', ARRAY['gluten-free'],               true, false),
  ('b0000000-0000-0000-0000-000000000008', 'Eggplant Parmigiana',       'Layers of fried aubergine, San Marzano tomato, fior di latte, basil',      2200, 'a0000000-0000-0000-0000-000000000002', ARRAY['vegetarian'],               true, true),

  -- Pasta
  ('b0000000-0000-0000-0000-000000000009', 'Tagliatelle al Ragù',       'Slow-cooked beef & pork ragù, hand-rolled egg tagliatelle, Parmigiano',    2400, 'a0000000-0000-0000-0000-000000000003', ARRAY[]::text[],                   true, true),
  ('b0000000-0000-0000-0000-000000000010', 'Spaghetti alle Vongole',    'Spaghetti, clams, white wine, garlic, chilli, parsley',                    2600, 'a0000000-0000-0000-0000-000000000003', ARRAY['dairy-free'],               true, false),
  ('b0000000-0000-0000-0000-000000000011', 'Rigatoni all''Amatriciana', 'Guanciale, San Marzano tomato, Pecorino Romano, chilli flakes',             2200, 'a0000000-0000-0000-0000-000000000003', ARRAY[]::text[],                   true, false),
  ('b0000000-0000-0000-0000-000000000012', 'Cacio e Pepe',              'Tonnarelli pasta, Pecorino Romano, Parmigiano, cracked black pepper',       2100, 'a0000000-0000-0000-0000-000000000003', ARRAY['vegetarian'],               true, true),
  ('b0000000-0000-0000-0000-000000000013', 'Linguine al Pesto Genovese','Linguine, Ligurian basil pesto, green beans, new potatoes, pine nuts',     2000, 'a0000000-0000-0000-0000-000000000003', ARRAY['vegetarian'],               true, false),

  -- Pizza
  ('b0000000-0000-0000-0000-000000000014', 'Margherita DOP',            'San Marzano tomato, fior di latte, fresh basil, extra-virgin olive oil',   1800, 'a0000000-0000-0000-0000-000000000004', ARRAY['vegetarian'],               true, true),
  ('b0000000-0000-0000-0000-000000000015', 'Diavola',                   'San Marzano tomato, fior di latte, Calabrian nduja, fresh chilli',          2100, 'a0000000-0000-0000-0000-000000000004', ARRAY[]::text[],                   true, false),
  ('b0000000-0000-0000-0000-000000000016', 'Tartufo e Funghi',          'White truffle base, mixed mushrooms, fior di latte, chives, Parmigiano',    2400, 'a0000000-0000-0000-0000-000000000004', ARRAY['vegetarian'],               true, true),
  ('b0000000-0000-0000-0000-000000000017', 'Prosciutto e Rucola',       'Tomato, fior di latte, San Daniele prosciutto, rocket, Parmigiano shavings',2200, 'a0000000-0000-0000-0000-000000000004', ARRAY[]::text[],                   true, false),
  ('b0000000-0000-0000-0000-000000000018', 'Quattro Formaggi',          'Mozzarella, Gorgonzola, Asiago, smoked Provola, walnuts, honey drizzle',    2200, 'a0000000-0000-0000-0000-000000000004', ARRAY['vegetarian'],               true, false),

  -- Desserts
  ('b0000000-0000-0000-0000-000000000019', 'Tiramisù della Casa',       'Classic recipe — espresso-soaked savoiardi, mascarpone, cocoa',            1100, 'a0000000-0000-0000-0000-000000000005', ARRAY['vegetarian'],               true, true),
  ('b0000000-0000-0000-0000-000000000020', 'Panna Cotta al Limone',     'Lemon panna cotta, wild berry compote, candied zest',                      1000, 'a0000000-0000-0000-0000-000000000005', ARRAY['vegetarian','gluten-free'], true, false),
  ('b0000000-0000-0000-0000-000000000021', 'Cannolo Siciliano',         'Crispy shell, ricotta cream, pistachios, candied orange',                   950, 'a0000000-0000-0000-0000-000000000005', ARRAY['vegetarian'],               true, false),
  ('b0000000-0000-0000-0000-000000000022', 'Chocolate Lava Cake',       'Warm dark chocolate fondant, vanilla gelato, hazelnut praline',            1200, 'a0000000-0000-0000-0000-000000000005', ARRAY['vegetarian'],               true, true),

  -- Drinks
  ('b0000000-0000-0000-0000-000000000023', 'Aperol Spritz',             'Aperol, Prosecco, soda, orange slice',                                      1100, 'a0000000-0000-0000-0000-000000000006', ARRAY['vegan'],                    true, false),
  ('b0000000-0000-0000-0000-000000000024', 'Negroni',                   'Campari, sweet vermouth, gin, orange peel',                                 1200, 'a0000000-0000-0000-0000-000000000006', ARRAY['vegan'],                    true, false),
  ('b0000000-0000-0000-0000-000000000025', 'San Pellegrino 750 ml',     'Sparkling natural mineral water',                                            450, 'a0000000-0000-0000-0000-000000000006', ARRAY['vegan','gluten-free'],      true, false),
  ('b0000000-0000-0000-0000-000000000026', 'Espresso',                  'Single or double shot, freshly ground arabica blend',                        350, 'a0000000-0000-0000-0000-000000000006', ARRAY['vegan','gluten-free'],      true, false),
  ('b0000000-0000-0000-0000-000000000027', 'Freshly Squeezed OJ',       '100% Valencia oranges, pressed to order',                                    550, 'a0000000-0000-0000-0000-000000000006', ARRAY['vegan','gluten-free'],      true, false)
ON CONFLICT (id) DO NOTHING;
