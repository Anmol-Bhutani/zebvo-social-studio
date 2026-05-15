"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Hash,
  MessageSquare,
  Linkedin,
  Twitter,
  Instagram,
  Megaphone,
  Lightbulb,
  Film,
  Image as ImageIcon,
  Layers,
  Save,
  Wand2,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, streamGenerate } from "@/lib/api";
import { useActiveWorkspace } from "@/store/workspace";
import { cn, safeJsonParse } from "@/lib/utils";

const CONTENT_TYPES = [
  { value: "instagram_caption", label: "Instagram caption", icon: Instagram },
  { value: "linkedin_post", label: "LinkedIn post", icon: Linkedin },
  { value: "twitter_thread", label: "Twitter / X thread", icon: Twitter },
  { value: "hashtags", label: "Hashtag pack", icon: Hash },
  { value: "carousel", label: "Carousel slides", icon: Layers },
  { value: "marketing_copy", label: "Marketing copy", icon: Megaphone },
  { value: "campaign_idea", label: "Campaign ideas", icon: Lightbulb },
  { value: "reel_script", label: "Reel / video script", icon: Film },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "generic", label: "Generic" },
];

const TONES = [
  "professional",
  "funny",
  "luxury",
  "casual",
  "inspirational",
  "bold",
  "minimal",
];

interface Workspace {
  id: string;
  name: string;
}

export default function GeneratePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const { activeWorkspaceId, setActive } = useActiveWorkspace();

  const [contentType, setContentType] = useState("instagram_caption");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("modern, premium, vibrant");
  const [generateImage, setGenerateImage] = useState(false);

  const [streamingBody, setStreamingBody] = useState("");
  const [streamedImage, setStreamedImage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const workspacesQ = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  });

  const wsFromParams = params.get("workspaceId");
  const typeFromParams = params.get("type");
  const platformFromParams = params.get("platform");

  useEffect(() => {
    if (wsFromParams) setActive(wsFromParams);
  }, [wsFromParams, setActive]);

  /** Deep-link presets — dashboard quick actions and similar entry points
   * can pass `?type=carousel&platform=instagram` to pre-select the form. */
  useEffect(() => {
    if (typeFromParams && CONTENT_TYPES.some((t) => t.value === typeFromParams)) {
      setContentType(typeFromParams);
    }
    if (platformFromParams && PLATFORMS.some((p) => p.value === platformFromParams)) {
      setPlatform(platformFromParams);
    }
  }, [typeFromParams, platformFromParams]);

  useEffect(() => {
    if (!activeWorkspaceId && workspacesQ.data?.length) {
      setActive(workspacesQ.data[0].id);
    }
  }, [activeWorkspaceId, workspacesQ.data, setActive]);

  const workspaceOptions = useMemo(() => {
    if (workspacesQ.isLoading) {
      return [{ value: "", label: "Loading workspaces…" }];
    }
    if (workspacesQ.isError) {
      return [{ value: "", label: "Failed to load — refresh the page" }];
    }
    if (workspacesQ.data?.length) {
      return workspacesQ.data.map((w) => ({ value: w.id, label: w.name }));
    }
    return [{ value: "", label: "No workspaces yet — create one first" }];
  }, [workspacesQ.data, workspacesQ.isLoading, workspacesQ.isError]);

  const activeWs = workspacesQ.data?.find((w) => w.id === activeWorkspaceId);

  const isStructured = useMemo(
    () =>
      ["twitter_thread", "hashtags", "carousel", "marketing_copy", "campaign_idea", "reel_script"]
        .includes(contentType),
    [contentType],
  );

  async function handleStream() {
    if (!activeWorkspaceId) {
      toast.error("Pick or create a workspace first");
      return;
    }
    if (generateImage && !imagePrompt.trim()) {
      toast.error("Add an image subject or turn off banner image");
      return;
    }
    setStreaming(true);
    setStreamingBody("");
    setStreamedImage(null);
    setSavedId(null);

    try {
      await streamGenerate(
        {
          workspaceId: activeWorkspaceId,
          contentType,
          platform,
          tone,
          extraPrompt: extraPrompt || undefined,
          ...(generateImage && imagePrompt
            ? { imagePrompt, imageStyle }
            : {}),
        },
        {
          onChunk: (delta) => setStreamingBody((s) => s + delta),
          onImage: (url) => setStreamedImage(url),
          onDone: (content) => {
            const c = content as { id: string };
            setSavedId(c.id);
            qc.invalidateQueries({ queryKey: ["recent-content"] });
            qc.invalidateQueries({ queryKey: ["contents"] });
            toast.success("Content generated and saved");
          },
          onError: (msg) => {
            toast.error(msg);
          },
        },
      );
    } catch (e) {
      toast.error((e as Error).message || "Generation failed");
    } finally {
      setStreaming(false);
    }
  }

  const oneShot = useMutation({
    mutationFn: () => {
      if (!activeWorkspaceId) {
        throw new Error("Pick or create a workspace first");
      }
      if (generateImage && !imagePrompt.trim()) {
        throw new Error("Add an image subject or turn off banner image");
      }
      return api<{ content: { id: string } }>("/contents/generate", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          contentType,
          platform,
          tone,
          extraPrompt: extraPrompt || undefined,
          ...(generateImage && imagePrompt ? { imagePrompt, imageStyle } : {}),
        }),
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["recent-content"] });
      qc.invalidateQueries({ queryKey: ["contents"] });
      toast.success("Generated");
      router.push(`/library/${res.content.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyAll() {
    navigator.clipboard.writeText(streamingBody);
    toast.success("Copied to clipboard");
  }

  const SelectedIcon =
    CONTENT_TYPES.find((c) => c.value === contentType)?.icon || Sparkles;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Generate</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {activeWs ? (
              <>
                Generating for <span className="text-brand-500 font-medium">{activeWs.name}</span>
              </>
            ) : (
              "Pick a workspace to begin"
            )}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Workspace</Label>
                <Select
                  value={activeWorkspaceId || ""}
                  onChange={(e) => setActive(e.target.value || null)}
                  options={workspaceOptions}
                  disabled={workspacesQ.isLoading}
                  aria-label="Choose workspace"
                />
                {!workspacesQ.isLoading && !workspacesQ.data?.length ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                    A workspace is your brand profile (voice, audience, industry).{" "}
                    <Link href="/workspaces" className="text-brand-500 font-medium hover:underline">
                      Create one on Workspaces
                    </Link>{" "}
                    — then pick it here and generate.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Content type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setContentType(t.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-left transition-colors",
                        contentType === t.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-500"
                          : "border-[hsl(var(--border))] hover:border-brand-500/40",
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    options={PLATFORMS}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    options={TONES.map((t) => ({
                      value: t,
                      label: t[0].toUpperCase() + t.slice(1),
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Extra instructions (optional)</Label>
                <Textarea
                  rows={3}
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  placeholder="e.g. announce a 20% summer sale, target Gen Z, include CTA to website"
                />
              </div>

              <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Also generate a banner image</span>
                </label>
                {generateImage && (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Image subject (e.g. cozy cafe with latte art)"
                    />
                    <Input
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      placeholder="Style (e.g. cinematic, pastel, flat)"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleStream}
                  loading={streaming}
                  disabled={oneShot.isPending || !activeWorkspaceId}
                >
                  <Wand2 className="h-4 w-4" />
                  Stream generate
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => oneShot.mutate()}
                  loading={oneShot.isPending}
                  disabled={streaming || !activeWorkspaceId}
                  title="One-shot, save & open"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full lg:min-h-[500px]">
            <CardContent className="p-4 sm:p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-[linear-gradient(135deg,hsl(var(--aurora-cyan)/0.15),hsl(var(--aurora-violet)/0.15))] text-brand-500 ring-1 ring-brand-400/20 flex items-center justify-center flex-shrink-0">
                    <SelectedIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold capitalize truncate text-sm sm:text-base">
                      {contentType.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {platform} • {tone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {streamingBody && (
                    <Button variant="outline" size="sm" onClick={copyAll}>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  )}
                  {savedId && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/library/${savedId}`)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Open</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] p-3 sm:p-5 overflow-y-auto min-h-[260px] sm:min-h-[300px]">
                {streaming && !streamingBody ? (
                  <StreamingSkeleton />
                ) : streamingBody ? (
                  <StructuredOutput
                    contentType={contentType}
                    body={streamingBody}
                    isStructured={isStructured}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-sm text-[hsl(var(--muted-foreground))]">
                    <MessageSquare className="h-10 w-10 mb-3 text-brand-500/40" />
                    <p>
                      Pick a content type and hit{" "}
                      <span className="text-brand-500 font-medium">Stream generate</span>.
                    </p>
                    <p className="mt-1 text-xs">
                      Output streams live, then saves to your library automatically.
                    </p>
                  </div>
                )}
              </div>

              {streamedImage && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
                    Generated banner
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={streamedImage}
                    alt="generated"
                    className="rounded-xl max-h-80 border border-[hsl(var(--border))]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StreamingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 rounded shimmer w-3/4" />
      <div className="h-4 rounded shimmer w-full" />
      <div className="h-4 rounded shimmer w-5/6" />
      <div className="h-4 rounded shimmer w-2/3" />
    </div>
  );
}

function StructuredOutput({
  contentType,
  body,
  isStructured,
}: {
  contentType: string;
  body: string;
  isStructured: boolean;
}) {
  if (!isStructured) {
    return <div className="prose-zebvo text-sm">{body}</div>;
  }

  const parsed = safeJsonParse<Record<string, unknown>>(
    body
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim(),
  );

  if (!parsed) {
    return <div className="prose-zebvo text-sm font-mono whitespace-pre-wrap">{body}</div>;
  }

  if (contentType === "twitter_thread" && Array.isArray((parsed as { tweets?: unknown }).tweets)) {
    return (
      <div className="space-y-2">
        {(parsed as { tweets: string[] }).tweets.map((t, i) => (
          <div
            key={i}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
          >
            <Badge variant="brand" className="mb-2">
              Tweet {i + 1}
            </Badge>
            <div className="text-sm">{t}</div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "hashtags" && Array.isArray((parsed as { hashtags?: unknown }).hashtags)) {
    return (
      <div className="flex flex-wrap gap-2">
        {(parsed as { hashtags: string[] }).hashtags.map((h, i) => (
          <span
            key={i}
            className="rounded-full bg-brand-500/10 text-brand-500 px-3 py-1 text-sm font-medium"
          >
            {h}
          </span>
        ))}
      </div>
    );
  }

  if (contentType === "carousel" && Array.isArray((parsed as { slides?: unknown }).slides)) {
    // Theme-aware palette — uses each theme's aurora hue tokens so
    // carousel slides feel native to whichever theme is active.
    // Aurora → cyan/violet/pink, Sunset → amber/coral/rose,
    // Forest → emerald/teal/mint, Neon → cyan/magenta/purple.
    const palettes = [
      "bg-[linear-gradient(135deg,hsl(var(--aurora-cyan))_0%,hsl(var(--aurora-blue))_100%)] text-white",
      "bg-[linear-gradient(135deg,hsl(var(--aurora-blue))_0%,hsl(var(--aurora-violet))_100%)] text-white",
      "bg-[linear-gradient(135deg,hsl(var(--aurora-violet))_0%,hsl(var(--aurora-pink))_100%)] text-white",
      "bg-[linear-gradient(135deg,hsl(var(--aurora-pink))_0%,hsl(var(--aurora-cyan))_100%)] text-white",
      "bg-[linear-gradient(135deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] text-white",
      "bg-[linear-gradient(135deg,hsl(var(--aurora-cyan))_0%,hsl(var(--aurora-violet))_50%,hsl(var(--aurora-pink))_100%)] text-white",
    ];
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {(parsed as { slides: { title?: string; body?: string }[] }).slides.map((s, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-xl p-3 sm:p-4 flex flex-col shadow-soft",
              palettes[i % palettes.length],
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-mono">
              Slide {i + 1}
            </div>
            <div className="font-display text-lg sm:text-xl font-bold mt-2 leading-tight tracking-tight">
              {s.title}
            </div>
            <div className="text-xs sm:text-sm mt-2 opacity-90 leading-snug">{s.body}</div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "marketing_copy" && Array.isArray((parsed as { variants?: unknown }).variants)) {
    return (
      <div className="space-y-2">
        {(parsed as { variants: string[] }).variants.map((v, i) => (
          <div
            key={i}
            className="rounded-xl border border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))]"
          >
            <Badge variant="brand" className="mb-2">
              Variant {i + 1}
            </Badge>
            <div className="text-sm">{v}</div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "campaign_idea" && Array.isArray((parsed as { campaigns?: unknown }).campaigns)) {
    return (
      <div className="space-y-3">
        {(parsed as {
          campaigns: {
            name: string;
            goal: string;
            bigIdea: string;
            channels: string[];
            execution: string;
          }[];
        }).campaigns.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))]"
          >
            <div className="font-display font-semibold">{c.name}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{c.goal}</div>
            <div className="text-sm mt-2">{c.bigIdea}</div>
            <div className="text-xs mt-2 text-[hsl(var(--muted-foreground))]">
              Channels: {c.channels?.join(", ")}
            </div>
            <div className="text-sm mt-1 italic">{c.execution}</div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "reel_script") {
    const p = parsed as {
      hook?: string;
      cta?: string;
      scenes?: { time?: string; onScreen?: string; voiceover?: string; bRoll?: string }[];
    };
    return (
      <div className="space-y-3">
        {p.hook && (
          <div className="rounded-xl bg-brand-500/10 border border-brand-500/30 p-3">
            <Badge variant="brand">Hook</Badge>
            <div className="text-sm mt-2 font-medium">{p.hook}</div>
          </div>
        )}
        {p.scenes?.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))] text-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge>{s.time}</Badge>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Scene {i + 1}</span>
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">On-screen:</span>{" "}
              {s.onScreen}
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">VO:</span> {s.voiceover}
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">B-roll:</span> {s.bRoll}
            </div>
          </div>
        ))}
        {p.cta && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Badge variant="green">CTA</Badge>
            <div className="text-sm mt-2">{p.cta}</div>
          </div>
        )}
      </div>
    );
  }

  return <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(parsed, null, 2)}</pre>;
}
