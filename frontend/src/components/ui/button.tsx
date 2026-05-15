"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  /**
   * Primary CTA — three-stop gradient driven by the active theme's
   * --grad-from/via/to tokens, with a matching colored glow via
   * --grad-shadow-1 / --grad-shadow-2. Re-tints automatically for
   * every theme (Aurora, Sunset, Forest, Neon).
   */
  primary:
    "text-white bg-[linear-gradient(110deg,var(--grad-from)_0%,var(--grad-via)_45%,var(--grad-to)_100%)] hover:brightness-110 shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_10px_28px_-10px_rgb(var(--grad-shadow-1)),0_0_28px_-4px_rgb(var(--grad-shadow-2))]",
  secondary:
    "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] border border-transparent hover:border-[hsl(var(--border))]",
  ghost: "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
  outline:
    "border border-[hsl(var(--border))] hover:border-brand-400/60 hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500 shadow-[0_8px_24px_-12px_rgba(244,63,94,0.5)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
