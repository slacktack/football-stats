"use client";

import { useEffect, useRef } from "react";

// Canvas dot field that spells `text`; letter dots ride a wave and swell toward the pointer.
export function DotMatrix({ text = "touchline", className = "", gap = 9 }: { text?: string; className?: string; gap?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
    let mask = new Uint8Array(0);
    const mouse = { x: -9999, y: -9999 };

    const css = () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      return { on: dark ? "#2bd94a" : "#12a144", off: dark ? "rgba(233,229,225,.14)" : "rgba(17,17,17,.12)" };
    };
    let colors = css();

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      cols = Math.floor(w / gap); rows = Math.floor(h / gap);
      // Hidden or collapsed: nothing to sample yet; ResizeObserver rebuilds once visible.
      if (cols < 1 || rows < 1) { mask = new Uint8Array(0); cols = rows = 0; return; }
      const off = document.createElement("canvas");
      off.width = cols; off.height = rows;
      const o = off.getContext("2d")!;
      // A heavy grotesk reads far better as dots than the body's mono.
      const face = `"Helvetica Neue", "Arial Black", Arial, sans-serif`;
      let size = rows * 0.95;
      o.font = `800 ${size}px ${face}`;
      const tw = o.measureText(text).width;
      if (tw > cols * 0.94) size *= (cols * 0.94) / tw;
      o.font = `800 ${size}px ${face}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillText(text, cols / 2, rows / 2 + size * 0.04);
      const data = o.getImageData(0, 0, cols, rows).data;
      mask = new Uint8Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const ox = (w - cols * gap) / 2 + gap / 2;
      const oy = (h - rows * gap) / 2 + gap / 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = ox + x * gap, py = oy + y * gap;
          const on = mask[y * cols + x] === 1;
          const wave = reduce ? 0.5 : (Math.sin(x * 0.22 - t * 0.0022 + y * 0.08) + 1) / 2;
          const near = Math.max(0, 1 - Math.hypot(px - mouse.x, py - mouse.y) / 120);
          let r = on ? gap * (0.3 + wave * 0.14) : gap * 0.09;
          r += near * gap * (on ? 0.14 : 0.18);
          ctx.globalAlpha = on ? 0.75 + wave * 0.25 : 0.55 + near * 0.45;
          ctx.fillStyle = on || near > 0.35 ? colors.on : colors.off;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const paint = () => { cancelAnimationFrame(raf); draw(performance.now()); };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      if (reduce) draw(0);
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    // Paint immediately on every rebuild so a throttled rAF (battery saver, background tab) never leaves it blank.
    const ro = new ResizeObserver(() => { build(); paint(); });
    const mo = new MutationObserver(() => { colors = css(); if (reduce) draw(0); });

    ro.observe(canvas);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    document.fonts?.ready.then(() => { build(); paint(); });
    build();
    paint();
    if (!reduce) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [text, gap]);

  return <canvas ref={ref} aria-hidden="true" className={`absolute inset-0 block h-full w-full ${className}`} />;
}
