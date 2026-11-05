import { LocalTime } from "@/components/local-time";
import Link from "next/link";
import {
  compactNumber,
  ordinal,
  formatMarketValue,
  formatShortDate,
} from "@/lib/format";
import type {
  PlayerCareerEntry,
  PlayerDeepStat,
  PlayerNextMatch,
  PlayerRecentMatch,
  PlayerResponse,
  PlayerShot,
  PlayerStatsSection,
} from "@/lib/types";
import { TrophyIcon } from "../icons";
import { Crest, FormPill, RatingChip, SectionHeading } from "../ui";
import { percentileTier } from "./player-insights";

export function PlayerStatStrip({ player }: { player: PlayerResponse }) {
  const stats = player.mainLeague?.stats ?? [];
  if (!stats.length) return null;

  return (
    <div className="card grid grid-cols-4 divide-x divide-y divide-line/50 overflow-hidden sm:grid-cols-8 sm:divide-y-0">
      {stats.map((stat) => {
        const isRating = stat.localizedTitleId === "rating";
        return (
          <div key={stat.title} className="flex flex-col items-center justify-between px-1.5 py-3 text-center">
            <p className="flex min-h-[24px] items-center justify-center text-[11px] font-semibold uppercase leading-tight tracking-[0.06em] text-dim">
              {stat.title}
            </p>
            {isRating ? (
              <RatingChip rating={stat.value} size="md" className="mt-1.5" />
            ) : (
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink num">
                {stat.value}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TopStatCards({ section }: { section?: PlayerStatsSection }) {
  if (!section?.items?.length) return null;
  return (
    <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {section.items.map((item) => (
        <div key={item.localizedTitleId ?? item.title} className="card p-3.5">
          <p className="text-[11px] font-semibold text-dim">
            {item.title}
          </p>
          {item.localizedTitleId === "rating" ? (
            <RatingChip rating={item.statValue} size="lg" className="mt-1.5" />
          ) : (
            <p className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink num">
              {formatStatValue(item)}
            </p>
          )}
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="rating-bar bar-grow block h-full rounded-full"
              data-tier={percentileTier(item.percentileRank ?? 0)}
              style={{ width: `${Math.min(100, Math.max(2, item.percentileRank ?? 0))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-dim">
            {ordinal(Math.round(item.percentileRank ?? 0))} percentile
          </p>
        </div>
      ))}
    </div>
  );
}

export function ShotMapCard({ shots }: { shots?: PlayerShot[] }) {
  if (!shots?.length) return null;

  const goals = shots.filter((shot) => shot.eventType === "Goal").length;
  const onTarget = shots.filter((shot) => shot.isOnTarget).length;
  const xg = shots.reduce((sum, shot) => sum + (shot.expectedGoals ?? 0), 0);
  const conversion = shots.length ? Math.round((goals / shots.length) * 100) : 0;
  const accuracy = shots.length ? Math.round((onTarget / shots.length) * 100) : 0;
  const byType = new Map<string, number>();
  for (const shot of shots) {
    const key = shot.shotType ?? "Other";
    byType.set(key, (byType.get(key) ?? 0) + 1);
  }
  const types = Array.from(byType.entries()).sort((a, b) => b[1] - a[1]);
  const maxType = types[0]?.[1] ?? 1;

  return (
    <div className="card overflow-hidden p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Shot map</p>
          <p className="mt-0.5 text-[11px] text-dim">
            {shots.length} shots · {goals} goals · {onTarget} on target · {xg.toFixed(2)} xG
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-dim">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> Goal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> On target
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-white/25" /> Off target
          </span>
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="overflow-hidden rounded-xl border border-line/60 bg-[#07130c]">
          <svg viewBox="0 0 105 68" className="block w-full" role="img" aria-label="Player shot map">
            <defs>
              <linearGradient id="pitch-glow" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0a1f14" />
                <stop offset="100%" stopColor="#07130c" />
              </linearGradient>
            </defs>
            <rect width="105" height="68" fill="url(#pitch-glow)" />
            <g stroke="rgba(255,255,255,0.13)" strokeWidth="0.35" fill="none">
              <rect x="0.5" y="0.5" width="104" height="67" rx="1" />
              <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" />
              <circle cx="52.5" cy="34" r="9.15" />
              <rect x="88.5" y="13.84" width="16" height="40.32" />
              <rect x="97.5" y="24.84" width="7" height="18.32" />
              <rect x="104.2" y="30.34" width="0.8" height="7.32" />
              <path d="M88.5 20.5 A9.15 9.15 0 0 0 88.5 47.5" />
            </g>
            <circle cx="52.5" cy="34" r="0.8" fill="rgba(255,255,255,0.35)" />
            {shots.map((shot) => {
              const isGoal = shot.eventType === "Goal";
              const fill = isGoal ? "var(--color-accent)" : shot.isOnTarget ? "#38bdf8" : "rgba(255,255,255,0.32)";
              return (
                <g key={shot.id}>
                  <circle
                    cx={Math.min(104, Math.max(1, shot.x))}
                    cy={Math.min(67, Math.max(1, shot.y))}
                    r={isGoal ? 2.1 : 1.5}
                    fill={fill}
                    fillOpacity={isGoal ? 1 : 0.9}
                    stroke={isGoal ? "#0a1f14" : "none"}
                    strokeWidth="0.4"
                  >
                    <title>
                      {`${shot.min ? `${shot.min}' · ` : ""}${shot.eventType ?? "Shot"}${
                        shot.expectedGoals ? ` · ${shot.expectedGoals.toFixed(2)} xG` : ""
                      }`}
                    </title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-line/60 bg-white/[0.02] p-3">
            <p className="eyebrow mb-2">Efficiency</p>
            <div className="grid grid-cols-2 gap-2">
              <ShotMetric label="Conversion" value={`${conversion}%`} />
              <ShotMetric label="Accuracy" value={`${accuracy}%`} />
              <ShotMetric label="xG / shot" value={(xg / shots.length).toFixed(2)} />
              <ShotMetric label="Goals" value={String(goals)} />
            </div>
          </div>
          <div className="rounded-xl border border-line/60 bg-white/[0.02] p-3">
            <p className="eyebrow mb-2">Shot types</p>
            <div className="space-y-2">
              {types.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-muted">{formatShotType(type)}</span>
                    <span className="text-[11px] font-bold text-ink num">{count}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.055]">
                    <span
                      className="block h-full rounded-full bg-accent/70"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-dim">{label}</p>
      <p className="text-sm font-bold text-ink num">{value}</p>
    </div>
  );
}

function formatShotType(value: string) {
  if (value === "RightFoot") return "Right foot";
  if (value === "LeftFoot") return "Left foot";
  if (value === "Header") return "Header";
  return value;
}

export function DeepStats({
  groups,
  metric,
}: {
  groups?: PlayerStatsSection[];
  metric: "total" | "per90";
}) {
  const visible = (groups ?? []).filter((group) => group.items?.length);
  if (!visible.length) {
    return <div className="card px-4 py-8 text-center text-sm text-dim">No season stats available.</div>;
  }

  return (
    <div className="stagger grid gap-3 lg:grid-cols-2">
      {visible.map((group) => (
        <div key={group.localizedTitleId ?? group.title} className="card p-4">
          <p className="text-xs font-bold text-accent">
            {group.title ?? group.localizedTitleId}
          </p>
          <div className="mt-2 divide-y divide-line/30">
            {(group.items ?? []).map((item) => {
              const percentile =
                metric === "per90"
                  ? item.percentileRankPer90 ?? item.percentileRank ?? 0
                  : item.percentileRank ?? 0;
              const value =
                metric === "per90"
                  ? `${item.per90 !== undefined ? item.per90.toFixed(2) : "—"}`
                  : formatStatValue(item);
              return (
                <div key={item.localizedTitleId ?? item.title} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-semibold text-muted">{item.title}</span>
                    <span className="shrink-0 font-display text-sm font-extrabold text-ink num">
                      {value}
                      {metric === "per90" && (
                        <span className="ml-0.5 text-[11px] font-medium text-dim">/90</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <span
                        className="rating-bar bar-grow block h-full rounded-full"
                        data-tier={percentileTier(percentile)}
                        style={{ width: `${Math.min(100, Math.max(2, percentile))}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[11px] font-bold text-muted num">
                      {ordinal(Math.round(percentile))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerMatchList({
  matches,
  empty = "No matches played yet.",
}: {
  matches?: PlayerRecentMatch[];
  empty?: string;
}) {
  if (!matches?.length) {
    return <div className="card px-4 py-8 text-center text-sm text-dim">{empty}</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-line/40">
        {matches.map((match) => (
          <PlayerMatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function PlayerMatchRow({ match }: { match: PlayerRecentMatch }) {
  const teamScore = match.isHomeTeam ? match.homeScore : match.awayScore;
  const opponentScore = match.isHomeTeam ? match.awayScore : match.homeScore;
  const result =
    teamScore === undefined || opponentScore === undefined
      ? undefined
      : teamScore > opponentScore
        ? 1
        : teamScore < opponentScore
          ? -1
          : 0;

  const benched = match.onBench || match.playedInMatch === false;

  return (
    <Link
      href={`/match/${match.id}`}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-white/[0.025] sm:px-4"
    >
      <FormPill result={result} size={22} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-dim">
            {match.isHomeTeam ? "vs" : "@"}
          </span>
          <Crest id={match.opponentTeamId} name={match.opponentTeamName} size={18} />
          <span className="truncate text-[13px] font-semibold text-ink group-hover:text-accent">
            {match.opponentTeamName}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-dim">
          <LocalTime value={match.matchDate.utcTime} kind="short" />
          <span>· {match.leagueName ?? "Match"}</span>
          {benched ? (
            <span>· {match.onBench ? "bench" : "unused"}</span>
          ) : (
            <span className="num">· {match.minutesPlayed ?? 0}&apos;</span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="font-display text-sm font-extrabold text-ink num">
          {match.homeScore ?? 0}–{match.awayScore ?? 0}
        </p>
        <span className="flex items-center gap-1">
          {Array.from({ length: Math.min(4, match.goals ?? 0) }, (_, index) => (
            <span key={`g${index}`} className="rounded bg-accent/15 px-1 text-[10px] font-extrabold text-accent">G</span>
          ))}
          {Array.from({ length: Math.min(4, match.assists ?? 0) }, (_, index) => (
            <span key={`a${index}`} className="rounded bg-sky/15 px-1 text-[10px] font-extrabold text-sky">A</span>
          ))}
          {match.yellowCards ? <span className="h-3 w-2 rounded-[2px] bg-yellow-300" title="Yellow card" /> : null}
          {match.redCards ? <span className="h-3 w-2 rounded-[2px] bg-orange-500" title="Red card" /> : null}
        </span>
      </div>
      <div className="flex w-12 justify-end">
        {benched ? (
          <span className="text-[11px] text-dim">—</span>
        ) : (
          <RatingChip rating={match.ratingProps?.rating} star={match.playerOfTheMatch} size="md" />
        )}
      </div>
    </Link>
  );
}

export function PlayerProfileCard({ player }: { player: PlayerResponse }) {
  const info = player.playerInformation ?? [];
  const rows = info
    .filter((item) => item.title !== "Market value")
    .map((item) => ({ label: item.title, value: infoText(item.value) }))
    .filter((item) => item.value && item.value !== "—");

  return (
    <div className="card p-4">
      <p className="eyebrow mb-1">Player profile</p>
      <div className="divide-y divide-line/40">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2">
            <span className="text-[11px] text-dim">{row.label}</span>
            <span className="text-xs font-semibold text-muted">{row.value}</span>
          </div>
        ))}
        {player.primaryTeam && (
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-[11px] text-dim">Club</span>
            <Link
              href={`/team/${player.primaryTeam.teamId}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <Crest id={player.primaryTeam.teamId} name={player.primaryTeam.teamName} size={15} />
              {player.primaryTeam.teamName}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayerNextMatchCard({ match }: { match?: PlayerNextMatch }) {
  if (!match) return null;

  return (
    <Link href={`/match/${match.matchId}`} className="card card-hover block p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Next match</p>
        <span className="text-[11px] font-semibold text-dim">
          {match.leagueName}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <Crest id={match.homeId} name={match.homeName} size={30} />
          <span className="w-full truncate text-[11px] font-semibold text-muted">{match.homeName}</span>
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-extrabold text-ink">
            <LocalTime value={match.status.utcTime} />
          </p>
          <p className="text-[11px] text-dim"><LocalTime value={match.matchDate} kind="monthDay" /></p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <Crest id={match.awayId} name={match.awayName} size={30} />
          <span className="w-full truncate text-[11px] font-semibold text-muted">{match.awayName}</span>
        </div>
      </div>
    </Link>
  );
}

export function PlayerTrophies({ player }: { player: PlayerResponse }) {
  const teams = player.trophies?.playerTrophies ?? [];
  const rows = teams
    .flatMap((team) =>
      (team.tournaments ?? [])
        .filter((tournament) => (tournament.seasonsWon ?? []).length > 0)
        .map((tournament) => ({ team, tournament })),
    )
    .sort(
      (a, b) =>
        (b.tournament.seasonsWon?.length ?? 0) - (a.tournament.seasonsWon?.length ?? 0),
    );

  if (!rows.length) return null;

  return (
    <div className="card p-4">
      <p className="eyebrow mb-2">Trophies</p>
      <div className="divide-y divide-line/40">
        {rows.slice(0, 8).map(({ team, tournament }) => (
          <div
            key={`${team.teamId}-${tournament.leagueId}-${tournament.leagueName}`}
            className="flex items-center gap-2 py-2.5"
          >
            <TrophyIcon size={13} className="shrink-0 text-accent/80" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-muted">
                {tournament.leagueName}
              </p>
              <p className="truncate text-[11px] text-dim">{team.teamName}</p>
            </div>
            <span className="text-xs font-bold text-ink num">
              {tournament.seasonsWon?.length ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CareerList({ player }: { player: PlayerResponse }) {
  const career = player.careerHistory?.careerItems ?? {};
  const sections = Object.entries(career)
    .map(([title, value]) => ({
      title,
      entries: [...(value.teamEntries ?? [])].sort((a, b) =>
        (b.startDate ?? "").localeCompare(a.startDate ?? ""),
      ),
    }))
    .filter((section) => section.entries.length > 0);

  if (!sections.length) {
    return <div className="card px-4 py-8 text-center text-sm text-dim">Career history not available.</div>;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.title}>
          <SectionHeading
            title={capitalize(section.title)}
            subtitle={`${section.entries.length} ${section.title === "national team" ? "teams" : "clubs"} · ${sum(section.entries, "appearances")} apps · ${sum(section.entries, "goals")} goals · ${sum(section.entries, "assists")} assists`}
          />
          <div className="card mt-2 overflow-hidden">
            <div className="divide-y divide-line/40">
              {section.entries.map((entry, index) => (
                <CareerRow key={`${entry.teamId}-${entry.startDate ?? index}`} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function CareerRow({ entry }: { entry: PlayerCareerEntry }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Crest id={entry.teamId} name={entry.team} size={28} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/team/${entry.teamId}`}
          className="block truncate text-[13px] font-bold text-ink hover:text-accent"
        >
          {entry.team}
        </Link>
        <p className="mt-0.5 text-[11px] text-dim">
          {formatYear(entry.startDate)} – {entry.active ? "Present" : formatYear(entry.endDate)}
          {entry.transferType?.text ? ` · ${entry.transferType.text}` : ""}
        </p>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-3 text-right sm:gap-5">
        <CareerStat label="Apps" value={entry.appearances} />
        <CareerStat label="Goals" value={entry.goals} />
        <CareerStat label="Assists" value={entry.assists} />
      </div>
    </div>
  );
}

function CareerStat({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="font-display text-sm font-extrabold text-ink num">{value ?? "—"}</p>
      <p className="text-[11px] text-dim">{label}</p>
    </div>
  );
}

export function MarketValueChart({ player }: { player: PlayerResponse }) {
  const values = [...(player.marketValues?.values ?? [])]
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (values.length < 2) return null;

  const sampled = values.filter(
    (_, index) => index % Math.max(1, Math.floor(values.length / 48)) === 0 || index === values.length - 1,
  );
  const amounts = sampled.map((item) => item.value);
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  const span = max - min || 1;
  const points = sampled.map((item, index) => {
    const x = (index / (sampled.length - 1)) * 100;
    const y = 36 - ((item.value - min) / span) * 30;
    return { x, y, value: item.value, date: item.date };
  });
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = `M0,40 L${line.replaceAll(" ", " L")} L100,40 Z`;
  const latest = sampled[sampled.length - 1];
  const peak = sampled.reduce((best, item) => (item.value > best.value ? item : best), sampled[0]);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Market value</p>
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
            {formatMarketValue(latest.value)}
          </p>
        </div>
        <div className="text-right text-[11px] text-dim">
          <p>Peak {formatMarketValue(peak.value)}</p>
          <p>{formatShortDate(latest.date)}</p>
        </div>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-3 h-24 w-full">
        <defs>
          <linearGradient id="value-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#value-area)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.6" fill="var(--color-accent)" />
      </svg>
      <div className="flex items-center justify-between text-[11px] text-dim">
        <span>{new Date(sampled[0].date).getFullYear()}</span>
        <span>Low {formatMarketValue(min)}</span>
        <span>{new Date(latest.date).getFullYear()}</span>
      </div>
    </div>
  );
}

function infoText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "—";
  const record = value as Record<string, unknown>;
  if (typeof record.fallback === "string") return record.fallback;
  if (typeof record.fallback === "number") return String(record.fallback);
  if (record.fallback && typeof record.fallback === "object") {
    const nested = record.fallback as Record<string, unknown>;
    if (typeof nested.utcTime === "string") {
      return new Date(nested.utcTime).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  if (typeof record.numberValue === "number") return String(record.numberValue);
  return "—";
}

function formatStatValue(item: PlayerDeepStat) {
  if (item.statFormat === "percent") return `${item.statValue}%`;
  if (item.statFormat === "fraction") {
    const number = Number(item.statValue);
    return Number.isNaN(number) ? item.statValue : number.toFixed(2);
  }
  return compactNumber(item.statValue);
}

function sum(entries: PlayerCareerEntry[], key: "appearances" | "goals" | "assists") {
  return entries.reduce((total, entry) => total + (Number(entry[key]) || 0), 0);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatYear(value?: string | null) {
  if (!value) return "—";
  const year = new Date(value).getFullYear();
  return Number.isNaN(year) ? "—" : String(year);
}
