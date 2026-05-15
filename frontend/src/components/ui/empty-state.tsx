import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-dashed border-[hsl(var(--border))]",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-brand-500" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
