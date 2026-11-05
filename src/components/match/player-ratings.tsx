"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { teamCrest } from "@/lib/assets";
import { ratingTier } from "@/lib/format";
import type { MatchPlayerRow } from "@/lib/match-players";
import { PlayerPhoto } from "../player-photo";
import { RatingChip } from "../ui";

type SortKey =
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

const COLUMNS: { key: SortKey; label: string; title: string; format?: (row: MatchPlayerRow) => string }[] = [
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
  const [sort, setSort] = useState<SortKey>("rating");
  const [open, setOpen] = useState<number | null>(null);

  const rows = useMemo(() => {
    const filtered = side === "all" ? players : players.filter((p) => p.side === side);
    return [...filtered].sort((a, b) => (Number(b[sort]) || 0) - (Number(a[sort]) || 0));
  }, [players, side, sort]);

  const avg = (s: "home" | "away") => {
    const rated = players.filter((p) => p.side === s && p.rating);
    return rated.length ? rated.reduce((t, p) => t + (p.rating ?? 0), 0) / rated.length : null;
  };

  if (!players.length) {
    return <div className="card px-4 py-10 text-center text-sm text-dim">Player ratings appear once the match kicks off.</div>;
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
            <div key={s} className="card flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
              <Image src={teamCrest(team.id)} alt="" width={36} height={36} className="hidden h-9 w-9 object-contain sm:block" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink sm:text-sm">{team.name}</p>
                <p className="hidden truncate text-[11px] text-dim sm:block">
                  Best: <span className="font-semibold text-muted">{best ? best.name.split(" ").slice(1).join(" ") || best.name : "—"}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="hidden text-[10px] font-bold text-dim sm:block">Avg</p>
                <RatingChip rating={avg(s)} size="lg" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-3 py-2.5 sm:px-4">
          <div className="flex rounded-lg bg-white/[0.04] p-0.5" role="tablist" aria-label="Filter team">
            {(["all", "home", "away"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={side === value}
                onClick={() => setSide(value)}
                className={`press rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  side === value ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
                }`}
              >
                {value === "all" ? "Both" : value === "home" ? home.name : away.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-dim">Tap a header to sort · tap a player for full stats</p>
        </div>

        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line/60 text-[11px] text-dim">
                <th className="sticky left-0 z-10 bg-card px-3 py-2.5 font-bold sm:px-4">Player</th>
                <SortHeader label="Rating" title="FotMob rating" active={sort === "rating"} onClick={() => setSort("rating")} />
                {COLUMNS.map((col) => (
                  <SortHeader key={col.key} label={col.label} title={col.title} active={sort === col.key} onClick={() => setSort(col.key)} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expanded = open === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => setOpen(expanded ? null : row.id)}
                      className={`cursor-pointer border-b border-line/30 transition-colors hover:bg-white/[0.03] ${expanded ? "bg-white/[0.035]" : ""}`}
                    >
                      <td className="sticky left-0 z-10 bg-card px-3 py-2 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-2 ring-inset ring-white/5">
                            <PlayerPhoto playerId={row.id} alt="" width={32} height={32} className="h-full w-full object-cover object-top" />
                          </span>
                          <div className="min-w-0 max-w-[132px] sm:max-w-[200px]">
                            <p className="flex items-center gap-1 truncate text-[13px] font-bold text-ink">
                              <span className="truncate">{row.name}</span>
                              {row.isPotm && <span className="text-accent" title="Player of the match">★</span>}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-dim">
                              <Image src={teamCrest(row.teamId)} alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                              {row.position ?? "—"}
                              {!row.starter && <span className="rounded bg-white/[0.06] px-1 text-[10px] font-semibold">SUB</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <RatingChip rating={row.rating} />
                      </td>
                      {COLUMNS.map((col) => {
                        const raw = row[col.key];
                        const text = col.format ? col.format(row) : String(raw || (col.key === "minutes" ? "0" : "—"));
                        const strong = (col.key === "goals" || col.key === "assists") && Number(raw) > 0;
                        return (
                          <td
                            key={col.key}
                            className={`whitespace-nowrap px-2 py-2 text-center num ${
                              sort === col.key ? "font-bold text-ink" : strong ? "font-bold text-accent" : "text-muted"
                            }`}
                          >
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                    {expanded && (
                      <tr className="border-b border-line/40 bg-white/[0.02]">
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
      </div>
      <RatingLegend />
    </div>
  );
}

function SortHeader({ label, title, active, onClick }: { label: string; title: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-2 py-2.5 text-center font-bold" title={title} aria-sort={active ? "descending" : "none"}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 transition-colors ${active ? "text-accent" : "hover:text-ink"}`}
      >
        {label}
        {active && <span aria-hidden="true">↓</span>}
      </button>
    </th>
  );
}

function PlayerSheet({ row }: { row: MatchPlayerRow }) {
  return (
    <div className="rise-in sticky left-0 max-w-[calc(100vw-2rem)] p-3 sm:p-4 md:max-w-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RatingChip rating={row.rating} size="xl" />
          <div>
            <p className="font-display text-base font-extrabold text-ink">{row.name}</p>
            <p className="text-xs text-dim">
              {row.minutes}&apos; played{row.topSpeed ? ` · top speed ${row.topSpeed.toFixed(1)} km/h` : ""}
            </p>
          </div>
        </div>
        <Link href={`/player/${row.id}`} className="btn-ghost press shrink-0 px-3 py-1.5 text-xs">
          Profile →
        </Link>
      </div>
      {row.rating && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="rating-bar bar-grow h-full rounded-full" data-tier={ratingTier(row.rating)} style={{ width: `${(row.rating / 10) * 100}%` }} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {row.groups.map((group) => (
          <div key={group.title} className="surface p-3">
            <p className="eyebrow mb-1.5">{group.title}</p>
            <dl className="divide-y divide-line/30">
              {group.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="text-xs text-muted">{stat.label}</dt>
                  <dd className="text-xs font-bold text-ink num">{stat.display}</dd>
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
      <span className="font-semibold">Rating scale</span>
      {[
        [9.2, "9+ elite"],
        [8.2, "8–9 great"],
        [7.2, "7–8 good"],
        [6.4, "6–7 average"],
        [5.5, "<6 poor"],
      ].map(([value, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="rating-chip h-2.5 w-2.5 rounded-full" data-tier={ratingTier(value as number)} />
          {label}
        </span>
      ))}
    </div>
  );
}
