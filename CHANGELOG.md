# Changelog

All notable changes to FinTrack are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.5] - 2026-09-02

### Added
- Redesigned All Transactions list with mobile card layout and desktop table view
- Edit transaction modal with pre-filled taxonomy fields and date picker
- `updateTransactionAction` for saving transaction edits
- Delete confirmation before removing a transaction

### Changed
- Transaction form supports add and edit modes; date field on new entries
- Taxonomy master tables and transaction FK columns consolidated in `schema.sql`
- `taxonomy.sql` is now seeds-only (run after `schema.sql`)

### Fixed
- `schema.sql` upgrade patch runs before column comments/indexes so existing databases add `merchant` and taxonomy FKs without errors

## [1.0.4] - 2026-09-02

### Added
- India-focused finance taxonomy (`supabase/taxonomy.sql`): transaction types, hierarchical categories, payment methods, and financial accounts
- Transaction form with cascading Category → Subcategory → Item and Payment method → Payment source selects
- Dashboard floating action button to add a transaction (`/transactions?add=1`)
- Taxonomy query layer (`lib/finance/taxonomy-queries.ts`, `taxonomy-types.ts`) with legacy form fallback when migration is not applied

### Changed
- Transactions page renamed add section to “Log Income / Expense”; auto-scrolls to form when opened from FAB
- `addTransactionAction` saves taxonomy foreign keys plus denormalized category and payment labels

## [1.0.3] - 2026-09-02

### Added
- Industry-standard Supabase schema with enums, indexes, views, and RPC functions
- Single-call dashboard, budget, and networth queries via `get_dashboard_summary`, `get_budgets_with_spent`, `get_networth_summary`
- Custom offline page (`/~offline`) and live offline status banner
- Root loading skeleton and error boundary with retry

### Changed
- PWA manifest enhanced with scope, categories, and display overrides
- Service worker configured with offline fallback and frontend nav caching
- Responsive layout: 1440px max content width, safe-area insets, 44px touch targets
- Accessibility: skip link, focus-visible styles, reduced-motion support, text zoom enabled

### Fixed
- Ambiguous column references in Supabase RPC functions (`get_dashboard_summary`, etc.)

## [1.0.2] - 2026-09-02

### Changed
- Migrated `middleware.ts` to `proxy.ts` (Next.js 16 deprecation)

### Fixed
- Hydration mismatches on Budget and Networth forms from browser extension `__gcruniqueid` injection

## [1.0.1] - 2026-09-02

### Added
- Changelog page and centralized version management

### Changed
- PWA manifest moved to Next.js native `app/manifest.ts` (`/manifest.webmanifest`)

### Fixed
- Login form server action redirect error (`useActionState` + `redirect` conflict)
- Hydration mismatches from browser extensions on auth forms and root layout
- Manifest syntax error caused by auth middleware intercepting `/manifest.json`
- Middleware now excludes static PWA assets (manifest, service worker, icons)

## [1.0.0] - 2026-09-02

### Added
- Dashboard with monthly cash flow overview
- Transactions — income & expense tracking (UPI, cash, card, bank)
- Credit card tracker with limits and due dates
- Monthly and annual budgets with spend progress
- Net worth — assets and liabilities
- Settings with Account and App tabs
- Supabase authentication (email, Google OAuth, password reset)
- Glassmorphism UI with collapsible sidebar and mobile bottom nav
- PWA support with installable app manifest
- FinTrack logo for favicon, PWA, and login screens

### Changed
- Renamed Home to Dashboard across navigation
- Industry-standard README documentation

### Fixed
- Mobile login session cookie race condition

## [0.1.0] - 2026-09-01

### Added
- Initial Next.js 16 project scaffold
- Supabase auth integration
- Basic dashboard mockup

[Unreleased]: https://github.com/rajeshlande/fintrack/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/rajeshlande/fintrack/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/rajeshlande/fintrack/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/rajeshlande/fintrack/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/rajeshlande/fintrack/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/rajeshlande/fintrack/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rajeshlande/fintrack/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/rajeshlande/fintrack/releases/tag/v0.1.0
