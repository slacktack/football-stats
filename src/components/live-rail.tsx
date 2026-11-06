import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { scorePair, statusLabel } from "@/lib/format";
import { ChevronRightIcon } from "./icons";
import type { MatchRowData } from "./match-row";
import { Leds, Phos, Wave } from "./tl";
import { Crest } from "./ui";

export type LiveRailMatch = MatchRowData & { leagueId: number; leagueName: string };

function TeamScore({
  team,
  score,
  leading,
}: {
  team: LiveRailMatch["home"];
  score: string;
  leading: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Crest id={team.id} name={team.name} size={26} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] leading-tight ${
          leading ? "font-semibold text-ink" : "text-muted"
        }`}
      >
        {team.shortName ?? team.name}
      </span>
      <span className={`tl-num text-[22px] ${leading ? "text-ink" : "text-muted"}`}>{score}</span>
    </div>
  );
}

export function LiveRail({ matches, total }: { matches: LiveRailMatch[]; total: number }) {
  if (!matches.length) return null;

  return (
    <section aria-label="Live now" className="mt-4">
      <div className="flex items-center justify-between gap-3 pb-2">
        <h2 className="tl-k flex items-center gap-2 text-[11.5px] font-semibold">
          <Leds n={5} />
          <Wave text="Live now" />
          <span className="tl-num text-[15px] text-live">{total}</span>
        </h2>
        <Link
          href="/?filter=live"
          className="tl-k flex items-center gap-1 text-dim transition-colors hover:text-accent"
        >
          See all
          <ChevronRightIcon size={11} />
        </Link>
      </div>

      <Phos className="mb-2" />

      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-px overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {matches.map((match) => {
          const [home, away] = scorePair(match);
          const minute = Number.parseInt(match.status.liveTime?.short ?? "", 10);
          const progress = Number.isFinite(minute) ? Math.min(100, (minute / 90) * 100) : 50;
          return (
            <li key={match.id} className="w-[214px] shrink-0 snap-start sm:w-[240px]">
              <Link
                href={`/match/${match.id}`}
                aria-label={`${match.home.name} ${home}, ${match.away.name} ${away}`}
                className="press tl-panel flex h-full flex-col gap-2 p-0"
              >
                <span className="flex items-center gap-2 border-b border-line px-2.5 py-2">
                  <Image
                    src={leagueLogo(match.leagueId)}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] shrink-0 object-contain"
                  />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] uppercase tracking-[0.06em] text-dim">
                    {match.leagueName}
                  </span>
                  <span className="tl-num shrink-0 text-[12px] text-live">
                    {statusLabel(match.status)}
                  </span>
                </span>

                <span className="grid gap-2 px-2.5 py-2">
                  <TeamScore team={match.home} score={home} leading={Number(home) >= Number(away)} />
                  <TeamScore team={match.away} score={away} leading={Number(away) >= Number(home)} />
                </span>

                <span className="mt-auto block h-[3px] bg-line" aria-hidden="true">
                  <span
                    className="bar-grow block h-full bg-live"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
