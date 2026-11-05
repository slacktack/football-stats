import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { leagueLogo } from "@/lib/assets";
import { isLive, scorePair, statusLabel, todayParam } from "@/lib/format";
import { getMatchesByDate } from "@/lib/fotmob";
import { Brand } from "./brand";
import { LocalTime } from "./local-time";
import { SideNavLinks } from "./side-nav-links";
import { ThemeToggle } from "./theme-toggle";
import { Crest } from "./ui";

const LEAGUES = [
  { id: 47, name: "Premier League" },
  { id: 42, name: "Champions League" },
  { id: 87, name: "LaLiga" },
  { id: 54, name: "Bundesliga" },
  { id: 55, name: "Serie A" },
  { id: 53, name: "Ligue 1" },
  { id: 73, name: "Europa League" },
];

export function SideNav() {
  return (
    <aside className="sidenav" aria-label="Sidebar">
      <div className="thin-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="px-4 pb-3 pt-4">
        <Brand />
      </div>
      <Suspense fallback={<div className="h-[172px]" />}>
        <SideNavLinks />
      </Suspense>

      <p className="sidenav-heading">Leagues</p>
      <ul className="px-2">
        {LEAGUES.map((league) => (
          <li key={league.id}>
            <Link href={`/league/${league.id}`} className="sidenav-link">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                <Image src={leagueLogo(league.id)} alt="" width={18} height={18} className="logo-watermark h-[18px] w-[18px] object-contain" />
              </span>
              {league.name}
            </Link>
          </li>
        ))}
      </ul>

      <Suspense fallback={<div className="mx-4 mt-6 h-32 rounded-xl skeleton" />}>
        <SideMatches />
      </Suspense>

      </div>
      <div className="border-t border-line px-4 py-3">
        <ThemeToggle placement="up" />
      </div>
    </aside>
  );
}

async function SideMatches() {
  await connection();
  const data = await getMatchesByDate(todayParam()).catch(() => null);
  const all = (data?.leagues ?? []).flatMap((league) =>
    league.matches.map((match) => ({ ...match, leagueName: league.name, leagueId: league.primaryId ?? league.id })),
  );
  const top = new Set(LEAGUES.map((l) => l.id));
  const live = all.filter((m) => isLive(m.status));
  const upcoming = all
    .filter((m) => !m.status.started && !m.status.cancelled && top.has(m.leagueId))
    .sort((a, b) => new Date(a.status.utcTime).getTime() - new Date(b.status.utcTime).getTime());
  const list = (live.length ? live : upcoming).slice(0, 6);
  if (!list.length) return null;

  return (
    <section className="mt-2">
      <p className="sidenav-heading flex items-center gap-2">
        {live.length ? (
          <>
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
            Live now
          </>
        ) : (
          "Next up today"
        )}
      </p>
      <ul className="space-y-2 px-3">
        {list.map((match) => {
          const [hs, as] = scorePair(match);
          const started = match.status.started || match.status.finished;
          return (
            <li key={match.id}>
              <Link href={`/match/${match.id}`} className="sidenav-match">
                <span className="flex items-center justify-between gap-2 text-[11px] text-dim">
                  <span className="truncate">{match.leagueName}</span>
                  <span className={`shrink-0 font-semibold ${isLive(match.status) ? "text-live" : ""}`}>
                    {started ? statusLabel(match.status) : <LocalTime value={match.status.utcTime} />}
                  </span>
                </span>
                {[
                  { team: match.home, score: hs },
                  { team: match.away, score: as },
                ].map(({ team, score }) => (
                  <span key={team.id} className="flex items-center gap-2 text-[13px]">
                    <Crest id={team.id} name={team.name} size={18} />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{team.name}</span>
                    {started && <span className="font-semibold text-ink num">{score}</span>}
                  </span>
                ))}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
