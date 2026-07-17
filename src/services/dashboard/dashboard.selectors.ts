import {
  DashboardAnalyticsEventRecord,
  DashboardEventRecord,
  DashboardLeadRecord,
  DashboardTaskRecord,
} from "@/services/dashboard/dashboard.api";
import {
  ANALYTICS_FUNNEL_COLORS,
  ANALYTICS_FUNNEL_ORDER,
  PIPELINE_COLORS,
  SOURCE_COLORS,
} from "@/services/dashboard/dashboard.constants";
import {
  formatSeriesLabel,
  getAnalyticsEventLabel,
  getAnalyticsSourceLabel,
  getDateKey,
  getEventDescription,
  getEventTitle,
  getLeadStageKey,
  getLeadStageLabel,
  getSourceLabel,
  sortPipelineEntries,
} from "@/services/dashboard/dashboard.formatters";
import {
  DashboardActivityItem,
  DashboardAttentionData,
  DashboardAnalyticsSeriesDatum,
  DashboardChartDatum,
  DashboardKpi,
  DashboardRecentLeadItem,
  DashboardTrafficComparisonDatum,
  DashboardUpcomingTaskItem,
} from "@/types/dashboard";

export function buildLeadKpis(leads: DashboardLeadRecord[]): DashboardKpi[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newLeads = leads.filter((lead) => new Date(lead.created_at).getTime() >= sevenDaysAgo.getTime()).length;

  return [
    {
      id: "total_leads",
      label: "Total de leads",
      value: leads.length,
      description: "Base total visível pela sua sessão autenticada.",
      helperText: "Volume consolidado do funil atual.",
      tone: "neutral",
    },
    {
      id: "new_leads",
      label: "Novos em 7 dias",
      value: newLeads,
      description: "Entradas recentes vindas da operação comercial.",
      helperText: "Janela movel dos ultimos 7 dias.",
      tone: newLeads > 0 ? "positive" : "neutral",
    },
  ];
}

export function buildTaskKpis(tasks: DashboardTaskRecord[]): DashboardKpi[] {
  const now = Date.now();
  const openTasks = tasks.filter((task) => !task.completed).length;
  const overdueTasks = tasks.filter(
    (task) => !task.completed && new Date(task.due_date).getTime() < now,
  ).length;

  return [
    {
      id: "open_tasks",
      label: "Tarefas abertas",
      value: openTasks,
      description: "Follow-ups ainda pendentes de execução.",
      helperText: "Inclui toda a agenda em aberto.",
      tone: openTasks > 0 ? "warning" : "neutral",
    },
    {
      id: "overdue_tasks",
      label: "Tarefas atrasadas",
      value: overdueTasks,
      description: "Itens vencidos que precisam de atenção imediata.",
      helperText: overdueTasks > 0 ? "Prioridade operacional alta." : "Agenda dentro do prazo.",
      tone: overdueTasks > 0 ? "danger" : "positive",
    },
  ];
}

export function buildAnalyticsKpis(events: DashboardAnalyticsEventRecord[]): DashboardKpi[] {
  const pageViewVisitors = getUniqueVisitorCountByEvent(events, "page_view");
  const ctaClicks = events.filter((event) => event.event_type === "cta_click").length;
  const submitSuccess = events.filter((event) => event.event_type === "lead_form_submit_success").length;
  const submitErrors = events.filter((event) => event.event_type === "lead_form_submit_error").length;
  const conversionRate =
    pageViewVisitors > 0 ? Number(((submitSuccess / pageViewVisitors) * 100).toFixed(1)) : 0;

  return [
    {
      id: "landing_visitors",
      label: "Visitors únicos",
      value: pageViewVisitors,
      description: "Visitors únicos que realmente geraram page_view na landing no período analisado.",
      helperText: "Base de page_view autenticada.",
      tone: pageViewVisitors > 0 ? "positive" : "neutral",
    },
    {
      id: "landing_cta_clicks",
      label: "Cliques em CTA",
      value: ctaClicks,
      description: "Interações registradas nos principais gatilhos comerciais da landing.",
      helperText: "Eventos cta_click.",
      tone: ctaClicks > 0 ? "positive" : "neutral",
    },
    {
      id: "landing_submit_success",
      label: "Conversões",
      value: submitSuccess,
      description: "Envios concluídos com sucesso pelo formulário da landing.",
      helperText: submitErrors > 0 ? `${submitErrors} erros capturados no período.` : "Sem erros de submit no período.",
      tone: submitSuccess > 0 ? "positive" : submitErrors > 0 ? "warning" : "neutral",
    },
    {
      id: "landing_conversion_rate",
      label: "Taxa de conversão",
      value: conversionRate,
      description: "Conversões reais sobre visitors únicos que chegaram a página.",
      helperText: "lead_form_submit_success / visitors com page_view.",
      tone: conversionRate > 0 ? "positive" : "neutral",
    },
  ];
}

export function buildPipelineDistribution(leads: DashboardLeadRecord[]): DashboardChartDatum[] {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    const stageKey = getLeadStageKey(lead);
    counts.set(stageKey, (counts.get(stageKey) ?? 0) + 1);
  });

  const total = leads.length || 1;

  return Array.from(counts.entries())
    .sort((a, b) => sortPipelineEntries(a[0], b[0]))
    .map(([stageKey, value]) => ({
      id: stageKey,
      label: getLeadStageLabel({ pipeline_stage: stageKey, status: stageKey }),
      value,
      percentage: Number(((value / total) * 100).toFixed(1)),
      color: PIPELINE_COLORS[stageKey] ?? PIPELINE_COLORS.sem_estagio,
    }));
}

export function buildSourceDistribution(leads: DashboardLeadRecord[]): DashboardChartDatum[] {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    const source = getSourceLabel(lead.origem);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  });

  const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const topSources = ordered.slice(0, 6);
  const remaining = ordered.slice(6);

  if (remaining.length > 0) {
    const othersTotal = remaining.reduce((sum, [, value]) => sum + value, 0);
    topSources.push(["Outros", othersTotal]);
  }

  const total = leads.length || 1;

  return topSources.map(([label, value], index) => ({
    id: createChartId(label),
    label,
    value,
    percentage: Number(((value / total) * 100).toFixed(1)),
    color: SOURCE_COLORS[index % SOURCE_COLORS.length],
  }));
}

export function buildAnalyticsFunnel(events: DashboardAnalyticsEventRecord[]): DashboardChartDatum[] {
  const uniqueVisitorsByStep = new Map<string, Set<string>>();

  ANALYTICS_FUNNEL_ORDER.forEach((eventType) => {
    uniqueVisitorsByStep.set(eventType, new Set());
  });

  events.forEach((event) => {
    const bucket = uniqueVisitorsByStep.get(event.event_type);

    if (!bucket || !event.visitor_id) {
      return;
    }

    bucket.add(event.visitor_id);
  });

  const base = uniqueVisitorsByStep.get("page_view")?.size || 0;

  return ANALYTICS_FUNNEL_ORDER.map((eventType, index) => {
    const value = uniqueVisitorsByStep.get(eventType)?.size ?? 0;
    const percentage = base > 0 ? Number(((value / base) * 100).toFixed(1)) : 0;

    return {
      id: eventType,
      label: getAnalyticsEventLabel(eventType),
      value,
      percentage,
      color: ANALYTICS_FUNNEL_COLORS[index % ANALYTICS_FUNNEL_COLORS.length],
    };
  });
}

export function buildAnalyticsSourceDistribution(events: DashboardAnalyticsEventRecord[]): DashboardChartDatum[] {
  const counts = new Map<string, Set<string>>();

  events
    .filter((event) => event.event_type === "page_view")
    .forEach((event) => {
      const source = getAnalyticsSourceLabel(event);
      const visitors = counts.get(source) ?? new Set<string>();

      if (event.visitor_id) {
        visitors.add(event.visitor_id);
      }

      counts.set(source, visitors);
    });

  const ordered = Array.from(counts.entries())
    .map(([label, visitors]) => [label, visitors.size] as const)
    .sort((a, b) => b[1] - a[1]);
  const total = ordered.reduce((sum, [, value]) => sum + value, 0) || 1;

  return ordered.slice(0, 6).map(([label, value], index) => ({
    id: createChartId(label),
    label,
    value,
    percentage: Number(((value / total) * 100).toFixed(1)),
    color: SOURCE_COLORS[index % SOURCE_COLORS.length],
  }));
}

export function buildAnalyticsSeries(
  events: DashboardAnalyticsEventRecord[],
  days = 14,
): DashboardAnalyticsSeriesDatum[] {
  const buckets = createAnalyticsSeriesBuckets(days);

  events.forEach((event) => {
    const key = getDateKey(event.occurred_at);
    const bucket = buckets.get(key);

    if (!bucket) {
      return;
    }

    if (event.event_type === "page_view") {
      if (event.visitor_id) {
        bucket.visitorIds.add(event.visitor_id);
      }
      bucket.pageViews += 1;
      return;
    }

    if (event.event_type === "cta_click") {
      bucket.ctaClicks += 1;
      return;
    }

    if (event.event_type === "lead_form_submit_success") {
      bucket.leads += 1;
    }
  });

  return Array.from(buckets.values()).map((bucket) => {
    const visitors = bucket.visitorIds.size;

    return {
      id: bucket.key,
      label: bucket.label,
      periodStart: bucket.key,
      visitors,
      pageViews: bucket.pageViews,
      ctaClicks: bucket.ctaClicks,
      leads: bucket.leads,
      conversionRate: visitors > 0 ? Number(((bucket.leads / visitors) * 100).toFixed(1)) : 0,
    };
  });
}

export function buildTrafficVsLeadsComparison(
  events: DashboardAnalyticsEventRecord[],
): DashboardTrafficComparisonDatum[] {
  const channels = new Map<
    string,
    {
      visitors: Set<string>;
      leads: number;
    }
  >();

  events.forEach((event) => {
    const isTrafficEvent = event.event_type === "page_view";
    const isLeadEvent = event.event_type === "lead_form_submit_success";

    if (!isTrafficEvent && !isLeadEvent) {
      return;
    }

    const source = getAnalyticsSourceLabel(event);
    const channel = channels.get(source) ?? { visitors: new Set<string>(), leads: 0 };

    if (isTrafficEvent && event.visitor_id) {
      channel.visitors.add(event.visitor_id);
    }

    if (isLeadEvent) {
      channel.leads += 1;
    }

    channels.set(source, channel);
  });

  const totals = Array.from(channels.values()).reduce(
    (accumulator, channel) => {
      return {
        visitors: accumulator.visitors + channel.visitors.size,
        leads: accumulator.leads + channel.leads,
      };
    },
    { visitors: 0, leads: 0 },
  );

  return Array.from(channels.entries())
    .map(([label, channel], index) => {
      const visitors = channel.visitors.size;
      const leads = channel.leads;

      return {
        id: createChartId(label),
        label,
        visitors,
        leads,
        conversionRate: visitors > 0 ? Number(((leads / visitors) * 100).toFixed(1)) : 0,
        visitorsShare:
          totals.visitors > 0 ? Number(((visitors / totals.visitors) * 100).toFixed(1)) : 0,
        leadsShare: totals.leads > 0 ? Number(((leads / totals.leads) * 100).toFixed(1)) : 0,
        color: SOURCE_COLORS[index % SOURCE_COLORS.length],
      };
    })
    .sort((a, b) => {
      if (b.visitors !== a.visitors) {
        return b.visitors - a.visitors;
      }

      return b.leads - a.leads;
    })
    .slice(0, 6);
}

export function buildRecentLeads(leads: DashboardLeadRecord[], limit = 6): DashboardRecentLeadItem[] {
  return leads.slice(0, limit).map((lead) => ({
    id: lead.id,
    name: lead.nome || "Lead sem nome",
    company: lead.empresa,
    source: getSourceLabel(lead.origem),
    stageLabel: getLeadStageLabel(lead),
    whatsapp: lead.whatsapp,
    email: lead.email,
    createdAt: lead.created_at,
  }));
}

export function buildUpcomingTasks(
  tasks: DashboardTaskRecord[],
  leads: DashboardLeadRecord[] = [],
  limit = 6,
): DashboardUpcomingTaskItem[] {
  const leadMap = createLeadMap(leads);

  return tasks
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, limit)
    .map((task) => {
      const lead = leadMap.get(task.lead_id);

      return {
        id: task.id,
        leadId: task.lead_id,
        leadName: lead?.nome || "Lead sem identificação",
        company: lead?.empresa ?? null,
        title: task.title,
        dueDate: task.due_date,
        overdue: isTaskOverdue(task),
        stageLabel: lead ? getLeadStageLabel(lead) : "Sem estágio",
      };
    });
}

export function buildActivityFeed(
  events: DashboardEventRecord[],
  leads: DashboardLeadRecord[] = [],
): DashboardActivityItem[] {
  const leadMap = createLeadMap(leads);

  return events.map((event) => {
    const lead = leadMap.get(event.lead_id);

    return {
      id: event.id,
      leadId: event.lead_id,
      leadName: lead?.nome || "Lead sem identificação",
      company: lead?.empresa ?? null,
      eventType: event.event_type,
      title: getEventTitle(event.event_type),
      description: getEventDescription(event),
      occurredAt: event.created_at,
    };
  });
}

export function buildAttentionPanel(
  leads: DashboardLeadRecord[],
  tasks: DashboardTaskRecord[],
): DashboardAttentionData {
  const withoutOwner = leads.filter((lead) => !lead.owner_id).length;
  const withoutStage = leads.filter((lead) => getLeadStageKey(lead) === "sem_estagio").length;
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));

  return {
    metrics: [
      {
        id: "without_owner",
        label: "Leads sem owner",
        count: withoutOwner,
        description: "Registros aguardando responsável comercial.",
        tone: withoutOwner > 0 ? "warning" : "positive",
      },
      {
        id: "without_stage",
        label: "Leads sem estágio",
        count: withoutStage,
        description: "Itens que ainda não entraram claramente no funil.",
        tone: withoutStage > 0 ? "warning" : "positive",
      },
      {
        id: "overdue_tasks",
        label: "Tarefas vencidas",
        count: overdueTasks.length,
        description: "Ações pendentes que já passaram do prazo.",
        tone: overdueTasks.length > 0 ? "danger" : "positive",
      },
    ],
    overdueTasksPreview: buildUpcomingTasks(overdueTasks, leads, 4),
  };
}

function createLeadMap(leads: DashboardLeadRecord[]) {
  return new Map(leads.map((lead) => [lead.id, lead]));
}

function isTaskOverdue(task: DashboardTaskRecord) {
  return !task.completed && new Date(task.due_date).getTime() < Date.now();
}

function getUniqueVisitorCountByEvent(events: DashboardAnalyticsEventRecord[], eventType: string) {
  return new Set(
    events
      .filter((event) => event.event_type === eventType)
      .map((event) => event.visitor_id)
      .filter(Boolean),
  ).size;
}

function createAnalyticsSeriesBuckets(days: number) {
  const normalizedDays = Math.max(days, 1);
  const buckets = new Map<
    string,
    {
      key: string;
      label: string;
      visitorIds: Set<string>;
      pageViews: number;
      ctaClicks: number;
      leads: number;
    }
  >();

  for (let offset = normalizedDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const key = getDateKey(date.toISOString());

    buckets.set(key, {
      key,
      label: formatSeriesLabel(key),
      visitorIds: new Set<string>(),
      pageViews: 0,
      ctaClicks: 0,
      leads: 0,
    });
  }

  return buckets;
}

function createChartId(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "_");
}
