import type { User } from "@supabase/supabase-js";
import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfile } from "@/features/auth/types";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error("error-generic");
  }
}

export async function fetchMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/me");
}

export function mapAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "login-error-invalid";
  }
  return "error-generic";
}

export type { User };
