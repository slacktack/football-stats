import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ChevronRightIcon, TrophyIcon } from "@/components/icons";
import { LeagueTable } from "@/components/league-table";
import { HighlightsPlayer } from "@/components/match/highlights";
import { ScoreBug } from "@/components/match/scorebug";
import { PlayerRatingsBoard, RatingLegend } from "@/components/match/player-ratings";
import {
  AttackingZones,
  InsightsCard,
  TopRatedCard,
  FormStrip,
  H2HList,
  Lineups,
  MatchInfoCard,
  MatchShotMap,
  MatchStatsPanel,
  MomentumChart,
  PlayerOfTheMatch,
  Timeline,
} from "@/components/match/match-panels";
import { TabBar } from "@/components/tab-bar";
import { EmptyState, SectionHeading, SkeletonBlock } from "@/components/ui";
import { Panel } from "@/components/tl";
import { getLeague, getMatch } from "@/lib/fotmob";
import { isLive } from "@/lib/format";
import { normalizeMatchPlayers, youtubeId } from "@/lib/match-players";
import type { MatchStats, TeamFormEntry } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "summary", label: "Summary" },
  { value: "players", label: "Player ratings" },
  { value: "lineups", label: "Lineups" },
  { value: "stats", label: "Stats" },
  { value: "table", label: "Table" },
  { value: "h2h", label: "Head to head" },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.value));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return {};
  try {
    const match = await getMatch(id);
    const home = match.general.homeTeam?.name ?? "Home";
    const away = match.general.awayTeam?.name ?? "Away";
    return {
      title: `${home} vs ${away} · ${match.general.leagueName ?? "Match"}`,
      description: `${home} vs ${away} match centre: score, lineups, stats and head to head.`,
    };
  } catch {
    return {};
  }
}

export default function MatchPage({
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
          <MatchSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <MatchContent params={params} searchParams={searchParams} />
      </ViewTransition>
    </Suspense>
  );
}

async function MatchContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const sp = await searchParams;
  const rawTab = typeof sp.tab === "string" ? sp.tab : "summary";
  const tab = VALID_TABS.has(rawTab) ? rawTab : "summary";

  const match = await getMatch(id).catch(() => null);
  if (!match?.general || !match.header?.teams?.length) notFound();

  const general = match.general;
  const home = general.homeTeam ?? match.header.teams[0];
  const away = general.awayTeam ?? match.header.teams[1];
  if (!home || !away) notFound();

  const status = match.header.status;
  const live = isLive(status);
  const started = general.started ?? status.started ?? false;
  const finished = general.finished ?? status.finished ?? false;
  const facts = match.content.matchFacts;
  const colors = general.teamColors;
  const homeColor = colors?.lightMode?.home ?? "var(--tl-led)";
  const awayColor = colors?.lightMode?.away ?? "var(--tl-alert)";
  const venue = facts?.infoBox?.Stadium;
  const tableSource =
    match.content.table?.parentLeagueId ?? general.parentLeagueId ?? general.leagueId;
  const videoId = youtubeId(facts?.highlights?.url);
  const players =
    tab === "players"
      ? normalizeMatchPlayers(match.content.playerStats, Number(home.id), match.content.lineup)
      : [];
  const xg = statPair(match.content.stats, "expected_goals");
  const scorers = goalScorers(match.header.events);
  const tableLeague =
    tab === "table" ? await getLeague(tableSource).catch(() => null) : null;

  return (
    <div className="tl-view shell py-5 md:py-7">
      <nav className="tl-k tl-k-dim mb-3 flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-ink">
          Football
        </Link>
        <ChevronRightIcon size={10} />
        <Link
          href={`/league/${general.parentLeagueId ?? general.leagueId}`}
          className="transition-colors hover:text-ink"
        >
          {general.leagueName ?? "Competition"}
        </Link>
        {general.matchRound && (
          <>
            <ChevronRightIcon size={10} />
            <span>Round {general.matchRound}</span>
          </>
        )}
      </nav>

      <ScoreBug
        home={{ id: home.id, name: home.name }}
        away={{ id: away.id, name: away.name }}
        homeColor={homeColor}
        awayColor={awayColor}
        photo={facts?.highlights?.image}
        score={scoreParts(status.scoreStr, home.score, away.score)}
        live={live}
        started={started}
        finished={finished}
        statusLong={status.reason?.long}
        liveMinute={status.liveTime?.short}
        utcTime={status.utcTime}
        league={{ id: general.parentLeagueId ?? general.leagueId, logoId: general.parentLeagueId ?? general.leagueId, name: general.leagueName }}
        round={general.matchRound}
        scorers={scorers}
        xg={xg}
        venue={[venue?.name, venue?.city].filter(Boolean).join(", ") || undefined}
        referee={facts?.infoBox?.Referee?.text}
        attendance={facts?.infoBox?.Attendance}
      />

      <div className="mt-4">
        <TabBar tabs={TABS} active={tab} basePath={`/match/${id}`} />
      </div>

      <ViewTransition key={tab} enter="tab-swap" exit="tab-swap" default="none">
      <div className="mt-5">
        {tab === "summary" && (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              {videoId && facts?.highlights?.url && (
                <HighlightsPlayer
                  videoId={videoId}
                  url={facts.highlights.url}
                  thumbnail={facts.highlights.image}
                  source={facts.highlights.source}
                  title={`${home.name} ${status.scoreStr ?? "vs"} ${away.name}`}
                />
              )}
              <Timeline
                facts={facts}
                homeTeam={{ id: home.id, name: home.name }}
                awayTeam={{ id: away.id, name: away.name }}
                live={live}
                minute={status.liveTime?.short}
              />
              <MomentumChart
                data={match.content.momentum?.main?.data}
                homeName={home.name}
                awayName={away.name}
              />
              <MatchShotMap
                shots={match.content.shotmap?.shots}
                homeId={Number(home.id)}
                awayId={Number(away.id)}
                homeName={home.name}
                awayName={away.name}
              />
              <AttackingZones zones={match.content.attackingZones} homeName={home.name} awayName={away.name} />
            </div>
            <aside className="stagger space-y-3">
              {facts?.playerOfTheMatch && <PlayerOfTheMatch player={facts.playerOfTheMatch} />}
              <TopRatedCard
                home={{ id: home.id, name: home.name }}
                away={{ id: away.id, name: away.name }}
                topPlayers={facts?.topPlayers}
              />
              <InsightsCard
                insights={facts?.insights}
                home={{ id: home.id, name: home.name }}
                away={{ id: away.id, name: away.name }}
              />
              <FormCard home={home} away={away} forms={facts?.teamForm} />
              <MatchInfoCard
                facts={facts}
                homeTeam={{ name: home.name }}
                awayTeam={{ name: away.name }}
              />
              {match.content.weather?.description && (
                <Panel label="Weather" aside={`wind ${match.content.weather.windSpeed ?? 0} km/h`}>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[12px] font-semibold text-muted">
                      {match.content.weather.description}
                    </p>
                    <p className="tl-num text-[30px] text-ink">
                      {match.content.weather.temperature}°
                    </p>
                  </div>
                </Panel>
              )}
            </aside>
          </div>
        )}

        {tab === "players" && (
          <PlayerRatingsBoard
            players={players}
            home={{ id: Number(home.id), name: home.name }}
            away={{ id: Number(away.id), name: away.name }}
          />
        )}

        {tab === "lineups" && (
          <Lineups
            lineup={match.content.lineup}
            colors={colors}
            homeTeam={{ id: home.id, name: home.name }}
            awayTeam={{ id: away.id, name: away.name }}
            events={facts?.events?.events ?? []}
          />
        )}

        {tab === "stats" && (
          <div className="mx-auto max-w-3xl">
            <MatchStatsPanel
              stats={match.content.stats}
              homeName={home.name}
              awayName={away.name}
            />
          </div>
        )}

        {tab === "table" && (
          <div className="mx-auto max-w-3xl space-y-3">
            <SectionHeading
              title="League table"
              subtitle={general.leagueName ?? "Competition standings"}
            />
            {tableLeague?.table ? (
              <LeagueTable
                wrapper={tableLeague.table[0]}
                highlight={[home.id, away.id]}
              />
            ) : (
              <EmptyState
                icon={<TrophyIcon size={20} />}
                title="Table not available"
                description="This competition does not expose a standings table for this stage."
              />
            )}
          </div>
        )}

        {tab === "h2h" && (
          <div className="mx-auto max-w-3xl">
            <H2HList
              h2h={match.content.h2h}
              homeTeam={{ id: home.id, name: home.name }}
              awayTeam={{ id: away.id, name: away.name }}
            />
          </div>
        )}
        {tab === "lineups" && (
          <div className="mt-3">
            <RatingLegend />
          </div>
        )}
      </div>
      </ViewTransition>
    </div>
  );
}

function scoreParts(scoreStr?: string, home?: number, away?: number): [string, string] | null {
  const parts = scoreStr?.split(" - ").map((v) => v.trim());
  if (parts?.length === 2) return [parts[0], parts[1]];
  return home != null && away != null ? [String(home), String(away)] : null;
}

function statPair(stats: MatchStats | undefined, key: string): [string, string] | null {
  for (const group of stats?.Periods?.All?.stats ?? []) {
    const row = group.stats?.find((item) => item.key === key);
    if (row?.stats?.[0] != null && row.stats[1] != null) return [String(row.stats[0]), String(row.stats[1])];
  }
  return null;
}

type GoalEvent = { time?: number; timeStr?: string | number; ownGoal?: boolean | null; suffix?: string | null; player?: { id?: number; name?: string } };

function goalScorers(events: unknown) {
  const e = (events ?? {}) as { homeTeamGoals?: Record<string, GoalEvent[]>; awayTeamGoals?: Record<string, GoalEvent[]> };
  const flatten = (map?: Record<string, GoalEvent[]>) =>
    Object.entries(map ?? {}).map(([name, goals]) => ({
      name,
      id: goals[0]?.player?.id,
      minutes: goals.map((g) => `${g.timeStr ?? g.time}'${g.ownGoal ? " OG" : g.suffix === "pen" ? " P" : ""}`),
    }));
  return { home: flatten(e.homeTeamGoals), away: flatten(e.awayTeamGoals) };
}

function FormCard({
  home,
  away,
  forms,
}: {
  home: { name: string };
  away: { name: string };
  forms?: TeamFormEntry[][];
}) {
  if (!forms?.length) return null;
  return (
    <Panel label="Recent form" aside="last five">
      {[
        { name: home.name, form: forms[0] },
        { name: away.name, form: forms[1] },
      ].map((row) => (
        <div key={row.name} className="flex items-center justify-between gap-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-muted">
            {row.name}
          </span>
          <FormStrip form={row.form} />
        </div>
      ))}
    </Panel>
  );
}

function MatchSkeleton() {
  return (
    <div className="shell space-y-4 py-6">
      <SkeletonBlock className="h-4 w-48" />
      <SkeletonBlock className="h-56" />
      <SkeletonBlock className="h-10 w-full" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-56" />
      </div>
    </div>
  );
}
