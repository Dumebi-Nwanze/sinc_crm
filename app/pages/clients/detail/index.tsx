import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ErrorState, LoadingState } from "@/components/ui";
import { useClient } from "@/features/clients/api";
import { ClientActivityTimeline } from "./components/ClientActivityTimeline";
import { ClientConversationsPanel } from "./components/ClientConversationsPanel";
import { ClientDealsPanel } from "./components/ClientDealsPanel";
import { ClientDetailHeader } from "./components/ClientDetailHeader";
import { ClientProfileRow } from "./components/ClientProfileRow";

export function ClientDetailPage() {
  const { t } = useTranslation();
  const { clientId } = useParams<{ clientId: string }>();
  const { data, isLoading, isError, refetch } = useClient(clientId);

  if (isError) {
    return (
      <ErrorState
        messageKey="error-not-found"
        onRetry={() => void refetch()}
        className="min-h-[40vh]"
      />
    );
  }

  if (isLoading || !data) {
    return (
      <>
        <LoadingState variant="panel" lines={2} className="mb-6" />
        <LoadingState variant="inline" lines={1} className="mb-6 rounded-md border border-[var(--color-gray-200)] bg-white" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LoadingState variant="panel" lines={4} className="rounded-md border border-[var(--color-gray-200)] bg-white" />
          <LoadingState variant="panel" lines={4} className="rounded-md border border-[var(--color-gray-200)] bg-white" />
        </div>
        <LoadingState variant="panel" lines={5} className="mt-4 rounded-md border border-[var(--color-gray-200)] bg-white" />
      </>
    );
  }

  return (
    <>
      <Link
        to="/clients"
        className="mb-4 inline-block text-[13px] text-[var(--color-primary-800)] hover:underline"
      >
        ← {t("back")}
      </Link>

      <ClientDetailHeader client={data} />

      <div className="mb-6">
        <ClientProfileRow client={data} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClientConversationsPanel
          conversations={data.conversations}
          isLoading={false}
        />
        <ClientDealsPanel deals={data.deals} isLoading={false} />
      </div>

      <div className="mt-4">
        <ClientActivityTimeline activity={data.activity} isLoading={false} />
      </div>
    </>
  );
}

export default ClientDetailPage;
