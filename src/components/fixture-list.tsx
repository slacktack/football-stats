import Image from "next/image";
import Link from "next/link";
import { leagueLogo } from "@/lib/assets";
import { formatKickoff, formatMonthDay, statusLabel, statusTone } from "@/lib/format";
import { scoreFromStatus } from "@/lib/stats";
import type { Fixture, TeamFixture } from "@/lib/types";
import { Crest, LiveDot } from "./ui";

export function FixtureRow({
  fixture,
  showTournament = false,
  highlightTeamId,
}: {
  fixture: Fixture;
  showTournament?: boolean;
  highlightTeamId?: number | string;
}) {
  const finished = Boolean(fixture.status.finished);
  const tone = statusTone(fixture.status);
  const score = scoreFromStatus(fixture.status);
  const homeId = String(fixture.home.id);
  const awayId = String(fixture.away.id);
  const highlighted = (id: string) => highlightTeamId !== undefined && String(highlightTeamId) === id;
  const homeWinner = finished && score ? score[0] > score[1] : false;
  const awayWinner = finished && score ? score[1] > score[0] : false;

  return (
    <Link
      href={`/match/${fixture.id}`}
      className={`group grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 transition-colors hover:bg-white/[0.032] sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-x-3 sm:px-4`}
    >
      <div className="row-span-2 flex flex-col items-start gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-dim">
          {formatMonthDay(fixture.status.utcTime)}
        </span>
        {tone === "live" ? (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-live">
            <LiveDot />
            {statusLabel(fixture.status)}
          </span>
        ) : (
          <span
            className={`text-[11px] font-semibold num ${
              tone === "scheduled" ? "text-muted" : "text-dim"
            }`}
          >
            {tone === "scheduled" ? formatKickoff(fixture.status.utcTime) : statusLabel(fixture.status)}
          </span>
        )}
        {showTournament && fixture.tournament?.name && (
          <span className="hidden max-w-[64px] truncate text-[9px] text-dim lg:block">
            {fixture.tournament.name}
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Crest id={fixture.home.id} name={fixture.home.name} size={20} />
        <span
          className={`min-w-0 flex-1 truncate text-[13px] leading-none ${
            highlighted(homeId)
              ? "font-bold text-accent"
              : homeWinner
                ? "font-bold text-ink"
                : "font-medium text-muted"
          }`}
        >
          {fixture.home.name}
        </span>
      </div>
      <span
        className={`text-right text-[14px] leading-none num ${
          score ? (homeWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "text-transparent"
        }`}
      >
        {score ? score[0] : "0"}
      </span>

      <div className="flex min-w-0 items-center gap-2">
        <Crest id={fixture.away.id} name={fixture.away.name} size={20} />
        <span
          className={`min-w-0 flex-1 truncate text-[13px] leading-none ${
            highlighted(awayId)
              ? "font-bold text-accent"
              : awayWinner
                ? "font-bold text-ink"
                : "font-medium text-muted"
          }`}
        >
          {fixture.away.name}
        </span>
      </div>
      <span
        className={`text-right text-[14px] leading-none num ${
          score ? (awayWinner ? "font-extrabold text-ink" : "font-semibold text-muted") : "text-transparent"
        }`}
      >
        {score ? score[1] : "0"}
      </span>
    </Link>
  );
}

export function FixtureList({
  fixtures,
  highlightTeamId,
}: {
  fixtures?: Fixture[];
  highlightTeamId?: number | string;
}) {
  if (!fixtures?.length) {
    return (
      <div className="card px-4 py-10 text-center text-sm text-dim">
        No fixtures available for this competition.
      </div>
    );
  }

  const groups = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const key =
      fixture.roundName !== undefined && fixture.roundName !== ""
        ? String(fixture.roundName)
        : "Fixtures";
    const list = groups.get(key) ?? [];
    list.push(fixture);
    groups.set(key, list);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([round, list]) => (
        <section key={round} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5 sm:px-4">
            <h3 className="text-xs font-bold text-ink">
              {/^\d+$/.test(round) ? `Matchday ${round}` : round}
            </h3>
            <span className="text-[10px] text-dim">
              {list.length} {list.length === 1 ? "match" : "matches"}
            </span>
          </div>
          <div className="divide-y divide-line/45">
            {list.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} highlightTeamId={highlightTeamId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TeamFixtureList({
  fixtures,
  highlightTeamId,
}: {
  fixtures?: TeamFixture[];
  highlightTeamId?: number | string;
}) {
  if (!fixtures?.length) {
    return (
      <div className="card px-4 py-10 text-center text-sm text-dim">No fixtures available.</div>
    );
  }

  const groups = new Map<string, { leagueId?: number; fixtures: TeamFixture[] }>();
  for (const fixture of fixtures) {
    const key = fixture.tournament?.name ?? "Fixtures";
    const group = groups.get(key) ?? { leagueId: fixture.tournament?.leagueId, fixtures: [] };
    group.fixtures.push(fixture);
    groups.set(key, group);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([name, group]) => (
        <section key={name} className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5 sm:px-4">
            {group.leagueId && (
              <Image
                src={leagueLogo(group.leagueId)}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain"
              />
            )}
            <h3 className="text-xs font-bold text-ink">{name}</h3>
            <Link
              href={group.leagueId ? `/league/${group.leagueId}` : "/leagues"}
              className="ml-auto text-[10px] font-semibold text-dim transition-colors hover:text-accent"
            >
              Table
            </Link>
          </div>
          <div className="divide-y divide-line/45">
            {group.fixtures.map((fixture) => (
              <FixtureRow
                key={fixture.id}
                fixture={fixture}
                highlightTeamId={highlightTeamId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
