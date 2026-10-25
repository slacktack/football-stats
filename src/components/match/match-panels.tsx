import Image from "next/image";
import Link from "next/link";
import { playerImage } from "@/lib/assets";
import { formatKickoff, formatShortDate } from "@/lib/format";
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
import { ArrowRightIcon, CardIcon, GoalIcon, SubIcon } from "../icons";
import { Crest, FormPill, RatingChip } from "../ui";

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
      <div className="card flex flex-col items-center gap-2 px-4 py-10 text-center">
        {live ? (
          <>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-live">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
              Live {minute ?? ""}
            </span>
            <p className="text-sm font-semibold text-ink">Waiting for the first big moment</p>
            <p className="max-w-xs text-xs text-dim">
              No goals, cards or substitutions yet. This page refreshes automatically.
            </p>
          </>
        ) : (
          <p className="text-sm text-dim">No match events recorded.</p>
        )}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
        <h2 className="font-display text-sm font-bold text-ink">Match timeline</h2>
        <span className="text-[10px] text-dim">Goals, cards & changes</span>
      </div>
      <ol className="relative divide-y divide-line/30">
        {visible.map((event, index) => {
          if (event.type === "Half") {
            return (
              <li
                key={`${event.reactKey ?? index}`}
                className="flex items-center justify-center gap-2 bg-white/[0.018] px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-dim"
              >
                {event.halfStrShort ?? (event.time >= 90 ? "FT" : "HT")}
              </li>
            );
          }
          if (event.type === "AddedTime") {
            return (
              <li
                key={`${event.reactKey ?? index}`}
                className="flex items-center justify-center gap-1.5 px-4 py-1 text-[9px] font-semibold text-dim"
              >
                + {event.minutesAddedInput ?? 1} min
              </li>
            );
          }
          return (
            <li key={`${event.reactKey ?? index}`} className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
              <span className="mt-0.5 w-7 shrink-0 text-center font-display text-xs font-extrabold text-muted num">
                {event.timeStr ?? event.time}&apos;
              </span>
              <EventIcon type={event.type} card={event.card} />
              <div className="min-w-0 flex-1">
                <EventText
                  event={event}
                  isHome={event.isHome ?? false}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </div>
              {event.newScore && (
                <span className="shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink num">
                  {event.newScore[0]}–{event.newScore[1]}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EventIcon({ type, card }: { type: string; card?: string }) {
  if (type === "Goal") {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <GoalIcon size={14} />
      </span>
    );
  }
  if (type === "Card") {
    return (
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          card === "Red" ? "bg-red-500/15 text-red-400" : "bg-yellow-400/15 text-yellow-300"
        }`}
      >
        <CardIcon size={13} />
      </span>
    );
  }
  if (type === "Substitution") {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/12 text-sky-400">
        <SubIcon size={14} />
      </span>
    );
  }
  return <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-white/[0.05]" />;
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
      <div>
        <p className="text-[11px] font-semibold text-ink">
          {event.player?.name ?? event.nameStr}
          {event.ownGoal ? " (OG)" : ""}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-dim">
          <Crest id={team.id} name={team.name} size={12} />
          {team.name}
          {event.assistStr ? ` · ${event.assistStr}` : ""}
        </p>
      </div>
    );
  }
  if (event.type === "Substitution") {
    const [on, off] = event.swap ?? [];
    return (
      <div className="space-y-0.5">
        <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
          <ArrowRightIcon size={10} className="-rotate-90" />
          {on?.name ?? "Player in"}
        </p>
        <p className="flex items-center gap-1 text-[9px] text-dim">
          <ArrowRightIcon size={10} className="rotate-90 text-red-400" />
          {off?.name ?? "Player out"}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink">
        {event.player?.name ?? event.nameStr ?? event.type}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-[9px] text-dim">
        <Crest id={team.id} name={team.name} size={12} />
        {team.name}
        {event.card ? ` · ${event.card} card` : ""}
      </p>
    </div>
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

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Momentum</p>
          <p className="mt-0.5 text-[10px] text-dim">Pressure by minute</p>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-dim">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-full bg-accent" /> {homeName}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-full bg-rose-400" /> {awayName}
          </span>
        </div>
      </div>
      <div className="relative mt-3 h-28 overflow-hidden rounded-lg border border-line/50 bg-white/[0.015]">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
        {series.map((point) => {
          const positive = point.value >= 0;
          const height = (Math.min(100, Math.abs(point.value)) / 100) * 46;
          return (
            <span
              key={point.minute}
              className={`absolute bottom-1/2 w-[2px] rounded-full ${
                positive ? "bg-accent/80" : "bg-rose-400/70"
              }`}
              style={{
                left: `${(point.minute / 90) * 100}%`,
                height: `${Math.max(2, height)}%`,
                transform: positive ? "translateY(0)" : "translateY(-100%)",
              }}
              title={`${point.minute}' · ${point.value}`}
            />
          );
        })}
        <div className="absolute inset-x-2 bottom-1 flex justify-between text-[8px] text-dim">
          <span>0&apos;</span>
          <span>45&apos;</span>
          <span>90&apos;</span>
        </div>
      </div>
    </div>
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
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Shot map</p>
          <p className="mt-0.5 text-[10px] text-dim">
            {shots.length} shots · {goals} goals · {xg.toFixed(2)} xG
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-dim">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> {homeName}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> {awayName}
          </span>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line/60 bg-[#07130c]">
        <svg viewBox="0 0 105 68" className="block w-full" role="img" aria-label="Match shot map">
          <rect width="105" height="68" fill="#07130c" />
          <g stroke="rgba(255,255,255,0.13)" strokeWidth="0.35" fill="none">
            <rect x="0.5" y="0.5" width="104" height="67" rx="1" />
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
            return (
              <circle
                key={shot.id}
                cx={Math.min(104, Math.max(1, cx))}
                cy={Math.min(67, Math.max(1, shot.y))}
                r={isGoal ? 2.3 : 1.5}
                fill={isHome ? "#ff4a38" : "#fb7185"}
                fillOpacity={isGoal ? 1 : shot.isOnTarget ? 0.85 : 0.35}
                stroke={isGoal ? "#07130c" : "none"}
                strokeWidth="0.4"
              >
                <title>
                  {`${shot.playerName ?? ""} ${shot.min ? `${shot.min}'` : ""} · ${
                    shot.eventType ?? ""
                  }`}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
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
      <div className="card px-4 py-8 text-center text-sm text-dim">
        Match stats are not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((group) => (
        <div key={group.key ?? group.title} className="card overflow-hidden">
          <div className="border-b border-line/50 px-4 py-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              {group.title}
            </h3>
          </div>
          <div className="divide-y divide-line/30 px-4">
            {(group.stats ?? [])
              .filter((row) => row.type !== "title")
              .map((row) => (
                <StatRow key={row.key} row={row} homeName={homeName} awayName={awayName} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRow({
  row,
  homeName,
  awayName,
}: {
  row: MatchStatValue;
  homeName: string;
  awayName: string;
}) {
  const home = row.stats?.[0] ?? "—";
  const away = row.stats?.[1] ?? "—";
  const homeNumber = parseStatNumber(home);
  const awayNumber = parseStatNumber(away);
  const total = homeNumber + awayNumber;
  const homeWidth = total > 0 ? (homeNumber / total) * 100 : 50;

  return (
    <div className="py-2.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2">
        <span className="text-xs font-bold text-ink num" title={homeName}>
          {home}
        </span>
        <span className="text-center text-[10px] font-medium text-dim">{row.title}</span>
        <span className="text-right text-xs font-bold text-ink num" title={awayName}>
          {away}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <span className="h-full bg-accent/85" style={{ width: `${homeWidth}%` }} />
        <span className="h-full flex-1 bg-rose-400/70" />
      </div>
    </div>
  );
}

export function Lineups({
  lineup,
  colors,
  homeTeam,
  awayTeam,
}: {
  lineup?: MatchLineup;
  colors?: MatchTeamColors;
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
}) {
  const home = lineup?.homeTeam;
  const away = lineup?.awayTeam;
  if (!home?.starters?.length || !away?.starters?.length) {
    return (
      <div className="card px-4 py-8 text-center text-sm text-dim">
        Lineups are not available yet.
      </div>
    );
  }

  const homeColor = colors?.lightMode?.home ?? "#ff4a38";
  const awayColor = colors?.lightMode?.away ?? "#fb7185";
  const homeFont = colors?.fontLightMode?.home ?? "#07130c";
  const awayFont = colors?.fontLightMode?.away ?? "#07130c";

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-line/50 border-b border-line/60">
          {[
            { team: home, name: homeTeam.name, color: homeColor },
            { team: away, name: awayTeam.name, color: awayColor },
          ].map((side) => (
            <div key={side.name} className="flex items-center gap-2.5 px-3 py-3">
              <Crest id={side.team.id} name={side.name} size={26} />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{side.name}</p>
                <p className="text-[9px] text-dim">
                  {side.team.formation} · avg {side.team.averageStarterAge?.toFixed(1) ?? "—"} yrs
                </p>
              </div>
              <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: side.color }} />
            </div>
          ))}
        </div>
        <div className="pitch-surface relative aspect-[68/105] w-full overflow-hidden sm:aspect-[105/68]">
          <div className="absolute inset-0 hidden opacity-70 sm:block">
            <svg viewBox="0 0 105 68" className="h-full w-full" aria-hidden="true">
              <g stroke="rgba(255,255,255,0.17)" strokeWidth="0.35" fill="none">
                <rect x="1" y="1" width="103" height="66" rx="1" />
                <line x1="52.5" y1="1" x2="52.5" y2="67" />
                <circle cx="52.5" cy="34" r="9.15" />
                <rect x="1" y="13.84" width="16" height="40.32" />
                <rect x="1" y="24.84" width="7" height="18.32" />
                <rect x="88" y="13.84" width="16" height="40.32" />
                <rect x="97" y="24.84" width="7" height="18.32" />
              </g>
            </svg>
          </div>
          <div className="absolute inset-0 opacity-70 sm:hidden">
            <svg viewBox="0 0 68 105" className="h-full w-full" aria-hidden="true">
              <g stroke="rgba(255,255,255,0.17)" strokeWidth="0.35" fill="none">
                <rect x="1" y="1" width="66" height="103" rx="1" />
                <line x1="1" y1="52.5" x2="67" y2="52.5" />
                <circle cx="34" cy="52.5" r="9.15" />
                <rect x="13.84" y="1" width="40.32" height="16" />
                <rect x="24.84" y="1" width="18.32" height="7" />
                <rect x="13.84" y="88" width="40.32" height="16" />
                <rect x="24.84" y="97" width="18.32" height="7" />
              </g>
            </svg>
          </div>
          {[
            { team: home, side: "home" as const, color: homeColor, font: homeFont },
            { team: away, side: "away" as const, color: awayColor, font: awayFont },
          ].flatMap(({ team, side, color, font }) =>
            (team.starters ?? []).map((player, index) => {
              const layout = player.horizontalLayout;
              const x = layout ? (side === "home" ? layout.x : 1 - layout.x) : 0.5;
              const y = layout?.y ?? 0.5;
              return (
                <Link
                  key={`${side}-${player.id}`}
                  href={`/player/${player.id}`}
                  className={`lineup-marker group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${index % 2 === 1 ? "lineup-marker-alt" : ""}`}
                  style={
                    {
                      "--lx": `${x * 100}%`,
                      "--ly": `${y * 100}%`,
                    } as React.CSSProperties
                  }
                  title={`${player.name}${player.performance?.rating ? ` · ${player.performance.rating}` : ""}`}
                >
                  <span className="relative inline-flex">
                    <span
                      className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-card-2 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.95)] transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10"
                      style={{ boxShadow: `0 0 0 2px ${color}, 0 8px 18px -8px rgba(0,0,0,0.95)` }}
                    >
                      <Image
                        src={playerImage(player.id)}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover object-top"
                      />
                    </span>
                    <span
                      className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black shadow-sm sm:h-4 sm:w-4 sm:text-[8px]"
                      style={{ backgroundColor: color, color: font }}
                    >
                      {player.shirtNumber ?? player.positionId}
                    </span>
                  </span>
                  <span className="max-w-[64px] truncate rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm sm:max-w-[84px]">
                    {player.name.split(" ").slice(-1)[0]}
                  </span>
                  {player.performance?.rating ? (
                    <span className="lineup-rating hidden rounded bg-black/70 px-1 text-[7px] font-bold text-accent sm:block">
                      {player.performance.rating.toFixed(1)}
                    </span>
                  ) : null}
                </Link>
              );
            }),
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Bench team={home} name={homeTeam.name} />
        <Bench team={away} name={awayTeam.name} />
      </div>
    </div>
  );
}

function Bench({ team, name }: { team?: LineupTeam; name: string }) {
  if (!team?.subs?.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line/50 px-3.5 py-2.5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          {name} · substitutes
        </h3>
      </div>
      <div className="divide-y divide-line/30">
        {team.subs.map((player) => (
          <Link
            key={player.id}
            href={`/player/${player.id}`}
            className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/[0.025]"
          >
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10">
              <Image
                src={playerImage(player.id)}
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-cover object-top"
              />
              <span className="absolute bottom-0 right-0 flex h-3 min-w-3 items-center justify-center rounded-tl bg-black/75 px-0.5 text-[7px] font-bold text-white">
                {player.shirtNumber ?? "—"}
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted">
              {player.name}
            </span>
            <span className="text-[9px] text-dim">{player.positionId ?? ""}</span>
            <RatingChip rating={player.performance?.rating} />
          </Link>
        ))}
      </div>
    </div>
  );
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
      <div className="card px-4 py-8 text-center text-sm text-dim">
        No previous meetings found.
      </div>
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
            <p className="font-display text-2xl font-extrabold text-ink num">{item.value}</p>
            <p className="truncate text-[9px] uppercase tracking-wider text-dim">{item.team}</p>
            <p className="text-[9px] text-dim">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="divide-y divide-line/40">
          {matches.map((match, index) => (
            <Link
              key={`${match.matchUrl ?? index}`}
              href={`/match/${match.matchUrl?.split("#").pop() ?? ""}`}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.025]"
            >
              <span className="w-14 shrink-0 text-[9px] text-dim">
                {match.time?.utcTime ? formatShortDate(match.time.utcTime) : "—"}
              </span>
              <div className="flex flex-1 items-center justify-end gap-1.5">
                <span className="truncate text-[11px] font-semibold text-muted group-hover:text-ink">
                  {match.home.name}
                </span>
                <Crest id={match.home.id} name={match.home.name} size={16} />
              </div>
              <span className="w-12 shrink-0 rounded bg-white/[0.05] px-1 py-0.5 text-center text-[10px] font-bold text-ink num">
                {match.status?.scoreStr ?? "vs"}
              </span>
              <div className="flex flex-1 items-center gap-1.5">
                <Crest id={match.away.id} name={match.away.name} size={16} />
                <span className="truncate text-[11px] font-semibold text-muted group-hover:text-ink">
                  {match.away.name}
                </span>
              </div>
              <span className="hidden w-24 shrink-0 truncate text-right text-[9px] text-dim sm:block">
                {match.league?.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormStrip({ form }: { form?: TeamFormEntry[] }) {
  if (!form?.length) return null;
  return (
    <div className="flex gap-1.5">
      {form.slice(0, 5).map((item, index) => (
        <Link
          key={`${item.date?.utcTime ?? index}`}
          href={item.linkToMatch ? `/match/${item.linkToMatch.split("#").pop()}` : "#"}
          title={`${item.home?.name ?? ""} ${item.score ?? ""} ${item.away?.name ?? ""}`}
          className="transition-transform hover:scale-110"
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
    <Link href={`/player/${player.id}`} className="card card-hover flex items-center gap-3 p-3.5">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10">
        <Image
          src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`}
          alt={name}
          width={56}
          height={56}
          className="h-full w-full object-cover object-top"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Player of the match</p>
        <p className="truncate text-sm font-bold text-ink">{name}</p>
        <p className="truncate text-[10px] text-dim">
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
      value: `${formatShortDate(date)} · ${formatKickoff(date)}`,
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
    <div className="card p-4">
      <p className="eyebrow mb-1">Match info</p>
      <div className="divide-y divide-line/40">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 py-2">
            <span className="text-[10px] text-dim">{row.label}</span>
            <span className="text-right text-[11px] font-semibold text-muted">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-dim">
        {homeTeam.name} vs {awayTeam.name}
      </p>
    </div>
  );
}

function parseStatNumber(value: number | string | null): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
