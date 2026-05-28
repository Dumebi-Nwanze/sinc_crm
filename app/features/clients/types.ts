export type OwnershipStatus = "unowned" | "owned";

export type DealOwnerRef = {
  id: string;
  fullName: string;
};

export type ClientDealSummaryFields = {
  ownershipStatus: OwnershipStatus;
  activeDealsCount: number;
  unownedDealsCount: number;
  uniqueOwnerCount: number;
  ownerNames: string[];
};

export type ClientListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  targetCountry: string | null;
  createdAt: string;
} & ClientDealSummaryFields;

export type ClientConversationSummary = {
  id: string;
  subject: string;
  status: string;
  assignedTo: DealOwnerRef | null;
  lastMessageAt: string;
};

export type ClientDealSummary = {
  id: string;
  title: string;
  stage: string;
  owner: DealOwnerRef | null;
  valueAmount: number | null;
  valueCurrency: string | null;
};

import type { DealStage } from "@/lib/constants";

export type ClientActivityItem =
  | {
      id: string;
      type: "stage_change";
      fromStage: DealStage | null;
      toStage: DealStage;
      createdAt: string;
    }
  | {
      id: string;
      type: "note" | "message";
      text: string;
      createdAt: string;
    };

export type ClientDetail = ClientListItem & {
  conversations: ClientConversationSummary[];
  deals: ClientDealSummary[];
  activity: ClientActivityItem[];
};

export type ClientsFilters = {
  q?: string;
  ownerId?: string;
};
