# P1 security E2E checklist

- [ ] `create_lead_intake` executes only through `service_role`; direct anon/authenticated calls are denied.
- [ ] Manager/admin close as won with a positive value and as lost with a non-empty reason; cancelling the dialog leaves the stage unchanged.
- [ ] Multiple tasks, completion, and reopening recalculate the nearest open next action or set both fields to `NULL`.
- [ ] Replay, expired timestamp, and invalid HMAC are rejected; n8n failure leaves a retryable outbox record.
- [ ] Authorized CORS succeeds; absent and unauthorized origins fail without `*`.
- [ ] Unprovisioned authenticated users have no CRM access; `agent` is not a functional role.
