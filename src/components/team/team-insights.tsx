import { LocalTime } from "@/components/local-time";
import { PlayerPhoto } from "@/components/player-photo";
import Link from "next/link";
import { parseRating, ratingTier } from "@/lib/format";
import { ChevronRightIcon } from "../icons";
import { Crest, RatingChip } from "../ui";

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
      className="relative shrink-0 overflow-hidden rounded-full bg-card-2 ring-1 ring-inset ring-white/10"
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
          <section key={board.key} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5">
              <h3 className="eyebrow">{board.title}</h3>
              {board.key === "byRating" && (
                <span className="text-[11px] font-medium text-dim">Season avg.</span>
              )}
            </div>
            <Link
              href={`/player/${leader.id}`}
              className="press group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
            >
              <PlayerAvatar id={leader.id} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink transition-colors group-hover:text-accent">
                  {leader.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-dim">
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
            <div className="divide-y divide-line/35 border-t border-line/40">
              {rest.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  className="press flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <PlayerAvatar id={player.id} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-muted">
                    {player.name}
                  </span>
                  {showTeam && player.teamId ? (
                    <Crest id={player.teamId} name={player.teamName ?? ""} size={16} />
                  ) : null}
                  <BoardValue boardKey={board.key} value={player.value} />
                </Link>
              ))}
            </div>
          </section>
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
      className={`font-display font-black text-ink num ${large ? "text-[26px] leading-none" : "text-[15px]"}`}
    >
      {value ?? 0}
    </span>
  );
}

const DIFFICULTY = [
  { label: "Easy", bg: "#39ff6b", fg: "#04130a" },
  { label: "Fair", bg: "#b8ec5a", fg: "#121a04" },
  { label: "Moderate", bg: "#f5c542", fg: "#1a1305" },
  { label: "Hard", bg: "#ff8f4a", fg: "#1f0c02" },
  { label: "Very hard", bg: "#c18cff", fg: "#140726" },
];

export function FixtureDifficultyCard({ data }: { data?: FixtureDifficulty | null }) {
  const fixtures = data?.fixtures ?? [];
  if (!fixtures.length) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Fixture difficulty</p>
        {data?.difficulty && (
          <span className="text-xs font-bold text-ink">{data.difficulty}</span>
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-dim">
        {data?.subheader ?? "Next matches"}
        {data?.leagueName ? ` · ${data.leagueName}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {fixtures.slice(0, 3).map((fixture) => {
          const level = DIFFICULTY[Math.min(4, Math.max(0, (fixture.difficulty ?? 3) - 1))];
          return (
            <Link
              key={fixture.matchId}
              href={`/match/${fixture.matchId}`}
              className="press group flex flex-col items-center gap-1.5 rounded-xl border border-line/60 bg-white/[0.02] px-1.5 py-2.5 text-center transition-colors hover:border-line"
            >
              <Crest id={fixture.opponentId} name={fixture.opponentName} size={28} />
              <span className="text-xs font-bold text-ink">
                {fixture.opponentShortName ?? fixture.opponentName.slice(0, 3).toUpperCase()}
                <span className="ml-1 font-semibold text-dim">{fixture.isHome ? "H" : "A"}</span>
              </span>
              <span
                className="w-full rounded-md py-0.5 text-[11px] font-extrabold"
                style={{ backgroundColor: level.bg, color: level.fg }}
              >
                {level.label}
              </span>
              {fixture.matchDateUtc && (
                <span className="text-[11px] text-dim">
                  <LocalTime value={fixture.matchDateUtc} kind="monthDay" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
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
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Last lineup</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] font-semibold text-muted">
            {opponentId ? (
              <>
                vs <Crest id={opponentId} name={opponentName ?? ""} size={16} />
                <span className="truncate">{opponentName}</span>
              </>
            ) : (
              data?.name
            )}
            {data?.formation && <span className="text-dim">· {data.formation}</span>}
          </p>
        </div>
        {data?.rating ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-dim">Team</span>
            <RatingChip rating={data.rating} size="lg" />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 divide-x divide-line/50 border-b border-line/50 text-center">
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
              className="press group flex items-center gap-2.5 border-b border-line/30 px-4 py-2.5 transition-colors hover:bg-white/[0.03] sm:odd:border-r"
            >
              <PlayerAvatar id={player.id} size={30} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-ink group-hover:text-accent">
                  {player.name}
                  {rating !== null && rating === top && (
                    <span className="text-[11px] text-accent" aria-label="Best rated">★</span>
                  )}
                </p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  {rating !== null && (
                    <div
                      className="rating-bar bar-grow h-full rounded-full"
                      data-tier={ratingTier(rating)}
                      style={{ width: `${width}%` }}
                    />
                  )}
                </div>
              </div>
              <RatingChip rating={player.performance?.rating} />
            </Link>
          );
        })}
      </div>

      {match?.matchId && (
        <Link
          href={`/match/${match.matchId}?tab=lineups`}
          className="flex items-center justify-center gap-1 py-3 text-xs font-bold text-accent transition-colors hover:bg-white/[0.03]"
        >
          Open match lineups
          <ChevronRightIcon size={13} />
        </Link>
      )}
    </section>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-2 py-3">
      <p className="font-display text-[17px] font-extrabold leading-none text-ink num">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-dim">{label}</p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
