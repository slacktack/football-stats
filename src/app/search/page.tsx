import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRightIcon, SearchIcon, SparkIcon } from "@/components/icons";
import { EmptyState, SkeletonRows } from "@/components/ui";
import { leagueLogo, playerImage, teamCrest } from "@/lib/assets";
import { formatKickoff, formatShortDate, isLive } from "@/lib/format";
import { searchSuggest } from "@/lib/fotmob";
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
    ? await searchSuggest(query).catch(() => [])
    : [];
  const sections = groups.filter(
    (group) => group.title.key !== "all" && group.suggestions.length > 0,
  );
  const total = sections.reduce((count, group) => count + group.suggestions.length, 0);

  return (
    <div className="shell py-6 md:py-9">
      <div className="mx-auto max-w-4xl">
        <form action="/search" className="relative">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search players, teams, leagues or matches"
            className="h-12 w-full rounded-xl border border-line bg-card pl-11 pr-24 text-sm text-ink outline-none transition-colors placeholder:text-dim focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            aria-label="Search Touchline"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-base transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>

        {!query ? (
          <div className="mt-8 space-y-7">
            <section>
              <p className="eyebrow mb-3">Popular right now</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <p className="eyebrow mb-3">Browse competitions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LEAGUES.map((league) => (
                  <Link
                    key={league.id}
                    href={`/league/${league.id}`}
                    className="card card-hover flex items-center gap-3 p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                      <Image
                        src={leagueLogo(league.id)}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{league.name}</span>
                    <ChevronRightIcon size={14} className="text-dim" />
                  </Link>
                ))}
              </div>
            </section>
            <div className="flex items-start gap-3 rounded-xl border border-accent/15 bg-accent/[0.045] p-4">
              <SparkIcon size={16} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[11px] leading-relaxed text-muted">
                Tip: press <kbd className="rounded border border-line bg-white/[0.06] px-1 py-0.5 text-[9px] text-ink">⌘ K</kbd>{" "}
                anywhere to search without leaving the page.
              </p>
            </div>
          </div>
        ) : total === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<SearchIcon size={20} />}
              title={`No results for “${query}”`}
              description="Try a different spelling, or search for a team, player, competition or fixture."
            />
          </div>
        ) : (
          <div className="mt-7 space-y-7">
            <p className="text-[11px] text-dim">
              {total} result{total === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-muted">“{query}”</span>
            </p>
            {sections.map((group) => (
              <section key={group.title.key}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="font-display text-sm font-bold text-ink">
                    {group.title.value}
                  </h2>
                  <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-dim num">
                    {group.suggestions.length}
                  </span>
                </div>
                {group.title.key === "teams" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.suggestions.map((suggestion) => (
                      <TeamResult key={`${suggestion.type}-${suggestion.id}`} suggestion={suggestion} />
                    ))}
                  </div>
                ) : (
                  <div className="card divide-y divide-line/40 overflow-hidden">
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
    <Link
      href={`/team/${suggestion.id}`}
      className="card card-hover flex items-center gap-3 p-3"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.03]">
        <Image
          src={teamCrest(suggestion.id)}
          alt=""
          width={30}
          height={30}
          className="h-[30px] w-[30px] object-contain"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{suggestion.name}</p>
        <p className="truncate text-[10px] text-dim">{suggestion.leagueName ?? "Team"}</p>
      </div>
      <ChevronRightIcon size={15} className="text-dim" />
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
    <Link href={href} className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-white/[0.025]">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-line bg-white/[0.03] ${
          isPlayer ? "rounded-full" : "rounded-lg"
        }`}
      >
        <Image
          src={image}
          alt=""
          width={isPlayer ? 40 : 26}
          height={isPlayer ? 40 : 26}
          className={isPlayer ? "h-10 w-10 object-cover object-top" : "h-[26px] w-[26px] object-contain"}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{suggestion.name}</p>
        <p className="truncate text-[10px] text-dim">
          {isPlayer
            ? [suggestion.position, suggestion.teamName].filter(Boolean).join(" · ")
            : isLeague
              ? "Competition"
              : suggestion.leagueName ?? "Team"}
        </p>
      </div>
      <ChevronRightIcon size={15} className="text-dim" />
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
      className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-white/[0.025]"
    >
      <div className="w-[70px] shrink-0 text-[9px] leading-tight text-dim">
        {live ? (
          <span className="font-bold text-live">LIVE</span>
        ) : started ? (
          <span className="font-semibold text-muted">Full time</span>
        ) : suggestion.matchDate ? (
          <>
            <span className="block text-muted">{formatShortDate(suggestion.matchDate)}</span>
            <span className="block">{formatKickoff(suggestion.matchDate)}</span>
          </>
        ) : (
          "Fixture"
        )}
        <span className="mt-0.5 block truncate">{suggestion.leagueName}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Image
            src={teamCrest(suggestion.homeTeamId ?? "")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
            {suggestion.homeTeamName}
          </span>
          {started && (
            <span className="text-xs font-bold text-ink num">
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
            className="h-4 w-4 object-contain"
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
            {suggestion.awayTeamName}
          </span>
          {started && (
            <span className="text-xs font-bold text-ink num">
              {suggestion.status?.scoreStr?.split(" - ")[1] ?? suggestion.awayTeamScore ?? ""}
            </span>
          )}
        </div>
      </div>
      {finished && (
        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[8px] font-bold text-dim">
          FT
        </span>
      )}
      <ChevronRightIcon size={15} className="text-dim" />
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="shell py-6 md:py-9">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-12 animate-pulse rounded-xl border border-line bg-card" />
        <SkeletonRows rows={6} />
      </div>
    </div>
  );
}
