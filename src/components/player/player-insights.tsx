import Link from "next/link";
import { parseRating, ratingTier, type RatingTier } from "@/lib/format";
import type { PlayerRecentMatch, PlayerResponse } from "@/lib/types";
import { Crest, RatingChip } from "../ui";
import { AsciiBar, K, Panel, Phos } from "../tl";

type PitchPosition = {
  strPos?: { label?: string };
  strPosShort?: { label?: string };
  occurences?: number;
  isMainPosition?: boolean;
  pitchPositionData?: { right?: number; top?: number; ratio?: number };
};

export function percentileTier(value: number): RatingTier {
  if (value >= 90) return "elite";
  if (value >= 70) return "great";
  if (value >= 45) return "good";
  if (value >= 25) return "average";
  return "poor";
}

function played(matches: PlayerRecentMatch[]) {
  return matches.filter((match) => match.playedInMatch !== false && !match.onBench && parseRating(match.ratingProps?.rating));
}

export function RatingForm({ matches, limit = 12 }: { matches?: PlayerRecentMatch[]; limit?: number }) {
  const rated = played(matches ?? []).slice(0, limit).reverse();
  if (rated.length < 2) return null;

  const ratings = rated.map((match) => parseRating(match.ratingProps?.rating) ?? 0);
  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  const best = Math.max(...ratings);
  const floor = 5;
  const ceil = 10;

  return (
    <Panel label="Rating form" aside={`last ${rated.length} appearances`}>
      <div className="mb-4 flex flex-wrap items-end justify-end gap-4">
        <div className="text-right">
          <K dim>Average</K>
          <RatingChip rating={avg} size="lg" className="mt-1" />
        </div>
        <div className="text-right">
          <K dim>Best</K>
          <RatingChip rating={best} size="lg" className="mt-1" />
        </div>
      </div>

      <div className="tl-frame relative mt-5 h-44 sm:h-52">
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-strong"
          style={{ bottom: `${((avg - floor) / (ceil - floor)) * 100}%` }}
          aria-hidden="true"
        >
        </div>
        <ol className="flex h-full items-end gap-1 sm:gap-1.5">
          {rated.map((match, index) => {
            const value = ratings[index];
            const height = Math.max(8, ((Math.max(floor, value) - floor) / (ceil - floor)) * 100);
            const tier = ratingTier(value);
            const teamScore = match.isHomeTeam ? match.homeScore : match.awayScore;
            const oppScore = match.isHomeTeam ? match.awayScore : match.homeScore;
            return (
              <li key={match.id} className={`h-full min-w-0 flex-1 flex-col justify-end ${index < rated.length - 7 ? "hidden sm:flex" : "flex"}`}>
                <Link
                  href={`/match/${match.id}`}
                  className="press group flex h-full flex-col items-center justify-end gap-1"
                  title={`${match.opponentTeamName} · ${teamScore ?? 0}-${oppScore ?? 0} · ${value.toFixed(1)}`}
                >
                  <span className="tl-num text-[11px] text-ink sm:text-[12.5px]">{value.toFixed(1)}</span>
                  <span
                    className="rating-bar relative w-full origin-bottom opacity-85 transition-opacity group-hover:opacity-100"
                    data-tier={tier}
                    style={{ height: `${height}%`, animation: `rise-in 520ms var(--ease-out) ${index * 35}ms both` }}
                  >
                    {match.playerOfTheMatch && (
                      <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[11px] leading-none text-on-accent" title="Player of the match">★</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="mt-2.5 flex gap-1 sm:gap-1.5">
        {rated.map((match, index) => {
          const teamScore = match.isHomeTeam ? match.homeScore : match.awayScore;
          const oppScore = match.isHomeTeam ? match.awayScore : match.homeScore;
          const result = teamScore == null || oppScore == null ? "" : teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";
          return (
            <li key={match.id} className={`min-w-0 flex-1 flex-col items-center gap-1 text-center ${index < rated.length - 7 ? "hidden sm:flex" : "flex"}`}>
              <Crest id={match.opponentTeamId} name={match.opponentTeamName} size={28} />
              <span className="w-full truncate text-[10.5px] font-semibold leading-tight text-ink" title={match.opponentTeamName}>
                {shortTeam(match.opponentTeamName)}
              </span>
              <span className="text-[10px] font-semibold leading-none text-dim num">
                {match.isHomeTeam ? "H" : "A"}
                {result && (
                  <>
                    {" "}
                    <span className={result === "W" ? "text-ink" : ""}>{teamScore}–{oppScore}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[10.5px] text-dim">
        {(
          [
            ["elite", "9+"],
            ["great", "8–8.9"],
            ["good", "7–7.9"],
            ["average", "6–6.9"],
            ["poor", "<6"],
          ] as const
        ).map(([tier, label]) => (
          <span key={tier} className="flex items-center gap-1.5">
            <span className="rating-bar h-2 w-2" data-tier={tier} />
            {label}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function FormSummary({ matches }: { matches?: PlayerRecentMatch[] }) {
  const list = (matches ?? []).filter((match) => match.playedInMatch !== false && !match.onBench).slice(0, 10);
  if (!list.length) return null;
  const goals = list.reduce((sum, match) => sum + (match.goals ?? 0), 0);
  const assists = list.reduce((sum, match) => sum + (match.assists ?? 0), 0);
  const minutes = list.reduce((sum, match) => sum + (match.minutesPlayed ?? 0), 0);
  const potm = list.filter((match) => match.playerOfTheMatch).length;
  const cards = list.reduce((sum, match) => sum + (match.yellowCards ?? 0) + (match.redCards ?? 0), 0);
  const items = [
    { label: "Goals", value: goals },
    { label: "Assists", value: assists },
    { label: "G+A / 90", value: minutes ? (((goals + assists) / minutes) * 90).toFixed(2) : "0" },
    { label: "Minutes", value: minutes.toLocaleString("en-GB") },
    { label: "POTM", value: potm },
    { label: "Cards", value: cards },
  ];

  return (
    <div>
      <Phos className="mb-2" />
      <p className="tl-k mb-2">Last {list.length} games</p>
      <div className="tl-kpis grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="tl-kpi">
            <p className="tl-kpi-v tl-num text-[22px]">{item.value}</p>
            <p className="tl-kpi-src">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TraitsRadar({ player }: { player: PlayerResponse }) {
  const items = player.traits?.items ?? [];
  if (items.length < 3) return null;

  const size = 220;
  const center = size / 2;
  const radius = 74;
  const angle = (index: number) => (Math.PI * 2 * index) / items.length - Math.PI / 2;
  const point = (index: number, scale: number) => {
    const a = angle(index);
    return [center + Math.cos(a) * radius * scale, center + Math.sin(a) * radius * scale] as const;
  };
  const shape = items
    .map((item, index) => point(index, Math.max(0.04, Math.min(1, item.value))).join(","))
    .join(" ");

  return (
    <Panel label="Playing style" aside={player.traits?.title}>
      <div className="mt-2 grid items-center gap-4 sm:grid-cols-[240px_minmax(0,1fr)]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="tl-frame mx-auto w-full max-w-[260px]"
          role="img"
          aria-label="Playing style radar"
        >
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              points={items.map((_, index) => point(index, ring).join(",")).join(" ")}
              fill="none"
              stroke="var(--tl-hair-soft)"
              strokeWidth="1"
            />
          ))}
          {items.map((item, index) => {
            const [x, y] = point(index, 1);
            return <line key={item.key} x1={center} y1={center} x2={x} y2={y} stroke="var(--tl-hair-soft)" strokeWidth="1" />;
          })}
          <polygon
            points={shape}
            fill="color-mix(in srgb, var(--color-accent) 22%, transparent)"
            stroke="var(--tl-led)"
            strokeWidth="2"
            strokeLinejoin="round"
            className="rise-in"
          />
          {items.map((item, index) => {
            const [x, y] = point(index, Math.max(0.04, Math.min(1, item.value)));
            return <circle key={item.key} cx={x} cy={y} r="3" fill="var(--tl-led)" />;
          })}
          {items.map((item, index) => {
            const [x, y] = point(index, 1.24);
            return (
              <text
                key={item.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9.5"
                fontWeight="700"
                fill="var(--color-muted)"
              >
                {Math.round(item.value * 100)}
              </text>
            );
          })}
        </svg>
        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {items.map((item) => {
            const pct = Math.round(Math.min(1, Math.max(0, item.value)) * 100);
            return (
              <div key={item.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11.5px] font-semibold text-muted">{item.title}</span>
                  <span className="shrink-0 tl-num text-[13px] text-ink">{pct}</span>
                </div>
                <span className="tl-meter mt-1.5 block">
                  <span
                    className="rating-bar bar-grow block h-full"
                    data-tier={percentileTier(pct)}
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function PositionMap({ player }: { player: PlayerResponse }) {
  const positions = ((player.positionDescription?.positions ?? []) as PitchPosition[]).filter(
    (item) => item.pitchPositionData?.top !== undefined,
  );
  if (!positions.length) return null;
  const total = positions.reduce((sum, item) => sum + (item.occurences ?? 0), 0) || 1;

  return (
    <Panel label="Positions">
      <div className="flex items-center gap-4">
        {/* Coordinate space: tl-frame (outline) only. No border, no padding. */}
        <div className="pitch-surface tl-frame relative aspect-[68/105] w-24 shrink-0 overflow-hidden">
          <svg viewBox="0 0 68 105" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <g stroke="var(--tl-hair)" strokeWidth="0.6" fill="none">
              <rect x="1" y="1" width="66" height="103" />
              <line x1="1" y1="52.5" x2="67" y2="52.5" />
              <circle cx="34" cy="52.5" r="8" />
              <rect x="14" y="1" width="40" height="16" />
              <rect x="14" y="88" width="40" height="16" />
            </g>
          </svg>
          {positions.map((item) => (
            <span
              key={item.strPos?.label}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-line text-[9px] font-bold leading-none ${
                item.isMainPosition ? "h-7 w-7 bg-accent text-on-accent" : "h-6 w-6 bg-base text-ink"
              }`}
              style={{
                left: `${(1 - (item.pitchPositionData?.right ?? 0.5)) * 100}%`,
                top: `${(item.pitchPositionData?.top ?? 0.5) * 100}%`,
              }}
            >
              {item.strPosShort?.label}
            </span>
          ))}
        </div>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {positions
            .slice()
            .sort((a, b) => (b.occurences ?? 0) - (a.occurences ?? 0))
            .map((item) => (
              <li key={item.strPos?.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-[11.5px] font-semibold ${item.isMainPosition ? "text-ink" : "text-muted"}`}>
                    {item.strPos?.label}
                  </span>
                  <span className="shrink-0 text-[11.5px] text-dim num">{item.occurences ?? 0} apps</span>
                </div>
                <AsciiBar
                  className="mt-1 text-[9.5px]"
                  blocks={10}
                  value={item.occurences ?? 0}
                  total={total}
                  tone={item.isMainPosition ? undefined : "ink"}
                />
              </li>
            ))}
        </ul>
      </div>
    </Panel>
  );
}

export function InjuryNotice({ player }: { player: PlayerResponse }) {
  const injury = player.injuryInformation;
  if (!injury?.injury) return null;
  return (
    <div className="card flex items-center gap-3 border-l-2 border-l-sky p-3.5">
      <span className="tl-num flex h-9 w-9 shrink-0 items-center justify-center border border-sky text-[15px] text-sky">+</span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-ink">{injury.injury.type ?? "Injured"}</p>
        <p className="text-[11.5px] text-dim">
          {injury.injury.description ?? "Unavailable"}
          {injury.expectedReturn ? ` · back ${injury.expectedReturn}` : ""}
        </p>
      </div>
    </div>
  );
}

const SHORT_NAMES: Record<string, string> = {
  "Atletico Madrid": "Atlético",
  "Manchester United": "Man Utd",
  "Manchester City": "Man City",
  "Paris Saint-Germain": "PSG",
  "Bayern München": "Bayern",
  "RB Leipzig": "Leipzig",
  "Borussia Dortmund": "Dortmund",
  "Tottenham Hotspur": "Spurs",
};

function shortTeam(name?: string) {
  if (!name) return "—";
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  const words = name.replace(/^(FC|AC|AS|SS|SL|SC|CF|RC|RCD|CD|UD|SD|Real|Club)\s+/i, "").split(" ");
  return words[0].length >= 4 ? words[0] : words.slice(0, 2).join(" ");
}
