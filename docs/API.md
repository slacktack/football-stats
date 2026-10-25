# Touchline data API

Touchline reads the public FotMob JSON API. Everything below was verified against the live
service while building the app. The base URL is:

```
https://www.fotmob.com/api/data
```

No key or cookie is required. Requests must look like a browser:

```http
Accept: application/json
Accept-Language: en-US,en;q=0.9
User-Agent: Mozilla/5.0 ... Chrome/126 Safari/537.36
```

The app sends a 12 second `AbortSignal` timeout and never sends the old `/api/...` prefix —
those paths return `404`.

All request helpers live in `src/lib/fotmob.ts`; image URL helpers live in
`src/lib/assets.ts`; response types live in `src/lib/types.ts`.

---

## Endpoint overview

| Endpoint | Purpose | App cache |
| --- | --- | --- |
| `GET /matches?date=YYYYMMDD` | Every fixture on a date, grouped by competition | 20s stale / 30s revalidate / 10m expire |
| `GET /leagues?id={id}&season={season}` | League overview, table, fixtures, stats, transfers | hours |
| `GET /teams?id={id}` | Team overview, fixtures, squad, stats, history, transfers | hours |
| `GET /playerData?id={id}` | Full player profile, season stats, career, market value | hours |
| `GET /matchDetails?matchId={id}` | Match centre: events, lineups, stats, H2H, shots | 20s stale / 30s revalidate / 15m expire |
| `GET /search/suggest?term={query}` | Grouped search suggestions | minutes |
| `GET /allLeagues` | Competition directory used by `/leagues` | days |

### Season format

`season` only affects `/leagues`. Pass the URL-encoded label from `allAvailableSeasons`,
for example `2025%2F2026`. Passing a season to a team or player is ignored by the API.

### Match date format

`/matches` expects `YYYYMMDD`, for example `/matches?date=20261024`. The response always
uses UTC fixture dates unless a `timezone` parameter is supplied.

---

## `/matches`

```bash
curl -s 'https://www.fotmob.com/api/data/matches?date=20261024'
```

Shape:

```ts
{
  leagues: Array<{
    id: number;
    name: string;
    countryCode: string;
    pageUrl: string;
    matches: Array<{
      id: string | number;
      home: { id: number; name: string; score?: number };
      away: { id: number; name: string; score?: number };
      status: {
        utcTime: string;
        started: boolean;
        finished: boolean;
        cancelled: boolean;
        liveTime?: { short: string; long: string };
        reason?: { short: string; long: string };
        scoreStr?: string;
      };
      leagueId?: number;
      leagueName?: string;
      time?: string;
      round?: string;
      roundName?: string;
    }>;
  }>;
}
```

Notes:

- The home page groups `leagues[].matches` and filters by `status.started` / `status.finished`.
- A live match is `started && !finished`; `status.reason.short` is often `HT`, `FT` or `2H`.
- Scores can be `null` before kick-off. Use `status.scoreStr` when both values exist.
- Some competitions expose `ccode` rather than `countryCode`; the app normalises both.

---

## `/leagues`

```bash
curl -s 'https://www.fotmob.com/api/data/leagues?id=47'
curl -s 'https://www.fotmob.com/api/data/leagues?id=47&season=2024%2F2025'
```

Top-level keys:

| Key | Contents |
| --- | --- |
| `details` | `id`, `name`, `country`, `selectedSeason`, `latestSeason`, `leagueColor`, `type`, `isWomen` |
| `allAvailableSeasons` | Season labels accepted by `&season=` |
| `table` | Array of table wrappers (some competitions have groups/stages) |
| `fixtures` | `{ allMatches, firstUnplayedMatch, hasOngoingMatch }` |
| `stats` | `{ players, teams }` stat leader groups |
| `transfers` | `{ type, data }`; `data` is an array for leagues |
| `overview` | Compact landing data: `table`, `topPlayers`, `matches`, `shotMap`, `season` |
| `playoff`, `seasons` | Optional stage/season metadata |

### Table wrapper

```ts
table[0] = {
  data: {
    leagueId: number;
    table: {
      all: TableRow[];
      home?: TableRow[];
      away?: TableRow[];
    };
    legend: Array<{ title: string; color: string; indices: number[] }>;
  };
  tableFilterTypes?: string[];
  teamForm?: unknown;
  nextOpponent?: unknown;
  tableHeader?: unknown;
};
```

`TableRow` contains `id`, `name`, `shortName`, `pageUrl`, `played`, `wins`, `draws`,
`losses`, `scoresStr`, `goalConDiff`, `pts`, `idx`, `qualColor` and optionally `form`.

### Stats leader groups

```ts
stats.players = Array<{
  header: string;            // "Top scorer", "Most assists", ...
  localizedTitleId: string;
  topThree: Array<{
    id: number; name: string;
    teamId: number; teamName: string;
    value: number;
    leagueId?: number;
  }>;
}>;
stats.teams = Array<{ header: string; topThree: [...] }>;
```

Some competitions (for example the Champions League stage endpoint) return `null` for
`table`; always guard before rendering.

Useful quirks:

- `/leagues?id=42` is the Champions League and returns the current league-phase table.
- Match `general.leagueId` can be a stage id (for example `943230`) whose own `/leagues`
  response is `null`. Use `general.parentLeagueId` (`42`) for the table.
- `overview.matches.firstUnplayedMatch.firstUnplayedMatchIndex` is the index of the next
  fixture inside `overview.matches.allMatches`. Do not confuse this object with the numeric
  `fixtures.firstUnplayedMatch` field.

---

## `/teams`

```bash
curl -s 'https://www.fotmob.com/api/data/teams?id=9825'
```

Top-level keys: `details`, `overview`, `stats`, `fixtures`, `squad`, `history`, `transfers`,
`table`, `allAvailableSeasons`, `tabs`.

### `details`

`id`, `type`, `name`, `shortName`, `country`, `gender`, `latestSeason`, `primaryLeagueId`,
`primaryLeagueName`, `teamColor`, `seopath`.

### `overview`

`table`, `topPlayers`, `venue`, `coachHistory`, `overviewFixtures`, `nextMatch`, `lastMatch`,
`teamForm`, `lastLineupStats`, `newsSummary`, `fixtureDifficulty`, `squad`, `transfers`.

- `teamForm[]` fields: `result` (1 win, 0 draw, -1 loss), `resultString`, `score`, `date`,
  `home`, `away`, `imageUrl`, `linkToMatch`, `teamPageUrl`.
  **`imageUrl` is the opponent crest**, and `score` is always written team-first. The
  `home`/`away` flags are not reliable for deciding which side the team played.
- `linkToMatch` looks like `/matches/real-madrid-vs-elche/xxx#5868065`; use the fragment
  as the match id.
- `venue.statPairs` is an array of pairs, not objects:
  `[["Capacity", 60704], ["Opened", 2006], ["Surface", "Grass"]]`.
- `coachHistory[]` is a per-season list: `{ id, name, season, leagueName, win, draw, loss,
  pointsPerGame, winPercentage }`.
- `newsSummary.items[].source` contains `{ sourceName, uri, articleId, title }`.
- `nextMatch` / `lastMatch` use `{ id, name, score, imageUrl, pageUrl, status }`.

### `fixtures`

`allFixtures[]` entries contain `id`, `home`, `away`, `status`, `time`, `tournament`,
`round`, `roundName`, `pageUrl`. `firstUnplayedMatch` is a numeric index.

### `squad`

```ts
squad.squad = Array<{
  title: string;              // "Goalkeepers", "Defenders", ...
  members: Array<{
    id: number; name: string; age?: number; shirtNumber?: number;
    positionId?: number; countryCode?: string;
    marketValue?: number; pageUrl?: string;
    injurystatus?: string;   // field name is lowercase in this endpoint
  }>;
}>;
```

### `stats`

- `stats.players`, `stats.teams`: same leader-group shape as `/leagues`.
- `stats.teamId`, `primaryLeagueId`, `primarySeasonId`.

### `history`

`trophyList` (`tournaments[]` with `seasonsWon`), `coachHistory`, `tables`, `teamColors`.
Only include trophies where `won > 0`; the payload lists every possible competition.

### `transfers`

Use `allTransfers` when present. Each entry has `playerId`, `playerName`, `fromClub`,
`toClub`, `fee`, `feeDescription`, `transferDate`, `transferType`, `isLoan`, `marketValue`.
`transfers.data` is an object keyed `"Players in"` / `"Players out"` / `"Contract extension"`
for teams and an array for leagues.

### Team IDs

- Arsenal is `9825` (`57` is not a team).
- Invalid ids return the JSON literal `null` with HTTP `200`; the page calls `notFound()`
  when `details.id` is missing.
- Image CDN ids match these ids.

---

## `/playerData`

```bash
curl -s 'https://www.fotmob.com/api/data/playerData?id=701154'
```

The response is **top-level**; there is no `details` wrapper.

Top-level keys:

```
id, name, birthDate, contractEnd, isCoach, isCaptain, gender, primaryTeam,
positionDescription, injuryInformation, internationalDuty, playerInformation,
mainLeague, trophies, recentMatches, matchesUrl, matchFilters, careerHistory,
traits, meta, coachStats, statSeasons, firstSeasonStats, status, marketValues,
relatedLinksData, nextMatch, dataProvider, initialMatchesPage
```

Key shapes:

```ts
name = { firstName, lastName, fullName }
primaryTeam = { teamId, teamName, teamPageUrl? }
positionDescription = { primaryPosition: { label, key }, ... }
playerInformation = Array<{ title, value: { fallback?: string | number } }>
mainLeague = {
  leagueId, leagueName,
  stats: Array<{ name: string; value: string; ... }>
}
firstSeasonStats = {
  topStatCard: { ... },
  statsSection: {
    items: Array<{
      display: string;
      items: Array<{
        title: string; localizedTitleId: string;
        statValue: string; per90?: number;
        percentileRank?: number; statFormat?: string;
      }>;
    }>;
  };
  shotmap?: PlayerShot[];
}
```

- `firstSeasonStats.shotmap[]`: `id`, `eventType` (`Goal`, `AttemptSaved`, `Miss`, `Post`),
  `teamId`, `playerId`, `playerName`, `x`, `y`, `min`, `minAdded`, `isBlocked`, `isOnTarget`,
  `expectedGoals`, `shotType` (`RightFoot` / `LeftFoot` / `Header`), `situation`, `period`.
- Pitch coordinates are roughly `105 × 68`, attacking to the right; `y` runs top to bottom.
- `careerHistory.careerItems` is keyed `senior`, `youth`, `national team`. Each item has
  `teamEntries[]` with `teamId`, `teamName`, `season`, `appearances`, `goals`, `assists`.
- `traits.items[]`: `{ key, title, value }`; `value` is a 0–1 percentile used by the trait
  bars.
- `trophies.playerTrophies[].tournaments[]`: `{ leagueId, name, won, seasonsWon }`.
- `marketValues.values[]`: `{ date, marketValue, clubId, clubName, ... }`.
- `recentMatches[]` / `initialMatchesPage.matches[]`: `id`, `matchId`, `matchDate`,
  `home`, `away`, `tournament`, `status`, `rating`, `minutesPlayed`, `goals`, `assists`.
- `nextMatch` focuses on the player's next fixture and includes `matchDate`, `home`, `away`,
  `tournament`, `status`.
- `trophies` and `marketValues` can be empty objects for retired or low-coverage players.

Player images are square 192×192 portraits:
`https://images.fotmob.com/image_resources/playerimages/{id}.png`.

---

## `/matchDetails`

```bash
curl -s 'https://www.fotmob.com/api/data/matchDetails?matchId=6106244'
```

Top-level: `general`, `header`, `nav[]`, `ongoing`, `hasPendingVAR`, `content`, `seo`.

### `general`

`matchId`, `matchName`, `matchRound`, `teamColors`, `leagueId`, `leagueName`,
`leagueRoundName`, `parentLeagueId`, `countryCode`, `homeTeam`, `awayTeam`, `coverageLevel`,
`matchTimeUTC`, `matchTimeUTCDate`, `started`, `finished`, `gender`.

`general.homeTeam` / `awayTeam` are `{ id, name }`; `header.teams[]` additionally include
`score`, `imageUrl`, `pageUrl`.

`teamColors`:

```ts
{
  darkMode: { home: "#FFFFFF", away: "#DD0741" },
  lightMode: { home: "#085098", away: "#DD0741" },
  fontDarkMode: { home: "...", away: "..." },
  fontLightMode: { home: "...", away: "..." }
}
```

### `header.status`

`utcTime`, `started`, `finished`, `cancelled`, `awarded`, `scoreStr`, `reason.short/long`,
`halfs.*`, `numberOfHomeRedCards`, `numberOfAwayRedCards`, `whoLostOnPenalties`.

### `nav`

Strings such as `matchfacts`, `liveticker`, `lineup`, `stats`, `table`, `head to head`.
The app maps these to its own `summary`, `lineups`, `stats`, `table`, `h2h` tabs.

### `content.matchFacts`

- `events = { ongoing, events: TimelineEvent[] }`.
- `TimelineEvent` fields: `type`, `time`, `timeStr`, `overloadTime`, `isHome`, `player`,
  `newScore`, `homeScore`, `awayScore`, `assistStr`, `assistPlayerId`, `card`, `swap`,
  `minutesAddedInput`, `halfStrShort`, `shotmapEvent`.
- Event types: `Goal`, `Card`, `Substitution`, `Half`, `AddedTime`, `PenaltyMissed`.
  `Half` rows carry `HT` / `FT`; `AddedTime` rows carry `minutesAddedInput`.
- Substitutions contain `swap = [playerIn, playerOut]`.
- `playerOfTheMatch` includes `id`, `name`, `teamName`, `rating.num`, `minutesPlayed`.
- `highlights = { image, url, source }` (YouTube thumbnail/link when available).
- `infoBox` keys: `Match Date`, `Stadium`, `Referee`, `Attendance`, `Tournament`.
  `Stadium` is `{ name, city, country, capacity, surface, lat, long }`;
  `Referee` is `{ text, id, imgUrl, countryCode }`.
- `teamForm` is `TeamFormEntry[][]` — `[home form, away form]`.
- `topPlayers = { homeTopPlayers[], awayTopPlayers[] }`.

### `content.stats`

```ts
content.stats.Periods.All.stats = Array<{
  title: string;                 // "Top stats", "Shots", "Passes", "Defence", ...
  key: string;
  stats: Array<{
    title: string;               // "Ball possession"
    key: string;
    stats: [number | string | null, number | string | null]; // [home, away]
    rawStats?: Array<{ value?: number; total?: number }>;
    type?: string;               // "title" rows are separators and should be skipped
    highlighted?: string;
  }>;
}>;
```

Percent strings like `"679 (91%)"` are common; parse the leading number for bar widths.

### `content.shotmap`

`{ shots: MatchEventShot[], Periods }`. Each shot has `id`, `teamId`, `playerName`, `x`, `y`,
`min`, `eventType`, `isOnTarget`, `expectedGoals`, `shotType`, `situation`, `period`.
Use `teamId` to pick a colour; mirror `x` for the away side (`105 - x`).

### `content.lineup`

```ts
{
  homeTeam: {
    id, name, rating?, formation?,
    starters: LineupPlayer[],
    subs: LineupPlayer[],
    coach?: { id, name, countryCode },
    averageStarterAge?, totalStarterMarketValue?
  },
  awayTeam: { ...same... }
}
```

`LineupPlayer` includes `id`, `name`, `shirtNumber`, `positionId`, `horizontalLayout`,
`verticalLayout`, `performance.rating`, `marketValue`. Both teams' `horizontalLayout`
coordinates are stored from the same orientation: mirror the away x (`1 - x`) when drawing
both teams on one pitch. `verticalLayout` is available for a vertical pitch.

### `content.table`

Metadata only: `{ leagueId, url, teams, parentLeagueId, tournamentNameForUrl }`. Fetch the
actual table with `/leagues?id={parentLeagueId ?? leagueId}` and read `table[0]`.

### `content.h2h`

`{ summary: [homeWins, draws, awayWins], matches: H2HMatch[] }`. Each match has `time`,
`matchUrl` (`/matches/slug#id`), `league`, `home`, `away`, and `status.scoreStr`. Read the
match id from the URL fragment.

### Other content keys

- `momentum.main.data[] = { minute, value }`, value `-100..100`.
- `attackingZones.home/away` keyed by zone with `{ left, center, right }`.
- `weather`: `temperature`, `windSpeed`, `windDirectionCardinal`, `relativeHumidity`,
  `precipitation`, `description`, `iconCode`, `lastUpdated`.
- `liveticker`, `superlive`, `buzz`, `playerStats`, `heatmapUrl` exist but are not rendered.

---

## `/search/suggest`

```bash
curl -s 'https://www.fotmob.com/api/data/search/suggest?term=arsenal'
```

Returns an array of groups:

```ts
Array<{
  title: { key: "all" | "matches_tab_title" | "teams" | "players" | "leagues"; value: string };
  suggestions: Array<{
    type: "team" | "player" | "league" | "match";
    id: string;
    name?: string;
    leagueId?: number;
    leagueName?: string;
    teamName?: string;
    teamId?: number;
    position?: string;
    countryCode?: string;
    matchDate?: string;
    status?: MatchStatus;
    homeTeamId?: string; homeTeamName?: string; homeTeamScore?: number;
    awayTeamId?: string; awayTeamName?: string; awayTeamScore?: number;
  }>;
}>;
```

The first group (`all`) is a deduplicated blend; the remaining groups are per category.
Match suggestions do not include crest URLs — build them from `homeTeamId` / `awayTeamId`.

---

## `/allLeagues`

```ts
{
  popular: LeagueSummary[];      // 10 entries
  international: LeagueSummary[]; // UEFA / CONMEBOL / world competitions
  countries: Array<{
    name?: string;
    ccode?: string;
    leagues: LeagueSummary[];
  }>;
}

interface LeagueSummary {
  id: number;
  name: string;
  localizedName?: string;
  pageUrl?: string;
  ccode?: string;
}
```

Used by `/leagues` and the footer/league browser. Some entries have `ccode: "INT"` and no
country group.

---

## Image CDN

| Asset | URL |
| --- | --- |
| Team crest | `https://images.fotmob.com/image_resources/logo/teamlogo/{teamId}.png` |
| League logo | `https://images.fotmob.com/image_resources/logo/leaguelogo/{leagueId}.png` |
| Player portrait | `https://images.fotmob.com/image_resources/playerimages/{playerId}.png` |
| Flag | `https://images.fotmob.com/image_resources/flags/{ccode}.png` — often `403`, prefer a text country badge |

`next.config.ts` only allow-lists `images.fotmob.com`; add new hosts before using
`next/image`.

Helpers: `src/lib/assets.ts` exports `teamCrest`, `leagueLogo`, `playerImage`.

---

## Error handling and caching

- Non-2xx responses throw `Error("FotMob request failed (status) for path")`.
- A missing team/player/match can return `200` with a `null` body; guard before reading
  fields and call `notFound()` in pages.
- Cached functions use Next.js `'use cache'` with `cacheLife` / `cacheTag`:
  - fixtures refresh every 30 seconds,
  - match details every 30 seconds,
  - leagues/teams/players for hours,
  - search for minutes,
  - the league directory for days.
- Live match pages mount `<LiveRefresher active>` which calls `router.refresh()` every 25
  seconds while the tab is visible.
- Time zone: all API timestamps are UTC ISO strings; `formatKickoff` renders them in the
  server/browser locale with `Intl.DateTimeFormat`.

---

## Quick checks

```bash
# Today's fixtures
curl -s "https://www.fotmob.com/api/data/matches?date=$(date +%Y%m%d)" | jq '.leagues | length'

# A match centre
curl -s 'https://www.fotmob.com/api/data/matchDetails?matchId=6106244' | jq '.content | keys'

# A player
curl -s 'https://www.fotmob.com/api/data/playerData?id=701154' | jq '{name, team: .primaryTeam.teamName}'

# A team
curl -s 'https://www.fotmob.com/api/data/teams?id=9825' | jq '.details | {name, country}'

# Search
curl -s 'https://www.fotmob.com/api/data/search/suggest?term=arsenal' | jq '.[].title'
```
