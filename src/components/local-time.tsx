"use client";

import { useSyncExternalStore } from "react";

type Kind = "time" | "short" | "monthDay" | "dayTime";

const OPTIONS: Record<Kind, Intl.DateTimeFormatOptions> = {
  time: { hour: "2-digit", minute: "2-digit", hour12: false },
  short: { weekday: "short", day: "numeric", month: "short" },
  monthDay: { day: "numeric", month: "short" },
  dayTime: { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false },
};

function format(value: string, kind: Kind, timeZone?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const text = new Intl.DateTimeFormat("en-GB", { ...OPTIONS[kind], timeZone }).format(date);
  return kind === "dayTime" ? text.replace(",", "").replace(/(\d{2}:\d{2})$/, "· $1") : text;
}

const noop = () => () => {};

export function LocalTime({ value, kind = "time" }: { value: string; kind?: Kind }) {
  const text = useSyncExternalStore(
    noop,
    () => format(value, kind),
    () => format(value, kind, "UTC"),
  );
  return (
    <time dateTime={value} suppressHydrationWarning>
      {text}
    </time>
  );
}
