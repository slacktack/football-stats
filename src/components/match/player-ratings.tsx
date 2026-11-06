"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ratingTier } from "@/lib/format";
import type { MatchPlayerRow } from "@/lib/match-players";
import { PlayerPhoto } from "../player-photo";
import { SortHeader, nextSort, type Sort } from "../sortable";
import { Crest, EmptyState, RatingChip } from "../ui";
import { Panel } from "../tl";

type SortKey =
  | "player"
  | "rating"
  | "minutes"
  | "goals"
  | "assists"
  | "xg"
  | "xa"
  | "shots"
  | "keyPasses"
  | "passPct"
  | "touches"
  | "defActions"
  | "duelsWon"
  | "distance";

const COLUMNS: { key: Exclude<SortKey, "player">; label: string; title: string; format?: (row: MatchPlayerRow) => string }[] = [
  { key: "minutes", label: "Min", title: "Minutes played" },
  { key: "goals", label: "G", title: "Goals" },
  { key: "assists", label: "A", title: "Assists" },
  { key: "xg", label: "xG", title: "Expected goals", format: (r) => r.xg.toFixed(2) },
  { key: "xa", label: "xA", title: "Expected assists", format: (r) => r.xa.toFixed(2) },
  { key: "shots", label: "Sh", title: "Total shots" },
  { key: "keyPasses", label: "KP", title: "Chances created" },
  { key: "passPct", label: "Pass", title: "Accurate passes", format: (r) => (r.passes === "—" ? "—" : `${r.passes} · ${r.passPct}%`) },
  { key: "touches", label: "Tch", title: "Touches" },
  { key: "defActions", label: "Def", title: "Defensive actions" },
  { key: "duelsWon", label: "Duels", title: "Duels won" },
  { key: "distance", label: "Km", title: "Distance covered", format: (r) => (r.distance ? (r.distance / 1000).toFixed(1) : "—") },
];

export function PlayerRatingsBoard({
  players,
  home,
  away,
}: {
  players: MatchPlayerRow[];
  home: { id: number; name: string };
  away: { id: number; name: string };
}) {
  const [side, setSide] = useState<"all" | "home" | "away">("all");
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "rating", dir: "desc" });
  const [open, setOpen] = useState<number | null>(null);

  const toggleSort = (key: SortKey) => setSort((current) => nextSort(current, key, ["player"]));

  const rows = useMemo(() => {
    const filtered = side === "all" ? players : players.filter((p) => p.side === side);
    const sign = sort.dir === "asc" ? 1 : -1;
    const byRating = (a: MatchPlayerRow, b: MatchPlayerRow) => (Number(b.rating) || 0) - (Number(a.rating) || 0);
    return [...filtered].sort((a, b) => {
      if (sort.key === "player") return sign * a.name.localeCompare(b.name, "en");
      const x = Number((a as Record<string, unknown>)[sort.key]);
      const y = Number((b as Record<string, unknown>)[sort.key]);
      const xMissing = !Number.isFinite(x) || x === 0;
      const yMissing = !Number.isFinite(y) || y === 0;
      if (xMissing && yMissing) return byRating(a, b);
      if (xMissing) return 1;
      if (yMissing) return -1;
      return sign * (x - y) || byRating(a, b);
    });
  }, [players, side, sort]);

  const avg = (s: "home" | "away") => {
    const rated = players.filter((p) => p.side === s && p.rating);
    return rated.length ? rated.reduce((t, p) => t + (p.rating ?? 0), 0) / rated.length : null;
  };

  if (!players.length) {
    return (
      <EmptyState
        title="Player ratings"
        description="Player ratings appear once the match kicks off."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { team: home, s: "home" as const },
          { team: away, s: "away" as const },
        ].map(({ team, s }) => {
          const best = players.find((p) => p.side === s);
          return (
            <div key={s} className="card flex items-center gap-2.5 p-3 sm:gap-3">
              <Crest id={team.id} name={team.name} size={40} className="hidden sm:inline-flex" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink">{team.name}</p>
                <p className="tl-k tl-k-dim hidden truncate sm:block">
                  Best <span className="text-muted">{best ? best.name.split(" ").slice(1).join(" ") || best.name : "—"}</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tl-k tl-k-dim hidden sm:block">Avg</p>
                <RatingChip rating={avg(s)} size="lg" />
              </div>
            </div>
          );
        })}
      </div>

      <Panel
        label="Ratings board"
        aside={`${rows.length} players · sort by header, open row for full sheet`}
        leds
      >
        <div className="mb-3 flex gap-1" role="tablist" aria-label="Filter team">
          {(["all", "home", "away"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={side === value}
              onClick={() => setSide(value)}
              className={`tl-btn tl-btn-sm ${side === value ? "tl-btn-inv" : ""}`}
            >
              {value === "all" ? "Both" : value === "home" ? home.name : away.name}
            </button>
          ))}
        </div>

        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[11.5px]">
            <thead>
              <tr>
                <SortHeader
                  label="Player"
                  title="Player name"
                  className="tl-sticky-cell sticky left-0 z-10 pl-2.5 text-left"
                  col="player"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortHeader label="Rating" title="FotMob rating" col="rating" sort={sort} onSort={toggleSort} />
                {COLUMNS.map((col) => (
                  <SortHeader key={col.key} label={col.label} title={col.title} col={col.key} sort={sort} onSort={toggleSort} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expanded = open === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      tabIndex={0}
                      role="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : row.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setOpen(expanded ? null : row.id);
                      }}
                      className={`cursor-pointer border-b border-line/30 outline-none transition-colors hover:bg-hover focus-visible:bg-hover ${
                        expanded ? "bg-card-2/60" : ""
                      }`}
                    >
                      <td className="tl-sticky-cell sticky left-0 z-10 px-2.5 py-2 sm:px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="tl-frame relative h-9 w-9 shrink-0 overflow-hidden bg-card-2">
                            <PlayerPhoto playerId={row.id} alt="" width={36} height={36} className="h-full w-full object-cover object-top" />
                          </span>
                          <div className="min-w-0 max-w-[132px] sm:max-w-[200px]">
                            <p className="flex items-center gap-1 truncate text-[12px] font-semibold text-ink">
                              <span className="truncate">{row.name}</span>
                              {row.isPotm && <span className="text-accent" title="Player of the match">★</span>}
                            </p>
                            <p className="flex items-center gap-1.5 text-[10.5px] text-dim">
                              <Crest id={row.teamId} name="" size={16} />
                              {row.position ?? "—"}
                              {!row.starter && <span className="tl-tag">SUB</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-1.5 py-2 text-center">
                        <RatingChip rating={row.rating} />
                      </td>
                      {COLUMNS.map((col) => {
                        const raw = row[col.key];
                        const text = col.format ? col.format(row) : String(raw || (col.key === "minutes" ? "0" : "—"));
                        const strong = (col.key === "goals" || col.key === "assists") && Number(raw) > 0;
                        return (
                          <td
                            key={col.key}
                            className={`whitespace-nowrap px-1.5 py-2 text-center num ${
                              sort.key === col.key ? "font-semibold text-ink" : strong ? "font-semibold text-accent" : "text-muted"
                            }`}
                          >
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                    {expanded && (
                      <tr className="border-b border-line/40 bg-card-2/60">
                        <td colSpan={COLUMNS.length + 2} className="p-0">
                          <PlayerSheet row={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <RatingLegend />
    </div>
  );
}

function PlayerSheet({ row }: { row: MatchPlayerRow }) {
  return (
    <div className="rise-in sticky left-0 max-w-[calc(100vw-2rem)] p-3 sm:p-4 md:max-w-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RatingChip rating={row.rating} size="xl" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink">{row.name}</p>
            <p className="tl-k tl-k-dim">
              {row.minutes}&apos; played{row.topSpeed ? ` · top speed ${row.topSpeed.toFixed(1)} km/h` : ""}
            </p>
          </div>
        </div>
        <Link href={`/player/${row.id}`} className="tl-btn shrink-0">
          Profile →
        </Link>
      </div>
      {row.rating && (
        <div className="tl-frame mb-4 h-1.5 bg-card-2/60">
          <div className="rating-bar bar-grow h-full" data-tier={ratingTier(row.rating)} style={{ width: `${(row.rating / 10) * 100}%` }} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {row.groups.map((group) => (
          <div key={group.title} className="surface p-3">
            <p className="tl-k mb-1.5">{group.title}</p>
            <dl className="divide-y divide-line/30">
              {group.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="text-[11.5px] text-muted">{stat.label}</dt>
                  <dd className="text-[12px] font-semibold text-ink num">{stat.display}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RatingLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[11px] text-dim">
      <span className="tl-k">Rating scale</span>
      {[
        [9.2, "9+ elite"],
        [8.2, "8–9 great"],
        [7.2, "7–8 good"],
        [6.4, "6–7 average"],
        [5.5, "<6 poor"],
      ].map(([value, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="rating-chip h-2.5 w-2.5" data-tier={ratingTier(value as number)} />
          {label}
        </span>
      ))}
    </div>
  );
}
