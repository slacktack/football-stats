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
import { Crest, EmptyState, FormPill, RatingChip, SectionHeading } from "../ui";
import { AsciiBar, Chip, K, Leader, Panel, Phos } from "../tl";
import { percentileTier } from "./player-insights";

export function PlayerStatStrip({ player }: { player: PlayerResponse }) {
  const stats = player.mainLeague?.stats ?? [];
  if (!stats.length) return null;

  return (
    <div>
      <Phos className="mb-2" />
      <div className="tl-kpis grid-cols-4 sm:grid-cols-8">
        {stats.map((stat) => {
          const isRating = stat.localizedTitleId === "rating";
          return (
            <div key={stat.title} className="tl-kpi items-center justify-center text-center">
              <p className="tl-k tl-k-dim text-center leading-tight">{stat.title}</p>
              {isRating ? (
                <RatingChip rating={stat.value} size="md" className="mt-1" />
              ) : (
                <p className="tl-num mt-1 text-[17px] text-ink">{stat.value}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopStatCards({ section }: { section?: PlayerStatsSection }) {
  if (!section?.items?.length) return null;
  return (
    <div>
      <Phos className="mb-2" />
      <div className="tl-kpis grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {section.items.map((item) => (
          <div key={item.localizedTitleId ?? item.title} className="tl-kpi">
            <K dim>{item.title}</K>
            {item.localizedTitleId === "rating" ? (
              <RatingChip rating={item.statValue} size="lg" className="mt-1" />
            ) : (
              <p className="tl-num text-[22px] text-ink">{formatStatValue(item)}</p>
            )}
            <span className="tl-meter mt-2 block">
              <span
                className="rating-bar bar-grow block h-full"
                data-tier={percentileTier(item.percentileRank ?? 0)}
                style={{ width: `${Math.min(100, Math.max(2, item.percentileRank ?? 0))}%` }}
              />
            </span>
            <p className="tl-kpi-src">{ordinal(Math.round(item.percentileRank ?? 0))} pct</p>
          </div>
        ))}
      </div>
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
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-line-strong pb-2.5">
        <div>
          <K>Shot map</K>
          <p className="tl-kpi-src mt-1">
            {shots.length} shots · {goals} goals · {onTarget} on target · {xg.toFixed(2)} xG
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-dim">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 bg-accent" /> Goal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 bg-sky" /> On target
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 bg-muted" /> Off target
          </span>
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="tl-frame overflow-hidden bg-card-2">
          <svg viewBox="0 0 105 68" className="block w-full" role="img" aria-label="Player shot map">
            <rect width="105" height="68" fill="var(--tl-pitch-field)" />
            <g stroke="var(--tl-hair)" strokeWidth="0.35" fill="none">
              <rect x="0.5" y="0.5" width="104" height="67" />
              <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" />
              <circle cx="52.5" cy="34" r="9.15" />
              <rect x="88.5" y="13.84" width="16" height="40.32" />
              <rect x="97.5" y="24.84" width="7" height="18.32" />
              <rect x="104.2" y="30.34" width="0.8" height="7.32" />
              <path d="M88.5 20.5 A9.15 9.15 0 0 0 88.5 47.5" />
            </g>
            <circle cx="52.5" cy="34" r="0.8" fill="var(--tl-hair)" />
            {shots.map((shot) => {
              const isGoal = shot.eventType === "Goal";
              const fill = isGoal ? "var(--tl-led)" : shot.isOnTarget ? "var(--tl-amber)" : "var(--color-muted)";
              return (
                <g key={shot.id}>
                  <circle
                    cx={Math.min(104, Math.max(1, shot.x))}
                    cy={Math.min(67, Math.max(1, shot.y))}
                    r={isGoal ? 2.1 : 1.5}
                    fill={fill}
                    fillOpacity={isGoal ? 1 : 0.9}
                    stroke={isGoal ? "var(--tl-pitch-field)" : "none"}
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
          <div className="border border-line bg-card-2/60 p-3">
            <K className="mb-2 block">Efficiency</K>
            <div className="grid grid-cols-2 gap-2">
              <ShotMetric label="Conversion" value={`${conversion}%`} />
              <ShotMetric label="Accuracy" value={`${accuracy}%`} />
              <ShotMetric label="xG / shot" value={(xg / shots.length).toFixed(2)} />
              <ShotMetric label="Goals" value={String(goals)} />
            </div>
          </div>
          <div className="border border-line bg-card-2/60 p-3">
            <K className="mb-2 block">Shot types</K>
            <div className="space-y-2">
              {types.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11.5px] text-muted">{formatShotType(type)}</span>
                    <span className="text-[11.5px] font-semibold text-ink num">{count}</span>
                  </div>
                  <AsciiBar className="mt-1 text-[9.5px]" blocks={10} value={count} total={maxType} />
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
      <p className="tl-k tl-k-dim">{label}</p>
      <p className="tl-num mt-1 text-[15px] text-ink">{value}</p>
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
    return <EmptyState title="No season stats available." />;
  }

  return (
    <div className="stagger grid gap-3 lg:grid-cols-2">
      {visible.map((group) => (
        <div key={group.localizedTitleId ?? group.title} className="card p-4">
          <p className="tl-k mb-2 border-b border-dashed border-line-strong pb-2 text-accent">
            {group.title ?? group.localizedTitleId}
          </p>
          <div className="divide-y divide-line">
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
                    <span className="text-[11.5px] font-semibold text-muted">{item.title}</span>
                    <span className="shrink-0 tl-num text-[14px] text-ink">
                      {value}
                      {metric === "per90" && (
                        <span className="tl-k tl-k-dim ml-1">/90</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <span className="tl-meter flex-1">
                      <span
                        className="rating-bar bar-grow block h-full"
                        data-tier={percentileTier(percentile)}
                        style={{ width: `${Math.min(100, Math.max(2, percentile))}%` }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right text-[11.5px] font-semibold text-muted num">
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
    return <EmptyState title={empty} />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-line">
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
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-hover sm:px-4"
    >
      <FormPill result={result} size={22} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="tl-k tl-k-dim">
            {match.isHomeTeam ? "vs" : "@"}
          </span>
          <Crest id={match.opponentTeamId} name={match.opponentTeamName} size={18} />
          <span className="truncate text-[12.5px] font-semibold text-ink group-hover:text-accent">
            {match.opponentTeamName}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-dim">
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
        <p className="tl-num text-[14px] text-ink">
          {match.homeScore ?? 0}–{match.awayScore ?? 0}
        </p>
        <span className="flex items-center gap-1">
          {Array.from({ length: Math.min(4, match.goals ?? 0) }, (_, index) => (
            <Chip key={`g${index}`} tone="mint">G</Chip>
          ))}
          {Array.from({ length: Math.min(4, match.assists ?? 0) }, (_, index) => (
            <Chip key={`a${index}`} tone="warn">A</Chip>
          ))}
          {match.yellowCards ? <span className="h-3 w-2 bg-sky" title="Yellow card" /> : null}
          {match.redCards ? <span className="h-3 w-2 bg-violet" title="Red card" /> : null}
        </span>
      </div>
      <div className="flex w-12 justify-end">
        {benched ? (
          <span className="text-[10.5px] text-dim">—</span>
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
    <Panel label="Player profile">
      {rows.map((row) => (
        <Leader key={row.label} k={row.label} v={row.value} />
      ))}
      {player.primaryTeam && (
        <Leader
          k="Club"
          v={
            <Link
              href={`/team/${player.primaryTeam.teamId}`}
              className="inline-flex items-center justify-end gap-1.5 hover:underline"
            >
              <Crest id={player.primaryTeam.teamId} name={player.primaryTeam.teamName} size={15} />
              {player.primaryTeam.teamName}
            </Link>
          }
        />
      )}
    </Panel>
  );
}

export function PlayerNextMatchCard({ match }: { match?: PlayerNextMatch }) {
  if (!match) return null;

  return (
    <Link href={`/match/${match.matchId}`} className="card block p-4">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-line-strong pb-2">
        <K>Next match</K>
        <span className="tl-k tl-k-dim">{match.leagueName}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <Crest id={match.homeId} name={match.homeName} size={30} />
          <span className="w-full truncate text-[10.5px] font-semibold text-muted">{match.homeName}</span>
        </div>
        <div className="text-center">
          <p className="tl-num text-[14px] text-ink">
            <LocalTime value={match.status.utcTime} />
          </p>
          <p className="text-[10.5px] text-dim"><LocalTime value={match.matchDate} kind="monthDay" /></p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <Crest id={match.awayId} name={match.awayName} size={30} />
          <span className="w-full truncate text-[10.5px] font-semibold text-muted">{match.awayName}</span>
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
    <Panel label="Trophies">
      {rows.slice(0, 8).map(({ team, tournament }) => (
        <div
          key={`${team.teamId}-${tournament.leagueId}-${tournament.leagueName}`}
          className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0"
        >
          <TrophyIcon size={13} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-semibold text-muted">
              {tournament.leagueName}
            </p>
            <p className="tl-k tl-k-dim truncate">{team.teamName}</p>
          </div>
          <span className="tl-num shrink-0 text-[15px] text-ink">
            {tournament.seasonsWon?.length ?? 0}
          </span>
        </div>
      ))}
    </Panel>
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
    return <EmptyState title="Career history not available." />;
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
            <div className="divide-y divide-line">
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
          className="block truncate text-[12.5px] font-semibold text-ink hover:text-accent"
        >
          {entry.team}
        </Link>
        <p className="tl-k tl-k-dim mt-0.5 truncate">
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
      <p className="tl-num text-[14px] text-ink">{value ?? "—"}</p>
      <p className="tl-k tl-k-dim mt-0.5">{label}</p>
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
    <Panel label="Market value" aside={`peak ${formatMarketValue(peak.value)}`}>
      <div className="flex items-end justify-between gap-3">
        <p className="tl-num text-[26px] text-ink">{formatMarketValue(latest.value)}</p>
        <p className="tl-k tl-k-dim">{formatShortDate(latest.date)}</p>
      </div>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="tl-frame mt-3 block h-24 w-full"
      >
        <path d={area} fill="color-mix(in srgb, var(--color-accent) 18%, transparent)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--tl-led)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.6" fill="var(--tl-led)" />
      </svg>
      <div className="tl-kpi-src mt-2 justify-between">
        <span>{new Date(sampled[0].date).getFullYear()}</span>
        <span>Low {formatMarketValue(min)}</span>
        <span>{new Date(latest.date).getFullYear()}</span>
      </div>
    </Panel>
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
