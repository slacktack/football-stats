import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FixtureRow, FixtureList } from "@/components/fixture-list";
import { ChartIcon as DataIcon, ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LeagueTable } from "@/components/league-table";
import { StatLeaders } from "@/components/stat-leaders";
import { TabBar } from "@/components/tab-bar";
import { TransfersList } from "@/components/transfers-list";
import {
  DataRow,
  EmptyState,
  Pill,
  SectionHeading,
  SkeletonBlock,
  SkeletonRows,
} from "@/components/ui";
import { leagueLogo, playerImage } from "@/lib/assets";
import { getLeague } from "@/lib/fotmob";
import { countryName, hexAlpha } from "@/lib/format";
import { computeForm } from "@/lib/stats";
import type { LeagueTableWrapper } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "table", label: "Table" },
  { value: "fixtures", label: "Fixtures" },
  { value: "stats", label: "Stats" },
  { value: "transfers", label: "Transfers" },
  { value: "seasons", label: "Seasons" },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.value));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const league = await getLeague(id);
    const name = league.details.name;
    return {
      title: `${name} — Table, fixtures, results & stats`,
      description: `Follow ${name}: live scores, the latest table, fixtures, form, top scorers, transfers and season stats.`,
      openGraph: {
        title: `${name} · Touchline`,
        description: `Table, fixtures, results and stats for ${name}.`,
      },
    };
  } catch {
    return { title: "Competition" };
  }
}

export default function LeaguePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<LeagueSkeleton />}>
      <LeagueContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LeagueContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const sp = await searchParams;
  const rawTab = typeof sp.tab === "string" ? sp.tab : "overview";
  const tab = VALID_TABS.has(rawTab) ? rawTab : "overview";
  const season = typeof sp.season === "string" ? sp.season : undefined;
  const league = await getLeague(id, season);

  const color = league.details.leagueColor ?? "#c8f751";
  const table = league.table?.[0];
  const fixtures = league.fixtures?.allMatches ?? [];
  const form = computeForm(fixtures);
  const allSeasons = league.allAvailableSeasons ?? [];
  const playerGroups = league.stats?.players?.length
    ? league.stats.players
    : [];
  const teamGroups = league.stats?.teams ?? [];
  const transferList = Array.isArray(league.transfers?.data) ? league.transfers.data : [];
  const overviewFixtures = league.overview?.matches?.allMatches ?? fixtures;
  const unplayedIndex =
    league.overview?.matches?.firstUnplayedMatch?.firstUnplayedMatchIndex ??
    league.fixtures?.firstUnplayedMatch?.firstUnplayedMatchIndex ??
    overviewFixtures.findIndex((fixture) => !fixture.status.started);

  const latest =
    unplayedIndex > 0
      ? overviewFixtures.slice(Math.max(0, unplayedIndex - 4), unplayedIndex).reverse()
      : [];
  const upcoming =
    unplayedIndex >= 0 ? overviewFixtures.slice(unplayedIndex, unplayedIndex + 4) : [];

  const topScorer = playerGroups.find((group) => group.header === "Top scorer")?.topThree?.[0];
  const basePath = `/league/${id}`;
  const preservedSeason = season ? { season } : {};

  return (
    <div className="shell py-6 md:py-8">
      <section
        className="card relative overflow-hidden rounded-[28px] p-4 sm:p-6"
        style={{
          backgroundImage: `radial-gradient(760px 300px at -5% -30%, ${hexAlpha(color, 0.26)}, transparent 66%), radial-gradient(500px 220px at 105% -20%, ${hexAlpha("#67c7ff", 0.08)}, transparent 70%)`,
        }}
      >
        <Image
          src={leagueLogo(league.details.id)}
          alt=""
          width={220}
          height={220}
          className="logo-watermark pointer-events-none absolute -right-10 -top-12 h-56 w-56 rotate-6 object-contain opacity-[0.055]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-y-5 left-0 w-[3px] rounded-r-full"
          style={{ backgroundColor: hexAlpha(color, 0.85) }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.05] p-2 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.9)] sm:h-[76px] sm:w-[76px] sm:rounded-[22px]">
            <Image
              src={leagueLogo(league.details.id)}
              alt={league.details.name}
              width={56}
              height={56}
              priority
              className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                {countryName(league.details.country)}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">
                {league.details.selectedSeason ?? league.details.latestSeason}
              </span>
              {league.details.gender === "female" && <Pill tone="info">Women&apos;s</Pill>}
            </div>
            <h1 className="mt-2 font-display text-[30px] font-black leading-[0.92] tracking-[-0.01em] text-ink sm:text-[48px]">
              {league.details.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {table?.data?.table?.all?.length ? (
                <span className="hero-stat">
                  <b>{table.data.table.all.length}</b> teams
                </span>
              ) : null}
              {fixtures.length > 0 && (
                <span className="hero-stat">
                  <b>{fixtures.length}</b> {fixtures.length === 1 ? "fixture" : "fixtures"}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <div className="hidden text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-dim">Season</p>
              <p className="font-display text-xl font-extrabold text-ink num">
                {league.details.selectedSeason ?? league.details.latestSeason ?? "—"}
              </p>
            </div>
            <Link
              href={`${basePath}?tab=table`}
              className="btn-primary ml-auto items-center gap-1.5 px-4 py-2.5 text-xs sm:ml-0"
            >
              View table
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      <TabBar
        tabs={TABS}
        active={tab}
        basePath={basePath}
        preserve={preservedSeason}
        className="mt-4"
      />

      {tab === "overview" && (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section>
              <SectionHeading
                title="Table snapshot"
                subtitle={`${league.details.name} · ${league.details.selectedSeason ?? ""}`}
                action="Full table"
                actionHref={`${basePath}?tab=table${season ? `&season=${encodeURIComponent(season)}` : ""}`}
                icon={<TrophyIcon size={17} />}
              />
              <div className="mt-3">
                <LeagueTable wrapper={table} limit={6} showLegend={false} />
              </div>
            </section>

            {(latest.length > 0 || upcoming.length > 0) && (
              <section>
                <SectionHeading
                  title="Around the league"
                  subtitle="Latest results and what is next"
                  action="All fixtures"
                  actionHref={`${basePath}?tab=fixtures${season ? `&season=${encodeURIComponent(season)}` : ""}`}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="card overflow-hidden">
                    <div className="border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Latest results
                      </h3>
                    </div>
                    <div className="divide-y divide-line/40">
                      {latest.length > 0 ? (
                        latest.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)
                      ) : (
                        <p className="px-4 py-6 text-center text-xs text-dim">No results yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="card overflow-hidden">
                    <div className="border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Upcoming
                      </h3>
                    </div>
                    <div className="divide-y divide-line/40">
                      {upcoming.length > 0 ? (
                        upcoming.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)
                      ) : (
                        <p className="px-4 py-6 text-center text-xs text-dim">Season complete.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {playerGroups.length > 0 && (
              <section>
                <SectionHeading
                  title="Season leaders"
                  subtitle="Goals, assists and ratings"
                  action="All stats"
                  actionHref={`${basePath}?tab=stats${season ? `&season=${encodeURIComponent(season)}` : ""}`}
                  icon={<DataIcon size={17} />}
                />
                <div className="mt-3">
                  <StatLeaders groups={playerGroups} limit={4} />
                </div>
              </section>
            )}

            {transferList.length > 0 && (
              <section>
                <SectionHeading
                  title="Latest transfers"
                  subtitle="Arrivals and departures across the league"
                  action="All transfers"
                  actionHref={`${basePath}?tab=transfers${season ? `&season=${encodeURIComponent(season)}` : ""}`}
                />
                <div className="mt-3">
                  <TransfersList transfers={transferList} limit={6} />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {topScorer && (
              <div className="card relative overflow-hidden p-4">
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />
                <div className="flex items-center justify-between">
                  <p className="eyebrow flex items-center gap-1.5">
                    <TrophyIcon size={12} /> Golden boot
                  </p>
                  <span className="text-[10px] font-semibold text-dim">Top scorer</span>
                </div>
                <Link
                  href={`/player/${topScorer.id}`}
                  className="group relative mt-3 flex items-center gap-3"
                >
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.07]">
                    <Image
                      src={playerImage(topScorer.id)}
                      alt={topScorer.name}
                      width={64}
                      height={64}
                      className="h-full w-full scale-110 object-cover object-top"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[15px] font-bold text-ink transition-colors group-hover:text-accent">
                      {topScorer.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-dim">
                      {topScorer.teamName}
                    </span>
                    <span className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-2xl font-extrabold text-accent num">
                        {topScorer.value}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">
                        goals
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
            )}

            <div className="card p-4">
              <p className="eyebrow mb-1">Competition facts</p>
              <div className="divide-y divide-line/40">
                <DataRow label="Country" value={countryName(league.details.country)} />
                <DataRow
                  label="Season"
                  value={league.details.selectedSeason ?? league.details.latestSeason ?? "—"}
                />
                <DataRow label="Teams" value={table?.data?.table?.all?.length ?? "—"} />
                <DataRow label="Matches" value={fixtures.length || "—"} />
                <DataRow
                  label="Gender"
                  value={league.details.gender === "female" ? "Women's" : "Men's"}
                />
              </div>
            </div>

            {teamGroups.length > 0 && (
              <div>
                <SectionHeading title="Top rated teams" className="mb-3" />
                <StatLeaders groups={teamGroups} limit={1} />
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "table" && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">League table</h2>
              <p className="text-xs text-dim">
                {league.details.selectedSeason} · {league.details.name}
              </p>
            </div>
            <ViewToggle
              basePath={basePath}
              view={typeof sp.view === "string" ? sp.view : "all"}
              season={season}
            />
          </div>
          <LeagueTable
            wrapper={tableView(table, typeof sp.view === "string" ? sp.view : "all")}
            form={form}
            showLegend
          />
        </div>
      )}

      {tab === "fixtures" && (
        <div className="mt-6">
          <SectionHeading
            title="Fixtures & results"
            subtitle={`${fixtures.length} matches · ${league.details.selectedSeason ?? ""}`}
          />
          <div className="mt-3">
            <FixtureList fixtures={fixtures} />
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="mt-6 space-y-8">
          {playerGroups.length > 0 ? (
            <>
              <section>
                <SectionHeading
                  title="Player leaders"
                  subtitle={`${playerGroups.length} stat categories · ${league.details.selectedSeason ?? ""}`}
                  icon={<DataIcon size={17} />}
                />
                <div className="mt-3">
                  <StatLeaders groups={playerGroups} limit={playerGroups.length} />
                </div>
              </section>
              {teamGroups.length > 0 && (
                <section>
                  <SectionHeading
                    title="Team stats"
                    subtitle={`${teamGroups.length} team categories`}
                  />
                  <div className="mt-3">
                    <StatLeaders groups={teamGroups} limit={teamGroups.length} />
                  </div>
                </section>
              )}
            </>
          ) : (
            <EmptyState
              title="Stats coming soon"
              description="Detailed season statistics are not available for this competition yet."
              icon={<DataIcon size={22} />}
            />
          )}
        </div>
      )}

      {tab === "transfers" && (
        <div className="mt-6">
          <SectionHeading
            title="Transfers"
            subtitle={`${transferList.length} moves recorded · ${league.details.selectedSeason ?? ""}`}
          />
          <div className="mt-3">
            <TransfersList transfers={transferList} />
          </div>
        </div>
      )}

      {tab === "seasons" && (
        <div className="mt-6">
          <SectionHeading
            title="Seasons"
            subtitle="Jump back through the archive"
            icon={<TrophyIcon size={17} />}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {allSeasons.map((seasonName) => {
              const active = seasonName === league.details.selectedSeason;
              const href = `?season=${encodeURIComponent(seasonName)}`;
              return (
                <Link
                  key={seasonName}
                  href={href}
                  className={`card card-hover flex items-center justify-between px-4 py-3 text-sm font-semibold ${
                    active ? "border-accent/30 text-accent" : "text-muted"
                  }`}
                >
                  {seasonName}
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : (
                    <ChevronRightIcon size={14} className="text-dim" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function tableView(wrapper: LeagueTableWrapper | undefined, view: string) {
  if (!wrapper || (view !== "home" && view !== "away")) return wrapper;
  const rows = wrapper.data.table[view];
  if (!rows?.length) return wrapper;
  return {
    ...wrapper,
    data: {
      ...wrapper.data,
      table: { ...wrapper.data.table, all: rows },
    },
  };
}

function ViewToggle({
  basePath,
  view,
  season,
}: {
  basePath: string;
  view: string;
  season?: string;
}) {
  const items = [
    { value: "all", label: "Overall" },
    { value: "home", label: "Home" },
    { value: "away", label: "Away" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-line bg-black/25 p-1">
      {items.map((item) => {
        const active = view === item.value;
        const params = new URLSearchParams({ tab: "table", view: item.value });
        if (season) params.set("season", season);
        return (
          <Link
            key={item.value}
            href={`${basePath}?${params.toString()}`}
            scroll={false}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              active ? "bg-white/[0.08] text-ink" : "text-dim hover:text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function LeagueSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-36 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-11 rounded-xl" />
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SkeletonRows rows={6} />
          <SkeletonRows rows={4} />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-56" />
        </div>
      </div>
    </div>
  );
}
