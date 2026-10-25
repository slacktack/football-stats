import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ChartIcon,
  ChevronRightIcon,
  GlobeIcon,
  ShirtIcon,
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
  TraitsCard,
} from "@/components/player/player-panels";
import { TabBar } from "@/components/tab-bar";
import { Crest, Pill, SectionHeading, SkeletonBlock, SkeletonRows } from "@/components/ui";
import { playerImage } from "@/lib/assets";
import { getPlayer } from "@/lib/fotmob";
import { formatShortDate } from "@/lib/format";
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
    <Suspense fallback={<PlayerSkeleton />}>
      <PlayerContent params={params} searchParams={searchParams} />
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
  const countryCode = country?.countryCode;
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
  const accent = team?.teamColors?.darkMode ?? "#c8f751";
  const allMatches = player.initialMatchesPage?.matches ?? player.recentMatches ?? [];
  const deepGroups = player.firstSeasonStats?.statsSection?.items ?? [];

  return (
    <div className="shell py-6 md:py-8">
      <section
        className="card relative overflow-hidden p-4 sm:p-5 md:p-6"
        style={{
          backgroundImage: `radial-gradient(680px 260px at 100% -30%, ${hex(accent, 0.2)}, transparent 70%), radial-gradient(420px 220px at 0% 0%, rgba(200,247,81,0.05), transparent 70%)`,
        }}
      >
        <div className="relative flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {team && (
                <Link
                  href={`/team/${team.teamId}`}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent"
                >
                  <Crest id={team.teamId} name={team.teamName} size={16} />
                  {team.teamName}
                </Link>
              )}
              {player.mainLeague && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <Link
                    href={`/league/${player.mainLeague.leagueId}`}
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim transition-colors hover:text-accent"
                  >
                    {player.mainLeague.leagueName}
                  </Link>
                </>
              )}
              {player.mainLeague?.season && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
                    {player.mainLeague.season}
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-1.5 font-display text-[30px] font-extrabold leading-none tracking-tight text-ink sm:text-4xl">
              {player.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Pill tone="accent">{position}</Pill>
              {otherPositions.slice(0, 2).map((item) => (
                <Pill key={item.key ?? item.label}>{item.label}</Pill>
              ))}
              {age && age !== "—" && <Pill>{age} yrs</Pill>}
              {height && height !== "—" && <Pill>{height}</Pill>}
              {shirt && shirt !== "—" && (
                <Pill>
                  <ShirtIcon size={12} /> {shirt}
                </Pill>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-dim">
              {countryCode && (
                <span className="flex items-center gap-1">
                  <GlobeIcon size={12} />
                  <span className="rounded bg-white/[0.06] px-1 py-0.5 text-[8px] font-bold tracking-wider text-muted">
                    {countryCode}
                  </span>
                  {countryName}
                </span>
              )}
              {foot && foot !== "—" && <span>{foot} footed</span>}
              {contract && contract !== "—" && <span>Contract to {contract}</span>}
            </div>
          </div>
          <div className="relative shrink-0">
            <span
              className="absolute -inset-3 rounded-[26px] opacity-30 blur-xl"
              style={{ background: accent }}
              aria-hidden="true"
            />
            <span className="relative block h-[92px] w-[76px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] sm:h-[150px] sm:w-[124px] md:h-[176px] md:w-[146px]">
              <Image
                src={playerImage(player.id)}
                alt={player.name}
                width={192}
                height={192}
                priority
                className="h-full w-full object-cover object-top"
              />
            </span>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line/50 pt-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-dim">Market value</p>
            <p className="font-display text-xl font-extrabold tracking-tight text-ink">
              {marketValue !== "—" ? marketValue : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-dim">
            {player.traits?.title && <span className="hidden sm:inline">{player.traits.title}</span>}
            {team && (
              <Link
                href={`/team/${team.teamId}`}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[10px] font-bold text-on-accent transition-opacity hover:opacity-90"
              >
                View club
                <ChevronRightIcon size={12} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-3">
        <PlayerStatStrip player={player} />
      </div>

      <TabBar tabs={TABS} active={tab} basePath={basePath} className="mt-4" />

      {tab === "overview" && (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
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

            <TraitsCard player={player} />

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
            <PlayerProfileCard player={player} />
            {player.nextMatch && <PlayerNextMatchCard match={player.nextMatch} />}
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
              } · compared with other forwards`}
              icon={<ChartIcon size={17} />}
            />
            <div className="flex rounded-lg border border-line bg-black/25 p-0.5">
              {[
                { value: "total", label: "Total" },
                { value: "per90", label: "Per 90" },
              ].map((option) => (
                <Link
                  key={option.value}
                  href={`${basePath}?tab=stats&metric=${option.value}`}
                  scroll={false}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    metric === option.value
                      ? "bg-accent/15 text-accent"
                      : "text-dim hover:text-muted"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <TopStatCards section={player.firstSeasonStats?.topStatCard} />
          <DeepStats groups={deepGroups} metric={metric} />
          <ShotMapCard shots={player.firstSeasonStats?.shotmap} />
        </div>
      )}

      {tab === "matches" && (
        <div className="mt-6">
          <SectionHeading
            title="Match log"
            subtitle={`${allMatches.length} appearances · ${player.mainLeague?.season ?? ""}`}
          />
          <div className="mt-3">
            <PlayerMatchList matches={allMatches} />
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
    <div className="card p-4">
      <p className="eyebrow mb-1">At a glance</p>
      <div className="divide-y divide-line/40">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2">
            <span className="text-[10px] text-dim">{row.label}</span>
            <span className="text-[11px] font-semibold capitalize text-muted">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="shell py-6 md:py-8">
      <SkeletonBlock className="h-56 rounded-2xl" />
      <SkeletonBlock className="mt-3 h-16 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-11 rounded-xl" />
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

function hex(value: string, alpha: number) {
  const normalized = value.replace("#", "");
  if (normalized.length !== 6) return `rgba(200,247,81,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
