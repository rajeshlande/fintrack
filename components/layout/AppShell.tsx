import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
  activeNav?: string;
};

export function AppShell({ children, activeNav = "Home" }: AppShellProps) {
  return (
    <div className="app-bg relative min-h-dvh flex">
      <Sidebar active={activeNav} />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
