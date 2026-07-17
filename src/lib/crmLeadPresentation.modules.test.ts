import { describe, expect, it } from "vitest";
import {
  buildOwnerOptions,
  buildSourceOptions,
  getLeadSourceFilterValue,
  getOwnerFilterValueForId,
  matchesOwnerFilter,
  matchesSourceFilter,
} from "@/lib/crmLeadPresentation";

describe("crmLeadPresentation modules", () => {
  it("preserves owner option ordering and owner filter compatibility", () => {
    const ownerOptions = buildOwnerOptions(
      ["owner-b-12345678", null, "owner-a-87654321", "user-1", "owner-a-87654321"],
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
        id: "owner-a-87654321",
        displayLabel: "Responsavel owner-a-",
        selectLabel: "Responsavel owner-a-",
      },
      {
        id: "owner-b-12345678",
        displayLabel: "Responsavel owner-b-",
        selectLabel: "Responsavel owner-b-",
      },
    ]);

    expect(matchesOwnerFilter("owner-a-87654321", getOwnerFilterValueForId("owner-a-87654321"), "user-1")).toBe(true);
    expect(matchesOwnerFilter("owner-b-12345678", getOwnerFilterValueForId("owner-a-87654321"), "user-1")).toBe(false);
  });

  it("preserves source normalization, labels and source filter compatibility", () => {
    const sourceOptions = buildSourceOptions([
      { origem: " Meta_Ads " },
      { origem: "indicação" },
      { origem: "meta_ads" },
      { origem: "" },
      { origem: null },
    ]);

    expect(sourceOptions).toEqual([
      { value: "indicação", label: "Indicação" },
      { value: "meta_ads", label: "Meta Ads" },
    ]);

    expect(matchesSourceFilter(" Meta_Ads ", getLeadSourceFilterValue("meta_ads"))).toBe(true);
    expect(matchesSourceFilter("", "without_source")).toBe(true);
    expect(matchesSourceFilter("indicação", getLeadSourceFilterValue("meta_ads"))).toBe(false);
  });
});
