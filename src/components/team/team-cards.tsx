import { LocalTime } from "@/components/local-time";
import { PlayerPhoto } from "@/components/player-photo";
import Image from "next/image";
import Link from "next/link";
import {
  formatMarketValue,
} from "@/lib/format";
import { scoreFromStatus } from "@/lib/stats";
import type {
  SquadGroup,
  SquadMember,
  StatEntry,
  StatLeaderGroup,
  TeamFixture,
  TeamFormEntry,
  TeamResponse,
} from "@/lib/types";
import { ChevronRightIcon, TrophyIcon } from "../icons";
import { Crest, EmptyState, FormPill, RatingChip } from "../ui";
import { Chip, K, Phos } from "../tl";

export function NextMatchCard({
  fixture,
  teamId,
}: {
  fixture?: TeamFixture | null;
  teamId: number;
}) {
  if (!fixture) {
    return (
      <div className="card p-4">
        <K>Next match</K>
        <p className="mt-2 text-[12.5px] text-muted">No upcoming fixture scheduled.</p>
      </div>
    );
  }

  const homeIsTeam = String(fixture.home.id) === String(teamId);
  const opponent = homeIsTeam ? fixture.away : fixture.home;

  return (
    <Link
      href={`/match/${fixture.id}`}
      className="card group flex h-full flex-col overflow-hidden p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <K>Next match</K>
        <Chip>{fixture.tournament?.name ?? "Fixture"}</Chip>
      </div>
      <div className="my-auto flex items-center justify-between gap-3 py-5">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <Crest id={fixture.home.id} name={fixture.home.name} size={42} />
          <span className="w-full truncate text-[11.5px] font-semibold text-ink">
            {fixture.home.name}
          </span>
        </div>
        <div className="shrink-0 text-center">
          <p className="tl-num text-[19px] text-ink">
            {fixture.status.started ? fixture.status.scoreStr ?? "vs" : <LocalTime value={fixture.status.utcTime} />}
          </p>
          <p className="mt-0.5 text-[10.5px] font-semibold text-dim">
            <LocalTime value={fixture.status.utcTime} kind="short" />
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <Crest id={fixture.away.id} name={fixture.away.name} size={42} />
          <span className="w-full truncate text-[11.5px] font-semibold text-ink">
            {fixture.away.name}
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-center gap-1 border-t border-line pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-dim transition-colors group-hover:text-accent">
        Match centre
        <ChevronRightIcon size={12} />
      </div>
      <span className="sr-only">Next opponent {opponent.name}</span>
    </Link>
  );
}

export function TeamFormCard({
  form,
  href,
  teamId,
}: {
  form?: TeamFormEntry[];
  href?: string;
  teamId?: number;
}) {
  if (!form?.length) {
    return (
      <div className="card p-4">
        <K className="mb-2">Recent form</K>
        <p className="text-[12.5px] text-muted">No matches played yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-dashed border-line-strong pb-2">
        <K>Recent form</K>
        <Link
          href={href ?? "#"}
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-dim transition-colors hover:text-accent"
        >
          All results
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {form.map((item, index) => {
          const opponent =
            item.home && String(item.home.id) !== String(teamId)
              ? item.home
              : item.away ?? item.home;
          return (
            <Link
              key={`${item.date?.utcTime ?? index}`}
              href={
                item.linkToMatch
                  ? `/match/${item.linkToMatch.split("#").pop()}`
                  : "#"
              }
              className="press group flex items-center gap-2 border border-line bg-card p-2 transition-colors hover:bg-hover"
              title={`${item.home?.name ?? ""} ${item.score ?? ""} ${item.away?.name ?? ""}`}
            >
              <FormPill result={item.result} size={22} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-semibold text-ink">
                  {opponent?.shortName ?? opponent?.name ?? "Match"}
                </p>
                <p className="mt-0.5 truncate text-[10.5px] text-dim">
                  <span className="num">{item.score ?? "—"}</span>
                  {item.tournamentName ? ` · ${item.tournamentName}` : ""}
                </p>
              </div>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 object-contain opacity-80 transition-opacity group-hover:opacity-100"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MatchResultCard({
  fixture,
  teamId,
  label,
}: {
  fixture?: TeamFixture | null;
  teamId: number;
  label: string;
}) {
  if (!fixture) return null;
  const homeIsTeam = String(fixture.home.id) === String(teamId);
  const score = scoreFromStatus(fixture.status);

  return (
    <Link href={`/match/${fixture.id}`} className="press card flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-3">
        <K>{label}</K>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-dim">
          {fixture.tournament?.name ?? ""}
        </span>
      </div>
      <div className="my-auto flex items-center gap-3 py-4">
        <div className="flex flex-1 items-center gap-2">
          <Crest id={fixture.home.id} name={fixture.home.name} size={32} />
          <span
            className={`min-w-0 truncate text-[11.5px] ${
              homeIsTeam ? "font-bold text-ink" : "font-medium text-muted"
            }`}
          >
            {fixture.home.shortName ?? fixture.home.name}
          </span>
        </div>
        <span className="shrink-0 tl-num text-[24px] leading-none text-ink">
          {score ? `${score[0]}–${score[1]}` : <LocalTime value={fixture.status.utcTime} />}
        </span>
        <div className="flex flex-1 items-center justify-end gap-2 text-right">
          <span
            className={`min-w-0 truncate text-[11.5px] ${
              !homeIsTeam ? "font-bold text-ink" : "font-medium text-muted"
            }`}
          >
            {fixture.away.shortName ?? fixture.away.name}
          </span>
          <Crest id={fixture.away.id} name={fixture.away.name} size={32} />
        </div>
      </div>
      <p className="mt-auto text-center text-[10.5px] font-semibold text-dim">
        <LocalTime value={fixture.status.utcTime} kind="short" />
      </p>
    </Link>
  );
}


export function SquadPlayer({ member }: { member: SquadMember }) {
  const position = member.positionIdsDesc ?? member.role?.fallback ?? "Player";
  return (
    <Link
      href={`/player/${member.id}`}
      className="press group flex items-center gap-3 border border-line bg-card p-2.5 transition-colors hover:bg-hover"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-line bg-card-2">
        <PlayerPhoto
          playerId={member.id}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-cover object-top"
        />
        {member.shirtNumber !== undefined && (
          <span className="tl-num absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center border border-line bg-base px-1 text-[10px] leading-none text-ink">
            {member.shirtNumber}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-ink group-hover:text-accent">
          {member.name}
          {member.isCaptain && <span className="ml-1 text-[10.5px] font-bold text-accent">C</span>}
        </p>
        <p className="truncate text-[10.5px] text-dim">
          {position}
          {member.age ? ` · ${member.age}y` : ""}
          {member.injury ? " · injured" : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {member.rating ? <RatingChip rating={member.rating} /> : null}
        <span className="text-[10.5px] font-semibold text-dim num">
          {formatMarketValue(member.transferValue)}
        </span>
      </div>
    </Link>
  );
}

export function SquadGrid({ groups }: { groups?: SquadGroup[] }) {
  if (!groups?.length) {
    return <EmptyState title="Squad not available." />;
  }

  const order = ["coach", "keepers", "defenders", "midfielders", "attackers"];
  const sorted = [...groups].sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  return (
    <div className="space-y-6">
      {sorted.map((group) => {
        if (group.title === "coach") {
          const coach = group.members[0];
          if (!coach) return null;
          return (
            <section key={group.title}>
              <K className="mb-2">Head coach</K>
              <div className="max-w-sm">
                <SquadPlayer member={coach} />
              </div>
            </section>
          );
        }
        return (
          <section key={group.title}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <K className="capitalize">{group.title}</K>
              <span className="text-[10.5px] font-semibold text-dim">
                {group.members.length} players
              </span>
            </div>
            <div className="stagger grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {group.members.map((member) => (
                <SquadPlayer key={member.id} member={member} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function statDisplay(entry?: StatEntry) {
  if (!entry) return "—";
  if (entry.stat?.format === "fraction") {
    return Number(entry.stat.value).toFixed(entry.stat.fractions ?? 2);
  }
  return String(entry.value ?? entry.stat?.value ?? "—");
}

export function TeamStatGrid({
  groups,
  highlightTeamId,
}: {
  groups?: StatLeaderGroup[];
  highlightTeamId?: number;
}) {
  if (!groups?.length) {
    return <EmptyState title="No team stats available." />;
  }

  return (
    <div>
      <Phos className="mb-2" />
      <div className="tl-kpis">
        {groups.map((group) => {
          const entry =
            group.participant ??
            group.topThree?.find(
              (item) =>
                highlightTeamId !== undefined &&
                String(item.teamId) === String(highlightTeamId),
            );
          const highlighted =
            highlightTeamId !== undefined &&
            entry?.teamId !== undefined &&
            String(entry.teamId) === String(highlightTeamId);
          return (
            <div
              key={group.header}
              className={`tl-kpi ${highlighted ? "border-l-2 border-l-accent bg-card-2/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <K dim>{group.header}</K>
                {entry?.rank ? <Chip>#{entry.rank}</Chip> : null}
              </div>
              <p className="tl-kpi-v tl-num">{statDisplay(entry)}</p>
              <p className="tl-kpi-src truncate">{entry?.teamName ?? entry?.name ?? "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrophyGrid({
  trophies,
}: {
  trophies?: NonNullable<TeamResponse["history"]>["trophyList"];
}) {
  const wins = (trophies ?? []).filter((trophy) => (trophy.won ?? 0) > 0);
  if (wins.length === 0) {
    return <EmptyState title="No trophies recorded." />;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {wins.map((trophy) => {
        const seasons = (trophy.seasonsWon ?? "")
          .split(",")
          .filter(Boolean)
          .slice(0, 3);
        return (
          <div key={trophy.name} className="card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <TrophyIcon size={16} className="mt-0.5 shrink-0 text-accent" />
              <span className="tl-num text-[20px] leading-none text-ink">{trophy.won}</span>
            </div>
            <p className="mt-2 text-[11.5px] font-semibold text-ink">{trophy.name}</p>
            <p className="tl-kpi-src mt-1 truncate">
              {trophy.runnerup ? `${trophy.runnerup} runner-up · ` : ""}
              {seasons.length ? seasons.join(", ") : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}


export function SquadPreview({ groups }: { groups?: SquadGroup[] }) {
  const members = (groups ?? [])
    .filter((group) => group.title !== "coach")
    .flatMap((group) => group.members)
    .filter((member) => member.rating !== undefined && member.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  if (members.length === 0) {
    return <EmptyState title="Squad not available." />;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => (
        <SquadPlayer key={member.id} member={member} />
      ))}
    </div>
  );
}
