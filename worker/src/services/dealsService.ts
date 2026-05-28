import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";
import type { Env, Profile } from "../types";

const DEAL_STAGES = [
  "new_lead",
  "contacted",
  "consultation_booked",
  "documents_requested",
  "application_started",
  "submitted",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

type ProfileRef = {
  id: string;
  full_name: string;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
};

type DealRow = {
  id: string;
  client_id: string;
  owner_id: string | null;
  title: string;
  stage: DealStage;
  value_amount: number | null;
  value_currency: string | null;
  expected_intake: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  owner: ProfileRef | ProfileRef[] | null;
  client: ClientRow | ClientRow[] | null;
};

type StageHistoryRow = {
  id: string;
  deal_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_by: string;
  created_at: string;
  changer: ProfileRef | ProfileRef[] | null;
};

type NoteRow = {
  id: string;
  deal_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: ProfileRef | ProfileRef[] | null;
};

export type DealListItem = {
  id: string;
  title: string;
  stage: DealStage;
  valueAmount: number | null;
  valueCurrency: string | null;
  expectedIntake: string | null;
  lostReason: string | null;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
  clientId: string;
  clientName: string;
};

export type DealNoteItem = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

export type DealStageHistoryItem = {
  id: string;
  fromStage: DealStage | null;
  toStage: DealStage;
  createdAt: string;
  changedById: string;
  changedByName: string;
};

export type DealDetail = DealListItem & {
  lostReason: string | null;
  updatedAt: string;
  client: {
    id: string;
    fullName: string;
    email: string;
  };
  notes: DealNoteItem[];
  stageHistory: DealStageHistoryItem[];
};

const DEAL_SELECT = `
  id, client_id, owner_id, title, stage, value_amount, value_currency,
  expected_intake, lost_reason, created_at, updated_at,
  owner:profiles!owner_id(id, full_name),
  client:clients!client_id(id, full_name, email)
`;

function createAdmin(env: Env) {
  return createSupabaseAdmin(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

function unwrapProfile(
  ref: ProfileRef | ProfileRef[] | null | undefined,
): ProfileRef | null {
  if (!ref) return null;
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

function unwrapClient(
  ref: ClientRow | ClientRow[] | null | undefined,
): ClientRow | null {
  if (!ref) return null;
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

function mapDealListItem(deal: DealRow, client: ClientRow): DealListItem {
  const owner = unwrapProfile(deal.owner);
  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage,
    valueAmount: deal.value_amount,
    valueCurrency: deal.value_currency,
    expectedIntake: deal.expected_intake,
    lostReason: deal.lost_reason,
    createdAt: deal.created_at,
    ownerId: deal.owner_id,
    ownerName: owner?.full_name ?? null,
    clientId: client.id,
    clientName: client.full_name,
  };
}

function mapNote(row: NoteRow): DealNoteItem {
  const author = unwrapProfile(row.author);
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: author?.full_name ?? "",
  };
}

function mapStageHistory(row: StageHistoryRow): DealStageHistoryItem {
  const changer = unwrapProfile(row.changer);
  return {
    id: row.id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    createdAt: row.created_at,
    changedById: row.changed_by,
    changedByName: changer?.full_name ?? "",
  };
}

function salesCanReadDeal(deal: Pick<DealRow, "owner_id">, userId: string): boolean {
  return deal.owner_id === userId || deal.owner_id === null;
}

function canMutateDeal(
  profile: Profile,
  deal: Pick<DealRow, "owner_id">,
): boolean {
  if (profile.role === "manager") return true;
  if (profile.role === "sales") return deal.owner_id === profile.id;
  return false;
}

async function assertSalesAssignee(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  assigneeId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", assigneeId)
    .maybeSingle();

  if (error) {
    console.error("[dealsService] assignee lookup", error);
    throw new AppError("error-server", 500);
  }

  if (!data || data.role !== "sales") {
    throw new AppError("error-validation", 400);
  }
}

async function assertClientCanCreateDeal(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  profile: Profile,
  clientId: string,
): Promise<void> {
  const [{ data: deals, error: dealError }, { data: threads, error: threadError }] =
    await Promise.all([
      supabase.from("deals").select("id, owner_id").eq("client_id", clientId),
      supabase
        .from("conversation_threads")
        .select("id, assigned_to")
        .eq("client_id", clientId),
    ]);

  if (dealError) {
    console.error("[dealsService] client deal lookup", dealError);
    throw new AppError("error-server", 500);
  }

  if (threadError) {
    console.error("[dealsService] client thread lookup", threadError);
    throw new AppError("error-server", 500);
  }

  const rows = deals ?? [];
  const threadRows = threads ?? [];

  if (profile.role === "sales") {
    const hasOwnedDeal = rows.some((deal) => deal.owner_id === profile.id);
    if (hasOwnedDeal) return;

    const hasAssignedConversation = threadRows.some(
      (thread) => thread.assigned_to === profile.id,
    );
    if (hasAssignedConversation) return;

    throw new AppError("error-client-unassigned", 403);
  }

  if (profile.role === "manager") {
    const hasAnyOwner = rows.some((deal) => deal.owner_id !== null);
    if (!hasAnyOwner) {
      throw new AppError("error-client-unassigned", 403);
    }
  }
}

async function fetchDealById(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  dealId: string,
): Promise<DealRow | null> {
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", dealId)
    .maybeSingle();

  if (error) {
    console.error("[dealsService] fetch deal", error);
    throw new AppError("error-server", 500);
  }

  return (data as DealRow | null) ?? null;
}

async function requireDealAccess(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  profile: Profile,
  dealId: string,
): Promise<{ deal: DealRow; client: ClientRow }> {
  if (profile.role === "client") {
    throw new AppError("error-forbidden", 403);
  }

  const deal = await fetchDealById(supabase, dealId);

  if (!deal) {
    if (profile.role === "manager") {
      throw new AppError("error-not-found", 404);
    }
    throw new AppError("error-forbidden", 403);
  }

  const client = unwrapClient(deal.client);
  if (!client) {
    throw new AppError("error-server", 500);
  }

  if (profile.role === "sales" && !salesCanReadDeal(deal, profile.id)) {
    throw new AppError("error-forbidden", 403);
  }

  return { deal, client };
}

function ownerActivityNoteBody(ownerName: string, selfClaim: boolean): string {
  if (selfClaim) {
    return `[system:owner-assigned] ${ownerName} claimed this deal`;
  }
  return `[system:owner-assigned] Assigned to ${ownerName}`;
}

export const dealsService = {
  async list({
    env,
    profile,
    stage,
    ownerId,
    clientId,
    q,
    mine,
    unassigned,
  }: {
    env: Env;
    profile: Profile;
    stage?: DealStage;
    ownerId?: string;
    clientId?: string;
    q?: string;
    mine?: boolean;
    unassigned?: boolean;
  }): Promise<DealListItem[]> {
    if (profile.role === "client") {
      throw new AppError("error-forbidden", 403);
    }

    const supabase = createAdmin(env);

    let query = supabase
      .from("deals")
      .select(DEAL_SELECT)
      .order("created_at", { ascending: false });

    if (profile.role === "sales") {
      if (mine) {
        query = query.eq("owner_id", profile.id);
      } else if (unassigned) {
        query = query.is("owner_id", null);
      } else {
        query = query.or(`owner_id.eq.${profile.id},owner_id.is.null`);
      }
    } else {
      if (mine && profile.role === "manager") {
        query = query.eq("owner_id", profile.id);
      }
      if (unassigned) {
        query = query.is("owner_id", null);
      }
    }

    if (stage) {
      query = query.eq("stage", stage);
    }

    if (ownerId) {
      query = query.eq("owner_id", ownerId);
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (q?.trim()) {
      query = query.ilike("title", `%${q.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[dealsService] list", error);
      throw new AppError("error-server", 500);
    }

    return (data ?? [])
      .map((row) => {
        const deal = row as DealRow;
        const client = unwrapClient(deal.client);
        if (!client) return null;
        return mapDealListItem(deal, client);
      })
      .filter((row): row is DealListItem => row !== null);
  },

  async create({
    env,
    profile,
    title,
    clientId,
    ownerId,
    valueAmount,
    valueCurrency,
    expectedIntake,
  }: {
    env: Env;
    profile: Profile;
    title: string;
    clientId: string;
    ownerId?: string;
    valueAmount?: number;
    valueCurrency?: string;
    expectedIntake?: string;
  }): Promise<DealListItem> {
    const supabase = createAdmin(env);

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      console.error("[dealsService] create client lookup", clientError);
      throw new AppError("error-server", 500);
    }

    if (!client) {
      throw new AppError("error-not-found", 404);
    }

    await assertClientCanCreateDeal(supabase, profile, clientId);

    let resolvedOwnerId: string | null = null;

    if (profile.role === "sales") {
      if (ownerId && ownerId !== profile.id) {
        throw new AppError("error-forbidden", 403);
      }
      resolvedOwnerId = profile.id;
    } else if (profile.role === "manager") {
      if (ownerId) {
        await assertSalesAssignee(supabase, ownerId);
        resolvedOwnerId = ownerId;
      }
    }

    const now = new Date().toISOString();

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        client_id: clientId,
        owner_id: resolvedOwnerId,
        title: title.trim(),
        stage: "new_lead",
        value_amount: valueAmount ?? null,
        value_currency: valueCurrency ?? "USD",
        expected_intake: expectedIntake?.trim() ?? null,
        updated_at: now,
      })
      .select(DEAL_SELECT)
      .single();

    if (dealError || !deal) {
      console.error("[dealsService] create deal", dealError);
      throw new AppError("error-server", 500);
    }

    const { error: historyError } = await supabase
      .from("deal_stage_history")
      .insert({
        deal_id: deal.id,
        from_stage: null,
        to_stage: "new_lead",
        changed_by: profile.id,
      });

    if (historyError) {
      console.error("[dealsService] create stage history", historyError);
      throw new AppError("error-server", 500);
    }

    const dealRow = deal as DealRow;
    return mapDealListItem(dealRow, client as ClientRow);
  },

  async getById({
    env,
    profile,
    dealId,
  }: {
    env: Env;
    profile: Profile;
    dealId: string;
  }): Promise<DealDetail> {
    const supabase = createAdmin(env);
    const { deal, client } = await requireDealAccess(supabase, profile, dealId);

    const [{ data: notes, error: notesError }, { data: stageHistory, error: historyError }] =
      await Promise.all([
        supabase
          .from("deal_notes")
          .select(
            "id, deal_id, author_id, body, created_at, author:profiles!author_id(id, full_name)",
          )
          .eq("deal_id", dealId)
          .order("created_at", { ascending: true }),
        supabase
          .from("deal_stage_history")
          .select(
            "id, deal_id, from_stage, to_stage, changed_by, created_at, changer:profiles!changed_by(id, full_name)",
          )
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false }),
      ]);

    if (notesError) {
      console.error("[dealsService] get notes", notesError);
      throw new AppError("error-server", 500);
    }

    if (historyError) {
      console.error("[dealsService] get stage history", historyError);
      throw new AppError("error-server", 500);
    }

    const listItem = mapDealListItem(deal, client);

    return {
      ...listItem,
      lostReason: deal.lost_reason,
      updatedAt: deal.updated_at,
      client: {
        id: client.id,
        fullName: client.full_name,
        email: client.email,
      },
      notes: ((notes ?? []) as NoteRow[]).map(mapNote),
      stageHistory: ((stageHistory ?? []) as StageHistoryRow[]).map(mapStageHistory),
    };
  },

  async updateStage({
    env,
    profile,
    dealId,
    stage,
    lostReason,
  }: {
    env: Env;
    profile: Profile;
    dealId: string;
    stage: DealStage;
    lostReason?: string;
  }): Promise<DealListItem> {
    const supabase = createAdmin(env);
    const { deal, client } = await requireDealAccess(supabase, profile, dealId);

    if (!canMutateDeal(profile, deal)) {
      throw new AppError("error-forbidden", 403);
    }

    if (stage === "lost" && !lostReason?.trim()) {
      throw new AppError("error-validation", 400);
    }

    const fromStage = deal.stage;
    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("deals")
      .update({
        stage,
        lost_reason: stage === "lost" ? lostReason!.trim() : null,
        updated_at: now,
      })
      .eq("id", dealId)
      .select(DEAL_SELECT)
      .single();

    if (updateError || !updated) {
      console.error("[dealsService] updateStage", updateError);
      throw new AppError("error-server", 500);
    }

    const { error: historyError } = await supabase
      .from("deal_stage_history")
      .insert({
        deal_id: dealId,
        from_stage: fromStage,
        to_stage: stage,
        changed_by: profile.id,
      });

    if (historyError) {
      console.error("[dealsService] updateStage history", historyError);
      throw new AppError("error-server", 500);
    }

    const updatedDeal = updated as DealRow;
    const updatedClient = unwrapClient(updatedDeal.client) ?? client;
    return mapDealListItem(updatedDeal, updatedClient);
  },

  async updateOwner({
    env,
    profile,
    dealId,
    ownerId,
  }: {
    env: Env;
    profile: Profile;
    dealId: string;
    ownerId: string;
  }): Promise<DealListItem> {
    const supabase = createAdmin(env);
    const { deal, client } = await requireDealAccess(supabase, profile, dealId);

    if (profile.role === "sales") {
      if (ownerId !== profile.id) {
        throw new AppError("error-forbidden", 403);
      }
      if (deal.owner_id !== null) {
        throw new AppError("error-forbidden", 403);
      }
    }

    if (profile.role === "manager") {
      await assertSalesAssignee(supabase, ownerId);
    }

    const { data: newOwner, error: ownerError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", ownerId)
      .maybeSingle();

    if (ownerError || !newOwner) {
      console.error("[dealsService] updateOwner owner lookup", ownerError);
      throw new AppError("error-server", 500);
    }

    const now = new Date().toISOString();
    const selfClaim = profile.role === "sales" && ownerId === profile.id;

    const { data: updated, error: updateError } = await supabase
      .from("deals")
      .update({
        owner_id: ownerId,
        updated_at: now,
      })
      .eq("id", dealId)
      .select(DEAL_SELECT)
      .single();

    if (updateError || !updated) {
      console.error("[dealsService] updateOwner", updateError);
      throw new AppError("error-server", 500);
    }

    const { error: noteError } = await supabase.from("deal_notes").insert({
      deal_id: dealId,
      author_id: profile.id,
      body: ownerActivityNoteBody(newOwner.full_name, selfClaim),
    });

    if (noteError) {
      console.error("[dealsService] updateOwner activity note", noteError);
      throw new AppError("error-server", 500);
    }

    const updatedDeal = updated as DealRow;
    const updatedClient = unwrapClient(updatedDeal.client) ?? client;
    return mapDealListItem(updatedDeal, updatedClient);
  },

  async addNote({
    env,
    profile,
    dealId,
    body,
  }: {
    env: Env;
    profile: Profile;
    dealId: string;
    body: string;
  }): Promise<DealNoteItem> {
    const supabase = createAdmin(env);
    const { deal } = await requireDealAccess(supabase, profile, dealId);

    if (profile.role === "sales" && deal.owner_id !== profile.id) {
      throw new AppError("error-forbidden", 403);
    }

    const trimmedBody = body.trim();

    const { data: note, error: noteError } = await supabase
      .from("deal_notes")
      .insert({
        deal_id: dealId,
        author_id: profile.id,
        body: trimmedBody,
      })
      .select(
        "id, deal_id, author_id, body, created_at, author:profiles!author_id(id, full_name)",
      )
      .single();

    if (noteError || !note) {
      console.error("[dealsService] addNote", noteError);
      throw new AppError("error-server", 500);
    }

    return mapNote(note as NoteRow);
  },
};

export { DEAL_STAGES };
