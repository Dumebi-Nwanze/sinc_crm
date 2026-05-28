import type { IconData } from "@lineiconshq/free-icons";
import {
  CalendarOutlined,
  CheckmarkCircleOutlined,
  CloseOutlined,
  FilesOutlined,
  PencilOutlined,
  PhoneOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@/lib/icons";

export const PIPELINE_STAGES = [
  "new_lead",
  "contacted",
  "consultation_booked",
  "documents_requested",
  "application_started",
  "submitted",
  "won",
  "lost",
] as const;

export type DealStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_META: Record<
  DealStage,
  { labelKey: string; color: string; bg: string; icon: IconData }
> = {
  new_lead: {
    labelKey: "stage-new-lead",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: UserOutlined,
  },
  contacted: {
    labelKey: "stage-contacted",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: PhoneOutlined,
  },
  consultation_booked: {
    labelKey: "stage-consultation-booked",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: CalendarOutlined,
  },
  documents_requested: {
    labelKey: "stage-documents-requested",
    color: "#d97706",
    bg: "#fef3c7",
    icon: FilesOutlined,
  },
  application_started: {
    labelKey: "stage-application-started",
    color: "#ea580c",
    bg: "#ffedd5",
    icon: PencilOutlined,
  },
  submitted: {
    labelKey: "stage-submitted",
    color: "#0891b2",
    bg: "#cffafe",
    icon: CheckmarkCircleOutlined,
  },
  won: {
    labelKey: "stage-won",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: TrophyOutlined,
  },
  lost: {
    labelKey: "stage-lost",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: CloseOutlined,
  },
};

/** Client-facing plain-language labels — never show raw stage names to clients. */
export const CLIENT_STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "client-stage-new-lead",
  contacted: "client-stage-in-progress",
  consultation_booked: "client-stage-in-progress",
  documents_requested: "client-stage-action-required",
  application_started: "client-stage-in-progress",
  submitted: "client-stage-submitted",
  won: "client-stage-won",
  lost: "client-stage-closed",
};

export type ConversationStatus = "open" | "pending" | "closed";

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  "open",
  "pending",
  "closed",
];

export const CONVERSATION_STATUS_META: Record<
  ConversationStatus,
  { labelKey: string; color: string; bg: string }
> = {
  open: { labelKey: "status-open", color: "#2563eb", bg: "#dbeafe" },
  pending: { labelKey: "status-pending", color: "#d97706", bg: "#fef3c7" },
  closed: { labelKey: "status-closed", color: "#6b7280", bg: "#f3f4f6" },
};

export type AppRole = "client" | "sales" | "manager";

export const ROLE_LABEL_KEYS: Record<AppRole, string> = {
  client: "role-client",
  sales: "role-sales",
  manager: "role-manager",
};
