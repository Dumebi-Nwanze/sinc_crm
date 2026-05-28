import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { LoadingState } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { getPostLoginPath } from "@/lib/authRedirects";
import { LoginForm, type LoginFormValues } from "./components/LoginForm";

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading: authLoading, role } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "error-generic");
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
        <LoadingState variant="inline" lines={3} className="w-full max-w-sm" />
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getPostLoginPath(role)} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-sm rounded-md border border-[var(--color-gray-200)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">SINC CRM</h1>
        <p className="mt-2 text-[13px] text-[var(--color-gray-500)]">{t("login-subtitle")}</p>
        <LoginForm onSubmit={onSubmit} submitError={submitError} />
      </div>
    </div>
  );
}

export default LoginPage;
