"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DotMatrix } from "./dot-matrix";

// The home hero already carries the big wordmark, so the bar's mini one only shows elsewhere.
export function HeaderBrand() {
  if (usePathname() === "/") return null;
  return (
    <Link href="/" aria-label="Touchline home" className="relative block h-[38px] w-[170px] shrink-0 sm:w-[200px]">
      <DotMatrix text="touchline" gap={3} />
    </Link>
  );
}
