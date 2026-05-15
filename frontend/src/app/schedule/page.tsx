"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  List,
  CalendarDays,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Hash,
  Building2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string | null;
  type: string;
  platform: string;
  body: string;
  workspace: { id: string; name: string };
}
interface Schedule {
  id: string;
  scheduledAt: string;
  note: string | null;
  status: string;
  content: ContentItem;
  workspace: { id: string; name: string };
}

const PLATFORM_ICON: Record<string, LucideIcon> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  tiktok: Hash,
  youtube: Hash,
  generic: Hash,
};

function PlatformIcon({ platform }: { platform: string }) {
  const Icon = PLATFORM_ICON[platform] || Hash;
  return <Icon className="h-3 w-3 flex-shrink-0 opacity-90" />;
}

export default function SchedulePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    if (mq.matches) setView("list");
  }, []);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    contentId: "",
    workspaceId: "",
    scheduledAt: "",
    note: "",
  });

  const schedulesQ = useQuery({
    queryKey: ["schedules"],
    queryFn: () => api<{ schedules: Schedule[] }>("/schedules").then((r) => r.schedules),
  });
  const contentsQ = useQuery({
    queryKey: ["contents", "all"],
    queryFn: () => api<{ contents: ContentItem[] }>("/contents").then((r) => r.contents),
  });

  const create = useMutation({
    mutationFn: (payload: {
      workspaceId: string;
      contentId: string;
      scheduledAt: string;
      note: string;
    }) =>
      api("/schedules", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: payload.workspaceId,
          contentId: payload.contentId,
          scheduledAt: new Date(payload.scheduledAt).toISOString(),
          ...(payload.note.trim() ? { note: payload.note.trim() } : {}),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setShowAdd(false);
      setForm({ contentId: "", workspaceId: "", scheduledAt: "", note: "" });
      toast.success("Scheduled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/schedules/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedulesQ.data?.forEach((s) => {
      const key = format(new Date(s.scheduledAt), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return map;
  }, [schedulesQ.data]);

  function selectedContent() {
    return contentsQ.data?.find((c) => c.id === form.contentId);
  }

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
          className="pointer-events-none absolute top-6 right-0 h-32 w-56 rounded-full opacity-25 blur-3xl sm:h-40 sm:w-72"
          style={{
            background:
              "radial-gradient(ellipse at center,hsl(var(--aurora-cyan)/0.35),transparent 70%)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Schedule</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5 max-w-xl">
              Plan when each piece goes live. Reminders and calendar views stay in sync with your
              library — actual publishing is up to you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <div className="flex rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-1 shadow-inner backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all",
                  view === "calendar"
                    ? "bg-[linear-gradient(110deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] text-white shadow-[0_6px_20px_-8px_rgb(var(--grad-shadow-1))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all",
                  view === "list"
                    ? "bg-[linear-gradient(110deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] text-white shadow-[0_6px_20px_-8px_rgb(var(--grad-shadow-1))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
            <Button size="lg" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Schedule
            </Button>
          </div>
        </div>
      </div>

      {schedulesQ.isError && (
        <Card className="mb-6 border-rose-500/40 bg-rose-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-rose-200/90">
              {(schedulesQ.error as Error)?.message || "Could not load schedules."}
            </p>
            <Button variant="outline" size="sm" onClick={() => schedulesQ.refetch()} className="shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {view === "calendar" ? (
        <Card className="relative overflow-hidden border-brand-500/10 shadow-[0_24px_60px_-30px_rgb(var(--grad-shadow-1))]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{
              background:
                "linear-gradient(145deg,hsl(var(--aurora-cyan)/0.15),transparent 50%,hsl(var(--aurora-violet)/0.12))",
            }}
          />
          <CardContent className="relative p-3 sm:p-6">
            <div className="flex items-center justify-between mb-5 gap-2">
              <div className="font-display text-lg sm:text-xl font-semibold truncate">
                {format(month, "MMMM yyyy")}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMonth(addMonths(month, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="hidden xs:inline-flex" onClick={() => setMonth(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {schedulesQ.isLoading ? (
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[88px] sm:min-h-[104px] rounded-xl shimmer" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div
                        key={d}
                        className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {days.map((d) => {
                      const key = format(d, "yyyy-MM-dd");
                      const items = schedulesByDay.get(key) || [];
                      const inMonth = isSameMonth(d, month);
                      const isSel = isSameDay(d, selectedDay);
                      const dayIsToday = isToday(d);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDay(d)}
                          className={cn(
                            "min-h-[84px] sm:min-h-[108px] rounded-xl border text-left transition-all duration-200 p-1.5 sm:p-2",
                            "hover:border-brand-400/45 hover:bg-brand-500/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
                            inMonth
                              ? "border-[hsl(var(--border))] bg-[hsl(var(--card))]/40"
                              : "border-transparent bg-transparent opacity-35 hover:opacity-55",
                            dayIsToday && "ring-1 ring-brand-500/50 bg-brand-500/[0.08]",
                            isSel && !dayIsToday && "ring-1 ring-brand-400/40",
                          )}
                        >
                          <div
                            className={cn(
                              "text-[11px] sm:text-sm font-semibold tabular-nums mb-1",
                              dayIsToday ? "text-brand-400" : "text-[hsl(var(--foreground))]",
                            )}
                          >
                            {format(d, "d")}
                          </div>
                          <div className="space-y-1">
                            {items.slice(0, 2).map((s) => (
                              <Link
                                key={s.id}
                                href={`/library/${s.content.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "flex items-center gap-1 text-[9px] sm:text-[10px] rounded-md px-1.5 py-0.5 truncate w-full",
                                  "bg-[linear-gradient(90deg,hsl(var(--aurora-cyan)/0.14),hsl(var(--aurora-violet)/0.12))]",
                                  "border border-brand-500/20 text-brand-600 dark:text-brand-300",
                                  "hover:brightness-110 transition-all",
                                )}
                                title={s.content.title || s.content.type}
                              >
                                <PlatformIcon platform={s.content.platform} />
                                <span className="truncate">
                                  {format(new Date(s.scheduledAt), "HH:mm")} ·{" "}
                                  {s.content.title || s.content.type}
                                </span>
                              </Link>
                            ))}
                            {items.length > 2 && (
                              <div className="text-[9px] sm:text-[10px] text-[hsl(var(--muted-foreground))] px-1 font-medium">
                                +{items.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {(schedulesQ.data?.length || 0) === 0 && !schedulesQ.isLoading && !schedulesQ.isError && (
              <div className="mt-6 rounded-2xl border border-dashed border-brand-500/25 bg-[hsl(var(--muted))]/20 px-4 py-8 text-center">
                <div
                  className="mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                    boxShadow: "0 8px 28px -10px rgb(var(--grad-shadow-1))",
                  }}
                >
                  <CalendarIcon className="h-6 w-6 text-white" strokeWidth={1.75} />
                </div>
                <p className="font-medium text-sm mb-1">Nothing on the calendar yet</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 max-w-sm mx-auto">
                  Pick a library item and a date — it will show up here and in list view.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => setShowAdd(true)}>
                    <Plus className="h-4 w-4" />
                    Schedule content
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push("/library")}>
                    Open library
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : schedulesQ.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : !schedulesQ.isError && (schedulesQ.data?.length || 0) === 0 ? (
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
            <p className="font-display font-semibold text-lg sm:text-xl mb-2">No scheduled posts</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8 max-w-md mx-auto leading-relaxed">
              Schedule a saved piece from your library and track everything in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Schedule one
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push("/generate")}>
                <Sparkles className="h-4 w-4" />
                Generate content
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : schedulesQ.isError ? null : (
        <div className="space-y-3">
          {schedulesQ.data?.map((s) => (
            <Card
              key={s.id}
              className="transition-all hover:border-brand-400/45 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgb(var(--grad-shadow-1))]"
            >
              <CardContent className="p-4 flex items-stretch gap-3 sm:gap-4">
                <div className="text-center w-16 sm:w-20 flex-shrink-0 rounded-xl bg-[linear-gradient(180deg,hsl(var(--aurora-cyan)/0.12),hsl(var(--aurora-violet)/0.08))] border border-brand-500/15 py-3 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    {format(new Date(s.scheduledAt), "MMM")}
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold leading-none text-brand-400">
                    {format(new Date(s.scheduledAt), "d")}
                  </div>
                  <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 tabular-nums">
                    {format(new Date(s.scheduledAt), "HH:mm")}
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <Link href={`/library/${s.content.id}`} className="group block">
                    <div className="font-display font-semibold truncate group-hover:text-brand-400 transition-colors">
                      {s.content.title || s.content.type.replace(/_/g, " ")}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="brand" className="capitalize gap-1">
                        <PlatformIcon platform={s.content.platform} />
                        {s.content.platform}
                      </Badge>
                      <Badge className="capitalize">{s.content.type.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Building2 className="h-3 w-3 opacity-70" />
                        {s.workspace.name}
                      </span>
                    </div>
                  </Link>
                  {s.note && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 line-clamp-2 border-l-2 border-brand-500/30 pl-2">
                      {s.note}
                    </p>
                  )}
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2 sm:hidden">
                    {formatDateTime(s.scheduledAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove.mutate(s.id)}
                  disabled={remove.isPending}
                  className="text-rose-400 hover:bg-rose-500/15 rounded-xl p-2.5 self-center flex-shrink-0 transition-colors disabled:opacity-50"
                  aria-label="Remove schedule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Schedule content">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = selectedContent();
            if (!c) {
              toast.error("Pick a piece of content");
              return;
            }
            if (!form.scheduledAt) {
              toast.error("Pick a date and time");
              return;
            }
            create.mutate({
              workspaceId: c.workspace.id,
              contentId: c.id,
              scheduledAt: form.scheduledAt,
              note: form.note,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label required>Content</Label>
            <Select
              value={form.contentId}
              onChange={(e) => {
                const c = contentsQ.data?.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  contentId: e.target.value,
                  workspaceId: c?.workspace.id || "",
                });
              }}
              options={[
                { value: "", label: contentsQ.isLoading ? "Loading…" : "Pick a piece of content…" },
                ...(contentsQ.data?.map((c) => ({
                  value: c.id,
                  label: `${c.title || c.type} (${c.platform})`,
                })) || []),
              ]}
              required
              disabled={contentsQ.isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <Label required>Date & time</Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional reminder"
            />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Schedules are for planning — connect your platforms when you are ready to go live.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending} disabled={contentsQ.isLoading}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
