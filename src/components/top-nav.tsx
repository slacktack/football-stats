"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Matches", exact: true },
  { href: "/leagues", label: "Competitions", prefix: "/league" },
  { href: "/search", label: "Search", prefix: "/search" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href) || pathname.startsWith(item.prefix ?? "");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            <span
              className={`absolute inset-x-3 -bottom-[15px] h-[2px] origin-left rounded-full bg-accent transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
