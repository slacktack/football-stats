import Image from "next/image";
import Link from "next/link";
import { leagueLogo, teamCrest } from "@/lib/assets";
import { CalendarIcon, FlagIcon, GoalIcon, MapPinIcon, UsersIcon } from "../icons";
import { LiveRefresher } from "../live-refresher";
import { LocalTime } from "../local-time";
import { Led } from "../tl";

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
    <section className="matchhero" aria-label={`${home.name} vs ${away.name}`}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="matchhero-photo" aria-hidden="true" />
      )}
      <div className="matchhero-inner">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/league/${league.id}`}
            className="tl-k flex min-w-0 items-center gap-2 text-inherit hover:underline"
          >
            <Image
              src={leagueLogo(league.logoId)}
              alt=""
              width={16}
              height={16}
              className="logo-watermark h-4 w-4 shrink-0 object-contain brightness-0 invert"
            />
            <span className="truncate">
              {league.name ?? "Match"}
              {round ? ` · round ${round}` : ""}
            </span>
          </Link>
          {live && <LiveRefresher active />}
        </div>

        <ul className="matchhero-meta">
          {utcTime && (
            <li>
              <CalendarIcon size={13} />
              <LocalTime value={utcTime} kind="dayTime" />
            </li>
          )}
          {venue && (
            <li>
              <MapPinIcon size={13} />
              {venue}
            </li>
          )}
          {referee && (
            <li className="hidden sm:flex">
              <FlagIcon size={13} />
              {referee}
            </li>
          )}
          {attendance ? (
            <li className="hidden md:flex">
              <UsersIcon size={13} />
              {attendance.toLocaleString("en-GB")}
            </li>
          ) : null}
        </ul>

        <div className="matchhero-board">
          <TeamSide team={home} color={homeColor} />
          <div className="flex min-w-0 flex-col items-center">
            {(started || finished) && score ? (
              <p className="matchhero-score num tl-num" aria-label={`Score ${score[0]} to ${score[1]}`}>
                {score[0]}
                <span className="mx-[0.14em] opacity-45">-</span>
                {score[1]}
              </p>
            ) : (
              <p className="matchhero-score matchhero-kickoff num tl-num">
                {utcTime ? <LocalTime value={utcTime} /> : "vs"}
              </p>
            )}
            <p className="tl-k mt-2 flex items-center gap-2 text-inherit">
              {live ? (
                <>
                  <Led />
                  <span className="tl-num text-[15px]" style={{ color: "var(--tl-led)" }}>
                    {liveMinute ?? "Live"}
                  </span>
                </>
              ) : (
                <span className="opacity-75">{statusLong ?? (finished ? "Full time" : "Kick-off")}</span>
              )}
            </p>
            {xg && (
              <p className="tl-k mt-2 flex items-center gap-1.5 text-inherit">
                <span className="opacity-55">xG</span>
                <b className="tl-num text-[13px]">{xg[0]}</b>
                <span className="opacity-35">/</span>
                <b className="tl-num text-[13px]">{xg[1]}</b>
              </p>
            )}
          </div>
          <TeamSide team={away} color={awayColor} />
        </div>

        {(scorers.home.length > 0 || scorers.away.length > 0) && (
          <div className="matchhero-scorers">
            <ScorerList items={scorers.home} align="right" />
            <GoalIcon size={14} className="mt-0.5 opacity-60" />
            <ScorerList items={scorers.away} align="left" />
          </div>
        )}
      </div>
    </section>
  );
}

function TeamSide({ team, color }: { team: Team; color: string }) {
  return (
    <Link href={`/team/${team.id}`} className="group flex min-w-0 flex-col items-center gap-2 text-center">
      <span className="matchhero-crest">
        <Image src={teamCrest(team.id)} alt="" width={72} height={72} priority className="h-[74%] w-[74%] object-contain" />
      </span>
      <span className="tl-k max-w-full truncate text-[11.5px] text-inherit group-hover:underline">{team.name}</span>
      <span className="h-1 w-10 shrink-0 sm:w-14" style={{ backgroundColor: color }} aria-hidden="true" />
    </Link>
  );
}

function ScorerList({ items, align }: { items: Scorer[]; align: "left" | "right" }) {
  return (
    <ul className={`min-w-0 space-y-1 ${align === "right" ? "text-right" : "text-left"}`}>
      {items.map((item) => (
        <li key={item.name} className="truncate text-[11.5px]">
          <span className="font-semibold text-inherit">{item.name}</span>{" "}
          <span className="tl-num opacity-60">{item.minutes.join(", ")}</span>
        </li>
      ))}
    </ul>
  );
}
