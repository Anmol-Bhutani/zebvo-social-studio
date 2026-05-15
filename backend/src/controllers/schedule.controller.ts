import type { Request, Response } from "express";
import { z } from "zod";
import { scheduleService } from "../services/schedule.service";
import { ApiError } from "../utils/ApiError";

const createSchema = z.object({
  workspaceId: z.string(),
  contentId: z.string(),
  scheduledAt: z.string(),
  note: z.string().max(500).optional(),
});

const updateSchema = z.object({
  scheduledAt: z.string().optional(),
  note: z.string().max(500).optional(),
  status: z.enum(["scheduled", "draft", "published_mock"]).optional(),
});

export const scheduleController = {
  async list(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const workspaceId = req.query.workspaceId as string | undefined;
    res.json({ schedules: await scheduleService.list(req.user.id, workspaceId) });
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = createSchema.parse(req.body);
    res.status(201).json({ schedule: await scheduleService.create(req.user.id, body) });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const body = updateSchema.parse(req.body);
    res.json({ schedule: await scheduleService.update(req.user.id, req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    await scheduleService.remove(req.user.id, req.params.id);
    res.json({ ok: true });
  },
};
