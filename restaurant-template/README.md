# Restaurant Website Template

A full-stack restaurant website built with **Astro 5**, **Supabase**, and **Stripe**.

Features: online ordering with cart, Stripe Checkout, loyalty rewards, table reservations, real-time admin dashboard.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Astro 5 (SSR) |
| UI Islands | React 19 + shadcn/ui + Tailwind CSS v4 |
| Database + Auth | Supabase (Postgres + RLS + Auth) |
| Payments | Stripe Checkout + Webhooks |
| Email | Resend |
| Deployment | Vercel |

## Quick Start

```bash
git clone <this-template>
cp .env.example .env          # fill in keys
npm install
supabase db push              # apply migrations
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | Resend API key for email |
| `PUBLIC_SITE_URL` | Full URL of your site (e.g. `http://localhost:4321`) |
| `RESTAURANT_TIMEZONE` | IANA timezone string (e.g. `America/New_York`) |

### Supabase Setup

1. Create a new Supabase project.
2. Run the migration: `supabase db push` or paste `supabase/migrations/0001_init.sql` into the SQL editor.
3. Create a public storage bucket named `menu-images` and add an insert policy for admins only.

### Stripe Setup

1. Create a Stripe account and get your API keys.
2. In Stripe Dashboard → Developers → Webhooks, add an endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Listen for the `checkout.session.completed` event.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Promoting a User to Admin

After signing up, run this once in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Then log in — you'll have access to `/admin`.

## Project Structure

```
src/
  components/
    menu/MenuGrid.tsx          # Category-filtered menu with cart integration
    cart/CartDrawer.tsx        # Slide-out cart with Stripe checkout
    cart/CartButton.tsx        # Floating cart button
    reservation/ReservationForm.tsx  # Date picker + time slot booking
    loyalty/LoyaltyCard.tsx    # Points balance, rewards, history
    admin/MenuEditor.tsx       # Admin menu CRUD + image upload
    admin/OrdersTable.tsx      # Live orders table (Supabase Realtime)
    admin/ReservationsCalendar.tsx  # Reservation management
    admin/LoyaltyOverview.tsx  # Top customers + manual point adjustments
    ui/                        # shadcn/ui base components
  layouts/
    BaseLayout.astro           # Public layout with nav
    AdminLayout.astro          # Admin sidebar layout
  lib/
    supabase/server.ts         # SSR Supabase client (cookies)
    supabase/browser.ts        # Browser Supabase client
    supabase/admin.ts          # Service-role client (server only!)
    stripe.ts                  # Stripe instance
    email.ts                   # Resend email helpers
    schemas.ts                 # Shared Zod schemas
    loyalty.ts                 # Points calculation + tier logic
    reservations.ts            # Slot generation + availability
  middleware.ts                # Auth gate for /admin routes
  pages/
    index.astro                # Homepage with featured items
    menu.astro                 # Full menu with cart
    reservations.astro         # Reservation booking
    loyalty.astro              # Loyalty dashboard
    account/login.astro        # Magic link auth
    account/orders.astro       # Customer order history
    admin/                     # Admin dashboard pages
    api/                       # API endpoints
  stores/
    cartStore.ts               # Zustand cart (localStorage)
supabase/
  migrations/0001_init.sql    # Full DB schema + RLS policies
```

## Key Architecture Decisions

- **Never trust client prices** — checkout always re-fetches `price_cents` from `menu_items`.
- **Points move only in the webhook** — never in the checkout endpoint, so they're always tied to successful payment.
- **Service-role key is server-only** — `supabase/admin.ts` is never imported in browser code.
- **RLS everywhere** — all tables have row-level security; admins are identified via the `is_admin()` function.

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npx astro check` | Type-check all Astro files |

## Deployment

```bash
vercel --prod
```

Set all env vars in the Vercel dashboard. Configure the Stripe webhook to point to `https://yourdomain.com/api/stripe/webhook`.
