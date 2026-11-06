"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ActivityIcon, HomeIcon, SearchIcon, TrophyIcon } from "./icons";

const ITEMS = [
  {
    href: "/",
    code: "00",
    label: "Matches",
    Icon: HomeIcon,
    is: (p: string, live: boolean) => p === "/" && !live,
  },
  {
    href: "/?filter=live",
    code: "01",
    label: "Live",
    Icon: ActivityIcon,
    is: (p: string, live: boolean) => p === "/" && live,
  },
  { href: "/leagues", code: "02", label: "Comps", Icon: TrophyIcon, is: (p: string) => p.startsWith("/league") },
  { href: "/search", code: "03", label: "Search", Icon: SearchIcon, is: (p: string) => p.startsWith("/search") },
];

export function MobileBar() {
  const pathname = usePathname();
  const live = useSearchParams().get("filter") === "live";

  return (
    <nav className="tl-mbar" aria-label="Primary">
      {ITEMS.map(({ href, code, label, Icon, is }) => {
        const active = is(pathname, live);
        return (
          <Link
            key={href}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className="tl-mbar-i"
          >
            <i className="tl-mbar-led" aria-hidden="true" />
            <Icon size={17} />
            <span>{label}</span>
            <small className="tl-mbar-c">{code}</small>
          </Link>
        );
      })}
    </nav>
  );
}
