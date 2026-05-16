/**
 * Backend origin (no path). If unset, browser uses `window.location.origin` so
 * production can call `/api/*` on the same Vercel deployment (multi-service).
 */
function getApiOrigin(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return vercelHost.startsWith("http")
      ? vercelHost.replace(/\/$/, "")
      : `https://${vercelHost.replace(/\/$/, "")}`;
  }
  return "http://localhost:5050";
}

const TOKEN_KEY = "zebvo:token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiOrigin()}/api${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    let payload: { error?: string; details?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, payload.error || res.statusText, payload.details);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export function apiDownloadUrl(path: string) {
  const token = getToken();
  const url = new URL(`/api${path}`, `${getApiOrigin()}/`);
  if (token) url.searchParams.set("token", token); // server doesn't use this; download via fetch instead
  return url.toString();
}

/** Download a file via fetch with auth headers, then trigger browser save. */
export async function downloadAuthed(path: string, suggestedName?: string) {
  const token = getToken();
  const res = await fetch(`${getApiOrigin()}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  if (suggestedName) a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** SSE streaming for AI generation. */
export async function streamGenerate(
  body: Record<string, unknown>,
  handlers: {
    onChunk?: (delta: string) => void;
    onImage?: (imageUrl: string) => void;
    onDone?: (content: unknown) => void;
    onError?: (msg: string) => void;
  },
) {
  const token = getToken();
  const res = await fetch(`${getApiOrigin()}/api/contents/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      try {
        const j = JSON.parse(text) as { error?: string; message?: string };
        message = j.error || j.message || message;
      } catch {
        if (text.trim()) message = text;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  function dispatchBlock(block: string) {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split("\n");
    let event = "message";
    const dataParts: string[] = [];
    for (const raw of lines) {
      const line = raw.replace(/\r$/, "");
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataParts.push(line.slice(5).trimStart());
    }
    const data = dataParts.join("\n");
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (event === "chunk") {
        const delta = typeof parsed.delta === "string" ? parsed.delta : "";
        handlers.onChunk?.(delta);
      } else if (event === "image") {
        const url = typeof parsed.imageUrl === "string" ? parsed.imageUrl : "";
        if (url) handlers.onImage?.(url);
      } else if (event === "done") handlers.onDone?.(parsed.content);
      else if (event === "error") {
        const msg =
          typeof parsed.message === "string" ? parsed.message : "Generation error";
        handlers.onError?.(msg);
      } else if (event === "image_error") {
        const msg =
          typeof parsed.message === "string"
            ? parsed.message
            : "Image generation failed";
        handlers.onError?.(msg);
      }
    } catch {
      /* ignore parse */
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    if (done) {
      for (const block of buffer.split(/\n\n+/)) dispatchBlock(block);
      break;
    }
    const parts = buffer.split(/\n\n+/);
    buffer = parts.pop() ?? "";
    for (const block of parts) dispatchBlock(block);
  }
}
