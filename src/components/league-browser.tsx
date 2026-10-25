"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { leagueLogo } from "@/lib/assets";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from "./icons";
import { EmptyState } from "./ui";

export type BrowserLeague = { id: number; name: string; ccode: string };
export type BrowserGroup = { ccode: string; name: string; leagues: BrowserLeague[] };

export function LeagueBrowser({
  popular,
  international,
  countries,
}: {
  popular: BrowserLeague[];
  international: BrowserGroup[];
  countries: BrowserGroup[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const deferredQuery = useDeferredValue(query);
  const search = deferredQuery.trim().toLowerCase();

  const allLeagues = useMemo(() => {
    const seen = new Set<number>();
    const list: (BrowserLeague & { country: string })[] = [];
    for (const group of [...international, ...countries]) {
      for (const league of group.leagues) {
        if (seen.has(league.id)) continue;
        seen.add(league.id);
        list.push({ ...league, country: group.name });
      }
    }
    return list;
  }, [international, countries]);

  const results = useMemo(() => {
    if (!search) return [];
    return allLeagues
      .filter(
        (league) =>
          league.name.toLowerCase().includes(search) ||
          league.country.toLowerCase().includes(search) ||
          league.ccode.toLowerCase().includes(search),
      )
      .slice(0, 80);
  }, [allLeagues, search]);

  function toggle(ccode: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(ccode)) next.delete(ccode);
      else next.add(ccode);
      return next;
    });
  }

  return (
    <div>
      <div className="relative mt-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a competition or country..."
          className="h-12 w-full rounded-xl border border-line bg-card pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-dim focus:border-accent/40"
          aria-label="Search competitions"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      {search ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">
              {results.length} {results.length === 1 ? "competition" : "competitions"}
            </h2>
            <span className="text-[11px] text-dim">for “{deferredQuery.trim()}”</span>
          </div>
          {results.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((league) => (
                <LeagueLink key={league.id} league={league} subtitle={league.country} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No competitions found"
                description="Try a country name, league name or three-letter code."
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-xl font-bold text-ink">Popular</h2>
              <span className="text-[11px] text-dim">The competitions everyone follows</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((league) => (
                <Link
                  key={league.id}
                  href={`/league/${league.id}`}
                  className="card card-hover group flex items-center gap-3 p-3.5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] ring-1 ring-inset ring-white/[0.06]">
                    <Image
                      src={leagueLogo(league.id)}
                      alt=""
                      width={30}
                      height={30}
                      className="h-7 w-7 object-contain"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink transition-colors group-hover:text-accent">
                      {league.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-dim">
                      {league.ccode}
                    </span>
                  </span>
                  <ChevronRightIcon
                    size={16}
                    className="text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Link>
              ))}
            </div>
          </section>

          {international.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">International</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {international.map((group) => (
                  <div key={group.ccode} className="card p-3.5">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <h3 className="text-xs font-bold text-ink">{group.name}</h3>
                      <span className="text-[10px] text-dim">{group.leagues.length}</span>
                    </div>
                    <div className="grid gap-0.5">
                      {group.leagues.map((league) => (
                        <LeagueLink key={league.id} league={league} compact />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-xl font-bold text-ink">Browse by country</h2>
              <span className="text-[11px] text-dim">
                {countries.length} countries · tap to expand
              </span>
            </div>
            <div className="mt-3 grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => {
                const expanded = open.has(country.ccode);
                const visible = expanded ? country.leagues : country.leagues.slice(0, 3);
                return (
                  <div key={country.ccode} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(country.ccode)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
                      aria-expanded={expanded}
                    >
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-white/[0.05] px-1 text-[10px] font-bold tracking-wider text-muted">
                        {country.ccode}
                      </span>
                      <span className="flex-1 truncate text-xs font-bold text-ink">
                        {country.name}
                      </span>
                      <span className="text-[10px] text-dim">{country.leagues.length}</span>
                      <ChevronDownIcon
                        size={14}
                        className={`text-dim transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {visible.length > 0 && (
                      <div className="border-t border-line/50 px-2 py-1.5">
                        {visible.map((league) => (
                          <LeagueLink key={league.id} league={league} compact />
                        ))}
                        {country.leagues.length > 3 && !expanded && (
                          <button
                            type="button"
                            onClick={() => toggle(country.ccode)}
                            className="w-full px-2 py-1.5 text-left text-[10px] font-semibold text-accent/80 transition-colors hover:text-accent"
                          >
                            +{country.leagues.length - 3} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LeagueLink({
  league,
  subtitle,
  compact = false,
}: {
  league: BrowserLeague;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/league/${league.id}`}
      className={`group flex items-center gap-2.5 rounded-lg transition-colors hover:bg-white/[0.04] ${
        compact ? "px-2 py-1.5" : "card card-hover px-3.5 py-3"
      }`}
    >
      <Image
        src={leagueLogo(league.id)}
        alt=""
        width={compact ? 18 : 24}
        height={compact ? 18 : 24}
        className={`${compact ? "h-[18px] w-[18px]" : "h-6 w-6"} shrink-0 object-contain`}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-muted transition-colors group-hover:text-ink">
          {league.name}
        </span>
        {subtitle && <span className="block truncate text-[10px] text-dim">{subtitle}</span>}
      </span>
      {!compact && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-dim">{league.ccode}</span>
      )}
    </Link>
  );
}
