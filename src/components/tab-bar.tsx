"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { pad } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function TabBar({
  tabs,
  active,
  basePath,
  preserve = {},
  className = "",
}: {
  tabs: { value: string; label: string }[];
  active: string;
  basePath: string;
  preserve?: Record<string, string | undefined>;
  className?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      setCanLeft(nav.scrollLeft > 2);
      setCanRight(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2);
    };
    update();
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: -1 | 1) => {
    navRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <nav
        ref={navRef}
        className="no-scrollbar -mb-px flex snap-x gap-1.5 overflow-x-auto pb-1 sm:gap-2"
        aria-label="Page sections"
      >
        {tabs.map((tab, index) => {
          const params = new URLSearchParams();
          params.set("tab", tab.value);
          for (const [key, value] of Object.entries(preserve)) {
            if (value) params.set(key, value);
          }
          const href = `${basePath}?${params.toString()}`;
          const isActive = active === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`tl-tab tl-k shrink-0 snap-start ${isActive ? "tl-tab-on" : ""}`}
            >
              <i className="tl-tab-i" aria-hidden="true" />
              {tab.label}
              <b className="tl-tab-c">{pad(index)}</b>
            </Link>
          );
        })}
      </nav>

      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll tabs left"
          className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-line bg-card text-muted transition-colors hover:border-ink hover:text-ink sm:hidden"
        >
          <ChevronLeftIcon size={13} />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll tabs right"
          className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-line bg-card text-ink transition-colors hover:border-ink hover:text-canvas sm:hidden"
        >
          <ChevronRightIcon size={13} />
        </button>
      )}
    </div>
  );
}
