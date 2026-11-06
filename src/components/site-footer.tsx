import Link from "next/link";
import { Brand } from "./brand";
import { Ruler } from "./tl";

const LINKS = [
  { href: "/", label: "Scores" },
  { href: "/?filter=live", label: "Live" },
  { href: "/leagues", label: "Competitions" },
  { href: "/search", label: "Search" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 hidden border-t border-line md:block">
      <div className="shell py-8">
        <Ruler n={64} />
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Brand compact />
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Every match, every league, every number. Live scores, tables, lineups and
              telemetry from the competitions that matter.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="tl-k hover:text-accent">
                {link.label}
              </Link>
            ))}
            <span className="tl-k tl-k-dim">Data via FotMob</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
