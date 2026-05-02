-- =========================================================
-- PROMO CODES (one-time welcome discounts etc.)
-- =========================================================
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid references public.profiles(id) on delete cascade,
  discount_percent int not null default 10,
  used boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.promo_codes enable row level security;

-- Users can read their own codes
create policy "own promo codes" on public.promo_codes
  for select using (auth.uid() = user_id or public.is_admin());
