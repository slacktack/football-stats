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

const SEARCHABLE = new Set(["team", "player", "league", "match"]);

function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// 0 = exact word/prefix, higher = weaker; typos cost one step each.
function matchDistance(name: string, term: string) {
  const q = fold(term);
  const words = fold(name).split(" ").filter(Boolean);
  const full = words.join(" ");
  if (full === q || full.startsWith(q)) return 0;
  let best = 9;
  for (const word of words) {
    if (word === q) return 0;
    if (word.startsWith(q)) best = Math.min(best, 0.5);
    best = Math.min(best, editDistance(word, q), editDistance(word.slice(0, q.length), q) + 0.5);
  }
  if (full.includes(q)) best = Math.min(best, 1);
  return best;
}

export function searchVariants(term: string) {
  const q = fold(term.trim());
  const variants = [term.trim(), q.replace(/(.)\1+/g, "$1")];
  if (q.length > 4) variants.push(q.slice(0, -1));
  if (q.length >= 5) variants.push(q.slice(0, 3));
  return [...new Set(variants.filter((v) => v.length >= 2))].slice(0, 4);
}

export function rankSuggestions(groups: SearchGroup[], term = "", limit = 12): SearchSuggestion[] {
  const seen = new Set<string>();
  const pool = groups.flatMap((group) => (group.title.key === "all" ? group.suggestions : []));

  return pool
    .filter((suggestion) => {
      if (!SEARCHABLE.has(suggestion.type)) return false;
      const key = `${suggestion.type}-${suggestion.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((suggestion) => ({
      suggestion,
      distance: term ? matchDistance(nameForSuggestion(suggestion), term) : 0,
      // FotMob scores are match-tier + popularity; the remainder is popularity.
      popularity: (suggestion.score ?? 0) % 100000,
    }))
    .sort((a, b) => Math.floor(a.distance) - Math.floor(b.distance) || b.popularity - a.popularity || a.distance - b.distance)
    .slice(0, limit)
    .map(({ suggestion }) => suggestion);
}

export function normalizeSearchResults(groups: SearchGroup[], term = ""): SearchResult[] {
  return rankSuggestions(groups, term)
    .map((suggestion) => ({
      type: suggestion.type,
      id: String(suggestion.id),
      name: nameForSuggestion(suggestion),
      subtitle:
        suggestion.type === "team" || suggestion.type === "player"
          ? suggestion.teamName ?? suggestion.leagueName ?? undefined
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

async function fetchVariants(term: string) {
  const settled = await Promise.allSettled(searchVariants(term).map((v) => searchSuggest(v)));
  return settled.flatMap((r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []));
}

export async function searchFotMob(term: string): Promise<SearchResult[]> {
  const cleaned = term.trim();
  if (cleaned.length < 2) return [];
  return normalizeSearchResults(await fetchVariants(cleaned), cleaned);
}

const SECTION_TITLES = { player: "Players", team: "Teams", league: "Competitions", match: "Matches" } as const;

export async function searchGrouped(term: string): Promise<SearchGroup[]> {
  const cleaned = term.trim();
  if (cleaned.length < 2) return [];
  const ranked = rankSuggestions(await fetchVariants(cleaned), cleaned, 60);
  return (Object.keys(SECTION_TITLES) as (keyof typeof SECTION_TITLES)[])
    .map((type) => ({
      title: { key: `${type}s`, value: SECTION_TITLES[type] },
      suggestions: ranked.filter((s) => s.type === type),
    }))
    .filter((group) => group.suggestions.length)
    .sort((a, b) => ranked.indexOf(a.suggestions[0]) - ranked.indexOf(b.suggestions[0]));
}

export function hasLiveMatches(leagues: { matches: { status: { started?: boolean; finished?: boolean; cancelled?: boolean } }[] }[]) {
  return leagues.some((league) => league.matches.some((match) => isLive(match.status)));
}
