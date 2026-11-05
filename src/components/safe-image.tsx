"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export function SafeImage({ alt, label, className = "", ...rest }: ImageProps & { label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
    return (
      <span
        className={`${className} inline-flex items-center justify-center bg-card-2 font-display text-sm font-extrabold text-muted`}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }
  return <Image {...rest} alt={alt} className={className} onError={() => setFailed(true)} />;
}
