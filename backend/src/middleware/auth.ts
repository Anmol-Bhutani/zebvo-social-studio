import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface JwtPayload {
  sub: string;
  email: string;
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const tokenFromHeader = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const tokenFromCookie = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) return next(ApiError.unauthorized("Missing auth token"));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}
