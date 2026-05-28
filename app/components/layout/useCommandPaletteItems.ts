import { useEffect, useMemo, useState } from "react";
import type { CommandPaletteItem } from "@/components/layout/CommandPalette";
import { useClients } from "@/features/clients/api";
import { useDeals } from "@/features/deals/api";
import type { AppRole } from "@/lib/constants";
import { getCommandPaletteItemsForRole } from "@/lib/navigation";

const SEARCH_MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function useCommandPaletteItems(role: AppRole | null | undefined) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQuery(searchQuery.trim()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const canSearchEntities = role === "sales" || role === "manager";
  const searchEnabled =
    canSearchEntities && debouncedQuery.length >= SEARCH_MIN_LENGTH;

  const { data: clients, isFetching: clientsFetching } = useClients(
    { q: debouncedQuery },
    { enabled: searchEnabled },
  );

  const { data: deals, isFetching: dealsFetching } = useDeals(
    { q: debouncedQuery },
    { enabled: searchEnabled },
  );

  const navItems = useMemo(
    () => getCommandPaletteItemsForRole(role),
    [role],
  );

  const searchItems = useMemo((): CommandPaletteItem[] => {
    if (!searchEnabled) return [];

    const clientItems: CommandPaletteItem[] = (clients ?? []).map((client) => ({
      id: `client-${client.id}`,
      label: client.fullName,
      subtitle: client.email,
      href: `/clients/${client.id}`,
      groupKey: "clients",
    }));

    const dealItems: CommandPaletteItem[] = (deals ?? []).map((deal) => ({
      id: `deal-${deal.id}`,
      label: deal.title,
      subtitle: deal.clientName,
      href: `/deals/${deal.id}`,
      groupKey: "deals",
    }));

    return [...clientItems, ...dealItems];
  }, [searchEnabled, clients, deals]);

  const items = useMemo(() => {
    if (searchEnabled) return searchItems;
    return navItems;
  }, [searchEnabled, searchItems, navItems]);

  return {
    items,
    searchQuery,
    setSearchQuery,
    isSearching: searchEnabled && (clientsFetching || dealsFetching),
    disableFilter: searchEnabled,
  };
}
