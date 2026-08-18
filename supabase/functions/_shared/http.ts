export const MAX_JSON_BYTES = 32 * 1024;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function assertJsonPost(request: Request) {
  if (request.method !== "POST") {
    throw new HttpError(405, "Method not allowed");
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.split(";").some((part) => part.trim() === "application/json")) {
    throw new HttpError(415, "Unsupported media type");
  }
}

export async function readLimitedJson(request: Request, maxBytes = MAX_JSON_BYTES) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new HttpError(400, "Invalid Content-Length");
    }
    if (parsedLength > maxBytes) {
      throw new HttpError(413, "Payload too large");
    }
  }

  const body = request.body;
  if (!body) {
    throw new HttpError(400, "Missing request body");
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new HttpError(413, "Payload too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const rawBody = new TextDecoder().decode(bytes);
  try {
    return { rawBody, value: JSON.parse(rawBody) as unknown };
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function getCorsHeaders(request: Request, allowedOrigin: string) {
  const requestOrigin = request.headers.get("origin")?.trim();
  if (!requestOrigin || requestOrigin !== allowedOrigin) {
    throw new HttpError(403, "Origin not allowed");
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function safeCorsHeaders(request: Request, allowedOrigin?: string) {
  const origin = request.headers.get("origin")?.trim();
  return origin && allowedOrigin && origin === allowedOrigin
    ? { "Access-Control-Allow-Origin": allowedOrigin, "Vary": "Origin" }
    : { "Vary": "Origin" };
}
