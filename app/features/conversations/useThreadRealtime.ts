import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import {
  createRealtimeManager
} from "@/lib/realtime";
import { conversationKeys } from "./api";

export function useThreadRealtime(threadId: string | undefined) {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!threadId || !isAuthenticated || !user?.id) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

      const manager = createRealtimeManager();
      unsubscribe = manager.subscribeToThread(threadId, () => {
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(threadId),
          refetchType: "active",
        });
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
          refetchType: "active",
        });
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [threadId, queryClient, isAuthenticated, user?.id]);
}
