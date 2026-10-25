import Link from "next/link";

export function TabBar({
  tabs,
  active,
  basePath,
  preserve = {},
  className = "",
}: {
  tabs: { value: string; label: string }[];
  active: string;
  basePath: string;
  preserve?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <nav
        className="no-scrollbar -mb-px flex gap-5 overflow-x-auto border-b border-line/80 sm:gap-7"
        aria-label="Page sections"
      >
        {tabs.map((tab) => {
          const params = new URLSearchParams();
          params.set("tab", tab.value);
          for (const [key, value] of Object.entries(preserve)) {
            if (value) params.set(key, value);
          }
          const href = `${basePath}?${params.toString()}`;
          const isActive = active === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`group relative shrink-0 border-b-2 pb-3 pt-3.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${
                isActive
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-[2px] left-0 h-[2px] w-full rounded-full bg-accent shadow-[0_0_12px_rgba(200,247,81,0.55)]" />
              )}
            </Link>
          );
        })}
      </nav>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-base to-transparent sm:hidden"
        aria-hidden="true"
      />
    </div>
  );
}
