import { ErrorState, PageHeader } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { useDashboard } from "@/features/dashboard/api";
import { ClientDashboard } from "./components/ClientDashboard";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { SalesManagerDashboard } from "./components/SalesManagerDashboard";

export function DashboardPage() {
  const { role } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();

  const isClient = role === "client";
  const subtitleKey = isClient
    ? "dashboard-client-subtitle"
    : "dashboard-subtitle";

  return (
    <>
      <PageHeader titleKey="nav-dashboard" subtitleKey={subtitleKey} />

      {isLoading && (
        <DashboardSkeleton variant={isClient ? "client" : "sales"} />
      )}

      {isError && !isLoading && (
        <ErrorState
          messageKey="error-generic"
          onRetry={() => void refetch()}
        />
      )}

      {data && !isLoading && !isError && (
        isClient ? (
          <ClientDashboard data={data} />
        ) : (
          <SalesManagerDashboard
            data={data}
            showDealsByOwner={role === "manager"}
          />
        )
      )}
    </>
  );
}

export default DashboardPage;
