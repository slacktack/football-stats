import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TeamFixtureList } from "@/components/fixture-list";
import {
  ChartIcon,
  ChevronRightIcon,
  GlobeIcon,
  MapPinIcon,
  ShirtIcon,
  TransferIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import { LeagueTable } from "@/components/league-table";
import { StatLeaders } from "@/components/stat-leaders";
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
  Pill,
  SectionHeading,
  SkeletonBlock,
  SkeletonRows,
} from "@/components/ui";
import { leagueLogo, teamCrest } from "@/lib/assets";
import { getTeam } from "@/lib/fotmob";
import { countryName, hexAlpha, ordinal } from "@/lib/format";
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
    <Suspense fallback={<TeamSkeleton />}>
      <TeamContent params={params} searchParams={searchParams} />
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
  const color = details.teamColor ?? "#c8f751";
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

  return (
    <div className="shell py-6 md:py-8">
      <section
        className="card relative overflow-hidden rounded-[28px] p-4 sm:p-6"
        style={{
          backgroundImage: `radial-gradient(720px 260px at -5% -40%, ${hexAlpha(color, 0.2)}, transparent 68%), radial-gradient(480px 200px at 105% -30%, ${hexAlpha("#67c7ff", 0.06)}, transparent 70%)`,
        }}
      >
        <Image
          src={teamCrest(details.id)}
          alt=""
          width={240}
          height={240}
          className="pointer-events-none absolute -right-8 -top-12 h-60 w-60 object-contain opacity-[0.06]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-y-5 left-0 w-[3px] rounded-r-full"
          style={{ backgroundColor: hexAlpha(color, 0.85) }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="team-crest-frame flex h-[88px] w-[88px] shrink-0 items-center justify-center border border-white/10 p-2.5">
            <Image
              src={teamCrest(details.id)}
              alt={details.name}
              width={72}
              height={72}
              priority
              className="h-[72px] w-[72px] object-contain"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {details.primaryLeagueId && (
                <Link
                  href={`/league/${details.primaryLeagueId}`}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent"
                >
                  <Image
                    src={leagueLogo(details.primaryLeagueId)}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                  {details.primaryLeagueName}
                </Link>
              )}
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
                {countryName(details.country)}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
                {details.latestSeason}
              </span>
            </div>
            <h1 className="mt-2 font-display text-[34px] font-black leading-[0.92] tracking-[-0.04em] text-ink sm:text-[48px]">
              {details.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {teamRow && (
                <Pill tone="accent">
                  {ordinal(teamRow.idx)} · {teamRow.pts} pts
                </Pill>
              )}
              {roster.length > 0 && (
                <Pill>
                  <UsersIcon size={12} /> {roster.length} players
                </Pill>
              )}
              {team.overview?.teamForm?.length ? (
                <span className="flex items-center gap-1">
                  {team.overview.teamForm.slice(0, 5).map((item, index) => (
                    <span
                      key={`${item.date?.utcTime ?? index}`}
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-extrabold ${
                        item.result === 1
                          ? "bg-emerald-400/15 text-emerald-300"
                          : item.result === -1
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/[0.07] text-muted"
                      }`}
                      title={`${item.home?.name ?? ""} ${item.score ?? ""} ${item.away?.name ?? ""}`}
                    >
                      {item.resultString}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          </div>
          <Link
            href={`${basePath}?tab=fixtures`}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-on-accent transition-opacity hover:opacity-90 sm:flex"
          >
            Fixtures
            <ChevronRightIcon size={14} />
          </Link>
        </div>
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
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
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
                    className="text-[10px] font-semibold text-dim transition-colors hover:text-accent"
                  >
                    All trophies
                  </Link>
                </div>
                <div className="mt-2 divide-y divide-line/40">
                  {trophies.filter((trophy) => (trophy.won ?? 0) > 0).slice(0, 5).map((trophy) => (
                    <div key={trophy.name} className="flex items-center gap-2 py-2.5">
                      <TrophyIcon size={13} className="shrink-0 text-accent/80" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted">
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-accent">
                {manager.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{manager.name}</p>
                <p className="text-[10px] text-dim">
                  {manager.first} – {manager.last} · {manager.seasons} seasons
                </p>
              </div>
              <div className="text-right text-[10px] text-dim">
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
