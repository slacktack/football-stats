import { PlayerPhoto } from "@/components/player-photo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { FixtureRow, FixtureList } from "@/components/fixture-list";
import { ChartIcon as DataIcon, ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LeagueTable, XgTable, type XgRow } from "@/components/league-table";
import { StatLeaders } from "@/components/stat-leaders";
import { asTopPlayers, TopPlayersBoard } from "@/components/team/team-insights";
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
import { K, Panel, Phos, Spark } from "@/components/tl";
import { PixelField } from "@/components/pixel-field";
import { leagueLogo } from "@/lib/assets";
import { getLeague } from "@/lib/fotmob";
import { countryName } from "@/lib/format";
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
    const name = league?.details?.name;
    if (!name) return {};
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
    <Suspense
      fallback={
        <ViewTransition exit="skeleton-out" default="none">
          <LeagueSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <LeagueContent params={params} searchParams={searchParams} />
      </ViewTransition>
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
  const league = await getLeague(id, season).catch(() => null);
  if (!league?.details) notFound();

  const table = league.table?.[0];
  const fixtures = league.fixtures?.allMatches ?? [];
  const form = computeForm(fixtures);
  const allSeasons = league.allAvailableSeasons ?? [];
  const playerGroups = league.stats?.players?.length
    ? league.stats.players
    : [];
  const teamGroups = league.stats?.teams ?? [];
  const leagueTopPlayers = asTopPlayers(league.overview?.topPlayers);
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
  const seasonLabel = league.details.selectedSeason ?? league.details.latestSeason ?? "—";

  const facts: { label: string; value: number }[] = [];
  if (table?.data?.table?.all?.length) facts.push({ label: "Teams", value: table.data.table.all.length });
  if (fixtures.length > 0)
    facts.push({ label: "Fixtures", value: fixtures.length });

  // Total goals per matchday, first round first — the competition's scoring arc.
  const rounds = new Map<string, number>();
  for (const fixture of overviewFixtures) {
    if (!fixture.status?.finished) continue;
    const key = String(fixture.roundName ?? fixture.round ?? "");
    if (!key) continue;
    const goals = Number(fixture.home?.score ?? 0) + Number(fixture.away?.score ?? 0);
    rounds.set(key, (rounds.get(key) ?? 0) + goals);
  }
  const roundTrace = [...rounds.values()].slice(-14);

  return (
    <div className="tl-view shell py-6 md:py-8">
      <section className="card relative overflow-hidden p-4 sm:p-5">
        <PixelField className="tl-field-right" step={22} />
        <Image
          src={leagueLogo(league.details.id)}
          alt=""
          width={200}
          height={200}
          className="logo-watermark pointer-events-none absolute -right-8 -top-10 h-48 w-48 rotate-6 object-contain opacity-[0.05]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-line bg-card-2/60 p-1.5 sm:h-[64px] sm:w-[64px]">
            <Image
              src={leagueLogo(league.details.id)}
              alt={league.details.name}
              width={52}
              height={52}
              priority
              className="h-11 w-11 object-contain sm:h-12 sm:w-12"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <K>{countryName(league.details.country)}</K>
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <K dim>{seasonLabel}</K>
              {league.details.gender === "female" && <Pill tone="info">Women&apos;s</Pill>}
            </div>
            <h1 className="font-display mt-1.5 text-[26px] font-bold leading-[1.05] text-ink sm:text-[38px]">
              {league.details.name}
            </h1>

            {facts.length > 0 && (
              <div className="mt-4 max-w-md">
                <Phos />
                <div className="tl-kpis mt-px">
                  {facts.map((fact) => (
                    <div key={fact.label} className="tl-kpi">
                      <span className="tl-k tl-k-dim">{fact.label}</span>
                      <b className="tl-kpi-v tl-num">{fact.value}</b>
                    </div>
                  ))}
                </div>
                {roundTrace.length > 3 && (
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <K dim>Goals / matchday</K>
                      <span className="tl-k tl-k-dim num">{roundTrace.length} rounds</span>
                    </div>
                    <Spark values={roundTrace} className="mt-2" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <div className="hidden text-right sm:block">
              <K dim>Season</K>
              <p className="tl-num text-[22px] text-ink">{seasonLabel}</p>
            </div>
            <Link
              href={`${basePath}?tab=table`}
              className="tl-btn tl-btn-inv ml-auto sm:ml-0"
            >
              View table
              <ChevronRightIcon size={13} />
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
                subtitle={`${league.details.name} · ${seasonLabel}`}
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
                  <Panel label="Latest results" aside={`${latest.length}`}>
                    <div className="divide-y divide-line">
                      {latest.length > 0 ? (
                        latest.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)
                      ) : (
                        <p className="py-3 text-center text-[11.5px] text-dim">No results yet.</p>
                      )}
                    </div>
                  </Panel>
                  <Panel label="Upcoming" aside={`${upcoming.length}`}>
                    <div className="divide-y divide-line">
                      {upcoming.length > 0 ? (
                        upcoming.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)
                      ) : (
                        <p className="py-3 text-center text-[11.5px] text-dim">Season complete.</p>
                      )}
                    </div>
                  </Panel>
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
                  {leagueTopPlayers ? (
                    <TopPlayersBoard data={leagueTopPlayers} showTeam />
                  ) : (
                    <StatLeaders groups={playerGroups} limit={4} />
                  )}
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
              <Panel
                label={
                  <>
                    <TrophyIcon size={12} /> Golden boot
                  </>
                }
                aside="Top scorer"
              >
                <Link
                  href={`/player/${topScorer.id}`}
                  className="group flex items-center gap-3"
                >
                  <span className="tl-frame flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-card-2/60">
                    <PlayerPhoto
                      playerId={topScorer.id}
                      alt={topScorer.name}
                      width={56}
                      height={56}
                      className="h-full w-full scale-110 object-cover object-top"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-bold text-ink transition-colors group-hover:text-accent">
                      {topScorer.name}
                    </span>
                    <span className="tl-k tl-k-dim block truncate">{topScorer.teamName}</span>
                    <span className="mt-2 flex items-baseline gap-1.5">
                      <span className="tl-num text-[26px] text-accent">{topScorer.value}</span>
                      <K dim>goals</K>
                    </span>
                  </span>
                </Link>
              </Panel>
            )}

            <Panel label="Competition facts">
              <div className="divide-y divide-line">
                <DataRow label="Country" value={countryName(league.details.country)} />
                <DataRow label="Season" value={seasonLabel} />
                <DataRow label="Teams" value={table?.data?.table?.all?.length ?? "—"} />
                <DataRow label="Matches" value={fixtures.length || "—"} />
                <DataRow
                  label="Gender"
                  value={league.details.gender === "female" ? "Women's" : "Men's"}
                />
              </div>
            </Panel>

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
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="tl-head text-[13px]">League table</h2>
              <p className="tl-k tl-k-dim mt-1">
                {seasonLabel} · {league.details.name}
              </p>
            </div>
            <ViewToggle
              basePath={basePath}
              view={typeof sp.view === "string" ? sp.view : "all"}
              season={season}
            />
          </div>
          {sp.view === "xg" ? (
            <XgTable
              rows={(table?.data?.table as { xg?: XgRow[] } | undefined)?.xg}
            />
          ) : (
            <LeagueTable
              wrapper={tableView(table, typeof sp.view === "string" ? sp.view : "all")}
              form={form}
              showLegend
            />
          )}
        </div>
      )}

      {tab === "fixtures" && (
        <div className="mt-6">
          <SectionHeading
            title="Fixtures & results"
            subtitle={`${fixtures.length} matches · ${seasonLabel}`}
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
                  subtitle={`${playerGroups.length} stat categories · ${seasonLabel}`}
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
            subtitle={`${transferList.length} moves recorded · ${seasonLabel}`}
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
                  className={`tl-chip w-full justify-between transition-colors ${
                    active ? "tl-chip-inv" : "text-muted hover:bg-hover"
                  }`}
                >
                  {seasonName}
                  {active ? (
                    <span className="h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden="true" />
                  ) : (
                    <ChevronRightIcon size={13} className="shrink-0 text-dim" />
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
    { value: "xg", label: "xG" },
  ];
  return (
    <div className="tl-tags">
      {items.map((item) => {
        const active = view === item.value;
        const params = new URLSearchParams({ tab: "table", view: item.value });
        if (season) params.set("season", season);
        return (
          <Link
            key={item.value}
            href={`${basePath}?${params.toString()}`}
            scroll={false}
            className={`tl-chip transition-colors ${
              active ? "tl-chip-inv" : "text-muted hover:bg-hover"
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
      <SkeletonBlock className="h-36" />
      <SkeletonBlock className="mt-4 h-10" />
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
