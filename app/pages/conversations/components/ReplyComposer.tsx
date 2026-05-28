import { useCallback, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Textarea } from "@/components/ui";

interface ReplyComposerProps {
  disabled?: boolean;
  isPending?: boolean;
  onSend: (body: string) => void;
}

export function ReplyComposer({
  disabled,
  isPending,
  onSend,
}: ReplyComposerProps) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");

  const submit = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || disabled || isPending) return;
    onSend(trimmed);
    setBody("");
  }, [body, disabled, isPending, onSend]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="shrink-0 border-t border-[var(--color-gray-200)] bg-white p-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? t("conversation-closed-hint") : t("reply")}
        disabled={disabled || isPending}
        rows={3}
        aria-label={t("reply")}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--color-gray-400)]">
          {t("reply-shortcut-hint")}
        </span>
        <Button
          size="sm"
          onClick={submit}
          loading={isPending}
          disabled={disabled || !body.trim()}
        >
          {t("send")}
        </Button>
      </div>
    </div>
  );
}
