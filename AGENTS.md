# AGENTS.md — FinTrack

## Project context

- **App:** FinTrack — Indian personal finance PWA (income, UPI expenses, cards, budgets, net worth)
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (auth + Postgres)
- **UI:** Glassmorphism, mobile bottom nav + desktop collapsible sidebar
- **License:** GNU GPL v3 (see `LICENSE`)

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (PWA disabled in dev) |
| `npm run build` | Production build (enables service worker) |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run version:patch` | Bump patch version in `package.json` |

**Database:** Run `supabase/schema.sql` in the Supabase SQL Editor (single source of truth). Do not split schema without user request.

## Key paths

```
app/                    # Routes (App Router)
components/             # UI, auth, finance, layout, pwa, settings
lib/
  supabase/             # client.ts, server.ts, middleware.ts (session helper)
  finance/              # queries.ts (RPC + fallbacks), actions.ts
  format.ts             # formatINR, formatDate (en-IN)
  version.ts            # APP_VERSION from package.json
  changelog.ts          # Keep in sync with CHANGELOG.md
proxy.ts                # Auth route protection (Next.js 16; not middleware.ts)
app/manifest.ts         # PWA manifest → /manifest.webmanifest
app/~offline/           # Offline fallback page
```

## Code conventions

- **Currency:** Use `formatINR` / `formatINRDecimal` from `@/lib/format` — never hardcode `₹`.
- **Supabase:** Use `@/lib/supabase/client` (client components) or `@/lib/supabase/server` (server). Never roll new clients in random files.
- **Auth:** Server actions must call `supabase.auth.getUser()` before financial writes.
- **RLS:** Never bypass Row Level Security. New tables need RLS + policies in `schema.sql`.
- **Data reads:** Prefer RPC functions (`get_dashboard_summary`, `get_budgets_with_spent`, `get_networth_summary`) in `lib/finance/queries.ts`; keep legacy fallbacks when RPC is missing.
- **Forms:** Auth/finance forms may need `suppressHydrationWarning` on `<form>`, `<input>`, `<select>` when browser extensions inject attributes.
- **Versioning:** Bump `package.json`, `CHANGELOG.md`, and `lib/changelog.ts` together.

## PWA

- Manifest: `app/manifest.ts` (not `public/manifest.json`)
- Service worker: `@ducanh2912/next-pwa` in `next.config.ts` (production only)
- Test offline: `npm run build && npm run start`
- Layout uses `viewportFit: "cover"`, safe-area padding, skip link, 1440px max content width

## Critical constraints

- **Privacy:** Never log or send plain-text bank/UPI/financial data to third-party services.
- **Secrets:** Never commit `.env.local`. Use `.env.example` as template.
- **Scope:** Minimize diffs; match existing patterns; do not add unrelated refactors.
- **GPL v3:** Avoid proprietary-licensed dependencies incompatible with GPL.

## Next.js note

This project uses Next.js 16 with breaking changes vs older docs. Check `node_modules/next/dist/docs/` when unsure about APIs. `proxy.ts` replaced the deprecated `middleware.ts` convention.
