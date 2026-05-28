import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Modal } from "@/components/ui";

interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function LostReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: LostReasonDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  function handleOpenChange(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleKey="lost-reason"
      descriptionKey="lost-reason-description"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isPending}
            disabled={!reason.trim()}
            variant="destructive"
          >
            {t("confirm")}
          </Button>
        </>
      }
    >
      <Input
        id="lost-reason"
        name="lostReason"
        labelKey="lost-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
        disabled={isPending}
      />
    </Modal>
  );
}
