export type ChangelogEntry = {
  version: string;
  date: string;
  sections: {
    added?: string[];
    changed?: string[];
    fixed?: string[];
    security?: string[];
  };
};

/** Structured changelog — keep in sync with CHANGELOG.md */
export const changelog: ChangelogEntry[] = [
  {
    version: "1.0.5",
    date: "2026-09-02",
    sections: {
      added: [
        "Redesigned All Transactions list with mobile card layout and desktop table view",
        "Edit transaction modal with pre-filled taxonomy fields and date picker",
        "updateTransactionAction for saving transaction edits",
        "Delete confirmation before removing a transaction",
      ],
      changed: [
        "Transaction form supports add and edit modes; date field on new entries",
        "Taxonomy master tables and transaction FK columns consolidated in schema.sql",
        "taxonomy.sql is now seeds-only (run after schema.sql)",
      ],
      fixed: [
        "schema.sql upgrade patch runs before column comments/indexes so existing databases add merchant and taxonomy FKs without errors",
      ],
    },
  },
  {
    version: "1.0.4",
    date: "2026-09-02",
    sections: {
      added: [
        "India-focused finance taxonomy (supabase/taxonomy.sql): transaction types, hierarchical categories, payment methods, and financial accounts",
        "Transaction form with cascading Category → Subcategory → Item and Payment method → Payment source selects",
        "Dashboard floating action button to add a transaction (/transactions?add=1)",
        "Taxonomy query layer with legacy form fallback when migration is not applied",
      ],
      changed: [
        "Transactions page add section renamed to Log Income / Expense; auto-scrolls to form when opened from FAB",
        "addTransactionAction saves taxonomy foreign keys plus denormalized category and payment labels",
      ],
    },
  },
  {
    version: "1.0.3",
    date: "2026-09-02",
    sections: {
      added: [
        "Industry-standard Supabase schema with enums, indexes, views, and RPC functions",
        "Single-call dashboard, budget, and networth queries via RPC functions",
        "Custom offline page and live offline status banner",
        "Root loading skeleton and error boundary with retry",
      ],
      changed: [
        "PWA manifest enhanced with scope, categories, and display overrides",
        "Service worker configured with offline fallback and frontend nav caching",
        "Responsive layout: 1440px max width, safe-area insets, 44px touch targets",
        "Accessibility: skip link, focus-visible styles, reduced-motion, text zoom enabled",
      ],
      fixed: [
        "Ambiguous column references in Supabase RPC functions",
      ],
    },
  },
  {
    version: "1.0.2",
    date: "2026-09-02",
    sections: {
      changed: [
        "Migrated middleware.ts to proxy.ts (Next.js 16 deprecation)",
      ],
      fixed: [
        "Hydration mismatches on Budget and Networth forms from browser extension __gcruniqueid injection",
      ],
    },
  },
  {
    version: "1.0.1",
    date: "2026-09-02",
    sections: {
      added: [
        "Changelog page and centralized version management",
      ],
      changed: [
        "PWA manifest moved to Next.js native app/manifest.ts (/manifest.webmanifest)",
      ],
      fixed: [
        "Login form server action redirect error (useActionState + redirect conflict)",
        "Hydration mismatches from browser extensions on auth forms and root layout",
        "Manifest syntax error caused by auth middleware intercepting /manifest.json",
        "Middleware now excludes static PWA assets (manifest, service worker, icons)",
      ],
    },
  },
  {
    version: "1.0.0",
    date: "2026-09-02",
    sections: {
      added: [
        "Dashboard with monthly cash flow overview",
        "Transactions — income & expense tracking (UPI, cash, card, bank)",
        "Credit card tracker with limits and due dates",
        "Monthly and annual budgets with spend progress",
        "Net worth — assets and liabilities",
        "Settings with Account and App tabs",
        "Supabase authentication (email, Google OAuth, password reset)",
        "Glassmorphism UI with collapsible sidebar and mobile bottom nav",
        "PWA support with installable app manifest",
        "FinTrack logo for favicon, PWA, and login screens",
      ],
      changed: [
        "Renamed Home to Dashboard across navigation",
        "Industry-standard README documentation",
      ],
      fixed: [
        "Mobile login session cookie race condition",
      ],
    },
  },
  {
    version: "0.1.0",
    date: "2026-09-01",
    sections: {
      added: [
        "Initial Next.js 16 project scaffold",
        "Supabase auth integration",
        "Basic dashboard mockup",
      ],
    },
  },
];

export function getLatestVersion() {
  return changelog[0]?.version ?? "0.0.0";
}
