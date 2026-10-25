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
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const active = activeRef.current;
    if (!track || !active) return;
    track.scrollLeft = active.offsetLeft - (track.clientWidth - active.clientWidth) / 2;
  }, [selected]);

  const suffix = filter && filter !== "all" ? `&filter=${filter}` : "";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href={`/?date=${prevParam}${suffix}`}
        className="hidden h-[58px] w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-card text-dim transition-colors hover:border-accent/30 hover:text-ink sm:flex"
        aria-label="Previous day"
      >
        <ChevronLeftIcon size={17} />
      </Link>

      <div ref={trackRef} className="no-scrollbar relative flex flex-1 gap-1.5 overflow-x-auto py-0.5">
        {days.map((day) => {
          const active = day.param === selected;
          return (
            <Link
              key={day.param}
              ref={active ? activeRef : undefined}
              href={`/?date=${day.param}${suffix}`}
              aria-current={active ? "date" : undefined}
              className={`group relative flex h-[58px] min-w-[58px] flex-1 flex-col items-center justify-center rounded-xl border px-2 transition-all duration-200 ${
                active
                  ? "border-accent bg-accent text-on-accent shadow-lg shadow-accent/25"
                  : "border-line/60 bg-card text-muted hover:-translate-y-0.5 hover:border-accent/25 hover:text-ink"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                  active ? "text-on-accent/55" : "text-dim"
                }`}
              >
                {day.weekday}
              </span>
              <span className="font-display text-[19px] font-extrabold leading-tight num">{day.day}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  active ? "text-on-accent/55" : "text-dim"
                }`}
              >
                {day.month}
              </span>
              {day.isToday && !active && (
                <span className="absolute bottom-1 h-[3px] w-[3px] rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href={`/?date=${nextParam}${suffix}`}
        className="hidden h-[58px] w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-card text-dim transition-colors hover:border-accent/30 hover:text-ink sm:flex"
        aria-label="Next day"
      >
        <ChevronRightIcon size={17} />
      </Link>

      <label className="relative flex h-[58px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line/70 bg-card text-muted transition-colors hover:border-accent/30 hover:text-ink sm:w-[58px]">
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
