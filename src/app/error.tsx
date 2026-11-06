"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TermBar } from "@/components/tl";
import { PixelField } from "@/components/pixel-field";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const pathname = usePathname();
  const digest = (error as { digest?: string } | null)?.digest;

  return (
    <div className="tl-view shell py-10 md:py-16">
      <div className="tl-term-out relative mx-auto w-full max-w-2xl overflow-hidden">
        <PixelField step={20} tone="alert" />
        <TermBar
          path={pathname ?? "/"}
          dim={digest ? `log ${digest.slice(0, 10)}` : "feed log"}
        />
        <div className="px-4 pb-5 pt-5 sm:px-5">
          <p className="tl-k tl-k-dim">status</p>
          <p className="tl-num text-[58px] leading-none text-accent sm:text-[72px]">500</p>
          <p className="tl-k mt-3 max-w-md leading-relaxed">
            The football data feed didn&apos;t respond. Check your connection and try again.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => retry()} className="tl-btn tl-btn-inv">
              Try again
            </button>
            <Link href="/" className="tl-btn">
              Go to scores
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
