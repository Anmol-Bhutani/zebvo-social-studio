import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
  brand: "bg-brand-500/15 text-brand-500 border border-brand-500/30",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
