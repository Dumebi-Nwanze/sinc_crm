import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AppSelect,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
} from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { useClients } from "@/features/clients/api";
import { useCreateDeal } from "@/features/deals/api";
import type { CreateDealInput } from "@/features/deals/types";
import { useTeamMembers } from "@/features/team/api";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
  { value: "CAD", label: "CAD" },
];

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  onSuccess?: (dealId: string) => void;
}

export function NewDealDialog({
  open,
  onOpenChange,
  defaultClientId,
  onSuccess,
}: NewDealDialogProps) {
  const { t } = useTranslation();
  const { role, profile } = useAuth();
  const createDeal = useCreateDeal();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [ownerId, setOwnerId] = useState("");
  const [valueAmount, setValueAmount] = useState("");
  const [valueCurrency, setValueCurrency] = useState("USD");
  const [expectedIntake, setExpectedIntake] = useState("");
  const [clientErrorKey, setClientErrorKey] = useState<string | undefined>();

  const {
    data: clients,
    isLoading: clientsLoading,
    isError: clientsError,
    refetch: refetchClients,
  } = useClients();

  const isManager = role === "manager";

  const {
    data: team,
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useTeamMembers({ enabled: isManager });

  const assignedClients = useMemo(() => {
    if (isManager) {
      return (clients ?? []).filter(
        (client) => client.ownershipStatus === "owned",
      );
    }
    // Sales: API returns clients they own deals for or have assigned conversations with.
    return clients ?? [];
  }, [clients, isManager]);

  const clientOptions = assignedClients.map((client) => ({
    value: client.id,
    label: `${client.fullName} (${client.email})`,
  }));

  const ownerOptions = (team ?? []).map((member) => ({
    value: member.id,
    label: `${member.fullName} (${member.email})`,
  }));

  useEffect(() => {
    if (open) {
      setClientId(defaultClientId ?? "");
      setOwnerId(profile?.id ?? "");
      setClientErrorKey(undefined);
    }
  }, [open, defaultClientId, profile?.id]);

  function resetForm() {
    setTitle("");
    setClientId(defaultClientId ?? "");
    setOwnerId(profile?.id ?? "");
    setValueAmount("");
    setValueCurrency("USD");
    setExpectedIntake("");
    setClientErrorKey(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setClientErrorKey(undefined);

    if (!title.trim()) return;
    if (!clientId) {
      setClientErrorKey("client-required");
      return;
    }

    const input: CreateDealInput = {
      title: title.trim(),
      clientId,
      ownerId: isManager ? ownerId || undefined : profile?.id,
      expectedIntake: expectedIntake.trim() || undefined,
      valueCurrency: valueCurrency || undefined,
    };

    const parsedAmount = valueAmount.trim()
      ? Number.parseFloat(valueAmount)
      : undefined;
    if (parsedAmount != null && !Number.isNaN(parsedAmount)) {
      input.valueAmount = parsedAmount;
    }

    try {
      const deal = await createDeal.mutateAsync(input);
      onSuccess?.(deal.id);
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "error-generic";
      if (message === "error-client-unassigned") {
        setClientErrorKey("error-client-unassigned");
      }
      toast.error(t(message));
    }
  }

  const formLoading = clientsLoading || (isManager && teamLoading);
  const formError = clientsError || (isManager && teamError);

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleKey="new-deal"
      descriptionKey="new-deal-description"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={createDeal.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="new-deal-form"
            loading={createDeal.isPending}
            disabled={!title.trim() || !clientId}
          >
            {t("create")}
          </Button>
        </>
      }
    >
      <form id="new-deal-form" onSubmit={handleSubmit} className="space-y-4">
        {formLoading ? (
          <LoadingState variant="inline" lines={5} />
        ) : formError ? (
          <ErrorState
            messageKey="error-generic"
            onRetry={() => {
              void refetchClients();
              if (isManager) void refetchTeam();
            }}
          />
        ) : (
          <>
            <Input
              id="deal-title"
              name="title"
              labelKey="deal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              disabled={createDeal.isPending}
            />

            {assignedClients.length === 0 ? (
              <EmptyState messageKey="no-clients" className="py-4" />
            ) : (
              <AppSelect
                id="deal-client"
                labelKey="client"
                placeholderKey="select-client"
                value={clientId}
                onValueChange={(value) => {
                  setClientId(value);
                  setClientErrorKey(undefined);
                }}
                options={clientOptions}
                disabled={createDeal.isPending || Boolean(defaultClientId)}
              />
            )}
            {clientErrorKey && (
              <p className="text-[12px] text-[var(--color-error)]">
                {t(clientErrorKey)}
              </p>
            )}

            {isManager && ownerOptions.length > 0 && (
              <AppSelect
                id="deal-owner"
                labelKey="deal-owner"
                placeholderKey="select-owner"
                value={ownerId}
                onValueChange={setOwnerId}
                options={ownerOptions}
                disabled={createDeal.isPending}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                id="deal-value"
                name="valueAmount"
                type="number"
                min={0}
                step="any"
                labelKey="value"
                value={valueAmount}
                onChange={(event) => setValueAmount(event.target.value)}
                disabled={createDeal.isPending}
              />
              <AppSelect
                id="deal-currency"
                labelKey="currency"
                value={valueCurrency}
                onValueChange={setValueCurrency}
                options={CURRENCY_OPTIONS}
                disabled={createDeal.isPending}
              />
            </div>

            <Input
              id="deal-intake"
              name="expectedIntake"
              labelKey="expected-intake"
              value={expectedIntake}
              onChange={(event) => setExpectedIntake(event.target.value)}
              disabled={createDeal.isPending}
            />
          </>
        )}
      </form>
    </Modal>
  );
}
