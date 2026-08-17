const createStaticKey = <const TKey extends readonly string[]>(key: TKey) => key;

const createEntityKey = <const TPrefix extends string>(prefix: TPrefix) => (entityId?: string) =>
  [prefix, entityId] as const;

const createDashboardKey = <const TSection extends string>(section: TSection) =>
  ["crm-dashboard", section] as const;

const lead = createEntityKey("crm-lead");
const leadNotes = createEntityKey("crm-lead-notes");
const leadEvents = createEntityKey("crm-lead-events");
const leadTasks = createEntityKey("crm-lead-tasks");

export const CRM_QUERY_KEYS = {
  leads: createStaticKey(["crm-leads"] as const),
  leadsTaskOverview: createStaticKey(["crm-leads-task-overview"] as const),
  lead,
  ownerProfiles: createStaticKey(["crm-owner-profiles"] as const),
  leadNotes,
  leadEvents,
  leadTasks,
  dashboardLeads: createDashboardKey("leads"),
  dashboardTasks: createDashboardKey("tasks"),
  dashboardEvents: createDashboardKey("events"),
  dashboardAnalytics: createDashboardKey("analytics"),
  leadWorkspace: (leadId?: string) => [
    lead(leadId),
    leadNotes(leadId),
    leadEvents(leadId),
    leadTasks(leadId),
  ] as const,
} as const;

export type CrmLeadWorkspaceQueryKey = ReturnType<typeof CRM_QUERY_KEYS.leadWorkspace>;
