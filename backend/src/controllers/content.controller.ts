import type { Request, Response } from "express";
import { z } from "zod";
import { contentService } from "../services/content.service";
import { aiService } from "../services/ai.service";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

const CONTENT_TYPES = [
  "instagram_caption",
  "linkedin_post",
  "twitter_thread",
  "hashtags",
  "carousel",
  "marketing_copy",
  "campaign_idea",
  "reel_script",
] as const;
const PLATFORMS = ["instagram", "linkedin", "twitter", "facebook", "tiktok", "youtube", "generic"] as const;
const TONES = ["professional", "funny", "luxury", "casual", "inspirational", "bold", "minimal"] as const;

const generateSchema = z.object({
  workspaceId: z.string(),
  contentType: z.enum(CONTENT_TYPES),
  platform: z.enum(PLATFORMS),
  tone: z.enum(TONES),
  extraPrompt: z.string().max(2000).optional(),
  customTemplate: z.string().max(4000).optional(),
  imagePrompt: z.string().max(500).optional(),
  imageStyle: z.string().max(200).optional(),
});

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "approved", "scheduled", "archived"]).optional(),
  tone: z.enum(TONES).optional(),
});

export const contentController = {
  async list(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const { workspaceId, type, platform, status } = req.query as Record<string, string | undefined>;
    res.json({
      contents: await contentService.list(req.user.id, { workspaceId, type, platform, status }),
    });
  },

  async get(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    res.json({ content: await contentService.get(req.user.id, req.params.id) });
  },

  async generate(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = generateSchema.parse(req.body);
    const content = await contentService.generateAndSave(req.user.id, body);
    res.status(201).json({ content });
  },

  /** Server-Sent Events streaming of generation. */
  async generateStream(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = generateSchema.parse(req.body);

    const ws = await prisma.workspace.findUnique({ where: { id: body.workspaceId } });
    if (!ws || ws.userId !== req.user.id) throw ApiError.notFound("Workspace not found");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let full = "";
    try {
      for await (const chunk of aiService.streamText({
        brand: {
          name: ws.name,
          description: ws.description,
          targetAudience: ws.targetAudience,
          industry: ws.industry,
          brandVoice: ws.brandVoice,
        },
        contentType: body.contentType,
        platform: body.platform,
        tone: body.tone,
        extraPrompt: body.extraPrompt,
        customTemplate: body.customTemplate,
      })) {
        full += chunk;
        send("chunk", { delta: chunk });
      }

      let metadata: string | null = null;
      if (
        ["twitter_thread", "hashtags", "carousel", "marketing_copy", "campaign_idea", "reel_script"]
          .includes(body.contentType)
      ) {
        const parsed = aiService.parseJsonLoose(full);
        if (parsed) metadata = JSON.stringify(parsed);
      }

      let imageUrl: string | null = null;
      if (body.imagePrompt) {
        try {
          const img = await aiService.generateImage({
            brand: {
              name: ws.name,
              description: ws.description,
              targetAudience: ws.targetAudience,
              industry: ws.industry,
              brandVoice: ws.brandVoice,
            },
            prompt: body.imagePrompt,
            style: body.imageStyle,
          });
          imageUrl = img.dataUrl;
          send("image", { imageUrl });
        } catch (e) {
          send("image_error", { message: (e as Error).message });
        }
      }

      const saved = await prisma.content.create({
        data: {
          workspaceId: ws.id,
          userId: req.user.id,
          type: body.contentType,
          platform: body.platform,
          tone: body.tone,
          body: full,
          imageUrl,
          metadata,
          prompt: body.extraPrompt,
          status: "draft",
          title: contentService.deriveTitle(full, body.contentType),
        },
        include: { workspace: { select: { id: true, name: true } } },
      });

      send("done", { content: saved });
      res.end();
    } catch (err) {
      send("error", { message: (err as Error).message });
      res.end();
    }
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = updateSchema.parse(req.body);
    res.json({ content: await contentService.update(req.user.id, req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    await contentService.remove(req.user.id, req.params.id);
    res.json({ ok: true });
  },

  async regenerate(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = generateSchema.partial().parse(req.body ?? {});
    res.json({ content: await contentService.regenerate(req.user.id, req.params.id, body) });
  },
};
