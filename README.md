# Theo Admin Dashboard

Admin dashboard to manage users, payments, and project statistics.

## Prerequisites
- Node.js 18+
- Supabase project (same schema used by your main app)

## Environment Variables
Copy `env.example` to `.env.local` and fill values:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-only)
- `ADMIN_DASHBOARD_PASSWORD`: Password to access the dashboard
- `ADMIN_JWT_SECRET`: Random secret for signing admin session JWTs
- `NEXT_PUBLIC_APP_NAME` (optional): Display name in the header

Example:
```
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...service_role_key...
ADMIN_DASHBOARD_PASSWORD=change-me
ADMIN_JWT_SECRET=long-random-string
NEXT_PUBLIC_APP_NAME=Theo Admin
```

## Development
```
npm install
npm run dev
```
Open `http://localhost:3000/login` and sign in with `ADMIN_DASHBOARD_PASSWORD`.

## Build
```
npm run build
npm run start
```

## Features
- Dashboard: total users, transactions, active subscriptions, total revenue (via `sum_paid_revenue` RPC if present)
- Users: list, view, and update user fields (`first_name`, `last_name`, `username`, `language`, `default_currency`, `is_premium`)
- Payments: list recent `payment_history` entries
- Subscriptions: cancel a user subscription (sets `status='cancelled'`, `cancelled_at=now` in `user_subscriptions`)

## Security Notes
- This app uses the Supabase Service Role key. Treat it as secret and server-only.
- Keep the app private and ensure `ADMIN_DASHBOARD_PASSWORD` is strong.
- Consider network restrictions (VPN/IP allowlist) in production.
