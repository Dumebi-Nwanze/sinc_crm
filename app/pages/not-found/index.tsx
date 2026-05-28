import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, Icon } from "@/components/ui";
import { SearchOutlined } from "@/lib/icons";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4 text-center">
      <p className="text-[48px] font-semibold leading-none text-[var(--color-primary-800)]">
        404
      </p>
      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-md bg-[var(--color-gray-100)]">
        <Icon icon={SearchOutlined} size={24} className="text-[var(--color-gray-500)]" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-[var(--color-gray-900)]">
        {t("error-not-found")}
      </h1>
      <p className="mt-2 max-w-md text-[13px] text-[var(--color-gray-600)]">
        {t("not-found-hint")}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="primary" className="w-full sm:w-auto">
          <Link to="/conversations">{t("nav-conversations")}</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <Link to="/login">{t("login-button")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
