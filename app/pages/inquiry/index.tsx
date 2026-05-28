import { useTranslation } from "react-i18next";
import { InquiryForm } from "./components/InquiryForm";

export function InquiryPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md rounded-md border border-[var(--color-gray-200)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("inquiry-title")}
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-gray-500)]">{t("inquiry-subtitle")}</p>
        <InquiryForm />
      </div>
    </div>
  );
}

export default InquiryPage;
