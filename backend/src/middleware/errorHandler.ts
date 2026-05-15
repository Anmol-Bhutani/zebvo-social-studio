import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error("[Unhandled Error]", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message,
  });
};
