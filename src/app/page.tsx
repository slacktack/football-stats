import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";
import { DateStrip } from "@/components/date-strip";
import { ActivityIcon, ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LiveRefresher } from "@/components/live-refresher";
import { LeagueMatchGroup } from "@/components/match-row";
import { LiveRail, type LiveRailMatch } from "@/components/live-rail";
import { Crest, EmptyState, SkeletonBlock, SkeletonRows } from "@/components/ui";
import { leagueLogo } from "@/lib/assets";
import { getAllLeagues, getMatchesByDate, hasLiveMatches } from "@/lib/fotmob";
import { isLive, scorePair } from "@/lib/format";
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

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="skeleton-out" default="none">
          <HomeSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <HomeContent searchParams={searchParams} />
      </ViewTransition>
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
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
  const finishedCount = data.leagues.reduce(
    (sum, league) => sum + league.matches.filter((match) => match.status.finished).length,
    0,
  );
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
    finished: finishedCount,
    upcoming: data.leagues
      .flatMap((league) => league.matches)
      .filter((match) => !match.status.started && !match.status.cancelled).length,
  };

  const popular = allLeagues.popular.slice(0, 10);
  const dateHeading = dateParam === today ? "Today" : formatLongDate(date);
  const dateStrip = buildDateStrip(date);
  const rank = new Map(allLeagues.popular.map((league, index) => [league.id, index]));
  const liveMatches: LiveRailMatch[] = data.leagues
    .flatMap((league) =>
      league.matches
        .filter((match) => isLive(match.status))
        .map((match) => ({ ...match, leagueId: league.primaryId ?? league.id, leagueName: league.name })),
    )
    .sort((a, b) => (rank.get(a.leagueId) ?? 999) - (rank.get(b.leagueId) ?? 999));

  return (
    <div className="shell py-5 md:py-7">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-black leading-none tracking-[-0.03em] text-ink sm:text-[34px]">
            {dateHeading}
          </h1>
          <p className="mt-1.5 truncate text-[13px] text-muted num">
            {dateHeading === "Today" ? `${formatLongDate(date)}, ` : ""}
            {totalMatches} {totalMatches === 1 ? "match" : "matches"}
          </p>
        </div>
        <LiveRefresher active={live} />
      </header>

      <div className="mt-4">
        <DateStrip
          days={dateStrip}
          selected={dateParam}
          prevParam={toDateParam(addDays(date, -1))}
          nextParam={toDateParam(addDays(date, 1))}
          filter={filter}
        />
      </div>

      {filter === "all" && <LiveRail matches={liveMatches.slice(0, 12)} total={liveCount} />}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="min-w-0">
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
                    className={`press flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all sm:px-3 sm:text-xs ${
                      active
                        ? "bg-ink text-canvas shadow-sm"
                        : "text-muted hover:bg-white/[0.045] hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded px-1 text-[11px] num ${
                        active ? "bg-canvas/15 text-canvas/70" : "text-dim"
                      }`}
                    >
                      {counts[item.value] ?? 0}
                    </span>
                  </Link>
                );
              })}
            </div>
            <span className="hidden shrink-0 text-[11px] font-medium text-dim sm:block">
              Grouped by competition
            </span>
          </div>

          {groups.length > 0 ? (
            <div className="stagger space-y-4">
              {groups.map((league) => (
                <LeagueMatchGroup
                  key={`${league.id}-${league.name}`}
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

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-dim">
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
                className="flex items-center gap-0.5 text-xs font-semibold text-dim transition-colors hover:text-accent"
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
                  className="press group flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.025]"
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
                  <span className="rounded border border-line/80 px-1.5 py-0.5 text-[11px] font-bold text-dim">
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

          <DayInNumbers leagues={data.leagues} />
        </aside>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-10 w-40" />
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

type DayMatch = {
  id: string | number;
  home: { id: string | number; name: string; score?: number };
  away: { id: string | number; name: string; score?: number };
  status: MatchStatus;
};

function DayInNumbers({ leagues }: { leagues: { name: string; matches: DayMatch[] }[] }) {
  const played = leagues
    .flatMap((league) => league.matches.map((match) => ({ match, league: league.name })))
    .map((item) => {
      const [home, away] = scorePair(item.match).map(Number);
      return { ...item, home, away };
    })
    .filter(
      (item) =>
        (item.match.status.started || item.match.status.finished) &&
        Number.isFinite(item.home) &&
        Number.isFinite(item.away),
    );
  if (!played.length) return null;

  const goals = played.reduce((sum, item) => sum + item.home + item.away, 0);
  const draws = played.filter((item) => item.match.status.finished && item.home === item.away).length;
  const goalless = played.filter((item) => item.home + item.away === 0).length;
  const thriller = [...played].sort((a, b) => b.home + b.away - (a.home + a.away))[0];
  const rout = [...played].sort(
    (a, b) => Math.abs(b.home - b.away) - Math.abs(a.home - a.away),
  )[0];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line/60 px-4 py-3">
        <h2 className="text-[13px] font-bold text-ink">Day in numbers</h2>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line/50 border-b border-line/50 text-center">
        {[
          { label: "Goals", value: goals },
          { label: "Per game", value: (goals / played.length).toFixed(1) },
          { label: "Draws", value: draws },
        ].map((item) => (
          <div key={item.label} className="px-2 py-3">
            <p className="font-display text-[22px] font-black leading-none text-ink num">{item.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-dim">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-line/40">
        {[
          { label: "Most goals", item: thriller },
          { label: "Biggest margin", item: rout },
        ]
          .filter((row) => row.item && row.item.home + row.item.away > 0)
          .map(({ label, item }) => (
            <Link
              key={label}
              href={`/match/${item.match.id}`}
              className="press group block px-4 py-3 transition-colors hover:bg-white/[0.025]"
            >
              <p className="eyebrow">{label}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Crest id={item.match.home.id} name={item.match.home.name} size={18} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink group-hover:text-accent">
                  {item.match.home.name} – {item.match.away.name}
                </span>
                <span className="font-display text-[15px] font-black text-ink num">
                  {item.home}–{item.away}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-dim">{item.league}</p>
            </Link>
          ))}
        {goalless > 0 && (
          <p className="px-4 py-2.5 text-[11px] text-dim">
            {goalless} goalless {goalless === 1 ? "game" : "games"} so far
          </p>
        )}
      </div>
    </div>
  );
}
