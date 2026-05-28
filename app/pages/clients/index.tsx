import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState, Input, PageHeader } from "@/components/ui";
import { useClients } from "@/features/clients/api";
import { ClientsTable } from "./components/ClientsTable";

export function ClientsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useClients({
    q: debouncedSearch || undefined,
  });

  return (
    <>
      <PageHeader titleKey="nav-clients" subtitleKey="clients-subtitle" />

      <div className="mb-4 max-w-md">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search-clients-placeholder")}
          aria-label={t("search")}
        />
      </div>

      {isError ? (
        <ErrorState messageKey="error-generic" onRetry={() => void refetch()} />
      ) : (
        <ClientsTable data={data ?? []} isLoading={isLoading} />
      )}
    </>
  );
}

export default ClientsPage;
