import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { createRealtimeManager } from "@/lib/realtime";
import { dealKeys } from "./api";

export function usePipelineRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let unsubscribe: (() => void) | undefined;

    const manager = createRealtimeManager();
    unsubscribe = manager.subscribeToPipeline(() => {
      void queryClient.invalidateQueries({
        queryKey: dealKeys.all,
        refetchType: "active",
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [queryClient, isAuthenticated, user?.id]);
}
