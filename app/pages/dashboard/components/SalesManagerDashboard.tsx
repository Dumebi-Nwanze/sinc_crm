import {
  BriefcaseOutlined,
  CommentsOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@/lib/icons";
import { StatCard } from "@/components/ui";
import type { DashboardStats } from "@/features/dashboard/api";
import { DealsByOwnerPanel } from "./DealsByOwnerPanel";
import { DealsByStagePanel } from "./DealsByStagePanel";
import { RecentActivityFeed } from "./RecentActivityFeed";

interface SalesManagerDashboardProps {
  data: DashboardStats;
  showDealsByOwner: boolean;
}

export function SalesManagerDashboard({
  data,
  showDealsByOwner,
}: SalesManagerDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CommentsOutlined}
          labelKey="stat-open-chats"
          value={data.conversationsByStatus.open}
        />
        <StatCard
          icon={UserOutlined}
          labelKey="stat-unassigned"
          value={data.unassignedCount}
        />
        <StatCard
          icon={BriefcaseOutlined}
          labelKey="stat-active-deals"
          value={data.activeDealCount}
        />
        <StatCard
          icon={TrophyOutlined}
          labelKey="stat-won-deals"
          value={data.wonDealCount}
        />
      </div>

      <div
        className={
          showDealsByOwner
            ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
            : "grid grid-cols-1 gap-4"
        }
      >
        <DealsByStagePanel dealsByStage={data.dealsByStage} />
        {showDealsByOwner && (
          <DealsByOwnerPanel dealsByOwner={data.dealsByOwner} />
        )}
      </div>

      <RecentActivityFeed activity={data.recentActivity} />
    </div>
  );
}
