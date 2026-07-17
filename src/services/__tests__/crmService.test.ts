import { beforeEach, describe, expect, it, vi } from "vitest";

const { singleMock, fromMock } = vi.hoisted(() => {
  const hoistedSingleMock = vi.fn();
  const hoistedSelectMock = vi.fn(() => ({ single: hoistedSingleMock }));
  const hoistedInsertMock = vi.fn(() => ({ select: hoistedSelectMock }));
  const hoistedFromMock = vi.fn(() => ({ insert: hoistedInsertMock }));

  return {
    singleMock: hoistedSingleMock,
    fromMock: hoistedFromMock,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock("@/infra/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

import { logLeadEvent } from "../crmService";

describe("crmService - audit log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna sucesso estruturado quando o evento e gravado", async () => {
    singleMock.mockResolvedValueOnce({
      data: {
        id: "event-1",
        lead_id: "lead-1",
        event_type: "note_added",
        payload: { content_preview: "Teste" },
        created_at: "2026-04-12T10:00:00.000Z",
      },
      error: null,
    });

    const result = await logLeadEvent("lead-1", "note_added", { content_preview: "Teste" });

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        id: "event-1",
        event_type: "note_added",
      }),
    });
    expect(fromMock).toHaveBeenCalledWith("lead_events");
  });

  it("não quebra o fluxo quando o audit log falha", async () => {
    singleMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "RLS blocked",
      },
    });

    const result = await logLeadEvent("lead-1", "task_added", { title: "Ligar" });

    expect(result).toEqual({
      ok: false,
      data: null,
      errorMessage: "RLS blocked",
    });
  });
});
