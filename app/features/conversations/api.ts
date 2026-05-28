import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { ConversationStatus } from "@/lib/constants";
import type {
  AssignConversationInput,
  ConversationDetail,
  ConversationListItem,
  ConversationsFilters,
  CreateConversationInput,
  CreateConversationResult,
  SendMessageInput,
  UpdateConversationStatusInput,
} from "@/features/conversations/types";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: (filters: ConversationsFilters) =>
    ["conversations", "list", filters] as const,
  detail: (threadId: string) => ["conversations", "detail", threadId] as const,
};

type ApiListItem = {
  id: string;
  subject: string;
  status: ConversationStatus;
  lastMessageAt: string;
  assignedTo: string | null;
  assigneeName: string | null;
  clientName: string;
  lastMessageSnippet: string | null;
  clientProfileId: string | null;
};

type ApiThreadDetail = ApiListItem & {
  client: ConversationDetail["client"];
  messages: ConversationDetail["messages"];
};

function mapAssignee(
  assignedTo: string | null,
  assigneeName: string | null,
): ConversationListItem["assignedTo"] {
  if (!assignedTo || !assigneeName) return null;
  return { id: assignedTo, fullName: assigneeName };
}

function mapListItem(row: ApiListItem): ConversationListItem {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    lastMessageAt: row.lastMessageAt,
    assignedTo: mapAssignee(row.assignedTo, row.assigneeName),
    lastMessageSnippet: row.lastMessageSnippet,
    clientName: row.clientName,
  };
}

function mapThreadDetail(row: ApiThreadDetail): ConversationDetail {
  return {
    thread: {
      id: row.id,
      subject: row.subject,
      status: row.status,
      lastMessageAt: row.lastMessageAt,
      assignedTo: mapAssignee(row.assignedTo, row.assigneeName),
      clientId: row.client.id,
    },
    client: row.client,
    messages: row.messages,
  };
}

function buildListQuery(filters: ConversationsFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters.mine) params.set("mine", "true");
  if (filters.unassigned) params.set("unassigned", "true");
  const qs = params.toString();
  return qs ? `/api/conversations?${qs}` : "/api/conversations";
}

export function filtersForTab(
  tab: "unassigned" | "mine" | "all",
): ConversationsFilters {
  if (tab === "unassigned") return { unassigned: true };
  if (tab === "mine") return { mine: true };
  return {};
}

export function useConversations(filters: ConversationsFilters = {}) {
  return useQuery({
    queryKey: conversationKeys.list(filters),
    queryFn: async () => {
      const rows = await apiFetch<ApiListItem[]>(buildListQuery(filters));
      return rows.map(mapListItem);
    },
  });
}

export function useConversation(threadId: string | undefined) {
  return useQuery({
    queryKey: conversationKeys.detail(threadId ?? ""),
    queryFn: async () => {
      const row = await apiFetch<ApiThreadDetail>(
        `/api/conversations/${threadId}`,
      );
      return mapThreadDetail(row);
    },
    enabled: Boolean(threadId),
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, assigneeId }: AssignConversationInput) =>
      apiFetch<{ id: string; assignedTo: { id: string; fullName: string } }>(
        `/api/conversations/${threadId}/assign`,
        {
          method: "PATCH",
          body: JSON.stringify({ assigneeId }),
        },
      ),
    onSuccess: (_data, { threadId }) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(threadId),
      });
    },
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, status }: UpdateConversationStatusInput) =>
      apiFetch<{ id: string; status: ConversationStatus }>(
        `/api/conversations/${threadId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      ),
    onSuccess: (_data, { threadId }) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(threadId),
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, body }: SendMessageInput) =>
      apiFetch<ConversationDetail["messages"][number]>(
        `/api/conversations/${threadId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body }),
        },
      ),
    onMutate: async ({ threadId, body, senderName, senderType }) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(threadId),
      });

      const previous = queryClient.getQueryData<ConversationDetail>(
        conversationKeys.detail(threadId),
      );

      if (previous) {
        const optimisticId = `optimistic-${Date.now()}`;
        queryClient.setQueryData<ConversationDetail>(
          conversationKeys.detail(threadId),
          {
            ...previous,
            messages: [
              ...previous.messages,
              {
                id: optimisticId,
                threadId,
                senderId: "pending",
                senderType: senderType ?? "team",
                senderName: senderName ?? "",
                body,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        );
      }

      return { previous, threadId };
    },
    onError: (_err, { threadId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          conversationKeys.detail(threadId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { threadId }) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(threadId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput) =>
      apiFetch<CreateConversationResult>("/api/conversations", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}
