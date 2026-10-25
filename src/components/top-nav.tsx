"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Matches", exact: true },
  { href: "/leagues", label: "Leagues", prefix: "/league" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href) || pathname.startsWith(item.prefix ?? "");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
      <Link
        href="/?filter=live"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
        Live
      </Link>
    </nav>
  );
}
