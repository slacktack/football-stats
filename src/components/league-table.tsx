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
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line/70 text-[11px] font-semibold text-dim">
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
            {rows.map((row) => {
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
                    <span className={`text-xs font-bold num ${isHighlighted ? "text-accent" : "text-dim"}`}>{row.idx}</span>
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
                  <td className="text-center font-display text-[14px] font-black text-ink num">{row.pts}</td>
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
            <span key={item.title} className="flex items-center gap-1.5 text-[11px] text-dim">
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


export type XgRow = {
  id: number;
  name: string;
  shortName?: string;
  played?: number;
  pts?: number;
  xg?: number;
  xgConceded?: number;
  xPoints?: number;
  xPosition?: number;
  idx?: number;
  qualColor?: string;
};

export function XgTable({ rows, highlight = [] }: { rows?: XgRow[]; highlight?: (number | string)[] }) {
  if (!rows?.length) {
    return <div className="card px-4 py-8 text-center text-sm text-dim">xG table not available.</div>;
  }
  const sorted = [...rows].sort((a, b) => (b.xPoints ?? 0) - (a.xPoints ?? 0));
  const highlightSet = new Set(highlight.map(String));
  const maxXg = Math.max(...sorted.map((row) => row.xg ?? 0), 1);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line/70 text-[11px] font-semibold text-dim">
              <th className="w-9 py-2.5 pl-3 pr-1 text-center font-semibold">#</th>
              <th className="py-2.5 pr-2 font-semibold">Team</th>
              <th className="w-24 py-2.5 text-right font-semibold">xG</th>
              <th className="w-12 py-2.5 text-center font-semibold">xGA</th>
              <th className="w-12 py-2.5 text-center font-semibold">xPts</th>
              <th className="w-10 py-2.5 text-center font-semibold">Pts</th>
              <th className="w-14 py-2.5 pr-3 text-center font-semibold" title="Points minus expected points">
                +/-
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => {
              const diff = (row.pts ?? 0) - (row.xPoints ?? 0);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-line/40 last:border-0 ${
                    highlightSet.has(String(row.id)) ? "bg-accent/[0.055]" : "hover:bg-white/[0.022]"
                  }`}
                >
                  <td className="py-2.5 pl-3 pr-1 text-center text-xs font-semibold text-dim num">
                    {index + 1}
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
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-white/[0.06] sm:block">
                        <span
                          className="bar-grow block h-full rounded-full bg-accent/80"
                          style={{ width: `${((row.xg ?? 0) / maxXg) * 100}%` }}
                        />
                      </span>
                      <span className="text-xs font-semibold text-ink num">{(row.xg ?? 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="text-center text-xs text-muted num">{(row.xgConceded ?? 0).toFixed(1)}</td>
                  <td className="text-center text-[13px] font-extrabold text-ink num">
                    {(row.xPoints ?? 0).toFixed(1)}
                  </td>
                  <td className="text-center text-xs text-muted num">{row.pts ?? 0}</td>
                  <td className="pr-3 text-center">
                    <span
                      className={`inline-flex min-w-11 justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold num ${
                        diff >= 0.5
                          ? "bg-accent/15 text-accent"
                          : diff <= -0.5
                            ? "bg-sky/15 text-sky"
                            : "bg-white/[0.05] text-dim"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line/60 px-3 py-2.5 text-[11px] text-dim">
        Sorted by expected points. +/- shows points won above or below xPts.
      </p>
    </div>
  );
}
