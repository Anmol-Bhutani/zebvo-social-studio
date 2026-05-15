"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Briefcase, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useActiveWorkspace } from "@/store/workspace";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function OnboardingPage() {
  const router = useRouter();
  const { setActive } = useActiveWorkspace();
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetAudience: "",
    industry: "",
    brandVoice: "",
  });

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      api<{ workspace: { id: string } }>("/workspaces", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      setActive(res.workspace.id);
      toast.success("Workspace created — let's create something amazing.");
      router.replace("/generate");
    },
    onError: () => toast.error("Failed to create workspace"),
  });

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6 safe-top safe-bottom safe-x">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] items-center justify-center shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_12px_28px_-8px_rgb(var(--grad-shadow-1))] mb-5">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Set up your <span className="text-aurora">first</span> brand
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            This context makes every piece of AI content feel on-brand.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Brand name required");
            create.mutate(form);
          }}
          className="glass rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <Label required>Brand name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Coffee Co."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Brand description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What you do, who you serve, what makes you different..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Food & Beverage"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target audience</Label>
              <Input
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="Urban coffee lovers 25-45"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Brand voice (optional)</Label>
            <Input
              value={form.brandVoice}
              onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
              placeholder="Warm, knowledgeable, slightly playful"
            />
          </div>

          <Button type="submit" size="lg" loading={create.isPending} className="w-full">
            <Sparkles className="h-4 w-4" />
            Create workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
