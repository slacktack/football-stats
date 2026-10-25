"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

export type DateStripDay = {
  param: string;
  iso: string;
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
};

export function DateStrip({
  days,
  selected,
  prevParam,
  nextParam,
  filter,
}: {
  days: DateStripDay[];
  selected: string;
  prevParam: string;
  nextParam: string;
  filter?: string;
}) {
  const router = useRouter();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, [selected]);

  const suffix = filter && filter !== "all" ? `&filter=${filter}` : "";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/?date=${prevParam}${suffix}`}
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
        aria-label="Previous day"
      >
        <ChevronLeftIcon size={18} />
      </Link>

      <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
        {days.map((day) => {
          const active = day.param === selected;
          return (
            <Link
              key={day.param}
              ref={active ? activeRef : undefined}
              href={`/?date=${day.param}${suffix}`}
              aria-current={active ? "date" : undefined}
              className={`group relative flex min-w-[58px] flex-1 flex-col items-center justify-center rounded-xl border px-2 py-2 transition-all ${
                active
                  ? "border-accent bg-accent text-base shadow-[0_10px_30px_-12px_rgba(200,247,81,0.55)]"
                  : "border-transparent bg-white/[0.028] text-muted hover:border-white/10 hover:bg-white/[0.055] hover:text-ink"
              }`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  active ? "text-base/60" : "text-dim"
                }`}
              >
                {day.weekday}
              </span>
              <span className="font-display text-lg font-extrabold leading-tight num">{day.day}</span>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  active ? "text-base/60" : "text-dim"
                }`}
              >
                {day.month}
              </span>
              {day.isToday && !active && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href={`/?date=${nextParam}${suffix}`}
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
        aria-label="Next day"
      >
        <ChevronRightIcon size={18} />
      </Link>

      <label className="relative hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/[0.03] text-muted transition-colors hover:text-ink sm:flex">
        <CalendarIcon size={17} />
        <input
          type="date"
          value={days.find((day) => day.param === selected)?.iso ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return;
            router.push(`/?date=${value.replaceAll("-", "")}${suffix}`);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pick a date"
        />
      </label>
    </div>
  );
}
