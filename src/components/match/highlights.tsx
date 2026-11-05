"use client";

import { useState } from "react";

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

  return (
    <section className="card overflow-hidden" aria-label="Match highlights">
      <div className="video-frame">
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
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
            <span className="play-button absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_12px_40px_-10px_rgba(0,0,0,0.9)] sm:h-20 sm:w-20">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-left sm:p-5">
              <span className="min-w-0">
                <span className="eyebrow !text-accent">Highlights</span>
                <span className="mt-1 block truncate font-display text-base font-extrabold text-white sm:text-xl">
                  {title}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                {source?.replace(/^www\./, "") ?? "youtube.com"}
              </span>
            </span>
          </button>
        )}
      </div>
      {playing && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-dim">
          <span className="truncate font-semibold text-muted">{title}</span>
          <a href={url} target="_blank" rel="noreferrer" className="shrink-0 font-semibold hover:text-accent">
            Open on YouTube ↗
          </a>
        </div>
      )}
    </section>
  );
}
