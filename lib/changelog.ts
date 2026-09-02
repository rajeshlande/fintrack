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
