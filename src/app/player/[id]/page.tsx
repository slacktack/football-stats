import { PlayerPhoto } from "@/components/player-photo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import {
  ChartIcon,
  TrophyIcon,
} from "@/components/icons";
import {
  CareerList,
  DeepStats,
  MarketValueChart,
  PlayerMatchList,
  PlayerNextMatchCard,
  PlayerProfileCard,
  PlayerStatStrip,
  PlayerTrophies,
  ShotMapCard,
  TopStatCards,
} from "@/components/player/player-panels";
import {
  FormSummary,
  InjuryNotice,
  PositionMap,
  RatingForm,
  TraitsRadar,
} from "@/components/player/player-insights";
import { TabBar } from "@/components/tab-bar";
import { Crest, RatingChip, SectionHeading, SkeletonBlock, SkeletonRows } from "@/components/ui";
import { Leader, Panel } from "@/components/tl";
import { getPlayer } from "@/lib/fotmob";
import { formatShortDate, inkFor } from "@/lib/format";
import type { PlayerInfoItem, PlayerResponse } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "stats", label: "Stats" },
  { value: "matches", label: "Matches" },
  { value: "career", label: "Career" },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.value));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const player = await getPlayer(id);
    if (!player) return { title: "Player" };
    const position = player.positionDescription?.primaryPosition?.label;
    return {
      title: `${player.name}${position ? ` — ${position}` : ""} · Stats, goals & matches`,
      description: `${player.name} player profile: season stats, goals, assists, shot map, match ratings, career history, trophies and market value.`,
      openGraph: {
        title: `${player.name} · Touchline`,
        description: `Season stats, match ratings and career history for ${player.name}.`,
      },
    };
  } catch {
    return { title: "Player" };
  }
}

export default function PlayerPage({
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
          <PlayerSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <PlayerContent params={params} searchParams={searchParams} />
      </ViewTransition>
    </Suspense>
  );
}

async function PlayerContent({
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
  const metric = sp.metric === "per90" ? "per90" : "total";
  const player = await getPlayer(id);
  if (!player?.id) notFound();

  const info = new Map(
    (player.playerInformation ?? []).map((item) => [item.title, item]),
  );
  const country = info.get("Country");
  const countryName = infoText(country?.value);
  const age = infoText(info.get("Age")?.value);
  const height = infoText(info.get("Height")?.value);
  const foot = infoText(info.get("Preferred foot")?.value);
  const shirt = infoText(info.get("Shirt")?.value);
  const marketValue = infoText(info.get("Market value")?.value);
  const contract = infoText(info.get("Contract end")?.value);
  const position = player.positionDescription?.primaryPosition?.label ?? "Player";
  const otherPositions = player.positionDescription?.nonPrimaryPositions ?? [];
  const team = player.primaryTeam;
  const basePath = `/player/${id}`;
  const kit = team?.teamColors?.color ?? team?.teamColors?.lightMode;
  const kitInk = kit ? inkFor(kit) : "var(--color-base)";
  const allMatches = player.initialMatchesPage?.matches ?? player.recentMatches ?? [];
  const deepGroups = player.firstSeasonStats?.statsSection?.items ?? [];
  const seasonRating = player.mainLeague?.stats?.find((stat) => stat.localizedTitleId === "rating")?.value;
  const formMatches = player.recentMatches?.length ? player.recentMatches : allMatches;

  return (
    <div className="tl-view shell py-6 md:py-8">
      <section
        className="kit-hero"
        style={{ "--kit": kit ?? "var(--color-ink)", "--kit-ink": kitInk } as React.CSSProperties}
      >
        <div className="kit-hero-slab">
          <div className="relative z-[1] min-w-0 flex-1 self-center py-5 pl-4 sm:py-8 sm:pl-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold">
              {team && (
                <Link href={`/team/${team.teamId}`} className="flex items-center gap-1.5 hover:underline">
                  <Crest id={team.teamId} name={team.teamName} size={22} />
                  {team.teamName}
                </Link>
              )}
              {player.mainLeague && (
                <Link href={`/league/${player.mainLeague.leagueId}`} className="opacity-75 hover:underline hover:opacity-100">
                  {player.mainLeague.leagueName} {player.mainLeague.season}
                </Link>
              )}
            </div>
            <h1 className="kit-hero-name">
              {player.name}
            </h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px] font-semibold">
              {shirt && shirt !== "—" && <span className="kit-hero-number">{shirt}</span>}
              <span>{position}</span>
              {age && age !== "—" && <span className="opacity-80">{age} years</span>}
              {height && height !== "—" && <span className="opacity-80">{height}</span>}
              {countryName && countryName !== "—" && <span className="opacity-80">{countryName}</span>}
            </p>
          </div>
          <div className="kit-hero-photo">
            <PlayerPhoto
              playerId={player.id}
              alt={player.name}
              width={320}
              height={320}
              priority
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
        <dl className="kit-hero-facts">
          {seasonRating !== undefined && (
            <div>
              <dt>Season rating</dt>
              <dd>
                <RatingChip rating={seasonRating} size="lg" />
              </dd>
            </div>
          )}
          <div>
            <dt>Market value</dt>
            <dd><span className="tl-num text-[24px] text-ink">{marketValue !== "—" ? marketValue : "—"}</span></dd>
          </div>
          {foot && foot !== "—" && (
            <div>
              <dt>Foot</dt>
              <dd>{foot}</dd>
            </div>
          )}
          {contract && contract !== "—" && (
            <div>
              <dt>Contract until</dt>
              <dd>{contract}</dd>
            </div>
          )}
          {otherPositions.length > 0 && (
            <div className="hidden sm:flex">
              <dt>Also plays</dt>
              <dd>{otherPositions.slice(0, 2).map((item) => item.label).join(", ")}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-3 space-y-3">
        <InjuryNotice player={player} />
        <PlayerStatStrip player={player} />
      </div>

      <TabBar tabs={TABS} active={tab} basePath={basePath} className="mt-4" />

      {tab === "overview" && (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <RatingForm matches={formMatches} />

            <section>
              <SectionHeading
                title="Season so far"
                subtitle={`${player.mainLeague?.leagueName ?? "League"} · ${player.mainLeague?.season ?? ""}`}
                icon={<ChartIcon size={17} />}
              />
              <div className="mt-3">
                <TopStatCards section={player.firstSeasonStats?.topStatCard} />
              </div>
            </section>

            <TraitsRadar player={player} />

            <ShotMapCard shots={player.firstSeasonStats?.shotmap} />

            <section>
              <SectionHeading
                title="Recent matches"
                subtitle="Latest performances and ratings"
                action="All matches"
                actionHref={`${basePath}?tab=matches`}
              />
              <div className="mt-3">
                <PlayerMatchList matches={player.recentMatches?.slice(0, 6)} />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {player.nextMatch && <PlayerNextMatchCard match={player.nextMatch} />}
            <FormSummary matches={formMatches} />
            <PositionMap player={player} />
            <PlayerProfileCard player={player} />
            <PlayerTrophies player={player} />
            <SeasonSummary player={player} age={age} height={height} foot={foot} />
          </aside>
        </div>
      )}

      {tab === "stats" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title="Season stats"
              subtitle={`${player.mainLeague?.leagueName ?? ""} ${
                player.mainLeague?.season ?? ""
              } · percentiles vs other ${(position ?? "player").toLowerCase()}s`}
              icon={<ChartIcon size={17} />}
            />
            <div className="flex border border-line bg-card-2/60 p-0.5">
              {[
                { value: "total", label: "Total" },
                { value: "per90", label: "Per 90" },
              ].map((option) => (
                <Link
                  key={option.value}
                  href={`${basePath}?tab=stats&metric=${option.value}`}
                  scroll={false}
                  className={`press px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                    metric === option.value
                      ? "bg-accent text-on-accent"
                      : "text-muted hover:bg-hover hover:text-ink"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <TopStatCards section={player.firstSeasonStats?.topStatCard} />
          <TraitsRadar player={player} />
          <DeepStats groups={deepGroups} metric={metric} />
          <ShotMapCard shots={player.firstSeasonStats?.shotmap} />
        </div>
      )}

      {tab === "matches" && (
        <div className="mt-6 space-y-6">
          <RatingForm matches={allMatches} limit={20} />
          <div>
            <SectionHeading
              title="Match log"
              subtitle={`${allMatches.length} appearances · ${player.mainLeague?.season ?? ""}`}
            />
            <div className="mt-3">
              <PlayerMatchList matches={allMatches} />
            </div>
          </div>
        </div>
      )}

      {tab === "career" && (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <SectionHeading
              title="Career"
              subtitle="Clubs, appearances, goals and assists"
              icon={<TrophyIcon size={17} />}
            />
            <div className="mt-4">
              <CareerList player={player} />
            </div>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <MarketValueChart player={player} />
            <PlayerTrophies player={player} />
          </aside>
        </div>
      )}
    </div>
  );
}

function SeasonSummary({
  player,
  age,
  height,
  foot,
}: {
  player: PlayerResponse;
  age: string;
  height: string;
  foot: string;
}) {
  const rows: { label: string; value: string }[] = [];
  if (age !== "—") rows.push({ label: "Age", value: age });
  if (height !== "—") rows.push({ label: "Height", value: height });
  if (foot !== "—") rows.push({ label: "Foot", value: foot });
  if (player.birthDate?.utcTime) {
    rows.push({ label: "Born", value: formatShortDate(player.birthDate.utcTime) });
  }
  if (player.status) rows.push({ label: "Status", value: player.status });

  if (!rows.length) return null;

  return (
    <Panel label="At a glance">
      {rows.map((row) => (
        <Leader
          key={row.label}
          k={row.label}
          v={<span className="capitalize">{row.value}</span>}
        />
      ))}
    </Panel>
  );
}

function PlayerSkeleton() {
  return (
    <div className="tl-view shell py-6 md:py-8">
      <SkeletonBlock className="h-56" />
      <SkeletonBlock className="mt-3 h-16" />
      <SkeletonBlock className="mt-4 h-11" />
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={index} className="h-24" />
            ))}
          </div>
          <SkeletonRows rows={5} />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-52" />
        </div>
      </div>
    </div>
  );
}

function infoText(value: PlayerInfoItem["value"] | undefined): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "—";
  const fallback = value.fallback;
  if (typeof fallback === "string") return fallback;
  if (typeof fallback === "number") return String(fallback);
  if (fallback && typeof fallback === "object" && fallback.utcTime) {
    return new Date(fallback.utcTime).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (value.numberValue !== undefined) return String(value.numberValue);
  return "—";
}

