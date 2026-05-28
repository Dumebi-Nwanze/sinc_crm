import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { sendEmail } from "../lib/email";
import { clientInviteEmail, clientNudgeEmail } from "../lib/emailTemplates";
import { AppError } from "../lib/errors";
import type { Env, Profile } from "../types";

type ConversationStatus = "open" | "pending" | "closed";

type ProfileRef = {
  id: string;
  full_name: string;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  profile_id: string | null;
  invite_sent_at: string | null;
  invite_link_token: string | null;
};

type ThreadRow = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  subject: string;
  status: ConversationStatus;
  last_message_at: string;
  assignee: ProfileRef | ProfileRef[] | null;
  client: ClientRow | ClientRow[] | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: "client" | "team";
  body: string;
  created_at: string;
  sender: ProfileRef | ProfileRef[] | null;
};

export type ThreadListItem = {
  id: string;
  subject: string;
  status: ConversationStatus;
  lastMessageAt: string;
  assignedTo: string | null;
  assigneeName: string | null;
  clientName: string;
  lastMessageSnippet: string | null;
  clientProfileId: string | null;
};

export type ThreadSummary = Omit<ThreadListItem, "lastMessageSnippet"> & {
  lastMessageSnippet?: string | null;
};

export type MessageItem = {
  id: string;
  threadId: string;
  senderId: string;
  senderType: "client" | "team";
  body: string;
  createdAt: string;
  senderName: string;
};

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

function snippet(body: string, max = 120): string {
  const trimmed = body.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

function mapThreadListItem(
  thread: ThreadRow,
  client: ClientRow,
  lastMessageSnippet: string | null,
): ThreadListItem {
  const assignee = unwrapProfile(thread.assignee);
  return {
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    lastMessageAt: thread.last_message_at,
    assignedTo: thread.assigned_to,
    assigneeName: assignee?.full_name ?? null,
    clientName: client.full_name,
    lastMessageSnippet,
    clientProfileId: client.profile_id,
  };
}

function mapThreadSummary(
  thread: ThreadRow,
  client: ClientRow,
): ThreadSummary {
  const assignee = unwrapProfile(thread.assignee);
  return {
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    lastMessageAt: thread.last_message_at,
    assignedTo: thread.assigned_to,
    assigneeName: assignee?.full_name ?? null,
    clientName: client.full_name,
    clientProfileId: client.profile_id,
  };
}

function mapMessage(row: MessageRow): MessageItem {
  const sender = unwrapProfile(row.sender);
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderType: row.sender_type,
    body: row.body,
    createdAt: row.created_at,
    senderName: sender?.full_name ?? "",
  };
}

const THREAD_SELECT = `
  id, client_id, assigned_to, subject, status, last_message_at,
  assignee:profiles!assigned_to(id, full_name),
  client:clients!client_id(id, full_name, email, profile_id, invite_sent_at)
`;

const CLIENT_INVITE_SELECT =
  "id, full_name, email, profile_id, invite_sent_at, invite_link_token";

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
    console.error("[conversationsService] client lookup by profile", error);
    throw new AppError("error-server", 500);
  }

  return data?.id ?? null;
}

async function salesCanReadClient(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  clientId: string,
  userId: string,
): Promise<boolean> {
  const [{ data: threads, error: threadError }, { data: deals, error: dealError }] =
    await Promise.all([
      supabase
        .from("conversation_threads")
        .select("id")
        .eq("client_id", clientId)
        .or(`assigned_to.eq.${userId},assigned_to.is.null`)
        .limit(1),
      supabase
        .from("deals")
        .select("id")
        .eq("client_id", clientId)
        .eq("owner_id", userId)
        .limit(1),
    ]);

  if (threadError || dealError) {
    console.error("[conversationsService] salesCanReadClient", threadError ?? dealError);
    throw new AppError("error-server", 500);
  }

  return (threads?.length ?? 0) > 0 || (deals?.length ?? 0) > 0;
}

function canAccessThread(
  profile: Profile,
  thread: Pick<ThreadRow, "assigned_to" | "client_id">,
  clientId: string | null,
): boolean {
  if (profile.role === "manager") return true;
  if (profile.role === "sales") {
    return thread.assigned_to === profile.id || thread.assigned_to === null;
  }
  if (profile.role === "client") {
    return clientId !== null && thread.client_id === clientId;
  }
  return false;
}

async function fetchThreadById(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  threadId: string,
): Promise<ThreadRow | null> {
  const { data, error } = await supabase
    .from("conversation_threads")
    .select(THREAD_SELECT)
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    console.error("[conversationsService] fetch thread", error);
    throw new AppError("error-server", 500);
  }

  return (data as ThreadRow | null) ?? null;
}

async function requireThreadAccess(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  profile: Profile,
  threadId: string,
): Promise<{ thread: ThreadRow; client: ClientRow; viewerClientId: string | null }> {
  const viewerClientId =
    profile.role === "client"
      ? await getClientIdForProfile(supabase, profile.id)
      : null;

  const thread = await fetchThreadById(supabase, threadId);

  if (!thread) {
    if (profile.role === "manager") {
      throw new AppError("error-not-found", 404);
    }
    throw new AppError("error-forbidden", 403);
  }

  const client = unwrapClient(thread.client);
  if (!client) {
    throw new AppError("error-server", 500);
  }

  if (!canAccessThread(profile, thread, viewerClientId)) {
    throw new AppError("error-forbidden", 403);
  }

  return { thread, client, viewerClientId };
}

async function fetchLastMessageSnippets(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  threadIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (threadIds.length === 0) return map;

  const { data, error } = await supabase
    .from("conversation_messages")
    .select("thread_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[conversationsService] fetch last messages", error);
    throw new AppError("error-server", 500);
  }

  for (const row of data ?? []) {
    if (!map.has(row.thread_id)) {
      map.set(row.thread_id, snippet(row.body));
    }
  }

  return map;
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
    console.error("[conversationsService] assignee lookup", error);
    throw new AppError("error-server", 500);
  }

  if (!data || data.role !== "sales") {
    throw new AppError("error-validation", 400);
  }
}

async function fetchClientForInvite(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  clientId: string,
): Promise<ClientRow> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_INVITE_SELECT)
    .eq("id", clientId)
    .single();

  if (error || !data) {
    console.error("[conversationsService] fetchClientForInvite", error);
    throw new AppError("error-server", 500);
  }

  return data as ClientRow;
}

async function maybeSendClientInviteOrNudge({
  supabase,
  env,
  threadId,
  clientId,
  body,
  caller,
  assigneeName,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  env: Env;
  threadId: string;
  clientId: string;
  body: string;
  caller: Profile;
  assigneeName: string | null;
}): Promise<void> {
  const client = await fetchClientForInvite(supabase, clientId);
  if (client.profile_id) return;

  const repName = assigneeName ?? caller.full_name;
  const messageSnippet = snippet(body);
  const redirect = `/conversations/${threadId}`;

  if (!client.invite_sent_at) {
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "invite",
        email: client.email,
        options: {
          redirectTo: `${env.APP_URL}/accept-invite?redirect=${redirect}`,
        },
      });

    if (linkError || !linkData.user?.id) {
      console.error("[conversationsService] generateLink", linkError);
      throw new AppError("error-server", 500);
    }

    const hashedToken = linkData.properties?.hashed_token;
    if (!hashedToken) {
      console.error("[conversationsService] missing hashed_token");
      throw new AppError("error-server", 500);
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        invite_link_token: hashedToken,
        invite_sent_at: now,
        updated_at: now,
      })
      .eq("id", client.id);

    if (updateError) {
      console.error("[conversationsService] store invite token", updateError);
      throw new AppError("error-server", 500);
    }

    const inviteUrl = `${env.APP_URL}/accept-invite?token=${hashedToken}&redirect=${redirect}`;

    await sendEmail({
      to: client.email,
      subject: "You have a new message from SINC",
      html: clientInviteEmail({
        fullName: client.full_name,
        repName,
        messageSnippet,
        inviteUrl,
      }),
      env,
    });

    return;
  }

  const inviteToken = client.invite_link_token;
  if (!inviteToken) {
    console.error("[conversationsService] missing invite_link_token for nudge");
    throw new AppError("error-server", 500);
  }

  const inviteUrl = `${env.APP_URL}/accept-invite?token=${inviteToken}&redirect=${redirect}`;

  await sendEmail({
    to: client.email,
    subject: "Complete your SINC account setup",
    html: clientNudgeEmail({
      fullName: client.full_name,
      repName,
      messageSnippet,
      inviteUrl,
    }),
    env,
  });
}

export const conversationsService = {
  async list({
    env,
    profile,
    status,
    assignedTo,
    mine,
    unassigned,
  }: {
    env: Env;
    profile: Profile;
    status?: ConversationStatus;
    assignedTo?: string;
    mine?: boolean;
    unassigned?: boolean;
  }): Promise<ThreadListItem[]> {
    const supabase = createAdmin(env);

    let query = supabase
      .from("conversation_threads")
      .select(THREAD_SELECT)
      .order("last_message_at", { ascending: false });

    if (profile.role === "client") {
      const clientId = await getClientIdForProfile(supabase, profile.id);
      if (!clientId) {
        return [];
      }
      query = query.eq("client_id", clientId);
    } else if (profile.role === "sales") {
      query = query.or(`assigned_to.eq.${profile.id},assigned_to.is.null`);
      if (mine) {
        query = query.eq("assigned_to", profile.id);
      }
      if (unassigned) {
        query = query.is("assigned_to", null);
      }
    } else if (profile.role === "manager") {
      if (assignedTo) {
        query = query.eq("assigned_to", assignedTo);
      }
      if (mine) {
        query = query.eq("assigned_to", profile.id);
      }
      if (unassigned) {
        query = query.is("assigned_to", null);
      }
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[conversationsService] list", error);
      throw new AppError("error-server", 500);
    }

    const threads = (data ?? []) as ThreadRow[];
    const snippets = await fetchLastMessageSnippets(
      supabase,
      threads.map((thread) => thread.id),
    );

    return threads
      .map((thread) => {
        const client = unwrapClient(thread.client);
        if (!client) return null;
        return mapThreadListItem(
          thread,
          client,
          snippets.get(thread.id) ?? null,
        );
      })
      .filter((row): row is ThreadListItem => row !== null);
  },

  async create({
    env,
    profile,
    subject,
    body,
    clientId,
  }: {
    env: Env;
    profile: Profile;
    subject: string;
    body: string;
    clientId?: string;
  }): Promise<ThreadSummary> {
    const supabase = createAdmin(env);
    let resolvedClientId = clientId;

    if (profile.role === "client") {
      if (clientId) {
        throw new AppError("error-validation", 400);
      }
      const ownClientId = await getClientIdForProfile(supabase, profile.id);
      if (!ownClientId) {
        throw new AppError("error-forbidden", 403);
      }
      resolvedClientId = ownClientId;
    } else {
      if (!clientId) {
        throw new AppError("error-validation", 400);
      }
      if (profile.role === "sales") {
        const allowed = await salesCanReadClient(supabase, clientId, profile.id);
        if (!allowed) {
          throw new AppError("error-forbidden", 403);
        }
      }
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, email, profile_id")
      .eq("id", resolvedClientId!)
      .maybeSingle();

    if (clientError) {
      console.error("[conversationsService] create client lookup", clientError);
      throw new AppError("error-server", 500);
    }

    if (!client) {
      throw new AppError("error-not-found", 404);
    }

    const now = new Date().toISOString();
    const senderType = profile.role === "client" ? "client" : "team";

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .insert({
        client_id: client.id,
        subject: subject.trim(),
        status: "open",
        assigned_to: null,
        last_message_at: now,
        updated_at: now,
      })
      .select(THREAD_SELECT)
      .single();

    if (threadError || !thread) {
      console.error("[conversationsService] create thread", threadError);
      throw new AppError("error-server", 500);
    }

    const { error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: thread.id,
        sender_id: profile.id,
        sender_type: senderType,
        body: body.trim(),
      });

    if (messageError) {
      console.error("[conversationsService] create first message", messageError);
      throw new AppError("error-server", 500);
    }

    const threadRow = thread as ThreadRow;
    const clientRow = unwrapClient(threadRow.client) ?? {
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      profile_id: client.profile_id,
      invite_sent_at: null,
      invite_link_token: null,
    };

    if (senderType === "team" && !clientRow.profile_id) {
      await maybeSendClientInviteOrNudge({
        supabase,
        env,
        threadId: threadRow.id,
        clientId: clientRow.id,
        body,
        caller: profile,
        assigneeName: null,
      });
    }

    return mapThreadSummary(threadRow, clientRow);
  },

  async getById({
    env,
    profile,
    threadId,
  }: {
    env: Env;
    profile: Profile;
    threadId: string;
  }) {
    const supabase = createAdmin(env);
    const { thread, client } = await requireThreadAccess(supabase, profile, threadId);

    const { data: messages, error: messageError } = await supabase
      .from("conversation_messages")
      .select(
        "id, thread_id, sender_id, sender_type, body, created_at, sender:profiles!sender_id(full_name)",
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messageError) {
      console.error("[conversationsService] get messages", messageError);
      throw new AppError("error-server", 500);
    }

    const ascendingMessages = ((messages ?? []) as MessageRow[])
      .slice()
      .reverse()
      .map(mapMessage);

    return {
      ...mapThreadSummary(thread, client),
      client: {
        id: client.id,
        fullName: client.full_name,
        email: client.email,
        profileId: client.profile_id,
      },
      messages: ascendingMessages,
    };
  },

  async assign({
    env,
    profile,
    threadId,
    assigneeId,
  }: {
    env: Env;
    profile: Profile;
    threadId: string;
    assigneeId: string | null;
  }): Promise<ThreadSummary> {
    const supabase = createAdmin(env);
    const { thread, client } = await requireThreadAccess(supabase, profile, threadId);

    if (profile.role === "sales") {
      if (assigneeId === null) {
        throw new AppError("error-forbidden", 403);
      }
      if (assigneeId !== profile.id) {
        throw new AppError("error-forbidden", 403);
      }
      if (thread.assigned_to !== null && thread.assigned_to !== profile.id) {
        throw new AppError("error-forbidden", 403);
      }
    }

    if (profile.role === "manager" && assigneeId !== null) {
      await assertSalesAssignee(supabase, assigneeId);
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        assigned_to: assigneeId,
        updated_at: now,
      })
      .eq("id", threadId)
      .select(THREAD_SELECT)
      .single();

    if (updateError || !updated) {
      console.error("[conversationsService] assign", updateError);
      throw new AppError("error-server", 500);
    }

    const updatedThread = updated as ThreadRow;
    const updatedClient = unwrapClient(updatedThread.client) ?? client;
    return mapThreadSummary(updatedThread, updatedClient);
  },

  async updateStatus({
    env,
    profile,
    threadId,
    status,
  }: {
    env: Env;
    profile: Profile;
    threadId: string;
    status: ConversationStatus;
  }): Promise<ThreadSummary> {
    const supabase = createAdmin(env);
    const { thread, client } = await requireThreadAccess(supabase, profile, threadId);

    if (profile.role === "sales" && thread.assigned_to !== profile.id) {
      throw new AppError("error-forbidden", 403);
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        status,
        updated_at: now,
      })
      .eq("id", threadId)
      .select(THREAD_SELECT)
      .single();

    if (updateError || !updated) {
      console.error("[conversationsService] updateStatus", updateError);
      throw new AppError("error-server", 500);
    }

    const updatedThread = updated as ThreadRow;
    const updatedClient = unwrapClient(updatedThread.client) ?? client;
    return mapThreadSummary(updatedThread, updatedClient);
  },

  async appendMessage({
    env,
    profile,
    threadId,
    body,
  }: {
    env: Env;
    profile: Profile;
    threadId: string;
    body: string;
  }): Promise<MessageItem> {
    const supabase = createAdmin(env);
    const { thread, client } = await requireThreadAccess(supabase, profile, threadId);

    const senderType = profile.role === "client" ? "client" : "team";
    const trimmedBody = body.trim();
    const now = new Date().toISOString();

    const { data: message, error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: threadId,
        sender_id: profile.id,
        sender_type: senderType,
        body: trimmedBody,
      })
      .select(
        "id, thread_id, sender_id, sender_type, body, created_at, sender:profiles!sender_id(full_name)",
      )
      .single();

    if (messageError || !message) {
      console.error("[conversationsService] appendMessage", messageError);
      throw new AppError("error-server", 500);
    }

    const { error: threadUpdateError } = await supabase
      .from("conversation_threads")
      .update({
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", threadId);

    if (threadUpdateError) {
      console.error("[conversationsService] update last_message_at", threadUpdateError);
      throw new AppError("error-server", 500);
    }

    if (senderType === "team" && !client.profile_id) {
      const assignee = unwrapProfile(thread.assignee);
      await maybeSendClientInviteOrNudge({
        supabase,
        env,
        threadId,
        clientId: client.id,
        body: trimmedBody,
        caller: profile,
        assigneeName: assignee?.full_name ?? null,
      });
    }

    return mapMessage(message as MessageRow);
  },
};
