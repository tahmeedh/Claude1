-- =========================================================
-- PROFILES (customer + admin)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  loyalty_points integer not null default 0,
  lifetime_points integer not null default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- MENU
-- =========================================================
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  is_available boolean default true,
  is_featured boolean default false,
  dietary_tags text[] default '{}',  -- ['vegan','gluten-free']
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- ORDERS
-- =========================================================
create type order_status as enum
  ('pending','paid','preparing','ready','completed','cancelled','refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  guest_name text,
  guest_phone text,
  status order_status not null default 'pending',
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  subtotal_cents int not null,
  tax_cents int not null default 0,
  tip_cents int not null default 0,
  total_cents int not null,
  points_earned int default 0,
  points_redeemed int default 0,
  stripe_session_id text unique,
  stripe_payment_intent text,
  notes text,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id),
  name_snapshot text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0),
  modifiers jsonb default '[]'::jsonb
);

-- =========================================================
-- RESERVATIONS
-- =========================================================
create type reservation_status as enum
  ('pending','confirmed','seated','completed','cancelled','no_show');

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  party_size int not null check (party_size > 0 and party_size <= 20),
  reservation_time timestamptz not null,
  duration_minutes int not null default 90,
  table_number int,
  status reservation_status not null default 'pending',
  special_requests text,
  created_at timestamptz default now()
);

create index on public.reservations (reservation_time);
create index on public.reservations (status);

-- =========================================================
-- LOYALTY
-- =========================================================
create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  points int not null,        -- + earned, - redeemed
  reason text not null,
  created_at timestamptz default now()
);

create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost int not null check (points_cost > 0),
  reward_type text not null check (reward_type in ('discount_cents','free_item','percent_off')),
  reward_value int not null,
  is_active boolean default true
);

-- Apply points to profile atomically
create or replace function public.apply_loyalty_points(
  p_user_id uuid,
  p_points int,
  p_order_id uuid,
  p_reason text
) returns void language plpgsql security definer as $$
begin
  insert into public.loyalty_transactions (user_id, points, order_id, reason)
  values (p_user_id, p_points, p_order_id, p_reason);

  update public.profiles
  set
    loyalty_points = loyalty_points + p_points,
    lifetime_points = lifetime_points + greatest(p_points, 0)
  where id = p_user_id;
end; $$;

-- =========================================================
-- ROW-LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_rewards enable row level security;

-- Helper
create or replace function public.is_admin() returns boolean
language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Public reads
create policy "menu readable" on public.menu_items
  for select using (is_available = true or public.is_admin());
create policy "categories readable" on public.menu_categories
  for select using (is_active = true or public.is_admin());
create policy "rewards readable" on public.loyalty_rewards
  for select using (is_active = true or public.is_admin());

-- Profiles
create policy "own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

-- Orders: customers see own, admin sees all
create policy "own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "create order" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);

-- Reservations: customers see own, admin sees all, public can insert
create policy "own reservations" on public.reservations
  for select using (auth.uid() = user_id or public.is_admin());
create policy "create reservation" on public.reservations
  for insert with check (true);
create policy "admin manage reservations" on public.reservations
  for update using (public.is_admin());

-- Admin-only writes for menu
create policy "admin menu write" on public.menu_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin categories write" on public.menu_categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin rewards write" on public.loyalty_rewards
  for all using (public.is_admin()) with check (public.is_admin());

-- Loyalty transactions: read own
create policy "own loyalty" on public.loyalty_transactions
  for select using (auth.uid() = user_id or public.is_admin());
