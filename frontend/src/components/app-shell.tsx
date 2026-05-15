"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  FileText,
  Calendar,
  BookTemplate,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { useActiveWorkspace } from "@/store/workspace";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Workspace {
  id: string;
  name: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspaces", label: "Workspaces", icon: Briefcase },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/library", label: "Library", icon: FileText },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/templates", label: "Templates", icon: BookTemplate },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, clear } = useAuth();
  const { activeWorkspaceId, setActive } = useActiveWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
    enabled: !!token,
  });

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !activeWorkspaceId) {
      setActive(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActive]);

  const activeWs = workspaces?.find((w) => w.id === activeWorkspaceId);

  if (!token) return null;

  const sidebar = (
    <>
      <div className="px-5 py-5 border-b border-[hsl(var(--border))]">
        <Link
          href="/dashboard"
          className="inline-flex items-center group transition-transform hover:scale-[1.02]"
          aria-label="Zebvo dashboard"
        >
          <Logo size="md" />
        </Link>
        <div className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-[0.18em] mt-2 font-mono pl-[36px]">
          AI Social Studio
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-[linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))] text-brand-500 font-medium ring-1 ring-brand-400/30"
                  : "text-[hsl(var(--foreground))]/70 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
              )}
            >
              <n.icon className="h-4 w-4 flex-shrink-0" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {activeWs && (
        <div className="px-3 pb-3">
          <div className="rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted))]/50">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-1">
              Active Workspace
            </div>
            <div className="font-medium text-sm truncate">{activeWs.name}</div>
            {(workspaces?.length || 0) > 1 && (
              <select
                value={activeWorkspaceId || ""}
                onChange={(e) => setActive(e.target.value)}
                className="mt-2 w-full text-xs bg-transparent border border-[hsl(var(--border))] rounded-md px-2 py-1"
              >
                {workspaces?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/**
       * Explicit bottom inset: avoids losing padding when `.safe-bottom`
       * (safe-area-only) would otherwise override Tailwind `pb-*` depending
       * on CSS load order. Always keeps ~48px clearance + iOS home-indicator.
       */}
      <div
        className="px-3 pt-3 border-t border-[hsl(var(--border))]"
        style={{
          paddingBottom: "max(3rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_-4px_rgb(var(--grad-shadow-1))] font-display">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              {user?.email}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            clear();
            router.replace("/login");
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    /**
     * Viewport-locked app shell.
     *
     * The outer wrapper is exactly viewport-tall and clips overflow so the
     * sidebar (left) never scrolls with the page. Only `<main>` is scrollable
     * via `overflow-y-auto`, which means the sidebar + top-bars stay fixed
     * in place while the user reads/scrolls long pages. This avoids the
     * Safari/Chrome quirk where `overflow-x: hidden` on <body> breaks
     * `position: sticky` for child elements.
     */
    <div className="h-dvh flex overflow-hidden">
      {/* Desktop sidebar — fixed, never scrolls with page content */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-md h-dvh flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 rounded-md p-1.5 hover:bg-[hsl(var(--muted))]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* The only scrollable region */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden h-dvh">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-md safe-top">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 hover:bg-[hsl(var(--muted))]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" aria-label="Zebvo dashboard">
              <Logo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>

        {/**
         * Desktop top bar — slim, sticky, hosts the theme picker so it's
         * one click away from any screen. Frosted-blur background so the
         * aurora field shines through. Right-aligned to keep page content
         * the visual focus.
         */}
        <div className="hidden lg:flex sticky top-0 z-30 items-center justify-end gap-2 px-4 xl:px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/55 backdrop-blur-md">
          <ThemeToggle />
        </div>

        {/** Tighter gutters + wider readable frame so ultra-wide layouts
         * don't show huge blank strips at the edges. */}
        <div className="px-3 sm:px-5 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] w-full mx-auto safe-bottom">
          {children}
        </div>
      </main>
    </div>
  );
}
