"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileDown, Save, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { api, downloadAuthed } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useActiveWorkspace } from "@/store/workspace";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  targetAudience: string | null;
  industry: string | null;
  brandVoice: string | null;
}

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { setActive } = useActiveWorkspace();
  const [form, setForm] = useState<Workspace | null>(null);

  const wsQ = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => api<{ workspace: Workspace }>(`/workspaces/${id}`).then((r) => r.workspace),
    enabled: !!id,
  });

  useEffect(() => {
    if (wsQ.data) {
      setForm(wsQ.data);
      setActive(wsQ.data.id);
    }
  }, [wsQ.data, setActive]);

  const update = useMutation({
    mutationFn: (data: Partial<Workspace>) =>
      api(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", id] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Saved");
    },
    onError: () => toast.error("Save failed"),
  });

  const remove = useMutation({
    mutationFn: () => api(`/workspaces/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      router.replace("/workspaces");
    },
  });

  if (!form) {
    return (
      <AppShell>
        <div className="h-96 rounded-2xl shimmer" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Workspace
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold truncate">{form.name}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => downloadAuthed(`/export/workspace/${id}`, `${form.name}.zip`)}
            className="flex-1 sm:flex-initial"
          >
            <FileDown className="h-4 w-4" />
            <span className="sm:inline">Export ZIP</span>
          </Button>
          <Link href={`/generate?workspaceId=${id}`} className="flex-1 sm:flex-initial">
            <Button className="w-full">
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold">Brand profile</h2>
              <div className="space-y-1.5">
                <Label>Brand name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input
                    value={form.industry || ""}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target audience</Label>
                  <Input
                    value={form.targetAudience || ""}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Brand voice</Label>
                <Input
                  value={form.brandVoice || ""}
                  onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("Delete workspace? All content will be lost.")) {
                      remove.mutate();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button onClick={() => update.mutate(form)} loading={update.isPending}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3">Quick actions</h3>
              <div className="space-y-2">
                <Link href={`/generate?workspaceId=${id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="h-4 w-4" /> Generate content
                  </Button>
                </Link>
                <Link href={`/library?workspaceId=${id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    View content library
                  </Button>
                </Link>
                <Link href={`/schedule?workspaceId=${id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    Open schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
