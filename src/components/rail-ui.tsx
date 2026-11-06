"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ActivityIcon, HomeIcon, SearchIcon, TrophyIcon } from "./icons";
import { Mark } from "./tl";

const RAIL_KEY = "touchline-rail";
const RAIL_EVENT = "touchline-rail-change";

const NAV = [
  { href: "/", code: "00", label: "Matches", Icon: HomeIcon, is: (p: string, live: boolean) => p === "/" && !live },
  { href: "/?filter=live", code: "01", label: "Live", Icon: ActivityIcon, is: (p: string, live: boolean) => p === "/" && live },
  { href: "/leagues", code: "02", label: "Comps", Icon: TrophyIcon, is: (p: string) => p.startsWith("/league") },
  { href: "/search", code: "03", label: "Search", Icon: SearchIcon, is: (p: string) => p.startsWith("/search") },
];

function subscribeRail(callback: () => void) {
  window.addEventListener(RAIL_EVENT, callback);
  return () => window.removeEventListener(RAIL_EVENT, callback);
}

/* The DOM attribute is the source of truth: the pre-hydration script in
   layout.tsx sets it from localStorage before first paint, so reading it
   here (rather than localStorage during render) keeps the server HTML and
   the hydration render identical. */
function getRailSnapshot() {
  return document.documentElement.dataset.rail === "compact";
}

function getRailServerSnapshot() {
  return false;
}

export function CollapseButton() {
  const compact = useSyncExternalStore(subscribeRail, getRailSnapshot, getRailServerSnapshot);

  function flip() {
    const next = !compact;
    const root = document.documentElement;
    if (next) root.dataset.rail = "compact";
    else delete root.dataset.rail;
    try {
      localStorage.setItem(RAIL_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event(RAIL_EVENT));
  }

  return (
    <button
      type="button"
      className="tl-collapse"
      onClick={flip}
      aria-label={compact ? "Expand rail" : "Collapse rail"}
      aria-expanded={!compact}
    >
      <span aria-hidden="true">{compact ? "»" : "«"}</span>
    </button>
  );
}

export function RailBrand() {
  return (
    <Link href="/" className="tl-brand" aria-label="Touchline console home">
      <Mark />
      <span className="tl-brand-t">
        <b>TOUCHLINE</b>
        <small>Scores console</small>
      </span>
    </Link>
  );
}

export function RailNav({ onGo }: { onGo?: () => void }) {
  const pathname = usePathname();
  const live = useSearchParams().get("filter") === "live";
  return (
    <nav aria-label="Primary">
      <p className="tl-rail-k">Navigate</p>
      <ul className="tl-nav">
        {NAV.map(({ href, code, label, Icon, is }) => {
          const active = is(pathname, live);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} onClick={onGo} title={label}>
                <span className="tl-nav-sweep" aria-hidden="true" />
                <span className="tl-nav-i">
                  <Icon size={16} />
                </span>
                <span className="tl-nav-l">{label}</span>
                <span className="tl-nav-c">{code}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function two(value: number) {
  return String(value).padStart(2, "0");
}

export function RailClock({ count }: { count: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const zone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop() : "";

  return (
    <div className="tl-status">
      <div className="tl-status-row">
        <span className="tl-live-k">
          <i className="tl-led" aria-hidden="true" /> Live
        </span>
        <b>{now ? `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}` : "--:--:--"}</b>
      </div>
      <div className="tl-leds" aria-hidden="true">
        {Array.from({ length: Math.max(4, Math.min(count, 10)) }, (_, index) => (
          <i key={index} className="tl-led" style={{ "--d": index } as React.CSSProperties} />
        ))}
      </div>
      <div className="tl-status-row tl-status-dim">
        <span>{zone || "Local"}</span>
        <span>{count} live</span>
      </div>
    </div>
  );
}
