"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchAction } from "@/app/actions";
import type { SearchResult } from "@/lib/types";
import { ChevronRightIcon, CloseIcon, SearchIcon } from "./icons";
import { Crest } from "./ui";

const QUICK_LINKS = [
  { label: "Premier League", href: "/league/47" },
  { label: "Champions League", href: "/league/42" },
  { label: "LaLiga", href: "/league/87" },
  { label: "Arsenal", href: "/team/9825" },
  { label: "Real Madrid", href: "/team/8633" },
  { label: "Barcelona", href: "/team/8634" },
];

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  team: "Team",
  player: "Player",
  league: "League",
  match: "Match",
};

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    const currentRequest = ++requestId.current;
    if (trimmed.length < 2) return;

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const next = await searchAction(trimmed);
        if (requestId.current === currentRequest) {
          setResults(next);
        }
      } catch {
        if (requestId.current === currentRequest) setResults([]);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query, open]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  const trimmedQuery = query.trim();
  const displayResults = trimmedQuery.length >= 2 ? results : [];
  const displayLoading = trimmedQuery.length >= 2 && loading;

  function go(result: SearchResult) {
    close();
    router.push(result.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(displayResults.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (displayResults[active]) {
        go(displayResults[active]);
      } else if (query.trim().length >= 2) {
        close();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden h-10 w-[248px] items-center gap-2.5 rounded-xl border border-line bg-white/[0.035] px-3 text-left text-[13px] text-dim transition-colors hover:border-white/15 hover:bg-white/[0.055] md:flex xl:w-[300px]"
        aria-label="Search players, teams and leagues"
      >
        <SearchIcon size={16} className="text-dim group-hover:text-muted" />
        <span className="flex-1 truncate">Search players, teams, leagues</span>
        <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-dim">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.035] text-muted transition-colors hover:text-ink md:hidden"
        aria-label="Search"
      >
        <SearchIcon size={18} />
      </button>

      {open && (
        <div
          className="overlay-in fixed inset-0 z-100 flex items-start justify-center bg-black/72 px-4 pt-[8vh] backdrop-blur-md sm:pt-[12vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="dialog-in w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-card shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <SearchIcon size={19} className="shrink-0 text-dim" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search for a team, player, league or match..."
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-dim"
                aria-label="Search query"
                autoComplete="off"
                spellCheck={false}
              />
              {displayLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
              ) : (
                <button
                  type="button"
                  onClick={close}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-dim transition-colors hover:bg-white/5 hover:text-ink"
                  aria-label="Close search"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>

            <div className="max-h-[58vh] overflow-y-auto thin-scrollbar p-2">
              {query.trim().length < 2 ? (
                <div className="p-2">
                  <p className="eyebrow px-1 pb-2">Popular right now</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        className="rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-6 px-1 text-[11px] text-dim">
                    Tip: press{" "}
                    <kbd className="rounded border border-white/10 px-1 font-mono text-[10px]">⌘K</kbd>{" "}
                    anywhere to search, or{" "}
                    <kbd className="rounded border border-white/10 px-1 font-mono text-[10px]">/</kbd> to
                    jump in.
                  </p>
                </div>
              ) : displayResults.length === 0 && !displayLoading ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-ink">No results for “{query.trim()}”</p>
                  <p className="mt-1 text-xs text-dim">Try a different spelling or a club name.</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {displayResults.map((result, index) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(result)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active === index ? "bg-white/[0.07]" : "hover:bg-white/[0.045]"
                        }`}
                      >
                        {result.type === "match" ? (
                          <span className="flex w-9 shrink-0 items-center">
                            {result.image && (
                              <Image
                                src={result.image}
                                alt=""
                                width={26}
                                height={26}
                                className="drop-shadow"
                              />
                            )}
                            {result.secondaryImage && (
                              <Image
                                src={result.secondaryImage}
                                alt=""
                                width={26}
                                height={26}
                                className="-ml-2.5 drop-shadow"
                              />
                            )}
                          </span>
                        ) : result.image ? (
                          <Image
                            src={result.image}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-full object-contain"
                          />
                        ) : (
                          <Crest id={result.id} name={result.name} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {result.name}
                          </span>
                          <span className="block truncate text-[11px] text-dim">
                            {result.subtitle}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {result.meta && (
                            <span className="text-[11px] font-semibold text-muted num">
                              {result.meta}
                            </span>
                          )}
                          <span className="hidden rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-dim sm:inline">
                            {TYPE_LABEL[result.type]}
                          </span>
                          <ChevronRightIcon size={14} className="text-dim" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
              <span className="hidden items-center gap-3 text-[10px] text-dim sm:flex">
                <span>
                  <kbd className="rounded border border-white/10 px-1 font-mono">↑</kbd>{" "}
                  <kbd className="rounded border border-white/10 px-1 font-mono">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded border border-white/10 px-1 font-mono">↵</kbd> select
                </span>
              </span>
              {query.trim().length >= 2 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={close}
                  className="ml-auto text-[11px] font-semibold text-accent hover:underline"
                >
                  See all results
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
