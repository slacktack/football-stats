"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ActivityIcon, HomeIcon, SearchIcon, TrophyIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Matches", icon: HomeIcon, match: (p: string, live: boolean) => p === "/" && !live },
  { href: "/?filter=live", label: "Live", icon: ActivityIcon, match: (p: string, live: boolean) => p === "/" && live },
  { href: "/leagues", label: "Competitions", icon: TrophyIcon, match: (p: string) => p.startsWith("/league") },
  { href: "/search", label: "Search", icon: SearchIcon, match: (p: string) => p.startsWith("/search") },
];

export function SideNavLinks() {
  const pathname = usePathname();
  const live = useSearchParams().get("filter") === "live";
  return (
    <nav className="px-2" aria-label="Primary">
      <ul className="space-y-0.5">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname, live);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`sidenav-link ${active ? "is-active" : ""}`}>
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
