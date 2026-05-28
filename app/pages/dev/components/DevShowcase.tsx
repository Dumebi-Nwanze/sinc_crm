import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  SectionPanel,
  StatCard,
  Textarea,
} from "@/components/ui";
import { Avatar } from "@/components/ui/Avatar";
import { CommentsOutlined, InformationOutlined } from "@/lib/icons";

interface DemoRow {
  id: string;
  name: string;
  email: string;
}

const DEMO_ROWS: DemoRow[] = [
  { id: "1", name: "Ayşe Yılmaz", email: "ayse@example.com" },
  { id: "2", name: "John Smith", email: "john@example.com" },
];

export function DevShowcase() {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("dev-buttons")}</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">{t("save")}</Button>
          <Button variant="secondary">{t("cancel")}</Button>
          <Button variant="ghost">{t("back")}</Button>
          <Button variant="destructive">{t("delete")}</Button>
          <Button loading>{t("loading")}</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("dev-badges")}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="stage" stage="new_lead" />
          <Badge variant="stage" stage="won" />
          <Badge variant="status" status="open" />
          <Badge variant="count" count={5} />
          <Badge labelKey="role-manager" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Input labelKey="name" placeholder={t("name")} />
        <Textarea labelKey="notes" placeholder={t("notes")} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={CommentsOutlined} labelKey="stat-open-chats" value={12} trend={2} />
        <Card>
          <CardHeader>{t("dev-card-title")}</CardHeader>
          <CardBody>{t("dev-card-body")}</CardBody>
        </Card>
        <div className="flex items-center gap-3">
          <Avatar name="Demo User" size="lg" />
          <Avatar name="Sales Rep" size="md" />
          <Avatar name="AB" size="sm" />
        </div>
      </section>

      <SectionPanel titleKey="dev-section-title">
        <div className="p-4 text-[13px] text-[var(--color-gray-600)]">{t("dev-section-body")}</div>
      </SectionPanel>

      <DataTable
        columns={[
          { key: "name", headerKey: "name", cell: (row) => row.name },
          { key: "email", headerKey: "email", cell: (row) => row.email },
        ]}
        data={DEMO_ROWS}
        keyExtractor={(row) => row.id}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <EmptyState icon={InformationOutlined} messageKey="no-results" />
        <LoadingState variant="panel" />
        <ErrorState onRetry={() => undefined} />
      </div>

      <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
        {t("dev-open-confirm")}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titleKey="dev-confirm-title"
        messageKey="dev-confirm-message"
        onConfirm={() => setConfirmOpen(false)}
      />
    </>
  );
}
