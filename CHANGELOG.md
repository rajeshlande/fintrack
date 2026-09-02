# Changelog

All notable changes to FinTrack are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/rajeshlande/fintrack/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/rajeshlande/fintrack/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/rajeshlande/fintrack/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rajeshlande/fintrack/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/rajeshlande/fintrack/releases/tag/v0.1.0
