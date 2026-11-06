"use client";

import { useEffect, useSyncExternalStore } from "react";

const KEY = "touchline-sfx";
const EVENT = "touchline-sfx-change";

type Ctor = new () => AudioContext;

function audioCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

let context: AudioContext | null = null;

function channel(): AudioContext | null {
  const Ctor = audioCtor();
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

/** One short, dry pulse — a relay closing, not a musical note. */
function pulse(freq: number, peak: number, ms: number, type: OscillatorType = "square") {
  const a = channel();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  const end = a.currentTime + ms / 1000;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  gain.gain.setValueAtTime(0.0001, a.currentTime);
  gain.gain.linearRampToValueAtTime(peak, a.currentTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(end + 0.01);
}

function enabled() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getSnapshot(): boolean {
  return enabled();
}

function getServerSnapshot(): boolean {
  return false;
}

export function SfxController() {
  useEffect(() => {
    let on = enabled();
    let last = 0;
    let hovered: Element | null = null;

    function over(event: PointerEvent) {
      if (!on) return;
      const target = (event.target as HTMLElement | null)?.closest("a,button,[role='tab'],summary");
      if (!target || target === hovered) return;
      hovered = target;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      pulse(1180, 0.016, 22, "square");
    }

    function down(event: PointerEvent) {
      if (!on) return;
      if (!(event.target as HTMLElement | null)?.closest("a,button,[role='tab'],summary")) return;
      pulse(318, 0.05, 46, "triangle");
    }

    function sync() {
      on = enabled();
    }

    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener(EVENT, sync);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerdown", down);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  return null;
}

export function SfxToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function flip() {
    const next = !on;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event(EVENT));
    if (next) pulse(840, 0.03, 60, "square");
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={on}
      suppressHydrationWarning
      title={on ? "Mute console feedback" : "Enable console feedback"}
      className={`tl-btn tl-btn-sm ${on ? "tl-btn-inv" : ""} ${className}`}
    >
      <i className="tl-led steady" style={{ opacity: on ? 1 : 0.25 }} aria-hidden="true" />
      SFX
    </button>
  );
}
