import { Outlet } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/layout/CommandPalette";
import { useCommandPaletteItems } from "@/components/layout/useCommandPaletteItems";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { useAuth } from "@/features/auth/useAuth";

export function AuthenticatedLayout() {
  const { open, onOpenChange } = useCommandPalette();
  const { role } = useAuth();
  const {
    items,
    searchQuery,
    setSearchQuery,
    isSearching,
    disableFilter,
  } = useCommandPaletteItems(role);

  return (
    <ProtectedRoute>
      <AppShell onSearchClick={() => onOpenChange(true)}>
        <Outlet />
      </AppShell>
      <CommandPalette
        open={open}
        onOpenChange={onOpenChange}
        items={items}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isSearching={isSearching}
        disableFilter={disableFilter}
      />
    </ProtectedRoute>
  );
}

export default AuthenticatedLayout;
