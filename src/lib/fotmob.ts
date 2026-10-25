import { cacheLife, cacheTag } from "next/cache";
import { leagueLogo, playerImage, teamCrest } from "./assets";
import { isLive } from "./format";
import type {
  AllLeaguesResponse,
  LeagueResponse,
  MatchResponse,
  MatchesResponse,
  PlayerResponse,
  SearchGroup,
  SearchResult,
  SearchSuggestion,
  TeamResponse,
} from "./types";

const BASE = "https://www.fotmob.com/api/data";

const HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

async function getJson<T>(path: string, noStore = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: HEADERS,
    cache: noStore ? "no-store" : undefined,
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    throw new Error(`FotMob request failed (${res.status}) for ${path}`);
  }

  return (await res.json()) as T;
}

export async function getMatchesByDate(date: string) {
  "use cache";
  cacheLife({ stale: 20, revalidate: 30, expire: 600 });
  cacheTag("matches", `matches-${date}`);
  return getJson<MatchesResponse>(`/matches?date=${date}`);
}

export async function getLeague(id: string | number, season?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`league-${id}`, "leagues");
  const query = season ? `&season=${encodeURIComponent(season)}` : "";
  return getJson<LeagueResponse>(`/leagues?id=${id}${query}`);
}

export async function getTeam(id: string | number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`team-${id}`, "teams");
  return getJson<TeamResponse>(`/teams?id=${id}`);
}

export async function getPlayer(id: string | number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`player-${id}`, "players");
  return getJson<PlayerResponse>(`/playerData?id=${id}`);
}

export async function getMatch(id: string | number) {
  "use cache";
  cacheLife({ stale: 20, revalidate: 30, expire: 900 });
  cacheTag(`match-${id}`, "matches");
  return getJson<MatchResponse>(`/matchDetails?matchId=${id}`);
}

export async function getAllLeagues() {
  "use cache";
  cacheLife("days");
  cacheTag("all-leagues", "leagues");
  return getJson<AllLeaguesResponse>("/allLeagues");
}

export async function searchSuggest(term: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("search");
  return getJson<SearchGroup[]>(`/search/suggest?term=${encodeURIComponent(term)}`);
}

function imageForSuggestion(suggestion: SearchSuggestion) {
  switch (suggestion.type) {
    case "team":
      return teamCrest(suggestion.id);
    case "player":
      return playerImage(suggestion.id);
    case "league":
      return leagueLogo(suggestion.id);
    default:
      return undefined;
  }
}

function nameForSuggestion(suggestion: SearchSuggestion) {
  if (suggestion.type === "match") {
    return `${suggestion.homeTeamName ?? "Home"} vs ${suggestion.awayTeamName ?? "Away"}`;
  }
  return suggestion.name ?? "Unknown";
}

function hrefForSuggestion(suggestion: SearchSuggestion) {
  switch (suggestion.type) {
    case "team":
      return `/team/${suggestion.id}`;
    case "player":
      return `/player/${suggestion.id}`;
    case "league":
      return `/league/${suggestion.id}`;
    default:
      return `/match/${suggestion.id}`;
  }
}

export function normalizeSearchResults(groups: SearchGroup[]): SearchResult[] {
  const seen = new Set<string>();
  const all = groups.find((group) => group.title.key === "all") ?? groups[0];
  if (!all) return [];

  return all.suggestions
    .filter((suggestion) => {
      const key = `${suggestion.type}-${suggestion.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12)
    .map((suggestion) => ({
      type: suggestion.type,
      id: String(suggestion.id),
      name: nameForSuggestion(suggestion),
      subtitle:
        suggestion.type === "team" || suggestion.type === "player"
          ? suggestion.leagueName ?? suggestion.teamName ?? undefined
          : suggestion.type === "match"
            ? `${suggestion.leagueName ?? "Match"}${suggestion.matchDate ? ` · ${new Date(suggestion.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`
            : "Competition",
      href: hrefForSuggestion(suggestion),
      image: imageForSuggestion(suggestion),
      secondaryImage:
        suggestion.type === "match" ? teamCrest(suggestion.awayTeamId ?? "") : undefined,
      meta:
        suggestion.type === "match"
          ? suggestion.status?.scoreStr ??
            (suggestion.status?.started ? "LIVE" : new Date(suggestion.matchDate ?? "").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))
          : undefined,
    }));
}

export async function searchFotMob(term: string): Promise<SearchResult[]> {
  const cleaned = term.trim();
  if (cleaned.length < 2) return [];
  try {
    const groups = await searchSuggest(cleaned);
    return normalizeSearchResults(groups);
  } catch {
    return [];
  }
}

export function hasLiveMatches(leagues: { matches: { status: { started?: boolean; finished?: boolean; cancelled?: boolean } }[] }[]) {
  return leagues.some((league) => league.matches.some((match) => isLive(match.status)));
}
