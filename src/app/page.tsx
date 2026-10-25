import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DateStrip } from "@/components/date-strip";
import { ActivityIcon, ChevronRightIcon, GlobeIcon, TrophyIcon } from "@/components/icons";
import { LiveRefresher } from "@/components/live-refresher";
import { LeagueMatchGroup } from "@/components/match-row";
import { EmptyState, LiveDot, Pill, SkeletonBlock, SkeletonRows } from "@/components/ui";
import { leagueLogo } from "@/lib/assets";
import { getAllLeagues, getMatchesByDate, hasLiveMatches } from "@/lib/fotmob";
import { isLive } from "@/lib/format";
import {
  addDays,
  buildDateStrip,
  formatLongDate,
  parseDateParam,
  toDateParam,
  todayParam,
} from "@/lib/format";
import type { MatchStatus } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Results" },
  { value: "upcoming", label: "Upcoming" },
] as const;

function matchesFilter(status: MatchStatus, filter: string) {
  if (filter === "live") return isLive(status);
  if (filter === "finished") return Boolean(status.finished);
  if (filter === "upcoming") return !status.started && !status.cancelled;
  return true;
}

function goalsFromStatus(status: MatchStatus) {
  if (!status.finished || !status.scoreStr) return 0;
  return status.scoreStr.split(" - ").reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const rawFilter = typeof params.filter === "string" ? params.filter : "all";
  const filter = FILTERS.some((item) => item.value === rawFilter) ? rawFilter : "all";
  const date = parseDateParam(rawDate);
  const dateParam = toDateParam(date);
  const today = todayParam();

  const [data, allLeagues] = await Promise.all([getMatchesByDate(dateParam), getAllLeagues()]);

  const totalMatches = data.leagues.reduce((sum, league) => sum + league.matches.length, 0);
  const liveCount = data.leagues.reduce(
    (sum, league) => sum + league.matches.filter((match) => isLive(match.status)).length,
    0,
  );
  const finishedMatches = data.leagues.flatMap((league) => league.matches).filter((match) => match.status.finished);
  const totalGoals = finishedMatches.reduce((sum, match) => sum + goalsFromStatus(match.status), 0);
  const live = hasLiveMatches(data.leagues);

  const groups = data.leagues
    .map((league) => ({
      ...league,
      matches: league.matches.filter((match) => matchesFilter(match.status, filter)),
    }))
    .filter((league) => league.matches.length > 0);

  const counts: Record<string, number> = {
    all: totalMatches,
    live: liveCount,
    finished: finishedMatches.length,
    upcoming: data.leagues
      .flatMap((league) => league.matches)
      .filter((match) => !match.status.started && !match.status.cancelled).length,
  };

  const suffix = filter === "all" ? "" : `&filter=${filter}`;
  const popular = allLeagues.popular.slice(0, 10);
  const dateHeading = dateParam === today ? "Today" : formatLongDate(date);
  const dateStrip = buildDateStrip(date);

  return (
    <div className="shell py-6 md:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            Matchday
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-live">
                <LiveDot /> {liveCount} live
              </span>
            )}
          </p>
          <h1 className="font-display text-[30px] font-extrabold leading-none tracking-tight text-ink sm:text-[38px]">
            Football scores
          </h1>
          <p className="mt-2 text-sm text-muted">
            {dateHeading} <span className="text-dim">·</span> {totalMatches}{" "}
            {totalMatches === 1 ? "match" : "matches"} across {data.leagues.length}{" "}
            {data.leagues.length === 1 ? "competition" : "competitions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveRefresher active={live} />
          <Pill tone="neutral" className="hidden sm:inline-flex">
            <GlobeIcon size={12} /> Every league
          </Pill>
        </div>
      </div>

      <div className="mt-5">
        <DateStrip
          days={dateStrip}
          selected={dateParam}
          prevParam={toDateParam(addDays(date, -1))}
          nextParam={toDateParam(addDays(date, 1))}
          filter={filter}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatChip label="Matches" value={totalMatches} />
        <StatChip label="Live now" value={liveCount} accent={liveCount > 0} />
        <StatChip label="Goals" value={totalGoals} />
        <StatChip label="Leagues" value={data.leagues.length} />
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => {
              const active = filter === item.value;
              const href = `/?date=${dateParam}${item.value === "all" ? "" : `&filter=${item.value}`}`;
              return (
                <Link
                  key={item.value}
                  href={href}
                  scroll={false}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-ink text-base"
                      : "bg-white/[0.035] text-muted ring-1 ring-inset ring-white/[0.05] hover:bg-white/[0.06] hover:text-ink"
                  }`}
                >
                  {item.label}
                  <span
                    className={`rounded px-1 text-[10px] num ${
                      active ? "bg-base/10 text-base/60" : "bg-white/[0.05] text-dim"
                    }`}
                  >
                    {counts[item.value] ?? 0}
                  </span>
                </Link>
              );
            })}
            <span className="ml-auto text-[10px] font-medium text-dim">
              Grouped by competition
            </span>
          </div>

          {groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((league) => (
                <LeagueMatchGroup
                  key={league.id}
                  leagueId={league.id}
                  primaryId={league.primaryId}
                  name={league.name}
                  ccode={league.ccode}
                  matches={league.matches}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                filter === "live" ? "No live matches right now" : "No matches on this day"
              }
              description={
                filter === "live"
                  ? "Check the full fixture list or come back when the next round kicks off."
                  : "Try another date using the calendar above."
              }
              icon={filter === "live" ? <ActivityIcon size={22} /> : <TrophyIcon size={22} />}
              action={
                <Link
                  href={filter === "live" ? `/?date=${dateParam}` : "/"}
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-base transition-opacity hover:opacity-90"
                >
                  {filter === "live" ? "Show all matches" : "Back to today"}
                </Link>
              }
            />
          )}

          <p className="mt-4 flex items-center gap-1.5 text-[10px] text-dim">
            <span className="inline-block h-1 w-1 rounded-full bg-dim" />
            Squads, lineups and live data update automatically during play.
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <h2 className="text-[13px] font-bold text-ink">Top competitions</h2>
              <Link
                href="/leagues"
                className="flex items-center gap-0.5 text-[11px] font-semibold text-dim transition-colors hover:text-accent"
              >
                All
                <ChevronRightIcon size={12} />
              </Link>
            </div>
            <div className="divide-y divide-line/40">
              {popular.map((league) => (
                <Link
                  key={`${league.ccode}-${league.id}`}
                  href={`/league/${league.id}`}
                  className="group flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.025]"
                >
                  <Image
                    src={leagueLogo(league.id)}
                    alt=""
                    width={22}
                    height={22}
                    className="h-5 w-5 object-contain"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted transition-colors group-hover:text-ink">
                    {league.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-dim">
                    {league.ccode}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card relative overflow-hidden p-4">
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
            <p className="eyebrow">Match centre</p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">
              Every match in one place
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              Go beyond the score with live xG, shot maps, average positions, player ratings and
              head-to-head records.
            </p>
            <Link
              href="/leagues"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              Explore competitions
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card flex items-center justify-between gap-2 px-3.5 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span
        className={`font-display text-lg font-extrabold num ${accent ? "text-live" : "text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-9 w-64" />
      <SkeletonBlock className="mt-3 h-4 w-80" />
      <div className="mt-5 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[68px] min-w-[58px] flex-1 rounded-xl" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-12" />
        ))}
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="space-y-4">
          <SkeletonRows rows={5} />
          <SkeletonRows rows={4} />
        </div>
        <div className="hidden space-y-4 lg:block">
          <SkeletonBlock className="h-80" />
          <SkeletonBlock className="h-40" />
        </div>
      </div>
    </div>
  );
}
