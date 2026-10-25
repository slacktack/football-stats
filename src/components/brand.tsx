import Link from "next/link";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#C8F751" />
      <path
        d="M18 17v30h30"
        fill="none"
        stroke="#06090E"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="41" r="7.5" fill="#06090E" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 transition-opacity hover:opacity-90"
      aria-label="Touchline home"
    >
      <BrandMark className="h-8 w-8 transition-transform duration-300 group-hover:-rotate-3" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-extrabold tracking-[0.12em] text-ink">
            TOUCHLINE
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-dim">
            Live football
          </span>
        </span>
      )}
    </Link>
  );
}
