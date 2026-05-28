import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import type { ClientDetail } from "@/features/clients/types";

interface ClientProfileRowProps {
  client: ClientDetail;
}

export function ClientProfileRow({ client }: ClientProfileRowProps) {
  const { t } = useTranslation();

  const fields = [
    { labelKey: "email", value: client.email },
    { labelKey: "phone", value: client.phone ?? "—" },
    { labelKey: "target-country", value: client.targetCountry ?? "—" },
    {
      labelKey: "created-at",
      value: format(new Date(client.createdAt), "MMM d, yyyy"),
    },
  ] as const;

  return (
    <dl className="grid grid-cols-1 gap-4 rounded-md border border-[var(--color-gray-200)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <div key={field.labelKey}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-gray-500)]">
            {t(field.labelKey)}
          </dt>
          <dd className="mt-1 text-[13px] text-[var(--color-gray-900)]">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
