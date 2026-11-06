import { LocalTime } from "@/components/local-time";
import { PlayerPhoto } from "@/components/player-photo";
import Link from "next/link";
import { parseRating, ratingTier } from "@/lib/format";
import { ChevronRightIcon } from "../icons";
import { Crest, RatingChip } from "../ui";
import { AsciiBar, K, Panel } from "../tl";

export type TopPlayer = {
  id: number;
  name: string;
  teamId?: number;
  teamName?: string;
  value?: number;
  rank?: number;
};

export type TopPlayersData = {
  byRating?: { players?: TopPlayer[] };
  byGoals?: { players?: TopPlayer[] };
  byAssists?: { players?: TopPlayer[] };
};

export type FixtureDifficulty = {
  leagueName?: string;
  subheader?: string;
  difficulty?: string;
  fixtures?: {
    matchId: number;
    opponentId: number;
    opponentName: string;
    opponentShortName?: string;
    isHome?: boolean;
    difficulty?: number;
    matchDateUtc?: string;
  }[];
};

export type LastLineup = {
  id?: number;
  name?: string;
  rating?: number;
  formation?: string;
  averageStarterAge?: number;
  totalStarterMarketValue?: number;
  coach?: { id?: number; name?: string };
  starters?: {
    id: number;
    name: string;
    shirtNumber?: string;
    age?: number;
    performance?: {
      rating?: number;
      seasonRating?: number;
      seasonGoals?: number;
      totalDistanceCovered?: number;
      topSpeed?: number;
    };
  }[];
  lastMatch?: {
    matchId?: number;
    homeTeamId?: number;
    homeTeamName?: string;
    awayTeamId?: number;
    awayTeamName?: string;
  };
};

// FotMob types topPlayers as leader groups on some endpoints; only accept the keyed shape.
export function asTopPlayers(value: unknown): TopPlayersData | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const data = value as TopPlayersData;
  return data.byRating || data.byGoals || data.byAssists ? data : null;
}

function PlayerAvatar({ id, size = 40 }: { id: number; size?: number }) {
  return (
    <span
      className="relative shrink-0 overflow-hidden border border-line bg-card-2"
      style={{ width: size, height: size }}
    >
      <PlayerPhoto
        playerId={id}
        alt=""
        width={size}
        height={size}
        className="h-full w-full scale-110 object-cover object-top"
      />
    </span>
  );
}

const BOARDS = [
  { key: "byRating", title: "Top rated", unit: "" },
  { key: "byGoals", title: "Goals", unit: "G" },
  { key: "byAssists", title: "Assists", unit: "A" },
] as const;

export function TopPlayersBoard({
  data,
  showTeam = false,
}: {
  data: TopPlayersData;
  showTeam?: boolean;
}) {
  const boards = BOARDS.map((board) => ({
    ...board,
    players: data[board.key]?.players ?? [],
  })).filter((board) => board.players.length > 0);
  if (!boards.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {boards.map((board) => {
        const [leader, ...rest] = board.players;
        return (
          <Panel
            key={board.key}
            label={board.title}
            aside={board.key === "byRating" ? "Season avg." : undefined}
            className="overflow-hidden"
          >
            <Link
              href={`/player/${leader.id}`}
              className="press group flex items-center gap-3 py-2 transition-colors hover:bg-hover"
            >
              <PlayerAvatar id={leader.id} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink transition-colors group-hover:text-accent">
                  {leader.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-dim">
                  {showTeam && leader.teamId ? (
                    <>
                      <Crest id={leader.teamId} name={leader.teamName ?? ""} size={14} />
                      {leader.teamName}
                    </>
                  ) : leader.rank ? (
                    `#${leader.rank} in league`
                  ) : null}
                </p>
              </div>
              <BoardValue boardKey={board.key} value={leader.value} large />
            </Link>
            <div className="divide-y divide-line border-t border-line">
              {rest.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  className="press group flex items-center gap-2.5 py-2 transition-colors hover:bg-hover"
                >
                  <PlayerAvatar id={player.id} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-muted group-hover:text-ink">
                    {player.name}
                  </span>
                  {showTeam && player.teamId ? (
                    <Crest id={player.teamId} name={player.teamName ?? ""} size={16} />
                  ) : null}
                  <BoardValue boardKey={board.key} value={player.value} />
                </Link>
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function BoardValue({
  boardKey,
  value,
  large = false,
}: {
  boardKey: (typeof BOARDS)[number]["key"];
  value?: number;
  large?: boolean;
}) {
  if (boardKey === "byRating") return <RatingChip rating={value} size={large ? "lg" : "md"} />;
  return (
    <span
      className={`tl-num text-ink ${large ? "text-[22px]" : "text-[13px]"}`}
    >
      {value ?? 0}
    </span>
  );
}

/* Difficulty is an ordinal readout, not a crayon ramp: the lamp tone buckets
   it (calm / caution / danger) and the block meter still shows 1–5. */
const DIFFICULTY: {
  label: string;
  tone: "teal" | "amber" | "alert";
}[] = [
  { label: "Easy", tone: "teal" },
  { label: "Fair", tone: "teal" },
  { label: "Moderate", tone: "amber" },
  { label: "Hard", tone: "alert" },
  { label: "Very hard", tone: "alert" },
];

export function FixtureDifficultyCard({ data }: { data?: FixtureDifficulty | null }) {
  const fixtures = data?.fixtures ?? [];
  if (!fixtures.length) return null;

  return (
    <Panel label="Fixture difficulty" aside={data?.difficulty}>
      <p className="tl-k tl-k-dim mb-2.5">
        {data?.subheader ?? "Next matches"}
        {data?.leagueName ? ` · ${data.leagueName}` : ""}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {fixtures.slice(0, 3).map((fixture) => {
          const index = Math.min(4, Math.max(0, (fixture.difficulty ?? 3) - 1));
          const level = DIFFICULTY[index];
          return (
            <Link
              key={fixture.matchId}
              href={`/match/${fixture.matchId}`}
              className="press group flex flex-col items-center gap-2 border border-line bg-card-2/60 p-2 text-center transition-colors hover:bg-hover"
            >
              <Crest id={fixture.opponentId} name={fixture.opponentName} size={28} />
              <span className="text-[11.5px] font-semibold text-ink">
                {fixture.opponentShortName ?? fixture.opponentName.slice(0, 3).toUpperCase()}
                <span className="ml-1 font-medium text-dim">{fixture.isHome ? "H" : "A"}</span>
              </span>
              <span className="w-full">
                <AsciiBar
                  value={index + 1}
                  total={5}
                  blocks={5}
                  tone={level.tone === "teal" ? "mint" : level.tone === "amber" ? "sky" : "alert"}
                  className="text-[10px]"
                />
                <span className="tl-k tl-k-dim mt-1 block text-center">{level.label}</span>
              </span>
              {fixture.matchDateUtc && (
                <span className="text-[10.5px] text-dim">
                  <LocalTime value={fixture.matchDateUtc} kind="monthDay" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function LastLineupCard({ data }: { data?: LastLineup | null }) {
  const starters = (data?.starters ?? []).filter((player) => player.id);
  if (!starters.length) return null;

  const sorted = [...starters].sort(
    (a, b) => (b.performance?.rating ?? 0) - (a.performance?.rating ?? 0),
  );
  const top = parseRating(sorted[0]?.performance?.rating);
  const distance = starters.reduce(
    (sum, player) => sum + (player.performance?.totalDistanceCovered ?? 0),
    0,
  );
  const fastest = starters.reduce(
    (best, player) =>
      (player.performance?.topSpeed ?? 0) > (best?.performance?.topSpeed ?? 0) ? player : best,
    starters[0],
  );
  const match = data?.lastMatch;
  const opponentId = match
    ? match.homeTeamId === data?.id
      ? match.awayTeamId
      : match.homeTeamId
    : undefined;
  const opponentName = match
    ? match.homeTeamId === data?.id
      ? match.awayTeamName
      : match.homeTeamName
    : undefined;

  return (
    <Panel label="Last lineup" aside={data?.formation}>
      <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-dashed border-line-strong pb-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-muted">
            {opponentId ? (
              <>
                vs <Crest id={opponentId} name={opponentName ?? ""} size={16} />
                <span className="truncate">{opponentName}</span>
              </>
            ) : (
              data?.name
            )}
          </p>
        </div>
        {data?.rating ? (
          <div className="flex items-center gap-2">
            <K dim>Team</K>
            <RatingChip rating={data.rating} size="lg" />
          </div>
        ) : null}
      </div>

      <div className="tl-kpis mb-3">
        <MiniStat label="Avg. age" value={data?.averageStarterAge?.toFixed(1) ?? "—"} />
        <MiniStat
          label="Distance"
          value={distance > 0 ? `${(distance / 1000).toFixed(1)} km` : "—"}
        />
        <MiniStat
          label="Top speed"
          value={
            fastest?.performance?.topSpeed
              ? `${fastest.performance.topSpeed.toFixed(1)} km/h`
              : "—"
          }
          hint={fastest?.performance?.topSpeed ? fastest.name.split(" ").slice(-1)[0] : undefined}
        />
      </div>

      <div className="stagger grid sm:grid-cols-2">
        {sorted.map((player) => {
          const rating = parseRating(player.performance?.rating);
          const width = rating ? Math.min(100, Math.max(6, ((rating - 4) / 6) * 100)) : 0;
          return (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="press group flex items-center gap-2.5 border-b border-line py-2.5 transition-colors hover:bg-hover sm:odd:border-r"
            >
              <PlayerAvatar id={player.id} size={30} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-ink group-hover:text-accent">
                  {player.name}
                  {rating !== null && rating === top && (
                    <span className="text-[10.5px] text-accent" aria-label="Best rated">★</span>
                  )}
                </p>
                <span className="tl-meter mt-1 block">
                  {rating !== null && (
                    <span
                      className="rating-bar bar-grow block h-full"
                      data-tier={ratingTier(rating)}
                      style={{ width: `${width}%` }}
                    />
                  )}
                </span>
              </div>
              <RatingChip rating={player.performance?.rating} />
            </Link>
          );
        })}
      </div>

      {match?.matchId && (
        <Link
          href={`/match/${match.matchId}?tab=lineups`}
          className="mt-3 flex items-center justify-center gap-1 border border-line py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-accent transition-colors hover:bg-hover"
        >
          Open match lineups
          <ChevronRightIcon size={13} />
        </Link>
      )}
    </Panel>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  // Doto has no em dash: it renders one as five dots, which reads as a code.
  const numeric = /\d/.test(value);
  return (
    <div className="tl-kpi text-center">
      <p className={`tl-kpi-v mx-auto ${numeric ? "tl-num" : "text-[22px] text-dim"}`}>{value}</p>
      <p className="tl-kpi-src justify-center">{label}</p>
      {hint && <p className="truncate text-[10.5px] text-muted">{hint}</p>}
    </div>
  );
}
