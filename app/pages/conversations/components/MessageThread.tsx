import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AppSelect,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui";
import {
  useAssignConversation,
  useUpdateConversationStatus,
} from "@/features/conversations/api";
import { ReassignDialog } from "@/features/conversations/ReassignDialog";
import type { ConversationDetail } from "@/features/conversations/types";
import { useAuth } from "@/features/auth/useAuth";
import {
  CONVERSATION_STATUSES,
  CONVERSATION_STATUS_META,
  type ConversationStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
  threadId: string;
  data: ConversationDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function formatMessageTime(iso: string): string {
  return format(new Date(iso), "MMM d, h:mm a");
}

export function MessageThread({
  threadId,
  data,
  isLoading,
  isError,
  onRetry,
}: MessageThreadProps) {
  const { t } = useTranslation();
  const { role, profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reassignOpen, setReassignOpen] = useState(false);

  const assignMutation = useAssignConversation();
  const statusMutation = useUpdateConversationStatus();

  const messageCount = data?.messages.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messageCount, threadId]);

  async function handleAssignToMe() {
    if (!profile?.id) return;
    try {
      await assignMutation.mutateAsync({
        threadId,
        assigneeId: profile.id,
      });
      toast.success(t("conversation-assigned"));
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleReassign(assigneeId: string) {
    try {
      await assignMutation.mutateAsync({ threadId, assigneeId });
      toast.success(t("conversation-assigned"));
      setReassignOpen(false);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleStatusChange(status: ConversationStatus) {
    try {
      await statusMutation.mutateAsync({ threadId, status });
      toast.success(t("conversation-status-updated"));
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <LoadingState variant="panel" lines={5} className="m-4 flex-1" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState messageKey="error-generic" onRetry={onRetry} className="m-8" />
    );
  }

  if (!data) {
    return (
      <EmptyState messageKey="error-not-found" className="h-full justify-center" />
    );
  }

  const { thread, messages, client } = data;
  const isUnassigned = !thread.assignedTo;
  const showUnverifiedBadge =
    (role === "sales" || role === "manager") && client.profileId === null;
  const canManageStatus = role === "sales" || role === "manager";
  const showAssignToMe = role === "sales" && isUnassigned;
  const showReassign = role === "manager";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
      <header className="shrink-0 border-b border-[var(--color-gray-200)] bg-white px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-[var(--color-gray-900)]">
              {thread.subject}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--color-gray-500)]">
              {client.fullName}
              {thread.assignedTo
                ? ` · ${thread.assignedTo.fullName}`
                : ` · ${t("unassigned")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="status" status={thread.status} />
            {showUnverifiedBadge && (
              <span className="inline-flex items-center gap-1 rounded-[2px] bg-[var(--color-warning-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                <span aria-hidden>●</span>
                {t("account-not-yet-claimed")}
              </span>
            )}
          </div>
        </div>

        {(showAssignToMe || showReassign || canManageStatus) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
          
            {canManageStatus && (
              <label className="flex items-center gap-2 text-[12px] text-[var(--color-gray-600)]">
                <span>{t("status")}</span>
                <AppSelect
                  id="conversation-status"
                  value={thread.status}
                  onValueChange={(v) =>
                    void handleStatusChange(v as ConversationStatus)
                  }
                  options={CONVERSATION_STATUSES.map((s) => ({
                    value: s,
                    label: t(CONVERSATION_STATUS_META[s].labelKey),
                  }))}
                  disabled={statusMutation.isPending}
                  size="sm"
                  className="min-w-[8rem]"
                />
              </label>
            )}
              {showAssignToMe && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleAssignToMe()}
                loading={assignMutation.isPending}
              >
                {t("assign-to-me")}
              </Button>
            )}
            {showReassign && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReassignOpen(true)}
              >
                {t("reassign")}
              </Button>
            )}
          </div>
        )}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
      >
        {!messages.length ? (
          <EmptyState messageKey="no-messages-yet" className="py-12" />
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => {
              const isClient = message.senderType === "client";
              const isOptimistic = message.id.startsWith("optimistic-");

              return (
                <li
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1",
                    isClient ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className="flex items-baseline gap-2 text-[11px] text-[var(--color-gray-500)]"
                  >
                    <span className="font-medium text-[var(--color-gray-700)]">
                      {message.senderName ||
                        (isClient ? client.fullName : t("role-sales"))}
                    </span>
                    {!isOptimistic && (
                      <time className="font-mono text-[10px]">
                        {formatMessageTime(message.createdAt)}
                      </time>
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                      isClient
                        ? "bg-[var(--color-primary-100)] text-[var(--color-primary-900)]"
                        : "bg-[var(--color-gray-100)] text-[var(--color-gray-800)]",
                      isOptimistic && "opacity-70",
                    )}
                  >
                    {message.body}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        currentAssigneeId={thread.assignedTo?.id}
        onAssign={(id) => void handleReassign(id)}
        isPending={assignMutation.isPending}
      />
    </div>
  );
}
