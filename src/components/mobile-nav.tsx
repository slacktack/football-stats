"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, HomeIcon, SearchIcon, TrophyIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Scores", icon: HomeIcon, exact: true },
  { href: "/?filter=live", label: "Live", icon: ActivityIcon, live: true },
  { href: "/leagues", label: "Leagues", icon: TrophyIcon, prefix: "/league" },
  { href: "/search", label: "Search", icon: SearchIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/leagues"
                ? pathname.startsWith("/leagues") || pathname.startsWith(item.prefix ?? "")
                : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                active ? "text-accent" : "text-dim"
              }`}
            >
              {active && (
                <span className="absolute top-0 h-[2px] w-8 rounded-b-full bg-accent" />
              )}
              <span className="relative">
                <Icon size={21} />
                {item.live && (
                  <span className="live-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-live" />
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
