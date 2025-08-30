# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 admin dashboard application called "Theo Admin" that manages users, payments, and project statistics for a Supabase-based application. It uses the Next.js App Router with TypeScript and Tailwind CSS.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Configuration

Required environment variables (create `.env.local`):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` (or `SECRET_KEY` or `SUPABASE_SECRET`) - Service role key for server-side operations
- `ADMIN_DASHBOARD_PASSWORD` - Password for admin login
- `ADMIN_JWT_SECRET` - Secret for signing admin session JWTs
- `NEXT_PUBLIC_APP_NAME` (optional) - Display name in header

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.2 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based admin authentication using jose library

### Project Structure
- `/src/app/` - App Router pages and API routes
  - `/admin/` - Protected admin pages (dashboard, users, payments)
  - `/api/admin/` - Protected API endpoints
  - `/login/` - Login page
- `/src/lib/` - Shared utilities
  - `auth.ts` - JWT session management
  - `supabase-admin.ts` - Supabase admin client and database operations
- `/src/components/admin/` - Admin-specific components
- `/middleware.ts` - Next.js middleware for authentication

### Key Architectural Patterns

1. **Authentication Flow**:
   - Login via password (`/api/admin/login`) creates JWT session token
   - Middleware (`middleware.ts`) protects `/admin/*` routes
   - Session stored in `admin_session` cookie (12-hour expiry)

2. **Database Access**:
   - Uses Supabase service role key for admin operations
   - Singleton pattern for admin client (`getSupabaseAdmin()`)
   - Direct table access: `users`, `transactions`, `payment_history`, `user_subscriptions`
   - Optional RPC: `sum_paid_revenue` for revenue calculations

3. **API Design**:
   - RESTful routes under `/api/admin/`
   - All endpoints require admin authentication via `requireAdmin()`
   - Consistent error handling with NextResponse

## Database Schema

Expected Supabase tables:
- `users`: id, telegram_id, username, first_name, last_name, language, default_currency, is_premium, created_at
- `transactions`: id, user_id, amount, currency, created_at
- `payment_history`: id, user_id, amount, currency, status, created_at, description
- `user_subscriptions`: id, user_id, status, cancelled_at

## Path Aliases

TypeScript path alias configured:
- `@/*` maps to `./src/*`

## Security Considerations

- Service role key provides full database access - server-side only
- Admin session tokens signed with ADMIN_JWT_SECRET
- Middleware enforces authentication on all `/admin/*` routes
- No client-side database access