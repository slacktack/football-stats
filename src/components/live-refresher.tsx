"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LiveDot } from "./ui";
import { RefreshIcon } from "./icons";

export function LiveRefresher({
  active,
  interval = 25_000,
}: {
  active: boolean;
  interval?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!active) return;
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setSecondsAgo(0);
        startTransition(() => router.refresh());
      }
    }, interval);
    const counter = window.setInterval(() => setSecondsAgo((value) => value + 1), 1000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(counter);
    };
  }, [active, interval, router]);

  if (!active) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-live/20 bg-live/[0.07] px-3 py-1.5 text-[11px] font-semibold text-live">
      <LiveDot />
      <span className="hidden sm:inline">Live · auto-updating</span>
      <span className="sm:hidden">Live</span>
      <span className="h-3 w-px bg-live/20" />
      <button
        type="button"
        onClick={() => {
          setSecondsAgo(0);
          startTransition(() => router.refresh());
        }}
        className="flex items-center gap-1 text-[10px] font-medium text-live/80 transition-colors hover:text-live"
        aria-label="Refresh scores"
      >
        <RefreshIcon size={12} className={isPending ? "animate-spin" : ""} />
        {secondsAgo < 2 ? "now" : `${secondsAgo}s`}
      </button>
    </div>
  );
}
