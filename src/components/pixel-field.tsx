"use client";

import { useEffect, useRef } from "react";

/* Signal's pixel field: a lattice of hairline cells with two drifting phosphor
   blooms, a ripple where the pointer travels, and a reticle on the live cell.
   Decorative only — aria-hidden, no layout box, paused offscreen. */

type Ripple = { x: number; y: number; t: number };

const seed = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export function PixelField({
  step = 22,
  fps = 30,
  tone,
  className = "",
}: {
  step?: number;
  fps?: number;
  tone?: "alert";
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const ptr = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    const ctx = cv?.getContext("2d");
    if (!cv || !host || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ink = "#111";
    let green = "#2bd94a";
    let teal = "#26b69a";

    // Custom properties inherit, so the canvas sees the active theme's tokens.
    const pull = () => {
      const s = getComputedStyle(cv);
      const pick = (live: string, warn: string) =>
        (tone === "alert" ? s.getPropertyValue(warn) : s.getPropertyValue(live)).trim();
      ink = s.getPropertyValue("--color-ink").trim() || ink;
      green = pick("--tl-led", "--tl-alert") || green;
      teal = pick("--tl-teal", "--tl-amber") || teal;
    };
    pull();

    let w = 0;
    let h = 0;
    let visible = true;
    let last = -1000;

    const draw = (t: number) => {
      const time = reduce ? 6.5 : t / 1000;
      ctx.clearRect(0, 0, w, h);
      if (w < step || h < step) return;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.max(w, h) * 0.62;
      const ax = cx - w * 0.16 + Math.sin(time * 0.5) * w * 0.08;
      const ay = cy - h * 0.12 + Math.cos(time * 0.4) * h * 0.1;
      const bx = cx + w * 0.18 + Math.cos(time * 0.35) * w * 0.09;
      const by = cy + h * 0.14 + Math.sin(time * 0.45) * h * 0.1;
      const s = step * 0.6;
      const live = ripples.current.filter((r) => t - r.t < 1600);
      ripples.current = live;
      const p = ptr.current;

      ctx.lineWidth = 1;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2));
          let wave = 0;
          for (const r of live) {
            const age = (t - r.t) / 1000;
            const band = Math.abs(Math.hypot(x - r.x, y - r.y) - age * 420);
            if (band < 26) wave = Math.max(wave, (1 - band / 26) * (1 - age / 1.6));
          }
          const near = p ? Math.max(0, 1 - Math.hypot(x - p.x, y - p.y) / 90) : 0;
          if (d > 1.15 && wave < 0.05 && near < 0.05) continue;

          const r = seed(Math.round(x / step), Math.round(y / step));
          const flick = Math.sin(time * 2 + r * 40) > 0.6;

          if (wave > 0.05 || near > 0.05) {
            const k = Math.max(wave, near);
            ctx.globalAlpha = 0.25 + k * 0.75;
            ctx.fillStyle = green;
            const z = s * (0.7 + k * 0.45);
            ctx.fillRect(x - z / 2, y - z / 2, z, z);
            continue;
          }

          const ta = Math.max(0, 1 - Math.hypot(x - ax, y - ay) / (R * 0.32));
          const tb = Math.max(0, 1 - Math.hypot(x - bx, y - by) / (R * 0.34));
          if (ta > 0.15 || tb > 0.15) {
            const k = tb > ta ? tb : ta;
            ctx.globalAlpha = 0.4 + k * 0.6;
            ctx.strokeStyle = tb > ta ? green : teal;
            ctx.fillStyle = ctx.strokeStyle as string;
            if (k > 0.5 && flick) ctx.fillRect(x - s / 2, y - s / 2, s, s);
            else ctx.strokeRect(x - s / 2, y - s / 2, s, s);
          } else {
            const a = Math.max(0, 1.15 - d) * 0.3;
            ctx.globalAlpha = Math.min(1, a * (r > 0.85 ? 1.6 : 0.7));
            ctx.strokeStyle = ink;
            if (r > 0.93 && flick) {
              ctx.fillStyle = ink;
              ctx.fillRect(x - s / 2, y - s / 2, s, s);
            } else ctx.strokeRect(x - s / 2, y - s / 2, s, s);
          }
        }
      }

      if (p && !reduce) reticle(ctx, p, step, ink);
      ctx.globalAlpha = 1;
    };

    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    size();

    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(cv);
    const mo = new MutationObserver(pull);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let raf = 0;
    let lx = -999;
    let ly = -999;
    const move = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;
      ptr.current = { x, y };
      if (Math.hypot(x - lx, y - ly) > 70) {
        lx = x;
        ly = y;
        ripples.current.push({ x, y, t: performance.now() });
        if (ripples.current.length > 6) ripples.current.shift();
      }
    };
    const down = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      ripples.current.push({ x: e.clientX - b.left, y: e.clientY - b.top, t: performance.now() });
    };
    const leave = () => {
      ptr.current = null;
    };

    if (!reduce) {
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden || t - last < 1000 / fps - 2) return;
        last = t;
        draw(t);
      };
      raf = requestAnimationFrame(loop);
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerdown", down);
      host.addEventListener("pointerleave", leave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerleave", leave);
    };
  }, [step, fps, tone]);

  return <canvas ref={ref} className={`tl-field ${className}`} aria-hidden="true" />;
}

/* The console cursor: a hairline cross plus four corner ticks, snapped to the
   nearest cell so it registers with the lattice instead of the pixel grid. */
function reticle(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number },
  step: number,
  ink: string,
) {
  const gx = Math.round((p.x - step / 2) / step) * step + step / 2;
  const gy = Math.round((p.y - step / 2) / step) * step + step / 2;
  const cell = step * 0.6;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p.x - 9, p.y);
  ctx.lineTo(p.x + 9, p.y);
  ctx.moveTo(p.x, p.y - 9);
  ctx.lineTo(p.x, p.y + 9);
  ctx.stroke();

  const half = cell / 2 + 3;
  const arm = 5;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(gx + sx * half, gy + sy * half - sy * arm);
      ctx.lineTo(gx + sx * half, gy + sy * half);
      ctx.lineTo(gx + sx * half - sx * arm, gy + sy * half);
      ctx.stroke();
    }
  }
}
