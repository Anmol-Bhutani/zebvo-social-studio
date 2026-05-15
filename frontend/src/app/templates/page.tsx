"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BookTemplate,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string | null;
  contentType: string;
  platform: string;
  tone: string;
  promptBody: string;
}

const DEFAULT_FORM = {
  name: "",
  description: "",
  contentType: "instagram_caption",
  platform: "instagram",
  tone: "professional",
  promptBody:
    "You are an elite copywriter for {brand}. Audience: {audience}. Industry: {industry}. Write a {platform} {tone} piece. Extra: {extra}",
};

const PLACEHOLDERS = [
  "{brand}",
  "{audience}",
  "{industry}",
  "{voice}",
  "{tone}",
  "{platform}",
  "{extra}",
  "{description}",
] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) setForm({ ...DEFAULT_FORM });
  }, [open]);

  const listQ = useQuery({
    queryKey: ["templates"],
    queryFn: () => api<{ templates: Template[] }>("/templates").then((r) => r.templates),
  });

  const create = useMutation({
    mutationFn: (payload: typeof DEFAULT_FORM) =>
      api("/templates", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          name: payload.name.trim(),
          description: payload.description.trim() || undefined,
          promptBody: payload.promptBody.trim(),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setOpen(false);
      setForm({ ...DEFAULT_FORM });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Prompt templates
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5 max-w-2xl leading-relaxed">
              Save reusable prompt formulas for your brand. Use placeholders in the prompt body — they
              fill in automatically from each workspace when you generate.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <code
                  key={p}
                  className="text-[10px] sm:text-xs rounded-md px-2 py-0.5 font-mono bg-brand-500/10 text-brand-400 border border-brand-500/25"
                >
                  {p}
                </code>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="lg:flex-shrink-0 shadow-[0_10px_28px_-10px_rgb(var(--grad-shadow-1))]"
          >
            <Plus className="h-4 w-4" /> New template
          </Button>
        </div>
      </div>

      {listQ.isError && (
        <Card className="mb-6 border-rose-500/40 bg-rose-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-rose-200/90">
              {(listQ.error as Error)?.message || "Could not load templates."}
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
            <div key={i} className="h-48 rounded-2xl shimmer" />
          ))}
        </div>
      ) : !listQ.isError && (listQ.data?.length || 0) === 0 ? (
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
              <Wand2 className="h-8 w-8 text-white" strokeWidth={1.75} />
            </div>
            <p className="font-display font-semibold text-lg sm:text-xl mb-2">No templates yet</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8 max-w-md mx-auto leading-relaxed">
              Capture your best prompt patterns once — then reuse them on Generate with consistent structure
              and tone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Create one
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push("/generate")}>
                <Sparkles className="h-4 w-4" />
                Go to Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : listQ.isError ? null : (
        <div className="grid md:grid-cols-2 gap-4">
          {listQ.data?.map((t) => (
            <Card
              key={t.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-200",
                "hover:border-brand-400/45 hover:-translate-y-0.5",
                "hover:shadow-[0_22px_55px_-28px_rgb(var(--grad-shadow-1))]",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.06),transparent 55%,hsl(var(--aurora-violet)/0.05))",
                }}
              />
              <CardContent className="relative p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-brand-400/25"
                    style={{
                      background:
                        "linear-gradient(135deg,hsl(var(--aurora-cyan)/0.2),hsl(var(--aurora-violet)/0.18))",
                    }}
                  >
                    <BookTemplate className="h-5 w-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-base leading-tight pr-1">{t.name}</h3>
                      <button
                        type="button"
                        onClick={() => remove.mutate(t.id)}
                        disabled={remove.isPending}
                        className="text-rose-400 hover:bg-rose-500/15 rounded-lg p-2 flex-shrink-0 transition-colors disabled:opacity-50"
                        aria-label="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      <Badge variant="brand" className="capitalize">
                        {t.platform}
                      </Badge>
                      <Badge className="capitalize">{t.contentType.replace(/_/g, " ")}</Badge>
                      <Badge className="capitalize">{t.tone}</Badge>
                    </div>
                  </div>
                </div>
                {t.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                )}
                <pre className="text-[11px] sm:text-xs font-mono p-3 rounded-xl bg-[hsl(var(--muted))]/35 border border-[hsl(var(--border))] whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed text-[hsl(var(--foreground))]/90">
                  {t.promptBody}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New template" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.promptBody.trim()) {
              toast.error("Fill required fields");
              return;
            }
            create.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer sale Instagram"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional note"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                options={[
                  { value: "instagram_caption", label: "Instagram caption" },
                  { value: "linkedin_post", label: "LinkedIn post" },
                  { value: "twitter_thread", label: "Twitter thread" },
                  { value: "hashtags", label: "Hashtags" },
                  { value: "carousel", label: "Carousel" },
                  { value: "marketing_copy", label: "Marketing copy" },
                  { value: "campaign_idea", label: "Campaign idea" },
                  { value: "reel_script", label: "Reel script" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                options={[
                  { value: "instagram", label: "Instagram" },
                  { value: "linkedin", label: "LinkedIn" },
                  { value: "twitter", label: "Twitter / X" },
                  { value: "facebook", label: "Facebook" },
                  { value: "tiktok", label: "TikTok" },
                  { value: "youtube", label: "YouTube" },
                  { value: "generic", label: "Generic" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                options={[
                  "professional",
                  "funny",
                  "luxury",
                  "casual",
                  "inspirational",
                  "bold",
                  "minimal",
                ].map((tone) => ({ value: tone, label: tone[0].toUpperCase() + tone.slice(1) }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label required>Prompt body</Label>
            <Textarea
              rows={8}
              value={form.promptBody}
              onChange={(e) => setForm({ ...form, promptBody: e.target.value })}
              required
              className="font-mono text-xs rounded-xl"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap items-center gap-x-1 gap-y-1">
              <Hash className="inline h-3 w-3 text-brand-500/80 shrink-0" />
              Placeholders:{" "}
              {PLACEHOLDERS.map((p, i) => (
                <span key={p}>
                  <code className="font-mono text-[10px] text-brand-400/90">{p}</code>
                  {i < PLACEHOLDERS.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Save template
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
