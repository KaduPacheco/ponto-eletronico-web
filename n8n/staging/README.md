# n8n staging receiver

Import `lead-automation-receiver.json` only in the staging n8n workspace used for P1 homologation.

## Required protected variable

- `N8N_LEAD_AUTOMATION_SECRET`: same HMAC secret configured in the staging Supabase Edge Functions.

Do not paste this value in chat, commits, PR text, workflow JSON, screenshots, or public reports.

## Import and activation

1. In n8n staging, import `n8n/staging/lead-automation-receiver.json`.
2. Configure `N8N_LEAD_AUTOMATION_SECRET` as a protected n8n variable or environment variable.
3. Verify the Webhook node is `POST` and has Raw Body enabled.
4. Activate the workflow.
5. Copy the production webhook URL from n8n staging and configure it as the staging Edge Function secret `N8N_LEAD_AUTOMATION_URL`.

The workflow has no WhatsApp, e-mail, CRM, or external notification node. It validates the request before responding and produces no external side effects.

## Contract

- Signing input: `${timestamp}.${eventId}.${rawBody}`.
- Signature header: `X-Lead-Signature: sha256=<hex>`.
- Event header: `X-Lead-Event-Id`.
- Timestamp header: `X-Lead-Timestamp`.
- HMAC algorithm: SHA-256.
- Maximum timestamp age: 300 seconds.
- Maximum future skew: 30 seconds.
- Replay store: n8n workflow static data, keyed by `event_id` and SHA-256 body hash.

Duplicate delivery with the same `event_id` and same raw body returns success with `idempotent: true`. Reusing the same `event_id` with a different raw body returns `409`.

## Staging smoke test

Generate the HMAC outside chat and send a request to the n8n staging webhook:

```bash
timestamp="$(date +%s)"
event_id="manual-test-$(uuidgen)"
body='{"lead_id":"synthetic","event_type":"lead.created"}'
signature="$(printf '%s.%s.%s' "$timestamp" "$event_id" "$body" | openssl dgst -sha256 -hmac "$N8N_LEAD_AUTOMATION_SECRET" -hex | sed 's/^.* //')"
curl -i -X POST "$N8N_STAGING_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Lead-Event-Id: $event_id" \
  -H "X-Lead-Timestamp: $timestamp" \
  -H "X-Lead-Signature: sha256=$signature" \
  --data "$body"
```

Expected first response: HTTP 200 with `idempotent: false`. Repeating the exact same command with the same timestamp, event id, signature, and body within the 300-second window should return HTTP 200 with `idempotent: true`.
