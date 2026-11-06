"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TermBar } from "@/components/tl";
import { PixelField } from "@/components/pixel-field";

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="tl-view shell py-10 md:py-16">
      <div className="tl-term-out relative mx-auto w-full max-w-2xl overflow-hidden">
        <PixelField step={20} />
        <TermBar path={pathname ?? "/"} dim="route log" />
        <div className="relative px-4 pb-5 pt-5 sm:px-5">
          <p className="tl-k tl-k-dim">status</p>
          <p className="tl-num text-[58px] leading-none text-accent sm:text-[72px]">404</p>
          <p className="tl-k mt-3 max-w-md leading-relaxed">
            That match, team or player doesn&apos;t exist, or the link is out of date.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/" className="tl-btn tl-btn-inv">
              Go to scores
            </Link>
            <Link href="/search" className="tl-btn">
              Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
