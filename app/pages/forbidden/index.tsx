import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, Icon } from "@/components/ui";
import { WarningOutlined } from "@/lib/icons";
import { useAuth } from "@/features/auth/useAuth";

export function ForbiddenPage() {
  const { t } = useTranslation();
  const { role } = useAuth();

  const homeHref =
    role === "sales" || role === "manager" ? "/dashboard" : "/conversations";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[var(--color-error-light)]">
        <Icon
          icon={WarningOutlined}
          size={32}
          className="text-[var(--color-error)]"
        />
      </div>
      <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
        {t("forbidden-title")}
      </h1>
      <p className="mt-2 max-w-md text-[13px] text-[var(--color-gray-600)]">
        {t("error-forbidden")}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="primary" className="w-full sm:w-auto">
          <Link to={homeHref}>
            {role === "sales" || role === "manager"
              ? t("nav-dashboard")
              : t("nav-conversations")}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <Link to="/conversations">{t("nav-conversations")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default ForbiddenPage;
