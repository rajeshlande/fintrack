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
    version: "1.0.9",
    date: "2026-09-02",
    sections: {
      added: [
        "Permanent category delete from Master Data edit modal (trash icon in header)",
        "hideCategoryAction for soft-deactivating categories (separate from permanent delete)",
      ],
      changed: [
        "Master Data Hide uses soft delete; edit-modal trash icon permanently removes the row from the database",
        "Transaction category FKs use ON DELETE SET NULL so linked transactions survive category deletion",
      ],
      fixed: ["Delete icon not shown when editing built-in categories in Master Data"],
    },
  },
  {
    version: "1.0.8",
    date: "2026-09-02",
    sections: {
      changed: [
        "Master Data UI redesigned: transaction type cards, search/level filters, and collapsible accordion groups",
        "Master Data category rows stack vertically on mobile with full-width Add, Edit, and Hide actions",
        "Category edit modal portaled to document.body with mobile bottom-sheet layout and pinned header/footer",
      ],
      fixed: [
        "Master Data edit modal blur/shadow artifact on mobile when tapping Edit",
        "Master Data edit modal not adapting to mobile screen size (viewport sync, safe-area insets, scrollable body, horizontal overflow)",
      ],
    },
  },
  {
    version: "1.0.7",
    date: "2026-09-02",
    sections: {
      added: [
        "Complete Indian finance category seeds (~209 categories) with description, icon, color, and keywords in schema.sql",
        "Master Data search across name, code, icon, and keywords; per-type category counts in Settings",
        "Schema reference section on Master Data tab (fields, transaction types, re-seed instructions)",
      ],
      changed: [
        "seed_finance_category extended with p_icon, p_color, p_keywords; named-parameter seed calls with upsert",
        "Category list in Settings shows icon, sort order, and keyword chips from seeded master data",
        "Master Data tab copy updated for all five transaction types",
      ],
      fixed: [
        "seed_finance_category overload conflict and relation savings does not exist errors from unquoted descriptions",
        "AUTO_DEBIT payment-method seed missing ON CONFLICT clause in schema.sql",
      ],
    },
  },
  {
    version: "1.0.6",
    date: "2026-09-02",
    sections: {
      added: [
        "Settings Master Data tab with income/expense category editor (add, edit, deactivate)",
        "saveCategoryAction and deleteCategoryAction for category maintenance",
        "Transfer, Saving, and Investment transaction types plus transfer category seeds in schema.sql",
      ],
      changed: [
        "Merged supabase/taxonomy.sql into supabase/schema.sql (single SQL file for schema + seeds)",
        "seed_finance_category uses p_category_code with validation and upsert support",
      ],
    },
  },
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
