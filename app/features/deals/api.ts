import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { DealStage } from "@/lib/constants";
import type {
  AddDealNoteInput,
  CreateDealInput,
  DealDetail,
  DealListItem,
  DealNote,
  DealOwnerRef,
  DealsFilters,
  UpdateDealOwnerInput,
  UpdateDealStageInput,
} from "@/features/deals/types";

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => ["deals", "list"] as const,
  list: (filters: DealsFilters) => ["deals", "list", filters] as const,
  detail: (id: string) => ["deals", "detail", id] as const,
};

type ApiOwner = { id: string; fullName: string } | null;

type ApiListRow = {
  id: string;
  title: string;
  stage: DealStage;
  clientId: string;
  clientName: string;
  ownerId: string | null;
  ownerName: string | null;
  valueAmount: number | null;
  valueCurrency: string | null;
  expectedIntake: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiNoteRow = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

type ApiHistoryRow = {
  id: string;
  fromStage: DealStage | null;
  toStage: DealStage;
  changedById: string;
  changedByName: string;
  createdAt: string;
};

type ApiDetailRow = ApiListRow & {
  lostReason: string | null;
  client: { id: string; fullName: string; email: string };
  notes: ApiNoteRow[];
  stageHistory: ApiHistoryRow[];
};

function mapOwner(
  ownerId: string | null,
  ownerName: string | null,
): DealOwnerRef | null {
  if (!ownerId || !ownerName) return null;
  return { id: ownerId, fullName: ownerName };
}

function mapListRow(row: ApiListRow): DealListItem {
  return {
    id: row.id,
    title: row.title,
    stage: row.stage,
    clientId: row.clientId,
    clientName: row.clientName,
    owner: mapOwner(row.ownerId, row.ownerName),
    valueAmount: row.valueAmount,
    valueCurrency: row.valueCurrency,
    expectedIntake: row.expectedIntake,
    lostReason: row.lostReason ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapDetail(row: ApiDetailRow): DealDetail {
  return {
    ...mapListRow(row),
    lostReason: row.lostReason,
    client: row.client,
    notes: row.notes,
    stageHistory: row.stageHistory,
  };
}

function buildListQuery(filters: DealsFilters): string {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.ownerId) params.set("ownerId", filters.ownerId);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.unassigned) params.set("unassigned", "true");
  if (filters.mine) params.set("mine", "true");
  const qs = params.toString();
  return qs ? `/api/deals?${qs}` : "/api/deals";
}

function patchListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (items: DealListItem[]) => DealListItem[],
) {
  queryClient.setQueriesData<DealListItem[]>(
    { queryKey: dealKeys.lists(), exact: false },
    (old) => (old ? updater(old) : old),
  );
}

export function useDeals(
  filters: DealsFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: async () => {
      const rows = await apiFetch<ApiListRow[]>(buildListQuery(filters));
      return rows.map(mapListRow);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: dealKeys.detail(dealId ?? ""),
    queryFn: async () => {
      const row = await apiFetch<ApiDetailRow>(`/api/deals/${dealId}`);
      return mapDetail(row);
    },
    enabled: Boolean(dealId),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) =>
      apiFetch<DealListItem>("/api/deals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stage, lostReason }: UpdateDealStageInput) =>
      apiFetch<{ id: string; stage: DealStage }>(
        `/api/deals/${dealId}/stage`,
        {
          method: "PATCH",
          body: JSON.stringify({ stage, lostReason }),
        },
      ),
    onMutate: async ({ dealId, stage }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.all });

      const previousLists = queryClient.getQueriesData<DealListItem[]>({
        queryKey: dealKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<DealDetail>(
        dealKeys.detail(dealId),
      );

      patchListCaches(queryClient, (items) =>
        items.map((item) =>
          item.id === dealId ? { ...item, stage } : item,
        ),
      );

      if (previousDetail) {
        queryClient.setQueryData<DealDetail>(dealKeys.detail(dealId), {
          ...previousDetail,
          stage,
        });
      }

      return { previousLists, previousDetail, dealId };
    },
    onError: (_err, { dealId }, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          dealKeys.detail(dealId),
          context.previousDetail,
        );
      }
    },
    onSettled: (_data, _err, { dealId }) => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.all });
      void queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    },
  });
}

export function useUpdateDealOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, ownerId }: UpdateDealOwnerInput) =>
      apiFetch<{ id: string; owner: DealOwnerRef }>(
        `/api/deals/${dealId}/owner`,
        {
          method: "PATCH",
          body: JSON.stringify({ ownerId }),
        },
      ),
    onSuccess: (_data, { dealId }) => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.all });
      void queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    },
  });
}

export function useAddDealNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, body }: AddDealNoteInput) =>
      apiFetch<DealNote>(`/api/deals/${dealId}/notes`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onMutate: async ({ dealId, body, authorName }) => {
      await queryClient.cancelQueries({
        queryKey: dealKeys.detail(dealId),
      });

      const previous = queryClient.getQueryData<DealDetail>(
        dealKeys.detail(dealId),
      );

      if (previous) {
        queryClient.setQueryData<DealDetail>(dealKeys.detail(dealId), {
          ...previous,
          notes: [
            ...previous.notes,
            {
              id: `optimistic-${Date.now()}`,
              body,
              authorId: "pending",
              authorName: authorName ?? "",
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }

      return { previous, dealId };
    },
    onError: (_err, { dealId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dealKeys.detail(dealId), context.previous);
      }
    },
    onSettled: (_data, _err, { dealId }) => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    },
  });
}
