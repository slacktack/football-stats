import Link from "next/link";
import { DotMatrix } from "./dot-matrix";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import { SfxToggle } from "./sfx";
import { Chip } from "./tl";

export function SiteHeader() {
  return (
    <header className="tl-header sticky top-0 z-50 border-b border-line bg-base pt-[env(safe-area-inset-top)]">
      <span className="tl-header-line" aria-hidden="true" />
      <div className="shell flex h-[52px] items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/" aria-label="Touchline home" className="relative block h-[38px] w-[170px] shrink-0 sm:w-[200px]">
            <DotMatrix text="touchline" gap={3} />
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/?filter=live" className="hidden sm:block">
            <Chip tone="live" className="tl-live-chip">
              <i className="tl-led" aria-hidden="true" />
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
