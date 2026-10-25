import { Brand } from "./brand";
import { SearchDialog } from "./search-dialog";
import { TopNav } from "./top-nav";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-line/80">
      <div className="shell flex h-16 items-center gap-3 md:gap-5">
        <Brand />
        <div className="ml-1 hidden h-6 w-px bg-line md:block" />
        <TopNav />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-dim lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Live scores
          </span>
          <SearchDialog />
        </div>
      </div>
    </header>
  );
}
