import { LocalTime } from "@/components/local-time";
import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { isLive, scorePair, statusLabel, statusTone } from "@/lib/format";
import type { MatchStatus } from "@/lib/types";
import { ChevronRightIcon } from "./icons";
import { Crest, LiveDot } from "./ui";

export type MatchRowData = {
  id: string | number;
  home: { id: string | number; name: string; shortName?: string; score?: number };
  away: { id: string | number; name: string; shortName?: string; score?: number };
  status: MatchStatus;
};

function TeamLine({
  team,
  redCards,
  winner,
  live,
  side = "away",
}: {
  team: MatchRowData["home"];
  redCards: number;
  winner: boolean;
  live: boolean;
  side?: "home" | "away";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${side === "home" ? "sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <Crest id={team.id} name={team.name} size={24} />
      <span
        className={`min-w-0 flex-1 truncate text-[14px] leading-tight ${
          winner ? "font-bold text-ink" : live ? "font-semibold text-ink" : "font-medium text-muted"
        }`}
      >
        {team.name}
      </span>
      {redCards > 0 && (
        <span className="inline-flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {redCards}
        </span>
      )}
    </div>
  );
}

export function MatchRow({
  match,
  href,
  className = "",
}: {
  match: MatchRowData;
  href?: string;
  className?: string;
}) {
  const live = isLive(match.status);
  const finished = Boolean(match.status.finished);
  const tone = statusTone(match.status);
  const [homeScore, awayScore] = scorePair(match);
  const showScore = Boolean(match.status.started || match.status.finished);
  const homeWinner =
    finished && Number(homeScore) !== Number(awayScore) && Number(homeScore) > Number(awayScore);
  const awayWinner =
    finished && Number(homeScore) !== Number(awayScore) && Number(awayScore) > Number(homeScore);

  return (
    <Link
      href={href ?? `/match/${match.id}`}
      className={`group relative grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 px-3 py-3 transition-colors before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-accent before:opacity-0 hover:bg-white/[0.03] hover:before:opacity-100 sm:grid-cols-[64px_minmax(0,1fr)_88px_minmax(0,1fr)_16px] sm:gap-x-4 sm:px-5 sm:py-3.5 ${live ? "bg-live/[0.018]" : ""} ${className}`}
      aria-label={`${match.home.name} ${showScore ? `${homeScore}, ` : "vs "}${match.away.name}${showScore ? ` ${awayScore}` : ""}`}
    >
      <div className="row-span-2 flex flex-col items-start gap-0.5 sm:row-span-1">
        {tone === "live" ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-live">
            <LiveDot />
            {statusLabel(match.status)}
          </span>
        ) : (
          <span
            className={`text-xs font-semibold num ${
              tone === "scheduled" ? "text-ink" : tone === "cancelled" ? "text-red-400" : "text-dim"
            }`}
          >
            {tone === "scheduled"
              ? <LocalTime value={match.status.utcTime} />
              : statusLabel(match.status)}
          </span>
        )}
        {tone === "scheduled" && match.status.reason?.short && (
          <span className="text-[10px] font-medium text-dim">
            {match.status.reason.short}
          </span>
        )}
      </div>

      <TeamLine side="home" team={match.home} redCards={match.status.numberOfHomeRedCards ?? 0} winner={homeWinner} live={live} />
      <span
        className={`score-chip flex h-7 min-w-8 items-center justify-center rounded-md px-1.5 text-[14px] leading-none num sm:hidden ${
          showScore ? (homeWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "invisible"
        }`}
      >
        {showScore ? homeScore : "0"}
      </span>

      <span
        className={`score-chip hidden h-9 items-center justify-center gap-2 rounded-lg font-display text-[15px] leading-none num sm:flex ${
          showScore ? (live ? "border-live/40 text-ink" : "text-ink") : "text-dim"
        }`}
        aria-hidden="true"
      >
        {showScore ? (
          <>
            <b className={homeWinner || live ? "font-extrabold" : "font-semibold text-muted"}>{homeScore}</b>
            <i className="h-px w-2 bg-dim not-italic" />
            <b className={awayWinner || live ? "font-extrabold" : "font-semibold text-muted"}>{awayScore}</b>
          </>
        ) : (
          <span className="text-xs font-semibold">vs</span>
        )}
      </span>

      <TeamLine team={match.away} redCards={match.status.numberOfAwayRedCards ?? 0} winner={awayWinner} live={live} />
      <span
        className={`score-chip flex h-7 min-w-8 items-center justify-center rounded-md px-1.5 text-[14px] leading-none num sm:hidden ${
          showScore ? (awayWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "invisible"
        }`}
      >
        {showScore ? awayScore : "0"}
      </span>
      <ChevronRightIcon
        size={14}
        className="hidden text-dim opacity-0 transition-opacity group-hover:opacity-100 sm:block"
      />
    </Link>
  );
}

export function LeagueMatchGroup({
  leagueId,
  primaryId,
  name,
  ccode,
  matches,
  showTableLink = true,
}: {
  leagueId: number;
  primaryId?: number;
  name: string;
  ccode: string;
  matches: MatchRowData[];
  showTableLink?: boolean;
}) {
  const href = `/league/${primaryId ?? leagueId}`;
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line/60 bg-white/[0.014] px-3 py-3 sm:px-4">
        <Link href={href} className="group flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-card-2/70">
            <Image
              src={leagueLogo(leagueId)}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-ink transition-colors group-hover:text-accent">
                {name}
              </span>
              <span className="hidden rounded-md border border-line/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-dim sm:inline">
                {ccode}
              </span>
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-dim">
              {matches.length} {matches.length === 1 ? "fixture" : "fixtures"}
            </span>
          </span>
        </Link>
        {showTableLink && (
          <Link
            href={href}
            aria-label={`Open ${name}`}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-transparent px-1.5 py-1.5 text-[10px] font-semibold text-dim transition-colors hover:border-line hover:bg-white/[0.03] hover:text-accent sm:px-2"
          >
            <span className="hidden sm:inline">View league</span>
            <ChevronRightIcon size={12} />
          </Link>
        )}
      </div>
      <div className="divide-y divide-line/45">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
