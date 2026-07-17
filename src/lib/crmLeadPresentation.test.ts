import { describe, expect, it, vi } from "vitest";
import type { CrmLead, CrmLeadTaskOverview } from "@/types/crm";
import {
  LEAD_OWNER_FILTER_MINE,
  LEAD_OWNER_FILTER_UNASSIGNED,
  LEAD_SOURCE_FILTER_WITHOUT_SOURCE,
  buildLeadTaskSummary,
  filterLeadRows,
  getLeadOperationalPriority,
  getLeadStageLabel,
  getLeadStageValue,
  paginateCollection,
  sortLeadRows,
  type LeadListFilters,
} from "@/lib/crmLeadPresentation";

function createLead(overrides: Partial<CrmLead> = {}): CrmLead {
  return {
    id: "lead-1",
    nome: "João da Silva",
    whatsapp: "+55 (11) 99999-0000",
    email: "joao@example.com",
    empresa: "Empresa Alpha",
    funcionarios: 12,
    origem: "meta_ads",
    status: "novo",
    pipeline_stage: "novo",
    owner_id: "owner-1",
    lifetime_value: null,
    created_at: "2026-04-13T09:00:00.000Z",
    updated_at: "2026-04-13T09:00:00.000Z",
    last_interaction_at: null,
    ...overrides,
  };
}

function createTask(overrides: Partial<CrmLeadTaskOverview> = {}): CrmLeadTaskOverview {
  return {
    id: "task-1",
    lead_id: "lead-1",
    assignee_id: "owner-1",
    title: "Ligar para o lead",
    due_date: "2026-04-14T09:00:00.000Z",
    completed: false,
    ...overrides,
  };
}

function createRow(
  leadOverrides: Partial<CrmLead> = {},
  tasks: CrmLeadTaskOverview[] = [],
) {
  const lead = createLead(leadOverrides);

  return {
    lead,
    taskSummary: buildLeadTaskSummary(tasks),
  };
}

const defaultFilters: LeadListFilters = {
  searchTerm: "",
  stageFilter: "all",
  ownerFilter: "all",
  sourceFilter: "all",
  periodFilter: "all",
};

describe("crmLeadPresentation", () => {
  it("resolves the lead stage from pipeline_stage or status", () => {
    expect(getLeadStageValue(createLead({ pipeline_stage: "qualificado", status: "novo" }))).toBe("qualificado");
    expect(getLeadStageValue(createLead({ pipeline_stage: null, status: " EM_CONTATO " }))).toBe("em_contato");
    expect(getLeadStageValue(createLead({ pipeline_stage: null, status: "desconhecido" }))).toBe("without_stage");
  });

  it("returns the current stage label or the fallback label", () => {
    expect(getLeadStageLabel(createLead({ pipeline_stage: "ganho" }))).toBe("Ganho");
    expect(getLeadStageLabel(createLead({ pipeline_stage: null, status: "" }))).toBe("Sem etapa");
    expect(getLeadStageLabel(createLead({ pipeline_stage: null, status: " em_contato " }))).toBe("Em contato");
  });

  it("summarizes open, overdue and next tasks without counting completed tasks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));

    const summary = buildLeadTaskSummary([
      createTask({ id: "task-overdue", due_date: "2026-04-12T10:00:00.000Z" }),
      createTask({ id: "task-next", due_date: "2026-04-13T13:00:00.000Z" }),
      createTask({ id: "task-complete", completed: true, due_date: "2026-04-11T10:00:00.000Z" }),
    ]);

    expect(summary.openCount).toBe(2);
    expect(summary.overdueCount).toBe(1);
    expect(summary.nextTask?.id).toBe("task-overdue");

    vi.useRealTimers();
  });

  it("returns an empty task summary when every task is already completed", () => {
    const summary = buildLeadTaskSummary([
      createTask({ id: "task-done-1", completed: true }),
      createTask({ id: "task-done-2", completed: true, due_date: "2026-04-12T10:00:00.000Z" }),
    ]);

    expect(summary).toEqual({
      openCount: 0,
      overdueCount: 0,
      nextTask: null,
    });
  });

  it("filters rows by owner, source, period and search term while preserving current rules", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));

    const rows = [
      createRow(
        {
          id: "lead-mine",
          nome: "João Silva",
          owner_id: "owner-1",
          origem: "meta_ads",
          pipeline_stage: "novo",
          created_at: "2026-04-13T08:00:00.000Z",
        },
        [createTask({ id: "task-a", due_date: "2026-04-14T09:00:00.000Z" })],
      ),
      createRow({
        id: "lead-unassigned",
        nome: "Maria Souza",
        owner_id: null,
        origem: "",
        pipeline_stage: null,
        status: "",
        created_at: "2026-04-10T08:00:00.000Z",
        whatsapp: "+55 (21) 98888-7777",
      }),
      createRow({
        id: "lead-old",
        nome: "Pedro Gomês",
        owner_id: "owner-2",
        origem: "google_ads",
        pipeline_stage: "ganho",
        created_at: "2026-02-01T08:00:00.000Z",
      }),
    ];

    const filteredMine = filterLeadRows(
      rows,
      {
        ...defaultFilters,
        ownerFilter: LEAD_OWNER_FILTER_MINE,
        sourceFilter: "source:meta_ads",
        periodFilter: "today",
        searchTerm: "joao",
      },
      "owner-1",
    );

    const filteredOperationalGap = filterLeadRows(rows, {
      ...defaultFilters,
      stageFilter: "without_stage",
      ownerFilter: LEAD_OWNER_FILTER_UNASSIGNED,
      sourceFilter: LEAD_SOURCE_FILTER_WITHOUT_SOURCE,
      periodFilter: "30d",
      searchTerm: "988887777",
    });

    expect(filteredMine.map((row) => row.lead.id)).toEqual(["lead-mine"]);
    expect(filteredOperationalGap.map((row) => row.lead.id)).toEqual(["lead-unassigned"]);

    vi.useRealTimers();
  });

  it("filters by explicit stage and keeps accent-insensitive search behávior", () => {
    const rows = [
      createRow({
        id: "lead-qualified",
        nome: "Joao Qualificado",
        pipeline_stage: "qualificado",
        status: "novo",
      }),
      createRow({
        id: "lead-won",
        nome: "José Convertido",
        pipeline_stage: "ganho",
        status: "ganho",
      }),
    ];

    const filteredRows = filterLeadRows(rows, {
      ...defaultFilters,
      stageFilter: "ganho",
      searchTerm: "jose",
    });

    expect(filteredRows.map((row) => row.lead.id)).toEqual(["lead-won"]);
  });

  it("sorts by priority to surface overdue and structurally incomplete leads first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));

    const rows = [
      createRow(
        {
          id: "won-lead",
          nome: "Lead ganho",
          pipeline_stage: "ganho",
          created_at: "2026-04-13T09:00:00.000Z",
        },
        [createTask({ id: "task-won", due_date: "2026-04-14T10:00:00.000Z" })],
      ),
      createRow(
        {
          id: "overdue-lead",
          nome: "Lead urgente",
          owner_id: "owner-1",
          pipeline_stage: "em_contato",
          created_at: "2026-04-12T09:00:00.000Z",
        },
        [createTask({ id: "task-overdue", due_date: "2026-04-12T08:00:00.000Z" })],
      ),
      createRow({
        id: "unassigned-lead",
        nome: "Lead sem owner",
        owner_id: null,
        pipeline_stage: null,
        status: "",
        created_at: "2026-04-13T10:00:00.000Z",
      }),
    ];

    const sorted = sortLeadRows(rows, "priority");

    expect(sorted.map((row) => row.lead.id)).toEqual([
      "overdue-lead",
      "unassigned-lead",
      "won-lead",
    ]);

    vi.useRealTimers();
  });

  it("sorts by next follow up date and then uses priority as a tie breaker", () => {
    const rows = [
      createRow(
        { id: "lead-later", nome: "Lead Depois" },
        [createTask({ id: "task-later", due_date: "2026-04-15T09:00:00.000Z" })],
      ),
      createRow(
        { id: "lead-sooner", nome: "Lead Antes" },
        [createTask({ id: "task-sooner", due_date: "2026-04-14T09:00:00.000Z" })],
      ),
      createRow({ id: "lead-without-task", nome: "Lead Sem Tarefa", owner_id: null }),
    ];

    const sorted = sortLeadRows(rows, "next_follow_up");

    expect(sorted.map((row) => row.lead.id)).toEqual([
      "lead-sooner",
      "lead-later",
      "lead-without-task",
    ]);
  });

  it("sorts alphábetically when requested and preserves locale-aware labels", () => {
    const rows = [
      createRow({ id: "lead-z", nome: "Zuleica" }),
      createRow({ id: "lead-a", nome: "Ana" }),
      createRow({ id: "lead-c", nome: "Caio" }),
    ];

    const sorted = sortLeadRows(rows, "name_asc");

    expect(sorted.map((row) => row.lead.id)).toEqual([
      "lead-a",
      "lead-c",
      "lead-z",
    ]);
  });

  it("builds operational priorities for overdue, unassigned and won leads", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00.000Z"));

    const overduePriority = getLeadOperationalPriority(
      createRow(
        { id: "lead-overdue", pipeline_stage: "em_contato" },
        [createTask({ id: "task-overdue", due_date: "2026-04-12T09:00:00.000Z" })],
      ),
    );
    const unassignedPriority = getLeadOperationalPriority(
      createRow({ id: "lead-unassigned-priority", owner_id: null, pipeline_stage: "novo" }),
    );
    const wonPriority = getLeadOperationalPriority(
      createRow({ id: "lead-won-priority", pipeline_stage: "ganho" }),
    );

    expect(overduePriority).toMatchObject({ label: "Acao imediata", tone: "danger" });
    expect(unassignedPriority).toMatchObject({ label: "Distribuir owner", tone: "warning" });
    expect(wonPriority).toMatchObject({ label: "Negocio ganho", tone: "success" });

    vi.useRealTimers();
  });

  it("paginates collections with safe bounds and consistent metadata", () => {
    const result = paginateCollection(["a", "b", "c", "d", "e"], 9, 2);

    expect(result).toEqual({
      currentPage: 3,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
      startIndex: 4,
      endIndex: 5,
      items: ["e"],
    });
  });

  it("normalizes invalid pagination bounds without chánging collection semantics", () => {
    const result = paginateCollection(["a", "b", "c"], 0, 0);

    expect(result).toEqual({
      currentPage: 1,
      pageSize: 1,
      totalItems: 3,
      totalPages: 3,
      startIndex: 0,
      endIndex: 1,
      items: ["a"],
    });
  });
});
