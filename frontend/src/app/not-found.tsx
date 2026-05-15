import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 safe-x">
      <div className="text-center">
        <div className="font-display text-[8rem] sm:text-[12rem] font-extrabold text-aurora leading-none mb-4">
          404
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          That page wandered off. Let&apos;s get you home.
        </p>
        <Link href="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
