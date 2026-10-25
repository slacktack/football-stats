export interface StatusReason {
  short?: string;
  shortKey?: string;
  long?: string;
  longKey?: string;
}

export interface LiveTime {
  short?: string;
  shortKey?: string;
  long?: string;
  longKey?: string;
}

export interface MatchStatus {
  utcTime: string;
  started?: boolean;
  finished?: boolean;
  cancelled?: boolean;
  awarded?: boolean;
  scoreStr?: string;
  reason?: StatusReason;
  liveTime?: LiveTime;
  halfs?: Record<string, string>;
  numberOfHomeRedCards?: number;
  numberOfAwayRedCards?: number;
  whoLostOnPenalties?: string | null;
  whoLostOnAggregated?: string | null;
}

export interface TeamRef {
  id: number | string;
  name: string;
  shortName?: string;
  longName?: string;
  score?: number;
  imageUrl?: string;
  pageUrl?: string;
  isOurTeam?: boolean;
}

export interface MatchSummary {
  id: number;
  leagueId: number;
  time?: string;
  home: TeamRef;
  away: TeamRef;
  status: MatchStatus;
  statusId?: number;
  timeTS?: number;
  tournamentStage?: string;
  eliminatedTeamId?: number | null;
}

export interface LeagueWithMatches {
  ccode: string;
  id: number;
  primaryId?: number;
  name: string;
  matches: MatchSummary[];
  internalRank?: number;
  localRank?: number;
  simpleLeague?: boolean;
}

export interface MatchesResponse {
  leagues: LeagueWithMatches[];
  date?: string;
}

export interface LeagueListItem {
  id: number;
  name: string;
  localizedName?: string;
  pageUrl?: string;
  ccode: string;
}

export interface LeagueGroup {
  ccode: string;
  name: string;
  localizedName?: string;
  leagues: LeagueListItem[];
}

export interface AllLeaguesResponse {
  popular: LeagueListItem[];
  international: LeagueGroup[];
  countries: LeagueGroup[];
}

export interface TableLegend {
  title: string;
  tKey: string;
  color: string;
  indices: number[];
  targetLeague?: { id: number; name: string; tKey?: string };
}

export interface TableRow {
  name: string;
  shortName?: string;
  id: number;
  pageUrl?: string;
  deduction?: number | string | null;
  ongoing?: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scoresStr: string;
  goalConDiff: number;
  pts: number;
  idx: number;
  qualColor?: string | null;
}

export interface LeagueTableWrapper {
  data: {
    ccode?: string;
    leagueId: number;
    pageUrl?: string;
    leagueName?: string;
    legend?: TableLegend[];
    ongoing?: unknown[];
    table: {
      all: TableRow[];
      home?: TableRow[];
      away?: TableRow[];
    };
  };
}

export interface FixtureTeam {
  name: string;
  shortName?: string;
  id: number | string;
  score?: number;
}

export interface Fixture {
  round?: string;
  roundName?: string | number;
  pageUrl?: string;
  id: string | number;
  home: FixtureTeam;
  away: FixtureTeam;
  opponent?: FixtureTeam;
  result?: number;
  notStarted?: boolean;
  displayTournament?: boolean;
  tournament?: { name?: string; stage?: string; leagueId?: number };
  status: MatchStatus;
}

export interface StatEntry {
  id: number;
  name: string;
  rank: number;
  ccode?: string;
  teamId?: number;
  teamName?: string;
  value: string | number;
  stat?: { name: string; value: number | string; format?: string; fractions?: number };
  teamColors?: TeamColors;
}

export interface MatchTeamColors {
  darkMode?: { home?: string; away?: string };
  lightMode?: { home?: string; away?: string };
  fontDarkMode?: { home?: string; away?: string };
  fontLightMode?: { home?: string; away?: string };
}

export interface TeamColors {
  darkMode?: string;
  lightMode?: string;
  fontDarkMode?: string;
  fontLightMode?: string;
  color?: string;
  colorAlternate?: string;
  colorAway?: string;
  colorAwayAlternate?: string;
}

export interface StatLeaderGroup {
  header: string;
  localizedTitleId?: string;
  participant?: StatEntry;
  topThree?: StatEntry[];
  fetchAllUrl?: string;
}

export interface TransferPosition {
  label: string;
  key: string;
}

export interface Transfer {
  name: string;
  playerId: number;
  position?: TransferPosition;
  transferDate?: string;
  fromClub: string;
  fromClubFullName?: string;
  fromClubId: number;
  toClub: string;
  toClubFullName?: string;
  toClubId: number;
  fee?: string | { value?: number; feeText?: string; localizedFeeText?: string } | null;
  amountEuroEstimated?: number | null;
  transferType?: { text?: string; localizationKey?: string };
  contractExtension?: boolean;
  onLoan?: boolean;
  marketValue?: number | null;
  fromClubColors?: TeamColors;
  toClubColors?: TeamColors;
}

export interface TeamTransfersData {
  type?: string;
  data?: Transfer[] | Record<string, Transfer[]>;
  allTransfers?: Transfer[];
  allRumours?: unknown[];
  maxFee?: number;
  ourTeamId?: number;
}

export interface LeagueResponse {
  tabs: string[];
  allAvailableSeasons?: string[];
  details: {
    id: number;
    type?: string;
    name: string;
    selectedSeason?: string;
    latestSeason?: string;
    shortName?: string;
    country?: string;
    gender?: string;
    nationalTeamId?: number;
    leagueColor?: string;
    seopath?: string;
    canSyncCalendar?: boolean;
  };
  table?: LeagueTableWrapper[];
  transfers?: TeamTransfersData;
  overview?: {
    season?: string;
    selectedSeason?: string;
    table?: LeagueTableWrapper[];
    topPlayers?: StatLeaderGroup[];
    leagueOverviewMatches?: Fixture[];
    hasOngoingMatch?: boolean;
    matches?: {
      allMatches?: Fixture[];
      firstUnplayedMatch?: { firstUnplayedMatchIndex?: number; firstUnplayedMatchId?: string };
    };
  };
  stats?: {
    players?: StatLeaderGroup[];
    teams?: StatLeaderGroup[];
    seasonStatLinks?: {
      Name: string;
      CountryCode: string;
      RelativePath: string;
      League: string;
      StageId: number;
      TemplateId: number;
      TournamentId: number;
    }[];
    seasonsWithLinks?: unknown[];
  };
  fixtures?: {
    firstUnplayedMatch?: { firstUnplayedMatchIndex?: number; firstUnplayedMatchId?: string };
    allMatches?: Fixture[];
    hasOngoingMatch?: boolean;
    fixtureInfo?: unknown;
  };
  seasons?: Record<string, { name?: string; id?: number | string }> | unknown[];
  playoff?: unknown;
}

export interface SquadMember {
  id: number;
  name: string;
  shirtNumber?: number;
  ccode?: string;
  cname?: string;
  role?: { key: string; fallback: string };
  positionId?: number;
  positionIdsDesc?: string;
  injury?: { id?: number; type?: string; expectedReturn?: string } | null;
  rating?: number | null;
  goals?: number;
  assists?: number;
  rcards?: number;
  ycards?: number;
  height?: number;
  age?: number;
  dateOfBirth?: string;
  transferValue?: number | null;
  isCaptain?: boolean;
}

export interface SquadGroup {
  title: string;
  members: SquadMember[];
}

export interface TeamFormEntry {
  result: number;
  resultString: string;
  imageUrl?: string;
  linkToMatch?: string;
  date?: { utcTime: string };
  teamPageUrl?: string;
  score?: string;
  tournamentName?: string;
  home?: TeamRef;
  away?: TeamRef;
}

export interface TeamNewsSummary {
  items?: {
    summary?: string;
    source?: { sourceName?: string; uri?: string; articleId?: string; title?: string };
  }[];
}

export interface TeamCoachHistory {
  id: number;
  name: string;
  season: string;
  leagueId?: number;
  leagueName?: string;
  win: number;
  draw: number;
  loss: number;
  pointsPerGame: number;
  winPercentage: number;
}

export interface TeamFixture extends Fixture {
  tournament?: { name?: string; stage?: string; leagueId?: number };
}

export interface TeamResponse {
  tabs: string[];
  allAvailableSeasons?: string[];
  details: {
    id: number;
    type?: string;
    name: string;
    latestSeason?: string;
    shortName?: string;
    country?: string;
    gender?: string;
    nationalTeamId?: number;
    primaryLeagueId?: number;
    primaryLeagueName?: string;
    teamColor?: string;
    seopath?: string;
  };
  table?: LeagueTableWrapper[];
  transfers?: TeamTransfersData;
  overview?: {
    season?: string;
    selectedSeason?: string;
    table?: LeagueTableWrapper[];
    topPlayers?: StatLeaderGroup[];
    venue?: {
      widget?: { name?: string; location?: string[]; city?: string };
      statPairs?: [string, string | number][];
    };
    coachHistory?: TeamCoachHistory[];
    overviewFixtures?: Fixture[];
    nextMatch?: TeamFixture | null;
    lastMatch?: TeamFixture | null;
    teamForm?: TeamFormEntry[];
    hasOngoingMatch?: boolean;
    teamColors?: TeamColors;
    newsSummary?: TeamNewsSummary | null;
    featuredArticle?: unknown;
    squad?: SquadGroup[];
    transfers?: TeamTransfersData;
  };
  stats?: {
    teamId?: number;
    primaryLeagueId?: number;
    primarySeasonId?: number;
    players?: StatLeaderGroup[];
    teams?: StatLeaderGroup[];
    tournamentSeasons?: unknown;
  };
  fixtures?: {
    allFixtures?: {
      fixtures?: TeamFixture[];
      nextMatch?: TeamFixture | null;
      lastMatch?: TeamFixture | null;
    };
    primaryTournamentId?: number;
  };
  squad?: { squad?: SquadGroup[]; isNationalTeam?: boolean };
  history?: {
    trophyList?: {
      name: string;
      leagueId?: string;
      won?: number;
      runnerup?: number;
      seasonsWon?: string;
      seasonsRunnerup?: string;
      availableSeasons?: string[];
    }[];
    historicalTableData?: unknown;
    coachHistory?: TeamCoachHistory[];
    tables?: unknown;
  };
}

export interface PlayerStatsItem {
  title: string;
  localizedTitleId?: string;
  value: number | string;
}

export interface PlayerInfoItem {
  title: string;
  translationKey?: string;
  countryCode?: string;
  nationalTeamId?: number;
  icon?: { type?: string; id?: string };
  value:
    | string
    | number
    | {
        numberValue?: number;
        key?: string | null;
        fallback?: string | number | { utcTime?: string; timezone?: string };
        options?: Record<string, unknown>;
        unit?: string;
      };
}

export interface PlayerPositionOccurrence {
  strPos?: { label?: string; key?: string };
  strPosShort?: { label?: string; key?: string };
  occurences?: number;
  position?: string;
  isMainPosition?: boolean;
}

export interface PlayerRecentMatch {
  teamId: number;
  teamName: string;
  opponentTeamId: number;
  opponentTeamName: string;
  isHomeTeam: boolean;
  id: number;
  matchDate: { utcTime: string };
  matchPageUrl?: string;
  leagueId?: number;
  leagueName?: string;
  stage?: string | null;
  homeScore?: number;
  awayScore?: number;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  ratingProps?: { rating?: string; isTopRating?: boolean };
  playerOfTheMatch?: boolean;
  onBench?: boolean;
  playedInMatch?: boolean;
  lineupPositionId?: number;
}

export interface PlayerTrophyTeam {
  ccode?: string;
  teamId: number;
  teamName: string;
  tournaments?: {
    ccode?: string;
    leagueId?: number;
    leagueName?: string;
    seasonsWon?: string[];
    seasonsRunnerUp?: string[];
  }[];
}

export interface PlayerCareerEntry {
  participantId?: number;
  teamId: number;
  team: string;
  teamGender?: string;
  startDate?: string;
  endDate?: string | null;
  active?: boolean;
  role?: string | null;
  appearances?: string;
  goals?: string;
  assists?: string;
  transferType?: { text?: string; localizationKey?: string } | null;
}

export interface PlayerDeepStat {
  localizedTitleId: string;
  per90?: number;
  percentileRank?: number;
  percentileRankPer90?: number;
  statValue: string;
  statFormat?: string;
  title: string;
}

export interface PlayerStatsSection {
  id?: string;
  display?: string;
  localizedTitleId?: string;
  title?: string;
  type?: string;
  items?: PlayerDeepStat[];
}

export interface PlayerShot {
  id: number;
  playerName?: string;
  eventType?: string;
  shotType?: string;
  situation?: string;
  teamId?: number;
  playerId?: number;
  x: number;
  y: number;
  min?: number;
  period?: string;
  isOwnGoal?: boolean;
  isBlocked?: boolean;
  isOnTarget?: boolean;
  expectedGoals?: number;
  expectedGoalsOnTarget?: number;
  box?: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  matchId?: number;
  matchDate?: string;
  teamColor?: string;
}

export interface PlayerNextMatch {
  matchId: number;
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
  matchDate: string;
  statusId?: number;
  leagueId?: number;
  leagueName?: string;
  matchUrl?: string;
  stadium?: { venue?: string; city?: string };
  status: {
    utcTime: string;
    started?: boolean;
    cancelled?: boolean;
    finished?: boolean;
  };
}

export interface PlayerResponse {
  id: number;
  name: string;
  birthDate?: { utcTime: string; timezone?: string };
  contractEnd?: { utcTime: string; timezone?: string };
  isCoach?: boolean;
  isCaptain?: boolean;
  gender?: string;
  status?: string;
  positionDescription?: {
    positions?: PlayerPositionOccurrence[];
    primaryPosition?: { label?: string; key?: string };
    nonPrimaryPositions?: { label?: string; key?: string }[];
  };
  primaryTeam?: {
    teamId: number;
    teamName: string;
    onLoan?: boolean;
    teamColors?: TeamColors;
  };
  injuryInformation?: {
    expectedReturn?: string;
    injury?: { type?: string; description?: string };
  } | null;
  internationalDuty?: unknown;
  playerInformation?: PlayerInfoItem[];
  mainLeague?: {
    leagueId: number;
    leagueName: string;
    season?: string;
    stats?: PlayerStatsItem[];
  };
  trophies?: {
    playerTrophies?: PlayerTrophyTeam[];
    coachTrophies?: PlayerTrophyTeam[];
  };
  recentMatches?: PlayerRecentMatch[];
  initialMatchesPage?: { matches?: PlayerRecentMatch[]; previous?: string };
  matchesUrl?: string;
  careerHistory?: {
    showFootnote?: boolean;
    careerItems?: Record<string, { teamEntries?: PlayerCareerEntry[] }>;
  };
  traits?: {
    key?: string;
    title?: string;
    items?: { key: string; title: string; value: number }[];
  };
  statSeasons?: {
    seasonName: string;
    tournaments: { name: string; tournamentId: number; entryId: string; hasDeepStats: boolean }[];
  }[];
  firstSeasonStats?: {
    sectionOrder?: string[];
    shotmap?: PlayerShot[];
    statsSection?: { items?: PlayerStatsSection[] };
    topStatCard?: PlayerStatsSection;
  };
  marketValues?: {
    values?: {
      date: string;
      value: number;
      currency?: string;
      teamId?: number;
      teamName?: string;
      isPeriodStart?: boolean;
      teamColor?: TeamColors;
    }[];
  };
  nextMatch?: PlayerNextMatch;
  meta?: { seopath?: string; pageurl?: string };
}

export interface MatchHeaderTeam {
  name: string;
  id: number;
  score?: number;
  imageUrl?: string;
  pageUrl?: string;
}

export interface MatchEventShot {
  id: number;
  eventType: string;
  teamId: number;
  playerId?: number;
  playerName?: string;
  x: number;
  y: number;
  min: number;
  minAdded?: number | null;
  isBlocked?: boolean;
  isOnTarget?: boolean;
  expectedGoals?: number;
  shotType?: string;
  situation?: string;
  period?: string;
  isOwnGoal?: boolean;
}

export interface TimelineEvent {
  reactKey?: string;
  timeStr?: number;
  type: string;
  time: number;
  overloadTime?: number | null;
  eventId?: number;
  player?: { id?: number | null; name?: string; profileUrl?: string };
  playerId?: number;
  isHome?: boolean;
  nameStr?: string;
  card?: string;
  cardDescription?: string | null;
  cardReason?: string | null;
  ownGoal?: boolean | null;
  goalDescription?: string | null;
  suffix?: string | null;
  isPenaltyShootoutEvent?: boolean;
  newScore?: [number, number] | null;
  penShootoutScore?: [number, number] | null;
  homeScore?: number;
  awayScore?: number;
  assistStr?: string | null;
  assistPlayerId?: number | null;
  assistProfileUrl?: string | null;
  assistInput?: string | null;
  cardDescriptionKey?: string | null;
  suffixKey?: string | null;
  halfStrShort?: string;
  halfStrKey?: string;
  minutesAddedStr?: string;
  minutesAddedKey?: string;
  minutesAddedInput?: number;
  swap?: { name: string; id: string; profileUrl?: string }[];
  injuredPlayerOut?: boolean;
  shotmapEvent?: MatchEventShot;
  [key: string]: unknown;
}

export interface MatchInfoBox {
  legInfo?: unknown;
  MatchDate?: { utcTime?: string };
  'Match Date'?: { utcTime: string; isDateCorrect?: boolean };
  Tournament?: {
    id?: number;
    parentLeagueId?: number;
    link?: string;
    leagueName?: string;
    roundName?: string | null;
    round?: string | number | null;
  };
  Stadium?: {
    name?: string;
    city?: string;
    country?: string;
    capacity?: number;
    surface?: string;
    lat?: number;
    long?: number;
  };
  Referee?: {
    text?: string;
    id?: number;
    imgUrl?: string;
    countryCode?: string;
    country?: string;
    stats?: { type: string; value: number; valueType?: string }[];
  };
  Attendance?: number;
  [key: string]: unknown;
}

export interface MatchFacts {
  matchId?: number;
  events?: { ongoing?: boolean; events?: TimelineEvent[] };
  highlights?: { image?: string; url?: string; source?: string; title?: string };
  playerOfTheMatch?: {
    id: number;
    name: { firstName?: string; lastName?: string; fullName?: string };
    teamName?: string;
    teamId?: number;
    rating?: { num?: string; isTop?: { isTopRating?: boolean } };
    minutesPlayed?: number;
    pageUrl?: string;
    isHomeTeam?: boolean;
    stats?: unknown[];
  } | null;
  infoBox?: MatchInfoBox;
  teamForm?: TeamFormEntry[][];
  poll?: unknown;
  topPlayers?: {
    homeTopPlayers?: MatchTopPlayer[];
    awayTopPlayers?: MatchTopPlayer[];
    [key: string]: unknown;
  };
  insights?: unknown;
  topScorers?: unknown;
  momentum?: unknown;
  countryCode?: string;
  [key: string]: unknown;
}

export interface MatchTopPlayer {
  playerId: number;
  name: { firstName?: string; lastName?: string; fullName?: string };
  playerRatingRounded?: string;
  playerRating?: number;
  color?: string;
  manOfTheMatch?: boolean;
  teamId?: string;
  positionLabel?: { label: string; key: string };
}

export interface MatchStatValue {
  title: string;
  key: string;
  stats?: [number | string | null, number | string | null];
  rawStats?: { value?: number | null; total?: number | null }[];
  format?: string;
  type?: string;
  highlighted?: string;
}

export interface MatchStatGroup {
  title: string;
  key?: string;
  stats?: MatchStatValue[];
}

export interface MatchStats {
  Periods?: Record<string, { stats?: MatchStatGroup[] }>;
  [key: string]: unknown;
}

export interface LineupPlayer {
  id: number;
  age?: number;
  name: string;
  positionId?: number;
  usualPlayingPositionId?: number;
  shirtNumber?: string;
  countryName?: string;
  countryCode?: string;
  horizontalLayout?: { x: number; y: number; height: number; width: number };
  verticalLayout?: { x: number; y: number; height: number; width: number };
  marketValue?: number;
  performance?: {
    rating?: number;
    seasonRating?: number;
    seasonGoals?: number;
    seasonAssists?: number;
    substitutionEvents?: { time: number; type: string }[];
  };
  firstName?: string;
  lastName?: string;
  nationalTeamId?: number;
  rankings?: unknown;
}

export interface LineupTeam {
  id: number;
  name: string;
  rating?: number;
  formation?: string;
  starters?: LineupPlayer[];
  coach?: { id?: number; name?: string; countryCode?: string };
  subs?: LineupPlayer[];
  unavailable?: { id?: number; name?: string; reason?: string }[];
  averageStarterAge?: number;
  totalStarterMarketValue?: number;
}

export interface MatchLineup {
  matchId?: number;
  lineupType?: string;
  source?: string;
  availableFilters?: unknown;
  homeTeam?: LineupTeam;
  awayTeam?: LineupTeam;
}

export interface H2HMatch {
  time?: { utcTime: string };
  matchUrl?: string;
  league?: { name?: string; id?: string | number; pageUrl?: string };
  home: { name: string; id: string | number; score?: number };
  away: { name: string; id: string | number; score?: number };
  status?: MatchStatus;
  finished?: boolean;
}

export interface MatchResponse {
  general: {
    matchId: string;
    matchName?: string;
    matchRound?: string;
    teamColors?: MatchTeamColors;
    leagueId: number;
    leagueName?: string;
    leagueRoundName?: string;
    parentLeagueId?: number;
    countryCode?: string;
    homeTeam?: MatchHeaderTeam;
    awayTeam?: MatchHeaderTeam;
    coverageLevel?: string;
    matchTimeUTC?: string;
    matchTimeUTCDate?: string;
    started?: boolean;
    finished?: boolean;
    gender?: string;
  };
  header: {
    teams: MatchHeaderTeam[];
    status: MatchStatus;
    events?: unknown;
  };
  nav?: string[];
  ongoing?: unknown;
  hasPendingVAR?: boolean;
  content: {
    matchFacts?: MatchFacts;
    liveticker?: unknown;
    superlive?: unknown;
    buzz?: unknown[];
    stats?: MatchStats;
    playerStats?: Record<string, unknown>;
    shotmap?: { shots?: MatchEventShot[]; Periods?: unknown };
    weather?: {
      temperature?: number;
      windSpeed?: number;
      windDirectionCardinal?: string;
      relativeHumidity?: number;
      precipitation?: number;
      cloudCover?: number;
      description?: string;
      [key: string]: unknown;
    };
    lineup?: MatchLineup;
    hasPlayoff?: unknown;
    table?: { leagueId?: string | number; url?: string; teams?: number[]; parentLeagueId?: number };
    h2h?: { summary?: number[]; matches?: H2HMatch[] };
    momentum?: { main?: { data?: { minute: number; value: number }[] } };
    attackingZones?: {
      home?: Record<string, { left?: number; center?: number; right?: number }>;
      away?: Record<string, { left?: number; center?: number; right?: number }>;
    };
    heatmapUrl?: Record<string, string>;
  };
  seo?: unknown;
}

export interface SearchSuggestion {
  type: 'team' | 'player' | 'league' | 'match';
  id: string;
  score?: number;
  name?: string;
  leagueId?: number;
  leagueName?: string;
  matchDate?: string;
  status?: MatchStatus;
  homeTeamId?: string;
  homeTeamName?: string;
  homeTeamScore?: number;
  awayTeamId?: string;
  awayTeamName?: string;
  awayTeamScore?: number;
  teamName?: string;
  teamId?: number;
  position?: string;
  countryCode?: string;
}

export interface SearchGroup {
  title: { key: string; value: string };
  suggestions: SearchSuggestion[];
}

export interface SearchResult {
  type: SearchSuggestion['type'];
  id: string;
  name: string;
  subtitle?: string;
  href: string;
  image?: string;
  imageAlt?: string;
  secondaryImage?: string;
  meta?: string;
}
