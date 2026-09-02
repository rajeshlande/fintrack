<p align="center">
  <img src="public/logo.png" alt="FinTrack logo" width="128" height="128" />
</p>

<h1 align="center">FinTrack</h1>

<p align="center">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-1.0.9-1a1d23?style=flat-square" alt="Version 1.0.9" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-blue?style=flat-square" alt="License: GPL v3" /></a>
</p>

<p align="center">
  <strong>Indian personal finance PWA</strong> — track income, UPI expenses, credit cards, budgets, and net worth.
</p>

<p align="center">
  <a href="https://github.com/rajeshlande/fintrack">Repository</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Application Routes](#application-routes)
- [Project Structure](#project-structure)
- [PWA Support](#pwa-support)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Monthly cash flow, quick stats, and recent transactions |
| **Transactions** | Log income & expenses with UPI, cash, card, and bank transfer |
| **Credit Cards** | Track limits, outstanding balance, and payment due dates |
| **Budgets** | Set monthly or annual budgets with spend progress |
| **Net Worth** | Manage assets and liabilities in one view |
| **Settings** | Profile management, password reset, and app preferences |

**Authentication**
- Email/password sign-up and sign-in
- Google OAuth
- Password reset flow
- Protected routes with server-side session handling

**UX**
- Collapsible sidebar (desktop) and bottom navigation (mobile)
- Glassmorphism design system
- INR (₹) formatting and +91 phone input
- Installable PWA on supported browsers

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Auth & Database | [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security) |
| PWA | [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa) |
| Linting | ESLint + `eslint-config-next` |

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- A [Supabase](https://supabase.com/) project (free tier works)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rajeshlande/fintrack.git
cd fintrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project credentials (see [Environment Variables](#environment-variables)).

### 4. Set up the database

Run the SQL migration in `supabase/schema.sql` via the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

### 5. Configure Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

For mobile LAN testing, also add: `http://<your-lan-ip>:3000/auth/callback`

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable (anon) key |
| `NEXT_PUBLIC_SITE_URL` | No | Fallback URL for password-reset emails |

> **Never commit `.env.local`** or expose your Supabase service role key in client-side code.

---

## Database Setup

The schema in `supabase/schema.sql` creates:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (name, phone, currency) |
| `transactions` | Income and expense records |
| `credit_cards` | Credit card tracking |
| `budgets` | Monthly and annual budgets |
| `networth_items` | Assets and liabilities |

All tables use **Row Level Security (RLS)** so users can only access their own data.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |
| `npm run version:patch` | Bump patch version in `package.json` |

**Current release:** [v1.0.9](CHANGELOG.md) — see [CHANGELOG.md](CHANGELOG.md) for release notes.

## Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Protected | Dashboard overview |
| `/transactions` | Protected | Income & expense management |
| `/cards` | Protected | Credit card tracker |
| `/budgets` | Protected | Budget planning |
| `/networth` | Protected | Assets & liabilities |
| `/settings` | Protected | Account & app settings |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/forgot-password` | Public | Request password reset |
| `/reset-password` | Public | Set new password |

---

## Project Structure

```
fintrack/
├── app/                    # Next.js App Router pages & API routes
│   ├── auth/               # OAuth callback & sign-out
│   ├── budgets/
│   ├── cards/
│   ├── login/
│   ├── networth/
│   ├── settings/
│   ├── transactions/
│   └── ...
├── components/
│   ├── auth/               # Login, signup, password forms
│   ├── finance/            # Transaction, card, budget forms
│   ├── layout/             # Sidebar, bottom nav, page shell
│   ├── settings/           # Profile & settings UI
│   └── ui/                 # Shared icons & primitives
├── lib/
│   ├── auth/               # Auth server actions
│   ├── finance/            # Finance queries & actions
│   ├── settings/           # Settings server actions
│   └── supabase/           # Supabase client utilities
├── public/                 # Static assets & PWA manifest
├── supabase/
│   └── schema.sql          # Database migration
├── middleware.ts           # Auth session & route protection
└── next.config.ts          # Next.js & PWA configuration
```

---

## PWA Support

FinTrack is configured as an installable PWA:

- **Manifest:** `public/manifest.json`
- **Service worker:** Generated on production build via `@ducanh2912/next-pwa`
- **Install:** Use *Add to Home Screen* in your mobile browser or the install prompt in desktop Chrome/Edge

PWA caching is **disabled in development** so changes appear immediately.

---

## Deployment

### Vercel (recommended)

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add environment variables from `.env.example`.
4. Set Supabase redirect URLs to your production domain.
5. Deploy.

### Other platforms

```bash
npm run build
npm run start
```

Ensure `NEXT_PUBLIC_SITE_URL` and Supabase auth redirect URLs match your production domain.

---

## Security

- Authentication handled by Supabase with HTTP-only cookies (SSR)
- All database tables protected with Row Level Security
- Secrets stored in `.env.local` (gitignored)
- Middleware enforces protected routes server-side
- Password reset uses secure email link flow

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow existing code conventions and run `npm run lint` before submitting.

---

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.

---

## Author

**Rajesh Lande** — [github.com/rajeshlande](https://github.com/rajeshlande)
