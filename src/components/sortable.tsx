import type { ReactNode } from "react";

export type Dir = "asc" | "desc";
export type Sort<K extends string = string> = { key: K; dir: Dir };

/** One sort control per register column: click to choose, click again to flip.
   Lives inside a real <th> so the table keeps its table semantics. */
export function SortHeader<K extends string>({
  label,
  title,
  col,
  sort,
  onSort,
  className = "text-center",
}: {
  label: ReactNode;
  title: string;
  col: K;
  sort: Sort<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === col;
  return (
    <th
      scope="col"
      className={`tl-th px-1.5 pb-1 pt-0 align-bottom font-semibold ${className}`}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        title={`Sort by ${title}`}
        className={`press inline-flex items-center gap-1 border-b border-transparent pb-0.5 transition-colors ${
          active ? "border-accent text-accent" : "text-dim hover:border-ink/40 hover:text-ink"
        }`}
      >
        {label}
        <span className="tl-num w-2 text-[9px] leading-none" aria-hidden="true">
          {active ? (sort.dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}

/** Click the same column to reverse, a new column to start from the top. */
export function nextSort<K extends string>(current: Sort<K>, key: K, ascKeys: K[] = []): Sort<K> {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key, dir: ascKeys.includes(key) ? "asc" : "desc" };
}
