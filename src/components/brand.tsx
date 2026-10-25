import Link from "next/link";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M0 0h46l18 18v46H0z" fill="var(--color-accent)" />
      <path d="M13 15h38v10H37v26H27V25H13z" fill="var(--color-on-accent)" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 py-1 pr-2 transition-opacity hover:opacity-90"
      aria-label="Touchline home"
    >
      <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:scale-95" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[18px] font-black leading-none tracking-[-0.01em] text-ink">
            TOUCHLINE<span className="text-accent">.</span>
          </span>
          <span className="mt-1 whitespace-nowrap text-[10px] font-semibold tracking-[0.04em] text-dim">
            Live football, every number
          </span>
        </span>
      )}
    </Link>
  );
}
