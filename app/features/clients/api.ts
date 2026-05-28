import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type {
  ClientDealSummaryFields,
  ClientDetail,
  ClientListItem,
  ClientsFilters,
} from "@/features/clients/types";

export const clientsKeys = {
  all: ["clients"] as const,
  list: (filters: ClientsFilters) => ["clients", "list", filters] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

function buildQuery(filters: ClientsFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.ownerId) params.set("assigneeId", filters.ownerId);
  const qs = params.toString();
  return qs ? `/api/clients?${qs}` : "/api/clients";
}

export function useClients(
  filters: ClientsFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: clientsKeys.list(filters),
    queryFn: () => apiFetch<ClientListItem[]>(buildQuery(filters)),
    enabled: options?.enabled ?? true,
  });
}

export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(clientId ?? ""),
    queryFn: () => apiFetch<ClientDetail>(`/api/clients/${clientId}`),
    enabled: Boolean(clientId),
  });
}

/** Claim unowned deals on a client (sales). Threads: use Conversations assign. */
export function useClaimClientDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) =>
      apiFetch<{ clientId: string } & ClientDealSummaryFields>(
        `/api/clients/${clientId}/claim`,
        { method: "POST" },
      ),
    onSuccess: (_data, clientId) => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: clientsKeys.detail(clientId),
      });
    },
  });
}
