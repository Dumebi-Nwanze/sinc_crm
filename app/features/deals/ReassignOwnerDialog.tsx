import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppSelect,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
} from "@/components/ui";
import { useTeamMembers } from "@/features/team/api";

interface ReassignOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOwnerId?: string | null;
  onReassign: (ownerId: string) => void;
  isPending?: boolean;
}

export function ReassignOwnerDialog({
  open,
  onOpenChange,
  currentOwnerId,
  onReassign,
  isPending,
}: ReassignOwnerDialogProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState("");
  const { data, isLoading, isError, refetch } = useTeamMembers();

  const members = (data ?? []).filter((m) => m.id !== currentOwnerId);
  const options = members.map((member) => ({
    value: member.id,
    label: `${member.fullName} (${member.email})`,
  }));

  function handleOpenChange(next: boolean) {
    if (!next) setSelectedId("");
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!selectedId) return;
    onReassign(selectedId);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleKey="reassign-owner"
      descriptionKey="reassign-owner-description"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isPending}
            disabled={!selectedId}
          >
            {t("assign")}
          </Button>
        </>
      }
    >
      <div className="px-6 pb-6">
        {isLoading ? (
          <LoadingState variant="inline" lines={4} />
        ) : isError ? (
          <ErrorState messageKey="error-generic" onRetry={() => void refetch()} />
        ) : !members.length ? (
          <EmptyState messageKey="no-team-members" className="py-6" />
        ) : (
          <AppSelect
            id="reassign-deal-owner"
            labelKey="deal-owner"
            placeholderKey="select-owner"
            value={selectedId}
            onValueChange={setSelectedId}
            options={options}
            disabled={isPending}
          />
        )}
      </div>
    </Modal>
  );
}
