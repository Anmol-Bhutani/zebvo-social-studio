import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const GEMINI_MAX_ATTEMPTS = 4;

function isGeminiRateLimit(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
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

/** Retries on 429 / quota — common on Gemini free tier. */
async function withGeminiRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isGeminiRateLimit(err) || attempt === GEMINI_MAX_ATTEMPTS) {
        throw err;
      }
      const suggested = parseRetryAfterMs(err);
      const backoff = suggested ?? Math.min(2500 * 2 ** (attempt - 1), 45_000);
      console.warn(
        `[Gemini] ${label} rate limited (attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}), waiting ${Math.round(backoff / 1000)}s...`,
      );
      await sleep(backoff);
    }
  }
  throw last;
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

// ------------------------------ Gemini Client ------------------------------

function getClient() {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.badRequest(
      "GEMINI_API_KEY is not configured on the server. Add it to backend/.env",
    );
  }
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

export const aiService = {
  /** One-shot text generation. Returns full text. */
  async generateText(input: GenerateInput): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_TEXT_MODEL });
    const prompt = buildSystemPrompt(input);

    const result = await withGeminiRetry("generateContent", () => model.generateContent(prompt));
    const text = result.response.text();
    if (!text) throw ApiError.internal("Empty response from Gemini");
    return text;
  },

  /** Streaming text generation. Yields chunks as they arrive. */
  async *streamText(input: GenerateInput): AsyncGenerator<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_TEXT_MODEL });
    const prompt = buildSystemPrompt(input);

    const streamResult = await withGeminiRetry("generateContentStream", () =>
      model.generateContentStream(prompt),
    );
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  },

  /** Image generation using Gemini image-capable model. Returns base64 data URL. */
  async generateImage(input: {
    brand: BrandContext;
    prompt: string;
    style?: string;
  }): Promise<{ dataUrl: string; mimeType: string }> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: env.GEMINI_IMAGE_MODEL });

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

    try {
      // The image-generation-capable model returns inline image parts.
      const result = await withGeminiRetry("generateImage", () =>
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
