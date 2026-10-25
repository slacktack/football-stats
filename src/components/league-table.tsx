import Link from "next/link";
import type { LeagueTableWrapper } from "@/lib/types";
import { Crest, FormPill } from "./ui";

export function LeagueTable({
  wrapper,
  form,
  highlight = [],
  limit,
  showLegend = true,
  className = "",
}: {
  wrapper?: LeagueTableWrapper;
  form?: Record<number, number[]>;
  highlight?: (number | string)[];
  limit?: number;
  showLegend?: boolean;
  className?: string;
}) {
  if (!wrapper?.data?.table?.all?.length) {
    return (
      <div className="card px-4 py-8 text-center text-sm text-dim">Table not available yet.</div>
    );
  }

  const rows = limit ? wrapper.data.table.all.slice(0, limit) : wrapper.data.table.all;
  const legend = wrapper.data.legend ?? [];
  const highlightSet = new Set(highlight.map(String));

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[340px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line/70 text-[10px] font-semibold uppercase tracking-wider text-dim">
              <th className="w-9 py-2.5 pl-3 pr-1 text-center font-semibold">#</th>
              <th className="py-2.5 pr-2 font-semibold">Team</th>
              <th className="w-8 py-2.5 text-center font-semibold">P</th>
              <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">W</th>
              <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">D</th>
              <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">L</th>
              <th className="w-10 py-2.5 text-center font-semibold">GD</th>
              <th className="w-10 py-2.5 text-center font-semibold">Pts</th>
              {form && <th className="hidden w-[132px] py-2.5 pl-2 pr-3 font-semibold lg:table-cell">Form</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isHighlighted = highlightSet.has(String(row.id));
              return (
                <tr
                  key={row.id}
                  className={`group border-b border-line/40 last:border-0 ${
                    isHighlighted ? "bg-accent/[0.055]" : "hover:bg-white/[0.022]"
                  }`}
                >
                  <td className="relative py-2.5 pl-3 pr-1 text-center">
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: row.qualColor ?? "transparent" }}
                    />
                    <span className="text-[11px] font-semibold text-dim num">{row.idx}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <Link
                      href={`/team/${row.id}`}
                      className="flex items-center gap-2.5 text-[13px] font-semibold text-ink transition-colors hover:text-accent"
                    >
                      <Crest id={row.id} name={row.name} size={20} />
                      <span className="truncate">{row.shortName || row.name}</span>
                    </Link>
                  </td>
                  <td className="text-center text-xs text-muted num">{row.played}</td>
                  <td className="hidden text-center text-xs text-muted num sm:table-cell">{row.wins}</td>
                  <td className="hidden text-center text-xs text-muted num sm:table-cell">{row.draws}</td>
                  <td className="hidden text-center text-xs text-muted num sm:table-cell">{row.losses}</td>
                  <td className="text-center text-xs text-muted num">
                    {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                  </td>
                  <td className="text-center text-[13px] font-extrabold text-ink num">{row.pts}</td>
                  {form && (
                    <td className="hidden py-2 pl-2 pr-3 lg:table-cell">
                      <div className="flex gap-1">
                        {(form[row.id] ?? []).slice(0, 5).map((result, resultIndex) => (
                          <FormPill key={`${row.id}-${resultIndex}`} result={result} size={19} />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showLegend && legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line/60 px-3 py-2.5">
          {legend.map((item) => (
            <span key={item.title} className="flex items-center gap-1.5 text-[10px] text-dim">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.title}
            </span>
          ))}
        </div>
      )}
      <span className="sr-only">
        {rows.length} teams. Table sorted by points, then goal difference.
      </span>
    </div>
  );
}

