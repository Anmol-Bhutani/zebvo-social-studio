"use client";

import { Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

/**
 * Each theme has a name, short tagline, and the three signature gradient
 * stops that define its identity. The picker uses these for live swatches
 * so users can preview every theme at a glance before switching.
 */
type ThemeId = "aurora-light" | "aurora-dark" | "sunset" | "forest" | "neon";

const THEMES: {
  id: ThemeId;
  label: string;
  description: string;
  swatch: string;
  vibe: "light" | "dark";
}[] = [
  {
    id: "aurora-light",
    label: "Aurora Light",
    description: "Cool snow + cyan glow",
    swatch: "linear-gradient(135deg,#06b6d4 0%,#6366f1 50%,#c026d3 100%)",
    vibe: "light",
  },
  {
    id: "aurora-dark",
    label: "Aurora Dark",
    description: "Deep midnight + electric aurora",
    swatch: "linear-gradient(135deg,#22d3ee 0%,#6366f1 50%,#d946ef 100%)",
    vibe: "dark",
  },
  {
    id: "sunset",
    label: "Sunset Coast",
    description: "Warm peach + golden hour glow",
    swatch: "linear-gradient(135deg,#fbbf24 0%,#f97316 50%,#ec4899 100%)",
    vibe: "light",
  },
  {
    id: "forest",
    label: "Forest Zen",
    description: "Mossy emerald + mint calm",
    swatch: "linear-gradient(135deg,#34d399 0%,#14b8a6 50%,#84cc16 100%)",
    vibe: "dark",
  },
  {
    id: "neon",
    label: "Cyber Neon",
    description: "Pure black + Tokyo neon punch",
    swatch: "linear-gradient(135deg,#22d3ee 0%,#d946ef 50%,#a855f7 100%)",
    vibe: "dark",
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Choose theme" />;
  }

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[1];

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Choose theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <span
          className="absolute inset-1.5 rounded-full ring-1 ring-[hsl(var(--border))]"
          style={{ background: activeTheme.swatch }}
          aria-hidden
        />
        <Palette className="h-4 w-4 relative z-10 mix-blend-difference text-white" />
      </Button>

      {open && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 top-full mt-2 z-50 w-64 sm:w-72 rounded-2xl glass p-2 shadow-2xl animate-fade-in origin-top-right"
        >
          <div className="px-2.5 py-2">
            <div className="font-display text-sm font-bold tracking-tight">Theme</div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Pick the vibe that fits your mood.
            </div>
          </div>
          <div className="space-y-0.5">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all",
                    active
                      ? "bg-brand-500/15 ring-1 ring-brand-400/40"
                      : "hover:bg-[hsl(var(--muted))]",
                  )}
                >
                  <span
                    className="h-9 w-9 rounded-lg flex-shrink-0 ring-1 ring-black/10 shadow-inner"
                    style={{ background: t.swatch }}
                    aria-hidden
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{t.label}</span>
                    <span className="block text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                      {t.description}
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 text-brand-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
