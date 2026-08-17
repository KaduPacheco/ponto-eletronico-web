import { describe, expect, it } from "vitest";
import { CRM_QUERY_KEYS } from "@/features/crm/shared/queryKeys/crmQueryKeys";

describe("CRM_QUERY_KEYS", () => {
  it("preserves the exact literal values already used by the CRM", () => {
    expect(CRM_QUERY_KEYS.leads).toEqual(["crm-leads"]);
    expect(CRM_QUERY_KEYS.leadsTaskOverview).toEqual(["crm-leads-task-overview"]);
    expect(CRM_QUERY_KEYS.lead("lead-1")).toEqual(["crm-lead", "lead-1"]);
    expect(CRM_QUERY_KEYS.ownerProfiles).toEqual(["crm-owner-profiles"]);
    expect(CRM_QUERY_KEYS.leadNotes("lead-1")).toEqual(["crm-lead-notes", "lead-1"]);
    expect(CRM_QUERY_KEYS.leadEvents("lead-1")).toEqual(["crm-lead-events", "lead-1"]);
    expect(CRM_QUERY_KEYS.leadTasks("lead-1")).toEqual(["crm-lead-tasks", "lead-1"]);
    expect(CRM_QUERY_KEYS.dashboardLeads).toEqual(["crm-dashboard", "leads"]);
    expect(CRM_QUERY_KEYS.dashboardTasks).toEqual(["crm-dashboard", "tasks"]);
    expect(CRM_QUERY_KEYS.dashboardEvents).toEqual(["crm-dashboard", "events"]);
    expect(CRM_QUERY_KEYS.dashboardAnalytics).toEqual(["crm-dashboard", "analytics"]);
    expect(CRM_QUERY_KEYS.leadWorkspace("lead-1")).toEqual([
      ["crm-lead", "lead-1"],
      ["crm-lead-notes", "lead-1"],
      ["crm-lead-events", "lead-1"],
      ["crm-lead-tasks", "lead-1"],
    ]);
  });
});
