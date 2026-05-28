import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";
import { DEAL_STAGES, type DealStage } from "./dealsService";
import type { Env, Profile } from "../types";

type ConversationStatus = "open" | "pending" | "closed";

type ProfileRef = {
  id: string;
  full_name: string;
};

type ThreadRow = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  status: ConversationStatus;
};

type DealRow = {
  id: string;
  client_id: string;
  owner_id: string | null;
  stage: DealStage;
  owner: ProfileRef | ProfileRef[] | null;
};

type StageHistoryRow = {
  id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  created_at: string;
  changed_by: string;
  changer: ProfileRef | ProfileRef[] | null;
};

type NoteRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: ProfileRef | ProfileRef[] | null;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender: ProfileRef | ProfileRef[] | null;
};

type ActivityActor = { id: string; name: string } | null;

export type DashboardActivity =
  | {
      id: string;
      type: "stage_change";
      fromStage: DealStage | null;
      toStage: DealStage;
      createdAt: string;
      actor: ActivityActor;
    }
  | {
      id: string;
      type: "message" | "note";
      description: string;
      createdAt: string;
      actor: ActivityActor;
    };

export type DashboardStats = {
  conversationsByStatus: {
    open: number;
    pending: number;
    closed: number;
  };
  unassignedCount: number;
  activeDealCount: number;
  wonDealCount: number;
  dealsByStage: { stage: DealStage; count: number }[];
  dealsByOwner: { ownerId: string; ownerName: string; count: number }[];
  recentActivity: DashboardActivity[];
};

const ACTIVE_DEAL_STAGES = new Set<DealStage>(
  DEAL_STAGES.filter((stage) => stage !== "won" && stage !== "lost"),
);

function createAdmin(env: Env) {
  return createSupabaseAdmin(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

function unwrapProfile(
  ref: ProfileRef | ProfileRef[] | null | undefined,
): ProfileRef | null {
  if (!ref) return null;
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

function emptyConversationsByStatus() {
  return { open: 0, pending: 0, closed: 0 };
}

function emptyDealsByStage(): { stage: DealStage; count: number }[] {
  return DEAL_STAGES.map((stage) => ({ stage, count: 0 }));
}

function emptyDashboardStats(): DashboardStats {
  return {
    conversationsByStatus: emptyConversationsByStatus(),
    unassignedCount: 0,
    activeDealCount: 0,
    wonDealCount: 0,
    dealsByStage: emptyDealsByStage(),
    dealsByOwner: [],
    recentActivity: [],
  };
}

async function getClientIdForProfile(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  profileId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    console.error("[dashboardService] client lookup by profile", error);
    throw new AppError("error-server", 500);
  }

  return data?.id ?? null;
}

async function getVisibleClientIdsForSales(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
): Promise<string[]> {
  const { data: dealRows, error: dealError } = await supabase
    .from("deals")
    .select("client_id")
    .eq("owner_id", userId);

  if (dealError) {
    console.error("[dashboardService] sales client visibility", dealError);
    throw new AppError("error-server", 500);
  }

  return [...new Set((dealRows ?? []).map((row) => row.client_id))];
}

async function fetchThreads(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  options: {
    clientIds?: string[];
  },
): Promise<ThreadRow[]> {
  let query = supabase
    .from("conversation_threads")
    .select("id, client_id, assigned_to, status");

  if (options.clientIds !== undefined) {
    if (options.clientIds.length === 0) {
      return [];
    }
    query = query.in("client_id", options.clientIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[dashboardService] fetch threads", error);
    throw new AppError("error-server", 500);
  }

  return (data ?? []) as ThreadRow[];
}

async function fetchDeals(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  options: {
    clientIds?: string[];
    ownerId?: string;
  },
): Promise<DealRow[]> {
  let query = supabase
    .from("deals")
    .select(
      "id, client_id, owner_id, stage, owner:profiles!owner_id(id, full_name)",
    );

  if (options.clientIds !== undefined) {
    if (options.clientIds.length === 0) {
      return [];
    }
    query = query.in("client_id", options.clientIds);
  }

  if (options.ownerId) {
    query = query.eq("owner_id", options.ownerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[dashboardService] fetch deals", error);
    throw new AppError("error-server", 500);
  }

  return (data ?? []) as DealRow[];
}

function countConversationsByStatus(threads: ThreadRow[]) {
  const counts = emptyConversationsByStatus();

  for (const thread of threads) {
    counts[thread.status] += 1;
  }

  return counts;
}

function countUnassignedThreads(threads: ThreadRow[]): number {
  return threads.filter((thread) => thread.assigned_to === null).length;
}

function summarizeDeals(deals: DealRow[]) {
  const stageCounts = new Map<DealStage, number>(
    DEAL_STAGES.map((stage) => [stage, 0]),
  );

  let activeDealCount = 0;
  let wonDealCount = 0;

  for (const deal of deals) {
    stageCounts.set(deal.stage, (stageCounts.get(deal.stage) ?? 0) + 1);

    if (deal.stage === "won") {
      wonDealCount += 1;
    } else if (ACTIVE_DEAL_STAGES.has(deal.stage)) {
      activeDealCount += 1;
    }
  }

  return {
    activeDealCount,
    wonDealCount,
    dealsByStage: DEAL_STAGES.map((stage) => ({
      stage,
      count: stageCounts.get(stage) ?? 0,
    })),
  };
}

function buildDealsByOwner(deals: DealRow[]): DashboardStats["dealsByOwner"] {
  const counts = new Map<string, { ownerName: string; count: number }>();

  for (const deal of deals) {
    if (!deal.owner_id || !ACTIVE_DEAL_STAGES.has(deal.stage)) {
      continue;
    }

    const owner = unwrapProfile(deal.owner);
    const ownerName = owner?.full_name ?? "";
    const existing = counts.get(deal.owner_id);

    if (existing) {
      existing.count += 1;
      if (!existing.ownerName && ownerName) {
        existing.ownerName = ownerName;
      }
    } else {
      counts.set(deal.owner_id, { ownerName, count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([ownerId, { ownerName, count }]) => ({
      ownerId,
      ownerName,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.ownerName.localeCompare(b.ownerName));
}

function mapActor(ref: ProfileRef | null): DashboardActivity["actor"] {
  if (!ref) return null;
  return { id: ref.id, name: ref.full_name };
}

async function buildRecentActivity(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  threadIds: string[],
  dealIds: string[],
  limit = 10,
): Promise<DashboardActivity[]> {
  const events: DashboardActivity[] = [];

  if (threadIds.length > 0) {
    const { data: messages, error: messageError } = await supabase
      .from("conversation_messages")
      .select(
        "id, body, created_at, sender_id, sender:profiles!sender_id(id, full_name)",
      )
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (messageError) {
      console.error("[dashboardService] activity messages", messageError);
      throw new AppError("error-server", 500);
    }

    for (const message of (messages ?? []) as MessageRow[]) {
      events.push({
        id: message.id,
        type: "message",
        description: message.body,
        createdAt: message.created_at,
        actor: mapActor(unwrapProfile(message.sender)),
      });
    }
  }

  if (dealIds.length > 0) {
    const [{ data: stageHistory, error: stageError }, { data: notes, error: notesError }] =
      await Promise.all([
        supabase
          .from("deal_stage_history")
          .select(
            "id, from_stage, to_stage, created_at, changed_by, changer:profiles!changed_by(id, full_name)",
          )
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("deal_notes")
          .select(
            "id, body, created_at, author_id, author:profiles!author_id(id, full_name)",
          )
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (stageError) {
      console.error("[dashboardService] activity stage history", stageError);
      throw new AppError("error-server", 500);
    }

    if (notesError) {
      console.error("[dashboardService] activity notes", notesError);
      throw new AppError("error-server", 500);
    }

    for (const entry of (stageHistory ?? []) as StageHistoryRow[]) {
      events.push({
        id: entry.id,
        type: "stage_change",
        fromStage: entry.from_stage,
        toStage: entry.to_stage,
        createdAt: entry.created_at,
        actor: mapActor(unwrapProfile(entry.changer)),
      });
    }

    for (const note of (notes ?? []) as NoteRow[]) {
      events.push({
        id: note.id,
        type: "note",
        description: note.body,
        createdAt: note.created_at,
        actor: mapActor(unwrapProfile(note.author)),
      });
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}

async function buildDashboardForScope({
  supabase,
  threads,
  deals,
  includeDealsByOwner,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  threads: ThreadRow[];
  deals: DealRow[];
  includeDealsByOwner: boolean;
}): Promise<DashboardStats> {
  const dealSummary = summarizeDeals(deals);
  const threadIds = threads.map((thread) => thread.id);
  const dealIds = deals.map((deal) => deal.id);

  return {
    conversationsByStatus: countConversationsByStatus(threads),
    unassignedCount: countUnassignedThreads(threads),
    activeDealCount: dealSummary.activeDealCount,
    wonDealCount: dealSummary.wonDealCount,
    dealsByStage: dealSummary.dealsByStage,
    dealsByOwner: includeDealsByOwner ? buildDealsByOwner(deals) : [],
    recentActivity: await buildRecentActivity(supabase, threadIds, dealIds),
  };
}

export const dashboardService = {
  async getStats({
    env,
    profile,
  }: {
    env: Env;
    profile: Profile;
  }): Promise<DashboardStats> {
    const supabase = createAdmin(env);

    if (profile.role === "client") {
      const clientId = await getClientIdForProfile(supabase, profile.id);
      if (!clientId) {
        return emptyDashboardStats();
      }

      const [threads, deals] = await Promise.all([
        fetchThreads(supabase, { clientIds: [clientId] }),
        fetchDeals(supabase, { clientIds: [clientId] }),
      ]);

      const stats = await buildDashboardForScope({
        supabase,
        threads,
        deals,
        includeDealsByOwner: false,
      });

      return { ...stats, unassignedCount: 0 };
    }

    if (profile.role === "sales") {
      const visibleClientIds = await getVisibleClientIdsForSales(
        supabase,
        profile.id,
      );

      if (visibleClientIds.length === 0) {
        return emptyDashboardStats();
      }

      const [threads, deals] = await Promise.all([
        fetchThreads(supabase, { clientIds: visibleClientIds }),
        fetchDeals(supabase, { ownerId: profile.id }),
      ]);

      return buildDashboardForScope({
        supabase,
        threads,
        deals,
        includeDealsByOwner: false,
      });
    }

    const [threads, deals] = await Promise.all([
      fetchThreads(supabase, {}),
      fetchDeals(supabase, {}),
    ]);

    return buildDashboardForScope({
      supabase,
      threads,
      deals,
      includeDealsByOwner: true,
    });
  },
};
