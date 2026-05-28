import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadingState } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import type { AppRole } from "@/lib/constants";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <LoadingState
        variant="panel"
        lines={3}
        className="min-h-[40vh] flex items-center justify-center"
      />
    );
  }

  // Unauthenticated redirect is handled by ProtectedRoute — avoid nested Navigate loops.
  if (!isAuthenticated) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
