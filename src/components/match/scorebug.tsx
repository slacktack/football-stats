import Image from "next/image";
import Link from "next/link";
import { leagueLogo, teamCrest } from "@/lib/assets";
import { CalendarIcon, FlagIcon, GoalIcon, MapPinIcon, UsersIcon } from "../icons";
import { LiveRefresher } from "../live-refresher";
import { LocalTime } from "../local-time";

type Team = { id: number | string; name: string };
type Scorer = { name: string; id?: number; minutes: string[] };

export function ScoreBug({
  home,
  away,
  homeColor,
  awayColor,
  photo,
  score,
  live,
  started,
  finished,
  statusLong,
  liveMinute,
  utcTime,
  league,
  round,
  scorers,
  xg,
  venue,
  referee,
  attendance,
}: {
  home: Team;
  away: Team;
  homeColor: string;
  awayColor: string;
  photo?: string;
  score: [string, string] | null;
  live: boolean;
  started: boolean;
  finished: boolean;
  statusLong?: string;
  liveMinute?: string;
  utcTime?: string;
  league: { id: number; logoId: number; name?: string };
  round?: string;
  scorers: { home: Scorer[]; away: Scorer[] };
  xg: [string, string] | null;
  venue?: string;
  referee?: string;
  attendance?: number;
}) {
  return (
    <section
      className="matchhero"
      style={{
        backgroundImage: `radial-gradient(60% 90% at 0% 50%, ${homeColor}55, transparent 70%), radial-gradient(60% 90% at 100% 50%, ${awayColor}55, transparent 70%)`,
      }}
      aria-label={`${home.name} vs ${away.name}`}
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="matchhero-photo" aria-hidden="true" />
      )}
      <div className="matchhero-inner">
        <div className="flex items-center justify-center gap-2">
          <Link href={`/league/${league.id}`} className="flex items-center gap-2 text-[15px] font-semibold text-white hover:underline">
            <Image src={leagueLogo(league.logoId)} alt="" width={22} height={22} className="logo-watermark h-[22px] w-[22px] object-contain brightness-0 invert" />
            {league.name ?? "Match"}
            {round ? ` round ${round}` : ""}
          </Link>
          {live && (
            <span className="absolute right-4 top-4">
              <LiveRefresher active />
            </span>
          )}
        </div>

        <ul className="matchhero-meta">
          {utcTime && (
            <li>
              <CalendarIcon size={15} />
              <LocalTime value={utcTime} kind="dayTime" />
            </li>
          )}
          {venue && (
            <li>
              <MapPinIcon size={15} />
              {venue}
            </li>
          )}
          {referee && (
            <li className="hidden sm:flex">
              <FlagIcon size={15} />
              {referee}
            </li>
          )}
          {attendance ? (
            <li className="hidden md:flex">
              <UsersIcon size={15} />
              {attendance.toLocaleString("en-GB")}
            </li>
          ) : null}
        </ul>

        <div className="matchhero-board">
          <TeamSide team={home} />
          <div className="flex flex-col items-center">
            {(started || finished) && score ? (
              <p className="matchhero-score num" aria-label={`Score ${score[0]} to ${score[1]}`}>
                {score[0]}
                <span className="mx-[0.18em] text-white/50">-</span>
                {score[1]}
              </p>
            ) : (
              <p className="matchhero-score matchhero-kickoff num">
                {utcTime ? <LocalTime value={utcTime} /> : "vs"}
              </p>
            )}
            <p className={`mt-1 text-sm font-medium ${live ? "flex items-center gap-1.5 text-accent" : "text-white/70"}`}>
              {live && <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />}
              {live ? liveMinute ?? "Live" : statusLong ?? (finished ? "Full time" : "Kick-off")}
            </p>
            {xg && (
              <p className="mt-2 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/75 num">
                xG <b className="font-semibold text-white">{xg[0]}</b> - <b className="font-semibold text-white">{xg[1]}</b>
              </p>
            )}
          </div>
          <TeamSide team={away} />
        </div>

        {(scorers.home.length > 0 || scorers.away.length > 0) && (
          <div className="matchhero-scorers">
            <ScorerList items={scorers.home} align="right" />
            <GoalIcon size={16} className="mt-0.5 text-white/60" />
            <ScorerList items={scorers.away} align="left" />
          </div>
        )}
      </div>
    </section>
  );
}

function TeamSide({ team }: { team: Team }) {
  return (
    <Link href={`/team/${team.id}`} className="group flex min-w-0 flex-col items-center gap-2.5 text-center">
      <span className="matchhero-crest">
        <Image src={teamCrest(team.id)} alt="" width={72} height={72} priority className="h-[74%] w-[74%] object-contain" />
      </span>
      <span className="max-w-full truncate text-[15px] font-semibold text-white group-hover:underline sm:text-xl">{team.name}</span>
    </Link>
  );
}

function ScorerList({ items, align }: { items: Scorer[]; align: "left" | "right" }) {
  return (
    <ul className={`min-w-0 space-y-1 ${align === "right" ? "text-right" : "text-left"}`}>
      {items.map((item) => (
        <li key={item.name} className="truncate text-[13px] sm:text-sm">
          <span className="font-medium text-white">{item.name}</span>{" "}
          <span className="text-white/60 num">{item.minutes.join(", ")}</span>
        </li>
      ))}
    </ul>
  );
}
