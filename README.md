# FinTrack

Indian personal finance PWA — track income, expenses, credit cards, budgets, and net worth in ₹.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** — glassmorphism UI
- **Supabase** — auth + PostgreSQL
- **PWA** — installable on mobile & desktop

## Setup

```bash
npm install
cp .env.example .env.local   # add your Supabase keys
```

Run the SQL in `supabase/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard).

Configure **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

```bash
npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — overview & recent activity |
| `/transactions` | Income & expense tracking |
| `/cards` | Credit card tracker |
| `/budgets` | Monthly & annual budgets |
| `/networth` | Assets & liabilities |
| `/settings` | Account profile & app settings |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment

See `.env.example` for required variables.

## License

Private — personal use.
