import Link from "next/link";
import { connection } from "next/server";
import { getMatchesByDate } from "@/lib/fotmob";
import { isLive, scorePair, statusLabel, todayParam } from "@/lib/format";
import { hueClass } from "@/lib/hue";
import { CollapseButton, RailBrand, RailClock, RailNav } from "./rail-ui";
import { LocalTime } from "./local-time";
import { Phos } from "./tl";

const LEAGUES = [
  { id: 47, name: "Premier League", code: "ENG1" },
  { id: 42, name: "Champions League", code: "UECL" },
  { id: 87, name: "LaLiga", code: "ESP1" },
  { id: 54, name: "Bundesliga", code: "GER1" },
  { id: 55, name: "Serie A", code: "ITA1" },
  { id: 53, name: "Ligue 1", code: "FRA1" },
  { id: 73, name: "Europa League", code: "UEEL" },
];

export async function Rail() {
  await connection();
  const data = await getMatchesByDate(todayParam()).catch(() => null);
  const all = (data?.leagues ?? []).flatMap((league) =>
    league.matches.map((match) => ({
      ...match,
      leagueName: league.name,
      leagueId: league.primaryId ?? league.id,
    })),
  );
  const live = all.filter((match) => isLive(match.status));
  const top = new Set(LEAGUES.map((league) => league.id));
  const upcoming = all
    .filter((match) => !match.status.started && !match.status.cancelled && top.has(match.leagueId))
    .sort((a, b) => new Date(a.status.utcTime).getTime() - new Date(b.status.utcTime).getTime());
  const strip = (live.length ? live : upcoming).slice(0, 6);

  return (
    <aside className="tl-rail" aria-label="Console rail">
      <Phos />

      <div className="tl-rail-top">
        <RailBrand />
        <CollapseButton />
      </div>

      <div className="tl-rail-scroll thin-scrollbar">
        <RailNav />

        <p className="tl-rail-k mt-3">Competitions</p>
        <ul className="tl-rail-leagues">
          {LEAGUES.map((league) => (
            <li key={league.id}>
              <Link
                href={`/league/${league.id}`}
                className={`tl-rail-league ${hueClass(league.id)}`}
                title={league.name}
              >
                <span className="tl-rail-tick" aria-hidden="true" />
                <span className="tl-nav-c">{league.code}</span>
                <span className="min-w-0 flex-1 truncate">{league.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {strip.length ? (
          <section className="mt-3">
            <p className="tl-rail-k">
              <span className="tl-live-k">
                {live.length ? <i className="tl-led" aria-hidden="true" /> : null}
                {live.length ? "Live now" : "Next up"}
              </span>
            </p>
            <ul>
              {strip.map((match) => {
                const [home, away] = scorePair(match);
                const started = match.status.started || match.status.finished;
                return (
                  <li key={match.id}>
                    <Link
                      href={`/match/${match.id}`}
                      className={`tl-rail-match ${hueClass(match.leagueId)}`}
                      title={`${match.leagueName} · ${match.home.name} v ${match.away.name}`}
                    >
                      <span className="tl-rm-league truncate">{match.leagueName}</span>
                      <b
                        className={`tl-rm-status shrink-0 text-[10px] uppercase tracking-[0.08em] ${
                          started ? "opacity-55" : "text-[color:var(--tl-amber)]"
                        }`}
                      >
                        {started ? statusLabel(match.status) : <LocalTime value={match.status.utcTime} />}
                      </b>
                      <span className="min-w-0 truncate">
                        {match.home.shortName ?? match.home.name}
                        <span className="opacity-40"> v </span>
                        {match.away.shortName ?? match.away.name}
                      </span>
                      {started ? (
                        <b className="tl-rail-score shrink-0 justify-self-end">
                          {home}-{away}
                        </b>
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="tl-rail-sp" />
      </div>

      <RailClock count={live.length} />
    </aside>
  );
}
