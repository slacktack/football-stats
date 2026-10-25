import Link from "next/link";
import { BrandMark } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-16 hidden border-t border-line/70 py-10 md:block">
      <div className="shell flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <BrandMark className="h-9 w-9" />
          <div>
            <p className="font-display text-sm font-extrabold tracking-[0.12em] text-ink">TOUCHLINE</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-dim">
              Every match, every league, every number. A faster, sharper way to follow the football.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <Link href="/" className="transition-colors hover:text-accent">
            Scores
          </Link>
          <Link href="/leagues" className="transition-colors hover:text-accent">
            Leagues
          </Link>
          <Link href="/search" className="transition-colors hover:text-accent">
            Search
          </Link>
          <span className="text-dim">Data via FotMob</span>
        </div>
      </div>
    </footer>
  );
}
