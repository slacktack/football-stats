"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
        className="no-scrollbar -mb-px flex snap-x gap-5 overflow-x-auto border-b border-line/80 sm:gap-7"
        aria-label="Page sections"
      >
        {tabs.map((tab) => {
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
              className={`group relative shrink-0 snap-start border-b-2 pb-3 pt-3.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${
                isActive
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-[2px] left-0 h-[2px] w-full rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll tabs left"
          className="glass absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line text-muted shadow-md sm:hidden"
        >
          <ChevronLeftIcon size={13} />
        </button>
      )}
      {canRight && (
        <>
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-base to-transparent sm:hidden"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll tabs right"
            className="glass absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line text-ink shadow-md sm:hidden"
          >
            <ChevronRightIcon size={13} />
          </button>
        </>
      )}
    </div>
  );
}
