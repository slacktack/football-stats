import { LocalTime } from "@/components/local-time";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRightIcon, SearchIcon, SparkIcon } from "@/components/icons";
import { EmptyState, SkeletonRows } from "@/components/ui";
import { Chip, K, Panel, TermBar } from "@/components/tl";
import { leagueLogo, playerImage, teamCrest } from "@/lib/assets";
import { isLive } from "@/lib/format";
import { searchGrouped } from "@/lib/fotmob";
import { PlayerPhoto } from "@/components/player-photo";
import { SafeImage } from "@/components/safe-image";
import type { SearchGroup, SearchSuggestion } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Search",
  description: "Search teams, players, competitions and matches across world football.",
};

const POPULAR = [
  { label: "Arsenal", href: "/team/9825" },
  { label: "Real Madrid", href: "/team/8633" },
  { label: "Kylian Mbappé", href: "/player/701154" },
  { label: "Premier League", href: "/league/47" },
  { label: "Champions League", href: "/league/42" },
];

const LEAGUES = [
  { id: 47, name: "Premier League" },
  { id: 87, name: "LaLiga" },
  { id: 54, name: "Serie A" },
  { id: 53, name: "Bundesliga" },
  { id: 55, name: "Ligue 1" },
  { id: 42, name: "Champions League" },
];

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const groups: SearchGroup[] = query
    ? await searchGrouped(query).catch(() => [])
    : [];
  const sections = groups.filter(
    (group) => group.title.key !== "all" && group.suggestions.length > 0,
  );
  const total = sections.reduce((count, group) => count + group.suggestions.length, 0);

  return (
    <div className="tl-view shell py-6 md:py-9">
      <div className="mx-auto max-w-4xl">
        <div className="tl-term-out">
          <TermBar path="/search" dim={query ? `${total} hits` : "index"} />
          <form action="/search" className="flex items-center gap-2.5 px-4 py-3">
            <span className="tl-acc shrink-0" aria-hidden="true">
              $
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="players, teams, leagues or matches"
              className="h-9 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-dim"
              aria-label="Search Touchline"
            />
            <button type="submit" className="tl-btn tl-btn-inv shrink-0">
              <SearchIcon size={13} />
              Search
            </button>
          </form>
        </div>

        {!query ? (
          <div className="mt-7 space-y-7">
            <section>
              <p className="tl-k tl-k-dim mb-2">Popular right now</p>
              <div className="tl-tags">
                {POPULAR.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="tl-chip transition-colors hover:bg-hover"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
            <Panel label="Browse competitions">
              <div className="grid gap-x-8 sm:grid-cols-2">
                {LEAGUES.map((league) => (
                  <Link
                    key={league.id}
                    href={`/league/${league.id}`}
                    className="tl-tr group grid-cols-[24px_minmax(0,1fr)_auto]"
                  >
                    <Image
                      src={leagueLogo(league.id)}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                    <span className="min-w-0 truncate text-[12px] font-semibold text-ink transition-colors group-hover:text-accent">
                      {league.name}
                    </span>
                    <ChevronRightIcon size={14} className="shrink-0 text-dim" />
                  </Link>
                ))}
              </div>
            </Panel>
            <div className="card flex items-start gap-3 p-4">
              <SparkIcon size={16} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[11.5px] leading-relaxed text-muted">
                Tip: press{" "}
                <kbd className="border border-line bg-card-2/60 px-1 py-0.5 font-mono text-[10.5px] text-ink">⌘ K</kbd>{" "}
                anywhere to search without leaving the page.
              </p>
            </div>
          </div>
        ) : total === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={<SearchIcon size={20} />}
              title={`No results for “${query}”`}
              description="Try a different spelling, or search for a team, player, competition or fixture."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-7">
            <p className="tl-k tl-k-dim">
              {total} result{total === 1 ? "" : "s"} for “{query}”
            </p>
            {sections.map((group) => (
              <section key={group.title.key}>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <h2 className="tl-head text-[12.5px]">{group.title.value}</h2>
                  <K dim>{group.suggestions.length}</K>
                </div>
                {group.title.key === "teams" ? (
                  <div className="grid gap-x-8 sm:grid-cols-2">
                    {group.suggestions.map((suggestion) => (
                      <TeamResult key={`${suggestion.type}-${suggestion.id}`} suggestion={suggestion} />
                    ))}
                  </div>
                ) : (
                  <div className="card divide-y divide-line overflow-hidden">
                    {group.suggestions.map((suggestion) => (
                      <SearchRow key={`${suggestion.type}-${suggestion.id}`} suggestion={suggestion} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamResult({ suggestion }: { suggestion: SearchSuggestion }) {
  return (
    <Link href={`/team/${suggestion.id}`} className="tl-tr group grid-cols-[26px_minmax(0,1fr)_auto]">
      <Image
        src={teamCrest(suggestion.id)}
        alt=""
        width={26}
        height={26}
        className="h-[26px] w-[26px] shrink-0 object-contain"
      />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-ink transition-colors group-hover:text-accent">
          {suggestion.name}
        </span>
        <span className="tl-k tl-k-dim block truncate">{suggestion.leagueName ?? "Team"}</span>
      </span>
      <ChevronRightIcon size={14} className="shrink-0 text-dim" />
    </Link>
  );
}

function SearchRow({ suggestion }: { suggestion: SearchSuggestion }) {
  if (suggestion.type === "match") {
    return <MatchResult suggestion={suggestion} />;
  }

  const isPlayer = suggestion.type === "player";
  const isLeague = suggestion.type === "league";
  const image = isPlayer
    ? playerImage(suggestion.id)
    : isLeague
      ? leagueLogo(suggestion.id)
      : teamCrest(suggestion.id);
  const href = isPlayer
    ? `/player/${suggestion.id}`
    : isLeague
      ? `/league/${suggestion.id}`
      : `/team/${suggestion.id}`;

  return (
    <Link href={href} className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover">
      <span className="tl-frame flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-card-2/60">
        {isPlayer ? (
          <PlayerPhoto playerId={suggestion.id} alt="" width={36} height={36} className="h-9 w-9 object-cover object-top" />
        ) : (
          <SafeImage src={image} label={suggestion.name ?? ""} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-ink">{suggestion.name}</span>
        <span className="tl-k tl-k-dim block truncate">
          {isPlayer
            ? [suggestion.position, suggestion.teamName].filter(Boolean).join(" · ")
            : isLeague
              ? "Competition"
              : suggestion.leagueName ?? "Team"}
        </span>
      </span>
      <ChevronRightIcon size={14} className="shrink-0 text-dim" />
    </Link>
  );
}

function MatchResult({ suggestion }: { suggestion: SearchSuggestion }) {
  const live = suggestion.status ? isLive(suggestion.status) : false;
  const finished = suggestion.status?.finished;
  const started = suggestion.status?.started;
  return (
    <Link
      href={`/match/${suggestion.id}`}
      className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover"
    >
      <span className="tl-k tl-k-dim w-[74px] shrink-0 leading-tight">
        {live ? (
          <span className="font-semibold text-live">Live</span>
        ) : started ? (
          <span className="text-muted">Full time</span>
        ) : suggestion.matchDate ? (
          <>
            <span className="block text-muted"><LocalTime value={suggestion.matchDate} kind="short" /></span>
            <span className="block"><LocalTime value={suggestion.matchDate} /></span>
          </>
        ) : (
          "Fixture"
        )}
        <span className="mt-0.5 block truncate">{suggestion.leagueName}</span>
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Image
            src={teamCrest(suggestion.homeTeamId ?? "")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 object-contain"
          />
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">
            {suggestion.homeTeamName}
          </span>
          {started && (
            <span className="text-[12.5px] font-semibold text-ink num">
              {suggestion.status?.scoreStr?.split(" - ")[0] ?? suggestion.homeTeamScore ?? ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Image
            src={teamCrest(suggestion.awayTeamId ?? "")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 object-contain"
          />
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">
            {suggestion.awayTeamName}
          </span>
          {started && (
            <span className="text-[12.5px] font-semibold text-ink num">
              {suggestion.status?.scoreStr?.split(" - ")[1] ?? suggestion.awayTeamScore ?? ""}
            </span>
          )}
        </div>
      </div>
      {finished && <Chip tone="plain">FT</Chip>}
      <ChevronRightIcon size={14} className="shrink-0 text-dim" />
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="shell py-6 md:py-9">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="skeleton h-[76px]" />
        <SkeletonRows rows={6} />
      </div>
    </div>
  );
}
