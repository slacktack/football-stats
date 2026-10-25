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
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="glass mx-auto flex max-w-md items-center gap-1 rounded-2xl border border-line/80 p-1.5 shadow-[0_22px_60px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl">
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
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active ? "bg-accent/10 text-accent" : "text-dim hover:text-ink"
              }`}
            >
              <span className="relative">
                <Icon size={19} />
                {item.live && (
                  <span className="live-dot absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-live ring-2 ring-base" />
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
