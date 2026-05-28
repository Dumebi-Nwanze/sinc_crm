import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/_primitives/dialog";
import { Icon } from "@/components/ui/Icon";
import { CloseOutlined } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleKey: string;
  descriptionKey?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  hideClose?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onOpenChange,
  titleKey,
  descriptionKey,
  children,
  footer,
  size = "md",
  className,
  hideClose = false,
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] p-0",
          sizeClasses[size],
          className,
        )}
      >
        <div className="border-b border-[var(--color-gray-100)] px-5 py-4">
          <DialogTitle>{t(titleKey)}</DialogTitle>
          {descriptionKey && (
            <DialogDescription className="mt-1">
              {t(descriptionKey)}
            </DialogDescription>
          )}
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-gray-100)] bg-[var(--color-gray-50)] px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
        {!hideClose && (
          <DialogClose
            className="absolute right-4 top-4 rounded p-1 text-[var(--color-gray-500)] hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]"
            aria-label={t("close")}
          >
            <Icon icon={CloseOutlined} size={16} />
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
