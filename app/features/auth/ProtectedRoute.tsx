import { useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoadingState } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    if (hasRedirected.current) return;
    hasRedirected.current = true;

    navigate("/login", {
      replace: true,
      state: { from: location },
    });
  }, [isAuthenticated, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <LoadingState
        variant="panel"
        lines={4}
        className="min-h-[50vh] flex items-center justify-center"
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
