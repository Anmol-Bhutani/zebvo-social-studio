const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

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

  const res = await fetch(`${API_BASE}/api${path}`, {
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
  const url = new URL(`${API_BASE}/api${path}`);
  if (token) url.searchParams.set("token", token); // server doesn't use this; download via fetch instead
  return url.toString();
}

/** Download a file via fetch with auth headers, then trigger browser save. */
export async function downloadAuthed(path: string, suggestedName?: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
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
  const res = await fetch(`${API_BASE}/api/contents/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const block of events) {
      const lines = block.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (event === "chunk") handlers.onChunk?.(parsed.delta);
        else if (event === "image") handlers.onImage?.(parsed.imageUrl);
        else if (event === "done") handlers.onDone?.(parsed.content);
        else if (event === "error") handlers.onError?.(parsed.message);
      } catch {
        /* ignore parse */
      }
    }
  }
}
