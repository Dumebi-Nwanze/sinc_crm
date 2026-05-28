import { useTranslation } from "react-i18next";
import { AcceptInviteForm } from "./components/AcceptInviteForm";

export function AcceptInvitePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-sm rounded-md border border-[var(--color-gray-200)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("accept-invite-title")}
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-gray-500)]">
          {t("accept-invite-subtitle")}
        </p>
        <AcceptInviteForm />
      </div>
    </div>
  );
}

export default AcceptInvitePage;
