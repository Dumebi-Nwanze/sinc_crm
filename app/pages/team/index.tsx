import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DataTable,
  ErrorState,
  PageHeader,
  type DataTableColumn,
} from "@/components/ui";
import { InviteTeamMemberDialog } from "@/features/team/InviteTeamMemberDialog";
import { useTeamMembers } from "@/features/team/api";
import type { TeamMember } from "@/features/team/types";

export function TeamPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useTeamMembers();

  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: "name",
      headerKey: "name",
      cell: (row) => row.fullName,
    },
    {
      key: "email",
      headerKey: "email",
      hideOnMobile: true,
      cell: (row) => row.email,
    },
    {
      key: "activeDeals",
      headerKey: "active-deals",
      cell: (row) => row.activeDealsCount,
    },
    {
      key: "openConversations",
      headerKey: "open-conversations",
      hideOnMobile: true,
      cell: (row) => row.openConversationsCount,
    },
  ];

  return (
    <>
      <PageHeader
        titleKey="team-title"
        subtitleKey="team-subtitle"
        actions={
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t("add-team-member")}
          </Button>
        }
      />

      {isError ? (
        <ErrorState messageKey="error-generic" onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessageKey="no-team-members"
        />
      )}

      <InviteTeamMemberDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default TeamPage;
