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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash",
  GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation",
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
