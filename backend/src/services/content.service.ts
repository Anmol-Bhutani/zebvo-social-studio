import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { aiService, type ContentType, type Platform, type Tone } from "./ai.service";

export interface GenerateContentInput {
  workspaceId: string;
  contentType: ContentType;
  platform: Platform;
  tone: Tone;
  extraPrompt?: string;
  customTemplate?: string;
  imagePrompt?: string;
  imageStyle?: string;
}

export const contentService = {
  async list(
    userId: string,
    filter: { workspaceId?: string; type?: string; platform?: string; status?: string } = {},
  ) {
    return prisma.content.findMany({
      where: {
        userId,
        ...(filter.workspaceId ? { workspaceId: filter.workspaceId } : {}),
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.platform ? { platform: filter.platform } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { workspace: { select: { id: true, name: true } } },
    });
  },

  async get(userId: string, id: string) {
    const c = await prisma.content.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true } },
        versions: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!c || c.userId !== userId) throw ApiError.notFound("Content not found");
    return c;
  },

  async generateAndSave(userId: string, input: GenerateContentInput) {
    const ws = await prisma.workspace.findUnique({ where: { id: input.workspaceId } });
    if (!ws || ws.userId !== userId) throw ApiError.notFound("Workspace not found");

    const text = await aiService.generateText({
      brand: {
        name: ws.name,
        description: ws.description,
        targetAudience: ws.targetAudience,
        industry: ws.industry,
        brandVoice: ws.brandVoice,
      },
      contentType: input.contentType,
      platform: input.platform,
      tone: input.tone,
      extraPrompt: input.extraPrompt,
      customTemplate: input.customTemplate,
    });

    // Try to extract structured metadata for JSON-formatted types
    let metadata: string | null = null;
    if (
      ["twitter_thread", "hashtags", "carousel", "marketing_copy", "campaign_idea", "reel_script"]
        .includes(input.contentType)
    ) {
      const parsed = aiService.parseJsonLoose(text);
      if (parsed) metadata = JSON.stringify(parsed);
    }

    let imageUrl: string | null = null;
    if (input.imagePrompt) {
      try {
        const img = await aiService.generateImage({
          brand: {
            name: ws.name,
            description: ws.description,
            targetAudience: ws.targetAudience,
            industry: ws.industry,
            brandVoice: ws.brandVoice,
          },
          prompt: input.imagePrompt,
          style: input.imageStyle,
        });
        imageUrl = img.dataUrl;
      } catch (e) {
        // image is optional; do not fail the whole generation
        console.warn("[image-gen-skip]", (e as Error).message);
      }
    }

    return prisma.content.create({
      data: {
        workspaceId: ws.id,
        userId,
        type: input.contentType,
        platform: input.platform,
        tone: input.tone,
        body: text,
        imageUrl,
        metadata,
        prompt: input.extraPrompt,
        status: "draft",
        title: this.deriveTitle(text, input.contentType),
      },
      include: { workspace: { select: { id: true, name: true } } },
    });
  },

  async update(userId: string, id: string, data: { title?: string; body?: string; status?: string; tone?: string }) {
    await this.get(userId, id);
    return prisma.content.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.content.delete({ where: { id } });
    return { ok: true };
  },

  async regenerate(userId: string, id: string, overrides: Partial<GenerateContentInput> = {}) {
    const existing = await this.get(userId, id);

    // archive current version
    await prisma.contentVersion.create({
      data: {
        contentId: existing.id,
        body: existing.body,
        imageUrl: existing.imageUrl,
        metadata: existing.metadata,
        prompt: existing.prompt,
      },
    });

    const ws = existing.workspace;
    const workspace = await prisma.workspace.findUnique({ where: { id: ws.id } });
    if (!workspace) throw ApiError.notFound("Workspace missing");

    const text = await aiService.generateText({
      brand: {
        name: workspace.name,
        description: workspace.description,
        targetAudience: workspace.targetAudience,
        industry: workspace.industry,
        brandVoice: workspace.brandVoice,
      },
      contentType: (overrides.contentType || existing.type) as ContentType,
      platform: (overrides.platform || existing.platform) as Platform,
      tone: (overrides.tone || existing.tone) as Tone,
      extraPrompt: overrides.extraPrompt ?? existing.prompt ?? undefined,
      customTemplate: overrides.customTemplate,
    });

    let metadata: string | null = existing.metadata;
    const newType = (overrides.contentType || existing.type) as ContentType;
    if (
      ["twitter_thread", "hashtags", "carousel", "marketing_copy", "campaign_idea", "reel_script"]
        .includes(newType)
    ) {
      const parsed = aiService.parseJsonLoose(text);
      if (parsed) metadata = JSON.stringify(parsed);
    }

    return prisma.content.update({
      where: { id },
      data: {
        body: text,
        metadata,
        title: this.deriveTitle(text, newType),
      },
      include: {
        workspace: { select: { id: true, name: true } },
        versions: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  deriveTitle(body: string, type: ContentType): string {
    if (type === "twitter_thread" || type === "hashtags" || type === "carousel" || type === "marketing_copy" || type === "campaign_idea" || type === "reel_script") {
      return `${type.replace(/_/g, " ")} – ${new Date().toLocaleString()}`;
    }
    const firstLine = body.split("\n").find((l) => l.trim().length > 0) || "Untitled";
    return firstLine.replace(/^#+\s*/, "").slice(0, 80);
  },
};
