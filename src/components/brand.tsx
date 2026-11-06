import Link from "next/link";
import { Mark } from "./tl";

export function BrandMark({ className = "" }: { className?: string }) {
  return <Mark className={className} />;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="tl-brand shrink-0" aria-label="Touchline console home">
      <Mark />
      {!compact ? (
        <span className="tl-brand-t">
          <b>TOUCHLINE</b>
          <small>Live football console</small>
        </span>
      ) : (
        <span className="tl-brand-t">
          <b>TOUCHLINE</b>
        </span>
      )}
    </Link>
  );
}
