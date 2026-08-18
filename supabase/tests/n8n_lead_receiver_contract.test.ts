import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const workflowPath = resolve(process.cwd(), "n8n/staging/lead-automation-receiver.json");
const workflowText = readFileSync(workflowPath, "utf8");
const workflow = JSON.parse(workflowText) as {
  nodes: Array<{ name: string; type: string; parameters?: { jsCode?: string; options?: Record<string, unknown> } }>;
};

const codeNode = workflow.nodes.find((node) => node.name === "Validate HMAC and replay");
const webhookNode = workflow.nodes.find((node) => node.name === "POST lead event");

async function runReceiver(input: {
  eventId?: string;
  timestamp?: number;
  rawBody?: string;
  signature?: string;
  secret?: string;
  staticData?: Record<string, unknown>;
  now?: number;
}) {
  const staticData = input.staticData ?? {};
  const jsCode = codeNode?.parameters?.jsCode;
  if (!jsCode) throw new Error("Missing n8n receiver code");

  const originalNow = Date.now;
  Date.now = () => input.now ?? 1_800_000_000_000;
  try {
    const runner = new Function(
      "require",
      "$vars",
      "$env",
      "$input",
      "$getWorkflowStaticData",
      `return (async () => { ${jsCode} })();`,
    );
    const result = await runner(
      require,
      { N8N_LEAD_AUTOMATION_SECRET: input.secret ?? "receiver-secret" },
      {},
      {
        all: () => [
          {
            json: {
              headers: {
                "X-Lead-Event-Id": input.eventId ?? "event-1",
                "X-Lead-Timestamp": String(input.timestamp ?? 1_800_000_000),
                "X-Lead-Signature":
                  input.signature ??
                  sign(
                    input.secret ?? "receiver-secret",
                    input.timestamp ?? 1_800_000_000,
                    input.eventId ?? "event-1",
                    input.rawBody ?? '{"lead_id":"lead-1"}',
                  ),
              },
              rawBody: input.rawBody ?? '{"lead_id":"lead-1"}',
            },
          },
        ],
      },
      () => staticData,
    );
    return { response: result[0].json as { statusCode: number; body: Record<string, unknown> }, staticData };
  } finally {
    Date.now = originalNow;
  }
}

function sign(secret: string, timestamp: number, eventId: string, rawBody: string) {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${eventId}.${rawBody}`, "utf8").digest("hex")}`;
}

describe("n8n staging lead receiver contract", () => {
  it("imports as JSON with a POST webhook using raw body", () => {
    expect(webhookNode?.type).toBe("n8n-nodes-base.webhook");
    expect(webhookNode?.parameters?.options?.rawBody).toBe(true);
    expect(workflow.nodes.some((node) => node.type === "n8n-nodes-base.respondToWebhook")).toBe(true);
  });

  it("accepts a valid HMAC", async () => {
    const { response } = await runReceiver({});
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ ok: true, idempotent: false, event_id: "event-1" });
  });

  it("rejects a tampered signature", async () => {
    const { response } = await runReceiver({ signature: `sha256=${"0".repeat(64)}` });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("invalid_signature");
  });

  it("rejects an expired timestamp", async () => {
    const timestamp = 1_799_999_699;
    const rawBody = '{"lead_id":"lead-1"}';
    const { response } = await runReceiver({
      timestamp,
      rawBody,
      signature: sign("receiver-secret", timestamp, "event-1", rawBody),
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("timestamp_expired");
  });

  it("rejects an excessive future timestamp", async () => {
    const timestamp = 1_800_000_031;
    const rawBody = '{"lead_id":"lead-1"}';
    const { response } = await runReceiver({
      timestamp,
      rawBody,
      signature: sign("receiver-secret", timestamp, "event-1", rawBody),
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("timestamp_in_future");
  });

  it("returns idempotent success for an identical duplicate", async () => {
    const staticData = {};
    await runReceiver({ staticData });
    const { response } = await runReceiver({ staticData });
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ ok: true, idempotent: true });
  });

  it("rejects replay with a different payload for the same event id", async () => {
    const staticData = {};
    await runReceiver({ staticData });
    const rawBody = '{"lead_id":"lead-2"}';
    const { response } = await runReceiver({
      staticData,
      rawBody,
      signature: sign("receiver-secret", 1_800_000_000, "event-1", rawBody),
    });
    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("event_replay_payload_mismatch");
  });

  it("fails closed when the receiver secret is missing", async () => {
    const { response } = await runReceiver({ secret: "" });
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("receiver_not_configured");
  });

  it("stores replay state by event id and body hash", async () => {
    const staticData = {};
    await runReceiver({ staticData });
    expect(staticData).toEqual({
      replay: {
        "event-1": {
          bodyHash: createHash("sha256").update('{"lead_id":"lead-1"}', "utf8").digest("hex"),
          seenAt: 1_800_000_000,
        },
      },
    });
  });

  it("does not export URLs, tokens, secrets, or credentials", () => {
    expect(workflowText).not.toMatch(/https?:\/\//i);
    expect(workflowText).not.toMatch(/sb_(secret|service)_/i);
    expect(workflowText).not.toMatch(/service[_-]?role/i);
    expect(workflowText).not.toMatch(/bearer\s+[a-z0-9._-]+/i);
    expect(workflowText).not.toMatch(/credential/i);
    expect(workflowText).not.toMatch(/receiver-secret/i);
  });
});
