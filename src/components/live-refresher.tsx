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
    <div className="flex items-center gap-2.5">
      <LiveDot />
      <span className="tl-k hidden text-live sm:inline">Auto sync</span>
      <span className="tl-k text-live sm:hidden">Auto</span>
      <span className="h-3 w-px bg-line" aria-hidden="true" />
      <button
        type="button"
        onClick={() => {
          setSecondsAgo(0);
          startTransition(() => router.refresh());
        }}
        className="tl-k flex items-center gap-1.5 text-live transition-opacity hover:opacity-70"
        aria-label="Refresh scores"
      >
        <RefreshIcon size={11} className={isPending ? "animate-spin" : ""} />
        <span className="tl-num text-[11.5px]">
          {secondsAgo < 2 ? "NOW" : `${secondsAgo}S`}
        </span>
      </button>
    </div>
  );
}
