# Zuprano — storefront + admin CRM

One Next.js 15 app that serves both:

| Area | URL | Replaces |
| --- | --- | --- |
| Storefront | `/`, `/shop`, `/product/[id]`, `/checkout`, `/account`, `/wishlist`, `/tracking` | zuprano.com |
| Admin panel | `/admin` (login at `/admin/login`) | sartaaj-e4eb3.web.app |

**Stack:** Next.js (App Router) · Tailwind · Supabase (Postgres, Auth, Storage, Realtime, RLS) · Razorpay.

## What's wired end to end

- Products created in admin (set **Public Visibility** on) appear in the store immediately; stock, variants, prices and MRP/discount come from the database.
- Checkout re-prices the cart on the server, applies active **pricing tiers** (bulk discounts), 18% GST, free shipping above ₹500, then takes payment by **Razorpay** (card / UPI) or **Cash on Delivery**.
- Stock is reserved atomically when an order is paid (or placed as COD) and returned automatically if the order is cancelled. Dealer order counts and revenue update with each dealer order.
- Every order gets a tracking ID. Status changes made in admin build the timeline shown on `/tracking/<id>` and in the customer's order history.
- **Categories** (Admin → Categories): add, rename, reorder, hide or delete. Hiding a category hides all its products from the store, search and checkout. Deleting one moves its products either to another category you pick or to the locked, always-hidden *Uncategorized* category, where they stay hidden until you assign each a new category.
- Admin: dashboard, products (list/grid, create/edit/duplicate/delete, image upload), orders (create, view, update status/payment/tracking, CSV export), inventory (restock, transfer to dealer, adjust, audit log), dealers + verification queue, customers, pricing tiers + campaigns, analytics and reports computed from real orders, settings, staff management. Lists update live via Supabase Realtime.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema and demo data:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push            # runs supabase/migrations
   psql "<your DB connection string>" -f supabase/seed.sql   # optional demo catalogue
   ```
   (Or paste the files into the Supabase SQL editor in this order: every file in `supabase/migrations/` oldest first, then `supabase/seed.sql`.)
3. **Authentication → URL Configuration**: set *Site URL* to your domain and add `https://<your-domain>/**` to *Redirect URLs*.
4. Optional sign-in methods used by the store's login modal:
   - *Phone OTP*: Authentication → Providers → Phone, and connect an SMS provider (Twilio, MessageBird, …).
   - *Google / Apple*: enable under Authentication → Providers.
   - If *Confirm email* is on (the default), new customers must click the email link before they can sign in.

## 2. Set up Razorpay

1. Dashboard → **API Keys**: generate a key pair (test mode first).
2. Dashboard → **Webhooks**: add `https://<your-domain>/api/razorpay/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, and set a secret.

Without Razorpay keys the store still works; the card/UPI options are disabled and COD is used.

## 3. Environment variables

Copy `.env.example` to `.env.local` (local) or add these in Vercel/Railway:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (server only, never expose) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API keys |
| `RAZORPAY_WEBHOOK_SECRET` | the secret you set on the webhook |
| `NEXT_PUBLIC_SITE_URL` | your public URL |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only for the admin seed script below |

## 4. Create the admin account

```bash
npm install
npm run seed:admin      # creates ADMIN_EMAIL / ADMIN_PASSWORD with the admin role
```

Further staff (Super Admin / Manager / Support) can be added from **Admin → Settings → Admin Management**.

## Run locally

```bash
npx supabase start      # local Postgres/Auth/Storage in Docker; prints local keys for .env.local
npm run seed:admin
npm run dev             # http://localhost:3000  and  http://localhost:3000/admin
```

`npx supabase db reset` rebuilds the local database from the migration and seed.

## Deploy

**Vercel:** import the repo, add the environment variables, deploy. No extra config.

**Railway:** create a service from the repo, add the environment variables. Railway runs `npm run build` and `npm start` (which binds to `$PORT`).

After deploying, update the Supabase Site URL / redirect URLs and the Razorpay webhook URL to the production domain.

## Project layout

```
src/app/(store)/        storefront pages
src/app/admin/          admin login + panel pages
src/app/api/            checkout, payment verification, Razorpay webhook, tracking, admin APIs
src/components/         store/ and admin/ UI
src/lib/                Supabase clients, mappers, pricing, server-side order logic
src/stores/             client state (cart, auth, wishlist, catalogue)
supabase/migrations/    schema, RLS policies, stock functions, storage bucket
supabase/seed.sql       demo catalogue, campaigns, default settings
```
