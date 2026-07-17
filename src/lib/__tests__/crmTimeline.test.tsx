import { describe, expect, it } from "vitest";
import { buildLeadTimelineItems } from "../crmTimeline";

describe("crmTimeline", () => {
  it("mistura notas e eventos em ordem cronológica reversa", () => {
    const items = buildLeadTimelineItems(
      [
        {
          id: "note-1",
          lead_id: "lead-1",
          author_id: "user-1",
          content: "Primeira nota",
          created_at: "2026-04-12T10:00:00.000Z",
          updated_at: "2026-04-12T10:00:00.000Z",
        },
      ],
      [
        {
          id: "event-1",
          lead_id: "lead-1",
          event_type: "pipeline_change",
          payload: {
            previous_stage: "novo",
            next_stage: "qualificado",
          },
          created_at: "2026-04-12T11:00:00.000Z",
        },
      ],
      new Map(),
      "user-1",
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "event-1",
      title: "Etapa comercial atualizada",
      content: "Novo -> Qualificado",
      tone: "primary",
    });
    expect(items[1]).toMatchObject({
      id: "note-1",
      title: "Nota interna",
      content: "Primeira nota",
    });
  });

  it("resolve labels de ownership usando payload explicito ou mapa local", () => {
    const ownerLabelMap = new Map([
      ["owner-2", "Time comercial"],
    ]);

    const items = buildLeadTimelineItems(
      [],
      [
        {
          id: "event-1",
          lead_id: "lead-1",
          event_type: "owner_changed",
          payload: {
            previous_owner_label: "Sem fila",
            next_owner_id: "owner-2",
          },
          created_at: "2026-04-12T11:00:00.000Z",
        },
      ],
      ownerLabelMap,
      "user-1",
    );

    expect(items[0]).toMatchObject({
      title: "Ownership ajustado",
      content: "Sem fila -> Time comercial",
    });
  });
});
