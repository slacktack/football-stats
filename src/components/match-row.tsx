import { LocalTime } from "@/components/local-time";
import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { hueClass } from "@/lib/hue";
import { isLive, scorePair, statusLabel, statusTone } from "@/lib/format";
import type { MatchStatus } from "@/lib/types";
import { ChevronRightIcon } from "./icons";
import { Wave } from "./tl";
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
  loser,
  live,
  side = "away",
}: {
  team: MatchRowData["home"];
  redCards: number;
  winner: boolean;
  loser: boolean;
  live: boolean;
  side?: "home" | "away";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${side === "home" ? "sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <Crest id={team.id} name={team.name} size={30} />
      <span
        className={`min-w-0 flex-1 truncate text-[13.5px] leading-tight transition-all duration-200 ${
          winner
            ? "font-bold text-ink"
            : live
              ? "font-semibold text-ink group-hover:tracking-[0.01em] group-hover:text-accent"
              : loser
                ? "text-dim group-hover:text-muted"
                : "text-muted group-hover:text-ink"
        }`}
      >
        {team.name}
      </span>
      {redCards > 0 && (
        <span className="tl-chip tl-chip-alert inline-flex h-4 min-w-4 shrink-0 items-center justify-center !px-1 !py-0 text-[10px] leading-none font-bold">
          {redCards}
        </span>
      )}
      {winner && (
        <span className="tl-k shrink-0 text-[color:var(--tl-teal)]" aria-hidden="true">
          ▲
        </span>
      )}
    </div>
  );
}

/* Live minutes off the status label — "62'", "45+2'", "HT". No digits, no bar. */
function minuteOf(status: MatchStatus) {
  const raw = statusLabel(status).match(/\d+/);
  const minute = raw ? Number(raw[0]) : 0;
  return minute > 0 && minute <= 120 ? minute : 0;
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
  const minute = live ? minuteOf(match.status) : 0;

  return (
    <Link
      href={href ?? `/match/${match.id}`}
      className={`tl-row press group relative grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 py-2.5 transition-colors hover:bg-hover sm:grid-cols-[64px_minmax(0,1fr)_18px_92px_18px_minmax(0,1fr)_14px] sm:gap-x-2.5 sm:px-4 ${
        live ? "tl-row-live bg-mint-soft/70" : ""
      } ${className}`}
      aria-label={`${match.home.name} ${showScore ? `${homeScore}, ` : "vs "}${match.away.name}${
        showScore ? ` ${awayScore}` : ""
      }`}
    >
      <i className="tl-row-sweep" aria-hidden="true" />

      <div className="col-start-1 row-span-2 flex flex-col items-start gap-0.5 sm:row-span-1">
        {tone === "live" ? (
          <span className="tl-k flex items-center gap-1.5 text-live">
            <LiveDot />
            {statusLabel(match.status)}
          </span>
        ) : tone === "scheduled" ? (
          <span className="tl-k text-[color:var(--tl-amber)]">
            <LocalTime value={match.status.utcTime} />
          </span>
        ) : (
          <span
            className={`tl-k ${
              tone === "cancelled"
                ? "text-violet line-through"
                : finished
                  ? "text-[color:var(--tl-teal)]"
                  : "text-dim"
            }`}
          >
            {statusLabel(match.status)}
          </span>
        )}
        {tone === "scheduled" && match.status.reason?.short && (
          <span className="text-[10.5px] text-dim">{match.status.reason.short}</span>
        )}
      </div>

      <div className="col-start-2 row-start-1">
        <TeamLine
          side="home"
          team={match.home}
          redCards={match.status.numberOfHomeRedCards ?? 0}
          winner={homeWinner}
          loser={Boolean(awayWinner)}
          live={live}
        />
      </div>

      <i className="tl-lead col-start-3 row-start-1 hidden self-center sm:block" aria-hidden="true" />

      <span
        className={`tl-vs tl-num col-start-3 row-span-2 sm:col-start-4 sm:row-span-1 ${
          live ? "tl-vs-live" : finished ? "tl-vs-ft" : ""
        }`}
      >
        {showScore ? (
          <>
            <b
              className={`tl-vs-v ${
                live
                  ? "text-live"
                  : homeWinner
                    ? "text-ink"
                    : awayWinner
                      ? "text-dim"
                      : "text-ink"
              }`}
            >
              {homeScore}
            </b>
            <i className="h-3.5 w-px not-italic bg-current opacity-35" aria-hidden="true" />
            <b
              className={`tl-vs-v ${
                live
                  ? "text-live"
                  : awayWinner
                    ? "text-ink"
                    : homeWinner
                      ? "text-dim"
                      : "text-ink"
              }`}
            >
              {awayScore}
            </b>
          </>
        ) : (
          <>
            <i
              className="tl-vs-live-dot h-1.5 w-1.5 shrink-0 bg-[color:var(--tl-amber)]"
              aria-hidden="true"
            />
            <b className="tl-vs-v text-[13px] text-[color:var(--tl-amber)]">VS</b>
          </>
        )}
        {minute > 0 && (
          <span className="tl-row-min absolute inset-x-0 bottom-0 block" aria-hidden="true">
            <span
              className="bar-grow block h-full"
              style={{ width: `${Math.min(100, (minute / 90) * 100)}%` }}
            />
          </span>
        )}
      </span>

      <i className="tl-lead col-start-5 row-start-1 hidden self-center sm:block" aria-hidden="true" />

      <div className="col-start-2 row-start-2 sm:col-start-6 sm:row-start-1">
        <TeamLine
          team={match.away}
          redCards={match.status.numberOfAwayRedCards ?? 0}
          winner={awayWinner}
          loser={Boolean(homeWinner)}
          live={live}
        />
      </div>

      <ChevronRightIcon
        size={13}
        className="col-start-7 row-start-1 hidden text-dim opacity-0 transition-opacity group-hover:opacity-100 sm:block"
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
    <section className={`card overflow-hidden ${hueClass(leagueId)}`}>
      <div className="tl-head tl-head-hue gap-3 py-2.5">
        <Link href={href} className="group flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:color-mix(in_srgb,var(--tl-hue)_40%,var(--color-line))] bg-[color:color-mix(in_srgb,var(--tl-hue)_10%,transparent)] transition-colors group-hover:border-[var(--tl-hue)]">
            <Image
              src={leagueLogo(primaryId ?? leagueId)}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-bold text-ink transition-colors group-hover:text-[var(--tl-hue-ink)]">
                <Wave text={name} />
              </span>
              <span className="tl-tag tl-hue-chip hidden sm:inline">{ccode}</span>
            </span>
            <span className="tl-k tl-hue-t mt-0.5 block opacity-80">
              {matches.length} {matches.length === 1 ? "fixture" : "fixtures"}
            </span>
          </span>
        </Link>
        {showTableLink && (
          <Link
            href={href}
            aria-label={`Open ${name}`}
            className="tl-k ml-auto flex shrink-0 items-center gap-1 border border-transparent px-1.5 py-1 text-dim transition-colors hover:border-[var(--tl-hue)] hover:bg-[color:color-mix(in_srgb,var(--tl-hue)_12%,transparent)] hover:text-[var(--tl-hue-ink)]"
          >
            <span className="hidden sm:inline">Open league</span>
            <ChevronRightIcon size={11} />
          </Link>
        )}
      </div>
      <div className="stagger divide-y divide-line">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
