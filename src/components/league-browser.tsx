"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { leagueLogo } from "@/lib/assets";
import { ChevronDownIcon } from "./icons";
import { EmptyState } from "./ui";
import { K, TermBar } from "./tl";

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
      <div className="tl-term-out relative mt-6">
        <TermBar
          path="/leagues"
          dim={`${allLeagues.length} competitions indexed`}
        />
        <div className="flex items-center gap-2.5 px-4 py-3">
          <span className="tl-acc shrink-0" aria-hidden="true">
            $
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="find a competition or country..."
            className="h-9 min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-ink outline-none placeholder:text-dim"
            aria-label="Search competitions"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="tl-btn tl-btn-sm shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {search ? (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="tl-head text-[12.5px]">
              {results.length} {results.length === 1 ? "competition" : "competitions"}
            </h2>
            <span className="tl-k tl-k-dim">for “{deferredQuery.trim()}”</span>
          </div>
          {results.length > 0 ? (
            <div className="mt-1 grid gap-x-8 sm:grid-cols-2">
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
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="tl-head text-[12.5px]">Popular</h2>
              <span className="tl-k tl-k-dim">The competitions everyone follows</span>
            </div>
            <div className="mt-1 grid gap-x-8 sm:grid-cols-2">
              {popular.map((league) => (
                <LeagueLink key={league.id} league={league} large />
              ))}
            </div>
          </section>

          {international.length > 0 && (
            <section className="mt-8">
              <h2 className="tl-head text-[12.5px]">International</h2>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {international.map((group) => (
                  <div key={group.ccode} className="card overflow-hidden">
                    <div className="flex items-baseline justify-between border-b border-line px-3 py-2">
                      <h3 className="tl-k">{group.name}</h3>
                      <span className="tl-k tl-k-dim">{group.leagues.length}</span>
                    </div>
                    <div className="px-2 py-1">
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
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="tl-head text-[12.5px]">Browse by country</h2>
              <span className="tl-k tl-k-dim">
                {countries.length} countries · tap to expand
              </span>
            </div>
            <div className="mt-2 grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => {
                const expanded = open.has(country.ccode);
                const visible = expanded ? country.leagues : country.leagues.slice(0, 3);
                return (
                  <div key={country.ccode} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(country.ccode)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-hover"
                      aria-expanded={expanded}
                    >
                      <span className="tl-tag shrink-0 font-bold">{country.ccode}</span>
                      <span className="flex-1 truncate text-[12.5px] font-semibold text-ink">
                        {country.name}
                      </span>
                      <span className="tl-k tl-k-dim shrink-0">{country.leagues.length}</span>
                      <ChevronDownIcon
                        size={14}
                        className={`shrink-0 text-dim transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {visible.length > 0 && (
                      <div className="border-t border-line px-2 py-1">
                        {visible.map((league) => (
                          <LeagueLink key={league.id} league={league} compact />
                        ))}
                        {country.leagues.length > 3 && !expanded && (
                          <button
                            type="button"
                            onClick={() => toggle(country.ccode)}
                            className="tl-k w-full px-2 py-1.5 text-left text-live transition-colors hover:text-accent"
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
  large = false,
}: {
  league: BrowserLeague;
  subtitle?: string;
  compact?: boolean;
  large?: boolean;
}) {
  const px = compact ? 18 : large ? 26 : 22;
  const frame = compact ? "grid-cols-[18px_minmax(0,1fr)_auto]" : large ? "grid-cols-[26px_minmax(0,1fr)_auto]" : "grid-cols-[22px_minmax(0,1fr)_auto]";
  const logo = compact ? "h-[18px] w-[18px]" : large ? "h-[26px] w-[26px]" : "h-[22px] w-[22px]";
  return (
    <Link href={`/league/${league.id}`} className={`tl-tr group ${frame}`}>
      <Image
        src={leagueLogo(league.id)}
        alt=""
        width={px}
        height={px}
        className={`${logo} shrink-0 object-contain`}
      />
      <span className="min-w-0">
        <span
          className={`block truncate text-[12px] font-semibold transition-colors ${
            compact ? "text-muted group-hover:text-ink" : "text-ink group-hover:text-accent"
          }`}
        >
          {league.name}
        </span>
        {subtitle && <span className="tl-k tl-k-dim block truncate">{subtitle}</span>}
      </span>
      <K dim className="shrink-0">
        {league.ccode}
      </K>
    </Link>
  );
}
