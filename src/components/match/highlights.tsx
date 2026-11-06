"use client";

import { useState } from "react";
import { Leds } from "../tl";

export function HighlightsPlayer({
  videoId,
  title,
  thumbnail,
  source,
  url,
}: {
  videoId: string;
  title: string;
  thumbnail?: string;
  source?: string;
  url: string;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const host = source?.replace(/^www\./, "") ?? "youtube.com";

  return (
    <section className="card overflow-hidden" aria-label="Match highlights">
      <header className="tl-panel-h mx-3 mt-3 mb-0">
        <span className="tl-k">
          <Leds n={3} /> Highlights
        </span>
        <span className="tl-k tl-k-dim">{playing ? "streaming" : "still · press to play"}</span>
      </header>

      <div className="video-frame tl-frame mx-3 my-3">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play highlights: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            <span className="play-button absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-accent text-on-accent sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <span className="min-w-0">
          <span className="tl-k tl-k-dim">{host}</span>
          <span className="mt-0.5 block truncate text-[12px] font-semibold text-ink">{title}</span>
        </span>
        <a href={url} target="_blank" rel="noreferrer" className="tl-btn tl-btn-sm shrink-0">
          Open on YouTube ↗
        </a>
      </div>
    </section>
  );
}
