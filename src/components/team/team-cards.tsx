import Image from "next/image";
import Link from "next/link";
import { playerImage } from "@/lib/assets";
import {
  formatKickoff,
  formatMarketValue,
  formatShortDate,
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
import { Crest, FormPill, RatingChip } from "../ui";

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
        <p className="eyebrow">Next match</p>
        <p className="mt-2 text-sm text-muted">No upcoming fixture scheduled.</p>
      </div>
    );
  }

  const homeIsTeam = String(fixture.home.id) === String(teamId);
  const opponent = homeIsTeam ? fixture.away : fixture.home;

  return (
    <Link
      href={`/match/${fixture.id}`}
      className="card card-hover group relative flex h-full flex-col overflow-hidden p-4"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/8 blur-2xl" />
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Next match</p>
        <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-dim">
          {fixture.tournament?.name ?? "Fixture"}
        </span>
      </div>
      <div className="my-auto flex items-center justify-between gap-3 py-5">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <Crest id={fixture.home.id} name={fixture.home.name} size={42} />
          <span className="w-full truncate text-[11px] font-semibold text-ink">
            {fixture.home.name}
          </span>
        </div>
        <div className="shrink-0 text-center">
          <p className="font-display text-lg font-extrabold text-ink">
            {fixture.status.started ? fixture.status.scoreStr ?? "vs" : formatKickoff(fixture.status.utcTime)}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-dim">
            {formatShortDate(fixture.status.utcTime)}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <Crest id={fixture.away.id} name={fixture.away.name} size={42} />
          <span className="w-full truncate text-[11px] font-semibold text-ink">
            {fixture.away.name}
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-center gap-1 border-t border-line/50 pt-2.5 text-[10px] font-semibold text-dim transition-colors group-hover:text-accent">
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
        <p className="eyebrow mb-2">Recent form</p>
        <p className="text-sm text-muted">No matches played yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Recent form</p>
        <Link
          href={href ?? "#"}
          className="text-[10px] font-semibold text-dim transition-colors hover:text-accent"
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
              className="group flex items-center gap-2 rounded-lg bg-white/[0.025] px-2 py-2 ring-1 ring-inset ring-white/[0.04] transition-colors hover:bg-white/[0.05]"
              title={`${item.home?.name ?? ""} ${item.score ?? ""} ${item.away?.name ?? ""}`}
            >
              <FormPill result={item.result} size={22} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-ink">
                  {opponent?.shortName ?? opponent?.name ?? "Match"}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-dim">
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
    <Link href={`/match/${fixture.id}`} className="card card-hover flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-dim">
          {fixture.tournament?.name ?? ""}
        </span>
      </div>
      <div className="my-auto flex items-center gap-3 py-4">
        <div className="flex flex-1 items-center gap-2">
          <Crest id={fixture.home.id} name={fixture.home.name} size={32} />
          <span
            className={`min-w-0 truncate text-xs ${
              homeIsTeam ? "font-bold text-ink" : "font-medium text-muted"
            }`}
          >
            {fixture.home.shortName ?? fixture.home.name}
          </span>
        </div>
        <span className="shrink-0 font-display text-lg font-extrabold text-ink num">
          {score ? `${score[0]} – ${score[1]}` : formatKickoff(fixture.status.utcTime)}
        </span>
        <div className="flex flex-1 items-center justify-end gap-2 text-right">
          <span
            className={`min-w-0 truncate text-xs ${
              !homeIsTeam ? "font-bold text-ink" : "font-medium text-muted"
            }`}
          >
            {fixture.away.shortName ?? fixture.away.name}
          </span>
          <Crest id={fixture.away.id} name={fixture.away.name} size={32} />
        </div>
      </div>
      <p className="mt-auto text-center text-[9px] font-semibold uppercase tracking-wider text-dim">
        {formatShortDate(fixture.status.utcTime)}
      </p>
    </Link>
  );
}


export function SquadPlayer({ member }: { member: SquadMember }) {
  const position = member.positionIdsDesc ?? member.role?.fallback ?? "Player";
  return (
    <Link
      href={`/player/${member.id}`}
      className="group flex items-center gap-3 rounded-xl border border-line/70 bg-card/60 p-2.5 transition-colors hover:border-accent/25 hover:bg-white/[0.03]"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10">
        <Image
          src={playerImage(member.id)}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-cover object-top"
        />
        {member.shirtNumber !== undefined && (
          <span className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-base/90 px-1 text-[8px] font-bold text-muted ring-1 ring-white/10">
            {member.shirtNumber}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-ink group-hover:text-accent">
          {member.name}
          {member.isCaptain && <span className="ml-1 text-[9px] font-bold text-accent">C</span>}
        </p>
        <p className="truncate text-[9px] text-dim">
          {position}
          {member.age ? ` · ${member.age}y` : ""}
          {member.injury ? " · injured" : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {member.rating ? <RatingChip rating={member.rating} /> : null}
        <span className="text-[9px] font-semibold text-dim num">
          {formatMarketValue(member.transferValue)}
        </span>
      </div>
    </Link>
  );
}

export function SquadGrid({ groups }: { groups?: SquadGroup[] }) {
  if (!groups?.length) {
    return <div className="card px-4 py-8 text-center text-sm text-dim">Squad not available.</div>;
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
              <p className="eyebrow mb-2">Head coach</p>
              <div className="max-w-sm">
                <SquadPlayer member={coach} />
              </div>
            </section>
          );
        }
        return (
          <section key={group.title}>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="eyebrow capitalize">{group.title}</p>
              <span className="text-[10px] font-semibold text-dim">
                {group.members.length} players
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
    return <div className="card px-4 py-8 text-center text-sm text-dim">No team stats available.</div>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
            className={`card p-3.5 ${highlighted ? "border-accent/20 bg-accent/[0.03]" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
                {group.header}
              </p>
              {entry?.rank ? (
                <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-dim num">
                  #{entry.rank}
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink num">
              {statDisplay(entry)}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-dim">
              {entry?.teamName ?? entry?.name ?? "—"}
            </p>
          </div>
        );
      })}
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
    return <div className="card px-4 py-8 text-center text-sm text-dim">No trophies recorded.</div>;
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
              <span className="font-display text-xl font-extrabold text-ink num">{trophy.won}</span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink">{trophy.name}</p>
            <p className="mt-1 text-[9px] text-dim">
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
    return <div className="card px-4 py-8 text-center text-sm text-dim">Squad not available.</div>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => (
        <SquadPlayer key={member.id} member={member} />
      ))}
    </div>
  );
}
