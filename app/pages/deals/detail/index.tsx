import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AppSelect,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { useDeal, useUpdateDealOwner, useUpdateDealStage } from "@/features/deals/api";
import { LostReasonDialog } from "@/features/deals/LostReasonDialog";
import { ReassignOwnerDialog } from "@/features/deals/ReassignOwnerDialog";
import { useDealRealtime } from "@/features/deals/useDealRealtime";
import type { DealStage } from "@/lib/constants";
import { DealMetadata, stageOptions } from "./components/DealMetadata";
import { DealNotesPanel } from "./components/DealNotesPanel";
import { DealStageHistoryPanel } from "./components/DealStageHistoryPanel";

export function DealDetailPage() {
  const { t } = useTranslation();
  const { dealId } = useParams<{ dealId: string }>();
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  useDealRealtime(dealId);

  const { data, isLoading, isError, refetch } = useDeal(dealId);
  const updateStage = useUpdateDealStage();
  const updateOwner = useUpdateDealOwner();

  const [reassignOpen, setReassignOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);

  const canChangeStage =
    role === "manager" ||
    (role === "sales" && data?.owner?.id === profile?.id);
  const canReassign = role === "manager";
  const canAddNote = canChangeStage;

  async function handleStageChange(nextStage: string) {
    if (!dealId || !data || nextStage === data.stage) return;

    if (nextStage === "lost") {
      setPendingStage("lost");
      setLostDialogOpen(true);
      return;
    }

    try {
      await updateStage.mutateAsync({
        dealId,
        stage: nextStage as DealStage,
      });
      toast.success(t("stage-updated"));
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleLostConfirm(reason: string) {
    if (!dealId || !pendingStage) return;

    try {
      await updateStage.mutateAsync({
        dealId,
        stage: pendingStage,
        lostReason: reason,
      });
      toast.success(t("stage-updated"));
      setLostDialogOpen(false);
      setPendingStage(null);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleReassign(ownerId: string) {
    if (!dealId) return;

    try {
      await updateOwner.mutateAsync({ dealId, ownerId });
      toast.success(t("owner-updated"));
      setReassignOpen(false);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

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
        <LoadingState
          variant="inline"
          lines={4}
          className="mb-6 rounded-md border border-[var(--color-gray-200)] bg-white"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LoadingState
            variant="panel"
            lines={5}
            className="rounded-md border border-[var(--color-gray-200)] bg-white"
          />
          <LoadingState
            variant="panel"
            lines={5}
            className="rounded-md border border-[var(--color-gray-200)] bg-white"
          />
        </div>
      </>
    );
  }

  const headerActions = (
    <div className="flex flex-wrap items-end gap-2">
      {canChangeStage && (
        <div className="w-full min-w-[180px] md:w-48">
          <AppSelect
            id="deal-stage"
            labelKey="change-stage"
            value={data.stage}
            onValueChange={handleStageChange}
            options={stageOptions(t)}
            disabled={updateStage.isPending}
            size="sm"
          />
        </div>
      )}
      {canReassign && (
        <Button
          variant="secondary"
          onClick={() => setReassignOpen(true)}
          className="w-full md:w-auto"
        >
          {t("reassign-owner")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <p
        onClick={() => navigate(-1)}
        className="mb-4 inline-block text-[13px] text-[var(--color-primary-800)] hover:underline cursor-pointer"
      >
        ← {t("back")}
      </p>

      <PageHeader title={data.title} actions={headerActions} />

      <DealMetadata deal={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DealNotesPanel
          dealId={data.id}
          notes={data.notes}
          canAddNote={canAddNote}
          authorName={profile?.fullName}
        />
        <DealStageHistoryPanel history={data.stageHistory} />
      </div>

      <ReassignOwnerDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        currentOwnerId={data.owner?.id}
        onReassign={handleReassign}
        isPending={updateOwner.isPending}
      />

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={(open) => {
          setLostDialogOpen(open);
          if (!open) setPendingStage(null);
        }}
        onConfirm={handleLostConfirm}
        isPending={updateStage.isPending}
      />
    </>
  );
}

export default DealDetailPage;
