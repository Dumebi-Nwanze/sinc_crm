import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";
import type { Env } from "../types";

export const teamService = {
  async listMembers({ env }: { env: Env }) {
    return teamService.listSalesMembers({ env });
  },

  async listSalesMembers({ env }: { env: Env }) {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "sales")
      .order("full_name", { ascending: true });

    if (profileError) {
      console.error("[teamService] list profiles", profileError);
      throw new AppError("error-server", 500);
    }

    const emailById = new Map<string, string>();
    let page = 1;
    const perPage = 200;

    while (true) {
      const { data: usersData, error: usersError } =
        await supabase.auth.admin.listUsers({ page, perPage });

      if (usersError) {
        console.error("[teamService] list auth users", usersError);
        throw new AppError("error-server", 500);
      }

      for (const user of usersData.users) {
        if (user.email) {
          emailById.set(user.id, user.email);
        }
      }

      if (usersData.users.length < perPage) {
        break;
      }

      page += 1;
    }

    const [{ data: deals, error: dealsError }, { data: threads, error: threadsError }] =
      await Promise.all([
        supabase
          .from("deals")
          .select("owner_id, stage")
          .not("owner_id", "is", null),
        supabase
          .from("conversation_threads")
          .select("assigned_to, status")
          .eq("status", "open")
          .not("assigned_to", "is", null),
      ]);

    if (dealsError) {
      console.error("[teamService] list deals", dealsError);
      throw new AppError("error-server", 500);
    }

    if (threadsError) {
      console.error("[teamService] list threads", threadsError);
      throw new AppError("error-server", 500);
    }

    const activeDealsByOwner = new Map<string, number>();
    for (const deal of deals ?? []) {
      if (!deal.owner_id || deal.stage === "won" || deal.stage === "lost") {
        continue;
      }
      activeDealsByOwner.set(
        deal.owner_id,
        (activeDealsByOwner.get(deal.owner_id) ?? 0) + 1,
      );
    }

    const openThreadsByAssignee = new Map<string, number>();
    for (const thread of threads ?? []) {
      if (!thread.assigned_to) continue;
      openThreadsByAssignee.set(
        thread.assigned_to,
        (openThreadsByAssignee.get(thread.assigned_to) ?? 0) + 1,
      );
    }

    return (profiles ?? []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      email: emailById.get(profile.id) ?? "",
      activeDealsCount: activeDealsByOwner.get(profile.id) ?? 0,
      openConversationsCount: openThreadsByAssignee.get(profile.id) ?? 0,
    }));
  },
};
