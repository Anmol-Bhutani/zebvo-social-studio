import type { Request, Response } from "express";
import { z } from "zod";
import { workspaceService } from "../services/workspace.service";
import { ApiError } from "../utils/ApiError";

const upsertSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  targetAudience: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  brandVoice: z.string().max(500).optional(),
  colorTheme: z.string().max(20).optional(),
});

export const workspaceController = {
  async list(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    res.json({ workspaces: await workspaceService.list(req.user.id) });
  },

  async get(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    res.json({ workspace: await workspaceService.get(req.user.id, req.params.id) });
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = upsertSchema.parse(req.body);
    res.status(201).json({ workspace: await workspaceService.create(req.user.id, body) });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = upsertSchema.partial().parse(req.body);
    res.json({ workspace: await workspaceService.update(req.user.id, req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    await workspaceService.remove(req.user.id, req.params.id);
    res.json({ ok: true });
  },
};
