"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LeagueTableWrapper } from "@/lib/types";
import { AsciiBar, Chip } from "./tl";
import { Crest, FormPill } from "./ui";
import { SortHeader, nextSort, type Sort } from "./sortable";

/* Console register: the standing table is a readout, not a card grid.
   Row padding is load-bearing — the 3px qualification rule is pinned to the
   left edge of the rank cell and must register against the numerals. */

const LAMPS = {
  led: "var(--tl-led)",
  teal: "var(--tl-teal)",
  amber: "var(--tl-amber)",
  alert: "var(--tl-alert)",
  hair: "var(--tl-hair)",
} as const;

type Lamp = keyof typeof LAMPS;

type TableKey =
  | "idx"
  | "name"
  | "played"
  | "wins"
  | "draws"
  | "losses"
  | "goalConDiff"
  | "pts";

/** The feed hands back arbitrary brand hex; the instrument has four lamps.
    Bucket by hue so the rule and the legend always agree. */
function lampFor(hex?: string | null): Lamp {
  const raw = hex?.replace("#", "").trim();
  if (!raw) return "hair";
  const value =
    raw.length === 3
      ? raw
          .split("")
          .map((character) => character + character)
          .join("")
      : raw;
  if (value.length !== 6 || /[^0-9a-f]/i.test(value)) return "hair";

  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const peak = Math.max(red, green, blue);
  const floor = Math.min(red, green, blue);
  const delta = peak - floor;
  if (delta < 0.12) return "hair";

  const sector =
    peak === red ? (green - blue) / delta : peak === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  const hue = ((sector * 60) % 360 + 360) % 360;

  if (hue < 20 || hue >= 340) return "alert";
  if (hue < 70) return "amber";
  if (hue < 170) return "led";
  return "teal";
}

export function LeagueTable({
  wrapper,
  form,
  highlight = [],
  limit,
  showLegend = true,
  className = "",
}: {
  wrapper?: LeagueTableWrapper;
  form?: Record<number, number[]>;
  highlight?: (number | string)[];
  limit?: number;
  showLegend?: boolean;
  className?: string;
}) {
  const tableAll = wrapper?.data?.table?.all;
  const all = useMemo(() => tableAll ?? [], [tableAll]);
  const legend = wrapper?.data?.legend ?? [];
  const highlightSet = new Set(highlight.map(String));

  const [sort, setSort] = useState<Sort<TableKey>>({ key: "idx", dir: "asc" });
  const toggle = (key: TableKey) => setSort((current) => nextSort(current, key, ["idx", "name"]));

  const rows = useMemo(() => {
    const sign = sort.dir === "asc" ? 1 : -1;
    const ordered = [...all].sort((a, b) => {
      if (sort.key === "name") return sign * String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), "en");
      return sign * (Number(a[sort.key] ?? 0) - Number(b[sort.key] ?? 0));
    });
    return limit ? ordered.slice(0, limit) : ordered;
  }, [all, limit, sort]);

  if (!all.length) {
    return (
      <div className="card px-4 py-8 text-center text-[12.5px] text-dim">Table not available yet.</div>
    );
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <SortHeader
                label="#"
                title="Position"
                col="idx"
                sort={sort}
                onSort={toggle}
                className="w-9 py-2.5 pl-3 pr-1 text-right"
              />
              <SortHeader
                label="Team"
                title="Club"
                col="name"
                sort={sort}
                onSort={toggle}
                className="py-2.5 pr-2 text-left"
              />
              <SortHeader label="P" title="Played" col="played" sort={sort} onSort={toggle} className="w-8 py-2.5 text-right" />
              <SortHeader label="W" title="Won" col="wins" sort={sort} onSort={toggle} className="hidden w-8 py-2.5 text-right sm:table-cell" />
              <SortHeader label="D" title="Drawn" col="draws" sort={sort} onSort={toggle} className="hidden w-8 py-2.5 text-right sm:table-cell" />
              <SortHeader label="L" title="Lost" col="losses" sort={sort} onSort={toggle} className="hidden w-8 py-2.5 text-right sm:table-cell" />
              <SortHeader label="GD" title="Goal difference" col="goalConDiff" sort={sort} onSort={toggle} className="w-10 py-2.5 text-right" />
              <SortHeader label="Pts" title="Points" col="pts" sort={sort} onSort={toggle} className="w-10 py-2.5 text-right" />
              {form && <th scope="col" className="tl-th hidden w-[132px] py-2.5 pl-2 pr-3 text-left font-medium lg:table-cell">Form</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isHighlighted = highlightSet.has(String(row.id));
              return (
                <tr
                  key={row.id}
                  className={`group border-b border-line last:border-0 ${
                    isHighlighted ? "bg-accent/10" : "hover:bg-hover"
                  }`}
                >
                  <td className="relative py-2.5 pl-3 pr-1 text-right">
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: LAMPS[lampFor(row.qualColor)] }}
                    />
                    <span className={`tl-num text-[13px] ${isHighlighted ? "text-accent" : "text-dim"}`}>{row.idx}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <Link
                      href={`/team/${row.id}`}
                      className="flex items-center gap-2.5 text-[11.5px] font-semibold text-ink transition-colors hover:text-accent"
                    >
                      <Crest id={row.id} name={row.name} size={26} />
                      <span className="truncate">{row.shortName || row.name}</span>
                    </Link>
                  </td>
                  <td className="py-2.5 text-right text-[11.5px] text-muted num">{row.played}</td>
                  <td className="hidden py-2.5 text-right text-[11.5px] text-muted num sm:table-cell">{row.wins}</td>
                  <td className="hidden py-2.5 text-right text-[11.5px] text-muted num sm:table-cell">{row.draws}</td>
                  <td className="hidden py-2.5 text-right text-[11.5px] text-muted num sm:table-cell">{row.losses}</td>
                  <td className="py-2.5 text-right text-[11.5px] text-muted num">
                    {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                  </td>
                  <td className="py-2.5 text-right tl-num text-[14px] text-ink num">{row.pts}</td>
                  {form && (
                    <td className="hidden py-2 pl-2 pr-3 lg:table-cell">
                      <div className="flex gap-1">
                        {(form[row.id] ?? []).slice(0, 5).map((result, resultIndex) => (
                          <FormPill key={`${row.id}-${resultIndex}`} result={result} size={19} />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showLegend && legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-3 py-2.5">
          {legend.map((item) => (
            <span key={item.title} className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-dim">
              <span
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: LAMPS[lampFor(item.color)] }}
              />
              {item.title}
            </span>
          ))}
        </div>
      )}
      <span className="sr-only">
        {rows.length} teams.{" "}
        {sort.key === "idx"
          ? "Official table order: points, then goal difference."
          : `Re-sorted by ${sort.key}, ${sort.dir === "asc" ? "ascending" : "descending"}.`}
      </span>
    </div>
  );
}


export type XgRow = {
  id: number;
  name: string;
  shortName?: string;
  played?: number;
  pts?: number;
  xg?: number;
  xgConceded?: number;
  xPoints?: number;
  xPosition?: number;
  idx?: number;
  qualColor?: string;
};

type XgKey = "idx" | "name" | "xg" | "xgConceded" | "xPoints" | "pts" | "diff";

export function XgTable({ rows, highlight = [] }: { rows?: XgRow[]; highlight?: (number | string)[] }) {
  const data = useMemo(() => rows ?? [], [rows]);
  const [sort, setSort] = useState<Sort<XgKey>>({ key: "xPoints", dir: "desc" });
  const toggle = (key: XgKey) => setSort((current) => nextSort(current, key, ["idx", "name"]));

  const highlightSet = new Set(highlight.map(String));

  /* The # column is the expected-points standings, and stays that way however
     the register is re-sorted — otherwise the rank would lie. */
  const rankOf = useMemo(() => {
    const ranked = [...data].sort((a, b) => (b.xPoints ?? 0) - (a.xPoints ?? 0));
    return new Map(ranked.map((row, index) => [row.id, index + 1]));
  }, [data]);

  const sorted = useMemo(() => {
    const sign = sort.dir === "asc" ? 1 : -1;
    const value = (row: XgRow) =>
      sort.key === "diff" ? (row.pts ?? 0) - (row.xPoints ?? 0) : row[sort.key as keyof XgRow];
    return [...data].sort((a, b) => {
      if (sort.key === "name") return sign * String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), "en");
      if (sort.key === "idx") return sign * ((rankOf.get(a.id) ?? 99) - (rankOf.get(b.id) ?? 99));
      return sign * (Number(value(a) ?? 0) - Number(value(b) ?? 0));
    });
  }, [data, sort, rankOf]);

  const maxXg = useMemo(() => Math.max(...data.map((row) => row.xg ?? 0), 1), [data]);

  if (!data.length) {
    return <div className="card px-4 py-8 text-center text-[12.5px] text-dim">xG table not available.</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <SortHeader label="#" title="xG position" col="idx" sort={sort} onSort={toggle} className="w-9 py-2.5 pl-3 pr-1 text-right" />
              <SortHeader label="Team" title="Club" col="name" sort={sort} onSort={toggle} className="py-2.5 pr-2 text-left" />
              <SortHeader label="xG" title="Expected goals for" col="xg" sort={sort} onSort={toggle} className="w-24 py-2.5 text-right" />
              <SortHeader label="xGA" title="Expected goals against" col="xgConceded" sort={sort} onSort={toggle} className="w-12 py-2.5 text-right" />
              <SortHeader label="xPts" title="Expected points" col="xPoints" sort={sort} onSort={toggle} className="w-12 py-2.5 text-right" />
              <SortHeader label="Pts" title="Points" col="pts" sort={sort} onSort={toggle} className="w-10 py-2.5 text-right" />
              <SortHeader label="+/-" title="Points over or under expectation" col="diff" sort={sort} onSort={toggle} className="w-14 py-2.5 pr-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const diff = (row.pts ?? 0) - (row.xPoints ?? 0);
              const isHighlighted = highlightSet.has(String(row.id));
              return (
                <tr
                  key={row.id}
                  className={`border-b border-line last:border-0 ${
                    isHighlighted ? "bg-accent/10" : "hover:bg-hover"
                  }`}
                >
                  <td className="py-2.5 pl-3 pr-1 text-right tl-num text-[13px] text-dim num">
                    {rankOf.get(row.id) ?? "—"}
                  </td>
                  <td className="py-2.5 pr-2">
                    <Link
                      href={`/team/${row.id}`}
                      className="flex items-center gap-2.5 text-[11.5px] font-semibold text-ink transition-colors hover:text-accent"
                    >
                      <Crest id={row.id} name={row.name} size={26} />
                      <span className="truncate">{row.shortName || row.name}</span>
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <span className="hidden w-12 sm:block">
                        <AsciiBar value={row.xg ?? 0} total={maxXg} blocks={10} className="text-[10px]" />
                      </span>
                      <span className="text-[11.5px] font-semibold text-ink num">{(row.xg ?? 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-[11.5px] text-muted num">{(row.xgConceded ?? 0).toFixed(1)}</td>
                  <td className="py-2.5 text-right text-[12.5px] font-semibold text-ink num">
                    {(row.xPoints ?? 0).toFixed(1)}
                  </td>
                  <td className="py-2.5 text-right text-[11.5px] text-muted num">{row.pts ?? 0}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <Chip
                      tone={diff >= 0.5 ? "mint" : diff <= -0.5 ? "warn" : "plain"}
                      className="w-14 justify-center num"
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}
                    </Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-dim">
        Sorted by expected points. +/- shows points won above or below xPts.
      </p>
    </div>
  );
}
