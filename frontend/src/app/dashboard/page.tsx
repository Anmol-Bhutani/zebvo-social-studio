"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Instagram,
  Linkedin,
  Twitter,
  Hash,
  Layers,
  Megaphone,
  Lightbulb,
  Film,
  Plus,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/store/auth";

interface Workspace {
  id: string;
  name: string;
  industry?: string | null;
  _count: { contents: number; schedules: number };
}
interface ContentItem {
  id: string;
  title: string | null;
  type: string;
  platform: string;
  createdAt: string;
  workspace: { id: string; name: string };
}

/** Quick-action shortcuts — each deep-links into /generate with the
 * content type + platform pre-selected so users land on the right form. */
const QUICK_ACTIONS = [
  {
    type: "instagram_caption",
    platform: "instagram",
    label: "Instagram caption",
    blurb: "Hooks + emojis + CTA",
    icon: Instagram,
  },
  {
    type: "linkedin_post",
    platform: "linkedin",
    label: "LinkedIn post",
    blurb: "Thought-leadership voice",
    icon: Linkedin,
  },
  {
    type: "twitter_thread",
    platform: "twitter",
    label: "X / Twitter thread",
    blurb: "Multi-tweet story",
    icon: Twitter,
  },
  {
    type: "carousel",
    platform: "instagram",
    label: "Carousel slides",
    blurb: "5–7 swipeable cards",
    icon: Layers,
  },
  {
    type: "hashtags",
    platform: "instagram",
    label: "Hashtag pack",
    blurb: "On-brand discovery tags",
    icon: Hash,
  },
  {
    type: "reel_script",
    platform: "tiktok",
    label: "Reel script",
    blurb: "Hook + beats + CTA",
    icon: Film,
  },
  {
    type: "marketing_copy",
    platform: "generic",
    label: "Marketing copy",
    blurb: "Headlines + variants",
    icon: Megaphone,
  },
  {
    type: "campaign_idea",
    platform: "generic",
    label: "Campaign ideas",
    blurb: "Concepts + hooks",
    icon: Lightbulb,
  },
];

/** Returns a time-of-day greeting tailored to the user's local clock. */
function useGreeting() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!now) return { greeting: "Welcome back", dateStr: "" };
    const h = now.getHours();
    const greeting =
      h < 5
        ? "Working late"
        : h < 12
          ? "Good morning"
          : h < 17
            ? "Good afternoon"
            : h < 21
              ? "Good evening"
              : "Burning the midnight oil";
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return { greeting, dateStr };
  }, [now]);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { greeting, dateStr } = useGreeting();

  const wsQ = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  });
  const recentQ = useQuery({
    queryKey: ["recent-content"],
    queryFn: () => api<{ contents: ContentItem[] }>("/contents").then((r) => r.contents.slice(0, 6)),
  });

  const totalContent = wsQ.data?.reduce((s, w) => s + w._count.contents, 0) || 0;
  const totalScheduled = wsQ.data?.reduce((s, w) => s + w._count.schedules, 0) || 0;
  const totalWorkspaces = wsQ.data?.length || 0;
  const thisWeek = useMemo(() => {
    if (!recentQ.data) return 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentQ.data.filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;
  }, [recentQ.data]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <AppShell>
      {/* ============ Welcome hero ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl px-5 py-6 sm:px-8 sm:py-8 mb-6 sm:mb-8"
      >
        {/* aurora glows behind the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle,hsl(var(--aurora-cyan)/0.45),transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-0 h-64 w-64 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle,hsl(var(--aurora-violet)/0.4),transparent 70%)" }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))] mb-2">
              {dateStr || "Loading…"}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-balance">
              {greeting},{" "}
              <span className="text-aurora">{firstName}</span>.
            </h1>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] mt-2 max-w-xl">
              Your AI content command center.{" "}
              {totalContent > 0
                ? `You have ${totalContent} ${totalContent === 1 ? "piece" : "pieces"} in your library`
                : "Generate your first post in under a minute"}
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push("/generate")}
            >
              <Sparkles className="h-4 w-4" />
              Generate content
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push("/workspaces")}
            >
              <Briefcase className="h-4 w-4" />
              Workspaces
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ============ Stat tiles ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard
          icon={Briefcase}
          label="Workspaces"
          value={totalWorkspaces}
          hint={totalWorkspaces > 0 ? `${totalWorkspaces} active brand${totalWorkspaces === 1 ? "" : "s"}` : "Create your first"}
          loading={wsQ.isLoading}
          delay={0}
        />
        <StatCard
          icon={FileText}
          label="Content items"
          value={totalContent}
          hint={totalContent > 0 ? "In your library" : "Generate to get started"}
          loading={wsQ.isLoading}
          delay={0.04}
        />
        <StatCard
          icon={Calendar}
          label="Scheduled"
          value={totalScheduled}
          hint={totalScheduled > 0 ? "Posts queued" : "Nothing queued yet"}
          loading={wsQ.isLoading}
          delay={0.08}
        />
        <StatCard
          icon={TrendingUp}
          label="This week"
          value={thisWeek}
          hint={thisWeek > 0 ? "Created in last 7 days" : "Let's create something"}
          loading={recentQ.isLoading}
          accent
          delay={0.12}
        />
      </div>

      {/* ============ Quick Actions ============ */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold">Quick actions</h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Jump straight into a content type with smart defaults.
          </p>
        </div>
        <Link
          href="/generate"
          className="text-xs sm:text-sm text-brand-500 font-medium hover:underline flex-shrink-0 inline-flex items-center gap-1"
        >
          All content types <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-8 sm:mb-10">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div
            key={a.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.25 }}
          >
            <Link
              href={`/generate?type=${a.type}&platform=${a.platform}`}
              className="group block h-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-[0_18px_50px_-20px_rgb(var(--grad-shadow-1))]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-brand-400/20"
                  style={{
                    background:
                      "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))",
                  }}
                >
                  <a.icon className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-sm sm:text-[15px] truncate">
                    {a.label}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">
                    {a.blurb}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
                <span className="capitalize">{a.platform}</span>
                <span className="inline-flex items-center gap-0.5 text-brand-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Generate <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ============ Recent + Workspaces ============ */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-lg sm:text-xl font-bold">Recent content</h2>
            {(recentQ.data?.length || 0) > 0 && (
              <Link
                href="/library"
                className="text-xs sm:text-sm text-brand-500 font-medium hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {recentQ.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl shimmer" />
              ))}
            </div>
          ) : (recentQ.data?.length || 0) === 0 ? (
            <Card className="relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 0%,hsl(var(--aurora-violet)/0.25),transparent 60%)",
                }}
              />
              <CardContent className="relative text-center py-12">
                <div
                  className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                    boxShadow: "0 10px 30px -10px rgb(var(--grad-shadow-1))",
                  }}
                >
                  <Zap className="h-7 w-7 text-white" fill="currentColor" />
                </div>
                <p className="font-display font-semibold text-base sm:text-lg mb-1">
                  Your library is waiting
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5 max-w-sm mx-auto">
                  Generate captions, threads, carousels, and reel scripts — all on-brand, in
                  seconds.
                </p>
                <Button onClick={() => router.push("/generate")}>
                  <Sparkles className="h-4 w-4" />
                  Start generating
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentQ.data?.map((c) => (
                <Link key={c.id} href={`/library/${c.id}`} className="block group">
                  <Card className="transition-all group-hover:border-brand-400/50 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_-22px_rgb(var(--grad-shadow-1))]">
                    <CardContent className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-brand-400/20"
                        style={{
                          background:
                            "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))",
                        }}
                      >
                        <FileText className="h-5 w-5 text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.title || c.type}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="brand">{c.platform}</Badge>
                          <Badge>{c.type.replace(/_/g, " ")}</Badge>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            • {c.workspace.name} • {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-lg sm:text-xl font-bold">Workspaces</h2>
            <Link
              href="/workspaces"
              className="text-xs sm:text-sm text-brand-500 font-medium hover:underline inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {wsQ.data?.map((w) => (
              <Link key={w.id} href={`/workspaces/${w.id}`} className="block group">
                <Card className="transition-all group-hover:border-brand-400/50 group-hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="h-9 w-9 rounded-xl text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                          boxShadow: "0 6px 18px -6px rgb(var(--grad-shadow-1))",
                        }}
                      >
                        {w.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-semibold truncate text-sm sm:text-[15px]">
                          {w.name}
                        </div>
                        {w.industry && (
                          <div className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                            {w.industry}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge>{w._count.contents} content</Badge>
                      <Badge>{w._count.schedules} scheduled</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            <Link href="/workspaces" className="block group">
              <Card className="border-dashed transition-all group-hover:border-brand-400/60 group-hover:bg-[hsl(var(--muted))]/40">
                <CardContent className="text-center py-5 sm:py-6">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] group-hover:text-brand-500 transition-colors">
                    <Plus className="h-4 w-4" />
                    Create new workspace
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
  loading?: boolean;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-[0_18px_50px_-22px_rgb(var(--grad-shadow-1))]">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {label}
            </div>
            <div className="font-display text-3xl sm:text-4xl font-bold mt-1.5 leading-none tabular-nums">
              {loading ? <span className="opacity-30">—</span> : value}
            </div>
            {hint && (
              <div className="text-[11px] sm:text-xs text-[hsl(var(--muted-foreground))] mt-2 line-clamp-1">
                {hint}
              </div>
            )}
          </div>
          <div
            className={
              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 " +
              (accent
                ? "text-white ring-white/20"
                : "text-brand-500 ring-brand-400/20")
            }
            style={
              accent
                ? {
                    background:
                      "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                    boxShadow: "0 8px 22px -8px rgb(var(--grad-shadow-1))",
                  }
                : {
                    background:
                      "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.18),hsl(var(--aurora-violet)/0.18))",
                  }
            }
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
