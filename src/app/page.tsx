import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DateStrip } from "@/components/date-strip";
import { ActivityIcon, ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LiveRefresher } from "@/components/live-refresher";
import { LeagueMatchGroup } from "@/components/match-row";
import { EmptyState, LiveDot, SkeletonBlock, SkeletonRows } from "@/components/ui";
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
    <div className="shell py-5 md:py-7">
      <section className="hero-panel relative overflow-hidden rounded-[26px] border border-line/80 px-4 pb-4 pt-6 sm:px-7 sm:pb-5 sm:pt-8">
        <span
          className="pointer-events-none absolute -right-6 -top-16 select-none font-display text-[220px] font-black leading-none tracking-[-0.09em] text-ink/[0.028] sm:-right-2 sm:text-[280px]"
          aria-hidden="true"
        >
          90
        </span>
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full border border-accent/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-10 h-32 w-32 rounded-full border border-accent/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-2">
              Matchday
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-live">
                  <LiveDot /> {liveCount} live now
                </span>
              )}
            </p>
            <h1 className="mt-2.5 font-display text-[34px] font-black leading-[0.95] tracking-[-0.03em] text-ink sm:text-[52px]">
              Every match
              <br />
              <span className="text-accent">that matters.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted sm:text-sm">
              {dateHeading} <span className="text-dim">·</span> {totalMatches}{" "}
              {totalMatches === 1 ? "match" : "matches"} across {data.leagues.length}{" "}
              {data.leagues.length === 1 ? "competition" : "competitions"}. Scores, lineups,
              tables and every number.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LiveRefresher active={live} />
            <Link
              href={liveCount > 0 ? "/?filter=live" : "/leagues"}
              className="btn-primary h-9 gap-1.5 px-3.5 text-[11px]"
            >
              {liveCount > 0 ? "Watch live" : "Browse leagues"}
              <ChevronRightIcon size={13} />
            </Link>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-4 divide-x divide-line/60 border-t border-line/60 pt-4">
          <HeroStat label="Matches" value={totalMatches} />
          <HeroStat label="Live" value={liveCount} accent={liveCount > 0} />
          <HeroStat label="Goals" value={totalGoals} />
          <HeroStat label="Leagues" value={data.leagues.length} />
        </div>
      </section>

      <div className="mt-4">
        <DateStrip
          days={dateStrip}
          selected={dateParam}
          prevParam={toDateParam(addDays(date, -1))}
          nextParam={toDateParam(addDays(date, 1))}
          filter={filter}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl border border-line/80 bg-card p-1 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.7)]">
              {FILTERS.map((item) => {
                const active = filter === item.value;
                const href = `/?date=${dateParam}${item.value === "all" ? "" : `&filter=${item.value}`}`;
                return (
                  <Link
                    key={item.value}
                    href={href}
                    scroll={false}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all sm:px-3 sm:text-xs ${
                      active
                        ? "bg-ink text-canvas shadow-sm"
                        : "text-muted hover:bg-white/[0.045] hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded px-1 text-[9px] num ${
                        active ? "bg-canvas/15 text-canvas/70" : "text-dim"
                      }`}
                    >
                      {counts[item.value] ?? 0}
                    </span>
                  </Link>
                );
              })}
            </div>
            <span className="hidden shrink-0 text-[10px] font-medium text-dim sm:block">
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
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-on-accent transition-opacity hover:opacity-90"
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
                  <span className="rounded border border-line/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-dim">
                    {league.ccode}
                  </span>
                  <ChevronRightIcon
                    size={12}
                    className="text-dim opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
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

function HeroStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="px-2 first:pl-0 last:pr-0 sm:px-4">
      <p
        className={`font-display text-2xl font-extrabold leading-none num sm:text-[32px] ${
          accent ? "text-live" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-dim sm:text-[9px]">
        {label}
      </p>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-[252px] rounded-[26px]" />
      <div className="mt-4 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[68px] min-w-[58px] flex-1 rounded-xl" />
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
