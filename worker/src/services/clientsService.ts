import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";
import type { DealStage } from "./dealsService";
import type { Env, Profile } from "../types";

/** Deal ownership on the Clients module (not conversation assignment). */
type OwnershipStatus = "unowned" | "owned";

type DealOwnerRef = {
  id: string;
  fullName: string;
} | null;

type ProfileRef = {
  id: string;
  full_name: string;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  target_country: string | null;
  created_at: string;
};

type ThreadRow = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  subject: string;
  status: string;
  last_message_at: string;
  assignee: ProfileRef | ProfileRef[] | null;
};

type DealRow = {
  id: string;
  client_id: string;
  owner_id: string | null;
  title: string;
  stage: string;
  value_amount: number | null;
  value_currency: string | null;
  created_at: string;
  owner: ProfileRef | ProfileRef[] | null;
};

type ActivityEvent =
  | {
      id: string;
      type: "stage_change";
      fromStage: DealStage | null;
      toStage: DealStage;
      createdAt: string;
      meta?: {
        dealId: string;
        dealTitle: string | null;
      };
    }
  | {
      id: string;
      type: "note" | "message";
      text: string;
      createdAt: string;
      meta?: Record<string, string | null>;
    };

const ACTIVE_DEAL_STAGES = [
  "new_lead",
  "contacted",
  "consultation_booked",
  "documents_requested",
  "application_started",
  "submitted",
] as const;

function unwrapProfile(
  ref: ProfileRef | ProfileRef[] | null | undefined,
): ProfileRef | null {
  if (!ref) return null;
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

function toDealOwner(ref: ProfileRef | null): DealOwnerRef {
  if (!ref) return null;
  return { id: ref.id, fullName: ref.full_name };
}

function isActiveDeal(deal: DealRow): boolean {
  return ACTIVE_DEAL_STAGES.includes(
    deal.stage as (typeof ACTIVE_DEAL_STAGES)[number],
  );
}

/** Aggregate deal stats for list/detail — ownership is per deal, not one owner per client. */
function summarizeClientDeals(
  deals: DealRow[],
  viewerUserId?: string,
): {
  ownershipStatus: OwnershipStatus;
  activeDealsCount: number;
  unownedDealsCount: number;
  uniqueOwnerCount: number;
  ownerNames: string[];
} {
  const ownershipStatus: OwnershipStatus = deals.some(
    (deal) => deal.owner_id !== null,
  )
    ? "owned"
    : "unowned";

  const unownedDealsCount = deals.filter((deal) => deal.owner_id === null).length;
  const activeDeals = deals.filter(isActiveDeal);
  const activeForViewer = viewerUserId
    ? activeDeals.filter((deal) => deal.owner_id === viewerUserId)
    : activeDeals;

  const ownerNamesById = new Map<string, string>();
  for (const deal of activeDeals) {
    if (!deal.owner_id) continue;
    const owner = unwrapProfile(deal.owner);
    if (owner) {
      ownerNamesById.set(owner.id, owner.full_name);
    }
  }

  const ownerNames = [...ownerNamesById.values()].sort((a, b) =>
    a.localeCompare(b),
  );

  return {
    ownershipStatus,
    activeDealsCount: activeForViewer.length,
    unownedDealsCount,
    uniqueOwnerCount: ownerNamesById.size,
    ownerNames,
  };
}

/** Sales Clients page: visible if they own a deal on the client or have an assigned conversation. */
function salesCanAccessClientByDeals(deals: DealRow[], userId: string): boolean {
  return deals.some((deal) => deal.owner_id === userId);
}

function salesHasAssignedConversation(
  threads: ThreadRow[],
  userId: string,
): boolean {
  return threads.some((thread) => thread.assigned_to === userId);
}

function salesCanAccessClient(
  deals: DealRow[],
  threads: ThreadRow[],
  userId: string,
): boolean {
  return (
    salesCanAccessClientByDeals(deals, userId) ||
    salesHasAssignedConversation(threads, userId)
  );
}

function clientHasDealOwnedBy(deals: DealRow[], ownerId: string): boolean {
  return deals.some((deal) => deal.owner_id === ownerId);
}

async function fetchThreadsByClientIds(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  clientIds: string[],
): Promise<Map<string, ThreadRow[]>> {
  const map = new Map<string, ThreadRow[]>();
  if (clientIds.length === 0) return map;

  const { data, error } = await supabase
    .from("conversation_threads")
    .select(
      "id, client_id, assigned_to, subject, status, last_message_at, assignee:profiles!assigned_to(id, full_name)",
    )
    .in("client_id", clientIds);

  if (error) {
    console.error("[clientsService] fetch threads", error);
    throw new AppError("error-server", 500);
  }

  for (const row of (data ?? []) as ThreadRow[]) {
    const existing = map.get(row.client_id) ?? [];
    existing.push(row);
    map.set(row.client_id, existing);
  }

  return map;
}

async function fetchDealsByClientIds(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  clientIds: string[],
): Promise<Map<string, DealRow[]>> {
  const map = new Map<string, DealRow[]>();
  if (clientIds.length === 0) return map;

  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, client_id, owner_id, title, stage, value_amount, value_currency, created_at, owner:profiles!owner_id(id, full_name)",
    )
    .in("client_id", clientIds);

  if (error) {
    console.error("[clientsService] fetch deals", error);
    throw new AppError("error-server", 500);
  }

  for (const row of (data ?? []) as DealRow[]) {
    const existing = map.get(row.client_id) ?? [];
    existing.push(row);
    map.set(row.client_id, existing);
  }

  return map;
}

async function getVisibleClientIdsForSales(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
): Promise<string[]> {
  const [{ data: dealRows, error: dealError }, { data: threadRows, error: threadError }] =
    await Promise.all([
      supabase.from("deals").select("client_id").eq("owner_id", userId),
      supabase
        .from("conversation_threads")
        .select("client_id")
        .eq("assigned_to", userId),
    ]);

  if (dealError) {
    console.error("[clientsService] sales deal visibility", dealError);
    throw new AppError("error-server", 500);
  }

  if (threadError) {
    console.error("[clientsService] sales conversation visibility", threadError);
    throw new AppError("error-server", 500);
  }

  return [
    ...new Set([
      ...(dealRows ?? []).map((row) => row.client_id),
      ...(threadRows ?? []).map((row) => row.client_id),
    ]),
  ];
}

function applySearchFilter<
  T extends { full_name: string; email: string },
>(clients: T[], q?: string): T[] {
  if (!q?.trim()) return clients;

  const needle = q.trim().toLowerCase();
  return clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(needle) ||
      client.email.toLowerCase().includes(needle),
  );
}

function mapListRow(
  client: ClientRow,
  deals: DealRow[],
  viewerUserId?: string,
) {
  const summary = summarizeClientDeals(deals, viewerUserId);

  return {
    id: client.id,
    fullName: client.full_name,
    email: client.email,
    phone: client.phone,
    country: client.country,
    targetCountry: client.target_country,
    createdAt: client.created_at,
    ...summary,
  };
}

async function buildActivityFeed(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  threadIds: string[],
  dealIds: string[],
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];

  if (threadIds.length > 0) {
    const { data: messages, error: messageError } = await supabase
      .from("conversation_messages")
      .select(
        "id, body, created_at, thread_id, thread:conversation_threads!thread_id(subject)",
      )
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (messageError) {
      console.error("[clientsService] activity messages", messageError);
      throw new AppError("error-server", 500);
    }

    for (const message of messages ?? []) {
      const thread = message.thread as
        | { subject: string }
        | { subject: string }[]
        | null;
      const threadSubject = Array.isArray(thread)
        ? (thread[0]?.subject ?? null)
        : (thread?.subject ?? null);

      events.push({
        id: message.id,
        type: "message",
        text: message.body,
        createdAt: message.created_at,
        meta: {
          threadId: message.thread_id,
          threadSubject,
        },
      });
    }
  }

  if (dealIds.length > 0) {
    const [{ data: stageHistory, error: stageError }, { data: notes, error: notesError }] =
      await Promise.all([
        supabase
          .from("deal_stage_history")
          .select(
            "id, from_stage, to_stage, created_at, deal_id, deal:deals!deal_id(title)",
          )
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("deal_notes")
          .select("id, body, created_at, deal_id, deal:deals!deal_id(title)")
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (stageError) {
      console.error("[clientsService] activity stage history", stageError);
      throw new AppError("error-server", 500);
    }

    if (notesError) {
      console.error("[clientsService] activity notes", notesError);
      throw new AppError("error-server", 500);
    }

    for (const entry of stageHistory ?? []) {
      const deal = entry.deal as { title: string } | { title: string }[] | null;
      const dealTitle = Array.isArray(deal)
        ? (deal[0]?.title ?? null)
        : (deal?.title ?? null);

      events.push({
        id: entry.id,
        type: "stage_change",
        fromStage: entry.from_stage as DealStage | null,
        toStage: entry.to_stage as DealStage,
        createdAt: entry.created_at,
        meta: {
          dealId: entry.deal_id,
          dealTitle,
        },
      });
    }

    for (const note of notes ?? []) {
      const deal = note.deal as { title: string } | { title: string }[] | null;
      const dealTitle = Array.isArray(deal)
        ? (deal[0]?.title ?? null)
        : (deal?.title ?? null);

      events.push({
        id: note.id,
        type: "note",
        text: note.body,
        createdAt: note.created_at,
        meta: {
          dealId: note.deal_id,
          dealTitle,
        },
      });
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 20);
}

export const clientsService = {
  async list({
    env,
    profile,
    q,
    assigneeId,
  }: {
    env: Env;
    profile: Profile;
    q?: string;
    assigneeId?: string;
  }) {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    if (profile.role === "client") {
      throw new AppError("error-forbidden", 403);
    }

    let clientQuery = supabase
      .from("clients")
      .select(
        "id, full_name, email, phone, country, target_country, created_at",
      )
      .order("created_at", { ascending: false });

    if (profile.role === "sales") {
      const visibleIds = await getVisibleClientIdsForSales(
        supabase,
        profile.id,
      );
      if (visibleIds.length === 0) {
        return [];
      }
      clientQuery = clientQuery.in("id", visibleIds);
    }

    const { data: clients, error: clientError } = await clientQuery;

    if (clientError) {
      console.error("[clientsService] list clients", clientError);
      throw new AppError("error-server", 500);
    }

    const filteredClients = applySearchFilter(
      (clients ?? []) as ClientRow[],
      q,
    );

    if (filteredClients.length === 0) {
      return [];
    }

    const clientIds = filteredClients.map((client) => client.id);
    const [dealsByClient, threadsByClient] = await Promise.all([
      fetchDealsByClientIds(supabase, clientIds),
      fetchThreadsByClientIds(supabase, clientIds),
    ]);

    const viewerUserId = profile.role === "sales" ? profile.id : undefined;

    let rows = filteredClients.map((client) =>
      mapListRow(client, dealsByClient.get(client.id) ?? [], viewerUserId),
    );

    if (profile.role === "sales") {
      rows = rows.filter((row) => {
        const deals = dealsByClient.get(row.id) ?? [];
        const threads = threadsByClient.get(row.id) ?? [];
        return salesCanAccessClient(deals, threads, profile.id);
      });
    }

    if (profile.role === "manager" && assigneeId) {
      rows = rows.filter((row) =>
        clientHasDealOwnedBy(dealsByClient.get(row.id) ?? [], assigneeId),
      );
    }

    return rows;
  },

  async getById({
    env,
    profile,
    clientId,
  }: {
    env: Env;
    profile: Profile;
    clientId: string;
  }) {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    if (profile.role === "client") {
      throw new AppError("error-forbidden", 403);
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select(
        "id, full_name, email, phone, country, target_country, created_at",
      )
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      console.error("[clientsService] get client", clientError);
      throw new AppError("error-server", 500);
    }

    if (!client) {
      throw new AppError("error-not-found", 404);
    }

    const [threadsByClient, dealsByClient] = await Promise.all([
      fetchThreadsByClientIds(supabase, [clientId]),
      fetchDealsByClientIds(supabase, [clientId]),
    ]);

    const threads = threadsByClient.get(clientId) ?? [];
    const deals = dealsByClient.get(clientId) ?? [];

    if (
      profile.role === "sales" &&
      !salesCanAccessClient(deals, threads, profile.id)
    ) {
      throw new AppError("error-not-found", 404);
    }

    const viewerUserId = profile.role === "sales" ? profile.id : undefined;
    const summary = summarizeClientDeals(deals, viewerUserId);

    const threadIds = threads.map((thread) => thread.id);
    const dealIds = deals.map((deal) => deal.id);
    const activity = await buildActivityFeed(supabase, threadIds, dealIds);

    return {
      id: client.id,
      fullName: client.full_name,
      email: client.email,
      phone: client.phone,
      country: client.country,
      targetCountry: client.target_country,
      createdAt: client.created_at,
      ...summary,
      conversations: [...threads]
        .sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime(),
        )
        .map((thread) => ({
          id: thread.id,
          subject: thread.subject,
          status: thread.status,
          assignedTo: toDealOwner(unwrapProfile(thread.assignee)),
          lastMessageAt: thread.last_message_at,
        })),
      deals: [...deals]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .map((deal) => ({
          id: deal.id,
          title: deal.title,
          stage: deal.stage,
          owner: toDealOwner(unwrapProfile(deal.owner)),
          valueAmount: deal.value_amount,
          valueCurrency: deal.value_currency,
        })),
      activity,
    };
  },

  /**
   * Assign unowned deals on a client to the caller (sales).
   * Conversation assignment uses PATCH /api/conversations/:id/assign (Sprint 3).
   */
  async claimDeals({
    env,
    profile,
    clientId,
  }: {
    env: Env;
    profile: Profile;
    clientId: string;
  }) {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      console.error("[clientsService] claimDeals client lookup", clientError);
      throw new AppError("error-server", 500);
    }

    if (!client) {
      throw new AppError("error-not-found", 404);
    }

    const dealsByClient = await fetchDealsByClientIds(supabase, [clientId]);
    const deals = dealsByClient.get(clientId) ?? [];

    const unownedDealIds = deals
      .filter((deal) => deal.owner_id === null)
      .map((deal) => deal.id);

    if (unownedDealIds.length === 0) {
      throw new AppError("error-forbidden", 403);
    }

    const now = new Date().toISOString();
    const { error: dealUpdateError } = await supabase
      .from("deals")
      .update({
        owner_id: profile.id,
        updated_at: now,
      })
      .in("id", unownedDealIds);

    if (dealUpdateError) {
      console.error("[clientsService] claimDeals", dealUpdateError);
      throw new AppError("error-server", 500);
    }

    const updatedDeals =
      (await fetchDealsByClientIds(supabase, [clientId])).get(clientId) ?? [];
    const summary = summarizeClientDeals(updatedDeals, profile.id);

    return {
      clientId,
      ...summary,
    };
  },
};
