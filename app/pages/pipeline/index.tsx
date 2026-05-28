import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AppSelect,
  Button,
  DealCard,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";
import { useDeals, useUpdateDealStage } from "@/features/deals/api";
import { usePipelineRealtime } from "@/features/deals/usePipelineRealtime";
import { LostReasonDialog } from "@/features/deals/LostReasonDialog";
import { NewDealDialog } from "@/features/deals/NewDealDialog";
import type { DealListItem } from "@/features/deals/types";
import { useTeamMembers } from "@/features/team/api";
import { PIPELINE_STAGES, type DealStage } from "@/lib/constants";
import { PipelineStageColumn } from "./components/PipelineStageColumn";

type PendingLostMove = {
  dealId: string;
  stage: DealStage;
};

export function PipelinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, profile } = useAuth();

  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<DealListItem | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingLostMove | null>(null);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);

  const listFilters = useMemo(() => {
    if (ownerFilter === "mine") {
      return { mine: true };
    }
    if (ownerFilter === "unassigned") {
      return { unassigned: true };
    }
    if (ownerFilter !== "all" && role === "manager") {
      return { ownerId: ownerFilter };
    }
    return {};
  }, [ownerFilter, role]);

  usePipelineRealtime();

  const { data, isLoading, isError, refetch } = useDeals(listFilters);
  const { data: team } = useTeamMembers({ enabled: role === "manager" });
  const updateStage = useUpdateDealStage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const filteredDeals = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter(
      (deal) =>
        deal.title.toLowerCase().includes(needle) ||
        deal.clientName.toLowerCase().includes(needle),
    );
  }, [data, search]);

  const dealsByStage = useMemo(() => {
    const map = Object.fromEntries(
      PIPELINE_STAGES.map((stage) => [stage, [] as DealListItem[]]),
    ) as Record<DealStage, DealListItem[]>;

    for (const deal of filteredDeals) {
      map[deal.stage]?.push(deal);
    }

    return map;
  }, [filteredDeals]);

  const ownerOptions = useMemo(() => {
    const base = [
      { value: "all", label: t("all") },
      { value: "mine", label: t("mine") },
      { value: "unassigned", label: t("unassigned") },
    ];
    const teamOptions = (team ?? []).map((member) => ({
      value: member.id,
      label: member.fullName,
    }));
    return [...base, ...teamOptions];
  }, [team, t]);

  function handleDragStart(event: DragStartEvent) {
    const deal = filteredDeals.find((item) => item.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStage = String(over.id) as DealStage;
    const deal = filteredDeals.find((item) => item.id === dealId);
    if (!deal || deal.stage === newStage) return;

    const canMutate =
      role === "manager" ||
      (role === "sales" && deal.owner?.id === profile?.id);
    if (!canMutate) return;

    if (newStage === "lost") {
      setPendingLost({ dealId, stage: newStage });
      setLostDialogOpen(true);
      return;
    }

    void performStageUpdate(dealId, newStage);
  }

  async function performStageUpdate(
    dealId: string,
    stage: DealStage,
    lostReason?: string,
  ) {
    try {
      await updateStage.mutateAsync({ dealId, stage, lostReason });
      toast.success(t("stage-updated"));
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleLostConfirm(reason: string) {
    if (!pendingLost) return;
    try {
      await updateStage.mutateAsync({
        dealId: pendingLost.dealId,
        stage: pendingLost.stage,
        lostReason: reason,
      });
      toast.success(t("stage-updated"));
      setLostDialogOpen(false);
      setPendingLost(null);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  function handleLostOpenChange(open: boolean) {
    setLostDialogOpen(open);
    if (!open) setPendingLost(null);
  }

  const canCreateDeal = role === "sales" || role === "manager";

  return (
    <>
      <PageHeader
        titleKey="nav-pipeline"
        subtitleKey="pipeline-subtitle"
        actions={
          canCreateDeal ? (
            <Button onClick={() => setNewDealOpen(true)}>{t("new-deal")}</Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="w-full md:max-w-xs">
          <Input
            id="pipeline-search"
            name="search"
            placeholder={t("search-deals-placeholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="w-full md:max-w-xs">
          <AppSelect
            id="pipeline-owner-filter"
            labelKey="filter-by-owner"
            value={ownerFilter}
            onValueChange={setOwnerFilter}
            options={ownerOptions}
            size="sm"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState variant="pipeline" className="min-h-[320px] pb-4" />
      ) : isError ? (
        <ErrorState
          messageKey="error-generic"
          onRetry={() => void refetch()}
          className="min-h-[320px]"
        />
      ) : !filteredDeals.length ? (
        <EmptyState messageKey="no-pipeline-deals" className="min-h-[320px]" />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-max gap-3">
              {PIPELINE_STAGES.map((stage) => (
                <PipelineStageColumn
                  key={stage}
                  stage={stage}
                  deals={dealsByStage[stage]}
                  isTerminal={stage === "won" || stage === "lost"}
                  onDealClick={(dealId) => navigate(`/deals/${dealId}`)}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeDeal ? (
              <DealCard
                id={activeDeal.id}
                clientName={activeDeal.clientName}
                title={activeDeal.title}
                stage={activeDeal.stage}
                owner={activeDeal.owner}
                valueAmount={activeDeal.valueAmount ?? undefined}
                valueCurrency={activeDeal.valueCurrency ?? undefined}
                lostReason={activeDeal.lostReason}
                className="rotate-1 shadow-lg"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <NewDealDialog
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        onSuccess={() => toast.success(t("deal-created"))}
      />

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={handleLostOpenChange}
        onConfirm={handleLostConfirm}
        isPending={updateStage.isPending}
      />
    </>
  );
}

export default PipelinePage;
