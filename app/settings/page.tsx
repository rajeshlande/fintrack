import { PageLayout } from "@/components/layout/PageLayout";
import {
  ChangePasswordForm,
  ProfileForm,
  SignOutButton,
} from "@/components/settings/ProfileForm";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { createClient } from "@/lib/supabase/server";

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "app" ? "app" : "account";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, phone, currency").eq("id", user.id).maybeSingle()
    : { data: null };

  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "";
  const phoneRaw = profile?.phone?.replace(/^\+91/, "") ?? (user?.user_metadata?.phone as string | undefined)?.replace(/^\+91/, "") ?? "";
  const currency = profile?.currency ?? "INR";
  const email = user?.email ?? "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  return (
    <PageLayout activeNav="Settings" title="Settings" subtitle="Account and app preferences">
      <SettingsTabs active={activeTab} />

      {activeTab === "account" ? (
        <div className="space-y-4 md:space-y-5">
          <SettingsSection title="Profile" description="Your personal information">
            <ProfileForm fullName={fullName} email={email} phone={phoneRaw} currency={currency} />
          </SettingsSection>

          <SettingsSection title="Security" description="Update your password">
            <ChangePasswordForm />
          </SettingsSection>

          <SettingsSection title="Account Info">
            <SettingsRow label="Member since" value={memberSince} />
            <SettingsRow label="Email" value={email} />
            <SettingsRow label="Region" value="India" />
          </SettingsSection>

          <SettingsSection title="Session">
            <p className="text-sm text-gray-500 mb-4">Sign out from FinTrack on this device.</p>
            <SignOutButton />
          </SettingsSection>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          <SettingsSection title="App Preferences" description="FinTrack application settings">
            <SettingsRow label="Currency" value="INR (₹)" />
            <SettingsRow label="Language" value="English" />
            <SettingsRow label="Region" value="India" />
          </SettingsSection>

          <SettingsSection title="PWA">
            <SettingsRow label="Install" value="Add to Home Screen from browser menu" />
            <SettingsRow label="Offline" value="Enabled in production build" />
          </SettingsSection>

          <SettingsSection title="About">
            <SettingsRow label="App" value="FinTrack Personal Finance" />
            <SettingsRow label="Version" value="1.0.0" />
            <SettingsRow label="Built for" value="Indian UPI & personal finance" />
          </SettingsSection>
        </div>
      )}
    </PageLayout>
  );
}
