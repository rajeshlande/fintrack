import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { ChangelogList } from "@/components/settings/ChangelogList";
import { getFullVersionLabel } from "@/lib/version";

export default function ChangelogPage() {
  return (
    <PageLayout
      activeNav="Settings"
      title="Changelog"
      subtitle={`Release history for ${getFullVersionLabel()}`}
    >
      <p className="text-sm text-gray-500 mb-5">
        See also{" "}
        <a
          href="https://github.com/rajeshlande/fintrack/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noopener noreferrer"
          className="link-accent"
        >
          CHANGELOG.md on GitHub
        </a>
        {" · "}
        <Link href="/settings?tab=app" className="link-accent">
          App settings
        </Link>
      </p>
      <ChangelogList />
    </PageLayout>
  );
}
