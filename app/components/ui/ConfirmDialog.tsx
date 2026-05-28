import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleKey: string;
  messageKey: string;
  confirmLabelKey?: string;
  cancelLabelKey?: string;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  titleKey,
  messageKey,
  confirmLabelKey = "confirm",
  cancelLabelKey = "cancel",
  onConfirm,
  loading = false,
  destructive = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleKey={titleKey}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t(cancelLabelKey)}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {t(confirmLabelKey)}
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[var(--color-gray-600)]">{t(messageKey)}</p>
    </Modal>
  );
}
