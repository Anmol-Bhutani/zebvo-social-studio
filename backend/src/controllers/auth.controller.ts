import type { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 chars"),
  name: z.string().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response) {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    res.json({ user });
  },

  async logout(_req: Request, res: Response) {
    res.json({ ok: true });
  },
};
