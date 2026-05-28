import { useTranslation } from "react-i18next";
import { Badge, Icon, StatCard } from "@/components/ui";
import type { DashboardStats } from "@/features/dashboard/api";
import {
  CLIENT_STAGE_LABELS,
  CONVERSATION_STATUS_META,
  PIPELINE_STAGES,
  type ConversationStatus,
  type DealStage,
} from "@/lib/constants";
import { BriefcaseOutlined, CommentsOutlined } from "@/lib/icons";

interface ClientDashboardProps {
  data: DashboardStats;
}

const ACTIVE_STAGES = PIPELINE_STAGES.filter(
  (stage) => stage !== "won" && stage !== "lost",
);

function resolvePrimaryDealStage(
  dealsByStage: DashboardStats["dealsByStage"],
): DealStage | null {
  const withCount = dealsByStage.filter((row) => row.count > 0);
  if (!withCount.length) return null;

  const won = withCount.find((row) => row.stage === "won");
  if (won) return "won";

  const lost = withCount.find((row) => row.stage === "lost");
  if (lost) return "lost";

  for (let i = ACTIVE_STAGES.length - 1; i >= 0; i -= 1) {
    const stage = ACTIVE_STAGES[i];
    if (withCount.some((row) => row.stage === stage)) {
      return stage;
    }
  }

  return withCount[0]?.stage ?? null;
}

function resolveConversationStatus(
  conversationsByStatus: DashboardStats["conversationsByStatus"],
): ConversationStatus {
  if (conversationsByStatus.open > 0) return "open";
  if (conversationsByStatus.pending > 0) return "pending";
  return "closed";
}

export function ClientDashboard({ data }: ClientDashboardProps) {
  const { t } = useTranslation();
  const primaryStage = resolvePrimaryDealStage(data.dealsByStage);
  const conversationStatus = resolveConversationStatus(data.conversationsByStatus);
  const totalConversations =
    data.conversationsByStatus.open +
    data.conversationsByStatus.pending +
    data.conversationsByStatus.closed;

  const dealValue =
    primaryStage != null
      ? t(CLIENT_STAGE_LABELS[primaryStage])
      : t("no-deals");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCard
        icon={BriefcaseOutlined}
        labelKey="dashboard-deal-status"
        value={dealValue}
      />

      <div className="rounded-md border border-[var(--color-gray-200)] bg-white p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <Icon
            icon={CommentsOutlined}
            size={20}
            className="text-[var(--color-primary-500)]"
          />
        </div>
        <p className="mt-4 text-[20px] font-semibold leading-snug text-[var(--color-gray-900)]">
          {t(CONVERSATION_STATUS_META[conversationStatus].labelKey)}
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-gray-500)]">
          {t("dashboard-conversation-status")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="status" status={conversationStatus} />
          {totalConversations > 0 && (
            <span className="text-[12px] text-[var(--color-gray-500)]">
              {t("dashboard-conversation-count", { count: totalConversations })}
            </span>
          )}
        </div>
        {totalConversations === 0 ? (
          <p className="mt-2 text-[12px] text-[var(--color-gray-500)]">
            {t("no-conversations")}
          </p>
        ) : (
          <ul className="mt-2 space-y-0.5 text-[12px] text-[var(--color-gray-500)]">
            {(["open", "pending", "closed"] as const).map((status) => {
              const count = data.conversationsByStatus[status];
              if (count === 0) return null;
              return (
                <li key={status}>
                  {t(CONVERSATION_STATUS_META[status].labelKey)}: {count}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
