import { UserMenu } from "@/components/layout/UserMenu";
import { createClient } from "@/lib/supabase/server";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export async function PageHeader({ title, subtitle }: PageHeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ?? null;

  return (
    <header className="flex justify-between items-start gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1d23] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
      <UserMenu userEmail={user?.email} userName={userName} />
    </header>
  );
}
