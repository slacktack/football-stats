import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./icons";
import { Chip, Ruler, Wave } from "./tl";
import { teamCrest } from "@/lib/assets";
import { parseRating, ratingTier } from "@/lib/format";

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
      className={`crest-chip inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={teamCrest(id)}
        alt={name}
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className="h-[86%] w-[86%] object-contain"
      />
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return <span className={`tl-led ${className}`} aria-hidden="true" />;
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
    neutral: "plain",
    accent: "mint",
    live: "live",
    danger: "alert",
    success: "mint",
    info: "warn",
  } as const;
  return <Chip tone={tones[tone]} className={className}>{children}</Chip>;
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
    <div className={`tl-panel-h mb-0 ${className}`}>
      <div className="min-w-0">
        <h2 className="tl-k flex items-center gap-2">
          {icon && <span className="text-accent">{icon}</span>}
          <span className="truncate text-[12.5px] font-semibold">
            <Wave text={title} />
          </span>
        </h2>
        {subtitle && <p className="mt-1 text-[11.5px] text-dim">{subtitle}</p>}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="group flex shrink-0 items-center gap-1 text-[10.5px] uppercase tracking-[0.08em] text-dim transition-colors hover:text-accent"
        >
          {action}
          <ChevronRightIcon size={12} className="transition-transform group-hover:translate-x-0.5" />
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
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[30px] font-bold leading-[0.95] text-ink sm:text-[42px]">
          <Wave text={title} />
        </h1>
        <Ruler fill n={44} className="mt-3 max-w-[440px]" />
        {description && <p className="mt-2 max-w-2xl text-[12.5px] text-muted">{description}</p>}
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
    <div className="tl-panel flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <span className="mb-3 text-accent">{icon}</span>}
      <p className="tl-k text-[12.5px] font-semibold">{title}</p>
      {description && <p className="mt-2 max-w-sm text-[11.5px] text-dim">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function FormPill({ result, size = 20, className = "" }: { result?: number; size?: number; className?: string }) {
  const label = result === 1 ? "W" : result === 0 ? "D" : result === -1 ? "L" : "–";
  const tone = result === 1 ? "tl-chip-live" : result === -1 ? "tl-chip-alert" : "";
  return (
    <span
      className={`tl-chip inline-flex shrink-0 items-center justify-center px-0 py-0 text-[10px] font-bold ${tone} ${className}`}
      style={{ width: size, height: size }}
      title={label === "W" ? "Win" : label === "D" ? "Draw" : label === "L" ? "Loss" : "Unknown"}
    >
      {label}
    </span>
  );
}

export function RatingChip({
  rating,
  size = "md",
  star = false,
  className = "",
}: {
  rating?: number | string | null;
  size?: "sm" | "md" | "lg" | "xl";
  star?: boolean;
  className?: string;
}) {
  const value = parseRating(rating);
  if (value === null) return null;
  const sizes = {
    sm: "h-5 min-w-[30px] px-1 text-[11px]",
    md: "h-6 min-w-[36px] px-1.5 text-[12.5px]",
    lg: "h-8 min-w-[44px] px-2 text-[15px]",
    xl: "h-12 min-w-[64px] px-3 text-[22px]",
  } as const;
  return (
    <span
      className={`rating-chip tl-num inline-flex shrink-0 items-center justify-center gap-0.5 leading-none num ${sizes[size]} ${className}`}
      data-tier={ratingTier(value)}
      title={`Rating ${value.toFixed(1)}`}
    >
      {star && <span aria-hidden="true">★</span>}
      {value.toFixed(1)}
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
  const blocks = 14;
  const filled = Math.round((width / 100) * blocks);
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="tl-k tl-k-dim">{label}</span>
        <span className="font-semibold text-ink num">{value}</span>
      </div>
      <span className="tl-ascii mt-1 block" data-tone={tone} aria-hidden="true">
        [<b>{"█".repeat(filled)}</b>
        {"░".repeat(blocks - filled)}]
      </span>
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line overflow-hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <SkeletonBlock className="h-7 w-7" />
          <SkeletonBlock className="h-3.5 w-40" />
          <SkeletonBlock className="ml-auto h-3.5 w-12" />
          <SkeletonBlock className="h-7 w-7" />
          <SkeletonBlock className="h-3.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function DataRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="tl-leader">
      <span className="min-w-0 truncate text-muted">{label}</span>
      <i aria-hidden="true" />
      <span className="shrink-0 text-right font-semibold text-ink num">{value}</span>
    </div>
  );
}
