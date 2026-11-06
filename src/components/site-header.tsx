import Link from "next/link";
import { Brand } from "./brand";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import { SfxToggle } from "./sfx";
import { Chip, Scrub } from "./tl";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base pt-[env(safe-area-inset-top)]">
      <Scrub />
      <div className="shell flex h-[52px] items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Brand compact />
          <span className="hidden h-5 w-px shrink-0 bg-line lg:block" />
          <span className="tl-k tl-k-dim hidden lg:block">Scores console</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/?filter=live" className="hidden sm:block">
            <Chip tone="live">
              <i className="tl-led steady" aria-hidden="true" />
              Live now
            </Chip>
          </Link>
          <span className="hidden h-5 w-px shrink-0 bg-line sm:block" />
          <SfxToggle className="hidden sm:inline-flex" />
          <SearchDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
