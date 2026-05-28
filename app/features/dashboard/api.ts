import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { DealStage } from "@/lib/constants";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
};

type ActivityActor = { id: string; name: string } | null;

export type DashboardActivity =
  | {
      id: string;
      type: "stage_change";
      fromStage: DealStage | null;
      toStage: DealStage;
      createdAt: string;
      actor: ActivityActor;
    }
  | {
      id: string;
      type: "message" | "note";
      description: string;
      createdAt: string;
      actor: ActivityActor;
    };

export interface DashboardStats {
  conversationsByStatus: {
    open: number;
    pending: number;
    closed: number;
  };
  unassignedCount: number;
  activeDealCount: number;
  wonDealCount: number;
  dealsByStage: { stage: DealStage; count: number }[];
  dealsByOwner: { ownerId: string; ownerName: string; count: number }[];
  recentActivity: DashboardActivity[];
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => apiFetch<DashboardStats>("/api/dashboard"),
    staleTime: 60_000,
  });
}
