import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  LoadingState,
  SectionPanel,
  Textarea,
} from "@/components/ui";
import { useAddDealNote } from "@/features/deals/api";
import type { DealNote } from "@/features/deals/types";
import { formatRelativeTime } from "@/lib/utils";

interface DealNotesPanelProps {
  dealId: string;
  notes: DealNote[];
  canAddNote: boolean;
  authorName?: string;
}

export function DealNotesPanel({
  dealId,
  notes,
  canAddNote,
  authorName,
}: DealNotesPanelProps) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const addNote = useAddDealNote();

  async function handleAdd() {
    const trimmed = body.trim();
    if (!trimmed) return;

    try {
      await addNote.mutateAsync({
        dealId,
        body: trimmed,
        authorName,
      });
      setBody("");
      toast.success(t("note-added"));
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  return (
    <SectionPanel titleKey="notes">
      {canAddNote && (
        <div className="border-b border-[var(--color-gray-100)] px-4 py-3">
          <Textarea
            id="deal-note"
            name="note"
            placeholder={t("note-placeholder")}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={addNote.isPending}
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => void handleAdd()}
              loading={addNote.isPending}
              disabled={!body.trim()}
              className="w-full md:w-auto"
            >
              {t("add-note")}
            </Button>
          </div>
        </div>
      )}

      {!notes.length ? (
        <EmptyState messageKey="no-notes" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {notes.map((note) => (
            <li key={note.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-[var(--color-gray-900)]">
                  {note.authorName}
                </span>
                <time
                  className="shrink-0 text-[11px] text-[var(--color-gray-500)]"
                  dateTime={note.createdAt}
                >
                  {formatRelativeTime(note.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-[var(--color-gray-700)]">
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {addNote.isPending && (
        <LoadingState variant="inline" lines={1} className="px-4 py-2" />
      )}
    </SectionPanel>
  );
}
