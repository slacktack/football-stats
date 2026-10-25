"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { playerImage } from "@/lib/assets";

type Props = Omit<ImageProps, "src"> & { playerId: string | number };

export function PlayerPhoto({ playerId, alt, className = "", ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <svg
        viewBox="0 0 40 40"
        className={`${className} bg-card-2 text-dim`}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <circle cx="20" cy="15" r="7" fill="currentColor" opacity="0.55" />
        <path d="M5 40c0-9 6.5-14 15-14s15 5 15 14z" fill="currentColor" opacity="0.55" />
      </svg>
    );
  }

  return (
    <Image
      {...rest}
      src={playerImage(playerId)}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
