import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";

/* Touchline / Signal primitives.
   Server-safe by design: every effect here is CSS, not JS. Anything that
   needs a clock or a listener lives in its own client module. */

export function Brackets() {
  return (
    <>
      <i className="tl-br tl" aria-hidden="true" />
      <i className="tl-br tr" aria-hidden="true" />
      <i className="tl-br bl" aria-hidden="true" />
      <i className="tl-br br" aria-hidden="true" />
    </>
  );
}

export function Panel({
  label,
  aside,
  leds = false,
  className = "",
  id,
  children,
}: {
  label?: ReactNode;
  aside?: ReactNode;
  leds?: boolean;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`tl-panel ${className}`}>
      <Brackets />
      {label || aside ? (
        <header className="tl-panel-h">
          {label ? (
            <span className="tl-k flex items-center gap-2">
              {leds ? <Leds n={4} /> : null}
              {label}
            </span>
          ) : (
            <span />
          )}
          {aside ? <span className="tl-k tl-k-dim">{aside}</span> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function K({ children, dim = false, className = "" }: { children: ReactNode; dim?: boolean; className?: string }) {
  return <span className={`tl-k ${dim ? "tl-k-dim" : ""} ${className}`}>{children}</span>;
}

export function Chip({
  children,
  tone = "plain",
  className = "",
}: {
  children: ReactNode;
  tone?: "plain" | "ink" | "live" | "alert" | "warn" | "mint";
  className?: string;
}) {
  const tones = {
    plain: "",
    ink: "tl-chip-inv",
    live: "tl-chip-live",
    alert: "tl-chip-alert",
    warn: "tl-chip-warn",
    mint: "tl-chip-mint",
  } as const;
  return <span className={`tl-chip ${tones[tone]} ${className}`}>{children}</span>;
}

export function Tag({ children, on = false, className = "" }: { children: ReactNode; on?: boolean; className?: string }) {
  return <span className={`tl-tag ${on ? "on" : ""} ${className}`}>{children}</span>;
}

export function Led({ tone, style }: { tone?: "teal" | "amber" | "alert"; style?: CSSProperties }) {
  return <i className="tl-led" data-tone={tone} style={style} aria-hidden="true" />;
}

export function Leds({ n = 6 }: { n?: number }) {
  return (
    <span className="tl-leds" aria-hidden="true">
      {Array.from({ length: n }, (_, index) => (
        <i key={index} className="tl-led" style={{ "--d": index } as CSSProperties} />
      ))}
    </span>
  );
}

export function Phos({ className = "" }: { className?: string }) {
  return (
    <span className={`tl-phos ${className}`} aria-hidden="true">
      <i />
    </span>
  );
}

export function ScanBar() {
  return <div className="tl-scanbar" aria-hidden="true" />;
}

export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`tl-mark ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/** Dotted-leader register row: label ......... value */
export function Leader({ k, v, href }: { k: ReactNode; v: ReactNode; href?: string }) {
  return (
    <div className="tl-leader">
      <span className="min-w-0 truncate">{k}</span>
      <i aria-hidden="true" />
      {href ? (
        <Link href={href} className="tl-acc hover:underline">
          {v}
        </Link>
      ) : (
        <b>{v}</b>
      )}
    </div>
  );
}

const BLOCKS = 16;

/** Block-graph meter. The glyph count is the reading; the number beside it
    carries the value, so nothing here needs a hidden duplicate bar.
    Doto renders the blocks as a dot matrix, which is the whole point. */
export function AsciiBar({
  value,
  total = 100,
  blocks = BLOCKS,
  tone,
  className = "",
}: {
  value: number;
  total?: number;
  blocks?: number;
  tone?: "mint" | "sky" | "alert" | "ink";
  className?: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const filled = Math.round(pct * blocks);
  return (
    <span className={`tl-ascii ${className}`} data-tone={tone} aria-hidden="true">
      [<b>{"█".repeat(filled)}</b>
      {"░".repeat(blocks - filled)}]
    </span>
  );
}

/** Live trace. The shape is real data, not seeded noise — pass a series and
    it draws itself in. The endpoint lamp is HTML because the viewBox is
    stretched by preserveAspectRatio=none and a rect would not stay square. */
export function Spark({
  values,
  tone,
  index = 0,
  className = "",
}: {
  values: number[];
  tone?: "mint" | "sky" | "alert";
  index?: number;
  className?: string;
}) {
  const series = values.filter((v) => Number.isFinite(v));
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const points = series.map(
    (v, i) => [(i / (series.length - 1)) * 100, 26 - ((v - min) / span) * 22] as const,
  );
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const [lastX, lastY] = points[points.length - 1];
  return (
    <span
      className={`tl-spark ${tone ? `tl-spark-${tone}` : ""} ${className}`}
      style={{ "--d": index } as CSSProperties}
      aria-hidden="true"
    >
      <svg className="tl-spark-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
        <path className="tl-spark-a" d={`${line} L100 28 L0 28 Z`} />
        <path
          className="tl-spark-l"
          d={line}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <i className="tl-spark-dot" style={{ left: `${lastX}%`, top: `${(lastY / 28) * 100}%` }} />
    </span>
  );
}

/** Block-graph meter with the numbers printed around it — the stat row. */
export function StatRow({ label, home, away, homeText, awayText }: { label: string; home: number; away: number; homeText?: string; awayText?: string }) {
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const blocks = 12;
  const homeBlocks = Math.round((homePct / 100) * blocks);
  return (
    <div className="grid gap-1.5 py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
        <b className="font-semibold num">{homeText ?? home}</b>
        <span className="tl-k tl-k-dim">{label}</span>
        <b className="font-semibold num">{awayText ?? away}</b>
      </div>
      <div className="flex items-center gap-1" aria-hidden="true">
        <span className="tl-ascii flex-1 text-right">
          <b>{"▓".repeat(homeBlocks)}</b>
          {"░".repeat(blocks - homeBlocks)}
        </span>
        <span className="h-2.5 w-px shrink-0 bg-line" />
        <span className="tl-ascii flex-1">
          {"░".repeat(blocks - homeBlocks)}
          <b>{"▓".repeat(homeBlocks)}</b>
        </span>
      </div>
    </div>
  );
}

export function LogRow({
  minute,
  glyph,
  kind,
  children,
}: {
  minute: ReactNode;
  glyph: ReactNode;
  kind?: "goal" | "card" | "sub" | "miss";
  children: ReactNode;
}) {
  return (
    <li className="tl-log-row" data-kind={kind}>
      <span className="tl-log-min">{minute}</span>
      <span className="tl-log-glyph">{glyph}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function TermBar({ path, dim }: { path: ReactNode; dim?: ReactNode }) {
  return (
    <div className="tl-term-bar">
      <span className="tl-term-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{path}</span>
      {dim ? <span className="tl-k-dim">{dim}</span> : null}
    </div>
  );
}

export function Ruler({ n = 48, fill = false, className = "" }: { n?: number; fill?: boolean; className?: string }) {
  return (
    <div className={`tl-ruler ${fill ? "fill" : ""} ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i % 8 === 0 ? "l" : i % 4 === 0 ? "m" : ""} />
      ))}
    </div>
  );
}

/** Sticky-header scroll position, drawn as a ruler with a phosphor cursor. */
export function Scrub({ ticks = 120 }: { ticks?: number }) {
  return (
    <div className="tl-scrub" aria-hidden="true">
      <div className="tl-ruler">
        {Array.from({ length: ticks }, (_, i) => (
          <i key={i} className={i % 10 === 0 ? "l" : i % 5 === 0 ? "m" : ""} />
        ))}
      </div>
      <span className="tl-scrub-fill" />
      <span className="tl-scrub-head" />
    </div>
  );
}

/** Dot-matrix wave: each character is a pixel that lights in sequence,
    and lights again on hover. Non-string children pass through unsplit. */
export function Wave({ text, className = "", onInk = false }: { text: ReactNode; className?: string; onInk?: boolean }) {
  const shell = `tl-wave ${onInk ? "on-ink" : ""} ${className}`;
  if (typeof text !== "string") {
    return <span className={shell}>{text}</span>;
  }
  const words = text.split(" ");
  let index = 0;
  return (
    <span className={shell}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="tl-word">
          {word.split("").map((char, charIndex) => (
            <span key={charIndex} style={{ "--d": index++ } as CSSProperties}>
              {char}
            </span>
          ))}
          {wordIndex < words.length - 1 ? <span style={{ "--d": index++ } as CSSProperties}> </span> : null}
        </span>
      ))}
    </span>
  );
}
