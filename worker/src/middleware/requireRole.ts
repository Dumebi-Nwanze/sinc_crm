import { createMiddleware } from "hono/factory";
import { errorResponse } from "../lib/errors";
import type { AppContext, AppRole } from "../types";

export function requireRole(...roles: AppRole[]) {
  return createMiddleware<AppContext>(async (c, next) => {
    const profile = c.get("profile");

    if (!roles.includes(profile.role)) {
      return errorResponse("error-forbidden", 403);
    }

    await next();
  });
}
