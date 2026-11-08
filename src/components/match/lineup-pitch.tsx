"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PlayerPhoto } from "@/components/player-photo";
import { GoalIcon, SubIcon } from "../icons";
import { RatingChip } from "../ui";
import { TermBar } from "../tl";
import { ratingTier } from "@/lib/format";
import type { MatchPlayerRow } from "@/lib/match-players";

export type PitchPlayer = {
  id: number;
  name: string;
  side: "home" | "away";
  shirt?: string;
  posId?: number;
  rating?: number | null;
  x: number;
  y: number;
  subbed?: boolean;
  age?: number | null;
  country?: string;
  position?: string;
};

export type Tally = Map<number, { goals: number; assists: number }>;

export function TallyGlyph({
  id,
  tally,
  inline = false,
}: {
  id: number;
  tally: Tally;
  inline?: boolean;
}) {
  const row = tally.get(id);
  if (!row) return null;
  return (
    <span className={inline ? "flex shrink-0 gap-px" : "absolute -bottom-2 -left-1 z-10 flex gap-px"}>
      {row.goals ? (
        <b className="tl-glyph tl-glyph-goal" title={`${row.goals} goal${row.goals > 1 ? "s" : ""}`}>
          <GoalIcon size={8} />
          <span className="tl-num">{row.goals}</span>
        </b>
      ) : null}
      {row.assists ? (
        <b className="tl-glyph tl-glyph-assist" title={`${row.assists} assist${row.assists > 1 ? "s" : ""}`}>
          A<span className="tl-num">{row.assists}</span>
        </b>
      ) : null}
    </span>
  );
}

const POSITION_SHORT: Record<string, string> = {
  GK: "GK",
  DEF: "DEF",
  MID: "MID",
  FWD: "ATK",
};

export function LineupPitch({
  players,
  tally,
  stats,
  homeColor,
  awayColor,
  homeFont,
  awayFont,
}: {
  players: PitchPlayer[];
  tally: Tally;
  stats: MatchPlayerRow[];
  homeColor: string;
  awayColor: string;
  homeFont: string;
  awayFont: string;
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  const statsById = useMemo(() => new Map(stats.map((row) => [row.id, row])), [stats]);
  const open = openId == null ? null : players.find((player) => player.id === openId) ?? null;

  const step = (delta: number) => {
    if (!players.length) return;
    setOpenId((current) => {
      const index = players.findIndex((player) => player.id === current);
      const next = index === -1 ? 0 : (index + delta + players.length) % players.length;
      return players[next].id;
    });
  };

  useEffect(() => {
    if (openId == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, players]);

  return (
    <>
      <div className="tl-frame pitch-surface relative aspect-[68/118] w-full overflow-hidden sm:aspect-[105/68]">
        <div className="absolute inset-0 hidden opacity-70 sm:block">
          <svg viewBox="0 0 105 68" className="h-full w-full" aria-hidden="true">
            <g stroke="var(--tl-hair)" strokeWidth="0.35" fill="none">
              <rect x="1" y="1" width="103" height="66" />
              <line x1="52.5" y1="1" x2="52.5" y2="67" />
              <circle cx="52.5" cy="34" r="9.15" />
              <rect x="1" y="13.84" width="16" height="40.32" />
              <rect x="1" y="24.84" width="7" height="18.32" />
              <rect x="88" y="13.84" width="16" height="40.32" />
              <rect x="97" y="24.84" width="7" height="18.32" />
            </g>
          </svg>
        </div>
        <div className="absolute inset-0 opacity-70 sm:hidden">
          <svg viewBox="0 0 68 118" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
            <g stroke="var(--tl-hair)" strokeWidth="0.35" fill="none">
              <rect x="1" y="1" width="66" height="116" />
              <line x1="1" y1="59" x2="67" y2="59" />
              <circle cx="34" cy="59" r="9.15" />
              <rect x="13.84" y="1" width="40.32" height="16" />
              <rect x="24.84" y="1" width="18.32" height="7" />
              <rect x="13.84" y="101" width="40.32" height="16" />
              <rect x="24.84" y="110" width="18.32" height="7" />
            </g>
          </svg>
        </div>
        {players.map((player) => {
          const along = 0.03 + player.x * 0.46;
          const across = player.y;
          const isHome = player.side === "home";
          const color = isHome ? homeColor : awayColor;
          const font = isHome ? homeFont : awayFont;
          const pos = {
            "--dl": `${(isHome ? along : 1 - along) * 100}%`,
            "--dt": `${(isHome ? across : 1 - across) * 100}%`,
            "--ml": `${(isHome ? across : 1 - across) * 100}%`,
            "--mt": `${(isHome ? 1 - along : along) * 100}%`,
          } as CSSProperties;
          return (
            <button
              key={`${player.side}-${player.id}`}
              type="button"
              onClick={() => setOpenId(player.id)}
              className="lineup-marker group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1"
              style={pos}
              title={`${player.name}${player.rating ? ` · ${player.rating}` : ""}`}
            >
              <span className="relative inline-flex">
                <span
                  className="relative flex h-7 w-7 items-center justify-center overflow-hidden bg-card-2 transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110 sm:h-10 sm:w-10"
                  style={{ boxShadow: `inset 0 0 0 2px ${color}` }}
                >
                  <PlayerPhoto
                    playerId={player.id}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover object-top"
                  />
                </span>
                <span
                  className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center text-[10px] font-bold sm:h-[18px] sm:w-[18px] sm:text-[11px]"
                  style={{ backgroundColor: color, color: font }}
                >
                  {player.shirt ?? player.posId}
                </span>
                {player.rating ? (
                  <RatingChip
                    rating={player.rating}
                    size="sm"
                    className="absolute -right-4 -top-2 sm:-right-5"
                  />
                ) : null}
                {player.subbed ? (
                  <span
                    className="tl-frame absolute -left-3 -top-1.5 flex h-4 w-4 items-center justify-center bg-card-2 text-mint"
                    title="Substituted"
                  >
                    <SubIcon size={10} />
                  </span>
                ) : null}
                <TallyGlyph id={player.id} tally={tally} />
              </span>
              <span className="max-w-[76px] truncate bg-card-2/60 px-0.5 text-[11px] font-semibold text-ink sm:max-w-[100px] sm:text-[12px]">
                {player.name.split(" ").slice(-1)[0]}
              </span>
            </button>
          );
        })}
      </div>

      {open ? (
        <PlayerSheetModal
          player={open}
          row={statsById.get(open.id)}
          all={stats}
          color={open.side === "home" ? homeColor : awayColor}
          onClose={() => setOpenId(null)}
          onStep={step}
        />
      ) : null}
    </>
  );
}

const METRICS: {
  label: string;
  get: (row: MatchPlayerRow) => number;
  fmt: (value: number) => string;
}[] = [
  { label: "rating", get: (r) => r.rating ?? 0, fmt: (v) => v.toFixed(1) },
  { label: "goals", get: (r) => r.goals, fmt: (v) => `${v}` },
  { label: "assists", get: (r) => r.assists, fmt: (v) => `${v}` },
  { label: "expected goals (xG)", get: (r) => r.xg, fmt: (v) => v.toFixed(2) },
  { label: "shots", get: (r) => r.shots, fmt: (v) => `${v}` },
  { label: "chances created", get: (r) => r.keyPasses, fmt: (v) => `${v}` },
  { label: "touches", get: (r) => r.touches, fmt: (v) => `${v}` },
  { label: "pass accuracy", get: (r) => (r.passes === "—" ? 0 : r.passPct), fmt: (v) => `${v}%` },
  { label: "defensive actions", get: (r) => r.defActions, fmt: (v) => `${v}` },
  { label: "duels won", get: (r) => r.duelsWon, fmt: (v) => `${v}` },
  { label: "distance covered", get: (r) => r.distance, fmt: (v) => `${(v / 1000).toFixed(1)} km` },
  { label: "top speed", get: (r) => r.topSpeed, fmt: (v) => `${v.toFixed(1)} km/h` },
];

function highlightsFor(row: MatchPlayerRow, all: MatchPlayerRow[]): string[] {
  if (all.length < 2) return [];
  const out: string[] = [];
  for (const metric of METRICS) {
    const value = metric.get(row);
    if (!value) continue;
    let max = 0;
    let holders = 0;
    for (const other of all) {
      const candidate = metric.get(other);
      if (candidate > max) {
        max = candidate;
        holders = 1;
      } else if (candidate === max) {
        holders += 1;
      }
    }
    if (value === max && holders === 1) {
      out.push(`Highest ${metric.label} in the match (${metric.fmt(value)})`);
    }
    if (out.length >= 3) break;
  }
  return out;
}

function PlayerSheetModal({
  player,
  row,
  all,
  color,
  onClose,
  onStep,
}: {
  player: PitchPlayer;
  row?: MatchPlayerRow;
  all: MatchPlayerRow[];
  color: string;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [player.id]);

  const highlights = row ? highlightsFor(row, all) : [];
  const stats: { label: string; value: string; tone?: "accent" | "teal" }[] = row
    ? [
        { label: "Minutes", value: `${row.minutes}'`, tone: "teal" },
        { label: "Goals", value: `${row.goals}`, tone: row.goals ? "accent" : undefined },
        { label: "Assists", value: `${row.assists}`, tone: row.assists ? "accent" : undefined },
        { label: "Expected goals (xG)", value: row.xg.toFixed(2) },
        { label: "Expected assists (xA)", value: row.xa.toFixed(2) },
        { label: "xG + xA", value: (row.xg + row.xa).toFixed(2) },
        { label: "Top speed", value: row.topSpeed ? `${row.topSpeed.toFixed(1)} km/h` : "—" },
        { label: "Distance covered", value: row.distance ? `${(row.distance / 1000).toFixed(1)} km` : "—" },
        { label: "Accurate passes", value: row.passes === "—" ? "—" : `${row.passes} (${row.passPct}%)` },
        { label: "Chances created", value: `${row.keyPasses}`, tone: row.keyPasses ? "accent" : undefined },
        { label: "Shots", value: `${row.shots}` },
        { label: "Touches", value: `${row.touches}` },
        { label: "Defensive actions", value: `${row.defActions}` },
        { label: "Duels won", value: `${row.duelsWon}` },
      ]
    : [];

  return (
    <div
      className="overlay-in fixed inset-0 z-[100] flex items-end justify-center bg-[var(--tl-scrim)] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} — match stats`}
        tabIndex={-1}
        className="tl-term-out tl-sheet dialog-in thin-scrollbar max-h-[92dvh] w-full max-w-[720px] overflow-y-auto outline-none"
      >
        <TermBar
          path={`player sheet // ${player.name}`}
          dim={row ? `${row.minutes}' on pitch` : "pre-kickoff"}
        />

        <div
          className="relative px-4 pb-5 pt-4 sm:px-6"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${color} 24%, transparent), transparent)`,
          }}
        >
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous player"
            className="tl-btn absolute left-2 top-3 flex h-8 w-8 items-center justify-center px-0 text-[14px]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="Next player"
            className="tl-btn absolute right-2 top-3 flex h-8 w-8 items-center justify-center px-0 text-[14px]"
          >
            ›
          </button>

          <div className="flex flex-col items-center gap-2 pt-6 text-center sm:pt-4">
            <span className="relative inline-flex">
              <span
                className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-card-2"
                style={{ boxShadow: `0 0 0 2px ${color}, 0 0 28px color-mix(in srgb, ${color} 45%, transparent)` }}
              >
                <PlayerPhoto
                  playerId={player.id}
                  alt=""
                  width={72}
                  height={72}
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <RatingChip rating={player.rating ?? row?.rating ?? null} size="sm" className="absolute -right-3 -top-1" />
            </span>
            <p className="text-[18px] font-bold tracking-tight text-ink">{player.name}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center">
              {[
                ["Position", `#${player.shirt ?? "—"} ${POSITION_SHORT[player.position ?? ""] ?? player.position ?? "—"}`],
                ["Country", player.country ?? "—"],
                ["Age", player.age != null ? `${player.age}` : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[13.5px] font-bold text-ink">{value}</p>
                  <p className="tl-k tl-k-dim">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {row ? (
          <div className="space-y-4 px-4 pb-4 sm:px-6">
            {row.rating ? (
              <div className="tl-frame h-1.5 bg-card-2/60">
                <div
                  className="rating-bar bar-grow h-full"
                  data-tier={ratingTier(row.rating)}
                  style={{ width: `${(row.rating / 10) * 100}%` }}
                />
              </div>
            ) : null}

            {highlights.length ? (
              <div className="tl-frame border-l-[3px] border-l-[var(--tl-led)] bg-[var(--tl-mint-2)] p-3">
                <p className="tl-k mb-1.5 text-[var(--tl-mint-ink)]">Highlights</p>
                <ul className="space-y-1">
                  {highlights.map((line) => (
                    <li key={line} className="text-[13.5px] font-semibold text-ink">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="tl-k mb-2">Top stats</p>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between gap-3 border-b border-line/40 py-2"
                  >
                    <dt className="text-[12px] font-medium text-ink/70">{stat.label}</dt>
                    <dd
                      className={`tl-num text-[14px] font-bold ${
                        stat.tone === "accent"
                          ? "text-accent"
                          : stat.tone === "teal"
                            ? "text-[var(--tl-teal)]"
                            : "text-ink"
                      }`}
                    >
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <p className="px-4 pb-4 text-[12px] text-dim sm:px-6">
            Match telemetry goes live at kickoff — stats will stream into this sheet.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6">
          <Link
            href={`/player/${player.id}`}
            className="tl-btn tl-btn-sm inline-flex items-center gap-1.5"
          >
            <span className="tl-acc" aria-hidden="true">
              &gt;
            </span>
            Player profile
          </Link>
          <button type="button" onClick={onClose} className="tl-btn tl-btn-sm tl-btn-inv">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
