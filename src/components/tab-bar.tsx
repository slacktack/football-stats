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
    <nav
      className={`no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-black/25 p-1 ${className}`}
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
            className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-accent/14 text-accent ring-1 ring-inset ring-accent/20"
                : "text-muted hover:bg-white/[0.04] hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
