import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { Badge, DataTable, type DataTableColumn } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import type { ClientListItem } from "@/features/clients/types";

interface ClientsTableProps {
  data: ClientListItem[];
  isLoading?: boolean;
}

function formatDealsSummary(row: ClientListItem, t: TFunction): string {
  if (row.activeDealsCount === 0) {
    return row.unownedDealsCount > 0 ? t("deals-unowned-only") : "—";
  }
  if (row.activeDealsCount === 1) {
    return t("active-deals-count-one");
  }
  return t("active-deals-count", { count: row.activeDealsCount });
}

function formatOwnersSummary(row: ClientListItem, t: TFunction): string {
  if (row.unownedDealsCount > 0 && row.uniqueOwnerCount === 0) {
    return t("unowned-deals");
  }
  if (row.uniqueOwnerCount === 0) {
    return "—";
  }
  if (row.uniqueOwnerCount === 1) {
    return row.ownerNames[0] ?? "—";
  }
  return t("multiple-deal-owners");
}

export function ClientsTable({ data, isLoading }: ClientsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();

  const activeDealsHeaderKey =
    role === "sales" ? "my-active-deals" : "active-deals";

  const columns: DataTableColumn<ClientListItem>[] = [
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
      key: "phone",
      headerKey: "phone",
      hideOnMobile: true,
      cell: (row) => row.phone ?? "—",
    },
    {
      key: "targetCountry",
      headerKey: "target-country",
      hideOnMobile: true,
      cell: (row) => row.targetCountry ?? "—",
    },
    {
      key: "activeDeals",
      headerKey: activeDealsHeaderKey,
      cell: (row) => (
        <span className="text-[13px]">{formatDealsSummary(row, t)}</span>
      ),
    },
    ...(role === "manager"
      ? [
          {
            key: "dealOwners",
            headerKey: "deal-owners",
            hideOnMobile: true,
            cell: (row: ClientListItem) => (
              <span className="text-[13px]">{formatOwnersSummary(row, t)}</span>
            ),
          } as DataTableColumn<ClientListItem>,
        ]
      : []),
    {
      key: "createdAt",
      headerKey: "created-at",
      hideOnMobile: true,
      cell: (row) => format(new Date(row.createdAt), "MMM d, yyyy"),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id}
      isLoading={isLoading}
      emptyMessageKey="no-clients"
      onRowClick={(row) => navigate(`/clients/${row.id}`)}
      mobileCard={(row) => (
        <button
          type="button"
          onClick={() => navigate(`/clients/${row.id}`)}
          className="w-full rounded-md border border-[var(--color-gray-200)] bg-white p-4 text-left"
        >
          <p className="font-medium text-[var(--color-gray-900)]">{row.fullName}</p>
          <p className="mt-1 text-[12px] text-[var(--color-gray-500)]">{row.email}</p>
          <p className="mt-2 text-[12px] text-[var(--color-gray-600)]">
            {formatDealsSummary(row, t)}
          </p>
          {role === "manager" && (
            <p className="mt-1 text-[12px] text-[var(--color-gray-500)]">
              {formatOwnersSummary(row, t)}
            </p>
          )}
        </button>
      )}
    />
  );
}
