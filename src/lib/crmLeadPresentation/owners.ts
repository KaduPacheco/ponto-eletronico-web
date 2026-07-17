import type { User } from "@supabase/supabase-js";
import { CrmOwnerOption } from "@/types/crm";

export const LEAD_OWNER_FILTER_ALL = "all";
export const LEAD_OWNER_FILTER_MINE = "mine";
export const LEAD_OWNER_FILTER_UNASSIGNED = "unassigned";
export const LEAD_OWNER_FILTER_PREFIX = "owner:";

export type LeadOwnerFilter =
  | typeof LEAD_OWNER_FILTER_ALL
  | typeof LEAD_OWNER_FILTER_MINE
  | typeof LEAD_OWNER_FILTER_UNASSIGNED
  | `${typeof LEAD_OWNER_FILTER_PREFIX}${string}`;

export function buildOwnerOptions(ownerIds: Iterable<string | null | undefined>, currentUser?: Pick<User, "id" | "email" | "user_metadata"> | null) {
  const options = new Map<string, CrmOwnerOption>();
  const currentUserLabel = getCurrentUserIdentityLabel(currentUser);

  if (currentUser?.id) {
    options.set(currentUser.id, {
      id: currentUser.id,
      displayLabel: "Você",
      selectLabel: currentUserLabel ? `Você (${currentUserLabel})` : "Você",
    });
  }

  for (const ownerId of ownerIds) {
    if (!ownerId || options.has(ownerId)) {
      continue;
    }

    options.set(ownerId, {
      id: ownerId,
      displayLabel: `Responsavel ${ownerId.slice(0, 8)}`,
      selectLabel: `Responsavel ${ownerId.slice(0, 8)}`,
    });
  }

  return Array.from(options.values()).sort((left, right) => {
    if (currentUser?.id && left.id === currentUser.id) {
      return -1;
    }

    if (currentUser?.id && right.id === currentUser.id) {
      return 1;
    }

    return left.selectLabel.localeCompare(right.selectLabel, "pt-BR");
  });
}

export function buildOwnerLabelMap(ownerOptions: CrmOwnerOption[]) {
  return new Map(ownerOptions.map((option) => [option.id, option.displayLabel]));
}

export function getOwnerDisplayLabel(
  ownerId: string | null,
  currentUserId?: string,
  ownerLabelMap?: ReadonlyMap<string, string>,
) {
  if (!ownerId) {
    return "Sem responsável";
  }

  const knownOwnerLabel = ownerLabelMap?.get(ownerId);

  if (knownOwnerLabel) {
    return knownOwnerLabel;
  }

  if (currentUserId && ownerId === currentUserId) {
    return "Você";
  }

  return `Responsavel ${ownerId.slice(0, 8)}`;
}

export function getOwnerFilterValueForId(ownerId: string) {
  return `${LEAD_OWNER_FILTER_PREFIX}${ownerId}` as const;
}

export function matchesOwnerFilter(
  ownerId: string | null,
  filter: LeadOwnerFilter,
  currentUserId?: string,
) {
  if (filter === LEAD_OWNER_FILTER_ALL) {
    return true;
  }

  if (filter === LEAD_OWNER_FILTER_MINE) {
    return Boolean(currentUserId) && ownerId === currentUserId;
  }

  if (filter === LEAD_OWNER_FILTER_UNASSIGNED) {
    return !ownerId;
  }

  return ownerId === getOwnerIdFromFilter(filter);
}

export function getOwnerIdFromFilter(filter: LeadOwnerFilter) {
  return filter.startsWith(LEAD_OWNER_FILTER_PREFIX)
    ? filter.slice(LEAD_OWNER_FILTER_PREFIX.length)
    : null;
}

function getCurrentUserIdentityLabel(currentUser?: Pick<User, "email" | "user_metadata"> | null) {
  const metadata = currentUser?.user_metadata as Record<string, unknown> | undefined;
  const candidateValues = [
    metadata?.full_name,
    metadata?.name,
    metadata?.nome,
    currentUser?.email,
  ];

  for (const candidate of candidateValues) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}
