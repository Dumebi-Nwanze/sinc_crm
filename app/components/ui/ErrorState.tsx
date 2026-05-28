import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { WarningOutlined } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  messageKey?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  messageKey = "error-generic",
  onRetry,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      <Icon
        icon={WarningOutlined}
        size={28}
        className="mb-3 text-[var(--color-error)]"
      />
      <p className="max-w-[320px] text-[13px] text-[var(--color-gray-600)]">
        {t(messageKey)}
      </p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
