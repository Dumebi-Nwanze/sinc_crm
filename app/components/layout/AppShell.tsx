import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  breadcrumb?: ReactNode;
  topbarActions?: ReactNode;
  onSearchClick?: () => void;
  className?: string;
}

export function AppShell({
  children,
  breadcrumb,
  topbarActions,
  onSearchClick,
  className,
}: AppShellProps) {
  const { profile, role, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar
        role={role ?? undefined}
        userName={profile?.fullName ?? profile?.email ?? ""}
        onLogout={handleLogout}
      />
      <div className="flex min-h-screen flex-col ml-[var(--sidebar-collapsed)] lg:ml-[var(--sidebar-width)]">
        <Topbar
          breadcrumb={breadcrumb}
          actions={topbarActions}
          onSearchClick={onSearchClick}
        />
        <main
          className={cn(
            "mx-auto w-full max-w-[var(--content-max-width)] flex-1 overflow-y-auto p-4 md:p-8",
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
