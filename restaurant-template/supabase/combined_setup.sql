-- ================================================================
-- RESTAURANT CITY — FULL DATABASE SETUP
-- Run this entire file in the Supabase SQL Editor (one paste)
-- https://app.supabase.com → SQL Editor → New Query
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  phone           text,
  role            text not null default 'customer' check (role in ('customer','admin')),
  loyalty_points  integer not null default 0,
  lifetime_points integer not null default 0,
  created_at      timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- MENU
-- ────────────────────────────────────────────────────────────────
create table if not exists public.menu_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order int  not null default 0,
  is_active  boolean default true
);

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.menu_categories(id) on delete set null,
  name         text not null,
  description  text,
  price_cents  int  not null check (price_cents >= 0),
  image_url    text,
  is_available boolean default true,
  is_featured  boolean default false,
  dietary_tags text[] default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- ORDERS
-- ────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum
      ('pending','paid','preparing','ready','completed','cancelled','refunded');
  end if;
end $$;

create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references public.profiles(id) on delete set null,
  guest_email          text,
  guest_name           text,
  guest_phone          text,
  status               order_status not null default 'pending',
  fulfillment          text not null check (fulfillment in ('pickup','delivery')),
  subtotal_cents       int  not null,
  tax_cents            int  not null default 0,
  tip_cents            int  not null default 0,
  total_cents          int  not null,
  points_earned        int  default 0,
  points_redeemed      int  default 0,
  stripe_session_id    text unique,
  stripe_payment_intent text,
  notes                text,
  created_at           timestamptz default now()
);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid references public.orders(id) on delete cascade,
  menu_item_id     uuid references public.menu_items(id),
  name_snapshot    text not null,
  unit_price_cents int  not null,
  quantity         int  not null check (quantity > 0),
  modifiers        jsonb default '[]'::jsonb
);

-- ────────────────────────────────────────────────────────────────
-- RESERVATIONS
-- ────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type reservation_status as enum
      ('pending','confirmed','seated','completed','cancelled','no_show');
  end if;
end $$;

create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete set null,
  guest_name       text not null,
  guest_email      text not null,
  guest_phone      text,
  party_size       int  not null check (party_size > 0 and party_size <= 20),
  reservation_time timestamptz not null,
  duration_minutes int  not null default 90,
  table_number     int,
  status           reservation_status not null default 'pending',
  special_requests text,
  created_at       timestamptz default now()
);

create index if not exists reservations_time_idx   on public.reservations (reservation_time);
create index if not exists reservations_status_idx on public.reservations (status);

-- ────────────────────────────────────────────────────────────────
-- LOYALTY
-- ────────────────────────────────────────────────────────────────
create table if not exists public.loyalty_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  order_id   uuid references public.orders(id) on delete set null,
  points     int  not null,
  reason     text not null,
  created_at timestamptz default now()
);

create table if not exists public.loyalty_rewards (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  points_cost  int  not null check (points_cost > 0),
  reward_type  text not null check (reward_type in ('discount_cents','free_item','percent_off')),
  reward_value int  not null,
  is_active    boolean default true
);

create or replace function public.apply_loyalty_points(
  p_user_id uuid, p_points int, p_order_id uuid, p_reason text
) returns void language plpgsql security definer as $$
begin
  insert into public.loyalty_transactions (user_id, points, order_id, reason)
  values (p_user_id, p_points, p_order_id, p_reason);
  update public.profiles
  set loyalty_points  = loyalty_points  + p_points,
      lifetime_points = lifetime_points + greatest(p_points, 0)
  where id = p_user_id;
end; $$;

-- ────────────────────────────────────────────────────────────────
-- PROMO CODES
-- ────────────────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  user_id          uuid references public.profiles(id) on delete cascade,
  discount_percent int  not null default 10,
  used             boolean not null default false,
  expires_at       timestamptz,
  created_at       timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- HELPER FUNCTION + ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles             enable row level security;
alter table public.menu_categories      enable row level security;
alter table public.menu_items           enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.reservations         enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_rewards      enable row level security;
alter table public.promo_codes          enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='menu_items'        and policyname='menu readable')        then create policy "menu readable"        on public.menu_items        for select using (is_available = true or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='menu_categories'   and policyname='categories readable')  then create policy "categories readable"   on public.menu_categories   for select using (is_active   = true or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='loyalty_rewards'   and policyname='rewards readable')     then create policy "rewards readable"      on public.loyalty_rewards   for select using (is_active   = true or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='own profile')                   then create policy "own profile"           on public.profiles for select using (auth.uid() = id or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='own profile update')            then create policy "own profile update"    on public.profiles for update using (auth.uid() = id); end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='own orders')                      then create policy "own orders"            on public.orders for select using (auth.uid() = user_id or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='create order')                    then create policy "create order"          on public.orders for insert with check (auth.uid() = user_id or user_id is null); end if;
  if not exists (select 1 from pg_policies where tablename='reservations' and policyname='own reservations')          then create policy "own reservations"      on public.reservations for select using (auth.uid() = user_id or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='reservations' and policyname='create reservation')        then create policy "create reservation"    on public.reservations for insert with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='reservations' and policyname='admin manage reservations') then create policy "admin manage reservations" on public.reservations for update using (public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='menu_items'      and policyname='admin menu write')       then create policy "admin menu write"      on public.menu_items      for all using (public.is_admin()) with check (public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='menu_categories' and policyname='admin categories write') then create policy "admin categories write" on public.menu_categories for all using (public.is_admin()) with check (public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='loyalty_rewards' and policyname='admin rewards write')    then create policy "admin rewards write"    on public.loyalty_rewards for all using (public.is_admin()) with check (public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='loyalty_transactions' and policyname='own loyalty')       then create policy "own loyalty"           on public.loyalty_transactions for select using (auth.uid() = user_id or public.is_admin()); end if;
  if not exists (select 1 from pg_policies where tablename='promo_codes' and policyname='own promo codes')            then create policy "own promo codes"       on public.promo_codes for select using (auth.uid() = user_id or public.is_admin()); end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- SEED: 6 categories + 27 menu items with food photos
-- ────────────────────────────────────────────────────────────────
insert into public.menu_categories (id, name, sort_order, is_active) values
  ('a0000000-0000-0000-0000-000000000001', 'Starters', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Mains',    2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Pasta',    3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Pizza',    4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Desserts', 5, true),
  ('a0000000-0000-0000-0000-000000000006', 'Drinks',   6, true)
on conflict (id) do nothing;

insert into public.menu_items
  (id, name, description, price_cents, category_id, image_url, dietary_tags, is_available, is_featured)
values
  -- Starters
  ('b0000000-0000-0000-0000-000000000001','Bruschetta al Pomodoro','Toasted sourdough, heirloom tomatoes, basil oil, aged balsamic',1200,'a0000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&fit=crop&q=80',ARRAY['vegan'],true,true),
  ('b0000000-0000-0000-0000-000000000002','Burrata & Prosciutto','Creamy burrata, San Daniele prosciutto, rocket, Sicilian pistachio crumb',1600,'a0000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?w=600&fit=crop&q=80',ARRAY['gluten-free'],true,false),
  ('b0000000-0000-0000-0000-000000000003','Calamari Fritti','Lightly battered squid rings, saffron aioli, lemon',1400,'a0000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&fit=crop&q=80',ARRAY[]::text[],true,false),
  ('b0000000-0000-0000-0000-000000000004','Mushroom Arancini (4 pcs)','Arborio rice, wild mushroom & truffle, smoked scamorza, pomodoro dip',1300,'a0000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  -- Mains
  ('b0000000-0000-0000-0000-000000000005','Bistecca alla Fiorentina','400g dry-aged T-bone, rosemary potatoes, salsa verde',3800,'a0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1558030006-450675393462?w=600&fit=crop&q=80',ARRAY['gluten-free'],true,true),
  ('b0000000-0000-0000-0000-000000000006','Branzino al Forno','Whole sea bass, capers, olives, cherry tomatoes, white wine',3200,'a0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&fit=crop&q=80',ARRAY['gluten-free','dairy-free'],true,false),
  ('b0000000-0000-0000-0000-000000000007','Pollo alla Cacciatora','Free-range chicken thighs, olives, peppers, rosemary, polenta',2600,'a0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&fit=crop&q=80',ARRAY['gluten-free'],true,false),
  ('b0000000-0000-0000-0000-000000000008','Eggplant Parmigiana','Layers of fried aubergine, San Marzano tomato, fior di latte, basil',2200,'a0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  -- Pasta
  ('b0000000-0000-0000-0000-000000000009','Tagliatelle al Ragù','Slow-cooked beef & pork ragù, hand-rolled egg tagliatelle, Parmigiano',2400,'a0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&fit=crop&q=80',ARRAY[]::text[],true,true),
  ('b0000000-0000-0000-0000-000000000010','Spaghetti alle Vongole','Spaghetti, clams, white wine, garlic, chilli, parsley',2600,'a0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&fit=crop&q=80',ARRAY['dairy-free'],true,false),
  ('b0000000-0000-0000-0000-000000000011','Rigatoni all''Amatriciana','Guanciale, San Marzano tomato, Pecorino Romano, chilli flakes',2200,'a0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=600&fit=crop&q=80',ARRAY[]::text[],true,false),
  ('b0000000-0000-0000-0000-000000000012','Cacio e Pepe','Tonnarelli pasta, Pecorino Romano, Parmigiano, cracked black pepper',2100,'a0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  ('b0000000-0000-0000-0000-000000000013','Linguine al Pesto Genovese','Linguine, Ligurian basil pesto, green beans, new potatoes, pine nuts',2000,'a0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,false),
  -- Pizza
  ('b0000000-0000-0000-0000-000000000014','Margherita DOP','San Marzano tomato, fior di latte, fresh basil, extra-virgin olive oil',1800,'a0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  ('b0000000-0000-0000-0000-000000000015','Diavola','San Marzano tomato, fior di latte, Calabrian nduja, fresh chilli',2100,'a0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&fit=crop&q=80',ARRAY[]::text[],true,false),
  ('b0000000-0000-0000-0000-000000000016','Tartufo e Funghi','White truffle base, mixed mushrooms, fior di latte, chives, Parmigiano',2400,'a0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  ('b0000000-0000-0000-0000-000000000017','Prosciutto e Rucola','Tomato, fior di latte, San Daniele prosciutto, rocket, Parmigiano shavings',2200,'a0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600&fit=crop&q=80',ARRAY[]::text[],true,false),
  ('b0000000-0000-0000-0000-000000000018','Quattro Formaggi','Mozzarella, Gorgonzola, Asiago, smoked Provola, walnuts, honey drizzle',2200,'a0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,false),
  -- Desserts
  ('b0000000-0000-0000-0000-000000000019','Tiramisù della Casa','Classic recipe — espresso-soaked savoiardi, mascarpone, cocoa',1100,'a0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  ('b0000000-0000-0000-0000-000000000020','Panna Cotta al Limone','Lemon panna cotta, wild berry compote, candied zest',1000,'a0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&fit=crop&q=80',ARRAY['vegetarian','gluten-free'],true,false),
  ('b0000000-0000-0000-0000-000000000021','Cannolo Siciliano','Crispy shell, ricotta cream, pistachios, candied orange',950,'a0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,false),
  ('b0000000-0000-0000-0000-000000000022','Chocolate Lava Cake','Warm dark chocolate fondant, vanilla gelato, hazelnut praline',1200,'a0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1617027607045-0c2e5a1a7ac3?w=600&fit=crop&q=80',ARRAY['vegetarian'],true,true),
  -- Drinks
  ('b0000000-0000-0000-0000-000000000023','Aperol Spritz','Aperol, Prosecco, soda, orange slice',1100,'a0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&fit=crop&q=80',ARRAY['vegan'],true,false),
  ('b0000000-0000-0000-0000-000000000024','Negroni','Campari, sweet vermouth, gin, orange peel',1200,'a0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&fit=crop&q=80',ARRAY['vegan'],true,false),
  ('b0000000-0000-0000-0000-000000000025','San Pellegrino 750 ml','Sparkling natural mineral water',450,'a0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1560508180-03f285f67ded?w=600&fit=crop&q=80',ARRAY['vegan','gluten-free'],true,false),
  ('b0000000-0000-0000-0000-000000000026','Espresso','Single or double shot, freshly ground arabica blend',350,'a0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&fit=crop&q=80',ARRAY['vegan','gluten-free'],true,false),
  ('b0000000-0000-0000-0000-000000000027','Freshly Squeezed OJ','100% Valencia oranges, pressed to order',550,'a0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&fit=crop&q=80',ARRAY['vegan','gluten-free'],true,false)
on conflict (id) do nothing;

-- ================================================================
-- Done! All tables created + 27 menu items seeded with food photos.
-- ================================================================
