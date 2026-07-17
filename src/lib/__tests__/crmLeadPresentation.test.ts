import { describe, expect, it, vi } from "vitest";
import {
  LEAD_OWNER_FILTER_MINE,
  LEAD_SOURCE_FILTER_WITHOUT_SOURCE,
  LEAD_OWNER_FILTER_UNASSIGNED,
  buildLeadTaskSummary,
  buildOwnerLabelMap,
  buildOwnerOptions,
  buildSourceOptions,
  filterLeadRows,
  getLeadStageValue,
  getLeadSourceFilterValue,
  getOwnerFilterValueForId,
  matchesOwnerFilter,
  paginateCollection,
  sortLeadRows,
} from "../crmLeadPresentation";

describe("crmLeadPresentation", () => {
  it("normalizes the commercial stage using pipeline_stage first", () => {
    expect(getLeadStageValue({ pipeline_stage: "qualificado", status: "novo" })).toBe("qualificado");
    expect(getLeadStageValue({ pipeline_stage: null, status: "ganho" })).toBe("ganho");
    expect(getLeadStageValue({ pipeline_stage: null, status: "desconhecido" })).toBe("without_stage");
  });

  it("builds the operational task summary with next task and overdue count", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-11T12:00:00.000Z"));

    const summary = buildLeadTaskSummary([
      {
        id: "task-1",
        lead_id: "lead-1",
        assignee_id: "user-1",
        title: "Ligar hoje",
        due_date: "2026-04-11T10:00:00.000Z",
        completed: false,
      },
      {
        id: "task-2",
        lead_id: "lead-1",
        assignee_id: "user-1",
        title: "Enviar proposta",
        due_date: "2026-04-12T10:00:00.000Z",
        completed: false,
      },
      {
        id: "task-3",
        lead_id: "lead-1",
        assignee_id: "user-1",
        title: "Concluida",
        due_date: "2026-04-10T10:00:00.000Z",
        completed: true,
      },
    ]);

    expect(summary).toEqual(
      expect.objectContaining({
        openCount: 2,
        overdueCount: 1,
        nextTask: expect.objectContaining({
          id: "task-1",
          title: "Ligar hoje",
        }),
      }),
    );

    vi.useRealTimers();
  });

  it("builds owner options with current user first and stable labels", () => {
    const ownerOptions = buildOwnerOptions(
      ["owner-b", "owner-a", "user-1", "owner-a", null],
      {
        id: "user-1",
        email: "ana@empresa.com",
        user_metadata: { full_name: "Ana Souza" },
      } as never,
    );

    expect(ownerOptions).toEqual([
      {
        id: "user-1",
        displayLabel: "Você",
        selectLabel: "Você (Ana Souza)",
      },
      {
        id: "owner-a",
        displayLabel: "Responsavel owner-a",
        selectLabel: "Responsavel owner-a",
      },
      {
        id: "owner-b",
        displayLabel: "Responsavel owner-b",
        selectLabel: "Responsavel owner-b",
      },
    ]);

    expect(buildOwnerLabelMap(ownerOptions).get("user-1")).toBe("Você");
  });

  it("matches mine, unassigned and specific owner filters", () => {
    expect(matchesOwnerFilter("user-1", LEAD_OWNER_FILTER_MINE, "user-1")).toBe(true);
    expect(matchesOwnerFilter(null, LEAD_OWNER_FILTER_UNASSIGNED, "user-1")).toBe(true);
    expect(matchesOwnerFilter("owner-2", getOwnerFilterValueForId("owner-2"), "user-1")).toBe(true);
    expect(matchesOwnerFilter("owner-3", getOwnerFilterValueForId("owner-2"), "user-1")).toBe(false);
  });

  it("filters leads by search, source and period", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));

    const rows = [
      {
        lead: {
          id: "lead-1",
          nome: "Ana Souza",
          whatsapp: "11999990000",
          email: "ana@empresa.com",
          empresa: "Empresa A",
          origem: "landing_page",
          status: "novo",
          pipeline_stage: "novo" as const,
          owner_id: "user-1",
          lifetime_value: null,
          created_at: "2026-04-11T10:00:00.000Z",
          updated_at: "2026-04-11T10:00:00.000Z",
          last_interaction_at: null,
          funcionarios: 10,
        },
        taskSummary: { openCount: 1, overdueCount: 0, nextTask: null },
      },
      {
        lead: {
          id: "lead-2",
          nome: "Bruno Costa",
          whatsapp: "21988887777",
          email: "bruno@empresa.com",
          empresa: "Empresa B",
          origem: "",
          status: "novo",
          pipeline_stage: null,
          owner_id: null,
          lifetime_value: null,
          created_at: "2026-01-10T10:00:00.000Z",
          updated_at: "2026-01-10T10:00:00.000Z",
          last_interaction_at: null,
          funcionarios: 5,
        },
        taskSummary: { openCount: 0, overdueCount: 0, nextTask: null },
      },
    ];

    expect(buildSourceOptions(rows.map((row) => row.lead))).toEqual([
      { value: "landing_page", label: "Landing Page" },
    ]);

    const filteredRows = filterLeadRows(rows, {
      searchTerm: "Ana",
      stageFilter: "all",
      ownerFilter: "all",
      sourceFilter: getLeadSourceFilterValue("landing_page"),
      periodFilter: "7d",
    });

    expect(filteredRows).toHaveLength(1);
    expect(filteredRows[0].lead.id).toBe("lead-1");

    const leadsWithoutSource = filterLeadRows(rows, {
      searchTerm: "",
      stageFilter: "all",
      ownerFilter: "all",
      sourceFilter: LEAD_SOURCE_FILTER_WITHOUT_SOURCE,
      periodFilter: "all",
    });

    expect(leadsWithoutSource).toHaveLength(1);
    expect(leadsWithoutSource[0].lead.id).toBe("lead-2");

    vi.useRealTimers();
  });

  it("sorts by operational priority and paginates the result", () => {
    const rows = [
      {
        lead: {
          id: "lead-1",
          nome: "Ana Souza",
          whatsapp: "11999990000",
          email: "ana@empresa.com",
          empresa: "Empresa A",
          origem: "landing_page",
          status: "novo",
          pipeline_stage: "novo" as const,
          owner_id: null,
          lifetime_value: null,
          created_at: "2026-04-10T10:00:00.000Z",
          updated_at: "2026-04-10T10:00:00.000Z",
          last_interaction_at: null,
          funcionarios: 10,
        },
        taskSummary: { openCount: 1, overdueCount: 1, nextTask: null },
      },
      {
        lead: {
          id: "lead-2",
          nome: "Bruno Costa",
          whatsapp: "21988887777",
          email: "bruno@empresa.com",
          empresa: "Empresa B",
          origem: "indicação",
          status: "novo",
          pipeline_stage: "qualificado" as const,
          owner_id: "user-1",
          lifetime_value: null,
          created_at: "2026-04-11T10:00:00.000Z",
          updated_at: "2026-04-11T10:00:00.000Z",
          last_interaction_at: null,
          funcionarios: 5,
        },
        taskSummary: { openCount: 1, overdueCount: 0, nextTask: null },
      },
      {
        lead: {
          id: "lead-3",
          nome: "Carla Lima",
          whatsapp: "31977776666",
          email: "carla@empresa.com",
          empresa: "Empresa C",
          origem: "landing_page",
          status: "ganho",
          pipeline_stage: "ganho" as const,
          owner_id: "user-2",
          lifetime_value: null,
          created_at: "2026-04-09T10:00:00.000Z",
          updated_at: "2026-04-09T10:00:00.000Z",
          last_interaction_at: null,
          funcionarios: 3,
        },
        taskSummary: { openCount: 0, overdueCount: 0, nextTask: null },
      },
    ];

    const sortedRows = sortLeadRows(rows, "priority");
    expect(sortedRows.map((row) => row.lead.id)).toEqual(["lead-1", "lead-2", "lead-3"]);

    const pagination = paginateCollection(sortedRows, 2, 2);
    expect(pagination.items).toHaveLength(1);
    expect(pagination.items[0].lead.id).toBe("lead-3");
    expect(pagination.totalPages).toBe(2);
  });
});
