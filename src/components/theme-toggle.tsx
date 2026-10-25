"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "touchline-theme";
type Theme = "dark" | "light";

const THEME_EVENT = "touchline-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative flex h-9 w-[62px] shrink-0 items-center rounded-full border border-line bg-card-2/70 p-1 transition-colors hover:border-accent/40 ${className}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`absolute top-1 h-7 w-7 rounded-full bg-accent shadow-[0_4px_14px_-4px_rgba(240,42,24,0.55)] transition-transform duration-300 ${
          theme === "dark" ? "translate-x-[26px]" : "translate-x-0"
        }`}
        aria-hidden="true"
      />
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center transition-colors ${
          theme === "light" ? "text-on-accent" : "text-dim"
        }`}
      >
        <SunIcon size={15} />
      </span>
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center transition-colors ${
          theme === "dark" ? "text-on-accent" : "text-dim"
        }`}
      >
        <MoonIcon size={14} />
      </span>
    </button>
  );
}
