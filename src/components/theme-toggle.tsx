"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDownIcon, MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "touchline-theme";
const ACCENT_KEY = "touchline-accent";
const THEME_EVENT = "touchline-theme-change";

type Theme = "dark" | "light";
type Accent = "neon" | "gold" | "ocean" | "violet";

const ACCENTS: { id: Accent; label: string; light: string; dark: string }[] = [
  { id: "neon", label: "Neon", light: "#1ee85c", dark: "#39ff6b" },
  { id: "gold", label: "Gold", light: "#f2b81c", dark: "#f5c542" },
  { id: "ocean", label: "Ocean", light: "#38bdf8", dark: "#4cc9ff" },
  { id: "violet", label: "Violet", light: "#a78bfa", dark: "#b79cff" },
]

const ACCENT_IDS = new Set<Accent>(ACCENTS.map((accent) => accent.id));

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getAccentSnapshot(): Accent {
  if (typeof document === "undefined") return "neon";
  const value = document.documentElement.dataset.accent as Accent | undefined;
  return value && ACCENT_IDS.has(value) ? value : "neon";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function getServerAccent(): Accent {
  return "neon";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);
  const accent = useSyncExternalStore(subscribe, getAccentSnapshot, getServerAccent);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function setMode(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.setProperty("color-scheme", next);
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function setAccent(next: Accent) {
    document.documentElement.setAttribute("data-accent", next);
    localStorage.setItem(ACCENT_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const activeAccent = ACCENTS.find((item) => item.id === accent) ?? ACCENTS[0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-card-2/70 pl-2.5 pr-1.5 text-muted transition-colors hover:border-accent/40 hover:text-ink"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance settings"
        title="Appearance settings"
      >
        {theme === "light" ? <SunIcon size={15} /> : <MoonIcon size={14} />}
        <span
          className="h-2.5 w-2.5 rounded-full ring-2 ring-white/15"
          style={{ backgroundColor: theme === "light" ? activeAccent.light : activeAccent.dark }}
          aria-hidden="true"
        />
        <ChevronDownIcon size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[262px] rounded-2xl border border-line bg-card p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">Appearance</p>
            <span className="text-[10px] font-semibold text-dim">Saved locally</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-[11px] font-bold capitalize transition-colors ${
                  theme === mode
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line/70 bg-card-2/50 text-muted hover:border-accent/30 hover:text-ink"
                }`}
              >
                {mode === "light" ? <SunIcon size={14} /> : <MoonIcon size={13} />}
                {mode}
              </button>
            ))}
          </div>

          <p className="mt-3 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
            Accent
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {ACCENTS.map((item) => {
              const active = accent === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAccent(item.id)}
                  aria-pressed={active}
                  className={`flex h-9 items-center gap-2 rounded-lg border px-2 text-[11px] font-semibold transition-colors ${
                    active
                      ? "border-accent/60 bg-accent/[0.09] text-ink"
                      : "border-line/70 bg-card-2/50 text-muted hover:border-accent/30 hover:text-ink"
                  }`}
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full ${active ? "ring-2 ring-accent/35 ring-offset-1 ring-offset-card" : ""}`}
                    style={{ backgroundColor: theme === "light" ? item.light : item.dark }}
                    aria-hidden="true"
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
