import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="app-bg relative min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-4"
            aria-label="FinTrack home"
          >
            <Logo size={64} priority />
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1d23] tracking-tight">
            FinTrack
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Indian Personal Finance · UPI · Budgets
          </p>
        </div>

        <div className="glass-panel-strong p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1a1d23]">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          Your data stays private. FinTrack never shares financial details with
          third parties.
        </p>
      </div>
    </div>
  );
}
