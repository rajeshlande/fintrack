import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  activeNav: import("@/lib/navigation").NavLabel;
  children: React.ReactNode;
  wide?: boolean;
};

export function PageLayout({
  title,
  subtitle,
  activeNav,
  children,
  wide = false,
}: PageLayoutProps) {
  return (
    <AppShell activeNav={activeNav}>
      <main
        className={`px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 mx-auto w-full ${
          wide ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        <PageHeader title={title} subtitle={subtitle} />
        {children}
      </main>
    </AppShell>
  );
}
