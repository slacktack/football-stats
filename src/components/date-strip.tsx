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
    <div className="flex items-stretch gap-1.5 sm:gap-2">
      <Link
        href={`/?date=${prevParam}${suffix}`}
        className="hidden h-[62px] w-9 shrink-0 items-center justify-center border border-line bg-card text-dim transition-colors hover:border-ink hover:text-ink sm:flex"
        aria-label="Previous day"
      >
        <ChevronLeftIcon size={16} />
      </Link>

      <div
        ref={trackRef}
        className="no-scrollbar relative flex flex-1 gap-1.5 overflow-x-auto py-0.5"
        role="group"
        aria-label="Choose a date"
      >
        {days.map((day) => {
          const active = day.param === selected;
          const past = day.param < selected;
          const hue = active ? "led" : past ? "teal" : "amber";
          return (
            <Link
              key={day.param}
              ref={active ? activeRef : undefined}
              href={`/?date=${day.param}${suffix}`}
              aria-current={active ? "date" : undefined}
              className={`tl-hue-${hue} group relative flex h-[62px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 border px-2 transition-colors ${
                active
                  ? "border-ink bg-ink text-canvas"
                  : "border-line bg-card text-muted hover:border-[var(--tl-hue)] hover:text-ink"
              }`}
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--tl-hue)] transition-transform duration-300 group-hover:scale-x-100"
                style={{ transform: active ? "scaleX(1)" : undefined }}
                aria-hidden="true"
              />
              <span
                className={`tl-k ${active ? "opacity-55" : "text-[var(--tl-hue-ink)]"}`}
              >
                {day.weekday}
              </span>
              <span className="tl-num text-[19px] font-bold leading-none">{day.day}</span>
              <span
                className={`tl-k ${active ? "opacity-55" : "tl-k-dim"}`}
              >
                {day.month}
              </span>
              {day.isToday && !active && (
                <span className="tl-led absolute bottom-1.5 h-[5px] w-[5px]" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href={`/?date=${nextParam}${suffix}`}
        className="hidden h-[62px] w-9 shrink-0 items-center justify-center border border-line bg-card text-dim transition-colors hover:border-ink hover:text-ink sm:flex"
        aria-label="Next day"
      >
        <ChevronRightIcon size={16} />
      </Link>

      <label className="relative flex h-[62px] w-[52px] shrink-0 cursor-pointer items-center justify-center border border-line bg-card text-muted transition-colors hover:border-ink hover:text-ink sm:w-[56px]">
        <CalendarIcon size={16} />
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
