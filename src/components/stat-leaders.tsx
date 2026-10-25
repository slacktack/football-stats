import Image from "next/image";
import Link from "next/link";
import { playerImage } from "@/lib/assets";
import type { StatEntry, StatLeaderGroup } from "@/lib/types";
import { Crest } from "./ui";

function StatRow({
  entry,
  index,
  highlightTeamId,
}: {
  entry: StatEntry;
  index: number;
  highlightTeamId?: number | string;
}) {
  const isTeamStat = !entry.id || entry.id === 0;
  const isHighlighted =
    highlightTeamId !== undefined && entry.teamId !== undefined
      ? String(entry.teamId) === String(highlightTeamId)
      : false;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 ${
        isHighlighted ? "bg-accent/[0.055]" : ""
      }`}
    >
      <span
        className={`w-5 shrink-0 text-center text-[11px] font-bold num ${
          index === 0 ? "text-accent" : "text-dim"
        }`}
      >
        {entry.rank ?? index + 1}
      </span>
      {isTeamStat && entry.teamId ? (
        <Crest id={entry.teamId} name={entry.name} size={26} />
      ) : (
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.045] ring-1 ring-inset ring-white/[0.06]">
          <Image
            src={playerImage(entry.id)}
            alt=""
            width={26}
            height={26}
            className="h-full w-full scale-110 object-cover object-top"
          />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {isTeamStat ? (
          <Link
            href={`/team/${entry.teamId}`}
            className="block truncate text-xs font-semibold text-ink transition-colors hover:text-accent"
          >
            {entry.name}
          </Link>
        ) : (
          <Link
            href={`/player/${entry.id}`}
            className="block truncate text-xs font-semibold text-ink transition-colors hover:text-accent"
          >
            {entry.name}
          </Link>
        )}
        {entry.teamName && !isTeamStat && (
          <span className="block truncate text-[10px] text-dim">{entry.teamName}</span>
        )}
      </div>
      <span className="shrink-0 text-sm font-extrabold text-ink num">{entry.value}</span>
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
      <div className="card px-4 py-8 text-center text-sm text-dim">Stat leaders not available.</div>
    );
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {visible.map((group) => (
        <section key={group.header} className="card overflow-hidden">
          <div className="border-b border-line/60 bg-white/[0.014] px-3 py-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {group.localizedTitleId ? group.header : group.header}
            </h3>
          </div>
          <div className="divide-y divide-line/35">
            {(group.topThree ?? []).map((entry, index) => (
              <StatRow
                key={`${entry.id}-${entry.teamId}-${index}`}
                entry={entry}
                index={index}
                highlightTeamId={highlightTeamId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
