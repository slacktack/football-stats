import Link from "next/link";
import { Brand } from "./brand";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import { TopNav } from "./top-nav";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-line/70">
      <div className="shell flex h-16 items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 lg:hidden">
          <Brand />
          <div className="ml-1 hidden h-6 w-px bg-line md:block" />
          <TopNav />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:w-full lg:flex-row-reverse lg:justify-between">
          <Link
            href="/?filter=live"
            className="hidden items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-live/30 hover:text-ink lg:flex"
          >
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
            Live now
          </Link>
          <SearchDialog />
          <ThemeToggle className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}
