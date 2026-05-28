import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge, Button, PageHeader } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { NewDealDialog } from "@/features/deals/NewDealDialog";
import type { ClientDetail } from "@/features/clients/types";

interface ClientDetailHeaderProps {
  client: ClientDetail;
}

function formatDealSubtitle(
  client: ClientDetail,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];

  if (client.activeDealsCount === 0) {
    parts.push(
      client.unownedDealsCount > 0
        ? t("deals-unowned-only")
        : t("no-active-deals"),
    );
  } else if (client.activeDealsCount === 1) {
    parts.push(t("active-deals-count-one"));
  } else {
    parts.push(t("active-deals-count", { count: client.activeDealsCount }));
  }

  if (client.unownedDealsCount > 0) {
    parts.push(
      t("unowned-deals-count", { count: client.unownedDealsCount }),
    );
  }

  return parts.join(" · ");
}

export function ClientDetailHeader({ client }: ClientDetailHeaderProps) {
  const { t } = useTranslation();
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const [newDealOpen, setNewDealOpen] = useState(false);

  const canCreateDeal =
    client.ownershipStatus === "owned" ||
    (role === "sales" &&
      client.conversations.some(
        (conversation) => conversation.assignedTo?.id === profile?.id,
      ));

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {canCreateDeal ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setNewDealOpen(true)}
        >
          {t("new-deal")}
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled
          title={t("new-deal-requires-owner")}
        >
          {t("new-deal")}
        </Button>
      )}
      <Button type="button" variant="ghost" disabled>
        {t("new-chat")}
      </Button>
    </div>
  );

  const subtitle = (
    <span className="text-[13px] text-[var(--color-gray-500)]">
      {formatDealSubtitle(client, t)}
      {role === "manager" && client.uniqueOwnerCount > 1 && (
        <>
          {" · "}
          <Badge labelKey="multiple-deal-owners" className="inline-flex" />
        </>
      )}
    </span>
  );

  return (
    <>
      <PageHeader title={client.fullName} subtitle={subtitle} actions={actions} />
      <NewDealDialog
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        defaultClientId={client.id}
        onSuccess={(dealId) => {
          toast.success(t("deal-created"));
          navigate(`/deals/${dealId}`);
        }}
      />
    </>
  );
}
