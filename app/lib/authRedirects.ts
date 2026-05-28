import type { AppRole } from "@/lib/constants";

export function getPostLoginPath(role: AppRole | null): string {
  if (role === "client") {
    return "/conversations";
  }
  return "/dashboard";
}

/** Allow only same-origin relative paths (no protocol-relative or external URLs). */
export function sanitizeRedirectPath(redirect: string | null): string | null {
  if (!redirect) return null;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(redirect)) return null;
  return redirect;
}
