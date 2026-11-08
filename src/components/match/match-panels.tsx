import { LocalTime } from "@/components/local-time";
import { PlayerPhoto } from "@/components/player-photo";
import Image from "next/image";
import Link from "next/link";
import type {
  H2HMatch,
  LineupTeam,
  MatchEventShot,
  MatchFacts,
  MatchLineup,
  MatchStatValue,
  MatchStats,
  MatchTeamColors,
  TeamFormEntry,
  TimelineEvent,
} from "@/lib/types";
import { CardIcon, GoalIcon, SubIcon } from "../icons";
import { Crest, DataRow, EmptyState, FormPill, RatingChip } from "../ui";
import { Leds, LogRow, Panel, StatRow as BlockMeterRow } from "../tl";
import { LineupPitch, TallyGlyph, type PitchPlayer } from "./lineup-pitch";
import { positionLabel, type MatchPlayerRow } from "@/lib/match-players";

/* Signal log kind: which colour block the glyph box wears. */
function eventKind(event: TimelineEvent): "goal" | "card" | "sub" | "miss" | undefined {
  if (event.type === "Goal") return "goal";
  if (event.type === "Substitution") return "sub";
  if (event.type === "PenaltyMissed") return "miss";
  if (event.type === "Card") return event.card === "Red" ? "miss" : "card";
  return undefined;
}

/** Per-player goals and assists for this match, read off the event log.
    The feed carries neither on the lineup payload, so the timeline is the
    only place the two can be counted. */
function goalTally(events: TimelineEvent[]) {
  const tally = new Map<number, { goals: number; assists: number }>();
  const bump = (id: number | null | undefined, key: "goals" | "assists") => {
    if (!id) return;
    const row = tally.get(id) ?? { goals: 0, assists: 0 };
    row[key] += 1;
    tally.set(id, row);
  };
  for (const event of events) {
    if (event.type !== "Goal" || event.isPenaltyShootoutEvent) continue;
    if (!event.ownGoal) bump(event.playerId ?? event.player?.id, "goals");
    bump(event.assistPlayerId, "assists");
  }
  return tally;
}

export function Timeline({
  facts,
  homeTeam,
  awayTeam,
  live = false,
  minute,
}: {
  facts?: MatchFacts;
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
  live?: boolean;
  minute?: string;
}) {
  const events = facts?.events?.events ?? [];
  const visible = events.filter((event) =>
    ["Goal", "Card", "Substitution", "Half", "AddedTime", "PenaltyMissed"].includes(event.type),
  );
  const meaningful = visible.filter((event) => event.type !== "Half" && event.type !== "AddedTime");
  if (!meaningful.length) {
    return (
      <EmptyState
        icon={live ? <Leds n={5} /> : undefined}
        title={live ? "Waiting for the first big moment" : "No match events recorded"}
        description={
          live
            ? `Live ${minute ?? ""} · no goals, cards or substitutions yet. This page refreshes automatically.`
            : undefined
        }
      />
    );
  }

  return (
    <Panel label="Match timeline" aside={`${meaningful.length} logged · goals, cards & changes`} leds>
      <ol className="min-w-0">
        {visible.map((event, index) => {
          if (event.type === "Half") {
            return (
              <li key={`${event.reactKey ?? index}`} className="flex items-center gap-3 py-2">
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                <span className="tl-k">
                  {event.halfStrShort ?? (event.time >= 90 ? "FT" : "HT")}
                </span>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </li>
            );
          }
          if (event.type === "AddedTime") {
            return (
              <li key={`${event.reactKey ?? index}`} className="flex items-center gap-2 py-1.5">
                <span className="tl-num text-[12px] text-sky">+{event.minutesAddedInput ?? 1}</span>
                <span className="tl-k tl-k-dim">min added</span>
              </li>
            );
          }
          const isHome = event.isHome ?? false;
          const team = isHome ? homeTeam : awayTeam;
          return (
            <LogRow
              key={`${event.reactKey ?? index}`}
              minute={event.timeStr ?? event.time}
              glyph={<EventIcon type={event.type} />}
              kind={eventKind(event)}
            >
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Crest id={team.id} name={team.name} size={16} />
                <EventText event={event} isHome={isHome} homeTeam={homeTeam} awayTeam={awayTeam} />
                {event.newScore && (
                  <span className="tl-num text-[12px] text-muted">
                    {event.newScore[0]}–{event.newScore[1]}
                  </span>
                )}
              </span>
            </LogRow>
          );
        })}
      </ol>
    </Panel>
  );
}

/** Glyph for the 22px log box. The box itself is .tl-log-glyph (CSS). */
function EventIcon({ type }: { type: string }) {
  if (type === "Goal") return <GoalIcon size={12} />;
  if (type === "Card") return <CardIcon size={12} />;
  if (type === "Substitution") return <SubIcon size={12} />;
  if (type === "PenaltyMissed") return <span aria-hidden="true">✕</span>;
  return <span className="h-1 w-1 bg-dim" aria-hidden="true" />;
}

function EventText({
  event,
  isHome,
  homeTeam,
  awayTeam,
}: {
  event: TimelineEvent;
  isHome: boolean;
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
}) {
  const team = isHome ? homeTeam : awayTeam;
  if (event.type === "Goal") {
    return (
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-ink">
          {event.player?.name ?? event.nameStr}
          {event.ownGoal ? " (OG)" : ""}
        </span>
        {event.assistStr && (
          <span className="mt-0.5 block truncate text-[11px] text-dim">{event.assistStr}</span>
        )}
      </span>
    );
  }
  if (event.type === "Substitution") {
    const [on, off] = event.swap ?? [];
    return (
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-ink">
          <span className="text-live">↑</span> {on?.name ?? "Player in"}
        </span>
        <span className="block truncate text-[11px] text-dim">
          <span className="text-violet">↓</span> {off?.name ?? "Player out"}
        </span>
      </span>
    );
  }
  return (
    <span className="min-w-0">
      <span className="block truncate text-[12px] font-semibold text-ink">
        {event.player?.name ?? event.nameStr ?? event.type}
      </span>
      <span className="mt-0.5 block truncate text-[11px] text-dim">
        {event.card ? `${event.card} card` : team.name}
      </span>
    </span>
  );
}

export function MomentumChart({
  data,
  homeName,
  awayName,
}: {
  data?: { minute: number; value: number }[];
  homeName: string;
  awayName: string;
}) {
  const series = data ?? [];
  if (series.length < 3) return null;

  const end = Math.round(Math.max(90, series[series.length - 1]?.minute ?? 90));
  const W = 300;
  const H = 80;
  const mid = H / 2;
  const x = (m: number) => (m / end) * W;
  const y = (v: number) => mid - (Math.max(-100, Math.min(100, v)) / 100) * (mid - 2);
  const line = series.map((p, i) => `${i ? "L" : "M"}${x(p.minute).toFixed(2)},${y(p.value).toFixed(2)}`).join("");
  const area = `${line}L${x(series[series.length - 1].minute).toFixed(2)},${mid}L${x(series[0].minute).toFixed(2)},${mid}Z`;
  const homeShare = Math.round(
    (series.filter((p) => p.value > 0).length / Math.max(1, series.filter((p) => p.value !== 0).length)) * 100,
  );

  return (
    <Panel label="Momentum" aside="who was on top, minute by minute">
      <div className="tl-frame relative mt-1 overflow-hidden bg-card-2/60">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-32 w-full" role="img" aria-label="Momentum chart">
          <defs>
            <clipPath id="mom-top"><rect x="0" y="0" width={W} height={mid} /></clipPath>
            <clipPath id="mom-bottom"><rect x="0" y={mid} width={W} height={mid} /></clipPath>
          </defs>
          <line x1={x(45)} x2={x(45)} y1="0" y2={H} stroke="currentColor" className="text-line" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d={area} clipPath="url(#mom-top)" fill="var(--color-accent)" fillOpacity="0.55" />
          <path d={area} clipPath="url(#mom-bottom)" fill="var(--color-violet)" fillOpacity="0.55" />
          <line x1="0" x2={W} y1={mid} y2={mid} stroke="currentColor" className="text-dim" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="tl-k tl-k-dim pointer-events-none absolute inset-x-2 bottom-1 flex justify-between">
          <span>0&apos;</span>
          <span>HT</span>
          <span>{end}&apos;</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="tl-k flex items-center gap-1.5 text-muted">
          <span className="h-2 w-3 bg-accent" aria-hidden="true" /> {homeName} <b className="tl-num text-ink">{homeShare}%</b>
        </span>
        <span className="tl-k flex items-center gap-1.5 text-muted">
          <span className="h-2 w-3 bg-violet" aria-hidden="true" /> {awayName} <b className="tl-num text-ink">{100 - homeShare}%</b>
        </span>
      </div>
    </Panel>
  );
}

export function MatchShotMap({
  shots,
  homeId,
  homeName,
  awayName,
}: {
  shots?: MatchEventShot[];
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
}) {
  if (!shots?.length) return null;

  const goals = shots.filter((shot) => shot.eventType === "Goal").length;
  const xg = shots.reduce((sum, shot) => sum + (shot.expectedGoals ?? 0), 0);

  return (
    <Panel
      label="Shot map"
      aside={`${shots.length} shots · ${goals} goals · ${xg.toFixed(2)} xg`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="tl-k flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 bg-accent" aria-hidden="true" /> {homeName}
        </span>
        <span className="tl-k flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 bg-violet" aria-hidden="true" /> {awayName}
        </span>
      </div>
      <div className="tl-frame overflow-hidden">
        <svg viewBox="0 0 105 68" className="block w-full" role="img" aria-label="Match shot map">
          <rect width="105" height="68" fill="var(--tl-pitch-field)" />
          <g stroke="var(--tl-hair-strong)" strokeWidth="0.35" fill="none">
            <rect x="0.5" y="0.5" width="104" height="67" />
            <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" />
            <circle cx="52.5" cy="34" r="9.15" />
            <rect x="0.5" y="13.84" width="16" height="40.32" />
            <rect x="0.5" y="24.84" width="7" height="18.32" />
            <rect x="88.5" y="13.84" width="16" height="40.32" />
            <rect x="97.5" y="24.84" width="7" height="18.32" />
          </g>
          {shots.map((shot) => {
            const isHome = shot.teamId === homeId;
            const cx = isHome ? shot.x : 105 - shot.x;
            const isGoal = shot.eventType === "Goal";
            const size = isGoal ? 4.6 : 3;
            return (
              <rect
                key={shot.id}
                x={Math.min(104, Math.max(1, cx)) - size / 2}
                y={Math.min(67, Math.max(1, shot.y)) - size / 2}
                width={size}
                height={size}
                fill={isHome ? "var(--tl-led)" : "var(--tl-alert)"}
                fillOpacity={isGoal ? 1 : shot.isOnTarget ? 0.85 : 0.35}
                stroke={isGoal ? "var(--tl-pitch-field)" : "none"}
                strokeWidth="0.4"
              >
                <title>
                  {`${shot.playerName ?? ""} ${shot.min ? `${shot.min}'` : ""} · ${
                    shot.eventType ?? ""
                  }`}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}

export function MatchStatsPanel({
  stats,
  homeName,
  awayName,
}: {
  stats?: MatchStats;
  homeName: string;
  awayName: string;
}) {
  const groups = stats?.Periods?.All?.stats ?? [];
  const visible = groups.filter((group) =>
    group.stats?.some((row) => row.type !== "title" && row.stats?.some((value) => value !== null)),
  );
  if (!visible.length) {
    return (
      <EmptyState
        title="Match stats"
        description="Match stats are not available yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((group) => (
        <Panel key={group.key ?? group.title} label={group.title} aside={`${homeName} v ${awayName}`}>
          <div className="divide-y divide-line/30">
            {(group.stats ?? [])
              .filter((row) => row.type !== "title")
              .map((row) => (
                <StatRow key={row.key} row={row} />
              ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function StatRow({ row }: { row: MatchStatValue }) {
  const home = row.stats?.[0] ?? "—";
  const away = row.stats?.[1] ?? "—";
  const homeNumber = parseStatNumber(home);
  const awayNumber = parseStatNumber(away);
  const lead = row.highlighted ?? (homeNumber > awayNumber ? "home" : awayNumber > homeNumber ? "away" : "equal");
  const label =
    lead === "home" ? `◀ ${row.title}` : lead === "away" ? `${row.title} ▶` : row.title;

  return (
    <BlockMeterRow
      label={label}
      home={homeNumber}
      away={awayNumber}
      homeText={String(home)}
      awayText={String(away)}
    />
  );
}

export function Lineups({
  lineup,
  colors,
  homeTeam,
  awayTeam,
  events = [],
  players = [],
}: {
  lineup?: MatchLineup;
  colors?: MatchTeamColors;
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
  events?: TimelineEvent[];
  players?: MatchPlayerRow[];
}) {
  const home = lineup?.homeTeam;
  const away = lineup?.awayTeam;
  if (!home?.starters?.length || !away?.starters?.length) {
    return (
      <EmptyState
        title="Lineups"
        description="Lineups are not available yet."
      />
    );
  }

  const tally = goalTally(events);
  const homeColor = colors?.lightMode?.home ?? "var(--tl-led)";
  const awayColor = colors?.lightMode?.away ?? "var(--tl-alert)";
  const homeFont = colors?.fontLightMode?.home ?? "var(--color-on-accent)";
  const awayFont = colors?.fontLightMode?.away ?? "var(--color-on-accent)";

  const toPitchPlayers = (team: LineupTeam, side: "home" | "away"): PitchPlayer[] =>
    (team.starters ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      side,
      shirt: p.shirtNumber,
      posId: p.positionId,
      rating: p.performance?.rating ?? null,
      x: p.horizontalLayout?.x ?? 0.5,
      y: p.horizontalLayout?.y ?? 0.5,
      subbed: Boolean(p.performance?.substitutionEvents?.length),
      age: p.age ?? null,
      country: p.countryName,
      position: positionLabel(p.usualPlayingPositionId, p.positionId),
    }));

  return (
    <div className="mx-auto max-w-[980px] space-y-4">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-line/50 border-b border-line/60">
          {[
            { team: home, name: homeTeam.name, color: homeColor },
            { team: away, name: awayTeam.name, color: awayColor },
          ].map((side) => (
            <div key={side.name} className="flex min-w-0 items-center gap-2 px-2.5 py-2.5">
              <Crest id={side.team.id} name={side.name} size={24} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-ink">{side.name}</p>
                <p className="tl-k tl-k-dim truncate">
                  {side.team.formation} · avg {side.team.averageStarterAge?.toFixed(1) ?? "—"} yrs
                </p>
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <span className="tl-k tl-k-dim hidden sm:inline">Team</span>
                {side.team.rating ? (
                  <RatingChip rating={side.team.rating} size="lg" />
                ) : (
                  <span className="h-2.5 w-2.5" style={{ backgroundColor: side.color }} aria-hidden="true" />
                )}
              </span>
            </div>
          ))}
        </div>
        <LineupPitch
          players={[...toPitchPlayers(home, "home"), ...toPitchPlayers(away, "away")]}
          tally={tally}
          stats={players}
          homeColor={homeColor}
          awayColor={awayColor}
          homeFont={homeFont}
          awayFont={awayFont}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Bench team={home} name={homeTeam.name} tally={tally} />
        <Bench team={away} name={awayTeam.name} tally={tally} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Absentees team={home} name={homeTeam.name} />
        <Absentees team={away} name={awayTeam.name} />
      </div>
    </div>
  );
}

function Bench({
  team,
  name,
  tally,
}: {
  team?: LineupTeam;
  name: string;
  tally?: Map<number, { goals: number; assists: number }>;
}) {
  if (!team?.subs?.length) return null;
  return (
    <Panel label={`${name} · substitutes`}>
      <div className="divide-y divide-line/30">
        {team.subs.map((player) => (
          <Link
            key={player.id}
            href={`/player/${player.id}`}
            className="flex items-center gap-2.5 px-1 py-2 transition-colors hover:bg-hover"
          >
            <span className="tl-frame relative h-7 w-7 shrink-0 overflow-hidden bg-card-2">
              <PlayerPhoto
                playerId={player.id}
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-cover object-top"
              />
            </span>
            <span className="tl-num w-5 shrink-0 text-center text-[11px] text-dim">{player.shirtNumber ?? ""}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">
              {player.name}
            </span>
            {tally?.get(player.id) ? <TallyGlyph id={player.id} tally={tally} inline /> : null}
            {player.performance?.substitutionEvents?.[0] && (
              <span className="tl-k flex items-center gap-1 text-mint">
                <SubIcon size={11} />
                <span className="tl-num text-[11.5px]">{player.performance.substitutionEvents[0].time}&apos;</span>
              </span>
            )}
            <RatingChip rating={player.performance?.rating} />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function Absentees({ team, name }: { team?: LineupTeam; name: string }) {
  if (!team?.coach?.name && !team?.unavailable?.length) return null;
  return (
    <Panel label={name} aside={team.coach?.name ? `coach ${team.coach.name}` : undefined}>
      {team.unavailable?.length ? (
        <div className="divide-y divide-line/30">
          {team.unavailable.map((player) => (
            <div key={player.id ?? player.name} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
              <span className="truncate font-semibold text-muted">{player.name}</span>
              <span className="tl-k tl-k-dim shrink-0">{unavailableReason(player)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function unavailableReason(player: { reason?: unknown; unavailability?: { type?: string; expectedReturn?: string } }) {
  const u = player.unavailability;
  if (u?.type) return `${u.type[0].toUpperCase()}${u.type.slice(1)}${u.expectedReturn ? ` · back ${u.expectedReturn}` : ""}`;
  return typeof player.reason === "string" ? player.reason : "Out";
}

export function H2HList({
  h2h,
  homeTeam,
  awayTeam,
}: {
  h2h?: { summary?: number[]; matches?: H2HMatch[] };
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
}) {
  const matches = h2h?.matches ?? [];
  if (!matches.length) {
    return (
      <EmptyState
        title="Head to head"
        description="No previous meetings found."
      />
    );
  }
  const summary = h2h?.summary ?? [0, 0, 0];

  return (
    <div className="space-y-3">
      <div className="card grid grid-cols-3 divide-x divide-line/50 text-center">
        {[
          { label: "Wins", value: summary[0] ?? 0, team: homeTeam.name },
          { label: "Draws", value: summary[1] ?? 0, team: "Shared" },
          { label: "Wins", value: summary[2] ?? 0, team: awayTeam.name },
        ].map((item) => (
          <div key={`${item.label}-${item.team}`} className="px-2 py-3">
            <p className="tl-num text-[26px] text-ink">{item.value}</p>
            <p className="tl-k mt-1 truncate text-muted">{item.team}</p>
            <p className="tl-k tl-k-dim">{item.label}</p>
          </div>
        ))}
      </div>
      <Panel label="Previous meetings" aside={`${matches.length} fixtures`}>
        <div className="divide-y divide-line/40">
          {matches.map((match, index) => (
            <Link
              key={`${match.matchUrl ?? index}`}
              href={`/match/${match.matchUrl?.split("#").pop() ?? ""}`}
              className="group flex items-center gap-2 px-1 py-2.5 transition-colors hover:bg-hover"
            >
              <span className="w-14 shrink-0 text-[11px] text-dim num">
                {match.time?.utcTime ? <LocalTime value={match.time.utcTime} kind="short" /> : "—"}
              </span>
              <div className="flex flex-1 items-center justify-end gap-1.5">
                <span className="truncate text-[12px] font-semibold text-muted group-hover:text-ink">
                  {match.home.name}
                </span>
                <Crest id={match.home.id} name={match.home.name} size={16} />
              </div>
              <span className="w-12 shrink-0 border border-line bg-card-2/60 px-1 py-0.5 text-center text-[11px] font-semibold text-ink num">
                {match.status?.scoreStr ?? "vs"}
              </span>
              <div className="flex flex-1 items-center gap-1.5">
                <Crest id={match.away.id} name={match.away.name} size={16} />
                <span className="truncate text-[12px] font-semibold text-muted group-hover:text-ink">
                  {match.away.name}
                </span>
              </div>
              <span className="tl-k tl-k-dim hidden w-24 shrink-0 truncate text-right sm:block">
                {match.league?.name}
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function FormStrip({ form }: { form?: TeamFormEntry[] }) {
  if (!form?.length) return null;
  return (
    <div className="flex gap-1">
      {form.slice(0, 5).map((item, index) => (
        <Link
          key={`${item.date?.utcTime ?? index}`}
          href={item.linkToMatch ? `/match/${item.linkToMatch.split("#").pop()}` : "#"}
          title={`${item.home?.name ?? ""} ${item.score ?? ""} ${item.away?.name ?? ""}`}
          className="press"
        >
          <FormPill result={item.result} size={19} />
        </Link>
      ))}
    </div>
  );
}

export function PlayerOfTheMatch({
  player,
}: {
  player?: NonNullable<MatchFacts["playerOfTheMatch"]>;
}) {
  if (!player?.id) return null;
  const name =
    player.name?.fullName ??
    `${player.name?.firstName ?? ""} ${player.name?.lastName ?? ""}`.trim();

  return (
    <Link href={`/player/${player.id}`} className="card flex items-center gap-3 p-3 transition-colors hover:bg-hover">
      <span className="tl-frame relative h-12 w-12 shrink-0 overflow-hidden bg-card-2">
        <Image
          src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`}
          alt={name}
          width={48}
          height={48}
          className="h-full w-full object-cover object-top"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="tl-k tl-k-dim">Player of the match</p>
        <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
        <p className="tl-k tl-k-dim truncate">
          {player.teamName}
          {player.minutesPlayed ? ` · ${player.minutesPlayed} mins` : ""}
        </p>
      </div>
      <RatingChip rating={player.rating?.num} />
    </Link>
  );
}

export function MatchInfoCard({
  facts,
  homeTeam,
  awayTeam,
}: {
  facts?: MatchFacts;
  homeTeam: { name: string };
  awayTeam: { name: string };
}) {
  const info = facts?.infoBox;
  if (!info) return null;
  const date = info["Match Date"]?.utcTime;
  const stadium = info.Stadium;
  const referee = info.Referee;
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (date) {
    rows.push({
      label: "Date",
      value: <LocalTime value={date} kind="dayTime" />,
    });
  }
  if (stadium?.name) {
    rows.push({
      label: "Stadium",
      value: [stadium.name, stadium.city].filter(Boolean).join(", "),
    });
  }
  if (info.Attendance) {
    rows.push({ label: "Attendance", value: info.Attendance.toLocaleString("en-GB") });
  }
  if (referee?.text) rows.push({ label: "Referee", value: referee.text });
  if (info.Tournament?.leagueName) {
    rows.push({
      label: "Competition",
      value: `${info.Tournament.leagueName}${
        info.Tournament.roundName ? ` · Round ${info.Tournament.roundName}` : ""
      }`,
    });
  }

  return (
    <Panel label="Match info" aside={`${homeTeam.name} v ${awayTeam.name}`}>
      {rows.map((row) => (
        <DataRow key={row.label} label={row.label} value={row.value} />
      ))}
    </Panel>
  );
}

function parseStatNumber(value: number | string | null): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

type Insight = { type?: string; teamId?: number; playerId?: number | null; text?: string };

export function InsightsCard({
  insights,
  home,
  away,
}: {
  insights?: unknown;
  home: { id: number | string; name: string };
  away: { id: number | string; name: string };
}) {
  const list = (Array.isArray(insights) ? (insights as Insight[]) : []).filter((i) => i.text);
  if (!list.length) return null;
  return (
    <Panel label="Talking points" aside={`${Math.min(list.length, 6)} of ${list.length}`}>
      <ul className="stagger space-y-2">
        {list.slice(0, 6).map((item, index) => {
          const team = String(item.teamId) === String(home.id) ? home : away;
          return (
            <li key={index} className="flex items-start gap-2.5 border border-line bg-card-2/60 p-2.5">
              {item.playerId ? (
                <Link
                  href={`/player/${item.playerId}`}
                  className="tl-frame h-8 w-8 shrink-0 overflow-hidden bg-card-2"
                >
                  <PlayerPhoto playerId={item.playerId} alt="" width={32} height={32} className="h-full w-full object-cover object-top" />
                </Link>
              ) : (
                <Crest id={team.id} name={team.name} size={32} />
              )}
              <p className="text-[12px] leading-snug text-muted">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

type Zones = { left?: number; center?: number; right?: number };

export function AttackingZones({
  zones,
  homeName,
  awayName,
}: {
  zones?: { home?: Record<string, Zones>; away?: Record<string, Zones> };
  homeName: string;
  awayName: string;
}) {
  const home = zones?.home?.total;
  const away = zones?.away?.total;
  if (!home || !away) return null;
  return (
    <Panel label="Attack sides" aside="share of attacks by channel">
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: homeName, z: home, tone: "bg-accent" },
          { name: awayName, z: away, tone: "bg-violet" },
        ].map(({ name, z, tone }) => {
          const max = Math.max(z.left ?? 0, z.center ?? 0, z.right ?? 0);
          return (
            <div key={name}>
              <p className="tl-k mb-1.5 truncate text-muted">{name}</p>
              <div className="tl-frame pitch-surface relative grid h-36 grid-rows-3 gap-1 overflow-hidden p-1.5">
                {(["left", "center", "right"] as const).map((key) => {
                  const value = z[key] ?? 0;
                  const lead = value === max;
                  return (
                    <div key={key} className="tl-frame relative flex items-center justify-center overflow-hidden bg-card-2/60">
                      <span
                        className={`bar-grow absolute inset-y-0 left-0 ${tone}`}
                        style={{ width: `${value}%`, opacity: lead ? 0.9 : 0.35 }}
                      />
                      <span className={`tl-num relative px-1 text-[15px] ${lead ? "text-ink" : "text-dim"}`}>
                        {value}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="tl-k tl-k-dim mt-1 flex justify-between">
                <span>Left ↑</span>
                <span>Right ↓</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

type TopPlayer = {
  playerId: number;
  name: { fullName?: string; firstName?: string; lastName?: string };
  playerRating?: number;
  playerRatingRounded?: string;
  positionLabel?: { label: string };
  manOfTheMatch?: boolean;
};

export function TopRatedCard({
  home,
  away,
  topPlayers,
}: {
  home: { id: number | string; name: string };
  away: { id: number | string; name: string };
  topPlayers?: { homeTopPlayers?: TopPlayer[]; awayTopPlayers?: TopPlayer[] };
}) {
  const groups = [
    { team: home, players: topPlayers?.homeTopPlayers ?? [] },
    { team: away, players: topPlayers?.awayTopPlayers ?? [] },
  ];
  if (!groups.some((g) => g.players.length)) return null;
  return (
    <Panel label="Top rated" aside="highest first">
      <div className="space-y-3">
        {groups.map(({ team, players }) => (
          <div key={team.name}>
            <p className="tl-k tl-k-dim mb-1 flex items-center gap-1.5">
              <Crest id={team.id} name={team.name} size={14} />
              {team.name}
            </p>
            <div className="divide-y divide-line/30">
              {players.slice(0, 3).map((player) => (
                <Link
                  key={player.playerId}
                  href={`/player/${player.playerId}`}
                  className="press flex items-center gap-2.5 py-1.5 transition-colors hover:bg-hover"
                >
                  <span className="tl-frame h-8 w-8 shrink-0 overflow-hidden bg-card-2">
                    <PlayerPhoto playerId={player.playerId} alt="" width={32} height={32} className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-ink">
                      {player.name.fullName ?? `${player.name.firstName ?? ""} ${player.name.lastName ?? ""}`}
                    </span>
                    <span className="tl-k tl-k-dim block">{player.positionLabel?.label ?? ""}</span>
                  </span>
                  <RatingChip rating={player.playerRating ?? player.playerRatingRounded} star={player.manOfTheMatch} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
