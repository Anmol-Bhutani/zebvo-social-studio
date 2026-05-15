"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Zebvo brand mark — a designed crescent monogram, NOT a stock icon.
 *
 * Construction: a solid circle has a second circle subtracted from the
 * upper-right via an SVG mask, leaving a thick crescent. The crescent is
 * painted with the active theme's aurora gradient (--grad-from / via / to)
 * so the mark re-tints automatically when the user switches themes.
 *
 * Why a crescent: it reads as a phase of light — a sliver of brightness
 * against a dark surround — which mirrors what the surrounding UI is
 * doing visually with the animated aurora field. The shape avoids both
 * the rounded-gradient-bubble cliché (every AI tool) and the cliché of a
 * Sparkles / star icon.
 */
type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 22, text: "text-base", gap: "gap-2" },
  md: { mark: 28, text: "text-xl sm:text-2xl", gap: "gap-2.5" },
  lg: { mark: 36, text: "text-2xl sm:text-3xl", gap: "gap-2.5" },
  xl: { mark: 44, text: "text-3xl sm:text-4xl", gap: "gap-3" },
};

interface LogoProps {
  size?: LogoSize;
  withWordmark?: boolean;
  className?: string;
  /** Optional override for the wordmark text (defaults to "Zebvo"). */
  wordmark?: string;
}

export function Logo({
  size = "md",
  withWordmark = true,
  className,
  wordmark = "Zebvo",
}: LogoProps) {
  const id = useId();
  const gradId = `zebvo-grad-${id}`;
  const maskId = `zebvo-mask-${id}`;
  const { mark, text, gap } = SIZE_PX[size];

  return (
    <span className={cn("inline-flex items-center", gap, className)}>
      <BrandMark size={mark} gradId={gradId} maskId={maskId} />
      {withWordmark && (
        <span
          className={cn(
            "font-display font-bold tracking-tight leading-none select-none",
            text,
          )}
        >
          {wordmark}
          <span
            aria-hidden
            className="inline-block align-baseline ml-[1px] text-aurora"
          >
            .
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Mark-only (no wordmark). The crescent draws inside the bounding box
 * with safe padding so it remains a clean circle silhouette at any size.
 */
function BrandMark({
  size,
  gradId,
  maskId,
}: {
  size: number;
  gradId: string;
  maskId: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Zebvo"
      style={{
        filter:
          "drop-shadow(0 4px 14px rgb(var(--grad-shadow-1))) drop-shadow(0 0 8px rgb(var(--grad-shadow-2)))",
      }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="3"
          y1="3"
          x2="29"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--grad-from)" />
          <stop offset="55%" stopColor="var(--grad-via)" />
          <stop offset="100%" stopColor="var(--grad-to)" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="black" />
          <circle cx="16" cy="16" r="13" fill="white" />
          <circle cx="21.5" cy="10.5" r="10.5" fill="black" />
        </mask>
      </defs>
      <rect width="32" height="32" fill={`url(#${gradId})`} mask={`url(#${maskId})`} />
    </svg>
  );
}
