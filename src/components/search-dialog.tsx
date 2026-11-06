"use client";

import Image from "next/image";
import { PlayerPhoto } from "./player-photo";
import { SafeImage } from "./safe-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchAction } from "@/app/actions";
import type { SearchResult } from "@/lib/types";
import { ChevronRightIcon, CloseIcon, SearchIcon } from "./icons";
import { Leds, TermBar } from "./tl";
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
        className="group hidden h-9 w-[248px] items-center gap-2.5 border border-line bg-card-2/60 px-3 text-left text-[11.5px] text-dim transition-colors hover:border-line-strong md:flex lg:w-[420px]"
        aria-label="Search players, teams and leagues"
      >
        <span className="tl-acc" aria-hidden="true">&gt;</span>
        <span className="flex-1 truncate">Search players, teams, leagues</span>
        <kbd className="border border-line bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-dim">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center border border-line bg-card-2/60 text-muted transition-colors hover:border-line-strong hover:text-ink md:hidden"
        aria-label="Search"
      >
        <SearchIcon size={16} className="text-dim group-hover:text-muted" />
      </button>

      {open && (
        <div
          className="overlay-in fixed inset-0 z-100 flex items-start justify-center bg-[var(--tl-scrim)] px-4 pt-[8vh] sm:pt-[12vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="tl-term-out dialog-in w-full max-w-[640px]"
          >
            <TermBar
              path="/search"
              dim={displayResults.length ? `${displayResults.length} hits` : "live index"}
            />

            <div className="tl-term-cmd">
              <span className="tl-acc shrink-0" aria-hidden="true">
                $
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="team, player, league or match..."
                className="h-9 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-dim"
                aria-label="Search query"
                autoComplete="off"
                spellCheck={false}
              />
              {displayLoading ? (
                <Leds n={5} />
              ) : (
                <>
                  {query.length === 0 && <span className="tl-caret shrink-0" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={close}
                    className="tl-btn tl-btn-sm shrink-0"
                    aria-label="Close search"
                  >
                    <CloseIcon size={13} />
                  </button>
                </>
              )}
            </div>

            <div className="thin-scrollbar max-h-[58vh] overflow-y-auto px-2 pb-2 pt-3">
              {query.trim().length < 2 ? (
                <div className="p-1">
                  <p className="tl-k tl-k-dim mb-2">Popular right now</p>
                  <div className="tl-tags">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        className="tl-chip transition-colors hover:bg-hover"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-6 text-[11.5px] leading-relaxed text-dim">
                    Press{" "}
                    <kbd className="border border-line px-1 font-mono text-[10.5px] text-ink">⌘K</kbd>{" "}
                    anywhere to open this terminal, or{" "}
                    <kbd className="border border-line px-1 font-mono text-[10.5px] text-ink">/</kbd> to
                    jump in.
                  </p>
                </div>
              ) : displayResults.length === 0 && !displayLoading ? (
                <div className="px-4 py-12 text-center">
                  <p className="tl-k">No results for “{query.trim()}”</p>
                  <p className="mt-2 text-[11.5px] text-dim">Try a different spelling or a club name.</p>
                </div>
              ) : (
                <ul>
                  {displayResults.map((result, index) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(result)}
                        className={`tl-tr relative w-full grid-cols-[40px_minmax(0,1fr)_auto] text-left ${
                          active === index ? "bg-hover" : ""
                        }`}
                      >
                        {active === index && (
                          <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden="true" />
                        )}
                        {result.type === "match" ? (
                          <span className="flex w-10 shrink-0 items-center">
                            {result.image && (
                              <Image
                                src={result.image}
                                alt=""
                                width={26}
                                height={26}
                                className="w-[26px]"
                              />
                            )}
                            {result.secondaryImage && (
                              <Image
                                src={result.secondaryImage}
                                alt=""
                                width={26}
                                height={26}
                                className="-ml-2 w-[26px]"
                              />
                            )}
                          </span>
                        ) : result.type === "player" ? (
                          <span className="tl-frame h-9 w-9 shrink-0 overflow-hidden bg-card-2/60">
                            <PlayerPhoto playerId={result.id} alt="" width={36} height={36} className="h-full w-full object-cover object-top" />
                          </span>
                        ) : result.image ? (
                          <SafeImage
                            src={result.image}
                            label={result.name}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 object-contain"
                          />
                        ) : (
                          <Crest id={result.id} name={result.name} size={36} />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-semibold text-ink">
                            {result.name}
                          </span>
                          <span className="tl-k tl-k-dim block truncate">{result.subtitle}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {result.meta && (
                            <span className="text-[11.5px] font-semibold text-muted num">
                              {result.meta}
                            </span>
                          )}
                          <span className="tl-tag hidden sm:inline-block">
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

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              <span className="hidden items-center gap-3 text-[10.5px] uppercase tracking-[0.08em] text-dim sm:flex">
                <span>
                  <kbd className="border border-line px-1 font-mono">↑</kbd>{" "}
                  <kbd className="border border-line px-1 font-mono">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="border border-line px-1 font-mono">↵</kbd> select
                </span>
                <span>
                  <kbd className="border border-line px-1 font-mono">esc</kbd> close
                </span>
              </span>
              {query.trim().length >= 2 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={close}
                  className="tl-chip tl-chip-inv ml-auto"
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
