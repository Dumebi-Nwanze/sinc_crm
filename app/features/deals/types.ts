import type { DealStage } from "@/lib/constants";

export type DealOwnerRef = {
  id: string;
  fullName: string;
};

export type DealClientSummary = {
  id: string;
  fullName: string;
  email: string;
};

export type DealListItem = {
  id: string;
  title: string;
  stage: DealStage;
  clientId: string;
  clientName: string;
  owner: DealOwnerRef | null;
  valueAmount: number | null;
  valueCurrency: string | null;
  expectedIntake: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DealNote = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type DealStageHistoryEntry = {
  id: string;
  fromStage: DealStage | null;
  toStage: DealStage;
  changedById: string;
  changedByName: string;
  createdAt: string;
};

export type DealDetail = DealListItem & {
  lostReason: string | null;
  client: DealClientSummary;
  notes: DealNote[];
  stageHistory: DealStageHistoryEntry[];
};

export type DealsFilters = {
  stage?: DealStage;
  ownerId?: string;
  clientId?: string;
  q?: string;
  unassigned?: boolean;
  mine?: boolean;
};

export type CreateDealInput = {
  title: string;
  clientId: string;
  ownerId?: string;
  valueAmount?: number;
  valueCurrency?: string;
  expectedIntake?: string;
};

export type UpdateDealStageInput = {
  dealId: string;
  stage: DealStage;
  lostReason?: string;
};

export type UpdateDealOwnerInput = {
  dealId: string;
  ownerId: string;
};

export type AddDealNoteInput = {
  dealId: string;
  body: string;
  /** Used for optimistic note author display */
  authorName?: string;
};
