import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  PORT: parseInt(process.env.PORT || "5050", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  JWT_SECRET: required("JWT_SECRET", "dev-secret-change-me-in-production-please-32+chars"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  /** Legacy direct Google AI SDK — optional if OpenRouter is configured. */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash",
  GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation",

  /** OpenRouter (OpenAI-compatible API): pays from credit balance; avoids Gemini free-tier quotas. */
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image",
  /** Optional attribution headers for OpenRouter (recommended). */
  OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL || "",
  OPENROUTER_APP_TITLE: process.env.OPENROUTER_APP_TITLE || "Zebvo",
};

/** Merge configured origins with this deployment's hostname (every Preview/Production URL). */
export function getCorsAllowedOrigins(): string[] {
  const fromEnv = env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
  const set = new Set(fromEnv);
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    const normalized = vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
    set.add(normalized.replace(/\/$/, ""));
  }
  return [...set];
}
