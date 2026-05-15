"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Hash,
  Layers,
  Megaphone,
  Lightbulb,
  Film,
  Building2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn, formatDateTime } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string | null;
  body: string;
  type: string;
  platform: string;
  tone: string;
  status: string;
  createdAt: string;
  workspace: { id: string; name: string };
}

interface Workspace {
  id: string;
  name: string;
}

const STATUS_VARIANTS: Record<string, "default" | "amber" | "green" | "blue" | "rose"> = {
  draft: "amber",
  approved: "green",
  scheduled: "blue",
  archived: "default",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  instagram_caption: Instagram,
  linkedin_post: Linkedin,
  twitter_thread: Twitter,
  hashtags: Hash,
  carousel: Layers,
  marketing_copy: Megaphone,
  campaign_idea: Lightbulb,
  reel_script: Film,
};

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "instagram_caption", label: "Instagram caption" },
  { value: "linkedin_post", label: "LinkedIn post" },
  { value: "twitter_thread", label: "Twitter thread" },
  { value: "hashtags", label: "Hashtags" },
  { value: "carousel", label: "Carousel" },
  { value: "marketing_copy", label: "Marketing copy" },
  { value: "campaign_idea", label: "Campaign idea" },
  { value: "reel_script", label: "Reel script" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "generic", label: "Generic" },
];

function TypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] || FileText;
  return <Icon className="h-5 w-5 text-brand-500" />;
}

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceFromUrl = searchParams.get("workspaceId") || "";

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [platform, setPlatform] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaceFromUrl);

  useEffect(() => {
    setWorkspaceId(workspaceFromUrl);
  }, [workspaceFromUrl]);

  const workspacesQ = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  });

  const listQ = useQuery({
    queryKey: ["contents", { type, platform, workspaceId }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (workspaceId) params.set("workspaceId", workspaceId);
      if (type) params.set("type", type);
      if (platform) params.set("platform", platform);
      const s = params.toString();
      return api<{ contents: ContentItem[] }>(`/contents${s ? `?${s}` : ""}`).then((r) => r.contents);
    },
  });

  function setWorkspaceFilter(next: string) {
    setWorkspaceId(next);
    if (next) {
      router.replace(`/library?workspaceId=${encodeURIComponent(next)}`);
    } else {
      router.replace("/library");
    }
  }

  const filtered = useMemo(
    () =>
      listQ.data?.filter((c) =>
        q
          ? (c.title || "").toLowerCase().includes(q.toLowerCase()) ||
            c.body.toLowerCase().includes(q.toLowerCase())
          : true,
      ),
    [listQ.data, q],
  );

  const hasActiveFilters = Boolean(q || type || platform || workspaceId);
  /** Server-side filters only (search `q` is client-side on fetched rows). */
  const hasApiFilters = Boolean(type || platform || workspaceId);
  const isEmptyLibrary =
    !listQ.isLoading &&
    !listQ.isError &&
    (listQ.data?.length ?? 0) === 0 &&
    !hasApiFilters;
  /** No rows from API when workspace/type/platform filters are set. */
  const noServerResults =
    !listQ.isLoading &&
    !listQ.isError &&
    (listQ.data?.length ?? 0) === 0 &&
    hasApiFilters;
  /** Rows exist but client search hides all. */
  const noMatches =
    !listQ.isLoading &&
    !listQ.isError &&
    (listQ.data?.length ?? 0) > 0 &&
    (filtered?.length ?? 0) === 0;

  const workspaceOptions = useMemo(() => {
    const base = [{ value: "", label: "All workspaces" }];
    if (!workspacesQ.data?.length) return base;
    return [...base, ...workspacesQ.data.map((w) => ({ value: w.id, label: w.name }))];
  }, [workspacesQ.data]);

  return (
    <AppShell>
      <div className="relative mb-6 sm:mb-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-4 -left-6 h-40 w-72 rounded-full opacity-[0.35] blur-3xl sm:h-48 sm:w-96"
          style={{
            background:
              "radial-gradient(ellipse at center,hsl(var(--aurora-violet)/0.45),transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-8 right-0 h-32 w-56 rounded-full opacity-25 blur-3xl sm:h-40 sm:w-72"
          style={{
            background:
              "radial-gradient(ellipse at center,hsl(var(--aurora-cyan)/0.35),transparent 70%)",
          }}
        />
        <div className="relative">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5 max-w-xl">
            All your generated content across workspaces — search, filter, and open anything
            instantly.
          </p>
        </div>
      </div>

      <Card className="mb-6 relative overflow-hidden border-brand-500/10 shadow-[0_20px_60px_-28px_rgb(var(--grad-shadow-1))]">
         <div
           aria-hidden
           className="pointer-events-none absolute inset-0 opacity-[0.12]"
           style={{
             background:
               "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.2),transparent 45%,hsl(var(--aurora-violet)/0.15))",
           }}
         />
        <CardContent className="relative p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-500/90" />
            Find content
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
              <Label className="text-[10px] normal-case tracking-normal">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-500/70 pointer-events-none" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title or body..."
                  className={cn(
                    "pl-9 h-11 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--card))]/90",
                    "transition-colors hover:border-brand-500/35 focus-visible:border-brand-500/60",
                  )}
                  aria-label="Search library by title or body"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] normal-case tracking-normal">Workspace</Label>
              <Select
                value={workspaceId}
                onChange={(e) => setWorkspaceFilter(e.target.value)}
                options={workspaceOptions}
                disabled={workspacesQ.isLoading}
                className={cn(
                  "h-11 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--card))]/90",
                  "transition-colors hover:border-brand-500/35 focus-visible:border-brand-500/60",
                )}
                aria-label="Filter by workspace"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] normal-case tracking-normal">Type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={TYPE_OPTIONS}
                className={cn(
                  "h-11 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--card))]/90",
                  "transition-colors hover:border-brand-500/35 focus-visible:border-brand-500/60",
                )}
                aria-label="Filter by content type"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] normal-case tracking-normal">Platform</Label>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                options={PLATFORM_OPTIONS}
                className={cn(
                  "h-11 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--card))]/90",
                  "transition-colors hover:border-brand-500/35 focus-visible:border-brand-500/60",
                )}
                aria-label="Filter by platform"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setQ("");
                  setType("");
                  setPlatform("");
                  setWorkspaceFilter("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {listQ.isError && (
        <Card className="mb-6 border-rose-500/40 bg-rose-950/20">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-rose-200/90">
              {(listQ.error as Error)?.message || "Could not load your library. Try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => listQ.refetch()} className="shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {listQ.isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl shimmer" />
          ))}
        </div>
      ) : noServerResults ? (
        <Card className="relative overflow-hidden border-dashed border-brand-500/25">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(100% 80% at 50% 0%,hsl(var(--aurora-cyan)/0.2),transparent 65%)",
            }}
          />
          <CardContent className="relative text-center py-14 px-6">
            <div
              className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ring-1 ring-brand-400/30"
              style={{
                background:
                  "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))",
              }}
            >
              <SlidersHorizontal className="h-7 w-7 text-brand-400" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">Nothing matches these filters</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-5">
              Try a different workspace, type, or platform — or clear filters to see everything.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setType("");
                setPlatform("");
                setWorkspaceFilter("");
              }}
            >
              Reset workspace & type filters
            </Button>
          </CardContent>
        </Card>
      ) : noMatches ? (
        <Card className="relative overflow-hidden border-dashed border-brand-500/25">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(100% 80% at 50% 0%,hsl(var(--aurora-violet)/0.3),transparent 65%)",
            }}
          />
          <CardContent className="relative text-center py-14 px-6">
            <div
              className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ring-1 ring-brand-400/30"
              style={{
                background:
                  "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.2),hsl(var(--aurora-violet)/0.2))",
              }}
            >
              <Search className="h-7 w-7 text-brand-400" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">No matches</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-5">
              Nothing matches your search or filters. Adjust keywords or clear filters to see more.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setType("");
                setPlatform("");
                setWorkspaceFilter("");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : isEmptyLibrary ? (
        <Card className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%,hsl(var(--aurora-violet)/0.25),transparent 60%)",
            }}
          />
          <CardContent className="relative text-center py-14 sm:py-16 px-6">
            <div
              className="mx-auto mb-5 h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                boxShadow: "0 12px 40px -12px rgb(var(--grad-shadow-1))",
              }}
            >
              <Zap className="h-8 w-8 text-white" fill="currentColor" />
            </div>
            <p className="font-display font-semibold text-lg sm:text-xl mb-2">Your shelf is ready</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8 max-w-md mx-auto leading-relaxed">
              Generated captions, threads, carousels, and scripts will land here automatically. Start
              creating on-brand content in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="primary" size="lg" onClick={() => router.push("/generate")}>
                <Sparkles className="h-4 w-4" />
                Generate content
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push("/workspaces")}>
                <Building2 className="h-4 w-4" />
                Manage workspaces
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered?.map((c) => (
            <Link key={c.id} href={`/library/${c.id}`} className="block group">
              <Card
                className={cn(
                  "h-full transition-all duration-200",
                  "group-hover:border-brand-400/50 group-hover:-translate-y-0.5",
                  "group-hover:shadow-[0_22px_55px_-24px_rgb(var(--grad-shadow-1))]",
                )}
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-brand-400/25"
                      style={{
                        background:
                          "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))",
                      }}
                    >
                      <TypeIcon type={c.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold line-clamp-1 pr-1">
                          {c.title || c.type.replace(/_/g, " ")}
                        </h3>
                        <Badge
                          variant={STATUS_VARIANTS[c.status] || "default"}
                          className="flex-shrink-0 capitalize"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant="brand" className="capitalize">
                          {c.platform}
                        </Badge>
                        <Badge className="capitalize">{c.type.replace(/_/g, " ")}</Badge>
                        <Badge className="capitalize">{c.tone}</Badge>
                      </div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 min-h-[3.75rem] leading-relaxed">
                        {c.body.slice(0, 280)}
                        {c.body.length > 280 ? "…" : ""}
                      </p>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-4 flex items-center justify-between gap-2">
                        <span className="truncate flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 flex-shrink-0 opacity-60" />
                          {c.workspace.name}
                        </span>
                        <span className="flex-shrink-0 tabular-nums">{formatDateTime(c.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0 mt-1 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
