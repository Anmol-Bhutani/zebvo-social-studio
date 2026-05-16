import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const GEMINI_MAX_ATTEMPTS = 4;
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function useOpenRouter(): boolean {
  return Boolean(env.OPENROUTER_API_KEY?.trim());
}

function openRouterHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (env.OPENROUTER_SITE_URL.trim()) {
    h["HTTP-Referer"] = env.OPENROUTER_SITE_URL.trim();
  }
  const title = env.OPENROUTER_APP_TITLE.trim();
  if (title) {
    h["X-Title"] = title;
  }
  return h;
}

function ensureAiConfigured(): void {
  if (useOpenRouter()) return;
  if (!env.GEMINI_API_KEY) {
    throw ApiError.badRequest(
      "No AI provider configured. Set OPENROUTER_API_KEY (recommended) or GEMINI_API_KEY in backend/.env",
    );
  }
}

function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.badRequest(
      "GEMINI_API_KEY is not configured on the server. Add it to backend/.env or use OPENROUTER_API_KEY.",
    );
  }
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

function isRetryableRateLimit(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate limit") ||
    msg.includes("Rate limit") ||
    /rate\s*limit/i.test(msg)
  );
}

/** Parse "Please retry in 28.32s" from Gemini error text. */
function parseRetryAfterMs(err: unknown): number | null {
  const msg = String((err as Error)?.message ?? err);
  const m = msg.match(/retry in\s+([\d.]+)\s*s/i);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000) + 300;
  return null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Retries on 429 / quota — common on Gemini free tier and burst limits upstream. */
async function withAiRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isRetryableRateLimit(err) || attempt === GEMINI_MAX_ATTEMPTS) {
        throw err;
      }
      const suggested = parseRetryAfterMs(err);
      const backoff = suggested ?? Math.min(2500 * 2 ** (attempt - 1), 45_000);
      console.warn(
        `[AI] ${label} rate limited (attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}), waiting ${Math.round(backoff / 1000)}s...`,
      );
      await sleep(backoff);
    }
  }
  throw last;
}

type OpenRouterChatJson = {
  choices?: Array<{
    message?: {
      content?: string | null;
      images?: Array<{ type?: string; image_url?: { url?: string } }>;
    };
    delta?: { content?: string | null };
    error?: { message?: string };
  }>;
  error?: { message?: string };
};

function extractOpenRouterErrorMessage(json: OpenRouterChatJson, status: number): string {
  const fromTop = json.error?.message;
  if (fromTop) return fromTop;
  const fromChoice = json.choices?.[0]?.error;
  if (fromChoice && typeof fromChoice === "object" && "message" in fromChoice) {
    return String((fromChoice as { message?: string }).message ?? "");
  }
  return `HTTP ${status}`;
}

async function openRouterComplete(prompt: string): Promise<string> {
  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });
  const json = (await res.json()) as OpenRouterChatJson;
  if (!res.ok) {
    throw new Error(extractOpenRouterErrorMessage(json, res.status));
  }
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Empty response from OpenRouter");
  }
  return content;
}

async function* openRouterStream(prompt: string): AsyncGenerator<string> {
  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
    }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as OpenRouterChatJson;
    throw new Error(extractOpenRouterErrorMessage(json, res.status));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("OpenRouter stream: no response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as OpenRouterChatJson;
        if (parsed.error?.message) throw new Error(parsed.error.message);
        const ce = parsed.choices?.[0]?.error;
        if (ce && typeof ce === "object" && "message" in ce && typeof (ce as { message?: string }).message === "string") {
          throw new Error((ce as { message: string }).message);
        }
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

async function openRouterGenerateImage(fullPrompt: string): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model: env.OPENROUTER_IMAGE_MODEL,
      messages: [{ role: "user", content: fullPrompt }],
      modalities: ["image", "text"],
    }),
  });
  const json = (await res.json()) as OpenRouterChatJson;
  if (!res.ok) {
    throw new Error(extractOpenRouterErrorMessage(json, res.status));
  }
  const images = json.choices?.[0]?.message?.images;
  if (!images?.length) {
    throw new Error("No image in OpenRouter response (check OPENROUTER_IMAGE_MODEL supports image output)");
  }
  for (const part of images) {
    const url = part.image_url?.url;
    if (url?.startsWith("data:")) {
      const semi = url.indexOf(";");
      const mimeType = semi > 5 ? url.slice(5, semi) : "image/png";
      return { dataUrl: url, mimeType };
    }
  }
  throw new Error("OpenRouter returned images without a data URL");
}

export type ContentType =
  | "instagram_caption"
  | "linkedin_post"
  | "twitter_thread"
  | "hashtags"
  | "carousel"
  | "marketing_copy"
  | "campaign_idea"
  | "reel_script";

export type Platform =
  | "instagram"
  | "linkedin"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "generic";

export type Tone =
  | "professional"
  | "funny"
  | "luxury"
  | "casual"
  | "inspirational"
  | "bold"
  | "minimal";

export interface BrandContext {
  name: string;
  description?: string | null;
  targetAudience?: string | null;
  industry?: string | null;
  brandVoice?: string | null;
}

export interface GenerateInput {
  brand: BrandContext;
  contentType: ContentType;
  platform: Platform;
  tone: Tone;
  extraPrompt?: string;
  customTemplate?: string;
}

// ------------------------------ Prompt Builders ------------------------------

const PLATFORM_GUIDE: Record<Platform, string> = {
  instagram:
    "Optimize for Instagram: emotional hook in line 1, 2200 char max but ideally 125-150 visible chars before truncation, friendly emojis sparingly.",
  linkedin:
    "Optimize for LinkedIn: professional, story-driven, 3-5 short paragraphs, single-line hook, value-first, ends with a question or CTA.",
  twitter:
    "Optimize for Twitter/X: punchy, under 280 chars per tweet, no fluff, opinion-led.",
  facebook: "Optimize for Facebook: conversational, mid-length, warm tone.",
  tiktok:
    "Optimize for TikTok: spoken-word style, hook-driven, scriptable in under 60 seconds.",
  youtube: "Optimize for YouTube: SEO-aware, descriptive, clickable.",
  generic: "Optimize for cross-platform sharing.",
};

const TONE_GUIDE: Record<Tone, string> = {
  professional: "credible, expert, polished, no slang",
  funny: "witty, light, playful, use clever wordplay",
  luxury: "refined, aspirational, exclusive, evocative vocabulary",
  casual: "friendly, conversational, easygoing",
  inspirational: "uplifting, motivational, action-oriented",
  bold: "punchy, confident, opinionated, strong verbs",
  minimal: "concise, restrained, no filler",
};

const TYPE_INSTRUCTIONS: Record<ContentType, string> = {
  instagram_caption:
    "Write ONE Instagram caption with a strong hook line, a 2-3 sentence body, a CTA, and 5-8 highly relevant hashtags at the end on a new line.",
  linkedin_post:
    "Write ONE LinkedIn post: hook line, 3-5 short paragraphs, end with an engaging question.",
  twitter_thread:
    "Write a Twitter/X thread of 5-7 tweets. Return STRICT JSON: {\"tweets\":[\"...\",\"...\"]}. No prose outside JSON. Each tweet under 280 chars.",
  hashtags:
    "Generate 20 highly relevant hashtags. Return STRICT JSON: {\"hashtags\":[\"#tag1\",\"#tag2\",...]}. No prose outside JSON.",
  carousel:
    "Design a 6-slide Instagram carousel. Return STRICT JSON: {\"slides\":[{\"title\":\"...\",\"body\":\"...\"}, ...]}. Slide 1 is hook, last slide is CTA.",
  marketing_copy:
    "Write 3 short marketing copy variants (taglines/ad copy). Return STRICT JSON: {\"variants\":[\"...\",\"...\",\"...\"]}.",
  campaign_idea:
    "Propose 3 campaign ideas with goal, big idea, channels, and one-line execution. Return STRICT JSON: {\"campaigns\":[{\"name\":\"...\",\"goal\":\"...\",\"bigIdea\":\"...\",\"channels\":[\"...\"],\"execution\":\"...\"}]}.",
  reel_script:
    "Write a 30-45s short-form video/reel script with on-screen text, voiceover, and B-roll cues. Return STRICT JSON: {\"hook\":\"...\",\"scenes\":[{\"time\":\"0-3s\",\"onScreen\":\"...\",\"voiceover\":\"...\",\"bRoll\":\"...\"}],\"cta\":\"...\"}.",
};

export function buildSystemPrompt(input: GenerateInput): string {
  const { brand, contentType, platform, tone, extraPrompt, customTemplate } = input;

  if (customTemplate && customTemplate.trim().length > 0) {
    return customTemplate
      .replaceAll("{brand}", brand.name)
      .replaceAll("{description}", brand.description || "")
      .replaceAll("{audience}", brand.targetAudience || "")
      .replaceAll("{industry}", brand.industry || "")
      .replaceAll("{voice}", brand.brandVoice || "")
      .replaceAll("{tone}", tone)
      .replaceAll("{platform}", platform)
      .replaceAll("{extra}", extraPrompt || "");
  }

  return [
    "You are Zebvo, an elite social media strategist and senior copywriter.",
    "Generate content that is on-brand, scroll-stopping, and conversion-aware.",
    "",
    "=== BRAND CONTEXT ===",
    `Brand: ${brand.name}`,
    brand.description ? `Description: ${brand.description}` : "",
    brand.targetAudience ? `Target Audience: ${brand.targetAudience}` : "",
    brand.industry ? `Industry: ${brand.industry}` : "",
    brand.brandVoice ? `Brand Voice: ${brand.brandVoice}` : "",
    "",
    "=== TASK ===",
    TYPE_INSTRUCTIONS[contentType],
    "",
    "=== PLATFORM ===",
    PLATFORM_GUIDE[platform],
    "",
    "=== TONE ===",
    `Tone profile: ${TONE_GUIDE[tone]}`,
    "",
    extraPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${extraPrompt}` : "",
    "",
    "Rules:",
    "- No meta commentary like 'Here is...' or 'Sure!'",
    "- Output only what the task asks for.",
    "- If a JSON format is requested, output ONLY valid JSON.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const aiService = {
  /** One-shot text generation. Returns full text. */
  async generateText(input: GenerateInput): Promise<string> {
    ensureAiConfigured();
    const prompt = buildSystemPrompt(input);

    if (useOpenRouter()) {
      const text = await withAiRetry("openRouter.generateText", () => openRouterComplete(prompt));
      if (!text) throw ApiError.internal("Empty response from OpenRouter");
      return text;
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_TEXT_MODEL });
    const result = await withAiRetry("gemini.generateContent", () => model.generateContent(prompt));
    const text = result.response.text();
    if (!text) throw ApiError.internal("Empty response from Gemini");
    return text;
  },

  /** Streaming text generation. Yields chunks as they arrive. */
  async *streamText(input: GenerateInput): AsyncGenerator<string> {
    ensureAiConfigured();
    const prompt = buildSystemPrompt(input);

    if (useOpenRouter()) {
      let last: unknown;
      for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
        try {
          for await (const chunk of openRouterStream(prompt)) {
            yield chunk;
          }
          return;
        } catch (err) {
          last = err;
          if (!isRetryableRateLimit(err) || attempt === GEMINI_MAX_ATTEMPTS) {
            throw err;
          }
          const suggested = parseRetryAfterMs(err);
          const backoff = suggested ?? Math.min(2500 * 2 ** (attempt - 1), 45_000);
          console.warn(
            `[AI] openRouter.streamText rate limited (attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}), waiting ${Math.round(backoff / 1000)}s...`,
          );
          await sleep(backoff);
        }
      }
      throw last;
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_TEXT_MODEL });
    const streamResult = await withAiRetry("gemini.generateContentStream", () =>
      model.generateContentStream(prompt),
    );
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  },

  /** Image generation: OpenRouter Gemini image model, or legacy Google SDK. */
  async generateImage(input: {
    brand: BrandContext;
    prompt: string;
    style?: string;
  }): Promise<{ dataUrl: string; mimeType: string }> {
    ensureAiConfigured();

    const fullPrompt = [
      `Create a high-quality social media banner for the brand "${input.brand.name}".`,
      input.brand.description ? `Brand context: ${input.brand.description}.` : "",
      input.brand.industry ? `Industry: ${input.brand.industry}.` : "",
      input.style ? `Visual style: ${input.style}.` : "Visual style: modern, premium, clean.",
      `Subject / theme: ${input.prompt}`,
      "Composition: centered, marketing-quality, no watermark, no text unless requested.",
    ]
      .filter(Boolean)
      .join("\n");

    if (useOpenRouter()) {
      try {
        return await withAiRetry("openRouter.generateImage", () => openRouterGenerateImage(fullPrompt));
      } catch (err) {
        throw ApiError.internal(`Image generation failed: ${(err as Error).message}`);
      }
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_IMAGE_MODEL });

    try {
      const result = await withAiRetry("gemini.generateImage", () =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          // @ts-expect-error – responseModalities is supported by image-gen models
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      );

      const parts = result.response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        const inline = (part as { inlineData?: { data: string; mimeType: string } }).inlineData;
        if (inline?.data) {
          return {
            dataUrl: `data:${inline.mimeType};base64,${inline.data}`,
            mimeType: inline.mimeType,
          };
        }
      }
      throw new Error("No image in response");
    } catch (err) {
      throw ApiError.internal(
        `Image generation failed: ${(err as Error).message}. Ensure GEMINI_IMAGE_MODEL supports image output.`,
      );
    }
  },

  /** Parse JSON from AI output, tolerant of code fences. */
  parseJsonLoose<T = unknown>(raw: string): T | null {
    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  },
};
