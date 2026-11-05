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
            <span className="flex items-center gap-2 text-[11px] font-bold text-live">
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
        <span className="text-[11px] text-dim">Goals, cards & changes</span>
      </div>
      <ol className="relative divide-y divide-line/30">
        {visible.map((event, index) => {
          if (event.type === "Half") {
            return (
              <li
                key={`${event.reactKey ?? index}`}
                className="flex items-center justify-center gap-2 bg-white/[0.018] px-4 py-1.5 text-[11px] font-bold text-dim"
              >
                {event.halfStrShort ?? (event.time >= 90 ? "FT" : "HT")}
              </li>
            );
          }
          if (event.type === "AddedTime") {
            return (
              <li
                key={`${event.reactKey ?? index}`}
                className="flex items-center justify-center gap-1.5 px-4 py-1 text-[11px] font-semibold text-dim"
              >
                + {event.minutesAddedInput ?? 1} min
              </li>
            );
          }
          const isHome = event.isHome ?? false;
          const body = (
            <div className={`flex min-w-0 items-start gap-2 ${isHome ? "flex-row-reverse text-right" : ""}`}>
              <EventIcon type={event.type} card={event.card} />
              <div className="min-w-0">
                <EventText event={event} isHome={isHome} homeTeam={homeTeam} awayTeam={awayTeam} />
              </div>
            </div>
          );
          return (
            <li
              key={`${event.reactKey ?? index}`}
              className={`grid grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] items-start gap-2 px-3 py-2.5 sm:px-4 ${
                event.type === "Goal" ? "bg-accent/[0.045]" : ""
              }`}
            >
              <div className="min-w-0">{isHome && body}</div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-display text-[13px] font-extrabold text-muted num">
                  {event.timeStr ?? event.time}&apos;
                </span>
                {event.newScore && (
                  <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-black text-on-accent num">
                    {event.newScore[0]}–{event.newScore[1]}
                  </span>
                )}
              </div>
              <div className="min-w-0">{!isHome && body}</div>
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
        <p className="text-[13px] font-bold text-ink">
          {event.player?.name ?? event.nameStr}
          {event.ownGoal ? " (OG)" : ""}
        </p>
        {event.assistStr && <p className="mt-0.5 text-[11px] text-dim">{event.assistStr}</p>}
      </div>
    );
  }
  if (event.type === "Substitution") {
    const [on, off] = event.swap ?? [];
    return (
      <div className="space-y-0.5">
        <p className="truncate text-xs font-semibold text-ink">
          <span className="text-accent">↑</span> {on?.name ?? "Player in"}
        </p>
        <p className="truncate text-[11px] text-dim">
          <span className="text-orange-300">↓</span> {off?.name ?? "Player out"}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-semibold text-ink">
        {event.player?.name ?? event.nameStr ?? event.type}
      </p>
      <p className="mt-0.5 text-[11px] text-dim">
        {event.card ? `${event.card} card` : team.name}
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
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Momentum</p>
          <p className="mt-0.5 text-xs text-dim">Who was on top, minute by minute</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-accent" /> {homeName} <b className="text-ink num">{homeShare}%</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-violet" /> {awayName} <b className="text-ink num">{100 - homeShare}%</b>
          </span>
        </div>
      </div>
      <div className="relative mt-3 overflow-hidden rounded-xl border border-line/50 bg-white/[0.015]">
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
        <div className="pointer-events-none absolute inset-x-2 bottom-1 flex justify-between text-[11px] font-semibold text-dim">
          <span>0&apos;</span>
          <span>HT</span>
          <span>{end}&apos;</span>
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
          <p className="mt-0.5 text-[11px] text-dim">
            {shots.length} shots · {goals} goals · {xg.toFixed(2)} xG
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-dim">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> {homeName}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-violet" /> {awayName}
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
                fill={isHome ? "#39ff6b" : "#a78bfa"}
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
            <h3 className="text-xs font-bold text-muted">
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

  const lead = row.highlighted ?? (homeNumber > awayNumber ? "home" : awayNumber > homeNumber ? "away" : "equal");
  const valueClass = (side: "home" | "away") =>
    lead === side
      ? side === "home"
        ? "bg-accent text-on-accent"
        : "bg-violet text-[#120a24]"
      : "text-ink";

  return (
    <div className="py-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="justify-self-start" title={homeName}>
          <span className={`rounded-md px-1.5 py-0.5 text-[13px] font-extrabold num ${valueClass("home")}`}>{home}</span>
        </span>
        <span className="text-center text-xs font-semibold text-muted">{row.title}</span>
        <span className="justify-self-end" title={awayName}>
          <span className={`rounded-md px-1.5 py-0.5 text-[13px] font-extrabold num ${valueClass("away")}`}>{away}</span>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-full bg-white/[0.05]">
          <span className="bar-grow-r h-full rounded-full bg-accent" style={{ width: `${homeWidth}%`, opacity: lead === "home" ? 1 : 0.45 }} />
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
          <span className="bar-grow h-full rounded-full bg-violet" style={{ width: `${100 - homeWidth}%`, opacity: lead === "away" ? 1 : 0.45 }} />
        </div>
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

  const homeColor = colors?.lightMode?.home ?? "#39ff6b";
  const awayColor = colors?.lightMode?.away ?? "#a78bfa";
  const homeFont = colors?.fontLightMode?.home ?? "#07130c";
  const awayFont = colors?.fontLightMode?.away ?? "#07130c";

  return (
    <div className="mx-auto max-w-[980px] space-y-5">
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
                <p className="text-[11px] text-dim">
                  {side.team.formation} · avg {side.team.averageStarterAge?.toFixed(1) ?? "—"} yrs
                </p>
              </div>
              <span className="ml-auto flex items-center gap-2">
                <span className="hidden text-[10px] font-bold text-dim sm:inline">Team</span>
                {side.team.rating ? (
                  <RatingChip rating={side.team.rating} size="lg" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: side.color }} />
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="pitch-surface relative aspect-[68/118] w-full overflow-hidden sm:aspect-[105/68]">
          <div className="absolute inset-0 hidden opacity-70 sm:block">
            <svg viewBox="0 0 105 68" className="h-full w-full" aria-hidden="true">
              <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.35" fill="none">
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
            <svg viewBox="0 0 68 118" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.35" fill="none">
                <rect x="1" y="1" width="66" height="116" rx="1" />
                <line x1="1" y1="59" x2="67" y2="59" />
                <circle cx="34" cy="59" r="9.15" />
                <rect x="13.84" y="1" width="40.32" height="16" />
                <rect x="24.84" y="1" width="18.32" height="7" />
                <rect x="13.84" y="101" width="40.32" height="16" />
                <rect x="24.84" y="110" width="18.32" height="7" />
              </g>
            </svg>
          </div>
          {[
            { team: home, side: "home" as const, color: homeColor, font: homeFont },
            { team: away, side: "away" as const, color: awayColor, font: awayFont },
          ].flatMap(({ team, side, color, font }) =>
            (team.starters ?? []).map((player) => {
              const layout = player.horizontalLayout;
              const along = 0.03 + (layout?.x ?? 0.5) * 0.46;
              const across = layout?.y ?? 0.5;
              const home = side === "home";
              const pos = {
                "--dl": `${(home ? along : 1 - along) * 100}%`,
                "--dt": `${(home ? across : 1 - across) * 100}%`,
                "--ml": `${(home ? across : 1 - across) * 100}%`,
                "--mt": `${(home ? 1 - along : along) * 100}%`,
              } as React.CSSProperties;
              return (
                <Link
                  key={`${side}-${player.id}`}
                  href={`/player/${player.id}`}
                  className="lineup-marker group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                  style={pos}
                  title={`${player.name}${player.performance?.rating ? ` · ${player.performance.rating}` : ""}`}
                >
                  <span className="relative inline-flex">
                    <span
                      className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-card-2 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.95)] transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10"
                      style={{ boxShadow: `0 0 0 2px ${color}, 0 8px 18px -8px rgba(0,0,0,0.95)` }}
                    >
                      <PlayerPhoto
                        playerId={player.id}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover object-top"
                      />
                    </span>
                    <span
                      className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black shadow-sm sm:h-[18px] sm:w-[18px] sm:text-[11px]"
                      style={{ backgroundColor: color, color: font }}
                    >
                      {player.shirtNumber ?? player.positionId}
                    </span>
                    {player.performance?.rating ? (
                      <RatingChip
                        rating={player.performance.rating}
                        size="sm"
                        className="absolute -right-4 -top-2 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.7)] sm:-right-5"
                      />
                    ) : null}
                    {player.performance?.substitutionEvents?.length ? (
                      <span className="absolute -left-3 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-sky-300" title="Substituted">
                        <SubIcon size={10} />
                      </span>
                    ) : null}
                  </span>
                  <span className="max-w-[76px] truncate text-[11px] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] sm:max-w-[100px] sm:text-[13px]">
                    {player.name.split(" ").slice(-1)[0]}
                  </span>
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
      <div className="grid gap-3 md:grid-cols-2">
        <Absentees team={home} name={homeTeam.name} />
        <Absentees team={away} name={awayTeam.name} />
      </div>
    </div>
  );
}

function Bench({ team, name }: { team?: LineupTeam; name: string }) {
  if (!team?.subs?.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line/50 px-3.5 py-2.5">
        <h3 className="text-[11px] font-bold text-muted">
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
              <PlayerPhoto
                playerId={player.id}
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-cover object-top"
              />
            </span>
            <span className="w-5 shrink-0 text-center text-[11px] font-bold text-dim num">{player.shirtNumber ?? ""}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
              {player.name}
            </span>
            {player.performance?.substitutionEvents?.[0] && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-300 num">
                <SubIcon size={11} />
                {player.performance.substitutionEvents[0].time}&apos;
              </span>
            )}
            <RatingChip rating={player.performance?.rating} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function Absentees({ team, name }: { team?: LineupTeam; name: string }) {
  if (!team?.coach?.name && !team?.unavailable?.length) return null;
  return (
    <div className="card p-3.5">
      <p className="eyebrow mb-2">{name}</p>
      {team.coach?.name && (
        <p className="mb-2 flex items-center justify-between text-xs">
          <span className="text-dim">Coach</span>
          <span className="font-semibold text-ink">{team.coach.name}</span>
        </p>
      )}
      {team.unavailable?.length ? (
        <div className="divide-y divide-line/30 border-t border-line/40">
          {team.unavailable.map((player) => (
            <div key={player.id ?? player.name} className="flex items-center justify-between gap-3 py-1.5 text-xs">
              <span className="truncate font-semibold text-muted">{player.name}</span>
              <span className="shrink-0 text-[11px] text-dim">{unavailableReason(player)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
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
            <p className="truncate text-[11px] text-dim">{item.team}</p>
            <p className="text-[11px] text-dim">{item.label}</p>
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
              <span className="w-14 shrink-0 text-[11px] text-dim">
                {match.time?.utcTime ? <LocalTime value={match.time.utcTime} kind="short" /> : "—"}
              </span>
              <div className="flex flex-1 items-center justify-end gap-1.5">
                <span className="truncate text-xs font-semibold text-muted group-hover:text-ink">
                  {match.home.name}
                </span>
                <Crest id={match.home.id} name={match.home.name} size={16} />
              </div>
              <span className="w-12 shrink-0 rounded bg-white/[0.05] px-1 py-0.5 text-center text-[11px] font-bold text-ink num">
                {match.status?.scoreStr ?? "vs"}
              </span>
              <div className="flex flex-1 items-center gap-1.5">
                <Crest id={match.away.id} name={match.away.name} size={16} />
                <span className="truncate text-xs font-semibold text-muted group-hover:text-ink">
                  {match.away.name}
                </span>
              </div>
              <span className="hidden w-24 shrink-0 truncate text-right text-[11px] text-dim sm:block">
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
        <p className="truncate text-[11px] text-dim">
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
    <div className="card p-4">
      <p className="eyebrow mb-1">Match info</p>
      <div className="divide-y divide-line/40">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 py-2">
            <span className="text-[11px] text-dim">{row.label}</span>
            <span className="text-right text-xs font-semibold text-muted">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-dim">
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
    <div className="card p-4">
      <p className="eyebrow mb-2">Talking points</p>
      <ul className="stagger space-y-2">
        {list.slice(0, 6).map((item, index) => {
          const team = String(item.teamId) === String(home.id) ? home : away;
          return (
            <li key={index} className="flex items-start gap-2.5 rounded-xl bg-white/[0.025] p-2.5">
              {item.playerId ? (
                <Link href={`/player/${item.playerId}`} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.05]">
                  <PlayerPhoto playerId={item.playerId} alt="" width={32} height={32} className="h-full w-full object-cover object-top" />
                </Link>
              ) : (
                <Crest id={team.id} name={team.name} size={32} />
              )}
              <p className="text-[13px] leading-snug text-muted">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
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
    <div className="card p-4">
      <p className="eyebrow">Attack sides</p>
      <p className="mt-0.5 text-xs text-dim">Where each team sent its attacks</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { name: homeName, z: home, tone: "bg-accent", text: "text-on-accent" },
          { name: awayName, z: away, tone: "bg-violet", text: "text-[#120a24]" },
        ].map(({ name, z, tone, text }) => {
          const max = Math.max(z.left ?? 0, z.center ?? 0, z.right ?? 0);
          return (
            <div key={name}>
              <p className="mb-1.5 truncate text-xs font-semibold text-muted">{name}</p>
              <div className="pitch-surface relative grid h-36 grid-rows-3 gap-1 overflow-hidden rounded-xl p-1.5">
                {(["left", "center", "right"] as const).map((key) => {
                  const value = z[key] ?? 0;
                  const lead = value === max;
                  return (
                    <div key={key} className="relative flex items-center justify-center overflow-hidden rounded-lg bg-white/[0.04]">
                      <span
                        className={`bar-grow absolute inset-y-0 left-0 ${tone}`}
                        style={{ width: `${value}%`, opacity: lead ? 0.9 : 0.35 }}
                      />
                      <span className={`relative font-display text-sm font-extrabold num ${lead ? text : "text-white"}`}>
                        {value}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-dim">
                <span>Left ↑</span>
                <span>Right ↓</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
    <div className="card p-4">
      <p className="eyebrow mb-2">Top rated</p>
      <div className="space-y-3">
        {groups.map(({ team, players }) => (
          <div key={team.name}>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-dim">
              <Crest id={team.id} name={team.name} size={14} />
              {team.name}
            </p>
            <div className="divide-y divide-line/30">
              {players.slice(0, 3).map((player) => (
                <Link
                  key={player.playerId}
                  href={`/player/${player.playerId}`}
                  className="press flex items-center gap-2.5 rounded-lg py-1.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10">
                    <PlayerPhoto playerId={player.playerId} alt="" width={32} height={32} className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {player.name.fullName ?? `${player.name.firstName ?? ""} ${player.name.lastName ?? ""}`}
                    </span>
                    <span className="text-[11px] text-dim">{player.positionLabel?.label ?? ""}</span>
                  </span>
                  <RatingChip rating={player.playerRating ?? player.playerRatingRounded} star={player.manOfTheMatch} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
