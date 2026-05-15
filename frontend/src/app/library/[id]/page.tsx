"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Copy,
  FileDown,
  RefreshCw,
  Save,
  Trash2,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Select, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { api, downloadAuthed } from "@/lib/api";
import { formatDateTime, safeJsonParse } from "@/lib/utils";

interface Version {
  id: string;
  body: string;
  createdAt: string;
}
interface Content {
  id: string;
  title: string | null;
  body: string;
  type: string;
  platform: string;
  tone: string;
  status: string;
  metadata: string | null;
  imageUrl: string | null;
  createdAt: string;
  workspace: { id: string; name: string };
  versions: Version[];
}

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("draft");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");

  const cQ = useQuery({
    queryKey: ["content", id],
    queryFn: () => api<{ content: Content }>(`/contents/${id}`).then((r) => r.content),
    enabled: !!id,
  });

  useEffect(() => {
    if (cQ.data) {
      setTitle(cQ.data.title || "");
      setBody(cQ.data.body);
      setStatus(cQ.data.status);
    }
  }, [cQ.data]);

  const save = useMutation({
    mutationFn: () =>
      api(`/contents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, body, status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", id] });
      qc.invalidateQueries({ queryKey: ["contents"] });
      toast.success("Saved");
    },
    onError: () => toast.error("Save failed"),
  });

  const remove = useMutation({
    mutationFn: () => api(`/contents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      toast.success("Deleted");
      router.replace("/library");
    },
  });

  const regenerate = useMutation({
    mutationFn: () => api(`/contents/${id}/regenerate`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", id] });
      toast.success("Regenerated — previous version archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const schedule = useMutation({
    mutationFn: () =>
      api("/schedules", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: cQ.data?.workspace.id,
          contentId: id,
          scheduledAt: new Date(scheduledAt).toISOString(),
          note,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["content", id] });
      setShowSchedule(false);
      setScheduledAt("");
      setNote("");
      toast.success("Scheduled (UI-only)");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cQ.isLoading || !cQ.data) {
    return (
      <AppShell>
        <div className="h-96 rounded-2xl shimmer" />
      </AppShell>
    );
  }

  const c = cQ.data;
  const meta = safeJsonParse<Record<string, unknown>>(c.metadata);

  return (
    <AppShell>
      <button
        onClick={() => router.back()}
        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="brand">{c.platform}</Badge>
            <Badge>{c.type.replace(/_/g, " ")}</Badge>
            <Badge>{c.tone}</Badge>
            <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              • {c.workspace.name} • {formatDateTime(c.createdAt)}
            </span>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display text-xl sm:text-2xl font-semibold !h-auto !py-2 border-transparent hover:border-[hsl(var(--border))]"
            placeholder="Untitled"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Body</Label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(body);
                    toast.success("Copied");
                  }}
                  className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {c.imageUrl && (
            <Card>
              <CardContent className="p-5">
                <Label>Generated image</Label>
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt="generated"
                    className="rounded-xl max-h-96 border border-[hsl(var(--border))]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {meta && (
            <Card>
              <CardContent className="p-5">
                <Label>Structured data</Label>
                <pre className="mt-2 text-xs font-mono p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] overflow-auto max-h-60">
                  {JSON.stringify(meta, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "approved", label: "Approved" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </div>
              <Button className="w-full" onClick={() => save.mutate()} loading={save.isPending}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => regenerate.mutate()}
                loading={regenerate.isPending}
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSchedule(true)}
              >
                <Calendar className="h-4 w-4" /> Schedule
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowVersions(true)}
                disabled={!c.versions.length}
              >
                <History className="h-4 w-4" /> Versions ({c.versions.length})
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm("Delete this content?")) remove.mutate();
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                Export
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    downloadAuthed(`/export/content/${id}?format=pdf`, `${c.title || c.type}.pdf`)
                  }
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    downloadAuthed(`/export/content/${id}?format=md`, `${c.title || c.type}.md`)
                  }
                >
                  <FileDown className="h-4 w-4" /> Markdown
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    downloadAuthed(`/export/content/${id}?format=json`, `${c.title || c.type}.json`)
                  }
                >
                  <FileDown className="h-4 w-4" /> JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule post">
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Scheduling is UI-only as specified in the task — no actual publishing occurs.
          </p>
          <div className="space-y-1.5">
            <Label required>Date & time</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. coordinate with launch campaign"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSchedule(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => schedule.mutate()}
              loading={schedule.isPending}
              disabled={!scheduledAt}
            >
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="Version history" size="lg">
        {c.versions.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">No versions yet.</div>
        ) : (
          <div className="space-y-3">
            {c.versions.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted))]/30"
              >
                <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                  {formatDateTime(v.createdAt)}
                </div>
                <pre className="whitespace-pre-wrap text-sm">{v.body}</pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
