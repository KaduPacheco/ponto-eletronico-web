import { describe, expect, it } from "vitest";
import { getCorsHeaders, HttpError, readLimitedJson } from "./http";

describe("edge http helpers", () => {
  it("rejects payloads beyond the configured limit before JSON parsing", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "6" },
      body: "123456",
    });

    await expect(readLimitedJson(request, 5)).rejects.toMatchObject({ status: 413 });
  });

  it("rejects a forbidden CORS origin with 403 semantics", () => {
    const request = new Request("https://example.test", {
      headers: { Origin: "https://evil.example" },
    });

    expect(() => getCorsHeaders(request, "https://site.example")).toThrow(HttpError);
    try {
      getCorsHeaders(request, "https://site.example");
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
