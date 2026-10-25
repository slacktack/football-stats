import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ChevronRightIcon,
  MapPinIcon,
  TrophyIcon,
  ArrowUpRightIcon,
} from "@/components/icons";
import { LeagueTable } from "@/components/league-table";
import { LiveRefresher } from "@/components/live-refresher";
import {
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
import { leagueLogo, playerImage, teamCrest } from "@/lib/assets";
import { getLeague, getMatch } from "@/lib/fotmob";
import { formatKickoff, hexAlpha, isLive } from "@/lib/format";
import type { MatchTopPlayer, TeamFormEntry } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "summary", label: "Summary" },
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
    <Suspense fallback={<MatchSkeleton />}>
      <MatchContent params={params} searchParams={searchParams} />
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
  const homeColor = colors?.lightMode?.home ?? "#c8f751";
  const awayColor = colors?.lightMode?.away ?? "#fb7185";
  const venue = facts?.infoBox?.Stadium;
  const tableSource =
    match.content.table?.parentLeagueId ?? general.parentLeagueId ?? general.leagueId;
  const tableLeague =
    tab === "table" ? await getLeague(tableSource).catch(() => null) : null;

  return (
    <div className="shell py-5 md:py-7">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[10px] text-dim" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-ink">
          Football
        </Link>
        <ChevronRightIcon size={10} />
        <Link
          href={`/league/${general.leagueId}`}
          className="transition-colors hover:text-ink"
        >
          {general.leagueName ?? "Competition"}
        </Link>
        {general.matchRound && (
          <>
            <ChevronRightIcon size={10} />
            <span className="text-muted">Round {general.matchRound}</span>
          </>
        )}
      </nav>

      <section
        className="match-hero card relative overflow-hidden rounded-[28px] p-4 sm:p-6"
        style={{
          backgroundImage: `radial-gradient(620px 320px at -4% 0%, ${hexAlpha(
            homeColor,
            0.24,
          )}, transparent 64%), radial-gradient(580px 300px at 104% 4%, ${hexAlpha(
            awayColor,
            0.22,
          )}, transparent 64%), linear-gradient(108deg, ${hexAlpha(
            homeColor,
            0.055,
          )} 0%, transparent 40%, transparent 60%, ${hexAlpha(awayColor, 0.055)} 100%)`,
        }}
      >
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-card-2/80">
              <Image
                src={leagueLogo(general.leagueId)}
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] object-contain"
              />
            </span>
            <div className="min-w-0">
              <Link
                href={`/league/${general.leagueId}`}
                className="block truncate text-[12px] font-bold text-ink transition-colors hover:text-accent"
              >
                {general.leagueName ?? "Match"}
              </Link>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-dim">
                {general.matchRound ? `Round ${general.matchRound}` : "Match centre"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {venue?.name && (
              <span className="hidden items-center gap-1 rounded-full border border-line/70 bg-card-2/60 px-2.5 py-1.5 text-[10px] font-medium text-dim sm:flex">
                <MapPinIcon size={11} />
                {venue.name}
              </span>
            )}
            {live ? (
              <LiveRefresher active />
            ) : (
              <span
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  finished
                    ? "border border-accent/25 bg-accent/10 text-accent"
                    : "border border-line bg-white/[0.035] text-muted"
                }`}
              >
                {status.reason?.short ?? (finished ? "FT" : "Preview")}
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:mt-7 sm:gap-6">
          <TeamHero team={home} side="home" accent={homeColor} />
          <div className="relative z-10 flex min-w-[92px] flex-col items-center text-center sm:min-w-[176px]">
            {started || finished ? (
              <p className="score-display flex items-baseline justify-center font-display text-[46px] font-black leading-[0.8] text-ink num sm:text-[76px]">
                <span>{String(status.scoreStr?.split(" - ")[0] ?? home.score ?? "0").trim()}</span>
                <span className="mx-1.5 -translate-y-[0.06em] font-sans text-[0.46em] font-black text-dim sm:mx-2">
                  –
                </span>
                <span>{String(status.scoreStr?.split(" - ")[1] ?? away.score ?? "0").trim()}</span>
              </p>
            ) : (
              <p className="score-display font-display text-[34px] font-black leading-none text-ink num sm:text-[48px]">
                {status.utcTime ? formatKickoff(status.utcTime) : "vs"}
              </p>
            )}
            <div className="mt-3 flex flex-col items-center gap-1">
              {live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-live/25 bg-live/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-live">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
                  {status.liveTime?.short ?? "Live"}
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                  {status.reason?.long ?? (finished ? "Full time" : "Kick-off")}
                </span>
              )}
              {status.utcTime && (
                <span className="text-[9px] text-dim">
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(new Date(status.utcTime))}
                </span>
              )}
            </div>
          </div>
          <TeamHero team={away} side="away" accent={awayColor} />
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line/50 pt-3.5 text-[9px] text-dim">
          {facts?.infoBox?.Referee?.text && (
            <span>Referee · {facts.infoBox.Referee.text}</span>
          )}
          {facts?.infoBox?.Attendance ? (
            <>
              <span className="h-2.5 w-px bg-line" />
              <span>{facts.infoBox.Attendance.toLocaleString("en-GB")} fans</span>
            </>
          ) : null}
          {venue?.name && (
            <>
              <span className="h-2.5 w-px bg-line sm:hidden" />
              <span className="sm:hidden">{venue.name}</span>
            </>
          )}
        </div>
      </section>

      <div className="mt-4">
        <TabBar tabs={TABS} active={tab} basePath={`/match/${id}`} />
      </div>

      <div className="mt-5">
        {tab === "summary" && (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="space-y-4">
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
              {facts?.highlights?.url && (
                <a
                  href={facts.highlights.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                    <ArrowUpRightIcon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">Watch highlights</p>
                    <p className="text-[10px] text-dim">{facts.highlights.source ?? "YouTube"}</p>
                  </div>
                  <ChevronRightIcon size={16} className="text-dim" />
                </a>
              )}
            </div>
            <aside className="space-y-3">
              {facts?.playerOfTheMatch && <PlayerOfTheMatch player={facts.playerOfTheMatch} />}
              <MatchInfoCard
                facts={facts}
                homeTeam={{ name: home.name }}
                awayTeam={{ name: away.name }}
              />
              <FormCard
                home={home}
                away={away}
                forms={facts?.teamForm}
              />
              <TopPlayers
                home={home}
                away={away}
                topPlayers={facts?.topPlayers}
              />
              {match.content.weather?.description && (
                <div className="card flex items-center justify-between p-4">
                  <div>
                    <p className="eyebrow">Weather</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-muted">
                      {match.content.weather.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold text-ink num">
                      {match.content.weather.temperature}°
                    </p>
                    <p className="text-[9px] text-dim">
                      Wind {match.content.weather.windSpeed ?? 0} km/h
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "lineups" && (
          <Lineups
            lineup={match.content.lineup}
            colors={colors}
            homeTeam={{ id: home.id, name: home.name }}
            awayTeam={{ id: away.id, name: away.name }}
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
      </div>
    </div>
  );
}

function TeamHero({
  team,
  side,
  accent,
}: {
  team: { id: number | string; name: string; score?: number };
  side: "home" | "away";
  accent: string;
}) {
  return (
    <Link
      href={`/team/${team.id}`}
      className={`group flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3 ${
        side === "home" ? "sm:flex-row sm:text-left" : "sm:flex-row-reverse sm:text-right"
      }`}
    >
      <span className="team-crest-frame flex h-[58px] w-[58px] shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-[1.04] sm:h-[76px] sm:w-[76px]">
        <Image
          src={teamCrest(team.id)}
          alt={team.name}
          width={76}
          height={76}
          priority
          className="h-[78%] w-[78%] object-contain"
        />
      </span>
      <div className="min-w-0">
        <p className="flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-[0.16em] text-dim sm:justify-start">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          {side}
        </p>
        <p className="mt-1 max-w-[112px] truncate font-display text-[13px] font-black leading-[1.05] tracking-[-0.03em] text-ink sm:max-w-[240px] sm:text-2xl">
          {team.name}
        </p>
      </div>
    </Link>
  );
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
    <div className="card p-4">
      <p className="eyebrow mb-2">Recent form</p>
      {[
        { name: home.name, form: forms[0] },
        { name: away.name, form: forms[1] },
      ].map((row) => (
        <div key={row.name} className="flex items-center justify-between gap-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted">
            {row.name}
          </span>
          <FormStrip form={row.form} />
        </div>
      ))}
    </div>
  );
}

function TopPlayers({
  home,
  away,
  topPlayers,
}: {
  home: { name: string };
  away: { name: string };
  topPlayers?: { homeTopPlayers?: MatchTopPlayer[]; awayTopPlayers?: MatchTopPlayer[] };
}) {
  const homePlayers = topPlayers?.homeTopPlayers ?? [];
  const awayPlayers = topPlayers?.awayTopPlayers ?? [];
  if (!homePlayers.length && !awayPlayers.length) return null;

  return (
    <div className="card p-4">
      <p className="eyebrow mb-1">Top rated</p>
      <div className="divide-y divide-line/40">
        {[
          { name: home.name, players: homePlayers },
          { name: away.name, players: awayPlayers },
        ].flatMap((group) =>
          group.players.slice(0, 3).map((player) => (
            <Link
              key={player.playerId}
              href={`/player/${player.playerId}`}
              className="flex items-center gap-2 py-2 transition-colors hover:text-ink"
            >
              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10">
                <Image
                  src={playerImage(player.playerId)}
                  alt=""
                  width={24}
                  height={24}
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted">
                {player.name.fullName ??
                  `${player.name.firstName ?? ""} ${player.name.lastName ?? ""}`}
              </span>
              <span className="text-[9px] text-dim">{group.name}</span>
              <span className="rounded bg-accent/12 px-1.5 py-0.5 text-[10px] font-bold text-accent num">
                {player.playerRatingRounded ?? player.playerRating?.toFixed(1)}
              </span>
            </Link>
          )),
        )}
      </div>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="shell space-y-4 py-6">
      <SkeletonBlock className="h-4 w-48" />
      <SkeletonBlock className="h-56 rounded-2xl" />
      <SkeletonBlock className="h-10 w-full rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <SkeletonBlock className="h-80 rounded-2xl" />
        <SkeletonBlock className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}
