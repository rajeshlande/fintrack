@AGENTS.md

## Claude-specific directives

- **Schema changes:** Switch to `plan` mode before editing `supabase/schema.sql` (enums, RLS, triggers, RPC functions).
- **Security:** Always verify `supabase.auth.getUser()` before transactional server actions.
- **PWA / UI:** Validate new screens at mobile (`<768px`) and desktop (`≥1024px`) breakpoints; preserve glassmorphism and touch targets (44px min).
- **Hydration:** Extension-injected attributes (`__gcruniqueid`) are expected — use `suppressHydrationWarning` on affected form elements, not client-only hacks unless necessary.

## What not to maintain separately

- **`memory.md` is not used** — do not create it. Project context lives in `AGENTS.md`, `README.md`, and `CHANGELOG.md`.
- **`.claude/skills/`** — only add if you introduce a real, reusable skill file; do not duplicate AGENTS.md content there.
