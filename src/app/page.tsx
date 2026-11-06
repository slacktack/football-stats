import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";
import { DateStrip } from "@/components/date-strip";
import { ActivityIcon, ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LiveRefresher } from "@/components/live-refresher";
import { LeagueMatchGroup } from "@/components/match-row";
import { LiveRail, type LiveRailMatch } from "@/components/live-rail";
import { PixelField } from "@/components/pixel-field";
import { Crest, EmptyState, SkeletonBlock, SkeletonRows } from "@/components/ui";
import { AsciiBar, K, Led, Leds, Panel, Ruler, Spark, Wave } from "@/components/tl";
import { leagueLogo } from "@/lib/assets";
import { hueClass } from "@/lib/hue";
import { getAllLeagues, getMatchesByDate, hasLiveMatches } from "@/lib/fotmob";
import { isLive, pad, scorePair } from "@/lib/format";
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
  { value: "all", label: "All", hue: "ink" },
  { value: "live", label: "Live", hue: "led" },
  { value: "finished", label: "Results", hue: "teal" },
  { value: "upcoming", label: "Upcoming", hue: "amber" },
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
    <div className="shell tl-view py-5 md:py-7">
      <header className="relative overflow-hidden border-b border-line pb-4">
        <PixelField className="tl-field-right" step={24} />
        <div className="relative flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2">
              <Led tone={liveCount > 0 ? undefined : "teal"} />
              <K dim>
                Feed / {dateParam}
                {filter !== "all" ? ` / ${filter}` : ""}
              </K>
            </p>
            <h1 className="mt-2.5">
              <Wave
                text={dateHeading}
                className="tl-num block text-[30px] font-bold leading-none text-ink sm:text-[44px]"
              />
            </h1>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted">
              <span className="num">
                <b className="tl-num font-bold text-ink">{totalMatches}</b>{" "}
                {totalMatches === 1 ? "match" : "matches"}
              </span>
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <span className="num">
                <b className="tl-num font-bold text-ink">{groups.length}</b> competitions
              </span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Leds n={3} />
                  <span className="num font-semibold text-ink">{liveCount} in play</span>
                </span>
              )}
            </p>
          </div>
          <LiveRefresher active={live} />
        </div>
        <Ruler fill n={150} className="relative mt-4" />
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

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              {FILTERS.map((item) => {
                const active = filter === item.value;
                const href = `/?date=${dateParam}${item.value === "all" ? "" : `&filter=${item.value}`}`;
                return (
                  <Link
                    key={item.value}
                    href={href}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`tl-chip press tl-hue-${item.hue} shrink-0 ${
                      active ? "tl-chip-inv" : "text-muted hover:border-[var(--tl-hue)] hover:text-[var(--tl-hue-ink)]"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`tl-num text-[12px] ${active ? "opacity-70" : "text-[var(--tl-hue)]"}`}
                    >
                      {counts[item.value] ?? 0}
                    </span>
                  </Link>
                );
              })}
            </div>
            <K dim className="hidden shrink-0 sm:block">
              By competition
            </K>
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
              icon={filter === "live" ? <ActivityIcon size={20} /> : <TrophyIcon size={20} />}
              action={
                <Link href={filter === "live" ? `/?date=${dateParam}` : "/"} className="tl-btn">
                  {filter === "live" ? "Show all matches" : "Back to today"}
                </Link>
              }
            />
          )}

          <p className="mt-4 flex items-center gap-2">
            <Led tone="teal" />
            <span className="text-[11px] text-dim">
              Squads, lineups and live telemetry refresh automatically during play.
            </span>
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Panel
            label="Top competitions"
            aside={
              <Link href="/leagues" className="flex items-center gap-0.5 hover:text-accent">
                Index
                <ChevronRightIcon size={11} />
              </Link>
            }
          >
            <div>
              {popular.map((league, index) => (
                <Link
                  key={`${league.ccode}-${league.id}`}
                  href={`/league/${league.id}`}
                  className={`tl-tr tl-tr-hue group press ${hueClass(league.id)}`}
                  style={{ gridTemplateColumns: "20px 24px minmax(0,1fr) auto" }}
                >
                  <span className="tl-k tl-num num text-[var(--tl-hue-ink)]">{pad(index + 1)}</span>
                  <Image
                    src={leagueLogo(league.id)}
                    alt=""
                    width={22}
                    height={22}
                    className="h-5 w-5 object-contain"
                  />
                  <span className="min-w-0 truncate text-[12px] font-semibold text-muted transition-colors group-hover:text-ink">
                    {league.name}
                  </span>
                  <span className="tl-tag tl-hue-chip">{league.ccode}</span>
                </Link>
              ))}
            </div>
          </Panel>

          <DayInNumbers leagues={data.leagues} />
        </aside>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-11 w-56" />
      <div className="mt-4 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[62px] min-w-[56px] flex-1" />
        ))}
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="space-y-4">
          <SkeletonRows rows={5} />
          <SkeletonRows rows={4} />
        </div>
        <div className="hidden space-y-4 lg:block">
          <SkeletonBlock className="h-80" />
          <SkeletonBlock className="h-44" />
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

  const highlights = [
    { label: "Most goals", item: thriller },
    { label: "Biggest margin", item: rout },
  ].filter((row) => row.item && row.item.home + row.item.away > 0);

  // Goals landing through the day, ordered by kickoff — the trace reads as a
  // matchday building, not a random walk.
  const trace = [...played]
    .sort((a, b) => a.match.status.utcTime.localeCompare(b.match.status.utcTime))
    .map((item) => item.home + item.away);

  return (
    <Panel label="Day in numbers" aside={`${played.length} played`}>
      <div className="tl-kpis">
        <div className="tl-kpi">
          <span className="tl-kpi-v tl-num">{goals}</span>
          <span className="tl-kpi-src">Goals</span>
          <AsciiBar value={goals} total={played.length * 5} blocks={10} className="mt-1 text-[10px]" />
        </div>
        <div className="tl-kpi">
          <span className="tl-kpi-v tl-num">{(goals / played.length).toFixed(1)}</span>
          <span className="tl-kpi-src">Per game</span>
          <AsciiBar value={goals / played.length} total={5} blocks={10} className="mt-1 text-[10px]" />
        </div>
        <div className="tl-kpi">
          <span className="tl-kpi-v tl-num">{draws}</span>
          <span className="tl-kpi-src">Draws</span>
          <AsciiBar value={draws} total={played.length} blocks={10} tone="sky" className="mt-1 text-[10px]" />
        </div>
        <div className="tl-kpi">
          <span className="tl-kpi-v tl-num">{goalless}</span>
          <span className="tl-kpi-src">0–0</span>
          <AsciiBar value={goalless} total={played.length} blocks={10} tone="mint" className="mt-1 text-[10px]" />
        </div>
      </div>

      {trace.length > 1 && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2">
            <K dim>Goals / match by kickoff</K>
            <span className="tl-k tl-k-dim num">{trace.length}</span>
          </div>
          <Spark values={trace} className="mt-2" />
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-4 space-y-3">
          {highlights.map(({ label, item }) => (
            <div key={label}>
              <K dim>{label}</K>
              <Link
                href={`/match/${item.match.id}`}
                className="tl-leader press group mt-1 hover:bg-hover"
              >
                <Crest id={item.match.home.id} name={item.match.home.name} size={16} />
                <span className="min-w-0 truncate text-ink transition-colors group-hover:text-accent">
                  {item.match.home.name} – {item.match.away.name}
                </span>
                <i aria-hidden="true" />
                <b className="tl-num text-[13px] text-ink">
                  {item.home}–{item.away}
                </b>
              </Link>
              <p className="truncate pl-6 text-[10.5px] text-dim">{item.league}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-[10.5px] leading-relaxed text-dim">
        Aggregated from every fixture on this date. Scores are the source feed&rsquo;s final
        register.
      </p>
    </Panel>
  );
}
