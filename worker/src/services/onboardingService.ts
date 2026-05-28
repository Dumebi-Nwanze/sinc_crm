import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { sendEmail } from "../lib/email";
import { inquiryConfirmationEmail, salesRepInviteEmail } from "../lib/emailTemplates";
import { AppError } from "../lib/errors";
import type { Env, Profile } from "../types";

const SYSTEM_CONFIRMATION =
  "Thanks for reaching out. One of our consultants will review your message and be in touch shortly.";

export const onboardingService = {
  async submitInquiry({
    fullName,
    email,
    message,
    env,
  }: {
    fullName: string;
    email: string;
    message: string;
    env: Env;
  }): Promise<{ threadId: string }> {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingClient) {
      throw new AppError("error-inquiry-email-exists", 409);
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        full_name: fullName.trim(),
        email: normalizedEmail,
        profile_id: null,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      if (clientError?.code === "23505") {
        throw new AppError("error-inquiry-email-exists", 409);
      }
      console.error("[submitInquiry] client insert", clientError);
      throw new AppError("error-server", 500);
    }

    const subject =
      message.trim().length > 80
        ? `${message.trim().slice(0, 77)}...`
        : message.trim() || `Inquiry from ${fullName.trim()}`;

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .insert({
        client_id: client.id,
        subject,
        status: "open",
        assigned_to: null,
      })
      .select("id")
      .single();

    if (threadError || !thread) {
      console.error("[submitInquiry] thread insert", threadError);
      throw new AppError("error-server", 500);
    }

    const { error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: thread.id,
        sender_id: env.SYSTEM_ACCOUNT_ID,
        sender_type: "team",
        body: message.trim() || SYSTEM_CONFIRMATION,
      });

    if (messageError) {
      console.error("[submitInquiry] message insert", messageError);
      throw new AppError("error-server", 500);
    }

    await sendEmail({
      to: normalizedEmail,
      subject: "We received your inquiry — SINC",
      html: inquiryConfirmationEmail({ fullName: fullName.trim() }),
      env,
    });

    return { threadId: thread.id };
  },

  async claimClientAccount({
    userId,
    email,
    env,
  }: {
    userId: string;
    email: string;
    env: Env;
  }): Promise<Profile> {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const normalizedEmail = email.trim().toLowerCase();

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, profile_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (clientError) {
      console.error("[claimClientAccount] client lookup", clientError);
      throw new AppError("error-server", 500);
    }

    if (!client) {
      throw new AppError("error-client-not-found", 404);
    }

    if (client.profile_id) {
      throw new AppError("error-client-already-claimed", 409);
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        profile_id: userId,
        invite_link_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (updateError) {
      console.error("[claimClientAccount] client update", updateError);
      throw new AppError("error-server", 500);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[claimClientAccount] profile lookup", profileError);
      throw new AppError("error-server", 500);
    }

    return profile as Profile;
  },

  async inviteTeamMember({
    fullName,
    email,
    env,
  }: {
    fullName: string;
    email: string;
    env: Env;
  }): Promise<{ profileId: string }> {
    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "invite",
        email: normalizedEmail,
        options: {
          data: { full_name: trimmedName },
          redirectTo: `${env.APP_URL}/accept-invite?redirect=/dashboard`,
        },
      });

    if (linkError || !linkData.user?.id) {
      console.error("[inviteTeamMember] generateLink", linkError);
      throw new AppError("error-server", 500);
    }

    const hashedToken = linkData.properties?.hashed_token;
    if (!hashedToken) {
      console.error("[inviteTeamMember] missing hashed_token");
      throw new AppError("error-server", 500);
    }

    const profileId = linkData.user.id;
    const inviteUrl = `${env.APP_URL}/accept-invite?token=${hashedToken}&redirect=/dashboard`;

    // handle_new_user may create a client-role profile; replace with sales role
    // (protect_profile_role blocks service-role UPDATE on role column)
    await supabase.from("profiles").delete().eq("id", profileId);

    const { error: profileError } = await supabase.from("profiles").insert({
      id: profileId,
      full_name: trimmedName,
      role: "sales",
    });

    if (profileError) {
      console.error("[inviteTeamMember] profile upsert", profileError);
      throw new AppError("error-server", 500);
    }

    await sendEmail({
      to: normalizedEmail,
      subject: "You are invited to join SINC CRM",
      html: salesRepInviteEmail({ fullName: trimmedName, inviteUrl }),
      env,
    });

    return { profileId };
  },
};
