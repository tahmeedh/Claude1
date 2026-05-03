# Restaurant Template — Astro 6 + Supabase + Stripe + Resend

Full-stack restaurant website template running on Replit, deployed to Netlify.

## Stack

- **Framework**: Astro 6 (SSR, server output)
- **UI**: React 19 + Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Auth + DB**: Supabase (auth + PostgreSQL)
- **Payments**: Stripe Checkout
- **Email**: Resend
- **Dev adapter**: `@astrojs/node` (middleware mode)
- **Prod adapter**: `@astrojs/netlify`

## Key Architecture Decisions

### Dev vs Production adapters
`astro.config.mjs` uses `@astrojs/node` in dev (`NODE_ENV !== 'production'`) and `@astrojs/netlify` for production builds. This prevents the Netlify dev middleware from intercepting Vite's virtual module requests (which breaks React hydration and HMR on Replit's proxied environment).

### Tailwind CSS v4 setup
- Uses `@tailwindcss/postcss` (not the Vite plugin)
- Config: `postcss.config.mjs`
- Styles defined in `<style is:global>` blocks in `BaseLayout.astro` and `AdminLayout.astro` (NOT via frontmatter CSS import, which caused Vite to emit CSS as module script tags)

### Supabase
- Client: `src/lib/supabase.ts` (public anon key)
- Admin client: `src/lib/supabase-admin.ts` (service role key)
- Session middleware: `src/middleware.ts` (sets `Astro.locals.user`)
- Pending migration: `supabase/migrations/0002_promo_codes.sql` (must be applied manually in Supabase SQL editor)

### Auth Flow
- Login/signup page: `/account/login` with Sign In / Create Account tabs
- Uses Supabase magic link auth
- On signup: welcome email with 10% one-time promo code sent via Resend
- Promo code stored in `promo_codes` table, validated at Stripe checkout

## Project Structure

```
restaurant-template/
├── src/
│   ├── components/
│   │   ├── auth/          # AuthTabs, LoginForm, SignUpForm
│   │   ├── cart/          # Cart components
│   │   └── ...
│   ├── layouts/
│   │   ├── BaseLayout.astro   # Main layout with global Tailwind CSS
│   │   └── AdminLayout.astro  # Admin panel layout
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── supabase-admin.ts
│   │   ├── email.ts           # Resend email helpers
│   │   └── stripe.ts
│   ├── middleware.ts           # Auth session injection
│   └── pages/
│       ├── api/               # API routes (checkout, auth, webhooks)
│       ├── account/           # User account pages
│       ├── admin/             # Admin panel pages
│       └── ...
├── supabase/
│   └── migrations/
│       ├── 0001_initial.sql
│       └── 0002_promo_codes.sql  ← PENDING manual apply
├── astro.config.mjs
├── postcss.config.mjs
└── package.json
```

## Environment Variables Required

| Secret | Purpose |
|--------|---------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `RESEND_API_KEY` | Resend API key |

## Running Locally

The "Start application" workflow runs `cd restaurant-template && npm run dev` on port 5000.

## Deployment

Deployed to Netlify at https://restaurantreplit.netlify.app via GitHub branch `claude/build-restaurant-template-xw8E7`. The Netlify adapter is used automatically in production builds (`NODE_ENV=production`).
