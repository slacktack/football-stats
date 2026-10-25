import Link from "next/link";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#D42A1E" />
      <path
        d="M18 17v30h30"
        fill="none"
        stroke="#FFF4E8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="41" r="7.5" fill="#FFF4E8" />
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
      <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-3" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-black leading-none tracking-[0.12em] text-ink">
            TOUCHLINE<span className="text-accent">.</span>
          </span>
          <span className="mt-1 text-[7px] font-bold uppercase tracking-[0.26em] text-dim">
            Live football intelligence
          </span>
        </span>
      )}
    </Link>
  );
}
