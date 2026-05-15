"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Briefcase,
  Plus,
  Trash2,
  FileText,
  Calendar,
  FileDown,
  ArrowRight,
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, downloadAuthed } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  industry?: string | null;
  targetAudience?: string | null;
  _count: { contents: number; schedules: number };
}

const PERKS = [
  "Separate brand voice & audience context",
  "Content library per brand",
  "Schedules & exports scoped to workspace",
];

/** Safe base name for downloaded files (no path separators). */
function safeExportBasename(name: string) {
  const s = name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "workspace";
  return s.length > 80 ? s.slice(0, 80) : s;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    targetAudience: "",
    brandVoice: "",
  });

  const wsQ = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  });

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      api("/workspaces", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      setOpen(false);
      setForm({ name: "", description: "", industry: "", targetAudience: "", brandVoice: "" });
      toast.success("Workspace created");
    },
    onError: () => toast.error("Could not create workspace. Try again."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/workspaces/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted");
    },
    onError: () => toast.error("Could not delete workspace"),
  });

  const totalWs = wsQ.data?.length ?? 0;
  const totalContent =
    wsQ.data?.reduce((acc, w) => acc + w._count.contents, 0) ?? 0;
  const totalScheduled =
    wsQ.data?.reduce((acc, w) => acc + w._count.schedules, 0) ?? 0;

  return (
    <AppShell>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl px-5 py-6 sm:px-8 sm:py-8 mb-6 sm:mb-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full blur-3xl opacity-55"
          style={{
            background:
              "radial-gradient(circle,hsl(var(--aurora-violet)/0.45),transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-8 h-56 w-56 rounded-full blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(circle,hsl(var(--aurora-cyan)/0.4),transparent 70%)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))] mb-2">
              Brand hubs
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-balance">
              Your{" "}
              <span className="text-aurora">workspaces</span>
            </h1>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] mt-2 max-w-2xl">
              Each workspace is one brand — its own voice, audience, content history, and
              exports. Switch active workspace anytime from the sidebar.
            </p>
            {totalWs > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-1 text-xs font-medium">
                  <Layers className="h-3.5 w-3.5 text-brand-500" />
                  {totalWs} workspace{totalWs === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-1 text-xs font-medium">
                  <FileText className="h-3.5 w-3.5 text-brand-500" />
                  {totalContent} content
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-1 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-brand-500" />
                  {totalScheduled} scheduled
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New workspace
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push("/generate")}
            >
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
          </div>
        </div>
      </motion.section>

      {wsQ.isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl shimmer" />
          ))}
        </div>
      ) : totalWs === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 backdrop-blur-xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%,hsl(var(--aurora-cyan)/0.12),transparent 55%),radial-gradient(80% 60% at 80% 100%,hsl(var(--aurora-pink)/0.1),transparent 50%)",
            }}
          />
          <div className="relative px-6 py-14 sm:px-10 sm:py-16 text-center max-w-lg mx-auto">
            <div
              className="mx-auto mb-6 h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                boxShadow: "0 12px 40px -12px rgb(var(--grad-shadow-1))",
              }}
            >
              <Briefcase className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Create your first workspace
            </h2>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] mb-8">
              Brand context lives here — Gemini uses it every time you generate. One
              workspace per client or product line keeps everything organized.
            </p>
            <ul className="text-left space-y-2.5 mb-8 max-w-sm mx-auto">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[hsl(var(--muted-foreground))]">{p}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Create workspace
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                type="button"
                onClick={() => router.push("/dashboard")}
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {wsQ.data?.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.05 * i, 0.35) }}
            >
              <Card className="group relative overflow-hidden h-full transition-all hover:-translate-y-1 hover:border-brand-400/45 hover:shadow-[0_24px_60px_-28px_rgb(var(--grad-shadow-1))]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-50"
                  style={{
                    background:
                      "linear-gradient(180deg,hsl(var(--aurora-cyan)/0.15),transparent)",
                  }}
                />
                <CardContent className="relative p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className="h-11 w-11 rounded-xl text-white flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ring-1 ring-white/10"
                      style={{
                        background:
                          "linear-gradient(135deg,var(--grad-from),var(--grad-via),var(--grad-to))",
                        boxShadow: "0 8px 24px -8px rgb(var(--grad-shadow-1))",
                      }}
                    >
                      {w.name[0]?.toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${w.name}"? All content will be removed.`)) {
                          remove.mutate(w.id);
                        }
                      }}
                      className="opacity-60 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-500/10 rounded-lg p-2"
                      aria-label={`Delete ${w.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link href={`/workspaces/${w.id}`} className="block group/link">
                    <h3 className="font-display text-lg sm:text-xl font-bold mb-2 truncate group-hover/link:text-brand-500 transition-colors">
                      {w.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 opacity-0 group-hover/link:opacity-100 transition-opacity">
                      Open workspace <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                  {w.industry && (
                    <Badge variant="brand" className="mb-2 mt-1">
                      {w.industry}
                    </Badge>
                  )}
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 min-h-[2.75rem] mt-2">
                    {w.description || (
                      <span className="italic opacity-70">Add a description in workspace settings</span>
                    )}
                  </p>
                  {w.targetAudience && (
                    <p className="flex items-start gap-1.5 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <Users className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                      <span className="line-clamp-2">{w.targetAudience}</span>
                    </p>
                  )}
                  <div className="flex items-center flex-wrap gap-2 mt-5 pt-4 border-t border-[hsl(var(--border))]">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))]/50 px-2 py-1 text-[11px] font-medium">
                      <FileText className="h-3 w-3 text-brand-500" />
                      {w._count.contents} posts
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))]/50 px-2 py-1 text-[11px] font-medium">
                      <Calendar className="h-3 w-3 text-brand-500" />
                      {w._count.schedules} queued
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await downloadAuthed(
                            `/export/workspace/${w.id}`,
                            `${safeExportBasename(w.name)}.zip`,
                          );
                        } catch {
                          toast.error("Export failed. Check connection and try again.");
                        }
                      }}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-brand-500 transition-colors"
                      title="Export workspace as ZIP"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Export
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New workspace" size="md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Brand name required");
            create.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label required>Brand name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Acme Coffee Co."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What this brand does..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="SaaS"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target audience</Label>
              <Input
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="PMs at startups"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Brand voice</Label>
            <Input
              value={form.brandVoice}
              onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
              placeholder="Bold, clear, confident"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
