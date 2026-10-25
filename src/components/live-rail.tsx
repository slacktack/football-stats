import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { scorePair, statusLabel } from "@/lib/format";
import { ChevronRightIcon } from "./icons";
import type { MatchRowData } from "./match-row";
import { Crest, LiveDot } from "./ui";

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
    <div className="flex items-center gap-2">
      <Crest id={team.id} name={team.name} size={20} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] leading-tight ${leading ? "font-bold text-ink" : "font-medium text-muted"}`}
      >
        {team.shortName ?? team.name}
      </span>
      <span
        className={`font-display text-[15px] leading-none num ${leading ? "font-black text-ink" : "font-bold text-muted"}`}
      >
        {score}
      </span>
    </div>
  );
}

export function LiveRail({ matches, total }: { matches: LiveRailMatch[]; total: number }) {
  if (!matches.length) return null;

  return (
    <section aria-label="Live now" className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-bold text-ink">
          <LiveDot />
          Live now
          <span className="text-dim num">{total}</span>
        </h2>
        <Link
          href="/?filter=live"
          className="flex items-center gap-0.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          See all
          <ChevronRightIcon size={12} />
        </Link>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-pl-6 sm:px-6 lg:mx-0 lg:scroll-pl-0 lg:px-0">
        {matches.map((match) => {
          const [home, away] = scorePair(match);
          return (
            <li key={match.id} className="w-[184px] shrink-0 snap-start sm:w-[208px]">
              <Link
                href={`/match/${match.id}`}
                aria-label={`${match.home.name} ${home}, ${match.away.name} ${away}`}
                className="card card-hover block px-3 py-2.5"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Image
                    src={leagueLogo(match.leagueId)}
                    alt=""
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 shrink-0 object-contain"
                  />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-dim">
                    {match.leagueName}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-live num">
                    {statusLabel(match.status)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <TeamScore team={match.home} score={home} leading={Number(home) >= Number(away)} />
                  <TeamScore team={match.away} score={away} leading={Number(away) >= Number(home)} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
