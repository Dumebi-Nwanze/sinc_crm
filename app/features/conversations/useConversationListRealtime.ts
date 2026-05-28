import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import {
  createRealtimeManager,
} from "@/lib/realtime";
import { conversationKeys } from "./api";

export function useConversationListRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

      const manager = createRealtimeManager();
      unsubscribe = manager.subscribeToThreadList(() => {
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
          refetchType: "active",
        });
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient, isAuthenticated, user?.id]);
}
