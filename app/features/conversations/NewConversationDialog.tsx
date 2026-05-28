import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import type { CreateConversationInput } from "@/features/conversations/types";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConversationInput) => void;
  isPending?: boolean;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: NewConversationDialogProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject || !trimmedBody) return;
    onSubmit({ subject: trimmedSubject, body: trimmedBody });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSubject("");
      setBody("");
    }
    onOpenChange(next);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleKey="new-chat"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="new-conversation-form"
            loading={isPending}
            disabled={!subject.trim() || !body.trim()}
          >
            {t("send")}
          </Button>
        </>
      }
    >
      <form
        id="new-conversation-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-6 pb-6"
      >
        <Input
          labelKey="conversation-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={200}
        />
        <Textarea
          labelKey="message"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
        />
      </form>
    </Modal>
  );
}
