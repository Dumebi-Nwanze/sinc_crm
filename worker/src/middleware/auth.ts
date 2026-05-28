import { createMiddleware } from "hono/factory";
import { createSupabaseAdmin } from "../lib/supabaseAdmin";
import { errorResponse } from "../lib/errors";
import type { AppContext, Profile } from "../types";

export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("error-unauthorized", 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return errorResponse("error-unauthorized", 401);
  }

  const supabase = createSupabaseAdmin(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return errorResponse("error-unauthorized", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse("error-unauthorized", 401);
  }

  c.set("userId", user.id);
  c.set("profile", profile as Profile);
  c.set("userEmail", user.email ?? "");
  await next();
});
