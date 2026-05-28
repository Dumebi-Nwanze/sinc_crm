import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui";

export function InquirySentPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md rounded-md border border-[var(--color-gray-200)] bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("inquiry-sent-title")}
        </h1>
        <p className="mt-3 text-[13px] text-[var(--color-gray-600)]">{t("inquiry-sent-body")}</p>

        <div className="mt-6">
          <Button asChild variant="secondary" className="w-full">
            <Link to="/login">{t("inquiry-sign-in")}</Link>
          </Button>
        </div>

        <p className="mt-4 text-[12px] text-[var(--color-gray-500)]">
          {t("inquiry-already-have-account")}{" "}
          <Link to="/login" className="font-medium text-[var(--color-primary-800)] underline">
            {t("inquiry-sign-in")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default InquirySentPage;
