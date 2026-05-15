import { Suspense } from "react";
import GeneratePageClient from "./generate-client";

export default function GeneratePage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <GeneratePageClient />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[hsl(var(--background))]">
      <div
        className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"
        aria-hidden
      />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
    </div>
  );
}
