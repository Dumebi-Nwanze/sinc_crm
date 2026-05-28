import type { ConversationStatus } from "@/lib/constants";

export type AssigneeRef = {
  id: string;
  fullName: string;
};

export type ConversationListItem = {
  id: string;
  subject: string;
  status: ConversationStatus;
  assignedTo: AssigneeRef | null;
  lastMessageAt: string;
  lastMessageSnippet?: string | null;
  unreadCount?: number;
  clientName?: string | null;
};

export type ConversationsFilters = {
  status?: ConversationStatus;
  assignedTo?: string;
  mine?: boolean;
  unassigned?: boolean;
};

export type MessageSenderType = "client" | "team";

export type ConversationMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderType: MessageSenderType;
  senderName: string;
  body: string;
  createdAt: string;
};

export type ConversationThread = {
  id: string;
  subject: string;
  status: ConversationStatus;
  assignedTo: AssigneeRef | null;
  clientId: string;
  lastMessageAt: string;
};

export type ConversationClient = {
  id: string;
  fullName: string;
  email: string;
  profileId: string | null;
};

export type ConversationDetail = {
  thread: ConversationThread;
  messages: ConversationMessage[];
  client: ConversationClient;
};

export type CreateConversationInput = {
  subject: string;
  body: string;
  clientId?: string;
};

export type CreateConversationResult = {
  id: string;
  subject: string;
  status: ConversationStatus;
};

export type AssignConversationInput = {
  threadId: string;
  assigneeId: string;
};

export type UpdateConversationStatusInput = {
  threadId: string;
  status: ConversationStatus;
};

export type SendMessageInput = {
  threadId: string;
  body: string;
  /** Used for optimistic UI only */
  senderName?: string;
  senderType?: MessageSenderType;
};

export type ConversationListFilterTab = "unassigned" | "mine" | "all";
