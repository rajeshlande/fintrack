type SettingsSectionProps = {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  description,
  className = "",
  children,
}: SettingsSectionProps) {
  return (
    <section className={`glass-panel-strong p-4 sm:p-5 md:p-6 min-w-0 ${className}`}>
      <div className="mb-4 sm:mb-5">
        <h2 className="text-base font-bold text-[#1a1d23]">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

type SettingsRowProps = {
  label: string;
  value?: string;
  children?: React.ReactNode;
};

export function SettingsRow({ label, value, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-black/[0.04] last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {children ?? (
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      )}
    </div>
  );
}
