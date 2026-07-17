import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildActivityFeed,
  buildAttentionPanel,
  buildLeadKpis,
  buildPipelineDistribution,
  buildRecentLeads,
  buildSourceDistribution,
  buildTaskKpis,
  buildUpcomingTasks,
} from "../dashboard/dashboard.selectors";

const leads = [
  {
    id: "lead-1",
    nome: "Ana Souza",
    empresa: "Empresa A",
    origem: "Meta Ads",
    status: "novo",
    pipeline_stage: "novo",
    owner_id: "owner-1",
    whatsapp: "11999990000",
    email: "ana@empresa.com",
    created_at: "2026-04-12T09:00:00.000Z",
    updated_at: "2026-04-12T09:00:00.000Z",
  },
  {
    id: "lead-2",
    nome: "",
    empresa: null,
    origem: "",
    status: "",
    pipeline_stage: null,
    owner_id: null,
    whatsapp: "21988887777",
    email: null,
    created_at: "2026-04-01T09:00:00.000Z",
    updated_at: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "lead-3",
    nome: "Bruno Costa",
    empresa: "Empresa B",
    origem: "Indicação",
    status: "ganho",
    pipeline_stage: "ganho",
    owner_id: "owner-2",
    whatsapp: "31977776666",
    email: "bruno@empresa.com",
    created_at: "2026-03-20T09:00:00.000Z",
    updated_at: "2026-03-20T09:00:00.000Z",
  },
];

const tasks = [
  {
    id: "task-1",
    lead_id: "lead-2",
    assignee_id: null,
    title: "Retornar contato",
    due_date: "2026-04-11T09:00:00.000Z",
    completed: false,
    created_at: "2026-04-10T09:00:00.000Z",
    updated_at: "2026-04-10T09:00:00.000Z",
  },
  {
    id: "task-2",
    lead_id: "lead-1",
    assignee_id: "owner-1",
    title: "Enviar proposta",
    due_date: "2026-04-13T09:00:00.000Z",
    completed: false,
    created_at: "2026-04-12T09:00:00.000Z",
    updated_at: "2026-04-12T09:00:00.000Z",
  },
  {
    id: "task-3",
    lead_id: "lead-3",
    assignee_id: "owner-2",
    title: "Concluir onboarding",
    due_date: "2026-04-09T09:00:00.000Z",
    completed: true,
    created_at: "2026-04-08T09:00:00.000Z",
    updated_at: "2026-04-08T09:00:00.000Z",
  },
];

const events = [
  {
    id: "event-1",
    lead_id: "lead-1",
    event_type: "task_added",
    payload: { title: "Enviar proposta" },
    created_at: "2026-04-12T10:00:00.000Z",
  },
  {
    id: "event-2",
    lead_id: "lead-2",
    event_type: "owner_changed",
    payload: { next_owner_id: "owner-9-abcdef" },
    created_at: "2026-04-12T11:00:00.000Z",
  },
];

describe("dashboard selectors", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves KPI calculations for leads and tasks", () => {
    const leadKpis = buildLeadKpis(leads);
    const taskKpis = buildTaskKpis(tasks);

    expect(leadKpis.find((metric) => metric.id === "total_leads")?.value).toBe(3);
    expect(leadKpis.find((metric) => metric.id === "new_leads")?.value).toBe(1);
    expect(taskKpis.find((metric) => metric.id === "open_tasks")?.value).toBe(2);
    expect(taskKpis.find((metric) => metric.id === "overdue_tasks")?.value).toBe(1);
  });

  it("preserves pipeline and source distributions with the same labels, order and colors", () => {
    const pipeline = buildPipelineDistribution(leads);
    const sources = buildSourceDistribution(leads);

    expect(pipeline).toEqual([
      expect.objectContaining({ id: "novo", label: "Novo", value: 1, percentage: 33.3, color: "#2563eb" }),
      expect.objectContaining({ id: "ganho", label: "Ganho", value: 1, percentage: 33.3, color: "#16a34a" }),
      expect.objectContaining({
        id: "sem_estagio",
        label: "Sem estágio",
        value: 1,
        percentage: 33.3,
        color: "#94a3b8",
      }),
    ]);

    expect(sources).toEqual([
      expect.objectContaining({ id: "meta_ads", label: "Meta Ads", value: 1, percentage: 33.3, color: "#2563eb" }),
      expect.objectContaining({ id: "nao_informado", label: "Não informado", value: 1, percentage: 33.3, color: "#0f766e" }),
      expect.objectContaining({ id: "indicacao", label: "Indicação", value: 1, percentage: 33.3, color: "#7c3aed" }),
    ]);
  });

  it("preserves recent leads, upcoming tasks, activity feed and attention panel builders", () => {
    const recentLeads = buildRecentLeads(leads, 2);
    const upcomingTasks = buildUpcomingTasks(tasks, leads, 2);
    const activityFeed = buildActivityFeed(events, leads);
    const attentionPanel = buildAttentionPanel(leads, tasks);

    expect(recentLeads).toEqual([
      expect.objectContaining({
        id: "lead-1",
        name: "Ana Souza",
        source: "Meta Ads",
        stageLabel: "Novo",
      }),
      expect.objectContaining({
        id: "lead-2",
        name: "Lead sem nome",
        source: "Não informado",
        stageLabel: "Sem estágio",
      }),
    ]);

    expect(upcomingTasks).toEqual([
      expect.objectContaining({
        id: "task-1",
        leadName: "Lead sem identificação",
        overdue: true,
        stageLabel: "Sem estágio",
      }),
      expect.objectContaining({
        id: "task-2",
        leadName: "Ana Souza",
        overdue: false,
        stageLabel: "Novo",
      }),
    ]);

    expect(activityFeed).toEqual([
      expect.objectContaining({
        id: "event-1",
        title: "Follow-up agendado",
        description: "Nova tarefa criada: Enviar proposta",
      }),
      expect.objectContaining({
        id: "event-2",
        title: "Ownership ajustado",
        description: "Lead atribuído para responsável owner-9-.",
      }),
    ]);

    expect(attentionPanel.metrics).toEqual([
      expect.objectContaining({ id: "without_owner", count: 1, tone: "warning" }),
      expect.objectContaining({ id: "without_stage", count: 1, tone: "warning" }),
      expect.objectContaining({ id: "overdue_tasks", count: 1, tone: "danger" }),
    ]);
    expect(attentionPanel.overdueTasksPreview).toHaveLength(1);
    expect(attentionPanel.overdueTasksPreview[0]).toMatchObject({ id: "task-1", title: "Retornar contato" });
  });

  it("collapses long source tails into 'Outros' without chánging the top ordering", () => {
    const expandedLeads = [
      ...leads,
      { ...leads[0], id: "lead-4", origem: "Google Ads" },
      { ...leads[0], id: "lead-5", origem: "LinkedIn" },
      { ...leads[0], id: "lead-6", origem: "Parceiros" },
      { ...leads[0], id: "lead-7", origem: "Feira" },
      { ...leads[0], id: "lead-8", origem: "Email" },
      { ...leads[0], id: "lead-9", origem: "Podcast" },
    ];

    const distribution = buildSourceDistribution(expandedLeads);

    expect(distribution).toHaveLength(7);
    expect(distribution.slice(0, 6).map((entry) => entry.label)).toEqual([
      "Meta Ads",
      "Não informado",
      "Indicação",
      "Google Ads",
      "LinkedIn",
      "Parceiros",
    ]);
    expect(distribution[6]).toMatchObject({
      label: "Outros",
      value: 3,
      percentage: 33.3,
    });
  });

  it("limits the overdue preview to four tasks while preserving overdue-only attention counts", () => {
    const manyOverdueTasks = [
      ...tasks,
      { ...tasks[0], id: "task-4", lead_id: "lead-1", due_date: "2026-04-10T09:00:00.000Z" },
      { ...tasks[0], id: "task-5", lead_id: "lead-2", due_date: "2026-04-09T09:00:00.000Z" },
      { ...tasks[0], id: "task-6", lead_id: "lead-3", due_date: "2026-04-08T09:00:00.000Z" },
      { ...tasks[0], id: "task-7", lead_id: "lead-1", due_date: "2026-04-07T09:00:00.000Z" },
    ];

    const attentionPanel = buildAttentionPanel(leads, manyOverdueTasks);

    expect(attentionPanel.metrics.find((metric) => metric.id === "overdue_tasks")?.count).toBe(5);
    expect(attentionPanel.overdueTasksPreview).toHaveLength(4);
    expect(attentionPanel.overdueTasksPreview.every((task) => task.overdue)).toBe(true);
  });
});
