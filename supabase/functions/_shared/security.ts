export async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function pepperedHash(pepper: string, scope: string, value: string) {
  return sha256Hex(`${scope}:${pepper}:${value}`);
}

export function getTrustedClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor && forwardedFor.length <= 64 ? forwardedFor : "unknown";
}
