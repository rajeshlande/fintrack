import { changelog } from "@/lib/changelog";

const sectionLabels: Record<string, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  security: "Security",
};

const sectionColors: Record<string, string> = {
  added: "text-emerald-600",
  changed: "text-blue-600",
  fixed: "text-amber-600",
  security: "text-red-600",
};

export function ChangelogList() {
  return (
    <div className="space-y-6">
      {changelog.map((entry) => (
        <article key={entry.version} className="glass-panel-strong p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-[#1a1d23]">
              Version {entry.version}
            </h2>
            <time className="text-sm text-gray-400" dateTime={entry.date}>
              {new Date(entry.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>

          <div className="space-y-4">
            {Object.entries(entry.sections).map(([key, items]) => {
              if (!items?.length) return null;
              return (
                <div key={key}>
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${sectionColors[key] ?? "text-gray-600"}`}
                  >
                    {sectionLabels[key] ?? key}
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-gray-600 flex gap-2"
                      >
                        <span className="text-gray-300 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
