import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { createRealtimeManager } from "@/lib/realtime";
import { dealKeys } from "./api";

export function useDealRealtime(dealId: string | undefined) {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!dealId || !isAuthenticated || !user?.id) return;

    let unsubscribe: (() => void) | undefined;

    const manager = createRealtimeManager();
    unsubscribe = manager.subscribeToDeal(dealId, () => {
      void queryClient.invalidateQueries({
        queryKey: dealKeys.detail(dealId),
        refetchType: "active",
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [dealId, queryClient, isAuthenticated, user?.id]);
}
