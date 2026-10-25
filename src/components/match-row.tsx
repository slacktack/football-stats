import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { formatKickoff, isLive, scorePair, statusLabel, statusTone } from "@/lib/format";
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
}: {
  team: MatchRowData["home"];
  redCards: number;
  winner: boolean;
  live: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Crest id={team.id} name={team.name} size={22} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] leading-none ${
          winner ? "font-bold text-ink" : live ? "font-semibold text-ink" : "font-medium text-muted"
        }`}
      >
        {team.name}
      </span>
      {redCards > 0 && (
        <span className="inline-flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-red-500 px-1 text-[8px] font-bold leading-none text-white">
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
      className={`group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 transition-colors hover:bg-white/[0.032] sm:grid-cols-[54px_minmax(0,1fr)_auto] sm:gap-x-3 sm:px-4 sm:py-3 ${className}`}
      aria-label={`${match.home.name} vs ${match.away.name}`}
    >
      <div className="row-span-2 flex flex-col items-start gap-0.5">
        {tone === "live" ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-live">
            <LiveDot />
            {statusLabel(match.status)}
          </span>
        ) : (
          <span
            className={`text-[11px] font-semibold num ${
              tone === "scheduled" ? "text-ink" : tone === "cancelled" ? "text-red-400" : "text-dim"
            }`}
          >
            {tone === "scheduled"
              ? formatKickoff(match.status.utcTime)
              : statusLabel(match.status)}
          </span>
        )}
        {tone === "scheduled" && match.status.reason?.short && (
          <span className="text-[9px] font-medium uppercase tracking-wide text-dim">
            {match.status.reason.short}
          </span>
        )}
      </div>

      <TeamLine team={match.home} redCards={match.status.numberOfHomeRedCards ?? 0} winner={homeWinner} live={live} />
      <span
        className={`text-right text-[15px] leading-none num ${
          showScore ? (homeWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "text-transparent"
        }`}
      >
        {showScore ? homeScore : "0"}
      </span>

      <TeamLine team={match.away} redCards={match.status.numberOfAwayRedCards ?? 0} winner={awayWinner} live={live} />
      <span
        className={`text-right text-[15px] leading-none num ${
          showScore ? (awayWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "text-transparent"
        }`}
      >
        {showScore ? awayScore : "0"}
      </span>
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
      <div className="flex items-center gap-2 border-b border-line/60 bg-white/[0.014] px-3 py-2.5 sm:px-4">
        <Link href={href} className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] ring-1 ring-inset ring-white/[0.05]">
            <Image
              src={leagueLogo(leagueId)}
              alt=""
              width={22}
              height={22}
              className="h-[74%] w-[74%] object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13px] font-bold text-ink transition-colors group-hover:text-accent">
                {name}
              </span>
              <span className="hidden rounded bg-white/[0.055] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-dim sm:inline">
                {ccode}
              </span>
            </span>
          </span>
        </Link>
        <span className="ml-auto shrink-0 text-[10px] font-medium text-dim">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </span>
        {showTableLink && (
          <Link
            href={href}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-semibold text-dim transition-colors hover:text-accent"
          >
            View
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
