import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./icons";
import { teamCrest } from "@/lib/assets";

export function Crest({
  id,
  name,
  size = 32,
  className = "",
  priority = false,
}: {
  id: string | number;
  name: string;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/[0.045] ring-1 ring-inset ring-white/[0.06] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={teamCrest(id)}
        alt={name}
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className="h-[82%] w-[82%] object-contain"
      />
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return <span className={`live-dot inline-block h-1.5 w-1.5 rounded-full bg-live ${className}`} />;
}

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "live" | "danger" | "success" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/[0.055] text-muted ring-white/[0.07]",
    accent: "bg-accent/12 text-accent ring-accent/20",
    live: "bg-live/12 text-live ring-live/25",
    danger: "bg-red-500/12 text-red-400 ring-red-500/20",
    success: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/20",
    info: "bg-sky/12 text-sky ring-sky/20",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
  actionHref,
  icon,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: string;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink md:text-xl">
          {icon && <span className="text-accent">{icon}</span>}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="mt-1 text-xs text-dim md:text-[13px]">{subtitle}</p>}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="group flex shrink-0 items-center gap-0.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          {action}
          <ChevronRightIcon
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-dim ring-1 ring-inset ring-white/[0.06]">
          {icon}
        </div>
      )}
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-dim">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function FormPill({ result, size = 22 }: { result?: number; size?: number }) {
  const label = result === 1 ? "W" : result === 0 ? "D" : result === -1 ? "L" : "–";
  const tone =
    result === 1
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25"
      : result === 0
        ? "bg-white/[0.06] text-muted ring-white/10"
        : result === -1
          ? "bg-red-500/15 text-red-400 ring-red-400/25"
          : "bg-white/[0.04] text-dim ring-white/10";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md text-[10px] font-bold ring-1 ring-inset ${tone}`}
      style={{ width: size, height: size }}
      title={label === "W" ? "Win" : label === "D" ? "Draw" : label === "L" ? "Loss" : "Unknown"}
    >
      {label}
    </span>
  );
}

export function RatingChip({ rating, className = "" }: { rating?: number | string | null; className?: string }) {
  if (rating === undefined || rating === null || rating === "") return null;
  const value = Number(rating);
  const tone = Number.isNaN(value)
    ? "bg-white/[0.06] text-muted"
    : value >= 8
      ? "bg-emerald-500/18 text-emerald-300"
      : value >= 7
        ? "bg-accent/16 text-accent"
        : value >= 6.5
          ? "bg-white/[0.07] text-ink"
          : "bg-orange-500/15 text-orange-300";
  return (
    <span
      className={`inline-flex h-6 min-w-8 items-center justify-center rounded-md px-1.5 text-[11px] font-bold num ${tone} ${className}`}
    >
      {Number.isNaN(value) ? rating : value.toFixed(1)}
    </span>
  );
}

export function StatBar({
  label,
  value,
  max = 100,
  tone = "accent",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "accent" | "sky" | "mint";
}) {
  const width = Math.max(2, Math.min(100, (value / max) * 100));
  const colors = { accent: "bg-accent", sky: "bg-sky", mint: "bg-mint" } as const;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink num">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line/70 overflow-hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="h-3.5 w-40" />
          <SkeletonBlock className="ml-auto h-3.5 w-12" />
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="h-3.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function DataRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-dim">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
