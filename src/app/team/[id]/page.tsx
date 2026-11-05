import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { TeamFixtureList } from "@/components/fixture-list";
import {
  ChartIcon,
  ChevronRightIcon,
  GlobeIcon,
  MapPinIcon,
  ShirtIcon,
  StarIcon,
  TransferIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import { LeagueTable } from "@/components/league-table";
import { StatLeaders } from "@/components/stat-leaders";
import {
  asTopPlayers,
  FixtureDifficultyCard,
  LastLineupCard,
  TopPlayersBoard,
  type FixtureDifficulty,
  type LastLineup,
} from "@/components/team/team-insights";
import { TabBar } from "@/components/tab-bar";
import {
  MatchResultCard,
  NextMatchCard,
  SquadGrid,
  SquadPreview,
  TeamFormCard,
  TeamStatGrid,
  TrophyGrid,
} from "@/components/team/team-cards";
import { TransfersList } from "@/components/transfers-list";
import {
  DataRow,
  EmptyState,
  SectionHeading,
  SkeletonBlock,
  SkeletonRows,
  FormPill,
} from "@/components/ui";
import { teamCrest } from "@/lib/assets";
import { getTeam } from "@/lib/fotmob";
import { countryName, inkFor, ordinal } from "@/lib/format";
import { findTeamRow } from "@/lib/stats";
import type {
  LeagueTableWrapper,
  TeamResponse,
  TeamTransfersData,
  Transfer,
} from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "fixtures", label: "Fixtures" },
  { value: "squad", label: "Squad" },
  { value: "stats", label: "Stats" },
  { value: "transfers", label: "Transfers" },
  { value: "history", label: "History" },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.value));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const team = await getTeam(id);
    return {
      title: `${team.details.name} — Fixtures, squad, stats & results`,
      description: `${team.details.name} team profile: next matches, recent form, full squad, player ratings, transfers, honours and club stats.`,
      openGraph: {
        title: `${team.details.name} · Touchline`,
        description: `Fixtures, results, squad and stats for ${team.details.name}.`,
      },
    };
  } catch {
    return { title: "Team" };
  }
}

export default function TeamPage({
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
          <TeamSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <TeamContent params={params} searchParams={searchParams} />
      </ViewTransition>
    </Suspense>
  );
}

async function TeamContent({
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
  const team = await getTeam(id);
  if (!team?.details) notFound();

  const details = team.details;
  const color = details.teamColor ?? "#39ff6b";
  const basePath = `/team/${id}`;
  const tableCandidates = team.overview?.table ?? team.table ?? [];
  const primaryTable =
    tableCandidates.find(
      (wrapper) => String(wrapper.data.leagueId) === String(details.primaryLeagueId),
    ) ?? tableCandidates[0];
  const tableRows = primaryTable?.data?.table?.all;
  const teamRow = findTeamRow(tableRows, id);

  const squadGroups = team.overview?.squad ?? team.squad?.squad ?? [];
  const roster = squadGroups
    .filter((group) => group.title !== "coach")
    .flatMap((group) => group.members);
  const coach = squadGroups.find((group) => group.title === "coach")?.members?.[0];
  const averageAge = roster.length
    ? roster.reduce((sum, member) => sum + (member.age ?? 0), 0) /
      roster.filter((member) => member.age).length
    : undefined;

  const fixtures = team.fixtures?.allFixtures?.fixtures ?? [];
  const nextMatch = team.overview?.nextMatch ?? team.fixtures?.allFixtures?.nextMatch;
  const lastMatch = team.overview?.lastMatch ?? team.fixtures?.allFixtures?.lastMatch;
  const transfers = collectTransfers(team.transfers);
  const playerGroups = team.stats?.players ?? [];
  const teamStats = team.stats?.teams ?? [];
  const trophies = team.history?.trophyList ?? [];
  const news = team.overview?.newsSummary?.items?.[0];
  const venue = team.overview?.venue;
  const venuePairs = new Map(venue?.statPairs ?? []);
  const overviewExtra = team.overview as
    | { topPlayers?: unknown; lastLineupStats?: LastLineup; fixtureDifficulty?: FixtureDifficulty }
    | undefined;
  const topPlayers = asTopPlayers(overviewExtra?.topPlayers);

  return (
    <div className="shell py-6 md:py-8">
      <section className="kit-hero" style={{ "--kit": color, "--kit-ink": inkFor(color) } as React.CSSProperties}>
        <div className="kit-hero-slab">
          <div className="relative z-[1] min-w-0 flex-1 self-center py-5 pl-4 sm:py-8 sm:pl-7">
            {details.primaryLeagueId && (
              <Link href={`/league/${details.primaryLeagueId}`} className="text-[13px] font-semibold opacity-85 hover:underline hover:opacity-100">
                {details.primaryLeagueName} {details.latestSeason}
              </Link>
            )}
            <h1 className="kit-hero-name">{details.name}</h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm font-semibold">
              {teamRow && (
                <span>
                  <span className="kit-hero-number">{ordinal(teamRow.idx)}</span> with {teamRow.pts} pts
                </span>
              )}
              {coach?.name && <span className="opacity-80">Coach {coach.name}</span>}
              <span className="opacity-80">{countryName(details.country)}</span>
            </p>
          </div>
          <div className="kit-hero-photo flex items-center justify-center p-3 sm:p-6">
            <Image src={teamCrest(details.id)} alt={details.name} width={240} height={240} priority className="h-full w-full object-contain" />
          </div>
        </div>
        <dl className="kit-hero-facts">
          {team.overview?.teamForm?.length ? (
            <div>
              <dt>Last five</dt>
              <dd className="flex gap-1">
                {team.overview.teamForm.slice(0, 5).map((item, index) => (
                  <FormPill key={`${item.date?.utcTime ?? index}`} result={item.result} size={24} />
                ))}
              </dd>
            </div>
          ) : null}
          {teamRow && (
            <div>
              <dt>Record</dt>
              <dd className="num">
                {teamRow.wins}W {teamRow.draws}D {teamRow.losses}L
              </dd>
            </div>
          )}
          {teamRow && (
            <div>
              <dt>Goals</dt>
              <dd className="num">{teamRow.scoresStr}</dd>
            </div>
          )}
          {roster.length > 0 && (
            <div>
              <dt>Squad</dt>
              <dd className="num">
                {roster.length} players{averageAge ? `, avg ${averageAge.toFixed(1)}` : ""}
              </dd>
            </div>
          )}
          <Link href={`${basePath}?tab=fixtures`} className="btn-primary press ml-auto px-4 py-2 text-sm">
            Fixtures
          </Link>
        </dl>
      </section>

      <TabBar tabs={TABS} active={tab} basePath={basePath} className="mt-4" />

      {tab === "overview" && (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section>
              <div className="grid gap-3 sm:grid-cols-2">
                <NextMatchCard fixture={nextMatch} teamId={Number(id)} />
                <MatchResultCard fixture={lastMatch} teamId={Number(id)} label="Last match" />
              </div>
              <div className="mt-3">
                <TeamFormCard
                  form={team.overview?.teamForm}
                  href={`${basePath}?tab=fixtures`}
                  teamId={Number(id)}
                />
              </div>
            </section>

            {topPlayers && (
              <section>
                <SectionHeading
                  title="Top performers"
                  subtitle={`${details.primaryLeagueName ?? "League"} · this season`}
                  action="All stats"
                  actionHref={`${basePath}?tab=stats`}
                  icon={<ChartIcon size={17} />}
                />
                <div className="mt-3">
                  <TopPlayersBoard data={topPlayers} />
                </div>
              </section>
            )}

            {overviewExtra?.lastLineupStats?.starters?.length ? (
              <section>
                <SectionHeading
                  title="Player ratings"
                  subtitle="Starting XI from the last match"
                  icon={<StarIcon size={17} />}
                />
                <div className="mt-3">
                  <LastLineupCard data={overviewExtra.lastLineupStats} />
                </div>
              </section>
            ) : null}

            <section>
              <SectionHeading
                title="League position"
                subtitle={primaryTable?.data?.leagueName ?? details.primaryLeagueName}
                action="Full table"
                actionHref={
                  details.primaryLeagueId
                    ? `/league/${details.primaryLeagueId}?tab=table`
                    : "/leagues"
                }
                icon={<TrophyIcon size={17} />}
              />
              <div className="mt-3">
                <LeagueTable
                  wrapper={aroundTable(primaryTable, id, 5)}
                  highlight={[id]}
                  showLegend={false}
                />
              </div>
            </section>

            <section>
              <SectionHeading
                title="Squad"
                subtitle={`${roster.length} players · coach ${coach?.name ?? "TBC"}`}
                action="Full squad"
                actionHref={`${basePath}?tab=squad`}
                icon={<ShirtIcon size={17} />}
              />
              <div className="mt-3">
                <SquadPreview groups={squadGroups} />
              </div>
            </section>

            {news?.summary && (
              <section>
                <SectionHeading
                  title="Club news"
                  subtitle={news.source?.sourceName ? `via ${news.source.sourceName}` : undefined}
                  icon={<GlobeIcon size={17} />}
                />
                <article className="card mt-3 p-4">
                  <p className="text-sm leading-relaxed text-muted">{news.summary}</p>
                  {news.source?.uri && (
                    <a
                      href={news.source.uri}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                    >
                      Read the full story
                      <ChevronRightIcon size={12} />
                    </a>
                  )}
                </article>
              </section>
            )}

            {transfers.length > 0 && (
              <section>
                <SectionHeading
                  title="Transfers"
                  subtitle="Latest arrivals and departures"
                  action="All transfers"
                  actionHref={`${basePath}?tab=transfers`}
                  icon={<TransferIcon size={17} />}
                />
                <div className="mt-3">
                  <TransfersList transfers={transfers} teamId={Number(id)} limit={4} />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <FixtureDifficultyCard data={overviewExtra?.fixtureDifficulty} />
            <div className="card p-4">
              <p className="eyebrow mb-1">Club profile</p>
              <div className="divide-y divide-line/40">
                <DataRow label="Country" value={countryName(details.country)} />
                {details.primaryLeagueName && (
                  <DataRow
                    label="League"
                    value={
                      <Link
                        href={`/league/${details.primaryLeagueId}`}
                        className="text-accent hover:underline"
                      >
                        {details.primaryLeagueName}
                      </Link>
                    }
                  />
                )}
                {coach && <DataRow label="Head coach" value={coach.name} />}
                {venue?.widget?.name && (
                  <DataRow
                    label="Stadium"
                    value={
                      <span className="flex items-center justify-end gap-1">
                        <MapPinIcon size={12} className="text-dim" />
                        {venue.widget.name}
                      </span>
                    }
                  />
                )}
                {venuePairs.get("Capacity") && (
                  <DataRow label="Capacity" value={Number(venuePairs.get("Capacity")).toLocaleString("en-GB")} />
                )}
                {venuePairs.get("Opened") && <DataRow label="Opened" value={venuePairs.get("Opened")} />}
                <DataRow label="Squad" value={roster.length || "—"} />
                {averageAge && <DataRow label="Avg. age" value={averageAge.toFixed(1)} />}
              </div>
            </div>

            {trophies.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Honours</p>
                  <Link
                    href={`${basePath}?tab=history`}
                    className="text-[11px] font-semibold text-dim transition-colors hover:text-accent"
                  >
                    All trophies
                  </Link>
                </div>
                <div className="mt-2 divide-y divide-line/40">
                  {trophies.filter((trophy) => (trophy.won ?? 0) > 0).slice(0, 5).map((trophy) => (
                    <div key={trophy.name} className="flex items-center gap-2 py-2.5">
                      <TrophyIcon size={13} className="shrink-0 text-accent/80" />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">
                        {trophy.name}
                      </span>
                      <span className="text-xs font-bold text-ink num">{trophy.won ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>
      )}

      {tab === "fixtures" && (
        <div className="mt-6">
          <SectionHeading
            title="Fixtures & results"
            subtitle={`${fixtures.length} matches · ${details.latestSeason ?? ""}`}
          />
          <div className="mt-3">
            <TeamFixtureList fixtures={fixtures} highlightTeamId={Number(id)} />
          </div>
        </div>
      )}

      {tab === "squad" && (
        <div className="mt-6">
          <SectionHeading
            title="Squad"
            subtitle={`${roster.length} players · ${details.latestSeason ?? ""}`}
            icon={<UsersIcon size={17} />}
          />
          <div className="mt-4">
            <SquadGrid groups={squadGroups} />
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="mt-6 space-y-8">
          <section>
            <SectionHeading
              title="Player leaders"
              subtitle="How the squad ranks across the league"
              icon={<ChartIcon size={17} />}
            />
            <div className="mt-3">
              <StatLeaders
                groups={playerGroups}
                limit={12}
                highlightTeamId={Number(id)}
              />
            </div>
          </section>
          <section>
            <SectionHeading
              title="Team profile"
              subtitle="League rank and season totals"
            />
            <div className="mt-3">
              <TeamStatGrid groups={teamStats} highlightTeamId={Number(id)} />
            </div>
          </section>
        </div>
      )}

      {tab === "transfers" && (
        <div className="mt-6">
          <SectionHeading
            title="Transfers"
            subtitle={`${transfers.length} moves · ${details.latestSeason ?? ""}`}
            icon={<TransferIcon size={17} />}
          />
          <div className="mt-3">
            <TransfersList transfers={transfers} teamId={Number(id)} />
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="mt-6 space-y-8">
          <section>
            <SectionHeading
              title="Honours"
              subtitle={`${trophies.length} competitions won`}
              icon={<TrophyIcon size={17} />}
            />
            <div className="mt-3">
              <TrophyGrid trophies={trophies} />
            </div>
          </section>
          <ManagerHistory team={team} />
        </div>
      )}

      {tab !== "overview" && !fixtures.length && tab === "fixtures" && (
        <div className="mt-6">
          <EmptyState
            title="No fixtures yet"
            description="This team has no fixtures available for the current season."
          />
        </div>
      )}
    </div>
  );
}

function aroundTable(
  wrapper: LeagueTableWrapper | undefined,
  teamId: string,
  count: number,
) {
  if (!wrapper) return undefined;
  const rows = wrapper.data.table.all;
  const index = rows.findIndex((row) => String(row.id) === teamId);
  if (index < 0 || rows.length <= count) return wrapper;
  const start = Math.max(0, Math.min(index - Math.floor(count / 2), rows.length - count));
  return {
    ...wrapper,
    data: {
      ...wrapper.data,
      table: { ...wrapper.data.table, all: rows.slice(start, start + count) },
    },
  };
}

function collectTransfers(data?: TeamTransfersData): Transfer[] {
  if (!data) return [];
  if (data.allTransfers?.length) return data.allTransfers;
  if (Array.isArray(data.data)) return data.data;
  if (data.data && typeof data.data === "object") {
    return Object.values(data.data).flat();
  }
  return [];
}

function ManagerHistory({ team }: { team: TeamResponse }) {
  const history = team.history?.coachHistory ?? [];
  if (history.length === 0) return null;

  const byName = new Map<
    string,
    { name: string; first: string; last: string; win: number; draw: number; loss: number; seasons: number }
  >();

  for (const entry of history) {
    const current = byName.get(entry.name) ?? {
      name: entry.name,
      first: entry.season,
      last: entry.season,
      win: 0,
      draw: 0,
      loss: 0,
      seasons: 0,
    };
    current.first = entry.season < current.first ? entry.season : current.first;
    current.last = entry.season > current.last ? entry.season : current.last;
    current.win += entry.win;
    current.draw += entry.draw;
    current.loss += entry.loss;
    current.seasons += 1;
    byName.set(entry.name, current);
  }

  const managers = Array.from(byName.values())
    .sort((a, b) => b.last.localeCompare(a.last))
    .slice(0, 8);

  return (
    <section>
      <SectionHeading title="Manager history" subtitle="Recent head coaches and records" />
      <div className="card mt-3 overflow-hidden">
        <div className="divide-y divide-line/40">
          {managers.map((manager) => (
            <div key={manager.name} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-accent">
                {manager.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{manager.name}</p>
                <p className="text-[11px] text-dim">
                  {manager.first} – {manager.last} · {manager.seasons} seasons
                </p>
              </div>
              <div className="text-right text-[11px] text-dim">
                <p className="font-semibold text-muted num">
                  {manager.win}W {manager.draw}D {manager.loss}L
                </p>
                <p className="num">
                  {(
                    (manager.win * 3 + manager.draw) /
                    Math.max(1, manager.win + manager.draw + manager.loss)
                  ).toFixed(2)}{" "}
                  PPG
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-44 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-11 rounded-xl" />
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
          <SkeletonRows rows={6} />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-52" />
        </div>
      </div>
    </div>
  );
}
