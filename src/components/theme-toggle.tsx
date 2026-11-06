"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "touchline-theme";
const THEME_EVENT = "touchline-theme-change";

type Theme = "dark" | "light";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  function setMode(mode: Theme) {
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.style.setProperty("color-scheme", mode);
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div className={`tl-switch ${className}`} data-on={theme === "dark"}>
      <span className="tl-switch-knob" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => setMode("light")}
        title="Paper console"
      >
        <SunIcon size={12} />
        <span className="tl-switch-t">Paper</span>
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => setMode("dark")}
        title="Night console"
      >
        <MoonIcon size={12} />
        <span className="tl-switch-t">Night</span>
      </button>
    </div>
  );
}
