import { describe, expect, it, vi } from "vitest";
import { selectLeadDetailViewModel } from "@/features/crm/leads/detail/selectors/leadDetailSelectors";
import type { CrmLead, CrmLeadEvent, CrmLeadNote, CrmLeadTask } from "@/types/crm";

function createLead(overrides: Partial<CrmLead> = {}): CrmLead {
  return {
    id: "lead-1",
    nome: "Lead Alpha",
    whatsapp: "+55 (11) 99999-0000",
    email: "lead@example.com",
    empresa: "Empresa Alpha",
    funcionarios: 22,
    origem: "meta_ads",
    status: "novo",
    pipeline_stage: "em_contato",
    owner_id: "owner-1",
    lifetime_value: null,
    created_at: "2026-04-14T10:00:00.000Z",
    updated_at: "2026-04-14T10:00:00.000Z",
    last_interaction_at: null,
    ...overrides,
  };
}

function createTask(overrides: Partial<CrmLeadTask> = {}): CrmLeadTask {
  return {
    id: "task-1",
    lead_id: "lead-1",
    assignee_id: "owner-1",
    title: "Ligar hoje",
    due_date: "2026-04-15T10:00:00.000Z",
    completed: false,
    created_at: "2026-04-14T10:00:00.000Z",
    updated_at: "2026-04-14T10:00:00.000Z",
    ...overrides,
  };
}

function createNote(overrides: Partial<CrmLeadNote> = {}): CrmLeadNote {
  return {
    id: "note-1",
    lead_id: "lead-1",
    author_id: "owner-1",
    content: "Cliente pediu retorno amanha",
    created_at: "2026-04-14T11:00:00.000Z",
    updated_at: "2026-04-14T11:00:00.000Z",
    ...overrides,
  };
}

function createEvent(overrides: Partial<CrmLeadEvent> = {}): CrmLeadEvent {
  return {
    id: "event-1",
    lead_id: "lead-1",
    event_type: "pipeline_change",
    payload: {
      previous_stage: "novo",
      next_stage: "em_contato",
    },
    created_at: "2026-04-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("leadDetailSelectors", () => {
  it("builds the detail view model without chánging stage, owner and timeline derivations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:30:00.000Z"));

    const viewModel = selectLeadDetailViewModel({
      lead: createLead(),
      tasks: [createTask()],
      ownerIds: ["owner-1", "owner-2"],
      notes: [createNote()],
      events: [createEvent()],
      currentUser: {
        id: "owner-1",
        email: "owner@example.com",
        user_metadata: {},
      },
    });

    expect(viewModel.currentStage).toBe("em_contato");
    expect(viewModel.currentOwnerLabel).toBe("Você");
    expect(viewModel.selectedStageValue).toBe("em_contato");
    expect(viewModel.currentStageLabel).toBe("Em contato");
    expect(viewModel.taskSummary.openCount).toBe(1);
    expect(viewModel.ownerOptions).toHaveLength(2);
    expect(viewModel.timelineItems).toHaveLength(2);
    expect(viewModel.nextTaskHelper).toContain("Ate");
    expect(viewModel.openTasksHelper).toBe("0 vencidas");

    vi.useRealTimers();
  });

  it("falls back correctly when the lead has no stage, owner or open tasks", () => {
    const viewModel = selectLeadDetailViewModel({
      lead: createLead({
        owner_id: null,
        pipeline_stage: null,
        status: "",
        origem: "",
      }),
      tasks: [],
      ownerIds: [],
      notes: [],
      events: [],
      currentUser: null,
    });

    expect(viewModel.currentStage).toBe("without_stage");
    expect(viewModel.currentOwnerLabel).toBe("Sem responsável");
    expect(viewModel.selectedStageValue).toBe("");
    expect(viewModel.currentStageLabel).toBe("Sem etapa");
    expect(viewModel.currentStageDescription).toContain("não foi classificado");
    expect(viewModel.nextTaskHelper).toContain("Crie uma tarefa");
    expect(viewModel.timelineItems).toHaveLength(0);
  });
});
