import type { Request, Response } from "express";
import { z } from "zod";
import { templateService } from "../services/template.service";
import { ApiError } from "../utils/ApiError";

const upsertSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  contentType: z.string(),
  platform: z.string(),
  tone: z.string(),
  promptBody: z.string().min(1).max(4000),
});

export const templateController = {
  async list(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const workspaceId = req.query.workspaceId as string | undefined;
    res.json({ templates: await templateService.list(req.user.id, workspaceId) });
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = upsertSchema.parse(req.body);
    res.status(201).json({ template: await templateService.create(req.user.id, body) });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = upsertSchema.partial().parse(req.body);
    res.json({ template: await templateService.update(req.user.id, req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    await templateService.remove(req.user.id, req.params.id);
    res.json({ ok: true });
  },
};
