import { ReactNode } from "react";
import {
  Activity,
  CalendarClock,
  Clock,
  MessageSquare,
  UserRound,
} from "lucide-react";
import {
  CrmLeadEvent,
  CrmLeadEventPayload,
  CrmLeadNote,
} from "@/types/crm";
import {
  getLeadStageOptionLabel,
} from "@/lib/crmLeadPresentation/stages";
import { getOwnerDisplayLabel } from "@/lib/crmLeadPresentation/owners";

export interface TimelineItem {
  id: string;
  kind: "note" | "event";
  title: string;
  content?: string;
  createdAt: string;
  tone: "primary" | "muted" | "success";
  icon: ReactNode;
}

export function buildLeadTimelineItems(
  notes: CrmLeadNote[],
  events: CrmLeadEvent[],
  ownerLabelMap: ReadonlyMap<string, string>,
  currentUserId?: string,
): TimelineItem[] {
  const noteItems: TimelineItem[] = notes.map((note) => ({
    id: note.id,
    kind: "note",
    title: "Nota interna",
    content: note.content,
    createdAt: note.created_at,
    tone: "primary",
    icon: <MessageSquare className="h-4 w-4" />,
  }));

  const eventItems: TimelineItem[] = events.map((event) => ({
    id: event.id,
    kind: "event",
    title: getEventTitle(event),
    content: getEventDescription(event, ownerLabelMap, currentUserId),
    createdAt: event.created_at,
    tone: getEventTone(event.event_type),
    icon: getEventIcon(event.event_type),
  }));

  return [...noteItems, ...eventItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function getEventTitle(event: CrmLeadEvent) {
  switch (event.event_type) {
    case "task_added":
      return "Follow-up agendado";
    case "task_completed":
      return "Tarefa concluída";
    case "task_reopened":
      return "Tarefa reaberta";
    case "pipeline_change":
      return "Etapa comercial atualizada";
    case "owner_changed":
      return "Ownership ajustado";
    case "note_added":
      return "Nota registrada";
    default:
      return "Atividade do lead";
  }
}

function getEventDescription(
  event: CrmLeadEvent,
  ownerLabelMap: ReadonlyMap<string, string>,
  currentUserId?: string,
) {
  switch (event.event_type) {
    case "task_added":
    case "task_completed":
    case "task_reopened":
      return getPayloadString(event.payload, "title") || undefined;
    case "pipeline_change": {
      const previousStage = getStageLabelFromPayload(getPayloadString(event.payload, "previous_stage"));
      const nextStage = getStageLabelFromPayload(getPayloadString(event.payload, "next_stage"));

      if (!previousStage && nextStage) {
        return `Lead classificado em ${nextStage}.`;
      }

      if (previousStage && nextStage) {
        return `${previousStage} -> ${nextStage}`;
      }

      return undefined;
    }
    case "owner_changed": {
      const previousOwnerLabel = getOwnerLabelFromPayload(
        event.payload,
        "previous_owner_label",
        "previous_owner_id",
        ownerLabelMap,
        currentUserId,
      );
      const nextOwnerLabel = getOwnerLabelFromPayload(
        event.payload,
        "next_owner_label",
        "next_owner_id",
        ownerLabelMap,
        currentUserId,
      );

      if (!previousOwnerLabel && nextOwnerLabel) {
        return `Lead atribuído para ${nextOwnerLabel}.`;
      }

      if (previousOwnerLabel && nextOwnerLabel) {
        return `${previousOwnerLabel} -> ${nextOwnerLabel}`;
      }

      if (previousOwnerLabel) {
        return `${previousOwnerLabel} removido; lead voltou para fila sem responsável.`;
      }

      return "Ownership atualizado.";
    }
    case "note_added":
      return getPayloadString(event.payload, "content_preview") || undefined;
    default:
      return undefined;
  }
}

function getEventTone(eventType: CrmLeadEvent["event_type"]): TimelineItem["tone"] {
  if (eventType === "task_completed") {
    return "success";
  }

  if (eventType === "pipeline_change" || eventType === "owner_changed" || eventType === "note_added") {
    return "primary";
  }

  return "muted";
}

function getEventIcon(eventType: CrmLeadEvent["event_type"]) {
  switch (eventType) {
    case "task_added":
    case "task_completed":
    case "task_reopened":
      return <CalendarClock className="h-4 w-4" />;
    case "pipeline_change":
      return <Activity className="h-4 w-4" />;
    case "owner_changed":
      return <UserRound className="h-4 w-4" />;
    case "note_added":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getPayloadString(payload: CrmLeadEventPayload, key: keyof CrmLeadEventPayload) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getStageLabelFromPayload(value: string) {
  if (!value) {
    return "";
  }

  if (
    value === "novo"
    || value === "em_contato"
    || value === "qualificado"
    || value === "ganho"
    || value === "perdido"
  ) {
    return getLeadStageOptionLabel(value);
  }

  return value;
}

function getOwnerLabelFromPayload(
  payload: CrmLeadEventPayload,
  labelKey: keyof CrmLeadEventPayload,
  idKey: keyof CrmLeadEventPayload,
  ownerLabelMap: ReadonlyMap<string, string>,
  currentUserId?: string,
) {
  const explicitLabel = getPayloadString(payload, labelKey);

  if (explicitLabel) {
    return explicitLabel;
  }

  const ownerId = getPayloadString(payload, idKey);

  return ownerId ? getOwnerDisplayLabel(ownerId, currentUserId, ownerLabelMap) : "";
}
