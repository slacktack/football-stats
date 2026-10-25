import Link from "next/link";
import { scorePair } from "@/lib/format";
import type { MatchStatus } from "@/lib/types";
import { ChevronRightIcon } from "./icons";
import { Crest, LiveDot } from "./ui";

export type LiveTickerItem = {
  id: string | number;
  home: { id: string | number; name: string; shortName?: string; score?: number };
  away: { id: string | number; name: string; shortName?: string; score?: number };
  status: MatchStatus;
  leagueName: string;
};

export function LiveTicker({ matches }: { matches: LiveTickerItem[] }) {
  if (!matches.length) return null;

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-line/70 bg-card sm:rounded-2xl">
      <div className="flex items-stretch">
        <Link
          href="/?filter=live"
          className="flex shrink-0 items-center gap-1.5 border-r border-line/70 bg-live px-3 text-white"
        >
          <LiveDot className="bg-white" />
          <span className="hidden text-[9px] font-black uppercase tracking-[0.14em] sm:inline">
            Live
          </span>
          <span className="text-[11px] font-black num sm:hidden">{matches.length}</span>
        </Link>
        <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto">
          {matches.map((match) => {
            const [homeScore, awayScore] = scorePair(match);
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="group flex shrink-0 items-center gap-2 border-r border-line/45 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <span className="w-7 shrink-0 text-center text-[10px] font-black text-live num">
                  {match.status.liveTime?.short ?? "LIVE"}
                </span>
                <Crest id={match.home.id} name={match.home.name} size={17} />
                <span className="max-w-[72px] truncate text-[11px] font-semibold text-ink">
                  {match.home.shortName ?? match.home.name}
                </span>
                <span className="rounded bg-card-2 px-1.5 py-0.5 text-[10px] font-black text-ink num">
                  {homeScore}–{awayScore}
                </span>
                <span className="max-w-[72px] truncate text-[11px] font-semibold text-ink">
                  {match.away.shortName ?? match.away.name}
                </span>
                <Crest id={match.away.id} name={match.away.name} size={17} />
              </Link>
            );
          })}
        </div>
        <Link
          href="/?filter=live"
          className="hidden shrink-0 items-center gap-1 border-l border-line/70 px-3 text-[10px] font-bold text-muted transition-colors hover:text-ink sm:flex"
        >
          All live
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </section>
  );
}
