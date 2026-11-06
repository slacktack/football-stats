import { PlayerPhoto } from "@/components/player-photo";
import Link from "next/link";
import type { StatEntry, StatLeaderGroup } from "@/lib/types";
import { Crest, RatingChip } from "./ui";
import { AsciiBar } from "./tl";

/* Register of season leaders. The row's padding is a coordinate: the share bar
   behind the text is pinned to inset-y-0 left-0, so px-3 py-2.5 stays put. */

function StatRow({
  entry,
  index,
  highlightTeamId,
  isRating,
  max,
}: {
  entry: StatEntry;
  index: number;
  highlightTeamId?: number | string;
  isRating: boolean;
  max: number;
}) {
  const numeric = Number(entry.value);
  const share = max > 0 && Number.isFinite(numeric) ? Math.max(4, (numeric / max) * 100) : 0;
  const isTeamStat = !entry.id || entry.id === 0;
  const isHighlighted =
    highlightTeamId !== undefined && entry.teamId !== undefined
      ? String(entry.teamId) === String(highlightTeamId)
      : false;

  return (
    <div
      className={`relative flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-hover ${
        isHighlighted ? "bg-accent/10" : ""
      }`}
    >
      {!isRating && share > 0 && (
        <span
          className={`bar-grow absolute inset-y-0 left-0 ${index === 0 ? "bg-accent/10" : "bg-card-2/60"}`}
          style={{ width: `${share}%` }}
          aria-hidden="true"
        />
      )}
      <span
        className={`relative w-5 shrink-0 text-center tl-num text-[13px] ${
          index === 0 ? "text-accent" : "text-dim"
        }`}
      >
        {entry.rank ?? index + 1}
      </span>
      {isTeamStat && entry.teamId ? (
        <Crest id={entry.teamId} name={entry.name} size={26} className="relative" />
      ) : (
        <span className="tl-frame relative flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden bg-card-2/60">
          <PlayerPhoto
            playerId={entry.id}
            alt=""
            width={26}
            height={26}
            className="h-full w-full scale-110 object-cover object-top"
          />
        </span>
      )}
      <div className="relative min-w-0 flex-1">
        {isTeamStat ? (
          <Link
            href={`/team/${entry.teamId}`}
            className="block truncate text-[11.5px] font-semibold text-ink transition-colors hover:text-accent"
          >
            {entry.name}
          </Link>
        ) : (
          <Link
            href={`/player/${entry.id}`}
            className="block truncate text-[11.5px] font-semibold text-ink transition-colors hover:text-accent"
          >
            {entry.name}
          </Link>
        )}
        {entry.teamName && !isTeamStat && (
          <span className="tl-k tl-k-dim block truncate">{entry.teamName}</span>
        )}
      </div>
      {isRating ? (
        <RatingChip rating={entry.value} className="relative" />
      ) : (
        <span className="relative flex shrink-0 items-baseline gap-2">
          {!isTeamStat && share > 0 ? (
            <AsciiBar value={numeric} total={max} blocks={8} className="text-[9.5px]" />
          ) : null}
          <span
            className={`num tl-num ${index === 0 ? "text-[17px] text-accent" : "text-[15px] text-ink"}`}
          >
            {entry.value}
          </span>
        </span>
      )}
    </div>
  );
}

export function StatLeaders({
  groups,
  limit = 3,
  highlightTeamId,
  className = "",
}: {
  groups?: StatLeaderGroup[];
  limit?: number;
  highlightTeamId?: number | string;
  className?: string;
}) {
  const visible = (groups ?? []).slice(0, limit).filter((group) => (group.topThree?.length ?? 0) > 0);
  if (visible.length === 0) {
    return (
      <div className="card px-4 py-8 text-center text-[12.5px] text-dim">Stat leaders not available.</div>
    );
  }

  return (
    <div className={`stagger grid gap-3 ${visible.length > 1 ? "sm:grid-cols-2" : ""} ${className}`}>
      {visible.map((group) => {
        const isRating = /rating/i.test(group.header);
        const max = Math.max(0, ...(group.topThree ?? []).map((entry) => Number(entry.value) || 0));
        return (
        <section key={group.header} className="card overflow-hidden">
          <div className="tl-head">
            <h3 className="tl-k">{group.header}</h3>
          </div>
          <div className="divide-y divide-line">
            {(group.topThree ?? []).map((entry, index) => (
              <StatRow
                key={`${entry.id}-${entry.teamId}-${index}`}
                entry={entry}
                index={index}
                highlightTeamId={highlightTeamId}
                isRating={isRating}
                max={max}
              />
            ))}
          </div>
        </section>
        );
      })}
    </div>
  );
}
