import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { TeamMember } from "@/features/team/types";

export const teamKeys = {
  all: ["team"] as const,
  list: () => ["team", "list"] as const,
};

export function useTeamMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: () => apiFetch<TeamMember[]>("/api/team"),
    enabled: options?.enabled ?? true,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { fullName: string; email: string }) =>
      apiFetch<{ profileId: string }>("/api/team/invite", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}
